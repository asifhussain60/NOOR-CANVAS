import { test, expect } from '@playwright/test';

test.describe('Registration Flow Validation', () => {
  test('Complete registration flow should navigate to waiting room', async ({ page }) => {
    // Navigate to the user landing page with test token
    await page.goto('https://localhost:9091/user/landing/KJAHA99L');
    
    // Wait for the page to load and token validation to complete
    await page.waitForSelector('input[name="fullName"]', { timeout: 10000 });
    
    console.log('✅ Registration form loaded successfully');
    
    // Fill out the registration form
    await page.fill('input[name="fullName"]', 'Test User Name');
    console.log('✅ Filled full name');
    
    await page.fill('input[name="email"]', 'test@example.com');
    console.log('✅ Filled email');
    
    await page.fill('input[name="phone"]', '+1234567890');
    console.log('✅ Filled phone');
    
    // Select country from dropdown
    await page.selectOption('select[name="country"]', { label: 'Australia' });
    console.log('✅ Selected country');
    
    // Fill city
    await page.fill('input[name="city"]', 'Test City');
    console.log('✅ Filled city');
    
    // Check the checkbox for terms
    await page.check('input[type="checkbox"]');
    console.log('✅ Checked terms checkbox');
    
    // Get the current URL before submission
    const currentUrl = page.url();
    console.log(`Current URL before submission: ${currentUrl}`);
    
    // Click the submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    console.log('✅ Clicked submit button');
    
    // Wait for navigation to waiting room
    // The UserLanding component should route to /session/waiting/KJAHA99L
    await page.waitForURL('**/session/waiting/KJAHA99L', { timeout: 15000 });
    console.log('✅ Successfully navigated to waiting room');
    
    // Verify we're on the waiting room page
    const finalUrl = page.url();
    console.log(`Final URL after registration: ${finalUrl}`);
    
    expect(finalUrl).toContain('/session/waiting/KJAHA99L');
    
    // Wait for the waiting room page to load properly
    await page.waitForSelector('body', { timeout: 5000 });
    console.log('✅ Waiting room page loaded successfully');
    
    // Verify no redirect back to registration occurred
    await page.waitForTimeout(2000); // Give it time for any potential redirects
    const stableUrl = page.url();
    expect(stableUrl).toContain('/session/waiting/KJAHA99L');
    console.log('✅ Confirmed user remains in waiting room (no redirect loop)');
  });
});