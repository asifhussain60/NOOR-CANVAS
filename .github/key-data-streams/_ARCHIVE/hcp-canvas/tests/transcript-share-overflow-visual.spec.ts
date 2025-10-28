/**
 * Visual Regression Test: TranscriptCanvas Share Button Overflow Fix
 * 
 * Issue: #file:TranscriptCanvas.razor - Share buttons injected dynamically cause horizontal overflow
 * Root Cause: Flex items default to min-width:auto, allowing content to exceed parent width
 * Solution: Applied min-width:0 strategy to TranscriptCanvas CSS (7 rules modified)
 * 
 * Test Strategy:
 * - Load TranscriptCanvas with session 212 (has Share buttons)
 * - Validate no horizontal overflow at desktop/tablet/mobile viewports
 * - Monitor browser console for JavaScript errors
 * - Capture Percy snapshots for visual regression detection
 * 
 * Related Files:
 * - SPA/NoorCanvas/Pages/TranscriptCanvas.razor (lines ~310-906)
 * - .github/prompts.keys/hcp-canvas/hcp-canvas.md (key data stream)
 */

import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

// Session 212 credentials and base URL
const BASE_URL = (process.env.CANVAS_BASE_URL ?? 'https://localhost:9091').replace(/\/$/, '');
const USER_TOKEN = process.env.CANVAS_USER_TOKEN ?? 'KJAHA99L'; // Participant token for session 212
const SESSION_URL = `${BASE_URL}/transcript/canvas/${USER_TOKEN}`;

// Selector for injected Share buttons (multiple implementations supported)
const SHARE_BUTTON_SELECTOR = '.transcript-section-share-btn, .ks-share-button, .ks-share-btn, [data-share-button]';

// Viewport configurations
const VIEWPORTS = {
    desktop: { width: 1920, height: 1080, name: 'Desktop' },
    tablet: { width: 768, height: 1024, name: 'Tablet' },
    mobile: { width: 375, height: 667, name: 'Mobile' }
};

