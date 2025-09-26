/**
 * Base Plugin - Common functionality for Froala plugins
 * Provides standardized plugin patterns and utilities
 */
(function() {
    'use strict';

    // Use deferred registration to avoid module not found errors
    function registerBasePlugin() {
        // Check if Angular app module exists before registering
        try {
            if (typeof angular !== 'undefined' && angular.module) {
                // Try to get the app module - this will throw if it doesn't exist
                angular.module('app');
                
                // Module exists, safe to register
                var serviceId = "froalaBasePlugin";
                angular.module("app").service(serviceId, [froalaBasePlugin]);
                
                console.log('✅ [FROALA-BASE-PLUGIN] Successfully registered with Angular app module');
                return true;
            } else {
                console.warn('[FROALA-BASE-PLUGIN] Angular not available, skipping registration');
                return false;
            }
        } catch (e) {
            console.warn('[FROALA-BASE-PLUGIN] Angular app module not found, skipping registration:', e.message);
            return false;
        }
    }

    // Try immediate registration if deferred system is not available (fallback)
    if (typeof window.registerFroalaPlugin === 'function') {
        window.registerFroalaPlugin(registerBasePlugin, 'froalaBasePlugin');
    } else {
        // Fallback to old behavior
        registerBasePlugin();
    }

    function froalaBasePlugin() {
        var service = {
            createButtonConfig: createButtonConfig,
            showToastNotification: showToastNotification,
            saveSelectionState: saveSelectionState,
            restoreSelection: restoreSelection
        };

        return service;

        /**
         * Creates a standardized button configuration for Froala
         * @param {Object} options - Button configuration
         * @param {string} options.name - Button name/ID
         * @param {string} options.icon - FontAwesome icon class
         * @param {string} options.title - Button tooltip
         * @param {Function} options.callback - Click callback function
         * @returns {Object} Froala button configuration
         */
        function createButtonConfig(options) {
            return {
                title: options.title,
                icon: options.icon,
                undo: true,
                focus: true,
                refreshAfterCallback: true,
                callback: function() {
                    try {
                        options.callback.call(this, this);
                    } catch (error) {
                        console.error('❌ [' + options.name.toUpperCase() + '] Button callback error:', error);
                        showToastNotification('error', 'Button Error', 'An error occurred. Please try again.');
                    }
                }
            };
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
         * Saves the current selection state for later restoration
         * @param {Object} editor - Froala editor instance
         * @returns {Object} Selection state object
         */
        function saveSelectionState(editor) {
            var selectionState = {
                hasSelection: false,
                selectedHtml: '',
                range: null
            };
            
            var selection = editor.selection.get();
            if (selection && !selection.isCollapsed) {
                selectionState.hasSelection = true;
                selectionState.selectedHtml = editor.selection.text();
                selectionState.range = selection.cloneRange();
            }
            
            return selectionState;
        }

        /**
         * Restores a previously saved selection state
         * @param {Object} editor - Froala editor instance
         * @param {Object} selectionState - Previously saved selection state
         */
        function restoreSelection(editor, selectionState) {
            if (selectionState.hasSelection && selectionState.range) {
                try {
                    var selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(selectionState.range);
                    editor.selection.restore();
                } catch (error) {
                    console.warn('Could not restore selection state:', error);
                }
            }
        }
    }
})();
