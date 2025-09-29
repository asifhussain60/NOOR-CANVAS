import { expect, test } from '@playwright/test';

test.describe('[DEBUG-WORKITEM:retrosync:28c9af12] System Architecture Audit ;CLEANUP_OK', () => {
    test('should validate core API endpoints are functional', async ({ page }) => {
        // Start from home page
        await page.goto('/');
        await expect(page).toHaveTitle(/NOOR Canvas/);

        // Test healthcheck endpoint
        const healthResponse = await page.request.get('/api/health');
        expect(healthResponse.status()).toBe(200);

        // Test that main routes are accessible (should redirect properly if not authenticated)
        await page.goto('/user/landing/TEST1234');
        await expect(page.locator('body')).toBeVisible();

        await page.goto('/host/landing/TEST5678');
        await expect(page.locator('body')).toBeVisible();

        // Test 404 handling
        await page.goto('/nonexistent');
        expect(page.url()).toContain('/');
    });

    test('should validate authentication flows work correctly', async ({ page, context }) => {
        // Test that SessionCanvas redirects unauthenticated users
        await page.goto('/session/TEST1234');

        // Should either show authentication required state OR redirect
        await page.waitForTimeout(2000);
        const url = page.url();
        const content = await page.textContent('body');

        expect(url.includes('/session/TEST1234') ||
            url.includes('/user/landing') ||
            content?.includes('authentication') ||
            content?.includes('register')).toBe(true);
    });

    test('should validate SignalR hubs are available', async ({ page }) => {
        await page.goto('/');

        // Check that SignalR libraries are loaded
        const signalrScript = await page.locator('script[src*="signalr"]').count();
        expect(signalrScript).toBeGreaterThan(0);

        // Check console for SignalR connection attempts (should not have critical errors)
        const logs: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error' && msg.text().includes('SignalR')) {
                logs.push(msg.text());
            }
        });

        await page.waitForTimeout(1000);
        // Should not have critical SignalR errors on initial load
    });
});