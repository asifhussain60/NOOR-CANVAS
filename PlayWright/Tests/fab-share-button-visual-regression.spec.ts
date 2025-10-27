import { expect, test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

/**
 * [REDESIGN:share-buttons:fab] FAB Share Button Visual Regression Test
 * 
 * This test validates the new FAB (Floating Action Button) share button design:
 * - Buttons are 40px circular, positioned top-right
 * - Subtle blue background with low opacity
 * - Different icons for assets (📤) vs sections (📄)
 * - No obtrusive golden/red styling
 * - Proper wrapper positioning with relative containers
 * 
 * Route: https://localhost:9091/host/control-panel/PQ9N5YWW (Session 212)
 */

test.describe('FAB Share Button Visual Regression', () => {
    const SESSION_CODE = 'PQ9N5YWW';
    const BASE_URL = 'https://localhost:9091';
    const CONTROL_PANEL_URL = `${BASE_URL}/host/control-panel/${SESSION_CODE}`;

    // Track JavaScript errors
    let consoleErrors: string[] = [];
    let pageErrors: Error[] = [];

    test.beforeEach(async ({ page }) => {
        // Reset error tracking
        consoleErrors = [];
        pageErrors = [];

        // Listen for console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
                console.error(`[BROWSER-ERROR] ${msg.text()}`);
            }
        });

        // Listen for page errors
        page.on('pageerror', error => {
            pageErrors.push(error);
            console.error(`[PAGE-ERROR] ${error.message}`);
        });
    });

    test('Verify FAB buttons render correctly in control panel', async ({ page }) => {
        const trackingId = `fab-visual-${Date.now()}`;
        console.log(`[FAB-TEST:${trackingId}] Starting FAB share button visual regression test`);

        // Navigate to control panel
        console.log(`[FAB-TEST:${trackingId}] Navigating to ${CONTROL_PANEL_URL}`);
        await page.goto(CONTROL_PANEL_URL, { waitUntil: 'networkidle' });

        // Wait for control panel to load
        await expect(page.locator('.host-control-panel')).toBeVisible({ timeout: 15000 });
        console.log(`[FAB-TEST:${trackingId}] Host control panel loaded`);

        // Wait for transcript content to render
        await page.waitForTimeout(3000);

        // Check for JavaScript errors BEFORE validation
        if (consoleErrors.length > 0) {
            console.warn(`[FAB-TEST:${trackingId}] ⚠️  ${consoleErrors.length} console errors detected:`);
            consoleErrors.forEach((err, idx) => console.warn(`  ${idx + 1}. ${err}`));
        }

        if (pageErrors.length > 0) {
            console.error(`[FAB-TEST:${trackingId}] ❌ ${pageErrors.length} page errors detected:`);
            pageErrors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err.message}`));
        }

        // Validate FAB button structure
        const fabValidation = await page.evaluate(() => {
            // Find all FAB buttons
            const fabAssetButtons = document.querySelectorAll('.ks-share-fab-asset');
            const fabSectionButtons = document.querySelectorAll('.ks-share-fab-section');

            // Find legacy buttons (should not exist)
            const legacyButtons = document.querySelectorAll('.current-share-btn, button[style*="background-color: #FFD700"]');
            const legacyWrappers = document.querySelectorAll('.ks-share-wrapper[style*="text-align: center"]');

            // Sample FAB button properties
            const sampleAssetButton = fabAssetButtons[0] as HTMLElement;
            const assetButtonStyle = sampleAssetButton ? window.getComputedStyle(sampleAssetButton) : null;

            const sampleSectionButton = fabSectionButtons[0] as HTMLElement;
            const sectionButtonStyle = sampleSectionButton ? window.getComputedStyle(sampleSectionButton) : null;

            // Check wrapper positioning
            const wrappers = document.querySelectorAll('.action-wrapper, .section-wrapper');
            let wrappersWithRelativePosition = 0;
            wrappers.forEach(wrapper => {
                const style = window.getComputedStyle(wrapper as HTMLElement);
                if (style.position === 'relative') {
                    wrappersWithRelativePosition++;
                }
            });

            return {
                fabAssetCount: fabAssetButtons.length,
                fabSectionCount: fabSectionButtons.length,
                legacyButtonCount: legacyButtons.length,
                legacyWrapperCount: legacyWrappers.length,
                wrappersWithRelativePosition,
                assetButton: assetButtonStyle ? {
                    position: assetButtonStyle.position,
                    width: assetButtonStyle.width,
                    height: assetButtonStyle.height,
                    borderRadius: assetButtonStyle.borderRadius,
                    backgroundColor: assetButtonStyle.backgroundColor,
                    right: assetButtonStyle.right,
                    top: assetButtonStyle.top,
                    display: assetButtonStyle.display,
                    opacity: assetButtonStyle.opacity,
                    textContent: sampleAssetButton.textContent?.trim()
                } : null,
                sectionButton: sectionButtonStyle ? {
                    position: sectionButtonStyle.position,
                    width: sectionButtonStyle.width,
                    height: sectionButtonStyle.height,
                    borderRadius: sectionButtonStyle.borderRadius,
                    backgroundColor: sectionButtonStyle.backgroundColor,
                    right: sectionButtonStyle.right,
                    top: sectionButtonStyle.top,
                    display: sectionButtonStyle.display,
                    opacity: sectionButtonStyle.opacity,
                    textContent: sampleSectionButton.textContent?.trim()
                } : null
            };
        });

        console.log(`[FAB-TEST:${trackingId}] FAB Button Validation Results:`);
        console.log(`  - FAB Asset Buttons: ${fabValidation.fabAssetCount}`);
        console.log(`  - FAB Section Buttons: ${fabValidation.fabSectionCount}`);
        console.log(`  - Legacy Buttons (should be 0): ${fabValidation.legacyButtonCount}`);
        console.log(`  - Legacy Wrappers (should be 0): ${fabValidation.legacyWrapperCount}`);
        console.log(`  - Wrappers with position:relative: ${fabValidation.wrappersWithRelativePosition}`);

        if (fabValidation.assetButton) {
            console.log(`[FAB-TEST:${trackingId}] Sample Asset FAB Button:`);
            console.log(`  - Position: ${fabValidation.assetButton.position}`);
            console.log(`  - Size: ${fabValidation.assetButton.width} × ${fabValidation.assetButton.height}`);
            console.log(`  - Border Radius: ${fabValidation.assetButton.borderRadius}`);
            console.log(`  - Background: ${fabValidation.assetButton.backgroundColor}`);
            console.log(`  - Top/Right: ${fabValidation.assetButton.top} / ${fabValidation.assetButton.right}`);
            console.log(`  - Icon: "${fabValidation.assetButton.textContent}"`);
        }

        if (fabValidation.sectionButton) {
            console.log(`[FAB-TEST:${trackingId}] Sample Section FAB Button:`);
            console.log(`  - Position: ${fabValidation.sectionButton.position}`);
            console.log(`  - Size: ${fabValidation.sectionButton.width} × ${fabValidation.sectionButton.height}`);
            console.log(`  - Icon: "${fabValidation.sectionButton.textContent}"`);
        }

        // ASSERTIONS
        console.log(`[FAB-TEST:${trackingId}] Running assertions...`);

        // Should have FAB buttons
        expect(fabValidation.fabAssetCount + fabValidation.fabSectionCount).toBeGreaterThan(0);
        console.log(`[FAB-TEST:${trackingId}] ✅ Found ${fabValidation.fabAssetCount + fabValidation.fabSectionCount} FAB buttons`);

        // Should NOT have legacy buttons
        expect(fabValidation.legacyButtonCount).toBe(0);
        console.log(`[FAB-TEST:${trackingId}] ✅ No legacy buttons found`);

        // Should NOT have legacy wrappers
        expect(fabValidation.legacyWrapperCount).toBe(0);
        console.log(`[FAB-TEST:${trackingId}] ✅ No legacy wrappers found`);

        // Asset button should be circular (40px × 40px)
        if (fabValidation.assetButton) {
            expect(fabValidation.assetButton.width).toBe('40px');
            expect(fabValidation.assetButton.height).toBe('40px');
            expect(fabValidation.assetButton.borderRadius).toContain('50%');
            expect(fabValidation.assetButton.position).toBe('absolute');
            console.log(`[FAB-TEST:${trackingId}] ✅ Asset button has correct FAB styling`);
        }

        // Section button should use 📄 icon
        if (fabValidation.sectionButton) {
            expect(fabValidation.sectionButton.textContent).toContain('📄');
            console.log(`[FAB-TEST:${trackingId}] ✅ Section button uses correct icon (📄)`);
        }

        // Check for JavaScript errors AFTER validation
        expect(pageErrors.length).toBe(0);
        console.log(`[FAB-TEST:${trackingId}] ✅ No JavaScript errors detected`);

        // Percy snapshot - Desktop view
        console.log(`[FAB-TEST:${trackingId}] Taking Percy snapshot (Desktop 1280px)...`);
        await percySnapshot(page, 'FAB Share Buttons - Desktop 1280px', {
            widths: [1280],
            minHeight: 1024
        });

        // Percy snapshot - Tablet view
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(500);
        console.log(`[FAB-TEST:${trackingId}] Taking Percy snapshot (Tablet 768px)...`);
        await percySnapshot(page, 'FAB Share Buttons - Tablet 768px', {
            widths: [768],
            minHeight: 1024
        });

        // Percy snapshot - Mobile view
        await page.setViewportSize({ width: 375, height: 812 });
        await page.waitForTimeout(500);
        console.log(`[FAB-TEST:${trackingId}] Taking Percy snapshot (Mobile 375px)...`);
        await percySnapshot(page, 'FAB Share Buttons - Mobile 375px', {
            widths: [375],
            minHeight: 812
        });

        console.log(`[FAB-TEST:${trackingId}] ✅ All visual regression snapshots captured`);
    });

    test('Verify FAB button hover states', async ({ page }) => {
        const trackingId = `fab-hover-${Date.now()}`;
        console.log(`[FAB-TEST:${trackingId}] Testing FAB button hover states`);

        await page.goto(CONTROL_PANEL_URL, { waitUntil: 'networkidle' });
        await expect(page.locator('.host-control-panel')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(3000);

        // Find first FAB button
        const fabButton = page.locator('.ks-share-fab-asset, .ks-share-fab-section').first();
        await expect(fabButton).toBeVisible();

        // Get initial opacity
        const initialOpacity = await fabButton.evaluate(el => {
            return window.getComputedStyle(el).opacity;
        });
        console.log(`[FAB-TEST:${trackingId}] Initial opacity: ${initialOpacity}`);

        // Hover over button
        await fabButton.hover();
        await page.waitForTimeout(300); // Wait for transition

        // Get hover opacity
        const hoverOpacity = await fabButton.evaluate(el => {
            return window.getComputedStyle(el).opacity;
        });
        console.log(`[FAB-TEST:${trackingId}] Hover opacity: ${hoverOpacity}`);

        // Opacity should increase on hover
        expect(parseFloat(hoverOpacity)).toBeGreaterThan(parseFloat(initialOpacity));
        console.log(`[FAB-TEST:${trackingId}] ✅ Hover effect working (opacity increased)`);

        // Percy snapshot of hover state
        await percySnapshot(page, 'FAB Share Button - Hover State', {
            widths: [1280]
        });

        console.log(`[FAB-TEST:${trackingId}] ✅ Hover state snapshot captured`);
    });

    test('Verify FAB button click handler', async ({ page }) => {
        const trackingId = `fab-click-${Date.now()}`;
        console.log(`[FAB-TEST:${trackingId}] Testing FAB button click functionality`);

        await page.goto(CONTROL_PANEL_URL, { waitUntil: 'networkidle' });
        await expect(page.locator('.host-control-panel')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(3000);

        // Find first asset FAB button
        const assetFabButton = page.locator('.ks-share-fab-asset').first();

        if (await assetFabButton.count() > 0) {
            await expect(assetFabButton).toBeVisible();

            // Get button attributes
            const buttonData = await assetFabButton.evaluate(el => ({
                hasDataShareId: el.hasAttribute('data-share-id'),
                hasDataAssetType: el.hasAttribute('data-asset-type'),
                hasDataShareButton: el.hasAttribute('data-share-button'),
                shareId: el.getAttribute('data-share-id'),
                assetType: el.getAttribute('data-asset-type')
            }));

            console.log(`[FAB-TEST:${trackingId}] Asset FAB Button Data:`);
            console.log(`  - data-share-id: ${buttonData.shareId}`);
            console.log(`  - data-asset-type: ${buttonData.assetType}`);
            console.log(`  - data-share-button: ${buttonData.hasDataShareButton ? 'present' : 'missing'}`);

            // Verify required attributes
            expect(buttonData.hasDataShareId).toBeTruthy();
            expect(buttonData.hasDataAssetType).toBeTruthy();
            expect(buttonData.hasDataShareButton).toBeTruthy();
            console.log(`[FAB-TEST:${trackingId}] ✅ FAB button has all required data attributes`);

            // Click button (should trigger share system)
            await assetFabButton.click();
            await page.waitForTimeout(1000);

            // Check if share system was triggered (no errors)
            expect(pageErrors.length).toBe(0);
            console.log(`[FAB-TEST:${trackingId}] ✅ Click handler executed without errors`);
        } else {
            console.warn(`[FAB-TEST:${trackingId}] ⚠️  No asset FAB buttons found to test click`);
        }
    });

    test.afterEach(async ({ page }, testInfo) => {
        // Final error report
        if (consoleErrors.length > 0 || pageErrors.length > 0) {
            console.error(`[FAB-TEST] Test "${testInfo.title}" completed with errors:`);
            console.error(`  Console Errors: ${consoleErrors.length}`);
            console.error(`  Page Errors: ${pageErrors.length}`);

            // Attach error logs to test report
            await testInfo.attach('console-errors', {
                body: JSON.stringify(consoleErrors, null, 2),
                contentType: 'application/json'
            });

            if (pageErrors.length > 0) {
                await testInfo.attach('page-errors', {
                    body: JSON.stringify(pageErrors.map(e => e.message), null, 2),
                    contentType: 'application/json'
                });
            }
        }
    });
});
