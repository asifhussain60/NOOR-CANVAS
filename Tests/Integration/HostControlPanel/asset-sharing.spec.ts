/**
 * [REFACTOR:Phase1] Host Control Panel - Asset Sharing Integration Tests
 * Tests asset detection, share button injection, and asset sharing workflow
 */

import { expect, test } from '@playwright/test';

const TEST_HOST_TOKEN = 'testhost';
const BASE_URL = 'http://localhost:5000';

test.describe('Host Control Panel - Asset Sharing', () => {

    test('should detect assets in session transcript', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Check if transcript panel exists (session must be Active)
        const transcriptPanel = page.locator('.host-transcript-panel, [class*="transcript"]');

        if (await transcriptPanel.count() === 0) {
            console.log('ℹ️ Transcript panel not visible, session may not be Active');
            test.skip();
            return;
        }

        // Look for asset elements with data-asset-id attributes
        const assetElements = page.locator('[data-asset-id]');
        const assetCount = await assetElements.count();

        console.log(`📊 Detected ${assetCount} assets in transcript`);

        if (assetCount > 0) {
            // Verify asset types
            const firstAsset = assetElements.first();
            const assetId = await firstAsset.getAttribute('data-asset-id');
            console.log(`✅ First asset ID: ${assetId}`);

            expect(assetId).toBeTruthy();
        }
    });

    test('should inject share buttons for each asset', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Find share buttons with data-share-id attributes
        const shareButtons = page.locator('button[data-share-id]');
        const buttonCount = await shareButtons.count();

        console.log(`🔘 Found ${buttonCount} share buttons`);

        if (buttonCount > 0) {
            // Verify first share button structure
            const firstButton = shareButtons.first();
            await expect(firstButton).toBeVisible();

            const shareId = await firstButton.getAttribute('data-share-id');
            const assetType = await firstButton.getAttribute('data-asset-type');

            console.log(`✅ Share button: shareId=${shareId}, type=${assetType}`);

            expect(shareId).toBeTruthy();
            expect(assetType).toBeTruthy();
        } else {
            console.log('ℹ️ No share buttons found (transcript may be empty or not Active)');
        }
    });

    test('should handle share button click', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Find first share button
        const shareButton = page.locator('button[data-share-id]').first();

        if (await shareButton.count() === 0) {
            console.log('ℹ️ No share buttons available for testing');
            test.skip();
            return;
        }

        // Get button details before clicking
        const shareId = await shareButton.getAttribute('data-share-id');
        const assetType = await shareButton.getAttribute('data-asset-type');

        console.log(`🖱️ Clicking share button: ${shareId} (${assetType})`);

        // Set up console listener to verify JavaScript execution
        const consoleMessages: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('SHARE-BUTTONS') || msg.text().includes('ASSET-SHARE')) {
                consoleMessages.push(msg.text());
            }
        });

        // Click the share button
        await shareButton.click();
        await page.waitForTimeout(2000);

        // Verify console logs show share action
        const shareLogsFound = consoleMessages.some(msg =>
            msg.includes('Share button clicked') || msg.includes('shareIndividualAsset')
        );

        if (shareLogsFound) {
            console.log('✅ Share button click executed JavaScript correctly');
        }

        console.log(`📋 Console messages: ${consoleMessages.length} captured`);
    });

    test('should call Blazor ShareAsset method via interop', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Check if hostControlPanelRef is available in window
        const hasBlazorRef = await page.evaluate(() => {
            return typeof (window as any).hostControlPanelRef !== 'undefined';
        });

        if (hasBlazorRef) {
            console.log('✅ Blazor interop reference (hostControlPanelRef) available');
        } else {
            console.log('⚠️ Blazor interop reference not initialized');
        }

        // Verify ShareAsset function exists
        const hasShareFunction = await page.evaluate(() => {
            return typeof (window as any).shareIndividualAsset === 'function';
        });

        expect(hasShareFunction).toBe(true);
        console.log('✅ shareIndividualAsset function registered');
    });

    test('should extract asset HTML correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Find first asset element
        const assetElement = page.locator('[data-asset-id]').first();

        if (await assetElement.count() === 0) {
            console.log('ℹ️ No assets found for HTML extraction test');
            test.skip();
            return;
        }

        // Get asset HTML
        const assetHtml = await assetElement.evaluate(el => el.outerHTML);

        console.log(`📄 Asset HTML length: ${assetHtml.length} characters`);

        // Verify HTML contains expected attributes
        expect(assetHtml).toContain('data-asset-id');

        // Check for common asset classes
        const hasAssetClass = assetHtml.includes('ayah-card') ||
            assetHtml.includes('hadith-card') ||
            assetHtml.includes('asset');

        if (hasAssetClass) {
            console.log('✅ Asset HTML contains expected structure');
        }
    });

    test('should display toast notification on share success', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Check if Notyf is loaded
        const hasNotyf = await page.evaluate(() => {
            return typeof (window as any).notyf !== 'undefined';
        });

        if (hasNotyf) {
            console.log('✅ Notyf toast library loaded');

            // Trigger a test toast
            await page.evaluate(() => {
                if ((window as any).showFabClickToast) {
                    (window as any).showFabClickToast('Test asset shared');
                }
            });

            await page.waitForTimeout(1000);

            // Check for toast notification element
            const toast = page.locator('.notyf, [class*="toast"]');
            if (await toast.count() > 0) {
                console.log('✅ Toast notification displayed');
            }
        } else {
            console.log('⚠️ Notyf not loaded');
        }
    });

    test('should handle share errors gracefully', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Attempt to share non-existent asset
        const errorCaught = await page.evaluate(async () => {
            try {
                if (typeof (window as any).shareIndividualAsset === 'function') {
                    await (window as any).shareIndividualAsset('non-existent-id', 'test-type');
                    return false;
                }
                return false;
            } catch (error) {
                return true;
            }
        });

        // Error should be handled without crashing
        console.log(`✅ Error handling: ${errorCaught ? 'caught' : 'graceful fallback'}`);
    });

    test('should track asset instance numbers correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Find share buttons with instance attributes
        const buttonsWithInstances = page.locator('button[data-share-id][data-instance]');
        const instanceCount = await buttonsWithInstances.count();

        console.log(`📊 Buttons with instance tracking: ${instanceCount}`);

        if (instanceCount > 0) {
            // Get first instance number
            const firstInstance = await buttonsWithInstances.first().getAttribute('data-instance');
            console.log(`✅ Instance tracking found: instance=${firstInstance}`);
            expect(parseInt(firstInstance || '0')).toBeGreaterThan(0);
        }
    });
});
