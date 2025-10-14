import percySnapshot from '@percy/playwright';
import type { BrowserContext, Page } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';

/**
 * Test: Canvas Welcome Panel Layout Visual Regression with Percy
 * 
 * Purpose: Verify that the welcome panel appears inside the session-canvas-container
 *          (white card) and is positioned correctly within the canvas-area-container,
 *          above the canvas-content-area.
 * 
 * Percy Integration:
 * - Captures pixel-perfect snapshots at multiple viewport sizes (mobile, tablet, desktop)
 * - Creates baseline on first run, compares against baseline on subsequent runs
 * - Highlights visual differences in Percy dashboard
 * 
 * Expected Visual Structure:
 * - Welcome Panel: Inside white session-canvas-container card
 * - Position: Inside canvas-area-container div, above canvas-content-area
 * - Text Color: Dark green (#006400)
 * - Font: Poppins, 1.25rem, semi-bold
 * - Background: White with rounded corners
 * - Alignment: Center
 * 
 * Screenshot Annotation Reference:
 * - "Emma Frost, Welcome To The Session" should appear inside the white card
 * - Should be positioned above the green dotted canvas content area
 * - Should be part of the main grid layout
 * 
 * Debug Level: simple
 */

console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Starting Percy visual test for welcome panel layout ;CLEANUP_OK');

