import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    expect: { timeout: 10_000 },
    use: {
        baseURL: 'http://localhost:3000',
        // API uses a self-signed dev certificate
        ignoreHTTPSErrors: true,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    // Assumes `npm run dev` and the .NET API are already running.
    // To run: npx playwright test
    // To run one test: npx playwright test --grep "test 3"
});
