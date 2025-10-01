/**
 * Test validation for share button timing fix
 * Validates that the timer-based handler initialization works correctly
 * Issue Fixed: JavaScript handlers not available during DOM injection timing gap
 */
import { expect, test } from '@playwright/test';

test.describe('Share Button Timing Fix Validation', () => {
    test('should use timer-based handler initialization with retry logic', async ({ page }) => {
        const consoleLogs: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            // Capture our specific timing fix logs
            if (text.includes('sharebutton-timing-fix') || 
                text.includes('setupShareButtonHandlers') ||
                text.includes('Handler setup completed successfully')) {
                consoleLogs.push(`${msg.type()}: ${text}`);
            }
        });

        // Navigate to host control panel with fresh session token
        // Using session 216 with token 6EFF4ZWV from previous Host Provisioner run
        await page.goto('https://localhost:9091/host/control-panel/6EFF4ZWV');
        await page.waitForLoadState('networkidle');

        // Wait for transcript content to load
        await page.waitForSelector('[data-component="host-control-panel"]', { timeout: 30000 });

        // Wait for share buttons to be injected
        await page.waitForSelector('.ks-share-button', { timeout: 10000 });

        // Give the timer-based initialization time to complete
        await page.waitForTimeout(3000);

        console.log('Console logs captured:');
        consoleLogs.forEach(log => console.log(log));

        // Verify that timer-based initialization logs are present
        const timingFixLogs = consoleLogs.filter(log => log.includes('sharebutton-timing-fix'));
        expect(timingFixLogs.length).toBeGreaterThan(0);

        // Check for successful handler initialization
        const successLogs = consoleLogs.filter(log => 
            log.includes('Handler setup completed successfully') ||
            log.includes('Both function and buttons available')
        );
        expect(successLogs.length).toBeGreaterThan(0);

        // Test that share buttons are clickable (handlers attached properly)
        const shareButtons = page.locator('.ks-share-button');
        const buttonCount = await shareButtons.count();
        console.log(`Found ${buttonCount} share buttons for testing`);

        if (buttonCount > 0) {
            // Click the first share button to verify handlers are working
            const firstButton = shareButtons.first();
            
            // Capture any additional console logs from the click
            const clickLogs: string[] = [];
            page.on('console', msg => {
                const text = msg.text();
                if (text.includes('SHARE') || text.includes('CLICK') || text.includes('SignalR')) {
                    clickLogs.push(`${msg.type()}: ${text}`);
                }
            });

            await firstButton.click();
            await page.waitForTimeout(2000);

            console.log('Click logs captured:');
            clickLogs.forEach(log => console.log(log));

            // Verify that click was processed (handler responded)
            const clickProcessedLogs = clickLogs.filter(log =>
                log.includes('CLICK DETECTED') || 
                log.includes('SHARE BUTTON') ||
                log.includes('ShareAsset')
            );
            
            // Should have at least some click processing logs
            expect(clickProcessedLogs.length).toBeGreaterThan(0);
        }

        // Final validation: no "function not available" errors should exist
        const functionErrors = consoleLogs.filter(log => 
            log.includes('setupShareButtonHandlers') && 
            log.includes('undefined')
        );
        expect(functionErrors.length).toBe(0); // Should be zero - timing fix resolved this

        console.log('✅ Timer-based handler initialization validation completed successfully');
    });

    test('should handle retry logic when functions are not immediately available', async ({ page }) => {
        const consoleLogs: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('sharebutton-timing-fix')) {
                consoleLogs.push(`${msg.type()}: ${text}`);
            }
        });

        await page.goto('https://localhost:9091/host/control-panel/6EFF4ZWV');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000);

        // Check for retry attempts in logs
        const retryLogs = consoleLogs.filter(log => 
            log.includes('Attempt') || 
            log.includes('Retrying in') ||
            log.includes('checking function availability')
        );

        console.log(`Found ${retryLogs.length} retry-related logs:`);
        retryLogs.forEach(log => console.log(log));

        // Should have some retry attempts (proves timing logic is working)
        expect(retryLogs.length).toBeGreaterThan(0);
    });
});