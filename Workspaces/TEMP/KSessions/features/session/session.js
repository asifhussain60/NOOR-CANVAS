(function () {
    "use strict";
    var controllerId = "sessionCtl";
    angular.module("app").controller(controllerId,
    ["$scope", "mediaportService", "auditService", "common", "config", "contentManager", "globalData", "$injector", adminSessionsCtl]);

    function adminSessionsCtl($scope, mps, auditService, common, config, contentManager, gdata, $injector) {
        // Safe accordion service injection
        var accordionService = null;
        try {
            accordionService = $injector.get('accordionService');
        } catch (e) {
            // accordionService not available, continue without it
        }

        // Safe development logger injection
        var devLogger = null;
        try {
            devLogger = $injector.get('devLogger');
        } catch (e) {
            // devLogger not available, continue without logging
        }

        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");
        var urlAlbumId = $scope.$state.params.albumId;
        var urlSessionId = $scope.$state.params.sessionId;
        var urlJumpLocation = Number($scope.$state.params.jumpLocation) || 0;
        var memberId = $scope.g.member.id;
        var guid = $scope.g.member.sessionGuid;

        $scope.vm = {}; var vm = $scope.vm; vm.mediaPort = mps;

        //Properties
        vm.forceAudioUpload = false;
        vm.currentAlbum = null;
        vm.currentSession = null;
        vm.jumpTo = jumpTo;
        vm.isMobileBrowser = common.isMobileBrowser();
        vm.isMediaReadyToPlay = false;
        vm.lastRecordedTime = 0;

        //Methods
        vm.displayCalendarMode = displayCalendarMode;
        vm.returnToAlbumView = returnToAlbumView;
        vm.mediaEvent = mediaEvent;
        vm.gotoTop = gotoTop;
        vm.gotoSessionFeedback = gotoSessionFeedback;
        vm.speakerIsAsif = speakerIsAsif;
        vm.editSummary = editSummary;
        vm.getPanelIcon = getPanelIcon;
        vm.toggleSummaryActive = toggleSummaryActive;
        vm.onSummaryClick = onSummaryClick;

        // Development logging for page tracking
        if (devLogger && devLogger.isDev) {
            var directives = ['summary-accordion', 'ang-accordion', 'collapsible-item'];
            devLogger.logPageVisit('sessionTranscript', directives);
            // Blue debug bar disabled - using green debug button in layout instead
            // devLogger.createDebugBar('sessionTranscript', directives);
            devLogger.log('Session controller initialized', 'sessionController', {
                albumId: urlAlbumId,
                sessionId: urlSessionId,
                jumpLocation: urlJumpLocation,
                isMobile: vm.isMobileBrowser
            });
        }


        if (!$scope.g.member.adminSimulationMode && !guid) { logError("Session Guid is not available", controllerId); }
        else { activate(); }


        function activate() {

            vm.currentAlbum = contentManager.currentAlbum;
            if (!urlSessionId) { 
                console.error("🔧 [SESSION-DEBUG] No session ID provided in URL parameters");
                return; 
            }

            console.log("🔧 [SESSION-DEBUG] Starting session activation", {
                sessionId: urlSessionId,
                albumId: urlAlbumId,
                jumpLocation: urlJumpLocation,
                memberId: memberId,
                guid: guid,
                isMobile: vm.isMobileBrowser,
                controllerId: controllerId
            });

            var promises = [contentManager.setCurrentSession(urlSessionId)];
            common.activateController(promises, controllerId).then(onControllerActivation);

            function onControllerActivation(response) {
                console.log("🔧 [SESSION-DEBUG] Controller activation response", {
                    response: response,
                    hasResponse: !!response,
                    hasData: !!(response && response[0]),
                    controllerId: controllerId
                });

                if (response && response[0]) {
                    vm.currentSession = contentManager.getPreviligedSession();
                    
                    console.log("🔧 [SESSION-DEBUG] Current session loaded", {
                        sessionId: vm.currentSession.id,
                        sessionName: vm.currentSession.name,
                        mediaPath: vm.currentSession.mediaPath,
                        mediaPathType: typeof vm.currentSession.mediaPath,
                        mediaPathValid: !!(vm.currentSession.mediaPath && typeof vm.currentSession.mediaPath === 'string'),
                        hasMediaPath: !!vm.currentSession.mediaPath,
                        isProduction: !config.isLocalDevelopment,
                        configMediaUrl: config.urls.media,
                        controllerId: controllerId
                    });

                    // Validate media path before proceeding
                    if (vm.currentSession.mediaPath) {
                        var cleanMediaPath = String(vm.currentSession.mediaPath).trim();
                        var expectedMediaUrl = config.urls.media + "/" + cleanMediaPath + ".mp3";
                        
                        console.log("🔧 [SESSION-DEBUG] Media path validation", {
                            originalMediaPath: vm.currentSession.mediaPath,
                            cleanMediaPath: cleanMediaPath,
                            expectedUrl: expectedMediaUrl,
                            urlType: 'relative',
                            willResolveToCurrentDomain: true,
                            controllerId: controllerId
                        });
                    } else {
                        console.warn("🔧 [SESSION-DEBUG] No media path found for session", {
                            sessionId: vm.currentSession.id,
                            sessionName: vm.currentSession.name,
                            controllerId: controllerId
                        });
                    }
                    
                    $scope.setPageTitle(vm.currentSession.name);
                    
                    // Initialize accordion service if available (optional enhancement)
                    if (accordionService) {
                        try {
                            vm.summaryAccordion = accordionService.createAccordion({
                                allowMultiple: false,
                                expandFirst: false
                            });
                            console.log("🔧 [SESSION-DEBUG] Accordion service initialized successfully");
                        } catch (e) {
                            console.warn("🔧 [SESSION-DEBUG] Accordion service initialization failed", e);
                            vm.summaryAccordion = null;
                        }
                    }
                    
                    if (urlJumpLocation === 0) {
                        // Expand first summary
                        if (vm.currentSession.summary && vm.currentSession.summary.length > 0) {
                            vm.currentSession.summary[0].isExpanded = true;
                            console.log("🔧 [SESSION-DEBUG] First summary expanded", {
                                summaryTitle: vm.currentSession.summary[0].title || 'Untitled',
                                summaryId: vm.currentSession.summary[0].id
                            });
                        }
                    } else {
                        console.log("🔧 [SESSION-DEBUG] Expanding section for jump location", { jumpLocation: urlJumpLocation });
                        expandSecionForJumpLocation();
                    }
                    
                    addAuditEntryForSession("SESSION_START");
                    
                    console.log("🔧 [SESSION-DEBUG] Session activation completed successfully", {
                        sessionId: vm.currentSession.id,
                        sessionName: vm.currentSession.name,
                        summaryCount: vm.currentSession.summary ? vm.currentSession.summary.length : 0,
                        controllerId: controllerId
                    });
                } else {
                    console.error("🔧 [SESSION-DEBUG] Controller activation failed - no valid response", {
                        response: response,
                        urlSessionId: urlSessionId,
                        controllerId: controllerId
                    });
                }
                log("Browser Viewport width: " + mps.getWidth(), controllerId, config.showDevToasts);
            }
        }

        $scope.$watch("vm.isMediaReadyToPlay", function (newMediaPlayValue, oldMediaPlayValue) {
            console.log("🔧 [SESSION-DEBUG] Media ready state changed", {
                newValue: newMediaPlayValue,
                oldValue: oldMediaPlayValue,
                isEqual: angular.equals(newMediaPlayValue, oldMediaPlayValue),
                urlJumpLocation: urlJumpLocation,
                shouldJump: urlJumpLocation && newMediaPlayValue && !angular.equals(newMediaPlayValue, oldMediaPlayValue),
                controllerId: controllerId
            });

            if (urlJumpLocation && newMediaPlayValue && !angular.equals(newMediaPlayValue, oldMediaPlayValue)) {
                console.log("🔧 [SESSION-DEBUG] Triggering jump to location", {
                    jumpLocation: urlJumpLocation,
                    mediaReadyState: newMediaPlayValue,
                    controllerId: controllerId
                });
                jumpTo(urlJumpLocation);
            }
        }, false);


        //Internal Methods

        //function processPreviligedSummaries(session) {
        //    var summaries = session.summary;
        //    _.each(summaries, function (summary) {
        //        if (!gdata.member.isPreviliged && !gdata.member.isAdmin) {
        //            summary.content = summary.content.replace("previligedBlock", "hidden");
        //        }
        //    });
        //    session.summary = summaries;
        //    return session;
        //}

        function expandSecionForJumpLocation() {
            var hasExpanded = false;
            _.each(vm.currentSession.summary, function (s, idx) {

                try {
                    var currentJump = s.jumpLocation;
                    var nextJump = vm.currentSession.summary[idx + 1].jumpLocation;

                    var isInRange = (idx < vm.currentSession.summary.length);
                    var max = isInRange
                        ? vm.currentSession.summary[idx + 1].jumpLocation
                        : 8000;
                    if (currentJump < urlJumpLocation && nextJump > urlJumpLocation) {
                        s.isExpanded = true;
                        hasExpanded = true;
                        return;
                    }
                } catch (e) {
                    if (!hasExpanded) {
                        var total = vm.currentSession.summary.length - 1;
                        vm.currentSession.summary[total].isExpanded = true;
                    }
                }

            });
        }

        function jumpTo(jumpLocation) {
            console.log("🔧 [SESSION-DEBUG] Attempting to jump to location", {
                jumpLocation: jumpLocation,
                jPlayerExists: !!$("#jquery_jplayer_1").length,
                jPlayerData: $("#jquery_jplayer_1").data("jPlayer"),
                mediaReadyState: vm.isMediaReadyToPlay,
                controllerId: controllerId
            });

            try {
                $("#jquery_jplayer_1").jPlayer("play", jumpLocation);
                console.log("🔧 [SESSION-DEBUG] jPlayer jump command executed successfully", {
                    jumpLocation: jumpLocation,
                    controllerId: controllerId
                });
            } catch (error) {
                console.error("🔧 [SESSION-DEBUG] jPlayer jump failed", {
                    error: error,
                    errorMessage: error.message,
                    jumpLocation: jumpLocation,
                    controllerId: controllerId
                });
            }
        }

        function mediaEvent(event, type) {
            console.log("🔧 [SESSION-DEBUG] Media event triggered", {
                eventType: type,
                hasEvent: !!event,
                hasJPlayer: !!(event && event.jPlayer),
                hasStatus: !!(event && event.jPlayer && event.jPlayer.status),
                currentTime: event && event.jPlayer && event.jPlayer.status ? event.jPlayer.status.currentTime : 'unknown',
                controllerId: controllerId
            });

            var activity = "";
            switch (type) {
                case "play":
                    activity = "SESSION_START";
                    break;
                case "pause":
                    activity = "SESSION_END";
                    break;
            }
            
            if (event && event.jPlayer && event.jPlayer.status) {
                vm.lastRecordedTime = event.jPlayer.status.currentTime;
                console.log("🔧 [SESSION-DEBUG] Updated last recorded time", {
                    currentTime: vm.lastRecordedTime,
                    activity: activity,
                    controllerId: controllerId
                });
                addAuditEntryForSession(activity, event.jPlayer.status.currentTime);
            } else {
                console.warn("🔧 [SESSION-DEBUG] Media event missing required data", {
                    eventType: type,
                    activity: activity,
                    hasEvent: !!event,
                    controllerId: controllerId
                });
            }
        }

        function addAuditEntryForSession(entryType, currentTime) {

            if ($scope.g.member.adminSimulationMode) { return; }

            var sid = vm.currentSession && vm.currentSession.id ? vm.currentSession.id : -1;
            var sessionMember = {
                sessionId: sid,
                memberId: memberId || -1,
                udf: guid,
                udf1: currentTime || "",
                udf2: "",
                udfType: entryType
            };
            setLastAudioLocation();
            auditService.addAuditEntryForSession(sessionMember).then(function (result) {
                if (result.data) {
                    logSuccess("Added " + entryType + " audit entry for Session ID: " + result.data, controllerId, config.showDevToasts);
                } else {
                    logError("Failed to log audit entry ", controllerId, config.showDevToasts);
                }
            });
        }

        function getJplayerCurrentTime() {
            var jp = $("#jquery_jplayer_1").data("jPlayer");
            if (jp) {
                var ct = $("#jquery_jplayer_1").data("jPlayer").status.currentTime;
                return ct;
            }
            return null;
        }

        function setLastAudioLocation() {
            var ct = getJplayerCurrentTime() || vm.lastRecordedTime;
            vm.lastRecordedTime = ct;

            var accessedAudio = {
                groupID: vm.currentAlbum.id,
                sessionID: vm.currentSession.id,
                sessionName: vm.currentSession.name,
                audioLocation: ct,
                groupName: vm.currentAlbum.name,
                groupImage: vm.currentAlbum.Image
            }
            $scope.g.member.lastAccessedSession = accessedAudio;
        }

        function returnToAlbumView() {
            $("#jquery_jplayer_1").jPlayer("destroy");
            $scope.stateGo("album", { albumId: contentManager.currentAlbum.id });
        }

        function displayCalendarMode() {
            var ipadViewportWidth = 1024;
            return mps.viewportWidth >= ipadViewportWidth;
        }

        function gotoTop(summary) {
            summary.isExpanded = false;
            common.scrollToTop();
        }
        function editSummary(summary) {
            $scope.stateGo("admin.summary", { albumId: vm.currentAlbum.id, sessionId: summary.sessionId, summaryId: summary.id });
        }
        function getPanelIcon(summary) {
            var icon = "microphone-slash";
            if (summary.isPreviliged) {
                icon = "lock";
            } else if (summary.jumpLocation) {
                icon = "microphone";
            }
            return icon;
        }

        function gotoSessionFeedback() {
            var session = vm.currentSession;
            $scope.stateGo("feedback", { albumId: session.groupId, sessionId: session.id });
        }
        function speakerIsAsif() {
            if (!vm.currentSession) { return false; }
            return vm.currentSession.speakerId === 1;
        }

        function toggleSummaryActive(summary) {
            if (!$scope.g.member.isAdmin) {
                logError("Unauthorized: Only admins can toggle summary status", controllerId);
                return;
            }

            if (devLogger && devLogger.isDev) {
                devLogger.log('Toggling summary active status', 'sessionController', { 
                    summaryId: summary.id, 
                    currentStatus: summary.isActive,
                    title: summary.title
                });
            }

            var newStatus = !summary.isActive;
            var statusText = newStatus ? "activate" : "deactivate";
            
            // Show confirmation dialog
            var confirmMessage = "Are you sure you want to " + statusText + " this summary?\n\n" +
                                "Title: " + summary.title + "\n" +
                                (newStatus ? "This will make it visible to all users." : "This will hide it from standard users.");

            if (!confirm(confirmMessage)) {
                return;
            }

            // Call the admin API to toggle status
            contentManager.toggleSummaryActiveStatus(summary.id, newStatus)
                .then(function(response) {
                    if (response && response.success) {
                        summary.isActive = newStatus;
                        logSuccess("Successfully " + statusText + "d summary: " + summary.title, controllerId);
                        
                        if (devLogger && devLogger.isDev) {
                            devLogger.log('Summary status updated successfully', 'sessionController', { 
                                summaryId: summary.id, 
                                newStatus: newStatus 
                            });
                        }
                    } else {
                        logError("Failed to " + statusText + " summary: " + (response.message || "Unknown error"), controllerId);
                    }
                })
                .catch(function(error) {
                    logError("Error " + statusText + "ing summary: " + (error.message || error.statusText || "Unknown error"), controllerId);
                });
        }

        function onSummaryClick(summary) {
            if (devLogger && devLogger.isDev) {
                devLogger.logDirectiveUsage('sessionController', 'summary clicked', {
                    summaryId: summary.id,
                    title: summary.title,
                    currentlyExpanded: summary.isExpanded
                });
            }

            // Always use manual accordion behavior for reliable UI updates
            
            // Close all other summaries
            _.each(vm.currentSession.summary, function(s) {
                if (s !== summary) {
                    s.isExpanded = false;
                }
            });
            
            // Toggle the clicked summary
            summary.isExpanded = !summary.isExpanded;
            
            // Optional: Also update accordion service if available (for consistency)
            if (accordionService && vm.summaryAccordion) {
                try {
                    var summaryId = summary.id || summary.summaryId || vm.currentSession.summary.indexOf(summary);
                    vm.summaryAccordion.toggle(summaryId);
                } catch (e) {
                    // Accordion service update failed, continue with manual behavior
                }
            }
        }

        $(window).on("beforeunload", function () {
            $scope.$apply(function () {
                addAuditEntryForSession("SESSION_END", vm.lastRecordedTime);
            });
        });
        $scope.$on("$destroy", function () {
            addAuditEntryForSession("SESSION_END", vm.lastRecordedTime);
        });

    }
})();