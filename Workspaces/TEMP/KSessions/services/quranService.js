(function () {
    "use strict";

    var serviceId = "quranService";

    angular.module("app").factory(serviceId, ["common", "datacontext", "globalData", "$filter", quranService]);

    function quranService(common, datacontext, gdata, $filter) {
        // Define the functions and properties to reveal.
        var service = {
            //Properties
            surahList: [],
            narrators: [],

            //Methods
            getAyatsBySearchToken: getAyatsBySearchToken,
            getAyatsByEnglishToken: getAyatsByEnglishToken,
            getAyatsWithTranslation: getAyatsWithTranslation,
            getHtmlDerivative: getHtmlDerivative,
            getHtmlQuran: getHtmlQuran,
            getHtmlAhadeesById: getHtmlAhadeesById,
            getHtmlMarker: getHtmlMarker,
            getSingleQuranVerse: getSingleQuranVerse,
            updateAyah: updateAyah,
            cleanArabicForDisplay: cleanArabicForDisplay
        };

        activateService();

        return service;

        //#region Internal Methods

        function activateService() {
            if (!gdata.member || !gdata.member.id) { return; }
            var promises = [
                datacontext.getSurahList(),
                datacontext.getNarrators()
            ];
            common.activateController(promises, serviceId)
                .then(onServiceActivation);

            function onServiceActivation(result) {
                if (result && result.length && result[0].data) {
                    service.surahList = result[0].data;
                    service.narrators = result[1].data;
                }
            }
        }

        function getAyatsWithTranslation(surahNumber, ayats) {
            return datacontext.getAyatsWithTranslation(surahNumber, ayats).then(function (response) {
                var surah = angular.copy(response.data);
                var mergedAyat = "", mergedTranslation = "";
                _.each(response.data.ayats, function (q) {
                    // Clean Arabic text before displaying
                    var cleanArabicText = cleanArabicForDisplay(q.ayatUnicode);
                    mergedAyat += cleanArabicText + "<span class='ayatCircle-arabic'>" + q.ayatNumberArabic + "</span> ";
                    mergedTranslation += "<span class='ayatCircle-english'>" + q.ayatNumber + "</span> " + q.ayatTranslationUnbraced + " ";;
                });
                surah.mergedAyats = mergedAyat;
                surah.mergedTranslations = mergedTranslation;
                return surah;
            });
        }

        function getAyatsBySearchToken(token) {
            if (!token) { return false; }
            return datacontext.getQuranAyatByToken(token);
        }

        function getAyatsByEnglishToken(token) {
            if (!token) { return false; }
            return datacontext.getQuranAyatByEnglishToken(token);
        }
        function updateAyah(ayah) {
            return datacontext.updateAyah(ayah);
        }

        function addRemovableRow(body) {
            return "<div class=\"text-center row-remover\">" +
                "<i class=\"fa fa-ban text-danger fa-2x\" aria-hidden=\"true\"></i>" +
                "</div>";
        }

        function getSingleQuranVerse(selectedText) {
            var tokens = selectedText.trim().replace("\"", "").split("\n");
            if (tokens.length !== 2) {
                return common.$q("ERROR:</br>" + selectedText);
            }

            // Clean the Arabic text
            var cleanedArabicText = cleanArabicForDisplay(tokens[0]);

            var template =
                "<div class=\"row\">" +
                "<div class=\"col-md-offset-1 col-md-10 col-sm-12 col-xs-12\">" +
                addRemovableRow() +
                "<div class=\"hq-container quranWidget\">" +
                "<div>" +
                "<div class=\"quran-ayats-single\">" +
                "<span>$$ARABIC$$</span>" +
                "</div>" +
                "<div class=\"quran-ayat-translation-single\" >" +
                "<span>$$ENG$$</span>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</div>";

            var result = template.replace("$$ARABIC$$", cleanedArabicText).replace("$$ENG$$", tokens[1]);
            return common.$q.when(result + "</br>");
        }

        function getHtmlQuran(token) {
            const [surah, ayats] = token.replace(/&$/, "").split(":");
            const url = `/api/quran/surah/${surah}/ayats/${ayats}/html-inline`;
            return datacontext.getAyatsAsHtml(surah, ayats, true).then(function (response) {
                return response.data;
            });
        }

        function getHtmlAhadeesById(id) {
            var hadeesRow =
                "<div class='row'>" +
                "<div class='col-md-offset-1 col-md-10 col-sm-12 col-xs-12'>" +
                addRemovableRow() +
                "<div class='hadees-label'>قال $$TOKEN_NARRATOR$$</div>" +
                "<div class='hadees-widget'>" +
                "<div class='hadees-arabic-text'>$$TOKEN_ARABIC$$</div>" +
                "<div class='hadees-english-text'>$$TOKEN_ENGLISH$$</div>" +
                "</div>" +
                "</div>" +
                "</div> ";

            var resultHtml = "";
            return datacontext.getAhadeesById(id).then(function (response) {
                if (!response.data) return null;
                var ahadees = response.data;
                // Clean the Arabic text
                var cleanedArabicText = cleanArabicForDisplay(ahadees.arabicText || ahadees.ahadeesArabic);
                var cleanedNarratorText = cleanArabicForDisplay(ahadees.narrator);
                resultHtml = hadeesRow
                    .replace("$$TOKEN_NARRATOR$$", cleanedNarratorText)
                    .replace("$$TOKEN_ARABIC$$", cleanedArabicText)
                    .replace("$$TOKEN_ENGLISH$$", ahadees.englishText || ahadees.ahadeesEnglish);
                return resultHtml;
            });
        }

        function getHtmlMarker(selectedText) {
            var tokens = selectedText.split(":");
            var letterCode = tokens[0];
            var boxCode = getBoxNumber(letterCode);
            var sessionGuideRow =
                "<div class='row'>" +
                "<div class='col-md-offset-1 col-md-10'>" +
                addRemovableRow() +
                "<div class='box box" + boxCode + " shadow" + boxCode + " box-hub '>" +
                "<div class='box-inner'>" +
                "<span class='sessionGuide-letter'>$$LETTER$$</span>" +
                "<span class='sessionGuide-desc'>$$TOKEN$$</span>" +
                "</div>" +
                "</div>" +
                "</div> " +
                "</div> ";

            var displayValue = tokens[1].trim();
            if (isTokenQuranWithSquareBrackets(tokens, letterCode)) {
                displayValue = tokens[1] + ":" + tokens[2];
            }
            if (!isEnglishCharacterSet(displayValue)) {
                displayValue = "<span class='amiriCrimson marker-verse'>" + displayValue + "</span>";
            }
            var resultHtml = sessionGuideRow.replace("$$LETTER$$", letterCode).replace("$$TOKEN$$", displayValue);
            return common.$q.when(resultHtml);
        }

        function isEnglishCharacterSet(value) {
            var valid = /^[A-Za-z0-9:]*$/;
            return valid.test(value.first(1));
        }

        function isTokenQuranWithSquareBrackets(tokens, letterCode) {
            return tokens.length === 3 && letterCode.toUpperCase() === "Q";
        }

        function getBoxNumber(letter) {
            switch (letter.toUpperCase()) {
                case "R":
                    return 3;
                case "Q":
                    return 1;
                case "W":
                    return 2;
                case "I":
                    return 4;
                default:
                    return 3;
            }
        }

        function getHtmlDerivative(token) {
            var promise = common.isNumber(token)
                ? datacontext.getDerivativeById
                : datacontext.getDerivativeByTransliteral;

            return promise(token).then(convertToDirectiveHtml);
            function convertToDirectiveHtml(response) {
                var d = response.data;
                if (!d) { return "D|" + token + " - Error"; }

                var htmlTemplate =
                    "<div class=\"row\"> " +
                    "<div class=\"col-md-offset-2 col-md-8 col-sm-12 col-xs-12\"> " +
                    addRemovableRow() +
                    "<div class=\"rootdef-container\">" +
                    "<div class=\"rootdef-word inlineArabic\">" +
                    d.derivative +
                    "</div> " +
                    "<div class=\"rootdef-english-meaning \">" +
                    d.derivativeMeaning +
                    "</div> " +
                    getDerivativeDetail(d.derivativeDefinition) +
                    "<div class=\"rootdef-origin-container\">" +
                    "<span class=\"rootdef-origin-title\">Root Word:</span> " +
                    "<span class=\"inlineArabic origin-word\">" + d.rootWord + "</span>" +
                    "<span class=\"origin-meaning\">( " + d.rootMeaning + ") </span>" +
                    addRootDefinition(d.rootDefinition) +
                    " </div> " +
                    "</div> " +
                    "</div> " +
                    "</div>";
                return htmlTemplate;
            }
            function addRootDefinition(def) {
                return !angular.isNullOrUndefined(def) ? "<div class=\"origin-definition\">" + def + "</div>" : "";
            }
            function getDerivativeDetail(val) {
                return (val && val.trim() === "") ? val : "<div class=\"rootdef-detail\">" + val + "</div> ";
            }
        }

        /**
         * Arabic text cleaning function that delegates to the centralized filter implementation
         * @param {string} arabicText - The Arabic text to clean
         * @param {string} mode - Cleaning mode: 'display' for UI display, 'search' for indexing
         * @returns {string} - Cleaned Arabic text
         */
        function cleanArabicForDisplay(arabicText) {
            // Use the injected $filter service to avoid circular dependency
            if (!arabicText) return '';
            
            try {
                // Check if filter is available before using it
                if ($filter && typeof $filter === 'function') {
                    var cleanArabicFilter = $filter('cleanArabic');
                    if (cleanArabicFilter && typeof cleanArabicFilter === 'function') {
                        return cleanArabicFilter(arabicText, 'display');
                    }
                }
                
                console.warn('🔧 [QURAN-SERVICE] cleanArabic filter not available, returning original text');
                return arabicText;
            } catch (error) {
                console.error('🔧 [QURAN-SERVICE] Error in cleanArabicForDisplay:', error);
                return arabicText;
            }
        }
        //#endregion
    }
})();