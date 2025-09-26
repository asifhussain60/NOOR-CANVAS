(function() {
    "use strict";

    angular.module("app").directive("zuRegisteredUsers", [ zuRegisteredUsers]);

    function zuRegisteredUsers() {

        var directive = {
            restrict: "A",
            replace: true,
            templateUrl: "/app/features/hub/directives/zuRegisteredUsers.html",
            scope: {
                registeredUsers: "=zuRegisteredUsers"
            }
        };
        return directive;
    }

})();

