/**
 * Modal Service - Reusable modal utilities for Froala plugins
 * Provides standardized modal creation and lifecycle management
 * 
 * @author KSESSIONS Development Team
 * @date September 2, 2025
 */

(function() {
    'use strict';

    // Use deferred registration to avoid module not found errors
    function registerModalService() {
        // Check if Angular app module exists before registering
        try {
            if (typeof angular !== 'undefined' && angular.module) {
                // Try to get the app module - this will throw if it doesn't exist
                angular.module('app');
                
                // Module exists, safe to register
                angular.module('app').factory('froalaModalService', [
                    '$q',
                    froalaModalService
                ]);
                
                console.log('✅ [FROALA-MODAL-SERVICE] Successfully registered with Angular app module');
                return true;
            } else {
                console.warn('[FROALA-MODAL-SERVICE] Angular not available, skipping registration');
                return false;
            }
        } catch (e) {
            console.warn('[FROALA-MODAL-SERVICE] Angular app module not found, skipping registration:', e.message);
            return false;
        }
    }

    // Try immediate registration if deferred system is not available (fallback)
    if (typeof window.registerFroalaPlugin === 'function') {
        window.registerFroalaPlugin(registerModalService, 'froalaModalService');
    } else {
        // Fallback to old behavior
        registerModalService();
    }

    function froalaModalService($q) {
        var service = {
            createBootstrapModal: createBootstrapModal,
            showConfirmationDialog: showConfirmationDialog,
            removeModal: removeModal,
            generateUniqueId: generateUniqueId
        };

        return service;

        /**
         * Creates a Bootstrap modal with standardized structure
         * @param {Object} options - Modal configuration
         * @param {string} options.id - Unique modal ID
         * @param {string} options.title - Modal title
         * @param {string} options.titleIcon - Font Awesome icon class
         * @param {string} options.bodyHtml - Modal body HTML content
         * @param {Array} options.buttons - Array of button configurations
         * @param {Object} options.modalOptions - Bootstrap modal options
         * @returns {jQuery} Modal jQuery object
         */
        function createBootstrapModal(options) {
            var defaults = {
                id: generateUniqueId('modal'),
                title: 'Modal',
                titleIcon: 'fa-info-circle',
                bodyHtml: '',
                buttons: [
                    { text: 'Cancel', class: 'btn-default', dismiss: true },
                    { text: 'OK', class: 'btn-primary', id: 'modal-ok-btn' }
                ],
                modalOptions: {
                    backdrop: 'static',
                    keyboard: true
                }
            };

            var config = angular.extend({}, defaults, options);
            
            // Generate buttons HTML
            var buttonsHtml = config.buttons.map(function(btn) {
                var dismissAttr = btn.dismiss ? 'data-dismiss="modal"' : '';
                var idAttr = btn.id ? 'id="' + btn.id + '"' : '';
                var iconHtml = btn.icon ? '<i class="fa ' + btn.icon + '"></i> ' : '';
                
                return '<button type="button" class="btn ' + btn.class + '" ' + 
                       dismissAttr + ' ' + idAttr + '>' + iconHtml + btn.text + '</button>';
            }).join('\n                    ');

            var modalHtml = `
                <div class="modal fade" id="${config.id}" tabindex="-1" role="dialog" aria-labelledby="${config.id}-title">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                <h4 class="modal-title" id="${config.id}-title">
                                    <i class="fa ${config.titleIcon}"></i> ${config.title}
                                </h4>
                            </div>
                            <div class="modal-body">
                                ${config.bodyHtml}
                            </div>
                            <div class="modal-footer">
                                ${buttonsHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove any existing modal with same ID
            $('#' + config.id).remove();
            
            // Add modal to body
            $('body').append(modalHtml);
            
            var $modal = $('#' + config.id);
            
            // Apply modal options and show
            $modal.modal(config.modalOptions);
            
            return $modal;
        }

        /**
         * Shows a simple confirmation dialog using bootstrap.dialog service
         * @param {string} title - Dialog title
         * @param {string} message - Dialog message
         * @param {string} buttonText - OK button text
         * @param {Function} callback - Callback function
         */
        function showConfirmationDialog(title, message, buttonText, callback) {
            // This will be injected from the parent service that has access to bootstrap.dialog
            if (window.froalaDialogService && window.froalaDialogService.confirmationDialog) {
                window.froalaDialogService.confirmationDialog(title, message, buttonText, callback);
            } else {
                console.warn('Dialog service not available, falling back to alert');
                alert(message);
                if (callback) callback();
            }
        }

        /**
         * Removes a modal from the DOM
         * @param {string} modalId - Modal ID to remove
         */
        function removeModal(modalId) {
            $('#' + modalId).remove();
        }

        /**
         * Generates a unique ID for modal elements
         * @param {string} prefix - ID prefix
         * @returns {string} Unique ID
         */
        function generateUniqueId(prefix) {
            prefix = prefix || 'element';
            var timestamp = new Date().getTime();
            var random = Math.floor(Math.random() * 1000);
            return prefix + '-' + timestamp + '-' + random;
        }
    }
})();
