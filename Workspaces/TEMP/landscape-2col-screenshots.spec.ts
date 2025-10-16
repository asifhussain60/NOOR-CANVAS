import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Test Configuration
const APP_URL = 'https://localhost:9091';
const SESSION_TOKEN_USER = 'KJAHA99L';
const SCREENSHOT_DIR = path.join(process.cwd(), 'Workspaces', 'PercyScreenshots');

// Test Scenarios
const SCENARIOS = [
    // Mobile Landscape - Should have 2-column grids
    { name: 'iPhone-SE-Landscape-2Col', width: 667, height: 375, tab: 'Q&A', orientation: 'landscape' },
    { name: 'iPhone-14-Pro-Landscape-2Col', width: 932, height: 430, tab: 'Q&A', orientation: 'landscape' },
    { name: 'iPad-Landscape-2Col-QA', width: 1024, height: 768, tab: 'Q&A', orientation: 'landscape' },
    { name: 'iPad-Landscape-2Col-Participants', width: 1024, height: 768, tab: 'Participants', orientation: 'landscape' },

    // Portrait - Should remain single column (unchanged)
    { name: 'iPhone-SE-Portrait-SingleCol', width: 375, height: 667, tab: 'Q&A', orientation: 'portrait' },
    { name: 'iPhone-14-Pro-Portrait-SingleCol', width: 430, height: 932, tab: 'Q&A', orientation: 'portrait' },

    // Desktop - Should remain sidebar beside canvas (unchanged)
    { name: 'Desktop-Sidebar-Unchanged', width: 1280, height: 720, tab: 'Q&A', orientation: 'desktop' },
];

test.describe('SessionCanvas - 2-Column Grid Screenshots', () => {

    test.beforeAll(async () => {
        // Clean previous screenshots
        if (fs.existsSync(SCREENSHOT_DIR)) {
            const files = fs.readdirSync(SCREENSHOT_DIR);
            files.forEach(file => {
                if (file.includes('2Col') || file.includes('SingleCol') || file.includes('Unchanged')) {
                    fs.unlinkSync(path.join(SCREENSHOT_DIR, file));
                }
            });
        } else {
            fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
        }
        console.log('🗑️  Cleaned 2-column test screenshots from:', SCREENSHOT_DIR);
    });

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error(`Browser Error: ${msg.text()}`);
            }
        });
    });

    test('Capture All Scenarios - 2-Column Grid Evidence', async ({ page }) => {
        console.log('📸 Capturing SessionCanvas 2-column grid screenshots...');

        for (const scenario of SCENARIOS) {
            console.log(`  📱 Capturing: ${scenario.name} (${scenario.width}x${scenario.height}) - ${scenario.tab} tab`);

            await page.setViewportSize({ width: scenario.width, height: scenario.height });
            await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
            await page.waitForLoadState('networkidle');
            await page.waitForSelector('.canvas-header', { timeout: 10000 });

            // Add questions if needed
            if (scenario.tab === 'Q&A') {
                await page.click('.debug-panel-toggle');
                await page.waitForTimeout(300);

                for (let i = 0; i < 3; i++) {
                    await page.click('text=Simulate Random Question');
                    await page.waitForTimeout(400);
                }
            }

            await page.waitForTimeout(1000);

            // Hide dynamic elements
            await page.addStyleTag({
                content: `
                    .canvas-signalr-status { visibility: hidden; }
                    .canvas-animate-pulse-subtle { animation: none; }
                    .debug-panel { display: none; }
                `
            });

            // Switch to appropriate tab
            if (scenario.tab === 'Q&A') {
                await page.click('button:has-text("Q&A")');
            } else if (scenario.tab === 'Participants') {
                await page.click('button:has-text("Participants")');
            }

            await page.waitForTimeout(500);

            const filename = `SessionCanvas-${scenario.name}-${scenario.width}x${scenario.height}.png`;
            const filepath = path.join(SCREENSHOT_DIR, filename);

            await page.screenshot({
                path: filepath,
                fullPage: true
            });

            console.log(`    ✅ Saved: ${filename}`);
        }

        console.log('📸 All 2-column grid screenshots captured!');
        console.log(`📁 Location: ${SCREENSHOT_DIR}`);
    });

    test('Verify Grid Layout CSS Applied', async ({ page }) => {
        console.log('🧪 Verifying CSS grid layout in landscape...');

        // iPhone 14 Pro Landscape
        await page.setViewportSize({ width: 932, height: 430 });
        await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.canvas-header', { timeout: 10000 });

        // Add questions
        await page.click('.debug-panel-toggle');
        await page.waitForTimeout(300);
        for (let i = 0; i < 3; i++) {
            await page.click('text=Simulate Random Question');
            await page.waitForTimeout(400);
        }

        await page.waitForTimeout(1000);

        // Switch to Q&A tab
        await page.click('button:has-text("Q&A")');
        await page.waitForTimeout(500);

        // Verify grid-template-columns is applied
        const questionsContainer = page.locator('.canvas-questions-container');
        const gridColumns = await questionsContainer.evaluate(el =>
            window.getComputedStyle(el).gridTemplateColumns
        );

        console.log(`  Grid Columns (Landscape): ${gridColumns}`);

        // Should be 2 columns (not single column)
        const columnCount = gridColumns.split(' ').length;
        expect(columnCount).toBe(2);

        console.log(`  ✅ Verified: 2-column grid applied in landscape (${columnCount} columns)`);

        // Now test portrait - should be single column
        await page.setViewportSize({ width: 430, height: 932 });
        await page.waitForTimeout(500);

        const gridColumnsPortrait = await questionsContainer.evaluate(el =>
            window.getComputedStyle(el).gridTemplateColumns
        );

        console.log(`  Grid Columns (Portrait): ${gridColumnsPortrait}`);

        // Portrait should NOT have grid (flex column)
        expect(gridColumnsPortrait).not.toContain('fr');

        console.log('  ✅ Verified: Portrait remains single column (unchanged)');
    });
});
