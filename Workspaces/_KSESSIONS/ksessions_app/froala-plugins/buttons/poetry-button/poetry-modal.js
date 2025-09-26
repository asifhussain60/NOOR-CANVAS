/**
 * Poetry Modal - Modal handling for poetry metadata input
 * Manages the poetry/Quran metadata input dialog
 */
(function() {
    'use strict';

    // Use deferred registration to avoid module not found errors
    function registerPoetryModal() {
        // Check if Angular app module exists before registering
        try {
            if (typeof angular !== 'undefined' && angular.module) {
                // Try to get the app module - this will throw if it doesn't exist
                angular.module('app');
                
                // Module exists, safe to register
                angular.module("app").factory("froalaPoetryModal", [
                    "froalaModalService", 
                    "froalaDialogService", 
                    "froalaBasePlugin",
                    froalaPoetryModal
                ]);
                
                console.log('✅ [FROALA-POETRY-MODAL] Successfully registered with Angular app module');
                return true;
            } else {
                console.warn('[FROALA-POETRY-MODAL] Angular not available, skipping registration');
                return false;
            }
        } catch (e) {
            console.warn('[FROALA-POETRY-MODAL] Angular app module not found, skipping registration:', e.message);
            return false;
        }
    }

    // Try immediate registration if deferred system is not available (fallback)
    if (typeof window.registerFroalaPlugin === 'function') {
        window.registerFroalaPlugin(registerPoetryModal, 'froalaPoetryModal');
    } else {
        // Fallback to old behavior
        registerPoetryModal();
    }

    function froalaPoetryModal(modalService, dialogService, basePlugin) {
        var service = {
            show: showPoetryMetadataModal
        };

        // Make service available globally for poetry button
        window.froalaPoetryModal = service;

        return service;

        /**
         * Shows poetry metadata input modal
         * @param {Object} editor - Froala editor instance
         * @param {string} text - Cleaned text content
         * @param {string} contentType - Detected content type
         */
        function showPoetryMetadataModal(editor, text, contentType) {
            try {
                // Save selection state for immediate replacement (no markers)
                var selectionState = basePlugin.saveSelectionState(editor);
                
                if (selectionState.hasSelection) {
                    console.log('💾 [POETRY-MODAL] Saved selection state for immediate replacement');
                } else {
                    console.log('💾 [POETRY-MODAL] No selection - will insert at cursor position');
                }
                
                // Create modal body HTML
                var bodyHtml = `
                    <div class="form-group">
                        <label class="control-label">Content Type:</label>
                        <div style="margin-top: 10px;">
                            <label class="radio-inline">
                                <input type="radio" name="content-type" id="radio-poetry" value="poetry" checked>
                                <i class="fa fa-feather" style="margin-right: 5px; color: #722727;"></i>Poetry
                            </label>
                            <label class="radio-inline" style="margin-left: 20px;">
                                <input type="radio" name="content-type" id="radio-quran" value="quran">
                                <i class="fa fa-book" style="margin-right: 5px; color: #2c5530;"></i>Quran Verses
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="poetry-metadata-input" class="control-label" id="input-label">
                            <i class="fa fa-feather" style="margin-right: 5px; color: #722727;"></i>Poet's Name:
                        </label>
                        <input type="text" class="form-control" id="poetry-metadata-input" 
                               placeholder="e.g., Rumi, Ibn Zaydoun, etc." maxlength="100" autocomplete="off">
                        <small class="help-block" id="input-help">Enter the poet's name (optional)</small>
                    </div>
                `;

                // Create modal configuration
                var modalConfig = {
                    id: 'poetry-metadata-modal',
                    title: 'Format Content',
                    titleIcon: 'fa-music text-success',
                    bodyHtml: bodyHtml,
                    buttons: [
                        { text: 'Cancel', class: 'btn-default', dismiss: true, icon: 'fa-times' },
                        { text: 'Apply Formatting', class: 'btn-success', id: 'poetry-apply-btn', icon: 'fa-magic' }
                    ]
                };

                // Create and show modal
                var $modal = modalService.createBootstrapModal(modalConfig);
                
                // Handle radio button changes
                $modal.find('input[name="content-type"]').on('change', function() {
                    var selectedType = $(this).val();
                    var $label = $modal.find('#input-label');
                    var $input = $modal.find('#poetry-metadata-input');
                    var $help = $modal.find('#input-help');
                    
                    if (selectedType === 'quran') {
                        $label.html('<i class="fa fa-book" style="margin-right: 5px; color: #2c5530;"></i>Reference (Optional):');
                        $input.attr('placeholder', 'e.g., Al-Fatiha, Verse 1-7');
                        $help.text('Enter Surah name, verse numbers, or any reference (optional)');
                    } else {
                        $label.html('<i class="fa fa-feather" style="margin-right: 5px; color: #722727;"></i>Poet\'s Name:');
                        $input.attr('placeholder', 'e.g., Rumi, Ibn Zaydoun, etc.');
                        $help.text('Enter the poet\'s name (optional)');
                    }
                });
                
                // Focus on the input when modal is shown
                $modal.on('shown.bs.modal', function() {
                    $modal.find('#poetry-metadata-input').focus();
                });
                
                // Handle apply button click
                $modal.find('#poetry-apply-btn').off('click').on('click', function() {
                    var selectedType = $modal.find('input[name="content-type"]:checked').val();
                    var inputValue = $modal.find('#poetry-metadata-input').val().trim();
                    var metadata = {};
                    
                    // Use simple poetry metadata for everything
                    metadata.type = 'poetry';
                    metadata.poetName = inputValue;
                    
                    // Hide modal
                    modalService.hideModal('poetry-metadata-modal');
                    
                    // Apply formatting immediately using saved selection state
                    applyPoetryFormattingImmediate(editor, text, contentType, metadata, selectionState);
                });
                
                // Handle Enter key in input
                $modal.find('#poetry-metadata-input').on('keypress', function(e) {
                    if (e.which === 13) { // Enter key
                        $modal.find('#poetry-apply-btn').click();
                    }
                });
                
                // Handle modal cancellation - no cleanup needed with immediate approach
                $modal.on('hidden.bs.modal', function() {
                    console.log('🔄 [POETRY-MODAL] Modal cancelled, no cleanup needed with immediate approach');
                    modalService.removeModal('poetry-metadata-modal');
                });
                
            } catch (error) {
                console.error('❌ [POETRY-MODAL] Error showing metadata modal:', error);
                basePlugin.showToastNotification('error', 'Modal Error', 'Unable to show input dialog. Please try again.');
            }
        }

        /**
         * Apply poetry formatting immediately using saved selection state
         * @param {Object} editor - Froala editor instance
         * @param {string} text - Text to format
         * @param {string} contentType - Content type
         * @param {Object} metadata - Metadata object
         * @param {Object} selectionState - Saved selection state
         */
        function applyPoetryFormattingImmediate(editor, text, contentType, metadata, selectionState) {
            // This will be handled by the poetry formatter service
            if (window.froalaPoetryFormatter && window.froalaPoetryFormatter.format) {
                window.froalaPoetryFormatter.format(editor, text, contentType, metadata, selectionState);
            } else {
                console.error('❌ [POETRY-MODAL] Poetry formatter service not available');
                basePlugin.showToastNotification('error', 'Formatter Error', 'Poetry formatting service is not available. Please try again.');
            }
        }
    }
})();
