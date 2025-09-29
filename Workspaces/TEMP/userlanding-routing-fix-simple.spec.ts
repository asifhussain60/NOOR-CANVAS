import { expect, test } from '@playwright/test';

const BASE_URL = process.env.APP_URL || 'https://localhost:9091';

test.describe('SessionCanvas Routing Fix Verification', () => {

    test('Unregistered user accessing session canvas should be redirected to UserLanding', async ({ page }) => {
        const runId = Date.now().toString().slice(-6);

        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Testing routing fix - unregistered user should be redirected`);

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

        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] ✅ UserLanding page loaded with correct title`);

        // Verify that we don't see "Authentication Required" error message
        const hasAuthError = await page.locator('text=Authentication Required').count() > 0;
        expect(hasAuthError).toBe(false);

        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] ✅ No authentication error shown - user correctly routed to registration`);

        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] ✅ Test completed - routing fix working correctly`);
    });

    test('Manual verification: check that direct canvas access triggers redirect', async ({ page }) => {
        const runId = Date.now().toString().slice(-6);

        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Manual verification test`);

        const testToken = 'BIK6E3E8';

        // Navigate directly to canvas URL
        await page.goto(`${BASE_URL}/session/canvas/${testToken}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        const currentUrl = page.url();
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Final URL: ${currentUrl}`);

        // Should not still be on the canvas page
        const isOnCanvas = currentUrl.includes('/session/canvas/');
        expect(isOnCanvas).toBe(false);

        // Should be on UserLanding page
        const isOnUserLanding = currentUrl.includes('/user/landing/');
        expect(isOnUserLanding).toBe(true);

        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] ✅ Verification passed - canvas access properly redirects`);
    });
});