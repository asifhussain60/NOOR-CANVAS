import percySnapshot from '@percy/playwright';
import { test } from '@playwright/test';

// Test Configuration
const APP_URL = 'https://localhost:9091';
const SESSION_TOKEN_USER = 'KJAHA99L'; // Session 212 user token

// Device Configurations - Portrait & Landscape
const DEVICE_CONFIGS = {
    // Mobile Landscape (should have 2-column grids)
    mobileLandscape: [
        { name: 'iPhone SE Landscape', width: 667, height: 375 },
        { name: 'iPhone 14 Pro Landscape', width: 932, height: 430 },
    ],
    // Tablet Landscape (should have 2-column grids)
    tabletLandscape: [
        { name: 'iPad Landscape', width: 1024, height: 768 },
    ],
    // Portrait (should NOT be affected - single column)
    portrait: [
        { name: 'iPhone SE Portrait', width: 375, height: 667 },
        { name: 'iPhone 14 Pro Portrait', width: 430, height: 932 },
    ],
    // Desktop (should NOT be affected - sidebar beside canvas)
    desktop: [
        { name: 'Desktop', width: 1280, height: 720 },
    ]
};

test.describe('SessionCanvas - 2-Column Grid in Landscape (Visual Regression)', () => {

    test.beforeEach(async ({ page }) => {
        // Suppress console noise
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error(`Browser Error: ${msg.text()}`);
            }
        });
    });

    test('Mobile Landscape - 2-Column Q&A Grid (Percy)', async ({ page }) => {
        console.log('🧪 Testing mobile landscape 2-column Q&A grid...');

        // iPhone 14 Pro Landscape
        await page.setViewportSize({ width: 932, height: 430 });

        await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.canvas-header', { timeout: 10000 });

        // Add some questions via debug panel
        await page.click('.debug-panel-toggle');
        await page.waitForTimeout(300);

        for (let i = 0; i < 3; i++) {
            await page.click('text=Simulate Random Question');
            await page.waitForTimeout(500);
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

        // Switch to Q&A tab
        await page.click('button:has-text("Q&A")');
        await page.waitForTimeout(500);

        // Capture across landscape widths
        await percySnapshot(page, 'SessionCanvas - Landscape 2-Column Q&A Grid', {
            widths: [667, 932, 1024],
            minHeight: 375
        });

        console.log('📸 Captured: Landscape 2-column Q&A grid');
    });

    test('Mobile Landscape - 2-Column Participants Grid (Percy)', async ({ page }) => {
        console.log('🧪 Testing mobile landscape 2-column participants grid...');

        // iPhone 14 Pro Landscape
        await page.setViewportSize({ width: 932, height: 430 });

        await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.canvas-header', { timeout: 10000 });
        await page.waitForTimeout(1000);

        // Hide dynamic elements
        await page.addStyleTag({
            content: `
                .canvas-signalr-status { visibility: hidden; }
                .debug-panel { display: none; }
            `
        });

        // Switch to Participants tab
        await page.click('button:has-text("Participants")');
        await page.waitForTimeout(500);

        // Capture across landscape widths
        await percySnapshot(page, 'SessionCanvas - Landscape 2-Column Participants Grid', {
            widths: [667, 932, 1024],
            minHeight: 375
        });

        console.log('📸 Captured: Landscape 2-column participants grid');
    });

    test('Portrait View - Single Column Q&A (Percy - Should NOT Change)', async ({ page }) => {
        console.log('🧪 Verifying portrait view unchanged (single column)...');

        // iPhone 14 Pro Portrait
        await page.setViewportSize({ width: 430, height: 932 });

        await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.canvas-header', { timeout: 10000 });

        // Add some questions
        await page.click('.debug-panel-toggle');
        await page.waitForTimeout(300);

        for (let i = 0; i < 3; i++) {
            await page.click('text=Simulate Random Question');
            await page.waitForTimeout(500);
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

        // Switch to Q&A tab
        await page.click('button:has-text("Q&A")');
        await page.waitForTimeout(500);

        // Capture portrait view
        await percySnapshot(page, 'SessionCanvas - Portrait Single Column Q&A (Unchanged)', {
            widths: [375, 430],
            minHeight: 667
        });

        console.log('📸 Captured: Portrait single-column Q&A (should be unchanged)');
    });

    test('Desktop View - Sidebar Beside Canvas (Percy - Should NOT Change)', async ({ page }) => {
        console.log('🧪 Verifying desktop view unchanged (sidebar beside canvas)...');

        // Desktop
        await page.setViewportSize({ width: 1280, height: 720 });

        await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.canvas-header', { timeout: 10000 });

        // Add some questions
        await page.click('.debug-panel-toggle');
        await page.waitForTimeout(300);

        for (let i = 0; i < 2; i++) {
            await page.click('text=Simulate Random Question');
            await page.waitForTimeout(500);
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

        // Capture desktop view
        await percySnapshot(page, 'SessionCanvas - Desktop Sidebar Layout (Unchanged)', {
            widths: [1280],
            minHeight: 720
        });

        console.log('📸 Captured: Desktop sidebar layout (should be unchanged)');
    });
});
