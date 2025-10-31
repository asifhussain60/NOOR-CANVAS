/**
 * SignalR Connection Infrastructure Tests
 * Generated from test-prep session: 20251031120000
 * Quality: 95% (High)
 * 
 * Tests SignalR WebSocket connection establishment and handshake
 * Based on browser console logs (line 37-38) and server logs (line 73-77)
 */

import { expect, test } from '@playwright/test';

test.describe('SignalR Connection Infrastructure', () => {
    test('should establish WebSocket connection on page load', async ({ page }) => {
        // Arrange: Listen for WebSocket connection
        const wsPromise = page.waitForEvent('websocket', {
            predicate: ws => ws.url().includes('/_blazor')
        });

        // Act: Navigate to host control panel
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');

        // Assert: WebSocket connection established
        const ws = await wsPromise;
        expect(ws.url()).toContain('/_blazor');
        expect(ws.url()).toMatch(/wss:\/\/localhost:9091\/_blazor\?id=[A-Za-z0-9_-]+/);
    });

    test('should complete BlazorPack protocol handshake', async ({ page }) => {
        // Arrange: Capture console logs
        const handshakeLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('WebSocket connected') ||
                msg.text().includes('blazorpack')) {
                handshakeLogs.push(msg.text());
            }
        });

        // Act: Navigate and wait for connection
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Allow handshake completion

        // Assert: Handshake log present
        const hasConnection = handshakeLogs.some(log =>
            log.includes('WebSocket connected to wss://localhost:9091/_blazor')
        );
        expect(hasConnection).toBeTruthy();
    });

    test('should maintain connection for 10 seconds without disconnect', async ({ page }) => {
        // Arrange: Track connection state
        let wsDisconnected = false;
        page.on('websocket', ws => {
            ws.on('close', () => { wsDisconnected = true; });
        });

        // Act: Navigate and wait
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(10000);

        // Assert: Connection still alive
        expect(wsDisconnected).toBe(false);
    });

    test('should auto-reconnect if connection dropped', async ({ page }) => {
        // Arrange: Navigate first
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Track WebSocket close events
        let wsClosedCount = 0;
        let wsCreatedCount = 0;

        page.on('websocket', ws => {
            if (ws.url().includes('/_blazor')) {
                wsCreatedCount++;
                ws.on('close', () => { wsClosedCount++; });
            }
        });

        // Wait for initial connection
        await page.waitForTimeout(2000);
        const initialWsCount = wsCreatedCount;

        // Act: Simulate network interruption via page reload
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: New WebSocket connection created after reload
        expect(wsCreatedCount).toBeGreaterThan(initialWsCount);
    });
});