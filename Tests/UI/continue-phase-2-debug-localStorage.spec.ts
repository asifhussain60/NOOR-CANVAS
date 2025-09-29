import { expect, test } from '@playwright/test';

test.describe('Phase 2: localStorage Debug Panel Integration', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the user landing page
        await page.goto('http://localhost:5239');
        await page.waitForLoadState('networkidle');
    });

    test('should display localStorage section in debug panel', async ({ page }) => {
        // Check if debug panel exists (only in development mode)
        const debugPanel = await page.locator('.debug-panel').first();
        if (await debugPanel.isVisible()) {

            // Expand debug panel if collapsed
            const toggleButton = debugPanel.locator('button').first();
            await toggleButton.click();
            await page.waitForTimeout(500);

            // Look for localStorage section
            const localStorageButton = debugPanel.locator('button', { hasText: 'localStorage Data' });
            await expect(localStorageButton).toBeVisible();

            // Expand localStorage section
            await localStorageButton.click();
            await page.waitForTimeout(500);

            // Check for localStorage controls
            const refreshButton = debugPanel.locator('button', { hasText: 'Refresh' });
            const clearButton = debugPanel.locator('button', { hasText: 'Clear All' });

            await expect(refreshButton).toBeVisible();
            await expect(clearButton).toBeVisible();

            console.log('✅ Phase 2: localStorage debug section is visible and functional');
        } else {
            console.log('⚠️  Debug panel not visible (may be production mode)');
        }
    });

    test('should show form data in localStorage after filling form', async ({ page }) => {
        // First, add some test localStorage data
        await page.evaluate(() => {
            localStorage.setItem('noor_form_data_test123', JSON.stringify({
                Name: 'Test User',
                Email: 'test@example.com',
                Country: 'US'
            }));
            localStorage.setItem('noor_session_test', 'test_session_data');
        });

        const debugPanel = await page.locator('.debug-panel').first();
        if (await debugPanel.isVisible()) {

            // Expand debug panel
            const toggleButton = debugPanel.locator('button').first();
            await toggleButton.click();
            await page.waitForTimeout(500);

            // Expand localStorage section
            const localStorageButton = debugPanel.locator('button', { hasText: 'localStorage Data' });
            await localStorageButton.click();
            await page.waitForTimeout(500);

            // Click refresh to load localStorage data
            const refreshButton = debugPanel.locator('button', { hasText: 'Refresh' });
            await refreshButton.click();
            await page.waitForTimeout(1000);

            // Check if NOOR localStorage items are displayed
            const localStorageContainer = debugPanel.locator('.debug-localstorage');

            // Look for our test data
            await expect(localStorageContainer.locator('text=noor_form_data_test123')).toBeVisible();
            await expect(localStorageContainer.locator('text=noor_session_test')).toBeVisible();

            console.log('✅ Phase 2: localStorage data is displayed in debug panel');

            // Test clear functionality
            const clearButton = debugPanel.locator('button', { hasText: 'Clear All' });
            await clearButton.click();
            await page.waitForTimeout(500);

            // Verify localStorage was cleared
            const clearedStorage = await page.evaluate(() => {
                const keys = Object.keys(localStorage).filter(key => key.startsWith('noor_'));
                return keys.length;
            });

            expect(clearedStorage).toBe(0);
            console.log('✅ Phase 2: localStorage clear functionality works');
        }
    });

    test('should handle localStorage integration with form persistence', async ({ page }) => {
        // Fill out the authentication form if visible
        const tokenInput = page.locator('input[placeholder="Enter your authentication token"]');

        if (await tokenInput.isVisible()) {
            await tokenInput.fill('test-token-123');

            const proceedButton = page.locator('button', { hasText: 'Proceed to Registration' });
            await proceedButton.click();
            await page.waitForTimeout(1000);

            // If registration form appears, fill it
            const nameInput = page.locator('input[placeholder="Enter your name"]');
            const emailInput = page.locator('input[placeholder="Enter your email"]');
            const countrySelect = page.locator('select[aria-label="Country"]');

            if (await nameInput.isVisible()) {
                await nameInput.fill('Phase 2 Test User');
                await emailInput.fill('phase2@test.com');
                await countrySelect.selectOption('US');

                await page.waitForTimeout(500);

                // Check debug panel shows the localStorage data
                const debugPanel = await page.locator('.debug-panel').first();
                if (await debugPanel.isVisible()) {

                    // Expand panels
                    await debugPanel.locator('button').first().click();
                    await page.waitForTimeout(300);

                    const localStorageButton = debugPanel.locator('button', { hasText: 'localStorage Data' });
                    await localStorageButton.click();
                    await page.waitForTimeout(300);

                    // Refresh to load current data
                    const refreshButton = debugPanel.locator('button', { hasText: 'Refresh' });
                    await refreshButton.click();
                    await page.waitForTimeout(500);

                    // Look for form data in localStorage display
                    const localStorageContainer = debugPanel.locator('.debug-localstorage');
                    await expect(localStorageContainer.locator('text=noor_form_data')).toBeVisible();

                    console.log('✅ Phase 2: Form data persistence integrated with debug display');
                }
            }
        }
    });
});