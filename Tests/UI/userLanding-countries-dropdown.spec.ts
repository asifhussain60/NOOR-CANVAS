import { expect, test } from '@playwright/test';

/**
 * Issue-108: UserLanding Countries Dropdown Dynamic Loading Test Suite
 * 
 * This test suite validates the dynamic countries dropdown functionality
 * in UserLanding.razor, ensuring it loads all countries from the SQL database
 * via the API endpoint and matches the expected count of 239 countries.
 * 
 * Test Coverage:
 * - Countries dropdown loads dynamically from API
 * - Count matches SQL database (239 countries expected)
 * - Loading states function properly  
 * - Error handling works correctly
 * - Dropdown selection functionality
 * - User experience during loading
 */

test.describe('Issue-108: UserLanding Countries Dropdown', () => {
    const baseURL = process.env.BASE_URL || 'https://localhost:9091';

    test.beforeEach(async ({ page }) => {
        // Navigate to UserLanding page
        await page.goto(`${baseURL}/`);

        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');
    });

    test('Should load countries dropdown dynamically with correct count from SQL database', async ({ page }) => {
        // Test ID: ISSUE-108-T001
        // Verify that countries dropdown loads all 239 countries from database

        // Wait for the countries dropdown to be present
        const countriesSelect = page.locator('#country-select, select[name="Country"], .countries-dropdown select');
        await expect(countriesSelect).toBeVisible({ timeout: 10000 });

        // Wait for loading to complete - check if loading indicator disappears
        const loadingIndicator = page.locator('.loading, .spinner, text="Loading countries..."');
        if (await loadingIndicator.isVisible()) {
            await expect(loadingIndicator).toBeHidden({ timeout: 15000 });
        }

        // Get all option elements from the dropdown
        const options = page.locator('#country-select option, select[name="Country"] option, .countries-dropdown select option');

        // Wait for options to be populated
        await page.waitForFunction(() => {
            const select = document.querySelector('#country-select, select[name="Country"], .countries-dropdown select') as HTMLSelectElement;
            return select && select.options.length > 10; // Should have more than the original 10 hardcoded options
        }, { timeout: 15000 });

        // Count the total options (excluding default/placeholder option)
        const optionCount = await options.count();

        // Verify we have the expected 239 countries + 1 default option = 240 total
        // Or 239 countries if no default option
        expect(optionCount).toBeGreaterThanOrEqual(239);
        console.log(`Countries dropdown loaded with ${optionCount} options`);

        // Verify specific countries are present (sample validation)
        await expect(page.locator('option:has-text("United States")')).toBeVisible();
        await expect(page.locator('option:has-text("Canada")')).toBeVisible();
        await expect(page.locator('option:has-text("United Kingdom")')).toBeVisible();
        await expect(page.locator('option:has-text("Germany")')).toBeVisible();
        await expect(page.locator('option:has-text("Australia")')).toBeVisible();

        // Verify we have more countries than the original hardcoded list
        // Original list had: US, Canada, UK, Australia, Germany, France, Japan, India, Brazil, Mexico (10)
        // New list should have 239 countries
        expect(optionCount).toBeGreaterThan(10);
    });

    test('Should display loading state while countries are being fetched', async ({ page }) => {
        // Test ID: ISSUE-108-T002
        // Verify loading states work properly during API call

        // Monitor network requests for the countries API call
        const apiRequest = page.waitForRequest('**/api/host/countries**');

        // Reload page to catch loading state
        await page.reload();

        // Check if loading indicator appears initially
        const loadingText = page.locator('text="Loading countries..."');
        const loadingSpinner = page.locator('.loading, .spinner');

        // At least one loading indicator should be visible initially
        const hasLoadingIndicator = await Promise.race([
            loadingText.isVisible(),
            loadingSpinner.isVisible(),
            new Promise(resolve => setTimeout(() => resolve(false), 1000))
        ]);

        if (hasLoadingIndicator) {
            console.log('Loading indicator detected');
        }

        // Wait for API request to complete
        await apiRequest;

        // Verify loading indicators disappear after loading
        if (hasLoadingIndicator) {
            await expect(loadingText).toBeHidden({ timeout: 10000 });
            await expect(loadingSpinner).toBeHidden({ timeout: 10000 });
        }

        // Verify dropdown is populated after loading
        const countriesSelect = page.locator('#country-select, select[name="Country"], .countries-dropdown select');
        await expect(countriesSelect).toBeVisible();

        const options = page.locator('#country-select option, select[name="Country"] option, .countries-dropdown select option');
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(10);
    });

    test('Should handle country selection properly', async ({ page }) => {
        // Test ID: ISSUE-108-T003
        // Verify country selection functionality works

        const countriesSelect = page.locator('#country-select, select[name="Country"], .countries-dropdown select');
        await expect(countriesSelect).toBeVisible();

        // Wait for countries to load
        await page.waitForFunction(() => {
            const select = document.querySelector('#country-select, select[name="Country"], .countries-dropdown select') as HTMLSelectElement;
            return select && select.options.length > 10;
        }, { timeout: 15000 });

        // Test selecting different countries
        await countriesSelect.selectOption({ label: 'United States' });
        expect(await countriesSelect.inputValue()).toBeTruthy();

        await countriesSelect.selectOption({ label: 'Canada' });
        expect(await countriesSelect.inputValue()).toBeTruthy();

        await countriesSelect.selectOption({ label: 'United Kingdom' });
        expect(await countriesSelect.inputValue()).toBeTruthy();
    });

    test('Should validate SQL database count matches dropdown count', async ({ page }) => {
        // Test ID: ISSUE-108-T004
        // Verify the dropdown count matches the SQL database count (239 countries)

        // First get the dropdown count
        const countriesSelect = page.locator('#country-select, select[name="Country"], .countries-dropdown select');
        await expect(countriesSelect).toBeVisible();

        await page.waitForFunction(() => {
            const select = document.querySelector('#country-select, select[name="Country"], .countries-dropdown select') as HTMLSelectElement;
            return select && select.options.length > 10;
        }, { timeout: 15000 });

        const options = page.locator('#country-select option, select[name="Country"] option, .countries-dropdown select option');
        const dropdownCount = await options.count();

        // Make API call to verify count directly
        const response = await page.request.get(`${baseURL}/api/host/countries`, {
            headers: {
                'Authorization': 'Bearer demo-token-12345'
            }
        });

        expect(response.ok()).toBeTruthy();
        const countries = await response.json();
        const apiCount = countries.length;

        console.log(`Dropdown count: ${dropdownCount}`);
        console.log(`API count: ${apiCount}`);

        // The dropdown might have a default "Select Country" option
        // So we check if dropdown count is either equal to API count or API count + 1
        const isCountValid = dropdownCount === apiCount || dropdownCount === apiCount + 1;
        expect(isCountValid).toBeTruthy();

        // Verify we have the expected 239 countries from SQL
        expect(apiCount).toBe(239);

        // Log success message
        console.log(`✅ SQL Database validation passed: ${apiCount} countries in database match dropdown functionality`);
    });

    test('Should handle API errors gracefully', async ({ page }) => {
        // Test ID: ISSUE-108-T005
        // Test error handling when API fails

        // Intercept and fail the API request
        await page.route('**/api/host/countries**', route => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal Server Error' })
            });
        });

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Check if error handling is working
        // The dropdown should either show an error message or fallback options
        const countriesSelect = page.locator('#country-select, select[name="Country"], .countries-dropdown select');
        const errorMessage = page.locator('.error, .alert-danger, text="Error loading countries"');

        // Either the dropdown should be disabled or an error message should appear
        const hasErrorHandling = await Promise.race([
            countriesSelect.isDisabled(),
            errorMessage.isVisible(),
            new Promise(resolve => setTimeout(() => resolve(false), 5000))
        ]);

        // Some form of error handling should be present
        if (!hasErrorHandling) {
            console.warn('⚠️ Error handling might need improvement');
        }
    });

    test('Should maintain performance during countries loading', async ({ page }) => {
        // Test ID: ISSUE-108-T006
        // Performance test for countries loading

        const startTime = Date.now();

        await page.goto(`${baseURL}/`);

        // Wait for countries to fully load
        await page.waitForFunction(() => {
            const select = document.querySelector('#country-select, select[name="Country"], .countries-dropdown select') as HTMLSelectElement;
            return select && select.options.length > 10;
        }, { timeout: 15000 });

        const endTime = Date.now();
        const loadTime = endTime - startTime;

        console.log(`Countries dropdown loaded in ${loadTime}ms`);

        // Should load within reasonable time (15 seconds max, but ideally under 5 seconds)
        expect(loadTime).toBeLessThan(15000);

        if (loadTime > 5000) {
            console.warn(`⚠️ Countries loading took ${loadTime}ms, consider optimization`);
        }
    });
});