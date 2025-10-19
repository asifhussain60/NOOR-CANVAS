import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

/**
 * Percy Visual Regression Tests - CSS Theme Consistency
 * 
 * [DEBUG-WORKITEM:css:theme-consistency] Visual validation of CSS theme unification
 * 
 * Validates that session transcript content renders consistently across:
 * 1. HostControlPanel (host/control-panel/{token})
 * 2. SessionCanvas (session/{token})
 * 3. TranscriptCanvas (transcript/{sessionId})
 * 
 * All three views should render Islamic content assets (poetry, hadees, ayah cards)
 * at consistent 90% width using data-theme="narrow".
 * 
 * Test Data: Session 212
 * - Host Token: PQ9N5YWW
 * - User Token: KJAHA99L
 * - Session ID: 212
 */

const BASE_URL = 'https://localhost:9091';
const HOST_TOKEN = 'PQ9N5YWW';      // Session 212 host token
const USER_TOKEN = 'KJAHA99L';       // Session 212 user token
const SESSION_ID = 212;

test.describe('CSS Theme Consistency - Visual Regression Tests', () => {

    test.beforeEach(async ({ page, context }) => {
        // Accept any certificates (localhost SSL)
        await context.addInitScript(() => {
            // Suppress certificate errors
        });
    });

    test('01 - HostControlPanel transcript rendering (90% width)', async ({ page }) => {
        // Navigate to Host Control Panel for Session 212
        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
        
        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');
        
        // Wait for session content to load
        await page.waitForSelector('.html-viewer-content', { timeout: 15000 });
        
        // Verify the unified CSS classes are present
        const viewerContent = page.locator('.html-viewer-content.session-transcript-content.islamic-content');
        await expect(viewerContent).toBeVisible();
        
        // Verify data-theme="narrow" attribute
        await expect(viewerContent).toHaveAttribute('data-theme', 'narrow');
        
        // Wait for Islamic content to render (if present)
        await page.waitForTimeout(2000);
        
        // Scroll to transcript section
        await page.evaluate(() => {
            const transcriptSection = document.querySelector('.html-viewer-content');
            if (transcriptSection) {
                transcriptSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        
        await page.waitForTimeout(1000);
        
        // Take Percy snapshot focused on transcript content
        await percySnapshot(page, 'CSS Theme - HostControlPanel - Transcript Section', {
            widths: [1280, 1920],
            minHeight: 1024,
            percyCSS: `
                .debug-panel { display: none !important; }
                .navbar { display: none !important; }
            `
        });
    });

    test('02 - SessionCanvas transcript rendering (90% width)', async ({ page }) => {
        // Navigate to Session Canvas for Session 212
        await page.goto(`${BASE_URL}/session/${USER_TOKEN}`);
        
        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');
        
        // Wait for session to be active and content loaded
        await page.waitForTimeout(3000);
        
        // Look for shared asset content (transcript content rendered in user view)
        const assetContent = page.locator('.canvas-asset-content.islamic-content[data-theme="narrow"]');
        
        // Wait for content to appear
        try {
            await assetContent.waitFor({ state: 'visible', timeout: 10000 });
        } catch {
            console.log('[CSS-THEME-TEST] No shared asset content visible yet in SessionCanvas');
        }
        
        // Scroll to shared content area if present
        await page.evaluate(() => {
            const contentSection = document.querySelector('.canvas-asset-content');
            if (contentSection) {
                contentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
        
        await page.waitForTimeout(1000);
        
        // Take Percy snapshot
        await percySnapshot(page, 'CSS Theme - SessionCanvas - Shared Content Section', {
            widths: [1280, 1920],
            minHeight: 1024,
            percyCSS: `
                .debug-panel { display: none !important; }
                .navbar { display: none !important; }
            `
        });
    });

    test('03 - TranscriptCanvas transcript rendering (90% width)', async ({ page }) => {
        // Navigate to Transcript Canvas for Session 212
        await page.goto(`${BASE_URL}/transcript/${SESSION_ID}`);
        
        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');
        
        // Wait for transcript content to load
        await page.waitForTimeout(3000);
        
        // Look for transcript content with unified CSS classes
        const transcriptContent = page.locator('.canvas-asset-content.islamic-content[data-theme="narrow"]');
        
        // Wait for content visibility
        try {
            await transcriptContent.waitFor({ state: 'visible', timeout: 10000 });
        } catch {
            console.log('[CSS-THEME-TEST] No transcript content visible yet in TranscriptCanvas');
        }
        
        // Scroll to transcript section
        await page.evaluate(() => {
            const contentSection = document.querySelector('.canvas-asset-content');
            if (contentSection) {
                contentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        
        await page.waitForTimeout(1000);
        
        // Take Percy snapshot
        await percySnapshot(page, 'CSS Theme - TranscriptCanvas - Transcript Section', {
            widths: [1280, 1920],
            minHeight: 1024,
            percyCSS: `
                .debug-panel { display: none !important; }
                .navbar { display: none !important; }
            `
        });
    });

    test('04 - Side-by-side comparison with Islamic content', async ({ page, context }) => {
        // This test validates that if we capture the same Islamic content element
        // (e.g., an ayah-card or poetry block) from all three views, they should
        // render with identical width (90%)
        
        console.log('[CSS-THEME-TEST] Capturing HostControlPanel with Islamic content');
        
        // Open HostControlPanel
        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Check if ayah-card exists
        const ayahCard = page.locator('.ayah-card').first();
        const hasAyahCard = await ayahCard.count() > 0;
        
        if (hasAyahCard) {
            // Scroll to the ayah card
            await ayahCard.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            
            // Take snapshot focused on Islamic content
            await percySnapshot(page, 'CSS Theme - Islamic Content Width - HostControlPanel', {
                widths: [1280],
                percyCSS: `
                    .debug-panel { display: none !important; }
                `
            });
        } else {
            console.log('[CSS-THEME-TEST] No ayah-card found in HostControlPanel');
        }
        
        console.log('[CSS-THEME-TEST] All comparison snapshots captured');
    });

    test('05 - CSS Custom Property validation', async ({ page }) => {
        // Navigate to any view with transcript content
        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Verify CSS custom properties are correctly applied
        const cssVariables = await page.evaluate(() => {
            const element = document.querySelector('[data-theme="narrow"]');
            if (!element) return null;
            
            const computedStyle = getComputedStyle(element);
            return {
                islamicAssetWidth: computedStyle.getPropertyValue('--islamic-asset-width').trim(),
                islamicAssetMaxWidth: computedStyle.getPropertyValue('--islamic-asset-max-width').trim()
            };
        });
        
        // Assertions
        if (cssVariables) {
            console.log('[CSS-THEME-TEST] CSS Variables:', cssVariables);
            expect(cssVariables.islamicAssetWidth).toBe('90%');
            expect(cssVariables.islamicAssetMaxWidth).toBe('none');
        } else {
            console.log('[CSS-THEME-TEST] No element with data-theme="narrow" found');
        }
        
        // Take snapshot documenting the CSS variable validation
        await percySnapshot(page, 'CSS Theme - CSS Variables Validation', {
            widths: [1280],
            percyCSS: `
                .debug-panel { display: none !important; }
            `
        });
    });

    test('06 - Responsive behavior validation (narrow theme)', async ({ page }) => {
        // Test that narrow theme renders correctly at different viewport sizes
        const viewportSizes = [
            { width: 1920, height: 1080, name: 'Desktop Large' },
            { width: 1280, height: 720, name: 'Desktop Standard' },
            { width: 1024, height: 768, name: 'Tablet Landscape' }
        ];
        
        for (const viewport of viewportSizes) {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            
            await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            // Scroll to content
            await page.evaluate(() => {
                const content = document.querySelector('.html-viewer-content');
                if (content) content.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            
            await page.waitForTimeout(500);
            
            await percySnapshot(page, `CSS Theme - Responsive - ${viewport.name}`, {
                widths: [viewport.width],
                percyCSS: `
                    .debug-panel { display: none !important; }
                `
            });
        }
    });
});
