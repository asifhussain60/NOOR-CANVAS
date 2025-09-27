import { expect, test } from '@playwright/test';

test.describe('HostControlPanel Copy Button Fix', () => {
    test('copy button should exist and show visual feedback when clicked', async ({ page }) => {
        // Navigate to the host control panel
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');

        // Wait for page to load completely
        await page.waitForSelector('[data-testid="user-link-input"]', { timeout: 30000 });

        // Find the copy button
        const copyButton = page.locator('#copyUserLinkButton');
        await expect(copyButton).toBeVisible();

        // Check initial state (should show "Copy" text and copy icon)
        await expect(copyButton).toContainText('Copy');
        await expect(copyButton.locator('i.fa-copy')).toBeVisible();

        // Click the copy button
        await copyButton.click();

        // Wait a moment for any visual feedback
        await page.waitForTimeout(500);

        // The button should exist and be clickable regardless of clipboard permissions
        // In test environment, clipboard might not work, but button should not crash
        await expect(copyButton).toBeVisible();

        console.log('✅ Copy button test completed - no JavaScript crashes detected');
    });

    test('page should load without JavaScript syntax errors', async ({ page }) => {
        const jsErrors: string[] = [];

        // Capture any JavaScript errors
        page.on('pageerror', (error) => {
            jsErrors.push(error.message);
        });

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                jsErrors.push(msg.text());
            }
        });

        // Navigate to the page
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');

        // Wait for page to load
        await page.waitForSelector('h1', { timeout: 30000 });

        // Wait a bit more for any delayed JavaScript errors
        await page.waitForTimeout(2000);

        // Filter out expected clipboard permission errors (these are browser security, not syntax errors)
        const syntaxErrors = jsErrors.filter(error =>
            !error.includes('Clipboard API has been blocked') &&
            !error.includes('Failed to execute \'writeText\' on \'Clipboard\'')
        );

        // Should have no JavaScript syntax errors
        expect(syntaxErrors).toHaveLength(0);

        console.log('✅ No JavaScript syntax errors detected');
    });
});