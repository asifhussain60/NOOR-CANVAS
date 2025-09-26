import { BrowserContext, expect, Page, test } from '@playwright/test';
import path from 'path';

/**
 * NoorCanvas Simulation Harness Test
 * 
 * This test validates the modernized simulation harness that provides
 * multi-iframe testing environment for canvas session transitions.
 * 
 * Test Coverage:
 * - Modern UI design and responsive behavior
 * - Multi-iframe setup and communication
 * - SignalR monitoring capabilities  
 * - Debug console functionality
 * - Accessibility features
 */

test.describe('NoorCanvas Simulation Harness', () => {
    let page: Page;
    let context: BrowserContext;
    const harnessPath = path.resolve(__dirname, 'simulation-harness.html');

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext({
            viewport: { width: 1400, height: 900 },
            // Enable modern browser features
            permissions: ['clipboard-read', 'clipboard-write'],
        });
        page = await context.newPage();

        // Enable console logging for debugging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`[BROWSER ERROR] ${msg.text()}`);
            }
        });
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('should load simulation harness with modern design', async () => {
        // Navigate to the simulation harness
        await page.goto(`file://${harnessPath}`);

        // Wait for the page to be fully loaded
        await page.waitForLoadState('networkidle');

        // Verify main header is present with modern styling
        const header = page.locator('.simulation-header');
        await expect(header).toBeVisible();
        await expect(header.locator('h1')).toContainText('NoorCanvas Multi-Session Simulation');

        // Verify CSS custom properties are applied (check computed styles)
        const headerBg = await header.evaluate(el =>
            getComputedStyle(el).background
        );
        expect(headerBg).toContain('linear-gradient');

        // Verify modern gradient background on body
        const bodyBg = await page.evaluate(() =>
            getComputedStyle(document.body).background
        );
        expect(bodyBg).toContain('linear-gradient');
    });

    test('should display multi-iframe layout correctly', async () => {
        await page.goto(`file://${harnessPath}`);
        await page.waitForLoadState('networkidle');

        // Verify host section is present
        const hostSection = page.locator('.host-section');
        await expect(hostSection).toBeVisible();

        // Verify host iframe is present
        const hostFrame = page.locator('#host-frame');
        await expect(hostFrame).toBeVisible();

        // Verify participants section with 3 iframes
        const participantFrames = page.locator('.iframe-container.participant');
        await expect(participantFrames).toHaveCount(3);

        // Verify each participant iframe is present
        for (let i = 1; i <= 3; i++) {
            const participantFrame = page.locator(`#participant${i}-frame`);
            await expect(participantFrame).toBeVisible();
        }
    });

    test('should show connection status indicators with animations', async () => {
        await page.goto(`file://${harnessPath}`);
        await page.waitForLoadState('networkidle');

        // Verify connection status indicators are present
        const hostStatus = page.locator('#host-status');
        await expect(hostStatus).toBeVisible();

        // Check for ripple animation CSS classes
        const statusClasses = await hostStatus.getAttribute('class');
        expect(statusClasses).toContain('connection-status');

        // Verify all participant status indicators
        for (let i = 1; i <= 3; i++) {
            const participantStatus = page.locator(`#participant${i}-status`);
            await expect(participantStatus).toBeVisible();
        }
    });

    test('should display simulation controls with modern styling', async () => {
        await page.goto(`file://${harnessPath}`);
        await page.waitForLoadState('networkidle');

        // Verify simulation controls panel is present
        const controlsPanel = page.locator('.simulation-controls');
        await expect(controlsPanel).toBeVisible();

        // Verify all control buttons are present with modern styling
        const expectedButtons = [
            'Start Session',
            'Add Test Question',
            'Simulate Voting',
            'Add Participant',
            'Drop Connection',
            'Export Debug Log'
        ];

        for (const buttonText of expectedButtons) {
            const button = page.locator('.control-button', { hasText: buttonText });
            await expect(button).toBeVisible();

            // Verify modern button styling
            const buttonBg = await button.evaluate(el =>
                getComputedStyle(el).background
            );
            expect(buttonBg).toContain('linear-gradient');
        }
    });

    test('should show debug console with modern terminal styling', async () => {
        await page.goto(`file://${harnessPath}`);
        await page.waitForLoadState('networkidle');

        // Verify debug panel is present
        const debugPanel = page.locator('#debug-panel');
        await expect(debugPanel).toBeVisible();

        // Verify debug header with toggle functionality
        const debugHeader = page.locator('.debug-header');
        await expect(debugHeader).toBeVisible();
        await expect(debugHeader).toContainText('DEBUG CONSOLE');

        // Test toggle functionality
        await debugHeader.click();
        await expect(debugPanel).toHaveClass(/collapsed/);

        await debugHeader.click();
        await expect(debugPanel).not.toHaveClass(/collapsed/);

        // Verify debug log area is present
        const debugLog = page.locator('#debug-log');
        await expect(debugLog).toBeVisible();
    });

    test('should be responsive across different viewport sizes', async () => {
        await page.goto(`file://${harnessPath}`);
        await page.waitForLoadState('networkidle');

        // Test desktop viewport (default 1400x900)
        const simulationContainer = page.locator('.simulation-container');
        let gridTemplate = await simulationContainer.evaluate(el =>
            getComputedStyle(el).gridTemplateColumns
        );
        expect(gridTemplate).toContain('1.2fr 0.8fr');

        // Test tablet viewport (1024px)
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(100); // Allow CSS to apply

        gridTemplate = await simulationContainer.evaluate(el =>
            getComputedStyle(el).gridTemplateColumns
        );
        // Should change to single column layout
        expect(gridTemplate).toMatch(/1fr( 1fr)?/);

        // Test mobile viewport (768px)
        await page.setViewportSize({ width: 768, height: 600 });
        await page.waitForTimeout(100);

        // Verify participants section changes to column layout
        const participantsSection = page.locator('.participants-section');
        const participantsGrid = await participantsSection.evaluate(el =>
            getComputedStyle(el).gridTemplateColumns
        );
        expect(participantsGrid).toBe('1fr');
    });

    test('should have proper accessibility features', async () => {
        await page.goto(`file://${harnessPath}`);
        await page.waitForLoadState('networkidle');

        // Test keyboard navigation on control buttons
        const firstButton = page.locator('.control-button').first();
        await firstButton.focus();

        // Verify focus styling is applied
        const focusOutline = await firstButton.evaluate(el =>
            getComputedStyle(el).outline
        );
        expect(focusOutline).not.toBe('none');

        // Test tab navigation through all buttons
        const controlButtons = page.locator('.control-button');
        const buttonCount = await controlButtons.count();

        for (let i = 0; i < buttonCount; i++) {
            await page.keyboard.press('Tab');
            const focusedElement = await page.evaluate(() => document.activeElement?.className);
            expect(focusedElement).toContain('control-button');
        }

        // Test debug header keyboard access
        const debugHeader = page.locator('.debug-header');
        await debugHeader.focus();
        await page.keyboard.press('Enter');

        const debugPanel = page.locator('#debug-panel');
        await expect(debugPanel).toHaveClass(/collapsed/);
    });

    test('should handle simulation control interactions', async () => {
        await page.goto(`file://${harnessPath}`);
        await page.waitForLoadState('networkidle');

        // Test Start Session button
        const startButton = page.locator('.control-button', { hasText: 'Start Session' });
        await startButton.click();

        // Should log the action in debug console
        const debugLog = page.locator('#debug-log');
        await expect(debugLog).toContainText('Starting session via host interface');

        // Test Add Test Question button
        const questionButton = page.locator('.control-button', { hasText: 'Add Test Question' });
        await questionButton.click();

        await expect(debugLog).toContainText('Adding test question via participant 1');

        // Test Export Debug Log button
        const exportButton = page.locator('.control-button', { hasText: 'Export Debug Log' });

        // Set up download promise before clicking
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();

        // Verify download is triggered
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/noorcanvas-debug-.*\.log/);
    });

    test('should initialize with proper logging', async () => {
        await page.goto(`file://${harnessPath}`);
        await page.waitForLoadState('networkidle');

        // Wait for initialization to complete
        await page.waitForTimeout(2000);

        // Verify initialization logs are present
        const debugLog = page.locator('#debug-log');
        await expect(debugLog).toContainText('Starting NoorCanvas Multi-Session Simulation');
        await expect(debugLog).toContainText('Document loaded, initializing simulation');

        // Verify token generation logs
        await expect(debugLog).toContainText('Generating participant session tokens');
        await expect(debugLog).toContainText('Generated tokens for 3 participants');
    });

    test('should handle performance monitoring', async () => {
        await page.goto(`file://${harnessPath}`);
        await page.waitForLoadState('networkidle');

        // Wait for performance monitoring to initialize
        await page.waitForTimeout(1000);

        // Check if performance monitoring is active
        const hasPerformanceObserver = await page.evaluate(() => {
            return typeof PerformanceObserver !== 'undefined';
        });

        if (hasPerformanceObserver) {
            const debugLog = page.locator('#debug-log');
            // Should have some performance-related logs
            await expect(debugLog).toContainText('PERF');
        }
    });

    test('should maintain proper CSS custom properties consistency', async () => {
        await page.goto(`file://${harnessPath}`);
        await page.waitForLoadState('networkidle');

        // Verify CSS custom properties are defined
        const primaryGold = await page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--primary-gold').trim()
        );
        expect(primaryGold).toBe('#D4AF37');

        const primaryGreen = await page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--primary-green').trim()
        );
        expect(primaryGreen).toBe('#006400');

        const borderRadius = await page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--border-radius').trim()
        );
        expect(borderRadius).toBe('12px');
    });

    // Negative path testing
    test('should handle iframe load failures gracefully', async () => {
        await page.goto(`file://${harnessPath}`);
        await page.waitForLoadState('networkidle');

        // Simulate iframe load failure by setting invalid src
        await page.evaluate(() => {
            const frame = document.getElementById('host-frame') as HTMLIFrameElement;
            frame.src = 'https://invalid-url-that-should-fail.local';
        });

        // Wait for error to be logged
        await page.waitForTimeout(2000);

        // Verify error handling in debug console
        const debugLog = page.locator('#debug-log');
        // Should not crash the application
        await expect(debugLog).toBeVisible();
    });
});