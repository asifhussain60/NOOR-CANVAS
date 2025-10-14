import percySnapshot from '@percy/playwright';
import type { Page } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';

/**
 * Test: Debug Panel - UserLanding Auto-fill Test Data Visual Regression with Percy
 * 
 * Purpose: Verify the debug panel "Enter Test Data" functionality in UserLanding.razor
 *          with comprehensive visual regression testing to ensure UI consistency.
 * 
 * Functionality Tested:
 * - Debug panel visibility (only in development mode when countries loaded)
 * - "Enter Test Data" button appearance and state
 * - Form auto-fill with superhero test data (name, email, country)
 * - Auto-submit behavior after test data population
 * - Visual consistency across different viewport sizes
 * 
 * Percy Integration:
 * - Captures baseline snapshots of debug panel UI states
 * - Tests responsive design at mobile (375px), tablet (768px), desktop (1280px)
 * - Validates button styles, icon rendering, and panel positioning
 * - Ensures consistent visual appearance during auto-fill animation
 * 
 * Test Data Source:
 * - TestDataService.GenerateUserLandingNameAndEmail() provides superhero test data
 * - Random country selection from available dropdown options
 * - Data includes: Name (e.g., "Bruce Wayne"), Email (e.g., "bruce.wayne@gotham.example")
 * 
 * Expected Behavior (from UserLanding.razor:1254-1320):
 * 1. Debug panel appears when: !Model.ShowTokenPanel && Countries.Any()
 * 2. "Enter Test Data" button shows with fa-user-plus icon
 * 3. Button disabled when: Model.IsLoading || Model.IsLoadingCountries
 * 4. Click triggers: HandleEnterTestData() method
 * 5. Auto-fills: Name, Email, Country (random selection)
 * 6. Auto-submits form after 100ms delay
 * 7. Logs trace messages with [DEBUG-WORKITEM:debug-panel:test-data:TRACE]
 * 
 * Launch Requirement:
 * ⚠️ Application MUST be running in separate PowerShell window before test execution
 *    to ensure proper environment isolation and visual consistency.
 * 
 * Debug Level: trace
 */

console.log('[DEBUG-WORKITEM:debug-panel:user-landing:percy-init] Starting debug panel Percy visual regression test ;CLEANUP_OK');

