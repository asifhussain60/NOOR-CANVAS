/**
 * Phase 5: Session Ended Handling - Playwright Test
 * 
 * Verifies that registration guards check session status and redirect to SessionEnded page
 * when session status is "Ended" BEFORE checking participant registration.
 * 
 * Test Scenarios:
 * 1. SessionWaiting redirects to SessionEnded for ended session
 * 2. SessionCanvas redirects to SessionEnded for ended session
 * 3. TranscriptCanvas redirects to SessionEnded for ended session
 * 
 * IMPORTANT TESTING NOTES:
 * - Use URL patterns like '**/session / ended/**' (app redirects HTTP port 9090 to HTTPS port 9091)
 * - Server-side logs ([DEBUG-WORKITEM:userlanding:session-ended]) won't appear in browser console
 * - Verify functionality through redirect behavior, not log messages
 * - JavaScript errors unrelated to session status should be warnings, not failures
 * 
 * Test Data: Session 212 (Host: PQ9N5YWW, User: KJAHA99L)
 * Database Requirement: Session 212 must have Status='Ended' for test to pass
 */

import { expect, test } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:9090';
const USER_TOKEN = 'KJAHA99L';
const SESSION_ID = 212;

test.describe('Phase 5: Session Ended Redirect', () => {
    test.beforeEach(async ({ page }) => {
        // Monitor console logs for debugging
        page.on('console', msg => {
            const text = msg.text();
            // Only log relevant messages (client-side logs, not server logs)
            if (text.includes('NOOR-DEBUG-PANEL') || text.includes('sessionStorage')) {
                console.log(`[Browser Console] ${text}`);
            }
        });

        // Monitor JavaScript errors - warn but don't fail on unrelated errors
        page.on('pageerror', error => {
            console.warn(`[Browser Error] ${error.message}`);
        });
    });

    test('SessionWaiting redirects to SessionEnded for ended session', async ({ page }) => {
        console.log('\n=== Test 1: SessionWaiting Redirect for Ended Session ===');

        // Navigate to SessionWaiting with user token
        console.log(`Navigating to SessionWaiting: ${BASE_URL}/session/waiting/${USER_TOKEN}`);
        await page.goto(`${BASE_URL}/session/waiting/${USER_TOKEN}`);

        // Wait for redirect to SessionEnded page
        console.log('Waiting for redirect to SessionEnded page...');
        await page.waitForURL('**/session/ended/**', { timeout: 10000 });

        // Verify redirect occurred
        const currentUrl = page.url();
        console.log(`Current URL after redirect: ${currentUrl}`);

        // Check if URL contains /session/ended/
        expect(currentUrl).toMatch(/\/session\/ended\//);

        // Verify session ID in URL (should be /session/ended/212)
        expect(currentUrl).toContain(`/session/ended/${SESSION_ID}`);

        console.log('✓ SessionWaiting correctly redirected to SessionEnded page');
    });

    test('SessionCanvas redirects to SessionEnded for ended session', async ({ page }) => {
        console.log('\n=== Test 2: SessionCanvas Redirect for Ended Session ===');

        // Navigate to SessionCanvas with user token
        console.log(`Navigating to SessionCanvas: ${BASE_URL}/session/canvas/${USER_TOKEN}`);
        await page.goto(`${BASE_URL}/session/canvas/${USER_TOKEN}`);

        // Wait for redirect to SessionEnded page
        console.log('Waiting for redirect to SessionEnded page...');
        await page.waitForURL('**/session/ended/**', { timeout: 10000 });

        // Verify redirect occurred
        const currentUrl = page.url();
        console.log(`Current URL after redirect: ${currentUrl}`);

        // Check if URL contains /session/ended/
        expect(currentUrl).toMatch(/\/session\/ended\//);

        // Verify session ID in URL
        expect(currentUrl).toContain(`/session/ended/${SESSION_ID}`);

        console.log('✓ SessionCanvas correctly redirected to SessionEnded page');
    });

    test('TranscriptCanvas redirects to SessionEnded for ended session', async ({ page }) => {
        console.log('\n=== Test 3: TranscriptCanvas Redirect for Ended Session ===');

        // Navigate to TranscriptCanvas with user token
        console.log(`Navigating to TranscriptCanvas: ${BASE_URL}/transcript/canvas/${USER_TOKEN}`);
        await page.goto(`${BASE_URL}/transcript/canvas/${USER_TOKEN}`);

        // Wait for redirect to SessionEnded page
        console.log('Waiting for redirect to SessionEnded page...');
        await page.waitForURL('**/session/ended/**', { timeout: 10000 });

        // Verify redirect occurred
        const currentUrl = page.url();
        console.log(`Current URL after redirect: ${currentUrl}`);

        // Check if URL contains /session/ended/
        expect(currentUrl).toMatch(/\/session\/ended\//);

        // Verify session ID in URL
        expect(currentUrl).toContain(`/session/ended/${SESSION_ID}`);

        console.log('✓ TranscriptCanvas correctly redirected to SessionEnded page');
    });

    test('Session status check happens before registration guard', async ({ page }) => {
        console.log('\n=== Test 4: Session Status Check Priority ===');

        // This test verifies that session status is checked BEFORE registration verification
        // Navigate to SessionWaiting (without registration)
        console.log(`Navigating to SessionWaiting: ${BASE_URL}/session/waiting/${USER_TOKEN}`);
        await page.goto(`${BASE_URL}/session/waiting/${USER_TOKEN}`);

        // Should redirect to SessionEnded, NOT UserLanding
        console.log('Verifying redirect goes to SessionEnded (not UserLanding)...');
        await page.waitForURL('**/session/ended/**', { timeout: 10000 });

        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);

        // Verify we're on SessionEnded page (not UserLanding)
        expect(currentUrl).toMatch(/\/session\/ended\//);
        expect(currentUrl).not.toMatch(/\/user\/landing\//);

        console.log('✓ Session status check correctly happens before registration guard');
    });
});
