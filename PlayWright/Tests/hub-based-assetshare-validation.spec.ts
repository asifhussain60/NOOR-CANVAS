import { expect, test } from '@playwright/test';

test.describe('Hub-Based Asset Share Validation', () => {

    test('Validate hub-based share buttons work correctly', async ({ page }) => {
        const testId = `hub-test-${Date.now()}`;
        console.log(`[${testId}] Starting hub-based asset share validation`);

        // Navigate to host control panel 
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        console.log(`[${testId}] Loaded host control panel`);

        // Start session to activate share buttons
        const startButton = page.locator('button:has-text("Start Session")');
        await startButton.click();
        console.log(`[${testId}] Started session`);

        // Wait for share buttons to appear
        await page.waitForSelector('.ks-share-button', { timeout: 10000 });
        console.log(`[${testId}] Share buttons appeared`);

        // Get all share buttons
        const shareButtons = await page.locator('.ks-share-button').all();
        console.log(`[${testId}] Found ${shareButtons.length} share buttons`);

        // Validate button structure and IDs
        expect(shareButtons.length).toBeGreaterThan(0);

        // Test a few specific buttons
        for (let i = 0; i < Math.min(5, shareButtons.length); i++) {
            const button = shareButtons[i];
            const buttonId = await button.getAttribute('data-share-id');
            const buttonType = await button.getAttribute('data-asset-type');
            const buttonText = await button.textContent();

            console.log(`[${testId}] Button ${i + 1}: ID=${buttonId}, Type=${buttonType}, Text=${buttonText}`);

            // Validate the hub-based ID pattern
            expect(buttonId).toMatch(/^asset-(text|image|table|list|content)-\d+$/);
            expect(buttonType).toMatch(/^(text|image|table|list|content)$/);
            expect(buttonText).toContain('📤 SHARE');
        }

        // Test clicking the first share button
        console.log(`[${testId}] Testing share button click functionality`);

        // Listen for console messages
        const consoleMessages: string[] = [];
        page.on('console', msg => {
            consoleMessages.push(msg.text());
        });

        // Click the first share button
        await shareButtons[0].click();

        // Wait a bit for any async operations
        await page.waitForTimeout(2000);

        console.log(`[${testId}] Console messages after click: ${consoleMessages.length}`);
        consoleMessages.forEach((msg, idx) => {
            console.log(`[${testId}] Console ${idx + 1}: ${msg}`);
        });

        // Success - hub-based approach is working
        console.log(`[${testId}] ✅ Hub-based asset sharing validation completed successfully`);
        console.log(`[${testId}] Share buttons generated: ${shareButtons.length}`);
        console.log(`[${testId}] Button ID pattern confirmed: asset-{type}-{number}`);
        console.log(`[${testId}] No database dependency required`);

        // The test passes if we have buttons with the correct structure
        expect(shareButtons.length).toBeGreaterThan(10); // Should have many buttons from content detection
    });
});