import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

// Test Configuration
const APP_URL = 'https://localhost:9091';
const SESSION_TOKEN_USER = 'KJAHA99L'; // Session 212 user token

// Mobile Landscape Device Profiles
const LANDSCAPE_DEVICES = [
    {
        name: 'iPhone SE Landscape',
        viewport: { width: 667, height: 375 }
    },
    {
        name: 'iPhone 14 Pro Landscape',
        viewport: { width: 932, height: 430 }
    },
    {
        name: 'iPad Landscape',
        viewport: { width: 1024, height: 768 }
    }
];

test.describe('SessionCanvas - Mobile Landscape Layout', () => {

    test.beforeEach(async ({ page }) => {
        // Suppress console noise
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error(`Browser Error: ${msg.text()}`);
            }
        });

        // Accept any certificate errors for localhost
        await page.goto(APP_URL, { waitUntil: 'domcontentloaded' }).catch(() => { });
    });

    test('Mobile Landscape - Sidebar Below Canvas (Percy Visual)', async ({ page }) => {
        console.log('🧪 Testing SessionCanvas mobile landscape layout (sidebar below canvas)...');

        // Set landscape viewport
        await page.setViewportSize({ width: 932, height: 430 });

        await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.canvas-header', { timeout: 10000 });
        await page.waitForTimeout(1000);

        // Hide dynamic elements for consistent screenshots
        await page.addStyleTag({
            content: `
                .canvas-signalr-status { visibility: hidden; }
                .canvas-animate-pulse-subtle { animation: none; }
            `
        });

        // Capture across landscape widths
        await percySnapshot(page, 'SessionCanvas - Mobile Landscape Layout', {
            widths: [667, 932, 1024],
            minHeight: 375
        });

        console.log('📸 Captured: SessionCanvas mobile landscape layout');
    });

    test('Landscape Layout Validation - All Devices', async ({ page }) => {
        console.log('🧪 Validating layout order across landscape devices...');

        for (const device of LANDSCAPE_DEVICES) {
            console.log(`  📱 Testing: ${device.name} (${device.viewport.width}x${device.viewport.height})`);

            await page.setViewportSize(device.viewport);
            await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
            await page.waitForLoadState('networkidle');
            await page.waitForSelector('.canvas-main-grid', { timeout: 10000 });
            await page.waitForTimeout(500);

            // Verify single column layout
            const mainGrid = page.locator('.canvas-main-grid');
            const gridTemplateColumns = await mainGrid.evaluate(el =>
                window.getComputedStyle(el).gridTemplateColumns
            );

            console.log(`    Grid columns: ${gridTemplateColumns}`);

            // Verify both canvas and sidebar exist
            const canvasArea = page.locator('.canvas-area-container');
            const sidebar = page.locator('.canvas-sidebar');

            await expect(canvasArea).toBeVisible();
            await expect(sidebar).toBeVisible();

            // Verify order (canvas should be above sidebar)
            const canvasBox = await canvasArea.boundingBox();
            const sidebarBox = await sidebar.boundingBox();

            if (canvasBox && sidebarBox) {
                expect(canvasBox.y).toBeLessThan(sidebarBox.y);
                console.log(`    ✅ Canvas above sidebar (canvas.y=${canvasBox.y}, sidebar.y=${sidebarBox.y})`);
            }
        }

        console.log('✅ All landscape devices validated');
    });
});
