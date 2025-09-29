(function() {
    "use strict";

    angular.module("app").directive("zuDtv", ["common", zuDtv]);

    function zuDtv(common) {

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
            replace: false,
            require: "ngModel", //injects directive from parent scope - prefixes [? | ^]
            templateUrl: "/app/features/hub/directives/zuHubLists.html",
            scope: {
                options: "=zuDtv",
                model: "=ngModel"
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {

            //evaluate an attribute declared on the element of this directive
            var attributeValue = scope.$eval(attrs["attributeName"]);

            //watch for changes in the ng-model directive declared on this element
            scope.$watch(attrs.ngModel, function(newValue, oldValue) {
                if (newValue && !angular.equals(newValue, oldValue)) {
                    var modelValue = newValue;
                    controller.$setValidity("token", boolean);
                }
            }, false);
            
        }
    }

})();

