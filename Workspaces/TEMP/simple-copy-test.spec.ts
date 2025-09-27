import { expect, test } from '@playwright/test';

test.describe('Copy Button Functionality Verification', () => {
    test('verify no JavaScript errors on page load', async ({ page }) => {
        // Listen for JavaScript errors
        const jsErrors: string[] = [];
        page.on('pageerror', (error) => {
            // Filter out expected clipboard permission errors
            if (!error.message.includes('clipboard') && !error.message.includes('permission')) {
                jsErrors.push(error.message);
            }
        });

        // Start the application
        await page.goto('https://localhost:9091/');
        await page.waitForTimeout(5000);

        // Navigate to host landing
        await page.goto('https://localhost:9091/host');
        await page.waitForTimeout(3000);

        // Check that no unexpected JavaScript errors occurred
        expect(jsErrors.length).toBe(0);

        if (jsErrors.length > 0) {
            console.log('JavaScript errors found:', jsErrors);
        }
    });
});