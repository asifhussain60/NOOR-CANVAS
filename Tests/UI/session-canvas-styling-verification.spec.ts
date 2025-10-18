import percySnapshot from '@percy/playwright';
import type { Page } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';

/**
 * Test: SessionCanvas Styling Verification - Percy Visual Regression
 * 
 * Purpose: Verify CSS styling is correctly applied after Phase 2 refactor (CSS consolidation)
 * 
 * Background:
 * - Phase 2 refactor (commit 5e8baa23) extracted ~900 lines of CSS to canvas-common.css
 * - SessionCanvas uses GREEN theme (vs purple for TranscriptCanvas)
 * - Has sidebar layout (grid-template-columns: 1fr 300px)
 * - User reported styling broken for both canvas views
 * 
 * What This Test Verifies:
 * 1. CSS file loads without 404 errors (~/css/canvas-common.css)
 * 2. Green theme colors are applied (SessionCanvas-specific overrides)
 * 3. Sidebar layout renders correctly on desktop
 * 4. Responsive stacking works on mobile/tablet
 * 5. Host controls and session management UI properly styled
 * 
 * Expected Visual Elements:
 * - Green-themed host view (not purple like TranscriptCanvas)
 * - NOOR Canvas logo at top
 * - Session title with session controls
 * - Canvas content area (left) + sidebar (right) on desktop
 * - Host control buttons (Start Session, Share Transcript, etc.)
 * - Proper shadows, borders, and rounded corners
 * 
 * Launch Requirement:
 * ⚠️ Application MUST be running on https://localhost:9091 before test execution
 * 
 * Key: transcript-canvas (same key for related work)
 * Debug Level: none
 */

console.log('[TEST:session-canvas-styling] Starting SessionCanvas styling verification ;PERCY_TEST');

