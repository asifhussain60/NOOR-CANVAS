/**
 * [REFACTOR:Phase1] Toast Notifications Module
 * Extracted from HostControlPanel.razor inline JavaScript
 * Handles Notyf-based toast notifications for questions, votes, and errors
 */

/**
 * Show question received toast notification
 * @param {string} questionText - The question text to display
 */
window.showQuestionToast = function (questionText) {
    try {
        // Truncate long questions for toast display
        const truncatedQuestion = questionText.length > 80
            ? questionText.substring(0, 77) + '...'
            : questionText;

        // Use Notyf if available
        if (window.notyf) {
            window.notyf.success({
                message: `📨 New Question: ${truncatedQuestion}`,
                duration: 5000,
                dismissible: true,
                position: { x: 'right', y: 'top' }
            });
        } else {
            console.warn('[TOAST] Notyf not available for question toast');
        }

        console.log(`[TOAST] Question received: ${questionText}`);

    } catch (error) {
        console.error('[TOAST] Error showing question toast:', error);
    }
};

/**
 * Show vote update toast notification
 * @param {string} questionText - The question that received votes
 * @param {number} voteCount - Current vote count
 */
window.showVoteUpdateToast = function (questionText, voteCount) {
    try {
        const truncatedQuestion = questionText.length > 60
            ? questionText.substring(0, 57) + '...'
            : questionText;

        if (window.notyf) {
            window.notyf.open({
                type: 'info',
                message: `👍 Vote Update: ${truncatedQuestion} (${voteCount} votes)`,
                duration: 4000,
                dismissible: true,
                position: { x: 'right', y: 'top' },
                background: '#3B82F6'
            });
        }

        console.log(`[TOAST] Vote update: ${questionText} - ${voteCount} votes`);

    } catch (error) {
        console.error('[TOAST] Error showing vote toast:', error);
    }
};

/**
 * Show error toast notification
 * @param {string} errorMessage - Error message to display
 */
window.showErrorToast = function (errorMessage) {
    try {
        if (window.notyf) {
            window.notyf.error({
                message: `❌ ${errorMessage}`,
                duration: 6000,
                dismissible: true,
                position: { x: 'right', y: 'top' }
            });
        } else {
            console.error('[TOAST] Error (Notyf unavailable):', errorMessage);
        }

        console.error(`[TOAST] Error: ${errorMessage}`);

    } catch (error) {
        console.error('[TOAST] Error showing error toast:', error);
    }
};

/**
 * Show FAB button click success toast
 * @param {string} message - Success message to display
 */
window.showFabClickToast = function (message) {
    try {
        if (window.notyf) {
            window.notyf.success({
                message: `✅ ${message}`,
                duration: 3000,
                dismissible: true,
                position: { x: 'center', y: 'top' }
            });
        }

        console.log(`[TOAST] FAB click: ${message}`);

    } catch (error) {
        console.error('[TOAST] Error showing FAB toast:', error);
    }
};

/**
 * Initialize Notyf instance if not already created
 */
function initializeNotyf() {
    if (typeof Notyf !== 'undefined' && !window.notyf) {
        window.notyf = new Notyf({
            duration: 4000,
            position: { x: 'right', y: 'top' },
            dismissible: true,
            ripple: true
        });
        console.log('[TOAST] Notyf initialized');
    }
}

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNotyf);
} else {
    initializeNotyf();
}

console.log('[TOAST] Toast notifications module loaded');
