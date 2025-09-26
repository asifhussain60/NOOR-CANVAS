/********************************************************************************************
 *
 * Angular-Froala is being used
 * https://github.com/froala/angular-froala
 *
 ********************************************************************************************/
(function () {
    "use strict";
    var serviceId = "froalaConfig";
    angular.module("app").factory(serviceId, [
        "common", 
        "datacontext", 
        "quranService", 
        "bootstrap.dialog", 
        "$filter", 
        froalaConfig
    ]);
    // License key for session.kashkole.com
    $.FroalaEditor.DEFAULTS.key = "AA15A5B5C2xC2D2A2B2A29B4B1A8A1C1sctab1A-21zxE2sxiswrrzF4bmn==";
    // Global variable to track the active Froala editor for etymology insertion
    window.activeFroalaEditorForEtymology = null;
    // UUID generator for unique markers
    function generateUUID() {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    // Register button immediately when script loads
    registerHtmlCleanerButton();
    // CTRL + D removed - now handled by page-specific block removal functionality
    //CTRL + Q
    $.FE.RegisterShortcut($.FE.KEYCODE.Q, "amiriFontButton", null, "Q", false, false);
    //CTRL + E
    $.FE.RegisterShortcut($.FE.KEYCODE.E, "tradFontButton", null, "E", false, false);
    //CTRL + H
    $.FE.RegisterShortcut($.FE.KEYCODE.H, "highlightButton", null, "H", false, false);
    //CTRL + Y
    $.FE.RegisterShortcut($.FE.KEYCODE.Y, "tokenizeButton", null, "Y", false, false);
    //CTRL + C (for copy to clipboard - note: may conflict with native copy)
    $.FE.RegisterShortcut($.FE.KEYCODE.C, "copyToClipboardButton", null, "C", true, false); // Use Shift+Ctrl+C
    //CTRL + V (for paste from clipboard - note: may conflict with native paste)
    $.FE.RegisterShortcut($.FE.KEYCODE.V, "pasteFromClipboardButton", null, "V", true, false); // Use Shift+Ctrl+V
    //CTRL + SHIFT + E (Etymology Management Panel)
    $.FE.RegisterShortcut($.FE.KEYCODE.E, "etymologyManagementButton", null, "E", true, false); // Use Shift+Ctrl+E
    // Remove the old ahadees shortcut since the plugin registers its own Shift+Ctrl+H
    /**
     * Extracts the Quran token from various block formats
     * @param {jQuery} $container - The container element to search
     * @returns {string|null} - The extracted token (e.g., "Q|2:31") or null
     */
    function extractTokenFromBlock($container) {
        var token = null;
        try {
            console.log('?? [TOKEN-EXTRACTION] Starting token extraction from container...');
            console.log('?? [TOKEN-EXTRACTION] Container HTML preview:', $container.html().substring(0, 200) + '...');
            console.log('?? [TOKEN-EXTRACTION] Container classes:', $container.attr('class'));
            
            // Prefer data-* attributes when present (consolidation)
            var $ayahCard = $container.hasClass('ayah-card') ? $container : $container.find('.ayah-card').first();
            if ($ayahCard && $ayahCard.length) {
                var dataOriginal = $ayahCard.data('original-token') || $ayahCard.attr('data-original-token');
                if (dataOriginal) {
                    token = dataOriginal;
                    console.log('?? [TOKEN-EXTRACTION] Preferred data-original-token from ayah-card header:', token);
                    return token;
                }
                // fallback to ksession JSON if data-* missing
                var ksessionAttr = $ayahCard.attr('ksession');
                if (ksessionAttr) {
                    try {
                        var decodedJson = ksessionAttr.replace(/&quot;/g, '"');
                        var metadata = JSON.parse(decodedJson);
                        if (metadata && metadata.token) {
                            token = metadata.token;
                            console.log('?? [TOKEN-EXTRACTION] Fallback to ksession metadata token:', token);
                            return token;
                        }
                    } catch (error) {
                        console.log('?? [TOKEN-EXTRACTION] Failed to parse ksession metadata:', error);
                    }
                }
            }
            
            // Method 1: Look for clickable ayah header with data attributes
            var $clickableHeader = $container.find('.golden-surah-header.clickable-ayah-header');
            if ($clickableHeader.length && $clickableHeader.data('original-token')) {
                token = $clickableHeader.data('original-token');
                console.log('?? [TOKEN-EXTRACTION] Method 1 - Found token in clickable header:', token);
                if (token) return token;
            }
            
            // Method 2: Look for surah-ayat-token span
            var $surahAyatToken = $container.find('.surah-ayat-token');
            if ($surahAyatToken.length) {
                var tokenText = $surahAyatToken.text().trim();
                console.log('?? [TOKEN-EXTRACTION] Method 2 - Found surah-ayat-token text:', tokenText);
                tokenText = tokenText.replace(/[\[\]\s]/g, '');
                if (tokenText) {
                    token = tokenText.startsWith('Q|') ? tokenText : 'Q|' + tokenText;
                    console.log('?? [TOKEN-EXTRACTION] Method 2 - Processed token:', token);
                    if (token) return token;
                }
            }
            
            // Method 3: Look in text content for Q| pattern
            var containerText = $container.text();
            console.log('?? [TOKEN-EXTRACTION] Method 3 - Container text preview:', containerText.substring(0, 200) + '...');
            var textMatches = containerText.match(/\[(Q\|[\d\:\-]+)\]/);
            if (textMatches && textMatches[1]) {
                token = textMatches[1];
                console.log('?? [TOKEN-EXTRACTION] Method 3 - Found token in text:', token);
                if (token) return token;
            }
            
            // Method 4: Try to construct token from English surah name and ayat token
            var $englishName = $container.find('.quran-english-name');
            if ($englishName.length) {
                var englishText = $englishName.text();
                console.log('?? [TOKEN-EXTRACTION] Method 4 - Found English name text:', englishText);
                var ayatMatches = englishText.match(/\[(\d+:\d+(?:-\d+)?)\]/);
                if (ayatMatches && ayatMatches[1]) {
                    token = 'Q|' + ayatMatches[1];
                    console.log('?? [TOKEN-EXTRACTION] Method 4 - Constructed token:', token);
                    if (token) return token;
                }
            }
            
            // Method 5: Look for ayah-card ID pattern (e.g., "ayah-card-38-24")
            var ayahCardId = $container.attr('id') || $container.find('[id^="ayah-card-"]').attr('id');
            if (ayahCardId && ayahCardId.startsWith('ayah-card-')) {
                var idParts = ayahCardId.replace('ayah-card-', '').split('-');
                if (idParts.length >= 2) {
                    token = 'Q|' + idParts[0] + ':' + idParts[1];
                    console.log('?? [TOKEN-EXTRACTION] Method 5 - Token from ayah-card ID:', token);
                    if (token) return token;
                }
            }
            
            // Method 6: Look for any numeric pattern that could be surah:ayah
            var numericMatches = containerText.match(/(\d+)[:\-\s]+(\d+)/);
            if (numericMatches && numericMatches[1] && numericMatches[2]) {
                // Validate ranges (surah 1-114, ayah typically 1-286)
                var surahNum = parseInt(numericMatches[1]);
                var ayahNum = parseInt(numericMatches[2]);
                if (surahNum >= 1 && surahNum <= 114 && ayahNum >= 1 && ayahNum <= 500) {
                    token = 'Q|' + surahNum + ':' + ayahNum;
                    console.log('?? [TOKEN-EXTRACTION] Method 6 - Token from numeric pattern:', token);
                    if (token) return token;
                }
            }
            
            // Method 7: Look for Quran content patterns (Arabic text indicators)
            var hasArabicContent = /[\u0600-\u06FF]/.test(containerText);
            var hasQuranIndicator = /quran|ayah|surah|verse/i.test(containerText) || 
                                   $container.find('.quran-arabic, .ayah-arabic, .arabic-text').length > 0;
            
            if (hasArabicContent && hasQuranIndicator) {
                // Try to find any numbers that could be verse references
                var allNumbers = containerText.match(/\d+/g);
                if (allNumbers && allNumbers.length >= 2) {
                    var surahCandidate = parseInt(allNumbers[0]);
                    var ayahCandidate = parseInt(allNumbers[1]);
                    if (surahCandidate >= 1 && surahCandidate <= 114 && 
                        ayahCandidate >= 1 && ayahCandidate <= 500) {
                        token = 'Q|' + surahCandidate + ':' + ayahCandidate;
                        console.log('?? [TOKEN-EXTRACTION] Method 7 - Token from Arabic/Quran content:', token);
                        if (token) return token;
                    }
                }
            }
            
            // Method 8: Look for any text that might contain verse references in various formats
            var allTextContent = containerText.toLowerCase();
            console.log('?? [TOKEN-EXTRACTION] Method 8 - Full text content:', allTextContent.substring(0, 300));
            
            // Try different verse reference patterns
            var referencePatterns = [
                /(\d+)[:\-\s]*(\d+)/g,  // Basic number:number or number-number
                /surah\s*(\d+).*?verse\s*(\d+)/i,
                /chapter\s*(\d+).*?verse\s*(\d+)/i,
                /(\d+):(\d+)/g,  // Standard colon format
                /\[(\d+:\d+)\]/g  // Bracketed format
            ];
            
            for (var i = 0; i < referencePatterns.length; i++) {
                var matches = containerText.match(referencePatterns[i]);
                if (matches) {
                    console.log('?? [TOKEN-EXTRACTION] Method 8 - Pattern matches found:', matches);
                    for (var j = 0; j < matches.length; j++) {
                        var match = matches[j];
                        var parts = match.replace(/[^\d:]/g, '').split(':');
                        if (parts.length === 2) {
                            var surahNum = parseInt(parts[0]);
                            var ayahNum = parseInt(parts[1]);
                            if (surahNum >= 1 && surahNum <= 114 && ayahNum >= 1 && ayahNum <= 500) {
                                token = 'Q|' + surahNum + ':' + ayahNum;
                                console.log('?? [TOKEN-EXTRACTION] Method 8 - Valid token from pattern:', token);
                                return token;
                            }
                        }
                    }
                }
            }
            
            console.warn('?? [TOKEN-EXTRACTION] All methods failed - no token found');
            return null;
        } catch (error) {
            console.error('?? [TOKEN-EXTRACTION] Error during extraction:', error);
            return null;
        }
    }

        // Utility: read canonical data-* attributes from an element (preferred source)
        function readDataAttributes($el) {
            if (!$el || $el.length === 0) return null;
            try {
                var attrs = {};
                var el = $el.get(0);
                if (!el || !el.attributes) return null;
                for (var i = 0; i < el.attributes.length; i++) {
                    var a = el.attributes[i];
                    if (a.name && a.name.indexOf('data-') === 0) {
                        var key = a.name.substring(5); // strip data-
                        attrs[key] = a.value;
                    }
                }
                return attrs;
            } catch (e) {
                console.error('?? [DATA-ATTRS] Error reading data attributes', e);
                return null;
            }
        }
    /**
     * ENHANCED: Extract highlights from legacy block before conversion
     * @param {jQuery} $container - The container element to search for highlights
     * @returns {Array} - Array of highlight objects with text and type information
     */
    function extractHighlightsFromBlock($container) {
        var highlights = [];
        try {
            console.log('?? [HIGHLIGHT-PRESERVATION] Scanning for highlights in legacy block...');
            // Find all highlight spans in Arabic and English text
            $container.find('span.highlight, .highlight').each(function() {
                var $highlight = $(this);
                var highlightedText = $highlight.text().trim();
                if (highlightedText) {
                    // Determine if this is Arabic or English text
                    var isArabic = isArabicText(highlightedText);
                    var highlightInfo = {
                        text: highlightedText,
                        isArabic: isArabic,
                        type: 'highlight',
                        className: $highlight.attr('class') || 'highlight',
                        // Store surrounding context for better matching
                        beforeText: $highlight.prev().length ? $highlight.prev().text().slice(-20) : '',
                        afterText: $highlight.next().length ? $highlight.next().text().slice(0, 20) : ''
                    };
                    highlights.push(highlightInfo);
                    console.log('? [HIGHLIGHT-PRESERVATION] Found highlight:', highlightedText.substring(0, 30) + '...');
                }
            });
            console.log('?? [HIGHLIGHT-PRESERVATION] Extracted ' + highlights.length + ' highlights');
            return highlights;
        } catch (error) {
            console.error('? [HIGHLIGHT-PRESERVATION] Error extracting highlights:', error);
            return [];
        }
    }
    /**
     * ENHANCED: Apply preserved highlights to the new ayah-card HTML - SIMPLIFIED APPROACH
     * @param {string} htmlContent - The new ayah-card HTML content
     * @param {Array} highlights - Array of highlight objects to restore
     * @returns {string} - HTML content with highlights restored
     */
    function applyPreservedHighlights(htmlContent, highlights) {
        if (!htmlContent || !highlights || highlights.length === 0) {
            console.log('?? [HIGHLIGHT-PRESERVATION] No highlights to apply or empty content');
            return htmlContent;
        }
        try {
            console.log('?? [HIGHLIGHT-PRESERVATION] Applying ' + highlights.length + ' preserved highlights...');
            console.log('?? [HIGHLIGHT-PRESERVATION] Original HTML length:', htmlContent.length);
            var processedHtml = htmlContent;
            var appliedCount = 0;
            // Apply highlights one by one using simple string replacement
            highlights.forEach(function(highlight, index) {
                var targetText = highlight.text;
                console.log('?? [HIGHLIGHT-PRESERVATION] #' + index + ' - Looking for: "' + targetText + '"');
                console.log('?? [HIGHLIGHT-PRESERVATION] Is Arabic:', highlight.isArabic);
                // Simple approach: find the text and wrap it with highlight span
                if (processedHtml.includes(targetText)) {
                    // Make sure we don't highlight already highlighted text
                    var highlightPattern = '<span class="highlight">' + escapeRegExp(targetText) + '</span>';
                    if (!processedHtml.includes(highlightPattern)) {
                        // Use simple string replacement - more reliable than complex regex
                        var beforeReplace = processedHtml;
                        processedHtml = processedHtml.replace(targetText, '<span class="highlight">' + targetText + '</span>');
                        if (processedHtml !== beforeReplace) {
                            appliedCount++;
                            console.log('? [HIGHLIGHT-PRESERVATION] Applied highlight #' + index + ': "' + targetText + '"');
                        } else {
                            console.warn('?? [HIGHLIGHT-PRESERVATION] Simple replacement failed for: "' + targetText + '"');
                        }
                    } else {
                        console.log('?? [HIGHLIGHT-PRESERVATION] Text already highlighted: "' + targetText + '"');
                        appliedCount++; // Count as applied since it's already there
                    }
                } else {
                    console.warn('?? [HIGHLIGHT-PRESERVATION] Text not found in content: "' + targetText + '"');
                    // Try to find similar text for debugging
                    var contentSnippet = processedHtml.substring(0, 200);
                    console.log('?? [DEBUG] Content snippet:', contentSnippet);
                }
            });
            console.log('?? [HIGHLIGHT-PRESERVATION] Successfully applied ' + appliedCount + ' out of ' + highlights.length + ' highlights');
            console.log('?? [HIGHLIGHT-PRESERVATION] Final HTML length:', processedHtml.length);
            return processedHtml;
        } catch (error) {
            console.error('? [HIGHLIGHT-PRESERVATION] Error applying highlights:', error);
            return htmlContent; // Return original if highlighting fails
        }
    }
    /**
     * Helper function to escape regex special characters
     */
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Helper function to calculate text similarity (simple approach)
     */
    function calculateTextSimilarity(text1, text2) {
        var longer = text1.length > text2.length ? text1 : text2;
        var shorter = text1.length > text2.length ? text2 : text1;
        if (longer.length === 0) return 1.0;
        var editDistance = getEditDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    /**
     * Helper function to calculate edit distance (Levenshtein distance)
     */
    function getEditDistance(str1, str2) {
        var matrix = [];
        var i, j;
        for (i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (i = 1; i <= str2.length; i++) {
            for (j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    /**
     * Helper function to find the best matching substring
     */
    function findBestMatchingSubstring(text, target) {
        var bestMatch = '';
        var bestScore = 0;
        var words = text.split(' ');
        var targetWords = target.split(' ');
        // Try different substring lengths around the target length
        for (var len = Math.max(1, targetWords.length - 2); len <= targetWords.length + 2; len++) {
            for (var i = 0; i <= words.length - len; i++) {
                var substring = words.slice(i, i + len).join(' ');
                var score = calculateTextSimilarity(substring, target);
                if (score > bestScore && score > 0.7) {
                    bestScore = score;
                    bestMatch = substring;
                }
            }
        }
        return bestMatch || null;
    }
    /**
     * Clean poetry content by removing HTML comments and excessive spaces while preserving structure
     * @param {string} poetryHtml - The poetry HTML content to clean
     * @returns {string} - Cleaned poetry HTML
     */
    function cleanPoetryContent(poetryHtml) {
        if (!poetryHtml || typeof poetryHtml !== 'string') {
            return poetryHtml;
        }
        console.log('?? [POETRY-CLEANER] Starting poetry content cleaning');
        console.log('?? [POETRY-CLEANER] Original content length:', poetryHtml.length);
        var cleanedContent = poetryHtml
            // Remove all HTML comments (<!-- ... -->)
            .replace(/<!--[\s\S]*?-->/g, '')
            // ENHANCED: Remove nested poetry-wrapper divs that only contain whitespace and other poetry-wrapper divs
            .replace(/<div[^>]*class[^>]*poetry-wrapper[^>]*>\s*(<p[^>]*>\s*<br\s*\/?>\s*<\/p>\s*)*<div[^>]*class[^>]*poetry-wrapper[^>]*>/gi, '<div class="poetry-wrapper">')
            // Remove empty paragraphs with only <br> tags at the beginning of poetry wrappers
            .replace(/(<div[^>]*class[^>]*poetry-wrapper[^>]*>)\s*(<p[^>]*>\s*<br\s*\/?>\s*<\/p>\s*)+/gi, '$1')
            // Remove empty paragraphs with only <br> tags between poetry wrappers
            .replace(/(<\/div>\s*)<p[^>]*>\s*<br\s*\/?>\s*<\/p>\s*(<div[^>]*class[^>]*poetry-wrapper[^>]*>)/gi, '$1$2')
            // Remove excessive nested poetry-wrapper closing tags
            .replace(/(<\/div>\s*)<\/div>\s*<\/div>/gi, '$1')
            // ENHANCED: Remove empty paragraphs that contain only line breaks or whitespace
            .replace(/<p[^>]*>\s*(<br\s*\/?>)?\s*<\/p>/gi, '')
            // ENHANCED: Remove empty divs that only contain whitespace or line breaks (but preserve poetry-section and froala-poetry-container)
            .replace(/<div(?![^>]*(?:poetry-section|froala-poetry-container))[^>]*>\s*(<br\s*\/?>)?\s*<\/div>/gi, '')
            // Remove excessive whitespace between tags but preserve single spaces
            .replace(/>\s*(?:&nbsp;|&#160;|\u00A0|\s)+\s*</g, '><')
            // Remove excessive whitespace at the start of content after opening tags
            .replace(/>\s*(?:&nbsp;|&#160;|\u00A0|\s)+(?=[^<])/g, '>')
            // Remove excessive whitespace at the end of content before closing tags
            .replace(/([^>])(?:&nbsp;|&#160;|\u00A0|\s)+(?=\s*<)/g, '$1')
            // Clean up multiple consecutive whitespace characters within text content
            .replace(/(?:&nbsp;|&#160;|\u00A0){2,}/g, ' ')
            .replace(/\s{2,}/g, ' ')
            // ENHANCED: Remove multiple consecutive line breaks (more than 2)
            .replace(/\n{3,}/g, '\n\n')
            // Remove blank lines that contain only whitespace
            .replace(/\n\s*\n/g, '\n')
            // Final cleanup: trim and remove truly empty lines
            .split('\n')
            .map(function(line) {
                return line.trim();
            })
            .filter(function(line) {
                // Keep non-empty lines and lines that contain HTML tags (but not just whitespace)
                return line.length > 0 && (line.match(/<[^>]+>/) || line.trim().length > 0);
            })
            .join('\n')
            // Final pass: ensure no excessive consecutive empty elements remain
            .replace(/(<\/[^>]+>\s*){3,}/g, function(match) {
                // Keep only one closing tag sequence to prevent excessive empty space
                return match.split(/\s*<\//).slice(0, 2).join('<\/');
            });
        console.log('?? [POETRY-CLEANER] Cleaned content length:', cleanedContent.length);
        console.log('?? [POETRY-CLEANER] Removed characters:', poetryHtml.length - cleanedContent.length);
        return cleanedContent;
    }
    function registerHtmlCleanerButton() {
        // Use the correct Froala Editor icon definition syntax
        $.FE.DefineIcon("htmlCleanerButton", { NAME: "magic" });
        // Register the command
        $.FE.RegisterCommand("htmlCleanerButton", {
            title: "Clean HTML", // Removed (Ctrl+D) reference since it's no longer bound
            focus: false,
            undo: true,
            callback: function () {
                var editor = this;
                var currentHtml = editor.html.get();
                // Clean HTML immediately without confirmation dialog
                try {
                    console.log('?? [HTML-CLEANER] ===== STARTING HTML CLEANUP =====');
                    console.log('?? [HTML-CLEANER] Original HTML length:', currentHtml.length);
                    console.log('?? [HTML-CLEANER] Original HTML preview:', currentHtml.substring(0, 200) + '...');
                    var cleanedHtml = currentHtml;
                    // Centralized extra important class prefixes and helper
                    var extraImportantClassPrefixes = [
                        'hadees-header', 'ks-ahadees-header', 'ks-ahadees-container', 'inserted-hadees', 'ks-ahadees', 'ks-',
                        'poetry-', 'ahadees', 'ayah-', 'verse-container', 'inlineArabic', 'poetry-section', 'froala-poetry-container', 'poetry-couplet', 'poetry-restore-btn', 'poetry-wrapper', 'example'
                    ];
                    function mergeImportant(existingArray) {
                        // Return a new array merging extras first for quick indexOf checks
                        return extraImportantClassPrefixes.concat(existingArray || []);
                    }
                    // === PROTECTION: Handle ahadees content specially ===
                    // Use separate arrays for inserted sections and modal/panel elements
                    var ahadeesInsertedSections = [];
                    var ahadeesModalSections = [];
                    // 0a. VERY ROBUST PROTECTION: catch any div that is an ahadees block by id or class
                    // Match divs with id starting 'ahadees-' OR class containing 'ks-ahadees' or 'inserted-hadees'
                    cleanedHtml = cleanedHtml.replace(/<div\b[^>]*(?:\bid=["']ahadees-[^"']+["']|\bclass=["'][^"']*(?:\bks-ahadees\b|\binserted-hadees\b)[^"']*["'])[^>]*>[\s\S]*?<\/div>/gi, function(match) {
                        var idx = ahadeesInsertedSections.length;
                        var placeholder = '<!--AHADEES_SECTION_' + idx + '-->';
                        ahadeesInsertedSections.push(match);
                        console.log('??? [HTML-CLEANER] [ROBUST] Protecting ahadees block from cleanup with placeholder:', placeholder);
                        return placeholder;
                    });
                    // Protect inserted ahadees blocks using HTML comment placeholders (fallback specific-class matcher)
                    cleanedHtml = cleanedHtml.replace(/<div\b[^>]*\bclass=(\x22|\x27)(?:(?:(?!\1).)*)\b(inserted-hadees|ks-ahadees-container|ks-ahadees)\b(?:(?!\1).)*\1[^>]*>[\s\S]*?<\/div>/gi, function(match) {
                        var idx = ahadeesInsertedSections.length;
                        var placeholder = '<!--AHADEES_SECTION_' + idx + '-->';
                        ahadeesInsertedSections.push(match);
                        console.log('??? [HTML-CLEANER] Protecting inserted ahadees div from cleanup with placeholder:', placeholder);
                        return placeholder;
                    });
                    // 2. PROTECT ahadees modal/panel (if present in the HTML) - these should NOT be removed
                    // Look for modal-related ahadees elements that should be preserved
                    cleanedHtml = cleanedHtml.replace(/<div[^>]*id=["']ahadees-fallback-modal["'][^>]*>[\s\S]*?<\/div>/gi, function(match) {
                        var idx = ahadeesModalSections.length;
                        var placeholder = '<!--AHADEES_MODAL_' + idx + '-->';
                        ahadeesModalSections.push(match);
                        console.log('??? [HTML-CLEANER] Protecting ahadees modal from cleanup with placeholder:', placeholder);
                        return placeholder;
                    });
                    // Protect any other ahadees-related elements that are NOT the inserted content
                    cleanedHtml = cleanedHtml.replace(/<[^>]*class[^>]*(?:ahadees-modal|ahadees-panel|ahadees-popup)[^>]*>[\s\S]*?<\/[^>]+>/gi, function(match) {
                        var idx = ahadeesModalSections.length;
                        var placeholder = '<!--AHADEES_MODAL_' + idx + '-->';
                        ahadeesModalSections.push(match);
                        console.log('??? [HTML-CLEANER] Protecting ahadees modal/panel element from cleanup with placeholder:', placeholder);
                        return placeholder;
                    });
                    // 3. PROTECT poetry content - ensure it remains untouched (using UUID markers)
                    var poetrySections = [];
                    var poetryPlaceholders = []; // Store the actual placeholder strings for restoration
                    var poetrySectionIndex = 0;
                    
                    // ENHANCED: Pre-clean nested poetry-wrapper divs before protection
                    // Remove excessive nested poetry-wrapper divs that only contain whitespace and other poetry-wrapper divs
                    cleanedHtml = cleanedHtml.replace(/<div[^>]*class[^>]*poetry-wrapper[^>]*>\s*(<p[^>]*>\s*<br\s*\/?>\s*<\/p>\s*)*\s*(<div[^>]*class[^>]*poetry-wrapper[^>]*>[\s\S]*?<\/div>)\s*(<p[^>]*>\s*<br\s*\/?>\s*<\/p>\s*)*\s*<\/div>/gi, function(match, emptyPBefore, innerWrapper, emptyPAfter) {
                        console.log('??? [HTML-CLEANER] Removing nested poetry-wrapper with empty paragraphs');
                        return innerWrapper; // Keep only the inner wrapper
                    });
                    
                    // ENHANCED: Remove multiple consecutive nested poetry-wrapper divs
                    var maxIterations = 5; // Prevent infinite loops
                    var iteration = 0;
                    while (iteration < maxIterations && /<div[^>]*class[^>]*poetry-wrapper[^>]*>\s*<div[^>]*class[^>]*poetry-wrapper[^>]*>/gi.test(cleanedHtml)) {
                        cleanedHtml = cleanedHtml.replace(/<div[^>]*class[^>]*poetry-wrapper[^>]*>\s*(<p[^>]*>\s*<br\s*\/?>\s*<\/p>\s*)*\s*(<div[^>]*class[^>]*poetry-wrapper[^>]*>)/gi, '$2');
                        iteration++;
                        console.log('??? [HTML-CLEANER] Poetry wrapper nesting cleanup iteration:', iteration);
                    }
                    
                    // Protect poetry-wrapper divs first (highest priority to preserve complete poetry blocks)
                    cleanedHtml = cleanedHtml.replace(/<div[^>]*class[^>]*poetry-wrapper[^>]*>[\s\S]*?<\/div>/gi, function(match) {
                        var placeholder = generateUUID() + '_POETRY_WRAPPER_' + poetrySectionIndex;
                        poetrySections[poetrySectionIndex] = match;
                        poetryPlaceholders[poetrySectionIndex] = placeholder;
                        poetrySectionIndex++;
                        console.log('??? [HTML-CLEANER] Protecting poetry-wrapper div from cleanup with UUID marker');
                        return placeholder;
                    });
                    // Protect poetry-section divs (using UUID markers for consistency)
                    cleanedHtml = cleanedHtml.replace(/<div[^>]*class[^>]*poetry-section[^>]*>[\s\S]*?<\/div>/gi, function(match) {
                        var placeholder = generateUUID() + '_POETRY_SECTION_' + poetrySectionIndex;
                        poetrySections[poetrySectionIndex] = match;
                        poetryPlaceholders[poetrySectionIndex] = placeholder;
                        poetrySectionIndex++;
                        console.log('??? [HTML-CLEANER] Protecting poetry-section div from cleanup with UUID marker');
                        return placeholder;
                    });
                    // Also protect froala-poetry-container divs (if they exist without poetry-section class)
                    cleanedHtml = cleanedHtml.replace(/<div[^>]*class[^>]*froala-poetry-container[^>]*>[\s\S]*?<\/div>/gi, function(match) {
                        // Only protect if it doesn't already have poetry-section class (to avoid double protection)
                        if (match.indexOf('poetry-section') === -1) {
                            var placeholder = generateUUID() + '_POETRY_CONTAINER_' + poetrySectionIndex;
                            poetrySections[poetrySectionIndex] = match;
                            poetryPlaceholders[poetrySectionIndex] = placeholder;
                            poetrySectionIndex++;
                            console.log('??? [HTML-CLEANER] Protecting froala-poetry-container div from cleanup with UUID marker');
                            return placeholder;
                        }
                        return match; // Return unchanged if it already has poetry-section class
                    });
                    // Protect any standalone poetry-couplet structures (using UUID markers)
                    cleanedHtml = cleanedHtml.replace(/<div[^>]*class[^>]*poetry-couplet[^>]*>[\s\S]*?<\/div>/gi, function(match) {
                        var placeholder = generateUUID() + '_POETRY_COUPLET_' + poetrySectionIndex;
                        poetrySections[poetrySectionIndex] = match;
                        poetryPlaceholders[poetrySectionIndex] = placeholder;
                        poetrySectionIndex++;
                        console.log('??? [HTML-CLEANER] Protecting poetry-couplet div from cleanup with UUID marker');
                        return placeholder;
                    });
                    // Enhanced HTML cleanup with block element consolidation
                    cleanedHtml = cleanedHtml
                        // === NEW: Remove ALL <blockquote> elements completely ===
                        .replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi, '')
                        // === NEW: Remove ALL <code> elements completely ===
                        .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '')
                        // === NEW: Remove nested duplicate container divs ===
                        .replace(/<div([^>]*class[^>]*container[^>]*)>\s*<div([^>]*class[^>]*container[^>]*)>([\s\S]*?)<\/div>\s*<\/div>/gi, function(match, outerAttrs, innerAttrs, content) {
                            console.log('?? [HTML-CLEANER] Found nested container divs:', {
                                outerAttrs: outerAttrs,
                                innerAttrs: innerAttrs,
                                contentPreview: content.substring(0, 100) + '...'
                            });
                            // Check if the containers are truly duplicates (both just have "container" class)
                            var outerClassMatch = outerAttrs.match(/class=["']([^"']*?)["']/);
                            var innerClassMatch = innerAttrs.match(/class=["']([^"']*?)["']/);
                            var outerClasses = outerClassMatch ? outerClassMatch[1].split(/\s+/) : [];
                            var innerClasses = innerClassMatch ? innerClassMatch[1].split(/\s+/) : [];
                            // If both divs only have "container" class (or very similar), remove outer div
                            var outerOnlyContainer = outerClasses.length === 1 && outerClasses[0] === 'container';
                            var innerOnlyContainer = innerClasses.length === 1 && innerClasses[0] === 'container';
                            if (outerOnlyContainer && innerOnlyContainer) {
                                console.log('?? [HTML-CLEANER] Removing outer container div - keeping inner container');
                                return '<div' + innerAttrs + '>' + content + '</div>';
                            }
                            // If outer has more specific classes, keep outer and remove inner
                            if (outerClasses.length > 1 && innerOnlyContainer) {
                                console.log('?? [HTML-CLEANER] Removing inner container div - keeping outer container');
                                return '<div' + outerAttrs + '>' + content + '</div>';
                            }
                            // If both have additional classes, keep both (they might be intentionally nested)
                            console.log('?? [HTML-CLEANER] Keeping both containers - they have different purposes');
                            return match;
                        })
                        // === NEW: Remove generic nested duplicate divs with similar classes ===
                        .replace(/<div([^>]*class=["']([^"']*?)["'][^>]*)>\s*<div([^>]*class=["']([^"']*?)["'][^>]*)>([\s\S]*?)<\/div>\s*<\/div>/gi, function(match, outerAttrs, outerClasses, innerAttrs, innerClasses, content) {
                            // Skip if these are important structural classes that should be preserved
                            var importantClasses = mergeImportant(['fr-', 'ayah-card', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'row', 'col-', 'poetry-section', 'froala-poetry-container', 'poetry-couplet', 'poetry-wrapper', 'example']);
                            var outerClassList = outerClasses.split(/\s+/);
                            var innerClassList = innerClasses.split(/\s+/);
                            var outerHasImportant = outerClassList.some(function(cls) {
                                return importantClasses.some(function(important) {
                                    return cls.indexOf(important) === 0;
                                });
                            });
                            var innerHasImportant = innerClassList.some(function(cls) {
                                return importantClasses.some(function(important) {
                                    return cls.indexOf(important) === 0;
                                });
                            });
                            // If both divs have identical classes, remove the outer one
                            if (outerClasses === innerClasses && !outerHasImportant && !innerHasImportant) {
                                console.log('?? [HTML-CLEANER] Removing outer div with identical classes:', outerClasses);
                                return '<div' + innerAttrs + '>' + content + '</div>';
                            }
                            // If both divs have only generic classes (like "container", "wrapper", etc.), keep the inner one
                            var genericClasses = ['container', 'wrapper', 'content', 'inner', 'outer', 'section'];
                            var outerIsGeneric = outerClassList.every(function(cls) {
                                return genericClasses.includes(cls);
                            });
                            var innerIsGeneric = innerClassList.every(function(cls) {
                                return genericClasses.includes(cls);
                            });
                            if (outerIsGeneric && innerIsGeneric && !outerHasImportant && !innerHasImportant) {
                                console.log('?? [HTML-CLEANER] Removing outer generic div, keeping inner:', {
                                    outerClasses: outerClasses,
                                    innerClasses: innerClasses
                                });
                                return '<div' + innerAttrs + '>' + content + '</div>';
                            }
                            // Keep both if they have different purposes
                            return match;
                        })
                        // === NEW: Enhanced empty paragraph removal ===
                        // Remove <p><br></p> patterns that create blank lines
                        .replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, '')
                        // Remove multiple consecutive empty paragraphs
                        .replace(/(<p[^>]*>\s*<\/p>\s*){2,}/gi, '')
                        // Remove paragraphs that contain only whitespace or non-breaking spaces
                        .replace(/<p[^>]*>\s*(?:&nbsp;|&#160;|\u00A0|\s)*\s*<\/p>/gi, '')
                        // ENHANCED: Remove sequences of empty paragraphs with line breaks between other content
                        .replace(/(<\/(?:div|h[1-6]|section|article)>)\s*(<p[^>]*>\s*(?:<br\s*\/?>)?\s*<\/p>\s*)+\s*(<(?:div|h[1-6]|section|article)[^>]*>)/gi, '$1$3')
                        // ENHANCED: Remove empty paragraphs at the beginning of sections
                        .replace(/(<(?:div|h[1-6]|section|article)[^>]*>)\s*(<p[^>]*>\s*(?:<br\s*\/?>)?\s*<\/p>\s*)+/gi, '$1')
                        // ENHANCED: Remove empty paragraphs at the end of sections
                        .replace(/(<p[^>]*>\s*(?:<br\s*\/?>)?\s*<\/p>\s*)+\s*(<\/(?:div|h[1-6]|section|article)>)/gi, '$2')
                        // ENHANCED: Remove consecutive blank line patterns (multiple <p><br></p> sequences)
                        .replace(/(<p[^>]*>\s*<br\s*\/?>\s*<\/p>\s*){2,}/gi, '')
                        // ENHANCED: Remove blank lines between headings and content
                        .replace(/(<\/h[1-6]>)\s*(<p[^>]*>\s*(?:<br\s*\/?>)?\s*<\/p>\s*)+\s*(<p[^>]*>[^<]+)/gi, '$1$3')
                        // ENHANCED: Remove blank lines between content and headings
                        .replace(/([^>]+<\/p>)\s*(<p[^>]*>\s*(?:<br\s*\/?>)?\s*<\/p>\s*)+\s*(<h[1-6][^>]*>)/gi, '$1$3')
                        // === NEW: Remove block elements containing text within square brackets ===
                        // This removes entire <p>, <div>, <h1-h6>, and <span> elements that contain text within square brackets
                        // that may be preceded/followed by dashes, underscores, or non-breaking spaces
                        .replace(/<(p|div|h[1-6]|span)([^>]*)>[\s\S]*?<\/\1>/gi, function(match, tagName, attributes) {
                            // Extract all text content including nested elements to check for brackets
                            var innerContent = match.replace(/<[^>]*>/g, ''); // Strip HTML tags to get text content
                            var hasSquareBrackets = /\[[\s\S]*?\]/.test(innerContent);
                            
                            if (!hasSquareBrackets) {
                                return match; // No brackets found, preserve element
                            }
                            
                            console.log('?? [HTML-CLEANER] Found block element with square bracket content:', match.substring(0, 100) + '...');
                            
                            // Check if this element has important classes that should be preserved
                            var importantClasses = mergeImportant(['fr-', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'ayah-card', 'container', 'row', 'col-']);
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            
                            // Check for important IDs
                            var hasImportantId = match.indexOf('id=') !== -1;
                            
                            // If element has important classes or IDs, preserve it
                            if (hasImportantClass || hasImportantId) {
                                console.log('?? [HTML-CLEANER] Preserving block element with square brackets due to important classes/IDs');
                                return match;
                            }
                            
                            // Check for specific patterns that should be removed:
                            // 1. [SLIDE] patterns (common presentation markup)
                            var isSlidePattern = /\[SLIDE\]/i.test(innerContent);
                            
                            // 2. Content that is ONLY brackets with decorative characters (no other meaningful text)
                            var trimmedContent = innerContent.replace(/&nbsp;|&#160;|\u00A0|\s/g, ''); // Remove all whitespace
                            var isOnlyBracketContent = /^[-_\u2013\u2014]*\[[\s\S]*?\][-_\u2013\u2014]*$/i.test(trimmedContent);
                            
                            // 3. Very short content that's mostly brackets and decorative chars
                            var bracketContent = innerContent.match(/\[[\s\S]*?\]/g);
                            var bracketLength = bracketContent ? bracketContent.join('').length : 0;
                            var totalLength = innerContent.length;
                            var isMainlyBrackets = bracketLength > (totalLength * 0.7); // More than 70% is bracket content
                            
                            if (isSlidePattern || isOnlyBracketContent || (isMainlyBrackets && totalLength < 50)) {
                                console.log('?? [HTML-CLEANER] Removing block element with bracket pattern:', {
                                    isSlide: isSlidePattern,
                                    isOnlyBrackets: isOnlyBracketContent,
                                    isMainlyBrackets: isMainlyBrackets,
                                    content: innerContent.substring(0, 50),
                                    bracketRatio: bracketLength / totalLength
                                });
                                return ''; // Remove the entire block element
                            }
                            
                            console.log('?? [HTML-CLEANER] Preserving block element with square brackets - contains meaningful content beyond brackets');
                            return match; // Preserve if it contains substantial content beyond brackets
                        })
                        // === NEW: Remove 3-character strings like "***", "---", "...", etc. ===
                        .replace(/\*{3,}/g, '') // Remove 3 or more consecutive asterisks
                        .replace(/-{3,}/g, '') // Remove 3 or more consecutive dashes
                        .replace(/\.{3,}/g, '') // Remove 3 or more consecutive dots
                        .replace(/_{3,}/g, '') // Remove 3 or more consecutive underscores
                        .replace(/={3,}/g, '') // Remove 3 or more consecutive equals signs
                        .replace(/\+{3,}/g, '') // Remove 3 or more consecutive plus signs
                        .replace(/##{3,}/g, '') // Remove 3 or more consecutive hash signs
                        .replace(/\*{2,}/g, '') // Remove 2 or more consecutive asterisks (remaining cases)
                        .replace(/^\s*[\*\-\.\_\=\+\#]{3,}\s*$/gm, '') // Remove lines containing only 3+ repetitive characters
                        .replace(/(\s|^)[\*\-\.\_\=\+\#]{3,}(\s|$)/g, '$1$2') // Remove isolated 3+ character groups
                        .replace(/[\*\-\.\_\=\+\#]+\s*[\*\-\.\_\=\+\#]+\s*[\*\-\.\_\=\+\#]+/g, '') // Remove multiple groups of 3+ chars
                        // Clean up any extra whitespace left behind after blockquote and code removal
                        .replace(/\s*\n\s*\n\s*/g, '\n')
                        // Fix spacing issues around tags (but preserve intentional spaces in content)
                        .replace(/>\s+</g, function (match) {
                            // Only compress if it's truly whitespace between tags
                            var whitespace = match.substring(1, match.length - 1);
                            if (/^\s*$/.test(whitespace)) {
                                return '><';
                            }
                            return match; // Keep original if it contains non-whitespace
                        })
                        // === NEW: Advanced Block Element Consolidation ===
                        // 1. Handle <div><p></p></div> -> reduce to <p></p>
                        .replace(/<div[^>]*>\s*<p([^>]*)>\s*<\/p>\s*<\/div>/gi, function (match, pAttrs) {
                            // Only consolidate if div has no important classes or IDs
                            var importantClasses = mergeImportant(['fr-', 'ayah-card', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'container', 'row', 'col-']);
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf('class="' + cls) !== -1 || match.indexOf("class='" + cls) !== -1;
                            });
                            if (match.indexOf('id=') === -1 && !hasImportantClass) {
                                return '<p' + pAttrs + '></p>';
                            }
                            return match;
                        })
                        // 2. Handle <p><div><p> -> reduce to <p>
                        .replace(/<p[^>]*>\s*<div[^>]*>\s*<p([^>]*)>/gi, function (match, innerPAttrs) {
                            // Check if any element has important attributes
                            var importantClasses = mergeImportant(['fr-', 'ayah-card', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'example']);
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            if (match.indexOf('id=') === -1 && !hasImportantClass) {
                                return '<p' + innerPAttrs + '>';
                            }
                            return match;
                        })
                        // 3. Handle <div><br></div> -> remove completely
                        .replace(/<div[^>]*>\s*<br\s*\/?>\s*<\/div>/gi, function (match) {
                            var importantClasses = mergeImportant(['fr-', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'container', 'row', 'col-']);
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            // Special handling for ayah-card: always remove if it only contains <br> tags
                            if (match.indexOf('ayah-card') !== -1) {
                                return ''; // Always remove ayah-card divs that only contain <br> tags
                            }
                            if (match.indexOf('id=') === -1 && match.indexOf('style=') === -1 && !hasImportantClass) {
                                return '';
                            }
                            return match;
                        })
                        // NEW: Handle <div><p><br></p></div> -> remove completely (empty paragraphs wrapped in divs)
                        .replace(/<div[^>]*>\s*<p[^>]*>\s*<br\s*\/?>\s*<\/p>\s*<\/div>/gi, function (match) {
                            var importantClasses = mergeImportant(['fr-', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'container', 'row', 'col-', 'poetry-wrapper', 'poetry-section', 'poetry-couplet']);
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            console.log('?? [HTML-CLEANER] Found empty paragraph wrapped in div:', match.substring(0, 100) + '...');
                            // Remove empty paragraphs wrapped in divs unless they have important attributes
                            if (match.indexOf('id=') === -1 && match.indexOf('style=') === -1 && !hasImportantClass) {
                                console.log('?? [HTML-CLEANER] Removing empty paragraph wrapped in div');
                                return '';
                            }
                            return match;
                        })
                        // NEW: Handle <div><p></p></div> -> remove completely (truly empty paragraphs wrapped in divs)
                        .replace(/<div[^>]*>\s*<p[^>]*>\s*<\/p>\s*<\/div>/gi, function (match) {
                            var importantClasses = mergeImportant(['fr-', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'container', 'row', 'col-', 'poetry-wrapper', 'poetry-section', 'poetry-couplet']);
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            console.log('?? [HTML-CLEANER] Found truly empty paragraph wrapped in div:', match.substring(0, 100) + '...');
                            // Remove truly empty paragraphs wrapped in divs unless they have important attributes
                            if (match.indexOf('id=') === -1 && match.indexOf('style=') === -1 && !hasImportantClass) {
                                console.log('?? [HTML-CLEANER] Removing truly empty paragraph wrapped in div');
                                return '';
                            }
                            return match;
                        })
                        // NEW: Handle multiple empty paragraphs in divs -> remove completely
                        .replace(/<div[^>]*>(\s*<p[^>]*>\s*(<br\s*\/?>)?\s*<\/p>\s*)+<\/div>/gi, function (match) {
                            var importantClasses = mergeImportant(['fr-', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'container', 'row', 'col-', 'poetry-wrapper', 'poetry-section', 'poetry-couplet']);
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            console.log('?? [HTML-CLEANER] Found multiple empty paragraphs wrapped in div:', match.substring(0, 100) + '...');
                            // Remove multiple empty paragraphs wrapped in divs unless they have important attributes
                            if (match.indexOf('id=') === -1 && match.indexOf('style=') === -1 && !hasImportantClass) {
                                console.log('?? [HTML-CLEANER] Removing multiple empty paragraphs wrapped in div');
                                return '';
                            }
                            return match;
                        })
                        // 4. Handle multiple nested empty block elements -> reduce to single <p>
                        .replace(/<(div|p|h[1-6])[^>]*>\s*<(div|p|h[1-6])[^>]*>\s*<\/(div|p|h[1-6])>\s*<\/(div|p|h[1-6])>/gi, function (match) {
                            var importantClasses = mergeImportant(['fr-', 'ayah-card', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'container', 'row', 'col-']);
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            if (match.indexOf('id=') === -1 && match.indexOf('style=') === -1 && !hasImportantClass) {
                                return '<p></p>';
                            }
                            return match;
                        })
                        // 5. Handle consecutive different block elements with same content -> reduce to single element
                        .replace(/<(div|p|h[1-6])[^>]*>([^<]*)<\/\1>\s*<(div|p|h[1-6])[^>]*>\2<\/\3>/gi, function (match, tag1, content, tag2) {
                            var importantClasses = mergeImportant(['fr-', 'ayah-card', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'example']);
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            if (match.indexOf('id=') === -1 && match.indexOf('style=') === -1 && !hasImportantClass && content.trim()) {
                                return '<p>' + content + '</p>';
                            }
                            return match;
                        })
                        // 6. Handle block elements containing only whitespace and other block elements
                        .replace(/<(div|p|h[1-6])[^>]*>\s*(<(div|p|h[1-6])[^>]*>[\s\S]*?<\/\3>)\s*<\/\1>/gi, function (match, outerTag, innerContent, innerTag) {
                            var importantClasses = mergeImportant(['fr-', 'ayah-card', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'container', 'row', 'col-']);
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            if (match.indexOf('id=') === -1 && match.indexOf('style=') === -1 && !hasImportantClass) {
                                return innerContent;
                            }
                            return match;
                        })
                        // 7. Handle mixed block elements with br tags -> consolidate
                        .replace(/(<(div|p|h[1-6])[^>]*>\s*<br\s*\/?>\s*<\/\2>\s*)+/gi, function (match) {
                            var importantClasses = mergeImportant(['fr-', 'ayah-card', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card']);
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            if (match.indexOf('id=') === -1 && match.indexOf('style=') === -1 && !hasImportantClass) {
                                return '<p><br></p>';
                            }
                            return match;
                        })
                        // 8. Handle empty nested structures like <div><div></div></div>
                        .replace(/<(div|p|h[1-6])[^>]*>\s*<(div|p|h[1-6])[^>]*>\s*<\/\2>\s*<\/\1>/gi, function (match) {
                            var importantClasses = ['fr-', 'ayah-card', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'container', 'row', 'col-'];
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            if (match.indexOf('id=') === -1 && match.indexOf('style=') === -1 && !hasImportantClass) {
                                return '';
                            }
                            return match;
                        })
                        // 9. Handle multiple consecutive empty paragraphs -> reduce to single paragraph
                        .replace(/(<p[^>]*>\s*<\/p>\s*){2,}/gi, function (match) {
                            var importantClasses = ['fr-', 'ayah-card', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'example'];
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            if (match.indexOf('id=') === -1 && match.indexOf('style=') === -1 && !hasImportantClass) {
                                return '<p></p>';
                            }
                            return match;
                        })
                        // === NEW: LIST ITEM CLEANUP RULES ===
                        // 10. Handle <li><p>content</p></li> -> reduce to <li>content</li>
                        .replace(/<li([^>]*)>\s*<p([^>]*)>([\s\S]*?)<\/p>\s*<\/li>/gi, function (match, liAttrs, pAttrs, content) {
                            // Only consolidate if neither li nor p have important attributes
                            var hasImportantClasses = match.indexOf('fr-') !== -1 ||
                                match.indexOf('class=') !== -1 &&
                                (match.indexOf('ayah-') !== -1 || match.indexOf('important') !== -1);
                            var hasImportantAttrs = match.indexOf('id=') !== -1 ||
                                match.indexOf('style=') !== -1;
                            if (!hasImportantClasses && !hasImportantAttrs) {
                                return '<li' + liAttrs + '>' + content.trim() + '</li>';
                            }
                            return match;
                        })
                        // 11. Handle <li><div>content</div></li> -> reduce to <li>content</li>
                        .replace(/<li([^>]*)>\s*<div([^>]*)>([\s\S]*?)<\/div>\s*<\/li>/gi, function (match, liAttrs, divAttrs, content) {
                            // Only consolidate if neither li nor div have important attributes
                            var hasImportantClasses = match.indexOf('fr-') !== -1 ||
                                match.indexOf('class=') !== -1 &&
                                (match.indexOf('ayah-') !== -1 || match.indexOf('important') !== -1 ||
                                    match.indexOf('container') !== -1 || match.indexOf('row') !== -1 ||
                                    match.indexOf('col-') !== -1);
                            var hasImportantAttrs = match.indexOf('id=') !== -1 ||
                                match.indexOf('style=') !== -1;
                            if (!hasImportantClasses && !hasImportantAttrs) {
                                return '<li' + liAttrs + '>' + content.trim() + '</li>';
                            }
                            return match;
                        })
                        // 12. Handle <li><h1-h6>content</h1-h6></li> -> reduce to <li>content</li>
                        .replace(/<li([^>]*)>\s*<(h[1-6])([^>]*)>([\s\S]*?)<\/\2>\s*<\/li>/gi, function (match, liAttrs, hTag, hAttrs, content) {
                            // Only consolidate if neither li nor heading have important attributes
                            var hasImportantClasses = match.indexOf('fr-') !== -1 ||
                                match.indexOf('class=') !== -1 &&
                                (match.indexOf('ayah-') !== -1 || match.indexOf('important') !== -1);
                            var hasImportantAttrs = match.indexOf('id=') !== -1 ||
                                match.indexOf('style=') !== -1;
                            if (!hasImportantClasses && !hasImportantAttrs) {
                                return '<li' + liAttrs + '>' + content.trim() + '</li>';
                            }
                            return match;
                        })
                        // 13. Handle multiple nested blocks in li -> extract content from the first meaningful block
                        .replace(/<li([^>]*)>\s*<(p|div|h[1-6])([^>]*)>([\s\S]*?)<\/\2>\s*<(p|div|h[1-6])([^>]*?)>[\s\S]*?<\/\5>\s*<\/li>/gi, function (match, liAttrs, firstTag, firstAttrs, firstContent) {
                            // Only consolidate if li doesn't have important attributes and the nested elements don't either
                            var hasImportantClasses = match.indexOf('fr-') !== -1 ||
                                match.indexOf('class=') !== -1 &&
                                (match.indexOf('ayah-') !== -1 || match.indexOf('important') !== -1 ||
                                    match.indexOf('container') !== -1 || match.indexOf('row') !== -1 ||
                                    match.indexOf('col-') !== -1);
                            var hasImportantAttrs = match.indexOf('id=') !== -1 ||
                                match.indexOf('style=') !== -1;
                            if (!hasImportantClasses && !hasImportantAttrs && firstContent.trim()) {
                                return '<li' + liAttrs + '>' + firstContent.trim() + '</li>';
                            }
                            return match;
                        })
                        // === EXISTING CLEANUP RULES (Enhanced) ===
                        // Remove ALL elements that only contain <br> tags, even if they have classes (but preserve those with meaningful content)
                        .replace(/<(h[1-6]|div|p|span)[^>]*>\s*<br\s*\/?>\s*<\/\1>/gi, function (match) {
                            // Keep elements that have specific important classes that might need to be preserved
                            var importantClasses = mergeImportant(['fr-', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card']);
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            // Special handling for ayah-card: always remove if it only contains <br> tags
                            if (match.indexOf('ayah-card') !== -1) {
                                return ''; // Always remove ayah-card elements that only contain <br> tags
                            }
                            // Keep elements with IDs or important classes, remove others
                            if (match.indexOf('id=') !== -1 || hasImportantClass) {
                                return match;
                            }
                            return ''; // Remove elements that only contain <br> tags
                        })
                        // Remove ALL elements that only contain multiple <br> tags, even if they have classes
                        .replace(/<(h[1-6]|div|p|span)[^>]*>(\s*<br\s*\/?>)+\s*<\/\1>/gi, function (match) {
                            // Keep elements that have specific important classes that might need to be preserved
                            var importantClasses = ['fr-', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card'];
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            // Special handling for ayah-card: always remove if it only contains multiple <br> tags
                            if (match.indexOf('ayah-card') !== -1) {
                                return ''; // Always remove ayah-card elements that only contain multiple <br> tags
                            }
                            // Keep elements with IDs or important classes, remove others
                            if (match.indexOf('id=') !== -1 || hasImportantClass) {
                                return match;
                            }
                            return ''; // Remove elements that only contain multiple <br> tags
                        })
                        // Remove truly empty headings (but keep those with &nbsp; or important styling)
                        .replace(/<(h[1-6])[^>]*>\s*<\/\1>/gi, function (match) {
                            // Only remove if heading has no important attributes and is truly empty
                            if (match.indexOf('id=') === -1 &&
                                match.indexOf('&nbsp;') === -1 &&
                                match.indexOf('fr-') === -1) {
                                return '';
                            }
                            return match; // Keep if it has important attributes or content
                        })
                        // Remove truly empty paragraphs (but keep those with &nbsp; or important styling)
                        .replace(/<p[^>]*>\s*<\/p>/gi, function (match) {
                            // Only remove if paragraph has no important attributes and is truly empty
                            if (match.indexOf('id=') === -1 &&
                                match.indexOf('&nbsp;') === -1 &&
                                match.indexOf('fr-') === -1) {
                                return '';
                            }
                            return match; // Keep if it has important attributes or content
                        })
                        // Remove truly empty divs (but preserve those with important classes/styles/content)
                        .replace(/<div[^>]*>\s*<\/div>/gi, function (match) {
                            // Keep elements that have specific important classes that might need to be preserved
                            var importantClasses = mergeImportant(['fr-', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card', 'container', 'row', 'col-']);
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            // Special handling for ayah-card: remove if empty even if it has the class
                            if (match.indexOf('ayah-card') !== -1) {
                                return ''; // Always remove empty ayah-card divs
                            }
                            // Keep elements with IDs, styles, or important classes
                            if (match.indexOf('id=') !== -1 ||
                                match.indexOf('style=') !== -1 ||
                                match.indexOf('&nbsp;') !== -1 ||
                                hasImportantClass) {
                                return match;
                            }
                            return ''; // Remove truly empty divs
                        })
                        // Remove truly empty spans (but preserve those with important classes/styles)
                        .replace(/<span[^>]*>\s*<\/span>/gi, function (match) {
                            // Keep elements that have specific important classes that might need to be preserved
                            var importantClasses = mergeImportant(['fr-', 'inlineArabic', 'highlight', 'ayah-']);
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            // Keep elements with IDs, styles, or important classes
                            if (match.indexOf('id=') !== -1 ||
                                match.indexOf('style=') !== -1 ||
                                match.indexOf('&nbsp;') !== -1 ||
                                hasImportantClass) {
                                return match;
                            }
                            return ''; // Remove truly empty spans
                        })
                        // Clean up consecutive empty heading elements with line breaks
                        .replace(/(<(h[1-6])[^>]*>\s*<br\s*\/?>\s*<\/\2>\s*){2,}/gi, '')
                        // Clean up consecutive empty divs with line breaks
                        .replace(/(<div[^>]*>\s*<br\s*\/?>\s*<\/div>\s*){2,}/gi, '')
                        // Clean up consecutive empty paragraphs with line breaks
                        .replace(/(<p[^>]*>\s*<br\s*\/?>\s*<\/p>\s*){2,}/gi, '')
                        // Clean up consecutive empty block elements (h1-h6, div, p)
                        .replace(/(<(h[1-6]|div|p)[^>]*>\s*<\/\2>\s*){2,}/gi, function (match) {
                            // Only remove if none of the elements have important classes, styles, or IDs
                            var importantClasses = ['fr-', 'ayah-card', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card'];
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            if (match.indexOf('id=') === -1 &&
                                match.indexOf('style=') === -1 &&
                                !hasImportantClass) {
                                return '';
                            }
                            return match; // Keep if any element has important attributes
                        })
                        // Clean up mixed consecutive empty block elements with comprehensive pattern
                        .replace(/(\s*<(h[1-6]|div|p)[^>]*>(\s*<br\s*\/?>\s*)*<\/(h[1-6]|div|p)>\s*){2,}/gi, function (match) {
                            // Only remove if none of the elements have important classes, styles, or IDs
                            var importantClasses = ['fr-', 'ayah-card', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card'];
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            if (match.indexOf('id=') === -1 &&
                                match.indexOf('style=') === -1 &&
                                !hasImportantClass) {
                                return '';
                            }
                            return match; // Keep if any element has important attributes
                        })
                        // Clean up excessive line breaks (more than 2 consecutive)
                        .replace(/\n{3,}/g, '\n\n')
                        // Clean up excessive spaces (more than 2 consecutive)
                        .replace(/ {3,}/g, '  ')
                        // Final cleanup: ensure no multiple consecutive block elements remain
                        .replace(/(<(p|div|h[1-6])[^>]*><\/\2>\s*){2,}/gi, function (match) {
                            var importantClasses = ['fr-', 'ayah-card', 'golden-surah-header', 'translation-header', 'esotericBlock', 'previligedBlock', 'etymology-card'];
                            var hasImportantClass = importantClasses.some(function (cls) {
                                return match.indexOf(cls) !== -1;
                            });
                            if (match.indexOf('id=') === -1 && match.indexOf('style=') === -1 && !hasImportantClass) {
                                return '<p></p>';
                            }
                            return match;
                        })
                        // Remove empty paragraphs that contain only non-breaking spaces (&nbsp; or unicode NBSP)
                        // when they occur between block elements (e.g. </div><p>&nbsp;</p><div>)
                        .replace(/(<\/(?:div|p|h[1-6])[^>]*>\s*)<p[^>]*>\s*(?:&nbsp;|&#160;|\u00A0|\s)*<\/p>\s*(?=<(?:div|p|h[1-6])[^>]*>)/gi, '$1')
                        // Fallback: collapse stray empty <p> that are simply between tags without explicit closing tag capture
                        .replace(/>\s*<p[^>]*>\s*(?:&nbsp;|&#160;|\u00A0|\s)*<\/p>\s*</gi, '><')
                        // Trim only leading/trailing whitespace from the entire document
                        .trim();
                    // === RESTORATION: Restore protected content ===
                    // 1. Restore ahadees modal/panel elements (NOT the inserted content)
                    for (var i = 0; i < ahadeesModalSections.length; i++) {
                        var placeholderModal = '<!--AHADEES_MODAL_' + i + '-->';
                        var ahadeesModalRegex = new RegExp(placeholderModal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                        cleanedHtml = cleanedHtml.replace(ahadeesModalRegex, ahadeesModalSections[i]);
                        console.log('?? [HTML-CLEANER] Restored ahadees modal/panel element ' + i);
                    }
                    // 1b. Restore inserted ahadees placeholders (protected inserted blocks)
                    for (var ai = 0; ai < ahadeesInsertedSections.length; ai++) {
                        var ph = '<!--AHADEES_SECTION_' + ai + '-->';
                        var phRegex = new RegExp(ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                        cleanedHtml = cleanedHtml.replace(phRegex, ahadeesInsertedSections[ai]);
                        console.log('?? [HTML-CLEANER] Restored inserted ahadees section ' + ai);
                    }
                    // 2. Restore poetry sections (using UUID markers and global regex replacement)
                    console.log('?? [HTML-CLEANER] About to restore poetry placeholders, HTML length:', cleanedHtml.length);
                    console.log('?? [HTML-CLEANER] HTML snippet for debugging:', cleanedHtml.substring(0, 500));
                    for (var j = 0; j < poetrySections.length; j++) {
                        if (poetryPlaceholders && poetryPlaceholders[j]) {
                            var currentPlaceholder = poetryPlaceholders[j];
                            console.log('?? [HTML-CLEANER] Looking for UUID placeholder:', currentPlaceholder);
                            console.log('?? [HTML-CLEANER] Does HTML contain this placeholder?', cleanedHtml.indexOf(currentPlaceholder) !== -1);
                            // Clean the poetry content before restoring it
                            var cleanedPoetryContent = cleanPoetryContent(poetrySections[j]);
                            // Use global regex replace to handle multiple occurrences and adjacent placeholders
                            var poetryRegex = new RegExp(currentPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                            var beforeReplace = cleanedHtml.length;
                            cleanedHtml = cleanedHtml.replace(poetryRegex, cleanedPoetryContent);
                            var afterReplace = cleanedHtml.length;
                            console.log('?? [HTML-CLEANER] Restored and cleaned UUID poetry element ' + j + ' (length change: ' + (afterReplace - beforeReplace) + ')');
                        } else {
                            console.log('?? [HTML-CLEANER] No UUID placeholder found for poetry section ' + j);
                        }
                    }
                    console.log('? [HTML-CLEANER] ===== HTML CLEANUP COMPLETED =====');
                    console.log('? [HTML-CLEANER] Inserted ahadees divs converted to placeholder text');
                    console.log('? [HTML-CLEANER] Ahadees modal/panel preserved');
                    console.log('? [HTML-CLEANER] Poetry sections preserved and cleaned (comments and excessive spaces removed)');
                    console.log('? [HTML-CLEANER] Final cleaned HTML length:', cleanedHtml.length);
                    editor.html.set(cleanedHtml);
                    if (editor.save && editor.save.save) {
                        editor.save.save();
                    }
                    // Show success notification (with fallback to console if toast not available)
                    try {
                        if (typeof showToastNotification === 'function') {
                            showToastNotification('success', 'HTML Cleaned', 'HTML has been cleaned. Inserted ahadees converted to placeholder text, ahadees modal/panel preserved, and poetry content cleaned (comments and excessive spaces removed).');
                        } else {
                            console.log('? [HTML-CLEANER] SUCCESS: HTML has been cleaned. Inserted ahadees converted to placeholder text, ahadees modal/panel preserved, and poetry content cleaned (comments and excessive spaces removed).');
                        }
                    } catch (e) {
                        console.log('? [HTML-CLEANER] SUCCESS: HTML has been cleaned. Inserted ahadees converted to placeholder text, ahadees modal/panel preserved, and poetry content cleaned (comments and excessive spaces removed).');
                    }
                    console.log('? [HTML-CLEANER] Cleanup completed successfully');
                    // HTML cleaned successfully
                } catch (error) {
                    console.error('? [HTML-CLEANER] Exception during HTML cleaning:', error);
                    console.error('? [HTML-CLEANER] Error stack:', error.stack);
                    // Log error instead of showing dialog (dialog service not available in this context)
                    console.error('? [HTML-CLEANER] Error: ' + error.message);
                    console.error('? [HTML-CLEANER] Failed to clean HTML. Please check the console for details.');
                }
            }
        });
    }
    function froalaConfig(common, datacontext, quranService, dlg, $filter) {
        // Define the functions and properties to reveal.
        registerButtons();
        var service = {
            fEditorSimpleOptions: function (onInit) {
                return {
                    toolbarButtons: [
                        "undo", "redo", "|",
                        "color", "bold", "italic", "underline"
                    ],
                    shortcutsEnabled: ["show", "bold", "italic", "underline", "undo", "redo"],
                    theme: "royal",
                    heightMin: 150,
                    spellcheck: true,
                    events: {
                        'froalaEditor.initialized': onInit
                    }
                };
            },
            fEditorAdvancedOptions: function (events, autoSaveOptions) {
                var froalaOpts = {
                    toolbarButtons: [
                        "fullscreen", "clearFormatting", "|", "bold", "italic", "underline", "insertLink",
                        "fontSize", "|", "color", "emoticons", "inlineStyle", "paragraphStyle", "paragraphFormat", "|", "align",
                        "formatOL", "formatUL", "outdent", "indent", "-", "insertLink", "insertImage", "insertVideo",
                        "insertTable", "undo", "redo", "|", "htmlCleanerButton", "|", "highlightButton", "tradFontButton", "amiriFontButton",
                        "|", "tokenizeButton", "previligedDataButton", "esotericButton", "etymologyButton", "|", "copyToClipboardButton", "pasteFromClipboardButton", "ahadees", "etymologyManagementButton", "poetryButton", "|", "html"
                    ],
                    // Add responsive toolbar configurations
                    toolbarButtonsMD: [
                        "fullscreen", "clearFormatting", "|", "bold", "italic", "underline",
                        "fontSize", "|", "color", "inlineStyle", "paragraphFormat", "|", "align",
                        "formatOL", "formatUL", "insertVideo", "undo", "redo", "|", "htmlCleanerButton", "|", "highlightButton", "tradFontButton",
                        "|", "tokenizeButton", "copyToClipboardButton", "pasteFromClipboardButton", "ahadees", "etymologyManagementButton", "poetryButton", "|", "html"
                    ],
                    toolbarButtonsSM: [
                        "bold", "italic", "underline", "|", "color", "paragraphFormat", "|", "align",
                        "formatOL", "formatUL", "insertVideo", "|", "undo", "redo", "|", "htmlCleanerButton", "|", "highlightButton", "copyToClipboardButton", "ahadees", "etymologyManagementButton", "poetryButton", "html"
                    ],
                    toolbarButtonsXS: [
                        "bold", "italic", "|", "insertVideo", "undo", "redo", "|", "htmlCleanerButton", "copyToClipboardButton", "ahadees", "etymologyManagementButton", "poetryButton", "html"
                    ],
                    codeBeautifierOptions: {
                        end_with_newline: true,
                        indent_inner_html: true,
                        extra_liners: "['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'ul', 'ol', 'table', 'dl']",
                        brace_style: "expand",
                        indent_char: " ",
                        indent_size: 4,
                        wrap_line_length: 0
                    },
                    theme: "royal",
                    shortcutsEnabled: [
                        "show", "bold", "italic", "underline", "inlineStyle", "paragraphStyle", "indent", "outdent",
                        "undo", "redo", "insertImage", "createLink",
                        "amiriFontButton", "tradFontButton", "tokenizeButton", "highlightButton", "htmlCleanerButton",
                        "copyToClipboardButton", "pasteFromClipboardButton"
                    ], // Added clipboard buttons to shortcuts
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
                    //To save the file on the server
                    paragraphStyles: {
                        "verse-container": "Showcase Verse",
                        anecdote: "Anecdote / Side Notes",
                        example: "Story / Example",
                        quote: "Quote",
                        urduNastaleeq: "Urdu Nastaleeq",
                        inlineArabic: "Inline Arabic",
                        style1: "Format Style 1"
                    },
                    imageEditButtons: [
                        "imageReplace", "imageAlign", "imageRemove", "|", "imageLink", "linkOpen", "linkEdit", "linkRemove", "-", "imageDisplay", "imageStyle", "imageAlt", "imageSize"
                    ],
                    imageStyles: {
                        'imgResponsive': "Responsive",
                        'fr-rounded': "Rounded",
                        'fr-bordered': "Bordered"
                    },
                    imagePaste: true,
                    imagePasteProcess: false,
                    imageMove: true,
                    inlineStyles: {
                        'Arabic Inline': "font-family: KashkoleTradArabic;font-size: 2em;word-spacing: 5px;letter-spacing: normal!important;padding-left: 2px;padding-right: 2px;font-style: normal;",
                        'Urdu Nastaleeq': "color: black;font-family: KashkoleNastaleeq;font-size: 28px!important;font-style: normal;direction: rtl !important;line-height: 0.5em;word-spacing: 4px;letter-spacing: -1px;",
                        'Format_Style1': "font-family: Charm, cursive;font-size: 1.1em;padding-left: 2px;padding-right: 2px;font-style: normal;color: #e41b1b;"
                    },
                    imageManagerPageSize: 10,
                    imageManagerScrollOffset: 5,
                    imageManagerLoadMethod: "GET",
                    imageManagerDeleteMethod: "DELETE",
                    // === YouTube Video Embedding Configuration ===
                    videoUpload: false, // Disable file upload, use embeds only
                    videoAllowedTypes: ['mp4', 'webm', 'ogg'],
                    videoInsertButtons: ['videoBack', '|', 'videoByURL', 'videoEmbed'],
                    videoDefaultWidth: 600,
                    videoResponsive: true,
                    videoSizeButtons: ['videoBack', '|', 'videoSetSize', 'videoResponsive'],
                    // Enhanced HTML tag and attribute allowlists for YouTube embeds
                    htmlAllowedTags: [
                        'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 
                        'blockquote', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 
                        'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 
                        'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                        'header', 'hgroup', 'hr', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 
                        'legend', 'li', 'link', 'main', 'map', 'mark', 'menu', 'menuitem', 'meter', 'nav', 
                        'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'pre', 
                        'progress', 'queue', 's', 'samp', 'script', 'style', 'section', 'select', 'small', 
                        'source', 'span', 'strike', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 
                        'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 
                        'video', 'wbr'
                    ],
                    // Enhanced HTML attributes for YouTube embeds
                    htmlAllowedAttrs: [
                        'accept', 'accept-charset', 'accesskey', 'action', 'align', 'allowfullscreen', 'alt', 
                        'async', 'autocomplete', 'autofocus', 'autoplay', 'autosave', 'background', 'bgcolor', 
                        'border', 'charset', 'cellpadding', 'cellspacing', 'checked', 'cite', 'class', 'color', 
                        'cols', 'colspan', 'content', 'contenteditable', 'controls', 'coords', 'data', 'data-.*', 
                        'datetime', 'default', 'defer', 'dir', 'dirname', 'disabled', 'download', 'draggable', 
                        'dropzone', 'enctype', 'for', 'form', 'formaction', 'frameborder', 'headers', 'height', 
                        'hidden', 'high', 'href', 'hreflang', 'http-equiv', 'icon', 'id', 'ismap', 'itemprop', 
                        'keytype', 'kind', 'label', 'lang', 'language', 'list', 'loop', 'low', 'manifest', 'max', 
                        'maxlength', 'media', 'method', 'min', 'multiple', 'name', 'novalidate', 'open', 'optimum', 
                        'pattern', 'ping', 'placeholder', 'poster', 'preload', 'pubdate', 'radiogroup', 'readonly', 
                        'rel', 'required', 'reversed', 'rows', 'rowspan', 'sandbox', 'scope', 'scoped', 'scrolling', 
                        'seamless', 'selected', 'shape', 'size', 'sizes', 'span', 'src', 'srcdoc', 'srclang', 
                        'srcset', 'start', 'step', 'style', 'summary', 'tabindex', 'target', 'title', 'type', 
                        'usemap', 'value', 'width', 'wrap'
                    ]
                };
                if (!froalaOpts.events) {
                    froalaOpts.events = {};
                }
                // Row-Remover Click Handler - replace old blocks with new ayah-cards
                // === Enhanced Global Event Handlers ===
                // Always add imageManager.beforeDeleteImage handler to replace browser confirm with bootstrap dialog
                froalaOpts.events["froalaEditor.imageManager.beforeDeleteImage"] = function(e, editor, $img) {
                    console.log('🖼️ [IMAGE-MANAGER] Before delete image event triggered', {
                        imageSrc: $img.attr('src'),
                        imageAlt: $img.attr('alt'),
                        editorId: editor.id
                    });
                    
                    // Prevent the default browser confirm dialog
                    e.preventDefault();
                    
                    // Show bootstrap confirmation dialog instead
                    var imageName = $img.attr('alt') || $img.attr('src').split('/').pop() || 'this image';
                    var message = "Are you sure you want to delete '" + imageName + "'? This action cannot be undone.";
                    
                    dlg.confirmationDialog("Delete Image", message, "Delete", "Cancel")
                        .then(function(result) {
                            if (result === "ok") {
                                console.log('🖼️ [IMAGE-MANAGER] User confirmed deletion, proceeding...');
                                
                                // Manually trigger the deletion process
                                // We need to simulate what the original code would do
                                if (editor.opts.imageManagerDeleteURL) {
                                    $img.parent().addClass('fr-image-deleting');
                                    
                                    // Make the delete request
                                    $.ajax({
                                        method: editor.opts.imageManagerDeleteMethod || 'DELETE',
                                        url: editor.opts.imageManagerDeleteURL,
                                        data: $.extend({ src: $img.attr('src') }, editor.opts.imageManagerDeleteParams || {}),
                                        crossDomain: editor.opts.requestWithCORS,
                                        xhrFields: {
                                            withCredentials: editor.opts.requestWithCredentials
                                        },
                                        headers: editor.opts.requestHeaders
                                    })
                                    .done(function(data) {
                                        console.log('🖼️ [IMAGE-MANAGER] Image deleted successfully', data);
                                        
                                        // Remove the image from the manager UI
                                        $img.parent().remove();
                                        
                                        // Trigger the imageDeleted event
                                        editor.events.trigger('imageManager.imageDeleted', [data]);
                                        
                                        // Show success notification
                                        if (typeof common !== 'undefined' && common.logger) {
                                            common.logger.logSuccess('Image deleted successfully', null, 'Image Manager');
                                        }
                                    })
                                    .fail(function(xhr, status, error) {
                                        console.error('🖼️ [IMAGE-MANAGER] Failed to delete image', {
                                            status: status,
                                            error: error,
                                            response: xhr.responseText
                                        });
                                        
                                        // Remove the deleting class
                                        $img.parent().removeClass('fr-image-deleting');
                                        
                                        // Show error notification
                                        if (typeof common !== 'undefined' && common.logger) {
                                            common.logger.logError('Failed to delete image: ' + error, null, 'Image Manager');
                                        } else {
                                            // Fallback to bootstrap dialog for error
                                            dlg.confirmationDialog("Error", "Failed to delete image: " + error, "OK", null);
                                        }
                                    });
                                } else {
                                    // No delete URL configured, just remove from UI
                                    $img.parent().remove();
                                    console.log('🖼️ [IMAGE-MANAGER] Image removed from UI (no delete URL configured)');
                                }
                            } else {
                                console.log('🖼️ [IMAGE-MANAGER] User cancelled deletion');
                            }
                        })
                        .catch(function(error) {
                            console.error('🖼️ [IMAGE-MANAGER] Error showing confirmation dialog:', error);
                            // Fallback to bootstrap dialog if available, otherwise browser confirm
                            var fallbackMessage = "Are you sure you want to delete this image? (Dialog system error)";
                            
                            try {
                                if (typeof dlg !== 'undefined' && dlg.confirmationDialog) {
                                    dlg.confirmationDialog("Delete Image", fallbackMessage, "Delete", "Cancel")
                                        .then(function(result) {
                                            if (result === "ok") {
                                                // Proceed with deletion
                                                return true;
                                            }
                                        });
                                } else {
                                    // Ultimate fallback to browser confirm
                                    if (confirm(fallbackMessage)) {
                                        return true;
                                    }
                                }
                            } catch (finalError) {
                                console.error('🖼️ [IMAGE-MANAGER] All dialog systems failed:', finalError);
                                // Last resort browser confirm
                                if (confirm("Are you sure you want to delete this image?")) {
                                    return true;
                                }
                            }
                        });
                    
                    // Always return false to prevent the default confirm dialog
                    return false;
                };

                froalaOpts.events['froalaEditor.click'] = function (e, editor, clickEvent) {
                    // Ensure clickEvent exists before proceeding
                    if (!clickEvent || !clickEvent.target) {
                        return;
                    }
                    var $target = $(clickEvent.target);
                    // Handle esoteric eye icon clicks
                    if ($target.hasClass('fa-eye') && $target.closest('.esoteric-header').length) {
                        clickEvent.preventDefault();
                        clickEvent.stopPropagation();
                        dlg.confirmationDialog("Remove Esoteric Formatting", 
                            "Are you sure you want to remove the esoteric formatting and keep only the content?\n\nThis action cannot be undone.",
                            "Yes, Remove Formatting", "Cancel")
                            .then(function (result) {
                                if (result === "ok") {
                                    var $esotericBlock = $target.closest('.esotericBlock');
                                    if ($esotericBlock.length > 0) {
                                        // Extract the content from esotericData div
                                        var $esotericData = $esotericBlock.find('.esotericData');
                                        if ($esotericData.length > 0) {
                                            var innerContent = $esotericData.html();
                                            // Replace the entire esotericBlock with just the inner content
                                            $esotericBlock.replaceWith(innerContent);
                                            editor.undo.saveStep();
                                        } else {
                                            // If no esotericData found, just remove the entire block
                                            $esotericBlock.remove();
                                            editor.undo.saveStep();
                                        }
                                    }
                                }
                            });
                        return;
                    }
                    // Handle translation header clicks for updating Quran ayat translations
                    if ($target.hasClass('translation-header') || 
                        ($target.closest('.translation-header').length && $target.closest('.ayah-card').length)) {
                        clickEvent.preventDefault();
                        clickEvent.stopPropagation();
                        console.log('?? [TRANSLATION-UPDATE] Translation header clicked');
                        var $ayahCard = $target.closest('.ayah-card');
                        if ($ayahCard.length === 0) {
                            console.warn('?? [TRANSLATION-UPDATE] No ayah-card found');
                            return;
                        }
                        // Extract surah and ayat information from the ayah card
                        var $surahHeader = $ayahCard.find('.golden-surah-header');
                        if ($surahHeader.length === 0) {
                            console.warn('?? [TRANSLATION-UPDATE] No surah header found');
                            return;
                        }
                        // Extract surah and ayat numbers from the header text or ID
                        var headerText = $surahHeader.find('span').text();
                        var ayahCardId = $ayahCard.attr('id'); // e.g., "ayah-card-38-24"
                        console.log('?? [TRANSLATION-UPDATE] Header text:', headerText);
                        console.log('?? [TRANSLATION-UPDATE] Ayah card ID:', ayahCardId);
                        // Extract surah and ayat numbers from the ID (more reliable)
                        var surahNumber = null, ayatNumbers = null;
                        if (ayahCardId) {
                            var idMatch = ayahCardId.match(/ayah-card-(\d+)-(\d+(?:-\d+)?)/);
                            if (idMatch) {
                                surahNumber = parseInt(idMatch[1]);
                                ayatNumbers = idMatch[2];
                                console.log('?? [TRANSLATION-UPDATE] Extracted from ID - Surah:', surahNumber, 'Ayats:', ayatNumbers);
                            }
                        }
                        // Fallback: Extract from header text
                        if (!surahNumber || !ayatNumbers) {
                            var textMatch = headerText.match(/\((\d+):(\d+(?:-\d+)?)\)/);
                            if (textMatch) {
                                surahNumber = parseInt(textMatch[1]);
                                ayatNumbers = textMatch[2];
                                console.log('?? [TRANSLATION-UPDATE] Extracted from text - Surah:', surahNumber, 'Ayats:', ayatNumbers);
                            }
                        }
                        if (!surahNumber || !ayatNumbers) {
                            console.error('? [TRANSLATION-UPDATE] Could not extract surah and ayat numbers');
                            return;
                        }
                        // Get current translation text
                        var $translationElement = $ayahCard.find('.ayah-translation');
                        var currentTranslation = $translationElement.text();
                        // Clean the translation text to show what will be saved
                        var cleanedTranslation = cleanTranslationText(currentTranslation);
                        console.log('?? [TRANSLATION-UPDATE] Current translation length:', currentTranslation.length);
                        console.log('? [TRANSLATION-UPDATE] Cleaned translation length:', cleanedTranslation.length);
                        // Show confirmation dialog with cleaned translation preview
                        dlg.confirmationDialog("Update Translation", 
                            "Do you want to update the English translation for this verse?\n\n" +
                            "Surah " + surahNumber + ", Ayat " + ayatNumbers + "\n\n" +
                            "Translation to be saved: " + (cleanedTranslation.length > 100 ? 
                                cleanedTranslation.substring(0, 100) + "..." : cleanedTranslation),
                            "Yes, Update", "Cancel")
                            .then(function (result) {
                                if (result === "ok") {
                                    console.log('? [TRANSLATION-UPDATE] User confirmed translation update');
                                    updateQuranTranslation(surahNumber, ayatNumbers, currentTranslation, $translationElement, editor);
                                } else {
                                    console.log('? [TRANSLATION-UPDATE] User cancelled translation update');
                                }
                            })
                            .catch(function (error) {
                                console.error('? [TRANSLATION-UPDATE] Dialog error:', error);
                            });
                        return;
                    }
                    // Helper function to update Quran translation
                    function updateQuranTranslation(surahNumber, ayatNumbers, translationText, $translationElement, editor) {
                        console.log('?? [TRANSLATION-UPDATE] Starting translation update process');
                        console.log('?? [TRANSLATION-UPDATE] Parameters:', {
                            surahNumber: surahNumber,
                            ayatNumbers: ayatNumbers,
                            translationLength: translationText.length
                        });
                        // Handle multiple verses (e.g., "24-26" means verses 24, 25, 26)
                        var ayatList = [];
                        if (ayatNumbers.includes('-')) {
                            var range = ayatNumbers.split('-');
                            var startAyat = parseInt(range[0]);
                            var endAyat = parseInt(range[1]);
                            console.log('?? [TRANSLATION-UPDATE] Processing ayat range:', startAyat, '-', endAyat);
                            for (var i = startAyat; i <= endAyat; i++) {
                                ayatList.push(i);
                            }
                        } else {
                            ayatList.push(parseInt(ayatNumbers));
                        }
                        console.log('?? [TRANSLATION-UPDATE] Ayats to update:', ayatList);
                        // Clean the translation text by removing verse numbers in square brackets
                        var cleanedTranslation = cleanTranslationText(translationText);
                        console.log('?? [TRANSLATION-UPDATE] Original translation:', translationText);
                        console.log('? [TRANSLATION-UPDATE] Cleaned translation:', cleanedTranslation);
                        // Process each ayat individually
                        var updatePromises = ayatList.map(function(ayatNumber) {
                            return updateSingleAyatTranslation(surahNumber, ayatNumber, cleanedTranslation);
                        });
                        // Wait for all updates to complete using Angular's $q.all
                        common.$q.all(updatePromises)
                            .then(function(results) {
                                console.log('? [TRANSLATION-UPDATE] All ayat translations updated successfully');
                                console.log('?? [TRANSLATION-UPDATE] Results:', results);
                                // Show single success toast notification
                                var affectedAyats = results.length;
                                if (affectedAyats === 1) {
                                    toastr.success('Translation saved to database', 'Update Complete');
                                } else {
                                    toastr.success(affectedAyats + ' translations saved to database', 'Update Complete');
                                }
                            })
                            .catch(function(error) {
                                console.error('? [TRANSLATION-UPDATE] Error updating translations:', error);
                                // Show single error toast notification
                                toastr.error('Failed to save translation to database', 'Database Error');
                            });
                    }
                    // Helper function to update a single ayat translation using datacontext service
                    function updateSingleAyatTranslation(surahNumber, ayatNumber, translationText) {
                        console.log('?? [TRANSLATION-UPDATE] Updating single ayat:', surahNumber + ':' + ayatNumber);
                        console.log('?? [TRANSLATION-UPDATE] Using datacontext service with parameters:', {
                            SurahNumber: surahNumber,
                            AyatNumber: ayatNumber,
                            TranslationText: translationText.substring(0, 50) + '...'
                        });
                        // Use the datacontext service (properly handles authentication via interceptors)
                        return datacontext.updateAyatTranslation(surahNumber, ayatNumber, translationText)
                            .then(function(response) {
                                console.log('? [TRANSLATION-UPDATE] Single ayat update successful:', response.data);
                                return {
                                    surah: surahNumber,
                                    ayat: ayatNumber,
                                    success: true,
                                    response: response.data
                                };
                            })
                            .catch(function(error) {
                                console.error('? [TRANSLATION-UPDATE] Single ayat update failed:', {
                                    status: error.status,
                                    statusText: error.statusText,
                                    data: error.data
                                });
                                throw new Error('Failed to update Surah ' + surahNumber + ', Ayat ' + ayatNumber + ': ' + (error.statusText || 'Unknown error'));
                            });
                    }
                    // Helper function to clean translation text by removing verse numbers in square brackets AND parentheses
                    function cleanTranslationText(translationText) {
                        if (!translationText || typeof translationText !== 'string') {
                            console.warn('?? [TRANSLATION-CLEAN] Invalid translation text provided');
                            return translationText;
                        }
                        console.log('?? [TRANSLATION-CLEAN] Starting text cleaning process');
                        console.log('?? [TRANSLATION-CLEAN] Original text length:', translationText.length);
                        
                        var cleanedText = translationText;
                        
                        // CRITICAL: Remove verse numbers in PARENTHESES like (34), (35), (36), (37)
                        // These are added by front-end display logic and should NOT be stored in database
                        console.log('?? [TRANSLATION-CLEAN] Removing parenthetical verse numbers like (34), (35)...');
                        cleanedText = cleanedText.replace(/\s*\(\d{1,3}\)\s*/g, ' ');
                        
                        // Also remove verse numbers with square brackets - matches patterns like [34], [123], etc.
                        console.log('?? [TRANSLATION-CLEAN] Removing square bracket verse numbers like [34]...');
                        cleanedText = cleanedText.replace(/\s*\[\d+\]\s*\]?\s*\.?\s*$/g, '');
                        cleanedText = cleanedText.replace(/\s*\[\d+\]\s*\]?\s*/g, ' ');
                        
                        // Clean up multiple spaces created by removals
                        cleanedText = cleanedText.replace(/\s+/g, ' ');
                        
                        // Fix punctuation spacing
                        cleanedText = cleanedText.replace(/\s+([.,!?;:])/g, '$1');
                        cleanedText = cleanedText.replace(/([.,!?;:])\s*([.,!?;:])/g, '$1 $2');
                        
                        // Final trim
                        cleanedText = cleanedText.trim();
                        
                        // Ensure proper ending punctuation if the original had it
                        if (translationText.match(/[.!?]\s*\]?\s*$/) && !cleanedText.match(/[.!?]\s*$/)) {
                            if (translationText.match(/\.\s*\]?\s*$/)) {
                                cleanedText += '.';
                            } else if (translationText.match(/!\s*\]?\s*$/)) {
                                cleanedText += '!';
                            } else if (translationText.match(/\?\s*\]?\s*$/)) {
                                cleanedText += '?';
                            }
                        }
                        
                        console.log('? [TRANSLATION-CLEAN] Cleaned text length:', cleanedText.length);
                        console.log('?? [TRANSLATION-CLEAN] Text cleaning comparison:');
                        console.log('   Original:', translationText);
                        console.log('   Cleaned: ', cleanedText);
                        
                        return cleanedText;
                    }
                    // Handle row-remover clicks - ENHANCED with translation correction and highlight preservation
                    // Support both .fa-ban and .text-danger classes for flexibility
                    if (($target.hasClass('fa-ban') || $target.hasClass('text-danger')) && 
                        ($target.closest('.row-remover').length || $target.hasClass('fa-2x'))) {
                        clickEvent.preventDefault();
                        clickEvent.stopPropagation();
                        console.log('?? [RED-BAN-CONVERSION] Red ban icon clicked - starting enhanced conversion...');
                        console.log('?? [RED-BAN-CONVERSION] Target classes:', $target.attr('class'));
                        
                        // Enhanced container detection - look for meaningful Quran content containers
                        var $rowContainer = null;
                        
                        // Method 1: Look for ayah-card containers first
                        $rowContainer = $target.closest('.ayah-card');
                        if ($rowContainer.length > 0) {
                            console.log('?? [RED-BAN-CONVERSION] Found ayah-card container');
                        } else {
                            // Method 2: Look for row containers with Quran content
                            $rowContainer = $target.closest('.row').filter(function() {
                                var $row = $(this);
                                return $row.find('.quran-arabic, .quran-english, .golden-surah-header, .surah-ayat-token').length > 0 ||
                                       /[\u0600-\u06FF]/.test($row.text()) || // Contains Arabic
                                       /Q\|[\d\:\-]+/.test($row.text()); // Contains Q| token
                            });
                            if ($rowContainer.length > 0) {
                                console.log('?? [RED-BAN-CONVERSION] Found row container with Quran content');
                            }
                        }
                        
                        // Method 3: Look for any div with Quran indicators
                        if ($rowContainer.length === 0) {
                            $rowContainer = $target.closest('div').filter(function() {
                                var $div = $(this);
                                return $div.find('.quran-arabic, .quran-english, .golden-surah-header, .surah-ayat-token').length > 0 ||
                                       /[\u0600-\u06FF]/.test($div.text()) ||
                                       /Q\|[\d\:\-]+/.test($div.text()) ||
                                       $div.hasClass('quran-block') || $div.hasClass('legacy-quran');
                            });
                            if ($rowContainer.length > 0) {
                                console.log('?? [RED-BAN-CONVERSION] Found div container with Quran indicators');
                            }
                        }
                        
                        // Method 4: Expand search to siblings and nearby elements
                        if ($rowContainer.length === 0) {
                            var $parentRow = $target.closest('.row');
                            if ($parentRow.length > 0) {
                                // Check if parent row has any Quran content
                                if ($parentRow.find('.quran-arabic, .quran-english, .golden-surah-header').length > 0 ||
                                    /[\u0600-\u06FF]/.test($parentRow.text())) {
                                    $rowContainer = $parentRow;
                                    console.log('?? [RED-BAN-CONVERSION] Using parent row with potential Quran content');
                                } else {
                                    // Look in adjacent rows
                                    var $adjacentRows = $parentRow.prev('.row').add($parentRow.next('.row'));
                                    $adjacentRows.each(function() {
                                        var $adjRow = $(this);
                                        if ($adjRow.find('.quran-arabic, .quran-english, .golden-surah-header').length > 0 ||
                                            /[\u0600-\u06FF]/.test($adjRow.text())) {
                                            $rowContainer = $adjRow;
                                            console.log('?? [RED-BAN-CONVERSION] Found Quran content in adjacent row');
                                            return false; // Break out of each loop
                                        }
                                    });
                                }
                            }
                        }
                        
                        // Method 5: Last resort - get the closest meaningful container
                        if ($rowContainer.length === 0) {
                            console.warn('?? [RED-BAN-CONVERSION] No Quran container found, trying generic containers...');
                            $rowContainer = $target.closest('.row, div[class*="quran"], div[class*="ayah"], .col-md-10, .col-md-11, .col-md-12');
                        }
                        
                        if ($rowContainer.length === 0) {
                            console.warn('?? [RED-BAN-CONVERSION] No suitable container found');
                            return;
                        }
                        console.log('?? [RED-BAN-CONVERSION] Found container with content:', $rowContainer.html().substring(0, 100) + '...');
                        var originalToken = extractTokenFromBlock($rowContainer);
                        if (originalToken) {
                            console.log('?? [RED-BAN-CONVERSION] Converting legacy block to ayah-card format with token:', originalToken);
                            // ENHANCED: Extract existing highlights before conversion
                            var preservedHighlights = extractHighlightsFromBlock($rowContainer);
                            console.log('? [RED-BAN-CONVERSION] Extracted ' + preservedHighlights.length + ' highlights to preserve');
                            // Use quranService to get new HTML and replace the old block
                            quranService.getHtmlQuran(originalToken.replace('Q|', '')).then(function (newHtml) {
                                if (newHtml) {
                                    console.log('?? [RED-BAN-CONVERSION] Received new HTML from service, length:', newHtml.length);
                                    // ENHANCED: Apply translation correction to the new HTML
                                    console.log('?? [RED-BAN-CONVERSION] Applying translation correction to converted content...');
                                    var correctedHtml = processQuranHtmlForTranslationCorrection(newHtml);
                                    console.log('? [RED-BAN-CONVERSION] Translation correction applied, length:', correctedHtml.length);
                                    // ENHANCED: Restore preserved highlights to the corrected HTML
                                    if (preservedHighlights.length > 0) {
                                        console.log('? [RED-BAN-CONVERSION] Restoring ' + preservedHighlights.length + ' preserved highlights...');
                                        var finalHtml = applyPreservedHighlights(correctedHtml, preservedHighlights);
                                        console.log('?? [RED-BAN-CONVERSION] Highlights restored, final length:', finalHtml.length);
                                        $rowContainer.replaceWith(finalHtml);
                                    } else {
                                        console.log('?? [RED-BAN-CONVERSION] No highlights to restore');
                                        $rowContainer.replaceWith(correctedHtml);
                                    }
                                    editor.undo.saveStep();
                                    console.log('? [RED-BAN-CONVERSION] Successfully converted legacy block to enhanced ayah-card with preserved highlights');
                                } else {
                                    console.warn('?? [RED-BAN-CONVERSION] No HTML received from service, removing block');
                                    $rowContainer.remove();
                                    editor.undo.saveStep();
                                }
                            }).catch(function (error) {
                                console.error('? [RED-BAN-CONVERSION] Error fetching replacement content:', error);
                                $rowContainer.remove();
                                editor.undo.saveStep();
                            });
                        } else {
                            console.warn('?? [RED-BAN-CONVERSION] Could not extract token from block, removing');
                            $rowContainer.remove();
                            editor.undo.saveStep();
                        }
                    }
                };
                if (events) {
                    // Assign the init event if it exists
                    if (events.init) {
                        froalaOpts.events["froalaEditor.initialized"] = events.init;
                    }
                    if (events.images) {
                        if (events.images.upload) {
                            froalaOpts.events["froalaEditor.image.uploaded"] = events.images.upload;
                        }
                        if (events.images.beforeUpload) {
                            froalaOpts.events["froalaEditor.image.beforeUpload"] = events.images.beforeUpload;
                        }
                        if (events.images.removed) {
                            froalaOpts.events["froalaEditor.image.removed"] = events.images.removed;
                        }
                        if (events.images.inserted) {
                            froalaOpts.events["froalaEditor.image.inserted"] = events.images.inserted;
                        }
                        if (events.images.error) {
                            froalaOpts.events["froalaEditor.image.error"] = events.images.error;
                        }
                        if (events.images.imageManagerDelete) {
                            froalaOpts.events["froalaEditor.imageManager.imageDeleted"] = events.images.imageManagerDelete;
                        }
                    }
                    // === YouTube Video Event Handling ===
                    if (events.videos) {
                        if (events.videos.inserted) {
                            froalaOpts.events["froalaEditor.video.inserted"] = events.videos.inserted;
                        }
                        if (events.videos.removed) {
                            froalaOpts.events["froalaEditor.video.removed"] = events.videos.removed;
                        }
                        if (events.videos.beforeUpload) {
                            froalaOpts.events["froalaEditor.video.beforeUpload"] = events.videos.beforeUpload;
                        }
                        if (events.videos.uploaded) {
                            froalaOpts.events["froalaEditor.video.uploaded"] = events.videos.uploaded;
                        }
                        if (events.videos.error) {
                            froalaOpts.events["froalaEditor.video.error"] = events.videos.error;
                        }
                    }
                }
                if (autoSaveOptions) {
                    froalaOpts.autosave = autoSaveOptions.autosave;
                    froalaOpts.saveInterval = autoSaveOptions.saveInterval;
                    froalaOpts.saveURL = autoSaveOptions.autosaveURL;
                    froalaOpts.events["froalaEditor.save.before"] = autoSaveOptions.events.beforeSave;
                    froalaOpts.events["froalaEditor.save.after"] = autoSaveOptions.events.afterSave;
                }
                return froalaOpts;
            },
            /**
             * Configures image manager for a specific session
             * @param {Object} editor - The Froala editor instance
             * @param {number} sessionId - The session ID to configure image management for
             */
            configureImageManagerForSession: function(editor, sessionId) {
                if (editor && editor.opts && sessionId) {
                    editor.opts.imageManagerLoadURL = "api/file/session/" + sessionId + "/images";
                    editor.opts.imageManagerDeleteURL = "api/file/summary/" + sessionId + "/deleteImage";
                    console.log("DEBUG: Configured image manager for session " + sessionId);
                } else {
                    console.warn("WARNING: Could not configure image manager - missing editor or sessionId", {
                        hasEditor: !!editor,
                        hasOpts: !!(editor && editor.opts),
                        sessionId: sessionId
                    });
                }
            },
            /**
             * DEVELOPMENT: System testing and debugging utilities
             * Available in browser console as: froalaConfigService.debugQuranSystem()
             */
            debugQuranSystem: function() {
                console.group('?? QURAN PROCESSING SYSTEM DEBUG');
                // System health check
                var health = getQuranProcessingSystemHealth();
                console.log('?? System Health:', health);
                // Test Arabic text detection
                console.group('?? Arabic Text Detection Tests');
                var arabicTests = [
                    '??? ???? ?????? ??????',
                    'In the Name of Allah',
                    '????????? ??????? ?????????',
                    'And say: We believe in Allah',
                    'mixed text with ???? and English'
                ];
                arabicTests.forEach(function(test, index) {
                    console.log('Test ' + (index + 1) + ':', test, '? Arabic:', isArabicText(test));
                });
                console.groupEnd();
                // Test translation correction
                console.group('?? Translation Correction Tests');
                var translationTests = [
                    'in the name of allah,the most gracious',
                    'and allah is most merciful',
                    'the messenger  of  allah said',
                    'subhan allah  !  most beautiful',
                    'prophet muhammad (peace be upon him)'
                ];
                translationTests.forEach(function(test, index) {
                    var corrected = correctTranslationTextOnly(test);
                    console.log('Test ' + (index + 1) + ':', test, '?', corrected);
                });
                console.groupEnd();
                // Test quality analysis
                console.group('?? Quality Analysis Test');
                var testHtml = '<div class="quran-ayats">??? ???? ?????? ??????</div>' +
                              '<div class="quran-ayat-translation">In the Name of Allah, the Most Gracious, the Most Merciful.</div>';
                var analysis = analyzeContentQuality(testHtml);
                console.log('Test HTML Analysis:', analysis);
                console.groupEnd();
                console.log('? Debug session completed. All functions tested successfully.');
                console.groupEnd();
                return {
                    health: health,
                    message: 'Debug session completed successfully. Check console for detailed results.'
                };
            },
            /**
             * Etymology insertion helper - enables external insertion of etymology content
             * Called by the etymology management panel to insert content at cursor
             */
            insertEtymologyAtCursor: function(htmlContent) {
                console.log('?? [FROALA-CONFIG] insertEtymologyAtCursor called with content length:', htmlContent ? htmlContent.length : 0);
                if (!htmlContent) {
                    console.warn('?? [FROALA-CONFIG] No content provided for insertion');
                    return false;
                }
                try {
                    var editor = null;
                    // Method 1: Use global active editor reference
                    if (window.activeFroalaEditorForEtymology) {
                        editor = window.activeFroalaEditorForEtymology;
                        console.log('?? [FROALA-CONFIG] Using global active editor reference');
                    }
                    // Method 2: Find most recent Froala instance
                    if (!editor && typeof $.FE !== 'undefined' && $.FE.INSTANCES && $.FE.INSTANCES.length > 0) {
                        editor = $.FE.INSTANCES[$.FE.INSTANCES.length - 1];
                        console.log('?? [FROALA-CONFIG] Using most recent Froala instance');
                    }
                    // Method 3: Find any Froala editor on the page
                    if (!editor && typeof $ !== 'undefined') {
                        $('.froala-editor').each(function() {
                            var froalaEditor = $(this).data('froala.editor');
                            if (froalaEditor) {
                                editor = froalaEditor;
                                console.log('?? [FROALA-CONFIG] Found Froala editor via jQuery');
                                return false; // Break loop
                            }
                        });
                    }
                    if (editor) {
                        console.log('? [FROALA-CONFIG] Found active editor, inserting etymology content');
                        // Insert the content at cursor position
                        editor.html.insert(htmlContent);
                        // Focus the editor to show the insertion
                        editor.events.focus();
                        console.log('? [FROALA-CONFIG] Etymology content inserted successfully');
                        return true;
                    } else {
                        console.warn('?? [FROALA-CONFIG] No active Froala editor found');
                        // Fallback: Copy to clipboard
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            return navigator.clipboard.writeText(htmlContent)
                                .then(function() {
                                    console.log('?? [FROALA-CONFIG] Etymology content copied to clipboard as fallback');
                                    return 'clipboard';
                                })
                                .catch(function(error) {
                                    console.error('? [FROALA-CONFIG] Failed to copy to clipboard:', error);
                                    return false;
                                });
                        }
                        return false;
                    }
                } catch (error) {
                    console.error('? [FROALA-CONFIG] Error inserting etymology content:', error);
                    return false;
                }
            },
            // Expose utility functions for modular plugins
            showToastNotification: showToastNotification,
            attachRestoreButtonHandlers: attachRestoreButtonHandlers,
            
            /**
             * KSESSION UTILITIES: Helper functions for working with ksession metadata
             */
            
            /**
             * Extract ksession metadata from an ayah-card element
             * @param {Element|jQuery} element - The ayah-card element
             * @returns {Object|null} - Parsed ksession metadata or null if not found
             */
            getKSessionData: function(element) {
                try {
                    var $element = $(element);
                    var ksessionAttr = $element.attr('ksession');
                    if (!ksessionAttr) {
                        console.warn('🔍 [KSESSION] No ksession attribute found on element');
                        return null;
                    }
                    
                    // Decode HTML entities and parse JSON
                    var decodedJson = ksessionAttr.replace(/&quot;/g, '"');
                    var metadata = JSON.parse(decodedJson);
                    
                    console.log('🔍 [KSESSION] Successfully extracted metadata:', metadata);
                    return metadata;
                } catch (error) {
                    console.error('❌ [KSESSION] Failed to parse ksession metadata:', error);
                    return null;
                }
            },
            
            /**
             * Find ayah-card elements by various criteria using ksession metadata
             * @param {Object} criteria - Search criteria object
             * @param {number} criteria.surah - Surah number to search for
             * @param {number} criteria.ayat - Ayat number to search for (optional)
             * @param {string} criteria.token - Token format like "Q|2:255" (optional)
             * @param {string} criteria.reference - Reference format like "2:255" (optional)
             * @returns {jQuery} - jQuery collection of matching ayah-card elements
             */
            findAyahCards: function(criteria) {
                try {
                    var selector = '.ayah-card[ksession]';
                    var $allCards = $(selector);
                    var matches = [];
                    
                    $allCards.each(function() {
                        var metadata = service.getKSessionData(this);
                        if (!metadata) return;
                        
                        var isMatch = true;
                        
                        if (criteria.surah && metadata.surah !== criteria.surah) {
                            isMatch = false;
                        }
                        
                        if (criteria.ayat && metadata.ayat !== criteria.ayat) {
                            isMatch = false;
                        }
                        
                        if (criteria.token && metadata.token !== criteria.token) {
                            isMatch = false;
                        }
                        
                        if (criteria.reference && metadata.reference !== criteria.reference) {
                            isMatch = false;
                        }
                        
                        if (isMatch) {
                            matches.push(this);
                        }
                    });
                    
                    console.log('🔍 [KSESSION] Found ' + matches.length + ' matching ayah cards for criteria:', criteria);
                    return $(matches);
                } catch (error) {
                    console.error('❌ [KSESSION] Error finding ayah cards:', error);
                    return $();
                }
            },
            
            /**
             * Get a human-readable display name for an ayah from its ksession metadata
             * @param {Object} metadata - ksession metadata object
             * @returns {string} - Display name like "Al-Baqarah 2:255"
             */
            getAyahDisplayName: function(metadata) {
                if (!metadata) return 'Unknown Verse';
                
                var parts = [];
                if (metadata.surahName) {
                    parts.push(metadata.surahName);
                }
                if (metadata.reference) {
                    parts.push(metadata.reference);
                }
                
                return parts.length > 0 ? parts.join(' ') : ('Quran ' + (metadata.reference || metadata.token || 'Unknown'));
            },
            
            /**
             * Validate ksession metadata completeness
             * @param {Object} metadata - ksession metadata object to validate
             * @returns {Object} - Validation result with isValid boolean and missing fields array
             */
            validateKSessionData: function(metadata) {
                var requiredFields = ['surah', 'ayat', 'token', 'reference', 'position'];
                var missing = [];
                var isValid = true;
                
                if (!metadata) {
                    return { isValid: false, missing: requiredFields, error: 'No metadata provided' };
                }
                
                requiredFields.forEach(function(field) {
                    if (metadata[field] === undefined || metadata[field] === null || metadata[field] === '') {
                        missing.push(field);
                        isValid = false;
                    }
                });
                
                return { isValid: isValid, missing: missing };
            }
            ,
            // Preferred helper to read canonical data-* attributes from an element
            getDataAttributes: function(element) {
                try {
                    if (!element) return null;
                    var $el = element instanceof jQuery ? element : $(element);
                    return readDataAttributes($el);
                } catch (e) {
                    console.error('?? [SERVICE] getDataAttributes error', e);
                    return null;
                }
            }
        };
        return service;
        // Expose utility functions to modular plugins
        if (!window.froalaUtilities) {
            window.froalaUtilities = {
                showToastNotification: showToastNotification,
                attachRestoreButtonHandlers: attachRestoreButtonHandlers
            };
        }
        //#region Internal Methods
        /**
         * SYSTEM INITIALIZATION: Log system startup and health check
         */
        (function initializeQuranProcessingSystem() {
            try {
                var health = getQuranProcessingSystemHealth();
                console.log('?? [SYSTEM-INIT] Quran Processing System v' + health.version + ' initialized', health);
                // Wrap critical functions with enhanced error handling
                processQuranHtmlForTranslationCorrection = withEnhancedErrorHandling(processQuranHtmlForTranslationCorrection, 'QURAN-PROCESSING');
                validateQuranContentQuality = withEnhancedErrorHandling(validateQuranContentQuality, 'VALIDATION');
                optimizedTranslationCorrection = withEnhancedErrorHandling(optimizedTranslationCorrection, 'TRANSLATION-CORRECTION');
                console.log('? [SYSTEM-INIT] All processing functions enhanced with error handling');
            } catch (error) {
                console.error('? [SYSTEM-INIT] Failed to initialize Quran processing system:', error);
            }
        })();
        //#region Internal Methods
        function registerButtons() {
            registerTradArabicButton();
            registerAmiriButton();
            registerPreviligedDataButton();
            registertokenizeButton();
            registerHighlighter();
            registerEsotericButton();
            registerEtymologyButton();
            registerEtymologyManagementButton();
            // Check if modular poetry system is available
            if (window.froalaPluginsLoader && window.froalaPluginsLoader.registerPoetryButton) {
                console.log('?? [FROALA-CONFIG] Using modular poetry button system...');
                window.froalaPluginsLoader.registerPoetryButton();
                console.log('?? [FROALA-CONFIG] Modular poetry button registration completed');
            } else {
                console.log('?? [FROALA-CONFIG] Modular system not available, using legacy poetry button...');
                registerPoetryButton();
                console.log('?? [FROALA-CONFIG] Legacy poetry button registration completed');
            }
            // Check if modular ahadees system is available
            if (window.froalaPluginsLoader && window.froalaPluginsLoader.registerAhadeesButton) {
                console.log('?? [FROALA-CONFIG] Using modular ahadees button system...');
                window.froalaPluginsLoader.registerAhadeesButton();
                console.log('?? [FROALA-CONFIG] Modular ahadees button registration completed');
            } else {
                console.log('?? [FROALA-CONFIG] Modular ahadees system not available, using legacy ahadees plugin...');
                // Legacy ahadees plugin is loaded via BundleConfig.cs and registers itself
                console.log('?? [FROALA-CONFIG] Legacy ahadees plugin should be available via bundle');
            }
            registerCopyToClipboardButton();
            registerPasteFromClipboardButton();
            // HTML cleaner button is now registered at script load time
            //registerNarrationArabic();
            //registerSessionGuideButton();
            // Initialize global event delegation for poetry restore buttons
            initializePoetryEventDelegation();
            // ADDITIONAL: Document-level click handler for red ban icons (backup)
            // This ensures we catch clicks even if Froala event doesn't trigger
            $(document).on('click', '.fa-ban.text-danger, .fa-ban.fa-2x, i.fa-ban', function(e) {
                console.log('?? [DOCUMENT-CLICK] Red ban icon clicked via document handler');
                var $target = $(this);
                var $container = $target.closest('div, .row, .quran-block, .legacy-quran').first();
                if ($container.length === 0) {
                    console.warn('?? [DOCUMENT-CLICK] No suitable container found for red ban icon');
                    return;
                }
                console.log('?? [DOCUMENT-CLICK] Found container:', $container.get(0).tagName, $container.attr('class'));
                // Extract highlights before conversion
                var preservedHighlights = extractHighlightsFromBlock($container);
                console.log('? [DOCUMENT-CLICK] Extracted ' + preservedHighlights.length + ' highlights');
                // Try to extract token
                var originalToken = extractTokenFromBlock($container);
                if (originalToken) {
                    console.log('?? [DOCUMENT-CLICK] Converting with token:', originalToken);
                    e.preventDefault();
                    e.stopPropagation();
                    quranService.getHtmlQuran(originalToken.replace('Q|', '')).then(function (newHtml) {
                        if (newHtml) {
                            console.log('?? [DOCUMENT-CLICK] Received new HTML, applying corrections...');
                            // Apply translation correction
                            var correctedHtml = processQuranHtmlForTranslationCorrection(newHtml);
                            // Restore highlights
                            if (preservedHighlights.length > 0) {
                                console.log('? [DOCUMENT-CLICK] Restoring highlights...');
                                correctedHtml = applyPreservedHighlights(correctedHtml, preservedHighlights);
                            }
                            $container.replaceWith(correctedHtml);
                            console.log('? [DOCUMENT-CLICK] Conversion completed successfully');
                        }
                    }).catch(function (error) {
                        console.error('? [DOCUMENT-CLICK] Error:', error);
                    });
                } else {
                    console.warn('?? [DOCUMENT-CLICK] Could not extract token from container');
                }
            });
        }
        function initializePoetryEventDelegation() {
            console.log('?? [POETRY-EVENT-BINDING] ===== INITIALIZING POETRY EVENT DELEGATION =====');
            console.log('?? [POETRY-EVENT-BINDING] Timestamp:', new Date().toISOString());
            console.log('?? [POETRY-EVENT-BINDING] DOM ready state:', document.readyState);
            console.log('?? [POETRY-EVENT-BINDING] jQuery loaded:', typeof $ !== 'undefined');
            // Clean up any existing poetry event handlers to prevent duplicates
            $(document).off('click.poetryRestoreGlobal');
            console.log('?? [POETRY-EVENT-BINDING] Cleaned up existing .poetryRestoreGlobal handlers');
            // Check for existing poetry buttons on page
            var existingButtons = $('.poetry-restore-btn').length;
            console.log('?? [POETRY-EVENT-BINDING] Found ' + existingButtons + ' existing .poetry-restore-btn elements');
            if (existingButtons > 0) {
                $('.poetry-restore-btn').each(function(index) {
                    console.log('?? [POETRY-EVENT-BINDING] Button #' + index + ':', {
                        classes: $(this).attr('class'),
                        text: $(this).text().trim(),
                        container: $(this).closest('.froala-poetry-container, .poetry-section, .poetry-wrapper').length > 0 ? 'FOUND' : 'NOT FOUND'
                    });
                });
            }
            // Set up global event delegation for poetry restore buttons with enhanced logging
            console.log('?? [POETRY-EVENT-BINDING] Setting up global event delegation...');
            // Use a timeout to ensure DOM is fully ready (same pattern as other delayed binders)
            setTimeout(function() {
                console.log('? [POETRY-EVENT-BINDING] Delayed binding executing after 100ms timeout');
                // Handle multiple button variations and class combinations
                $(document).on('click.poetryRestoreGlobal', '.poetry-restore-btn, .btn.poetry-restore-btn, button.poetry-restore-btn', function(e) {
                    e.preventDefault();
                    console.log('? [POETRY-CLICK] ===== POETRY RESTORE BUTTON CLICKED =====');
                    console.log('?? [POETRY-CLICK] Event target:', e.target);
                    console.log('?? [POETRY-CLICK] Current target:', e.currentTarget);
                    console.log('? [POETRY-CLICK] Button element classes:', $(this).attr('class'));
                    console.log('? [POETRY-CLICK] Button text content:', $(this).text().trim());
                    console.log('?? [POETRY-CLICK] Event namespace:', e.namespace);
                    var $button = $(this);
                    // Enhanced container detection with logging
                    var $poetryContainer = $button.closest('.froala-poetry-container');
                    console.log('?? [POETRY-CLICK] .froala-poetry-container search result:', $poetryContainer.length);
                    if ($poetryContainer.length === 0) {
                        // Try alternative container classes
                        $poetryContainer = $button.closest('.poetry-section');
                        console.log('? [POETRY-CLICK] .poetry-section search result:', $poetryContainer.length);
                    }
                    if ($poetryContainer.length === 0) {
                        // Try poetry-wrapper class
                        $poetryContainer = $button.closest('.poetry-wrapper');
                        console.log('?? [POETRY-CLICK] .poetry-wrapper search result:', $poetryContainer.length);
                    }
                    if ($poetryContainer.length === 0) {
                        console.error('? [POETRY-CLICK] No container found! Debugging parent hierarchy:');
                        $button.parents().each(function(index) {
                            console.log('  Parent #' + index + ':', this.tagName + '.' + (this.className || 'no-class'));
                        });
                        return;
                    }
                    console.log('? [POETRY-CLICK] Found container:', {
                        tagName: $poetryContainer.get(0).tagName,
                        classes: $poetryContainer.attr('class'),
                        hasDataOriginalText: $poetryContainer.data('original-text') ? 'YES' : 'NO'
                    });
                    // Call the existing restore handler logic
                    handlePoetryRestore($poetryContainer, $button);
                });
                console.log('? [POETRY-EVENT-BINDING] Global event delegation setup completed');
                // Test the binding by checking if handlers are attached
                var handlers = $._data(document, 'events');
                if (handlers && handlers.click) {
                    var poetryHandlers = handlers.click.filter(function(h) { 
                        return h.namespace === 'poetryRestoreGlobal'; 
                    });
                    console.log('?? [POETRY-EVENT-BINDING] Attached handlers count:', poetryHandlers.length);
                }
            }, 100);
        }
        function handlePoetryRestore($poetryContainer, $button) {
            console.log('?? [POETRY-RESTORE] ===== HANDLING POETRY RESTORATION =====');
            console.log('?? [POETRY-RESTORE] Container element:', $poetryContainer.get(0));
            console.log('?? [POETRY-RESTORE] Button element:', $button.get(0));
            try {
                // Get the original text from the data-original-text attribute
                var originalText = $poetryContainer.data('original-text') || 
                                  $poetryContainer.find('[data-original-text]').data('original-text');
                console.log('?? [POETRY-RESTORE] Original text lookup:', {
                    directData: $poetryContainer.data('original-text') ? 'FOUND' : 'NOT FOUND',
                    childElementData: $poetryContainer.find('[data-original-text]').length,
                    originalTextLength: originalText ? originalText.length : 0,
                    originalTextPreview: originalText ? originalText.substring(0, 100) + '...' : 'NULL'
                });
                if (!originalText) {
                    console.error('? [POETRY-RESTORE] No original text found for restoration');
                    console.log('?? [POETRY-RESTORE] Container attributes:', $poetryContainer.get(0).attributes);
                    console.log('?? [POETRY-RESTORE] Container data attributes:', $poetryContainer.data());
                    showToastNotification('Unable to restore: No original content found', 'warning');
                    return;
                }
                console.log('?? [POETRY-RESTORE] Proceeding with restoration...');
                // Show loading state
                $button.prop('disabled', true).text('Restoring...');
                console.log('?? [POETRY-RESTORE] Button set to loading state');
                // Replace the container with original plain text
                // Wrap in a simple paragraph to maintain proper HTML structure
                var restoredHtml = '<p>' + originalText.replace(/\n/g, '<br>') + '</p>';
                console.log('?? [POETRY-RESTORE] Generated restored HTML:', restoredHtml.substring(0, 200) + '...');
                $poetryContainer.replaceWith(restoredHtml);
                console.log('? [POETRY-RESTORE] Poetry restoration completed successfully');
                showToastNotification('Poetry formatting removed and original text restored', 'success');
            } catch (error) {
                console.error('? [POETRY-RESTORE] Exception during restoration:', error);
                console.error('? [POETRY-RESTORE] Error stack:', error.stack);
                showToastNotification('Error processing restore request', 'error');
                // Reset button state if error occurs
                if ($button && $button.length) {
                    $button.prop('disabled', false).text('Plain Text');
                    console.log('?? [POETRY-RESTORE] Button state reset after error');
                }
            }
        }
        function registerTradArabicButton() {
            $.FE.DefineIcon("tradFontButton", { NAME: "bolt" });
            $.FE.RegisterCommand("tradFontButton",
                {
                    title: "Applies the Traditional Arabic font in a span",
                    focus: false,
                    undo: true,
                    refreshAfterCallback: false,
                    callback: function () {
                        var resultHtml = this.selection.text();
                        if (resultHtml) {
                            resultHtml = "<span class='inlineArabic'>" + resultHtml + "</span>";
                        }
                        this.html.insert(resultHtml);
                    }
                });
        }
        function registerPreviligedDataButton() {
            $.FE.DefineIcon("previligedDataButton", { NAME: "lock" });
            $.FE.RegisterCommand("previligedDataButton",
                {
                    title: "Applies the previliged font in a span",
                    focus: false,
                    undo: true,
                    refreshAfterCallback: false,
                    callback: function () {
                        var resultHtml = this.html.getSelected();
                        if (!resultHtml) { return; }
                        resultHtml =
                            "<div class=\"previligedBlock\">" +
                            "<div class=\"center-div\">" +
                            "<i class=\"fa fa-lock fa-2x text-danger\" aria-hidden=\"true\"></i>" +
                            "<div class=\"previligedData\">" +
                            resultHtml +
                            "</div>" +
                            "</div>" +
                            "</div>";
                        this.html.insert(resultHtml);
                    }
                });
        }
        function registerEsotericButton() {
            $.FE.DefineIcon("esotericButton", { NAME: "eye" });
            $.FE.RegisterCommand("esotericButton", {
                title: "Applies the esoteric formatting in a div",
                focus: false,
                undo: true,
                refreshAfterCallback: false,
                callback: function () {
                    var resultHtml = this.html.getSelected();
                    if (!resultHtml) return;
                    resultHtml =
                        "<div class=\"esotericBlock\">" +
                        "<div class=\"esoteric-header\">" +
                        "<i class=\"fa fa-eye\" aria-hidden=\"true\"></i>" +
                        "<span class=\"esoteric-title\">ESOTERICS</span>" +
                        "</div>" +
                        "<div class=\"esotericData\">" +
                        resultHtml +
                        "</div>" +
                        "</div>";
                    this.html.insert(resultHtml);
                }
            });
        }
        function registerEtymologyButton() {
            $.FE.DefineIcon("etymologyButton", { NAME: "tree" }); // Define icon once in its own function
            $.FE.RegisterCommand("etymologyButton", {
                title: "Applies Etymology Formatting",
                focus: false,
                undo: true,
                refreshAfterCallback: false,
                callback: function () {
                    var selectedHtml = this.html.getSelected();
                    // If no text is selected, provide a default empty structure,
                    // otherwise wrap the selected content in the etymology-details div.
                    var detailsHtml = selectedHtml ? selectedHtml : "<p>Insert etymology details here...</p>";
                    
                    // Generate canonical data-* attributes for etymology blocks (Phase 4)
                    var etymologyId = generateUUID(); // Generate unique ID for this etymology block
                    var contentType = 'etymology-basic';
                    
                    // DEBUG: Log data-* attributes being added to Basic Etymology HTML
                    console.log('🔍 [ETYMOLOGY-BASIC] Adding data-* attributes to Basic Etymology HTML:', {
                        etymologyId: etymologyId,
                        dataType: contentType,
                        dataContentType: contentType,
                        selectedHtml: selectedHtml,
                        phase: 'Phase 4 (Etymology)',
                        function: 'registerEtymologyButton',
                        timestamp: new Date().toISOString()
                    });
                    
                    var resultHtml =
                        '<div class="etymology-container" style="width: 80%; margin: 40px auto; padding: 0 15px; box-sizing: border-box;" data-type="' + contentType + '" data-id="' + etymologyId + '" data-content-type="' + contentType + '">' +
                        '    <div class="etymology-card">' +
                        '        <div class="etymology-header">' +
                        '            <h3 class="arabic-term">Title Here... ??????</h3>' + // Default Arabic term placeholder
                        '        </div>' +
                        '        <div class="etymology-details">' +
                        '            ' + detailsHtml + // Insert selected HTML or default content
                        '        </div>' +
                        '    </div>' +
                        '</div>';
                    this.html.insert(resultHtml);
                }
            });
        }
        function registerEtymologyManagementButton() {
            console.log('?? [FROALA-CONFIG] Registering Etymology Management Button');
            $.FE.DefineIcon("etymologyManagementButton", { NAME: "leaf", template: "font_awesome" });
            $.FE.RegisterCommand("etymologyManagementButton", {
                title: "Etymology Management Panel (Shift+Ctrl+E)",
                focus: false,
                undo: false,
                refreshAfterCallback: false,
                callback: function () {
                    console.log('?? [FROALA-CONFIG] ===== ETYMOLOGY BUTTON CLICKED =====');
                    console.log('?? [FROALA-CONFIG] Editor instance:', this);
                    console.log('?? [FROALA-CONFIG] Editor ID:', this.id);
                    var editor = this;
                    try {
                        // Insert custom HTML marker at cursor position (same pattern as ahadees)
                        var customMarker = '<!--ETYMOLOGY_INSERT_MARKER-->';
                        console.log('?? [FROALA-CONFIG] About to insert marker:', customMarker);
                        editor.html.insert(customMarker);
                        console.log('?? [FROALA-CONFIG] ? Custom marker inserted successfully');
                        // Verify marker was inserted
                        var currentHtml = editor.html.get();
                        var markerExists = currentHtml.indexOf(customMarker) !== -1;
                        console.log('?? [FROALA-CONFIG] Marker verification - exists in editor:', markerExists);
                        console.log('?? [FROALA-CONFIG] Current HTML length:', currentHtml.length);
                        // Enhanced scope detection - try multiple methods
                        var scope = null;
                        var scopeDetectionMethods = [
                            // Method 1: Try root scope from body
                            function() {
                                console.log('?? [FROALA-CONFIG] Attempting scope detection method 1: body scope');
                                var bodyScope = angular.element(document.body).scope();
                                console.log('?? [FROALA-CONFIG] Body scope found:', !!bodyScope);
                                return bodyScope && bodyScope.$root ? bodyScope.$root : null;
                            },
                            // Method 2: Try finding scope from any Angular app element
                            function() {
                                console.log('?? [FROALA-CONFIG] Attempting scope detection method 2: app element');
                                var appElement = document.querySelector('[ng-app], [data-ng-app]');
                                if (appElement) {
                                    var appScope = angular.element(appElement).scope();
                                    console.log('?? [FROALA-CONFIG] App element scope found:', !!appScope);
                                    return appScope && appScope.$root ? appScope.$root : null;
                                }
                                return null;
                            },
                            // Method 3: Try finding scope from etymology controller
                            function() {
                                var etymologyElements = document.querySelectorAll('[ng-controller*="etymology"], [data-ng-controller*="etymology"], [ng-controller*="Etymology"], [data-ng-controller*="Etymology"]');
                                for (var i = 0; i < etymologyElements.length; i++) {
                                    var elemScope = angular.element(etymologyElements[i]).scope();
                                    if (elemScope) {
                                        return elemScope;
                                    }
                                }
                                return null;
                            },
                            // Method 4: Try finding scope from any controller
                            function() {
                                var controllerElements = document.querySelectorAll('[ng-controller], [data-ng-controller]');
                                for (var i = 0; i < controllerElements.length; i++) {
                                    var elemScope = angular.element(controllerElements[i]).scope();
                                    if (elemScope && elemScope.$root) {
                                        return elemScope.$root;
                                    }
                                }
                                return null;
                            }
                        ];
                        // Try each scope detection method
                        console.log('?? [FROALA-CONFIG] Starting scope detection with', scopeDetectionMethods.length, 'methods');
                        for (var methodIndex = 0; methodIndex < scopeDetectionMethods.length; methodIndex++) {
                            try {
                                console.log('?? [FROALA-CONFIG] Trying scope detection method', methodIndex + 1);
                                scope = scopeDetectionMethods[methodIndex]();
                                if (scope) {
                                    console.log('?? [FROALA-CONFIG] ? Found scope using method', methodIndex + 1);
                                    console.log('?? [FROALA-CONFIG] Scope type:', typeof scope);
                                    console.log('?? [FROALA-CONFIG] Scope has $broadcast:', typeof scope.$broadcast);
                                    break;
                                } else {
                                    console.log('?? [FROALA-CONFIG] ? Method', methodIndex + 1, 'returned null');
                                }
                            } catch (methodError) {
                                console.error('?? [FROALA-CONFIG] ?? Scope detection method', methodIndex + 1, 'failed:', methodError);
                            }
                        }
                        if (scope) {
                            console.log('?? [FROALA-CONFIG] ===== BROADCASTING EVENT =====');
                            console.log('?? [FROALA-CONFIG] Broadcasting etymologyManagement.show event');
                            console.log('?? [FROALA-CONFIG] Event data:', {
                                editorId: editor.id,
                                editor: !!editor,
                                marker: customMarker,
                                insertionType: 'custom-marker'
                            });
                            var eventData = {
                                editorId: editor.id,
                                editor: editor,
                                marker: customMarker,
                                insertionType: 'custom-marker'
                            };
                            scope.$broadcast('etymologyManagement.show', eventData);
                            console.log('?? [FROALA-CONFIG] ? Event broadcast completed');
                            // Safe $apply - check if digest is already in progress
                            console.log('?? [FROALA-CONFIG] Checking digest phase:', scope.$$phase);
                            if (!scope.$$phase) {
                                console.log('?? [FROALA-CONFIG] Applying scope...');
                                scope.$apply();
                                console.log('?? [FROALA-CONFIG] ? Scope applied successfully');
                            } else {
                                console.log('?? [FROALA-CONFIG] ?? Digest already in progress, skipping $apply');
                            }
                        } else {
                            console.warn('?? [FROALA-CONFIG] Could not find Angular scope, using fallback method');
                            toggleEtymologyManagementPanelFallback(editor, customMarker);
                        }
                    } catch (error) {
                        console.error('?? [FROALA-CONFIG] Error in etymology management button:', error);
                        // Fallback to simple panel
                        toggleEtymologyManagementPanelFallback(editor, null);
                    }
                }
            });
        }
        function toggleEtymologyManagementPanelFallback(editor, markerId) {
            console.log('?? [FROALA-CONFIG] Using fallback etymology panel method');
            try {
                // Enhanced fallback scope detection
                var scope = null;
                var fallbackMethods = [
                    // Try to find Angular scope on the document body
                    function() {
                        var $body = angular.element(document.body);
                        var bodyScope = $body.scope();
                        return bodyScope && bodyScope.$root ? bodyScope.$root : bodyScope;
                    },
                    // Try to find scope via any etymology controller element
                    function() {
                        var etymologySelectors = [
                            '[ng-controller*="Etymology"]',
                            '[data-ng-controller*="Etymology"]',
                            '[ng-controller*="etymology"]', 
                            '[data-ng-controller*="etymology"]',
                            '[ng-controller*="adminEtymology"]',
                            '[data-ng-controller*="adminEtymology"]'
                        ];
                        for (var s = 0; s < etymologySelectors.length; s++) {
                            var elements = document.querySelectorAll(etymologySelectors[s]);
                            for (var i = 0; i < elements.length; i++) {
                                var elemScope = angular.element(elements[i]).scope();
                                if (elemScope) {
                                    return elemScope;
                                }
                            }
                        }
                        return null;
                    },
                    // Try to find scope via any controller element
                    function() {
                        var controllerElements = document.querySelectorAll('[ng-controller], [data-ng-controller]');
                        for (var i = 0; i < controllerElements.length; i++) {
                            var elemScope = angular.element(controllerElements[i]).scope();
                            if (elemScope) {
                                return elemScope;
                            }
                        }
                        return null;
                    }
                ];
                // Try each fallback method
                for (var methodIndex = 0; methodIndex < fallbackMethods.length; methodIndex++) {
                    try {
                        scope = fallbackMethods[methodIndex]();
                        if (scope) {
                            console.log('?? [FROALA-CONFIG] Found scope using fallback method', methodIndex + 1);
                            break;
                        }
                    } catch (methodError) {
                        console.warn('?? [FROALA-CONFIG] Fallback method', methodIndex + 1, 'failed:', methodError);
                    }
                }
                if (scope) {
                    console.log('?? [FROALA-CONFIG] Found scope in fallback, broadcasting event');
                    // Broadcast to the found scope and its root
                    var eventData = {
                        editorId: editor ? editor.id : null,
                        editor: editor,
                        marker: markerId
                    };
                    scope.$broadcast('etymologyManagement.show', eventData);
                    // Also try broadcasting to root scope if available
                    if (scope.$root && scope.$root !== scope) {
                        scope.$root.$broadcast('etymologyManagement.show', eventData);
                    }
                    // Safe $apply
                    if (!scope.$$phase) {
                        scope.$apply();
                    }
                    return;
                }
                // If no scope found, try direct manipulation
                console.log('?? [FROALA-CONFIG] No scope found, trying direct panel manipulation');
                var panel = document.querySelector('.etymology-management-panel');
                if (panel) {
                    console.log('?? [FROALA-CONFIG] Found panel element, showing directly');
                    panel.style.display = 'block';
                    panel.style.visibility = 'visible';
                    return;
                }
                // Try to find and trigger any etymology-related elements
                var etymologyTriggers = document.querySelectorAll('[ng-click*="etymology"], [data-ng-click*="etymology"], .etymology-trigger, .etymology-button');
                if (etymologyTriggers.length > 0) {
                    console.log('?? [FROALA-CONFIG] Found etymology trigger elements, clicking first one');
                    etymologyTriggers[0].click();
                    return;
                }
                console.error('?? [FROALA-CONFIG] Could not access etymology panel through any method');
            } catch (error) {
                console.error('?? [FROALA-CONFIG] Error in fallback method:', error);
            }
        }
        function registerPoetryButton() {
            console.log('?? [POETRY-BUTTON] Starting poetry button registration...');
            try {
                // Define the icon first
                $.FE.DefineIcon("poetryButton", { NAME: "music" });
                console.log('? [POETRY-BUTTON] Icon defined successfully');
                // Register the command
                $.FE.RegisterCommand("poetryButton",
                    {
                        title: "Poetry - Transform selected text into beautifully formatted poetry",
                        focus: false,
                        undo: true,
                        refreshAfterCallback: false,
                        callback: function () {
                            var editor = this;
                            try {
                                console.log('?? [POETRY-BUTTON] Poetry button activated');
                                // Ensure we have a valid Froala editor instance
                                if (!editor || !editor.selection || !editor.html) {
                                    console.error('? [POETRY-BUTTON] Invalid Froala editor context');
                                    showToastNotification('error', 'Editor Error', 'Poetry formatting is only available within the text editor.');
                                    return;
                                }
                                // Verify we're in a Froala editor context
                                if (!$(editor.el).hasClass('fr-element') && !$(editor.el).closest('.fr-view').length) {
                                    console.error('? [POETRY-BUTTON] Not in valid Froala editor context');
                                    showToastNotification('error', 'Context Error', 'Poetry formatting only works within the text editor.');
                                    return;
                                }
                                // Get selected text
                                var selectedText = editor.selection.text();
                                if (!selectedText || selectedText.trim().length === 0) {
                                    // Show helpful message for no selection
                                    showToastNotification('warning', 'No Text Selected', 'Please select the poetry verses you want to format before clicking the Poetry button.');
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
                                    showToastNotification('warning', 'Empty Content', 'No valid poetry content found after trimming whitespace.');
                                    return;
                                }
                                // Reconstruct text from cleaned lines
                                var cleanedText = lines.join('\n');
                                console.log('?? [POETRY-BUTTON] Processing cleaned text:', cleanedText.substring(0, 100) + '...');
                                // Detect content type using cleaned text
                                var contentType = detectPoetryContentType(cleanedText);
                                console.log('?? [POETRY-BUTTON] Detected content type:', contentType);
                                if (contentType === 'invalid') {
                                    // Show error toast for non-poetry content
                                    showToastNotification('error', 'Poetry Format Error', 'Selected content does not appear to be poetry. Please select poetry verses with proper line breaks.');
                                    return;
                                }
                                // Show metadata input modal before applying formatting
                                showPoetryMetadataModal(editor, cleanedText, contentType);
                                console.log('? [POETRY-BUTTON] Poetry formatting applied successfully');
                            } catch (error) {
                                console.error('? [POETRY-BUTTON] Error processing poetry:', error);
                                showToastNotification('error', 'Poetry System Error', 'An unexpected error occurred while processing poetry. Please try again.');
                            }
                        }
                    });
                console.log('? [POETRY-BUTTON] Command registered successfully');
                console.log('?? [POETRY-BUTTON] Poetry button registration completed');
            } catch (error) {
                console.error('? [POETRY-BUTTON] Error during registration:', error);
            }
        }
        /**
         * Detect the type of poetry content from selected text
         * @param {string} text - Selected text to analyze
         * @returns {string} - 'bilingual', 'arabic-urdu', 'english', 'quran-bilingual', or 'invalid'
         */
        function detectPoetryContentType(text) {
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
                'ayah', 'ayat', 'chapter', 'al-', '????', '???', '??????', '????'
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
            console.log('?? [POETRY-DETECTION] Lines analysis - Arabic/Urdu:', arabicLines, 'English:', englishLines, 'Total:', lines.length, 'Quran indicators:', hasQuranIndicators);
            // Prioritize Quran detection if indicators are present
            if (hasQuranIndicators && arabicLines > 0 && englishLines > 0) {
                return 'quran-bilingual';
            } else if (arabicLines > 0 && englishLines > 0) {
                return 'bilingual';
            } else if (arabicLines > 0 && englishLines === 0) {
                return 'arabic-urdu';
            } else if (englishLines > 0 && arabicLines === 0) {
                return 'english';
            } else {
                return 'invalid';
            }
        }
        /**
         * Check if text contains Arabic or Urdu characters
         * @param {string} text - Text to check
         * @returns {boolean} - True if contains Arabic/Urdu
         */
        function isArabicOrUrduText(text) {
            if (!text) return false;
            // Unicode ranges for Arabic, Arabic Supplement, and Arabic Extended-A
            var arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
            return arabicRegex.test(text);
        }
        /**
         * Check if text is primarily English
         * @param {string} text - Text to check
         * @returns {boolean} - True if primarily English
         */
        function isEnglishText(text) {
            if (!text) return false;
            // Check for Latin characters and common English words
            var englishRegex = /[a-zA-Z]/;
            var trimmedText = text.trim();
            return englishRegex.test(trimmedText) && !isArabicOrUrduText(trimmedText);
        }
        /**
         * Show metadata input modal for poetry formatting
         * @param {Object} editor - Froala editor instance
         * @param {string} text - Cleaned text content
         * @param {string} contentType - Detected content type
         */
        function showPoetryMetadataModal(editor, text, contentType) {
            try {
                // Save selection state for immediate replacement (no markers)
                var selectionState = {
                    hasSelection: false,
                    selectedHtml: '',
                    range: null
                };
                var selection = editor.selection.get();
                if (selection && !selection.isCollapsed) {
                    selectionState.hasSelection = true;
                    selectionState.selectedHtml = editor.selection.text();
                    // Use proper range cloning method for Froala
                    try {
                        if (selection.getRangeAt) {
                            selectionState.range = selection.getRangeAt(0).cloneRange();
                        } else if (selection.cloneRange) {
                            selectionState.range = selection.cloneRange();
                        } else {
                            // Fallback: save selection using Froala's methods
                            selectionState.range = editor.selection.ranges(0);
                        }
                        console.log('?? [POETRY-MODAL] Saved selection state for immediate replacement');
                    } catch (e) {
                        console.warn('?? [POETRY-MODAL] Could not save selection range:', e);
                        selectionState.range = null;
                    }
                } else {
                    console.log('?? [POETRY-MODAL] No selection - will insert at cursor position');
                }
                // Create unified modal HTML with radio buttons
                var modalHtml = `
                    <div class="modal fade" id="poetry-metadata-modal" tabindex="-1" role="dialog" aria-labelledby="poetry-modal-title">
                        <div class="modal-dialog" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                    <h4 class="modal-title" id="poetry-modal-title">
                                        <i class="fa fa-music text-success"></i> Format Content
                                    </h4>
                                </div>
                                <div class="modal-body">
                                                        <div class="form-group">
                                                            <label for="poetry-metadata-input" class="control-label" id="input-label">
                                                                Title:
                                                            </label>
                                                            <input type="text" class="form-control" id="poetry-metadata-input" 
                                                                   placeholder="e.g., The Desert Song (optional)" maxlength="100" autocomplete="off">
                                                            <small class="help-block" id="input-help">Enter a title (optional)</small>
                                                        </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-default" data-dismiss="modal">
                                        <i class="fa fa-times"></i> Cancel
                                    </button>
                                    <button type="button" class="btn btn-success" id="poetry-apply-btn">
                                        <i class="fa fa-magic"></i> Apply Formatting
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                // Remove any existing modal
                $('#poetry-metadata-modal').remove();
                // Add modal to body
                $('body').append(modalHtml);
                // Note: content type selection removed - modal only accepts a Title for poetry
                // Show the modal
                $('#poetry-metadata-modal').modal({
                    backdrop: 'static',
                    keyboard: true
                });
                // Focus on the input when modal is shown
                $('#poetry-metadata-modal').on('shown.bs.modal', function() {
                    $('#poetry-metadata-input').focus();
                });
                // Handle apply button click
                $('#poetry-apply-btn').off('click').on('click', function() {
                    var inputValue = $('#poetry-metadata-input').val().trim();
                    var metadata = {};
                    // Always treat as poetry and store title
                    metadata.type = 'poetry';
                    metadata.title = inputValue;
                    // Hide modal
                    $('#poetry-metadata-modal').modal('hide');
                    // Apply formatting immediately using saved selection state
                    applyPoetryFormattingImmediate(editor, text, contentType, metadata, selectionState);
                });
                // Handle Enter key in input
                $('#poetry-metadata-input').on('keypress', function(e) {
                    if (e.which === 13) { // Enter key
                        $('#poetry-apply-btn').click();
                    }
                });
                // Handle modal cancellation - no cleanup needed with immediate approach
                $('#poetry-metadata-modal').on('hidden.bs.modal', function() {
                    console.log('?? [POETRY-MODAL] Modal cancelled, no cleanup needed with immediate approach');
                    $(this).remove();
                });
            } catch (error) {
                console.error('? [POETRY-MODAL] Error showing metadata modal:', error);
                showToastNotification('error', 'Modal Error', 'Unable to show input dialog. Please try again.');
            }
        }
        /**
         * Apply poetry formatting immediately using saved selection state
         * @param {Object} editor - Froala editor instance
         * @param {string} text - Cleaned text content
         * @param {string} contentType - Detected content type
         * @param {Object} metadata - User-provided metadata
         * @param {Object} selectionState - Saved selection state
         */
        function applyPoetryFormattingImmediate(editor, text, contentType, metadata, selectionState) {
            try {
                console.log('?? [POETRY-IMMEDIATE] Applying immediate poetry formatting');
                // Generate HTML using simple poetry styling only
                var poetryHTML = generateSimplePoetryHTML(text, metadata);
                if (!poetryHTML) {
                    showToastNotification('error', 'Poetry Processing Error', 'Unable to process the selected poetry content. Please check the format and try again.');
                    return;
                }
                // Apply formatting immediately
                if (selectionState.hasSelection && selectionState.range) {
                    try {
                        // Use the saved range directly for precise insertion
                        var range = selectionState.range;
                        range.deleteContents();
                        // Create document fragment from HTML
                        var tempDiv = document.createElement('div');
                        tempDiv.innerHTML = poetryHTML;
                        var fragment = document.createDocumentFragment();
                        while (tempDiv.firstChild) {
                            fragment.appendChild(tempDiv.firstChild);
                        }
                        // Insert at the exact selection point
                        range.insertNode(fragment);
                        // Clear selection after insertion
                        if (window.getSelection) {
                            window.getSelection().removeAllRanges();
                        }
                        console.log('? [POETRY-IMMEDIATE] Inserted at exact selection point');
                    } catch (selectionError) {
                        console.warn('?? [POETRY-IMMEDIATE] Selection insertion failed, using Froala API:', selectionError);
                        editor.html.insert(poetryHTML);
                    }
                } else {
                    // Insert at current cursor position using Froala API
                    editor.html.insert(poetryHTML);
                    console.log('? [POETRY-IMMEDIATE] Inserted at current cursor position');
                }
                // Attach restore button event handlers after insertion
                setTimeout(function() {
                    attachRestoreButtonHandlers(editor);
                }, 100);
                // Show success notification
                showToastNotification('success', 'Formatting Applied', 'Poetry formatted beautifully! Use the "Plain Text" button to restore original text.');
                console.log('? [POETRY-IMMEDIATE] Poetry formatting applied successfully with metadata:', metadata);
            } catch (error) {
                console.error('? [POETRY-IMMEDIATE] Error applying immediate formatting:', error);
                showToastNotification('error', 'Formatting Error', 'An unexpected error occurred while applying formatting. Please try again.');
            }
        }
        /**
         * Apply poetry formatting with metadata (legacy function for backward compatibility)
         * @param {Object} editor - Froala editor instance
         * @param {string} text - Cleaned text content
         * @param {string} contentType - Detected content type
         * @param {Object} metadata - User-provided metadata
         */
        function applyPoetryFormatting(editor, text, contentType, metadata) {
            try {
                // Generate HTML based on content type and metadata
                var poetryHTML = generatePoetryHTML(text, contentType, metadata);
                if (!poetryHTML) {
                    showToastNotification('error', 'Poetry Processing Error', 'Unable to process the selected poetry content. Please check the format and try again.');
                    return;
                }
                // Replace the selected text with formatted content
                // First, check if there's a selection
                var selection = editor.selection.get();
                if (selection && !selection.isCollapsed) {
                    // Delete the selected content and insert the new HTML
                    editor.selection.remove();
                    editor.html.insert(poetryHTML);
                } else {
                    // If no selection, just insert at cursor position
                    editor.html.insert(poetryHTML);
                }
                // Attach restore button event handlers after insertion
                setTimeout(function() {
                    attachRestoreButtonHandlers(editor);
                }, 100);
                // Show success notification
                var successMessage = 'Content formatted beautifully!';
                var contentLabel = metadata.type === 'quran' ? 'Quran verses' : 'Poetry';
                showToastNotification('success', 'Formatting Applied', contentLabel + ' formatted beautifully! Use the "Plain Text" button to restore original text.');
                console.log('? [POETRY-BUTTON] Poetry formatting applied successfully with metadata:', metadata);
            } catch (error) {
                console.error('? [POETRY-FORMATTING] Error applying formatting:', error);
                showToastNotification('error', 'Formatting Error', 'An unexpected error occurred while applying formatting. Please try again.');
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
         * Restored to original simple logic from git history
         * @param {Array} lines - Array of text lines
         * @param {Object} metadata - User-provided metadata (optional)
         * @returns {string} - Generated HTML
         */
        function generateSimpleBilingualPoetryHTML(lines, metadata) {
            console.log('?? [POETRY-HTML] Generating simple bilingual poetry HTML with metadata:', metadata);
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
            
            // DEBUG: Log data-* attributes being added to Poetry HTML
            console.log('🔍 [POETRY-BILINGUAL] Adding data-* attributes to Poetry HTML:', {
                poetryId: poetryId,
                dataType: contentType,
                dataPoet: poetName,
                dataLanguage: language,
                dataContentType: contentType,
                originalText: originalText.substring(0, 100) + '...',
                metadata: metadata,
                phase: 'Phase 3 (Poetry)',
                function: 'generateSimpleBilingualPoetryHTML',
                timestamp: new Date().toISOString()
            });
            
            var html = '<div class="poetry-wrapper" data-type="' + contentType + '" data-id="' + poetryId + '" data-poet="' + escapeHtml(poetName) + '" data-language="' + language + '" data-content-type="' + contentType + '">\n';
            html += '    <div class="poetry-section froala-poetry-container" data-original-text="' + escapeHtml(originalText) + '">\n';
            // Add title header if provided (using original poetry styling). Use 'Anonymous' when not provided.
            var displayTitle = (metadata && (metadata.title || metadata.poetName)) ? (metadata.title || metadata.poetName) : 'Anonymous';
            // Always show header with displayTitle and the Plain Text button
            html += '        <div class="poetry-poet-header" style="display: flex; justify-content: space-between; align-items: center;">\n';
            html += '            <h4 style="margin: 0; color: #722727; font-weight: bold; font-size: 1.2em;">\n';
            html += '                <i class="fa fa-feather" style="margin-right: 8px; color: #5c726a;"></i>' + escapeHtml(displayTitle) + '\n';
            html += '            </h4>\n';
            html += '            <button type="button" class="btn btn-sm btn-primary poetry-restore-btn froala-only-btn" title="Remove poetry formatting and restore plain text">\n';
            html += '                <i class="fa fa-undo" style="margin-right: 5px;"></i>Plain Text\n';
            html += '            </button>\n';
            html += '        </div>\n';
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
            html += '</div>\n';
            console.log('? [POETRY-HTML] Simple bilingual poetry HTML generated successfully');
            return html;
        }
        /**
         * Group verses with their translations - Enhanced for multiple English lines per Arabic verse
         * @param {Array} lines - Array of text lines
         * @returns {Array} - Array of {arabic: string, english: string} objects
         */
        function groupVersesWithTranslations(lines) {
            var versePairs = [];
            var currentArabic = null;
            var currentEnglishLines = [];
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line) continue; // Skip empty lines
                if (isArabicOrUrduText(line)) {
                    // When we encounter Arabic, finalize the previous verse if any
                    if (currentArabic && currentEnglishLines.length > 0) {
                        versePairs.push({
                            arabic: currentArabic,
                            english: joinEnglishLines(currentEnglishLines)
                        });
                    } else if (currentArabic) {
                        // Arabic verse without English translation
                        versePairs.push({
                            arabic: currentArabic,
                            english: ''
                        });
                    }
                    // Start new verse
                    currentArabic = line;
                    currentEnglishLines = [];
                } else if (isEnglishText(line)) {
                    // Collect English lines for current Arabic verse
                    currentEnglishLines.push(line);
                }
            }
            // Don't forget the last verse
            if (currentArabic) {
                versePairs.push({
                    arabic: currentArabic,
                    english: currentEnglishLines.length > 0 ? joinEnglishLines(currentEnglishLines) : ''
                });
            } else if (currentEnglishLines.length > 0) {
                // Handle case where we have English lines without preceding Arabic
                versePairs.push({
                    arabic: '',
                    english: joinEnglishLines(currentEnglishLines)
                });
            }
            console.log('?? [POETRY-GROUPING] Grouped into', versePairs.length, 'verse pairs:', versePairs);
            return versePairs;
        }
        /**
         * Intelligently join multiple English lines into a single translation
         * @param {Array} englishLines - Array of English text lines
         * @returns {string} - Combined English translation
         */
        function joinEnglishLines(englishLines) {
            if (!englishLines || englishLines.length === 0) {
                return '';
            }
            if (englishLines.length === 1) {
                return englishLines[0];
            }
            // Clean up lines: remove quotes and extra punctuation for joining
            var cleanedLines = englishLines.map(function(line) {
                return line
                    .replace(/^["'"'"]/g, '') // Remove leading quotes
                    .replace(/["'"'"]$/g, '') // Remove trailing quotes
                    .replace(/[��]/g, '�') // Normalize dashes
                    .trim();
            });
            // Join lines intelligently
            var result = '';
            for (var i = 0; i < cleanedLines.length; i++) {
                var line = cleanedLines[i];
                if (i === 0) {
                    result = line;
                } else {
                    // Check if previous line ends with punctuation
                    var prevLine = result.trim();
                    var needsSpace = true;
                    // If previous line ends with certain punctuation, start new sentence
                    if (prevLine.match(/[.!?:]$/)) {
                        result += ' ' + line;
                    } 
                    // If current line starts with certain punctuation, connect directly
                    else if (line.match(/^[,;��]/)) {
                        result += ' ' + line;
                    }
                    // Default: add space between lines
                    else {
                        result += ' ' + line;
                    }
                }
            }
            return result.trim();
        }
        /**
         * Generate HTML for Quran verses with translations
         * @param {Array} lines - Array of text lines
         * @param {Object} metadata - User-provided metadata (reference)
         * @returns {string} - Generated HTML
         */
        function generateQuranBilingualHTML(lines, metadata) {
            metadata = metadata || {};
            // Trim all lines before processing
            var trimmedLines = lines.map(function(line) { 
                return typeof line === 'string' ? line.trim() : String(line).trim(); 
            }).filter(function(line) { 
                return line.length > 0; 
            });
            var originalText = trimmedLines.join('\n');
            var html = '<div class="poetry-wrapper">\n';
            html += '    <div class="quran-section froala-poetry-container" data-original-text="' + escapeHtml(originalText) + '">\n';
            // Add Quran reference header if provided
            if (metadata.reference && metadata.reference.length > 0) {
                html += '        <div class="quran-reference-header" style="text-align: center; margin-bottom: 25px; padding: 15px; border: 2px solid #2c5530; border-radius: 8px; background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">\n';
                html += '            <h4 style="margin: 0; color: #2c5530; font-weight: bold; font-size: 1.3em;">\n';
                html += '                <i class="fa fa-book" style="margin-right: 8px; color: #5c726a;"></i>\n';
                html += '                <span style="color: #1a4a1e;">?????? ??????</span>\n';
                html += '                <br><span style="font-size: 0.9em; color: #4a5c4a; margin-top: 5px; display: inline-block;">' + escapeHtml(metadata.reference) + '</span>\n';
                html += '            </h4>\n';
                html += '        </div>\n';
            } else {
                // Default header without reference
                html += '        <div class="quran-reference-header" style="text-align: center; margin-bottom: 25px; padding: 15px; border: 2px solid #2c5530; border-radius: 8px; background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">\n';
                html += '            <h4 style="margin: 0; color: #2c5530; font-weight: bold; font-size: 1.3em;">\n';
                html += '                <i class="fa fa-book" style="margin-right: 8px; color: #5c726a;"></i>\n';
                html += '                <span style="color: #1a4a1e;">?????? ??????</span>\n';
                html += '            </h4>\n';
                html += '        </div>\n';
            }
            html += '        <div style="text-align: right; margin-bottom: 15px;">\n';
            html += '            <button type="button" class="btn btn-sm btn-success poetry-restore-btn froala-only-btn" title="Remove Quran formatting and restore plain text">\n';
            html += '                <i class="fa fa-undo" style="margin-right: 5px;"></i>Plain Text\n';
            html += '            </button>\n';
            html += '        </div>\n';
            html += '        <div class="row">\n';
            html += '            <div class="col-xs-12">\n';
            // Group verses with translations similar to poetry
            var versePairs = groupVersesWithTranslations(trimmedLines);
            for (var i = 0; i < versePairs.length; i++) {
                var verse = versePairs[i];
                
                html += '                <div class="quran-verse" style="padding: 15px; margin-bottom: 15px; border-radius: 10px; transition: all 0.3s ease; background-color: #fafbfa; border-left: 4px solid #2c5530;">\n';
                // Arabic verse with special Quran styling
                if (verse.arabic && verse.arabic.length > 0) {
                    html += '                    <p dir="rtl" class="h3 arabic-text text-center" style="margin-bottom: 10px; color: #1a4a1e; font-size: 1.8em; line-height: 2.5; font-weight: 600; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">\n';
                    html += '                        ' + escapeHtml(verse.arabic) + '\n';
                    html += '                    </p>\n';
                }
                // English translation with Quran styling
                if (verse.english && verse.english.length > 0) {
                    html += '                    <p dir="ltr" class="text-center" style="font-size: 1.4em; margin: 10px 0 0 0; color: #4a5c4a; font-style: italic; line-height: 1.6;">\n';
                    html += '                        ' + escapeHtml(verse.english) + '\n';
                    html += '                    </p>\n';
                }
                html += '                </div>\n';
            }
            html += '            </div>\n';
            html += '        </div>\n';
            html += '    </div>\n';
            html += '</div>\n';
            return html;
        }
        /**
         * Generate HTML for Arabic/Urdu only poetry
         * @param {Array} lines - Array of text lines
         * @param {Object} metadata - User-provided metadata (optional)
         * @returns {string} - Generated HTML
         */
        function generateArabicUrduOnlyHTML(lines, metadata) {
            metadata = metadata || {};
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
            var language = 'arabic-urdu'; // This function handles Arabic/Urdu content
            var contentType = 'poetry';
            
            // DEBUG: Log data-* attributes being added to Arabic/Urdu Poetry HTML
            console.log('🔍 [POETRY-ARABIC-URDU] Adding data-* attributes to Poetry HTML:', {
                poetryId: poetryId,
                dataType: contentType,
                dataPoet: poetName,
                dataLanguage: language,
                dataContentType: contentType,
                originalText: originalText.substring(0, 100) + '...',
                metadata: metadata,
                phase: 'Phase 3 (Poetry)',
                function: 'generateArabicUrduOnlyHTML',
                timestamp: new Date().toISOString()
            });
            
            var html = '<div class="poetry-wrapper" data-type="' + contentType + '" data-id="' + poetryId + '" data-poet="' + escapeHtml(poetName) + '" data-language="' + language + '" data-content-type="' + contentType + '">\n';
            html += '    <div class="poetry-section froala-poetry-container" data-original-text="' + escapeHtml(originalText) + '">\n';
            // Always render a title header. Use metadata.title, fallback to metadata.poetName, then 'Anonymous'.
            var displayTitle = (metadata && (metadata.title || metadata.poetName)) ? (metadata.title || metadata.poetName) : 'Anonymous';
            html += '        <div class="poetry-poet-header" style="display: flex; justify-content: space-between; align-items: center; text-align: center; margin-bottom: 20px; padding: 10px; border-bottom: 2px solid #722727; background: linear-gradient(135deg, #f5f3ef 0%, #fcfbf7 100%);">\n';
            html += '            <h4 style="margin: 0; color: #722727; font-weight: bold; font-size: 1.2em; flex-grow: 1; text-align: left;">\n';
            html += '                <i class="fa fa-feather" style="margin-right: 8px; color: #5c726a;"></i>' + escapeHtml(displayTitle) + '\n';
            html += '            </h4>\n';
            html += '            <button type="button" class="btn btn-sm btn-primary poetry-restore-btn froala-only-btn" title="Remove poetry formatting and restore plain text" style="margin: 0; flex-shrink: 0;">\n';
            html += '                <i class="fa fa-undo" style="margin-right: 5px;"></i>Plain Text\n';
            html += '            </button>\n';
            html += '        </div>\n';
            html += '        <div class="row">\n';
            html += '            <div class="col-xs-12">\n';
            trimmedLines.forEach(function(line, index) {
                var cleanLine = line.trim(); // Extra trimming for safety
                if (isArabicOrUrduText(cleanLine)) {
                    
                    html += '                <div class="poetry-couplet">\n';
                    html += '                    <p dir="rtl" class="h3 arabic-text text-center text-maroon" style="margin-bottom: 5px;">\n';
                    html += '                        ' + escapeHtml(cleanLine) + '\n';
                    html += '                    </p>\n';
                    html += '                </div>\n';
                }
            });
            html += '            </div>\n';
            html += '        </div>\n';
            html += '    </div>\n';
            html += '</div>';
            return html;
        }
        /**
         * Generate HTML for English only poetry
         * @param {Array} lines - Array of text lines
         * @param {Object} metadata - User-provided metadata (optional)
         * @returns {string} - Generated HTML
         */
        function generateEnglishOnlyHTML(lines, metadata) {
            metadata = metadata || {};
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
            var language = 'english'; // This function handles English content
            var contentType = 'poetry';
            
            // DEBUG: Log data-* attributes being added to English Poetry HTML
            console.log('🔍 [POETRY-ENGLISH] Adding data-* attributes to Poetry HTML:', {
                poetryId: poetryId,
                dataType: contentType,
                dataPoet: poetName,
                dataLanguage: language,
                dataContentType: contentType,
                originalText: originalText.substring(0, 100) + '...',
                metadata: metadata,
                phase: 'Phase 3 (Poetry)',
                function: 'generateEnglishOnlyHTML',
                timestamp: new Date().toISOString()
            });
            
            var html = '<div class="poetry-wrapper" data-type="' + contentType + '" data-id="' + poetryId + '" data-poet="' + escapeHtml(poetName) + '" data-language="' + language + '" data-content-type="' + contentType + '">\n';
            html += '    <div class="poetry-section froala-poetry-container" data-original-text="' + escapeHtml(originalText) + '">\n';
            // Always render a title header. Use metadata.title, fallback to metadata.poetName, then 'Anonymous'.
            var displayTitle = (metadata && (metadata.title || metadata.poetName)) ? (metadata.title || metadata.poetName) : 'Anonymous';
            html += '        <div class="poetry-poet-header" style="display: flex; justify-content: space-between; align-items: center; text-align: center; margin-bottom: 20px; padding: 10px; border-bottom: 2px solid #722727; background: linear-gradient(135deg, #f5f3ef 0%, #fcfbf7 100%);">\n';
            html += '            <h4 style="margin: 0; color: #722727; font-weight: bold; font-size: 1.2em; flex-grow: 1; text-align: left;">\n';
            html += '                <i class="fa fa-feather" style="margin-right: 8px; color: #5c726a;"></i>' + escapeHtml(displayTitle) + '\n';
            html += '            </h4>\n';
            html += '            <button type="button" class="btn btn-sm btn-primary poetry-restore-btn froala-only-btn" title="Remove poetry formatting and restore plain text" style="margin: 0; flex-shrink: 0;">\n';
            html += '                <i class="fa fa-undo" style="margin-right: 5px;"></i>Plain Text\n';
            html += '            </button>\n';
            html += '        </div>\n';
            html += '        <div class="row">\n';
            html += '            <div class="col-xs-12">\n';
            trimmedLines.forEach(function(line, index) {
                var cleanLine = line.trim(); // Extra trimming for safety
                if (isEnglishText(cleanLine)) {
                    
                    html += '                <div class="poetry-couplet">\n';
                    html += '                    <p class="text-center text-muted" style="font-size: 2rem; margin: 0;">\n';
                    html += '                        ' + escapeHtml(cleanLine) + '\n';
                    html += '                    </p>\n';
                    html += '                </div>\n';
                }
            });
            html += '            </div>\n';
            html += '        </div>\n';
            html += '    </div>\n';
            html += '</div>';
            return html;
        }
        /**
         * Show preview dialog for poetry formatting
         * @param {string} poetryHTML - Generated poetry HTML
         * @param {Function} callback - Callback function with confirmation result
         */
        function showPoetryPreviewDialog(poetryHTML, callback) {
            // Create modal dialog using existing Bootstrap modal patterns
            var modalId = 'poetryPreviewModal_' + Date.now();
            var modalHTML = '<div class="modal fade" id="' + modalId + '" tabindex="-1" role="dialog">\n';
            modalHTML += '  <div class="modal-dialog modal-lg" role="document">\n';
            modalHTML += '    <div class="modal-content">\n';
            modalHTML += '      <div class="modal-header">\n';
            modalHTML += '        <button type="button" class="close" data-dismiss="modal">&times;</button>\n';
            modalHTML += '        <h4 class="modal-title"><i class="fa fa-music"></i> Poetry Preview</h4>\n';
            modalHTML += '      </div>\n';
            modalHTML += '      <div class="modal-body" style="max-height: 400px; overflow-y: auto;">\n';
            modalHTML += '        <p class="text-muted">Preview of your formatted poetry:</p>\n';
            modalHTML += '        <div class="poetry-preview-container" style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #fcfbf7;">\n';
            modalHTML += poetryHTML;
            modalHTML += '        </div>\n';
            modalHTML += '      </div>\n';
            modalHTML += '      <div class="modal-footer">\n';
            modalHTML += '        <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>\n';
            modalHTML += '        <button type="button" class="btn btn-success" id="applyPoetryBtn">Apply Poetry Formatting</button>\n';
            modalHTML += '      </div>\n';
            modalHTML += '    </div>\n';
            modalHTML += '  </div>\n';
            modalHTML += '</div>';
            // Add modal to DOM
            $('body').append(modalHTML);
            // Show modal
            $('#' + modalId).modal('show');
            // Handle apply button click
            $('#applyPoetryBtn').on('click', function() {
                $('#' + modalId).modal('hide');
                callback(true);
            });
            // Handle modal close/cancel
            $('#' + modalId).on('hidden.bs.modal', function() {
                $(this).remove(); // Clean up modal from DOM
                if (!$('#applyPoetryBtn').data('clicked')) {
                    callback(false);
                }
            });
            // Mark button as clicked when apply is pressed
            $('#applyPoetryBtn').on('click', function() {
                $(this).data('clicked', true);
            });
        }
        /**
         * Attach event handlers to poetry restore buttons using event delegation pattern
         * Based on the pattern used in adminSessionTranscript.js for dynamic content
         * @param {Object} editor - Froala editor instance
         */
        function attachRestoreButtonHandlers(editor) {
            console.log('?? [ATTACH-HANDLERS-V2] ===== ATTACHING RESTORE BUTTON HANDLERS V2 =====');
            try {
                // Ensure we have a valid Froala editor instance
                if (!editor || !editor.el) {
                    console.warn('?? [ATTACH-HANDLERS-V2] No valid Froala editor instance provided');
                    return;
                }
                console.log('?? [ATTACH-HANDLERS-V2] Editor element:', editor.el);
                console.log('?? [ATTACH-HANDLERS-V2] Document ready state:', document.readyState);
                // Clean up any existing event handlers to prevent duplicates
                $(document).off('click.poetryRestore', '.poetry-restore-btn.froala-only-btn');
                console.log('?? [ATTACH-HANDLERS-V2] Cleared existing .poetryRestore event handlers');
                // Use event delegation pattern similar to adminSessionTranscript.js
                // This ensures that dynamically inserted poetry restore buttons will work
                $(document).on('click.poetryRestore', '.poetry-restore-btn.froala-only-btn', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('?? [ATTACH-HANDLERS-V2] .poetry-restore-btn.froala-only-btn click detected:', this);
                    var $button = $(this);
                    var $poetrySection = $button.closest('.poetry-section');
                    var originalText = $poetrySection.data('original-text');
                    console.log('?? [ATTACH-HANDLERS-V2] Button details:', {
                        tagName: this.tagName,
                        className: this.className,
                        textContent: this.textContent,
                        parentElement: this.parentElement
                    });
                    console.log('?? [ATTACH-HANDLERS-V2] Poetry section search result:', {
                        found: $poetrySection.length > 0,
                        section: $poetrySection.get(0),
                        originalText: originalText ? originalText.substring(0, 50) + '...' : 'NOT FOUND'
                    });
                    // Verify we're within a Froala editor context
                    var $froalaContainer = $button.closest('.fr-element, .fr-view');
                    console.log('?? [ATTACH-HANDLERS-V2] Froala container check:', {
                        found: $froalaContainer.length > 0,
                        container: $froalaContainer.get(0)
                    });
                    if (!$froalaContainer.length) {
                        console.warn('?? [ATTACH-HANDLERS-V2] Button clicked outside Froala editor context - ignoring');
                        return;
                    }
                    if (originalText) {
                        console.log('?? [ATTACH-HANDLERS-V2] Proceeding with text restoration...');
                        // Convert line breaks to HTML breaks for proper display
                        var htmlText = originalText.replace(/\n/g, '<br>');
                        // Replace the entire poetry section with restored text
                        var $container = $poetrySection.closest('.poetry-wrapper, .container');
                        $container.replaceWith('<p>' + htmlText + '</p>');
                        // Show success notification
                        showToastNotification('success', 'Text Restored', 'Poetry formatting removed. Original text restored successfully.');
                        console.log('? [ATTACH-HANDLERS-V2] Text restored successfully via event delegation');
                    } else {
                        console.error('? [ATTACH-HANDLERS-V2] Original text not found');
                        showToastNotification('error', 'Restore Error', 'Original text not found. Unable to restore.');
                    }
                });
                console.log('? [ATTACH-HANDLERS-V2] Event delegation set up for .poetry-restore-btn.froala-only-btn');
                // Check for existing buttons immediately
                var existingButtons = $('.poetry-restore-btn.froala-only-btn');
                console.log('?? [ATTACH-HANDLERS-V2] Found existing .poetry-restore-btn.froala-only-btn buttons:', existingButtons.length);
                existingButtons.each(function(index) {
                    console.log(`?? [ATTACH-HANDLERS-V2] Button ${index + 1}:`, {
                        element: this,
                        classes: this.className,
                        text: this.textContent,
                        parent: this.parentElement
                    });
                });
            } catch (error) {
                console.error('? [ATTACH-HANDLERS-V2] Error setting up event delegation:', error);
                console.error('? [ATTACH-HANDLERS-V2] Error stack:', error.stack);
            }
        }
        /**
         * Show toast notification (using existing notification system)
         * @param {string} type - 'success', 'error', 'warning', 'info'
         * @param {string} title - Notification title
         * @param {string} message - Notification message
         */
        function showToastNotification(type, title, message) {
            try {
                // Try to use existing toast notification system
                if (typeof common !== 'undefined' && common.logger && common.logger.logSuccess) {
                    switch (type) {
                        case 'success':
                            common.logger.logSuccess(message, null, title);
                            break;
                        case 'error':
                            common.logger.logError(message, null, title);
                            break;
                        case 'warning':
                            common.logger.logWarning(message, null, title);
                            break;
                        default:
                            common.logger.log(message, null, title);
                    }
                } else if (typeof dlg !== 'undefined' && dlg.confirmationDialog) {
                    // Use bootstrap dialog instead of browser alert
                    dlg.confirmationDialog(title, message, "OK", null);
                } else {
                    // Ultimate fallback to browser alert
                    alert(title + '\n\n' + message);
                }
            } catch (error) {
                console.error('🔔 [NOTIFICATION] Error showing notification:', error);
                // Ultimate fallback - try bootstrap dialog first, then alert
                try {
                    if (typeof dlg !== 'undefined' && dlg.confirmationDialog) {
                        dlg.confirmationDialog("Notification Error", "Failed to show notification: " + message, "OK", null);
                    } else {
                        alert(title + '\n\n' + message);
                    }
                } catch (fallbackError) {
                    console.error('🔔 [NOTIFICATION] Even fallback failed:', fallbackError);
                    alert(title + '\n\n' + message);
                }
            }
        }
        /**
         * Check if an element is a poetry formatted element
         * @param {Element} element - DOM element to check
         * @returns {boolean} - True if element is a poetry div
         */
        function isPoetryElement(element) {
            if (!element) return false;
            // Check if element has poetry-section or poetry-wrapper class
            if ($(element).hasClass('poetry-section') || $(element).hasClass('poetry-wrapper')) {
                return true;
            }
            // Check if element is inside a poetry section or wrapper
            return $(element).closest('.poetry-section, .poetry-wrapper').length > 0;
        }
        /**
         * Find parent poetry element from current selection
         * @param {Element} element - Starting element
         * @returns {Element|null} - Poetry container element or null
         */
        function findParentPoetryElement(element) {
            if (!element) return null;
            return $(element).closest('.poetry-section, .poetry-wrapper')[0] || null;
        }
        /**
         * Remove poetry formatting and restore plain text
         * @param {Object} editor - Froala editor instance
         * @param {Element} poetryElement - Poetry container element
         */
        function removePoetryFormatting(editor, poetryElement) {
            try {
                var $poetryDiv = $(poetryElement).closest('.poetry-section, .poetry-wrapper');
                if ($poetryDiv.length === 0) {
                    showToastNotification('error', 'Poetry Removal Error', 'No poetry formatting found to remove.');
                    return;
                }
                // Extract plain text from poetry div
                var plainText = extractPlainTextFromPoetry($poetryDiv);
                if (!plainText) {
                    showToastNotification('error', 'Poetry Removal Error', 'Unable to extract text from poetry formatting.');
                    return;
                }
                // Convert line breaks to HTML breaks for proper display
                var htmlText = plainText.replace(/\n/g, '<br>');
                // Replace poetry div with plain text (with HTML line breaks)
                $poetryDiv.replaceWith('<p>' + htmlText + '</p>');
                // Show success notification
                showToastNotification('success', 'Poetry Removed', 'Poetry formatting has been removed and plain text restored.');
                console.log('? [POETRY-REMOVAL] Poetry formatting removed successfully');
            } catch (error) {
                console.error('? [POETRY-REMOVAL] Error removing poetry formatting:', error);
                showToastNotification('error', 'Poetry Removal Error', 'An error occurred while removing poetry formatting.');
            }
        }
        /**
         * Extract plain text from formatted poetry div
         * @param {jQuery} $poetryDiv - Poetry container jQuery object
         * @returns {string} - Plain text with preserved line breaks
         */
        function extractPlainTextFromPoetry($poetryDiv) {
            var plainText = '';
            try {
                // Find all text-containing elements and preserve their structure
                $poetryDiv.find('.poetry-couplet').each(function() {
                    var $couplet = $(this);
                    // Extract text from each line within the couplet
                    $couplet.find('.h3.arabic-text, p').each(function() {
                        var $line = $(this);
                        var text = $line.text().trim();
                        if (text) {
                            plainText += text + '\n';
                        }
                    });
                });
                // If no couplets found, try direct extraction from all text elements
                if (!plainText) {
                    $poetryDiv.find('.h3.arabic-text, p').each(function() {
                        var $element = $(this);
                        var text = $element.text().trim();
                        if (text) {
                            plainText += text + '\n';
                        }
                    });
                }
                // Clean up: remove excessive line breaks but preserve structure
                plainText = plainText.replace(/\n{3,}/g, '\n\n').trim();
                return plainText;
            } catch (error) {
                console.error('? [TEXT-EXTRACTION] Error extracting plain text:', error);
                return null;
            }
        }
        /**
         * Escape HTML entities for safe insertion
         * @param {string} text - Text to escape
         * @returns {string} - HTML-escaped text
         */
        function escapeHtml(text) {
            if (!text) return '';
            var div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        function registerAmiriButton() {
            $.FE.DefineIcon("amiriFontButton", { NAME: "bell" });
            $.FE.RegisterCommand("amiriFontButton",
                {
                    title: "Applies the Amiri font in a span",
                    focus: false,
                    undo: true,
                    refreshAfterCallback: false,
                    callback: function () {
                        var resultHtml = this.selection.text();
                        if (resultHtml) {
                            resultHtml = "<div class='amiriCrimson'>" + resultHtml + "</div>";
                        }
                        this.html.insert(resultHtml);
                    }
                });
        }
        function registertokenizeButton() {
            $.FE.DefineIcon("tokenizeButton", { NAME: "book" });
            $.FE.RegisterCommand("tokenizeButton",
                {
                    title: "ENHANCED Token Processor: Q|2:255, Q|2:31-35 (ranges), with automatic English translation correction",
                    focus: false,
                    undo: true,
                    refreshAfterCallback: false,
                    callback: function () {
                        var editor = this;
                        var selectedToken = this.selection.text().trim();
                        console.log('?? [TOKENIZE] Processing token:', selectedToken);
                        var tokens, tokenType, tokenValue;
                        if (common.contains(selectedToken, "|")) {
                            tokens = selectedToken.split("|");
                            tokenType = tokens[0];
                            tokenValue = tokens[1];
                        } else {
                            tokenType = "";
                            tokenValue = selectedToken;
                        }
                        switch (tokenType.toUpperCase()) {
                            case "": //manual quran entry
                                console.log('?? [TOKENIZE] Processing manual Quran entry');
                                quranService.getSingleQuranVerse(tokenValue).then(function(response) {
                                    var validatedResponse = validateQuranContentQuality(response);
                                    displayResponse(validatedResponse);
                                });
                                break;
                            case "M": //marker table
                                console.log('??? [TOKENIZE] Processing marker token');
                                quranService.getHtmlMarker(tokenValue).then(displayResponse);
                                break;
                            case "U": //marker with Quran table
                                console.log('?? [TOKENIZE] Processing combined marker+Quran token');
                                var matches = tokenValue.match(/\[(.*?)\]/);
                                var quranToken = "";
                                if (matches) {
                                    quranToken = matches[1];
                                }
                                var displayResult = "";
                                return quranService.getHtmlMarker("Q:" + tokenValue)
                                    .then(function (markerResponse) {
                                        displayResult += markerResponse;
                                        return quranService.getHtmlQuran(quranToken);
                                    })
                                    .then(function (quranResponse) {
                                        displayResult += quranResponse;
                                        return displayResult;
                                    })
                                    .then(function (final) {
                                        var processedHtml = processQuranHtmlForTranslationCorrection(final);
                                        editor.html.insert(processedHtml);
                                        editor.save.save();
                                    });
                            case "H":
                                console.log('?? [TOKENIZE] Processing Hadith token');
                                if (common.isNumber(tokenValue)) {
                                    quranService.getHtmlAhadeesById(tokenValue).then(displayResponse);
                                } else {
                                    // For non-numeric values, we'll treat as ID for consistency
                                    quranService.getHtmlAhadeesById(tokenValue).then(displayResponse);
                                }
                                break;
                            case "Q": //quran table from database - ENHANCED with range support
                                console.log('?? [TOKENIZE] Processing Quran token with enhanced formatting:', tokenValue);
                                // Check if this is a range token (e.g., 2:31-35)
                                if (tokenValue.includes('-') && tokenValue.includes(':')) {
                                    console.log('?? [TOKENIZE] Detected range token format');
                                }
                                quranService.getHtmlQuran(tokenValue).then(function(response) {
                                    var validatedResponse = validateQuranContentQuality(response);
                                    displayResponse(validatedResponse);
                                });
                                break;
                            case "D": //derivative by id or transliteral
                                console.log('?? [TOKENIZE] Processing derivative token');
                                quranService.getHtmlDerivative(tokenValue).then(displayResponse);
                                break;
                            default:
                                console.warn('?? [TOKENIZE] Unknown token type:', tokenType);
                        }
                        function displayResponse(response) {
                            // ENHANCED: Apply comprehensive English translation correction
                            console.log('?? [TOKENIZE] Applying enhanced translation correction...');
                            var processedHtml = processQuranHtmlForTranslationCorrection(response);
                            editor.html.insert(processedHtml);
                            editor.save.save();
                            console.log('? [TOKENIZE] Token processing completed successfully');
                            // Trigger event for other components to rebind handlers
                            setTimeout(function() {
                                $(document).trigger('quranTokenInserted', { html: processedHtml });
                                console.log('?? [TOKENIZE] Triggered quranTokenInserted event for handler rebinding');
                            }, 100);
                        }
                    }
                });
        }
        /**
         * ENHANCED: Process Quran HTML content to correct ONLY translation text
         * CRITICAL: Arabic text is NEVER modified to preserve Quranic integrity
         * @param {string} htmlContent - Raw HTML from Quran services (quran.com, etc.)
         * @returns {string} - HTML with professionally corrected English translations only
         */
        function processQuranHtmlForTranslationCorrection(htmlContent) {
            if (!htmlContent) return htmlContent;
            try {
                console.log('?? [QURAN-PROCESSING] Starting enhanced translation correction...');
                // Apply initial sanitization while respecting Arabic content
                var sanitizedContent = sanitizeContentRespectingArabic(htmlContent);
                // Parse HTML safely using jQuery
                var $temp = $('<div>').html(sanitizedContent);
                // PRESERVE VERSE NUMBER IMAGES: Ensure ayah-number-img elements are protected
                var verseNumberImages = $temp.find('.ayah-number-img').length;
                var verseNumberCircles = $temp.find('.verse-number-circle').length;
                if (verseNumberImages > 0 || verseNumberCircles > 0) {
                    console.log('?? [IMAGE-PRESERVATION] Found ' + verseNumberImages + ' verse number images and ' + verseNumberCircles + ' verse number circles to preserve');
                }
                // INTEGRATION: If there are any Arabic elements, ensure they use the existing cleaning infrastructure
                $temp.find('.quran-ayats, .quran-ayats-single, .ayah-arabic, .arabic-text, p.ayah-arabic, div.ayah-arabic').each(function() {
                    var $arabicElement = $(this);
                    var arabicText = $arabicElement.text();
                    // Only operate on genuine Arabic content
                    if (!isArabicText(arabicText)) return;
                    // If this element is a Quran/ayah element, DO NOT run the legacy cleaning
                    // which removes tashkeel; preserve original text nodes to keep diacritics.
                    var isQuranElement = $arabicElement.is('.quran-ayats, .quran-ayats-single, .ayah-arabic, p.ayah-arabic, div.ayah-arabic');
                    // Process only text nodes so we don't affect inline images or markup
                    $arabicElement.contents().filter(function() {
                        return this.nodeType === 3; // Text nodes only
                    }).each(function() {
                        var textNode = this;
                        if (!isArabicText(textNode.nodeValue)) return;
                        if (isQuranElement) {
                            // Preserve Quranic Arabic exactly (including tashkeel)
                            // Keep the original text node value unchanged to avoid stripping diacritics
                            return;
                        }
                        // For other Arabic content (poetry, prose), apply legacy cleaning for consistency
                        try {
                            var cleanedText = integrateLegacyArabicCleaning(textNode.nodeValue, 'display');
                            textNode.nodeValue = cleanedText;
                        } catch (e) {
                            // Fallback to original if cleaning fails
                            console.warn('?? [INTEGRATION] Arabic cleaning failed for node; preserving original', e && e.message);
                        }
                    });
                    if (!isQuranElement) {
                        console.log('?? [INTEGRATION] Applied existing Arabic cleaning to preserve consistency (preserving images)');
                    } else {
                        console.log('?? [PRESERVE] Skipped legacy cleaning for Quranic element to preserve tashkeel');
                    }
                });
                // ENHANCED: Process ALL possible English translation elements
                var translationSelectors = [
                    '.quran-ayat-translation',
                    '.ayah-translation', 
                    '.quran-ayat-translation-single',
                    '.translation-text',
                    '.english-translation',
                    '.verse-translation',
                    '.ayat-translation',
                    'p.translation',
                    'div.translation',
                    '.trans',
                    '.english',
                    '[class*="translation"]',
                    '[class*="english"]'
                ];
                var correctionCount = 0;
                // Process each type of translation element - ENHANCED to preserve highlights
                translationSelectors.forEach(function(selector) {
                    $temp.find(selector).each(function() {
                        var $element = $(this);
                        var elementHtml = $element.html();
                        var translationText = $element.text().trim();
                        // Skip empty elements
                        if (!translationText) return;
                        // Double safety check - ensure this is not Arabic text
                        if (!isArabicText(translationText)) {
                            console.log('?? [PROCESSING] Found translation text in ' + selector + ':', translationText.substring(0, 50) + '...');
                            // Check if element contains highlights that need to be preserved
                            var hasHighlights = $element.find('span.highlight, .highlight').length > 0;
                            if (hasHighlights) {
                                console.log('? [HIGHLIGHT-PRESERVATION] Element contains highlights, preserving during correction...');
                                // Process with highlight preservation
                                var correctedHtml = correctTranslationWithHighlightPreservation($element);
                                if (correctedHtml !== elementHtml) {
                                    $element.html(correctedHtml);
                                    correctionCount++;
                                    console.log('? [CORRECTED] ' + selector + ' updated with preserved highlights');
                                }
                            } else {
                                // Standard processing for elements without highlights
                                var correctedTranslation = correctTranslationTextOnly(translationText);
                                // Only update if correction actually changed something
                                if (correctedTranslation !== translationText) {
                                    $element.text(correctedTranslation);
                                    correctionCount++;
                                    console.log('? [CORRECTED] ' + selector + ' updated');
                                }
                            }
                        } else {
                            console.warn('?? [SAFETY-CHECK] Arabic text found in translation element ' + selector + ' - skipping correction');
                        }
                    });
                });
                // Also process text nodes that might contain translations (for quran.com content)
                $temp.find('*').contents().filter(function() {
                    return this.nodeType === 3; // Text nodes only
                }).each(function() {
                    var textContent = $(this).text().trim();
                    // Skip short text or Arabic content
                    if (textContent.length < 10 || isArabicText(textContent)) return;
                    // Check if this looks like a translation (contains common English words)
                    var englishIndicators = /\b(the|and|of|to|in|that|is|was|for|are|with|his|they|be|at|one|have|this|from|or|had|by|word|but|what|some|we|can|out|other|were|all|there|when|up|use|your|how|said|each|she|which|do|their|time|will|about|if|up|out|many|then|them|these|so|some|her|would|make|like|into|him|has|two|more|her|way|could|people|my|than|first|been|call|who|its|now|find|long|down|day|did|get|come|made|may|part)\b/gi;
                    if (englishIndicators.test(textContent)) {
                        console.log('? [PROCESSING] Found potential translation text node:', textContent.substring(0, 50) + '...');
                        var correctedText = correctTranslationTextOnly(textContent);
                        if (correctedText !== textContent) {
                            $(this).replaceWith(correctedText);
                            correctionCount++;
                            console.log('? [CORRECTED] Text node updated');
                        }
                    }
                });
                // Log completion
                console.log('?? [QURAN-PROCESSING] Enhanced translation correction completed. Corrections made: ' + correctionCount);
                // FINAL VERIFICATION: Ensure verse number images are still present
                var finalVerseNumberImages = $temp.find('.ayah-number-img').length;
                var finalVerseNumberCircles = $temp.find('.verse-number-circle').length;
                if (verseNumberImages > 0 || verseNumberCircles > 0) {
                    console.log('?? [IMAGE-PRESERVATION] Final verification: ' + finalVerseNumberImages + '/' + verseNumberImages + ' verse number images preserved');
                    console.log('?? [CIRCLE-PRESERVATION] Final verification: ' + finalVerseNumberCircles + '/' + verseNumberCircles + ' verse number circles preserved');
                    if (finalVerseNumberImages < verseNumberImages) {
                        console.warn('?? [IMAGE-PRESERVATION] Some verse number images were lost during processing!');
                    }
                    if (finalVerseNumberCircles < verseNumberCircles) {
                        console.warn('?? [CIRCLE-PRESERVATION] Some verse number circles were lost during processing!');
                    }
                }
                return $temp.html();
            } catch (error) {
                console.error('? [QURAN-PROCESSING] Error processing content:', error);
                console.error('? [QURAN-PROCESSING] Stack trace:', error.stack);
                // Return original content if processing fails
                return htmlContent;
            }
        }
        /**
         * ENHANCED: Comprehensive English translation correction system
         * CRITICAL: This function should NEVER be called on Arabic text
         * @param {string} translationText - English translation text from quran.com or other sources
         * @returns {string} - Professionally corrected English translation
         */
        function correctTranslationTextOnly(translationText) {
            if (!translationText || typeof translationText !== 'string') {
                return translationText;
            }
            // Check if the text contains verse numbers in brackets - if so, preserve those parts
            var verseNumberPattern = /\s*\[\d+\]\s*/g;
            if (verseNumberPattern.test(translationText)) {
                console.log('?? [TRANSLATION-CORRECTION] Text contains verse numbers in brackets - preserving them');
                // Extract verse numbers, correct the rest, then restore
                var verseNumbers = [];
                var textWithPlaceholders = translationText.replace(verseNumberPattern, function(match, offset) {
                    var placeholder = `__VERSE_${verseNumbers.length}__`;
                    verseNumbers.push(match);
                    return placeholder;
                });
                // Correct the text without verse numbers
                var correctedWithoutVerses = correctTranslationTextOnlyInternal(textWithPlaceholders);
                // Restore verse numbers
                verseNumbers.forEach(function(verseNumber, index) {
                    correctedWithoutVerses = correctedWithoutVerses.replace(`__VERSE_${index}__`, verseNumber);
                });
                return correctedWithoutVerses;
            }
            // Check if the text is wrapped in square brackets - if so, preserve it exactly
            var trimmedText = translationText.trim();
            if (trimmedText.startsWith('[') && trimmedText.endsWith(']')) {
                console.log('?? [TRANSLATION-CORRECTION] Text in square brackets detected - preserving exactly');
                return translationText;
            }
            return correctTranslationTextOnlyInternal(translationText);
        }
        function correctTranslationTextOnlyInternal(translationText) {
            // Ensure we're working with English text only - safety check
            if (isArabicText(translationText)) {
                console.error('? [SAFETY-CHECK] Arabic text passed to translation correction function - preserving original');
                return translationText;
            }
            console.log('?? [TRANSLATION-CORRECTION] Processing:', translationText.substring(0, 50) + '...');
            var corrected = translationText;
            // 1. INITIAL CLEANUP: Remove unwanted characters and normalize spacing
            corrected = corrected
                // Remove zero-width characters and special unicode
                .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ') // Zero-width chars + non-breaking space
                .replace(/[\u2018\u2019]/g, "'") // Smart single quotes to regular apostrophes
                .replace(/[\u201C\u201D]/g, '"') // Smart double quotes to regular quotes
                .replace(/[\u2013\u2014]/g, '-') // En/em dashes to regular hyphens
                .replace(/[\u2026]/g, '...') // Ellipsis character to three periods
                .replace(/\s+/g, ' ') // Multiple spaces to single space
                .trim();
            // 2. PUNCTUATION FIXES: Comprehensive punctuation and spacing corrections
            corrected = corrected
                // Fix spacing around punctuation marks
                .replace(/\s*([,.;:!?])\s*/g, '$1 ')
                .replace(/\s*([.!?])\s*$/g, '$1') // End punctuation
                .replace(/([.!?])\s*([.!?])/g, '$1') // Remove duplicate end punctuation
                // Fix quotation marks and parentheses
                .replace(/"\s*([^"]*?)\s*"/g, ' "$1" ') // Quotes with proper spacing
                .replace(/'\s*([^']*?)\s*'/g, " '$1' ") // Single quotes
                .replace(/\(\s*/g, '(') // Opening parentheses
                .replace(/\s*\)/g, ')') // Closing parentheses
                .replace(/\[\s*/g, '[') // Opening brackets
                .replace(/\s*\]/g, ']') // Closing brackets
                // Fix hyphenated words and compound phrases
                .replace(/\s*-\s*/g, '-') // Remove spaces around hyphens in compound words
                .replace(/(\w)\s*-\s*(\w)/g, '$1-$2') // Ensure no spaces in hyphenated words
                // Fix number formatting
                .replace(/(\d)\s*:\s*(\d)/g, '$1:$2') // Verse numbers like "2:255"
                .replace(/\(\s*(\d+)\s*\)/g, '($1)') // Parenthetical numbers
                .replace(/\[\s*(\d+)\s*\]/g, '[$1]') // Bracketed numbers
                // Clean up multiple punctuation
                .replace(/([,.;:!?]){2,}/g, '$1') // Remove duplicate punctuation
                .replace(/\s{2,}/g, ' ') // Multiple spaces to single
                .trim();
            // 3. CAPITALIZATION FIXES: Proper sentence structure and capitalization
            corrected = corrected
                // Capitalize first letter of entire text
                .replace(/^([a-z])/, function(match, letter) {
                    return letter.toUpperCase();
                })
                // Capitalize after sentence endings (. ! ?)
                .replace(/([.!?])\s+([a-z])/g, function(match, punct, letter) {
                    return punct + ' ' + letter.toUpperCase();
                })
                // Capitalize after colons when starting a new sentence
                .replace(/(:)\s+([a-z])/g, function(match, colon, letter) {
                    // Only capitalize if it looks like a new sentence (more than 3 chars following)
                    var restOfText = corrected.substring(corrected.indexOf(match) + match.length);
                    if (restOfText.length > 3 && /^[a-z\s]{3,}[.!?]/.test(restOfText)) {
                        return colon + ' ' + letter.toUpperCase();
                    }
                    return match;
                })
                // Capitalize 'I' when used as pronoun
                .replace(/\bi\b/g, 'I')
                // Fix capitalization in common abbreviations
                .replace(/\bu\.s\.a\b/gi, 'U.S.A.')
                .replace(/\bbc\b/gi, 'BC')
                .replace(/\bad\b/gi, 'AD')
                .replace(/\bce\b/gi, 'CE')
                .replace(/\bbce\b/gi, 'BCE');
            // 4. ISLAMIC TERMINOLOGY: Standardize Islamic terms and phrases
            corrected = corrected
                // Allah and divine names
                .replace(/\ballah\b/gi, 'Allah')
                .replace(/\bgod\b/gi, 'Allah') // Convert generic "God" to "Allah" in Islamic context
                .replace(/\bthe almighty\b/gi, 'Allah')
                // Prophets and religious figures
                .replace(/\bprophet\s+muhammad\b/gi, 'Prophet Muhammad')
                .replace(/\bmuhammad\b/gi, 'Muhammad')
                .replace(/\bprophet\b/gi, 'Prophet')
                .replace(/\bmessenger\b/gi, 'Messenger')
                .replace(/\bmoses\b/gi, 'Moses')
                .replace(/\bjesus\b/gi, 'Jesus')
                .replace(/\babraham\b/gi, 'Abraham')
                .replace(/\bisaac\b/gi, 'Isaac')
                .replace(/\bjacob\b/gi, 'Jacob')
                .replace(/\bjoseph\b/gi, 'Joseph')
                .replace(/\bdavid\b/gi, 'David')
                .replace(/\bsolomon\b/gi, 'Solomon')
                // Divine attributes and titles
                .replace(/\bmost gracious\b/gi, 'Most Gracious')
                .replace(/\bmost merciful\b/gi, 'Most Merciful')
                .replace(/\ball knowing\b/gi, 'All-Knowing')
                .replace(/\ball wise\b/gi, 'All-Wise')
                .replace(/\ball seeing\b/gi, 'All-Seeing')
                .replace(/\ball hearing\b/gi, 'All-Hearing')
                .replace(/\ball powerful\b/gi, 'All-Powerful')
                .replace(/\bmerciful\b/gi, 'Merciful')
                .replace(/\bcompassionate\b/gi, 'Compassionate')
                .replace(/\bforgiving\b/gi, 'Forgiving')
                // Common Islamic phrases
                .replace(/\bin the name of allah\b/gi, 'In the Name of Allah')
                .replace(/\bbismillah\b/gi, 'Bismillah')
                .replace(/\bsubhan allah\b/gi, 'Subhan Allah')
                .replace(/\balhamdulillah\b/gi, 'Alhamdulillah')
                .replace(/\ballahu akbar\b/gi, 'Allahu Akbar')
                .replace(/\bla ilaha illa allah\b/gi, 'La ilaha illa Allah')
                .replace(/\binsha allah\b/gi, 'Insha Allah')
                .replace(/\bmasha allah\b/gi, 'Masha Allah')
                // Religious concepts
                .replace(/\bislam\b/gi, 'Islam')
                .replace(/\bmuslim\b/gi, 'Muslim')
                .replace(/\bquran\b/gi, 'Quran')
                .replace(/\bkoran\b/gi, 'Quran')
                .replace(/\bbible\b/gi, 'Bible')
                .replace(/\btorah\b/gi, 'Torah')
                .replace(/\bgospel\b/gi, 'Gospel')
                .replace(/\bchristian\b/gi, 'Christian')
                .replace(/\bjewish\b/gi, 'Jewish')
                .replace(/\bheavenly\b/gi, 'Heavenly')
                .replace(/\bdivine\b/gi, 'Divine')
                .replace(/\bscripture\b/gi, 'Scripture')
                .replace(/\brevelation\b/gi, 'Revelation')
                // Places and concepts
                .replace(/\bmecca\b/gi, 'Mecca')
                .replace(/\bmedina\b/gi, 'Medina')
                .replace(/\bjerusalem\b/gi, 'Jerusalem')
                .replace(/\bheaven\b/gi, 'Heaven')
                .replace(/\bhell\b/gi, 'Hell')
                .replace(/\bparadise\b/gi, 'Paradise')
                .replace(/\bday of judgment\b/gi, 'Day of Judgment')
                .replace(/\bafterlife\b/gi, 'Afterlife')
                // Books and chapters
                .replace(/\bsurah\b/gi, 'Surah')
                .replace(/\bayah\b/gi, 'Ayah')
                .replace(/\bverse\b/gi, 'verse'); // Keep 'verse' lowercase as it's more general
            // 5. GRAMMAR AND SENTENCE STRUCTURE: Improve readability
            corrected = corrected
                // Fix common grammar issues
                .replace(/\band and\b/gi, 'and') // Remove duplicate "and"
                .replace(/\bthe the\b/gi, 'the') // Remove duplicate "the"
                .replace(/\bof of\b/gi, 'of') // Remove duplicate "of"
                .replace(/\bin in\b/gi, 'in') // Remove duplicate "in"
                .replace(/\bto to\b/gi, 'to') // Remove duplicate "to"
                .replace(/\bfor for\b/gi, 'for') // Remove duplicate "for"
                .replace(/\bwith with\b/gi, 'with') // Remove duplicate "with"
                // Fix common word order issues in translations
                .replace(/\bsaid he\b/gi, 'he said')
                .replace(/\basked he\b/gi, 'he asked')
                .replace(/\breplied he\b/gi, 'he replied')
                // Improve conjunctions and transitions
                .replace(/\band,\s+/gi, 'and ')
                .replace(/\bbut,\s+/gi, 'but ')
                .replace(/\bso,\s+/gi, 'so ')
                .replace(/\byet,\s+/gi, 'yet ')
                // Fix article usage
                .replace(/\ba ([aeiou])/gi, 'an $1') // Fix a/an before vowels
                .replace(/\ban ([^aeiou])/gi, 'a $1'); // Fix an/a before consonants
            // 6. FINAL CLEANUP: Last-pass corrections
            corrected = corrected
                // Remove extra whitespace
                .replace(/\s{2,}/g, ' ')
                .replace(/\s+([,.;:!?])/g, '$1') // Remove space before punctuation
                .replace(/([.!?])\s*$/g, '$1') // Clean up ending
                // Fix any remaining quote issues
                .replace(/\s+"/g, ' "') // Space before opening quote
                .replace(/"\s+/g, '" ') // Space after closing quote
                // Ensure proper ending punctuation
                .replace(/[^.!?]\s*$/, function(match) {
                    return match.trim() + '.';
                })
                .trim();
            console.log('? [TRANSLATION-CORRECTION] Completed:', corrected.substring(0, 50) + '...');
            return corrected;
        }
        /**
         * Enhanced function to correct translation text while preserving highlight spans AND verse number circles
         * @param {jQuery} $element - jQuery element containing translation text with potential highlights and verse circles
         * @returns {string} - Corrected HTML with preserved highlights and verse circles
         */
        function correctTranslationWithHighlightPreservation($element) {
            console.log('?? [HIGHLIGHT-PRESERVATION] Starting correction with highlight and verse circle preservation...');
            var originalHtml = $element.html();
            var fullText = $element.text();
            // Extract highlights and their positions
            var highlights = [];
            $element.find('span.highlight, .highlight').each(function(index) {
                var $highlight = $(this);
                var highlightText = $highlight.text();
                highlights.push({
                    text: highlightText,
                    originalText: highlightText,
                    index: index,
                    element: $highlight.clone(),
                    type: 'highlight'
                });
                console.log('?? [HIGHLIGHT-EXTRACTED] #' + index + ': "' + highlightText + '"');
            });
            // Extract verse number circles and their positions
            var verseCircles = [];
            $element.find('span.verse-number-circle, .verse-number-circle').each(function(index) {
                var $circle = $(this);
                var circleText = $circle.text();
                var circleHtml = $circle.prop('outerHTML');
                verseCircles.push({
                    text: circleText,
                    html: circleHtml,
                    index: index,
                    element: $circle.clone(),
                    type: 'verse-circle'
                });
                console.log('?? [VERSE-CIRCLE-EXTRACTED] #' + index + ': "' + circleText + '" -> ' + circleHtml);
            });
            // Apply correction to the full text
            var correctedFullText = correctTranslationTextOnly(fullText);
            // If no correction needed and no special elements, return original
            if (correctedFullText === fullText && highlights.length === 0 && verseCircles.length === 0) {
                console.log('? [NO-CORRECTION-NEEDED] Text already properly formatted with no special elements');
                return originalHtml;
            }
            console.log('?? [APPLYING-ELEMENTS] Reapplying ' + highlights.length + ' highlights and ' + verseCircles.length + ' verse circles to corrected text...');
            // Start with corrected text
            var resultHtml = escapeHtml(correctedFullText);
            // Apply each highlight back to the corrected text
            highlights.forEach(function(highlight, index) {
                var originalText = highlight.originalText;
                var correctedHighlightText = correctTranslationTextOnly(originalText);
                // Try exact match first
                var exactMatch = resultHtml.indexOf(correctedHighlightText);
                if (exactMatch !== -1) {
                    console.log('? [EXACT-MATCH] Highlight #' + index + ' found exact match in corrected text');
                    resultHtml = resultHtml.substring(0, exactMatch) + 
                                '<span class="highlight">' + correctedHighlightText + '</span>' +
                                resultHtml.substring(exactMatch + correctedHighlightText.length);
                } else {
                    // Try fuzzy matching
                    var bestMatch = findBestMatchingSubstring(correctedHighlightText, resultHtml);
                    if (bestMatch && bestMatch.similarity > 0.7) {
                        console.log('?? [FUZZY-MATCH] Highlight #' + index + ' found fuzzy match (similarity: ' + bestMatch.similarity.toFixed(2) + ')');
                        resultHtml = resultHtml.substring(0, bestMatch.start) + 
                                    '<span class="highlight">' + bestMatch.text + '</span>' +
                                    resultHtml.substring(bestMatch.end);
                    } else {
                        console.warn('?? [MATCH-FAILED] Could not find suitable match for highlight: "' + correctedHighlightText + '"');
                        // As fallback, try to append highlight at reasonable position
                        if (resultHtml.indexOf(originalText) !== -1) {
                            resultHtml = resultHtml.replace(originalText, '<span class="highlight">' + originalText + '</span>');
                            console.log('?? [FALLBACK] Applied original highlight text as fallback');
                        }
                    }
                }
            });
            // Apply verse number circles back to the corrected text
            verseCircles.forEach(function(circle, index) {
                var circleText = circle.text;
                var circleHtml = circle.html;
                // Verse numbers typically appear at the end, so append them
                // But first check if they're already there to avoid duplication
                if (resultHtml.indexOf(circleHtml) === -1) {
                    // Look for the verse number as plain text at the end
                    var plainNumberAtEnd = new RegExp('\\s*' + circleText + '\\.?\\s*$');
                    if (plainNumberAtEnd.test(resultHtml)) {
                        // Replace the plain number with the styled circle
                        resultHtml = resultHtml.replace(plainNumberAtEnd, ' ' + circleHtml);
                        console.log('?? [VERSE-CIRCLE-RESTORED] #' + index + ': Replaced plain number with styled circle');
                    } else {
                        // Append at the end as fallback
                        resultHtml = resultHtml.trim() + ' ' + circleHtml;
                        console.log('?? [VERSE-CIRCLE-APPENDED] #' + index + ': Appended circle to end');
                    }
                } else {
                    console.log('?? [VERSE-CIRCLE-EXISTS] #' + index + ': Circle already present in result');
                }
            });
            console.log('? [PRESERVATION-COMPLETE] Successfully preserved ' + highlights.length + ' highlights and ' + verseCircles.length + ' verse circles in corrected text');
            return resultHtml;
        }
        /**
         * Helper function to escape HTML entities
         * @param {string} text - Plain text to escape
         * @returns {string} - HTML-escaped text
         */
        function escapeHtml(text) {
            var div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        /**
         * Safety check to detect Arabic text and prevent accidental modification
         * @param {string} text - Text to check
         * @returns {boolean} - True if text contains Arabic characters
         */
        function isArabicText(text) {
            if (!text || typeof text !== 'string') return false;
            // Check for Arabic Unicode ranges
            var arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
            return arabicRegex.test(text);
        }
        /**
         * Enhanced content sanitization that respects Arabic text
         * @param {string} htmlContent - HTML content to sanitize
         * @returns {string} - Sanitized HTML with Arabic text preserved
         */
        function sanitizeContentRespectingArabic(htmlContent) {
            if (!htmlContent) return htmlContent;
            try {
                var $temp = $('<div>').html(htmlContent);
                // Remove unwanted HTML elements while preserving structure
                $temp.find('script, style, meta, link').remove();
                // Clean up formatting but preserve Arabic content completely
                $temp.find('*').each(function() {
                    var $element = $(this);
                    var textContent = $element.text();
                    // Only clean non-Arabic elements
                    if (!isArabicText(textContent)) {
                        // Remove unnecessary attributes from non-Arabic elements
                        // PRESERVE image attributes (src, alt, onerror) and other important attributes
                        var attributesToKeep = ['class', 'id', 'style', 'data-token', 'src', 'alt', 'onerror', 'data-original-token', 'data-surah', 'data-ayats'];
                        var attributes = $element[0].attributes;
                        var toRemove = [];
                        for (var i = 0; i < attributes.length; i++) {
                            var attrName = attributes[i].name;
                            if (attributesToKeep.indexOf(attrName) === -1) {
                                toRemove.push(attrName);
                            }
                        }
                        toRemove.forEach(function(attr) {
                            $element.removeAttr(attr);
                        });
                    }
                });
                return $temp.html();
            } catch (error) {
                console.error('? [SANITIZATION] Error during content sanitization:', error);
                return htmlContent; // Return original if sanitization fails
            }
        }
        /**
         * INTEGRATION: Connect with existing Arabic cleaning infrastructure
         * Uses the centralized cleanArabic filter for consistent text processing
         * @param {string} arabicText - Arabic text to clean (if any processing is needed)
         * @param {string} mode - Cleaning mode: 'display' or 'search'
         * @returns {string} - Cleaned Arabic text using existing infrastructure
         */
        function integrateLegacyArabicCleaning(arabicText, mode) {
            if (!arabicText || typeof arabicText !== 'string') {
                return arabicText;
            }
            try {
                // Use the injected $filter service
                if ($filter && $filter('cleanArabic')) {
                    var cleanedText = $filter('cleanArabic')(arabicText, mode || 'display');
                    console.log('?? [INTEGRATION] Used existing Arabic cleaning infrastructure');
                    return cleanedText;
                } else {
                    console.log('?? [INTEGRATION] cleanArabic filter not available, using original text');
                    return arabicText;
                }
            } catch (error) {
                console.warn('?? [INTEGRATION] Arabic cleaning filter access error (using fallback):', error.message);
                // Fallback: return original text if filter integration fails
                return arabicText;
            }
        }
        /**
         * ENHANCEMENT: Advanced content quality analyzer with scoring system
         * @param {string} htmlContent - HTML content to analyze
         * @returns {Object} - Detailed quality analysis with score and recommendations
         */
        function analyzeContentQuality(htmlContent) {
            if (!htmlContent) return { score: 0, issues: ['No content provided'], recommendations: [] };
            try {
                var $temp = $('<div>').html(htmlContent);
                var analysis = {
                    score: 100,
                    issues: [],
                    recommendations: [],
                    statistics: {
                        arabicElements: 0,
                        translationElements: 0,
                        totalCharacters: htmlContent.length,
                        arabicCharacters: 0,
                        englishCharacters: 0
                    }
                };
                // Analyze Arabic content
                $temp.find('.quran-ayats, .quran-ayats-single, .ayah-arabic, .arabic-text').each(function() {
                    var arabicText = $(this).text().trim();
                    analysis.statistics.arabicElements++;
                    analysis.statistics.arabicCharacters += arabicText.length;
                    if (arabicText.length === 0) {
                        analysis.score -= 20;
                        analysis.issues.push('Empty Arabic content detected');
                        analysis.recommendations.push('Ensure all Arabic elements have content');
                    } else if (!isArabicText(arabicText)) {
                        analysis.score -= 30;
                        analysis.issues.push('Non-Arabic text in Arabic element: ' + arabicText.substring(0, 30));
                        analysis.recommendations.push('Move non-Arabic text to appropriate translation elements');
                    } else if (arabicText.length < 5) {
                        analysis.score -= 10;
                        analysis.issues.push('Very short Arabic content (may be incomplete)');
                        analysis.recommendations.push('Verify Arabic content completeness');
                    }
                });
                // Analyze translation content
                $temp.find('.quran-ayat-translation, .ayah-translation, .quran-ayat-translation-single').each(function() {
                    var translationText = $(this).text().trim();
                    analysis.statistics.translationElements++;
                    analysis.statistics.englishCharacters += translationText.length;
                    if (translationText.length === 0) {
                        analysis.score -= 15;
                        analysis.issues.push('Empty translation detected');
                        analysis.recommendations.push('Provide complete English translations');
                    } else if (isArabicText(translationText)) {
                        analysis.score -= 25;
                        analysis.issues.push('Arabic text found in translation element');
                        analysis.recommendations.push('Move Arabic text to appropriate Arabic elements');
                    } else {
                        // Advanced English quality checks
                        if (!/^[A-Z]/.test(translationText)) {
                            analysis.score -= 5;
                            analysis.issues.push('Translation does not start with capital letter');
                            analysis.recommendations.push('Capitalize first letter of translations');
                        }
                        if (!/[.!?]$/.test(translationText)) {
                            analysis.score -= 5;
                            analysis.issues.push('Translation missing ending punctuation');
                            analysis.recommendations.push('Add proper ending punctuation to translations');
                        }
                        if (/\s{2,}/.test(translationText)) {
                            analysis.score -= 3;
                            analysis.issues.push('Multiple consecutive spaces in translation');
                            analysis.recommendations.push('Clean up spacing in translations');
                        }
                        if (translationText.length < 10) {
                            analysis.score -= 8;
                            analysis.issues.push('Very short translation (may be incomplete)');
                            analysis.recommendations.push('Verify translation completeness');
                        }
                    }
                });
                // Balance check
                if (analysis.statistics.arabicElements > 0 && analysis.statistics.translationElements === 0) {
                    analysis.score -= 20;
                    analysis.issues.push('Arabic content without corresponding translations');
                    analysis.recommendations.push('Provide English translations for all Arabic content');
                } else if (analysis.statistics.translationElements > 0 && analysis.statistics.arabicElements === 0) {
                    analysis.score -= 15;
                    analysis.issues.push('Translation content without corresponding Arabic');
                    analysis.recommendations.push('Ensure Arabic content is present for translations');
                }
                // Ensure score doesn't go below 0
                analysis.score = Math.max(0, analysis.score);
                return analysis;
            } catch (error) {
                console.error('? [QUALITY-ANALYSIS] Error during analysis:', error);
                return { 
                    score: 50, 
                    issues: ['Analysis failed: ' + error.message], 
                    recommendations: ['Review content manually'],
                    statistics: { error: true }
                };
            }
        }
        /**
         * Validate Quran content quality without modifying Arabic text
         * @param {string} htmlContent - HTML content to validate
         * @returns {string} - Original content (validation is for logging only)
         */
        function validateQuranContentQuality(htmlContent) {
            if (!htmlContent) return htmlContent;
            try {
                // Use enhanced quality analysis
                var analysis = analyzeContentQuality(htmlContent);
                // Log comprehensive validation results with quality score
                if (analysis.score < 80) {
                    console.warn('?? [QURAN-VALIDATION] Content quality issues found (Score: ' + analysis.score + '/100):', {
                        score: analysis.score,
                        issues: analysis.issues,
                        recommendations: analysis.recommendations,
                        statistics: analysis.statistics
                    });
                } else {
                    console.log('? [QURAN-VALIDATION] Content validation passed (Score: ' + analysis.score + '/100)', {
                        statistics: analysis.statistics
                    });
                }
                // Performance monitoring
                if (analysis.statistics.totalCharacters > 10000) {
                    console.info('?? [PERFORMANCE] Large content detected (' + analysis.statistics.totalCharacters + ' chars) - consider optimization');
                }
                // Always return original content - validation is for logging only
                return htmlContent;
            } catch (error) {
                console.error('? [QURAN-VALIDATION] Validation error:', error);
                return htmlContent;
            }
        }
        /**
         * ENHANCEMENT: Performance-optimized text correction with caching
         * @param {string} translationText - English translation text
         * @returns {string} - Corrected English translation
         */
        function optimizedTranslationCorrection(translationText) {
            // Static cache for commonly corrected phrases (improves performance)
            if (!optimizedTranslationCorrection._cache) {
                optimizedTranslationCorrection._cache = new Map();
            }
            var cache = optimizedTranslationCorrection._cache;
            // Check cache first
            if (cache.has(translationText)) {
                console.log('?? [PERFORMANCE] Used cached translation correction');
                return cache.get(translationText);
            }
            // Apply correction
            var corrected = correctTranslationTextOnly(translationText);
            // Cache result if text is reasonably sized (avoid memory bloat)
            if (translationText.length < 500 && cache.size < 100) {
                cache.set(translationText, corrected);
            }
            return corrected;
        }
        /**
         * FINAL ENHANCEMENT: System health monitor for the Quran processing pipeline
         * @returns {Object} - System health status and statistics
         */
        function getQuranProcessingSystemHealth() {
            var health = {
                status: 'healthy',
                version: '2.0.0-enhanced',
                features: {
                    arabicTextProtection: true,
                    translationCorrection: true,
                    qualityAnalysis: true,
                    performanceOptimization: true,
                    legacyIntegration: true
                },
                statistics: {
                    cacheSize: optimizedTranslationCorrection._cache ? optimizedTranslationCorrection._cache.size : 0,
                    lastProcessedAt: new Date().toISOString(),
                    processedContentCount: getQuranProcessingSystemHealth._processCount || 0
                },
                tests: []
            };
            // Test Arabic text detection
            try {
                var testArabic = '??? ???? ?????? ??????';
                var testEnglish = 'In the Name of Allah, the Most Gracious, the Most Merciful';
                if (isArabicText(testArabic) && !isArabicText(testEnglish)) {
                    health.tests.push({ name: 'Arabic Text Detection', status: 'passed' });
                } else {
                    health.tests.push({ name: 'Arabic Text Detection', status: 'failed' });
                    health.status = 'degraded';
                }
            } catch (error) {
                health.tests.push({ name: 'Arabic Text Detection', status: 'error', error: error.message });
                health.status = 'unhealthy';
            }
            // Test translation correction
            try {
                var testTranslation = 'in the name of allah,the most gracious';
                var correctedTranslation = correctTranslationTextOnly(testTranslation);
                if (correctedTranslation.includes('In the Name of Allah, the Most Gracious')) {
                    health.tests.push({ name: 'Translation Correction', status: 'passed' });
                } else {
                    health.tests.push({ name: 'Translation Correction', status: 'failed' });
                    health.status = 'degraded';
                }
            } catch (error) {
                health.tests.push({ name: 'Translation Correction', status: 'error', error: error.message });
                health.status = 'unhealthy';
            }
            // Test legacy integration
            try {
                // This will throw an error if the filter is not available, which is expected
                var testResult = integrateLegacyArabicCleaning('test', 'display');
                health.tests.push({ name: 'Legacy Integration', status: 'available' });
            } catch (error) {
                // This is expected if Angular context is not available during static testing
                health.tests.push({ name: 'Legacy Integration', status: 'context-dependent' });
            }
            return health;
        }
        /**
         * POLISH: Enhanced error handling wrapper for all processing functions
         * @param {Function} processingFunction - The function to wrap
         * @param {string} functionName - Name for logging
         * @returns {Function} - Wrapped function with enhanced error handling
         */
        function withEnhancedErrorHandling(processingFunction, functionName) {
            return function() {
                var args = Array.prototype.slice.call(arguments);
                var startTime = performance.now();
                try {
                    // Increment process counter for system health
                    if (!getQuranProcessingSystemHealth._processCount) {
                        getQuranProcessingSystemHealth._processCount = 0;
                    }
                    getQuranProcessingSystemHealth._processCount++;
                    var result = processingFunction.apply(this, args);
                    var endTime = performance.now();
                    console.log('? [' + functionName + '] Completed successfully in ' + (endTime - startTime).toFixed(2) + 'ms');
                    return result;
                } catch (error) {
                    var endTime = performance.now();
                    console.error('? [' + functionName + '] Failed after ' + (endTime - startTime).toFixed(2) + 'ms:', error);
                    // Return safe fallback based on function type
                    if (args.length > 0 && typeof args[0] === 'string') {
                        return args[0]; // Return original input for string processing functions
                    }
                    return null;
                }
            };
        }
        function registerHighlighter() {
            $.FE.DefineIcon("highlightButton", { NAME: "pencil-square" });
            $.FE.RegisterCommand("highlightButton",
                {
                    title: "Applies yellow highlight as a span",
                    focus: false,
                    undo: true,
                    refreshAfterCallback: false,
                    callback: function () {
                        var resultHtml = this.selection.text();
                        if (resultHtml) {
                            resultHtml = "<span class='highlight'>" + resultHtml + "</span>";
                        }
                        this.html.insert(resultHtml);
                    }
                });
        }
        function registerCopyToClipboardButton() {
            // Add custom CSS for the button styling
            if (!document.getElementById('copyButtonCustomCSS')) {
                var style = document.createElement('style');
                style.id = 'copyButtonCustomCSS';
                style.textContent = `
                    [data-cmd="copyToClipboardButton"] {
                        background-color: white !important;
                    }
                    [data-cmd="copyToClipboardButton"] i {
                        color: #ff6600 !important;
                    }
                    [data-cmd="copyToClipboardButton"]:hover {
                        background-color: #fff5f0 !important;
                    }
                `;
                document.head.appendChild(style);
            }
            $.FE.DefineIcon("copyToClipboardButton", { NAME: "files-o" }); // Changed to outline icon
            $.FE.RegisterCommand("copyToClipboardButton",
                {
                    title: "Copy HTML To Clipboard (Shift+Ctrl+C)",
                    focus: false,
                    undo: false,
                    refreshAfterCallback: false,
                    callback: function () {
                        var editor = this;
                        try {
                            // Check if there is selected content first
                            var selectedHtml = editor.selection.get();
                            var htmlContent;
                            if (selectedHtml && selectedHtml.toString().trim() !== '') {
                                // Get the HTML of the selected content
                                htmlContent = editor.html.getSelected();
                                if (!htmlContent || htmlContent.trim() === '') {
                                    // Fallback: try to get selection range HTML
                                    var range = editor.selection.ranges(0);
                                    if (range && !range.collapsed) {
                                        var container = document.createElement('div');
                                        container.appendChild(range.cloneContents());
                                        htmlContent = container.innerHTML;
                                    }
                                }
                            } else {
                                // No selection, get all content
                                htmlContent = editor.html.get();
                            }
                            if (!htmlContent || htmlContent.trim() === '') {
                                dlg.confirmationDialog("Copy to Clipboard", "No content to copy to clipboard.", "OK", null)
                                    .then(function(result) {
                                        // User acknowledged
                                    });
                                return;
                            }
                            // Use the modern Clipboard API if available
                            if (navigator.clipboard && window.isSecureContext) {
                                navigator.clipboard.writeText(htmlContent).then(function() {
                                    // Success message could be shown here
                                }).catch(function(err) {
                                    console.error('Failed to copy to clipboard using Clipboard API:', err);
                                    fallbackCopyToClipboard(htmlContent);
                                });
                            } else {
                                fallbackCopyToClipboard(htmlContent);
                            }
                        } catch (error) {
                            console.error('Error copying to clipboard:', error);
                            dlg.confirmationDialog("Copy Error", "Failed to copy content to clipboard.", "OK", null)
                                .then(function(result) {
                                    // User acknowledged the error
                                });
                        }
                        function fallbackCopyToClipboard(text) {
                            try {
                                // Fallback method using textarea
                                var textArea = document.createElement('textarea');
                                textArea.value = text;
                                textArea.style.position = 'fixed';
                                textArea.style.left = '-999999px';
                                textArea.style.top = '-999999px';
                                document.body.appendChild(textArea);
                                textArea.focus();
                                textArea.select();
                                var successful = document.execCommand('copy');
                                document.body.removeChild(textArea);
                                if (!successful) {
                                    throw new Error('execCommand copy failed');
                                }
                            } catch (err) {
                                console.error('Fallback copy failed:', err);
                                dlg.confirmationDialog("Copy Error", "Could not copy to clipboard. Please copy the content manually.", "OK", null)
                                    .then(function(result) {
                                        // User acknowledged the error
                                    });
                            }
                        }
                    }
                });
        }
        function registerPasteFromClipboardButton() {
            // Add custom CSS for the button styling
            if (!document.getElementById('pasteButtonCustomCSS')) {
                var style = document.createElement('style');
                style.id = 'pasteButtonCustomCSS';
                style.textContent = `
                    [data-cmd="pasteFromClipboardButton"] {
                        background-color: white !important;
                    }
                    [data-cmd="pasteFromClipboardButton"] i {
                        color: #ff6600 !important;
                    }
                    [data-cmd="pasteFromClipboardButton"]:hover {
                        background-color: #fff5f0 !important;
                    }
                `;
                document.head.appendChild(style);
            }
            $.FE.DefineIcon("pasteFromClipboardButton", { NAME: "paste" });
            $.FE.RegisterCommand("pasteFromClipboardButton",
                {
                    title: "Paste From Clipboard (Shift+Ctrl+V)",
                    focus: false,
                    undo: true,
                    refreshAfterCallback: false,
                    callback: function () {
                        var editor = this;
                        try {
                            // Use the modern Clipboard API if available
                            if (navigator.clipboard && window.isSecureContext) {
                                navigator.clipboard.readText().then(function(text) {
                                    if (text && text.trim() !== '') {
                                        // Insert the clipboard content at the current cursor position
                                        editor.html.insert(text);
                                    } else {
                                        dlg.confirmationDialog("Paste from Clipboard", "No content found in clipboard.", "OK", null)
                                            .then(function(result) {
                                                // User acknowledged
                                            });
                                    }
                                }).catch(function(err) {
                                    console.error('Failed to read from clipboard using Clipboard API:', err);
                                    dlg.confirmationDialog("Paste Error", "Could not access clipboard. Please paste manually using Ctrl+V.", "OK", null)
                                        .then(function(result) {
                                            // User acknowledged the error
                                        });
                                });
                            } else {
                                // Fallback: inform user to use manual paste
                                dlg.confirmationDialog("Paste from Clipboard", "Clipboard access not available. Please use Ctrl+V to paste manually.", "OK", null)
                                    .then(function(result) {
                                        // User acknowledged
                                    });
                            }
                        } catch (error) {
                            console.error('Error pasting from clipboard:', error);
                            dlg.confirmationDialog("Paste Error", "Failed to paste content from clipboard.", "OK", null)
                                .then(function(result) {
                                    // User acknowledged the error
                                });
                        }
                    }
                });
        }
        //#endregion
    }
})();
