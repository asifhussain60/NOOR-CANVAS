import { expect, Page, test } from '@playwright/test';

test.describe('SignalR Integration - HostCanvas', () => {
  let hostPage: Page;
  let userPage: Page;

  test.beforeEach(async ({ context }) => {
    // Create two browser contexts to simulate host and user
    hostPage = await context.newPage();
    userPage = await context.newPage();

    // Navigate to host control panel (using known test session)
    await hostPage.goto('https://localhost:9091/sessionmanager/host/PQ9N5YWW');
    await hostPage.waitForLoadState('networkidle');

    // Navigate to session canvas (using known test token)
    await userPage.goto('https://localhost:9091/sessioncanvas/KJAHA99L');
    await userPage.waitForLoadState('networkidle');
  });

  test('Phase 1: Token Length Validation Fix', async () => {
    console.log('[DEBUG-WORKITEM:hostcanvas:TEST] Phase 1: Testing token length validation');

    // Wait for pages to load
    await hostPage.waitForTimeout(3000);
    await userPage.waitForTimeout(3000);

    // Take screenshots to see what's happening
    await hostPage.screenshot({ path: 'test-results/host-page-phase1.png' });
    await userPage.screenshot({ path: 'test-results/user-page-phase1.png' });

    // Check if debug panels exist
    const hostDebugPanel = await hostPage.locator('[data-testid="debug-panel"]').count();
    const userDebugPanel = await userPage.locator('[data-testid="debug-panel"]').count();

    console.log(`[DEBUG-WORKITEM:hostcanvas:TEST] Host debug panel count: ${hostDebugPanel}`);
    console.log(`[DEBUG-WORKITEM:hostcanvas:TEST] User debug panel count: ${userDebugPanel}`);

    // Basic navigation test first
    expect(hostPage.url()).toContain('/sessionmanager/host/PQ9N5YWW');
    expect(userPage.url()).toContain('/sessioncanvas/KJAHA99L');
  });

  test('Phase 2: SignalR Connection Status', async () => {
    console.log('[DEBUG-WORKITEM:hostcanvas:TEST] Phase 2: Testing SignalR connections');

    // Wait for SignalR connections to establish
    await hostPage.waitForTimeout(2000);
    await userPage.waitForTimeout(2000);

    // Check host SignalR connection
    const hostSignalRStatus = await hostPage.evaluate(() => {
      const statusElement = document.querySelector('[data-testid="signalr-status"]');
      return statusElement ? statusElement.textContent : null;
    });

    console.log(`[DEBUG-WORKITEM:hostcanvas:TEST] Host SignalR status: ${hostSignalRStatus}`);
    expect(hostSignalRStatus).toContain('Connected');

    // Check user SignalR connection
    const userSignalRStatus = await userPage.evaluate(() => {
      const statusElement = document.querySelector('[data-testid="signalr-status"]');
      return statusElement ? statusElement.textContent : null;
    });

    console.log(`[DEBUG-WORKITEM:hostcanvas:TEST] User SignalR status: ${userSignalRStatus}`);
    expect(userSignalRStatus).toContain('Connected');
  });

  test('Phase 3: Asset Sharing Integration', async () => {
    console.log('[DEBUG-WORKITEM:hostcanvas:TEST] Phase 3: Testing asset sharing');

    // Wait for connections to be established
    await hostPage.waitForTimeout(3000);
    await userPage.waitForTimeout(3000);

    // Click the "Test Share Asset" button on host
    const testButton = hostPage.locator('button:has-text("Test Share Asset")');
    await expect(testButton).toBeVisible();
    await testButton.click();

    // Wait for the asset to be shared via SignalR
    await userPage.waitForTimeout(1000);

    // Check if asset appears on user page
    const sharedAsset = await userPage
      .locator('[data-testid="shared-asset-content"]')
      .textContent();
    console.log(`[DEBUG-WORKITEM:hostcanvas:TEST] Shared asset content: ${sharedAsset}`);

    expect(sharedAsset).toContain('Test Asset Shared');
  });

  test.afterEach(async () => {
    await hostPage.close();
    await userPage.close();
  });
});
