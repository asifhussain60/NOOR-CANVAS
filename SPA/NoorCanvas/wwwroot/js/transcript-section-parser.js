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
     * Wait for container to exist in DOM (polling with timeout)
     * @param {string} containerId - ID of the container to wait for
     * @param {number} maxAttempts - Maximum polling attempts (default: 20)
     * @param {number} intervalMs - Polling interval in ms (default: 250ms)
     * @returns {Promise<HTMLElement|null>} Container element or null if timeout
     */
    waitForContainer: async function (containerId, maxAttempts = 20, intervalMs = 250) {
        console.log('[TRACE:hcp-tcanvas:wait] Waiting for container:', containerId, ';CLEANUP_OK');

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const container = document.getElementById(containerId);
            if (container && container.innerHTML.length > 0) {
                console.log(`[TRACE:hcp-tcanvas:wait] ✅ Container found after ${attempt} attempts (${attempt * intervalMs}ms) ;CLEANUP_OK`);
                return container;
            }

            console.log(`[TRACE:hcp-tcanvas:wait] Attempt ${attempt}/${maxAttempts} - container ${container ? 'found but empty' : 'not found'} ;CLEANUP_OK`);
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }

        console.error(`[TRACE:hcp-tcanvas:wait] ❌ Container not found after ${maxAttempts * intervalMs}ms ;CLEANUP_OK`);
        return null;
    },

    /**
     * Parse transcript HTML and inject share buttons for each h2 section
     * @param {string} containerId - ID of the container element holding transcript HTML
     * @param {object} dotNetRef - DotNet object reference for C# method callbacks
     * @returns {Promise<object>} Result with section count and success status
     */
    injectShareButtons: async function (containerId, dotNetRef) {
        console.log('%c[TRACE:hcp-tcanvas:inject] ════════ BUTTON INJECTION START ════════', 'background: #006400; color: white; font-weight: bold; padding: 4px;', ';CLEANUP_OK');
        console.log('[TRACE:hcp-tcanvas:inject] Timestamp:', new Date().toISOString(), ';CLEANUP_OK');
        console.log('[TRACE:hcp-tcanvas:inject] ContainerId:', containerId, ';CLEANUP_OK');
        console.log('[TRACE:hcp-tcanvas:inject] DotNetRef provided:', !!dotNetRef, ';CLEANUP_OK');
        console.log('[TRACE:hcp-tcanvas:inject] Document ready state:', document.readyState, ';CLEANUP_OK');

        // Wait for container to exist with content
        console.log('%c[TRACE:hcp-tcanvas:inject] Waiting for container...', 'color: #D4AF37; font-weight: bold;', ';CLEANUP_OK');
        const container = await this.waitForContainer(containerId);
        
        if (!container) {
            console.error('%c[TRACE:hcp-tcanvas:inject] ❌ Container NOT FOUND after timeout', 'background: #DC2626; color: white; font-weight: bold; padding: 4px;', containerId, ';CLEANUP_OK');
            console.error('[TRACE:hcp-tcanvas:inject] Available IDs in document:', Array.from(document.querySelectorAll('[id]')).map(el => el.id), ';CLEANUP_OK');
            console.error('[TRACE:hcp-tcanvas:inject] All elements with transcript-* id:', Array.from(document.querySelectorAll('[id^="transcript"]')).map(el => ({ id: el.id, tag: el.tagName, visible: el.offsetParent !== null })), ';CLEANUP_OK');
            return { success: false, sections: 0, error: 'Container not found after waiting 5 seconds' };
        }

        console.log('%c[TRACE:hcp-tcanvas:inject] ✅ Container found!', 'background: #10B981; color: white; font-weight: bold; padding: 4px;', ';CLEANUP_OK');
        console.log('[TRACE:hcp-tcanvas:inject] Container innerHTML length:', container.innerHTML.length, 'chars ;CLEANUP_OK');
        console.log('[TRACE:hcp-tcanvas:inject] Container visible:', container.offsetParent !== null, ';CLEANUP_OK');
        console.log('[TRACE:hcp-tcanvas:inject] Container dimensions:', { width: container.offsetWidth, height: container.offsetHeight }, ';CLEANUP_OK');
        console.log('[TRACE:hcp-tcanvas:inject] Container first 800 chars:', container.innerHTML.substring(0, 800), ';CLEANUP_OK');

        // Find all h2 elements in the transcript
        const h2Elements = Array.from(container.querySelectorAll('h2'));
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
        console.log('%c[TRACE:hcp-tcanvas:inject] Starting section wrapping and button injection', 'background: #10B981; color: white; font-weight: bold; padding: 4px;', ';CLEANUP_OK');
        console.log('[TRACE:hcp-tcanvas:inject] Will process', h2Elements.length, 'sections ;CLEANUP_OK');

        // Process each h2: wrap section content and inject share button above
        h2Elements.forEach((h2, index) => {
            console.log(`%c[TRACE:hcp-tcanvas:inject] ━━━ Processing h2[${index}] ━━━`, 'color: #D4AF37; font-weight: bold;', ';CLEANUP_OK');
            console.log(`[TRACE:hcp-tcanvas:inject]   h2 text: "${h2.textContent?.substring(0, 80)}" ;CLEANUP_OK`);
            console.log(`[TRACE:hcp-tcanvas:inject]   h2 parent: ${h2.parentNode?.tagName}.${h2.parentNode?.className} ;CLEANUP_OK`);

            // Extract h2 text for button label
            const h2Text = h2.textContent?.trim() || `Section ${index + 1}`;
            const sectionId = `transcript-section-${index}`;

            // Collect all content from this h2 until the next h2 (or end of container)
            console.log(`[TRACE:hcp-tcanvas:inject]   Collecting content for section ${index}... ;CLEANUP_OK`);
            const sectionContent = [];
            let currentElement = h2;

            // Collect h2 and following siblings until next h2
            while (currentElement) {
                const nextElement = currentElement.nextElementSibling;

                // Stop if we hit another h2
                if (nextElement && nextElement.tagName === 'H2') {
                    console.log(`[TRACE:hcp-tcanvas:inject]   Stopped at next h2: "${nextElement.textContent?.substring(0, 50)}" ;CLEANUP_OK`);
                    break;
                }

                sectionContent.push(currentElement);
                currentElement = nextElement;
            }

            console.log(`[TRACE:hcp-tcanvas:inject]   ✅ Section ${index} contains ${sectionContent.length} elements ;CLEANUP_OK`);

            // Create invisible wrapper div for the section
            const wrapper = document.createElement('div');
            wrapper.id = sectionId;
            wrapper.setAttribute('data-section-index', index.toString());
            wrapper.style.cssText = 'position: relative;'; // Invisible container

            console.log(`[TRACE:hcp-tcanvas:inject]   Created wrapper div with id=${sectionId} ;CLEANUP_OK`);

            // Create share button to inject ABOVE the section
            const shareButton = document.createElement('button');
            shareButton.className = 'transcript-section-share-btn';
            shareButton.setAttribute('data-section-id', sectionId);
            shareButton.setAttribute('data-h2-index', index.toString());
            shareButton.setAttribute('data-h2-text', h2Text);
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
            shareButton.innerHTML = `<i class="fa-solid fa-share-nodes"></i> Share ${h2Text}`;

            // Hover effects
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

            console.log(`[TRACE:hcp-tcanvas:inject]   Created share button: "Share ${h2Text.substring(0, 40)}" ;CLEANUP_OK`);

            // Left-justify the h2 (ensure no centering)
            h2.style.textAlign = 'left';
            console.log(`[TRACE:hcp-tcanvas:inject]   Applied left text-align to h2[${index}] ;CLEANUP_OK`);

            // Insert share button BEFORE the first element of the section (before h2)
            const insertionPoint = sectionContent[0];
            console.log(`[TRACE:hcp-tcanvas:inject]   Insertion point: ${insertionPoint.tagName} ;CLEANUP_OK`);
            
            insertionPoint.parentNode.insertBefore(shareButton, insertionPoint);
            console.log(`[TRACE:hcp-tcanvas:inject]   ✅ Inserted share button above h2[${index}] ;CLEANUP_OK`);

            // Wrap section content in the invisible div
            // Insert wrapper before the first element
            insertionPoint.parentNode.insertBefore(wrapper, insertionPoint);

            // Move all section elements into wrapper
            sectionContent.forEach((element, elIdx) => {
                wrapper.appendChild(element);
                if (elIdx === 0) {
                    console.log(`[TRACE:hcp-tcanvas:inject]   Moving ${sectionContent.length} elements into wrapper... ;CLEANUP_OK`);
                }
            });

            console.log(`[TRACE:hcp-tcanvas:inject]   ✅ Wrapped section ${index} content in div#${sectionId} ;CLEANUP_OK`);

            sectionsProcessed++;
        });

        // Set up click delegation on container (SessionCanvas pattern)
        console.log('[TRACE:hcp-tcanvas:inject] Setting up click delegation on container... ;CLEANUP_OK');
        this.setupClickDelegation(containerId, dotNetRef);

        console.log('%c[TRACE:hcp-tcanvas:inject] ✅ SUCCESS!', 'background: #10B981; color: white; font-weight: bold; padding: 4px;', `Processed ${sectionsProcessed} sections ;CLEANUP_OK`);
        console.log('%c[TRACE:hcp-tcanvas:inject] ════════ BUTTON INJECTION COMPLETE ════════', 'background: #006400; color: white; font-weight: bold; padding: 4px;', ';CLEANUP_OK');
        
        // Final verification
        const verifyButtons = container.querySelectorAll('.transcript-section-share-btn');
        console.log('[TRACE:hcp-tcanvas:inject] Final verification - buttons in DOM:', verifyButtons.length, ';CLEANUP_OK');
        verifyButtons.forEach((btn, idx) => {
            console.log(`[TRACE:hcp-tcanvas:inject]   Button[${idx}]:`, {
                text: btn.textContent,
                visible: btn.offsetParent !== null,
                dimensions: { width: btn.offsetWidth, height: btn.offsetHeight }
            }, ';CLEANUP_OK');
        });
        
        return { success: true, sections: sectionsProcessed };
    },

    /**
     * Set up click event delegation on transcript container
     * @param {string} containerId - ID of the container element
     * @param {object} dotNetRef - DotNet object reference for C# callbacks
     */
    setupClickDelegation: function (containerId, dotNetRef) {
        console.log('[TRACE:hcp-tcanvas:delegation] Setting up click delegation... ;CLEANUP_OK');
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.error('%c[TRACE:hcp-tcanvas:delegation] ❌ Cannot setup delegation - container not found', 'background: #DC2626; color: white;', ';CLEANUP_OK');
            return;
        }

        console.log('[TRACE:hcp-tcanvas:delegation] ✅ Container found, attaching click listener... ;CLEANUP_OK');

        // Remove existing listener to prevent duplicates
        if (container._transcriptSectionClickHandler) {
            console.log('[TRACE:hcp-tcanvas:delegation] Removing old click handler to prevent duplicates ;CLEANUP_OK');
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
            console.log('%c[TRACE:hcp-tcanvas:share-section] ════════ SHARE SECTION CLICK ════════', 'background: #D4AF37; color: white; font-weight: bold; padding: 4px;', ';CLEANUP_OK');
            console.log('[TRACE:hcp-tcanvas:share-section] Button clicked:', shareButton.textContent, ';CLEANUP_OK');

            const sectionId = shareButton.getAttribute('data-section-id');
            const h2Index = parseInt(shareButton.getAttribute('data-h2-index'));
            const h2Text = shareButton.getAttribute('data-h2-text') || `Section ${h2Index}`;

            console.log(`[TRACE:hcp-tcanvas:share-section] Button clicked - sectionId: ${sectionId}, h2Index: ${h2Index}, h2Text: ${h2Text} ;CLEANUP_OK`);

            // Extract section HTML from the wrapper div
            const sectionWrapper = document.getElementById(sectionId);
            if (!sectionWrapper) {
                console.error(`[TRACE:hcp-tcanvas:share-section] ❌ Section wrapper NOT FOUND: ${sectionId} ;CLEANUP_OK`);
                return;
            }

            const sectionHtml = sectionWrapper.innerHTML;
            console.log(`[TRACE:hcp-tcanvas:share-section] Extracted section HTML: ${sectionHtml.length} chars ;CLEANUP_OK`);
            console.log(`[TRACE:hcp-tcanvas:share-section] HTML preview: ${sectionHtml.substring(0, 200)}... ;CLEANUP_OK`);

            // Visual feedback - button state
            const originalText = shareButton.innerHTML;
            const originalBg = shareButton.style.backgroundColor;
            shareButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sharing...';
            shareButton.style.backgroundColor = '#f59e0b';
            shareButton.disabled = true;
            console.log(`[TRACE:hcp-tcanvas:share-section] Updated button UI to 'Sharing...' state ;CLEANUP_OK`);

            try {
                // Call C# method via DotNet interop
                console.log('[TRACE:hcp-tcanvas:share-section] Calling C# ShareTranscriptSection(sectionId, sectionHtml, h2Text) ;CLEANUP_OK');
                await dotNetRef.invokeMethodAsync('ShareTranscriptSection', sectionId, sectionHtml, h2Text);

                // Success feedback
                shareButton.innerHTML = '<i class="fa-solid fa-check"></i> Shared!';
                shareButton.style.backgroundColor = '#059669';
                console.log(`[TRACE:hcp-tcanvas:share-section] ✅ C# method completed successfully ;CLEANUP_OK`);

                setTimeout(() => {
                    shareButton.innerHTML = originalText;
                    shareButton.style.backgroundColor = originalBg;
                    shareButton.disabled = false;
                }, 2000);

                console.log('[TRACE:hcp-tcanvas:share-section] ════════ SHARE COMPLETE ════════ ;CLEANUP_OK');
            } catch (error) {
                console.error('[TRACE:hcp-tcanvas:share-section] ❌ ERROR sharing section:', error, ';CLEANUP_OK');

                // Error feedback
                shareButton.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> Error';
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
