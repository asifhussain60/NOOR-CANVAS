(function() {
    "use strict";
    var controllerId = "adminRootsCtl";
    angular.module("app").controller(controllerId,
    ["$scope", "common", "config", "datacontext", adminRootsCtl]);

    function adminRootsCtl($scope, common, config, datacontext) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {};
        var vm = $scope.vm;

        vm.datacontextResponse = {};
        vm.viewReady = false;

        activateController();

        function activateController() {
            var promises = [];
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(result) {
                vm.viewReady = true;
                log("Activated adminRoots View", controllerId, config.showDevToasts);
            }
        }

        //Watches


        //Internal Methods


    }
})();