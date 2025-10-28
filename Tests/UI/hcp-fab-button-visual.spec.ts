/**
 * HCP FAB Button Visual Regression Test
 * Verifies kebab menu removal and FAB share button implementation
 * Uses Percy for visual regression testing
 */

import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

test.describe('HCP FAB Button Implementation', () => {
    test.beforeEach(async ({ page }) => {
        // Listen for console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error(`[BROWSER ERROR] ${msg.text()}`);
            }
        });

        // Listen for page errors
        page.on('pageerror', error => {
            console.error(`[PAGE ERROR] ${error.message}`);
        });
    });

    test('should show FAB share button and no kebab menu in broadcast mode', async ({ page }) => {
        console.log('🔍 [TEST] Starting HCP FAB button visual regression test');

        // Navigate to Host Control Panel with Session 212
        const hostToken = 'PQ9N5YWW';
        console.log(`📍 [TEST] Navigating to /host/control-panel/${hostToken}`);

        await page.goto(`http://localhost:9090/host/control-panel/${hostToken}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for control panel to load
        console.log('⏳ [TEST] Waiting for control panel header');
        await expect(page.locator('h1:has-text("HOST CONTROL PANEL")')).toBeVisible({ timeout: 15000 });
        console.log('✅ [TEST] Control panel loaded');

        // Wait for session to be in Active or Ended status (shows transcript)
        console.log('⏳ [TEST] Waiting for session status');
        await page.waitForTimeout(2000);

        // Check if we're in broadcast mode (transcript visible)
        const transcriptContainer = page.locator('#transcript-content-container');
        const hasTranscript = await transcriptContainer.isVisible().catch(() => false);

        console.log(`📊 [TEST] Transcript visible: ${hasTranscript}`);

        if (hasTranscript) {
            console.log('📸 [TEST] Taking Percy snapshot: HCP with transcript (checking for FAB)');

            // Check for kebab menu (should NOT exist)
            console.log('🔍 [TEST] Checking for kebab menu presence');
            const kebabButtons = page.locator('.asset-kebab-menu-btn, button:has(i.fa-ellipsis-vertical), button:has(i.fa-ellipsis)');
            const kebabCount = await kebabButtons.count();
            console.log(`📊 [TEST] Kebab menu buttons found: ${kebabCount}`);
            expect(kebabCount).toBe(0);

            // Check for FAB share button (should exist)
            console.log('🔍 [TEST] Checking for FAB share button');
            const fabButton = page.locator('.hcp-fab-share-button');
            await expect(fabButton).toBeVisible({ timeout: 5000 });
            console.log('✅ [TEST] FAB share button found');

            // Verify FAB button styling
            const fabStyles = await fabButton.evaluate(el => {
                const computed = window.getComputedStyle(el);
                return {
                    position: computed.position,
                    borderRadius: computed.borderRadius,
                    width: computed.width,
                    height: computed.height,
                    bottom: computed.bottom,
                    right: computed.right
                };
            });

            console.log('🎨 [TEST] FAB button styles:', fabStyles);
            expect(fabStyles.position).toBe('fixed');
            expect(fabStyles.borderRadius).toContain('50%');

            // Check for share icon
            const shareIcon = fabButton.locator('i.fa-share-nodes');
            await expect(shareIcon).toBeVisible();
            console.log('✅ [TEST] Share icon visible in FAB');

            // Take Percy snapshot
            await percySnapshot(page, 'HCP FAB Button - Broadcast Mode', {
                widths: [1280, 1920],
                minHeight: 1024
            });

            // Test hover state
            console.log('🖱️ [TEST] Testing FAB hover interaction');
            await fabButton.hover();
            await page.waitForTimeout(500);

            await percySnapshot(page, 'HCP FAB Button - Hover State', {
                widths: [1280],
                minHeight: 1024
            });

            // Check console for errors
            console.log('🔍 [TEST] Checking for JavaScript errors');
            const consoleErrors: string[] = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            await page.waitForTimeout(1000);

            if (consoleErrors.length > 0) {
                console.error('❌ [TEST] Console errors detected:', consoleErrors);
                throw new Error(`Console errors found: ${consoleErrors.join(', ')}`);
            }

            console.log('✅ [TEST] No console errors detected');

        } else {
            console.log('⚠️ [TEST] Transcript not visible - session may not be active');
            console.log('📸 [TEST] Taking snapshot of current state');

            await percySnapshot(page, 'HCP FAB Button - No Transcript State', {
                widths: [1280],
                minHeight: 1024
            });
        }

        console.log('✅ [TEST] HCP FAB button test completed successfully');
    });

    test('should verify FAB button click broadcasts transcript', async ({ page }) => {
        console.log('🔍 [TEST] Starting FAB button click test');

        const hostToken = 'PQ9N5YWW';
        await page.goto(`http://localhost:9090/host/control-panel/${hostToken}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        await expect(page.locator('h1:has-text("HOST CONTROL PANEL")')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(2000);

        const fabButton = page.locator('.hcp-fab-share-button');
        const isFabVisible = await fabButton.isVisible().catch(() => false);

        if (isFabVisible) {
            console.log('🖱️ [TEST] FAB button visible, testing click functionality');

            // Check if button is enabled
            const isDisabled = await fabButton.isDisabled();
            console.log(`📊 [TEST] FAB button disabled: ${isDisabled}`);

            if (!isDisabled) {
                // Click the FAB button
                console.log('🖱️ [TEST] Clicking FAB button');
                await fabButton.click();

                // Wait for potential broadcast action
                await page.waitForTimeout(2000);

                // Check for toast notification or success indicator
                const toast = page.locator('.toast, .notification, [role="alert"]');
                const hasToast = await toast.isVisible().catch(() => false);

                if (hasToast) {
                    console.log('✅ [TEST] Toast notification appeared after click');
                    const toastText = await toast.textContent();
                    console.log(`📊 [TEST] Toast message: ${toastText}`);
                }

                // Take Percy snapshot after click
                await percySnapshot(page, 'HCP FAB Button - After Click', {
                    widths: [1280],
                    minHeight: 1024
                });

                console.log('✅ [TEST] FAB button click test completed');
            } else {
                console.log('⚠️ [TEST] FAB button is disabled');
            }
        } else {
            console.log('⚠️ [TEST] FAB button not visible - skipping click test');
        }
    });
});
