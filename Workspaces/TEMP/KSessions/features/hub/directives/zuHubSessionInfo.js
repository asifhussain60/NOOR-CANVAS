(function () {
    "use strict";

    angular.module("app").directive("zuHubSessionInfo", ["$interval", "common", "hubService", zuHubSessionInfo]);

    function zuHubSessionInfo($interval, common, hubService) {

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
            templateUrl: "/app/features/hub/directives/zuHubSessionInfo.html",
            scope: {
                session: "=zuHubSessionInfo"
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {

            scope.hub = hubService;
            scope.maxTimer = 0;
            scope.timerRemaining = 0;
            scope.timerCaption = "Calculating...";
            var currentTimerSeconds = 0;

            scope.$watch("hub.session.startTimer", function (newTimer, oldTimer) {
                if (newTimer) {
                    if (!scope.maxTimer) {
                        scope.maxTimer = newTimer;
                        currentTimerSeconds = angular.copy(newTimer);
                    }
                    startTimer();
                } else {
                    stopTimer();
                }
            }, false);

            function stopTimer() {
                $interval.cancel(1000);
            }

            function startTimer() {
                $interval(function () {
                    currentTimerSeconds -= 1;
                    scope.timerCaption = Math.floor(currentTimerSeconds / 60) + " minute(s) Remaining";

                    scope.timerRemaining = 100 - Math.floor((currentTimerSeconds / scope.maxTimer) * 100);
                    scope.progressBar = {
                        "width": scope.timerRemaining + "%"

                    };
                    if (scope.timerRemaining >= 100 || scope.hub.session.isOpen) {
                        stopTimer();
                        return;
                    }
                }, 1000);
            }
        }


    }

})();

