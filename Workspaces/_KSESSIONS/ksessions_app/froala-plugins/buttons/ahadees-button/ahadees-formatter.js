/**
 * Ahadees Formatter Module - HTML formatting & insertion
 * Part of the decomposed Froala Ahadees Plugin
 */
(function() {
    'use strict';

    // Use deferred registration system
    if (typeof window.registerFroalaPlugin === 'function') {
        window.registerFroalaPlugin(function() {
            angular.module("app").factory("froalaAhadeesFormatter", [
                "froalaModalService",
                "froalaDialogService",
                "froalaBasePlugin",
                "froalaUtilities",
                froalaAhadeesFormatter
            ]);
            console.log('✅ [FROALA-AHADEES-FORMATTER] Successfully registered with Angular app module');
        }, 'froalaAhadeesFormatter');
    } else {
        console.error('❌ [FROALA-AHADEES-FORMATTER] Deferred registration system not available');
    }

    function froalaAhadeesFormatter(
        modalService,
        dialogService,
        basePlugin,
        utilities
    ) {
        var service = {
            insertAhadees: insertAhadees,
            displayModalResults: displayModalResults,
            displayModalError: displayModalError,
            displayNoResultsMessage: displayNoResultsMessage
        };

        return service;

        /**
         * Insert selected ahadees into the editor
         */
        function insertAhadees(ahadeesData, editor, insertionMarker, markerPlaced, markerCallback) {
            if (!ahadeesData) {
                console.error('❌ [AHADEES-FORMATTER] No ahadees data provided!');
                return;
            }

            // Generate a unique ID for this hadees instance
            var ahadeesId = 'ahadees-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

            // Create beautiful HTML for the hadees with delete button - matches screenshot exactly
            // Add canonical data-* attributes so client tooling can read metadata directly from DOM
            var tokenVal = 'H|' + (ahadeesData && (ahadeesData.id || ahadeesData.ahadeesId) ? (ahadeesData.id || ahadeesData.ahadeesId) : ahadeesId);
            var collectionVal = (ahadeesData && (ahadeesData.collection || ahadeesData.source)) ? (ahadeesData.collection || ahadeesData.source) : '';
            
            // DEBUG: Log data-* attributes being added to Ahadees
            console.log('🔍 [AHADEES-FORMATTER] Adding data-* attributes to Ahadees HTML:', {
                ahadeesId: ahadeesId,
                dataType: 'hadees',
                dataId: (ahadeesData && (ahadeesData.id || ahadeesData.ahadeesId) ? (ahadeesData.id || ahadeesData.ahadeesId) : ahadeesId),
                dataToken: tokenVal,
                dataCollection: collectionVal,
                originalData: ahadeesData,
                phase: 'Phase 2 (Ahadees)',
                timestamp: new Date().toISOString()
            });
            
            var ahadeesHtml = '<div class="inserted-hadees ks-ahadees-container" id="' + ahadeesId + '" data-type="hadees" data-id="' + (ahadeesData && (ahadeesData.id || ahadeesData.ahadeesId) ? (ahadeesData.id || ahadeesData.ahadeesId) : ahadeesId) + '" data-token="' + tokenVal + '" data-collection="' + collectionVal + '">' +
                '<button class="delete-hadees-btn ks-ahadees-delete-btn" data-ahadees-id="' + ahadeesId + '" title="Delete this hadees">✕</button>' +
                '<div class="hadees-header ks-ahadees-header">' +
                    '<h4>' +
                        '<i class="fa fa-comment ks-ahadees-header-icon" aria-hidden="true"></i>' +
                        (ahadeesData.narrator || ahadeesData.narratorName || 'Rasul Allah(Salallahu alayhi wa aalihee wa sallam)') +
                        (ahadeesData.subject ? '<span class="ks-ahadees-subject">- ' + ahadeesData.subject + '</span>' : '<span class="ks-ahadees-subject">- intellect</span>') +
                    '</h4>' +
                '</div>' +
                (ahadeesData.ahadeesArabic ?
                    '<div class="hadees-arabic ks-ahadees-arabic">' + ahadeesData.ahadeesArabic + '</div>' :
                    '<div class="hadees-arabic ks-ahadees-arabic">أول ما خلق الله عز وجل العقل - قال له: أقبل فأقبل ، ثم قال له: أدبر فأدبر فقال: وعزتي وجلالي ما خلقت خلقا أوجه إلي منك ، ولا أكملك إلا فيمن أحب . أما إني إياك آمرك وإياك أنهى وإياك أعطي وإياك أثيب وإياك أعاقب</div>'
                ) +
                (ahadeesData.ahadeesEnglish ?
                    '<div class="hadees-english ks-ahadees-english">' + ahadeesData.ahadeesEnglish + '</div>' :
                    '<div class="hadees-english ks-ahadees-english">The first thing that Allah created is the intellect. When Allah created the intellect, He examined it. He then said to it: Step forward, so it stepped forward. Then he said: Go back! So it went back. Then he said: By My power and majesty! I did not create any creature dearer to me than you. I will not make you perfect, except in the one whom I love. Indeed, to you are my orders and prohibitions addressed. And for you are my rewards and retributions reserved.</div>'
                ) +
                '</div>';

            // Find and replace the insertion marker with the hadees HTML
            if (markerPlaced) {
                var currentHtml = editor.html.get();
                var updatedHtml = currentHtml.replace(insertionMarker, ahadeesHtml);
                editor.html.set(updatedHtml);
                if (markerCallback) markerCallback(false);
            } else {
                editor.html.insert(ahadeesHtml);
            }

            // Close the modal (fallback modal is the only one being used)
            $('#ahadees-fallback-modal').remove();

            // Show success message
            try {
                // Use the same injector method that works for data loading
                var ngApp = document.querySelector('[ng-app]') || document.querySelector('[data-ng-app]');
                if (ngApp) {
                    var injector = angular.element(ngApp).injector();
                    if (injector) {
                        var common = injector.get('common');
                        if (common && common.showToast) {
                            common.showToast('Hadees inserted successfully', 'success');
                        }
                    }
                }
            } catch (e) {
                // Silent fail for toast notification
            }

            // Restore focus to the Froala editor after insertion
            setTimeout(function() {
                if (editor && editor.$el) {
                    editor.events.focus();
                }
            }, 200);
        }

        /**
         * Display results in modal
         */
        function displayModalResults(results, editor, insertionMarker, markerPlaced, markerCallback) {
            console.log('🔍 [AHADEES-FORMATTER] displayModalResults called with:', results);

            var $resultsContainer = $('#fallback-ahadees-results');

            if (!results) {
                console.log('🔍 [AHADEES-FORMATTER] No results - showing empty message');
                $resultsContainer.html(`
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <div style="font-size: 32px; margin-bottom: 15px; color: #ffc107;">ℹ️</div>
                        <p>No results returned from API</p>
                    </div>
                `);
                return;
            }

            // Handle case where results is not an array - extract the actual array
            var actualResults = null;
            if (Array.isArray(results)) {
                actualResults = results;
            } else if (results.ahadeesList && Array.isArray(results.ahadeesList)) {
                console.log('🔍 [AHADEES-FORMATTER] Using results.ahadeesList as array');
                actualResults = results.ahadeesList;
            } else if (results.data && Array.isArray(results.data)) {
                actualResults = results.data;
            } else if (results.items && Array.isArray(results.items)) {
                actualResults = results.items;
            } else if (results.results && Array.isArray(results.results)) {
                actualResults = results.results;
            } else {
                console.error('❌ [AHADEES-FORMATTER] Could not find array in results. Raw results:', results);
                $resultsContainer.html(`
                    <div style="text-align: center; padding: 40px; color: #d32f2f;">
                        <div style="font-size: 32px; margin-bottom: 15px;">⚠️</div>
                        <p>Unexpected API response format. Check console for details.</p>
                        <small style="font-family: monospace; background: #f5f5f5; padding: 5px; display: block; margin-top: 10px;">Type: ${typeof results}, IsArray: ${Array.isArray(results)}</small>
                    </div>
                `);
                return;
            }

            if (actualResults.length === 0) {
                console.log('🔍 [AHADEES-FORMATTER] Empty results array - showing no results message');
                $resultsContainer.html(`
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <div style="font-size: 32px; margin-bottom: 15px; color: #ffc107;">ℹ️</div>
                        <p>No ahadees found matching your criteria</p>
                    </div>
                `);
                return;
            }

            console.log('🔍 [AHADEES-FORMATTER] Processing ' + actualResults.length + ' results');

            if (actualResults.length > 0) {
                console.log('🔍 [AHADEES-FORMATTER] First result sample:', actualResults[0]);
            }

            var html = '';

            try {
                actualResults.forEach(function(hadees, index) {
                    if (!hadees) {
                        console.warn('⚠️ [AHADEES-FORMATTER] Skipping null/undefined hadees at index ' + index);
                        return;
                    }

                    // Escape JSON for HTML attribute
                    var escapedJson = JSON.stringify(hadees).replace(/"/g, '&quot;');

                    html += `
                        <div class="fallback-hadees-item ks-ahadees-result-item" data-ahadees='${escapedJson}'>
                            <div class="ks-ahadees-narrator-section">
                                <strong class="ks-ahadees-narrator-name">${hadees.narrator || hadees.narratorName || 'Unknown Narrator'}</strong>
                                ${hadees.subject ? `<span class="ks-ahadees-subject-text"> - ${hadees.subject}</span>` : ''}
                            </div>
                            <div class="ks-ahadees-arabic-section">
                                ${hadees.ahadeesArabic || ''}
                            </div>
                            <div class="ks-ahadees-english-section">
                                ${hadees.ahadeesEnglish || ''}
                            </div>
                            <div class="ks-ahadees-insert-prompt">
                                <small class="ks-ahadees-insert-text">Click to insert ✨</small>
                            </div>
                        </div>
                    `;
                });

                console.log('🔍 [AHADEES-FORMATTER] Generated HTML for ' + actualResults.length + ' hadees items');
                $resultsContainer.html(html);

                // Bind click events
                $('.fallback-hadees-item').click(function() {
                    var ahadeesData = $(this).data('ahadees');
                    console.log('🔍 [AHADEES-FORMATTER] Hadees item clicked:', ahadeesData);
                    insertAhadees(ahadeesData, editor, insertionMarker, markerPlaced, markerCallback);

                    // Remove modal and restore focus
                    $('#ahadees-fallback-modal').remove();
                    $(document).off('keydown.ahadees-modal');
                });

                console.log('🔍 [AHADEES-FORMATTER] Successfully displayed ' + actualResults.length + ' results');

            } catch (error) {
                console.error('❌ [AHADEES-FORMATTER] Error in forEach loop:', error);
                console.error('❌ [AHADEES-FORMATTER] Error stack:', error.stack);
                $resultsContainer.html(`
                    <div style="text-align: center; padding: 40px; color: #d32f2f;">
                        <div style="font-size: 32px; margin-bottom: 15px;">⚠️</div>
                        <p>Error processing results: ${error.message}</p>
                    </div>
                `);
            }
        }

        /**
         * Display error in modal
         */
        function displayModalError(message) {
            $('#fallback-ahadees-results').html(`
                <div style="text-align: center; padding: 40px; color: #d32f2f;">
                    <div style="font-size: 32px; margin-bottom: 15px;">⚠️</div>
                    <p>${message}</p>
                </div>
            `);
        }

        /**
         * Display no results message with suggestions
         */
        function displayNoResultsMessage(searchTerms) {
            $('#fallback-ahadees-results').html(`
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 32px; margin-bottom: 15px; color: #ffc107;">🤷‍♂️</div>
                    <p style="font-size: 16px; margin-bottom: 15px;">No ahadees found for your search</p>
                    <div style="font-size: 14px; background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: left; max-width: 400px; margin: 0 auto;">
                        <strong>Search terms tried:</strong><br>
                        ${searchTerms.map(term => `• ${term}`).join('<br>')}
                        <br><br>
                        <strong>Try searching for:</strong><br>
                        • Common narrators: bukhari, muslim, ahmad<br>
                        • Topics: prayer, fasting, charity<br>
                        • Names: abdullah, muhammad, ali<br>
                        • English words: water, heart, knowledge
                    </div>
                    <button onclick="$('#universal-search-input').focus()" style="margin-top: 15px; background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Try Different Search</button>
                </div>
            `);
        }
    }
})();
