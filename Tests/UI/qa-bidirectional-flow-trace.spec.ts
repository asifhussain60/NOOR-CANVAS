/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                       Q&A BIDIRECTIONAL FLOW TRACE TEST SUITE                            ║
 * ║                             Generated: September 28, 2025                                 ║
 * ║                                                                                           ║
 * ║ PURPOSE: Test complete bidirectional Q&A flow with trace-level logging evidence         ║
 * ║          1) Create session via HostProvisioner                                          ║
 * ║          2) Open HostControlPanel with host token                                       ║
 * ║          3) Start session (change status to "Active")                                   ║
 * ║          4) Open SessionCanvas with user token                                          ║
 * ║          5) Submit question from SessionCanvas                                          ║
 * ║          6) Verify question appears in HostControlPanel Q&A panel                      ║
 * ║          7) Capture and validate trace logs at each step                               ║
 * ║                                                                                           ║
 * ║ TRACE LOGGING: This test validates the complete flow with detailed logging:              ║
 * ║   - SessionCanvas: SubmitQuestion method trace logs                                     ║
 * ║   - QuestionController: Server-side processing trace logs                              ║
 * ║   - SignalR Broadcasting: Hub message transmission logs                                 ║
 * ║   - HostControlPanel: SignalR event reception and UI updates                          ║
 * ║                                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

interface SessionTokens {
  sessionId: number;
  hostToken: string;
  userToken: string;
}

// Helper function to create a session via HostProvisioner
async function createSessionViaHostProvisioner(page: Page): Promise<SessionTokens> {
  console.log('🎯 TRACE: Creating session via HostProvisioner...');
  
  await page.goto('/Tools/HostProvisioner');
  await page.waitForLoadState('networkidle');

  // Fill out the session creation form
  await page.fill('input[name="sessionName"]', 'Q&A Bidirectional Flow Test Session');
  await page.fill('input[name="hostName"]', 'GitHub Copilot Test Host');
  await page.fill('input[name="sessionDescription"]', 'Testing complete Q&A flow with trace logging');
  
  // Submit the form
  await page.click('button[type="submit"]:has-text("Create Session")');
  
  // Wait for success response and extract tokens
  await page.waitForSelector('.session-created-success', { timeout: 10000 });
  
  const sessionIdText = await page.textContent('[data-testid="session-id"]') || '0';
  const hostToken = await page.inputValue('[data-testid="host-token"]') || '';
  const userToken = await page.inputValue('[data-testid="user-token"]') || '';
  
  const sessionId = parseInt(sessionIdText.replace(/\D/g, ''), 10);
  
  console.log(`✅ TRACE: Session created - ID: ${sessionId}, HostToken: ${hostToken}, UserToken: ${userToken}`);
  return { sessionId, hostToken, userToken };
}

// Helper function to start session from HostControlPanel
async function startSessionFromHostPanel(page: Page, hostToken: string): Promise<void> {
  console.log('🎯 TRACE: Starting session from HostControlPanel...');
  
  await page.goto(`/host/control-panel/${hostToken}`);
  await page.waitForLoadState('networkidle');
  
  // Wait for the session data to load
  await page.waitForSelector('[data-testid="session-name"]', { timeout: 10000 });
  
  // Click the "Start Session" button
  await page.click('button:has-text("Start Session")');
  
  // Wait for session to be active
  await page.waitForSelector('text=Active', { timeout: 5000 });
  console.log('✅ TRACE: Session started and is now Active');
}

// Helper function to submit a question from SessionCanvas
async function submitQuestionFromSessionCanvas(page: Page, userToken: string, questionText: string): Promise<void> {
  console.log('🎯 TRACE: Submitting question from SessionCanvas...');
  
  await page.goto(`/session/canvas/${userToken}`);
  await page.waitForLoadState('networkidle');
  
  // Wait for SignalR connection to be established
  await page.waitForSelector('[data-testid="signalr-status"]:has-text("Connected")', { timeout: 10000 });
  console.log('✅ TRACE: SessionCanvas SignalR connection established');
  
  // Navigate to Q&A tab
  await page.click('[data-testid="qa-tab"]');
  
  // Fill in question text
  await page.fill('[data-testid="question-input"]', questionText);
  
  // Submit the question
  await page.click('[data-testid="submit-question-btn"]');
  
  // Wait for question to be submitted (input should clear)
  await page.waitForFunction(() => {
    const input = document.querySelector('[data-testid="question-input"]') as HTMLInputElement;
    return input && input.value === '';
  }, {}, { timeout: 5000 });
  
  console.log('✅ TRACE: Question submitted successfully from SessionCanvas');
}

// Helper function to verify question appears in HostControlPanel
async function verifyQuestionInHostPanel(page: Page, hostToken: string, expectedQuestionText: string): Promise<void> {
  console.log('🎯 TRACE: Verifying question appears in HostControlPanel...');
  
  await page.goto(`/host/control-panel/${hostToken}`);
  await page.waitForLoadState('networkidle');
  
  // Wait for SignalR connection to be established
  await page.waitForSelector('[data-testid="signalr-status"]:has-text("Connected")', { timeout: 10000 });
  console.log('✅ TRACE: HostControlPanel SignalR connection established');
  
  // Wait for the question to appear in the Q&A panel
  await page.waitForSelector(`text=${expectedQuestionText}`, { timeout: 10000 });
  console.log('✅ TRACE: Question successfully appeared in HostControlPanel Q&A panel');
  
  // Verify question details
  const questionElement = page.locator(`text=${expectedQuestionText}`).first();
  await expect(questionElement).toBeVisible();
  
  // Check that it's marked as unanswered (should have appropriate styling/icon)
  const questionContainer = questionElement.locator('xpath=ancestor::div[contains(@class, "question") or contains(@style, "question")]').first();
  await expect(questionContainer).toBeVisible();
  
  console.log('✅ TRACE: Question verification complete in HostControlPanel');
}

