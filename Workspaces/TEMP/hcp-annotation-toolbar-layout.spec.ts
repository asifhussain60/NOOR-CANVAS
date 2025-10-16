// HCP Annotation Toolbar Layout Test
// Purpose: Verify annotation toolbar appears centered above/below share button
// Key: hcp-annotate
// Session: 212 (Host: PQ9N5YWW)

import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

const HOST_URL = 'https://localhost:9091/host/token/PQ9N5YWW';
const TEST_SESSION_ID = '212';

test.describe('HCP Annotation Toolbar Layout', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to host control panel
        await page.goto(HOST_URL, { waitUntil: 'networkidle' });

        // Wait for session to be active
        await page.waitForTimeout(2000);

        // Start session if needed
        const startButton = page.locator('button:has-text("Start Session")');
        if (await startButton.isVisible()) {
            await startButton.click();
            await page.waitForTimeout(3000);
        }
    });

    test('[TRACE:annotation-layout:baseline] Capture baseline state - toolbars hidden', async ({ page }) => {
        console.log('[TRACE:annotation-layout:baseline] Starting baseline capture');

        // Wait for share buttons to be rendered
        const shareButtons = page.locator('[data-share-button="asset"]');
        await expect(shareButtons.first()).toBeVisible();

        const buttonCount = await shareButtons.count();
        console.log(`[TRACE:annotation-layout:baseline] Found ${buttonCount} share buttons`);

        // Verify all toolbars are hidden initially
        const toolbars = page.locator('[data-annotation-toolbar]');
        const toolbarCount = await toolbars.count();
        console.log(`[TRACE:annotation-layout:baseline] Found ${toolbarCount} annotation toolbars`);

        for (let i = 0; i < toolbarCount; i++) {
            const toolbar = toolbars.nth(i);
            const display = await toolbar.evaluate((el) => window.getComputedStyle(el).display);
            console.log(`[TRACE:annotation-layout:baseline] Toolbar ${i} display:`, display);
            expect(display).toBe('none');
        }

        // Percy snapshot - baseline state
        await percySnapshot(page, 'HCP Annotation Toolbar - Baseline (All Hidden)', {
            widths: [1280, 1920],
            minHeight: 1024
        });

        console.log('[TRACE:annotation-layout:baseline] ✅ Baseline snapshot captured');
    });

    test('[TRACE:annotation-layout:visibility] Share button click shows centered toolbar', async ({ page }) => {
        console.log('[TRACE:annotation-layout:visibility] Testing toolbar visibility on share click');

        // Wait for share buttons
        const shareButtons = page.locator('[data-share-button="asset"]');
        await expect(shareButtons.first()).toBeVisible();

        // Click first share button
        const firstShare = shareButtons.first();
        const shareId = await firstShare.getAttribute('data-share-id');
        console.log(`[TRACE:annotation-layout:visibility] Clicking share button: ${shareId}`);

        await firstShare.click();

        // Wait for toolbar to appear
        await page.waitForTimeout(500);

        // Find corresponding toolbar
        const toolbar = page.locator(`[data-annotation-toolbar="${shareId}"]`);

        // Verify toolbar is now visible
        const display = await toolbar.evaluate((el) => window.getComputedStyle(el).display);
        console.log(`[TRACE:annotation-layout:visibility] Toolbar display after click:`, display);
        expect(display).toBe('flex');

        // Verify toolbar layout - should be centered with flex layout
        const toolbarStyles = await toolbar.evaluate((el) => ({
            display: window.getComputedStyle(el).display,
            alignItems: window.getComputedStyle(el).alignItems,
            justifyContent: window.getComputedStyle(el).justifyContent,
            position: window.getComputedStyle(el).position
        }));

        console.log('[TRACE:annotation-layout:visibility] Toolbar styles:', JSON.stringify(toolbarStyles));
        expect(toolbarStyles.alignItems).toContain('center');

        // Verify share button wrapper uses column layout
        const wrapper = page.locator(`[data-share-container="${shareId}"]`);
        const wrapperStyles = await wrapper.evaluate((el) => ({
            display: window.getComputedStyle(el).display,
            flexDirection: window.getComputedStyle(el).flexDirection,
            alignItems: window.getComputedStyle(el).alignItems
        }));

        console.log('[TRACE:annotation-layout:visibility] Wrapper styles:', JSON.stringify(wrapperStyles));
        expect(wrapperStyles.display).toBe('flex');
        expect(wrapperStyles.flexDirection).toBe('column');
        expect(wrapperStyles.alignItems).toContain('center');

        // Percy snapshot - toolbar visible
        await percySnapshot(page, 'HCP Annotation Toolbar - Visible After Share', {
            widths: [1280, 1920],
            minHeight: 1024
        });

        console.log('[TRACE:annotation-layout:visibility] ✅ Visibility test passed');
    });

    test('[TRACE:annotation-layout:buttons] Verify all 8 toolbar buttons are visible and clickable', async ({ page }) => {
        console.log('[TRACE:annotation-layout:buttons] Testing button visibility');

        // Click first share button to show toolbar
        const firstShare = page.locator('[data-share-button="asset"]').first();
        const shareId = await firstShare.getAttribute('data-share-id');
        await firstShare.click();
        await page.waitForTimeout(500);

        const toolbar = page.locator(`[data-annotation-toolbar="${shareId}"]`);

        // Verify 5 tool buttons
        const selectBtn = toolbar.locator('[data-tool="select"]');
        const laserBtn = toolbar.locator('[data-tool="laser"]');
        const drawBtn = toolbar.locator('[data-tool="draw"]');
        const highlightBtn = toolbar.locator('[data-tool="highlight"]');
        const noteBtn = toolbar.locator('[data-tool="note"]');

        await expect(selectBtn).toBeVisible();
        await expect(laserBtn).toBeVisible();
        await expect(drawBtn).toBeVisible();
        await expect(highlightBtn).toBeVisible();
        await expect(noteBtn).toBeVisible();

        console.log('[TRACE:annotation-layout:buttons] ✅ All 5 tool buttons visible');

        // Verify color picker
        const colorPicker = toolbar.locator(`[data-color-picker="${shareId}"]`);
        await expect(colorPicker).toBeVisible();
        console.log('[TRACE:annotation-layout:buttons] ✅ Color picker visible');

        // Verify clear button
        const clearBtn = toolbar.locator(`[data-clear="${shareId}"]`);
        await expect(clearBtn).toBeVisible();
        console.log('[TRACE:annotation-layout:buttons] ✅ Clear button visible');

        // Verify close button
        const closeBtn = toolbar.locator(`[data-close-toolbar="${shareId}"]`);
        await expect(closeBtn).toBeVisible();
        console.log('[TRACE:annotation-layout:buttons] ✅ Close button visible');

        // Percy snapshot - all buttons visible
        await percySnapshot(page, 'HCP Annotation Toolbar - All Buttons Visible', {
            widths: [1280, 1920],
            minHeight: 1024
        });
    });

    test('[TRACE:annotation-layout:close] Close button hides toolbar', async ({ page }) => {
        console.log('[TRACE:annotation-layout:close] Testing close functionality');

        // Show toolbar
        const firstShare = page.locator('[data-share-button="asset"]').first();
        const shareId = await firstShare.getAttribute('data-share-id');
        await firstShare.click();
        await page.waitForTimeout(500);

        const toolbar = page.locator(`[data-annotation-toolbar="${shareId}"]`);
        await expect(toolbar).toBeVisible();

        // Click close button
        const closeBtn = toolbar.locator(`[data-close-toolbar="${shareId}"]`);
        await closeBtn.click();
        await page.waitForTimeout(500);

        // Verify toolbar is hidden
        const displayAfterClose = await toolbar.evaluate((el) => window.getComputedStyle(el).display);
        console.log(`[TRACE:annotation-layout:close] Toolbar display after close:`, displayAfterClose);
        expect(displayAfterClose).toBe('none');

        // Percy snapshot - toolbar hidden after close
        await percySnapshot(page, 'HCP Annotation Toolbar - Hidden After Close', {
            widths: [1280, 1920],
            minHeight: 1024
        });

        console.log('[TRACE:annotation-layout:close] ✅ Close test passed');
    });

    test('[TRACE:annotation-layout:multi] Multiple shares - only one toolbar visible', async ({ page }) => {
        console.log('[TRACE:annotation-layout:multi] Testing multiple toolbar behavior');

        const shareButtons = page.locator('[data-share-button="asset"]');
        const buttonCount = await shareButtons.count();

        if (buttonCount < 2) {
            console.log('[TRACE:annotation-layout:multi] ⏭️ Skipping - need at least 2 share buttons');
            return;
        }

        // Click first share button
        const firstShare = shareButtons.nth(0);
        const firstShareId = await firstShare.getAttribute('data-share-id');
        await firstShare.click();
        await page.waitForTimeout(500);

        const firstToolbar = page.locator(`[data-annotation-toolbar="${firstShareId}"]`);
        await expect(firstToolbar).toBeVisible();
        console.log(`[TRACE:annotation-layout:multi] First toolbar visible: ${firstShareId}`);

        // Click second share button
        const secondShare = shareButtons.nth(1);
        const secondShareId = await secondShare.getAttribute('data-share-id');
        await secondShare.click();
        await page.waitForTimeout(500);

        // Verify first toolbar is now hidden
        const firstDisplay = await firstToolbar.evaluate((el) => window.getComputedStyle(el).display);
        console.log(`[TRACE:annotation-layout:multi] First toolbar display after second click:`, firstDisplay);
        expect(firstDisplay).toBe('none');

        // Verify second toolbar is visible
        const secondToolbar = page.locator(`[data-annotation-toolbar="${secondShareId}"]`);
        const secondDisplay = await secondToolbar.evaluate((el) => window.getComputedStyle(el).display);
        console.log(`[TRACE:annotation-layout:multi] Second toolbar display:`, secondDisplay);
        expect(secondDisplay).toBe('flex');

        // Percy snapshot - second toolbar visible
        await percySnapshot(page, 'HCP Annotation Toolbar - Multiple Assets (Only One Visible)', {
            widths: [1280, 1920],
            minHeight: 1024
        });

        console.log('[TRACE:annotation-layout:multi] ✅ Multi-toolbar test passed');
    });

    test('[TRACE:annotation-layout:centering] Verify button centering', async ({ page }) => {
        console.log('[TRACE:annotation-layout:centering] Testing share button centering');

        // Get all share button wrappers
        const wrappers = page.locator('[data-share-container]');
        const wrapperCount = await wrappers.count();
        console.log(`[TRACE:annotation-layout:centering] Found ${wrapperCount} share wrappers`);

        // Check first wrapper alignment
        const firstWrapper = wrappers.first();
        const rect = await firstWrapper.boundingBox();
        const parentWidth = await page.evaluate(() => document.body.clientWidth);

        console.log('[TRACE:annotation-layout:centering] Wrapper position:', rect);
        console.log('[TRACE:annotation-layout:centering] Parent width:', parentWidth);

        // Percy snapshot - centering visual check
        await percySnapshot(page, 'HCP Annotation Toolbar - Share Button Centering', {
            widths: [1280, 1920],
            minHeight: 1024
        });

        console.log('[TRACE:annotation-layout:centering] ✅ Centering check complete');
    });
});
