import { test, expect } from '@playwright/test';

const BASE_URL = process.env.APP_URL || 'https://localhost:9091';
const TEST_USER_TOKEN = 'BIK6E3E8'; // Test session with "Created" status

test.describe('UserLanding Authentication Gate Tests', () => {
    
    test('unregistered user accessing SessionCanvas should be redirected to UserLanding', async ({ page }) => {
        const runId = Date.now().toString().slice(-6);
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Testing unregistered user access to SessionCanvas`);
        
        // Clear any existing localStorage data to simulate fresh unregistered user
        await page.goto(BASE_URL);
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        
        // Clear cookies to ensure clean state
        await page.context().clearCookies();
        
        // Attempt to access SessionCanvas directly without registration
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Navigating to /session/canvas/${TEST_USER_TOKEN}`);
        
        // Navigate with longer timeout and wait for redirect
        await page.goto(`${BASE_URL}/session/canvas/${TEST_USER_TOKEN}`, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // Wait for any redirects to complete and check final URL
        await page.waitForTimeout(3000); // Give time for authentication check and redirect
        
        const currentUrl = page.url();
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Current URL after navigation: ${currentUrl}`);
        
        // Should be redirected to UserLanding for authentication
        if (currentUrl.includes('/user/landing/')) {
            console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Successfully redirected to UserLanding for authentication ;CLEANUP_OK`);
            
            // Verify UserLanding page elements are present
            await expect(page.locator('h1')).toContainText('User Authentication');
            await expect(page.getByTestId('session-name')).toBeVisible();
        } else {
            console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] ISSUE DETECTED: User NOT redirected to UserLanding. Current URL: ${currentUrl}`);
            throw new Error(`Authentication gate failed - unregistered user accessed SessionCanvas directly. URL: ${currentUrl}`);
        }
    });
    
    test('registered user with Created session should route to SessionWaiting', async ({ page }) => {
        const runId = Date.now().toString().slice(-6);
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Testing registered user with Created session status`);
        
        // First, register the user
        await page.goto(`${BASE_URL}/user/landing/${TEST_USER_TOKEN}`);
        await page.waitForSelector('h1:has-text("User Authentication")', { timeout: 10000 });
        
        // Fill registration form
        await page.fill('[data-testid="name-input"]', 'Test User');
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.selectOption('[data-testid="country-select"]', 'US');
        
        // Submit registration - this should route to SessionWaiting for "Created" status
        await page.click('[data-testid="register-button"]');
        
        // Should be redirected to SessionWaiting
        await page.waitForURL(`**/session/waiting/${TEST_USER_TOKEN}`, { timeout: 15000 });
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Registration completed, routed to SessionWaiting ;CLEANUP_OK`);
        
        // Now test direct access to SessionCanvas - should redirect to SessionWaiting since session is "Created"
        await page.goto(`${BASE_URL}/session/canvas/${TEST_USER_TOKEN}`, { waitUntil: 'networkidle' });
        await page.waitForURL(`**/session/waiting/${TEST_USER_TOKEN}`, { timeout: 10000 });
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Direct SessionCanvas access properly redirected to SessionWaiting ;CLEANUP_OK`);
        
        // Verify SessionWaiting page elements
        await expect(page.locator('h1')).toContainText('Waiting Room');
    });
    
    test('registered user with Active session should access SessionCanvas', async ({ page }) => {
        const runId = Date.now().toString().slice(-6);
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Testing registered user with Active session status`);
        
        // First, create an Active session for testing
        // Update the test session to Active status in database
        await page.goto(BASE_URL);
        await page.evaluate(async () => {
            const response = await fetch('/api/test/update-session-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: 'BIK6E3E8', status: 'Active' })
            });
        });
        
        // Register the user first
        await page.goto(`${BASE_URL}/user/landing/${TEST_USER_TOKEN}`);
        await page.waitForSelector('h1:has-text("User Authentication")', { timeout: 10000 });
        
        // Fill registration form
        await page.fill('[data-testid="name-input"]', 'Test User Active');
        await page.fill('[data-testid="email-input"]', 'testactive@example.com');
        await page.selectOption('[data-testid="country-select"]', 'US');
        
        // Submit registration - should route to SessionCanvas for "Active" status
        await page.click('[data-testid="register-button"]');
        
        // Should be redirected to SessionCanvas
        await page.waitForURL(`**/session/canvas/${TEST_USER_TOKEN}`, { timeout: 15000 });
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Registration completed, routed to SessionCanvas for Active session ;CLEANUP_OK`);
        
        // Verify SessionCanvas page elements
        await expect(page.getByTestId('session-canvas')).toBeVisible();
        
        // Test direct access should still work
        await page.goto(`${BASE_URL}/session/canvas/${TEST_USER_TOKEN}`, { waitUntil: 'networkidle' });
        await expect(page.getByTestId('session-canvas')).toBeVisible();
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Direct SessionCanvas access allowed for registered user with Active session ;CLEANUP_OK`);
    });
});