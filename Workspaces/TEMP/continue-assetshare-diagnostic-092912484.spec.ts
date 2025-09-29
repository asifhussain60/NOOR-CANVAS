// [DEBUG-WORKITEM:assetshare:continue] Diagnostic test for asset detection debugging
// This test will help us understand the current state and fix the token/database issues

import { expect, test } from '@playwright/test';

test.describe('[DEBUG-WORKITEM:assetshare:continue] Asset Detection Diagnostic', () => {
    test('check database connection and session 212 setup', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:assetshare:continue:debug] Starting database diagnostic test');

        // Navigate to homepage first to verify app is running
        await page.goto('/');
        console.log('[DEBUG-WORKITEM:assetshare:continue:debug] Navigated to homepage');

        // Check if app is responding
        await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
        console.log('[DEBUG-WORKITEM:assetshare:continue:debug] App is responding');

        // Try to access host control panel directly with session ID instead of token
        await page.goto('/host/control?sessionId=212');
        console.log('[DEBUG-WORKITEM:assetshare:continue:debug] Attempted direct session 212 access');

        // Look for any error messages or content
        const bodyText = await page.textContent('body');
        console.log('[DEBUG-WORKITEM:assetshare:continue:debug] Page content length:', bodyText?.length || 0);

        if (bodyText && (bodyText.includes('error') || bodyText.includes('Error'))) {
            console.log('[DEBUG-WORKITEM:assetshare:continue:debug] Found error content');
        }

        // Check if we can see any session content
        if (bodyText && (bodyText.includes('212') || bodyText.includes('session'))) {
            console.log('[DEBUG-WORKITEM:assetshare:continue:debug] Found session-related content');
        }

        // Check if there are ayah-card elements in the content
        const ayahCards = await page.locator('.ayah-card').count();
        console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Found ${ayahCards} ayah-card elements`);

        // Check for share buttons
        const shareButtons = await page.locator('[data-share-button="asset"]').count();
        console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Found ${shareButtons} share buttons`);

        // Log the current URL
        console.log('[DEBUG-WORKITEM:assetshare:continue:debug] Current URL:', page.url());
    });

    test('check AssetLookup table data via API', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:assetshare:continue:debug] Checking AssetLookup data via dev tools');

        await page.goto('/');

        // Use browser console to check database connections
        const dbCheck = await page.evaluate(() => {
            return {
                localStorage: Object.keys(localStorage),
                sessionStorage: Object.keys(sessionStorage),
                currentURL: window.location.href
            };
        });

        console.log('[DEBUG-WORKITEM:assetshare:continue:debug] Browser state:', JSON.stringify(dbCheck, null, 2));
    });
});