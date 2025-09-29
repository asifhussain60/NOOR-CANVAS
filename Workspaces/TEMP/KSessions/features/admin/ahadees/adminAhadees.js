/**
 * Admin Ahadees Controller - Enhanced Narration Management System
 * Replaces existing adminNarration.js with modern, scalable architecture
 * 
 * Features:
 * - Advanced Arabic text search with diacritical mark tolerance
 * - Iterative multi-criteria filtering
 * - Enhanced token system (A|{ahadeesId})
 * - Real-time search results with caching
 * - Comprehensive logging for troubleshooting
 */

(function () {
    'use strict';

    angular
        .module('app')
        .controller('adminAhadeesCtl', adminAhadeesController);

    adminAhadeesController.$inject = [
        '$scope', '$timeout', '$q', 'common', 'config', 
        'ahadeesService', 'searchService', 'tokenService', 
        'filterStateService', 'logger'
    ];

    function adminAhadeesController($scope, $timeout, $q, common, config, 
        ahadeesService, searchService, tokenService, filterStateService, logger) {
        
        var vm = this;
        
        // Initialize logging context
        logger.info('Admin Ahadees Controller: Initializing enhanced narration management system');
        console.log('adminAhadeesCtl: Starting initialization at', new Date().toISOString());

        // Controller properties
        vm.title = 'Admin Ahadees - Enhanced Islamic Narrations Management';
        vm.isLoading = false;
        vm.isSearching = false;
        vm.hasErrors = false;
        vm.errorMessage = '';

        // Data collections
        vm.ahadeesList = [];
        vm.searchResults = [];
        vm.narrators = [];
        vm.sources = [];
        vm.subjects = [];
        vm.classifications = ['Sahih', 'Hasan', 'Daif', 'Weak', 'Fabricated'];

        // Search and filter state
        vm.searchQuery = '';
        vm.searchType = 'combined'; // 'arabic', 'english', 'combined', 'narrator', 'subject'
        vm.filterState = filterStateService.getFilterState();
        vm.resultStats = {
            totalCount: 0,
            searchTime: 0,
            hasMoreResults: false
        };

        // Pagination
        vm.currentPage = 1;
        vm.pageSize = 50;
        vm.totalPages = 1;

        // Current editing state
        vm.currentAhadees = null;
        vm.isEditing = false;
        vm.isNewAhadees = false;
        vm.showEditModal = false;

        // Token system
        vm.generatedToken = '';
        vm.tokenCopied = false;

        // Controller methods
        vm.activate = activate;
        vm.search = search;
        vm.clearSearch = clearSearch;
        vm.loadAhadees = loadAhadees;
        vm.editAhadees = editAhadees;
        vm.createNewAhadees = createNewAhadees;
        vm.saveAhadees = saveAhadees;
        vm.deleteAhadees = deleteAhadees;
        vm.cancelEdit = cancelEdit;
        vm.generateToken = generateToken;
        vm.copyTokenToClipboard = copyTokenToClipboard;
        vm.addFilter = addFilter;
        vm.removeFilter = removeFilter;
        vm.clearAllFilters = clearAllFilters;
        vm.exportAhadees = exportAhadees;
        vm.importAhadees = importAhadees;
        vm.refreshData = refreshData;

        // Initialize controller
        activate();

        function activate() {
            console.log('adminAhadeesCtl: activate() - Beginning controller activation');
            logger.info('Admin Ahadees Controller: Starting activation sequence');
            
            vm.isLoading = true;
            
            var promises = [
                loadInitialData(),
                loadReferenceData(),
                setupFilterListeners()
            ];

            return $q.all(promises)
                .then(function() {
                    vm.isLoading = false;
                    logger.info('Admin Ahadees Controller: Activation completed successfully');
                    console.log('adminAhadeesCtl: Activation completed successfully');
                })
                .catch(function(error) {
                    vm.isLoading = false;
                    vm.hasErrors = true;
                    vm.errorMessage = 'Failed to initialize Admin Ahadees system';
                    logger.error('Admin Ahadees Controller: Activation failed', error);
                    console.error('adminAhadeesCtl: Activation failed:', error);
                    common.showToast('Error initializing system: ' + (error.message || error), 'error');
                });
        }

        function loadInitialData() {
            console.log('adminAhadeesCtl: loadInitialData() - Loading recent ahadees');
            logger.debug('Admin Ahadees Controller: Loading initial ahadees data');
            
            return ahadeesService.getRecentAhadees(vm.pageSize)
                .then(function(response) {
                    vm.ahadeesList = response.data || [];
                    vm.resultStats.totalCount = response.totalCount || 0;
                    
                    logger.info('Admin Ahadees Controller: Loaded ' + vm.ahadeesList.length + ' initial ahadees records');
                    console.log('adminAhadeesCtl: Loaded', vm.ahadeesList.length, 'initial records');
                    
                    return vm.ahadeesList;
                })
                .catch(function(error) {
                    logger.error('Admin Ahadees Controller: Failed to load initial data', error);
                    console.error('adminAhadeesCtl: loadInitialData failed:', error);
                    throw error;
                });
        }

        function loadReferenceData() {
            console.log('adminAhadeesCtl: loadReferenceData() - Loading narrators, sources, subjects');
            logger.debug('Admin Ahadees Controller: Loading reference data (narrators, sources, subjects)');
            
            var promises = [
                ahadeesService.getNarrators(),
                ahadeesService.getSources(),
                ahadeesService.getSubjects()
            ];

            return $q.all(promises)
                .then(function(responses) {
                    vm.narrators = responses[0].data || [];
                    vm.sources = responses[1].data || [];
                    vm.subjects = responses[2].data || [];
                    
                    logger.info('Admin Ahadees Controller: Reference data loaded - ' + 
                        vm.narrators.length + ' narrators, ' + 
                        vm.sources.length + ' sources, ' + 
                        vm.subjects.length + ' subjects');
                    console.log('adminAhadeesCtl: Reference data loaded:', {
                        narrators: vm.narrators.length,
                        sources: vm.sources.length,
                        subjects: vm.subjects.length
                    });
                })
                .catch(function(error) {
                    logger.error('Admin Ahadees Controller: Failed to load reference data', error);
                    console.error('adminAhadeesCtl: loadReferenceData failed:', error);
                    throw error;
                });
        }

        function setupFilterListeners() {
            console.log('adminAhadeesCtl: setupFilterListeners() - Setting up real-time filter updates');
            logger.debug('Admin Ahadees Controller: Setting up filter event listeners');
            
            // Listen for filter updates
            $scope.$on('filters:updated', function(event, filterState) {
                logger.debug('Admin Ahadees Controller: Filter state updated, triggering search');
                console.log('adminAhadeesCtl: Filter updated, triggering search:', filterState);
                performIterativeSearch();
            });

            // Watch for search query changes with debounce
            $scope.$watch('vm.searchQuery', function(newValue, oldValue) {
                if (newValue !== oldValue && newValue && newValue.length >= 2) {
                    logger.debug('Admin Ahadees Controller: Search query changed to: ' + newValue);
                    console.log('adminAhadeesCtl: Search query changed to:', newValue);
                    debouncedSearch();
                }
            });

            return Promise.resolve();
        }

        // Debounced search function
        var debouncedSearch = common.debounce(function() {
            search();
        }, 500);

        function search(resetPagination) {
            if (resetPagination !== false) {
                vm.currentPage = 1;
            }
            
            console.log('adminAhadeesCtl: search() - Starting search with query:', vm.searchQuery);
            logger.info('Admin Ahadees Controller: Starting search - Query: "' + vm.searchQuery + '", Type: ' + vm.searchType);
            
            if (!vm.searchQuery || vm.searchQuery.length < 2) {
                logger.debug('Admin Ahadees Controller: Search query too short, loading initial data');
                console.log('adminAhadeesCtl: Search query too short, loading initial data');
                return loadInitialData();
            }

            return performSearch();
        }

        function performSearch() {
            vm.isSearching = true;
            var startTime = Date.now();
            
            console.log('adminAhadeesCtl: performSearch() - Executing search request');
            logger.debug('Admin Ahadees Controller: Performing search request');

            var searchCriteria = {
                query: vm.searchQuery,
                searchType: vm.searchType,
                filters: filterStateService.getFilterCombination(),
                pagination: {
                    page: vm.currentPage,
                    pageSize: vm.pageSize
                },
                sorting: {
                    field: 'SearchScore',
                    direction: 'desc'
                }
            };

            logger.debug('Admin Ahadees Controller: Search criteria', searchCriteria);
            console.log('adminAhadeesCtl: Search criteria:', searchCriteria);

            return searchService.searchAhadees(searchCriteria)
                .then(function(response) {
                    var searchTime = Date.now() - startTime;
                    
                    vm.searchResults = response.data.results || [];
                    vm.ahadeesList = vm.searchResults;
                    vm.resultStats = {
                        totalCount: response.data.totalCount || 0,
                        searchTime: searchTime,
                        hasMoreResults: response.data.hasMoreResults || false
                    };
                    
                    // Update pagination
                    vm.totalPages = Math.ceil(vm.resultStats.totalCount / vm.pageSize);
                    
                    logger.info('Admin Ahadees Controller: Search completed - ' + 
                        vm.searchResults.length + ' results in ' + searchTime + 'ms');
                    console.log('adminAhadeesCtl: Search completed:', {
                        resultCount: vm.searchResults.length,
                        totalCount: vm.resultStats.totalCount,
                        searchTime: searchTime + 'ms'
                    });
                    
                    vm.isSearching = false;
                    return response;
                })
                .catch(function(error) {
                    vm.isSearching = false;
                    logger.error('Admin Ahadees Controller: Search failed', error);
                    console.error('adminAhadeesCtl: Search failed:', error);
                    common.showToast('Search failed: ' + (error.message || error), 'error');
                    throw error;
                });
        }

        function performIterativeSearch() {
            console.log('adminAhadeesCtl: performIterativeSearch() - Performing real-time filtered search');
            logger.debug('Admin Ahadees Controller: Performing iterative search with active filters');
            
            vm.isSearching = true;
            var startTime = Date.now();

            var searchCriteria = {
                filters: filterStateService.getFilterCombination(),
                pagination: {
                    page: 1,
                    pageSize: vm.pageSize
                },
                sorting: {
                    field: 'SearchScore',
                    direction: 'desc'
                }
            };

            return searchService.searchWithFilters(searchCriteria)
                .then(function(response) {
                    var searchTime = Date.now() - startTime;
                    
                    vm.searchResults = response.data.results || [];
                    vm.ahadeesList = vm.searchResults;
                    vm.resultStats = response.data.stats || {};
                    
                    // Update filter counts for UI
                    updateFilterCounts(response.data.filterCounts);
                    
                    logger.info('Admin Ahadees Controller: Iterative search completed - ' + 
                        vm.searchResults.length + ' results in ' + searchTime + 'ms');
                    console.log('adminAhadeesCtl: Iterative search completed:', {
                        resultCount: vm.searchResults.length,
                        searchTime: searchTime + 'ms',
                        activeFilters: Object.keys(filterStateService.getFilterCombination()).length
                    });
                    
                    vm.isSearching = false;
                })
                .catch(function(error) {
                    vm.isSearching = false;
                    logger.error('Admin Ahadees Controller: Iterative search failed', error);
                    console.error('adminAhadeesCtl: Iterative search failed:', error);
                    common.showToast('Filter search failed: ' + (error.message || error), 'error');
                });
        }

        function updateFilterCounts(filterCounts) {
            if (!filterCounts) return;
            
            console.log('adminAhadeesCtl: updateFilterCounts() - Updating available filter options');
            logger.debug('Admin Ahadees Controller: Updating filter counts for UI');
            
            vm.availableNarrators = filterCounts.narrators || [];
            vm.availableSources = filterCounts.sources || [];
            vm.availableSubjects = filterCounts.subjects || [];
            vm.availableClassifications = filterCounts.classifications || [];
        }

        function clearSearch() {
            console.log('adminAhadeesCtl: clearSearch() - Clearing search and filters');
            logger.info('Admin Ahadees Controller: Clearing search query and all filters');
            
            vm.searchQuery = '';
            vm.searchType = 'combined';
            filterStateService.clearAllFilters();
            vm.currentPage = 1;
            
            return loadInitialData();
        }

        function loadAhadees(page) {
            if (page) {
                vm.currentPage = page;
            }
            
            console.log('adminAhadeesCtl: loadAhadees() - Loading page', vm.currentPage);
            logger.debug('Admin Ahadees Controller: Loading ahadees page ' + vm.currentPage);
            
            if (vm.searchQuery && vm.searchQuery.length >= 2) {
                return search(false);
            } else {
                return loadInitialData();
            }
        }

        function editAhadees(ahadees) {
            console.log('adminAhadeesCtl: editAhadees() - Editing ahadees ID:', ahadees.ahadeesId);
            logger.info('Admin Ahadees Controller: Opening edit mode for ahadees ID: ' + ahadees.ahadeesId);
            
            vm.currentAhadees = angular.copy(ahadees);
            vm.isEditing = true;
            vm.isNewAhadees = false;
            vm.showEditModal = true;
            vm.generatedToken = tokenService.generateToken(ahadees.ahadeesId);
            
            logger.debug('Admin Ahadees Controller: Edit modal opened for ahadees: ' + ahadees.subject);
        }

        function createNewAhadees() {
            console.log('adminAhadeesCtl: createNewAhadees() - Creating new ahadees entry');
            logger.info('Admin Ahadees Controller: Creating new ahadees entry');
            
            vm.currentAhadees = {
                ahadeesId: 0,
                ahadeesArabic: '',
                ahadeesEnglish: '',
                narratorId: null,
                subject: '',
                source: '',
                reference: '',
                classification: 'Sahih',
                isActive: true
            };
            vm.isEditing = false;
            vm.isNewAhadees = true;
            vm.showEditModal = true;
            vm.generatedToken = '';
            
            logger.debug('Admin Ahadees Controller: New ahadees form initialized');
        }

        function saveAhadees() {
            if (!vm.currentAhadees) {
                logger.error('Admin Ahadees Controller: Save attempted with no current ahadees');
                console.error('adminAhadeesCtl: Save attempted with no current ahadees');
                return;
            }
            
            console.log('adminAhadeesCtl: saveAhadees() - Saving ahadees:', vm.currentAhadees.subject);
            logger.info('Admin Ahadees Controller: Saving ahadees - ' + 
                (vm.isNewAhadees ? 'CREATE' : 'UPDATE') + ' - Subject: ' + vm.currentAhadees.subject);
            
            vm.isLoading = true;
            
            var savePromise = vm.isNewAhadees ? 
                ahadeesService.createAhadees(vm.currentAhadees) :
                ahadeesService.updateAhadees(vm.currentAhadees);

            return savePromise
                .then(function(response) {
                    var savedAhadees = response.data;
                    
                    if (vm.isNewAhadees) {
                        vm.ahadeesList.unshift(savedAhadees);
                        vm.generatedToken = tokenService.generateToken(savedAhadees.ahadeesId);
                        logger.info('Admin Ahadees Controller: New ahadees created with ID: ' + savedAhadees.ahadeesId);
                        console.log('adminAhadeesCtl: New ahadees created with ID:', savedAhadees.ahadeesId);
                    } else {
                        var index = vm.ahadeesList.findIndex(function(h) { return h.ahadeesId === savedAhadees.ahadeesId; });
                        if (index !== -1) {
                            vm.ahadeesList[index] = savedAhadees;
                        }
                        logger.info('Admin Ahadees Controller: Ahadees updated - ID: ' + savedAhadees.ahadeesId);
                        console.log('adminAhadeesCtl: Ahadees updated - ID:', savedAhadees.ahadeesId);
                    }
                    
                    vm.showEditModal = false;
                    vm.currentAhadees = null;
                    vm.isLoading = false;
                    
                    common.showToast(vm.isNewAhadees ? 'New ahadees created successfully' : 'Ahadees updated successfully', 'success');
                    
                    return savedAhadees;
                })
                .catch(function(error) {
                    vm.isLoading = false;
                    logger.error('Admin Ahadees Controller: Save failed', error);
                    console.error('adminAhadeesCtl: Save failed:', error);
                    common.showToast('Save failed: ' + (error.message || error), 'error');
                    throw error;
                });
        }

        function deleteAhadees(ahadees) {
            console.log('adminAhadeesCtl: deleteAhadees() - Deleting ahadees ID:', ahadees.ahadeesId);
            logger.info('Admin Ahadees Controller: Delete request for ahadees ID: ' + ahadees.ahadeesId);
            
            if (!confirm('Are you sure you want to delete this ahadees? This action cannot be undone.')) {
                logger.debug('Admin Ahadees Controller: Delete cancelled by user');
                console.log('adminAhadeesCtl: Delete cancelled by user');
                return;
            }

            vm.isLoading = true;
            
            return ahadeesService.deleteAhadees(ahadees.ahadeesId)
                .then(function() {
                    var index = vm.ahadeesList.findIndex(function(h) { return h.ahadeesId === ahadees.ahadeesId; });
                    if (index !== -1) {
                        vm.ahadeesList.splice(index, 1);
                    }
                    
                    vm.isLoading = false;
                    logger.info('Admin Ahadees Controller: Ahadees deleted successfully - ID: ' + ahadees.ahadeesId);
                    console.log('adminAhadeesCtl: Ahadees deleted successfully - ID:', ahadees.ahadeesId);
                    common.showToast('Ahadees deleted successfully', 'success');
                })
                .catch(function(error) {
                    vm.isLoading = false;
                    logger.error('Admin Ahadees Controller: Delete failed', error);
                    console.error('adminAhadeesCtl: Delete failed:', error);
                    common.showToast('Delete failed: ' + (error.message || error), 'error');
                    throw error;
                });
        }

        function cancelEdit() {
            console.log('adminAhadeesCtl: cancelEdit() - Cancelling edit operation');
            logger.debug('Admin Ahadees Controller: Edit operation cancelled');
            
            vm.showEditModal = false;
            vm.currentAhadees = null;
            vm.isEditing = false;
            vm.isNewAhadees = false;
            vm.generatedToken = '';
        }

        function generateToken(ahadeesId) {
            console.log('adminAhadeesCtl: generateToken() - Generating token for ID:', ahadeesId);
            logger.debug('Admin Ahadees Controller: Generating token for ahadees ID: ' + ahadeesId);
            
            vm.generatedToken = tokenService.generateToken(ahadeesId);
            vm.tokenCopied = false;
            
            logger.debug('Admin Ahadees Controller: Token generated: ' + vm.generatedToken);
            console.log('adminAhadeesCtl: Token generated:', vm.generatedToken);
            
            return vm.generatedToken;
        }

        function copyTokenToClipboard(token) {
            console.log('adminAhadeesCtl: copyTokenToClipboard() - Copying token:', token);
            logger.debug('Admin Ahadees Controller: Copying token to clipboard: ' + token);
            
            return tokenService.copyToClipboard(token)
                .then(function() {
                    vm.tokenCopied = true;
                    logger.info('Admin Ahadees Controller: Token copied to clipboard successfully');
                    console.log('adminAhadeesCtl: Token copied to clipboard successfully');
                    common.showToast('Token copied to clipboard!', 'success');
                    
                    // Reset copied state after 3 seconds
                    $timeout(function() {
                        vm.tokenCopied = false;
                    }, 3000);
                })
                .catch(function(error) {
                    logger.error('Admin Ahadees Controller: Failed to copy token to clipboard', error);
                    console.error('adminAhadeesCtl: Failed to copy token:', error);
                    common.showToast('Failed to copy token', 'error');
                });
        }

        function addFilter(filterType, filterValue, operator) {
            console.log('adminAhadeesCtl: addFilter() - Adding filter:', filterType, filterValue);
            logger.debug('Admin Ahadees Controller: Adding filter - Type: ' + filterType + ', Value: ' + filterValue);
            
            if (!filterValue) {
                logger.debug('Admin Ahadees Controller: Filter value is empty, skipping');
                return;
            }
            
            // Normalize Arabic input for better matching
            if (filterType === 'arabicText') {
                filterValue = normalizeArabicInput(filterValue);
                logger.debug('Admin Ahadees Controller: Arabic filter value normalized: ' + filterValue);
            }
            
            filterStateService.addFilter(filterType, filterValue, operator || 'contains');
        }

        function removeFilter(filterId) {
            console.log('adminAhadeesCtl: removeFilter() - Removing filter ID:', filterId);
            logger.debug('Admin Ahadees Controller: Removing filter ID: ' + filterId);
            
            filterStateService.removeFilter(filterId);
        }

        function clearAllFilters() {
            console.log('adminAhadeesCtl: clearAllFilters() - Clearing all active filters');
            logger.info('Admin Ahadees Controller: Clearing all active filters');
            
            filterStateService.clearAllFilters();
            
            // Reload initial data if no search query
            if (!vm.searchQuery || vm.searchQuery.length < 2) {
                return loadInitialData();
            }
        }

        function exportAhadees() {
            console.log('adminAhadeesCtl: exportAhadees() - Starting export operation');
            logger.info('Admin Ahadees Controller: Starting ahadees export operation');
            
            vm.isLoading = true;
            
            return ahadeesService.exportAhadees()
                .then(function(response) {
                    vm.isLoading = false;
                    logger.info('Admin Ahadees Controller: Export completed successfully');
                    console.log('adminAhadeesCtl: Export completed successfully');
                    common.showToast('Export completed successfully', 'success');
                    
                    // Trigger download
                    var blob = new Blob([response.data], { type: 'application/json' });
                    var url = window.URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = 'ahadees-export-' + new Date().toISOString().split('T')[0] + '.json';
                    a.click();
                    window.URL.revokeObjectURL(url);
                })
                .catch(function(error) {
                    vm.isLoading = false;
                    logger.error('Admin Ahadees Controller: Export failed', error);
                    console.error('adminAhadeesCtl: Export failed:', error);
                    common.showToast('Export failed: ' + (error.message || error), 'error');
                });
        }

        function importAhadees(fileData) {
            console.log('adminAhadeesCtl: importAhadees() - Starting import operation');
            logger.info('Admin Ahadees Controller: Starting ahadees import operation');
            
            vm.isLoading = true;
            
            return ahadeesService.importAhadees(fileData)
                .then(function(response) {
                    vm.isLoading = false;
                    var importStats = response.data;
                    
                    logger.info('Admin Ahadees Controller: Import completed - ' + 
                        importStats.imported + ' imported, ' + 
                        importStats.errors + ' errors');
                    console.log('adminAhadeesCtl: Import completed:', importStats);
                    
                    common.showToast('Import completed: ' + importStats.imported + ' records imported', 'success');
                    
                    // Refresh data
                    return refreshData();
                })
                .catch(function(error) {
                    vm.isLoading = false;
                    logger.error('Admin Ahadees Controller: Import failed', error);
                    console.error('adminAhadeesCtl: Import failed:', error);
                    common.showToast('Import failed: ' + (error.message || error), 'error');
                });
        }

        function refreshData() {
            console.log('adminAhadeesCtl: refreshData() - Refreshing all data');
            logger.info('Admin Ahadees Controller: Refreshing all data');
            
            vm.currentPage = 1;
            vm.searchQuery = '';
            filterStateService.clearAllFilters();
            
            return $q.all([
                loadInitialData(),
                loadReferenceData()
            ]);
        }

        // Utility function for Arabic text normalization
        function normalizeArabicInput(text) {
            if (!text) return '';
            
            return text
                .replace(/[ًٌٍَُِّْ]/g, '')    // Remove diacritical marks
                .replace(/آ|أ|إ/g, 'ا')        // Normalize Alif variations
                .replace(/ى/g, 'ي')             // Alif Maksura to Yeh
                .replace(/ة/g, 'ه')             // Teh Marbuta to Heh
                .replace(/ؤ/g, 'و')             // Waw Hamza to Waw
                .replace(/ئ/g, 'ي')             // Yeh Hamza to Yeh
                .replace(/\s+/g, ' ')           // Normalize whitespace
                .trim();
        }

        // Cleanup on controller destroy
        $scope.$on('$destroy', function() {
            console.log('adminAhadeesCtl: Controller destroyed, cleaning up');
            logger.debug('Admin Ahadees Controller: Controller destroyed, performing cleanup');
        });
    }
})();
