(function() {
    "use strict";
    var controllerId = "feedbackCtl";
    angular.module("app").controller(controllerId,
    ["$scope", "common", "config", "contentManager", feedbackCtl]);

    function feedbackCtl($scope, common, config, contentManager) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var urlAlbumId = $scope.$state.params.albumId;
        var urlSessionId = $scope.$state.params.sessionId;

        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;
        $scope.cm = contentManager; var cm = $scope.cm;

        //Properties
        vm.viewReady = false;

        //Methods
        vm.onFeedbackSubmit = onFeedbackSubmit;

        activateController();

        function activateController() {
            var promises = [];

            if (cm.currentSession.groupId !== Number(urlAlbumId)
                && cm.currentSession.id !== Number(urlSessionId)) {
            }
            common.activateController(promises, controllerId).then(onControllerActivation);

            function onControllerActivation(result) {
                vm.viewReady = true;
                log("Activated feedback View", controllerId, config.showDevToasts);
            }
        }

        //Watches


        //Internal Methods

        function onFeedbackSubmit(feedbackQuestions) {
            swal("Thank you", "Your feedback is very much appreciated!", "success");
            $scope.stateGo("album", { albumId: urlAlbumId });
        }

    }
})();