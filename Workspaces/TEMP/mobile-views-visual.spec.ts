/**
 * Mobile Views Visual Regression Test - Percy Integration
 * 
 * Purpose: Visual regression testing for SessionWaiting, UserLanding, and SessionCanvas
 *          across multiple responsive breakpoints using Percy
 * 
 * Test Strategy:
 * - Percy Snapshots: 375px (mobile), 768px (tablet), 1280px (desktop)
 * - Captures pixel-perfect screenshots for visual comparison
 * - Detects CSS regressions across viewport changes
 * 
 * Prerequisites:
 * - App must be running at https://localhost:9091
 * - Session 212 must exist with tokens: KJAHA99L (user) / PQ9N5YWW (host)
 * - Percy project must be configured (PERCY_TOKEN environment variable)
 * 
 * Usage:
 *   Run via orchestration script: .\Scripts\run-mobile-view-tests.ps1 -Percy
 *   Or manually: npm run test:percy -- Workspaces/TEMP/mobile-views-visual.spec.ts
 */

import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

const APP_URL = 'https://localhost:9091';
const SESSION_TOKEN_USER = 'KJAHA99L';
const SESSION_TOKEN_HOST = 'PQ9N5YWW';

// Percy responsive widths
const RESPONSIVE_WIDTHS = [375, 768, 1280];

