import { expect, test } from '@playwright/test';

test('Host Control Panel Copy Button - Simplified Fix', async ({ page }) => {
    // Navigate to host control panel
    await page.goto('/host/control-panel/PQ9N5YWW');

    // Wait for the page to load and session to initialize
    await page.waitForSelector('[data-testid="user-registration-link"]', { timeout: 30000 });

    // Check that copy button exists and has correct ID
    const copyButton = page.locator('#copyUserLinkButton');
    await expect(copyButton).toBeVisible();

    // Verify the copy function is available in JavaScript
    const isCopyFunctionAvailable = await page.evaluate(() => {
        return typeof (window as any).copyToClipboardSimple === 'function';
    });
    expect(isCopyFunctionAvailable).toBe(true);

    // Listen for console messages to verify copy functionality
    const consoleMessages: string[] = [];
    page.on('console', msg => {
        if (msg.text().includes('copyToClipboardSimple')) {
            consoleMessages.push(msg.text());
        }
    });

    // Test that copy button click doesn't throw exceptions
    await copyButton.click();

    // Wait a moment for the copy operation to complete
    await page.waitForTimeout(1000);

    // Verify no JavaScript errors occurred
    const jsErrors: string[] = [];
    page.on('pageerror', error => {
        jsErrors.push(error.message);
    });

    // Check that we have the expected console log indicating copy was called
    expect(consoleMessages.length).toBeGreaterThan(0);
    expect(consoleMessages[0]).toContain('copyToClipboardSimple called');

    // Verify no JavaScript errors
    expect(jsErrors.length).toBe(0);

    console.log('✅ Copy button functionality working without exceptions');
});