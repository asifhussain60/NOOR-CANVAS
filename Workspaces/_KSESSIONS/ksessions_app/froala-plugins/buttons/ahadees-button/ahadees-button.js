/**
 * Ahadees Button Module - Main button logic & registration
 * Part of the decomposed Froala Ahadees Plugin
 */
(function() {
    'use strict';

    // Use deferred registration to avoid module not found errors
    function registerAhadeesButton() {
        // Check if Angular app module exists before registering
        try {
            if (typeof angular !== 'undefined' && angular.module) {
                // Try to get the app module - this will throw if it doesn't exist
                angular.module('app');
                console.log('[FROALA-AHADEES-BUTTON] Angular app module found, registering component...');
                
                // Module exists, safe to register
                angular.module("app").factory("froalaAhadeesButton", [
                    "froalaModalService",
                    "froalaDialogService",
                    "froalaBasePlugin",
                    "froalaUtilities",
                    "froalaAhadeesModal",
                    "froalaAhadeesSearch",
                    "froalaAhadeesFormatter",
                    froalaAhadeesButton
                ]);
                
                console.log('[FROALA-AHADEES-BUTTON] Successfully registered with Angular');
                return true;
            } else {
                console.warn('[FROALA-AHADEES-BUTTON] Angular not available, skipping registration');
                return false;
            }
        } catch (e) {
            console.warn('[FROALA-AHADEES-BUTTON] Angular app module not found, skipping registration:', e.message);
            return false;
        }
    }

    // Try immediate registration if deferred system is not available (fallback)
    if (typeof window.registerFroalaPlugin === 'function') {
        window.registerFroalaPlugin(registerAhadeesButton, 'froalaAhadeesButton');
    } else {
        // Fallback to old behavior
        registerAhadeesButton();
    }

    function froalaAhadeesButton(
        modalService,
        dialogService,
        basePlugin,
        utilities,
        ahadeesModal,
        ahadeesSearch,
        ahadeesFormatter
    ) {
        var service = {
            register: register
        };

        return service;

        /**
         * Register the ahadees button with Froala Editor
         */
        function register() {
            console.log('🕌 [AHADEES-BUTTON] Registering ahadees button...');

            // Define the ahadees plugin (using same pattern as other plugins)
            $.FE.PLUGINS.ahadees = function(editor) {
                var insertionMarker = '<!--AHADEES_INSERT_MARKER-->';
                var markerPlaced = false;

                // Set up global delete button click handler using event delegation
                // This ensures delete buttons work for all hadees content, including pre-loaded content
                $(document).off('click.ahadees-delete').on('click.ahadees-delete', '.delete-hadees-btn', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    var ahadeesId = $(this).data('ahadees-id');
                    var ahadeesElement = $('#' + ahadeesId);

                    // Get hadees content for confirmation dialog
                    var hadeesBriefText = 'this hadees';
                    try {
                        var arabicText = ahadeesElement.find('.ks-ahadees-arabic').text();
                        var englishText = ahadeesElement.find('.ks-ahadees-english').text();
                        if (arabicText && arabicText.length > 50) {
                            hadeesBriefText = '"' + arabicText.substring(0, 50) + '..."';
                        } else if (englishText && englishText.length > 50) {
                            hadeesBriefText = '"' + englishText.substring(0, 50) + '..."';
                        } else if (arabicText) {
                            hadeesBriefText = '"' + arabicText + '"';
                        } else if (englishText) {
                            hadeesBriefText = '"' + englishText + '"';
                        }
                    } catch (e) {
                        // Use default text if extraction fails
                        hadeesBriefText = 'this hadees';
                    }

                    // Use bootstrap.ui dialog service like in admin controller
                    try {
                        var ngApp = document.querySelector('[ng-app]') || document.querySelector('[data-ng-app]');
                        if (ngApp) {
                            var injector = angular.element(ngApp).injector();
                            if (injector) {
                                var dlg = injector.get('bootstrap.dialog');
                                if (dlg && dlg.confirmationDialog) {
                                    dlg.confirmationDialog(
                                        "Remove Hadees",
                                        "Are you sure you want to remove " + hadeesBriefText + " from the transcript?",
                                        "Yes, Remove",
                                        "Cancel"
                                    ).then(function (result) {
                                        if (result === "ok") {
                                            // User confirmed deletion
                                            if (ahadeesElement.length > 0) {
                                                ahadeesElement.fadeOut(300, function() {
                                                    $(this).remove();

                                                    // Trigger content change on the Froala editor
                                                    if (editor && editor.events) {
                                                        editor.events.trigger('contentChanged');
                                                    }
                                                });

                                                // Show success message
                                                try {
                                                    var common = injector.get('common');
                                                    if (common && common.showToast) {
                                                        common.showToast('Hadees removed successfully', 'success');
                                                    }
                                                } catch (e) {
                                                    // Silent fail for toast notification
                                                }
                                            } else {
                                                console.error('❌ [AHADEES-PLUGIN] Could not find hadees element to delete');
                                            }
                                        }
                                        // If result !== "ok", user cancelled - no action needed
                                    }).catch(function (error) {
                                        console.log('🔧 [AHADEES-PLUGIN] Dialog cancelled or error:', error);
                                        // User cancelled dialog or error occurred - no action needed
                                    });
                                } else {
                                    // Fallback to simple confirm if bootstrap.dialog not available
                                    console.warn('⚠️ [AHADEES-PLUGIN] bootstrap.dialog service not available, using fallback');
                                    if (confirm('Are you sure you want to remove this hadees?')) {
                                        if (ahadeesElement.length > 0) {
                                            ahadeesElement.fadeOut(300, function() {
                                                $(this).remove();
                                                if (editor && editor.events) {
                                                    editor.events.trigger('contentChanged');
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        // Final fallback to simple confirm if Angular services unavailable
                        console.warn('⚠️ [AHADEES-PLUGIN] Angular services unavailable, using simple confirm');
                        if (confirm('Are you sure you want to remove this hadees?')) {
                            if (ahadeesElement.length > 0) {
                                ahadeesElement.fadeOut(300, function() {
                                    $(this).remove();
                                    if (editor && editor.events) {
                                        editor.events.trigger('contentChanged');
                                    }
                                });
                            }
                        }
                    }
                });

                /**
                 * Show the ahadees popup
                 */
                function showPopup() {
                    // Insert a marker at the current cursor position
                    try {
                        editor.html.insert(insertionMarker);
                        markerPlaced = true;
                    } catch (error) {
                        console.error('❌ [AHADEES-PLUGIN] Failed to insert marker:', error);
                        markerPlaced = false;
                    }

                    // Use the modal service to create the ahadees modal
                    ahadeesModal.createModal(editor, insertionMarker, markerPlaced, function(marker) {
                        markerPlaced = marker;
                    });
                }

                /**
                 * Clean up any orphaned insertion markers
                 */
                function cleanupInsertionMarker() {
                    if (markerPlaced) {
                        try {
                            var currentHtml = editor.html.get();
                            if (currentHtml.indexOf(insertionMarker) !== -1) {
                                var cleanedHtml = currentHtml.replace(insertionMarker, '');
                                editor.html.set(cleanedHtml);
                            }
                            markerPlaced = false;
                        } catch (error) {
                            console.error('❌ [AHADEES-PLUGIN] Error cleaning up marker:', error);
                        }
                    }
                }

                // Return public methods
                return {
                    showPopup: showPopup,
                    cleanupInsertionMarker: cleanupInsertionMarker
                };
            };

            // Define the ahadees button icon
            $.FE.DefineIcon('ahadees', { NAME: 'comments' });

            $.FE.RegisterCommand('ahadees', {
                title: '🕌 Universal Ahadees Search (Alt+A) - Search by narrator, topic, or transliteration (e.g., abd → عبد)',
                focus: false,
                undo: false,
                refreshAfterCallback: false,
                callback: function () {
                    if (this.ahadees && typeof this.ahadees.showPopup === 'function') {
                        this.ahadees.showPopup();
                    } else {
                        console.error('Ahadees showPopup method not available!');
                    }
                },
                plugin: 'ahadees'
            });

            // Use Alt+A for ahadees - A for Ahadees, Alt modifier avoids browser conflicts
            $.FE.RegisterShortcut($.FE.KEYCODE.A, 'ahadees', false, 'A', true, false);

            console.log('✅ [AHADEES-BUTTON] Ahadees button registered successfully');
        }
    }
})();
