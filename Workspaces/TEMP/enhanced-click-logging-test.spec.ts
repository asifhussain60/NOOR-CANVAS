import { test } from '@playwright/test';

test.describe('Share Button Click Logging Test', () => {

    test('Verify enhanced click logging works', async ({ page }) => {
        console.log('🧪 Starting enhanced share button click logging test...');

        // Capture console messages
        const consoleMessages: string[] = [];
        const errorMessages: string[] = [];

        page.on('console', msg => {
            const text = msg.text();
            consoleMessages.push(text);

            if (text.includes('DEBUG-WORKITEM:assetshare:continue') ||
                text.includes('CLICK DETECTED') ||
                text.includes('SHARE BUTTON')) {
                console.log(`🔍 [Browser Console] ${text}`);
            }

            if (msg.type() === 'error') {
                errorMessages.push(text);
                console.log(`❌ [Browser Error] ${text}`);
            }
        });

        // Monitor page errors
        page.on('pageerror', error => {
            errorMessages.push(error.message);
            console.log(`💥 [Page Error] ${error.message}`);
        });

        try {
            console.log('📍 Step 1: Loading host control panel page...');

            await page.goto('http://localhost:9090/host/control-panel/PQ9N5YWW', {
                waitUntil: 'networkidle',
                timeout: 10000
            });

            console.log('✅ Page loaded successfully');

            console.log('📍 Step 2: Looking for Start Session button...');

            // First start the session to activate share buttons
            const startButton = page.locator('button:has-text("Start Session")');
            const startButtonCount = await startButton.count();

            if (startButtonCount > 0) {
                console.log('🎯 Found Start Session button - clicking to activate share buttons...');
                await startButton.first().click();

                // Wait for session to start
                await page.waitForTimeout(3000);
                console.log('⏰ Waited for session activation...');
            } else {
                console.log('ℹ️  Session might already be active');
            }

            console.log('📍 Step 3: Looking for share buttons...');

            // Look for share buttons
            await page.waitForTimeout(2000); // Give time for buttons to appear

            const shareButtons = page.locator('.ks-share-button, button:has-text("SHARE")');
            const shareButtonCount = await shareButtons.count();

            console.log(`🔍 Found ${shareButtonCount} share buttons`);

            if (shareButtonCount > 0) {
                console.log('📍 Step 4: Testing click detection...');

                // Clear existing console messages
                consoleMessages.length = 0;

                console.log('🖱️  Clicking first share button...');

                // Click the first share button
                await shareButtons.first().click();

                console.log('⏰ Waiting for console messages...');

                // Wait a bit for console messages to appear
                await page.waitForTimeout(3000);

                // Check for our debug messages
                const clickMessages = consoleMessages.filter(msg =>
                    msg.includes('CLICK DETECTED') ||
                    msg.includes('SHARE BUTTON') ||
                    msg.includes('Setting up share button handlers')
                );

                console.log('📊 ANALYSIS RESULTS:');
                console.log(`   🔍 Total console messages: ${consoleMessages.length}`);
                console.log(`   📱 Click-related messages: ${clickMessages.length}`);
                console.log(`   ❌ Error messages: ${errorMessages.length}`);

                if (clickMessages.length > 0) {
                    console.log('✅ CLICK LOGGING IS WORKING!');
                    console.log('🎉 Click detection messages found:');
                    clickMessages.forEach((msg, i) => {
                        console.log(`   ${i + 1}. ${msg.substring(0, 100)}...`);
                    });
                } else {
                    console.log('⚠️  NO CLICK MESSAGES FOUND');
                    console.log('📋 Recent console messages:');
                    consoleMessages.slice(-5).forEach((msg, i) => {
                        console.log(`   ${i + 1}. ${msg.substring(0, 100)}...`);
                    });
                }

                if (errorMessages.length > 0) {
                    console.log('🚨 ERRORS DETECTED:');
                    errorMessages.forEach((error, i) => {
                        console.log(`   ${i + 1}. ${error}`);
                    });
                }

            } else {
                console.log('⚠️  No share buttons found on the page');

                // Let's check what buttons do exist
                const allButtons = page.locator('button');
                const allButtonCount = await allButtons.count();
                console.log(`🔍 Found ${allButtonCount} total buttons on page`);

                if (allButtonCount > 0) {
                    console.log('📋 Button texts:');
                    for (let i = 0; i < Math.min(5, allButtonCount); i++) {
                        const buttonText = await allButtons.nth(i).textContent();
                        console.log(`   ${i + 1}. "${buttonText}"`);
                    }
                }
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.log(`❌ Test failed: ${errorMsg}`);
            throw error;
        }

        console.log('🏁 Enhanced click logging test completed');
    });

});