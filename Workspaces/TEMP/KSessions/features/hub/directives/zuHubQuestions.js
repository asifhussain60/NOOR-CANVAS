(function () {
    "use strict";
    angular.module("app").directive("zuHubQuestions", ["common", "froalaConfig", "hubService", zuHubQuestions]);
    var directiveId = "zuHubQuestions";

    function zuHubQuestions(common, froalaConfig, hubService) {

        /***************************************************************************************
        * Usage:
        *       <div data-zu-questions=""></div>
        * 
        * Description:
        *       Directive will detect it's a host by hub.isClient
        *      
        * Gotcha(s): 
        *      
        * 
        ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: true,
            templateUrl: "/app/features/hub/directives/zuHubQuestions.html",
            scope: true
        };
        return directive;

        function link(scope, element, attrs, controller) {
            var getLogFn = common.logger.getLogFn;
            var log = getLogFn(zuHubQuestions);

            scope.hub = hubService;
            scope.isQuestionCollapsed = true;
            scope.preloaderQuestions = hubService.host.preloader.hostQuestions;

            scope.froalaOptions = froalaConfig.fEditorSimpleOptions(function (e, editor) {
                editor.opts.placeholderText = "Ask a question anonymously";
                editor.opts.multiLine = false;
            });

            scope.$watch("preloaderQuestions", function (newQuestion) {
                if (newQuestion && newQuestion.length) {
                    scope.preloaderQuestions.forEach(function (q, index, array) {
                        hubService.postUserQuestion(q.item);
                    });
                }
            }, false);


            scope.$watch("hub.host.questions", function (newQuestion, oldQuestion) {
                if (scope.hub.isHost && newQuestion && !angular.equals(newQuestion.length, oldQuestion.length)) {
                    var question = newQuestion[newQuestion.length - 1];
                    if (question && !question.isAnswered) {
                        var msg = question.user + " asks: " + question.question;
                        log(msg, directiveId);
                    }
                }
            }, false);


            scope.onQuestionClick = function () {
                scope.isQuestionCollapsed = !scope.isQuestionCollapsed;
                if (scope.isQuestionCollapsed) { return; }
                common.$timeout(function () { $(".fr-element").focus(); }, 1000);
            };


            scope.postUserQuestion = function () {
                hubService.postUserQuestion().then(function (response) {
                    if (response) {
                        scope.isQuestionCollapsed = true;
                    }
                });
            };

            scope.removeQuestionFromList=function(q, idx) {
                scope.hub.host.questions = common.withoutItem(scope.hub.host.questions, { guid: q.guid });
            }

            scope.sendResponseToQuestion = function (q, responseType) {
                q.isSelected = false;
                scope.hub.respondToUserQuestion(q, responseType);
            }

            scope.selectQuestion = function (q) {
                if (!q) { return; }
                _.each(scope.hub.host.questions, function (quest) { quest.isSelected = false; });
                q.isSelected = true;
                scope.hub.pushToClientUserQuestion(q.question);
            }

            if (scope.hub.isClient) {
                common.$timeout(function () {
                    $(".fr-element").on("keydown", function (e) {
                        if (e.which !== 13) {
                            scope.hub.userIsTypeing();
                        }
                    });
                }, 1000);
            }


        }
    }

})();

