/**
 * Debug Panel - Direct Visibility Test (No JS Diagnostics)
 * 
 * Purpose: Verify debug panel is actually rendered in DOM after DevModeService fix
 * 
 * This test DOES NOT rely on window.__DEVMODE_SHOW_PANELS__ JavaScript variables.
 * It directly checks if the .debug-panel-container element exists in the rendered page.
 * 
 * Prerequisites:
 * - App must be running (use orchestration script or manual start)
 * - DevModeService.IsDevelopmentMode must return true (fixed in DEBUG builds)
 * 
 * Created: 2025-10-14 23:30
 * Key: debug-panel
 */

import { expect, test } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';

test.describe('Debug Panel - Direct DOM Visibility Test', () => {

    test('HostLanding - Debug Panel Actually Renders', async ({ page }) => {
        console.log('[TEST] Starting direct DOM visibility test');

        // Navigate to HostLanding
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });

        // Wait for Blazor
        await page.waitForFunction(() => {
            return (window as any).Blazor !== undefined;
        }, { timeout: 30000 });

        console.log('[TEST] Blazor loaded');

        // Additional wait for component rendering
        await page.waitForTimeout(3000);

        // CRITICAL TEST: Check if debug panel exists in DOM
        const debugPanelContainer = page.locator('.debug-panel');
        const isVisible = await debugPanelContainer.isVisible({ timeout: 5000 }).catch(() => false);

        console.log(`[TEST] Debug panel container visible: ${isVisible}`);

        if (!isVisible) {
            // Debug: Check what's actually in the page
            const bodyHTML = await page.evaluate(() => document.body.innerHTML);
            console.log('[TEST] Body HTML length:', bodyHTML.length);

            // Check if ProductionInfoPanel is showing instead
            const productionPanel = page.locator('.production-info-panel');
            const productionVisible = await productionPanel.isVisible().catch(() => false);
            console.log(`[TEST] Production panel visible: ${productionVisible}`);

            // Get server-side rendering info
            const pageContent = await page.content();
            const hasDebugPanel = pageContent.includes('debug-panel');
            const hasProductionPanel = pageContent.includes('production-info');
            console.log(`[TEST] Page contains 'debug-panel': ${hasDebugPanel}`);
            console.log(`[TEST] Page contains 'production-info': ${hasProductionPanel}`);
        }

        // ASSERT: Debug panel must be visible
        await expect(debugPanelContainer).toBeVisible({ timeout: 10000 });
        console.log('[TEST] ✅ Debug panel container is visible!');

        // ASSERT: Debug panel icon must be visible and clickable
        const debugIcon = page.locator('.debug-toggle-btn');
        await expect(debugIcon).toBeVisible({ timeout: 5000 });
        console.log('[TEST] ✅ Debug panel icon is visible!');

        // Take screenshot before expansion
        await page.screenshot({
            path: 'Workspaces/TEMP/debug-panel-direct-test-collapsed.png',
            fullPage: true
        });
        console.log('[TEST] Screenshot saved: collapsed state');

        // Click to expand
        await debugIcon.click();
        await page.waitForTimeout(500);

        // ASSERT: Panel content must be expanded
        const expandedContent = page.locator('.debug-content');
        await expect(expandedContent).toBeVisible({ timeout: 5000 });
        console.log('[TEST] ✅ Debug panel expanded successfully!');

        // ASSERT: Debug actions must be present
        const debugActions = page.locator('.debug-actions button');
        const actionCount = await debugActions.count();
        expect(actionCount).toBeGreaterThan(0);
        console.log(`[TEST] ✅ Found ${actionCount} debug actions`);

        // Take screenshot after expansion
        await page.screenshot({
            path: 'Workspaces/TEMP/debug-panel-direct-test-expanded.png',
            fullPage: true
        });
        console.log('[TEST] Screenshot saved: expanded state');

        // Test collapse
        await debugIcon.click();
        await page.waitForTimeout(500);

        await expect(expandedContent).not.toBeVisible({ timeout: 5000 });
        console.log('[TEST] ✅ Debug panel collapsed successfully!');

        console.log('[TEST] ✅✅✅ ALL ASSERTIONS PASSED - DEBUG PANEL IS WORKING!');
    });
});
