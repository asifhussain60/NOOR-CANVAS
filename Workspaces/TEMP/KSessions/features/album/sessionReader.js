(function () {
    "use strict";
    var controllerId = "sessionReaderCtrl";
    angular.module("app").controller(controllerId, ["$scope", "$window", "$timeout", "$interval", "common", "config", "globalData", "contentManager", "datacontext", sessionReaderController]);

    function sessionReaderController($scope, $window, $timeout, $interval, common, config, gData, contentMgr, datacontext) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");
        var logWarning = getLogFn(controllerId, "warning");

        var albumId = parseInt($scope.$stateParams.albumId) || parseInt($scope.$stateParams.id) || 0;
        var memberId = gData.member.id || 0;

        console.log("DEBUG: sessionReaderController initializing", {
            controllerId: controllerId,
            albumId: albumId,
            memberId: memberId,
            stateParams: $scope.$stateParams,
            timestamp: new Date().toISOString()
        });

        $scope.vm = {}; var vm = $scope.vm;

        // Properties - Enhanced for beautiful reader
        vm.album = {
            id: albumId,
            name: "",
            description: "",
            image: ""
        };
        vm.categories = [];
        vm.categoriesWithSessions = [];
        vm.sessions = [];
        vm.uncategorizedSessions = [];
        vm.selectedSession = null;
        vm.selectedSessionId = null;
        vm.currentSessionIndex = 0;
        vm.totalSessions = 0;
        vm.isLoading = true;
        vm.isLoadingSession = false;

        // Mobile and responsive properties
        vm.isMobile = $window.innerWidth < 768;
        vm.sidebarOpen = false;
        vm.sidebarCollapsed = false;
        vm.expandedChapters = {};
        
        // Phase 3: Enhanced Category Navigation properties
        vm.categoryControls = {
            allExpanded: true,  // Default to all expanded as requested
            hasCategories: false,
            expandedCount: 0,
            totalCount: 0
        };
        
        // Navigation properties
        vm.hasPrevious = false;
        vm.hasNext = false;

        // Phase 2: Search Enhancement properties
        vm.searchText = "";
        vm.searchResults = {
            categories: [],
            uncategorizedSessions: [],
            totalFound: 0
        };

        // Phase 2: Reading Progress properties
        vm.sessionProgress = {};
        vm.overallProgress = {
            completedCount: 0,
            totalCount: 0,
            percentage: 0
        };

        // Phase 2: Theme System properties
        vm.currentTheme = "reader-theme-light";

        // Phase 2: Session Bookmarking properties
        vm.sessionBookmarks = {};
        vm.isBookmarked = false;

        // Phase 2: Performance Optimization properties
        vm.sessionContentCache = {};
        vm.maxCacheSize = 10; // Maximum number of sessions to cache
        vm.isScrolling = false;
        vm.performanceMetrics = {
            loadTimes: {},
            cacheHits: 0,
            cacheMisses: 0
        };
        vm.availableThemes = [
            { id: "reader-theme-light", name: "Light", icon: "fa-sun-o" },
            { id: "reader-theme-dark", name: "Dark", icon: "fa-moon-o" },
            { id: "reader-theme-sepia", name: "Sepia", icon: "fa-leaf" }
        ];

        // Phase 2: Session Bookmarking properties
        vm.sessionBookmarks = {};
        vm.showBookmarks = false;

        // Phase 4: Bookmark View Management properties
        vm.showBookmarksView = false;  // Toggle between categories and bookmarks view
        vm.bookmarkViewData = {};      // Processed bookmark data for display

        // Cached properties to prevent infinite digest cycles
        vm.filteredCategoriesWithSessions = [];
        vm.filteredUncategorizedSessions = [];

        console.log("DEBUG: sessionReaderController properties initialized", {
            controllerId: controllerId,
            initialProperties: {
                albumId: vm.album.id,
                isLoading: vm.isLoading,
                isMobile: vm.isMobile,
                sidebarOpen: vm.sidebarOpen,
                sidebarCollapsed: vm.sidebarCollapsed,
                memberId: memberId,
                windowWidth: $window.innerWidth,
                mobileBreakpoint: 768
            }
        });

        // Methods - Enhanced for beautiful reader
        vm.returnToAlbums = returnToAlbums;
        vm.navigateToAlbumList = navigateToAlbumList;
        vm.onImageError = onImageError;
        vm.selectSession = selectSession;
        vm.toggleSidebar = toggleSidebar;
        vm.closeSidebar = closeSidebar;
        vm.toggleSidebarCollapse = toggleSidebarCollapse;
        vm.toggleChapter = toggleChapter;
        vm.getChapterProgress = getChapterProgress;
        vm.navigateToPrevious = navigateToPrevious;
        vm.navigateToNext = navigateToNext;

        // Phase 2: Search Enhancement methods
        vm.onSearchKeyup = onSearchKeyup;
        vm.clearSearch = clearSearch;
        vm.getFilteredCategoriesWithSessions = getFilteredCategoriesWithSessions;
        vm.getFilteredUncategorizedSessions = getFilteredUncategorizedSessions;
        vm.getHighlightedContent = getHighlightedContent;

        // Phase 3: Enhanced Category Navigation methods
        vm.expandAll = expandAll;
        vm.collapseAll = collapseAll;
        vm.toggleAllExpanded = toggleAllExpanded;
        vm.toggleChapterProgrammatically = toggleChapterProgrammatically; // For expand/collapse all
        vm.getExpandedCategoriesCount = getExpandedCategoriesCount;
        vm.getTotalCategoriesCount = getTotalCategoriesCount;
        vm.getCompletedInCategory = getCompletedInCategory;
        vm.getCategoryProgressPercentage = getCategoryProgressPercentage;
        vm.hasCategories = hasCategories;

        // Phase 2: Reading Progress methods
        vm.markSessionComplete = markSessionComplete;
        vm.markSessionIncomplete = markSessionIncomplete;
        vm.isSessionComplete = isSessionComplete;
        vm.getCompletedSessionsCount = getCompletedSessionsCount;
        vm.getOverallProgress = getOverallProgress;

        // Phase 2: Session Bookmarking methods
        vm.toggleBookmark = toggleBookmark;
        vm.isSessionBookmarked = isSessionBookmarked;
        vm.getBookmarkedSessions = getBookmarkedSessions;
        
        // Phase 4: Bookmark View Management methods  
        vm.toggleBookmarksView = toggleBookmarksView;
        vm.unbookmarkSession = unbookmarkSession;
        vm.unbookmarkAllSessions = unbookmarkAllSessions;
        vm.getBookmarkCategoryData = getBookmarkCategoryData;
        vm.updateBookmarkViewData = updateBookmarkViewData;
        vm.updateFilteredCategoriesWithSessions = updateFilteredCategoriesWithSessions;
        vm.updateFilteredUncategorizedSessions = updateFilteredUncategorizedSessions;
        
        // Phase 2: Resume Session methods
        vm.getLastVisitedSession = getLastVisitedSession;
        vm.selectSessionWithResume = selectSessionWithResume;

        // Phase 2: Performance Optimization methods
        vm.clearSessionCache = clearSessionCache;
        vm.getPerformanceMetrics = getPerformanceMetrics;
        vm.scrollToTop = scrollToTop;
        vm.logPerformanceReport = logPerformanceReport;

        // Phase 2: Debug Testing Helper methods
        vm.testBookmarkFeatures = testBookmarkFeatures;
        vm.testPerformanceFeatures = testPerformanceFeatures;
        vm.showCurrentState = showCurrentState;

        activate();

        function activate() {
            console.log("DEBUG: " + controllerId + " activate() called", {
                albumId: albumId,
                memberId: memberId,
                stateParams: $scope.$stateParams,
                globalData: {
                    memberExists: !!gData.member,
                    memberId: gData.member ? gData.member.id : 'not found'
                },
                timestamp: new Date().toISOString()
            });

            // Validation with comprehensive debugging
            if (!albumId) {
                console.error("DEBUG: Missing albumId parameter", {
                    albumId: albumId,
                    stateParams: $scope.$stateParams,
                    controllerId: controllerId
                });
                logError("Missing albumId parameter, redirecting to albums", controllerId);
                $scope.stateGo("albums");
                return;
            }

            if (!memberId) {
                console.error("DEBUG: Missing memberId parameter", {
                    memberId: memberId,
                    globalData: gData,
                    member: gData.member,
                    controllerId: controllerId
                });
                logError("Missing memberId parameter, redirecting to albums", controllerId);
                $scope.stateGo("albums");
                return;
            }

            // Set initial page title
            $scope.setPageTitle("Loading Album Reader...");

            // Initialize mobile detection
            detectMobileAndSetup();

            console.log("DEBUG: Starting data loading promises", {
                controllerId: controllerId,
                albumId: albumId,
                memberId: memberId
            });

            var promises = [
                contentMgr.getAlbumDataById(albumId, memberId),
                contentMgr.getCategoriesForAlbum(albumId)
            ];

            console.log("DEBUG: Starting controller activation with promises", {
                promiseCount: promises.length,
                controllerId: controllerId
            });

            common.activateController(promises, controllerId)
                .then(onControllerActivation)
                .catch(onActivationError);

            function onControllerActivation(response) {
                console.log("DEBUG: Controller activation completed", {
                    response: response,
                    currentAlbum: contentMgr.currentAlbum,
                    categories: contentMgr.categories,
                    controllerId: controllerId
                });

                try {
                    // Check if we have album data
                    if (contentMgr.currentAlbum) {
                        console.log("DEBUG: Processing album data from contentManager", {
                            albumData: contentMgr.currentAlbum,
                            albumSessions: contentMgr.currentAlbum.sessions ? contentMgr.currentAlbum.sessions.length : 0,
                            controllerId: controllerId
                        });

                        // Update album data
                        vm.album = {
                            id: contentMgr.currentAlbum.id || albumId,
                            name: contentMgr.currentAlbum.name || "Unknown Album",
                            description: contentMgr.currentAlbum.description || "",
                            image: contentMgr.currentAlbum.Image || ""
                        };

                        vm.categories = contentMgr.categories || [];
                        vm.sessions = prepareSessionsForReader(contentMgr.currentAlbum.sessions || []);
                        vm.totalSessions = vm.sessions.length;

                        console.log("DEBUG: Album data processed", {
                            albumName: vm.album.name,
                            sessionCount: vm.sessions.length,
                            categoryCount: vm.categories.length,
                            controllerId: controllerId
                        });

                        // Organize sessions by categories
                        organizeSessions();

                        // Initialize cached properties to prevent infinite digest cycles
                        updateSearchResults();

                        vm.isLoading = false;

                        // Update page title
                        $scope.setPageTitle(vm.album.name + " - Reader");

                        // Auto-expand first chapter if available
                        autoExpandFirstChapter();

                        // Phase 2: Initialize search and progress tracking
                        initializePhase2Features();

                        // Phase 2: Auto-select session with resume capability
                        if (vm.sessions.length > 0) {
                            console.log("DEBUG: Auto-selecting session with resume capability", {
                                totalSessions: vm.sessions.length,
                                firstSession: vm.sessions[0],
                                controllerId: controllerId
                            });
                            selectSessionWithResume();
                        } else {
                            console.log("DEBUG: No sessions available for auto-selection", {
                                controllerId: controllerId
                            });
                        }

                        console.log("DEBUG: Reader initialization completed successfully", {
                            albumName: vm.album.name,
                            sessionCount: vm.sessions.length,
                            categoryCount: vm.categories.length,
                            controllerId: controllerId
                        });

                        // Phase 2: Performance Optimization initialization logging
                        console.log("DEBUG: Performance optimization features initialized", {
                            cacheMaxSize: vm.maxCacheSize,
                            currentCacheSize: Object.keys(vm.sessionContentCache).length,
                            performanceMetricsEnabled: !!vm.performanceMetrics,
                            scrollOptimizationEnabled: true,
                            preloadingEnabled: true,
                            controllerId: controllerId
                        });

                        // Phase 2: Session Bookmarking initialization logging
                        console.log("DEBUG: Session bookmarking system initialized", {
                            bookmarkingEnabled: true,
                            currentBookmarks: vm.sessionBookmarks ? Object.keys(vm.sessionBookmarks).length : 0,
                            persistenceMethod: 'localStorage',
                            controllerId: controllerId
                        });

                        // Phase 2: Setup performance monitoring
                        setupPerformanceMonitoring();

                        logSuccess("Beautiful Islam Reader loaded successfully", controllerId, config.showDevToasts);
                    } else {
                        console.warn("DEBUG: No album data returned from contentManager", {
                            response: response,
                            currentAlbum: contentMgr.currentAlbum,
                            albumId: albumId,
                            controllerId: controllerId
                        });
                        
                        // Set fallback album data
                        vm.album.name = "Album " + albumId;
                        vm.isLoading = false;
                        $scope.setPageTitle(vm.album.name + " - Reader");
                        logError("No album data found for albumId: " + albumId, controllerId);
                    }
                } catch (error) {
                    console.error("DEBUG: Error in onControllerActivation", {
                        error: error,
                        errorMessage: error.message,
                        stack: error.stack,
                        controllerId: controllerId
                    });
                    logError("Error in onControllerActivation: " + error.message, controllerId);
                    onActivationError(error);
                }
            }

            function onActivationError(error) {
                console.error("DEBUG: Controller activation failed", {
                    error: error,
                    errorMessage: error.message,
                    stack: error.stack,
                    albumId: albumId,
                    memberId: memberId,
                    controllerId: controllerId
                });
                vm.isLoading = false;
                vm.album.name = "Error Loading Album";
                $scope.setPageTitle("Error - Reader");
                logError("Failed to load album data: " + (error.message || error), controllerId);
            }
        }

        function detectMobileAndSetup() {
            console.log("DEBUG: detectMobileAndSetup() called", {
                windowWidth: $window.innerWidth,
                isMobile: vm.isMobile,
                controllerId: controllerId
            });

            // Debug mobile menu toggle visibility
            console.log("DEBUG: Mobile menu toggle visibility check", {
                isMobile: vm.isMobile,
                shouldShowToggle: vm.isMobile,
                windowWidth: $window.innerWidth,
                controllerId: controllerId
            });

            // Check for mobile menu toggle button in DOM after a delay (only if mobile)
            $timeout(function() {
                if (vm.isMobile) {
                    var mobileToggleButton = document.querySelector('.mobile-menu-toggle');
                    console.log("DEBUG: Mobile menu toggle DOM check", {
                        buttonExists: !!mobileToggleButton,
                        buttonVisible: mobileToggleButton ? mobileToggleButton.style.display !== 'none' : false,
                        buttonStyles: mobileToggleButton ? getComputedStyle(mobileToggleButton) : null,
                        isMobile: vm.isMobile,
                        controllerId: controllerId
                    });
                    
                    if (mobileToggleButton) {
                        console.log("DEBUG: Mobile menu toggle button found", {
                            offsetWidth: mobileToggleButton.offsetWidth,
                            offsetHeight: mobileToggleButton.offsetHeight,
                            display: getComputedStyle(mobileToggleButton).display,
                            visibility: getComputedStyle(mobileToggleButton).visibility,
                            position: getComputedStyle(mobileToggleButton).position,
                            zIndex: getComputedStyle(mobileToggleButton).zIndex,
                            controllerId: controllerId
                        });
                    } else {
                        console.warn("DEBUG: Mobile menu toggle button NOT found in DOM", {
                            isMobile: vm.isMobile,
                            shouldShow: vm.isMobile,
                            controllerId: controllerId
                        });
                    }
                } else {
                    console.log("DEBUG: Skipping mobile menu toggle check - not in mobile mode", {
                        isMobile: vm.isMobile,
                        windowWidth: $window.innerWidth,
                        controllerId: controllerId
                    });
                }
            }, 1000);

            // Window resize handler for responsive behavior
            angular.element($window).on('resize', function() {
                $scope.$apply(function() {
                    var wasMobile = vm.isMobile;
                    vm.isMobile = $window.innerWidth < 768;
                    
                    console.log("DEBUG: Window resized", {
                        windowWidth: $window.innerWidth,
                        wasMobile: wasMobile,
                        isMobile: vm.isMobile,
                        controllerId: controllerId
                    });

                    // Debug mobile menu toggle after resize
                    console.log("DEBUG: Mobile menu toggle after resize", {
                        shouldShowToggle: vm.isMobile,
                        wasMobile: wasMobile,
                        controllerId: controllerId
                    });

                    // Auto-close sidebar on mobile
                    if (vm.isMobile && vm.sidebarOpen) {
                        console.log("DEBUG: Auto-closing sidebar on mobile resize", {
                            controllerId: controllerId
                        });
                        vm.sidebarOpen = false;
                    }
                });
            });
        }

        function prepareSessionsForReader(sessions) {
            console.log("DEBUG: prepareSessionsForReader() called", {
                sessionCount: sessions ? sessions.length : 0,
                sessions: sessions,
                controllerId: controllerId
            });

            if (!sessions || !sessions.length) {
                console.log("DEBUG: No sessions to prepare", {
                    sessions: sessions,
                    controllerId: controllerId
                });
                return [];
            }

            var preparedSessions = sessions.map(function(session, index) {
                // Debug: Log all available session properties to identify correct name field
                console.log("DEBUG: Raw session object properties", {
                    sessionId: session.id,
                    availableProperties: Object.keys(session),
                    sessionData: session,
                    controllerId: controllerId
                });

                // Try multiple possible session name properties
                var sessionTitle = session.sessionName || session.name || session.SessionName || 
                                 session.title || session.displayName || ("Session " + (index + 1));

                // Try multiple possible category ID properties - Enhanced for proper categorization
                var categoryId = session.categoryId || session.CategoryId || session.CategoryID || 
                               session.category_id || session.groupCategoryId || session.GroupCategoryId || null;

                // Try multiple possible category name properties
                var categoryName = session.categoryName || session.CategoryName || session.category_name || 
                                 session.groupCategoryName || session.GroupCategoryName || null;

                var preparedSession = {
                    id: session.id,
                    displayTitle: sessionTitle,
                    categoryId: categoryId,
                    categoryName: categoryName,
                    sequence: session.sequence || index,
                    isCompleted: false, // Will be updated by updateSessionCompletionStatus()
                    isBookmarked: false, // Will be updated by updateBookmarkStatus()
                    estimatedMinutes: calculateReadingTime(session.summaryData),
                    content: null, // Will be loaded when selected
                    originalSession: session
                };

                console.log("DEBUG: Prepared session with enhanced category detection", {
                    sessionId: preparedSession.id,
                    displayTitle: preparedSession.displayTitle,
                    categoryId: preparedSession.categoryId,
                    categoryName: preparedSession.categoryName,
                    sequence: preparedSession.sequence,
                    sessionTitle: sessionTitle,
                    rawSessionCategoryProps: {
                        categoryId: session.categoryId,
                        CategoryId: session.CategoryId,
                        CategoryID: session.CategoryID,
                        category_id: session.category_id,
                        groupCategoryId: session.groupCategoryId,
                        GroupCategoryId: session.GroupCategoryId
                    },
                    controllerId: controllerId
                });

                return preparedSession;
            }).sort(function(a, b) {
                // Sort by sequence
                return (a.sequence || 0) - (b.sequence || 0);
            });

            console.log("DEBUG: Sessions prepared and sorted", {
                originalCount: sessions.length,
                preparedCount: preparedSessions.length,
                controllerId: controllerId
            });

            return preparedSessions;
        }

        function organizeSessions() {
            console.log("DEBUG: organizeSessions() called", {
                sessionCount: vm.sessions.length,
                categoryCount: vm.categories.length,
                sessions: vm.sessions,
                categories: vm.categories,
                controllerId: controllerId
            });

            vm.uncategorizedSessions = [];
            vm.categoriesWithSessions = [];

            // Enhanced debugging for categories and sessions
            console.log("DEBUG: Detailed category and session analysis", {
                categoriesDetails: vm.categories.map(function(cat) {
                    return { 
                        id: cat.id, 
                        name: cat.name,
                        allCategoryProperties: Object.keys(cat),
                        originalCategoryData: cat
                    };
                }),
                sessionsDetails: vm.sessions.map(function(sess) {
                    return { 
                        id: sess.id, 
                        title: sess.displayTitle, 
                        categoryId: sess.categoryId,
                        categoryName: sess.categoryName,
                        originalCategoryData: sess.originalSession ? {
                            categoryId: sess.originalSession.categoryId,
                            CategoryId: sess.originalSession.CategoryId,
                            CategoryID: sess.originalSession.CategoryID,
                            category_id: sess.originalSession.category_id,
                            groupCategoryId: sess.originalSession.groupCategoryId,
                            GroupCategoryId: sess.originalSession.GroupCategoryId
                        } : null
                    };
                }),
                controllerId: controllerId
            });

            // Organize sessions by categories - Enhanced with flexible property detection
            vm.categories.forEach(function(category) {
                // Try multiple possible category properties
                var categoryId = category.id || category.categoryId || category.CategoryId || category.CategoryID || category.groupCategoryId;
                var categoryName = category.name || category.categoryName || category.CategoryName || category.displayName || category.groupCategoryName;

                console.log("DEBUG: Processing category with enhanced property detection", {
                    categoryId: categoryId,
                    categoryName: categoryName,
                    allCategoryProperties: Object.keys(category),
                    originalCategory: category,
                    controllerId: controllerId
                });

                var categoryWithSessions = {
                    id: categoryId,
                    name: categoryName,
                    sessions: vm.sessions.filter(function(session) {
                        var matches = session.categoryId === categoryId;
                        console.log("DEBUG: Checking session against category", {
                            sessionId: session.id,
                            sessionTitle: session.displayTitle,
                            sessionCategoryId: session.categoryId,
                            categoryId: categoryId,
                            categoryName: categoryName,
                            matches: matches,
                            controllerId: controllerId
                        });
                        return matches;
                    })
                };
                
                console.log("DEBUG: Processing category", {
                    categoryId: categoryId,
                    categoryName: categoryName,
                    matchingSessions: categoryWithSessions.sessions.length,
                    matchingSessionTitles: categoryWithSessions.sessions.map(function(s) { return s.displayTitle; }),
                    categoryWithSessions: categoryWithSessions,
                    controllerId: controllerId
                });
                
                if (categoryWithSessions.sessions.length > 0) {
                    vm.categoriesWithSessions.push(categoryWithSessions);
                    console.log("DEBUG: Category added to categoriesWithSessions", {
                        categoryId: categoryId,
                        categoryName: categoryName,
                        sessionCount: categoryWithSessions.sessions.length,
                        controllerId: controllerId
                    });
                } else {
                    console.log("DEBUG: Category skipped (no sessions)", {
                        categoryId: categoryId,
                        categoryName: categoryName,
                        controllerId: controllerId
                    });
                }
            });

            // Find uncategorized sessions (sessions without a valid categoryId or with categoryId not in categories)
            vm.uncategorizedSessions = vm.sessions.filter(function(session) {
                if (!session.categoryId) {
                    console.log("DEBUG: Found uncategorized session (no categoryId)", {
                        sessionId: session.id,
                        sessionTitle: session.displayTitle,
                        controllerId: controllerId
                    });
                    return true;
                }
                
                // Enhanced check: Look for the session's categoryId using flexible property detection
                var categoryExists = vm.categories.some(function(cat) {
                    var categoryId = cat.id || cat.categoryId || cat.CategoryId || cat.CategoryID || cat.groupCategoryId;
                    var matches = categoryId === session.categoryId;
                    
                    console.log("DEBUG: Enhanced category existence check", {
                        sessionId: session.id,
                        sessionCategoryId: session.categoryId,
                        categoryId: categoryId,
                        categoryAllProps: Object.keys(cat),
                        matches: matches,
                        controllerId: controllerId
                    });
                    
                    return matches;
                });
                
                if (!categoryExists) {
                    console.log("DEBUG: Found uncategorized session (enhanced check - category not found)", {
                        sessionId: session.id,
                        sessionTitle: session.displayTitle,
                        categoryId: session.categoryId,
                        availableCategories: vm.categories.map(function(cat) {
                            return {
                                id: cat.id,
                                categoryId: cat.categoryId,
                                CategoryId: cat.CategoryId,
                                name: cat.name,
                                allProps: Object.keys(cat)
                            };
                        }),
                        controllerId: controllerId
                    });
                    return true;
                }
                
                console.log("DEBUG: Session properly categorized", {
                    sessionId: session.id,
                    sessionTitle: session.displayTitle,
                    categoryId: session.categoryId,
                    controllerId: controllerId
                });
                
                return false;
            });

            console.log("DEBUG: Sessions organized", {
                categoriesWithSessions: vm.categoriesWithSessions.length,
                uncategorizedSessions: vm.uncategorizedSessions.length,
                totalSessionsAfterOrganization: vm.sessions.length,
                categoriesWithSessionsDetails: vm.categoriesWithSessions,
                uncategorizedSessionsDetails: vm.uncategorizedSessions,
                controllerId: controllerId
            });
        }

        function autoExpandFirstChapter() {
            console.log("DEBUG: autoExpandFirstChapter() called - collapsing all categories by default", {
                categoriesWithSessions: vm.categoriesWithSessions.length,
                uncategorizedSessions: vm.uncategorizedSessions.length,
                controllerId: controllerId
            });

            // Phase 4: Collapse ALL categories by default - only expand category containing selected session
            if (vm.categoriesWithSessions && vm.categoriesWithSessions.length > 0) {
                vm.categoriesWithSessions.forEach(function(category) {
                    vm.expandedChapters[category.id] = false; // Collapse all by default
                    console.log("DEBUG: Collapsed category", {
                        categoryId: category.id,
                        categoryName: category.name,
                        controllerId: controllerId
                    });
                });
            }

            // Collapse uncategorized section by default
            vm.expandedChapters['uncategorized'] = false;
            console.log("DEBUG: Collapsed uncategorized chapter", {
                controllerId: controllerId
            });

            // Update category controls state
            updateCategoryControlsState();
            
            console.log("DEBUG: autoExpandFirstChapter() completed - all categories collapsed by default", {
                expandedCount: vm.categoryControls.expandedCount,
                totalCount: vm.categoryControls.totalCount,
                allExpanded: vm.categoryControls.allExpanded,
                controllerId: controllerId
            });
        }

        function calculateReadingTime(summaryData) {
            if (!summaryData || !summaryData.length) {
                console.log("DEBUG: calculateReadingTime - no summary data", {
                    summaryData: summaryData,
                    controllerId: controllerId
                });
                return 0;
            }
            
            var totalWords = 0;
            summaryData.forEach(function(summary) {
                if (summary.content) {
                    // Strip HTML and count words
                    var textContent = summary.content.replace(/<[^>]*>/g, '');
                    var words = textContent.trim().split(/\s+/).length;
                    totalWords += words;
                }
            });
            
            // Average reading speed: 200 words per minute
            var estimatedMinutes = Math.ceil(totalWords / 200);
            
            console.log("DEBUG: calculateReadingTime result", {
                totalWords: totalWords,
                estimatedMinutes: estimatedMinutes,
                summaryCount: summaryData.length,
                controllerId: controllerId
            });
            
            return estimatedMinutes;
        }

        function selectSession(session) {
            console.log("DEBUG: selectSession() called - COMPREHENSIVE ANALYSIS", {
                sessionProvided: !!session,
                sessionId: session ? session.id : null,
                sessionTitle: session ? session.displayTitle : null,
                currentSelectedId: vm.selectedSessionId,
                sessionProperties: session ? Object.keys(session) : [],
                sessionObjectDump: session ? JSON.stringify(session, null, 2) : "NULL",
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });

            if (!session) {
                console.warn("DEBUG: selectSession called with null session - DETAILED", {
                    argumentsLength: arguments.length,
                    argumentsArray: Array.from(arguments),
                    stackTrace: new Error().stack,
                    controllerId: controllerId
                });
                return;
            }

            vm.selectedSessionId = session.id;
            vm.selectedSession = session;
            vm.currentSessionIndex = vm.sessions.findIndex(function(s) { return s.id === session.id; });
            
            // Update navigation state
            vm.hasPrevious = vm.currentSessionIndex > 0;
            vm.hasNext = vm.currentSessionIndex < vm.sessions.length - 1;

            console.log("DEBUG: Session selection updated - DETAILED STATE", {
                selectedSessionId: vm.selectedSessionId,
                currentSessionIndex: vm.currentSessionIndex,
                hasPrevious: vm.hasPrevious,
                hasNext: vm.hasNext,
                totalSessions: vm.sessions.length,
                sessionHasContent: !!(session && session.content),
                sessionContentLength: session && session.content ? session.content.length : 0,
                vm_selectedSession_exists: !!vm.selectedSession,
                vm_selectedSession_id: vm.selectedSession ? vm.selectedSession.id : "NULL",
                vm_selectedSession_hasContent: !!(vm.selectedSession && vm.selectedSession.content),
                vm_selectedSession_contentLength: vm.selectedSession && vm.selectedSession.content ? vm.selectedSession.content.length : 0,
                controllerId: controllerId
            });

            // Close sidebar on mobile after selection
            if (vm.isMobile) {
                console.log("DEBUG: Closing sidebar on mobile after session selection", {
                    controllerId: controllerId
                });
                vm.sidebarOpen = false;
            }

            // Update bookmark status for selected session
            updateBookmarkStatus();

            // Phase 4: Expand the category containing the selected session
            expandCategoryForSession(session);

            // Phase 2: Save as last visited session for resume feature
            saveLastVisitedSession(session);

            // Scroll to top of page when session changes
            console.log("DEBUG: Scrolling to top after session selection", {
                sessionId: session.id,
                sessionTitle: session.displayTitle,
                controllerId: controllerId
            });
            $timeout(function() {
                $window.scrollTo(0, 0);
            }, 100); // Small delay to ensure content has rendered

            // Load session content
            loadSessionContent(session);
        }

        function loadSessionContent(session) {
            var startTime = performance.now();
            
            console.log("DEBUG: loadSessionContent() called", {
                sessionId: session.id,
                sessionTitle: session.displayTitle,
                hasOriginalSession: !!session.originalSession,
                cacheSize: Object.keys(vm.sessionContentCache).length,
                isInCache: !!vm.sessionContentCache[session.id],
                controllerId: controllerId
            });

            vm.isLoadingSession = true;

            // Check cache first for performance optimization
            if (vm.sessionContentCache[session.id]) {
                console.log("DEBUG: Loading session content from cache", {
                    sessionId: session.id,
                    sessionTitle: session.displayTitle,
                    controllerId: controllerId
                });

                vm.selectedSession.content = vm.sessionContentCache[session.id];
                vm.isLoadingSession = false;
                
                // Record cache hit
                vm.performanceMetrics.cacheHits++;
                var loadTime = performance.now() - startTime;
                vm.performanceMetrics.loadTimes[session.id] = loadTime;

                console.log("DEBUG: Session content loaded from cache successfully", {
                    sessionId: session.id,
                    loadTime: loadTime + "ms",
                    cacheHits: vm.performanceMetrics.cacheHits,
                    controllerId: controllerId
                });

                // Trigger smooth scroll to top
                scrollToTop();
                
                // Preload next session in background
                preloadNextSession();
                
                return;
            }

            // Record cache miss
            vm.performanceMetrics.cacheMisses++;

            try {
                // Load session content directly from transcript API (not summary)
                var memberId = gData.member.id;
                vm.isLoadingSession = true;

                console.log("DEBUG: Loading fresh session content via datacontext", {
                    sessionId: session.id,
                    memberId: memberId,
                    controllerId: controllerId
                });

                // Load session transcript data (not summary) - FIXED: Use getSessionTranscript instead of getSessionSummary
                datacontext.getSessionTranscript(session.id).then(function(response) {
                        console.log("DEBUG: Session transcript API response received", {
                            sessionId: session.id,
                            hasTranscript: !!(response && response.data && response.data.transcript),
                            transcriptLength: response && response.data && response.data.transcript ? response.data.transcript.length : 0,
                            controllerId: controllerId
                        });

                        var content = "";
                        if (response && response.data && response.data.transcript) {
                            content = response.data.transcript;
                            console.log("DEBUG: Transcript content loaded successfully", {
                                sessionId: session.id,
                                transcriptLength: content.length,
                                controllerId: controllerId
                            });
                        } else {
                            console.warn("DEBUG: No transcript content found in API response", {
                                sessionId: session.id,
                                hasResponse: !!response,
                                hasData: !!(response && response.data),
                                controllerId: controllerId
                            });
                        }
                        
                        session.content = content || "<p>No content available for this session.</p>";
                        vm.isLoadingSession = false;
                        
                        // Cache the content for performance
                        cacheSessionContent(session.id, session.content);
                        
                        // Record performance metrics
                        var loadTime = performance.now() - startTime;
                        vm.performanceMetrics.loadTimes[session.id] = loadTime;
                        
                        console.log("DEBUG: Session content loaded successfully", {
                            sessionId: session.id,
                            contentLength: session.content.length,
                            loadTime: loadTime + "ms",
                            hasRealContent: session.content !== "<p>No content available for this session.</p>",
                            controllerId: controllerId
                        });

                        // Trigger smooth scroll to top
                        scrollToTop();
                        
                        // Preload next session in background
                        preloadNextSession();
                    }).catch(function(error) {
                        console.error("DEBUG: Error loading session content", {
                            sessionId: session.id,
                            errorMessage: error.message,
                            controllerId: controllerId
                        });

                        session.content = "<p>Error loading session content.</p>";
                        vm.isLoadingSession = false;
                        logError("Error loading session content: " + error.message, controllerId);
                    });
            } catch (error) {
                console.error("DEBUG: Exception in loadSessionContent", {
                    sessionId: session.id,
                    errorMessage: error.message,
                    controllerId: controllerId
                });

                session.content = "<p>Error loading session content.</p>";
                vm.isLoadingSession = false;
                logError("Exception in loadSessionContent: " + error.message, controllerId);
            }
        }

        function toggleSidebar() {
            console.log("DEBUG: toggleSidebar() called", {
                currentState: vm.sidebarOpen,
                isMobile: vm.isMobile,
                controllerId: controllerId
            });

            vm.sidebarOpen = !vm.sidebarOpen;
            
            console.log("DEBUG: Sidebar toggled", {
                newState: vm.sidebarOpen,
                controllerId: controllerId
            });
        }

        function closeSidebar() {
            console.log("DEBUG: closeSidebar() called", {
                currentState: vm.sidebarOpen,
                controllerId: controllerId
            });

            if (vm.sidebarOpen) {
                vm.sidebarOpen = false;
                console.log("DEBUG: Sidebar closed", {
                    controllerId: controllerId
                });
            }
        }

        function toggleSidebarCollapse() {
            console.log("DEBUG: toggleSidebarCollapse() called", {
                currentState: vm.sidebarCollapsed,
                controllerId: controllerId
            });

            vm.sidebarCollapsed = !vm.sidebarCollapsed;
            
            console.log("DEBUG: Sidebar collapse toggled", {
                newState: vm.sidebarCollapsed,
                controllerId: controllerId
            });
        }

        function toggleChapter(chapterId) {
            console.log("DEBUG: toggleChapter() called", {
                chapterId: chapterId,
                currentState: vm.expandedChapters[chapterId],
                controllerId: controllerId
            });

            // Check if this is a manual user click (single expansion mode)
            // vs. programmatic expansion (like expand all)
            var isManualClick = true; // Default to single expansion for individual clicks
            
            if (isManualClick) {
                // Only allow one chapter to be expanded at a time for manual clicks
                // First, collapse all other chapters
                for (var key in vm.expandedChapters) {
                    if (key !== chapterId) {
                        vm.expandedChapters[key] = false;
                    }
                }
            }

            // Then toggle the requested chapter
            vm.expandedChapters[chapterId] = !vm.expandedChapters[chapterId];
            
            console.log("DEBUG: Chapter toggled", {
                chapterId: chapterId,
                newState: vm.expandedChapters[chapterId],
                singleExpansionMode: isManualClick,
                allExpandedStates: vm.expandedChapters,
                controllerId: controllerId
            });
            
            // Update category controls state
            updateCategoryControlsState();
        }

        function getChapterProgress(chapterId) {
            var sessions = [];
            if (chapterId === 'uncategorized') {
                sessions = vm.uncategorizedSessions;
            } else {
                var category = vm.categoriesWithSessions.find(function(cat) { return cat.id === chapterId; });
                sessions = category ? category.sessions : [];
            }

            var completedSessions = sessions.filter(function(session) { return session.isCompleted; }).length;
            var progressText = completedSessions + "/" + sessions.length;
            
            console.log("DEBUG: getChapterProgress result", {
                chapterId: chapterId,
                totalSessions: sessions.length,
                completedSessions: completedSessions,
                progressText: progressText,
                controllerId: controllerId
            });
            
            return progressText;
        }

        // Helper function for programmatic category expansion (used by expand/collapse all)
        function toggleChapterProgrammatically(chapterId, shouldExpand) {
            console.log("DEBUG: toggleChapterProgrammatically() called", {
                chapterId: chapterId,
                shouldExpand: shouldExpand,
                currentState: vm.expandedChapters[chapterId],
                controllerId: controllerId
            });

            vm.expandedChapters[chapterId] = shouldExpand;
            
            console.log("DEBUG: Chapter programmatically set", {
                chapterId: chapterId,
                newState: vm.expandedChapters[chapterId],
                controllerId: controllerId
            });
        }

        // Phase 3: Enhanced Category Navigation Functions
        function expandAll() {
            console.log("DEBUG: expandAll() called", {
                currentExpandedCount: vm.categoryControls.expandedCount,
                totalCategories: vm.categoryControls.totalCount,
                controllerId: controllerId
            });

            // Expand all categories (full expand all functionality)
            if (vm.categoriesWithSessions) {
                vm.categoriesWithSessions.forEach(function(category) {
                    toggleChapterProgrammatically(category.id, true);
                });
            }
            
            // Expand uncategorized sessions if they exist
            if (vm.uncategorizedSessions && vm.uncategorizedSessions.length > 0) {
                toggleChapterProgrammatically('uncategorized', true);
            }

            updateCategoryControlsState();
            
            console.log("DEBUG: expandAll() completed", {
                newExpandedCount: vm.categoryControls.expandedCount,
                allExpandedStates: vm.expandedChapters,
                controllerId: controllerId
            });
        }

        function collapseAll() {
            console.log("DEBUG: collapseAll() called", {
                currentExpandedCount: vm.categoryControls.expandedCount,
                totalCategories: vm.categoryControls.totalCount,
                controllerId: controllerId
            });

            // Collapse all categories
            if (vm.categoriesWithSessions) {
                vm.categoriesWithSessions.forEach(function(category) {
                    toggleChapterProgrammatically(category.id, false);
                });
            }
            
            // Collapse uncategorized
            toggleChapterProgrammatically('uncategorized', false);

            vm.categoryControls.allExpanded = false;
            updateCategoryControlsState();
            
            console.log("DEBUG: collapseAll() completed", {
                newExpandedCount: vm.categoryControls.expandedCount,
                allExpanded: vm.categoryControls.allExpanded,
                controllerId: controllerId
            });
        }

        function toggleAllExpanded() {
            console.log("DEBUG: toggleAllExpanded() called", {
                currentState: vm.categoryControls.allExpanded,
                expandedCount: vm.categoryControls.expandedCount,
                controllerId: controllerId
            });

            if (vm.categoryControls.allExpanded) {
                collapseAll();
            } else {
                expandAll();
            }
        }

        function getExpandedCategoriesCount() {
            var count = 0;
            
            // Count expanded categories
            if (vm.categoriesWithSessions) {
                vm.categoriesWithSessions.forEach(function(category) {
                    if (vm.expandedChapters[category.id]) {
                        count++;
                    }
                });
            }
            
            // Count uncategorized if expanded
            if (vm.expandedChapters['uncategorized']) {
                count++;
            }
            
            return count;
        }

        function getTotalCategoriesCount() {
            var count = 0;
            
            // Count all categories
            if (vm.categoriesWithSessions) {
                count += vm.categoriesWithSessions.length;
            }
            
            // Count uncategorized if it has sessions
            if (vm.uncategorizedSessions && vm.uncategorizedSessions.length > 0) {
                count++;
            }
            
            return count;
        }

        function getCompletedInCategory(categoryId) {
            var sessions = [];
            
            if (categoryId === 'uncategorized') {
                sessions = vm.uncategorizedSessions || [];
            } else {
                var category = vm.categoriesWithSessions ? vm.categoriesWithSessions.find(function(cat) { 
                    return cat.id === categoryId; 
                }) : null;
                sessions = category ? category.sessions : [];
            }

            var completedCount = sessions.filter(function(session) { 
                return session.isCompleted; 
            }).length;
            
            return completedCount;
        }

        function getCategoryProgressPercentage(categoryId) {
            var sessions = [];
            
            if (categoryId === 'uncategorized') {
                sessions = vm.uncategorizedSessions || [];
            } else {
                var category = vm.categoriesWithSessions ? vm.categoriesWithSessions.find(function(cat) { 
                    return cat.id === categoryId; 
                }) : null;
                sessions = category ? category.sessions : [];
            }

            if (sessions.length === 0) {
                return 0;
            }

            var completedCount = sessions.filter(function(session) { 
                return session.isCompleted; 
            }).length;
            
            return Math.round((completedCount / sessions.length) * 100);
        }

        function hasCategories() {
            // Phase 4: Show category controls if there are categories OR if there are any sessions (for bookmark view)
            var hasActualCategories = vm.categoryControls.hasCategories;
            var hasAnyBookmarks = Object.keys(vm.sessionBookmarks).length > 0;
            var hasAnySessions = vm.sessions.length > 0;
            
            var shouldShowControls = hasActualCategories || hasAnyBookmarks || hasAnySessions;
            
            console.log("DEBUG: hasCategories() check", {
                hasActualCategories: hasActualCategories,
                hasAnyBookmarks: hasAnyBookmarks,
                hasAnySessions: hasAnySessions,
                shouldShowControls: shouldShowControls,
                showBookmarksView: vm.showBookmarksView,
                controllerId: controllerId
            });
            
            return shouldShowControls;
        }

        function updateCategoryControlsState() {
            vm.categoryControls.expandedCount = getExpandedCategoriesCount();
            vm.categoryControls.totalCount = getTotalCategoriesCount();
            vm.categoryControls.hasCategories = vm.categoryControls.totalCount > 0;
            
            // Update allExpanded state based on actual expanded count
            vm.categoryControls.allExpanded = vm.categoryControls.expandedCount === vm.categoryControls.totalCount;
            
            console.log("DEBUG: updateCategoryControlsState() completed", {
                expandedCount: vm.categoryControls.expandedCount,
                totalCount: vm.categoryControls.totalCount,
                hasCategories: vm.categoryControls.hasCategories,
                allExpanded: vm.categoryControls.allExpanded,
                controllerId: controllerId
            });
        }

        function navigateToPrevious() {
            console.log("DEBUG: navigateToPrevious() called", {
                currentIndex: vm.currentSessionIndex,
                hasPrevious: vm.hasPrevious,
                controllerId: controllerId
            });

            if (vm.hasPrevious && vm.currentSessionIndex > 0) {
                var previousSession = vm.sessions[vm.currentSessionIndex - 1];
                console.log("DEBUG: Navigating to previous session", {
                    previousSessionId: previousSession.id,
                    previousSessionTitle: previousSession.displayTitle,
                    controllerId: controllerId
                });
                selectSession(previousSession);
            } else {
                console.log("DEBUG: Cannot navigate to previous - no previous session available", {
                    currentIndex: vm.currentSessionIndex,
                    hasPrevious: vm.hasPrevious,
                    controllerId: controllerId
                });
            }
        }

        function navigateToNext() {
            console.log("DEBUG: navigateToNext() called", {
                currentIndex: vm.currentSessionIndex,
                hasNext: vm.hasNext,
                totalSessions: vm.totalSessions,
                controllerId: controllerId
            });

            if (vm.hasNext && vm.currentSessionIndex < vm.sessions.length - 1) {
                // Mark current session as completed before navigating to next
                var currentSession = vm.sessions[vm.currentSessionIndex];
                if (currentSession && currentSession.id) {
                    console.log("DEBUG: Marking current session as complete before navigation", {
                        currentSessionId: currentSession.id,
                        currentSessionTitle: currentSession.displayTitle,
                        controllerId: controllerId
                    });
                    markSessionComplete(currentSession.id);
                }

                var nextSession = vm.sessions[vm.currentSessionIndex + 1];
                console.log("DEBUG: Navigating to next session", {
                    nextSessionId: nextSession.id,
                    nextSessionTitle: nextSession.displayTitle,
                    controllerId: controllerId
                });
                selectSession(nextSession);
            } else {
                console.log("DEBUG: Cannot navigate to next - no next session available", {
                    currentIndex: vm.currentSessionIndex,
                    hasNext: vm.hasNext,
                    totalSessions: vm.totalSessions,
                    controllerId: controllerId
                });
            }
        }

        function returnToAlbums() {
            console.log("DEBUG: returnToAlbums() called", {
                controllerId: controllerId
            });

            try {
                $scope.stateGo("albums");
                console.log("DEBUG: Navigation to albums initiated", {
                    controllerId: controllerId
                });
            } catch (error) {
                console.error("DEBUG: Error in returnToAlbums", {
                    error: error,
                    errorMessage: error.message,
                    stack: error.stack,
                    controllerId: controllerId
                });
                logError("Error navigating to albums: " + error.message, controllerId);
            }
        }

        function navigateToAlbumList() {
            console.log("DEBUG: navigateToAlbumList() called from breadcrumb", {
                controllerId: controllerId,
                currentAlbum: vm.album.name,
                albumId: vm.album.id,
                timestamp: new Date().toISOString()
            });

            try {
                $scope.stateGo("albums");
                console.log("DEBUG: Breadcrumb navigation to album list initiated", {
                    controllerId: controllerId,
                    targetState: "albums"
                });
                logSuccess("Navigating back to album list", controllerId);
            } catch (error) {
                console.error("DEBUG: Error in navigateToAlbumList", {
                    error: error,
                    errorMessage: error.message,
                    stack: error.stack,
                    controllerId: controllerId
                });
                logError("Error navigating to album list: " + error.message, controllerId);
            }
        }

        function onImageError() {
            console.log("DEBUG: onImageError() called", {
                albumId: vm.album.id,
                currentImage: vm.album.image,
                controllerId: controllerId
            });

            vm.album.image = "";
        }

        // ========================================================================
        // Phase 2: Search Enhancement Implementation
        // ========================================================================

        function onSearchKeyup() {
            console.log("DEBUG: onSearchKeyup() called", {
                searchText: vm.searchText,
                searchLength: vm.searchText ? vm.searchText.length : 0,
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });

            // Update search results in real-time
            updateSearchResults();
            
            // Force Angular to update the UI if needed
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }

        function clearSearch() {
            console.log("DEBUG: clearSearch() called", {
                previousSearchText: vm.searchText,
                controllerId: controllerId
            });

            vm.searchText = "";
            updateSearchResults();
            
            // Force Angular to update the UI
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            
            console.log("DEBUG: Search cleared", {
                searchText: vm.searchText,
                totalResults: vm.searchResults.totalFound,
                controllerId: controllerId
            });
        }

        function updateSearchResults() {
            console.log("DEBUG: updateSearchResults() called", {
                searchText: vm.searchText,
                hasSearchText: !!vm.searchText && vm.searchText.length > 0,
                controllerId: controllerId
            });

            if (!vm.searchText || vm.searchText.length === 0) {
                // No search text - show all (map to filteredSessions structure for template compatibility)
                vm.searchResults.categories = vm.categoriesWithSessions.map(function(category) {
                    return {
                        id: category.id,
                        name: category.name,
                        sessions: category.sessions,
                        filteredSessions: category.sessions // Template expects filteredSessions
                    };
                });
                vm.searchResults.uncategorizedSessions = vm.uncategorizedSessions;
                vm.searchResults.totalFound = vm.totalSessions;
                
                // Update cached properties to prevent infinite digest
                updateFilteredCategoriesWithSessions();
                updateFilteredUncategorizedSessions();
                
                console.log("DEBUG: Empty search - showing all sessions", {
                    totalCategories: vm.searchResults.categories.length,
                    totalUncategorized: vm.searchResults.uncategorizedSessions.length,
                    totalFound: vm.searchResults.totalFound,
                    controllerId: controllerId
                });
                return;
            }

            var searchLower = vm.searchText.toLowerCase();
            var filteredCategories = [];
            var filteredUncategorized = [];
            var totalFound = 0;

            console.log("DEBUG: Starting search with term", {
                searchTerm: vm.searchText,
                searchLower: searchLower,
                totalCategories: vm.categoriesWithSessions.length,
                totalUncategorized: vm.uncategorizedSessions.length,
                controllerId: controllerId
            });

            // Filter categories and their sessions
            vm.categoriesWithSessions.forEach(function(category) {
                var filteredSessions = category.sessions.filter(function(session) {
                    return isSessionMatchingSearch(session, searchLower);
                });

                if (filteredSessions.length > 0) {
                    filteredCategories.push({
                        id: category.id,
                        name: category.name,
                        sessions: filteredSessions,
                        filteredSessions: filteredSessions // Template expects filteredSessions
                    });
                    totalFound += filteredSessions.length;
                    
                    console.log("DEBUG: Category with matching sessions", {
                        categoryName: category.name,
                        matchingSessionsCount: filteredSessions.length,
                        sessionTitles: filteredSessions.map(function(s) { return s.displayTitle; }),
                        controllerId: controllerId
                    });
                }
            });

            // Filter uncategorized sessions
            filteredUncategorized = vm.uncategorizedSessions.filter(function(session) {
                return isSessionMatchingSearch(session, searchLower);
            });
            totalFound += filteredUncategorized.length;

            if (filteredUncategorized.length > 0) {
                console.log("DEBUG: Uncategorized sessions matching search", {
                    matchingSessionsCount: filteredUncategorized.length,
                    sessionTitles: filteredUncategorized.map(function(s) { return s.displayTitle; }),
                    controllerId: controllerId
                });
            }

            vm.searchResults.categories = filteredCategories;
            vm.searchResults.uncategorizedSessions = filteredUncategorized;
            vm.searchResults.totalFound = totalFound;

            // Update cached properties to prevent infinite digest
            updateFilteredCategoriesWithSessions();
            updateFilteredUncategorizedSessions();

            console.log("DEBUG: Search results updated", {
                searchText: vm.searchText,
                filteredCategories: vm.searchResults.categories.length,
                filteredUncategorized: vm.searchResults.uncategorizedSessions.length,
                totalFound: vm.searchResults.totalFound,
                originalTotal: vm.totalSessions,
                controllerId: controllerId
            });
        }

        function isSessionMatchingSearch(session, searchLower) {
            console.log("DEBUG: isSessionMatchingSearch() called", {
                sessionId: session.id,
                sessionTitle: session.displayTitle,
                searchTerm: searchLower,
                hasContent: !!session.content,
                hasOriginalSession: !!session.originalSession,
                controllerId: controllerId
            });

            // Search in session title
            var titleMatch = session.displayTitle.toLowerCase().indexOf(searchLower) !== -1;
            
            // Search in session description if available
            var descriptionMatch = false;
            if (session.description) {
                descriptionMatch = session.description.toLowerCase().indexOf(searchLower) !== -1;
            }

            // Search in loaded content if available
            var contentMatch = false;
            if (session.content) {
                var cleanContent = stripHtmlAndNormalize(session.content);
                contentMatch = cleanContent.toLowerCase().indexOf(searchLower) !== -1;
                
                console.log("DEBUG: Content search performed", {
                    sessionId: session.id,
                    contentLength: session.content.length,
                    cleanContentLength: cleanContent.length,
                    contentMatch: contentMatch,
                    contentPreview: cleanContent.substring(0, 100) + "...",
                    controllerId: controllerId
                });
            }

            // Search in original session summaryData for comprehensive multilingual search
            var summaryMatch = false;
            if (session.originalSession && session.originalSession.summaryData) {
                for (var i = 0; i < session.originalSession.summaryData.length; i++) {
                    var summary = session.originalSession.summaryData[i];
                    if (summary.content) {
                        var cleanSummaryContent = stripHtmlAndNormalize(summary.content);
                        if (cleanSummaryContent.toLowerCase().indexOf(searchLower) !== -1) {
                            summaryMatch = true;
                            console.log("DEBUG: Summary content match found", {
                                sessionId: session.id,
                                summaryIndex: i,
                                summaryContentLength: summary.content.length,
                                cleanContentLength: cleanSummaryContent.length,
                                matchPosition: cleanSummaryContent.toLowerCase().indexOf(searchLower),
                                contentPreview: cleanSummaryContent.substring(0, 100) + "...",
                                controllerId: controllerId
                            });
                            break;
                        }
                    }
                }
            }

            var isMatch = titleMatch || descriptionMatch || contentMatch || summaryMatch;
            
            console.log("DEBUG: Session search result", {
                sessionId: session.id,
                sessionTitle: session.displayTitle,
                titleMatch: titleMatch,
                descriptionMatch: descriptionMatch,
                contentMatch: contentMatch,
                summaryMatch: summaryMatch,
                finalMatch: isMatch,
                controllerId: controllerId
            });

            return isMatch;
        }

        function stripHtmlAndNormalize(htmlContent) {
            if (!htmlContent) {
                return "";
            }

            try {
                // Create a temporary div to parse HTML content
                var tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlContent;
                
                // Extract text content (removes all HTML tags)
                var textContent = tempDiv.textContent || tempDiv.innerText || '';
                
                // Normalize whitespace and Arabic text
                var normalizedText = textContent
                    .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
                    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
                    .replace(/[\u064B-\u0652]/g, '') // Remove Arabic diacritics (optional for broader search)
                    .trim();

                console.log("DEBUG: HTML stripped and normalized", {
                    originalLength: htmlContent.length,
                    textContentLength: textContent.length,
                    normalizedLength: normalizedText.length,
                    originalPreview: htmlContent.substring(0, 50) + "...",
                    normalizedPreview: normalizedText.substring(0, 50) + "...",
                    containsArabic: /[\u0600-\u06FF]/.test(normalizedText),
                    containsEnglish: /[a-zA-Z]/.test(normalizedText),
                    controllerId: controllerId
                });

                return normalizedText;
            } catch (error) {
                console.error("DEBUG: Error in stripHtmlAndNormalize", {
                    error: error,
                    htmlContent: htmlContent.substring(0, 100),
                    controllerId: controllerId
                });
                
                // Fallback: simple regex-based HTML stripping
                return htmlContent
                    .replace(/<[^>]*>/g, '') // Remove HTML tags
                    .replace(/\s+/g, ' ')    // Normalize whitespace
                    .trim();
            }
        }

        function getHighlightedContent() {
            console.log("DEBUG: getHighlightedContent() called - COMPREHENSIVE", {
                hasSelectedSession: !!vm.selectedSession,
                selectedSessionId: vm.selectedSession ? vm.selectedSession.id : null,
                hasContent: !!(vm.selectedSession && vm.selectedSession.content),
                contentLength: vm.selectedSession && vm.selectedSession.content ? vm.selectedSession.content.length : 0,
                contentPreview: vm.selectedSession && vm.selectedSession.content ? 
                    vm.selectedSession.content.substring(0, 200) + "..." : "NO CONTENT",
                hasSearchText: !!vm.searchText && vm.searchText.length > 0,
                searchText: vm.searchText,
                sessionObjectKeys: vm.selectedSession ? Object.keys(vm.selectedSession) : [],
                controllerId: controllerId
            });

            // If no session selected or no search text, return original content
            if (!vm.selectedSession || !vm.selectedSession.content || !vm.searchText || vm.searchText.length === 0) {
                var reason = !vm.selectedSession ? "no session" : 
                           !vm.selectedSession.content ? "no content" : "no search text";
                
                console.log("DEBUG: No highlighting needed - returning original content", {
                    reason: reason,
                    willReturnEmpty: !vm.selectedSession,
                    contentToReturn: vm.selectedSession ? vm.selectedSession.content.substring(0, 100) + "..." : "EMPTY",
                    controllerId: controllerId
                });
                return vm.selectedSession ? vm.selectedSession.content : "";
            }

            try {
                var content = vm.selectedSession.content;
                var searchTerm = vm.searchText.trim();
                
                if (searchTerm.length === 0) {
                    return content;
                }

                console.log("DEBUG: Highlighting search term in content", {
                    searchTerm: searchTerm,
                    contentLength: content.length,
                    contentPreview: content.substring(0, 100) + "...",
                    controllerId: controllerId
                });

                // Escape special regex characters in search term
                var escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                
                // Create regex for case-insensitive global search
                // Use word boundary for more precise matching, but also allow partial matches
                var regex = new RegExp('(' + escapedSearchTerm + ')', 'gi');
                
                // Highlight matches with span element and add data attributes for scrolling
                var highlightedContent = content.replace(regex, '<span class="search-highlight" data-search-match="true">$1</span>');
                
                // Count total matches for debugging
                var matches = content.match(regex) || [];
                
                console.log("DEBUG: Content highlighting completed", {
                    searchTerm: searchTerm,
                    totalMatches: matches.length,
                    originalLength: content.length,
                    highlightedLength: highlightedContent.length,
                    sampleMatches: matches.slice(0, 3), // Show first 3 matches
                    controllerId: controllerId
                });

                // Schedule scroll to first highlight after DOM update
                if (matches.length > 0) {
                    common.$timeout(function() {
                        scrollToFirstHighlight();
                    }, 100);
                }

                return highlightedContent;
                
            } catch (error) {
                console.error("DEBUG: Error in getHighlightedContent", {
                    error: error,
                    searchText: vm.searchText,
                    hasContent: !!vm.selectedSession.content,
                    controllerId: controllerId
                });
                
                // Return original content on error
                return vm.selectedSession.content;
            }
        }

        function scrollToFirstHighlight() {
            console.log("DEBUG: scrollToFirstHighlight() called", {
                controllerId: controllerId
            });

            try {
                // Find the first search highlight in the content
                var firstHighlight = document.querySelector('.content-body .search-highlight[data-search-match="true"]');
                
                if (firstHighlight) {
                    console.log("DEBUG: Scrolling to first search highlight", {
                        highlightText: firstHighlight.textContent,
                        offsetTop: firstHighlight.offsetTop,
                        controllerId: controllerId
                    });

                    // Scroll the highlight into view with smooth behavior
                    firstHighlight.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                    
                    // Add a temporary pulse effect to draw attention
                    firstHighlight.classList.add('search-highlight-pulse');
                    common.$timeout(function() {
                        if (firstHighlight) {
                            firstHighlight.classList.remove('search-highlight-pulse');
                        }
                    }, 2000);
                } else {
                    console.log("DEBUG: No search highlights found in DOM", {
                        controllerId: controllerId
                    });
                }
            } catch (error) {
                console.error("DEBUG: Error in scrollToFirstHighlight", {
                    error: error,
                    controllerId: controllerId
                });
            }
        }

        function getFilteredCategoriesWithSessions() {
            console.log("DEBUG: getFilteredCategoriesWithSessions() called", {
                hasSearchText: !!vm.searchText && vm.searchText.length > 0,
                showBookmarksView: vm.showBookmarksView,
                categoriesCount: vm.searchResults.categories.length,
                controllerId: controllerId
            });

            // Phase 4: Return bookmark data when in bookmark view mode
            if (vm.showBookmarksView) {
                var bookmarkCategory = getBookmarkCategoryData();
                
                // Apply search filter to bookmarked sessions if search is active
                if (vm.searchText && vm.searchText.length > 0) {
                    var searchLower = vm.searchText.toLowerCase();
                    bookmarkCategory.filteredSessions = bookmarkCategory.filteredSessions.filter(function(session) {
                        return isSessionMatchingSearch(session, searchLower);
                    });
                    bookmarkCategory.sessionCount = bookmarkCategory.filteredSessions.length;
                }

                console.log("DEBUG: Returning bookmark category data", {
                    bookmarkSessionCount: bookmarkCategory.sessionCount,
                    hasSearchFilter: !!vm.searchText,
                    controllerId: controllerId
                });

                return [bookmarkCategory]; // Return as array to match expected format
            }

            // Normal categories view
            return vm.searchResults.categories;
        }

        // Cached version that updates property instead of returning new data each time
        function updateFilteredCategoriesWithSessions() {
            console.log("DEBUG: updateFilteredCategoriesWithSessions() called", {
                hasSearchText: !!vm.searchText && vm.searchText.length > 0,
                showBookmarksView: vm.showBookmarksView,
                categoriesCount: vm.searchResults.categories.length,
                controllerId: controllerId
            });

            // Phase 4: Set bookmark data when in bookmark view mode
            if (vm.showBookmarksView) {
                var bookmarkCategory = getBookmarkCategoryData();
                
                // Apply search filter to bookmarked sessions if search is active
                if (vm.searchText && vm.searchText.length > 0) {
                    var searchLower = vm.searchText.toLowerCase();
                    bookmarkCategory.filteredSessions = bookmarkCategory.filteredSessions.filter(function(session) {
                        return isSessionMatchingSearch(session, searchLower);
                    });
                    bookmarkCategory.sessionCount = bookmarkCategory.filteredSessions.length;
                }

                console.log("DEBUG: Setting bookmark category data", {
                    bookmarkSessionCount: bookmarkCategory.sessionCount,
                    hasSearchFilter: !!vm.searchText,
                    controllerId: controllerId
                });

                vm.filteredCategoriesWithSessions = [bookmarkCategory]; // Set as array to match expected format
            } else {
                // Normal categories view
                vm.filteredCategoriesWithSessions = vm.searchResults.categories;
            }
        }

        function getFilteredUncategorizedSessions() {
            console.log("DEBUG: getFilteredUncategorizedSessions() called", {
                hasSearchText: !!vm.searchText && vm.searchText.length > 0,
                showBookmarksView: vm.showBookmarksView,
                uncategorizedCount: vm.searchResults.uncategorizedSessions.length,
                controllerId: controllerId
            });

            // Phase 4: Return empty array when in bookmark view (bookmarks are shown in categories)
            if (vm.showBookmarksView) {
                console.log("DEBUG: Returning empty uncategorized sessions (bookmark view mode)", {
                    controllerId: controllerId
                });
                return [];
            }

            // Normal categories view
            return vm.searchResults.uncategorizedSessions;
        }

        // Cached version that updates property instead of returning new data each time
        function updateFilteredUncategorizedSessions() {
            console.log("DEBUG: updateFilteredUncategorizedSessions() called", {
                hasSearchText: !!vm.searchText && vm.searchText.length > 0,
                showBookmarksView: vm.showBookmarksView,
                uncategorizedCount: vm.searchResults.uncategorizedSessions.length,
                controllerId: controllerId
            });

            // Phase 4: Set empty array when in bookmark view (bookmarks are shown in categories)
            if (vm.showBookmarksView) {
                console.log("DEBUG: Setting empty uncategorized sessions (bookmark view mode)", {
                    controllerId: controllerId
                });
                vm.filteredUncategorizedSessions = [];
            } else {
                vm.filteredUncategorizedSessions = vm.searchResults.uncategorizedSessions;
            }
        }

        // ========================================================================
        // Phase 2: Reading Progress Implementation
        // ========================================================================

        function loadSessionProgress() {
            console.log("DEBUG: loadSessionProgress() called", {
                albumId: vm.album.id,
                memberId: memberId,
                controllerId: controllerId
            });

            try {
                var storageKey = "session_progress_" + memberId + "_" + vm.album.id;
                var savedProgress = localStorage.getItem(storageKey);
                
                if (savedProgress) {
                    vm.sessionProgress = JSON.parse(savedProgress);
                    console.log("DEBUG: Session progress loaded from localStorage", {
                        storageKey: storageKey,
                        progressData: vm.sessionProgress,
                        completedCount: Object.keys(vm.sessionProgress).length,
                        controllerId: controllerId
                    });
                } else {
                    vm.sessionProgress = {};
                    console.log("DEBUG: No existing session progress found", {
                        storageKey: storageKey,
                        controllerId: controllerId
                    });
                }

                updateOverallProgress();
                updateSessionCompletionStatus();
            } catch (error) {
                console.error("DEBUG: Error loading session progress", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                vm.sessionProgress = {};
                updateOverallProgress();
                updateSessionCompletionStatus();
            }
        }

        function saveSessionProgress() {
            console.log("DEBUG: saveSessionProgress() called", {
                albumId: vm.album.id,
                memberId: memberId,
                progressData: vm.sessionProgress,
                controllerId: controllerId
            });

            try {
                var storageKey = "session_progress_" + memberId + "_" + vm.album.id;
                localStorage.setItem(storageKey, JSON.stringify(vm.sessionProgress));
                
                console.log("DEBUG: Session progress saved to localStorage", {
                    storageKey: storageKey,
                    progressData: vm.sessionProgress,
                    completedCount: Object.keys(vm.sessionProgress).length,
                    controllerId: controllerId
                });
            } catch (error) {
                console.error("DEBUG: Error saving session progress", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
            }
        }

        function markSessionComplete(sessionId) {
            console.log("DEBUG: markSessionComplete() called", {
                sessionId: sessionId,
                currentProgress: vm.sessionProgress[sessionId],
                controllerId: controllerId
            });

            if (!sessionId) {
                console.warn("DEBUG: Invalid sessionId provided to markSessionComplete", {
                    sessionId: sessionId,
                    controllerId: controllerId
                });
                return;
            }

            vm.sessionProgress[sessionId] = {
                completed: true,
                completedDate: new Date().toISOString(),
                memberId: memberId,
                albumId: vm.album.id
            };

            saveSessionProgress();
            updateOverallProgress();
            updateSessionCompletionStatus();

            // Force digest cycle to update UI
            if (!$scope.$$phase) {
                $scope.$apply();
            }

            console.log("DEBUG: Session marked as complete", {
                sessionId: sessionId,
                progressData: vm.sessionProgress[sessionId],
                overallProgress: vm.overallProgress,
                controllerId: controllerId
            });

            logSuccess("Session marked as complete");
        }

        function markSessionIncomplete(sessionId) {
            console.log("DEBUG: markSessionIncomplete() called", {
                sessionId: sessionId,
                currentProgress: vm.sessionProgress[sessionId],
                controllerId: controllerId
            });

            if (!sessionId) {
                console.warn("DEBUG: Invalid sessionId provided to markSessionIncomplete", {
                    sessionId: sessionId,
                    controllerId: controllerId
                });
                return;
            }

            delete vm.sessionProgress[sessionId];

            saveSessionProgress();
            updateOverallProgress();
            updateSessionCompletionStatus();

            // Force digest cycle to update UI
            if (!$scope.$$phase) {
                $scope.$apply();
            }

            console.log("DEBUG: Session marked as incomplete", {
                sessionId: sessionId,
                remainingProgress: vm.sessionProgress,
                overallProgress: vm.overallProgress,
                controllerId: controllerId
            });

            logSuccess("Session marked as incomplete");
        }

        function isSessionComplete(sessionId) {
            var isComplete = !!(vm.sessionProgress[sessionId] && vm.sessionProgress[sessionId].completed);
            
            console.log("DEBUG: isSessionComplete() called", {
                sessionId: sessionId,
                isComplete: isComplete,
                progressData: vm.sessionProgress[sessionId],
                controllerId: controllerId
            });

            return isComplete;
        }

        function getCompletedSessionsCount() {
            var completedCount = Object.keys(vm.sessionProgress).length;
            
            console.log("DEBUG: getCompletedSessionsCount() called", {
                completedCount: completedCount,
                totalSessions: vm.totalSessions,
                progressData: vm.sessionProgress,
                controllerId: controllerId
            });

            return completedCount;
        }

        function updateOverallProgress() {
            console.log("DEBUG: updateOverallProgress() called", {
                currentProgress: vm.overallProgress,
                sessionProgress: vm.sessionProgress,
                totalSessions: vm.totalSessions,
                controllerId: controllerId
            });

            vm.overallProgress.completedCount = Object.keys(vm.sessionProgress).length;
            vm.overallProgress.totalCount = vm.totalSessions;
            vm.overallProgress.percentage = vm.totalSessions > 0 ? 
                Math.round((vm.overallProgress.completedCount / vm.totalSessions) * 100) : 0;

            console.log("DEBUG: Overall progress updated", {
                completedCount: vm.overallProgress.completedCount,
                totalCount: vm.overallProgress.totalCount,
                percentage: vm.overallProgress.percentage,
                controllerId: controllerId
            });
        }

        function getOverallProgress() {
            console.log("DEBUG: getOverallProgress() called", {
                overallProgress: vm.overallProgress,
                controllerId: controllerId
            });

            return vm.overallProgress;
        }

        function updateSessionCompletionStatus() {
            console.log("DEBUG: updateSessionCompletionStatus() called", {
                progressData: vm.sessionProgress,
                totalSessions: vm.totalSessions,
                controllerId: controllerId
            });

            try {
                // Update uncategorized sessions
                if (vm.uncategorizedSessions) {
                    vm.uncategorizedSessions.forEach(function(session) {
                        var wasCompleted = session.isCompleted;
                        session.isCompleted = isSessionComplete(session.id);
                        if (wasCompleted !== session.isCompleted) {
                            console.log("DEBUG: Session completion status updated", {
                                sessionId: session.id,
                                sessionTitle: session.displayTitle,
                                wasCompleted: wasCompleted,
                                isCompleted: session.isCompleted,
                                controllerId: controllerId
                            });
                        }
                    });
                }

                // Update categorized sessions
                if (vm.categoriesWithSessions) {
                    vm.categoriesWithSessions.forEach(function(category) {
                        if (category.sessions) {
                            category.sessions.forEach(function(session) {
                                var wasCompleted = session.isCompleted;
                                session.isCompleted = isSessionComplete(session.id);
                                if (wasCompleted !== session.isCompleted) {
                                    console.log("DEBUG: Session completion status updated", {
                                        sessionId: session.id,
                                        sessionTitle: session.displayTitle,
                                        categoryName: category.name,
                                        wasCompleted: wasCompleted,
                                        isCompleted: session.isCompleted,
                                        controllerId: controllerId
                                    });
                                }
                            });
                        }
                    });
                }

                // Update all sessions array
                if (vm.sessions) {
                    vm.sessions.forEach(function(session) {
                        session.isCompleted = isSessionComplete(session.id);
                    });
                }

                // Update selected session if it exists
                if (vm.selectedSession) {
                    var wasCompleted = vm.selectedSession.isCompleted;
                    vm.selectedSession.isCompleted = isSessionComplete(vm.selectedSession.id);
                    if (wasCompleted !== vm.selectedSession.isCompleted) {
                        console.log("DEBUG: Selected session completion status updated", {
                            sessionId: vm.selectedSession.id,
                            sessionTitle: vm.selectedSession.displayTitle,
                            wasCompleted: wasCompleted,
                            isCompleted: vm.selectedSession.isCompleted,
                            controllerId: controllerId
                        });
                    }
                }

                console.log("DEBUG: updateSessionCompletionStatus() completed", {
                    completedSessionsCount: getCompletedSessionsCount(),
                    overallProgress: vm.overallProgress,
                    controllerId: controllerId
                });

            } catch (error) {
                console.error("DEBUG: Error updating session completion status", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                logError("Error updating session completion status: " + error.message, controllerId);
            }
        }

        // ========================================================================
        // Phase 2: Session Bookmarking Implementation
        // ========================================================================

        function loadSessionBookmarks() {
            console.log("DEBUG: loadSessionBookmarks() called", {
                albumId: vm.album.id,
                memberId: memberId,
                controllerId: controllerId
            });

            try {
                var storageKey = "session_bookmarks_" + memberId + "_" + vm.album.id;
                var storedBookmarks = localStorage.getItem(storageKey);
                
                if (storedBookmarks) {
                    vm.sessionBookmarks = JSON.parse(storedBookmarks);
                    console.log("DEBUG: Session bookmarks loaded from localStorage", {
                        storageKey: storageKey,
                        bookmarkCount: Object.keys(vm.sessionBookmarks).length,
                        bookmarksData: vm.sessionBookmarks,
                        controllerId: controllerId
                    });
                } else {
                    vm.sessionBookmarks = {};
                    console.log("DEBUG: No existing bookmarks found, initializing empty", {
                        storageKey: storageKey,
                        controllerId: controllerId
                    });
                }

                updateBookmarkStatus();

            } catch (error) {
                console.error("DEBUG: Error loading session bookmarks", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                vm.sessionBookmarks = {};
                updateBookmarkStatus();
            }
        }

        function saveSessionBookmarks() {
            console.log("DEBUG: saveSessionBookmarks() called", {
                albumId: vm.album.id,
                memberId: memberId,
                bookmarkData: vm.sessionBookmarks,
                controllerId: controllerId
            });

            try {
                var storageKey = "session_bookmarks_" + memberId + "_" + vm.album.id;
                localStorage.setItem(storageKey, JSON.stringify(vm.sessionBookmarks));
                
                console.log("DEBUG: Session bookmarks saved to localStorage", {
                    storageKey: storageKey,
                    bookmarkData: vm.sessionBookmarks,
                    bookmarkCount: Object.keys(vm.sessionBookmarks).length,
                    controllerId: controllerId
                });

            } catch (error) {
                console.error("DEBUG: Error saving session bookmarks", {
                    error: error,
                    errorMessage: error.message,
                    bookmarkData: vm.sessionBookmarks,
                    controllerId: controllerId
                });
                logError("Error saving session bookmarks: " + error.message, controllerId);
            }
        }

        function toggleBookmark(session) {
            console.log("DEBUG: toggleBookmark() called", {
                sessionId: session ? session.id : null,
                sessionTitle: session ? session.displayTitle : null,
                currentBookmarkStatus: session ? isSessionBookmarked(session.id) : null,
                controllerId: controllerId
            });

            if (!session || !session.id) {
                console.warn("DEBUG: Invalid session provided to toggleBookmark", {
                    session: session,
                    controllerId: controllerId
                });
                logError("Cannot bookmark: Invalid session", controllerId);
                return;
            }

            var sessionId = session.id;
            var wasBookmarked = isSessionBookmarked(sessionId);

            if (wasBookmarked) {
                // Remove bookmark
                delete vm.sessionBookmarks[sessionId];
                console.log("DEBUG: Session bookmark removed", {
                    sessionId: sessionId,
                    sessionTitle: session.displayTitle,
                    controllerId: controllerId
                });
                logSuccess("Bookmark removed from " + session.displayTitle, controllerId);
            } else {
                // Add bookmark
                vm.sessionBookmarks[sessionId] = {
                    sessionId: sessionId,
                    sessionTitle: session.displayTitle,
                    categoryName: session.categoryName,
                    bookmarkedDate: new Date().toISOString(),
                    albumId: vm.album.id,
                    albumName: vm.album.name
                };
                console.log("DEBUG: Session bookmark added", {
                    sessionId: sessionId,
                    sessionTitle: session.displayTitle,
                    bookmarkData: vm.sessionBookmarks[sessionId],
                    controllerId: controllerId
                });
                logSuccess("Bookmark added to " + session.displayTitle, controllerId);
            }

            saveSessionBookmarks();
            updateBookmarkStatus();

            console.log("DEBUG: toggleBookmark() completed", {
                sessionId: sessionId,
                wasBookmarked: wasBookmarked,
                isNowBookmarked: isSessionBookmarked(sessionId),
                totalBookmarks: Object.keys(vm.sessionBookmarks).length,
                controllerId: controllerId
            });
        }

        function isSessionBookmarked(sessionId) {
            var isBookmarked = !!(vm.sessionBookmarks[sessionId]);
            
            console.log("DEBUG: isSessionBookmarked() called", {
                sessionId: sessionId,
                isBookmarked: isBookmarked,
                bookmarkData: vm.sessionBookmarks[sessionId],
                controllerId: controllerId
            });

            return isBookmarked;
        }

        function getBookmarkedSessions() {
            var bookmarkedSessions = [];
            
            try {
                // Find sessions that are bookmarked
                angular.forEach(vm.sessions, function(session) {
                    if (isSessionBookmarked(session.id)) {
                        bookmarkedSessions.push(session);
                    }
                });

                console.log("DEBUG: getBookmarkedSessions() called", {
                    bookmarkedCount: bookmarkedSessions.length,
                    totalSessions: vm.sessions.length,
                    bookmarkedSessionIds: bookmarkedSessions.map(function(s) { return s.id; }),
                    controllerId: controllerId
                });

            } catch (error) {
                console.error("DEBUG: Error getting bookmarked sessions", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                bookmarkedSessions = [];
            }

            return bookmarkedSessions;
        }

        function updateBookmarkStatus() {
            console.log("DEBUG: updateBookmarkStatus() called", {
                selectedSessionId: vm.selectedSession ? vm.selectedSession.id : null,
                totalBookmarks: Object.keys(vm.sessionBookmarks).length,
                controllerId: controllerId
            });

            try {
                // Update bookmark status for current session
                if (vm.selectedSession) {
                    vm.isBookmarked = isSessionBookmarked(vm.selectedSession.id);
                    
                    console.log("DEBUG: Current session bookmark status updated", {
                        sessionId: vm.selectedSession.id,
                        sessionTitle: vm.selectedSession.displayTitle,
                        isBookmarked: vm.isBookmarked,
                        controllerId: controllerId
                    });
                } else {
                    vm.isBookmarked = false;
                }

                // Update bookmark indicators on session objects
                angular.forEach(vm.sessions, function(session) {
                    var wasBookmarked = session.isBookmarked;
                    session.isBookmarked = isSessionBookmarked(session.id);
                    
                    if (wasBookmarked !== session.isBookmarked) {
                        console.log("DEBUG: Session bookmark status changed", {
                            sessionId: session.id,
                            sessionTitle: session.displayTitle,
                            wasBookmarked: wasBookmarked,
                            isBookmarked: session.isBookmarked,
                            controllerId: controllerId
                        });
                    }
                });

                console.log("DEBUG: updateBookmarkStatus() completed", {
                    currentSessionBookmarked: vm.isBookmarked,
                    totalBookmarkedSessions: getBookmarkedSessions().length,
                    controllerId: controllerId
                });

            } catch (error) {
                console.error("DEBUG: Error updating bookmark status", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                logError("Error updating bookmark status: " + error.message, controllerId);
            }
        }

        // Phase 4: Function to expand only the category containing the selected session
        function expandCategoryForSession(session) {
            console.log("DEBUG: expandCategoryForSession() called", {
                sessionId: session.id,
                sessionTitle: session.displayTitle,
                sessionCategoryId: session.categoryId || session.groupCategoryId,
                controllerId: controllerId
            });

            try {
                // Determine which category contains this session
                var categoryToExpand = null;
                
                // Check if session has a category ID
                if (session.categoryId || session.groupCategoryId) {
                    categoryToExpand = session.categoryId || session.groupCategoryId;
                } else {
                    // Session is uncategorized
                    categoryToExpand = 'uncategorized';
                }

                if (categoryToExpand) {
                    // First, collapse all categories (single expansion mode)
                    for (var key in vm.expandedChapters) {
                        vm.expandedChapters[key] = false;
                    }
                    
                    // Then expand only the category containing this session
                    vm.expandedChapters[categoryToExpand] = true;
                    
                    console.log("DEBUG: Expanded single category for selected session", {
                        categoryToExpand: categoryToExpand,
                        sessionId: session.id,
                        sessionTitle: session.displayTitle,
                        expandedChapters: vm.expandedChapters,
                        controllerId: controllerId
                    });

                    // Update category controls state after expansion
                    updateCategoryControlsState();
                    
                    console.log("DEBUG: Category controls updated after session category expansion", {
                        expandedCount: vm.categoryControls.expandedCount,
                        totalCount: vm.categoryControls.totalCount,
                        controllerId: controllerId
                    });
                }

            } catch (error) {
                console.error("DEBUG: Error expanding category for session", {
                    error: error,
                    errorMessage: error.message,
                    sessionId: session.id,
                    controllerId: controllerId
                });
                logError("Error expanding category for session: " + error.message, controllerId);
            }
        }

        // ========================================================================
        // Phase 4: Bookmark View Management Implementation  
        // ========================================================================

        function toggleBookmarksView() {
            console.log("DEBUG: toggleBookmarksView() called", {
                currentShowBookmarksView: vm.showBookmarksView,
                totalBookmarks: Object.keys(vm.sessionBookmarks).length,
                controllerId: controllerId
            });

            try {
                vm.showBookmarksView = !vm.showBookmarksView;
                
                if (vm.showBookmarksView) {
                    // Entering bookmarks view
                    console.log("DEBUG: Entering bookmarks view", {
                        controllerId: controllerId
                    });
                    updateBookmarkViewData();
                    
                    // Auto-expand the bookmarks category
                    vm.expandedChapters['bookmarks'] = true;
                    
                    // Clear search when entering bookmark view to show all bookmarks
                    if (vm.searchText) {
                        vm.searchText = "";
                        console.log("DEBUG: Cleared search when entering bookmark view", {
                            controllerId: controllerId
                        });
                    }
                    
                    // Update cached properties for new view
                    updateFilteredCategoriesWithSessions();
                    updateFilteredUncategorizedSessions();
                    
                    console.log("DEBUG: Auto-expanded bookmarks category", {
                        expandedChapters: vm.expandedChapters,
                        controllerId: controllerId
                    });
                } else {
                    // Returning to categories view
                    console.log("DEBUG: Returning to categories view", {
                        controllerId: controllerId
                    });
                    
                    // Reset bookmark view data
                    vm.bookmarkViewData = {};
                    
                    // Collapse bookmarks category when leaving bookmark view
                    vm.expandedChapters['bookmarks'] = false;
                    
                    // Update cached properties for new view
                    updateFilteredCategoriesWithSessions();
                    updateFilteredUncategorizedSessions();
                }

                console.log("DEBUG: toggleBookmarksView() completed", {
                    showBookmarksView: vm.showBookmarksView,
                    viewMode: vm.showBookmarksView ? 'bookmarks' : 'categories',
                    controllerId: controllerId
                });

            } catch (error) {
                console.error("DEBUG: Error toggling bookmarks view", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                logError("Error toggling bookmarks view: " + error.message, controllerId);
            }
        }

        function unbookmarkSession(session) {
            console.log("DEBUG: unbookmarkSession() called", {
                sessionId: session ? session.id : null,
                sessionTitle: session ? session.displayTitle : null,
                isCurrentlyBookmarked: session ? isSessionBookmarked(session.id) : false,
                controllerId: controllerId
            });

            if (!session || !session.id) {
                console.warn("DEBUG: Invalid session provided to unbookmarkSession", {
                    session: session,
                    controllerId: controllerId
                });
                logError("Cannot unbookmark: Invalid session", controllerId);
                return;
            }

            try {
                // Only unbookmark if currently bookmarked
                if (isSessionBookmarked(session.id)) {
                    var sessionTitle = session.displayTitle || "Session";
                    
                    // Remove bookmark using existing toggle function
                    toggleBookmark(session);
                    
                    // Update session bookmark status immediately for UI
                    session.isBookmarked = false;
                    
                    // Update bookmark view data to reflect changes immediately
                    if (vm.showBookmarksView) {
                        updateBookmarkViewData();
                    }
                    
                    // Force digest cycle to update UI
                    $scope.$applyAsync();
                    
                    // Show success message to user
                    logSuccess("\"" + sessionTitle + "\" removed from bookmarks", controllerId);
                    
                    console.log("DEBUG: Session unbookmarked successfully", {
                        sessionId: session.id,
                        sessionTitle: session.displayTitle,
                        remainingBookmarks: Object.keys(vm.sessionBookmarks).length,
                        controllerId: controllerId
                    });
                } else {
                    console.warn("DEBUG: Attempted to unbookmark session that was not bookmarked", {
                        sessionId: session.id,
                        sessionTitle: session.displayTitle,
                        controllerId: controllerId
                    });
                }

            } catch (error) {
                console.error("DEBUG: Error unbookmarking session", {
                    error: error,
                    errorMessage: error.message,
                    sessionId: session ? session.id : null,
                    controllerId: controllerId
                });
                logError("Error unbookmarking session: " + error.message, controllerId);
            }
        }

        function unbookmarkAllSessions() {
            console.log("DEBUG: unbookmarkAllSessions() called", {
                currentBookmarkCount: Object.keys(vm.sessionBookmarks).length,
                bookmarkedSessions: Object.keys(vm.sessionBookmarks),
                controllerId: controllerId
            });

            try {
                var bookmarkCount = Object.keys(vm.sessionBookmarks).length;
                
                if (bookmarkCount === 0) {
                    console.log("DEBUG: No bookmarks to clear", {
                        controllerId: controllerId
                    });
                    logSuccess("No bookmarks to clear", controllerId);
                    return;
                }

                // Clear all bookmarks
                vm.sessionBookmarks = {};
                saveSessionBookmarks();
                updateBookmarkStatus();
                
                // Update bookmark view data if in bookmark view
                if (vm.showBookmarksView) {
                    updateBookmarkViewData();
                }

                console.log("DEBUG: All sessions unbookmarked successfully", {
                    previousBookmarkCount: bookmarkCount,
                    currentBookmarkCount: Object.keys(vm.sessionBookmarks).length,
                    controllerId: controllerId
                });

                logSuccess("All bookmarks cleared (" + bookmarkCount + " sessions)", controllerId);

            } catch (error) {
                console.error("DEBUG: Error unbookmarking all sessions", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                logError("Error clearing all bookmarks: " + error.message, controllerId);
            }
        }

        function getBookmarkCategoryData() {
            console.log("DEBUG: getBookmarkCategoryData() called", {
                totalSessions: vm.sessions.length,
                totalBookmarks: Object.keys(vm.sessionBookmarks).length,
                controllerId: controllerId
            });

            try {
                var bookmarkedSessions = getBookmarkedSessions();
                
                var bookmarkCategory = {
                    id: 'bookmarks',
                    name: 'Bookmarked Sessions',
                    filteredSessions: bookmarkedSessions,
                    sessionCount: bookmarkedSessions.length
                };

                console.log("DEBUG: getBookmarkCategoryData() result", {
                    categoryId: bookmarkCategory.id,
                    categoryName: bookmarkCategory.name,
                    sessionCount: bookmarkCategory.sessionCount,
                    bookmarkedSessionTitles: bookmarkedSessions.map(function(s) { return s.displayTitle; }),
                    controllerId: controllerId
                });

                return bookmarkCategory;

            } catch (error) {
                console.error("DEBUG: Error getting bookmark category data", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                
                // Return empty bookmark category on error
                return {
                    id: 'bookmarks',
                    name: 'Bookmarked Sessions',
                    filteredSessions: [],
                    sessionCount: 0
                };
            }
        }

        function updateBookmarkViewData() {
            console.log("DEBUG: updateBookmarkViewData() called", {
                showBookmarksView: vm.showBookmarksView,
                currentBookmarkCount: Object.keys(vm.sessionBookmarks).length,
                controllerId: controllerId
            });

            try {
                if (vm.showBookmarksView) {
                    vm.bookmarkViewData = getBookmarkCategoryData();
                    
                    console.log("DEBUG: Bookmark view data updated", {
                        bookmarkSessionCount: vm.bookmarkViewData.sessionCount,
                        bookmarkCategoryName: vm.bookmarkViewData.name,
                        controllerId: controllerId
                    });
                } else {
                    vm.bookmarkViewData = {};
                    
                    console.log("DEBUG: Bookmark view data cleared (not in bookmark view)", {
                        controllerId: controllerId
                    });
                }

            } catch (error) {
                console.error("DEBUG: Error updating bookmark view data", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                logError("Error updating bookmark view data: " + error.message, controllerId);
            }
        }

        // ========================================================================
        // Phase 2: Resume Session Feature - Remember Last Visited Session
        // ========================================================================

        function saveLastVisitedSession(session) {
            console.log("DEBUG: saveLastVisitedSession() called", {
                sessionId: session ? session.id : null,
                sessionTitle: session ? session.displayTitle : null,
                albumId: vm.album.id,
                memberId: memberId,
                controllerId: controllerId
            });

            if (!session || !session.id) {
                console.warn("DEBUG: Invalid session provided to saveLastVisitedSession", {
                    session: session,
                    controllerId: controllerId
                });
                return;
            }

            try {
                var storageKey = "last_session_" + memberId + "_" + vm.album.id;
                var lastSessionData = {
                    sessionId: session.id,
                    sessionTitle: session.displayTitle || session.sessionName,
                    categoryId: session.categoryId || session.groupCategoryId,
                    visitedAt: new Date().toISOString(),
                    albumId: vm.album.id,
                    memberId: memberId
                };

                localStorage.setItem(storageKey, JSON.stringify(lastSessionData));
                
                console.log("DEBUG: Last visited session saved to localStorage", {
                    storageKey: storageKey,
                    lastSessionData: lastSessionData,
                    controllerId: controllerId
                });

            } catch (error) {
                console.error("DEBUG: Error saving last visited session", {
                    error: error,
                    errorMessage: error.message,
                    sessionData: session,
                    controllerId: controllerId
                });
                logError("Error saving last visited session: " + error.message, controllerId);
            }
        }

        function getLastVisitedSession() {
            console.log("DEBUG: getLastVisitedSession() called", {
                albumId: vm.album.id,
                memberId: memberId,
                controllerId: controllerId
            });

            try {
                var storageKey = "last_session_" + memberId + "_" + vm.album.id;
                var storedData = localStorage.getItem(storageKey);

                if (storedData) {
                    var lastSessionData = JSON.parse(storedData);
                    
                    console.log("DEBUG: Last visited session loaded from localStorage", {
                        storageKey: storageKey,
                        lastSessionData: lastSessionData,
                        daysAgo: lastSessionData.visitedAt ? 
                            Math.floor((new Date() - new Date(lastSessionData.visitedAt)) / (1000 * 60 * 60 * 24)) : 'unknown',
                        controllerId: controllerId
                    });

                    // Validate the data matches current context
                    if (lastSessionData.albumId === vm.album.id && 
                        lastSessionData.memberId === memberId && 
                        lastSessionData.sessionId) {
                        
                        // Find the actual session object
                        var lastSession = null;
                        for (var i = 0; i < vm.sessions.length; i++) {
                            if (vm.sessions[i].id === lastSessionData.sessionId) {
                                lastSession = vm.sessions[i];
                                break;
                            }
                        }

                        if (lastSession) {
                            console.log("DEBUG: Found matching session for resume", {
                                sessionId: lastSession.id,
                                sessionTitle: lastSession.displayTitle,
                                categoryId: lastSession.categoryId || lastSession.groupCategoryId,
                                controllerId: controllerId
                            });
                            return lastSession;
                        } else {
                            console.log("DEBUG: Last visited session no longer exists", {
                                sessionId: lastSessionData.sessionId,
                                sessionTitle: lastSessionData.sessionTitle,
                                controllerId: controllerId
                            });
                        }
                    } else {
                        console.log("DEBUG: Last visited session data doesn't match current context", {
                            storedAlbumId: lastSessionData.albumId,
                            currentAlbumId: vm.album.id,
                            storedMemberId: lastSessionData.memberId,
                            currentMemberId: memberId,
                            controllerId: controllerId
                        });
                    }
                } else {
                    console.log("DEBUG: No last visited session found in localStorage", {
                        storageKey: storageKey,
                        controllerId: controllerId
                    });
                }

            } catch (error) {
                console.error("DEBUG: Error loading last visited session", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                logError("Error loading last visited session: " + error.message, controllerId);
            }

            return null;
        }

        function selectSessionWithResume() {
            console.log("DEBUG: selectSessionWithResume() called", {
                sessionsAvailable: vm.sessions.length,
                albumId: vm.album.id,
                memberId: memberId,
                controllerId: controllerId
            });

            if (vm.sessions.length === 0) {
                console.log("DEBUG: No sessions available for selection", {
                    controllerId: controllerId
                });
                return;
            }

            // Try to resume from last visited session
            var lastSession = getLastVisitedSession();
            
            if (lastSession) {
                console.log("DEBUG: Resuming from last visited session", {
                    sessionId: lastSession.id,
                    sessionTitle: lastSession.displayTitle,
                    categoryId: lastSession.categoryId || lastSession.groupCategoryId,
                    controllerId: controllerId
                });
                
                selectSession(lastSession);
                logSuccess("Resumed from where you left off", controllerId, config.showDevToasts);
            } else {
                console.log("DEBUG: No last session found, selecting first session", {
                    firstSession: vm.sessions[0],
                    controllerId: controllerId
                });
                selectSession(vm.sessions[0]);
                logSuccess("Started with first session", controllerId, config.showDevToasts);
            }
        }

        // ========================================================================
        // Phase 2: Performance Optimization Implementation
        // ========================================================================

        function cacheSessionContent(sessionId, content) {
            console.log("DEBUG: cacheSessionContent() called", {
                sessionId: sessionId,
                contentLength: content ? content.length : 0,
                currentCacheSize: Object.keys(vm.sessionContentCache).length,
                maxCacheSize: vm.maxCacheSize,
                controllerId: controllerId
            });

            try {
                // Check if cache is at capacity
                if (Object.keys(vm.sessionContentCache).length >= vm.maxCacheSize) {
                    // Remove oldest cached session (simple LRU implementation)
                    var oldestSessionId = Object.keys(vm.sessionContentCache)[0];
                    delete vm.sessionContentCache[oldestSessionId];
                    
                    console.log("DEBUG: Removed oldest session from cache", {
                        removedSessionId: oldestSessionId,
                        newCacheSize: Object.keys(vm.sessionContentCache).length,
                        controllerId: controllerId
                    });
                }

                // Add content to cache
                vm.sessionContentCache[sessionId] = content;

                console.log("DEBUG: Session content cached successfully", {
                    sessionId: sessionId,
                    contentLength: content ? content.length : 0,
                    cacheSize: Object.keys(vm.sessionContentCache).length,
                    controllerId: controllerId
                });

            } catch (error) {
                console.error("DEBUG: Error caching session content", {
                    sessionId: sessionId,
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
            }
        }

        function preloadNextSession() {
            console.log("DEBUG: preloadNextSession() called", {
                currentSessionIndex: vm.currentSessionIndex,
                totalSessions: vm.totalSessions,
                hasNext: vm.hasNext,
                controllerId: controllerId
            });

            try {
                if (vm.hasNext && vm.currentSessionIndex < vm.totalSessions - 1) {
                    var nextSession = vm.sessions[vm.currentSessionIndex + 1];
                    
                    if (nextSession && !vm.sessionContentCache[nextSession.id]) {
                        console.log("DEBUG: Preloading next session content", {
                            nextSessionId: nextSession.id,
                            nextSessionTitle: nextSession.displayTitle,
                            controllerId: controllerId
                        });

                        // Preload the next session's content in the background
                        if (nextSession.originalSession && nextSession.originalSession.summaryData) {
                            var content = "";
                            nextSession.originalSession.summaryData.forEach(function(summary) {
                                if (summary.content) {
                                    content += summary.content;
                                }
                            });
                            
                            if (content) {
                                cacheSessionContent(nextSession.id, content);
                                
                                console.log("DEBUG: Next session preloaded successfully", {
                                    nextSessionId: nextSession.id,
                                    contentLength: content.length,
                                    controllerId: controllerId
                                });
                            }
                        }
                    } else if (nextSession && vm.sessionContentCache[nextSession.id]) {
                        console.log("DEBUG: Next session already cached", {
                            nextSessionId: nextSession.id,
                            controllerId: controllerId
                        });
                    }
                } else {
                    console.log("DEBUG: No next session to preload", {
                        hasNext: vm.hasNext,
                        currentSessionIndex: vm.currentSessionIndex,
                        totalSessions: vm.totalSessions,
                        controllerId: controllerId
                    });
                }

            } catch (error) {
                console.error("DEBUG: Error preloading next session", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
            }
        }

        function scrollToTop() {
            console.log("DEBUG: scrollToTop() called", {
                isScrolling: vm.isScrolling,
                controllerId: controllerId
            });

            if (vm.isScrolling) {
                console.log("DEBUG: Already scrolling, skipping", {
                    controllerId: controllerId
                });
                return;
            }

            try {
                vm.isScrolling = true;
                
                // Find the content pane
                var contentPane = document.querySelector('.reader-content-pane');
                if (contentPane) {
                    // Smooth scroll to top with enhanced animation
                    contentPane.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                    
                    // Reset scrolling flag after animation
                    $timeout(function() {
                        vm.isScrolling = false;
                        console.log("DEBUG: Smooth scroll to top completed", {
                            controllerId: controllerId
                        });
                    }, 500);
                } else {
                    // Fallback to window scroll
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                    
                    $timeout(function() {
                        vm.isScrolling = false;
                    }, 500);
                    
                    console.log("DEBUG: Fallback window scroll to top", {
                        controllerId: controllerId
                    });
                }

            } catch (error) {
                console.error("DEBUG: Error in scrollToTop", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                vm.isScrolling = false;
            }
        }

        function clearSessionCache() {
            console.log("DEBUG: clearSessionCache() called", {
                currentCacheSize: Object.keys(vm.sessionContentCache).length,
                controllerId: controllerId
            });

            try {
                var cacheSize = Object.keys(vm.sessionContentCache).length;
                vm.sessionContentCache = {};
                
                console.log("DEBUG: Session cache cleared", {
                    previousCacheSize: cacheSize,
                    newCacheSize: Object.keys(vm.sessionContentCache).length,
                    controllerId: controllerId
                });

                logSuccess("Session cache cleared (" + cacheSize + " sessions removed)", controllerId);

            } catch (error) {
                console.error("DEBUG: Error clearing session cache", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                logError("Error clearing session cache: " + error.message, controllerId);
            }
        }

        function getPerformanceMetrics() {
            var metrics = {
                cacheHits: vm.performanceMetrics.cacheHits,
                cacheMisses: vm.performanceMetrics.cacheMisses,
                cacheHitRatio: vm.performanceMetrics.cacheHits + vm.performanceMetrics.cacheMisses > 0 ? 
                    (vm.performanceMetrics.cacheHits / (vm.performanceMetrics.cacheHits + vm.performanceMetrics.cacheMisses) * 100).toFixed(2) : 0,
                currentCacheSize: Object.keys(vm.sessionContentCache).length,
                maxCacheSize: vm.maxCacheSize,
                averageLoadTime: 0,
                loadTimeCount: Object.keys(vm.performanceMetrics.loadTimes).length
            };

            if (metrics.loadTimeCount > 0) {
                var totalLoadTime = Object.values(vm.performanceMetrics.loadTimes).reduce(function(sum, time) {
                    return sum + time;
                }, 0);
                metrics.averageLoadTime = (totalLoadTime / metrics.loadTimeCount).toFixed(2);
            }

            console.log("DEBUG: getPerformanceMetrics() called", {
                metrics: metrics,
                controllerId: controllerId
            });

            return metrics;
        }

        function logPerformanceReport() {
            console.log("DEBUG: logPerformanceReport() called", {
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });

            try {
                var metrics = getPerformanceMetrics();
                
                console.log("============ BEAUTIFUL ISLAM READER PERFORMANCE REPORT ============", {
                    reportTimestamp: new Date().toISOString(),
                    controllerId: controllerId
                });
                
                console.log("📊 Cache Performance:", {
                    cacheHits: metrics.cacheHits,
                    cacheMisses: metrics.cacheMisses,
                    hitRatio: metrics.cacheHitRatio + "%",
                    currentCacheSize: metrics.currentCacheSize,
                    maxCacheSize: metrics.maxCacheSize,
                    cacheUtilization: ((metrics.currentCacheSize / metrics.maxCacheSize) * 100).toFixed(2) + "%"
                });

                console.log("⚡ Load Performance:", {
                    averageLoadTime: metrics.averageLoadTime + "ms",
                    totalLoadOperations: metrics.loadTimeCount,
                    loadTimeHistory: vm.performanceMetrics.loadTimes
                });

                console.log("💾 Memory Usage:", {
                    cachedSessions: Object.keys(vm.sessionContentCache),
                    cacheDataSample: Object.keys(vm.sessionContentCache).slice(0, 3).map(function(sessionId) {
                        return {
                            sessionId: sessionId,
                            contentLength: vm.sessionContentCache[sessionId] ? vm.sessionContentCache[sessionId].length : 0
                        };
                    })
                });

                console.log("🚀 Optimization Status:", {
                    preloadingActive: vm.hasNext,
                    scrollOptimizationEnabled: !vm.isScrolling,
                    bookmarkingEnabled: !!vm.sessionBookmarks,
                    totalBookmarks: vm.sessionBookmarks ? Object.keys(vm.sessionBookmarks).length : 0
                });

                console.log("================================================================");

                logSuccess("Performance report generated - check console for details", controllerId);

            } catch (error) {
                console.error("DEBUG: Error generating performance report", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                logError("Error generating performance report: " + error.message, controllerId);
            }
        }

        function setupPerformanceMonitoring() {
            console.log("DEBUG: setupPerformanceMonitoring() called", {
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });

            try {
                // Set up periodic performance reporting (every 5 minutes during active use)
                if (config.showDevToasts) {
                    $timeout(function() {
                        console.log("DEBUG: Generating initial performance report", {
                            controllerId: controllerId
                        });
                        logPerformanceReport();
                    }, 10000); // Generate first report after 10 seconds
                }

                // Monitor cache efficiency and log warnings if performance degrades
                vm.performanceMonitor = {
                    lastCacheCheck: new Date().getTime(),
                    checkInterval: 30000, // Check every 30 seconds
                    warningThreshold: 0.5 // Warn if cache hit ratio drops below 50%
                };

                // Start performance monitoring interval
                var performanceInterval = $interval(function() {
                    var metrics = getPerformanceMetrics();
                    var now = new Date().getTime();
                    
                    if (now - vm.performanceMonitor.lastCacheCheck > vm.performanceMonitor.checkInterval) {
                        console.log("DEBUG: Performance monitor check", {
                            cacheHitRatio: metrics.cacheHitRatio,
                            threshold: vm.performanceMonitor.warningThreshold * 100,
                            cacheSize: metrics.currentCacheSize,
                            controllerId: controllerId
                        });

                        if (metrics.cacheHitRatio < vm.performanceMonitor.warningThreshold * 100 && 
                            metrics.cacheHits + metrics.cacheMisses > 5) {
                            console.warn("DEBUG: Performance warning - low cache hit ratio", {
                                currentRatio: metrics.cacheHitRatio + "%",
                                threshold: vm.performanceMonitor.warningThreshold * 100 + "%",
                                cacheHits: metrics.cacheHits,
                                cacheMisses: metrics.cacheMisses,
                                controllerId: controllerId
                            });
                            
                            if (config.showDevToasts) {
                                logWarning("Performance Alert: Cache hit ratio is " + metrics.cacheHitRatio + "% (consider increasing cache size)", controllerId);
                            }
                        }

                        vm.performanceMonitor.lastCacheCheck = now;
                    }
                }, 30000);

                // Clean up interval on scope destroy
                $scope.$on('$destroy', function() {
                    console.log("DEBUG: Cleaning up performance monitoring", {
                        controllerId: controllerId
                    });
                    if (performanceInterval) {
                        $interval.cancel(performanceInterval);
                    }
                });

                console.log("DEBUG: Performance monitoring setup completed", {
                    checkInterval: vm.performanceMonitor.checkInterval,
                    warningThreshold: vm.performanceMonitor.warningThreshold,
                    controllerId: controllerId
                });

            } catch (error) {
                console.error("DEBUG: Error setting up performance monitoring", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
            }
        }

        // ========================================================================
        // Phase 2: Initialization and Utility Functions
        // ========================================================================

        function initializePhase2Features() {
            console.log("DEBUG: initializePhase2Features() called", {
                totalSessions: vm.totalSessions,
                albumId: vm.album.id,
                memberId: memberId,
                controllerId: controllerId
            });

            try {
                // Initialize search functionality
                vm.searchText = "";
                vm.searchResults.categories = vm.categoriesWithSessions.map(function(category) {
                    return {
                        id: category.id,
                        name: category.name,
                        sessions: category.sessions,
                        filteredSessions: category.sessions // Template expects filteredSessions
                    };
                });
                vm.searchResults.uncategorizedSessions = vm.uncategorizedSessions;
                vm.searchResults.totalFound = vm.totalSessions;

                console.log("DEBUG: Search functionality initialized", {
                    totalFound: vm.searchResults.totalFound,
                    categoriesCount: vm.searchResults.categories.length,
                    uncategorizedCount: vm.searchResults.uncategorizedSessions.length,
                    controllerId: controllerId
                });

                // Initialize reading progress tracking
                loadSessionProgress();

                // Initialize session bookmarking
                loadSessionBookmarks();

                console.log("DEBUG: Phase 2 features initialized successfully", {
                    searchInitialized: true,
                    progressInitialized: true,
                    bookmarkingInitialized: true,
                    overallProgress: vm.overallProgress,
                    totalBookmarks: Object.keys(vm.sessionBookmarks).length,
                    controllerId: controllerId
                });

            } catch (error) {
                console.error("DEBUG: Error initializing Phase 2 features", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                logError("Error initializing search, progress, and bookmarking features: " + error.message, controllerId);
            }
        }

        // Cleanup on scope destroy
        $scope.$on('$destroy', function() {
            console.log("DEBUG: $destroy event - cleaning up", {
                controllerId: controllerId
            });

            // Remove window resize listener
            angular.element($window).off('resize');
        });

        // ========================================================================
        // Phase 2: Testing Helper Functions (for debugging and testing)
        // ========================================================================

        function testBookmarkFeatures() {
            console.log("🧪 TESTING BOOKMARK FEATURES", {
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });

            try {
                if (!vm.selectedSession) {
                    logError("No session selected. Please select a session first to test bookmarking.", controllerId);
                    return;
                }

                console.log("📖 Current Session Info:", {
                    sessionId: vm.selectedSession.id,
                    title: vm.selectedSession.displayTitle,
                    isBookmarked: vm.isBookmarked
                });

                // Test bookmark toggle
                console.log("🔖 Testing bookmark toggle...");
                var wasBookmarked = vm.isBookmarked;
                toggleBookmark();
                
                console.log("✅ Bookmark toggle result:", {
                    wasBookmarked: wasBookmarked,
                    nowBookmarked: vm.isBookmarked,
                    toggleWorked: wasBookmarked !== vm.isBookmarked
                });

                // Show all bookmarks
                var bookmarks = getBookmarkedSessions();
                console.log("📚 All Bookmarks:", bookmarks);

                logSuccess("Bookmark testing completed! Check console for results.", controllerId);
                return {
                    bookmarkToggleWorked: wasBookmarked !== vm.isBookmarked,
                    totalBookmarks: bookmarks.length,
                    currentlyBookmarked: vm.isBookmarked
                };

            } catch (error) {
                console.error("❌ Bookmark testing failed:", error);
                logError("Bookmark testing failed: " + error.message, controllerId);
            }
        }

        function testPerformanceFeatures() {
            console.log("🚀 TESTING PERFORMANCE FEATURES", {
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });

            try {
                // Show current performance metrics
                var metrics = getPerformanceMetrics();
                console.log("📊 Current Performance Metrics:", metrics);

                // Test cache
                console.log("💾 Cache Status:", {
                    currentCacheSize: Object.keys(vm.sessionContentCache).length,
                    maxCacheSize: vm.maxCacheSize,
                    cachedSessions: Object.keys(vm.sessionContentCache)
                });

                // Test scroll to top
                console.log("⬆️ Testing scroll to top...");
                scrollToTop();

                // Generate performance report
                console.log("📋 Generating performance report...");
                logPerformanceReport();

                logSuccess("Performance testing completed! Check console for detailed results.", controllerId);
                return {
                    cacheHitRatio: metrics.cacheHitRatio,
                    cacheSize: metrics.currentCacheSize,
                    averageLoadTime: metrics.averageLoadTime
                };

            } catch (error) {
                console.error("❌ Performance testing failed:", error);
                logError("Performance testing failed: " + error.message, controllerId);
            }
        }

        function showCurrentState() {
            console.log("🔍 CURRENT SESSION READER STATE", {
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });

            var state = {
                album: {
                    id: vm.album.id,
                    name: vm.album.name,
                    sessionCount: vm.sessions.length
                },
                selectedSession: vm.selectedSession ? {
                    id: vm.selectedSession.id,
                    title: vm.selectedSession.displayTitle,
                    isBookmarked: vm.isBookmarked
                } : null,
                navigation: {
                    currentIndex: vm.currentSessionIndex,
                    hasPrevious: vm.hasPrevious,
                    hasNext: vm.hasNext,
                    totalSessions: vm.totalSessions
                },
                bookmarks: {
                    totalBookmarks: vm.sessionBookmarks ? Object.keys(vm.sessionBookmarks).length : 0,
                    currentSessionBookmarked: vm.isBookmarked
                },
                performance: getPerformanceMetrics(),
                cache: {
                    size: Object.keys(vm.sessionContentCache).length,
                    maxSize: vm.maxCacheSize,
                    sessions: Object.keys(vm.sessionContentCache)
                },
                search: {
                    searchText: vm.searchText,
                    resultsFound: vm.searchResults.totalFound
                },
                ui: {
                    isLoading: vm.isLoading,
                    isLoadingSession: vm.isLoadingSession,
                    isMobile: vm.isMobile,
                    sidebarOpen: vm.sidebarOpen,
                    currentTheme: vm.currentTheme
                }
            };

            console.log("🏗️ Complete State Object:", state);
            logSuccess("Current state logged to console!", controllerId);
            return state;
        }

        // Debug helper function exposed to window for testing
        if (config.isDevelopment) {
            $window.sessionReaderDebug = {
                getViewModel: function() {
                    console.log("DEBUG: sessionReaderDebug.getViewModel() called", vm);
                    return vm;
                },
                selectSessionById: function(sessionId) {
                    var session = vm.sessions.find(function(s) { return s.id === sessionId; });
                    if (session) {
                        console.log("DEBUG: sessionReaderDebug.selectSessionById() selecting session", session);
                        selectSession(session);
                    } else {
                        console.log("DEBUG: sessionReaderDebug.selectSessionById() session not found", sessionId);
                    }
                },
                logCurrentState: function() {
                    console.log("DEBUG: sessionReaderDebug.logCurrentState()", {
                        album: vm.album,
                        sessions: vm.sessions,
                        selectedSession: vm.selectedSession,
                        categories: vm.categories,
                        isLoading: vm.isLoading,
                        controllerId: controllerId
                    });
                },
                // Phase 2: Testing Helper Methods
                testBookmarks: testBookmarkFeatures,
                testPerformance: testPerformanceFeatures,
                showState: showCurrentState,
                // Direct access to testing functions
                toggleBookmark: toggleBookmark,
                clearCache: clearSessionCache,
                getMetrics: getPerformanceMetrics,
                performanceReport: logPerformanceReport,
                scrollTop: scrollToTop
            };
        }
    }
})();
