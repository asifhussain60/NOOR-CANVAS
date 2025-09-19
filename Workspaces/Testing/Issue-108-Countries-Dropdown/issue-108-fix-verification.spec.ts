// Issue-108 Fix Verification Test
// Verifies that token TXZ25W6K validation now works correctly after HttpClient fix

import { expect, test } from '@playwright/test';

test.describe('Issue-108 Fix Verification: Token Validation', () => {
    test('should validate token TXZ25W6K successfully after HttpClient fix', async ({ page }) => {
        // Navigate to user landing page with token
        await page.goto('/user/landing/TXZ25W6K');

        // Wait for page to load and token to be validated
        await page.waitForSelector('h1', { timeout: 10000 });

        // Verify page loaded successfully without "Unable to validate token" error
        const pageTitle = await page.textContent('h1');
        expect(pageTitle).toContain('Welcome to Noor Canvas');

        // Check that no error message is displayed
        const errorMessage = await page.locator('text=Unable to validate token').count();
        expect(errorMessage).toBe(0);

        // Verify token input field shows the correct token
        const tokenInput = await page.locator('input[type="text"]').inputValue();
        expect(tokenInput).toBe('TXZ25W6K');

        // Test client-side validation by clicking the validate button
        await page.click('text=Validate Token');

        // Wait a moment for validation
        await page.waitForTimeout(2000);

        // Verify no client-side error occurred
        const clientError = await page.locator('text=Unable to validate token').count();
        expect(clientError).toBe(0);

        console.log('✅ Issue-108 Fix Verified: Token validation working correctly');
    });

    test('should handle token validation API call correctly', async ({ page }) => {
        // Monitor network requests
        const requests: string[] = [];
        page.on('request', request => {
            if (request.url().includes('/api/participant/session/')) {
                requests.push(request.url());
            }
        });

        // Navigate and interact
        await page.goto('/user/landing/TXZ25W6K');
        await page.waitForSelector('input[type="text"]', { timeout: 10000 });

        // Click validate button to trigger client-side API call
        await page.click('text=Validate Token');
        await page.waitForTimeout(3000);

        // Verify API call was made
        expect(requests.length).toBeGreaterThan(0);
        expect(requests[0]).toContain('/api/participant/session/TXZ25W6K/validate');

        console.log('✅ API Call Verified:', requests[0]);
    });
});