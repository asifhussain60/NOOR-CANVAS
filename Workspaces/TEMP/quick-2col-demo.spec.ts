import { test } from '@playwright/test';

const APP_URL = 'https://localhost:9091';
const SESSION_TOKEN_USER = 'KJAHA99L'; // Session 212

test('Quick 2-Column Grid Demo Screenshot', async ({ page }) => {
    // iPhone 14 Pro Landscape - Show 2-column grid
    await page.setViewportSize({ width: 932, height: 430 });
    await page.goto(`${APP_URL}/session/canvas/${SESSION_TOKEN_USER}`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.canvas-header', { timeout: 10000 });

    // Switch to Q&A tab
    await page.click('button:has-text("Q&A")');
    await page.waitForTimeout(500);

    // Capture landscape 2-column layout
    await page.screenshot({
        path: 'Workspaces/PercyScreenshots/DEMO-iPhone14Pro-Landscape-2Col-QA.png',
        fullPage: true
    });
    console.log('📸 Captured: DEMO-iPhone14Pro-Landscape-2Col-QA.png');

    // Switch to Participants tab
    await page.click('button:has-text("Participants")');
    await page.waitForTimeout(500);

    // Capture landscape 2-column participants
    await page.screenshot({
        path: 'Workspaces/PercyScreenshots/DEMO-iPhone14Pro-Landscape-2Col-Participants.png',
        fullPage: true
    });
    console.log('📸 Captured: DEMO-iPhone14Pro-Landscape-2Col-Participants.png');

    // Compare with Portrait (single column)
    await page.setViewportSize({ width: 430, height: 932 });
    await page.click('button:has-text("Q&A")');
    await page.waitForTimeout(500);

    await page.screenshot({
        path: 'Workspaces/PercyScreenshots/DEMO-iPhone14Pro-Portrait-SingleCol-QA.png',
        fullPage: true
    });
    console.log('📸 Captured: DEMO-iPhone14Pro-Portrait-SingleCol-QA.png (for comparison)');

    // Desktop view (unchanged - sidebar remains on right)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);

    await page.screenshot({
        path: 'Workspaces/PercyScreenshots/DEMO-Desktop-Sidebar-Unchanged.png',
        fullPage: true
    });
    console.log('📸 Captured: DEMO-Desktop-Sidebar-Unchanged.png (verification)');
});
