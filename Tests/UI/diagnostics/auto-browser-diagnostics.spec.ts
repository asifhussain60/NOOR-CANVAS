import { expect, Page, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Automated Browser Diagnostics
 * Captures comprehensive diagnostic data without user intervention
 * 
 * Usage:
 *   npx playwright test Tests/UI/diagnostics/auto-browser-diagnostics.spec.ts
 * 
 * Output:
 *   Workspaces/TEMP/diagnostics/diagnostic-report-{timestamp}.json
 *   Workspaces/TEMP/diagnostics/screenshot-{timestamp}.png
 */

interface DiagnosticReport {
    timestamp: string;
    url: string;
    consoleLogs: ConsoleLog[];
    networkRequests: NetworkRequest[];
    domState: DOMState;
    computedStyles: Record<string, any>;
    screenshots: {
        fullPage: string;
        element?: string;
    };
    errors: string[];
    analysis: DiagnosticAnalysis;
}

interface ConsoleLog {
    type: 'log' | 'info' | 'warn' | 'error';
    message: string;
    timestamp: number;
}

interface NetworkRequest {
    url: string;
    method: string;
    status: number;
    type: string; // 'document', 'stylesheet', 'script', 'xhr', etc.
    failed: boolean;
}

interface DOMState {
    elementExists: Record<string, boolean>;
    elementVisible: Record<string, boolean>;
    elementCount: Record<string, number>;
}

interface DiagnosticAnalysis {
    criticalIssues: string[];
    warnings: string[];
    suggestions: string[];
    issueCategory: 'library-missing' | 'css-failed' | 'z-index' | 'element-hidden' | 'ux-timing' | 'no-issue' | 'unknown';
    recommendedFix: string;
}

/**
 * Auto-diagnose UI issue
 * @param page Playwright page instance
 * @param targetUrl URL to diagnose
 * @param selectors Critical element selectors to check
 */
async function autoDiagnose(
    page: Page,
    targetUrl: string,
    selectors: string[]
): Promise<DiagnosticReport> {

    const report: DiagnosticReport = {
        timestamp: new Date().toISOString(),
        url: targetUrl,
        consoleLogs: [],
        networkRequests: [],
        domState: {
            elementExists: {},
            elementVisible: {},
            elementCount: {}
        },
        computedStyles: {},
        screenshots: {
            fullPage: ''
        },
        errors: [],
        analysis: {
            criticalIssues: [],
            warnings: [],
            suggestions: [],
            issueCategory: 'unknown',
            recommendedFix: ''
        }
    };

    // 1. CAPTURE CONSOLE LOGS
    page.on('console', msg => {
        report.consoleLogs.push({
            type: msg.type() as any,
            message: msg.text(),
            timestamp: Date.now()
        });
    });

    // 2. CAPTURE NETWORK REQUESTS
    page.on('response', async response => {
        report.networkRequests.push({
            url: response.url(),
            method: response.request().method(),
            status: response.status(),
            type: response.request().resourceType(),
            failed: !response.ok()
        });
    });

    // 3. NAVIGATE TO PAGE
    try {
        await page.goto(targetUrl, { waitForLoadState: 'networkidle', timeout: 30000 });
    } catch (error: any) {
        report.errors.push(`Navigation failed: ${error.message}`);
    }

    // 4. WAIT FOR BLAZOR TO INITIALIZE
    await page.waitForTimeout(2000);

    // 5. CAPTURE DOM STATE
    for (const selector of selectors) {
        try {
            // Check if element exists
            const elementHandle = await page.$(selector);
            report.domState.elementExists[selector] = elementHandle !== null;

            if (elementHandle) {
                // Check visibility
                report.domState.elementVisible[selector] = await elementHandle.isVisible();

                // Get computed styles
                report.computedStyles[selector] = await page.evaluate((sel) => {
                    const element = document.querySelector(sel);
                    if (!element) return null;

                    const styles = window.getComputedStyle(element);
                    return {
                        display: styles.display,
                        visibility: styles.visibility,
                        opacity: styles.opacity,
                        zIndex: styles.zIndex,
                        position: styles.position,
                        width: styles.width,
                        height: styles.height,
                        overflow: styles.overflow,
                        maxHeight: styles.maxHeight,
                        maxWidth: styles.maxWidth,
                        top: styles.top,
                        right: styles.right,
                        bottom: styles.bottom,
                        left: styles.left
                    };
                }, selector);
            }

            // Count elements matching selector
            report.domState.elementCount[selector] = await page.locator(selector).count();

        } catch (error: any) {
            report.errors.push(`Error checking ${selector}: ${error.message}`);
        }
    }

    // 6. CHECK JAVASCRIPT LIBRARY AVAILABILITY
    const libraryCheck = await page.evaluate(() => {
        return {
            jQuery: typeof (window as any).$ !== 'undefined',
            toastr: typeof (window as any).toastr !== 'undefined',
            Blazor: typeof (window as any).Blazor !== 'undefined',
            signalR: typeof (window as any).signalR !== 'undefined'
        };
    });

    report.computedStyles['__libraries__'] = libraryCheck;

    // 7. CAPTURE SCREENSHOTS
    const screenshotDir = path.join(process.cwd(), 'Workspaces', 'TEMP', 'diagnostics');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const screenshotPath = path.join(screenshotDir, `screenshot-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    report.screenshots.fullPage = screenshotPath;

    // 8. ANALYZE REPORT
    report.analysis = analyzeReport(report);

    return report;
}

/**
 * Analyze diagnostic report and identify issues
 */
function analyzeReport(report: DiagnosticReport): DiagnosticAnalysis {

    const analysis: DiagnosticAnalysis = {
        criticalIssues: [],
        warnings: [],
        suggestions: [],
        issueCategory: 'no-issue',
        recommendedFix: ''
    };

    // Check for failed CSS/JS network requests
    const failedCSS = report.networkRequests.filter(r =>
        r.type === 'stylesheet' && r.failed
    );
    const failedJS = report.networkRequests.filter(r =>
        r.type === 'script' && r.failed
    );

    if (failedCSS.length > 0) {
        const files = failedCSS.map(r => r.url.split('/').pop()).join(', ');
        analysis.criticalIssues.push(`CSS files failed to load (404): ${files}`);
        analysis.issueCategory = 'css-failed';
        analysis.recommendedFix = `Create missing CSS files or fix paths: ${files}`;
    }

    if (failedJS.length > 0) {
        const files = failedJS.map(r => r.url.split('/').pop()).join(', ');
        analysis.criticalIssues.push(`JavaScript files failed to load (404): ${files}`);
        analysis.issueCategory = 'library-missing';
        analysis.recommendedFix = `Add missing JavaScript libraries or fix paths: ${files}`;
    }

    // Check for JavaScript errors in console
    const errorLogs = report.consoleLogs.filter(log => log.type === 'error');
    if (errorLogs.length > 0) {
        errorLogs.forEach(log => {
            analysis.criticalIssues.push(`JavaScript error: ${log.message}`);
        });

        // Check for specific library errors
        if (errorLogs.some(log => log.message.includes('toastr') && log.message.includes('not defined'))) {
            analysis.issueCategory = 'library-missing';
            analysis.recommendedFix = 'Add toastr library: <script src="/lib/toastr/toastr.min.js"></script>';
        }
    }

    // Check for missing libraries
    const libs = report.computedStyles['__libraries__'];
    if (libs) {
        if (!libs.toastr) {
            analysis.criticalIssues.push('toastr library not loaded');
            analysis.issueCategory = 'library-missing';
            analysis.recommendedFix = 'Add toastr library to _Layout.cshtml or page';
        }
        if (!libs.jQuery) {
            analysis.warnings.push('jQuery not loaded (toastr depends on jQuery)');
        }
        if (!libs.Blazor) {
            analysis.warnings.push('Blazor not initialized');
        }
    }

    // Check for hidden or low z-index elements
    for (const [selector, styles] of Object.entries(report.computedStyles)) {
        if (selector === '__libraries__') continue;

        if (styles && typeof styles === 'object') {
            if (styles.display === 'none') {
                analysis.warnings.push(`${selector} has display:none`);
                if (analysis.issueCategory === 'no-issue') {
                    analysis.issueCategory = 'element-hidden';
                    analysis.recommendedFix = `Remove display:none from ${selector} or adjust visibility condition`;
                }
            }
            if (styles.visibility === 'hidden') {
                analysis.warnings.push(`${selector} has visibility:hidden`);
            }
            if (styles.zIndex === 'auto' || styles.zIndex === '0' || parseInt(styles.zIndex) < 1000) {
                analysis.suggestions.push(`${selector} has low z-index (${styles.zIndex})`);
                if (analysis.issueCategory === 'no-issue' && analysis.criticalIssues.length === 0) {
                    analysis.issueCategory = 'z-index';
                    analysis.recommendedFix = `Set ${selector} { z-index: 999999 !important; }`;
                }
            }
        }
    }

    // Check for non-existent elements
    for (const [selector, exists] of Object.entries(report.domState.elementExists)) {
        if (!exists) {
            analysis.warnings.push(`Element not found in DOM: ${selector}`);
        }
    }

    // Check for UX timing issues (element exists, libraries loaded, but user says "too brief")
    if (analysis.criticalIssues.length === 0 && libs?.toastr) {
        const toastLogs = report.consoleLogs.filter(log =>
            log.message.includes('toast') || log.message.includes('notification')
        );

        if (toastLogs.length > 0) {
            analysis.issueCategory = 'ux-timing';
            analysis.recommendedFix = 'Adjust toast timeOut config (e.g., change 5000 → 3000ms)';
            analysis.suggestions.push('Toast is displaying but may have UX timing issue (duration, position)');
        }
    }

    return analysis;
}

/**
 * Save diagnostic report to JSON file
 */
function saveDiagnosticReport(report: DiagnosticReport): string {
    const reportDir = path.join(process.cwd(), 'Workspaces', 'TEMP', 'diagnostics');
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `diagnostic-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return reportPath;
}

/**
 * Test Suite: Automated Diagnostics
 */
test.describe('Auto-Diagnostics: UI Issue Detection', () => {

    test('diagnose SessionCanvas (participant view)', async ({ page }) => {

        // Define critical selectors for SessionCanvas
        const criticalSelectors = [
            '#toast-container',
            '.toast',
            '.canvas-area-container',
            '.canvas-sidebar',
            '.debug-panel',
            'button:has-text("Test Toast")'
        ];

        // Run auto-diagnosis
        const report = await autoDiagnose(
            page,
            'https://localhost:9091/Canvas/212/KJAHA99L',
            criticalSelectors
        );

        // Save diagnostic report
        const reportPath = saveDiagnosticReport(report);
        console.log('\n📊 DIAGNOSTIC REPORT SAVED:', reportPath);
        console.log('\n🔍 AUTOMATED ANALYSIS:');
        console.log(JSON.stringify(report.analysis, null, 2));

        // Log summary
        if (report.analysis.criticalIssues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES:');
            report.analysis.criticalIssues.forEach(issue => console.log(`  - ${issue}`));
        }

        if (report.analysis.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            report.analysis.warnings.forEach(warning => console.log(`  - ${warning}`));
        }

        if (report.analysis.suggestions.length > 0) {
            console.log('\n💡 SUGGESTIONS:');
            report.analysis.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
        }

        console.log('\n🎯 ISSUE CATEGORY:', report.analysis.issueCategory);
        console.log('🛠️  RECOMMENDED FIX:', report.analysis.recommendedFix || 'No issues detected');

        // Fail test if critical issues detected (forces agent to review)
        if (report.analysis.criticalIssues.length > 0) {
            throw new Error(`Critical issues detected:\n${report.analysis.criticalIssues.join('\n')}`);
        }
    });

    test('diagnose HostControlPanel (host view)', async ({ page }) => {

        // Define critical selectors for HostControlPanel
        const criticalSelectors = [
            '#toast-container',
            '.toast',
            '.host-panel-container',
            '.debug-panel',
            'button:has-text("Test Toast")'
        ];

        // Run auto-diagnosis
        const report = await autoDiagnose(
            page,
            'https://localhost:9091/Host/212/PQ9N5YWW',
            criticalSelectors
        );

        // Save diagnostic report
        const reportPath = saveDiagnosticReport(report);
        console.log('\n📊 DIAGNOSTIC REPORT SAVED:', reportPath);

        // Log analysis
        console.log('\n🔍 AUTOMATED ANALYSIS:');
        console.log(JSON.stringify(report.analysis, null, 2));

        // Fail test if critical issues detected
        if (report.analysis.criticalIssues.length > 0) {
            throw new Error(`Critical issues detected:\n${report.analysis.criticalIssues.join('\n')}`);
        }
    });

    test('diagnose and trigger toast automatically', async ({ page }) => {

        // Navigate to page
        await page.goto('https://localhost:9091/Canvas/212/KJAHA99L');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Wait for Blazor

        // Capture console logs
        const consoleLogs: string[] = [];
        page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

        // Find and click "Test Toast" button
        const testButton = page.locator('button:has-text("Test Toast")');

        if (await testButton.count() > 0) {
            console.log('\n🧪 AUTOMATED TOAST TEST:');

            await testButton.click();

            // Wait for toast to appear
            await page.waitForTimeout(1000);

            // Check if toast container exists and is visible
            const toastContainer = page.locator('#toast-container');
            const containerExists = await toastContainer.count() > 0;
            const containerVisible = containerExists ? await toastContainer.isVisible() : false;

            // Check for actual toast element
            const toastElement = page.locator('.toast');
            const toastExists = await toastElement.count() > 0;

            // Capture screenshot
            const screenshotPath = path.join(
                process.cwd(),
                'Workspaces', 'TEMP', 'diagnostics',
                `toast-test-${Date.now()}.png`
            );
            await page.screenshot({ path: screenshotPath });

            // Get toast computed styles
            const toastStyles = await page.evaluate(() => {
                const container = document.querySelector('#toast-container');
                if (!container) return null;

                const styles = window.getComputedStyle(container);
                return {
                    display: styles.display,
                    zIndex: styles.zIndex,
                    position: styles.position,
                    top: styles.top,
                    right: styles.right,
                    bottom: styles.bottom,
                    left: styles.left
                };
            });

            // Report findings
            console.log('  Toast container exists:', containerExists);
            console.log('  Toast container visible:', containerVisible);
            console.log('  Toast element count:', await toastElement.count());
            console.log('  Toast styles:', toastStyles);
            console.log('  Console logs:', consoleLogs.filter(log => log.includes('toast')));
            console.log('  Screenshot:', screenshotPath);

            // Validate
            expect(containerExists).toBe(true);
            if (containerExists) {
                expect(toastStyles).not.toBeNull();
            }
        } else {
            console.log('⚠️  Test Toast button not found - skipping automatic trigger test');
        }
    });
});

export { analyzeReport, autoDiagnose, DiagnosticReport };

