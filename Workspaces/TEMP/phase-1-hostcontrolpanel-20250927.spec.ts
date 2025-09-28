import { expect, test } from '@playwright/test';

test('Phase 1: Verify Broadcast HTML panel is removed from Host Control Panel', async ({ page }) => {
    // Navigate to the host control panel
    await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Verify the broadcast HTML panel is not present
    const broadcastPanel = page.locator('text=Broadcast HTML to Sessions');
    await expect(broadcastPanel).toHaveCount(0);

    // Also check for the broadcast tower icon
    const broadcastIcon = page.locator('i.fa-broadcast-tower');
    await expect(broadcastIcon).toHaveCount(0);

    // Verify the session controls are still present
    const sessionControls = page.locator('text=SESSION CONTROLS');
    await expect(sessionControls).toBeVisible();

    // Verify the start session button is still present
    const startButton = page.locator('text=Start Session');
    await expect(startButton).toBeVisible();
});