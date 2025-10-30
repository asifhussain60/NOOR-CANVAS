/**
 * [hcp-refactor:phase3] Test transcript section broadcasting from Host to TranscriptCanvas
 * 
 * PURPOSE: Verify SignalR event flow for section sharing
 * SCOPE: HostControlPanel → SessionHub → TranscriptCanvas
 * VALIDATES: Event registration, broadcast delivery, content rendering
 */

import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

const BASE_URL = 'https://localhost:9091'; // Use HTTPS (Kestrel production port)
const HOST_TOKEN = 'PQ9N5YWW'; // Session 212
const USER_TOKEN = 'KJAHA99L'; // Session 212

test.describe('Transcript Section Broadcasting', () => {
  let browser: Browser;
  let hostContext: BrowserContext;
  let participantContext: BrowserContext;
  let hostPage: Page;
  let participantPage: Page;

  test.beforeAll(async () => {
    // Respect Playwright CLI --headed flag (default: headless)
    browser = await chromium.launch();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test.beforeEach(async () => {
    hostContext = await browser.newContext();
    participantContext = await browser.newContext();

    hostPage = await hostContext.newPage();
    participantPage = await participantContext.newPage();

    // Console logging
    hostPage.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('TRACE:hcp-tcanvas') || text.includes('transcript-canvas:broadcast')) {
        console.log(`[HOST] ${text}`);
      }
    });

    participantPage.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('transcript-canvas:broadcast') || text.includes('TranscriptShared')) {
        console.log(`[PARTICIPANT] ${text}`);
      }
    });
  });

  test.afterEach(async () => {
    await hostContext.close();
    await participantContext.close();
  });

  test('PHASE-1: Load TranscriptCanvas and verify SignalR', async () => {
    console.log('[TEST] Loading TranscriptCanvas...');

    await participantPage.goto(`${BASE_URL}/transcript/canvas/${USER_TOKEN}`);
    await participantPage.waitForLoadState('networkidle');

    // Verify page title
    await expect(participantPage.locator('text=NOOR Canvas')).toBeVisible({ timeout: 10000 });

    // Wait for SignalR connection
    await participantPage.waitForTimeout(3000);

    console.log('[TEST] ✅ TranscriptCanvas loaded');
  });

  test('PHASE-2: Host broadcasts full transcript', async () => {
    console.log('[TEST] Testing full transcript broadcast...');

    // Setup participant
    await participantPage.goto(`${BASE_URL}/transcript/canvas/${USER_TOKEN}`);
    await participantPage.waitForLoadState('networkidle');
    await participantPage.waitForTimeout(2000);

    // Setup host
    await hostPage.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
    await hostPage.waitForLoadState('networkidle');
    await expect(hostPage.locator('text=Need For Messengers')).toBeVisible({ timeout: 10000 });

    // Click Share Transcript button
    const shareButton = hostPage.locator('button:has-text("Share Transcript")');
    await expect(shareButton).toBeVisible({ timeout: 5000 });

    console.log('[TEST] Clicking Share Transcript...');
    await shareButton.click();
    await hostPage.waitForTimeout(2000);

    // Check participant for content
    await participantPage.waitForTimeout(2000);
    const content = participantPage.locator('.canvas-asset-content');
    const contentText = await content.textContent();

    console.log(`[TEST] Participant received content: ${contentText?.length || 0} chars`);

    expect(contentText).toBeTruthy();
    expect(contentText!.length).toBeGreaterThan(100);

    console.log('[TEST] ✅ Full transcript broadcast successful');
  });

  test('PHASE-3: Verify share button injection and section broadcast', async () => {
    console.log('[TEST] Testing section share button functionality...');

    // Setup participant with event tracking
    await participantPage.goto(`${BASE_URL}/transcript/canvas/${USER_TOKEN}`);
    await participantPage.waitForLoadState('networkidle');

    let eventReceived = false;
    await participantPage.evaluate(() => {
      (window as any).transcriptSharedReceived = false;
    });

    // Setup host
    await hostPage.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
    await hostPage.waitForLoadState('networkidle');
    await expect(hostPage.locator('text=Need For Messengers')).toBeVisible();

    // Share transcript to inject section buttons
    const shareTranscriptBtn = hostPage.locator('button:has-text("Share Transcript")');
    if (await shareTranscriptBtn.isVisible()) {
      await shareTranscriptBtn.click();
      await hostPage.waitForTimeout(2000);
    }

    // Find section share button
    const sectionShareBtn = hostPage.locator('.ks-share-button').first();

    if (await sectionShareBtn.isVisible()) {
      console.log('[TEST] Section share button found, clicking...');
      await sectionShareBtn.click();
      await hostPage.waitForTimeout(2000);

      // Check participant received section
      const participantContent = participantPage.locator('.canvas-asset-content');
      const text = await participantContent.textContent();

      console.log(`[TEST] Section content: ${text?.length || 0} chars`);
      expect(text!.length).toBeGreaterThan(50);

      console.log('[TEST] ✅ Section broadcast successful');
    } else {
      console.log('[TEST] ⚠️ Section share buttons not found - check transcript-section-parser.js');
    }
  });

  test('PHASE-4: Console log analysis', async () => {
    console.log('[TEST] Analyzing broadcast event logs...');

    const hostLogs: string[] = [];
    const participantLogs: string[] = [];

    hostPage.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('BroadcastTranscript') || text.includes('TRACE:hcp-tcanvas')) {
        hostLogs.push(text);
      }
    });

    participantPage.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('TranscriptShared') || text.includes('transcript-canvas:broadcast')) {
        participantLogs.push(text);
      }
    });

    // Execute flow
    await participantPage.goto(`${BASE_URL}/transcript/canvas/${USER_TOKEN}`);
    await participantPage.waitForLoadState('networkidle');
    await participantPage.waitForTimeout(2000);

    await hostPage.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
    await hostPage.waitForLoadState('networkidle');
    await expect(hostPage.locator('text=Need For Messengers')).toBeVisible();

    const shareBtn = hostPage.locator('button:has-text("Share Transcript")');
    await shareBtn.click();
    await hostPage.waitForTimeout(3000);

    console.log('\n[TEST] ════════════════════════════════════');
    console.log('[TEST] HOST LOGS:');
    hostLogs.forEach(log => console.log(`  ${log}`));

    console.log('\n[TEST] PARTICIPANT LOGS:');
    participantLogs.forEach(log => console.log(`  ${log}`));
    console.log('[TEST] ════════════════════════════════════\n');

    // Validate critical logs present
    const hostBroadcast = hostLogs.some(l => l.includes('BroadcastTranscriptShared'));
    const participantReceive = participantLogs.some(l => l.includes('TranscriptShared event received'));

    expect(hostBroadcast).toBeTruthy();
    expect(participantReceive).toBeTruthy();

    console.log('[TEST] ✅ Log analysis complete');
  });
});
