/**
 * Test: HCP Annotation Toolbar Injection After Asset Share
 * Purpose: Verify annotation toolbar HTML is injected into shared asset and appears on click
 * Session: 212 (Host Token: PQ9N5YWW, User Token: KJAHA99L)
 * [TRACE:hcp-annotate:test] Validates toolbar injection and visibility ;CLEANUP_OK
 */

import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

const HOST_TOKEN = 'PQ9N5YWW';
const USER_TOKEN = 'KJAHA99L';
const SESSION_ID = 212;
const BASE_URL = 'http://localhost:9090'; // [TRACE:hcp-annotate:test] Using actual app port ;CLEANUP_OK

test.describe('HCP Annotation Toolbar Injection', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to Host Control Panel
        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
        await page.waitForLoadState('networkidle');
    });

    test('Annotation toolbar should be injected with shared asset HTML', async ({ page }) => {
        console.log('[TRACE:hcp-annotate:test] Starting test - verify toolbar injection in shared asset HTML ;CLEANUP_OK');

        // Start session
        const startButton = page.locator('button:has-text("Start Session")');
        await expect(startButton).toBeVisible({ timeout: 10000 });
        await startButton.click();
        console.log('[TRACE:hcp-annotate:test] Session started ;CLEANUP_OK');

        // Wait for session to be active
        await page.waitForSelector('text=/Session Status.*Active/i', { timeout: 15000 });

        // Wait for transcript and share buttons
        await page.waitForSelector('#session-transcript', { timeout: 10000 });
        await page.waitForFunction(() => {
            const shareButtons = document.querySelectorAll('button[data-asset-id]');
            return shareButtons.length > 0;
        }, { timeout: 15000 });
        console.log('[TRACE:hcp-annotate:test] Transcript and share buttons loaded ;CLEANUP_OK');

        // Click first share button
        const firstShareButton = page.locator('button[data-asset-id]').first();
        const shareId = await firstShareButton.getAttribute('data-asset-id');
        console.log('[TRACE:hcp-annotate:test] Clicking share button with ID:', shareId, ';CLEANUP_OK');

        await firstShareButton.click();
        await page.waitForTimeout(2000); // Wait for SignalR broadcast

        // Open SessionCanvas in new tab to verify toolbar is in the HTML
        const sessionCanvasUrl = `${BASE_URL}/session-canvas/${USER_TOKEN}`;
        const sessionCanvas = await page.context().newPage();
        await sessionCanvas.goto(sessionCanvasUrl);
        await sessionCanvas.waitForLoadState('networkidle');
        console.log('[TRACE:hcp-annotate:test] SessionCanvas opened ;CLEANUP_OK');

        // Wait for asset to appear in SessionCanvas
        await sessionCanvas.waitForSelector('.canvas-content-area', { timeout: 10000 });

        // Check if annotation toolbar exists in the DOM
        const toolbarSelector = `[data-annotation-toolbar="${shareId}"]`;
        const toolbar = sessionCanvas.locator(toolbarSelector);

        console.log('[TRACE:hcp-annotate:test] Looking for toolbar with selector:', toolbarSelector, ';CLEANUP_OK');
        await expect(toolbar).toHaveCount(1);
        console.log('[TRACE:hcp-annotate:test] ✅ Annotation toolbar found in DOM ;CLEANUP_OK');

        // Verify toolbar has expected buttons
        await expect(toolbar.locator('button[data-tool="laser"]')).toHaveCount(1);
        await expect(toolbar.locator('button[data-tool="draw"]')).toHaveCount(1);
        await expect(toolbar.locator('button[data-tool="highlight"]')).toHaveCount(1);
        await expect(toolbar.locator('button[data-tool="note"]')).toHaveCount(1);
        await expect(toolbar.locator('.annotation-color-picker')).toHaveCount(1);
        await expect(toolbar.locator('.annotation-clear-btn')).toHaveCount(1);
        await expect(toolbar.locator('.annotation-close-btn')).toHaveCount(1);
        console.log('[TRACE:hcp-annotate:test] ✅ All toolbar buttons present ;CLEANUP_OK');

        // Take Percy snapshot
        await percySnapshot(sessionCanvas, 'SessionCanvas - Annotation Toolbar Injected in HTML');

        await sessionCanvas.close();
    });

    test('Annotation toolbar should appear when share button clicked in HCP', async ({ page }) => {
        console.log('[TRACE:hcp-annotate:test] Testing toolbar visibility on share button click ;CLEANUP_OK');

        // Start session
        const startButton = page.locator('button:has-text("Start Session")');
        await startButton.click();
        await page.waitForSelector('text=/Session Status.*Active/i', { timeout: 15000 });
        await page.waitForSelector('#session-transcript', { timeout: 10000 });
        await page.waitForFunction(() => {
            const shareButtons = document.querySelectorAll('button[data-asset-id]');
            return shareButtons.length > 0;
        }, { timeout: 15000 });

        // Get first share button
        const firstShareButton = page.locator('button[data-asset-id]').first();
        const shareId = await firstShareButton.getAttribute('data-asset-id');

        // Before click - toolbar should not be visible
        const toolbarSelector = `[data-annotation-toolbar="${shareId}"]`;
        console.log('[TRACE:hcp-annotate:test] Checking toolbar visibility before click ;CLEANUP_OK');

        // The toolbar may not exist yet, or should be hidden
        const toolbarBefore = page.locator(toolbarSelector);
        const countBefore = await toolbarBefore.count();
        if (countBefore > 0) {
            const displayBefore = await toolbarBefore.evaluate((el) => window.getComputedStyle(el).display);
            expect(displayBefore).toBe('none');
            console.log('[TRACE:hcp-annotate:test] Toolbar exists but hidden (display: none) ;CLEANUP_OK');
        } else {
            console.log('[TRACE:hcp-annotate:test] Toolbar not yet in DOM (will be injected after share) ;CLEANUP_OK');
        }

        // Click share button
        await firstShareButton.click();
        console.log('[TRACE:hcp-annotate:test] Share button clicked, toolbar should appear ;CLEANUP_OK');

        // After click - toolbar should be visible
        await page.waitForTimeout(500); // Allow JavaScript to process click
        const toolbarAfter = page.locator(toolbarSelector);
        await expect(toolbarAfter).toBeVisible({ timeout: 5000 });
        console.log('[TRACE:hcp-annotate:test] ✅ Toolbar visible after share button click ;CLEANUP_OK');

        // Take Percy snapshot
        await percySnapshot(page, 'HCP - Annotation Toolbar Visible After Share Click');
    });

    test('Clicking close button should hide annotation toolbar', async ({ page }) => {
        console.log('[TRACE:hcp-annotate:test] Testing toolbar close functionality ;CLEANUP_OK');

        // Start session and click share button
        const startButton = page.locator('button:has-text("Start Session")');
        await startButton.click();
        await page.waitForSelector('text=/Session Status.*Active/i', { timeout: 15000 });
        await page.waitForSelector('#session-transcript', { timeout: 10000 });
        await page.waitForFunction(() => {
            const shareButtons = document.querySelectorAll('button[data-asset-id]');
            return shareButtons.length > 0;
        }, { timeout: 15000 });

        const firstShareButton = page.locator('button[data-asset-id]').first();
        const shareId = await firstShareButton.getAttribute('data-asset-id');
        await firstShareButton.click();

        // Wait for toolbar to appear
        const toolbarSelector = `[data-annotation-toolbar="${shareId}"]`;
        const toolbar = page.locator(toolbarSelector);
        await expect(toolbar).toBeVisible({ timeout: 5000 });
        console.log('[TRACE:hcp-annotate:test] Toolbar visible ;CLEANUP_OK');

        // Click close button
        const closeButton = toolbar.locator('.annotation-close-btn');
        await closeButton.click();
        console.log('[TRACE:hcp-annotate:test] Close button clicked ;CLEANUP_OK');

        // Toolbar should be hidden
        await expect(toolbar).toBeHidden({ timeout: 3000 });
        console.log('[TRACE:hcp-annotate:test] ✅ Toolbar hidden after close ;CLEANUP_OK');

        // Take Percy snapshot
        await percySnapshot(page, 'HCP - Annotation Toolbar Hidden After Close');
    });
});
