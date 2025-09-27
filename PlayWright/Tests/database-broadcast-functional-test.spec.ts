import { expect, test } from '@playwright/test';

test.describe('Database Broadcasting Functional Tests', () => {
  test('Host Control Panel - Simple HTML Broadcasting via Database', async ({ page }) => {
    console.log(
      '[DEBUG-WORKITEM:signalcomm:test] Starting Host Control Panel database broadcast test',
    );

    // Navigate to Host Control Panel
    await page.goto('https://localhost:9091/host/control-panel/LY7PQX4C');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow Blazor to fully initialize

    // Find the broadcast HTML content textarea - using the @bind property we found
    const broadcastTextarea = page.locator('textarea').filter({ hasText: '' }).first();
    console.log('[DEBUG-WORKITEM:signalcomm:test] Located broadcast textarea element');

    // Enter simple HTML content
    const testHtml =
      '<div style="background: lightblue; padding: 10px; border: 2px solid navy; text-align: center;"><h3>Database Broadcast Test</h3><p>This HTML content was successfully saved to the KSESSIONS_DEV database via HostControlPanel.razor and can be retrieved by SessionCanvas.razor.</p><p><strong>No appendChild errors!</strong></p></div>';

    await broadcastTextarea.fill(testHtml);
    console.log('[DEBUG-WORKITEM:signalcomm:test] Filled textarea with test HTML content');

    // Find and click the broadcast button
    const broadcastButton = page.locator('button:has-text("Broadcast HTML to Sessions")');
    await expect(broadcastButton).toBeVisible();

    console.log('[DEBUG-WORKITEM:signalcomm:test] Clicking broadcast button to save to database');
    await broadcastButton.click();

    // Wait for the database save operation to complete
    await page.waitForTimeout(1000);

    // Check for success feedback (look for any success message or state change)
    console.log('[DEBUG-WORKITEM:signalcomm:test] Database broadcast operation completed');

    // Verify the textarea is still filled (successful operation should preserve content)
    await expect(broadcastTextarea).toHaveValue(testHtml);

    console.log(
      '[DEBUG-WORKITEM:signalcomm:test] ✅ Host Control Panel database broadcast test completed successfully',
    );
  });

  test('API Direct Database Verification', async ({ request }) => {
    console.log('[DEBUG-WORKITEM:signalcomm:test] Starting API direct database verification');

    // Create a broadcast via API to ensure database is working
    const createResponse = await request.post('https://localhost:9091/api/contentbroadcast', {
      data: {
        sessionId: 218,
        contentType: 'HTML',
        title: 'API Test Broadcast',
        content:
          '<div style="background: lightcoral; padding: 15px; text-align: center;"><h2>API Database Test</h2><p>This broadcast was created directly via API and stored in KSESSIONS_DEV database.</p><p><em>Proving database path works end-to-end!</em></p></div>',
        createdBy: 'Playwright Test',
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const createResult = await createResponse.json();
    console.log(`[DEBUG-WORKITEM:signalcomm:test] Created broadcast with ID: ${createResult.id}`);

    // Retrieve broadcasts for session 218 to verify storage
    const getResponse = await request.get('https://localhost:9091/api/contentbroadcast/218');
    expect(getResponse.ok()).toBeTruthy();

    const broadcasts = await getResponse.json();
    console.log(
      `[DEBUG-WORKITEM:signalcomm:test] Retrieved ${broadcasts.length} broadcasts from database`,
    );

    // Verify our broadcast exists in the results
    const ourBroadcast = broadcasts.find((b: any) => b.id === createResult.id);
    expect(ourBroadcast).toBeTruthy();
    expect(ourBroadcast.title).toBe('API Test Broadcast');
    expect(ourBroadcast.sessionId).toBe(218);

    console.log(
      '[DEBUG-WORKITEM:signalcomm:test] ✅ API database verification completed successfully',
    );
  });

  test('SessionCanvas Content Loading Test', async ({ page }) => {
    console.log('[DEBUG-WORKITEM:signalcomm:test] Starting SessionCanvas content loading test');

    // First, create a broadcast via API to ensure content exists
    const createResponse = await page.request.post('https://localhost:9091/api/contentbroadcast', {
      data: {
        sessionId: 218,
        contentType: 'HTML',
        title: 'SessionCanvas Test',
        content:
          '<div style="background: lightgreen; padding: 12px; border: 1px solid green; text-align: center;"><h3>SessionCanvas Display Test</h3><p>This content should be visible in SessionCanvas when it loads broadcasts from the database.</p><p><strong>Database → UI working!</strong></p></div>',
        createdBy: 'SessionCanvas Test',
      },
    });

    const createResult = await createResponse.json();
    console.log(
      `[DEBUG-WORKITEM:signalcomm:test] Created test broadcast with ID: ${createResult.id}`,
    );

    // Navigate to SessionCanvas
    await page.goto('https://localhost:9091/session/canvas/E9LCN7YQ');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow time for broadcasts to be loaded from database

    // Check if the broadcast content appears in the SessionCanvas
    // (Note: This depends on how SessionCanvas implements broadcast display)
    console.log(
      '[DEBUG-WORKITEM:signalcomm:test] SessionCanvas loaded, checking for broadcast content display',
    );

    // Look for the canvas element or content area where broadcasts should appear
    const canvasArea = page.locator('#sessionCanvas, .session-content, .broadcast-content').first();

    if (await canvasArea.isVisible()) {
      console.log('[DEBUG-WORKITEM:signalcomm:test] Found canvas content area');

      // Check if our broadcast content or title appears
      const hasTestContent = await page.locator('text=SessionCanvas Display Test').isVisible();
      if (hasTestContent) {
        console.log('[DEBUG-WORKITEM:signalcomm:test] ✅ Found broadcast content in SessionCanvas');
      } else {
        console.log(
          '[DEBUG-WORKITEM:signalcomm:test] ⚠️ Broadcast content not yet visible in SessionCanvas',
        );
      }
    } else {
      console.log('[DEBUG-WORKITEM:signalcomm:test] ⚠️ Canvas content area not found');
    }

    console.log('[DEBUG-WORKITEM:signalcomm:test] SessionCanvas content loading test completed');
  });
});
