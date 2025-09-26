(function () {
    "use strict";

    var serviceId = "contentManager";
    angular.module("app").factory(serviceId,
        ["$state", "common", "config", "datacontext", "globalData", contentManagerService]);

    function contentManagerService($state, common, config, datacontext, gData) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(serviceId);
        var logSuccess = getLogFn(serviceId, "success");
        var logError = getLogFn(serviceId, "error");

        // Define the functions and properties to reveal.
        var service = {
            //Properties
            adminStore: {
                albumId: 0,
                sessionId: 0
            },
            albums: [],
            categories: [],
            countries: [],
            currentAlbum: null,
            currentSession: null,
            families: [],
            familyMembers: [],
            recentUploadedCategories: [], //Holds latest uploaded sessions
            memberList: [],
            speakers: [],

            //Methods
            activateSession: activateSession,
            addUpdateFamilyMember: addUpdateFamilyMember,
            addUpdateCurrentAlbum: addUpdateCurrentAlbum,
            addUpdateCurrentSession: addUpdateCurrentSession,
            addUpdateSummary: addUpdateSummary,
            deleteAlbum: deleteAlbum,
            deleteSession: deleteSession,
            deleteFamilyMember: deleteFamilyMember,
            deleteSummary: deleteSummary,
            getAlbumsForMember: getAlbumsForMember,
            getAlbumDataById: getAlbumDataById,
            getAllAlbums: getAllAlbums,
            getAllAlbumsForAdmin: getAllAlbumsForAdmin,
            getCategoriesForAlbum: getCategoriesForAlbum,
            getAllFamilyMembers: getAllFamilyMembers,
            getFamilyMembersByAlbumId: getFamilyMembersByAlbumId,
            //getMembersForFamily: getMembersForFamily,
            getRecentUploadedCategories: getLatestSessions,
            getMemberById: getMemberById,
            getMembersForAlbum: getMembersForAlbum,
            getMembersForSession: getMembersForSession,
            getMostRecentSessions: getMostRecentSessions,
            getPreviligedSession: getPreviligedSession,
            getSessionById: getSessionById,
            getSessionsForAlbum: getSessionsForAlbum,
            initialize: initialize,
            loadAlbumSessions: loadAlbumSessions,
            removeMediaFileForSession: removeMediaFileForSession,
            resetAlbumMembersInFamilies: resetAlbumMembersInFamilies,
            setAlbum: setAlbum,
            setAdminStore: setAdminStore,
            setAlbumActivation: setAlbumActivation,
            setAlbumById: setAlbumById,
            setCurrentSession: setCurrentSession,
            updateAlbum: updateAlbum,
            updateFamilyMember: updateFamilyMember,
            updateMediaPathForSession: updateMediaPathForSession,
            breakTranscriptIntoSessions: breakTranscriptIntoSessions,
            deleteSession: deleteSession
        };

        initializeService();

        return service;

        //#region Internal Methods

        function initializeService() {
            var promises = [
                datacontext.getSpeakers(),
                datacontext.getMemberList(),
                datacontext.getAllCountries()
            ];
            return common.$q.all(promises).then(onSuccess, onFailure);

            function onSuccess(result) {
                if (!result) {
                    return false;
                }
                service.speakers = result[0].data;
                service.memberList = result[1].data;
                service.countries = angular.copy(result[2].data);
                return true;
            }
        }

        function activateSession(sessionId, isActive) {
            return datacontext.activateSession(sessionId, isActive);
        }

        function setAlbumActivation(albumId, isActive) {
            return datacontext.setAlbumActivation(albumId, isActive).then(function (response) {
                // Update the album in the local arrays
                if (service.albums) {
                    var album = common.findById(service.albums, "id", albumId);
                    if (album) {
                        album.isActive = isActive;
                    }
                }

                if (service.currentAlbum && service.currentAlbum.id === albumId) {
                    service.currentAlbum.isActive = isActive;
                }

                return response;
            });
        }

        function initialize() {
            service.albums = [];
            service.currentAlbum = null;
            service.currentSession = null;
            service.families = [];
            service.familyMembers = [];
            return initializeService();
        }

        function getAllAlbums() {
            return datacontext.getAlbumList().then(onSuccess, onFailure);

            function onSuccess(result) {
                service.albums = result.data;
                return datacontext.$q.when(result.data);
            }
        }

        function getAllAlbumsForAdmin(memberId) {
            return datacontext.getAlbumListForAdmin(memberId).then(onSuccess, onFailure);

            function onSuccess(result) {
                service.albums = result.data;
                return datacontext.$q.when(result.data);
            }
        }

        function getCategoriesForAlbum(albumId) {
            return datacontext.getCategoriesForAlbum(albumId).then(function (response) {
                service.categories = response.data;
                return datacontext.$q.when(true);
            });
        }

        function getAlbumsForMember(memberId) {
            return datacontext.getAlbumListForMember(memberId).then(onSuccess, onFailure);

            function onSuccess(response) {
                service.albums = null;
                if (response && response.data) {
                    service.albums = response.data;
                    return datacontext.$q.when(response.data);
                }
                return datacontext.$q.reject("bad data");
            }
        }

        function resetAlbumMembersInFamilies() {
            _.each(service.families,
                function (family) {
                    _.each(family.members,
                        function (member) {
                            member.isChecked = false;
                        });
                });
        }

        function loadAlbumSessions(album, memberId) {
            service.setAlbum(album);
            return service.getAlbumDataById(album.id, memberId);
        }

        function getAlbumDataById(albumId, memberId) {
            return getSessionsForAlbum(albumId, memberId)
                .then(getMembersForAlbum, onFailure);
        }

        function getSessionsForAlbum(albumId, memberId) {
            return datacontext.getalbumSessionsWithAcl(albumId, memberId)
                .then(function (result) {
                    if (!result || !result.data) {
                        return false;
                    }
                    var data = result.data;
                    service.currentAlbum.sessions = data;
                    return albumId;
                },
                    onFailure);
        }

        function getMembersForAlbum(albumId) {
            return datacontext.getMembersForAlbum(albumId).then(function (response) {
                if (!response || !response.data) {
                    return false;
                }
                service.currentAlbum.members = primeMemberData(response.data);
                return true;
            },
                onFailure);
        }

        function getMembersForSession(sessionId) {
            return datacontext.getMembersForSession(sessionId).then(function (response) {
                if (!response || !response.data) {
                    return false;
                }
                return response.data;
            },
                onFailure);
        }

        function primeMemberData(members) {
            return _.each(members,
                function (member) {
                    member.displayIcon = member.gender === "M" ? "fa-male" : "fa-female";
                    if (member.age < 18) {
                        member.displayIcon = "fa-child";
                    }
                    member.isChecked = false;
                });
        }

        function setAlbum(album) {
            service.currentAlbum = album;
        }

        function setAdminStore(albumId, categoryId, sessionId) {
            service.adminStore.albumId = albumId || 0;
            service.adminStore.categoryId = categoryId || service.adminStore.categoryId || 0;
            service.adminStore.sessionId = sessionId || 0;
        }

        function setAlbumById(id) {
            if (id && service.albums) {
                var result = common.findById(service.albums, "id", id);
                if (result) {
                    service.currentAlbum = result;
                }
            }
        }

        function getSessionById(id) {
            return common.findById(service.currentAlbum.sessions, "id", id);
        }

        function setCurrentSession(sessionId) {
            if (!service.currentAlbum || !service.currentAlbum.sessions) {
                return common.$q.reject("Current session not found");
            }
            
            service.currentSession = getSessionById(sessionId);
            
            if (!service.currentSession) {
                return common.$q.when(false);
            }
            
            // Debug the session media path
            console.log("DEBUG: setCurrentSession - session data:", {
                sessionId: sessionId,
                sessionName: service.currentSession.name,
                mediaPath: service.currentSession.mediaPath,
                mediaPathType: typeof service.currentSession.mediaPath,
                mediaPathValid: !!(service.currentSession.mediaPath && typeof service.currentSession.mediaPath === 'string'),
                fullSessionObject: service.currentSession
            });
            
            // Ensure mediaPath is a string if it exists - Enhanced for production
            if (service.currentSession.mediaPath && typeof service.currentSession.mediaPath !== 'string') {
                console.warn("🔧 [CONTENT-MGR-DEBUG] Converting non-string mediaPath to string:", {
                    originalValue: service.currentSession.mediaPath,
                    originalType: typeof service.currentSession.mediaPath,
                    sessionId: sessionId,
                    isProduction: !config.isLocalDevelopment
                });
                service.currentSession.mediaPath = String(service.currentSession.mediaPath);
                console.log("🔧 [CONTENT-MGR-DEBUG] Converted mediaPath:", service.currentSession.mediaPath);
            }
            
            // Additional validation for empty or null mediaPath
            if (service.currentSession.mediaPath === null || service.currentSession.mediaPath === undefined || service.currentSession.mediaPath === '') {
                console.warn("🔧 [CONTENT-MGR-DEBUG] Empty or null mediaPath detected:", {
                    sessionId: sessionId,
                    sessionName: service.currentSession.name,
                    mediaPath: service.currentSession.mediaPath
                });
            }
            
            return datacontext.getSessionSummary(gData.member.id, sessionId).then(onSuccess, onFailure);

            function onSuccess(result) {
                if (result && result.data) {
                    service.currentSession.summary = result.data;
                    return common.$q.when(true);
                } else {
                    common.$q.when(false);
                }
                return false;
            }
        }

        function onFailure(error) {
            return datacontext.$q.reject("Data not found");
        }

        function getAllFamilyMembers(id) {
            return datacontext.getFamilyMembers(id).then(onSuccess, onFailure);

            function onSuccess(result) {
                if (!result) {
                    log("getAllFamilyMembers() success return with NO data", serviceId, config.showDevToasts);
                }
                service.families = result.data;
                logSuccess("getAllFamilyMembers() success return WITH data", serviceId, config.showDevToasts);
                return datacontext.$q.when(true);
            }
        }

        function getFamilyMembersByAlbumId(albumId) {
            return datacontext.getFamilyMembersForGroupId(albumId).then(onSuccess, onFailure);

            function onSuccess(response) {
                if (response.data) {
                    logSuccess("deleteAlbumById() success return WITH data: " + response.data,
                        serviceId,
                        config.showDevToasts);
                }
                return response.data;
            }
        }

        //function getMembersForFamily(familyId) {
        //    if (service.families && service.families.length) {
        //        var result = _.find(service.families, function (f) {
        //            return f.id === familyId;
        //        });
        //        service.familyMembers = result.members;
        //        return result.members.length;
        //    }
        //    return null;
        //}

        function updateFamilyMember(member) {
            service.memberList = _.without(service.memberList, _.findWhere(service.memberList, { id: member.id }));
            member.fullName = member.firstName + " " + member.lastName;
            service.memberList.push(member);
        }

        function updateMediaPathForSession(sessionId, mediaFile) {
            return datacontext.updateMediaFileForSession(sessionId, mediaFile);
        }

        function updateAlbum(album) {
            try {
                // Ensure albums array exists
                if (!service.albums) {
                    service.albums = [];
                    return;
                }

                // Find and remove the existing album safely
                var existingAlbumIndex = -1;
                for (var i = 0; i < service.albums.length; i++) {
                    if (service.albums[i].id === album.id) {
                        existingAlbumIndex = i;
                        break;
                    }
                }

                if (existingAlbumIndex >= 0) {
                    // Remove the old album
                    service.albums.splice(existingAlbumIndex, 1);
                }

                // Add the updated album
                service.albums.push(angular.copy(album));
                
                // Update current album reference
                setAlbum(album);
            } catch (error) {
                console.error("Error updating album in contentManager:", error);
            }
        }

        function getMemberById(id) {
            return common.findById(service.familyMembers, "id", id);
        }

        function getLatestSessions(memberId, count) {
            return datacontext.getLatestSessionsForMember(memberId, count).then(onSuccess, onFailure);

            function onSuccess(response) {
                service.recentUploadedCategories = response.data;
                return response.data.length;
            }
        }

        function addUpdateFamilyMember(member) {
            return datacontext.addUpdateFamilyMember(member).then(onSuccess, onFailure);

            function onSuccess(response) {
                if (!response.data) {
                    log("addUpdateFamilyMember() success return with NO data", serviceId, config.showDevToasts);
                }
                logSuccess("addUpdateFamilyMember() success return WITH data " + response.data,
                    serviceId,
                    config.showDevToasts);
                return response.data;
            }
        }

        function addUpdateCurrentAlbum(album) {
            album.id = album.albumId || 0;
            return datacontext.addUpdateAlbum(album).then(onSuccess, onFailure);

            function onSuccess(response) {
                logSuccess("addUpdateAlbum() success return WITH data: " + response.data,
                    serviceId,
                    config.showDevToasts);
                return response.data;
            }
        }

        function addUpdateCurrentSession(session) {
            session.id = session.sessionId || 0;
            return datacontext.addUpdateSession(session);
        }

        function addUpdateSummary(summary) {
            return datacontext.addUpdateSessionSummary(summary);
        }

        function removeMediaFileForSession(sessionId, media) {
            return datacontext.removeMediaFileForSession(sessionId, media);
        }

        function deleteSummary(summary) {
            return datacontext.deleteSummaryById(summary);
        }

        function deleteFamilyMember(memberId) {
            return datacontext.deleteFamilyMember(memberId).then(onSuccess, onFailure);

            function onSuccess(response) {
                service.familyMembers = common.withoutItem(service.familyMembers, { id: memberId });
                logSuccess("deleteFamilyMember() success return WITH data: " + response.data,
                    serviceId,
                    config.showDevToasts);
                return response.data;
            }
        }

        function deleteAlbum(albumId) {
            return datacontext.deleteAlbumById(albumId).then(onSuccess, onFailure);

            function onSuccess(response) {
                if (response.data) {
                    service.albums = common.withoutItem(service.albums, { id: albumId });
                    logSuccess("deleteAlbumById() success return WITH data: " + response.data,
                        serviceId,
                        config.showDevToasts);
                    return response.data;
                }
            }
        }

        function deleteSession(session) {
            return datacontext.deleteSessionById(session.sessionId, session.mediaPath).then(onSuccess, onFailure);

            function onSuccess(response) {
                return response.data;
            }
        }

        function getMostRecentSessions(memberId) {
            return datacontext.mostRecentSessions(memberId);
        }

        function getPreviligedSession() {
            if (service.currentSession && service.currentSession.summary) {
                var summaries = service.currentSession.summary;
                _.each(summaries,
                    function (summary) {
                        if (!gData.member.isPreviliged && summary.content) {
                            summary.content = summary.content.replace("previligedBlock", "hidden");
                        }
                    });
                service.currentSession.summary = summaries;
            }
            return service.currentSession;
        }

        function breakTranscriptIntoSessions(sessionId, transcriptContent, categoryId) {
            var requestData = {
                transcriptContent: transcriptContent,
                categoryId: categoryId,
                speakerId: 1, // Asif Hussain
                description: "<--- Enter Description --->"
            };

            return datacontext.breakTranscriptIntoSessions(sessionId, requestData).then(function (response) {
                // Update the current session name if provided in the response
                if (response.data && response.data.originalSessionName && service.currentSession && service.currentSession.id === sessionId) {
                    service.currentSession.name = response.data.originalSessionName;
                }

                // Refresh the current album sessions to show new sessions
                if (service.currentAlbum && service.currentAlbum.id) {
                    return service.getSessionsForAlbum(service.currentAlbum.id, gData.member.id).then(function () {
                        // After refreshing sessions, ensure the original session is properly updated
                        if (response.data && response.data.originalSessionName && service.currentAlbum.sessions) {
                            var updatedSession = service.currentAlbum.sessions.find(function (s) { return s.id === sessionId; });
                            if (updatedSession) {
                                updatedSession.name = response.data.originalSessionName;
                                // Also update displayTitleWithRowNumber if it exists
                                if (updatedSession.displayTitleWithRowNumber) {
                                    var sessionIndex = service.currentAlbum.sessions.indexOf(updatedSession);
                                    updatedSession.displayTitleWithRowNumber = (sessionIndex + 1) + ". " + response.data.originalSessionName;
                                }
                            }

                            // Ensure current session reference is maintained
                            if (service.currentSession && service.currentSession.id === sessionId) {
                                service.currentSession.name = response.data.originalSessionName;
                            }
                        }
                        return response;
                    });
                }

                // If no current album, still update the current session name
                if (response.data && response.data.originalSessionName && service.currentSession && service.currentSession.id === sessionId) {
                    service.currentSession.name = response.data.originalSessionName;
                }

                return response;
            });
        }

        //#endregion
    }
})();