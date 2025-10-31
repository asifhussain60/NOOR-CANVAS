/**
 * Blazor Startup Infrastructure Tests
 * Generated from test-prep session: 20251031120000
 * Quality: 85% (High)
 * 
 * Tests Blazor Server startup sequence and initialization
 * Based on browser logs (line 73): "Blazor server connection auto-established"
 */

import { expect, test } from '@playwright/test';

test.describe('Blazor Startup Infrastructure', () => {
    test('should establish Blazor server connection automatically', async ({ page }) => {
        // Arrange: Capture console logs
        const startupLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('BLAZOR-STARTUP') ||
                msg.text().includes('Blazor server connection')) {
                startupLogs.push(msg.text());
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: Blazor auto-connect log present
        const hasAutoConnect = startupLogs.some(log =>
            log.includes('Blazor server connection auto-established')
        );
        expect(hasAutoConnect).toBeTruthy();
    });

    test('should load NOOR Canvas application', async ({ page }) => {
        // Arrange: Capture init logs
        const noorLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('NOOR-INIT') ||
                msg.text().includes('NOOR Canvas application')) {
                noorLogs.push(msg.text());
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: NOOR Canvas loaded log present (browser log line 8)
        const hasNoorInit = noorLogs.some(log =>
            log.includes('NOOR Canvas application loaded')
        );
        expect(hasNoorInit).toBeTruthy();
    });

    test('should initialize browser logger', async ({ page }) => {
        // Arrange: Capture logger logs
        const loggerLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('NOOR-BROWSER') ||
                msg.text().includes('Browser logger initialized')) {
                loggerLogs.push(msg.text());
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: Browser logger initialized (browser log line 18)
        const hasLoggerInit = loggerLogs.some(log =>
            log.includes('Browser logger initialized')
        );
        expect(hasLoggerInit).toBeTruthy();
    });

    test('should normalize Blazor SignalR URL to HTTPS', async ({ page }) => {
        // Arrange: Capture Blazor logs
        const blazorLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('Normalizing') ||
                msg.text().includes('_blazor')) {
                blazorLogs.push(msg.text());
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: Normalization log present (browser log line 7)
        const hasNormalization = blazorLogs.some(log =>
            log.includes("Normalizing '_blazor' to 'https://localhost:9091/_blazor'")
        );
        expect(hasNormalization).toBeTruthy();
    });

    test('should complete Blazor startup within 5 seconds', async ({ page }) => {
        // Arrange: Track startup time
        const startTime = Date.now();
        let blazorReady = false;

        page.on('console', msg => {
            if (msg.text().includes('Blazor server connection auto-established')) {
                blazorReady = true;
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000);

        // Assert: Blazor ready within 5 seconds
        const elapsedTime = Date.now() - startTime;
        expect(blazorReady).toBe(true);
        expect(elapsedTime).toBeLessThan(5000);
    });
});
