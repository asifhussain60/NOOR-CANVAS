(function () {
    "use strict";
    var controllerId = "imageHubCtl";
    angular.module("app").controller(controllerId,
    ["$scope", "$document", "common", "config", "froalaConfig", "contentManager", "datacontext", "quranService", imageHubCtl]);

    function imageHubCtl($scope, $document, common, config, froalaConfig, contentManager, datacontext, quranService) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");
        var signalrConnection = null;
        var imageHubProxy = null;


        $scope.vm = {}; var vm = $scope.vm;
        vm.cm = contentManager;

        //Properties
        vm.currentSession = null;
        vm.froalaOptions = froalaConfig.fEditorSimpleOptions(onEditorInit);
        vm.sessionOpen = false;
        vm.sessionEnd = false;
        vm.viewReady = false;
        vm.signalRConnectionId = "null";
        vm.isHost = isHost();
        vm.isQuestionCollapsed = true;
        vm.imageList = [];
        vm.questions = [];
        vm.hostControls = {
            arabicText: "",
            lastArabicText: ""
        }
        vm.registeredUsers = [];
        vm.signalConnectionStatus = "";
        vm.user = {
            username: "",
            isRegistered: false,
            signalrClientId: null,
            image: "",
            question: "",
            questionList: [],
            quran: null,
            reset: function () {
                this.username = "";
                this.isRegistered = false;
                this.image = "";
                this.question = "";
                this.questionList = [];
            }
        }
        vm.fImageHub = {
            albumId: -1,
            sessionId: -1
        }
        vm.tabs = {
            manager: true,
            questions: false,
            showTab: function (id) {
                this.manager = id === "manager";
                this.questions = id === "questions";
            }
        }

        //Methods
        vm.closeSession = closeSession;
        vm.cancelQuestion = cancelQuestion;
        vm.initializeHub = initializeHub;
        vm.openSessionAndLoadContent = openSessionAndLoadContent;
        vm.publishImage = publishImage;
        vm.registerUser = registerUser;
        vm.postQuestion = postQuestionToAdmin;
        vm.questionResponse = questionResponse;
        vm.questionClick = questionClick;
        vm.arabicTextPasted = arabicTextPasted;
        vm.getQuranAyats = getQuranAyats;

        //Signal-R

        activateSignalrConnection();
        activateController();


        function activateSignalrConnection() {
            signalrConnection = $.hubConnection();
            imageHubProxy = signalrConnection.createHubProxy("imageHub");
            signalrConnection.logging = true;
            imageHubProxy.on("doNothing", function () { console.log("do nothing"); });
            signalrConnection.start().done(function () {
                assignConnectionIdToUser(signalrConnection.id);
                registerSignalrClientCallMethods();
                $scope.$apply();
                if (vm.isHost) {
                    vm.initializeHub();
                }
                return common.$q.when(signalrConnection.id);
            });
            signalrConnection.disconnected(function () {
                assignConnectionIdToUser("Disconnected");
                if (!vm.sessionEnd) {
                    common.$timeout(function () {
                        signalrConnection.start().done(function () {
                            assignConnectionIdToUser(signalrConnection.id);
                            registerUser();
                            $scope.$apply();
                            return common.$q.when(signalrConnection.id);
                        });
                    }, 2000); // Restart connection after 5 seconds.
                }
            });
            signalrConnection.reconnected(function () {
                setConnectionStatus("Connected");
                registerUser();
                $scope.$apply();
            });
            signalrConnection.reconnecting(function () {
                setConnectionStatus("Reconnecting...");
                $scope.$apply();
            });
            signalrConnection.error(function (err) {
                console.error("An error has occurred: " + err);
            });
            function assignConnectionIdToUser(signalrConnectionId) {
                vm.signalRConnectionId = signalrConnectionId;
                vm.user.signalrClientId = vm.signalRConnectionId;
                if (signalrConnection.id) {
                    setConnectionStatus("Connected");
                } else {
                    setConnectionStatus("Disconnected");
                }
            }
        }

        function activateController() {
            var promises = [];
            if (vm.isHost) {
                promises.push(datacontext.getAlbumList());
            }
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(result) {
                if (!vm.isHost) {
                    common.loadStylesDynamically($scope.$state.$current.self);
                    $scope.g.navConfig.showFooter = false;
                    $scope.g.navConfig.applicationTitle = config.applicationTitle;
                    $scope.$state.current.data.pageTitle = "Image Publisher";
                }
                vm.viewReady = true;
                log("Activated imageHub View", controllerId, config.showDevToasts);
                common.$timeout(function () { $("#userToRegister").focus(); }, 1000);
            }
        }

        //watches

        $scope.$watch("vm.fImageHub.albumId", function (newAlbumId, oldAlbumId) {
            if (newAlbumId && !angular.equals(newAlbumId, oldAlbumId)) {
                var isAdmin = -1;
                contentManager.setAlbumById(newAlbumId);
                contentManager.getSessionsForAlbum(newAlbumId, isAdmin);
                vm.fImageHub.albumId = newAlbumId;
            }
        }, false);
        $scope.$watch("vm.fImageHub.sessionId", function (newSessionId, oldSessionId) {
            if (!newSessionId || angular.equals(newSessionId, oldSessionId)) { return; }
            vm.fImageHub.sessionId = newSessionId;
        }, false);


        /*
         * *****************************************************************************
         * 
         *                          SIGNALR
         *                          CLIENT METHODS
         * 
         * * *****************************************************************************
         */
        function registerSignalrClientCallMethods() {
            imageHubProxy.on("hubInitalized", function () {
                vm.sessionOpen = false;
                vm.imageList = [];
                vm.questions = [];
                log("All server and client hub variables have been initialized", controllerId);
                $scope.$apply();
            });
            imageHubProxy.on("registrationStatus", function (isSessionOpen, sessionName) {
                vm.sessionOpen = isSessionOpen;
                vm.user.isRegistered = true;
                if (sessionName) {
                    $scope.$state.current.data.pageTitle = sessionName;
                }
                $scope.$apply();
            });
            imageHubProxy.on("registrationList", function (userList) {
                if (vm.isHost) {
                    vm.registeredUsers = userList;
                    vm.questions = [];
                    _.each(userList, function (item) {
                        if (item.Questions.length) {
                            _.each(item.Questions, function (q) {
                                if (!q.IsAnswered) {
                                    vm.questions.push({
                                        guid: q.Guid,
                                        user: item.UserName,
                                        question: q.Question,
                                        time: q.Time,
                                        isAnswered: q.IsAnswered
                                    });
                                }
                            });
                        }
                    });
                }
                $scope.$apply();
            });
            imageHubProxy.on("sessionClosed", function (isSessionOpen) {
                vm.sessionEnd = true;
                signalrConnection.stop();
                vm.signalRConnectionId = null;
                vm.sessionOpen = isSessionOpen;
                resetClientView();
                $scope.$apply();
                console.log("Client: Session Closed");
            });
            imageHubProxy.on("sessionOpened", function (sessionName) {
                $scope.$state.current.data.pageTitle = sessionName;
                vm.sessionOpen = true;
                $scope.$apply();
                console.log("Client: Session Opened");
            });
            imageHubProxy.on("publishedImage", function (imageUri) {
                vm.user.image = imageUri;
                vm.user.arabicText = "";
                vm.user.quran = null;
                vm.hostControls.surahNumber = ""; vm.hostControls.ayatNumbers = "";
                if (!vm.isHost) { scrollToElement("clientImage"); }
                $scope.$apply();
                console.log("Client: publishImage called");
            });
            imageHubProxy.on("publishedArabicText", function (arabicText) {
                vm.user.arabicText = arabicText;
                vm.user.image = "";
                vm.user.quran = null;
                unselectImages();
                vm.hostControls.surahNumber = ""; vm.hostControls.ayatNumbers = "";
                if (!vm.isHost) { scrollToElement("clientArabicText"); }
                $scope.$apply();
                console.log("Client: publishedArabicText called");
            });
            imageHubProxy.on("publishedQuranAyats", function (ayats, translations, surah) {
                vm.user.quran = surah;
                vm.user.quran.ayats = ayats;
                vm.user.quran.translations = translations;
                vm.user.arabicText = "";
                vm.user.image = "";
                unselectImages();
                if (!vm.isHost) { scrollToElement("clientQuran"); }
                $scope.$apply();
                console.log("Client: publishImage called");
            });
            imageHubProxy.on("questionReceived", function (qGuid, username, question, time) {
                if (!vm.isHost) {
                    //maintain a list of client questions
                    vm.user.questionList.push({
                        guid: qGuid,
                        question: question,
                        time: time,
                        isAnswered: false
                    });
                } else {
                    var msg = username + " asks:<br/>" + question;
                    log(msg, controllerId);
                }
                $scope.$apply();
            });
            imageHubProxy.on("questionResponse", function (qGuid, question, responseType) {
                if (vm.isHost) { return; }
                question = "Your Question: " + question.first(90) + (question.length > 90 ? "..." : "");
                var q = common.findByKey(vm.user.questionList, "guid", qGuid);
                if (q) { q.isAnswered = true; }
                var responseMessage = "";
                switch (Number(responseType)) {
                    case 1:
                        responseMessage = "Were you satisfied with the answer? If not, please send me a followup question.";
                        break;
                    case 1:
                        responseMessage = "I have made a note of your question. InshaAllah I will answer it in one of the future sessions.";
                        break;
                    default:
                }
                swal(responseMessage, question);
                $scope.$apply();
                console.log("Client: questionResponse called");
            });
        };


        /*
         * *****************************************************************************
         * 
         *                          INTERNAL METHODS
         * 
         * 
         * * *****************************************************************************
         */

        function setConnectionStatus(status) {
            vm.signalConnectionStatus = status;
        }

        function isHost() {
            return !angular.isNullOrUndefined($scope.g.member) && $scope.g.member.isAdmin;
        }

        function onEditorInit(e, editor) {
            editor.opts.placeholderText = "Ask a question anonymously";
            editor.opts.multiLine = false;
        }

        function resetClientView() {
            vm.sessionOpen = false;
            vm.imageList = [];
            vm.questions = [];
            vm.registeredUsers = [];
            vm.user.reset();
        }

        function openSessionAndLoadContent() {
            var session = common.findById(vm.cm.currentAlbum.sessions, "id", vm.fImageHub.sessionId);
            var imagePrimed = [];
            if (session) {
                datacontext.getImagesForSession(vm.fImageHub.sessionId).then(function (response) {
                    if (response.data) {
                        _.each(response.data, function (item) {
                            imagePrimed.push({ selected: false, imageUri: item });
                        });
                    }
                    vm.imageList = imagePrimed;
                    imageHubProxy.invoke("openSession", vm.signalRConnectionId, session.id, session.name).done(function () {
                        console.log("Invocation of openSession succeeded");
                    }).fail(function (error) {
                        console.error("Invocation of openSession failed. Error: " + error);
                    });
                });
            }
        }
        function registerUser() {
            if (vm.user.username) {
                vm.user.username = vm.user.username.compact().capitalize();
                imageHubProxy.invoke("registerUser", vm.user.signalrClientId, vm.user.username, vm.user.questionList).done(function () {
                    console.log("Invocation of registerUser succeeded");
                }).fail(function (error) {
                    console.error("Invocation of registerUser failed. Error: " + error);
                });
            }
        }
        function closeSession() {
            vm.sessionOpen = false;
            vm.imageList = [];
            vm.user.reset();

            imageHubProxy.invoke("closeSession").done(function () {
                console.log("Invocation of closeSession succeeded");
            }).fail(function (error) {
                console.error("Invocation of closeSession failed. Error: " + error);
            });

        }

        function unselectImages() {
            _.each(vm.imageList, function (item) {
                item.selected = false;
            });
        }

        function publishImage(img) {
            _.each(vm.imageList, function (item) {
                if (item.imageUri !== img.imageUri) {
                    item.selected = false;
                }
            });
            img.selected = !img.selected;
            if (img.selected) {
                invokeServerPublishImage(img.imageUri);
            } else {
                invokeServerPublishImage("");
            }
        }
        function initializeHub() {
            imageHubProxy.invoke("initialize").done(function () {
                console.log("Invocation of initialize succeeded");
            }).fail(function (error) {
                console.error("Invocation of initialize failed. Error: " + error);
            });
        }

        function invokeServerPublishImage(imageUri) {
            imageHubProxy.invoke("publishImage", imageUri).done(function () {
                console.log("Invocation of publishImage succeeded");
            }).fail(function (error) {
                console.error("Invocation of publishImage failed. Error: " + error);
            });
        }

        function postQuestionToAdmin() {
            if (!vm.user.question) { return };

            imageHubProxy.invoke("postUserQuestion", vm.user.username, vm.user.question).done(function () {
                console.log("Invocation of postUserQuestion succeeded");
            }).fail(function (error) {
                console.error("Invocation of postUserQuestion failed. Error: " + error);
            });
            vm.user.question = "";
            vm.isQuestionCollapsed = true;
            swal({
                title: "Your question has been sent...",
                timer: 1500,
                showConfirmButton: false
            });
        }

        function questionResponse(q, responseType) {
            imageHubProxy.invoke("sendQuestionSatisfaction", q.guid, q.user, q.question, responseType).done(function () {
                console.log("Invocation of sendQuestionSatisfaction succeeded");
            }).fail(function (error) {
                console.error("Invocation of sendQuestionSatisfaction failed. Error: " + error);
            });
        }

        function questionClick() {
            vm.isQuestionCollapsed = !vm.isQuestionCollapsed;
            if (vm.isQuestionCollapsed) { return; }
            common.$timeout(function () {
                $(".fr-element").focus();
            }, 1000);
        }
        function cancelQuestion() {
            vm.isQuestionCollapsed = true;
            vm.user.question = "";
        }

        //HELPERS

        $scope.simulateDisconnect = function () {
            signalrConnection.stop();
        }

        function scrollToElement(itemId) {
            var offset = 10;
            common.$timeout(function () {
                var titleElement = angular.element(document.getElementById(itemId));
                if (titleElement) {
                    $document.scrollToElement(titleElement, offset, 1000);
                }
            }, 750);
        }
        function arabicTextPasted() {
            vm.user.arabicText = angular.copy(vm.hostControls.arabicText);
            vm.hostControls.lastArabicText = angular.copy(vm.hostControls.arabicText);
            vm.hostControls.arabicText = "";
            imageHubProxy.invoke("publishArabicText", vm.user.arabicText).done(function () {
                console.log("Invocation of publishArabicText succeeded");
            }).fail(function (error) {
                console.error("Invocation of publishArabicText failed. Error: " + error);
            });
        }

        function getQuranAyats() {
            var surahNumber = vm.hostControls.surahNumber;
            var ayatNumbers = vm.hostControls.ayatNumbers;
            if (!surahNumber || !ayatNumbers) return null;

            return quranService.getAyatsWithTranslation(surahNumber, ayatNumbers).then(function (surah) {
                imageHubProxy.invoke("publishQuranAyats", surah.mergedAyats, surah.mergedTranslations, surah).done(function () {
                    console.log("Invocation of publishQuranAyats succeeded");
                }).fail(function (error) {
                    console.error("Invocation of publishQuranAyats failed. Error: " + error);
                });
            });
        }


    }



})();