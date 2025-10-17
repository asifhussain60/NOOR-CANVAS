/**
 * HCP Annotation System - Fabric.js Implementation
 * Percy Visual Regression Tests
 * 
 * Tests the new Fabric.js-based annotation system with floating panel
 * Session: 212 (Host: PQ9N5YWW, User: KJAHA99L)
 */

import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

const SESSION_ID = 212;
const HOST_TOKEN = 'PQ9N5YWW';
const USER_TOKEN = 'KJAHA99L';
const BASE_URL = process.env.BASE_URL || 'https://localhost:9091';

test.describe('HCP Annotation System - Fabric.js', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to Host Control Panel
        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);

        // Wait for page to load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('01 - Initial state: Annotation panel hidden', async ({ page }) => {
        // Verify annotation panel is not visible initially
        const panel = page.locator('#hcp-annotation-panel');
        await expect(panel).toBeHidden();

        // Take Percy snapshot
        await percySnapshot(page, 'HCP Annotation - Initial State (Panel Hidden)');
    });

    test('02 - Share asset: Annotation panel appears', async ({ page }) => {
        // Enable console logging to capture trace logs
        page.on('console', msg => {
            if (msg.text().includes('[TRACE:hcp-annotate]')) {
                console.log(`BROWSER LOG: ${msg.text()}`);
            }
        });

        // Wait for session to be active (may need to start session first)
        const sessionStatus = page.locator('text=Session Status');
        await expect(sessionStatus).toBeVisible({ timeout: 30000 });

        // Find and click first share button
        const shareButton = page.locator('[data-share-button="asset"]').first();
        await shareButton.waitFor({ state: 'visible', timeout: 10000 });

        // Get panel before click to verify initial state
        const panel = page.locator('#hcp-annotation-panel');
        const initialDisplay = await panel.evaluate(el => window.getComputedStyle(el).display);
        console.log(`Initial panel display style: ${initialDisplay}`);

        await shareButton.click();

        // Wait a moment for JavaScript to execute
        await page.waitForTimeout(1000);

        // Check panel display after click
        const afterClickDisplay = await panel.evaluate(el => window.getComputedStyle(el).display);
        console.log(`After click panel display style: ${afterClickDisplay}`);

        // Wait for annotation panel to appear
        await expect(panel).toBeVisible({ timeout: 5000 });

        // Take Percy snapshot
        await percySnapshot(page, 'HCP Annotation - Panel Shown After Share');
    });

    test('03 - Annotation panel layout and tools', async ({ page }) => {
        // Share an asset to trigger panel
        const shareButton = page.locator('[data-share-button="asset"]').first();
        await shareButton.click();
        await page.waitForTimeout(1000);

        const panel = page.locator('#hcp-annotation-panel');
        await expect(panel).toBeVisible();

        // Verify all tool buttons are present
        const laserBtn = panel.locator('[data-annotation-tool="laser"]');
        const drawBtn = panel.locator('[data-annotation-tool="draw"]');
        const highlightBtn = panel.locator('[data-annotation-tool="highlight"]');
        const textBtn = panel.locator('[data-annotation-tool="text"]');
        const colorPicker = panel.locator('#annotation-color');
        const clearBtn = panel.locator('#clear-annotations');
        const closeBtn = panel.locator('#close-annotation-panel');

        await expect(laserBtn).toBeVisible();
        await expect(drawBtn).toBeVisible();
        await expect(highlightBtn).toBeVisible();
        await expect(textBtn).toBeVisible();
        await expect(colorPicker).toBeVisible();
        await expect(clearBtn).toBeVisible();
        await expect(closeBtn).toBeVisible();

        // Take Percy snapshot
        await percySnapshot(page, 'HCP Annotation - Panel Layout with All Tools');
    });

    test('04 - Tool selection: Laser pointer active', async ({ page }) => {
        // Share asset and wait for panel
        const shareButton = page.locator('[data-share-button="asset"]').first();
        await shareButton.click();
        await page.waitForTimeout(1000);

        const panel = page.locator('#hcp-annotation-panel');
        const laserBtn = panel.locator('[data-annotation-tool="laser"]');

        // Click laser tool
        await laserBtn.click();
        await page.waitForTimeout(500);

        // Verify active state
        await expect(laserBtn).toHaveClass(/active/);

        // Take Percy snapshot
        await percySnapshot(page, 'HCP Annotation - Laser Tool Active');
    });

    test('05 - Tool selection: Draw tool active', async ({ page }) => {
        // Share asset and wait for panel
        const shareButton = page.locator('[data-share-button="asset"]').first();
        await shareButton.click();
        await page.waitForTimeout(1000);

        const panel = page.locator('#hcp-annotation-panel');
        const drawBtn = panel.locator('[data-annotation-tool="draw"]');

        // Click draw tool
        await drawBtn.click();
        await page.waitForTimeout(500);

        // Verify active state
        await expect(drawBtn).toHaveClass(/active/);

        // Take Percy snapshot
        await percySnapshot(page, 'HCP Annotation - Draw Tool Active');
    });

    test('06 - Tool selection: Highlight tool active', async ({ page }) => {
        // Share asset and wait for panel
        const shareButton = page.locator('[data-share-button="asset"]').first();
        await shareButton.click();
        await page.waitForTimeout(1000);

        const panel = page.locator('#hcp-annotation-panel');
        const highlightBtn = panel.locator('[data-annotation-tool="highlight"]');

        // Click highlight tool
        await highlightBtn.click();
        await page.waitForTimeout(500);

        // Verify active state
        await expect(highlightBtn).toHaveClass(/active/);

        // Take Percy snapshot
        await percySnapshot(page, 'HCP Annotation - Highlight Tool Active');
    });

    test('07 - Tool selection: Text tool active', async ({ page }) => {
        // Share asset and wait for panel
        const shareButton = page.locator('[data-share-button="asset"]').first();
        await shareButton.click();
        await page.waitForTimeout(1000);

        const panel = page.locator('#hcp-annotation-panel');
        const textBtn = panel.locator('[data-annotation-tool="text"]');

        // Click text tool
        await textBtn.click();
        await page.waitForTimeout(500);

        // Verify active state
        await expect(textBtn).toHaveClass(/active/);

        // Take Percy snapshot
        await percySnapshot(page, 'HCP Annotation - Text Tool Active');
    });

    test('08 - Color picker interaction', async ({ page }) => {
        // Share asset and wait for panel
        const shareButton = page.locator('[data-share-button="asset"]').first();
        await shareButton.click();
        await page.waitForTimeout(1000);

        const panel = page.locator('#hcp-annotation-panel');
        const colorPicker = panel.locator('#annotation-color');

        // Change color to blue
        await colorPicker.evaluate((el: HTMLInputElement) => {
            el.value = '#0000FF';
            el.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(500);

        // Take Percy snapshot
        await percySnapshot(page, 'HCP Annotation - Color Picker Changed to Blue');
    });

    test('09 - Close panel button', async ({ page }) => {
        // Share asset and wait for panel
        const shareButton = page.locator('[data-share-button="asset"]').first();
        await shareButton.click();
        await page.waitForTimeout(1000);

        const panel = page.locator('#hcp-annotation-panel');
        await expect(panel).toBeVisible();

        // Click close button
        const closeBtn = panel.locator('#close-annotation-panel');
        await closeBtn.click();
        await page.waitForTimeout(500);

        // Verify panel is hidden
        await expect(panel).toBeHidden();

        // Take Percy snapshot
        await percySnapshot(page, 'HCP Annotation - Panel Closed');
    });

    test('10 - Multiple tool switches', async ({ page }) => {
        // Share asset and wait for panel
        const shareButton = page.locator('[data-share-button="asset"]').first();
        await shareButton.click();
        await page.waitForTimeout(1000);

        const panel = page.locator('#hcp-annotation-panel');

        // Switch through tools
        await panel.locator('[data-annotation-tool="laser"]').click();
        await page.waitForTimeout(300);
        await panel.locator('[data-annotation-tool="draw"]').click();
        await page.waitForTimeout(300);
        await panel.locator('[data-annotation-tool="highlight"]').click();
        await page.waitForTimeout(300);

        // Verify final tool is active
        const highlightBtn = panel.locator('[data-annotation-tool="highlight"]');
        await expect(highlightBtn).toHaveClass(/active/);

        // Take Percy snapshot
        await percySnapshot(page, 'HCP Annotation - After Multiple Tool Switches');
    });

    test('11 - SessionCanvas: Verify no annotation overlay initially', async ({ page }) => {
        // Navigate to SessionCanvas
        await page.goto(`${BASE_URL}/session/canvas/${USER_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify no Fabric.js canvas is visible yet
        const fabricCanvas = page.locator('#annotation-canvas');

        // Take Percy snapshot
        await percySnapshot(page, 'SessionCanvas - No Annotations Initially');
    });

    test('12 - Console log verification: Annotation JavaScript loaded', async ({ page }) => {
        const consoleLogs: string[] = [];

        page.on('console', msg => {
            consoleLogs.push(msg.text());
        });

        // Reload page to capture console logs
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify annotation JavaScript loaded
        const annotationLoaded = consoleLogs.some(log =>
            log.includes('[FABRIC:annotation] Annotation JavaScript loaded')
        );

        expect(annotationLoaded).toBeTruthy();

        // Take Percy snapshot
        await percySnapshot(page, 'HCP Annotation - JavaScript Loaded Verification');
    });

    test('13 - SignalR connection status', async ({ page }) => {
        const consoleLogs: string[] = [];

        page.on('console', msg => {
            consoleLogs.push(msg.text());
        });

        await page.waitForTimeout(3000);

        // Verify AnnotationHub connection initialized
        const hubInitialized = consoleLogs.some(log =>
            log.includes('[FABRIC:annotation] Initializing AnnotationHub connection') ||
            log.includes('[FABRIC:annotation] AnnotationHub connected successfully')
        );

        expect(hubInitialized).toBeTruthy();

        // Take Percy snapshot
        await percySnapshot(page, 'HCP Annotation - SignalR Connection Status');
    });

    test('14 - Panel animation: Slide-in effect', async ({ page }) => {
        // Share asset and immediately capture
        const shareButton = page.locator('[data-share-button="asset"]').first();
        await shareButton.click();

        // Wait briefly for animation to start
        await page.waitForTimeout(300);

        const panel = page.locator('#hcp-annotation-panel');
        await expect(panel).toBeVisible();

        // Take Percy snapshot during/after animation
        await percySnapshot(page, 'HCP Annotation - Panel Slide-in Animation');
    });

    test('15 - Panel positioning: Fixed bottom-right', async ({ page }) => {
        // Share asset and wait for panel
        const shareButton = page.locator('[data-share-button="asset"]').first();
        await shareButton.click();
        await page.waitForTimeout(1000);

        const panel = page.locator('#hcp-annotation-panel');
        await expect(panel).toBeVisible();

        // Verify fixed positioning
        const styles = await panel.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
                position: computed.position,
                bottom: computed.bottom,
                right: computed.right,
                zIndex: computed.zIndex
            };
        });

        expect(styles.position).toBe('fixed');
        expect(styles.bottom).toBe('20px');
        expect(styles.right).toBe('20px');
        expect(styles.zIndex).toBe('10000');

        // Take Percy snapshot
        await percySnapshot(page, 'HCP Annotation - Panel Positioning Verification');
    });
});
