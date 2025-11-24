/**
 * [REFACTOR:Phase1] Error Panel Module
 * Extracted from HostControlPanel.razor inline JavaScript
 * Manages error display panel with details and clipboard functionality
 */

let currentError = null;

/**
 * Show error panel with details
 * @param {Error|string} error - Error object or error message
 * @param {string} details - Optional technical details/stack trace
 */
function showErrorPanel(error, details = null) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorDetails = details || error?.stack || 'No additional details available';

    currentError = {
        message: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
    };

    // Create or update error panel
    let errorPanel = document.getElementById('error-panel');

    if (!errorPanel) {
        errorPanel = createErrorPanel();
        document.body.appendChild(errorPanel);
    }

    // Update content
    errorPanel.querySelector('.error-message').textContent = errorMessage;
    errorPanel.querySelector('.error-details').textContent = errorDetails;
    errorPanel.style.display = 'block';

    console.error('[ERROR-PANEL] Error displayed:', errorMessage);
}

/**
 * Create error panel DOM structure
 */
function createErrorPanel() {
    const panel = document.createElement('div');
    panel.id = 'error-panel';
    panel.className = 'error-panel';
    panel.innerHTML = `
        <div class="error-panel-header">
            <h3>⚠️ Error Occurred</h3>
            <button onclick="dismissError()" class="error-close-btn">✕</button>
        </div>
        <div class="error-panel-body">
            <p class="error-message"></p>
            <button onclick="toggleErrorDetails()" class="error-details-toggle">
                Show Details ▼
            </button>
            <pre class="error-details" style="display:none;"></pre>
        </div>
        <div class="error-panel-footer">
            <button onclick="copyErrorToClipboard()" class="error-copy-btn">
                📋 Copy Error Report
            </button>
            <button onclick="dismissError()" class="error-dismiss-btn">
                Dismiss
            </button>
        </div>
    `;

    return panel;
}

/**
 * Dismiss the error panel
 */
function dismissError() {
    const errorPanel = document.getElementById('error-panel');
    if (errorPanel) {
        errorPanel.style.display = 'none';
    }
    currentError = null;
    console.log('[ERROR-PANEL] Error dismissed');
}

/**
 * Toggle error details visibility
 */
function toggleErrorDetails() {
    const detailsElement = document.querySelector('.error-details');
    const toggleButton = document.querySelector('.error-details-toggle');

    if (detailsElement && toggleButton) {
        const isVisible = detailsElement.style.display !== 'none';
        detailsElement.style.display = isVisible ? 'none' : 'block';
        toggleButton.textContent = isVisible ? 'Show Details ▼' : 'Hide Details ▲';
    }
}

/**
 * Copy error report to clipboard
 */
async function copyErrorToClipboard() {
    if (!currentError) {
        console.warn('[ERROR-PANEL] No error to copy');
        return;
    }

    const errorReport = `NOOR Canvas Error Report
Generated: ${currentError.timestamp}
Host Control Panel - Error Details

Error Message:
${currentError.message}

Technical Details:
${currentError.details}

Page URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}

Please share this report with the development team for debugging.`;

    try {
        await navigator.clipboard.writeText(errorReport);
        window.showFabClickToast?.('Error report copied to clipboard');
        console.log('[ERROR-PANEL] Error report copied to clipboard');
    } catch (err) {
        console.error('[ERROR-PANEL] Failed to copy to clipboard:', err);
        window.showErrorToast?.('Failed to copy error report');
    }
}

/**
 * Global error handler to catch unhandled errors
 */
window.addEventListener('error', function (event) {
    console.error('[ERROR-PANEL] Global error caught:', event.error);
    showErrorPanel(event.error || event.message, event.error?.stack);
});

/**
 * Promise rejection handler
 */
window.addEventListener('unhandledrejection', function (event) {
    console.error('[ERROR-PANEL] Unhandled promise rejection:', event.reason);
    showErrorPanel(event.reason, event.reason?.stack);
});

/**
 * Override console.error to capture application errors
 */
const originalConsoleError = console.error;
console.error = function (...args) {
    originalConsoleError.apply(console, args);

    // Show error panel for significant errors (exclude routine logging)
    const errorMessage = args.join(' ');
    if (errorMessage.includes('NOOR-TEST-ERROR') || errorMessage.includes('CRITICAL')) {
        showErrorPanel(errorMessage);
    }
};

// Export functions to global scope
window.showErrorPanel = showErrorPanel;
window.dismissError = dismissError;
window.toggleErrorDetails = toggleErrorDetails;
window.copyErrorToClipboard = copyErrorToClipboard;

console.log('[ERROR-PANEL] Error panel module loaded');
