(function () {
    "use strict";
    var controllerId = "adminLoginCtl";
    angular.module("app").controller(controllerId,
    ["$scope", "common", "config", "datacontext", adminLoginCtl]);

    function adminLoginCtl($scope, common, config, datacontext) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");
        var originalMember = angular.copy($scope.g.member);
        var simulationMemberId = $scope.$state.params.memberId || 0;
        $scope.vm = {}; var vm = $scope.vm;

        //Properties
        vm.members = [];
        vm.ready = false;
        vm.search = "";

        //Methods
        vm.loginAsMember = loginAsMember;

        if ($scope.g.member) {
            activate();
        }
        

        function activate() {
            var promises = [datacontext.getAllMembersWithEmails()];
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(result) {
                vm.members = angular.copy(result[0].data);
                if (simulationMemberId) {
                    var m = common.findById(vm.members, "id", simulationMemberId);
                    if (m) {
                        loginAsMember(m);
                    }
                }
                vm.viewReady = true;
                log("Activated adminLogin View", controllerId, config.showDevToasts);
            }
        }

        //Internal Methods

        function loginAsMember(member) {
            var isSimulation = true;

            datacontext.getMemberIdByEmail(member.emailAddress, isSimulation).then(function (response) {
                var memberAcl = response.data;
                member = response.data;
                member.isAdmin = false;
                member.isAuthenticated = true;
                member.isAuthorized = true;
                member.hasAccess = true;
                member.adminSimulationMode = true;
                $scope.g.member = member;


                $scope.g.resetAdmin = function () {
                    originalMember.adminSimulationMode = false;
                    $scope.g.member = originalMember;
                    //$scope.$state.current.data.pageTitle="";
                    $scope.stateGo("admin.login");
                }

                $scope.stateGo("albums");
            });
        }

    }

})();