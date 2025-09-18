const { test, expect } = require('@playwright/test');

/**
 * NOOR Canvas - Host Authentication Flow Test Suite
 * 
 * Tests the complete host authentication workflow including:
 * - Landing page display
 * - Token validation
 * - Navigation to session configuration
 * - Error handling
 */

test.describe('Host Authentication Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to host landing page
    await page.goto('/');
    
    // Wait for page to fully load
    await expect(page.locator('h1')).toContainText('NOOR Canvas');
  });

  test('should display host landing page with proper branding', async ({ page }) => {
    // Verify NOOR Canvas header image is loaded
    const headerImage = page.locator('img[src*="NC-Header.png"]');
    await expect(headerImage).toBeVisible();
    
    // Verify main heading
    const heading = page.locator('h1:has-text("NOOR Canvas")');
    await expect(heading).toBeVisible();
    
    // Verify description text
    const description = page.locator('p:has-text("Manage Islamic learning sessions")');
    await expect(description).toBeVisible();
    
    // Verify host token input field
    const tokenInput = page.locator('input[placeholder*="Host GUID Token"]');
    await expect(tokenInput).toBeVisible();
    
    // Verify proceed button
    const proceedButton = page.locator('button:has-text("Proceed")');
    await expect(proceedButton).toBeVisible();
  });

  test('should show validation error for empty token', async ({ page }) => {
    // Click proceed button without entering token
    await page.click('button:has-text("Proceed")');
    
    // Wait for validation error to appear
    const errorMessage = page.locator('text="Host token is required"');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error for invalid token format', async ({ page }) => {
    // Enter invalid token format
    await page.fill('input[placeholder*="Host GUID Token"]', 'invalid-token');
    await page.click('button:has-text("Proceed")');
    
    // Wait for validation error
    const errorMessage = page.locator('text="Invalid token format"');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should generate new host token via API', async ({ page, request }) => {
    // Make API call to generate host token
    const response = await request.post('/api/host/generate-token', {
      data: {
        sessionId: 215,
        createdBy: 'Playwright Test',
        title: 'Test Session'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const tokenData = await response.json();
    expect(tokenData.hostToken).toBeDefined();
    expect(tokenData.userToken).toBeDefined();
    
    // Use generated token in UI
    await page.fill('input[placeholder*="Host GUID Token"]', tokenData.hostToken);
    await page.click('button:has-text("Proceed")');
    
    // Should navigate to session opener page
    await expect(page).toHaveURL(/\/host\/session-opener\//, { timeout: 10000 });
    
    return { hostToken: tokenData.hostToken, userToken: tokenData.userToken };
  });

  test('should handle expired token gracefully', async ({ page }) => {
    // Use a known expired token format
    const expiredToken = '0000-0000-0000-0000';
    
    await page.fill('input[placeholder*="Host GUID Token"]', expiredToken);
    await page.click('button:has-text("Proceed")');
    
    // Should show appropriate error message
    const errorMessage = page.locator('text="Invalid or expired token"');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should maintain NOOR Canvas styling throughout flow', async ({ page }) => {
    // Verify color scheme consistency
    const card = page.locator('.card, [class*="card"]').first();
    const cardStyles = await card.evaluate(el => getComputedStyle(el));
    
    // Check for NOOR Canvas color palette
    expect(cardStyles.backgroundColor).toMatch(/(245, 241)|#F5F1E8|rgb\(245, 241, 232\)/);
    
    // Verify card dimensions (should be 28rem width as per mock)
    expect(cardStyles.maxWidth).toMatch(/28rem|448px/);
  });
});

/**
 * Export helper function for token generation
 */
async function generateTestToken(request) {
  const response = await request.post('/api/host/generate-token', {
    data: {
      sessionId: Math.floor(Math.random() * 1000) + 200,
      createdBy: 'Playwright Test Suite',
      title: `Test Session ${Date.now()}`
    }
  });
  
  if (!response.ok()) {
    throw new Error(`Failed to generate token: ${response.status()}`);
  }
  
  return await response.json();
}

module.exports = { generateTestToken };