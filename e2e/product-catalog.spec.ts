/**
 * Product Catalog E2E Tests
 *
 * Covers /produse URL-param behaviour: sort, filters, search, pagination, clear.
 * All API calls are mocked — no real DB required.
 *
 * Run: npx playwright test product-catalog
 */

import { test, expect, type Page } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:44381';

// ── shared fixtures ────────────────────────────────────────────────────────────

const EMPTY_CART   = JSON.stringify({ userId: null, total: 0, items: [] });
const EMPTY_PAGED  = JSON.stringify({ items: [], totalCount: 0, page: 1, pageSize: 24, totalPages: 0 });

const FAKE_CATEGORY = { categoryId: 'cat-1', name: 'Electronică', slug: 'electronica' };
const CATEGORIES_JSON = JSON.stringify([FAKE_CATEGORY]);

// Minimal variant that renders without crashing (VariantCard requires these fields).
const FAKE_VARIANT = {
    variantId: 'v-1', variantSlug: 'variant-one', productSlug: 'product-one',
    productId: 'p-1', categoryId: 'cat-1', categoryName: 'Electronică',
    productName: 'Test Product', sku: 'SKU-001', name: 'Test Variant',
    brand: null, description: null, price: 99.99, discountedPrice: null,
    stockQuantity: 5, averageRating: null, reviewsCount: 0,
    primaryImageUrl: null, imageUrls: [], attributes: {},
};

// One product, one page → pagination not shown.
const ONE_ITEM_PAGED = JSON.stringify({
    items: [FAKE_VARIANT], totalCount: 1, page: 1, pageSize: 24, totalPages: 1,
});

// One product, three pages → pagination renders.
const THREE_PAGES_PAGED = JSON.stringify({
    items: [FAKE_VARIANT], totalCount: 72, page: 1, pageSize: 24, totalPages: 3,
});

/**
 * Register a catch-all route handler for the /produse page.
 * Intercepts: categories, product-list, variants-filtered, cart, favorites.
 * Everything else gets an empty-array 200.
 */
