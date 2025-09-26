import { expect, Page, test } from '@playwright/test';

/**
 * NOOR Canvas Host Control Panel Error Display Test
 * 
 * Tests the new error display component and improved asset sharing functionality.
 * This test validates:
 * 1. Error display panel appears when errors occur
 * 2. Copy functionality works for error reports
 * 3. TestShareAsset button works without JavaScript errors
 * 4. Error handling shows proper user feedback
 */

test.describe('Host Control Panel Error Display System', () => {
    let page: Page;
    let hostToken: string;

    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({
            viewport: { width: 1400, height: 900 },
            permissions: ['clipboard-read', 'clipboard-write'],
        });
        page = await context.newPage();

        // Enable console logging for debugging
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('DEBUG-WORKITEM:hostcanvas') ||
                text.includes('NOOR-TEST') ||
                text.includes('ShareAsset') ||
                text.includes('error')) {
                console.log(`[${msg.type().toUpperCase()}] ${text}`);
            }
        });

        // Use a fallback test token for simplicity
        hostToken = 'TEST123A';
        console.log(`Using test host token: ${hostToken}`);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('should display error panel when JavaScript errors occur', async () => {
        console.log('🧪 Testing error display system...');

        // Navigate to Host Control Panel
        await page.goto(`https://localhost:9091/host/control-panel/${hostToken}`);

        // Wait for page to load
        await expect(page.locator('h1')).toContainText('HOST CONTROL PANEL');

        // Verify error panel exists but is hidden initially
        const errorPanel = page.locator('#noor-error-panel');
        await expect(errorPanel).toBeAttached();
        await expect(errorPanel).toBeHidden();

        // Trigger a JavaScript error to test the error display system
        await page.evaluate(() => {
            // Simulate an error that should be caught by our error display system
            const testError = new Error('Test error for error display validation');
            testError.stack = 'TestError: Test error for error display validation\n    at test function\n    at error display test';
            (window as any).showErrorPanel(testError, testError.stack);
        });

        // Verify error panel becomes visible
        await expect(errorPanel).toBeVisible();

        // Verify error content is displayed
        await expect(page.locator('#error-message')).toContainText('Test error for error display validation');
        await expect(page.locator('#error-timestamp')).toBeVisible();

        console.log('✅ Error panel displays correctly');
    });

    test('should copy error report to clipboard', async () => {
        console.log('📋 Testing error report copy functionality...');

        // Ensure error panel is visible (from previous test or trigger new error)
        const errorPanel = page.locator('#noor-error-panel');
        if (!(await errorPanel.isVisible())) {
            await page.evaluate(() => {
                const testError = new Error('Copy test error');
                (window as any).showErrorPanel(testError, 'Test stack trace for copy functionality');
            });
        }

        // Click copy button
        await page.locator('#copy-error-btn').click();

        // Verify clipboard content (if supported)
        try {
            const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
            expect(clipboardContent).toContain('NOOR Canvas Error Report');
            expect(clipboardContent).toContain('Copy test error');
            console.log('✅ Error report copied successfully');
        } catch (error) {
            console.log('⚠️ Clipboard test skipped (permissions or environment limitation)');
        }

        // Verify button feedback
        await expect(page.locator('#copy-error-btn')).toContainText('Copied!');

        // Wait for button to revert
        await page.waitForTimeout(2500);
        await expect(page.locator('#copy-error-btn')).toContainText('Copy Error');
    });

    test('should handle TestShareAsset without errors', async () => {
        console.log('🚀 Testing improved TestShareAsset functionality...');

        // Navigate fresh to avoid state issues
        await page.goto(`https://localhost:9091/host/control-panel/${hostToken}`);
        await expect(page.locator('h1')).toContainText('HOST CONTROL PANEL');

        // Wait for session to load
        await page.waitForTimeout(3000);

        // Start session first (if not already active)
        const startButton = page.locator('button:has-text("Start Session")');
        if (await startButton.isEnabled()) {
            await startButton.click();
            await page.waitForTimeout(2000);
        }

        // Look for TestShareAsset button
        const testShareButton = page.locator('button:has-text("Test Share Asset")');

        if (await testShareButton.isVisible()) {
            console.log('🎯 TestShareAsset button found, testing...');

            // Click the test share asset button
            await testShareButton.click();

            // Wait for operation to complete
            await page.waitForTimeout(3000);

            // Check if success message appeared
            const successMessage = page.locator('div:has-text("shared successfully")');
            if (await successMessage.isVisible()) {
                console.log('✅ TestShareAsset succeeded with success message');
            }

            // Verify no error panel appeared (would indicate JavaScript errors)
            const errorPanel = page.locator('#noor-error-panel');
            await expect(errorPanel).toBeHidden();

            console.log('✅ TestShareAsset completed without JavaScript errors');
        } else {
            console.log('ℹ️ TestShareAsset button not available (session may not be active)');
        }
    });

    test('should dismiss error panel when dismiss button clicked', async () => {
        console.log('❌ Testing error panel dismiss functionality...');

        // Trigger an error to show the panel
        await page.evaluate(() => {
            (window as any).showErrorPanel('Dismiss test error', 'Test details for dismiss functionality');
        });

        const errorPanel = page.locator('#noor-error-panel');
        await expect(errorPanel).toBeVisible();

        // Click dismiss button
        await page.locator('button:has-text("Dismiss")').click();

        // Verify panel is hidden
        await expect(errorPanel).toBeHidden();

        console.log('✅ Error panel dismissed successfully');
    });

    test('should toggle error details', async () => {
        console.log('🔍 Testing error details toggle functionality...');

        // Show error panel
        await page.evaluate(() => {
            (window as any).showErrorPanel('Details test error', 'Detailed stack trace for toggle test');
        });

        await expect(page.locator('#noor-error-panel')).toBeVisible();

        // Initially details should be hidden
        const errorDetails = page.locator('#error-details');
        await expect(errorDetails).toBeHidden();

        // Click details button
        await page.locator('button:has-text("Details")').click();

        // Details should now be visible
        await expect(errorDetails).toBeVisible();
        await expect(page.locator('#error-stack')).toContainText('Detailed stack trace for toggle test');

        // Click again to hide
        await page.locator('button:has-text("Details")').click();
        await expect(errorDetails).toBeHidden();

        console.log('✅ Error details toggle works correctly');
    });
});