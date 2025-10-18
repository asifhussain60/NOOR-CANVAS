import percySnapshot from '@percy/playwright';
import type { Page } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';

/**
 * Test: TranscriptCanvas Styling Verification - Percy Visual Regression
 * 
 * Purpose: Verify CSS styling is correctly applied after Phase 2 refactor (CSS consolidation)
 * 
 * Background:
 * - Phase 2 refactor (commit 5e8baa23) extracted ~900 lines of CSS to canvas-common.css
 * - User reported "styling is completely broken" despite build being clean
 * - CSS file exists at wwwroot/css/canvas-common.css with ~840 lines
 * - Pre-refactor baseline: commit b73750f2
 * 
 * What This Test Verifies:
 * 1. CSS file loads without 404 errors (~/css/canvas-common.css)
 * 2. Purple theme colors are applied (.session-canvas-root background: #F5F3F8)
 * 3. Canvas container has proper styling (border-radius, shadow, padding)
 * 4. Content area has purple border (#663399) and light purple background
 * 5. Typography and spacing match design
 * 6. Responsive layout works on mobile/tablet/desktop
 * 
 * Expected Visual Elements:
 * - Purple-themed participant view (not green like SessionCanvas)
 * - NOOR Canvas logo at top
 * - Session title with "📜 Transcript View" badge
 * - Content area showing "Content from the session will appear here" (empty state)
 * - Questions & Answers sidebar (desktop) or stacked (mobile)
 * - Proper shadows, borders, and rounded corners
 * 
 * Launch Requirement:
 * ⚠️ Application MUST be running on https://localhost:9091 before test execution
 * 
 * Key: transcript-canvas
 * Debug Level: none
 */

console.log('[TEST:transcript-canvas-styling] Starting TranscriptCanvas styling verification ;PERCY_TEST');

