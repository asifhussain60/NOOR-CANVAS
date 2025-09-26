(function () {
    "use strict";
    var controllerId = "hubCtl";
    angular.module("app").controller(controllerId,
    ["$scope", "$sce", "common", "config", "contentManager", "froalaConfig", "hubService", hubCtl]);

    function hubCtl($scope, $sce, common, config, contentManager, froalaConfig, hubService) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");
        var iosSleepPreventInterval = null;

        $scope.vm = {}; var vm = $scope.vm;
        vm.cm = contentManager;
        hubService.initialize($scope);

        //Shortcuts
        var cc = hubService.cc;
        vm.clientMode = "";
        vm.hub = hubService;
        vm.sce = $sce;
        vm.signal = vm.hub.signalR;

        //Properties
        vm.displayIsUserTyping = false;
        vm.typeaheadOptions = newTypeaheadOptions();
        vm.sessionGuid = $scope.$stateParams.sessionGuid;
        vm.viewReady = false;


        //Methods
        vm.onFeedbackSubmit = onFeedbackSubmit;
        vm.onTypeaheadSelect = onTypeaheadSelect;

        activateController();
        function activateController() {
            var promises = [];
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(result) {
                if (hubService.isClient) {
                    common.loadStylesDynamically($scope.$state.$current.self);
                    $scope.g.navConfig.showFooter = false;
                    hubService.session.guid = vm.sessionGuid;
                }
                common.loadjscssfile(["/Content/styles/sessions/css/hub.css"]);
                $scope.g.navConfig.showFooter = false;
                vm.viewReady = true;
                log("Activated hub View", controllerId, config.showDevToasts);
            }
        }

        //Watches
        $scope.$watch("vm.hub.user.username", function (username, oldResult) {
            if (!username) {
                vm.typeaheadOptions = newTypeaheadOptions();
            }
        }, false);

        $scope.$watch("vm.typeaheadOptions.noResult", function (noResult, oldResult) {
            vm.typeaheadOptions.displayError = noResult && vm.hub.user.username;
        }, false);

        $scope.$watch("vm.hub.signalR.message", function (newConnMessage, oldConnMessage) {
            if (!angular.equals(newConnMessage, oldConnMessage)) {
                if (vm.hub.isClient && newConnMessage === "Connected") {
                    common.$timeout(function () {
                        hubService.keepAwakeIfiosDevice();
                        verifyClientGuid();
                    }, 500);
                }
            }
        }, false);

        $scope.$watch("vm.hub.session.name", function (newSessionName, oldSessionName) {
            if (newSessionName && !angular.equals(newSessionName, oldSessionName)) {
                $scope.$state.current.data.pageTitle = newSessionName;
            }
        }, false);

        $scope.$on("$destroy", function () {
            $scope.g.navConfig.showFooter = true;
            common.removejscssfile(["/Content/styles/sessions/css/hub.css"]);
        });

        $scope.$watch("vm.hub.host.isTyping", function (newUsername) {
            if (newUsername) {
                vm.displayIsUserTyping = true;
                common.$timeout(function () {
                    vm.displayIsUserTyping = false;
                    vm.hub.host.isTyping = "";
                }, 1500);
            }
        }, false);


        //Internal Methods

        function newTypeaheadOptions() {
            return {
                isOpen: false,
                noResult: true,
                okToRegister: false,
                displayError: false
            };
        }

        function onTypeaheadSelect($item, $model, $label) {
            if ($item && $item.Id) {
                vm.hub.user.username = $item.FullName;
                vm.hub.user.nickname = $item.NickName;
                vm.hub.user.id = $item.Id;
                vm.typeaheadOptions.okToRegister = Boolean(vm.hub.user.id);
                vm.hub.registerUser();
            } else {
                vm.typeaheadOptions.displayError = true;
                vm.typeaheadOptions.okToRegister = false;
            }
        };

        function verifyClientGuid() {
            if (!vm.sessionGuid || vm.hub.session.hasEnded) {
                vm.hub.clientMode = cc.noaccess;
                localStorage.removeItem("hubRegistration");
                vm.hub.signalR.connection.stop();
                return;
            } else {
                hubService.verifySessionGuid(vm.sessionGuid).then(function (response) {
                    var sd = response.sessionData;
                    var pub = sd.PublishedContent;
                    var isVerified = response.isVerified;
                    if (!isVerified) {
                        vm.hub.clientDisplay = "";
                        vm.hub.clientMode = cc.noaccess;
                        vm.hub.signalR.connection.stop();
                        return;
                    }
                    //If feedback mode, disply form
                    if (hubService.isFeedbackMode(pub) && isCacheValid()) {
                        hubService.setClientDisplay(pub);
                        return;
                    }
                    //If not valid cache, setup initial display
                    if (!isCacheValid()) {
                        if (vm.hub.user.isRegistered) {
                            vm.hub.clientMode = sd.IsSessionOpen ? cc.ready : cc.sessionInfo;
                        } else {
                            vm.hub.clientMode = cc.register;
                        }
                    }
                });
            }
        }

        function onFeedbackSubmit(result) {
            vm.hub.submitFeedback(result);
        }


        function isCacheValid() {
            var hubCache = common.getStorage("hubRegistration");
            if (!hubCache) { return false; }

            //convert milliseconds to minutes
            var diffInMinutes = (Date.now() - Number(hubCache.time)) / 60000;
            var cacheMinutes = vm.hub.cacheMinutes;

            if (hubCache.user && hubCache.guid && diffInMinutes < cacheMinutes) {
                vm.hub.user.username = hubCache.user;
                vm.hub.registerUser();
                return true;
            }
            localStorage.removeItem("hubRegistration");
            return false;
        }



        $scope.$on("$destroy", function () {
            hubService.allowIosDeviceToSleep();
        });
    }
})();