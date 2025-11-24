/**
 * [REFACTOR:Phase1] Share Button Handlers Module
 * Extracted from HostControlPanel.razor inline JavaScript
 * Manages share button event handlers and ShareID button display
 */

/**
 * Set up share button handlers for transcript assets
 * @param {object} dotNetObjectRef - .NET object reference for Blazor interop
 */
function setupShareButtonHandlers(dotNetObjectRef) {
    console.log('[SHARE-BUTTONS] Setting up share button handlers');

    // Store reference globally
    window.hostControlPanelRef = dotNetObjectRef;

    // Find all share buttons in the transcript
    const shareButtons = document.querySelectorAll('button[data-share-id]');

    console.log(`[SHARE-BUTTONS] Found ${shareButtons.length} share buttons`);

    shareButtons.forEach((button, index) => {
        const shareId = button.dataset.shareId;
        const assetType = button.dataset.assetType || 'unknown';
        const instanceNumber = parseInt(button.dataset.instance || '1', 10);

        console.log(`[SHARE-BUTTONS] Button ${index + 1}: shareId=${shareId}, type=${assetType}, instance=${instanceNumber}`);

        // Remove existing listeners to avoid duplicates
        button.replaceWith(button.cloneNode(true));
        const newButton = document.querySelectorAll('button[data-share-id]')[index];

        // Add click event listener
        newButton.addEventListener('click', function (event) {
            handleShareButtonClick(event, shareId, assetType, instanceNumber);
        });
    });

    console.log('[SHARE-BUTTONS] Share button handlers setup complete');
}

/**
 * Handle share button click event
 * @param {Event} event - Click event
 * @param {string} shareId - Share identifier
 * @param {string} assetType - Asset type
 * @param {number} instanceNumber - Instance number
 */
function handleShareButtonClick(event, shareId, assetType, instanceNumber) {
    console.log('[SHARE-BUTTONS] Share button clicked:', { shareId, assetType, instanceNumber });

    event.preventDefault();
    event.stopPropagation();

    try {
        // Show button ID toast for debugging
        showButtonIdToast(shareId, assetType);

        // Call Blazor interop method
        if (window.hostControlPanelRef) {
            window.hostControlPanelRef.invokeMethodAsync(
                'ShareAsset',
                shareId,
                assetType,
                instanceNumber
            ).then(() => {
                console.log('[SHARE-BUTTONS] Share asset invoked successfully');
                window.showFabClickToast?.(`Shared ${assetType} asset`);
            }).catch(error => {
                console.error('[SHARE-BUTTONS] Error invoking ShareAsset:', error);
                window.showErrorToast?.(`Failed to share asset: ${error.message}`);
            });
        } else {
            console.error('[SHARE-BUTTONS] hostControlPanelRef not available');
            window.showErrorToast?.('Share functionality not initialized');
        }

    } catch (error) {
        console.error('[SHARE-BUTTONS] Error in handleShareButtonClick:', error);
        window.showErrorToast?.(`Share button error: ${error.message}`);
    }
}

/**
 * Show button ID toast for debugging
 * @param {string} buttonId - Button identifier
 * @param {string} assetType - Asset type
 */
function showButtonIdToast(buttonId, assetType) {
    if (window.notyf) {
        window.notyf.open({
            type: 'info',
            message: `🔘 Button Clicked: ${buttonId} (${assetType})`,
            duration: 2000,
            dismissible: true,
            position: { x: 'center', y: 'bottom' },
            background: '#6366F1'
        });
    }

    console.log(`[SHARE-BUTTONS] Button ID toast shown: ${buttonId} (${assetType})`);
}

/**
 * Initialize NOOR Share System - simplified and reliable
 */
async function initializeNoorShareSystem() {
    console.log('[SHARE-BUTTONS] Initializing NOOR Share System');

    try {
        // Wait for DOM to be ready
        await new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });

        // Find all share buttons
        const shareButtons = document.querySelectorAll('button[data-share-id]');
        console.log(`[SHARE-BUTTONS] Found ${shareButtons.length} share buttons to initialize`);

        // Initialize handlers if buttons exist
        if (shareButtons.length > 0 && window.hostControlPanelRef) {
            setupShareButtonHandlers(window.hostControlPanelRef);
        } else {
            console.warn('[SHARE-BUTTONS] No share buttons found or Blazor ref not available');
        }

    } catch (error) {
        console.error('[SHARE-BUTTONS] Error initializing share system:', error);
    }
}

// Export functions to global scope
window.setupShareButtonHandlers = setupShareButtonHandlers;
window.handleShareButtonClick = handleShareButtonClick;
window.showButtonIdToast = showButtonIdToast;
window.initializeNoorShareSystem = initializeNoorShareSystem;

console.log('[SHARE-BUTTONS] Share button handlers module loaded');
