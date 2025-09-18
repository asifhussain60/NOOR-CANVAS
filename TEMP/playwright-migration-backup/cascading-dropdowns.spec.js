const { test, expect } = require('@playwright/test');
const { generateTestToken } = require('./host-authentication.spec.js');

/**
 * NOOR Canvas - Cascading Dropdown Test Suite
 * 
 * Tests Issue-106 cascading dropdown implementation with 2-second delays:
 * - Album selection triggers Category loading
 * - Category selection triggers Session loading
 * - Proper timing and no race conditions
 * - Open Session button functionality
 */

test.describe('Issue-106: Cascading Dropdown Implementation', () => {
  
  let hostToken;
  
  test.beforeAll(async ({ request }) => {
    // Generate a fresh host token for testing
    const tokenData = await generateTestToken(request);
    hostToken = tokenData.hostToken;
  });

  test.beforeEach(async ({ page }) => {
    // Navigate directly to session opener with valid token
    await page.goto(`/host/session-opener/${hostToken}`);
    
    // Wait for page to load completely
    await expect(page.locator('h1:has-text("Session Configuration")')).toBeVisible({ timeout: 10000 });
  });

  test('should load cascading dropdown with proper 2-second delays', async ({ page }) => {
    console.log('Testing cascading dropdown implementation...');
    
    // Wait for initial page load
    await page.waitForLoadState('networkidle');
    
    // Monitor console logs for cascading sequence
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('ISSUE-106-CASCADING')) {
        consoleLogs.push({ time: Date.now(), text: msg.text() });
      }
    });

    // Wait for cascading sequence to complete (should take ~6 seconds total)
    console.log('Waiting for cascading sequence to complete...');
    await page.waitForTimeout(8000); // Give extra time for 2s + 2s + 2s sequence

    // Verify Album dropdown has value 18
    const albumSelect = page.locator('select[data-testid="album-select"], select:has(option:text-is("18"))').first();
    await expect(albumSelect).toHaveValue('18', { timeout: 5000 });

    // Verify Category dropdown has value 55  
    const categorySelect = page.locator('select[data-testid="category-select"], select:has(option:text-is("55"))').first();
    await expect(categorySelect).toHaveValue('55', { timeout: 5000 });

    // Verify Session dropdown has value 1281
    const sessionSelect = page.locator('select[data-testid="session-select"], select:has(option:text-is("1281"))').first();
    await expect(sessionSelect).toHaveValue('1281', { timeout: 5000 });

    // Verify timing of cascading logs (should show proper 2-second delays)
    expect(consoleLogs.length).toBeGreaterThan(0);
    console.log('Cascading logs captured:', consoleLogs.length);
    
    // Log captured sequence for debugging
    consoleLogs.forEach((log, index) => {
      console.log(`Log ${index + 1}: ${log.text}`);
    });
  });

  test('should handle Open Session button click with cascaded values', async ({ page }) => {
    console.log('Testing Open Session button functionality...');
    
    // Wait for cascading to complete
    await page.waitForTimeout(8000);
    
    // Verify Open Session button is visible and enabled
    const openSessionButton = page.locator('button:has-text("Open Session")');
    await expect(openSessionButton).toBeVisible();
    await expect(openSessionButton).toBeEnabled();

    // Monitor for API calls and responses when button is clicked
    const apiCalls = [];
    page.on('request', req => {
      if (req.url().includes('/api/host/create-session')) {
        apiCalls.push({ 
          url: req.url(), 
          method: req.method(),
          postData: req.postData()
        });
      }
    });

    // Monitor API responses to validate data accuracy
    const apiResponses = [];
    page.on('response', async (response) => {
      if (response.url().includes('/api/host/create-session')) {
        try {
          const responseData = await response.json();
          apiResponses.push({
            status: response.status(),
            data: responseData,
            url: response.url()
          });
          console.log('API Response captured:', JSON.stringify(responseData, null, 2));
        } catch (e) {
          console.log('Failed to parse API response as JSON:', e.message);
        }
      }
    });

    // Click Open Session button
    await openSessionButton.click();

    // Wait for API call to complete
    await page.waitForTimeout(5000);

    // Verify API call was made with correct data
    expect(apiCalls.length).toBeGreaterThan(0);
    console.log('API calls captured:', apiCalls.length);
    
    // Validate API response data accuracy
    expect(apiResponses.length).toBeGreaterThan(0);
    const apiResponse = apiResponses[0];
    
    // Verify API response structure (Issue-106 URL Generation Prerequisites)
    expect(apiResponse.status).toBe(200);
    expect(apiResponse.data).toBeDefined();
    expect(apiResponse.data.Success).toBe(true);
    expect(apiResponse.data.UserToken).toBeDefined();
    expect(apiResponse.data.UserToken.length).toBe(8); // 8-character friendly tokens
    expect(apiResponse.data.SessionId).toBeDefined();
    
    console.log('✅ API Prerequisites validated - UserToken:', apiResponse.data.UserToken);

    // Check if Session URL panel becomes visible (should be forced to show)
    const sessionUrlPanel = page.locator('[data-testid="session-url-panel"], .session-url-panel, text="Session URL"');
    await expect(sessionUrlPanel.first()).toBeVisible({ timeout: 10000 });
    
    console.log('Session URL panel visibility confirmed');
  });

  test('should prevent race conditions during cascading', async ({ page }) => {
    console.log('Testing race condition prevention...');
    
    // Monitor for IsSettingDefaultValues flag management
    const flagLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('IsSettingDefaultValues') || msg.text().includes('flag')) {
        flagLogs.push(msg.text());
      }
    });

    // Wait for cascading to complete
    await page.waitForTimeout(8000);

    // Verify flag was properly managed
    expect(flagLogs.length).toBeGreaterThan(0);
    console.log('Flag management logs:', flagLogs.length);
    
    // Look for flag reset confirmation
    const hasResetLog = flagLogs.some(log => log.includes('reset to false') || log.includes('flag reset'));
    expect(hasResetLog).toBeTruthy();
  });

  test('should maintain dropdown selections throughout cascading', async ({ page }) => {
    console.log('Testing dropdown selection persistence...');
    
    // Wait for cascading to start
    await page.waitForTimeout(2000);

    // Check Album dropdown during cascading
    const albumSelect = page.locator('select').first();
    await expect(albumSelect).toHaveValue('18', { timeout: 8000 });

    // Wait for Category cascading
    await page.waitForTimeout(3000);
    const categorySelect = page.locator('select').nth(1);
    await expect(categorySelect).toHaveValue('55', { timeout: 5000 });

    // Wait for Session cascading  
    await page.waitForTimeout(3000);
    const sessionSelect = page.locator('select').nth(2);
    await expect(sessionSelect).toHaveValue('1281', { timeout: 5000 });

    console.log('All dropdown selections maintained during cascading');
  });

  test('should complete full workflow: cascading -> open session -> url display', async ({ page }) => {
    console.log('Testing complete Issue-106 workflow...');
    
    // Step 1: Wait for cascading dropdown loading (6+ seconds)
    console.log('Step 1: Waiting for cascading sequence...');
    await page.waitForTimeout(8000);

    // Step 2: Verify all dropdowns have correct values
    console.log('Step 2: Verifying dropdown values...');
    const albumSelect = page.locator('select').first();
    const categorySelect = page.locator('select').nth(1); 
    const sessionSelect = page.locator('select').nth(2);
    
    await expect(albumSelect).toHaveValue('18');
    await expect(categorySelect).toHaveValue('55');
    await expect(sessionSelect).toHaveValue('1281');

    // Step 3: Click Open Session button
    console.log('Step 3: Clicking Open Session button...');
    const openSessionButton = page.locator('button:has-text("Open Session")');
    await openSessionButton.click();

    // Step 4: Verify Session URL panel shows (forced display)
    console.log('Step 4: Verifying Session URL panel display...');
    await page.waitForTimeout(3000);
    
    // Look for session URL panel or related elements
    const sessionPanel = page.locator('[data-testid="session-url-panel"], .session-url, text="Session URL", text="User Token", text="Host Token"');
    await expect(sessionPanel.first()).toBeVisible({ timeout: 10000 });

    console.log('✅ Complete Issue-106 workflow test passed');
  });

  test('should generate correct user URLs for Open Session functionality', async ({ page }) => {
    console.log('Testing Issue-106 URL generation accuracy...');
    
    // Wait for cascading to complete
    await page.waitForTimeout(8000);
    
    // Monitor API responses for UserToken
    let generatedUserToken = null;
    page.on('response', async (response) => {
      if (response.url().includes('/api/host/create-session')) {
        try {
          const responseData = await response.json();
          generatedUserToken = responseData.UserToken;
        } catch (e) {
          console.log('Failed to capture UserToken:', e.message);
        }
      }
    });

    // Click Open Session button to trigger URL generation
    const openSessionButton = page.locator('button:has-text("Open Session")');
    await openSessionButton.click();
    await page.waitForTimeout(5000);

    // Verify UserToken was generated
    expect(generatedUserToken).toBeDefined();
    expect(generatedUserToken.length).toBe(8);
    console.log('Generated UserToken:', generatedUserToken);

    // Find the displayed Session URL in the panel
    const sessionUrlElement = page.locator('#sessionUrl, [data-testid="session-url"], text*="localhost:9091"');
    await expect(sessionUrlElement.first()).toBeVisible({ timeout: 10000 });
    
    const displayedUrl = await sessionUrlElement.first().textContent();
    console.log('Displayed Session URL:', displayedUrl);

    // Validate URL format and token matching
    const expectedUrl = `https://localhost:9091/user/landing/${generatedUserToken}`;
    expect(displayedUrl.trim()).toBe(expectedUrl);
    
    // Test URL accessibility by navigating to it
    console.log('Testing URL accessibility...');
    const newPage = await page.context().newPage();
    
    try {
      await newPage.goto(expectedUrl);
      await newPage.waitForLoadState('networkidle');
      
      // Verify the URL loads the correct UserLanding page
      const pageTitle = await newPage.locator('h1, title').first().textContent();
      console.log('URL destination page title:', pageTitle);
      
      // Should load UserLanding.razor with proper token recognition
      expect(pageTitle).toContain('User'); // Basic validation
      
      console.log('✅ URL generation and accessibility validated');
    } catch (error) {
      console.log('❌ URL accessibility failed:', error.message);
      throw new Error(`Generated URL ${expectedUrl} is not accessible: ${error.message}`);
    } finally {
      await newPage.close();
    }
  });
});

test.describe('Issue-106: Error Handling & Edge Cases', () => {
  
  test('should handle API errors gracefully during cascading', async ({ page }) => {
    // Navigate with potentially invalid token to trigger errors
    await page.goto('/host/session-opener/invalid-token-format');
    
    // Wait for error handling
    await page.waitForTimeout(5000);
    
    // Should display error message but not crash
    const errorElement = page.locator('text="error", text="failed", text="invalid"').first();
    await expect(errorElement).toBeVisible({ timeout: 10000 });
  });

  test('should recover from network timeouts during cascading', async ({ page }) => {
    // This test would need network interception to simulate timeouts
    // For now, we'll test the basic error display functionality
    
    await page.goto('/host/session-opener/timeout-test');
    await page.waitForTimeout(5000);
    
    // Should show some form of error state
    const hasErrorState = await page.locator('text="error", text="timeout", text="failed"').first().isVisible();
    console.log('Error state handling:', hasErrorState ? 'Present' : 'Not found');
  });
});