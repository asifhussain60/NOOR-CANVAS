import { expect, test } from '@playwright/test';

/**
 * [WORKITEM:hcp-fab-button] Comprehensive test to isolate and trace FAB button click functionality
 * 
 * TEST OBJECTIVES:
 * 1. Verify FAB button renders with correct attributes
 * 2. Trace click event from DOM to handleShareButtonClick
 * 3. Verify ShareAsset C# method is invoked
 * 4. Capture all console logs for debugging
 * 
 * TESTING PROTOCOL:
 * - Follow framework pattern from Tests/UI/focused-assetshare-test.spec.ts
 * - Use Test-Framework/Invoke-PlaywrightTest.ps1 for execution
 * - Capture comprehensive console logs with [HCP-FAB-TEST] prefix
 */

test.describe('FAB Button Click Functionality - Isolated Test', () => {

    test('FAB button renders and click triggers ShareAsset', async ({ page }) => {
        const testId = `fab-button-test-${Date.now()}`;
        console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
        console.log(`[HCP-FAB-TEST:${testId}] Starting FAB button click isolation test`);
        console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);

        // Capture ALL console messages for debugging
        const consoleMessages: Array<{ type: string, text: string, timestamp: number }> = [];
        page.on('console', msg => {
            const message = {
                type: msg.type(),
                text: msg.text(),
                timestamp: Date.now()
            };
            consoleMessages.push(message);

            // Log ALL messages to test console for debugging
            console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`);
        });

        // Capture page errors
        const pageErrors: Array<{ message: string, timestamp: number }> = [];
        page.on('pageerror', error => {
            const errorData = {
                message: error.message,
                timestamp: Date.now()
            };
            pageErrors.push(errorData);
            console.error(`[HCP-FAB-TEST:${testId}] ❌ PAGE ERROR:`, errorData);
        });

        try {
            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
            console.log(`[HCP-FAB-TEST:${testId}] Step 1: Loading host control panel URL`);
            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);

            // Navigate to host control panel with known working session
            await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW', {
                waitUntil: 'networkidle',
                timeout: 30000
            });

            console.log(`[HCP-FAB-TEST:${testId}] ✅ Page loaded, waiting for initialization`);
            await page.waitForTimeout(3000);

            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
            console.log(`[HCP-FAB-TEST:${testId}] Step 2: Click Transcript Canvas tile button`);
            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);

            // Click Transcript Canvas button tile (using aria-pressed attribute from component)
            // The button has aria-pressed attribute and is the second button in the grid
            const transcriptCanvasButton = page.locator('button[aria-pressed]').filter({ hasText: 'Transcript Canvas' }).or(
                page.locator('button[title*="Transcript Canvas"]')
            ).last();

            await transcriptCanvasButton.waitFor({ state: 'visible', timeout: 10000 });
            console.log(`[HCP-FAB-TEST:${testId}] Transcript Canvas button visible, clicking...`);

            // Force log to STDOUT
            await page.evaluate(() => console.log('[HCP-FAB-TEST:BROWSER] About to click Transcript Canvas'));

            await transcriptCanvasButton.click();
            console.log(`[HCP-FAB-TEST:${testId}] ✅ Clicked Transcript Canvas button`);

            // Force log after click
            await page.evaluate(() => console.log('[HCP-FAB-TEST:BROWSER] Clicked Transcript Canvas, waiting...'));

            await page.waitForTimeout(2000);
            console.log(`[HCP-FAB-TEST:${testId}] Waited 2s after Transcript Canvas click`);

            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
            console.log(`[HCP-FAB-TEST:${testId}] Step 3: Click Start Session button`);
            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);

            // Start the session - button has play icon and "Start Session" text
            const startButton = page.locator('button').filter({ hasText: 'Start Session' }).filter({ has: page.locator('i.fa-play') });
            await startButton.waitFor({ state: 'visible', timeout: 10000 });

            // Check if button is enabled before clicking
            const isEnabled = await startButton.isEnabled();
            console.log(`[HCP-FAB-TEST:${testId}] Start Session button enabled: ${isEnabled}`);

            if (!isEnabled) {
                console.error(`[HCP-FAB-TEST:${testId}] ❌ Start Session button is disabled!`);

                // Debug: Check button state
                const buttonState = await startButton.evaluate((btn: HTMLButtonElement) => ({
                    disabled: btn.disabled,
                    innerHTML: btn.innerHTML,
                    style: btn.getAttribute('style')
                }));
                console.log(`[HCP-FAB-TEST:${testId}] Button state:`, buttonState);

                throw new Error('Start Session button is disabled');
            }

            // Force log before click
            await page.evaluate(() => console.log('[HCP-FAB-TEST:BROWSER] About to click Start Session'));

            await startButton.click();
            console.log(`[HCP-FAB-TEST:${testId}] ✅ Clicked Start Session button`);

            // Force log after click
            await page.evaluate(() => console.log('[HCP-FAB-TEST:BROWSER] Clicked Start Session, session starting...'));

            await page.waitForTimeout(5000); // Wait for session to start and assets to load
            console.log(`[HCP-FAB-TEST:${testId}] Waited 5s after Start Session click - assets should be loaded`);

            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
            console.log(`[HCP-FAB-TEST:${testId}] Step 4: Analyzing FAB buttons in DOM`);
            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);

            // Get comprehensive FAB button data
            const fabButtonAnalysis = await page.evaluate(() => {
                // Find all FAB buttons
                const fabButtons = document.querySelectorAll('.asset-header-fab-button');

                const fabButtonsData = Array.from(fabButtons).map((btn, index) => {
                    const button = btn as HTMLElement;
                    return {
                        index,
                        className: button.className,
                        tagName: button.tagName,
                        id: button.id || '(no id)',
                        ariaLabel: button.getAttribute('aria-label'),
                        dataShareId: button.getAttribute('data-share-id'),
                        dataAssetType: button.getAttribute('data-asset-type'),
                        dataInstanceNumber: button.getAttribute('data-instance-number'),
                        allDataAttributes: Array.from(button.attributes)
                            .filter(attr => attr.name.startsWith('data-'))
                            .map(attr => ({ name: attr.name, value: attr.value })),
                        innerHTML: button.innerHTML,
                        offsetParent: button.offsetParent !== null, // visible check
                        boundingRect: button.getBoundingClientRect()
                    };
                });

                // Check for event listeners
                const hasClickListener = !!document.onclick ||
                    (window as any).dotNetRef !== undefined;

                return {
                    totalFabButtons: fabButtons.length,
                    fabButtons: fabButtonsData,
                    hasDotNetRef: (window as any).dotNetRef !== undefined,
                    hasClickListener
                };
            });

            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
            console.log(`[HCP-FAB-TEST:${testId}] FAB BUTTON ANALYSIS RESULTS`);
            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
            console.log(`[HCP-FAB-TEST:${testId}] Total FAB Buttons: ${fabButtonAnalysis.totalFabButtons}`);
            console.log(`[HCP-FAB-TEST:${testId}] Has DotNet Reference: ${fabButtonAnalysis.hasDotNetRef}`);
            console.log(`[HCP-FAB-TEST:${testId}] Has Click Listener: ${fabButtonAnalysis.hasClickListener}`);

            // Validate FAB buttons exist
            expect(fabButtonAnalysis.totalFabButtons).toBeGreaterThan(0);

            // Log details for each FAB button
            fabButtonAnalysis.fabButtons.forEach((btn, i) => {
                console.log(`[HCP-FAB-TEST:${testId}] ─────────────────────────────────────`);
                console.log(`[HCP-FAB-TEST:${testId}] FAB Button ${i + 1}:`);
                console.log(`[HCP-FAB-TEST:${testId}]   Class: ${btn.className}`);
                console.log(`[HCP-FAB-TEST:${testId}]   Share ID: ${btn.dataShareId}`);
                console.log(`[HCP-FAB-TEST:${testId}]   Asset Type: ${btn.dataAssetType}`);
                console.log(`[HCP-FAB-TEST:${testId}]   Instance: ${btn.dataInstanceNumber}`);
                console.log(`[HCP-FAB-TEST:${testId}]   Visible: ${btn.offsetParent}`);
                console.log(`[HCP-FAB-TEST:${testId}]   Attributes: ${btn.allDataAttributes.length}`);

                // Validate required attributes
                if (!btn.dataShareId || !btn.dataAssetType) {
                    console.error(`[HCP-FAB-TEST:${testId}] ❌ MISSING ATTRIBUTES on button ${i + 1}`);
                } else {
                    console.log(`[HCP-FAB-TEST:${testId}]   ✅ All required attributes present`);
                }
            });

            // Get first visible FAB button with all attributes
            const firstValidFabButton = fabButtonAnalysis.fabButtons.find(
                btn => btn.dataShareId && btn.dataAssetType && btn.offsetParent
            );

            if (!firstValidFabButton) {
                console.error(`[HCP-FAB-TEST:${testId}] ❌ No valid FAB button found with all attributes`);
                throw new Error('No valid FAB button found');
            }

            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
            console.log(`[HCP-FAB-TEST:${testId}] Step 5: Testing click on FAB Button ${firstValidFabButton.index + 1}`);
            console.log(`[HCP-FAB-TEST:${testId}] Target: ${firstValidFabButton.dataAssetType} - ${firstValidFabButton.dataShareId}`);
            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);

            // Click the FAB button
            const fabButtonSelector = `.asset-header-fab-button[data-share-id="${firstValidFabButton.dataShareId}"]`;
            const fabButton = page.locator(fabButtonSelector).first();

            console.log(`[HCP-FAB-TEST:${testId}] Selector: ${fabButtonSelector}`);
            console.log(`[HCP-FAB-TEST:${testId}] Waiting for FAB button to be visible...`);
            await fabButton.waitFor({ state: 'visible', timeout: 10000 });
            console.log(`[HCP-FAB-TEST:${testId}] FAB button visible, clicking...`);

            // Force log before click
            await page.evaluate((shareId) => {
                console.log(`[HCP-FAB-TEST:BROWSER] About to click FAB button: ${shareId}`);
            }, firstValidFabButton.dataShareId);

            await fabButton.click();
            console.log(`[HCP-FAB-TEST:${testId}] ✅ FAB button clicked`);

            // Force log after click
            await page.evaluate((shareId) => {
                console.log(`[HCP-FAB-TEST:BROWSER] Clicked FAB button ${shareId}, checking for ShareAsset invocation...`);
            }, firstValidFabButton.dataShareId);

            console.log(`[HCP-FAB-TEST:${testId}] Waiting 3s for asset sharing to complete...`);
            await page.waitForTimeout(3000);
            console.log(`[HCP-FAB-TEST:${testId}] Wait complete, analyzing logs...`);

            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
            console.log(`[HCP-FAB-TEST:${testId}] Step 6: Analyzing console logs`);
            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);

            // Filter console messages for HCP-FAB-TEST logs
            const fabTestLogs = consoleMessages.filter(msg =>
                msg.text.includes('[HCP-FAB-TEST]')
            );

            console.log(`[HCP-FAB-TEST:${testId}] Total Console Messages: ${consoleMessages.length}`);
            console.log(`[HCP-FAB-TEST:${testId}] HCP-FAB-TEST Logs: ${fabTestLogs.length}`);

            // Check for specific log markers in sequence
            const clickDetected = consoleMessages.some(msg =>
                msg.text.includes('[HCP-FAB-TEST]') && msg.text.includes('CLICK EVENT DETECTED')
            );
            const shareButtonFound = consoleMessages.some(msg =>
                msg.text.includes('[HCP-FAB-TEST]') && msg.text.includes('SHARE BUTTON FOUND')
            );
            const validationPassed = consoleMessages.some(msg =>
                msg.text.includes('[HCP-FAB-TEST]') && msg.text.includes('VALIDATION PASSED')
            );
            const dotNetCalled = consoleMessages.some(msg =>
                msg.text.includes('[HCP-FAB-TEST]') && msg.text.includes('DOTNET REFERENCE FOUND')
            );
            const shareAssetCompleted = consoleMessages.some(msg =>
                msg.text.includes('[HCP-FAB-TEST]') && msg.text.includes('ShareAsset completed successfully')
            );

            console.log(`[HCP-FAB-TEST:${testId}] ─────────────────────────────────────`);
            console.log(`[HCP-FAB-TEST:${testId}] Execution Flow Check:`);
            console.log(`[HCP-FAB-TEST:${testId}]   1. Click Detected: ${clickDetected ? '✅' : '❌'}`);
            console.log(`[HCP-FAB-TEST:${testId}]   2. Share Button Found: ${shareButtonFound ? '✅' : '❌'}`);
            console.log(`[HCP-FAB-TEST:${testId}]   3. Validation Passed: ${validationPassed ? '✅' : '❌'}`);
            console.log(`[HCP-FAB-TEST:${testId}]   4. DotNet Called: ${dotNetCalled ? '✅' : '❌'}`);
            console.log(`[HCP-FAB-TEST:${testId}]   5. ShareAsset Completed: ${shareAssetCompleted ? '✅' : '❌'}`);

            // Print all HCP-FAB-TEST logs for debugging
            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
            console.log(`[HCP-FAB-TEST:${testId}] ALL HCP-FAB-TEST LOGS (${fabTestLogs.length}):`);
            fabTestLogs.forEach((log, i) => {
                console.log(`[HCP-FAB-TEST:${testId}] [${i + 1}] ${log.text}`);
            });

            // Print any errors
            if (pageErrors.length > 0) {
                console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
                console.log(`[HCP-FAB-TEST:${testId}] PAGE ERRORS (${pageErrors.length}):`);
                pageErrors.forEach((error, i) => {
                    console.error(`[HCP-FAB-TEST:${testId}] [${i + 1}] ${error.message}`);
                });
            }

            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
            console.log(`[HCP-FAB-TEST:${testId}] Step 7: Assertions`);
            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);

            // Assertions to validate execution flow
            expect(clickDetected, 'Click event should be detected').toBe(true);
            expect(shareButtonFound, 'Share button should be found').toBe(true);
            expect(validationPassed, 'Validation should pass').toBe(true);
            expect(dotNetCalled, 'DotNet method should be called').toBe(true);

            // This is the critical assertion - if ShareAsset completes, the flow works
            if (!shareAssetCompleted) {
                console.error(`[HCP-FAB-TEST:${testId}] ❌ FAILURE: ShareAsset was not completed`);
                console.error(`[HCP-FAB-TEST:${testId}] This indicates the click reached handleShareButtonClick but DotNet call failed`);

                // Find and log any error messages
                const errorLogs = consoleMessages.filter(msg =>
                    msg.type === 'error' || msg.text.includes('ERROR') || msg.text.includes('❌')
                );
                if (errorLogs.length > 0) {
                    console.error(`[HCP-FAB-TEST:${testId}] Error logs found:`);
                    errorLogs.forEach((log, i) => {
                        console.error(`[HCP-FAB-TEST:${testId}] [${i + 1}] ${log.text}`);
                    });
                }
            }

            expect(shareAssetCompleted, 'ShareAsset should complete successfully').toBe(true);

            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
            console.log(`[HCP-FAB-TEST:${testId}] ✅ TEST PASSED: FAB button click flow working correctly`);
            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);

        } catch (error) {
            console.error(`[HCP-FAB-TEST:${testId}] ❌ TEST FAILED:`, error);

            // Dump all console messages for debugging
            console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
            console.log(`[HCP-FAB-TEST:${testId}] ALL CONSOLE MESSAGES (${consoleMessages.length}):`);
            consoleMessages.forEach((msg, i) => {
                console.log(`[HCP-FAB-TEST:${testId}] [${i + 1}] [${msg.type}] ${msg.text}`);
            });

            throw error;
        }
    });

    test('FAB button data attributes inspection', async ({ page }) => {
        const testId = `fab-attributes-${Date.now()}`;
        console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
        console.log(`[HCP-FAB-TEST:${testId}] Testing FAB button data attributes`);
        console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);

        // Step 1: Load URL
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        await page.waitForTimeout(3000);

        // Step 2: Click Transcript Canvas tile button
        const transcriptCanvasButton = page.locator('button[aria-pressed]').filter({ hasText: 'Transcript Canvas' }).or(
            page.locator('button[title*="Transcript Canvas"]')
        ).last();
        await transcriptCanvasButton.waitFor({ state: 'visible', timeout: 10000 });
        await transcriptCanvasButton.click();
        await page.waitForTimeout(2000);

        // Step 3: Start session
        const startButton = page.locator('button').filter({ hasText: 'Start Session' }).filter({ has: page.locator('i.fa-play') });
        await startButton.waitFor({ state: 'visible', timeout: 10000 });

        const isEnabled = await startButton.isEnabled();
        if (!isEnabled) {
            throw new Error('Start Session button is disabled');
        }

        await startButton.click();
        await page.waitForTimeout(5000);

        // Detailed attribute inspection
        const attributeInspection = await page.evaluate(() => {
            const fabButtons = document.querySelectorAll('.asset-header-fab-button');

            return Array.from(fabButtons).map((btn, index) => {
                const button = btn as HTMLElement;
                const allAttributes: Record<string, string> = {};

                Array.from(button.attributes).forEach(attr => {
                    allAttributes[attr.name] = attr.value;
                });

                // Check if asset element exists
                const shareId = button.getAttribute('data-share-id');
                const assetElement = shareId ? document.querySelector(`[data-asset-id="${shareId}"]`) : null;

                return {
                    buttonIndex: index,
                    allAttributes,
                    hasAssetElement: !!assetElement,
                    assetElementTag: assetElement?.tagName || null,
                    assetElementClass: assetElement?.className || null,
                    computedStyle: {
                        display: window.getComputedStyle(button).display,
                        visibility: window.getComputedStyle(button).visibility,
                        opacity: window.getComputedStyle(button).opacity
                    }
                };
            });
        });

        console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);
        console.log(`[HCP-FAB-TEST:${testId}] DETAILED ATTRIBUTE INSPECTION`);
        console.log(`[HCP-FAB-TEST:${testId}] ═══════════════════════════════════════`);

        attributeInspection.forEach((btn, i) => {
            console.log(`[HCP-FAB-TEST:${testId}] FAB Button ${i + 1}:`);
            console.log(`[HCP-FAB-TEST:${testId}]   All Attributes:`, JSON.stringify(btn.allAttributes, null, 2));
            console.log(`[HCP-FAB-TEST:${testId}]   Has Asset Element: ${btn.hasAssetElement}`);
            console.log(`[HCP-FAB-TEST:${testId}]   Computed Style:`, btn.computedStyle);
            console.log(`[HCP-FAB-TEST:${testId}] ─────────────────────────────────────`);
        });

        // Validate all FAB buttons have required attributes
        const invalidButtons = attributeInspection.filter(btn =>
            !btn.allAttributes['data-share-id'] || !btn.allAttributes['data-asset-type']
        );

        expect(invalidButtons.length, 'All FAB buttons should have required data attributes').toBe(0);
    });
});
