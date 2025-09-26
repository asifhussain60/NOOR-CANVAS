(function () {
    "use strict";

    angular.module("app").directive("zuHubRootManager", ["bootstrap.dialog", "common", "hubService", "datacontext", zuHubRootManager]);

    function zuHubRootManager(dlg, common, hubService, datacontext) {

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
            templateUrl: "/app/features/hub/directives/zuHubRootManager.html",
            scope: {
                showPublish: "@",
                isSignalr: "@"
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            var getLogFn = common.logger.getLogFn;
            var log = getLogFn("zuHubRootManager");
            var tokenCopy = new Clipboard("#btn-copy-token");
            tokenCopy.on("success", function (e) { common.$timeout(function () { e.clearSelection(); }, 500); });

            scope.hs = hubService;

            scope.dtv = {
                cuLabel: true,
                derivatives: [],
                isSignalR: Boolean(scope.isSignalr === "true"),
                displayPublish: Boolean(scope.showPublish === "true"),
                isDropDownOpen: false,
                showRootTable: false,
                root: getNewRoot(),
                rootSearch: "",
                rootList: "",
                noResult: false,
                preloaderRoots: hubService.host.preloader.roots,

                //Methods
                addBlankDerivative: addBlankDerivative,
                addNewRootWord: addNewRootWord,
                saveRootWord: saveRootWord,
                checkUncheckAll: checkUncheckAll,
                deleteDerivative: deleteDerivative,
                deleteRoot: deleteRoot,
                onTypeaheadSelect: onTypeaheadSelect,
                onIsSelectedClick: onIsSelectedClick,
                onIsHighlightClick: onIsHighlightClick,
                onPreloaderRootClick: onPreloaderRootClick,
                publish: publish,
                reset: reset,
                saveDerivatives: saveDerivatives
            };

            var dtv = scope.dtv;

            datacontext.getRoots().then(function (response) {
                dtv.rootList = response.data;
            });

            scope.$watch("dtv.noResult", function (newResult, oldResult) {
                if (newResult && !angular.equals(newResult, oldResult)) {
                    addNewRootWord();
                    dtv.root.rootTransliteration = dtv.rootSearch;
                    common.delayedFocus("#root-word-main");
                }
            }, false);


            function getNewRoot() {
                return {
                    rootWord: "",
                    rootWordUnfmt: "",
                    rootTransliteration: "",
                    rootId: 0,
                    definition: "",
                    meaningEnglish: "",
                    meaningArabic: "",
                    derivatives: [],
                    createdDate: ""
                };
            }

            function addNewRootWord() {
                dtv.root = getNewRoot();
                dtv.showRootTable = true;
            }

            function saveRootWord() {
                var isNew = false;
                if (dtv.root) {
                    isNew = dtv.root.rootId === 0;
                    datacontext.addUpdateRootWord(dtv.root).then(function (response) {
                        var r = response.data;
                        dtv.root.rootId = r.rootId;
                        dtv.root.rootWord = r.rootWord;
                        dtv.root.rootWordUnfmt = r.rootWordUnfmt;
                        dtv.root.rootTransliteration = r.rootTransliteration;
                        dtv.root.meaningEnglish = r.meaningEnglish;
                        dtv.root.definition = r.definition;
                        if (isNew) {
                            dtv.rootList.push(dtv.root);
                        }
                        log("Saved Root Word with ID: " + dtv.root.rootId, "zuHubRootManager");
                    });
                }
            }

            function onTypeaheadSelect($item, $model, $label) {
                dtv.root = $item;
                datacontext.getRootWithDerivatives($item.rootId).then(function (response) {
                    dtv.root.derivatives = response.data.derivatives;
                    dtv.showRootTable = true;
                });
            };

            function onPreloaderRootClick(r) {
                dtv.rootSearch = r.rootWordUnfmt;
                dtv.root = common.findByKey(dtv.preloaderRoots, "rootWordUnfmt", r.rootWordUnfmt);
                publish();
            }

            function prime(data) {
                return _.each(data, function (item) {
                    item.isSelected = true;
                    item.meaningEnglish = item.meaningEnglish.capitalize(true, true);
                });
            }

            function checkUncheckAll() {
                dtv.cuLabel = !dtv.cuLabel;
                _.each(dtv.root.derivatives, function (d) {
                    d.isSelected = dtv.cuLabel;
                });
            }

            function reset() {
                dtv.root = getNewRoot();
                dtv.showRootTable = false;
                dtv.rootSearch = "";
                if (dtv.isSignalR) {
                    hubService.pushToClientReset();
                }
            }

            function onIsSelectedClick(d) {
                d.isSelected = !d.isSelected;
            }
            function onIsHighlightClick(d, idx) {
                var value = !d.isHighlighted;
                dtv.root.derivatives.forEach(function (der, index, array) {
                    der.isHighlighted = false;
                });
                d.isHighlighted = value;
                if (d.isHighlighted) { d.isSelected = true; }
                publish();
            }

            function publish() {
                var clientRoot = angular.copy(dtv.root);
                clientRoot.derivatives = filterSelectedItems(clientRoot.derivatives);
                if (dtv.isSignalR) {
                    hubService.pushToClientRoots(clientRoot);
                }
            }

            function saveDerivatives() {
                datacontext.saveDerivatives(dtv.root.rootId, dtv.root.derivatives).then(function (response) {
                    dtv.root.derivatives = response.data;
                    log("All Records Saved");
                });
            }

            function filterSelectedItems(data) {
                return _.filter(data, function (d) {
                    return d.isSelected === true;
                });
            }

            function addBlankDerivative() {
                dtv.root.derivatives.push({
                    rootId: dtv.root.rootId,
                    isSelected: false,
                    derivativeId: -1,
                    derivative: "",
                    meaningEnglish: "",
                    meaningArabic: "",
                    definition: ""
                });
            }

            function deleteRoot() {

                dlg.deleteDialog("root word", "").then(function (result) {
                    if (result === "ok") {
                        var id = dtv.root.rootId;
                        datacontext.deleteRoot(id).then(function (response) {
                            if (response.data) {
                                dtv.rootList = common.withoutItem(dtv.rootList, { rootId: id });
                                dtv.root = getNewRoot();
                                dtv.rootSearch = "";
                                dtv.showRootTable = false;
                                log(response.data + " Root word deleted successfully");
                            }
                        });
                    }
                });
            }

            function deleteDerivative(d) {
                dlg.deleteDialog("derivative", "").then(function (result) {
                    if (result === "ok") {
                        datacontext.deleteDerivative(d.derivativeId).then(function (response) {
                            if (response.data) {
                                dtv.root.derivatives = common.withoutItem(dtv.root.derivatives, { derivativeId: d.derivativeId });
                                log(response.data + " Derivative deleted successfully");
                            }
                        });
                    }
                });
            }
        }
    }

})();

