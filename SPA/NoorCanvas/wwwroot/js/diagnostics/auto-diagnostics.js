/**
 * Automatic Browser Diagnostics
 * Self-reporting diagnostic module that runs on page load
 * 
 * Features:
 * - Captures console errors automatically
 * - Checks library availability (jQuery, toastr, Blazor, SignalR)
 * - Detects failed resource loads (CSS, JS)
 * - Checks for missing critical DOM elements
 * - Analyzes computed styles for common issues
 * - Optionally sends diagnostic report to server
 * 
 * Usage:
 *   Add ?debug=auto to URL to enable auto-reporting
 *   Or call: window.noorDiagnostics.sendReport() manually
 */

(function () {
    'use strict';

    const diagnostics = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        consoleErrors: [],
        librariesLoaded: {},
        failedResources: [],
        missingElements: [],
        computedStyles: {}
    };

    // Capture console errors
    const originalConsoleError = console.error;
    console.error = function (...args) {
        const errorMessage = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');

        diagnostics.consoleErrors.push(errorMessage);
        originalConsoleError.apply(console, args);
    };

    // Check library availability
    function checkLibraries() {
        diagnostics.librariesLoaded = {
            'jQuery': typeof $ !== 'undefined',
            'toastr': typeof toastr !== 'undefined',
            'Blazor': typeof Blazor !== 'undefined',
            'signalR': typeof signalR !== 'undefined'
        };

        console.log('[AUTO-DIAGNOSTIC] Library check:', diagnostics.librariesLoaded);
    }

    // Check for failed resources using Performance API
    function checkFailedResources() {
        try {
            const resources = performance.getEntriesByType('resource');

            resources.forEach(resource => {
                // Resource failed if duration is 0 and transferSize is 0
                // (or if it was blocked/failed to load)
                if (resource.duration === 0 && resource.transferSize === 0) {
                    // Extract just the filename from the full URL
                    const url = resource.name;
                    const filename = url.split('/').pop() || url;

                    // Only report CSS and JS failures
                    if (url.includes('.css') || url.includes('.js')) {
                        diagnostics.failedResources.push(filename);
                        console.error('[AUTO-DIAGNOSTIC] Failed resource:', filename);
                    }
                }
            });

            if (diagnostics.failedResources.length === 0) {
                console.log('[AUTO-DIAGNOSTIC] All resources loaded successfully');
            }
        } catch (error) {
            console.error('[AUTO-DIAGNOSTIC] Error checking resources:', error);
        }
    }

    // Check for missing critical elements
    function checkMissingElements(selectors) {
        selectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (!element) {
                diagnostics.missingElements.push(selector);
                console.warn('[AUTO-DIAGNOSTIC] Missing element:', selector);
            }
        });

        if (diagnostics.missingElements.length === 0) {
            console.log('[AUTO-DIAGNOSTIC] All critical elements found');
        }
    }

    // Get computed styles for critical elements
    function getComputedStyles(selectors) {
        selectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                const styles = window.getComputedStyle(element);
                diagnostics.computedStyles[selector] = {
                    display: styles.display,
                    visibility: styles.visibility,
                    opacity: styles.opacity,
                    zIndex: styles.zIndex,
                    position: styles.position,
                    height: styles.height,
                    maxHeight: styles.maxHeight,
                    overflow: styles.overflow,
                    top: styles.top,
                    right: styles.right,
                    bottom: styles.bottom,
                    left: styles.left
                };

                // Log concerning styles
                if (styles.display === 'none') {
                    console.warn('[AUTO-DIAGNOSTIC] Element hidden (display:none):', selector);
                }
                if (styles.visibility === 'hidden') {
                    console.warn('[AUTO-DIAGNOSTIC] Element hidden (visibility:hidden):', selector);
                }
                if (styles.zIndex === 'auto' || styles.zIndex === '0' || parseInt(styles.zIndex) < 1000) {
                    console.warn('[AUTO-DIAGNOSTIC] Low z-index:', selector, '=', styles.zIndex);
                }
            }
        });
    }

    // Send diagnostic report to server
    async function sendDiagnosticReport() {
        try {
            console.log('[AUTO-DIAGNOSTIC] Sending diagnostic report to server...');

            const response = await fetch('/api/Diagnostics/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(diagnostics)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('[AUTO-DIAGNOSTIC] Report sent successfully. Request ID:', result.requestId);
                return result;
            } else {
                console.error('[AUTO-DIAGNOSTIC] Failed to send report. Status:', response.status);
            }
        } catch (error) {
            console.error('[AUTO-DIAGNOSTIC] Failed to send report:', error);
        }
    }

    // Run diagnostics on page load
    window.addEventListener('load', () => {
        console.log('[AUTO-DIAGNOSTIC] Starting automatic diagnostics...');

        setTimeout(() => {
            // Check libraries
            checkLibraries();

            // Check failed resources
            checkFailedResources();

            // Critical elements to check
            const criticalSelectors = [
                '#toast-container',
                '.canvas-area-container',
                '.canvas-sidebar',
                '.debug-panel',
                '.host-panel-container'
            ];

            // Check for missing elements
            checkMissingElements(criticalSelectors);

            // Get computed styles
            getComputedStyles(criticalSelectors);

            // Log diagnostic summary
            console.log('[AUTO-DIAGNOSTIC] Diagnostic summary:', {
                consoleErrors: diagnostics.consoleErrors.length,
                librariesLoaded: Object.values(diagnostics.librariesLoaded).filter(Boolean).length + '/' + Object.keys(diagnostics.librariesLoaded).length,
                failedResources: diagnostics.failedResources.length,
                missingElements: diagnostics.missingElements.length,
                stylesAnalyzed: Object.keys(diagnostics.computedStyles).length
            });

            // Send report if ?debug=auto in URL
            if (window.location.search.includes('debug=auto')) {
                sendDiagnosticReport();
            }

            // Expose diagnostics API
            window.noorDiagnostics = {
                getReport: () => diagnostics,
                sendReport: sendDiagnosticReport,
                checkLibraries: checkLibraries,
                checkResources: checkFailedResources
            };

            console.log('[AUTO-DIAGNOSTIC] Diagnostics complete. Use window.noorDiagnostics.getReport() to view.');

        }, 1000); // Wait 1 second for libraries to load
    });

    // Also capture page errors
    window.addEventListener('error', (event) => {
        const errorMessage = `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
        diagnostics.consoleErrors.push(errorMessage);
        console.error('[AUTO-DIAGNOSTIC] Page error captured:', errorMessage);
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const errorMessage = `Unhandled promise rejection: ${event.reason}`;
        diagnostics.consoleErrors.push(errorMessage);
        console.error('[AUTO-DIAGNOSTIC] Promise rejection captured:', errorMessage);
    });

})();
