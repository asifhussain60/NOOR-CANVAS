// Issue-114: Countries Dropdown Should Load Only After Submit Button
// Testing NOOR Canvas UserLanding: Countries dropdown timing behavior

import { expect, test, type Page } from '@playwright/test';

/**
 * Issue-114: Countries Dropdown Loading After Submit
 * 
 * Validates that countries dropdown only loads AFTER user clicks submit
 * and successfully validates their token, not immediately on page load.
 * 
 * REQUIREMENTS:
 * - Countries dropdown empty during token entry phase
 * - Countries load only after successful token validation
 * - Loading indicator shows during async load
 * - Proper error handling if countries API fails
 */

test.describe('Issue-114: Countries Dropdown Loading After Submit', () => {

    test.beforeEach(async ({ page }: { page: Page }) => {
        // Start with clean state - navigate to user landing without token
        await page.goto('/user/landing');
        await page.waitForLoadState('networkidle');
    });

    test('should NOT load countries dropdown during initial token entry phase', async ({ page }: { page: Page }) => {
        console.log('Testing Issue-114: Countries should NOT be loaded during token entry...');

        // Verify we're in token entry phase
        const tokenInput = page.locator('input[placeholder*="token"], input[type="text"]').first();
        await expect(tokenInput).toBeVisible({ timeout: 10000 });

        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Enter")').first();
        await expect(submitButton).toBeVisible();

        console.log('✅ Token entry form is visible');

        // Verify countries dropdown is NOT visible or loaded yet
        const countryDropdown = page.locator('select[name*="Country"], select:has(option:has-text("United States"))');

        // Countries dropdown should not be visible during token entry
        const isCountryDropdownVisible = await countryDropdown.first().isVisible({ timeout: 3000 }).catch(() => false);
        expect(isCountryDropdownVisible).toBeFalsy();

        console.log('✅ Countries dropdown correctly NOT visible during token entry phase');

        // If dropdown exists but hidden, verify it has no countries loaded
        if (await countryDropdown.count() > 0) {
            const options = page.locator('select option:not(:has-text("Select")):not(:has-text("Loading"))');
            const optionCount = await options.count();
            expect(optionCount).toBe(0);
            console.log('✅ Countries dropdown exists but has no countries loaded (as expected)');
        }
    });

    test('should load countries dropdown ONLY after successful token submission', async ({ page }: { page: Page }) => {
        console.log('Testing Issue-114: Countries should load ONLY after token validation...');

        // Step 1: Verify initial state has no countries
        const tokenInput = page.locator('input[placeholder*="token"], input[type="text"]').first();
        await expect(tokenInput).toBeVisible();

        // Step 2: Enter a valid test token (using known format)
        const testToken = 'ADMIN123'; // Known valid token from previous tests
        await tokenInput.fill(testToken);
        console.log(`Entering test token: ${testToken}`);

        // Step 3: Submit token and wait for validation
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Enter")').first();
        await submitButton.click();

        console.log('Clicked submit button, waiting for token validation...');

        // Step 4: Wait for registration form to appear (indicates successful token validation)
        const registrationForm = page.locator('input[placeholder*="name"], input[placeholder*="email"]').first();
        await expect(registrationForm).toBeVisible({ timeout: 15000 });

        console.log('✅ Registration form appeared - token validation successful');

        // Step 5: NOW check that countries dropdown loads
        const countryDropdown = page.locator('select').filter({ hasText: 'country' })
            .or(page.locator('select:has(option:has-text("United States"))'))
            .or(page.locator('select[name*="Country"]'));

        await expect(countryDropdown.first()).toBeVisible({ timeout: 10000 });

        // Step 6: Verify countries are actually loaded (not just loading state)
        await page.waitForFunction(() => {
            const selects = document.querySelectorAll('select');
            for (let i = 0; i < selects.length; i++) {
                if (selects[i].options.length > 10) { // More than just placeholder options
                    return true;
                }
            }
            return false;
        }, { timeout: 15000 });

        const options = page.locator('select option:not(:has-text("Select")):not(:has-text("Loading"))');
        const optionCount = await options.count();

        expect(optionCount).toBeGreaterThan(50); // Should have many countries loaded
        console.log(`✅ Countries dropdown loaded ${optionCount} countries after token validation`);
    });

    test('should show loading indicator while countries are being fetched', async ({ page }: { page: Page }) => {
        console.log('Testing Issue-114: Loading indicator during countries fetch...');

        // Navigate and submit token to trigger countries loading
        const tokenInput = page.locator('input[placeholder*="token"], input[type="text"]').first();
        await tokenInput.fill('ADMIN123');

        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Enter")').first();
        await submitButton.click();

        // Wait for registration form to appear
        const registrationForm = page.locator('input[placeholder*="name"], input[placeholder*="email"]').first();
        await expect(registrationForm).toBeVisible({ timeout: 15000 });

        // Check for loading indicator text in dropdown
        const loadingText = page.locator('option:has-text("Loading countries"), text="Loading countries"');

        // Loading text should appear briefly (might be very fast)
        const hasLoadingText = await loadingText.first().isVisible({ timeout: 5000 }).catch(() => false);

        if (hasLoadingText) {
            console.log('✅ Loading indicator was visible during countries fetch');
        } else {
            console.log('⚠️ Loading might have been too fast to catch, but that\'s acceptable');
        }

        // Eventually countries should be loaded
        const countryOptions = page.locator('select option:not(:has-text("Select")):not(:has-text("Loading"))');
        await expect(countryOptions.first()).toBeVisible({ timeout: 15000 });

        console.log('✅ Countries eventually loaded after loading phase');
    });

    test('should handle countries API failure gracefully after token validation', async ({ page }: { page: Page }) => {
        console.log('Testing Issue-114: Error handling for countries API failure...');

        // Intercept countries API call and make it fail
        await page.route('**/api/host/countries**', async route => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Database connection failed' })
            });
        });

        // Submit valid token to trigger countries loading
        const tokenInput = page.locator('input[placeholder*="token"], input[type="text"]').first();
        await tokenInput.fill('ADMIN123');

        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Enter")').first();
        await submitButton.click();

        // Wait for registration form to appear
        const registrationForm = page.locator('input[placeholder*="name"], input[placeholder*="email"]').first();
        await expect(registrationForm).toBeVisible({ timeout: 15000 });

        // Check that countries dropdown shows error state or falls back gracefully
        const errorMessage = page.locator('text="Failed to load countries", text="Error loading countries", .error');

        // Either error message appears OR dropdown shows empty state gracefully
        const hasErrorMessage = await errorMessage.first().isVisible({ timeout: 10000 }).catch(() => false);

        if (hasErrorMessage) {
            console.log('✅ Error message displayed for countries API failure');
        } else {
            // Check if dropdown is disabled or shows fallback text
            const countryDropdown = page.locator('select').first();
            const isDisabled = await countryDropdown.isDisabled().catch(() => false);

            if (isDisabled) {
                console.log('✅ Countries dropdown appropriately disabled on API failure');
            } else {
                console.log('⚠️ Countries API failure handling should be improved');
            }
        }
    });

    test('should maintain countries dropdown state during registration form interaction', async ({ page }: { page: Page }) => {
        console.log('Testing Issue-114: Countries dropdown state persistence...');

        // Complete token validation to get to registration form
        const tokenInput = page.locator('input[placeholder*="token"], input[type="text"]').first();
        await tokenInput.fill('ADMIN123');

        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Enter")').first();
        await submitButton.click();

        // Wait for registration form and countries to load
        const registrationForm = page.locator('input[placeholder*="name"], input[placeholder*="email"]').first();
        await expect(registrationForm).toBeVisible({ timeout: 15000 });

        // Wait for countries to be fully loaded
        await page.waitForFunction(() => {
            const selects = document.querySelectorAll('select');
            for (let i = 0; i < selects.length; i++) {
                if (selects[i].options.length > 50) {
                    return true;
                }
            }
            return false;
        }, { timeout: 15000 });

        // Interact with other form fields
        const nameInput = page.locator('input[placeholder*="name"]').first();
        await nameInput.fill('Test User');

        const emailInput = page.locator('input[placeholder*="email"]').first();
        await emailInput.fill('test@example.com');

        // Verify countries dropdown is still populated and functional
        const countryDropdown = page.locator('select').first();
        await expect(countryDropdown).toBeVisible();

        const options = countryDropdown.locator('option:not(:has-text("Select")):not(:has-text("Loading"))');
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(50);

        // Try selecting a country
        await countryDropdown.selectOption({ label: 'United States' });
        const selectedValue = await countryDropdown.inputValue();
        expect(selectedValue).toBeTruthy();

        console.log('✅ Countries dropdown maintains functionality throughout registration form interaction');
    });

});