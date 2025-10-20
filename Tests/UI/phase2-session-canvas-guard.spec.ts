import { expect, test } from '@playwright/test';

/**
 * Phase 2: SessionCanvas Registration Guard Test
 * 
 * Tests the registration guard implementation for SessionCanvas.razor
 * Validates that unregistered users are redirected to UserLanding
 * Verifies browser console logs for security monitoring
 * 
 * Debug Marker: [DEBUG-WORKITEM:userlanding:guard:canvas]
 * Session 212: User Token KJAHA99L
 */

test.describe('Phase 2: SessionCanvas Registration Guard', () => {
    const BASE_URL = 'http://localhost:9090';
    const USER_TOKEN = 'KJAHA99L';
    const SESSION_CANVAS_URL = `${BASE_URL}/session/canvas/${USER_TOKEN}`;
    const USER_LANDING_URL = `${BASE_URL}/user/landing/${USER_TOKEN}`;

    test.beforeEach(async ({ page }) => {
        // Clear all storage to simulate unregistered user
        await page.goto(BASE_URL);
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('should redirect unregistered user from SessionCanvas to UserLanding', async ({ page }) => {
        // Capture console logs
        const consoleLogs: string[] = [];
        const jsErrors: string[] = [];

        page.on('console', (msg) => {
            const text = msg.text();
            consoleLogs.push(text);
            console.log(`[BROWSER CONSOLE] ${msg.type()}: ${text}`);
        });

        page.on('pageerror', (error) => {
            jsErrors.push(error.message);
            console.error(`[BROWSER ERROR] ${error.message}`);
        });

        // Attempt to access SessionCanvas without registration
        console.log(`\n🔍 Attempting to access: ${SESSION_CANVAS_URL}`);
        await page.goto(SESSION_CANVAS_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for redirect to complete
        await page.waitForURL(`**${USER_LANDING_URL}`, { timeout: 10000 });

        // Verify we were redirected to UserLanding
        const currentUrl = page.url();
        console.log(`✅ Redirected to: ${currentUrl}`);
        expect(currentUrl).toContain('/user/landing/');
        expect(currentUrl).toContain(USER_TOKEN);

        // Verify security log messages are present
        const hasSecurityLog = consoleLogs.some(log =>
            log.includes('[DEBUG-WORKITEM:userlanding:guard:canvas]') &&
            log.includes('SECURITY')
        );

        console.log(`\n📋 Console Logs Analysis:`);
        console.log(`   Total logs captured: ${consoleLogs.length}`);
        console.log(`   Security log found: ${hasSecurityLog ? '✅ YES' : '❌ NO'}`);

        // Log relevant security messages
        const securityLogs = consoleLogs.filter(log =>
            log.includes('[DEBUG-WORKITEM:userlanding:guard:canvas]')
        );

        if (securityLogs.length > 0) {
            console.log(`\n🔐 Security Logs Found:`);
            securityLogs.forEach(log => console.log(`   ${log}`));
        }

        expect(hasSecurityLog).toBe(true);

        // Verify no JavaScript errors occurred
        console.log(`\n⚠️  JavaScript Errors: ${jsErrors.length}`);
        if (jsErrors.length > 0) {
            console.error(`   Errors found:`, jsErrors);
        }
        expect(jsErrors.length).toBe(0);

        console.log(`\n✅ Phase 2 Test PASSED - Unregistered user properly redirected`);
    });

    test('should verify bypass flag behavior after successful registration', async ({ page }) => {
        // Capture console logs
        const consoleLogs: string[] = [];

        page.on('console', (msg) => {
            consoleLogs.push(msg.text());
        });

        // First, navigate to UserLanding
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Simulate successful registration by setting bypass flag
        await page.evaluate(() => {
            sessionStorage.setItem('noor_registration_complete', 'true');
        });

        console.log(`\n🔑 Bypass flag set in sessionStorage`);

        // Now navigate to SessionCanvas
        await page.goto(SESSION_CANVAS_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Verify we stayed on SessionCanvas (no redirect)
        const currentUrl = page.url();
        console.log(`✅ Current URL: ${currentUrl}`);
        expect(currentUrl).toContain('/session/canvas/');

        // Verify bypass flag was detected and cleared
        const bypassLogs = consoleLogs.filter(log =>
            log.includes('[DEBUG-WORKITEM:userlanding:guard:canvas]') &&
            log.includes('Bypass flag detected')
        );

        console.log(`\n📋 Bypass Flag Logs:`);
        console.log(`   Bypass detection logs: ${bypassLogs.length}`);
        if (bypassLogs.length > 0) {
            bypassLogs.forEach(log => console.log(`   ${log}`));
        }

        expect(bypassLogs.length).toBeGreaterThan(0);

        // Verify bypass flag was cleared from sessionStorage
        const bypassFlagCleared = await page.evaluate(() => {
            return sessionStorage.getItem('noor_registration_complete') === null;
        });

        console.log(`   Bypass flag cleared: ${bypassFlagCleared ? '✅ YES' : '❌ NO'}`);
        expect(bypassFlagCleared).toBe(true);

        console.log(`\n✅ Phase 2 Bypass Flag Test PASSED`);
    });
});
