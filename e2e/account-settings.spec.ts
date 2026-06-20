/**
 * Account Settings E2E Tests
 *
 * Covers:
 *   AS-1: delete account blocked when user has active orders
 *   AS-2: Google-authenticated user sees no password-reset section
 *   AS-3: non-Google user sees the password-reset section
 *   AS-4: profile update (name change) shows success message
 *   AS-5: profile update API error is surfaced to the user
 *   AS-6: unauthenticated access to /profil/settings redirects to /auth/login
 *
 * All backend calls are mocked; the real login API is used once in beforeAll.
 *
 * Run: npx playwright test account-settings
 */

import { test, expect, type Page } from '@playwright/test';
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

const EMPTY_CART   = JSON.stringify({ userId: 'u-1', total: 0, items: [] });
const EMPTY_ORDERS = '{"items":[],"totalCount":0,"page":1,"pageSize":50,"totalPages":0}';

interface ProfileShape {
    firstName: string | null;
    lastName: string | null;
    email: string;
    isGoogleUser: boolean;
}

/**
 * Register standard mocks for the /profil/settings page:
 *   - GET /api/users/me → profileData
 *   - cart, orders, favorites → empty
 * Returns a helper to override PUT/DELETE behaviour per test.
 */
async function mockSettingsPage(
    page: Page,
    profile: ProfileShape,
    extraHandler?: (url: string, method: string) => Promise<{ status: number; body: string } | null>,
) {
    await page.route(`${API}/api/**`, async route => {
        const url    = route.request().url();
        const method = route.request().method();

        // Allow the caller to intercept specific requests first
        if (extraHandler) {
            const override = await extraHandler(url, method);
            if (override) {
                await route.fulfill({
                    status: override.status,
                    contentType: 'application/json',
                    body: override.body,
                });
                return;
            }
        }

        if (url.includes('/api/users/me') && method === 'GET') {
            await route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify(profile),
            });
        } else if (url.includes('/api/cart')) {
            await route.fulfill({ status: 200, contentType: 'application/json', body: EMPTY_CART });
        } else if (url.includes('/api/order')) {
            await route.fulfill({ status: 200, contentType: 'application/json', body: EMPTY_ORDERS });
        } else {
            await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
    });
}

/** Navigate to /profil/settings with a valid synthetic token pre-seeded. */
async function goToSettings(page: Page, token: string, refreshToken: string) {
    await page.addInitScript(({ t, rt }: { t: string; rt: string }) => {
        localStorage.setItem('token', t);
        localStorage.setItem('refreshToken', rt);
    }, { t: token, rt: refreshToken });

    await page.goto('/profil/settings');
    await page.waitForLoadState('networkidle');
}

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

