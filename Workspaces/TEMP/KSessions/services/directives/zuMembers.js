(function() {
    "use strict";

    angular.module("app").directive("zuMembers", ["mediaportService", zuMembers]);

    function zuMembers(mps) {

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
            templateUrl: "/app/services/directives/zuMembers.html",
            scope: {
                options: "=zuMembers",
                title: "@",
                memberList:"="
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            scope.columnCount = scope.options.cols || 2;

            if (mps.isIPad() && mps.getOrientation() === "portrait") {
                scope.columnCount = 3;
            }


        }
    }

})();

