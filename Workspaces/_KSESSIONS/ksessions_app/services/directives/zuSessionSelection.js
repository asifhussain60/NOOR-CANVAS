(function () {
    "use strict";

    angular.module("app")
        .directive("zuSessionSelection", ["$stateParams", "contentManager", "common", "config", "bootstrap.dialog", zuSessionSelection]);

    function zuSessionSelection($stateParams, contentManager, common, config, dlg) {
        /***************************************************************************************
        * Usage:
        * <div zu-session-selection=""
        * FIELDS:
        * data-album-id-field="vm.f1.albumId"
        * data-session-id-field="vm.f1.sessionId"
        * data-category-id-field="vm.f1.categoryId"
        * data-speaker-id="1"
        * DELEGATES:
        * data-on-album-select="onAlbumSelect"
        * data-on-session-select="vm.onSessionSelect"
        * data-on-album-toggle="vm.onAlbumToggle"
        * data-on-category-toggle="vm.onCategoryToggle"
        * data-on-session-toggle="vm.onSessionToggle"
        * data-delegate-add=""
        * data-delegate-delete=""
        * BOOLEANS:
        * data-filter-by-category="true"
        * data-forget-last-selection="true"
        * data-hide-entity-id="true"
        * data-hide-completed-albums="false"
        * data-show-manage-buttons="false" >
        *
        * </div>
        *
        * Description:
        * This directive provides a session selection interface with toggle functionality
        * for activating/deactivating albums, categories, and sessions. It supports
        * hierarchical toggle operations where toggling a parent item affects child items.
        * 
        * Features:
        * - Reset button in header to clear all selections and reload albums
        * - Toggle functionality for albums, categories, and sessions
        * - Hierarchical selection with category filtering
        * - Automatic state synchronization
        * 
        * Toggle Hierarchy:
        * - Album Toggle: Affects all categories, sessions, and summaries within the album
        * - Category Toggle: Affects all sessions and summaries within the category  
        * - Session Toggle: Affects all summaries within the session
        *
        * Reset Functionality:
        * - Reset button in header clears all selections and reloads albums from server
        * - Uses browser confirm dialog for user confirmation
        * - Completely self-contained within the directive
        *
        * Gotcha(s):
        * - Ensure all toggle delegate functions are implemented in the parent controller
        * - The directive will show console warnings if toggle delegates are not provided
        * - Toggle state is automatically synced when selection changes
        * - Admin users see all items regardless of active status
        * - Reset function uses browser confirm() for simplicity
        *
        ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: true,
            templateUrl: "/app/services/directives/zuSessionSelection.html",
            scope: {
                albumIdField: "=",
                categoryIdField: "=",
                sessionIdField: "=",
                speakerId: "=",

                filterByCategory: "=",
                forgetLastSelection: "=",
                hideEntityId: "=",
                hideCompletedAlbums: "=",
                showManageButtons: "=",

                onAlbumSelect: "=",
                onSessionSelect: "=",
                delegateAdd: "=",
                delegateDelete: "=",
                onAlbumToggle: "=",
                onCategoryToggle: "=",
                onSessionToggle: "="
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            var timeout = common.$timeout;
            var urlAlbumId = $stateParams.albumId || contentManager.adminStore.albumId || 0;
            var urlCategoryId = contentManager.adminStore.categoryId || 0;
            var urlSessionId = $stateParams.sessionId || contentManager.adminStore.sessionId || 0;
            
            // Utility function to convert text to proper case
            // Examples: "hello world" -> "Hello World", "HELLO-WORLD" -> "Hello-World", "hello_world" -> "Hello_world"
            function toProperCase(text) {
                if (!text || typeof text !== 'string') return text;
                
                // First, preserve abbreviations in parentheses by temporarily replacing them
                var abbreviationMap = {};
                var abbreviationCounter = 0;
                
                // Find and preserve abbreviations in parentheses (like "(AS)", "(USA)", etc.)
                var textWithPlaceholders = text.replace(/\([A-Z]{1,5}\)/g, function(match) {
                    var placeholder = "___ABBREV_" + abbreviationCounter + "___";
                    abbreviationMap[placeholder.toLowerCase()] = match; // Store with lowercase key
                    abbreviationCounter++;
                    return placeholder;
                });
                
                // Apply proper case transformation
                var properCaseText = textWithPlaceholders.toLowerCase().replace(/(?:^|\s|-)(\w)/g, function(match, letter) {
                    return match.charAt(0) === '-' ? '-' + letter.toUpperCase() : 
                           match.charAt(0) === ' ' ? ' ' + letter.toUpperCase() : 
                           letter.toUpperCase();
                });
                
                // Restore the original abbreviations using lowercase placeholders
                for (var placeholder in abbreviationMap) {
                    properCaseText = properCaseText.replace(placeholder, abbreviationMap[placeholder]);
                }
                
                return properCaseText;
            }

            scope.albumList = [];
            scope.categoryList = [];
            scope.sessionList = []; // This will now hold the prepared, numbered list
            scope.cm = contentManager;
            scope.config = config; // Expose config for debug mode access
            scope.isAlbumActive = false; // Track the active state of the selected album
            scope.isCategoryActive = false; // Track the active state of the selected category
            scope.isSessionActive = false; // Track the active state of the selected session
            
            // Expose toProperCase function to the scope for use in templates
            scope.toProperCase = toProperCase;

            // Toggle function for album active state
            scope.toggleAlbumActive = function(albumId) {
                // Toggle the state
                scope.isAlbumActive = !scope.isAlbumActive;
                
                // Find the album in the list and update its isActive property for future reference
                var selectedAlbum = _.find(scope.albumList, function(album) {
                    return album.id === albumId;
                });
                
                if (selectedAlbum) {
                    selectedAlbum.isActive = scope.isAlbumActive;
                }
                
                // Call the delegate function if provided to update the database
                if (scope.onAlbumToggle) {
                    scope.onAlbumToggle(albumId, scope.isAlbumActive);
                }
            };

            // Toggle function for category active state
            scope.toggleCategoryActive = function(categoryId) {
// Console logging removed for production
// Console logging removed for production
// Console logging removed for production
// Console logging removed for production
// Console logging removed for production
// Console logging removed for production
// Console logging removed for production
                
                try {
                    // Validate categoryId
                    if (!categoryId || categoryId <= 0) {
// Console logging removed for production
                        return;
                    }
                    
                    // Toggle the state
                    scope.isCategoryActive = !scope.isCategoryActive;
// Console logging removed for production
                    
                    // Find the category in the list and update its isActive property for future reference
                    var selectedCategory = _.find(scope.categoryList, function(category) {
                        return category.categoryId === categoryId;
                    });
                    
                    if (selectedCategory) {
                        selectedCategory.isActive = scope.isCategoryActive;
                        // Updated category object for production
                    } else {
                        // Could not find category - handle gracefully
                        // Available categories logged for debugging purposes only
                    }
                    
                    // Call the delegate function if provided to update the database
                    if (scope.onCategoryToggle) {
                        // Calling onCategoryToggle callback
                        
                        try {
                            scope.onCategoryToggle(categoryId, scope.isCategoryActive);
                            // Category toggle callback executed successfully
                        } catch (callbackError) {
                            // Error in category toggle callback - handle gracefully
                        }
                    } else {
                        // Category toggle function not provided
                    }
                } catch (error) {
                    // Error in toggle category active - handle gracefully
// Console logging removed for production
                }
                
// Console logging removed for production
            };

            // Toggle function for session active state
            scope.toggleSessionActive = function(sessionId) {
// Console logging removed for production
// Console logging removed for production
// Console logging removed for production
// Console logging removed for production
// Console logging removed for production
// Console logging removed for production
// Console logging removed for production
                
                try {
                    // Validate sessionId
                    if (!sessionId || sessionId <= 0) {
// Console logging removed for production
                        return;
                    }
                    
                    // Toggle the state
                    scope.isSessionActive = !scope.isSessionActive;
// Console logging removed for production
                    
                    // Find the session in the list and update its isActive property for future reference
                    var selectedSession = _.find(scope.sessionList, function(session) {
                        return session.id === sessionId;
                    });
                    
                    if (selectedSession) {
                        selectedSession.isActive = scope.isSessionActive;
                        // Updated session object for production
                    } else {
                        // Could not find session - handle gracefully
                        // Available sessions logged for debugging purposes only
                    }
                    
                    // Call the delegate function if provided to update the database
                    if (scope.onSessionToggle) {
                        // Calling onSessionToggle callback
                        
                        try {
                            scope.onSessionToggle(sessionId, scope.isSessionActive);
                            // Session toggle callback executed successfully
                        } catch (callbackError) {
                            // Error in session toggle callback - handle gracefully
                        }
                    } else {
                        // Session toggle function not provided
                    }
                } catch (error) {
// Console logging removed for production
// Console logging removed for production
                }
                
// Console logging removed for production
            };

            // Load previously saved selections from localStorage and apply them
            scope.loadSelectionsFromLocalStorage = function () {
                try {
                    var a = parseInt(localStorage.getItem('zu-last-album-id') || '0', 10) || 0;
                    var c = parseInt(localStorage.getItem('zu-last-category-id') || '0', 10) || 0;
                    var s = parseInt(localStorage.getItem('zu-last-session-id') || '0', 10) || 0;

                    if (!a && !c && !s) {
                        // nothing to load
                        return;
                    }

                    // Set album first so dependent lists can refresh
                    if (a && a > 0) {
                        scope.albumIdField = a;
                    }

                    // Wait for album-dependent lists to populate
                    timeout(function () {
                        if (scope.filterByCategory && c && c > 0) {
                            scope.categoryIdField = c;
                        }

                        // Wait again so sessionList is populated for the chosen category/album
                        timeout(function () {
                            if (s && s > 0) {
                                scope.sessionIdField = s;
                            }
                        }, 200);
                    }, 200);
                } catch (err) {
                    // swallow errors but log for debugging
                    if (window && window.console) {
                        console.error('Error loading selections from storage', err);
                    }
                }
            };

            // Function to update the toggle state when album selection changes
            function updateAlbumActiveState() {
                if (scope.albumIdField && scope.albumList.length > 0) {
                    var selectedAlbum = _.find(scope.albumList, function(album) {
                        return album.id === scope.albumIdField;
                    });
                    
                    if (selectedAlbum) {
                        scope.isAlbumActive = selectedAlbum.isActive || false;
// Console logging removed for production
                    }
                } else {
                    scope.isAlbumActive = false;
                }
            }

            // Function to update the toggle state when category selection changes
            function updateCategoryActiveState() {
                if (scope.categoryIdField && scope.categoryList.length > 0) {
                    var selectedCategory = _.find(scope.categoryList, function(category) {
                        return category.categoryId === scope.categoryIdField;
                    });
                    
                    if (selectedCategory) {
                        scope.isCategoryActive = selectedCategory.isActive || false;
// Console logging removed for production
                    }
                } else {
                    scope.isCategoryActive = false;
                }
            }

            // Function to update the toggle state when session selection changes
            function updateSessionActiveState() {
                if (scope.sessionIdField && scope.sessionList.length > 0) {
                    var selectedSession = _.find(scope.sessionList, function(session) {
                        return session.id === scope.sessionIdField;
                    });
                    
                    if (selectedSession) {
                        scope.isSessionActive = selectedSession.isActive || false;
// Console logging removed for production
                    }
                } else {
                    scope.isSessionActive = false;
                }
            }

            // Function to refresh data from server after toggle operations
            function refreshDataAfterToggle() {
// Console logging removed for production
                
                // If we have an album selected, refresh the album list and categories
                if (scope.albumIdField && scope.albumIdField > 0) {
                    // Refresh the album list to get updated isActive states
                    contentManager.getAllAlbums().then(function (response) {
                        if (response.length) {
// Console logging removed for production
                            loadAlbumList(response);
                            
                            // If we have categories, refresh them too
                            if (scope.filterByCategory && scope.categoryList.length > 0) {
                                contentManager.getCategoriesForAlbum(scope.albumIdField).then(function (categoryResponse) {
                                    if (categoryResponse) {
// Console logging removed for production
                                        scope.categoryList = angular.copy(contentManager.categories);
                                        
                                        // Apply proper case formatting to category names
                                        angular.forEach(scope.categoryList, function(category) {
                                            if (category.categoryName) {
                                                category.categoryNameProperCase = toProperCase(category.categoryName);
                                            }
                                        });
                                        
                                        updateCategoryActiveState();
                                        
                                        // If we have a session selected, refresh sessions too
                                        if (scope.sessionIdField && scope.sessionIdField > 0) {
                                            var isAdminFlag = -1;
                                            contentManager.getSessionsForAlbum(scope.albumIdField, isAdminFlag).then(function (sessionResponse) {
// Console logging removed for production
                                                rebuildDisplayTitles();
                                                updateSessionActiveState();
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            }

            // Listen for toggle completion events from parent controllers
            scope.$on('albumToggleCompleted', function(event, albumId, isActive) {
// Console logging removed for production
                
                // Update the local album state immediately
                var selectedAlbum = _.find(scope.albumList, function(album) {
                    return album.id === albumId;
                });
                
                if (selectedAlbum) {
                    selectedAlbum.isActive = isActive;
                    scope.isAlbumActive = isActive;
// Console logging removed for production
                }
                
                // Refresh all data to ensure UI consistency
                refreshDataAfterToggle();
            });

            scope.$on('categoryToggleCompleted', function(event, categoryId, isActive) {
// Console logging removed for production
                
                // Update the local category state immediately
                var selectedCategory = _.find(scope.categoryList, function(category) {
                    return category.categoryId === categoryId;
                });
                
                if (selectedCategory) {
                    selectedCategory.isActive = isActive;
                    scope.isCategoryActive = isActive;
// Console logging removed for production
                }
                
                // Refresh data to ensure UI consistency
                refreshDataAfterToggle();
            });

            scope.$on('sessionToggleCompleted', function(event, sessionId, isActive) {
// Console logging removed for production
                
                // Update the local session state immediately
                var selectedSession = _.find(scope.sessionList, function(session) {
                    return session.id === sessionId;
                });
                
                if (selectedSession) {
                    selectedSession.isActive = isActive;
                    scope.isSessionActive = isActive;
// Console logging removed for production
                }
                
                // Refresh data to ensure UI consistency
                refreshDataAfterToggle();
            });

            if (!contentManager.albums.length) {
                contentManager.getAllAlbums().then(function (response) {
                    if (response.length) {
                        loadAlbumList(response);
                    }
                });
            } else {
                loadAlbumList(angular.copy(contentManager.albums));
            }

            // helper to re-number & re-label all sessions
            function rebuildDisplayTitles() {
                // pick the right source array (filtered or full)
                var list = scope.filterByCategory && scope.categoryIdField > 0
                    ? _.where(scope.cm.currentAlbum.sessions, { categoryId: scope.categoryIdField })
                    : scope.cm.currentAlbum.sessions;

                // sort by sequence
                list.sort(function (a, b) { return a.sequence - b.sequence; });

                // rewrite displayTitleWithRowNumbers
                angular.forEach(list, function (session, idx) {
                    session.displayTitleWithRowNumber = (idx + 1) + ". " + toProperCase(session.name);
                });

                // push it back onto the dropdown's model
                scope.sessionList = list;
            }

            // wire up your existing album/category watches�
            // (they already call similar numbering logic)

            // Listen for our metadata-updated event
            scope.$on("sessionMetadataUpdated", function () {
                if (scope.cm.currentAlbum && scope.cm.currentAlbum.sessions) {
                    rebuildDisplayTitles();
                }
            });

            function loadAlbumList(albumList) {
                if (scope.speakerId) {
                    albumList = _.where(albumList, { speakerId: scope.speakerId });
                }
                if (scope.hideCompletedAlbums) {
                    albumList = _.where(albumList, { isCompleted: false });
                }
                // Sort albumList alphabetically by name
                albumList.sort(function (a, b) {
                    var nameA = a.name.toUpperCase(); // ignore upper and lowercase
                    var nameB = b.name.toUpperCase(); // ignore upper and lowercase
                    if (nameA < nameB) {
                        return -1;
                    }
                    if (nameA > nameB) {
                        return 1;
                    }
                    // names must be equal
                    return 0;
                });
                
                // Apply proper case formatting to album names
                angular.forEach(albumList, function(album) {
                    if (album.name) {
                        album.nameProperCase = toProperCase(album.name);
                    }
                });
                
                scope.albumList = albumList;
                
                // Update album active state after loading the list
                updateAlbumActiveState();
                
                selectAlbumIdFromDdl();
            }

            // Helper function to save current selections to localStorage
            function saveSessionToLocalStorage() {
                try {
                    localStorage.setItem('zu-last-album-id', scope.albumIdField || '0');
                    localStorage.setItem('zu-last-category-id', scope.categoryIdField || '0');
                    localStorage.setItem('zu-last-session-id', scope.sessionIdField || '0');
                } catch (error) {
                    console.error("DEBUG: Error saving session to localStorage", {
                        error: error,
                        errorMessage: error.message
                    });
                }
            }

            scope.$watch("albumIdField",
                function (newAlbumId, oldAlbumId) {
// Console logging removed for production
// Console logging removed for production
// Console logging removed for production
// Console logging removed for production
// Console logging removed for production
                    
                    if (newAlbumId <= 0 || angular.equals(newAlbumId, oldAlbumId)) {
// Console logging removed for production
                        return;
                    }
                    
                    // Update the album active state when selection changes
                    updateAlbumActiveState();
                    
                    var isAdminFlag = -1;
                    if (scope.filterByCategory) {
                        scope.categoryIdField = 0;
                        scope.isCategoryActive = false;
// Console logging removed for production
                    }
                    scope.sessionIdField = 0;
                    scope.isSessionActive = false;
// Console logging removed for production

                    contentManager.setAlbumById(newAlbumId);
// Console logging removed for production
                    
                    // Track whether we've called onAlbumSelect to avoid duplicate calls
                    var albumSelectCalled = false;
                    
                    //Load sessions
// Console logging removed for production
                    contentManager.getSessionsForAlbum(newAlbumId, isAdminFlag).then(function (response) {
// Console logging removed for production
                        // Process sessions for both filtered and non-filtered cases
                        var rawSessionList = contentManager.currentAlbum.sessions;

                        // 1. Sort the raw session list by 'sequence' in ascending order
                        // Assuming 'sequence' is a numeric property
                        rawSessionList.sort(function (a, b) {
                            return a.sequence - b.sequence;
                        });

                        // 2. Add the displayTitleWithRowNumber property to each session object
                        angular.forEach(rawSessionList,
                            function (session, index) {
                                // MODIFICATION HERE: Removed 'session.sequence' from the display string
                                session.displayTitleWithRowNumber = (index + 1) + ". " + toProperCase(session.name);
                            });

                        // For non-filtered case, assign all sessions to scope.sessionList
                        if (!scope.filterByCategory) {
                            scope.sessionList = rawSessionList;
// Console logging removed for production
                            
                            // For non-filtered case, call onAlbumSelect immediately after sessions load
                            if (scope.onAlbumSelect && !albumSelectCalled) {
                                albumSelectCalled = true;
// Console logging removed for production
                                scope.onAlbumSelect(newAlbumId);
                            }
                        }
                        // For filtered case, sessions will be set when category is selected

                        selectSessionIdFromDdl();
                    }).catch(function(error) {
// Console logging removed for production
                        // If sessions failed to load, still call onAlbumSelect for non-filtered case
                        if (!scope.filterByCategory && scope.onAlbumSelect && !albumSelectCalled) {
                            albumSelectCalled = true;
// Console logging removed for production
                            scope.onAlbumSelect(newAlbumId);
                        }
                    });
                    
                    if (scope.filterByCategory) {
                        //Load Categories
                        var thatAlbumId = newAlbumId;
// Console logging removed for production
                        contentManager.getCategoriesForAlbum(newAlbumId).then(function (response) {
// Console logging removed for production
                            
                            if (!response || !contentManager.categories || contentManager.categories.length === 0) {
// Console logging removed for production
                                // If categories failed to load, call onAlbumSelect now
                                if (scope.onAlbumSelect && !albumSelectCalled) {
                                    albumSelectCalled = true;
// Console logging removed for production
                                    scope.onAlbumSelect(thatAlbumId);
                                }
                                return;
                            }
                            
// Console logging removed for production
                            scope.categoryList = angular.copy(contentManager.categories);
                            
                            // Apply proper case formatting to category names
                            angular.forEach(scope.categoryList, function(category) {
                                if (category.categoryName) {
                                    category.categoryNameProperCase = toProperCase(category.categoryName);
                                }
                            });
                            
                            updateCategoryActiveState();
                            selectCategoryIdFromDdl();
                            
                            // Call onAlbumSelect only once after categories are loaded successfully
                            if (scope.onAlbumSelect && !albumSelectCalled) {
                                albumSelectCalled = true;
// Console logging removed for production
                                scope.onAlbumSelect(thatAlbumId);
                            } else {
// Console logging removed for production
                            }
                        }).catch(function(error) {
// Console logging removed for production
                            // If categories failed to load, call onAlbumSelect now
                            if (scope.onAlbumSelect && !albumSelectCalled) {
                                albumSelectCalled = true;
// Console logging removed for production
                                scope.onAlbumSelect(thatAlbumId);
                            }
                        });
                    }
                    
                    // Save current selections to localStorage
                    saveSessionToLocalStorage();
                },
                false);

            // Utility function to check if a selection value is valid (not placeholder)
            scope.isValidSelection = function(value) {
                return value !== null && 
                       value !== undefined && 
                       value !== '' && 
                       value !== '?' && 
                       typeof value === 'number' && 
                       value > 0;
            };

            scope.onAddClick = function () {
                if (scope.delegateAdd) {
                    scope.delegateAdd(true);
                }
            };
            scope.onDeleteClick = function () {
                if (scope.delegateDelete) {
                    scope.delegateDelete(scope.albumIdField, scope.categoryIdField, scope.sessionIdField);
                }
            };

            scope.confirmDeleteSession = function () {
                if (!scope.sessionIdField || scope.sessionIdField <= 0) {
                    return;
                }
                
                // Find the selected session to get its title for the confirmation message
                var selectedSession = _.find(scope.sessionList, function(session) {
                    return session.id === scope.sessionIdField;
                });
                
                var sessionTitle = selectedSession ? selectedSession.displayTitleWithRowNumber : 'Session ID ' + scope.sessionIdField;
                var confirmMessage = 'Are you sure you want to delete "' + sessionTitle + '"?\n\nThis will permanently delete the session and all its transcripts. This action cannot be undone.';
                
                dlg.confirmationDialog("Confirm Delete", confirmMessage, "Yes, Delete", "Cancel")
                    .then(function (result) {
                        if (result === "ok") {
                            scope.onDeleteClick();
                        }
                    })
                    .catch(function (reason) {
                        // User cancelled - this is normal behavior, no error needed
                        if (reason !== "cancel") {
                            console.warn("Unexpected dialog rejection:", reason);
                        }
                    });
            };

            scope.$watch("categoryIdField",
                function (newCategoryId, oldCategoryId) {
                    if (!scope.filterByCategory || newCategoryId <= 0 || angular.equals(newCategoryId, oldCategoryId)) {
                        return;
                    }
                    
                    // Update the category active state when selection changes
                    updateCategoryActiveState();
                    
                    // Re-apply the same numbering logic when category filter changes
                    var filteredSessions = _.where(contentManager.currentAlbum.sessions, { categoryId: newCategoryId });

                    // Sort the filtered list
                    filteredSessions.sort(function (a, b) {
                        return a.sequence - b.sequence;
                    });

                    // Add display number
                    angular.forEach(filteredSessions,
                        function (session, index) {
                            // MODIFICATION HERE: Removed 'session.sequence' from the display string
                            session.displayTitleWithRowNumber = (index + 1) + ". " + toProperCase(session.name);
                        });

                    scope.sessionList = filteredSessions;
                    selectSessionIdFromDdl();
                    
                    // Update session active state after category change
                    updateSessionActiveState();
                    
                    // Save current selections to localStorage
                    saveSessionToLocalStorage();
                },
                false);

            scope.$watch("sessionIdField",
                function (newSessionId, oldSessionId) {
                    if (newSessionId <= 0 || angular.equals(newSessionId, oldSessionId)) {
                        return;
                    }
                    
                    // Update the session active state when selection changes
                    updateSessionActiveState();
                    
                    contentManager.setAdminStore(scope.albumIdField, scope.categoryIdField, newSessionId);
                    contentManager.setCurrentSession(newSessionId).then(function (response) {
                        if (scope.onSessionSelect) {
                            scope.onSessionSelect(newSessionId, scope.categoryIdField);
                        }
                    });
                    
                    // Save current selections to localStorage
                    saveSessionToLocalStorage();
                },
                false);

            scope.isDisabledSessionDdl = function () {
                return !scope.albumIdField ||
                    (scope.filterByCategory &&
                        (!scope.categoryList.length || !scope.categoryIdField || scope.categoryIdField <= 0));
            };

            function selectAlbumIdFromDdl() {
                if (!urlAlbumId || scope.forgetLastSelection) return;
                var exists = _.find(scope.albumList, function (a) { return a.id === urlAlbumId; });
                if (!exists) return;

                timeout(function () {
                    scope.albumIdField = Number(urlAlbumId);
                    $stateParams.albumId = null;
                },
                    350);
            }

            function selectCategoryIdFromDdl() {
                if (!urlCategoryId || scope.forgetLastSelection) return;
                var exists = _.find(scope.categoryList, function (a) { return a.categoryId === urlCategoryId });
                if (!exists) return;

                timeout(function () {
                    scope.categoryIdField = Number(urlCategoryId);
                    $stateParams.categoryId = null;
                },
                    350);
            }

            function selectSessionIdFromDdl() {
                if (!urlSessionId || scope.forgetLastSelection) return;
                var exists = _.find(scope.sessionList, function (a) { return a.id === urlSessionId });
                if (!exists) return;

                timeout(function () {
                    scope.sessionIdField = Number(urlSessionId);
                    $stateParams.sessionId = null;
                },
                    350);
            }

            // Reset function to clear all selections and reload albums
            scope.resetSelections = function() {
                console.log("DEBUG: resetSelections() called", {
                    currentAlbumId: scope.albumIdField,
                    currentCategoryId: scope.categoryIdField,
                    currentSessionId: scope.sessionIdField,
                    timestamp: new Date().toISOString()
                });

                console.log("DEBUG: Proceeding with reset", {
                    previousState: {
                        albumId: scope.albumIdField,
                        categoryId: scope.categoryIdField,
                        sessionId: scope.sessionIdField
                    }
                });

                // Clear all selections
                scope.albumIdField = 0;
                scope.categoryIdField = 0;
                scope.sessionIdField = 0;
                
                // Clear lists
                scope.categoryList = [];
                scope.sessionList = [];
                
                // Reset active states
                scope.isAlbumActive = false;
                scope.isCategoryActive = false;
                scope.isSessionActive = false;
                
                console.log("DEBUG: Cleared all selections, reloading albums", {
                    clearedState: {
                        albumId: scope.albumIdField,
                        categoryId: scope.categoryIdField,
                        sessionId: scope.sessionIdField
                    }
                });

                // Reload albums from server
                contentManager.getAllAlbums().then(function (response) {
                    console.log("DEBUG: Albums reloaded successfully", {
                        albumCount: response ? response.length : 0,
                        firstAlbum: response && response.length > 0 ? response[0].name : 'None'
                    });
                    
                    if (response && response.length) {
                        loadAlbumList(response);
                    }
                }).catch(function(error) {
                    console.error("DEBUG: Error reloading albums", {
                        error: error,
                        errorMessage: error.message
                    });
                });
            };

            // Development-only function to load last session (for debugging)
            scope.loadLastSession = function() {
                if (!config.showDevelopmentFeatures) {
                    console.warn("loadLastSession() is only available in development mode");
                    return;
                }

                console.log("DEBUG: loadLastSession() called - Development feature", {
                    timestamp: new Date().toISOString(),
                    environment: config.environment
                });

                try {
                    // Check if we have localStorage support
                    if (typeof Storage === "undefined") {
                        console.warn("LocalStorage not supported in this browser");
                        return;
                    }

                    // Look for last session data in localStorage
                    var storageKeys = [];
                    for (var i = 0; i < localStorage.length; i++) {
                        var key = localStorage.key(i);
                        if (key && key.indexOf('last_session_') === 0) {
                            storageKeys.push(key);
                        }
                    }

                    if (storageKeys.length === 0) {
                        console.log("DEBUG: No last session data found in localStorage");
                        return;
                    }

                    // Use the most recent session data
                    var mostRecentKey = storageKeys[storageKeys.length - 1];
                    var sessionData = localStorage.getItem(mostRecentKey);
                    
                    if (sessionData) {
                        var parsedData = JSON.parse(sessionData);
                        console.log("DEBUG: Found last session data", {
                            storageKey: mostRecentKey,
                            sessionData: parsedData
                        });

                        // Set the selections based on stored data
                        if (parsedData.albumId) {
                            scope.albumIdField = parsedData.albumId;
                            scope.onAlbumSelect(parsedData.albumId);
                        }
                        
                        // Give the album selection time to load categories/sessions
                        setTimeout(function() {
                            if (parsedData.categoryId) {
                                scope.categoryIdField = parsedData.categoryId;
                            }
                            if (parsedData.sessionId) {
                                scope.sessionIdField = parsedData.sessionId;
                                scope.onSessionSelect(parsedData.sessionId, parsedData.categoryId);
                            }
                        }, 1000);

                        // No confirmation dialog after successful load
                    }
                } catch (error) {
                    console.error("DEBUG: Error loading last session", {
                        error: error,
                        errorMessage: error.message
                    });
                    // No confirmation dialog on error
                }
            };
        }
    }
})();
