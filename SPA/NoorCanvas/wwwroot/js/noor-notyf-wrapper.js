/**
 * NOOR CANVAS - Notyf Toast Wrapper
 * [DIAGNOSTIC-COMPONENT] Unified toast notification system using Notyf library ;CLEANUP_OK
 * 
 * Replaces fragmented toastr.js implementation with modern, reliable alternative.
 * Provides backward compatibility with existing showNoorToast() API.
 * 
 * Features:
 * - Zero dependencies (no jQuery required)
 * - Consistent 3-second auto-dismiss
 * - Bottom-right positioning
 * - Manual dismissal support
 * - 4 toast types: success, error, warning, info
 * - Comprehensive diagnostic logging (TRACE mode)
 * 
 * Created: 2025-10-14
 * Debug Level: TRACE
 */

window.NoorToast = (function () {
    'use strict';

    let notyf = null;
    let initAttempted = false;
    let initSuccess = false;

    // [DIAGNOSTIC:notyf:config] Toast configuration constants ;CLEANUP_OK
    const CONFIG = {
        duration: 3000,           // 3 seconds auto-dismiss
        position: { x: 'right', y: 'bottom' },
        dismissible: true,        // Show close button
        ripple: true,            // Material design ripple effect
        types: [
            {
                type: 'warning',
                background: '#f59e0b',
                icon: {
                    className: 'notyf__icon--warning',
                    tagName: 'i',
                    text: '⚠'
                }
            },
            {
                type: 'info',
                background: '#3b82f6',
                icon: {
                    className: 'notyf__icon--info',
                    tagName: 'i',
                    text: 'ℹ'
                }
            }
        ]
    };

    /**
     * Initialize Notyf library
     * [DIAGNOSTIC-METHOD:notyf:initialization] Notyf library initialization with error handling ;CLEANUP_OK
     */
    function init() {
        if (initAttempted) {
            console.log('[DIAGNOSTIC:notyf:init] Initialization already attempted, success=' + initSuccess + ' ;CLEANUP_OK');
            return initSuccess;
        }

        initAttempted = true;

        console.log('[DIAGNOSTIC:notyf:init] 🚀 Starting Notyf initialization ;CLEANUP_OK');
        console.log('[DIAGNOSTIC:notyf:init] Config: duration=' + CONFIG.duration + 'ms, position=' + CONFIG.position.x + '-' + CONFIG.position.y + ' ;CLEANUP_OK');

        // [DIAGNOSTIC:notyf:libs] Verify Notyf library loaded ;CLEANUP_OK
        if (typeof Notyf === 'undefined') {
            console.error('[DIAGNOSTIC:notyf:init] ❌ CRITICAL: Notyf library not loaded - check script tag in _Host.cshtml ;CLEANUP_OK');
            console.error('[DIAGNOSTIC:notyf:init] Expected: window.Notyf constructor function ;CLEANUP_OK');
            console.error('[DIAGNOSTIC:notyf:init] Actual: ' + typeof Notyf + ' ;CLEANUP_OK');
            initSuccess = false;
            return false;
        }

        console.log('[DIAGNOSTIC:notyf:init] ✅ Notyf library detected: ' + typeof Notyf + ' ;CLEANUP_OK');

        try {
            // [DIAGNOSTIC:notyf:instantiation] Create Notyf instance with config ;CLEANUP_OK
            notyf = new Notyf(CONFIG);

            console.log('[DIAGNOSTIC:notyf:init] ✅ Notyf instance created successfully ;CLEANUP_OK');
            console.log('[DIAGNOSTIC:notyf:init] Instance type: ' + typeof notyf + ' ;CLEANUP_OK');
            console.log('[DIAGNOSTIC:notyf:init] Has success method: ' + (typeof notyf.success === 'function') + ' ;CLEANUP_OK');
            console.log('[DIAGNOSTIC:notyf:init] Has error method: ' + (typeof notyf.error === 'function') + ' ;CLEANUP_OK');
            console.log('[DIAGNOSTIC:notyf:init] Has open method: ' + (typeof notyf.open === 'function') + ' ;CLEANUP_OK');

            initSuccess = true;
            return true;

        } catch (error) {
            console.error('[DIAGNOSTIC:notyf:init] ❌ CRITICAL: Notyf instantiation failed ;CLEANUP_OK');
            console.error('[DIAGNOSTIC:notyf:init] Error: ' + error.message + ' ;CLEANUP_OK');
            console.error('[DIAGNOSTIC:notyf:init] Stack: ' + error.stack + ' ;CLEANUP_OK');
            initSuccess = false;
            return false;
        }
    }

    /**
     * Show toast notification
     * [DIAGNOSTIC-METHOD:notyf:show] Display toast with type, title, message ;CLEANUP_OK
     * 
     * @param {string} message - Toast message content
     * @param {string} title - Toast title (optional)
     * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
     */
    function show(message, title, type) {
        const timestamp = new Date().toISOString();

        // [DIAGNOSTIC:notyf:invoke] Log invocation details ;CLEANUP_OK
        console.log('[DIAGNOSTIC:notyf:show] 🎯 Toast invoked at ' + timestamp + ' ;CLEANUP_OK');
        console.log('[DIAGNOSTIC:notyf:show] Type: "' + type + '" ;CLEANUP_OK');
        console.log('[DIAGNOSTIC:notyf:show] Title: "' + title + '" ;CLEANUP_OK');
        console.log('[DIAGNOSTIC:notyf:show] Message: "' + message + '" ;CLEANUP_OK');

        // [DIAGNOSTIC:notyf:initialization] Ensure initialized before showing ;CLEANUP_OK
        if (!notyf) {
            console.log('[DIAGNOSTIC:notyf:show] Notyf not initialized, attempting init... ;CLEANUP_OK');
            if (!init()) {
                console.error('[DIAGNOSTIC:notyf:show] ❌ CRITICAL: Failed to initialize Notyf - toast will not display ;CLEANUP_OK');
                // Fallback: console output for debugging
                console.warn('[DIAGNOSTIC:notyf:show] FALLBACK: Console output - [' + type + '] ' + title + ': ' + message + ' ;CLEANUP_OK');
                return;
            }
        }

        // [DIAGNOSTIC:notyf:message] Construct full message ;CLEANUP_OK
        const fullMessage = title ? title + ': ' + message : message;
        console.log('[DIAGNOSTIC:notyf:show] Full message: "' + fullMessage + '" ;CLEANUP_OK');

        try {
            // [DIAGNOSTIC:notyf:timing] Start timing toast display ;CLEANUP_OK
            const startTime = performance.now();

            // [DIAGNOSTIC:notyf:display] Display toast based on type ;CLEANUP_OK
            const normalizedType = (type || 'info').toLowerCase();
            console.log('[DIAGNOSTIC:notyf:show] Normalized type: "' + normalizedType + '" ;CLEANUP_OK');

            switch (normalizedType) {
                case 'success':
                    console.log('[DIAGNOSTIC:notyf:show] Calling notyf.success() ;CLEANUP_OK');
                    notyf.success(fullMessage);
                    break;

                case 'error':
                    console.log('[DIAGNOSTIC:notyf:show] Calling notyf.error() ;CLEANUP_OK');
                    notyf.error(fullMessage);
                    break;

                case 'warning':
                    console.log('[DIAGNOSTIC:notyf:show] Calling notyf.open() with warning config ;CLEANUP_OK');
                    notyf.open({
                        type: 'warning',
                        message: fullMessage
                    });
                    break;

                case 'info':
                default:
                    console.log('[DIAGNOSTIC:notyf:show] Calling notyf.open() with info config ;CLEANUP_OK');
                    notyf.open({
                        type: 'info',
                        message: fullMessage
                    });
                    break;
            }

            // [DIAGNOSTIC:notyf:timing] Log display timing ;CLEANUP_OK
            const endTime = performance.now();
            const duration = endTime - startTime;
            console.log('[DIAGNOSTIC:notyf:show] ✅ Toast displayed in ' + duration.toFixed(2) + 'ms ;CLEANUP_OK');

            // [DIAGNOSTIC:notyf:dom] Inspect DOM state after display ;CLEANUP_OK
            setTimeout(function () {
                const container = document.querySelector('.notyf');
                if (container) {
                    const computedStyle = window.getComputedStyle(container);
                    console.log('[DIAGNOSTIC:notyf:dom] Container found: .notyf ;CLEANUP_OK');
                    console.log('[DIAGNOSTIC:notyf:dom] z-index: ' + computedStyle.zIndex + ' ;CLEANUP_OK');
                    console.log('[DIAGNOSTIC:notyf:dom] position: ' + computedStyle.position + ' ;CLEANUP_OK');
                    console.log('[DIAGNOSTIC:notyf:dom] top: ' + computedStyle.top + ' ;CLEANUP_OK');
                    console.log('[DIAGNOSTIC:notyf:dom] right: ' + computedStyle.right + ' ;CLEANUP_OK');
                    console.log('[DIAGNOSTIC:notyf:dom] visibility: ' + computedStyle.visibility + ' ;CLEANUP_OK');
                    console.log('[DIAGNOSTIC:notyf:dom] display: ' + computedStyle.display + ' ;CLEANUP_OK');
                } else {
                    console.error('[DIAGNOSTIC:notyf:dom] ❌ WARNING: .notyf container not found in DOM ;CLEANUP_OK');
                }

                const notification = document.querySelector('.notyf__toast');
                if (notification) {
                    console.log('[DIAGNOSTIC:notyf:dom] ✅ Toast element found: .notyf__toast ;CLEANUP_OK');
                } else {
                    console.error('[DIAGNOSTIC:notyf:dom] ❌ WARNING: .notyf__toast not found in DOM ;CLEANUP_OK');
                }
            }, 50);

        } catch (error) {
            console.error('[DIAGNOSTIC:notyf:show] ❌ CRITICAL: Error displaying toast ;CLEANUP_OK');
            console.error('[DIAGNOSTIC:notyf:show] Error: ' + error.message + ' ;CLEANUP_OK');
            console.error('[DIAGNOSTIC:notyf:show] Stack: ' + error.stack + ' ;CLEANUP_OK');
            // Fallback: console output
            console.warn('[DIAGNOSTIC:notyf:show] FALLBACK: Console output - [' + type + '] ' + title + ': ' + message + ' ;CLEANUP_OK');
        }
    }

    /**
     * Public API
     */
    return {
        init: init,
        show: show,

        // [DIAGNOSTIC:notyf:api] Expose internal state for debugging ;CLEANUP_OK
        getState: function () {
            return {
                initAttempted: initAttempted,
                initSuccess: initSuccess,
                notyfInstance: notyf !== null,
                notyfType: typeof notyf,
                config: CONFIG
            };
        }
    };
})();

