import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

/**
 * Percy Visual Regression Tests - TranscriptCanvas HTML Structure Validation
 * 
 * Purpose: Validate that HTML structure fixes prevent rendering issues
 * - Sidebar completely removed (no right panel visible)
 * - Question modal toggle button visible (purple, top-right)
 * - Canvas area full-width
 * - No broken/orphaned HTML elements
 * 
 * Test Coverage:
 * - Desktop viewport (1280x720)
 * - Tablet viewport (768x1024)  
 * - Mobile viewport (375x667)
 * 
 * Percy Baseline: First run establishes baseline, subsequent runs detect visual regressions
 * 
 * TRACE: [TRACE-WORKITEM:transcript-canvas:html-structure-fix] Percy visual validation ;CLEANUP_OK
 */

test.describe('TranscriptCanvas HTML Structure - Visual Regression', () => {
    // Test data: Session 212 participant token
    const PARTICIPANT_TOKEN = 'KJAHA99L';
    const TRANSCRIPT_URL = `https://localhost:9091/transcript/canvas/${PARTICIPANT_TOKEN}`;

    test.beforeEach(async ({ page }) => {
        // Navigate to TranscriptCanvas with participant token
        await page.goto(TRANSCRIPT_URL, { waitUntil: 'networkidle' });

        // Wait for session data to load
        await page.waitForSelector('.canvas-header-logo', { timeout: 10000 });

        // Wait for any animations to complete
        await page.waitForTimeout(500);
    });

    test('Desktop (1280x720) - Full-width canvas with no sidebar', async ({ page }) => {
        // Set desktop viewport
        await page.setViewportSize({ width: 1280, height: 720 });

        // Verify canvas area is visible
        await expect(page.locator('.canvas-area-container')).toBeVisible();

        // Verify question toggle button is visible (purple button)
        await expect(page.locator('.canvas-sidebar-toggle')).toBeVisible();

        // Verify toggle button has correct icon (question bubble)
        const toggleIcon = page.locator('.canvas-sidebar-toggle-icon');
        await expect(toggleIcon).toHaveClass(/fa-comment-dots/);

        // Verify NO sidebar is visible (should not exist in DOM)
        const sidebar = page.locator('.canvas-sidebar');
        await expect(sidebar).toHaveCount(0);

        // Take Percy snapshot
        await percySnapshot(page, 'TranscriptCanvas - Desktop - No Sidebar', {
            widths: [1280],
            minHeight: 720
        });
    });

    test('Tablet (768x1024) - Responsive layout without sidebar', async ({ page }) => {
        // Set tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });

        // Verify canvas area responsive
        await expect(page.locator('.canvas-area-container')).toBeVisible();

        // Verify toggle button visible on tablet
        await expect(page.locator('.canvas-sidebar-toggle')).toBeVisible();

        // Verify NO sidebar elements
        await expect(page.locator('.canvas-sidebar')).toHaveCount(0);
        await expect(page.locator('.canvas-tabs')).toHaveCount(0);
        await expect(page.locator('.canvas-tab-button')).toHaveCount(0);

        // Take Percy snapshot
        await percySnapshot(page, 'TranscriptCanvas - Tablet - No Sidebar', {
            widths: [768],
            minHeight: 1024
        });
    });

    test('Mobile (375x667) - Full-width mobile view', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Verify canvas area visible on mobile
        await expect(page.locator('.canvas-area-container')).toBeVisible();

        // Verify toggle button visible (should not be hidden on mobile)
        await expect(page.locator('.canvas-sidebar-toggle')).toBeVisible();

        // Verify NO sidebar
        await expect(page.locator('.canvas-sidebar')).toHaveCount(0);

        // Take Percy snapshot
        await percySnapshot(page, 'TranscriptCanvas - Mobile - No Sidebar', {
            widths: [375],
            minHeight: 667
        });
    });

    test('Question Modal - Click toggle opens centered modal', async ({ page }) => {
        // Desktop viewport for modal test
        await page.setViewportSize({ width: 1280, height: 720 });

        // Click toggle button to open question modal
        await page.click('.canvas-sidebar-toggle');

        // Wait for modal animation
        await page.waitForTimeout(300);

        // Verify modal is visible
        await expect(page.locator('.canvas-modal-overlay')).toBeVisible();
        await expect(page.locator('.canvas-modal-content')).toBeVisible();

        // Verify modal title
        await expect(page.locator('.canvas-modal-title')).toContainText('Ask a Question');

        // Verify modal has question textarea
        await expect(page.locator('.canvas-form-textarea')).toBeVisible();

        // Verify submit and cancel buttons
        await expect(page.locator('button:has-text("Submit")')).toBeVisible();
        await expect(page.locator('button:has-text("Cancel")')).toBeVisible();

        // Take Percy snapshot of modal
        await percySnapshot(page, 'TranscriptCanvas - Question Modal Open', {
            widths: [1280],
            minHeight: 720
        });
    });

    test('HTML Structure Validation - No orphaned elements', async ({ page }) => {
        // Verify critical structure elements
        const mainGrid = page.locator('.canvas-main-grid');
        await expect(mainGrid).toHaveCount(1);

        // Verify canvas area container exists once
        const canvasContainer = page.locator('.canvas-area-container');
        await expect(canvasContainer).toHaveCount(1);

        // Verify welcome panel
        await expect(page.locator('.canvas-welcome-panel')).toBeVisible();

        // Verify question panel (inline form at bottom)
        await expect(page.locator('.canvas-question-panel')).toBeVisible();

        // Verify NO duplicate or orphaned structural elements
        // (This would fail if HTML closing tags were malformed)
        const allMainGrids = await page.locator('.canvas-main-grid').count();
        expect(allMainGrids).toBe(1);

        const allCanvasContainers = await page.locator('.canvas-area-container').count();
        expect(allCanvasContainers).toBe(1);
    });
});