async function mockCatalogRoutes(page: Page, variantsBody = EMPTY_PAGED) {
    await page.route(`${API}/api/**`, async route => {
        const url = route.request().url();
        if (url.includes('variants-filtered')) {
            await route.fulfill({
                status: 200, contentType: 'application/json', body: variantsBody,
            });
        } else if (url.includes('/api/products')) {
            // getCategoriesWithProducts calls /api/products?categorySlug=... for each category
            await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        } else if (url.includes('/api/categories')) {
            await route.fulfill({
                status: 200, contentType: 'application/json', body: CATEGORIES_JSON,
            });
        } else if (url.includes('/api/cart')) {
            await route.fulfill({
                status: 200, contentType: 'application/json', body: EMPTY_CART,
            });
        } else {
            // favorites, orders, anything else
            await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
    });
}

// ── tests ──────────────────────────────────────────────────────────────────────

test.describe('Product catalog — URL state', () => {

    // PC-1 ── Sort ─────────────────────────────────────────────────────────────
    test('PC-1: selecting a sort option adds sort param to URL', async ({ page }) => {
        await mockCatalogRoutes(page);
        await page.goto('/produse');
        await page.waitForLoadState('networkidle');

        // The sort trigger button shows the current sort label
        await page.getByRole('button', { name: /Relevanță/ }).click();
        await page.getByRole('button', { name: 'Preț: crescător' }).click();

        await expect(page).toHaveURL(/sort=price-asc/);
    });

    test('PC-1b: selecting rating sort adds sort=rating to URL', async ({ page }) => {
        await mockCatalogRoutes(page);
        await page.goto('/produse');
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: /Relevanță/ }).click();
        await page.getByRole('button', { name: 'Cel mai bun rating' }).click();

        await expect(page).toHaveURL(/sort=rating/);
    });

    // PC-2 ── In-stock filter ───────────────────────────────────────────────────
    test('PC-2: "Doar în stoc" checkbox adds instock=1 to URL', async ({ page }) => {
        await mockCatalogRoutes(page);
        await page.goto('/produse');
        await page.waitForLoadState('networkidle');

        // Open filter overlay
        await page.getByRole('button', { name: /Filtrare/ }).click();
        await page.getByLabel('Doar în stoc').check();
        // Close overlay (no product selected → button text is "Gata")
        await page.getByRole('button', { name: 'Gata' }).click();

        await expect(page).toHaveURL(/instock=1/);
    });

    // PC-3 ── Price range filter ────────────────────────────────────────────────
    test('PC-3: price range filter adds min/max params to URL', async ({ page }) => {
        await mockCatalogRoutes(page);
        await page.goto('/produse');
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: /Filtrare/ }).click();

        const minInput = page.locator('input[placeholder="0"]');
        const maxInput = page.locator('input[placeholder="∞"]');

        await minInput.fill('10');
        await minInput.blur();   // flushPrice() fires on blur
        await maxInput.fill('500');
        await maxInput.blur();

        await page.getByRole('button', { name: 'Gata' }).click();

        const url = new URL(page.url());
        expect(url.searchParams.get('min')).toBe('10');
        expect(url.searchParams.get('max')).toBe('500');
    });

    // PC-4 ── Category filter ──────────────────────────────────────────────────
    test('PC-4: selecting a category adds its slug to URL', async ({ page }) => {
        await mockCatalogRoutes(page);
        await page.goto('/produse');
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: /Filtrare/ }).click();
        // Wait for the mocked category to appear in the overlay
        await page.getByRole('button', { name: 'Electronică' }).click();
        await page.getByRole('button', { name: 'Gata' }).click();

        await expect(page).toHaveURL(/category=electronica/);
    });

    // PC-5 ── Search ───────────────────────────────────────────────────────────
    test('PC-5: search param in URL is forwarded as searchText in API request', async ({ page }) => {
        const capturedUrls: string[] = [];

        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();
            if (url.includes('variants-filtered')) {
                capturedUrls.push(url);
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: EMPTY_PAGED,
                });
            } else if (url.includes('/api/products')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            } else if (url.includes('/api/categories')) {
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: CATEGORIES_JSON,
                });
            } else if (url.includes('/api/cart')) {
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: EMPTY_CART,
                });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        await page.goto('/produse?search=ceas');
        await page.waitForLoadState('networkidle');

        // The API request must contain searchText=ceas
        expect(capturedUrls.some(u => u.includes('searchText=ceas'))).toBeTruthy();

        // The active-filter chip shows the search term
        await expect(page.locator('text=Căutare: "ceas"')).toBeVisible();
    });

    // PC-6 ── Pagination ───────────────────────────────────────────────────────
    test('PC-6: clicking page 2 adds p=2 to URL', async ({ page }) => {
        // Return 3 pages so pagination renders
        await mockCatalogRoutes(page, THREE_PAGES_PAGED);
        await page.goto('/produse');
        await page.waitForLoadState('networkidle');

        // Wait for pagination to render — scoped to the Pagination component container
        const pagination = page.locator('.flex.items-center.justify-center.gap-1.mt-8');
        const page2Btn = pagination.getByRole('button', { name: '2' });
        await expect(page2Btn).toBeVisible();
        await page2Btn.click();

        await expect(page).toHaveURL(/p=2/);
    });

    // PC-7 ── Filter state preserved after reload ──────────────────────────────
    test('PC-7: all URL filter params survive a page reload', async ({ page }) => {
        const capturedUrls: string[] = [];

        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();
            if (url.includes('variants-filtered')) {
                capturedUrls.push(url);
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: EMPTY_PAGED,
                });
            } else if (url.includes('/api/products')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            } else if (url.includes('/api/categories')) {
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: CATEGORIES_JSON,
                });
            } else if (url.includes('/api/cart')) {
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: EMPTY_CART,
                });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        await page.goto('/produse?search=ceas&sort=price-asc&instock=1&min=50&max=300');
        await page.waitForLoadState('networkidle');

        await page.reload();
        await page.waitForLoadState('networkidle');

        // All URL params must still be present
        const url = new URL(page.url());
        expect(url.searchParams.get('search')).toBe('ceas');
        expect(url.searchParams.get('sort')).toBe('price-asc');
        expect(url.searchParams.get('instock')).toBe('1');
        expect(url.searchParams.get('min')).toBe('50');
        expect(url.searchParams.get('max')).toBe('300');

        // The API must have received the correct query params after reload
        const latestReq = capturedUrls[capturedUrls.length - 1];
        expect(latestReq).toContain('searchText=ceas');
        expect(latestReq).toContain('sortBy=PriceAsc');
        expect(latestReq).toContain('onlyInStock=true');
        expect(latestReq).toContain('minPrice=50');
        expect(latestReq).toContain('maxPrice=300');
    });

    // PC-8 ── Clear all ────────────────────────────────────────────────────────
    test('PC-8: "Șterge tot" chip button clears all filters from URL', async ({ page }) => {
        await mockCatalogRoutes(page);
        await page.goto('/produse?search=ceas&sort=price-asc&instock=1');
        await page.waitForLoadState('networkidle');

        // Active chips should be visible
        await expect(page.locator('text=Căutare: "ceas"')).toBeVisible();

        // The "Șterge tot" button appears when active chips exist
        await page.getByRole('button', { name: 'Șterge tot' }).click();

        // URL should be bare /produse with no query string
        await expect(page).toHaveURL(/\/produse\/?$/);
        const url = new URL(page.url());
        expect(url.search).toBe('');
    });

    // PC-9 ── onlyInStock → API receives onlyInStock=true ─────────────────────
    test('PC-9: instock=1 in URL causes onlyInStock=true in API request', async ({ page }) => {
        const capturedUrls: string[] = [];

        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();
            if (url.includes('variants-filtered')) {
                capturedUrls.push(url);
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: EMPTY_PAGED,
                });
            } else if (url.includes('/api/products')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            } else if (url.includes('/api/categories')) {
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: CATEGORIES_JSON,
                });
            } else if (url.includes('/api/cart')) {
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: EMPTY_CART,
                });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        await page.goto('/produse?instock=1');
        await page.waitForLoadState('networkidle');

        expect(capturedUrls.some(u => u.includes('onlyInStock=true'))).toBeTruthy();
    });

    // PC-10 ── Pagination: page 2 URL causes page=2 in API request ─────────────
    test('PC-10: navigating to p=2 sends page=2 in API request', async ({ page }) => {
        const capturedUrls: string[] = [];

        await page.route(`${API}/api/**`, async route => {
            const url = route.request().url();
            if (url.includes('variants-filtered')) {
                capturedUrls.push(url);
                // First call returns 3 pages; second (p=2) also returns one item
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: THREE_PAGES_PAGED,
                });
            } else if (url.includes('/api/products')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            } else if (url.includes('/api/categories')) {
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: CATEGORIES_JSON,
                });
            } else if (url.includes('/api/cart')) {
                await route.fulfill({
                    status: 200, contentType: 'application/json', body: EMPTY_CART,
                });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        await page.goto('/produse');
        await page.waitForLoadState('networkidle');

        await page.locator('.flex.items-center.justify-center.gap-1.mt-8').getByRole('button', { name: '2' }).click();
        await page.waitForLoadState('networkidle');

        const page2Req = capturedUrls.find(u => u.includes('page=2'));
        expect(page2Req).toBeTruthy();
    });
});
