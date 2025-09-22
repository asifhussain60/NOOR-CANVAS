/**
 * COPILOT-DEBUG: Simple verification that SignalR groups are working
 * Tests that multiple users with same token see each other immediately
 */

const puppeteer = require('puppeteer');

async function testSignalRSync() {
    console.log('🔍 COPILOT-DEBUG: Testing SignalR participant synchronization...');

    const browsers = [];
    const pages = [];

    try {
        // Create 2 browser instances
        for (let i = 0; i < 2; i++) {
            const browser = await puppeteer.launch({
                headless: false,
                args: ['--ignore-certificate-errors']
            });
            browsers.push(browser);

            const page = await browser.newPage();
            pages.push(page);

            // Listen to console logs
            page.on('console', msg => {
                if (msg.text().includes('COPILOT-DEBUG') || msg.text().includes('NOOR-SIGNALR')) {
                    console.log(`[Browser ${i + 1}]: ${msg.text()}`);
                }
            });
        }

        // Step 1: Open waiting room in first browser
        console.log('📊 Step 1: Opening waiting room in Browser 1...');
        await pages[0].goto('http://localhost:9090/session/waiting/M7C5DS3D');
        await pages[0].waitForSelector('[data-testid="participants-list"]', { timeout: 10000 });

        // Get initial count
        const initialCountElement = await pages[0].$('[data-testid="participant-count"]');
        const initialCount = await pages[0].evaluate(el => el.textContent, initialCountElement);
        console.log(`Initial participant count: ${initialCount}`);

        // Step 2: Register participant in second browser
        console.log('📊 Step 2: Registering participant in Browser 2...');
        await pages[1].goto('http://localhost:9090/user/landing/M7C5DS3D');

        await pages[1].waitForSelector('input[name="name"]', { timeout: 5000 });
        await pages[1].type('input[name="name"]', 'Test Sync User');
        await pages[1].type('input[name="email"]', 'sync@test.com');
        await pages[1].select('select[name="country"]', 'US');
        await pages[1].click('button[type="submit"]');

        // Wait for redirect
        await pages[1].waitForFunction(
            () => window.location.pathname.includes('/session/waiting'),
            { timeout: 10000 }
        );

        // Step 3: Check for real-time update in Browser 1
        console.log('📊 Step 3: Checking for real-time sync...');

        let syncDetected = false;
        for (let attempt = 0; attempt < 10; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 500));

            const currentCountElement = await pages[0].$('[data-testid="participant-count"]');
            const currentCount = await pages[0].evaluate(el => el.textContent, currentCountElement);

            if (currentCount !== initialCount) {
                console.log(`✅ SYNC DETECTED: ${initialCount} → ${currentCount}`);
                syncDetected = true;
                break;
            }
        }

        if (!syncDetected) {
            console.log(`❌ NO REAL-TIME SYNC: Still showing ${initialCount} after 5 seconds`);
        }

        // Verification complete
        console.log('📊 Test completed');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        // Cleanup
        for (const browser of browsers) {
            await browser.close();
        }
    }
}

testSignalRSync();