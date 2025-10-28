import { expect, test } from '@playwright/test';

/**
 * Asset Grouping Redesign Validation Tests
 * Feature: hcp Asset Grouping with Kebab Menu and SignalR Integration
 * 
 * Validates:
 * 1. Asset containers with headers and titles
 * 2. Kebab menu visibility and functionality
 * 3. "Share Asset" menu action with SignalR integration
 * 4. "Annotate" menu placeholder
 * 5. Accessibility (ARIA labels, keyboard navigation)
 * 6. Responsive layout and visual grouping
 */

test.describe('Asset Grouping Redesign Validation', () => {
    const HOST_URL = 'https://localhost:9091/host/control-panel/PQ9N5YWW';

    test.beforeEach(async ({ page }) => {
        // Capture console logs for debugging
        page.on('console', (msg) => {
            if (msg.text().includes('ASSET-MENU') || msg.text().includes('ASSETSHARE-DB')) {
                console.log(`🔍 [${msg.type()}]: ${msg.text()}`);
            }
        });
    });

    test('Asset containers should have proper header structure with title and kebab menu', async ({ page }) => {
        console.log('[TEST-HCP-GROUPING] Testing asset container structure');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Find asset group containers
        const assetContainers = page.locator('.asset-group-container[data-noor-asset-group="true"]');
        const containerCount = await assetContainers.count();

        console.log(`[TEST-HCP-GROUPING] Found ${containerCount} asset containers`);

        if (containerCount > 0) {
            const firstContainer = assetContainers.first();

            // Verify header exists
            const header = firstContainer.locator('.asset-header');
            await expect(header).toBeVisible();
            console.log('[TEST-HCP-GROUPING] ✅ Asset header found');

            // Verify title exists
            const title = firstContainer.locator('.asset-title');
            await expect(title).toBeVisible();
            const titleText = await title.textContent();
            console.log(`[TEST-HCP-GROUPING] ✅ Asset title: "${titleText}"`);

            // Verify kebab menu button exists
            const kebabButton = firstContainer.locator('.asset-kebab-menu-btn');
            await expect(kebabButton).toBeVisible();
            console.log('[TEST-HCP-GROUPING] ✅ Kebab menu button found');

            // Verify visual styling
            const containerStyle = await firstContainer.getAttribute('style');
            expect(containerStyle).toContain('border');
            expect(containerStyle).toContain('padding');
            console.log('[TEST-HCP-GROUPING] ✅ Visual grouping styles applied');
        } else {
            console.log('[TEST-HCP-GROUPING] ⚠️ No asset containers found - transcript may be empty');
        }
    });

    test('Kebab menu should toggle visibility and display menu options', async ({ page }) => {
        console.log('[TEST-HCP-GROUPING] Testing kebab menu toggle functionality');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        const assetContainers = page.locator('.asset-group-container[data-noor-asset-group="true"]');
        const containerCount = await assetContainers.count();

        if (containerCount > 0) {
            const firstContainer = assetContainers.first();
            const kebabButton = firstContainer.locator('.asset-kebab-menu-btn');
            const shareId = await firstContainer.getAttribute('data-share-id');
            const menuId = `${shareId}-menu`;
            const menu = page.locator(`#${menuId}`);

            // Initially menu should be hidden
            const initialDisplay = await menu.evaluate((el: HTMLElement) => el.style.display);
            expect(initialDisplay).toBe('none');
            console.log('[TEST-HCP-GROUPING] ✅ Menu initially hidden');

            // Click to open menu
            await kebabButton.click();
            await page.waitForTimeout(500);

            const openDisplay = await menu.evaluate((el: HTMLElement) => el.style.display);
            expect(openDisplay).toBe('block');
            console.log('[TEST-HCP-GROUPING] ✅ Menu opened on click');

            // Verify menu items
            const shareMenuItem = menu.locator('button[data-action="share"]');
            const annotateMenuItem = menu.locator('button[data-action="annotate"]');

            await expect(shareMenuItem).toBeVisible();
            await expect(annotateMenuItem).toBeVisible();

            const shareText = await shareMenuItem.textContent();
            const annotateText = await annotateMenuItem.textContent();

            expect(shareText).toContain('Share Asset');
            expect(annotateText).toContain('Annotate');
            console.log('[TEST-HCP-GROUPING] ✅ Menu items "Share Asset" and "Annotate" visible');

            // Click again to close
            await kebabButton.click();
            await page.waitForTimeout(500);

            const closedDisplay = await menu.evaluate((el: HTMLElement) => el.style.display);
            expect(closedDisplay).toBe('none');
            console.log('[TEST-HCP-GROUPING] ✅ Menu closed on second click');
        } else {
            console.log('[TEST-HCP-GROUPING] ⚠️ Skipping - no asset containers available');
        }
    });

    test('Share Asset menu action should trigger SignalR broadcast', async ({ page }) => {
        console.log('[TEST-HCP-GROUPING] Testing Share Asset SignalR integration');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        const assetContainers = page.locator('.asset-group-container[data-noor-asset-group="true"]');
        const containerCount = await assetContainers.count();

        if (containerCount > 0) {
            const firstContainer = assetContainers.first();
            const shareId = await firstContainer.getAttribute('data-share-id');
            const assetType = await firstContainer.getAttribute('data-asset-type');

            console.log(`[TEST-HCP-GROUPING] Testing share for: shareId=${shareId}, assetType=${assetType}`);

            // Set up promise to track console logs
            let signalRInvoked = false;
            page.on('console', (msg) => {
                if (msg.text().includes('shareAssetViaSignalR') || 
                    msg.text().includes('NOOR-ASSET-SIGNALR')) {
                    signalRInvoked = true;
                    console.log('[TEST-HCP-GROUPING] 📡 SignalR share detected:', msg.text());
                }
            });

            // Open menu
            const kebabButton = firstContainer.locator('.asset-kebab-menu-btn');
            await kebabButton.click();
            await page.waitForTimeout(500);

            // Click Share Asset
            const menuId = `${shareId}-menu`;
            const shareMenuItem = page.locator(`#${menuId} button[data-action="share"]`);
            await shareMenuItem.click();
            await page.waitForTimeout(2000);

            // Verify SignalR was invoked
            expect(signalRInvoked).toBe(true);
            console.log('[TEST-HCP-GROUPING] ✅ SignalR share function invoked');

            // Verify menu closed after action
            const menu = page.locator(`#${menuId}`);
            const menuDisplay = await menu.evaluate((el: HTMLElement) => el.style.display);
            expect(menuDisplay).toBe('none');
            console.log('[TEST-HCP-GROUPING] ✅ Menu closed after share action');
        } else {
            console.log('[TEST-HCP-GROUPING] ⚠️ Skipping - no asset containers available');
        }
    });

    test('Annotate menu action should show placeholder notification', async ({ page }) => {
        console.log('[TEST-HCP-GROUPING] Testing Annotate placeholder functionality');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        const assetContainers = page.locator('.asset-group-container[data-noor-asset-group="true"]');
        const containerCount = await assetContainers.count();

        if (containerCount > 0) {
            const firstContainer = assetContainers.first();
            const shareId = await firstContainer.getAttribute('data-share-id');

            // Track console logs for annotate action
            let annotateTriggered = false;
            page.on('console', (msg) => {
                if (msg.text().includes('Annotate action triggered')) {
                    annotateTriggered = true;
                    console.log('[TEST-HCP-GROUPING] 🎨 Annotate action logged:', msg.text());
                }
            });

            // Open menu and click Annotate
            const kebabButton = firstContainer.locator('.asset-kebab-menu-btn');
            await kebabButton.click();
            await page.waitForTimeout(500);

            const menuId = `${shareId}-menu`;
            const annotateMenuItem = page.locator(`#${menuId} button[data-action="annotate"]`);
            await annotateMenuItem.click();
            await page.waitForTimeout(1000);

            expect(annotateTriggered).toBe(true);
            console.log('[TEST-HCP-GROUPING] ✅ Annotate placeholder executed');
        } else {
            console.log('[TEST-HCP-GROUPING] ⚠️ Skipping - no asset containers available');
        }
    });

    test('Accessibility: ARIA attributes and keyboard navigation', async ({ page }) => {
        console.log('[TEST-HCP-GROUPING] Testing accessibility features');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        const assetContainers = page.locator('.asset-group-container[data-noor-asset-group="true"]');
        const containerCount = await assetContainers.count();

        if (containerCount > 0) {
            const firstContainer = assetContainers.first();
            const kebabButton = firstContainer.locator('.asset-kebab-menu-btn');
            const shareId = await firstContainer.getAttribute('data-share-id');
            const menuId = `${shareId}-menu`;
            const menu = page.locator(`#${menuId}`);

            // Check ARIA attributes on button
            const ariaLabel = await kebabButton.getAttribute('aria-label');
            const ariaHasPopup = await kebabButton.getAttribute('aria-haspopup');
            const ariaExpanded = await kebabButton.getAttribute('aria-expanded');

            expect(ariaLabel).toBe('Asset actions menu');
            expect(ariaHasPopup).toBe('true');
            expect(ariaExpanded).toBe('false');
            console.log('[TEST-HCP-GROUPING] ✅ ARIA attributes on kebab button validated');

            // Check ARIA attributes on menu
            const menuRole = await menu.getAttribute('role');
            const menuOrientation = await menu.getAttribute('aria-orientation');

            expect(menuRole).toBe('menu');
            expect(menuOrientation).toBe('vertical');
            console.log('[TEST-HCP-GROUPING] ✅ ARIA attributes on menu validated');

            // Check menu items
            const shareMenuItem = menu.locator('button[data-action="share"]');
            const shareRole = await shareMenuItem.getAttribute('role');
            const shareAriaLabel = await shareMenuItem.getAttribute('aria-label');

            expect(shareRole).toBe('menuitem');
            expect(shareAriaLabel).toBe('Share asset');
            console.log('[TEST-HCP-GROUPING] ✅ ARIA attributes on menu items validated');

            // Test keyboard navigation - ESC to close menu
            await kebabButton.click();
            await page.waitForTimeout(500);

            // Press ESC
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);

            const menuDisplayAfterEsc = await menu.evaluate((el: HTMLElement) => el.style.display);
            expect(menuDisplayAfterEsc).toBe('none');
            console.log('[TEST-HCP-GROUPING] ✅ ESC key closes menu');

            // Test arrow key navigation
            await kebabButton.click();
            await page.waitForTimeout(500);

            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(300);

            // Check if focus moved
            const focusedElement = await page.evaluate(() => document.activeElement?.className);
            expect(focusedElement).toContain('asset-menu-item');
            console.log('[TEST-HCP-GROUPING] ✅ Arrow key navigation working');
        } else {
            console.log('[TEST-HCP-GROUPING] ⚠️ Skipping - no asset containers available');
        }
    });

    test('Verify old blue Share Asset bar is completely removed', async ({ page }) => {
        console.log('[TEST-HCP-GROUPING] Verifying old blue share bar removal');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Look for old blue share button patterns
        const blueShareButtons = page.locator('.ks-share-button.noor-share-blue, .noor-share-button-wrapper');
        const blueButtonCount = await blueShareButtons.count();

        expect(blueButtonCount).toBe(0);
        console.log('[TEST-HCP-GROUPING] ✅ No old blue share buttons found');

        // Look for new asset containers instead
        const assetContainers = page.locator('.asset-group-container[data-noor-asset-group="true"]');
        const containerCount = await assetContainers.count();

        if (containerCount > 0) {
            console.log(`[TEST-HCP-GROUPING] ✅ Found ${containerCount} new asset containers (no old bars)`);
        }
    });

    test('Responsive layout: Asset containers should remain functional at different screen sizes', async ({ page }) => {
        console.log('[TEST-HCP-GROUPING] Testing responsive layout');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        const assetContainers = page.locator('.asset-group-container[data-noor-asset-group="true"]');
        const containerCount = await assetContainers.count();

        if (containerCount > 0) {
            const viewports = [
                { width: 1920, height: 1080, name: 'Desktop' },
                { width: 768, height: 1024, name: 'Tablet' },
                { width: 375, height: 667, name: 'Mobile' }
            ];

            for (const viewport of viewports) {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                await page.waitForTimeout(500);

                const firstContainer = assetContainers.first();
                const isVisible = await firstContainer.isVisible();
                const kebabButton = firstContainer.locator('.asset-kebab-menu-btn');
                const kebabVisible = await kebabButton.isVisible();

                expect(isVisible).toBe(true);
                expect(kebabVisible).toBe(true);
                console.log(`[TEST-HCP-GROUPING] ✅ ${viewport.name} (${viewport.width}x${viewport.height}): Container and kebab menu visible`);
            }
        } else {
            console.log('[TEST-HCP-GROUPING] ⚠️ Skipping - no asset containers available');
        }
    });
});
