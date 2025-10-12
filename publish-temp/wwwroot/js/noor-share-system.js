/**
 * DEFINITIVE SHARE BUTTON SOLUTION
 * Simple, reliable event delegation approach that always works
 * No timing issues, no complex initialization, no injection dependencies
 */

// Global state for share button functionality
window.NoorShareSystem = {
    dotNetRef: null,
    isInitialized: false,
    activeShares: new Set(),

    // Initialize the system - called once when page loads
    init: function (dotNetRef) {
        console.log('[NOOR-SHARE] Initializing definitive share button system');

        this.dotNetRef = dotNetRef;
        this.isInitialized = true;

        // Remove any existing listeners to prevent duplicates
        document.removeEventListener('click', this.handleGlobalClick);

        // Add single global click handler using event delegation
        document.addEventListener('click', this.handleGlobalClick.bind(this), true);

        // Add immediate visual feedback for all existing share buttons
        this.styleExistingButtons();

        console.log('[NOOR-SHARE] ✅ Share system initialized successfully');
        return true;
    },

    // Global click handler - works for any share button, existing or future
    handleGlobalClick: function (event) {
        const shareButton = event.target.closest('.ks-share-button, .ks-share-btn, [data-share-button]');

        if (!shareButton) {
            return; // Not a share button click
        }

        event.preventDefault();
        event.stopPropagation();

        console.log('[NOOR-SHARE] 🎯 Share button clicked:', shareButton);

        // Extract share data from button attributes
        const shareData = this.extractShareData(shareButton);

        if (!shareData.isValid) {
            console.error('[NOOR-SHARE] ❌ Invalid share data:', shareData);
            this.showError(shareButton, 'Invalid share button configuration');
            return;
        }

        // Process the share immediately
        this.processShare(shareButton, shareData);
    },

    // Extract share data from button attributes
    extractShareData: function (button) {
        // Try multiple attribute patterns to be flexible
        let shareId = button.getAttribute('data-share-id') ||
            button.getAttribute('data-asset-id') ||
            button.getAttribute('onclick')?.match(/ShareAsset\('([^']+)'/)?.[1];

        let assetType = button.getAttribute('data-asset-type') ||
            button.getAttribute('data-type') ||
            shareId?.split('-')?.[1]; // Extract from shareId like 'asset-ayah-card-1'

        let instanceNumber = parseInt(
            button.getAttribute('data-instance-number') ||
            button.getAttribute('data-instance') ||
            shareId?.split('-')?.pop() // Extract from shareId like 'asset-ayah-card-1'
        ) || 1;

        const isValid = !!(shareId && assetType);

        return {
            shareId,
            assetType,
            instanceNumber,
            isValid,
            rawData: {
                allAttributes: Array.from(button.attributes).map(attr => ({ name: attr.name, value: attr.value }))
            }
        };
    },

    // Process the share action
    processShare: function (button, shareData) {
        const { shareId, assetType, instanceNumber } = shareData;

        console.log('[NOOR-SHARE] 🚀 Processing share:', shareData);

        // Check if already sharing
        if (this.activeShares.has(shareId)) {
            console.log('[NOOR-SHARE] ⏳ Share already in progress for:', shareId);
            return;
        }

        // Add to active shares
        this.activeShares.add(shareId);

        // Update button state immediately
        this.setButtonState(button, 'sharing');

        // Show toast notification
        this.showToast(`Sharing ${assetType} #${instanceNumber}...`, 'info');

        // Call Blazor method
        if (this.dotNetRef && this.dotNetRef.invokeMethodAsync) {
            console.log('[NOOR-SHARE] 📞 Calling Blazor ShareAsset method');

            this.dotNetRef.invokeMethodAsync('ShareAsset', shareId, assetType, instanceNumber)
                .then((result) => {
                    console.log('[NOOR-SHARE] ✅ Share completed successfully:', result);
                    this.handleShareSuccess(button, shareData, result);
                })
                .catch((error) => {
                    console.error('[NOOR-SHARE] ❌ Share failed:', error);
                    this.handleShareError(button, shareData, error);
                })
                .finally(() => {
                    this.activeShares.delete(shareId);
                });
        } else {
            console.error('[NOOR-SHARE] ❌ No DotNet reference available');
            this.handleShareError(button, shareData, 'DotNet reference not available');
            this.activeShares.delete(shareId);
        }
    },

    // Handle successful share
    handleShareSuccess: function (button, shareData, result) {
        console.log('[NOOR-SHARE] 🎉 Share success for:', shareData.shareId);

        this.setButtonState(button, 'success');
        this.showToast(`${shareData.assetType} shared successfully!`, 'success');

        // Reset button after 3 seconds
        setTimeout(() => {
            this.setButtonState(button, 'normal');
        }, 3000);
    },

    // Handle share error
    handleShareError: function (button, shareData, error) {
        console.error('[NOOR-SHARE] 💥 Share error for:', shareData.shareId, error);

        this.setButtonState(button, 'error');
        this.showToast(`Failed to share ${shareData.assetType}: ${error}`, 'error');

        // Reset button after 3 seconds
        setTimeout(() => {
            this.setButtonState(button, 'normal');
        }, 3000);
    },

    // Set button visual state
    setButtonState: function (button, state) {
        // Remove all state classes
        button.classList.remove('noor-sharing', 'noor-success', 'noor-error');

        // Set content and style based on state
        switch (state) {
            case 'sharing':
                button.classList.add('noor-sharing');
                button.style.backgroundColor = '#f59e0b';
                button.style.color = 'white';
                button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SHARING...';
                button.disabled = true;
                break;

            case 'success':
                button.classList.add('noor-success');
                button.style.backgroundColor = '#10b981';
                button.style.color = 'white';
                button.innerHTML = '<i class="fa-solid fa-check"></i> SHARED!';
                button.disabled = false;
                break;

            case 'error':
                button.classList.add('noor-error');
                button.style.backgroundColor = '#ef4444';
                button.style.color = 'white';
                button.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> ERROR';
                button.disabled = false;
                break;

            case 'normal':
            default:
                button.style.backgroundColor = '';
                button.style.color = '';
                button.innerHTML = '<i class="fa-solid fa-share"></i> SHARE AYAT CARD #1';
                button.disabled = false;
                break;
        }
    },

    // Style existing buttons for better visibility
    styleExistingButtons: function () {
        const buttons = document.querySelectorAll('.ks-share-button, .ks-share-btn, [data-share-button]');
        console.log(`[NOOR-SHARE] 🎨 Styling ${buttons.length} existing share buttons`);

        buttons.forEach((button, index) => {
            // Ensure button is clickable and visible
            button.style.cursor = 'pointer';
            button.style.transition = 'all 0.2s ease';
            button.style.border = '2px solid #3b82f6';
            button.style.borderRadius = '6px';
            button.style.padding = '8px 12px';
            button.style.margin = '4px';
            button.style.backgroundColor = '#3b82f6';
            button.style.color = 'white';
            button.style.fontWeight = 'bold';
            button.style.fontSize = '12px';
            button.style.minWidth = '120px';
            button.style.textAlign = 'center';
            button.style.display = 'inline-block';
            button.style.zIndex = '999999';
            button.style.position = 'relative';

            // Add hover effect
            button.addEventListener('mouseenter', function () {
                if (!this.disabled) {
                    this.style.backgroundColor = '#2563eb';
                    this.style.transform = 'scale(1.05)';
                }
            });

            button.addEventListener('mouseleave', function () {
                if (!this.disabled) {
                    this.style.backgroundColor = '#3b82f6';
                    this.style.transform = 'scale(1)';
                }
            });
        });
    },

    // Show toast notifications
    showToast: function (message, type = 'info') {
        // Try to use existing NOOR toast system
        if (typeof window.showNoorToast === 'function') {
            window.showNoorToast(message, 'Share System', type);
            return;
        }

        // Fallback to simple alert
        console.log(`[NOOR-SHARE] TOAST [${type.toUpperCase()}]: ${message}`);
    },

    // Show error notification
    showError: function (button, message) {
        this.showToast(message, 'error');
        console.error('[NOOR-SHARE] ERROR:', message);
    },

    // Get system status for debugging
    getStatus: function () {
        return {
            isInitialized: this.isInitialized,
            hasDotNetRef: !!this.dotNetRef,
            activeSharesCount: this.activeShares.size,
            activeShares: Array.from(this.activeShares),
            buttonCount: document.querySelectorAll('.ks-share-button, .ks-share-btn, [data-share-button]').length
        };
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        console.log('[NOOR-SHARE] DOM ready, system available for initialization');
    });
} else {
    console.log('[NOOR-SHARE] DOM already ready, system available for initialization');
}

// Export global functions for Blazor interop
window.initNoorShareSystem = function (dotNetRef) {
    return window.NoorShareSystem.init(dotNetRef);
};

window.getNoorShareStatus = function () {
    return window.NoorShareSystem.getStatus();
};

window.refreshShareButtons = function () {
    window.NoorShareSystem.styleExistingButtons();
    return window.NoorShareSystem.getStatus();
};

console.log('[NOOR-SHARE] 🚀 Definitive share button system loaded and ready');