/**
 * @fileoverview Test to verify SafeHtmlRenderingService is working after Enhanced Processor cleanup
 * Validates that Session Transcript rendering works with the new implementation
 */

import { expect, test } from '@playwright/test';

test.describe('HostCanvas - SafeHtmlRenderingService Verification @hostcanvas', () => {
    test('should verify SafeHtmlRenderingService renders transcript content correctly', async ({ page }) => {
        console.log('[PLAYWRIGHT] [DEBUG-WORKITEM:hostcanvas:continue] Starting SafeHtmlRenderingService verification test ;CLEANUP_OK');

        // Navigate to host page
        await page.goto('/host');
        console.log('[PLAYWRIGHT] Host page loaded');

        // Check page title to verify we're on the right page
        await expect(page).toHaveTitle(/NoorCanvas/);

        // Look for the Load Control Panel button
        const loadButton = page.locator('button', { hasText: 'Load Control Panel' });
        await expect(loadButton).toBeVisible();

        console.log('[PLAYWRIGHT] Load Control Panel button found, clicking...');
        await loadButton.click();

        // Wait for the control panel to load
        await page.waitForTimeout(2000);

        // Look for the transcript container with the SafeHtmlRenderingService output
        const transcriptContainer = page.locator('[data-testid="transcript-container"]');

        console.log('[PLAYWRIGHT] Checking if transcript container is visible...');
        if (await transcriptContainer.isVisible()) {
            console.log('[PLAYWRIGHT] ✅ Transcript container found');

            // Get the HTML content to check if SafeHtmlRenderingService rendered it
            const containerHTML = await transcriptContainer.innerHTML();
            console.log('[PLAYWRIGHT] Container HTML length:', containerHTML.length);

            // Check if content is being rendered (not showing loading message)
            const hasContent = containerHTML.length > 100; // SafeHtmlRenderingService should produce substantial content
            console.log('[PLAYWRIGHT] Has substantial content:', hasContent);

            // Verify it's not showing old error messages
            const hasOldError = containerHTML.includes('HTML rendering temporarily disabled');
            const hasLoadingMessage = containerHTML.includes('Loading session transcript');

            console.log('[PLAYWRIGHT] Has old error message:', hasOldError);
            console.log('[PLAYWRIGHT] Has loading message:', hasLoadingMessage);

            // Assertions
            expect(hasContent).toBe(true); // Should have content rendered by SafeHtmlRenderingService
            expect(hasOldError).toBe(false); // Should not show old disabled message
            expect(hasLoadingMessage).toBe(false); // Should not show loading message

            console.log('[PLAYWRIGHT] ✅ SafeHtmlRenderingService verification passed');

        } else {
            console.log('[PLAYWRIGHT] ❌ Transcript container not visible');

            // Log available elements for debugging
            const bodyContent = await page.textContent('body');
            console.log('[PLAYWRIGHT] Body content preview:', bodyContent?.substring(0, 500) + '...');

            // Take screenshot for debugging
            await page.screenshot({
                path: 'test-results/host-control-panel-missing-transcript.png',
                fullPage: true
            });

            // Fail the test if container is not found
            expect(transcriptContainer).toBeVisible();
        }

        console.log('[PLAYWRIGHT] [DEBUG-WORKITEM:hostcanvas:continue] SafeHtmlRenderingService verification test completed ;CLEANUP_OK');
    });

    test('should verify no Enhanced Processor JavaScript functions remain @hostcanvas', async ({ page }) => {
        console.log('[PLAYWRIGHT] [DEBUG-WORKITEM:hostcanvas:continue] Starting Enhanced Processor cleanup verification ;CLEANUP_OK');

        await page.goto('/host');

        // Check that Enhanced Processor JavaScript functions are no longer present
        const enhancedProcessorExists = await page.evaluate(() => {
            return typeof (window as any).enhancedProcessorRender === 'function';
        });

        console.log('[PLAYWRIGHT] Enhanced Processor function still exists:', enhancedProcessorExists);

        // Should be false after cleanup
        expect(enhancedProcessorExists).toBe(false);

        console.log('[PLAYWRIGHT] ✅ Enhanced Processor cleanup verification passed');
        console.log('[PLAYWRIGHT] [DEBUG-WORKITEM:hostcanvas:continue] Enhanced Processor cleanup verification completed ;CLEANUP_OK');
    });
});