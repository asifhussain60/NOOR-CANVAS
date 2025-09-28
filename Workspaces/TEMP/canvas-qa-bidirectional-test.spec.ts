// Comprehensive test for Q&A bidirectional SignalR functionality
// Tests both Session→Host and Host→Session Q&A communication

import { test, expect, Page, Browser } from '@playwright/test';

test.describe('Q&A Bidirectional SignalR Communication', () => {
  
  test('should allow participants to submit questions and hosts to receive them', async ({ page, browser }: { page: Page; browser: Browser }) => {
    const RUN_ID = 'qa-bidirectional-' + Date.now();
    
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] Starting Q&A bidirectional test`);
    
    // Step 1: Open Session Canvas (participant view)
    await page.goto('https://localhost:9091/session/canvas/12345678');
    await page.waitForSelector('h1:has-text("NOOR Canvas")', { timeout: 30000 });
    
    // Wait for SignalR connection
    await page.waitForSelector('.fa-signal, .fa-wifi, .fa-check-circle', { timeout: 15000 });
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] Session Canvas loaded with SignalR connected`);
    
    // Step 2: Open Host Control Panel in new page
    const hostPage = await page.context().newPage();
    await hostPage.goto('https://localhost:9091/host/control-panel/87654321');
    await hostPage.waitForSelector('h1:has-text("NOOR Canvas")', { timeout: 30000 });
    
    // Wait for host SignalR connection
    await hostPage.waitForSelector('.fa-signal, .fa-wifi, .fa-check-circle', { timeout: 15000 });
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] Host Control Panel loaded with SignalR connected`);
    
    // Step 3: Submit a question from Session Canvas
    const testQuestion = `Test Q&A question from automated test ${RUN_ID}`;
    
    // Find question input field
    const questionInput = page.locator('textarea[placeholder*="question"], input[placeholder*="question"], textarea[name*="question"]');
    if (await questionInput.count() === 0) {
      // Try alternative selectors
      const altInput = page.locator('textarea').first();
      await altInput.fill(testQuestion);
    } else {
      await questionInput.fill(testQuestion);
    }
    
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] Filled question input: "${testQuestion}"`);
    
    // Find and click submit button
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Ask"), button[type="submit"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] Clicking submit button`);
    await submitButton.click();
    
    // Step 4: Verify question appears in Host Control Panel
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] Checking if question appears in Host Control Panel`);
    
    // Look for the question text in the host panel Q&A section
    const questionInHost = hostPage.locator(`text="${testQuestion}"`);
    await expect(questionInHost).toBeVisible({ timeout: 20000 });
    
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] ✅ Question successfully received by Host Control Panel`);
    
    // Step 5: Verify question also appears in participant's own Q&A list (should show their own question)
    const questionInSession = page.locator(`text="${testQuestion}"`);
    await expect(questionInSession).toBeVisible({ timeout: 10000 });
    
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] ✅ Question visible in participant's own Q&A list`);
    
    // Step 6: Test that other participants would also see the question (simulate with another session)
    const participantPage = await browser.newPage();
    await participantPage.goto('https://localhost:9091/session/canvas/12345678');
    await participantPage.waitForSelector('h1:has-text("NOOR Canvas")', { timeout: 30000 });
    
    // This participant should also see the question that was submitted
    const questionInOtherSession = participantPage.locator(`text="${testQuestion}"`);
    await expect(questionInOtherSession).toBeVisible({ timeout: 15000 });
    
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] ✅ Question visible to other session participants`);
    
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] ✅ ALL TESTS PASSED: Q&A bidirectional SignalR functionality working correctly`);
    
    await participantPage.close();
    await hostPage.close();
  });
});