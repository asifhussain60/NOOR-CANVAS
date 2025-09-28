// Baseline test for working Host→Session SignalR functionality
// This establishes the working direction before implementing bidirectional Q&A

const { test, expect } = require('@playwright/test');

test.describe('Baseline SignalR Host→Session Communication', () => {
  test('should verify Host can broadcast content to Session participants', async ({ page }) => {
    const RUN_ID = 'baseline-host-to-session-' + Date.now();
    
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] Starting baseline Host→Session SignalR test`);
    
    // Navigate to the session canvas with a test token
    await page.goto('https://localhost:9091/session/canvas/12345678');
    
    // Wait for the session to load
    await page.waitForSelector('h1:has-text("NOOR Canvas")', { timeout: 30000 });
    
    // Verify SignalR connection status
    const signalRStatus = await page.locator('.fa-signal, .fa-wifi, .fa-check-circle').first();
    await expect(signalRStatus).toBeVisible({ timeout: 15000 });
    
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] Session Canvas loaded with SignalR status visible`);
    
    // Open Host Control Panel in a new tab
    const hostPage = await page.context().newPage();
    await hostPage.goto('https://localhost:9091/host/control-panel/87654321');
    
    // Wait for host panel to load
    await hostPage.waitForSelector('h1:has-text("NOOR Canvas")', { timeout: 30000 });
    
    // Find and click the "Test Asset Share" button to trigger SignalR broadcast
    const testButton = hostPage.locator('button:has-text("Test Asset Share")');
    await expect(testButton).toBeVisible({ timeout: 10000 });
    
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] Clicking Test Asset Share button to test Host→Session SignalR`);
    
    // Click the test button to broadcast content
    await testButton.click();
    
    // Wait for success message on host side
    await hostPage.waitForSelector('text=Test asset shared successfully', { timeout: 15000 });
    
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] Host broadcast successful, checking Session Canvas reception`);
    
    // Verify content was received on session canvas
    // Look for the test content that should appear via SignalR
    await page.waitForSelector('text=Test Asset Shared', { timeout: 20000 });
    
    const testContent = page.locator('text=SignalR connection working!');
    await expect(testContent).toBeVisible({ timeout: 5000 });
    
    console.log(`[DEBUG-WORKITEM:canvas-qa:test:${RUN_ID}] ✅ Baseline test PASSED: Host→Session SignalR communication working`);
    
    await hostPage.close();
  });
});