(function () {
    "use strict";

    angular.module("app").directive("zuHubAlbumSessionSelect", ["common", "contentManager", "hubService", zuHubAlbumSessionSelect]);

    function zuHubAlbumSessionSelect(common, contentManager, hubService) {

        /***************************************************************************************
        * Usage:
        *      
        * Description:
        *      
        * Gotcha(s): 
        *      
        * 
        ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: true,
            templateUrl: "/app/features/hub/directives/zuHubAlbumSessionSelect.html",
            scope: true
        };
        return directive;

        function link(scope, element, attrs, controller) {
            scope.cm = contentManager;
            scope.cm.getAllAlbums();
            scope.hs = hubService;
            scope.buttonCaption = "Open";

            //This is important to declare even if not used
            var clipboard = new Clipboard("#btn-copy");
            clipboard.on("success", function (e) {
                common.$timeout(function () { e.clearSelection(); }, 500);
            });

            scope.generateSessionGuid = function () {
                var fhub = scope.hs.fImageHub;
                scope.hs.host.userFeedbacks = [];
                scope.hs.host.showFeedbackResult = false;

                if (!scope.hs.session.isOpen) {
                    if (!fhub.sessionName || !fhub.sessionId) return;
                    hubService.generateSessionGuid(fhub.albumId, fhub.sessionId, fhub.sessionName, fhub.sesionStartTime);
                } else {
                    hubService.closeSession(fhub.sessionId, fhub.sessionName);
                }
            };

            scope.openCloseHubSession = function () {
                if (!scope.hs.session.isOpen) {
                    hubService.openSession();
                } else {
                    hubService.closeSession();
                }
            };

            scope.$watch("hs.session.isOpen", function (newIsOpen, oldIsOpen) {
                scope.buttonCaption = Boolean(newIsOpen) ? "Close" : "Open";
            }, false);



            scope.onAlbumSelect = function (albumId) {
                scope.hs.fImageHub.albumId = albumId;
            }

            scope.onSessionSelect = function (sessionId, categoryId) {
                var session = getSession(sessionId);
                //being initialized for the first time
                scope.hs.fImageHub.sessionId = sessionId;
                scope.hs.fImageHub.sessionName = session.name;

            }

            //scope.$watch("hs.fImageHub.albumId", function (newAlbumId, oldAlbumId) {
            //    if (newAlbumId && !angular.equals(newAlbumId, oldAlbumId)) {
            //        var isAdmin = -1;
            //        scope.cm.setAlbumById(newAlbumId);
            //        scope.cm.getSessionsForAlbum(newAlbumId, isAdmin);
            //        scope.hs.fImageHub.albumId = newAlbumId;
            //    }
            //}, false);

            //scope.$watch("hs.fImageHub.sessionId", function (newSessionId, oldSessionId) {
            //    if (newSessionId <= 0 || angular.equals(newSessionId, oldSessionId)) { return; }
            //    if (!scope.hs.fImageHub.clientUrl) {
            //        scope.cm.setCurrentSession(newSessionId);

            //        var session = getSession(newSessionId);
            //        //being initialized for the first time
            //        scope.hs.fImageHub.sessionId = newSessionId;
            //        scope.hs.fImageHub.sessionName = session.name;
            //        //scope.hs.session.sessionId = newSessionId;
            //        //scope.hs.session.name = session.name;
            //        //scope.hs.session.obj = session;
            //    }
            //}, false);

            function getSession(sessionId) {
                return common.findById(scope.cm.currentAlbum.sessions, "id", sessionId);
            }


        }
    }

})();

