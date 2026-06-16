/**
 * Token Refresh E2E Tests
 *
 * Prerequisites:
 *   1. npm run dev            (Next.js on http://localhost:3000)
 *   2. .NET API running       (https://localhost:44381)
 *   3. Copy .env.test.example → .env.test and fill in credentials
 *
 * Run all:   npx playwright test
 * Run one:   npx playwright test --grep "test 3"
 * With UI:   npx playwright test --ui
 */

import { test, expect, type Page } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const API         = process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:44381';
const USER_EMAIL  = process.env.TEST_EMAIL!;
const USER_PASS   = process.env.TEST_PASS!;
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? USER_EMAIL;
const ADMIN_PASS  = process.env.TEST_ADMIN_PASS  ?? USER_PASS;

// ── cached credentials (populated once in beforeAll) ──────────────────────────
// Logging in per-test would exhaust the 10/min rate limiter within the suite.
let cachedUserToken    = '';
let cachedUserRefresh  = '';
let cachedAdminToken   = '';
let cachedAdminRefresh = '';

// ── shared helpers ────────────────────────────────────────────────────────────

/** Decode a base64url JWT segment safely in the browser. */
const decodePayload = `(p) => {
    const b64 = p.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + (4 - b64.length % 4) % 4, '=');
    return JSON.parse(atob(padded));
}`;

/**
 * Build a JWT whose payload has a tampered exp claim.
 * The signature is intentionally fake — the frontend never verifies it,
 * only the payload is read. This avoids touching the real refresh endpoint
 * (and therefore the rate limiter) in tests that don't need it.
 */
function makeSyntheticToken(originalToken: string, expInSeconds: number): string {
    const [h, p] = originalToken.split('.');
    // Restore standard base64 padding so Buffer can decode it
    const b64 = p.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - p.length % 4) % 4);
    const decoded = JSON.parse(Buffer.from(b64, 'base64').toString());
    decoded.exp = Math.floor(Date.now() / 1000) + expInSeconds;
    // Keep as standard base64 (NOT base64url) so the browser's atob() in
    // AuthContext.parseToken / msUntilExpiry can decode it without conversion.
    const newP = Buffer.from(JSON.stringify(decoded)).toString('base64');
    return `${h}.${newP}.FAKE_SIG`;
}

/**
 * Write pre-fetched tokens into localStorage.
 * Much cheaper than calling the login API (avoids rate-limiting).
 */
async function setStoredTokens(page: Page, token: string, refreshToken: string) {
    await page.goto('/');
    await page.evaluate(
        ([t, rt]) => {
            localStorage.setItem('token', t);
            localStorage.setItem('refreshToken', rt);
        },
        [token, refreshToken] as [string, string],
    );
    return { token, refreshToken };
}

/**
 * Intercept /api/auth/refresh on this page and respond with a synthetic new
 * access token. Returns a getter for the intercept count.
 * Use this in any test that needs to trigger a refresh but does NOT need to
 * verify the real server endpoint (test 3 uses route.continue() instead).
 */
async function mockRefreshEndpoint(page: Page, originalToken: string): Promise<() => number> {
    let count = 0;
    await page.route(`${API}/api/auth/refresh`, async route => {
        count++;
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                token: makeSyntheticToken(originalToken, 3_600),
                refreshToken: 'test-refresh-token',
            }),
        });
    });
    return () => count;
}

/** Tamper the stored JWT's exp claim to 10 minutes in the past. */
async function expireToken(page: Page) {
    await page.evaluate((decodePayload) => {
        const decode = eval(decodePayload) as (p: string) => Record<string, unknown>;
        const tok = localStorage.getItem('token') ?? '';
        const [h, p, s] = tok.split('.');
        const payload = decode(p);
        payload.exp = Math.floor(Date.now() / 1000) - 600;
        const newP = btoa(JSON.stringify(payload))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        localStorage.setItem('token', `${h}.${newP}.${s}`);
    }, decodePayload);
}

/** Set the JWT's exp to `secs` seconds from now. */
async function setTokenExpiresIn(page: Page, secs: number) {
    await page.evaluate(([decodePayload, secs]) => {
        const decode = eval(decodePayload) as (p: string) => Record<string, unknown>;
        const tok = localStorage.getItem('token') ?? '';
        const [h, p, s] = tok.split('.');
        const payload = decode(p);
        payload.exp = Math.floor(Date.now() / 1000) + Number(secs);
        // Use standard base64 (NOT base64url) so AuthContext's raw atob() call
        // in msUntilExpiry / parseToken can decode the payload without throwing.
        const newP = btoa(JSON.stringify(payload));
        localStorage.setItem('token', `${h}.${newP}.${s}`);
    }, [decodePayload, secs] as [string, number]);
}

