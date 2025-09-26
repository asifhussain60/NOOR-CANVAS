/**
 * Poetry Formatter - Handles poetry content formatting and HTML generation
 * Provides unified formatting for poetry and Quran content
 */
(function() {
    'use strict';

    // Use deferred registration to avoid module not found errors
    function registerPoetryFormatter() {
        // Check if Angular app module exists before registering
        try {
            if (typeof angular !== 'undefined' && angular.module) {
                // Try to get the app module - this will throw if it doesn't exist
                angular.module('app');
                
                // Module exists, safe to register
                angular.module("app").factory("froalaPoetryFormatter", [
                    "froalaBasePlugin",
                    froalaPoetryFormatter
                ]);
                
                console.log('✅ [FROALA-POETRY-FORMATTER] Successfully registered with Angular app module');
                return true;
            } else {
                console.warn('[FROALA-POETRY-FORMATTER] Angular not available, skipping registration');
                return false;
            }
        } catch (e) {
            console.warn('[FROALA-POETRY-FORMATTER] Angular app module not found, skipping registration:', e.message);
            return false;
        }
    }

    // Try immediate registration if deferred system is not available (fallback)
    if (typeof window.registerFroalaPlugin === 'function') {
        window.registerFroalaPlugin(registerPoetryFormatter, 'froalaPoetryFormatter');
    } else {
        // Fallback to old behavior
        registerPoetryFormatter();
    }

    function froalaPoetryFormatter(basePlugin) {
        var service = {
            format: applyPoetryFormattingImmediate,
            generateHTML: generateSimplePoetryHTML
        };

        // Make service available globally for poetry modal
        window.froalaPoetryFormatter = service;

        return service;

        /**
         * Apply poetry formatting immediately using saved selection state
         * @param {Object} editor - Froala editor instance
         * @param {string} text - Text to format
         * @param {string} contentType - Content type
         * @param {Object} metadata - Metadata object
         * @param {Object} selectionState - Saved selection state
         */
        function applyPoetryFormattingImmediate(editor, text, contentType, metadata, selectionState) {
            try {
                console.log('🚀 [POETRY-IMMEDIATE] Applying immediate poetry formatting');
                
                // Generate HTML using simple poetry styling only
                var poetryHTML = generateSimplePoetryHTML(text, metadata);
                
                if (!poetryHTML) {
                    basePlugin.showToastNotification('error', 'Poetry Processing Error', 'Unable to process the selected poetry content. Please check the format and try again.');
                    return;
                }
                
                // Apply formatting immediately
                if (selectionState.hasSelection && selectionState.range) {
                    // Restore the original selection and replace with formatted content
                    try {
                        var selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(selectionState.range);
                        
                        // Replace the selected content with formatted HTML
                        editor.html.insert(poetryHTML);
                    } catch (error) {
                        console.warn('❌ [POETRY-FORMATTER] Could not restore selection, inserting at cursor:', error);
                        // Fallback: insert at current cursor position
                        editor.html.insert(poetryHTML);
                    }
                } else {
                    // Insert at current cursor position
                    editor.html.insert(poetryHTML);
                }
                
                // After insertion: remove adjacent empty paragraphs and attach handlers
                setTimeout(function() {
                    try {
                        cleanSurroundingEmptyParagraphs(editor);
                    } catch (e) {
                        console.warn('⚠️ [POETRY-CLEANUP] Cleanup failed:', e);
                    }
                    attachRestoreButtonHandlers(editor);
                }, 120);
                
                // Show success notification
                basePlugin.showToastNotification('success', 'Formatting Applied', 'Poetry formatted beautifully! Use the "Plain Text" button to restore original text.');
                
                console.log('✅ [POETRY-IMMEDIATE] Poetry formatting applied successfully with metadata:', metadata);
                
            } catch (error) {
                console.error('❌ [POETRY-IMMEDIATE] Error applying immediate formatting:', error);
                basePlugin.showToastNotification('error', 'Formatting Error', 'An unexpected error occurred while applying formatting. Please try again.');
            }
        }

        /**
         * Generate simple HTML for poetry content using original poetry styling only
         * @param {string} text - Selected poetry text
         * @param {Object} metadata - User-provided metadata (optional)
         * @returns {string} - Generated HTML
         */
        function generateSimplePoetryHTML(text, metadata) {
            var lines = text.split(/\r?\n/).filter(function(line) {
                return line.trim().length > 0;
            });
            
            // Always use simple bilingual poetry logic regardless of content type
            return generateSimpleBilingualPoetryHTML(lines, metadata);
        }

        /**
         * Generate simple HTML for bilingual poetry (Arabic/Urdu with English translations)
         * @param {Array} lines - Array of text lines
         * @param {Object} metadata - User-provided metadata (optional)
         * @returns {string} - Generated HTML
         */
        function generateSimpleBilingualPoetryHTML(lines, metadata) {
            console.log('🎭 [POETRY-HTML] Generating simple bilingual poetry HTML with metadata:', metadata);
            
            // Trim all lines before processing to remove leading/trailing whitespace
            var trimmedLines = lines.map(function(line) { 
                return typeof line === 'string' ? line.trim() : String(line).trim(); 
            }).filter(function(line) { 
                return line.length > 0; // Remove empty lines after trimming
            });
            var originalText = trimmedLines.join('\n'); // Store original text for restoration
            
            // Generate canonical data-* attributes for poetry blocks (Phase 3)
            var poetryId = generateUUID(); // Generate unique ID for this poetry block
            var poetName = (metadata && (metadata.poetName || metadata.title)) ? (metadata.poetName || metadata.title) : 'Anonymous';
            var language = 'bilingual'; // This function handles bilingual content
            var contentType = 'poetry';
            
            // DEBUG: Log data-* attributes being added to Poetry HTML (from plugin)
            console.log('🔍 [POETRY-PLUGIN] Adding data-* attributes to Poetry HTML:', {
                poetryId: poetryId,
                dataType: contentType,
                dataPoet: poetName,
                dataLanguage: language,
                dataContentType: contentType,
                originalText: originalText.substring(0, 100) + '...',
                metadata: metadata,
                addOuterContainer: !!(metadata && metadata.addOuterContainer),
                phase: 'Phase 3 (Poetry)',
                function: 'generateSimpleBilingualPoetryHTML (plugin)',
                timestamp: new Date().toISOString()
            });
            
            // Avoid emitting a top-level `.container` to prevent nested containers
            // when this fragment is inserted into contexts that already provide one.
            // Callers may opt-in by passing metadata.addOuterContainer = true.
            var html = '';
            if (metadata && metadata.addOuterContainer) {
                html += '<div class="poetry-wrapper" data-type="' + contentType + '" data-id="' + poetryId + '" data-poet="' + escapeHtml(poetName) + '" data-language="' + language + '" data-content-type="' + contentType + '">\n';
            }
            html += '    <div class="poetry-section froala-poetry-container" data-original-text="' + escapeHtml(originalText) + '">\n';
            
            // Add poet name header if provided (using original poetry styling)
            if (metadata && metadata.poetName && metadata.poetName.length > 0) {
                html += '        <div class="poetry-poet-header" style="display: flex; justify-content: space-between; align-items: center;">\n';
                html += '            <h4 style="margin: 0; color: #722727; font-weight: bold; font-size: 1.2em;">\n';
                html += '                <i class="fa fa-feather" style="margin-right: 8px; color: #5c726a;"></i>' + escapeHtml(metadata.poetName) + '\n';
                html += '            </h4>\n';
                html += '            <button type="button" class="btn btn-sm btn-primary poetry-restore-btn froala-only-btn" title="Remove poetry formatting and restore plain text">\n';
                html += '                <i class="fa fa-undo" style="margin-right: 5px;"></i>Plain Text\n';
                html += '            </button>\n';
                html += '        </div>\n';
            } else {
                // If no poet name, still show the button in a header-like area
                html += '        <div class="poetry-poet-header" style="display: flex; justify-content: flex-end; align-items: center;">\n';
                html += '            <button type="button" class="btn btn-sm btn-primary poetry-restore-btn froala-only-btn" title="Remove poetry formatting and restore plain text">\n';
                html += '                <i class="fa fa-undo" style="margin-right: 5px;"></i>Plain Text\n';
                html += '            </button>\n';
                html += '        </div>\n';
            }
            html += '        <div class="row">\n';
            html += '            <div class="col-xs-12">\n';
            
            // Simple logic: Try to pair Arabic/Urdu lines with English translations
            var arabicLines = [];
            var englishLines = [];
            
            trimmedLines.forEach(function(line) {
                var cleanLine = line.trim(); // Extra trimming for safety
                if (cleanLine && isArabicOrUrduText(cleanLine)) {
                    arabicLines.push(cleanLine);
                } else if (cleanLine && isEnglishText(cleanLine)) {
                    englishLines.push(cleanLine);
                }
            });
            
            // Generate couplets by pairing Arabic with English
            var maxLines = Math.max(arabicLines.length, englishLines.length);
            
            for (var i = 0; i < maxLines; i++) {
                html += '                <div class="poetry-couplet">\n';
                
                // Arabic/Urdu line
                if (i < arabicLines.length) {
                    html += '                    <p dir="rtl" class="h3 arabic-text text-center text-maroon" style="margin-bottom: 5px;">\n';
                    html += '                        ' + escapeHtml(arabicLines[i]) + '\n';
                    html += '                    </p>\n';
                }
                
                // English line
                if (i < englishLines.length) {
                    html += '                    <p class="text-center text-muted" dir="ltr" style="font-size: 2rem; margin: 0;">\n';
                    html += '                        ' + escapeHtml(englishLines[i]) + '\n';
                    html += '                    </p>\n';
                }
                
                html += '                </div>\n';
            }
            
            html += '            </div>\n';
            html += '        </div>\n';
            html += '    </div>\n';
            if (metadata && metadata.addOuterContainer) {
                html += '</div>\n';
            }
            
            console.log('✅ [POETRY-HTML] Simple bilingual poetry HTML generated successfully');
            return html;
        }

        /**
         * Check if text is primarily Arabic or Urdu
         */
        function isArabicOrUrduText(text) {
            var arabicUrduRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
            var arabicUrduChars = (text.match(arabicUrduRegex) || []).length;
            var totalChars = text.replace(/\s/g, '').length;
            return totalChars > 0 && (arabicUrduChars / totalChars) > 0.3;
        }

        /**
         * Check if text is primarily English
         */
        function isEnglishText(text) {
            var englishRegex = /[a-zA-Z]/;
            var englishChars = (text.match(englishRegex) || []).length;
            var totalChars = text.replace(/\s/g, '').length;
            return totalChars > 0 && (englishChars / totalChars) > 0.5;
        }

        /**
         * Escape HTML characters for safe insertion
         */
        function escapeHtml(text) {
            if (typeof text !== 'string') {
                return '';
            }
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        /**
         * Generate a UUID for content identification
         */
        function generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0;
                var v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        /**
         * Attach restore button event handlers (needs access to original function)
         */
        function attachRestoreButtonHandlers(editor) {
            // This function needs to be injected from the main froalaConfig
            if (window.froalaUtilities && window.froalaUtilities.attachRestoreButtonHandlers) {
                window.froalaUtilities.attachRestoreButtonHandlers(editor);
            } else {
                console.warn('❌ [POETRY-FORMATTER] Restore button handler not available');
            }
        }

        /**
         * Remove empty paragraph nodes immediately adjacent to the inserted
         * poetry block. This targets <p></p>, <p><br></p>, and NBSP-only
         * paragraphs around elements with class .poetry-section.
         */
        function cleanSurroundingEmptyParagraphs(editor) {
            try {
                if (!editor || !editor.$el) return;
                var root = editor.$el.get(0);
                var poetryNodes = root.querySelectorAll('.poetry-section');
                for (var i = 0; i < poetryNodes.length; i++) {
                    var node = poetryNodes[i];

                    // previous sibling
                    var prev = node.parentNode.previousSibling;
                    if (prev && prev.nodeType === 1 && prev.tagName.toLowerCase() === 'p') {
                        var txt = prev.innerHTML.replace(/&nbsp;|\s|<br\s*\/?>/gi, '').trim();
                        if (txt.length === 0) {
                            prev.parentNode.removeChild(prev);
                        }
                    }

                    // next sibling
                    var next = node.parentNode.nextSibling;
                    if (next && next.nodeType === 1 && next.tagName.toLowerCase() === 'p') {
                        var txt2 = next.innerHTML.replace(/&nbsp;|\s|<br\s*\/?>/gi, '').trim();
                        if (txt2.length === 0) {
                            next.parentNode.removeChild(next);
                        }
                    }
                }
            } catch (err) {
                console.warn('⚠️ [POETRY-CLEANUP] Error during paragraph cleanup:', err);
            }
        }
    }
})();
