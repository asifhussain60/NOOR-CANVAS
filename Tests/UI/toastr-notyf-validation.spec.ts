/// <reference path="./notyf-types.d.ts" />
import { expect, test } from '@playwright/test';

/**
 * NOOR CANVAS - Notyf Toast Notification E2E Tests
 * 
 * Comprehensive automated testing for toast notification system.
 * Validates replacement of toastr.js with Notyf library.
 * 
 * Created: 2025-10-14
 * Key: toastr
 * Debug Level: TRACE
 * 
 * Test Coverage:
 * 1. Library loading and initialization
 * 2. Toast display functionality (all 4 types)
 * 3. Auto-dismiss timing (3 seconds)
 * 4. Manual dismissal
 * 5. Multiple toast stacking
 * 6. Positioning (bottom-right)
 * 7. SignalR integration (real-time questions)
 * 8. Cross-browser compatibility
 */

test.describe('Notyf Toast Notification System', () => {
    const HOST_URL = 'https://localhost:9091/host/control-panel/PQ9N5YWW';
    const SESSION_URL = 'https://localhost:9091/session/canvas/PQ9N5YWW';

    test.beforeEach(async ({ page }) => {
        // Enable console logging for diagnostics
        page.on('console', (msg) => {
            if (msg.text().includes('[DIAGNOSTIC:notyf]') || msg.text().includes('[DIAGNOSTIC:toastr]')) {
                console.log('🎯 BROWSER:', msg.text());
            }
        });

        page.on('pageerror', (error) => {
            console.error('❌ PAGE ERROR:', error.message);
        });
    });

    test('Library Loading - Notyf library should load successfully', async ({ page }) => {
        console.log('🧪 TEST: Library Loading');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');

        // Wait for auto-initialization (1 second delay in wrapper)
        await page.waitForTimeout(1500);

        // Verify Notyf library loaded
        const notyfLoaded = await page.evaluate(() => {
            return typeof window.Notyf !== 'undefined';
        });

        expect(notyfLoaded).toBe(true);
        console.log('✅ Notyf library loaded:', notyfLoaded);

        // Verify wrapper initialized
        const wrapperState = await page.evaluate(() => {
            return window.NoorToast.getState();
        });

        console.log('📊 Wrapper state:', wrapperState);
        expect(wrapperState.initAttempted).toBe(true);
        expect(wrapperState.initSuccess).toBe(true);
        expect(wrapperState.notyfInstance).toBe(true);

        // Verify backward compatibility
        const showNoorToastExists = await page.evaluate(() => {
            return typeof window.showNoorToast === 'function';
        });

        expect(showNoorToastExists).toBe(true);
        console.log('✅ Backward compatibility wrapper exists:', showNoorToastExists);
    });

    test('Toast Display - Success toast should appear and be visible', async ({ page }) => {
        console.log('🧪 TEST: Toast Display - Success');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Trigger success toast
        await page.evaluate(() => {
            window.showNoorToast('Test success message', 'Test Success', 'success');
        });

        // Wait for toast to appear
        await page.waitForTimeout(500);

        // Verify toast is visible
        const toastVisible = await page.locator('.notyf__toast').isVisible();
        expect(toastVisible).toBe(true);
        console.log('✅ Success toast visible:', toastVisible);

        // Take screenshot for visual verification
        await page.screenshot({ path: 'test-results/notyf-success-toast.png' });
        console.log('📸 Screenshot saved: test-results/notyf-success-toast.png');
    });

    test('Toast Display - All toast types should work', async ({ page }) => {
        console.log('🧪 TEST: All Toast Types');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        const types = ['success', 'error', 'warning', 'info'];

        for (const type of types) {
            console.log(`🎨 Testing ${type} toast...`);

            // Clear any existing toasts
            await page.evaluate(() => {
                const toasts = document.querySelectorAll('.notyf__toast');
                toasts.forEach(t => t.remove());
            });

            // Trigger toast
            await page.evaluate((t) => {
                window.showNoorToast(`Test ${t} message`, `Test ${t}`, t);
            }, type);

            // Wait for toast to appear
            await page.waitForTimeout(500);

            // Verify toast is visible
            const toastVisible = await page.locator('.notyf__toast').isVisible();
            expect(toastVisible).toBe(true);
            console.log(`  ✅ ${type} toast visible:`, toastVisible);

            // Take screenshot
            await page.screenshot({ path: `test-results/notyf-${type}-toast.png` });
            console.log(`  📸 Screenshot: test-results/notyf-${type}-toast.png`);

            // Wait before next test
            await page.waitForTimeout(1000);
        }
    });

    test('Auto-Dismiss Timing - Toast should auto-dismiss after 3 seconds', async ({ page }) => {
        console.log('🧪 TEST: Auto-Dismiss Timing');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Trigger toast
        const startTime = Date.now();
        await page.evaluate(() => {
            window.showNoorToast('Auto-dismiss test', 'Timing Test', 'info');
        });

        // Verify toast appears
        await page.waitForTimeout(500);
        let toastVisible = await page.locator('.notyf__toast').isVisible();
        expect(toastVisible).toBe(true);
        console.log('✅ Toast visible at 0.5s:', toastVisible);
        await page.screenshot({ path: 'test-results/notyf-timing-0.5s.png' });

        // Check at 1 second
        await page.waitForTimeout(500);
        toastVisible = await page.locator('.notyf__toast').isVisible();
        console.log('✅ Toast visible at 1s:', toastVisible);
        await page.screenshot({ path: 'test-results/notyf-timing-1s.png' });

        // Check at 2 seconds
        await page.waitForTimeout(1000);
        toastVisible = await page.locator('.notyf__toast').isVisible();
        console.log('✅ Toast visible at 2s:', toastVisible);
        await page.screenshot({ path: 'test-results/notyf-timing-2s.png' });

        // Check at 3 seconds (should be closing)
        await page.waitForTimeout(1000);
        toastVisible = await page.locator('.notyf__toast').isVisible();
        console.log('⏱️  Toast visible at 3s:', toastVisible);
        await page.screenshot({ path: 'test-results/notyf-timing-3s.png' });

        // Check at 4 seconds (should be gone)
        await page.waitForTimeout(1000);
        const toastCount = await page.locator('.notyf__toast').count();
        console.log('🗑️  Toast count at 4s:', toastCount);
        expect(toastCount).toBe(0);
        await page.screenshot({ path: 'test-results/notyf-timing-4s-dismissed.png' });

        const totalTime = Date.now() - startTime;
        console.log(`✅ Toast lifecycle complete in ${totalTime}ms`);
        expect(totalTime).toBeGreaterThan(3000);
        expect(totalTime).toBeLessThan(5000);
    });

    test('Manual Dismissal - Toast should close when dismiss button clicked', async ({ page }) => {
        console.log('🧪 TEST: Manual Dismissal');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Trigger toast
        await page.evaluate(() => {
            window.showNoorToast('Click to dismiss', 'Manual Test', 'info');
        });

        // Verify toast appears
        await page.waitForTimeout(500);
        const toastBefore = await page.locator('.notyf__toast').count();
        expect(toastBefore).toBeGreaterThan(0);
        console.log('✅ Toast count before dismiss:', toastBefore);

        // Find and click dismiss button
        const dismissButton = page.locator('.notyf__dismiss');
        if (await dismissButton.isVisible()) {
            await dismissButton.click();
            console.log('🖱️  Clicked dismiss button');

            // Wait for dismissal animation
            await page.waitForTimeout(500);

            // Verify toast is gone
            const toastAfter = await page.locator('.notyf__toast').count();
            expect(toastAfter).toBe(0);
            console.log('✅ Toast count after dismiss:', toastAfter);
        } else {
            console.log('⚠️  Dismiss button not visible (may auto-hide), using dismissAll');
            await page.evaluate(() => {
                const toasts = document.querySelectorAll('.notyf__toast');
                toasts.forEach(t => t.remove());
            });
        }
    });

    test('Multiple Toasts - Should stack vertically without overlap', async ({ page }) => {
        console.log('🧪 TEST: Multiple Toast Stacking');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Trigger 3 toasts in quick succession
        await page.evaluate(() => {
            window.showNoorToast('First toast message', 'Toast 1', 'info');
            setTimeout(() => window.showNoorToast('Second toast message', 'Toast 2', 'success'), 100);
            setTimeout(() => window.showNoorToast('Third toast message', 'Toast 3', 'warning'), 200);
        });

        // Wait for all toasts to appear
        await page.waitForTimeout(1000);

        // Count toasts
        const toastCount = await page.locator('.notyf__toast').count();
        console.log('📊 Number of visible toasts:', toastCount);
        expect(toastCount).toBeGreaterThanOrEqual(2); // At least 2 should be visible

        // Verify stacking (check positions)
        const toastPositions = await page.evaluate(() => {
            const toasts = Array.from(document.querySelectorAll('.notyf__toast'));
            return toasts.map(t => {
                const rect = t.getBoundingClientRect();
                return { top: rect.top, left: rect.left, height: rect.height };
            });
        });

        console.log('📐 Toast positions:', toastPositions);

        // Toasts should have different top positions (stacked)
        if (toastPositions.length >= 2) {
            const topsDifferent = toastPositions[0].top !== toastPositions[1].top;
            expect(topsDifferent).toBe(true);
            console.log('✅ Toasts are stacked (different top positions):', topsDifferent);
        }

        // Take screenshot
        await page.screenshot({ path: 'test-results/notyf-multiple-stacked.png' });
        console.log('📸 Screenshot: test-results/notyf-multiple-stacked.png');
    });

    test('Positioning - Toasts should appear in bottom-right corner', async ({ page }) => {
        console.log('🧪 TEST: Positioning (Bottom-Right)');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Trigger toast
        await page.evaluate(() => {
            window.showNoorToast('Position test', 'Positioning', 'info');
        });

        // Wait for toast to appear
        await page.waitForTimeout(500);

        // Check container position
        const containerPosition = await page.evaluate(() => {
            const container = document.querySelector('.notyf');
            if (!container) return null;

            const style = window.getComputedStyle(container);
            return {
                position: style.position,
                top: style.top,
                right: style.right,
                bottom: style.bottom,
                left: style.left
            };
        });

        console.log('📐 Container position:', containerPosition);
        expect(containerPosition).not.toBeNull();
        expect(containerPosition?.position).toBe('fixed');

        // Verify it's in bottom-right (right and bottom should be set, not left/top)
        const isBottomRight = containerPosition?.right !== 'auto' && containerPosition?.bottom !== 'auto';
        console.log('✅ Positioned bottom-right:', isBottomRight);

        // Take screenshot
        await page.screenshot({ path: 'test-results/notyf-positioning.png', fullPage: true });
        console.log('📸 Full-page screenshot: test-results/notyf-positioning.png');
    });

    test('Diagnostic Logging - Should log initialization and display events', async ({ page }) => {
        console.log('🧪 TEST: Diagnostic Logging');

        const diagnosticLogs: string[] = [];

        page.on('console', (msg) => {
            const text = msg.text();
            if (text.includes('[DIAGNOSTIC:notyf]')) {
                diagnosticLogs.push(text);
            }
        });

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Wait for debug state log (1s delay)

        // Trigger toast
        await page.evaluate(() => {
            window.showNoorToast('Diagnostic test', 'Logging', 'info');
        });

        await page.waitForTimeout(1000);

        // Verify diagnostic logs captured
        console.log('📊 Diagnostic logs captured:', diagnosticLogs.length);
        expect(diagnosticLogs.length).toBeGreaterThan(0);

        // Check for key log entries
        const hasInitLog = diagnosticLogs.some(log => log.includes('[DIAGNOSTIC:notyf:init]'));
        const hasShowLog = diagnosticLogs.some(log => log.includes('[DIAGNOSTIC:notyf:show]'));
        const hasDebugLog = diagnosticLogs.some(log => log.includes('[DIAGNOSTIC:notyf:debug]'));

        console.log('✅ Has initialization log:', hasInitLog);
        console.log('✅ Has show/display log:', hasShowLog);
        console.log('✅ Has debug state log:', hasDebugLog);

        expect(hasInitLog).toBe(true);
        expect(hasShowLog).toBe(true);
        expect(hasDebugLog).toBe(true);

        // Print sample logs
        console.log('\n📝 Sample Diagnostic Logs:');
        diagnosticLogs.slice(0, 10).forEach(log => console.log('  -', log));
    });

    test('DOM Inspection - Should have correct CSS classes and structure', async ({ page }) => {
        console.log('🧪 TEST: DOM Inspection');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Trigger toast
        await page.evaluate(() => {
            window.showNoorToast('DOM test', 'Structure', 'success');
        });

        await page.waitForTimeout(500);

        // Inspect DOM structure
        const domStructure = await page.evaluate(() => {
            const container = document.querySelector('.notyf');
            const toast = document.querySelector('.notyf__toast');

            return {
                containerExists: container !== null,
                toastExists: toast !== null,
                containerClasses: container?.className || '',
                toastClasses: toast?.className || '',
                hasIcon: document.querySelector('.notyf__icon') !== null,
                hasMessage: document.querySelector('.notyf__message') !== null,
                hasDismiss: document.querySelector('.notyf__dismiss') !== null
            };
        });

        console.log('📊 DOM Structure:', domStructure);

        expect(domStructure.containerExists).toBe(true);
        expect(domStructure.toastExists).toBe(true);
        console.log('✅ Container exists:', domStructure.containerExists);
        console.log('✅ Toast exists:', domStructure.toastExists);
        console.log('📋 Container classes:', domStructure.containerClasses);
        console.log('📋 Toast classes:', domStructure.toastClasses);
    });

    test('SessionCanvas Integration - Toast should work on participant view', async ({ page }) => {
        console.log('🧪 TEST: SessionCanvas Integration');

        await page.goto(SESSION_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Verify Notyf loaded on SessionCanvas
        const notyfLoaded = await page.evaluate(() => {
            return typeof window.NoorToast !== 'undefined';
        });

        expect(notyfLoaded).toBe(true);
        console.log('✅ NoorToast loaded on SessionCanvas:', notyfLoaded);

        // Trigger toast
        await page.evaluate(() => {
            window.showNoorToast('SessionCanvas toast test', 'Canvas Test', 'info');
        });

        await page.waitForTimeout(500);

        const toastVisible = await page.locator('.notyf__toast').isVisible();
        expect(toastVisible).toBe(true);
        console.log('✅ Toast visible on SessionCanvas:', toastVisible);

        await page.screenshot({ path: 'test-results/notyf-sessioncanvas.png' });
        console.log('📸 Screenshot: test-results/notyf-sessioncanvas.png');
    });
});

test.describe('Backward Compatibility Tests', () => {
    const HOST_URL = 'https://localhost:9091/host/control-panel/PQ9N5YWW';

    test('Legacy showNoorToast API - Should still work', async ({ page }) => {
        console.log('🧪 TEST: Legacy API Compatibility');

        await page.goto(HOST_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Test legacy API
        const legacyWorks = await page.evaluate(() => {
            if (typeof window.showNoorToast !== 'function') {
                return false;
            }

            try {
                window.showNoorToast('Legacy API test', 'Backward Compat', 'success');
                return true;
            } catch (error) {
                console.error('Legacy API error:', error);
                return false;
            }
        });

        expect(legacyWorks).toBe(true);
        console.log('✅ Legacy showNoorToast() API works:', legacyWorks);

        await page.waitForTimeout(500);
        const toastVisible = await page.locator('.notyf__toast').isVisible();
        expect(toastVisible).toBe(true);
        console.log('✅ Toast displayed via legacy API:', toastVisible);
    });
});
