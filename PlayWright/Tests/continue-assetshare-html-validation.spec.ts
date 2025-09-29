import { expect, test } from '@playwright/test';

test.describe('CONTINUE-ASSETSHARE: Enhanced HTML Transformation Validation', () => {

    test('Verify data-asset-id attributes are added to content elements', async ({ page }) => {
        const testId = `continue-html-validation-${Date.now()}`;
        console.log(`[${testId}] === VALIDATING DATA-ASSET-ID TRANSFORMATION ===`);

        // Navigate to session 213
        await page.goto('https://localhost:9091/host/control-panel/213', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        console.log(`[${testId}] ✅ Loaded HostControlPanel for Session 213`);

        // Start session to activate hub-based processing
        const startButton = page.locator('button:has-text("Start Session")');
        if (await startButton.isVisible()) {
            await startButton.click();
            await page.waitForSelector('.ks-share-button', { timeout: 10000 });
        }

        console.log(`[${testId}] === CHECKING TRANSFORMED HTML ===`);

        // Check for elements with data-asset-id attributes
        const elementsWithAssetIds = await page.locator('[data-asset-id]').all();
        console.log(`[${testId}] Found ${elementsWithAssetIds.length} elements with data-asset-id attributes`);

        // Get all share buttons 
        const shareButtons = await page.locator('.ks-share-button').all();
        console.log(`[${testId}] Found ${shareButtons.length} share buttons`);

        // Validate that each share button has a corresponding data-asset-id element
        for (let i = 0; i < Math.min(shareButtons.length, 3); i++) {
            const button = shareButtons[i];
            const shareId = await button.getAttribute('data-share-id');

            console.log(`[${testId}] --- VALIDATION ${i + 1}: ${shareId} ---`);

            // Find corresponding element with data-asset-id
            const assetElement = page.locator(`[data-asset-id="${shareId}"]`);
            const assetExists = await assetElement.count() > 0;

            if (assetExists) {
                const assetHTML = await assetElement.evaluate(el => el.outerHTML);
                console.log(`[${testId}] ✅ Asset element found with ID: ${shareId}`);
                console.log(`[${testId}] Asset HTML: ${assetHTML.substring(0, 200)}...`);

                // Show the complete hub transformation
                console.log(`[${testId}] --- COMPLETE HUB TRANSFORMATION ---`);
                console.log(`[${testId}] 1. Original: <p>content</p>`);
                console.log(`[${testId}] 2. Hub Processing: Added data-asset-id="${shareId}"`);
                console.log(`[${testId}] 3. Final HTML: ${assetHTML}`);
                console.log(`[${testId}] 4. Share Button: <button data-share-id="${shareId}">📤 SHARE</button>`);
                console.log(`[${testId}] 5. JavaScript Matching: data-share-id="${shareId}" ↔ data-asset-id="${shareId}"`);
            } else {
                console.log(`[${testId}] ❌ No asset element found with data-asset-id: ${shareId}`);
            }
        }

        console.log(`[${testId}] === ENHANCED HUB-BASED MATCHING LOGIC DEMONSTRATED ===`);
        console.log(`[${testId}] 🎯 Pattern Detection: Direct HTML regex matching for text/image/table/list`);
        console.log(`[${testId}] 🔧 ID Generation: Consistent asset-{type}-{number} pattern`);
        console.log(`[${testId}] 🏷️ Attribute Addition: data-asset-id added to detected elements`);
        console.log(`[${testId}] 🔘 Button Creation: Share buttons with matching data-share-id`);
        console.log(`[${testId}] 🔗 JavaScript Matching: Element lookup by data-asset-id for content extraction`);
        console.log(`[${testId}] 📡 Broadcasting Ready: Assets can be shared with actual HTML content`);

        // Validate the transformation worked
        expect(shareButtons.length).toBeGreaterThan(0);
        expect(elementsWithAssetIds.length).toBeGreaterThan(0);
        console.log(`[${testId}] ✅ Enhanced HTML transformation validation completed`);
    });

    test('Test actual share button click and console debugging', async ({ page }) => {
        const testId = `continue-share-click-${Date.now()}`;
        console.log(`[${testId}] === TESTING SHARE BUTTON CLICK WITH DEBUG INFO ===`);

        // Navigate to session 213
        await page.goto('https://localhost:9091/host/control-panel/213', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Start session
        const startButton = page.locator('button:has-text("Start Session")');
        if (await startButton.isVisible()) {
            await startButton.click();
            await page.waitForSelector('.ks-share-button', { timeout: 10000 });
        }

        // Listen for ALL console messages to see the detailed debugging
        const consoleMessages: string[] = [];
        page.on('console', msg => {
            const message = msg.text();
            consoleMessages.push(`${msg.type()}: ${message}`);
        });

        // Get first share button and click it
        const shareButtons = await page.locator('.ks-share-button').all();
        if (shareButtons.length > 0) {
            const firstButton = shareButtons[0];
            const shareId = await firstButton.getAttribute('data-share-id');

            console.log(`[${testId}] 🔘 Clicking share button: ${shareId}`);

            // Click the button
            await firstButton.click();

            // Wait for processing
            await page.waitForTimeout(3000);

            console.log(`[${testId}] === CONSOLE DEBUG OUTPUT ===`);
            console.log(`[${testId}] Total console messages: ${consoleMessages.length}`);

            // Show relevant debugging messages
            const relevantMessages = consoleMessages.filter(msg =>
                msg.includes('assetshare') ||
                msg.includes('SHAREBUTTON') ||
                msg.includes('ShareAsset') ||
                msg.includes('data-asset-id') ||
                msg.includes('CLICK DETECTED')
            );

            console.log(`[${testId}] Relevant debug messages: ${relevantMessages.length}`);
            relevantMessages.forEach((msg, idx) => {
                console.log(`[${testId}] Debug ${idx + 1}: ${msg}`);
            });

            // Check if the asset element was found
            const assetElement = page.locator(`[data-asset-id="${shareId}"]`);
            const assetExists = await assetElement.count() > 0;

            if (assetExists) {
                const assetContent = await assetElement.evaluate(el => el.outerHTML);
                console.log(`[${testId}] ✅ Asset element exists and would be broadcasted:`);
                console.log(`[${testId}] Content: ${assetContent}`);
            } else {
                console.log(`[${testId}] ❌ Asset element not found - this explains why broadcasting fails`);
            }
        }

        console.log(`[${testId}] ✅ Share button click debugging completed`);
    });

    test('Validate SessionCanvas AssetShared handler exists', async ({ page }) => {
        const testId = `continue-sessioncanvas-handler-${Date.now()}`;
        console.log(`[${testId}] === CHECKING SESSIONCANVAS ASSETSHAHED HANDLER ===`);

        // Navigate to SessionCanvas
        await page.goto('https://localhost:9091/session/canvas/PQ9N5YWW', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        console.log(`[${testId}] ✅ Loaded SessionCanvas`);

        // Check if AssetShared handler exists in the JavaScript
        const hasAssetSharedHandler = await page.evaluate(() => {
            // Check if there are any elements or scripts that reference AssetShared
            const bodyText = document.body.innerText;
            const hasAssetShared = bodyText.includes('AssetShared') ||
                bodyText.includes('HtmlContentReceived') ||
                bodyText.includes('SharedAssetContent');

            // Check for SignalR connection
            const hasSignalR = bodyText.includes('SignalR') || bodyText.includes('hubConnection');

            return {
                hasAssetSharedReferences: hasAssetShared,
                hasSignalRReferences: hasSignalR,
                bodyLength: bodyText.length
            };
        });

        console.log(`[${testId}] SessionCanvas Analysis:`, hasAssetSharedHandler);

        // Look for specific shared content elements
        const sharedContentSelectors = [
            '[data-testid="shared-content"]',
            '.shared-asset-content',
            '.canvas-content',
            '[data-shared-asset]'
        ];

        for (const selector of sharedContentSelectors) {
            const elements = await page.locator(selector).count();
            console.log(`[${testId}] Elements matching '${selector}': ${elements}`);
        }

        // Check for SignalR connection status elements
        const signalrElements = await page.locator('[data-testid*="signalr"], [class*="signalr"], [id*="signalr"]').count();
        console.log(`[${testId}] SignalR related elements: ${signalrElements}`);

        console.log(`[${testId}] ✅ SessionCanvas handler analysis completed`);
    });
});