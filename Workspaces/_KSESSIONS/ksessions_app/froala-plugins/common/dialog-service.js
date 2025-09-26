/**
 * Dialog Service - Wrapper for bootstrap.dialog service
 * Provides standardized dialog functionality for Froala plugins
 */
(function() {
    'use strict';

    // Use deferred registration to avoid module not found errors
    function registerDialogService() {
        // Check if Angular app module exists before registering
        try {
            if (typeof angular !== 'undefined' && angular.module) {
                // Try to get the app module - this will throw if it doesn't exist
                angular.module('app');
                
                // Module exists, safe to register
                var serviceId = "froalaDialogService";
                angular.module("app").service(serviceId, ["bootstrap.dialog", froalaDialogService]);
                
                console.log('✅ [FROALA-DIALOG-SERVICE] Successfully registered with Angular app module');
                return true;
            } else {
                console.warn('[FROALA-DIALOG-SERVICE] Angular not available, skipping registration');
                return false;
            }
        } catch (e) {
            console.warn('[FROALA-DIALOG-SERVICE] Angular app module not found, skipping registration:', e.message);
            return false;
        }
    }

    // Try immediate registration if deferred system is not available (fallback)
    if (typeof window.registerFroalaPlugin === 'function') {
        window.registerFroalaPlugin(registerDialogService, 'froalaDialogService');
    } else {
        // Fallback to old behavior
        registerDialogService();
    }

    function froalaDialogService(dlg) {
        var service = {
            confirmationDialog: confirmationDialog,
            showError: showError,
            showSuccess: showSuccess,
            showInfo: showInfo
        };

        // Make dialog service available globally for modal service
        window.froalaDialogService = service;

        return service;

        /**
         * Shows a confirmation dialog
         * @param {string} title - Dialog title
         * @param {string} message - Dialog message
         * @param {string} buttonText - OK button text (default: "OK")
         * @param {Function} callback - Callback function
         */
        function confirmationDialog(title, message, buttonText, callback) {
            buttonText = buttonText || "OK";
            dlg.confirmationDialog(title, message, buttonText, callback);
        }

        /**
         * Shows an error dialog
         * @param {string} title - Error title
         * @param {string} message - Error message
         * @param {Function} callback - Optional callback
         */
        function showError(title, message, callback) {
            dlg.confirmationDialog(title, message, "OK", callback);
        }

        /**
         * Shows a success dialog
         * @param {string} title - Success title
         * @param {string} message - Success message
         * @param {Function} callback - Optional callback
         */
        function showSuccess(title, message, callback) {
            dlg.confirmationDialog(title, message, "OK", callback);
        }

        /**
         * Shows an info dialog
         * @param {string} title - Info title
         * @param {string} message - Info message
         * @param {Function} callback - Optional callback
         */
        function showInfo(title, message, callback) {
            dlg.confirmationDialog(title, message, "OK", callback);
        }
    }
})();
