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

// Initialize asset sidebar JavaScript
console.log('[ASSET-SIDEBAR-JS] Asset sidebar JavaScript loaded');

// Export functions to global scope for Blazor interop
window.detectAssetsInDOM = detectAssetsInDOM;
window.scrollToAsset = scrollToAsset;
window.highlightAsset = highlightAsset;
window.assetExists = assetExists;
window.getAssetInfo = getAssetInfo;
window.pulseAllAssets = pulseAllAssets;