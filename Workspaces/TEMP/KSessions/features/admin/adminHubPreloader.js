(function () {
    "use strict";
    var controllerId = "adminHubPreloaderCtl";
    angular.module("app").controller(controllerId,
    ["$scope", "common", "config", "contentManager", "datacontext", "quranService", adminHubPreloaderCtl]);

    function adminHubPreloaderCtl($scope, common, config, contentManager, datacontext, quranService) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        //var urlAlbumId = $scope.$stateParams.albumId || contentManager.adminStore.albumId || 0;
        //var urlSessionId = $scope.$stateParams.sessionId || contentManager.adminStore.sessionId || 0;


        $scope.vm = {}; var vm = $scope.vm;
        vm.cm = contentManager;

        //Properties
        vm.datacontextResponse = {};
        vm.viewReady = false;
        vm.json = null;
        vm.rootList = null;
        vm.fPreloader = newSessionObject();
        vm.showSecondItem = true;
        //Flags to control display of verse details
        vm.quranAyah = null;
        vm.quranAyahCurrent = "";

        //Methods
        vm.addNewAyat = addNewAyat;
        vm.addNewRoot = addNewRoot;
        vm.addNewComparisonRow = addNewComparisonRow;
        vm.addNewHighlight = addNewHighlight;
        vm.displayVerse = displayVerse;
        vm.extractDetails = extractDetails;
        vm.removeComparisonRow = removeComparisonRow;
        vm.removeRoot = removeRoot;
        vm.savePreloader = savePreloader;
        vm.onIsNarrationClick = onIsNarrationClick;
        vm.onTypeaheadSelect = onTypeaheadSelect;
        vm.onAlbumSelect = onAlbumSelect;
        vm.onSessionSelect = onSessionSelect;
        vm.onWordDescblur = onWordDescblur;

        activateController();

        function activateController() {
            var promises = [contentManager.getAllAlbums(), datacontext.getRoots()];

            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(resultArray) {
                if (resultArray.length) {
                    vm.rootList = resultArray[1].data;
                    vm.viewReady = true;
                }
                log("Activated adminHubPreloader View", controllerId, config.showDevToasts);
            }
        }

        //Watches

        function onAlbumSelect(albumId) {
            vm.fPreloader = newSessionObject({ albumId: albumId });
        }

        function onSessionSelect(sessionId, categoryId) {
            vm.fPreloader.sessionId = sessionId;
            datacontext.getHubProfileForSession(sessionId).then(function (response) {
                vm.json = angular.copy(response.data);
                if (!vm.json.quranTokens.length) return;
                _.each(vm.json.quranTokens, function (item) {
                    item.isSelected = false;
                    item.guid = common.guid();
                });
            });
        }

        function onWordDescblur(word) {

            if (!common.contains(word.description, "|")) return;

            word.isNarration = true;
            var tokens = word.description.split("|");
            if (tokens.length !== 2 && tokens[0].toUpperCase() === "H") return;
            datacontext.getAhadeesById(tokens[1]).then(function (response) {
                var w = response.data;
                word.description = w.subject;
                word.arabic1 = w.ahadeesArabic;
                word.english1 = w.ahadeesEnglish;
            });
        }

        //Internal Methods

        function newSessionObject(session) {
            if (!session) { session = {}; }
            return {
                albumId: session.albumId || "",
                sessionId: session.id || ""
            }
        }

        function extractDetails(q) {
            var result = common.between(q.description, "[", "]");
            if (!result) { return; }
            var tokens = result.split(":");
            q.surahNumber = tokens[0];
            q.ayatNumber = tokens[1];
        }

        function displayVerse(q) {
            quranService.getHtmlQuran(q.surahNumber + ":" + q.ayatNumber + "&").then(function (response) {
                vm.quranAyah = response;
                vm.quranAyahCurrent = q.guid;
            });
        }

        function addNewComparisonRow() {
            vm.json.wordComparisons.push({});
        }
        function addNewRoot() {
            vm.json.roots.push({});
        }
        function addNewAyat() {
            vm.json.quranTokens.push({
                ayatNumber: "",
                description: "",
                guid: "",
                highlights: [{}],
                isPartial: false,
                isSelected: false,
                surahNumber: ""
            });
        }
        function addNewHighlight(item) {
            if (!item.highlights) { item.highlights = []; }
            item.highlights.push({
                item: null,
                ordinal: item.highlights.length + 1,
                isCurrent: false
            });
        }

        function removeComparisonRow(c, index) {
            vm.json.wordComparisons.splice(index, 1);
        }
        function removeRoot(r, index) {
            vm.json.roots.splice(index, 1);
        }

        function savePreloader() {
            vm.json.sessionId = vm.fPreloader.sessionId;
            datacontext.saveHubPreloaderData(vm.fPreloader.sessionId, vm.json).then(function (response) {
                vm.json.preloaderId = response.data;
                log("Saved Preloader JSON ID (" + response.data + ")", controllerId);
            });
        }

        function onIsNarrationClick(item) {
            item.isNarration = !item.isNarration;
            vm.showSecondItem = !item.isNarration;
            if (item.isNarration) {
                item.arabic2 = "";
                item.english2 = "";
            }
        }


        function onTypeaheadSelect($item, $model, $label) {
            var jsonRoot = common.findByKey(vm.json.roots, "rootTransliteration", $model);
            datacontext.getRootWithDerivatives($item.rootId).then(function (response) {
                jsonRoot.rootId = response.data.rootId;
                jsonRoot.rootTransliteration = response.data.rootTransliteration;
                jsonRoot.rootWord = response.data.rootWord;
                jsonRoot.rootWordUnfmt = response.data.rootWordUnfmt;
                jsonRoot.meaningEnglish = response.data.meaningEnglish;
                var derivatives = response.data.derivatives;
                _.each(derivatives, function (d) { d.isSelected = true; });
                jsonRoot.derivatives = derivatives;
            });
        };


    }
})();