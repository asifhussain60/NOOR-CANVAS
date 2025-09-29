(function () {
    "use strict";

    var serviceId = "poller";

    angular.module("app").factory(serviceId, ["$http", "$rootScope", "$timeout", poller]);

    function poller($http, $rootScope, $timeout) {
        var keepTicking = false;
        var service = {
            startTicking: startTicking,
            stopTicking: stopTicking
        };
        return service;

        function startTicking(interval, displayResponse) {

            if (keepTicking) { return; }

            keepTicking = true;

            //====================================================
            // Implement this on the server controller
            //====================================================
            //    [Route("api/poller")]
            //    public IHttpActionResult GetPollStatus()
            //    {
            //        return Ok(DateTime.Now);
            //    }
            //====================================================

            (function tick() {
                if (keepTicking) {
                    $http.get("api/poller").then(function (response) {
                        if (displayResponse) {
                            // Response received from server
                        }
                        $timeout(tick, interval);
                    }, function (errResponse) {
                        $rootScope.stateGo("login");
                    });
                }

            })();
        }

        function stopTicking() {
            keepTicking = false;
            // Ticker turned off
        }
    }
})();