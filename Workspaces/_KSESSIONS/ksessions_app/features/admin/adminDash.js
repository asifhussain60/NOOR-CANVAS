(function () {
    "use strict";
    var controllerId = "adminDashCtl";
    angular.module("app").controller(controllerId,
        ["$scope", "bootstrap.dialog", "common", "config", "datacontext", adminDashCtl]);

    function adminDashCtl($scope, dlg, common, config, datacontext) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;

        vm.auditDays = 7;
        vm.auditLogs = [];

        vm.deleteAuditLog = deleteAuditLog;
        vm.resetProfilePic = resetProfilePic;
        vm.refreshData = refreshData;
        vm.removeDenials = removeDenials;
        vm.showSpinner = true;

        activate();

        function activate() {
            var promises = [
                datacontext.getAuditDenials(vm.auditDays)
            ];
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(response) {
                vm.auditDenials = response[0].data;
                loadData();
                common.$interval(function () {
                    vm.showSpinner = true;
                    loadData();
                }, config.auditRefreshInterval);
                log("Activated Admin Dashboard View", controllerId, config.showDevToasts);
            }
        };

        $scope.$watch("vm.auditDays", function (newDays, oldDays) {
            if (newDays && !angular.equals(newDays, oldDays)) {
                loadData(newDays);
            }
        }, false);

        function loadData(daysToLoad) {
            daysToLoad = daysToLoad || vm.auditDays;
            datacontext.getAuditData(daysToLoad).then(function (response) {
                vm.showSpinner = false;
                var showData = sizeChange() || memberChange();
                log("Audit data loaded with showData=" + showData, controllerId, config.showDevToasts);

                if (showData) {
                    vm.auditLogs = response.data;
                }
                // Helper Functions
                function sizeChange() {
                    return response.data.length !== vm.auditLogs.length;
                }
                function memberChange() {
                    return response.data.length
                        && response.data[0].memberId !== vm.auditLogs[0].memberId;
                }
            });
        }

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

        function refreshData() {
            vm.auditLogs = [];
            loadData();
        }

        function removeDenials() {
            dlg.confirmationDialog("Delete Denials", "Are you sure you want to delete?", "Yes", "No").then(function (result) {
                if (result === "ok") {
                    datacontext.deleteDenials().then(function (response) {
                        vm.auditDenials = [];
                    });
                }
            });
        }

        function resetProfilePic(log) {
            dlg.confirmationDialog("Reset Profile", "Are you sure you want to reset the profile picture for this user?", "Yes", "No").then(function (result) {
                if (result === "ok") {
                    datacontext.resetProfilePic(log.memberId).then(function (response) {
                        log.pictureUrl = response.data;
                    });
                }
            });
        }
    }
})();