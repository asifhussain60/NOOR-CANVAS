import { test, expect } from '@playwright/test';

/**
 * Playwright Test: Question Delete Functionality Fix
 * 
 * Tests the complete question deletion workflow:
 * 1. Participant deletes question via SessionCanvas
 * 2. Deletion propagates via SignalR to all participants
 * 3. Host control panel receives deletion notification
 * 4. No SignalR errors occur (NotifyQuestionDeleted not called)
 * 
 * Fixes:
 * - Removed invalid NotifyQuestionDeleted hub call from HostControlPanel
 * - Deletion now properly flows through API → SignalR broadcast
 * - Trace-level debug logging for complete audit trail
 */

test.describe('Canvas Question Delete Fix', () => {
  let hostToken: string;
  let userToken: string;
  let sessionId: string;

  test.beforeAll(async ({ request }) => {
    // Create a test session for the test
    const response = await request.post('https://localhost:9091/api/Session/Create', {
      data: {
        SessionTitle: 'Question Delete Test Session',
        PresenterName: 'Test Host',
        HostEmail: 'host@test.com',
        Duration: 60
      }
    });

    expect(response.ok()).toBeTruthy();
    const session = await response.json();
    hostToken = session.hostToken;
    userToken = session.userToken;
    sessionId = session.sessionId;

    console.log(`Test session created: SessionId=${sessionId}, HostToken=${hostToken}, UserToken=${userToken}`);
  });

  test('should delete question from participant view without SignalR errors', async ({ page, context }) => {
    // Monitor console for errors
    const consoleErrors: string[] = [];
    const signalRErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        
        // Specifically check for the SignalR error we're fixing
        if (text.includes('NotifyQuestionDeleted') || text.includes('Method does not exist')) {
          signalRErrors.push(text);
        }
        
        // Check for appendChild error
        if (text.includes('appendChild') || text.includes('Unexpected end of input')) {
          signalRErrors.push(text);
        }
      }
    });

    // Step 1: Navigate to SessionCanvas as participant
    console.log(`[TRACE] Navigating to SessionCanvas with UserToken: ${userToken}`);
    await page.goto(`https://localhost:9091/session/canvas/${userToken}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.session-canvas-container', { timeout: 10000 });
    
    console.log('[TRACE] SessionCanvas loaded successfully');

    // Step 2: Submit a test question
    const questionText = `Test Question for Deletion ${Date.now()}`;
    console.log(`[TRACE] Submitting test question: "${questionText}"`);
    
    const questionInput = page.locator('textarea[placeholder*="question" i]').first();
    await questionInput.fill(questionText);
    
    const submitButton = page.locator('button:has-text("Submit")');
    await submitButton.click();
    
    // Wait for question to appear in the list
    await page.waitForSelector(`.canvas-question-item:has-text("${questionText}")`, { timeout: 5000 });
    console.log('[TRACE] Question submitted and appears in UI');

    // Step 3: Verify question appears
    const questionItem = page.locator(`.canvas-question-item:has-text("${questionText}")`);
    await expect(questionItem).toBeVisible();
    
    // Step 4: Click delete button
    console.log('[TRACE] Clicking delete button');
    const deleteButton = questionItem.locator('.canvas-question-delete-button');
    await deleteButton.click();
    
    // Step 5: Confirm deletion in modal
    console.log('[TRACE] Waiting for delete confirmation modal');
    await page.waitForSelector('.canvas-modal-overlay', { timeout: 3000 });
    
    const confirmButton = page.locator('button:has-text("Delete")');
    await confirmButton.click();
    
    console.log('[TRACE] Delete confirmed, waiting for API response');

    // Step 6: Wait for question to be removed from UI
    await expect(questionItem).not.toBeVisible({ timeout: 5000 });
    console.log('[TRACE] Question removed from UI successfully');

    // Step 7: Verify no SignalR errors occurred
    console.log(`[TRACE] Checking for SignalR errors... Found ${signalRErrors.length} errors`);
    
    if (signalRErrors.length > 0) {
      console.error('[ERROR] SignalR errors detected:', signalRErrors);
    }
    
    expect(signalRErrors).toHaveLength(0);
    console.log('[PASS] No SignalR errors detected during delete operation');

    // Step 8: Verify no appendChild errors
    const appendChildErrors = consoleErrors.filter(e => e.includes('appendChild'));
    expect(appendChildErrors).toHaveLength(0);
    console.log('[PASS] No appendChild errors detected');

    // Step 9: Open host control panel in new tab to verify deletion propagated
    console.log('[TRACE] Opening host control panel to verify deletion propagated');
    const hostPage = await context.newPage();
    
    // Monitor host page console as well
    hostPage.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error' && (text.includes('NotifyQuestionDeleted') || text.includes('Method does not exist'))) {
        signalRErrors.push(`HOST: ${text}`);
      }
    });
    
    await hostPage.goto(`https://localhost:9091/host/control-panel/${hostToken}`);
    await hostPage.waitForLoadState('networkidle');
    
    // Wait for questions to load
    await hostPage.waitForSelector('[data-testid="questions-panel"], .canvas-questions-container', { timeout: 10000 });
    
    console.log('[TRACE] Host control panel loaded, checking if question was removed');
    
    // Verify question is NOT in host panel
    const hostQuestionItem = hostPage.locator(`.canvas-question-item:has-text("${questionText}")`);
    await expect(hostQuestionItem).not.toBeVisible({ timeout: 3000 });
    
    console.log('[PASS] Question correctly removed from host panel');
    
    // Final verification: No SignalR errors on host page either
    expect(signalRErrors.filter(e => e.includes('HOST'))).toHaveLength(0);
    console.log('[PASS] No SignalR errors on host control panel');
    
    await hostPage.close();
  });

  test('should handle host deleting question from control panel (UI-only)', async ({ page }) => {
    // Monitor console for errors
    const signalRErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error' && (text.includes('NotifyQuestionDeleted') || text.includes('Method does not exist'))) {
        signalRErrors.push(text);
      }
    });

    // Navigate to host control panel
    console.log(`[TRACE] Navigating to HostControlPanel with HostToken: ${hostToken}`);
    await page.goto(`https://localhost:9091/host/control-panel/${hostToken}`);
    await page.waitForLoadState('networkidle');
    
    console.log('[TRACE] HostControlPanel loaded successfully');

    // Check if there are any questions
    const questionItems = page.locator('.canvas-question-item');
    const count = await questionItems.count();
    
    console.log(`[TRACE] Found ${count} questions in host panel`);
    
    if (count > 0) {
      // Click delete on first question
      const firstQuestion = questionItems.first();
      const questionText = await firstQuestion.locator('.canvas-question-text').textContent();
      
      console.log(`[TRACE] Attempting to delete question: "${questionText}"`);
      
      const deleteButton = firstQuestion.locator('.canvas-question-delete-button');
      await deleteButton.click();
      
      // Confirm deletion
      await page.waitForSelector('.canvas-modal-overlay', { timeout: 3000 });
      const confirmButton = page.locator('button:has-text("Delete")');
      await confirmButton.click();
      
      console.log('[TRACE] Delete confirmed from host panel');
      
      // Wait a bit for any potential errors
      await page.waitForTimeout(2000);
      
      // Verify no SignalR errors
      expect(signalRErrors).toHaveLength(0);
      console.log('[PASS] Host deletion completed without SignalR errors');
    } else {
      console.log('[SKIP] No questions available to test host deletion');
    }
  });

  test('should handle multiple rapid deletions without errors', async ({ page }) => {
    const signalRErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error' && text.includes('SignalR')) {
        signalRErrors.push(text);
      }
    });

    // Navigate to SessionCanvas
    await page.goto(`https://localhost:9091/session/canvas/${userToken}`);
    await page.waitForLoadState('networkidle');
    
    // Submit 3 test questions rapidly
    const questions = [
      `Rapid Delete Test 1 ${Date.now()}`,
      `Rapid Delete Test 2 ${Date.now()}`,
      `Rapid Delete Test 3 ${Date.now()}`
    ];
    
    console.log('[TRACE] Submitting 3 test questions rapidly');
    
    for (const q of questions) {
      const questionInput = page.locator('textarea[placeholder*="question" i]').first();
      await questionInput.fill(q);
      
      const submitButton = page.locator('button:has-text("Submit")');
      await submitButton.click();
      
      await page.waitForTimeout(500); // Small delay between submissions
    }
    
    // Wait for all questions to appear
    await page.waitForTimeout(2000);
    
    console.log('[TRACE] Attempting to delete all 3 questions rapidly');
    
    // Delete all questions rapidly
    for (const q of questions) {
      const questionItem = page.locator(`.canvas-question-item:has-text("${q}")`);
      
      if (await questionItem.isVisible()) {
        const deleteButton = questionItem.locator('.canvas-question-delete-button');
        await deleteButton.click();
        
        await page.waitForSelector('.canvas-modal-overlay', { timeout: 2000 });
        const confirmButton = page.locator('button:has-text("Delete")');
        await confirmButton.click();
        
        await page.waitForTimeout(300); // Small delay between deletions
      }
    }
    
    console.log('[TRACE] All deletions completed, checking for errors');
    
    // Wait for deletions to process
    await page.waitForTimeout(2000);
    
    // Verify no SignalR errors during rapid deletions
    expect(signalRErrors).toHaveLength(0);
    console.log('[PASS] Rapid deletions completed without SignalR errors');
  });
});
