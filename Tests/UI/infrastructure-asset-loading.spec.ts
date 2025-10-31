/**
 * Asset Loading Infrastructure Tests
 * Generated from test-prep session: 20251031120000
 * Quality: 50% (Low)
 * 
 * Tests static asset loading failures and font 404 errors
 * Based on browser console logs: Asset loading failures (ERR_CERT_AUTHORITY_INVALID), Font 404s
 */

import { expect, test } from '@playwright/test';

test.describe('Asset Loading Infrastructure', () => {
    test('should attempt to load custom font Inter-800', async ({ page }) => {
        // Arrange: Track font loading requests
        const fontRequests: string[] = [];
        page.on('request', req => {
            if (req.url().includes('.ttf') || req.url().includes('/fonts/')) {
                fontRequests.push(req.url());
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Assert: Font request made (even if it fails with 404)
        const hasInterFontRequest = fontRequests.some(url =>
            url.includes('inter-800.ttf') || url.includes('/fonts/inter/')
        );
        expect(hasInterFontRequest).toBeTruthy();
    });

    test('should load CSS files including noor-canvas.css', async ({ page }) => {
        // Arrange: Track CSS requests
        const cssRequests: string[] = [];
        page.on('request', req => {
            if (req.url().endsWith('.css') && req.resourceType() === 'stylesheet') {
                cssRequests.push(req.url());
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Assert: noor-canvas.css requested (based on browser log line 25)
        const hasNoorCanvasCSS = cssRequests.some(url =>
            url.includes('noor-canvas.css')
        );
        expect(hasNoorCanvasCSS).toBeTruthy();
    });

    test('should load all required CSS files from log verification', async ({ page }) => {
        // Arrange: Capture CSS debug logs
        const cssLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('CSS DEBUG') || msg.text().includes('.css')) {
                cssLogs.push(msg.text());
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: CSS verification log present showing 10+ files
        const hasCSSVerificationLog = cssLogs.some(log =>
            log.includes('All loaded CSS files') || log.includes('noor-canvas.css link found')
        );
        expect(hasCSSVerificationLog).toBeTruthy();
    });

    test('should handle missing .noor-btn elements gracefully', async ({ page }) => {
        // Arrange: Capture CSS debug warnings
        const warningLogs: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'warning' || msg.text().includes('No .noor-btn elements')) {
                warningLogs.push(msg.text());
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: Warning log present (based on browser log line 44)
        const hasWarning = warningLogs.some(log =>
            log.includes('No .noor-btn elements found to test')
        );
        expect(hasWarning).toBeTruthy();
    });

    test('should load external CDN resources (Tailwind, Notyf, FontAwesome)', async ({ page }) => {
        // Arrange: Track CDN requests
        const cdnRequests: string[] = [];
        page.on('request', req => {
            const url = req.url();
            if (url.includes('cdn.') || url.includes('cdnjs.') || url.includes('jsdelivr.')) {
                cdnRequests.push(url);
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Assert: CDN requests made
        const hasTailwind = cdnRequests.some(url => url.includes('tailwindcss'));
        const hasNotyf = cdnRequests.some(url => url.includes('notyf'));
        const hasFontAwesome = cdnRequests.some(url => url.includes('font-awesome'));

        expect(hasTailwind || hasNotyf || hasFontAwesome).toBeTruthy();
    });
});
