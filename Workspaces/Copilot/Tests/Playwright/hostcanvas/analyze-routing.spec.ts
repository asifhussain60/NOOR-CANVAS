/**
 * [DEBUG-WORKITEM:hostcanvas:test] Simple test to understand current routing behavior
 * Tests the actual routing logic by examining where users go when they register
 * ;CLEANUP_OK
 */

import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:9090';

test.describe('User Routing Analysis - hostcanvas', () => {
    test.beforeEach(async ({ page }) => {
        // Enable detailed console logging
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warning') {
                console.log(`[${msg.type().toUpperCase()}]`, msg.text());
            }
        });
    });

    test('Analyze current user registration routing behavior', async ({ page }) => {
        // [DEBUG-WORKITEM:hostcanvas:test] Test with actual UI elements and inputs ;CLEANUP_OK

        console.log('[DEBUG-WORKITEM:hostcanvas:test] Starting user routing analysis ;CLEANUP_OK');

        // Step 1: Go to user landing page
        await page.goto(`${BASE_URL}/user`);
        await expect(page.locator('h1')).toContainText('User Authentication');

        // Step 2: Enter a test token (using a typical format)
        const testToken = 'TESTUSER'; // 8-character token
        await page.fill('#token-input', testToken);
        await page.click('button:has-text("Submit")');

        // Wait for token validation response (could succeed or fail)
        await page.waitForTimeout(3000);

        // Check current URL and log it
        const currentUrl = page.url();
        console.log(`[DEBUG-WORKITEM:hostcanvas:test] Current URL after token entry: ${currentUrl} ;CLEANUP_OK`);

        // Check if we're still on user landing page or have been redirected
        if (currentUrl.includes('/user')) {
            console.log('[DEBUG-WORKITEM:hostcanvas:test] Still on user landing page - token validation may have failed ;CLEANUP_OK');

            // Check if registration form is visible (successful token validation)
            const nameInputVisible = await page.locator('#name-input').isVisible();
            console.log(`[DEBUG-WORKITEM:hostcanvas:test] Registration form visible: ${nameInputVisible} ;CLEANUP_OK`);

            if (nameInputVisible) {
                // Fill registration form
                await page.fill('#name-input', 'Test User');
                await page.fill('#email-input', 'test@example.com');

                // Check if country dropdown is available
                const countrySelect = page.locator('select:has(option:text("United States"))');
                const countryExists = await countrySelect.count() > 0;
                console.log(`[DEBUG-WORKITEM:hostcanvas:test] Country dropdown exists: ${countryExists} ;CLEANUP_OK`);

                if (countryExists) {
                    await countrySelect.selectOption({ label: 'United States' });

                    // Submit registration
                    await page.click('button:has-text("Submit")');

                    // Wait for navigation
                    await page.waitForTimeout(5000);

                    const finalUrl = page.url();
                    console.log(`[DEBUG-WORKITEM:hostcanvas:test] Final URL after registration: ${finalUrl} ;CLEANUP_OK`);

                    // Analyze where we ended up
                    if (finalUrl.includes('/session/canvas/')) {
                        console.log('[DEBUG-WORKITEM:hostcanvas:test] ISSUE CONFIRMED: User routed to SessionCanvas directly ;CLEANUP_OK');
                    } else if (finalUrl.includes('/session/waiting/')) {
                        console.log('[DEBUG-WORKITEM:hostcanvas:test] CORRECT: User routed to SessionWaiting ;CLEANUP_OK');
                    } else {
                        console.log(`[DEBUG-WORKITEM:hostcanvas:test] UNEXPECTED: User routed to: ${finalUrl} ;CLEANUP_OK`);
                    }
                }
            }
        } else {
            console.log(`[DEBUG-WORKITEM:hostcanvas:test] Redirected immediately to: ${currentUrl} ;CLEANUP_OK`);
        }
    });
});