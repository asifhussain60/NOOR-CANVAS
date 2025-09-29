(function () {
    "use strict";
    var controllerId = "adminMemberAccessCtl";
    angular.module("app").controller(controllerId,
    ["$scope", "common", "config", "contentManager", "datacontext", adminMemberAccessCtl]);

    function adminMemberAccessCtl($scope, common, config, contentManager, datacontext) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;

        //Properties
        vm.allMembers = [];
        vm.albums = [];
        vm.viewReady = true;
        vm.flags = { showSubmitSpinner: false };
        vm.allMembers = contentManager.memberList;
        //Methods
        vm.albumToggleCheckMark = albumToggleCheckMark;
        vm.displaySessions = displaySessions;
        vm.toggleSessionAccess = toggleSessionAccess;
        vm.submit = submit;



        //Watchers

        $scope.$watch("vm.fMember.memberId", function (newMemberId, oldMemberId) {
            if (newMemberId && !angular.equals(newMemberId, oldMemberId)) {
                datacontext.getAllGroupsSessionsWithAccess(newMemberId).then(function (response) {
                    vm.albums = response.data;
                    vm.currentAlbumSessions = vm.albums[0].sessions;
                    vm.albums[0].isSelected = true;
                });
            }
        }, false);


        //Internal Methods

        function albumToggleCheckMark(album) {
            album.hasAccess = !album.hasAccess;
            _.each(album.sessions, function (session) {
                session.hasAccess = album.hasAccess;
            });
        }


        function displaySessions(album) {
            vm.currentAlbumSessions = album.sessions;
            _.each(vm.albums, function (a) {
                a.isSelected = a.id === album.id;
            });
        }

        function toggleSessionAccess(session) {
            session.hasAccess = !session.hasAccess;
            setParentStatus(session.groupId);
        }

        function setParentStatus(albumId) {
            var album = _.find(vm.albums, function (i) { return i.id === albumId; });
            album.hasAccess = _.find(album.sessions, function (item) {
                return item.hasAccess === true;
            });

        }

        function submit() {
            var memberId = vm.fMember.memberId;
            vm.flags.showSubmitSpinner = true;
            var submitData = _.where(vm.albums, { hasAccess: true });
            datacontext.updateAlbumAccessForMember(memberId, submitData).then(onSuccess, onFailure);

            function onSuccess(response) {
                vm.flags.showSubmitSpinner = false;
                logSuccess("Successfully added " + response.data + " records", controllerId);
            }
            function onFailure(errorResponse) {
                vm.flags.showSubmitSpinner = false;
                logError(errorResponse, controllerId, config.showDevToasts);
            }
        }

    }
})();