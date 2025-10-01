/**
 * Host Control Panel Asset Sharing JavaScript
 * Extracted from HostControlPanel.razor for better organization
 */

// Global variables for debugging and state management
window.hostControlPanelState = {
    dotNetRef: null,
    debugMode: true,
    shareButtonsInitialized: false
};

/**
 * Initialize share button event handlers
 * Called when the component is loaded
 */
function initializeShareButtons() {
    console.log('[DEBUG-WORKITEM:assetshare:continue] 🚀 Initializing share button handlers...');

    // Remove any existing event listeners to prevent duplicates
    document.removeEventListener('click', handleShareButtonClick, true);

    // Add global click handler with capture phase for better event handling
    document.addEventListener('click', handleShareButtonClick, true);

    // Test existing buttons
    const existingButtons = document.querySelectorAll('.ks-share-button, .ks-share-btn');
    console.log('[DEBUG-WORKITEM:assetshare:continue] 🔍 Found existing buttons:', existingButtons.length);

    if (existingButtons.length > 0) {
        console.log('[DEBUG-WORKITEM:assetshare:continue] 🧪 Testing click handler with first button...');
        const firstButton = existingButtons[0];
        console.log('[DEBUG-WORKITEM:assetshare:continue] 🎯 First button details:', {
            tagName: firstButton.tagName,
            className: firstButton.className,
            attributes: Array.from(firstButton.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', ')
        });
    }

    window.hostControlPanelState.shareButtonsInitialized = true;
    console.log('[DEBUG-WORKITEM:assetshare:continue] ✅ Share button handlers setup completed successfully!');
}

/**
 * Handle share button clicks with comprehensive debugging
 */
function handleShareButtonClick(event) {
    const clickData = {
        target: event.target,
        tagName: event.target.tagName,
        className: event.target.className,
        hasClosest: !!event.target.closest,
        allClasses: Array.from(event.target.classList || [])
    };

    console.log('[DEBUG-WORKITEM:assetshare:continue] 🔍 CLICK DETECTED:', clickData);

    // TOASTR: Show click detection notification
    if (typeof window.showNoorToast === 'function') {
        window.showNoorToast(
            'Share button clicked - processing request...',
            '🔍 Button Click Detected',
            'info'
        );
        console.log('[DEBUG-WORKITEM:sharebutton-toastr] 📢 TOASTR: Click detection notification shown');
    }

    // Show click detection toast
    showShareDebugToast('🔍 CLICK DETECTED!', clickData, 'info');

    // Check if clicked element is a share button
    const shareButton = event.target.closest('.ks-share-button');

    const shareButtonCheck = {
        foundShareButton: !!shareButton,
        shareButtonElement: shareButton,
        shareButtonClasses: shareButton ? Array.from(shareButton.classList) : null
    };

    console.log('[DEBUG-WORKITEM:assetshare:continue] 🔍 SHARE BUTTON CHECK:', shareButtonCheck);

    // Show share button detection result
    if (shareButton) {
        showShareDebugToast('✅ SHARE BUTTON FOUND!', shareButtonCheck, 'success');

        // TOASTR: Confirm share button validation
        if (typeof window.showNoorToast === 'function') {
            window.showNoorToast(
                'Share button validated - extracting asset details...',
                '✅ Valid Share Button',
                'info'
            );
            console.log('[DEBUG-WORKITEM:sharebutton-toastr] 📢 TOASTR: Share button validation notification shown');
        }
    } else {
        showShareDebugToast('❌ Not a share button click', shareButtonCheck, 'warning');
    }

    if (!shareButton) {
        console.log('[DEBUG-WORKITEM:assetshare:continue] ❌ Not a share button click, ignoring');
        return;
    }

    event.preventDefault();

    const shareId = shareButton.getAttribute('data-share-id');
    const assetType = shareButton.getAttribute('data-asset-type');
    const instanceNumber = parseInt(shareButton.getAttribute('data-instance-number')) || 1;

    const attributesData = {
        shareId,
        assetType,
        instanceNumber,
        allAttributes: Array.from(shareButton.attributes).map(attr => ({
            name: attr.name,
            value: attr.value
        }))
    };

    console.log('[DEBUG-WORKITEM:assetshare:continue] 🔍 SHARE BUTTON ATTRIBUTES:', attributesData);

    // Show extracted attributes
    showShareDebugToast('📋 SHARE BUTTON ATTRIBUTES', attributesData, 'info');

    if (!shareId || !assetType) {
        const errorData = { shareId, assetType, instanceNumber };
        console.error('[DEBUG-WORKITEM:assetshare:continue] ❌ Missing data attributes:', errorData);
        showShareDebugToast('❌ MISSING DATA ATTRIBUTES', errorData, 'error');
        alert(`Missing data attributes: shareId=${shareId}, assetType=${assetType}`);
        return;
    }

    // Find and display the HTML payload that would be shared
    const assetElement = document.querySelector(`[data-asset-id="${shareId}"]`);
    if (assetElement) {
        const htmlPayload = {
            outerHTML: assetElement.outerHTML.substring(0, 500) + (assetElement.outerHTML.length > 500 ? '...' : ''),
            textContent: assetElement.textContent?.substring(0, 200) || '',
            className: assetElement.className || '',
            elementFound: true
        };
        showShareDebugToast('📦 HTML PAYLOAD TO BE SHARED', htmlPayload, 'payload');
    } else {
        showShareDebugToast('❌ ASSET ELEMENT NOT FOUND', { shareId, selector: `[data-asset-id="${shareId}"]` }, 'error');
    }

    console.log('[DEBUG-WORKITEM:assetshare:continue] ✅ Share button clicked - processing:', { shareId, assetType, instanceNumber });

    // Process the share action
    processShareAction(shareButton, shareId, assetType, instanceNumber);
}

