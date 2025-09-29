import { expect, test } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';
const TEST_TOKEN = 'BIK6E3E8'; // Valid token from database

test.describe('Manual Routing Verification', () => {
    test('Check redirect behavior for unregistered user', async ({ page }) => {
        console.log(`[MANUAL-TEST] Testing redirect for: ${BASE_URL}/session/canvas/${TEST_TOKEN}`);

        try {
            // Navigate to the session canvas URL that should redirect
            const response = await page.goto(`${BASE_URL}/session/canvas/${TEST_TOKEN}`, {
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });

            console.log(`[MANUAL-TEST] Final URL after navigation: ${page.url()}`);
            console.log(`[MANUAL-TEST] Response status: ${response?.status()}`);

            // Wait for any redirects or navigation to complete
            await page.waitForLoadState('domcontentloaded');

            const finalUrl = page.url();
            console.log(`[MANUAL-TEST] Final URL after load: ${finalUrl}`);

            // Check if we were redirected to UserLanding
            if (finalUrl.includes('/user/landing/')) {
                console.log(`✅ SUCCESS: Redirected to UserLanding as expected`);
                console.log(`✅ Expected token in URL: ${TEST_TOKEN}`);
                console.log(`✅ Actual URL: ${finalUrl}`);

                // Verify the token is preserved in the redirect
                expect(finalUrl).toContain('/user/landing/');
                expect(finalUrl).toContain(TEST_TOKEN);
            } else {
                console.log(`❌ FAILURE: Not redirected to UserLanding`);
                console.log(`❌ Final URL: ${finalUrl}`);

                // Check if we're still on SessionCanvas (old behavior)
                if (finalUrl.includes('/session/canvas/')) {
                    console.log(`❌ Still on SessionCanvas - checking for auth error state`);

                    // Check page content to see if it shows authentication error
                    const pageContent = await page.textContent('body');
                    console.log(`❌ Page content preview: ${pageContent?.substring(0, 200)}...`);
                }
            }

        } catch (error) {
            console.log(`❌ ERROR during test: ${error}`);
            throw error;
        }
    });
});