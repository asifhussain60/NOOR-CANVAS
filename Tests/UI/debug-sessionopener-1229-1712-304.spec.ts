/**
 * WORKITEM DEBUG TEST - RUN_ID: 1229-1712-304
 * Test the "Generate User Token" button functionality after SessionDuration fix
 * Mode: test | Log: trace | Commit: false
 */

import { expect, test } from '@playwright/test';

test('debug sessionopener generate user token - RUN_ID:1229-1712-304', async ({ page }) => {
    console.log('[RUN_ID:1229-1712-304] Starting sessionopener debug test');

    // Navigate to Host Session Opener
    const hostToken = 'PQ9N5YWW'; // Existing session from logs
    const sessionOpenerUrl = `https://localhost:9091/host/session-opener/${hostToken}`;

    console.log('[RUN_ID:1229-1712-304] Navigating to:', sessionOpenerUrl);
    await page.goto(sessionOpenerUrl);

    // Wait for page to load and validate
    await expect(page).toHaveTitle(/NoorCanvas/);

    // Wait for the form to load and select required fields
    console.log('[RUN_ID:1229-1712-304] Waiting for dropdowns to load...');

    // Wait for album dropdown to be populated
    await page.waitForSelector('select#albumSelect option:not([value=""])', { timeout: 10000 });
    console.log('[RUN_ID:1229-1712-304] Album dropdown loaded');

    // Select first available album
    await page.selectOption('select#albumSelect', { index: 1 });
    await page.waitForTimeout(1000); // Wait for categories to load

    // Select first available category  
    await page.waitForSelector('select#categorySelect option:not([value=""])', { timeout: 5000 });
    await page.selectOption('select#categorySelect', { index: 1 });
    await page.waitForTimeout(1000); // Wait for sessions to load

    // Select first available session
    await page.waitForSelector('select#sessionSelect option:not([value=""])', { timeout: 5000 });
    await page.selectOption('select#sessionSelect', { index: 1 });

    // Fill scheduling fields with valid data
    console.log('[RUN_ID:1229-1712-304] Filling scheduling fields...');
    await page.fill('input[type="date"]', '2025-09-28');
    await page.fill('input[type="time"]', '06:00');
    await page.fill('input[type="number"][placeholder*="minutes"]', '60');

    // Take screenshot before clicking button
    await page.screenshot({
        path: 'd:\\PROJECTS\\NOOR CANVAS\\test-results\\sessionopener-before-click-1229-1712-304.png'
    });

    // Monitor network requests to see the API call details
    let apiRequest = null;
    let apiResponse = null;

    page.on('request', request => {
        if (request.url().includes('/api/Host/session/create')) {
            console.log('[RUN_ID:1229-1712-304] API Request:', {
                url: request.url(),
                method: request.method(),
                postData: request.postData()
            });
            apiRequest = {
                url: request.url(),
                method: request.method(),
                postData: request.postData()
            };
        }
    });

    page.on('response', response => {
        if (response.url().includes('/api/Host/session/create')) {
            console.log('[RUN_ID:1229-1712-304] API Response:', {
                url: response.url(),
                status: response.status(),
                statusText: response.statusText()
            });
            apiResponse = {
                url: response.url(),
                status: response.status(),
                statusText: response.statusText()
            };
        }
    });

    // Find and click the Generate User Token button
    console.log('[RUN_ID:1229-1712-304] Looking for Generate User Token button...');
    const generateButton = page.locator('button').filter({ hasText: /Generate User Token/i });
    await expect(generateButton).toBeVisible();

    // Check if button is enabled
    const isEnabled = await generateButton.isEnabled();
    console.log('[RUN_ID:1229-1712-304] Button enabled:', isEnabled);

    if (!isEnabled) {
        // Button is disabled, check validation state
        console.log('[RUN_ID:1229-1712-304] Button is disabled - checking form validation...');

        // Take screenshot of disabled state
        await page.screenshot({
            path: 'd:\\PROJECTS\\NOOR CANVAS\\test-results\\sessionopener-button-disabled-1229-1712-304.png'
        });

        // Log form field values to see what's missing
        const albumValue = await page.locator('select#albumSelect').inputValue();
        const categoryValue = await page.locator('select#categorySelect').inputValue();
        const sessionValue = await page.locator('select#sessionSelect').inputValue();
        const dateValue = await page.locator('input[type="date"]').inputValue();
        const timeValue = await page.locator('input[type="time"]').inputValue();
        const durationValue = await page.locator('input[type="number"][placeholder*="minutes"]').inputValue();

        console.log('[RUN_ID:1229-1712-304] Form values:', {
            album: albumValue,
            category: categoryValue,
            session: sessionValue,
            date: dateValue,
            time: timeValue,
            duration: durationValue
        });

        // Check for validation errors
        const validationErrors = await page.locator('.validation-message, .field-validation-error').allTextContents();
        if (validationErrors.length > 0) {
            console.log('[RUN_ID:1229-1712-304] Validation errors found:', validationErrors);
        }
    }

    // Force click even if disabled to see what happens
    console.log('[RUN_ID:1229-1712-304] Clicking Generate User Token button...');
    await generateButton.click({ force: true });

    // Wait a bit for response
    await page.waitForTimeout(2000);

    // Take screenshot after click
    await page.screenshot({
        path: 'd:\\PROJECTS\\NOOR CANVAS\\test-results\\sessionopener-after-click-1229-1712-304.png'
    });

    // Check if we got redirected to session waiting page or if there's an error
    const currentUrl = page.url();
    console.log('[RUN_ID:1229-1712-304] Current URL after click:', currentUrl);

    if (currentUrl.includes('/session-waiting/')) {
        console.log('[RUN_ID:1229-1712-304] SUCCESS: Redirected to session waiting page');
    } else {
        console.log('[RUN_ID:1229-1712-304] Still on session opener page - checking for errors...');

        // Look for any error messages on the page
        const errorMessages = await page.locator('.alert-danger, .error-message, .validation-summary').allTextContents();
        if (errorMessages.length > 0) {
            console.log('[RUN_ID:1229-1712-304] Error messages found:', errorMessages);
        }
    }

    // Log the API request/response details
    if (apiRequest) {
        console.log('[RUN_ID:1229-1712-304] Final API Request Details:', apiRequest);
    }
    if (apiResponse) {
        console.log('[RUN_ID:1229-1712-304] Final API Response Details:', apiResponse);
    }

    console.log('[RUN_ID:1229-1712-304] Test completed');
});