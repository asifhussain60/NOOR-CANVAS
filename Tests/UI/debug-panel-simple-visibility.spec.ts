/**
 * Debug Panel - Simple Visibility Test
 * 
 * Purpose: Verify debug panel appears when ASPNETCORE_ENVIRONMENT = Development
 * 
 * Prerequisites:
 * - App must be running with ASPNETCORE_ENVIRONMENT = 'Development'
 * - Use: $env:ASPNETCORE_ENVIRONMENT = 'Development'; dotnet run (from SPA/NoorCanvas)
 * 
 * Test Strategy:
 * 1. Navigate to HostLanding
 * 2. Wait for Blazor to render
 * 3. Verify debug panel container exists
 * 4. Verify debug panel icon is visible
 * 5. Click icon to expand
 * 6. Verify panel expands successfully
 * 7. Take screenshot for evidence
 * 
 * Created: 2025-10-14 22:50
 * Key: debug-panel
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';

test.describe('Debug Panel - Simple Visibility Test', () => {
    
    test('HostLanding - Debug Panel Visible and Functional', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:debug-panel:test:TRACE] Starting simple visibility test ;CLEANUP_OK');
        
        // Navigate to HostLanding
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        // Wait for Blazor to be ready
        await page.waitForFunction(() => {
            return (window as any).Blazor !== undefined;
        }, { timeout: 30000 });
        
        console.log('[DEBUG-WORKITEM:debug-panel:test:TRACE] Blazor loaded ;CLEANUP_OK');
        
        // Additional wait for component initialization
        await page.waitForTimeout(2000);
        
        // Check DevMode state in browser console
        const devModeState = await page.evaluate(() => {
            return {
                showDevPanels: (window as any).__DEVMODE_SHOW_PANELS__,
                isDevelopment: (window as any).__DEVMODE_IS_DEVELOPMENT__,
                aspnetcoreEnv: (window as any).__ASPNETCORE_ENVIRONMENT__
            };
        });
        
        console.log('[DEBUG-WORKITEM:debug-panel:test:TRACE] DevMode State:', JSON.stringify(devModeState), ';CLEANUP_OK');
        
        // Assert: DevMode enabled
        expect(devModeState.showDevPanels).toBe(true);
        expect(devModeState.isDevelopment).toBe(true);
        expect(devModeState.aspnetcoreEnv).toBe('Development');
        
        console.log('[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ DevMode configuration correct ;CLEANUP_OK');
        
        // Assert: Debug panel container exists
        const container = page.locator('.debug-panel-container');
        await expect(container).toBeVisible({ timeout: 10000 });
        console.log('[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ Debug panel container visible ;CLEANUP_OK');
        
        // Assert: Debug panel icon exists and clickable
        const icon = page.locator('.debug-panel-icon');
        await expect(icon).toBeVisible({ timeout: 10000 });
        console.log('[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ Debug panel icon visible ;CLEANUP_OK');
        
        // Take screenshot before expansion
        await page.screenshot({ 
            path: 'Workspaces/TEMP/debug-panel-simple-test-collapsed.png', 
            fullPage: true 
        });
        
        // Click to expand
        await icon.click();
        await page.waitForTimeout(500); // Wait for animation
        
        // Assert: Panel expanded
        const expandedContent = page.locator('.debug-panel-content.expanded');
        await expect(expandedContent).toBeVisible({ timeout: 10000 });
        console.log('[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ Debug panel expanded ;CLEANUP_OK');
        
        // Assert: Debug actions present
        const actions = page.locator('.debug-action-button');
        const actionCount = await actions.count();
        expect(actionCount).toBeGreaterThan(0);
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ ${actionCount} debug actions found ;CLEANUP_OK`);
        
        // Take screenshot after expansion
        await page.screenshot({ 
            path: 'Workspaces/TEMP/debug-panel-simple-test-expanded.png', 
            fullPage: true 
        });
        
        // Test collapse
        await icon.click();
        await page.waitForTimeout(500);
        
        const collapsedContent = page.locator('.debug-panel-content.expanded');
        await expect(collapsedContent).not.toBeVisible({ timeout: 10000 });
        console.log('[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ Debug panel collapsed ;CLEANUP_OK');
        
        console.log('[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅✅✅ ALL ASSERTIONS PASSED ;CLEANUP_OK');
    });
});
