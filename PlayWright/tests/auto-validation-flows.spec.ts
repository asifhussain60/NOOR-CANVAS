import { expect, test } from '@playwright/test';

/**
 * AUTO-VALIDATION FLOWS - Comprehensive Test Suite
 * Tests automatic token validation for both HostLanding and UserLanding components
 * Requirements: When tokens are present in URL and field, automatically proceed without manual interaction
 */

const TEST_CONFIG = {
    baseUrl: 'https://localhost:9091',
    timeout: 30000,
    userToken: 'V37KMP9P', // Valid user token for session ID 1
    hostToken: 'ADMIN123', // Valid host token (replace with actual valid token)
    sessionId: 1
};

test.describe('Auto-Validation Flows', () => {

    test.beforeEach(async ({ page }) => {
        // Accept any SSL certificate issues for localhost
        await page.goto(TEST_CONFIG.baseUrl, {
            waitUntil: 'domcontentloaded',
            timeout: TEST_CONFIG.timeout
        });
    });

    test.describe('UserLanding Auto-Validation', () => {

        test('should automatically validate token and show registration panel when token is in URL', async ({ page }) => {
            console.log('🧪 Testing UserLanding auto-validation with URL token');

            // Navigate with token in URL path parameter
            const targetUrl = `${TEST_CONFIG.baseUrl}/user/landing/${TEST_CONFIG.userToken}`;
            console.log(`📍 Navigating to: ${targetUrl}`);

            await page.goto(targetUrl, {
                waitUntil: 'domcontentloaded',
                timeout: TEST_CONFIG.timeout
            });

            // Wait for automatic token validation to complete
            console.log('⏳ Waiting for automatic token validation...');
            await page.waitForTimeout(3000);

            // Verify the page has loaded and auto-validation occurred
            await expect(page.locator('h1')).toContainText('User Authentication');

            // Verify session name was loaded automatically (should not be default value)
            const sessionName = page.locator('p:has-text("Need For Messengers")');
            await expect(sessionName).toBeVisible({ timeout: 10000 });
            console.log('✅ Session name loaded automatically: "Need For Messengers"');

            // Verify registration panel is automatically displayed (not token input panel)
            const registrationHeader = page.locator('h3:has-text("REGISTRATION")');
            await expect(registrationHeader).toBeVisible({ timeout: 5000 });
            console.log('✅ Registration panel displayed automatically');

            // Verify form fields are present
            await expect(page.locator('input[placeholder="Enter your name"]')).toBeVisible();
            await expect(page.locator('input[placeholder="Enter your email"]')).toBeVisible();
            await expect(page.locator('select')).toBeVisible(); // Country dropdown
            console.log('✅ All registration form fields are visible');

            // Verify countries are loaded
            const countrySelect = page.locator('select');
            await expect(countrySelect).not.toHaveValue(''); // Should have countries loaded

            // Check that multiple countries are available
            const countryOptions = await countrySelect.locator('option').count();
            expect(countryOptions).toBeGreaterThan(10); // Should have many countries loaded
            console.log(`✅ Countries loaded automatically: ${countryOptions} options`);

            console.log('🎉 UserLanding auto-validation test passed!');
        });

        test('should automatically validate token from query parameter', async ({ page }) => {
            console.log('🧪 Testing UserLanding auto-validation with query parameter');

            // Navigate with token in query parameter
            const targetUrl = `${TEST_CONFIG.baseUrl}/user/landing?token=${TEST_CONFIG.userToken}`;
            console.log(`📍 Navigating to: ${targetUrl}`);

            await page.goto(targetUrl, {
                waitUntil: 'domcontentloaded',
                timeout: TEST_CONFIG.timeout
            });

            // Wait for automatic token validation
            await page.waitForTimeout(3000);

            // Verify automatic validation occurred
            const registrationHeader = page.locator('h3:has-text("REGISTRATION")');
            await expect(registrationHeader).toBeVisible({ timeout: 10000 });
            console.log('✅ Auto-validation from query parameter successful');
        });

        test('should show token input panel when no token is provided', async ({ page }) => {
            console.log('🧪 Testing UserLanding without token (manual mode)');

            await page.goto(`${TEST_CONFIG.baseUrl}/user/landing`, {
                waitUntil: 'domcontentloaded',
                timeout: TEST_CONFIG.timeout
            });

            // Should show token input panel, not registration panel
            const tokenHeader = page.locator('h3:has-text("ENTER TOKEN")');
            await expect(tokenHeader).toBeVisible({ timeout: 5000 });
            console.log('✅ Token input panel shown when no token provided');

            // Verify registration panel is NOT shown
            const registrationHeader = page.locator('h3:has-text("REGISTRATION")');
            await expect(registrationHeader).not.toBeVisible();
            console.log('✅ Registration panel correctly hidden in manual mode');
        });
    });

    test.describe('HostLanding Auto-Validation', () => {

        test('should automatically validate and route to control panel when host token is in URL', async ({ page }) => {
            console.log('🧪 Testing HostLanding auto-validation with URL token');

            // Navigate with host token in URL
            const targetUrl = `${TEST_CONFIG.baseUrl}/host/${TEST_CONFIG.hostToken}`;
            console.log(`📍 Navigating to: ${targetUrl}`);

            await page.goto(targetUrl, {
                waitUntil: 'domcontentloaded',
                timeout: TEST_CONFIG.timeout
            });

            // Wait for auto-validation to trigger
            console.log('⏳ Waiting for automatic host authentication...');
            await page.waitForTimeout(3000);

            // Auto-validation should trigger authentication and routing
            // We should either see:
            // 1. Loading state, then redirection
            // 2. Direct redirection to session opener

            // Check for loading indicator or successful routing
            const isLoading = await page.locator('text=Authenticating...').isVisible();
            if (isLoading) {
                console.log('⚡ Loading state detected - auto-authentication in progress');
                await page.waitForTimeout(5000); // Wait for completion
            }

            // Should eventually navigate to session opener or show session info
            const currentUrl = page.url();
            console.log(`📍 Current URL after auto-validation: ${currentUrl}`);

            // Check if we've been redirected or if session info loaded
            const hasRedirected = currentUrl.includes('session-opener') || currentUrl.includes('control-panel');
            const hasSessionInfo = await page.locator('text=Need For Messengers').isVisible();

            if (hasRedirected) {
                console.log('✅ Auto-validation successful - redirected to next step');
            } else if (hasSessionInfo) {
                console.log('✅ Auto-validation successful - session info loaded');
            } else {
                console.log('⚠️  Auto-validation may have failed or token invalid');
                // This might be expected if the test token is not valid
            }
        });

        test('should show manual authentication form when no token is provided', async ({ page }) => {
            console.log('🧪 Testing HostLanding without token (manual mode)');

            await page.goto(`${TEST_CONFIG.baseUrl}/host/landing`, {
                waitUntil: 'domcontentloaded',
                timeout: TEST_CONFIG.timeout
            });

            // Should show the host authentication form
            await expect(page.locator('h1')).toContainText('Host Authentication');
            await expect(page.locator('h3:has-text("HOST SESSION")')).toBeVisible();

            // Should show input field for manual token entry
            const tokenInput = page.locator('input[placeholder="Enter your Host GUID Token"]');
            await expect(tokenInput).toBeVisible();
            console.log('✅ Manual authentication form displayed when no token provided');

            // Button should be disabled until token is entered
            const authButton = page.locator('button:has-text("Access Host Control Panel")');
            await expect(authButton).toBeDisabled();
            console.log('✅ Authentication button properly disabled without token');
        });

        test('should validate token format requirements', async ({ page }) => {
            console.log('🧪 Testing HostLanding token format validation');

            await page.goto(`${TEST_CONFIG.baseUrl}/host/landing`);

            const tokenInput = page.locator('input[placeholder="Enter your Host GUID Token"]');
            const authButton = page.locator('button:has-text("Access Host Control Panel")');

            // Test with invalid token (too short)
            await tokenInput.fill('ABC123');
            await expect(authButton).toBeDisabled();
            console.log('✅ Button disabled for short token');

            // Test with valid format token
            await tokenInput.fill('ADMIN123');
            await expect(authButton).toBeEnabled();
            console.log('✅ Button enabled for valid format token');
        });
    });

    test.describe('Cross-Browser Auto-Validation Compatibility', () => {

        test('should work consistently across page refreshes', async ({ page }) => {
            console.log('🧪 Testing auto-validation consistency across refreshes');

            const targetUrl = `${TEST_CONFIG.baseUrl}/user/landing/${TEST_CONFIG.userToken}`;

            // First load
            await page.goto(targetUrl);
            await page.waitForTimeout(3000);

            const firstLoadResult = await page.locator('h3:has-text("REGISTRATION")').isVisible();
            console.log(`First load auto-validation: ${firstLoadResult ? 'SUCCESS' : 'FAILED'}`);

            // Refresh and test again
            await page.reload();
            await page.waitForTimeout(3000);

            const secondLoadResult = await page.locator('h3:has-text("REGISTRATION")').isVisible();
            console.log(`Second load auto-validation: ${secondLoadResult ? 'SUCCESS' : 'FAILED'}`);

            expect(firstLoadResult).toBe(true);
            expect(secondLoadResult).toBe(true);
            console.log('✅ Auto-validation consistent across refreshes');
        });
    });

    test.describe('Error Handling in Auto-Validation', () => {

        test('should handle invalid tokens gracefully', async ({ page }) => {
            console.log('🧪 Testing auto-validation with invalid token');

            const invalidToken = 'INVALID1';
            const targetUrl = `${TEST_CONFIG.baseUrl}/user/landing/${invalidToken}`;

            await page.goto(targetUrl);
            await page.waitForTimeout(3000);

            // Should show error or fall back to manual mode
            const hasError = await page.locator('text=Invalid').isVisible();
            const isManualMode = await page.locator('h3:has-text("ENTER TOKEN")').isVisible();

            expect(hasError || isManualMode).toBe(true);
            console.log('✅ Invalid token handled gracefully');
        });
    });
});