/**
 * Test: SessionCanvas Annotation Overlay
 * Purpose: Verify annotation overlay layer exists and is positioned correctly
 * Session: 212 (Host Token: PQ9N5YWW, User Token: KJAHA99L)
 */

import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

const USER_TOKEN = 'KJAHA99L';

test.describe('SessionCanvas Annotation Overlay', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to SessionCanvas as participant
        await page.goto(`http://localhost:5000/session/canvas/${USER_TOKEN}`);
        await page.waitForLoadState('networkidle');
        
        // Wait for session canvas to load
        await page.waitForSelector('.canvas-content-area', { timeout: 10000 });
    });

    test('Annotation overlay layer should exist in DOM', async ({ page }) => {
        console.log('[TEST] Verifying annotation overlay layer exists');
        
        // Check for annotation-layer div
        const annotationLayer = page.locator('#annotation-layer');
        await expect(annotationLayer).toBeAttached();
        
        // Check for SVG overlay
        const svgOverlay = page.locator('#annotation-overlay');
        await expect(svgOverlay).toBeAttached();
        
        // Check for laser pointer element
        const laserPointer = page.locator('#laser-pointer');
        await expect(laserPointer).toBeAttached();
        
        console.log('[TEST] ✅ Annotation overlay layer and elements exist');
        
        // Take Percy snapshot
        await percySnapshot(page, 'SessionCanvas - Annotation Overlay Layer Present');
    });

    test('Annotation overlay should be positioned absolutely', async ({ page }) => {
        console.log('[TEST] Verifying annotation overlay positioning');
        
        const annotationLayer = page.locator('#annotation-layer');
        
        // Verify absolute positioning
        const position = await annotationLayer.evaluate((el) => window.getComputedStyle(el).position);
        expect(position).toBe('absolute');
        
        // Verify z-index is high (1000)
        const zIndex = await annotationLayer.evaluate((el) => window.getComputedStyle(el).zIndex);
        expect(zIndex).toBe('1000');
        
        // Verify pointer-events is none (transparent to clicks)
        const pointerEvents = await annotationLayer.evaluate((el) => window.getComputedStyle(el).pointerEvents);
        expect(pointerEvents).toBe('none');
        
        console.log('[TEST] ✅ Annotation overlay positioned correctly:', { position, zIndex, pointerEvents });
        
        // Take Percy snapshot
        await percySnapshot(page, 'SessionCanvas - Annotation Overlay Positioning');
    });

    test('Laser pointer should be hidden by default', async ({ page }) => {
        console.log('[TEST] Verifying laser pointer default state');
        
        const laserPointer = page.locator('#laser-pointer');
        
        // Verify display is none
        const display = await laserPointer.evaluate((el) => window.getComputedStyle(el).display);
        expect(display).toBe('none');
        
        console.log('[TEST] ✅ Laser pointer hidden by default');
        
        // Take Percy snapshot
        await percySnapshot(page, 'SessionCanvas - Laser Pointer Hidden');
    });

    test('SVG overlay should have correct dimensions', async ({ page }) => {
        console.log('[TEST] Verifying SVG overlay dimensions');
        
        const svgOverlay = page.locator('#annotation-overlay');
        
        // Verify width and height are 100%
        const width = await svgOverlay.getAttribute('style');
        expect(width).toContain('width:100%');
        expect(width).toContain('height:100%');
        
        console.log('[TEST] ✅ SVG overlay has 100% width and height');
        
        // Take Percy snapshot
        await percySnapshot(page, 'SessionCanvas - SVG Overlay Dimensions');
    });

    test('Canvas content area should have relative positioning', async ({ page }) => {
        console.log('[TEST] Verifying canvas content area positioning for overlay');
        
        const canvasContentArea = page.locator('#canvas-content-area');
        
        // Verify position is relative (for absolute-positioned overlay)
        const position = await canvasContentArea.evaluate((el) => window.getComputedStyle(el).position);
        expect(position).toBe('relative');
        
        console.log('[TEST] ✅ Canvas content area has relative positioning');
        
        // Take Percy snapshot
        await percySnapshot(page, 'SessionCanvas - Canvas Content Area Positioning');
    });

    test('Annotation JavaScript should be loaded', async ({ page }) => {
        console.log('[TEST] Verifying annotation JavaScript functions loaded');
        
        // Check if annotation functions are defined
        const functionsExist = await page.evaluate(() => {
            const win = window as any;
            return {
                renderAnnotation: typeof win.renderAnnotation === 'function',
                showLaserPointer: typeof win.showLaserPointer === 'function',
                hideLaserPointer: typeof win.hideLaserPointer === 'function',
                clearAllAnnotations: typeof win.clearAllAnnotations === 'function',
                setupAnnotationEventHandlers: typeof win.setupAnnotationEventHandlers === 'function'
            };
        });
        
        expect(functionsExist.renderAnnotation).toBe(true);
        expect(functionsExist.showLaserPointer).toBe(true);
        expect(functionsExist.hideLaserPointer).toBe(true);
        expect(functionsExist.clearAllAnnotations).toBe(true);
        expect(functionsExist.setupAnnotationEventHandlers).toBe(true);
        
        console.log('[TEST] ✅ All annotation JavaScript functions loaded:', functionsExist);
    });
});
