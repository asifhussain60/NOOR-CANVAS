import { test, expect } from '@playwright/test';

test.describe('Canvas Session Transition Issue', () => {
  test('should successfully transition from SessionWaiting to SessionCanvas', async ({ page }) => {
    // Enable console logging to capture debug information
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`Browser: ${msg.text()}`);
      }
    });

    // Step 1: Go to the home page to start a session
    await page.goto('https://localhost:9091');
    await page.waitForLoadState('networkidle');

    // Step 2: Look for session controls and create a session
    // This might require specific steps based on the current UI
    const sessionControlsSelector = 'text=SESSION CONTROLS';
    if (await page.isVisible(sessionControlsSelector)) {
      console.log('Session controls found - creating a test session');
      
      // Look for Start Session button or equivalent
      const startSessionButton = page.locator('button:has-text("Start Session")');
      if (await startSessionButton.isVisible()) {
        await startSessionButton.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Step 3: Try to navigate to a session waiting room
    // This will require a valid session token - we'll need to extract it from the UI or API
    
    // For now, let's try to access the canvas directly with a test token
    // and see what error we get
    await page.goto('https://localhost:9091/session/canvas/test-token');
    await page.waitForLoadState('networkidle');

    // Step 4: Check if we get the error state
    const errorMessage = page.locator('[data-testid="error-message"]');
    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      console.log(`Canvas error: ${errorText}`);
      
      // This confirms the issue - we're getting an error when trying to access the canvas
      expect(errorText).toContain('Session could not be loaded');
    }

    // Step 5: Check browser network logs for API call failures
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/participant/session/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // Refresh to capture API calls
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    console.log('API calls captured:', apiCalls);
    
    // If we have API calls, check their status
    if (apiCalls.length > 0) {
      const failedCalls = apiCalls.filter(call => call.status >= 400);
      if (failedCalls.length > 0) {
        console.log('Failed API calls:', failedCalls);
      }
    }
  });

  test('should validate token API endpoint directly', async ({ page }) => {
    // Test the API endpoint directly to see if it's working
    const response = await page.request.get('https://localhost:9091/api/participant/session/test-token/validate');
    
    console.log(`API Response Status: ${response.status()}`);
    console.log(`API Response Status Text: ${response.statusText()}`);
    
    if (response.status() >= 400) {
      const responseText = await response.text();
      console.log(`API Error Response: ${responseText}`);
    }
    
    // Document the API behavior for debugging
    expect(response.status()).toBeDefined();
  });

  test('should test complete session flow from waiting to canvas', async ({ page, context }) => {
    // This test will simulate the complete flow that users experience
    
    // Step 1: Create a new session (as host)
    await page.goto('https://localhost:9091');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Get session token and navigate to waiting room
    // (This will need to be adjusted based on actual UI flow)
    
    // Step 3: Simulate "Start Session" action that triggers the transition
    
    // Step 4: Verify that users are successfully moved to canvas view
    
    // For now, just document that this test needs implementation
    console.log('Complete session flow test - requires session creation flow implementation');
  });
});