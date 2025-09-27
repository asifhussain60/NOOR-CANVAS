/**
 * @hostcanvas Session Transcript Rendering Diagnostic Test
 *
 * Comprehensive test to diagnose why the Enhanced Processor isn't working
 * for large transcript content in the Host Control Panel.
 */

import { expect, test } from '@playwright/test';

// Extend Window type for Enhanced Processor function
declare global {
  interface Window {
    enhancedProcessorRender?: (content: string) => void;
  }
  var $transcript: unknown;
  var DotNetTranscript: unknown;
}

test.describe('Host Canvas - Session Transcript Rendering', () => {
  test('should diagnose transcript rendering issues @hostcanvas', async ({ page }) => {
    // Starting headless diagnostic test

    console.log('[PLAYWRIGHT] Starting transcript rendering diagnostic');

    // Navigate to host page
    await page.goto('https://localhost:9091/host');
    await expect(page).toHaveTitle(/NoorCanvas/);

    console.log('[PLAYWRIGHT] Host page loaded successfully');

    // Wait for and click "Load Control Panel" button
    const loadButton = page.locator('button', { hasText: 'Load Control Panel' });
    await expect(loadButton).toBeVisible({ timeout: 15000 });
    await loadButton.click();

    console.log('[PLAYWRIGHT] Load Control Panel button clicked');

    // Wait for control panel to load
    await expect(page.locator('text=Session Controls')).toBeVisible({ timeout: 10000 });

    console.log('[PLAYWRIGHT] Control Panel loaded, checking transcript section');

    // Check if Session Transcript section exists
    const transcriptSection = page.locator('text=Session Transcript');
    await expect(transcriptSection).toBeVisible({ timeout: 5000 });

    // Check for transcript container
    const transcriptContainer = page.locator('#transcript-content-container');
    await expect(transcriptContainer).toBeVisible({ timeout: 5000 });

    // Capture the current content of transcript container
    const transcriptContent = await transcriptContainer.textContent();
    console.log(`[PLAYWRIGHT] Transcript container content: "${transcriptContent}"`);

    // Check if Enhanced Processor JavaScript function exists
    const enhancedProcessorExists = await page.evaluate(() => {
      return typeof window.enhancedProcessorRender === 'function';
    });

    console.log(`[PLAYWRIGHT] Enhanced Processor function exists: ${enhancedProcessorExists}`);

    // Check if transcript loading div exists (should be replaced by Enhanced Processor)
    const loadingDiv = page.locator('#transcript-loading');
    const loadingExists = (await loadingDiv.count()) > 0;

    console.log(`[PLAYWRIGHT] Loading div exists: ${loadingExists}`);

    if (loadingExists) {
      const loadingText = await loadingDiv.textContent();
      console.log(`[PLAYWRIGHT] Loading div text: "${loadingText}"`);
    }

    // Check console for JavaScript errors
    const jsErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
        console.log(`[PLAYWRIGHT] JavaScript Error: ${msg.text()}`);
      }
    });

    // Try to manually trigger Enhanced Processor if function exists
    if (enhancedProcessorExists) {
      console.log('[PLAYWRIGHT] Attempting to manually call Enhanced Processor');

      const manualResult = await page.evaluate(() => {
        try {
          // Check if container exists
          const container = document.getElementById('transcript-content-container');
          if (!container) {
            return { success: false, error: 'Container not found' };
          }

          // Try calling the function with test content
          if (window.enhancedProcessorRender) {
            window.enhancedProcessorRender('<p>Test content from manual call</p>');
          } else {
            return { success: false, error: 'Enhanced processor function not found' };
          }
          return { success: true, containerContent: container.innerHTML };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      });

      console.log(`[PLAYWRIGHT] Manual Enhanced Processor result:`, manualResult);
    }

    // Check network requests for any failed API calls
    const failedRequests: string[] = [];
    page.on('response', (response) => {
      if (!response.ok()) {
        failedRequests.push(`${response.status()} ${response.url()}`);
        console.log(`[PLAYWRIGHT] Failed request: ${response.status()} ${response.url()}`);
      }
    });

    // Wait a bit more to see if Enhanced Processor eventually triggers
    await page.waitForTimeout(3000);

    // Final check of transcript container content
    const finalContent = await transcriptContainer.textContent();
    console.log(`[PLAYWRIGHT] Final transcript content: "${finalContent}"`);

    // Check if content changed from loading message
    const contentChanged = finalContent !== transcriptContent;
    console.log(`[PLAYWRIGHT] Content changed from initial: ${contentChanged}`);

    // Diagnostic assertions
    expect(enhancedProcessorExists).toBe(true); // Enhanced Processor function should exist
    expect(transcriptContainer).toBeVisible(); // Container should be visible

    // If we're still showing loading message, that's the problem
    if (finalContent?.includes('Loading transcript content via enhanced processor')) {
      console.log(
        '[PLAYWRIGHT] DIAGNOSIS: Enhanced Processor not executing - still showing loading message',
      );

      // Additional diagnostics
      const containerHTML = await transcriptContainer.innerHTML();
      console.log(`[PLAYWRIGHT] Full container HTML: ${containerHTML}`);

      // Check if RenderFragment is being called at all
      const hasRenderFragment = containerHTML.includes(
        'Loading transcript content via enhanced processor',
      );
      console.log(`[PLAYWRIGHT] Has loading message (RenderFragment called): ${hasRenderFragment}`);
    }

    // Report all errors found
    if (jsErrors.length > 0) {
      console.log(`[PLAYWRIGHT] JavaScript errors found: ${jsErrors.join(', ')}`);
    }

    if (failedRequests.length > 0) {
      console.log(`[PLAYWRIGHT] Failed requests found: ${failedRequests.join(', ')}`);
    }

    console.log('[PLAYWRIGHT] Diagnostic test completed');
  });

  test('should check Enhanced Processor JavaScript integration @hostcanvas', async ({ page }) => {
    // Navigate to host page and load control panel
    await page.goto('https://localhost:9091/host');

    const loadButton = page.locator('button', { hasText: 'Load Control Panel' });
    await expect(loadButton).toBeVisible();
    await loadButton.click();

    await expect(page.locator('text=Session Controls')).toBeVisible();

    // Check JavaScript environment
    const jsEnv = await page.evaluate(() => {
      return {
        hasWindow: typeof window !== 'undefined',
        hasDocument: typeof document !== 'undefined',
        hasJQuery: typeof $ !== 'undefined',
        hasBlazorRuntime: typeof DotNet !== 'undefined',
        enhancedProcessorExists: typeof window.enhancedProcessorRender === 'function',
        containerExists: !!document.getElementById('transcript-content-container'),
        containerHTML:
          document.getElementById('transcript-content-container')?.innerHTML || 'NOT FOUND',
      };
    });

    console.log('[PLAYWRIGHT] JavaScript Environment Check:', jsEnv);

    // Test Enhanced Processor function directly
    if (jsEnv.enhancedProcessorExists) {
      const testResult = await page.evaluate(() => {
        try {
          if (window.enhancedProcessorRender) {
            window.enhancedProcessorRender('<div>Direct test content</div>');
          } else {
            return { success: false, error: 'Enhanced processor function not found' };
          }
          const container = document.getElementById('transcript-content-container');
          return {
            success: true,
            resultHTML: container?.innerHTML || 'No container found',
          };
        } catch (error) {
          return {
            success: false,
            error: String(error),
          };
        }
      });

      console.log('[PLAYWRIGHT] Direct Enhanced Processor test:', testResult);

      if (testResult.success) {
        // Verify the content was actually set
        const containerContent = await page.locator('#transcript-content-container').textContent();
        expect(containerContent).toContain('Direct test content');
      }
    }
  });
});
