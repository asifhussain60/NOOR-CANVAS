/**
 * Phase 8: localStorage Data Validation Tests
 * 
 * Tests the ValidateRegistrationDataAsync method and auto-clear behavior
 * when localStorage contains invalid data.
 * 
 * Test Scenarios:
 * 1. Invalid email format - should clear localStorage
 * 2. Empty name - should clear localStorage
 * 3. Invalid country code - should clear localStorage
 * 4. Valid data - should load successfully
 */

import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:9090';
const USER_TOKEN = 'KJAHA99L';
const USER_LANDING_URL = `${BASE_URL}/user/landing/${USER_TOKEN}`;
const STORAGE_KEY = `noor_user_registration_${USER_TOKEN}`;

test.describe('Phase 8: localStorage Data Validation', () => {

    test.beforeEach(async ({ page }) => {
        // Clear all storage before each test
        await page.goto(BASE_URL);
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('should clear localStorage when email format is invalid', async ({ page }) => {
        // Navigate to UserLanding with user token
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Complete registration with valid data first
        await page.fill('#name-input', 'Test User');
        await page.fill('input.user-landing-input[placeholder="Enter your email"]', 'test@example.com');
        await page.selectOption('select.user-landing-select', 'US');
        await page.click('button.user-landing-button');

        // Wait for registration to complete (redirect to waiting page)
        await page.waitForURL('**/session/waiting/**', { timeout: 10000 });

        // Verify localStorage has valid data
        let storageData = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
        expect(storageData).not.toBeNull();

        // Corrupt localStorage with invalid email
        await page.evaluate((key) => {
            const data = JSON.parse(localStorage.getItem(key)!);
            data.Email = 'invalid-email-no-at-sign';
            localStorage.setItem(key, JSON.stringify(data));
        }, STORAGE_KEY);

        // Navigate back to UserLanding - should detect invalid email and clear localStorage
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Verify localStorage was cleared
        storageData = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
        expect(storageData).toBeNull();

        // Verify form fields are empty (data not pre-populated)
        const nameInput = page.locator('#name-input');
        const emailInput = page.locator('input.user-landing-input[placeholder="Enter your email"]');
        await expect(nameInput).toHaveValue('');
        await expect(emailInput).toHaveValue('');
    });

    test('should clear localStorage when name is empty', async ({ page }) => {
        // Navigate to UserLanding with user token
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Complete registration with valid data first
        await page.fill('#name-input', 'Test User');
        await page.fill('input.user-landing-input[placeholder="Enter your email"]', 'test@example.com');
        await page.selectOption('select.user-landing-select', 'US');
        await page.click('button.user-landing-button');

        // Wait for registration
        await page.waitForURL('**/session/waiting/**', { timeout: 10000 });

        // Corrupt localStorage with empty name
        await page.evaluate((key) => {
            const data = JSON.parse(localStorage.getItem(key)!);
            data.Name = '';
            localStorage.setItem(key, JSON.stringify(data));
        }, STORAGE_KEY);

        // Navigate back to UserLanding - should detect empty name and clear localStorage
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Verify localStorage was cleared
        const storageData = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
        expect(storageData).toBeNull();

        // Verify form fields are empty
        const nameInput = page.locator('#name-input');
        const emailInput = page.locator('input.user-landing-input[placeholder="Enter your email"]');
        await expect(nameInput).toHaveValue('');
        await expect(emailInput).toHaveValue('');
    });

    test('should clear localStorage when country code is invalid', async ({ page }) => {
        // Navigate to UserLanding with user token
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Complete registration with valid data first
        await page.fill('#name-input', 'Test User');
        await page.fill('input.user-landing-input[placeholder="Enter your email"]', 'test@example.com');
        await page.selectOption('select.user-landing-select', 'US');
        await page.click('button.user-landing-button');

        // Wait for registration
        await page.waitForURL('**/session/waiting/**', { timeout: 10000 });

        // Corrupt localStorage with empty country code
        await page.evaluate((key) => {
            const data = JSON.parse(localStorage.getItem(key)!);
            data.Country = '';
            localStorage.setItem(key, JSON.stringify(data));
        }, STORAGE_KEY);

        // Navigate back to UserLanding - should detect empty country and clear localStorage
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Verify localStorage was cleared
        const storageData = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
        expect(storageData).toBeNull();

        // Verify form fields are empty
        const nameInput = page.locator('#name-input');
        const emailInput = page.locator('input.user-landing-input[placeholder="Enter your email"]');
        await expect(nameInput).toHaveValue('');
        await expect(emailInput).toHaveValue('');
    });

    test('should validate multiple invalid formats', async ({ page }) => {
        // Navigate to UserLanding with user token
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Complete registration with valid data first
        await page.fill('#name-input', 'Test User');
        await page.fill('input.user-landing-input[placeholder="Enter your email"]', 'test@example.com');
        await page.selectOption('select.user-landing-select', 'US');
        await page.click('button.user-landing-button');

        // Wait for registration
        await page.waitForURL('**/session/waiting/**', { timeout: 10000 });

        // Test invalid email formats
        const invalidEmails = [
            'no-at-sign.com',
            '@example.com',
            'test@',
            'test @example.com', // space in email
            'test@example', // no TLD
        ];

        for (const invalidEmail of invalidEmails) {
            // Navigate back to UserLanding
            await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

            // Re-register to create fresh localStorage
            await page.fill('#name-input', 'Test User');
            await page.fill('input.user-landing-input[placeholder="Enter your email"]', 'valid@example.com');
            await page.selectOption('select.user-landing-select', 'US');
            await page.click('button.user-landing-button');
            await page.waitForURL('**/session/waiting/**', { timeout: 10000 });

            // Corrupt with invalid email
            await page.evaluate(([key, email]) => {
                const data = JSON.parse(localStorage.getItem(key)!);
                data.Email = email;
                localStorage.setItem(key, JSON.stringify(data));
            }, [STORAGE_KEY, invalidEmail]);

            // Navigate back to UserLanding - should clear invalid data
            await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

            const storageData = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
            expect(storageData).toBeNull();
        }
    });

    test('should load valid data successfully', async ({ page }) => {
        // Navigate to UserLanding with user token
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for countries dropdown to be populated (API call completes)
        await page.waitForFunction(() => {
            const select = document.querySelector('select.user-landing-select') as HTMLSelectElement;
            return select && select.options.length > 1; // More than just the placeholder
        }, { timeout: 10000 });

        // Complete registration with valid data
        await page.fill('#name-input', 'Valid User');
        await page.fill('input.user-landing-input[placeholder="Enter your email"]', 'valid@example.com');
        await page.selectOption('select.user-landing-select', 'US'); // Use US as it's commonly first in list
        await page.click('button.user-landing-button');

        // Wait for registration
        await page.waitForURL('**/session/waiting/**', { timeout: 10000 });

        // Navigate back to UserLanding
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Verify localStorage still exists (not cleared)
        const storageData = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
        expect(storageData).not.toBeNull();

        // Verify data structure
        const data = JSON.parse(storageData!);
        expect(data.Name).toBe('Valid User');
        expect(data.Email).toBe('valid@example.com');
        expect(data.Country).toBe('US');
        expect(data.ExpiresAt).toBeDefined();
        expect(data.LastAccessedAt).toBeDefined();

        // Verify form fields pre-populated
        const nameInput = page.locator('#name-input');
        const emailInput = page.locator('input.user-landing-input[placeholder="Enter your email"]');
        await expect(nameInput).toHaveValue('Valid User');
        await expect(emailInput).toHaveValue('valid@example.com');
    });
});
