(function () {
    "use strict";

    angular
        .module("app")
        .run([
            "$rootScope", "$state", "$stateParams", "authService", "authManager", "common", "globalData", "Idle",
            function ($rootScope, $state, $stateParams, authService, authManager, common, gData, idle) {
                $rootScope.$state = $state;
                $rootScope.$stateParams = $stateParams;
                $rootScope.g = gData;
                $rootScope.setPageTitle = function (val) {
                    $state.current.data.pageTitle = val;
                    $state.current.data.adminTitle = "";
                    gData.navConfig.showFooter = Boolean(val);
                }
                $rootScope.setAdminPageTitle = function (val) {
                    gData.navConfig.adminTitle = val;
                    $state.current.data.pageTitle = "";
                    gData.navConfig.showFooter = false;
                }
                $rootScope.stateGo = function (stateName, params, opts) {
                    var localOpts = { location: false }
                    if (opts) {
                        localOpts = common.merge(opts, localOpts);
                    }
                    var targetState = $state.get(stateName);
                    if (targetState.name !== "404") {
                        var targetMode = targetState.data.viewMode;
                        gData.navConfig.showHeader = (targetMode !== "manage");
                        gData.navConfig.showFooter = (targetMode !== "manage");
                    }
                    $state.go(stateName, params, localOpts);
                }

                angular.isNullOrUndefined = function (val) {
                    return angular.isUndefined(val) || val === null;
                }
                common.prototypeTimeFormat();

                // Put the authService on $rootScope so its methods can be accessed from the nav bar
                $rootScope.authService = authService;

                // Register the authentication listener that is set up in auth.service.js
                authService.registerAuthenticationListener();

                // Use the authManager from angular-jwt to check for
                // the user's authentication state when the page is
                // refreshed and maintain authentication
                authManager.checkAuthOnRefresh();

                // Listen for 401 unauthorized requests and redirect
                // the user to the login page
                authManager.redirectWhenUnauthenticated();

                // start watching when the app runs. also starts the Keepalive service by default.
                idle.watch();
            }]);
})();