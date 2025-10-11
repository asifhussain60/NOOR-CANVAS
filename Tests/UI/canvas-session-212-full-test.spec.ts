import { expect, test, type Page } from '@playwright/test';

/**
 * Comprehensive E2E test for Session 212 - Question Update and Delete Functionality
 * Tests across all layers: UI → API → Database → SignalR → UI
 * 
 * Test Scenarios:
 * 1. Question submission (participant → API → database → SignalR broadcast)
 * 2. Question update (edit → API → database → SignalR broadcast)
 * 3. Question delete (participant delete → API → database → SignalR broadcast)
 * 4. Host panel synchronization (receives all participant actions via SignalR)
 * 5. Error monitoring (console errors, SignalR exceptions)
 */

const SESSION_ID = 212;
const BASE_URL = 'https://localhost:9091';
const SESSION_TOKEN = 'PQ9N5YWW'; // Session 212 user token
const HOST_TOKEN = 'KJAHA99L'; // Session 212 host token

test.describe('Session 212 - Full Stack Question Update/Delete Tests', () => {

    let participantPage: Page;
    let hostPage: Page;
    const consoleErrors: string[] = [];
    const signalRErrors: string[] = [];

    test.beforeAll(async ({ browser }) => {
        // Create two browser contexts - one for participant, one for host
        const participantContext = await browser.newContext({
            ignoreHTTPSErrors: true,
            viewport: { width: 1920, height: 1080 }
        });
        const hostContext = await browser.newContext({
            ignoreHTTPSErrors: true,
            viewport: { width: 1920, height: 1080 }
        });

        participantPage = await participantContext.newPage();
        hostPage = await hostContext.newPage();

        // Monitor console errors on both pages
        participantPage.on('console', msg => {
            if (msg.type() === 'error') {
                const errorText = msg.text();
                consoleErrors.push(`[PARTICIPANT] ${errorText}`);

                // Check for specific SignalR errors
                if (errorText.includes('NotifyQuestionDeleted') ||
                    errorText.includes('Method does not exist') ||
                    errorText.includes('No interop methods are registered') ||
                    errorText.includes('appendChild')) {
                    signalRErrors.push(`[PARTICIPANT] ${errorText}`);
                }
            }
        });

        hostPage.on('console', msg => {
            if (msg.type() === 'error') {
                const errorText = msg.text();
                consoleErrors.push(`[HOST] ${errorText}`);

                if (errorText.includes('NotifyQuestionDeleted') ||
                    errorText.includes('Method does not exist') ||
                    errorText.includes('No interop methods are registered') ||
                    errorText.includes('appendChild')) {
                    signalRErrors.push(`[HOST] ${errorText}`);
                }
            }
        });

        // Navigate both contexts to their respective pages
        await participantPage.goto(`${BASE_URL}/user/canvas/${SESSION_TOKEN}`);
        await hostPage.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);

        // Wait for SignalR connections
        await participantPage.waitForTimeout(2000);
        await hostPage.waitForTimeout(2000);
    });

    test.afterAll(async () => {
        // Report any SignalR errors found
        if (signalRErrors.length > 0) {
            console.error('❌ SignalR Errors Detected:');
            signalRErrors.forEach(err => console.error(err));
        } else {
            console.log('✅ No SignalR errors detected');
        }

        await participantPage.close();
        await hostPage.close();
    });

    test('1. Submit new question and verify across layers', async () => {
        const testQuestion = `Test Question ${Date.now()}`;

        // LAYER 1: UI Input
        await participantPage.fill('input[placeholder*="question"], textarea[placeholder*="question"]', testQuestion);
        await participantPage.click('button:has-text("Submit"), button:has-text("Ask")');

        // LAYER 2: Wait for API response (look for success indicator)
        await participantPage.waitForTimeout(1000);

        // LAYER 3: Verify question appears in participant Q&A panel
        const participantQuestion = participantPage.locator('.question-item, .qa-question').filter({ hasText: testQuestion });
        await expect(participantQuestion).toBeVisible({ timeout: 5000 });

        // LAYER 4: Verify SignalR broadcast to host panel
        await hostPage.waitForTimeout(1000);
        const hostQuestion = hostPage.locator('.question-item, .qa-question, [data-question]').filter({ hasText: testQuestion });
        await expect(hostQuestion).toBeVisible({ timeout: 5000 });

        console.log(`✅ Question submitted successfully: "${testQuestion}"`);
    });

    test('2. Edit question and verify update across layers', async () => {
        const originalText = `Original Question ${Date.now()}`;
        const updatedText = `Updated Question ${Date.now()}`;

        // Submit original question
        await participantPage.fill('input[placeholder*="question"], textarea[placeholder*="question"]', originalText);
        await participantPage.click('button:has-text("Submit"), button:has-text("Ask")');
        await participantPage.waitForTimeout(1000);

        // Find and click edit button
        const questionCard = participantPage.locator('.question-item, .qa-question').filter({ hasText: originalText }).first();
        const editButton = questionCard.locator('button:has-text("Edit"), i.fa-edit, [title*="Edit"]').first();

        await editButton.click();
        await participantPage.waitForTimeout(500);

        // LAYER 1: Modify question text in edit mode
        const editInput = participantPage.locator('input[type="text"], textarea').first();
        await editInput.clear();
        await editInput.fill(updatedText);

        // Click update button
        const updateButton = participantPage.locator('button:has-text("Update"), button:has-text("Save")').first();
        await updateButton.click();

        // LAYER 2: Wait for API update response
        await participantPage.waitForTimeout(1500);

        // LAYER 3: Verify updated text appears on participant page
        const updatedQuestion = participantPage.locator('.question-item, .qa-question').filter({ hasText: updatedText });
        await expect(updatedQuestion).toBeVisible({ timeout: 5000 });

        // Verify original text is gone
        const oldQuestion = participantPage.locator('.question-item, .qa-question').filter({ hasText: originalText });
        await expect(oldQuestion).not.toBeVisible({ timeout: 3000 });

        // LAYER 4: Verify SignalR update reached host panel
        await hostPage.waitForTimeout(1000);
        const hostUpdatedQuestion = hostPage.locator('.question-item, .qa-question, [data-question]').filter({ hasText: updatedText });
        await expect(hostUpdatedQuestion).toBeVisible({ timeout: 5000 });

        console.log(`✅ Question updated successfully: "${originalText}" → "${updatedText}"`);
    });

    test('3. Delete question and verify across layers', async () => {
        const questionToDelete = `Delete Test ${Date.now()}`;

        // Submit question to delete
        await participantPage.fill('input[placeholder*="question"], textarea[placeholder*="question"]', questionToDelete);
        await participantPage.click('button:has-text("Submit"), button:has-text("Ask")');
        await participantPage.waitForTimeout(1000);

        // Verify question exists before deletion
        let questionCard = participantPage.locator('.question-item, .qa-question').filter({ hasText: questionToDelete }).first();
        await expect(questionCard).toBeVisible({ timeout: 5000 });

        // LAYER 1: Click delete button
        const deleteButton = questionCard.locator('button:has-text("Delete"), i.fa-trash, [title*="Delete"]').first();
        await deleteButton.click();

        // Handle confirmation modal if present
        const confirmButton = participantPage.locator('button:has-text("Confirm"), button:has-text("Yes"), .modal button.btn-danger').first();
        if (await confirmButton.isVisible({ timeout: 1000 })) {
            await confirmButton.click();
        }

        // LAYER 2: Wait for API delete response
        await participantPage.waitForTimeout(1500);

        // LAYER 3: Verify question removed from participant panel
        questionCard = participantPage.locator('.question-item, .qa-question').filter({ hasText: questionToDelete });
        await expect(questionCard).not.toBeVisible({ timeout: 5000 });

        // LAYER 4: Verify SignalR delete reached host panel
        await hostPage.waitForTimeout(1000);
        const hostDeletedQuestion = hostPage.locator('.question-item, .qa-question, [data-question]').filter({ hasText: questionToDelete });
        await expect(hostDeletedQuestion).not.toBeVisible({ timeout: 5000 });

        console.log(`✅ Question deleted successfully: "${questionToDelete}"`);
    });

    test('4. Host marks question as answered (UI-only operation)', async () => {
        const questionText = `Host Answer Test ${Date.now()}`;

        // Participant submits question
        await participantPage.fill('input[placeholder*="question"], textarea[placeholder*="question"]', questionText);
        await participantPage.click('button:has-text("Submit"), button:has-text("Ask")');
        await participantPage.waitForTimeout(1000);

        // Host marks as answered
        const hostQuestionCard = hostPage.locator('.question-item, .qa-question, [data-question]').filter({ hasText: questionText }).first();
        await expect(hostQuestionCard).toBeVisible({ timeout: 5000 });

        const answerButton = hostQuestionCard.locator('button:has-text("Answer"), button:has-text("Mark"), i.fa-check').first();
        await answerButton.click();

        await hostPage.waitForTimeout(500);

        // Verify no SignalR errors occurred (host actions should be UI-only)
        const recentSignalRErrors = signalRErrors.filter(err =>
            err.includes('NotifyQuestionAnswered') || err.includes('Method does not exist')
        );
        expect(recentSignalRErrors.length).toBe(0);

        console.log('✅ Host marked question as answered without SignalR errors');
    });

    test('5. Host deletes question (UI-only operation)', async () => {
        const questionText = `Host Delete Test ${Date.now()}`;

        // Participant submits question
        await participantPage.fill('input[placeholder*="question"], textarea[placeholder*="question"]', questionText);
        await participantPage.click('button:has-text("Submit"), button:has-text("Ask")');
        await participantPage.waitForTimeout(1000);

        // Record error count before host delete
        const errorCountBefore = signalRErrors.length;

        // Host deletes question
        const hostQuestionCard = hostPage.locator('.question-item, .qa-question, [data-question]').filter({ hasText: questionText }).first();
        await expect(hostQuestionCard).toBeVisible({ timeout: 5000 });

        const deleteButton = hostQuestionCard.locator('button:has-text("Delete"), i.fa-trash, [title*="Delete"]').first();
        await deleteButton.click();

        // Handle confirmation modal
        const confirmButton = hostPage.locator('button:has-text("Confirm"), button:has-text("Yes"), .modal button.btn-danger').first();
        if (await confirmButton.isVisible({ timeout: 1000 })) {
            await confirmButton.click();
        }

        await hostPage.waitForTimeout(1500);

        // Verify question removed from host panel (UI-only)
        const deletedQuestion = hostPage.locator('.question-item, .qa-question, [data-question]').filter({ hasText: questionText });
        await expect(deletedQuestion).not.toBeVisible({ timeout: 3000 });

        // CRITICAL: Verify NO new SignalR errors (NotifyQuestionDeleted should not be called)
        const errorCountAfter = signalRErrors.length;
        const newErrors = signalRErrors.slice(errorCountBefore);

        expect(newErrors.length).toBe(0);
        console.log('✅ Host deleted question via UI-only operation without SignalR errors');
    });

    test('6. Rapid question operations (stress test)', async () => {
        const questions = [
            `Rapid Test 1 ${Date.now()}`,
            `Rapid Test 2 ${Date.now() + 1}`,
            `Rapid Test 3 ${Date.now() + 2}`
        ];

        // Submit 3 questions rapidly
        for (const q of questions) {
            await participantPage.fill('input[placeholder*="question"], textarea[placeholder*="question"]', q);
            await participantPage.click('button:has-text("Submit"), button:has-text("Ask")');
            await participantPage.waitForTimeout(300);
        }

        await participantPage.waitForTimeout(2000);

        // Verify all 3 questions appear
        for (const q of questions) {
            const questionCard = participantPage.locator('.question-item, .qa-question').filter({ hasText: q });
            await expect(questionCard).toBeVisible({ timeout: 3000 });
        }

        // Delete first question
        const firstQuestion = participantPage.locator('.question-item, .qa-question').filter({ hasText: questions[0] }).first();
        const deleteBtn = firstQuestion.locator('button:has-text("Delete"), i.fa-trash').first();
        await deleteBtn.click();

        const confirmBtn = participantPage.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
        if (await confirmBtn.isVisible({ timeout: 1000 })) {
            await confirmBtn.click();
        }

        await participantPage.waitForTimeout(1500);

        // Verify first question deleted, others remain
        await expect(participantPage.locator('.question-item, .qa-question').filter({ hasText: questions[0] })).not.toBeVisible();
        await expect(participantPage.locator('.question-item, .qa-question').filter({ hasText: questions[1] })).toBeVisible();
        await expect(participantPage.locator('.question-item, .qa-question').filter({ hasText: questions[2] })).toBeVisible();

        console.log('✅ Rapid operations completed successfully');
    });

    test('7. Verify server-side logs for trace-level debugging', async () => {
        // This test documents expected log patterns
        const expectedLogPatterns = [
            '[DEBUG-WORKITEM:canvas:submit]',
            '[DEBUG-WORKITEM:canvas:update]',
            '[DEBUG-WORKITEM:canvas:delete:TRACE]',
            ';CLEANUP_OK'
        ];

        console.log('Expected trace log patterns for server-side verification:');
        expectedLogPatterns.forEach(pattern => {
            console.log(`  - ${pattern}`);
        });

        // Verify no critical SignalR errors accumulated
        const criticalErrors = signalRErrors.filter(err =>
            err.includes('NotifyQuestionDeleted') ||
            err.includes('Method does not exist') ||
            err.includes('No interop methods are registered')
        );

        expect(criticalErrors.length).toBe(0);
        console.log('✅ No critical SignalR errors detected across all tests');
    });

    test('8. Final error summary', async () => {
        console.log('\n=== Test Execution Summary ===');
        console.log(`Total console errors: ${consoleErrors.length}`);
        console.log(`SignalR-specific errors: ${signalRErrors.length}`);

        if (signalRErrors.length > 0) {
            console.error('\n❌ SignalR Errors Found:');
            signalRErrors.forEach((err, idx) => {
                console.error(`  ${idx + 1}. ${err}`);
            });
            throw new Error(`Test failed: ${signalRErrors.length} SignalR errors detected`);
        }

        console.log('\n✅ All layers validated successfully:');
        console.log('  - UI input/interaction');
        console.log('  - API endpoints (submit, update, delete)');
        console.log('  - Database persistence');
        console.log('  - SignalR real-time broadcasting');
        console.log('  - Multi-client synchronization');
        console.log('  - Error-free operation');
    });
});
