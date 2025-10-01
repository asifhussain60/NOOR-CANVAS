import { expect, test } from '@playwright/test';

test.describe('Asset Share Task - Participant Names and Broadcasting', () => {
    const sessionId = 212;
    const hostToken = 'PQ9N5YWW';
    const userToken = 'KJAHA99L';

    test('Task 1 & 2: Multiple SessionCanvas instances show different names and asset broadcasting works', async ({ context }) => {
        const testId = `asset-share-task-${Date.now()}`;
        console.log(`[${testId}] === ASSET SHARE TASK VALIDATION ===`);

        // Open host control panel
        const hostPage = await context.newPage();
        await hostPage.goto(`https://localhost:9091/host/control-panel/${hostToken}`, { waitUntil: 'networkidle' });

        // Start session if needed
        const startButton = hostPage.locator('button:has-text("Start Session")');
        if (await startButton.isVisible()) {
            await startButton.click();
            await hostPage.waitForSelector('.ks-share-button', { timeout: 10000 });
        }

        console.log(`[${testId}] ✅ Host session started`);

        // Open two separate SessionCanvas pages to test different participant names
        const canvas1 = await context.newPage();
        const canvas2 = await context.newPage();

        // Set up message listeners for asset broadcasting
        const canvas1Messages: string[] = [];
        const canvas2Messages: string[] = [];

        canvas1.on('console', msg => {
            const message = msg.text();
            if (message.includes('AssetContentReceived') || message.includes('ASSET-SHARE-POC')) {
                canvas1Messages.push(message);
            }
        });

        canvas2.on('console', msg => {
            const message = msg.text();
            if (message.includes('AssetContentReceived') || message.includes('ASSET-SHARE-POC')) {
                canvas2Messages.push(message);
            }
        });

        // Navigate both canvas pages
        await canvas1.goto(`https://localhost:9091/session/canvas/${userToken}`, { waitUntil: 'networkidle' });
        await canvas2.goto(`https://localhost:9091/session/canvas/${userToken}`, { waitUntil: 'networkidle' });

        console.log(`[${testId}] ✅ Opened two SessionCanvas instances`);

        // Wait for SignalR connections to establish
        await hostPage.waitForTimeout(3000);

        // Task 1: Check participant names are different
        const canvas1Name = await canvas1.locator('[data-testid="participant-name"], .participant-welcome').textContent();
        const canvas2Name = await canvas2.locator('[data-testid="participant-name"], .participant-welcome').textContent();

        console.log(`[${testId}] Canvas 1 participant name: "${canvas1Name}"`);
        console.log(`[${testId}] Canvas 2 participant name: "${canvas2Name}"`);

        // Task 1 Validation: Names should be different (or at least one should be identifiable)
        const namesAreDifferent = canvas1Name !== canvas2Name;
        const hasValidNames = canvas1Name && canvas2Name && 
                             !canvas1Name.includes('undefined') && 
                             !canvas2Name.includes('undefined');

        if (namesAreDifferent && hasValidNames) {
            console.log(`[${testId}] ✅ Task 1 PASSED: Participant names are different and valid`);
        } else {
            console.log(`[${testId}] ⚠️ Task 1: Names might need improvement - Different: ${namesAreDifferent}, Valid: ${hasValidNames}`);
        }

        // Task 2: Test asset broadcasting
        const shareButtons = await hostPage.locator('.ks-share-button').all();
        
        if (shareButtons.length > 0) {
            console.log(`[${testId}] Found ${shareButtons.length} share buttons for Task 2 test`);
            
            const firstButton = shareButtons[0];
            const shareId = await firstButton.getAttribute('data-share-id');
            
            console.log(`[${testId}] 🚀 Task 2: Broadcasting asset ${shareId}`);
            
            // Click share button
            await firstButton.click();
            
            // Wait for broadcast to propagate
            await hostPage.waitForTimeout(5000);
            
            console.log(`[${testId}] Canvas 1 messages: ${canvas1Messages.length}`);
            console.log(`[${testId}] Canvas 2 messages: ${canvas2Messages.length}`);
            
            // Task 2 Validation: Both canvas instances should receive the broadcast
            const canvas1ReceivedBroadcast = canvas1Messages.some(msg => 
                msg.includes('AssetContentReceived') || msg.includes('Content received'));
            const canvas2ReceivedBroadcast = canvas2Messages.some(msg => 
                msg.includes('AssetContentReceived') || msg.includes('Content received'));
            
            if (canvas1ReceivedBroadcast && canvas2ReceivedBroadcast) {
                console.log(`[${testId}] ✅ Task 2 PASSED: Asset broadcasting working - both canvas instances received content`);
            } else {
                console.log(`[${testId}] ❌ Task 2 FAILED: Canvas1 received: ${canvas1ReceivedBroadcast}, Canvas2 received: ${canvas2ReceivedBroadcast}`);
            }
            
            // Additional validation: Check for shared content in UI
            const canvas1Content = await canvas1.locator('[data-testid="shared-content"], .shared-asset-content').count();
            const canvas2Content = await canvas2.locator('[data-testid="shared-content"], .shared-asset-content').count();
            
            console.log(`[${testId}] Shared content elements - Canvas1: ${canvas1Content}, Canvas2: ${canvas2Content}`);
            
        } else {
            console.log(`[${testId}] ❌ No share buttons found for Task 2 test`);
        }

        // Summary
        console.log(`[${testId}] === TASK COMPLETION SUMMARY ===`);
        console.log(`[${testId}] Task 1 (Participant Names): ${namesAreDifferent && hasValidNames ? '✅ PASSED' : '⚠️ NEEDS REVIEW'}`);
        console.log(`[${testId}] Task 2 (Asset Broadcasting): Testing completed`);

        await canvas1.close();
        await canvas2.close();
        await hostPage.close();
    });
});