/**
 * Froala Plugin Deferred Registration System
 * 
 * This script sets up a queue for Froala plugins to register themselves
 * after the Angular app module is ready, preventing the $injector:nomod errors.
 * 
 * Usage: Plugins should call window.deferFroalaPlugin(initializerFunction)
 * instead of trying to register immediately.
 */

(function() {
    'use strict';
    
    // Initialize the deferred plugins queue if it doesn't exist
    if (!window.deferredFroalaPlugins) {
        window.deferredFroalaPlugins = [];
    }
    
    /**
     * Add a plugin initializer to the deferred queue
     * @param {function} initializer - Function that will register the plugin with Angular
     */
    window.deferFroalaPlugin = function(initializer) {
        if (typeof initializer === 'function') {
            window.deferredFroalaPlugins.push(initializer);
            console.log('📋 [DEFERRED-PLUGINS] Added plugin to deferred queue. Total queued:', window.deferredFroalaPlugins.length);
        } else {
            console.error('❌ [DEFERRED-PLUGINS] Plugin initializer must be a function');
        }
    };
    
    /**
     * Check if Angular app module is available
     * @returns {boolean} True if the app module exists
     */
    window.isAngularAppReady = function() {
        try {
            if (typeof angular !== 'undefined' && angular.module) {
                angular.module('app');
                return true;
            }
        } catch (e) {
            // Module doesn't exist yet
        }
        return false;
    };
    
    /**
     * Try to register a plugin immediately if Angular is ready, otherwise defer it
     * @param {function} initializer - Function that will register the plugin with Angular
     * @param {string} pluginName - Name of the plugin for logging
     */
    window.registerFroalaPlugin = function(initializer, pluginName) {
        if (window.isAngularAppReady()) {
            console.log('✅ [PLUGIN-REGISTRATION] Angular app ready, registering plugin immediately:', pluginName);
            try {
                initializer();
            } catch (error) {
                console.error('❌ [PLUGIN-REGISTRATION] Error registering plugin', pluginName + ':', error);
            }
        } else {
            console.log('⏳ [PLUGIN-REGISTRATION] Angular app not ready, deferring plugin:', pluginName);
            window.deferFroalaPlugin(initializer);
        }
    };
    
    console.log('🚀 [DEFERRED-PLUGINS] Froala plugin deferred registration system initialized');
})();
