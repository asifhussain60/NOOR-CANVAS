import { expect, test } from '@playwright/test';

test('Phase 3: Verify floating debug panel with Share Asset Test button', async ({ page }) => {
    // Navigate to the host control panel
    await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-panel-screenshot.png', fullPage: true });

    // Verify the Share Asset Test button is no longer in the main controls
    const mainShareButton = page.locator('text=Share Asset Test').first();
    await expect(mainShareButton).toHaveCount(0);

    // Verify the debug panel toggle button is present in bottom-right
    const debugToggle = page.locator('button:has(i[class*="fa-bug"])');
    await expect(debugToggle).toBeVisible();

    // Click to expand the debug panel
    await debugToggle.click();

    // Verify debug panel is expanded
    const debugPanel = page.locator('text=Debug Panel');
    await expect(debugPanel).toBeVisible();

    // Verify HostControlPanel is shown as current view
    const currentView = page.locator('text=HostControlPanel');
    await expect(currentView).toBeVisible();

    // Start the session first so we can see the Share Asset Test button
    const startButton = page.locator('text=Start Session');
    await startButton.click();

    // Wait for session to start
    await page.waitForTimeout(2000);

    // Verify the Test Share Asset button is now in the debug panel
    const debugShareButton = page.locator('text=Test Share Asset');
    await expect(debugShareButton).toBeVisible();
});