import { test, expect } from '@playwright/test';

/**
 * [DEBUG-WORKITEM:assetshare:continue] Diagnostic test to identify the appendChild exception
 * This test will click a share button and capture the exact error details
 */
test.describe('Share Button Exception Diagnostics', () => {
    test('Click share button and capture appendChild exception details', async ({ page }) => {
        const trackingId = `exception-diagnostic-${Date.now()}`;
        console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] Starting share button exception analysis`);

        // Capture console errors
        const consoleErrors: string[] = [];
        const consoleMessages: string[] = [];
        
        page.on('console', msg => {
            const text = msg.text();
            if (msg.type() === 'error') {
                consoleErrors.push(text);
                console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] 🚨 CONSOLE ERROR: ${text}`);
            } else if (text.includes('DEBUG-WORKITEM:assetshare') || text.includes('ShareAsset') || text.includes('appendChild')) {
                consoleMessages.push(text);
                console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] 📋 RELEVANT LOG: ${text}`);
            }
        });

        // Capture page errors
        page.on('pageerror', error => {
            console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] 💥 PAGE ERROR: ${error.message}`);
            console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] 📍 ERROR STACK: ${error.stack}`);
        });

        // Navigate to session 212
        await page.goto('https://localhost:9091/host?sessionId=212');
        await expect(page.locator('.host-control-panel')).toBeVisible({ timeout: 15000 });
        
        console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] Host Control Panel loaded`);

        // Wait for processing to complete  
        await page.waitForTimeout(5000);

        // Check for share buttons
        const shareButtons = await page.locator('.ks-share-btn, .ks-share-button').count();
        console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] Share buttons found: ${shareButtons}`);

        if (shareButtons === 0) {
            console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] ⚠️ No share buttons found - checking for assets`);
            
            const ayahCards = await page.locator('.ayah-card').count();
            console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] Ayah cards found: ${ayahCards}`);
            
            // If no share buttons but assets exist, the injection failed
            if (ayahCards > 0) {
                console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] ❌ ISSUE IDENTIFIED: Assets present but no share buttons injected`);
            }
            
            // Exit early since there's nothing to click
            expect(true).toBe(true);
            return;
        }

        // Click the first share button to trigger the exception
        console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] 🖱️ Clicking first share button to trigger exception`);
        
        try {
            await page.click('.ks-share-btn:first-of-type, .ks-share-button:first-of-type', { timeout: 5000 });
            
            // Wait for any async operations to complete
            await page.waitForTimeout(3000);
            
            console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] ✅ Share button click completed without immediate exception`);
        } catch (error) {
            console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] 🚨 Click failed with error: ${error}`);
        }

        // Check for SignalR activity and DOM changes
        const signalRLogs = await page.evaluate(() => {
            // Look for any SignalR activity indicators in the DOM or console
            const elements = document.querySelectorAll('*');
            let signalRActivity = [];
            
            // Check for any elements that might have been modified by SignalR
            for (let elem of Array.from(elements).slice(0, 100)) { // Check first 100 elements
                if (elem.innerHTML && elem.innerHTML.includes('ShareAsset')) {
                    signalRActivity.push(`Element ${elem.tagName} contains ShareAsset reference`);
                }
            }
            
            return {
                totalElements: elements.length,
                signalRActivity: signalRActivity,
                documentReadyState: document.readyState
            };
        });

        console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] DOM Analysis:`, signalRLogs);

        // Final error analysis
        console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] === EXCEPTION DIAGNOSTIC SUMMARY ===`);
        console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] Console errors captured: ${consoleErrors.length}`);
        console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] Relevant messages: ${consoleMessages.length}`);
        
        if (consoleErrors.length > 0) {
            console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] 🚨 ERRORS DETECTED:`);
            consoleErrors.forEach((error, idx) => {
                console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}]   ${idx + 1}. ${error}`);
            });
        }

        if (consoleMessages.length > 0) {
            console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] 📋 ASSET SHARE LOGS:`);
            consoleMessages.forEach((msg, idx) => {
                console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}]   ${idx + 1}. ${msg}`);
            });
        }

        // Check if the appendChild error specifically occurred
        const hasAppendChildError = consoleErrors.some(error => 
            error.includes('appendChild') && error.includes('Unexpected end of input')
        );

        if (hasAppendChildError) {
            console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] 🎯 CONFIRMED: appendChild 'Unexpected end of input' error detected`);
            console.log(`[EXCEPTION-DIAGNOSTIC:${trackingId}] 💡 ANALYSIS: This suggests malformed HTML being processed by Blazor's DOM renderer`);
        }

        // Test passes regardless - we're just diagnosing
        expect(true).toBe(true);
    });
});