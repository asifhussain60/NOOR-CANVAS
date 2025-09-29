/**
 * Froala Utilities - Shared utility functions for Froala plugins
 * Provides common functionality used across multiple plugins
 */
(function() {
    'use strict';

    // Use deferred registration to avoid module not found errors
    function registerUtilities() {
        // Check if Angular app module exists before registering
        try {
            if (typeof angular !== 'undefined' && angular.module) {
                // Try to get the app module - this will throw if it doesn't exist
                angular.module('app');
                
                // Module exists, safe to register
                angular.module("app").service("froalaUtilities", [froalaUtilities]);
                
                console.log('✅ [FROALA-UTILITIES] Successfully registered with Angular app module');
                return true;
            } else {
                console.warn('[FROALA-UTILITIES] Angular not available, skipping registration');
                return false;
            }
        } catch (e) {
            console.warn('[FROALA-UTILITIES] Angular app module not found, skipping registration:', e.message);
            return false;
        }
    }

    // Try immediate registration if deferred system is not available (fallback)
    if (typeof window.registerFroalaPlugin === 'function') {
        window.registerFroalaPlugin(registerUtilities, 'froalaUtilities');
    } else {
        // Fallback to old behavior
        registerUtilities();
    }

    function froalaUtilities() {
        var service = {
            attachRestoreButtonHandlers: attachRestoreButtonHandlers,
            showToastNotification: showToastNotification
        };

        // Make service available globally for plugins
        window.froalaUtilities = service;

        return service;

        /**
         * Attach restore button event handlers for poetry formatting
         * @param {Object} editor - Froala editor instance
         */
        function attachRestoreButtonHandlers(editor) {
            console.log('🔧 [UTILITIES] Attaching restore button handlers');
            
            try {
                // Find all restore buttons in the editor
                $(editor.el).find('.poetry-restore-btn').off('click').on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    var $button = $(this);
                    var $poetryContainer = $button.closest('.froala-poetry-container');
                    
                    if ($poetryContainer.length > 0) {
                        var originalText = $poetryContainer.data('original-text');
                        if (originalText) {
                            // Replace the entire poetry container with plain text
                            var $parentContainer = $poetryContainer.closest('.poetry-wrapper, .container');
                            if ($parentContainer.length > 0) {
                                $parentContainer.replaceWith('<p>' + escapeHtml(originalText) + '</p>');
                            } else {
                                $poetryContainer.replaceWith('<p>' + escapeHtml(originalText) + '</p>');
                            }
                            
                            showToastNotification('success', 'Formatting Removed', 'Poetry formatting has been removed and original text restored.');
                            console.log('✅ [UTILITIES] Poetry formatting restored to plain text');
                        } else {
                            showToastNotification('warning', 'Restore Failed', 'Original text not found. Cannot restore formatting.');
                            console.warn('⚠️ [UTILITIES] No original text found for restoration');
                        }
                    }
                });
                
                console.log('✅ [UTILITIES] Restore button handlers attached successfully');
                
            } catch (error) {
                console.error('❌ [UTILITIES] Error attaching restore button handlers:', error);
            }
        }

        /**
         * Shows a toast notification (assumes toastr is available)
         * @param {string} type - Notification type: success, error, warning, info
         * @param {string} title - Notification title
         * @param {string} message - Notification message
         */
        function showToastNotification(type, title, message) {
            if (typeof toastr !== 'undefined') {
                toastr[type](message, title);
            } else {
                console.log('[TOAST ' + type.toUpperCase() + '] ' + title + ': ' + message);
            }
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
    }
})();
