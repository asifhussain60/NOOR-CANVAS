/**
 * Asset Sidebar JavaScript Support
 * Provides DOM interaction functions for the AssetSidebar component
 */

/**
 * Detect assets in the current DOM and return their metadata
 * @returns {string} JSON string of detected assets
 */
function detectAssetsInDOM() {
    console.log('[ASSET-SIDEBAR-JS] Starting asset detection in DOM');

    const detectedAssets = [];

    // Asset type configurations (matching the server-side logic)
    const assetConfigs = [
        { type: 'ayah-card', selector: '.ayah-card', displayName: 'Ayah Card' },
        { type: 'verse-container', selector: '.verse-container', displayName: 'Verse Container' },
        { type: 'inserted-hadees', selector: '.inserted-hadees', displayName: 'Inserted Hadees' },
        { type: 'table', selector: 'table[style="width: 100%;"]', displayName: 'Table' },
        { type: 'imgResponsive', selector: '.imgResponsive', displayName: 'Responsive Image' },
        { type: 'etymology-card', selector: '.etymology-card', displayName: 'Etymology Card' },
        { type: 'etymology-derivative-card', selector: '.etymology-derivative-card', displayName: 'Etymology Derivative Card' },
        { type: 'esotericBlock', selector: '.esotericBlock', displayName: 'Esoteric Block' }
    ];

    // Process each asset type
    assetConfigs.forEach(config => {
        const elements = document.querySelectorAll(config.selector);
        console.log(`[ASSET-SIDEBAR-JS] Found ${elements.length} elements for ${config.type}`);

        elements.forEach((element, index) => {
            const instanceNumber = index + 1;
            const shareId = `asset-${config.type}-${instanceNumber}`;

            // Extract preview text
            let previewText = '';
            if (element.textContent) {
                previewText = element.textContent.trim().substring(0, 150);
            } else if (element.innerText) {
                previewText = element.innerText.trim().substring(0, 150);
            }

            // Add data attribute for linking
            element.setAttribute('data-asset-id', shareId);

            detectedAssets.push({
                ShareId: shareId,
                AssetType: config.type,
                DisplayName: config.displayName,
                InstanceNumber: instanceNumber,
                PreviewText: previewText,
                IsSharing: false
            });
        });
    });

    console.log(`[ASSET-SIDEBAR-JS] Total detected assets: ${detectedAssets.length}`);
    return JSON.stringify(detectedAssets);
}

/**
 * Scroll to a specific asset in the content
 * @param {string} shareId - The share ID of the asset to scroll to
 */
function scrollToAsset(shareId) {
    const element = document.querySelector(`[data-asset-id="${shareId}"]`);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        console.log(`[ASSET-SIDEBAR-JS] Scrolled to asset: ${shareId}`);

        // Add temporary highlight
        highlightAsset(shareId, 2000);
    } else {
        console.warn(`[ASSET-SIDEBAR-JS] Asset not found for scrolling: ${shareId}`);
    }
}

/**
 * Highlight an asset element temporarily
 * @param {string} shareId - The share ID of the asset to highlight
 * @param {number} duration - How long to highlight (ms), default 3000
 */
function highlightAsset(shareId, duration = 3000) {
    const element = document.querySelector(`[data-asset-id="${shareId}"]`);
    if (element) {
        // Store original styles
        const originalBorder = element.style.border;
        const originalBoxShadow = element.style.boxShadow;
        const originalTransition = element.style.transition;

        // Apply highlight styles
        element.style.transition = 'all 0.3s ease';
        element.style.border = '2px solid #3b82f6';
        element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.3)';

        console.log(`[ASSET-SIDEBAR-JS] Highlighting asset: ${shareId}`);

        // Remove highlight after duration
        setTimeout(() => {
            element.style.transition = originalTransition;
            element.style.border = originalBorder;
            element.style.boxShadow = originalBoxShadow;
            console.log(`[ASSET-SIDEBAR-JS] Highlight removed for asset: ${shareId}`);
        }, duration);
    } else {
        console.warn(`[ASSET-SIDEBAR-JS] Asset not found for highlighting: ${shareId}`);
    }
}

/**
 * Check if an asset element exists in the DOM
 * @param {string} shareId - The share ID to check
 * @returns {boolean} True if the asset exists
 */
function assetExists(shareId) {
    const element = document.querySelector(`[data-asset-id="${shareId}"]`);
    return !!element;
}

/**
 * Get asset element information for debugging
 * @param {string} shareId - The share ID to inspect
 * @returns {object} Asset element information
 */
function getAssetInfo(shareId) {
    const element = document.querySelector(`[data-asset-id="${shareId}"]`);
    if (element) {
        return {
            exists: true,
            tagName: element.tagName,
            className: element.className,
            textLength: element.textContent?.length || 0,
            previewText: element.textContent?.substring(0, 100) || '',
            position: {
                top: element.offsetTop,
                left: element.offsetLeft,
                width: element.offsetWidth,
                height: element.offsetHeight
            }
        };
    }
    return { exists: false };
}

/**
 * Pulse all detected assets for visual identification
 */
