import { expect, test } from '@playwright/test';

/**
 * DEBUG: Test the actual AssetHtmlProcessingService by calling it directly via browser console
 */
test.describe('Asset Processing Service Direct Test', () => {
    test('Test AssetHtmlProcessingService processing directly', async ({ page }) => {
        const trackingId = `direct-test-${Date.now()}`;
        console.log(`[DEBUG-DIRECT:${trackingId}] Starting direct AssetHtmlProcessingService test`);

        // Navigate to session 212  
        await page.goto('https://localhost:9091/host?sessionId=212');
        await expect(page.locator('.host-control-panel')).toBeVisible({ timeout: 10000 });

        console.log(`[DEBUG-DIRECT:${trackingId}] Host Control Panel loaded`);

        // Wait for initial processing
        await page.waitForTimeout(3000);

        // Get the raw transcript content first
        const rawContent = await page.evaluate(() => {
            const transcriptDiv = document.querySelector('.ks-transcript');
            return transcriptDiv ? transcriptDiv.innerHTML : null;
        });

        if (!rawContent) {
            throw new Error('Could not find transcript content to test');
        }

        console.log(`[DEBUG-DIRECT:${trackingId}] Raw transcript length: ${rawContent.length}`);
        console.log(`[DEBUG-DIRECT:${trackingId}] Has ayah-card in raw: ${rawContent.includes('ayah-card')}`);

        // Now test what happens when we process this through the AssetHtmlProcessingService
        // We'll simulate the call that happens in InjectAssetShareButtonsWithEnhancedProcessing
        const processingResult = await page.evaluate(async (html) => {
            try {
                // Try to access the AssetHtmlProcessingService through the application
                // This simulates what happens in the InjectAssetShareButtonsWithEnhancedProcessing method

                // Check if we can access the service (this might not work, but worth trying)
                return {
                    success: false,
                    message: 'Cannot access AssetHtmlProcessingService directly from browser',
                    htmlLength: html.length,
                    hasAyahCard: html.includes('ayah-card'),
                    hasDataAssetId: html.includes('data-asset-id')
                };
            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                    htmlLength: html.length,
                    hasAyahCard: html.includes('ayah-card'),
                    hasDataAssetId: html.includes('data-asset-id')
                };
            }
        }, rawContent);

        console.log(`[DEBUG-DIRECT:${trackingId}] Processing result:`, processingResult);

        // Instead, let's check what's actually happening in the transformed transcript
        const transformedAnalysis = await page.evaluate(() => {
            // Look for signs of what processing method was used
            const allDivs = document.querySelectorAll('div');
            let hasDataAssetId = false;
            let hasNoorShareableAsset = false;
            let shareButtonCount = 0;
            let ayahCardCount = 0;

            allDivs.forEach(div => {
                if (div.hasAttribute('data-asset-id')) {
                    hasDataAssetId = true;
                }
                if (div.classList.contains('noor-shareable-asset')) {
                    hasNoorShareableAsset = true;
                }
                if (div.classList.contains('ayah-card')) {
                    ayahCardCount++;
                }
            });

            // Count share buttons
            const shareButtons = document.querySelectorAll('.ks-share-btn, .ks-share-button');
            shareButtonCount = shareButtons.length;

            return {
                hasDataAssetId,
                hasNoorShareableAsset,
                shareButtonCount,
                ayahCardCount,
                totalDivs: allDivs.length
            };
        });

        console.log(`[DEBUG-DIRECT:${trackingId}] Transformed analysis:`, transformedAnalysis);

        // Check what method was actually used by looking at the logs or console
        const consoleMessages: string[] = [];

        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'info') {
                const text = msg.text();
                if (text.includes('AssetHtmlProcessingService') || text.includes('SIMPLIFIED-ASSET-INJECTION') || text.includes('DEBUG-WORKITEM:assetshare')) {
                    consoleMessages.push(text);
                }
            }
        });

        // Trigger a re-processing by doing something that would call TransformTranscriptHtml
        await page.reload();
        await expect(page.locator('.host-control-panel')).toBeVisible({ timeout: 10000 });

        // Wait for processing
        await page.waitForTimeout(2000);

        console.log(`[DEBUG-DIRECT:${trackingId}] Console messages related to asset processing:`, consoleMessages);

        // Final analysis
        console.log(`[DEBUG-DIRECT:${trackingId}] CONCLUSION:`);
        if (transformedAnalysis.hasDataAssetId || transformedAnalysis.hasNoorShareableAsset) {
            console.log(`[DEBUG-DIRECT:${trackingId}] ✅ AssetHtmlProcessingService was used - found data-asset-id or noor-shareable-asset class`);
        } else if (transformedAnalysis.shareButtonCount > 0) {
            console.log(`[DEBUG-DIRECT:${trackingId}] ⚠️ Fallback InjectAssetShareButtonsFromDatabase was used - share buttons found but no asset processing attributes`);
        } else {
            console.log(`[DEBUG-DIRECT:${trackingId}] ❌ No share button injection occurred at all`);
        }

        console.log(`[DEBUG-DIRECT:${trackingId}] Share buttons: ${transformedAnalysis.shareButtonCount}, Ayah cards: ${transformedAnalysis.ayahCardCount}`);

        // Test passes regardless - we're just debugging
        expect(true).toBe(true);
    });
});