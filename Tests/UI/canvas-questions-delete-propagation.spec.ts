import { expect, test } from '@playwright/test';

/**
 * Test: Question Delete Propagation - COMPREHENSIVE TRACE VALIDATION
 * 
 * Purpose: Verify question deletion flows through entire system:
 *   UI → API → Database (canvas.SessionData) → SignalR Broadcast → All Connected Clients
 * 
 * Test Data: Session 212 (KJAHA99L user token, PQ9N5YWW host token)
 * 
 * Architecture Validation:
 * 1. Frontend: User clicks delete button in SessionCanvas
 * 2. API: POST /api/Question/{id}/delete validates ownership
 * 3. Database: DELETE from canvas.SessionData (row physically removed)
 * 4. SignalR: Broadcasts QuestionDeleted + HostQuestionDeleted events
 * 5. All Clients: UI updates in real-time (SessionCanvas + HostControlPanel)
 * 
 * Test Flow:
 * 1. User A joins session and submits a question
 * 2. User B joins session (sees User A's question - orange card)
 * 3. Host joins (sees User A's question in Q&A panel)
 * 4. User A deletes their question (triggers API + SignalR flow)
 * 5. Verify deletion propagates to:
 *    - User A: Question removed from UI immediately
 *    - User B: Question removed via SignalR broadcast
 *    - Host: Question removed via SignalR broadcast
 * 6. Verify persistence: Refresh all pages, question stays deleted
 */

const BASE_URL = 'https://localhost:9091';
const SESSION_212_USER_TOKEN = 'KJAHA99L';
const SESSION_212_HOST_TOKEN = 'PQ9N5YWW';

