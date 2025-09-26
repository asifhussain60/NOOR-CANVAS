(function () {
    'use strict';

    angular
        .module('app')
        .controller('etymologyFloatingPanelCtl', etymologyFloatingPanelCtl);

    etymologyFloatingPanelCtl.$inject = ['$scope', '$timeout', 'etymologyService', 'common'];

    function etymologyFloatingPanelCtl($scope, $timeout, etymologyService, common) {
        // 🌿 ETYMOLOGY FLOATING PANEL CONTROLLER - Template Based
        console.group('🌿 [ETYMOLOGY-FLOATING] Controller Initialization');
        console.log('✅ etymologyFloatingPanelCtl loaded successfully');
        console.log('✅ etymologyService dependency injected:', !!etymologyService);
        console.log('📁 Controller file: app/features/admin/etymologyFloatingPanelCtl.js');
        console.log('🎯 Panel will only respond to Froala leaf button events');
        console.log('🎨 Using beautiful Material Design template from Etymology Panel.html');
        console.groupEnd();
        
        var vm = this;
        var controllerId = 'etymologyFloatingPanelCtl';

        // Ensure vm is available on scope for template binding
        $scope.vm = vm;

        // FLOATING PANEL PROPERTIES - Template Based
        vm.isVisible = false;
        vm.isLoading = false;
        vm.searchQuery = '';
        vm.etymologyDisplayData = null; // Main display data like template
        vm.databaseName = 'KQUR_DEV';
        vm.hasError = false;
        
        // Editor integration properties
        vm.editorInstance = null;
        vm.insertionMarker = null;
        vm.sessionId = null;

        // Static etymology data like the template (for immediate display)
        vm.etymologyData = {
            "ilah": {
                root: {
                    root: "ا-ل-ه",
                    meaning: "To be worshiped, to be distracted, to love passionately"
                },
                derivatives: [
                    { word: "اللّٰه", transliteration: "Allāh", meaning: "The God" },
                    { word: "إِلَٰه", transliteration: "ilāh", meaning: "God, deity" },
                    { word: "أَلِهَ", transliteration: "aliha", meaning: "To worship" },
                    { word: "تَأَلَّهَ", transliteration: "ta'allaha", meaning: "To deify oneself" },
                    { word: "تَأَلُّه", transliteration: "ta'alluh", meaning: "The act of deifying or worshiping something" },
                    { word: "أَلَّهَ", transliteration: "allaha", meaning: "To worship, to adore, to make divine" }
                ]
            },
            "salam": {
                root: {
                    root: "س-ل-م",
                    meaning: "To be safe, secure, to be sound"
                },
                derivatives: [
                    { word: "إِسْلَام", transliteration: "Islām", meaning: "Submission to God" },
                    { word: "سَلَام", transliteration: "salām", meaning: "Peace" },
                    { word: "سَلِمَ", transliteration: "salima", meaning: "To be safe" },
                    { word: "سِلْم", transliteration: "silm", meaning: "Peace, reconciliation" }
                ]
            },
            "kitab": {
                root: {
                    root: "ك-ت-ب",
                    meaning: "To write, to inscribe, to prescribe"
                },
                derivatives: [
                    { word: "كِتَاب", transliteration: "kitāb", meaning: "Book" },
                    { word: "كَتَبَ", transliteration: "kataba", meaning: "He wrote" },
                    { word: "مَكْتَب", transliteration: "maktab", meaning: "Office, desk" },
                    { word: "كِتَابَة", transliteration: "kitābah", meaning: "Writing" }
                ]
            }
        };

        // Public methods
        vm.showPanel = showPanel;
        vm.close = closePanel;
        vm.performSearch = performSearch;
        vm.insertEtymology = insertEtymology;
        vm.onDerivativeClick = onDerivativeClick;
        vm.searchSuggestion = searchSuggestion;

        // Initialize with default data (like template)
        vm.etymologyDisplayData = vm.etymologyData['ilah'];

        // Initialize event listeners
        setupEventListeners();

        function setupEventListeners() {
            console.log('🔧 [ETYMOLOGY-FLOATING] Setting up event listeners');
            
            // Listen for etymology panel requests from Froala editor
            $scope.$on('etymologyManagement.show', function(event, data) {
                console.log('🌿 [ETYMOLOGY-FLOATING] Etymology panel show event received:', data);
                vm.editorInstance = data.editor;
                vm.insertionMarker = data.marker;
                vm.sessionId = data.sessionId || null;
                vm.showPanel();
            });

            // ESC key handler for closing panel
            angular.element(document).on('keydown.etymologyFloating', function(e) {
                if (e.keyCode === 27 && vm.isVisible) {
                    $scope.$apply(function() {
                        vm.close();
                    });
                }
            });

            // Cleanup on controller destroy
            $scope.$on('$destroy', function() {
                console.log('🧹 [ETYMOLOGY-FLOATING] Controller destroyed - cleaning up');
                angular.element(document).off('keydown.etymologyFloating');
                vm.editorInstance = null;
                vm.insertionMarker = null;
            });
        }

        function showPanel() {
            console.log('🌿 [ETYMOLOGY-FLOATING] Showing etymology floating panel');
            vm.isVisible = true;
            vm.searchQuery = '';
            vm.hasError = false;
            
            // Focus search input after panel is shown
            $timeout(function() {
                var searchInput = document.querySelector('.etymology-search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }, 100);
            
            console.log('🌿 [ETYMOLOGY-FLOATING] Panel visibility state:', {
                isVisible: vm.isVisible,
                editorInstance: !!vm.editorInstance,
                insertionMarker: vm.insertionMarker
            });
        }

        function closePanel() {
            console.log('🌿 [ETYMOLOGY-FLOATING] Closing etymology floating panel');
            vm.isVisible = false;
            vm.searchQuery = '';
            vm.hasError = false;
        }

        function performSearch() {
            if (!vm.searchQuery || vm.searchQuery.trim().length < 2) {
                console.log('🔍 [ETYMOLOGY-FLOATING] Search query too short, clearing results');
                vm.etymologyDisplayData = null;
                return;
            }

            console.log('🔍 [ETYMOLOGY-FLOATING] Performing search for:', vm.searchQuery);
            vm.isLoading = true;
            vm.hasError = false;

            // First try local static data
            var term = vm.searchQuery.trim().toLowerCase();
            if (vm.etymologyData[term]) {
                console.log('✅ [ETYMOLOGY-FLOATING] Found in static data:', term);
                vm.etymologyDisplayData = vm.etymologyData[term];
                vm.isLoading = false;
                return;
            }

            // Search API for dynamic data
            var searchCriteria = {
                searchTerm: vm.searchQuery.trim(),
                pageNumber: 1,
                pageSize: 10,
                includeInactive: false
            };

            etymologyService.searchEtymology(searchCriteria)
                .then(function(response) {
                    console.log('✅ [ETYMOLOGY-FLOATING] API search completed successfully:', response);
                    
                    if (response.data && response.data.length > 0) {
                        // Transform API data to template format
                        var firstResult = response.data[0];
                        vm.etymologyDisplayData = {
                            root: {
                                root: firstResult.rootArabic || firstResult.arabicWord,
                                meaning: firstResult.rootMeaning || firstResult.englishMeaning
                            },
                            derivatives: firstResult.derivatives || []
                        };
                    } else {
                        vm.etymologyDisplayData = null;
                    }
                    
                    vm.isLoading = false;
                })
                .catch(function(error) {
                    console.error('❌ [ETYMOLOGY-FLOATING] Search failed:', error);
                    vm.hasError = true;
                    vm.isLoading = false;
                    vm.etymologyDisplayData = null;
                    common.logger.error('Etymology search failed: ' + (error.message || 'Unknown error'));
                });
        }

        function searchSuggestion(term) {
            console.log('🔍 [ETYMOLOGY-FLOATING] Searching suggestion:', term);
            vm.searchQuery = term;
            vm.performSearch();
        }

        function onDerivativeClick(word) {
            console.log('🌿 [ETYMOLOGY-FLOATING] Derivative clicked:', word);
            // Could implement additional functionality here
        }

        function insertEtymology(etymologyData) {
            console.log('📝 [ETYMOLOGY-FLOATING] Inserting etymology data:', etymologyData);
            
            if (!vm.editorInstance) {
                console.error('❌ [ETYMOLOGY-FLOATING] No editor instance available');
                common.logger.error('Cannot insert etymology: No editor instance');
                return;
            }

            try {
                // Create beautiful etymology card HTML
                var etymologyHtml = generateEtymologyCard(etymologyData);
                
                // Insert into editor at marker location
                if (vm.insertionMarker) {
                    var currentHtml = vm.editorInstance.html.get();
                    var newHtml = currentHtml.replace(vm.insertionMarker, etymologyHtml);
                    vm.editorInstance.html.set(newHtml);
                } else {
                    // Insert at cursor
                    vm.editorInstance.html.insert(etymologyHtml);
                }
                
                console.log('✅ [ETYMOLOGY-FLOATING] Etymology card inserted successfully');
                
                // Close panel after insertion
                vm.close();
                
            } catch (error) {
                console.error('❌ [ETYMOLOGY-FLOATING] Failed to insert etymology:', error);
                common.logger.error('Failed to insert etymology: ' + error.message);
            }
        }

        function generateEtymologyCard(etymologyData) {
            var html = '<div class="etymology-card" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #a7f3d0; border-radius: 12px; padding: 20px; margin: 16px 0; text-align: center;">';
            
            // Root section
            html += '<div class="etymology-root-section" style="margin-bottom: 16px;">';
            html += '<h3 style="font-size: 36px; color: #064e3b; margin: 0 0 8px 0; font-family: \'Amiri\', serif;">' + (etymologyData.root.root || '') + '</h3>';
            html += '<p style="font-size: 16px; color: #065f46; margin: 0; font-family: \'Lora\', serif;">' + (etymologyData.root.meaning || '') + '</p>';
            html += '</div>';
            
            // Derivatives section
            if (etymologyData.derivatives && etymologyData.derivatives.length > 0) {
                html += '<div class="etymology-derivatives-section">';
                html += '<h4 style="font-size: 18px; color: #1f2937; margin: 0 0 12px 0;">Derivatives</h4>';
                html += '<div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">';
                
                etymologyData.derivatives.slice(0, 4).forEach(function(derivative, index) {
                    var bgColor = index % 2 === 0 ? '#ecfdf5' : '#f7fee7';
                    html += '<div style="background: ' + bgColor + '; padding: 8px 12px; border-radius: 8px; border: 1px solid #d1fae5; text-align: center; min-width: 100px;">';
                    html += '<div style="font-size: 18px; font-weight: 600; color: #1f2937; font-family: \'Amiri\', serif;">' + (derivative.word || '') + '</div>';
                    html += '<div style="font-size: 12px; color: #6b7280; font-style: italic;">(' + (derivative.transliteration || '') + ')</div>';
                    html += '<div style="font-size: 12px; color: #374151; margin-top: 2px;">' + (derivative.meaning || '') + '</div>';
                    html += '</div>';
                });
                
                html += '</div>';
                html += '</div>';
            }
            
            html += '</div>';
            
            return html;
        }
    }

})();
