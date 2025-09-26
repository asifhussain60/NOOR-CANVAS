(function () {
    "use strict";
    var controllerId = "manageDashboardCtl";
    angular.module("app").controller(controllerId,
		["$scope", "bootstrap.dialog", "common", "config", "datacontext", manageDashboardCtl]);

    function manageDashboardCtl($scope, dlg, common, config, datacontext) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;

        //Properties
        vm.auditDays = 7;
        vm.auditLogs = [];
        vm.dashboardCounts = null;

        //Methods
        vm.deleteAuditLog = deleteAuditLog;

        if ($scope.g.member) { activate(); }


        function activate() {
            var promises = [
                datacontext.getAuditData(vm.auditDays),
                datacontext.getAuditDenials(vm.auditDays),
                datacontext.getDashboardCounts()
            ];
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(response) {
                vm.auditLogs = response[0].data;
                vm.auditDenials = response[1].data;
                vm.dashboardCounts = response[2].data;

                log("Activated Admin Dashboard View", controllerId, config.showDevToasts);
            }
        };

        $scope.$watch("vm.auditDays", function (newDays, oldDays) {
            if (newDays && !angular.equals(newDays, oldDays)) {
                datacontext.getAuditData(newDays).then(function (response) {
                    vm.auditLogs = response.data;
                });

            }
        }, false);


        //Internal Methods

        function deleteAuditLog(log) {
            dlg.deleteDialog("album", "").then(function (result) {
                if (result === "ok") {
                    datacontext.deleteAuditLogEntry(log).then(function (response) {
                        vm.auditLogs = common.withoutItem(vm.auditLogs, { memberName: log.memberName });
                        logSuccess("Deleted " + response.data + " audit log entries", controllerId);
                    });
                }
            });

        }
    }
})();