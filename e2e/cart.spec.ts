/**
 * Cart E2E Tests
 *
 * Covers: add-to-cart toast/badge, guest-cart persistence, login→merge,
 * quantity optimistic update, remove item, empty-cart state, stock-limit clamp.
 *
 * All cart/favorites/orders API calls are mocked.
 * The real login API is called once in beforeAll to cache tokens.
 *
 * Run: npx playwright test cart
 */

import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const API        = process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:44381';
const USER_EMAIL = process.env.TEST_EMAIL!;
const USER_PASS  = process.env.TEST_PASS!;

let cachedUserToken   = '';
let cachedUserRefresh = '';

// ── helpers ────────────────────────────────────────────────────────────────────

function makeSyntheticToken(originalToken: string, expInSeconds: number): string {
    const [h, p] = originalToken.split('.');
    const b64 = p.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - p.length % 4) % 4);
    const decoded = JSON.parse(Buffer.from(b64, 'base64').toString());
    decoded.exp = Math.floor(Date.now() / 1000) + expInSeconds;
    const newP = Buffer.from(JSON.stringify(decoded)).toString('base64');
    return `${h}.${newP}.FAKE_SIG`;
}

function emptyCartBody() {
    return JSON.stringify({ userId: null, total: 0, items: [] });
}

function cartBody(opts: {
    cartItemId?: string; variantId?: string; name?: string;
    price?: number; quantity?: number; stockQuantity?: number;
    productSlug?: string; variantSlug?: string; userId?: string | null;
} = {}) {
    const {
        cartItemId = 'ci-1', variantId = 'v-1', name = 'Test Variant',
        price = 99.99, quantity = 1, stockQuantity = 5,
        productSlug = 'test-product', variantSlug = 'test-variant',
        userId = null,
    } = opts;
    return JSON.stringify({
        userId, total: price * quantity,
        items: [{ cartItemId, productVariantId: variantId, cartId: 'cart-1',
            quantity, price, total: price * quantity, name,
            brand: null, primaryImageUrl: null,
            productSlug, variantSlug, stockQuantity }],
    });
}

const FAKE_VARIANT = {
    variantId: 'v-1', variantSlug: 'test-variant', productSlug: 'test-product',
    productId: 'p-1', categoryId: 'cat-1', categoryName: 'Electronică',
    productName: 'Test Product', sku: 'SKU-001', name: 'Test Variant',
    brand: null, description: null, price: 99.99, discountedPrice: null,
    stockQuantity: 5, averageRating: null, reviewsCount: 0,
    primaryImageUrl: null, imageUrls: [], attributes: {},
};

const ONE_ITEM_PAGED = JSON.stringify({
    items: [FAKE_VARIANT], totalCount: 1, page: 1, pageSize: 24, totalPages: 1,
});
const EMPTY_PAGED = JSON.stringify({
    items: [], totalCount: 0, page: 1, pageSize: 24, totalPages: 0,
});
const EMPTY_ORDERS = '{"items":[],"totalCount":0,"page":1,"pageSize":50,"totalPages":0}';

// ── one-time login ─────────────────────────────────────────────────────────────

test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const res = await page.request.post(`${API}/api/auth/login`, {
        data: { email: USER_EMAIL, password: USER_PASS },
    });
    expect(res.ok(), `Login failed: ${await res.text()}`).toBeTruthy();
    ({ token: cachedUserToken, refreshToken: cachedUserRefresh } = await res.json());
    await page.close();
});

// ── tests ──────────────────────────────────────────────────────────────────────