// Helper function to extract and validate trace logs
async function validateTraceLogs(page: Page): Promise<void> {
  console.log('🎯 TRACE: Extracting and validating trace logs...');
  
  // Access browser console logs to find our trace markers
  const logs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[DEBUG-WORKITEM:canvas-qa:trace:') && text.includes(';CLEANUP_OK')) {
      logs.push(text);
      console.log(`📋 TRACE LOG: ${text}`);
    }
  });
  
  // Wait a moment for any remaining logs to be captured
  await page.waitForTimeout(2000);
  
  console.log(`📊 TRACE: Captured ${logs.length} trace log entries`);
  
  // Validate that we have logs from all expected components
  const sessionCanvasLogs = logs.filter(log => log.includes('STEP') && (log.includes('Q&A SUBMISSION FLOW') || log.includes('SESSIONCANVAS')));
  const serverLogs = logs.filter(log => log.includes('SERVER STEP'));
  const hostPanelLogs = logs.filter(log => log.includes('HOST STEP'));
  
  console.log(`📈 TRACE BREAKDOWN: SessionCanvas: ${sessionCanvasLogs.length}, Server: ${serverLogs.length}, HostPanel: ${hostPanelLogs.length}`);
  
  // Verify we have complete flow coverage
  expect(sessionCanvasLogs.length).toBeGreaterThan(0);
  expect(serverLogs.length).toBeGreaterThan(0);  
  expect(hostPanelLogs.length).toBeGreaterThan(0);
  
  console.log('✅ TRACE: All components have trace logs - bidirectional flow validated');
}

test.describe('Q&A Bidirectional Flow with Trace Logging', () => {
  test('should complete full Q&A flow with comprehensive trace logging', async ({ browser }) => {
    console.log('🚀 STARTING: Q&A Bidirectional Flow Trace Test');
    
    // Create two browser contexts for host and participant
    const hostContext = await browser.newContext();
    const participantContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const participantPage = await participantContext.newPage();
    
    // Enable console logging for both pages
    hostPage.on('console', msg => console.log(`[HOST] ${msg.text()}`));
    participantPage.on('console', msg => console.log(`[PARTICIPANT] ${msg.text()}`));
    
    try {
      // Step 1: Create session via HostProvisioner
      console.log('\n📋 STEP 1: Creating session...');
      const tokens = await createSessionViaHostProvisioner(hostPage);
      
      // Step 2: Start session from HostControlPanel
      console.log('\n📋 STEP 2: Starting session...');
      await startSessionFromHostPanel(hostPage, tokens.hostToken);
      
      // Step 3: Submit question from SessionCanvas
      console.log('\n📋 STEP 3: Submitting question...');
      const testQuestion = `Test question for bidirectional flow - ${Date.now()}`;
      await submitQuestionFromSessionCanvas(participantPage, tokens.userToken, testQuestion);
      
      // Step 4: Verify question appears in HostControlPanel
      console.log('\n📋 STEP 4: Verifying question in host panel...');
      await verifyQuestionInHostPanel(hostPage, tokens.hostToken, testQuestion);
      
      // Step 5: Validate trace logs across all components
      console.log('\n📋 STEP 5: Validating trace logs...');
      await validateTraceLogs(hostPage);
      await validateTraceLogs(participantPage);
      
      console.log('\n🎉 SUCCESS: Q&A Bidirectional Flow Test Completed Successfully!');
      console.log('✅ All trace logs captured and validated');
      console.log('✅ Bidirectional SignalR broadcasting confirmed');
      console.log('✅ End-to-end Q&A flow operational');
      
    } finally {
      // Cleanup
      await hostPage.close();
      await participantPage.close();
      await hostContext.close();
      await participantContext.close();
    }
  });

  test('should validate SignalR connection timing in Q&A flow', async ({ browser }) => {
    console.log('🚀 STARTING: SignalR Connection Timing Validation');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Track SignalR connection timing
    const connectionEvents: Array<{ timestamp: number, event: string }> = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('SignalR') && (text.includes('Connected') || text.includes('connection'))) {
        connectionEvents.push({
          timestamp: Date.now(),
          event: text
        });
        console.log(`🔗 SignalR Event: ${text}`);
      }
    });
    
    try {
      // Create session and test connection timing
      const tokens = await createSessionViaHostProvisioner(page);
      
      await page.goto(`/session/canvas/${tokens.userToken}`);
      await page.waitForLoadState('networkidle');
      
      // Wait for SignalR connection
      await page.waitForSelector('[data-testid="signalr-status"]:has-text("Connected")', { timeout: 15000 });
      
      // Verify connection timing
      expect(connectionEvents.length).toBeGreaterThan(0);
      console.log(`✅ SignalR Connection Events Captured: ${connectionEvents.length}`);
      
      // Test that connection is stable for Q&A operations
      await page.waitForTimeout(2000);
      const signalRStatus = await page.textContent('[data-testid="signalr-status"]');
      expect(signalRStatus).toContain('Connected');
      
      console.log('✅ SignalR connection timing validation complete');
      
    } finally {
      await page.close();
      await context.close();
    }
  });
});