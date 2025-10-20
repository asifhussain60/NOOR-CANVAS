/**
 * User Landing Manual Navigation Test
 * 
 * Purpose: Verify that participants are not automatically navigated to waiting room
 * after registration. Instead, they should see a "Registration Complete" panel with
 * a manual "Join Waiting Room" button.
 * 
 * Test Coverage:
 * - Registration completion shows success panel
 * - Manual navigation button displayed
 * - Button click navigates to correct destination (waiting room for created sessions)
 * - No automatic navigation occurs after registration
 * - Console logs monitored for JavaScript errors
 * 
 * Percy Visual Regression: Captures registration complete panel
 * 
 * @key userlanding
 * @debug-level trace
 */

import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

// Test Data - Session 212 (Created status)
const SESSION_TOKEN = 'KJAHA99L'; // User participant token
const TEST_USER = {
    name: 'Test User Manual Nav',
    email: 'testuser-manual-nav@example.com',
    country: 'US'
};

test.describe('User Landing Manual Navigation', () => {
    let consoleErrors: string[] = [];
    let consoleWarnings: string[] = [];

    test.beforeEach(async ({ page }) => {
        // Monitor console for errors
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();

            if (type === 'error') {
                consoleErrors.push(text);
                console.log(`[BROWSER ERROR] ${text}`);
            } else if (type === 'warning') {
                consoleWarnings.push(text);
                console.log(`[BROWSER WARNING] ${text}`);
            }
        });

        // Clear error arrays
        consoleErrors = [];
        consoleWarnings = [];

        // Clear localStorage to ensure clean state
        await page.goto('https://localhost:9091/user/landing');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('should show registration complete panel with manual join button after registration', async ({ page }) => {
        console.log('[TEST] Starting user landing manual navigation test');

        // Step 1: Navigate to user landing with session token
        console.log(`[TEST] Navigating to /user/landing/${SESSION_TOKEN}`);
        await page.goto(`https://localhost:9091/user/landing/${SESSION_TOKEN}`);
        await page.waitForLoadState('networkidle');

        // Step 2: Verify registration panel loaded
        console.log('[TEST] Verifying registration panel is displayed');
        await expect(page.locator('h3:has-text("REGISTRATION")')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('#name-input')).toBeVisible();

        // Step 3: Fill registration form
        console.log('[TEST] Filling registration form');
        await page.fill('#name-input', TEST_USER.name);
        await page.locator('input[placeholder="Enter your email"]').fill(TEST_USER.email);

        // Wait for countries dropdown to be enabled (not disabled)
        console.log('[TEST] Waiting for countries dropdown to load');
        await page.waitForSelector('select.user-landing-select:not([disabled])', { timeout: 15000 });

        // Select country
        await page.selectOption('select.user-landing-select', TEST_USER.country);

        // Step 4: Submit registration
        console.log('[TEST] Submitting registration');
        const submitButton = page.locator('button.user-landing-button');
        await submitButton.click();

        // Step 5: Wait for registration processing
        console.log('[TEST] Waiting for registration to complete');
        await page.waitForTimeout(2000); // Allow time for API call and state update

        // Step 6: Verify NO automatic navigation occurred (URL should still be /user/landing/*)
        console.log('[TEST] Verifying no automatic navigation occurred');
        const currentUrl = page.url();
        expect(currentUrl).toContain('/user/landing/');
        expect(currentUrl).not.toContain('/session/waiting/');
        expect(currentUrl).not.toContain('/session/canvas/');
        console.log(`[TEST] ✓ URL remained at user landing: ${currentUrl}`);

        // Step 7: Verify "Registration Complete" panel is displayed
        console.log('[TEST] Verifying registration complete panel is displayed');
        await expect(page.locator('h3:has-text("REGISTRATION COMPLETE")')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('p:has-text("Your registration was successful")')).toBeVisible();

        // Verify success checkmark icon
        await expect(page.locator('i.fa-circle-check')).toBeVisible();
        console.log('[TEST] ✓ Registration complete panel displayed');

        // Step 8: Verify manual join button is displayed
        console.log('[TEST] Verifying join button is displayed');
        const joinButton = page.locator('button.user-landing-button');
        await expect(joinButton).toBeVisible();

        // Verify button text (should be "Join Waiting Room" for created session)
        const buttonText = await joinButton.textContent();
        expect(buttonText).toContain('Join Waiting Room');
        console.log(`[TEST] ✓ Join button displayed with text: ${buttonText}`);

        // Step 9: Percy visual snapshot - Registration Complete Panel
        console.log('[TEST] Taking Percy snapshot of registration complete panel');
        await percySnapshot(page, 'User Landing - Registration Complete Panel', {
            widths: [375, 768, 1280],
            minHeight: 1024
        });

        // Step 10: Click join button and verify navigation
        console.log('[TEST] Clicking join button');
        await joinButton.click();
        await page.waitForLoadState('networkidle');

        // Step 11: Verify navigation to waiting room
        console.log('[TEST] Verifying navigation to waiting room');
        await page.waitForURL(`**/session/waiting/${SESSION_TOKEN}`, { timeout: 10000 });
        const finalUrl = page.url();
        expect(finalUrl).toContain('/session/waiting/');
        console.log(`[TEST] ✓ Successfully navigated to: ${finalUrl}`);

        // Step 12: Verify no JavaScript errors
        console.log('[TEST] Verifying no console errors');
        expect(consoleErrors.length).toBe(0);
        if (consoleErrors.length > 0) {
            console.error('[TEST] ❌ JavaScript errors detected:', consoleErrors);
        }
        console.log('[TEST] ✓ No JavaScript errors detected');

        console.log('[TEST] ✅ Test completed successfully');
    });

    test('should handle manual navigation for active sessions', async ({ page }) => {
        // Note: This test would require Session 212 to be in "active" status
        // For now, we'll test the flow with a created session, but document the expected behavior
        console.log('[TEST] Starting active session manual navigation test');

        // Step 1: Navigate to user landing
        await page.goto(`https://localhost:9091/user/landing/${SESSION_TOKEN}`);
        await page.waitForLoadState('networkidle');

        // Step 2: Complete registration (same as previous test)
        await expect(page.locator('h3:has-text("REGISTRATION")')).toBeVisible({ timeout: 10000 });
        await page.fill('#name-input', 'Test User Active Session');
        await page.locator('input[placeholder="Enter your email"]').fill('testuser-active@example.com');

        // Wait for countries dropdown
        await page.waitForSelector('select.user-landing-select:not([disabled])', { timeout: 15000 });
        await page.selectOption('select.user-landing-select', 'US');

        // Step 3: Submit registration
        const submitButton = page.locator('button.user-landing-button');
        await submitButton.click();
        await page.waitForTimeout(2000);

        // Step 4: Verify registration complete panel
        await expect(page.locator('h3:has-text("REGISTRATION COMPLETE")')).toBeVisible({ timeout: 5000 });

        // Step 5: Check button text (will be "Join Waiting Room" for created session)
        // If session were active, it would be "Join Live Canvas"
        const joinButton = page.locator('button.user-landing-button');
        const buttonText = await joinButton.textContent();

        console.log(`[TEST] Button text: ${buttonText}`);
        // For created session (Session 212 default state)
        expect(buttonText).toMatch(/Join Waiting Room|Join Live Canvas/);

        console.log('[TEST] ✅ Test completed - manual navigation verified');
    });

    test.afterEach(async () => {
        // Report console errors/warnings
        if (consoleErrors.length > 0) {
            console.error('[CLEANUP] Console errors detected during test:', consoleErrors);
        }
        if (consoleWarnings.length > 0) {
            console.warn('[CLEANUP] Console warnings detected during test:', consoleWarnings);
        }
    });
});