/**
 * Backward Compatibility Wrapper
 * [DIAGNOSTIC-METHOD:notyf:compat] Legacy showNoorToast() function wrapper ;CLEANUP_OK
 * 
 * Maintains compatibility with existing code that calls showNoorToast(message, title, type)
 */
window.showNoorToast = function (message, title, type) {
    console.log('[DIAGNOSTIC:notyf:compat] 🔄 Backward compatibility wrapper called ;CLEANUP_OK');
    console.log('[DIAGNOSTIC:notyf:compat] Redirecting to NoorToast.show() ;CLEANUP_OK');
    window.NoorToast.show(message, title, type);
};

/**
 * Auto-initialization
 * [DIAGNOSTIC:notyf:autoload] Initialize on DOM ready ;CLEANUP_OK
 */
if (document.readyState === 'loading') {
    console.log('[DIAGNOSTIC:notyf:autoload] DOM still loading, waiting for DOMContentLoaded event ;CLEANUP_OK');
    document.addEventListener('DOMContentLoaded', function () {
        console.log('[DIAGNOSTIC:notyf:autoload] DOMContentLoaded fired, initializing Notyf ;CLEANUP_OK');
        window.NoorToast.init();
    });
} else {
    console.log('[DIAGNOSTIC:notyf:autoload] DOM already loaded, initializing Notyf immediately ;CLEANUP_OK');
    window.NoorToast.init();
}

