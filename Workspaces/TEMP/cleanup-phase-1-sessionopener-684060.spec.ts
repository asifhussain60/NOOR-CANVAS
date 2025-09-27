import { expect, test } from '@playwright/test';

test.describe('Host-SessionOpener Cleanup Validation', () => {
    test('should validate cascading dropdowns still work after debug cleanup', async ({ page }) => {
        // Set up console logging to capture any errors
        const logs: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                logs.push(`ERROR: ${msg.text()}`);
            }
        });

        // Navigate to Host-SessionOpener with test token
        await page.goto('https://localhost:9091/host/session-opener/PQ9N5YWW');

        // Wait for component initialization
        await page.waitForSelector('h1:has-text("Host Session Opener")', { timeout: 10000 });

        // Wait for albums to auto-populate (timeout mechanism should work)
        await page.waitForFunction(() => {
            const albumSelect = document.querySelector('select') as HTMLSelectElement;
            return albumSelect && albumSelect.options.length > 1;
        }, { timeout: 15000 });

        // Verify albums dropdown is populated
        const albumOptions = await page.locator('select').first().locator('option').count();
        expect(albumOptions).toBeGreaterThan(1);

        // Verify categories populate after album is auto-selected
        await page.waitForFunction(() => {
            const categorySelect = document.querySelectorAll('select')[1] as HTMLSelectElement;
            return categorySelect && categorySelect.options.length > 1;
        }, { timeout: 15000 });

        // Verify sessions populate after category is auto-selected
        await page.waitForFunction(() => {
            const sessionSelect = document.querySelectorAll('select')[2] as HTMLSelectElement;
            return sessionSelect && sessionSelect.options.length > 1;
        }, { timeout: 15000 });

        // Verify "Open Session" button becomes enabled after auto-population
        await page.waitForFunction(() => {
            const button = document.querySelector('button:has-text("Open Session")') as HTMLButtonElement;
            return button && !button.disabled;
        }, { timeout: 20000 });

        const openButton = page.locator('button:has-text("Open Session")');
        await expect(openButton).toBeEnabled();

        // Verify no JavaScript errors occurred during the process
        expect(logs).toHaveLength(0);

        console.log('✅ All cascading functionality preserved after cleanup');
    });

    test('should validate session creation still works', async ({ page }) => {
        // Navigate to Host-SessionOpener with test token
        await page.goto('https://localhost:9091/host/session-opener/PQ9N5YWW');

        // Wait for auto-population to complete
        await page.waitForFunction(() => {
            const button = document.querySelector('button:has-text("Open Session")') as HTMLButtonElement;
            return button && !button.disabled;
        }, { timeout: 20000 });

        // Click the Open Session button
        await page.click('button:has-text("Open Session")');

        // Wait for session URL panel to appear
        await page.waitForSelector('text=Session URL', { timeout: 10000 });

        // Verify session was created successfully
        const urlPanel = page.locator('text=Session URL');
        await expect(urlPanel).toBeVisible();

        console.log('✅ Session creation functionality preserved after cleanup');
    });
});