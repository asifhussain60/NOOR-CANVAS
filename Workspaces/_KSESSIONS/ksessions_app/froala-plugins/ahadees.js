/*!
 * Froala Editor Ahadees Plugin
 * Custom plugin for inserting Islamic narrations (ahadees) into Froala Editor
 * Integrates with the Beautiful Islam admin ahadees system
 */

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = function (root, jQuery) {
            if (jQuery === undefined) {
                // require('jQuery') returns a factory that requires window to build a jQuery instance.
                if (typeof window !== 'undefined') {
                    jQuery = require('jquery');
                } else {
                    jQuery = require('jquery')(root);
                }
            }
            return factory(jQuery);
        };
    } else {
        // Browser globals
        factory(window.jQuery);
    }
}(function ($) {
    'use strict';
    
    if (typeof $.FroalaEditor === 'undefined' || typeof $.FE === 'undefined') {
        console.error('FroalaEditor not found! Plugin cannot initialize.');
        return;
    }

    // Define the ahadees plugin (using same pattern as other plugins)
    $.FE.PLUGINS.ahadees = function (editor) {
        
        // Private variables
        var insertionMarker = '<!--AHADEES_INSERT_MARKER-->';
        var markerPlaced = false;

        // Set up global delete button click handler using event delegation
        // This ensures delete buttons work for all hadees content, including pre-loaded content
        $(document).off('click.ahadees-delete').on('click.ahadees-delete', '.delete-hadees-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var ahadeesId = $(this).data('ahadees-id');
            var ahadeesElement = $('#' + ahadeesId);
            
            // Get hadees content for confirmation dialog
            var hadeesBriefText = 'this hadees';
            try {
                var arabicText = ahadeesElement.find('.ks-ahadees-arabic').text();
                var englishText = ahadeesElement.find('.ks-ahadees-english').text();
                if (arabicText && arabicText.length > 50) {
                    hadeesBriefText = '"' + arabicText.substring(0, 50) + '..."';
                } else if (englishText && englishText.length > 50) {
                    hadeesBriefText = '"' + englishText.substring(0, 50) + '..."';
                } else if (arabicText) {
                    hadeesBriefText = '"' + arabicText + '"';
                } else if (englishText) {
                    hadeesBriefText = '"' + englishText + '"';
                }
            } catch (e) {
                // Use default text if extraction fails
                hadeesBriefText = 'this hadees';
            }
            
            // Use bootstrap.ui dialog service like in admin controller
            try {
                var ngApp = document.querySelector('[ng-app]') || document.querySelector('[data-ng-app]');
                if (ngApp) {
                    var injector = angular.element(ngApp).injector();
                    if (injector) {
                        var dlg = injector.get('bootstrap.dialog');
                        if (dlg && dlg.confirmationDialog) {
                            dlg.confirmationDialog(
                                "Remove Hadees", 
                                "Are you sure you want to remove " + hadeesBriefText + " from the transcript?", 
                                "Yes, Remove", 
                                "Cancel"
                            ).then(function (result) {
                                if (result === "ok") {
                                    // User confirmed deletion
                                    if (ahadeesElement.length > 0) {
                                        ahadeesElement.fadeOut(300, function() {
                                            $(this).remove();
                                            
                                            // Trigger content change on the Froala editor
                                            if (editor && editor.events) {
                                                editor.events.trigger('contentChanged');
                                            }
                                        });
                                        
                                        // Show success message
                                        try {
                                            var common = injector.get('common');
                                            if (common && common.showToast) {
                                                common.showToast('Hadees removed successfully', 'success');
                                            }
                                        } catch (e) {
                                            // Silent fail for toast notification
                                        }
                                    } else {
                                        console.error('❌ [AHADEES-PLUGIN] Could not find hadees element to delete');
                                    }
                                }
                                // If result !== "ok", user cancelled - no action needed
                            }).catch(function (error) {
                                console.log('🔧 [AHADEES-PLUGIN] Dialog cancelled or error:', error);
                                // User cancelled dialog or error occurred - no action needed
                            });
                        } else {
                            // Fallback to simple confirm if bootstrap.dialog not available
                            console.warn('⚠️ [AHADEES-PLUGIN] bootstrap.dialog service not available, using fallback');
                            if (confirm('Are you sure you want to remove this hadees?')) {
                                if (ahadeesElement.length > 0) {
                                    ahadeesElement.fadeOut(300, function() {
                                        $(this).remove();
                                        if (editor && editor.events) {
                                            editor.events.trigger('contentChanged');
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                // Final fallback to simple confirm if Angular services unavailable
                console.warn('⚠️ [AHADEES-PLUGIN] Angular services unavailable, using simple confirm');
                if (confirm('Are you sure you want to remove this hadees?')) {
                    if (ahadeesElement.length > 0) {
                        ahadeesElement.fadeOut(300, function() {
                            $(this).remove();
                            if (editor && editor.events) {
                                editor.events.trigger('contentChanged');
                            }
                        });
                    }
                }
            }
        });

        /**
         * Insert selected ahadees into the editor
         */
        function insertAhadees(ahadeesData) {
            if (!ahadeesData) {
                console.error('❌ [AHADEES-PLUGIN] No ahadees data provided!');
                return;
            }
            
            // Generate a unique ID for this hadees instance
            var ahadeesId = 'ahadees-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            
            // Create ksession metadata for standardized identification
            var createKSessionMetadata = function(ahadeesData) {
                var metadata = {
                    contentType: 'ahadees',
                    ahadeesId: ahadeesData.ahadeesId || null,
                    narratorId: ahadeesData.narratorId || null,
                    narratorName: ahadeesData.narrator || ahadeesData.narratorName || null,
                    subject: ahadeesData.subject || null,
                    categoryId: ahadeesData.categoryId || null,
                    reference: ahadeesData.reference || null,
                    timestamp: new Date().toISOString()
                };
                return JSON.stringify(metadata).replace(/"/g, '&quot;');
            };
            
            var ksessionMetadata = createKSessionMetadata(ahadeesData);
            
            // Generate canonical data-* attributes for Ahadees blocks (Phase 2)
            var dataType = 'hadees';
            var dataId = ahadeesData.ahadeesId || 'unknown';
            var dataToken = 'H|' + (ahadeesData.ahadeesId || 'unknown');
            var dataCollection = ahadeesData.collection || ahadeesData.source || 'unknown';
            
            // DEBUG: Log data-* attributes being added to Ahadees HTML
            console.log('🔍 [AHADEES-FORMATTER] Adding data-* attributes to Ahadees HTML:', {
                ahadeesId: ahadeesId,
                dataType: dataType,
                dataId: dataId,
                dataToken: dataToken,
                dataCollection: dataCollection,
                ksessionMetadata: ksessionMetadata,
                phase: 'Phase 2 (Ahadees)',
                function: 'insertAhadees',
                timestamp: new Date().toISOString()
            });
            
            // Create beautiful HTML for the hadees with delete button and data-* attributes
            var ahadeesHtml = '<div class="inserted-hadees ks-ahadees-container" id="' + ahadeesId + '" ' +
                'ksession=\'' + ksessionMetadata + '\' ' +
                'data-type="' + dataType + '" ' +
                'data-id="' + dataId + '" ' +
                'data-token="' + dataToken + '" ' +
                'data-collection="' + dataCollection + '">' +
                '<button class="delete-hadees-btn ks-ahadees-delete-btn" data-ahadees-id="' + ahadeesId + '" title="Delete this hadees">✕</button>' +
                '<div class="hadees-header ks-ahadees-header">' +
                    '<h4>' +
                        '<i class="fa fa-comment ks-ahadees-header-icon" aria-hidden="true"></i>' +
                        (ahadeesData.narrator || ahadeesData.narratorName || 'Rasul Allah(Salallahu alayhi wa aalihee wa sallam)') +
                        (ahadeesData.subject ? '<span class="ks-ahadees-subject">- ' + ahadeesData.subject + '</span>' : '<span class="ks-ahadees-subject">- intellect</span>') +
                    '</h4>' +
                '</div>' +
                (ahadeesData.ahadeesArabic ? 
                    '<div class="hadees-arabic ks-ahadees-arabic">' + ahadeesData.ahadeesArabic + '</div>' : 
                    '<div class="hadees-arabic ks-ahadees-arabic">أول ما خلق الله عز وجل العقل - قال له: أقبل فأقبل ، ثم قال له: أدبر فأدبر فقال: وعزتي وجلالي ما خلقت خلقا أوجه إلي منك ، ولا أكملك إلا فيمن أحب . أما إني إياك آمرك وإياك أنهى وإياك أعطي وإياك أثيب وإياك أعاقب</div>'
                ) +
                (ahadeesData.ahadeesEnglish ? 
                    '<div class="hadees-english ks-ahadees-english">' + ahadeesData.ahadeesEnglish + '</div>' : 
                    '<div class="hadees-english ks-ahadees-english">The first thing that Allah created is the intellect. When Allah created the intellect, He examined it. He then said to it: Step forward, so it stepped forward. Then he said: Go back! So it went back. Then he said: By My power and majesty! I did not create any creature dearer to me than you. I will not make you perfect, except in the one whom I love. Indeed, to you are my orders and prohibitions addressed. And for you are my rewards and retributions reserved.</div>'
                ) +
                '</div>';

            // Find and replace the insertion marker with the hadees HTML
            if (markerPlaced) {
                var currentHtml = editor.html.get();
                var updatedHtml = currentHtml.replace(insertionMarker, ahadeesHtml);
                editor.html.set(updatedHtml);
                markerPlaced = false;
            } else {
                editor.html.insert(ahadeesHtml);
            }
            
            // Close the modal (fallback modal is the only one being used)
            $('#ahadees-fallback-modal').remove();
            
            // Show success message
            try {
                // Use the same injector method that works for data loading
                var ngApp = document.querySelector('[ng-app]') || document.querySelector('[data-ng-app]');
                if (ngApp) {
                    var injector = angular.element(ngApp).injector();
                    if (injector) {
                        var common = injector.get('common');
                        if (common && common.showToast) {
                            common.showToast('Hadees inserted successfully', 'success');
                        }
                    }
                }
            } catch (e) {
                // Silent fail for toast notification
            }
        }

        /**
         * Show the ahadees popup
         */
        function showPopup() {
            // Insert a marker at the current cursor position
            try {
                editor.html.insert(insertionMarker);
                markerPlaced = true;
            } catch (error) {
                console.error('❌ [AHADEES-PLUGIN] Failed to insert marker:', error);
                markerPlaced = false;
            }
            
            // Use the working modal method
            createModal();
        }

        /**
         * Clean up any orphaned insertion markers
         */
        function cleanupInsertionMarker() {
            if (markerPlaced) {
                try {
                    var currentHtml = editor.html.get();
                    if (currentHtml.indexOf(insertionMarker) !== -1) {
                        var cleanedHtml = currentHtml.replace(insertionMarker, '');
                        editor.html.set(cleanedHtml);
                    }
                    markerPlaced = false;
                } catch (error) {
                    console.error('❌ [AHADEES-PLUGIN] Error cleaning up marker:', error);
                }
            }
        }

        /**
         * English-to-Arabic Transliteration Engine
         * Maps common English transliterations to Arabic equivalents
         */
        function createTransliterationEngine() {
            
            // Comprehensive transliteration mapping for Islamic terms
            var transliterationMap = {
                // Names of Allah and religious terms
                'allah': ['الله', 'اللّه', 'اللہ'],
                'rahman': ['رحمن', 'الرحمن'],
                'rahim': ['رحيم', 'الرحيم'],
                'rabb': ['رب', 'ربّ'],
                'ilah': ['إله', 'اله'],
                
                // Prophet and companions
                'muhammad': ['محمد', 'محمّد', 'مُحَمَّد'],
                'ahmad': ['أحمد', 'احمد'],
                'rasul': ['رسول', 'الرسول'],
                'nabi': ['نبي', 'النبي'],
                'ibrahim': ['إبراهيم', 'ابراهيم'],
                'musa': ['موسى'],
                'isa': ['عيسى'],
                
                // Common names with Abd
                'abd': ['عبد', 'عابد'],
                'abdullah': ['عبد الله', 'عبدالله'],
                'abdur': ['عبد الـ', 'عبدالـ'],
                'abdal': ['عبد ال', 'عبدال'],
                
                // Prayer and worship terms
                'salah': ['صلاة', 'صلوة', 'الصلاة'],
                'salat': ['صلاة', 'صلوة'],
                'prayer': ['صلاة', 'دعاء'],
                'dua': ['دعاء', 'الدعاء'],
                'dhikr': ['ذكر', 'الذكر'],
                'tasbih': ['تسبيح', 'التسبيح'],
                'takbir': ['تكبير', 'التكبير'],
                
                // Pilgrimage terms
                'hajj': ['حج', 'الحج'],
                'umrah': ['عمرة', 'العمرة'],
                'ka\'ba': ['كعبة', 'الكعبة'],
                'kaaba': ['كعبة', 'الكعبة'],
                'mecca': ['مكة', 'مكّة'],
                'medina': ['المدينة', 'مدينة'],
                
                // Fasting and charity
                'sawm': ['صوم', 'الصوم'],
                'siyam': ['صيام', 'الصيام'],
                'fast': ['صوم', 'صيام'],
                'zakat': ['زكاة', 'الزكاة'],
                'sadaqah': ['صدقة', 'الصدقة'],
                
                // Book and knowledge terms
                'quran': ['قرآن', 'القرآن'],
                'hadith': ['حديث', 'الحديث'],
                'hadees': ['حديث', 'الحديث'],
                'sunnah': ['سنة', 'السنة'],
                'kitab': ['كتاب', 'الكتاب'],
                'book': ['كتاب'],
                
                // Narrator names (common)
                'bukhari': ['البخاري', 'بخاري'],
                'muslim': ['مسلم', 'المسلم'],
                'tirmidhi': ['الترمذي', 'ترمذي'],
                'ahmad': ['أحمد', 'احمد'],
                'malik': ['مالك'],
                'abu': ['أبو', 'ابو'],
                'ibn': ['ابن', 'بن'],
                'bint': ['بنت'],
                
                // Time and occasions
                'ramadan': ['رمضان', 'شهر رمضان'],
                'eid': ['عيد', 'العيد'],
                'jummah': ['جمعة', 'الجمعة'],
                'friday': ['جمعة', 'الجمعة'],
                
                // Common religious concepts
                'islam': ['إسلام', 'الإسلام'],
                'muslim': ['مسلم', 'المسلم'],
                'iman': ['إيمان', 'الإيمان'],
                'faith': ['إيمان', 'عقيدة'],
                'jihad': ['جهاد', 'الجهاد'],
                'paradise': ['جنة', 'الجنة'],
                'hell': ['جهنم', 'النار'],
                
                // Common Arabic words
                'man': ['رجل', 'الرجل'],
                'woman': ['امرأة', 'المرأة'],
                'people': ['الناس', 'قوم'],
                'house': ['بيت', 'دار'],
                'day': ['يوم', 'اليوم'],
                'night': ['ليل', 'الليل', 'ليلة'],
                'water': ['ماء', 'الماء'],
                'food': ['طعام', 'الطعام'],
                'knowledge': ['علم', 'العلم'],
                'heart': ['قلب', 'القلب'],
                'hand': ['يد', 'اليد'],
                'eye': ['عين', 'العين'],
                'face': ['وجه', 'الوجه']
            };
            
            return {
                /**
                 * Convert English transliteration to Arabic terms
                 */
                translateToArabic: function(englishText) {
                    
                    if (!englishText || typeof englishText !== 'string') {
                        return [];
                    }
                    
                    var normalizedInput = englishText.toLowerCase().trim();
                    var arabicTerms = [];
                    
                    // Check for exact matches first
                    if (transliterationMap[normalizedInput]) {
                        arabicTerms = arabicTerms.concat(transliterationMap[normalizedInput]);
                    }
                    
                    // Check for partial matches
                    Object.keys(transliterationMap).forEach(function(englishKey) {
                        if (englishKey !== normalizedInput) {
                            // Check if input contains the key or key contains the input
                            if (normalizedInput.includes(englishKey) || englishKey.includes(normalizedInput)) {
                                arabicTerms = arabicTerms.concat(transliterationMap[englishKey]);
                            }
                        }
                    });
                    
                    // Remove duplicates
                    arabicTerms = [...new Set(arabicTerms)];
                    
                    return arabicTerms;
                },
                
                /**
                 * Normalize Arabic text by removing diacritical marks
                 */
                normalizeArabic: function(arabicText) {
                    if (!arabicText || typeof arabicText !== 'string') {
                        return '';
                    }
                    
                    // Remove common Arabic diacritical marks (harakat/tashkeel)
                    var normalized = arabicText
                        .replace(/[\u064B-\u065F]/g, '') // Remove diacritics
                        .replace(/[\u0670]/g, '') // Remove superscript alef
                        .replace(/[\u06D6-\u06ED]/g, '') // Remove additional marks
                        .trim();
                    
                    return normalized;
                },
                
                /**
                 * Create comprehensive search terms from user input
                 */
                generateSearchTerms: function(userInput) {
                    console.log('🔍 [AHADEES-PLUGIN] Generating search terms for:', userInput);
                    
                    if (!userInput || typeof userInput !== 'string') {
                        return [];
                    }
                    
                    var searchTerms = [];
                    var normalizedInput = userInput.trim();
                    
                    // Add original input
                    searchTerms.push(normalizedInput);
                    
                    // Add Arabic translations
                    var arabicTerms = this.translateToArabic(normalizedInput);
                    searchTerms = searchTerms.concat(arabicTerms);
                    
                    // Add normalized versions of Arabic terms
                    arabicTerms.forEach(function(term) {
                        var normalized = this.normalizeArabic(term);
                        if (normalized && normalized !== term) {
                            searchTerms.push(normalized);
                        }
                    }.bind(this));
                    
                    // Remove duplicates and empty terms
                    searchTerms = [...new Set(searchTerms.filter(function(term) {
                        return term && term.length > 0;
                    }))];
                    
                    console.log('🔍 [AHADEES-PLUGIN] Generated search terms:', searchTerms);
                    return searchTerms;
                }
            };
        }

        /**
         * Create the ahadees modal
         */
        function createModal() {
            
            // Remove any existing fallback modal
            $('#ahadees-fallback-modal').remove();
            
            var fallbackHtml = `
                <div id="ahadees-fallback-modal" class="ks-ahadees-modal-overlay">
                    <div id="ahadees-modal-container" class="ks-ahadees-modal-container">
                        <div id="ahadees-modal-header" class="ks-ahadees-modal-header">
                            <div class="ks-ahadees-header-left">
                                <h4><span class="emoji">🕌</span> Islamic Ahadees Panel</h4>
                                <button id="manage-ahadees-link" class="ks-ahadees-manage-btn">
                                    <span>⚙️</span> Manage Ahadees
                                </button>
                            </div>
                            <div class="ks-ahadees-header-right">
                                <span class="ks-ahadees-drag-hint">📍 Drag to move</span>
                                <button id="close-ahadees-modal" class="ks-ahadees-modal-close-btn">✕</button>
                            </div>
                        </div>
                        <div id="ahadees-modal-content" class="ks-ahadees-modal-content">
                            <div class="ks-ahadees-search-section">
                                <div class="ks-ahadees-search-subsection">
                                    <label class="ks-ahadees-search-label">🔍 Universal Search</label>
                                    <input type="text" id="universal-search-input" placeholder="Search anything: narrator, topic, Arabic, English... (try: abd, allah, bukhari, prayer)">
                                    <div class="ks-ahadees-search-tip">
                                        <span>💡 Tip: Type English transliterations like 'abd', 'allah', 'muhammad'</span>
                                        <span id="search-status"></span>
                                    </div>
                                </div>
                                <div class="ks-ahadees-button-container">
                                    <button id="universal-search-btn">🔍 Smart Search</button>
                                    <button id="fallback-recent-btn">📋 Load Recent</button>
                                    <button id="clear-search-btn">🗑️ Clear</button>
                                </div>
                            </div>
                            <div id="fallback-ahadees-results" class="ks-ahadees-results-container">
                                <div class="ks-ahadees-empty-state">
                                    <div class="ks-ahadees-empty-icon">🔍</div>
                                    <p class="ks-ahadees-empty-title">Search for ahadees to insert into your content</p>
                                    <p class="ks-ahadees-empty-subtitle">This panel stays open until you close it</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(fallbackHtml);
            
            // Initialize transliteration engine
            var transliterationEngine = createTransliterationEngine();
            
            // Bind events for universal search modal
            $('#close-ahadees-modal').click(function() {
                $('#ahadees-fallback-modal').remove();
                
                // Remove any orphaned insertion marker if modal closed without inserting
                cleanupInsertionMarker();
                
                // Clean up all event handlers
                $(document).off('keydown.ahadees-modal mousemove.ahadees-drag mouseup.ahadees-drag');
                
                // Restore focus to the Froala editor when modal is closed
                setTimeout(function() {
                    if (editor && editor.$el) {
                        editor.events.focus();
                    }
                }, 100);
            });

            // Manage Ahadees button - Navigate to admin ahadees management
            $('#manage-ahadees-link').click(function() {
                // Close the modal first
                $('#ahadees-fallback-modal').remove();
                
                // Remove any orphaned insertion marker
                cleanupInsertionMarker();
                
                // Use multiple approaches to navigate internally
                try {
                    // Method 1: Try to find and use the stateGo function from rootScope
                    var $rootScope = angular.element(document.body).scope();
                    if ($rootScope && $rootScope.$root && typeof $rootScope.$root.stateGo === 'function') {
                        $rootScope.$root.stateGo('admin.ahadeesManager');
                        $rootScope.$apply();
                        return;
                    }
                    
                    // Method 2: Try to get $state service directly from injector
                    var injector = angular.element(document.body).injector();
                    if (injector) {
                        var $state = injector.get('$state');
                        if ($state && typeof $state.go === 'function') {
                            $state.go('admin.ahadeesManager');
                            return;
                        }
                    }
                    
                    // Method 3: Try to find any element with ng-controller and get its scope
                    var ngElements = angular.element('[ng-controller]');
                    if (ngElements.length > 0) {
                        var scope = angular.element(ngElements[0]).scope();
                        if (scope && scope.stateGo) {
                            scope.stateGo('admin.ahadeesManager');
                            scope.$apply();
                            return;
                        }
                    }
                    
                } catch (e) {
                    console.error('🔍 [AHADEES-PLUGIN] Angular routing failed:', e);
                }
                
                // Fallback: use location.hash for internal routing (same-page navigation)
                window.location.hash = '/admin/mng/ahadees';
            });
            
            // Universal search button
            $('#universal-search-btn').click(function() {
                performUniversalSearch(transliterationEngine);
            });
            
            // Clear search button
            $('#clear-search-btn').click(function() {
                $('#universal-search-input').val('');
                $('#search-status').text('');
                showInitialMessage();
            });
            
            $('#fallback-recent-btn').click(function() {
                loadRecentAhadees();
            });

            // Make the modal draggable
            makeDraggable();

            // Prevent modal from closing when clicking outside (make it truly modal)
            $('#ahadees-fallback-modal').off('click').on('click', function(e) {
                // Only allow closing via the close button, not by clicking overlay
                e.stopPropagation();
            });

            // Allow clicking on the modal content without closing
            $('#ahadees-modal-container').off('click').on('click', function(e) {
                e.stopPropagation();
            });

            // Enhanced Enter key search with real-time feedback
            var searchTimeout;
            $('#universal-search-input').on('input', function() {
                var searchText = $(this).val().trim();
                $('#search-status').text('');
                
                // Clear previous timeout
                clearTimeout(searchTimeout);
                
                if (searchText.length > 0) {
                    $('#search-status').text('Type more or press Enter...');
                    
                    // Auto-search after 2 seconds of inactivity
                    searchTimeout = setTimeout(function() {
                        if ($('#universal-search-input').val().trim().length >= 2) {
                            console.log('🔍 [AHADEES-PLUGIN] Auto-search triggered after 2 seconds');
                            performUniversalSearch(transliterationEngine);
                        }
                    }, 2000);
                }
            });
            
            $('#universal-search-input').keypress(function(e) {
                if (e.which === 13) { // Enter key
                    clearTimeout(searchTimeout);
                    performUniversalSearch(transliterationEngine);
                }
            });
            
            // Close modal on ESC key (optional - can be removed for truly persistent modal)
            $(document).off('keydown.ahadees-modal').on('keydown.ahadees-modal', function(e) {
                if (e.keyCode === 27) { // ESC key
                    $('#ahadees-fallback-modal').remove();
                    
                    // Remove any orphaned insertion marker if modal closed without inserting
                    cleanupInsertionMarker();
                    
                    // Restore focus to the Froala editor
                    setTimeout(function() {
                        if (editor && editor.$el) {
                            editor.events.focus();
                        }
                    }, 100);
                    
                    // Remove the ESC key handler and drag handlers
                    $(document).off('keydown.ahadees-modal mousemove.ahadees-drag mouseup.ahadees-drag');
                }
            });
            
            // Focus on universal search input
            setTimeout(function() {
                $('#universal-search-input').focus();
            }, 100);
            
            // Show initial helpful message
            showInitialMessage();
        }

        /**
         * Show initial message in results area
         */
        function showInitialMessage() {
            $('#fallback-ahadees-results').html(`
                <div class="ks-ahadees-empty-state">
                    <div class="ks-ahadees-empty-icon">🔍</div>
                    <p class="ks-ahadees-empty-title">Universal search with transliteration support</p>
                    <div class="ks-ahadees-empty-subtitle">
                        <strong>Try searching for:</strong><br>
                        🕌 <em>abd, allah, bukhari, prayer, fasting</em><br>
                        📖 <em>sahih muslim, ramadan, salah</em><br>
                        🌟 <em>muhammad, ibrahim, abdullah</em>
                    </div>
                </div>
            `);
        }

        /**
         * Make the modal draggable by the header
         */
        function makeDraggable() {
            var $modal = $('#ahadees-modal-container');
            var $header = $('#ahadees-modal-header');
            var isDragging = false;
            var startX, startY, startLeft, startTop;

            $header.on('mousedown', function(e) {
                // Only drag on left click and not on buttons
                if (e.which !== 1 || $(e.target).is('button') || $(e.target).closest('button').length > 0) {
                    return;
                }

                isDragging = true;
                $header.css('cursor', 'grabbing');
                
                // Get current position
                var modalRect = $modal[0].getBoundingClientRect();
                startLeft = modalRect.left;
                startTop = modalRect.top;
                startX = e.clientX;
                startY = e.clientY;

                // Prevent text selection during drag
                e.preventDefault();
                $(document.body).css('user-select', 'none');

                console.log('🔍 [AHADEES-PLUGIN] Drag started at:', {startX, startY, startLeft, startTop});
            });

            $(document).on('mousemove.ahadees-drag', function(e) {
                if (!isDragging) return;

                var deltaX = e.clientX - startX;
                var deltaY = e.clientY - startY;
                var newLeft = startLeft + deltaX;
                var newTop = startTop + deltaY;

                // Keep modal within viewport bounds
                var windowWidth = $(window).width();
                var windowHeight = $(window).height();
                var modalWidth = $modal.outerWidth();
                var modalHeight = $modal.outerHeight();

                newLeft = Math.max(0, Math.min(newLeft, windowWidth - modalWidth));
                newTop = Math.max(0, Math.min(newTop, windowHeight - modalHeight));

                // Update position
                $modal.css({
                    'position': 'fixed',
                    'left': newLeft + 'px',
                    'top': newTop + 'px',
                    'transform': 'none'
                });

                // Update the parent container to not center anymore
                $('#ahadees-fallback-modal').css({
                    'align-items': 'flex-start',
                    'justify-content': 'flex-start'
                });
            });

            $(document).on('mouseup.ahadees-drag', function() {
                if (isDragging) {
                    isDragging = false;
                    $header.css('cursor', 'move');
                    $(document.body).css('user-select', '');
                    console.log('🔍 [AHADEES-PLUGIN] Drag ended');
                }
            });

            // Cleanup drag events when modal is removed
            $('#close-ahadees-modal').on('click', function() {
                $(document).off('mousemove.ahadees-drag mouseup.ahadees-drag');
            });

            console.log('🔍 [AHADEES-PLUGIN] Drag functionality initialized');
        }

        /**
         * Perform universal search with transliteration support
         */
        function performUniversalSearch(transliterationEngine) {
            var userInput = $('#universal-search-input').val().trim();
            console.log('🔍 [AHADEES-PLUGIN] Starting universal search with input:', userInput);
            
            if (!userInput || userInput.length < 2) {
                console.log('🔍 [AHADEES-PLUGIN] Search input too short, showing warning');
                $('#search-status').text('Please enter at least 2 characters').removeClass('ks-ahadees-status-success ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-error');
                return;
            }
            
            $('#search-status').text('Searching...').removeClass('ks-ahadees-status-error ks-ahadees-status-success ks-ahadees-status-warning').addClass('ks-ahadees-status-info');
            showModalLoading();
            
            // Generate comprehensive search terms using transliteration engine
            var searchTerms = transliterationEngine.generateSearchTerms(userInput);
            console.log('🔍 [AHADEES-PLUGIN] Generated search terms:', searchTerms);
            
            // Create enhanced search criteria for backend
            var enhancedCriteria = {
                universalSearch: userInput,
                searchTerms: searchTerms,
                originalInput: userInput,
                arabicTerms: transliterationEngine.translateToArabic(userInput),
                // Fallback to legacy format for backward compatibility
                narrator: userInput,
                subject: userInput,
                searchText: userInput
            };
            
            console.log('🔍 [AHADEES-PLUGIN] Enhanced search criteria:', enhancedCriteria);
            
            try {
                var datacontext = getDatacontextService();
                console.log('🔍 [AHADEES-PLUGIN] Datacontext service obtained:', !!datacontext);
                
                if (datacontext && typeof datacontext.searchAhadees === 'function') {
                    console.log('🔍 [AHADEES-PLUGIN] Calling enhanced search API...');
                    
                    datacontext.searchAhadees(enhancedCriteria)
                        .then(function(response) {
                            console.log('🔍 [AHADEES-PLUGIN] Universal search API response:', response);
                            $('#search-status').text('Search completed').removeClass('ks-ahadees-status-error ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-success');
                            
                            var results = response.data || response;
                            console.log('🔍 [AHADEES-PLUGIN] Processed universal search results:', results);
                            
                            // If no results with enhanced search, try client-side filtering
                            if (!results || (Array.isArray(results) && results.length === 0) || 
                                (results.ahadeesList && results.ahadeesList.length === 0)) {
                                console.log('🔍 [AHADEES-PLUGIN] No results from API, attempting client-side filtering...');
                                attemptClientSideSearch(searchTerms, transliterationEngine);
                            } else {
                                displayModalResults(results);
                            }
                        })
                        .catch(function(error) {
                            console.error('❌ [AHADEES-PLUGIN] Universal search promise rejected:', error);
                            $('#search-status').text('Search failed, trying fallback...').removeClass('ks-ahadees-status-success ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-error');
                            
                            // Fallback to recent ahadees with client-side filtering
                            attemptClientSideSearch(searchTerms, transliterationEngine);
                        });
                } else {
                    var errorMsg = 'Could not access datacontext service for universal search.';
                    console.error('❌ [AHADEES-PLUGIN] ' + errorMsg);
                    $('#search-status').text('Service unavailable').removeClass('ks-ahadees-status-success ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-error');
                    displayModalError(errorMsg);
                }
            } catch (error) {
                console.error('❌ [AHADEES-PLUGIN] Unexpected error in performUniversalSearch:', error);
                $('#search-status').text('Unexpected error').removeClass('ks-ahadees-status-success ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-error');
                displayModalError('Universal search failed: ' + error.message);
            }
        }

        /**
         * Attempt client-side search as fallback
         */
        function attemptClientSideSearch(searchTerms, transliterationEngine) {
            console.log('🔍 [AHADEES-PLUGIN] Attempting client-side search with terms:', searchTerms);
            $('#search-status').text('Searching locally...').removeClass('ks-ahadees-status-error ks-ahadees-status-success ks-ahadees-status-info').addClass('ks-ahadees-status-warning');
            
            try {
                var datacontext = getDatacontextService();
                if (datacontext && typeof datacontext.getRecentAhadees === 'function') {
                    console.log('🔍 [AHADEES-PLUGIN] Loading recent ahadees for client-side filtering...');
                    
                    datacontext.getRecentAhadees(50) // Get more for better filtering
                        .then(function(response) {
                            console.log('🔍 [AHADEES-PLUGIN] Recent ahadees for filtering:', response);
                            var results = response.data || response;
                            
                            if (results && results.ahadeesList) {
                                var filteredResults = filterAhadeesClientSide(results.ahadeesList, searchTerms, transliterationEngine);
                                console.log('🔍 [AHADEES-PLUGIN] Client-side filtered results:', filteredResults);
                                
                                if (filteredResults.length > 0) {
                                    $('#search-status').text(filteredResults.length + ' results found').removeClass('ks-ahadees-status-error ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-success');
                                    displayModalResults({ ahadeesList: filteredResults });
                                } else {
                                    $('#search-status').text('No matches found').removeClass('ks-ahadees-status-success ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-error');
                                    displayNoResultsMessage(searchTerms);
                                }
                            } else {
                                $('#search-status').text('No data available').removeClass('ks-ahadees-status-success ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-error');
                                displayModalError('No ahadees data available for searching.');
                            }
                        })
                        .catch(function(error) {
                            console.error('❌ [AHADEES-PLUGIN] Client-side search fallback failed:', error);
                            $('#search-status').text('Search unavailable').removeClass('ks-ahadees-status-success ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-error');
                            displayModalError('Search functionality is currently unavailable.');
                        });
                } else {
                    $('#search-status').text('Search unavailable').css('color', '#dc3545');
                    displayModalError('Search service is not available.');
                }
            } catch (error) {
                console.error('❌ [AHADEES-PLUGIN] Client-side search error:', error);
                $('#search-status').text('Search error').css('color', '#dc3545');
                displayModalError('Client-side search failed: ' + error.message);
            }
        }

        /**
         * Filter ahadees array on client-side using search terms
         */
        function filterAhadeesClientSide(ahadeesArray, searchTerms, transliterationEngine) {
            console.log('🔍 [AHADEES-PLUGIN] Filtering', ahadeesArray.length, 'ahadees with terms:', searchTerms);
            
            if (!Array.isArray(ahadeesArray) || searchTerms.length === 0) {
                return [];
            }
            
            var filteredResults = ahadeesArray.filter(function(hadees) {
                if (!hadees) return false;
                
                // Prepare searchable text from all hadees fields
                var searchableText = [
                    hadees.narrator || '',
                    hadees.narratorName || '',
                    hadees.subject || '',
                    hadees.ahadeesEnglish || '',
                    hadees.ahadeesArabic || '',
                    hadees.reference || ''
                ].join(' ').toLowerCase();
                
                // Also include normalized Arabic text
                var normalizedArabic = transliterationEngine.normalizeArabic(hadees.ahadeesArabic || '').toLowerCase();
                if (normalizedArabic) {
                    searchableText += ' ' + normalizedArabic;
                }
                
                // Check if any search term matches
                return searchTerms.some(function(term) {
                    if (!term) return false;
                    
                    var normalizedTerm = term.toLowerCase();
                    
                    // Direct text search
                    if (searchableText.includes(normalizedTerm)) {
                        console.log('🔍 [AHADEES-PLUGIN] Match found for term "' + term + '" in hadees:', hadees.id || 'unknown');
                        return true;
                    }
                    
                    // Arabic term search (exact and normalized)
                    if (hadees.ahadeesArabic) {
                        var arabicText = hadees.ahadeesArabic.toLowerCase();
                        var normalizedArabicText = transliterationEngine.normalizeArabic(arabicText);
                        
                        if (arabicText.includes(normalizedTerm) || normalizedArabicText.includes(normalizedTerm)) {
                            console.log('🔍 [AHADEES-PLUGIN] Arabic match found for term "' + term + '"');
                            return true;
                        }
                    }
                    
                    return false;
                });
            });
            
            console.log('🔍 [AHADEES-PLUGIN] Client-side filtering complete:', filteredResults.length, 'matches found');
            return filteredResults;
        }

        /**
         * Display no results message with suggestions
         */
        function displayNoResultsMessage(searchTerms) {
            $('#fallback-ahadees-results').html(`
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 32px; margin-bottom: 15px; color: #ffc107;">🤷‍♂️</div>
                    <p style="font-size: 16px; margin-bottom: 15px;">No ahadees found for your search</p>
                    <div style="font-size: 14px; background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: left; max-width: 400px; margin: 0 auto;">
                        <strong>Search terms tried:</strong><br>
                        ${searchTerms.map(term => `• ${term}`).join('<br>')}
                        <br><br>
                        <strong>Try searching for:</strong><br>
                        • Common narrators: bukhari, muslim, ahmad<br>
                        • Topics: prayer, fasting, charity<br>
                        • Names: abdullah, muhammad, ali<br>
                        • English words: water, heart, knowledge
                    </div>
                    <button onclick="$('#universal-search-input').focus()" style="margin-top: 15px; background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Try Different Search</button>
                </div>
            `);
        }

        /**
         * Get Angular datacontext service using ng-app element injector
         */
        function getDatacontextService() {
            try {
                var ngApp = document.querySelector('[ng-app]') || document.querySelector('[data-ng-app]');
                if (ngApp) {
                    var injector = angular.element(ngApp).injector();
                    if (injector && injector.has('datacontext')) {
                        return injector.get('datacontext');
                    }
                }
                return null;
            } catch (error) {
                console.error('❌ [AHADEES-PLUGIN] Error getting datacontext service:', error);
                return null;
            }
        }

        /**
         * Load recent ahadees for display in modal
         */
        function loadRecentAhadees() {
            console.log('🔍 [AHADEES-PLUGIN] Loading recent ahadees...');
            showModalLoading();

            try {
                var datacontext = getDatacontextService();
                console.log('🔍 [AHADEES-PLUGIN] Datacontext service:', datacontext);
                console.log('🔍 [AHADEES-PLUGIN] getRecentAhadees function available:', !!(datacontext && typeof datacontext.getRecentAhadees === 'function'));

                if (datacontext && typeof datacontext.getRecentAhadees === 'function') {
                    console.log('🔍 [AHADEES-PLUGIN] Calling datacontext.getRecentAhadees(10)...');
                    datacontext.getRecentAhadees(10)
                        .then(function(response) {
                            console.log('🔍 [AHADEES-PLUGIN] Recent ahadees API response:', response);
                            var results = response.data || response;
                            console.log('🔍 [AHADEES-PLUGIN] Processed recent results:', results);
                            displayModalResults(results);
                        })
                        .catch(function(error) {
                            console.error('❌ [AHADEES-PLUGIN] Recent ahadees promise rejected:', error);
                            displayModalError('Failed to load recent ahadees: ' + (error.message || 'Unknown error'));
                        });
                } else {
                    var errorMsg = 'Could not access datacontext service for recent ahadees. Please ensure Angular is properly loaded.';
                    console.error('❌ [AHADEES-PLUGIN] ' + errorMsg);
                    displayModalError(errorMsg);
                }
            } catch (error) {
                console.error('❌ [AHADEES-PLUGIN] Unexpected error in loadRecentAhadees:', error);
                displayModalError('Failed to load recent ahadees: ' + error.message);
            }
        }

        /**
         * Show loading in modal
         */
        function showModalLoading() {
            $('#fallback-ahadees-results').html(`
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 32px; color: #007bff; animation: spin 1s linear infinite;">⏳</div>
                    <p style="margin-top: 10px; color: #666;">Searching ahadees...</p>
                </div>
            `);
        }

        /**
         * Display results in modal
         */
        function displayModalResults(results) {
            console.log('🔍 [AHADEES-PLUGIN] displayModalResults called with:', results);
            
            var $resultsContainer = $('#fallback-ahadees-results');
            
            if (!results) {
                console.log('🔍 [AHADEES-PLUGIN] No results - showing empty message');
                $resultsContainer.html(`
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <div style="font-size: 32px; margin-bottom: 15px; color: #ffc107;">ℹ️</div>
                        <p>No results returned from API</p>
                    </div>
                `);
                return;
            }
            
            // Handle case where results is not an array - extract the actual array
            var actualResults = null;
            if (Array.isArray(results)) {
                actualResults = results;
            } else if (results.ahadeesList && Array.isArray(results.ahadeesList)) {
                console.log('🔍 [AHADEES-PLUGIN] Using results.ahadeesList as array');
                actualResults = results.ahadeesList;
            } else if (results.data && Array.isArray(results.data)) {
                actualResults = results.data;
            } else if (results.items && Array.isArray(results.items)) {
                actualResults = results.items;
            } else if (results.results && Array.isArray(results.results)) {
                actualResults = results.results;
            } else {
                console.error('❌ [AHADEES-PLUGIN] Could not find array in results. Raw results:', results);
                $resultsContainer.html(`
                    <div style="text-align: center; padding: 40px; color: #d32f2f;">
                        <div style="font-size: 32px; margin-bottom: 15px;">⚠️</div>
                        <p>Unexpected API response format. Check console for details.</p>
                        <small style="font-family: monospace; background: #f5f5f5; padding: 5px; display: block; margin-top: 10px;">Type: ${typeof results}, IsArray: ${Array.isArray(results)}</small>
                    </div>
                `);
                return;
            }
            
            if (actualResults.length === 0) {
                console.log('🔍 [AHADEES-PLUGIN] Empty results array - showing no results message');
                $resultsContainer.html(`
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <div style="font-size: 32px; margin-bottom: 15px; color: #ffc107;">ℹ️</div>
                        <p>No ahadees found matching your criteria</p>
                    </div>
                `);
                return;
            }

            console.log('🔍 [AHADEES-PLUGIN] Processing ' + actualResults.length + ' results');
            
            if (actualResults.length > 0) {
                console.log('🔍 [AHADEES-PLUGIN] First result sample:', actualResults[0]);
            }
            
            var html = '';
            
            try {
                actualResults.forEach(function(hadees, index) {
                    if (!hadees) {
                        console.warn('⚠️ [AHADEES-PLUGIN] Skipping null/undefined hadees at index ' + index);
                        return;
                    }
                    
                    // Properly escape JSON for HTML attribute with comprehensive character handling
                    var escapedJson = JSON.stringify(hadees)
                        .replace(/\\/g, '\\\\')     // Escape backslashes first
                        .replace(/"/g, '&quot;')    // Escape quotes 
                        .replace(/'/g, '&#39;')     // Escape single quotes
                        .replace(/\n/g, '\\n')      // Escape newlines
                        .replace(/\r/g, '\\r')      // Escape carriage returns  
                        .replace(/\t/g, '\\t')      // Escape tabs
                        .replace(/\u0000-\u001f/g, function(match) { 
                            return '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4); 
                        }); // Escape control characters
                    
                    html += `
                        <div class="fallback-hadees-item ks-ahadees-result-item" data-ahadees='${escapedJson}'>
                            <div class="ks-ahadees-narrator-section">
                                <strong class="ks-ahadees-narrator-name">${hadees.narrator || hadees.narratorName || 'Unknown Narrator'}</strong>
                                ${hadees.subject ? `<span class="ks-ahadees-subject-text"> - ${hadees.subject}</span>` : ''}
                            </div>
                            <div class="ks-ahadees-arabic-section">
                                ${hadees.ahadeesArabic || ''}
                            </div>
                            <div class="ks-ahadees-english-section">
                                ${hadees.ahadeesEnglish || ''}
                            </div>
                            <div class="ks-ahadees-insert-prompt">
                                <small class="ks-ahadees-insert-text">Click to insert ✨</small>
                            </div>
                        </div>
                    `;
                });
                
                console.log('🔍 [AHADEES-PLUGIN] Generated HTML for ' + actualResults.length + ' hadees items');
                $resultsContainer.html(html);
                
                // Bind click events
                $('.fallback-hadees-item').click(function() {
                    // Get the raw attribute value and decode HTML entities before parsing JSON
                    var rawData = $(this).attr('data-ahadees');
                    
                    // Comprehensive JSON data cleaning and validation before parsing
                    var decodedData = rawData
                        .replace(/&quot;/g, '"')           // Decode HTML quotes
                        .replace(/&#39;/g, "'")            // Decode HTML single quotes  
                        .replace(/&amp;/g, '&')            // Decode HTML ampersands  
                        .replace(/&lt;/g, '<')             // Decode HTML less-than
                        .replace(/&gt;/g, '>')             // Decode HTML greater-than
                        .replace(/&nbsp;/g, ' ')           // Decode non-breaking spaces
                        .replace(/&#x([0-9A-Fa-f]+);/g, function(match, hex) {
                            return String.fromCharCode(parseInt(hex, 16));
                        })                                  // Decode hexadecimal HTML entities
                        .replace(/&#(\d+);/g, function(match, decimal) {
                            return String.fromCharCode(parseInt(decimal, 10));
                        })                                  // Decode decimal HTML entities
                        .replace(/\\\\n/g, '\\n')          // Fix double-escaped newlines first
                        .replace(/\\\\r/g, '\\r')          // Fix double-escaped carriage returns
                        .replace(/\\\\t/g, '\\t')          // Fix double-escaped tabs
                        .replace(/\\\\\\\\/g, '\\\\');     // Fix quadruple-escaped backslashes
                    
                    // Additional validation: Check for truncated JSON and attempt repair
                    var bracketCount = (decodedData.match(/\{/g) || []).length - (decodedData.match(/\}/g) || []).length;
                    if (bracketCount > 0) {
                        console.warn('🔧 [ALADEES-PLUGIN] Detected truncated JSON, attempting repair...');
                        // Attempt to close the JSON if it's missing closing quote and bracket
                        if (!decodedData.endsWith('}')) {
                            // Look for the last complete field and close it
                            var lastQuoteIndex = decodedData.lastIndexOf('"');
                            if (lastQuoteIndex > -1 && !decodedData.substring(lastQuoteIndex + 1).includes('"')) {
                                decodedData += '"'; // Close the truncated string field
                            }
                            decodedData += '}'; // Close the JSON object
                            console.log('🔧 [ALADEES-PLUGIN] Repaired JSON:', decodedData);
                        }
                    }
                    
                    // Preventive validation before parsing
                    if (!decodedData || decodedData.trim() === '') {
                        console.error('❌ [ALADEES-PLUGIN] Empty or null data after decoding');
                        alert('Error: Hadees data is empty. Please refresh the page and try again.');
                        return;
                    }
                    
                    if (!decodedData.startsWith('{') || !decodedData.endsWith('}')) {
                        console.error('❌ [ALADEES-PLUGIN] Data does not appear to be valid JSON format');
                        console.error('❌ [ALADEES-PLUGIN] Starts with:', decodedData.substring(0, 10));
                        console.error('❌ [ALADEES-PLUGIN] Ends with:', decodedData.substring(decodedData.length - 10));
                        alert('Error: Hadees data format is invalid. Please contact support.');
                        return;
                    }
                    
                    var ahadeesData;
                    
                    try {
                        ahadeesData = JSON.parse(decodedData);
                        console.log('✅ [ALADEES-PLUGIN] Hadees item clicked - successfully parsed data:', ahadeesData);
                    } catch (error) {
                        console.error('❌ [ALADEES-PLUGIN] Failed to parse aladees data:', error);
                        console.error('❌ [ALADEES-PLUGIN] Raw data length:', rawData?.length || 0);
                        console.error('❌ [ALADEES-PLUGIN] Raw data (truncated):', rawData?.substring(0, 200) + '...');
                        console.error('❌ [ALADEES-PLUGIN] Processed data length:', decodedData?.length || 0);
                        console.error('❌ [ALADEES-PLUGIN] Processed data (truncated):', decodedData?.substring(0, 200) + '...');
                        console.error('❌ [ALADEES-PLUGIN] JSON parsing error:', error.message);
                        
                        // Enhanced error information for debugging
                        var errorDetails = {
                            errorType: error.name,
                            errorMessage: error.message,
                            rawDataLength: rawData?.length || 0,
                            processedDataLength: decodedData?.length || 0,
                            hasRawData: !!rawData,
                            hasProcessedData: !!decodedData
                        };
                        
                        // Fallback: Try to extract at least the hadees ID for error reporting
                        var idMatch = rawData?.match(/"ahadeesId":(\d+)/) || rawData?.match(/"id":(\d+)/);
                        if (idMatch) {
                            errorDetails.extractedId = idMatch[1];
                            console.error('❌ [ALADEES-PLUGIN] Failed hadees ID:', idMatch[1]);
                            alert('Error loading hadees (ID: ' + idMatch[1] + '). Please check the console for detailed error information.');
                        } else {
                            console.error('❌ [ALADEES-PLUGIN] Could not extract hadees ID from data');
                            alert('Error loading hadees data. Please check the console for detailed error information.');
                        }
                        
                        console.error('❌ [ALADEES-PLUGIN] Complete error details:', errorDetails);
                        return;
                    }
                    
                    insertAhadees(ahadeesData);
                    
                    // Remove modal and restore focus
                    $('#ahadees-fallback-modal').remove();
                    $(document).off('keydown.ahadees-modal');
                    
                    // Restore focus to the Froala editor after insertion
                    setTimeout(function() {
                        if (editor && editor.$el) {
                            editor.events.focus();
                        }
                    }, 200);
                });
                
                console.log('🔍 [AHADEES-PLUGIN] Successfully displayed ' + actualResults.length + ' results');
                
            } catch (error) {
                console.error('❌ [AHADEES-PLUGIN] Error in forEach loop:', error);
                console.error('❌ [AHADEES-PLUGIN] Error stack:', error.stack);
                $resultsContainer.html(`
                    <div style="text-align: center; padding: 40px; color: #d32f2f;">
                        <div style="font-size: 32px; margin-bottom: 15px;">⚠️</div>
                        <p>Error processing results: ${error.message}</p>
                    </div>
                `);
            }
        }

        /**
         * Display error in modal
         */
        function displayModalError(message) {
            $('#fallback-ahadees-results').html(`
                <div style="text-align: center; padding: 40px; color: #d32f2f;">
                    <div style="font-size: 32px; margin-bottom: 15px;">⚠️</div>
                    <p>${message}</p>
                </div>
            `);
        }

        // Return public methods
        return {
            showPopup: showPopup
        };
    };

    // Define the ahadees button icon
    $.FE.DefineIcon('ahadees', { NAME: 'comments' });

    $.FE.RegisterCommand('ahadees', {
        title: '🕌 Universal Ahadees Search (Alt+A) - Search by narrator, topic, or transliteration (e.g., abd → عبد)',
        focus: false,
        undo: false,
        refreshAfterCallback: false,
        callback: function () {
            if (this.ahadees && typeof this.ahadees.showPopup === 'function') {
                this.ahadees.showPopup();
            } else {
                console.error('Ahadees showPopup method not available!');
            }
        },
        plugin: 'ahadees'
    });

    // Use Alt+A for ahadees - A for Ahadees, Alt modifier avoids browser conflicts
    $.FE.RegisterShortcut($.FE.KEYCODE.A, 'ahadees', false, 'A', true, false);
}));
