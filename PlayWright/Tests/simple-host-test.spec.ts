import { test } from '@playwright/test';

test.describe('Simple Host Test', () => {
  test('should load host page @hostcanvas', async ({ page }) => {
    // Set to ignore HTTPS certificate errors for localhost
    await page.context().route('**/*', (route) => route.continue());

    console.log('[PLAYWRIGHT] Starting simple host page test');

    // Navigate to host page
    await page.goto('https://localhost:9091/host', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for page to load
    await page.waitForTimeout(2000);

    console.log('[PLAYWRIGHT] Host page loaded, taking screenshot');

    // Take screenshot for debugging
    await page.screenshot({
      path: 'test-results/host-page-screenshot.png',
      fullPage: true,
    });

    // Check if Load Control Panel button is present
    const loadButton = page.locator('button', { hasText: 'Load Control Panel' });

    if (await loadButton.isVisible()) {
      console.log('[PLAYWRIGHT] Load Control Panel button found');

      // Click the button
      await loadButton.click();
      await page.waitForTimeout(3000);

      console.log('[PLAYWRIGHT] Control panel loaded, checking for transcript container');

      // Look for transcript container
      const transcriptContainer = page.locator('[data-testid="transcript-container"]');

      if (await transcriptContainer.isVisible()) {
        console.log('[PLAYWRIGHT] ✅ Transcript container is visible!');

        // Get the content
        const content = await transcriptContainer.textContent();
        console.log('[PLAYWRIGHT] Transcript content:', content?.substring(0, 200) + '...');

        // Check if it shows loading or actual content
        if (content && content.includes('Loading session transcript')) {
          console.log('[PLAYWRIGHT] ❌ Still showing loading message');
        } else if (content && content.trim().length > 0) {
          console.log('[PLAYWRIGHT] ✅ Transcript shows actual content');
        } else {
          console.log('[PLAYWRIGHT] ⚠️ Transcript container is empty');
        }
      } else {
        console.log('[PLAYWRIGHT] ❌ Transcript container not found');

        // List all visible elements for debugging
        const allElements = await page.locator('*').allTextContents();
        console.log('[PLAYWRIGHT] Page elements:', allElements.slice(0, 10));
      }
    } else {
      console.log('[PLAYWRIGHT] ❌ Load Control Panel button not found');

      // Log page content for debugging
      const pageContent = await page.textContent('body');
      console.log('[PLAYWRIGHT] Page content:', pageContent?.substring(0, 500) + '...');
    }

    console.log('[PLAYWRIGHT] Test completed');
  });
});
