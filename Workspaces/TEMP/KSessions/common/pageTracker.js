(function () {
    'use strict';

    angular
        .module('common')  // Changed from 'app' to 'common'
        .directive('pageTracker', pageTracker);

    pageTracker.$inject = ['$injector', '$timeout', '$location', '$state', '$rootScope'];

    function pageTracker($injector, $timeout, $location, $state, $rootScope) {
        return {
            restrict: 'A',  // Back to 'A' for attribute usage
            link: function(scope, element, attrs) {
                var devLogger = null;

                // Safe injection for development logger
                try {
                    devLogger = $injector.get('devLogger');
                } catch (e) {
                    // devLogger not available, continue without logging
                    return;
                }

                if (!devLogger || !devLogger.isDev) return;

                // Listen for state changes to capture route information
                var unsubscribe = $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState) {
                    $timeout(function() {
                        var routeInfo = getRouteInfo(toState);
                        var directives = findDirectivesInPage();
                        var jsFiles = devLogger.getJavaScriptFiles(routeInfo.templateUrl, directives);
                        
                        devLogger.logPageVisit(routeInfo.pageName, directives);
                        logJavaScriptFiles(routeInfo, jsFiles, directives);
                    }, 300);
                });

                // Initial page load
                $timeout(function() {
                    var routeInfo = getCurrentRouteInfo();
                    var directives = findDirectivesInPage();
                    var jsFiles = devLogger.getJavaScriptFiles(routeInfo.templateUrl, directives);
                    
                    devLogger.logPageVisit(routeInfo.pageName, directives);
                    logJavaScriptFiles(routeInfo, jsFiles, directives);
                }, 200);

                // GLOBAL EXPOSURE: Expose getCurrentRouteInfo to window for _Layout.cshtml access
                if (!window.pageTracker) {
                    window.pageTracker = {};
                }
                window.pageTracker.getCurrentRouteInfo = getCurrentRouteInfo;

                // Only log debug info if explicitly enabled
                if (window.enablePageTrackerDebug) {
                    console.log('DEBUG: pageTracker directive exposing getCurrentRouteInfo to window.pageTracker');
                }

                // Clean up listener when scope is destroyed
                scope.$on('$destroy', function() {
                    if (unsubscribe) unsubscribe();
                    // Clean up global reference when directive is destroyed
                    if (window.pageTracker && window.pageTracker.getCurrentRouteInfo === getCurrentRouteInfo) {
                        delete window.pageTracker.getCurrentRouteInfo;
                    }
                });

                function getCurrentRouteInfo() {
                    var currentState = $state.current;
                    if (currentState && currentState.templateUrl) {
                        return {
                            pageName: getPageNameFromTemplateUrl(currentState.templateUrl),
                            templateUrl: currentState.templateUrl,
                            stateName: currentState.name
                        };
                    }
                    
                    return {
                        pageName: getPageNameFromUrl(),
                        templateUrl: null,
                        stateName: 'unknown'
                    };
                }

                function getRouteInfo(state) {
                    if (state && state.templateUrl) {
                        return {
                            pageName: getPageNameFromTemplateUrl(state.templateUrl),
                            templateUrl: state.templateUrl,
                            stateName: state.name
                        };
                    }
                    
                    return {
                        pageName: getPageNameFromUrl(),
                        templateUrl: null,
                        stateName: state ? state.name : 'unknown'
                    };
                }

                function getPageNameFromTemplateUrl(templateUrl) {
                    if (!templateUrl) return 'unknown';
                    
                    var parts = templateUrl.split('/');
                    var fileName = parts[parts.length - 1];
                    return fileName ? fileName.replace('.html', '') : 'unknown';
                }

                function logJavaScriptFiles(routeInfo, jsFiles, directives) {
                    if (!devLogger.isDev) return;

                    var featureFiles = ['shell.js']; // Always include shell.js
                    if (jsFiles && jsFiles.length > 0) {
                        featureFiles = featureFiles.concat(jsFiles);
                    }
                    
                    // ENHANCED: Add controller-based file detection for missing mappings
                    var activeControllers = getActiveControllers();
                    var controllerFiles = mapControllersToFiles(activeControllers);
                    
                    // Add controller files that aren't already in featureFiles
                    controllerFiles.forEach(function(file) {
                        if (featureFiles.indexOf(file) === -1) {
                            featureFiles.push(file);
                        }
                    });

                    // DEBUG: Log what we're getting vs what we're mapping (only if debug enabled)
                    if (window.enablePageTrackerDebug) {
                        console.log('%c🔍 DEBUG - Route Detection:', 
                            'background: #E91E63; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;');
                        console.log('  Current State:', $state.current);
                        console.log('  Route Info Object:', routeInfo);
                        console.log('  Template URL from State:', $state.current.templateUrl);
                        console.log('  Detected JS Files from Template:', jsFiles);
                        console.log('  Active Controllers:', activeControllers);
                        console.log('  Controller-mapped Files:', controllerFiles);
                        console.log('  Final Feature Files:', featureFiles);

                        console.log('%c🚀 BEAUTIFUL ISLAM DEBUG - ' + new Date().toLocaleTimeString(), 
                            'background: #2196F3; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 12px;');
                        
                        console.log('%c  Feature Files: ' + featureFiles.join(', '), 
                            'color: #1976D2; font-weight: bold; font-size: 11px;');
                        
                        if (routeInfo.templateUrl) {
                            console.log('%c  Template: ' + routeInfo.templateUrl, 
                                'color: #388E3C; font-weight: normal; font-size: 11px;');
                        }
                        
                        if (routeInfo.stateName && routeInfo.stateName !== 'unknown') {
                            console.log('%c  State: ' + routeInfo.stateName, 
                                'color: #7B1FA2; font-weight: normal; font-size: 11px;');
                        }
                        
                        var activeControllers = getActiveControllers();
                        if (activeControllers.length > 0) {
                            console.log('%c  Controllers: ' + activeControllers.join(', '), 
                                'color: #F57C00; font-weight: normal; font-size: 11px;');
                        }
                        
                        if (directives && directives.length > 0) {
                            var directiveJsFiles = directives.map(function(dir) {
                                var cleanDirective = dir.replace(/\s*\(\d+\)$/, '').trim();
                                var mapping = devLogger.getRouteMapping();
                                return mapping.directives[cleanDirective] || (cleanDirective + '.js');
                            });
                            
                            console.log('%c  Directive Files: ' + directiveJsFiles.join(', '), 
                                'color: #00796B; font-weight: normal; font-size: 11px;');
                        }

                        // DEBUG: Compare with route mapping
                        var mapping = devLogger.getRouteMapping();
                        console.log('%c🔧 MAPPING DEBUG:', 
                            'background: #9C27B0; color: white; padding: 3px 8px; border-radius: 3px;');
                        console.log('  Available Route Mappings:', Object.keys(mapping.routes));
                        console.log('  Looking for template:', routeInfo.templateUrl);
                        console.log('  Found mapping:', mapping.routes[routeInfo.templateUrl]);

                        // COMPARISON: Check what the _Layout.cshtml system might show
                        console.log('%c📊 SYSTEM COMPARISON:', 
                            'background: #795548; color: white; padding: 3px 8px; border-radius: 3px;');
                        console.log('  Enhanced Logger says JS files:', featureFiles);
                        console.log('  Template-based detection:', routeInfo.templateUrl, '→', mapping.routes[routeInfo.templateUrl]);
                        console.log('  State-based detection: State "' + routeInfo.stateName + '" detected');
                        
                        // Try to predict what the _Layout.cshtml would show
                        var layoutPrediction = predictLayoutMapping(activeControllers);
                        if (layoutPrediction.length > 0) {
                            console.log('  Layout.cshtml would show:', layoutPrediction.join(', '));
                            
                            var matches = featureFiles.filter(function(file) {
                                return layoutPrediction.some(function(pred) {
                                    return file.includes(pred.replace('.js', ''));
                                });
                            });
                            
                            if (matches.length === featureFiles.length - 1) { // -1 for shell.js
                                console.log('  ✅ Systems AGREE on file mappings');
                            } else {
                                console.log('  ⚠️ Systems DISAGREE - Enhanced logger is more accurate');
                            }
                        }
                    }
                }

                function predictLayoutMapping(controllers) {
                    var predicted = [];
                    
                    controllers.forEach(function(controller) {
                        if (controller.includes('albumList')) {
                            predicted.push('albumList.js');
                        } else if (controller.includes('album')) {
                            predicted.push('album.js');
                        } else if (controller.includes('sessionReaderCtrl')) {
                            predicted.push('sessionReader.js');
                        } else if (controller.includes('sessionCtl') || controller.includes('sessionController')) {
                            predicted.push('session.js');  // Fixed mapping
                        } else if (controller.includes('groupCtlr') || controller.includes('group')) {
                            predicted.push('album.js');  // Group controller uses album view
                        } else if (controller.includes('admin')) {
                            predicted.push('admin.js');
                        } else if (controller.includes('shell')) {
                            predicted.push('shell.js');
                        }
                    });
                    
                    return predicted;
                }

                function getActiveControllers() {
                    var controllers = [];
                    var elements = document.querySelectorAll('[ng-controller]');
                    
                    for (var i = 0; i < elements.length; i++) {
                        var ctrlName = elements[i].getAttribute('ng-controller');
                        if (ctrlName && controllers.indexOf(ctrlName) === -1) {
                            controllers.push(ctrlName);
                        }
                    }
                    
                    return controllers;
                }

                function getPageNameFromUrl() {
                    var path = $location.path();
                    if (path && path !== '/') {
                        // Extract page name from Angular route
                        var segments = path.split('/');
                        return segments[segments.length - 1] || segments[segments.length - 2] || 'unknown';
                    }
                    
                    // Fallback to URL pathname
                    var urlPath = window.location.pathname;
                    var segments = urlPath.split('/');
                    var fileName = segments[segments.length - 1];
                    
                    if (fileName && fileName.includes('.')) {
                        return fileName.replace(/\.[^/.]+$/, ""); // Remove extension
                    }
                    
                    return fileName || 'index';
                }

                function findDirectivesInPage() {
                    var directives = [];
                    var customDirectives = [
                        'zu-session-selection', 
                        'summary-accordion', 
                        'ang-accordion',
                        'collapsible-item',
                        'session-player',
                        'admin-controls',
                        'froala-editor',
                        'audio-player',
                        'session-navigation',
                        'member-list',
                        'feedback-form',
                        'zu-session-content',
                        'zu-member-form',
                        'jplayer-control',
                        'zu-checklist-group',
                        'zu-members',
                        'zu-feedback',
                        'zu-feedback-rating',
                        'zu-hub-album-session-select',
                        'zu-registered-users',
                        'zu-hub-images',
                        'zu-hub-quran',
                        'zu-hub-html',
                        'zu-hub-session-info',
                        'zu-hub-root-manager',
                        'zu-hub-compare',
                        'zu-hub-narration',
                        'zu-hub-questions',
                        'zu-hub-lists',
                        'zu-hub-vote'
                    ];

                    customDirectives.forEach(function(directive) {
                        var elements = document.querySelectorAll(directive + ', [' + directive + ']');
                        if (elements.length > 0) {
                            directives.push(directive + (elements.length > 1 ? ` (${elements.length})` : ''));
                        }
                    });

                    return directives;
                }
                
                function mapControllersToFiles(controllers) {
                    var controllerToFileMapping = {
                        // Admin Controllers
                        'adminSessionTranscriptCtl': 'adminSessionTranscript.js',
                        'adminSessionSummaryCtl': 'adminSessionSummary.js',
                        'adminSessionCtl': 'adminSession.js',
                        'adminAlbumCtl': 'adminAlbum.js',
                        'adminQuranCtl': 'adminQuran.js',
                        'adminDashCtl': 'adminDash.js',
                        'adminFamilyCtl': 'adminFamily.js',
                        'adminMemberAccessCtl': 'adminMemberAccess.js',
                        'adminLoginCtl': 'adminLogin.js',
                        'adminUtilityBoardCtl': 'adminUtilityBoard.js',
                        'adminSystemUtilitiesCtl': 'adminSystemUtilities.js',
                        'adminGitCommitsCtl': 'adminGitCommits.js',
                        'adminSqlBackupsCtl': 'adminSqlBackups.js',
                        'adminEtymologyCtl': 'adminEtymology.js',
                        'adminNarrationCtl': 'adminNarration.js',
                        'adminAhadeesCtl': 'adminAhadees.js',
                        'adminHubPreloaderCtl': 'adminHubPreloader.js',
                        'adminSearchCtl': 'adminSearch.js',
                        'adminFamilyMemberFormCtl': 'adminFamilyMemberForm.js',
                        'adminCtl': 'admin.js',
                        
                        // User Controllers
                        'albumListCtl': 'albumList.js',
                        'albumCtl': 'album.js',
                        'sessionCtl': 'session.js',
                        'sessionReaderCtrl': 'sessionReader.js',
                        'feedbackCtl': 'feedback.js',
                        'loginCtl': 'login.js',
                        'registrationCtl': 'registration.js',
                        'hubCtl': 'hub.js',
                        'manageCtl': 'manage.js',
                        'manageDashboardCtl': 'manageDashboard.js',
                        'sandboxCtl': 'sandbox.js',
                        
                        // Shell Controllers
                        'shell': 'shell.js',
                        'topNavCtl': 'topNav.js'
                    };
                    
                    var files = [];
                    controllers.forEach(function(controller) {
                        if (controllerToFileMapping[controller]) {
                            files.push(controllerToFileMapping[controller]);
                        } else {
                            // Fallback: try to derive filename from controller name
                            var fileName = controller.replace('Ctl', '').replace('Controller', '').replace('Ctrl', '') + '.js';
                            files.push(fileName);
                        }
                    });
                    
                    return files;
                }
            }
        };
    }
})();
