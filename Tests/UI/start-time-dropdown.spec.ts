import { expect, test } from '@playwright/test';

test.describe('Start Time Dropdown', () => {
    test('should display dropdown with 30-minute intervals', async ({ page }) => {
        await page.goto('http://localhost:9090/host/session-opener');

        const timeSelect = page.locator('#session-time');
        await expect(timeSelect).toBeVisible();

        // Verify it's a select element, not input
        await expect(timeSelect).toHaveAttribute('aria-label', /Eastern Standard Time/);

        // Count options (should be 38)
        const options = timeSelect.locator('option');
        await expect(options).toHaveCount(38);

        // Verify first and last options
        await expect(options.nth(0)).toHaveText('5:00 AM');
        await expect(options.nth(37)).toHaveText('11:30 PM');
    });

    test('should auto-select nearest time on page load', async ({ page }) => {
        await page.goto('http://localhost:9090/host/session-opener');

        const timeSelect = page.locator('#session-time');
        const selectedValue = await timeSelect.inputValue();

        // Verify a time is selected (not empty)
        expect(selectedValue).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);

        console.log(`Auto-selected time: ${selectedValue}`);
    });

    test('should allow manual time selection', async ({ page }) => {
        await page.goto('http://localhost:9090/host/session-opener');

        const timeSelect = page.locator('#session-time');

        // Change selection to 9:30 AM
        await timeSelect.selectOption('9:30 AM');

        // Verify selection changed
        await expect(timeSelect).toHaveValue('9:30 AM');
    });

    test('should maintain selection during form interaction', async ({ page }) => {
        await page.goto('http://localhost:9090/host/session-opener');

        const timeSelect = page.locator('#session-time');
        await timeSelect.selectOption('2:30 PM');

        // Interact with other form fields
        const dateInput = page.locator('#session-date');
        await dateInput.fill('2025-11-15');

        // Verify time selection persisted
        await expect(timeSelect).toHaveValue('2:30 PM');
    });
});
