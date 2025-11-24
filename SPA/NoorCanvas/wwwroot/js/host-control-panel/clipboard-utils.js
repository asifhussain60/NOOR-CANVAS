/**
 * [REFACTOR:Phase1] Clipboard Utilities Module
 * Extracted from HostControlPanel.razor inline JavaScript
 * Handles clipboard copy operations for user links
 */

/**
 * Copy user landing link to clipboard (legacy - kept for compatibility)
 */
window.copyUserLink = function () {
    console.log('[CLIPBOARD] copyUserLink called (legacy method)');

    // Find the user link element
    const userLinkElement = document.querySelector('.user-landing-link, [data-user-link]');

    if (!userLinkElement) {
        console.error('[CLIPBOARD] User link element not found');
        window.showErrorToast?.('User link not found');
        return;
    }

    const userLink = userLinkElement.textContent || userLinkElement.href;

    copyToClipboard(userLink)
        .then(() => {
            console.log('[CLIPBOARD] User link copied successfully');
            window.showFabClickToast?.('User link copied to clipboard');
        })
        .catch(error => {
            console.error('[CLIPBOARD] Failed to copy user link:', error);
            window.showErrorToast?.('Failed to copy user link');
        });
};

/**
 * Copy text to clipboard using modern Clipboard API
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
async function copyToClipboard(text) {
    if (!text) {
        throw new Error('No text provided to copy');
    }

    console.log('[CLIPBOARD] Attempting to copy text to clipboard');

    try {
        // Try modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            console.log('[CLIPBOARD] Text copied using Clipboard API');
            return;
        }

        // Fallback to execCommand for older browsers
        console.warn('[CLIPBOARD] Clipboard API not available, using fallback method');
        await copyToClipboardFallback(text);

    } catch (error) {
        console.error('[CLIPBOARD] Copy operation failed:', error);
        throw error;
    }
}

/**
 * Fallback clipboard copy using execCommand
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
function copyToClipboardFallback(text) {
    return new Promise((resolve, reject) => {
        // Create temporary textarea
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);

        try {
            // Select and copy
            textarea.select();
            textarea.setSelectionRange(0, text.length);

            const successful = document.execCommand('copy');

            // Cleanup
            document.body.removeChild(textarea);

            if (successful) {
                console.log('[CLIPBOARD] Text copied using execCommand fallback');
                resolve();
            } else {
                reject(new Error('execCommand copy failed'));
            }

        } catch (error) {
            // Cleanup on error
            document.body.removeChild(textarea);
            reject(error);
        }
    });
}

/**
 * Check if clipboard API is available
 * @returns {boolean}
 */
function isClipboardAvailable() {
    return !!(navigator.clipboard && navigator.clipboard.writeText);
}

// Export functions to global scope
window.copyToClipboard = copyToClipboard;
window.copyToClipboardFallback = copyToClipboardFallback;
window.isClipboardAvailable = isClipboardAvailable;

console.log('[CLIPBOARD] Clipboard utilities module loaded');
console.log('[CLIPBOARD] Clipboard API available:', isClipboardAvailable());
