(function () {
    "use strict";

    angular.module("app").directive("zuHubImages", ["hubService", "common", "datacontext", zuHubImages]);

    function zuHubImages(hubService, common, datacontext) {

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
            templateUrl: "/app/features/hub/directives/zuHubImages.html",
            scope: {
                sessions: "=zuHubImages"
            }
        };
        return directive;


        function link(scope, element, attrs, controller) {
            scope.hub = hubService;
            scope.activeSession = common.findById(scope.sessions, "id", scope.hub.fImageHub.sessionId);
            if (!scope.activeSession) {
                return;
            }
            var sequence = scope.activeSession.sequence;
            var cc = scope.hub.cc;
            scope.sessions = filterSessions(scope.sessions, sequence);
            scope.selectedSessionId = -1;
            scope.imageList = [];

            scope.sessionClick = function (sessionId) {
                scope.selectedSessionId = sessionId;
            }

            scope.$watch("selectedSessionId", function (newSessionId, oldSessionId) {
                if (newSessionId) {
                    var imagePrimed = [];
                    datacontext.getImagesForSession(newSessionId).then(function (response) {
                        if (response.data) {
                            _.each(response.data, function (item) {
                                imagePrimed.push({ selected: false, imageUri: item });
                            });
                        }
                        scope.imageList = imagePrimed;
                    });
                }
            }, false);

            scope.publishImage = function (img) {
                _.each(scope.imageList, function (item) {
                    if (item.imageUri !== img.imageUri) { item.selected = false; }
                });
                img.selected = !img.selected;
                if (img.selected) {
                    scope.hub.pushToClientImage(img.imageUri);
                } else {
                    scope.hub.pushToClientImage("");
                }
            };

            scope.$watch("hub.clientDisplay", function (newDisplay, oldDisplay) {
                if (scope.hub.isHost && newDisplay === cc.cmQuran && !angular.equals(newDisplay, oldDisplay)) {
                    _.each(scope.imageList, function (item) { item.selected = false; });
                }
            }, false);

            function filterSessions(sessions, seq) {
                var range = _.filter(sessions, function (s) {
                    return Number(s.sequence) <= Number(seq);
                });
                if (range.length>5) {
                    range = range.sortBy("sequence", true).slice(0, 5);
                }
                return range;
            }

            //Load images for first session
            scope.selectedSessionId = scope.activeSession.id;
            scope.activeSession.isExpanded = true;

        }
    }

})();

