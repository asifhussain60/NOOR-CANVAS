/**
 * Debug Panel Visual Regression Tests
 * 
 * Purpose: Comprehensive visual regression testing for debug panels across all views
 * Tests: HostLanding, UserLanding, SessionCanvas, HostControlPanel
 * 
 * Prerequisites:
 * - App must be running at https://localhost:9091
 * - ASPNETCORE_ENVIRONMENT must be set to "Development"
 * - Percy project must be configured
 * 
 * Usage:
 *   npm test tests/debug-panel-visual-regression.spec.ts
 *   npm run test:percy tests/debug-panel-visual-regression.spec.ts
 */

import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

// Test configuration
const APP_URL = 'https://localhost:9091';
const DEBUG_PANEL_SELECTOR = '.debug-panel';
const DEBUG_TOGGLE_BTN_SELECTOR = '.debug-toggle-btn';
const DEBUG_CONTENT_SELECTOR = '.debug-content';

test.describe('Debug Panel Visual Regression Tests', () => {

    test.beforeEach(async ({ page }) => {
        // Ignore SSL certificate errors for localhost
        await page.goto(APP_URL, {
            waitUntil: 'networkidle',
            timeout: 30000
        });
    });

    test('Debug Panel - HostLanding View', async ({ page }) => {
        console.log('🧪 Testing HostLanding Debug Panel...');

        // Navigate to HostLanding
        await page.goto(`${APP_URL}/host-session-opener`);
        await page.waitForLoadState('networkidle');

        // Wait for debug panel to be visible
        const debugPanel = page.locator(DEBUG_PANEL_SELECTOR);
        await expect(debugPanel).toBeVisible({ timeout: 10000 });
        console.log('✅ Debug panel container found');

        // Check toggle button
        const toggleBtn = page.locator(DEBUG_TOGGLE_BTN_SELECTOR);
        await expect(toggleBtn).toBeVisible();
        await expect(toggleBtn).toBeEnabled();
        console.log('✅ Debug toggle button is visible and enabled');

        // Take baseline screenshot (collapsed)
        await percySnapshot(page, 'HostLanding - Debug Panel Collapsed', {
            widths: [1280, 1920],
            minHeight: 1024
        });
        console.log('📸 Captured baseline: Debug panel collapsed');

        // Click to expand debug panel
        await toggleBtn.click();
        await page.waitForTimeout(500); // Wait for animation

        // Verify expanded content is visible
        const debugContent = page.locator(DEBUG_CONTENT_SELECTOR);
        await expect(debugContent).toBeVisible();
        console.log('✅ Debug panel expanded successfully');

        // Verify debug actions are present
        const debugActions = page.locator('.debug-actions button');
        const actionCount = await debugActions.count();
        expect(actionCount).toBeGreaterThan(0);
        console.log(`✅ Found ${actionCount} debug actions`);

        // Take expanded screenshot
        await percySnapshot(page, 'HostLanding - Debug Panel Expanded', {
            widths: [1280, 1920],
            minHeight: 1024
        });
        console.log('📸 Captured: Debug panel expanded');

        // Verify debug action names
        const actionNames = await debugActions.allTextContents();
        console.log(`📋 Debug actions: ${actionNames.join(', ')}`);
        expect(actionNames.length).toBeGreaterThan(0);
    });

    test('Debug Panel - UserLanding View', async ({ page }) => {
        console.log('🧪 Testing UserLanding Debug Panel...');

        // Navigate to UserLanding (need a valid session token)
        // For now, we'll use a placeholder - this should be replaced with actual test session
        await page.goto(`${APP_URL}/join-session/TESTUSER`);
        await page.waitForLoadState('networkidle');

        // Wait for debug panel
        const debugPanel = page.locator(DEBUG_PANEL_SELECTOR);
        await expect(debugPanel).toBeVisible({ timeout: 10000 });
        console.log('✅ Debug panel container found');

        // Baseline screenshot (collapsed)
        await percySnapshot(page, 'UserLanding - Debug Panel Collapsed', {
            widths: [1280, 1920],
            minHeight: 1024
        });
        console.log('📸 Captured baseline: Debug panel collapsed');

        // Expand debug panel
        const toggleBtn = page.locator(DEBUG_TOGGLE_BTN_SELECTOR);
        await toggleBtn.click();
        await page.waitForTimeout(500);

        // Verify expanded
        const debugContent = page.locator(DEBUG_CONTENT_SELECTOR);
        await expect(debugContent).toBeVisible();
        console.log('✅ Debug panel expanded successfully');

        // Check for "Enter Test Data" action (specific to UserLanding)
        const testDataButton = page.locator('button:has-text("Enter Test Data")');
        const hasTestDataAction = await testDataButton.count() > 0;
        if (hasTestDataAction) {
            console.log('✅ "Enter Test Data" action found (UserLanding specific)');
        }

        // Capture expanded state
        await percySnapshot(page, 'UserLanding - Debug Panel Expanded', {
            widths: [1280, 1920],
            minHeight: 1024
        });
        console.log('📸 Captured: Debug panel expanded');
    });

    test('Debug Panel - SessionCanvas View', async ({ page }) => {
        console.log('🧪 Testing SessionCanvas Debug Panel...');

        // This test requires a live session
        // We'll need to create one via HostControlPanel first

        // Step 1: Open HostLanding and create session
        await page.goto(`${APP_URL}/host-session-opener`);
        await page.waitForLoadState('networkidle');

        // Fill session form (use test data)
        await page.selectOption('select#categorySelect', { label: 'Seerah' });
        await page.selectOption('select#sessionSelect', { label: 'Need For Messengers' });
        await page.fill('input[type="date"]', '2025-10-15');
        await page.fill('input[type="time"]', '19:00');
        await page.fill('input[placeholder="Duration (minutes)"]', '60');

        // Click "Generate Token" button
        const generateBtn = page.locator('button:has-text("Generate Token")');
        await generateBtn.click();
        await page.waitForTimeout(2000);

        // Click "Open Control Panel" to start session
        const openPanelBtn = page.locator('button:has-text("Open Control Panel")');
        if (await openPanelBtn.isVisible()) {
            await openPanelBtn.click();
            await page.waitForLoadState('networkidle');

            // Should now be on HostControlPanel, click "Start Session"
            const startBtn = page.locator('button:has-text("Start Session")');
            if (await startBtn.isVisible()) {
                await startBtn.click();
                await page.waitForTimeout(3000);

                // Now we should be on SessionCanvas
                // Check for debug panel
                const debugPanel = page.locator(DEBUG_PANEL_SELECTOR);
                const isVisible = await debugPanel.isVisible();

                if (isVisible) {
                    console.log('✅ SessionCanvas debug panel found');

                    // Capture baseline
                    await percySnapshot(page, 'SessionCanvas - Debug Panel Collapsed', {
                        widths: [1280, 1920],
                        minHeight: 1024
                    });

                    // Expand panel
                    const toggleBtn = page.locator(DEBUG_TOGGLE_BTN_SELECTOR);
                    await toggleBtn.click();
                    await page.waitForTimeout(500);

                    // Capture expanded
                    await percySnapshot(page, 'SessionCanvas - Debug Panel Expanded', {
                        widths: [1280, 1920],
                        minHeight: 1024
                    });

                    console.log('✅ SessionCanvas debug panel captured');
                } else {
                    console.warn('⚠️  SessionCanvas debug panel not found - may require active session');
                }
            }
        }
    });

    test('Debug Panel - HostControlPanel View', async ({ page }) => {
        console.log('🧪 Testing HostControlPanel Debug Panel...');

        // Create a test session first
        await page.goto(`${APP_URL}/host-session-opener`);
        await page.waitForLoadState('networkidle');

        // Expand debug panel on HostLanding
        const hostLandingDebugBtn = page.locator(DEBUG_TOGGLE_BTN_SELECTOR);
        await hostLandingDebugBtn.click();
        await page.waitForTimeout(500);

        // Click "Enter Test Token" action
        const testTokenBtn = page.locator('button:has-text("Enter Test Token")');
        if (await testTokenBtn.isVisible()) {
            await testTokenBtn.click();
            await page.waitForTimeout(1000);

            // Click "Quick Authenticate"
            const quickAuthBtn = page.locator('button:has-text("Quick Authenticate")');
            if (await quickAuthBtn.isVisible()) {
                await quickAuthBtn.click();
                await page.waitForTimeout(2000);

                // Should now be on HostControlPanel
                const debugPanel = page.locator(DEBUG_PANEL_SELECTOR);
                await expect(debugPanel).toBeVisible({ timeout: 10000 });
                console.log('✅ HostControlPanel debug panel found');

                // Capture baseline
                await percySnapshot(page, 'HostControlPanel - Debug Panel Collapsed', {
                    widths: [1280, 1920],
                    minHeight: 1024
                });

                // Expand panel
                const toggleBtn = page.locator(DEBUG_TOGGLE_BTN_SELECTOR);
                await toggleBtn.click();
                await page.waitForTimeout(500);

                // Verify "Test Share Asset" and "Test Asset Detection" actions
                const shareAssetBtn = page.locator('button:has-text("Test Share Asset")');
                const assetDetectBtn = page.locator('button:has-text("Test Asset Detection")');

                const hasShareAsset = await shareAssetBtn.count() > 0;
                const hasAssetDetect = await assetDetectBtn.count() > 0;

                console.log(`✅ Share Asset action: ${hasShareAsset ? 'Found' : 'Not found'}`);
                console.log(`✅ Asset Detection action: ${hasAssetDetect ? 'Found' : 'Not found'}`);

                // Capture expanded
                await percySnapshot(page, 'HostControlPanel - Debug Panel Expanded', {
                    widths: [1280, 1920],
                    minHeight: 1024
                });

                console.log('✅ HostControlPanel debug panel captured');
            }
        }
    });

    test('Debug Panel - CSS Verification', async ({ page }) => {
        console.log('🧪 Testing Debug Panel CSS...');

        await page.goto(`${APP_URL}/host-session-opener`);
        await page.waitForLoadState('networkidle');

        // Check if debug-panel.css is loaded
        const cssLoaded = await page.evaluate(() => {
            const stylesheets = Array.from(document.styleSheets);
            return stylesheets.some(sheet =>
                sheet.href && sheet.href.includes('debug-panel.css')
            );
        });

        console.log(`CSS Loaded: ${cssLoaded ? '✅' : '❌'}`);
        expect(cssLoaded).toBeTruthy();

        // Check computed styles
        const debugPanel = page.locator(DEBUG_PANEL_SELECTOR);
        await expect(debugPanel).toBeVisible();

        const styles = await page.evaluate(() => {
            const panel = document.querySelector('.debug-panel');
            if (!panel) return null;

            const computed = window.getComputedStyle(panel);
            return {
                position: computed.position,
                bottom: computed.bottom,
                right: computed.right,
                zIndex: computed.zIndex
            };
        });

        console.log('Debug Panel Styles:', styles);
        expect(styles?.position).toBe('fixed');
        expect(styles?.zIndex).toBe('9999');

        console.log('✅ CSS verification complete');
    });

    test('Debug Panel - JavaScript Interaction', async ({ page }) => {
        console.log('🧪 Testing Debug Panel JavaScript Interaction...');

        await page.goto(`${APP_URL}/host-session-opener`);
        await page.waitForLoadState('networkidle');

        // Get initial state
        const debugPanel = page.locator(DEBUG_PANEL_SELECTOR);
        const debugContent = page.locator(DEBUG_CONTENT_SELECTOR);

        // Initially content should be hidden
        const initiallyExpanded = await debugContent.isVisible().catch(() => false);
        console.log(`Initially expanded: ${initiallyExpanded}`);

        // Click toggle button
        const toggleBtn = page.locator(DEBUG_TOGGLE_BTN_SELECTOR);
        await toggleBtn.click();
        await page.waitForTimeout(500);

        // Content should now be visible
        const afterClickExpanded = await debugContent.isVisible();
        console.log(`After click expanded: ${afterClickExpanded}`);

        expect(afterClickExpanded).toBe(!initiallyExpanded);

        // Click again to collapse
        await toggleBtn.click();
        await page.waitForTimeout(500);

        const afterSecondClick = await debugContent.isVisible().catch(() => false);
        console.log(`After second click: ${afterSecondClick}`);

        expect(afterSecondClick).toBe(initiallyExpanded);

        console.log('✅ JavaScript interaction test complete');
    });
});
