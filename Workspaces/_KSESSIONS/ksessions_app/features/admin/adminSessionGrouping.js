(function () {
    'use strict';

    console.log('🔧 [SESSION-GROUPING] adminSessionGrouping.js file loading...');

    angular
        .module('app')
        .controller('adminSessionGroupingCtl', adminSessionGroupingCtl);

    console.log('🔧 [SESSION-GROUPING] Controller registered: adminSessionGroupingCtl');

    adminSessionGroupingCtl.$inject = ['$scope', '$http', 'common', 'datacontext', 'contentManager'];

    function adminSessionGroupingCtl($scope, $http, common, datacontext, contentManager) {
        var vm = this;
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn('adminSessionGroupingCtl');
        var logSuccess = getLogFn('adminSessionGroupingCtl', "success");
        var logError = getLogFn('adminSessionGroupingCtl', "error");
        var logWarning = getLogFn('adminSessionGroupingCtl', "warning");

        // DEBUG LOGGING - TO BE REMOVED AFTER TESTING
        console.log('🚀 [SESSION-GROUPING] Controller initialization started', {
            timestamp: new Date().toISOString(),
            controller: 'adminSessionGroupingCtl',
            dependencies: ['$scope', 'common', 'datacontext', 'contentManager']
        });

        // Properties
        vm.title = 'Session Grouping';
        
        // DEBUG: Expose debug function to window for testing
        window.debugSessionGrouping = function() {
            console.log('🐛 [DEBUG] Session Grouping State:', {
                vmAlbums: vm.albums,
                vmAlbumsLength: vm.albums ? vm.albums.length : 'undefined',
                vmAlbumsType: typeof vm.albums,
                contentManagerAlbums: contentManager.albums,
                contentManagerAlbumsLength: contentManager.albums ? contentManager.albums.length : 'undefined',
                vmProperties: Object.keys(vm),
                scopeProperties: Object.keys($scope)
            });
            return {
                vm: vm,
                scope: $scope,
                contentManager: contentManager
            };
        };
        vm.currentDate = new Date().toLocaleDateString();
        vm.selectedAlbumId = null;
        vm.selectedCategoryId = null;
        vm.selectedSessionId = null;
        vm.sampleDataLoaded = false;
        vm.sampleSessions = [];
        vm.albums = [];
        vm.categories = [];
        vm.availableSessions = [];
        vm.isLoading = false;
        vm.error = null;
        vm.selectedSessionsCount = 0;
        vm.groupName = '';
        vm.groupDescription = '';
        
        // Expose contentManager for template access (following working pattern)
        vm.cm = contentManager;

        // Methods
        vm.getSelectedSessions = getSelectedSessions;
        vm.onAlbumChanged = onAlbumChanged;
        vm.onCategoryChanged = onCategoryChanged;
        vm.onSessionSelect = onSessionSelect;
        vm.loadSessionsForAlbumCategory = loadSessionsForAlbumCategory;
        vm.toggleSessionSelection = toggleSessionSelection;
        vm.selectAllSessions = selectAllSessions;
        vm.clearAllSelections = clearAllSelections;
        vm.previewGrouping = previewGrouping;
        vm.executeGrouping = executeGrouping;

        activate();

        function activate() {
            console.log('🔄 [SESSION-GROUPING] Activate function called', {
                timestamp: new Date().toISOString()
            });
            
            log('Activating Session Grouping View');
            
            // Use the proper AngularJS activation pattern like other admin controllers
            var promises = [
                contentManager.getAllAlbums()
            ];
            
            common.activateController(promises, 'adminSessionGroupingCtl')
                .then(onControllerActivation);

            function onControllerActivation(resultArray) {
                console.log('✅ [SESSION-GROUPING] Controller activation completed', {
                    timestamp: new Date().toISOString(),
                    resultArray: resultArray,
                    albumsResult: resultArray[0]
                });
                
                if (resultArray[0]) {
                    // Albums are now available in contentManager.albums
                    vm.albums = contentManager.albums || [];
                    
                    console.log('🔍 [SESSION-GROUPING] Albums set via activation pattern:', {
                        vmAlbums: vm.albums,
                        vmAlbumsLength: vm.albums.length,
                        contentManagerAlbums: contentManager.albums,
                        contentManagerAlbumsLength: contentManager.albums ? contentManager.albums.length : 0
                    });
                    
                    logSuccess('Albums loaded: ' + vm.albums.length + ' items');
                } else {
                    vm.albums = [];
                    logError('Failed to load albums during activation');
                }
                
                // Initialize categories (will load when album is selected)
                vm.categories = [];
                logSuccess('Categories will load when an album is selected');
                
                logSuccess('Session Grouping view loaded successfully!');
            }
        }

        function loadAlbums() {
            console.log('📊 [SESSION-GROUPING] loadAlbums() called (legacy method)');
            
            // This method is now simplified since we use the activation pattern
            // It can be used for manual refresh if needed
            return contentManager.getAllAlbums().then(function(albums) {
                vm.albums = contentManager.albums || [];
                console.log('� [SESSION-GROUPING] Albums refreshed:', vm.albums.length);
                return vm.albums;
            });
        }

        function loadCategories() {
            console.log('📊 [SESSION-GROUPING] Loading categories...', {
                timestamp: new Date().toISOString(),
                action: 'loadCategories'
            });
            
            // Categories will be loaded when an album is selected
            // This is called during initialization but does nothing until an album is chosen
            vm.categories = [];
            
            console.log('✅ [SESSION-GROUPING] Categories initialization completed', {
                timestamp: new Date().toISOString(),
                message: 'Categories will load when album is selected'
            });
            
            log('Categories will load when an album is selected');
        }

        function loadCategoriesForAlbum(albumId) {
            if (!albumId) {
                vm.categories = [];
                return;
            }

            console.log('📊 [SESSION-GROUPING] Loading categories for album...', {
                timestamp: new Date().toISOString(),
                albumId: albumId,
                action: 'loadCategoriesForAlbum'
            });
            
            vm.isLoading = true;
            vm.error = null;
            
            // Use contentManager service which handles categories properly
            contentManager.getCategoriesForAlbum(albumId)
                .then(function(result) {
                    console.log('✅ [SESSION-GROUPING] Categories loaded successfully via contentManager', {
                        timestamp: new Date().toISOString(),
                        categoriesCount: contentManager.categories ? contentManager.categories.length : 0,
                        categories: contentManager.categories,
                        albumId: albumId
                    });
                    
                    // Use the categories from contentManager service
                    vm.categories = contentManager.categories || [];
                    vm.isLoading = false;
                    
                    logSuccess('Categories loaded: ' + vm.categories.length + ' items for album ' + albumId);
                })
                .catch(function(error) {
                    console.error('❌ [SESSION-GROUPING] Failed to load categories via contentManager', {
                        timestamp: new Date().toISOString(),
                        error: error,
                        albumId: albumId
                    });
                    
                    vm.error = 'Failed to load categories: ' + (error.data && error.data.message ? error.data.message : 'Unknown error');
                    vm.isLoading = false;
                    vm.categories = [];
                    
                    logError('Failed to load categories: ' + vm.error);
                });
        }

        function onAlbumChanged() {
            console.log('🔄 [SESSION-GROUPING] Album selection changed', {
                timestamp: new Date().toISOString(),
                selectedAlbumId: vm.selectedAlbumId,
                action: 'onAlbumChanged'
            });
            
            // Reset dependent data when album changes
            vm.availableSessions = [];
            vm.selectedCategoryId = null;
            vm.sampleDataLoaded = false;
            vm.selectedSessionsCount = 0;
            
            // Load categories for the selected album
            if (vm.selectedAlbumId) {
                loadCategoriesForAlbum(vm.selectedAlbumId);
            } else {
                vm.categories = [];
            }
        }

        function onCategoryChanged() {
            console.log('🔄 [SESSION-GROUPING] Category selection changed', {
                timestamp: new Date().toISOString(),
                selectedCategoryId: vm.selectedCategoryId,
                action: 'onCategoryChanged'
            });
            
            // Reset sessions when category changes
            vm.availableSessions = [];
            vm.sampleDataLoaded = false;
            vm.selectedSessionsCount = 0;
            
            // Automatically load sessions when both album and category are selected
            if (vm.selectedAlbumId && vm.selectedCategoryId) {
                console.log('🚀 [SESSION-GROUPING] Auto-loading sessions for selected album and category');
                loadSessionsForAlbumCategory();
            }
        }

        function onSessionSelect(sessionId, categoryId) {
            console.log('🎯 [SESSION-GROUPING] Session selected', {
                timestamp: new Date().toISOString(),
                sessionId: sessionId,
                categoryId: categoryId,
                action: 'onSessionSelect'
            });
            
            // This function is called by the zuSessionSelection directive
            // For session grouping, we might want to automatically add selected sessions to a list
            // or handle the selection in a specific way
            
            // For now, just log the selection - can be extended later
            if (sessionId) {
                log('Session selected: ' + sessionId);
            }
        }

        function loadSessionsForAlbumCategory() {
            if (!vm.selectedAlbumId || !vm.selectedCategoryId) {
                console.warn('⚠️ [SESSION-GROUPING] Cannot load sessions - missing album or category', {
                    selectedAlbumId: vm.selectedAlbumId,
                    selectedCategoryId: vm.selectedCategoryId
                });
                return;
            }
            
            console.log('📊 [SESSION-GROUPING] Loading sessions for album/category', {
                timestamp: new Date().toISOString(),
                albumId: vm.selectedAlbumId,
                categoryId: vm.selectedCategoryId,
                action: 'loadSessionsForAlbumCategory'
            });
            
            vm.isLoading = true;
            vm.error = null;
            
            console.log('🌐 [SESSION-GROUPING] Making API call via datacontext...');
            
            // Use the datacontext service for consistent API handling
            datacontext.getSessionsForGrouping(vm.selectedAlbumId, vm.selectedCategoryId)
                .then(function(response) {
                    console.log('✅ [SESSION-GROUPING] API call successful', {
                        timestamp: new Date().toISOString(),
                        responseData: response.data,
                        sessionCount: response.data ? response.data.length : 0
                    });
                    
                    vm.availableSessions = response.data || [];
                    vm.sampleDataLoaded = true;
                    vm.isLoading = false;
                    
                    // Reset selection count
                    vm.selectedSessionsCount = 0;
                    
                    console.log('📋 [SESSION-GROUPING] Sessions loaded and processed', {
                        timestamp: new Date().toISOString(),
                        sessionsCount: vm.availableSessions.length,
                        sessions: vm.availableSessions
                    });
                    
                    logSuccess('Sessions loaded: ' + vm.availableSessions.length + ' items');
                })
                .catch(function(error) {
                    console.error('❌ [SESSION-GROUPING] API call failed', {
                        timestamp: new Date().toISOString(),
                        error: error,
                        albumId: vm.selectedAlbumId,
                        categoryId: vm.selectedCategoryId
                    });
                    
                    vm.error = 'Failed to load sessions: ' + (error.data && error.data.message ? error.data.message : 'Unknown error');
                    vm.isLoading = false;
                    vm.availableSessions = [];
                    
                    logError('Failed to load sessions: ' + vm.error);
                });
        }

        function toggleSessionSelection(session) {
            console.log('🎯 [SESSION-GROUPING] Toggling session selection', {
                timestamp: new Date().toISOString(),
                sessionId: session.id,
                sessionName: session.name,
                currentSelection: session.selected,
                newSelection: !session.selected,
                action: 'toggleSessionSelection'
            });
            
            session.selected = !session.selected;
            updateSelectedSessionsCount();
            
            console.log('✅ [SESSION-GROUPING] Session selection toggled', {
                timestamp: new Date().toISOString(),
                sessionId: session.id,
                isSelected: session.selected,
                totalSelected: vm.selectedSessionsCount
            });
        }

        function updateSelectedSessionsCount() {
            var previousCount = vm.selectedSessionsCount;
            vm.selectedSessionsCount = vm.availableSessions.filter(function(s) {
                return s.selected;
            }).length;
            
            console.log('📊 [SESSION-GROUPING] Selected sessions count updated', {
                timestamp: new Date().toISOString(),
                previousCount: previousCount,
                newCount: vm.selectedSessionsCount,
                action: 'updateSelectedSessionsCount'
            });
        }

        function selectAllSessions() {
            console.log('🎯 [SESSION-GROUPING] Selecting all sessions', {
                timestamp: new Date().toISOString(),
                totalSessions: vm.availableSessions.length,
                action: 'selectAllSessions'
            });
            
            angular.forEach(vm.availableSessions, function(session) {
                session.selected = true;
            });
            
            updateSelectedSessionsCount();
            
            console.log('✅ [SESSION-GROUPING] All sessions selected', {
                timestamp: new Date().toISOString(),
                selectedCount: vm.selectedSessionsCount
            });
            
            logSuccess('Selected all ' + vm.selectedSessionsCount + ' sessions');
        }

        function clearAllSelections() {
            console.log('🎯 [SESSION-GROUPING] Clearing all selections', {
                timestamp: new Date().toISOString(),
                previouslySelected: vm.selectedSessionsCount,
                action: 'clearAllSelections'
            });
            
            angular.forEach(vm.availableSessions, function(session) {
                session.selected = false;
            });
            
            updateSelectedSessionsCount();
            
            console.log('✅ [SESSION-GROUPING] All selections cleared', {
                timestamp: new Date().toISOString(),
                selectedCount: vm.selectedSessionsCount
            });
            
            log('Cleared all session selections');
        }

        function validateSelections() {
            console.log('🔍 [SESSION-GROUPING] Validating selections', {
                timestamp: new Date().toISOString(),
                selectedCount: vm.selectedSessionsCount,
                action: 'validateSelections'
            });
            
            if (vm.selectedSessionsCount === 0) {
                logError('Please select at least one session to group');
                return false;
            }
            
            if (vm.selectedSessionsCount === 1) {
                logWarning('Only one session selected - grouping requires multiple sessions');
                return false;
            }
            
            console.log('✅ [SESSION-GROUPING] Selections validated successfully', {
                timestamp: new Date().toISOString(),
                selectedCount: vm.selectedSessionsCount
            });
            
            return true;
        }

        function previewGrouping() {
            console.log('👁️ [SESSION-GROUPING] Previewing grouping', {
                timestamp: new Date().toISOString(),
                selectedCount: vm.selectedSessionsCount,
                action: 'previewGrouping'
            });
            
            if (!validateSelections()) {
                return;
            }
            
            var selectedSessions = vm.availableSessions.filter(function(s) {
                return s.selected;
            });
            
            console.log('📋 [SESSION-GROUPING] Grouping preview data', {
                timestamp: new Date().toISOString(),
                selectedSessions: selectedSessions,
                groupingOptions: {
                    totalSessions: selectedSessions.length,
                    estimatedDuration: selectedSessions.length * 45 + ' minutes',
                    dateRange: getDateRange(selectedSessions)
                }
            });
            
            // TODO: Show preview modal
            log('Preview: ' + selectedSessions.length + ' sessions ready for grouping');
        }

        function executeGrouping() {
            console.log('🚀 [SESSION-GROUPING] Executing grouping operation', {
                timestamp: new Date().toISOString(),
                selectedCount: vm.selectedSessionsCount,
                action: 'executeGrouping'
            });
            
            if (!validateSelections()) {
                return;
            }
            
            var selectedSessions = vm.availableSessions.filter(function(s) {
                return s.selected;
            });
            
            vm.isLoading = true;
            vm.error = null;
            
            var requestData = {
                GroupName: vm.groupName || 'Untitled Group',
                GroupDescription: vm.groupDescription || '',
                SessionIds: selectedSessions.map(function(s) { return s.id; })
            };
            
            console.log('📦 [SESSION-GROUPING] Preparing session group data', {
                timestamp: new Date().toISOString(),
                requestData: requestData,
                sessions: selectedSessions.map(function(s) {
                    return {
                        id: s.id,
                        name: s.name,
                        date: s.date
                    };
                })
            });
            
            // Call the actual API endpoint using datacontext service
            console.log('🌐 [SESSION-GROUPING] Making API call to create session group');
            
            datacontext.createSessionGroup(requestData)
                .then(function(response) {
                    console.log('✅ [SESSION-GROUPING] Session group created successfully', {
                        timestamp: new Date().toISOString(),
                        response: response.data,
                        groupName: requestData.GroupName,
                        sessionsGrouped: requestData.SessionIds.length
                    });
                    
                    vm.isLoading = false;
                    
                    logSuccess('Session group "' + requestData.GroupName + '" created with ' + requestData.SessionIds.length + ' sessions');
                    
                    // Reset form
                    clearAllSelections();
                    vm.groupName = '';
                    vm.groupDescription = '';
                })
                .catch(function(error) {
                    console.error('❌ [SESSION-GROUPING] Failed to create session group', {
                        timestamp: new Date().toISOString(),
                        error: error,
                        requestData: requestData
                    });
                    
                    vm.isLoading = false;
                    vm.error = 'Failed to create session group: ' + (error.data && error.data.message ? error.data.message : 'Unknown error');
                    
                    logError('Failed to create session group: ' + vm.error);
                });
        }

        function getDateRange(sessions) {
            if (!sessions || sessions.length === 0) return '';
            
            var dates = sessions.map(function(s) { return new Date(s.date); });
            var minDate = new Date(Math.min.apply(null, dates));
            var maxDate = new Date(Math.max.apply(null, dates));
            
            return minDate.toLocaleDateString() + ' - ' + maxDate.toLocaleDateString();
        }

        function getSelectedSessions() {
            return vm.sampleSessions.filter(function(session) {
                return session.selected;
            });
        }
    }
})();
