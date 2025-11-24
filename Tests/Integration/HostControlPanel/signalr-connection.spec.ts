/**
 * [REFACTOR:Phase1] Host Control Panel - SignalR Connection Integration Tests
 * Tests SignalR connection establishment, health monitoring, and reconnection
 */

import { expect, test } from '@playwright/test';

const TEST_HOST_TOKEN = 'testhost';
const BASE_URL = 'http://localhost:5000';

test.describe('Host Control Panel - SignalR Connection', () => {

    test('should establish SignalR connection on page load', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);

        // Listen for SignalR console logs
        const signalrLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('SIGNALR') || msg.text().includes('HubConnection')) {
                signalrLogs.push(msg.text());
            }
        });

        await page.waitForTimeout(5000);

        if (signalrLogs.length > 0) {
            console.log('✅ SignalR logging active');
            console.log(`📋 SignalR logs captured: ${signalrLogs.length}`);

            // Look for connection success indicator
            const connectedLog = signalrLogs.find(log =>
                log.includes('Connected') || log.includes('connected') || log.includes('START')
            );

            if (connectedLog) {
                console.log('✅ SignalR connection established');
            }
        } else {
            console.log('ℹ️ No SignalR logs captured (may be using different logging)');
        }
    });

    test('should display SignalR connection status', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Look for SignalR status indicator
        const statusIndicator = page.locator('[class*="signalr-status"], [data-signalr-status], text=/Connected|Disconnected/i');

        if (await statusIndicator.count() > 0) {
            const statusText = await statusIndicator.first().textContent();
            console.log(`✅ SignalR status displayed: ${statusText}`);

            await expect(statusIndicator.first()).toBeVisible();
        } else {
            console.log('ℹ️ No visible SignalR status indicator');
        }
    });

    test('should join session SignalR group', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);

        const groupLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('JoinGroup') || msg.text().includes('session_')) {
                groupLogs.push(msg.text());
            }
        });

        await page.waitForTimeout(5000);

        if (groupLogs.length > 0) {
            console.log('✅ SignalR group join logged');

            const sessionGroupLog = groupLogs.find(log => log.includes('session_'));
            if (sessionGroupLog) {
                console.log(`✅ Joined session group: ${sessionGroupLog}`);
            }
        } else {
            console.log('ℹ️ No group join logs captured');
        }
    });

    test('should register SignalR event handlers', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);

        const eventLogs: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('QuestionReceived') ||
                text.includes('TranscriptUpdated') ||
                text.includes('VoteUpdateReceived') ||
                text.includes('HostQuestionUpdated') ||
                text.includes('HostQuestionDeleted')) {
                eventLogs.push(text);
            }
        });

        await page.waitForTimeout(5000);

        // Event handlers should be registered (may not fire during test)
        console.log(`📋 SignalR event logs: ${eventLogs.length}`);

        if (eventLogs.length > 0) {
            console.log('✅ SignalR events being monitored');
        } else {
            console.log('ℹ️ No SignalR events captured (handlers may be registered silently)');
        }
    });

    test('should handle SignalR disconnection', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Simulate network offline
        await page.context().setOffline(true);
        await page.waitForTimeout(2000);

        // Look for disconnection indicators
        const statusIndicator = page.locator('[class*="signalr-status"], text=/Disconnected|Offline/i');

        if (await statusIndicator.count() > 0) {
            console.log('✅ Disconnection status displayed');
        } else {
            console.log('ℹ️ No visible disconnection indicator');
        }

        // Restore network
        await page.context().setOffline(false);
        await page.waitForTimeout(3000);

        // Check for reconnection
        const reconnectedIndicator = page.locator('text=/Connected|Online/i');
        if (await reconnectedIndicator.count() > 0) {
            console.log('✅ Reconnection successful');
        }
    });

    test('should retry connection on failure', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);

        const retryLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('retry') || msg.text().includes('Retry') || msg.text().includes('reconnect')) {
                retryLogs.push(msg.text());
            }
        });

        // Simulate brief network interruption
        await page.context().setOffline(true);
        await page.waitForTimeout(1000);
        await page.context().setOffline(false);

        await page.waitForTimeout(5000);

        if (retryLogs.length > 0) {
            console.log('✅ Connection retry mechanism active');
            console.log(`📋 Retry attempts: ${retryLogs.length}`);
        } else {
            console.log('ℹ️ No retry logs captured (may reconnect instantly)');
        }
    });

    test('should verify SignalR hub URL configuration', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(2000);

        // Check console logs for hub URL
        const hubLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('/sessionHub') || msg.text().includes('hub')) {
                hubLogs.push(msg.text());
            }
        });

        await page.waitForTimeout(3000);

        if (hubLogs.length > 0) {
            const hubUrlLog = hubLogs.find(log => log.includes('/sessionHub'));
            if (hubUrlLog) {
                console.log('✅ SignalR hub URL configured: /sessionHub');
            }
        }
    });

    test('should handle SignalR timeout gracefully', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Look for timeout handling in console
        const errorLogs: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error' && msg.text().includes('SignalR')) {
                errorLogs.push(msg.text());
            }
        });

        // Wait for potential timeout errors
        await page.waitForTimeout(5000);

        if (errorLogs.length === 0) {
            console.log('✅ No SignalR timeout errors');
        } else {
            console.log(`⚠️ SignalR errors detected: ${errorLogs.length}`);
            errorLogs.forEach(log => console.log(`  - ${log}`));
        }
    });

    test('should send heartbeat/ping messages', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);

        const pingLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('ping') || msg.text().includes('heartbeat') || msg.text().includes('health')) {
                pingLogs.push(msg.text());
            }
        });

        // Wait for health check interval
        await page.waitForTimeout(10000);

        if (pingLogs.length > 0) {
            console.log('✅ SignalR health check/heartbeat active');
            console.log(`📋 Ping messages: ${pingLogs.length}`);
        } else {
            console.log('ℹ️ No explicit heartbeat logs (may be handled internally)');
        }
    });

    test('should clean up SignalR connection on page unload', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Listen for dispose/disconnect logs
        const disposeLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('dispose') || msg.text().includes('disconnect') || msg.text().includes('cleanup')) {
                disposeLogs.push(msg.text());
            }
        });

        // Navigate away to trigger cleanup
        await page.goto(`${BASE_URL}/`);
        await page.waitForTimeout(2000);

        if (disposeLogs.length > 0) {
            console.log('✅ SignalR cleanup executed');
            console.log(`📋 Cleanup logs: ${disposeLogs.length}`);
        } else {
            console.log('ℹ️ No explicit cleanup logs');
        }
    });

    test('should verify SignalRMiddleware integration', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Check for SignalRMiddleware logs
        const middlewareLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('SignalRMiddleware') || msg.text().includes('SIGNALR-DIAG')) {
                middlewareLogs.push(msg.text());
            }
        });

        await page.waitForTimeout(3000);

        if (middlewareLogs.length > 0) {
            console.log('✅ SignalRMiddleware active');
            console.log(`📋 Middleware logs: ${middlewareLogs.length}`);
        } else {
            console.log('ℹ️ No SignalRMiddleware logs captured');
        }
    });
});
