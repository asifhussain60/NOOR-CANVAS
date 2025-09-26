(function () {
    "use strict";

    angular.module("app").directive("zuHubEtymologyManager", ["bootstrap.dialog", "common", "hubService", "datacontext", zuHubEtymologyManager]);

    function zuHubEtymologyManager(dlg, common, hubService, datacontext) {

        /***************************************************************************************
        * Usage: <div data-zu-hub-etymology-manager="" data-show-publish="false" data-is-signalr="false" data-enhanced-mode="true"></div>
        * 
        * Description: Enhanced Etymology Management Directive - Complete CRUD operations for Arabic roots and derivatives
        *              with advanced search, bulk operations, and comprehensive logging
        * 
        * Features:
        *   - Advanced search with full-text capabilities
        *   - Streamlined CRUD operations with validation
        *   - Bulk editing and operations
        *   - Token generation for derivatives (D|{derivativeId})
        *   - Real-time publishing via SignalR
        *   - Comprehensive error handling and logging
        *   - Arabic text support with RTL
        *   - Responsive design with Material Design styling
        * 
        * Gotcha(s): 
        *   - Requires etymology.css for styling
        *   - Uses Clipboard.js for token copying
        *   - Arabic inputs require special font handling
        *   - Search debouncing for performance
        ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: false,
            templateUrl: "/app/features/hub/directives/zuHubEtymologyManager.html?final=" + Date.now(),
            scope: {
                showPublish: "@",
                isSignalr: "@",
                enhancedMode: "@"
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            var getLogFn = common.logger.getLogFn;
            var log = getLogFn("zuHubEtymologyManager");
            var logSuccess = getLogFn("zuHubEtymologyManager", "success");
            var logError = getLogFn("zuHubEtymologyManager", "error");
            
            // Initialize clipboard for token copying
            var tokenCopy = new Clipboard(".etymology-token-copy-btn");
            tokenCopy.on("success", function (e) { 
                // Removed clipboard success toast - not critical
                common.$timeout(function () { e.clearSelection(); }, 500); 
            });
            tokenCopy.on("error", function (e) {
                logError("Failed to copy token to clipboard", "zuHubEtymologyManager");
            });

            scope.hs = hubService;

            // Enhanced Etymology Management Object
            scope.etym = {
                // UI State
                isEnhancedMode: Boolean(scope.enhancedMode === "true"),
                isSignalR: Boolean(scope.isSignalr === "true"),
                displayPublish: Boolean(scope.showPublish === "true"),
                isLoading: false,
                viewMode: 'search', // 'search', 'create', 'edit'
                isAddingNew: false, // Flag to track when user is adding new etymology
                
                // Search & Results
                searchTerm: "",
                searchResults: [],
                totalResults: 0,
                currentPage: 1,
                pageSize: 20,
                noResult: false,
                
                // Current Etymology Data
                currentEtymology: getNewEtymology(),
                derivatives: [],
                selectedDerivatives: [],
                
                // Lists and References
                etymologyList: [],
                recentEtymologies: [],
                
                // UI Helpers
                showEtymologyForm: false,
                showDerivativesTable: false,
                isDropDownOpen: false,
                allSelected: false,
                
                // Math utilities for template
                Math: Math,
                
                // Calculated properties
                get totalPages() {
                    return Math.ceil(this.totalResults / this.pageSize);
                },
                
                // Helper methods
                getPageNumbers: function() {
                    var pages = [];
                    var totalPages = Math.ceil(this.totalResults / this.pageSize);
                    for (var i = 1; i <= totalPages; i++) {
                        pages.push(i);
                    }
                    return pages;
                },
                
                // Enhanced Methods - Original
                searchEtymologies: searchEtymologies,
                toggleDerivatives: toggleDerivatives,
                selectEtymology: selectEtymology,
                createNewEtymology: createNewEtymology,
                saveEtymology: saveEtymology,
                deleteEtymology: deleteEtymology,
                deleteRoot: deleteRoot,
                cancelEdit: cancelEdit,
                
                // NEW UNIFIED METHODS
                searchEtymologyUnified: searchEtymologyUnified,
                selectEtymologyUnified: selectEtymologyUnified,
                createNewEtymologyUnified: createNewEtymologyUnified,
                saveEtymologyUnified: saveEtymologyUnified,
                clearFormUnified: clearFormUnified,
                deleteRootUnified: deleteRootUnified,
                onSearchKeypress: onSearchKeypress,
                clearSearch: clearSearch,
                
                // NEW UNIFIED DERIVATIVE METHODS
                addNewDerivativeUnified: addNewDerivativeUnified,
                saveDerivativeUnified: saveDerivativeUnified,
                deleteDerivativeUnified: deleteDerivativeUnified,
                markDerivativeModified: markDerivativeModified,
                
                // Derivative Methods
                addBlankDerivative: addBlankDerivative,
                addNewDerivative: addNewDerivative,
                saveDerivatives: saveDerivatives,
                deleteDerivative: deleteDerivative,
                bulkUpdateDerivatives: bulkUpdateDerivatives,
                
                // Selection Methods
                toggleDerivativeSelection: toggleDerivativeSelection,
                toggleAllDerivatives: toggleAllDerivatives,
                getSelectedDerivatives: getSelectedDerivatives,
                
                // Utility Methods
                reset: reset,
                refresh: refresh,
                exportData: exportData,
                
                // Publishing Methods
                publish: publish,
                onPreloaderEtymologyClick: onPreloaderEtymologyClick,
                
                // Pagination
                nextPage: nextPage,
                previousPage: previousPage,
                goToPage: goToPage,
                
                // Validation
                validateEtymology: validateEtymology,
                validateDerivative: validateDerivative
            };

            var etym = scope.etym;

            // Initialize directive
            initializeDirective();

            // 🔄 SYNC ROOT WORD FIELDS: Watch rootWord and sync to rootWordUnfmt
            scope.$watch('etym.currentEtymology.rootWord', function(newValue, oldValue) {
                if (newValue !== oldValue && scope.etym && scope.etym.currentEtymology) {
                    scope.etym.currentEtymology.rootWordUnfmt = newValue || "";
                }
            });

            function initializeDirective() {
                // Removed unnecessary initialization logging
                
                // Load initial data
                Promise.all([
                    loadEtymologyList(),
                    loadRecentEtymologies()
                ]).then(function() {
                    // Removed initialization success toast - not critical
                }).catch(function(error) {
                    logError("Failed to initialize Etymology Manager: " + error.message, "zuHubEtymologyManager");
                });
            }

            function getNewEtymology() {
                return {
                    rootId: 0,
                    rootWord: "",
                    rootWordUnfmt: "",
                    rootTransliteration: "",
                    meaningEnglish: "",
                    meaningArabic: "",
                    definition: "",
                    derivatives: [],
                    createdDate: "",
                    lastModifiedDate: "",
                    lastModifiedBy: "",
                    isActive: true
                };
            }

            function getNewDerivative() {
                return {
                    derivativeId: 0,
                    rootId: etym.currentEtymology.rootId,
                    derivative: "",
                    meaningEnglish: "",
                    meaningArabic: "",
                    definition: "",
                    transliteration: "",
                    grammar: "",
                    sortOrder: etym.derivatives.length + 1,
                    isSelected: false,
                    isHighlighted: false,
                    isActive: true
                };
            }

            // Search functionality
            function searchEtymologies() {
                // UNIFIED MODE: Skip original search if unified mode is active
                if (scope.enhancedMode === 'true' || scope.enhancedMode === true) {
                    return;
                }
                
                if (!etym.searchTerm || etym.searchTerm.length < 2) {
                    etym.noResult = false;
                    return;
                }

                etym.isLoading = true;
                // Removed unnecessary search logging

                var searchCriteria = {
                    searchTerm: etym.searchTerm,
                    pageNumber: etym.currentPage,
                    pageSize: etym.pageSize
                };

                datacontext.searchEtymology(searchCriteria).then(function (response) {
                    // The datacontext returns the API response directly, not wrapped in .data
                    etym.searchResults = response.results || [];
                    etym.totalResults = response.totalCount || 0;
                    etym.noResult = etym.searchResults.length === 0;
                    etym.isLoading = false;
                    
                    // Search completed successfully (removed annoying toast notification)
                }).catch(function(error) {
                    etym.isLoading = false;
                    etym.noResult = true;
                    logError("Search failed: " + (error.message || error), "zuHubEtymologyManager");
                });
            }

            // Toggle derivatives display and load them if needed
            function toggleDerivatives(result) {
                console.log('[ETYMOLOGY-DIRECTIVE] 🔄 toggleDerivatives called for result:', {
                    rootId: result.rootId,
                    currentShowState: result.showDerivatives,
                    derivativeCount: result.derivativeCount,
                    hasDerivatives: !!result.derivatives
                });
                
                // Toggle the display state
                result.showDerivatives = !result.showDerivatives;
                
                // If showing derivatives and they haven't been loaded yet, load them
                if (result.showDerivatives && (!result.derivatives || result.derivatives.length === 0)) {
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔄 Loading derivatives for rootId:', result.rootId);
                    result.loadingDerivatives = true;
                    
                    datacontext.getRootWithDerivatives(result.rootId).then(function (response) {
                        console.log('[ETYMOLOGY-DIRECTIVE] 🔄 FULL API RESPONSE:', response);
                        console.log('[ETYMOLOGY-DIRECTIVE] 🔄 Response keys:', Object.keys(response || {}));
                        console.log('[ETYMOLOGY-DIRECTIVE] 🔄 Response.data keys:', Object.keys(response.data || {}));
                        console.log('[ETYMOLOGY-DIRECTIVE] 🔄 Raw response.data:', response.data);
                        
                        // Handle the response structure correctly
                        var apiData = response.data || response;
                        console.log('[ETYMOLOGY-DIRECTIVE] 🔄 ApiData structure:', {
                            type: typeof apiData,
                            keys: Object.keys(apiData || {}),
                            derivativesProperty: apiData.derivatives,
                            DerivativesProperty: apiData.Derivatives,
                            isArray: Array.isArray(apiData)
                        });
                        
                        // Try different possible derivative locations
                        var derivatives = apiData.derivatives || apiData.Derivatives || apiData || [];
                        console.log('[ETYMOLOGY-DIRECTIVE] 🔄 Extracted derivatives:', {
                            derivativesLength: derivatives.length,
                            firstDerivative: derivatives.length > 0 ? derivatives[0] : null,
                            firstDerivativeKeys: derivatives.length > 0 ? Object.keys(derivatives[0] || {}) : []
                        });
                        
                        result.derivatives = derivatives;
                        result.loadingDerivatives = false;
                        
                        console.log('[ETYMOLOGY-DIRECTIVE] ✅ Final result.derivatives:', result.derivatives);
                        
                        // Removed derivatives loading toast - not critical for user
                    }).catch(function(error) {
                        console.error('[ETYMOLOGY-DIRECTIVE] ❌ Failed to load derivatives:', error);
                        result.loadingDerivatives = false;
                        result.derivatives = [];
                        logError("Failed to load derivatives: " + (error.message || error), "zuHubEtymologyManager");
                    });
                } else {
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔄 Derivatives already loaded or hiding, no API call needed');
                }
            }

            function selectEtymology(etymology) {
                // Removed unnecessary selection logging
                
                etym.currentEtymology = angular.copy(etymology);
                etym.viewMode = 'edit';
                etym.showEtymologyForm = true;
                
                // Load derivatives for selected etymology
                loadDerivatives(etymology.rootId);
            }

            function createNewEtymology() {
                console.log('[ETYMOLOGY-DIRECTIVE] 🚀 Creating new etymology entry');
                console.log('[ETYMOLOGY-DIRECTIVE] 🔧 Template condition check: etym.viewMode should be "add" for modern derivatives to show');
                // Removed unnecessary creation toast
                
                etym.currentEtymology = getNewEtymology();
                etym.derivatives = []; // Initialize empty array for derivatives
                etym.viewMode = 'add';  // Match the template condition
                etym.showEtymologyForm = true;
                etym.showDerivativesTable = false;
                
                console.log('[ETYMOLOGY-DIRECTIVE] ✅ View mode set to:', etym.viewMode);
                console.log('[ETYMOLOGY-DIRECTIVE] ✅ showEtymologyForm set to:', etym.showEtymologyForm);
                console.log('[ETYMOLOGY-DIRECTIVE] ✅ Derivatives initialized:', etym.derivatives);
                console.log('[ETYMOLOGY-DIRECTIVE] ✅ CurrentEtymology:', etym.currentEtymology);
                console.log('[ETYMOLOGY-DIRECTIVE] 🎯 Template should now show derivatives-section-modern because viewMode = "add"');
                console.log('[ETYMOLOGY-DIRECTIVE] 🎯 Modern interface elements should be visible: Add Derivative button, empty state');
                
                // CRITICAL: Verify scope binding
                console.log('[ETYMOLOGY-DIRECTIVE] 🔍 SCOPE VERIFICATION:');
                console.log('[ETYMOLOGY-DIRECTIVE] 🔍 scope.etym.viewMode =', scope.etym.viewMode);
                console.log('[ETYMOLOGY-DIRECTIVE] 🔍 etym === scope.etym =', etym === scope.etym);
                console.log('[ETYMOLOGY-DIRECTIVE] 🔍 Template condition test =', scope.etym.viewMode === 'add' || scope.etym.viewMode === 'edit');
                console.log('[ETYMOLOGY-DIRECTIVE] 🔍 scope.etym object:', scope.etym);
                
                // Use timeout to trigger view update without $apply conflicts
                common.$timeout(function() {
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔄 Template updated via $timeout');
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 POST-CREATION DEBUG:');
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 etym.viewMode =', etym.viewMode);
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 Template condition (etym.viewMode === "add") =', (etym.viewMode === 'add'));
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 Modern derivatives section should be visible =', (etym.viewMode === 'add' || etym.viewMode === 'edit'));
                    
                    // Check if main form section exists first
                    var addEditForm = document.querySelector('div.row[ng-if*="etym.viewMode"]');
                    var formSection = document.querySelector('.form-section-material');
                    var etymologyForm = document.querySelector('form[name="etymologyForm"]');
                    
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 FORM STRUCTURE CHECK:');
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 Add/Edit form row exists:', !!addEditForm);
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 .form-section-material exists:', !!formSection);
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 form[name="etymologyForm"] exists:', !!etymologyForm);
                    
                    if (formSection) {
                        console.log('[ETYMOLOGY-DIRECTIVE] 🔍 form-section-material display:', window.getComputedStyle(formSection).display);
                        console.log('[ETYMOLOGY-DIRECTIVE] 🔍 form-section-material visibility:', window.getComputedStyle(formSection).visibility);
                    }
                    
                    // Check DOM elements
                    var derivativesSection = document.querySelector('.derivatives-section-modern');
                    var addButton = document.querySelector('.add-derivative-btn');
                    var emptyState = document.querySelector('.empty-derivatives-modern');
                    
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 MODERN DERIVATIVES CHECK:');
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 .derivatives-section-modern exists:', !!derivativesSection);
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 .add-derivative-btn exists:', !!addButton);
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 .empty-derivatives-modern exists:', !!emptyState);
                    
                    if (derivativesSection) {
                        console.log('[ETYMOLOGY-DIRECTIVE] 🔍 derivatives-section-modern display:', window.getComputedStyle(derivativesSection).display);
                        console.log('[ETYMOLOGY-DIRECTIVE] 🔍 derivatives-section-modern visibility:', window.getComputedStyle(derivativesSection).visibility);
                    }
                    
                    // Log complete form structure for debugging
                    var allEtymologyElements = document.querySelectorAll('[class*="etym"], [class*="derivative"], form[name="etymologyForm"]');
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 All etymology-related elements count:', allEtymologyElements.length);
                    
                    if (allEtymologyElements.length > 0) {
                        console.log('[ETYMOLOGY-DIRECTIVE] 🔍 Etymology elements found:', Array.from(allEtymologyElements).map(el => el.className || el.tagName));
                    }
                }, 100);
                
                // Focus on first input
                common.delayedFocus("#etymology-root-word");
            }

            function saveEtymology() {
                if (!validateEtymology(etym.currentEtymology)) {
                    return;
                }

                etym.isLoading = true;
                var isNew = etym.currentEtymology.rootId === 0;
                
                // Removed unnecessary save logging

                // Include derivatives with the root for saving
                var rootWithDerivatives = angular.copy(etym.currentEtymology);
                rootWithDerivatives.derivatives = etym.derivatives || [];
                
                console.log('[ETYMOLOGY-DIRECTIVE] Saving root with derivatives:', {
                    rootId: rootWithDerivatives.rootId,
                    rootWord: rootWithDerivatives.rootWord,
                    derivativesCount: rootWithDerivatives.derivatives.length,
                    derivatives: rootWithDerivatives.derivatives
                });

                datacontext.addUpdateRootWord(rootWithDerivatives).then(function (response) {
                    var savedEtymology = response.data;
                    etym.currentEtymology = savedEtymology;
                    
                    // Update derivatives from saved result
                    if (savedEtymology && savedEtymology.derivatives) {
                        etym.derivatives = savedEtymology.derivatives;
                    }
                    
                    if (isNew) {
                        etym.etymologyList.push(savedEtymology);
                        logSuccess("New etymology created with ID: " + savedEtymology.rootId, "zuHubEtymologyManager");
                    } else {
                        // Update existing entry in list
                        var existingIndex = etym.etymologyList.findIndex(function(e) { return e.rootId === savedEtymology.rootId; });
                        if (existingIndex >= 0) {
                            etym.etymologyList[existingIndex] = savedEtymology;
                        }
                        logSuccess("Etymology updated: " + savedEtymology.rootTransliteration, "zuHubEtymologyManager");
                    }
                    
                    etym.showDerivativesTable = true;
                    etym.isLoading = false;
                    
                    // Load derivatives to ensure we have the latest data
                    loadDerivatives(savedEtymology.rootId);
                    
                }).catch(function(error) {
                    etym.isLoading = false;
                    logError("Failed to save etymology: " + error.message, "zuHubEtymologyManager");
                });
            }

            function cancelEdit() {
                console.log('[ETYMOLOGY-DIRECTIVE] 🚀 cancelEdit called');
                etym.viewMode = 'search';
                etym.showEtymologyForm = false;
                etym.currentEtymology = null;
                etym.derivatives = [];
                console.log('[ETYMOLOGY-DIRECTIVE] ✅ Edit cancelled, returned to search mode');
                // Removed unnecessary cancel toast
            }

            function deleteEtymology() {
                if (!etym.currentEtymology || !etym.currentEtymology.rootId) {
                    logError("No etymology selected for deletion", "zuHubEtymologyManager");
                    return;
                }

                var etymologyName = etym.currentEtymology.rootTransliteration || "etymology";
                
                dlg.deleteDialog("etymology", etymologyName).then(function (result) {
                    if (result === "ok") {
                        // Removed unnecessary delete logging
                        
                        var rootId = etym.currentEtymology.rootId;
                        datacontext.deleteRoot(rootId).then(function (response) {
                            if (response.data) {
                                // Remove from list
                                etym.etymologyList = etym.etymologyList.filter(function(e) { return e.rootId !== rootId; });
                                
                                // Reset form
                                reset();
                                
                                logSuccess("Etymology deleted successfully: " + etymologyName, "zuHubEtymologyManager");
                            }
                        }).catch(function(error) {
                            logError("Failed to delete etymology: " + error.message, "zuHubEtymologyManager");
                        });
                    }
                });
            }

            function deleteRoot(result) {
                if (!result || !result.rootId) {
                    logError("No root selected for deletion", "zuHubEtymologyManager");
                    return;
                }

                var rootName = result.rootTransliteration || result.rootArabic || "root";
                
                dlg.deleteDialog("root", rootName).then(function (confirmResult) {
                    if (confirmResult === "ok") {
                        log("Deleting root: " + rootName, "zuHubEtymologyManager");
                        
                        datacontext.deleteRoot(result.rootId).then(function (response) {
                            if (response.data) {
                                // Remove from search results
                                etym.searchResults = etym.searchResults.filter(function(r) { return r.rootId !== result.rootId; });
                                
                                // Update totals
                                etym.totalResults = etym.searchResults.length;
                                
                                logSuccess("Root deleted successfully: " + rootName, "zuHubEtymologyManager");
                            }
                        }).catch(function(error) {
                            logError("Failed to delete root: " + error.message, "zuHubEtymologyManager");
                        });
                    }
                });
            }

            // Derivative methods
            function loadDerivatives(rootId) {
                // Removed unnecessary derivatives loading toast
                
                datacontext.getRootWithDerivatives(rootId).then(function (response) {
                    etym.derivatives = response.data.derivatives || [];
                    etym.showDerivativesTable = true;
                    
                    // Initialize selection state
                    etym.derivatives.forEach(function(d) {
                        d.isSelected = false;
                        d.isHighlighted = false;
                    });
                    
                    // Derivatives loaded successfully (removed annoying toast notification)
                }).catch(function(error) {
                    logError("Failed to load derivatives: " + error.message, "zuHubEtymologyManager");
                });
            }

            function addBlankDerivative() {
                if (!etym.currentEtymology.rootId) {
                    logError("Save etymology first before adding derivatives", "zuHubEtymologyManager");
                    return;
                }

                var newDerivative = getNewDerivative();
                etym.derivatives.push(newDerivative);
                
                // Removed unnecessary derivative addition toast
                
                // Focus on the new derivative input
                common.$timeout(function() {
                    var lastIndex = etym.derivatives.length - 1;
                    common.delayedFocus("#derivative-" + lastIndex + "-text");
                }, 100);
            }

            function addNewDerivative() {
                console.log('[ETYMOLOGY-DIRECTIVE] 🚀 addNewDerivative called');
                console.log('[ETYMOLOGY-DIRECTIVE] 🔧 Current viewMode:', etym.viewMode);
                console.log('[ETYMOLOGY-DIRECTIVE] 🔧 Current derivatives array:', etym.derivatives);
                console.log('[ETYMOLOGY-DIRECTIVE] 🔧 Template condition check: Should show modern derivatives section');
                
                // Initialize derivatives array if it doesn't exist
                if (!etym.derivatives) {
                    etym.derivatives = [];
                    console.log('[ETYMOLOGY-DIRECTIVE] ✅ Initialized empty derivatives array');
                } else {
                    console.log('[ETYMOLOGY-DIRECTIVE] ✅ Derivatives array already exists with', etym.derivatives.length, 'items');
                }

                var newDerivative = getNewDerivative();
                etym.derivatives.push(newDerivative);
                
                console.log('[ETYMOLOGY-DIRECTIVE] ✅ New derivative added:', newDerivative);
                console.log('[ETYMOLOGY-DIRECTIVE] ✅ Total derivatives now:', etym.derivatives.length);
                console.log('[ETYMOLOGY-DIRECTIVE] 🎯 Template should now show derivatives grid because derivatives.length > 0');
                console.log('[ETYMOLOGY-DIRECTIVE] 🎯 Empty state should be hidden because derivatives.length > 0');
                // Removed unnecessary new derivative toast
                
                // Use timeout instead of $apply to avoid digest cycle conflicts
                common.$timeout(function() {
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔄 Template updated via $timeout');
                    
                    // Debug after scope update
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 POST-ADD DEBUG:');
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 etym.derivatives.length =', etym.derivatives.length);
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 Template condition (etym.derivatives && etym.derivatives.length > 0) =', (etym.derivatives && etym.derivatives.length > 0));
                    
                    var derivativeCards = document.querySelectorAll('.derivative-card');
                    var emptyState = document.querySelector('.empty-derivatives-modern');
                    var quickAddSection = document.querySelector('.quick-add-section');
                    
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 DOM CHECK AFTER ADD:');
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 .derivative-card count:', derivativeCards.length);
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 .empty-derivatives-modern visible:', emptyState && window.getComputedStyle(emptyState).display !== 'none');
                    console.log('[ETYMOLOGY-DIRECTIVE] 🔍 .quick-add-section visible:', quickAddSection && window.getComputedStyle(quickAddSection).display !== 'none');
                }, 50);
                
                // Focus on the new derivative Arabic input after DOM update
                common.$timeout(function() {
                    var inputs = document.querySelectorAll('.derivative-card:last-child .arabic-input');
                    if (inputs.length > 0) {
                        inputs[0].focus();
                        console.log('[ETYMOLOGY-DIRECTIVE] 🎯 Focused on new derivative input');
                    } else {
                        console.log('[ETYMOLOGY-DIRECTIVE] ⚠️ Could not find derivative input to focus');
                    }
                }, 100);
            }

            function saveDerivatives() {
                if (!etym.currentEtymology.rootId || !etym.derivatives.length) {
                    logError("No derivatives to save", "zuHubEtymologyManager");
                    return;
                }

                etym.isLoading = true;
                // Removed unnecessary derivatives saving toast

                // Validate all derivatives
                var validDerivatives = etym.derivatives.filter(validateDerivative);
                
                if (validDerivatives.length === 0) {
                    etym.isLoading = false;
                    logError("No valid derivatives to save", "zuHubEtymologyManager");
                    return;
                }

                datacontext.saveDerivatives(etym.currentEtymology.rootId, validDerivatives).then(function (response) {
                    etym.derivatives = response.data || [];
                    etym.isLoading = false;
                    
                    logSuccess("Saved " + etym.derivatives.length + " derivatives successfully", "zuHubEtymologyManager");
                }).catch(function(error) {
                    etym.isLoading = false;
                    logError("Failed to save derivatives: " + error.message, "zuHubEtymologyManager");
                });
            }

            function deleteDerivative(derivative) {
                if (!derivative || derivative.derivativeId === undefined) {
                    logError("Invalid derivative for deletion", "zuHubEtymologyManager");
                    return;
                }

                var derivativeName = derivative.meaningEnglish || derivative.transliteration || "derivative";
                
                dlg.deleteDialog("derivative", derivativeName).then(function (result) {
                    if (result === "ok") {
                        // Removed unnecessary derivative deletion toast
                        
                        if (derivative.derivativeId > 0) {
                            // Delete from database
                            datacontext.deleteDerivative(derivative.derivativeId).then(function (response) {
                                if (response.data) {
                                    // Remove from local array
                                    etym.derivatives = etym.derivatives.filter(function(d) { return d.derivativeId !== derivative.derivativeId; });
                                    logSuccess("Derivative deleted successfully: " + derivativeName, "zuHubEtymologyManager");
                                }
                            }).catch(function(error) {
                                logError("Failed to delete derivative: " + error.message, "zuHubEtymologyManager");
                            });
                        } else {
                            // Remove new unsaved derivative
                            var index = etym.derivatives.indexOf(derivative);
                            if (index >= 0) {
                                etym.derivatives.splice(index, 1);
                                // Removed unnecessary unsaved derivative toast
                            }
                        }
                    }
                });
            }

            function bulkUpdateDerivatives() {
                var selectedDerivatives = getSelectedDerivatives();
                if (selectedDerivatives.length === 0) {
                    logError("No derivatives selected for bulk update", "zuHubEtymologyManager");
                    return;
                }

                // Removed unnecessary bulk update toast
                
                // This would open a bulk edit dialog - to be implemented
                // Bulk update functionality (removed annoying "next phase" toast notification)
            }

            // Selection methods
            function toggleDerivativeSelection(derivative) {
                derivative.isSelected = !derivative.isSelected;
                updateAllSelectedState();
                log("Selection toggled for derivative: " + (derivative.meaningEnglish || derivative.transliteration), "zuHubEtymologyManager");
            }

            function toggleAllDerivatives() {
                etym.allSelected = !etym.allSelected;
                etym.derivatives.forEach(function(d) {
                    d.isSelected = etym.allSelected;
                });
                log("All derivatives " + (etym.allSelected ? "selected" : "deselected"), "zuHubEtymologyManager");
            }

            function getSelectedDerivatives() {
                return etym.derivatives.filter(function(d) {
                    return d.isSelected === true;
                });
            }

            function updateAllSelectedState() {
                var selected = getSelectedDerivatives();
                etym.allSelected = selected.length === etym.derivatives.length && etym.derivatives.length > 0;
            }

            // Utility methods
            function reset() {
                log("Resetting etymology manager", "zuHubEtymologyManager");
                
                etym.currentEtymology = getNewEtymology();
                etym.derivatives = [];
                etym.searchTerm = "";
                etym.searchResults = [];
                etym.viewMode = 'search';
                etym.showEtymologyForm = false;
                etym.showDerivativesTable = false;
                etym.noResult = false;
                
                if (etym.isSignalR) {
                    hubService.pushToClientReset();
                }
            }

            function refresh() {
                log("Refreshing etymology data", "zuHubEtymologyManager");
                
                Promise.all([
                    loadEtymologyList()
                ]).then(function() {
                    logSuccess("Etymology data refreshed", "zuHubEtymologyManager");
                });
            }

            function loadEtymologyList() {
                return datacontext.getRoots().then(function (response) {
                    etym.etymologyList = response.data || [];
                    // Etymology list loaded successfully (removed annoying toast notification)
                }).catch(function(error) {
                    logError("Failed to load etymology list: " + error.message, "zuHubEtymologyManager");
                });
            }

            function loadRecentEtymologies() {
                // Use existing preloader data if available
                etym.recentEtymologies = hubService.host.preloader.roots || [];
                // Recent etymologies loaded successfully (removed annoying toast notification)
            }

            function exportData() {
                log("Exporting etymology data", "zuHubEtymologyManager");
                // Export functionality (removed annoying "next phase" toast notification)
            }

            // Publishing methods
            function publish() {
                var selectedDerivatives = getSelectedDerivatives();
                if (selectedDerivatives.length === 0) {
                    logError("No derivatives selected for publishing", "zuHubEtymologyManager");
                    return;
                }

                var clientEtymology = angular.copy(etym.currentEtymology);
                clientEtymology.derivatives = selectedDerivatives;
                
                if (etym.isSignalR) {
                    hubService.pushToClientRoots(clientEtymology);
                    logSuccess("Published " + selectedDerivatives.length + " derivatives to clients", "zuHubEtymologyManager");
                }
            }

            function onPreloaderEtymologyClick(etymology) {
                etym.searchTerm = etymology.rootWordUnfmt;
                selectEtymology(etymology);
                publish();
                log("Selected preloader etymology: " + etymology.rootTransliteration, "zuHubEtymologyManager");
            }

            // Pagination methods
            function nextPage() {
                if (etym.currentPage * etym.pageSize < etym.totalResults) {
                    etym.currentPage++;
                    searchEtymologies();
                }
            }

            function previousPage() {
                if (etym.currentPage > 1) {
                    etym.currentPage--;
                    searchEtymologies();
                }
            }

            function goToPage(page) {
                if (page >= 1 && page <= Math.ceil(etym.totalResults / etym.pageSize)) {
                    etym.currentPage = page;
                    searchEtymologies();
                }
            }

            // Validation methods
            function validateEtymology(etymology) {
                if (!etymology) {
                    logError("Etymology data is required", "zuHubEtymologyManager");
                    return false;
                }

                if (!etymology.rootWordUnfmt || etymology.rootWordUnfmt.trim() === "") {
                    logError("Root word (unformatted) is required", "zuHubEtymologyManager");
                    common.delayedFocus("#etymology-root-unfmt");
                    return false;
                }

                if (!etymology.rootTransliteration || etymology.rootTransliteration.trim() === "") {
                    logError("Root transliteration is required", "zuHubEtymologyManager");
                    common.delayedFocus("#etymology-root-transliteration");
                    return false;
                }

                return true;
            }

            function validateDerivative(derivative) {
                if (!derivative) return false;
                
                // At least one field must be filled
                return derivative.derivative || derivative.meaningEnglish || derivative.transliteration;
            }

            // Watch for search term changes with debouncing
            scope.$watch("etym.searchTerm", function(newVal, oldVal) {
                // UNIFIED MODE: Skip original watch if unified mode is active
                if (scope.enhancedMode === 'true' || scope.enhancedMode === true) {
                    console.log("[ETYMOLOGY-DIRECTIVE] 🔄 Skipping original search watch - unified mode active");
                    return;
                }
                
                if (newVal !== oldVal && newVal && newVal.length >= 2) {
                    common.debouncedThrottle("etymology-search", searchEtymologies, 500);
                } else if (!newVal || newVal.length < 2) {
                    etym.searchResults = [];
                    etym.noResult = false;
                }
            });

            // Watch for no result condition to trigger new etymology creation
            scope.$watch("etym.noResult", function(newResult, oldResult) {
                if (newResult && !angular.equals(newResult, oldResult) && etym.searchTerm) {
                    // Auto-populate new etymology with search term
                    etym.currentEtymology = getNewEtymology();
                    etym.currentEtymology.rootTransliteration = etym.searchTerm;
                    createNewEtymology();
                }
            });

            // ⚠️ TEMPORARY: Fill Test Data Function (DELETE BEFORE PRODUCTION!)
            function fillTestData() {
                console.log("[ETYMOLOGY-TEST] 🧪 Filling test data for Arabic root and derivatives");
                
                // Test Arabic roots with different patterns
                var testRoots = [
                    {
                        rootWord: "كتب",
                        rootWordUnfmt: "كتب", 
                        rootTransliteration: "k-t-b",
                        meaningEnglish: "To write, to record, to prescribe. This root is fundamental in Arabic and relates to all forms of writing, documentation, and recording.",
                        meaningArabic: "الكتابة والتسجيل",
                        derivatives: [
                            { derivative: "كتاب", meaningEnglish: "Book, scripture", meaningArabic: "مؤلف", transliteration: "kitaab", grammar: "noun (masculine)" },
                            { derivative: "كاتب", meaningEnglish: "Writer, scribe", meaningArabic: "مؤلف", transliteration: "kaatib", grammar: "active participle" },
                            { derivative: "مكتب", meaningEnglish: "Office, desk", meaningArabic: "مكان العمل", transliteration: "maktab", grammar: "noun of place" },
                            { derivative: "مكتبة", meaningEnglish: "Library, bookstore", meaningArabic: "مكان الكتب", transliteration: "maktaba", grammar: "noun of place (feminine)" },
                            { derivative: "كتابة", meaningEnglish: "Writing, script", meaningArabic: "فعل الكتابة", transliteration: "kitaaba", grammar: "verbal noun" }
                        ]
                    },
                    {
                        rootWord: "علم",
                        rootWordUnfmt: "علم",
                        rootTransliteration: "ʿ-l-m", 
                        meaningEnglish: "To know, to learn, to teach. This root encompasses all aspects of knowledge, learning, and education.",
                        meaningArabic: "المعرفة والتعلم",
                        derivatives: [
                            { derivative: "عالم", meaningEnglish: "Scholar, scientist, world", meaningArabic: "عارف", transliteration: "ʿaalim", grammar: "active participle" },
                            { derivative: "علوم", meaningEnglish: "Sciences, knowledge (plural)", meaningArabic: "المعارف", transliteration: "ʿuluum", grammar: "plural noun" },
                            { derivative: "معلم", meaningEnglish: "Teacher, instructor", meaningArabic: "مدرس", transliteration: "muʿallim", grammar: "active participle" },
                            { derivative: "تعليم", meaningEnglish: "Education, teaching", meaningArabic: "التدريس", transliteration: "taʿliim", grammar: "verbal noun" }
                        ]
                    },
                    {
                        rootWord: "حمد", 
                        rootWordUnfmt: "حمد",
                        rootTransliteration: "ḥ-m-d",
                        meaningEnglish: "To praise, to thank, to commend. This root expresses gratitude, appreciation, and commendation.",
                        meaningArabic: "الحمد والثناء",
                        derivatives: [
                            { derivative: "حمد", meaningEnglish: "Praise, gratitude", meaningArabic: "الشكر", transliteration: "ḥamd", grammar: "verbal noun" },
                            { derivative: "محمد", meaningEnglish: "Praised one (name)", meaningArabic: "المحمود", transliteration: "Muḥammad", grammar: "passive participle" },
                            { derivative: "أحمد", meaningEnglish: "More praised (name)", meaningArabic: "الأكثر حمداً", transliteration: "Aḥmad", grammar: "comparative" },
                            { derivative: "حامد", meaningEnglish: "One who praises", meaningArabic: "الشاكر", transliteration: "ḥaamid", grammar: "active participle" }
                        ]
                    }
                ];
                
                // Randomly select one test root
                var selectedRoot = testRoots[Math.floor(Math.random() * testRoots.length)];
                
                console.log("[ETYMOLOGY-TEST] 🎯 Selected test root:", selectedRoot.rootTransliteration);
                
                // Fill the main etymology data
                etym.currentEtymology.rootWord = selectedRoot.rootWord;
                etym.currentEtymology.rootWordUnfmt = selectedRoot.rootWordUnfmt;
                etym.currentEtymology.rootTransliteration = selectedRoot.rootTransliteration;
                etym.currentEtymology.meaningEnglish = selectedRoot.meaningEnglish;
                etym.currentEtymology.meaningArabic = selectedRoot.meaningArabic;
                
                // Clear existing derivatives
                etym.derivatives = [];
                
                // Add test derivatives
                selectedRoot.derivatives.forEach(function(testDerivative, index) {
                    var newDerivative = getNewDerivative();
                    newDerivative.derivative = testDerivative.derivative;
                    newDerivative.meaningEnglish = testDerivative.meaningEnglish;
                    newDerivative.meaningArabic = testDerivative.meaningArabic;
                    newDerivative.transliteration = testDerivative.transliteration;
                    newDerivative.grammar = testDerivative.grammar;
                    newDerivative.definition = "Test derivative #" + (index + 1) + " for development purposes";
                    
                    etym.derivatives.push(newDerivative);
                });
                
                console.log("[ETYMOLOGY-TEST] ✅ Test data populated:", {
                    rootWord: selectedRoot.rootWord,
                    rootTransliteration: selectedRoot.rootTransliteration,
                    derivativesCount: etym.derivatives.length,
                    derivatives: etym.derivatives.map(d => d.derivative)
                });
                
                logSuccess("🧪 Test data populated: " + selectedRoot.rootTransliteration + " with " + etym.derivatives.length + " derivatives", "zuHubEtymologyManager");
                
                // Force UI update only if not already in digest cycle
                if (!scope.$root.$$phase) {
                    scope.$apply();
                } else {
                    console.log("[ETYMOLOGY-TEST] 🔄 Already in digest cycle, skipping $apply");
                }
            }

            // Add toggleDerivatives function to scope for template access
            scope.toggleDerivatives = function(result) {
                console.log("[ETYMOLOGY-DIRECTIVE] 🔄 toggleDerivatives called for:", result.rootId);
                
                // Toggle the showDerivatives flag
                result.showDerivatives = !result.showDerivatives;
                
                // If showing derivatives and we don't have them loaded, load them
                if (result.showDerivatives && (!result.derivatives || result.derivatives.length === 0)) {
                    console.log("[ETYMOLOGY-DIRECTIVE] 🌿 Loading derivatives for root:", result.rootId);
                    
                    // Show loading state
                    result.loadingDerivatives = true;
                    result.derivatives = [];
                    
                    // Call the datacontext to load derivatives
                    datacontext.getEtymologyDerivatives(result.rootId).then(function(derivatives) {
                        console.log("[ETYMOLOGY-DIRECTIVE] 🌿 Derivatives loaded:", derivatives);
                        result.derivatives = derivatives || [];
                        result.loadingDerivatives = false;
                        
                        // Force UI update if not in digest cycle
                        if (!scope.$root.$$phase) {
                            scope.$apply();
                        }
                    }).catch(function(error) {
                        console.error("[ETYMOLOGY-DIRECTIVE] ❌ Error loading derivatives:", error);
                        logError("Failed to load derivatives for root " + result.rootId, "zuHubEtymologyManager");
                        result.derivatives = [];
                        result.loadingDerivatives = false;
                        
                        // Force UI update if not in digest cycle
                        if (!scope.$root.$$phase) {
                            scope.$apply();
                        }
                    });
                } else {
                    // If collapsing or derivatives already loaded, clear loading state
                    result.loadingDerivatives = false;
                }
                
                console.log("[ETYMOLOGY-DIRECTIVE] 🔄 Derivatives state:", {
                    rootId: result.rootId,
                    showDerivatives: result.showDerivatives,
                    derivativesCount: result.derivatives ? result.derivatives.length : 0
                });
            };

            // ==========================================
            // NEW UNIFIED METHODS FOR STREAMLINED UX
            // ==========================================
            
            function searchEtymologyUnified() {
                if (!etym.searchTerm || etym.searchTerm.trim().length < 2) {
                    etym.searchResults = [];
                    etym.totalResults = 0;
                    // Don't clear the form - just wait for more input
                    return;
                }
                
                etym.isLoading = true;
                
                var searchCriteria = {
                    searchTerm: etym.searchTerm.trim(),
                    pageNumber: 1,
                    pageSize: 10,
                    includeInactive: false
                };
                
                datacontext.searchEtymology(searchCriteria).then(function(response) {
                    // The datacontext returns the API response data directly
                    // API uses lowercase property names: results, totalCount
                    etym.searchResults = response.results || [];
                    etym.totalResults = response.totalCount || 0;
                    etym.isLoading = false;
                    
                    // UNIFIED APPROACH: Automatically select the first result
                    if (etym.searchResults.length > 0) {
                        selectEtymologyUnified(etym.searchResults[0]);
                    } else {
                        // Don't clear form - instead prepare it for creating a new etymology
                        createNewEtymologyUnified();
                    }
                    
                    // Search completed successfully (removed annoying toast notification)
                }).catch(function(error) {
                    etym.isLoading = false;
                    etym.searchResults = [];
                    etym.totalResults = 0;
                    logError("Search failed: " + error.message, "zuHubEtymologyManager");
                });
            }
            
            function clearSearch() {
                console.log("[ETYMOLOGY-UNIFIED] 🧹 Clearing search and form");
                
                // Clear search term and results
                etym.searchTerm = "";
                etym.searchResults = [];
                etym.totalResults = 0;
                etym.isAddingNew = false;
                
                // Reset current etymology to empty state
                etym.currentEtymology = getNewEtymology();
                etym.derivatives = [];
                
                // Focus on search input
                setTimeout(function() {
                    var searchInput = document.getElementById('searchTerm');
                    if (searchInput) {
                        searchInput.focus();
                    }
                }, 100);
                
                // Search cleared successfully (removed annoying toast notification)
            }
            
            function selectEtymologyUnified(etymology) {
                console.log("[ETYMOLOGY-UNIFIED] 🎯 Selecting etymology for unified form:", {
                    etymology: etymology,
                    rootId: etymology ? etymology.rootId : null,
                    rootWord: etymology ? etymology.rootArabic : null,
                    transliteration: etymology ? etymology.rootTransliteration : null,
                    timestamp: new Date().toISOString()
                });
                
                if (!etymology) {
                    console.error("[ETYMOLOGY-UNIFIED] ❌ No etymology provided to selectEtymologyUnified");
                    return;
                }
                
                // Reset the adding new flag since we're viewing an existing etymology
                etym.isAddingNew = false;
                
                // Load the root data into the form
                etym.currentEtymology = {
                    rootId: etymology.rootId || 0,
                    rootWord: etymology.rootArabic || etymology.rootWord || "",
                    rootWordUnfmt: etymology.rootArabic || etymology.rootWord || "",
                    rootTransliteration: etymology.rootTransliteration || "",
                    meaningEnglish: etymology.rootMeaning || etymology.meaningEnglish || "",
                    meaningArabic: etymology.meaningArabic || "",
                    definition: etymology.definition || "",
                    createdDate: etymology.createdDate || "",
                    lastModifiedDate: etymology.lastModifiedDate || "",
                    lastModifiedBy: etymology.lastModifiedBy || "",
                    isActive: etymology.isActive !== false
                };
                
                console.log("[ETYMOLOGY-UNIFIED] 📝 Current etymology mapped:", etym.currentEtymology);
                
                // Load derivatives for this root
                loadDerivativesUnified(etymology.rootId);
                
                console.log("[ETYMOLOGY-UNIFIED] ✅ Etymology loaded into unified form:", etym.currentEtymology);
                // Etymology loaded successfully (removed annoying toast notification)
            }
            
            function createNewEtymologyUnified(clearSearchTerm) {
                console.log("[ETYMOLOGY-UNIFIED] ➕ Creating new etymology in unified form");
                
                etym.currentEtymology = getNewEtymology();
                etym.derivatives = [];
                etym.isAddingNew = true; // Set flag to show form panel
                
                // Only clear search term if explicitly requested (manual new etymology)
                if (clearSearchTerm === true) {
                    etym.searchTerm = "";
                    etym.searchResults = [];
                    etym.totalResults = 0;
                    console.log("[ETYMOLOGY-UNIFIED] ✅ New etymology form ready");
                    // Form ready for new etymology (removed annoying toast notification)
                } else {
                    console.log("[ETYMOLOGY-UNIFIED] ✅ Form prepared for new etymology (keeping search term)");
                }
            }
            
            function saveEtymologyUnified() {
                console.log("[ETYMOLOGY-UNIFIED] 💾 Saving etymology and derivatives:", {
                    rootId: etym.currentEtymology.rootId,
                    rootWord: etym.currentEtymology.rootWord,
                    derivativesCount: etym.derivatives.length,
                    timestamp: new Date().toISOString()
                });
                
                if (!validateEtymologyUnified()) {
                    return;
                }
                
                etym.isLoading = true;
                var isNew = etym.currentEtymology.rootId === 0;
                
                // Include derivatives with the root for saving
                var rootWithDerivatives = angular.copy(etym.currentEtymology);
                rootWithDerivatives.derivatives = etym.derivatives || [];
                
                console.log("[ETYMOLOGY-UNIFIED] 📤 Sending save request:", rootWithDerivatives);
                
                datacontext.addUpdateRootWord(rootWithDerivatives).then(function(response) {
                    console.log("[ETYMOLOGY-UNIFIED] ✅ Save successful:", response);
                    
                    // Update the current etymology with the saved data
                    if (response && response.rootId) {
                        etym.currentEtymology.rootId = response.rootId;
                        etym.currentEtymology.lastModifiedDate = response.lastModifiedDate;
                        etym.currentEtymology.lastModifiedBy = response.lastModifiedBy;
                    }
                    
                    // Mark all derivatives as saved
                    angular.forEach(etym.derivatives, function(derivative) {
                        derivative.isModified = false;
                        derivative.isSaved = true;
                    });
                    
                    etym.isLoading = false;
                    
                    var message = isNew ? "Etymology created successfully" : "Etymology updated successfully";
                    logSuccess(message, "zuHubEtymologyManager");
                }).catch(function(error) {
                    console.error("[ETYMOLOGY-UNIFIED] ❌ Save failed:", error);
                    etym.isLoading = false;
                    logError("Failed to save etymology: " + error.message, "zuHubEtymologyManager");
                });
            }
            
            function clearFormUnified() {
                console.log("[ETYMOLOGY-UNIFIED] 🧹 Clearing unified form");
                
                etym.currentEtymology = getNewEtymology();
                etym.derivatives = [];
                etym.searchTerm = "";
                etym.searchResults = [];
                etym.totalResults = 0;
                
                console.log("[ETYMOLOGY-UNIFIED] ✅ Form cleared");
                // Form cleared successfully (removed annoying toast notification)
            }
            
            function onSearchKeypress(event) {
                if (event.keyCode === 13) { // Enter key
                    searchEtymologyUnified();
                }
            }
            
            function deleteRootUnified() {
                console.log("[ETYMOLOGY-UNIFIED] 🗑️ Deleting root:", etym.currentEtymology.rootId);
                
                if (!etym.currentEtymology.rootId || etym.currentEtymology.rootId === 0) {
                    logError("Cannot delete - no root ID", "zuHubEtymologyManager");
                    return;
                }
                
                var confirmMessage = "Are you sure you want to delete this root word and all its derivatives?\n\n" +
                                   "Root: " + etym.currentEtymology.rootTransliteration + "\n" +
                                   "Derivatives: " + etym.derivatives.length;
                
                if (!confirm(confirmMessage)) {
                    console.log("[ETYMOLOGY-UNIFIED] ❌ Delete cancelled by user");
                    return;
                }
                
                etym.isLoading = true;
                
                datacontext.deleteRoot(etym.currentEtymology.rootId).then(function() {
                    console.log("[ETYMOLOGY-UNIFIED] ✅ Delete successful");
                    
                    clearFormUnified();
                    etym.isLoading = false;
                    
                    logSuccess("Root word deleted successfully", "zuHubEtymologyManager");
                }).catch(function(error) {
                    console.error("[ETYMOLOGY-UNIFIED] ❌ Delete failed:", error);
                    etym.isLoading = false;
                    logError("Failed to delete root: " + error.message, "zuHubEtymologyManager");
                });
            }
            
            function onSearchKeypress(event) {
                if (event.keyCode === 13) { // Enter key
                    console.log("[ETYMOLOGY-UNIFIED] 🔍 Enter key pressed, triggering search");
                    searchEtymologyUnified();
                }
            }
            
            // ==========================================
            // UNIFIED DERIVATIVE METHODS
            // ==========================================
            
            function loadDerivativesUnified(rootId) {
                console.log("[ETYMOLOGY-UNIFIED] 🌿 Loading derivatives for root:", rootId);
                
                if (!rootId || rootId === 0) {
                    etym.derivatives = [];
                    return;
                }
                
                datacontext.getEtymologyDerivatives(rootId).then(function(derivatives) {
                    console.log("[ETYMOLOGY-UNIFIED] ✅ Derivatives API response:", {
                        derivatives: derivatives,
                        isArray: Array.isArray(derivatives),
                        length: derivatives ? derivatives.length : 0,
                        firstDerivative: derivatives && derivatives[0] ? derivatives[0] : null,
                        timestamp: new Date().toISOString()
                    });
                    
                    etym.derivatives = (derivatives || []).map(function(derivative) {
                        var processed = {
                            derivativeId: derivative.derivativeId || 0,
                            rootId: rootId,
                            derivativeWord: derivative.derivative || "",
                            transliteration: derivative.transliteration || "",
                            meaningEnglish: derivative.meaningEnglish || "",
                            isModified: false,
                            isSaved: false
                        };
                        console.log("[ETYMOLOGY-UNIFIED] 🔄 Processing derivative:", {
                            original: derivative,
                            processed: processed
                        });
                        return processed;
                    });
                    
                    console.log("[ETYMOLOGY-UNIFIED] 📊 Final processed derivatives:", {
                        count: etym.derivatives.length,
                        derivatives: etym.derivatives
                    });
                }).catch(function(error) {
                    console.error("[ETYMOLOGY-UNIFIED] ❌ Failed to load derivatives:", error);
                    etym.derivatives = [];
                    logError("Failed to load derivatives", "zuHubEtymologyManager");
                });
            }
            
            function addNewDerivativeUnified() {
                console.log("[ETYMOLOGY-UNIFIED] ➕ Adding new derivative");
                
                var newDerivative = {
                    derivativeId: 0,
                    rootId: etym.currentEtymology.rootId || 0,
                    derivativeWord: "",
                    transliteration: "",
                    meaningEnglish: "",
                    isModified: true,
                    isSaved: false
                };
                
                etym.derivatives = etym.derivatives || [];
                etym.derivatives.push(newDerivative);
                
                console.log("[ETYMOLOGY-UNIFIED] ✅ New derivative added, total:", etym.derivatives.length);
                // Derivative added to form (removed annoying toast notification)
            }
            
            function saveDerivativeUnified(derivative, index) {
                console.log("[ETYMOLOGY-UNIFIED] 💾 Saving individual derivative:", {
                    index: index,
                    derivativeId: derivative.derivativeId,
                    derivativeWord: derivative.derivativeWord,
                    transliteration: derivative.transliteration
                });
                
                if (!derivative.derivativeWord || !derivative.transliteration) {
                    logError("Derivative word and transliteration are required", "zuHubEtymologyManager");
                    return;
                }
                
                if (!etym.currentEtymology.rootId || etym.currentEtymology.rootId === 0) {
                    logError("Please save the root word first before adding derivatives", "zuHubEtymologyManager");
                    return;
                }
                
                // For individual derivative saves, we'll save all derivatives for this root
                // This matches the existing API structure
                var derivativesToSave = etym.derivatives.map(function(d) {
                    return {
                        derivativeId: d.derivativeId || 0,
                        rootId: etym.currentEtymology.rootId,
                        derivative: d.derivativeWord,
                        transliteration: d.transliteration,
                        meaningEnglish: d.meaningEnglish || ""
                    };
                });
                
                console.log("[ETYMOLOGY-UNIFIED] 📤 Sending derivatives save request:", derivativesToSave);
                
                datacontext.saveDerivatives(etym.currentEtymology.rootId, derivativesToSave).then(function(response) {
                    console.log("[ETYMOLOGY-UNIFIED] ✅ Derivatives saved:", response);
                    
                    // Mark all derivatives as saved
                    angular.forEach(etym.derivatives, function(d) {
                        d.isModified = false;
                        d.isSaved = true;
                    });
                    
                    // Show success briefly for all derivatives
                    common.$timeout(function() {
                        angular.forEach(etym.derivatives, function(d) {
                            d.isSaved = false;
                        });
                    }, 2000);
                    
                    logSuccess("Derivatives saved successfully", "zuHubEtymologyManager");
                }).catch(function(error) {
                    console.error("[ETYMOLOGY-UNIFIED] ❌ Derivative save failed:", error);
                    logError("Failed to save derivatives: " + error.message, "zuHubEtymologyManager");
                });
            }
            
            function deleteDerivativeUnified(derivative, index) {
                console.log("[ETYMOLOGY-UNIFIED] 🗑️ Deleting derivative:", {
                    index: index,
                    derivativeId: derivative.derivativeId,
                    derivativeWord: derivative.derivativeWord
                });
                
                var confirmMessage = "Delete this derivative?\n\n" + 
                                   "Word: " + derivative.derivativeWord + "\n" +
                                   "Transliteration: " + derivative.transliteration;
                
                if (!confirm(confirmMessage)) {
                    console.log("[ETYMOLOGY-UNIFIED] ❌ Delete cancelled by user");
                    return;
                }
                
                // If it's a new derivative (no ID), just remove from array
                if (!derivative.derivativeId || derivative.derivativeId === 0) {
                    etym.derivatives.splice(index, 1);
                    console.log("[ETYMOLOGY-UNIFIED] ✅ New derivative removed from array");
                    // Derivative removed from form (removed annoying toast notification)
                    return;
                }
                
                // Delete from database
                datacontext.deleteDerivative(derivative.derivativeId).then(function() {
                    console.log("[ETYMOLOGY-UNIFIED] ✅ Derivative deleted from database");
                    
                    etym.derivatives.splice(index, 1);
                    logSuccess("Derivative deleted successfully", "zuHubEtymologyManager");
                }).catch(function(error) {
                    console.error("[ETYMOLOGY-UNIFIED] ❌ Derivative delete failed:", error);
                    logError("Failed to delete derivative: " + error.message, "zuHubEtymologyManager");
                });
            }
            
            function markDerivativeModified(derivative, index) {
                derivative.isModified = true;
                derivative.isSaved = false;
                console.log("[ETYMOLOGY-UNIFIED] ✏️ Derivative marked as modified:", index);
            }
            
            function validateEtymologyUnified() {
                console.log("[ETYMOLOGY-UNIFIED] ✅ Validating etymology form");
                
                if (!etym.currentEtymology.rootWord || etym.currentEtymology.rootWord.trim() === "") {
                    logError("Root word (Arabic) is required", "zuHubEtymologyManager");
                    return false;
                }
                
                if (!etym.currentEtymology.rootTransliteration || etym.currentEtymology.rootTransliteration.trim() === "") {
                    logError("Root transliteration is required", "zuHubEtymologyManager");
                    return false;
                }
                
                if (!etym.currentEtymology.meaningEnglish || etym.currentEtymology.meaningEnglish.trim() === "") {
                    logError("English meaning is required", "zuHubEtymologyManager");
                    return false;
                }
                
                console.log("[ETYMOLOGY-UNIFIED] ✅ Validation passed");
                return true;
            }

            // Cleanup on destroy
            scope.$on('$destroy', function() {
                if (tokenCopy) {
                    tokenCopy.destroy();
                }
                log("Etymology Manager destroyed", "zuHubEtymologyManager");
            });
        }
    }

})();

