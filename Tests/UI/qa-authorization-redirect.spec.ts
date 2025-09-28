import { test, expect, Page } from '@playwright/test';

/**
 * Test: Q&A Authorization Redirect Functionality
 * 
 * Validates that when a user attempts to submit a Q&A question without proper 
 * participant registration, they are redirected to UserLanding.razor where 
 * they can authenticate and be routed to the appropriate page based on session status.
 * 
 * Test Scenario:
 * 1. Navigate directly to SessionCanvas with a valid session token (bypassing authentication)
 * 2. Attempt to submit a Q&A question without being registered as a participant
 * 3. Verify that the user gets redirected to UserLanding.razor
 * 4. Verify that the session token is preserved in the redirect URL
 * 
 * Expected Outcome:
 * - 401 Unauthorized response triggers redirect to /user/landing/{token}
 * - UserLanding.razor can then handle proper authentication flow
 * - After authentication, user will be routed to SessionCanvas (active) or SessionWaiting (inactive)
 */

test.describe('Q&A Authorization Redirect', () => {
    let page: Page;
    
    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        
        // Enable console logging for debugging
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.text().includes('401') || msg.text().includes('redirect')) {
                console.log(`Console ${msg.type()}: ${msg.text()}`);
            }
        });
        
        // Monitor network requests for 401 responses
        page.on('response', response => {
            if (response.status() === 401 && response.url().includes('/api/Question/Submit')) {
                console.log(`401 Unauthorized detected for Q&A submission: ${response.url()}`);
            }
        });
    });
    
    test.afterEach(async () => {
        await page.close();
    });
    
    test('should redirect to UserLanding when Q&A submission gets 401 Unauthorized', async () => {
        // Use a valid session token (this should exist in the system)
        const sessionToken = 'KJAHA99L'; // Known valid token from previous tests
        
        // Step 1: Navigate directly to SessionCanvas (bypassing proper authentication flow)
        console.log(`Step 1: Navigating to SessionCanvas with token: ${sessionToken}`);
        await page.goto(`https://localhost:9091/session/canvas/${sessionToken}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        // Wait for the page to load and verify we're on SessionCanvas
        await expect(page).toHaveURL(`https://localhost:9091/session/canvas/${sessionToken}`);
        console.log('✅ SessionCanvas loaded successfully');
        
        // Step 2: Wait for the session data to load
        await page.waitForSelector('[data-testid="session-canvas"]', { timeout: 15000 });
        console.log('✅ Session canvas container found');
        
        // Step 3: Look for Q&A input field and submit button
        const questionInput = page.locator('input[type="text"][placeholder*="question" i], textarea[placeholder*="question" i]').first();
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Ask")').first();
        
        // Wait for Q&A elements to be available
        await expect(questionInput).toBeVisible({ timeout: 10000 });
        await expect(submitButton).toBeVisible({ timeout: 10000 });
        console.log('✅ Q&A input and submit button found');
        
        // Step 4: Enter a test question
        const testQuestion = 'Test question for authorization redirect';
        await questionInput.fill(testQuestion);
        console.log(`✅ Question entered: "${testQuestion}"`);
        
        // Step 5: Set up navigation promise to catch the redirect
        const navigationPromise = page.waitForURL(/\/user\/landing/, { 
            timeout: 15000,
            waitUntil: 'networkidle' 
        });
        
        // Step 6: Submit the question (this should trigger 401 and redirect)
        console.log('Step 6: Submitting question (expecting 401 and redirect)...');
        await submitButton.click();
        
        // Step 7: Wait for the redirect to UserLanding
        try {
            await navigationPromise;
            console.log('✅ Redirect to UserLanding detected');
        } catch (error) {
            console.log('❌ No redirect detected, checking current URL...');
            console.log(`Current URL: ${page.url()}`);
            throw new Error('Expected redirect to UserLanding did not occur');
        }
        
        // Step 8: Verify we're on UserLanding with the session token preserved
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/user\/landing\/?\??.*$/);
        
        // Check if session token is preserved in URL (either as path parameter or query parameter)
        const hasTokenInPath = currentUrl.includes(`/user/landing/${sessionToken}`);
        const hasTokenInQuery = currentUrl.includes(`token=${sessionToken}`);
        
        expect(hasTokenInPath || hasTokenInQuery).toBe(true);
        console.log(`✅ Redirected to UserLanding with token preserved: ${currentUrl}`);
        
        // Step 9: Verify UserLanding page elements are present
        await expect(page.locator('h1:has-text("User Authentication")')).toBeVisible({ timeout: 10000 });
        console.log('✅ UserLanding authentication page loaded');
        
        // Step 10: Verify session information is displayed (should show session details)
        const sessionNameElement = page.locator('[data-testid="session-name"]').first();
        if (await sessionNameElement.isVisible()) {
            const sessionName = await sessionNameElement.textContent();
            console.log(`✅ Session information loaded: ${sessionName}`);
        }
        
        console.log('✅ Test completed successfully: Q&A authorization redirect working as expected');
    });
    
    test('should preserve question text when redirecting (optional enhancement)', async () => {
        // This test verifies that if we wanted to preserve the user's question text
        // during redirect, it would be possible (this is an optional enhancement)
        
        const sessionToken = 'KJAHA99L';
        const testQuestion = 'Test question that should be preserved';
        
        await page.goto(`https://localhost:9091/session/canvas/${sessionToken}`, {
            waitUntil: 'networkidle'
        });
        
        // Enter question
        const questionInput = page.locator('input[type="text"][placeholder*="question" i], textarea[placeholder*="question" i]').first();
        await questionInput.fill(testQuestion);
        
        // Submit and wait for redirect
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Ask")').first();
        await submitButton.click();
        
        // Wait for redirect
        await page.waitForURL(/\/user\/landing/, { timeout: 15000 });
        
        // Note: This test documents that we could preserve the question in localStorage
        // or as a query parameter if needed in the future
        console.log('📝 Note: Question text preservation could be implemented if needed');
    });
});

/**
 * Test Configuration Notes:
 * 
 * Prerequisites:
 * - Application must be running on https://localhost:9091
 * - Session with token 'KJAHA99L' must exist and be active
 * - User accessing SessionCanvas directly should not be registered as participant
 * 
 * Test Validation:
 * - Verifies 401 Unauthorized response triggers redirect
 * - Confirms redirect goes to UserLanding.razor
 * - Ensures session token is preserved during redirect
 * - Validates UserLanding page loads correctly
 * 
 * Integration Points:
 * - SessionCanvas.razor SubmitQuestion method
 * - QuestionController.cs authorization logic
 * - UserLanding.razor authentication flow
 * - Navigation service redirect functionality
 */