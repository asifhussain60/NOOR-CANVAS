import { test, expect } from '@playwright/test';

const BASE_URL = process.env.APP_URL || 'https://localhost:9091';

test.describe('SessionCanvas Authentication Gate - Core Test', () => {
    
    test('SessionCanvas should block unregistered users', async ({ page }) => {
        const runId = Date.now().toString().slice(-6);
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Core test - SessionCanvas authentication gate`);
        
        // Use fresh context to ensure clean state
        await page.goto('about:blank');
        
        // Clear all storage to simulate unregistered user
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
            // Also clear any specific UserGuid keys that might exist
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('noor_user_guid_')) {
                    localStorage.removeItem(key);
                }
            }
        });
        
        // Clear cookies
        await page.context().clearCookies();
        
        // Attempt direct access to SessionCanvas with test token
        const testToken = 'BIK6E3E8';
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Attempting direct access to /session/canvas/${testToken}`);
        
        // Monitor console logs for authentication messages
        const consoleLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('userlanding:impl') || msg.text().includes('Authentication')) {
                consoleLogs.push(msg.text());
            }
        });
        
        // Navigate to SessionCanvas
        const response = await page.goto(`${BASE_URL}/session/canvas/${testToken}`, { 
            waitUntil: 'networkidle',
            timeout: 20000
        });
        
        // Wait for potential redirects
        await page.waitForTimeout(3000);
        
        const finalUrl = page.url();
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Final URL: ${finalUrl}`);
        console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Console logs: ${JSON.stringify(consoleLogs)}`);
        
        // Check if we're on UserLanding (proper redirect) or SessionCanvas (bug)
        if (finalUrl.includes('/user/landing/')) {
            console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] ✅ PASS: Authentication gate working - redirected to UserLanding ;CLEANUP_OK`);
            await expect(page.locator('h1')).toContainText('User Authentication');
        } else if (finalUrl.includes('/session/canvas/')) {
            console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] ❌ FAIL: Authentication gate bypassed - unregistered user on SessionCanvas`);
            
            // Look for specific elements that confirm we're on SessionCanvas
            const canvasElement = await page.locator('[data-testid="session-canvas"]').count();
            if (canvasElement > 0) {
                console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] CONFIRMED: SessionCanvas loaded for unregistered user - THIS IS THE BUG`);
                throw new Error('AUTHENTICATION BUG: Unregistered user can access SessionCanvas directly');
            }
        } else {
            console.log(`[DEBUG-WORKITEM:userlanding:impl:${runId}] Unexpected redirect to: ${finalUrl}`);
        }
    });
});