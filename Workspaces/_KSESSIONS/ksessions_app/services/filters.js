(function () {
    "use strict";

    var app = angular.module("app");

    //data-ng-repeat="summary in vm.cm.currentSession.summary | orderObjectBy:'jumpLocation': false "
    app.filter("orderObjectBy", function () {
        return function (items, field, reverse) {
            return items && items.length ? items.sortBy(field, reverse) : items;
        };
    });

    //data-ng-repeat="album in vm.albums | filterByName : vm.search.albumName "
    app.filter("filterByName", ["common", function (common) {
        return function (items, field, reverse) {
            var result = _.filter(items, function (i) {
                var predicate = common.contains(i.name.toLowerCase(), field.toLowerCase());
                return predicate;
            });
            return result;
        };
    }]);

    //data-ng-repeat="summary in vm.cm.currentSession.summary | orderByMultipleFields:'sequence': 'jumpLocation': false "
    app.filter("orderByMultipleFields", function () {
        return function (items, field1, field2, reverse) {
            var field = field1 || field2;
            return items && items.length ? items.sortBy(field, reverse) : items;
        };
    });

    //data-ng-repeat="session in vm.album.sessions | filterOutExpired"
    app.filter("filterOutExpired", function () {
        return function (resultSet) {
            var filtered = [];
            angular.forEach(resultSet, function (d) {
                if (!d.hasExpired) {
                    filtered.push(d);
                }
            });
            return filtered;
        };
    });

    //data-ng-repeat="q in hub.user.questionList | filterOutAnswered "
    app.filter("filterOutAnswered", function () {
        return function (resultSet) {
            var filtered = [];
            angular.forEach(resultSet, function (d) {
                if (!d.isAnswered) {
                    filtered.push(d);
                }
            });
            return filtered;
        };
    });
    
    app.filter("filterSelectables", function () {
        return function (resultSet) {
            var filtered = [];
            angular.forEach(resultSet, function (d) {
                if (d.isSelectable) {
                    filtered.push(d);
                }
            });
            return filtered;
        };
    });

    app.filter("filterNonSelectables", function () {
        return function (resultSet) {
            var filtered = [];
            angular.forEach(resultSet, function (d) {
                if (!d.isSelectable) {
                    filtered.push(d);
                }
            });
            return filtered;
        };
    });

    app.filter("convertToTime", ["common",function (common) {
        return function (item) {
            return common.secondsToTime(item);
        };
    }]);

    /**
     * Unified Arabic text cleaning function with configurable modes
     * This is the centralized implementation used throughout the application
     * @param {string} arabicText - The Arabic text to clean
     * @param {string} mode - Cleaning mode: 'display' for UI display, 'search' for indexing
     * @returns {string} - Cleaned Arabic text
     */
    function cleanArabicText(arabicText, mode) {
        if (!arabicText) {
            return arabicText;
        }

        mode = mode || 'display';
        var text = arabicText;

        if (mode.toLowerCase() === 'search') {
            // Comprehensive cleaning for search/indexing
            var searchUnicodes = [
                '\u064B', '\u064C', '\u064D', '\u064E', '\u064F', '\u0650', '\u0651',
                '\u0652', '\u0653', '\u0654', '\u0655', '\u0656', '\u0657', '\u0658', '\u0659',
                '\u065A', '\u065B', '\u065C', '\u065D', '\u065E',
                '\u0600', '\u0601', '\u0602', '\u0603', '\u060C', '\u060D', '\u060E', '\u060F',
                '\u0610', '\u0611', '\u0612', '\u0613', '\u0614', '\u0615',
                '\u061B', '\u061E', '\u06DA', '\u06E6', '\u06ED', '\u06DF', '\u06E2', '\u06D6', '\u06D7'
            ];
            
            for (var i = 0; i < searchUnicodes.length; i++) {
                text = text.replace(new RegExp(searchUnicodes[i], 'g'), '');
            }
            
            // Normalize letter variants
            // ALFs
            text = text.replace(/\u0671/g, '\u0627');
            text = text.replace(/\u0622/g, '\u0627');
            text = text.replace(/\u0623/g, '\u0627');
            text = text.replace(/\u0625/g, '\u0627');
            text = text.replace(/\u0670/g, '\u0627');
            text = text.replace(/\u0672/g, '\u0627');
            text = text.replace(/\u0673/g, '\u0627');
            text = text.replace(/\u0675/g, '\u0627');
            // WAWs
            text = text.replace(/\u0624/g, '\u0648');
            text = text.replace(/\u0676/g, '\u0648');
            text = text.replace(/\u0677/g, '\u0648');
            // YAs
            text = text.replace(/\u0626/g, '\u06CC');
            text = text.replace(/\u0649/g, '\u06CC');
            text = text.replace(/\u064A/g, '\u06CC');
            text = text.replace(/\u0678/g, '\u06CC');
            // Ta and Ha marboota
            text = text.replace(/\u0629/g, 'ۃ');
            text = text.replace(/\u0647/g, 'ہ');
        } else {
            // Display cleaning (selective diacritics removal, preserving ۖ)
            text = text.replace(/\u06DA/g, ''); // ۚ - Arabic Small High Seen
            // ۖ (U+06D6) - Arabic Small High Ligature Sad with Lam with Alef Maksura - PRESERVED
            text = text.replace(/\u06E6/g, ''); // ۦ - Arabic Small High Yeh
            text = text.replace(/\u06DB/g, ''); // ۛ - Arabic Small High Three Dots
            text = text.replace(/\u06D7/g, ''); // ۗ - Arabic Small High Zain
            text = text.replace(/\u06E5/g, ''); // ۥ - Arabic Small Waw Above
            text = text.replace(/\u0653/g, ''); // ٓ - Arabic Maddah Above
            text = text.replace(/\u0650/g, ''); // ِ - Arabic Kasra
        }
        
        // Common cleanup for both modes
        // Remove various Unicode spaces and special characters
        text = text.replace(/\u00A0/g, ''); // Non-breaking space
        text = text.replace(/\u2000/g, ''); // En quad
        text = text.replace(/\u2001/g, ''); // Em quad
        text = text.replace(/\u2002/g, ''); // En space
        text = text.replace(/\u2003/g, ''); // Em space
        text = text.replace(/\u2004/g, ''); // Three-per-em space
        text = text.replace(/\u2005/g, ''); // Four-per-em space
        text = text.replace(/\u2006/g, ''); // Six-per-em space
        text = text.replace(/\u2007/g, ''); // Figure space
        text = text.replace(/\u2008/g, ''); // Punctuation space
        text = text.replace(/\u2009/g, ''); // Thin space
        text = text.replace(/\u200A/g, ''); // Hair space
        text = text.replace(/\u200B/g, ''); // Zero width space
        text = text.replace(/\u200C/g, ''); // Zero width non-joiner
        text = text.replace(/\u200D/g, ''); // Zero width joiner
        text = text.replace(/\u202F/g, ''); // Narrow no-break space
        text = text.replace(/\u205F/g, ''); // Medium mathematical space
        text = text.replace(/\u3000/g, ''); // Ideographic space
        
        // Clean up multiple spaces
        text = text.replace(/\s{2,}/g, ' ').trim();
        
        return text;
    }

    // Clean Arabic text for display by removing specific diacritical marks
    app.filter("cleanArabic", function () {
        return function (arabicText, mode) {
            return cleanArabicText(arabicText, mode || 'display');
        };
    });

    // Add a search-specific filter for potential future use
    app.filter("cleanArabicForSearch", function () {
        return function (arabicText) {
            return cleanArabicText(arabicText, 'search');
        };
    });

    // Range filter for pagination
    app.filter("range", function () {
        return function (input, total) {
            total = parseInt(total);
            for (var i = 1; i <= total; i++) {
                input.push(i);
            }
            return input;
        };
    });
    
})();