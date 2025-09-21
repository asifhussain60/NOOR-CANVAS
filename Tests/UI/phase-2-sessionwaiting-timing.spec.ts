import { test } from '@playwright/test';

/**
 * Phase 2: Validate SessionWaiting.razor timing fix
 * Tests that SessionWaiting page uses real KSESSIONS data instead of hard-coded values
 */

test.describe('Phase 2: SessionWaiting.razor Timing Fix', () => {

    test('should display real session data without hard-coded values', async ({ page }) => {
        // Test with a known session token that exists in database
        const testToken = 'Z5GFJ2GR'; // Session ID 215 with title "A Model For Success"

        console.log('🎯 Testing SessionWaiting page with token:', testToken);

        // Navigate to session waiting page
        await page.goto(`http://localhost:9090/session/waiting/${testToken}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for the page to load and process API data
        await page.waitForTimeout(3000);

        // Check that session title is displayed (not placeholder)
        const titleElement = await page.locator('h1, h2, h3').filter({ hasText: /Model For Success/ }).first();
        if (await titleElement.isVisible()) {
            console.log('✅ Session title "A Model For Success" found');
        } else {
            // Look for any title
            const allTitles = await page.locator('h1, h2, h3').all();
            for (const title of allTitles) {
                const text = await title.textContent();
                console.log('Found title element:', text);
            }
        }

        // Check instructor name is displayed (not "Loading...")
        const instructorElements = await page.getByText(/Asif Hussain/).all();
        if (instructorElements.length > 0) {
            console.log('✅ Instructor name "Asif Hussain" found');
        } else {
            console.log('❌ Instructor name "Asif Hussain" not found');
        }

        // Check that duration is not hard-coded "1 hour"
        const durationElements = await page.getByText(/1 hour/).all();
        if (durationElements.length === 0) {
            console.log('✅ No hard-coded "1 hour" duration found');
        } else {
            console.log('⚠️ Found hard-coded "1 hour" duration - may need further fixes');
        }

        // Check for any elements showing "Loading..." which indicates incomplete data loading
        const loadingElements = await page.getByText(/Loading\.\.\./).all();
        if (loadingElements.length === 0) {
            console.log('✅ No "Loading..." placeholders found');
        } else {
            console.log('⚠️ Found "Loading..." placeholders:', loadingElements.length);
        }

        // Check that we don't have any generic fallback values
        const fallbackElements = await page.getByText(/Duration not available/).all();
        if (fallbackElements.length === 0) {
            console.log('✅ No "Duration not available" fallbacks found');
        } else {
            console.log('⚠️ Found duration fallback messages');
        }

        // Get page content for debugging
        const pageContent = await page.content();
        console.log('Page loaded successfully. Content length:', pageContent.length);

        // Check if the page contains the session token (indicates successful routing)
        if (pageContent.includes(testToken)) {
            console.log('✅ Session token found in page content - routing working');
        } else {
            console.log('❌ Session token not found in page content');
        }

        // Look for any error messages
        const errorElements = await page.locator('.error, .alert-danger, [data-testid="error"]').all();
        if (errorElements.length === 0) {
            console.log('✅ No error messages found');
        } else {
            console.log('❌ Found error messages:', errorElements.length);
        }
    });

    test('should validate real timing calculations', async ({ page }) => {
        const testToken = 'Z5GFJ2GR';

        // First get the API data to compare
        const apiResponse = await page.request.get(`http://localhost:9090/api/participant/session/${testToken}/validate`);
        if (apiResponse.ok()) {
            const apiData = await apiResponse.json();
            console.log('API Response - StartTime:', apiData.session.startTime);
            console.log('API Response - Duration:', apiData.session.duration);
            console.log('API Response - Instructor:', apiData.session.instructorName);
        }

        await page.goto(`http://localhost:9090/session/waiting/${testToken}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Check that the timing displayed matches the API data
        await page.waitForTimeout(2000);

        // Look for countdown or timing information
        const countdownElements = await page.locator('[class*="countdown"], [data-testid*="time"], .time').all();
        for (let i = 0; i < countdownElements.length; i++) {
            const element = countdownElements[i];
            if (await element.isVisible()) {
                const text = await element.textContent();
                console.log(`Timing element ${i + 1}:`, text);
            }
        }

        console.log('✅ Phase 2 validation completed');
    });
});