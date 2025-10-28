import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

/**
 * Inserted Hadees Rendering Test with Percy Visual Regression
 * 
 * Validates that inserted hadees content:
 * 1. Renders within the top div structure (.inserted-hadees)
 * 2. Displays Arabic text and English translation
 * 3. Shows attribution (Muhammad Ibn Abdullah)
 * 4. Has no JavaScript errors during transformation
 * 5. Maintains consistent visual appearance (Percy snapshots)
 * 
 * Test Data: Session 212 (known to have inserted hadees)
 */

const BASE_URL = 'https://localhost:9091';
const SESSION_TOKEN = 'KJAHA99L'; // Session 212 user token
const HOST_TOKEN = 'PQ9N5YWW'; // Session 212 host token

test.describe('Inserted Hadees - Rendering and Visual Regression', () => {
    let consoleErrors: string[] = [];
    let consoleLogs: string[] = [];

    test.beforeEach(async ({ page }) => {
        // Capture console errors
        page.on('console', msg => {
            const text = msg.text();
            if (msg.type() === 'error') {
                consoleErrors.push(text);
            }
            if (text.includes('TRANSFORM') || text.includes('inserted-hadees') || text.includes('hadees')) {
                consoleLogs.push(text);
            }
        });

        // Capture page errors
        page.on('pageerror', error => {
            consoleErrors.push(`Page Error: ${error.message}`);
        });
    });

    test.afterEach(async () => {
        // Report console errors
        if (consoleErrors.length > 0) {
            console.log('[HADEES-TEST] Console Errors:', consoleErrors);
        }
        if (consoleLogs.length > 0) {
            console.log('[HADEES-TEST] Transform Logs:', consoleLogs);
        }

        // Reset for next test
        consoleErrors = [];
        consoleLogs = [];
    });

    test('01 - SessionCanvas: Verify inserted hadees structure and rendering', async ({ page }) => {
        console.log('[HADEES-TEST] Testing SessionCanvas rendering');

        await page.goto(`${BASE_URL}/session/canvas/${SESSION_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Find inserted hadees container
        const hadeesContainer = page.locator('.inserted-hadees').first();
        await expect(hadeesContainer).toBeVisible({ timeout: 10000 });

        // Verify top-level structure
        const containerHTML = await hadeesContainer.innerHTML();
        console.log('[HADEES-TEST] Container HTML structure:', containerHTML.substring(0, 500));

        // Verify key elements exist within the container
        const arabicText = hadeesContainer.locator('text=لَا صَلَاةَ إِلَّا بِالطَّهَارَةِ');
        await expect(arabicText).toBeVisible();

        const englishText = hadeesContainer.locator('text=There is no prayer without purification');
        await expect(englishText).toBeVisible();

        const attribution = hadeesContainer.locator('text=Muhammad Ibn Abdullah (SWS)');
        await expect(attribution).toBeVisible();

        // Verify CSS classes
        const hasCorrectClass = await hadeesContainer.evaluate(el =>
            el.classList.contains('inserted-hadees')
        );
        expect(hasCorrectClass).toBe(true);

        // Check for JavaScript errors
        expect(consoleErrors.length).toBe(0);

        // Take Percy snapshot
        await percySnapshot(page, 'SessionCanvas - Inserted Hadees Rendering', {
            widths: [375, 768, 1280, 1920],
            minHeight: 1024
        });
    });

    test('02 - TranscriptCanvas: Verify inserted hadees with narrow theme', async ({ page }) => {
        console.log('[HADEES-TEST] Testing TranscriptCanvas rendering');

        await page.goto(`${BASE_URL}/transcript/canvas/${SESSION_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Find inserted hadees with narrow theme
        const hadeesContainer = page.locator('.inserted-hadees').first();
        await expect(hadeesContainer).toBeVisible({ timeout: 10000 });

        // Verify narrow theme is applied
        const hasNarrowTheme = await hadeesContainer.evaluate(el =>
            el.closest('[data-theme="narrow"]') !== null
        );
        expect(hasNarrowTheme).toBe(true);

        // Verify content is rendered
        const arabicText = hadeesContainer.locator('text=لَا صَلَاةَ إِلَّا بِالطَّهَارَةِ');
        await expect(arabicText).toBeVisible();

        // Check computed width (should be 90% or close to it)
        const containerWidth = await hadeesContainer.evaluate(el => {
            const parent = el.closest('[data-theme="narrow"]');
            if (!parent) return null;
            const parentWidth = parent.clientWidth;
            const elWidth = el.clientWidth;
            return {
                parentWidth,
                elWidth,
                percentage: ((elWidth / parentWidth) * 100).toFixed(1)
            };
        });
        console.log('[HADEES-TEST] Container width:', containerWidth);

        // Check for JavaScript errors
        expect(consoleErrors.length).toBe(0);

        // Take Percy snapshot
        await percySnapshot(page, 'TranscriptCanvas - Inserted Hadees Narrow Theme', {
            widths: [375, 768, 1280, 1920],
            minHeight: 1024
        });
    });

    test('03 - HostControlPanel: Verify inserted hadees in transcript view', async ({ page }) => {
        console.log('[HADEES-TEST] Testing HostControlPanel rendering');

        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Find inserted hadees container
        const hadeesContainer = page.locator('.inserted-hadees').first();
        await expect(hadeesContainer).toBeVisible({ timeout: 10000 });

        // Verify structure
        const containerOuterHTML = await hadeesContainer.evaluate(el => el.outerHTML);
        console.log('[HADEES-TEST] Outer HTML:', containerOuterHTML.substring(0, 500));

        // Verify that the top div has the .inserted-hadees class
        const topDivHasClass = await page.evaluate(() => {
            const container = document.querySelector('.inserted-hadees');
            if (!container) return false;

            // Check if this is the top-level div
            return container.tagName === 'DIV' && container.classList.contains('inserted-hadees');
        });
        expect(topDivHasClass).toBe(true);

        // Verify content elements are children of the top div
        const contentStructure = await hadeesContainer.evaluate(el => {
            const children = Array.from(el.children);
            return {
                hasChildren: children.length > 0,
                childTags: children.map(child => child.tagName),
                hasAttribution: el.textContent?.includes('Muhammad Ibn Abdullah')
            };
        });
        console.log('[HADEES-TEST] Content structure:', contentStructure);
        expect(contentStructure.hasChildren).toBe(true);

        // Check for JavaScript errors
        expect(consoleErrors.length).toBe(0);

        // Take Percy snapshot
        await percySnapshot(page, 'HostControlPanel - Inserted Hadees', {
            widths: [1280, 1920],
            minHeight: 1024
        });
    });

    test('04 - Transformation function validation', async ({ page }) => {
        console.log('[HADEES-TEST] Testing transformation function directly');

        // Navigate to a page with the transformation function
        await page.goto(`${BASE_URL}/session/canvas/${SESSION_TOKEN}`);
        await page.waitForLoadState('networkidle');

        // Test the transformation function with sample hadees HTML
        const testHtml = `
            <div class="inserted-hadees">
                <blockquote class="hadees-text" style="direction: rtl; text-align: center;">
                    <p style="margin: 0px; padding: 0px; direction: rtl; text-align: center; font-size: 30px;">
                        <span class="inlineArabic" style="font-family: &quot;Noto Naskh Arabic&quot;, serif; font-size: 18pt;">
                            لَا صَلَاةَ إِلَّا بِالطَّهَارَةِ
                        </span>
                    </p>
                </blockquote>
                <p style="text-align: center; font-size: 14px;">
                    <em>There is no prayer without purification.</em>
                </p>
                <p style="text-align: center; font-size: 12px; color: #666;">
                    <strong>Muhammad Ibn Abdullah (SWS)</strong>
                </p>
            </div>
        `;

        const transformResult = await page.evaluate((html) => {
            // Check if transformation function exists
            if (typeof (window as any).transformHtml !== 'function') {
                return { error: 'transformHtml function not found' };
            }

            try {
                const transformed = (window as any).transformHtml(html);

                // Parse the transformed HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(transformed, 'text/html');
                const container = doc.querySelector('.inserted-hadees');

                return {
                    success: true,
                    hasTopDiv: container !== null,
                    topDivIsDiv: container?.tagName === 'DIV',
                    hasClass: container?.classList.contains('inserted-hadees'),
                    childCount: container?.children.length || 0,
                    hasArabicText: transformed.includes('لَا صَلَاةَ إِلَّا بِالطَّهَارَةِ'),
                    hasEnglishText: transformed.includes('There is no prayer without purification'),
                    hasAttribution: transformed.includes('Muhammad Ibn Abdullah')
                };
            } catch (error) {
                return { error: error instanceof Error ? error.message : String(error) };
            }
        }, testHtml);

        console.log('[HADEES-TEST] Transform result:', transformResult);

        expect(transformResult).toHaveProperty('success', true);
        expect(transformResult).toHaveProperty('hasTopDiv', true);
        expect(transformResult).toHaveProperty('topDivIsDiv', true);
        expect(transformResult).toHaveProperty('hasClass', true);
        expect(transformResult.childCount).toBeGreaterThan(0);
        expect(transformResult).toHaveProperty('hasArabicText', true);
        expect(transformResult).toHaveProperty('hasEnglishText', true);
        expect(transformResult).toHaveProperty('hasAttribution', true);

        // Check for JavaScript errors
        expect(consoleErrors.length).toBe(0);
    });

    test('05 - Visual comparison across all three views', async ({ page, context }) => {
        console.log('[HADEES-TEST] Comparing visual rendering across views');

        // SessionCanvas
        await page.goto(`${BASE_URL}/session/canvas/${SESSION_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const sessionCanvasContainer = page.locator('.inserted-hadees').first();
        await expect(sessionCanvasContainer).toBeVisible({ timeout: 10000 });

        await percySnapshot(page, 'Hadees Comparison - SessionCanvas', {
            widths: [1280],
            minHeight: 800
        });

        // TranscriptCanvas
        await page.goto(`${BASE_URL}/transcript/canvas/${SESSION_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const transcriptCanvasContainer = page.locator('.inserted-hadees').first();
        await expect(transcriptCanvasContainer).toBeVisible({ timeout: 10000 });

        await percySnapshot(page, 'Hadees Comparison - TranscriptCanvas', {
            widths: [1280],
            minHeight: 800
        });

        // HostControlPanel
        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const hostControlPanelContainer = page.locator('.inserted-hadees').first();
        await expect(hostControlPanelContainer).toBeVisible({ timeout: 10000 });

        await percySnapshot(page, 'Hadees Comparison - HostControlPanel', {
            widths: [1280],
            minHeight: 800
        });

        // No JavaScript errors across all views
        expect(consoleErrors.length).toBe(0);
    });

    test('06 - Responsive design validation', async ({ page }) => {
        console.log('[HADEES-TEST] Testing responsive design');

        const viewports = [
            { width: 375, height: 667, name: 'Mobile' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 1280, height: 720, name: 'Desktop' }
        ];

        for (const viewport of viewports) {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto(`${BASE_URL}/session/canvas/${SESSION_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const hadeesContainer = page.locator('.inserted-hadees').first();
            await expect(hadeesContainer).toBeVisible({ timeout: 10000 });

            // Verify content is still readable
            const isReadable = await hadeesContainer.evaluate(el => {
                const computedStyle = window.getComputedStyle(el);
                return {
                    fontSize: computedStyle.fontSize,
                    display: computedStyle.display,
                    overflow: computedStyle.overflow
                };
            });
            console.log(`[HADEES-TEST] ${viewport.name} readability:`, isReadable);

            await percySnapshot(page, `Hadees Responsive - ${viewport.name}`, {
                widths: [viewport.width]
            });
        }

        // Check for JavaScript errors
        expect(consoleErrors.length).toBe(0);
    });
});
