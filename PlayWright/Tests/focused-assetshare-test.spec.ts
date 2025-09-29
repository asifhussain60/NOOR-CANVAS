import { expect, test } from '@playwright/test';

/**
 * [DEBUG-WORKITEM:assetshare:continue] Focused test for share button to asset matching on working URL
 */
test.describe('Share Button Asset Matching - Focused Test', () => {

    test('Asset ID matching validation on host control panel', async ({ page }) => {
        const testId = `focused-test-${Date.now()}`;
        console.log(`[FOCUSED-TEST:${testId}] Starting focused validation on host control panel`);

        // Capture console messages
        const consoleMessages: Array<{ type: string, text: string }> = [];
        page.on('console', msg => {
            consoleMessages.push({
                type: msg.type(),
                text: msg.text()
            });
        });

        try {
            console.log(`[FOCUSED-TEST:${testId}] Loading host control panel`);

            // Go directly to the host control panel URL we know works
            await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW', {
                waitUntil: 'networkidle',
                timeout: 30000
            });

            // Wait for page to load completely
            await page.waitForTimeout(3000);

            console.log(`[FOCUSED-TEST:${testId}] Starting session to activate share buttons`);

            // Start the session to activate share buttons
            const startButton = page.locator('button:has-text("Start Session")');
            if (await startButton.isVisible({ timeout: 5000 })) {
                await startButton.click();
                console.log(`[FOCUSED-TEST:${testId}] Clicked Start Session button`);

                // Wait for session to start and share buttons to be injected
                await page.waitForTimeout(5000);
            } else {
                console.log(`[FOCUSED-TEST:${testId}] Session might already be started`);
            }

            console.log(`[FOCUSED-TEST:${testId}] Analyzing share buttons and asset matching`);

            // Get comprehensive data about share buttons and assets
            const analysisResult = await page.evaluate(() => {
                // Find all share buttons
                const shareButtons = document.querySelectorAll('.ks-share-button');
                const shareButtonsData = Array.from(shareButtons).map((btn, index) => {
                    const button = btn as HTMLElement;
                    return {
                        index,
                        shareId: button.getAttribute('data-share-id'),
                        assetType: button.getAttribute('data-asset-type'),
                        instanceNumber: button.getAttribute('data-instance-number'),
                        buttonText: button.textContent?.trim() || '',
                        parentElement: button.parentElement?.className || '',
                        nextSibling: button.nextElementSibling?.className || '',
                        previousSibling: button.previousElementSibling?.className || '',
                        allDataAttributes: Array.from(button.attributes)
                            .filter(attr => attr.name.startsWith('data-'))
                            .map(attr => ({ name: attr.name, value: attr.value }))
                    };
                });

                // Find all elements with asset IDs
                const assetElements = document.querySelectorAll('[data-asset-id]');
                const assetElementsData = Array.from(assetElements).map((elem, index) => {
                    const element = elem as HTMLElement;
                    return {
                        index,
                        assetId: element.getAttribute('data-asset-id'),
                        className: element.className,
                        tagName: element.tagName,
                        textPreview: element.textContent?.substring(0, 100)?.trim() || '',
                        hasShareButton: !!element.querySelector('.ks-share-button'),
                        allDataAttributes: Array.from(element.attributes)
                            .filter(attr => attr.name.startsWith('data-'))
                            .map(attr => ({ name: attr.name, value: attr.value }))
                    };
                });

                // Find assets by class names that should have share buttons
                const ayahCards = document.querySelectorAll('.ayah-card');
                const hadeesElements = document.querySelectorAll('.inserted-hadees');

                const ayahCardsData = Array.from(ayahCards).map((elem, index) => {
                    const element = elem as HTMLElement;
                    const shareButton = element.querySelector('.ks-share-button');
                    return {
                        index,
                        className: element.className,
                        hasShareButton: !!shareButton,
                        shareButtonId: shareButton?.getAttribute('data-share-id') || null,
                        assetId: element.getAttribute('data-asset-id') || null,
                        textPreview: element.textContent?.substring(0, 100)?.trim() || ''
                    };
                });

                const hadeesData = Array.from(hadeesElements).map((elem, index) => {
                    const element = elem as HTMLElement;
                    const shareButton = element.querySelector('.ks-share-button');
                    return {
                        index,
                        className: element.className,
                        hasShareButton: !!shareButton,
                        shareButtonId: shareButton?.getAttribute('data-share-id') || null,
                        assetId: element.getAttribute('data-asset-id') || null,
                        textPreview: element.textContent?.substring(0, 100)?.trim() || ''
                    };
                });

                return {
                    shareButtons: shareButtonsData,
                    assetElements: assetElementsData,
                    ayahCards: ayahCardsData,
                    hadeesElements: hadeesData,
                    totalShareButtons: shareButtons.length,
                    totalAssetElements: assetElements.length,
                    totalAyahCards: ayahCards.length,
                    totalHadeesElements: hadeesElements.length
                };
            });

            console.log(`[FOCUSED-TEST:${testId}] === DETAILED ANALYSIS RESULTS ===`);
            console.log(`Total Share Buttons: ${analysisResult.totalShareButtons}`);
            console.log(`Total Asset Elements: ${analysisResult.totalAssetElements}`);
            console.log(`Total Ayah Cards: ${analysisResult.totalAyahCards}`);
            console.log(`Total Hadees Elements: ${analysisResult.totalHadeesElements}`);

            console.log(`[FOCUSED-TEST:${testId}] --- SHARE BUTTONS DETAIL ---`);
            analysisResult.shareButtons.forEach((btn, i) => {
                console.log(`Button ${i + 1}: ID=${btn.shareId}, Type=${btn.assetType}, Instance=${btn.instanceNumber}`);
                console.log(`  Text: "${btn.buttonText}", Parent: ${btn.parentElement}`);
            });

            console.log(`[FOCUSED-TEST:${testId}] --- AYAH CARDS DETAIL ---`);
            analysisResult.ayahCards.forEach((card, i) => {
                const matchStatus = card.hasShareButton ? '✅' : '❌';
                console.log(`${matchStatus} Ayah Card ${i + 1}: AssetId=${card.assetId}, ShareButtonId=${card.shareButtonId}`);
                console.log(`  Match: ${card.assetId === card.shareButtonId ? 'YES' : 'NO'}`);
            });

            console.log(`[FOCUSED-TEST:${testId}] --- HADEES ELEMENTS DETAIL ---`);
            analysisResult.hadeesElements.forEach((elem, i) => {
                const matchStatus = elem.hasShareButton ? '✅' : '❌';
                console.log(`${matchStatus} Hadees ${i + 1}: AssetId=${elem.assetId}, ShareButtonId=${elem.shareButtonId}`);
                console.log(`  Match: ${elem.assetId === elem.shareButtonId ? 'YES' : 'NO'}`);
            });

            // Check matching statistics
            const ayahMatches = analysisResult.ayahCards.filter(card =>
                card.hasShareButton && card.assetId === card.shareButtonId
            );
            const hadeesMatches = analysisResult.hadeesElements.filter(elem =>
                elem.hasShareButton && elem.assetId === elem.shareButtonId
            );

            const totalMatches = ayahMatches.length + hadeesMatches.length;
            const totalExpected = analysisResult.totalAyahCards + analysisResult.totalHadeesElements;

            console.log(`[FOCUSED-TEST:${testId}] === MATCHING SUMMARY ===`);
            console.log(`Ayah Card Matches: ${ayahMatches.length}/${analysisResult.totalAyahCards}`);
            console.log(`Hadees Matches: ${hadeesMatches.length}/${analysisResult.totalHadeesElements}`);
            console.log(`Total Matches: ${totalMatches}/${totalExpected}`);
            console.log(`Match Success Rate: ${totalExpected > 0 ? ((totalMatches / totalExpected) * 100).toFixed(1) : 0}%`);

            // Test clicking the first available share button
            if (analysisResult.totalShareButtons > 0) {
                console.log(`[FOCUSED-TEST:${testId}] Testing share button click functionality`);

                // Clear previous console messages
                consoleMessages.length = 0;

                // Click the first share button
                await page.locator('.ks-share-button').first().click();

                // Wait for any JavaScript processing
                await page.waitForTimeout(2000);

                console.log(`[FOCUSED-TEST:${testId}] Click completed, checking for JavaScript response`);

                // Check for any relevant console messages or toastr notifications
                const relevantMessages = consoleMessages.filter(msg =>
                    msg.text.includes('ShareAsset') ||
                    msg.text.includes('shareButton') ||
                    msg.text.includes('DEBUG-WORKITEM:assetshare') ||
                    msg.text.toLowerCase().includes('clicked')
                );

                console.log(`[FOCUSED-TEST:${testId}] Relevant console messages: ${relevantMessages.length}`);
                relevantMessages.forEach(msg => {
                    console.log(`  [${msg.type}] ${msg.text}`);
                });
            }

            // Validate expectations
            expect(analysisResult.totalShareButtons).toBeGreaterThan(0);
            expect(analysisResult.totalAssetElements).toBeGreaterThan(0);
            expect(totalMatches).toBeGreaterThan(0);

            console.log(`[FOCUSED-TEST:${testId}] ✅ Test completed successfully`);

        } catch (error) {
            console.log(`[FOCUSED-TEST:${testId}] ❌ Test failed:`, error);
            throw error;
        }
    });
});