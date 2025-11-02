/**
 * Participant FAB Button Injection
 * 
 * This script injects a wrapper div with a FAB (Floating Action Button) around
 * shared assets in the participant view (SessionCanvas).
 * 
 * Purpose: Allow participants to see a visual indicator when content is shared
 * Location: Injected into SessionCanvas.razor participant view
 * 
 * [WORKITEM:hcp-fab-button] Participant-side FAB button wrapper injection
 */

(function () {
    'use strict';

    console.log('[PARTICIPANT-FAB-INJECT] ════════ Script loaded ════════');

    /**
     * Inject FAB button wrapper around asset content
     * Called after content is rendered in participant view
     */
    window.injectParticipantFabWrapper = function () {
        console.log('[PARTICIPANT-FAB-INJECT] ════════ INJECTION STARTED ════════');

        try {
            // Find the asset content container
            const assetContent = document.querySelector('.canvas-asset-content');

            if (!assetContent) {
                console.warn('[PARTICIPANT-FAB-INJECT] ⚠️ Asset content container not found (.canvas-asset-content)');
                console.log('[PARTICIPANT-FAB-INJECT] Searching for alternative selectors...');

                // Try alternative selectors
                const alternatives = [
                    '.islamic-content',
                    '[data-theme="narrow"]',
                    '.canvas-content-area > div'
                ];

                for (const selector of alternatives) {
                    const alt = document.querySelector(selector);
                    if (alt) {
                        console.log(`[PARTICIPANT-FAB-INJECT] Found alternative: ${selector}`);
                        injectWrapperAround(alt);
                        return;
                    }
                }

                console.error('[PARTICIPANT-FAB-INJECT] ❌ No suitable container found for injection');
                return;
            }

            console.log('[PARTICIPANT-FAB-INJECT] ✅ Asset content container found');
            console.log('[PARTICIPANT-FAB-INJECT] Container classes:', assetContent.className);
            console.log('[PARTICIPANT-FAB-INJECT] Container innerHTML length:', assetContent.innerHTML.length);
            console.log('[PARTICIPANT-FAB-INJECT] Container first 100 chars:', assetContent.innerHTML.substring(0, 100));

            injectWrapperAround(assetContent);

        } catch (error) {
            console.error('[PARTICIPANT-FAB-INJECT] ❌ Exception during injection:', error);
            console.error('[PARTICIPANT-FAB-INJECT] Stack trace:', error.stack);
        }
    };

    /**
     * Inject wrapper around specific element
     */
    function injectWrapperAround(element) {
        console.log('[PARTICIPANT-FAB-INJECT] Injecting wrapper around element:', element);

        // Check if already wrapped
        if (element.parentElement?.classList.contains('fab-button-wrapper')) {
            console.log('[PARTICIPANT-FAB-INJECT] ⚠️ Element already wrapped, skipping');
            return;
        }

        // Create wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = 'fab-button-wrapper participant-view';
        wrapper.style.position = 'relative';
        wrapper.style.display = 'block';
        wrapper.style.width = '100%';

        console.log('[PARTICIPANT-FAB-INJECT] Created wrapper div with classes:', wrapper.className);

        // Create FAB button
        const fabButton = document.createElement('button');
        fabButton.className = 'participant-fab-button';
        fabButton.style.position = 'absolute';
        fabButton.style.top = '10px';
        fabButton.style.right = '10px';
        fabButton.style.width = '40px';
        fabButton.style.height = '40px';
        fabButton.style.borderRadius = '50%';
        fabButton.style.backgroundColor = 'rgba(34, 139, 34, 0.9)'; // Forest green
        fabButton.style.border = 'none';
        fabButton.style.color = 'white';
        fabButton.style.fontSize = '18px';
        fabButton.style.cursor = 'default';
        fabButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        fabButton.style.zIndex = '1000';
        fabButton.style.display = 'flex';
        fabButton.style.alignItems = 'center';
        fabButton.style.justifyContent = 'center';
        fabButton.innerHTML = '📤'; // Share icon emoji
        fabButton.title = 'Shared content from host';
        fabButton.disabled = true; // Read-only for participants

        console.log('[PARTICIPANT-FAB-INJECT] Created FAB button');
        console.log('[PARTICIPANT-FAB-INJECT] Button position: absolute top:10px right:10px');
        console.log('[PARTICIPANT-FAB-INJECT] Button size: 40x40px circular');

        // Insert wrapper before the element
        const parent = element.parentNode;
        if (!parent) {
            console.error('[PARTICIPANT-FAB-INJECT] ❌ Element has no parent node');
            return;
        }

        console.log('[PARTICIPANT-FAB-INJECT] Parent node:', parent.tagName, parent.className);

        // Insert wrapper in place of element
        parent.insertBefore(wrapper, element);

        // Move element into wrapper
        wrapper.appendChild(element);

        // Add FAB button to wrapper
        wrapper.appendChild(fabButton);

        console.log('[PARTICIPANT-FAB-INJECT] ✅ Wrapper injected successfully');
        console.log('[PARTICIPANT-FAB-INJECT] Wrapper structure:', wrapper.outerHTML.substring(0, 200));
        console.log('[PARTICIPANT-FAB-INJECT] ════════ INJECTION COMPLETE ════════');

        // Verify injection
        setTimeout(() => {
            const check = document.querySelector('.fab-button-wrapper.participant-view');
            if (check) {
                console.log('[PARTICIPANT-FAB-INJECT] ✅ VERIFICATION: Wrapper is in DOM');
                console.log('[PARTICIPANT-FAB-INJECT] Wrapper visible:', check.offsetWidth > 0 && check.offsetHeight > 0);
                console.log('[PARTICIPANT-FAB-INJECT] Wrapper dimensions:', check.offsetWidth, 'x', check.offsetHeight);

                const button = check.querySelector('.participant-fab-button');
                if (button) {
                    console.log('[PARTICIPANT-FAB-INJECT] ✅ VERIFICATION: FAB button is in DOM');
                    console.log('[PARTICIPANT-FAB-INJECT] Button visible:', button.offsetWidth > 0 && button.offsetHeight > 0);
                    console.log('[PARTICIPANT-FAB-INJECT] Button dimensions:', button.offsetWidth, 'x', button.offsetHeight);
                    console.log('[PARTICIPANT-FAB-INJECT] Button position from wrapper:', {
                        top: button.offsetTop,
                        left: button.offsetLeft,
                        right: check.offsetWidth - button.offsetLeft - button.offsetWidth
                    });
                } else {
                    console.error('[PARTICIPANT-FAB-INJECT] ❌ VERIFICATION FAILED: Button not found in wrapper');
                }
            } else {
                console.error('[PARTICIPANT-FAB-INJECT] ❌ VERIFICATION FAILED: Wrapper not found in DOM');
            }
        }, 100);
    }

    /**
     * Auto-inject when DOM is ready
     */
    if (document.readyState === 'loading') {
        console.log('[PARTICIPANT-FAB-INJECT] DOM not ready, waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[PARTICIPANT-FAB-INJECT] DOMContentLoaded fired');
            // Don't auto-inject, wait for explicit call from Blazor
            console.log('[PARTICIPANT-FAB-INJECT] Waiting for Blazor to call injectParticipantFabWrapper()');
        });
    } else {
        console.log('[PARTICIPANT-FAB-INJECT] DOM already ready');
        console.log('[PARTICIPANT-FAB-INJECT] Waiting for Blazor to call injectParticipantFabWrapper()');
    }

    console.log('[PARTICIPANT-FAB-INJECT] ✅ Function registered: window.injectParticipantFabWrapper()');

})();
