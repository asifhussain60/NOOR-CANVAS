/**
 * [REFACTOR:Phase1] Asset Sharing Module
 * Extracted from HostControlPanel.razor inline JavaScript
 * Handles individual asset and SignalR-based asset sharing
 */

/**
 * Share an individual asset via Blazor interop
 * @param {string} assetId - Unique asset identifier
 * @param {string} assetType - Type of asset (ayah-card, hadith-card, etc.)
 */
window.shareIndividualAsset = async function (assetId, assetType) {
    console.log(`[ASSET-SHARE] shareIndividualAsset called: assetId=${assetId}, assetType=${assetType}`);

    try {
        // Find the asset element
        const assetElement = document.querySelector(`[data-asset-id="${assetId}"]`);

        if (!assetElement) {
            console.error(`[ASSET-SHARE] Asset element not found: ${assetId}`);
            window.showErrorToast?.(`Asset not found: ${assetId}`);
            return;
        }

        // Get share button instance count from data attribute
        const shareButton = document.querySelector(`button[onclick*="${assetId}"]`);
        let instanceNumber = 1;

        if (shareButton && shareButton.dataset.instance) {
            instanceNumber = parseInt(shareButton.dataset.instance, 10);
        }

        console.log(`[ASSET-SHARE] Calling Blazor ShareAsset: shareId=${assetId}, type=${assetType}, instance=${instanceNumber}`);

        // Call Blazor component method via DotNetObjectRef
        if (window.hostControlPanelRef) {
            await window.hostControlPanelRef.invokeMethodAsync(
                'ShareAsset',
                assetId,
                assetType,
                instanceNumber
            );
        } else {
            console.error('[ASSET-SHARE] hostControlPanelRef not initialized');
            window.showErrorToast?.('Asset sharing not initialized');
        }

    } catch (error) {
        console.error('[ASSET-SHARE] Error in shareIndividualAsset:', error);
        window.showErrorToast?.(`Asset sharing failed: ${error.message}`);
    }
};

/**
 * Share asset via SignalR hub connection
 * @param {string} shareId - Share identifier
 * @param {string} assetType - Asset type
 * @param {number} instanceCount - Instance number
 * @param {string} uniqueAssetId - Unique asset ID
 */
window.shareAssetViaSignalR = async function (shareId, assetType, instanceCount, uniqueAssetId) {
    console.log(`[ASSET-SHARE-SIGNALR] Called with: shareId=${shareId}, type=${assetType}, instance=${instanceCount}, uniqueId=${uniqueAssetId}`);

    try {
        // Extract HTML content
        const assetElement = document.querySelector(`[data-asset-id="${uniqueAssetId}"]`);

        if (!assetElement) {
            console.error(`[ASSET-SHARE-SIGNALR] Asset element not found: ${uniqueAssetId}`);
            return;
        }

        const assetHtml = assetElement.outerHTML;

        // Call Blazor interop
        if (window.hostControlPanelRef) {
            await window.hostControlPanelRef.invokeMethodAsync(
                'ShareAsset',
                shareId,
                assetType,
                instanceCount
            );

            console.log('[ASSET-SHARE-SIGNALR] Successfully called Blazor ShareAsset method');
        } else {
            console.error('[ASSET-SHARE-SIGNALR] hostControlPanelRef not available');
        }

    } catch (error) {
        console.error('[ASSET-SHARE-SIGNALR] Error sharing asset:', error);
        window.showErrorToast?.(`Failed to share asset: ${error.message}`);
    }
};

console.log('[ASSET-SHARE] Asset sharing module loaded');
