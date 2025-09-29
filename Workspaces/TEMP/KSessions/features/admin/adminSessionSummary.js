(function () {
    "use strict";
    // Updated controller for session summary management
    var controllerId = "adminSessionSummaryCtl";
    angular.module("app").controller(controllerId,
        ["$document", "$scope", "common", "bootstrap.dialog", "config", "contentManager", "datacontext", "fileUpload", "froalaConfig", "$injector", adminSessionSummaryCtl]);

    function adminSessionSummaryCtl($document, $scope, common, dlg, config, contentManager, datacontext, fileUpload, froalaConfig, $injector) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");
        var memberId = $scope.g.member && $scope.g.member.id || "";
        var timeout = common.$timeout;
        var summaryImagesRemoved = [];

        // Safe injection of accordionService using $injector
        var accordionService = null;
        try {
            accordionService = $injector.get('accordionService');
        } catch (e) {
            logError("accordionService not available: " + e.message, controllerId);
        }

        $scope.vm = {}; var vm = $scope.vm;

        vm.fSummary = {};
        vm.currentSummaryId = -1;
        vm.cm = contentManager;
        vm.showCategory = true;
        
        // Loading state properties
        vm.isLoading = true;
        vm.isInitialized = false;
        vm.firstPanelExpanded = false;

        // Initialize accordion service for session summaries  
        vm.summaryAccordion = null;
        if (accordionService) {
            vm.summaryAccordion = accordionService.createAccordion({
                allowMultiple: false,  // Only one summary expanded at a time (accordion behavior)
                expandFirst: false,    // Don't auto-expand first item
                onExpand: function(item, itemId) {
                    log("Summary expanded: " + (item.title || 'Untitled'), controllerId, config.showDevToasts);
                    // Mark first panel as expanded for loading state
                    if (!vm.firstPanelExpanded) {
                        vm.firstPanelExpanded = true;
                        vm.checkLoadingComplete();
                    }
                },
                onCollapse: function(item, itemId) {
                    log("Summary collapsed: " + (item.title || 'Untitled'), controllerId, config.showDevToasts);
                }
            });
        }

        // Froala options will be created after function definitions to avoid undefined function references
        vm.froalaOptions = null;

        vm.metadataCopy = {};                       // To track changes to session name and desc
        vm.sortableSessions = [];
        vm.sessionSortOptions = {
            orderChanged: null, // Will be set after function is defined
            containment: "#sortableSessions"
        };

        // Methods - Will be assigned after function definitions
        vm.isMediaReadyToPlay = false;
        vm.isMobileBrowser = common.isMobileBrowser;

        (function () {
            try {
                contentManager.initialize();
                var promises = [contentManager.getAllAlbums()];
                common.activateController(promises, controllerId).then(onControllerActivation).catch(onControllerActivationError);
            } catch (initError) {
                logError("Critical error during controller initialization: " + (initError.message || initError), controllerId);
            }

            function onControllerActivation(result = null) {
                try {
                    console.log("🔧 [ADMIN-UPLOAD-DEBUG] Admin session summary controller activated", {
                        result: result,
                        memberId: memberId,
                        controllerId: controllerId,
                        mediaBasePath: config.urls.media,
                        uploadApiPath: "api/file/mp3/session/",
                        hasContentManager: !!contentManager
                    });

                    vm.fSummary = {
                        id: 0,
                        sequence: 0,
                        name: "",
                        description: "",
                        sessionId: 0,
                        albumId: 0,
                        categoryId: "",
                        sessionName: "",
                        sessionDate: new Date(),
                        isActive: true,
                        userId: memberId,
                        template: null,
                        coverImage: null,
                        ayats: [],
                        jumps: []
                    };

                    vm.isInitialized = true;
                    vm.checkLoadingComplete();

                    console.log("🔧 [ADMIN-UPLOAD-DEBUG] Admin controller initialization complete", {
                        isInitialized: vm.isInitialized,
                        currentSession: vm.cm.currentSession ? vm.cm.currentSession.id : 'none',
                        controllerId: controllerId
                    });

                    log("Activated adminSessionSummary View", controllerId, config.showDevToasts);
                } catch (activationError) {
                    console.error("🔧 [ADMIN-UPLOAD-DEBUG] Error during admin activation", {
                        error: activationError,
                        message: activationError.message || activationError,
                        controllerId: controllerId
                    });
                    logError("Error during controller activation: " + (activationError.message || activationError), controllerId);
                }
            }

            function onControllerActivationError(error) {
                logError("Controller activation failed: " + (error.message || error), controllerId);
            }
        })();

        function froalaEditorInit(e, editor) {
            editor.opts.imageManagerLoadURL = "api/file/session/" + vm.cm.currentSession.id + "/images";
            editor.opts.imageManagerDeleteURL = "api/file/summary/" + vm.cm.currentSession.id + "/deleteImage";

            // Bind ayah header removers after editor initialization
            timeout(function () {
                bindAyahHeaderRemovers(".clickable-ayah-header");
            }, 100);
        }

        function beforeImageUpload(e, editor, images) {
            editor.opts.imageUploadURL = "api/file/summary/imageLink";
            editor.opts.imageUploadParams = {
                sessionId: vm.cm.currentSession.id,
                summaryId: vm.currentSummaryId || -1
            };
        }

        function onImageUploadError(e, editor, error) {
            logError(error, controllerId);
        }

        function onImageInserted(e, editor, $img, response) {
            //Add these values to class to make the image inline and right oriented [fr-dii fr-fir]
            $($img[0]).addClass("imgResponsive fr-bordered");
        }

        function onBeforeSave(e, editor) {
            if (vm.fSummary.sessionId <= 0) {
                return;
            }
            
            // Validation: Prevent saving empty summaries
            var editorContent = editor.html.get() || "";
            var contentText = editorContent.replace(/<[^>]*>/g, '').trim(); // Strip HTML tags and trim
            
            if (!contentText || contentText.length < 10) {
                // Show validation message to user
                logError("Summary content must be at least 10 characters long. Please add meaningful content before saving.", controllerId);
                return false; // Prevent the save
            }
            
            // Use the same method as other parts of this controller
            datacontext.addUpdateSessionSummary(vm.fSummary).then(function (response) {
                if (response.data) {
                    vm.fSummary.id = response.data;
                    // Ensure ayah headers are bound after save
                    timeout(function () {
                        bindAyahHeaderRemovers(".clickable-ayah-header");
                    }, 100);
                }
            }).catch(function (error) {
                logError("Error auto-saving summary: " + (error.message || error), controllerId);
            });
        }

        function bindAyahHeaderRemovers(selector) {
            $(selector).unbind("click", removeAyahCardFromEditor);
            $(selector).bind("click", removeAyahCardFromEditor);
        }

        function removeAyahCardFromEditor() {
            var headerElement = this;
            var $header = $(headerElement);
            var surahNumber = $header.data('surah');
            var ayats = $header.data('ayats');

            // Create confirmation message
            var headerText = $header.find('span').text();
            var confirmMessage = "Are you sure you want to remove this Quranic verse?\n\n" + headerText;

            dlg.confirmationDialog("Confirm Removal", confirmMessage, "Yes", "Cancel")
                .then(function (result) {
                    if (result === "ok") {
                        // Find the parent ayah-card div
                        var $ayahCard = $header.closest('.ayah-card');
                        if ($ayahCard.length > 0) {
                            // Replace the entire ayah card with a blank paragraph
                            $ayahCard.replaceWith('<p></p>');

                            // Log the removal
                            logSuccess("Removed Quranic verse: " + headerText, controllerId);
                        } else {
                            logError("Could not find ayah card to remove", controllerId);
                        }
                    }
                })
                .catch(function () {
                    // User cancelled the dialog - this is expected behavior, no error needed
                    // Just silently handle the cancellation
                });
        }

        // Watchers
        $scope.$on("summaryAccordion:onReady", function () {
            try {
                // Bind ayah header removers when accordion is ready
                timeout(function () {
                    bindAyahHeaderRemovers(".clickable-ayah-header");
                }, 100);
            } catch (error) {
                logError("Error in summaryAccordion:onReady handler: " + (error.message || error), controllerId);
            }
        });

        // Watch for changes in fSummary.sessionId to ensure session is loaded
        $scope.$watch("vm.fSummary.sessionId", function (newSessionId, oldSessionId) {
            // Check if this is a valid session ID that's different from the current one
            var isNewSessionIdValid = newSessionId && newSessionId > 0;
            var isSessionIdDifferent = newSessionId !== oldSessionId;
            
            if (!isNewSessionIdValid || !isSessionIdDifferent) {
                return;
            }
            
            // Only load if we don't have the session or it's a different session
            if (!vm.cm.currentSession || vm.cm.currentSession.id !== newSessionId) {
                // Check if we have necessary album data before attempting to load session
                if (!vm.cm.currentAlbum || !vm.cm.currentAlbum.sessions) {
                    // Try to find and set the album based on albumId in fSummary
                    if (vm.fSummary.albumId && vm.cm.albums && vm.cm.albums.length > 0) {
                        contentManager.setAlbumById(vm.fSummary.albumId);
                        
                        // Load sessions for this album first
                        contentManager.getSessionsForAlbum(vm.fSummary.albumId, -1).then(function() {
                            // Retry loading the session after album sessions are loaded
                            contentManager.setCurrentSession(newSessionId)
                                .then(function(result) {
                                    if (result && vm.cm.currentSession) {
                                        timeout(function() {
                                            vm.ensureFirstSummaryExpanded();
                                        }, 100);
                                    }
                                })
                                .catch(function(error) {
                                    logError("Error loading session after album setup: " + (error.message || error), controllerId);
                                    vm.fSummary.sessionId = "";
                                });
                        }).catch(function(error) {
                            logError("Error loading sessions for album: " + (error.message || error), controllerId);
                            vm.fSummary.sessionId = "";
                        });
                    } else {
                        vm.fSummary.sessionId = "";
                    }
                    return;
                }
                
                // Load the session with proper error handling
                contentManager.setCurrentSession(newSessionId)
                    .then(function(result) {
                        if (result && vm.cm.currentSession) {
                            // Ensure first summary is expanded if there are summaries
                            timeout(function() {
                                vm.ensureFirstSummaryExpanded();
                                // Also check if loading should complete (in case no summaries)
                                vm.checkLoadingComplete();
                            }, 100);
                        } else {
                            // No session loaded, check if loading should complete
                            timeout(function() {
                                vm.checkLoadingComplete();
                            }, 100);
                        }
                    })
                    .catch(function(error) {
                        logError("Error loading session in watcher: " + (error.message || error), controllerId);
                        // Clear the invalid session ID
                        vm.fSummary.sessionId = "";
                        // Check if loading should complete even with error
                        timeout(function() {
                            vm.checkLoadingComplete();
                        }, 100);
                    });
            } else {
                timeout(function() {
                    vm.ensureFirstSummaryExpanded();
                    vm.checkLoadingComplete();
                }, 50);
            }
        });

        // Watch for changes in fSummary.categoryId
        $scope.$watch("vm.fSummary.categoryId", function (newCategoryId, oldCategoryId) {
            // Only clear session if this is a meaningful category change
            // (not initial load or undefined -> value transitions)
            if (newCategoryId !== oldCategoryId && 
                oldCategoryId !== undefined && 
                oldCategoryId !== "" && 
                oldCategoryId !== 0 &&
                newCategoryId !== undefined) {
                
                // Only clear session if we're actually changing to a different category
                // and we have a valid current session that might be in a different category
                if (vm.fSummary.sessionId && vm.cm.currentSession && 
                    vm.cm.currentSession.categoryId && 
                    vm.cm.currentSession.categoryId !== newCategoryId) {
                    vm.fSummary.sessionId = "";
                }
            }
        });

        function onAlbumSelect(albumId) {
            try {
                // Validate albumId
                if (!albumId || albumId <= 0) {
                    return;
                }
                
                // Check if album is already selected to avoid unnecessary clearing
                if (vm.fSummary.albumId === albumId) {
                    return;
                }
                
                // Update albumId first
                vm.fSummary.albumId = albumId;
                
                // Clear dependent fields only if we're changing albums
                vm.fSummary.sessionId = "";
                vm.fSummary.categoryId = "";
                vm.fSummary.sessionName = "";
                vm.fSummary.description = "";
                vm.fSummary.sessionDate = null;
                
                // Store the album selection in contentManager
                contentManager.setAdminStore(albumId, "", "");
            } catch (error) {
                logError("Exception in onAlbumSelect: " + (error.message || error), controllerId);
            }
        }

        function onSessionSelect(sessionId, categoryId) {
            try {
                if (!sessionId || sessionId <= 0) {
                    return;
                }

                contentManager.setCurrentSession(sessionId).then(function (response) {
                    if (vm.cm.currentSession) {
                        // Immediately populate session metadata (name, description, date)
                        selectSession();
                        
                        // Then handle the session list and summaries
                        syncSortableList();

                        if (vm.cm.currentSession.summary && vm.cm.currentSession.summary.length > 0) {
                            customizeData(vm.cm.currentSession.summary);

                            // Ensure first summary is expanded with a slight delay for UI to catch up
                            timeout(function () {
                                ensureFirstSummaryExpanded();
                            }, 150);
                        }

                        // Trigger the accordion ready event for proper binding
                        timeout(function () {
                            $scope.$broadcast('summaryAccordion:onReady');
                        }, 200);
                    } else {
                        logError("Current session is null after setting session ID: " + sessionId, controllerId);
                    }
                }).catch(function (error) {
                    logError("Failed to set current session: " + (error.message || error), controllerId);
                });
            } catch (error) {
                logError("Exception in onSessionSelect: " + (error.message || error), controllerId);
            }
        }

        function selectSession() {
            try {
                console.log("🔧 [ADMIN-UPLOAD-DEBUG] Session selection initiated", {
                    currentSession: vm.cm.currentSession ? {
                        id: vm.cm.currentSession.id,
                        name: vm.cm.currentSession.name,
                        mediaPath: vm.cm.currentSession.mediaPath,
                        groupId: vm.cm.currentSession.groupId
                    } : null,
                    controllerId: controllerId
                });

                // Ensure we have a current session before proceeding
                if (!vm.cm.currentSession || !vm.cm.currentSession.id) {
                    console.error("🔧 [ADMIN-UPLOAD-DEBUG] No current session available", {
                        currentSession: vm.cm.currentSession,
                        controllerId: controllerId
                    });
                    logError("No current session available in selectSession", controllerId);
                    return;
                }

                // Preserve the existing categoryId before updating fSummary
                var existingCategoryId = vm.fSummary.categoryId;

                var sessionData = {
                    albumId: vm.cm.currentSession.groupId || vm.fSummary.albumId,
                    sessionId: vm.cm.currentSession.id,
                    categoryId: existingCategoryId || vm.cm.currentSession.categoryId || "",
                    sessionName: vm.cm.currentSession.name || "",
                    description: vm.cm.currentSession.description || "",
                    sessionDate: vm.cm.currentSession.sessionDate
                        ? new Date(vm.cm.currentSession.sessionDate)
                        : new Date(),
                };

                vm.fSummary = newSummaryObject(sessionData);

                console.log("🔧 [ADMIN-UPLOAD-DEBUG] Session selected successfully", {
                    sessionId: vm.fSummary.sessionId,
                    sessionName: vm.fSummary.sessionName,
                    mediaPath: vm.cm.currentSession.mediaPath,
                    albumId: vm.fSummary.albumId,
                    uploadApiEndpoint: "api/file/mp3/session/" + vm.fSummary.sessionId,
                    expectedMediaUrl: config.urls.media + "/" + (vm.cm.currentSession.mediaPath || 'none') + ".mp3",
                    controllerId: controllerId
                });
            } catch (error) {
                console.error("🔧 [ADMIN-UPLOAD-DEBUG] Exception in selectSession", {
                    error: error,
                    message: error.message || error,
                    controllerId: controllerId
                });
                logError("Exception in selectSession: " + (error.message || error), controllerId);
            }
        }

        function newSummaryObject(defaults) {
            try {
                var summaryObject = angular.extend({
                    id: 0,
                    sequence: 0,
                    name: "",
                    description: "",
                    sessionId: 0,
                    albumId: 0,
                    categoryId: "",
                    sessionName: "",
                    sessionDate: new Date(),
                    isActive: true,
                    userId: memberId,
                    template: null,
                    coverImage: null,
                    ayats: [],
                    jumps: []
                }, defaults);

                return summaryObject;
            } catch (error) {
                logError("Exception in newSummaryObject: " + (error.message || error), controllerId);

                // Return a basic object if there's an error
                return {
                    id: 0,
                    sequence: 0,
                    name: "",
                    description: "",
                    sessionId: 0,
                    albumId: 0,
                    categoryId: "",
                    sessionName: "",
                    sessionDate: new Date(),
                    isActive: true,
                    userId: memberId || "",
                    template: null,
                    coverImage: null,
                    ayats: [],
                    jumps: []
                };
            }
        }

        // Enhanced onSummaryClick function with better class management
        vm.onSummaryClick = function(summaryId) {
            // Validate summaryId
            if (!summaryId) {
                return;
            }

            // Find the summary object by ID
            var summary = vm.cm.currentSession.summary.find(function(s) {
                return s.id === summaryId;
            });

            if (!summary) {
                return;
            }

            // Toggle expansion state
            summary.isExpanded = !summary.isExpanded;
            
            if (summary.isExpanded) {
                // Collapse all other summaries (one-at-a-time behavior)
                vm.cm.currentSession.summary.forEach(function(s) {
                    if (s.id !== summary.id) {
                        s.isExpanded = false;
                    }
                });
                common.$broadcast('adminSessionSummaryCtl', 'Summary expanded');
            } else {
                common.$broadcast('adminSessionSummaryCtl', 'Summary collapsed');
            }

            // Apply CSS classes immediately after state change
            timeout(function() {
                updateAccordionClasses();
            }, 0);
        };

        // Function to update CSS classes based on expansion state
        function updateAccordionClasses() {
            if (!vm.cm.currentSession || !vm.cm.currentSession.summary) return;
            
            vm.cm.currentSession.summary.forEach(function(summary) {
                var itemElement = angular.element('#summary-item-' + summary.id);
                var headerElement = angular.element('#summary-title-' + summary.id);
                
                if (summary.isExpanded) {
                    itemElement.removeClass('summary-item-collapsed').addClass('summary-item-expanded');
                    headerElement.addClass('expanded');
                } else {
                    itemElement.removeClass('summary-item-expanded').addClass('summary-item-collapsed');
                    headerElement.removeClass('expanded');
                }
            });
        }

        // Function to scroll to the expanded summary header
        function scrollToSummaryHeader(summaryId) {
            try {
                // Try multiple possible element selectors
                var targetSelectors = [
                    '#summary-title-' + summaryId,    // Header element
                    '#summary-item-' + summaryId,     // Container element  
                    '#summary-' + summaryId,          // Alternative ID pattern
                    '[data-summary-id="' + summaryId + '"]'  // Data attribute selector
                ];

                var targetElement = null;
                
                for (var i = 0; i < targetSelectors.length; i++) {
                    targetElement = document.querySelector(targetSelectors[i]);
                    if (targetElement) {
                        break;
                    }
                }

                if (targetElement) {
                    // Scroll with offset to show the header nicely
                    var elementRect = targetElement.getBoundingClientRect();
                    var offset = 100; // Offset from top of viewport
                    var targetPosition = elementRect.top + window.pageYOffset - offset;
                    
                    // Smooth scroll to position
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    logSuccess("Scrolled to summary: " + summaryId, controllerId);
                } else {
                    logError("Could not find target element for scroll", controllerId);
                }
            } catch (error) {
                logError("Exception scrolling to summary header: " + error.message, controllerId);
            }
        }

        // Call updateAccordionClasses when data is customized
        function customizeData(summaries) {
            try {
                console.debug("📋 customizeData: Starting summary customization", {
                    summariesCount: summaries ? summaries.length : 0,
                    summariesExists: !!summaries,
                    controllerId: controllerId
                });
                
                if (!summaries || summaries.length === 0) {
                    console.debug("📋 customizeData: No summaries to customize", {
                        summaries: summaries,
                        controllerId: controllerId
                    });
                    return;
                }

                // Debug: Show all summary titles before processing
                console.debug("📋 customizeData: Summary titles BEFORE customization", {
                    summaryTitles: summaries.map(function(s, i) { 
                        return {
                            index: i,
                            title: s.title,
                            id: s.id,
                            sequence: s.sequence,
                            sessionId: s.sessionId
                        };
                    }),
                    controllerId: controllerId
                });

                // Process each summary and ensure proper state
                summaries.forEach(function (summary, index) {
                    console.debug("📋 customizeData: Processing summary " + index, {
                        index: index,
                        summaryTitle: summary.title,
                        summaryId: summary.id,
                        summarySequence: summary.sequence,
                        summarySessionId: summary.sessionId,
                        summaryIsActive: summary.isActive,
                        summaryJumpLocation: summary.jumpLocation,
                        summaryIsPreviliged: summary.isPreviliged,
                        controllerId: controllerId
                    });
                    
                    // Ensure isActive property exists (default to true for backwards compatibility)
                    if (!summary.hasOwnProperty('isActive')) {
                        summary.isActive = true;
                    }

                    // Set expansion state - first summary should be expanded
                    if (index === 0) {
                        summary.isExpanded = true;

                        // Collapse all other summaries
                        for (var i = 1; i < summaries.length; i++) {
                            summaries[i].isExpanded = false;
                        }
                    }

                    // Ensure other required properties exist
                    if (!summary.hasOwnProperty('isPreviliged')) {
                        summary.isPreviliged = false;
                    }

                    if (!summary.time && summary.jumpLocation) {
                        summary.time = common.secondsToTime(summary.jumpLocation || 0);
                    }
                });

                // Debug: Show all summary titles after processing
                console.debug("📋 customizeData: Summary titles AFTER customization", {
                    summaryTitles: summaries.map(function(s, i) { 
                        return {
                            index: i,
                            title: s.title,
                            id: s.id,
                            sequence: s.sequence,
                            sessionId: s.sessionId,
                            isExpanded: s.isExpanded,
                            isActive: s.isActive,
                            time: s.time
                        };
                    }),
                    controllerId: controllerId
                });

                // Update accordion service with new data
                if (vm.summaryAccordion) {
                    console.debug("📋 customizeData: Updating accordion service with summaries", {
                        summariesCount: summaries.length,
                        accordionExists: !!vm.summaryAccordion,
                        controllerId: controllerId
                    });
                    vm.summaryAccordion.setItems(summaries);
                }

                // Bind ayah header removers after data is customized
                timeout(function () {
                    try {
                        bindAyahHeaderRemovers(".clickable-ayah-header");
                        
                        // Apply CSS classes after data customization
                        updateAccordionClasses();
                    } catch (bindError) {
                        logError("Error binding ayah header removers: " + (bindError.message || bindError), controllerId);
                    }
                }, 300);

                log("Summary data customized - First summary expanded, visual states updated", controllerId, config.showDevToasts);
            } catch (error) {
                console.error("❌ customizeData: Exception in customizeData", {
                    error: error,
                    errorMessage: error.message,
                    controllerId: controllerId
                });
                logError("Exception in customizeData: " + (error.message || error), controllerId);
            }
        }

        function ensureFirstSummaryExpanded() {
            try {
                if (vm.cm.currentSession && vm.cm.currentSession.summary && vm.cm.currentSession.summary.length > 0) {
                    // Collapse all summaries first
                    vm.cm.currentSession.summary.forEach(function (summary, index) {
                        summary.isExpanded = false;
                    });

                    // Expand only the first summary
                    vm.cm.currentSession.summary[0].isExpanded = true;
                    
                    // Mark first panel as expanded for loading state
                    if (!vm.firstPanelExpanded) {
                        vm.firstPanelExpanded = true;
                        vm.checkLoadingComplete();
                    }

                    // Force UI update and scroll to first summary
                    timeout(function () {
                        $scope.$digest();
                        
                        // Scroll to the expanded first summary after UI update
                        timeout(function () {
                            updateAccordionClasses();
                            scrollToSummaryHeader(vm.cm.currentSession.summary[0].id);
                        }, 100);
                    }, 50);

                    logSuccess("First summary expanded successfully", controllerId);
                }
            } catch (error) {
                logError("Exception ensuring first summary expanded: " + error.message, controllerId);
            }
        }

        // Function to check if loading is complete
        function checkLoadingComplete() {
            try {
                // Loading is complete when initialized AND either:
                // 1. First panel is expanded, OR 
                // 2. There are no summaries to expand
                var hasNoSummaries = !vm.cm.currentSession || !vm.cm.currentSession.summary || vm.cm.currentSession.summary.length === 0;
                var loadingComplete = vm.isInitialized && (vm.firstPanelExpanded || hasNoSummaries);
                
                if (loadingComplete) {
                    timeout(function() {
                        vm.isLoading = false;
                        log("Page loading completed - " + (hasNoSummaries ? "no summaries to expand" : "first panel expanded"), controllerId, config.showDevToasts);
                    }, hasNoSummaries ? 100 : 200); // Shorter delay if no summaries
                }
            } catch (error) {
                logError("Exception checking loading complete: " + error.message, controllerId);
            }
        }

        function onAlbumToggle(albumId, isActive) {
            try {
                if (!albumId || albumId <= 0) {
                    logError("Invalid album ID provided: " + albumId, controllerId);
                    return;
                }

                if (typeof isActive !== 'boolean') {
                    logError("Invalid isActive value provided: " + isActive, controllerId);
                    return;
                }

                datacontext.toggleAlbumActive(albumId, isActive).then(function (response) {
                    if (response && response.data && response.data.success) {
                        var message = isActive
                            ? "Album and all child categories/sessions/summaries activated successfully"
                            : "Album and all child categories/sessions/summaries deactivated successfully";
                        logSuccess(message, controllerId);

                        // Update visual states immediately for cascading effect
                        updateAlbumCascadeVisualState(albumId, isActive);

                        // Broadcast event to notify directive about successful toggle
                        $scope.$broadcast('albumToggleCompleted', albumId, isActive);

                        // Refresh current session data to reflect database changes
                        refreshCurrentSessionData();
                    } else {
                        logError("Failed to toggle album active state - no success response", controllerId);
                    }
                }).catch(function (error) {
                    var errorMessage = "Error toggling album active state: " + (error.data && error.data.message ? error.data.message : error.message || "Unknown error");
                    logError(errorMessage, controllerId);
                });
            } catch (error) {
                logError("Exception in album toggle: " + (error.message || error), controllerId);
            }
        }

        function onCategoryToggle(categoryId, isActive) {
            try {
                if (!categoryId || categoryId <= 0) {
                    logError("Invalid category ID provided: " + categoryId, controllerId);
                    return;
                }

                if (typeof isActive !== 'boolean') {
                    logError("Invalid isActive value provided: " + isActive, controllerId);
                    return;
                }

                datacontext.toggleCategoryActive(categoryId, isActive).then(function (response) {
                    if (response && response.data && response.data.success) {
                        var message = isActive
                            ? "Category and all child sessions/summaries activated successfully"
                            : "Category and all child sessions/summaries deactivated successfully";
                        logSuccess(message, controllerId);

                        // Update visual states immediately for cascading effect
                        updateCategoryCascadeVisualState(categoryId, isActive);

                        // Broadcast event to notify directive about successful toggle
                        $scope.$broadcast('categoryToggleCompleted', categoryId, isActive);

                        // Refresh current session data to reflect database changes
                        refreshCurrentSessionData();
                    } else {
                        logError("Failed to toggle category active state - no success response", controllerId);
                    }
                }).catch(function (error) {
                    var errorMessage = "Error toggling category active state: " + (error.data && error.data.message ? error.data.message : error.message || "Unknown error");
                    logError(errorMessage, controllerId);
                });
            } catch (error) {
                logError("Exception in category toggle: " + (error.message || error), controllerId);
            }
        }

        function onSessionToggle(sessionId, isActive) {
            try {
                if (!sessionId || sessionId <= 0) {
                    logError("Invalid session ID provided: " + sessionId, controllerId);
                    return;
                }

                if (typeof isActive !== 'boolean') {
                    logError("Invalid isActive value provided: " + isActive, controllerId);
                    return;
                }

                datacontext.toggleSessionActive(sessionId, isActive).then(function (response) {
                    if (response && response.data && response.data.success) {
                        var message = isActive
                            ? "Session and all summaries activated successfully"
                            : "Session and all summaries deactivated successfully";
                        logSuccess(message, controllerId);

                        // Update visual states immediately for cascading effect
                        updateSessionCascadeVisualState(sessionId, isActive);

                        // Broadcast event to notify directive about successful toggle
                        $scope.$broadcast('sessionToggleCompleted', sessionId, isActive);

                        // Refresh current session data to reflect database changes
                        refreshCurrentSessionData();

                    } else {
                        logError("Failed to toggle session active state - no success response", controllerId);
                    }
                }).catch(function (error) {
                    var errorMessage = "Error toggling session active state: " + (error.data && error.data.message ? error.data.message : error.message || "Unknown error");
                    logError(errorMessage, controllerId);
                });
            } catch (error) {
                logError("Exception in session toggle: " + (error.message || error), controllerId);
            }
        }

        // Helper functions for visual state updates
        function updateAlbumCascadeVisualState(albumId, isActive) {
            try {
                // Update current album state
                if (vm.cm.currentAlbum && vm.cm.currentAlbum.id === albumId) {
                    vm.cm.currentAlbum.isActive = isActive;
                }

                // Update all categories in current album
                if (vm.cm.categories && vm.cm.categories.length > 0) {
                    vm.cm.categories.forEach(function (category) {
                        category.isActive = isActive;
                    });
                }

                // Update all sessions in current album
                if (vm.cm.currentAlbum && vm.cm.currentAlbum.sessions) {
                    vm.cm.currentAlbum.sessions.forEach(function (session) {
                        session.isActive = isActive;
                    });
                }

                // Update current session and its summaries
                if (vm.cm.currentSession) {
                    vm.cm.currentSession.isActive = isActive;
                    if (vm.cm.currentSession.summary) {
                        vm.cm.currentSession.summary.forEach(function (summary) {
                            summary.isActive = isActive;
                        });
                    }
                }
            } catch (error) {
                logError("Error updating album cascade visual state: " + error.message, controllerId);
            }
        }

        function updateCategoryCascadeVisualState(categoryId, isActive) {
            try {
                // Update specific category
                if (vm.cm.categories && vm.cm.categories.length > 0) {
                    var targetCategory = vm.cm.categories.find(function (cat) { return cat.categoryId === categoryId; });
                    if (targetCategory) {
                        targetCategory.isActive = isActive;
                    }
                }

                // Update sessions in this category
                if (vm.cm.currentAlbum && vm.cm.currentAlbum.sessions) {
                    vm.cm.currentAlbum.sessions.forEach(function (session) {
                        if (session.categoryId === categoryId) {
                            session.isActive = isActive;
                        }
                    });
                }

                // Update current session if it belongs to this category
                if (vm.cm.currentSession && vm.cm.currentSession.categoryId === categoryId) {
                    vm.cm.currentSession.isActive = isActive;
                    if (vm.cm.currentSession.summary) {
                        vm.cm.currentSession.summary.forEach(function (summary) {
                            summary.isActive = isActive;
                        });
                    }
                }
            } catch (error) {
                logError("Error updating category cascade visual state: " + error.message, controllerId);
            }
        }

        function updateSessionCascadeVisualState(sessionId, isActive) {
            try {
                // Update specific session in album sessions list
                if (vm.cm.currentAlbum && vm.cm.currentAlbum.sessions) {
                    var targetSession = vm.cm.currentAlbum.sessions.find(function (sess) { return sess.id === sessionId; });
                    if (targetSession) {
                        targetSession.isActive = isActive;
                    }
                }

                // Update current session if it matches
                if (vm.cm.currentSession && vm.cm.currentSession.id === sessionId) {
                    vm.cm.currentSession.isActive = isActive;
                    if (vm.cm.currentSession.summary) {
                        vm.cm.currentSession.summary.forEach(function (summary) {
                            summary.isActive = isActive;
                        });
                    }
                }
            } catch (error) {
                logError("Error updating session cascade visual state: " + error.message, controllerId);
            }
        }

        function refreshCurrentSessionData() {
            try {
                if (vm.cm.currentSession && vm.cm.currentSession.id) {
                    var sessionId = vm.cm.currentSession.id;

                    // Re-fetch session data from server to get updated isActive states
                    contentManager.setCurrentSession(sessionId).then(function (response) {
                        // Update accordion items when session data changes
                        if (vm.summaryAccordion && vm.cm.currentSession && vm.cm.currentSession.summary) {
                            vm.summaryAccordion.setItems(vm.cm.currentSession.summary);
                        }
                        
                        // Ensure proper visual states and expand first summary
                        if (vm.cm.currentSession && vm.cm.currentSession.summary) {
                            customizeData(vm.cm.currentSession.summary);
                            ensureFirstSummaryExpanded();
                        }

                        // Force UI update
                        timeout(function () {
                            $scope.$digest();
                        }, 100);

                    }).catch(function (error) {
                        logError("Error refreshing session data: " + (error.message || error), controllerId);
                    });
                }
            } catch (error) {
                logError("Exception refreshing current session data: " + error.message, controllerId);
            }
        }

        function syncSortableList() {
            try {
                vm.sortableSessions = [];
                if (vm.cm.currentSession && vm.cm.currentSession.summary) {
                    vm.sortableSessions = vm.cm.currentSession.summary.map(function (s) {
                        return { id: s.id, title: s.title, sequence: s.sequence };
                    });
                }
            } catch (error) {
                logError("Error syncing sortable list: " + error.message, controllerId);
            }
        }

        function sessionOrderChanged(e) {
            try {
                if (!vm.sortableSessions || vm.sortableSessions.length === 0) {
                    return;
                }

                // Update sequence numbers based on new order
                vm.sortableSessions.forEach(function (session, index) {
                    session.sequence = index + 1;
                });

                datacontext.resequenceSummaries(vm.sortableSessions).then(function (response) {
                    logSuccess("Summary sequence updated successfully", controllerId);

                    // Refresh the current session to reflect new sequence
                    if (vm.cm.currentSession && vm.cm.currentSession.id) {
                        contentManager.setCurrentSession(vm.cm.currentSession.id);
                    }
                }).catch(function (error) {
                    logError("Error updating summary sequence: " + (error.message || error), controllerId);
                });
            } catch (error) {
                logError("Exception in session order changed: " + error.message, controllerId);
            }
        }

        function addnewSummary() {
            try {
                if (!vm.fSummary.sessionId || vm.fSummary.sessionId <= 0) {
                    logError("No session selected - cannot add summary", controllerId);
                    return;
                }

                // Create a new summary object
                var newSummary = {
                    id: 0,
                    title: "New Summary",
                    content: "<p><strong>Please enter meaningful summary content here...</strong></p><p>This summary should contain at least 10 characters of content to be saved.</p>",
                    sequence: vm.cm.currentSession.summary ? vm.cm.currentSession.summary.length + 1 : 1,
                    sessionId: vm.fSummary.sessionId,
                    jumpLocation: 0,
                    isActive: true,
                    isExpanded: false,
                    isPreviliged: false,
                    userId: memberId
                };

                // Add to current session summaries
                if (!vm.cm.currentSession.summary) {
                    vm.cm.currentSession.summary = [];
                }
                vm.cm.currentSession.summary.push(newSummary);

                // Sync sortable list
                syncSortableList();

                // Expand the new summary
                newSummary.isExpanded = true;

                // Scroll to the new summary
                timeout(function () {
                    var element = document.getElementById('summary-' + newSummary.sequence);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);

                logSuccess("New summary added successfully", controllerId);
            } catch (error) {
                logError("Exception adding new summary: " + error.message, controllerId);
            }
        }

        function onSummaryClick(summaryId) {
            try {
                // Convert summaryId to number if it's a string
                var summaryIdNum = typeof summaryId === 'string' ? parseInt(summaryId) : summaryId;
                
                // Find the actual summary object by ID
                var summary = null;
                if (vm.cm.currentSession && vm.cm.currentSession.summary) {
                    summary = vm.cm.currentSession.summary.find(function(s) {
                        return s.id === summaryIdNum;
                    });
                }
                
                if (!summary) {
                    logError("Could not find summary with ID: " + summaryIdNum, controllerId);
                    return;
                }

                // Set the current summary ID for editor context
                vm.currentSummaryId = summary.id;

                // Use accordion service if available, otherwise fall back to manual logic
                if (vm.summaryAccordion) {
                    // Set accordion items if not already set
                    if (vm.summaryAccordion.items.length === 0) {
                        vm.summaryAccordion.setItems(vm.cm.currentSession.summary);
                    }
                    
                    // Toggle using accordion service (handles auto-collapse)
                    vm.summaryAccordion.toggle(summary.id);
                } else {
                    // Fallback to manual accordion behavior
                    // Toggle expansion state
                    summary.isExpanded = !summary.isExpanded;
                    
                    if (summary.isExpanded) {
                        // Collapse all other summaries (one-at-a-time behavior)
                        vm.cm.currentSession.summary.forEach(function(s) {
                            if (s.id !== summary.id) {
                                s.isExpanded = false;
                            }
                        });
                        common.$broadcast('adminSessionSummaryCtl', 'Summary expanded');
                    } else {
                        common.$broadcast('adminSessionSummaryCtl', 'Summary collapsed');
                    }
                }

                // Apply CSS classes immediately after state change
                timeout(function() {
                    updateAccordionClasses();
                    
                    // Scroll to the expanded header after a short delay to ensure DOM is updated
                    if (summary.isExpanded) {
                        scrollToSummaryHeader(summary.id);
                    }
                }, 100);
            } catch (error) {
                logError("Exception in summary click: " + error.message, controllerId);
            }
        }

        function submit(summary) {
            try {
                if (!summary || !summary.sessionId || summary.sessionId <= 0) {
                    logError("Invalid summary data for submission", controllerId);
                    return;
                }

                // Ensure required fields
                if (!summary.title || summary.title.trim() === "") {
                    summary.title = "Untitled Summary";
                }

                // 🛡️ VALIDATION: Prevent saving empty summaries
                var contentText = "";
                if (summary.content) {
                    contentText = summary.content.replace(/<[^>]*>/g, '').trim(); // Strip HTML tags and trim
                }
                
                if (!contentText || contentText.length < 10) {
                    logError("Cannot save summary '" + summary.title + "': Content must be at least 10 characters long. Please add meaningful content.", controllerId);
                    return; // Exit without saving
                }

                // Set user ID
                summary.userId = memberId;

                datacontext.addUpdateSessionSummary(summary).then(function (response) {
                    if (response && response.data) {
                        // Update the ID if it was a new summary
                        if (summary.id === 0) {
                            summary.id = response.data;
                        }

                        logSuccess("Summary saved successfully: " + summary.title, controllerId);

                        // Sync the sortable list
                        syncSortableList();

                        // Bind ayah header removers after save
                        timeout(function () {
                            bindAyahHeaderRemovers(".clickable-ayah-header");
                        }, 100);

                    } else {
                        logError("No response data from summary save", controllerId);
                    }
                }).catch(function (error) {
                    var errorMessage = "Error saving summary: " + (error.data && error.data.message ? error.data.message : error.message || "Unknown error");
                    logError(errorMessage, controllerId);
                });
            } catch (error) {
                logError("Exception submitting summary: " + error.message, controllerId);
            }
        }

        function saveAllSummaries() {
            try {
                if (!vm.cm.currentSession || !vm.cm.currentSession.summary || vm.cm.currentSession.summary.length === 0) {
                    logError("No summaries to save", controllerId);
                    return;
                }

                var savePromises = vm.cm.currentSession.summary.map(function (summary, index) {
                    // Ensure required fields
                    if (!summary.title || summary.title.trim() === "") {
                        summary.title = "Untitled Summary " + (index + 1);
                    }

                    // 🛡️ VALIDATION: Skip empty summaries in batch save
                    var validation = validateSummaryContent(summary.content, summary.title);
                    if (!validation.isValid) {
                        logError("Skipped saving '" + summary.title + "': " + validation.message, controllerId);
                        return Promise.resolve(null); // Skip this summary but don't fail the batch
                    }

                    summary.userId = memberId;
                    summary.sessionId = vm.fSummary.sessionId;
                    summary.sequence = index + 1;

                    return datacontext.addUpdateSessionSummary(summary);
                }).filter(function(promise) {
                    return promise !== null; // Remove null promises from skipped summaries
                });

                // Execute all saves
                Promise.all(savePromises).then(function (responses) {
                    // Update IDs for new summaries
                    responses.forEach(function (response, index) {
                        if (response && response.data && vm.cm.currentSession.summary[index].id === 0) {
                            vm.cm.currentSession.summary[index].id = response.data;
                        }
                    });

                    logSuccess("All summaries saved successfully (" + responses.length + " summaries)", controllerId);

                    // Sync sortable list
                    syncSortableList();

                    // Bind ayah header removers
                    timeout(function () {
                        bindAyahHeaderRemovers(".clickable-ayah-header");
                    }, 200);

                }).catch(function (error) {
                    logError("Error saving all summaries: " + (error.message || error), controllerId);
                });

            } catch (error) {
                logError("Exception saving all summaries: " + error.message, controllerId);
            }
        }

        // 🛡️ VALIDATION: Helper function to check if summary content is sufficient
        function validateSummaryContent(content, title) {
            if (!content) {
                return {
                    isValid: false,
                    message: "Summary content is required. Please add meaningful content."
                };
            }
            
            var contentText = content.replace(/<[^>]*>/g, '').trim(); // Strip HTML tags and trim
            var minLength = 10;
            
            if (contentText.length < minLength) {
                return {
                    isValid: false,
                    message: "Summary content must be at least " + minLength + " characters long. Current length: " + contentText.length + " characters."
                };
            }
            
            return {
                isValid: true,
                message: "Content is valid"
            };
        }

        // 🛡️ VALIDATION: Public method to validate a summary before saving
        function validateSummaryForSave(summary) {
            var validation = validateSummaryContent(summary.content, summary.title);
            
            if (!validation.isValid) {
                logError("Cannot save summary '" + (summary.title || 'Untitled') + "': " + validation.message, controllerId);
                return false;
            }
            
            return true;
        }

        function deleteSummary(summary) {
            try {
                if (!summary || !summary.id || summary.id <= 0) {
                    logError("Invalid summary for deletion", controllerId);
                    return;
                }

                var confirmMessage = "Are you sure you want to delete this summary?\n\n" + summary.title;

                dlg.confirmationDialog("Confirm Deletion", confirmMessage, "Yes", "Cancel")
                    .then(function (result) {
                        if (result === "ok") {
                            datacontext.deleteSummaryById(summary).then(function (response) {
                                // Remove from local arrays
                                if (vm.cm.currentSession && vm.cm.currentSession.summary) {
                                    var index = vm.cm.currentSession.summary.findIndex(function (s) { return s.id === summary.id; });
                                    if (index > -1) {
                                        vm.cm.currentSession.summary.splice(index, 1);
                                    }
                                }

                                // Sync sortable list
                                syncSortableList();

                                logSuccess("Summary deleted successfully: " + summary.title, controllerId);

                            }).catch(function (error) {
                                logError("Error deleting summary: " + (error.message || error), controllerId);
                            });
                        }
                    })
                    .catch(function () {
                        // Deletion dialog cancelled
                    });

            } catch (error) {
                logError("Exception deleting summary: " + error.message, controllerId);
            }
        }

        function cancelEdit(summary) {
            try {
                if (!summary || !summary.id || summary.id <= 0) {
                    return;
                }

                // Reload the summary from server to restore original content
                datacontext.getSummaryContentById(summary.id).then(function (response) {
                    if (response && response.data) {
                        // Restore original content
                        summary.content = response.data.content;
                        summary.title = response.data.title;
                        summary.jumpLocation = response.data.jumpLocation;

                        logSuccess("Edit cancelled - content restored", controllerId);

                        // Bind ayah header removers after restoration
                        timeout(function () {
                            bindAyahHeaderRemovers(".clickable-ayah-header");
                        }, 100);

                    } else {
                        logError("Could not restore original content", controllerId);
                    }
                }).catch(function (error) {
                    logError("Error restoring original content: " + (error.message || error), controllerId);
                });

            } catch (error) {
                logError("Exception cancelling edit: " + error.message, controllerId);
            }
        }

        function gotoTop() {
            try {
                // Scroll to top of page smoothly
                $document.duScrollTo(angular.element(document.getElementById('top')), 0, 1000);
            } catch (error) {
                // Fallback to standard scrolling
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        function jumpToLocation(summary) {
            // Handle both summary object and direct jumpLocation number
            var jumpLocation;
            var summaryTitle;
            
            if (typeof summary === 'object' && summary.jumpLocation) {
                jumpLocation = summary.jumpLocation;
                summaryTitle = summary.title;
            } else if (typeof summary === 'number') {
                jumpLocation = summary;
                summaryTitle = "location";
            } else {
                logError("Invalid jump location provided", controllerId);
                return;
            }

            try {
                if (!jumpLocation || jumpLocation <= 0) {
                    logError("No valid jump location for: " + summaryTitle, controllerId);
                    return;
                }

                if (!vm.isMediaReadyToPlay) {
                    logError("Media player is not ready", controllerId);
                    return;
                }

                // Jump to the specified time in the audio player
                $("#jquery_jplayer_1").jPlayer("play", jumpLocation);
                logSuccess("Jumped to " + summaryTitle + " at " + common.secondsToTime(jumpLocation), controllerId);

            } catch (error) {
                logError("Exception jumping to location: " + error.message, controllerId);
            }
        }

        function calculateSecondsFromTime(timeString) {
            if (!timeString) return 0;

            try {
                var parts = timeString.split(':');
                var seconds = 0;

                if (parts.length === 3) {
                    // HH:MM:SS format
                    seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                } else if (parts.length === 2) {
                    // MM:SS format
                    seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                } else {
                    // Just seconds
                    seconds = parseInt(timeString);
                }

                return isNaN(seconds) ? 0 : seconds;
            } catch (error) {
                return 0;
            }
        }

        function calculateTimeFromSeconds(seconds) {
            if (!seconds || seconds <= 0) return "0:00";

            try {
                var hours = Math.floor(seconds / 3600);
                var minutes = Math.floor((seconds % 3600) / 60);
                var secs = Math.floor(seconds % 60);

                if (hours > 0) {
                    return hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (secs < 10 ? "0" : "") + secs;
                } else {
                    return minutes + ":" + (secs < 10 ? "0" : "") + secs;
                }
            } catch (error) {
                return "0:00";
            }
        }

        function fileDeleteComplete() {
            console.log("🔧 [ADMIN-UPLOAD-DEBUG] File delete completed", {
                currentSessionId: vm.cm.currentSession ? vm.cm.currentSession.id : 'none',
                currentSessionName: vm.cm.currentSession ? vm.cm.currentSession.name : 'none',
                mediaPath: vm.cm.currentSession ? vm.cm.currentSession.mediaPath : 'none',
                controllerId: controllerId
            });

            // Refresh session data if needed
            if (vm.cm.currentSession && vm.cm.currentSession.id) {
                console.log("🔧 [ADMIN-UPLOAD-DEBUG] Refreshing session data after file delete", {
                    sessionId: vm.cm.currentSession.id,
                    controllerId: controllerId
                });
                contentManager.setCurrentSession(vm.cm.currentSession.id);
            }
        }

        // Add file upload success handler for comprehensive tracking
        function fileUploadSuccess(response) {
            console.log("🔧 [ADMIN-UPLOAD-DEBUG] File upload completed successfully", {
                response: response,
                hasResponse: !!response,
                hasData: !!(response && response.data),
                hasLink: !!(response && response.data && response.data.link),
                uploadedFile: response && response.data ? response.data.link : 'unknown',
                currentSessionId: vm.cm.currentSession ? vm.cm.currentSession.id : 'none',
                currentSessionName: vm.cm.currentSession ? vm.cm.currentSession.name : 'none',
                expectedPath: config.urls.media,
                controllerId: controllerId
            });

            // Update the current session's media path
            if (response && response.data && response.data.link && vm.cm.currentSession) {
                var oldMediaPath = vm.cm.currentSession.mediaPath;
                vm.cm.currentSession.mediaPath = response.data.link;
                
                console.log("🔧 [ADMIN-UPLOAD-DEBUG] Updated session media path", {
                    sessionId: vm.cm.currentSession.id,
                    oldMediaPath: oldMediaPath,
                    newMediaPath: vm.cm.currentSession.mediaPath,
                    uploadUrl: response.data.link,
                    expectedUrl: config.urls.media + "/" + response.data.link + ".mp3",
                    controllerId: controllerId
                });

                // Refresh session data to ensure consistency
                contentManager.setCurrentSession(vm.cm.currentSession.id).then(function() {
                    console.log("🔧 [ADMIN-UPLOAD-DEBUG] Session refreshed after upload", {
                        sessionId: vm.cm.currentSession.id,
                        mediaPath: vm.cm.currentSession.mediaPath,
                        controllerId: controllerId
                    });
                }).catch(function(error) {
                    console.error("🔧 [ADMIN-UPLOAD-DEBUG] Failed to refresh session after upload", {
                        error: error,
                        sessionId: vm.cm.currentSession.id,
                        controllerId: controllerId
                    });
                });
            }

            logSuccess("Media file uploaded successfully: " + (response && response.data ? response.data.link : 'unknown'), controllerId);
        }

        function saveSessionMetadata() {
            try {
                if (!vm.fSummary.sessionId || vm.fSummary.sessionId <= 0) {
                    return;
                }

                var metadata = {
                    sessionId: vm.fSummary.sessionId,
                    sessionName: vm.fSummary.sessionName || "",
                    sessionDesc: vm.fSummary.description || "",
                    sessionDate: vm.fSummary.sessionDate || new Date(),
                    categoryId: vm.fSummary.categoryId || ""
                };

                datacontext.saveSessionMetadata(metadata).then(function (response) {
                    logSuccess("Session metadata saved successfully", controllerId);

                    // Broadcast event to update any session lists
                    $scope.$broadcast('sessionMetadataUpdated');

                }).catch(function (error) {
                    logError("Error saving session metadata: " + (error.message || error), controllerId);
                });
            } catch (error) {
                logError("Exception saving session metadata: " + error.message, controllerId);
            }
        }

        // Initialize Froala options after functions are defined
        var froalaOverrides = {
            init: froalaEditorInit,
            images: {
                beforeUpload: beforeImageUpload,
                error: onImageUploadError,
                inserted: onImageInserted
            }
        };
        var froalaSaveOpts = {
            autosave: true,
            saveInterval: 1500,
            events: {
                beforeSave: onBeforeSave
            }
        };
        
        vm.froalaOptions = froalaConfig.fEditorAdvancedOptions(froalaOverrides, froalaSaveOpts);

        // Set the session sort options after function is defined
        vm.sessionSortOptions.orderChanged = sessionOrderChanged;

        // Assign methods to vm after they are defined
        vm.onAlbumSelect = onAlbumSelect;
        vm.onSessionSelect = onSessionSelect;
        vm.onAlbumToggle = onAlbumToggle;
        vm.onCategoryToggle = onCategoryToggle;
        vm.onSessionToggle = onSessionToggle;
        vm.addnewSummary = addnewSummary;
        vm.onSummaryClick = onSummaryClick;
        vm.submit = submit;
        vm.saveAllSummaries = saveAllSummaries;
        vm.deleteSummary = deleteSummary;
        vm.cancelEdit = cancelEdit;
        vm.gotoTop = gotoTop;
        vm.jumpToLocation = jumpToLocation;
        vm.calculateSecondsFromTime = calculateSecondsFromTime;
        vm.calculateTimeFromSeconds = calculateTimeFromSeconds;
        vm.fileDeleteComplete = fileDeleteComplete;
        vm.fileUploadSuccess = fileUploadSuccess;
        vm.saveSessionMetadata = saveSessionMetadata;
        vm.ensureFirstSummaryExpanded = ensureFirstSummaryExpanded;
        vm.checkLoadingComplete = checkLoadingComplete;
        vm.syncSortableList = syncSortableList;
        vm.customizeData = customizeData;
        vm.selectSession = selectSession;
        vm.newSummaryObject = newSummaryObject;
        vm.validateSummaryForSave = validateSummaryForSave;
    }
})();