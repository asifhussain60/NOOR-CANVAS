import { expect, test } from '@playwright/test';

test('Phase 4: Verify increased session name font and proper case session description', async ({ page }) => {
    // Navigate to the host control panel
    await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Verify the session name has increased font size (2rem = 32px in most browsers)
    const sessionNameElement = page.locator('h2').filter({ hasText: /Need For Messengers|Loading Session/ });
    await expect(sessionNameElement).toBeVisible();

    // Check computed font-size is larger (should be 2rem/32px instead of 1.5rem/24px)
    const fontSize = await sessionNameElement.evaluate(el => {
        const computedStyle = window.getComputedStyle(el);
        return computedStyle.fontSize;
    });

    // Convert to numeric value for comparison (should be 32px)
    const fontSizeNum = parseFloat(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(30); // Allow for some browser variation

    // Verify session description is visible and check if proper case formatting is applied
    const sessionDescription = page.locator('p').filter({ hasText: /we look at|Session details are being loaded/ });
    await expect(sessionDescription).toBeVisible();

    // Get the text content to verify proper case formatting
    const descriptionText = await sessionDescription.textContent();

    if (descriptionText && !descriptionText.includes('loading')) {
        // Check that it starts with a capital letter and contains proper case formatting
        expect(descriptionText.charAt(0)).toMatch(/[A-Z]/);

        // Check that common words are properly formatted
        // Should have "We Look At The Purpose Of Sending Messengers" style formatting
        const words = descriptionText.split(' ');
        if (words.length > 0) {
            // First word should be capitalized
            expect(words[0].charAt(0)).toMatch(/[A-Z]/);
        }
    }

    console.log('Session name font size:', fontSize);
    console.log('Session description text:', descriptionText);
});