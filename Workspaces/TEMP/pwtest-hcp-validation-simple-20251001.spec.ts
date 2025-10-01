import { expect, test } from '@playwright/test';

/**
 * Asset Detection Validation - SIMPLIFIED
 * Validates that the restored AssetProcessingService is working
 * Tests actual detected assets rather than specific counts
 */

test.describe('Asset Detection Validation - Session 212', () => {

    test('should validate restored asset detection functionality', async ({ page }) => {
        // Navigate directly to session 212
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for session to load
        await expect(page.locator('text="Need For Messengers"').first()).toBeVisible({ timeout: 15000 });

        // Wait for transcript to load and asset processing to complete
        await page.waitForTimeout(5000);

        // 1. Verify AssetLookup API is accessible
        const apiResponse = await page.request.get('https://localhost:9091/api/host/asset-lookup', {
            ignoreHTTPSErrors: true
        });
        expect(apiResponse.ok()).toBeTruthy();

        const assetLookupData = await apiResponse.json();
        console.log('AssetLookup API Response:', assetLookupData);

        // 2. Check for any ayah-card elements in the DOM
        const ayahCards = page.locator('.ayah-card');
        const ayahCount = await ayahCards.count();
        console.log(`Found ${ayahCount} ayah-card elements`);

        // 3. Check for any inserted-hadees elements  
        const insertedHadees = page.locator('.inserted-hadees');
        const hadeesCount = await insertedHadees.count();
        console.log(`Found ${hadeesCount} inserted-hadees elements`);

        // 4. Check for share buttons
        const shareButtons = page.locator('[data-share-button="asset"]');
        const shareCount = await shareButtons.count();
        console.log(`Found ${shareCount} share buttons`);

        // 5. Check for data-asset-id attributes
        const elementsWithAssetIds = page.locator('[data-asset-id^="asset-"]');
        const assetIdCount = await elementsWithAssetIds.count();
        console.log(`Found ${assetIdCount} elements with asset IDs`);

        // VALIDATION: Asset detection should be working (some positive numbers)
        expect(ayahCount + hadeesCount).toBeGreaterThan(0); // Should detect some assets
        expect(shareCount).toBeGreaterThan(0); // Should inject some share buttons
        expect(assetIdCount).toEqual(shareCount); // Asset IDs should match share buttons

        // Log asset detection results for debugging
        console.log(`Asset Detection Results: ayah-cards=${ayahCount}, hadees=${hadeesCount}, share-buttons=${shareCount}`);

        // 6. Trigger manual asset detection via debug panel if available
        const debugPanel = page.locator('.debug-panel, [data-testid="debug-panel"]');
        if (await debugPanel.isVisible()) {
            const assetTestButton = page.locator('text="Test Asset Detection"');
            if (await assetTestButton.isVisible()) {
                console.log('Triggering manual asset detection test...');
                await assetTestButton.click();
                await page.waitForTimeout(3000);

                // Check for any popup/modal with results
                const popup = page.locator('.swal2-container, .modal, [role="dialog"]').first();
                if (await popup.isVisible({ timeout: 5000 })) {
                    const popupText = await popup.textContent();
                    console.log('Asset detection popup result:', popupText);
                    expect(popupText).toContain('asset');
                }
            }
        }
    });

});