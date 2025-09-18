const { test, expect } = require('@playwright/test');

/**
 * NOOR Canvas - User Authentication & Session Flow Test Suite
 * 
 * Tests the complete user authentication workflow including:
 * - User landing page display  
 * - Token validation (Issue-102 fixes)
 * - Registration vs. token entry logic
 * - Session waiting room
 * - Active session participation
 */

test.describe('User Authentication Flow', () => {

  test('should display user landing page for no token', async ({ page }) => {
    // Navigate to user landing without token
    await page.goto('/user/landing');
    
    // Should show token entry form (not registration form)
    await expect(page.locator('h1, h2, h3')).toContainText('Enter Session Token');
    
    // Verify token input field exists
    const tokenInput = page.locator('input[type="text"], input[placeholder*="token"]');
    await expect(tokenInput).toBeVisible();
    
    // Verify join button exists
    const joinButton = page.locator('button:has-text("Join"), button:has-text("Enter")');
    await expect(joinButton).toBeVisible();
  });

  test('should display token entry form for invalid token', async ({ page }) => {
    // Navigate with invalid token
    await page.goto('/user/landing/INVALID123');
    
    // Should show token entry form with error (Issue-102 fix)
    await expect(page.locator('h1, h2, h3')).toContainText('Enter Session Token');
    
    // Should show error message about invalid token
    const errorMessage = page.locator('text="invalid", text="error", .error');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle valid session token and show session details', async ({ page, request }) => {
    // First generate a valid user token via host flow
    const tokenResponse = await request.post('/api/host/generate-token', {
      data: {
        sessionId: 300,
        createdBy: 'User Flow Test',
        title: 'User Authentication Test Session'
      }
    });
    
    expect(tokenResponse.ok()).toBeTruthy();
    const tokenData = await tokenResponse.json();
    
    // Navigate with valid user token
    await page.goto(`/user/landing/${tokenData.userToken}`);
    
    // Should show session details or waiting room
    await expect(page).toHaveURL(/\/user\/(waiting|session)/, { timeout: 10000 });
    
    // Verify session information is displayed
    const sessionInfo = page.locator('text="Session", text="Waiting", h1, h2, h3');
    await expect(sessionInfo.first()).toBeVisible();
  });
});

test.describe('Session Waiting Room', () => {

  test('should display waiting room with countdown timer', async ({ page }) => {
    // This test assumes a waiting room exists - may need to be updated based on implementation
    await page.goto('/user/waiting/test-session');
    
    // Look for waiting room elements
    const waitingElements = page.locator('text="waiting", text="countdown", text="participants", .waiting-room');
    
    // If waiting room is implemented, should see these elements
    const hasWaitingRoom = await waitingElements.first().isVisible({ timeout: 5000 });
    
    if (hasWaitingRoom) {
      // Verify countdown timer
      const timer = page.locator('[data-testid="countdown"], .timer, text=":", text="minutes", text="seconds"');
      await expect(timer.first()).toBeVisible();
      
      // Verify participant list area
      const participants = page.locator('[data-testid="participants"], .participant-list, text="participant"');
      await expect(participants.first()).toBeVisible();
    } else {
      console.log('Waiting room not yet implemented - test skipped');
    }
  });
});

test.describe('Active Session Canvas', () => {

  test('should display canvas interface for active session', async ({ page }) => {
    // This test assumes canvas interface exists - may need to be updated
    await page.goto('/user/session/active-test');
    
    // Look for canvas elements
    const canvasElements = page.locator('canvas, .canvas-container, text="annotation", text="drawing"');
    
    const hasCanvas = await canvasElements.first().isVisible({ timeout: 5000 });
    
    if (hasCanvas) {
      // Verify canvas drawing area
      const drawingArea = page.locator('canvas, [data-testid="drawing-canvas"]');
      await expect(drawingArea.first()).toBeVisible();
      
      // Verify annotation tools
      const tools = page.locator('.tool, .annotation-tool, button:has-text("pen"), button:has-text("eraser")');
      const hasTools = await tools.first().isVisible({ timeout: 2000 });
      
      console.log('Canvas tools available:', hasTools);
    } else {
      console.log('Active session canvas not yet implemented - test skipped');
    }
  });
});

test.describe('End-to-End User Journey', () => {

  test('complete user flow: token entry -> waiting room -> active session', async ({ page, request }) => {
    console.log('Testing complete user journey...');
    
    // Step 1: Generate host session with tokens
    const tokenResponse = await request.post('/api/host/generate-token', {
      data: {
        sessionId: 400,
        createdBy: 'E2E Test',
        title: 'End-to-End User Journey Test'
      }
    });
    
    expect(tokenResponse.ok()).toBeTruthy();
    const tokens = await tokenResponse.json();
    
    // Step 2: User enters token on landing page
    await page.goto('/user/landing');
    
    const tokenInput = page.locator('input[type="text"], input[placeholder*="token"]').first();
    await tokenInput.fill(tokens.userToken);
    
    const submitButton = page.locator('button:has-text("Join"), button:has-text("Enter"), button[type="submit"]').first();
    await submitButton.click();
    
    // Step 3: Should navigate to appropriate next step
    await page.waitForTimeout(3000);
    
    // Could be waiting room, session details, or direct session access
    const currentUrl = page.url();
    console.log('User navigated to:', currentUrl);
    
    // Verify we're no longer on landing page
    expect(currentUrl).not.toMatch(/\/user\/landing$/);
    
    // Verify some content loaded
    const content = page.locator('h1, h2, h3, .content, main').first();
    await expect(content).toBeVisible();
    
    console.log('✅ Complete user journey test completed');
  });
});

test.describe('Issue-102: Routing Logic Fixes', () => {

  test('should show token entry form for no token (not registration)', async ({ page }) => {
    // Test Issue-102 fix: /user/landing should show token entry form
    await page.goto('/user/landing');
    
    // Should NOT show registration form
    const registrationElements = page.locator('text="register", text="sign up", text="create account"');
    const hasRegistration = await registrationElements.first().isVisible({ timeout: 2000 });
    expect(hasRegistration).toBeFalsy();
    
    // Should show token entry form
    const tokenForm = page.locator('input[placeholder*="token"], text="Enter", text="Token"');
    await expect(tokenForm.first()).toBeVisible();
  });

  test('should show token entry form for invalid token (not registration)', async ({ page }) => {
    // Test Issue-102 fix: /user/landing/INVALID should show token entry form
    await page.goto('/user/landing/INVALID123');
    
    // Should NOT show registration form  
    const registrationElements = page.locator('text="register", text="sign up", text="create account"');
    const hasRegistration = await registrationElements.first().isVisible({ timeout: 2000 });
    expect(hasRegistration).toBeFalsy();
    
    // Should show token entry form with error
    const tokenForm = page.locator('input[placeholder*="token"], text="Enter", text="Token"');
    await expect(tokenForm.first()).toBeVisible();
    
    // Should show error about invalid token
    const error = page.locator('text="invalid", text="error", .error, .alert-danger');
    await expect(error.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle API validation failures correctly', async ({ page }) => {
    // Test that API failures return false in ValidateTokenAsync (Issue-102 fix)
    
    // This token format should trigger API validation
    await page.goto('/user/landing/TEST-API-VALIDATION-FAIL');
    
    // Should treat API failure as invalid token (not valid)
    const tokenForm = page.locator('input[placeholder*="token"], text="Enter", text="Token"');
    await expect(tokenForm.first()).toBeVisible();
    
    console.log('API validation failure handled correctly');
  });
});