import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';
const VALID_SESSION_TOKEN = 'KJAHA99L'; // Session 212
const VALID_TRANSCRIPT_TOKEN = 'KJAHA99L'; // Session 212 (transcript mode)

test.describe('Canvas Portrait Orientation Blocking', () => {
    // Browser console log tracking
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];

    test.beforeEach(async ({ page }) => {
        // Track console messages
        page.on('console', msg => {
            const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
            consoleMessages.push(text);
            if (msg.type() === 'error' || msg.type() === 'warning') {
                consoleErrors.push(text);
            }
        });

        // Track page errors
        page.on('pageerror', error => {
            const text = `[PAGE ERROR] ${error.message}`;
            consoleErrors.push(text);
        });
    });

    test.afterEach(async ({ }, testInfo) => {
        // Log console errors if test failed
        if (testInfo.status !== 'passed' && consoleErrors.length > 0) {
            console.log('\n❌ Browser Console Errors:');
            consoleErrors.forEach(err => console.log(`  ${err}`));
        }

        // Clear for next test
        consoleMessages.length = 0;
        consoleErrors.length = 0;
    });

    test.describe('SessionCanvas - Portrait Blocking', () => {

        test('iPhone SE Portrait (375×667) - Overlay Visible, Content Hidden', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000); // Wait for CSS transitions

            // Debug: Check if overlay element exists in DOM
            const overlayExists = await page.locator('.canvas-portrait-overlay').count();
            console.log(`[DEBUG] Overlay elements found: ${overlayExists}`);

            // Debug: Get computed styles
            const overlayDisplay = await page.locator('.canvas-portrait-overlay').evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    display: styles.display,
                    position: styles.position,
                    zIndex: styles.zIndex,
                    width: styles.width,
                    height: styles.height,
                    visibility: styles.visibility,
                    opacity: styles.opacity
                };
            });
            console.log('[DEBUG] Overlay computed styles:', JSON.stringify(overlayDisplay, null, 2));

            // Debug: Check media query
            const mediaQuery = await page.evaluate(() => {
                const mq = window.matchMedia('(max-width: 1024px) and (orientation: portrait)');
                return {
                    matches: mq.matches,
                    media: mq.media,
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight,
                        orientation: window.innerWidth < window.innerHeight ? 'portrait' : 'landscape'
                    }
                };
            });
            console.log('[DEBUG] Media query status:', JSON.stringify(mediaQuery, null, 2));

            // Verify overlay is visible
            const overlay = page.locator('.canvas-portrait-overlay');
            await expect(overlay).toBeVisible();

            // Verify canvas content is hidden
            const canvasContainer = page.locator('.session-canvas-container');
            const isVisible = await canvasContainer.isVisible();
            expect(isVisible).toBe(false);

            // Verify message content
            await expect(page.locator('.canvas-portrait-heading')).toContainText('Landscape Mode Required');
            await expect(page.locator('.canvas-portrait-text')).toContainText('Please rotate your device');

            // Verify icon is present
            const icon = page.locator('.canvas-portrait-icon');
            await expect(icon).toBeVisible();

            await percySnapshot(page, 'SessionCanvas - iPhone SE Portrait - Blocked', {
                widths: [375]
            });
        });

        test('iPhone SE Landscape (667×375) - Overlay Hidden, Content Visible', async ({ page }) => {
            await page.setViewportSize({ width: 667, height: 375 });
            await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Verify overlay is hidden
            const overlay = page.locator('.canvas-portrait-overlay');
            const isVisible = await overlay.isVisible();
            expect(isVisible).toBe(false);

            // Verify canvas content is visible
            const canvasContainer = page.locator('.session-canvas-container');
            await expect(canvasContainer).toBeVisible();

            // Verify canvas header is visible
            const header = page.locator('.canvas-header');
            await expect(header).toBeVisible();

            await percySnapshot(page, 'SessionCanvas - iPhone SE Landscape - Working', {
                widths: [667]
            });
        });

        test('iPhone 14 Pro Portrait (390×844) - Overlay Visible', async ({ page }) => {
            await page.setViewportSize({ width: 390, height: 844 });
            await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const overlay = page.locator('.canvas-portrait-overlay');
            await expect(overlay).toBeVisible();

            const canvasContainer = page.locator('.session-canvas-container');
            const isVisible = await canvasContainer.isVisible();
            expect(isVisible).toBe(false);

            await percySnapshot(page, 'SessionCanvas - iPhone 14 Pro Portrait - Blocked', {
                widths: [390]
            });
        });

        test('iPhone 14 Pro Landscape (844×390) - Overlay Hidden', async ({ page }) => {
            await page.setViewportSize({ width: 844, height: 390 });
            await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const overlay = page.locator('.canvas-portrait-overlay');
            const isVisible = await overlay.isVisible();
            expect(isVisible).toBe(false);

            const canvasContainer = page.locator('.session-canvas-container');
            await expect(canvasContainer).toBeVisible();

            await percySnapshot(page, 'SessionCanvas - iPhone 14 Pro Landscape - Working', {
                widths: [844]
            });
        });

        test('iPad Portrait (768×1024) - Overlay Visible', async ({ page }) => {
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const overlay = page.locator('.canvas-portrait-overlay');
            await expect(overlay).toBeVisible();

            const canvasContainer = page.locator('.session-canvas-container');
            const isVisible = await canvasContainer.isVisible();
            expect(isVisible).toBe(false);

            await percySnapshot(page, 'SessionCanvas - iPad Portrait - Blocked', {
                widths: [768]
            });
        });

        test('iPad Landscape (1024×768) - Overlay Hidden', async ({ page }) => {
            await page.setViewportSize({ width: 1024, height: 768 });
            await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const overlay = page.locator('.canvas-portrait-overlay');
            const isVisible = await overlay.isVisible();
            expect(isVisible).toBe(false);

            const canvasContainer = page.locator('.session-canvas-container');
            await expect(canvasContainer).toBeVisible();

            await percySnapshot(page, 'SessionCanvas - iPad Landscape - Working', {
                widths: [1024]
            });
        });

        test('Desktop (1280×720) - Overlay Never Appears', async ({ page }) => {
            await page.setViewportSize({ width: 1280, height: 720 });
            await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Verify overlay never appears on desktop
            const overlay = page.locator('.canvas-portrait-overlay');
            const isVisible = await overlay.isVisible();
            expect(isVisible).toBe(false);

            // Verify canvas content is always visible
            const canvasContainer = page.locator('.session-canvas-container');
            await expect(canvasContainer).toBeVisible();

            await percySnapshot(page, 'SessionCanvas - Desktop - Unaffected', {
                widths: [1280]
            });
        });

        test('Desktop Large (1920×1080) - Overlay Never Appears', async ({ page }) => {
            await page.setViewportSize({ width: 1920, height: 1080 });
            await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const overlay = page.locator('.canvas-portrait-overlay');
            const isVisible = await overlay.isVisible();
            expect(isVisible).toBe(false);

            const canvasContainer = page.locator('.session-canvas-container');
            await expect(canvasContainer).toBeVisible();

            await percySnapshot(page, 'SessionCanvas - Desktop Large - Unaffected', {
                widths: [1920]
            });
        });
    });

    test.describe('TranscriptCanvas - Portrait Blocking', () => {

        test('iPhone SE Portrait (375×667) - Overlay Visible, Content Hidden', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto(`${BASE_URL}/transcript/canvas/${VALID_TRANSCRIPT_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const overlay = page.locator('.canvas-portrait-overlay');
            await expect(overlay).toBeVisible();

            const canvasContainer = page.locator('.session-canvas-container');
            const isVisible = await canvasContainer.isVisible();
            expect(isVisible).toBe(false);

            await expect(page.locator('.canvas-portrait-heading')).toContainText('Landscape Mode Required');

            await percySnapshot(page, 'TranscriptCanvas - iPhone SE Portrait - Blocked', {
                widths: [375]
            });
        });

        test('iPhone SE Landscape (667×375) - Overlay Hidden, Content Visible', async ({ page }) => {
            await page.setViewportSize({ width: 667, height: 375 });
            await page.goto(`${BASE_URL}/transcript/canvas/${VALID_TRANSCRIPT_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const overlay = page.locator('.canvas-portrait-overlay');
            const isVisible = await overlay.isVisible();
            expect(isVisible).toBe(false);

            const canvasContainer = page.locator('.session-canvas-container');
            await expect(canvasContainer).toBeVisible();

            await percySnapshot(page, 'TranscriptCanvas - iPhone SE Landscape - Working', {
                widths: [667]
            });
        });

        test('iPad Portrait (768×1024) - Overlay Visible', async ({ page }) => {
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto(`${BASE_URL}/transcript/canvas/${VALID_TRANSCRIPT_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const overlay = page.locator('.canvas-portrait-overlay');
            await expect(overlay).toBeVisible();

            await percySnapshot(page, 'TranscriptCanvas - iPad Portrait - Blocked', {
                widths: [768]
            });
        });

        test('iPad Landscape (1024×768) - Overlay Hidden', async ({ page }) => {
            await page.setViewportSize({ width: 1024, height: 768 });
            await page.goto(`${BASE_URL}/transcript/canvas/${VALID_TRANSCRIPT_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const overlay = page.locator('.canvas-portrait-overlay');
            const isVisible = await overlay.isVisible();
            expect(isVisible).toBe(false);

            await percySnapshot(page, 'TranscriptCanvas - iPad Landscape - Working', {
                widths: [1024]
            });
        });

        test('Desktop (1280×720) - Overlay Never Appears', async ({ page }) => {
            await page.setViewportSize({ width: 1280, height: 720 });
            await page.goto(`${BASE_URL}/transcript/canvas/${VALID_TRANSCRIPT_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const overlay = page.locator('.canvas-portrait-overlay');
            const isVisible = await overlay.isVisible();
            expect(isVisible).toBe(false);

            const canvasContainer = page.locator('.session-canvas-container');
            await expect(canvasContainer).toBeVisible();

            await percySnapshot(page, 'TranscriptCanvas - Desktop - Unaffected', {
                widths: [1280]
            });
        });
    });

    test.describe('Edge Cases & Boundary Testing', () => {

        test('Exact Breakpoint - 1024×768 (Landscape at boundary) - Should Work', async ({ page }) => {
            await page.setViewportSize({ width: 1024, height: 768 });
            await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // At exactly 1024px width in landscape, overlay should be hidden
            const overlay = page.locator('.canvas-portrait-overlay');
            const isVisible = await overlay.isVisible();
            expect(isVisible).toBe(false);

            const canvasContainer = page.locator('.session-canvas-container');
            await expect(canvasContainer).toBeVisible();
        });

        test('Exact Breakpoint - 768×1024 (Portrait at boundary) - Should Block', async ({ page }) => {
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // At exactly 768px width in portrait, overlay should be visible
            const overlay = page.locator('.canvas-portrait-overlay');
            await expect(overlay).toBeVisible();
        });

        test('Just Above Breakpoint - 1025×800 (Desktop) - Should Work', async ({ page }) => {
            await page.setViewportSize({ width: 1025, height: 800 });
            await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Above 1024px, orientation doesn't matter
            const overlay = page.locator('.canvas-portrait-overlay');
            const isVisible = await overlay.isVisible();
            expect(isVisible).toBe(false);
        });
    });
});
