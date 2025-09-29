import { expect, test } from '@playwright/test';

const BASE_URL = process.env.APP_URL || 'https://localhost:9091';

test.describe('SessionCanvas Routing Fix Verification', () => {

    test('Unregistered user accessing session canvas should be redirected to UserLanding', async ({ page }) => {
        const runId = Date.now().toString().slice(-6);

        // Use completely fresh context to ensure no registration state
        await page.goto('about:blank');

        // Clear all browser storage to simulate unregistered user
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach(function (c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
        });

        await page.context().clearCookies();

        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Testing routing fix with clean user state`);

        // Use the available token from the database
        const testToken = 'BIK6E3E8';

        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Attempting to access session canvas directly: /session/canvas/${testToken}`);

        // Navigate to SessionCanvas directly (this should redirect to UserLanding)
        const response = await page.goto(`${BASE_URL}/session/canvas/${testToken}`, {
            waitUntil: 'load',
            timeout: 30000
        });

        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Initial response status: ${response?.status()}`);

        // Wait for any redirects and JavaScript execution
        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Final URL after redirect: ${currentUrl}`);

        // Verify we were redirected to UserLanding with the session token
        expect(currentUrl).toContain('/user/landing/');
        expect(currentUrl).toContain(testToken);

        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] ✅ SUCCESS: Unregistered user correctly redirected to UserLanding`);

        // Verify we're on the UserLanding page with authentication form
        await expect(page.locator('h1')).toContainText('User Authentication', { timeout: 10000 });

        // Verify the session token is populated in the form (should not be visible in token entry phase)
        // Check for registration panel elements instead
        const hasRegistrationElements = await page.locator('input[placeholder="Full Name"], input[placeholder="Email Address"]').count() > 0;

        if (hasRegistrationElements) {
            console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] ✅ UserLanding is showing registration panel (token already validated)`);
        } else {
            console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] ℹ️ UserLanding is showing token validation panel (will switch to registration after validation)`);
        }

        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] ✅ Test completed - unregistered users are properly routed to UserLanding for registration`);
    });

    test('Verify SessionCanvas no longer shows AuthenticationRequired state', async ({ page }) => {
        const runId = Date.now().toString().slice(-6);

        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Testing that SessionCanvas doesn't show authentication error anymore`);

        // Clear browser state
        await page.goto('about:blank');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        const testToken = 'BIK6E3E8';

        // Try to access SessionCanvas directly
        const response = await page.goto(`${BASE_URL}/session/canvas/${testToken}`, {
            waitUntil: 'load',
            timeout: 30000
        });

        // Wait for processing
        await page.waitForTimeout(2000);

        const currentUrl = page.url();

        // Should not be on SessionCanvas anymore
        expect(currentUrl).not.toContain('/session/canvas/');

        // Should not see "Authentication Required" message
        const hasAuthError = await page.locator('text=Authentication Required').count() > 0;
        expect(hasAuthError).toBe(false);

        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] ✅ SUCCESS: No authentication error shown, user redirected to registration`);
    });
});