(function () {
    "use strict";

    angular.module("app").directive("zuHubHtml", ["datacontext", "froalaConfig", "hubService", zuHubHtml]);

    function zuHubHtml(datacontext, froalaConfig, hubService) {

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
            templateUrl: "/app/features/hub/directives/zuHubHtml.html",
            scope: {
                dataType: "@zuHubHtml"
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            scope.hub = hubService;
            scope.content = {
                list: [],
                html: null
            }
            scope.froalaOptions = froalaConfig.fEditorSimpleOptions(function (e, editor) {
                //do nothing
            });


            if (scope.dataType === "salaam") {
                datacontext.getSalaamContent().then(function (response) {
                    scope.content.list = response.data;
                });
            }
            scope.loadSalaamContent = function (s) {
                scope.content.html = s.content;
                hubService.pushToClientSalaam(s.content);
            }
            scope.resetSalaam = function () {
                scope.content.html = null;
                scope.hub.pushToClientReset();
            }

        }
    }

})();

