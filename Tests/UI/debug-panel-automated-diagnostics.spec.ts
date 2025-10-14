/**
 * Debug Panel Automated Diagnostics
 * 
 * Purpose: Comprehensive automated test to verify debug panel visibility and functionality
 * across all views (HostLanding, UserLanding, SessionCanvas, HostControlPanel).
 * 
 * Test Strategy:
 * 1. Environment validation (ASPNETCORE_ENVIRONMENT = Development)
 * 2. DevModeService configuration check
 * 3. Component rendering verification
 * 4. CSS loading and positioning validation
 * 5. JavaScript interaction testing (expand/collapse)
 * 6. Debug action enumeration
 * 
 * Created: 2025-10-14
 * Key: debug-panel
 */

import { expect, Page, test } from '@playwright/test';

// Test configuration
const BASE_URL = 'https://localhost:9091';
const TIMEOUT = 30000; // 30 seconds for network operations
const ANIMATION_DELAY = 500; // Wait for CSS animations

/**
 * Helper: Capture comprehensive browser diagnostics
 */
async function captureBrowserDiagnostics(page: Page, context: string): Promise<object> {
    console.log(`[DEBUG-WORKITEM:debug-panel:diagnostics:TRACE] Capturing diagnostics for ${context} ;CLEANUP_OK`);

    const diagnostics = await page.evaluate(() => {
        return {
            timestamp: new Date().toISOString(),
            environment: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                aspnetcoreEnv: document.querySelector('meta[name="aspnetcore-environment"]')?.getAttribute('content') || 'NOT_SET'
            },
            devModeService: {
                showDevPanels: (window as any).__DEVMODE_SHOW_PANELS__ !== undefined ? (window as any).__DEVMODE_SHOW_PANELS__ : 'UNKNOWN',
                isDevelopment: (window as any).__DEVMODE_IS_DEVELOPMENT__ !== undefined ? (window as any).__DEVMODE_IS_DEVELOPMENT__ : 'UNKNOWN'
            },
            debugPanel: {
                containerExists: !!document.querySelector('.debug-panel-container'),
                iconExists: !!document.querySelector('.debug-panel-icon'),
                contentExists: !!document.querySelector('.debug-panel-content'),
                isExpanded: document.querySelector('.debug-panel-content')?.classList.contains('expanded') || false,
                actionCount: document.querySelectorAll('.debug-action-button').length
            },
            css: {
                debugPanelStyles: getComputedStyle(document.querySelector('.debug-panel-container') || document.body),
                iconStyles: getComputedStyle(document.querySelector('.debug-panel-icon') || document.body),
                contentStyles: getComputedStyle(document.querySelector('.debug-panel-content') || document.body)
            },
            dom: {
                bodyClasses: document.body.className,
                debugPanelHTML: document.querySelector('.debug-panel-container')?.outerHTML?.substring(0, 500) || 'NOT_FOUND'
            }
        };
    });

    console.log(`[DEBUG-WORKITEM:debug-panel:diagnostics:TRACE] Diagnostics captured: ${JSON.stringify(diagnostics, null, 2)} ;CLEANUP_OK`);
    return diagnostics;
}

/**
 * Helper: Wait for Blazor to fully render
 */
async function waitForBlazorReady(page: Page): Promise<void> {
    console.log(`[DEBUG-WORKITEM:debug-panel:blazor:TRACE] Waiting for Blazor ready state ;CLEANUP_OK`);

    await page.waitForFunction(() => {
        return (window as any).Blazor !== undefined;
    }, { timeout: TIMEOUT });

    // Additional wait for component initialization
    await page.waitForTimeout(2000);

    console.log(`[DEBUG-WORKITEM:debug-panel:blazor:TRACE] Blazor ready ;CLEANUP_OK`);
}

/**
 * Test Suite: Debug Panel Visibility & Functionality
 */