/**
 * Process the actual share action
 */
function processShareAction(shareButton, shareId, assetType, instanceNumber) {
    // Disable button during processing
    const originalContent = shareButton.innerHTML;
    shareButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SHARING...';
    shareButton.disabled = true;
    shareButton.style.backgroundColor = '#f59e0b';

    console.log('[DEBUG-WORKITEM:assetshare:continue] 🔄 Calling DotNet method ShareAsset...');

    // TOASTR: Show processing initiation
    if (typeof window.showNoorToast === 'function') {
        window.showNoorToast(
            `Initiating share for ${assetType} #${instanceNumber}...`,
            '🚀 Processing Share',
            'info'
        );
        console.log('[DEBUG-WORKITEM:sharebutton-toastr] 📢 TOASTR: Share processing notification shown');
    }

    // Show method call initiation
    showShareDebugToast('🔄 CALLING C# METHOD...', { shareId, assetType, instanceNumber }, 'info');

    // Call C# method via DotNet interop
    if (window.hostControlPanelState.dotNetRef) {
        console.log('[DEBUG-WORKITEM:assetshare:continue] 📞 DotNet reference available, invoking ShareAsset...');

        // Show DotNet reference status
        showShareDebugToast('📞 DOTNET REFERENCE FOUND', { hasReference: true, method: 'ShareAsset' }, 'success');

        window.hostControlPanelState.dotNetRef.invokeMethodAsync('ShareAsset', shareId, assetType, instanceNumber)
            .then((result) => {
                console.log('[DEBUG-WORKITEM:assetshare:continue] ✅ ShareAsset completed successfully:', result);

                // Show success result
                showShareDebugToast('🎉 SHARE SUCCESS!', result, 'success');

                // Success feedback
                shareButton.innerHTML = '✅ SHARED!';
                shareButton.style.backgroundColor = '#059669';

                // Restore button after 3 seconds
                setTimeout(() => {
                    shareButton.innerHTML = originalContent;
                    shareButton.style.backgroundColor = '';
                    shareButton.disabled = false;
                }, 3000);
            })
            .catch((error) => {
                console.error('[DEBUG-WORKITEM:assetshare:continue] ❌ ShareAsset failed:', error);

                // Show error details
                showShareDebugToast('💥 SHARE FAILED!', { error: error.toString(), shareId, assetType }, 'error');

                // Error feedback
                shareButton.innerHTML = '❌ ERROR';
                shareButton.style.backgroundColor = '#dc2626';

                // Restore button after error
                setTimeout(() => {
                    shareButton.innerHTML = originalContent;
                    shareButton.style.backgroundColor = '';
                    shareButton.disabled = false;
                }, 3000);
            });
    } else {
        console.error('[DEBUG-WORKITEM:assetshare:continue] ❌ DotNet reference not available');

        // Show DotNet reference error
        showShareDebugToast('❌ NO DOTNET REFERENCE', { hasReference: false, windowDotNetRef: !!window.hostControlPanelState.dotNetRef }, 'error');

        // TOASTR: Show DotNet reference error
        if (typeof window.showNoorToast === 'function') {
            window.showNoorToast(
                'Share functionality not available. Please refresh the page to reconnect.',
                'System Error',
                'error'
            );
            console.log('[DEBUG-WORKITEM:sharebutton-toastr] 📢 TOASTR: DotNet reference error notification shown');
        } else {
            alert('DotNet reference not available. Please refresh the page.');
        }

        shareButton.innerHTML = originalContent;
        shareButton.style.backgroundColor = '';
        shareButton.disabled = false;
    }
}

/**
 * Show debug toast messages for development
 */
function showShareDebugToast(title, data, type = 'info') {
    if (!window.hostControlPanelState.debugMode) return;

    // Create or update debug toast container
    let toastContainer = document.getElementById('debug-toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'debug-toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    const typeColors = {
        info: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        payload: '#8B5CF6'
    };

    toast.style.cssText = `
        background: white;
        border-left: 4px solid ${typeColors[type] || typeColors.info};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        margin-bottom: 10px;
        padding: 12px 16px;
        pointer-events: auto;
        animation: slideIn 0.3s ease-out;
    `;

    toast.innerHTML = `
        <div style="font-weight: 600; font-size: 14px; color: #1F2937; margin-bottom: 4px;">
            ${title}
        </div>
        <div style="font-size: 12px; color: #6B7280; font-family: monospace;">
            ${JSON.stringify(data, null, 2).substring(0, 200)}${JSON.stringify(data).length > 200 ? '...' : ''}
        </div>
    `;

    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    toastContainer.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

/**
 * Set the DotNet reference for JavaScript interop
 */
function setDotNetReference(dotNetRef) {
    window.hostControlPanelState.dotNetRef = dotNetRef;
    console.log('[DEBUG-WORKITEM:assetshare:continue] DotNet reference set:', !!dotNetRef);
}

/**
 * Enable or disable debug mode
 */
function setDebugMode(enabled) {
    window.hostControlPanelState.debugMode = enabled;
    console.log('[DEBUG-WORKITEM:assetshare:continue] Debug mode:', enabled ? 'ENABLED' : 'DISABLED');
}

/**
 * Get current state for debugging
 */
function getHostControlPanelState() {
    return window.hostControlPanelState;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeShareButtons);
} else {
    initializeShareButtons();
}

console.log('[DEBUG-WORKITEM:assetshare:continue] Host Control Panel JavaScript loaded');