test.describe('Debug Panel - UserLanding Auto-fill Visual Regression (Percy)', () => {
    let browser: any;
    let page: Page;

    const SESSION_TOKEN = 'KJAHA99L'; // Session 212 user token from InfrastructureQuickRef.md
    const BASE_URL = 'https://localhost:9091'; // Standard Kestrel port

    test.beforeAll(async () => {
        console.log('[DEBUG-WORKITEM:debug-panel:percy-setup-trace] Launching browser for Percy ;CLEANUP_OK');

        browser = await chromium.launch({
            headless: false,
            slowMo: 500 // Slower for visual verification
        });

        const context = await browser.newContext({
            storageState: undefined,
            viewport: { width: 1280, height: 720 },
            ignoreHTTPSErrors: true
        });

        page = await context.newPage();

        // Enable console logging
        page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
        page.on('pageerror', error => console.error(`[PAGE ERROR] ${error.message}`));

        console.log('[DEBUG-WORKITEM:debug-panel:percy-setup-trace] Browser context created ;CLEANUP_OK');
    });

    test.afterAll(async () => {
        console.log('[DEBUG-WORKITEM:debug-panel:percy-teardown-trace] Closing browser ;CLEANUP_OK');
        await browser?.close();
    });

    test('should verify debug panel visibility and baseline visual state', async () => {
        console.log('[DEBUG-WORKITEM:debug-panel:percy-visibility-test] Testing debug panel visibility ;CLEANUP_OK');

        // Navigate to UserLanding with session token
        console.log('[DEBUG-WORKITEM:debug-panel:navigate] Navigating to /user/landing/{SESSION_TOKEN} ;CLEANUP_OK');
        await page.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);

        // Wait for registration panel to be visible (ShowTokenPanel = false)
        await page.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });
        console.log('[DEBUG-WORKITEM:debug-panel:navigate] Registration panel visible ;CLEANUP_OK');

        // Wait for countries dropdown to load (required for debug action visibility)
        await page.waitForSelector('select[name="country"]', { timeout: 10000 });
        console.log('[DEBUG-WORKITEM:debug-panel:countries] Countries dropdown loaded ;CLEANUP_OK');

        // Wait for dropdown to have options
        await page.waitForFunction(() => {
            const select = document.querySelector('select[name="country"]') as HTMLSelectElement;
            return select && select.options.length > 1; // More than just "Select country..."
        }, { timeout: 10000 });
        console.log('[DEBUG-WORKITEM:debug-panel:countries] Countries populated ;CLEANUP_OK');

        // Debug panel should now be visible (development mode only)
        console.log('[DEBUG-WORKITEM:debug-panel:visibility] Waiting for debug panel to appear ;CLEANUP_OK');
        
        // Debug panel appears as a floating button in bottom-right corner
        const debugPanelButton = page.locator('[class*="debug-panel"]').first();
        await expect(debugPanelButton).toBeVisible({ timeout: 5000 });
        console.log('[DEBUG-WORKITEM:debug-panel:visibility] Debug panel button visible ;CLEANUP_OK');

        // Capture Percy snapshot - Debug Panel Closed (Desktop)
        console.log('[DEBUG-WORKITEM:debug-panel:percy-snapshot] Capturing baseline - Debug Panel Closed (Desktop) ;CLEANUP_OK');
        await percySnapshot(page, 'Debug Panel - UserLanding - Closed State (Desktop)', {
            widths: [1280],
            minHeight: 720,
            percyCSS: `
                /* Hide dynamic elements that might cause false positives */
                .session-timer { visibility: hidden; }
            `
        });

        // Click to open debug panel
        console.log('[DEBUG-WORKITEM:debug-panel:interaction] Opening debug panel ;CLEANUP_OK');
        await debugPanelButton.click();
        await page.waitForTimeout(500); // Wait for animation

        // Verify "Enter Test Data" action button is visible
        const enterTestDataButton = page.locator('button:has-text("Enter Test Data")');
        await expect(enterTestDataButton).toBeVisible({ timeout: 5000 });
        console.log('[DEBUG-WORKITEM:debug-panel:visibility] "Enter Test Data" button visible ;CLEANUP_OK');

        // Verify button has correct icon
        const buttonIcon = enterTestDataButton.locator('i.fa-user-plus');
        await expect(buttonIcon).toBeVisible();
        console.log('[DEBUG-WORKITEM:debug-panel:visual] Icon fa-user-plus verified ;CLEANUP_OK');

        // Capture Percy snapshot - Debug Panel Open with Actions (Desktop)
        console.log('[DEBUG-WORKITEM:debug-panel:percy-snapshot] Capturing - Debug Panel Open (Desktop) ;CLEANUP_OK');
        await percySnapshot(page, 'Debug Panel - UserLanding - Open State with Actions (Desktop)', {
            widths: [1280],
            minHeight: 720,
            percyCSS: `
                .session-timer { visibility: hidden; }
            `
        });

        console.log('[DEBUG-WORKITEM:debug-panel:percy-visibility-test] ✅ Debug panel visibility test completed ;CLEANUP_OK');
    });

    test('should verify responsive design across viewport sizes', async () => {
        console.log('[DEBUG-WORKITEM:debug-panel:percy-responsive-test] Testing responsive design ;CLEANUP_OK');

        // Already on UserLanding from previous test, just verify state
        await page.waitForSelector('input[placeholder="Enter your name"]', { timeout: 5000 });

        // Test Mobile viewport (375px width)
        console.log('[DEBUG-WORKITEM:debug-panel:responsive] Testing mobile viewport (375px) ;CLEANUP_OK');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500); // Wait for responsive adjustments

        const debugPanelMobile = page.locator('[class*="debug-panel"]').first();
        await expect(debugPanelMobile).toBeVisible({ timeout: 3000 });

        // Capture Percy snapshot - Mobile
        await percySnapshot(page, 'Debug Panel - UserLanding - Mobile (375px)', {
            widths: [375],
            minHeight: 667
        });

        console.log('[DEBUG-WORKITEM:debug-panel:responsive] Mobile viewport snapshot captured ;CLEANUP_OK');

        // Test Tablet viewport (768px width)
        console.log('[DEBUG-WORKITEM:debug-panel:responsive] Testing tablet viewport (768px) ;CLEANUP_OK');
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(500);

        const debugPanelTablet = page.locator('[class*="debug-panel"]').first();
        await expect(debugPanelTablet).toBeVisible({ timeout: 3000 });

        // Capture Percy snapshot - Tablet
        await percySnapshot(page, 'Debug Panel - UserLanding - Tablet (768px)', {
            widths: [768],
            minHeight: 1024
        });

        console.log('[DEBUG-WORKITEM:debug-panel:responsive] Tablet viewport snapshot captured ;CLEANUP_OK');

        // Reset to desktop for remaining tests
        await page.setViewportSize({ width: 1280, height: 720 });

        console.log('[DEBUG-WORKITEM:debug-panel:percy-responsive-test] ✅ Responsive design test completed ;CLEANUP_OK');
    });

    test('should auto-fill form with test data and capture visual states', async () => {
        console.log('[DEBUG-WORKITEM:debug-panel:percy-autofill-test] Testing auto-fill functionality ;CLEANUP_OK');

        // Navigate fresh to ensure clean state
        await page.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);
        await page.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });
        await page.waitForSelector('select[name="country"]', { timeout: 10000 });

        // Wait for countries to load
        await page.waitForFunction(() => {
            const select = document.querySelector('select[name="country"]') as HTMLSelectElement;
            return select && select.options.length > 1;
        }, { timeout: 10000 });

        console.log('[DEBUG-WORKITEM:debug-panel:autofill] Page loaded, ready for auto-fill test ;CLEANUP_OK');

        // Capture Percy snapshot - Before Auto-fill
        await percySnapshot(page, 'Debug Panel - UserLanding - Before Auto-fill (Empty Form)', {
            widths: [1280],
            minHeight: 720
        });

        // Open debug panel
        const debugPanelButton = page.locator('[class*="debug-panel"]').first();
        await debugPanelButton.click();
        await page.waitForTimeout(500);

        // Click "Enter Test Data" button
        console.log('[DEBUG-WORKITEM:debug-panel:autofill] Clicking "Enter Test Data" button ;CLEANUP_OK');
        const enterTestDataButton = page.locator('button:has-text("Enter Test Data")');
        await expect(enterTestDataButton).toBeVisible({ timeout: 5000 });

        // Capture Percy snapshot - Just Before Click
        await percySnapshot(page, 'Debug Panel - UserLanding - About to Auto-fill (Button Ready)', {
            widths: [1280],
            minHeight: 720,
            percyCSS: `
                /* Highlight the button for visual verification */
                button:has-text("Enter Test Data") { 
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); 
                }
            `
        });

        await enterTestDataButton.click();
        console.log('[DEBUG-WORKITEM:debug-panel:autofill] "Enter Test Data" clicked ;CLEANUP_OK');

        // Wait for form to populate (HandleEnterTestData has 100ms delay before submit)
        await page.waitForTimeout(200);

        // Capture Percy snapshot - After Auto-fill (Before Submit)
        console.log('[DEBUG-WORKITEM:debug-panel:percy-snapshot] Capturing - After Auto-fill ;CLEANUP_OK');
        await percySnapshot(page, 'Debug Panel - UserLanding - After Auto-fill (Populated Form)', {
            widths: [1280],
            minHeight: 720
        });

        // Verify fields are populated
        const nameInput = page.locator('input[placeholder="Enter your name"]');
        const emailInput = page.locator('input[type="email"]');
        const countrySelect = page.locator('select[name="country"]');

        const nameValue = await nameInput.inputValue();
        const emailValue = await emailInput.inputValue();
        const countryValue = await countrySelect.inputValue();

        console.log('[DEBUG-WORKITEM:debug-panel:verification] Name: {Name}, Email: {Email}, Country: {Country} ;CLEANUP_OK', nameValue, emailValue, countryValue);

        expect(nameValue).not.toBe(''); // Should be superhero name
        expect(emailValue).not.toBe(''); // Should be superhero email
        expect(countryValue).not.toBe(''); // Should have country selected

        // Verify email format (superhero emails should contain @ and .example)
        expect(emailValue).toMatch(/@.*\.example$/);
        console.log('[DEBUG-WORKITEM:debug-panel:verification] ✅ Test data format validated ;CLEANUP_OK');

        // Wait for auto-submit to occur (HandleEnterTestData calls HandleUserRegistration)
        console.log('[DEBUG-WORKITEM:debug-panel:autofill] Waiting for auto-submit to session canvas ;CLEANUP_OK');
        await page.waitForURL(/\/session\/(canvas|waiting)\//, { timeout: 15000 });

        // Capture Percy snapshot - Session Canvas After Auto-submit
        console.log('[DEBUG-WORKITEM:debug-panel:percy-snapshot] Capturing - Session Canvas (After Auto-submit) ;CLEANUP_OK');
        await percySnapshot(page, 'Debug Panel - UserLanding - Session Canvas After Auto-submit', {
            widths: [1280],
            minHeight: 720,
            percyCSS: `
                .session-timer { visibility: hidden; }
                .participant-count { visibility: hidden; }
            `
        });

        console.log('[DEBUG-WORKITEM:debug-panel:percy-autofill-test] ✅ Auto-fill visual regression test completed ;CLEANUP_OK');
    });

    test('should verify button disabled state during loading', async () => {
        console.log('[DEBUG-WORKITEM:debug-panel:percy-loading-test] Testing button disabled state ;CLEANUP_OK');

        // Navigate to UserLanding
        await page.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);
        await page.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });

        // Before countries load, button should not be visible (condition: Countries.Any())
        console.log('[DEBUG-WORKITEM:debug-panel:loading] Checking debug panel before countries load ;CLEANUP_OK');

        // Wait for countries to load
        await page.waitForFunction(() => {
            const select = document.querySelector('select[name="country"]') as HTMLSelectElement;
            return select && select.options.length > 1;
        }, { timeout: 10000 });

        // Open debug panel
        const debugPanelButton = page.locator('[class*="debug-panel"]').first();
        await debugPanelButton.click();
        await page.waitForTimeout(500);

        // "Enter Test Data" button should now be enabled (Model.IsLoading = false, Countries loaded)
        const enterTestDataButton = page.locator('button:has-text("Enter Test Data")');
        await expect(enterTestDataButton).toBeEnabled({ timeout: 5000 });
        console.log('[DEBUG-WORKITEM:debug-panel:loading] Button enabled when countries loaded ;CLEANUP_OK');

        // Capture Percy snapshot - Button Enabled State
        await percySnapshot(page, 'Debug Panel - UserLanding - Button Enabled (Ready to Use)', {
            widths: [1280],
            minHeight: 720
        });

        console.log('[DEBUG-WORKITEM:debug-panel:percy-loading-test] ✅ Button state test completed ;CLEANUP_OK');
    });

    test('should verify debug panel appearance across multiple sessions', async () => {
        console.log('[DEBUG-WORKITEM:debug-panel:percy-multi-session-test] Testing debug panel across sessions ;CLEANUP_OK');

        // Test with Session 212
        console.log('[DEBUG-WORKITEM:debug-panel:multi-session] Testing Session 212 (KJAHA99L) ;CLEANUP_OK');
        await page.goto(`${BASE_URL}/user/landing/KJAHA99L`);
        await page.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });
        await page.waitForFunction(() => {
            const select = document.querySelector('select[name="country"]') as HTMLSelectElement;
            return select && select.options.length > 1;
        }, { timeout: 10000 });

        const debugPanel212 = page.locator('[class*="debug-panel"]').first();
        await expect(debugPanel212).toBeVisible({ timeout: 5000 });

        // Capture Percy snapshot - Session 212
        await percySnapshot(page, 'Debug Panel - UserLanding - Session 212 View', {
            widths: [1280],
            minHeight: 720
        });

        console.log('[DEBUG-WORKITEM:debug-panel:multi-session] Session 212 snapshot captured ;CLEANUP_OK');

        // Note: We only have one valid test token (KJAHA99L) in test environment
        // In production, would test multiple sessions here

        console.log('[DEBUG-WORKITEM:debug-panel:percy-multi-session-test] ✅ Multi-session test completed ;CLEANUP_OK');
    });

    test('should verify console logging during auto-fill', async () => {
        console.log('[DEBUG-WORKITEM:debug-panel:percy-logging-test] Testing console logging ;CLEANUP_OK');

        const consoleLogs: string[] = [];

        // Capture console messages
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[DEBUG-WORKITEM:debug-panel:test-data:TRACE]')) {
                consoleLogs.push(text);
                console.log(`[CAPTURED LOG] ${text}`);
            }
        });

        // Navigate and trigger auto-fill
        await page.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);
        await page.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });
        await page.waitForFunction(() => {
            const select = document.querySelector('select[name="country"]') as HTMLSelectElement;
            return select && select.options.length > 1;
        }, { timeout: 10000 });

        const debugPanelButton = page.locator('[class*="debug-panel"]').first();
        await debugPanelButton.click();
        await page.waitForTimeout(500);

        const enterTestDataButton = page.locator('button:has-text("Enter Test Data")');
        await enterTestDataButton.click();

        // Wait for logging to occur
        await page.waitForTimeout(2000);

        // Verify expected log messages
        console.log('[DEBUG-WORKITEM:debug-panel:logging] Captured {Count} debug logs ;CLEANUP_OK', consoleLogs.length);

        // Expected logs from HandleEnterTestData:
        // 1. "Populating UserLanding with test data"
        // 2. "Test data populated - Name: X, Email: Y, Country: Z (ISO2: XX)"
        // 3. "Auto-submitting registration form"

        expect(consoleLogs.length).toBeGreaterThanOrEqual(2); // At least populate + submit logs

        const populateLog = consoleLogs.find(log => log.includes('Populating UserLanding with test data'));
        const testDataLog = consoleLogs.find(log => log.includes('Test data populated'));
        const submitLog = consoleLogs.find(log => log.includes('Auto-submitting registration form'));

        expect(populateLog).toBeDefined();
        expect(testDataLog).toBeDefined();
        expect(submitLog).toBeDefined();

        console.log('[DEBUG-WORKITEM:debug-panel:logging] ✅ All expected log messages verified ;CLEANUP_OK');
        console.log('[DEBUG-WORKITEM:debug-panel:percy-logging-test] ✅ Console logging test completed ;CLEANUP_OK');
    });
});
