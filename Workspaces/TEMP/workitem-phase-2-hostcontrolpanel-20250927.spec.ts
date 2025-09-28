import { expect, test } from '@playwright/test';

test.describe('Host Control Panel Phase 2 - SignalR Status Position and Text', () => {
    test('should display SignalR status above Start Session button with updated text', async ({ page }) => {
        // Navigate to host control panel with test token
        await page.goto('https://localhost:9091/host/control-panel/TESTHOST');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Wait for SignalR connection to establish
        await page.waitForTimeout(2000);

        // Debug: Look for any SignalR related text or connection status
        const allText = await page.textContent('body');
        console.log('Page body text includes:', allText?.substring(0, 500));

        // Look for any status text (Connected, Connecting, etc.)
        const statusElements = page.locator('span').filter({ hasText: /Connected|Connecting|Disconnected/ });
        const statusCount = await statusElements.count();
        console.log('Found status elements:', statusCount);

        if (statusCount > 0) {
            const firstStatus = statusElements.first();
            const statusText = await firstStatus.textContent();
            console.log('First status text:', statusText);

            // Check if it contains our new text
            expect(statusText).toContain('SignalR Hub');
        } else {
            // If no status found, fail with useful info
            throw new Error('No SignalR status elements found on page');
        }

        // Additional checks can be added here once we confirm the status text is working
    });
});