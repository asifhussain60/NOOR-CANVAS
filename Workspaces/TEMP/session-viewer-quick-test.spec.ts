import { expect, test } from '@playwright/test';

test.describe('Session Transcript Viewer - Quick Validation', () => {
    const BASE_URL = 'http://localhost:9090';

    test('should load viewer and test basic functionality', async ({ page }) => {
        // Navigate to the new session transcript viewer
        await page.goto(`${BASE_URL}/session-transcript-viewer.html`);

        // Check page loads correctly
        await expect(page).toHaveTitle(/Session Transcript Viewer/);

        // Check UI elements are present
        await expect(page.locator('h1')).toContainText('Session Transcript Viewer');
        await expect(page.locator('#sessionIdInput')).toBeVisible();
        await expect(page.locator('#loadSessionBtn')).toBeVisible();

        // Test with session 212 (should have Arabic content)
        await page.fill('#sessionIdInput', '212');
        await page.click('#loadSessionBtn');

        // Wait for loading to complete (with reasonable timeout)
        await expect(page.locator('#loadingOverlay')).toBeVisible();
        await expect(page.locator('#loadingOverlay')).toBeHidden({ timeout: 15000 });

        // Verify session loaded successfully
        await expect(page.locator('#sessionInfo')).toBeVisible();
        await expect(page.locator('#currentSessionId')).toContainText('212');

        // Check that Arabic content is present (look for Arabic Unicode patterns)
        const transcriptContent = page.locator('#transcriptContent');
        const hasArabicContent = await transcriptContent.evaluate(el => {
            // Check for Arabic Unicode range characters
            const arabicRegex = /[\u0600-\u06FF\u0750-\u077F]/;
            return arabicRegex.test(el.textContent || '');
        });

        expect(hasArabicContent).toBe(true);

        console.log('✅ Session 212 loaded successfully with Arabic content');
    });

    test('should handle URL parameters correctly', async ({ page }) => {
        // Navigate with session parameter
        await page.goto(`${BASE_URL}/session-transcript-viewer.html?sessionId=212`);

        // Check that session ID is pre-filled
        await expect(page.locator('#sessionIdInput')).toHaveValue('212');

        // Check URL parameter indicator is shown
        await expect(page.locator('#urlParamInfo')).toBeVisible();

        // Should auto-load the session
        await expect(page.locator('#sessionInfo')).toBeVisible({ timeout: 15000 });

        console.log('✅ URL parameter functionality works correctly');
    });

    test('should validate error handling', async ({ page }) => {
        await page.goto(`${BASE_URL}/session-transcript-viewer.html`);

        // Test with invalid session ID
        await page.fill('#sessionIdInput', '99999');
        await page.click('#loadSessionBtn');

        // Should show error state or error toast
        const errorVisible = await Promise.race([
            page.locator('#errorState').isVisible(),
            page.locator('.toast.error').isVisible()
        ]);

        expect(errorVisible).toBe(true);

        console.log('✅ Error handling works for invalid session IDs');
    });
});