test.describe('Cart', () => {

    // C-1 ── Add to cart: toast + badge ────────────────────────────────────────
    test('C-1: clicking add-to-cart shows "Adăugat în coș" toast and increments badge', async ({ page }) => {
        let postCount = 0;

        await page.route(`${API}/api/**`, async route => {
            const url  = route.request().url();
            const method = route.request().method();
            if (url.includes('variants-filtered')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: ONE_ITEM_PAGED });
            } else if (url.includes('/api/cart') && method === 'POST') {
                postCount++;
                await route.fulfill({ status: 200, contentType: 'application/json', body: cartBody() });
            } else if (url.includes('/api/cart')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: emptyCartBody() });
            } else if (url.includes('/api/products')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            } else if (url.includes('/api/categories')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        await page.goto('/produse');
        await page.waitForLoadState('networkidle');

        // The dark-gray cart button is specific to VariantCard (class bg-gray-800)
        const addBtn = page.locator('button[class*="bg-gray-800"]').first();
        await expect(addBtn).toBeVisible();
        await expect(addBtn).toBeEnabled();
        await addBtn.click();

        // Toast must appear
        await expect(page.locator('text=Adăugat în coș').first()).toBeVisible();

        // Cart badge must show 1
        await expect(page.locator('a[href="/cart"] span').first()).toHaveText('1');
        expect(postCount).toBe(1);
    });

    // C-2 ── Guest cart persists across page refresh ────────────────────────────
    test('C-2: guest cart survives page reload (guestSessionId stays in localStorage)', async ({ page }) => {
        const sessionId = 'e2e-session-persist-test';

        await page.addInitScript(({ sid }: { sid: string }) => {
            localStorage.setItem('guestSessionId', sid);
        }, { sid: sessionId });

        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();
            if (url.includes('/api/cart')) {
                await route.fulfill({
                    status: 200, contentType: 'application/json',
                    body: cartBody({ name: 'Persisted Item' }),
                });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        await page.goto('/cart');
        await expect(page.locator('text=Persisted Item')).toBeVisible();

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Mock still returns the same item — it persists because the same sessionId is used
        await expect(page.locator('text=Persisted Item')).toBeVisible();

        // guestSessionId is NOT cleared for guests (only cleared on login-merge)
        const sid = await page.evaluate(() => localStorage.getItem('guestSessionId'));
        expect(sid).toBe(sessionId);
    });

    // C-3 ── Login merges guest cart + clears guestSessionId ───────────────────
    test('C-3: logging in merges guest cart and removes guestSessionId from localStorage', async ({ page }) => {
        const sessionId = 'guest-session-merge-test';
        const token = makeSyntheticToken(cachedUserToken, 3_600);

        await page.addInitScript(({ t, rt, sid }: { t: string; rt: string; sid: string }) => {
            localStorage.setItem('token', t);
            localStorage.setItem('refreshToken', rt);
            localStorage.setItem('guestSessionId', sid);
        }, { t: token, rt: cachedUserRefresh, sid: sessionId });

        let mergeCount = 0;

        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();
            if (url.includes('/api/cart/merge')) {
                mergeCount++;
                await route.fulfill({
                    status: 200, contentType: 'application/json',
                    body: JSON.stringify({
                        userId: 'user-1', total: 199.98,
                        items: [
                            { cartItemId: 'ci-1', productVariantId: 'v-1', cartId: 'c-1',
                              quantity: 1, price: 99.99, total: 99.99, name: 'Guest Item',
                              brand: null, primaryImageUrl: null,
                              productSlug: 'prod-1', variantSlug: 'var-1', stockQuantity: 5 },
                            { cartItemId: 'ci-2', productVariantId: 'v-2', cartId: 'c-1',
                              quantity: 1, price: 99.99, total: 99.99, name: 'Existing Item',
                              brand: null, primaryImageUrl: null,
                              productSlug: 'prod-2', variantSlug: 'var-2', stockQuantity: 3 },
                        ],
                    }),
                });
            } else if (url.includes('/api/favorites/merge')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            } else if (url.includes('/api/cart')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: emptyCartBody() });
            } else if (url.includes('/api/order')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: EMPTY_ORDERS });
            } else if (url.includes('variants-filtered')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: EMPTY_PAGED });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        await page.goto('/');

        // CartContext.finally() removes guestSessionId after merge completes
        await page.waitForFunction(
            () => localStorage.getItem('guestSessionId') === null,
            { timeout: 8_000 },
        );

        expect(mergeCount).toBe(1);
        expect(await page.evaluate(() => localStorage.getItem('guestSessionId'))).toBeNull();

        // Cart badge must show 2 (items from the merge response)
        await expect(page.locator('a[href="/cart"] span').first()).toHaveText('2');
    });

    // C-4 ── Quantity optimistic update ────────────────────────────────────────
    test('C-4: clicking + updates quantity in UI optimistically without page reload', async ({ page }) => {
        const token = makeSyntheticToken(cachedUserToken, 3_600);

        await page.addInitScript(({ t, rt }: { t: string; rt: string }) => {
            localStorage.setItem('token', t);
            localStorage.setItem('refreshToken', rt);
        }, { t: token, rt: cachedUserRefresh });

        await page.route(`${API}/api/**`, async route => {
            const url    = route.request().url();
            const method = route.request().method();
            if (url.includes('/api/cart') && method === 'PUT') {
                await route.fulfill({
                    status: 200, contentType: 'application/json',
                    body: cartBody({ quantity: 2, userId: 'u-1' }),
                });
            } else if (url.includes('/api/cart')) {
                await route.fulfill({
                    status: 200, contentType: 'application/json',
                    body: cartBody({ quantity: 1, userId: 'u-1' }),
                });
            } else if (url.includes('/api/order')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: EMPTY_ORDERS });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        await page.goto('/cart');

        // Quantity starts at 1
        const qtySpan = page.locator('.w-6.text-center').first();
        await expect(qtySpan).toHaveText('1');

        // Track navigations to confirm no page reload happens
        let navigationCount = 0;
        page.on('framenavigated', frame => {
            if (frame === page.mainFrame()) navigationCount++;
        });

        // Click "+" — the last button in the quantity-control div
        // Structure: <div class="flex items-center gap-2"> <Minus /> <span qty /> <Plus /> </div>
        const qtyControl = page.locator('.flex.items-center.gap-2').first();
        await qtyControl.locator('button').last().click();

        // Quantity changes to 2 optimistically (setItems fires before PUT returns)
        await expect(qtySpan).toHaveText('2');

        // No page reload occurred
        expect(navigationCount).toBe(0);
    });

    // C-5 ── Remove item disappears immediately ─────────────────────────────────
    test('C-5: clicking trash removes item from cart without page reload', async ({ page }) => {
        const token = makeSyntheticToken(cachedUserToken, 3_600);

        await page.addInitScript(({ t, rt }: { t: string; rt: string }) => {
            localStorage.setItem('token', t);
            localStorage.setItem('refreshToken', rt);
        }, { t: token, rt: cachedUserRefresh });

        await page.route(`${API}/api/**`, async route => {
            const url    = route.request().url();
            const method = route.request().method();
            if (url.includes('/api/cart') && method === 'DELETE' && url.includes('ci-1')) {
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: emptyCartBody(),
                });
            } else if (url.includes('/api/cart')) {
                await route.fulfill({
                    status: 200, contentType: 'application/json',
                    body: cartBody({ name: 'Remove Me', userId: 'u-1' }),
                });
            } else if (url.includes('/api/order')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: EMPTY_ORDERS });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        await page.goto('/cart');
        await expect(page.locator('text=Remove Me')).toBeVisible();

        await page.getByRole('button', { name: 'Elimină' }).click();

        await expect(page.locator('text=Remove Me')).not.toBeVisible();
        await expect(page.locator('text=Coșul tău e gol')).toBeVisible();
    });

    // C-6 ── Empty cart shows empty state with link ────────────────────────────
    test('C-6: empty cart shows empty state and link to /produse', async ({ page }) => {
        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();
            if (url.includes('/api/cart')) {
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: emptyCartBody(),
                });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        await page.goto('/cart');

        await expect(page.locator('text=Coșul tău e gol')).toBeVisible();
        const exploreLink = page.getByRole('link', { name: 'Explorează produse' });
        await expect(exploreLink).toBeVisible();
        await expect(exploreLink).toHaveAttribute('href', '/produse');
    });

    // C-7 ── Quantity "+" disabled at stock limit ───────────────────────────────
    test('C-7: quantity + button is disabled when quantity equals stockQuantity', async ({ page }) => {
        const token = makeSyntheticToken(cachedUserToken, 3_600);

        await page.addInitScript(({ t, rt }: { t: string; rt: string }) => {
            localStorage.setItem('token', t);
            localStorage.setItem('refreshToken', rt);
        }, { t: token, rt: cachedUserRefresh });

        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();
            if (url.includes('/api/cart')) {
                // quantity == stockQuantity (3 == 3) → + must be disabled
                await route.fulfill({
                    status: 200, contentType: 'application/json',
                    body: cartBody({ quantity: 3, stockQuantity: 3, userId: 'u-1' }),
                });
            } else if (url.includes('/api/order')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: EMPTY_ORDERS });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        await page.goto('/cart');
        await expect(page.locator('.w-6.text-center').first()).toHaveText('3');

        // Cart page: <div class="flex items-center gap-2"> <Minus> <span qty> <Plus> </div>
        const qtyControl = page.locator('.flex.items-center.gap-2').first();
        const plusBtn  = qtyControl.locator('button').last();
        const minusBtn = qtyControl.locator('button').first();

        // + disabled because qty >= stockQuantity
        await expect(plusBtn).toBeDisabled();
        // - enabled because qty > 1
        await expect(minusBtn).toBeEnabled();
    });
});
