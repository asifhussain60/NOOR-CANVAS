/**
 * Visual Regression Tests - Canvas Rendering
 * 
 * Purpose: Verify TranscriptCanvas and SessionCanvas render correctly
 * Expected: Match HTML output in .github/prompts.keys/transcript-canvas/RenderdViews/
 * 
 * Test Data: Session 212
 * - Participant Token: KJAHA99L
 * - Host Token: PQ9N5YWW
 */

import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

const BASE_URL = 'https://localhost:9091';
const SESSION_TOKEN_PARTICIPANT = 'KJAHA99L';
const SESSION_TOKEN_HOST = 'PQ9N5YWW';

test.describe('Canvas Rendering Visual Regression', () => {

  test.beforeEach(async ({ page }) => {
    // Handle SSL certificate errors for localhost
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  });

  test('TranscriptCanvas - Full Page Layout', async ({ page }) => {
    console.log('[STEP] Navigate to TranscriptCanvas with participant token');
    await page.goto(`${BASE_URL}/transcript/canvas/${SESSION_TOKEN_PARTICIPANT}`, {
      waitUntil: 'networkidle'
    });

    console.log('[STEP] Wait for canvas to load');
    await page.waitForSelector('.session-canvas-root', { timeout: 10000 });
    await page.waitForSelector('.canvas-header', { timeout: 5000 });
    
    console.log('[STEP] Wait for content to render');
    await page.waitForSelector('.canvas-content-area', { timeout: 5000 });
    
    // Wait for fonts to load
    await page.waitForTimeout(2000);

    console.log('[VERIFY] Canvas container is visible');
    const container = page.locator('.session-canvas-container');
    await expect(container).toBeVisible();

    console.log('[VERIFY] Header elements present');
    await expect(page.locator('.canvas-header-logo img')).toBeVisible();
    await expect(page.locator('.canvas-session-title')).toBeVisible();
    await expect(page.locator('.canvas-transcript-badge')).toBeVisible();

    console.log('[VERIFY] Q&A section present (modal trigger)');
    const qaButton = page.locator('button:has-text("Ask a question")').first();
    await expect(qaButton).toBeVisible();

    console.log('[PERCY] Capture TranscriptCanvas full page');
    await percySnapshot(page, 'TranscriptCanvas - Full Page Layout', {
      widths: [1280, 1920],
      minHeight: 1024,
      enableJavaScript: true,
      percyCSS: `
        /* Hide dynamic elements that change between runs */
        .canvas-signalr-status { display: none !important; }
        /* Ensure consistent rendering */
        * { animation: none !important; transition: none !important; }
      `
    });
  });

  test('SessionCanvas - Full Page with Sidebar', async ({ page }) => {
    console.log('[STEP] Navigate to SessionCanvas with host token');
    await page.goto(`${BASE_URL}/session/canvas/${SESSION_TOKEN_HOST}`, {
      waitUntil: 'networkidle'
    });

    console.log('[STEP] Wait for canvas to load');
    await page.waitForSelector('.session-canvas-root', { timeout: 10000 });
    await page.waitForSelector('.canvas-header', { timeout: 5000 });
    
    console.log('[STEP] Wait for grid layout');
    await page.waitForSelector('.canvas-main-grid', { timeout: 5000 });
    
    // Wait for fonts to load
    await page.waitForTimeout(2000);

    console.log('[VERIFY] Canvas container is visible');
    const container = page.locator('.session-canvas-container');
    await expect(container).toBeVisible();

    console.log('[VERIFY] Header elements present');
    await expect(page.locator('.canvas-header-logo img')).toBeVisible();
    await expect(page.locator('.canvas-session-title')).toBeVisible();

    console.log('[VERIFY] Sidebar present');
    const sidebar = page.locator('.canvas-sidebar');
    await expect(sidebar).toBeVisible();

    console.log('[VERIFY] Q&A section in sidebar');
    await expect(page.locator('.canvas-sidebar-header')).toBeVisible();
    await expect(page.locator('.canvas-questions-container')).toBeVisible();

    console.log('[PERCY] Capture SessionCanvas full page with sidebar');
    await percySnapshot(page, 'SessionCanvas - Full Page with Sidebar', {
      widths: [1280, 1920],
      minHeight: 1024,
      enableJavaScript: true,
      percyCSS: `
        /* Hide dynamic elements that change between runs */
        .canvas-signalr-status { display: none !important; }
        /* Ensure consistent rendering */
        * { animation: none !important; transition: none !important; }
      `
    });
  });

  test('TranscriptCanvas - Content Area Focus', async ({ page }) => {
    console.log('[STEP] Navigate to TranscriptCanvas');
    await page.goto(`${BASE_URL}/transcript/canvas/${SESSION_TOKEN_PARTICIPANT}`, {
      waitUntil: 'networkidle'
    });

    await page.waitForSelector('.canvas-content-area', { timeout: 10000 });
    await page.waitForTimeout(2000); // Font loading

    console.log('[VERIFY] Content area renders with correct styling');
    const contentArea = page.locator('.canvas-content-area');
    await expect(contentArea).toBeVisible();

    // Check for purple theme
    const bgColor = await contentArea.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    console.log(`[INFO] Content area background: ${bgColor}`);

    console.log('[PERCY] Capture content area only');
    await percySnapshot(page, 'TranscriptCanvas - Content Area', {
      widths: [1280],
      minHeight: 800,
      scope: '.canvas-content-area',
      percyCSS: `
        * { animation: none !important; transition: none !important; }
      `
    });
  });

  test('SessionCanvas - Q&A Sidebar Focus', async ({ page }) => {
    console.log('[STEP] Navigate to SessionCanvas');
    await page.goto(`${BASE_URL}/session/canvas/${SESSION_TOKEN_HOST}`, {
      waitUntil: 'networkidle'
    });

    await page.waitForSelector('.canvas-sidebar', { timeout: 10000 });
    await page.waitForTimeout(2000); // Font loading

    console.log('[VERIFY] Sidebar renders with correct layout');
    const sidebar = page.locator('.canvas-sidebar');
    await expect(sidebar).toBeVisible();

    // Check grid layout
    const gridColumns = await page.locator('.canvas-main-grid').evaluate(el =>
      window.getComputedStyle(el).gridTemplateColumns
    );
    console.log(`[INFO] Grid columns: ${gridColumns}`);

    console.log('[PERCY] Capture sidebar only');
    await percySnapshot(page, 'SessionCanvas - Q&A Sidebar', {
      widths: [300],
      minHeight: 600,
      scope: '.canvas-sidebar',
      percyCSS: `
        * { animation: none !important; transition: none !important; }
      `
    });
  });

  test('TranscriptCanvas - Responsive Layout (Mobile)', async ({ page }) => {
    console.log('[STEP] Set mobile viewport');
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X

    console.log('[STEP] Navigate to TranscriptCanvas');
    await page.goto(`${BASE_URL}/transcript/canvas/${SESSION_TOKEN_PARTICIPANT}`, {
      waitUntil: 'networkidle'
    });

    await page.waitForSelector('.session-canvas-root', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('[VERIFY] Mobile layout renders');
    const container = page.locator('.session-canvas-container');
    await expect(container).toBeVisible();

    console.log('[PERCY] Capture mobile layout');
    await percySnapshot(page, 'TranscriptCanvas - Mobile Layout', {
      widths: [375],
      minHeight: 812,
      percyCSS: `
        .canvas-signalr-status { display: none !important; }
        * { animation: none !important; transition: none !important; }
      `
    });
  });

  test('SessionCanvas - Grid Layout Verification', async ({ page }) => {
    console.log('[STEP] Navigate to SessionCanvas');
    await page.goto(`${BASE_URL}/session/canvas/${SESSION_TOKEN_HOST}`, {
      waitUntil: 'networkidle'
    });

    await page.waitForSelector('.canvas-main-grid', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('[VERIFY] Grid layout structure');
    const mainGrid = page.locator('.canvas-main-grid');
    await expect(mainGrid).toBeVisible();

    // Verify grid has two columns (content + sidebar)
    const gridColumns = await mainGrid.evaluate(el =>
      window.getComputedStyle(el).gridTemplateColumns
    );
    console.log(`[INFO] Grid template columns: ${gridColumns}`);
    expect(gridColumns).toContain('300px'); // Sidebar width

    console.log('[VERIFY] Canvas area container present');
    await expect(page.locator('.canvas-area-container')).toBeVisible();

    console.log('[VERIFY] Sidebar present');
    await expect(page.locator('.canvas-sidebar')).toBeVisible();

    console.log('[PERCY] Capture grid layout structure');
    await percySnapshot(page, 'SessionCanvas - Grid Layout Structure', {
      widths: [1280, 1920],
      minHeight: 1024,
      percyCSS: `
        .canvas-signalr-status { display: none !important; }
        * { animation: none !important; transition: none !important; }
        /* Highlight grid structure */
        .canvas-main-grid { outline: 2px dashed rgba(255,0,0,0.3); }
        .canvas-area-container { outline: 2px dashed rgba(0,255,0,0.3); }
        .canvas-sidebar { outline: 2px dashed rgba(0,0,255,0.3); }
      `
    });
  });

});
