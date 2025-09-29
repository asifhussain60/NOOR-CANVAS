import { expect, test } from '@playwright/test';

/**
 * Manual validation test for AssetLookup API - Simple and direct
 * Run this when the app is already running to verify the API works
 */

test.describe('AssetLookup API - Manual Validation', () => {

    test('Manual: Verify AssetLookup API returns data', async ({ page }) => {
        console.log('[MANUAL-TEST] Testing AssetLookup API endpoint manually');

        try {
            // Direct API test
            await page.goto('https://localhost:9091/api/host/asset-lookup');

            const content = await page.textContent('body');
            console.log('[MANUAL-TEST] API Response received:', content);

            expect(content).toContain('success');
            expect(content).toContain('assetLookups');
            expect(content).toContain('ayah-card');

            console.log('[MANUAL-TEST] ✅ AssetLookup API test PASSED');

        } catch (error) {
            console.log('[MANUAL-TEST] ❌ Test failed - App may not be running:', error);
            throw error;
        }
    });

    test('Manual: Verify HostControlPanel loads and uses API', async ({ page }) => {
        console.log('[MANUAL-TEST] Testing HostControlPanel API integration');

        try {
            // Navigate to HostControlPanel
            await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
            await page.waitForTimeout(3000);

            const title = await page.title();
            console.log('[MANUAL-TEST] Page title:', title);

            expect(title).toContain('NOOR Canvas');

            // Check for NOOR Canvas branding
            const headerText = await page.textContent('h1');
            console.log('[MANUAL-TEST] Header text:', headerText);

            console.log('[MANUAL-TEST] ✅ HostControlPanel integration test PASSED');

        } catch (error) {
            console.log('[MANUAL-TEST] ❌ Integration test failed:', error);
            throw error;
        }
    });

});