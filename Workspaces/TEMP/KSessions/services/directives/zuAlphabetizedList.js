(function () {
    "use strict";

    // Define the 'app' module. If your application already has an 'app' module,
    // you should remove the '[]' from here (e.g., angular.module("app"))
    // to avoid re-defining it and potentially losing other configurations.
    angular.module("app")
        .directive("zuAlphabetizedList", ["$stateParams", "common", zuAlphabetizedList]);

    /**
     * This directive displays a list of items from a JSON array in a table.
     * It provides an alphabet filter (A-Z) based on the first letter of the 'display' field,
     * and a dynamic text search filter that searches both 'display' and 'popup' fields.
     * The table is sortable by the 'display' field by default.
     *
     * Usage:
     * <div my-custom-list data="myControllerData"></div>
     *
     * Example Data Structure:
     * [
     * { id: 1, display: "Apple", popup: "A red fruit" },
     * { id: 2, display: "Banana", popup: "A yellow fruit" }
     * ]
     */
    function zuAlphabetizedList($stateParams, common) {
        var directive = {
            link: link,          // Link function for directive logic
            restrict: "A",       // Restrict to attribute usage (e.g., <div my-custom-list>)
            replace: true,       // Replace the directive element with the template's content
            templateUrl: "/app/services/directives/zuAlphabetizedList.html", // Path to the directive's HTML template
            scope: {
                data: "="        // Bidirectional binding for the input JSON array
            }
        };
        return directive;

        /**
         * The link function is where the directive's logic resides.
         * @param {object} scope The directive's isolated scope.
         * @param {object} element The jqLite wrapped element that this directive matches.
         * @param {object} attrs A hash of normalized attributes.
         */
        function link(scope, element, attrs, controller) {
            // Initialize filter models
            scope.searchText = "";       // Model for the text search input
            scope.selectedAlphabet = ""; // Model for the currently selected alphabet character
            scope.availableAlphabets = []; // Array to store unique first letters for alphabet filter

            /**
             * Generates the list of available alphabet characters based on the 'display' property
             * of the input data. Only includes letters that are actually present.
             * @param {Array} data The array of items to process.
             */
            function generateAvailableAlphabets(data) {
                const uniqueFirstLetters = new Set(); // Use a Set to store unique letters
                if (data && data.length > 0) {
                    data.forEach(item => {
                        // Ensure 'display' property exists, is a string, and is not empty
                        if (item.display && typeof item.display === 'string' && item.display.length > 0) {
                            uniqueFirstLetters.add(item.display.charAt(0).toUpperCase()); // Get first letter, convert to uppercase
                        }
                    });
                }
                // Convert the Set to an Array and sort it alphabetically
                scope.availableAlphabets = Array.from(uniqueFirstLetters).sort();
            }

            // Watch for changes in the input 'data' array.
            // Using $watchCollection for shallow watching of array items.
            scope.$watchCollection("data", function (newData, oldData) {
                if (newData !== oldData) { // Only update if data has actually changed
                    generateAvailableAlphabets(newData); // Regenerate alphabet list
                    // Clear filters when data changes to ensure all new data is visible
                    scope.searchText = "";
                    scope.selectedAlphabet = "";
                }
            });

            // Initial generation of alphabets when the directive loads.
            // This handles cases where `data` is already populated on initial load.
            generateAvailableAlphabets(scope.data);

            /**
             * Filter function for the text search input.
             * @param {object} item The current item being evaluated by the filter.
             * @returns {boolean} True if the item matches the search text, false otherwise.
             */
            scope.textFilter = function (item) {
                if (!scope.searchText) {
                    return true; // If no search text, all items pass this filter
                }
                const lowerCaseSearchText = scope.searchText.toLowerCase();
                // Check if the search text is included in 'display' or 'popup' properties (case-insensitive)
                const displayMatch = item.display && String(item.display).toLowerCase().includes(lowerCaseSearchText);
                const popupMatch = item.popup && String(item.popup).toLowerCase().includes(lowerCaseSearchText);
                return displayMatch || popupMatch; // Return true if either matches
            };

            /**
             * Filter function for the alphabet selection.
             * @param {object} item The current item being evaluated by the filter.
             * @returns {boolean} True if the item's display name starts with the selected alphabet, false otherwise.
             */
            scope.alphabetFilter = function (item) {
                if (!scope.selectedAlphabet) {
                    return true; // If no alphabet is selected, all items pass this filter
                }
                // Check if the item's display name starts with the selected alphabet (case-insensitive)
                return item.display && String(item.display).charAt(0).toUpperCase() === scope.selectedAlphabet;
            };

            /**
             * Sets the currently selected alphabet for filtering.
             * @param {string} char The alphabet character to filter by.
             */
            scope.filterByAlphabet = function (char) {
                scope.selectedAlphabet = char;
            };

            /**
             * Clears the currently applied alphabet filter.
             */
            scope.clearAlphabetFilter = function () {
                scope.selectedAlphabet = "";
            };
        }
    }
})();