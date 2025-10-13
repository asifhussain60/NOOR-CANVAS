import { ConsoleMessage, expect, Page, test } from '@playwright/test';

/**
 * canvas-questions-delete-trace.spec.ts
 * 
 * Comprehensive trace test for question deletion with SignalR propagation validation
 * 
 * Purpose:
 * - Submit question from User A
 * - Delete question from User A
 * - Verify SignalR broadcasts reach both users
 * - Track complete data lifecycle: UI → API → Database → SignalR → UI
 * - Capture all DEBUG-WORKITEM:canvas:delete:TRACE logs
 * 
 * Test Data:
 * - Session 212 (Session ID: 212)
 * - User Token: KJAHA99L (Peter Parker)
 * - Host Token: PQ9N5YWW
 * - Base URL: https://localhost:9091
 */

test.describe('Question Deletion with SignalR Trace', () => {
    let userAPage: Page;
    let userBPage: Page;
    let consoleLogsUserA: ConsoleMessage[] = [];
    let consoleLogsUserB: ConsoleMessage[] = [];

    test.beforeAll(async ({ browser }) => {
        // Create two isolated browser contexts
        const contextA = await browser.newContext();
        const contextB = await browser.newContext();

        userAPage = await contextA.newPage();
        userBPage = await contextB.newPage();

        // Capture console logs for both users
        userAPage.on('console', msg => {
            if (msg.text().includes('DEBUG-WORKITEM:canvas')) {
                consoleLogsUserA.push(msg);
                console.log(`[USER A] ${msg.text()}`);
            }
        });

        userBPage.on('console', msg => {
            if (msg.text().includes('DEBUG-WORKITEM:canvas')) {
                consoleLogsUserB.push(msg);
                console.log(`[USER B] ${msg.text()}`);
            }
        });
    });

    test.afterAll(async () => {
        // Save console logs for analysis
        const fs = require('fs');
        fs.writeFileSync('Workspaces/TEMP/delete-trace-userA.log',
            consoleLogsUserA.map(m => m.text()).join('\n'));
        fs.writeFileSync('Workspaces/TEMP/delete-trace-userB.log',
            consoleLogsUserB.map(m => m.text()).join('\n'));

        await userAPage.close();
        await userBPage.close();
    });

    test('Complete deletion flow with SignalR propagation trace', async () => {
        console.log('═════════════════════════════════════════════════════════');
        console.log('STEP 1: User A joins session');
        console.log('═════════════════════════════════════════════════════════');

        await userAPage.goto('https://localhost:9091/user/landing/KJAHA99L');
        await userAPage.waitForTimeout(2000); // Wait for redirect to SessionCanvas

        // Verify User A is on SessionCanvas
        await expect(userAPage).toHaveURL(/\/user\/canvas/);
        console.log('✅ User A successfully joined session');

        console.log('═════════════════════════════════════════════════════════');
        console.log('STEP 2: User B joins session');
        console.log('═════════════════════════════════════════════════════════');

        await userBPage.goto('https://localhost:9091/user/landing/KJAHA99L');
        await userBPage.waitForTimeout(2000);

        await expect(userBPage).toHaveURL(/\/user\/canvas/);
        console.log('✅ User B successfully joined session');

        console.log('═════════════════════════════════════════════════════════');
        console.log('STEP 3: User A submits question');
        console.log('═════════════════════════════════════════════════════════');

        const questionText = `[DELETE-TEST] Question submitted at ${new Date().toISOString()}`;

        // Wait for Q&A input to be enabled (session must be active)
        await userAPage.waitForSelector('input[placeholder="Ask a question..."]', { state: 'visible' });

        // Fill question input
        await userAPage.fill('input[placeholder="Ask a question..."]', questionText);

        // Click submit button
        await userAPage.click('button:has-text("Submit")');
        console.log(`📝 User A submitted question: "${questionText}"`);

        // Wait for question to appear in User A's list
        await userAPage.waitForSelector(`.canvas-question-item:has-text("${questionText}")`, { timeout: 5000 });
        console.log('✅ Question appeared in User A UI');

        // Wait for SignalR propagation to User B
        await userBPage.waitForSelector(`.canvas-question-item:has-text("${questionText}")`, { timeout: 5000 });
        console.log('✅ Question appeared in User B UI (SignalR propagation successful)');

        // Get question count before deletion
        const questionsBeforeA = await userAPage.locator('.canvas-question-item').count();
        const questionsBeforeB = await userBPage.locator('.canvas-question-item').count();
        console.log(`📊 Questions before deletion - User A: ${questionsBeforeA}, User B: ${questionsBeforeB}`);

        console.log('═════════════════════════════════════════════════════════');
        console.log('STEP 4: User A deletes question');
        console.log('═════════════════════════════════════════════════════════');

        // Locate the question card that contains our test question
        const questionCard = userAPage.locator(`.canvas-question-item:has-text("${questionText}")`);

        // Find the delete button within that question card
        const deleteButton = questionCard.locator('.canvas-question-delete-button');

        // Verify delete button exists
        await expect(deleteButton).toBeVisible({ timeout: 2000 });
        console.log('✅ Delete button found in User A UI');

        // Click delete button
        await deleteButton.click();
        console.log('🗑️ User A clicked delete button');

        // Wait for confirmation modal
        await userAPage.waitForSelector('.canvas-modal-overlay', { state: 'visible', timeout: 3000 });
        console.log('✅ Confirmation modal appeared');

        // Click "Delete" button in modal
        await userAPage.click('button:has-text("Delete")');
        console.log('✅ User A confirmed deletion');

        console.log('═════════════════════════════════════════════════════════');
        console.log('STEP 5: Wait for API call and SignalR broadcasts');
        console.log('═════════════════════════════════════════════════════════');

        // Wait for API call to complete (modal should close)
        await userAPage.waitForSelector('.canvas-modal-overlay', { state: 'hidden', timeout: 5000 });
        console.log('✅ Modal closed (API call completed)');

        // Wait for question to disappear from User A UI
        await userAPage.waitForSelector(`.canvas-question-item:has-text("${questionText}")`, {
            state: 'hidden',
            timeout: 5000
        }).catch(() => {
            console.warn('⚠️ Question did NOT disappear from User A UI after 5 seconds');
        });

        // Wait for question to disappear from User B UI
        await userBPage.waitForSelector(`.canvas-question-item:has-text("${questionText}")`, {
            state: 'hidden',
            timeout: 5000
        }).catch(() => {
            console.warn('⚠️ Question did NOT disappear from User B UI after 5 seconds');
        });

        console.log('═════════════════════════════════════════════════════════');
        console.log('STEP 6: Verify deletion in UI');
        console.log('═════════════════════════════════════════════════════════');

        // Get question count after deletion
        const questionsAfterA = await userAPage.locator('.canvas-question-item').count();
        const questionsAfterB = await userBPage.locator('.canvas-question-item').count();
        console.log(`📊 Questions after deletion - User A: ${questionsAfterA}, User B: ${questionsAfterB}`);

        // Verify question count decreased
        expect(questionsAfterA).toBe(questionsBeforeA - 1);
        expect(questionsAfterB).toBe(questionsBeforeB - 1);
        console.log('✅ Question count decreased by 1 in both users');

        // Verify question no longer exists
        const questionExistsA = await userAPage.locator(`.canvas-question-item:has-text("${questionText}")`).count();
        const questionExistsB = await userBPage.locator(`.canvas-question-item:has-text("${questionText}")`).count();

        expect(questionExistsA).toBe(0);
        expect(questionExistsB).toBe(0);
        console.log('✅ Question removed from both User A and User B UI');

        console.log('═════════════════════════════════════════════════════════');
        console.log('STEP 7: Verify persistence (page refresh)');
        console.log('═════════════════════════════════════════════════════════');

        // Refresh User A page
        await userAPage.reload();
        await userAPage.waitForTimeout(2000);

        // Verify question still does not exist after refresh
        const questionAfterRefreshA = await userAPage.locator(`.canvas-question-item:has-text("${questionText}")`).count();
        expect(questionAfterRefreshA).toBe(0);
        console.log('✅ Question remains deleted after page refresh (persistence validated)');

        console.log('═════════════════════════════════════════════════════════');
        console.log('STEP 8: Analyze trace logs');
        console.log('═════════════════════════════════════════════════════════');

        // Check for critical trace markers
        const userADeleteLogs = consoleLogsUserA.filter(m =>
            m.text().includes('DEBUG-WORKITEM:canvas-questions:delete') ||
            m.text().includes('DEBUG-WORKITEM:canvas:delete:TRACE')
        );

        const userBDeleteLogs = consoleLogsUserB.filter(m =>
            m.text().includes('QuestionDeleted') ||
            m.text().includes('DEBUG-WORKITEM:canvas:delete:TRACE')
        );

        console.log(`📝 User A deletion logs: ${userADeleteLogs.length} entries`);
        console.log(`📝 User B SignalR logs: ${userBDeleteLogs.length} entries`);

        // Verify key trace points
        const userAClickLog = consoleLogsUserA.some(m => m.text().includes('DELETE BUTTON CLICKED'));
        const userAConfirmLog = consoleLogsUserA.some(m => m.text().includes('DELETE CONFIRMED'));
        const userAApiSuccessLog = consoleLogsUserA.some(m => m.text().includes('Delete API call SUCCESS'));
        const userASignalRReceivedLog = consoleLogsUserA.some(m => m.text().includes('QuestionDeleted SIGNALR EVENT RECEIVED'));
        const userBSignalRReceivedLog = consoleLogsUserB.some(m => m.text().includes('QuestionDeleted SIGNALR EVENT RECEIVED'));

        console.log(`✅ User A - Delete button clicked: ${userAClickLog}`);
        console.log(`✅ User A - Delete confirmed: ${userAConfirmLog}`);
        console.log(`✅ User A - API success: ${userAApiSuccessLog}`);
        console.log(`✅ User A - SignalR received: ${userASignalRReceivedLog}`);
        console.log(`✅ User B - SignalR received: ${userBSignalRReceivedLog}`);

        // Assert trace points
        expect(userAClickLog, 'User A should log delete button click').toBe(true);
        expect(userAConfirmLog, 'User A should log delete confirmation').toBe(true);
        expect(userAApiSuccessLog, 'User A should log API success').toBe(true);
        expect(userASignalRReceivedLog, 'User A should receive SignalR event').toBe(true);
        expect(userBSignalRReceivedLog, 'User B should receive SignalR event').toBe(true);

        console.log('═════════════════════════════════════════════════════════');
        console.log('TEST COMPLETE - All trace points validated');
        console.log('═════════════════════════════════════════════════════════');
    });
});
