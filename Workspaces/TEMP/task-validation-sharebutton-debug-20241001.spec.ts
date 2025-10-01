import { expect, test } from '@playwright/test';

/**
 * Simplified validation test for share button handler attachment fix
 * Tests the critical timing fix for JavaScript handler attachment
 */

test.describe('Share Button Handler Timing Fix Validation', () => {

    test('Validate JavaScript handler attachment after transcript render', async ({ page }) => {
        console.log('🔧 Testing share button handler attachment timing fix...');

        // Capture console logs for handler setup
        const handlerLogs: string[] = [];
        const clickLogs: string[] = [];
        const errorLogs: string[] = [];

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('HANDLER SETUP') || text.includes('setupShareButtonHandlers') || text.includes('Reinitializing')) {
                handlerLogs.push(text);
                console.log('🔧 Handler:', text);
            }
            if (text.includes('CLICK DETECTED') || text.includes('Share button')) {
                clickLogs.push(text);
                console.log('🖱️ Click:', text);
            }
            if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
                errorLogs.push(text);
                console.log('❌ Error:', text);
            }
        });

        // Navigate to host control panel (using fresh token 6EFF4ZWV for session 216)
        console.log('📍 Loading host control panel with fresh token...');
        await page.goto('https://localhost:9091/host/control-panel/6EFF4ZWV', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Start session if needed
        const startButton = page.locator('button:has-text("Start Session")');
        if (await startButton.isVisible({ timeout: 5000 })) {
            console.log('🚀 Starting session...');
            await startButton.click();
            await page.waitForTimeout(5000);
        }

        // Wait for transcript content
        console.log('📍 Waiting for transcript...');
        await page.waitForSelector('.session-transcript-content', {
            timeout: 20000,
            state: 'visible'
        });

        // Wait additional time for handler reinitialization
        await page.waitForTimeout(3000);

        // Check for share buttons
        console.log('📍 Checking share buttons...');
        const shareButtons = page.locator('[data-share-button="asset"]');
        const buttonCount = await shareButtons.count();

        console.log(`🔍 Found ${buttonCount} share buttons`);
        expect(buttonCount).toBeGreaterThan(0);

        // Test a button click if buttons exist
        if (buttonCount > 0) {
            console.log('📍 Testing button click...');

            const firstButton = shareButtons.first();
            await expect(firstButton).toBeVisible();

            // Click the button
            await firstButton.click();
            await page.waitForTimeout(2000);

            // Verify click was detected
            const hasClickDetected = clickLogs.some(log =>
                log.includes('CLICK DETECTED') || log.includes('Share button')
            );

            if (hasClickDetected) {
                console.log('✅ Button click detected - handlers are working!');
            } else {
                console.log('⚠️ Button click not detected - may need further investigation');
            }
        }

        // Log test results
        console.log('📊 Test Results:');
        console.log(`   - Share buttons: ${buttonCount}`);
        console.log(`   - Handler logs: ${handlerLogs.length}`);
        console.log(`   - Click logs: ${clickLogs.length}`);
        console.log(`   - Error logs: ${errorLogs.length}`);

        // Verify handler setup occurred
        const hasHandlerSetup = handlerLogs.some(log =>
            log.includes('HANDLER SETUP') || log.includes('Reinitializing') || log.includes('setupShareButtonHandlers')
        );

        expect(hasHandlerSetup).toBeTruthy();
        expect(errorLogs.length).toBe(0);

        console.log(hasHandlerSetup ? '✅ Handler setup confirmed' : '❌ No handler setup detected');
        console.log(errorLogs.length === 0 ? '✅ No errors detected' : `❌ ${errorLogs.length} errors found`);
    });
});