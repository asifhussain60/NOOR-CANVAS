import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

test.describe('Share Transcript Navigation', () => {
    const BASE_URL = 'https://localhost:9091';
    const HOST_TOKEN = 'PQ9N5YWW'; // Session 212 host token
    const USER_TOKEN = 'KJAHA99L'; // Session 212 user token

    test('should navigate participants from waiting room to TranscriptCanvas when host clicks Share Transcript', async ({ browser }) => {
        // Create two browser contexts: one for host, one for participant
        const hostContext = await browser.newContext();
        const participantContext = await browser.newContext();

        const hostPage = await hostContext.newPage();
        const participantPage = await participantContext.newPage();

        try {
            // Track console messages
            const hostLogs: string[] = [];
            const participantLogs: string[] = [];

            hostPage.on('console', msg => hostLogs.push(`[HOST ${msg.type()}] ${msg.text()}`));
            participantPage.on('console', msg => participantLogs.push(`[PARTICIPANT ${msg.type()}] ${msg.text()}`));

            // Step 1: Load Host Control Panel
            console.log('[STEP] Loading Host Control Panel...');
            await hostPage.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
            await hostPage.waitForLoadState('networkidle');
            await expect(hostPage.locator('h2')).toContainText('Session', { timeout: 10000 });
            console.log('[PASS] Host Control Panel loaded');

            // Percy snapshot: Host Control Panel
            await percySnapshot(hostPage, 'Share Transcript - Host Control Panel');

            // Step 2: Load Participant Waiting Room
            console.log('[STEP] Loading Participant Waiting Room...');
            await participantPage.goto(`${BASE_URL}/session/waiting/${USER_TOKEN}`);
            await participantPage.waitForLoadState('networkidle');

            // Wait for waiting room to be ready
            const waitingRoomTitle = participantPage.locator('h2, h1, [class*="title"]').first();
            await expect(waitingRoomTitle).toBeVisible({ timeout: 10000 });
            console.log('[PASS] Participant Waiting Room loaded');

            // Percy snapshot: Waiting Room Before Share
            await percySnapshot(participantPage, 'Share Transcript - Waiting Room Before Share');

            // Step 3: Verify Share Transcript button is visible on host panel
            const shareButton = hostPage.locator('button:has-text("Share Transcript")');
            await expect(shareButton).toBeVisible({ timeout: 10000 });
            console.log('[PASS] Share Transcript button visible');

            // Percy snapshot: Before Share Click
            await percySnapshot(hostPage, 'Share Transcript - Before Click');

            // Step 4: Click Share Transcript button
            console.log('[ACTION] Host clicking Share Transcript button...');
            await shareButton.click();

            // Wait for toast/message confirmation
            await hostPage.waitForTimeout(1000);

            // Step 5: Verify participant navigated to TranscriptCanvas
            console.log('[WAIT] Waiting for participant navigation to TranscriptCanvas...');
            await participantPage.waitForURL(`**/transcript/canvas/${USER_TOKEN}`, { timeout: 15000 });
            console.log('[PASS] Participant navigated to TranscriptCanvas');

            // Wait for TranscriptCanvas to load
            await participantPage.waitForLoadState('networkidle');

            // Verify TranscriptCanvas elements loaded
            const transcriptContent = participantPage.locator('[class*="transcript"], [class*="canvas"]').first();
            await expect(transcriptContent).toBeVisible({ timeout: 10000 });

            // Percy snapshot: Participant on TranscriptCanvas
            await percySnapshot(participantPage, 'Share Transcript - Participant on TranscriptCanvas');

            // Step 6: Verify host stayed on control panel (did NOT navigate)
            const hostUrl = hostPage.url();
            expect(hostUrl).toContain(`/host/control-panel/${HOST_TOKEN}`);
            console.log('[VERIFY] Host remained on control panel:', hostUrl);

            // Step 7: Verify participant URL is correct
            const participantUrl = participantPage.url();
            expect(participantUrl).toContain(`/transcript/canvas/${USER_TOKEN}`);
            console.log('[VERIFY] Participant on TranscriptCanvas:', participantUrl);

            // Step 8: Check for errors
            const hostErrors = hostLogs.filter(log => log.includes('[HOST error]') || log.includes('ERROR'));
            const participantErrors = participantLogs.filter(log => log.includes('[PARTICIPANT error]') || log.includes('ERROR'));

            if (hostErrors.length > 0) {
                console.warn('[WARN] Host errors detected:', hostErrors);
            }

            if (participantErrors.length > 0) {
                console.warn('[WARN] Participant errors detected:', participantErrors);
            }

            console.log('[PASS] Test completed successfully - participants navigated, host stayed on control panel');

        } finally {
            // Cleanup
            await hostPage.close();
            await participantPage.close();
            await hostContext.close();
            await participantContext.close();
        }
    });
});
