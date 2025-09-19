import { expect, test } from '@playwright/test';

/**
 * Test for Host Control Panel functionality
 * Tests the updated "Enter Host Control Panel" button and new HostControlPanel.razor view
 * 
 * This test validates:
 * - Button text changed from "Open Waiting Room" to "Enter Host Control Panel"
 * - Button has appropriate icon (fa-cogs)
 * - Button routes to new HostControlPanel.razor view
 * - HostControlPanel displays "HOST CONTROL PANEL" title
 */

test.describe('Host Control Panel', () => {
    test('should show Enter Host Control Panel button and navigate to control panel', async ({ page }) => {
        // Navigate to Host Session Opener with test token
        await page.goto('http://localhost:9090/host/session-opener/JHINFLXN');

        // Wait for page to load completely
        await page.waitForLoadState('networkidle');

        // Verify the button text has changed to "Enter Host Control Panel"
        const controlPanelButton = page.locator('button:has-text("Enter Host Control Panel")');
        await expect(controlPanelButton).toBeVisible();

        // Verify the button has the correct icon (fa-cogs)
        const buttonIcon = controlPanelButton.locator('i.fa-cogs');
        await expect(buttonIcon).toBeVisible();

        // Click the "Enter Host Control Panel" button
        await controlPanelButton.click();

        // Wait for navigation to complete
        await page.waitForLoadState('networkidle');

        // Verify we're on the Host Control Panel page
        expect(page.url()).toContain('/host/control-panel/');

        // Verify the "HOST CONTROL PANEL" title is displayed
        const title = page.locator('h1:has-text("HOST CONTROL PANEL")');
        await expect(title).toBeVisible();

        // Verify the control panel icon is displayed in the title
        const titleIcon = page.locator('h1').locator('..').locator('i.fa-cogs');
        await expect(titleIcon).toBeVisible();

        // Verify session information is displayed
        const sessionInfo = page.locator('text=Session Information');
        await expect(sessionInfo).toBeVisible();

        // Verify the session ID is shown
        const sessionId = page.locator('text=Session ID:');
        await expect(sessionId).toBeVisible();
    });

    test('should display correct session ID in control panel', async ({ page }) => {
        // Navigate directly to control panel with specific session ID
        const testSessionId = 'test-session-123';
        await page.goto(`http://localhost:9090/host/control-panel/${testSessionId}`);

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Verify the session ID is displayed correctly
        const sessionIdText = page.locator(`text=Session ID: ${testSessionId}`);
        await expect(sessionIdText).toBeVisible();
    });
});