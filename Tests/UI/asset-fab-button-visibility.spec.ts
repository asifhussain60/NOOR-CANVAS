/**
 * ⚠️ DEPRECATED - 2025-11-02
 * 
 * REASON: Uses fragile text-based selectors instead of component IDs
 * REPLACEMENT: hcp-fab-button-verification.spec.ts (uses ID-based selectors)
 * 
 * MIGRATION NOTES:
 * - Replace text selectors with ID selectors
 * - button:has-text("Transcript Canvas") → #reg-transcript-canvas-btn
 * - button:has-text("Start Session") → #sidebar-start-session-btn
 * 
 * See: KDS/knowledge/learnings/SELF-REVIEW-fab-button-test-restoration.md
 * See: KDS/prompts/user/kds.md (Component ID-Based Selectors section)
 * 
 * Test suite for asset FAB button visibility
 * Tests that individual assets have visible FAB share buttons injected via JavaScript
 * 
 * Expected behavior:
 * - Each asset should have data-asset-id attribute set by detectAssetsInDOM()
 * - A FAB share button should be injected above each asset by injectAssetShareButtons()
 * - Asset should be wrapped in .asset-fab-wrapper div
 * - Button should have class 'asset-fab-button' and data-share-button="asset"
 * - Button should be clickable and trigger ShareAsset via NoorShareSystem
 */

import { expect, test } from '@playwright/test';