function pulseAllAssets() {
    const assets = document.querySelectorAll('[data-asset-id]');
    console.log(`[ASSET-SIDEBAR-JS] Pulsing ${assets.length} assets`);

    assets.forEach((asset, index) => {
        setTimeout(() => {
            const original = asset.style.transform;
            asset.style.transition = 'transform 0.3s ease';
            asset.style.transform = 'scale(1.05)';

            setTimeout(() => {
                asset.style.transform = original;
            }, 300);
        }, index * 100); // Stagger the pulse effect
    });
}

/**
 * Inject FAB share buttons for each detected asset
 * Wraps assets in containers and adds floating share buttons above each
 * @param {object} dotNetRef - Reference to .NET component for callbacks
 * @returns {object} Injection result with count and success status
 */
function injectAssetShareButtons(dotNetRef) {
    console.log('[ASSET-FAB-INJECT] Starting FAB button injection for assets');

    let injectedCount = 0;
    const assets = document.querySelectorAll('[data-asset-id]');

    console.log(`[ASSET-FAB-INJECT] Found ${assets.length} assets with data-asset-id`);

    assets.forEach((asset) => {
        const assetId = asset.getAttribute('data-asset-id');

        // Skip if button already injected
        if (asset.parentElement?.classList.contains('asset-fab-wrapper')) {
            console.log(`[ASSET-FAB-INJECT] Button already injected for: ${assetId}`);
            return;
        }

        // Parse asset type and instance number from assetId (format: asset-{type}-{number})
        const parts = assetId.split('-');
        const assetType = parts.slice(1, -1).join('-'); // e.g., 'ayah-card' from 'asset-ayah-card-1'
        const instanceNumber = parseInt(parts[parts.length - 1]) || 1;

        // Create wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = 'asset-fab-wrapper';
        wrapper.style.position = 'relative';
        wrapper.style.marginBottom = '20px';

        // Create FAB button
        const fabButton = document.createElement('button');
        fabButton.id = `share-btn-${assetId}`;
        fabButton.className = 'ks-share-btn asset-fab-button';
        fabButton.setAttribute('data-asset-id', assetId);
        fabButton.setAttribute('data-asset-type', assetType);
        fabButton.setAttribute('data-instance-number', instanceNumber);
        fabButton.setAttribute('data-share-button', 'asset');

        // Style the FAB button
        fabButton.style.position = 'absolute';
        fabButton.style.top = '-45px';
        fabButton.style.right = '10px';
        fabButton.style.zIndex = '1000';
        fabButton.style.backgroundColor = '#3b82f6';
        fabButton.style.color = 'white';
        fabButton.style.border = '2px solid #2563eb';
        fabButton.style.borderRadius = '8px';
        fabButton.style.padding = '10px 16px';
        fabButton.style.cursor = 'pointer';
        fabButton.style.fontSize = '13px';
        fabButton.style.fontWeight = 'bold';
        fabButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        fabButton.style.transition = 'all 0.2s ease';
        fabButton.style.minWidth = '140px';
        fabButton.style.textAlign = 'center';

        // Button content
        fabButton.innerHTML = `<i class="fa-solid fa-share"></i> SHARE`;

        // Wrap asset in container
        asset.parentNode.insertBefore(wrapper, asset);
        wrapper.appendChild(fabButton);
        wrapper.appendChild(asset);

        injectedCount++;
        console.log(`[ASSET-FAB-INJECT] ✅ Injected button for ${assetId} (${assetType} #${instanceNumber})`);
    });

    const result = {
        success: true,
        injectedCount: injectedCount,
        totalAssets: assets.length,
        message: `Injected ${injectedCount} FAB buttons for ${assets.length} assets`
    };

    console.log('[ASSET-FAB-INJECT] Injection complete:', result);
    return result;
}

/**
 * Remove all injected FAB buttons (cleanup)
 * @returns {object} Removal result
 */
function removeAssetShareButtons() {
    console.log('[ASSET-FAB-INJECT] Removing all FAB buttons');

    const wrappers = document.querySelectorAll('.asset-fab-wrapper');
    let removedCount = 0;

    wrappers.forEach((wrapper) => {
        const asset = wrapper.querySelector('[data-asset-id]');
        if (asset && wrapper.parentNode) {
            // Unwrap: move asset back to original position
            wrapper.parentNode.insertBefore(asset, wrapper);
            wrapper.remove();
            removedCount++;
        }
    });

    console.log(`[ASSET-FAB-INJECT] Removed ${removedCount} FAB button wrappers`);
    return {
        success: true,
        removedCount: removedCount
    };
}

// Initialize asset sidebar JavaScript
console.log('[ASSET-SIDEBAR-JS] Asset sidebar JavaScript loaded');

// Export functions to global scope for Blazor interop
window.detectAssetsInDOM = detectAssetsInDOM;
window.scrollToAsset = scrollToAsset;
window.highlightAsset = highlightAsset;
window.assetExists = assetExists;
window.getAssetInfo = getAssetInfo;
window.pulseAllAssets = pulseAllAssets;
window.injectAssetShareButtons = injectAssetShareButtons;
window.removeAssetShareButtons = removeAssetShareButtons;