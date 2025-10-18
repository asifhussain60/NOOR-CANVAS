import { test, expect, Page } from '@playwright/test';

// Contract
// - Navigates to NC_URL or default URL
// - Waits for canvas root to be visible
// - Captures full-page screenshot and saves as artifact

const DEFAULT_URL = 'https://localhost:9091/transcript/canvas/KJAHA99L';

function envOrDefault(name: string, fallback: string) {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v : fallback;
}

const TARGET_URL = envOrDefault('NC_URL', DEFAULT_URL);

// Minimal wait helpers
async function waitForStable(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
}

// Main test
test.describe('TranscriptCanvas render and screenshot', () => {
  test('render and capture', async ({ page }) => {
    test.info().annotations.push({ type: 'target-url', description: TARGET_URL });

    // Navigate
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
    await waitForStable(page);

    // Verify main root exists
    const root = page.locator('.session-canvas-root, #session-canvas-root');
    await expect(root).toBeVisible({ timeout: 15000 });

    // Optional UI checks
    // Sidebar must not exist
    await expect(page.locator('.canvas-sidebar')).toHaveCount(0);

    // Capture screenshot
    const shot = await page.screenshot({ fullPage: true });
    test.info().attach('transcript-canvas-fullpage', { body: shot, contentType: 'image/png' });

    // Also take a focused area screenshot if the main grid exists
    const grid = page.locator('.canvas-main-grid');
    if (await grid.count()) {
      const gridShot = await grid.screenshot();
      test.info().attach('canvas-main-grid', { body: gridShot, contentType: 'image/png' });
    }
  });
});
