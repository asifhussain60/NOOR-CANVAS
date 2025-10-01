/**
 * Host Control Panel JavaScript - Utilities Only
 * Share functionality handled by noor-share-system.js (definitive system)
 */

// Global variables for host control panel state management
window.hostControlPanelState = {
    dotNetRef: null,
    debugMode: true
};

// Legacy share button functionality removed - handled by noor-share-system.js

// Legacy processShareAction removed - functionality handled by noor-share-system.js

// Legacy showShareDebugToast removed - debug functionality available in noor-share-system.js

/**
 * Set the DotNet reference for JavaScript interop (legacy compatibility)
 */
function setDotNetReference(dotNetRef) {
    window.hostControlPanelState.dotNetRef = dotNetRef;
    console.log('[NOOR-SHARE] Legacy DotNet reference set (use noor-share-system.js instead):', !!dotNetRef);
}

/**
 * Enable or disable debug mode (legacy compatibility)
 */
function setDebugMode(enabled) {
    window.hostControlPanelState.debugMode = enabled;
    console.log('[NOOR-SHARE] Legacy debug mode:', enabled ? 'ENABLED' : 'DISABLED');
}

/**
 * Get current state for debugging
 */
function getHostControlPanelState() {
    return window.hostControlPanelState;
}

console.log('[NOOR-SHARE] Host Control Panel utilities loaded (share system: noor-share-system.js)');