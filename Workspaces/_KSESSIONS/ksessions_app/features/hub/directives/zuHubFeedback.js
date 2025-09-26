(function() {
    "use strict";

    angular.module("app").directive("zuHubFeedback", ["common", "datacontext", "froalaConfig", "hubService", zuHubFeedback]);

    function zuHubFeedback(common, datacontext, froalaConfig,hubService) {

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
            templateUrl: "/app/features/hub/directives/zuHubFeedback.html",
            scope: {
                feedbackQuestions: "=zuHubFeedback"
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            scope.hub = hubService;
            var sessionId = hubService.fImageHub.sessionId;
            scope.froalaOptions = froalaConfig.fEditorSimpleOptions(function (e, editor) {
                editor.opts.placeholderText = "";
                editor.opts.multiLine = false;
            });

            //datacontext.getFeedbackQuestionnaire(sessionId).then(function (response) {
            //    scope.hub.user.published.feedback = response.data;
            //});


        }
    }

})();

