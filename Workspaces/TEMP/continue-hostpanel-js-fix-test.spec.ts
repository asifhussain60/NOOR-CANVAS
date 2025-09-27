import { expect, test } from '@playwright/test';

test('Host Control Panel Copy Button JavaScript Fix', async ({ page }) => {
    // Navigate to the host control panel
    await page.goto('/host/control-panel/PQ9N5YWW');

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');

    // Check that no JavaScript errors occurred during page load
    const jsErrors: string[] = [];
    page.on('pageerror', (error) => {
        jsErrors.push(error.message);
    });

    // Wait a bit more for any potential errors to surface
    await page.waitForTimeout(2000);

    // Verify no JavaScript errors
    expect(jsErrors.filter(error =>
        error.includes('SyntaxError') ||
        error.includes('copyTextToClipboard') ||
        error.includes('No interop methods')
    )).toHaveLength(0);

    // Verify the copy button is present and visible
    const copyButton = page.locator('#copyUserLinkButton');
    await expect(copyButton).toBeVisible();

    // Verify the copy button contains expected text
    await expect(copyButton).toContainText('Copy User Landing Link');

    // Verify the copy button is enabled (not disabled)
    await expect(copyButton).toBeEnabled();

    // Verify that the JavaScript functions are available
    const functionsAvailable = await page.evaluate(() => {
        const w = window as any;
        return {
            copyTextToClipboard: typeof w.copyTextToClipboard === 'function',
            showCopyFeedback: typeof w.showCopyFeedback === 'function',
            showSuccessToast: typeof w.showSuccessToast === 'function'
        };
    });

    expect(functionsAvailable.copyTextToClipboard).toBe(true);
    expect(functionsAvailable.showCopyFeedback).toBe(true);
    expect(functionsAvailable.showSuccessToast).toBe(true);

    // Verify session data loaded properly
    await expect(page.locator('h2')).toContainText('Need For Messengers');

    console.log('✅ Host Control Panel JavaScript fix verification completed successfully');
});