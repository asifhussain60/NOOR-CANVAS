import { expect, test } from '@playwright/test';

test('Phase 2: Verify SignalR status is a modern icon in top-right corner', async ({ page }) => {
    // Navigate to the host control panel
    await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Verify the old SignalR status text is not present
    const oldStatusText = page.locator('text=Connected to SignalR Hub');
    await expect(oldStatusText).toHaveCount(0);

    // Verify the modern status icon is positioned in top-right
    const statusIcon = page.locator('div[style*="position:absolute"][style*="top:1rem"][style*="right:1rem"]');
    await expect(statusIcon).toBeVisible();

    // Verify the icon container has modern circular design
    const iconContainer = statusIcon.locator('div[style*="border-radius:50%"]');
    await expect(iconContainer).toBeVisible();

    // Verify the session controls are still present
    const sessionControls = page.locator('text=SESSION CONTROLS');
    await expect(sessionControls).toBeVisible();
});