test.describe('Account settings', () => {

    // AS-1 ── Delete account blocked by active orders ──────────────────────────
    test('AS-1: deleting account with active orders shows the server error and stays on the page', async ({ page }) => {
        const token = makeSyntheticToken(cachedUserToken, 3_600);
        const profile: ProfileShape = {
            firstName: 'Ion', lastName: 'Popescu',
            email: 'ion@example.com', isGoogleUser: false,
        };

        await mockSettingsPage(page, profile, async (url, method) => {
            if (url.includes('/api/users/me') && method === 'DELETE') {
                return {
                    status: 400,
                    body: JSON.stringify({ message: 'Nu poți șterge contul dacă ai comenzi active.' }),
                };
            }
            return null;
        });

        await goToSettings(page, token, cachedUserRefresh);

        // Two-step confirm: first click shows the confirmation buttons
        await page.getByRole('button', { name: 'Șterge contul' }).click();
        await page.getByRole('button', { name: 'Da, șterge contul' }).click();

        // Error message from the API must be shown
        await expect(page.locator('text=Nu poți șterge contul dacă ai comenzi active.')).toBeVisible();

        // URL must not have changed (still on /profil/settings)
        expect(page.url()).toContain('/profil/settings');

        // The confirmation dialog is reset (first-step "Șterge contul" button visible again)
        await expect(page.getByRole('button', { name: 'Șterge contul' })).toBeVisible();
    });

    // AS-2 ── Google user: no password-reset section ───────────────────────────
    test('AS-2: Google-authenticated user does not see the password-reset section', async ({ page }) => {
        const token = makeSyntheticToken(cachedUserToken, 3_600);
        const profile: ProfileShape = {
            firstName: 'Ion', lastName: 'Popescu',
            email: 'ion@gmail.com', isGoogleUser: true,
        };

        await mockSettingsPage(page, profile);
        await goToSettings(page, token, cachedUserRefresh);

        // The "Schimbă parola" heading must NOT be present
        await expect(page.locator('h2:has-text("Schimbă parola")')).not.toBeVisible();

        // The Google-account notice must be shown instead
        await expect(
            page.locator('text=Contul tău este autentificat prin Google'),
        ).toBeVisible();

        // "Informații personale" and "Șterge contul" must still be present
        await expect(page.locator('h2:has-text("Informații personale")')).toBeVisible();
        await expect(page.locator('h2:has-text("Șterge contul")')).toBeVisible();
    });

    // AS-3 ── Non-Google user: password-reset section visible ──────────────────
    test('AS-3: non-Google user sees the password-reset section', async ({ page }) => {
        const token = makeSyntheticToken(cachedUserToken, 3_600);
        const profile: ProfileShape = {
            firstName: 'Ion', lastName: 'Popescu',
            email: 'ion@example.com', isGoogleUser: false,
        };

        await mockSettingsPage(page, profile);
        await goToSettings(page, token, cachedUserRefresh);

        await expect(page.locator('h2:has-text("Schimbă parola")')).toBeVisible();
        await expect(
            page.locator('text=Contul tău este autentificat prin Google'),
        ).not.toBeVisible();
    });

    // AS-4 ── Profile update shows success message ─────────────────────────────
    test('AS-4: saving a new name shows "Profil actualizat cu succes."', async ({ page }) => {
        const token = makeSyntheticToken(cachedUserToken, 3_600);
        const profile: ProfileShape = {
            firstName: 'Ion', lastName: 'Popescu',
            email: 'ion@example.com', isGoogleUser: false,
        };

        await mockSettingsPage(page, profile, async (url, method) => {
            if (url.includes('/api/users/me') && method === 'PUT') {
                return { status: 200, body: '{}' };
            }
            return null;
        });

        await goToSettings(page, token, cachedUserRefresh);

        // Change first name
        const firstNameInput = page.getByLabel('Prenume');
        await firstNameInput.fill('Alexandru');

        // Submit
        await page.getByRole('button', { name: 'Salvează' }).click();

        // Success feedback
        await expect(page.locator('text=Profil actualizat cu succes.')).toBeVisible();
    });

    // AS-5 ── Profile update API error is shown ────────────────────────────────
    test('AS-5: profile update API error is displayed to the user', async ({ page }) => {
        const token = makeSyntheticToken(cachedUserToken, 3_600);
        const profile: ProfileShape = {
            firstName: 'Ion', lastName: 'Popescu',
            email: 'ion@example.com', isGoogleUser: false,
        };

        await mockSettingsPage(page, profile, async (url, method) => {
            if (url.includes('/api/users/me') && method === 'PUT') {
                return {
                    status: 400,
                    body: JSON.stringify({ message: 'Prenumele nu poate fi gol.' }),
                };
            }
            return null;
        });

        await goToSettings(page, token, cachedUserRefresh);

        // Clear first name and save
        const firstNameInput = page.getByLabel('Prenume');
        await firstNameInput.clear();
        await page.getByRole('button', { name: 'Salvează' }).click();

        // Error from the API must be rendered
        await expect(page.locator('text=Prenumele nu poate fi gol.')).toBeVisible();

        // No redirect
        expect(page.url()).toContain('/profil/settings');
    });

    // AS-6 ── Unauthenticated access redirects ─────────────────────────────────
    test('AS-6: accessing /profil/settings without a token redirects to /auth/login', async ({ page }) => {
        // No token seeded → AuthContext sees no user → redirects
        await page.goto('/profil/settings');
        await page.waitForURL(/\/auth\/login/, { timeout: 8_000 });
        expect(page.url()).toContain('/auth/login');
    });

    // AS-7 ── Delete account cancellation (first-click only opens confirm) ──────
    test('AS-7: first "Șterge contul" click shows confirmation, "Anulează" resets it', async ({ page }) => {
        const token = makeSyntheticToken(cachedUserToken, 3_600);
        const profile: ProfileShape = {
            firstName: 'Ion', lastName: 'Popescu',
            email: 'ion@example.com', isGoogleUser: false,
        };

        await mockSettingsPage(page, profile);
        await goToSettings(page, token, cachedUserRefresh);

        // Initial state: only "Șterge contul" button visible (no confirm dialog)
        const primaryDeleteBtn = page.getByRole('button', { name: 'Șterge contul' });
        await expect(primaryDeleteBtn).toBeVisible();
        await expect(page.getByRole('button', { name: 'Da, șterge contul' })).not.toBeVisible();

        // First click opens the confirm step
        await primaryDeleteBtn.click();
        await expect(page.getByRole('button', { name: 'Da, șterge contul' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Anulează' })).toBeVisible();

        // "Anulează" resets back to the primary button
        await page.getByRole('button', { name: 'Anulează' }).click();
        await expect(primaryDeleteBtn).toBeVisible();
        await expect(page.getByRole('button', { name: 'Da, șterge contul' })).not.toBeVisible();
    });
});
