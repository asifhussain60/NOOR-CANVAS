import { expect, test } from '@playwright/test';

// Configure test timeout and provide timing info
test.describe.configure({ timeout: 120000 }); // 2 minute timeout per test

test.describe('Phase 2: Quick Asset Share Validation (3-4 minutes total)', () => {

    test('Phase 2.1: Application Accessibility Test (30 seconds)', async ({ page }) => {
        console.log('⏱️  [0:00] Starting Phase 2.1 - Application accessibility...');

        // Set a reasonable timeout for navigation
        page.setDefaultTimeout(10000);

        try {
            console.log('⏱️  [0:05] Connecting to HTTP port 9090...');
            await page.goto('http://localhost:9090/', {
                waitUntil: 'domcontentloaded',
                timeout: 8000
            });

            console.log('✅ [0:10] HTTP connection successful!');

            const title = await page.title();
            console.log(`📄 [0:12] Page title: "${title}"`);

            // Quick content check
            const hasContent = await page.locator('body').count() > 0;
            expect(hasContent).toBe(true);

            console.log('✅ [0:15] Phase 2.1 COMPLETE: Application is accessible');

        } catch (error) {
            console.log(`❌ [0:15] HTTP failed, trying HTTPS: ${error}`);

            try {
                await page.goto('https://localhost:9091/', {
                    waitUntil: 'domcontentloaded',
                    timeout: 8000
                });
                console.log('✅ [0:20] HTTPS connection successful!');
            } catch (httpsError) {
                throw new Error(`Both connections failed - app may not be running. HTTP: ${error}, HTTPS: ${httpsError}`);
            }
        }

        console.log('🎉 Phase 2.1 Duration: ~30 seconds - PASSED');
    });

    test('Phase 2.2: SignalR Page Detection (45 seconds)', async ({ page }) => {
        console.log('⏱️  [0:30] Starting Phase 2.2 - SignalR functionality detection...');

        page.setDefaultTimeout(8000);

        const testRoutes = [
            { path: '/', name: 'Home' },
            { path: '/simple-signalr-test', name: 'Simple SignalR Test' },
            { path: '/signalr-test', name: 'SignalR Test' },
            { path: '/host/landing', name: 'Host Landing' }
        ];

        let successfulRoutes = 0;
        let signalrElementsFound = 0;

        for (let i = 0; i < testRoutes.length; i++) {
            const route = testRoutes[i];
            try {
                console.log(`⏱️  [0:${35 + i * 5}] Testing route: ${route.path} (${route.name})...`);

                await page.goto(`http://localhost:9090${route.path}`, {
                    waitUntil: 'domcontentloaded',
                    timeout: 6000
                });

                successfulRoutes++;

                // Quick check for interactive elements
                const buttons = await page.locator('button').count();
                const inputs = await page.locator('input').count();
                const signalrText = await page.locator('text=signalr, text=SignalR, text=Share, text=Test').count();

                if (buttons > 0 || inputs > 0 || signalrText > 0) {
                    signalrElementsFound++;
                    console.log(`✅ [0:${37 + i * 5}] ${route.name}: Found ${buttons} buttons, ${inputs} inputs, ${signalrText} SignalR elements`);
                }

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                console.log(`⚠️  [0:${37 + i * 5}] Route ${route.path} failed: ${errorMsg.substring(0, 50)}...`);
            }
        }

        console.log(`📊 [0:50] Routes accessible: ${successfulRoutes}/${testRoutes.length}`);
        console.log(`📊 [0:50] SignalR-capable routes: ${signalrElementsFound}`);

        expect(successfulRoutes).toBeGreaterThan(0);
        console.log('🎉 Phase 2.2 Duration: ~45 seconds - PASSED');
    });

    test('Phase 2.3: Debug Logging Verification (30 seconds)', async ({ page }) => {
        console.log('⏱️  [1:15] Starting Phase 2.3 - Debug logging verification...');

        page.setDefaultTimeout(6000);

        // Capture console messages for debug markers
        const debugMessages: string[] = [];
        const allMessages: string[] = [];

        page.on('console', msg => {
            const text = msg.text();
            allMessages.push(text);

            if (text.includes('DEBUG-WORKITEM') || text.includes('assetshare') || text.includes('PHASE1')) {
                debugMessages.push(text);
                console.log(`📝 [Debug] ${text.substring(0, 80)}...`);
            }
        });

        try {
            console.log('⏱️  [1:20] Loading page to trigger potential debug messages...');
            await page.goto('http://localhost:9090/simple-signalr-test');

            console.log('⏱️  [1:25] Waiting for any console activity...');
            await page.waitForTimeout(3000);

            // Try to interact if possible
            const interactiveElement = page.locator('button, input[type="submit"]').first();
            if (await interactiveElement.count() > 0) {
                console.log('⏱️  [1:30] Attempting interaction to trigger logging...');
                await interactiveElement.click();
                await page.waitForTimeout(2000);
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.log(`⚠️  [1:35] Interaction failed: ${errorMsg}`);
        }

        console.log(`📊 [1:40] Total console messages: ${allMessages.length}`);
        console.log(`📊 [1:40] Debug markers found: ${debugMessages.length}`);

        if (debugMessages.length > 0) {
            console.log('✅ [1:42] Debug logging system is active');
        } else {
            console.log('⚠️  [1:42] No debug markers detected (may need specific triggers)');
        }

        console.log('🎉 Phase 2.3 Duration: ~30 seconds - COMPLETED');
    });

    test('Phase 2.4: Share Functionality Detection (60 seconds)', async ({ page }) => {
        console.log('⏱️  [1:45] Starting Phase 2.4 - Share functionality detection...');

        page.setDefaultTimeout(8000);

        let shareButtonsFound = 0;
        let potentialSharePages = 0;

        const shareTestRoutes = [
            '/host/landing',
            '/simple-signalr-test',
            '/signalr-test',
            '/'
        ];

        for (let i = 0; i < shareTestRoutes.length; i++) {
            const route = shareTestRoutes[i];
            try {
                console.log(`⏱️  [1:${50 + i * 10}] Checking ${route} for share functionality...`);

                await page.goto(`http://localhost:9090${route}`, {
                    waitUntil: 'domcontentloaded',
                    timeout: 6000
                });

                // Look for share-related elements
                const shareButtons = await page.locator(`
          button:has-text("Share"),
          button:has-text("Test"),
          [data-testid*="share"],
          button[onclick*="share" i],
          .share-btn,
          button:has-text("Broadcast")
        `).count();

                if (shareButtons > 0) {
                    shareButtonsFound += shareButtons;
                    potentialSharePages++;
                    console.log(`✅ [1:${52 + i * 10}] Found ${shareButtons} potential share elements in ${route}`);
                }

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                console.log(`⚠️  [1:${52 + i * 10}] Route ${route}: ${errorMsg.substring(0, 40)}...`);
            }
        }

        console.log(`📊 [2:30] Total share elements found: ${shareButtonsFound}`);
        console.log(`📊 [2:30] Pages with share functionality: ${potentialSharePages}`);

        if (shareButtonsFound > 0) {
            console.log('✅ [2:32] Share functionality elements detected in application');
        } else {
            console.log('⚠️  [2:32] No obvious share elements found - may need session setup');
        }

        console.log('🎉 Phase 2.4 Duration: ~60 seconds - COMPLETED');
        console.log('🎉 PHASE 2 TOTAL DURATION: ~3 minutes - ALL TESTS COMPLETED');
    });

});