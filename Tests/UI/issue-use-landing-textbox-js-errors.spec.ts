import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';

test.describe('UserLanding Textbox JavaScript Errors - Issue use-landing', () => {
    // Browser console log tracking
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    const jsErrors: string[] = [];

    test.beforeEach(async ({ page }) => {
        // Track console messages
        page.on('console', msg => {
            const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
            consoleMessages.push(text);
            if (msg.type() === 'error' || msg.type() === 'warning') {
                consoleErrors.push(text);
            }
        });

        // Track page errors (JavaScript runtime errors)
        page.on('pageerror', error => {
            const text = `[JS ERROR] ${error.message}\n${error.stack}`;
            jsErrors.push(text);
            consoleErrors.push(text);
        });

        // Track request failures
        page.on('requestfailed', request => {
            const text = `[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`;
            consoleErrors.push(text);
        });
    });

    test.afterEach(async ({ }, testInfo) => {
        // Log console errors if test failed OR if any errors were detected
        if ((testInfo.status !== 'passed' || consoleErrors.length > 0) && consoleErrors.length > 0) {
            console.log('\n❌ Browser Console Errors:');
            consoleErrors.forEach(err => console.log(`  ${err}`));
        }

        if (jsErrors.length > 0) {
            console.log('\n🚨 JavaScript Runtime Errors:');
            jsErrors.forEach(err => console.log(`  ${err}`));
        }

        // Clear for next test
        consoleMessages.length = 0;
        consoleErrors.length = 0;
        jsErrors.length = 0;
    });

    test('Token input typing - No JavaScript errors', async ({ page }) => {
        console.log('🧪 Test: Token input typing without JavaScript errors');

        // Navigate to user landing page
        await page.goto(`${BASE_URL}/user/landing`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Take initial Percy snapshot
        await percySnapshot(page, 'UserLanding - Token Panel Initial', {
            widths: [375, 768, 1280]
        });

        // Verify token input is visible
        const tokenInput = page.locator('#token-input');
        await expect(tokenInput).toBeVisible();

        // Focus on the input
        await tokenInput.focus();
        await page.waitForTimeout(200);

        // Clear any existing errors before typing
        jsErrors.length = 0;
        consoleErrors.length = 0;

        // Type token character by character to trigger keypress events
        const testToken = 'TEST1234';
        console.log(`📝 Typing token: ${testToken}`);

        for (const char of testToken) {
            await tokenInput.type(char, { delay: 100 });
            await page.waitForTimeout(50);

            // Check for JavaScript errors after each keypress
            if (jsErrors.length > 0) {
                console.error(`❌ JavaScript error detected after typing '${char}'`);
                console.error(jsErrors[jsErrors.length - 1]);
                throw new Error(`JavaScript error occurred while typing '${char}' in token input`);
            }
        }

        // Verify the input value
        const inputValue = await tokenInput.inputValue();
        expect(inputValue).toBe(testToken);
        console.log(`✅ Input value: ${inputValue}`);

        // Take Percy snapshot after typing
        await percySnapshot(page, 'UserLanding - Token Typed', {
            widths: [375, 768, 1280]
        });

        // Final check - ensure NO JavaScript errors occurred
        expect(jsErrors.length, 'JavaScript errors should be 0').toBe(0);
        console.log('✅ No JavaScript errors detected during token input');
    });

    test('Registration form typing - No JavaScript errors', async ({ page }) => {
        console.log('🧪 Test: Registration form typing without JavaScript errors');

        // Navigate with a valid token to get to registration panel
        const VALID_TOKEN = 'KJAHA99L'; // Session 212
        await page.goto(`${BASE_URL}/user/landing/${VALID_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Wait for token validation and panel switch

        // Clear errors accumulated during page load
        jsErrors.length = 0;
        consoleErrors.length = 0;

        // Verify we're on the registration panel
        const nameInput = page.locator('#name-input');
        await expect(nameInput).toBeVisible();

        // Take Percy snapshot of registration panel
        await percySnapshot(page, 'UserLanding - Registration Panel Initial', {
            widths: [375, 768, 1280]
        });

        // Test name input
        console.log('📝 Typing in name input...');
        await nameInput.focus();
        await nameInput.type('John Doe', { delay: 100 });

        if (jsErrors.length > 0) {
            console.error('❌ JavaScript error detected during name input');
            console.error(jsErrors[jsErrors.length - 1]);
            throw new Error('JavaScript error occurred while typing in name input');
        }

        // Test email input - use placeholder text to find it reliably
        const emailInput = page.locator('input[placeholder="Enter your email"]');
        console.log('📝 Typing in email input...');
        await emailInput.waitFor({ state: 'visible', timeout: 5000 });
        await emailInput.focus();
        await emailInput.type('john.doe@test.com', { delay: 100 });

        if (jsErrors.length > 0) {
            console.error('❌ JavaScript error detected during email input');
            console.error(jsErrors[jsErrors.length - 1]);
            throw new Error('JavaScript error occurred while typing in email input');
        }        // Take Percy snapshot with filled form
        await percySnapshot(page, 'UserLanding - Registration Form Filled', {
            widths: [375, 768, 1280]
        });

        // Final check
        expect(jsErrors.length, 'JavaScript errors should be 0').toBe(0);
        console.log('✅ No JavaScript errors detected during registration form input');
    });

    test('Error state rendering - No JavaScript errors', async ({ page }) => {
        console.log('🧪 Test: Error state rendering without JavaScript errors');

        await page.goto(`${BASE_URL}/user/landing`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Clear initial load errors
        jsErrors.length = 0;
        consoleErrors.length = 0;

        // Type invalid token (too short)
        const tokenInput = page.locator('#token-input');
        await tokenInput.focus();
        await tokenInput.type('ABC', { delay: 100 });

        // Click submit to trigger validation error
        const submitButton = page.locator('button:has-text("Submit")');
        await submitButton.click();
        await page.waitForTimeout(500);

        // Verify error message is displayed
        const errorMessage = page.locator('.user-landing-error');
        await expect(errorMessage).toBeVisible();

        // Take Percy snapshot of error state
        await percySnapshot(page, 'UserLanding - Error State', {
            widths: [375, 768, 1280]
        });

        // Verify no JavaScript errors during error display
        expect(jsErrors.length, 'JavaScript errors should be 0').toBe(0);
        console.log('✅ No JavaScript errors detected during error state rendering');
    });

    test('Clear error on focus - No JavaScript errors', async ({ page }) => {
        console.log('🧪 Test: Clear error on focus without JavaScript errors');

        await page.goto(`${BASE_URL}/user/landing`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Type invalid token and submit
        const tokenInput = page.locator('#token-input');
        await tokenInput.fill('ABC');

        const submitButton = page.locator('button:has-text("Submit")');
        await submitButton.click();
        await page.waitForTimeout(500);

        // Clear errors before testing focus behavior
        jsErrors.length = 0;
        consoleErrors.length = 0;

        // Focus back on input to clear error
        await tokenInput.focus();
        await page.waitForTimeout(300);

        // Verify error is cleared
        const errorMessage = page.locator('.user-landing-error');
        await expect(errorMessage).not.toBeVisible();

        // Verify no JavaScript errors
        expect(jsErrors.length, 'JavaScript errors should be 0').toBe(0);
        console.log('✅ No JavaScript errors detected during error clearing');
    });

    test('Rapid typing stress test - No JavaScript errors', async ({ page }) => {
        console.log('🧪 Test: Rapid typing without JavaScript errors');

        await page.goto(`${BASE_URL}/user/landing`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Clear initial errors
        jsErrors.length = 0;
        consoleErrors.length = 0;

        const tokenInput = page.locator('#token-input');
        await tokenInput.focus();

        // Type rapidly to stress test the JavaScript interop
        const rapidToken = 'ABCD1234';
        console.log(`📝 Rapid typing: ${rapidToken}`);

        for (const char of rapidToken) {
            await tokenInput.type(char, { delay: 10 }); // Very fast typing
        }

        await page.waitForTimeout(500); // Let any async operations complete

        // Verify no errors during rapid input
        if (jsErrors.length > 0) {
            console.error('❌ JavaScript errors during rapid typing:');
            jsErrors.forEach(err => console.error(err));
        }

        expect(jsErrors.length, 'JavaScript errors should be 0 during rapid typing').toBe(0);
        console.log('✅ No JavaScript errors detected during rapid typing stress test');
    });
});
