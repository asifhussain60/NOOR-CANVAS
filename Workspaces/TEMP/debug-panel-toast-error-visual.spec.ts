import percySnapshot from '@percy/playwright';
import type { Page } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';

/**
 * Test: Debug Panel Toast Notification Error - Visual Regression Test
 * 
 * Purpose: Reproduce and fix the NotificationOptions.closeButton error
 *          that occurs when toastr.js is replaced with Notyf library.
 * 
 * Error Being Reproduced:
 * "Microsoft.JSInterop.JSException: Object of type 'NotificationOptions' 
 *  does not have a property named 'closeButton'"
 * 
 * Root Cause Analysis:
 * - Toastr.js was replaced with Notyf library (key: toastr)
 * - Old toastr.js used NotificationOptions with closeButton, progressBar, etc.
 * - New Notyf library uses different configuration (dismissible, not closeButton)
 * - C# code still passing old toastr.js options object to JavaScript
 * - Blazor JSInterop throws error when trying to serialize unknown property
 * 
 * Expected Fix:
 * 1. Locate C# code passing NotificationOptions with closeButton
 * 2. Update to use simple string parameters (message, title, type)
 * 3. Let noor-notyf-wrapper.js handle configuration internally
 * 4. Remove all NotificationOptions class definitions
 * 
 * Test Scenarios:
 * 1. Navigate to UserLanding with debug panel
 * 2. Click "Enter Test Data" button (triggers toast)
 * 3. Capture browser console errors
 * 4. Verify toast displays without JSInterop errors
 * 5. Percy snapshots before/after fix
 * 
 * Debug Level: trace
 * Created: 2025-10-14
 */

console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Starting toast error reproduction test ;CLEANUP_OK');

