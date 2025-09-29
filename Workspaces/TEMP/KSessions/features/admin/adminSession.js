(function () {
    "use strict";
    var controllerId = "adminSessionCtl";
    angular.module("app").controller(controllerId,
        ["$scope", "common", "bootstrap.dialog", "config", "contentManager", "datacontext", "fileUpload", adminSessionCtl]);

    function adminSessionCtl($scope, common, dlg, config, contentManager, datacontext, fileUpload) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");
        var memberId = $scope.g.member.id;

        $scope.vm = {}; var vm = $scope.vm;
        var timeout = common.$timeout;

        vm.albumFamilyMembers = [];
        vm.cm = contentManager;
        vm.isNewSession = false;
        vm.fSession = {};
        vm.audioUploadInProgress = false;
        vm.session = { members: [] }
        vm.submitCaption = "Submit Changes";
        vm.flags = {
            showSubmitSpinner: false
        }
        vm.uploadApi = "api/file/mp3/session/";
        vm.showNewCategory = false;
        vm.sortableSessions = [];
        vm.sessionSortOptions = {
            orderChanged: sessionOrderChanged,
            containment: "#sortableSessions"
        };
        vm.isEmailNotificationInProgress = false;
        
        // Category sorting properties
        vm.sortableCategories = [];
        vm.categorySortOptions = {
            orderChanged: categoryOrderChanged,
            containment: "#sortableCategories"
        };

        vm.addNewCategory = addNewCategory;
        vm.addSummaryForSession = addSummaryForSession;
        vm.submit = submit;
        vm.addNewSession = addNewSession;
        vm.deleteCategory = deleteCategory;
        vm.deleteSession = deleteSession;
        vm.displayNewCategory = displayNewCategory;
        vm.switchTab = switchTab;
        vm.uploadFile = uploadFile;
        vm.fileUploadSuccess = fileUploadSuccess;
        vm.fileDeleteComplete = fileDeleteComplete;
        vm.gotoTranscript = gotoTranscript;
        vm.resetView = resetView;
        vm.updateCategory = updateCategory;
        vm.notifyMembers = notifyMembers;
        vm.onAlbumSelect = onAlbumSelect;
        vm.onSessionSelect = onSessionSelect;
        
        activate();
        
        // Add watchers for debugging
        $scope.$watch('vm.fSession.albumId', function(newVal, oldVal) {
            if (newVal !== oldVal) {
                console.log("DEBUG: vm.fSession.albumId changed", {
                    from: oldVal,
                    to: newVal,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // Watch for category changes and re-sync sortable sessions
        $scope.$watch('vm.fSession.categoryId', function(newVal, oldVal) {
            if (newVal !== oldVal) {
                console.log("DEBUG: vm.fSession.categoryId changed", {
                    from: oldVal,
                    to: newVal,
                    timestamp: new Date().toISOString()
                });
                
                // Re-sync sortable sessions when category changes
                if (newVal && newVal > 0 && contentManager.currentAlbum && contentManager.currentAlbum.sessions) {
                    console.log("DEBUG: Category changed, re-syncing sortable sessions");
                    syncSortableList();
                }
            }
        });
        
        $scope.$watch('vm.sortableSessions', function(newVal, oldVal) {
            if (newVal !== oldVal) {
                console.log("DEBUG: vm.sortableSessions changed", {
                    oldLength: oldVal ? oldVal.length : 'null',
                    newLength: newVal ? newVal.length : 'null',
                    newSessions: angular.copy(newVal),
                    timestamp: new Date().toISOString()
                });
            }
        }, true); // Deep watch
        
        // Listen for the sessionMetadataUpdated event from the directive
        $scope.$on('sessionMetadataUpdated', function(event, data) {
            console.log("DEBUG: sessionMetadataUpdated event received", data);
            syncSortableList();
        });
        
        // Listen for when content manager updates
        $scope.$watch(function() {
            return contentManager.currentAlbum;
        }, function(newAlbum, oldAlbum) {
            if (newAlbum !== oldAlbum) {
                console.log("DEBUG: contentManager.currentAlbum changed", {
                    oldAlbum: oldAlbum ? { id: oldAlbum.id, sessionsLength: oldAlbum.sessions ? oldAlbum.sessions.length : 0 } : 'null',
                    newAlbum: newAlbum ? { id: newAlbum.id, sessionsLength: newAlbum.sessions ? newAlbum.sessions.length : 0 } : 'null'
                });
                
                // When current album changes and has sessions, sync the sortable list
                if (newAlbum && newAlbum.sessions) {
                    console.log("DEBUG: Album changed with sessions, calling syncSortableList");
                    syncSortableList();
                }
            }
        }, true);
        
        // Watch specifically for session changes
        $scope.$watch(function() {
            return contentManager.currentAlbum ? contentManager.currentAlbum.sessions : null;
        }, function(newSessions, oldSessions) {
            if (newSessions !== oldSessions) {
                console.log("DEBUG: contentManager.currentAlbum.sessions changed", {
                    oldSessionsLength: oldSessions ? oldSessions.length : 'null',
                    newSessionsLength: newSessions ? newSessions.length : 'null',
                    newSessions: newSessions ? angular.copy(newSessions.slice(0, 3)) : 'null' // Just first 3 for debugging
                });
                
                if (newSessions && newSessions.length > 0) {
                    console.log("DEBUG: Sessions detected, calling syncSortableList immediately");
                    syncSortableList();
                }
            }
        }, true);

        function activate() {
            contentManager.initialize();
            var promises = [
                contentManager.getAllAlbums()
            ];
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(resultArray) {
                if (resultArray[0]) {
                    log("Activated adminSession View", controllerId, config.showDevToasts);
                }
            }
        };

        function onAlbumSelect(albumId) {
            console.log("DEBUG: onAlbumSelect called", {
                albumId: albumId,
                albumIdType: typeof albumId,
                albumIdIsValid: albumId && albumId > 0,
                currentVmFSession: angular.copy(vm.fSession),
                contentManagerCurrentAlbum: contentManager.currentAlbum ? {
                    id: contentManager.currentAlbum.id,
                    name: contentManager.currentAlbum.name,
                    sessionsExist: !!contentManager.currentAlbum.sessions,
                    sessionsLength: contentManager.currentAlbum.sessions ? contentManager.currentAlbum.sessions.length : 0
                } : 'no current album'
            });
            
            // Validate albumId
            if (!albumId || albumId <= 0) {
                console.log("DEBUG: onAlbumSelect - invalid albumId, skipping");
                return;
            }
            
            vm.fSession = newSessionObject({ albumId: albumId });
            console.log("DEBUG: vm.fSession after newSessionObject", angular.copy(vm.fSession));
            
            // Add delay to allow contentManager to be fully updated
            timeout(function() {
                console.log("DEBUG: onAlbumSelect - after timeout, checking contentManager", {
                    currentAlbum: contentManager.currentAlbum ? {
                        id: contentManager.currentAlbum.id,
                        name: contentManager.currentAlbum.name,
                        sessionsExist: !!contentManager.currentAlbum.sessions,
                        sessionsLength: contentManager.currentAlbum.sessions ? contentManager.currentAlbum.sessions.length : 0
                    } : 'no current album after timeout'
                });
                
                getFamilyMembersForAlbum(albumId)
                    .then(getCategoriesForAlbum)
                    .finally(function() {
                        // Set up a monitoring system to wait for sessions to be loaded
                        console.log("DEBUG: Starting session monitoring for album", albumId);
                        waitForSessionsToLoad(albumId);
                        startSessionMonitoring(albumId);
                    });
            }, 100);
        }
        
        function waitForSessionsToLoad(albumId, attempts) {
            attempts = attempts || 0;
            var maxAttempts = 20; // 20 attempts x 200ms = 4 seconds max wait
            
            console.log("DEBUG: waitForSessionsToLoad attempt", attempts, {
                albumId: albumId,
                currentAlbum: contentManager.currentAlbum ? {
                    id: contentManager.currentAlbum.id,
                    sessionsExist: !!contentManager.currentAlbum.sessions,
                    sessionsLength: contentManager.currentAlbum.sessions ? contentManager.currentAlbum.sessions.length : 0
                } : 'no current album'
            });
            
            if (contentManager.currentAlbum && 
                contentManager.currentAlbum.id === albumId && 
                contentManager.currentAlbum.sessions && 
                contentManager.currentAlbum.sessions.length > 0) {
                
                console.log("DEBUG: Sessions loaded! Calling syncSortableList");
                syncSortableList();
                return;
            }
            
            if (attempts < maxAttempts) {
                timeout(function() {
                    waitForSessionsToLoad(albumId, attempts + 1);
                }, 200);
            } else {
                console.log("DEBUG: Timeout waiting for sessions to load for album", albumId);
                // Even if no sessions, still call sync to update the UI
                syncSortableList();
            }
        }
        
        // Add a periodic check function for debugging
        var sessionCheckInterval;
        function startSessionMonitoring(albumId) {
            if (sessionCheckInterval) {
                clearInterval(sessionCheckInterval);
            }
            
            var checkCount = 0;
            sessionCheckInterval = setInterval(function() {
                checkCount++;
                console.log("DEBUG: Periodic session check", checkCount, {
                    albumId: albumId,
                    currentAlbum: contentManager.currentAlbum ? {
                        id: contentManager.currentAlbum.id,
                        sessionsExist: !!contentManager.currentAlbum.sessions,
                        sessionsLength: contentManager.currentAlbum.sessions ? contentManager.currentAlbum.sessions.length : 0,
                        sessions: contentManager.currentAlbum.sessions ? angular.copy(contentManager.currentAlbum.sessions.slice(0, 3)) : 'no sessions'
                    } : 'no current album'
                });
                
                if (contentManager.currentAlbum && 
                    contentManager.currentAlbum.id === albumId && 
                    contentManager.currentAlbum.sessions) {
                    
                    console.log("DEBUG: Sessions found during monitoring! Syncing...");
                    syncSortableList();
                    clearInterval(sessionCheckInterval);
                } else if (checkCount > 25) { // Stop after 25 checks (5 seconds)
                    console.log("DEBUG: Stopping session monitoring - timeout reached");
                    clearInterval(sessionCheckInterval);
                }
            }, 200);
        }

        function getFamilyMembersForAlbum(albumId) {
            console.log("DEBUG: getFamilyMembersForAlbum called", {
                albumId: albumId,
                aboutToCallSyncSortableList: true
            });
            
            // DON'T sync sortable list here - sessions might not be loaded yet
            // syncSortableList();
            
            console.log("DEBUG: skipping syncSortableList in getFamilyMembersForAlbum - sessions may not be loaded yet");
            
            return contentManager.getFamilyMembersByAlbumId(albumId).then(function (response) {
                console.log("DEBUG: getFamilyMembersByAlbumId response", {
                    responseLength: response ? response.length : 'null response',
                    response: response
                });
                vm.albumFamilyMembers = response;
                return albumId;
            });
        }
        function getCategoriesForAlbum(albumId) {
            console.log("DEBUG: getCategoriesForAlbum called", {
                albumId: albumId,
                aboutToCallSyncSortableList: true
            });
            
            // Call syncSortableList here - after both album is set and we're loading categories
            // This should be after sessions are loaded by the directive
            syncSortableList();
            
            console.log("DEBUG: after syncSortableList in getCategoriesForAlbum", {
                sortableSessionsLength: vm.sortableSessions.length,
                sortableSessions: angular.copy(vm.sortableSessions)
            });
            
            return contentManager.getCategoriesForAlbum(albumId).then(function (response) {
                console.log("DEBUG: getCategoriesForAlbum response", {
                    response: response,
                    responseType: typeof response
                });
                
                if (response) {
                    logSuccess("Categories loaded", controllerId, config.showDevToasts);
                    syncSortableCategoryList();
                    
                    console.log("DEBUG: after syncSortableCategoryList", {
                        sortableCategoriesLength: vm.sortableCategories.length,
                        sortableCategories: angular.copy(vm.sortableCategories)
                    });
                    
                    // Try syncing sessions again after categories are loaded
                    console.log("DEBUG: calling syncSortableList again after categories loaded");
                    syncSortableList();
                }
            });
        }

        function onSessionSelect(sessionId, categoryId) {
            console.log("DEBUG: onSessionSelect called", {
                sessionId: sessionId,
                categoryId: categoryId,
                currentCategoryId: vm.fSession.categoryId
            });
            
            // Update the category if provided and different from current
            if (categoryId && categoryId !== vm.fSession.categoryId) {
                console.log("DEBUG: onSessionSelect - updating category", {
                    from: vm.fSession.categoryId,
                    to: categoryId
                });
                vm.fSession.categoryId = categoryId;
            }
            
            vm.session.members = null;
            selectCurrentSession(sessionId)
                .then(contentManager.getMembersForSession)
                .then(loadSelectedSessionMembers);
        }
        function selectCurrentSession(sessionId) {
            var session = contentManager.getSessionById(sessionId);
            session.albumId = vm.fSession.albumId;
            vm.fSession = newSessionObject(session);
            vm.uploadApi = "api/file/mp3/session/" + sessionId;
            return common.$q.when(sessionId);
        }
        function loadSelectedSessionMembers(members) {
            vm.session.members = members;
        }

        function fileDeleteComplete() {
            vm.fSession.isActive = false;
            vm.cm.currentSession.isActive = false;
        }

        function fileUploadSuccess(response) {
            var audioFileGuid = response.data.link;
            vm.audioUploadInProgress = false;
            vm.fSession.mediaPath = audioFileGuid;
            vm.cm.currentSession.mediaPath = audioFileGuid;
        }

        function sessionOrderChanged(event) {
            var idx = 1;
            var updatedSequences = [];
            _.each(vm.sortableSessions, function (s) {
                s.sequence = idx;
                updatedSequences.push({ id: s.id, sequence: idx });
                idx += 1;
            });
            vm.cm.currentAlbum.sessions = angular.copy(vm.sortableSessions);
            datacontext.resequenceSessions(updatedSequences).then(function (response) {
                if (response.data) {
                    logSuccess("Updated Session Sequences", controllerId);
                }
            });
        }

        function categoryOrderChanged(event) {
            var idx = 1;
            var updatedSortOrders = [];
            _.each(vm.sortableCategories, function (c) {
                c.sortOrder = idx;
                updatedSortOrders.push({ categoryId: c.categoryId, sortOrder: idx });
                idx += 1;
            });
            vm.cm.categories = angular.copy(vm.sortableCategories);
            datacontext.resequenceCategories(updatedSortOrders).then(function (response) {
                if (response.data) {
                    logSuccess("Updated Category Sort Orders", controllerId);
                }
            });
        }

        function syncSortableList() {
            console.log("DEBUG: syncSortableList called", {
                currentAlbum: contentManager.currentAlbum,
                currentAlbumExists: !!contentManager.currentAlbum,
                currentAlbumSessions: contentManager.currentAlbum ? contentManager.currentAlbum.sessions : 'no current album',
                sessionsLength: contentManager.currentAlbum && contentManager.currentAlbum.sessions ? contentManager.currentAlbum.sessions.length : 'no sessions',
                selectedCategoryId: vm.fSession.categoryId,
                filterByCategory: true // This page always uses category filtering
            });
            
            // Guard clause: ensure currentAlbum exists
            if (!contentManager.currentAlbum) {
                console.log("DEBUG: syncSortableList - no current album, setting empty array");
                vm.sortableSessions = [];
                return;
            }
            
            // Guard clause: ensure sessions array exists
            if (!contentManager.currentAlbum.sessions) {
                console.log("DEBUG: syncSortableList - no sessions array, setting empty array");
                vm.sortableSessions = [];
                return;
            }
            
            var sessions = angular.copy(contentManager.currentAlbum.sessions);
            console.log("DEBUG: syncSortableList - sessions copied", {
                originalSessions: contentManager.currentAlbum.sessions,
                copiedSessions: sessions,
                sessionsLength: sessions.length
            });
            
            // Filter sessions by selected category if a category is selected
            if (vm.fSession.categoryId && vm.fSession.categoryId > 0) {
                var filteredSessions = _.filter(sessions, function(session) {
                    return session.categoryId === vm.fSession.categoryId;
                });
                
                console.log("DEBUG: syncSortableList - filtering by category", {
                    selectedCategoryId: vm.fSession.categoryId,
                    originalSessionsLength: sessions.length,
                    filteredSessionsLength: filteredSessions.length,
                    filteredSessions: angular.copy(filteredSessions)
                });
                
                vm.sortableSessions = _.sortBy(filteredSessions, function (s) { return s.sequence; });
            } else {
                console.log("DEBUG: syncSortableList - no category filter, showing all sessions");
                vm.sortableSessions = _.sortBy(sessions, function (s) { return s.sequence; });
            }
            
            console.log("DEBUG: syncSortableList - final result", {
                sortableSessionsLength: vm.sortableSessions.length,
                sortableSessions: angular.copy(vm.sortableSessions)
            });
        }

        function syncSortableCategoryList() {
            var categories = angular.copy(contentManager.categories);
            // Filter out the default category (ID = 1) from sortable list
            var sortableCategories = _.filter(categories, function (c) { return c.categoryId !== 1; });
            vm.sortableCategories = _.sortBy(sortableCategories, function (c) { return c.sortOrder || c.categoryId; });
        }

        function displayNewCategory() {
            vm.showNewCategory = !vm.showNewCategory;
            vm.fSession.newCategoryName = !vm.showNewCategory ? "" : vm.fSession.newCategoryName;
        }

        function deleteCategory(category) {
            var categoryId = category.categoryId;
            datacontext.deleteCategory(categoryId).then(function (response) {
                vm.cm.categories = common.withoutItem(vm.cm.categories, { categoryId: categoryId });
                syncSortableCategoryList();
                log("Category deleted", controllerId);
            });
        }
        function addNewCategory() {
            var newCategory = {
                categoryId: -1,
                categoryName: vm.fSession.newCategoryName,
                groupId: vm.fSession.albumId,
                sortOrder: getNewCategorySortOrder()
            }
            updateCategory(newCategory).then(function (response) {
                newCategory.categoryId = response;
                vm.fSession.newCategoryName = "";
                vm.cm.categories.push(newCategory);
                vm.showNewCategory = false;
                syncSortableCategoryList();
            });
        }
        
        function getNewCategorySortOrder() {
            var categories = vm.cm.categories;
            var maxItem = _.max(categories, function (category) { return category.sortOrder || 0; });
            return (maxItem.sortOrder || 0) + 1;
        }
        
        function updateCategory(category) {
            return datacontext.addUpdateCategory(category).then(function (response) {
                category.categoryId = response.data;
                log("Category updated", controllerId);
                return response.data;
            });
        }

        function newSessionObject(session) {
            if (!session) { session = {}; }
            return {
                albumId: session.albumId || "",
                sessionId: session.id || "",
                categoryId: session.categoryId || 1,
                id: session.id || "",
                name: session.name || "",
                sessionDate: session.sessionDate ? new Date(session.sessionDate) : "",
                mediaPath: session.mediaPath || "",
                speakerId: session.speakerId || 0,
                description: session.description || "",
                isActive: session.isActive || false,
                sequence: session.sequence
            }
        }

        function addNewSession(state) {
            contentManager.getMembersForAlbum(vm.fSession.albumId).then(function (response) {
                vm.session.members = angular.copy(contentManager.currentAlbum.members);
                var newSession = {
                    albumId: vm.fSession.albumId,
                    sessionDate: new Date()
                };
                vm.fSession = newSessionObject(newSession);
                vm.fSession.sequence = getNewSessionId();
                vm.isNewSession = state;
                resetMembersInGroup(true);
                if (state) {
                    timeout(function () { $("#sessionTitle").focus(); }, 500);
                }
            });
        }

        function getNewSessionId() {
            var sessions = contentManager.currentAlbum.sessions;
            var maxItem = _.max(sessions, function (session) { return session.sequence; });
            return maxItem.sequence + 1;
        }

        function gotoTranscript() {
            contentManager.setAdminStore(vm.fSession.albumId, vm.fSession.categoryId, vm.fSession.sessionId);
            $scope.stateGo("admin.transcript");
        }

        function resetMembersInGroup(state) {
            _.each(vm.albumFamilyMembers, function (family) {
                _.each(family.members, function (member) {
                    member.isChecked = state;
                });
            });
        }

        function uploadFile() {
            $("#imageUpload").click();
        }

        function deleteSession(albumId, categoryId, sessionId) {
            var session = vm.fSession;
            dlg.deleteDialog("session", "").then(function (result) {
                if (result === "ok") {
                    contentManager.deleteSession(session).then(onSuccess, onFailure);
                }
                function onSuccess(response) {
                    vm.cm.currentAlbum.sessions = common.withoutItem(vm.cm.currentAlbum.sessions, { id: session.sessionId });
                    vm.fSession = newSessionObject({ albumId: vm.fSession.albumId });
                    syncSortableList();
                    resetMembersInGroup(false);
                }
                function onFailure(errorResponse) {
                    logError(errorResponse.data, controllerId, config.showDevToasts);
                }
            });
        }

        function resetView() {
            vm.submitCaption = "Submit Changes";
        }

        function submit() {
            vm.flags.showSubmitSpinner = true;
            vm.fSession.id = vm.fSession.albumId || 0;
            vm.fSession.groupId = vm.fSession.albumId || 0;
            vm.fSession.members = _(vm.albumFamilyMembers)
                .chain()
                .pluck("members")
                .flatten()
                .where({ isChecked: true })
                .value();

            contentManager.addUpdateCurrentSession(vm.fSession).then(function (responseSessionId) {
                var sessionId = responseSessionId.data;
                if (vm.isNewSession) {
                    vm.submitCaption = "Submit and upload file";
                    vm.fSession.id = sessionId;
                    vm.fSession.sessionId = sessionId;
                    var newSession = newSessionObject(angular.copy(vm.fSession));
                    vm.cm.currentAlbum.sessions.push(newSession);
                    vm.flags.showSubmitSpinner = false;
                    syncSortableList();
                    logSuccess("Record was successfully added", controllerId);
                } else {
                    if (sessionId) {
                        vm.submitCaption = "Submit Changes";
                        vm.cm.currentAlbum.sessions = common.withoutItem(vm.cm.currentAlbum.sessions, { id: vm.fSession.sessionId });
                        vm.cm.currentAlbum.sessions.push(vm.fSession);
                        vm.fSession.id = sessionId;
                        vm.fSession.sessionId = sessionId;
                        vm.flags.showSubmitSpinner = false;
                        logSuccess("Record was successfully updated", controllerId);
                    }
                }
                vm.isNewSession = false;
                common.scrollToTop();
            }, function (error) {
            });
        }

        function addSummaryForSession() {
            contentManager.setAdminStore(vm.fSession.albumId, vm.fSession.categoryId, vm.fSession.sessionId);
            $scope.stateGo("admin.summary");
        }

        function notifyMembers() {
            var msg = "Are you sure you want to notify all memebers in this group?";
            dlg.confirmationDialog("Email Notification", msg, "Yes, Do It!", "I'm Not Sure").then(function (response) {
                if (response === "ok") {
                    var sessionId = angular.copy(vm.fSession.sessionId);
                    if (sessionId) {
                        vm.isEmailNotificationInProgress = true;
                        datacontext.notifyUsersOfSessionUpload(sessionId).then(function (response) {
                            vm.isEmailNotificationInProgress = false;
                            if (response.data) {
                                logSuccess("Members have been notified about this session", controllerId);
                            } else {
                                logError("There was an error sending email", controllerId);
                            }
                        });
                    }
                }
            });
        }

        function switchTab(tabId) {
            // Hide all tab panes
            angular.element('#categories-tab').removeClass('active');
            angular.element('#sessions-tab').removeClass('active');
            
            // Remove active class from all tab navigation items
            angular.element('.nav-tabs li').removeClass('active');
            
            // Show the selected tab pane
            angular.element('#' + tabId).addClass('active');
            
            // Add active class to the corresponding nav item
            angular.element('[data-target="#' + tabId + '"]').parent().addClass('active');
        }
    }
})();