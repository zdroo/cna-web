/**
 * Dark Mode E2E Tests
 *
 * Covers:
 *   DM-1: toggle adds "dark" class to <html>
 *   DM-2: theme persists across page reload (localStorage + inline script)
 *   DM-3: toggling back to light removes "dark" class and updates localStorage
 *   DM-4: pre-seeding localStorage with theme=dark applies dark before first paint (no FOUC)
 *
 * The dark-mode toggle lives on /profil, so a logged-in session is required.
 * Tokens are cached in beforeAll via a real login; subsequent tests use synthetic
 * tokens (1-hour expiry, standard-base64 payload) so they never expire mid-suite.
 *
 * Run: npx playwright test dark-mode
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

const EMPTY_ORDERS = '{"items":[],"totalCount":0,"page":1,"pageSize":50,"totalPages":0}';
const EMPTY_PAGED  = '{"items":[],"totalCount":0,"page":1,"pageSize":24,"totalPages":0}';

/** Intercept all API calls needed when viewing /profil (logged-in user). */
async function mockProfileRoutes(page: import('@playwright/test').Page) {
    await page.route(`${API}/api/**`, async route => {
        const url = route.request().url();
        if (url.includes('/api/order')) {
            await route.fulfill({ status: 200, contentType: 'application/json', body: EMPTY_ORDERS });
        } else if (url.includes('/api/cart')) {
            await route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ userId: 'u-1', total: 0, items: [] }),
            });
        } else if (url.includes('variants-filtered')) {
            await route.fulfill({ status: 200, contentType: 'application/json', body: EMPTY_PAGED });
        } else {
            await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
    });
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

