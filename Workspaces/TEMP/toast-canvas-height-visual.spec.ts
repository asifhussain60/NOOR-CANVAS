/**
 * Visual Regression Test: Toast Display and Canvas Height Issues
 * 
 * Purpose: Automated test to capture:
 * 1. Unwanted toast notifications appearing on test data entry
 * 2. Canvas div not expanding to fit asset content
 * 
 * Test Data: Session 212 (User: KJAHA99L, Host: PQ9N5YWW)
 * Created: 2025-10-14
 * Key: key
 * 
 * This test automates the browser diagnostic process to capture:
 * - Console logs showing toast initialization
 * - Computed styles of canvas container
 * - Visual snapshots of toast presence
 * - Canvas height measurements
 */

import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

test.describe('Visual Regression: Toast and Canvas Height Issues', () => {

    test.beforeEach(async ({ page }) => {
        // Capture console logs for diagnostics
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[DIAGNOSTIC:notyf') || text.includes('canvas')) {
                console.log(`🔍 Console: ${text}`);
            }
        });

        // Capture errors
        page.on('pageerror', error => {
            console.error(`❌ Page Error: ${error.message}`);
        });
    });

    test('ISSUE-1: Toast should NOT display when entering test data', async ({ page }) => {
        // Navigate to UserLanding with Session 212 user token
        await page.goto('https://localhost:9091/user/landing/KJAHA99L');

        // Wait for page to load completely
        await page.waitForSelector('body', { state: 'attached' });
        await page.waitForTimeout(2000); // Allow Notyf initialization

        // DIAGNOSTIC: Check if Notyf is initialized
        const notyfState = await page.evaluate(() => {
            return {
                notyfExists: typeof (window as any).NoorToast !== 'undefined',
                showNoorToastExists: typeof (window as any).showNoorToast === 'function',
                state: (window as any).NoorToast ? (window as any).NoorToast.getState() : null
            };
        });
        console.log('📊 Notyf State:', JSON.stringify(notyfState, null, 2));

        // Take baseline snapshot BEFORE test data
        await percySnapshot(page, 'UserLanding - Before Test Data (Should be clean)', {
            widths: [1280],
            minHeight: 800
        });

        // Check for existing toasts (should be NONE)
        const toastCountBefore = await page.locator('.notyf__toast').count();
        console.log(`📋 Toast count BEFORE test data: ${toastCountBefore}`);
        expect(toastCountBefore).toBe(0);

        // Trigger test data entry via DebugPanel (if visible)
        const debugPanel = page.locator('[data-testid="debug-panel"]').or(page.locator('text=Enter Test Data'));
        const debugPanelExists = await debugPanel.count() > 0;

        if (debugPanelExists) {
            console.log('🎯 Debug panel found, clicking "Enter Test Data"...');

            // Click test data button
            await debugPanel.click();
            await page.waitForTimeout(1000); // Wait for action to complete

            // DIAGNOSTIC: Check for toast containers in DOM
            const toastDiagnostic = await page.evaluate(() => {
                const notyfContainer = document.querySelector('.notyf');
                const toastElements = document.querySelectorAll('.notyf__toast');

                return {
                    containerExists: notyfContainer !== null,
                    containerStyles: notyfContainer ? {
                        display: window.getComputedStyle(notyfContainer).display,
                        visibility: window.getComputedStyle(notyfContainer).visibility,
                        zIndex: window.getComputedStyle(notyfContainer).zIndex,
                        position: window.getComputedStyle(notyfContainer).position
                    } : null,
                    toastCount: toastElements.length,
                    toastMessages: Array.from(toastElements).map(el => el.textContent)
                };
            });

            console.log('🔍 Toast Diagnostic:', JSON.stringify(toastDiagnostic, null, 2));

            // Take snapshot AFTER test data (checking for unwanted toast)
            await percySnapshot(page, 'UserLanding - After Test Data (ISSUE: Toast appears)', {
                widths: [1280],
                minHeight: 800
            });

            // ASSERTION: Toast should NOT appear
            const toastCountAfter = await page.locator('.notyf__toast').count();
            console.log(`📋 Toast count AFTER test data: ${toastCountAfter}`);

            if (toastCountAfter > 0) {
                const toastText = await page.locator('.notyf__toast').first().textContent();
                console.error(`❌ ISSUE CONFIRMED: Unwanted toast appeared with message: "${toastText}"`);
            }

            // EXPECTED: 0 toasts (test will initially FAIL to document the bug)
            expect(toastCountAfter, 'Toast should NOT display for test data entry').toBe(0);
        } else {
            console.warn('⚠️ Debug panel not found - skipping test data trigger');
        }
    });

    test('ISSUE-2: Canvas div should expand to fit asset content', async ({ page }) => {
        // Navigate to SessionCanvas with Session 212 user token
        await page.goto('https://localhost:9091/session/canvas/KJAHA99L');

        // Wait for session to load
        await page.waitForSelector('.session-canvas-container', { state: 'attached' });
        await page.waitForTimeout(2000);

        // DIAGNOSTIC: Get canvas container dimensions BEFORE asset load
        const canvasBeforeAsset = await page.evaluate(() => {
            const canvasArea = document.querySelector('.canvas-content-area');
            const assetContent = document.querySelector('.canvas-asset-content');

            if (!canvasArea) return null;

            const styles = window.getComputedStyle(canvasArea);
            return {
                minHeight: styles.minHeight,
                maxHeight: styles.maxHeight,
                height: styles.height,
                overflow: styles.overflow,
                actualHeight: canvasArea.getBoundingClientRect().height,
                assetContentHeight: assetContent ? assetContent.getBoundingClientRect().height : 0
            };
        });

        console.log('📐 Canvas dimensions BEFORE asset:', JSON.stringify(canvasBeforeAsset, null, 2));

        // Take baseline snapshot
        await percySnapshot(page, 'SessionCanvas - Before Asset (Empty canvas)', {
            widths: [1280],
            minHeight: 800
        });

        // Simulate asset sharing (if test harness available)
        // For now, check if any asset is already loaded
        const assetExists = await page.locator('.canvas-asset-content').count() > 0;

        if (assetExists) {
            // DIAGNOSTIC: Get canvas container dimensions AFTER asset load
            const canvasAfterAsset = await page.evaluate(() => {
                const canvasArea = document.querySelector('.canvas-content-area');
                const assetContent = document.querySelector('.canvas-asset-content');

                if (!canvasArea || !assetContent) return null;

                const canvasStyles = window.getComputedStyle(canvasArea);
                const assetStyles = window.getComputedStyle(assetContent);

                const canvasRect = canvasArea.getBoundingClientRect();
                const assetRect = assetContent.getBoundingClientRect();

                return {
                    canvas: {
                        minHeight: canvasStyles.minHeight,
                        maxHeight: canvasStyles.maxHeight,
                        height: canvasStyles.height,
                        overflow: canvasStyles.overflow,
                        actualHeight: canvasRect.height,
                        hasVerticalScroll: canvasArea.scrollHeight > canvasArea.clientHeight
                    },
                    asset: {
                        height: assetStyles.height,
                        actualHeight: assetRect.height,
                        overflow: assetStyles.overflow
                    },
                    issue: {
                        assetTallerThanCanvas: assetRect.height > canvasRect.height,
                        assetClipped: canvasRect.height < assetContent.scrollHeight
                    }
                };
            });

            console.log('📐 Canvas dimensions AFTER asset:', JSON.stringify(canvasAfterAsset, null, 2));

            // Take snapshot showing the issue
            await percySnapshot(page, 'SessionCanvas - With Asset (ISSUE: Canvas not expanding)', {
                widths: [1280],
                minHeight: 800
            });

            // ASSERTION: Canvas should expand to fit asset (no clipping)
            if (canvasAfterAsset?.issue.assetClipped) {
                console.error(`❌ ISSUE CONFIRMED: Asset is clipped - Canvas height: ${canvasAfterAsset.canvas.actualHeight}px, Asset height: ${canvasAfterAsset.asset.actualHeight}px`);
            }

            expect(canvasAfterAsset?.issue.assetClipped, 'Canvas should expand to fit asset without clipping').toBe(false);
        } else {
            console.warn('⚠️ No asset loaded - cannot test canvas expansion');
        }
    });

    test('DIAGNOSTIC: Capture all styling information for debugging', async ({ page }) => {
        await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
        await page.waitForSelector('.session-canvas-container', { state: 'attached' });
        await page.waitForTimeout(2000);

        // Comprehensive diagnostic dump
        const fullDiagnostic = await page.evaluate(() => {
            const results: any = {
                timestamp: new Date().toISOString(),
                url: window.location.href,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                elements: {}
            };

            // Check all relevant elements
            const selectors = [
                '.session-canvas-root',
                '.session-canvas-container',
                '.canvas-main-grid',
                '.canvas-area-container',
                '.canvas-content-area',
                '.canvas-asset-content',
                '.notyf',
                '.notyf__toast'
            ];

            selectors.forEach(selector => {
                const el = document.querySelector(selector);
                if (el) {
                    const styles = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();

                    results.elements[selector] = {
                        exists: true,
                        dimensions: {
                            width: rect.width,
                            height: rect.height,
                            top: rect.top,
                            left: rect.left
                        },
                        computedStyles: {
                            display: styles.display,
                            position: styles.position,
                            minHeight: styles.minHeight,
                            maxHeight: styles.maxHeight,
                            height: styles.height,
                            overflow: styles.overflow,
                            overflowY: styles.overflowY,
                            zIndex: styles.zIndex,
                            visibility: styles.visibility
                        },
                        scrollInfo: {
                            scrollHeight: el.scrollHeight,
                            clientHeight: el.clientHeight,
                            hasVerticalScroll: el.scrollHeight > el.clientHeight
                        }
                    };
                } else {
                    results.elements[selector] = { exists: false };
                }
            });

            return results;
        });

        console.log('🔍 FULL DIAGNOSTIC DUMP:');
        console.log(JSON.stringify(fullDiagnostic, null, 2));

        // Take diagnostic snapshot
        await percySnapshot(page, 'Diagnostic - Full Page State', {
            widths: [1280],
            minHeight: 1200
        });
    });
});
