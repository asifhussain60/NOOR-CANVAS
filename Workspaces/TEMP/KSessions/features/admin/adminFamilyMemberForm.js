(function () {
    "use strict";
    var controllerId = "adminFamilyMemberCtl";
    angular.module("app").controller(controllerId,
        ["$scope", "common", "config", "contentManager", adminFamilyMemberCtl]);

    function adminFamilyMemberCtl($scope, common, config, contentManager) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");
        var urlMemberId = $scope.$state.params.memberId;

        $scope.vm = {};
        var vm = $scope.vm;

        vm.cm = contentManager;
        vm.datacontextResponse = {};
        vm.member = null;
        vm.viewReady = false;

        activateController();

        function activateController() {
            var promises = [];

            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(result) {
                if (vm.cm.memberList && vm.cm.memberList.length) {
                    vm.member = common.findById(vm.cm.memberList, "id", urlMemberId);
                }
                log("Activated adminFamilyMember View", controllerId, config.showDevToasts);
                vm.viewReady = true;
            }
        }

    }
})();