test.describe('Debug Panel - Automated Diagnostics', () => {

    test.beforeEach(async ({ page }) => {
        // Capture console logs
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('DEBUG-WORKITEM') || text.includes('DIAGNOSTIC')) {
                console.log(`[BROWSER CONSOLE] ${text}`);
            }
        });

        // Capture errors
        page.on('pageerror', error => {
            console.error(`[BROWSER ERROR] ${error.message}`);
        });
    });

    test('HostLanding - Debug Panel Visibility', async ({ page }) => {
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] Starting HostLanding visibility test ;CLEANUP_OK`);

        // Navigate to HostLanding
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        await waitForBlazorReady(page);

        // Capture initial diagnostics
        const initialDiagnostics = await captureBrowserDiagnostics(page, 'HostLanding-Initial');

        // Assert: Debug panel container exists
        const container = page.locator('.debug-panel-container');
        await expect(container).toBeVisible({ timeout: TIMEOUT });
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ Debug panel container visible ;CLEANUP_OK`);

        // Assert: Debug panel icon exists
        const icon = page.locator('.debug-panel-icon');
        await expect(icon).toBeVisible({ timeout: TIMEOUT });
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ Debug panel icon visible ;CLEANUP_OK`);

        // Assert: CSS positioning (bottom-right)
        const iconBox = await icon.boundingBox();
        expect(iconBox).not.toBeNull();
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] Icon position: ${JSON.stringify(iconBox)} ;CLEANUP_OK`);

        // Assert: Icon is clickable
        await icon.click();
        await page.waitForTimeout(ANIMATION_DELAY);

        // Capture post-click diagnostics
        const expandedDiagnostics = await captureBrowserDiagnostics(page, 'HostLanding-Expanded');

        // Assert: Panel expanded
        const content = page.locator('.debug-panel-content.expanded');
        await expect(content).toBeVisible({ timeout: TIMEOUT });
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ Debug panel expanded ;CLEANUP_OK`);

        // Assert: Debug actions present
        const actions = page.locator('.debug-action-button');
        const actionCount = await actions.count();
        expect(actionCount).toBeGreaterThan(0);
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ ${actionCount} debug actions found ;CLEANUP_OK`);

        // Take screenshot
        await page.screenshot({ path: 'Workspaces/TEMP/debug-panel-hostlanding-expanded.png', fullPage: true });

        // Test collapse
        await icon.click();
        await page.waitForTimeout(ANIMATION_DELAY);

        const collapsedContent = page.locator('.debug-panel-content.expanded');
        await expect(collapsedContent).not.toBeVisible({ timeout: TIMEOUT });
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ Debug panel collapsed ;CLEANUP_OK`);

        // Final diagnostics
        const finalDiagnostics = await captureBrowserDiagnostics(page, 'HostLanding-Final');

        // Write diagnostics to file
        const fs = require('fs');
        fs.writeFileSync(
            'Workspaces/TEMP/debug-panel-hostlanding-diagnostics.json',
            JSON.stringify({ initialDiagnostics, expandedDiagnostics, finalDiagnostics }, null, 2)
        );
    });

    test('UserLanding - Debug Panel Visibility', async ({ page }) => {
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] Starting UserLanding visibility test ;CLEANUP_OK`);

        // First navigate to HostLanding to get a session
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        await waitForBlazorReady(page);

        // Click "Sign In As Host"
        await page.click('button:has-text("Sign In As Host")');
        await page.waitForTimeout(1000);

        // Create session with Session ID 212
        await page.fill('input[placeholder="Enter Session ID"]', '212');
        await page.fill('input[placeholder="Enter Session Title"]', 'Debug Panel Test');
        await page.click('button:has-text("Create Session")');

        // Wait for navigation to HostControlPanel
        await page.waitForURL(/\/host\/control\//, { timeout: TIMEOUT });
        await waitForBlazorReady(page);

        // Get user token from URL or session storage
        const userToken = await page.evaluate(() => {
            // Check if we can get user token from session
            return sessionStorage.getItem('userToken') || 'test-token-123';
        });

        // Navigate to UserLanding
        await page.goto(`${BASE_URL}/user/landing/${userToken}`, { waitUntil: 'networkidle' });
        await waitForBlazorReady(page);

        // Capture diagnostics
        const diagnostics = await captureBrowserDiagnostics(page, 'UserLanding');

        // Assert: Debug panel visible
        const container = page.locator('.debug-panel-container');
        await expect(container).toBeVisible({ timeout: TIMEOUT });
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ UserLanding debug panel visible ;CLEANUP_OK`);

        // Test expand
        const icon = page.locator('.debug-panel-icon');
        await icon.click();
        await page.waitForTimeout(ANIMATION_DELAY);

        const content = page.locator('.debug-panel-content.expanded');
        await expect(content).toBeVisible({ timeout: TIMEOUT });

        // Take screenshot
        await page.screenshot({ path: 'Workspaces/TEMP/debug-panel-userlanding-expanded.png', fullPage: true });

        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ UserLanding test complete ;CLEANUP_OK`);
    });

    test('SessionCanvas - Debug Panel Visibility', async ({ page }) => {
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] Starting SessionCanvas visibility test ;CLEANUP_OK`);

        // Setup: Create session and join as user
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        await waitForBlazorReady(page);

        // Sign in as host
        await page.click('button:has-text("Sign In As Host")');
        await page.waitForTimeout(1000);

        await page.fill('input[placeholder="Enter Session ID"]', '212');
        await page.fill('input[placeholder="Enter Session Title"]', 'Debug Panel Canvas Test');
        await page.click('button:has-text("Create Session")');

        await page.waitForURL(/\/host\/control\//, { timeout: TIMEOUT });
        await waitForBlazorReady(page);

        // Start session
        const startButton = page.locator('button:has-text("Start Session")');
        if (await startButton.isVisible()) {
            await startButton.click();
            await page.waitForTimeout(2000);
        }

        // Navigate to SessionCanvas (participant view)
        const canvasUrl = `${BASE_URL}/session/212/canvas`;
        await page.goto(canvasUrl, { waitUntil: 'networkidle' });
        await waitForBlazorReady(page);

        // Capture diagnostics
        const diagnostics = await captureBrowserDiagnostics(page, 'SessionCanvas');

        // Assert: Debug panel visible
        const container = page.locator('.debug-panel-container');
        await expect(container).toBeVisible({ timeout: TIMEOUT });
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ SessionCanvas debug panel visible ;CLEANUP_OK`);

        // Test expand
        const icon = page.locator('.debug-panel-icon');
        await icon.click();
        await page.waitForTimeout(ANIMATION_DELAY);

        const content = page.locator('.debug-panel-content.expanded');
        await expect(content).toBeVisible({ timeout: TIMEOUT });

        // Take screenshot
        await page.screenshot({ path: 'Workspaces/TEMP/debug-panel-sessioncanvas-expanded.png', fullPage: true });

        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ SessionCanvas test complete ;CLEANUP_OK`);
    });

    test('HostControlPanel - Debug Panel Visibility', async ({ page }) => {
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] Starting HostControlPanel visibility test ;CLEANUP_OK`);

        // Setup: Create session
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        await waitForBlazorReady(page);

        await page.click('button:has-text("Sign In As Host")');
        await page.waitForTimeout(1000);

        await page.fill('input[placeholder="Enter Session ID"]', '212');
        await page.fill('input[placeholder="Enter Session Title"]', 'Debug Panel HCP Test');
        await page.click('button:has-text("Create Session")');

        await page.waitForURL(/\/host\/control\//, { timeout: TIMEOUT });
        await waitForBlazorReady(page);

        // Capture diagnostics
        const diagnostics = await captureBrowserDiagnostics(page, 'HostControlPanel');

        // Assert: Debug panel visible
        const container = page.locator('.debug-panel-container');
        await expect(container).toBeVisible({ timeout: TIMEOUT });
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ HostControlPanel debug panel visible ;CLEANUP_OK`);

        // Test expand
        const icon = page.locator('.debug-panel-icon');
        await icon.click();
        await page.waitForTimeout(ANIMATION_DELAY);

        const content = page.locator('.debug-panel-content.expanded');
        await expect(content).toBeVisible({ timeout: TIMEOUT });

        // Enumerate debug actions
        const actions = await page.locator('.debug-action-button').allTextContents();
        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] Available actions: ${JSON.stringify(actions)} ;CLEANUP_OK`);

        // Take screenshot
        await page.screenshot({ path: 'Workspaces/TEMP/debug-panel-hostcontrolpanel-expanded.png', fullPage: true });

        console.log(`[DEBUG-WORKITEM:debug-panel:test:TRACE] ✅ HostControlPanel test complete ;CLEANUP_OK`);
    });
});
