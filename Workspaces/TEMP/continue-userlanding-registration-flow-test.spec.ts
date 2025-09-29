import { expect, test } from '@playwright/test';

test.describe('UserLanding Registration Flow', () => {
    test('should complete registration and navigate to waiting room', async ({ page }) => {
        const testToken = 'KJAHA99L'; // Known valid token from database

        console.log(`[TRACE] Starting test with token: ${testToken}`);

        // Navigate to UserLanding page with token
        await page.goto(`https://localhost:9091/user/landing/${testToken}`, { waitUntil: 'networkidle' });
        console.log('[TRACE] Navigated to UserLanding page');

        // Wait for the page to load and token to be validated
        await page.waitForTimeout(3000);

        // Check if registration panel is visible (token should be auto-validated)
        const nameInput = page.locator('input#name-input');
        await expect(nameInput).toBeVisible({ timeout: 10000 });
        console.log('[TRACE] Registration panel is visible');

        // Fill in registration form
        await nameInput.fill('Test User Playwright');
        console.log('[TRACE] Filled name input');

        const emailInput = page.locator('input[placeholder*="email"]');
        await emailInput.fill('testuser@example.com');
        console.log('[TRACE] Filled email input');

        // Select country from dropdown
        const countrySelect = page.locator('select');
        await expect(countrySelect).toBeVisible({ timeout: 5000 });
        await countrySelect.selectOption({ index: 1 }); // Select first available country
        console.log('[TRACE] Selected country from dropdown');

        // Click the "Join Waiting Room" button
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toContainText('Join Waiting Room');
        console.log('[TRACE] Found submit button with correct text');

        // Listen for navigation
        const navigationPromise = page.waitForURL(`**/session/waiting/${testToken}`, { timeout: 10000 });

        await submitButton.click();
        console.log('[TRACE] Clicked submit button');

        // Wait for navigation to waiting room
        try {
            await navigationPromise;
            console.log(`[TRACE] Successfully navigated to waiting room: ${page.url()}`);

            // Verify we're on the waiting room page
            expect(page.url()).toContain(`/session/waiting/${testToken}`);

            // Wait for waiting room to load
            await page.waitForTimeout(2000);

            // Check if waiting room content is visible
            const waitingRoomContent = page.locator('body');
            await expect(waitingRoomContent).toBeVisible();

            console.log('[TRACE] Registration flow completed successfully!');

        } catch (error) {
            console.error('[ERROR] Navigation to waiting room failed:', error);
            console.log('[TRACE] Current URL:', page.url());

            // Check for any error messages on the page
            const errorMessage = page.locator('[class*="error"], [data-testid="error"]');
            if (await errorMessage.isVisible()) {
                const errorText = await errorMessage.textContent();
                console.log('[TRACE] Error message visible:', errorText);
            }

            // Take a screenshot for debugging
            await page.screenshot({ path: `Workspaces/TEMP/registration-flow-error-${Date.now()}.png` });

            throw error;
        }
    });

    test('should validate required fields', async ({ page }) => {
        const testToken = 'KJAHA99L';

        console.log('[TRACE] Testing field validation');

        await page.goto(`https://localhost:9091/user/landing/${testToken}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Try to submit without filling required fields
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // Should see validation error
        const errorMessage = page.locator('text=*fill in all required*');
        await expect(errorMessage).toBeVisible({ timeout: 5000 });

        console.log('[TRACE] Field validation working correctly');
    });
});