test.describe('Asset FAB Button Visibility', () => {
    const BASE_URL = 'https://localhost:9091';
    const HOST_TOKEN = 'PQ9N5YWW'; // Session 212 host token

    test.beforeEach(async ({ page }) => {
        // Navigate to Host Control Panel for Session 212
        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Wait for transcript content to be rendered
        await page.waitForSelector('#content-transcript-container', { timeout: 10000 });

        // Small delay for JavaScript to execute asset detection and button injection
        await page.waitForTimeout(2000);
    });

    test('should have assets with data-asset-id attributes', async ({ page }) => {
        // Check that assets were detected and marked
        const assets = page.locator('[data-asset-id]');
        const assetCount = await assets.count();

        console.log(`Found ${assetCount} assets with data-asset-id`);
        expect(assetCount).toBeGreaterThan(0);

        // Verify asset ID format (should be like 'asset-ayah-card-1')
        const firstAssetId = await assets.first().getAttribute('data-asset-id');
        expect(firstAssetId).toMatch(/^asset-\w+-\d+$/);
    });

    test('should inject FAB share buttons for each asset', async ({ page }) => {
        // Get all assets
        const assets = page.locator('[data-asset-id]');
        const assetCount = await assets.count();

        // Get all FAB buttons with data-share-button="asset"
        const fabButtons = page.locator('button[data-share-button="asset"]');
        const buttonCount = await fabButtons.count();

        console.log(`Assets: ${assetCount}, FAB Buttons: ${buttonCount}`);

        // Should have a button for each asset
        expect(buttonCount).toBe(assetCount);
    });

    test('should wrap assets in .asset-fab-wrapper containers', async ({ page }) => {
        // Get all asset wrappers
        const wrappers = page.locator('.asset-fab-wrapper');
        const wrapperCount = await wrappers.count();

        expect(wrapperCount).toBeGreaterThan(0);

        // Each wrapper should contain exactly one asset with data-asset-id
        const firstWrapper = wrappers.first();
        const assetsInWrapper = firstWrapper.locator('[data-asset-id]');
        await expect(assetsInWrapper).toHaveCount(1);

        // Each wrapper should contain exactly one FAB button
        const buttonsInWrapper = firstWrapper.locator('button[data-share-button="asset"]');
        await expect(buttonsInWrapper).toHaveCount(1);
    });

    test('should have correct FAB button attributes', async ({ page }) => {
        // Get first asset
        const firstAsset = page.locator('[data-asset-id]').first();
        const assetId = await firstAsset.getAttribute('data-asset-id');

        // Find its FAB button by matching data-asset-id
        const fabButton = page.locator(`button[data-asset-id="${assetId}"][data-share-button="asset"]`);

        // Button should exist and be visible
        await expect(fabButton).toBeVisible();

        // Button should have class 'ks-share-btn'
        await expect(fabButton).toHaveClass(/ks-share-btn/);

        // Button should have class 'asset-fab-button'
        await expect(fabButton).toHaveClass(/asset-fab-button/);

        // Button should have data-asset-type attribute
        const assetType = await fabButton.getAttribute('data-asset-type');
        expect(assetType).toBeTruthy();

        // Button should have data-instance-number attribute
        const instanceNumber = await fabButton.getAttribute('data-instance-number');
        expect(instanceNumber).toBeTruthy();
        expect(parseInt(instanceNumber || '0')).toBeGreaterThan(0);
    });

    test('should have unique button IDs for each asset', async ({ page }) => {
        // Get all FAB buttons
        const fabButtons = page.locator('button[data-share-button="asset"]');
        const buttonCount = await fabButtons.count();

        expect(buttonCount).toBeGreaterThan(0);

        // Check that all button IDs are unique
        const buttonIds: string[] = [];
        for (let i = 0; i < buttonCount; i++) {
            const buttonId = await fabButtons.nth(i).getAttribute('id');
            expect(buttonId).toBeTruthy();
            expect(buttonId).toMatch(/^share-btn-asset-/); // Should start with 'share-btn-asset-'
            expect(buttonIds).not.toContain(buttonId);
            buttonIds.push(buttonId!);
        }

        console.log(`Verified ${buttonIds.length} unique button IDs`);
    });

    test('FAB buttons should be positioned above asset containers', async ({ page }) => {
        // Get first wrapper
        const firstWrapper = page.locator('.asset-fab-wrapper').first();
        await expect(firstWrapper).toBeVisible();

        const fabButton = firstWrapper.locator('button[data-share-button="asset"]');
        const asset = firstWrapper.locator('[data-asset-id]');

        // Both should be visible
        await expect(fabButton).toBeVisible();
        await expect(asset).toBeVisible();

        // Get bounding boxes
        const buttonBox = await fabButton.boundingBox();
        const assetBox = await asset.boundingBox();

        expect(buttonBox).toBeTruthy();
        expect(assetBox).toBeTruthy();

        // Button should be above asset (button.bottom <= asset.top)
        // FAB is positioned with 'top: -45px' so it should be above the asset
        expect(buttonBox!.y).toBeLessThan(assetBox!.y);
    });

    test('FAB buttons should have SHARE text and icon', async ({ page }) => {
        // Get first FAB button
        const firstButton = page.locator('button[data-share-button="asset"]').first();
        await expect(firstButton).toBeVisible();

        // Should contain "SHARE" text
        await expect(firstButton).toContainText('SHARE');

        // Should contain FontAwesome share icon
        const icon = firstButton.locator('i.fa-share, i.fa-solid.fa-share');
        await expect(icon).toBeVisible();
    });

    test('should detect specific asset types correctly', async ({ page }) => {
        // Check for ayah-card assets
        const ayahButtons = page.locator('button[data-asset-type="ayah-card"]');
        const ayahCount = await ayahButtons.count();

        if (ayahCount > 0) {
            console.log(`Found ${ayahCount} ayah-card FAB buttons`);
            const firstAyahButton = ayahButtons.first();
            await expect(firstAyahButton).toBeVisible();

            const assetId = await firstAyahButton.getAttribute('data-asset-id');
            expect(assetId).toContain('ayah-card');
        }

        // Check for any assets - at least one type should exist
        const allButtons = page.locator('button[data-share-button="asset"]');
        const totalCount = await allButtons.count();
        expect(totalCount).toBeGreaterThan(0);
    });
});
