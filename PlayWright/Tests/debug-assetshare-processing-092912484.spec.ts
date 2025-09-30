import { expect, test } from '@playwright/test';

test.describe('Debug Asset Share Button Processing', () => {
  test('Debug why share buttons are not being injected for session 212', async ({ page }) => {
    const hostToken = 'PQ9N5YWW';
    const trackingId = `debug-${Date.now()}`;

    console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Starting debug test with trackingId: ${trackingId}`);

    // Navigate to Host Control Panel for session 212
    await page.goto(`https://localhost:9091/host/control-panel/${hostToken}`);
    await page.waitForLoadState('networkidle');

    console.log('[DEBUG-WORKITEM:assetshare:continue:debug] Host Control Panel loaded');

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Check what's in the different transcript areas
    const transcriptSelectors = [
      '.ks-transcript',
      '.transcript-content.blazor-safe-html',
      '.html-viewer-content.session-transcript-content',
      '[data-testid="transformed-transcript"]'
    ];

    for (const selector of transcriptSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        const content = await element.innerHTML();
        const textContent = await element.textContent();

        console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] === ${selector} ===`);
        console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Content length: ${content.length}`);
        console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Text length: ${textContent?.length || 0}`);
        console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Has ayah-card: ${content.includes('ayah-card')}`);
        console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Has inlineArabic: ${content.includes('inlineArabic')}`);
        console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Has share buttons: ${content.includes('ks-share-button')}`);
        console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Has data-share-id: ${content.includes('data-share-id')}`);

        // Look for specific patterns that should trigger asset detection
        const patterns = [
          'ayah-card',
          'inlineArabic',
          'class="ayah-card"',
          'ks-share-button',
          'data-share-id',
          'AssetHtmlProcessingService',
          'SHARE',
          'asset'
        ];

        const foundPatterns = patterns.filter(pattern => content.includes(pattern));
        console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Found patterns: ${foundPatterns.join(', ')}`);

        // Show a snippet of the content
        if (content.length > 0) {
          console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Content preview: ${content.substring(0, 300)}...`);

          if (content.includes('ayah-card')) {
            // Try to extract the ayah-card sections
            const ayahMatches = content.match(/<[^>]*ayah-card[^>]*>.*?<\/[^>]*>/g);
            if (ayahMatches) {
              console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Found ${ayahMatches.length} ayah-card elements`);
              ayahMatches.slice(0, 2).forEach((match, index) => {
                console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Ayah ${index + 1}: ${match.substring(0, 200)}...`);
              });
            }
          }
        }
        console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] === End ${selector} ===\n`);
      }
    }

    // Check if there's any JavaScript console output about asset processing
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('asset') || text.includes('share') || text.includes('AssetHtml') || text.includes('HtmlAgilityPack')) {
        console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] JS CONSOLE: ${text}`);
      }
    });

    // Try to trigger processing by looking for any process/transform buttons
    const processButtons = [
      page.locator('button:has-text("Process")'),
      page.locator('button:has-text("Transform")'),
      page.locator('button:has-text("Load")'),
      page.locator('button:has-text("Refresh")'),
      page.locator('[onclick*="process"]'),
      page.locator('[onclick*="transform"]')
    ];

    let processingTriggered = false;
    for (const button of processButtons) {
      if (await button.isVisible({ timeout: 1000 })) {
        const buttonText = await button.textContent();
        console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Found process button: "${buttonText}"`);
        await button.click();
        processingTriggered = true;
        console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Clicked process button, waiting for results...`);
        await page.waitForTimeout(3000);
        break;
      }
    }

    if (!processingTriggered) {
      console.log('[DEBUG-WORKITEM:assetshare:continue:debug] No processing buttons found');
    }

    // After any processing, check again for share buttons
    await page.waitForTimeout(2000);
    const shareButtonsAfter = await page.locator('.ks-share-button, .ks-share-btn, button[data-share-id]').count();
    console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Share buttons after processing: ${shareButtonsAfter}`);

    // Check the page source for any hidden/dynamic content
    const pageSource = await page.content();
    console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Full page source length: ${pageSource.length}`);
    console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Page has AssetHtmlProcessingService: ${pageSource.includes('AssetHtmlProcessingService')}`);
    console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Page has ayah-card: ${pageSource.includes('ayah-card')}`);
    console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Page has share buttons: ${pageSource.includes('ks-share-button')}`);

    console.log(`[DEBUG-WORKITEM:assetshare:continue:debug] Debug test completed with trackingId: ${trackingId}`);

    // Test should pass - we're just debugging
    expect(pageSource.length).toBeGreaterThan(1000);
  });
});