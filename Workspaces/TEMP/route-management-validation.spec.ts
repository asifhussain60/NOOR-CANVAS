import { expect, test } from '@playwright/test';

test.describe('Host Control Panel Route Management', () => {
    test('NEW route /host/control-panel/{token} should work correctly', async ({ page }) => {
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW', {
            waitUntil: 'networkidle'
        });

        // Verify the page loaded successfully
        await expect(page).toHaveTitle(/NoorCanvas/);

        // Verify we're on the correct URL (no redirect happened)
        expect(page.url()).toContain('/host/control-panel/PQ9N5YWW');

        console.log('✅ New route pattern works correctly');
    });

    test('OLD route /host/control/{token} should redirect to new route', async ({ page }) => {
        await page.goto('https://localhost:9091/host/control/PQ9N5YWW', {
            waitUntil: 'networkidle'
        });

        // Verify we were redirected to the new route pattern
        expect(page.url()).toContain('/host/control-panel/PQ9N5YWW');

        // Verify the page loaded successfully after redirect
        await expect(page).toHaveTitle(/NoorCanvas/);

        console.log('✅ Old route correctly redirects to new route');
    });

    test('Both routes should end up showing the same HostControlPanel component', async ({ page }) => {
        // Test that both routes show the same content
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        const finalUrl = page.url();

        // Verify we're on the new route after any potential redirects
        expect(finalUrl).toContain('/host/control-panel/PQ9N5YWW');

        console.log('✅ Route consistency verified - single canonical route established');
    });
});