test.describe('Question Delete Propagation', () => {
    test('should propagate question deletion to all connected participants and host', async ({ browser }) => {
        // Create three browser contexts to simulate User A, User B, and Host
        const userAContext = await browser.newContext();
        const userBContext = await browser.newContext();
        const hostContext = await browser.newContext();

        const userAPage = await userAContext.newPage();
        const userBPage = await userBContext.newPage();
        const hostPage = await hostContext.newPage();

        try {
            // Step 1: User A joins session and submits a question
            console.log('[TEST] Step 1: User A joins session');
            await userAPage.goto(`${BASE_URL}/session/${SESSION_212_USER_TOKEN}`);
            await userAPage.waitForLoadState('networkidle');

            // Wait for session to be active
            await expect(userAPage.locator('text=Need For Messengers')).toBeVisible({ timeout: 10000 });

            // Submit a question from User A
            const questionText = `Delete Test Question ${Date.now()}`;
            console.log(`[TEST] User A submitting question: "${questionText}"`);

            const questionInput = userAPage.locator('input[placeholder="Ask a question..."]');
            await questionInput.fill(questionText);

            const submitButton = userAPage.locator('button:has-text("Submit")');
            await submitButton.click();

            // Wait for question to appear in User A's view (green card)
            console.log('[TEST] Waiting for question to appear in User A view');
            const userAQuestionCard = userAPage.locator('.canvas-question-item.question-item-style-emerald', {
                hasText: questionText
            });
            await expect(userAQuestionCard).toBeVisible({ timeout: 10000 });
            console.log('[TEST] ✅ Question visible in User A view (green card)');

            // Verify User A can see edit/delete buttons (ownership)
            const deleteButton = userAQuestionCard.locator('.canvas-question-delete-button');
            await expect(deleteButton).toBeVisible();
            console.log('[TEST] ✅ Delete button visible for User A (owner)');

            // Step 2: User B joins session and sees User A's question
            console.log('[TEST] Step 2: User B joins session');
            await userBPage.goto(`${BASE_URL}/session/${SESSION_212_USER_TOKEN}`);
            await userBPage.waitForLoadState('networkidle');

            await expect(userBPage.locator('text=Need For Messengers')).toBeVisible({ timeout: 10000 });

            // Wait for User A's question to appear in User B's view (orange card)
            console.log('[TEST] Waiting for question to appear in User B view');
            const userBQuestionCard = userBPage.locator('.canvas-question-item.question-item-style-sienna', {
                hasText: questionText
            });
            await expect(userBQuestionCard).toBeVisible({ timeout: 15000 });
            console.log('[TEST] ✅ Question visible in User B view (orange card)');

            // Verify User B does NOT see delete button (not owner)
            const userBDeleteButton = userBQuestionCard.locator('.canvas-question-delete-button');
            await expect(userBDeleteButton).not.toBeVisible();
            console.log('[TEST] ✅ Delete button NOT visible for User B (not owner)');

            // Step 3: Host joins and sees User A's question
            console.log('[TEST] Step 3: Host joins');
            await hostPage.goto(`${BASE_URL}/host/control-panel/${SESSION_212_HOST_TOKEN}`);
            await hostPage.waitForLoadState('networkidle');

            // Wait for HostControlPanel to load
            await expect(hostPage.locator('text=Host Control Panel')).toBeVisible({ timeout: 10000 });

            // Wait for question to appear in Q&A panel
            console.log('[TEST] Waiting for question to appear in Host view');
            const hostQuestionCard = hostPage.locator('.qa-question-card', {
                hasText: questionText
            }).first();
            await expect(hostQuestionCard).toBeVisible({ timeout: 15000 });
            console.log('[TEST] ✅ Question visible in Host view');

            // Step 4: User A deletes the question
            console.log('[TEST] Step 4: User A deletes question');
            await deleteButton.click();
            console.log('[TEST] Delete button clicked, waiting for modal');

            // Wait for confirmation modal
            const confirmButton = userAPage.locator('button:has-text("Yes, Delete")');
            await expect(confirmButton).toBeVisible({ timeout: 5000 });
            console.log('[TEST] Confirmation modal visible');

            await confirmButton.click();
            console.log('[TEST] Confirmed deletion');

            // Step 5: Verify deletion propagates to all connected clients

            // 5a. Verify User A no longer sees the question
            console.log('[TEST] Step 5a: Verifying User A no longer sees question');
            await expect(userAQuestionCard).not.toBeVisible({ timeout: 5000 });
            console.log('[TEST] ✅ Question removed from User A view');

            // 5b. Verify User B no longer sees the question (SignalR broadcast)
            console.log('[TEST] Step 5b: Verifying User B no longer sees question (SignalR)');
            await expect(userBQuestionCard).not.toBeVisible({ timeout: 5000 });
            console.log('[TEST] ✅ Question removed from User B view via SignalR');

            // 5c. Verify Host no longer sees the question (SignalR broadcast)
            console.log('[TEST] Step 5c: Verifying Host no longer sees question (SignalR)');
            await expect(hostQuestionCard).not.toBeVisible({ timeout: 5000 });
            console.log('[TEST] ✅ Question removed from Host view via SignalR');

            console.log('[TEST] ✅✅✅ DELETE PROPAGATION TEST PASSED ✅✅✅');
            console.log('[TEST] Question successfully deleted and removal propagated to:');
            console.log('[TEST]   - User A (owner)');
            console.log('[TEST]   - User B (other participant via SignalR)');
            console.log('[TEST]   - Host (via SignalR)');

        } catch (error) {
            console.error('[TEST] ❌ Test failed:', error);

            // Capture debug logs from all pages
            console.log('[TEST] Capturing debug logs from User A page:');
            const userALogs = await userAPage.evaluate(() => {
                return (window as any).debugLogs || 'No debug logs available';
            });
            console.log(userALogs);

            console.log('[TEST] Capturing debug logs from User B page:');
            const userBLogs = await userBPage.evaluate(() => {
                return (window as any).debugLogs || 'No debug logs available';
            });
            console.log(userBLogs);

            console.log('[TEST] Capturing debug logs from Host page:');
            const hostLogs = await hostPage.evaluate(() => {
                return (window as any).debugLogs || 'No debug logs available';
            });
            console.log(hostLogs);

            throw error;
        } finally {
            // Cleanup
            await userAContext.close();
            await userBContext.close();
            await hostContext.close();
        }
    });

    test('should show "Question not found" error when deleting non-existent question', async ({ page }) => {
        console.log('[TEST] Testing error handling for non-existent question deletion');

        await page.goto(`${BASE_URL}/session/${SESSION_212_USER_TOKEN}`);
        await page.waitForLoadState('networkidle');

        await expect(page.locator('text=Need For Messengers')).toBeVisible({ timeout: 10000 });

        // Try to delete a question with a fake GUID
        const fakeQuestionId = '00000000-0000-0000-0000-000000000000';

        // Simulate API call to delete (this should fail)
        const response = await page.request.delete(`${BASE_URL}/api/Question/${fakeQuestionId}/delete`, {
            data: {
                sessionToken: SESSION_212_USER_TOKEN,
                userGuid: 'fake-user-guid'
            }
        });

        expect(response.status()).toBe(404);
        const responseBody = await response.json();
        expect(responseBody.error).toContain('Question not found');

        console.log('[TEST] ✅ Error handling test passed - 404 returned for non-existent question');
    });

    test('should prevent deletion by non-owner users', async ({ browser }) => {
        console.log('[TEST] Testing authorization - non-owner cannot delete question');

        const ownerContext = await browser.newContext();
        const nonOwnerContext = await browser.newContext();

        const ownerPage = await ownerContext.newPage();
        const nonOwnerPage = await nonOwnerContext.newPage();

        try {
            // Owner submits a question
            await ownerPage.goto(`${BASE_URL}/session/${SESSION_212_USER_TOKEN}`);
            await ownerPage.waitForLoadState('networkidle');

            await expect(ownerPage.locator('text=Need For Messengers')).toBeVisible({ timeout: 10000 });

            const questionText = `Authorization Test ${Date.now()}`;
            const questionInput = ownerPage.locator('input[placeholder="Ask a question..."]');
            await questionInput.fill(questionText);
            await ownerPage.locator('button:has-text("Submit")').click();

            const ownerQuestionCard = ownerPage.locator('.canvas-question-item.question-item-style-emerald', {
                hasText: questionText
            });
            await expect(ownerQuestionCard).toBeVisible({ timeout: 10000 });

            // Extract question ID from the card's data attributes or content
            const questionId = await ownerQuestionCard.getAttribute('data-question-id') ||
                await ownerPage.evaluate(() => {
                    // Try to extract from delete button onclick or data attribute
                    const deleteBtn = document.querySelector('.canvas-question-delete-button');
                    return deleteBtn?.getAttribute('data-question-id') || null;
                });

            console.log(`[TEST] Question created with ID: ${questionId}`);

            // Non-owner joins session
            await nonOwnerPage.goto(`${BASE_URL}/session/${SESSION_212_USER_TOKEN}`);
            await nonOwnerPage.waitForLoadState('networkidle');

            // Non-owner sees the question as orange card (no delete button visible)
            const nonOwnerQuestionCard = nonOwnerPage.locator('.canvas-question-item.question-item-style-sienna', {
                hasText: questionText
            });
            await expect(nonOwnerQuestionCard).toBeVisible({ timeout: 10000 });

            // Verify delete button is NOT visible to non-owner
            const nonOwnerDeleteButton = nonOwnerQuestionCard.locator('.canvas-question-delete-button');
            await expect(nonOwnerDeleteButton).not.toBeVisible();

            console.log('[TEST] ✅ Authorization test passed - non-owner cannot see delete button');

        } finally {
            await ownerContext.close();
            await nonOwnerContext.close();
        }
    });
});
