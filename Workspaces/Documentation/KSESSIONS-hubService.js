(function () {
    "use strict";

    var serviceId = "hubService";

    angular.module("app").factory(serviceId, ["$document", "$sce", "common", "datacontext", "mediaportService", hubService]);

    function hubService($document, $sce, common, datacontext, mps) {

        var $CtlScope = null;
        var cc = -1;
        //var resetPromise;
        //30 seconds
        //var interfaceResetTime = 600000; //10 minutes
        var hubSessionCacheMinutes = 20;
        var iosSleepPreventInterval = null;
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(serviceId);
        var logSuccess = getLogFn(serviceId, "success");
        var logError = getLogFn(serviceId, "error");


        // Define the functions and properties to reveal.
        var service = {
            //Properties
            cc: {
                noaccess: "noaccess",
                register: "register",
                sessionClosed: "session-closed",
                resetting: "resetting",
                ready: "ready",
                sessionInfo: "session-info",
                hubReset: "hub-reset",
                feedback: "session-feedback",
                cmBlank: "",
                //Client Display Controllers
                cmImage: "client-image",
                cmQuran: "client-quran",
                cmRoot: "client-root",
                cmSalaam: "client-salaam",
                cmVote: "client-vote",
                cmUserQuestion: "client-user-question",
                cmWordCompare: "client-word-compare"
            },
            cacheMinutes: hubSessionCacheMinutes,
            clientMode: "",                 //controls display of outer divs
            clientDisplay: "",              //controls inner divs where content is being pushed
            dingalert: null,
            fImageHub: getFormObject,
            fUserFeedback: getUserFeedbackObject,
            host: newHostObject(),
            isHost: false,
            isClient: false,
            session: newSessionObject,
            signalR: getSignalrObject(),
            user: newUserObject(),

            //Methods
            allowIosDeviceToSleep: allowIosDeviceToSleep,
            clearQuranList: clearQuranList,
            closeSession: closeSession,
            establishConnection: establishConnection,
            generateSessionGuid: generateSessionGuid,
            initialize: initialize,
            isFeedbackMode: isFeedbackMode,
            keepAwakeIfiosDevice: keepAwakeIfiosDevice,
            openSession: openSession,
            postUserQuestion: postUserQuestion,
            pushToClientImage: pushToClientImage,
            pushToClientQuranAyats: pushToClientQuranAyats,
            pushToClientReset: pushToClientReset,
            pushToClientRoots: pushToClientRoots,
            pushToClientSalaam: pushToClientSalaam,
            pushToClientUserQuestion: pushToClientUserQuestion,
            pushToClientWordCompare: pushToClientWordCompare,
            pushToClientQuranHighlight: pushToClientQuranHighlight,
            pushToClientWordCompareHighlight:pushToClientWordCompareHighlight,
            pushToClientVoteAgenda: pushToClientVoteAgenda,
            registerUser: registerUser,
            resetClientInterface: resetClientInterface,
            resetHub: resetHub,
            respondToUserQuestion: respondToUserQuestion,
            setClientDisplay: setClientDisplay,
            submitFeedback: submitFeedback,
            userIsTypeing: userIsTypeing,
            verifySessionGuid: verifySessionGuid,
            voteClick: voteClick
        };

        //shortcuts
        cc = service.cc;
        return service;



        //#region SignalR Methods        

        function resetHub() {
            if (service.signalR.connection.id) {
                service.signalR.proxy.invoke("resetHub", service.signalR.connection.id);
            }
        }

        function establishConnection() {
            service.signalR.connection = $.hubConnection();
            var conn = service.signalR.connection;
            service.signalR.proxy = conn.createHubProxy("imageHub");
            conn.logging = true;
            service.signalR.proxy.on("onInitialized", function (sessionData) {
                if (service.isClient) { return; }
                loadSessionDataValues(sessionData);
                // Initialized values on server
            });

            registerSignalrCallbacks();
            startSignalrConnection(false, true);

            function startSignalrConnection(autoRegisterUser, initializeHub) {
                return conn.start().done(function () {
                    updateConnectionStatusMsg();
                    loadMemberListOnClient();
                    if (service.isHost && initializeHub) {
                        service.signalR.proxy.invoke("initializeServerHub", service.signalR.connection.id);
                        service.signalR.proxy.on("existingSessionData", function (sessionData) {
                            getHubPreloaderData(sessionData.SessionId);
                        });
                    }
                    service.user.signalrClientId = service.signalR.connection.id;
                    if (autoRegisterUser) { registerUser(); }
                    service.dingalert = document.getElementById("ding-alert");
                    digest();
                });
            }
            conn.disconnected(function () {
                updateConnectionStatusMsg();
                if (isOkToReconnect()) {
                    service.signalR.message = "Reconnecting...";
                    common.$timeout(function () {
                        startSignalrConnection(true);
                    }, 2500); // Restart connection after 2.5 seconds.
                }
            });
            conn.reconnected(function () {
                updateConnectionStatusMsg();
                registerUser();
                digest();
            });
            conn.reconnecting(function () {
                service.signalR.message = "Reconnecting...";
                digest();
            });
            conn.error(function (err) {
                // Connection error occurred - handle gracefully
            });
            function loadMemberListOnClient() {
                if (!service.isClient || service.user.memberList.length) { return; }
                service.signalR.proxy.invoke("getMemberList");
                service.signalR.proxy.on("memberList", function (memberList) {
                    service.user.memberList = memberList;
                });
            }
            function updateConnectionStatusMsg() {
                if (service.signalR.connection && service.signalR.connection.id) {
                    service.signalR.message = "Connected";
                } else {
                    service.signalR.message = "Disconnected";
                }
            }
            function isOkToReconnect() {
                return service.isHost ||
                    (service.clientMode !== cc.sessionClosed
                        && service.clientMode !== cc.hubReset
                        && service.clientMode !== cc.noaccess
                    );
            }
            function loadSessionDataValues(data) {
                service.fImageHub.albumId = data.AlbumId;
                service.fImageHub.sessionId = data.SessionId;
                service.fImageHub.clientUrl = guidValue(data.Guid) ? window.location.href + "share/" + data.Guid : "";
                service.fImageHub.sessionName = data.SessionName;

                service.session.sessionId = data.SessionId;
                service.session.name = data.SessionName;
                service.session.isOpen = data.IsSessionOpen;
                service.session.guid = guidValue(data.Guid);
                service.host.registeredUsers = data.RegisteredUserList;
                digest();
            }
            function guidValue(guid) {
                return guid.replace("00000000-0000-0000-0000-000000000000", "");
            }
        }


        function registerSignalrCallbacks() {

            service.signalR.proxy.on("currentServerTick", function (tick) {
                // Server tick received
            });

            //BOTH: Session open notification received...
            service.signalR.proxy.on("sessionOpened", function (sessionData) {
                service.session.hubSessionDataId = sessionData.HubSessionDataId;
                service.session.startTimer = 0;
                service.session.isOpen = sessionData.IsSessionOpen;
                service.session.sessionId = sessionData.SessionId;
                service.session.name = sessionData.SessionName;
                service.fImageHub.albumId = sessionData.AlbumId;
                service.fImageHub.sessionId = sessionData.SessionId;
                if (service.isClient && service.user.isRegistered) {
                    service.clientMode = cc.ready;
                    ding();
                }
                digest();
            });

            //HOST: Posting user vote result
            service.signalR.proxy.on("voteResult", function (username, voteValue) {
                if (!service.isHost) { return; }
                switch (voteValue) {
                    case -1:
                        service.host.electionResult.totals.down += 1;
                        log(username + " voted: NO", serviceId);
                        break;
                    case 1:
                        service.host.electionResult.totals.up += 1;
                        logSuccess(username + " voted: YES", serviceId);
                        break;
                    default:
                }
                digest();
            });


            //HOST: When user list along with questions are received
            service.signalR.proxy.on("registrationList", function (userList) {
                if (!service.isHost) { return; }
                //update registered user list
                service.host.registeredUsers = userList;
                service.host.questions = [];
                //Process each users questions
                _.each(userList, function (item) {
                    if (item.Questions.length) {
                        _.each(item.Questions, function (q) {
                            service.host.questions.push({
                                guid: q.Guid, user: item.UserName, question: q.Question,
                                time: q.Time, isAnswered: q.IsAnswered
                            });
                        });
                    }
                });
                digest();
            });

            //BOTH: Receiving ack for question and saving it locally...
            service.signalR.proxy.on("questionReceived", function (qGuid, username, question, time) {
                if (!common.findByKey(service.user.questionList, "guid", qGuid)) {
                    service.user.questionList.push({
                        guid: qGuid,
                        question: question,
                        time: time,
                        isAnswered: false,
                        user: username
                    });
                    digest();
                }
            });

            //CLIENT: Receives response from host...
            service.signalR.proxy.on("receiveQuestionResponse", function (qGuid, question, responseType) {
                if (service.isHost) { return; }
                question = "Your Question: " + question.first(90) + (question.length > 90 ? "..." : "");
                var q = common.findByKey(service.user.questionList, "guid", qGuid);
                if (q) { q.isAnswered = true; }
                var responseMessage = "";
                switch (Number(responseType)) {
                    case 1:
                        responseMessage = "Were you satisfied with the answer? If not, please send me a followup question.";
                        break;
                    case 2:
                        responseMessage = "I have made a note of your question. InshaAllah I will answer it in one of the future sessions.";
                        break;
                    case 3:
                        responseMessage = "Your question may not be related to the current topic. Let's discuss it after the session.";
                        break; default:
                }
                ding();
                swal(responseMessage, question);
                //cancelResetTimer();
                digest();
            });

            //BOTH: Session close is received...
            service.signalR.proxy.on("sessionClosed", function () {
                if (service.isClient) {
                    service.clientDisplay = "";
                } else {
                    service.fImageHub = getFormObject();
                    service.host.showFeedbackResult = true;
                    service.host.userFeedbacks = [];
                }
                service.session.guid = "";
                service.session.isOpen = false;
                digest();
            });



            //HOST: Receive user feedback
            service.signalR.proxy.on("viewUserFeedback", function (user) {
                if (!service.isHost) { return; }
                user.reponseTime = new Date().getTime();
                service.host.userFeedbacks.push(user);
                //Calculate aggregate score
                var sumScore = 0;
                _.each(service.host.userFeedbacks, function (item) {
                    sumScore += item.FeedbackScorePercent;
                });
                var aggregateScore = (sumScore / (service.host.userFeedbacks.length * 100)) * 100;
                service.host.feedbackAggScore = aggregateScore;
                ding();
                digest();
                scrollToElement("hostFeedback");
            });

            //BOTH: End user session
            service.signalR.proxy.on("endUserSession", function () {

                service.session.guid = "";
                service.session.isOpen = false;

                if (service.isHost) {
                    service.fImageHub = getFormObject();
                    service.host.showFeedbackResult = true;
                    service.host.userFeedbacks = [];
                } else {
                    service.clientDisplay = "";
                    service.clientMode = cc.sessionClosed;
                    service.session.hasEnded = true;
                    common.$timeout(function () { service.signalR.connection.stop(); }, 1000);
                }
                localStorage.removeItem("hubRegistration");
                digest();
            });

            //CLIENT: Receive image from server
            service.signalR.proxy.on("publishToClient", function (pub) {
                if (cancelPublish(pub)) { return; }
                setClientDisplay(pub);
                //resetTimer();
                digest();
            });

            //BOTH: Receive token to hightlight Quran
            service.signalR.proxy.on("highlightQuranToken", function (token) {
                var ayahList = service.user.published.quran;
                if (ayahList.length === 0) { return; }
                var surah = ayahList.reverse()[0];
                ayahList.reverse();
                _.each(surah.Ayats, function (a) {
                    a.AyatUnicode = getHighlightedSpan(a.AyatUnicode, token);
                });
                if (service.isClient) { ding(); }
                digest();
            });

            //Client: Receive token to hightlight WordCompare
            service.signalR.proxy.on("highlightWordCompareToken", function (token) {
                if (service.isHost) { return; }
                var wc = service.user.published.wordsCompare;
                if (!wc || wc.length === 0) { return; }
                wc[0] = getHighlightedSpan(wc[0], token);
                if (service.isClient) { ding(); }
                digest();
            });

            function getHighlightedSpan(textHtml, token) {
                textHtml = textHtml.toString().replace("<span class='ayah-hub-highlight'>", "");
                textHtml = textHtml.toString().replace("</span>", "");
                textHtml = textHtml.toString().replace(token, "<span class='ayah-hub-highlight'>" + token + "</span>");
                return $sce.trustAsHtml(textHtml);
            }

            function cancelPublish(pub) {
                return pub.CurrentClientDisplayMode !== cc.cmQuran
                    && pub.CurrentClientDisplayMode !== cc.feedback
                    && !service.isClient;
            }

            //CLIENT: Receive Hub reset from server
            service.signalR.proxy.on("initializeClientDueToHubReset", function () {
                if (!service.isClient) { return; }
                service.clientMode = cc.hubReset;
                service.clientDisplay = "";

                service.fImageHub = getFormObject;
                service.host = newHostObject();
                service.session = newSessionObject();
                service.user = newUserObject();
                service.signalR.connection.stop();
                service.signalR = getSignalrObject();
                digest();
            });

            //CLIENT: Receive interface reset from server
            service.signalR.proxy.on("resetClientInterface", function () {
                resetClientInterface();
            });

            //HOST: Receive User is Typing message
            service.signalR.proxy.on("sayWhoIsTyping", function (username) {
                if (!service.isHost) { return; }
                service.host.isTyping = username;
                digest();
            });
        }

        function resetClientInterface() {
            if (!service.isClient) { return; }
            service.clientMode = cc.ready;
            service.clientDisplay = "";
            service.user.reset();
            digest();

        }


        function generateSessionGuid(albumId, sessionId, sessionName, startTime) {
            //HOST: Generate new sessionGuid for session...
            if (!service.isHost || !albumId || !sessionId) { return; }
            var promises = [
                datacontext.getSessionById(sessionId),
                datacontext.getSummariesForPreviousSession(albumId, sessionId),
            ];
            common.$q.all(promises).then(onSuccess);

            function onSuccess(response) {
                if (response.length === 0) { return; }
                var session = response[0].data;
                var summaries = response[1].data;

                service.signalR.proxy.invoke("generateGuidForSession",
                    service.signalR.connection.id, session, startTime, summaries).done(function () {
                        // Generate GUID for session succeeded
                    }).fail(function (error) {
                        // Generate GUID for session failed - handle gracefully
                    });
            }
            //HOST: Receiving session Guid
            service.signalR.proxy.on("generatedSessionGuid",
                function (hubSessionDataId, albumId, sessionId, name, guid) {
                    service.session.hubSessionDataId = hubSessionDataId;
                    service.session.albumId = albumId;
                    service.session.sessionId = sessionId;
                    service.session.name = name;
                    service.session.guid = guid;
                    service.session.isOpen = false;
                    service.fImageHub.clientUrl = window.location.href + "share/" + guid;
                    getHubPreloaderData(sessionId);
                    digest();
                });
        }

        function submitFeedback(result) {
            //CLIENT: Submit feedback to host
            service.signalR.proxy.invoke("submitFeedback", service.user.username, result.feedback, result.score).done(function () {
                // Submit feedback succeeded
            }).fail(function (error) {
                // Submit feedback failed - handle gracefully
            });
        }

        function openSession() {
            //HOST: Generate new sessionGuid and open session...
            service.signalR.proxy.invoke("openSession").done(function () {
                // Open session succeeded
            }).fail(function (error) {
                // Open session failed - handle gracefully
            });
        }

        function closeSession() {
            //HOST: Closes session...
            service.signalR.proxy.invoke("closeSession").done(function () {
                // Close session succeeded
            }).fail(function (error) {
                // Close session failed - handle gracefully
            });
        }

        function voteClick(val) {
            service.signalR.proxy.invoke("submitVoteResult", service.user.username, val).done(function () {
                // Vote submission succeeded
                service.clientMode = cc.ready;
                service.clientDisplay = "";
                digest();
            }).fail(function (error) {
                // Vote submission failed - handle gracefully
            });

        }

        function verifySessionGuid(guid) {
            //CLIENT: Verify sessionGuid is valid...
            if (!service.isClient) { return null; }
            var deferred = common.$q.defer();
            service.signalR.proxy.invoke("verifySessionGuid", guid).done(function () {
                // Session GUID verification succeeded
            }).fail(function (error) {
                // Session GUID verification failed - handle gracefully
            });
            //CLIENT: Notified of verification status
            service.signalR.proxy.on("sessionGuidVerificationStatus", function (isVerified, sessionData) {
                var status = {
                    isVerified: isVerified,
                    sessionData: sessionData
                }
                deferred.resolve(status);
            });
            return deferred.promise;
        }

        function userIsTypeing() {
            service.signalR.proxy.invoke("IsTyping", service.user.username);
        }

        function getHubPreloaderData(sessionId) {
            datacontext.getHubProfileForSession(sessionId).then(function (response) {
                if (!response.data) return;
                service.host.preloader = angular.copy(response.data);
            });
        }

        function registerUser() {
            //CLIENT: User registers manually or programmatically (after disconnect)...
            if (!service.isClient) { return; }
            service.user.memberList = [];
            if (service.user.username.compact().toLowerCase() === "host") {
                swal({
                    title: "I pray the day soon comes when you host these sessions. But let me be your host today :)",
                    showConfirmButton: true
                });
                service.user.username = "";
                return;
            }
            service.user.username = service.user.username.compact().capitalize();
            service.signalR.proxy.invoke("registerUser",
                service.user.signalrClientId, service.user.username, service.user.questionList).done(function () {
                    //Retrieve user information from local storage
                    var hubReg = common.getStorage("hubRegistration");
                    if (hubReg) {
                        hubReg.time = Date.now();
                        service.user.id = hubReg.userId;
                        service.user.username = hubReg.user;
                        service.user.nickname = hubReg.nickname;
                        common.setStorage(hubReg);
                    } else {
                        //Save user info in local storage
                        common.setStorage("hubRegistration", {
                            userId: service.user.id,
                            user: service.user.username,
                            nickname: service.user.nickname || service.user.username,
                            guid: service.session.guid,
                            time: Date.now()
                        });
                    }
                    //console.log("Invocation of registerUser succeeded");
                }).fail(function (error) {
                    // Register user failed - handle gracefully
                });

            //CLIENT: Registration information is received...
            service.signalR.proxy.on("registrationStatus", function (sessionData, timer) {
                var pub = sessionData.PublishedContent;
                timer = Math.floor(timer);
                if (timer < 0) { timer = timer * -1; }
                service.session.startTimer = timer;
                service.user.isRegistered = true;
                service.session.sessionId = sessionData.SessionId;
                service.session.name = sessionData.SessionName;
                service.session.description = sessionData.SessionDescription;
                service.session.previousSummary = sessionData.PreviousSummary;
                service.session.isOpen = sessionData.IsSessionOpen;
                setClientDisplay(pub);
                if (!isFeedbackMode(pub)) {
                    service.clientMode = sessionData.IsSessionOpen ? cc.ready : cc.sessionInfo;
                }
                digest();
            });
        }

        function isFeedbackMode(pub) {
            return pub && pub.CurrentClientDisplayMode === cc.feedback && pub.Feedback.length;
        }


        function setClientDisplay(pub) {
            if (!pub) { return; }
            switch (pub.CurrentClientDisplayMode) {
                case cc.cmBlank:
                    service.clientMode = cc.ready;
                    service.clientDisplay = "";
                    break;
                case cc.cmSalaam:
                    service.user.published.salaam = pub.Salaam;
                    scrollToElement("clientSalaam");
                    break;
                case cc.cmImage:
                    service.user.published.images = pub.Images;
                    scrollToElement("clientImage");
                    break;
                case cc.cmQuran:
                    _.each(pub.QuranVerses, function (q) {
                        _.each(q.Ayats, function (a) {
                            a.AyatUnicode = $sce.trustAsHtml(a.AyatUnicode);
                        });
                    });
                    service.user.published.quran = pub.QuranVerses;
                    scrollToElement("clientQuran");
                    break;
                case cc.cmUserQuestion:
                    service.user.published.question = pub.MemberQuestion;
                    scrollToElement("clientUserQuestion");
                    break;
                case cc.cmVote:
                    service.user.published.vote = pub.VoteAgenda;
                    scrollToElement("clientVoteAgenda");
                    break;
                case cc.cmWordCompare:
                    service.user.published.wordsCompare = pub.WordsCompare;
                    service.user.published.isNarration = pub.IsNarration;
                    scrollToElement("clientWordsCompare");
                    break;
                case cc.feedback:
                    service.clientMode = cc.feedback;
                    scrollToElement("userFeedback");
                    break;
                case cc.cmRoot:
                    service.user.published.root = pub.Root;
                    if (pub.Root) {
                        common.$timeout(function () {
                            $("#rootCurved").show().arctext({ radius: 160 });
                        }, 120);
                        scrollToElement("clientRootWord");
                    }
                    break;
                default:
            }
            if (pub.CurrentClientDisplayMode === cc.ready) {
                service.clientDisplay = "";
            } else {
                service.clientDisplay = pub.CurrentClientDisplayMode || "";
                ding();
            }
        }

        function postUserQuestion(question) {
            //BOTH: Posts quesitons to host...
            if (!service.user.question && !question) { return null };

            var questionToPublish = question || service.user.question || "";
            var hostDeferred = common.$q.defer();
            service.signalR.proxy.invoke("postUserQuestion", service.user.username, questionToPublish).done(function () {
                //console.log("Invocation of postUserQuestion succeeded");
            }).fail(function (error) {
                // Post user question failed - handle gracefully
            });
            service.user.question = "";
            hostDeferred.resolve("completedPost");

            if (service.isClient) {
                swal({
                    title: "Your question has been sent...",
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            return hostDeferred.promise;
        }

        function respondToUserQuestion(q, responseType) {
            //HOST: Responding to user's question...
            service.signalR.proxy.invoke("respondToUserQuestion", q.guid, q.user, q.question, responseType).done(function () {
                // Respond to user question succeeded
            }).fail(function (error) {
                // Respond to user question failed - handle gracefully
            });
        }

        function clearQuranList() {
            service.signalR.proxy.invoke("clearQuranList").done(function () {
                //console.log("Invocation of clearQuranList succeeded");
            }).fail(function (error) {
                // Clear Quran list failed - handle gracefully
            });
        }

        function pushToClientImage(imageUri) {
            service.clientDisplay = cc.cmImage;
            service.signalR.proxy.invoke("publishImage", imageUri).done(function () {
                //console.log("Invocation of publishImage succeeded");
            }).fail(function (error) {
                // Publish image failed - handle gracefully
            });
        }

        function pushToClientQuranAyats(surah) {
            service.clientDisplay = cc.cmQuran;
            service.signalR.proxy.invoke("publishQuranAyats", surah).done(function () {
                //console.log("Invocation of publishQuranAyats succeeded");
            }).fail(function (error) {
                // Publish Quran Ayats failed - handle gracefully
            });
        }

        function pushToClientSalaam(salaam) {
            service.clientDisplay = "";
            service.signalR.proxy.invoke("publishSalaam", salaam).done(function () {
                //console.log("Invocation of publishSalaam succeeded");
            }).fail(function (error) {
                // Publish Salaam failed - handle gracefully
            });
        }

        function pushToClientUserQuestion(question) {
            service.clientDisplay = "";
            service.signalR.proxy.invoke("publishUserQuestion", question).done(function () {
                //console.log("Invocation of publishUserQuestion succeeded");
            }).fail(function (error) {
                // Publish user question failed - handle gracefully
            });
        }

        function pushToClientWordCompare(word1, word2, isNarration) {
            service.clientDisplay = "";
            service.signalR.proxy.invoke("publishWordComparison", word1, word2, isNarration).done(function () {
                //console.log("Invocation of publishWordComparison succeeded");
            }).fail(function (error) {
                // Publish word comparison failed - handle gracefully
            });
        }

        function pushToClientQuranHighlight(token) {
            service.signalR.proxy.invoke("publishQuranHighlight", token).done(function () {
                //console.log("Invocation of pushToClientQuranHighlight succeeded");
            }).fail(function (error) {
                // Push to client Quran highlight failed - handle gracefully
            });
        }
        //
        function pushToClientWordCompareHighlight(token) {
            service.signalR.proxy.invoke("publishWordCompareHighlight", token).done(function () {
                //console.log("Invocation of pushToClientQuranHighlight succeeded");
            }).fail(function (error) {
                // Push to client word compare highlight failed - handle gracefully
            });
        }

        function pushToClientVoteAgenda(vote) {
            service.host.electionResult.agenda = vote;
            service.host.electionResult.totals.up = 0;
            service.host.electionResult.totals.down = 0;
            service.clientDisplay = "";
            service.signalR.proxy.invoke("publishVoteAgenda", vote).done(function () {
            }).fail(function (error) {
                // Push to client vote agenda failed - handle gracefully
            });
        }

        function pushToClientReset() {
            //HOST: Send reset command to client
            service.clientDisplay = "";
            service.signalR.proxy.invoke("publishResetForClient").done(function () {
                //console.log("Invocation of publishResetForClient succeeded");
            }).fail(function (error) {
                // Publish reset for client failed - handle gracefully
            });
        }

        function pushToClientRoots(root) {
            service.clientDisplay = "";
            service.signalR.proxy.invoke("publishRootWord", root).done(function () {
                //console.log("Invocation of publishRootWord succeeded");
            }).fail(function (error) {
                // Publish root word failed - handle gracefully
            });
        }


        //#endregion


        //#region Internal Methods   

        function digest() {
            $CtlScope.$apply();
        }

        function keepAwakeIfiosDevice() {
            if (!mps.isAppleDevice()) { return; }
            iosSleepPreventInterval = setInterval(function () {
                window.location.href = "/new/page";
                window.setTimeout(function () {
                    window.stop();
                }, 0);
            }, 30000);
        }

        function allowIosDeviceToSleep() {
            if (mps.isAppleDevice()) {
                window.clearTimeout(iosSleepPreventInterval);
            }
        }

        function ding() {
            if (service.isHost) { return; }
            var dingalert = document.getElementById("ding-alert");
            if (dingalert) { dingalert.play(); }
        }

        function initialize(controllerScope) {
            $CtlScope = controllerScope;
            resetObjects();
            service.isHost = !angular.isNullOrUndefined($CtlScope.g.member) && $CtlScope.g.member.isAdmin;
            service.isClient = !service.isHost;

            if (service.isHost) {
                service.user.username = "HOST";
                service.host.showFeedbackResult = false;
                service.host.userFeedbacks = [];
                beginPulse();
            }
            establishConnection();
        }

        function beginPulse() {
            common.$interval(function () {
                service.signalR.proxy.invoke("keepAlive").done(function () {
                    // Pulse check sent to server successfully
                }).fail(function (error) {
                    // Keep alive pulse failed - handle gracefully
                });
            }, 15000);
        }

        function resetObjects() {
            service.user = newUserObject();
            service.session = newSessionObject();
            service.host = newHostObject();
            service.fImageHub = getFormObject();
            service.clientDisplay = "";
            service.clientMode = "";
        }

        function scrollToElement(itemId) {
            if (!service.isClient) { return; }
            var offset = 10;
            common.$timeout(function () {
                var titleElement = angular.element(document.getElementById(itemId));
                if (titleElement.length) {
                    $document.scrollToElement(titleElement, offset, 1000);
                }
            }, 750);
        }

        //#endregion


        //#region Helper Methods

        //Host
        function newHostObject() {
            return {
                registeredUsers: [],
                questions: [],
                hostQuestion: "",
                preloader: [],
                userFeedbacks: [],
                electionResult: {
                    agenda: null,
                    totals: {
                        up: 0,
                        down: 0
                    }
                },
                showFeedbackResult: false
            };
        }
        //Session
        function newSessionObject() {
            return {
                hubSessionDataId: -1,
                name: "Resource Share",
                guid: "",
                isOpen: false,
                noAccess: false,
                hasEnded: false
            };
        }
        //User
        function newUserObject() {
            return {
                username: "",
                isRegistered: false,
                memberList: [],
                signalrClientId: null,
                question: "",           //used in host view
                questionList: [],
                published: {
                    question: "",
                    feedback: [],
                    images: [],
                    salaam: "",
                    quran: [],
                    vote: ""
                },
                reset: function () {
                    this.images = [];
                    this.question = ""; //used in client view
                    this.questionList = [];
                    this.published.salaam = "";
                    this.published.vote = "";
                    this.published.quran = [];
                }
            };
        }
        //SignalR
        function getSignalrObject() {
            return {
                connection: null,
                message: "",
                proxy: null,
                disconnect: function () { this.connection.stop(); }
            };
        }
        //Form
        function getFormObject() {
            return {
                albumId: -1,
                sessionId: -1,
                sesionStartTime: "4",
                sessionName: "",
                clientUrl: ""
            };
        }
        //Feedback
        function getUserFeedbackObject() {
            return {

            }
        }

        //#endregion
    }
})();