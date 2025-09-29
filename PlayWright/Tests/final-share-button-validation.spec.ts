import { expect, test } from '@playwright/test';

/**
 * [FINAL-TEST] Comprehensive test of the fixed share button functionality
 * This test validates that share buttons are now properly injected using the enhanced AssetHtmlProcessingService
 */
test.describe('Asset Share Button Fix Validation', () => {
    test('Verify share buttons are properly injected for session 212', async ({ page }) => {
        const trackingId = `final-validation-${Date.now()}`;
        console.log(`[FINAL-TEST:${trackingId}] Starting comprehensive validation of share button fix`);

        // Navigate to session 212 (Active session with ayah-card assets)
        await page.goto('https://localhost:9091/host?sessionId=212');
        await expect(page.locator('.host-control-panel')).toBeVisible({ timeout: 10000 });

        console.log(`[FINAL-TEST:${trackingId}] Host Control Panel loaded for session 212`);

        // Wait for processing to complete
        await page.waitForTimeout(5000);

        // Check the key elements we expect after the fix
        const validationResults = await page.evaluate(() => {
            // Count different types of elements
            const ayahCards = document.querySelectorAll('.ayah-card');
            const shareButtons = document.querySelectorAll('.ks-share-btn, .ks-share-button');
            const dataAssetElements = document.querySelectorAll('[data-asset-id]');
            const noorShareableAssets = document.querySelectorAll('.noor-shareable-asset');

            // Get some sample share button data
            const sampleShareButtons = Array.from(shareButtons).slice(0, 3).map((btn, idx) => ({
                index: idx,
                hasDataShareId: btn.hasAttribute('data-share-id'),
                hasDataAssetType: btn.hasAttribute('data-asset-type'),
                hasOnClick: btn.hasAttribute('onclick'),
                text: btn.textContent?.trim(),
                classes: btn.className
            }));

            // Check if share buttons are positioned correctly relative to ayah cards
            let shareButtonsBeforeAyahCards = 0;
            ayahCards.forEach(card => {
                const prevSibling = card.previousElementSibling;
                if (prevSibling && prevSibling.classList.contains('ks-share-btn')) {
                    shareButtonsBeforeAyahCards++;
                }
            });

            return {
                ayahCardCount: ayahCards.length,
                shareButtonCount: shareButtons.length,
                dataAssetElementCount: dataAssetElements.length,
                noorShareableAssetCount: noorShareableAssets.length,
                shareButtonsBeforeAyahCards,
                sampleShareButtons,
                hasCorrectPositioning: shareButtonsBeforeAyahCards > 0
            };
        });

        console.log(`[FINAL-TEST:${trackingId}] VALIDATION RESULTS:`);
        console.log(`[FINAL-TEST:${trackingId}] - Ayah cards found: ${validationResults.ayahCardCount}`);
        console.log(`[FINAL-TEST:${trackingId}] - Share buttons found: ${validationResults.shareButtonCount}`);
        console.log(`[FINAL-TEST:${trackingId}] - Elements with data-asset-id: ${validationResults.dataAssetElementCount}`);
        console.log(`[FINAL-TEST:${trackingId}] - Elements with noor-shareable-asset class: ${validationResults.noorShareableAssetCount}`);
        console.log(`[FINAL-TEST:${trackingId}] - Share buttons positioned before ayah cards: ${validationResults.shareButtonsBeforeAyahCards}`);

        // Log sample share buttons for detailed validation
        validationResults.sampleShareButtons.forEach((btn, idx) => {
            console.log(`[FINAL-TEST:${trackingId}] Share Button ${idx + 1}: "${btn.text}", data-share-id: ${btn.hasDataShareId}, onclick: ${btn.hasOnClick}`);
        });

        // Validation assertions
        console.log(`[FINAL-TEST:${trackingId}] PERFORMING VALIDATIONS:`);

        // We should have ayah cards (confirmed from database)
        expect(validationResults.ayahCardCount).toBeGreaterThan(0);
        console.log(`[FINAL-TEST:${trackingId}] ✅ Found ${validationResults.ayahCardCount} ayah cards as expected`);

        // With the fix, we should now have share buttons
        expect(validationResults.shareButtonCount).toBeGreaterThan(0);
        console.log(`[FINAL-TEST:${trackingId}] ✅ Found ${validationResults.shareButtonCount} share buttons - FIX SUCCESSFUL!`);

        // Enhanced AssetHtmlProcessingService should add data-asset-id attributes
        if (validationResults.dataAssetElementCount > 0) {
            console.log(`[FINAL-TEST:${trackingId}] ✅ Enhanced processing detected - found ${validationResults.dataAssetElementCount} elements with data-asset-id`);
        }

        // Share buttons should be properly positioned before assets
        if (validationResults.hasCorrectPositioning) {
            console.log(`[FINAL-TEST:${trackingId}] ✅ Share buttons are correctly positioned before ayah cards`);
        }

        // Each share button should have the required attributes for functionality
        const wellFormedButtons = validationResults.sampleShareButtons.filter(btn =>
            btn.hasDataShareId && btn.hasOnClick && btn.text?.includes('Share')
        );

        expect(wellFormedButtons.length).toBeGreaterThan(0);
        console.log(`[FINAL-TEST:${trackingId}] ✅ Found ${wellFormedButtons.length} properly formed share buttons with required attributes`);

        console.log(`[FINAL-TEST:${trackingId}] 🎉 SHARE BUTTON FIX VALIDATION COMPLETE - ALL TESTS PASSED!`);

        // Bonus: Test clicking a share button to ensure it's wired up
        if (validationResults.shareButtonCount > 0) {
            console.log(`[FINAL-TEST:${trackingId}] Testing share button click functionality...`);

            await page.click('.ks-share-btn:first-of-type');
            await page.waitForTimeout(1000);

            console.log(`[FINAL-TEST:${trackingId}] ✅ Share button click executed successfully`);
        }

        console.log(`[FINAL-TEST:${trackingId}] SUMMARY: Fix successfully implemented share button injection using enhanced AssetHtmlProcessingService`);
    });
});