test.describe('Debug Panel - Toast NotificationOptions Error (Visual Regression)', () => {
    let browser: any;
    let page: Page;
    let consoleMessages: string[] = [];
    let consoleErrors: string[] = [];
    let pageErrors: string[] = [];

    const SESSION_TOKEN = 'KJAHA99L'; // Session 212 from InfrastructureQuickRef.md
    const BASE_URL = 'https://localhost:9091';

    test.beforeAll(async () => {
        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Launching browser ;CLEANUP_OK');

        browser = await chromium.launch({
            headless: false, // Show browser to see the error visually
            slowMo: 500
        });

        const context = await browser.newContext({
            storageState: undefined,
            viewport: { width: 1280, height: 720 },
            ignoreHTTPSErrors: true
        });

        page = await context.newPage();

        // Capture all console messages
        page.on('console', msg => {
            const text = msg.text();
            consoleMessages.push(text);
            console.log(`[BROWSER-CONSOLE] ${text}`);
        });

        // Capture all console errors (critical for detecting JSInterop errors)
        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                consoleErrors.push(text);
                console.error(`[BROWSER-ERROR] ${text}`);
            }
        });

        // Capture page errors (unhandled exceptions)
        page.on('pageerror', error => {
            const message = error.message;
            pageErrors.push(message);
            console.error(`[PAGE-ERROR] ${message}`);
        });

        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Browser context created with error tracking ;CLEANUP_OK');
    });

    test.afterAll(async () => {
        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Closing browser ;CLEANUP_OK');
        await browser?.close();
    });

    test('REPRODUCE: should capture NotificationOptions.closeButton error', async () => {
        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Starting error reproduction ;CLEANUP_OK');

        // Clear error arrays
        consoleMessages = [];
        consoleErrors = [];
        pageErrors = [];

        // Navigate to UserLanding
        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Navigating to /user/landing/{SESSION_TOKEN} ;CLEANUP_OK');
        await page.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);

        // Wait for page to load completely
        await page.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });
        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Registration form loaded ;CLEANUP_OK');

        // Wait for countries dropdown
        await page.waitForSelector('select[name="country"]', { timeout: 10000 });
        await page.waitForFunction(() => {
            const select = document.querySelector('select[name="country"]') as HTMLSelectElement;
            return select && select.options.length > 1;
        }, { timeout: 10000 });
        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Countries dropdown populated ;CLEANUP_OK');

        // Percy snapshot BEFORE clicking debug button
        await percySnapshot(page, 'Debug Panel - Before Test Data Click (Baseline)', {
            widths: [1280]
        });

        // Wait for debug panel to appear
        const debugButton = await page.waitForSelector('.debug-panel-fab', { timeout: 10000 });
        expect(debugButton).toBeTruthy();
        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Debug panel button found ;CLEANUP_OK');

        // Click to expand debug panel
        await debugButton.click();
        await page.waitForTimeout(500);

        // Find "Enter Test Data" button
        const testDataButton = await page.waitForSelector('button:has-text("Enter Test Data")', { timeout: 5000 });
        expect(testDataButton).toBeTruthy();
        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Test Data button found ;CLEANUP_OK');

        // Percy snapshot with debug panel expanded
        await percySnapshot(page, 'Debug Panel - Expanded Before Click', {
            widths: [1280]
        });

        // Clear error arrays before the critical action
        consoleErrors = [];
        pageErrors = [];

        // Click "Enter Test Data" button (this should trigger the toast error)
        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Clicking Enter Test Data button ;CLEANUP_OK');
        await testDataButton.click();

        // Wait for auto-fill to complete
        await page.waitForTimeout(2000);

        // Percy snapshot AFTER clicking (should show error or toast)
        await percySnapshot(page, 'Debug Panel - After Test Data Click (Error State)', {
            widths: [1280]
        });

        // Analyze captured errors
        console.log('\n========================================');
        console.log('ERROR ANALYSIS REPORT');
        console.log('========================================');
        console.log(`Total Console Messages: ${consoleMessages.length}`);
        console.log(`Total Console Errors: ${consoleErrors.length}`);
        console.log(`Total Page Errors: ${pageErrors.length}`);
        console.log('========================================\n');

        // Check for the specific NotificationOptions error
        const notificationOptionsError = consoleErrors.find(err =>
            err.includes('NotificationOptions') && err.includes('closeButton')
        ) || pageErrors.find(err =>
            err.includes('NotificationOptions') && err.includes('closeButton')
        );

        if (notificationOptionsError) {
            console.log('✅ ERROR SUCCESSFULLY REPRODUCED:');
            console.log(notificationOptionsError);
            console.log('\n[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] NotificationOptions.closeButton error captured ;CLEANUP_OK');
        } else {
            console.log('❌ Expected error NOT found. Checking all errors:');
            console.log('\nConsole Errors:');
            consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
            console.log('\nPage Errors:');
            pageErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
        }

        // Check for JSInterop errors (broader check)
        const jsInteropError = consoleErrors.find(err =>
            err.includes('Microsoft.JSInterop.JSException')
        ) || pageErrors.find(err =>
            err.includes('Microsoft.JSInterop.JSException')
        );

        if (jsInteropError) {
            console.log('\n✅ JSInterop ERROR DETECTED:');
            console.log(jsInteropError);
        }

        // Check for DEVMODE logs (from the screenshot)
        const devModeLogs = consoleMessages.filter(msg =>
            msg.includes('[DEVMODE]')
        );

        if (devModeLogs.length > 0) {
            console.log('\n📋 DEVMODE LOGS CAPTURED:');
            devModeLogs.forEach(log => console.log(`  ${log}`));
        }

        // Print last 20 console messages for context
        console.log('\n📜 RECENT CONSOLE OUTPUT (last 20):');
        const recentMessages = consoleMessages.slice(-20);
        recentMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));

        console.log('\n[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Error reproduction test complete ;CLEANUP_OK');
    });

    test('should verify Notyf library is loaded correctly', async () => {
        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Checking Notyf library status ;CLEANUP_OK');

        await page.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);
        await page.waitForTimeout(2000);

        // Check if Notyf is loaded
        const notyfLoaded = await page.evaluate(() => {
            return typeof window.Notyf !== 'undefined';
        });

        console.log(`[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Notyf library loaded: ${notyfLoaded} ;CLEANUP_OK`);
        expect(notyfLoaded).toBe(true);

        // Check if NoorToast wrapper exists
        const noorToastExists = await page.evaluate(() => {
            return typeof window.NoorToast !== 'undefined';
        });

        console.log(`[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] NoorToast wrapper exists: ${noorToastExists} ;CLEANUP_OK`);
        expect(noorToastExists).toBe(true);

        // Check if backward compatibility wrapper exists
        const showNoorToastExists = await page.evaluate(() => {
            return typeof window.showNoorToast === 'function';
        });

        console.log(`[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] showNoorToast function exists: ${showNoorToastExists} ;CLEANUP_OK`);
        expect(showNoorToastExists).toBe(true);

        // Get NoorToast state
        const toastState = await page.evaluate(() => {
            return (window as any).NoorToast.getState();
        });

        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] NoorToast State:');
        console.log(JSON.stringify(toastState, null, 2));
        console.log(';CLEANUP_OK');

        // Percy snapshot of properly loaded state
        await percySnapshot(page, 'Debug Panel - Notyf Library Loaded Correctly', {
            widths: [1280]
        });
    });

    test('should test toast display without JSInterop errors (after fix)', async () => {
        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Testing toast display post-fix ;CLEANUP_OK');

        // Clear error tracking
        consoleErrors = [];
        pageErrors = [];

        await page.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);
        await page.waitForTimeout(2000);

        // Manually trigger a toast from console (bypassing C# JSInterop)
        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Triggering test toast manually ;CLEANUP_OK');

        await page.evaluate(() => {
            (window as any).showNoorToast('Test message from Playwright', 'Debug Panel Test', 'success');
        });

        await page.waitForTimeout(1000);

        // Percy snapshot with toast visible
        await percySnapshot(page, 'Debug Panel - Manual Toast Success (No JSInterop)', {
            widths: [1280]
        });

        // Check for errors
        const hasErrors = consoleErrors.length > 0 || pageErrors.length > 0;

        if (hasErrors) {
            console.log('❌ ERRORS DETECTED DURING MANUAL TOAST:');
            consoleErrors.forEach(err => console.log(`  - ${err}`));
            pageErrors.forEach(err => console.log(`  - ${err}`));
        } else {
            console.log('✅ Manual toast displayed without errors ;CLEANUP_OK');
        }

        // Verify toast appeared in DOM
        const toastExists = await page.locator('.notyf__toast').count() > 0;
        console.log(`[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Toast visible in DOM: ${toastExists} ;CLEANUP_OK`);

        expect(hasErrors).toBe(false);
    });

    test('should identify C# code passing old toastr options', async () => {
        console.log('[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Analyzing for old toastr option usage ;CLEANUP_OK');

        // This test documents what to look for in C# code
        const expectedIssues = [
            '1. C# classes with NotificationOptions containing closeButton property',
            '2. JSInterop calls passing complex objects instead of simple strings',
            '3. Configuration objects with toastr.js-specific properties (progressBar, timeOut, extendedTimeOut)',
            '4. Code not using the simple API: showNoorToast(message, title, type)'
        ];

        console.log('\n📋 EXPECTED C# CODE ISSUES TO FIX:');
        expectedIssues.forEach(issue => console.log(`  ${issue}`));

        console.log('\n💡 RECOMMENDED FIX:');
        console.log('  1. Remove all NotificationOptions class definitions');
        console.log('  2. Update JSInterop calls to:');
        console.log('     await JSRuntime.InvokeVoidAsync("showNoorToast", message, title, type);');
        console.log('  3. Let noor-notyf-wrapper.js handle all configuration');
        console.log('  4. Remove closeButton, progressBar, timeOut from C# code');
        console.log(';CLEANUP_OK');
    });
});
