import { expect, test } from '@playwright/test';

test.describe('Quick Phase 2 Validation (30 seconds)', () => {

    test('Quick Application & Share Elements Check', async ({ page }) => {
        console.log('🚀 [0:00] QUICK PHASE 2 VALIDATION STARTING');
        console.log('⏱️  Expected Duration: ~30 seconds');
        console.log('📋 Testing: App startup + Share elements detection');
        console.log('');

        // Set short timeouts for quick testing
        page.setDefaultTimeout(5000);

        try {
            console.log('⏱️  [0:05] Connecting to application...');

            // Try HTTP first
            await page.goto('http://localhost:9090/', {
                waitUntil: 'domcontentloaded',
                timeout: 4000
            });

            console.log('✅ [0:10] Application is accessible via HTTP');

            // Quick page analysis
            const title = await page.title();
            const bodyText = await page.locator('body').textContent();
            const buttonCount = await page.locator('button').count();

            console.log(`📄 [0:12] Title: "${title}"`);
            console.log(`🔘 [0:14] Buttons found: ${buttonCount}`);

            // Check for share-related content
            const shareKeywords = ['share', 'test', 'signalr', 'broadcast', 'send'];
            const foundKeywords = shareKeywords.filter(keyword =>
                bodyText?.toLowerCase().includes(keyword)
            );

            console.log(`🔍 [0:16] Share-related keywords found: ${foundKeywords.join(', ')}`);

            // Quick navigation test
            const routes = ['/', '/simple-signalr-test', '/host/landing'];
            let accessibleRoutes = 0;

            for (const route of routes) {
                try {
                    await page.goto(`http://localhost:9090${route}`, {
                        waitUntil: 'domcontentloaded',
                        timeout: 3000
                    });
                    accessibleRoutes++;
                    console.log(`✅ [0:${18 + accessibleRoutes * 2}] Route ${route} accessible`);
                } catch {
                    console.log(`⚠️  [0:${18 + accessibleRoutes * 2}] Route ${route} failed`);
                }
            }

            console.log('');
            console.log('📊 QUICK PHASE 2 RESULTS:');
            console.log(`   ✅ Application Status: RUNNING`);
            console.log(`   📄 Page Title: "${title}"`);
            console.log(`   🔘 Interactive Elements: ${buttonCount} buttons`);
            console.log(`   🔍 Share Keywords: ${foundKeywords.length}/${shareKeywords.length}`);
            console.log(`   🌐 Accessible Routes: ${accessibleRoutes}/${routes.length}`);
            console.log('');

            if (accessibleRoutes > 0 && buttonCount > 0) {
                console.log('🎉 [0:25] PHASE 2 QUICK VALIDATION: PASSED');
                console.log('✅ Application is running and has interactive elements');
            } else {
                console.log('⚠️  [0:25] PHASE 2 QUICK VALIDATION: PARTIAL');
                console.log('   Application runs but may need further investigation');
            }

            // Basic expectation
            expect(accessibleRoutes).toBeGreaterThan(0);

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.log('');
            console.log('❌ [0:30] PHASE 2 QUICK VALIDATION: FAILED');
            console.log(`   Error: ${errorMsg}`);
            console.log('   Application may not be running or accessible');

            throw error;
        }

        console.log('');
        console.log('🏁 [0:30] QUICK Phase 2 Complete - Total Duration: ~30 seconds');
    });

});