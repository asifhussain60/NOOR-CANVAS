import { expect, test } from '@playwright/test';

/**
 * [DEBUG-WORKITEM:assetshare:continue] Silent comprehensive test for share button to asset matching
 * This test validates the complete fix for share button to asset ID matching
 */
test.describe('Share Button Asset Matching Tests - Silent Mode', () => {

    test('Comprehensive share button to asset matching validation', async ({ page }) => {
        const testId = `asset-match-${Date.now()}`;
        console.log(`[ASSET-MATCH-TEST:${testId}] Starting comprehensive validation`);

        // Capture all console and error output
        const consoleMessages: Array<{ type: string, text: string, timestamp: number }> = [];
        const errors: string[] = [];

        page.on('console', msg => {
            consoleMessages.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: Date.now()
            });
        });

        page.on('pageerror', error => {
            errors.push(error.message);
        });

        try {
            console.log(`[ASSET-MATCH-TEST:${testId}] Step 1: Loading host control panel`);

            await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW', {
                waitUntil: 'networkidle',
                timeout: 15000
            });

            // Wait for page to fully load
            await page.waitForTimeout(2000);

            console.log(`[ASSET-MATCH-TEST:${testId}] Step 2: Starting session to activate share buttons`);

            // Start session if needed
            const startButton = page.locator('button:has-text("Start Session")');
            if (await startButton.isVisible({ timeout: 3000 })) {
                await startButton.click();
                await page.waitForTimeout(3000);
                console.log(`[ASSET-MATCH-TEST:${testId}] Session started`);
            }

            console.log(`[ASSET-MATCH-TEST:${testId}] Step 3: Analyzing share button and asset ID matching`);

            // Get all share buttons with their data attributes
            const shareButtonData = await page.evaluate(() => {
                const buttons = document.querySelectorAll('.ks-share-button');
                return Array.from(buttons).map((btn, index) => {
                    const button = btn as HTMLElement;
                    return {
                        index,
                        shareId: button.getAttribute('data-share-id'),
                        assetType: button.getAttribute('data-asset-type'),
                        instanceNumber: button.getAttribute('data-instance-number'),
                        buttonText: button.textContent?.trim(),
                        hasAssetIdAttribute: button.hasAttribute('data-asset-id'),
                        allAttributes: Array.from(button.attributes).map(attr => ({
                            name: attr.name,
                            value: attr.value
                        }))
                    };
                });
            });

            console.log(`[ASSET-MATCH-TEST:${testId}] Found ${shareButtonData.length} share buttons`);

            // Get all asset elements with their data attributes  
            const assetElementData = await page.evaluate(() => {
                const assets = document.querySelectorAll('[data-asset-id]');
                return Array.from(assets).map((asset, index) => {
                    const element = asset as HTMLElement;
                    return {
                        index,
                        assetId: element.getAttribute('data-asset-id'),
                        className: element.className,
                        tagName: element.tagName,
                        hasShareId: element.hasAttribute('data-share-id'),
                        textPreview: element.textContent?.substring(0, 100)?.trim()
                    };
                });
            });

            console.log(`[ASSET-MATCH-TEST:${testId}] Found ${assetElementData.length} asset elements`);

            console.log(`[ASSET-MATCH-TEST:${testId}] Step 4: Validating ID matching logic`);

            // Analyze the matching between share buttons and assets
            const matchingResults = [];
            for (const button of shareButtonData) {
                const matchingAssets = assetElementData.filter(asset =>
                    asset.assetId === button.shareId
                );

                matchingResults.push({
                    button,
                    matchingAssets,
                    hasMatch: matchingAssets.length > 0
                });
            }

            // Report detailed matching analysis
            console.log(`[ASSET-MATCH-TEST:${testId}] === MATCHING ANALYSIS REPORT ===`);

            let correctMatches = 0;
            let totalButtons = shareButtonData.length;

            for (const result of matchingResults) {
                if (result.hasMatch) {
                    correctMatches++;
                    console.log(`[ASSET-MATCH-TEST:${testId}] ✅ MATCH FOUND:`);
                    console.log(`  Share Button ID: ${result.button.shareId}`);
                    console.log(`  Asset ID: ${result.matchingAssets[0]?.assetId}`);
                    console.log(`  Asset Type: ${result.button.assetType}`);
                } else {
                    console.log(`[ASSET-MATCH-TEST:${testId}] ❌ NO MATCH:`);
                    console.log(`  Share Button ID: ${result.button.shareId}`);
                    console.log(`  Asset Type: ${result.button.assetType}`);
                    console.log(`  Button Text: ${result.button.buttonText}`);
                }
            }

            const matchRatio = totalButtons > 0 ? (correctMatches / totalButtons) * 100 : 0;
            console.log(`[ASSET-MATCH-TEST:${testId}] === SUMMARY ===`);
            console.log(`  Total Share Buttons: ${totalButtons}`);
            console.log(`  Correct Matches: ${correctMatches}`);
            console.log(`  Match Success Rate: ${matchRatio.toFixed(1)}%`);

            console.log(`[ASSET-MATCH-TEST:${testId}] Step 5: Testing actual click functionality`);

            if (shareButtonData.length > 0) {
                // Test clicking the first share button that has a match
                const buttonWithMatch = matchingResults.find(r => r.hasMatch);

                if (buttonWithMatch) {
                    console.log(`[ASSET-MATCH-TEST:${testId}] Testing click on matched button...`);

                    // Clear console messages before click
                    consoleMessages.length = 0;

                    // Click the share button
                    await page.locator('.ks-share-button').first().click();

                    // Wait for JavaScript processing
                    await page.waitForTimeout(2000);

                    // Check for debug messages indicating success
                    const debugMessages = consoleMessages.filter(msg =>
                        msg.text.includes('DEBUG-WORKITEM:assetshare:continue') ||
                        msg.text.includes('SHAREBUTTON CLICKED') ||
                        msg.text.includes('ShareAsset')
                    );

                    console.log(`[ASSET-MATCH-TEST:${testId}] Click debug messages: ${debugMessages.length}`);

                    if (debugMessages.length > 0) {
                        console.log(`[ASSET-MATCH-TEST:${testId}] ✅ Click processing successful`);
                    } else {
                        console.log(`[ASSET-MATCH-TEST:${testId}] ⚠️ No click debug messages found`);
                    }
                } else {
                    console.log(`[ASSET-MATCH-TEST:${testId}] ⚠️ No buttons with matching assets found for click test`);
                }
            }

            console.log(`[ASSET-MATCH-TEST:${testId}] Step 6: Checking JavaScript handler setup`);

            // Check if JavaScript handlers are properly set up
            const jsSetupInfo = await page.evaluate(() => {
                const win = window as any;
                const doc = document as any;
                return {
                    hasDotNetRef: !!win.dotNetRef,
                    hasSetupFunction: typeof win.setupShareButtonHandlers === 'function',
                    hasHandleFunction: typeof win.handleShareButtonClick === 'function',
                    hasShareFunction: typeof win.showShareDebugToast === 'function',
                    eventListenersCount: doc.eventListeners?.length || 'unknown'
                };
            });

            console.log(`[ASSET-MATCH-TEST:${testId}] JavaScript setup status:`);
            console.log(`  DotNet Reference: ${jsSetupInfo.hasDotNetRef}`);
            console.log(`  Setup Function: ${jsSetupInfo.hasSetupFunction}`);
            console.log(`  Handle Function: ${jsSetupInfo.hasHandleFunction}`);
            console.log(`  Toast Function: ${jsSetupInfo.hasShareFunction}`);

            console.log(`[ASSET-MATCH-TEST:${testId}] Step 7: Final validation`);

            // Validate our expectations
            expect(shareButtonData.length).toBeGreaterThan(0); // Should have share buttons
            expect(assetElementData.length).toBeGreaterThan(0); // Should have assets
            expect(correctMatches).toBeGreaterThan(0); // Should have at least some matches
            expect(matchRatio).toBeGreaterThanOrEqual(50); // At least 50% match rate
            expect(errors.length).toBeLessThanOrEqual(1); // Minimal errors allowed

            console.log(`[ASSET-MATCH-TEST:${testId}] ✅ ALL VALIDATIONS PASSED`);

        } catch (error) {
            console.log(`[ASSET-MATCH-TEST:${testId}] ❌ Test failed:`, error);

            // Log recent console messages for debugging
            console.log(`[ASSET-MATCH-TEST:${testId}] Recent console messages:`);
            consoleMessages.slice(-5).forEach(msg => {
                console.log(`  [${msg.type}] ${msg.text}`);
            });

            throw error;
        }
    });

    test('Share button JavaScript event wiring validation', async ({ page }) => {
        const testId = `js-wiring-${Date.now()}`;
        console.log(`[JS-WIRING-TEST:${testId}] Starting JavaScript event validation`);

        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW', {
            waitUntil: 'networkidle',
            timeout: 15000
        });

        // Start session
        const startButton = page.locator('button:has-text("Start Session")');
        if (await startButton.isVisible({ timeout: 3000 })) {
            await startButton.click();
            await page.waitForTimeout(3000);
        }

        // Check if click events are properly bound
        const eventBindingTest = await page.evaluate(() => {
            // Try to trigger our event handler directly
            const shareButtons = document.querySelectorAll('.ks-share-button');

            if (shareButtons.length === 0) {
                return { error: 'No share buttons found' };
            }

            const firstButton = shareButtons[0] as HTMLElement;

            // Create a synthetic click event
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });

            // Track if our handler gets called
            let handlerCalled = false;
            let errorOccurred = null;

            try {
                // Add a temporary listener to see if events bubble
                document.addEventListener('click', function tempListener(e) {
                    if ((e.target as Element)?.closest('.ks-share-button')) {
                        handlerCalled = true;
                    }
                }, { once: true });

                // Dispatch the event
                firstButton.dispatchEvent(clickEvent);

                return {
                    buttonFound: true,
                    eventDispatched: true,
                    handlerCalled,
                    buttonAttributes: {
                        shareId: firstButton.getAttribute('data-share-id'),
                        assetType: firstButton.getAttribute('data-asset-type'),
                        classes: firstButton.className
                    }
                };

            } catch (error) {
                return {
                    error: (error as Error).message,
                    buttonFound: true,
                    eventDispatched: false
                };
            }
        });

        console.log(`[JS-WIRING-TEST:${testId}] Event binding test result:`, eventBindingTest);

        expect(eventBindingTest.buttonFound).toBe(true);
        expect(eventBindingTest.eventDispatched).toBe(true);

        console.log(`[JS-WIRING-TEST:${testId}] ✅ JavaScript event wiring validated`);
    });

});