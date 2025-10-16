/**
 * Mobile Views Screenshot Capture - Documentation
 * 
 * Purpose: Capture screenshots of SessionWaiting, UserLanding, and SessionCanvas views
 *          across mobile, tablet, and desktop viewports for documentation
 * 
 * Test Strategy:
 * - Viewport Sizes: 375px (mobile), 768px (tablet), 1280px (desktop)
 * - Captures full-page screenshots for each view and viewport combination
 * - Saves screenshots to test-results/screenshots/ directory
 * 
 * Prerequisites:
 * - App must be running at https://localhost:9091
 * - Session 212 must exist with tokens: KJAHA99L (user) / PQ9N5YWW (host)
 * 
 * Usage:
 *   npx playwright test Workspaces/TEMP/mobile-views-screenshots.spec.ts --config=config/testing/playwright.config.cjs --headed
 */

import { expect, test } from '@playwright/test';

const APP_URL = 'https://localhost:9091';
const SESSION_TOKEN_USER = 'KJAHA99L';
const SESSION_TOKEN_HOST = 'PQ9N5YWW';

// Viewport configurations
const VIEWPORTS = {
    mobile: { width: 375, height: 667, name: 'mobile-375px' },
    tablet: { width: 768, height: 1024, name: 'tablet-768px' },
    desktop: { width: 1280, height: 720, name: 'desktop-1280px' }
};

test.describe('Mobile Views - Screenshot Capture for Documentation', () => {

    // ========================================
    // SESSION WAITING VIEW
    // ========================================

    test.describe('SessionWaiting.razor - Screenshots', () => {

        for (const [device, config] of Object.entries(VIEWPORTS)) {
            test(`SessionWaiting - ${device} (${config.width}px)`, async ({ page }) => {
                console.log(`📸 Capturing SessionWaiting - ${device} (${config.width}px)`);

                await page.setViewportSize({ width: config.width, height: config.height });
                await page.goto(`${APP_URL}/session/waiting/${SESSION_TOKEN_USER}`);
                await page.waitForLoadState('networkidle');

                // Wait for key elements
                await page.waitForSelector('.session-waiting-container', { timeout: 10000 });
                await page.waitForSelector('.noor-canvas-logo', { timeout: 5000 });
                await page.waitForSelector('.session-info-panel', { timeout: 10000 });
                await page.waitForTimeout(1500); // Allow for animations and SignalR

                // Take full-page screenshot
                await page.screenshot({
                    path: `test-results/screenshots/SessionWaiting-${config.name}.png`,
                    fullPage: true
                });

                console.log(`✅ Screenshot saved: SessionWaiting-${config.name}.png`);

                // Verify critical elements
                await expect(page.locator('.session-waiting-container')).toBeVisible();
                await expect(page.locator('.participants-panel')).toBeVisible();
            });
        }
    });

    // ========================================
    // USER LANDING VIEW
    // ========================================

    test.describe('UserLanding.razor - Screenshots', () => {

        for (const [device, config] of Object.entries(VIEWPORTS)) {
            test(`UserLanding - ${device} (${config.width}px)`, async ({ page }) => {
                console.log(`📸 Capturing UserLanding - ${device} (${config.width}px)`);

                await page.setViewportSize({ width: config.width, height: config.height });
                await page.goto(`${APP_URL}/user/landing/${SESSION_TOKEN_USER}`);
                await page.waitForLoadState('networkidle');

                // Wait for key elements
                await page.waitForSelector('.user-landing-container', { timeout: 10000 });
                await page.waitForSelector('.user-landing-logo', { timeout: 5000 });
                await page.waitForTimeout(1000);

                // Take full-page screenshot
                await page.screenshot({
                    path: `test-results/screenshots/UserLanding-${config.name}.png`,
                    fullPage: true
                });

                console.log(`✅ Screenshot saved: UserLanding-${config.name}.png`);

                // Verify critical elements
                await expect(page.locator('.user-landing-container')).toBeVisible();
                await expect(page.locator('.user-landing-logo')).toBeVisible();
            });
        }
    });

    // ========================================
    // SESSION CANVAS VIEW
    // ========================================

    test.describe('SessionCanvas.razor - Screenshots', () => {

        for (const [device, config] of Object.entries(VIEWPORTS)) {
            test(`SessionCanvas - ${device} (${config.width}px)`, async ({ page }) => {
                console.log(`📸 Capturing SessionCanvas - ${device} (${config.width}px)`);

                await page.setViewportSize({ width: config.width, height: config.height });
                await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
                await page.waitForLoadState('networkidle');

                // Wait for session to load
                await page.waitForSelector('.canvas-header', { timeout: 10000 });
                await page.waitForSelector('.canvas-content-area', { timeout: 10000 });
                await page.waitForTimeout(1500); // Allow for SignalR connection

                // Take full-page screenshot
                await page.screenshot({
                    path: `test-results/screenshots/SessionCanvas-${config.name}.png`,
                    fullPage: true
                });

                console.log(`✅ Screenshot saved: SessionCanvas-${config.name}.png`);

                // Verify critical elements
                await expect(page.locator('.canvas-header')).toBeVisible();
                await expect(page.locator('.canvas-sidebar')).toBeVisible();
            });
        }
    });
});
