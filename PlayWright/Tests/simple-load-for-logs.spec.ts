import { expect, test } from '@playwright/test';

/**
 * Simple test to load the page and trigger logging so we can see what method is being used
 */
test.describe('Simple Load Test for Logging', () => {
    test('Load session 212 and check server logs', async ({ page }) => {
        console.log('[SIMPLE-LOAD] Starting simple load test to trigger server logging');

        // Navigate to session 212
        await page.goto('https://localhost:9091/host?sessionId=212');
        await expect(page.locator('.host-control-panel')).toBeVisible({ timeout: 10000 });

        console.log('[SIMPLE-LOAD] Page loaded successfully');

        // Wait for processing to complete
        await page.waitForTimeout(5000);

        // Check basic elements
        const shareButtonCount = await page.evaluate(() => {
            return document.querySelectorAll('.ks-share-btn, .ks-share-button').length;
        });

        const ayahCardCount = await page.evaluate(() => {
            return document.querySelectorAll('.ayah-card').length;
        });

        console.log(`[SIMPLE-LOAD] Found ${shareButtonCount} share buttons and ${ayahCardCount} ayah cards`);
        console.log('[SIMPLE-LOAD] Check the server terminal logs to see which asset processing method was used');

        // Test passes - we just want to trigger the processing and see logs
        expect(true).toBe(true);
    });
});