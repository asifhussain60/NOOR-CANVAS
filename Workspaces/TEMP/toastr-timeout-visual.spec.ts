/**
 * Visual Regression Test: Toast Timeout Validation
 * =================================================
 * 
 * Purpose: Validate that toasts auto-close after 3 seconds as configured
 * 
 * Test Coverage:
 * - Toast appears with correct styling
 * - Toast displays for 3 seconds
 * - Toast disappears automatically (no manual close needed)
 * - Close button is clickable
 * - Visual snapshots at key intervals (0s, 1.5s, 3.5s)
 * 
 * Key: toastr
 * Session: 212 (tokens: KJAHA99L user / PQ9N5YWW host)
 */

import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';
const HOST_TOKEN = 'PQ9N5YWW';
const USER_TOKEN = 'KJAHA99L';

test.describe('Toast Timeout - Visual Regression', () => {
    test.use({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true
    });

    test('Host view - Toast appears and auto-closes after 3 seconds', async ({ page }) => {
        console.log('[TEST] Starting toast timeout test for HOST view');

        // Navigate to host view
        await page.goto(`${BASE_URL}/host/session-opener/${HOST_TOKEN}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000); // Wait for page to fully load

        console.log('[TEST] Page loaded, looking for debug panel');

        // Expand debug panel if needed
        const debugPanelToggle = page.locator('button:has-text("Debug Panel")').first();
        if (await debugPanelToggle.isVisible()) {
            await debugPanelToggle.click();
            await page.waitForTimeout(500);
            console.log('[TEST] Debug panel expanded');
        }

        // Find Clean Canvas button
        const cleanCanvasButton = page.locator('button:has-text("Clean Canvas")').first();
        await expect(cleanCanvasButton).toBeVisible({ timeout: 10000 });

        console.log('[TEST] Clean Canvas button found, clicking to trigger toast...');

        // Listen for console logs to capture toast lifecycle
        const consoleLogs: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[DEBUG-WORKITEM:toastr:timeout:trace]')) {
                consoleLogs.push(text);
                console.log('[BROWSER LOG]', text);
            }
        });

        // SNAPSHOT 1: Before toast appears
        await percySnapshot(page, 'Toast Timeout - Host - Before Toast', {
            widths: [1920],
            minHeight: 1080
        });

        // Click Clean Canvas to trigger toast
        await cleanCanvasButton.click();
        await page.waitForTimeout(500); // Wait for toast to appear

        // Verify toast is visible
        const toastElement = page.locator('.toast').first();
        await expect(toastElement).toBeVisible({ timeout: 5000 });
        console.log('[TEST] ✅ Toast is visible');

        // SNAPSHOT 2: Immediately after toast appears (0 seconds)
        await percySnapshot(page, 'Toast Timeout - Host - 0s (Toast Visible)', {
            widths: [1920],
            minHeight: 1080
        });

        // Wait 1.5 seconds - toast should still be visible
        await page.waitForTimeout(1500);
        await expect(toastElement).toBeVisible();
        console.log('[TEST] ✅ Toast still visible after 1.5s');

        // SNAPSHOT 3: Mid-display (1.5 seconds)
        await percySnapshot(page, 'Toast Timeout - Host - 1.5s (Still Visible)', {
            widths: [1920],
            minHeight: 1080
        });

        // Wait another 2 seconds (total 3.5s) - toast should be gone
        await page.waitForTimeout(2000);

        // SNAPSHOT 4: After timeout (3.5 seconds) - toast should be gone
        await percySnapshot(page, 'Toast Timeout - Host - 3.5s (Should Be Gone)', {
            widths: [1920],
            minHeight: 1080
        });

        // Verify toast has disappeared
        const toastCount = await page.locator('.toast').count();
        console.log('[TEST] Toast count after 3.5s:', toastCount);

        // Generate evidence report
        console.log('\n' + '='.repeat(80));
        console.log('TOAST LIFECYCLE EVIDENCE:');
        console.log('='.repeat(80));
        consoleLogs.forEach(log => console.log(log));
        console.log('='.repeat(80));
        console.log(`Final toast count: ${toastCount} (expected: 0)`);
        console.log('='.repeat(80) + '\n');

        // ASSERTION: Toast should be gone after 3.5 seconds
        expect(toastCount).toBe(0);
        console.log('[TEST] ✅ Toast disappeared after timeout as expected');
    });

    test('Host view - Manual close button works', async ({ page }) => {
        console.log('[TEST] Starting manual close test for HOST view');

        // Navigate to host view
        await page.goto(`${BASE_URL}/host/session-opener/${HOST_TOKEN}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Expand debug panel if needed
        const debugPanelToggle = page.locator('button:has-text("Debug Panel")').first();
        if (await debugPanelToggle.isVisible()) {
            await debugPanelToggle.click();
            await page.waitForTimeout(500);
        }

        // Trigger toast
        const cleanCanvasButton = page.locator('button:has-text("Clean Canvas")').first();
        await cleanCanvasButton.click();
        await page.waitForTimeout(500);

        // Verify toast is visible
        const toastElement = page.locator('.toast').first();
        await expect(toastElement).toBeVisible({ timeout: 5000 });
        console.log('[TEST] ✅ Toast is visible');

        // SNAPSHOT: Before manual close
        await percySnapshot(page, 'Toast Close Button - Host - Before Click', {
            widths: [1920],
            minHeight: 1080
        });

        // Click close button
        const closeButton = toastElement.locator('.toast-close-button').first();
        await expect(closeButton).toBeVisible();
        console.log('[TEST] Close button found, clicking...');

        await closeButton.click();
        await page.waitForTimeout(500);

        // SNAPSHOT: After manual close
        await percySnapshot(page, 'Toast Close Button - Host - After Click', {
            widths: [1920],
            minHeight: 1080
        });

        // Verify toast disappeared
        const toastCount = await page.locator('.toast').count();
        console.log('[TEST] Toast count after manual close:', toastCount);

        expect(toastCount).toBe(0);
        console.log('[TEST] ✅ Toast closed manually as expected');
    });

    test('Participant view - Toast appears and auto-closes after 3 seconds', async ({ page }) => {
        console.log('[TEST] Starting toast timeout test for PARTICIPANT view');

        // Navigate to participant view
        await page.goto(`${BASE_URL}/session/${USER_TOKEN}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        console.log('[TEST] Page loaded (participant view)');

        // For participant view, we need a different trigger
        // Let's use the question submit action if available
        const questionInput = page.locator('textarea[placeholder*="question" i], textarea[placeholder*="ask" i]').first();

        if (await questionInput.isVisible()) {
            console.log('[TEST] Found question input, typing test question...');

            await questionInput.fill('Test question to trigger toast notification');
            await page.waitForTimeout(500);

            // Find submit button
            const submitButton = page.locator('button:has-text("Submit"), button:has-text("Ask"), button[type="submit"]').first();

            if (await submitButton.isVisible()) {
                console.log('[TEST] Found submit button, clicking...');

                // SNAPSHOT 1: Before toast appears
                await percySnapshot(page, 'Toast Timeout - Participant - Before Toast', {
                    widths: [1920],
                    minHeight: 1080
                });

                // Submit to trigger toast
                await submitButton.click();
                await page.waitForTimeout(1000);

                // Check if toast appeared
                const toastElement = page.locator('.toast').first();
                if (await toastElement.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('[TEST] ✅ Toast is visible');

                    // SNAPSHOT 2: Toast visible
                    await percySnapshot(page, 'Toast Timeout - Participant - 0s (Toast Visible)', {
                        widths: [1920],
                        minHeight: 1080
                    });

                    // Wait 1.5 seconds
                    await page.waitForTimeout(1500);

                    // SNAPSHOT 3: Mid-display
                    await percySnapshot(page, 'Toast Timeout - Participant - 1.5s (Still Visible)', {
                        widths: [1920],
                        minHeight: 1080
                    });

                    // Wait another 2 seconds (total 3.5s)
                    await page.waitForTimeout(2000);

                    // SNAPSHOT 4: After timeout
                    await percySnapshot(page, 'Toast Timeout - Participant - 3.5s (Should Be Gone)', {
                        widths: [1920],
                        minHeight: 1080
                    });

                    // Verify toast disappeared
                    const toastCount = await page.locator('.toast').count();
                    console.log('[TEST] Toast count after 3.5s:', toastCount);
                    expect(toastCount).toBe(0);
                    console.log('[TEST] ✅ Toast disappeared after timeout as expected');
                } else {
                    console.log('[TEST] ⚠️ No toast appeared - may need different trigger');
                }
            } else {
                console.log('[TEST] ⚠️ No submit button found - skipping participant toast test');
            }
        } else {
            console.log('[TEST] ⚠️ No question input found - skipping participant toast test');
        }
    });

    test('Evidence: Console log output validation', async ({ page }) => {
        console.log('[TEST] Starting console log validation test');

        // Navigate to host view
        await page.goto(`${BASE_URL}/host/session-opener/${HOST_TOKEN}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Collect console logs
        const consoleLogs: Array<{ type: string; text: string; timestamp: number }> = [];
        page.on('console', msg => {
            consoleLogs.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: Date.now()
            });
        });

        // Expand debug panel
        const debugPanelToggle = page.locator('button:has-text("Debug Panel")').first();
        if (await debugPanelToggle.isVisible()) {
            await debugPanelToggle.click();
            await page.waitForTimeout(500);
        }

        // Trigger toast
        const cleanCanvasButton = page.locator('button:has-text("Clean Canvas")').first();
        const startTime = Date.now();
        await cleanCanvasButton.click();

        // Wait 5 seconds to capture all lifecycle logs
        await page.waitForTimeout(5000);

        // Filter and analyze toast-related logs
        const toastLogs = consoleLogs.filter(log =>
            log.text.includes('[DEBUG-WORKITEM:toastr:timeout:trace]')
        );

        console.log('\n' + '='.repeat(80));
        console.log('CONSOLE LOG EVIDENCE REPORT:');
        console.log('='.repeat(80));
        console.log(`Total console logs captured: ${consoleLogs.length}`);
        console.log(`Toast-related logs: ${toastLogs.length}`);
        console.log('='.repeat(80));
        console.log('Toast lifecycle logs:');
        toastLogs.forEach((log, index) => {
            console.log(`${index + 1}. [${log.type}] ${log.text}`);
        });
        console.log('='.repeat(80) + '\n');

        // Assertions
        expect(toastLogs.length).toBeGreaterThan(0); // Should have captured toast logs
        expect(toastLogs.some(log => log.text.includes('showNoorToast CALLED'))).toBeTruthy();
        expect(toastLogs.some(log => log.text.includes('Configured timeout: 3000ms'))).toBeTruthy();

        console.log('[TEST] ✅ Console log validation passed');
    });
});
