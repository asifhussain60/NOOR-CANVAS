import { expect, test } from '@playwright/test';

/**
 * Asset Detection Validation Test for Session 212
 * Tests the restored AssetProcessingService logic against session transcript
 * Expected: 8 total assets detected (7 ayah-card + 1 inserted-hadees)
 * Mode: Headless UI test
 * Key: hcp
 */

test.describe('Asset Detection - Session 212 Validation', () => {

    test.beforeEach(async ({ page }) => {
        // Ignore SSL certificate errors for localhost
        await page.context().setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        });

        // Navigate to host control panel for session 212
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
    });

    test('should detect and inject 8 assets (7 ayah-cards + 1 inserted-hadees) in session 212', async ({ page }) => {
        // Wait for the session to load completely - use first locator to avoid strict mode violation
        await expect(page.locator('text="Need For Messengers"').first()).toBeVisible({ timeout: 15000 });

        // Wait for transcript content to load - use first locator to avoid strict mode violation
        await expect(page.locator('.ks-transcript').first()).toBeVisible({ timeout: 15000 });

        // Wait for asset detection to complete (should happen automatically on session load)
        await page.waitForTimeout(3000);

        // Test 1: Verify ayah-card elements are present in DOM
        const ayahCards = page.locator('.ayah-card');
        await expect(ayahCards).toHaveCount(7, { timeout: 10000 });

        // Test 2: Verify inserted-hadees elements are present in DOM  
        const insertedHadees = page.locator('.inserted-hadees');
        await expect(insertedHadees).toHaveCount(1, { timeout: 10000 });

        // Test 3: Check for share buttons injected by asset detection
        // Share buttons should be injected before each asset element
        const shareButtons = page.locator('[data-share-button="asset"]');
        await expect(shareButtons).toHaveCount(8, { timeout: 10000 });

        // Test 4: Verify share button attributes for ayah-cards
        const ayahShareButtons = page.locator('[data-asset-type="ayah-card"]');
        await expect(ayahShareButtons).toHaveCount(7);

        // Test 5: Verify share button attributes for inserted-hadees
        const hadeesShareButtons = page.locator('[data-asset-type="inserted-hadees"]');
        await expect(hadeesShareButtons).toHaveCount(1);

        // Test 6: Validate share button styling (red background)
        const firstShareButton = shareButtons.first();
        await expect(firstShareButton).toHaveCSS('background-color', /rgb\(220,\s*53,\s*69\)|#dc3545/);

        // Test 7: Verify data-asset-id attributes are set on asset elements
        const assetsWithIds = page.locator('[data-asset-id^="asset-"]');
        await expect(assetsWithIds).toHaveCount(8);

        // Test 8: Test manual asset detection trigger via debug panel
        const debugPanel = page.locator('[data-testid="debug-panel"], .debug-panel');
        if (await debugPanel.isVisible()) {
            // Expand debug panel if collapsed
            const debugToggle = page.locator('[data-testid="debug-toggle"], .debug-toggle, .debug-panel-toggle');
            if (await debugToggle.isVisible()) {
                await debugToggle.click();
            }

            // Click asset detection test button
            const assetTestButton = page.locator('text="Test Asset Detection"');
            if (await assetTestButton.isVisible()) {
                await assetTestButton.click();

                // Wait for popup/alert with results
                await page.waitForTimeout(2000);

                // Check for SweetAlert2 popup or any modal with asset detection results
                const popup = page.locator('.swal2-container, .modal, [role="dialog"]');
                if (await popup.isVisible()) {
                    await expect(popup).toContainText('8');  // Should show 8 total assets
                    await expect(popup).toContainText('ayah-card');
                    await expect(popup).toContainText('inserted-hadees');
                }
            }
        }
    });

    test('should validate AssetLookup API integration', async ({ page }) => {
        // Navigate to API endpoint for asset lookup validation - ignore SSL
        const response = await page.request.get('https://localhost:9091/api/host/asset-lookup', {
            ignoreHTTPSErrors: true
        });
        expect(response.ok()).toBeTruthy();

        const assetLookupData = await response.json();
        expect(assetLookupData.success).toBe(true);
        expect(assetLookupData.assetLookups).toBeDefined();
        expect(assetLookupData.assetLookups.length).toBeGreaterThanOrEqual(8);

        // Verify required asset types are present
        const assetTypes = assetLookupData.assetLookups.map((a: any) => a.assetIdentifier);
        expect(assetTypes).toContain('ayah-card');
        expect(assetTypes).toContain('inserted-hadees');
    });

    test('should validate session 212 transcript content', async ({ page }) => {
        // Test that session 212 has the expected content structure - use first to avoid strict mode violation
        await expect(page.locator('.ks-transcript').first()).toBeVisible({ timeout: 15000 });

        // Verify session name in UI
        await expect(page.locator('text="Need For Messengers"')).toBeVisible();

        // Verify transcript contains Islamic content elements
        const transcriptContent = page.locator('.ks-transcript, .transcript-content');
        await expect(transcriptContent).toContainText('Cattle (6:160)');
        await expect(transcriptContent).toContainText('The Cleaving (82:6)');
    });

    test('should handle asset detection errors gracefully', async ({ page }) => {
        // Monitor console for asset detection errors
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error' && msg.text().includes('asset')) {
                errors.push(msg.text());
            }
        });

        // Trigger asset detection
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW', { waitUntil: 'networkidle' });
        await page.waitForTimeout(5000);

        // Should have no asset-related console errors
        expect(errors.length).toBe(0);
    });

});