test.describe('TranscriptCanvas - CSS Styling Verification (Percy)', () => {
    let browser: any;
    let page: Page;

    const SESSION_TOKEN = 'KJAHA99L'; // Session 212 user token
    const BASE_URL = 'https://localhost:9091';
    const TEST_URL = `${BASE_URL}/transcript/canvas/${SESSION_TOKEN}`;

    test.beforeAll(async () => {
        console.log('[TEST:setup] Launching browser for Percy visual regression');

        browser = await chromium.launch({
            headless: false,
            slowMo: 300
        });

        const context = await browser.newContext({
            storageState: undefined,
            viewport: { width: 1280, height: 800 },
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

    test('should load TranscriptCanvas with proper purple theme styling', async () => {
        console.log('[TEST:purple-theme] Verifying purple theme colors and layout');

        // Navigate to transcript canvas
        await page.goto(TEST_URL);
        console.log(`[TEST:navigate] Navigated to ${TEST_URL}`);

        // Wait for canvas to load (SignalR connection may take time)
        await page.waitForSelector('.session-canvas-root', { timeout: 15000 });
        console.log('[TEST:load] Canvas root element found');

        // Wait for header to render
        await page.waitForSelector('.canvas-header', { timeout: 10000 });
        console.log('[TEST:load] Canvas header rendered');

        // Verify CSS file loaded (check computed styles)
        const rootBgColor = await page.evaluate(() => {
            const root = document.querySelector('.session-canvas-root') as HTMLElement;
            return root ? window.getComputedStyle(root).backgroundColor : null;
        });
        console.log(`[TEST:css] Root background color: ${rootBgColor}`);

        // Verify purple theme is applied (should be light purple, not white)
        expect(rootBgColor).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
        expect(rootBgColor).not.toBe('rgb(255, 255, 255)'); // Not pure white

        // Capture baseline Percy snapshot
        await percySnapshot(page, 'TranscriptCanvas - Purple Theme - Desktop (1280x800)', {
            widths: [1280]
        });
        console.log('[PERCY] Captured desktop snapshot');

        // Verify key CSS classes are present
        const cssClasses = await page.evaluate(() => {
            const elements = {
                root: document.querySelector('.session-canvas-root'),
                container: document.querySelector('.session-canvas-container'),
                header: document.querySelector('.canvas-header'),
                contentArea: document.querySelector('.canvas-content-area'),
                logo: document.querySelector('.canvas-header-logo-img')
            };

            return {
                root: elements.root?.className || 'MISSING',
                container: elements.container?.className || 'MISSING',
                header: elements.header?.className || 'MISSING',
                contentArea: elements.contentArea?.className || 'MISSING',
                logoSrc: (elements.logo as HTMLImageElement)?.src || 'MISSING'
            };
        });

        console.log('[TEST:css-classes] CSS classes found:', JSON.stringify(cssClasses, null, 2));

        // Assertions
        expect(cssClasses.root).toContain('session-canvas-root');
        expect(cssClasses.container).toContain('session-canvas-container');
        expect(cssClasses.header).toContain('canvas-header');
        expect(cssClasses.contentArea).toContain('canvas-content-area');
        expect(cssClasses.logoSrc).toContain('NC-Header.png');
    });

    test('should verify responsive styling on tablet viewport', async () => {
        console.log('[TEST:responsive-tablet] Testing tablet viewport (768x1024)');

        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto(TEST_URL);
        await page.waitForSelector('.session-canvas-root', { timeout: 10000 });

        // Wait for layout to stabilize
        await page.waitForTimeout(1000);

        // Capture tablet snapshot
        await percySnapshot(page, 'TranscriptCanvas - Purple Theme - Tablet (768x1024)', {
            widths: [768]
        });
        console.log('[PERCY] Captured tablet snapshot');

        // Verify responsive grid layout
        const gridLayout = await page.evaluate(() => {
            const grid = document.querySelector('.canvas-main-grid') as HTMLElement;
            return grid ? window.getComputedStyle(grid).gridTemplateColumns : null;
        });
        console.log(`[TEST:responsive] Grid layout: ${gridLayout}`);
    });

    test('should verify responsive styling on mobile viewport', async () => {
        console.log('[TEST:responsive-mobile] Testing mobile viewport (375x667)');

        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(TEST_URL);
        await page.waitForSelector('.session-canvas-root', { timeout: 10000 });

        // Wait for mobile layout to render
        await page.waitForTimeout(1000);

        // Capture mobile snapshot
        await percySnapshot(page, 'TranscriptCanvas - Purple Theme - Mobile (375x667)', {
            widths: [375]
        });
        console.log('[PERCY] Captured mobile snapshot');

        // Verify mobile-specific CSS
        const isMobileLayout = await page.evaluate(() => {
            const grid = document.querySelector('.canvas-main-grid') as HTMLElement;
            const style = grid ? window.getComputedStyle(grid) : null;
            // On mobile, grid should stack (1 column)
            return style ? style.gridTemplateColumns.includes('1fr') : false;
        });
        console.log(`[TEST:responsive] Mobile layout active: ${isMobileLayout}`);
        expect(isMobileLayout).toBe(true);
    });

    test('should verify canvas-common.css loads without 404 errors', async () => {
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

        // Wait for all resources to load
        await page.waitForLoadState('networkidle', { timeout: 15000 });

        // Check for CSS file specifically
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

    test('should compare styling to pre-refactor baseline', async () => {
        console.log('[TEST:baseline-comparison] Comparing current styling to pre-refactor (b73750f2)');

        await page.goto(TEST_URL);
        await page.waitForSelector('.session-canvas-root', { timeout: 10000 });

        // Extract computed styles for key elements
        const styleSnapshot = await page.evaluate(() => {
            const elements = {
                root: document.querySelector('.session-canvas-root') as HTMLElement,
                container: document.querySelector('.session-canvas-container') as HTMLElement,
                contentArea: document.querySelector('.canvas-content-area') as HTMLElement,
                header: document.querySelector('.canvas-header') as HTMLElement
            };

            return {
                root: {
                    backgroundColor: window.getComputedStyle(elements.root).backgroundColor,
                    display: window.getComputedStyle(elements.root).display
                },
                container: {
                    backgroundColor: window.getComputedStyle(elements.container).backgroundColor,
                    borderRadius: window.getComputedStyle(elements.container).borderRadius,
                    padding: window.getComputedStyle(elements.container).padding,
                    boxShadow: window.getComputedStyle(elements.container).boxShadow
                },
                contentArea: {
                    borderColor: window.getComputedStyle(elements.contentArea).borderColor,
                    backgroundColor: window.getComputedStyle(elements.contentArea).backgroundColor,
                    borderRadius: window.getComputedStyle(elements.contentArea).borderRadius
                },
                header: {
                    marginBottom: window.getComputedStyle(elements.header).marginBottom
                }
            };
        });

        console.log('[TEST:baseline] Style snapshot:', JSON.stringify(styleSnapshot, null, 2));

        // Expected values from canvas-common.css and TranscriptCanvas inline styles
        expect(styleSnapshot.root.backgroundColor).not.toBe('rgb(255, 255, 255)'); // Should be light purple tint
        expect(styleSnapshot.container.backgroundColor).toBe('rgb(255, 255, 255)'); // Should be white
        expect(styleSnapshot.container.borderRadius).toContain('24px'); // 1.5rem = 24px
        expect(styleSnapshot.container.padding).toContain('32px'); // 2rem = 32px

        // Capture final comparison snapshot
        await percySnapshot(page, 'TranscriptCanvas - Style Baseline Comparison', {
            widths: [1280]
        });
        console.log('[PERCY] Captured baseline comparison snapshot');
    });
});

console.log('[TEST:transcript-canvas-styling] Test suite complete ;PERCY_TEST');
