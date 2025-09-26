(function () {
    'use strict';

    angular
        .module('app')
        .factory('etymologyService', etymologyService);

    etymologyService.$inject = ['$q', 'datacontext', 'common'];

    function etymologyService($q, datacontext, common) {
        var service = {
            searchEtymology: searchEtymology,
            getEtymologyById: getEtymologyById,
            getEtymologyDerivatives: getEtymologyDerivatives,
            getSampleData: getSampleData
        };

        return service;

        function searchEtymology(searchTerm) {
            console.log('🔍 [ETYMOLOGY-SERVICE] Starting search for:', searchTerm);
            
            if (!searchTerm || searchTerm.length < 2) {
                return $q.resolve([]);
            }

            // Build search criteria for KQUR_DEV database
            var searchCriteria = {
                SearchTerm: searchTerm,
                PageNumber: 1,
                PageSize: 50,
                SortBy: "ArabicWord",
                SortDirection: "ASC", 
                IncludeDerivatives: true,
                ActiveOnly: true
            };

            console.log('🔍 [ETYMOLOGY-SERVICE] Calling KQUR_DEV with criteria:', searchCriteria);

            return datacontext.searchEtymology(searchCriteria)
                .then(function(response) {
                    console.log('✅ [ETYMOLOGY-SERVICE] KQUR_DEV API response:', response);
                    
                    // Handle different response structures
                    var results = response.Results || response.results || response.data || response || [];
                    
                    if (!Array.isArray(results)) {
                        console.warn('⚠️ [ETYMOLOGY-SERVICE] Unexpected response format, using sample data');
                        return getSampleSearchResults(searchTerm);
                    }

                    // DEBUG: Log raw API data to see what we're getting
                    console.log('🔍 [ETYMOLOGY-SERVICE] Raw API results before transformation:', results);
                    if (results.length > 0) {
                        console.log('🔍 [ETYMOLOGY-SERVICE] First result raw data:', results[0]);
                        console.log('🔍 [ETYMOLOGY-SERVICE] Arabic fields check:', {
                            ArabicWord: results[0].ArabicWord,
                            arabicWord: results[0].arabicWord,
                            Word: results[0].Word,
                            word: results[0].word
                        });
                    }

                    // Transform API data to standardized format
                    var transformedResults = results.map(transformApiResult);
                    
                    // DEBUG: Log transformed data to see what we're producing
                    console.log('✅ [ETYMOLOGY-SERVICE] Transformed results:', transformedResults.length + ' items');
                    if (transformedResults.length > 0) {
                        console.log('🔍 [ETYMOLOGY-SERVICE] First transformed result:', transformedResults[0]);
                    }
                    
                    return transformedResults;
                })
                .catch(function(error) {
                    console.error('❌ [ETYMOLOGY-SERVICE] KQUR_DEV API error:', error);
                    console.log('🔄 [ETYMOLOGY-SERVICE] Falling back to sample data');
                    
                    // Return filtered sample data as fallback
                    return getSampleSearchResults(searchTerm);
                });
        }

        function getEtymologyById(id) {
            console.log('🔍 [ETYMOLOGY-SERVICE] Getting etymology by ID:', id);
            
            return datacontext.getEtymologyDerivatives(id)
                .then(function(response) {
                    console.log('✅ [ETYMOLOGY-SERVICE] Etymology details:', response);
                    return transformApiResult(response);
                })
                .catch(function(error) {
                    console.error('❌ [ETYMOLOGY-SERVICE] Error getting etymology details:', error);
                    return null;
                });
        }

        function transformApiResult(item) {
            if (!item) return null;
            
            // Transform single etymology record to match BOTH template expectations
            // Map C# DTO properties (RootArabic, RootMeaning, etc.) to JavaScript properties
            var rootArabic = item.RootArabic || item.rootArabic || item.Root || item.root || item.RootLetters || item.rootLetters || '';
            var rootMeaning = item.RootMeaning || item.rootMeaning || item.RootEnglish || item.rootEnglish || item.EnglishMeaning || item.meaning || '';
            
            return {
                // For adminEtymology.html (admin page)
                rootId: item.RootId || item.rootId || item.Id || item.id || Math.random().toString(36).substr(2, 9),
                rootArabic: rootArabic,
                rootMeaning: rootMeaning,
                wordFamily: item.LinguisticFamily || item.linguisticFamily || item.WordFamily || item.wordFamily || 'general',
                derivativesCount: item.DerivativeCount || item.derivativeCount || item.DerivativesCount || item.derivativesCount || 0,
                derivatives: transformDerivatives(item.Derivatives || item.derivatives || []),
                
                // For etymologyManagementPanel.html (floating panel) and insertEtymology function
                arabicWord: rootArabic,
                englishMeaning: rootMeaning,
                root: rootArabic,
                transliteration: item.RootTransliteration || item.rootTransliteration || item.Transliteration || item.transliteration || ''
            };
        }

        function transformDerivatives(derivatives) {
            if (!Array.isArray(derivatives)) return [];
            
            return derivatives.map(function(d) {
                var arabicWord = d.DerivativeArabic || d.derivativeArabic || d.ArabicWord || d.Word || d.word || '';
                var meaning = d.DerivativeMeaning || d.derivativeMeaning || d.DerivativeEnglish || d.derivativeEnglish || d.EnglishMeaning || d.Meaning || d.meaning || '';
                
                return {
                    derivativeId: d.DerivativeId || d.derivativeId || d.Id || d.id || Math.random().toString(36).substr(2, 9),
                    arabicWord: arabicWord,
                    word: arabicWord, // Add for backward compatibility with templates using 'word'
                    transliteration: d.DerivativeTransliteration || d.derivativeTransliteration || d.Transliteration || d.transliteration || '',
                    englishMeaning: meaning,
                    meaning: meaning // Provide 'meaning' for backward compatibility with the HTML template
                };
            });
        }

        function getSampleSearchResults(searchTerm) {
            var sampleData = getSampleData();
            var query = searchTerm.toLowerCase();
            
            return sampleData.filter(function(item) {
                return item.rootArabic.indexOf(searchTerm) !== -1 ||
                       item.rootMeaning.toLowerCase().indexOf(query) !== -1 ||
                       (item.derivatives && item.derivatives.some(function(d) {
                           return d.arabicWord.indexOf(searchTerm) !== -1 ||
                                  d.meaning.toLowerCase().indexOf(query) !== -1 ||
                                  d.transliteration.toLowerCase().indexOf(query) !== -1;
                       }));
            });
        }

        function getSampleData() {
            return [
                {
                    rootId: 'sample_1',
                    rootArabic: "و-ل-ه",
                    rootMeaning: "To be distracted, confused, to long for",
                    wordFamily: "emotions",
                    derivativesCount: 6,
                    derivatives: [
                        { derivativeId: 'der1', arabicWord: "وَلَه", transliteration: "walaha", meaning: "To be distracted, to love passionately" },
                        { derivativeId: 'der2', arabicWord: "تَوَلَّهَ", transliteration: "tawallaha", meaning: "To be distraught with love" },
                        { derivativeId: 'der3', arabicWord: "مَوْلَه", transliteration: "mawlaha", meaning: "Place of distraction" },
                        { derivativeId: 'der4', arabicWord: "وَالَهَ", transliteration: "wālaha", meaning: "To feel affection for" },
                        { derivativeId: 'der5', arabicWord: "وَلْهَان", transliteration: "walhān", meaning: "Distracted, confused" },
                        { derivativeId: 'der6', arabicWord: "لِهَان", transliteration: "lihān", meaning: "A state of profound distraction" }
                    ]
                },
                {
                    rootId: 'sample_2',
                    rootArabic: "ا-ل-ه",
                    rootMeaning: "To be worshiped, to be distracted, to love passionately",
                    wordFamily: "religious",
                    derivativesCount: 6,
                    derivatives: [
                        { derivativeId: 'der7', arabicWord: "اللّٰه", transliteration: "Allāh", meaning: "The God" },
                        { derivativeId: 'der8', arabicWord: "إِلَٰه", transliteration: "ilāh", meaning: "God, deity" },
                        { derivativeId: 'der9', arabicWord: "أَلِهَ", transliteration: "aliha", meaning: "To worship" },
                        { derivativeId: 'der10', arabicWord: "تَأَلَّهَ", transliteration: "ta'allaha", meaning: "To deify oneself" },
                        { derivativeId: 'der11', arabicWord: "تَأَلُّه", transliteration: "ta'alluh", meaning: "The act of deifying or worshiping something" },
                        { derivativeId: 'der12', arabicWord: "أَلَّهَ", transliteration: "allaha", meaning: "To worship, to adore, to make divine" }
                    ]
                },
                {
                    rootId: 'sample_3',
                    rootArabic: "س-ل-م",
                    rootMeaning: "To be safe, secure, to be sound",
                    wordFamily: "peace",
                    derivativesCount: 4,
                    derivatives: [
                        { derivativeId: 'der13', arabicWord: "إِسْلَام", transliteration: "Islām", meaning: "Submission to God" },
                        { derivativeId: 'der14', arabicWord: "سَلَام", transliteration: "salām", meaning: "Peace" },
                        { derivativeId: 'der15', arabicWord: "سَلِمَ", transliteration: "salima", meaning: "To be safe" },
                        { derivativeId: 'der16', arabicWord: "سِلْم", transliteration: "silm", meaning: "Peace, reconciliation" }
                    ]
                },
                {
                    rootId: 'sample_4',
                    rootArabic: "ف-ر-ح",
                    rootMeaning: "Happiness, joy, delight",
                    wordFamily: "emotions",
                    derivativesCount: 4,
                    derivatives: [
                        { derivativeId: 'der17', arabicWord: "فَرِحَ", transliteration: "fariḥa", meaning: "To be happy, to rejoice with great pleasure" },
                        { derivativeId: 'der18', arabicWord: "أَفْرَح", transliteration: "afraḥa", meaning: "To make happy, to bring joy to someone" },
                        { derivativeId: 'der19', arabicWord: "فَرَح", transliteration: "faraḥ", meaning: "Joy, happiness, a state of delight and pleasure" },
                        { derivativeId: 'der20', arabicWord: "فَرِح", transliteration: "fariḥ", meaning: "Happy, joyful, full of delight" }
                    ]
                },
                {
                    rootId: 'sample_5',
                    rootArabic: "ك-ت-ب",
                    rootMeaning: "To write, to inscribe, to prescribe",
                    wordFamily: "knowledge",
                    derivativesCount: 4,
                    derivatives: [
                        { derivativeId: 'der21', arabicWord: "كِتَاب", transliteration: "kitāb", meaning: "Book" },
                        { derivativeId: 'der22', arabicWord: "كَتَبَ", transliteration: "kataba", meaning: "He wrote" },
                        { derivativeId: 'der23', arabicWord: "مَكْتَب", transliteration: "maktab", meaning: "Office, desk" },
                        { derivativeId: 'der24', arabicWord: "كِتَابَة", transliteration: "kitābah", meaning: "Writing" }
                    ]
                }
            ];
        }

        function getEtymologyDerivatives(rootId) {
            console.log('🔍 [ETYMOLOGY-SERVICE] Getting derivatives for root:', rootId);
            return datacontext.getEtymologyDerivatives(rootId);
        }
    }
})();
