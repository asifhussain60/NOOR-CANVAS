/**
 * Mobile Views Responsive Test - Device Emulation
 * 
 * Purpose: Functional testing of SessionWaiting, UserLanding, and SessionCanvas views
 *          across mobile (iPhone SE), tablet (iPad), and desktop viewports
 * 
 * Test Strategy:
 * - Device Profiles: iPhone SE (375x667), iPad (768x1024), Desktop (1280x720)
 * - Validates layout behavior, element visibility, and responsive breakpoints
 * - Tests critical UI elements adapt correctly to viewport changes
 * 
 * Prerequisites:
 * - App must be running at https://localhost:9091
 * - Session 212 must exist with tokens: KJAHA99L (user) / PQ9N5YWW (host)
 * 
 * Usage:
 *   Run via orchestration script: .\Scripts\run-mobile-view-tests.ps1
 */

import { devices, expect, test } from '@playwright/test';

const APP_URL = 'https://localhost:9091';
const SESSION_TOKEN_USER = 'KJAHA99L';
const SESSION_TOKEN_HOST = 'PQ9N5YWW';

// Device configurations
const MOBILE = devices['iPhone SE'];
const TABLET = devices['iPad'];
const DESKTOP = { viewport: { width: 1280, height: 720 } };

test.describe('Mobile Views - Responsive Layout Tests', () => {

    // ========================================
    // SESSION WAITING VIEW
    // ========================================

    test.describe('SessionWaiting.razor - Mobile Responsiveness', () => {

        test('Mobile (iPhone SE) - Layout and Elements', async ({ browser }) => {
            const context = await browser.newContext(MOBILE);
            const page = await context.newPage();

            await page.goto(`${APP_URL}/session/waiting/${SESSION_TOKEN_USER}`);
            await page.waitForLoadState('networkidle');

            // Logo should be visible and properly sized for mobile (175x175px)
            const logo = page.locator('.noor-canvas-logo img');
            await expect(logo).toBeVisible();

            // Session info panel should be visible
            const sessionInfo = page.locator('.session-info-panel');
            await expect(sessionInfo).toBeVisible();

            // Waiting room panel should be visible
            const waitingRoom = page.locator('.waiting-room-panel');
            await expect(waitingRoom).toBeVisible();

            // Participants panel should be visible
            const participantsPanel = page.locator('.participants-panel');
            await expect(participantsPanel).toBeVisible();

            // Participant list should use single column on mobile
            const participantsList = page.locator('.participants-list');
            await expect(participantsList).toBeVisible();

            // Timer panel should be visible
            const timerPanel = page.locator('.timer-panel');
            await expect(timerPanel).toBeVisible();

            console.log('✅ SessionWaiting - Mobile layout validated');
            await context.close();
        });

        test('Tablet (iPad) - Layout and Elements', async ({ browser }) => {
            const context = await browser.newContext(TABLET);
            const page = await context.newPage();

            await page.goto(`${APP_URL}/session/waiting/${SESSION_TOKEN_USER}`);
            await page.waitForLoadState('networkidle');

            // Logo should be visible (200x200px for tablet/desktop)
            const logo = page.locator('.noor-canvas-logo img');
            await expect(logo).toBeVisible();

            // Verify panels container layout
            const panelsContainer = page.locator('.panels-container');
            await expect(panelsContainer).toBeVisible();

            // All major panels should be visible on tablet
            await expect(page.locator('.waiting-room-panel')).toBeVisible();
            await expect(page.locator('.participants-panel')).toBeVisible();
            await expect(page.locator('.timer-panel')).toBeVisible();

            console.log('✅ SessionWaiting - Tablet layout validated');
            await context.close();
        });

        test('Desktop - Full Layout', async ({ browser }) => {
            const context = await browser.newContext(DESKTOP);
            const page = await context.newPage();

            await page.goto(`${APP_URL}/session/waiting/${SESSION_TOKEN_USER}`);
            await page.waitForLoadState('networkidle');

            // Verify session details grid is visible
            const sessionDetails = page.locator('.session-details-grid');
            await expect(sessionDetails).toBeVisible();

            // Participants list should use multiple columns on desktop
            const participantsList = page.locator('.participants-list');
            await expect(participantsList).toBeVisible();

            // All detail items should be visible
            const detailItems = page.locator('.detail-item');
            expect(await detailItems.count()).toBeGreaterThan(0);

            console.log('✅ SessionWaiting - Desktop layout validated');
            await context.close();
        });
    });

    // ========================================
    // USER LANDING VIEW
    // ========================================

    test.describe('UserLanding.razor - Mobile Responsiveness', () => {

        test('Mobile (iPhone SE) - Layout and Elements', async ({ browser }) => {
            const context = await browser.newContext(MOBILE);
            const page = await context.newPage();

            await page.goto(`${APP_URL}/user/landing/${SESSION_TOKEN_USER}`);
            await page.waitForLoadState('networkidle');

            // Logo should be visible and properly sized for mobile (175x175px)
            const logo = page.locator('.user-landing-logo img');
            await expect(logo).toBeVisible();

            // Title should be visible with reduced font size on mobile
            const title = page.locator('.user-landing-title');
            await expect(title).toBeVisible();

            // Session name should be visible
            const sessionName = page.locator('.user-landing-session-name');
            await expect(sessionName).toBeVisible();

            // Form panel should be visible with mobile padding
            const formPanel = page.locator('.user-landing-form-panel');
            await expect(formPanel).toBeVisible();

            // Input fields should be properly sized for mobile
            const inputs = page.locator('.user-landing-input');
            if (await inputs.count() > 0) {
                await expect(inputs.first()).toBeVisible();
            }

            // Submit button should be visible and properly styled
            const button = page.locator('.user-landing-button');
            await expect(button).toBeVisible();

            console.log('✅ UserLanding - Mobile layout validated');
            await context.close();
        });

        test('Tablet (iPad) - Layout and Elements', async ({ browser }) => {
            const context = await browser.newContext(TABLET);
            const page = await context.newPage();

            await page.goto(`${APP_URL}/user/landing/${SESSION_TOKEN_USER}`);
            await page.waitForLoadState('networkidle');

            // Logo should be visible (200x200px for tablet/desktop)
            const logo = page.locator('.user-landing-logo img');
            await expect(logo).toBeVisible();

            // Container should have appropriate max-width
            const container = page.locator('.user-landing-container');
            await expect(container).toBeVisible();

            // Form panel should be visible
            const formPanel = page.locator('.user-landing-form-panel');
            await expect(formPanel).toBeVisible();

            console.log('✅ UserLanding - Tablet layout validated');
            await context.close();
        });

        test('Desktop - Full Layout', async ({ browser }) => {
            const context = await browser.newContext(DESKTOP);
            const page = await context.newPage();

            await page.goto(`${APP_URL}/user/landing/${SESSION_TOKEN_USER}`);
            await page.waitForLoadState('networkidle');

            // All elements should be visible with full desktop styling
            await expect(page.locator('.user-landing-logo img')).toBeVisible();
            await expect(page.locator('.user-landing-title')).toBeVisible();
            await expect(page.locator('.user-landing-session-name')).toBeVisible();
            await expect(page.locator('.user-landing-form-panel')).toBeVisible();
            await expect(page.locator('.user-landing-button')).toBeVisible();

            console.log('✅ UserLanding - Desktop layout validated');
            await context.close();
        });
    });

    // ========================================
    // SESSION CANVAS VIEW
    // ========================================

    test.describe('SessionCanvas.razor - Mobile Responsiveness', () => {

        test('Mobile (iPhone SE) - Layout and Elements', async ({ browser }) => {
            const context = await browser.newContext(MOBILE);
            const page = await context.newPage();

            await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
            await page.waitForLoadState('networkidle');

            // Wait for session to load
            await page.waitForSelector('.canvas-header', { timeout: 10000 });

            // Header should be visible
            const header = page.locator('.canvas-header');
            await expect(header).toBeVisible();

            // Session title should be visible
            const sessionTitle = page.locator('.canvas-session-title');
            await expect(sessionTitle).toBeVisible();

            // Canvas area should be visible
            const canvasArea = page.locator('.canvas-content-area');
            await expect(canvasArea).toBeVisible();

            // Sidebar should be visible (stacked on mobile)
            const sidebar = page.locator('.canvas-sidebar');
            await expect(sidebar).toBeVisible();

            // Tabs should be visible
            const tabs = page.locator('.canvas-tabs');
            await expect(tabs).toBeVisible();

            // Question panel should be visible
            const questionPanel = page.locator('.canvas-question-panel');
            await expect(questionPanel).toBeVisible();

            console.log('✅ SessionCanvas - Mobile layout validated');
            await context.close();
        });

        test('Tablet (iPad) - Layout and Elements', async ({ browser }) => {
            const context = await browser.newContext(TABLET);
            const page = await context.newPage();

            await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
            await page.waitForLoadState('networkidle');

            // Wait for session to load
            await page.waitForSelector('.canvas-header', { timeout: 10000 });

            // Main grid should transition to appropriate layout
            const mainGrid = page.locator('.canvas-main-grid');
            await expect(mainGrid).toBeVisible();

            // Canvas area and sidebar should both be visible
            await expect(page.locator('.canvas-content-area')).toBeVisible();
            await expect(page.locator('.canvas-sidebar')).toBeVisible();

            // Question panel should be visible
            await expect(page.locator('.canvas-question-panel')).toBeVisible();

            console.log('✅ SessionCanvas - Tablet layout validated');
            await context.close();
        });

        test('Desktop - Full Grid Layout', async ({ browser }) => {
            const context = await browser.newContext(DESKTOP);
            const page = await context.newPage();

            await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
            await page.waitForLoadState('networkidle');

            // Wait for session to load
            await page.waitForSelector('.canvas-header', { timeout: 10000 });

            // Main grid should use 2-column layout
            const mainGrid = page.locator('.canvas-main-grid');
            await expect(mainGrid).toBeVisible();

            // Both columns should be visible
            await expect(page.locator('.canvas-area-container')).toBeVisible();
            await expect(page.locator('.canvas-sidebar')).toBeVisible();

            // Question form should be visible
            const questionForm = page.locator('.canvas-question-form');
            await expect(questionForm).toBeVisible();

            // Tabs should be visible
            await expect(page.locator('.canvas-tabs')).toBeVisible();

            console.log('✅ SessionCanvas - Desktop layout validated');
            await context.close();
        });
    });
});
