/**
 * ISSUE-124: UserLanding.razor Session Name Display Fix Test
 * 
 * Test validates that UserLanding component correctly displays session names
 * from API responses instead of showing "Unknown Session" fallback.
 * 
 * Root Cause: SessionValidationResponse class was expecting Title/Status at root level
 * but API returns nested session.title and session.status properties.
 * 
 * Fix: Updated SessionValidationResponse to handle nested session object structure
 * and modified parsing logic to extract values from session.title/session.status.
 */

import { test, expect } from '@playwright/test';

test.describe('Issue-124: Session Name Display Fix', () => {
  
  test('should display actual session name from API instead of "Unknown Session"', async ({ page }) => {
    // Navigate to UserLanding with valid token that returns session data
    const testToken = '5TSJAUC8'; // Token known to return "Need For Messengers" session
    await page.goto(`https://localhost:9091/user/landing/${testToken}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // The page should load without showing "Unknown Session"
    const pageText = await page.textContent('body');
    expect(pageText).not.toContain('Unknown Session');
    
    // Click submit button to trigger token validation
    const submitButton = page.locator('button', { hasText: 'Submit' });
    await submitButton.click();
    
    // Wait for API response and UI update
    await page.waitForResponse(response => 
      response.url().includes(`/api/participant/session/${testToken}/validate`) && 
      response.status() === 200
    );
    
    // Wait a moment for UI update after API response
    await page.waitForTimeout(1000);
    
    // Verify session name is displayed correctly (not "Unknown Session")
    // Expected: "Need For Messengers" based on API response
    const sessionName = await page.locator('[data-testid="session-name"]').textContent();
    
    // Test assertion: Should display actual session name from API
    expect(sessionName).not.toBe('Unknown Session');
    expect(sessionName).toBeTruthy(); // Should have some actual content
    
    // Additional verification: Check if session name contains expected content
    // Based on logs, API returns "Need For Messengers"
    if (sessionName?.includes('Need For Messengers')) {
      console.log('✅ SUCCESS: Session name correctly displays API title:', sessionName);
    }
    
    // Verify session description is also populated
    const sessionDescription = await page.locator('[data-testid="session-description"]').textContent();
    expect(sessionDescription).not.toBe('Status: Unknown');
    expect(sessionDescription).toBeTruthy();
    
    console.log('Session Name:', sessionName);
    console.log('Session Description:', sessionDescription);
  });

  test('should handle invalid token gracefully without showing "Unknown Session"', async ({ page }) => {
    // Navigate with invalid token
    const invalidToken = 'INVALID1';
    await page.goto(`https://localhost:9091/user/landing/${invalidToken}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click submit button to trigger validation
    const submitButton = page.locator('button', { hasText: 'Submit' });
    await submitButton.click();
    
    // Wait for API response (should be error)
    await page.waitForResponse(response => 
      response.url().includes(`/api/participant/session/${invalidToken}/validate`)
    );
    
    // Wait a moment for UI update
    await page.waitForTimeout(1000);
    
    // Should show error message, not "Unknown Session"
    const errorMessage = await page.locator('.text-red-500, .error-message').textContent();
    expect(errorMessage).toBeTruthy();
    expect(errorMessage).not.toBe('Unknown Session');
    
    console.log('Error handling for invalid token:', errorMessage);
  });

  test('should verify API response structure matches SessionValidationResponse model', async ({ page }) => {
    const testToken = '5TSJAUC8';
    
    // Set up network monitoring
    const apiResponses: any[] = [];
    page.on('response', async (response) => {
      if (response.url().includes('/api/participant/session/') && response.url().includes('/validate')) {
        try {
          const responseData = await response.json();
          apiResponses.push(responseData);
        } catch (e) {
          console.log('Could not parse API response as JSON');
        }
      }
    });
    
    // Navigate and trigger API call
    await page.goto(`https://localhost:9091/user/landing/${testToken}`);
    await page.waitForLoadState('networkidle');
    
    const submitButton = page.locator('button', { hasText: 'Submit' });
    await submitButton.click();
    
    // Wait for API response
    await page.waitForResponse(response => 
      response.url().includes(`/api/participant/session/${testToken}/validate`) && 
      response.status() === 200
    );
    
    // Verify API response structure
    expect(apiResponses.length).toBeGreaterThan(0);
    const apiResponse = apiResponses[0];
    
    // Validate the response structure matches our fixed SessionValidationResponse
    expect(apiResponse).toHaveProperty('valid');
    expect(apiResponse).toHaveProperty('sessionId');
    expect(apiResponse).toHaveProperty('session');
    
    // Verify nested session object has title and status
    expect(apiResponse.session).toHaveProperty('title');
    expect(apiResponse.session).toHaveProperty('status');
    
    console.log('✅ API Response structure validated:', {
      valid: apiResponse.valid,
      sessionId: apiResponse.sessionId,
      sessionTitle: apiResponse.session?.title,
      sessionStatus: apiResponse.session?.status
    });
  });

});