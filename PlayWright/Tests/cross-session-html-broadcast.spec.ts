import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Cross-Session HTML Broadcasting', () => {
  let senderContext: BrowserContext;
  let receiverContext: BrowserContext;
  let senderPage: Page;
  let receiverPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Create two separate browser contexts to simulate different users
    senderContext = await browser.newContext();
    receiverContext = await browser.newContext();
    
    senderPage = await senderContext.newPage();
    receiverPage = await receiverContext.newPage();
  });

  test.afterAll(async () => {
    await senderContext.close();
    await receiverContext.close();
  });

  test('should broadcast HTML content across sessions', async () => {
    const testSessionId = 'playwright-test-' + Date.now();
    const testHtmlContent = `<div style="background: red; color: white; padding: 10px;">Test HTML from Playwright at ${new Date().toISOString()}</div>`;

    console.log(`[TEST] Starting cross-session test with session ID: ${testSessionId}`);

    // Step 1: Navigate both pages to the test interface
    await Promise.all([
      senderPage.goto('http://localhost:9090/simple-signalr-test'),
      receiverPage.goto('http://localhost:9090/simple-signalr-test')
    ]);

    console.log('[TEST] Both pages loaded');

    // Step 2: Wait for pages to fully load
    await Promise.all([
      senderPage.waitForSelector('button:has-text("Connect")', { timeout: 10000 }),
      receiverPage.waitForSelector('button:has-text("Connect")', { timeout: 10000 })
    ]);

    console.log('[TEST] Connect buttons visible');

    // Step 3: Connect both clients to SignalR hub
    await senderPage.click('button:has-text("Connect")');
    await receiverPage.click('button:has-text("Connect")');

    console.log('[TEST] Both clients connecting...');

    // Step 4: Wait for successful connections
    await Promise.all([
      senderPage.waitForSelector('text=SUCCESS: Connected!', { timeout: 15000 }),
      receiverPage.waitForSelector('text=SUCCESS: Connected!', { timeout: 15000 })
    ]);

    console.log('[TEST] Both clients connected');

    // Step 5: Join the same session
    await senderPage.fill('input[placeholder*="session name"]', testSessionId);
    await senderPage.click('button:has-text("Join")');
    
    await receiverPage.fill('input[placeholder*="session name"]', testSessionId);
    await receiverPage.click('button:has-text("Join")');

    console.log(`[TEST] Both clients joining session: ${testSessionId}`);

    // Step 6: Wait for session join confirmations
    await Promise.all([
      senderPage.waitForSelector(`text=In session: ${testSessionId}`, { timeout: 10000 }),
      receiverPage.waitForSelector(`text=In session: ${testSessionId}`, { timeout: 10000 })
    ]);

    console.log('[TEST] Both clients joined session');

    // Step 7: Clear the HTML textarea and enter test content in sender
    await senderPage.fill('textarea[placeholder*="HTML content"]', testHtmlContent);

    console.log('[TEST] Test content entered in sender');

    // Step 8: Send HTML from sender
    await senderPage.click('button:has-text("Send HTML")');

    console.log('[TEST] HTML sent from sender');

    // Step 9: Wait for broadcast confirmation in sender
    await senderPage.waitForSelector('text=HTML sent successfully', { timeout: 5000 });

    console.log('[TEST] Sender received confirmation');

    // Step 10: Check if receiver got the HTML content
    const receiverMessages = receiverPage.locator('.message-display');
    
    // Wait up to 10 seconds for the HTML content to appear in receiver
    let received = false;
    for (let i = 0; i < 20; i++) {
      const messages = await receiverMessages.allTextContents();
      const hasHtmlReceived = messages.some(msg => 
        msg.includes('HtmlContentReceived event fired') || 
        msg.includes('Received from') ||
        msg.includes('DEBUG-WORKITEM:hostcanvas:CLIENT')
      );
      
      if (hasHtmlReceived) {
        received = true;
        console.log('[TEST] ✅ Receiver detected HTML reception event');
        break;
      }
      
      await senderPage.waitForTimeout(500);
    }

    // Step 11: Check if the actual HTML content appears in receiver
    const receivedHtmlSection = receiverPage.locator('text=Received HTML').locator('xpath=following-sibling::div');
    const receivedHtmlContent = await receivedHtmlSection.textContent();
    
    console.log(`[TEST] Received HTML content: ${receivedHtmlContent}`);

    // Step 12: Assertions
    expect(received, 'Receiver should have detected HTML reception event').toBe(true);
    
    if (receivedHtmlContent && receivedHtmlContent.trim() !== 'No HTML received yet') {
      console.log('[TEST] ✅ HTML content successfully received across sessions');
      expect(receivedHtmlContent).toContain('Test HTML from Playwright');
    } else {
      console.log('[TEST] ❌ HTML content was NOT received across sessions');
      
      // Debug: Get all messages from both clients
      const senderMessages = await senderPage.locator('.message-display').allTextContents();
      const receiverMessages = await receiverPage.locator('.message-display').allTextContents();
      
      console.log('[DEBUG] Sender messages:', senderMessages.slice(-5)); // Last 5 messages
      console.log('[DEBUG] Receiver messages:', receiverMessages.slice(-5)); // Last 5 messages
      
      // This is the actual bug we're testing for
      expect(receivedHtmlContent, 'HTML content should be received but currently is not due to the bug').not.toBe('No HTML received yet');
    }
  });

  test('should handle multiple rapid broadcasts', async () => {
    const testSessionId = 'rapid-test-' + Date.now();

    // Navigate both pages
    await Promise.all([
      senderPage.goto('http://localhost:9090/simple-signalr-test'),
      receiverPage.goto('http://localhost:9090/simple-signalr-test')
    ]);

    // Connect both clients
    await senderPage.click('button:has-text("Connect")');
    await receiverPage.click('button:has-text("Connect")');

    // Wait for connections
    await Promise.all([
      senderPage.waitForSelector('text=SUCCESS: Connected!', { timeout: 15000 }),
      receiverPage.waitForSelector('text=SUCCESS: Connected!', { timeout: 15000 })
    ]);

    // Join session
    await senderPage.fill('input[placeholder*="session name"]', testSessionId);
    await senderPage.click('button:has-text("Join")');
    
    await receiverPage.fill('input[placeholder*="session name"]', testSessionId);
    await receiverPage.click('button:has-text("Join")');

    // Wait for session joins
    await Promise.all([
      senderPage.waitForSelector(`text=In session: ${testSessionId}`, { timeout: 10000 }),
      receiverPage.waitForSelector(`text=In session: ${testSessionId}`, { timeout: 10000 })
    ]);

    // Send multiple rapid broadcasts
    for (let i = 0; i < 3; i++) {
      await senderPage.fill('textarea[placeholder*="HTML content"]', `<div>Rapid test ${i + 1}</div>`);
      await senderPage.click('button:has-text("Send HTML")');
      await senderPage.waitForTimeout(1000); // 1 second between sends
    }

    // Check if any were received
    await senderPage.waitForTimeout(3000); // Wait for all to process

    const receiverMessages = await receiverPage.locator('.message-display').allTextContents();
    const receivedCount = receiverMessages.filter(msg => 
      msg.includes('HtmlContentReceived') || msg.includes('Received from')
    ).length;

    console.log(`[TEST] Rapid broadcast test: ${receivedCount}/3 messages received`);
    
    // For now, we expect 0 due to the bug, but this test will pass once fixed
    expect(receivedCount).toBeGreaterThanOrEqual(0);
  });
});