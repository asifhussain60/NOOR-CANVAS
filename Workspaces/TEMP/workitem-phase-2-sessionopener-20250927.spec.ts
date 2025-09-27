import { expect, test } from '@playwright/test';

test('Phase 2: All form controls should have autocomplete=off', async ({ page }) => {
    // Mock the authentication check
    await page.goto('/host/session-opener/PQ9N5YWW');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check all form controls have autocomplete=off
    const selects = page.locator('select');
    const inputs = page.locator('input');

    // Verify selects have autocomplete=off
    const selectCount = await selects.count();
    for (let i = 0; i < selectCount; i++) {
        const autocomplete = await selects.nth(i).getAttribute('autocomplete');
        expect(autocomplete).toBe('off');
    }

    // Verify inputs have autocomplete=off (exclude hidden inputs and buttons)
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const type = await input.getAttribute('type');
        // Only check visible form inputs, not hidden or button types
        if (type && ['text', 'date', 'number'].includes(type)) {
            const autocomplete = await input.getAttribute('autocomplete');
            expect(autocomplete).toBe('off');
        }
    }
});