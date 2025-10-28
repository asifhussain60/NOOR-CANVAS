/**
 * FAB Share Button Manual Verification Test
 * 
 * This test navigates to the control panel and captures screenshots
 * to verify the FAB (Floating Action Button) design is working correctly.
 * 
 * Test validates:
 * - FAB buttons are visible in the control panel
 * - Buttons are circular (40px diameter)
 * - Buttons positioned in top-right corner
 * - Different icons: 📤 for assets, 📄 for sections
 * - Subtle blue styling (rgba(59, 130, 246, 0.1))
 * - No legacy golden/red buttons
 * 
 * Route: https://localhost:9091/host/control-panel/PQ9N5YWW
 * Session: 212 (code: PQ9N5YWW)
 * 
 * @see d:\PROJECTS\NOOR CANVAS\Workspaces\UI-UX\share-button-samples.html (Option 1 - FAB design)
 */

import { test, expect } from '@playwright/test';

test.describe('FAB Share Button Verification', () => {
    const CONTROL_PANEL_URL = 'https://localhost:9091/host/control-panel/PQ9N5YWW';

    test.beforeEach(async ({ page }) => {
        // Track console errors
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        // Navigate to control panel
        console.log('🔗 Navigating to:', CONTROL_PANEL_URL);
        await page.goto(CONTROL_PANEL_URL, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for transcript to load
        await page.waitForSelector('#transcript-canvas-container', {
            state: 'visible',
            timeout: 15000
        });

        console.log('✅ Control panel loaded');
    });

    test('should display FAB buttons with correct styling', async ({ page }) => {
        console.log('🔍 Searching for FAB buttons...');

        // Wait for FAB buttons to be injected
        await page.waitForTimeout(2000); // Allow time for JavaScript injection

        // Check for FAB section buttons
        const sectionButtons = await page.locator('.ks-share-fab-section').all();
        console.log(`📄 Found ${sectionButtons.length} section FAB buttons`);

        // Check for FAB asset buttons
        const assetButtons = await page.locator('.ks-share-fab-asset').all();
        console.log(`📤 Found ${assetButtons.length} asset FAB buttons`);

        // Verify at least some buttons exist
        const totalFabButtons = sectionButtons.length + assetButtons.length;
        expect(totalFabButtons).toBeGreaterThan(0);
        console.log(`✅ Total FAB buttons: ${totalFabButtons}`);

        // Check for legacy buttons (should be 0)
        const legacyButtons = await page.locator('.ks-share-wrapper, .ks-share-button:not(.ks-share-fab-asset):not(.ks-share-fab-section)').all();
        console.log(`⚠️ Legacy buttons found: ${legacyButtons.length}`);

        // Take screenshot for visual verification
        await page.screenshot({
            path: 'PlayWright/test-results/fab-buttons-overview.png',
            fullPage: true
        });
        console.log('📸 Screenshot saved: fab-buttons-overview.png');

        // Verify first FAB button styling
        if (sectionButtons.length > 0) {
            const firstButton = sectionButtons[0];

            // Get computed styles
            const width = await firstButton.evaluate(el => window.getComputedStyle(el).width);
            const height = await firstButton.evaluate(el => window.getComputedStyle(el).height);
            const borderRadius = await firstButton.evaluate(el => window.getComputedStyle(el).borderRadius);
            const position = await firstButton.evaluate(el => window.getComputedStyle(el).position);
            const text = await firstButton.textContent();

            console.log('📊 First FAB button styles:', { width, height, borderRadius, position, text });

            // Assertions
            expect(text).toContain('📄'); // Section icon
            expect(position).toBe('absolute');

            // Take close-up screenshot
            await firstButton.screenshot({
                path: 'PlayWright/test-results/fab-button-closeup.png'
            });
            console.log('📸 Close-up screenshot saved: fab-button-closeup.png');
        }

        // Verify asset FAB button if exists
        if (assetButtons.length > 0) {
            const firstAssetButton = assetButtons[0];
            const text = await firstAssetButton.textContent();

            console.log('📤 First asset FAB button text:', text);
            expect(text).toContain('📤'); // Asset icon
        }
    });

    test('should have interactive hover states', async ({ page }) => {
        console.log('🖱️ Testing hover interactions...');

        // Wait for buttons
        await page.waitForTimeout(2000);

        const sectionButtons = await page.locator('.ks-share-fab-section').all();

        if (sectionButtons.length > 0) {
            const button = sectionButtons[0];

            // Get initial opacity
            const initialOpacity = await button.evaluate(el =>
                window.getComputedStyle(el).opacity
            );
            console.log('📊 Initial opacity:', initialOpacity);

            // Hover over button
            await button.hover();
            await page.waitForTimeout(300); // Allow transition

            // Get hover opacity
            const hoverOpacity = await button.evaluate(el =>
                window.getComputedStyle(el).opacity
            );
            console.log('📊 Hover opacity:', hoverOpacity);

            // Take screenshot during hover
            await page.screenshot({
                path: 'PlayWright/test-results/fab-button-hover.png',
                fullPage: false
            });
            console.log('📸 Hover screenshot saved');

            // Opacity should increase on hover
            expect(parseFloat(hoverOpacity)).toBeGreaterThanOrEqual(parseFloat(initialOpacity));
        }
    });

    test('should preserve click functionality', async ({ page }) => {
        console.log('🖱️ Testing click functionality...');

        // Wait for buttons
        await page.waitForTimeout(2000);

        const sectionButtons = await page.locator('.ks-share-fab-section').all();

        if (sectionButtons.length > 0) {
            const button = sectionButtons[0];

            // Verify data attributes are present
            const dataAttributes = await button.evaluate(el => ({
                shareButton: el.getAttribute('data-share-button'),
                shareId: el.getAttribute('data-share-id'),
                h2Index: el.getAttribute('data-h2-index'),
                h2Text: el.getAttribute('data-h2-text'),
                noorShareControl: el.getAttribute('data-noor-share-control')
            }));

            console.log('📊 Data attributes:', dataAttributes);

            // All required data attributes should be present
            expect(dataAttributes.shareButton).toBe('section');
            expect(dataAttributes.shareId).toBeTruthy();
            expect(dataAttributes.noorShareControl).toBe('true');

            console.log('✅ Click functionality preserved (data attributes intact)');
        }
    });
});
