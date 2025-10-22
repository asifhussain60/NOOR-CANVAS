/**
 * HCP Phase 1 E2E Test: Collapsible Panel Toggle and Visibility
 * 
 * Test Scope:
 * - Toggle button exists and is accessible
 * - Initial state: panel hidden by default
 * - Badge shows current question count
 * - Click toggles panel visibility
 * - Keyboard navigation works (Space/Enter)
 * - ARIA attributes present
 * 
 * Session Data: Session 212 (Host Token: PQ9N5YWW)
 */

import { expect, test } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';
const HOST_TOKEN = 'PQ9N5YWW'; // Session 212

test.describe('HCP Phase 1: Collapsible Panel Toggle', () => {
    let consoleMessages: string[] = [];
    let consoleErrors: string[] = [];

    test.beforeEach(async ({ page }) => {
        // Reset log arrays
        consoleMessages = [];
        consoleErrors = [];

        // Monitor console logs
        page.on('console', msg => {
            const text = msg.text();
            const type = msg.type();
            consoleMessages.push(`[${type.toUpperCase()}] ${text}`);
            console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);

            if (type === 'error' || type === 'warning') {
                consoleErrors.push(text);
            }
        });

        // Monitor page errors
        page.on('pageerror', error => {
            const errorMsg = `[PAGE ERROR] ${error.message}`;
            consoleErrors.push(errorMsg);
            console.error(errorMsg);
        });

        // Navigate to Host Control Panel and ensure session is active
        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Wait for Blazor initialization

        // Start session if not already started
        const startButton = page.locator('button:has-text("Start Session")');
        const startButtonVisible = await startButton.isVisible().catch(() => false);
        if (startButtonVisible) {
            console.log('[SETUP] Starting session...');
            await startButton.click();
            await page.waitForTimeout(3000); // Wait for session to start and UI to update
            console.log('[SETUP] Session started');
        } else {
            console.log('[SETUP] Session already active');
        }
    });

    test.afterEach(async () => {
        // Report console activity
        if (consoleErrors.length > 0) {
            console.log('\n🔴 Browser Console Errors/Warnings:');
            consoleErrors.forEach(err => console.log(`  ${err}`));
        } else {
            console.log('\n✅ No browser console errors detected');
        }
    });

    test('should display toggle button with question count badge', async ({ page }) => {
        console.log('\n=== Test 1: Toggle Button Exists ===');

        // Verify toggle button exists
        const toggleButton = page.locator('button[aria-controls="hcp-qa-panel"]');
        await expect(toggleButton).toBeVisible({ timeout: 10000 });

        // Verify button has correct ARIA attributes
        await expect(toggleButton).toHaveAttribute('aria-expanded', 'false'); // Initial state: collapsed
        await expect(toggleButton).toHaveAttribute('aria-label', /toggle questions/i);

        // Verify badge exists and shows a number
        const badge = toggleButton.locator('span[aria-label*="questions"]');
        await expect(badge).toBeVisible();
        const badgeText = await badge.textContent();
        console.log(`  ✓ Badge shows: ${badgeText}`);
        expect(badgeText).toMatch(/^\d+$/); // Should be a number

        // Verify button text
        await expect(toggleButton).toContainText('Questions');

        console.log('  ✓ Toggle button with badge verified');
    });

    test('should hide Q&A panel by default', async ({ page }) => {
        console.log('\n=== Test 2: Panel Hidden by Default ===');

        // Verify panel is not visible initially
        const qaPanel = page.locator('#hcp-qa-panel');
        await expect(qaPanel).toBeHidden({ timeout: 5000 });

        // Verify toggle button shows collapsed state
        const toggleButton = page.locator('button[aria-controls="hcp-qa-panel"]');
        await expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

        console.log('  ✓ Q&A panel hidden by default');
    });

    test('should show panel when toggle button is clicked', async ({ page }) => {
        console.log('\n=== Test 3: Click to Show Panel ===');

        // Initial state: panel hidden
        const qaPanel = page.locator('#hcp-qa-panel');
        await expect(qaPanel).toBeHidden();

        // Click toggle button
        const toggleButton = page.locator('button[aria-controls="hcp-qa-panel"]');
        await toggleButton.click();
        await page.waitForTimeout(500); // Wait for state update

        // Verify panel is now visible
        await expect(qaPanel).toBeVisible({ timeout: 5000 });

        // Verify toggle button aria-expanded updated
        await expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

        console.log('  ✓ Panel becomes visible after click');
    });

    test('should hide panel when toggle button is clicked again', async ({ page }) => {
        console.log('\n=== Test 4: Click to Hide Panel ===');

        const toggleButton = page.locator('button[aria-controls="hcp-qa-panel"]');
        const qaPanel = page.locator('#hcp-qa-panel');

        // First click: show panel
        await toggleButton.click();
        await page.waitForTimeout(500);
        await expect(qaPanel).toBeVisible();

        // Second click: hide panel
        await toggleButton.click();
        await page.waitForTimeout(500);
        await expect(qaPanel).toBeHidden();

        // Verify aria-expanded back to false
        await expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

        console.log('  ✓ Panel hides after second click');
    });

    test('should toggle panel with Space key', async ({ page }) => {
        console.log('\n=== Test 5: Keyboard Toggle (Space) ===');

        const toggleButton = page.locator('button[aria-controls="hcp-qa-panel"]');
        const qaPanel = page.locator('#hcp-qa-panel');

        // Focus on button
        await toggleButton.focus();

        // Press Space key
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);

        // Verify panel becomes visible
        await expect(qaPanel).toBeVisible();

        // Press Space again
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);

        // Verify panel hides
        await expect(qaPanel).toBeHidden();

        console.log('  ✓ Space key toggles panel');
    });

    test('should toggle panel with Enter key', async ({ page }) => {
        console.log('\n=== Test 6: Keyboard Toggle (Enter) ===');

        const toggleButton = page.locator('button[aria-controls="hcp-qa-panel"]');
        const qaPanel = page.locator('#hcp-qa-panel');

        // Focus on button
        await toggleButton.focus();

        // Press Enter key
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // Verify panel becomes visible
        await expect(qaPanel).toBeVisible();

        console.log('  ✓ Enter key toggles panel');
    });

    test('should verify no console errors during toggle operations', async ({ page }) => {
        console.log('\n=== Test 7: Console Error Check ===');

        const toggleButton = page.locator('button[aria-controls="hcp-qa-panel"]');

        // Perform multiple toggles
        for (let i = 0; i < 3; i++) {
            await toggleButton.click();
            await page.waitForTimeout(300);
        }

        // Filter critical errors (ignore expected warnings)
        const criticalErrors = consoleErrors.filter(err => {
            // Ignore SignalR/WebSocket warnings in test environment
            if (err.includes('SignalR') || err.includes('WebSocket')) return false;
            if (err.includes('CORS') || err.includes('Access-Control')) return false;
            // Flag real errors
            if (err.includes('Uncaught') || err.includes('undefined')) return true;
            return false;
        });

        // Assert no critical errors
        if (criticalErrors.length > 0) {
            console.log('  ❌ Critical errors found:');
            criticalErrors.forEach(err => console.log(`    - ${err}`));
        }
        expect(criticalErrors).toHaveLength(0);

        console.log('  ✓ No critical console errors during toggle');
    });
});
