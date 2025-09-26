/**
 * Ahadees Search Module - Search engine & transliteration
 * Part of the decomposed Froala Ahadees Plugin
 */
(function() {
    'use strict';

    // Use deferred registration system
    if (typeof window.registerFroalaPlugin === 'function') {
        window.registerFroalaPlugin(function() {
            angular.module("app").factory("froalaAhadeesSearch", [
                "froalaModalService",
                "froalaDialogService",
                "froalaBasePlugin",
                "froalaUtilities",
                "froalaAhadeesFormatter",
                froalaAhadeesSearch
            ]);
            console.log('✅ [FROALA-AHADEES-SEARCH] Successfully registered with Angular app module');
        }, 'froalaAhadeesSearch');
    } else {
        console.error('❌ [FROALA-AHADEES-SEARCH] Deferred registration system not available');
    }

    function froalaAhadeesSearch(
        modalService,
        dialogService,
        basePlugin,
        utilities,
        ahadeesFormatter
    ) {
        var service = {
            createTransliterationEngine: createTransliterationEngine,
            performUniversalSearch: performUniversalSearch,
            loadRecentAhadees: loadRecentAhadees
        };

        return service;

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
                    console.log('🔍 [AHADEES-SEARCH] Generating search terms for:', userInput);

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

                    console.log('🔍 [AHADEES-SEARCH] Generated search terms:', searchTerms);
                    return searchTerms;
                }
            };
        }

        /**
         * Perform universal search with transliteration support
         */
        function performUniversalSearch(transliterationEngine, editor, insertionMarker, markerPlaced, markerCallback) {
            var userInput = $('#universal-search-input').val().trim();
            console.log('🔍 [AHADEES-SEARCH] Starting universal search with input:', userInput);

            if (!userInput || userInput.length < 2) {
                console.log('🔍 [AHADEES-SEARCH] Search input too short, showing warning');
                $('#search-status').text('Please enter at least 2 characters').removeClass('ks-ahadees-status-success ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-error');
                return;
            }

            $('#search-status').text('Searching...').removeClass('ks-ahadees-status-error ks-ahadees-status-success ks-ahadees-status-warning').addClass('ks-ahadees-status-info');
            showModalLoading();

            // Generate comprehensive search terms using transliteration engine
            var searchTerms = transliterationEngine.generateSearchTerms(userInput);
            console.log('🔍 [AHADEES-SEARCH] Generated search terms:', searchTerms);

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

            console.log('🔍 [AHADEES-SEARCH] Enhanced search criteria:', enhancedCriteria);

            try {
                var datacontext = getDatacontextService();
                console.log('🔍 [AHADEES-SEARCH] Datacontext service obtained:', !!datacontext);

                if (datacontext && typeof datacontext.searchAhadees === 'function') {
                    console.log('🔍 [AHADEES-SEARCH] Calling enhanced search API...');

                    datacontext.searchAhadees(enhancedCriteria)
                        .then(function(response) {
                            console.log('🔍 [AHADEES-SEARCH] Universal search API response:', response);
                            $('#search-status').text('Search completed').removeClass('ks-ahadees-status-error ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-success');

                            var results = response.data || response;
                            console.log('🔍 [AHADEES-SEARCH] Processed universal search results:', results);

                            // If no results with enhanced search, try client-side filtering
                            if (!results || (Array.isArray(results) && results.length === 0) ||
                                (results.ahadeesList && results.ahadeesList.length === 0)) {
                                console.log('🔍 [AHADEES-SEARCH] No results from API, attempting client-side filtering...');
                                attemptClientSideSearch(searchTerms, transliterationEngine);
                            } else {
                                ahadeesFormatter.displayModalResults(results, editor, insertionMarker, markerPlaced, markerCallback);
                            }
                        })
                        .catch(function(error) {
                            console.error('❌ [AHADEES-SEARCH] Universal search promise rejected:', error);
                            $('#search-status').text('Search failed, trying fallback...').removeClass('ks-ahadees-status-success ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-error');

                            // Fallback to recent ahadees with client-side filtering
                            attemptClientSideSearch(searchTerms, transliterationEngine);
                        });
                } else {
                    var errorMsg = 'Could not access datacontext service for universal search.';
                    console.error('❌ [AHADEES-SEARCH] ' + errorMsg);
                    $('#search-status').text('Service unavailable').removeClass('ks-ahadees-status-success ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-error');
                    ahadeesFormatter.displayModalError(errorMsg);
                }
            } catch (error) {
                console.error('❌ [AHADEES-SEARCH] Unexpected error in performUniversalSearch:', error);
                $('#search-status').text('Unexpected error').removeClass('ks-ahadees-status-success ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-error');
                ahadeesFormatter.displayModalError('Universal search failed: ' + error.message);
            }
        }

        /**
         * Attempt client-side search as fallback
         */
        function attemptClientSideSearch(searchTerms, transliterationEngine) {
            console.log('🔍 [AHADEES-SEARCH] Attempting client-side search with terms:', searchTerms);
            $('#search-status').text('Searching locally...').removeClass('ks-ahadees-status-error ks-ahadees-status-success ks-ahadees-status-info').addClass('ks-ahadees-status-warning');

            try {
                var datacontext = getDatacontextService();
                if (datacontext && typeof datacontext.getRecentAhadees === 'function') {
                    console.log('🔍 [AHADEES-SEARCH] Loading recent ahadees for client-side filtering...');

                    datacontext.getRecentAhadees(50) // Get more for better filtering
                        .then(function(response) {
                            console.log('🔍 [AHADEES-SEARCH] Recent ahadees for filtering:', response);
                            var results = response.data || response;

                            if (results && results.ahadeesList) {
                                var filteredResults = filterAhadeesClientSide(results.ahadeesList, searchTerms, transliterationEngine);
                                console.log('🔍 [AHADEES-SEARCH] Client-side filtered results:', filteredResults);

                                if (filteredResults.length > 0) {
                                    $('#search-status').text(filteredResults.length + ' results found').removeClass('ks-ahadees-status-error ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-success');
                                    ahadeesFormatter.displayModalResults({ ahadeesList: filteredResults });
                                } else {
                                    $('#search-status').text('No matches found').removeClass('ks-ahadees-status-success ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-error');
                                    ahadeesFormatter.displayNoResultsMessage(searchTerms);
                                }
                            } else {
                                $('#search-status').text('No data available').removeClass('ks-ahadees-status-success ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-error');
                                ahadeesFormatter.displayModalError('No ahadees data available for searching.');
                            }
                        })
                        .catch(function(error) {
                            console.error('❌ [AHADEES-SEARCH] Client-side search fallback failed:', error);
                            $('#search-status').text('Search unavailable').removeClass('ks-ahadees-status-success ks-ahadees-status-info ks-ahadees-status-warning').addClass('ks-ahadees-status-error');
                            ahadeesFormatter.displayModalError('Search functionality is currently unavailable.');
                        });
                } else {
                    $('#search-status').text('Search unavailable').css('color', '#dc3545');
                    ahadeesFormatter.displayModalError('Search service is not available.');
                }
            } catch (error) {
                console.error('❌ [AHADEES-SEARCH] Client-side search error:', error);
                $('#search-status').text('Search error').css('color', '#dc3545');
                ahadeesFormatter.displayModalError('Client-side search failed: ' + error.message);
            }
        }

        /**
         * Filter ahadees array on client-side using search terms
         */
        function filterAhadeesClientSide(ahadeesArray, searchTerms, transliterationEngine) {
            console.log('🔍 [AHADEES-SEARCH] Filtering', ahadeesArray.length, 'ahadees with terms:', searchTerms);

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
                        console.log('🔍 [AHADEES-SEARCH] Match found for term "' + term + '" in hadees:', hadees.id || 'unknown');
                        return true;
                    }

                    // Arabic term search (exact and normalized)
                    if (hadees.ahadeesArabic) {
                        var arabicText = hadees.ahadeesArabic.toLowerCase();
                        var normalizedArabicText = transliterationEngine.normalizeArabic(arabicText);

                        if (arabicText.includes(normalizedTerm) || normalizedArabicText.includes(normalizedTerm)) {
                            console.log('🔍 [AHADEES-SEARCH] Arabic match found for term "' + term + '"');
                            return true;
                        }
                    }

                    return false;
                });
            });

            console.log('🔍 [AHADEES-SEARCH] Client-side filtering complete:', filteredResults.length, 'matches found');
            return filteredResults;
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
                console.error('❌ [AHADEES-SEARCH] Error getting datacontext service:', error);
                return null;
            }
        }

        /**
         * Load recent ahadees for display in modal
         */
        function loadRecentAhadees() {
            console.log('🔍 [AHADEES-SEARCH] Loading recent ahadees...');
            showModalLoading();

            try {
                var datacontext = getDatacontextService();
                console.log('🔍 [AHADEES-SEARCH] Datacontext service:', datacontext);
                console.log('🔍 [AHADEES-SEARCH] getRecentAhadees function available:', !!(datacontext && typeof datacontext.getRecentAhadees === 'function'));

                if (datacontext && typeof datacontext.getRecentAhadees === 'function') {
                    console.log('🔍 [AHADEES-SEARCH] Calling datacontext.getRecentAhadees(10)...');
                    datacontext.getRecentAhadees(10)
                        .then(function(response) {
                            console.log('🔍 [AHADEES-SEARCH] Recent ahadees API response:', response);
                            var results = response.data || response;
                            console.log('🔍 [AHADEES-SEARCH] Processed recent results:', results);
                            ahadeesFormatter.displayModalResults(results);
                        })
                        .catch(function(error) {
                            console.error('❌ [AHADEES-SEARCH] Recent ahadees promise rejected:', error);
                            ahadeesFormatter.displayModalError('Failed to load recent ahadees: ' + (error.message || 'Unknown error'));
                        });
                } else {
                    var errorMsg = 'Could not access datacontext service for recent ahadees. Please ensure Angular is properly loaded.';
                    console.error('❌ [AHADEES-SEARCH] ' + errorMsg);
                    ahadeesFormatter.displayModalError(errorMsg);
                }
            } catch (error) {
                console.error('❌ [AHADEES-SEARCH] Unexpected error in loadRecentAhadees:', error);
                ahadeesFormatter.displayModalError('Failed to load recent ahadees: ' + error.message);
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
    }
})();
