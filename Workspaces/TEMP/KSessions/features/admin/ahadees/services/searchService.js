/**
 * Search Service - Advanced Arabic Text Search with Diacritical Mark Tolerance
 * Enhanced search capabilities for Islamic narrations with real-time filtering
 * 
 * Features:
 * - Multi-criteria search with iterative filtering
 * - Arabic text normalization for diacritical mark tolerance
 * - Real-time search suggestions and analytics
 * - Caching strategy for performance optimization
 */

(function () {
    'use strict';

    angular
        .module('app')
        .factory('searchService', searchService);

    searchService.$inject = ['$http', '$q', 'common', 'config', 'logger'];

    function searchService($http, $q, common, config, logger) {
        
        // Initialize logging context
        logger.info('Search Service: Initializing enhanced Arabic text search service');
        console.log('searchService: Service initialization started at', new Date().toISOString());

        var service = {
            // Core Search Operations
            searchAhadees: searchAhadees,
            searchWithFilters: searchWithFilters,
            fuzzySearchArabic: fuzzySearchArabic,
            
            // Specialized Search Methods
            searchByNarrator: searchByNarrator,
            searchBySubject: searchBySubject,
            searchBySource: searchBySource,
            
            // Search Enhancement Features
            getSuggestions: getSuggestions,
            getPopularSearches: getPopularSearches,
            saveSearchHistory: saveSearchHistory,
            
            // Search Analytics
            logSearchAnalytics: logSearchAnalytics,
            getSearchStats: getSearchStats,
            
            // Utility Functions
            normalizeArabicQuery: normalizeArabicQuery,
            buildSearchCriteria: buildSearchCriteria
        };

        // API endpoints configuration
        var apiBase = config.remoteServiceName + 'api/';
        var apiEndpoints = {
            search: apiBase + 'ahadees/search',
            iterativeSearch: apiBase + 'ahadees/search/iterative',
            fuzzySearch: apiBase + 'ahadees/search/fuzzy',
            suggestions: apiBase + 'search/suggestions',
            popular: apiBase + 'search/popular',
            analytics: apiBase + 'search/analytics',
            stats: apiBase + 'search/stats'
        };

        // Search cache for performance optimization
        var searchCache = {};
        var cacheTimeout = 5 * 60 * 1000; // 5 minutes

        console.log('searchService: API endpoints configured for enhanced search');
        logger.debug('Search Service: API endpoints configured for KQUR_DEV integration');

        return service;

        function searchAhadees(searchCriteria) {
            if (!searchCriteria) {
                logger.error('Search Service: searchAhadees called with no criteria');
                console.error('searchService: searchAhadees - No search criteria provided');
                return $q.reject(new Error('Search criteria is required'));
            }

            console.log('searchService: searchAhadees() - Starting search:', searchCriteria.query);
            logger.info('Search Service: Starting ahadees search - Query: "' + 
                (searchCriteria.query || 'No query') + '", Type: ' + (searchCriteria.searchType || 'combined'));

            // Check cache first
            var cacheKey = generateCacheKey(searchCriteria);
            var cachedResult = getCachedResult(cacheKey);
            if (cachedResult) {
                logger.debug('Search Service: Returning cached result for query');
                console.log('searchService: Returning cached result');
                return $q.resolve(cachedResult);
            }

            // Normalize Arabic query if present
            if (searchCriteria.query && searchCriteria.searchType !== 'english') {
                searchCriteria.normalizedQuery = normalizeArabicQuery(searchCriteria.query);
                logger.debug('Search Service: Arabic query normalized: ' + searchCriteria.normalizedQuery);
                console.log('searchService: Arabic query normalized:', searchCriteria.normalizedQuery);
            }

            var startTime = Date.now();

            return $http.post(apiEndpoints.search, searchCriteria)
                .then(function(response) {
                    var searchTime = Date.now() - startTime;
                    var results = response.data || {};
                    
                    // Cache the result
                    setCachedResult(cacheKey, response, searchTime);
                    
                    // Log search analytics
                    logSearchAnalytics({
                        query: searchCriteria.query,
                        searchType: searchCriteria.searchType,
                        resultCount: results.totalCount || 0,
                        searchTime: searchTime,
                        filters: searchCriteria.filters
                    });
                    
                    logger.info('Search Service: Search completed - ' + 
                        (results.results ? results.results.length : 0) + ' results in ' + searchTime + 'ms');
                    console.log('searchService: Search completed:', {
                        query: searchCriteria.query,
                        resultCount: results.results ? results.results.length : 0,
                        totalCount: results.totalCount,
                        searchTime: searchTime + 'ms'
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Search Service: Search failed for query: ' + searchCriteria.query, error);
                    console.error('searchService: searchAhadees failed:', error);
                    
                    var errorMessage = 'Search failed: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function searchWithFilters(searchCriteria) {
            if (!searchCriteria || !searchCriteria.filters) {
                logger.error('Search Service: searchWithFilters called with no filters');
                console.error('searchService: searchWithFilters - No filters provided');
                return $q.reject(new Error('Search filters are required'));
            }

            console.log('searchService: searchWithFilters() - Starting filtered search');
            logger.info('Search Service: Starting iterative search with filters');
            logger.debug('Search Service: Filter criteria', searchCriteria.filters);

            var startTime = Date.now();

            return $http.post(apiEndpoints.iterativeSearch, searchCriteria)
                .then(function(response) {
                    var searchTime = Date.now() - startTime;
                    var results = response.data || {};
                    
                    logger.info('Search Service: Filtered search completed - ' + 
                        (results.results ? results.results.length : 0) + ' results in ' + searchTime + 'ms');
                    console.log('searchService: Filtered search completed:', {
                        resultCount: results.results ? results.results.length : 0,
                        totalCount: results.totalCount,
                        searchTime: searchTime + 'ms',
                        activeFilters: Object.keys(searchCriteria.filters).filter(key => searchCriteria.filters[key]).length
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Search Service: Filtered search failed', error);
                    console.error('searchService: searchWithFilters failed:', error);
                    
                    var errorMessage = 'Filtered search failed: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function fuzzySearchArabic(arabicQuery) {
            if (!arabicQuery || arabicQuery.trim().length === 0) {
                logger.error('Search Service: fuzzySearchArabic called with empty query');
                console.error('searchService: fuzzySearchArabic - Empty query provided');
                return $q.reject(new Error('Arabic query is required for fuzzy search'));
            }

            console.log('searchService: fuzzySearchArabic() - Starting fuzzy search:', arabicQuery);
            logger.info('Search Service: Starting fuzzy Arabic search - Query: "' + arabicQuery + '"');

            // Normalize the Arabic query
            var normalizedQuery = normalizeArabicQuery(arabicQuery);
            logger.debug('Search Service: Fuzzy search - normalized query: ' + normalizedQuery);
            console.log('searchService: Fuzzy search normalized query:', normalizedQuery);

            var requestData = {
                originalQuery: arabicQuery,
                normalizedQuery: normalizedQuery,
                fuzzyThreshold: 0.7, // 70% similarity threshold
                maxResults: 100
            };

            var startTime = Date.now();

            return $http.post(apiEndpoints.fuzzySearch, requestData)
                .then(function(response) {
                    var searchTime = Date.now() - startTime;
                    var results = response.data.results || [];
                    
                    logger.info('Search Service: Fuzzy Arabic search completed - ' + 
                        results.length + ' results in ' + searchTime + 'ms');
                    console.log('searchService: Fuzzy Arabic search completed:', {
                        query: arabicQuery,
                        normalizedQuery: normalizedQuery,
                        resultCount: results.length,
                        searchTime: searchTime + 'ms'
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Search Service: Fuzzy Arabic search failed', error);
                    console.error('searchService: fuzzySearchArabic failed:', error);
                    
                    var errorMessage = 'Fuzzy Arabic search failed: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function searchByNarrator(narratorId, additionalFilters) {
            console.log('searchService: searchByNarrator() - Searching by narrator ID:', narratorId);
            logger.info('Search Service: Searching by narrator ID: ' + narratorId);

            var searchCriteria = {
                searchType: 'narrator',
                filters: angular.extend({
                    narratorId: narratorId
                }, additionalFilters || {}),
                pagination: {
                    page: 1,
                    pageSize: 50
                }
            };

            return searchWithFilters(searchCriteria);
        }

        function searchBySubject(subject, additionalFilters) {
            console.log('searchService: searchBySubject() - Searching by subject:', subject);
            logger.info('Search Service: Searching by subject: ' + subject);

            var searchCriteria = {
                searchType: 'subject',
                query: subject,
                filters: additionalFilters || {},
                pagination: {
                    page: 1,
                    pageSize: 50
                }
            };

            return searchAhadees(searchCriteria);
        }

        function searchBySource(source, additionalFilters) {
            console.log('searchService: searchBySource() - Searching by source:', source);
            logger.info('Search Service: Searching by source: ' + source);

            var searchCriteria = {
                searchType: 'source',
                filters: angular.extend({
                    source: source
                }, additionalFilters || {}),
                pagination: {
                    page: 1,
                    pageSize: 50
                }
            };

            return searchWithFilters(searchCriteria);
        }

        function getSuggestions(query, maxSuggestions) {
            if (!query || query.length < 2) {
                logger.debug('Search Service: getSuggestions - query too short');
                console.log('searchService: getSuggestions - query too short');
                return $q.resolve({ data: [] });
            }

            maxSuggestions = maxSuggestions || 10;

            console.log('searchService: getSuggestions() - Getting suggestions for:', query);
            logger.debug('Search Service: Getting search suggestions for query: ' + query);

            var requestData = {
                query: query,
                maxSuggestions: maxSuggestions,
                includeArabic: true,
                includeEnglish: true
            };

            return $http.post(apiEndpoints.suggestions, requestData)
                .then(function(response) {
                    var suggestions = response.data || [];
                    
                    logger.debug('Search Service: Retrieved ' + suggestions.length + ' suggestions');
                    console.log('searchService: Retrieved suggestions:', {
                        query: query,
                        suggestionCount: suggestions.length
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Search Service: Failed to get suggestions', error);
                    console.error('searchService: getSuggestions failed:', error);
                    
                    // Return empty suggestions on error
                    return { data: [] };
                });
        }

        function getPopularSearches(count) {
            count = count || 20;

            console.log('searchService: getPopularSearches() - Getting', count, 'popular searches');
            logger.debug('Search Service: Fetching ' + count + ' popular searches');

            var url = apiEndpoints.popular + '?count=' + count;

            return $http.get(url)
                .then(function(response) {
                    var popularSearches = response.data || [];
                    
                    logger.debug('Search Service: Retrieved ' + popularSearches.length + ' popular searches');
                    console.log('searchService: Retrieved popular searches:', {
                        count: popularSearches.length
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Search Service: Failed to get popular searches', error);
                    console.error('searchService: getPopularSearches failed:', error);
                    
                    return { data: [] };
                });
        }

        function saveSearchHistory(searchData) {
            console.log('searchService: saveSearchHistory() - Saving search to history');
            logger.debug('Search Service: Saving search to history: ' + searchData.query);

            // Save to local storage
            try {
                var searchHistory = JSON.parse(localStorage.getItem('ahadeesSearchHistory') || '[]');
                
                // Add new search to beginning of array
                searchHistory.unshift({
                    query: searchData.query,
                    searchType: searchData.searchType,
                    timestamp: new Date().toISOString(),
                    resultCount: searchData.resultCount
                });
                
                // Keep only last 50 searches
                searchHistory = searchHistory.slice(0, 50);
                
                localStorage.setItem('ahadeesSearchHistory', JSON.stringify(searchHistory));
                
                logger.debug('Search Service: Search history saved locally');
                console.log('searchService: Search history saved locally');
                
            } catch (error) {
                logger.error('Search Service: Failed to save search history locally', error);
                console.error('searchService: Failed to save search history:', error);
            }

            return $q.resolve();
        }

        function logSearchAnalytics(analyticsData) {
            console.log('searchService: logSearchAnalytics() - Logging search analytics');
            logger.debug('Search Service: Logging search analytics for query: ' + analyticsData.query);

            var requestData = {
                searchTerm: analyticsData.query,
                searchType: analyticsData.searchType,
                resultCount: analyticsData.resultCount,
                searchTime: analyticsData.searchTime,
                filterCriteria: JSON.stringify(analyticsData.filters || {}),
                userId: getCurrentUserId(),
                sessionId: getSessionId()
            };

            return $http.post(apiEndpoints.analytics, requestData)
                .then(function(response) {
                    logger.debug('Search Service: Analytics logged successfully');
                    console.log('searchService: Analytics logged successfully');
                    return response;
                })
                .catch(function(error) {
                    // Don't fail the search if analytics logging fails
                    logger.error('Search Service: Failed to log analytics (non-critical)', error);
                    console.error('searchService: Failed to log analytics (non-critical):', error);
                });
        }

        function getSearchStats() {
            console.log('searchService: getSearchStats() - Fetching search statistics');
            logger.debug('Search Service: Fetching search statistics');

            return $http.get(apiEndpoints.stats)
                .then(function(response) {
                    logger.debug('Search Service: Search statistics retrieved');
                    console.log('searchService: Search statistics retrieved');
                    return response;
                })
                .catch(function(error) {
                    logger.error('Search Service: Failed to get search statistics', error);
                    console.error('searchService: getSearchStats failed:', error);
                    
                    var errorMessage = 'Failed to load search statistics: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function normalizeArabicQuery(arabicText) {
            if (!arabicText) {
                return '';
            }

            console.log('searchService: normalizeArabicQuery() - Normalizing Arabic text');
            logger.debug('Search Service: Normalizing Arabic query for enhanced matching');

            var normalized = arabicText
                // Remove all diacritical marks
                .replace(/[ًٌٍَُِّْ]/g, '')    // Tanween, Fatha, Kasra, Damma, Sukun, Shadda
                .replace(/[ٰ]/g, '')             // Alif Superscript
                
                // Normalize Alif variations
                .replace(/[آأإ]/g, 'ا')        // Alif with Madda, Hamza above, Hamza below to regular Alif
                
                // Normalize Yeh variations  
                .replace(/[ىئ]/g, 'ي')         // Alif Maksura, Yeh with Hamza to regular Yeh
                
                // Normalize Teh variations
                .replace(/[ۃة]/g, 'ه')         // Teh Marbuta variations to Heh
                
                // Normalize Waw variations
                .replace(/[ؤ]/g, 'و')          // Waw with Hamza to regular Waw
                
                // Remove standalone Hamza
                .replace(/[ء]/g, '')           // Remove Hamza
                
                // Normalize Arabic-Indic digits to Western digits
                .replace(/[٠]/g, '0')
                .replace(/[١]/g, '1') 
                .replace(/[٢]/g, '2')
                .replace(/[٣]/g, '3')
                .replace(/[٤]/g, '4')
                .replace(/[٥]/g, '5')
                .replace(/[٦]/g, '6')
                .replace(/[٧]/g, '7')
                .replace(/[٨]/g, '8')
                .replace(/[٩]/g, '9')
                
                // Normalize punctuation
                .replace(/[۔]/g, '.')          // Urdu full stop to period
                .replace(/[،]/g, ',')          // Arabic comma to regular comma
                
                // Normalize whitespace
                .replace(/\s+/g, ' ')          // Multiple spaces to single space
                .trim();                       // Remove leading/trailing spaces

            logger.debug('Search Service: Arabic normalization completed - Original length: ' + 
                arabicText.length + ', Normalized length: ' + normalized.length);
            console.log('searchService: Arabic text normalized:', {
                original: arabicText,
                normalized: normalized,
                originalLength: arabicText.length,
                normalizedLength: normalized.length
            });

            return normalized;
        }

        function buildSearchCriteria(options) {
            console.log('searchService: buildSearchCriteria() - Building search criteria');
            logger.debug('Search Service: Building search criteria from options');

            var criteria = {
                query: options.query || '',
                searchType: options.searchType || 'combined',
                filters: options.filters || {},
                pagination: {
                    page: options.page || 1,
                    pageSize: options.pageSize || 50
                },
                sorting: {
                    field: options.sortField || 'SearchScore',
                    direction: options.sortDirection || 'desc'
                }
            };

            // Add normalized query for Arabic searches
            if (criteria.query && (criteria.searchType === 'arabic' || criteria.searchType === 'combined')) {
                criteria.normalizedQuery = normalizeArabicQuery(criteria.query);
            }

            logger.debug('Search Service: Search criteria built successfully');
            console.log('searchService: Search criteria built:', criteria);

            return criteria;
        }

        // Cache management functions
        function generateCacheKey(searchCriteria) {
            var keyData = {
                query: searchCriteria.query,
                type: searchCriteria.searchType,
                filters: searchCriteria.filters,
                page: searchCriteria.pagination ? searchCriteria.pagination.page : 1,
                pageSize: searchCriteria.pagination ? searchCriteria.pagination.pageSize : 50
            };
            
            return 'search_' + btoa(JSON.stringify(keyData)).replace(/[+/=]/g, '');
        }

        function getCachedResult(cacheKey) {
            var cached = searchCache[cacheKey];
            if (cached && (Date.now() - cached.timestamp) < cacheTimeout) {
                logger.debug('Search Service: Cache hit for key: ' + cacheKey);
                console.log('searchService: Cache hit for search');
                return cached.data;
            }
            
            if (cached) {
                delete searchCache[cacheKey];
                logger.debug('Search Service: Cache expired for key: ' + cacheKey);
                console.log('searchService: Cache expired for search');
            }
            
            return null;
        }

        function setCachedResult(cacheKey, response, searchTime) {
            searchCache[cacheKey] = {
                data: response,
                timestamp: Date.now(),
                searchTime: searchTime
            };
            
            logger.debug('Search Service: Result cached for key: ' + cacheKey);
            console.log('searchService: Result cached for future use');
        }

        // Utility functions
        function getCurrentUserId() {
            // This should be implemented based on your authentication system
            return 'admin-user'; // Placeholder
        }

        function getSessionId() {
            // Generate or retrieve session ID
            var sessionId = sessionStorage.getItem('ahadeesSessionId');
            if (!sessionId) {
                sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem('ahadeesSessionId', sessionId);
            }
            return sessionId;
        }

        function getErrorMessage(error) {
            if (error.data && error.data.message) {
                return error.data.message;
            } else if (error.data && typeof error.data === 'string') {
                return error.data;
            } else if (error.message) {
                return error.message;
            } else if (error.status) {
                return 'Server error (HTTP ' + error.status + ')';
            } else {
                return 'Unknown error occurred';
            }
        }
    }
})();
