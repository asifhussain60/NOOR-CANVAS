/**
 * Share System Infrastructure Tests
 * Generated from test-prep session: 20251031120000
 * Quality: 78% (Medium)
 * 
 * Tests share button system initialization and styling
 * Based on browser logs (lines 65-72): Share system initialization, button styling
 */

import { expect, test } from '@playwright/test';

test.describe('Share System Infrastructure', () => {
    test('should load share system on page load', async ({ page }) => {
        // Arrange: Capture console logs
        const shareLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('[NOOR-SHARE]')) {
                shareLogs.push(msg.text());
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: Share system loaded log present
        const hasLoadedLog = shareLogs.some(log =>
            log.includes('Definitive share button system loaded and ready')
        );
        expect(hasLoadedLog).toBeTruthy();
    });

    test('should initialize share system after DOM ready', async ({ page }) => {
        // Arrange: Capture initialization logs
        const initLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('[NOOR-SHARE] Initializing') ||
                msg.text().includes('Share system initialized')) {
                initLogs.push(msg.text());
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: Initialization completed
        const hasSuccessLog = initLogs.some(log =>
            log.includes('Share system initialized successfully')
        );
        expect(hasSuccessLog).toBeTruthy();
    });

    test('should report zero share buttons if none exist', async ({ page }) => {
        // Arrange: Capture styling logs
        const stylingLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('Styling') && msg.text().includes('share buttons')) {
                stylingLogs.push(msg.text());
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: First styling log shows "Styling 0 existing share buttons"
        const hasZeroButtonsLog = stylingLogs.some(log =>
            log.includes('Styling 0 existing share buttons')
        );
        expect(hasZeroButtonsLog).toBeTruthy();
    });

    test('should initialize share system multiple times during component renders', async ({ page }) => {
        // Arrange: Capture all initialization logs
        const allInitLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('[NOOR-SHARE] Initializing definitive share button system')) {
                allInitLogs.push(msg.text());
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Assert: Multiple initializations occurred (based on logs showing 6+ calls)
        expect(allInitLogs.length).toBeGreaterThanOrEqual(3);
    });

    test('should expose share system as global module', async ({ page }) => {
        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: Check if share system is available globally
        const hasShareSystem = await page.evaluate(() => {
            // Check if noor-share-system.js is loaded
            const scripts = Array.from(document.scripts);
            return scripts.some(s => s.src.includes('noor-share-system'));
        });
        expect(hasShareSystem).toBeTruthy();
    });
});
