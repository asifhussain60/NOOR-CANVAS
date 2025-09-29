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
            vm.isVisible = true;
            vm.searchQuery = '';
            vm.etymologyList = [];
            vm.hasError = false;
            
            // Focus search input after panel is shown
            $timeout(function() {
                var searchInput = document.querySelector('.etymology-panel-search-input');
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
            vm.etymologyList = [];
            vm.hasError = false;
            
            // Clear editor references but don't null them completely in case of reuse
            // vm.editorInstance = null;
            // vm.insertionMarker = null;
        }

        function performSearch() {
            if (!vm.searchQuery || vm.searchQuery.trim().length < 2) {
                console.log('🔍 [ETYMOLOGY-FLOATING] Search query too short, skipping search');
                vm.etymologyList = [];
                return;
            }

            console.log('🔍 [ETYMOLOGY-FLOATING] Performing search for:', vm.searchQuery);
            vm.isLoading = true;
            vm.hasError = false;

            var searchCriteria = {
                searchTerm: vm.searchQuery.trim(),
                pageNumber: 1,
                pageSize: 10,
                includeInactive: false
            };

            etymologyService.searchEtymology(searchCriteria)
                .then(function(response) {
                    console.log('✅ [ETYMOLOGY-FLOATING] Search completed successfully:', response);
                    vm.etymologyList = response.data || [];
                    vm.isLoading = false;
                    
                    // Load derivatives for each result
                    loadDerivativesForResults();
                })
                .catch(function(error) {
                    console.error('❌ [ETYMOLOGY-FLOATING] Search failed:', error);
                    vm.hasError = true;
                    vm.isLoading = false;
                    vm.etymologyList = [];
                    common.logger.error('Etymology search failed: ' + (error.message || 'Unknown error'));
                });
        }

        function loadDerivativesForResults() {
            console.log('📊 [ETYMOLOGY-FLOATING] Loading derivatives for', vm.etymologyList.length, 'results');
            
            // Load derivatives for each etymology result
            vm.etymologyList.forEach(function(etymology) {
                if (etymology.rootId) {
                    etymologyService.getEtymologyDerivatives(etymology.rootId)
                        .then(function(derivativesResponse) {
                            etymology.derivatives = derivativesResponse.data || [];
                            console.log('✅ [ETYMOLOGY-FLOATING] Loaded', etymology.derivatives.length, 'derivatives for root', etymology.rootId);
                        })
                        .catch(function(error) {
                            console.error('❌ [ETYMOLOGY-FLOATING] Failed to load derivatives for root', etymology.rootId, ':', error);
                            etymology.derivatives = [];
                        });
                }
            });
        }

        function insertEtymology(etymologyItem) {
            console.log('📝 [ETYMOLOGY-FLOATING] Inserting etymology:', etymologyItem);
            
            if (!vm.editorInstance) {
                console.error('❌ [ETYMOLOGY-FLOATING] No editor instance available for insertion');
                common.logger.error('Cannot insert etymology: No editor instance available');
                return;
            }

            try {
                var htmlContent = generateEtymologyHtml(etymologyItem);
                console.log('🎨 [ETYMOLOGY-FLOATING] Generated HTML content:', htmlContent.substring(0, 200) + '...');
                
                // Insert into Froala editor
                if (vm.insertionMarker) {
                    // Replace the marker with etymology content
                    var editorContent = vm.editorInstance.html.get();
                    var updatedContent = editorContent.replace(vm.insertionMarker, htmlContent);
                    vm.editorInstance.html.set(updatedContent);
                    console.log('✅ [ETYMOLOGY-FLOATING] Replaced marker with etymology content');
                } else {
                    // Insert at current cursor position
                    vm.editorInstance.html.insert(htmlContent);
                    console.log('✅ [ETYMOLOGY-FLOATING] Inserted etymology at cursor position');
                }
                
                // Close panel after successful insertion
                vm.close();
                
                console.log('🎉 [ETYMOLOGY-FLOATING] Etymology insertion completed successfully');
                
            } catch (error) {
                console.error('❌ [ETYMOLOGY-FLOATING] Failed to insert etymology:', error);
                common.logger.error('Failed to insert etymology: ' + (error.message || 'Unknown error'));
            }
        }

        function generateEtymologyHtml(etymologyItem) {
            console.log('🎨 [ETYMOLOGY-FLOATING] Generating HTML for etymology item:', etymologyItem);
            
            var html = '';
            
            if (etymologyItem.derivatives && etymologyItem.derivatives.length > 0) {
                // This is a full etymology root with derivatives
                html += '<div class="etymology-card inserted-etymology-card" style="margin: 20px 0; padding: 20px; border-radius: 12px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e;">';
                html += '<div class="etymology-root-section" style="text-align: center; margin-bottom: 16px; padding: 16px; background: rgba(34,197,94,0.1); border-radius: 8px;">';
                html += '<h3 class="etymology-root-text" style="font-family: \'Amiri\', serif; font-size: 32px; font-weight: bold; color: #15803d; margin: 0 0 8px 0; direction: rtl;">' + (etymologyItem.rootArabic || etymologyItem.arabicWord || 'N/A') + '</h3>';
                html += '<p class="etymology-root-meaning" style="font-family: \'Lora\', serif; font-size: 16px; color: #166534; margin: 0; font-style: italic;">' + (etymologyItem.rootMeaning || etymologyItem.meaning || 'N/A') + '</p>';
                html += '</div>';
                
                if (etymologyItem.derivatives && etymologyItem.derivatives.length > 0) {
                    html += '<div class="etymology-derivatives-section">';
                    html += '<h4 style="font-family: \'Lora\', serif; color: #15803d; margin: 0 0 12px 0; font-size: 18px;">Derivatives (' + etymologyItem.derivatives.length + ')</h4>';
                    html += '<div class="etymology-derivatives-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">';
                    
                    etymologyItem.derivatives.forEach(function(derivative, index) {
                        var bgColor = index % 2 === 0 ? '#f0fdf4' : '#f7fee7';
                        html += '<div class="etymology-derivative-item" style="padding: 12px; background: ' + bgColor + '; border: 1px solid #bbf7d0; border-radius: 8px; text-align: center;">';
                        html += '<div class="derivative-arabic" style="font-family: \'Amiri\', serif; font-size: 24px; font-weight: bold; color: #15803d; margin-bottom: 4px; direction: rtl;">' + (derivative.arabicWord || 'N/A') + '</div>';
                        if (derivative.transliteration) {
                            html += '<div class="derivative-transliteration" style="font-size: 12px; color: #16a34a; margin-bottom: 4px;">(' + derivative.transliteration + ')</div>';
                        }
                        html += '<div class="derivative-meaning" style="font-family: \'Lora\', serif; font-size: 14px; color: #166534;">' + (derivative.meaning || 'N/A') + '</div>';
                        html += '</div>';
                    });
                    
                    html += '</div>';
                    html += '</div>';
                }
                
                html += '</div>';
            } else {
                // This is a single derivative
                html += '<span class="etymology-derivative-inline inserted-etymology-derivative" style="display: inline-block; padding: 4px 8px; margin: 0 2px; background: linear-gradient(135deg, #dcfce7, #bbf7d0); border: 1px solid #22c55e; border-radius: 6px; font-family: \'Amiri\', serif; font-size: 18px; font-weight: bold; color: #15803d; direction: rtl;">';
                html += etymologyItem.arabicWord || etymologyItem.rootArabic || 'N/A';
                if (etymologyItem.transliteration) {
                    html += ' <span style="font-family: \'Lora\', serif; font-size: 12px; color: #16a34a;">(' + etymologyItem.transliteration + ')</span>';
                }
                html += '</span>';
            }
            
            return html;
        }
    }
})();
