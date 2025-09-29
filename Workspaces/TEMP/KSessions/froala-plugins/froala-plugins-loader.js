/**
 * Froala Plugins Loader - Main entry point for modular Froala plugins
 * Loads and initializes all decomposed plugin modules
 */
(function() {
    'use strict';

    // Use deferred registration to avoid module not found errors
    function registerPluginsLoader() {
        // Check if Angular app module exists before registering
        try {
            if (typeof angular !== 'undefined' && angular.module) {
                // Try to get the app module - this will throw if it doesn't exist
                angular.module('app');
                
                // Module exists, safe to register
                angular.module("app").factory("froalaPluginsLoader", [
                    "froalaModalService",
                    "froalaDialogService",
                    "froalaBasePlugin",
                    "froalaUtilities",
                    "froalaPoetryButton",
                    "froalaPoetryModal",
                    "froalaPoetryFormatter",
                    "froalaAhadeesButton",
                    "froalaAhadeesModal",
                    "froalaAhadeesSearch",
                    "froalaAhadeesFormatter",
                    froalaPluginsLoader
                ]);
                
                console.log('✅ [FROALA-PLUGINS-LOADER] Successfully registered with Angular app module');
                return true;
            } else {
                console.warn('[FROALA-PLUGINS-LOADER] Angular not available, skipping registration');
                return false;
            }
        } catch (e) {
            console.warn('[FROALA-PLUGINS-LOADER] Angular app module not found, skipping registration:', e.message);
            return false;
        }
    }

    // Try immediate registration if deferred system is not available (fallback)  
    if (typeof window.registerFroalaPlugin === 'function') {
        window.registerFroalaPlugin(registerPluginsLoader, 'froalaPluginsLoader');
    } else {
        // Fallback to old behavior
        registerPluginsLoader();
    }

    function froalaPluginsLoader(
        modalService, 
        dialogService, 
        basePlugin, 
        utilities,
        poetryButton, 
        poetryModal, 
        poetryFormatter,
        ahadeesButton,
        ahadeesModal,
        ahadeesSearch,
        ahadeesFormatter
    ) {
        var service = {
            initializePlugins: initializePlugins,
            registerPoetryButton: registerPoetryButton,
            registerAhadeesButton: registerAhadeesButton
        };

        // Make service available globally for fallback scenarios
        window.froalaPluginsLoader = service;

        return service;

        /**
         * Initialize all Froala plugins
         */
        function initializePlugins() {
            console.log('🚀 [PLUGINS-LOADER] Initializing Froala plugins...');
            
            try {
                // Initialize poetry button
                registerPoetryButton();
                
                // Initialize ahadees button
                registerAhadeesButton();
                
                console.log('✅ [PLUGINS-LOADER] All plugins initialized successfully');
                
            } catch (error) {
                console.error('❌ [PLUGINS-LOADER] Error initializing plugins:', error);
            }
        }

        /**
         * Register the ahadees button
         */
        function registerAhadeesButton() {
            console.log('🕌 [PLUGINS-LOADER] Registering ahadees button...');
            ahadeesButton.register();
            console.log('✅ [PLUGINS-LOADER] Ahadees button registered');
        }
    }
})();
