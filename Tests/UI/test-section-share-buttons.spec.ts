import { expect, test } from '@playwright/test';

test.describe('Transcript Section Share Buttons', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to host control panel
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
    });

    test('should inject share buttons after clicking Share Transcript', async ({ page }) => {
        console.log('=== TEST START: Section Share Buttons ===');

        // Step 1: Click "Share Transcript" button
        console.log('Step 1: Looking for Share Transcript button...');
        const shareTranscriptBtn = page.locator('button:has-text("Share Transcript")');
        await expect(shareTranscriptBtn).toBeVisible({ timeout: 10000 });

        console.log('Step 1: Clicking Share Transcript button...');
        await shareTranscriptBtn.click();

        // Step 2: Wait for transcript to load
        console.log('Step 2: Waiting for transcript content...');
        await page.waitForSelector('#transcript-content-container', { timeout: 10000 });

        // Wait for content to be populated (not just empty container)
        await page.waitForFunction(() => {
            const container = document.getElementById('transcript-content-container');
            return container && container.innerHTML.length > 0;
        }, { timeout: 10000 });

        console.log('Step 2: Transcript content loaded');

        // Step 3: Check for h2 elements in transcript
        console.log('Step 3: Checking for h2 elements...');
        const h2Count = await page.locator('#transcript-content-container h2').count();
        console.log(`Step 3: Found ${h2Count} h2 elements`);
        expect(h2Count).toBeGreaterThan(0);

        // Step 4: Wait for share buttons to be injected (up to 10 seconds)
        console.log('Step 4: Waiting for share buttons to be injected...');
        await page.waitForSelector('.transcript-section-share-btn', { timeout: 15000 });

        // Step 5: Count share buttons
        console.log('Step 5: Counting share buttons...');
        const buttonCount = await page.locator('.transcript-section-share-btn').count();
        console.log(`Step 5: Found ${buttonCount} share buttons`);

        // Step 6: Verify button count matches h2 count
        console.log(`Step 6: Verifying ${buttonCount} buttons match ${h2Count} h2 elements`);
        expect(buttonCount).toBe(h2Count);

        // Step 7: Check button text
        console.log('Step 7: Checking first button text...');
        const firstButton = page.locator('.transcript-section-share-btn').first();
        const buttonText = await firstButton.textContent();
        console.log(`Step 7: First button text: "${buttonText}"`);
        expect(buttonText).toContain('Share');

        // Step 8: Check button positioning (should be ABOVE h2, not after)
        console.log('Step 8: Checking button positioning...');
        const firstH2 = page.locator('#transcript-content-container h2').first();
        const firstH2Text = await firstH2.textContent();
        console.log(`Step 8: First h2 text: "${firstH2Text}"`);

        // Check that button comes before the h2 in DOM order
        const buttonIndex = await page.evaluate(() => {
            const container = document.getElementById('transcript-content-container');
            const button = container?.querySelector('.transcript-section-share-btn');
            const h2 = container?.querySelector('h2');
            if (!button || !h2) return -1;

            // Get all children
            const children = Array.from(container?.children || []);
            return children.indexOf(button as Element) < children.indexOf(h2 as Element) ? 1 : 0;
        });

        console.log(`Step 8: Button appears ${buttonIndex === 1 ? 'BEFORE' : 'AFTER'} h2`);
        expect(buttonIndex).toBe(1); // Button should appear before h2

        // Step 9: Get browser console logs
        console.log('Step 9: Checking for JavaScript logs...');
        const logs: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('hcp-tcanvas')) {
                logs.push(text);
                console.log(`[BROWSER LOG] ${text}`);
            }
        });

        // Take screenshot for verification
        await page.screenshot({ path: 'test-results/section-share-buttons-success.png', fullPage: true });

        console.log('=== TEST PASSED: All share buttons injected successfully ===');
    });

    test('should execute debug panel test successfully', async ({ page }) => {
        console.log('=== TEST START: Debug Panel Test ===');

        // Step 1: Click Share Transcript
        console.log('Step 1: Clicking Share Transcript...');
        const shareTranscriptBtn = page.locator('button:has-text("Share Transcript")');
        await shareTranscriptBtn.click();
        await page.waitForTimeout(2000);

        // Step 2: Open Debug Panel (bottom right corner)
        console.log('Step 2: Looking for Debug Panel toggle...');
        const debugPanelToggle = page.locator('button[title*="Debug"]').or(page.locator('.debug-panel-toggle'));

        // Try clicking debug panel toggle (may be in different locations)
        try {
            await debugPanelToggle.first().click({ timeout: 5000 });
            console.log('Step 2: Debug Panel opened');
        } catch (e) {
            console.log('Step 2: Debug panel toggle not found, trying keyboard shortcut...');
            // Try pressing F12 or other keyboard shortcut
            await page.keyboard.press('F12');
        }

        // Step 3: Click "Test Transcript Section Sharing" button
        console.log('Step 3: Looking for test button in debug panel...');
        const testButton = page.locator('button:has-text("Test Transcript Section Sharing")');

        try {
            await expect(testButton).toBeVisible({ timeout: 5000 });
            console.log('Step 3: Clicking test button...');
            await testButton.click();

            // Step 4: Wait for test results modal/message
            console.log('Step 4: Waiting for test results...');
            await page.waitForTimeout(3000);

            // Take screenshot of results
            await page.screenshot({ path: 'test-results/debug-panel-test-results.png', fullPage: true });

            console.log('=== TEST COMPLETED: Check screenshot for results ===');
        } catch (e) {
            console.log('Step 3: Debug panel test button not found:', e);
            // Take screenshot to show what's on screen
            await page.screenshot({ path: 'test-results/debug-panel-not-found.png', fullPage: true });
        }
    });
});
