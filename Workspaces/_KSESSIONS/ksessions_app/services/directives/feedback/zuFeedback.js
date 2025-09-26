(function () {
    "use strict";

    angular.module("app").directive("zuFeedback", ["common", "datacontext", "froalaConfig", zuFeedback]);

    function zuFeedback(common, datacontext, froalaConfig) {
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
            templateUrl: "/app/services/directives/feedback/zuFeedback.html",
            scope: {
                sessionid: "@",
                sessionName: "@",
                memberid: "@",
                memberName: "@",
                feedbackSource: "@",
                redirect: "="
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            var sessionId = Number(scope.sessionid);
            var memberId = Number(scope.memberid);
            var sessionName = scope.sessionName;
            scope.isSubmitting = false;

            if (!sessionId) { return; }
            scope.froalaOptions = froalaConfig.fEditorSimpleOptions(function (e, editor) {
                editor.opts.placeholderText = "";
                editor.opts.multiLine = false;
            });
            datacontext.getSessionFeedbackQuestions(sessionId).then(function (response) {
                scope.feedbackQuestions = response.data;
            });
            scope.onSubmit = function () {
                var userFeedback = primeData(scope.feedbackQuestions);
                var memberParam = memberId || scope.memberName;
                scope.isSubmitting = true;

                datacontext.submitSessionFeedback(sessionId, memberParam, userFeedback).then(onSuccess, onFailure);
                function onSuccess(response) {
                    scope.isSubmitting = false;
                    if (scope.redirect) {
                        scope.redirect({
                            feedback: userFeedback,
                            score: response.data
                        });
                    }
                }
                function onFailure(err) {
                    //debugger;
                }
            }

            function primeData(questions) {
                var userFeedback = [];
                _.each(questions, function (fb) {
                    var item = {
                        questionId: fb.feedbackQuestionId,
                        userResponse: fb.userResponse,
                        userResponseDisplay: fb.userResponseDisplay,
                        question: fb.question,
                        memberId: memberId,
                        userName: scope.memberName,
                        sessionId: sessionId,
                        feedbackSource: Number(scope.feedbackSource),
                        isSelectable: fb.isSelectable
                    }
                    userFeedback.push(item);
                });
                return userFeedback;
            }
        }
    }
})();