(function () {
    "use strict";
    var controllerId = "albumListCtl";
    angular.module("app").controller(controllerId,
        ["$scope", "common", "config", "contentManager", "globalData", "$injector", albumListController]);

    function albumListController($scope, common, config, cm, gData, $injector) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        // Validate dependencies
        if (!gData || !gData.member) {
            logError("Missing globalData or member information", controllerId);
            $scope.stateGo("login");
            return;
        }

        var memberId = gData.member.id;
        $scope.vm = {}; var vm = $scope.vm;

        //Properties - Initialize with safe defaults
        vm.albums = [];
        vm.isMobileBrowser = common.isMobileBrowser();
        vm.lastAccessedAudio = $scope.g && $scope.g.member ? $scope.g.member.lastAccessedSession : {};
        vm.recentUploadedCategories = [];
        vm.search = {
            albumName: ""
        };
        vm.panelExpanded = false;
        
        // Sorting functionality - User gets alphabetical, Admin gets flexible options
        vm.sortOptions = {
            currentSort: gData.member.isAdmin ? 'latestSessionDate' : 'name', // Admin: date desc, User: alphabetical
            currentDirection: gData.member.isAdmin ? 'desc' : 'asc',
            available: gData.member.isAdmin ? [
                { key: 'name', label: 'Album Name', icon: 'fa-sort-alpha-asc' },
                { key: 'latestSessionDate', label: 'Session Date', icon: 'fa-calendar' }
            ] : [
                { key: 'name', label: 'Album Name', icon: 'fa-sort-alpha-asc' }
            ]
        };

        // Accordion functionality - with safe loading
        vm.albumAccordion = null;
        var accordionService = null;

        // Try to get accordionService safely
        try {
            accordionService = $injector.get('accordionService');
        } catch (error) {
            logError("accordionService not available, using fallback: " + error.message, controllerId);
        }

        //Methods
        vm.selectAlbum = redirectToAlbumPage;
        vm.jumpToSession = jumpToSession;
        vm.redirectToSession = redirectToSession;
        vm.selectSession = selectSession;
        vm.navigateToAudio = navigateToAudio;
        vm.navigateToSessionReader = navigateToSessionReader;
        vm.navigateToSummary = navigateToSummary;
        vm.hasActiveAudio = hasActiveAudio;
        
        // Accordion methods
        vm.toggleAlbum = toggleAlbum;
        vm.isAlbumExpanded = isAlbumExpanded;
        
        // Sorting methods
        vm.setSortOption = setSortOption;
        vm.toggleSortDirection = toggleSortDirection;
        vm.getSortedAlbums = getSortedAlbums;

        if (memberId) {
            activate();
        } else {
            $scope.stateGo("404");
            return;
        }

        function activate() {
            cm.initialize();
            
            // ROLE-BASED DATA RETRIEVAL: Use different methods based on user role
            var albumPromise;
            if (gData.member.isAdmin) {
                // Admin users: Get all albums (including inactive ones) with role-based endpoint
                log("Loading albums for admin user", controllerId, config.showDevToasts);
                albumPromise = cm.getAllAlbumsForAdmin(memberId);
            } else {
                // Regular users: Get only accessible active albums
                log("Loading albums for regular user", controllerId, config.showDevToasts);
                albumPromise = cm.getAlbumsForMember(memberId);
            }
            
            var promises = [
                albumPromise,
                cm.getRecentUploadedCategories(memberId, 3)
            ];
            
            common.activateController(promises, controllerId).then(onControllerActivation);

            function onControllerActivation(response) {
                try {
                    if (response && response[0] && response[0].length) {
                        var albumCount = response[0].length;
                        var activeAlbumCount = response[0].filter(function(album) { 
                            return album.isActive !== false; 
                        }).length;
                        
                        if (gData.member.isAdmin) {
                            log("Admin view - Total albums: " + albumCount + ", Active: " + activeAlbumCount, controllerId, config.showDevToasts);
                            // Debug: Log all album names for troubleshooting
                            if (config.showDevToasts) {
                                log("Album names: " + response[0].map(function(a) { return a.name; }).join(", "), controllerId, true);
                            }
                            $scope.setPageTitle("All Albums (Admin View)");
                        } else {
                            log("User view - Available albums: " + albumCount, controllerId, config.showDevToasts);
                            $scope.setPageTitle("Available Albums");
                        }

                        // Ensure cm.albums is an array before processing
                        if (!cm.albums || !Array.isArray(cm.albums)) {
                            logError("Invalid albums data from contentManager", controllerId);
                            vm.albums = [];
                        } else {
                            vm.albums = primeData(cm.albums);
                            
                            // Log album status for debugging (admin only)
                            if (gData.member.isAdmin && config.showDevToasts) {
                                vm.albums.forEach(function(album) {
                                    if (album.isActive === false) {
                                        log("Inactive album detected: " + album.name, controllerId, true);
                                    }
                                });
                            }
                            
                            // Initialize accordion for albums if service is available
                            if (accordionService) {
                                initializeAlbumAccordion();
                            } else {
                                // Fallback: expand first album manually
                                if (vm.albums.length > 0) {
                                    vm.albums[0].isExpanded = true;
                                    vm.albums[0].isCollapsed = false;
                                }
                            }
                        }

                        // Additional validation of processed albums
                        if (vm.albums && vm.albums.length > 0) {
                            var invalidAlbums = vm.albums.filter(function (album) {
                                return !album || !album.id;
                            });
                            if (invalidAlbums.length > 0) {
                                logError("Found " + invalidAlbums.length + " invalid albums in processed data", controllerId);
                            }
                        }

                        if (response[1]) {
                            vm.recentUploadedCategories = angular.copy(cm.recentUploadedCategories) || [];
                        }

                        common.$timeout(function () {
                            $(".album-panel").matchHeight({ property: "height" });
                        }, 1000);

                        log("Activated albumList Controller", controllerId, config.showDevToasts);
                    } else {
                        logError("No albums data received from activation", controllerId);
                        vm.albums = []; // Ensure albums is always an array
                        if (gData.member.isAdmin) {
                            $scope.stateGo("admin");
                        } else {
                            $scope.stateGo("404");
                        }
                    }
                } catch (error) {
                    logError("Error in onControllerActivation: " + error.message, controllerId);
                }
            }
        }

        //Internal Methods

        function primeData(list) {
            var member = gData.member;

            if (!list || !Array.isArray(list)) {
                logError("Invalid album list passed to primeData: " + JSON.stringify(list), controllerId);
                return [];
            }

            var result = _.each(list, function (item) {
                // Ensure each album has required properties
                if (!item) {
                    logError("Null album item found in list", controllerId);
                    return;
                }

                // Add safe fallbacks for required properties
                item.id = item.id || 0;
                item.name = item.name || "Unknown Album";
                // Construct proper image path using album ID - use Image to match C# property casing
                item.Image = item.Image && item.Image.trim() 
                    ? item.Image 
                    : config.urls.albumImages + "/" + (item.id || 0) + ".jpg";
                item.description = item.description || "";
                
                // Ensure isActive property exists and is boolean
                if (typeof item.isActive === 'undefined' || item.isActive === null) {
                    item.isActive = true; // Default to active if not specified
                }

                item.displaySessionCount = member.mostRecentOnly || member.expiresInDays > 0
                    ? ""
                    : item.sessionCount;

                //truncate latest session name if necessary...
                var itemName = item.latestSessionName && item.latestSessionName.length > 25
                    ? item.latestSessionName.first(25) + "..."
                    : item.latestSessionName || "";
                item.displayLatestSessionName = itemName.capitalize(true, true);

                // Initialize accordion state
                item.isExpanded = false;
                item.isCollapsed = true;
            });

            // Apply new sorting logic instead of hardcoded sort
            return getSortedAlbumsInternal(result);
        }

        function initializeAlbumAccordion() {
            if (!accordionService) {
                logError("accordionService not available for initialization", controllerId);
                return;
            }

            try {
                // Create accordion instance with single-item expansion
                vm.albumAccordion = accordionService.createAccordion({
                    allowMultiple: false, // Only one album expanded at a time
                    expandFirst: true,    // Expand first album by default
                    onExpand: function(item, itemId) {
                        log("Album expanded: " + item.name, controllerId, config.showDevToasts);
                    },
                    onCollapse: function(item, itemId) {
                        log("Album collapsed: " + item.name, controllerId, config.showDevToasts);
                    }
                });

                // Set the albums in the accordion
                vm.albumAccordion.setItems(vm.albums);
            } catch (error) {
                logError("Error initializing accordion: " + error.message, controllerId);
                // Fallback to manual management
                if (vm.albums.length > 0) {
                    vm.albums[0].isExpanded = true;
                    vm.albums[0].isCollapsed = false;
                }
            }
        }

        function toggleAlbum(album) {
            if (!album || !album.id) {
                return;
            }
            
            if (vm.albumAccordion) {
                vm.albumAccordion.toggle(album.id);
            } else {
                // Fallback: manual accordion behavior
                var wasExpanded = album.isExpanded;
                
                // Collapse all albums
                vm.albums.forEach(function(a) {
                    a.isExpanded = false;
                    a.isCollapsed = true;
                });
                
                // If clicked album was collapsed, expand it
                if (!wasExpanded) {
                    album.isExpanded = true;
                    album.isCollapsed = false;
                }
            }
        }

        function isAlbumExpanded(album) {
            if (!album || !album.id) {
                return false;
            }
            
            return album.isExpanded === true;
        }

        function jumpToSession(fromStart) {
            var params = {
                albumId: vm.lastAccessedAudio.groupID,
                sessionId: vm.lastAccessedAudio.sessionID,
                jumpLocation: fromStart ? 0 : vm.lastAccessedAudio.audioLocation
            }
            var album = common.findById(vm.albums, "id", params.albumId);
            if (album) {
                cm.setAlbum(album);
                cm.getAlbumDataById(params.albumId, memberId).then(function (response) {
                    $scope.stateGo("session", params);
                });
            }
        }

        function redirectToAlbumPage(album) {
            // Admin users can access inactive albums for management purposes
            cm.setAlbum(album);
            $scope.stateGo("album", { albumId: album.id, cid: '' });
        }

        function redirectToSession(album) {
            // Admin users can access inactive albums for management purposes
            cm.setAlbum(album);
            cm.getAlbumDataById(album.id, memberId).then(function (response) {
                $scope.stateGo("session", { 
                    albumId: album.id, 
                    sessionId: album.latestSessionId,
                    jumpLocation: 0
                });
            });
        }

        function selectSession(item) {
            var that = this;
            if (!item.categoryId) { return; }

            var album = common.findById(vm.albums, "id", item.groupId);
            
            // Admin users can access inactive albums for management purposes
            cm.setAlbum(album);
            $scope.stateGo("album", { albumId: item.groupId, cid: item.categoryId });
        }

        // New methods for button actions
        function navigateToAudio(album) {
            if (!album || !album.id) {
                logError("Invalid album data for audio navigation", controllerId);
                return;
            }

            // Admin users can access inactive albums for management purposes
            try {
                cm.setAlbum(album);
                // Navigate directly to the album page instead of session page
                $scope.stateGo("album", { albumId: album.id, cid: '' });
            } catch (error) {
                logError("Error in navigateToAudio: " + error.message, controllerId);
            }
        }

        function navigateToSessionReader(album) {
            console.log("DEBUG: navigateToSessionReader() called from albumList", {
                album: album,
                albumId: album ? album.id : 'no album',
                albumName: album ? album.name : 'no album',
                controllerId: controllerId,
                timestamp: new Date().toISOString(),
                stateGoFunction: typeof $scope.stateGo,
                contentManagerExists: typeof cm
            });

            // Validation with enhanced debugging
            if (!album) {
                console.error("DEBUG: navigateToSessionReader - No album provided", {
                    album: album,
                    controllerId: controllerId
                });
                logError("No album provided to navigateToSessionReader", controllerId);
                return;
            }

            if (!album.id) {
                console.error("DEBUG: navigateToSessionReader - Album has no ID", {
                    album: album,
                    controllerId: controllerId
                });
                logError("Album has no ID for navigation", controllerId);
                return;
            }

            // Admin users can access inactive albums for management purposes
            // Always navigate to sessionReader for all users
            try {
                console.log("DEBUG: Setting album in content manager", {
                    albumId: album.id,
                    albumName: album.name,
                    controllerId: controllerId
                });

                cm.setAlbum(album);

                console.log("DEBUG: Attempting state navigation to sessionReader", {
                    targetState: "sessionReader",
                    stateParams: { albumId: album.id },
                    controllerId: controllerId
                });

                $scope.stateGo("sessionReader", { albumId: album.id });

                console.log("DEBUG: State navigation command sent", {
                    targetState: "sessionReader",
                    albumId: album.id,
                    controllerId: controllerId
                });

            } catch (error) {
                console.error("DEBUG: Error in navigateToSessionReader", {
                    error: error,
                    errorMessage: error.message,
                    stack: error.stack,
                    album: album,
                    controllerId: controllerId
                });
                logError("Error in navigateToSessionReader: " + error.message, controllerId);
            }
        }

        function navigateToSummary(album) {
            // Admin users can access inactive albums for management purposes
            if (gData.member.isAdmin) {
                cm.setAlbum(album);
                cm.getAlbumDataById(album.id, memberId).then(function (response) {
                    var firstSession = album.latestSessionId || (album.sessions && album.sessions[0] && album.sessions[0].id);
                    if (firstSession) {
                        $scope.stateGo("admin.summary", {
                            albumId: album.id,
                            sessionId: firstSession
                        });
                    } else {
                        $scope.stateGo("admin.summary", { albumId: album.id });
                    }
                });
            } else {
                // For non-admin users, redirect to album page
                redirectToAlbumPage(album);
            }
        }

        function hasActiveAudio(album) {
            // Check if album has any active sessions with audio files
            if (!album) return false;

            // Check if album itself is active (if such property exists)
            if (album.hasOwnProperty('isActive') && !album.isActive) {
                // For admin users, still show the indicator but note it's inactive
                // For regular users, this shouldn't happen as they won't see inactive albums
                return gData.member.isAdmin;
            }

            // If we have session data, check for active sessions with media
            if (album.sessions && album.sessions.length > 0) {
                return album.sessions.some(function (session) {
                    return session.isActive && session.mediaPath;
                });
            }

            // If no session data available, check if album has any indicators of audio content
            // This handles cases where session data isn't loaded yet
            if (album.sessionCount > 0 || album.latestSessionId) {
                // Additional check: if we know the album has sessions, assume some might have audio
                // In a real implementation, you might want to make an API call to check this
                return true;
            }

            return false;
        }

        function findFirstActiveSessionWithAudio(album) {
            if (!album.sessions || album.sessions.length === 0) return null;

            return album.sessions.find(function (session) {
                return session.isActive && session.mediaPath;
            });
        }

        // Sorting functionality
        function setSortOption(sortKey) {
            if (!gData.member.isAdmin) return; // Only admins can change sort options
            
            if (vm.sortOptions.currentSort === sortKey) {
                // If same sort key, toggle direction
                vm.sortOptions.currentDirection = vm.sortOptions.currentDirection === 'asc' ? 'desc' : 'asc';
            } else {
                // New sort key, use default direction
                vm.sortOptions.currentSort = sortKey;
                vm.sortOptions.currentDirection = (sortKey === 'name') ? 'asc' : 'desc';
            }
            
            log("Sort option changed: " + sortKey + " " + vm.sortOptions.currentDirection, controllerId, config.showDevToasts);
        }

        function toggleSortDirection() {
            vm.sortOptions.currentDirection = vm.sortOptions.currentDirection === 'asc' ? 'desc' : 'asc';
            log("Sort direction toggled: " + vm.sortOptions.currentDirection, controllerId, config.showDevToasts);
        }

        function getSortedAlbums() {
            if (!vm.albums || vm.albums.length === 0) return [];
            
            return getSortedAlbumsInternal(vm.albums);
        }

        // Internal sorting function to avoid circular dependency
        function getSortedAlbumsInternal(albums) {
            if (!albums || albums.length === 0) return [];
            
            var sortKey = vm.sortOptions.currentSort;
            var direction = vm.sortOptions.currentDirection;
            
            // Use underscore.js for sorting
            var sorted = _.sortBy(albums, function(album) {
                switch (sortKey) {
                    case 'name':
                        return (album.name || '').toLowerCase();
                    case 'latestSessionDate':
                        return album.latestSessionDate ? new Date(album.latestSessionDate) : new Date(0);
                    default:
                        return (album.name || '').toLowerCase();
                }
            });
            
            // Reverse for descending order
            if (direction === 'desc') {
                sorted = sorted.reverse();
            }
            
            return sorted;
        }
    }
})();