(function () {
    "use strict";
    var controllerId = "topNavCtl";
    angular.module("app").controller(controllerId, ["$scope", "common", "config", "mediaportService", "datacontext", topNavCtl]);


    function topNavCtl($scope, common, config, mediaportService, dc) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;

        //Properties
        vm.mediaPort = mediaportService;
        vm.userImage = null;
        vm.cssRemoved = false;
        vm.isMobileBrowser = common.isMobileBrowser();

        // Environment Detection - Use config service for efficiency (no API calls needed)
        vm.isProductionEnvironment = config.isProduction;
        vm.isDevelopmentEnvironment = config.isLocalDevelopment;
        
        // Show development label only in non-production environments for admin users
        vm.displayEnv = vm.isDevelopmentEnvironment;
        
        // Allow admin menu in production for admin users (security through user role authentication)
        vm.showAdminMenu = true; // Admin access controlled by (g.member.isAdmin || g.member.canEdit) in template

        //Methods
        vm.gotoAlbums = gotoAlbums;
        vm.signOut = signOut;

        activate();
        function activate() {
            var promises = [];
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(result) {
                // Environment detection is now handled during initialization - no API call needed
                log("Activated topNav View - Environment: " + (vm.isProductionEnvironment ? "Production" : "Development"), 
                    controllerId, config.showDevToasts);
            }
        }

        //Internal Methods
        function gotoAlbums() {
            $scope.stateGo("albums", { memberId: $scope.g.member.id });
        }
        function signOut() {
            $scope.g.member.adminSimulationMode = false;
            $scope.stateGo("login");
        }

    }
})();