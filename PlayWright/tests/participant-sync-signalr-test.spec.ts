/**
 * COPILOT-DEBUG: SignalR Participant Sync Issue Test
 * 
 * This test verifies that participant list updates are synchronized in real-time
 * via SignalR between multiple browser sessions sharing the same UserToken.
 * 
 * ISSUE FOUND: Server broadcasts to "usertoken_{token}" but client joins "session_{sessionId}"
 * 
 * Expected: Participant count updates should be visible within 3 seconds across all sessions
 * Current: Updates only visible on page refresh due to SignalR group mismatch
 */

import { BrowserContext, expect, Page, test } from '@playwright/test';

test.describe('COPILOT-DEBUG: SignalR Participant Synchronization', () => {
    const BASE_URL = 'https://localhost:9091';
    const TEST_TOKEN = 'M7C5DS3D'; // Known token from database

    let contexts: BrowserContext[] = [];
    let pages: Page[] = [];

    test.beforeEach(async ({ browser }) => {
        // Clear any existing contexts
        contexts = [];
        pages = [];
    });

    test.afterEach(async () => {
        // Clean up all contexts
        for (const context of contexts) {
            await context.close();
        }
    });

    test('COPILOT-DEBUG: Participant list should sync via SignalR in real-time', async ({ browser }) => {
        console.log('🔍 COPILOT-DEBUG: Testing SignalR participant synchronization...');

        // Create 3 browser contexts to simulate different users
        for (let i = 0; i < 3; i++) {
            const context = await browser.newContext({
                ignoreHTTPSErrors: true
            });
            contexts.push(context);

            const page = await context.newPage();
            pages.push(page);

            // Enable verbose console logging
            page.on('console', msg => {
                if (msg.text().includes('NOOR-SIGNALR') || msg.text().includes('ParticipantJoined')) {
                    console.log(`[Browser ${i + 1}]: ${msg.text()}`);
                }
            });

            // Add SignalR monitoring script
            await page.addInitScript(() => {
                window.signalREvents = [];
                window.addEventListener('beforeunload', () => {
                    console.log('COPILOT-DEBUG: SignalR Events Captured:', window.signalREvents);
                });
            });
        }

        // Step 1: Open waiting room in first browser
        console.log('📊 Step 1: Opening waiting room in Browser 1...');
        await pages[0].goto(`${BASE_URL}/session/waiting/${TEST_TOKEN}`);
        await pages[0].waitForSelector('[data-testid="participants-list"]', { timeout: 10000 });

        const initialCount = await pages[0].locator('[data-testid="participant-count"]').first().textContent();
        console.log(`Initial participant count in Browser 1: ${initialCount}`);

        // Step 2: Register a participant in second browser
        console.log('📊 Step 2: Registering participant in Browser 2...');
        await pages[1].goto(`${BASE_URL}/user/landing/${TEST_TOKEN}`);

        // Fill registration form
        await pages[1].fill('input[name="name"]', 'Test User Alpha');
        await pages[1].fill('input[name="email"]', 'alpha@test.com');
        await pages[1].selectOption('select[name="country"]', 'US');
        await pages[1].click('button[type="submit"]');

        // Wait for redirect to waiting room
        await pages[1].waitForURL(`**/session/waiting/${TEST_TOKEN}`, { timeout: 15000 });

        // Step 3: Check if Browser 1 receives real-time update
        console.log('📊 Step 3: Checking real-time sync in Browser 1...');

        // Wait up to 5 seconds for SignalR update
        let updatedCount = initialCount;
        for (let attempts = 0; attempts < 10; attempts++) {
            await pages[0].waitForTimeout(500);
            updatedCount = await pages[0].locator('[data-testid="participant-count"]').first().textContent();

            if (updatedCount !== initialCount) {
                console.log(`✅ Real-time update detected in Browser 1: ${initialCount} → ${updatedCount}`);
                break;
            }

            if (attempts === 9) {
                console.log(`❌ No real-time update after 5 seconds: still showing ${updatedCount}`);
            }
        }

        // Step 4: Register another participant in third browser
        console.log('📊 Step 4: Registering participant in Browser 3...');
        await pages[2].goto(`${BASE_URL}/user/landing/${TEST_TOKEN}`);

        await pages[2].fill('input[name="name"]', 'Test User Beta');
        await pages[2].fill('input[name="email"]', 'beta@test.com');
        await pages[2].selectOption('select[name="country"]', 'GB');
        await pages[2].click('button[type="submit"]');

        await pages[2].waitForURL(`**/session/waiting/${TEST_TOKEN}`, { timeout: 15000 });

        // Step 5: Verify both browsers show updated count
        console.log('📊 Step 5: Verifying final participant counts...');

        await pages[0].waitForTimeout(2000); // Allow time for SignalR events
        await pages[1].waitForTimeout(2000);

        const finalCount1 = await pages[0].locator('[data-testid="participant-count"]').first().textContent();
        const finalCount2 = await pages[1].locator('[data-testid="participant-count"]').first().textContent();
        const finalCount3 = await pages[2].locator('[data-testid="participant-count"]').first().textContent();

        console.log(`Final counts - Browser 1: ${finalCount1}, Browser 2: ${finalCount2}, Browser 3: ${finalCount3}`);

        // Step 6: Capture SignalR connection diagnostics
        console.log('📊 Step 6: Capturing SignalR diagnostics...');

        for (let i = 0; i < 3; i++) {
            const signalRState = await pages[i].evaluate(() => {
                return {
                    connectionState: window.signalRConnectionState || 'unknown',
                    eventsReceived: window.signalREvents?.length || 0,
                    hubConnection: !!window._hubConnection,
                    groups: window.signalRGroups || []
                };
            });
            console.log(`Browser ${i + 1} SignalR state:`, signalRState);
        }

        // Assertions
        expect(finalCount1).toBe(finalCount2);
        expect(finalCount2).toBe(finalCount3);

        // Should show at least the 2 new participants we just added
        const expectedMinCount = parseInt(initialCount?.replace(/[^\d]/g, '') || '0') + 2;
        expect(parseInt(finalCount1?.replace(/[^\d]/g, '') || '0')).toBeGreaterThanOrEqual(expectedMinCount);
    });

    test('COPILOT-DEBUG: SignalR connection group verification', async ({ browser }) => {
        console.log('🔍 COPILOT-DEBUG: Verifying SignalR group membership...');

        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await context.newPage();

        // Capture SignalR group join events
        await page.addInitScript(() => {
            window.signalRGroups = [];
            window.originalSendAsync = null;
        });

        page.on('console', msg => {
            if (msg.text().includes('JoinSession') || msg.text().includes('usertoken_') || msg.text().includes('session_')) {
                console.log(`[SignalR Group Debug]: ${msg.text()}`);
            }
        });

        await page.goto(`${BASE_URL}/session/waiting/${TEST_TOKEN}`);
        await page.waitForSelector('[data-testid="participants-list"]', { timeout: 10000 });

        // Check which groups the client joined
        const groupInfo = await page.evaluate(() => {
            return {
                groups: window.signalRGroups || [],
                connectionState: window.signalRConnectionState || 'unknown'
            };
        });

        console.log('SignalR Group Information:', groupInfo);

        // Expected: Client should join "usertoken_M7C5DS3D" group
        // Current: Client likely joins "session_212" group

        await context.close();
    });
});

// Helper functions for Blazor interaction
async function fillBlazorInput(page: Page, selector: string, value: string) {
    const input = page.locator(selector);
    await input.clear();
    await input.fill(value);
    await input.dispatchEvent('input');
    await input.dispatchEvent('change');
    await page.waitForTimeout(1000); // Allow Blazor to process
}

async function clickEnabledButton(page: Page, selector: string, timeout = 10000) {
    const button = page.locator(selector);
    await expect(button).toBeEnabled({ timeout });
    await button.click();
}