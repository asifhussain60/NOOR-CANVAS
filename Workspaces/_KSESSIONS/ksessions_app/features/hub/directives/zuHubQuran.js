(function() {
    "use strict";

    angular.module("app").directive("zuHubQuran", ["common", "hubService", "quranService", zuHubQuran]);

    function zuHubQuran(common, hubService, quranService) {

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
            templateUrl: "/app/features/hub/directives/zuHubQuran.html",
            scope: false
        };
        return directive;

        function link(scope, element, attrs, controller) {
            scope.hub = hubService;
            scope.quranControls = {
                surahNumber: "",
                ayatNumbers: "",
                highlightToken:""
            }
            scope.preloaderQuran = prime(hubService.host.preloader.quranTokens);
            var cc = scope.hub.cc;

            scope.getQuranAyats = function() {
                if (!scope.hub.isHost) {return null;}
                var surahNumber = scope.quranControls.surahNumber;
                var ayatNumbers = scope.quranControls.ayatNumbers;
                if (!surahNumber || !ayatNumbers) return null;

                return quranService.getAyatsWithTranslation(surahNumber, ayatNumbers).then(function(surah) {
                    hubService.pushToClientQuranAyats(surah);
                    scope.quranControls.surahNumber = "";
                    scope.quranControls.ayatNumbers = "";
                });
            }

            scope.loadQuranWithHighlight = function (quran, h) {
                scope.loadQuranToken(quran);
                common.$timeout(function () {
                    scope.loadQuranHighlight(h);
                }, 500);
                
            }

            function prime(list) {
                _.each(list, function(item) {item.isPublished = false;});
                return list;
            }

            scope.loadQuranToken = function(quran) {
                scope.quranControls.surahNumber = quran.surahNumber;
                scope.quranControls.ayatNumbers = quran.ayatNumber;
                quran.isPublished = true;
                scope.getQuranAyats();
            };

            scope.loadQuranHighlight = function(h) {
                scope.quranControls.highlightToken = h.item;
                scope.onHighlightEnter();
            };

            scope.onHighlightEnter = function () {
                var token = scope.quranControls.highlightToken;
                hubService.pushToClientQuranHighlight(token);
                scope.quranControls.highlightToken = "";
            }

            scope.onClearCache=function() {
                hubService.pushToClientQuranAyats(null);
            }

            scope.$watch("hub.clientDisplay", function(newDisplay, oldDisplay) {
                if (scope.hub.isHost && newDisplay === cc.cmImage && !angular.equals(newDisplay, oldDisplay)) {
                    scope.quranControls.surahNumber = "";
                    scope.quranControls.ayatNumbers = "";
                    scope.hub.user.quran = null;
                }
            }, false);
        }
    }

})();

