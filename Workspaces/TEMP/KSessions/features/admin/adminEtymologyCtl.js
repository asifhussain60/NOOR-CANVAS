(function () {
    'use strict';

    angular
        .module('app')
        .controller('adminEtymologyCtl', AdminEtymologyController);

    AdminEtymologyController.$inject = ['$scope', '$timeout', 'common', 'datacontext', 'etymologyService', 'froalaConfig'];

    function AdminEtymologyController($scope, $timeout, common, datacontext, etymologyService, froalaConfig) {
        var vm = this;
        var controllerId = "adminEtymologyCtl";
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        // Properties
        vm.isVisible = true; // Show by default on admin etymology page
        vm.etymologyList = [];
        vm.searchQuery = '';
        vm.isLoading = false;
        vm.searchTimeout = null;
        vm.viewReady = true;

        // Methods
        vm.performSearch = performSearch;
        vm.insertEtymologyAtCursor = insertEtymologyAtCursor;
        vm.insertFullEtymologyCard = insertFullEtymologyCard;
        vm.close = close;

        // Initialize
        activate();

        function activate() {
            console.log('🌿 [ADMIN-ETYMOLOGY] Controller activated');
            logSuccess('Etymology admin panel ready');
            
            // Start with empty state - user should search for real data
            vm.etymologyList = [];
            console.log('📊 [ADMIN-ETYMOLOGY] Ready for user search - no initial data loaded');
        }

        function performSearch() {
            console.log('🔍 [ADMIN-ETYMOLOGY] Performing search for:', vm.searchQuery);
            
            // Clear existing timeout
            if (vm.searchTimeout) {
                $timeout.cancel(vm.searchTimeout);
            }

            // If search query is empty, show sample data
            if (!vm.searchQuery || vm.searchQuery.trim().length < 2) {
                loadSampleData();
                return;
            }

            vm.isLoading = true;

            // Search with 2-second debounce as requested
            vm.searchTimeout = $timeout(function() {
                etymologyService.searchEtymology(vm.searchQuery.trim())
                    .then(function(results) {
                        console.log('✅ [ADMIN-ETYMOLOGY] Search results received:', results);
                        vm.etymologyList = results || [];
                        vm.isLoading = false;
                        
                        if (vm.etymologyList.length > 0) {
                            logSuccess('Found ' + vm.etymologyList.length + ' etymology results');
                        } else {
                            log('No etymology results found for: ' + vm.searchQuery);
                        }
                    })
                    .catch(function(error) {
                        console.error('❌ [ADMIN-ETYMOLOGY] Search failed:', error);
                        logError('Etymology search failed: ' + (error.message || 'Unknown error'));
                        vm.etymologyList = [];
                        vm.isLoading = false;
                        
                        // Fallback to sample data on error
                        loadSampleData();
                    });
            }, 2000); // 2-second delay as requested
        }

        function insertEtymologyAtCursor(etymology, selectedDerivative) {
            console.log('📝 [ADMIN-ETYMOLOGY] Inserting etymology at cursor:', {
                root: etymology.rootArabic,
                derivative: selectedDerivative.arabicWord
            });

            try {
                // Generate the etymology div HTML based on the template
                var etymologyHtml = generateEtymologyDiv(etymology, selectedDerivative);
                
                // Insert at cursor position using Froala's marker strategy
                insertAtFroalaCursor(etymologyHtml);
                
                logSuccess('Etymology inserted successfully');
                
            } catch (error) {
                console.error('❌ [ADMIN-ETYMOLOGY] Failed to insert etymology:', error);
                logError('Failed to insert etymology: ' + error.message);
            }
        }

        function insertFullEtymologyCard(etymology) {
            console.log('📑 [ADMIN-ETYMOLOGY] Inserting full etymology card:', etymology.rootArabic);
            
            try {
                // Generate full card HTML
                var cardHtml = generateFullEtymologyCard(etymology);
                
                // Insert at cursor position
                insertAtFroalaCursor(cardHtml);
                
                logSuccess('Full etymology card inserted successfully');
                
            } catch (error) {
                console.error('❌ [ADMIN-ETYMOLOGY] Failed to insert full card:', error);
                logError('Failed to insert etymology card: ' + error.message);
            }
        }

        function generateEtymologyDiv(etymology, selectedDerivative) {
            // Generate canonical data-* attributes for etymology blocks (Phase 4)
            var etymologyId = generateUUID(); // Generate unique ID for this etymology block
            var rootId = etymology.rootId || 'unknown';
            var derivativeId = selectedDerivative.derivativeId || 'unknown';
            var contentType = 'etymology';
            var rootArabic = etymology.rootArabic || 'Unknown Root';
            
            // DEBUG: Log data-* attributes being added to Etymology HTML
            console.log('🔍 [ETYMOLOGY-DIV] Adding data-* attributes to Etymology HTML:', {
                etymologyId: etymologyId,
                dataType: contentType,
                dataRootId: rootId,
                dataDerivativeId: derivativeId,
                dataRootArabic: rootArabic,
                dataContentType: contentType,
                selectedDerivative: selectedDerivative,
                etymology: etymology,
                phase: 'Phase 4 (Etymology)',
                function: 'generateEtymologyDiv',
                timestamp: new Date().toISOString()
            });
            
            // Generate HTML based on the template from Etymolog Inserted Div.html
            var derivativesHtml = etymology.derivatives.map(function(d, index) {
                var isSelected = d.derivativeId === selectedDerivative.derivativeId;
                var bgClass = isSelected ? 'bg-blue-100 border-blue-400' : 
                             (index % 2 === 0 ? 'bg-green-50 border-green-300' : 'bg-lime-50 border-green-300');
                
                return `
                    <div class="inserted-etymology-derivative ${bgClass}" data-derivative-id="${d.derivativeId}" data-derivative-word="${escapeHtml(d.arabicWord)}">
                        <span class="inserted-etymology-derivative-word etymology-panel-arabic-font">${d.arabicWord}</span>
                        <p class="inserted-etymology-derivative-transliteration">(${d.transliteration})</p>
                        <p class="inserted-etymology-derivative-meaning">${d.meaning}</p>
                    </div>
                `;
            }).join('');

            return `
                <div class="inserted-etymology-container" data-type="${contentType}" data-id="${etymologyId}" data-root-id="${rootId}" data-derivative-id="${derivativeId}" data-root-arabic="${escapeHtml(rootArabic)}" data-content-type="${contentType}">
                    <div class="inserted-etymology-header">
                        <h1 class="inserted-etymology-word etymology-panel-arabic-font">${selectedDerivative.arabicWord}</h1>
                        <p class="inserted-etymology-meaning etymology-panel-elegant-font">${selectedDerivative.meaning}</p>
                    </div>

                    <div class="inserted-etymology-root-section">
                        <h3 class="inserted-etymology-root-label">Root: <span class="inserted-etymology-root-word etymology-panel-arabic-font">${etymology.rootArabic}</span></h3>
                        <p class="inserted-etymology-root-meaning">
                            Meaning: <span class="etymology-panel-elegant-font">${etymology.rootMeaning}</span>
                        </p>
                    </div>

                    <h3 class="inserted-etymology-derivatives-title">Other Derivatives</h3>
                    <div class="inserted-etymology-derivatives-grid">
                        ${derivativesHtml}
                    </div>
                </div>
            `;
        }

        function generateFullEtymologyCard(etymology) {
            // Generate canonical data-* attributes for etymology blocks (Phase 4)
            var etymologyId = generateUUID(); // Generate unique ID for this etymology block
            var rootId = etymology.rootId || 'unknown';
            var contentType = 'etymology-full';
            var rootArabic = etymology.rootArabic || 'Unknown Root';
            
            // DEBUG: Log data-* attributes being added to Full Etymology HTML
            console.log('🔍 [ETYMOLOGY-FULL] Adding data-* attributes to Full Etymology HTML:', {
                etymologyId: etymologyId,
                dataType: contentType,
                dataRootId: rootId,
                dataRootArabic: rootArabic,
                dataContentType: contentType,
                derivativesCount: etymology.derivatives ? etymology.derivatives.length : 0,
                etymology: etymology,
                phase: 'Phase 4 (Etymology)',
                function: 'generateFullEtymologyCard',
                timestamp: new Date().toISOString()
            });
            
            var derivativesHtml = etymology.derivatives.map(function(d, index) {
                var bgClass = index % 2 === 0 ? 'bg-green-50 border-green-300' : 'bg-lime-50 border-green-300';
                
                return `
                    <div class="inserted-etymology-derivative ${bgClass}" data-derivative-id="${d.derivativeId}" data-derivative-word="${escapeHtml(d.arabicWord)}">
                        <span class="inserted-etymology-derivative-word etymology-panel-arabic-font">${d.arabicWord}</span>
                        <p class="inserted-etymology-derivative-transliteration">(${d.transliteration})</p>
                        <p class="inserted-etymology-derivative-meaning">${d.meaning}</p>
                    </div>
                `;
            }).join('');

            return `
                <div class="inserted-etymology-container" data-type="${contentType}" data-id="${etymologyId}" data-root-id="${rootId}" data-root-arabic="${escapeHtml(rootArabic)}" data-content-type="${contentType}">
                    <div class="inserted-etymology-header">
                        <h1 class="inserted-etymology-word etymology-panel-arabic-font">${etymology.rootArabic}</h1>
                        <p class="inserted-etymology-meaning etymology-panel-elegant-font">${etymology.rootMeaning}</p>
                    </div>

                    <h3 class="inserted-etymology-derivatives-title">All Derivatives (${etymology.derivatives.length})</h3>
                    <div class="inserted-etymology-derivatives-grid">
                        ${derivativesHtml}
                    </div>
                </div>
            `;
        }

        function insertAtFroalaCursor(htmlContent) {
            try {
                console.log('📝 [ADMIN-ETYMOLOGY] Attempting to insert etymology content');
                
                // Use the froalaConfig service for insertion
                var insertResult = froalaConfig.insertEtymologyAtCursor(htmlContent);
                
                if (insertResult === true) {
                    logSuccess('Etymology content inserted successfully at cursor position');
                } else if (insertResult === 'clipboard') {
                    common.showToast('Etymology content copied to clipboard - paste it manually', 'info');
                } else {
                    console.warn('⚠️ [ADMIN-ETYMOLOGY] Insertion failed, trying fallback methods');
                    
                    // Fallback: Try to copy to clipboard manually
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(htmlContent)
                            .then(function() {
                                common.showToast('Etymology HTML copied to clipboard - paste it manually', 'info');
                            })
                            .catch(function(error) {
                                console.error('Failed to copy to clipboard:', error);
                                common.showToast('Failed to insert etymology - no active editor found', 'error');
                            });
                    } else {
                        // Final fallback: Show content in a dialog or prompt
                        common.showToast('No active editor found. Etymology HTML logged to console.', 'warning');
                        console.log('Etymology HTML content:', htmlContent);
                    }
                }
                
            } catch (error) {
                console.error('❌ [ADMIN-ETYMOLOGY] Critical error during insertion:', error);
                logError('Failed to insert etymology: ' + error.message);
                common.showToast('Error inserting etymology content', 'error');
            }
        }

        function loadSampleData() {
            console.log('📚 [ADMIN-ETYMOLOGY] Loading sample etymology data');
            
            // Sample data based on the template requirements
            vm.etymologyList = [
                {
                    rootId: 'sample1',
                    rootArabic: 'ا-ل-ه',
                    rootMeaning: 'To be worshiped, to be distracted, to love passionately',
                    derivatives: [
                        {
                            derivativeId: 'der1',
                            arabicWord: 'اللّٰه',
                            transliteration: 'Allāh',
                            meaning: 'The God'
                        },
                        {
                            derivativeId: 'der2',
                            arabicWord: 'إِلَٰه',
                            transliteration: 'ilāh',
                            meaning: 'God, deity'
                        },
                        {
                            derivativeId: 'der3',
                            arabicWord: 'أَلِهَ',
                            transliteration: 'aliha',
                            meaning: 'To worship'
                        },
                        {
                            derivativeId: 'der4',
                            arabicWord: 'تَأَلَّهَ',
                            transliteration: 'ta\'allaha',
                            meaning: 'To deify oneself'
                        }
                    ]
                },
                {
                    rootId: 'sample2',
                    rootArabic: 'س-ل-م',
                    rootMeaning: 'To be safe, secure, to be sound',
                    derivatives: [
                        {
                            derivativeId: 'der5',
                            arabicWord: 'إِسْلَام',
                            transliteration: 'Islām',
                            meaning: 'Submission to God'
                        },
                        {
                            derivativeId: 'der6',
                            arabicWord: 'سَلَام',
                            transliteration: 'salām',
                            meaning: 'Peace'
                        },
                        {
                            derivativeId: 'der7',
                            arabicWord: 'سَلِمَ',
                            transliteration: 'salima',
                            meaning: 'To be safe'
                        },
                        {
                            derivativeId: 'der8',
                            arabicWord: 'سِلْم',
                            transliteration: 'silm',
                            meaning: 'Peace, reconciliation'
                        }
                    ]
                }
            ];
            
            log('Sample etymology data loaded: ' + vm.etymologyList.length + ' entries');
        }

        /**
         * Generate a UUID for content identification
         */
        function generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0;
                var v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        /**
         * Escape HTML characters for safe insertion
         */
        function escapeHtml(text) {
            if (typeof text !== 'string') {
                return '';
            }
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function close() {
            console.log('🚪 [ADMIN-ETYMOLOGY] Closing etymology panel');
            vm.isVisible = false;
            
            // Navigate back or close modal if needed
            // This could trigger a route change or modal close
        }
    }
})();
