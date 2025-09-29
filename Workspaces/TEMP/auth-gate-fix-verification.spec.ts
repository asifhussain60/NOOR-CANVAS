import { test, expect } from '@playwright/test';

const BASE_URL = process.env.APP_URL || 'https://localhost:9091';

test.describe('SessionCanvas Authentication Fix Verification', () => {
    
    test('Unregistered user should be blocked from SessionCanvas', async ({ page }) => {
        const runId = Date.now().toString().slice(-6);
        
        // Use completely fresh context
        await page.goto('about:blank');
        
        // Completely clear all browser storage
        await page.evaluate(() => {
            // Clear localStorage
            localStorage.clear();
            
            // Clear sessionStorage  
            sessionStorage.clear();
            
            // Clear any cookies
            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
        });
        
        // Clear context cookies
        await page.context().clearCookies();
        
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Testing authentication gate with completely clean state`);
        
        // Attempt to access SessionCanvas directly
        const testToken = 'BIK6E3E8';
        
        // Navigate and capture any redirect
        const response = await page.goto(`${BASE_URL}/session/canvas/${testToken}`, {
            waitUntil: 'load',
            timeout: 30000
        });
        
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Initial response status: ${response?.status()}`);
        
        // Wait for JavaScript execution and potential redirects
        await page.waitForTimeout(5000);
        
        const currentUrl = page.url();
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Final URL: ${currentUrl}`);
        
        // Check if we ended up on UserLanding (correct) or SessionCanvas (bug)
        if (currentUrl.includes('/user/landing/')) {
            console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] ✅ SUCCESS: Authentication gate working - redirected to UserLanding`);
            
            // Verify we're actually on the authentication page
            await expect(page.locator('h1')).toContainText('User Authentication', { timeout: 10000 });
            
        } else if (currentUrl.includes('/session/canvas/')) {
            // This would be the bug - unregistered user on canvas
            const pageTitle = await page.title();
            const hasCanvas = await page.locator('[data-testid="session-canvas"]').count() > 0;
            
            console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] ❌ BUG DETECTED: Unregistered user on SessionCanvas`);
            console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Page title: ${pageTitle}, Has canvas element: ${hasCanvas}`);
            
            // Fail the test
            throw new Error(`Authentication gate failed: Unregistered user accessed SessionCanvas directly (URL: ${currentUrl})`);
            
        } else {
            console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Unexpected redirect to: ${currentUrl}`);
            const pageContent = await page.locator('body').textContent();
            console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Page content preview: ${pageContent?.substring(0, 200)}...`);
        }
    });
});