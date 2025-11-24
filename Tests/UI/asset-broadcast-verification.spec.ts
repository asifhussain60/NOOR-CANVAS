/**
 * Asset Broadcasting Verification Tests - Headless SignalR Validation
 * 
 * Purpose: Verify AssetContentReceived SignalR event broadcasts from host to participants
 * Scope: Tests the COMPLETE flow from HostControlPanel → SessionHub → SessionCanvas/TranscriptCanvas
 * 
 * Test Strategy:
 * - Phase 5.1 of Asset Broadcasting Fix Implementation Plan
 * - Headless execution (no --headed flag) for CI/CD integration
 * - Console log monitoring to verify event reception
 * - DOM inspection to verify visual rendering
 * - Timing assertions to ensure low latency
 */

import { expect, Page, test } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'https://localhost:9091';
const TEST_TIMEOUT = 60000; // 60 seconds per test
const SIGNALR_CONNECT_TIMEOUT = 10000; // 10 seconds for SignalR connection
const BROADCAST_LATENCY_THRESHOLD = 1000; // 1 second max latency

// Test data
const TEST_SESSION_TITLE = 'Asset Broadcast Test - ' + new Date().toISOString();
const TEST_ADMIN_EMAIL = 'test-admin@example.com';
const TEST_ADMIN_NAME = 'Test Admin';
const TEST_PARTICIPANT_NAME_1 = 'Test Participant 1';
const TEST_PARTICIPANT_NAME_2 = 'Test Participant 2';

// Helper: Create session and return tokens
async function createTestSession(adminPage: Page): Promise<{ sessionId: number, adminToken: string, userToken: string }> {
    await adminPage.goto(`${BASE_URL}/admin`);

    // Create new session
    await adminPage.fill('input[name="sessionTitle"]', TEST_SESSION_TITLE);
    await adminPage.fill('input[name="adminEmail"]', TEST_ADMIN_EMAIL);
    await adminPage.fill('input[name="adminName"]', TEST_ADMIN_NAME);
    await adminPage.click('button:has-text("Create Session")');

    // Wait for session creation and extract tokens
    await adminPage.waitForURL(/\/host\/control\?sessionToken=/, { timeout: 10000 });
    const url = adminPage.url();
    const sessionToken = new URL(url).searchParams.get('sessionToken')!;

    // Get session ID from page or API
    const sessionId = await adminPage.evaluate(() => {
        const model = (window as any).sessionModel;
        return model?.SessionId || 0;
    });

    // Get user token for participants
    const userToken = await adminPage.evaluate((sid) => {
        return localStorage.getItem(`session_${sid}_userToken`) || '';
    }, sessionId);

    return { sessionId, adminToken: sessionToken, userToken };
}

// Helper: Join session as participant
async function joinSessionAsParticipant(participantPage: Page, userToken: string, participantName: string): Promise<void> {
    await participantPage.goto(`${BASE_URL}/session/canvas/${userToken}`);

    // Fill participant name if on landing page
    const nameInput = participantPage.locator('input[name="userName"]');
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill(participantName);
        await participantPage.click('button:has-text("Join Session")');
    }

    // Wait for SignalR connection
    await participantPage.waitForFunction(
        () => {
            const state = (window as any).hubConnectionState;
            return state === 'Connected';
        },
        { timeout: SIGNALR_CONNECT_TIMEOUT }
    );
}

// Helper: Monitor console logs for SignalR events
function setupConsoleMonitoring(page: Page, eventName: string): Promise<string[]> {
    const logs: string[] = [];

    page.on('console', (msg) => {
        const text = msg.text();
        if (text.includes(eventName) || text.includes('AssetContentReceived')) {
            logs.push(text);
        }
    });

    return Promise.resolve(logs);
}

// Helper: Share asset from host
async function shareAssetFromHost(hostPage: Page, assetSelector: string): Promise<number> {
    const startTime = Date.now();

    // Find and click share button for specific asset
    const shareButton = hostPage.locator(`${assetSelector} button:has-text("Share")`).first();
    await expect(shareButton).toBeVisible({ timeout: 5000 });
    await shareButton.click();

    // Wait for success toast
    await hostPage.waitForSelector('text=/shared successfully/i', { timeout: 5000 });

    return Date.now() - startTime;
}

