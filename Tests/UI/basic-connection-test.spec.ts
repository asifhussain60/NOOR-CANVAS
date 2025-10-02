import { expect, test } from '@playwright/test';

test.describe('Basic Connection Test', () => {
    test('should be able to connect to NOOR Canvas application', async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:9090', { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for page to load and check if it's responsive
        await expect(page).toHaveTitle(/NOOR/);

        console.log('✅ Successfully connected to NOOR Canvas');
    });
});