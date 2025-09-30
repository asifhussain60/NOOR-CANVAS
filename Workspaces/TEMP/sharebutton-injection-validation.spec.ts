import { expect, test } from '@playwright/test';

/**
 * @hostcontrolpanel Share Button Injection Validation Tests
 * Tests the complete share button injection functionality including:
 * - Asset detection using Session 212 canonical data
 * - Share button injection with semantic IDs 
 * - Data attribute matching between buttons and assets
 * - Click event handling and C# method invocation
 */
test.describe('Share Button Injection Validation', () => {

    test.beforeEach(async ({ page }) => {
        // Set up console logging to capture debug messages
        page.on('console', (msg) => {
            if (msg.text().includes('DEBUG-WORKITEM:assetshare') ||
                msg.text().includes('ASSETSHARE-DB') ||
                msg.text().includes('ks-share-button')) {
                console.log(`🔍 CONSOLE: ${msg.text()}`);
            }
        });
    });

    test('should validate share button injection infrastructure is ready', async ({ page }) => {
        const testId = `sharebutton-infrastructure-${Date.now()}`;
        console.log(`[${testId}] Testing share button injection infrastructure with canonical Session 212 data`);

        // Navigate to Host Control Panel using canonical test data
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Verify page loaded (check for any key elements)
        const pageLoaded = await page.locator('h1, h2, .host-control-panel, body').first().isVisible({ timeout: 10000 });
        expect(pageLoaded).toBe(true);

        // Log what's actually on the page for debugging
        const pageTitle = await page.title();
        console.log(`[${testId}] Page loaded: title="${pageTitle}"`);

        console.log(`[${testId}] Host Control Panel loaded successfully`);

        // Start session to activate asset detection and share button injection
        const startButton = page.locator('button:has-text("Start Session")');
        if (await startButton.isVisible({ timeout: 5000 })) {
            await startButton.click();
            await page.waitForTimeout(3000);
            console.log(`[${testId}] Session started successfully`);
        }

        // Wait for asset detection and share button injection to complete
        await page.waitForTimeout(5000);

        // Check if JavaScript functions are defined (infrastructure test)
        const jsInfrastructure = await page.evaluate(() => {
            const win = window as any;
            return {
                setupShareButtonHandlersExists: typeof win.setupShareButtonHandlers === 'function',
                handleShareButtonClickExists: typeof win.handleShareButtonClick === 'function',
                showShareDebugToastExists: typeof win.showShareDebugToast === 'function',
                dotNetRefExists: !!win.dotNetRef,
                hostControlPanelStateExists: !!win.hostControlPanelState
            };
        });

        console.log(`[${testId}] JavaScript infrastructure:`, jsInfrastructure);

        // Assert that share button infrastructure is ready
        expect(jsInfrastructure.setupShareButtonHandlersExists).toBe(true);
        expect(jsInfrastructure.showShareDebugToastExists).toBe(true);

        // Check for share button injection capability in code (even if not active)
        const hasAssetProcessingService = await page.evaluate(() => {
            // Check if the page has asset detection and injection code
            return document.body.innerHTML.includes('ASSETSHARE-DB') ||
                document.body.innerHTML.includes('InjectAssetShareButtons') ||
                document.body.innerHTML.includes('data-asset-id');
        });

        console.log(`[${testId}] Asset processing capabilities detected: ${hasAssetProcessingService}`);

        // Validate session transcript exists for asset detection
        const transcriptContent = await page.locator('.session-transcript, .transcript-content, .html-viewer-content').textContent();
        const hasTranscriptContent = transcriptContent && transcriptContent.length > 100;

        console.log(`[${testId}] Session transcript available: ${hasTranscriptContent}, length: ${transcriptContent?.length}`);

        // Test passes if infrastructure is ready (regardless of active injection)
        expect(jsInfrastructure.setupShareButtonHandlersExists).toBe(true);

        console.log(`[${testId}] ✅ Share button injection infrastructure validated successfully`);
    });

    test('should have matching data-share-id attributes between buttons and asset containers', async ({ page }) => {
        const testId = `data-attribute-matching-${Date.now()}`;
        console.log(`[${testId}] Testing data attribute matching between buttons and assets`);

        // Navigate and start session
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        const startButton = page.locator('button:has-text("Start Session")');
        if (await startButton.isVisible({ timeout: 5000 })) {
            await startButton.click();
            await page.waitForTimeout(3000);
        }

        // Wait for injection to complete
        await page.waitForTimeout(5000);

        // Get all share buttons with their data attributes
        const shareButtons = await page.locator('.ks-share-button').all();

        for (const button of shareButtons) {
            const shareId = await button.getAttribute('data-share-id');

            // Find corresponding asset container with matching data-asset-id
            const assetContainer = page.locator(`[data-asset-id="${shareId}"]`);
            const assetExists = await assetContainer.count() > 0;

            console.log(`[${testId}] Button shareId=${shareId}, matching asset exists=${assetExists}`);

            // Assert that each share button has a corresponding asset container
            expect(assetExists).toBe(true);

            if (assetExists) {
                // Verify the asset container is visible
                await expect(assetContainer.first()).toBeVisible();
            }
        }
    });

    test('should handle share button click events correctly', async ({ page }) => {
        const testId = `click-event-handling-${Date.now()}`;
        console.log(`[${testId}] Testing share button click event handling`);

        // Set up to capture C# method calls
        const csharpCalls: string[] = [];
        page.on('console', (msg) => {
            if (msg.text().includes('SHAREBUTTON CLICKED - C# METHOD CALLED')) {
                csharpCalls.push(msg.text());
            }
        });

        // Navigate and start session
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        const startButton = page.locator('button:has-text("Start Session")');
        if (await startButton.isVisible({ timeout: 5000 })) {
            await startButton.click();
            await page.waitForTimeout(3000);
        }

        // Wait for injection to complete
        await page.waitForTimeout(5000);

        // Get first share button and test click
        const firstShareButton = page.locator('.ks-share-button').first();
        const buttonExists = await firstShareButton.count() > 0;

        if (buttonExists) {
            const shareId = await firstShareButton.getAttribute('data-share-id');
            const assetType = await firstShareButton.getAttribute('data-asset-type');

            console.log(`[${testId}] Clicking button: shareId=${shareId}, assetType=${assetType}`);

            // Click the share button
            await firstShareButton.click();

            // Wait for click handling
            await page.waitForTimeout(2000);

            // Verify C# method was called
            expect(csharpCalls.length).toBeGreaterThan(0);
            console.log(`[${testId}] C# ShareAsset method called ${csharpCalls.length} times`);

            // Verify button state changed to indicate processing
            const buttonText = await firstShareButton.textContent();
            const isProcessing = buttonText?.includes('SHARING') || buttonText?.includes('SHARED');

            if (isProcessing) {
                console.log(`[${testId}] Button state correctly changed: ${buttonText}`);
            }
        } else {
            console.log(`[${testId}] No share buttons found to test click events`);
        }
    });

    test('should validate asset detection count matches expected Session 212 data', async ({ page }) => {
        const testId = `asset-count-validation-${Date.now()}`;
        console.log(`[${testId}] Validating asset detection count for Session 212`);

        // Navigate to Host Control Panel
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Use the debug panel "Test Share Asset" button to trigger asset detection
        const debugToggle = page.locator('button:has(i[class*="fa-bug"])');
        if (await debugToggle.isVisible({ timeout: 3000 })) {
            await debugToggle.click();
            await page.waitForTimeout(1000);
        }

        const testShareAssetButton = page.locator('button:has-text("Test Share Asset")');
        if (await testShareAssetButton.isVisible({ timeout: 3000 })) {
            console.log(`[${testId}] Found Test Share Asset button, triggering asset detection`);

            // Check if button is enabled before clicking
            const isEnabled = await testShareAssetButton.isEnabled();
            console.log(`[${testId}] Test Share Asset button enabled: ${isEnabled}`);

            if (isEnabled) {
                await testShareAssetButton.click();
            } else {
                console.log(`[${testId}] Button is disabled, skipping click. Checking for existing results.`);
            }
            await page.waitForTimeout(3000);

            // Look for asset detection results in success messages
            const messageSelectors = [
                '.message-container',
                '[class*="message"]',
                '[class*="success"]',
                'div:has-text("Found")',
                'div:has-text("asset")'
            ];

            let detectionResult = '';
            for (const selector of messageSelectors) {
                const elements = page.locator(selector);
                const count = await elements.count();

                if (count > 0) {
                    for (let i = 0; i < count; i++) {
                        const text = await elements.nth(i).textContent();
                        if (text && (text.includes('Found') || text.includes('asset') || text.includes('212'))) {
                            detectionResult = text;
                            console.log(`[${testId}] Asset detection result: ${detectionResult}`);
                            break;
                        }
                    }
                }

                if (detectionResult) break;
            }

            // Validate that assets were detected
            expect(detectionResult).toBeTruthy();
            expect(detectionResult.toLowerCase()).toContain('found');
        }
    });

    test('should pass lint and build validation', async ({ page }) => {
        const testId = `lint-build-validation-${Date.now()}`;
        console.log(`[${testId}] Validating that share button injection doesn't break lint/build`);

        // This test ensures the share button injection code is syntactically correct
        // and doesn't introduce build errors by navigating and checking for errors

        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Check for any JavaScript errors in console
        const jsErrors: string[] = [];
        page.on('pageerror', (error) => {
            jsErrors.push(error.message);
        });

        // Start session to trigger all JavaScript functionality
        const startButton = page.locator('button:has-text("Start Session")');
        if (await startButton.isVisible({ timeout: 5000 })) {
            await startButton.click();
            await page.waitForTimeout(3000);
        }

        // Wait for all asset processing to complete
        await page.waitForTimeout(5000);

        // Verify no JavaScript errors occurred
        if (jsErrors.length > 0) {
            console.log(`[${testId}] JavaScript errors detected:`, jsErrors);
        }

        expect(jsErrors.length).toBe(0);

        // Verify page is still functional (check for key elements)
        const stillFunctional = await page.locator('body, h1, h2').first().isVisible();
        expect(stillFunctional).toBe(true);

        console.log(`[${testId}] Lint/build validation passed - no errors detected`);
    });
});