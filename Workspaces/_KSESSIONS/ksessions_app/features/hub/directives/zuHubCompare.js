(function () {
    "use strict";

    angular.module("app").directive("zuHubCompare", ["common", "hubService", zuHubCompare]);

    function zuHubCompare(common, hubService) {

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
            templateUrl: "/app/features/hub/directives/zuHubCompare.html",
            scope: {
                options: "=zuHubCompare"
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {

            scope.hub = hubService;
            scope.preloader = prime(hubService.host.preloader);
            scope.f = resetForm();

            scope.newForm = function () {
                scope.f = resetForm();
            }

            function prime(list) {
                _.each(list.wordComparisons, function (item) {
                     item.isPublished = false;
                });
                return list;
            }


            function resetForm() {
                return {
                    arabic1: "",
                    arabic2: "",
                    english1: "",
                    english2: "",
                    isNarration: false
                };
            }



            scope.$watch("f.isNarration", function (newIsNarration, oldIsNarration) {

                if (newIsNarration) {
                    scope.f.arabic2 = "";
                    scope.f.english2 = "";
                }
            }, false);

            scope.loadWordCompareWithHighlight = function (wc, h) {
                scope.loadWordCompare(wc);
                common.$timeout(function () {
                    scope.loadWordCompareHighlight(h);
                }, 500);
            }
            scope.loadWordCompareHighlight = function (h) {
                scope.hub.pushToClientWordCompareHighlight(h.item);
            };


            scope.loadWordCompare = function (word) {
                scope.f.arabic1 = word.arabic1;
                scope.f.arabic2 = word.arabic2;
                scope.f.english1 = word.english1;
                scope.f.english2 = word.english2;
                scope.f.isNarration = word.isNarration;
                word.isPublished = true;
                scope.publishWords();
            }

            scope.publishWords = function () {
                var compare1 = "", compare2 = "";
                var classPrefix = scope.f.isNarration ? "narration-" : "word-compare-";

                if (scope.f.arabic1) {
                    compare1 = "<div class='" + classPrefix + "arabic'>" + scope.f.arabic1 + "</div>";
                }
                if (scope.f.arabic2) {
                    compare2 = "<div class='" + classPrefix + "arabic'>" + scope.f.arabic2 + "</div>";
                }

                var englishSize = "";
                if (!scope.f.isNarration) {
                    englishSize = "word-english-" + (Boolean(scope.f.arabic1) ? "small" : "large");
                }

                if (scope.f.english1) {
                    compare1 += "<div class='" + classPrefix + "english " + englishSize + " '>" + scope.f.english1 + "</div>";
                }
                if (scope.f.english2) {
                    compare2 += "<div class='" + classPrefix + "english " + englishSize + " '>" + scope.f.english2 + "</div>";
                }
                scope.hub.pushToClientWordCompare(compare1, compare2, scope.f.isNarration);
            }
        }
    }

})();