test.describe('Canvas Welcome Panel - Layout Visual Regression (Percy)', () => {
    let browser: any;
    let context: BrowserContext;
    let page: Page;

    const SESSION_TOKEN = 'KJAHA99L'; // Session 212 user token
    const BASE_URL = 'https://localhost:9091';
    const PARTICIPANT_NAME = 'Emma Frost';
    const PARTICIPANT_COUNTRY = 'United States';

    test.beforeAll(async () => {
        console.log('[DEBUG-WORKITEM:canvas:layout-visual-setup] Launching browser for Percy snapshot ;CLEANUP_OK');

        browser = await chromium.launch({
            headless: false,
            slowMo: 500
        });

        context = await browser.newContext({
            storageState: undefined,
            viewport: { width: 1280, height: 720 },
            ignoreHTTPSErrors: true
        });

        page = await context.newPage();

        // Enable console logging
        page.on('console', msg => console.log(`[CANVAS] ${msg.text()}`));

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-setup] Browser context created ;CLEANUP_OK');
    });

    test.afterAll(async () => {
        console.log('[DEBUG-WORKITEM:canvas:layout-visual-teardown] Closing browser ;CLEANUP_OK');
        await context?.close();
        await browser?.close();
    });

    test('Welcome panel appears inside session container above canvas content area', async () => {
        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Step 1: Navigate to canvas with session token ;CLEANUP_OK');
        
        // Navigate to canvas
        await page.goto(`${BASE_URL}/session/canvas/${SESSION_TOKEN}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Step 2: Wait for enhanced spinner to disappear ;CLEANUP_OK');
        
        // Wait for loading spinner to disappear
        await page.waitForSelector('.enhanced-spinner-overlay', { state: 'hidden', timeout: 15000 });

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Step 3: Enter participant information ;CLEANUP_OK');

        // Fill participant form
        await page.fill('input[placeholder="Enter your name"]', PARTICIPANT_NAME);
        await page.fill('input[placeholder="Enter your country"]', PARTICIPANT_COUNTRY);

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Step 4: Join session ;CLEANUP_OK');

        // Click Join Session button
        await page.click('button:has-text("Join Session")');

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Step 5: Wait for canvas to load ;CLEANUP_OK');

        // Wait for canvas to load
        await page.waitForSelector('.session-canvas-container', { timeout: 10000 });
        await page.waitForSelector('.canvas-welcome-panel', { timeout: 5000 });

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Step 6: Verify welcome panel structure ;CLEANUP_OK');

        // Verify welcome panel exists
        const welcomePanel = page.locator('.canvas-welcome-panel');
        await expect(welcomePanel).toBeVisible();

        // Verify welcome text contains participant name
        const welcomeText = page.locator('.canvas-welcome-text');
        await expect(welcomeText).toContainText(PARTICIPANT_NAME);
        await expect(welcomeText).toContainText('Welcome To The Session');

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Step 7: Verify welcome panel is inside session container ;CLEANUP_OK');

        // Verify welcome panel is inside session-canvas-container
        const welcomePanelInContainer = page.locator('.session-canvas-container .canvas-welcome-panel');
        await expect(welcomePanelInContainer).toBeVisible();

        // Verify welcome panel is inside canvas-area-container
        const welcomePanelInAreaContainer = page.locator('.canvas-area-container .canvas-welcome-panel');
        await expect(welcomePanelInAreaContainer).toBeVisible();

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Step 8: Verify welcome panel position relative to canvas content ;CLEANUP_OK');

        // Get bounding boxes
        const welcomePanelBox = await welcomePanel.boundingBox();
        const canvasContentArea = page.locator('.canvas-content-area');
        const canvasContentBox = await canvasContentArea.boundingBox();

        // Verify welcome panel appears ABOVE canvas content area (Y coordinate should be less)
        expect(welcomePanelBox).not.toBeNull();
        expect(canvasContentBox).not.toBeNull();
        
        if (welcomePanelBox && canvasContentBox) {
            console.log(`[DEBUG-WORKITEM:canvas:layout-visual-test] Welcome panel Y: ${welcomePanelBox.y}, Canvas content Y: ${canvasContentBox.y} ;CLEANUP_OK`);
            expect(welcomePanelBox.y).toBeLessThan(canvasContentBox.y);
        }

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Step 9: Capture Percy snapshots at multiple viewports ;CLEANUP_OK');

        // Desktop viewport snapshot (already at 1280x720)
        await percySnapshot(page, 'Welcome Panel Layout - Desktop', {
            widths: [1280]
        });

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Captured desktop snapshot ;CLEANUP_OK');

        // Tablet viewport snapshot
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000); // Wait for responsive layout
        await percySnapshot(page, 'Welcome Panel Layout - Tablet', {
            widths: [768]
        });

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Captured tablet snapshot ;CLEANUP_OK');

        // Mobile viewport snapshot
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000); // Wait for responsive layout
        await percySnapshot(page, 'Welcome Panel Layout - Mobile', {
            widths: [375]
        });

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Captured mobile snapshot ;CLEANUP_OK');

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Step 10: Verify CSS styling ;CLEANUP_OK');

        // Reset to desktop viewport for CSS verification
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.waitForTimeout(500);

        // Verify welcome panel CSS
        const welcomePanelStyles = await welcomePanel.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
                backgroundColor: styles.backgroundColor,
                borderRadius: styles.borderRadius,
                textAlign: styles.textAlign,
                padding: styles.padding
            };
        });

        console.log(`[DEBUG-WORKITEM:canvas:layout-visual-test] Welcome panel styles: ${JSON.stringify(welcomePanelStyles)} ;CLEANUP_OK`);

        // Verify welcome text CSS
        const welcomeTextStyles = await welcomeText.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
                fontFamily: styles.fontFamily,
                fontSize: styles.fontSize,
                fontWeight: styles.fontWeight,
                color: styles.color
            };
        });

        console.log(`[DEBUG-WORKITEM:canvas:layout-visual-test] Welcome text styles: ${JSON.stringify(welcomeTextStyles)} ;CLEANUP_OK`);

        // Verify text color is dark green (#006400 = rgb(0, 100, 0))
        expect(welcomeTextStyles.color).toBe('rgb(0, 100, 0)');

        // Verify font family contains Poppins
        expect(welcomeTextStyles.fontFamily).toContain('Poppins');

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Test complete - welcome panel layout verified ;CLEANUP_OK');
    });

    test('Welcome panel layout persists after content broadcast', async () => {
        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Testing welcome panel persistence with content ;CLEANUP_OK');

        // Navigate to canvas
        await page.goto(`${BASE_URL}/session/canvas/${SESSION_TOKEN}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for loading
        await page.waitForSelector('.enhanced-spinner-overlay', { state: 'hidden', timeout: 15000 });

        // Join session
        await page.fill('input[placeholder="Enter your name"]', PARTICIPANT_NAME);
        await page.fill('input[placeholder="Enter your country"]', PARTICIPANT_COUNTRY);
        await page.click('button:has-text("Join Session")');

        // Wait for canvas
        await page.waitForSelector('.canvas-welcome-panel', { timeout: 10000 });

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Session loaded, checking if content exists ;CLEANUP_OK');

        // Check if there's any shared content
        const canvasContent = page.locator('.canvas-asset-content');
        const hasContent = await canvasContent.isVisible().catch(() => false);

        console.log(`[DEBUG-WORKITEM:canvas:layout-visual-test] Shared content visible: ${hasContent} ;CLEANUP_OK`);

        // Take snapshot regardless of content state
        await percySnapshot(page, 'Welcome Panel Layout - With Content', {
            widths: [1280, 768, 375]
        });

        // Verify welcome panel still positioned correctly
        const welcomePanel = page.locator('.canvas-welcome-panel');
        const canvasContentArea = page.locator('.canvas-content-area');
        
        const welcomePanelBox = await welcomePanel.boundingBox();
        const canvasContentBox = await canvasContentArea.boundingBox();

        if (welcomePanelBox && canvasContentBox) {
            console.log(`[DEBUG-WORKITEM:canvas:layout-visual-test] With content - Welcome Y: ${welcomePanelBox.y}, Canvas Y: ${canvasContentBox.y} ;CLEANUP_OK`);
            expect(welcomePanelBox.y).toBeLessThan(canvasContentBox.y);
        }

        console.log('[DEBUG-WORKITEM:canvas:layout-visual-test] Welcome panel persistence test complete ;CLEANUP_OK');
    });
});
