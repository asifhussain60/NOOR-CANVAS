(function () {
    'use strict';

    var serviceId = 'datacontext';
    angular.module('app').factory(serviceId, ['$http', 'common', 'globalData', datacontext]);

    function datacontext($http, common, globalData) {
        var $q = common.$q;

        var service = {
            $q: $q,
            activateSession: activateSession,
            addAuditEntry: addAuditEntry,
            addUpdateFamilyMember: addUpdateFamilyMember,
            addUpdateAlbum: addUpdateAlbum,
            addUpdateCategory: addUpdateCategory,
            addUpdateSession: addUpdateSession,
            addUpdateSessionSummary: addUpdateSessionSummary,
            deleteFamilyMember: deleteFamilyMember,
            deleteAlbumById: deleteAlbumById,
            deleteSessionById: deleteSessionById,
            deleteSummaryById: deleteSummaryById,
            deleteImageFile: deleteImageFile,
            deleteAuditLogEntry: deleteAuditLogEntry,
            deleteCategory: deleteCategory,
            deleteDenials: deleteDenials,
            getAlbumList: getAlbumList,
            getAlbumListForMember: getAlbumListForMember,
            getAlbumListForAdmin: getAlbumListForAdmin,
            getalbumSessionsWithAcl: getalbumSessionsWithAcl,
            getAuditData: getAuditData,
            getAuditDenials: getAuditDenials,
            getCategoriesForAlbum: getCategoriesForAlbum,
            getAllMembersWithEmails: getAllMembersWithEmails,
            getAllGroupsSessionsWithAccess: getAllGroupsSessionsWithAccess,
            getDashboardCounts: getDashboardCounts,
            getDatabaseInfo: getDatabaseInfo,
            getFamilyMembers: getFamilyMembers,
            getFamilyMembersForGroupId: getFamilyMembersForGroupId,
            getGeoLocationByIp: getGeoLocationByIp,
            getImagesForSession: getImagesForSession,
            getLatestSessionsForMember: getLatestSessionsForMember,
            getMemberList: getMemberList,
            getMemberIdByEmail: getMemberIdByEmail,
            getMembersForAlbum: getMembersForAlbum,
            getMembersForSession: getMembersForSession,
            getSalaamContent: getSalaamContent,
            getSessionById: getSessionById,
            getSessionFeedbackQuestions: getSessionFeedbackQuestions,
            getSessionSummary: getSessionSummary,
            getSummariesForPreviousSession: getSummariesForPreviousSession,
            getSpeakers: getSpeakers,
            getSummaryContentById: getSummaryContentById,
            getSessionTranscript: getSessionTranscript,
            getActiveCountriesList: getActiveCountriesList,
            getAllCountries: getAllCountries,
            mostRecentSessions: mostRecentSessions,
            notifyUsersOfSessionUpload: notifyUsersOfSessionUpload,
            removeMediaFileForSession: removeMediaFileForSession,
            resequenceSessions: resequenceSessions,
            resequenceSummaries: resequenceSummaries,
            resequenceCategories: resequenceCategories,
            resetProfilePic: resetProfilePic,
            saveSessionMetadata: saveSessionMetadata,
            saveSessionTranscript: saveSessionTranscript,
            setAlbumActivation: setAlbumActivation,
            setMemberActivation: setMemberActivation,
            setMemberEmailSubscription: setMemberEmailSubscription,
            submitSessionFeedback: submitSessionFeedback,
            summarizeTranscript: summarizeTranscript,
            setSessionAccessAudit: setSessionAccessAudit,
            toggleAlbumActive: toggleAlbumActive,
            toggleCategoryActive: toggleCategoryActive,
            toggleSessionActive: toggleSessionActive,
            updateMediaFileForSession: updateMediaFileForSession,
            updateAlbumAccessForMember: updateAlbumAccessForMember,
            updateOAuthProfile: updateOAuthProfile,
            breakTranscriptIntoSessions: breakTranscriptIntoSessions,
            // Session Token methods
            getSessionTokens: getSessionTokens,
            saveSessionTokens: saveSessionTokens,
            addSessionToken: addSessionToken,
            deleteSessionToken: deleteSessionToken,
            deleteSessionTokens: deleteSessionTokens,
            // New registration methods
            checkMemberEmailExists: checkMemberEmailExists,
            getMemberDataForRegistration: getMemberDataForRegistration,
            completeRegistration: completeRegistration,
            //QURAN
            addUpdateRootWord: addUpdateRootWord,
            deleteDerivative: deleteDerivative,
            deleteRoot: deleteRoot,
            getAyatsWithTranslation: getAyatsWithTranslation,
            getQuranAyatByToken: getQuranAyatByToken,
            getQuranAyatByEnglishToken: getQuranAyatByEnglishToken,
            getAyatsAsHtml: getAyatsAsHtml,
            getDerivativeById: getDerivativeById,
            getDerivativeByTransliteral: getDerivativeByTransliteral,
            getNarrators: getNarrators,
            getRoots: getRoots,
            getRootWithDerivatives: getRootWithDerivatives,
            getSurahList: getSurahList,
            saveDerivatives: saveDerivatives,
            saveAhadees: saveAhadees,
            saveAhadeesNew: saveAhadees, // Temporary alias to test cache issues
            deleteAhadees: deleteAhadees,
            getAhadeesById: getAhadeesById,
            getRecentAhadees: getRecentAhadees,
            searchAhadees: searchAhadees,
            updateAyah: updateAyah,
            updateAyatTranslation: updateAyatTranslation,
            // ETYMOLOGY - Enhanced Islamic Linguistic System
            searchEtymology: searchEtymology,
            getEtymologyDerivatives: getEtymologyDerivatives,
            //Hub
            getHubProfileForSession: getHubProfileForSession,
            saveHubPreloaderData: saveHubPreloaderData,
            // Logs API
            getLogFiles: getLogFiles,
            getLogContent: getLogContent,
            getLiveSessionContent: getLiveSessionContent,
            deleteLogFile: deleteLogFile,
            clearOldLogs: clearOldLogs,
            deleteAllLogs: deleteAllLogs,
            getLogStats: getLogStats,
            // Production Deployment Methods
            executeProductionDeployment: executeProductionDeployment,
            testProductionDeployment: testProductionDeployment
        };

        console.log('[DATACONTEXT] Service initialized with saveAhadees method:', typeof service.saveAhadees);

        return service;

        //Internal Methods

        function activateSession(sessionId, isActive) {
            return $http.put('api/admin/session/' + sessionId + '/activate/' + isActive);
        }
        function addAuditEntry(entry) {
            return $http.post('api/audit/entry', entry);
        }
        function getAuditData(days) {
            return $http.get('api/admin/audit/days/' + days);
        }
        function getAuditDenials(days) {
            return $http.get('api/admin/audit-denials/days/' + days);
        }
        function getAlbumList() {
            return $http.get('api/groups');
        }
        function getAlbumListForMember(memberId) {
            return $http.get('api/member/' + memberId + '/groups');
        }
        function getAlbumListForAdmin(memberId) {
            return $http.get('api/admin/albums/' + memberId);
        }
        function getalbumSessionsWithAcl(groupId, memberId) {
            return $http.get('api/group/' + groupId + '/member/' + memberId + '/sessions');
        }
        function getMemberIdByEmail(email, isSimulation) {
            if (angular.isUndefined(isSimulation)) { isSimulation = false; }
            var uri = encodeURI('api/member/' + email + '/id/simulation/' + isSimulation);
            
            return $http.get(uri).then(function(response) {
                return response;
            }, function(error) {
                // Error in getMemberIdByEmail - re-throw to maintain error handling chain
                throw error;
            });
        }
        function getMembersForAlbum(groupId) {
            var uri = encodeURI('api/group/' + groupId + '/members');
            return $http.get(uri);
        }
        function getMembersForSession(sessionId) {
            var uri = encodeURI('api/sessions/' + sessionId + '/members');
            return $http.get(uri);
        }
        function getFamilyMembersForGroupId(groupId) {
            var uri = encodeURI('api/families/group/' + groupId + '/members');
            return $http.get(uri);
        }
        function getMemberList() {
            var uri = encodeURI('api/admin/members');
            return $http.get(uri);
        }
        function getAllGroupsSessionsWithAccess(memberId) {
            var uri = encodeURI('api/admin/groups/sessions/member/' + memberId);
            return $http.get(uri);
        }
        function getDashboardCounts() {
            return $http.get('api/admin/dashboard/counts');
        }

        function getDatabaseInfo() {
            return $http.get('api/admin/database/info');
        }

        function getSessionById(sessionId) {
            var uri = 'api/session/' + sessionId;
            return $http.get(uri);
        }
        function getSessionSummary(memberId, sessionId) {
            // For admin users, use the admin-specific endpoint that returns ALL summaries (including inactive)
            if (globalData && globalData.member && globalData.member.isAdmin) {
                var uri = 'api/admin/member/' + memberId + '/session/' + sessionId + '/summary';
                return $http.get(uri);
            } else {
                // For regular users, use the standard endpoint that filters inactive summaries
                var uri = 'api/member/' + memberId + '/session/' + sessionId + '/summary';
                return $http.get(uri);
            }
        }
        function getSessionFeedbackQuestions(sessionId) {
            return $http.get("api/sessions/" + sessionId + "/feedback-questions");
        }
        function getSummariesForPreviousSession(albumId, sessionId) {
            var uri = "api/session/" + sessionId + "/album/" + albumId + "/summaries/previous";
            return $http.get(uri);
        }
        function getSpeakers() {
            return $http.get('api/admin/speakers');
        }
        function getSummaryContentById(summaryId) {
            return $http.get('api/admin/summary/' + summaryId + '/content');
        }
        function getSessionTranscript(sessionID) {
            return $http.get('api/admin/session/' + sessionID + '/transcript');
        }
        function getActiveCountriesList() {
            return $http.get("api/lookup/countries/true");
        }
        function getAllCountries() {
            // Skip authorization for registration page usage
            return $http.get("api/lookup/countries/false");
        }
        function setSessionAccessAudit(sessionMember) {
            return $http.post('api/audit/sessionAccess', sessionMember);
        }
        function getFamilyMembers(familyId) {
            if (!familyId) { familyId = 0; }
            var uri = 'api/families/' + familyId + '/members';
            return $http.get(uri);
        }
        function addUpdateFamilyMember(member) {
            return $http.post('api/family/member/save', member);
        }
        function addUpdateAlbum(album) {
            return $http.post('api/album/save', album);
        }
        function addUpdateCategory(category) {
            return $http.post('api/admin/category/save', category);
        }
        function addUpdateSession(session) {
            return $http.post('api/sessions/save', session);
        }
        function addUpdateSessionSummary(summary) {
            return $http.post('api/admin/summary/save', summary);
        }
        function getAllMembersWithEmails() {
            return $http.get('api/admin/members/emails');
        }
        function getCategoriesForAlbum(albumId) {
            return $http.get('api/album/' + albumId + '/categories');
        }
        function deleteFamilyMember(id) {
            return $http.delete('api/member/' + id + '/delete');
        }
        function deleteAlbumById(id) {
            return $http.delete('api/admin/album/' + id + '/delete');
        }
        function deleteSessionById(id, mediaFile) {
            if (!mediaFile) { mediaFile = "none"; }
            return $http.delete('api/session/' + id + '/media/' + mediaFile + '/delete');
        }
        function deleteSummaryById(summary) {
            return $http.delete('api/admin/session/' + summary.sessionId + '/summary/' + summary.id + '/delete');
        }
        function updateMediaFileForSession(sessionId, mediaFile) {
            return $http.put('api/session/' + sessionId + '/update/' + mediaFile);
        }
        function removeMediaFileForSession(sessionId, mediaFile) {
            return $http.put('api/session/' + sessionId + '/remove/' + mediaFile);
        }
        function deleteImageFile(id, sessionId, file) {
            return $http.delete("api/file/session/" + sessionId + "/summary/" + id + "/image/" + file + "/delete");
        }
        function deleteAuditLogEntry(entry) {
            return $http.post("api/admin/audit/delete", entry);
        }
        function deleteCategory(categoryId) {
            return $http.delete("api/admin/category/" + categoryId + "/delete");
        }
        function updateAlbumAccessForMember(memberId, albums) {
            return $http.post("api/admin/member/" + memberId + "/albums", albums);
        }
        function mostRecentSessions(memberId) {
            return $http.get("api/member/" + memberId + "/mostRecent");
        }
        function resequenceSessions(list) {
            return $http.post("api/sessions/resequence", list);
        }
        function resequenceSummaries(list) {
            return $http.post("api/summary/resequence", list);
        }
        function resequenceCategories(list) {
            return $http.post("api/categories/resequence", list);
        }
        function updateOAuthProfile(memberId, profile) {
            return $http.post("api/admin/member/" + memberId + "/authProfile", profile);
        }
        function getGeoLocationByIp(ip) {
            return $http({
                method: "GET",
                url: "http://geoip.nekudo.com/api/" + ip,
                headers: { 'Content-Type': undefined }
            });
        }
        function saveSessionTranscript(sessionId, transcript) {
            return $http.post("api/admin/session/" + sessionId + "/transcript/save", transcript);
        }
        function saveSessionMetadata(meta) {
            var param = {
                sessionId: meta.sessionId,
                categoryId: meta.categoryId,
                sessionName: meta.sessionName,
                description: meta.sessionDesc,
                sessionDate: meta.sessionDate
            };
            return $http.put("api/session/meta", param);
        }

        function summarizeTranscript(sessionId, transcript) {
            console.debug("🌐 datacontext.summarizeTranscript: Preparing API call", {
                sessionId: sessionId,
                transcriptType: typeof transcript,
                transcriptKeys: transcript ? Object.keys(transcript) : [],
                transcriptId: transcript ? transcript.transcriptId : null,
                transcriptSessionId: transcript ? transcript.sessionId : null,
                transcriptLength: transcript && transcript.transcript ? transcript.transcript.length : 0,
                hasTranscriptContent: !!(transcript && transcript.transcript),
                endpoint: "api/sessions/" + sessionId + "/transcript/summarize"
            });
            
            // Show a preview of the transcript content being sent
            if (transcript && transcript.transcript) {
                var preview = transcript.transcript.length > 200 ? 
                    transcript.transcript.substring(0, 200) + "..." : 
                    transcript.transcript;
                console.debug("🌐 datacontext.summarizeTranscript: Transcript content preview", {
                    preview: preview,
                    fullLength: transcript.transcript.length,
                    h2Count: (transcript.transcript.match(/<h2/gi) || []).length
                });
            }
            
            var httpPromise = $http.post("api/sessions/" + sessionId + "/transcript/summarize", transcript);
            
            // Add response/error logging
            httpPromise.then(function(response) {
                console.debug("✅ datacontext.summarizeTranscript: Success response", {
                    sessionId: sessionId,
                    response: response,
                    responseData: response.data,
                    responseStatus: response.status,
                    responseHeaders: response.headers()
                });
            }).catch(function(error) {
                console.error("❌ datacontext.summarizeTranscript: Error response", {
                    sessionId: sessionId,
                    error: error,
                    errorStatus: error.status,
                    errorStatusText: error.statusText,
                    errorData: error.data,
                    errorHeaders: error.headers ? error.headers() : null
                });
            });
            
            return httpPromise;
        }
        function breakTranscriptIntoSessions(sessionId, requestData) {
            return $http.post("api/sessions/" + sessionId + "/break-into-sessions", requestData);
        }
        function submitSessionFeedback(sessionId, memberId, userFeedback) {
            return $http.post("api/sessions/" + sessionId + "/member/" + memberId + "/feedback", userFeedback);
        }
        function setMemberActivation(memberId, isActive) {
            return $http.put("api/member/" + memberId + "/active/" + isActive);
        }
        function setAlbumActivation(albumId, isActive) {
            return $http.put("api/album/" + albumId + "/active/" + isActive);
        }
        function setMemberEmailSubscription(memberId, isActive) {
            return $http.put("api/member/" + memberId + "/email/" + isActive);
        }
        function toggleAlbumActive(albumId, isActive) {
            try {
                var apiCall = $http.put('api/admin/album/' + albumId + '/toggle-active/' + isActive);
                return apiCall;
            } catch (error) {
                throw error;
            }
        }
        function toggleCategoryActive(categoryId, isActive) {
            try {
                var apiCall = $http.put('api/admin/category/' + categoryId + '/toggle-active/' + isActive);
                return apiCall;
            } catch (error) {
                throw error;
            }
        }
        function toggleSessionActive(sessionId, isActive) {
            try {
                var apiCall = $http.put('api/admin/session/' + sessionId + '/toggle-active/' + isActive);
                return apiCall;
            } catch (error) {
                throw error;
            }
        }
        function getLatestSessionsForMember(memberId, count) {
            return $http.get("api/member/" + memberId + "/latest/" + count);
        }
        function notifyUsersOfSessionUpload(sessionId) {
            return $http.post("api/admin/session/" + sessionId + "/notify");
        }
        function resetProfilePic(memberId) {
            return $http.put("api/admin/resetProfilePic/" + memberId);
        }
        function getImagesForSession(sessionId) {
            return $http.get("api/sessions/" + sessionId + "/imageList");
        }

        // New registration methods
        function checkMemberEmailExists(email) {
            var uri = encodeURI('api/registration/check-email/' + email);
            
            // Explicitly skip authorization for this request
            return $http.get(uri, { skipAuthorization: true });
        }

        function getMemberDataForRegistration(email) {
            var uri = encodeURI('api/registration/member-data/' + email);
            
            // Explicitly skip authorization for this request
            return $http.get(uri, { skipAuthorization: true });
        }

        function completeRegistration(registrationData) {
            // Explicitly skip authorization for this request
            return $http.post('api/registration/complete', registrationData, { skipAuthorization: true });
        }

        function getAyatsWithTranslation(surahNumber, ayats) {
            return $http.get("api/quran/surah/" + surahNumber + "/ayats/" + ayats);
        }
        function getQuranAyatByToken(token) {
            var uri = encodeURI("api/quran/token/" + token);
            return $http.get(uri);
        }

        function getQuranAyatByEnglishToken(token) {
            var uri = encodeURI("api/quran/englishToken/" + token);
            return $http.get(uri);
        }

        function getAyatsAsHtml(surahNumber, ayats, isInline) {
            var uri = "api/quran/surah/" + surahNumber + "/ayats/" + ayats + "/html" + (isInline ? "-inline" : "");
            return $http.get(uri);
        }
        function getSalaamContent() {
            return $http.get("api/file/content/salaam");
        }
        function getRoots() {
            console.log('[DATACONTEXT] Fetching all roots...');
            console.log('[DATACONTEXT] 🔧 DEBUG: Using etymology API endpoint: api/etymology/roots');
            
            return $http.get("api/etymology/roots")
                .then(function(response) {
                    console.log('[DATACONTEXT] ✅ Roots retrieved successfully from etymology endpoint:', {
                        count: response.data ? response.data.length : 0,
                        sample: response.data ? response.data.slice(0, 3) : [],
                        endpoint: 'api/etymology/roots',
                        timestamp: new Date().toISOString()
                    });
                    return response;
                })
                .catch(function(error) {
                    console.error('❌ [DATACONTEXT] Failed to fetch roots from etymology endpoint:', error);
                    console.error('❌ [DATACONTEXT] Error details:', {
                        status: error.status,
                        statusText: error.statusText,
                        endpoint: 'api/etymology/roots',
                        timestamp: new Date().toISOString()
                    });
                    throw error;
                });
        }
        function getDerivativeById(id) {
            return $http.get("api/derivatives/id/" + id);
        }
        function getDerivativeByTransliteral(token) {
            return $http.get("api/derivatives/transliteral/" + token);
        }
        function getNarrators() {
            var uri = encodeURI("api/quran/narration/narrators");
            return $http.get(uri);
        }
        function getRootWithDerivatives(rootId) {
            console.log('[DATACONTEXT] Fetching root with derivatives for ID:', rootId);
            console.log('[DATACONTEXT] 🔧 DEBUG: Using etymology API endpoint: api/etymology/roots/' + rootId);
            
            return $http.get("api/etymology/roots/" + rootId)
                .then(function(response) {
                    console.log('[DATACONTEXT] ✅ Root with derivatives retrieved from etymology endpoint:', {
                        rootId: rootId,
                        rootTransliteration: response.data?.rootTransliteration,
                        derivativeCount: response.data?.derivatives?.length || 0,
                        endpoint: 'api/etymology/roots/' + rootId,
                        timestamp: new Date().toISOString()
                    });
                    return response;
                })
                .catch(function(error) {
                    console.error('❌ [DATACONTEXT] Failed to fetch root with derivatives:', error);
                    throw error;
                });
        }
        function getSurahList() {
            return $http.get("api/quran/surahs");
        }
        function saveDerivatives(rootId, derivatives) {
            console.log('[DATACONTEXT] Saving derivatives:', {
                rootId: rootId,
                derivativeCount: derivatives ? derivatives.length : 0,
                sampleDerivatives: derivatives && derivatives.length > 0 ? derivatives.slice(0, 2).map(function(d) {
                    return {
                        derivativeId: d.derivativeId,
                        transliteration: d.transliteration
                    };
                }) : [],
                timestamp: new Date().toISOString()
            });
            
            return $http.post("api/etymology/roots/" + rootId + "/derivatives/save", derivatives)
                .then(function(response) {
                    console.log('[DATACONTEXT] Derivatives saved successfully:', {
                        rootId: rootId,
                        savedCount: response.data?.length || 0,
                        timestamp: new Date().toISOString()
                    });
                    return response;
                })
                .catch(function(error) {
                    console.error('❌ [DATACONTEXT] Failed to save derivatives:', error);
                    throw error;
                });
        }
        function saveAhadees(ahadees) {
            // Cache bust: 2025-08-24-17:35 - Enhanced ahadees API endpoint
            return $http.post("api/ahadees/save", ahadees);
        }
        function getRecentAhadees(count) {
            // Get recent Ahadees using the new Ahadees API
            return $http.get("api/ahadees/recent/" + (count || 10));
        }
        function searchAhadees(criteria) {
            // Search Ahadees using the new Ahadees API
            return $http.post("api/ahadees/search", criteria);
        }
        function deleteAhadees(ahadeesId) {
            // Delete Ahadees using the new Ahadees API
            return $http.delete("api/ahadees/" + ahadeesId + "/delete");
        }
        function getAhadeesById(ahadeesId) {
            // Get Ahadees by ID using the new Ahadees API
            return $http.get("api/ahadees/" + ahadeesId);
        }
        function updateAyah(ayah) {
            return $http.post("api/quran/ayat/save", ayah);
        }

        function updateAyatTranslation(surahNumber, ayatNumber, translationText) {
            var data = {
                SurahNumber: surahNumber,
                AyatNumber: ayatNumber,
                TranslationText: translationText
            };
            return $http.post("api/quran/ayat/updateTranslation", data);
        }

        function deleteRoot(id) {
            console.log('[DATACONTEXT] Deleting root ID:', id);
            
            return $http.delete("api/etymology/roots/" + id + "/delete")
                .then(function(response) {
                    console.log('[DATACONTEXT] Root deleted successfully:', {
                        deletedRootId: id,
                        timestamp: new Date().toISOString()
                    });
                    return response;
                })
                .catch(function(error) {
                    console.error('❌ [DATACONTEXT] Failed to delete root:', error);
                    throw error;
                });
        }
        function deleteDenials() {
            return $http.delete("api/admin/deleteDenials");
        }
        function deleteDerivative(id) {
            console.log('[DATACONTEXT] Deleting derivative ID:', id);
            
            return $http.delete("api/etymology/derivatives/" + id + "/delete")
                .then(function(response) {
                    console.log('[DATACONTEXT] Derivative deleted successfully:', {
                        deletedDerivativeId: id,
                        timestamp: new Date().toISOString()
                    });
                    return response;
                })
                .catch(function(error) {
                    console.error('❌ [DATACONTEXT] Failed to delete derivative:', error);
                    throw error;
                });
        }
        function addUpdateRootWord(root) {
            console.log('[DATACONTEXT] Saving root word:', {
                rootId: root?.rootId || 'NEW',
                rootTransliteration: root?.rootTransliteration,
                isUpdate: (root?.rootId && root.rootId > 0),
                endpoint: 'api/etymology/roots/save',
                timestamp: new Date().toISOString()
            });
            
            return $http.post("api/etymology/roots/save", root)
                .then(function(response) {
                    console.log('[DATACONTEXT] ✅ Root word saved successfully via etymology endpoint:', {
                        savedRootId: response.data?.rootId,
                        rootTransliteration: response.data?.rootTransliteration,
                        endpoint: 'api/etymology/roots/save',
                        timestamp: new Date().toISOString()
                    });
                    return response;
                })
                .catch(function(error) {
                    console.error('❌ [DATACONTEXT] Failed to save root word:', error);
                    throw error;
                });
        }
        function saveHubPreloaderData(sessionId, json) {
            return $http.post("api/admin/hub/preloader", json);
        }
        function getHubProfileForSession(sessionId) {
            return $http.get("api/admin/hub/session/" + sessionId);
        }
        
        // Log API functions
        function getLogFiles() {
            return $http.get("api/logs");
        }
        
        function getLogContent(fileName) {
            return $http.get("api/logs/" + encodeURIComponent(fileName));
        }
        
        function getLiveSessionContent(sessionId) {
            return $http.get("api/logs/live-session/" + encodeURIComponent(sessionId));
        }
        
        function deleteLogFile(fileName) {
            return $http.delete("api/logs/" + encodeURIComponent(fileName));
        }
        
        function clearOldLogs() {
            return $http.delete("api/logs/clear-old");
        }
        
        function deleteAllLogs() {
            return $http.delete("api/logs/delete-all");
        }
        
        function getLogStats() {
            return $http.get("api/logs/stats");
        }

        // Production Deployment Functions
        function executeProductionDeployment(deploymentData) {
            return $http.post("api/admin/deploy/production", deploymentData);
        }

        function testProductionDeployment() {
            return $http.get("api/admin/deploy/test");
        }

        // Session Token Management Functions
        function getSessionTokens(sessionId) {
            var uri = 'api/admin/session/' + sessionId + '/tokens';
            return $http.get(uri);
        }

        function saveSessionTokens(sessionId, tokens) {
            var uri = 'api/admin/session/' + sessionId + '/tokens/save';
            var data = {
                sessionId: sessionId,
                tokens: tokens
            };
            return $http.post(uri, data);
        }

        function addSessionToken(sessionId, token) {
            var uri = 'api/admin/session/' + sessionId + '/tokens/add';
            var data = {
                sessionId: sessionId,
                token: token
            };
            return $http.post(uri, data);
        }

        function deleteSessionToken(tokenId) {
            var uri = 'api/admin/tokens/' + tokenId;
            return $http.delete(uri);
        }

        function deleteSessionTokens(sessionId) {
            var uri = 'api/admin/session/' + sessionId + '/tokens';
            return $http.delete(uri);
        }

        // ETYMOLOGY - Enhanced Islamic Linguistic System (Connected to KQUR_DEV Database)
        function searchEtymology(criteria) {
            console.log('[DATACONTEXT] 🔍 Searching etymology in KQUR_DEV database with criteria:', criteria);
            
            // Ensure default values for search criteria
            var searchCriteria = criteria || {};
            
            // Handle both lowercase and uppercase SearchTerm
            var searchTerm = searchCriteria.searchTerm || searchCriteria.SearchTerm || "";
            searchCriteria.SearchTerm = searchTerm;
            
            if (!searchCriteria.PageNumber) searchCriteria.PageNumber = searchCriteria.pageNumber || 1;
            if (!searchCriteria.PageSize) searchCriteria.PageSize = searchCriteria.pageSize || 20;
            if (!searchCriteria.SortBy) searchCriteria.SortBy = "LastModifiedDate";
            if (!searchCriteria.SortDirection) searchCriteria.SortDirection = "DESC";
            if (searchCriteria.IncludeDerivatives === undefined) searchCriteria.IncludeDerivatives = true;
            if (searchCriteria.ActiveOnly === undefined) searchCriteria.ActiveOnly = true;
            
            console.log('[DATACONTEXT] 📡 Final search criteria for KQUR_DEV database:', searchCriteria);
            
            var cacheBuster = new Date().getTime();
            var url = 'api/etymology/search?cacheBuster=' + cacheBuster;
            
            console.log('[DATACONTEXT] 🌐 Making POST request to etymology API (KQUR_DEV):', url);
            
            return $http.post(url, searchCriteria)
                .then(function(response) {
                    console.log('[DATACONTEXT] ✅ Etymology search successful from KQUR_DEV. Status:', response.status);
                    console.log('[DATACONTEXT] ✅ Etymology search response data:', response.data);
                    console.log('[DATACONTEXT] ✅ Results count:', (response.data && response.data.Results) ? response.data.Results.length : 0);
                    console.log('[DATACONTEXT] ✅ Total count:', (response.data && response.data.TotalCount) ? response.data.TotalCount : 0);
                    return response.data;
                })
                .catch(function(error) {
                    console.error('❌ [DATACONTEXT] Etymology search failed in KQUR_DEV database. Status:', error.status);
                    console.error('❌ [DATACONTEXT] Etymology search error data:', error.data);
                    console.error('❌ [DATACONTEXT] Full error object:', error);
                    throw error;
                });
        }

        function getEtymologyDerivatives(rootId) {
            console.log('[DATACONTEXT] Fetching derivatives for root ID:', rootId);
            
            if (!rootId) {
                console.error('[DATACONTEXT] Root ID is required for getting derivatives');
                return $q.reject('Root ID is required');
            }
            
            var cacheBuster = new Date().getTime();
            var url = 'api/etymology/roots/' + rootId + '/derivatives?cacheBuster=' + cacheBuster;
            
            console.log('[DATACONTEXT] Making GET request to:', url);
            
            return $http.get(url)
                .then(function(response) {
                    console.log('[DATACONTEXT] ✅ Derivatives retrieved successfully for root:', rootId, 'Status:', response.status);
                    console.log('[DATACONTEXT] ✅ Derivatives data:', response.data);
                    console.log('[DATACONTEXT] ✅ Derivatives count:', response.data ? response.data.length : 0);
                    return response.data;
                })
                .catch(function(error) {
                    console.error('❌ [DATACONTEXT] Get derivatives failed for root:', rootId, 'Status:', error.status);
                    console.error('❌ [DATACONTEXT] Derivatives error data:', error.data);
                    console.error('❌ [DATACONTEXT] Full error object:', error);
                    throw error;
                });
        }
    }
})();