test.describe('Dark mode', () => {

    // DM-1 ── Toggle adds "dark" class ─────────────────────────────────────────
    test('DM-1: clicking the theme toggle adds "dark" class to <html>', async ({ page }) => {
        const token = makeSyntheticToken(cachedUserToken, 3_600);

        await page.addInitScript(({ t, rt }: { t: string; rt: string }) => {
            localStorage.setItem('token', t);
            localStorage.setItem('refreshToken', rt);
            // Start in light mode — removing the key is sufficient; the
            // classList.remove call on the blank document has no effect.
            localStorage.removeItem('theme');
        }, { t: token, rt: cachedUserRefresh });

        await mockProfileRoutes(page);
        await page.goto('/profil');
        await page.waitForLoadState('networkidle');

        // Confirm we start in light mode
        const isDarkBefore = await page.evaluate(
            () => document.documentElement.classList.contains('dark'),
        );
        expect(isDarkBefore).toBe(false);

        // Click the theme toggle (aria-label="Schimbă tema" on /profil)
        await page.getByRole('button', { name: 'Schimbă tema' }).click();

        const isDarkAfter = await page.evaluate(
            () => document.documentElement.classList.contains('dark'),
        );
        expect(isDarkAfter).toBe(true);

        // localStorage must be updated
        const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
        expect(storedTheme).toBe('dark');
    });

    // DM-2 ── Theme persists across reload ─────────────────────────────────────
    test('DM-2: dark theme persists across page reload via localStorage + inline script', async ({ page }) => {
        const token = makeSyntheticToken(cachedUserToken, 3_600);

        // Pre-seed dark mode so the inline script in layout.tsx applies it before first paint
        await page.addInitScript(({ t, rt }: { t: string; rt: string }) => {
            localStorage.setItem('token', t);
            localStorage.setItem('refreshToken', rt);
            localStorage.setItem('theme', 'dark');
        }, { t: token, rt: cachedUserRefresh });

        await mockProfileRoutes(page);
        await page.goto('/profil');

        // The inline <script> in layout.tsx runs before React hydrates:
        //   if (t === 'dark') document.documentElement.classList.add('dark')
        // So the class must already be set when the page loads.
        const isDark = await page.evaluate(
            () => document.documentElement.classList.contains('dark'),
        );
        expect(isDark).toBe(true);

        // Reload and verify persistence
        await page.reload();
        await page.waitForLoadState('networkidle');

        const isDarkAfterReload = await page.evaluate(
            () => document.documentElement.classList.contains('dark'),
        );
        expect(isDarkAfterReload).toBe(true);

        const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
        expect(storedTheme).toBe('dark');
    });

    // DM-3 ── Toggle back to light ─────────────────────────────────────────────
    test('DM-3: toggling twice returns to light mode', async ({ page }) => {
        const token = makeSyntheticToken(cachedUserToken, 3_600);

        await page.addInitScript(({ t, rt }: { t: string; rt: string }) => {
            localStorage.setItem('token', t);
            localStorage.setItem('refreshToken', rt);
            localStorage.removeItem('theme');
        }, { t: token, rt: cachedUserRefresh });

        await mockProfileRoutes(page);
        await page.goto('/profil');
        await page.waitForLoadState('networkidle');

        const toggle = page.getByRole('button', { name: 'Schimbă tema' });

        // First toggle → dark
        await toggle.click();
        expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
        expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

        // Second toggle → light
        await toggle.click();
        expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);
        expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
    });

    // DM-4 ── FOUC prevention: dark class applied before first React paint ──────
    test('DM-4: pre-seeding theme=dark in localStorage applies dark class before React hydrates', async ({ page }) => {
        const token = makeSyntheticToken(cachedUserToken, 3_600);

        // The inline script in layout.tsx runs synchronously before any JS bundle:
        //   (function(){ try { var t=localStorage.getItem('theme');
        //     if(t==='dark') document.documentElement.classList.add('dark');
        //   } catch(e){} })();
        // We verify this by checking the class before waitForLoadState (i.e. before hydration)
        await page.addInitScript(({ t, rt }: { t: string; rt: string }) => {
            localStorage.setItem('token', t);
            localStorage.setItem('refreshToken', rt);
            localStorage.setItem('theme', 'dark');
        }, { t: token, rt: cachedUserRefresh });

        await mockProfileRoutes(page);

        // Navigate and immediately check the class (before networkidle)
        await page.goto('/profil', { waitUntil: 'domcontentloaded' });

        const isDarkOnDomReady = await page.evaluate(
            () => document.documentElement.classList.contains('dark'),
        );
        // The inline script fires as part of <head>, so dark class is set on DOMContentLoaded
        expect(isDarkOnDomReady).toBe(true);
    });

    // DM-5 ── Dark navbar styling ──────────────────────────────────────────────
    test('DM-5: toggling to dark mode applies dark styling to the navbar', async ({ page }) => {
        const token = makeSyntheticToken(cachedUserToken, 3_600);

        await page.addInitScript(({ t, rt }: { t: string; rt: string }) => {
            localStorage.setItem('token', t);
            localStorage.setItem('refreshToken', rt);
            localStorage.removeItem('theme');
        }, { t: token, rt: cachedUserRefresh });

        await mockProfileRoutes(page);
        await page.goto('/profil');
        await page.waitForLoadState('networkidle');

        // In light mode the navbar has bg-white, in dark mode dark:bg-gray-900
        // The "dark" Tailwind variant is activated by the .dark class on <html>.
        // We verify via the computed background of the <nav> element.
        const navBgBefore = await page.evaluate(() => {
            const nav = document.querySelector('nav');
            return nav ? getComputedStyle(nav).backgroundColor : null;
        });

        await page.getByRole('button', { name: 'Schimbă tema' }).click();

        const navBgAfter = await page.evaluate(() => {
            const nav = document.querySelector('nav');
            return nav ? getComputedStyle(nav).backgroundColor : null;
        });

        // Background colour must change between light and dark
        expect(navBgAfter).not.toBe(navBgBefore);
        // In dark mode the navbar background is a dark gray (not white)
        // rgb(255,255,255) is white (light mode); anything else means dark is applied
        expect(navBgAfter).not.toBe('rgb(255, 255, 255)');
    });
});