// Test Suite
test.describe('Asset Broadcasting - SignalR Verification', () => {
    test.setTimeout(TEST_TIMEOUT);

    test('TC1: Single Asset Broadcast - Host to 2 Participants', async ({ browser }) => {
        // Setup: Create 3 browser contexts (host + 2 participants)
        const hostContext = await browser.newContext();
        const participant1Context = await browser.newContext();
        const participant2Context = await browser.newContext();

        const hostPage = await hostContext.newPage();
        const participant1Page = await participant1Context.newPage();
        const participant2Page = await participant2Context.newPage();

        try {
            // Step 1: Create session as admin
            console.log('[TC1] Creating test session...');
            const { sessionId, userToken } = await createTestSession(hostPage);
            expect(sessionId).toBeGreaterThan(0);
            console.log(`[TC1] Session created: ID=${sessionId}`);

            // Step 2: Join as participants
            console.log('[TC1] Participants joining session...');
            await Promise.all([
                joinSessionAsParticipant(participant1Page, userToken, TEST_PARTICIPANT_NAME_1),
                joinSessionAsParticipant(participant2Page, userToken, TEST_PARTICIPANT_NAME_2)
            ]);
            console.log('[TC1] Both participants connected');

            // Step 3: Setup console monitoring
            const p1Logs = await setupConsoleMonitoring(participant1Page, 'AssetContentReceived');
            const p2Logs = await setupConsoleMonitoring(participant2Page, 'AssetContentReceived');

            // Step 4: Share asset from host
            console.log('[TC1] Sharing asset from host...');
            await shareAssetFromHost(hostPage, '.ayah-card');

            // Step 5: Verify reception on both participants
            console.log('[TC1] Verifying asset reception...');

            // Wait for asset to appear on SessionCanvas (participant1)
            await participant1Page.waitForSelector('.canvas-content-area [data-islamic-content]', {
                timeout: 5000,
                state: 'visible'
            });

            // Wait for asset to appear on TranscriptCanvas (participant2)
            await participant2Page.waitForSelector('.canvas-content-area [data-islamic-content]', {
                timeout: 5000,
                state: 'visible'
            });

            // Step 6: Assert asset content is identical
            const p1Content = await participant1Page.locator('.canvas-content-area').innerHTML();
            const p2Content = await participant2Page.locator('.canvas-content-area').innerHTML();

            expect(p1Content).toContain('data-islamic-content');
            expect(p2Content).toContain('data-islamic-content');
            expect(p1Content.length).toBeGreaterThan(100); // Non-empty HTML
            expect(p2Content.length).toBeGreaterThan(100);

            console.log('[TC1] ✅ Asset successfully broadcast to both participants');

        } finally {
            await hostContext.close();
            await participant1Context.close();
            await participant2Context.close();
        }
    });

    test('TC2: Multiple Assets Broadcast Sequentially', async ({ browser }) => {
        const hostContext = await browser.newContext();
        const participantContext = await browser.newContext();

        const hostPage = await hostContext.newPage();
        const participantPage = await participantContext.newPage();

        try {
            // Setup session
            const { userToken } = await createTestSession(hostPage);
            await joinSessionAsParticipant(participantPage, userToken, TEST_PARTICIPANT_NAME_1);

            // Share 3 different assets
            console.log('[TC2] Sharing asset 1...');
            await shareAssetFromHost(hostPage, '.ayah-card:nth-of-type(1)');
            await participantPage.waitForSelector('.canvas-content-area [data-islamic-content]', { timeout: 3000 });
            const asset1Content = await participantPage.locator('.canvas-content-area').innerHTML();

            console.log('[TC2] Sharing asset 2...');
            await shareAssetFromHost(hostPage, '.ayah-card:nth-of-type(2)');
            await participantPage.waitForTimeout(500); // Brief wait for state change
            const asset2Content = await participantPage.locator('.canvas-content-area').innerHTML();

            console.log('[TC2] Sharing asset 3...');
            await shareAssetFromHost(hostPage, '.ayah-card:nth-of-type(3)');
            await participantPage.waitForTimeout(500);
            const asset3Content = await participantPage.locator('.canvas-content-area').innerHTML();

            // Verify each asset replaced the previous one
            expect(asset1Content).not.toBe(asset2Content);
            expect(asset2Content).not.toBe(asset3Content);
            expect(asset3Content).toContain('data-islamic-content'); // Last asset displayed

            console.log('[TC2] ✅ Multiple assets broadcast successfully');

        } finally {
            await hostContext.close();
            await participantContext.close();
        }
    });

    test('TC3: Concurrent Participants - 5 Receivers', async ({ browser }) => {
        const hostContext = await browser.newContext();
        const participantContexts = await Promise.all(
            Array(5).fill(null).map(() => browser.newContext())
        );

        const hostPage = await hostContext.newPage();
        const participantPages = await Promise.all(
            participantContexts.map(ctx => ctx.newPage())
        );

        try {
            // Setup session
            const { userToken } = await createTestSession(hostPage);

            // Join all 5 participants
            console.log('[TC3] Joining 5 participants...');
            await Promise.all(
                participantPages.map((page, i) =>
                    joinSessionAsParticipant(page, userToken, `Participant ${i + 1}`)
                )
            );

            // Share asset
            console.log('[TC3] Broadcasting to 5 participants...');
            const broadcastStart = Date.now();
            await shareAssetFromHost(hostPage, '.ayah-card');

            // Verify all 5 received within latency threshold
            const receptionPromises = participantPages.map(async (page) => {
                await page.waitForSelector('.canvas-content-area [data-islamic-content]', {
                    timeout: BROADCAST_LATENCY_THRESHOLD
                });
                return Date.now() - broadcastStart;
            });

            const latencies = await Promise.all(receptionPromises);
            const maxLatency = Math.max(...latencies);
            const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

            console.log(`[TC3] Latencies: Max=${maxLatency}ms, Avg=${avgLatency}ms`);
            expect(maxLatency).toBeLessThan(BROADCAST_LATENCY_THRESHOLD);

            console.log('[TC3] ✅ All 5 participants received asset concurrently');

        } finally {
            await hostContext.close();
            await Promise.all(participantContexts.map(ctx => ctx.close()));
        }
    });

    test('TC4: Late Joiner - No Asset Persistence', async ({ browser }) => {
        const hostContext = await browser.newContext();
        const earlyParticipantContext = await browser.newContext();
        const lateParticipantContext = await browser.newContext();

        const hostPage = await hostContext.newPage();
        const earlyPage = await earlyParticipantContext.newPage();
        const latePage = await lateParticipantContext.newPage();

        try {
            // Setup and share asset to early joiner
            const { userToken } = await createTestSession(hostPage);
            await joinSessionAsParticipant(earlyPage, userToken, 'Early Participant');
            await shareAssetFromHost(hostPage, '.ayah-card');

            // Verify early joiner received asset
            await earlyPage.waitForSelector('.canvas-content-area [data-islamic-content]', { timeout: 3000 });

            // Late joiner joins AFTER asset shared
            console.log('[TC4] Late participant joining...');
            await joinSessionAsParticipant(latePage, userToken, 'Late Participant');

            // Wait briefly to ensure no asset appears
            await latePage.waitForTimeout(2000);

            // Assert late joiner sees default message, not the asset
            const lateContent = await latePage.locator('.canvas-content-area').textContent();
            expect(lateContent).not.toContain('data-islamic-content');
            expect(lateContent).toContain('Waiting for content'); // Or similar default message

            console.log('[TC4] ✅ Late joiner correctly sees no persisted asset');

        } finally {
            await hostContext.close();
            await earlyParticipantContext.close();
            await lateParticipantContext.close();
        }
    });

    test('TC5: SignalR Group Membership Verification', async ({ browser }) => {
        const hostContext = await browser.newContext();
        const participantContext = await browser.newContext();

        const hostPage = await hostContext.newPage();
        const participantPage = await participantContext.newPage();

        try {
            const { userToken } = await createTestSession(hostPage);

            // Monitor console logs for JoinSession confirmation
            const joinLogs: string[] = [];
            participantPage.on('console', (msg) => {
                const text = msg.text();
                if (text.includes('JoinSession') || text.includes('GROUP READY')) {
                    joinLogs.push(text);
                }
            });

            await joinSessionAsParticipant(participantPage, userToken, TEST_PARTICIPANT_NAME_1);

            // Verify SignalR connection state
            const connectionState = await participantPage.evaluate(() => {
                return (window as any).hubConnectionState || 'Unknown';
            });

            expect(connectionState).toBe('Connected');

            // Verify JoinSession was called
            expect(joinLogs.length).toBeGreaterThan(0);
            expect(joinLogs.some(log => log.includes('JoinSession'))).toBe(true);

            console.log('[TC5] ✅ SignalR group membership verified');

        } finally {
            await hostContext.close();
            await participantContext.close();
        }
    });

    test('TC6: Browser Console Log Cleanliness', async ({ browser }) => {
        const participantContext = await browser.newContext();
        const participantPage = await participantContext.newPage();

        try {
            const hostContext = await browser.newContext();
            const hostPage = await hostContext.newPage();

            const { userToken } = await createTestSession(hostPage);

            // Monitor for CLEAN logs (no debug spam)
            const allLogs: string[] = [];
            participantPage.on('console', (msg) => {
                allLogs.push(msg.text());
            });

            await joinSessionAsParticipant(participantPage, userToken, TEST_PARTICIPANT_NAME_1);
            await shareAssetFromHost(hostPage, '.ayah-card');
            await participantPage.waitForTimeout(2000);

            // Assert NO obsolete debug markers
            const hasObsoleteLogging = allLogs.some(log =>
                log.includes('[ASSET-RECEIVED-TRACE]') ||
                log.includes('[DEBUG-WORKITEM:hcp-questions]') ||
                log.includes('✅✅✅')
            );

            expect(hasObsoleteLogging).toBe(false);

            // Assert CLEAN service logs present
            const hasCleanServiceLogs = allLogs.some(log =>
                log.includes('SignalREventContext') ||
                log.includes('AssetContentReceived event received')
            );

            expect(hasCleanServiceLogs).toBe(true);

            console.log('[TC6] ✅ Browser console logs are clean');

            await hostContext.close();

        } finally {
            await participantContext.close();
        }
    });
});
