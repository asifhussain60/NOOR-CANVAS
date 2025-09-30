import { expect, test } from '@playwright/test';

test('Host Control Panel - Routing Fix Verification', async ({ page }) => {
    // Test the corrected routing pattern /host/control-panel/{token}
    await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW', {
        waitUntil: 'networkidle'
    });

    // Verify the page loaded successfully (no 404 errors)
    await expect(page).toHaveTitle(/NoorCanvas/);

    // The page should not contain error messages
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('404');
    expect(bodyText).not.toContain('Page not found');

    console.log('✅ Host Control Panel routing fix verified successfully');
});