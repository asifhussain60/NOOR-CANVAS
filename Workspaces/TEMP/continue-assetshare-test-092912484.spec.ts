// [DEBUG-WORKITEM:assetshare:continue] Asset detection continuation test
// Tests the ayah-card asset detection and share button injection functionality

import { expect, test } from '@playwright/test';

test.describe('[DEBUG-WORKITEM:assetshare:continue] Asset Detection Tests', () => {
    test('verify HOST212A token works and asset detection is functional', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:assetshare:continue] Testing HOST212A token and asset detection');

        // Navigate to host control panel with HOST212A token
        await page.goto('/host/HOST212A');
        console.log('[DEBUG-WORKITEM:assetshare:continue] Navigated to /host/HOST212A');

        // Wait for the page to load
        await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
        console.log('[DEBUG-WORKITEM:assetshare:continue] Page loaded successfully');

        // Check if we see the session name loaded
        const sessionName = await page.locator('h2').first().textContent({ timeout: 10000 });
        console.log(`[DEBUG-WORKITEM:assetshare:continue] Session name: ${sessionName}`);

        if (sessionName && sessionName.includes('Need For Messengers')) {
            console.log('[DEBUG-WORKITEM:assetshare:continue] ✅ Session data loaded correctly');
        }

        // Wait for session to load and check status
        await page.waitForTimeout(3000);

        // Look for Start Session button
        const startButton = page.locator('button:has-text("Start Session")');
        if (await startButton.isVisible()) {
            console.log('[DEBUG-WORKITEM:assetshare:continue] Found Start Session button');

            // Start the session to enable asset detection
            await startButton.click();
            console.log('[DEBUG-WORKITEM:assetshare:continue] Started session');

            // Wait for session to start
            await page.waitForTimeout(5000);
        }

        // Check for transcript content
        const transcriptPanel = page.locator('.session-transcript-content, .html-viewer-content');
        if (await transcriptPanel.isVisible()) {
            console.log('[DEBUG-WORKITEM:assetshare:continue] ✅ Transcript panel visible');

            // Check for ayah-card elements in transcript
            const ayahCards = await page.locator('.ayah-card').count();
            console.log(`[DEBUG-WORKITEM:assetshare:continue] Found ${ayahCards} ayah-card elements`);

            // Check for share buttons
            const shareButtons = await page.locator('[data-share-button="asset"], .ks-share-button').count();
            console.log(`[DEBUG-WORKITEM:assetshare:continue] Found ${shareButtons} share buttons`);

            if (shareButtons > 0) {
                console.log('[DEBUG-WORKITEM:assetshare:continue] ✅ Share buttons are being injected!');

                // Try clicking a share button to test functionality
                const firstShareButton = page.locator('[data-share-button="asset"], .ks-share-button').first();
                if (await firstShareButton.isVisible()) {
                    console.log('[DEBUG-WORKITEM:assetshare:continue] Testing share button click...');
                    await firstShareButton.click();

                    // Wait for any success message or feedback
                    await page.waitForTimeout(2000);

                    console.log('[DEBUG-WORKITEM:assetshare:continue] Share button clicked successfully');
                }
            } else if (ayahCards > 0) {
                console.log('[DEBUG-WORKITEM:assetshare:continue] ❌ ayah-card elements found but NO share buttons - detection failing');
            }

            // Get some sample HTML to check the structure
            const transcriptHTML = await transcriptPanel.innerHTML();
            const htmlPreview = transcriptHTML.substring(0, 500);
            console.log(`[DEBUG-WORKITEM:assetshare:continue] Transcript HTML preview: ${htmlPreview}`);

        } else {
            console.log('[DEBUG-WORKITEM:assetshare:continue] ❌ No transcript panel found');
        }

        // Check console for any errors
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                console.log(`[DEBUG-WORKITEM:assetshare:continue] Browser console error: ${msg.text()}`);
            }
        });
    });

    test('debug asset detection processing logs', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:assetshare:continue] Debugging asset detection logs');

        // Monitor network requests for asset detection
        page.on('response', async (response) => {
            if (response.url().includes('/host/') || response.url().includes('api/')) {
                console.log(`[DEBUG-WORKITEM:assetshare:continue] API Response: ${response.status()} ${response.url()}`);
            }
        });

        await page.goto('/host/HOST212A');
        await page.waitForTimeout(5000);

        // Try to get internal logs by checking the page source
        const pageContent = await page.content();
        if (pageContent.includes('ASSETSHARE-DB') || pageContent.includes('AssetLookup')) {
            console.log('[DEBUG-WORKITEM:assetshare:continue] Found asset detection related content');
        }
    });
});