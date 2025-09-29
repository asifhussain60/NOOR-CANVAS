(function () {
    "use strict";
    var controllerId = "sandBoxCtl";
    angular.module("app").controller(controllerId,
    ["$scope", "common", "config", "froalaConfig", "datacontext", sandBoxCtl]);

    function sandBoxCtl($scope, common, config, froalaConfig, datacontext) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;
        $scope.g.navConfig.applicationTitle = "TITLE";

        //Properties
        vm.datacontextResponse = {};
        vm.viewReady = false;

        //Custom

        //Methods


        activateController();

        function activateController() {
            var promises = [];
            common.activateController(promises, controllerId).then(onControllerActivation);

            function onControllerActivation(result) {
                vm.viewReady = true;
                common.loadjscssfile([
                    "/Content/styles/sessions/css/ksessions.css",
                    "/Content/styles/sessions/css/quran.css"
                ]);

                log("Activated sandBox View", controllerId, config.showDevToasts);

            }
        }

        //Watches


        //Internal Methods


    }
})();