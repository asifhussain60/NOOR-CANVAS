(function () {
    "use strict";

    var serviceId = "sessionInterceptor";

    angular.module("app").factory(serviceId, ["$q", "$rootScope", sessionInterceptor]);

    function sessionInterceptor($q, $rootScope) {

        return {
            response: function (response) {
                // do something on success
                //if (response.headers()['content-type'] === "application/json; charset=utf-8") {
                //    // Validate response, if not ok reject
                //    var data = examineJSONResponse(response); // assumes this function is available

                //    if (!data)
                //        return $q.reject(response);
                //}
                return response;
            },
            responseError: function (response) {

                if (response.status === 401) {
                    $rootScope.stateGo("login");
                } else {
                    return $q.reject(response);
                }
                
            }
        };

    }

    angular.module("app").config(["$httpProvider",
        function ($httpProvider) {
        $httpProvider.interceptors.push("sessionInterceptor");
    }]);


})();