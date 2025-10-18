/**
 * Canvas Rendering Verification Tests (Without Percy)
 * 
 * Purpose: Verify TranscriptCanvas and SessionCanvas structure and styling
 * Tests run without Percy to check rendering issues directly
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';
const SESSION_TOKEN_PARTICIPANT = 'KJAHA99L';
const SESSION_TOKEN_HOST = 'PQ9N5YWW';

test.describe('Canvas Rendering Verification', () => {

  test('TranscriptCanvas - Layout Structure', async ({ page }) => {
    console.log('[STEP] Navigate to TranscriptCanvas');
    await page.goto(`${BASE_URL}/transcript/canvas/${SESSION_TOKEN_PARTICIPANT}`, {
      waitUntil: 'networkidle'
    });

    console.log('[STEP] Wait for canvas to load');
    await page.waitForSelector('.session-canvas-root', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('[VERIFY] Root container styling');
    const root = page.locator('.session-canvas-root');
    await expect(root).toBeVisible();
    
    const rootBg = await root.evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log(`[INFO] Root background: ${rootBg}`);
    expect(rootBg).toContain('245, 243, 248'); // Light purple tint: #F5F3F8

    console.log('[VERIFY] Container width and centering');
    const container = page.locator('.session-canvas-container');
    const containerWidth = await container.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        width: style.width,
        maxWidth: style.maxWidth,
        margin: style.margin
      };
    });
    console.log(`[INFO] Container width: ${containerWidth.width}, max: ${containerWidth.maxWidth}`);
    
    console.log('[VERIFY] Content area border color (purple theme)');
    const contentArea = page.locator('.canvas-content-area');
    const borderColor = await contentArea.evaluate(el => 
      window.getComputedStyle(el).borderColor
    );
    console.log(`[INFO] Content border color: ${borderColor}`);
    
    console.log('[VERIFY] Grid layout (no sidebar for transcript)');
    const mainGrid = page.locator('.canvas-main-grid');
    const gridColumns = await mainGrid.evaluate(el =>
      window.getComputedStyle(el).gridTemplateColumns
    );
    console.log(`[INFO] Grid columns: ${gridColumns}`);
    expect(gridColumns).toContain('0px'); // No sidebar
    
    console.log('[VERIFY] Transcript badge present');
    const badge = page.locator('.canvas-transcript-badge');
    await expect(badge).toBeVisible();
    const badgeText = await badge.textContent();
    console.log(`[INFO] Badge text: ${badgeText}`);
    expect(badgeText).toContain('Transcript');
  });

  test('SessionCanvas - Sidebar Layout', async ({ page }) => {
    console.log('[STEP] Navigate to SessionCanvas');
    await page.goto(`${BASE_URL}/session/canvas/${SESSION_TOKEN_HOST}`, {
      waitUntil: 'networkidle'
    });

    console.log('[STEP] Wait for canvas to load');
    await page.waitForSelector('.session-canvas-root', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('[VERIFY] Root container styling');
    const root = page.locator('.session-canvas-root');
    const rootBg = await root.evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log(`[INFO] Root background: ${rootBg}`);
    expect(rootBg).toContain('248, 245, 241'); // Light tan tint: #F8F5F1

    console.log('[VERIFY] Content area border color (green theme)');
    const contentArea = page.locator('.canvas-content-area');
    const borderColor = await contentArea.evaluate(el => 
      window.getComputedStyle(el).borderColor
    );
    console.log(`[INFO] Content border color: ${borderColor}`);
    
    console.log('[VERIFY] Grid layout (with sidebar)');
    const mainGrid = page.locator('.canvas-main-grid');
    const gridColumns = await mainGrid.evaluate(el =>
      window.getComputedStyle(el).gridTemplateColumns
    );
    console.log(`[INFO] Grid columns: ${gridColumns}`);
    expect(gridColumns).toContain('300px'); // Sidebar width

    console.log('[VERIFY] Sidebar visible and styled');
    const sidebar = page.locator('.canvas-sidebar');
    await expect(sidebar).toBeVisible();
    
    const sidebarStyle = await sidebar.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        background: style.backgroundColor,
        border: style.border,
        padding: style.padding,
        minHeight: style.minHeight
      };
    });
    console.log(`[INFO] Sidebar styling:`, sidebarStyle);
    
    console.log('[VERIFY] Questions container in sidebar');
    const questionsContainer = page.locator('.canvas-questions-container');
    await expect(questionsContainer).toBeVisible();
  });

  test('TranscriptCanvas - Content Area Width', async ({ page }) => {
    await page.goto(`${BASE_URL}/transcript/canvas/${SESSION_TOKEN_PARTICIPANT}`, {
      waitUntil: 'networkidle'
    });

    await page.waitForSelector('.canvas-content-area', { timeout: 10000 });
    await page.waitForTimeout(1000);

    console.log('[MEASURE] Content area dimensions');
    const contentArea = page.locator('.canvas-content-area');
    const box = await contentArea.boundingBox();
    console.log(`[INFO] Content area: width=${box?.width}px, height=${box?.height}px`);
    
    const viewportSize = page.viewportSize();
    console.log(`[INFO] Viewport: ${viewportSize?.width}x${viewportSize?.height}`);
    
    // Content should be close to full width (accounting for padding/margins)
    if (box && viewportSize) {
      const widthRatio = box.width / viewportSize.width;
      console.log(`[INFO] Content width ratio: ${(widthRatio * 100).toFixed(1)}%`);
      expect(widthRatio).toBeGreaterThan(0.85); // At least 85% of viewport
    }
  });

  test('SessionCanvas - Grid Column Sizes', async ({ page }) => {
    await page.goto(`${BASE_URL}/session/canvas/${SESSION_TOKEN_HOST}`, {
      waitUntil: 'networkidle'
    });

    await page.waitForSelector('.canvas-main-grid', { timeout: 10000 });
    await page.waitForTimeout(1000);

    console.log('[MEASURE] Canvas area container');
    const canvasArea = page.locator('.canvas-area-container');
    const canvasBox = await canvasArea.boundingBox();
    console.log(`[INFO] Canvas area: width=${canvasBox?.width}px`);

    console.log('[MEASURE] Sidebar');
    const sidebar = page.locator('.canvas-sidebar');
    const sidebarBox = await sidebar.boundingBox();
    console.log(`[INFO] Sidebar: width=${sidebarBox?.width}px`);

    // Verify sidebar is approximately 300px
    if (sidebarBox) {
      expect(sidebarBox.width).toBeGreaterThanOrEqual(290);
      expect(sidebarBox.width).toBeLessThanOrEqual(310);
    }

    // Verify they're side by side
    if (canvasBox && sidebarBox) {
      const gap = Math.abs(canvasBox.x + canvasBox.width - sidebarBox.x);
      console.log(`[INFO] Gap between canvas and sidebar: ${gap}px`);
      expect(gap).toBeLessThan(50); // Should be adjacent with small gap
    }
  });

});
