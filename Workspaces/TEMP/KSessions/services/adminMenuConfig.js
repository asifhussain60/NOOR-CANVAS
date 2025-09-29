(function () {
    'use strict';
    angular.module('app').factory('adminMenuConfig', adminMenuConfigService);

    function adminMenuConfigService() {
        // Production-configurable admin menu visibility settings
        // Set to false to hide menu items in production
        var menuConfig = {
            // Main navigation sections
            userAccess: {
                groups: true,           // Admin Group Management
                members: true,          // Admin Member Management
                editAccess: true,       // Edit Access Management
                memberAccess: true      // Member Access Management
            },
            
            sessions: {
                sessions: true,         // Admin Session Management
                sessionAccess: true,    // Session Access Management
                categories: true,       // Category Management
                etymology: true,        // Etymology Management (was roots)
                narrations: true,      // Narration Management
                ahadees: true          // Ahadees Management
            },
            
            tools: {
                utilityBoard: true,     // Main Admin Utility Board
                systemUtilities: true, // System Utilities (dev-only by default)
                gitCommits: true,      // Git Commit Management (dev-only by default)
                sqlBackups: true       // SQL Backup Management (dev-only by default)
            },
            
            reports: {
                enabled: true,          // Reports section (currently placeholder)
                tables: true,          // Tables reports
                dynamicTables: true    // Dynamic tables reports
            }
        };

        // Production overrides - items to hide in production for security/stability
        var productionOverrides = {
            tools: {
                systemUtilities: true,  // ✅ UNHIDDEN: Allow system utilities in production
                gitCommits: false,      // Keep git operations hidden in production  
                sqlBackups: true        // ✅ UNHIDDEN: Allow SQL backups in production
            },
            reports: {
                enabled: false          // Keep reports section hidden in production (placeholder anyway)
            }
        };

        var service = {
            getMenuConfig: getMenuConfig,
            isMenuItemVisible: isMenuItemVisible,
            applyProductionOverrides: applyProductionOverrides
        };

        return service;

        function getMenuConfig() {
            return angular.copy(menuConfig);
        }

        function isMenuItemVisible(section, item) {
            if (!menuConfig[section]) {
                return true; // Default to visible if section not configured
            }
            
            if (typeof menuConfig[section][item] === 'undefined') {
                return true; // Default to visible if item not configured
            }
            
            return menuConfig[section][item];
        }

        function applyProductionOverrides() {
            // Apply production-specific overrides to hide sensitive items
            angular.extend(menuConfig.tools, productionOverrides.tools);
            angular.extend(menuConfig.reports, productionOverrides.reports);
        }
    }
})();
