/********************************************************************************************
 *
 * Angular-Froala is being used
 * https://github.com/froala/angular-froala
 *
 ********************************************************************************************/

(function () {
    "use strict";
    var serviceId = "froalaConfig";

    angular.module("app").factory(serviceId, ["common", "datacontext", "quranService", "bootstrap.dialog", "$filter", froalaConfig]);

    // License key for session.kashkole.com
    $.FroalaEditor.DEFAULTS.key = "BC5A3C3B1B5A6A2D1B5E4E3C1G1H1F4H4D3C3E3H1G5C3F4B3B5A4C2C4F3==";

    // Global variable to track the active Froala editor for etymology insertion
    window.activeFroalaEditorForEtymology = null;

    // Register button immediately when script loads
    registerHtmlCleanerButton();

    //CTRL + D
    $.FE.RegisterShortcut($.FE.KEYCODE.D, "htmlCleaner", null, "D", false, false);

    /**
     * PHASED HTML CLEANER - DOCUMENTATION REFERENCE
     * See: HTML_CLEANUP_BUTTON_DOCUMENTATION.md for full technical details
     * 
     * This implementation uses a three-phase approach:
     * 1. EXTRACT: Identify and protect content that should be preserved
     * 2. CLEANUP: Perform aggressive cleanup on the remaining content
     * 3. RESTORE: Restore the protected content back to the cleaned HTML
     */

    function performPhasedHtmlCleanup(editor) {
        console.log('🧹 [HTML-CLEANER] Starting phased HTML cleanup...');
        
        try {
            var originalHtml = editor.html.get();
            console.log('📝 [HTML-CLEANER] Original HTML length:', originalHtml.length);

            // Phase 1: Extract Protected Content
            var protectionResult = extractProtectedContent(originalHtml);
            var htmlWithPlaceholders = protectionResult.html;
            var protectedSections = protectionResult.sections;
            
            console.log('🔒 [HTML-CLEANER] Protected', protectedSections.length, 'sections');

            // Phase 2: Perform Cleanup Operations
            var cleanedHtml = performCleanupOperations(htmlWithPlaceholders);
            
            console.log('🧽 [HTML-CLEANER] Cleanup completed, length:', cleanedHtml.length);

            // Phase 3: Restore Protected Content
            var finalHtml = restoreProtectedContent(cleanedHtml, protectedSections);
            
            console.log('✨ [HTML-CLEANER] Final HTML length:', finalHtml.length);

            // Set the cleaned HTML back to the editor
            editor.html.set(finalHtml);
            
            // Trigger save if available
            if (editor.save && editor.save.save) {
                editor.save.save();
            }
            
            // Show success notification
            try {
                if (typeof showToastNotification !== 'undefined') {
                    showToastNotification('success', 'HTML Cleaned', 'HTML cleaned successfully. Poetry preserved, ahadees converted.');
                }
            } catch (notificationError) {
                console.warn('⚠️ [HTML-CLEANER] Notification failed:', notificationError.message);
            }
            
            console.log('✅ [HTML-CLEANER] Cleanup completed successfully');
            
        } catch (error) {
            console.error('❌ [HTML-CLEANER] Error during HTML cleaning:', error);
            
            // Show error dialog
            try {
                if (typeof dlg !== 'undefined' && dlg.confirmationDialog) {
                    dlg.confirmationDialog("HTML Cleaner Error", "Failed to clean HTML. Check console for details.", "OK", null);
                } else {
                    alert("HTML Cleaner Error: Failed to clean HTML. Check console for details.");
                }
            } catch (dialogError) {
                alert("HTML Cleaner Error: Failed to clean HTML. Check console for details.");
            }
        }
    }

    function extractProtectedContent(html) {
        console.log('🔍 [HTML-CLEANER] Phase 1: Extracting protected content...');
        
        var protectedSections = [];
        var sectionIndex = 0;
        var workingHtml = html;

        // 1. Protect poetry-section divs (highest priority)
        workingHtml = workingHtml.replace(/<div[^>]*class[^>]*poetry-section[^>]*>[\s\S]*?<\/div>/gi, function(match) {
            var placeholder = 'PROTECTED_POETRY_' + sectionIndex;
            protectedSections[sectionIndex] = {
                type: 'poetry-section',
                content: match,
                placeholder: placeholder
            };
            console.log('🔒 [HTML-CLEANER] Protected poetry-section:', sectionIndex);
            sectionIndex++;
            return placeholder;
        });

        // 2. Protect poetry-couplet divs
        workingHtml = workingHtml.replace(/<div[^>]*class[^>]*poetry-couplet[^>]*>[\s\S]*?<\/div>/gi, function(match) {
            var placeholder = 'PROTECTED_COUPLET_' + sectionIndex;
            protectedSections[sectionIndex] = {
                type: 'poetry-couplet',
                content: match,
                placeholder: placeholder
            };
            console.log('🔒 [HTML-CLEANER] Protected poetry-couplet:', sectionIndex);
            sectionIndex++;
            return placeholder;
        });

        // 3. Protect ahadees modal/panel elements (NOT the inserted content)
        workingHtml = workingHtml.replace(/<div[^>]*id=["']ahadees-fallback-modal["'][^>]*>[\s\S]*?<\/div>/gi, function(match) {
            var placeholder = 'PROTECTED_MODAL_' + sectionIndex;
            protectedSections[sectionIndex] = {
                type: 'ahadees-modal',
                content: match,
                placeholder: placeholder
            };
            console.log('🔒 [HTML-CLEANER] Protected ahadees modal:', sectionIndex);
            sectionIndex++;
            return placeholder;
        });

        // 4. Convert inserted ahadees divs to placeholder text (these should be removed)
        workingHtml = workingHtml.replace(/<div[^>]*class[^>]*inserted-hadees[^>]*class[^>]*ks-ahadees-container[^>]*>[\s\S]*?<\/div>/gi, function(match) {
            console.log('🗑️ [HTML-CLEANER] Converting inserted ahadees to placeholder text');
            return 'AHADEES_PLACEHOLDER_TEXT';
        });

        // Also handle reverse class order
        workingHtml = workingHtml.replace(/<div[^>]*class[^>]*ks-ahadees-container[^>]*class[^>]*inserted-hadees[^>]*>[\s\S]*?<\/div>/gi, function(match) {
            console.log('🗑️ [HTML-CLEANER] Converting inserted ahadees (reverse order) to placeholder text');
            return 'AHADEES_PLACEHOLDER_TEXT';
        });

        console.log('📊 [HTML-CLEANER] Protection summary:', protectedSections.length, 'sections protected');
        
        return {
            html: workingHtml,
            sections: protectedSections
        };
    }

    function performCleanupOperations(html) {
        console.log('🧽 [HTML-CLEANER] Phase 2: Performing cleanup operations...');
        
        return html
            // Remove blockquote elements completely
            .replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi, function(match) {
                if (match.indexOf('PROTECTED_') !== -1) {
                    return match; // Preserve if contains protected content
                }
                return '';
            })

            // Remove code elements completely
            .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, function(match) {
                if (match.indexOf('PROTECTED_') !== -1) {
                    return match; // Preserve if contains protected content
                }
                return '';
            })

            // Remove elements that only contain <br> tags
            .replace(/<(h[1-6]|div|p|span)[^>]*>\s*(<br\s*\/?>)+\s*<\/\1>/gi, function(match) {
                if (match.indexOf('PROTECTED_') !== -1) {
                    return match; // Preserve if contains protected content
                }
                
                // Always remove ayah-card divs with only <br> tags
                if (match.indexOf('ayah-card') !== -1) {
                    return '';
                }
                
                // Keep elements with important classes or attributes
                var importantClasses = ['fr-', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card'];
                var hasImportantClass = importantClasses.some(function(cls) {
                    return match.indexOf(cls) !== -1;
                });
                
                if (match.indexOf('id=') !== -1 || hasImportantClass) {
                    return match;
                }
                
                return ''; // Remove elements with only <br> tags
            })

            // Remove truly empty elements
            .replace(/<(h[1-6]|div|p|span)[^>]*>\s*<\/\1>/gi, function(match) {
                if (match.indexOf('PROTECTED_') !== -1) {
                    return match; // Preserve if contains protected content
                }
                
                // Always remove empty ayah-card divs
                if (match.indexOf('ayah-card') !== -1) {
                    return '';
                }
                
                // Keep elements with important attributes
                var importantClasses = ['fr-', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'container', 'row', 'col-'];
                var hasImportantClass = importantClasses.some(function(cls) {
                    return match.indexOf(cls) !== -1;
                });
                
                if (match.indexOf('id=') !== -1 || 
                    match.indexOf('style=') !== -1 || 
                    match.indexOf('&nbsp;') !== -1 || 
                    hasImportantClass) {
                    return match;
                }
                
                return ''; // Remove truly empty elements
            })

            // Remove repetitive character patterns (***-, ---, etc.)
            .replace(/[\*\-\.\_\=\+\#]{3,}/g, function(match) {
                if (match.indexOf('PROTECTED_') !== -1) {
                    return match; // Don't remove if part of protected content
                }
                return '';
            })

            // Clean up excessive whitespace
            .replace(/\n{3,}/g, '\n\n')
            .replace(/ {3,}/g, '  ')
            
            // Fix spacing between tags
            .replace(/>\s+</g, '><')
            
            // Trim the result
            .trim();
    }

    function restoreProtectedContent(html, protectedSections) {
        console.log('🔄 [HTML-CLEANER] Phase 3: Restoring protected content...');
        
        var restoredHtml = html;
        var restoredCount = 0;

        for (var i = 0; i < protectedSections.length; i++) {
            var section = protectedSections[i];
            var placeholder = section.placeholder;
            
            if (restoredHtml.indexOf(placeholder) !== -1) {
                restoredHtml = restoredHtml.replace(new RegExp(placeholder, 'g'), section.content);
                restoredCount++;
                console.log('✅ [HTML-CLEANER] Restored', section.type, 'section:', i);
            } else {
                console.warn('⚠️ [HTML-CLEANER] Placeholder not found for', section.type, 'section:', i);
            }
        }

        console.log('📊 [HTML-CLEANER] Restoration summary:', restoredCount, '/', protectedSections.length, 'sections restored');

        // Final verification
        var poetryCount = (restoredHtml.match(/<div[^>]*class[^>]*poetry-(section|couplet)[^>]*>/gi) || []).length;
        console.log('✨ [HTML-CLEANER] Final verification:', poetryCount, 'poetry elements found');

        return restoredHtml;
    }

    function registerHtmlCleanerButton() {
        // Use the correct Froala Editor icon definition syntax
        $.FroalaEditor.DefineIcon("htmlCleaner", { NAME: "magic", SVG_KEY: "magic" });
        $.FroalaEditor.RegisterCommand("htmlCleaner", {
            title: "Clean HTML (Ctrl+D)",
            focus: false,
            undo: true,
            refreshAfterCallback: true,
            callback: function () {
                performPhasedHtmlCleanup(this);
            }
        });
    }

    function froalaConfig(common, datacontext, quranService, dlg, $filter) {
        var logger = common.logger.getLogFn('froalaConfig');

        var service = {
            config: getFroalaConfig,
            sampleDataSource: ['apple', 'orange', 'banana'],
            fEditorAdvancedOptions: function (events, autoSaveOptions) {
                var froalaOpts = {
                    toolbarButtons: [
                        "fullscreen", "clearFormatting", "|", "bold", "italic", "underline", "insertLink",
                        "fontSize", "|", "color", "emoticons", "inlineStyle", "paragraphStyle", "paragraphFormat", "|", "align",
                        "formatOL", "formatUL", "outdent", "indent", "-", "insertLink", "insertImage", "insertVideo",
                        "insertTable", "undo", "redo", "|", "htmlCleaner", "|", "highlightButton", "tradFontButton", "amiriFontButton",
                        "|", "tokenizeButton", "previligedDataButton", "esotericButton", "etymologyButton", "|", "copyToClipboardButton", "pasteFromClipboardButton", "ahadees", "etymologyManagementButton", "poetryButton", "|", "html"
                    ],
                    toolbarButtonsMD: [
                        "fullscreen", "clearFormatting", "|", "bold", "italic", "underline",
                        "fontSize", "|", "color", "inlineStyle", "paragraphFormat", "|", "align",
                        "formatOL", "formatUL", "insertVideo", "undo", "redo", "|", "htmlCleaner", "|", "highlightButton", "tradFontButton",
                        "|", "tokenizeButton", "copyToClipboardButton", "pasteFromClipboardButton", "ahadees", "etymologyManagementButton", "poetryButton", "|", "html"
                    ],
                    toolbarButtonsSM: [
                        "bold", "italic", "underline", "|", "color", "paragraphFormat", "|", "align",
                        "formatOL", "formatUL", "insertVideo", "|", "undo", "redo", "|", "htmlCleaner", "|", "highlightButton", "copyToClipboardButton", "ahadees", "etymologyManagementButton", "poetryButton", "html"
                    ],
                    toolbarButtonsXS: [
                        "bold", "italic", "|", "insertVideo", "undo", "redo", "|", "htmlCleaner", "copyToClipboardButton", "ahadees", "etymologyManagementButton", "poetryButton", "html"
                    ],
                    theme: "royal",
                    shortcutsEnabled: [
                        "show", "bold", "italic", "underline", "inlineStyle", "paragraphStyle", "indent", "outdent",
                        "undo", "redo", "insertImage", "createLink",
                        "amiriFontButton", "tradFontButton", "tokenizeButton", "highlightButton", "htmlCleaner",
                        "copyToClipboardButton", "pasteFromClipboardButton"
                    ],
                    disableRightClick: false,
                    paragraphFormatSelection: true,
                    paragraphFormat: {
                        N: "Normal",
                        H1: "Heading 1",
                        H2: "Heading 2",
                        H3: "Heading 3",
                        H4: "Heading 4"
                    },
                    requestHeaders: {
                        'Authorization': "Bearer " + localStorage.getItem("accessToken")
                    },
                    heightMin: 300,
                    spellcheck: true,
                    paragraphStyles: {
                        "verse-container": "Showcase Verse",
                        anecdote: "Anecdote / Side Notes",
                        example: "Story / Example",
                        quote: "Quote",
                        urduNastaleeq: "Urdu Nastaleeq",
                        inlineArabic: "Inline Arabic",
                        style1: "Format Style 1"
                    },
                    inlineStyles: {
                        'Arabic Inline': "font-family: KashkoleTradArabic;font-size: 2em;word-spacing: 5px;letter-spacing: normal!important;padding-left: 2px;padding-right: 2px;font-style: normal;",
                        'Urdu Nastaleeq': "color: black;font-family: KashkoleNastaleeq;font-size: 28px!important;font-style: normal;direction: rtl !important;line-height: 0.5em;word-spacing: 4px;letter-spacing: -1px;",
                        'Format_Style1': "font-family: Charm, cursive;font-size: 1.1em;padding-left: 2px;padding-right: 2px;font-style: normal;color: #e41b1b;"
                    },
                    events: events || {}
                };

                // Merge autosave options if provided
                if (autoSaveOptions) {
                    angular.extend(froalaOpts, autoSaveOptions);
                }

                return froalaOpts;
            }
        };

        return service;

        function getFroalaConfig() {
            var froalaConfig = {
                key: 'BC5A3C3B1B5A6A2D1B5E4E3C1G1H1F4H4D3C3E3H1G5C3F4B3B5A4C2C4F3==',
                attribution: false,
                heightMin: 200,
                heightMax: 500,
                placeholderText: 'Enter your content here...',
                
                // Plugin configuration
                pluginsEnabled: [
                    'align', 'charCounter', 'codeBeautifier', 'codeView', 'colors', 
                    'draggable', 'emoticons', 'entities', 'file', 'fontFamily', 
                    'fontSize', 'fullscreen', 'image', 'imageManager', 'inlineStyle', 
                    'lineBreaker', 'link', 'lists', 'paragraphFormat', 'paragraphStyle', 
                    'quote', 'save', 'table', 'url', 'video', 'wordPaste'
                ],
                
                toolbarButtons: {
                    'moreText': {
                        'buttons': ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', 'textColor', 'backgroundColor', 'inlineClass', 'inlineStyle', 'clearFormatting']
                    },
                    'moreParagraph': {
                        'buttons': ['alignLeft', 'alignCenter', 'formatOLSimple', 'alignRight', 'alignJustify', 'formatOL', 'formatUL', 'paragraphFormat', 'paragraphStyle', 'lineHeight', 'outdent', 'indent', 'quote']
                    },
                    'moreRich': {
                        'buttons': ['insertLink', 'insertImage', 'insertVideo', 'insertTable', 'emoticons', 'fontAwesome', 'specialCharacters', 'embedly', 'insertFile', 'insertHR']
                    },
                    'moreMisc': {
                        'buttons': ['undo', 'redo', 'fullscreen', 'print', 'getPDF', 'spellChecker', 'selectAll', 'html', 'help']
                    }
                },
                
                // Events
                events: {
                    'initialized': function() {
                        // Register custom buttons when editor is initialized
                        registerHtmlCleanerButton(this);
                        
                        // Add the HTML Cleaner button to the toolbar
                        this.toolbar.addButtons(['htmlCleaner'], 1);
                    }
                }
            };

            return froalaConfig;
        }
    }
})();
