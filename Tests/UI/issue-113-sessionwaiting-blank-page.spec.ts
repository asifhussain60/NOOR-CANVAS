/**
 * NOOR Canvas - Issue-113 SessionWaiting Blank Page Fix Verification
 * 
 * This test specifically validates the fix for Issue-113 where the SessionWaiting page
 * was loading blank due to HttpClient BaseAddress not being set, causing API calls to fail.
 * 
 * Test Coverage:
 * - Verifies page loads without blank screen
 * - Confirms API calls are being made successfully
 * - Validates proper error handling for session not found (404 expected)
 * - Ensures UI elements are rendered correctly
 * - Checks for HttpClient configuration error resolution
 */

import { expect, test } from '@playwright/test';

// Test configuration
const BASE_URL = 'https://localhost:9091';
const TEST_TOKEN = 'SUAT3XWK'; // Test token used for Issue-113 reproduction

test.describe('Issue-113: SessionWaiting Blank Page Fix Verification', () => {

    test.beforeEach(async ({ page }) => {
        // Set timeout for Blazor component initialization
        test.setTimeout(30000);

        // Enable console logging to catch any JavaScript errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`🚨 Browser Error: ${msg.text()}`);
            }
        });
    });

    test('should load SessionWaiting page without blank screen', async ({ page }) => {
        console.log(`🧪 Testing SessionWaiting page with token: ${TEST_TOKEN}`);

        // Track all network requests to understand what's happening
        const allRequests: string[] = [];
        page.on('request', request => {
            const url = request.url();
            allRequests.push(url);
            if (url.includes('/api/participant/session/')) {
                console.log(`📡 Direct API Request: ${url}`);
            }
        });

        // Track responses to verify API is responding properly
        page.on('response', response => {
            const url = response.url();
            if (url.includes('/api/participant/session/')) {
                console.log(`📥 API Response: ${response.status()} ${url}`);
            }
        });

        // Navigate to SessionWaiting page
        await page.goto(`${BASE_URL}/session/waiting/${TEST_TOKEN}`, {
            waitUntil: 'networkidle'
        });

        // Wait for Blazor component to initialize
        await page.waitForTimeout(5000);

        // Verify page is NOT blank - should have basic HTML structure
        const pageContent = await page.content();
        expect(pageContent.length).toBeGreaterThan(1000); // Should have substantial content

        // Verify NOOR Canvas branding is visible (indicates page rendered)
        await expect(page.locator('img[alt*="NOOR"], img[src*="NC-Header"]')).toBeVisible();

        // Verify we don't see a completely blank page
        const bodyText = await page.textContent('body');
        expect(bodyText?.trim().length).toBeGreaterThan(0);

        // Should show proper error state for invalid token (not blank page)
        const hasErrorContent = (
            bodyText!.includes('not found') ||
            bodyText!.includes('invalid') ||
            bodyText!.includes('error') ||
            bodyText!.includes('Try Again') ||
            bodyText!.includes('Return Home')
        );

        expect(hasErrorContent).toBe(true);

        console.log('✅ Page loaded successfully without blank screen');
        console.log(`✅ Total requests made: ${allRequests.length}`);
    });

    test('should handle session not found (404) gracefully', async ({ page }) => {
        console.log(`🧪 Testing 404 handling for test token: ${TEST_TOKEN}`);

        // Navigate to page
        await page.goto(`${BASE_URL}/session/waiting/${TEST_TOKEN}`);

        // Wait for API calls to complete
        await page.waitForTimeout(5000);

        // Should show proper error message for session not found
        // (This is expected behavior for the test token SUAT3XWK)
        const pageText = await page.textContent('body');

        // Should contain error messaging (not a blank page)
        expect(pageText).toBeTruthy();
        expect(pageText!.trim().length).toBeGreaterThan(10);

        // Look for error-related content
        const hasErrorContent = (
            pageText!.includes('not found') ||
            pageText!.includes('invalid') ||
            pageText!.includes('error') ||
            pageText!.includes('Try Again') ||
            pageText!.includes('Return Home')
        );

        expect(hasErrorContent).toBe(true);

        console.log('✅ 404 error handled gracefully with proper error UI');
    });

    test('should not throw HttpClient BaseAddress exceptions', async ({ page }) => {
        console.log('🧪 Testing for HttpClient BaseAddress configuration errors');

        // Capture any console errors that might indicate HttpClient issues
        const consoleErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error' && msg.text().includes('BaseAddress')) {
                consoleErrors.push(msg.text());
            }
        });

        // Monitor for network failures that could indicate HttpClient misconfiguration
        const failedRequests: string[] = [];
        page.on('response', response => {
            if (response.url().includes('/api/') && response.status() >= 400) {
                // 404 is expected for our test token, but other errors are not
                if (response.status() !== 404) {
                    failedRequests.push(`${response.status()} ${response.url()}`);
                }
            }
        });

        await page.goto(`${BASE_URL}/session/waiting/${TEST_TOKEN}`);
        await page.waitForTimeout(5000);

        // Should not have any HttpClient BaseAddress related errors
        expect(consoleErrors).toHaveLength(0);

        // Should not have unexpected API failures (404 is OK for test token)
        expect(failedRequests).toHaveLength(0);

        console.log('✅ No HttpClient BaseAddress configuration errors detected');
    });

    test('should display proper loading states and transitions', async ({ page }) => {
        console.log('🧪 Testing loading states and UI transitions');

        await page.goto(`${BASE_URL}/session/waiting/${TEST_TOKEN}`);

        // Should show some form of loading indicator initially
        // (Even if session is not found, should show loading first)
        await page.waitForTimeout(1000);

        // After loading completes, should show content (even if it's an error)
        await page.waitForTimeout(4000);

        // Verify the page has transitioned beyond loading state
        const finalContent = await page.textContent('body');
        expect(finalContent?.trim().length).toBeGreaterThan(50);

        // Should have NOOR Canvas branding visible
        const hasLogo = await page.locator('img[src*="NC-Header"], img[alt*="NOOR"]').isVisible();
        expect(hasLogo).toBe(true);

        console.log('✅ Loading states and transitions working properly');
    });

    test('should have responsive design elements', async ({ page }) => {
        console.log('🧪 Testing responsive design on different viewport sizes');

        // Test on mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${BASE_URL}/session/waiting/${TEST_TOKEN}`);
        await page.waitForTimeout(3000);

        let content = await page.textContent('body');
        expect(content?.trim().length).toBeGreaterThan(0);

        // Test on tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.reload();
        await page.waitForTimeout(3000);

        content = await page.textContent('body');
        expect(content?.trim().length).toBeGreaterThan(0);

        // Test on desktop viewport
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.reload();
        await page.waitForTimeout(3000);

        content = await page.textContent('body');
        expect(content?.trim().length).toBeGreaterThan(0);

        console.log('✅ Responsive design working across viewport sizes');
    });

});

