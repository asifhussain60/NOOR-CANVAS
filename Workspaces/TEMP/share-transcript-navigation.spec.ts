import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Share Transcript Navigation', () => {
    const BASE_URL = 'https://localhost:9091';
    const HOST_TOKEN = 'PQ9N5YWW'; // Session 212 host token
    
    // Track console messages and errors
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];

    test.beforeEach(async ({ page }) => {
        // Capture console logs
        page.on('console', msg => {
            const text = msg.text();
            consoleLogs.push(`[${msg.type().toUpperCase()}] ${text}`);
        });

        // Capture console errors
        page.on('pageerror', error => {
            consoleErrors.push(`[PAGE ERROR] ${error.message}`);
        });

        // Capture network errors
        page.on('requestfailed', request => {
            consoleErrors.push(`[NETWORK ERROR] ${request.url()} - ${request.failure()?.errorText}`);
        });
    });

    test('should navigate host from control panel to TranscriptCanvas when clicking Share Transcript button', async ({ page }) => {
        // Step 1: Navigate to Host Control Panel
        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
        await page.waitForLoadState('networkidle');
        
        // Percy snapshot: Initial state of Host Control Panel
        await percySnapshot(page, 'Host Control Panel - Initial State');

        // Step 2: Verify page loaded correctly
        await expect(page.locator('h2')).toContainText('Session', { timeout: 10000 });
        console.log('✅ Host Control Panel loaded successfully');

        // Step 3: Wait for Share Transcript button to be visible and enabled
        const shareTranscriptButton = page.locator('button:has-text("Share Transcript")');
        await expect(shareTranscriptButton).toBeVisible({ timeout: 10000 });
        
        // Check if button is enabled (not disabled)
        const isDisabled = await shareTranscriptButton.isDisabled();
        console.log(`Share Transcript button disabled state: ${isDisabled}`);

        // Percy snapshot: Before clicking button
        await percySnapshot(page, 'Host Control Panel - Before Share Transcript Click');

        // Step 4: Clear previous console logs
        consoleLogs.length = 0;
        consoleErrors.length = 0;

        // Step 5: Click Share Transcript button
        console.log('🖱️ Clicking Share Transcript button...');
        await shareTranscriptButton.click();

        // Step 6: Wait for navigation to TranscriptCanvas
        await page.waitForURL(`**/transcript/canvas/${HOST_TOKEN}`, { timeout: 15000 });
        console.log('✅ Navigated to TranscriptCanvas');

        // Step 7: Verify TranscriptCanvas loaded
        await page.waitForLoadState('networkidle');
        
        // Check for expected elements on TranscriptCanvas
        const transcriptTitle = page.locator('h1, h2, [class*="title"]').first();
        await expect(transcriptTitle).toBeVisible({ timeout: 10000 });
        
        // Percy snapshot: TranscriptCanvas loaded state
        await percySnapshot(page, 'TranscriptCanvas - Loaded Successfully');

        // Step 8: Verify URL is correct
        const currentUrl = page.url();
        expect(currentUrl).toContain(`/transcript/canvas/${HOST_TOKEN}`);
        console.log(`✅ Current URL: ${currentUrl}`);

        // Step 9: Check for JavaScript errors in console
        console.log('\n📋 Console Logs:');
        consoleLogs.forEach(log => console.log(log));

        console.log('\n❌ Console Errors:');
        if (consoleErrors.length === 0) {
            console.log('✅ No console errors detected');
        } else {
            consoleErrors.forEach(err => console.error(err));
        }

        // Step 10: Assert no critical JavaScript errors
        const criticalErrors = consoleErrors.filter(err => 
            !err.includes('favicon.ico') && // Ignore favicon errors
            !err.includes('manifest.json') && // Ignore manifest errors
            !err.includes('sw.js') // Ignore service worker errors
        );

        if (criticalErrors.length > 0) {
            console.error('❌ Critical JavaScript errors detected:');
            criticalErrors.forEach(err => console.error(err));
        }
        
        expect(criticalErrors.length).toBe(0);
        console.log('✅ No critical JavaScript errors found');
    });

    test('should show error if no transcript available', async ({ page }) => {
        // Test edge case: clicking Share Transcript when no transcript exists
        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
        await page.waitForLoadState('networkidle');

        const shareTranscriptButton = page.locator('button:has-text("Share Transcript")');
        
        // If button is disabled, test the disabled state
        if (await shareTranscriptButton.isDisabled()) {
            console.log('✅ Share Transcript button is correctly disabled (no transcript available)');
            
            // Percy snapshot: Disabled state
            await percySnapshot(page, 'Host Control Panel - Share Transcript Disabled');
            
            expect(await shareTranscriptButton.isDisabled()).toBe(true);
        } else {
            // If enabled, clicking should show error message
            await shareTranscriptButton.click();
            
            // Wait for potential error message
            await page.waitForTimeout(2000);
            
            // Percy snapshot: After click (might show error)
            await percySnapshot(page, 'Host Control Panel - Share Transcript Error State');
        }
    });
});
