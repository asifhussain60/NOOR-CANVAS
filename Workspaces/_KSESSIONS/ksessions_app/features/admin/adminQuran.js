(function () {
    "use strict";
    var controllerId = "adminQuranCtl";
    angular.module("app").controller(controllerId,
        ["$document", "$scope", "$sce", "common", "config", "quranService", adminQuranCtl]);

    function adminQuranCtl($document, $scope, $sce, common, config, quranService) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        var ayahCopy = new Clipboard("#btn-copy-ayah");
        var tokenCopy = new Clipboard("#btn-copy-token");
        var ayahTokenCopy = new Clipboard("#btn-copy-ayah-token");

        ayahCopy.on("success", clearCopySelection);
        tokenCopy.on("success", clearCopySelection);
        ayahTokenCopy.on("success", clearCopySelection);



        $scope.vm = {}; var vm = $scope.vm;
        $scope.qs = quranService; var qs = $scope.qs;

        vm.fQuranSearch = getNewForm();
        vm.nobleQuranLink = "";
        vm.quranResult = {
            token: "",
            surahs: []
        };
        vm.viewReady = false;

        vm.appendAyah = appendAyah;
        vm.isolateAyat = isolateAyat;
        vm.resetQuranView = resetQuranView;
        vm.submitSearchCriteria = submitSearchCriteria;
        vm.updateAyah = updateAyah;

        activateController();

        function activateController() {
            var promises = [];
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(result) {
                vm.viewReady = true;
                log("Activated adminQuran View", controllerId, config.showDevToasts);
            }
        }

        var clearlist = "[vm.fQuranSearch.ayahText, vm.fQuranSearch.ayahNumber, vm.fQuranSearch.surahId, vm.fQuranSearch.englishToken]";
        $scope.$watch(clearlist, function (newValue, oldValue) {
            if (newValue && !angular.equals(newValue, oldValue) && vm.fQuranSearch.filter) {
                vm.fQuranSearch.filter = "";
                vm.quranResult = { surahs: [] };
            }
        }, false);

        $scope.$watch("vm.fQuranSearch.surahId", function (newSurahId, oldSurahId) {
            if (newSurahId && !angular.equals(newSurahId, oldSurahId)) {
                var surah = common.findById(qs.surahList, "surahId", newSurahId);
                if (!surah) { return; }
                vm.fQuranSearch.ayahNumber = surah.surahNumber + ":1-" + surah.totalAyats;
                retrieveDataByAyatNumber();
            }
        }, false);

        $scope.$on("$destroy", function () {
        });


        function getNewForm() {
            return {
                ayahText: "",
                englishToken: "",
                ayahNumber: "",
                surahId: "",
                filter: "",
                isByAyatNumber: false,
                isByText: false,
                isByEnglishToken: false,
                showNobleQuran: false
            };
        }

        function clearCopySelection(e) {
            common.$timeout(function () { e.clearSelection(); }, 500);
        }

        function resetQuranView() {
            vm.fQuranSearch = getNewForm();
            vm.quranResult.token = "";
            vm.quranResult.surahs = [];
        }

        function appendAyah(ayahToken, action) {

            var token = getNewAyatParam(ayahToken, action);
            getResultByAyatNumbers(token).then(function (response) {
                var result = response.surahs[0];
                var surah = common.findById(vm.quranResult.surahs, "surahId", result.surahId);
                if (surah) {
                    surah.ayats = result.ayats;
                    surah.surahAyahToken = token;
                } else {
                    vm.fQuranSearch.ayahNumber = token;
                    submitSearchCriteria();
                }
            });
        }

        function getNewAyatParam(ayahToken, action) {
            var params = breakIntoTokens(ayahToken);
            var isMultiple = params.isMultipleAyats;

            if (isMultiple) {
                if (action === "+") {
                    params.ayahEnd += 1;
                } else {
                    params.ayahStart = params.ayahStart > 1 ? params.ayahStart - 1 : params.ayahStart;
                }
            } else {
                if (action === "+") {
                    params.ayahEnd = params.ayahStart + 1;
                } else {
                    params.ayahEnd = angular.copy(params.ayahStart);
                    params.ayahStart = params.ayahStart > 1 ? params.ayahStart - 1 : params.ayahStart;
                }
            }
            return params.surahNumber + ":" + params.ayahStart + "-" + params.ayahEnd;;
        }


        function breakIntoTokens(ayah) {
            var isMultipleAyats = common.contains(ayah, "-");
            var tokens = ayah.split(":");
            var ayahStart = isMultipleAyats ? tokens[1].split("-")[0] : tokens[1];
            var ayahEnd = isMultipleAyats ? tokens[1].split("-")[1] : "";

            if (!tokens) return null;
            return {
                isMultipleAyats: isMultipleAyats,
                surahNumber: Number(tokens[0]),
                ayahStart: Number(ayahStart),
                ayahEnd: Number(ayahEnd)
            };
        }

        function submitSearchCriteria(scrollItem) {

            vm.fQuranSearch.isByAyatNumber = Boolean(vm.fQuranSearch.ayahNumber);
            vm.fQuranSearch.isByText = Boolean(vm.fQuranSearch.ayahText);
            vm.fQuranSearch.isByEnglishToken = Boolean(vm.fQuranSearch.englishToken);

            if (vm.fQuranSearch.isByAyatNumber) {
                retrieveDataByAyatNumber();
            }
            if (vm.fQuranSearch.isByText) {
                retrieveDataBySearchToken();
            }
            if (vm.fQuranSearch.isByEnglishToken) {
                retrieveDataByEnglishToken();
            }        }

        function retrieveDataBySearchToken() {
            var token = vm.fQuranSearch.ayahText;
            quranService.getAyatsBySearchToken(token).then(function (response) {
                vm.quranResult = {
                    token: token,
                    surahs: response.data
                };
                clearToken();
            });
        }

        function clearToken() {
            vm.nobleQuranLink = "";
            vm.fQuranSearch.showNobleQuran = false;
            vm.fQuranSearch.ayahText = "";
            vm.fQuranSearch.englishToken = "";
        }

        function retrieveDataByEnglishToken() {
            var token = vm.fQuranSearch.englishToken;
            quranService.getAyatsByEnglishToken(token).then(function (response) {
                vm.quranResult = {
                    token: token,
                    surahs: response.data
                };
                clearToken();
            });
        }

        function retrieveDataByAyatNumber() {
            var tokens = vm.fQuranSearch.ayahNumber.split(":");
            return getResultByAyatNumbers(vm.fQuranSearch.ayahNumber).then(function (quran) {
                common.jumpToTop();
                vm.quranResult = quran;
                vm.nobleQuranLink = $sce.trustAsResourceUrl("https://quran.com/" + tokens[0] + "/" + tokens[1]);
                vm.fQuranSearch.showNobleQuran = quran.surahs[0].ayats.length === 1;
                vm.fQuranSearch.ayahNumber = "";
                return quran;
            });
        }
        function getResultByAyatNumbers(searchToken) {
            var tokens = searchToken.split(":");
            return quranService.getAyatsWithTranslation(tokens[0], tokens[1]).then(function (response) {
                var result = {};
                result.token = searchToken;
                result.surahs = [];
                result.surahs.push(response);
                return common.$q.when(result);
            });
        }

        function scrollToElement(itemId) {
            if (!itemId) { return; }
            var offset = 10;
            common.$timeout(function () {
                var titleElement = angular.element(document.getElementById(itemId));
                if (titleElement.length) {
                    $document.scrollToElement(titleElement, offset, 1000);
                }
            }, 750);
        }

        function updateAyah(ayah) {
            quranService.updateAyah(ayah).then(function (response) {
                if (response.data) {
                    log("Update Translation For Ayat Number: " + ayah.ayatNumber, controllerId);
                }
            });
        }

        function isolateAyat(surahNumber, ayah) {
            if (!vm.quranResult) { return; }
            vm.fQuranSearch.ayahText = "";
            vm.fQuranSearch.ayahNumber = surahNumber + ":" + ayah.ayatNumber;
            submitSearchCriteria();
        }

    }
})();