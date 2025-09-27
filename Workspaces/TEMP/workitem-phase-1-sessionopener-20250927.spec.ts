import { expect, test } from '@playwright/test';

test('Phase 1: Default start time should be 6:00 AM', async ({ page }) => {
    await page.goto('/host/session-opener');

    // Wait for the page to load and find the time input field
    const timeInput = page.locator('input[placeholder*="time"], input[type="text"]').filter({ hasText: /6:00 AM/ }).first();

    // If not found by text, try finding by value attribute
    if (await timeInput.count() === 0) {
        const timeInputByValue = page.locator('input').filter({ hasText: '' });
        // Check if any input has value "6:00 AM"
        const inputs = await page.locator('input[type="text"]').all();
        let found = false;
        for (const input of inputs) {
            const value = await input.inputValue();
            if (value === '6:00 AM') {
                found = true;
                break;
            }
        }
        expect(found).toBeTruthy();
    } else {
        await expect(timeInput).toBeVisible();
    }
});