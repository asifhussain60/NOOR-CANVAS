/**
 * Poetry Button - Main poetry formatting button for Froala editor
 * Handles poetry and Quran verse formatting with metadata input
 */
(function() {
    'use strict';

    // Use deferred registration to avoid module not found errors
    function registerPoetryButton() {
        // Check if Angular app module exists before registering
        try {
            if (typeof angular !== 'undefined' && angular.module) {
                // Try to get the app module - this will throw if it doesn't exist
                angular.module('app');
                
                // Module exists, safe to register
                angular.module("app").factory("froalaPoetryButton", [
                    "froalaModalService", 
                    "froalaDialogService", 
                    "froalaBasePlugin",
                    froalaPoetryButton
                ]);
                
                console.log('✅ [FROALA-POETRY-BUTTON] Successfully registered with Angular app module');
                return true;
            } else {
                console.warn('[FROALA-POETRY-BUTTON] Angular not available, skipping registration');
                return false;
            }
        } catch (e) {
            console.warn('[FROALA-POETRY-BUTTON] Angular app module not found, skipping registration:', e.message);
            return false;
        }
    }

    // Try immediate registration if deferred system is not available (fallback)
    if (typeof window.registerFroalaPlugin === 'function') {
        window.registerFroalaPlugin(registerPoetryButton, 'froalaPoetryButton');
    } else {
        // Fallback to old behavior
        registerPoetryButton();
    }

    function froalaPoetryButton(modalService, dialogService, basePlugin) {
        var service = {
            register: registerPoetryButton,
            detectContentType: detectPoetryContentType
        };

        return service;

        /**
         * Registers the poetry button with Froala editor
         */
        function registerPoetryButton() {
            console.log('🎭 [POETRY-BUTTON] Starting poetry button registration...');
            
            try {
                // Define the icon first
                $.FE.DefineIcon("poetryButton", { NAME: "music" });
                console.log('✅ [POETRY-BUTTON] Icon defined successfully');
                
                // Register the command using base plugin
                var buttonConfig = basePlugin.createButtonConfig({
                    name: 'poetryButton',
                    icon: 'music',
                    title: 'Poetry - Transform selected text into beautifully formatted poetry',
                    callback: handlePoetryButtonClick
                });

                $.FE.RegisterCommand("poetryButton", buttonConfig);
                
                console.log('✅ [POETRY-BUTTON] Command registered successfully');
                console.log('🎭 [POETRY-BUTTON] Poetry button registration completed');
                
            } catch (error) {
                console.error('❌ [POETRY-BUTTON] Error during registration:', error);
            }
        }

        /**
         * Handles poetry button click
         * @param {Object} editor - Froala editor instance
         */
        function handlePoetryButtonClick(editor) {
            console.log('🎭 [POETRY-BUTTON] Poetry button activated');
            
            // Ensure we have a valid Froala editor instance
            if (!editor || !editor.selection || !editor.html) {
                console.error('❌ [POETRY-BUTTON] Invalid Froala editor context');
                basePlugin.showToastNotification('error', 'Editor Error', 'Poetry formatting is only available within the text editor.');
                return;
            }
            
            // Verify we're in a Froala editor context
            if (!$(editor.el).hasClass('fr-element') && !$(editor.el).closest('.fr-view').length) {
                console.error('❌ [POETRY-BUTTON] Not in valid Froala editor context');
                basePlugin.showToastNotification('error', 'Context Error', 'Poetry formatting only works within the text editor.');
                return;
            }
            
            // Get selected text
            var selectedText = editor.selection.text();
            
            if (!selectedText || selectedText.trim().length === 0) {
                // Show helpful message for no selection
                basePlugin.showToastNotification('warning', 'No Text Selected', 'Please select the poetry verses you want to format before clicking the Poetry button.');
                return;
            }
            
            // Comprehensive trimming - remove leading/trailing whitespace from entire selection
            // and from each individual line
            var trimmedText = selectedText.trim();
            var lines = trimmedText.split(/\r?\n/).map(function(line) { 
                return line.trim(); 
            }).filter(function(line) { 
                return line.length > 0; 
            });
            
            if (lines.length === 0) {
                basePlugin.showToastNotification('warning', 'Empty Content', 'No valid poetry content found after trimming whitespace.');
                return;
            }
            
            // Reconstruct text from cleaned lines
            var cleanedText = lines.join('\n');
            
            console.log('🎭 [POETRY-BUTTON] Processing cleaned text:', cleanedText.substring(0, 100) + '...');
            
            // Detect content type using cleaned text
            var contentType = detectContentType(cleanedText);
            console.log('🎭 [POETRY-BUTTON] Detected content type:', contentType);
            
            if (contentType === 'invalid') {
                // Show error toast for non-poetry content
                basePlugin.showToastNotification('error', 'Poetry Format Error', 'Selected content does not appear to be poetry. Please select poetry verses with proper line breaks.');
                return;
            }
            
            // Show metadata input modal before applying formatting
            showPoetryMetadataModal(editor, cleanedText, contentType);
            
            console.log('✅ [POETRY-BUTTON] Poetry formatting process initiated');
        }

        /**
         * Detect the type of poetry content from selected text
         * @param {string} text - Selected text to analyze
         * @returns {string} - 'bilingual', 'arabic-urdu', 'english', 'quran-bilingual', or 'invalid'
         */
        function detectContentType(text) {
            if (!text || text.trim().length === 0) {
                return 'invalid';
            }

            var lines = text.split(/\r?\n/).filter(function(line) {
                return line.trim().length > 0;
            });

            if (lines.length < 1) {
                return 'invalid';
            }

            var arabicLines = 0;
            var englishLines = 0;
            var hasQuranIndicators = false;

            // Check for Quran-specific indicators
            var quranKeywords = [
                'surah', 'verse', 'quran', 'qur\'an', 'allah', 'bismillah', 
                'ayah', 'ayat', 'chapter', 'al-', 'سورة', 'آية', 'القرآن', 'الله'
            ];
            
            var fullText = text.toLowerCase();
            hasQuranIndicators = quranKeywords.some(function(keyword) {
                return fullText.includes(keyword.toLowerCase());
            });

            // Check for verse number patterns (e.g., "1:1", "(1)", "[1]")
            var versePattern = /(\d+:\d+|\(\d+\)|\[\d+\]|\d+\.\s|\{\d+\})/;
            hasQuranIndicators = hasQuranIndicators || versePattern.test(text);

            lines.forEach(function(line) {
                if (isArabicOrUrduText(line)) {
                    arabicLines++;
                } else if (isEnglishText(line)) {
                    englishLines++;
                }
            });

            // For simplified approach - always return 'bilingual' for valid content
            // This ensures unified poetry styling for both poetry and Quran content
            if (arabicLines > 0 || englishLines > 0) {
                return 'bilingual';
            }

            return 'invalid';
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
         * Shows poetry metadata input modal
         * @param {Object} editor - Froala editor instance
         * @param {string} text - Cleaned text content
         * @param {string} contentType - Detected content type
         */
        function showPoetryMetadataModal(editor, text, contentType) {
            // This will be handled by the poetry modal service
            if (window.froalaPoetryModal && window.froalaPoetryModal.show) {
                window.froalaPoetryModal.show(editor, text, contentType);
            } else {
                console.error('❌ [POETRY-BUTTON] Poetry modal service not available');
                basePlugin.showToastNotification('error', 'Modal Error', 'Poetry input dialog is not available. Please try again.');
            }
        }
    }
})();