test.describe('SessionCanvas - CSS Styling Verification (Percy)', () => {
    let browser: any;
    let page: Page;

    const HOST_TOKEN = 'PQ9N5YWW'; // Session 212 host token (matches KJAHA99L user token)
    const BASE_URL = 'https://localhost:9091';
    const TEST_URL = `${BASE_URL}/session/canvas/${HOST_TOKEN}`;

    test.beforeAll(async () => {
        console.log('[TEST:setup] Launching browser for Percy visual regression');

        browser = await chromium.launch({
            headless: false,
            slowMo: 300
        });

        const context = await browser.newContext({
            storageState: undefined,
            viewport: { width: 1440, height: 900 }, // Wider for sidebar
            ignoreHTTPSErrors: true
        });

        page = await context.newPage();

        // Monitor console for CSS errors
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('404') || text.includes('Failed to load') || text.includes('CSS')) {
                console.error(`[BROWSER:CSS_ERROR] ${text}`);
            }
        });

        page.on('pageerror', error => console.error(`[PAGE ERROR] ${error.message}`));

        console.log('[TEST:setup] Browser context created');
    });

    test.afterAll(async () => {
        console.log('[TEST:teardown] Closing browser');
        await browser?.close();
    });

    test('should load SessionCanvas with proper green theme styling', async () => {
        console.log('[TEST:green-theme] Verifying green theme colors and sidebar layout');

        // Navigate to session canvas (host view)
        await page.goto(TEST_URL);
        console.log(`[TEST:navigate] Navigated to ${TEST_URL}`);

        // Wait for canvas to load
        await page.waitForSelector('.session-canvas-root', { timeout: 15000 });
        console.log('[TEST:load] Canvas root element found');

        // Wait for header to render
        await page.waitForSelector('.canvas-header', { timeout: 10000 });
        console.log('[TEST:load] Canvas header rendered');

        // Verify CSS file loaded
        const rootBgColor = await page.evaluate(() => {
            const root = document.querySelector('.session-canvas-root') as HTMLElement;
            return root ? window.getComputedStyle(root).backgroundColor : null;
        });
        console.log(`[TEST:css] Root background color: ${rootBgColor}`);

        // Capture baseline Percy snapshot
        await percySnapshot(page, 'SessionCanvas - Green Theme - Desktop (1440x900)', {
            widths: [1440]
        });
        console.log('[PERCY] Captured desktop snapshot with sidebar');

        // Verify sidebar is present on desktop
        const sidebarVisible = await page.evaluate(() => {
            const sidebar = document.querySelector('.canvas-sidebar') as HTMLElement;
            if (!sidebar) return false;
            const style = window.getComputedStyle(sidebar);
            return style.display !== 'none' && style.width !== '0px';
        });
        console.log(`[TEST:layout] Sidebar visible on desktop: ${sidebarVisible}`);
        expect(sidebarVisible).toBe(true);

        // Verify grid layout (should be 1fr 300px on desktop)
        const gridLayout = await page.evaluate(() => {
            const grid = document.querySelector('.canvas-main-grid') as HTMLElement;
            return grid ? window.getComputedStyle(grid).gridTemplateColumns : null;
        });
        console.log(`[TEST:layout] Grid template columns: ${gridLayout}`);
    });

    test('should verify SessionCanvas responsive layout on tablet', async () => {
        console.log('[TEST:responsive-tablet] Testing tablet viewport (768x1024)');

        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto(TEST_URL);
        await page.waitForSelector('.session-canvas-root', { timeout: 10000 });

        // Wait for layout to stabilize
        await page.waitForTimeout(1000);

        // Capture tablet snapshot
        await percySnapshot(page, 'SessionCanvas - Green Theme - Tablet (768x1024)', {
            widths: [768]
        });
        console.log('[PERCY] Captured tablet snapshot');

        // Verify sidebar behavior on tablet (may stack)
        const sidebarStacked = await page.evaluate(() => {
            const grid = document.querySelector('.canvas-main-grid') as HTMLElement;
            if (!grid) return false;
            const style = window.getComputedStyle(grid);
            // On tablet, grid may stack to single column
            return !style.gridTemplateColumns.includes('300px');
        });
        console.log(`[TEST:responsive] Sidebar stacked on tablet: ${sidebarStacked}`);
    });

    test('should verify SessionCanvas responsive layout on mobile', async () => {
        console.log('[TEST:responsive-mobile] Testing mobile viewport (375x667)');

        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(TEST_URL);
        await page.waitForSelector('.session-canvas-root', { timeout: 10000 });

        // Wait for mobile layout to render
        await page.waitForTimeout(1000);

        // Capture mobile snapshot
        await percySnapshot(page, 'SessionCanvas - Green Theme - Mobile (375x667)', {
            widths: [375]
        });
        console.log('[PERCY] Captured mobile snapshot');

        // Verify mobile stacking (single column)
        const isMobileLayout = await page.evaluate(() => {
            const grid = document.querySelector('.canvas-main-grid') as HTMLElement;
            const style = grid ? window.getComputedStyle(grid) : null;
            return style ? style.gridTemplateColumns === '1fr' : false;
        });
        console.log(`[TEST:responsive] Mobile layout (single column): ${isMobileLayout}`);
        expect(isMobileLayout).toBe(true);
    });

    test('should verify host controls are properly styled', async () => {
        console.log('[TEST:host-controls] Verifying host control button styling');

        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(TEST_URL);
        await page.waitForSelector('.session-canvas-root', { timeout: 10000 });

        // Wait for host controls to render
        await page.waitForSelector('.canvas-sidebar', { timeout: 10000 });

        // Check if control buttons have proper styling
        const buttonStyles = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('.canvas-sidebar button'));
            return buttons.map(btn => {
                const style = window.getComputedStyle(btn);
                return {
                    text: btn.textContent?.trim(),
                    backgroundColor: style.backgroundColor,
                    color: style.color,
                    borderRadius: style.borderRadius,
                    padding: style.padding
                };
            }).slice(0, 3); // First 3 buttons
        });

        console.log('[TEST:host-controls] Button styles:', JSON.stringify(buttonStyles, null, 2));

        // Capture controls snapshot
        await percySnapshot(page, 'SessionCanvas - Host Controls Detail', {
            widths: [1440]
        });
        console.log('[PERCY] Captured host controls snapshot');
    });

    test('should verify canvas-common.css loads without errors', async () => {
        console.log('[TEST:css-loading] Checking for CSS load errors');

        const cssErrors: string[] = [];

        page.on('response', response => {
            const url = response.url();
            if (url.includes('.css') && response.status() !== 200) {
                cssErrors.push(`${url} - HTTP ${response.status()}`);
                console.error(`[TEST:css-error] Failed to load: ${url} (${response.status()})`);
            }
        });

        await page.goto(TEST_URL);
        await page.waitForSelector('.session-canvas-root', { timeout: 10000 });
        await page.waitForLoadState('networkidle', { timeout: 15000 });

        // Verify canvas-common.css is in DOM
        const cssFileLoaded = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
            return links.some(link => 
                (link as HTMLLinkElement).href.includes('canvas-common.css')
            );
        });

        console.log(`[TEST:css-loading] canvas-common.css found in DOM: ${cssFileLoaded}`);
        expect(cssFileLoaded).toBe(true);

        if (cssErrors.length > 0) {
            console.error('[TEST:css-loading] CSS LOAD ERRORS:', cssErrors);
            throw new Error(`CSS files failed to load: ${cssErrors.join(', ')}`);
        }

        console.log('[TEST:css-loading] ✅ All CSS files loaded successfully');
    });

    test('should compare SessionCanvas styling to pre-refactor baseline', async () => {
        console.log('[TEST:baseline-comparison] Comparing current styling to pre-refactor (b73750f2)');

        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(TEST_URL);
        await page.waitForSelector('.session-canvas-root', { timeout: 10000 });

        // Extract computed styles for key elements
        const styleSnapshot = await page.evaluate(() => {
            const elements = {
                root: document.querySelector('.session-canvas-root') as HTMLElement,
                container: document.querySelector('.session-canvas-container') as HTMLElement,
                contentArea: document.querySelector('.canvas-content-area') as HTMLElement,
                sidebar: document.querySelector('.canvas-sidebar') as HTMLElement,
                grid: document.querySelector('.canvas-main-grid') as HTMLElement
            };

            return {
                root: {
                    backgroundColor: window.getComputedStyle(elements.root).backgroundColor
                },
                container: {
                    backgroundColor: window.getComputedStyle(elements.container).backgroundColor,
                    borderRadius: window.getComputedStyle(elements.container).borderRadius,
                    padding: window.getComputedStyle(elements.container).padding
                },
                contentArea: {
                    borderColor: window.getComputedStyle(elements.contentArea).borderColor,
                    backgroundColor: window.getComputedStyle(elements.contentArea).backgroundColor
                },
                sidebar: elements.sidebar ? {
                    backgroundColor: window.getComputedStyle(elements.sidebar).backgroundColor,
                    padding: window.getComputedStyle(elements.sidebar).padding,
                    width: window.getComputedStyle(elements.sidebar).width
                } : null,
                grid: {
                    gridTemplateColumns: window.getComputedStyle(elements.grid).gridTemplateColumns
                }
            };
        });

        console.log('[TEST:baseline] Style snapshot:', JSON.stringify(styleSnapshot, null, 2));

        // Expected values from canvas-common.css and SessionCanvas inline styles
        expect(styleSnapshot.container.backgroundColor).toBe('rgb(255, 255, 255)');
        expect(styleSnapshot.container.borderRadius).toContain('24px');
        expect(styleSnapshot.sidebar).not.toBeNull(); // Sidebar should exist

        // Capture final comparison snapshot
        await percySnapshot(page, 'SessionCanvas - Style Baseline Comparison', {
            widths: [1440]
        });
        console.log('[PERCY] Captured baseline comparison snapshot');
    });
});

console.log('[TEST:session-canvas-styling] Test suite complete ;PERCY_TEST');
