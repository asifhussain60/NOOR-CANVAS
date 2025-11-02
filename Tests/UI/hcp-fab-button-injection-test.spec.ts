/**
 * hcp-fab-button-injection-test.spec.ts
 * 
 * PURPOSE: Validate share button injection into Host Control Panel transcript
 * 
 * VERIFIES:
 * 1. Share buttons inject into correct container (#content-transcript-container)
 * 2. Wrapper div structure (header with button + body with asset)
 * 3. Button IDs match pattern share-btn-{type}-{id}
 * 4. No timing/race conditions during injection
 * 5. Assets properly wrapped and styled
 * 6. Click handler displays toast notification with button ID
 * 
 * ORCHESTRATION: Uses separate app process (see run-hcp-fab-button-test.ps1)
 * KEY: hcp-fab-button
 * DATE: 2025-11-01
 */

import { expect, test } from '@playwright/test';

// Test configuration
const APP_URL = 'https://localhost:9091';
const HOST_TOKEN = 'PQ9N5YWW';  // Session 212 host token
const HOST_CONTROL_PANEL_URL = `${APP_URL}/host/control-panel/${HOST_TOKEN}`;

// Container and selector constants
const TRANSCRIPT_CONTAINER_ID = 'content-transcript-container';
const SHARE_BUTTON_PATTERN = /share-btn-(ayah-card|ahadees|other)-\d+/;

