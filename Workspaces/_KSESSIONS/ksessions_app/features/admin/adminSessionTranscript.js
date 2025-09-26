(function () {
    "use strict";
    var controllerId = "adminSessionTranscriptCtl";
    angular.module("app").controller(controllerId,
        [
            "$scope", "bootstrap.dialog", "common", "config", "contentManager", "datacontext", "froalaConfig", "fileUpload",
            adminSessionTranscriptCtl
        ]);

    function adminSessionTranscriptCtl($scope, dlg, common, config, contentManager, datacontext, froalaConfig, fileUpload) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logInfo = getLogFn(controllerId, "info");
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");
        var timeout = common.$timeout;
        // Sermon delivery parameters optimized for Islamic content
        var sermonDeliveryConfig = {
            baseWordsPerMinute: 120,        // Standard speaking pace
            pauseFactorPercentage: 15,      // Account for pauses between verses, reflection time
            arabicSlowdownFactor: 0.8,      // Arabic text typically spoken slower
            translationSpeedFactor: 1.1,    // English translations can be read faster
            poetrySlowdownFactor: 0.7       // Poetry requires slower, more deliberate delivery
        };

        var froalaOverrides = {
            init: froalaEditorInit,
            images: {
                beforeUpload: beforeImageUpload,
                error: onImageUploadError,
                inserted: onImageInserted
            },
            videos: {
                inserted: onVideoInserted,
                removed: onVideoRemoved
            }
        };
        var froalaSaveOpts = {
            autosave: true,
            saveInterval: 1500,
            autosaveURL: "api/admin/session/transcript/autosave",
            events: {
                beforeSave: onBeforeSave,
                afterSave: onAftereSave
            }
        };

        $scope.vm = {};
        var vm = $scope.vm;

        vm.cm = contentManager;
        vm.fUpdater = {
            categories: [],
            albumId: 0,
            categoryId: 0,
            sessionId: 0,
            sessionName: "",
            sessionDesc: ""
        };

        vm.fTranscript = {};
        vm.fEditor = null;
        vm.viewReady = false;
        vm.isUploading = false; // Track file upload state
        
        // Media Player Properties
        vm.isMediaReadyToPlay = false;
        vm.isAudioPlayerExpanded = false; // Audio player collapsed by default
        vm.mediaEvent = mediaEvent;
        vm.toggleAudioPlayer = toggleAudioPlayer;
        
        // Session Token Panel Properties - ensure proper initialization
        vm.showTokenPanel = false;
        vm.tokenPanelSessionId = 0;
        vm.tokenPanelInitialized = false;
        vm.tokenCount = 0; // Add token count property
        vm.isRestoringAyah = false; // Flag to prevent multiple restoration executions
        vm.usingEventDelegation = true; // Use event delegation to prevent double bindings
        
        // Legacy ahadees panel properties removed - now handled by Froala plugin
        
        // Enhanced Froala configuration with YouTube video embedding support
        // Video toolbar button enables: YouTube URL embedding, iframe embeds, and responsive video display
        vm.froalaOptions = froalaConfig.fEditorAdvancedOptions(froalaOverrides, froalaSaveOpts);

        vm.onAlbumSelect = onAlbumSelect;
        vm.onSessionSelect = onSessionSelect;
        vm.onAlbumToggle = onAlbumToggle;
        vm.onCategoryToggle = onCategoryToggle;
        vm.onSessionToggle = onSessionToggle;
        vm.saveTranscript = saveTranscript;
        vm.summarizeTranscript = summarizeTranscript;
        vm.updateMetadata = updateMetadata;
        vm.breakIntoSessions = breakIntoSessions;
        vm.toggleTokenPanel = toggleTokenPanel;
        vm.closeTokenPanel = closeTokenPanel;
        // Legacy ahadees panel methods removed - now handled by Froala plugin
        vm.copyToClipboard = copyToClipboard;
        vm.pasteFromClipboard = pasteFromClipboard;
        vm.deleteSession = deleteSession;
        vm.loadTokenCount = loadTokenCount; // Add method to load token count
        vm.onDescriptionBlur = onDescriptionBlur;
        vm.uploadAudioFile = uploadAudioFile;
        vm.deleteAudioFile = deleteAudioFile;

        activateController();

        function activateController() {
            contentManager.initialize();
            var promises = [contentManager.getAllAlbums()];
            common.activateController(promises, controllerId).then(onControllerActivation);

            function onControllerActivation(result) {
                // Initialize transcript object with values from adminStore if available
                vm.fTranscript = newTranscriptObject({
                    albumId: contentManager.adminStore.albumId || "",
                    categoryId: contentManager.adminStore.categoryId || "",
                    sessionId: contentManager.adminStore.sessionId || ""
                });
                
                // Also initialize fUpdater with the same values after a short delay to ensure contentManager is ready
                common.$timeout(function () {
                    vm.fUpdater.albumId = vm.fTranscript.albumId;
                    vm.fUpdater.categoryId = vm.fTranscript.categoryId;
                    vm.fUpdater.sessionId = vm.fTranscript.sessionId;
                }, 500);
                
                // Ensure token panel is properly hidden on initialization
                vm.showTokenPanel = false;
                vm.tokenPanelInitialized = false;
                vm.tokenPanelSessionId = 0;
                vm.tokenCount = 0; // Initialize token count
                
                // Initialize Ahadees panel state (legacy - removed)
                // Froala ahadees plugin now handles all ahadees functionality
                
                vm.viewReady = true;
                
                console.log("DEBUG: adminSessionTranscript activation completed", {
                    controllerId: controllerId,
                    froalaVideoFeatures: {
                        videoUpload: vm.froalaOptions.videoUpload,
                        videoResponsive: vm.froalaOptions.videoResponsive,
                        videoInsertButtons: vm.froalaOptions.videoInsertButtons
                    },
                    initialState: {
                        albumId: vm.fTranscript.albumId,
                        categoryId: vm.fTranscript.categoryId,
                        sessionId: vm.fTranscript.sessionId
                    },
                    tokenPanelState: {
                        showTokenPanel: vm.showTokenPanel,
                        tokenPanelInitialized: vm.tokenPanelInitialized,
                        tokenPanelSessionId: vm.tokenPanelSessionId
                    }
                });
                
                // Setup dynamic ayah header click handling early
                setupDynamicAyahHeaderHandling();
                
                // Setup block removal keyboard shortcut (Ctrl+D)
                setupBlockRemovalShortcut();
                
                log("Activated adminSessionTranscript View with YouTube video embedding support", controllerId, config.showDevToasts);
            }
        }
        
        // Cleanup function for keyboard shortcuts
        $scope.$on('$destroy', function() {
            // Remove keyboard event listeners to prevent memory leaks
            angular.element(document).off('keydown.blockRemoval');
            angular.element(document).off('keydown'); // Keep existing cleanup
            
            // Clean up dynamic ayah header event listeners
            $(document).off('click.ayahHeaders');
            $(document).off('quranTokenInserted.adminTranscript');
            
            console.log('🧹 [ADMIN] Keyboard shortcuts (including block removal) and ayah header listeners cleaned up on controller destroy');
        });

        $scope.$watch("vm.fTranscript.categoryId",
            function (newCategoryId, oldId) {
                if (newCategoryId && newCategoryId > 0) {
                    vm.fUpdater.categories = angular.copy(contentManager.categories);
                    vm.fUpdater.categoryId = angular.copy(newCategoryId);
                }
                
                // Hide token panel when category changes and reset initialization
                if (oldId !== newCategoryId && vm.showTokenPanel) {
                    console.log("🔧 DEBUG: Category changed - closing token panel", {
                        oldCategoryId: oldId,
                        newCategoryId: newCategoryId,
                        tokenPanelWasOpen: vm.showTokenPanel
                    });
                    vm.showTokenPanel = false;
                    vm.tokenPanelInitialized = false;
                }
            }
        );

        // Watch for album changes to hide token panel
        $scope.$watch("vm.fTranscript.albumId", function(newAlbumId, oldAlbumId) {
            // Hide token panel when album changes and reset initialization
            if (oldAlbumId !== newAlbumId && vm.showTokenPanel) {
                console.log("🔧 DEBUG: Album changed - closing token panel", {
                    oldAlbumId: oldAlbumId,
                    newAlbumId: newAlbumId,
                    tokenPanelWasOpen: vm.showTokenPanel
                });
                vm.showTokenPanel = false;
                vm.tokenPanelInitialized = false;
            }
        });

        // Watch for session changes to update token panel
        $scope.$watch("vm.fTranscript.sessionId", function(newSessionId, oldSessionId) {
            console.log("🔧 DEBUG: Session ID watcher triggered", {
                oldSessionId: oldSessionId,
                newSessionId: newSessionId,
                showTokenPanel: vm.showTokenPanel,
                currentTokenPanelSessionId: vm.tokenPanelSessionId,
                isInitialized: vm.tokenPanelInitialized,
                needsUpdate: vm.showTokenPanel && vm.tokenPanelSessionId !== newSessionId
            });
            
            // Reset initialization flag when session changes to ensure proper first-time setup
            if (newSessionId !== oldSessionId) {
                console.log("🔧 DEBUG: Session changed - resetting token panel initialization", {
                    oldSessionId: oldSessionId,
                    newSessionId: newSessionId,
                    wasInitialized: vm.tokenPanelInitialized
                });
                vm.tokenPanelInitialized = false;
            }
            
            // If the token panel is open and the session changed, update the binding
            if (vm.showTokenPanel && newSessionId !== oldSessionId && newSessionId && newSessionId > 0) {
                console.log("🔧 DEBUG: Force updating tokenPanelSessionId due to session change", {
                    oldTokenPanelSessionId: vm.tokenPanelSessionId,
                    newTokenPanelSessionId: newSessionId,
                    reason: "session_changed_while_panel_open"
                });
                
                // Close the panel first to clear stale data
                vm.showTokenPanel = false;
                
                // Update the session ID and force angular to detect the change
                var oldTokenPanelSessionId = vm.tokenPanelSessionId;
                vm.tokenPanelSessionId = newSessionId;
                
                // Force Angular to detect the binding change
                $scope.$evalAsync(function() {
                    console.log("🔧 DEBUG: Forcing Angular digest for tokenPanelSessionId change", {
                        oldValue: oldTokenPanelSessionId,
                        newValue: vm.tokenPanelSessionId
                    });
                });
                
                console.log("🔧 DEBUG: Token panel closed due to session change - user must reopen for new session");
            }
            
            // Load token count when session changes
            if (newSessionId && newSessionId > 0 && newSessionId !== oldSessionId) {
                loadTokenCount();
            } else if (!newSessionId || newSessionId <= 0) {
                vm.tokenCount = 0;
            }
        });

        // Listen for token updates from the token panel
        $scope.$on('tokensUpdated', function(event, sessionId) {
            console.log("DEBUG: tokensUpdated event received", {
                sessionId: sessionId,
                currentSessionId: vm.fTranscript.sessionId
            });
            
            // Only reload if it's for the current session
            if (sessionId === vm.fTranscript.sessionId) {
                loadTokenCount();
            }
        });

        function onAlbumSelect(albumId) {
            vm.fTranscript.categoryId = -1;
            vm.fTranscript.sessionId = -1;
            vm.fTranscript.transcript = "";
        }

        function onAlbumToggle(albumId, isActive) {
            try {
                // Validate inputs
                if (!albumId || albumId <= 0) {
                    logError("Invalid album ID provided: " + albumId, controllerId);
                    return;
                }
                
                if (typeof isActive !== 'boolean') {
                    logError("Invalid isActive value provided: " + isActive, controllerId);
                    return;
                }
                
                // Call the datacontext method to toggle album active state
                datacontext.toggleAlbumActive(albumId, isActive).then(function (response) {
                    if (response && response.data && response.data.success) {
                        var message = isActive ? "Album and associated categories/sessions/summaries activated successfully" : "Album and associated categories/sessions/summaries deactivated successfully";
                        logSuccess(message, controllerId);
                        
                        // Broadcast event to notify directive about successful toggle
                        $scope.$broadcast('albumToggleCompleted', albumId, isActive);
                        
                        // Refresh the current session data to reflect the changes
                        if (vm.cm.currentSession && vm.cm.currentSession.id) {
                            contentManager.setCurrentSession(vm.cm.currentSession.id).then(function () {
                                // Refresh the transcript if needed
                                setSessionTranscript(vm.cm.currentSession.id);
                            }).catch(function(refreshError) {
                                logError("Error refreshing session data: " + (refreshError.message || refreshError), controllerId);
                            });
                        }
                    } else {
                        logError("Failed to toggle album active state - no success response", controllerId);
                    }
                }).catch(function (error) {
                    var errorMessage = "Error toggling album active state: ";
                    if (error.data && error.data.message) {
                        errorMessage += error.data.message;
                    } else if (error.message) {
                        errorMessage += error.message;
                    } else if (error.statusText) {
                        errorMessage += error.statusText + " (Status: " + error.status + ")";
                    } else {
                        errorMessage += "Unknown error";
                    }
                    
                    logError(errorMessage, controllerId);
                });
                
            } catch (error) {
                logError("Exception in album toggle: " + (error.message || error), controllerId);
            }
        }

        function onCategoryToggle(categoryId, isActive) {
            try {
                // Validate inputs
                if (!categoryId || categoryId <= 0) {
                    logError("Invalid category ID provided: " + categoryId, controllerId);
                    return;
                }
                
                if (typeof isActive !== 'boolean') {
                    logError("Invalid isActive value provided: " + isActive, controllerId);
                    return;
                }
                
                // Call the datacontext method to toggle category active state
                datacontext.toggleCategoryActive(categoryId, isActive).then(function (response) {
                    if (response && response.data && response.data.success) {
                        var message = isActive ? "Category and associated sessions/summaries activated successfully" : "Category and associated sessions/summaries deactivated successfully";
                        logSuccess(message, controllerId);
                        
                        // Broadcast event to notify directive about successful toggle
                        $scope.$broadcast('categoryToggleCompleted', categoryId, isActive);
                        
                        // Refresh the current session data to reflect the changes
                        if (vm.cm.currentSession && vm.cm.currentSession.id) {
                            contentManager.setCurrentSession(vm.cm.currentSession.id).then(function () {
                                // Refresh the transcript if needed
                                setSessionTranscript(vm.cm.currentSession.id);
                            }).catch(function(refreshError) {
                                logError("Error refreshing session data: " + (refreshError.message || refreshError), controllerId);
                            });
                        }
                    } else {
                        logError("Failed to toggle category active state - no success response", controllerId);
                    }
                }).catch(function (error) {
                    var errorMessage = "Error toggling category active state: ";
                    if (error.data && error.data.message) {
                        errorMessage += error.data.message;
                    } else if (error.message) {
                        errorMessage += error.message;
                    } else if (error.statusText) {
                        errorMessage += error.statusText + " (Status: " + error.status + ")";
                    } else {
                        errorMessage += "Unknown error";
                    }
                    
                    logError(errorMessage, controllerId);
                });
                
            } catch (error) {
                logError("Exception in category toggle: " + error.message, controllerId);
            }
        }

        function onSessionToggle(sessionId, isActive) {
            try {
                // Validate inputs
                if (!sessionId || sessionId <= 0) {
                    logError("Invalid session ID provided: " + sessionId, controllerId);
                    return;
                }
                
                if (typeof isActive !== 'boolean') {
                    logError("Invalid isActive value provided: " + isActive, controllerId);
                    return;
                }
                
                // Call the datacontext method to toggle session active state
                datacontext.toggleSessionActive(sessionId, isActive).then(function (response) {
                    if (response && response.data && response.data.success) {
                        var message = isActive ? "Session and associated summaries activated successfully" : "Session and associated summaries deactivated successfully";
                        logSuccess(message, controllerId);
                        
                        // Broadcast event to notify directive about successful toggle
                        $scope.$broadcast('sessionToggleCompleted', sessionId, isActive);
                        
                        // Refresh the current session data to reflect the changes
                        if (vm.cm.currentSession && vm.cm.currentSession.id) {
                            contentManager.setCurrentSession(vm.cm.currentSession.id).then(function () {
                                // Refresh the transcript if needed
                                setSessionTranscript(vm.cm.currentSession.id);
                            }).catch(function(refreshError) {
                                logError("Error refreshing session data: " + (refreshError.message || refreshError), controllerId);
                            });
                        }
                    } else {
                        logError("Failed to toggle session active state - no success response", controllerId);
                    }
                }).catch(function (error) {
                    var errorMessage = "Error toggling session active state: ";
                    if (error.data && error.data.message) {
                        errorMessage += error.data.message;
                    } else if (error.message) {
                        errorMessage += error.message;
                    } else if (error.statusText) {
                        errorMessage += error.statusText + " (Status: " + error.status + ")";
                    } else {
                        errorMessage += "Unknown error";
                    }
                    
                    logError(errorMessage, controllerId);
                });
                
            } catch (error) {
                logError("Exception in session toggle: " + (error.message || error), controllerId);
            }
        }

        //Froala events
        function froalaEditorInit(e, editor) {
            vm.fEditor = editor;
        }

        
        function froalaEditorInit(e, editor) {
            console.log("DEBUG: Froala editor initialized for session token panel", {
                controllerId: controllerId,
                sessionId: vm.fTranscript.sessionId
            });

            // Store reference to the editor instance
            vm.fEditor = editor;
            
            // Set up editor for token panel integration
            timeout(function() {
                if (vm.fEditor && vm.fEditor.$el) {
                    console.log("DEBUG: Editor element available for token panel integration");
                }
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

        function onAftereSave(e, editor, response) {
            //
        }

        function onImageInserted(e, editor, $img, response) {
            //Add these values to class to make the image inline and right oriented [fr-dii fr-fir]
            $($img[0]).addClass("imgResponsive fr-bordered");
            
            // Add canonical data-* attributes for images (Phase 5)
            var imageElement = $img[0];
            var imageSrc = $img.attr('src') || '';
            
            // Extract image ID from the path (e.g., "Resources/IMAGES/213/66560670-abc123.jpg")
            var imageIdMatch = imageSrc.match(/\/([^\/]+)\.jpg$/);
            var imageId = imageIdMatch ? imageIdMatch[1] : 'unknown';
            var sessionId = vm.cm.currentSession ? vm.cm.currentSession.id : 'unknown';
            
            // Generate unique UUID for this image insertion
            var insertionId = generateUUID();
            
            // DEBUG: Log data-* attributes being added to Image HTML
            console.log('🔍 [IMAGE-INSERTED] Adding data-* attributes to Image HTML:', {
                insertionId: insertionId,
                dataType: 'image',
                dataImageId: imageId,
                dataSessionId: sessionId,
                dataContentType: 'image',
                imageSrc: imageSrc,
                imageElement: imageElement,
                phase: 'Phase 5 (Images)',
                function: 'onImageInserted',
                timestamp: new Date().toISOString()
            });
            
            // Add data-* attributes to the image element
            $(imageElement).attr({
                'data-type': 'image',
                'data-image-id': imageId,
                'data-session-id': sessionId,
                'data-insertion-id': insertionId,
                'data-content-type': 'image'
            });
            
            console.log('✨ [IMAGE-INSERTED] Added data-* attributes to image', {
                imageId: imageId,
                sessionId: sessionId,
                insertionId: insertionId,
                imageSrc: imageSrc,
                attributes: {
                    'data-type': 'image',
                    'data-image-id': imageId,
                    'data-session-id': sessionId,
                    'data-insertion-id': insertionId,
                    'data-content-type': 'image'
                }
            });
        }

        function onVideoInserted(e, editor, $video) {
            console.log("DEBUG: YouTube video inserted in transcript", {
                controllerId: controllerId,
                sessionId: vm.fTranscript.sessionId,
                videoElement: $video[0],
                videoSrc: $video.attr('src'),
                timestamp: new Date().toISOString()
            });
            
            // Ensure videos are responsive and have Islamic content-appropriate styling
            $($video[0]).addClass("fr-responsive fr-video");
            
            // Auto-save after video insertion
            if (vm.fEditor && vm.fTranscript.sessionId > 0) {
                timeout(function() {
                    datacontext.saveSessionTranscript(vm.fTranscript.sessionId, vm.fTranscript);
                }, 1000);
            }
        }

        function onVideoRemoved(e, editor, $video) {
            console.log("DEBUG: Video removed from transcript", {
                controllerId: controllerId,
                sessionId: vm.fTranscript.sessionId,
                videoSrc: $video.attr('src'),
                timestamp: new Date().toISOString()
            });
            
            log("Video removed from transcript", controllerId);
            
            // Auto-save after video removal
            if (vm.fEditor && vm.fTranscript.sessionId > 0) {
                timeout(function() {
                    datacontext.saveSessionTranscript(vm.fTranscript.sessionId, vm.fTranscript);
                }, 1000);
            }
        }

        function onBeforeSave(e, editor) {
            if (vm.fTranscript.sessionId <= 0) {
                return;
            }
            datacontext.saveSessionTranscript(vm.fTranscript.sessionId, vm.fTranscript).then(function (response) {
                // Only calculate sermon delivery stats when transcript is saved to database
                console.log('💾 [SAVE] Transcript saved to database - calculating sermon delivery stats');
                calculateSermonDeliveryStats(editor.$el.html()); // Use HTML to get full content for analysis
                $(".quiz-answer-content").hide();
                // Ensure ayah headers are bound after save
                timeout(function () {
                    bindAyahHeaderRemovers(".clickable-ayah-header");
                }, 100);
            }).catch(function(error) {
                console.error('❌ [SAVE] Failed to save transcript:', error);
                logError("Failed to save transcript: " + (error.message || error), controllerId);
            });
        }
        function calculateSermonDeliveryStats(transcriptContent) {
            // Reset stats
            vm.fTranscript.wordCount = "";
            vm.fTranscript.minutes = "";

            if (!transcriptContent) {
                return;
            }

            console.log('📊 [SERMON-STATS] Starting optimized sermon delivery calculation');

            // Advanced HTML stripping with preservation of meaningful content structure
            var cleanedText = stripHtmlAndPreserveStructure(transcriptContent);
            
            // Analyze content composition for accurate timing
            var contentAnalysis = analyzeSermonContent(cleanedText);
            
            // Calculate delivery time using sophisticated algorithm
            var deliveryTime = calculateOptimizedDeliveryTime(contentAnalysis);
            
            // Store results
            vm.fTranscript.wordCount = contentAnalysis.totalWords;
            vm.fTranscript.minutes = deliveryTime;

            var msg = vm.fTranscript.wordCount + " words | Delivery Time: " + vm.fTranscript.minutes.toFixed(2) + " min";
            console.log('📊 [SERMON-STATS] ' + msg);
            logSuccess(msg, controllerId);
            
            // Setup UI handlers (only after save)
            bindAyahHeaderRemovers(".clickable-ayah-header");
            setupDynamicAyahHeaderHandling();
        }

        /**
         * Advanced HTML stripping that preserves meaningful structure
         * @param {string} htmlContent - Raw HTML content from editor
         * @returns {string} - Clean text with preserved structure
         */
        function stripHtmlAndPreserveStructure(htmlContent) {
            if (typeof htmlContent !== 'string' || htmlContent.indexOf('<') === -1) {
                return htmlContent || '';
            }

            // Create temporary DOM element for parsing
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;

            // Remove script and style elements completely
            var scriptsAndStyles = tempDiv.querySelectorAll('script, style, noscript');
            for (var i = 0; i < scriptsAndStyles.length; i++) {
                scriptsAndStyles[i].remove();
            }

            // Convert block elements to have line breaks for proper word separation
            var blockElements = tempDiv.querySelectorAll('div, p, h1, h2, h3, h4, h5, h6, li, blockquote, pre');
            for (var j = 0; j < blockElements.length; j++) {
                var element = blockElements[j];
                // Add space before block element content to ensure word separation
                if (element.textContent.trim().length > 0) {
                    element.insertAdjacentText('beforebegin', ' ');
                    element.insertAdjacentText('afterend', ' ');
                }
            }

            // Extract clean text content
            var cleanText = tempDiv.textContent || tempDiv.innerText || '';
            
            // Clean up excessive whitespace while preserving structure
            cleanText = cleanText
                .replace(/\s+/g, ' ')           // Normalize whitespace
                .replace(/\s*\n\s*/g, ' ')      // Convert newlines to spaces
                .trim();

            console.log('🧹 [SERMON-STATS] HTML stripped - Original: ' + htmlContent.length + ' chars, Clean: ' + cleanText.length + ' chars');
            
            return cleanText;
        }

        /**
         * Analyze sermon content composition for accurate delivery timing
         * @param {string} cleanText - Clean text content
         * @returns {object} - Content analysis results
         */
        function analyzeSermonContent(cleanText) {
            if (!cleanText || cleanText.trim().length === 0) {
                return {
                    totalWords: 0,
                    arabicWords: 0,
                    englishWords: 0,
                    poetryLines: 0,
                    punctuationPauses: 0,
                    contentType: 'empty'
                };
            }

            // Split into words and filter empty entries
            var allWords = cleanText.trim().split(/\s+/).filter(function(word) {
                return word.length > 0 && word.match(/\w/); // Must contain at least one word character
            });

            var analysis = {
                totalWords: allWords.length,
                arabicWords: 0,
                englishWords: 0,
                poetryLines: 0,
                punctuationPauses: 0,
                contentType: 'mixed'
            };

            // Analyze word composition
            for (var i = 0; i < allWords.length; i++) {
                var word = allWords[i];
                
                // Check for Arabic/Urdu characters (Unicode ranges)
                if (word.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/)) {
                    analysis.arabicWords++;
                } else if (word.match(/[a-zA-Z]/)) {
                    analysis.englishWords++;
                }
            }

            // Count punctuation that indicates pauses
            var pausePunctuation = cleanText.match(/[.!?;:]/g);
            analysis.punctuationPauses = pausePunctuation ? pausePunctuation.length : 0;

            // Detect poetry patterns (lines with similar structure/rhythm)
            var lines = cleanText.split(/[.!?]\s+/);
            var potentialPoetryLines = 0;
            for (var j = 0; j < lines.length; j++) {
                var line = lines[j].trim();
                // Poetry indicators: shorter lines, rhythmic patterns, Arabic content
                if (line.length > 10 && line.length < 100 && 
                    (line.match(/[\u0600-\u06FF]/) || line.match(/\b\w+ing\b|\b\w+ed\b/))) {
                    potentialPoetryLines++;
                }
            }
            analysis.poetryLines = potentialPoetryLines;

            // Determine dominant content type
            var arabicRatio = analysis.arabicWords / analysis.totalWords;
            if (arabicRatio > 0.6) {
                analysis.contentType = 'arabic-dominant';
            } else if (arabicRatio > 0.3) {
                analysis.contentType = 'bilingual';
            } else if (analysis.poetryLines > lines.length * 0.3) {
                analysis.contentType = 'poetry';
            } else {
                analysis.contentType = 'english-dominant';
            }

            console.log('🔍 [SERMON-STATS] Content analysis:', analysis);
            return analysis;
        }

        /**
         * Lightweight function for quick display stats (not full sermon analysis)
         * @param {string} content - Text or HTML content
         */
        function calculateDisplayStats(content) {
            vm.fTranscript.wordCount = "";
            vm.fTranscript.minutes = "";

            if (!content) {
                return;
            }

            // Quick HTML stripping for display
            var textContent = content;
            if (typeof content === 'string' && content.indexOf('<') > -1) {
                var tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                textContent = tempDiv.textContent || tempDiv.innerText || '';
            }

            var words = textContent.trim().split(/\s+/).filter(function(word) {
                return word.length > 0 && word.match(/\w/);
            });

            vm.fTranscript.wordCount = words.length;
            // Use basic calculation for display (will be recalculated on save)
            vm.fTranscript.minutes = words.length / sermonDeliveryConfig.baseWordsPerMinute;
        }

        /**
         * Calculate optimized delivery time based on content analysis
         * @param {object} analysis - Content analysis results
         * @returns {number} - Estimated delivery time in minutes
         */
        function calculateOptimizedDeliveryTime(analysis) {
            if (analysis.totalWords === 0) {
                return 0;
            }

            var config = sermonDeliveryConfig;
            var baseWPM = config.baseWordsPerMinute;
            
            // Adjust speed based on content composition
            var adjustedWPM = baseWPM;

            // Apply content-specific adjustments
            if (analysis.contentType === 'arabic-dominant') {
                adjustedWPM *= config.arabicSlowdownFactor;
            } else if (analysis.contentType === 'bilingual') {
                // Weighted average of Arabic and English speeds
                var arabicRatio = analysis.arabicWords / analysis.totalWords;
                var englishRatio = analysis.englishWords / analysis.totalWords;
                adjustedWPM = (arabicRatio * baseWPM * config.arabicSlowdownFactor) + 
                             (englishRatio * baseWPM * config.translationSpeedFactor);
            } else if (analysis.contentType === 'poetry') {
                adjustedWPM *= config.poetrySlowdownFactor;
            } else if (analysis.contentType === 'english-dominant') {
                adjustedWPM *= config.translationSpeedFactor;
            }

            // Calculate base delivery time
            var baseMinutes = analysis.totalWords / adjustedWPM;

            // Add time for pauses (percentage of total time)
            var pauseTime = baseMinutes * (config.pauseFactorPercentage / 100);

            // Add extra time for punctuation pauses (0.5 seconds each)
            var punctuationPauseTime = (analysis.punctuationPauses * 0.5) / 60; // Convert to minutes

            // Add extra time for poetry delivery (more contemplative pacing)
            var poetryExtraTime = 0;
            if (analysis.poetryLines > 0) {
                poetryExtraTime = (analysis.poetryLines * 3) / 60; // 3 seconds per poetic line
            }

            var totalMinutes = baseMinutes + pauseTime + punctuationPauseTime + poetryExtraTime;

            console.log('⏱️ [SERMON-STATS] Delivery calculation:', {
                adjustedWPM: adjustedWPM.toFixed(1),
                baseMinutes: baseMinutes.toFixed(2),
                pauseTime: pauseTime.toFixed(2),
                punctuationPauseTime: punctuationPauseTime.toFixed(2),
                poetryExtraTime: poetryExtraTime.toFixed(2),
                totalMinutes: totalMinutes.toFixed(2)
            });

            return Math.abs(totalMinutes);
        }

        function setupDynamicAyahHeaderHandling() {
            // Use event delegation to handle clicks on dynamically inserted ayah headers
            // This ensures new ayah cards inserted via tokens will work immediately
            $(document).off('click.ayahHeaders', '.clickable-ayah-header');
            $(document).on('click.ayahHeaders', '.clickable-ayah-header', function(e) {
                // Only handle clicks within our editor context to avoid conflicts
                if (!$(this).closest('.fr-element, .fr-view').length) {
                    return;
                }
                
                // Prevent double execution and event bubbling
                e.preventDefault();
                e.stopImmediatePropagation();
                
                console.log("🔧 DEBUG: Event delegation handler triggered");
                removeAyahCardFromEditor.call(this, e);
            });
            
            // Listen for token insertion events to rebind handlers
            $(document).off('quranTokenInserted.adminTranscript');
            $(document).on('quranTokenInserted.adminTranscript', function(event, data) {
                console.log('🔧 DEBUG: Received quranTokenInserted event, rebinding handlers');
                setTimeout(function() {
                    bindAyahHeaderRemovers(".clickable-ayah-header");
                    
                    // Quick stats update for display (full analysis on save)
                    if (vm.fEditor && vm.fEditor.$el) {
                        calculateDisplayStats(vm.fEditor.$el.text());
                    }
                }, 150);
            });
            
            console.log("🔧 DEBUG: Setup dynamic ayah header click handling with event delegation");
        }

        function bindAyahHeaderRemovers(selector) {
            // Skip direct binding since we're using event delegation
            // This prevents double bindings that cause modal issues
            if (vm.usingEventDelegation) {
                console.log("🔧 DEBUG: Skipping direct binding - using event delegation");
                return;
            }
            
            // Use a small delay to ensure DOM is fully updated after token insertion
            timeout(function() {
                $(selector).unbind("click", removeAyahCardFromEditor);
                $(selector).bind("click", removeAyahCardFromEditor);
                
                // Debug: Log available clickable headers and their data
                console.log("🔧 DEBUG: Binding ayah header click handlers", {
                    selector: selector,
                    foundElements: $(selector).length,
                    elementDetails: $(selector).map(function() {
                        var $el = $(this);
                        return {
                            id: $el.attr('id'),
                            originalToken: $el.data('original-token'),
                            surah: $el.data('surah'),
                            ayats: $el.data('ayats'),
                            hasClickHandler: $el.data('events') && $el.data('events').click
                        };
                    }).get()
                });
            }, 200);
        }

        function removeAyahCardFromEditor(event) {
            // Prevent multiple executions and event bubbling
            if (event) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
            
            // Add debouncing to prevent rapid successive calls
            if (vm.isRestoringAyah) {
                console.log("🔧 DEBUG: Restoration already in progress, ignoring duplicate call");
                return;
            }
            vm.isRestoringAyah = true;
            
            var headerElement = this;
            var $header = $(headerElement);
            var originalToken = $header.data('original-token');
            var surahNumber = $header.data('surah');
            var ayats = $header.data('ayats');

            // Enhanced debugging for token restoration issues
            console.log("🔧 DEBUG: removeAyahCardFromEditor called", {
                headerElement: headerElement,
                originalToken: originalToken,
                surahNumber: surahNumber,
                ayats: ayats,
                allDataAttributes: $header.data(),
                innerHTML: $header.html(),
                outerHTML: $header.prop('outerHTML')
            });

            // Fallback token construction if data-original-token is missing
            if (!originalToken && surahNumber && ayats) {
                originalToken = "Q|" + surahNumber + ":" + ayats;
                console.log("🔧 DEBUG: Constructed fallback token", { originalToken: originalToken });
            }

            // Additional fallback: try to extract from element ID or text content
            if (!originalToken) {
                // Try to extract from the element ID (e.g., "ayah-header-2-34")
                var elementId = $header.attr('id');
                if (elementId && elementId.startsWith('ayah-header-')) {
                    var idParts = elementId.replace('ayah-header-', '').split('-');
                    if (idParts.length >= 2) {
                        originalToken = "Q|" + idParts[0] + ":" + idParts[1];
                        if (idParts.length === 3) {
                            originalToken = "Q|" + idParts[0] + ":" + idParts[1] + "-" + idParts[2];
                        }
                        console.log("🔧 DEBUG: Extracted token from element ID", { elementId: elementId, originalToken: originalToken });
                    }
                }
            }

            // Final fallback: try to extract from header text content
            if (!originalToken) {
                var headerText = $header.text();
                var match = headerText.match(/\((\d+):(\d+(?:-\d+)?)\)/);
                if (match) {
                    originalToken = "Q|" + match[1] + ":" + match[2];
                    console.log("🔧 DEBUG: Extracted token from header text", { headerText: headerText, originalToken: originalToken });
                }
            }

            // Validate we have the necessary data
            if (!originalToken) {
                vm.isRestoringAyah = false; // Reset flag on error
                logError("Could not determine original token for restoration", controllerId);
                console.error("❌ DEBUG: All restoration methods failed", {
                    headerElement: headerElement,
                    allAttempts: {
                        dataOriginalToken: $header.data('original-token'),
                        dataSurah: $header.data('surah'),
                        dataAyats: $header.data('ayats'),
                        elementId: $header.attr('id'),
                        headerText: $header.text(),
                        allDataAttributes: $header.data()
                    }
                });
                return;
            }

            // Create confirmation message
            var headerText = $header.find('span').text();
            var confirmMessage = "What would you like to do with this Quranic verse?\n\n" +
                headerText + "\n\nChoose an action below:";

            // Show custom three-button dialog
            showQuranVerseActionDialog(confirmMessage, headerText, originalToken, $header);
        }

        function showQuranVerseActionDialog(message, headerText, originalToken, $header) {
            var dialogId = 'quranVerseActionDialog_' + new Date().getTime();
            var dialogHtml = `
                <div class="modal fade" id="${dialogId}" tabindex="-1" role="dialog">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header" style="background-color: #337ab7; color: white;">
                                <h4 class="modal-title">
                                    <i class="fa fa-quran" style="margin-right: 8px;"></i> 
                                    Quran Verse Action
                                </h4>
                            </div>
                            <div class="modal-body">
                                <p style="margin-bottom: 15px;">${message}</p>
                                <div class="alert alert-info" style="margin-bottom: 0;">
                                    <strong>Token format:</strong> ${originalToken}
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-success" id="${dialogId}_convert">
                                    <i class="fa fa-exchange"></i> Convert To Token
                                </button>
                                <button type="button" class="btn btn-danger" id="${dialogId}_remove">
                                    <i class="fa fa-trash"></i> Remove
                                </button>
                                <button type="button" class="btn btn-default" id="${dialogId}_cancel">
                                    <i class="fa fa-times"></i> Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove any existing modal
            $('#' + dialogId).remove();
            
            // Add modal to body
            $('body').append(dialogHtml);
            
            // Show the modal
            $('#' + dialogId).modal('show');
            
            // Handle Convert To Token button
            $('#' + dialogId + '_convert').on('click', function() {
                $('#' + dialogId).modal('hide');
                performConvertToToken($header, originalToken);
            });
            
            // Handle Remove button
            $('#' + dialogId + '_remove').on('click', function() {
                $('#' + dialogId).modal('hide');
                performRemoveVerse($header);
            });
            
            // Handle Cancel button
            $('#' + dialogId + '_cancel').on('click', function() {
                $('#' + dialogId).modal('hide');
                // Reset flag on cancellation
                vm.isRestoringAyah = false;
                logInfo("Quran verse action cancelled by user", controllerId);
            });
            
            // Clean up when modal is hidden
            $('#' + dialogId).on('hidden.bs.modal', function() {
                $(this).remove();
            });
        }

        function performConvertToToken($header, originalToken) {
            try {
                // Find the parent ayah-card div
                var $ayahCard = $header.closest('.ayah-card');
                if ($ayahCard.length > 0) {
                    // Replace the entire ayah card with a paragraph break, the original token, and another paragraph break
                    var tokenHtml = originalToken + '<p><br/></p>';
                    $ayahCard.replaceWith(tokenHtml);

                    // Log the restoration
                    logSuccess("Converted Quranic verse to token: " + originalToken, controllerId);

                    // Quick stats update after restoration
                    if (vm.fEditor) {
                        calculateDisplayStats(vm.fEditor.$el.text());
                    }
                } else {
                    logError("Could not find ayah card to convert", controllerId);
                }
            } catch (error) {
                logError("Error during conversion to token: " + error.message, controllerId);
            } finally {
                // Always reset the flag regardless of success or failure
                vm.isRestoringAyah = false;
            }
        }

        function performRemoveVerse($header) {
            try {
                // Find the parent ayah-card div
                var $ayahCard = $header.closest('.ayah-card');
                if ($ayahCard.length > 0) {
                    // Completely remove the verse div without replacement
                    $ayahCard.remove();

                    // Log the removal
                    logSuccess("Removed Quranic verse from transcript", controllerId);

                    // Quick stats update after removal
                    if (vm.fEditor) {
                        calculateDisplayStats(vm.fEditor.$el.text());
                    }
                } else {
                    logError("Could not find ayah card to remove", controllerId);
                }
            } catch (error) {
                logError("Error during verse removal: " + error.message, controllerId);
            } finally {
                // Always reset the flag regardless of success or failure
                vm.isRestoringAyah = false;
            }
        }

        function setupBlockRemovalShortcut() {
            console.log('🎯 [BLOCK-REMOVAL] Setting up Ctrl+D block removal shortcut');
            
            // Remove any existing block removal listeners to prevent duplicates
            angular.element(document).off('keydown.blockRemoval');
            
            // Set up the keyboard shortcut listener
            angular.element(document).on('keydown.blockRemoval', function(e) {
                // Check if Ctrl+D is pressed (and not in a different context)
                if (e.ctrlKey && e.which === 68) { // D key code is 68
                    // Only trigger if we're in the Froala editor context
                    var activeElement = document.activeElement;
                    var $activeElement = $(activeElement);
                    
                    console.log('🎯 [BLOCK-REMOVAL] Ctrl+D pressed', {
                        activeElement: activeElement,
                        tagName: activeElement.tagName,
                        className: activeElement.className,
                        isInFroala: $activeElement.closest('.fr-element, .fr-view, #froalaTranscript').length > 0
                    });
                    
                    // Check if we're in the Froala editor
                    if ($activeElement.closest('.fr-element, .fr-view, #froalaTranscript').length > 0 || 
                        activeElement.id === 'froalaTranscript') {
                        
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('🎯 [BLOCK-REMOVAL] Executing block removal in Froala context');
                        removeCurrentBlock();
                    } else {
                        console.log('🎯 [BLOCK-REMOVAL] Ctrl+D pressed but not in Froala context - ignoring');
                    }
                }
            });
            
            console.log('🎯 [BLOCK-REMOVAL] Block removal shortcut setup completed');
        }

        function removeCurrentBlock() {
            console.log('🎯 [BLOCK-REMOVAL] ===== STARTING BLOCK REMOVAL =====');
            
            if (!vm.fEditor) {
                console.error('🎯 [BLOCK-REMOVAL] ❌ No Froala editor instance available');
                logError("Cannot remove block: Editor not available", controllerId);
                return;
            }
            
            try {
                // Get current selection and cursor position
                var selection = vm.fEditor.selection.get();
                var $editorElement = vm.fEditor.$el;
                
                console.log('🎯 [BLOCK-REMOVAL] Editor state', {
                    hasSelection: !!selection,
                    selectionString: selection ? selection.toString() : 'none',
                    editorContent: $editorElement.html().substring(0, 200) + '...'
                });
                
                // Get the current element at cursor position
                var currentElement = vm.fEditor.selection.element();
                var $currentElement = $(currentElement);
                
                console.log('🎯 [BLOCK-REMOVAL] Current element analysis', {
                    tagName: currentElement.tagName,
                    className: currentElement.className,
                    id: currentElement.id,
                    innerHTML: currentElement.innerHTML ? currentElement.innerHTML.substring(0, 100) + '...' : 'empty',
                    isBlockElement: isBlockElement(currentElement)
                });
                
                // Find the target block to remove
                var $targetBlock = findTargetBlockForRemoval($currentElement);
                
                if (!$targetBlock || $targetBlock.length === 0) {
                    console.warn('🎯 [BLOCK-REMOVAL] ⚠️ No suitable block found for removal');
                    return;
                }
                
                console.log('🎯 [BLOCK-REMOVAL] Target block identified', {
                    tagName: $targetBlock[0].tagName,
                    className: $targetBlock.attr('class'),
                    id: $targetBlock.attr('id'),
                    innerHTML: $targetBlock.html().substring(0, 150) + '...',
                    isDirectChild: $targetBlock.parent().is($editorElement)
                });
                
                // Confirm removal for important blocks
                if (shouldConfirmBlockRemoval($targetBlock)) {
                    showBlockRemovalConfirmation($targetBlock);
                } else {
                    executeBlockRemoval($targetBlock);
                }
                
            } catch (error) {
                console.error('🎯 [BLOCK-REMOVAL] ❌ Error during block removal:', error);
                logError("Error removing block: " + error.message, controllerId);
            }
        }

        function findTargetBlockForRemoval($currentElement) {
            console.log('🎯 [BLOCK-REMOVAL] Finding target block for removal');
            
            // Start from current element and work up the DOM tree
            var $candidate = $currentElement;
            var $editorElement = vm.fEditor.$el;
            var attempts = 0;
            var maxAttempts = 10; // Prevent infinite loops
            
            while ($candidate.length > 0 && attempts < maxAttempts) {
                attempts++;
                
                console.log('🎯 [BLOCK-REMOVAL] Evaluating candidate ' + attempts, {
                    tagName: $candidate[0].tagName,
                    className: $candidate.attr('class'),
                    id: $candidate.attr('id'),
                    isBlockElement: isBlockElement($candidate[0]),
                    hasContent: $candidate.html().trim().length > 0,
                    isEditorRoot: $candidate.is($editorElement)
                });
                
                // Don't remove the editor root element itself
                if ($candidate.is($editorElement)) {
                    console.log('🎯 [BLOCK-REMOVAL] Reached editor root - stopping search');
                    break;
                }
                
                // Check if this is a good candidate for removal
                if (isGoodRemovalCandidate($candidate)) {
                    console.log('🎯 [BLOCK-REMOVAL] ✅ Found good removal candidate:', $candidate[0].tagName);
                    return $candidate;
                }
                
                // Move up to parent element
                $candidate = $candidate.parent();
            }
            
            console.log('🎯 [BLOCK-REMOVAL] ⚠️ No suitable block found after ' + attempts + ' attempts');
            return null;
        }

        function isBlockElement(element) {
            if (!element) return false;
            
            var blockTags = ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'LI', 'TABLE', 'TR', 'TD', 'TH'];
            return blockTags.indexOf(element.tagName.toUpperCase()) !== -1;
        }

        function isGoodRemovalCandidate($element) {
            if (!$element || $element.length === 0) return false;
            
            var element = $element[0];
            var $editorElement = vm.fEditor.$el;
            
            // Must be a block element
            if (!isBlockElement(element)) {
                console.log('🎯 [BLOCK-REMOVAL] Not a block element:', element.tagName);
                return false;
            }
            
            // Must have content (not just whitespace)
            if ($element.html().trim().length === 0) {
                console.log('🎯 [BLOCK-REMOVAL] Empty element - not suitable for removal');
                return false;
            }
            
            // Prefer elements that are direct children of common containers
            var $parent = $element.parent();
            var isDirectChildOfEditor = $parent.is($editorElement);
            var isInCommonContainer = $parent.is('div, section, article, .content, .poetry-wrapper, .ayah-card');
            
            console.log('🎯 [BLOCK-REMOVAL] Candidate evaluation', {
                tagName: element.tagName,
                className: $element.attr('class'),
                hasContent: $element.html().trim().length > 0,
                isDirectChildOfEditor: isDirectChildOfEditor,
                isInCommonContainer: isInCommonContainer,
                parentTagName: $parent[0] ? $parent[0].tagName : 'none'
            });
            
            // Good candidates are block elements with content
            return true;
        }

        function shouldConfirmBlockRemoval($targetBlock) {
            if (!$targetBlock || $targetBlock.length === 0) return false;
            
            // Confirm removal for special blocks
            var specialClasses = ['ayah-card', 'poetry-wrapper', 'poetry-section', 'quran-section'];
            var hasSpecialClass = specialClasses.some(function(className) {
                return $targetBlock.hasClass(className);
            });
            
            // Confirm for large blocks (more than 200 characters)
            var isLargeBlock = $targetBlock.text().length > 200;
            
            // Confirm for blocks with multiple children
            var hasMultipleChildren = $targetBlock.children().length > 2;
            
            var shouldConfirm = hasSpecialClass || isLargeBlock || hasMultipleChildren;
            
            console.log('🎯 [BLOCK-REMOVAL] Confirmation check', {
                hasSpecialClass: hasSpecialClass,
                isLargeBlock: isLargeBlock,
                hasMultipleChildren: hasMultipleChildren,
                shouldConfirm: shouldConfirm,
                contentLength: $targetBlock.text().length,
                childrenCount: $targetBlock.children().length
            });
            
            return shouldConfirm;
        }

        function showBlockRemovalConfirmation($targetBlock) {
            var blockInfo = getBlockDisplayInfo($targetBlock);
            var message = "Are you sure you want to remove this block?\n\n" +
                "Type: " + blockInfo.type + "\n" +
                "Content: " + blockInfo.preview + "\n\n" +
                "This action cannot be undone.";
            
            console.log('🎯 [BLOCK-REMOVAL] Showing confirmation dialog', blockInfo);
            
            // Use the dlg.confirmationDialog method
            dlg.confirmationDialog("Remove Block", message, "OK", "Cancel")
                .then(function(result) {
                    if (result === "ok") {
                        console.log('🎯 [BLOCK-REMOVAL] User confirmed removal');
                        executeBlockRemoval($targetBlock);
                    } else {
                        console.log('🎯 [BLOCK-REMOVAL] User cancelled removal');
                    }
                })
                .catch(function(error) {
                    console.log('🎯 [BLOCK-REMOVAL] Dialog cancelled or error occurred', error);
                });
        }

        function getBlockDisplayInfo($targetBlock) {
            var element = $targetBlock[0];
            var type = element.tagName;
            
            // Add class info if available
            var className = $targetBlock.attr('class');
            if (className) {
                type += '.' + className.split(' ')[0]; // First class only
            }
            
            // Get content preview
            var content = $targetBlock.text().trim();
            var preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
            
            return {
                type: type,
                preview: preview,
                fullContent: content
            };
        }

        function executeBlockRemoval($targetBlock) {
            console.log('🎯 [BLOCK-REMOVAL] ===== EXECUTING BLOCK REMOVAL =====');
            
            try {
                var blockInfo = getBlockDisplayInfo($targetBlock);
                
                console.log('🎯 [BLOCK-REMOVAL] Removing block', {
                    type: blockInfo.type,
                    contentLength: blockInfo.fullContent.length,
                    elementHTML: $targetBlock[0].outerHTML.substring(0, 200) + '...'
                });
                
                // Store undo information (basic implementation)
                var undoInfo = {
                    html: $targetBlock[0].outerHTML,
                    position: $targetBlock.index(),
                    parent: $targetBlock.parent()
                };
                
                // Remove the block
                $targetBlock.remove();
                
                // Update editor content and stats
                if (vm.fEditor) {
                    // Trigger content change event
                    vm.fEditor.events.trigger('contentChanged');
                    
                    // Recalculate stats
                    calculateSermonDeliveryStats(vm.fEditor.$el.html());
                }
                
                console.log('🎯 [BLOCK-REMOVAL] ✅ Block removed successfully', {
                    type: blockInfo.type,
                    remainingContent: vm.fEditor.$el.text().length
                });
                
                // Block removed successfully - no toast notification needed
                
            } catch (error) {
                console.error('🎯 [BLOCK-REMOVAL] ❌ Error during block removal execution:', error);
                showBlockRemovalNotification('error', 'Removal Failed', 'Could not remove block: ' + error.message);
            }
        }

        function showBlockRemovalNotification(type, title, message) {
            // Only show error notifications, success is silent
            try {
                if (type === 'error') {
                    logError(message, controllerId);
                }
                // Success notifications removed to reduce UI noise
            } catch (error) {
                console.log('🎯 [BLOCK-REMOVAL] Notification error:', error);
            }
        }

        function selectSession() {
            vm.fTranscript = newTranscriptObject({
                albumId: vm.fTranscript.albumId,
                sessionId: vm.fTranscript.sessionId,
                categoryId: vm.fTranscript.categoryId
            });
        }

        function onSessionSelect(sessionId, categoryId) {
            // Store the categoryId from the session selection
            vm.fTranscript.categoryId = categoryId || vm.fTranscript.categoryId || "";
            
            // Also update the fUpdater categoryId for metadata operations
            if (categoryId) {
                vm.fUpdater.categoryId = categoryId;
            }
            
            setSessionTranscript(sessionId, $scope.$stateParams.transcriptId);
        }

        function setSessionTranscript(sessionId, urlTranscriptId) {
            if (!sessionId || sessionId <= 0) {
                logError("Invalid session ID provided to setSessionTranscript: " + sessionId, controllerId);
                return;
            }

            // Check if editor is available before setting options
            if (vm.fEditor && vm.fEditor.opts) {
                vm.fEditor.opts.imageManagerLoadURL = "api/file/session/" + sessionId + "/images";
                vm.fEditor.opts.imageManagerDeleteURL = "api/file/summary/" + sessionId + "/deleteImage";
            }

            datacontext.getSessionTranscript(sessionId).then(function (response) {
                if (response.data) {
                    // Handle both cases: when transcript exists and when it's empty/null
                    var transcriptContent = response.data.transcript || "";

                    response.data.albumId = vm.fTranscript.albumId;
                    response.data.categoryId = vm.fTranscript.categoryId;
                    response.data.transcript = transcriptContent; // Ensure it's not null
                    vm.fTranscript = newTranscriptObject(response.data);

                    vm.fUpdater.sessionName = vm.cm.currentSession.name || "";
                    vm.fUpdater.sessionDesc = vm.cm.currentSession.description || "";

                    // Force the Froala editor to update with the new content
                    if (vm.fEditor) {
                        timeout(function () {
                            try {
                                vm.fEditor.html.set(transcriptContent);
                                calculateDisplayStats(vm.fEditor.$el.text());
                                bindAyahHeaderRemovers(".clickable-ayah-header");
                            } catch (editorError) {
                                logError("Error setting Froala content: " + editorError.message, controllerId);
                                calculateDisplayStats(transcriptContent);
                                bindAyahHeaderRemovers(".clickable-ayah-header");
                            }
                        }, 100);
                    } else {
                        calculateDisplayStats(transcriptContent);
                        timeout(function () {
                            bindAyahHeaderRemovers(".clickable-ayah-header");
                        }, 100);
                    }

                    bindPopQuizPanel();
                    
                    // Load token count for the session
                    loadTokenCount();
                    
                    // Initialize media readiness based on current session media path
                    updateMediaReadiness();
                    
                    // Reset audio player to collapsed state when session changes
                    vm.isAudioPlayerExpanded = false;
                } else {
                    vm.fTranscript.transcript = "";
                    if (vm.fEditor) {
                        timeout(function () {
                            try {
                                vm.fEditor.html.set("");
                                bindAyahHeaderRemovers(".clickable-ayah-header");
                            } catch (editorError) {
                                logError("Error clearing Froala content: " + editorError.message, controllerId);
                            }
                        }, 100);
                    }
                    calculateDisplayStats("");
                    
                    // Reset token count when no transcript
                    vm.tokenCount = 0;
                }
            }).catch(function (error) {
                var errorMessage = error.data && error.data.message ? error.data.message : "Failed to load transcript";
                logError("Error loading transcript: " + errorMessage, controllerId);

                // Set empty transcript if loading fails
                vm.fTranscript.transcript = "";
                if (vm.fEditor) {
                    timeout(function () {
                        try {
                            vm.fEditor.html.set("");
                            bindAyahHeaderRemovers(".clickable-ayah-header");
                        } catch (editorError) {
                            logError("Error clearing Froala content after error: " + editorError.message, controllerId);
                        }
                    }, 100);
                }
                calculateDisplayStats("");
                
                // Reset token count on error
                vm.tokenCount = 0;
            });
        }

        function newTranscriptObject(transcript) {
            return {
                albumId: transcript.albumId || "",
                sessionId: transcript.sessionId || "",
                categoryId: transcript.categoryId || "",
                transcript: transcript.transcript || "",
                isSummarized: transcript.isSummarized || false,
                createdDate: transcript.createdDate,
                changedDate: transcript.changedDate
            };
        }

        function updateMetadata() {
            // Validate required fields
            if (!vm.fTranscript.sessionId || vm.fTranscript.sessionId <= 0) {
                logError("No session selected for metadata update", controllerId);
                return;
            }

            if (!vm.fUpdater.sessionName || vm.fUpdater.sessionName.trim() === "") {
                logError("Session name is required for metadata update", controllerId);
                return;
            }

            // Update metadata directly without confirmation dialog
            var sesh = {
                sessionId: vm.fTranscript.sessionId,
                categoryId: vm.fUpdater.categoryId || vm.fTranscript.categoryId,
                sessionName: vm.fUpdater.sessionName.trim(),
                sessionDesc: vm.fUpdater.sessionDesc || "",
                sessionDate: moment().format("MM/DD/YY")
            };

            datacontext.saveSessionMetadata(sesh).then(function (r) {
                if (r && r.data) {
                    //update the in-memory session object
                    var cs = vm.cm.currentSession;
                    if (cs) {
                        cs.categoryId = sesh.categoryId;
                        cs.name = sesh.sessionName;
                        cs.description = sesh.sessionDesc;
                    }
                    vm.fTranscript.categoryId = sesh.categoryId;

                    // Use timeout to ensure we're in the next digest cycle
                    timeout(function () {
                        try {
                            //notify all child scopes (including zuSessionSelection) to refresh titles
                            $scope.$broadcast("sessionMetadataUpdated");
                            log("Metadata Updated", controllerId, true);
                        } catch (broadcastError) {
                            logError("Error broadcasting metadata update: " + broadcastError.message, controllerId);
                        }
                    }, 0);
                } else {
                    logError("Failed to update metadata - no response data", controllerId);
                }
            }).catch(function (error) {
                var errorMessage = error.data && error.data.message ? error.data.message : "Failed to update metadata";
                logError("Error updating metadata: " + errorMessage, controllerId);
            });
        }

        function onDescriptionBlur() {
            // Trigger metadata update when description field loses focus
            log("Description blur detected - triggering metadata update", controllerId);
            updateMetadata();
        }

        function bindPopQuizPanel() {
            $(document).ready(function () {
                // Add a 1-second timeout before binding the click event
                setTimeout(function () {
                    $(".quiz-answer-content").hide();
                    // Click handler for the question divs
                    $(".quiz-question-link").on("click",
                        function (e) {
                            var $clickedDiv = $(this);
                            var targetId = $clickedDiv.data("target"); // Get the target from data-target attribute
                            var $targetAnswer = $(targetId);

                            // Check if the clicked answer is currently visible
                            if ($targetAnswer.is(":visible")) {
                                // If visible, hide it
                                $targetAnswer.slideUp();
                            } else {
                                // If hidden, hide all other answers first
                                $(".quiz-answer-content").not($targetAnswer).slideUp();
                                // Then show the clicked answer
                                $targetAnswer.slideDown();
                            }
                        });
                    $(".quiz-hide-toggle").on("click",
                        function () {
                            dlg.confirmationDialog("Confirm",
                                "Are you sure you want to remove this quiz?",
                                "Yes",
                                "No")
                                .then(function (result) {
                                    if (result === "ok") {
                                        $("div.quiz-container").remove(); // Hide the entire quiz container
                                    }
                                })
                                .catch(function () {
                                    // User cancelled the dialog - this is expected behavior, no error needed
                                    // Just silently handle the cancellation
                                });
                        });

                    // Also bind ayah header removers after quiz panel setup
                    bindAyahHeaderRemovers(".clickable-ayah-header");
                },
                    1000); // 1000 milliseconds = 1 second
            });
        }

        function saveTranscript() {
            var sessionId = vm.fTranscript.sessionId;
            if (vm.fTranscript.transcript) {
                datacontext.saveSessionTranscript(sessionId, vm.fTranscript).then(function (resposne) {
                    // Full sermon analysis after manual save
                    calculateSermonDeliveryStats(vm.fTranscript.transcript);
                });
            }
        }

        function copyToClipboard() {
            try {
                // Get HTML content from Froala editor
                var htmlContent = '';
                
                if (vm.fEditor && typeof vm.fEditor.html.get === 'function') {
                    // Use Froala API to get clean HTML
                    htmlContent = vm.fEditor.html.get();
                } else if (vm.fTranscript && vm.fTranscript.transcript) {
                    // Fallback to model data
                    htmlContent = vm.fTranscript.transcript;
                } else {
                    logError("No content available to copy", controllerId);
                    return;
                }

                // Create a temporary textarea element to hold the content
                var tempTextarea = document.createElement('textarea');
                tempTextarea.value = htmlContent;
                document.body.appendChild(tempTextarea);
                
                // Select and copy the content
                tempTextarea.select();
                tempTextarea.setSelectionRange(0, 99999); // For mobile devices
                
                var successful = document.execCommand('copy');
                document.body.removeChild(tempTextarea);
                
                if (successful) {
                    console.log("DEBUG: HTML content copied to clipboard", {
                        contentLength: htmlContent.length,
                        preview: htmlContent.substring(0, 100) + '...'
                    });
                } else {
                    logError("Failed to copy content to clipboard", controllerId);
                }
                
            } catch (error) {
                logError("Error copying to clipboard: " + error.message, controllerId);
                console.error("DEBUG: Clipboard copy error", {
                    error: error,
                    editorAvailable: !!vm.fEditor,
                    transcriptAvailable: !!(vm.fTranscript && vm.fTranscript.transcript)
                });
            }
        }

        function pasteFromClipboard() {
            try {
                console.log("DEBUG: pasteFromClipboard() called", {
                    controllerId: controllerId,
                    editorAvailable: !!vm.fEditor,
                    sessionId: vm.fTranscript.sessionId
                });

                // Validate that we have a valid editor and session
                if (!vm.fEditor || typeof vm.fEditor.html.insert !== 'function') {
                    logError("Froala editor not available for paste operation", controllerId);
                    return;
                }

                if (!vm.fTranscript.sessionId || vm.fTranscript.sessionId <= 0) {
                    logError("No session selected for paste operation", controllerId);
                    return;
                }

                // Try modern Clipboard API first (for newer browsers)
                if (navigator.clipboard && navigator.clipboard.readText) {
                    console.log("DEBUG: Using modern Clipboard API for paste");
                    
                    navigator.clipboard.readText()
                        .then(function(clipboardData) {
                            if (!clipboardData || clipboardData.trim() === '') {
                                logError("Clipboard is empty", controllerId);
                                return;
                            }

                            console.log("DEBUG: Clipboard data retrieved", {
                                dataLength: clipboardData.length,
                                preview: clipboardData.substring(0, 100) + '...',
                                isHTML: clipboardData.includes('<') && clipboardData.includes('>')
                            });

                            // Insert HTML at cursor position using Froala API
                            vm.fEditor.html.insert(clipboardData);
                            
                            // Trigger change events and auto-save
                            vm.fEditor.events.trigger('contentChanged');
                            
                            // Auto-save after paste
                            timeout(function() {
                                if (vm.fTranscript.sessionId > 0) {
                                    saveTranscript();
                                }
                            }, 500);
                        })
                        .catch(function(error) {
                            console.log("DEBUG: Modern clipboard API failed, trying fallback method", error);
                            tryFallbackPaste();
                        });
                } else {
                    console.log("DEBUG: Modern Clipboard API not available, using fallback");
                    tryFallbackPaste();
                }

                function tryFallbackPaste() {
                    // Create a temporary editable div to capture paste event
                    var tempDiv = document.createElement('div');
                    tempDiv.contentEditable = true;
                    tempDiv.style.position = 'absolute';
                    tempDiv.style.left = '-9999px';
                    tempDiv.style.width = '1px';
                    tempDiv.style.height = '1px';
                    document.body.appendChild(tempDiv);
                    
                    // Focus the temp div and trigger paste
                    tempDiv.focus();
                    
                    // Listen for paste event
                    var pasteHandler = function(e) {
                        e.preventDefault();
                        
                        var clipboardData = e.clipboardData || window.clipboardData;
                        var htmlData = '';
                        
                        if (clipboardData) {
                            // Try to get HTML first, then fallback to plain text
                            htmlData = clipboardData.getData('text/html') || clipboardData.getData('text/plain');
                        }
                        
                        if (!htmlData || htmlData.trim() === '') {
                            // Last resort: use the temp div content after a short delay
                            timeout(function() {
                                htmlData = tempDiv.innerHTML || tempDiv.textContent;
                                processPastedData(htmlData);
                                cleanup();
                            }, 100);
                        } else {
                            processPastedData(htmlData);
                            cleanup();
                        }
                    };
                    
                    var cleanup = function() {
                        tempDiv.removeEventListener('paste', pasteHandler);
                        if (tempDiv.parentNode) {
                            document.body.removeChild(tempDiv);
                        }
                    };
                    
                    var processPastedData = function(htmlData) {
                        if (!htmlData || htmlData.trim() === '') {
                            logError("No data available in clipboard", controllerId);
                            return;
                        }
                        
                        console.log("DEBUG: Fallback paste data retrieved", {
                            dataLength: htmlData.length,
                            preview: htmlData.substring(0, 100) + '...',
                            isHTML: htmlData.includes('<') && htmlData.includes('>')
                        });
                        
                        // Insert HTML at cursor position using Froala API
                        vm.fEditor.html.insert(htmlData);
                        
                        // Trigger change events
                        vm.fEditor.events.trigger('contentChanged');
                        
                        // Auto-save after paste
                        timeout(function() {
                            if (vm.fTranscript.sessionId > 0) {
                                saveTranscript();
                            }
                        }, 500);
                    };
                    
                    tempDiv.addEventListener('paste', pasteHandler);
                    
                    // Trigger paste command
                    document.execCommand('paste');
                    
                    // Cleanup after timeout if paste event didn't fire
                    timeout(cleanup, 2000);
                }
                
            } catch (error) {
                logError("Error pasting from clipboard: " + error.message, controllerId);
                console.error("DEBUG: Clipboard paste error", {
                    error: error,
                    editorAvailable: !!vm.fEditor,
                    sessionId: vm.fTranscript.sessionId
                });
            }
        }

        function summarizeTranscript(isSilent) {
            console.debug("🎯 summarizeTranscript: Starting summarization process", {
                sessionId: vm.fTranscript.sessionId,
                isSilent: isSilent,
                transcriptLength: vm.fTranscript.transcript ? vm.fTranscript.transcript.length : 0,
                hasTranscript: !!vm.fTranscript.transcript,
                controllerId: controllerId
            });
            
            // First save the current transcript
            saveTranscript();
            
            console.debug("🎯 summarizeTranscript: Transcript saved, showing confirmation dialog", {
                sessionId: vm.fTranscript.sessionId,
                controllerId: controllerId
            });
            
            dlg.confirmationDialog("Confirm", "Are you sure you want to summarize this transcript using H2 tags?", "Yes", "Nope")
                .then(function (result) {
                    console.debug("🎯 summarizeTranscript: Confirmation dialog result", {
                        result: result,
                        sessionId: vm.fTranscript.sessionId,
                        isValidSession: vm.fTranscript.sessionId > 0,
                        controllerId: controllerId
                    });
                    
                    if (result !== "ok" || vm.fTranscript.sessionId <= 0) {
                        console.debug("🎯 summarizeTranscript: User cancelled or invalid session, aborting", {
                            result: result,
                            sessionId: vm.fTranscript.sessionId,
                            controllerId: controllerId
                        });
                        return;
                    }
                    
                    // Show transcript preview for debugging
                    var transcriptPreview = vm.fTranscript.transcript ? 
                        (vm.fTranscript.transcript.length > 300 ? 
                         vm.fTranscript.transcript.substring(0, 300) + "..." : 
                         vm.fTranscript.transcript) : 
                        "(empty)";
                    
                    console.debug("🎯 summarizeTranscript: Sending to datacontext.summarizeTranscript", {
                        sessionId: vm.fTranscript.sessionId,
                        transcriptPreview: transcriptPreview,
                        fullTranscriptObject: vm.fTranscript,
                        h2Count: vm.fTranscript.transcript ? (vm.fTranscript.transcript.match(/<h2/gi) || []).length : 0,
                        controllerId: controllerId
                    });
                    
                    datacontext.summarizeTranscript(vm.fTranscript.sessionId, vm.fTranscript)
                        .then(function (response) {
                            console.debug("🎯 summarizeTranscript: Success response received", {
                                response: response,
                                responseData: response.data,
                                sessionId: vm.fTranscript.sessionId,
                                controllerId: controllerId
                            });
                            
                            logSuccess("Summarized " + response.data + " items for session Id: " + vm.fTranscript.sessionId,
                                controllerId);
                            
                            if (!isSilent) {
                                // Fix: Pass the correct categoryId instead of null
                                var categoryId = vm.fTranscript.categoryId || vm.fUpdater.categoryId;
                                
                                console.debug("🎯 summarizeTranscript: Navigating to admin.summary", {
                                    albumId: vm.fTranscript.albumId,
                                    categoryId: categoryId,
                                    sessionId: vm.fTranscript.sessionId,
                                    isSilent: isSilent,
                                    controllerId: controllerId
                                });
                                
                                contentManager.setAdminStore(vm.fTranscript.albumId, categoryId, vm.fTranscript.sessionId);
                                $scope.stateGo("admin.summary");
                            } else {
                                console.debug("🎯 summarizeTranscript: Silent mode - not navigating", {
                                    isSilent: isSilent,
                                    controllerId: controllerId
                                });
                            }
                        })
                        .catch(function(error) {
                            console.error("❌ summarizeTranscript: Error during summarization", {
                                error: error,
                                errorMessage: error.message || error.statusText || "Unknown error",
                                errorStatus: error.status,
                                errorData: error.data,
                                sessionId: vm.fTranscript.sessionId,
                                controllerId: controllerId
                            });
                            
                            logError("Summarization failed: " + (error.message || error.statusText || "Unknown error"), controllerId);
                        });
                })
                .catch(function (dialogError) {
                    console.debug("🎯 summarizeTranscript: Dialog cancelled or error", {
                        dialogError: dialogError,
                        controllerId: controllerId
                    });
                    // User cancelled the dialog - this is expected behavior, no error needed
                    // Just silently handle the cancellation
                });
        }

        function breakIntoSessions() {
            dlg.confirmationDialog("Confirm",
                "Are you sure you want to break this transcript into separate sessions at each H1 tag? This will create new sessions and keep only the first H1 block in the current session.",
                "Yes", "Cancel")
                .then(function (result) {
                    if (result !== "ok" || vm.fTranscript.sessionId <= 0) return;

                    if (!vm.fTranscript.transcript || vm.fTranscript.transcript.indexOf("<h1") === -1) {
                        logError("No H1 tags found in transcript content", controllerId);
                        return;
                    }

                    // Save current transcript first
                    saveTranscript();

                    // Store the current session ID for later reference
                    var originalSessionId = vm.fTranscript.sessionId;

                    // Use contentManager service to break transcript
                    if (typeof contentManager.breakTranscriptIntoSessions === 'function') {
                        contentManager.breakTranscriptIntoSessions(
                            vm.fTranscript.sessionId,
                            vm.fTranscript.transcript,
                            vm.fTranscript.categoryId || vm.fUpdater.categoryId
                        ).then(function (response) {
                            if (response.data && response.data.newSessionIds) {
                                logSuccess("Successfully created " + response.data.newSessionIds.length + " new sessions", controllerId);

                                // Update the current session name if provided
                                if (response.data.originalSessionName && vm.cm.currentSession) {
                                    vm.cm.currentSession.name = response.data.originalSessionName;
                                    vm.fUpdater.sessionName = response.data.originalSessionName;
                                }

                                // Add a delay to ensure database operations complete
                                timeout(function () {
                                    // Force refresh of session list first
                                    if (vm.cm.currentAlbum && vm.cm.currentAlbum.id) {
                                        vm.cm.getSessionsForAlbum(vm.cm.currentAlbum.id, -1).then(function () {
                                            // Ensure the original session is still selected
                                            if (vm.cm.currentSession && vm.cm.currentSession.id === originalSessionId) {
                                                // Reload the transcript
                                                timeout(function () {
                                                    setSessionTranscript(originalSessionId);

                                                    // Refresh the session dropdown
                                                    $scope.$broadcast("sessionMetadataUpdated");
                                                }, 200);
                                            } else {
                                                // Re-select the original session
                                                vm.fTranscript.sessionId = originalSessionId;
                                                timeout(function () {
                                                    setSessionTranscript(originalSessionId);
                                                    $scope.$broadcast("sessionMetadataUpdated");
                                                }, 200);
                                            }
                                        });
                                    } else {
                                        // No album context, just reload transcript
                                        timeout(function () {
                                            setSessionTranscript(originalSessionId);
                                        }, 200);
                                    }
                                }, 1000);
                            } else {
                                logError("Failed to break transcript into sessions", controllerId);
                            }
                        }).catch(function (error) {
                            var errorMessage = error.data && error.data.message ? error.data.message : "Unknown error";
                            logError("Error breaking transcript into sessions: " + errorMessage, controllerId);
                        });
                    } else {
                        // Fallback to direct datacontext call if contentManager function is not available
                        var requestData = {
                            transcriptContent: vm.fTranscript.transcript,
                            categoryId: vm.fTranscript.categoryId || vm.fUpdater.categoryId,
                            speakerId: 1, // Asif Hussain
                            description: "<--- Enter Description --->"
                        };

                        datacontext.breakTranscriptIntoSessions(vm.fTranscript.sessionId, requestData)
                            .then(function (response) {
                                if (response.data && response.data.newSessionIds) {
                                    logSuccess("Successfully created " + response.data.newSessionIds.length + " new sessions", controllerId);

                                    // Update the current session name if provided
                                    if (response.data.originalSessionName && vm.cm.currentSession) {
                                        vm.cm.currentSession.name = response.data.originalSessionName;
                                        vm.fUpdater.sessionName = response.data.originalSessionName;
                                    }

                                    // Add a delay to ensure database operations complete
                                    timeout(function () {
                                        // Force refresh of session list first
                                        if (vm.cm.currentAlbum && vm.cm.currentAlbum.id) {
                                            vm.cm.getSessionsForAlbum(vm.cm.currentAlbum.id, -1).then(function () {
                                                timeout(function () {
                                                    setSessionTranscript(originalSessionId);
                                                    $scope.$broadcast("sessionMetadataUpdated");
                                                }, 200);
                                            });
                                        } else {
                                            timeout(function () {
                                                setSessionTranscript(originalSessionId);
                                            }, 200);
                                        }
                                    }, 1000);
                                } else {
                                    logError("Failed to break transcript into sessions", controllerId);
                                }
                            }).catch(function (error) {
                                var errorMessage = error.data && error.data.message ? error.data.message : "Unknown error";
                                logError("Error breaking transcript into sessions: " + errorMessage, controllerId);
                            });
                    }
                })
                .catch(function () {
                    // User cancelled the dialog - this is expected behavior, no error needed
                    // Just silently handle the cancellation
                });
        }

        function toggleTokenPanel() {
            console.log("🔧 DEBUG: toggleTokenPanel() called", {
                currentState: vm.showTokenPanel,
                currentSessionId: vm.fTranscript.sessionId,
                currentTokenPanelSessionId: vm.tokenPanelSessionId,
                isInitialized: vm.tokenPanelInitialized,
                tokenPanelWillChange: vm.tokenPanelSessionId !== vm.fTranscript.sessionId
            });

            if (!vm.fTranscript.sessionId || vm.fTranscript.sessionId <= 0) {
                logError("Please select a session before opening the token panel");
                return;
            }

            // On first activation, initialize the panel properly without animation
            if (!vm.tokenPanelInitialized) {
                vm.tokenPanelInitialized = true;
                vm.tokenPanelSessionId = vm.fTranscript.sessionId;
                console.log("🔧 DEBUG: Token panel first-time initialization", {
                    sessionId: vm.fTranscript.sessionId,
                    tokenPanelSessionId: vm.tokenPanelSessionId
                });
                
                // Use a small delay to ensure the directive is properly initialized before showing
                timeout(function() {
                    vm.showTokenPanel = true;
                    console.log("🔧 DEBUG: Token panel shown after initialization delay");
                }, 100);
                return;
            }

            vm.showTokenPanel = !vm.showTokenPanel;
            
            // Always update the session ID when toggling - this ensures correct binding
            var oldTokenPanelSessionId = vm.tokenPanelSessionId;
            if (vm.showTokenPanel) {
                vm.tokenPanelSessionId = vm.fTranscript.sessionId;
                console.log("🔧 DEBUG: Token panel session ID updated", {
                    oldTokenPanelSessionId: oldTokenPanelSessionId,
                    newTokenPanelSessionId: vm.tokenPanelSessionId,
                    currentSessionId: vm.fTranscript.sessionId
                });
                
                // Force load tokens manually since $onChanges might not fire
                timeout(function() {
                    console.log("🔧 DEBUG: Manually triggering token load for opened panel");
                    // Find the directive and manually trigger loadTokens
                    var tokenPanelScope = angular.element('[data-session-token-panel]').isolateScope();
                    if (tokenPanelScope && tokenPanelScope.vm && tokenPanelScope.vm.loadTokens) {
                        console.log("🔧 DEBUG: Found token panel directive, calling loadTokens manually");
                        tokenPanelScope.vm.loadTokens();
                    } else {
                        console.warn("🔧 DEBUG: Could not find token panel directive to manually load tokens");
                    }
                }, 100);
            }
            // Don't reset tokenPanelSessionId to 0 when closing - this destroys the directive
            // Just hide it with isVisible binding

            console.log("🔧 DEBUG: Token panel toggled", {
                showTokenPanel: vm.showTokenPanel,
                tokenPanelSessionId: vm.tokenPanelSessionId,
                actualSessionId: vm.fTranscript.sessionId,
                isInitialized: vm.tokenPanelInitialized
            });
        }

        function deleteSession(albumId, categoryId, sessionId) {
            // Validate inputs
            if (!sessionId || sessionId <= 0) {
                logError("Invalid session ID for deletion", controllerId);
                return;
            }

            // Create session object for deletion
            var sessionToDelete = {
                sessionId: sessionId,
                mediaPath: "none" // Default value as seen in other usages
            };

            // Call the contentManager delete function
            contentManager.deleteSession(sessionToDelete)
                .then(function (response) {
                    logSuccess("Session deleted successfully", controllerId);
                    
                    // Clear the current session selection
                    vm.fTranscript.sessionId = null;
                    vm.fTranscript.transcript = "";
                    
                    // Add a delay to ensure the database deletion completes
                    timeout(function () {
                        // Refresh the session list for the current album
                        if (albumId && albumId > 0) {
                            contentManager.getSessionsForAlbum(albumId, categoryId || -1)
                                .then(function () {
                                    // Add another small delay to ensure data propagation
                                    timeout(function () {
                                        // Force refresh by temporarily clearing and resetting album
                                        var currentAlbumId = vm.fTranscript.albumId;
                                        vm.fTranscript.albumId = null;
                                        
                                        timeout(function () {
                                            vm.fTranscript.albumId = currentAlbumId;
                                            // Broadcast to refresh the dropdown
                                            $scope.$broadcast("sessionMetadataUpdated");
                                            logSuccess("Session list refreshed after deletion", controllerId);
                                        }, 50);
                                    }, 100);
                                });
                        } else {
                            // If no album context, just broadcast the update
                            timeout(function () {
                                $scope.$broadcast("sessionMetadataUpdated");
                            }, 100);
                        }
                    }, 300); // Give the database time to complete the deletion
                })
                .catch(function (error) {
                    logError("Failed to delete session: " + (error.message || error), controllerId);
                });
        }

        function uploadAudioFile() {
            if (!vm.fTranscript.sessionId || vm.fTranscript.sessionId <= 0) {
                logError("No session selected for file upload", controllerId);
                return;
            }

            var fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.mp3,.wav,.m4a';
            
            fileInput.onchange = function(event) {
                var file = event.target.files[0];
                if (!file) {
                    return;
                }

                log("Starting audio file upload for session " + vm.fTranscript.sessionId, controllerId);
                
                // Set uploading state
                vm.isUploading = true;
                
                fileUpload.uploadAudioFile(file, vm.fTranscript.sessionId)
                    .then(function(response) {
                        if (response && response.data && response.data.link) {
                            // Update the session's media path
                            vm.cm.currentSession.mediaPath = response.data.link;
                            
                            // Update media readiness
                            updateMediaReadiness();
                            
                            // Refresh session data to reflect the change
                            contentManager.setCurrentSession(vm.fTranscript.sessionId);
                            
                            logSuccess("Audio file uploaded successfully", controllerId);
                        } else {
                            logError("File upload response was invalid", controllerId);
                        }
                    })
                    .catch(function(error) {
                        logError("File upload failed: " + (error.message || error), controllerId);
                    })
                    .finally(function() {
                        // Clear uploading state
                        vm.isUploading = false;
                    });
            };
            
            fileInput.click();
        }

        function deleteAudioFile() {
            if (!vm.fTranscript.sessionId || vm.fTranscript.sessionId <= 0) {
                logError("No session selected for file deletion", controllerId);
                return;
            }

            if (!vm.cm.currentSession.mediaPath) {
                logError("No audio file to delete", controllerId);
                return;
            }

            dlg.confirmationDialog("Delete Audio File", "Are you sure you want to delete this audio file? This action cannot be undone.", "Yes", "No").then(function(response) {
                if (response === "ok") {
                    // Simply clear the media path without using the removeMediaFileForSession API
                    // which appears to deactivate the session
                    
                    // Clear the media path locally
                    vm.cm.currentSession.mediaPath = null;
                    
                    // Update session metadata to clear the media path on the server
                    // without affecting the session's active state
                    var sessionMeta = {
                        sessionId: vm.fTranscript.sessionId,
                        categoryId: vm.fTranscript.categoryId || vm.fUpdater.categoryId,
                        sessionName: vm.fUpdater.sessionName || vm.cm.currentSession.name,
                        sessionDesc: vm.fUpdater.sessionDesc || vm.cm.currentSession.description,
                        sessionDate: moment().format("MM/DD/YY"),
                        mediaPath: null // Clear the media path
                    };
                    
                    datacontext.saveSessionMetadata(sessionMeta)
                        .then(function() {
                            // Update media readiness after clearing media path
                            updateMediaReadiness();
                            
                            // Refresh session data to reflect the change
                            contentManager.setCurrentSession(vm.fTranscript.sessionId);
                            
                            logSuccess("Audio file deleted successfully", controllerId);
                        })
                        .catch(function(error) {
                            logError("Failed to delete audio file: " + (error.message || error), controllerId);
                            
                            // Restore the media path if the server update failed
                            contentManager.setCurrentSession(vm.fTranscript.sessionId);
                        });
                }
            });
        }

        function loadTokenCount() {
            // Load token count for the current session
            if (!vm.fTranscript.sessionId || vm.fTranscript.sessionId <= 0) {
                vm.tokenCount = 0;
                return;
            }

            datacontext.getSessionTokens(vm.fTranscript.sessionId)
                .then(function(response) {
                    if (response && response.data && angular.isArray(response.data)) {
                        vm.tokenCount = response.data.length;
                        console.log("DEBUG: Token count loaded", {
                            sessionId: vm.fTranscript.sessionId,
                            tokenCount: vm.tokenCount,
                            controllerId: controllerId
                        });
                    } else {
                        vm.tokenCount = 0;
                    }
                })
                .catch(function(error) {
                    console.error("Error loading token count:", error);
                    vm.tokenCount = 0;
                });
        }

        function mediaEvent(event) {
            // Handle jPlayer media events
            console.log("🔧 [ADMIN-MEDIA-DEBUG] Media event received", {
                eventType: event ? event.jPlayer.event.type : 'No event',
                sessionId: vm.fTranscript.sessionId,
                hasCurrentSession: !!vm.cm.currentSession,
                mediaPath: vm.cm.currentSession ? vm.cm.currentSession.mediaPath : 'No session',
                isMediaReady: vm.isMediaReadyToPlay,
                controllerId: controllerId
            });

            // Optional: Add any specific media event handling here
            // For example, logging play/pause events for analytics
            if (event && event.jPlayer && event.jPlayer.event) {
                switch (event.jPlayer.event.type) {
                    case 'play':
                        console.log("🔧 [ADMIN-MEDIA-DEBUG] Audio playback started");
                        break;
                    case 'pause':
                        console.log("🔧 [ADMIN-MEDIA-DEBUG] Audio playback paused");
                        break;
                    case 'ended':
                        console.log("🔧 [ADMIN-MEDIA-DEBUG] Audio playback completed");
                        break;
                }
            }
        }

        function updateMediaReadiness() {
            // Initialize media readiness based on current session
            if (vm.cm.currentSession && vm.cm.currentSession.mediaPath) {
                var cleanMediaPath = String(vm.cm.currentSession.mediaPath).trim();
                vm.isMediaReadyToPlay = !!(cleanMediaPath && cleanMediaPath !== 'null' && cleanMediaPath !== 'undefined');
                
                console.log("🔧 [ADMIN-MEDIA-DEBUG] Media readiness updated", {
                    sessionId: vm.fTranscript.sessionId,
                    originalMediaPath: vm.cm.currentSession.mediaPath,
                    cleanMediaPath: cleanMediaPath,
                    isMediaReady: vm.isMediaReadyToPlay,
                    controllerId: controllerId
                });
            } else {
                vm.isMediaReadyToPlay = false;
                console.log("🔧 [ADMIN-MEDIA-DEBUG] No media path available", {
                    sessionId: vm.fTranscript.sessionId,
                    hasCurrentSession: !!vm.cm.currentSession,
                    controllerId: controllerId
                });
            }
        }

        function toggleAudioPlayer() {
            // Toggle the audio player expanded/collapsed state
            vm.isAudioPlayerExpanded = !vm.isAudioPlayerExpanded;
            
            console.log("🔧 [ADMIN-MEDIA-DEBUG] Audio player toggled", {
                sessionId: vm.fTranscript.sessionId,
                isExpanded: vm.isAudioPlayerExpanded,
                hasMediaPath: !!(vm.cm.currentSession && vm.cm.currentSession.mediaPath),
                controllerId: controllerId
            });
        }

        function closeTokenPanel() {
            console.log("🔧 DEBUG: closeTokenPanel() called", {
                currentState: vm.showTokenPanel,
                isInitialized: vm.tokenPanelInitialized
            });
            vm.showTokenPanel = false;
        }

        /**
         * Generate a UUID for content identification
         */
        function generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0;
                var v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        // Legacy ahadees panel functions removed - now handled by Froala plugin
    }
})();