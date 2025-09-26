(function () {
    "use strict";
    /*******************************************************************************************
     *
     *      CONTROLLER FOR shell.html
     *
     *******************************************************************************************/
    var controllerId = 'shell';
    angular.module('app').controller(controllerId, ['$rootScope', '$scope', 'common', 'config', 'datacontext', 'globalData', 'mediaportService', 'Idle', shell]);

    function shell($rootScope, $scope, common, config, dc, gData, mediaportService, Idle) {
        $scope.vm = {}; var vm = $scope.vm;

        var logSuccess = common.logger.getLogFn(controllerId, 'success');
        var events = config.events;
        vm.busyMessage = 'Please wait ...';
        vm.isBusy = true;
        vm.spinnerOptions = {
            radius: 40,
            lines: 7,
            length: 0,
            width: 30,
            speed: 1.7,
            corners: 1.0,
            trail: 100,
            color: '#F58A00'
        };

        activate();

        function activate(event) {
            if (!gData || !gData.member) {
                return;
            }
            logSuccess('Hot Towel Angular loaded!', null, true);
            common.activateController([], controllerId);
        }

        function toggleSpinner(on) {
            vm.isBusy = on;
        }

        $rootScope.$on('IdleTimeout', function () {
            // the user has timed out (meaning idleDuration + timeout has passed without any activity)
            // this is where you'd log them
            $rootScope.stateGo("login");
        });

        function loadStylesDynamically(toState) {
            common.loadStylesDynamically(toState);
        }

        $rootScope.$on('$stateChangeStart',
            function (event, toState, toParams, fromState, fromParams) {
                if (toState.name === '404' || toState.name === 'login') { return; }

                console.log("DEBUG: [AUTHENTICATION] Route change detected", {
                    fromState: fromState ? fromState.name : 'none',
                    toState: toState.name,
                    toStateData: toState.data,
                    gData: {
                        isAuthenticated: gData.isAuthenticated,
                        member: gData.member,
                        memberId: gData.memberId
                    },
                    timestamp: new Date().toISOString()
                });

                toggleSpinner(true);
                loadStylesDynamically(toState);

                var isAuthenticated = false;
                if (!angular.isNullOrUndefined(toState.data) && !angular.isNullOrUndefined(toState.data.requiresLogin)) {
                    isAuthenticated = (!toState.data.requiresLogin || (toState.data.requiresLogin && gData.isAuthenticated));
                    console.log("DEBUG: [AUTHENTICATION] Authentication check result", {
                        requiresLogin: toState.data.requiresLogin,
                        userIsAuthenticated: gData.isAuthenticated,
                        calculatedIsAuthenticated: isAuthenticated,
                        logicExplanation: !toState.data.requiresLogin ? 'Route does not require login' : 
                                         (toState.data.requiresLogin && gData.isAuthenticated) ? 'Route requires login and user is authenticated' :
                                         'Route requires login but user is not authenticated'
                    });
                }
                var isAuthorized = (!angular.isNullOrUndefined(gData.member) || (!toState.data || !toState.data.requiresLogin));
                
                console.log("DEBUG: [AUTHORIZATION] Authorization check result", {
                    hasMember: !angular.isNullOrUndefined(gData.member),
                    requiresLogin: toState.data ? toState.data.requiresLogin : 'undefined (no data object)',
                    calculatedIsAuthorized: isAuthorized,
                    finalDecision: (isAuthenticated && isAuthorized) ? 'ALLOW ACCESS' : 'REDIRECT TO LOGIN',
                    authenticationStatus: isAuthenticated,
                    authorizationStatus: isAuthorized
                });

                if (isAuthenticated && isAuthorized) {
                    console.log("DEBUG: [AUTHENTICATION] Access granted to route", toState.name);
                    setViewTitle(toState);
                } else {
                    console.log("DEBUG: [AUTHENTICATION] Access denied, redirecting to login", {
                        reason: !isAuthenticated ? 'Not authenticated' : 'Not authorized',
                        isAuthenticated: isAuthenticated,
                        isAuthorized: isAuthorized,
                        toState: toState.name
                    });
                    event.preventDefault();
                    $rootScope.stateGo('login');
                }
            }

        );
        function setViewTitle(toState) {
            if (toState.data.pageTitle) {
                $rootScope.setPageTitle(toState.data.pageTitle);
            }
            if (toState.data.adminTitle) {
                $rootScope.setAdminPageTitle(toState.data.adminTitle);
            }
        }

        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            toggleSpinner(false);
        });

        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            toggleSpinner(false);
        });

        $rootScope.$on(events.controllerActivateSuccess, function (data) {
            toggleSpinner(false);
        });

        $rootScope.$on(events.spinnerToggle, function (data) {
            toggleSpinner(data.show);
        });
    };
})();