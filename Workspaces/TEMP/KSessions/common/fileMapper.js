(function () {
    'use strict';

    angular
        .module('common')
        .factory('fileMapper', fileMapper);

    fileMapper.$inject = ['$injector'];

    function fileMapper($injector) {
        var service = {
            showCurrentFiles: showCurrentFiles,
            getFileMapping: getFileMapping
        };

        return service;

        function showCurrentFiles() {
            try {
                var devLogger = $injector.get('devLogger');
                if (!devLogger || !devLogger.isDev) {
                    console.log('File mapper only works in development mode (port 8080)');
                    return;
                }

                var mapping = devLogger.getRouteMapping();
                
                console.log('%c📁 KSESSIONS FILE MAPPING REFERENCE', 
                    'background: #673AB7; color: white; padding: 8px 15px; border-radius: 5px; font-weight: bold; font-size: 14px;');
                
                console.log('%c🌐 ROUTE TEMPLATES → JAVASCRIPT FILES:', 
                    'background: #2196F3; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;');
                
                Object.keys(mapping.routes).forEach(function(template) {
                    console.log(`  ${template} → ${mapping.routes[template]}`);
                });
                
                console.log('%c🔧 DIRECTIVE TAGS → JAVASCRIPT FILES:', 
                    'background: #FF9800; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;');
                
                Object.keys(mapping.directives).forEach(function(directive) {
                    console.log(`  <${directive}> → ${mapping.directives[directive]}`);
                });
                
                console.log('%c⚙️ CORE SERVICES (Pure JS files):', 
                    'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;');
                
                mapping.services.forEach(function(service) {
                    console.log(`  ${service}`);
                });
                
            } catch (e) {
                console.error('Error accessing devLogger:', e);
            }
        }

        function getFileMapping() {
            try {
                var devLogger = $injector.get('devLogger');
                return devLogger ? devLogger.getRouteMapping() : null;
            } catch (e) {
                return null;
            }
        }
    }

    // Global convenience function for easy access in console
    if (window.location.port == '8080') {
        window.showFiles = function() {
            try {
                var injector = angular.element(document.body).injector();
                var fileMapper = injector.get('fileMapper');
                fileMapper.showCurrentFiles();
            } catch (e) {
                console.error('Could not access file mapper:', e);
            }
        };
        
        console.log('%c💡 TIP: Type showFiles() in console to see all HTML→JS file mappings', 
            'background: #9C27B0; color: white; padding: 4px 8px; border-radius: 3px; font-style: italic;');
    }
})();
