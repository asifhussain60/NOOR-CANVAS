// Issue-114 Final Fix Verification: Countries Dropdown with GUID Parameter
// Test to verify the GUID parameter fix for the countries API

import { expect, test, type Page } from '@playwright/test';

/**
 * Issue-114 Final Fix Verification: Countries API GUID Parameter
 * 
 * The countries API endpoint requires a 'guid' query parameter.
 * This test verifies that our updated LoadCountriesAsync method 
 * correctly calls the API with the user's token as the guid parameter.
 */

test.describe('Issue-114 Final Fix: Countries API with GUID Parameter', () => {
    const baseURL = process.env.BASE_URL || 'https://localhost:9091';

    test('should load countries dropdown with correct API call including guid parameter', async ({ page }: { page: Page }) => {
        console.log('🔧 FINAL FIX TEST: Verifying countries API with guid parameter...');

        // Monitor API requests to verify the correct URL is called
        const countriesApiCalls: string[] = [];
        page.on('request', request => {
            if (request.url().includes('/api/host/countries')) {
                countriesApiCalls.push(request.url());
                console.log(`🌐 Countries API Request: ${request.url()}`);
            }
        });

        page.on('response', response => {
            if (response.url().includes('/api/host/countries')) {
                console.log(`🌐 Countries API Response: ${response.status()} ${response.url()}`);
            }
        });

        // Navigate to user landing page
        await page.goto(`${baseURL}/user/landing`);
        await page.waitForLoadState('networkidle');

        // Enter valid token 
        const tokenInput = page.locator('input[placeholder*="token"], input[placeholder*="Token"]');
        await expect(tokenInput).toBeVisible({ timeout: 10000 });

        const testToken = 'ADMIN123';
        await tokenInput.fill(testToken);
        console.log(`🔑 Entered token: ${testToken}`);

        // Submit token to trigger registration panel
        const submitButton = page.locator('button:has-text("Submit")');
        await submitButton.click();
        console.log('🖱️ Clicked submit button');

        // Wait for registration panel
        const nameInput = page.locator('input[placeholder*="name"]');
        await expect(nameInput).toBeVisible({ timeout: 15000 });
        console.log('✅ Registration panel appeared');

        // Verify country dropdown appears
        const countryDropdown = page.locator('select').filter({
            has: page.locator('option:has-text("Select your country")')
        });
        await expect(countryDropdown).toBeVisible({ timeout: 5000 });
        console.log('✅ Country dropdown is visible');

        // Wait for countries to load (with longer timeout)
        console.log('⏳ Waiting for countries API call and data loading...');

        // Wait for the API call to be made
        await page.waitForFunction(() => {
            // Check if countries are loaded by looking for options
            const selects = document.querySelectorAll('select');
            for (let i = 0; i < selects.length; i++) {
                if (selects[i].options.length > 10) { // Should have many countries
                    return true;
                }
            }
            return false;
        }, { timeout: 30000 });

        // Verify countries loaded
        const countryOptions = countryDropdown.locator('option:not(:has-text("Select")):not(:has-text("Loading"))');
        const optionCount = await countryOptions.count();

        console.log(`📊 Countries loaded: ${optionCount}`);
        expect(optionCount).toBeGreaterThan(50); // Should have many countries (239 expected)

        // Verify the correct API call was made with guid parameter
        console.log('📋 Verifying API call details:');
        console.log(`API calls made: ${countriesApiCalls.length}`);

        if (countriesApiCalls.length > 0) {
            const apiCall = countriesApiCalls[0];
            console.log(`First API call: ${apiCall}`);

            // Verify the API call includes the guid parameter
            expect(apiCall).toContain('/api/host/countries?guid=');
            expect(apiCall).toContain(testToken); // Should contain our test token
            console.log('✅ API call includes correct guid parameter');
        } else {
            console.log('❌ No countries API calls detected');
            expect(countriesApiCalls.length).toBeGreaterThan(0);
        }

        // Test dropdown functionality
        const usOption = countryDropdown.locator('option:has-text("United States")');
        if (await usOption.count() > 0) {
            await countryDropdown.selectOption({ label: 'United States' });
            const selectedValue = await countryDropdown.inputValue();
            expect(selectedValue).toBeTruthy();
            console.log('✅ Successfully selected United States from dropdown');
        }

        console.log('🎉 SUCCESS: Countries dropdown loading with GUID parameter is working!');
    });

    test('should show proper error handling if countries API fails', async ({ page }: { page: Page }) => {
        console.log('🔧 ERROR TEST: Testing error handling for countries API failure...');

        // Intercept and make the countries API fail
        await page.route('**/api/host/countries**', async route => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Failed to load countries' })
            });
        });

        await page.goto(`${baseURL}/user/landing`);
        await page.waitForLoadState('networkidle');

        // Enter token and submit
        const tokenInput = page.locator('input[placeholder*="token"], input[placeholder*="Token"]');
        await tokenInput.fill('ADMIN123');

        const submitButton = page.locator('button:has-text("Submit")');
        await submitButton.click();

        // Wait for registration panel
        const nameInput = page.locator('input[placeholder*="name"]');
        await expect(nameInput).toBeVisible({ timeout: 15000 });

        // Look for error message
        console.log('Waiting for error message to appear...');
        const errorMessage = page.locator('text="Failed to load countries from database."');

        await expect(errorMessage).toBeVisible({ timeout: 10000 });
        console.log('✅ Error message displayed correctly');

        // Verify dropdown shows minimal options
        const countryDropdown = page.locator('select').filter({
            has: page.locator('option:has-text("Select your country")')
        });

        const options = countryDropdown.locator('option');
        const optionCount = await options.count();

        // Should only have the placeholder option
        expect(optionCount).toBeLessThanOrEqual(2);
        console.log(`✅ Dropdown shows minimal options on error: ${optionCount}`);
    });
});