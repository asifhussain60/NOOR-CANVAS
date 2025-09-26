(function () {
    'use strict';

    angular
        .module('app')
        .controller('adminEtymologyCtl', adminEtymologyCtl);

    adminEtymologyCtl.$inject = ['$scope', '$location', 'common', 'etymologyService'];

    function adminEtymologyCtl($scope, $location, common, etymologyService) {
        // 🔍 AUDIT LOG: Etymology Controller Initialization
        console.group('📊 [ETYMOLOGY-AUDIT] Controller Loading Analysis');
        console.log('✅ adminEtymologyCtl loaded successfully');
        console.log('✅ etymologyService dependency injected:', !!etymologyService);
        console.log('📁 Controller file: app/features/admin/adminEtymology.js');
        console.log('🎯 Dependencies verified: $scope, $location, common, etymologyService');
        console.groupEnd();
        
        // Initialize the controller
        var vm = this;
        var controllerId = 'adminEtymologyCtl';

        // Ensure vm is available on scope for template binding
        $scope.vm = vm;

        // ADMIN ETYMOLOGY MANAGEMENT PROPERTIES
        vm.isLoading = false;
        vm.databaseName = 'ETYMOLOGY_DB';
        vm.searchQuery = '';
        vm.etymologyList = [];
        vm.hasError = false;
        
        // Enhanced etymology management properties  
        vm.viewReady = false;

        // Public methods for admin CRUD operations
        vm.performSearch = performSearch;
        vm.insertEtymology = insertEtymology;

        // Initialize controller
        setupEventListeners();
        activateController();

        // Event listeners
        function setupEventListeners() {
            console.log('🔧 [ETYMOLOGY-CONTROLLER] Setting up admin etymology event listeners');
            
            // NOTE: Etymology events from Froala editor are now handled exclusively 
            // by the floating panel controller (etymologyFloatingPanelCtl.js).
            // This admin controller only handles CRUD operations on the admin page.
        }

        // Controller cleanup 
        $scope.$on('$destroy', function() {
            console.log('🧹 [ETYMOLOGY-CONTROLLER] Controller destroyed - cleaning up');
            // NOTE: Floating panel cleanup is now handled by etymologyFloatingPanelCtl.js
        });

        // NOTE: showPanel() function removed - floating panel is now handled 
        // exclusively by etymologyFloatingPanelCtl.js

        // NOTE: setupEtymologyDeleteHandlers() function removed - floating panel
        // editor integration is now handled exclusively by etymologyFloatingPanelCtl.js

        function deleteEtymologyCard(cardId) {
            console.log('🗑️ [ETYMOLOGY-DELETE] Attempting to delete card:', cardId);
            
            try {
                if (vm.editorInstance && vm.editorInstance.el) {
                    var etymologyCard = $(vm.editorInstance.el).find('#' + cardId);
                    if (etymologyCard.length > 0) {
                        // Add fade-out animation before removal
                        etymologyCard.css({
                            'transition': 'all 0.3s ease',
                            'opacity': '0',
                            'transform': 'scale(0.9)'
                        });
                        
                        // Remove the element after animation
                        setTimeout(function() {
                            etymologyCard.remove();
                            console.log('✅ [ETYMOLOGY-DELETE] Card removed successfully:', cardId);
                            
                            // Show success notification
                            if (window.toastr) {
                                window.toastr.success('Etymology card deleted!', '', {
                                    timeOut: 2000,
                                    positionClass: 'toast-top-right',
                                    showMethod: 'fadeIn',
                                    hideMethod: 'fadeOut'
                                });
                            }
                        }, 300);
                    } else {
                        console.warn('⚠️ [ETYMOLOGY-DELETE] Card not found in editor:', cardId);
                    }
                } else {
                    console.warn('⚠️ [ETYMOLOGY-DELETE] No editor instance available');
                }
            } catch (error) {
                console.error('❌ [ETYMOLOGY-DELETE] Error deleting card:', error);
                if (window.toastr) {
                    window.toastr.error('Failed to delete etymology card', '', {
                        timeOut: 3000,
                        positionClass: 'toast-top-right'
                    });
                }
            }
        }

        // NOTE: closePanel() function removed - floating panel is now handled 
        // exclusively by etymologyFloatingPanelCtl.js

        function performSearch() {
            if (!vm.searchQuery || vm.searchQuery.length < 2) {
                vm.etymologyList = [];
                return;
            }

            vm.isLoading = true;
            vm.hasError = false;

            etymologyService.searchEtymology(vm.searchQuery)
                .then(function(results) {
                    vm.etymologyList = results || [];
                    vm.isLoading = false;
                    console.log('🔍 [ETYMOLOGY-SEARCH] Search completed successfully:', {
                        query: vm.searchQuery,
                        resultCount: vm.etymologyList.length,
                        results: vm.etymologyList
                    });
                })
                .catch(function(error) {
                    vm.hasError = true;
                    vm.isLoading = false;
                    vm.etymologyList = [];
                    console.error('❌ [ETYMOLOGY-SEARCH] Search failed:', error);
                });
        }

        function insertEtymology(etymology) {
            console.log('🌿 [ETYMOLOGY-INSERT] Starting insertion process', {
                etymology: etymology,
                hasEditor: !!vm.editorInstance,
                hasMarker: !!vm.insertionMarker,
                timestamp: new Date().toISOString()
            });
            
            if (!etymology) {
                console.error('🌿 [ETYMOLOGY-INSERT] No etymology data provided');
                return;
            }

            try {
                // Generate the etymology card HTML
                var cardHtml = generateEtymologyCardHtml(etymology);
                console.log('🌿 [ETYMOLOGY-INSERT] Generated card HTML:', {
                    length: cardHtml.length,
                    preview: cardHtml.substring(0, 200) + '...'
                });
                
                // Use custom marker replacement approach (same as ahadees system)
                if (vm.editorInstance && vm.insertionMarker) {
                    console.log('🌿 [ETYMOLOGY-INSERT] Using custom marker replacement method');
                    console.log('🌿 [ETYMOLOGY-INSERT] Custom marker:', vm.insertionMarker);
                    
                    // Get current editor content
                    var editorContent = vm.editorInstance.html.get();
                    console.log('🌿 [ETYMOLOGY-INSERT] Current editor content length:', editorContent.length);
                    
                    // Check if the marker still exists in the editor
                    var markerExists = editorContent.indexOf(vm.insertionMarker) !== -1;
                    console.log('🌿 [ETYMOLOGY-INSERT] Marker exists in editor:', markerExists);
                    
                    if (markerExists) {
                        // Replace the marker with etymology content
                        var updatedContent = editorContent.replace(vm.insertionMarker, cardHtml);
                        vm.editorInstance.html.set(updatedContent);
                        console.log('🌿 [ETYMOLOGY-INSERT] ✅ Successfully replaced marker with etymology content');
                        
                        // Verify replacement worked
                        var newContent = vm.editorInstance.html.get();
                        var replacementWorked = newContent.indexOf('etymology-card') !== -1;
                        console.log('🌿 [ETYMOLOGY-INSERT] Replacement verification:', {
                            lengthBefore: editorContent.length,
                            lengthAfter: newContent.length,
                            containsEtymologyCard: replacementWorked
                        });
                    } else {
                        console.warn('🌿 [ETYMOLOGY-INSERT] Custom marker not found, falling back to cursor insertion');
                        vm.editorInstance.html.insert(cardHtml);
                    }
                    
                    // Clear marker reference after use
                    vm.insertionMarker = null;
                    
                } else if (vm.editorInstance) {
                    console.log('🌿 [ETYMOLOGY-INSERT] Using cursor insertion method (no marker available)');
                    vm.editorInstance.html.insert(cardHtml);
                } else {
                    console.error('🌿 [ETYMOLOGY-INSERT] No editor instance available');
                    if (window.toastr) {
                        window.toastr.error('Could not insert etymology. Please try clicking in the editor first.', '', {
                            timeOut: 3000,
                            positionClass: 'toast-top-right'
                        });
                    }
                    return;
                }
                
                // Successfully inserted, now set up event delegation for delete buttons
                setupEtymologyDeleteHandlers();
                
                // Show success feedback
                if (window.toastr) {
                    window.toastr.success('Etymology card inserted successfully!', '', {
                        timeOut: 2000,
                        positionClass: 'toast-top-right'
                    });
                }
                
                // Close panel after insertion
                closePanel();
                console.log('🌿 [ETYMOLOGY-INSERT] ✅ Insertion process completed');
                
            } catch (error) {
                console.error('🌿 [ETYMOLOGY-INSERT] ❌ Error inserting etymology:', error);
                if (window.toastr) {
                    window.toastr.error('Failed to insert etymology: ' + error.message, '', {
                        timeOut: 3000,
                        positionClass: 'toast-top-right'
                    });
                }
            }
        }

        function generateEtymologyCardHtml(etymologyData) {
            // Debug the etymology data being used for card generation
            console.log('🔍 [ETYMOLOGY-CARD] Generating card for data:', etymologyData);
            
            var arabicWord = etymologyData.arabicWord || etymologyData.word || etymologyData.ArabicWord || '';
            var englishMeaning = etymologyData.englishMeaning || etymologyData.meaning || etymologyData.EnglishMeaning || '';
            var transliteration = etymologyData.transliteration || etymologyData.Transliteration || '';
            var root = etymologyData.root || etymologyData.Root || '';
            var rootMeaning = etymologyData.rootMeaning || etymologyData.RootMeaning || '';
            
            console.log('🔍 [ETYMOLOGY-CARD] Extracted fields:', {
                arabicWord: arabicWord,
                englishMeaning: englishMeaning,
                transliteration: transliteration,
                root: root,
                rootMeaning: rootMeaning
            });
            
            // Generate unique ID for this etymology card
            var cardId = 'etymology-card-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            
            return `
                <div id="${cardId}" class="etymology-card" style="
                    width: 85%;
                    margin: 1rem auto;
                    padding: 1.5rem; 
                    border: 2px solid #10b981; 
                    border-radius: 1rem; 
                    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); 
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    position: relative;
                    overflow: visible;
                ">
                    <!-- Delete Button -->
                    <div class="etymology-delete-btn" data-card-id="${cardId}" style="
                        position: absolute;
                        top: -8px;
                        right: -8px;
                        width: 24px;
                        height: 24px;
                        background: #dc2626;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
                        border: 2px solid white;
                        z-index: 10;
                        transition: all 0.2s ease;
                    ">
                        <span style="color: white; font-size: 12px; font-weight: bold; line-height: 1;">×</span>
                    </div>
                    
                    <div style="text-align: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #a7f3d0;">
                        <h2 style="font-size: 3rem; font-weight: bold; color: #064e3b; margin: 0; font-family: 'Amiri', 'Arial Unicode MS', 'Tahoma', serif; direction: rtl; unicode-bidi: bidi-override;">${arabicWord || '(Arabic text not available)'}</h2>
                        <p style="font-size: 1.125rem; color: #065f46; margin: 0.5rem 0 0 0; font-style: italic;">(${transliteration || 'No transliteration'})</p>
                        <p style="font-size: 1rem; color: #374151; margin: 0.5rem 0 0 0; font-weight: 500;">${englishMeaning || 'No meaning provided'}</p>
                    </div>
                    
                    <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin: 0 0 0.5rem 0; color: #111827;">Root: <span style="font-family: 'Amiri', 'Arial Unicode MS', 'Tahoma', serif; font-size: 1.5rem; direction: rtl; unicode-bidi: bidi-override;">${root || 'No root'}</span></h3>
                        <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">${rootMeaning || 'No root meaning provided'}</p>
                    </div>
                    
                    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; color: #111827; text-align: center;">
                        ${(etymologyData.derivatives && etymologyData.derivatives.length > 0) ? 
                            `Other Derivatives (${etymologyData.derivatives.length})` : 
                            '0 Related Words'}
                    </h3>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem;">
                        ${(etymologyData.derivatives || []).map((d, index) => `
                            <div style="padding: 0.5rem; border: 1px solid #86efac; border-radius: 0.5rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); text-align: center; flex: 1; min-width: 0; background: ${index % 2 === 0 ? '#f0fdf4' : '#f7fee7'};">
                                <span style="font-size: 1.25rem; font-weight: bold; color: #111827; font-family: 'Amiri', 'Arial Unicode MS', 'Tahoma', serif; direction: rtl; unicode-bidi: bidi-override;">${d.word || d.arabicWord || '(Arabic N/A)'}</span>
                                <p style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0 0;">(${d.transliteration || 'No transliteration'})</p>
                                <p style="font-size: 0.75rem; color: #4b5563; margin: 0.25rem 0 0 0;">${d.meaning || d.englishMeaning || 'No meaning'}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        function activateController() {
            var promises = [];
            
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(result) {
                vm.viewReady = true;
                
                // Only show panel on admin routes - but don't load data by default
                try {
                    var currentPath = $location ? $location.path() : window.location.hash.replace('#!', '');
                    var isAdminRoute = currentPath.indexOf('/admin') !== -1;
                    
                    // Panel is available on admin routes but hidden until user action
                    vm.isVisible = false; // Always start hidden
                    vm.etymologyList = []; // Always start with empty list
                } catch (error) {
                    vm.isVisible = false;
                }
            }
        }
    }
})();
