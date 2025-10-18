/**
 * Transcript Section Parser & Share Button Injector
 * [DEBUG-WORKITEM:hcp-tcanvas:parse] Parses transcript HTML to identify h2 groups and inject share buttons ;CLEANUP_OK
 * 
 * Architecture:
 * - Parses HTML to find all h2 elements
 * - Groups content between consecutive h2 tags
 * - Injects share buttons after each h2
 * - Uses event delegation for click handling (SessionCanvas pattern)
 */

window.TranscriptSectionParser = {
    /**
     * Parse transcript HTML and inject share buttons for each h2 section
     * @param {string} containerId - ID of the container element holding transcript HTML
     * @param {object} dotNetRef - DotNet object reference for C# method callbacks
     * @returns {object} Result with section count and success status
     */
    injectShareButtons: function (containerId, dotNetRef) {
        console.log('[TRACE:hcp-tcanvas:inject] ════════ BUTTON INJECTION START ════════ ;CLEANUP_OK');
        console.log('[TRACE:hcp-tcanvas:inject] ContainerId:', containerId, ';CLEANUP_OK');

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[TRACE:hcp-tcanvas:inject] ❌ Container NOT FOUND:', containerId, ';CLEANUP_OK');
            console.error('[TRACE:hcp-tcanvas:inject] Available IDs in document:', Array.from(document.querySelectorAll('[id]')).map(el => el.id), ';CLEANUP_OK');
            return { success: false, sections: 0, error: 'Container not found' };
        }

        console.log('[TRACE:hcp-tcanvas:inject] ✅ Container found ;CLEANUP_OK');
        console.log('[TRACE:hcp-tcanvas:inject] Container innerHTML length:', container.innerHTML.length, ';CLEANUP_OK');
        console.log('[TRACE:hcp-tcanvas:inject] Container first 500 chars:', container.innerHTML.substring(0, 500), ';CLEANUP_OK');

        // Find all h2 elements in the transcript
        const h2Elements = container.querySelectorAll('h2');
        console.log(`[TRACE:hcp-tcanvas:inject] Found ${h2Elements.length} h2 elements ;CLEANUP_OK`);

        // Log details about each h2 found
        h2Elements.forEach((h2, idx) => {
            console.log(`[TRACE:hcp-tcanvas:inject] h2[${idx}]:`, {
                text: h2.textContent?.substring(0, 50),
                parent: h2.parentNode?.tagName,
                nextSibling: h2.nextElementSibling?.tagName || 'none',
                classes: h2.className
            }, ';CLEANUP_OK');
        });

        if (h2Elements.length === 0) {
            console.warn('[TRACE:hcp-tcanvas:inject] ⚠️ NO h2 elements found in transcript ;CLEANUP_OK');
            console.warn('[TRACE:hcp-tcanvas:inject] Checking for alternative selectors: ;CLEANUP_OK');
            console.warn('[TRACE:hcp-tcanvas:inject]   - All headings (h1-h6):', container.querySelectorAll('h1,h2,h3,h4,h5,h6').length, ';CLEANUP_OK');
            console.warn('[TRACE:hcp-tcanvas:inject]   - Direct children:', container.children.length, ';CLEANUP_OK');
            console.warn('[TRACE:hcp-tcanvas:inject]   - All descendants:', container.querySelectorAll('*').length, ';CLEANUP_OK');

            // Sample first 5 child elements for diagnosis
            Array.from(container.children).slice(0, 5).forEach((child, idx) => {
                console.warn(`[TRACE:hcp-tcanvas:inject]   Child[${idx}]:`, {
                    tagName: child.tagName,
                    className: child.className,
                    id: child.id,
                    text: child.textContent?.substring(0, 50)
                }, ';CLEANUP_OK');
            });

            return { success: true, sections: 0, error: 'No h2 sections found' };
        }

        let sectionsProcessed = 0;

        // Inject share button after each h2
        h2Elements.forEach((h2, index) => {
            // Check if button already exists (prevent duplicates)
            const existingButton = h2.nextElementSibling?.classList?.contains('transcript-section-share-btn');
            if (existingButton) {
                console.log(`[DEBUG-WORKITEM:hcp-tcanvas:parse] Share button already exists for section ${index}, skipping ;CLEANUP_OK`);
                return;
            }

            // Create share button
            const shareButton = document.createElement('button');
            shareButton.className = 'transcript-section-share-btn';
            shareButton.setAttribute('data-section-id', `section-${index}`);
            shareButton.setAttribute('data-h2-index', index.toString());
            shareButton.style.cssText = `
                background-color: #D4AF37;
                color: white;
                border: none;
                border-radius: 0.5rem;
                padding: 0.5rem 1rem;
                margin: 0.75rem 0;
                font-family: 'Inter', sans-serif;
                font-weight: 600;
                font-size: 0.875rem;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
            `;
            shareButton.innerHTML = '<i class="fa-solid fa-share-nodes"></i> SHARE SECTION';

            // Hover effects via inline event handlers (compatible with Blazor)
            shareButton.onmouseenter = function () {
                this.style.backgroundColor = '#C5B358';
                this.style.transform = 'translateY(-1px)';
                this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)';
            };
            shareButton.onmouseleave = function () {
                this.style.backgroundColor = '#D4AF37';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            };

            // Insert button after h2 element
            h2.parentNode.insertBefore(shareButton, h2.nextSibling);
            sectionsProcessed++;

            console.log(`[DEBUG-WORKITEM:hcp-tcanvas:parse] Injected share button for section ${index} ;CLEANUP_OK`);
        });

        // Set up click delegation on container (SessionCanvas pattern)
        this.setupClickDelegation(containerId, dotNetRef);

        console.log(`[DEBUG-WORKITEM:hcp-tcanvas:parse] Successfully injected ${sectionsProcessed} share buttons ;CLEANUP_OK`);
        return { success: true, sections: sectionsProcessed };
    },

    /**
     * Set up click event delegation on transcript container
     * @param {string} containerId - ID of the container element
     * @param {object} dotNetRef - DotNet object reference for C# callbacks
     */
    setupClickDelegation: function (containerId, dotNetRef) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[DEBUG-WORKITEM:hcp-tcanvas:parse] Cannot setup delegation - container not found');
            return;
        }

        // Remove existing listener to prevent duplicates
        if (container._transcriptSectionClickHandler) {
            container.removeEventListener('click', container._transcriptSectionClickHandler);
        }

        // Create new click handler
        const clickHandler = async function (event) {
            // Check if clicked element is a share button
            const shareButton = event.target.closest('.transcript-section-share-btn');

            if (!shareButton) {
                return; // Not a share button click, ignore
            }

            event.preventDefault();
            console.log('[DEBUG-WORKITEM:hcp-tcanvas:share-section] Share button clicked ;CLEANUP_OK');

            const sectionId = shareButton.getAttribute('data-section-id');
            const h2Index = parseInt(shareButton.getAttribute('data-h2-index'));

            console.log(`[DEBUG-WORKITEM:hcp-tcanvas:share-section] Sharing section: ${sectionId}, h2Index: ${h2Index} ;CLEANUP_OK`);

            // Visual feedback - button state
            const originalText = shareButton.innerHTML;
            const originalBg = shareButton.style.backgroundColor;
            shareButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SHARING...';
            shareButton.style.backgroundColor = '#f59e0b';
            shareButton.disabled = true;

            try {
                // Call C# method via DotNet interop (SessionCanvas pattern)
                console.log('[DEBUG-WORKITEM:hcp-tcanvas:share-section] Calling C# ShareTranscriptSection method ;CLEANUP_OK');
                await dotNetRef.invokeMethodAsync('ShareTranscriptSection', sectionId, h2Index);

                // Success feedback
                shareButton.innerHTML = '<i class="fa-solid fa-check"></i> SHARED';
                shareButton.style.backgroundColor = '#059669';

                setTimeout(() => {
                    shareButton.innerHTML = originalText;
                    shareButton.style.backgroundColor = originalBg;
                    shareButton.disabled = false;
                }, 2000);

                console.log('[DEBUG-WORKITEM:hcp-tcanvas:share-section] Section shared successfully ;CLEANUP_OK');
            } catch (error) {
                console.error('[DEBUG-WORKITEM:hcp-tcanvas:share-section] Error sharing section:', error);

                // Error feedback
                shareButton.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> ERROR';
                shareButton.style.backgroundColor = '#DC2626';

                setTimeout(() => {
                    shareButton.innerHTML = originalText;
                    shareButton.style.backgroundColor = originalBg;
                    shareButton.disabled = false;
                }, 3000);
            }
        };

        // Store handler reference for cleanup
        container._transcriptSectionClickHandler = clickHandler;

        // Add event listener with delegation
        container.addEventListener('click', clickHandler);
        console.log('[DEBUG-WORKITEM:hcp-tcanvas:parse] Click delegation setup complete ;CLEANUP_OK');
    },

    /**
     * Extract h2 section HTML (h2 + content until next h2 or end)
     * @param {string} containerId - ID of the container element
     * @param {number} h2Index - Index of the h2 element to extract
     * @returns {string} HTML string containing h2 and its content
     */
    extractSectionHtml: function (containerId, h2Index) {
        console.log(`[DEBUG-WORKITEM:hcp-tcanvas:parse] Extracting section HTML for h2Index: ${h2Index} ;CLEANUP_OK`);

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[DEBUG-WORKITEM:hcp-tcanvas:parse] Container not found');
            return '';
        }

        const h2Elements = container.querySelectorAll('h2');
        if (h2Index >= h2Elements.length) {
            console.error(`[DEBUG-WORKITEM:hcp-tcanvas:parse] Invalid h2Index: ${h2Index}, only ${h2Elements.length} h2 elements found`);
            return '';
        }

        const targetH2 = h2Elements[h2Index];
        const nextH2 = h2Elements[h2Index + 1] || null;

        // Collect h2 and all siblings until next h2 or end
        let sectionHtml = targetH2.outerHTML;
        let currentElement = targetH2.nextElementSibling;

        while (currentElement && currentElement !== nextH2) {
            // Skip share buttons (don't include in broadcast)
            if (!currentElement.classList.contains('transcript-section-share-btn')) {
                sectionHtml += currentElement.outerHTML;
            }
            currentElement = currentElement.nextElementSibling;
        }

        console.log(`[DEBUG-WORKITEM:hcp-tcanvas:parse] Extracted section HTML: ${sectionHtml.length} chars ;CLEANUP_OK`);
        return sectionHtml;
    }
};

console.log('[DEBUG-WORKITEM:hcp-tcanvas:parse] Transcript Section Parser loaded ;CLEANUP_OK');
