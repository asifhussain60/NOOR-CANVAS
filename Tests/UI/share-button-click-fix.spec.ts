/**
 * Test for share button click functionality
 * Issue: Share buttons are created but clicks do nothing - handlers not attached
 * Root Cause: OnAfterRenderAsync conditions not met for setupShareButtonHandlers call
 */
import { expect, test } from '@playwright/test';

test.describe('Share Button Click Functionality', () => {
    test('should attach click handlers to injected share buttons', async ({ page, context }) => {
        // Enable console logging to capture JavaScript logs
        const consoleLogs: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'error') {
                consoleLogs.push(`${msg.type().toUpperCase()}: ${msg.text()}`);
            }
        });

        // Navigate to host control panel
        // TODO: Replace with actual host token from session 212
        await page.goto('https://localhost:9091/host/control-panel/test-host-token');

        // Wait for the page to load
        await page.waitForLoadState('networkidle');

        // Check if HostControlPanel component has loaded
        await expect(page.locator('[data-component="host-control-panel"]')).toBeVisible({ timeout: 30000 });

        // Wait for any share buttons to be injected
        const shareButtons = page.locator('[data-share-button="true"]');

        if (await shareButtons.count() > 0) {
            console.log(`Found ${await shareButtons.count()} share buttons`);

            // Check if setupShareButtonHandlers was called (should appear in console)
            const handlerSetupLogs = consoleLogs.filter(log =>
                log.includes('HANDLER SETUP') ||
                log.includes('setupShareButtonHandlers') ||
                log.includes('Share button handlers attached')
            );

            console.log('Handler setup logs:', handlerSetupLogs);

            // This should fail currently - no handler setup logs
            expect(handlerSetupLogs.length).toBeGreaterThan(0);

            // Test clicking the first share button
            const firstButton = shareButtons.first();
            await firstButton.click();

            // Should trigger share functionality (currently fails)
            // Look for SignalR broadcast or other sharing indicators
            await page.waitForTimeout(2000);

            const shareActionLogs = consoleLogs.filter(log =>
                log.includes('Publishing asset content') ||
                log.includes('SignalR') ||
                log.includes('share')
            );

            expect(shareActionLogs.length).toBeGreaterThan(0);
        } else {
            console.log('No share buttons found - may need to trigger content loading first');
        }

        // Log all console messages for debugging
        console.log('All console logs:', consoleLogs);
    });

    test('should show setupShareButtonHandlers execution conditions', async ({ page }) => {
        const consoleLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('OnAfterRenderAsync') ||
                msg.text().includes('SessionId') ||
                msg.text().includes('firstRender')) {
                consoleLogs.push(`${msg.type().toUpperCase()}: ${msg.text()}`);
            }
        });

        await page.goto('https://localhost:9091/host/control-panel/test-host-token');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000);

        // Look for OnAfterRenderAsync execution logs
        const renderLogs = consoleLogs.filter(log =>
            log.includes('OnAfterRenderAsync') ||
            log.includes('firstRender') ||
            log.includes('SessionId.HasValue')
        );

        console.log('Render condition logs:', renderLogs);
        console.log('All relevant logs:', consoleLogs);
    });
});