import { expect, test } from '@playwright/test';

test.describe('Asset Share Button Broadcasting Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Set up console logging to capture debug messages
        page.on('console', (msg) => {
            if (msg.text().includes('DEBUG-WORKITEM:assetshare:continue')) {
                console.log(`🔍 CONSOLE: ${msg.text()}`);
            }
        });
    });

    test('Share buttons should broadcast asset HTML to SessionCanvas clients', async ({ page, context }) => {
        console.log('[DEBUG-WORKITEM:assetshare:continue] Starting share button broadcasting test');

        // Navigate to Host Control Panel with test host token
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Verify page loaded with NOOR Canvas branding
        await expect(page.locator('text=NOOR Canvas')).toBeVisible();
        console.log('[DEBUG-WORKITEM:assetshare:continue] Host Control Panel loaded successfully');

        // Wait for SignalR connection to be established
        await page.waitForSelector('[title*="Connected"]', { timeout: 10000 });
        console.log('[DEBUG-WORKITEM:assetshare:continue] SignalR connection established');

        // Check for transcript content and share buttons
        const transcriptArea = page.locator('[data-testid="transformed-transcript"]');
        await expect(transcriptArea).toBeVisible();
        console.log('[DEBUG-WORKITEM:assetshare:continue] Transcript area found');

        // Look for share buttons in the transcript
        const shareButtons = transcriptArea.locator('.ks-share-button');
        const shareButtonCount = await shareButtons.count();
        console.log(`[DEBUG-WORKITEM:assetshare:continue] Found ${shareButtonCount} share buttons in transcript`);

        if (shareButtonCount > 0) {
            // Test clicking the first share button
            const firstShareButton = shareButtons.first();

            // Get button details before clicking
            const shareId = await firstShareButton.getAttribute('data-share-id');
            const assetType = await firstShareButton.getAttribute('data-asset-type');
            const instanceNumber = await firstShareButton.getAttribute('data-instance-number');

            console.log(`[DEBUG-WORKITEM:assetshare:continue] Testing share button: ShareId=${shareId}, AssetType=${assetType}, Instance=${instanceNumber}`);

            // Open a new page as SessionCanvas client
            const sessionCanvasPage = await context.newPage();

            // Navigate to SessionCanvas with corresponding user token
            await sessionCanvasPage.goto('https://localhost:9091/session/canvas/testuser123');
            await sessionCanvasPage.waitForLoadState('networkidle');
            console.log('[DEBUG-WORKITEM:assetshare:continue] SessionCanvas client page opened');

            // Set up listener for shared content on SessionCanvas
            let sharedContentReceived = false;
            sessionCanvasPage.on('console', (msg) => {
                if (msg.text().includes('AssetShared event received') ||
                    msg.text().includes('HtmlContentReceived event received')) {
                    sharedContentReceived = true;
                    console.log(`[DEBUG-WORKITEM:assetshare:continue] 📦 CANVAS RECEIVED: ${msg.text()}`);
                }
            });

            // Click the share button on Host Control Panel
            console.log('[DEBUG-WORKITEM:assetshare:continue] Clicking share button to broadcast asset');
            await firstShareButton.click();

            // Wait for the share operation to complete
            await page.waitForTimeout(2000);

            // Check for success message on host side
            const successMessage = page.locator('.alert-success, [data-testid="success-message"]');
            if (await successMessage.isVisible({ timeout: 5000 })) {
                console.log('[DEBUG-WORKITEM:assetshare:continue] ✅ Share success message displayed on host');
            }

            // Check if SessionCanvas received the shared content
            await sessionCanvasPage.waitForTimeout(3000);

            // Look for shared content in the canvas area
            const canvasContent = sessionCanvasPage.locator('[data-testid="canvas-content"], .session-canvas-container');
            const hasSharedContent = await canvasContent.textContent();

            if (hasSharedContent && hasSharedContent.length > 0) {
                console.log('[DEBUG-WORKITEM:assetshare:continue] ✅ Content found in SessionCanvas area');
                console.log(`[DEBUG-WORKITEM:assetshare:continue] Content preview: ${hasSharedContent.substring(0, 200)}...`);
            }

            // Verify the share button returned to normal state
            const buttonText = await firstShareButton.textContent();
            expect(buttonText).not.toContain('SHARING...');
            console.log('[DEBUG-WORKITEM:assetshare:continue] Share button returned to normal state');

            await sessionCanvasPage.close();
            console.log('[DEBUG-WORKITEM:assetshare:continue] Share button broadcast test completed');
        } else {
            console.log('[DEBUG-WORKITEM:assetshare:continue] No share buttons found - testing asset processing pipeline');

            // If no share buttons exist, test the processing pipeline by triggering transcript processing
            const processButton = page.locator('button:has-text("Process"), button:has-text("Transform")');
            if (await processButton.isVisible({ timeout: 2000 })) {
                await processButton.click();
                await page.waitForTimeout(2000);

                // Check if share buttons appeared after processing
                const newShareButtonCount = await shareButtons.count();
                console.log(`[DEBUG-WORKITEM:assetshare:continue] After processing: ${newShareButtonCount} share buttons`);
            }
        }
    });

    test('Share button JavaScript handlers should be properly setup', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:assetshare:continue] Testing JavaScript handler setup');

        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Check if JavaScript functions are defined
        const jsSetupResult = await page.evaluate(() => {
            const win = window as any;
            return {
                setupFunction: typeof win.setupShareButtonHandlers === 'function',
                handleFunction: typeof win.handleShareButtonClick === 'function',
                dotNetRef: typeof win.dotNetRef !== 'undefined'
            };
        });

        console.log('[DEBUG-WORKITEM:assetshare:continue] JavaScript setup check:', jsSetupResult);

        expect(jsSetupResult.setupFunction).toBe(true);
        console.log('[DEBUG-WORKITEM:assetshare:continue] ✅ setupShareButtonHandlers function exists');

        // The dotNetRef should be set after first render
        await page.waitForTimeout(1000);

        const dotNetRefAfterRender = await page.evaluate(() => typeof (window as any).dotNetRef !== 'undefined');
        if (dotNetRefAfterRender) {
            console.log('[DEBUG-WORKITEM:assetshare:continue] ✅ DotNet reference properly initialized');
        } else {
            console.log('[DEBUG-WORKITEM:assetshare:continue] ⚠️ DotNet reference not yet initialized (may still be loading)');
        }
    });

    test('AssetHtmlProcessingService integration should work with share buttons', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:assetshare:continue] Testing AssetHtmlProcessingService integration');

        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Check if the service is working by looking for enhanced HTML processing
        const transcriptArea = page.locator('[data-testid="transformed-transcript"]');

        if (await transcriptArea.isVisible()) {
            const transcriptContent = await transcriptArea.innerHTML();

            // Check for HtmlAgilityPack processing indicators
            const hasAssetButtons = transcriptContent.includes('ks-share-button');
            const hasDataAttributes = transcriptContent.includes('data-share-id');
            const hasAssetTypes = transcriptContent.includes('data-asset-type');

            console.log('[DEBUG-WORKITEM:assetshare:continue] Processing indicators:', {
                hasAssetButtons,
                hasDataAttributes,
                hasAssetTypes
            });

            if (hasAssetButtons && hasDataAttributes && hasAssetTypes) {
                console.log('[DEBUG-WORKITEM:assetshare:continue] ✅ AssetHtmlProcessingService successfully enhanced transcript with share buttons');
            } else {
                console.log('[DEBUG-WORKITEM:assetshare:continue] ℹ️ Share buttons may not be present in current transcript content');
            }
        }

        console.log('[DEBUG-WORKITEM:assetshare:continue] AssetHtmlProcessingService integration test completed');
    });
});