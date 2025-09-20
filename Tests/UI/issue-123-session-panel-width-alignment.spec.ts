import { expect, test } from '@playwright/test';

/**
 * Issue-123: Panel Width Alignment Fix Test
 * Validates that the "Need For Messengers" session details panel 
 * and "SESSION CONTROLS" panel have consistent width alignment
 */

test.describe('Issue-123: Session Panel Width Alignment', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to host control panel with a valid test token
        await page.goto('https://localhost:9091/host/K4BBFSFZ');

        // Wait for the page to load and panels to be visible
        await expect(page.locator('h1:has-text("HOST CONTROL PANEL")')).toBeVisible();
        await expect(page.locator('h2:has-text("Need For Messengers")')).toBeVisible();
        await expect(page.locator('h3:has-text("SESSION CONTROLS")')).toBeVisible();
    });

    test('should have consistent width alignment between session panels', async ({ page }) => {
        // Get the session details panel (contains "Need For Messengers")
        const sessionDetailsPanel = page.locator('h2:has-text("Need For Messengers")').locator('..');

        // Get the session controls panel container 
        const sessionControlsContainer = page.locator('h3:has-text("SESSION CONTROLS")').locator('../..');

        // Verify both panels are visible
        await expect(sessionDetailsPanel).toBeVisible();
        await expect(sessionControlsContainer).toBeVisible();

        // Get bounding boxes to compare widths
        const detailsPanelBox = await sessionDetailsPanel.boundingBox();
        const controlsPanelBox = await sessionControlsContainer.boundingBox();

        // Assert both panels have valid dimensions
        expect(detailsPanelBox).toBeTruthy();
        expect(controlsPanelBox).toBeTruthy();

        // Verify the panels have the same width (within 5px tolerance for browser differences)
        const widthDifference = Math.abs(detailsPanelBox!.width - controlsPanelBox!.width);
        expect(widthDifference).toBeLessThan(5);

        // Verify panels are horizontally aligned (same x position)
        const horizontalDifference = Math.abs(detailsPanelBox!.x - controlsPanelBox!.x);
        expect(horizontalDifference).toBeLessThan(5);

        console.log(`Session Details Panel: width=${detailsPanelBox!.width}px, x=${detailsPanelBox!.x}px`);
        console.log(`Session Controls Panel: width=${controlsPanelBox!.width}px, x=${controlsPanelBox!.x}px`);
        console.log(`Width difference: ${widthDifference}px`);
        console.log(`Horizontal alignment difference: ${horizontalDifference}px`);
    });

    test('should have panels contained within the same parent container', async ({ page }) => {
        // Verify both panels share the same parent container structure
        const commonContainer = page.locator('div').filter({
            has: page.locator('h2:has-text("Need For Messengers")')
        }).filter({
            has: page.locator('h3:has-text("SESSION CONTROLS")')
        });

        await expect(commonContainer).toBeVisible();

        // Verify the container has the expected width constraint (50%)
        const containerBox = await commonContainer.boundingBox();
        expect(containerBox).toBeTruthy();

        // The container should be roughly 50% of the parent width
        // Get the parent container (the main content area)
        const parentContainer = page.locator('div').filter({ hasText: 'HOST CONTROL PANEL' }).first();
        const parentBox = await parentContainer.boundingBox();

        if (parentBox && containerBox) {
            const expectedWidth = parentBox.width * 0.5;
            const actualWidth = containerBox.width;
            const widthRatio = actualWidth / parentBox.width;

            // Allow some tolerance for padding and margins (40-60% of parent width)
            expect(widthRatio).toBeGreaterThan(0.4);
            expect(widthRatio).toBeLessThan(0.6);

            console.log(`Parent width: ${parentBox.width}px`);
            console.log(`Container width: ${actualWidth}px`);
            console.log(`Width ratio: ${(widthRatio * 100).toFixed(1)}%`);
        }
    });

    test('should maintain consistent visual styling between panels', async ({ page }) => {
        // Get panel elements
        const sessionDetailsPanel = page.locator('h2:has-text("Need For Messengers")').locator('..');
        const sessionControlsPanel = page.locator('h3:has-text("SESSION CONTROLS")').locator('..');

        // Verify both panels have border radius styling
        const detailsBorderRadius = await sessionDetailsPanel.evaluate(el =>
            getComputedStyle(el).borderRadius
        );
        const controlsBorderRadius = await sessionControlsPanel.evaluate(el =>
            getComputedStyle(el).borderRadius
        );

        // Both panels should have consistent border radius (1.5rem = 24px)
        expect(detailsBorderRadius).toBe('24px');
        expect(controlsBorderRadius).toBe('24px');

        // Verify both panels have appropriate padding
        const detailsPadding = await sessionDetailsPanel.evaluate(el =>
            getComputedStyle(el).padding
        );
        const controlsPadding = await sessionControlsPanel.evaluate(el =>
            getComputedStyle(el).padding
        );

        // Both should have 1.5rem (24px) padding
        expect(detailsPadding).toBe('24px');
        expect(controlsPadding).toBe('24px');
    });

    test('should preserve panel content and functionality after width alignment', async ({ page }) => {
        // Verify session details content is present
        await expect(page.locator('h2:has-text("Need For Messengers")')).toBeVisible();
        await expect(page.locator('text=we look at the purpose of sending messengers')).toBeVisible();

        // Verify session controls are present and functional
        await expect(page.locator('button:has-text("Start Session")')).toBeVisible();
        await expect(page.locator('button:has-text("End Session")')).toBeVisible();
        await expect(page.locator('button:has-text("Pause")')).toBeVisible();

        // Verify control buttons are interactive (not broken by layout changes)
        const startButton = page.locator('button:has-text("Start Session")');
        const endButton = page.locator('button:has-text("End Session")');

        // Start button should be enabled, End button disabled (initial state)
        await expect(startButton).toBeEnabled();
        await expect(endButton).toBeDisabled();

        // Verify buttons have proper styling and hover effects work
        await startButton.hover();
        // Note: We won't click to avoid changing session state in tests
    });
});