test.describe('Mobile Views - Visual Regression Tests (Percy)', () => {

    test.beforeEach(async ({ page }) => {
        // Configure page for visual testing
        await page.goto(APP_URL, {
            waitUntil: 'networkidle',
            timeout: 30000
        });
    });

    // ========================================
    // SESSION WAITING VIEW - VISUAL TESTS
    // ========================================

    test('SessionWaiting - Responsive Visual Regression', async ({ page }) => {
        console.log('🧪 Testing SessionWaiting visual regression across viewports...');

        // Navigate to SessionWaiting view
        await page.goto(`${APP_URL}/session/waiting/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');

        // Wait for key elements to be visible
        await page.waitForSelector('.session-waiting-container', { timeout: 10000 });
        await page.waitForSelector('.noor-canvas-logo', { timeout: 5000 });

        // Wait for session data to load
        await page.waitForSelector('.session-info-panel', { timeout: 10000 });

        // Additional wait for any animations or dynamic content
        await page.waitForTimeout(1000);

        // Capture Percy snapshot across all responsive breakpoints
        await percySnapshot(page, 'SessionWaiting - Responsive Layout', {
            widths: RESPONSIVE_WIDTHS,
            minHeight: 1024,
            percyCSS: `
                /* Hide dynamic timer to prevent false positives */
                .countdown-display { visibility: hidden; }
                /* Hide progress bar animation */
                .progress-bar-fill { animation: none !important; }
            `
        });

        console.log('📸 Captured: SessionWaiting responsive snapshots (375px, 768px, 1280px)');

        // Verify critical elements are present
        await expect(page.locator('.session-waiting-container')).toBeVisible();
        await expect(page.locator('.session-info-panel')).toBeVisible();
        await expect(page.locator('.waiting-room-panel')).toBeVisible();
        await expect(page.locator('.participants-panel')).toBeVisible();

        console.log('✅ SessionWaiting visual regression test complete');
    });

    test('SessionWaiting - Mobile Logo Sizing (375px)', async ({ page }) => {
        console.log('🧪 Testing SessionWaiting mobile logo sizing...');

        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${APP_URL}/session/waiting/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.noor-canvas-logo img', { timeout: 10000 });
        await page.waitForTimeout(500);

        // Capture mobile-specific view
        await percySnapshot(page, 'SessionWaiting - Mobile Logo (375px)', {
            widths: [375],
            minHeight: 667
        });

        console.log('📸 Captured: SessionWaiting mobile logo sizing');
    });

    test('SessionWaiting - Participants Grid Layout', async ({ page }) => {
        console.log('🧪 Testing SessionWaiting participants grid across viewports...');

        await page.goto(`${APP_URL}/session/waiting/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.participants-panel', { timeout: 10000 });
        await page.waitForTimeout(500);

        // Capture participants panel across breakpoints
        await percySnapshot(page, 'SessionWaiting - Participants Grid', {
            widths: RESPONSIVE_WIDTHS,
            minHeight: 800,
            scope: '.participants-panel'
        });

        console.log('📸 Captured: SessionWaiting participants grid layout');
    });

    // ========================================
    // USER LANDING VIEW - VISUAL TESTS
    // ========================================

    test('UserLanding - Responsive Visual Regression', async ({ page }) => {
        console.log('🧪 Testing UserLanding visual regression across viewports...');

        await page.goto(`${APP_URL}/user/landing/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.user-landing-container', { timeout: 10000 });
        await page.waitForSelector('.user-landing-logo', { timeout: 5000 });
        await page.waitForTimeout(1000);

        // Capture Percy snapshot across all responsive breakpoints
        await percySnapshot(page, 'UserLanding - Responsive Layout', {
            widths: RESPONSIVE_WIDTHS,
            minHeight: 1024
        });

        console.log('📸 Captured: UserLanding responsive snapshots (375px, 768px, 1280px)');

        // Verify critical elements
        await expect(page.locator('.user-landing-container')).toBeVisible();
        await expect(page.locator('.user-landing-logo')).toBeVisible();
        await expect(page.locator('.user-landing-title')).toBeVisible();

        console.log('✅ UserLanding visual regression test complete');
    });

    test('UserLanding - Mobile Form Panel (375px)', async ({ page }) => {
        console.log('🧪 Testing UserLanding mobile form panel...');

        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${APP_URL}/user/landing/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.user-landing-form-panel', { timeout: 10000 });
        await page.waitForTimeout(500);

        // Capture mobile form panel
        await percySnapshot(page, 'UserLanding - Mobile Form Panel (375px)', {
            widths: [375],
            minHeight: 667
        });

        console.log('📸 Captured: UserLanding mobile form panel');
    });

    test('UserLanding - Logo Sizing Across Breakpoints', async ({ page }) => {
        console.log('🧪 Testing UserLanding logo sizing across breakpoints...');

        await page.goto(`${APP_URL}/user/landing/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.user-landing-logo img', { timeout: 10000 });
        await page.waitForTimeout(500);

        // Capture logo area across all breakpoints
        await percySnapshot(page, 'UserLanding - Logo Sizing', {
            widths: RESPONSIVE_WIDTHS,
            minHeight: 400,
            scope: '.user-landing-logo'
        });

        console.log('📸 Captured: UserLanding logo sizing (175px mobile / 200px desktop)');
    });

    // ========================================
    // SESSION CANVAS VIEW - VISUAL TESTS
    // ========================================

    test('SessionCanvas - Responsive Visual Regression', async ({ page }) => {
        console.log('🧪 Testing SessionCanvas visual regression across viewports...');

        await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');

        // Wait for session to load
        await page.waitForSelector('.canvas-header', { timeout: 10000 });
        await page.waitForSelector('.canvas-content-area', { timeout: 10000 });
        await page.waitForTimeout(1500); // Allow for SignalR connection

        // Capture Percy snapshot across all responsive breakpoints
        await percySnapshot(page, 'SessionCanvas - Responsive Layout', {
            widths: RESPONSIVE_WIDTHS,
            minHeight: 1024,
            percyCSS: `
                /* Hide dynamic SignalR status to prevent false positives */
                .canvas-signalr-status { visibility: hidden; }
            `
        });

        console.log('📸 Captured: SessionCanvas responsive snapshots (375px, 768px, 1280px)');

        // Verify critical elements
        await expect(page.locator('.canvas-header')).toBeVisible();
        await expect(page.locator('.canvas-content-area')).toBeVisible();
        await expect(page.locator('.canvas-sidebar')).toBeVisible();

        console.log('✅ SessionCanvas visual regression test complete');
    });

    test('SessionCanvas - Mobile Single Column Layout (375px)', async ({ page }) => {
        console.log('🧪 Testing SessionCanvas mobile single column layout...');

        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.canvas-main-grid', { timeout: 10000 });
        await page.waitForTimeout(1000);

        // Capture mobile stacked layout
        await percySnapshot(page, 'SessionCanvas - Mobile Single Column (375px)', {
            widths: [375],
            minHeight: 1200, // Taller for stacked content
            percyCSS: `
                .canvas-signalr-status { visibility: hidden; }
            `
        });

        console.log('📸 Captured: SessionCanvas mobile single column layout');
    });

    test('SessionCanvas - Tablet Grid Transition (768px)', async ({ page }) => {
        console.log('🧪 Testing SessionCanvas tablet grid transition...');

        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.canvas-main-grid', { timeout: 10000 });
        await page.waitForTimeout(1000);

        // Capture tablet grid layout
        await percySnapshot(page, 'SessionCanvas - Tablet Grid (768px)', {
            widths: [768],
            minHeight: 1024,
            percyCSS: `
                .canvas-signalr-status { visibility: hidden; }
            `
        });

        console.log('📸 Captured: SessionCanvas tablet grid transition');
    });

    test('SessionCanvas - Question Cards Responsive Width', async ({ page }) => {
        console.log('🧪 Testing SessionCanvas question cards responsive width...');

        await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.canvas-sidebar', { timeout: 10000 });
        await page.waitForTimeout(1000);

        // Capture question panel across breakpoints
        await percySnapshot(page, 'SessionCanvas - Question Cards Width', {
            widths: RESPONSIVE_WIDTHS,
            minHeight: 800,
            scope: '.canvas-sidebar'
        });

        console.log('📸 Captured: SessionCanvas question cards responsive width');
    });
});
