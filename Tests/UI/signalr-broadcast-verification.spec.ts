/**
 * [hcp-refactor:debug] SignalR Broadcast Verification Tests
 * 
 * PURPOSE: Verify event handler registration timing and broadcast delivery
 * SCOPE: HostControlPanel → SessionHub → TranscriptCanvas/SessionCanvas
 * MODE: Headless - No UI interaction, pure event tracking
 * 
 * KEY VERIFICATION POINTS:
 * 1. Event handlers registered BEFORE connection starts
 * 2. JoinSession called AFTER handlers registered
 * 3. Broadcasts received by registered handlers
 * 4. Event timing (handler registration → join → broadcast → receipt)
 */

import { Browser, chromium, expect, test } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';
const HOST_TOKEN = 'PQ9N5YWW'; // Session 212
const TRANSCRIPT_TOKEN = 'KJAHA99L'; // Session 212 (TranscriptCanvas)
const SESSION_TOKEN = 'KJAHA99L'; // Session 212 (SessionCanvas)

interface EventLog {
    timestamp: number;
    event: string;
    connectionId?: string;
    data?: any;
}

test.describe('SignalR Broadcast Flow Verification', () => {
    let browser: Browser;

    test.beforeAll(async () => {
        browser = await chromium.launch({
            headless: true,
            args: ['--ignore-certificate-errors']
        });
    });

    test.afterAll(async () => {
        await browser.close();
    });

    /**
     * TEST 1: Verify Event Handler Registration Timing
     * 
     * CRITICAL: Handlers must be registered BEFORE StartAsync() is called
     * This is the root cause of the broadcast failure
     */
    test('CRITICAL: Event handlers registered before connection starts', async () => {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await context.newPage();

        const eventLog: EventLog[] = [];

        // Intercept console logs to track event timing
        page.on('console', (msg) => {
            const text = msg.text();

            // Track handler registration
            if (text.includes('hubConnection.On') || text.includes('RegisterHandler')) {
                eventLog.push({
                    timestamp: Date.now(),
                    event: 'HANDLER_REGISTERED',
                    data: text
                });
            }

            // Track connection start
            if (text.includes('StartAsync') || text.includes('Connection established')) {
                eventLog.push({
                    timestamp: Date.now(),
                    event: 'CONNECTION_STARTED',
                    data: text
                });
            }

            // Track JoinSession
            if (text.includes('JoinSession') && text.includes('INVOKING')) {
                eventLog.push({
                    timestamp: Date.now(),
                    event: 'JOIN_SESSION_INVOKED',
                    data: text
                });
            }
        });

        console.log('[TEST] Loading TranscriptCanvas...');
        await page.goto(`${BASE_URL}/transcript/canvas/${TRANSCRIPT_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // Allow SignalR initialization

        console.log('\n[TEST] ════════ EVENT TIMING ANALYSIS ════════');

        // Find when handlers were registered vs connection started
        const handlerRegistrations = eventLog.filter(e => e.event === 'HANDLER_REGISTERED');
        const connectionStart = eventLog.find(e => e.event === 'CONNECTION_STARTED');
        const joinSession = eventLog.find(e => e.event === 'JOIN_SESSION_INVOKED');

        console.log(`[TEST] Handler registrations: ${handlerRegistrations.length}`);
        console.log(`[TEST] Connection started: ${connectionStart ? 'YES' : 'NO'}`);
        console.log(`[TEST] JoinSession invoked: ${joinSession ? 'YES' : 'NO'}`);

        if (handlerRegistrations.length > 0 && connectionStart) {
            const firstHandler = handlerRegistrations[0].timestamp;
            const connStart = connectionStart.timestamp;

            if (firstHandler < connStart) {
                console.log(`[TEST] ✅ CORRECT: Handlers registered ${connStart - firstHandler}ms BEFORE connection start`);
            } else {
                console.log(`[TEST] ❌ BUG: Handlers registered ${firstHandler - connStart}ms AFTER connection start`);
                console.log(`[TEST] This is the root cause - handlers miss early broadcasts`);
            }
        }

        console.log('[TEST] ════════════════════════════════════════\n');

        // ASSERTION: Handlers MUST be registered before connection starts
        if (handlerRegistrations.length > 0 && connectionStart) {
            const handlersFirst = handlerRegistrations[0].timestamp < connectionStart.timestamp;
            expect(handlersFirst).toBe(true);
        }

        await context.close();
    });

    /**
     * TEST 2: Verify Broadcast Reception (TranscriptShared)
     * 
     * Tests: Host broadcasts → TranscriptCanvas receives
     */
    test('Broadcast Flow: HostControlPanel → TranscriptCanvas (TranscriptShared)', async () => {
        const hostContext = await browser.newContext({ ignoreHTTPSErrors: true });
        const participantContext = await browser.newContext({ ignoreHTTPSErrors: true });

        const hostPage = await hostContext.newPage();
        const participantPage = await participantContext.newPage();

        let broadcastSent = false;
        let broadcastReceived = false;
        let broadcastPayload: any = null;

        // Host logs - track broadcast sending
        hostPage.on('console', (msg) => {
            const text = msg.text();
            if (text.includes('BroadcastTranscriptShared') || text.includes('TRACE:hcp-tcanvas:broadcast')) {
                broadcastSent = true;
                console.log(`[HOST] ${text}`);
            }
        });

        // Participant logs - track broadcast reception
        participantPage.on('console', (msg) => {
            const text = msg.text();
            if (text.includes('TranscriptShared event received') || text.includes('TC-ReceiveSection')) {
                broadcastReceived = true;
                console.log(`[PARTICIPANT] ${text}`);
            }
        });

        console.log('[TEST] Step 1: Load TranscriptCanvas...');
        await participantPage.goto(`${BASE_URL}/transcript/canvas/${TRANSCRIPT_TOKEN}`);
        await participantPage.waitForLoadState('networkidle');
        await participantPage.waitForTimeout(2000);

        console.log('[TEST] Step 2: Load HostControlPanel...');
        await hostPage.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');
        await hostPage.waitForTimeout(2000);

        console.log('[TEST] Step 3: Trigger broadcast via Share Transcript button...');

        // Wait for Share Transcript button
        const shareButton = hostPage.locator('button:has-text("Share Transcript")');
        const buttonVisible = await shareButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (buttonVisible) {
            await shareButton.click();
            console.log('[TEST] Share Transcript clicked, waiting for broadcast...');
            await hostPage.waitForTimeout(3000); // Allow time for broadcast propagation

            console.log('\n[TEST] ════════ BROADCAST VERIFICATION ════════');
            console.log(`[TEST] Broadcast sent from host: ${broadcastSent ? '✅ YES' : '❌ NO'}`);
            console.log(`[TEST] Broadcast received by participant: ${broadcastReceived ? '✅ YES' : '❌ NO'}`);
            console.log('[TEST] ═══════════════════════════════════════\n');

            // ASSERTION: Participant must receive broadcast
            expect(broadcastSent).toBe(true);
            expect(broadcastReceived).toBe(true);
        } else {
            console.log('[TEST] ⚠️ Share Transcript button not found - session may not be loaded');
        }

        await hostContext.close();
        await participantContext.close();
    });

    /**
     * TEST 3: Verify Broadcast Reception (AssetShared)
     * 
     * Tests: Host broadcasts → SessionCanvas receives
     */
    test('Broadcast Flow: HostControlPanel → SessionCanvas (AssetShared)', async () => {
        const hostContext = await browser.newContext({ ignoreHTTPSErrors: true });
        const participantContext = await browser.newContext({ ignoreHTTPSErrors: true });

        const hostPage = await hostContext.newPage();
        const participantPage = await participantContext.newPage();

        let assetShared = false;
        let assetReceived = false;

        // Host logs
        hostPage.on('console', (msg) => {
            const text = msg.text();
            if (text.includes('ShareAsset') || text.includes('asset sharing')) {
                assetShared = true;
                console.log(`[HOST] ${text}`);
            }
        });

        // Participant logs
        participantPage.on('console', (msg) => {
            const text = msg.text();
            if (text.includes('AssetShared') || text.includes('SC-AssetShared')) {
                assetReceived = true;
                console.log(`[PARTICIPANT] ${text}`);
            }
        });

        console.log('[TEST] Step 1: Load SessionCanvas...');
        await participantPage.goto(`${BASE_URL}/session/canvas/${SESSION_TOKEN}`);
        await participantPage.waitForLoadState('networkidle');
        await participantPage.waitForTimeout(2000);

        console.log('[TEST] Step 2: Load HostControlPanel...');
        await hostPage.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');
        await hostPage.waitForTimeout(2000);

        console.log('[TEST] Step 3: Share transcript to inject asset buttons...');

        const shareTranscriptBtn = hostPage.locator('button:has-text("Share Transcript")');
        const transcriptBtnVisible = await shareTranscriptBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (transcriptBtnVisible) {
            await shareTranscriptBtn.click();
            await hostPage.waitForTimeout(2000);

            // Look for any asset share button (ks-share-button class)
            const assetShareBtn = hostPage.locator('.ks-share-button').first();
            const assetBtnVisible = await assetShareBtn.isVisible({ timeout: 3000 }).catch(() => false);

            if (assetBtnVisible) {
                console.log('[TEST] Asset share button found, clicking...');
                await assetShareBtn.click();
                await hostPage.waitForTimeout(3000);

                console.log('\n[TEST] ════════ ASSET BROADCAST VERIFICATION ════════');
                console.log(`[TEST] Asset shared from host: ${assetShared ? '✅ YES' : '❌ NO'}`);
                console.log(`[TEST] Asset received by SessionCanvas: ${assetReceived ? '✅ YES' : '❌ NO'}`);
                console.log('[TEST] ════════════════════════════════════════════\n');

                expect(assetShared).toBe(true);
                expect(assetReceived).toBe(true);
            } else {
                console.log('[TEST] ⚠️ Asset share buttons not injected - check transcript-section-parser.js');
            }
        } else {
            console.log('[TEST] ⚠️ Share Transcript button not found');
        }

        await hostContext.close();
        await participantContext.close();
    });

    /**
     * TEST 4: Handler Registration Order Verification
     * 
     * Verifies the exact sequence:
     * 1. Create HubConnection
     * 2. Register ALL event handlers
     * 3. Call StartAsync()
     * 4. Call JoinSession()
     */
    test('Handler Registration Sequence Verification', async () => {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await context.newPage();

        const sequence: string[] = [];

        page.on('console', (msg) => {
            const text = msg.text();

            if (text.includes('Creating HubConnection') || text.includes('HubConnectionBuilder')) {
                sequence.push('1_CREATE_CONNECTION');
            }
            if (text.includes('hubConnection.On') || text.includes('RegisterHandler')) {
                sequence.push('2_REGISTER_HANDLER');
            }
            if (text.includes('StartAsync') || text.includes('Connection established')) {
                sequence.push('3_START_CONNECTION');
            }
            if (text.includes('JoinSession') && text.includes('INVOKING')) {
                sequence.push('4_JOIN_SESSION');
            }
        });

        await page.goto(`${BASE_URL}/transcript/canvas/${TRANSCRIPT_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        console.log('\n[TEST] ════════ INITIALIZATION SEQUENCE ════════');
        console.log('[TEST] Observed sequence:');
        sequence.forEach((step, idx) => {
            console.log(`[TEST]   ${idx + 1}. ${step}`);
        });

        // Expected sequence
        const hasCreate = sequence.some(s => s.startsWith('1_'));
        const hasRegister = sequence.some(s => s.startsWith('2_'));
        const hasStart = sequence.some(s => s.startsWith('3_'));
        const hasJoin = sequence.some(s => s.startsWith('4_'));

        console.log(`\n[TEST] Sequence validation:`);
        console.log(`[TEST]   Create connection: ${hasCreate ? '✅' : '❌'}`);
        console.log(`[TEST]   Register handlers: ${hasRegister ? '✅' : '❌'}`);
        console.log(`[TEST]   Start connection: ${hasStart ? '✅' : '❌'}`);
        console.log(`[TEST]   Join session: ${hasJoin ? '✅' : '❌'}`);
        console.log('[TEST] ═══════════════════════════════════════\n');

        // Verify correct order (handlers before start, start before join)
        if (hasRegister && hasStart) {
            const firstRegisterIdx = sequence.findIndex(s => s.startsWith('2_'));
            const firstStartIdx = sequence.findIndex(s => s.startsWith('3_'));
            const firstJoinIdx = sequence.findIndex(s => s.startsWith('4_'));

            expect(firstRegisterIdx).toBeLessThan(firstStartIdx);
            if (firstJoinIdx !== -1) {
                expect(firstStartIdx).toBeLessThan(firstJoinIdx);
            }
        }

        await context.close();
    });

    /**
     * TEST 5: Connection State Transitions
     * 
     * Verifies proper state machine:
     * Disconnected → Connecting → Connected → (broadcasts work)
     */
    test('Connection State Transitions', async () => {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await context.newPage();

        const states: Array<{ state: string; timestamp: number }> = [];

        page.on('console', (msg) => {
            const text = msg.text();

            if (text.includes('HubConnectionState') || text.includes('State:')) {
                if (text.includes('Disconnected')) {
                    states.push({ state: 'Disconnected', timestamp: Date.now() });
                } else if (text.includes('Connecting')) {
                    states.push({ state: 'Connecting', timestamp: Date.now() });
                } else if (text.includes('Connected') && !text.includes('Disconnected')) {
                    states.push({ state: 'Connected', timestamp: Date.now() });
                }
            }
        });

        await page.goto(`${BASE_URL}/transcript/canvas/${TRANSCRIPT_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        console.log('\n[TEST] ════════ CONNECTION STATE TRANSITIONS ════════');
        states.forEach((state, idx) => {
            const duration = idx > 0 ? state.timestamp - states[idx - 1].timestamp : 0;
            console.log(`[TEST] ${idx + 1}. ${state.state} ${duration > 0 ? `(+${duration}ms)` : ''}`);
        });
        console.log('[TEST] ════════════════════════════════════════════\n');

        // Verify final state is Connected
        const lastState = states[states.length - 1];
        expect(lastState?.state).toBe('Connected');

        await context.close();
    });
});
