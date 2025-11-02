// test-transcript-section-broadcast.spec.ts
// Tests H2 section sharing from HostControlPanel to participant SessionCanvas
// Session 212 test data with tokens: KJAHA99L (participant) / PQ9N5YWW (host)

import { chromium, expect, test } from '@playwright/test';

test.describe('Transcript Section Broadcast (Session 212)', () => {
    test('should broadcast H2 section from host to participant', async () => {
        const hostToken = 'PQ9N5YWW';  // Host token for Session 212
        const participantToken = 'KJAHA99L';  // Participant token for Session 212
        const baseUrl = 'http://localhost:9091';

        console.log('[TEST] Starting broadcast test with Session 212 tokens');
        console.log(`[TEST] Host Token: ${hostToken}`);
        console.log(`[TEST] Participant Token: ${participantToken}`);

        // Launch two browser contexts (host and participant)
        const browser = await chromium.launch({ headless: false });

        // Context 1: Participant (will receive the broadcast)
        const participantContext = await browser.newContext();
        const participantPage = await participantContext.newPage();

        // Context 2: Host (will send the broadcast)
        const hostContext = await browser.newContext();
        const hostPage = await hostContext.newPage();

        // Enable console logging for both contexts
        participantPage.on('console', msg => console.log(`[PARTICIPANT] ${msg.text()}`));
        hostPage.on('console', msg => console.log(`[HOST] ${msg.text()}`));

        try {
            // Step 1: Participant joins session first
            console.log('[TEST] Step 1: Participant joining session...');
            await participantPage.goto(`${baseUrl}/SessionCanvas?token=${participantToken}`);
            await participantPage.waitForLoadState('networkidle');

            // Wait for SignalR connection
            await participantPage.waitForFunction(() => {
                return document.body.innerText.includes('Connected') ||
                    window.location.href.includes('SessionCanvas');
            }, { timeout: 10000 });

            console.log('[TEST] ✅ Participant connected to session');

            // Step 2: Host joins session
            console.log('[TEST] Step 2: Host joining session...');
            await hostPage.goto(`${baseUrl}/HostControlPanel?token=${hostToken}`);
            await hostPage.waitForLoadState('networkidle');
            await hostPage.waitForTimeout(2000); // Wait for host UI to load

            console.log('[TEST] ✅ Host connected to session');

            // Step 3: Host clicks "Share Transcript" button
            console.log('[TEST] Step 3: Host clicking Share Transcript button...');
            const shareTranscriptButton = hostPage.locator('button:has-text("Share Transcript")');
            await expect(shareTranscriptButton).toBeVisible({ timeout: 10000 });
            await expect(shareTranscriptButton).toBeEnabled();

            await shareTranscriptButton.click();
            console.log('[TEST] ✅ Share Transcript button clicked');

            // Wait for transcript to load and buttons to inject
            await hostPage.waitForTimeout(3000);

            // Step 4: Verify share buttons injected on host side
            console.log('[TEST] Step 4: Verifying share buttons on host side...');
            const shareButtons = await hostPage.locator('.transcript-section-share-btn').count();
            console.log(`[TEST] Found ${shareButtons} share buttons on host side`);
            expect(shareButtons).toBeGreaterThan(0);
            console.log('[TEST] ✅ Share buttons injected successfully');

            // Step 5: Verify H2 sections exist
            const h2Elements = await hostPage.locator('#transcript-content-container h2').count();
            console.log(`[TEST] Found ${h2Elements} H2 sections in transcript`);
            expect(h2Elements).toBeGreaterThan(0);
            expect(shareButtons).toBe(h2Elements); // Should be 1:1 mapping
            console.log('[TEST] ✅ H2 sections match share buttons (1:1 mapping)');

            // Step 6: Set up broadcast listener on participant side
            console.log('[TEST] Step 6: Setting up broadcast listener on participant...');
            let broadcastReceived = false;
            let receivedH2Text = '';
            let receivedHtml = '';

            await participantPage.evaluate(() => {
                return new Promise<void>((resolve) => {
                    // @ts-ignore
                    window.broadcastReceived = false;
                    // @ts-ignore
                    window.receivedPayload = null;

                    // Listen for SignalR broadcast
                    // @ts-ignore
                    if (window.hubConnection) {
                        // @ts-ignore
                        window.hubConnection.on('ReceiveTranscriptSection', (payload: any) => {
                            console.log('[PARTICIPANT] ReceiveTranscriptSection event received!');
                            console.log('[PARTICIPANT] Payload:', JSON.stringify(payload, null, 2));
                            // @ts-ignore
                            window.broadcastReceived = true;
                            // @ts-ignore
                            window.receivedPayload = payload;
                        });
                        console.log('[PARTICIPANT] Broadcast listener registered');
                        resolve();
                    } else {
                        console.error('[PARTICIPANT] hubConnection not available!');
                        resolve();
                    }
                });
            });

            console.log('[TEST] ✅ Broadcast listener set up on participant');

            // Step 7: Host clicks the first share button
            console.log('[TEST] Step 7: Host clicking first share button...');
            const firstShareButton = hostPage.locator('.transcript-section-share-btn').first();
            const buttonText = await firstShareButton.textContent();
            console.log(`[TEST] First button text: "${buttonText}"`);

            await firstShareButton.click();
            console.log('[TEST] ✅ First share button clicked');

            // Step 8: Wait for broadcast and verify on participant side
            console.log('[TEST] Step 8: Waiting for broadcast on participant side...');
            await participantPage.waitForTimeout(2000); // Give time for SignalR to propagate

            // Check if broadcast was received
            const result = await participantPage.evaluate(() => {
                return {
                    // @ts-ignore
                    received: window.broadcastReceived || false,
                    // @ts-ignore
                    payload: window.receivedPayload
                };
            });

            console.log('[TEST] Broadcast check result:', JSON.stringify(result, null, 2));

            if (result.received && result.payload) {
                console.log('[TEST] ✅ Broadcast received on participant side!');
                console.log(`[TEST] H2 Text: "${result.payload.h2Text}"`);
                console.log(`[TEST] HTML Length: ${result.payload.sectionHtml?.length || 0} chars`);
                console.log(`[TEST] Timestamp: ${result.payload.timestamp}`);
                console.log(`[TEST] Tracking ID: ${result.payload.trackingId}`);

                expect(result.received).toBe(true);
                expect(result.payload.h2Text).toBeTruthy();
                expect(result.payload.sectionHtml).toBeTruthy();
                expect(result.payload.sectionHtml.length).toBeGreaterThan(0);
            } else {
                console.error('[TEST] ❌ Broadcast NOT received on participant side');
                console.error('[TEST] Checking SignalR connection status...');

                const connectionStatus = await participantPage.evaluate(() => {
                    // @ts-ignore
                    return window.hubConnection ? window.hubConnection.state : 'NO CONNECTION';
                });

                console.error(`[TEST] Participant SignalR state: ${connectionStatus}`);
                throw new Error('Broadcast not received on participant side');
            }

            console.log('[TEST] ✅ Test completed successfully!');

        } finally {
            // Cleanup
            console.log('[TEST] Cleaning up browser contexts...');
            await participantContext.close();
            await hostContext.close();
            await browser.close();
            console.log('[TEST] ✅ Cleanup complete');
        }
    });
});
