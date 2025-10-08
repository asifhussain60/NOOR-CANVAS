// Test session transcript viewer functionality
// This test validates the new session viewer with proper Arabic rendering

import { expect, test } from '@playwright/test';

test.describe('Session Transcript Viewer', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the new session transcript viewer
        await page.goto('/session-transcript-viewer.html');
    });

    test('should load page and display initial UI elements', async ({ page }) => {
        // Check page title
        await expect(page).toHaveTitle(/Session Transcript Viewer/);

        // Check main UI elements are present
        await expect(page.locator('h1')).toContainText('Session Transcript Viewer');
        await expect(page.locator('#sessionIdInput')).toBeVisible();
        await expect(page.locator('#loadSessionBtn')).toBeVisible();
        await expect(page.locator('#refreshBtn')).toBeVisible();

        // Check initial state message
        await expect(page.locator('#transcriptContent')).toContainText('No Session Loaded');
    });

    test('should load session 212 and display Arabic content correctly', async ({ page }) => {
        // Enter session ID 212
        await page.fill('#sessionIdInput', '212');

        // Click load button
        await page.click('#loadSessionBtn');

        // Wait for loading to complete
        await expect(page.locator('#loadingOverlay')).toBeHidden({ timeout: 10000 });

        // Check that session info is displayed
        await expect(page.locator('#sessionInfo')).toBeVisible();
        await expect(page.locator('#currentSessionId')).toContainText('212');

        // Check that content is loaded
        await expect(page.locator('#transcriptContent')).not.toContainText('No Session Loaded');

        // Verify Arabic text is present and properly rendered
        // Look for specific Arabic words that should be in session 212
        const arabicElements = page.locator('.inlineArabic, .arabic-text');
        await expect(arabicElements.first()).toBeVisible();

        // Check for proper Arabic font rendering (font-family should include Arabic fonts)
        const firstArabicElement = arabicElements.first();
        const fontFamily = await firstArabicElement.evaluate(el =>
            window.getComputedStyle(el).fontFamily
        );
        expect(fontFamily).toMatch(/Scheherazade|Amiri|Noto.*Arabic/i);
    });

    test('should handle session not found error gracefully', async ({ page }) => {
        // Enter a non-existent session ID
        await page.fill('#sessionIdInput', '99999');

        // Click load button
        await page.click('#loadSessionBtn');

        // Wait for error state
        await expect(page.locator('#errorState')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('#errorMessage')).toContainText('not found');

        // Check that error toast appears
        const toast = page.locator('.toast.error');
        await expect(toast).toBeVisible();
    });

    test('should support URL parameters for session ID', async ({ page }) => {
        // Navigate with session parameter
        await page.goto('/session-transcript-viewer.html?sessionId=212');

        // Check that session ID is pre-filled
        await expect(page.locator('#sessionIdInput')).toHaveValue('212');

        // Check that URL parameter info is shown
        await expect(page.locator('#urlParamInfo')).toBeVisible();

        // Wait for auto-load to complete
        await expect(page.locator('#sessionInfo')).toBeVisible({ timeout: 10000 });
    });

    test('should refresh current session when refresh button is clicked', async ({ page }) => {
        // Load session 212 first
        await page.fill('#sessionIdInput', '212');
        await page.click('#loadSessionBtn');
        await expect(page.locator('#sessionInfo')).toBeVisible({ timeout: 10000 });

        // Get initial load time
        const initialLoadTime = await page.locator('#loadTime').textContent();

        // Wait a moment and refresh
        await page.waitForTimeout(1000);
        await page.click('#refreshBtn');

        // Check that content reloads
        await expect(page.locator('#loadingOverlay')).toBeVisible();
        await expect(page.locator('#loadingOverlay')).toBeHidden({ timeout: 10000 });

        // Verify load time updated
        const newLoadTime = await page.locator('#loadTime').textContent();
        expect(newLoadTime).not.toBe(initialLoadTime);
    });

    test('should validate input and show appropriate error messages', async ({ page }) => {
        // Test invalid input (negative number)
        await page.fill('#sessionIdInput', '-1');
        await page.click('#loadSessionBtn');

        // Should show validation toast
        const toast = page.locator('.toast.warning');
        await expect(toast).toBeVisible();
        await expect(toast).toContainText('Invalid Session ID');

        // Test empty input
        await page.fill('#sessionIdInput', '');
        await page.click('#loadSessionBtn');

        await expect(toast).toBeVisible();
    });

    test('should support keyboard shortcuts', async ({ page }) => {
        // Load session first
        await page.fill('#sessionIdInput', '212');
        await page.click('#loadSessionBtn');
        await expect(page.locator('#sessionInfo')).toBeVisible({ timeout: 10000 });

        // Test Ctrl+L to focus session input
        await page.keyboard.press('Control+l');
        await expect(page.locator('#sessionIdInput')).toBeFocused();

        // Test Enter key to load session
        await page.fill('#sessionIdInput', '212');
        await page.keyboard.press('Enter');

        // Should trigger reload
        await expect(page.locator('#loadingOverlay')).toBeVisible();
    });
});