const UNAUTHORIZED = {
    status: 401,
    contentType: 'application/json',
    body: '{"message":"Unauthorized"}',
};

// ── one-time login ─────────────────────────────────────────────────────────────

test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    const userRes = await page.request.post(`${API}/api/auth/login`, {
        data: { email: USER_EMAIL, password: USER_PASS },
    });
    expect(userRes.ok(), `Initial user login failed: ${await userRes.text()}`).toBeTruthy();
    ({ token: cachedUserToken, refreshToken: cachedUserRefresh } = await userRes.json());

    if (ADMIN_EMAIL !== USER_EMAIL) {
        const adminRes = await page.request.post(`${API}/api/auth/login`, {
            data: { email: ADMIN_EMAIL, password: ADMIN_PASS },
        });
        expect(adminRes.ok(), `Initial admin login failed: ${await adminRes.text()}`).toBeTruthy();
        ({ token: cachedAdminToken, refreshToken: cachedAdminRefresh } = await adminRes.json());
    } else {
        cachedAdminToken  = cachedUserToken;
        cachedAdminRefresh = cachedUserRefresh;
    }

    await page.close();
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Token refresh flows', () => {

    // 1 ── Proactive timer ─────────────────────────────────────────────────────
    test('1 — proactive refresh fires ~60 s before token expires', async ({ page }) => {
        // Build the short-lived token in Node.js (guaranteed standard base64).
        const shortToken = makeSyntheticToken(cachedUserToken, 65);

        // Seed localStorage BEFORE any page script runs so init() sees the
        // short-lived token on the very first navigation — no reload needed.
        await page.addInitScript(
            ({ t, rt }) => {
                localStorage.setItem('token', t);
                localStorage.setItem('refreshToken', rt);
            },
            { t: shortToken, rt: cachedUserRefresh },
        );

        // Single catch-all: inline refresh mock (count++) + correct empty
        // responses for each endpoint shape so no React component crashes:
        //   • /api/products* → PagedResult  (HomeContent.getVariantsFiltered)
        //   • /api/order*    → PagedResult  (UnpaidOrderBanner.getOrders)
        //   • everything else → []          (FavoritesContext, CartContext, …)
        let refreshCount = 0;
        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();
            if (url.includes('/auth/refresh')) {
                refreshCount++;
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        token: makeSyntheticToken(cachedUserToken, 3_600),
                        refreshToken: 'test-refresh-token',
                    }),
                });
            } else if (url.includes('/api/products')) {
                await route.fulfill({ status: 200, contentType: 'application/json',
                    body: '{"items":[],"totalCount":0,"page":1,"pageSize":24,"totalPages":0}' });
            } else if (url.includes('/api/order')) {
                await route.fulfill({ status: 200, contentType: 'application/json',
                    body: '{"items":[],"totalCount":0,"page":1,"pageSize":50,"totalPages":0}' });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });
        const getRefreshCount = () => refreshCount;

        // Navigate once — routes are active and localStorage is already seeded.
        // init() reads shortToken (exp ≈ now+65 s) → scheduleRefresh fires in ~5 s.
        await page.goto('/');

        await page.waitForTimeout(8_000);

        expect(getRefreshCount()).toBe(1);

        // The synthetic token written by the mock must have a future exp
        const expAfter = await page.evaluate((decodePayload) => {
            const decode = eval(decodePayload) as (p: string) => Record<string, unknown>;
            const tok = localStorage.getItem('token') ?? '';
            const p = tok.split('.')[1];
            return (decode(p).exp as number);
        }, decodePayload);
        expect(expAfter).toBeGreaterThan(Math.floor(Date.now() / 1000) + 30);
    });

    // 2 ── authFetch silent retry on 401 ──────────────────────────────────────
    test('2 — expired access token: authFetch retries silently, page loads normally', async ({ page }) => {
        await setStoredTokens(page, cachedUserToken, cachedUserRefresh);

        // Catch-all registered FIRST (lower Playwright priority).
        // First request to each unique URL → 401 (triggers authFetch refresh).
        // Subsequent requests → mocked 200 (prevents cascade: the synthetic
        // token has FAKE_SIG so the real server would 401 again, causing an
        // infinite refresh loop if we called route.continue() here).
        // /api/auth/refresh is handled by the mock below (higher priority) and
        // never reaches this handler.
        let orderCallCount = 0;
        const alreadyFailed = new Set<string>();
        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();
            if (/\/api\/order(\?|$)/.test(url)) orderCallCount++;

            if (!alreadyFailed.has(url)) {
                alreadyFailed.add(url);
                await route.fulfill(UNAUTHORIZED);
            } else {
                const body = /\/api\/order(\?|$)/.test(url)
                    ? '{"items":[],"totalCount":0,"page":1,"pageSize":10,"totalPages":1}'
                    : '[]';
                await route.fulfill({ status: 200, contentType: 'application/json', body });
            }
        });

        // Registered LAST → highest priority: intercepts /api/auth/refresh
        // before the catch-all can.
        const getRefreshCount = await mockRefreshEndpoint(page, cachedUserToken);

        await page.goto('/comenzi');
        await page.waitForLoadState('networkidle');

        expect(page.url()).not.toContain('/auth/login');
        expect(getRefreshCount()).toBe(1);
        // ≥2: at minimum the ComenziPage and UnpaidOrderBanner order calls each
        // get counted; retries and StrictMode re-runs may add more.
        expect(orderCallCount).toBeGreaterThanOrEqual(2);
    });

    // 3 ── Refresh dedup across parallel requests ──────────────────────────────
    test('3 — multiple simultaneous 401s trigger exactly one /api/auth/refresh call', async ({ page }) => {
        await setStoredTokens(page, cachedAdminToken, cachedAdminRefresh);

        const alreadyFailed = new Set<string>();
        let refreshCount = 0;

        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();

            if (url.includes('/auth/refresh')) {
                refreshCount++;
                await route.continue();
                return;
            }

            if (!alreadyFailed.has(url)) {
                alreadyFailed.add(url);
                await route.fulfill(UNAUTHORIZED);
            } else {
                await route.continue();
            }
        });

        await page.goto('/admin');
        await page.waitForLoadState('networkidle');

        expect(refreshCount).toBe(1);
    });

    // 4 ── AuthContext stays in sync after authFetch-triggered refresh ──────────
    test('4 — navbar stays logged-in and scheduleRefresh re-arms after silent retry', async ({ page }) => {
        const { token: originalToken } = await setStoredTokens(page, cachedUserToken, cachedUserRefresh);

        // Same ordering as test 2: catch-all first (lower Playwright priority),
        // refresh mock last (highest priority).  alreadyFailed persists across
        // the reload in phase 2 so component calls with the tampered synthetic
        // token are satisfied by mocked 200 and don't cascade into extra refreshes.
        const alreadyFailed = new Set<string>();
        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();
            if (!alreadyFailed.has(url)) {
                alreadyFailed.add(url);
                await route.fulfill(UNAUTHORIZED);
            } else {
                const body = /\/api\/order(\?|$)/.test(url)
                    ? '{"items":[],"totalCount":0,"page":1,"pageSize":10,"totalPages":1}'
                    : '[]';
                await route.fulfill({ status: 200, contentType: 'application/json', body });
            }
        });

        // Registered LAST → highest priority for /api/auth/refresh.
        const getRefreshCount = await mockRefreshEndpoint(page, cachedUserToken);

        await page.goto('/comenzi');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('a[href="/auth/login"]')).toHaveCount(0);

        const tokenAfter = await page.evaluate(() => localStorage.getItem('token'));
        expect(tokenAfter).not.toBe(originalToken);
        expect(tokenAfter).not.toBeNull();

        // scheduleRefresh must have re-armed: set exp to 65 s → timer fires in ~5 s.
        // The alreadyFailed set above already covers all URLs from the /comenzi
        // page, so phase-2 component calls return mocked 200 and don't inflate count.
        await setTokenExpiresIn(page, 65);
        await page.reload();
        await page.waitForTimeout(8_000);

        expect(getRefreshCount()).toBe(2);
    });

    // 5 ── Expired refresh token → redirect to /auth/login ────────────────────
    test('5 — invalid refresh token clears storage and redirects to /auth/login', async ({ page }) => {
        await setStoredTokens(page, cachedUserToken, cachedUserRefresh);
        await expireToken(page);

        // Force all refresh attempts to fail (already a mock — no real endpoint hit)
        await page.route(`${API}/api/auth/refresh`, route =>
            route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: '{"message":"Token invalid sau expirat."}',
            }),
        );

        await page.goto('/comenzi');
        await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });

        expect(page.url()).toContain('/auth/login');
        expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
        expect(await page.evaluate(() => localStorage.getItem('refreshToken'))).toBeNull();
    });

    // 6a ── Blob response (downloadInvoice) survives 401 + retry ─────────────
    test('6a — downloadInvoice retries after 401 and the PDF download starts', async ({ page }) => {
        await setStoredTokens(page, cachedUserToken, cachedUserRefresh);

        const fakeOrderId = '00000000-0000-0000-0000-000000000099';

        await page.route(`${API}/api/order?*`, route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    items: [{
                        orderId: fakeOrderId,
                        status: 'Delivered',
                        isPaid: true,
                        isB2B: true,
                        totalAmount: 500,
                        amountDue: 500,
                        discountAmount: 0,
                        giftCardDeduction: 0,
                        netAmount: 420.17,
                        vatAmount: 79.83,
                        vatRate: 0.19,
                        createdAt: new Date().toISOString(),
                        paymentMethod: 'NetPayment',
                        invoiceNumber: 'INV-2026-0001',
                        invoiceDate: new Date().toISOString(),
                        items: [],
                        shippingAddress: {
                            fullName: 'Test User', phoneNumber: '0700000000',
                            addressLine1: 'Str. Test 1', city: 'București',
                            region: 'Sector 1', postalCode: '010000', countryCode: 'RO',
                        },
                    }],
                    totalCount: 1, page: 1, pageSize: 10, totalPages: 1,
                }),
            }),
        );

        let invoiceCallCount = 0;
        await page.route(`${API}/api/order/${fakeOrderId}/invoice`, async route => {
            invoiceCallCount++;
            if (invoiceCallCount === 1) {
                await route.fulfill(UNAUTHORIZED);
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/pdf',
                    headers: {
                        'Content-Disposition':
                            `attachment; filename="factura-${fakeOrderId.slice(0, 8).toUpperCase()}.pdf"`,
                    },
                    body: Buffer.from('%PDF-1.4 fake-pdf-content'),
                });
            }
        });

        await mockRefreshEndpoint(page, cachedUserToken);

        await page.goto('/comenzi');
        await page.waitForLoadState('networkidle');

        const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 10_000 }),
            page.locator('button:has-text("Descarcă")').first().click(),
        ]);

        expect(download).toBeTruthy();
        expect(download.suggestedFilename()).toMatch(/factura/i);
        expect(invoiceCallCount).toBe(2);
    });

    // 6b ── FormData body (adminUploadImage) survives 401 + retry ─────────────
    test('6b — adminUploadImage FormData body retries after 401 and upload succeeds', async ({ page }) => {
        await setStoredTokens(page, cachedAdminToken, cachedAdminRefresh);

        let uploadCallCount = 0;
        await page.route(`${API}/api/images/upload`, async route => {
            uploadCallCount++;
            if (uploadCallCount === 1) {
                await route.fulfill(UNAUTHORIZED);
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ url: `${API}/uploads/test-image.jpg` }),
                });
            }
        });

        // Seed one section so the file <input> is rendered immediately on load.
        await page.route(`${API}/api/settings/about-page`, route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    title: 'Test', subtitle: '',
                    sections: [{ heading: 'Secțiune test', content: 'Conținut test' }],
                }),
            }),
        );

        await mockRefreshEndpoint(page, cachedAdminToken);

        await page.goto('/admin/despre-noi');
        await page.waitForLoadState('networkidle');

        const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
        await fileInput.setInputFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                'base64',
            ),
        });

        await page.waitForTimeout(3_000);

        expect(uploadCallCount).toBe(2);
    });

    // 7 ── adminGetVariants pagination + mid-loop token refresh ────────────────
    test('7 — adminGetVariants reads refreshed token mid-pagination, all pages load', async ({ page }) => {
        await setStoredTokens(page, cachedAdminToken, cachedAdminRefresh);

        const makeVariant = (i: number) => ({
            variantId: `var-${i}`, productId: 'prod-1',
            sku: `SKU-${i}`, name: `Variant ${i}`, price: 10,
            discountedPrice: null, quantity: 5, isActive: true,
            brand: 'Brand', description: '', slug: `variant-${i}`,
            productSlug: 'product-1', variantAttributes: [], imageUrls: [],
        });

        let page2Calls = 0;
        const getRefreshCount = await mockRefreshEndpoint(page, cachedAdminToken);

        await page.route(`${API}/api/variants?*`, async route => {
            const pg = new URL(route.request().url()).searchParams.get('page') ?? '1';

            if (pg === '1') {
                await route.fulfill({
                    status: 200, contentType: 'application/json',
                    body: JSON.stringify({
                        items: Array.from({ length: 100 }, (_, i) => makeVariant(i)),
                        totalCount: 201, page: 1, pageSize: 100, totalPages: 3,
                    }),
                });
            } else if (pg === '2') {
                page2Calls++;
                if (page2Calls === 1) {
                    await route.fulfill(UNAUTHORIZED);
                } else {
                    await route.fulfill({
                        status: 200, contentType: 'application/json',
                        body: JSON.stringify({
                            items: Array.from({ length: 100 }, (_, i) => makeVariant(100 + i)),
                            totalCount: 201, page: 2, pageSize: 100, totalPages: 3,
                        }),
                    });
                }
            } else {
                await route.fulfill({
                    status: 200, contentType: 'application/json',
                    body: JSON.stringify({
                        items: [makeVariant(200)],
                        totalCount: 201, page: 3, pageSize: 100, totalPages: 3,
                    }),
                });
            }
        });

        await page.goto('/admin/variante');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3_000);

        // At least 2: the initial 401 + 1 successful retry.
        // React StrictMode double-mount and token-change useEffect re-runs can add more.
        expect(page2Calls).toBeGreaterThanOrEqual(2);
        // Exactly one refresh despite multiple page-2 retries
        expect(getRefreshCount()).toBe(1);
        await expect(page.locator('text="Failed to fetch variants"')).toHaveCount(0);
    });

    // 8 ── Two-tab refresh race, both tabs survive ─────────────────────────────
    test('8 — concurrent refresh from two tabs: both remain logged in', async ({ browser }) => {
        const ctx = await browser.newContext({
            ignoreHTTPSErrors: true,
            baseURL: 'http://localhost:3000',
        });

        try {
            const page1 = await ctx.newPage();
            const page2 = await ctx.newPage();

            // Write tokens via page1; page2 shares the same localStorage (same context + origin)
            await page1.goto('/');
            await page1.evaluate(
                ([t, rt]) => {
                    localStorage.setItem('token', t);
                    localStorage.setItem('refreshToken', rt);
                },
                [cachedUserToken, cachedUserRefresh] as [string, string],
            );

            await expireToken(page1);

            let refreshCount = 0;
            for (const p of [page1, page2]) {
                await p.route(`${API}/api/auth/refresh`, async route => {
                    refreshCount++;
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            token: makeSyntheticToken(cachedUserToken, 3_600),
                            refreshToken: 'test-refresh-token',
                        }),
                    });
                });
            }

            await Promise.all([
                page1.goto('/comenzi'),
                page2.goto('/comenzi'),
            ]);
            await Promise.all([
                page1.waitForLoadState('networkidle'),
                page2.waitForLoadState('networkidle'),
            ]);

            expect(page1.url()).not.toContain('/auth/login');
            expect(page2.url()).not.toContain('/auth/login');
            expect(refreshCount).toBeGreaterThanOrEqual(1);
        } finally {
            await ctx.close();
        }
    });

    // 9 ── Timer no-op when refreshToken is absent ────────────────────────────
    test('9 — proactive timer exits early when refreshToken is absent', async ({ page }) => {
        // Seed only the access token — no refresh token in storage.
        const shortToken = makeSyntheticToken(cachedUserToken, 65);
        await page.addInitScript(
            ({ t }: { t: string }) => { localStorage.setItem('token', t); },
            { t: shortToken },
        );

        let refreshCount = 0;
        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();
            if (url.includes('/auth/refresh')) {
                refreshCount++;
                await route.fulfill({ status: 200, contentType: 'application/json',
                    body: JSON.stringify({ token: makeSyntheticToken(cachedUserToken, 3_600), refreshToken: 'test-refresh-token' }) });
            } else if (url.includes('/api/products')) {
                await route.fulfill({ status: 200, contentType: 'application/json',
                    body: '{"items":[],"totalCount":0,"page":1,"pageSize":24,"totalPages":0}' });
            } else if (url.includes('/api/order')) {
                await route.fulfill({ status: 200, contentType: 'application/json',
                    body: '{"items":[],"totalCount":0,"page":1,"pageSize":50,"totalPages":0}' });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        await page.goto('/');
        await page.waitForTimeout(8_000);

        // scheduleRefresh timer fires at ~5 s but localStorage.getItem("refreshToken")
        // returns null → the callback returns early without calling apiRefresh.
        expect(refreshCount).toBe(0);

        // Token was never replaced (no applyAuth) and was never cleared (no clearAuth).
        const storedToken = await page.evaluate(() => localStorage.getItem('token'));
        expect(storedToken).toBe(shortToken);
    });

    // 10 ── Timer survives a full page navigation ──────────────────────────────
    test('10 — proactive timer fires even after navigating to a new page', async ({ page }) => {
        const shortToken = makeSyntheticToken(cachedUserToken, 65);
        await page.addInitScript(
            ({ t, rt }) => {
                localStorage.setItem('token', t);
                localStorage.setItem('refreshToken', rt);
            },
            { t: shortToken, rt: cachedUserRefresh },
        );

        let refreshCount = 0;
        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();
            if (url.includes('/auth/refresh')) {
                refreshCount++;
                await route.fulfill({ status: 200, contentType: 'application/json',
                    body: JSON.stringify({ token: makeSyntheticToken(cachedUserToken, 3_600), refreshToken: 'test-refresh-token' }) });
            } else if (url.includes('/api/products')) {
                await route.fulfill({ status: 200, contentType: 'application/json',
                    body: '{"items":[],"totalCount":0,"page":1,"pageSize":24,"totalPages":0}' });
            } else if (url.includes('/api/order')) {
                await route.fulfill({ status: 200, contentType: 'application/json',
                    body: '{"items":[],"totalCount":0,"page":1,"pageSize":10,"totalPages":0}' });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        // First navigation — AuthProvider mounts, scheduleRefresh sets timer (~5 s).
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Full navigation to /comenzi: AuthProvider remounts, init() re-reads
        // localStorage, remaining ≈ 63 s → new timer at ~3 s.
        await page.goto('/comenzi');

        // Give the re-armed timer enough time to fire.
        await page.waitForTimeout(5_000);

        expect(refreshCount).toBe(1);
        const tokenAfter = await page.evaluate(() => localStorage.getItem('token'));
        expect(tokenAfter).not.toBe(shortToken); // replaced by mock's syntheticToken
        expect(tokenAfter).not.toBeNull();
    });

    // 11 ── Proactive refresh failure → clearAuth (no redirect) ───────────────
    test('11 — proactive refresh failure clears auth without redirecting', async ({ page }) => {
        // Use a refresh token the mock will reject so that apiRefresh throws
        // and the scheduleRefresh catch block calls clearAuth().
        const shortToken = makeSyntheticToken(cachedUserToken, 65);
        await page.addInitScript(
            ({ t, rt }) => {
                localStorage.setItem('token', t);
                localStorage.setItem('refreshToken', rt);
            },
            { t: shortToken, rt: 'stale-refresh-token' },
        );

        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();
            if (url.includes('/auth/refresh')) {
                // 401 causes apiRefresh to throw → scheduleRefresh catch → clearAuth()
                await route.fulfill({ status: 401, contentType: 'application/json',
                    body: '{"message":"Refresh token invalid or expired."}' });
            } else if (url.includes('/api/products')) {
                await route.fulfill({ status: 200, contentType: 'application/json',
                    body: '{"items":[],"totalCount":0,"page":1,"pageSize":24,"totalPages":0}' });
            } else if (url.includes('/api/order')) {
                await route.fulfill({ status: 200, contentType: 'application/json',
                    body: '{"items":[],"totalCount":0,"page":1,"pageSize":50,"totalPages":0}' });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        await page.goto('/');
        await page.waitForTimeout(8_000);

        // Timer fired → refresh rejected (401) → apiRefresh threw → catch { clearAuth() }
        // clearAuth removes tokens but does NOT redirect (that only happens via handleSessionExpired
        // in lib/api/http.ts, which is the authFetch path — not the proactive-timer path).
        expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
        expect(await page.evaluate(() => localStorage.getItem('refreshToken'))).toBeNull();
        expect(page.url()).not.toContain('/auth/login');
    });
});
