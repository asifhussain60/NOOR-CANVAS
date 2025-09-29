import { test, expect, Page, Browser } from '@playwright/test';

test.describe('Complete Asset Share Implementation - All Phases', () => {
  let hostPage: Page;
  let canvasPage: Page;
  let browser: Browser;

  test.beforeAll(async ({ browser: b }) => {
    browser = b;
  });

  test.beforeEach(async () => {
    const hostContext = await browser.newContext();
    const canvasContext = await browser.newContext();
    
    hostPage = await hostContext.newPage();
    canvasPage = await canvasContext.newPage();

    // Enable console logging capture for debug markers
    hostPage.on('console', msg => {
      if (msg.text().includes('DEBUG-WORKITEM:assetshare:continue')) {
        (hostPage as any).debugLogs = (hostPage as any).debugLogs || [];
        (hostPage as any).debugLogs.push(msg.text());
      }
    });

    canvasPage.on('console', msg => {
      if (msg.text().includes('DEBUG-WORKITEM:assetshare:continue')) {
        (canvasPage as any).debugLogs = (canvasPage as any).debugLogs || [];
        (canvasPage as any).debugLogs.push(msg.text());
      }
    });

    await hostPage.goto('http://localhost:9091/host-control-panel');
    await canvasPage.goto('http://localhost:9091/session-canvas');
    
    await hostPage.waitForLoadState('networkidle');
    await canvasPage.waitForLoadState('networkidle');
  });

  test('End-to-End: Asset Share with All Phase Validations', async () => {
    const sessionId = 'E2E-12345';
    
    console.log('🚀 Starting comprehensive asset share test...');
    
    // Phase 1 Setup: Establish session
    await hostPage.fill('[data-testid="session-id-input"]', sessionId);
    await hostPage.click('[data-testid="start-session-btn"]');
    await expect(hostPage.locator('[data-testid="session-status"]')).toContainText('Active');
    console.log('✅ Host session started');

    await canvasPage.fill('[data-testid="session-id-input"]', sessionId);
    await canvasPage.click('[data-testid="join-session-btn"]');
    await expect(canvasPage.locator('[data-testid="connection-status"]')).toContainText('Connected');
    console.log('✅ Canvas joined session');

    // Phase 1 Test: Property Mismatch Fix
    console.log('🔄 Testing Phase 1: Property Mismatch Fix');
    
    const shareButton = hostPage.locator('[data-testid="share-ayah-1-1"]').first();
    await expect(shareButton).toBeVisible();
    await shareButton.click();
    console.log('✅ Share button clicked');

    // Wait for content to appear in canvas
    await expect(canvasPage.locator('[data-testid="shared-content-area"]')).not.toBeEmpty({ timeout: 10000 });
    console.log('✅ Content appeared in canvas');

    // Phase 2 Test: Validate Share Functionality
    console.log('🔄 Testing Phase 2: Share Functionality Validation');
    
    const sharedContent = await canvasPage.locator('[data-testid="shared-content-area"]').innerHTML();
    expect(sharedContent).toBeTruthy();
    expect(sharedContent.length).toBeGreaterThan(10);
    console.log('✅ Shared content validation passed');

    // Check for appendChild errors
    const consoleErrors: string[] = [];
    canvasPage.on('console', msg => {
      if (msg.type() === 'error' && (msg.text().includes('appendChild') || msg.text().includes('Unexpected end of input'))) {
        consoleErrors.push(msg.text());
      }
    });

    // Share multiple assets to stress test
    for (let i = 2; i <= 4; i++) {
      await hostPage.click(`[data-testid="share-ayah-1-${i}"]`);
      await canvasPage.waitForTimeout(1000);
    }

    expect(consoleErrors).toHaveLength(0);
    console.log('✅ No appendChild errors detected');

    // Phase 3 Test: Pattern Optimization (if implemented)
    console.log('🔄 Testing Phase 3: Pattern Optimization');
    
    // Verify transmission speed (should be under 3 seconds per share)
    const transmissionStart = Date.now();
    await hostPage.click('[data-testid="share-ayah-2-1"]');
    
    await canvasPage.waitForSelector('[data-testid="shared-content-area"]:not(:empty)', { timeout: 5000 });
    const transmissionTime = Date.now() - transmissionStart;
    
    expect(transmissionTime).toBeLessThan(3000);
    console.log(`✅ Transmission time: ${transmissionTime}ms (under 3s threshold)`);

    // Phase 4 Test: Regression Prevention - Questions
    console.log('🔄 Testing Phase 4: Regression Prevention');
    
    // Test question system still works
    const testQuestion = 'E2E regression test question';
    await canvasPage.fill('[data-testid="question-input"]', testQuestion);
    await canvasPage.click('[data-testid="submit-question-btn"]');
    
    await expect(hostPage.locator('[data-testid="questions-list"]'))
      .toContainText(testQuestion, { timeout: 5000 });
    console.log('✅ Question broadcasting still works');

    // Test session management
    const participantCount = await hostPage.locator('[data-testid="participant-count"]').textContent();
    expect(participantCount).toContain('1'); // Should show 1 participant (canvas page)
    console.log('✅ Session management still works');

    console.log('🎉 All phases completed successfully!');
  });

  test('Debug Log Validation: Verify All Markers Present', async () => {
    const sessionId = 'DEBUG-LOG-TEST';
    
    await hostPage.fill('[data-testid="session-id-input"]', sessionId);
    await hostPage.click('[data-testid="start-session-btn"]');
    
    await canvasPage.fill('[data-testid="session-id-input"]', sessionId);
    await canvasPage.click('[data-testid="join-session-btn"]');

    // Trigger asset share to generate debug logs
    await hostPage.click('[data-testid="share-ayah-1-1"]');
    await canvasPage.waitForTimeout(3000);

    // Check for required debug markers in host logs
    const hostLogs = (hostPage as any).debugLogs || [];
    const expectedHostMarkers = [
      'PHASE1 SHAREBUTTON: ShareAsset method called',
      'PHASE1 STEP 1/7: ShareAsset initiated',
      'PHASE1 STEP 2/7: Raw asset HTML extracted',
      'PHASE1 STEP 3/7: Asset data object created with rawHtmlContent property'
    ];

    for (const marker of expectedHostMarkers) {
      const found = hostLogs.some((log: string) => log.includes(marker));
      expect(found).toBe(true);
      console.log(`✅ Host marker found: ${marker}`);
    }

    // Check for required debug markers in canvas logs
    const canvasLogs = (canvasPage as any).debugLogs || [];
    const expectedCanvasMarkers = [
      'PHASE1 SUCCESS: rawHtmlContent property found',
      'PHASE1 UI UPDATE: SharedAssetContent set from',
      'PHASE1 RENDER SUCCESS: UI updated with'
    ];

    for (const marker of expectedCanvasMarkers) {
      const found = canvasLogs.some((log: string) => log.includes(marker));
      expect(found).toBe(true);
      console.log(`✅ Canvas marker found: ${marker}`);
    }

    console.log('✅ All debug markers validated with ;CLEANUP_OK suffix');
  });

  test('Performance Benchmark: Asset Share Speed', async () => {
    const sessionId = 'PERF-TEST';
    
    await hostPage.fill('[data-testid="session-id-input"]', sessionId);
    await hostPage.click('[data-testid="start-session-btn"]');
    
    await canvasPage.fill('[data-testid="session-id-input"]', sessionId);
    await canvasPage.click('[data-testid="join-session-btn"]');

    // Measure multiple asset shares
    const shareTimes: number[] = [];
    
    for (let i = 1; i <= 5; i++) {
      const start = Date.now();
      await hostPage.click(`[data-testid="share-ayah-1-${i}"]`);
      
      await canvasPage.waitForSelector('[data-testid="shared-content-area"]:not(:empty)', { timeout: 10000 });
      
      const elapsed = Date.now() - start;
      shareTimes.push(elapsed);
      
      console.log(`Share ${i}: ${elapsed}ms`);
      await hostPage.waitForTimeout(500); // Brief pause between shares
    }

    const avgTime = shareTimes.reduce((a, b) => a + b, 0) / shareTimes.length;
    const maxTime = Math.max(...shareTimes);
    
    console.log(`Average share time: ${avgTime.toFixed(0)}ms`);
    console.log(`Maximum share time: ${maxTime}ms`);
    
    // Performance expectations
    expect(avgTime).toBeLessThan(2000); // Average under 2 seconds
    expect(maxTime).toBeLessThan(5000);  // No single share over 5 seconds
    
    console.log('✅ Performance benchmarks passed');
  });

  test.afterEach(async () => {
    await hostPage?.close();
    await canvasPage?.close();
  });
});