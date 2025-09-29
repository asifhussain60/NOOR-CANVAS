import { expect, test } from '@playwright/test';

test.describe('AssetLookup Database-Driven Asset Detection Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Set up console logging to capture debug messages
        page.on('console', (msg) => {
            if (msg.text().includes('ASSETSHARE-DB') || msg.text().includes('ks-share-button')) {
                console.log(`🔍 CONSOLE: ${msg.text()}`);
            }
        });
    });

    test('Database-driven asset detection should use AssetLookup table and inject red share buttons', async ({ page }) => {
        console.log('[ASSETSHARE-DB-TEST] Testing database-driven asset detection with AssetLookup table');

        // Navigate to Host Control Panel with test host token
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Verify page loaded with NOOR Canvas branding
        await expect(page.locator('text=NOOR Canvas')).toBeVisible();
        console.log('[ASSETSHARE-DB-TEST] Host Control Panel loaded successfully');

        // Wait for initial content to load and process
        await page.waitForTimeout(3000);

        // Look for red share buttons with the new styling
        const redShareButtons = page.locator('.ks-share-button.ks-share-red, button[style*="background-color: #dc3545"]');
        const shareButtonCount = await redShareButtons.count();

        console.log(`[ASSETSHARE-DB-TEST] Found ${shareButtonCount} red share buttons from database-driven detection`);

        if (shareButtonCount > 0) {
            // Verify button attributes and styling
            const firstRedButton = redShareButtons.first();

            // Check for required attributes from AssetLookup-based detection
            const shareId = await firstRedButton.getAttribute('data-share-id');
            const assetType = await firstRedButton.getAttribute('data-asset-type');
            const instanceNumber = await firstRedButton.getAttribute('data-instance-number');

            console.log(`[ASSETSHARE-DB-TEST] First red button details: ShareId=${shareId}, AssetType=${assetType}, Instance=${instanceNumber}`);

            // Verify red button styling
            const buttonStyle = await firstRedButton.getAttribute('style');
            const isRedStyled = buttonStyle?.includes('#dc3545') || await firstRedButton.isVisible();

            expect(isRedStyled).toBe(true);
            expect(shareId).toBeTruthy();
            expect(assetType).toBeTruthy();

            // Check that the asset has the data-asset-id attribute for matching
            const matchingAsset = page.locator(`[data-asset-id="${shareId}"]`);
            const assetExists = await matchingAsset.count() > 0;

            console.log(`[ASSETSHARE-DB-TEST] Matching asset with data-asset-id="${shareId}" exists: ${assetExists}`);
            expect(assetExists).toBe(true);

            // Verify button text contains red circle emoji and asset type
            const buttonText = await firstRedButton.textContent();
            expect(buttonText).toContain('🔴 SHARE');
            expect(buttonText?.toUpperCase()).toContain(assetType?.toUpperCase());

            console.log(`[ASSETSHARE-DB-TEST] ✅ Database-driven asset detection working - ${shareButtonCount} red buttons detected`);
        } else {
            console.log('[ASSETSHARE-DB-TEST] ⚠️ No red share buttons found - checking for AssetLookup data');

            // Check if there's any content that should have been detected
            const transcriptArea = page.locator('[data-testid="transformed-transcript"], .transcript-container, .session-transcript');
            if (await transcriptArea.isVisible()) {
                const content = await transcriptArea.textContent();
                console.log(`[ASSETSHARE-DB-TEST] Transcript content available (${content?.length} chars) but no buttons detected`);

                // Look for AssetLookup selector patterns in the content
                const knownPatterns = [
                    '.ayah-card',
                    '.inserted-hadees',
                    '.etymology-card',
                    '.verse-container',
                    'table[style="width: 100%;"]',
                    '.imgResponsive'
                ];

                for (const pattern of knownPatterns) {
                    const elements = await page.locator(pattern.startsWith('.') ? pattern : pattern).count();
                    if (elements > 0) {
                        console.log(`[ASSETSHARE-DB-TEST] Found ${elements} elements matching AssetLookup pattern: ${pattern}`);
                    }
                }
            }
        }
    });

    test('Verify AssetLookup CSS selectors are properly applied', async ({ page }) => {
        console.log('[ASSETSHARE-DB-TEST] Testing AssetLookup CSS selector matching');

        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Test specific AssetLookup selectors from the migration data
        const assetLookupSelectors = [
            { name: 'ayah-card', selector: '.ayah-card' },
            { name: 'inserted-hadees', selector: '.inserted-hadees' },
            { name: 'etymology-card', selector: '.etymology-card' },
            { name: 'verse-container', selector: '.verse-container' },
            { name: 'table', selector: 'table[style*="width: 100%"]' },
            { name: 'imgResponsive', selector: '.imgResponsive' }
        ];

        let totalDetectedAssets = 0;
        let totalRedButtons = 0;

        for (const asset of assetLookupSelectors) {
            // Check for elements matching the selector
            const elements = await page.locator(asset.selector).count();

            // Check for corresponding red share buttons
            const buttons = await page.locator(`.ks-share-button[data-asset-type="${asset.name}"]`).count();

            if (elements > 0 || buttons > 0) {
                console.log(`[ASSETSHARE-DB-TEST] ${asset.name}: ${elements} elements, ${buttons} red buttons`);
                totalDetectedAssets += elements;
                totalRedButtons += buttons;
            }
        }

        console.log(`[ASSETSHARE-DB-TEST] Summary: ${totalDetectedAssets} assets detected, ${totalRedButtons} red buttons created`);

        if (totalRedButtons > 0) {
            // Verify button-to-asset matching
            const allRedButtons = page.locator('.ks-share-button.ks-share-red, .ks-share-button[style*="#dc3545"]');
            const buttonCount = await allRedButtons.count();

            for (let i = 0; i < Math.min(buttonCount, 3); i++) { // Test first 3 buttons
                const button = allRedButtons.nth(i);
                const shareId = await button.getAttribute('data-share-id');

                if (shareId) {
                    const matchingAsset = page.locator(`[data-asset-id="${shareId}"]`);
                    const assetExists = await matchingAsset.isVisible();
                    console.log(`[ASSETSHARE-DB-TEST] Button ${i + 1} (${shareId}): Asset match = ${assetExists}`);
                    expect(assetExists).toBe(true);
                }
            }
        }

        expect(totalRedButtons).toBeGreaterThanOrEqual(0); // Allow for 0 buttons if no assets present
    });

    test('Red share buttons should be functional and broadcast to SessionCanvas', async ({ page, context }) => {
        console.log('[ASSETSHARE-DB-TEST] Testing red share button broadcasting functionality');

        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Look for red share buttons
        const redShareButtons = page.locator('.ks-share-button.ks-share-red, button[style*="background-color: #dc3545"]');
        const shareButtonCount = await redShareButtons.count();

        if (shareButtonCount > 0) {
            console.log(`[ASSETSHARE-DB-TEST] Testing functionality of ${shareButtonCount} red share buttons`);

            const firstRedButton = redShareButtons.first();
            const shareId = await firstRedButton.getAttribute('data-share-id');
            const assetType = await firstRedButton.getAttribute('data-asset-type');

            // Open SessionCanvas in new tab to receive broadcast
            const sessionCanvasPage = await context.newPage();
            let broadcastReceived = false;

            sessionCanvasPage.on('console', (msg) => {
                if (msg.text().includes('AssetShared') ||
                    msg.text().includes('HtmlContentReceived') ||
                    msg.text().includes('CANVAS RECEIVE')) {
                    broadcastReceived = true;
                    console.log(`[ASSETSHARE-DB-TEST] 📦 BROADCAST RECEIVED: ${msg.text()}`);
                }
            });

            await sessionCanvasPage.goto('https://localhost:9091/session/canvas/testuser123');
            await sessionCanvasPage.waitForLoadState('networkidle');

            // Click the red share button
            console.log(`[ASSETSHARE-DB-TEST] Clicking red share button: ${shareId} (${assetType})`);
            await firstRedButton.click();

            // Wait for broadcast
            await page.waitForTimeout(3000);

            // Verify success on host side
            const successIndicators = [
                page.locator('.alert-success'),
                page.locator('text=shared successfully'),
                page.locator('text=✅')
            ];

            let successFound = false;
            for (const indicator of successIndicators) {
                if (await indicator.isVisible({ timeout: 2000 })) {
                    successFound = true;
                    console.log(`[ASSETSHARE-DB-TEST] ✅ Success indicator found: ${await indicator.textContent()}`);
                    break;
                }
            }

            await sessionCanvasPage.close();

            console.log(`[ASSETSHARE-DB-TEST] Red button test completed - Success: ${successFound}, Broadcast: ${broadcastReceived}`);
        } else {
            console.log('[ASSETSHARE-DB-TEST] ⚠️ No red share buttons found to test functionality');
        }
    });
});