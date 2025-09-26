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

        // Public methods
        vm.showPanel = showPanel;
        vm.close = closePanel;
        vm.closeWithoutInsertion = closeWithoutInsertion;
        vm.performSearch = debouncedSearch; // Use debounced version
        vm.clearSearch = clearSearch;
        vm.insertEtymology = insertEtymology;
        vm.onDerivativeClick = onDerivativeClick;
        vm.searchSuggestion = searchSuggestion;
        vm.startDrag = startDrag;
        vm.drag = drag;
        vm.endDrag = endDrag;

        // Drag functionality variables
        vm.isDragging = false;
        vm.dragStartX = 0;
        vm.dragStartY = 0;
        vm.panelStartX = 0;
        vm.panelStartY = 0;

        // Search timer for debouncing
        var searchTimer = null;

        // Initialize with blank state (no default data)
        vm.etymologyDisplayData = null;

        // Initialize event listeners
        setupEventListeners();

        function setupEventListeners() {
            console.log('🔧 [ETYMOLOGY-FLOATING] ===== SETTING UP EVENT LISTENERS =====');
            console.log('🔧 [ETYMOLOGY-FLOATING] Controller scope:', $scope);
            console.log('🔧 [ETYMOLOGY-FLOATING] Scope $on method:', typeof $scope.$on);
            
            // Listen for etymology panel requests from Froala editor
            $scope.$on('etymologyManagement.show', function(event, data) {
                console.log('🌿 [ETYMOLOGY-FLOATING] ===== EVENT RECEIVED =====');
                console.log('🌿 [ETYMOLOGY-FLOATING] Etymology panel show event received');
                console.log('🌿 [ETYMOLOGY-FLOATING] Event object:', event);
                console.log('🌿 [ETYMOLOGY-FLOATING] Event data:', data);
                console.log('🌿 [ETYMOLOGY-FLOATING] Editor from data:', !!data.editor);
                console.log('🌿 [ETYMOLOGY-FLOATING] Marker from data:', data.marker);
                
                // Store editor and marker information
                vm.editorInstance = data.editor;
                vm.insertionMarker = data.marker;
                vm.sessionId = data.sessionId || null;
                
                console.log('🌿 [ETYMOLOGY-FLOATING] Stored editor instance:', !!vm.editorInstance);
                console.log('🌿 [ETYMOLOGY-FLOATING] Stored insertion marker:', vm.insertionMarker);
                console.log('🌿 [ETYMOLOGY-FLOATING] About to show panel...');
                
                vm.showPanel();
                
                console.log('🌿 [ETYMOLOGY-FLOATING] ===== EVENT PROCESSING COMPLETE =====');
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
            console.log('🌿 [ETYMOLOGY-FLOATING] ===== SHOWING PANEL =====');
            console.log('🌿 [ETYMOLOGY-FLOATING] Panel visibility before:', vm.isVisible);
            console.log('🌿 [ETYMOLOGY-FLOATING] Editor instance available:', !!vm.editorInstance);
            console.log('🌿 [ETYMOLOGY-FLOATING] Insertion marker:', vm.insertionMarker);
            
            vm.isVisible = true;
            vm.searchQuery = '';
            vm.hasError = false;
            
            console.log('🌿 [ETYMOLOGY-FLOATING] Panel visibility after:', vm.isVisible);
            
            // Focus search input after panel is shown
            $timeout(function() {
                var searchInput = document.querySelector('.etymology-search-input');
                console.log('🌿 [ETYMOLOGY-FLOATING] Search input element found:', !!searchInput);
                if (searchInput) {
                    searchInput.focus();
                    console.log('🌿 [ETYMOLOGY-FLOATING] Search input focused');
                }
            }, 100);
            
            console.log('🌿 [ETYMOLOGY-FLOATING] Panel state:', {
                isVisible: vm.isVisible,
                editorInstance: !!vm.editorInstance,
                insertionMarker: vm.insertionMarker
            });
            console.log('🌿 [ETYMOLOGY-FLOATING] ===== PANEL SHOW COMPLETE =====');
        }

        function closePanel() {
            console.log('🌿 [ETYMOLOGY-FLOATING] Closing etymology floating panel');
            vm.isVisible = false;
            vm.searchQuery = '';
            vm.hasError = false;
        }

        function clearSearch() {
            console.log('🧹 [ETYMOLOGY-FLOATING] Clearing search');
            vm.searchQuery = '';
            vm.etymologyDisplayData = null;
            vm.hasError = false;
            vm.isLoading = false;
            
            // Cancel any pending search
            if (searchTimer) {
                $timeout.cancel(searchTimer);
                searchTimer = null;
            }
        }

        function closeWithoutInsertion() {
            console.log('🌿 [ETYMOLOGY-FLOATING] Closing panel without insertion (clicked outside)');
            vm.isVisible = false;
            vm.searchQuery = '';
            vm.hasError = false;
        }

        // Drag functionality
        function startDrag(event) {
            // Don't start drag if clicking on buttons or interactive elements
            if (event.target.closest('.etymology-content-area') || 
                event.target.closest('button') || 
                event.target.closest('input') ||
                event.target.closest('.etymology-close-button')) {
                return;
            }
            
            event.preventDefault();
            vm.isDragging = true;
            vm.dragStartX = event.clientX;
            vm.dragStartY = event.clientY;
            
            var panel = document.getElementById('etymologyFloatingPanel');
            if (panel) {
                var rect = panel.getBoundingClientRect();
                vm.panelStartX = rect.left + window.scrollX;
                vm.panelStartY = rect.top + window.scrollY;
            }
            
            // Add global mouse event listeners
            angular.element(document).on('mousemove.etymologyDrag', drag);
            angular.element(document).on('mouseup.etymologyDrag', endDrag);
        }

        function drag(event) {
            if (!vm.isDragging) return;
            
            event.preventDefault();
            var deltaX = event.clientX - vm.dragStartX;
            var deltaY = event.clientY - vm.dragStartY;
            
            var panel = document.getElementById('etymologyFloatingPanel');
            if (panel) {
                var newX = vm.panelStartX + deltaX;
                var newY = vm.panelStartY + deltaY;
                
                // Keep panel within viewport
                var maxX = window.innerWidth - panel.offsetWidth;
                var maxY = window.innerHeight - panel.offsetHeight;
                
                newX = Math.max(0, Math.min(newX, maxX));
                newY = Math.max(0, Math.min(newY, maxY));
                
                panel.style.left = newX + 'px';
                panel.style.top = newY + 'px';
                panel.style.transform = 'none'; // Remove centering transform
            }
        }

        function endDrag(event) {
            vm.isDragging = false;
            
            // Remove global mouse event listeners
            angular.element(document).off('mousemove.etymologyDrag');
            angular.element(document).off('mouseup.etymologyDrag');
        }

        function debouncedSearch() {
            // Cancel previous search timer
            if (searchTimer) {
                $timeout.cancel(searchTimer);
            }
            
            // Start new timer for debounced search
            searchTimer = $timeout(function() {
                performSearch();
                searchTimer = null;
            }, 300); // 300ms delay
        }

        function performSearch() {
            if (!vm.searchQuery || vm.searchQuery.trim().length < 2) {
                console.log('🔍 [ETYMOLOGY-FLOATING] Search query too short, clearing results');
                vm.etymologyDisplayData = null;
                return;
            }

            console.log('🔍 [ETYMOLOGY-FLOATING] Searching KQUR_DEV database for:', vm.searchQuery);
            vm.isLoading = true;
            vm.hasError = false;

            // Call the real etymology API that connects to KQUR_DEV database
            etymologyService.searchEtymology(vm.searchQuery.trim())
                .then(function(results) {
                    vm.isLoading = false;
                    
                    console.log('✅ [ETYMOLOGY-FLOATING] KQUR_DEV API response:', results);
                    
                    if (results && results.length > 0) {
                        var result = results[0]; // Use first result
                        
                        console.log('🔍 [ETYMOLOGY-FLOATING] Transforming result:', result);
                        
                        // Transform API result to display format
                        vm.etymologyDisplayData = {
                            root: {
                                root: result.rootArabic || result.root || result.arabicWord || '',
                                meaning: result.rootMeaning || result.meaning || result.englishMeaning || ''
                            },
                            derivatives: result.derivatives ? result.derivatives.map(function(d) {
                                return {
                                    arabicWord: d.arabicWord || d.word || '',
                                    word: d.arabicWord || d.word || '', // For backward compatibility
                                    transliteration: d.transliteration || '',
                                    meaning: d.meaning || d.englishMeaning || ''
                                };
                            }) : [],
                            commonDerivatives: (result.derivatives || []).slice(0, 4),
                            additionalDerivatives: (result.derivatives || []).slice(4)
                        };
                        
                        console.log('✅ [ETYMOLOGY-FLOATING] Search successful:', {
                            root: vm.etymologyDisplayData.root,
                            derivativeCount: vm.etymologyDisplayData.derivatives.length,
                            commonCount: vm.etymologyDisplayData.commonDerivatives.length,
                            additionalCount: vm.etymologyDisplayData.additionalDerivatives.length
                        });
                    } else {
                        console.log('❌ [ETYMOLOGY-FLOATING] No results from KQUR_DEV database');
                        vm.etymologyDisplayData = null;
                    }
                })
                .catch(function(error) {
                    vm.isLoading = false;
                    vm.hasError = true;
                    console.error('❌ [ETYMOLOGY-FLOATING] KQUR_DEV search failed:', error);
                    vm.etymologyDisplayData = null;
                    common.logger.logError('Etymology search failed: ' + (error.message || 'Unknown error'));
                });
        }

        function searchSuggestion(term) {
            console.log('🔍 [ETYMOLOGY-FLOATING] Searching suggestion:', term);
            vm.searchQuery = term;
            vm.performSearch();
        }

        function onDerivativeClick(derivative) {
            console.log('🌿 [ETYMOLOGY-FLOATING] Derivative clicked:', derivative);
            
            if (!vm.editorInstance) {
                console.error('❌ [ETYMOLOGY-FLOATING] No editor instance available');
                common.logger.logError('Cannot insert derivative: No editor instance');
                return;
            }

            try {
                // Create beautiful derivative card HTML
                var derivativeHtml = generateDerivativeCard(derivative, vm.etymologyDisplayData.root);
                console.log('🎨 [ETYMOLOGY-FLOATING] Generated derivative HTML length:', derivativeHtml.length);
                
                // Enhanced insertion logic with multiple fallback methods
                var insertionSuccessful = false;
                
                // Method 1: Try marker replacement if marker exists
                if (vm.insertionMarker) {
                    console.log('🔧 [ETYMOLOGY-FLOATING] Attempting marker replacement for derivative:', vm.insertionMarker);
                    var currentHtml = vm.editorInstance.html.get();
                    
                    if (currentHtml.indexOf(vm.insertionMarker) !== -1) {
                        var newHtml = currentHtml.replace(vm.insertionMarker, derivativeHtml);
                        vm.editorInstance.html.set(newHtml);
                        console.log('✅ [ETYMOLOGY-FLOATING] Derivative marker replacement successful');
                        insertionSuccessful = true;
                    } else {
                        console.warn('⚠️ [ETYMOLOGY-FLOATING] Marker not found for derivative, falling back to cursor insertion');
                    }
                }
                
                // Method 2: Fallback to cursor insertion
                if (!insertionSuccessful) {
                    console.log('🔧 [ETYMOLOGY-FLOATING] Using cursor insertion for derivative');
                    vm.editorInstance.html.insert(derivativeHtml);
                    console.log('✅ [ETYMOLOGY-FLOATING] Derivative cursor insertion completed');
                    insertionSuccessful = true;
                }
                
                if (insertionSuccessful) {
                    console.log('✅ [ETYMOLOGY-FLOATING] Derivative card inserted successfully');
                    common.logger.log('Derivative content inserted into editor');
                    
                    // Focus the editor to show the changes
                    if (vm.editorInstance.events && vm.editorInstance.events.focus) {
                        vm.editorInstance.events.focus();
                    }
                    
                    // Close panel after successful insertion
                    vm.close();
                } else {
                    throw new Error('All derivative insertion methods failed');
                }
                
            } catch (error) {
                console.error('❌ [ETYMOLOGY-FLOATING] Failed to insert derivative:', error);
                common.logger.logError('Failed to insert derivative: ' + error.message);
                
                // Show user-friendly error message
                if (common.showToast) {
                    common.showToast('Failed to insert derivative content. Please try again.', 'error');
                }
            }
        }

        function insertEtymology(etymologyData) {
            console.log('📝 [ETYMOLOGY-FLOATING] Inserting etymology data:', etymologyData);
            
            if (!vm.editorInstance) {
                console.error('❌ [ETYMOLOGY-FLOATING] No editor instance available');
                common.logger.logError('Cannot insert etymology: No editor instance');
                return;
            }

            try {
                // Create beautiful etymology card HTML
                var etymologyHtml = generateEtymologyCard(etymologyData);
                console.log('🎨 [ETYMOLOGY-FLOATING] Generated HTML length:', etymologyHtml.length);
                
                // Enhanced insertion logic with multiple fallback methods
                var insertionSuccessful = false;
                
                // Method 1: Try marker replacement if marker exists
                if (vm.insertionMarker) {
                    console.log('🔧 [ETYMOLOGY-FLOATING] Attempting marker replacement:', vm.insertionMarker);
                    var currentHtml = vm.editorInstance.html.get();
                    console.log('📄 [ETYMOLOGY-FLOATING] Current editor HTML length:', currentHtml.length);
                    
                    if (currentHtml.indexOf(vm.insertionMarker) !== -1) {
                        var newHtml = currentHtml.replace(vm.insertionMarker, etymologyHtml);
                        vm.editorInstance.html.set(newHtml);
                        console.log('✅ [ETYMOLOGY-FLOATING] Marker replacement successful');
                        insertionSuccessful = true;
                    } else {
                        console.warn('⚠️ [ETYMOLOGY-FLOATING] Marker not found in editor, falling back to cursor insertion');
                    }
                }
                
                // Method 2: Fallback to cursor insertion
                if (!insertionSuccessful) {
                    console.log('🔧 [ETYMOLOGY-FLOATING] Using cursor insertion method');
                    vm.editorInstance.html.insert(etymologyHtml);
                    console.log('✅ [ETYMOLOGY-FLOATING] Cursor insertion completed');
                    insertionSuccessful = true;
                }
                
                if (insertionSuccessful) {
                    console.log('✅ [ETYMOLOGY-FLOATING] Etymology card inserted successfully');
                    common.logger.log('Etymology content inserted into editor');
                    
                    // Focus the editor to show the changes
                    if (vm.editorInstance.events && vm.editorInstance.events.focus) {
                        vm.editorInstance.events.focus();
                    }
                    
                    // Close panel after successful insertion
                    vm.close();
                } else {
                    throw new Error('All insertion methods failed');
                }
                
            } catch (error) {
                console.error('❌ [ETYMOLOGY-FLOATING] Failed to insert etymology:', error);
                common.logger.logError('Failed to insert etymology: ' + error.message);
                
                // Show user-friendly error message
                if (common.showToast) {
                    common.showToast('Failed to insert etymology content. Please try again.', 'error');
                }
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
                    html += '<div style="font-size: 18px; font-weight: 600; color: #1f2937; font-family: \'Amiri\', serif;">' + (derivative.arabicWord || derivative.word || '') + '</div>';
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

        function generateDerivativeCard(derivative, rootInfo) {
            var html = '<div class="etymology-derivative-card" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #7dd3fc; border-radius: 12px; padding: 16px; margin: 12px 0; text-align: center; max-width: 400px; display: inline-block;">';
            
            // Root reference (smaller)
            if (rootInfo && rootInfo.root) {
                html += '<div class="derivative-root-reference" style="margin-bottom: 12px; padding: 8px; background: rgba(125, 211, 252, 0.2); border-radius: 8px;">';
                html += '<div style="font-size: 14px; color: #0284c7; font-weight: 600; margin-bottom: 4px;">Root: ' + rootInfo.root + '</div>';
                html += '<div style="font-size: 12px; color: #0369a1; font-style: italic;">' + (rootInfo.meaning || '') + '</div>';
                html += '</div>';
            }
            
            // Main derivative display
            html += '<div class="derivative-main-display" style="margin-bottom: 12px;">';
            html += '<h3 style="font-size: 32px; color: #0c4a6e; margin: 0 0 8px 0; font-family: \'Amiri\', serif; font-weight: 700;">' + (derivative.arabicWord || derivative.word || '') + '</h3>';
            html += '<p style="font-size: 14px; color: #0369a1; margin: 0 0 4px 0; font-style: italic;">(' + (derivative.transliteration || '') + ')</p>';
            html += '<p style="font-size: 16px; color: #075985; margin: 0; font-family: \'Lora\', serif; font-weight: 500; line-height: 1.4;">' + (derivative.meaning || '') + '</p>';
            html += '</div>';
            
            // Small footer
            html += '<div style="font-size: 11px; color: #0284c7; font-style: italic;">Etymology • ' + new Date().toLocaleDateString() + '</div>';
            
            html += '</div>';
            
            return html;
        }
    }

})();
