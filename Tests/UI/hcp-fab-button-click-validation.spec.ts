/**
 * Test: FAB Button Click Validation (hcp-fab-button)
 * Issue: Clicking .asset-header-fab-button does nothing
 * Goal: Capture console logs, validate JavaScript event handler execution, check SignalR ShareAsset call
 * 
 * Test Flow:
 * 1. Navigate to HostControlPanel with active session
 * 2. Wait for FAB button to appear in transcript (.asset-header-fab-button)
 * 3. Attach console listener for JavaScript debug messages
 * 4. Click FAB button, capture Percy snapshots before/after
 * 5. Validate console shows "FABBUTTON CLICKED" or error messages
 * 6. Check network traffic for ShareAsset SignalR invocation
 * 
 * Expected Console Messages:
 * - "[DEBUG-WORKITEM:assetshare] FABBUTTON CLICKED: {shareId}"
 * - "[DEBUG-WORKITEM:assetshare] Invoking ShareAsset via DotNet"
 * - If missing: Event handler not bound or click event not propagating
 * 
 * Percy Snapshots:
 * - fab-button-idle: Initial state with FAB button visible
 * - fab-button-clicked: State immediately after click
 * - fab-button-error: If JavaScript errors occur
 */

import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

test.describe('FAB Button Click Validation (hcp-fab-button)', () => {
    const APP_URL = 'https://localhost:9091';
    const HOST_TOKEN = 'PQ9N5YWW'; // Active host token for session with transcript data

    // Console message patterns to track
    const EXPECTED_MESSAGES = {
        fabClicked: /FABBUTTON CLICKED/i,
        shareAssetInvoke: /Invoking ShareAsset via DotNet/i,
        handlerSetup: /setupShareButtonHandlers|Share button handlers attached/i,
        jsError: /Error|TypeError|undefined|null/i
    };

    let consoleLogs: Array<{ type: string; text: string; timestamp: number }> = [];
    let jsErrors: Array<{ message: string; timestamp: number }> = [];

    test.beforeEach(async ({ page }) => {
        // Reset log collectors
        consoleLogs = [];
        jsErrors = [];

        // Capture all console messages
        page.on('console', msg => {
            const logEntry = {
                type: msg.type(),
                text: msg.text(),
                timestamp: Date.now()
            };
            consoleLogs.push(logEntry);

            // Log to test output for debugging
            console.log(`[BROWSER-${msg.type().toUpperCase()}] ${msg.text()}`);
        });

        // Capture JavaScript errors
        page.on('pageerror', error => {
            const errorEntry = {
                message: error.message,
                timestamp: Date.now()
            };
            jsErrors.push(errorEntry);
            console.error(`[JS-ERROR] ${error.message}`);
        });
    });

    test('should detect FAB button click handler execution', async ({ page }) => {
        console.log('\n=== Starting FAB Button Click Validation ===\n');

        // Navigate to HostControlPanel
        await page.goto(`${APP_URL}/host/control-panel/${HOST_TOKEN}`);

        // Wait for page load
        await page.waitForLoadState('networkidle');
        console.log('✓ Page loaded');

        // Wait for HostControlPanel component
        await expect(page.locator('[data-component="host-control-panel"]')).toBeVisible({ timeout: 30000 });
        console.log('✓ HostControlPanel component visible');

        // Percy snapshot: Initial state
        await percySnapshot(page, 'fab-button-idle', {
            widths: [375, 768, 1280],
            minHeight: 1024
        });

        // Wait for transcript container
        const transcriptContainer = page.locator('#divCanvasTranscript, .transcript-container');
        await expect(transcriptContainer).toBeVisible({ timeout: 10000 });
        console.log('✓ Transcript container visible');

        // Look for FAB button with multiple selectors (in case class name varies)
        const fabButtonSelectors = [
            '.asset-header-fab-button',
            '[data-fab-button="true"]',
            'button.ks-share-button',
            'button:has-text("Share Asset")'
        ];

        let fabButton = null;
        let usedSelector = '';

        for (const selector of fabButtonSelectors) {
            const btn = page.locator(selector).first();
            if (await btn.count() > 0) {
                fabButton = btn;
                usedSelector = selector;
                console.log(`✓ FAB button found using selector: ${selector}`);
                break;
            }
        }

        if (!fabButton) {
            console.error('✗ FAB button not found with any selector');
            console.log('Available console logs:', consoleLogs.map(l => l.text));

            // Percy snapshot: No button found
            await percySnapshot(page, 'fab-button-not-found', {
                widths: [1280],
                minHeight: 1024
            });

            throw new Error('FAB button not found in transcript');
        }

        // Check if button is visible and enabled
        await expect(fabButton).toBeVisible({ timeout: 5000 });
        const isEnabled = await fabButton.isEnabled();
        console.log(`✓ FAB button visible and ${isEnabled ? 'enabled' : 'disabled'}`);

        // Get button details for debugging
        const buttonHTML = await fabButton.evaluate(el => el.outerHTML);
        console.log('Button HTML:', buttonHTML);

        // Check for handler setup logs before click
        const preClickHandlerLogs = consoleLogs.filter(log =>
            EXPECTED_MESSAGES.handlerSetup.test(log.text)
        );
        console.log(`Handler setup logs before click: ${preClickHandlerLogs.length}`);
        if (preClickHandlerLogs.length > 0) {
            console.log('Setup logs:', preClickHandlerLogs.map(l => l.text));
        }

        // Clear previous logs to isolate click event
        const clickStartTime = Date.now();

        // Click the FAB button
        console.log(`\n>>> Clicking FAB button (${usedSelector}) <<<\n`);
        await fabButton.click();

        // Wait for potential SignalR response or UI update
        await page.waitForTimeout(3000);

        // Percy snapshot: After click
        await percySnapshot(page, 'fab-button-clicked', {
            widths: [375, 768, 1280],
            minHeight: 1024
        });

        // Filter logs after click
        const postClickLogs = consoleLogs.filter(log => log.timestamp >= clickStartTime);

        console.log(`\n=== Console Logs After Click (${postClickLogs.length} messages) ===`);
        postClickLogs.forEach(log => {
            console.log(`[${log.type}] ${log.text}`);
        });

        // Check for expected messages
        const fabClickedLogs = postClickLogs.filter(log =>
            EXPECTED_MESSAGES.fabClicked.test(log.text)
        );

        const shareAssetInvokeLogs = postClickLogs.filter(log =>
            EXPECTED_MESSAGES.shareAssetInvoke.test(log.text)
        );

        const errorLogs = postClickLogs.filter(log =>
            log.type === 'error' || EXPECTED_MESSAGES.jsError.test(log.text)
        );

        console.log('\n=== Validation Results ===');
        console.log(`FAB clicked logs: ${fabClickedLogs.length}`);
        console.log(`ShareAsset invoke logs: ${shareAssetInvokeLogs.length}`);
        console.log(`Error logs: ${errorLogs.length}`);
        console.log(`JavaScript errors: ${jsErrors.length}`);

        if (fabClickedLogs.length > 0) {
            console.log('✓ FAB button click handler executed');
            console.log('  Messages:', fabClickedLogs.map(l => l.text));
        } else {
            console.error('✗ FAB button click handler DID NOT execute');
        }

        if (shareAssetInvokeLogs.length > 0) {
            console.log('✓ ShareAsset SignalR invocation detected');
            console.log('  Messages:', shareAssetInvokeLogs.map(l => l.text));
        } else {
            console.error('✗ ShareAsset SignalR invocation NOT detected');
        }

        if (errorLogs.length > 0) {
            console.error('✗ JavaScript errors detected:');
            errorLogs.forEach(log => console.error(`  ${log.text}`));

            // Percy snapshot: Error state
            await percySnapshot(page, 'fab-button-error', {
                widths: [1280],
                minHeight: 1024
            });
        }

        if (jsErrors.length > 0) {
            console.error('✗ Page errors detected:');
            jsErrors.forEach(err => console.error(`  ${err.message}`));
        }

        // Write detailed logs to file for analysis
        const logReport = {
            testName: 'FAB Button Click Validation',
            timestamp: new Date().toISOString(),
            hostToken: HOST_TOKEN,
            fabButtonSelector: usedSelector,
            fabButtonHTML: buttonHTML,
            preClickHandlerSetup: preClickHandlerLogs.map(l => l.text),
            postClickLogs: postClickLogs.map(l => ({ type: l.type, text: l.text })),
            validation: {
                fabClickedDetected: fabClickedLogs.length > 0,
                shareAssetInvokeDetected: shareAssetInvokeLogs.length > 0,
                errorsDetected: errorLogs.length > 0,
                jsErrorsDetected: jsErrors.length > 0
            },
            expectedMessages: {
                fabClicked: fabClickedLogs.map(l => l.text),
                shareAssetInvoke: shareAssetInvokeLogs.map(l => l.text),
                errors: errorLogs.map(l => l.text),
                jsErrors: jsErrors.map(e => e.message)
            }
        };

        console.log('\n=== Test Report (JSON) ===');
        console.log(JSON.stringify(logReport, null, 2));

        // Assertions for test results
        // These will fail if click handler not working - that's expected for diagnosis
        expect(fabClickedLogs.length, 'FAB button click handler should execute').toBeGreaterThan(0);
        expect(shareAssetInvokeLogs.length, 'ShareAsset SignalR invocation should occur').toBeGreaterThan(0);
        expect(errorLogs.length, 'No JavaScript errors should occur').toBe(0);
        expect(jsErrors.length, 'No page errors should occur').toBe(0);
    });

    test('should validate OnAfterRenderAsync execution conditions', async ({ page }) => {
        console.log('\n=== Validating OnAfterRenderAsync Conditions ===\n');

        await page.goto(`${APP_URL}/host/control-panel/${HOST_TOKEN}`);
        await page.waitForLoadState('networkidle');

        // Wait for component
        await expect(page.locator('[data-component="host-control-panel"]')).toBeVisible({ timeout: 30000 });

        // Wait extended period to capture all render lifecycle logs
        await page.waitForTimeout(10000);

        // Filter logs related to OnAfterRenderAsync execution
        const renderLogs = consoleLogs.filter(log =>
            log.text.includes('OnAfterRenderAsync') ||
            log.text.includes('firstRender') ||
            log.text.includes('SessionId') ||
            log.text.includes('setupShareButtonHandlers') ||
            log.text.includes('IsConnected')
        );

        console.log(`\n=== OnAfterRenderAsync Logs (${renderLogs.length} messages) ===`);
        renderLogs.forEach(log => {
            console.log(`[${log.type}] ${log.text}`);
        });

        // Check if setupShareButtonHandlers was ever called
        const handlerSetupLogs = renderLogs.filter(log =>
            log.text.includes('setupShareButtonHandlers') ||
            log.text.includes('Share button handlers attached')
        );

        console.log(`\nHandler setup logs: ${handlerSetupLogs.length}`);
        if (handlerSetupLogs.length === 0) {
            console.error('✗ setupShareButtonHandlers was NEVER called');
            console.error('  Likely cause: OnAfterRenderAsync conditions not met');
            console.error('  Check: firstRender flag, SessionId.HasValue, IsConnected');
        } else {
            console.log('✓ setupShareButtonHandlers was called');
            handlerSetupLogs.forEach(log => console.log(`  ${log.text}`));
        }

        // This assertion documents expected behavior
        // May fail if conditions prevent handler setup
        expect(handlerSetupLogs.length,
            'setupShareButtonHandlers should be called in OnAfterRenderAsync'
        ).toBeGreaterThan(0);
    });
});