/**
 * Debug helper: Log state after 1 second
 * [DIAGNOSTIC:notyf:debug] Log initialization state for troubleshooting ;CLEANUP_OK
 */
setTimeout(function () {
    const state = window.NoorToast.getState();
    console.log('[DIAGNOSTIC:notyf:debug] === NOTYF STATE AFTER 1 SECOND === ;CLEANUP_OK');
    console.log('[DIAGNOSTIC:notyf:debug] Init Attempted: ' + state.initAttempted + ' ;CLEANUP_OK');
    console.log('[DIAGNOSTIC:notyf:debug] Init Success: ' + state.initSuccess + ' ;CLEANUP_OK');
    console.log('[DIAGNOSTIC:notyf:debug] Notyf Instance Exists: ' + state.notyfInstance + ' ;CLEANUP_OK');
    console.log('[DIAGNOSTIC:notyf:debug] Notyf Type: ' + state.notyfType + ' ;CLEANUP_OK');
    console.log('[DIAGNOSTIC:notyf:debug] showNoorToast Available: ' + (typeof window.showNoorToast === 'function') + ' ;CLEANUP_OK');
    console.log('[DIAGNOSTIC:notyf:debug] NoorToast.show Available: ' + (typeof window.NoorToast.show === 'function') + ' ;CLEANUP_OK');
    console.log('[DIAGNOSTIC:notyf:debug] ================================ ;CLEANUP_OK');
}, 1000);