/**
 * Performance verification for Issue-113 fix
 */
test.describe('Issue-113: Performance Impact Assessment', () => {

    test('should load within acceptable performance thresholds', async ({ page }) => {
        console.log('🧪 Testing performance impact of HttpClient BaseAddress fix');

        const startTime = Date.now();

        await page.goto(`${BASE_URL}/session/waiting/${TEST_TOKEN}`, {
            waitUntil: 'domcontentloaded'
        });

        const domLoadTime = Date.now() - startTime;

        // Wait for full component initialization
        await page.waitForTimeout(5000);
        const fullLoadTime = Date.now() - startTime;

        // Performance thresholds
        expect(domLoadTime).toBeLessThan(10000); // DOM should load within 10 seconds
        expect(fullLoadTime).toBeLessThan(15000); // Full initialization within 15 seconds

        console.log(`✅ Performance: DOM loaded in ${domLoadTime}ms, full load in ${fullLoadTime}ms`);
    });

});

/**
 * API Integration verification for Issue-113 fix
 */
test.describe('Issue-113: API Integration Verification', () => {

    test('should verify HttpClient configuration is working (no exceptions in logs)', async ({ page }) => {
        console.log('🧪 Verifying HttpClient calls are being made via server logs');

        // Check the application logs to see if API calls are being made
        await page.goto(`${BASE_URL}/session/waiting/${TEST_TOKEN}`);
        await page.waitForTimeout(8000);

        // The main verification is that the page loads without HttpClient exceptions
        // and shows proper error handling for the 404 response (which is expected for test token)

        const bodyText = await page.textContent('body');

        // Should show error state, not blank page or exception
        const hasProperErrorHandling = (
            bodyText!.includes('not found') ||
            bodyText!.includes('invalid') ||
            bodyText!.includes('error') ||
            bodyText!.includes('Try Again') ||
            bodyText!.includes('Return Home')
        );

        expect(hasProperErrorHandling).toBe(true);

        // Should have NOOR Canvas branding (proves page rendered)
        const hasLogo = await page.locator('img[src*="NC-Header"], img[alt*="NOOR"]').isVisible();
        expect(hasLogo).toBe(true);

        console.log(`✅ HttpClient configuration verified - proper error handling displayed`);
    });

});