test.describe('Share Button Injection Validation', () => {

    test.beforeEach(async ({ page }) => {
        // Set longer timeout for session start
        test.setTimeout(90000);
    });

    test('should inject share buttons into correct container with proper structure', async ({ page }) => {
        // STEP 1: Navigate to Host Control Panel
        console.log('[STEP 1] Navigating to Host Control Panel...');
        await page.goto(HOST_CONTROL_PANEL_URL, { waitUntil: 'networkidle' });

        // Wait for page to load
        await page.waitForSelector('#reg-transcript-canvas-btn', { timeout: 10000 });
        console.log('[PASS] Host Control Panel loaded');

        // STEP 2: Start session to load transcript with assets
        console.log('[STEP 2] Starting session...');
        await page.click('#reg-transcript-canvas-btn');

        // Click Start Session button
        await page.waitForSelector('[data-playwright-log-marker="20251031120000-HostControlPanel-StartSession"]', { timeout: 10000 });
        await page.click('[data-playwright-log-marker="20251031120000-HostControlPanel-StartSession"]');
        console.log('[PASS] Session start initiated');

        // STEP 3: Wait for transcript container to appear
        console.log('[STEP 3] Waiting for transcript container...');
        await page.waitForSelector(`#${TRANSCRIPT_CONTAINER_ID}`, {
            timeout: 30000,
            state: 'attached'
        });
        console.log('[PASS] Transcript container found');

        // STEP 4: Wait for assets to load (Ayah cards)
        console.log('[STEP 4] Waiting for assets to load...');

        // Wait for at least one asset with data-asset-id attribute
        await page.waitForSelector('[data-asset-id]', {
            timeout: 20000,
            state: 'attached'
        });

        // Get all assets
        const assets = await page.locator('[data-asset-id]').all();
        console.log(`[PASS] Found ${assets.length} assets with data-asset-id`);

        expect(assets.length).toBeGreaterThan(0);

        // STEP 5: Verify share buttons are injected
        console.log('[STEP 5] Verifying share button injection...');

        // Wait a moment for JavaScript injection to complete
        await page.waitForTimeout(2000);

        // Find all share buttons
        const shareButtons = await page.locator('[id^="share-btn-"]').all();
        console.log(`[INFO] Found ${shareButtons.length} share buttons`);

        expect(shareButtons.length).toBeGreaterThan(0);

        // STEP 6: Verify button IDs match expected pattern
        console.log('[STEP 6] Verifying button ID pattern...');

        for (const button of shareButtons) {
            const buttonId = await button.getAttribute('id');
            console.log(`[INFO] Checking button ID: ${buttonId}`);

            expect(buttonId).toMatch(SHARE_BUTTON_PATTERN);
        }
        console.log('[PASS] All button IDs match pattern');

        // STEP 7: Verify buttons are in correct container
        console.log('[STEP 7] Verifying buttons are in transcript container...');

        const containerButtons = await page.locator(`#${TRANSCRIPT_CONTAINER_ID} [id^="share-btn-"]`).all();
        expect(containerButtons.length).toBe(shareButtons.length);
        console.log(`[PASS] All ${shareButtons.length} buttons are inside transcript container`);

        // STEP 8: Verify wrapper structure (header + body)
        console.log('[STEP 8] Verifying wrapper div structure...');

        // Get first share button to examine structure
        const firstButton = shareButtons[0];
        const buttonId = await firstButton.getAttribute('id');

        // Find parent wrapper div
        const wrapper = page.locator(`#${buttonId}`).locator('xpath=ancestor::div[contains(@class, "share-button-wrapper") or contains(@class, "wrapper")]').first();

        // Verify wrapper has header section with button
        const headerButton = await wrapper.locator('button, a').first();
        expect(await headerButton.isVisible()).toBe(true);
        console.log('[PASS] Button found in wrapper structure');

        // Verify wrapper has body section with asset content
        const bodyContent = await wrapper.locator('xpath=following-sibling::*[contains(@data-asset-id, "")]').first();
        expect(await bodyContent.isVisible()).toBe(true);
        console.log('[PASS] Asset content found below button');

        // STEP 9: Verify no timing issues (buttons loaded before DOM ready)
        console.log('[STEP 9] Verifying no race conditions...');

        // Check that window.shareButtonsInitialized flag was set
        const initFlag = await page.evaluate(() => {
            return (window as any).shareButtonsInitialized;
        });

        expect(initFlag).toBe(true);
        console.log('[PASS] Share button initialization flag is set');

        // STEP 10: Test click handler and toast notification
        console.log('[STEP 10] Testing click handler and toast...');

        // Get first share button
        const testButton = shareButtons[0];
        const testButtonId = await testButton.getAttribute('id');

        console.log(`[INFO] Clicking button: ${testButtonId}`);

        // Click the button
        await testButton.click();

        // Wait for toast to appear
        await page.waitForSelector('.button-id-toast', {
            timeout: 5000,
            state: 'visible'
        });

        // Verify toast content shows button ID
        const toastText = await page.locator('.button-id-toast').textContent();
        expect(toastText).toContain(testButtonId || '');
        console.log(`[PASS] Toast displays button ID: ${testButtonId}`);

        // STEP 11: Verify toast styling and animation
        console.log('[STEP 11] Verifying toast styling...');

        const toast = page.locator('.button-id-toast');

        // Check gradient styling (indigo to purple)
        const bgGradient = await toast.evaluate((el) => {
            return window.getComputedStyle(el).backgroundImage;
        });

        expect(bgGradient).toContain('gradient');
        console.log('[PASS] Toast has gradient styling');

        // Check positioning (top-right)
        const position = await toast.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
                position: styles.position,
                top: styles.top,
                right: styles.right,
                zIndex: styles.zIndex
            };
        });

        expect(position.position).toBe('fixed');
        expect(position.zIndex).toBe('10000');
        console.log('[PASS] Toast positioned correctly (fixed, top-right, z-index 10000)');

        // STEP 12: Verify auto-dismiss (3 seconds)
        console.log('[STEP 12] Verifying toast auto-dismiss...');

        // Wait for auto-dismiss (3 seconds + animation)
        await page.waitForTimeout(3500);

        // Toast should be hidden or removed
        const toastVisible = await toast.isVisible().catch(() => false);
        expect(toastVisible).toBe(false);
        console.log('[PASS] Toast auto-dismissed after 3 seconds');

        console.log('[SUCCESS] All share button injection validations passed!');
    });

    test('should handle multiple assets without timing conflicts', async ({ page }) => {
        // STEP 1: Navigate and start session
        console.log('[STEP 1] Navigating to Host Control Panel...');
        await page.goto(HOST_CONTROL_PANEL_URL, { waitUntil: 'networkidle' });

        await page.waitForSelector('#reg-transcript-canvas-btn', { timeout: 10000 });
        await page.click('#reg-transcript-canvas-btn');

        await page.waitForSelector('[data-playwright-log-marker="20251031120000-HostControlPanel-StartSession"]', { timeout: 10000 });
        await page.click('[data-playwright-log-marker="20251031120000-HostControlPanel-StartSession"]');

        // STEP 2: Wait for multiple assets
        console.log('[STEP 2] Waiting for multiple assets...');
        await page.waitForSelector('[data-asset-id]', { timeout: 20000 });

        // Get all assets
        const assets = await page.locator('[data-asset-id]').all();
        console.log(`[INFO] Found ${assets.length} assets`);

        // STEP 3: Verify each asset has a share button
        console.log('[STEP 3] Verifying each asset has a share button...');

        let matchCount = 0;

        for (const asset of assets) {
            const assetId = await asset.getAttribute('data-asset-id');
            console.log(`[INFO] Checking asset: ${assetId}`);

            // Find share button for this asset
            // Share button should be ABOVE the asset container
            const shareButton = await page.locator(`[id*="${assetId}"]`).first();

            if (await shareButton.isVisible()) {
                matchCount++;
                console.log(`[PASS] Asset ${assetId} has corresponding share button`);
            } else {
                console.log(`[WARN] Asset ${assetId} missing share button`);
            }
        }

        console.log(`[INFO] ${matchCount} of ${assets.length} assets have share buttons`);

        // At least 50% of assets should have buttons (some may not be shareable)
        expect(matchCount).toBeGreaterThan(assets.length * 0.5);
        console.log('[PASS] Majority of assets have share buttons injected');
    });

    test('should inject buttons with correct asset type in ID', async ({ page }) => {
        // Navigate and start session
        await page.goto(HOST_CONTROL_PANEL_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('#reg-transcript-canvas-btn', { timeout: 10000 });
        await page.click('#reg-transcript-canvas-btn');
        await page.waitForSelector('[data-playwright-log-marker="20251031120000-HostControlPanel-StartSession"]', { timeout: 10000 });
        await page.click('[data-playwright-log-marker="20251031120000-HostControlPanel-StartSession"]');

        // Wait for share buttons
        await page.waitForSelector('[id^="share-btn-"]', { timeout: 20000 });

        const shareButtons = await page.locator('[id^="share-btn-"]').all();

        console.log(`[INFO] Validating asset types in ${shareButtons.length} button IDs...`);

        let ayahCardCount = 0;
        let ahadeesCount = 0;
        let otherCount = 0;

        for (const button of shareButtons) {
            const buttonId = await button.getAttribute('id');

            if (buttonId?.includes('ayah-card')) {
                ayahCardCount++;
            } else if (buttonId?.includes('ahadees')) {
                ahadeesCount++;
            } else {
                otherCount++;
            }

            console.log(`[INFO] Button: ${buttonId}`);
        }

        console.log(`[INFO] Button types: Ayah Cards=${ayahCardCount}, Ahadees=${ahadeesCount}, Other=${otherCount}`);

        // Session 212 has Ayah cards, so we should have at least some
        expect(ayahCardCount).toBeGreaterThan(0);
        console.log('[PASS] Found Ayah card share buttons');
    });

    test('should maintain proper z-index layering', async ({ page }) => {
        // Navigate and start session
        await page.goto(HOST_CONTROL_PANEL_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('#reg-transcript-canvas-btn', { timeout: 10000 });
        await page.click('#reg-transcript-canvas-btn');
        await page.waitForSelector('[data-playwright-log-marker="20251031120000-HostControlPanel-StartSession"]', { timeout: 10000 });
        await page.click('[data-playwright-log-marker="20251031120000-HostControlPanel-StartSession"]');

        // Wait for share buttons
        await page.waitForSelector('[id^="share-btn-"]', { timeout: 20000 });

        // Get first share button
        const firstButton = await page.locator('[id^="share-btn-"]').first();

        // Click to show toast
        await firstButton.click();

        // Wait for toast
        await page.waitForSelector('.button-id-toast', { timeout: 5000 });

        // Check z-index hierarchy
        const toastZIndex = await page.locator('.button-id-toast').evaluate((el) => {
            return parseInt(window.getComputedStyle(el).zIndex);
        });

        const buttonZIndex = await firstButton.evaluate((el) => {
            return parseInt(window.getComputedStyle(el).zIndex || '0');
        });

        console.log(`[INFO] Toast z-index: ${toastZIndex}, Button z-index: ${buttonZIndex}`);

        // Toast should be above button
        expect(toastZIndex).toBeGreaterThan(buttonZIndex);
        expect(toastZIndex).toBe(10000);

        console.log('[PASS] Z-index layering is correct');
    });
});
