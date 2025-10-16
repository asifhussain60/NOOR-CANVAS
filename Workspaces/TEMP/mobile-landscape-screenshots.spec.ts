import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Test Configuration
const APP_URL = 'https://localhost:9091';
const SESSION_TOKEN_USER = 'KJAHA99L';
const SCREENSHOT_DIR = path.join(process.cwd(), 'Workspaces', 'PercyScreenshots');

// Mobile Landscape Viewports
const LANDSCAPE_VIEWPORTS = [
    { name: 'iPhone-SE-Landscape', width: 667, height: 375 },
    { name: 'iPhone-14-Pro-Landscape', width: 932, height: 430 },
    { name: 'iPad-Landscape', width: 1024, height: 768 }
];

test.describe('SessionCanvas - Mobile Landscape Screenshots', () => {

    test.beforeAll(async () => {
        // Clean screenshot directory
        if (fs.existsSync(SCREENSHOT_DIR)) {
            const files = fs.readdirSync(SCREENSHOT_DIR);
            files.forEach(file => {
                if (file.includes('landscape')) {
                    fs.unlinkSync(path.join(SCREENSHOT_DIR, file));
                }
            });
        } else {
            fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
        }
        console.log('🗑️  Cleaned landscape screenshots from:', SCREENSHOT_DIR);
    });

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error(`Browser Error: ${msg.text()}`);
            }
        });
    });

    test('Capture Landscape Layout Screenshots', async ({ page }) => {
        console.log('📸 Capturing SessionCanvas landscape screenshots...');

        for (const viewport of LANDSCAPE_VIEWPORTS) {
            console.log(`  📱 Capturing: ${viewport.name} (${viewport.width}x${viewport.height})`);

            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
            await page.waitForLoadState('networkidle');
            await page.waitForSelector('.canvas-header', { timeout: 10000 });
            await page.waitForTimeout(1000);

            // Hide dynamic elements
            await page.addStyleTag({
                content: `
                    .canvas-signalr-status { visibility: hidden; }
                    .canvas-animate-pulse-subtle { animation: none; }
                `
            });

            const filename = `SessionCanvas-${viewport.name}-${viewport.width}x${viewport.height}.png`;
            const filepath = path.join(SCREENSHOT_DIR, filename);

            await page.screenshot({
                path: filepath,
                fullPage: true
            });

            console.log(`    ✅ Saved: ${filename}`);
        }

        console.log('📸 All landscape screenshots captured!');
        console.log(`📁 Location: ${SCREENSHOT_DIR}`);
    });
});
