(function () {
    "use strict";
    var controllerId = "adminSearchCtl";
    angular.module("app").controller(controllerId,
        ["$scope", "mediaportService", "auditService", "common", "config", "contentManager", "globalData", adminSearchCtl]);

    function adminSearchCtl($scope, mps, auditService, common, config, contentManager, gdata) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");
        var memberId = $scope.g.member.id;
        var guid = $scope.g.member.sessionGuid;

        $scope.vm = {}; var vm = $scope.vm; vm.mediaPort = mps;

        activate();

        function activate() {
            common.activateController(promises, controllerId).then(onControllerActivation);

            function onControllerActivation(response) {
            }
        }
    }
})();