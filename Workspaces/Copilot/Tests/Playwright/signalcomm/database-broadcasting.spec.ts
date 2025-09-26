import { expect, test } from '@playwright/test';

/**
 * [DEBUG-WORKITEM:signalcomm:impl] Database-driven HTML broadcasting tests ;CLEANUP_OK
 * Tests the new database-driven content broadcasting system that replaces problematic SignalR DOM manipulation
 */

test.describe('SignalComm Database-Driven Broadcasting', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to host control panel
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Wait for the page to be fully loaded
        await expect(page.locator('h1')).toContainText('Host Control Panel');
    });

    test('Database-driven HTML broadcasting eliminates JavaScript appendChild errors', async ({ page }) => {
        // Monitor for JavaScript errors
        const jsErrors: string[] = [];
        page.on('pageerror', error => {
            jsErrors.push(error.message);
        });

        // Click Simple HTML button to load content
        await page.click('button:has-text("Simple")');

        // Wait for content to be loaded in textarea
        await page.waitForSelector('textarea[placeholder*="HTML content"]');

        // Verify content is loaded
        const textareaContent = await page.locator('textarea[placeholder*="HTML content"]').inputValue();
        expect(textareaContent).toContain('Welcome Message');

        // Click Broadcast button (now saves to database instead of problematic DOM manipulation)
        await page.click('button:has-text("Broadcast")');

        // Wait for database operation to complete
        await page.waitForTimeout(2000);

        // Verify no critical JavaScript errors occurred
        const criticalErrors = jsErrors.filter(error =>
            error.includes('appendChild') ||
            error.includes('Invalid or unexpected token') ||
            error.includes('Failed to execute')
        );

        expect(criticalErrors).toHaveLength(0);

        // Check for success message indicating database storage
        const pageText = await page.textContent('body');
        expect(pageText).toContain('content saved to database');
    });

    test('API endpoint retrieves broadcasts from database', async ({ page }) => {
        // Test the API endpoint directly
        const response = await page.request.get('/api/contentbroadcast/session/212');
        expect(response.ok()).toBeTruthy();

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.broadcasts).toBeDefined();
    });

    test('Complex HTML with gradients works without DOM parser errors', async ({ page }) => {
        // Monitor for JavaScript errors
        const jsErrors: string[] = [];
        page.on('pageerror', error => {
            jsErrors.push(error.message);
        });

        // Click Complex HTML button 
        await page.click('button:has-text("Complex")');

        // Wait for content to be loaded
        await page.waitForSelector('textarea[placeholder*="HTML content"]');

        // Verify complex content is loaded
        const textareaContent = await page.locator('textarea[placeholder*="HTML content"]').inputValue();
        expect(textareaContent).toContain('linear-gradient');
        expect(textareaContent).toContain('rgba');

        // Broadcast complex content
        await page.click('button:has-text("Broadcast")');
        await page.waitForTimeout(2000);

        // Verify no DOM parser errors
        const domErrors = jsErrors.filter(error =>
            error.includes('appendChild') ||
            error.includes('DOM') ||
            error.includes('parsing')
        );

        expect(domErrors).toHaveLength(0);
    });

    test('Database table creation works via API', async ({ page }) => {
        // Test table setup endpoint
        const response = await page.request.post('/api/contentbroadcast/test-setup');
        expect(response.ok()).toBeTruthy();

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.testBroadcastId).toBeDefined();
    });
});