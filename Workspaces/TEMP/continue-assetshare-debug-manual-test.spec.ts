import { test } from '@playwright/test';

/**
 * [DEBUG-WORKITEM:assetshare:continue] Manual test for ayah-card detection debugging
 * Tests if application can detect ayah-card elements with Session 212 
 * Uses HOST token: PQ9N5YWW, USER token: KJAHA99L from terminal output
 */

test.describe('Continue AssetShare - Ayah Card Detection Debug', () => {

    test('should start app and navigate to session 212 host control panel', async ({ page }) => {
        console.log('[DEBUG] Starting ayah-card detection test for Session 212');

        // Navigate to host control panel with Session 212 host token
        const hostToken = 'PQ9N5YWW'; // From terminal logs for Session 212
        await page.goto(`https://localhost:9091/host/control-panel/${hostToken}`);

        // Wait for page to fully load
        await page.waitForSelector('h1', { timeout: 30000 });

        // Log page title and check if control panel loaded
        const title = await page.title();
        console.log(`[DEBUG] Page loaded - Title: ${title}`);

        // Check if session information is displayed
        const sessionName = await page.locator('h2').first().textContent();
        console.log(`[DEBUG] Session Name: ${sessionName}`);

        // Look for transcript content
        const transcriptExists = await page.locator('.session-transcript-content').count() > 0;
        console.log(`[DEBUG] Transcript content exists: ${transcriptExists}`);

        if (transcriptExists) {
            // Check for ayah-card elements in the transcript
            const ayahCards = await page.locator('.ayah-card').count();
            console.log(`[DEBUG] Found ${ayahCards} ayah-card elements in transcript`);

            // Check for share buttons
            const shareButtons = await page.locator('.ks-share-button, .ks-share-btn').count();
            console.log(`[DEBUG] Found ${shareButtons} share buttons in transcript`);

            // Check database connection by looking for any debug logs
            await page.waitForTimeout(2000); // Wait for any async operations

            // If ayah-cards exist but no share buttons, there's a detection issue
            if (ayahCards > 0 && shareButtons === 0) {
                console.log('[DEBUG] ❌ ISSUE FOUND: ayah-card elements exist but no share buttons were injected');
                console.log('[DEBUG] This indicates the InjectAssetShareButtonsDatabaseAsync method is not detecting them');
            } else if (ayahCards > 0 && shareButtons > 0) {
                console.log('[DEBUG] ✅ SUCCESS: Both ayah-cards and share buttons found - detection working');
            } else {
                console.log('[DEBUG] ℹ️ INFO: No ayah-card elements found in transcript - may be expected');
            }

            // Log first few elements for debugging
            const firstAyahCard = await page.locator('.ayah-card').first();
            if (await firstAyahCard.count() > 0) {
                const ayahText = await firstAyahCard.textContent();
                console.log(`[DEBUG] First ayah-card content: ${ayahText?.substring(0, 100)}...`);
            }
        }

        // Take a screenshot for manual review
        await page.screenshot({ path: 'Workspaces/TEMP/continue-assetshare-debug-screenshot.png', fullPage: true });
        console.log('[DEBUG] Screenshot saved to Workspaces/TEMP/continue-assetshare-debug-screenshot.png');
    });

    test('should trigger test share asset to verify SignalR works', async ({ page }) => {
        console.log('[DEBUG] Testing SignalR asset sharing with TestShareAsset method');

        const hostToken = 'PQ9N5YWW';
        await page.goto(`https://localhost:9091/host/control-panel/${hostToken}`);
        await page.waitForSelector('h1', { timeout: 30000 });

        // Look for test share asset button (from previous terminal logs)
        const testButton = await page.locator('button:has-text("Test Share Asset")');
        if (await testButton.count() > 0) {
            console.log('[DEBUG] Found TestShareAsset button, clicking...');
            await testButton.click();

            // Wait and check for success indication
            await page.waitForTimeout(2000);
            console.log('[DEBUG] TestShareAsset button clicked - check terminal logs for SignalR broadcast');
        } else {
            console.log('[DEBUG] TestShareAsset button not found - may be in different UI state');
        }
    });

});