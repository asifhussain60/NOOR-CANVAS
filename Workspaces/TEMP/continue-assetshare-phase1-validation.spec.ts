import { test, expect, Page, Browser } from '@playwright/test';

test.describe('Phase 1: Property Mismatch Fix Validation', () => {
  let hostPage: Page;
  let canvasPage: Page;
  let browser: Browser;

  test.beforeAll(async ({ browser: b }) => {
    browser = b;
  });

  test.beforeEach(async () => {
    // Create two browser contexts for host and canvas
    const hostContext = await browser.newContext();
    const canvasContext = await browser.newContext();
    
    hostPage = await hostContext.newPage();
    canvasPage = await canvasContext.newPage();

    // Navigate to pages
    await hostPage.goto('http://localhost:9091/host-control-panel');
    await canvasPage.goto('http://localhost:9091/session-canvas');
    
    // Wait for pages to load
    await hostPage.waitForLoadState('networkidle');
    await canvasPage.waitForLoadState('networkidle');
  });

  test('Phase 1.1: Verify rawHtmlContent property transmission', async () => {
    // Step 1: Join same session on both pages
    const sessionId = '12345';
    
    // Host starts session
    await hostPage.fill('[data-testid="session-id-input"]', sessionId);
    await hostPage.click('[data-testid="start-session-btn"]');
    await expect(hostPage.locator('[data-testid="session-status"]')).toContainText('Active');

    // Canvas joins session
    await canvasPage.fill('[data-testid="session-id-input"]', sessionId);
    await canvasPage.click('[data-testid="join-session-btn"]');
    await expect(canvasPage.locator('[data-testid="connection-status"]')).toContainText('Connected');

    // Step 2: Share an asset from host
    await hostPage.click('[data-testid="share-ayah-1-1"]'); // First ayah share button
    
    // Step 3: Verify content appears in canvas within 5 seconds
    await expect(canvasPage.locator('[data-testid="shared-content-area"]')).not.toBeEmpty({ timeout: 5000 });
    
    // Step 4: Check for Phase 1 success markers in console
    const hostLogs = await hostPage.evaluate(() => {
      return (window as any).testLogs || [];
    });
    
    const canvasLogs = await canvasPage.evaluate(() => {
      return (window as any).testLogs || [];
    });

    // Verify Phase 1 logging markers
    expect(hostLogs.some((log: string) => 
      log.includes('PHASE1 STEP 3/7: Asset data object created with rawHtmlContent property')
    )).toBe(true);

    expect(canvasLogs.some((log: string) => 
      log.includes('PHASE1 SUCCESS: rawHtmlContent property found')
    )).toBe(true);
  });

  test('Phase 1.2: Verify backward compatibility with testContent', async () => {
    // Test the TestShareAsset functionality still works
    const sessionId = '12346';
    
    await hostPage.fill('[data-testid="session-id-input"]', sessionId);
    await hostPage.click('[data-testid="start-session-btn"]');
    
    await canvasPage.fill('[data-testid="session-id-input"]', sessionId);
    await canvasPage.click('[data-testid="join-session-btn"]');

    // Click test share asset button (uses testContent property)
    await hostPage.click('[data-testid="test-share-asset-btn"]');
    
    // Verify content appears using fallback testContent property
    await expect(canvasPage.locator('[data-testid="shared-content-area"]')).not.toBeEmpty({ timeout: 5000 });
    
    const canvasLogs = await canvasPage.evaluate(() => {
      return (window as any).testLogs || [];
    });

    expect(canvasLogs.some((log: string) => 
      log.includes('PHASE1 FALLBACK: testContent property found (backward compatibility)')
    )).toBe(true);
  });

  test('Phase 1.3: Verify no appendChild errors in browser console', async () => {
    const sessionId = '12347';
    const consoleErrors: string[] = [];
    
    // Capture console errors
    canvasPage.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await hostPage.fill('[data-testid="session-id-input"]', sessionId);
    await hostPage.click('[data-testid="start-session-btn"]');
    
    await canvasPage.fill('[data-testid="session-id-input"]', sessionId);
    await canvasPage.click('[data-testid="join-session-btn"]');

    // Share multiple assets to test for appendChild errors
    for (let i = 1; i <= 3; i++) {
      await hostPage.click(`[data-testid="share-ayah-1-${i}"]`);
      await canvasPage.waitForTimeout(2000); // Allow time for rendering
    }

    // Check no appendChild errors occurred
    const appendChildErrors = consoleErrors.filter(error => 
      error.includes('appendChild') || error.includes('Unexpected end of input')
    );
    
    expect(appendChildErrors).toHaveLength(0);
  });

  test.afterEach(async () => {
    await hostPage?.close();
    await canvasPage?.close();
  });
});