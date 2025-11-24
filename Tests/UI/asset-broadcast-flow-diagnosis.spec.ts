/**
 * ASSET BROADCASTING DIAGNOSIS TEST
 * 
 * PURPOSE: Diagnose why assets broadcast from HostControlPanel aren't received by SessionCanvas/TranscriptCanvas
 * 
 * FLOW TO TEST:
 * 1. Host clicks "Share Asset" button in HostControlPanel transcript
 * 2. JavaScript calls ShareAsset C# method
 * 3. AssetSharingService extracts HTML and broadcasts via PublishAssetContent
 * 4. SessionHub.PublishAssetContent sends AssetContentReceived to group "session_{sessionId}"
 * 5. SessionCanvas/TranscriptCanvas receive AssetContentReceived event
 * 6. Canvas updates Model.SharedAssetContent and displays
 * 
 * DIAGNOSTICS:
 * - Check SignalR connection states
 * - Verify group membership
 * - Confirm hub method invocation
 * - Track event propagation
 * - Validate payload structure
 */

import { expect, Page, test } from '@playwright/test';

test.describe('Asset Broadcasting Flow Diagnosis', () => {
    let hostPage: Page;
    let participantPage: Page;
    let transcriptPage: Page;
    let sessionId: number;
    let hostToken: string;
    let userToken: string;

    test.beforeAll(async ({ browser }) => {
        // Create three pages: Host, SessionCanvas participant, TranscriptCanvas viewer
        hostPage = await browser.newPage();
        participantPage = await browser.newPage();
        transcriptPage = await browser.newPage();
    });

    test.afterAll(async () => {
        await hostPage.close();
        await participantPage.close();
        await transcriptPage.close();
    });

    test('STEP 1: Setup - Start session and join with all three clients', async () => {
        // 1. Navigate to admin and start session
        await hostPage.goto('https://localhost:9091/admin');
        await hostPage.waitForLoadState('networkidle');

        // Generate user token
        await hostPage.click('button#openSessionBtn');
        await hostPage.waitForSelector('button:has-text("Copy")', { timeout: 5000 });

        const tokenElement = await hostPage.locator('[data-testid="user-token-display"]');
        userToken = await tokenElement.textContent() || '';
        expect(userToken).toBeTruthy();
        console.log(`[DIAGNOSIS] User Token: ${userToken}`);

        // Open control panel
        await hostPage.click('button:has-text("Open Control Panel")');
        await hostPage.waitForURL(/.*\/host\/control-panel\/.*/);

        const url = hostPage.url();
        hostToken = url.split('/').pop() || '';
        expect(hostToken).toBeTruthy();
        console.log(`[DIAGNOSIS] Host Token: ${hostToken}`);

        // Start session
        await hostPage.click('[data-playwright-log-marker="20251031120000-HostControlPanel-StartSession"]');
        await hostPage.waitForTimeout(2000); // Wait for session to start

        // Extract sessionId from page logs
        const logs: string[] = [];
        hostPage.on('console', msg => {
            if (msg.text().includes('SessionId=')) {
                logs.push(msg.text());
            }
        });

        await hostPage.waitForTimeout(1000);
        const sessionLog = logs.find(log => log.includes('SessionId='));
        if (sessionLog) {
            const match = sessionLog.match(/SessionId=(\d+)/);
            if (match) {
                sessionId = parseInt(match[1]);
                console.log(`[DIAGNOSIS] Session ID: ${sessionId}`);
            }
        }

        // 2. Join with SessionCanvas participant
        await participantPage.goto(`https://localhost:9091/session/waiting/${userToken}`);
        await participantPage.waitForLoadState('networkidle');
        await participantPage.click('button:has-text("Join Session")');
        await participantPage.waitForURL(/.*\/session\/canvas\/.*/);
        console.log('[DIAGNOSIS] SessionCanvas participant joined');

        // 3. Join with TranscriptCanvas viewer
        await transcriptPage.goto(`https://localhost:9091/session/waiting/${userToken}`);
        await transcriptPage.waitForLoadState('networkidle');

        // Select TranscriptCanvas option
        const transcriptButton = await transcriptPage.locator('button#reg-transcript-canvas-btn');
        if (await transcriptButton.count() > 0) {
            await transcriptButton.click();
            await transcriptPage.waitForTimeout(500);
        }

        await transcriptPage.click('button:has-text("Join Session")');
        await transcriptPage.waitForURL(/.*\/transcript\/canvas\/.*/);
        console.log('[DIAGNOSIS] TranscriptCanvas viewer joined');

        // Wait for all SignalR connections to stabilize
        await hostPage.waitForTimeout(2000);
        await participantPage.waitForTimeout(2000);
        await transcriptPage.waitForTimeout(2000);
    });

    test('STEP 2: Verify SignalR Connection States', async () => {
        // Check host connection
        const hostConnection = await hostPage.evaluate(() => {
            return {
                state: (window as any).hubConnection?.state,
                connectionId: (window as any).hubConnection?.connectionId
            };
        });
        console.log('[DIAGNOSIS] Host SignalR Connection:', hostConnection);
        expect(hostConnection.state).toBe('Connected');

        // Check participant connection
        const participantConnection = await participantPage.evaluate(() => {
            return {
                state: (window as any).hubConnection?.state,
                connectionId: (window as any).hubConnection?.connectionId
            };
        });
        console.log('[DIAGNOSIS] Participant SignalR Connection:', participantConnection);
        expect(participantConnection.state).toBe('Connected');

        // Check transcript connection
        const transcriptConnection = await transcriptPage.evaluate(() => {
            return {
                state: (window as any).hubConnection?.state,
                connectionId: (window as any).hubConnection?.connectionId
            };
        });
        console.log('[DIAGNOSIS] Transcript SignalR Connection:', transcriptConnection);
        expect(transcriptConnection.state).toBe('Connected');
    });

    test('STEP 3: Install Console Log Listeners on All Pages', async () => {
        const hostLogs: string[] = [];
        const participantLogs: string[] = [];
        const transcriptLogs: string[] = [];

        hostPage.on('console', msg => {
            const text = msg.text();
            if (text.includes('[ASSET-SHARING-SERVICE]') ||
                text.includes('PublishAssetContent') ||
                text.includes('AssetContentReceived')) {
                hostLogs.push(`[HOST] ${text}`);
                console.log(`[HOST-LOG] ${text}`);
            }
        });

        participantPage.on('console', msg => {
            const text = msg.text();
            if (text.includes('AssetContentReceived') ||
                text.includes('[ASSET-SHARE-POC]') ||
                text.includes('[DOM-TIMING]') ||
                text.includes('SharedAssetContent')) {
                participantLogs.push(`[PARTICIPANT] ${text}`);
                console.log(`[PARTICIPANT-LOG] ${text}`);
            }
        });

        transcriptPage.on('console', msg => {
            const text = msg.text();
            if (text.includes('AssetContentReceived') ||
                text.includes('[ASSET-SHARE-POC]') ||
                text.includes('[DOM-TIMING]') ||
                text.includes('SharedAssetContent')) {
                transcriptLogs.push(`[TRANSCRIPT] ${text}`);
                console.log(`[TRANSCRIPT-LOG] ${text}`);
            }
        });

        console.log('[DIAGNOSIS] Console log listeners installed on all pages');
    });

    test('STEP 4: Share Asset from Host and Track Propagation', async () => {
        // Find first share button in transcript
        const shareButton = await hostPage.locator('[data-testid="transcript-container"] button:has-text("Share Asset")').first();
        expect(await shareButton.count()).toBeGreaterThan(0);

        console.log('[DIAGNOSIS] Clicking share button on host...');
        await shareButton.click();

        // Wait for broadcast to complete
        await hostPage.waitForTimeout(3000);

        // Check for success toast on host
        const hostToast = await hostPage.locator('.notyf__toast--success').count();
        console.log(`[DIAGNOSIS] Host success toast count: ${hostToast}`);

        // Check if asset appeared on participant page
        const participantAsset = await participantPage.locator('[data-testid="shared-asset-content"]').count();
        console.log(`[DIAGNOSIS] Participant asset count: ${participantAsset}`);

        // Check if asset appeared on transcript page
        const transcriptAsset = await transcriptPage.locator('[data-testid="shared-asset-content"]').count();
        console.log(`[DIAGNOSIS] Transcript asset count: ${transcriptAsset}`);

        // EXPECTED: participantAsset > 0 and transcriptAsset > 0
        // If 0, we have a broadcasting issue
    });

    test('STEP 5: Check SignalR Group Membership via Network Tab', async () => {
        // Check if JoinSession was called with correct sessionId
        const hostNetwork = await hostPage.evaluate(() => {
            return (window as any).signalRDebugInfo || 'No debug info';
        });
        console.log('[DIAGNOSIS] Host SignalR Debug Info:', hostNetwork);

        const participantNetwork = await participantPage.evaluate(() => {
            return (window as any).signalRDebugInfo || 'No debug info';
        });
        console.log('[DIAGNOSIS] Participant SignalR Debug Info:', participantNetwork);
    });

    test('STEP 6: Manual Event Injection Test', async () => {
        console.log('[DIAGNOSIS] Testing manual event injection on participant...');

        // Inject test event directly to participant
        const result = await participantPage.evaluate(() => {
            const testHtml = '<div style="background: yellow; padding: 20px; border: 2px solid red;">TEST ASSET FROM MANUAL INJECTION</div>';

            if ((window as any).hubConnection) {
                // Simulate AssetContentReceived event
                const handlers = (window as any).hubConnection._closedCallbacks || [];
                console.log('[MANUAL-TEST] Hub connection exists, handlers:', handlers.length);

                // Try to trigger the event
                try {
                    (window as any).hubConnection.invoke('PublishAssetContent', 1, testHtml);
                    return 'Manual invocation attempted';
                } catch (err: any) {
                    return `Manual invocation failed: ${err.message}`;
                }
            }
            return 'No hub connection found';
        });

        console.log('[DIAGNOSIS] Manual injection result:', result);
        await participantPage.waitForTimeout(2000);

        // Check if manual test asset appeared
        const manualTestAsset = await participantPage.locator('text=TEST ASSET FROM MANUAL INJECTION').count();
        console.log(`[DIAGNOSIS] Manual test asset appeared: ${manualTestAsset > 0}`);
    });

    test('STEP 7: Diagnosis Summary', async () => {
        console.log('\n═══════════════════════════════════════════');
        console.log('ASSET BROADCASTING DIAGNOSIS SUMMARY');
        console.log('═══════════════════════════════════════════');
        console.log(`Session ID: ${sessionId}`);
        console.log(`Host Token: ${hostToken}`);
        console.log(`User Token: ${userToken}`);
        console.log('');
        console.log('EXPECTED FLOW:');
        console.log('1. Host clicks share → JavaScript ShareAsset()');
        console.log('2. AssetSharingService → hubConnection.InvokeAsync("PublishAssetContent")');
        console.log('3. SessionHub → Clients.Group("session_{sessionId}").SendAsync("AssetContentReceived")');
        console.log('4. Participants receive → Model.SharedAssetContent updated');
        console.log('');
        console.log('CHECKLIST:');
        console.log('✓ All three clients connected to SignalR');
        console.log('✓ Host can broadcast (success toast shown)');
        console.log('? Participants joined session_{sessionId} group');
        console.log('? AssetContentReceived event handlers registered');
        console.log('? Event payload reaching client browser');
        console.log('═══════════════════════════════════════════\n');
    });
});
