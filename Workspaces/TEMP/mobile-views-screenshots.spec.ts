/**
 * Mobile Views Screenshot Capture - Percy Integration
 * 
 * Purpose: Capture screenshots of SessionWaiting, UserLanding, and SessionCanvas views
 *          across comprehensive mobile, tablet, and desktop viewports for visual regression
 * 
 * Test Strategy:
 * - Device Coverage: iPhone, iPhone Pro, Android, iPad, iPad Pro (portrait & landscape)
 * - Desktop: 1280x720
 * - Total: 11 viewports per view = 33 screenshots
 * - Auto-cleanup: Folder emptied before each test run
 * - Saves to: Workspaces/TEMP/PercyScreenshots/
 * 
 * Prerequisites:
 * - App must be running at https://localhost:9091
 * - Session 212 must exist with tokens: KJAHA99L (user) / PQ9N5YWW (host)
 * 
 * Usage:
 *   npx playwright test Workspaces/TEMP/mobile-views-screenshots.spec.ts --config=config/testing/playwright.config.cjs --headed
 */

import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_URL = 'https://localhost:9091';
const SESSION_TOKEN_USER = 'KJAHA99L';
const SESSION_TOKEN_HOST = 'PQ9N5YWW';

// Absolute path for Percy screenshots
const SCREENSHOT_DIR = path.resolve(__dirname, '../PercyScreenshots');

// Viewport configurations - comprehensive mobile device coverage
const VIEWPORTS = {
    // iPhone SE, iPhone 8 (portrait)
    iphonePortrait: { width: 375, height: 667, name: 'iPhone-portrait-375x667' },
    // iPhone SE, iPhone 8 (landscape)
    iphoneLandscape: { width: 667, height: 375, name: 'iPhone-landscape-667x375' },
    // iPhone 12/13/14 Pro (portrait)
    iphoneProPortrait: { width: 390, height: 844, name: 'iPhonePro-portrait-390x844' },
    // iPhone 12/13/14 Pro (landscape)
    iphoneProLandscape: { width: 844, height: 390, name: 'iPhonePro-landscape-844x390' },
    // Samsung Galaxy S8+, Android (portrait)
    androidPortrait: { width: 360, height: 740, name: 'Android-portrait-360x740' },
    // Samsung Galaxy S8+, Android (landscape)
    androidLandscape: { width: 740, height: 360, name: 'Android-landscape-740x360' },
    // iPad Mini (portrait)
    iPadPortrait: { width: 768, height: 1024, name: 'iPad-portrait-768x1024' },
    // iPad Mini (landscape)
    iPadLandscape: { width: 1024, height: 768, name: 'iPad-landscape-1024x768' },
    // iPad Pro 11" (portrait)
    iPadProPortrait: { width: 834, height: 1194, name: 'iPadPro-portrait-834x1194' },
    // iPad Pro 11" (landscape)
    iPadProLandscape: { width: 1194, height: 834, name: 'iPadPro-landscape-1194x834' },
    // Desktop
    desktop: { width: 1280, height: 720, name: 'desktop-1280x720' }
};

// Clean and recreate screenshot directory before tests
test.beforeAll(async () => {
    if (fs.existsSync(SCREENSHOT_DIR)) {
        fs.rmSync(SCREENSHOT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    console.log(`🗑️  Cleaned and recreated: ${SCREENSHOT_DIR}`);
});

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

                // [DEBUG-WORKITEM:css:landscape-fix] Removed fullPage to respect viewport dimensions ;CLEANUP_OK
                await page.screenshot({
                    path: path.join(SCREENSHOT_DIR, `SessionWaiting-${config.name}.png`)
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

                // [DEBUG-WORKITEM:css:landscape-fix] Removed fullPage to respect viewport dimensions ;CLEANUP_OK
                await page.screenshot({
                    path: path.join(SCREENSHOT_DIR, `UserLanding-${config.name}.png`)
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

                // [DEBUG-WORKITEM:css:landscape-fix] Removed fullPage to respect viewport dimensions ;CLEANUP_OK
                await page.screenshot({
                    path: path.join(SCREENSHOT_DIR, `SessionCanvas-${config.name}.png`)
                });

                console.log(`✅ Screenshot saved: SessionCanvas-${config.name}.png`);

                // Verify critical elements
                await expect(page.locator('.canvas-header')).toBeVisible();
                await expect(page.locator('.canvas-sidebar')).toBeVisible();
            });
        }
    });
});
