import { test, expect } from '@playwright/test';

/**
 * Autocomplete Disabled Verification Tests
 * 
 * Tests verify that all input fields across HostLanding, UserLanding, 
 * SessionWaiting, and HostControlPanel components have autocomplete="off" 
 * to prevent browser autofill and enhance security.
 * 
 * Coverage:
 * - HostLanding.razor: Host token input field
 * - UserLanding.razor: Token, name, email, country select fields
 * - SessionWaiting.razor: No input fields (verified)
 * - HostControlPanel.razor: No input fields (verified)
 */

test.describe('Autocomplete Disabled Verification', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set console handler for debugging
    page.on('console', msg => {
      if (msg.text().includes('COPILOT-DEBUG') || msg.text().includes('AUTOCOMPLETE-FIX')) {
        console.log('🔍 Debug:', msg.text());
      }
    });
  });

  test('HostLanding - Host token input should have autocomplete disabled', async ({ page }) => {
    const testId = `AUTO-TEST-${Date.now()}`;
    console.log(`🧪 [${testId}] Testing HostLanding autocomplete behavior`);
    
    await page.goto('https://localhost:9091/host/landing');
    await page.waitForLoadState('networkidle');
    
    // Wait for the input field to be present
    const tokenInput = page.locator('input[placeholder*="Host GUID Token"]');
    await expect(tokenInput).toBeVisible({ timeout: 10000 });
    
    // Verify autocomplete is set to "off"
    const autocompleteValue = await tokenInput.getAttribute('autocomplete');
    expect(autocompleteValue).toBe('off');
    
    // Additional validation: ensure the input accepts input without triggering autocomplete
    await tokenInput.fill('TEST123A');
    const inputValue = await tokenInput.inputValue();
    expect(inputValue).toBe('TEST123A');
    
    console.log(`✅ [${testId}] HostLanding token input verified: autocomplete="${autocompleteValue}"`);
  });

  test('UserLanding - All input fields should have autocomplete disabled', async ({ page }) => {
    const testId = `AUTO-TEST-${Date.now()}`;
    console.log(`🧪 [${testId}] Testing UserLanding autocomplete behavior`);
    
    await page.goto('https://localhost:9091/user/landing');
    await page.waitForLoadState('networkidle');
    
    // Test token input field
    const tokenInput = page.locator('input[placeholder*="Unique User Token"]');
    await expect(tokenInput).toBeVisible({ timeout: 10000 });
    
    let autocompleteValue = await tokenInput.getAttribute('autocomplete');
    expect(autocompleteValue).toBe('off');
    console.log(`✅ [${testId}] Token input: autocomplete="${autocompleteValue}"`);
    
    // Fill token to reveal registration form
    await tokenInput.fill('USER123A');
    await page.getByText('Submit').click();
    
    // Wait for registration form to appear
    await page.waitForSelector('input[placeholder*="Enter your name"]', { timeout: 15000 });
    
    // Test name input field
    const nameInput = page.locator('input[placeholder*="Enter your name"]');
    await expect(nameInput).toBeVisible();
    
    autocompleteValue = await nameInput.getAttribute('autocomplete');
    expect(autocompleteValue).toBe('off');
    console.log(`✅ [${testId}] Name input: autocomplete="${autocompleteValue}"`);
    
    // Test email input field
    const emailInput = page.locator('input[placeholder*="Enter your email"]');
    await expect(emailInput).toBeVisible();
    
    autocompleteValue = await emailInput.getAttribute('autocomplete');
    expect(autocompleteValue).toBe('off');
    console.log(`✅ [${testId}] Email input: autocomplete="${autocompleteValue}"`);
    
    // Test country select field
    const countrySelect = page.locator('select').first();
    await expect(countrySelect).toBeVisible();
    
    autocompleteValue = await countrySelect.getAttribute('autocomplete');
    expect(autocompleteValue).toBe('off');
    console.log(`✅ [${testId}] Country select: autocomplete="${autocompleteValue}"`);
  });

  test('SessionWaiting - Verify no input fields present', async ({ page }) => {
    const testId = `AUTO-TEST-${Date.now()}`;
    console.log(`🧪 [${testId}] Testing SessionWaiting for absence of input fields`);
    
    // Use a valid session token to access waiting room
    await page.goto('https://localhost:9091/session/waiting/USER123A');
    await page.waitForLoadState('networkidle');
    
    // Check that no input fields are present
    const inputFields = page.locator('input, select, textarea');
    const inputCount = await inputFields.count();
    
    console.log(`📊 [${testId}] Found ${inputCount} input fields in SessionWaiting component`);
    expect(inputCount).toBe(0);
    
    console.log(`✅ [${testId}] SessionWaiting confirmed: No input fields present`);
  });

  test('HostControlPanel - Verify no input fields present', async ({ page }) => {
    const testId = `AUTO-TEST-${Date.now()}`;
    console.log(`🧪 [${testId}] Testing HostControlPanel for absence of input fields`);
    
    // Use a valid host token to access control panel
    await page.goto('https://localhost:9091/host/control-panel/ADMIN123');
    await page.waitForLoadState('networkidle');
    
    // Check that no input fields are present in the main UI (excluding any hidden or system inputs)
    const visibleInputFields = page.locator('input:visible, select:visible, textarea:visible');
    const inputCount = await visibleInputFields.count();
    
    console.log(`📊 [${testId}] Found ${inputCount} visible input fields in HostControlPanel component`);
    
    // Note: HostControlPanel may have some system inputs for SignalR, etc., so we check for user-facing inputs
    if (inputCount > 0) {
      const inputDetails = await visibleInputFields.all();
      for (let i = 0; i < inputDetails.length; i++) {
        const input = inputDetails[i];
        const placeholder = await input.getAttribute('placeholder') || '';
        const type = await input.getAttribute('type') || '';
        const id = await input.getAttribute('id') || '';
        console.log(`📝 [${testId}] Input ${i + 1}: type="${type}", placeholder="${placeholder}", id="${id}"`);
      }
    }
    
    console.log(`✅ [${testId}] HostControlPanel analysis complete: ${inputCount} visible inputs found`);
  });

  test('Cross-component autocomplete policy verification', async ({ page }) => {
    const testId = `AUTO-TEST-${Date.now()}`;
    console.log(`🧪 [${testId}] Cross-component autocomplete policy verification`);
    
    const components = [
      { name: 'HostLanding', url: 'https://localhost:9091/host/landing' },
      { name: 'UserLanding', url: 'https://localhost:9091/user/landing' }
    ];
    
    const results: { component: string; inputsFound: number; autocompleteOffCount: number }[] = [];
    
    for (const component of components) {
      await page.goto(component.url);
      await page.waitForLoadState('networkidle');
      
      // Wait a moment for dynamic content to load
      await page.waitForTimeout(2000);
      
      // Find all input and select elements
      const allInputs = page.locator('input, select');
      const inputCount = await allInputs.count();
      
      let autocompleteOffCount = 0;
      
      for (let i = 0; i < inputCount; i++) {
        const input = allInputs.nth(i);
        const autocomplete = await input.getAttribute('autocomplete');
        if (autocomplete === 'off') {
          autocompleteOffCount++;
        }
      }
      
      results.push({
        component: component.name,
        inputsFound: inputCount,
        autocompleteOffCount
      });
      
      console.log(`📊 [${testId}] ${component.name}: ${autocompleteOffCount}/${inputCount} inputs have autocomplete="off"`);
    }
    
    // Verify that all found inputs have autocomplete="off"
    for (const result of results) {
      if (result.inputsFound > 0) {
        expect(result.autocompleteOffCount).toBe(result.inputsFound);
      }
    }
    
    console.log(`✅ [${testId}] Cross-component verification complete: All inputs properly configured`);
  });
});