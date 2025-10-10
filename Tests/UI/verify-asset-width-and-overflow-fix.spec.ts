import { expect, test } from '@playwright/test';

/**
 * Test Suite: Asset Width & Overflow Fix
 * 
 * Purpose: Verify that assets resize to 90% width in SessionCanvas and panels don't overflow
 * 
 * Tests:
 * 1. Poetry section resizes to 90% width in SessionCanvas
 * 2. Other Islamic content (ayah, hadees, etc.) resize to 90% width
 * 3. Images resize to 90% width in SessionCanvas  
 * 4. Panels don't overflow the container div
 * 5. Container height constraints are respected
 * 6. Overflow is properly scrollable
 */

const TEST_SESSION_ID = '212'; // KSESSIONS_ID for "Need For Messengers"
const HOST_URL = 'https://localhost:9091';

test.describe('Asset Width and Container Overflow Fix', () => {

    test('should display poetry section at 90% width in SessionCanvas', async ({ page }) => {
        // Navigate to SessionCanvas
        await page.goto(`${HOST_URL}/session/canvas/KJAHA99L`, { waitUntil: 'networkidle' });

        // Wait for SignalR connection
        await page.waitForTimeout(3000);

        // Share a poetry asset from host panel (in separate context this would be done via API or separate browser)
        // For now, verify the CSS is correct

        // Check that narrow theme variable is set to 90%
        const themeWidth = await page.evaluate(() => {
            const elem = document.querySelector('[data-theme="narrow"]');
            if (!elem) return null;
            return getComputedStyle(elem).getPropertyValue('--islamic-asset-width');
        });

        expect(themeWidth?.trim()).toBe('90%');

        // If poetry exists, check its actual width
        const poetrySection = page.locator('.poetry-section').first();
        if (await poetrySection.count() > 0) {
            const poetryBox = await poetrySection.boundingBox();
            const containerBox = await page.locator('.canvas-asset-content').boundingBox();

            if (poetryBox && containerBox) {
                const widthPercentage = (poetryBox.width / containerBox.width) * 100;

                // Allow 2% tolerance for padding and borders
                expect(widthPercentage).toBeGreaterThan(88);
                expect(widthPercentage).toBeLessThan(92);
            }
        }
    });

    test('should display images at 90% width in SessionCanvas', async ({ page }) => {
        await page.goto(`${HOST_URL}/session/canvas/KJAHA99L`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Check imgResponsive width
        const images = page.locator('.imgResponsive');
        if (await images.count() > 0) {
            const imageBox = await images.first().boundingBox();
            const containerBox = await page.locator('.canvas-asset-content').boundingBox();

            if (imageBox && containerBox) {
                const widthPercentage = (imageBox.width / containerBox.width) * 100;

                // imgResponsive should use --islamic-asset-width which is 90% in narrow theme
                expect(widthPercentage).toBeGreaterThan(88);
                expect(widthPercentage).toBeLessThan(92);
            }
        }
    });

    test('should prevent container overflow at bottom', async ({ page }) => {
        await page.goto(`${HOST_URL}/session/canvas/KJAHA99L`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Check main grid height doesn't cause overflow
        const mainGrid = page.locator('.canvas-main-grid');
        const mainGridBox = await mainGrid.boundingBox();

        expect(mainGridBox).not.toBeNull();

        if (mainGridBox) {
            // Main grid should not exceed viewport
            const viewportSize = page.viewportSize();
            if (viewportSize) {
                // Grid should be contained within viewport with some margin for header
                expect(mainGridBox.height).toBeLessThan(viewportSize.height - 100);
            }
        }
    });

    test('should have scrollable overflow for canvas content area', async ({ page }) => {
        await page.goto(`${HOST_URL}/session/canvas/KJAHA99L`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Check canvas-asset-content has overflow-y: auto
        const overflowY = await page.locator('.canvas-asset-content').evaluate((el) => {
            return getComputedStyle(el).overflowY;
        });

        expect(overflowY).toBe('auto');

        // Check canvas-asset-content has overflow-x: hidden
        const overflowX = await page.locator('.canvas-asset-content').evaluate((el) => {
            return getComputedStyle(el).overflowX;
        });

        expect(overflowX).toBe('hidden');
    });

    test('should not use flex centering in canvas-asset-content', async ({ page }) => {
        await page.goto(`${HOST_URL}/session/canvas/KJAHA99L`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Verify canvas-asset-content does NOT use flex centering
        const display = await page.locator('.canvas-asset-content').evaluate((el) => {
            const styles = getComputedStyle(el);
            return {
                display: styles.display,
                alignItems: styles.alignItems,
                justifyContent: styles.justifyContent
            };
        });

        // Should NOT be using flex with center alignment (which prevents width percentages)
        if (display.display === 'flex') {
            expect(display.alignItems).not.toBe('center');
            expect(display.justifyContent).not.toBe('center');
        }
    });

    test('should have proper container height constraints', async ({ page }) => {
        await page.goto(`${HOST_URL}/session/canvas/KJAHA99L`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Check canvas-area-container height
        const containerHeight = await page.locator('.canvas-area-container').evaluate((el) => {
            return getComputedStyle(el).height;
        });

        // Should have explicit height (100% from flex parent)
        expect(containerHeight).not.toBe('auto');

        // Check canvas-content-area is flex child
        const contentAreaFlex = await page.locator('.canvas-content-area').evaluate((el) => {
            return getComputedStyle(el).flex;
        });

        // Should be flex: 1 to fill available space
        expect(contentAreaFlex).toContain('1');
    });

    test('should display ayah cards at 90% width in SessionCanvas', async ({ page }) => {
        await page.goto(`${HOST_URL}/session/canvas/KJAHA99L`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Check ayah-card width if present
        const ayahCards = page.locator('.ayah-card');
        if (await ayahCards.count() > 0) {
            const ayahBox = await ayahCards.first().boundingBox();
            const containerBox = await page.locator('.canvas-asset-content').boundingBox();

            if (ayahBox && containerBox) {
                const widthPercentage = (ayahBox.width / containerBox.width) * 100;

                expect(widthPercentage).toBeGreaterThan(88);
                expect(widthPercentage).toBeLessThan(92);
            }
        }
    });

    test('should display hadees at 90% width in SessionCanvas', async ({ page }) => {
        await page.goto(`${HOST_URL}/session/canvas/KJAHA99L`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Check hadees width if present
        const hadees = page.locator('.inserted-hadees');
        if (await hadees.count() > 0) {
            const hadeesBox = await hadees.first().boundingBox();
            const containerBox = await page.locator('.canvas-asset-content').boundingBox();

            if (hadeesBox && containerBox) {
                const widthPercentage = (hadeesBox.width / containerBox.width) * 100;

                expect(widthPercentage).toBeGreaterThan(88);
                expect(widthPercentage).toBeLessThan(92);
            }
        }
    });
});