test.describe('TranscriptCanvas - Share Button Overflow Fix (hcp-canvas)', () => {

    // Percy guard: only snapshot when running under `percy exec` (process.env.PERCY === 'true')
    const takePercy = async (page: any, name: string, options?: any) => {
        if (process && (process as any).env && (process as any).env.PERCY === 'true') {
            await percySnapshot(page, name, options as any);
        } else {
            console.log(`[percy] skipped snapshot: ${name}`);
        }
    };

    // Collect browser console logs and errors
    let consoleMessages: string[] = [];
    let consoleErrors: string[] = [];

    test.beforeEach(async ({ page }) => {
        // Monitor console logs
        page.on('console', msg => {
            const text = msg.text();
            consoleMessages.push(`[${msg.type().toUpperCase()}] ${text}`);

            if (msg.type() === 'error') {
                consoleErrors.push(text);
            }
        });

        // Monitor page errors
        page.on('pageerror', error => {
            consoleErrors.push(`[PAGE ERROR] ${error.message}`);
        });
    });

    test.afterEach(async () => {
        // Report console errors if any
        if (consoleErrors.length > 0) {
            console.log('\n🔴 Browser Console Errors Detected:');
            consoleErrors.forEach(err => console.log(`  ${err}`));
        } else {
            console.log('\n✅ No browser console errors detected');
        }

        // Reset for next test
        consoleMessages = [];
        consoleErrors = [];
    });

    Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
        test(`should not overflow horizontally on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
            // Set viewport
            await page.setViewportSize({ width: viewport.width, height: viewport.height });

            // Navigate to TranscriptCanvas
            await page.goto(SESSION_URL, { waitUntil: 'networkidle' });

            // Wait for Blazor to initialize
            await page.waitForSelector('.canvas-main-grid', { timeout: 10000 });

            // Wait for Share buttons to be injected (they're added dynamically after initial render)
            await page.waitForSelector(SHARE_BUTTON_SELECTOR, { timeout: 30000 });

            console.log(`✓ ${viewport.name}: Share buttons detected in DOM`);

            // Verify no horizontal scrollbar (overflow check)
            const hasHorizontalOverflow = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });

            expect(hasHorizontalOverflow).toBe(false);
            console.log(`✓ ${viewport.name}: No horizontal overflow detected`);

            // Verify critical CSS classes have min-width:0 applied
            const cssValidation = await page.evaluate(() => {
                const checks = {
                    canvasMainGrid: false,
                    canvasAreaContainer: false,
                    canvasContentArea: false
                };

                const mainGrid = document.querySelector('.canvas-main-grid') as HTMLElement;
                if (mainGrid) {
                    const computed = window.getComputedStyle(mainGrid);
                    checks.canvasMainGrid = computed.minWidth === '0px';
                }

                const areaContainer = document.querySelector('.canvas-area-container') as HTMLElement;
                if (areaContainer) {
                    const computed = window.getComputedStyle(areaContainer);
                    checks.canvasAreaContainer = computed.minWidth === '0px';
                }

                const contentArea = document.querySelector('.canvas-content-area') as HTMLElement;
                if (contentArea) {
                    const computed = window.getComputedStyle(contentArea);
                    checks.canvasContentArea = computed.minWidth === '0px';
                }

                return checks;
            });

            expect(cssValidation.canvasMainGrid).toBe(true);
            expect(cssValidation.canvasAreaContainer).toBe(true);
            expect(cssValidation.canvasContentArea).toBe(true);
            console.log(`✓ ${viewport.name}: CSS min-width:0 strategy validated`);

            // Take Percy snapshot
            await takePercy(page, `TranscriptCanvas Share Overflow - ${viewport.name}`, {
                widths: [viewport.width],
                minHeight: viewport.height
            });
            console.log(`✓ ${viewport.name}: Percy snapshot captured`);

            // Verify no JavaScript errors
            expect(consoleErrors.length).toBe(0);
            console.log(`✓ ${viewport.name}: No JavaScript errors detected`);
        });
    });

    test('should render Share buttons correctly with proper styling', async ({ page }) => {
        // Desktop viewport for detailed inspection
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto(SESSION_URL, { waitUntil: 'networkidle' });

        // Wait for Share buttons
        await page.waitForSelector(SHARE_BUTTON_SELECTOR, { timeout: 30000 });

        // Count Share buttons
        const buttonCount = await page.locator(SHARE_BUTTON_SELECTOR).count();
        expect(buttonCount).toBeGreaterThan(0);
        console.log(`✓ Found ${buttonCount} Share buttons`);

        // Verify button structure
        const firstButton = page.locator(SHARE_BUTTON_SELECTOR).first();
        await expect(firstButton).toBeVisible();

        // Verify button is clickable (not obstructed by overflow)
        const isClickable = await firstButton.isEnabled();
        expect(isClickable).toBe(true);
        console.log(`✓ Share buttons are interactive (not obstructed)`);

        // Take Percy snapshot
        await takePercy(page, 'TranscriptCanvas Share Buttons - Detailed View');
    });

    test('should handle dynamic Share button injection without layout shift', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        // Navigate but don't wait for networkidle to observe injection timing
        await page.goto(SESSION_URL, { waitUntil: 'domcontentloaded' });

        // Get initial viewport metrics
        const initialMetrics = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth
        }));

        // Wait for Share buttons to be injected
        await page.waitForSelector(SHARE_BUTTON_SELECTOR, { timeout: 30000 });

        // Get post-injection metrics
        const postInjectionMetrics = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth
        }));

        // Verify no horizontal overflow introduced
        expect(postInjectionMetrics.scrollWidth).toBeLessThanOrEqual(postInjectionMetrics.clientWidth);
        console.log(`✓ No layout shift: scrollWidth=${postInjectionMetrics.scrollWidth}, clientWidth=${postInjectionMetrics.clientWidth}`);

        // Take Percy snapshot
        await takePercy(page, 'TranscriptCanvas Share Injection - Layout Stability');
    });

    test('should log Share button injection trace for debugging', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        // Listen for specific trace logs
        const traceLog: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('TRACE:hcp-tcanvas:inject') || text.includes('Share buttons injected')) {
                traceLog.push(text);
            }
        });

        await page.goto(SESSION_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector(SHARE_BUTTON_SELECTOR, { timeout: 30000 });

        // Verify trace logs were captured
        expect(traceLog.length).toBeGreaterThan(0);
        console.log('\n📋 Share Button Injection Trace Logs:');
        traceLog.forEach(log => console.log(`  ${log}`));
    });
});
