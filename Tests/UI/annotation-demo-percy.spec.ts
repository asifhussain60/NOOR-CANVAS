import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

/**
 * Percy Visual Regression Tests - Annotation System Demo
 * 
 * Tests the annotation demo page with two-iframe synchronized annotation system.
 * Captures visual evidence of:
 * - Initial page load
 * - SignalR connection established
 * - Laser pointer functionality
 * - Drawing annotations
 * - Highlight annotations
 * - Note annotations
 * - Event log updates
 */

test.describe('Annotation Demo - Visual Regression Tests', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to annotation demo page
        await page.goto('https://localhost:9091/annotation-demo.html');

        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');

        // Wait for key elements to be visible
        await expect(page.locator('h1:has-text("NOOR Canvas - Annotation System Demo")')).toBeVisible();
    });

    test('01 - Initial page load with all UI elements', async ({ page }) => {
        // Verify all major sections are present
        await expect(page.locator('text=Configuration')).toBeVisible();
        await expect(page.locator('text=Annotation Tools')).toBeVisible();
        await expect(page.locator('text=View 1: Annotation Creator')).toBeVisible();
        await expect(page.locator('text=View 2: Annotation Receiver')).toBeVisible();
        await expect(page.locator('text=Event Log')).toBeVisible();

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Initial Load', {
            widths: [1280, 1920],
            minHeight: 1024
        });
    });

    test('02 - SignalR connection status - disconnected state', async ({ page }) => {
        // Verify disconnected status
        const statusIndicator = page.locator('#connection-status');
        await expect(statusIndicator).toHaveClass(/status-disconnected/);

        const statusText = page.locator('#connection-text');
        await expect(statusText).toHaveText('Disconnected');

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - SignalR Disconnected', {
            widths: [1280]
        });
    });

    test('03 - SignalR connection attempt', async ({ page }) => {
        // Click connect button
        const connectBtn = page.locator('#connect-btn');
        await connectBtn.click();

        // Wait a moment for connection attempt
        await page.waitForTimeout(2000);

        // Check event log for connection messages
        const eventLog = page.locator('#event-log');
        await expect(eventLog).toContainText('SignalR', { timeout: 5000 });

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - SignalR Connecting', {
            widths: [1280]
        });
    });

    test('04 - Annotation tools panel', async ({ page }) => {
        // Verify all tool buttons are present
        await expect(page.locator('button[data-tool="select"]')).toBeVisible();
        await expect(page.locator('button[data-tool="laser"]')).toBeVisible();
        await expect(page.locator('button[data-tool="drawing"]')).toBeVisible();
        await expect(page.locator('button[data-tool="highlight"]')).toBeVisible();
        await expect(page.locator('button[data-tool="note"]')).toBeVisible();

        // Verify color picker
        await expect(page.locator('#annotation-color')).toBeVisible();

        // Verify clear button
        await expect(page.locator('#clear-annotations')).toBeVisible();

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Tools Panel', {
            widths: [1280]
        });
    });

    test('05 - Laser pointer tool selection', async ({ page }) => {
        // Select laser pointer tool
        const laserBtn = page.locator('button[data-tool="laser"]');
        await laserBtn.click();

        // Verify tool is active
        await expect(laserBtn).toHaveClass(/active/);

        // Check event log
        const eventLog = page.locator('#event-log');
        await expect(eventLog).toContainText('Laser pointer activated');

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Laser Pointer Selected', {
            widths: [1280]
        });
    });

    test('06 - Drawing tool selection', async ({ page }) => {
        // Select drawing tool
        const drawBtn = page.locator('button[data-tool="drawing"]');
        await drawBtn.click();

        // Verify tool is active
        await expect(drawBtn).toHaveClass(/active/);

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Drawing Tool Selected', {
            widths: [1280]
        });
    });

    test('07 - Highlight tool selection', async ({ page }) => {
        // Select highlight tool
        const highlightBtn = page.locator('button[data-tool="highlight"]');
        await highlightBtn.click();

        // Verify tool is active
        await expect(highlightBtn).toHaveClass(/active/);

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Highlight Tool Selected', {
            widths: [1280]
        });
    });

    test('08 - Color picker interaction', async ({ page }) => {
        // Change color
        const colorPicker = page.locator('#annotation-color');
        await colorPicker.fill('#ff0000'); // Red

        // Verify event log shows color change
        const eventLog = page.locator('#event-log');
        await expect(eventLog).toContainText('Color changed');

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Color Changed to Red', {
            widths: [1280]
        });
    });

    test('09 - Iframe content visibility', async ({ page }) => {
        // Wait for iframes to load
        await page.waitForTimeout(1000);

        // Verify both iframes are present
        const iframe1 = page.locator('#iframe-1');
        const iframe2 = page.locator('#iframe-2');

        await expect(iframe1).toBeVisible();
        await expect(iframe2).toBeVisible();

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Dual Iframes Loaded', {
            widths: [1280, 1920]
        });
    });

    test('10 - Event log with multiple entries', async ({ page }) => {
        // Trigger multiple events
        await page.locator('button[data-tool="laser"]').click();
        await page.waitForTimeout(500);

        await page.locator('button[data-tool="drawing"]').click();
        await page.waitForTimeout(500);

        await page.locator('#annotation-color').fill('#00ff00');
        await page.waitForTimeout(500);

        // Verify event log has multiple entries
        const eventLog = page.locator('#event-log');
        const logEntries = eventLog.locator('.log-entry');
        await expect(logEntries).toHaveCount(4, { timeout: 5000 }); // Initial + 3 actions

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Event Log Multiple Entries', {
            widths: [1280]
        });
    });

    test('11 - Configuration panel with session details', async ({ page }) => {
        // Verify configuration inputs
        const sessionId = page.locator('#session-id');
        const userId = page.locator('#user-id');
        const contentUrl = page.locator('#content-url');

        await expect(sessionId).toHaveValue('999');
        await expect(userId).toHaveValue('demo-user-1');
        await expect(contentUrl).toHaveValue('https://example.com');

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Configuration Panel', {
            widths: [1280]
        });
    });

    test('12 - Full page with all tools and states', async ({ page }) => {
        // Try to connect
        await page.locator('#connect-btn').click();
        await page.waitForTimeout(2000);

        // Select drawing tool
        await page.locator('button[data-tool="drawing"]').click();
        await page.waitForTimeout(500);

        // Change color to yellow
        await page.locator('#annotation-color').fill('#ffff00');
        await page.waitForTimeout(500);

        // Take comprehensive Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Full Page State', {
            widths: [1280, 1440, 1920],
            minHeight: 1200
        });
    });

    test('13 - Mobile responsive view', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 812 });

        // Wait for responsive layout
        await page.waitForTimeout(500);

        // Verify page is still usable
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('text=Annotation Tools')).toBeVisible();

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Mobile View', {
            widths: [375, 414]
        });
    });

    test('14 - Tablet responsive view', async ({ page }) => {
        // Set tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });

        // Wait for responsive layout
        await page.waitForTimeout(500);

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Tablet View', {
            widths: [768, 834]
        });
    });

    test('15 - Documentation section visibility', async ({ page }) => {
        // Scroll to documentation section
        await page.locator('text=How It Works').scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        // Verify documentation sections
        await expect(page.locator('text=Architecture')).toBeVisible();
        await expect(page.locator('text=Features')).toBeVisible();
        await expect(page.locator('text=Better Alternatives')).toBeVisible();

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Documentation Section', {
            widths: [1280]
        });
    });

    test('16 - Error state simulation', async ({ page }) => {
        // Simulate error by trying to connect with invalid session
        await page.locator('#session-id').fill('-1');
        await page.locator('#connect-btn').click();
        await page.waitForTimeout(2000);

        // Check event log for any error messages
        const eventLog = page.locator('#event-log');

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Error State', {
            widths: [1280]
        });
    });

    test('17 - Clear log functionality', async ({ page }) => {
        // Generate some log entries
        await page.locator('button[data-tool="laser"]').click();
        await page.locator('button[data-tool="drawing"]').click();

        // Clear the log
        await page.locator('#clear-log').click();
        await page.waitForTimeout(500);

        // Verify log is cleared
        const eventLog = page.locator('#event-log');
        await expect(eventLog).toContainText('Log cleared');

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Log Cleared', {
            widths: [1280]
        });
    });

    test('18 - SVG annotation overlays present', async ({ page }) => {
        // Verify SVG overlays exist
        const overlay1 = page.locator('#annotation-overlay-1');
        const overlay2 = page.locator('#annotation-overlay-2');

        await expect(overlay1).toBeVisible();
        await expect(overlay2).toBeVisible();

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - SVG Overlays', {
            widths: [1280]
        });
    });

    test('19 - Laser pointer elements', async ({ page }) => {
        // Check laser pointer elements exist
        const laserPointer1 = page.locator('#laser-pointer-1');
        const laserPointer2 = page.locator('#laser-pointer-2');

        // They should be hidden initially
        await expect(laserPointer1).toBeHidden();
        await expect(laserPointer2).toBeHidden();

        // Take Percy snapshot
        await percySnapshot(page, 'Annotation Demo - Laser Pointers Hidden', {
            widths: [1280]
        });
    });

    test('20 - Complete user journey', async ({ page }) => {
        // Simulate a complete user journey

        // Step 1: View initial page
        await page.waitForTimeout(500);
        await percySnapshot(page, 'Journey Step 1 - Initial View', { widths: [1280] });

        // Step 2: Configure session
        await page.locator('#session-id').fill('123');
        await page.locator('#user-id').fill('test-user');
        await page.waitForTimeout(300);
        await percySnapshot(page, 'Journey Step 2 - Configuration', { widths: [1280] });

        // Step 3: Attempt connection
        await page.locator('#connect-btn').click();
        await page.waitForTimeout(1500);
        await percySnapshot(page, 'Journey Step 3 - Connect Attempt', { widths: [1280] });

        // Step 4: Select laser pointer
        await page.locator('button[data-tool="laser"]').click();
        await page.waitForTimeout(500);
        await percySnapshot(page, 'Journey Step 4 - Laser Selected', { widths: [1280] });

        // Step 5: Switch to drawing
        await page.locator('button[data-tool="drawing"]').click();
        await page.waitForTimeout(500);
        await percySnapshot(page, 'Journey Step 5 - Drawing Tool', { widths: [1280] });

        // Step 6: Change color
        await page.locator('#annotation-color').fill('#ff00ff');
        await page.waitForTimeout(500);
        await percySnapshot(page, 'Journey Step 6 - Color Changed', { widths: [1280] });
    });
});
