(function () {
    'use strict';

    angular
        .module('common')  // Changed from 'app' to 'common'
        .factory('devLogger', devLogger);

    devLogger.$inject = ['$location', '$window'];

    function devLogger($location, $window) {
        var isDevelopment = checkDevelopmentMode();
        var pageVisits = [];
        var currentPage = null;
        var pageStartTime = null;
        
        // Route-to-JavaScript file mapping based on templateUrl patterns
        var routeToJsMapping = {
            // Main app routes
            'app/login/login.html': 'login.js',
            'app/features/registration/registration.html': 'registration.js',
            'app/features/album/albumList.html': 'albumList.js',
            'app/features/album/album.html': 'album.js',
            'app/features/session/session.html': 'session.js',
            'app/features/album/sessionReader.html': 'sessionReader.js',
            'app/features/session/feedback.html': 'feedback.js',
            'app/sandbox/sandbox.html': 'sandbox.js',
            'app/features/hub/hub.html': 'hub.js',
            'app/features/manage/manage.html': 'manage.js',
            'app/features/manage/manageDashboard.html': 'manageDashboard.js',
            
            // Admin routes
            'app/features/admin/admin.html': 'admin.js',
            'app/features/admin/adminDash.html': 'adminDash.js',
            'app/features/admin/adminFamily.html': 'adminFamily.js',
            'app/features/admin/adminSearch.html': 'adminSearch.js',
            'app/features/admin/adminFamilyMemberForm.html': 'adminFamilyMemberForm.js',
            'app/features/admin/adminSession.html': 'adminSession.js',
            'app/features/admin/adminSessionTranscript.html': 'adminSessionTranscript.js',
            'app/features/admin/adminSessionSummary.html': 'adminSessionSummary.js',
            'app/features/admin/adminAlbum.html': 'adminAlbum.js',
            'app/features/admin/adminMemberAccess.html': 'adminMemberAccess.js',
            'app/features/admin/adminLogin.html': 'adminLogin.js',
            'app/features/admin/adminUtilityBoard.html': 'adminUtilityBoard.js',
            'app/features/admin/adminTestSuite.html': 'adminTestSuite.js',
            'app/features/admin/adminTestConfig.html': 'adminTestConfig.js',
            'app/features/admin/utilities/adminSystemUtilities.html': 'adminSystemUtilities.js',
            'app/features/admin/utilities/adminGitCommits.html': 'adminGitCommits.js',
            'app/features/admin/utilities/adminSqlBackups.html': 'adminSqlBackups.js',
            'app/features/admin/adminEtymology.html': 'adminEtymology.js',
            'app/features/admin/adminQuran.html': 'adminQuran.js',
            'app/features/admin/adminNarration.html': 'adminNarration.js',
            'app/features/admin/adminAhadees.html': 'adminAhadees.js',
            'app/features/admin/adminHubPreloader.html': 'adminHubPreloader.js'
        };

        // Directive-to-JavaScript file mapping
        var directiveToJsMapping = {
            'zu-session-selection': 'zuSessionSelection.js',
            'summary-accordion': 'summaryAccordion.js',
            'zu-session-content': 'zuSessionContent.js',
            'zu-member-form': 'zuMemberForm.js',
            'jplayer-control': 'jplayerControl.js',
            'zu-checklist-group': 'zuChecklistGroup.js',
            'zu-members': 'zuMembers.js',
            'zu-feedback': 'zuFeedback.js',
            'zu-feedback-rating': 'zuFeedbackRating.js',
            'zu-hub-album-session-select': 'zuHubAlbumSessionSelect.js',
            'zu-registered-users': 'zuRegisteredUsers.js',
            'zu-hub-images': 'zuHubImages.js',
            'zu-hub-quran': 'zuHubQuran.js',
            'zu-hub-html': 'zuHubHtml.js',
            'zu-hub-session-info': 'zuHubSessionInfo.js',
            'zu-hub-root-manager': 'zuHubRootManager.js',
            'zu-hub-compare': 'zuHubCompare.js',
            'zu-hub-narration': 'zuHubNarration.js',
            'zu-hub-questions': 'zuHubQuestions.js',
            'zu-hub-lists': 'zuHubLists.js',
            'zu-hub-vote': 'zuHubVote.js'
        };

        // Services mapping (these are pure .js files in bundles)
        var servicesMapping = [
            'authService.js', 'datacontext.js', 'directives.js', 'filters.js',
            'contentManager.js', 'accordionService.js', 'froalaConfig.js',
            'auditService.js', 'quranService.js', 'hubService.js',
            'fileUpload.js', 'mediaportService.js'
        ];
        
        // Immediate console log to verify service loading
        if (isDevelopment) {
            console.log('%c[DEV-LOGGER] 🚀 Development logging framework initializing...', 'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
        }
        
        var service = {
            log: log,
            logError: logError,
            logWarning: logWarning,
            logInfo: logInfo,
            logPageVisit: logPageVisit,
            logDirectiveUsage: logDirectiveUsage,
            createDebugBar: createDebugBar,
            isDev: isDevelopment,
            getJavaScriptFiles: getJavaScriptFiles,
            getRouteMapping: getRouteMapping
        };

        // Initialize development mode if active
        if (isDevelopment) {
            initializeDevelopmentMode();
        }

        return service;

        function checkDevelopmentMode() {
            // Disable development logging in production mode
            return false;
            
            /*
            var port = $location.port();
            var host = $location.host();
            
            // Debug logging to see what we're getting
            console.log('[DEV-LOGGER] Port detection debug:', {
                port: port,
                portType: typeof port,
                host: host,
                comparison: port === 8080,
                stringComparison: port == 8080
            });
            
            var isDev = (port == 8080 && (host === 'localhost' || host === '127.0.0.1'));
            
            console.log('[DEV-LOGGER] Development mode result:', isDev);
            */
            
            return isDev;
        }

        function initializeDevelopmentMode() {
            console.log('%c🔧 KSESSIONS DEVELOPMENT MODE ACTIVE', 
                'background: #2196F3; color: white; padding: 8px 15px; border-radius: 5px; font-weight: bold; font-size: 13px;');
            console.log('%c📍 Debug Logging Framework Loaded', 
                'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;');
            console.log('%c⚡ Visual Debug Bar Active', 
                'background: #FF9800; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;');
            console.log('%c🚀 Page Navigation Tracking Enabled', 
                'background: #9C27B0; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;');
        }

        function log(message, module, data) {
            if (!isDevelopment) return;
            
            var modulePrefix = module ? `[${module}]` : '[APP]';
            if (data) {
                console.log(`%c${modulePrefix}%c ${message}`, 
                    'background: #4CAF50; color: white; padding: 2px 6px; border-radius: 2px; font-weight: bold;',
                    'color: #333;', data);
            } else {
                console.log(`%c${modulePrefix}%c ${message}`, 
                    'background: #4CAF50; color: white; padding: 2px 6px; border-radius: 2px; font-weight: bold;',
                    'color: #333;');
            }
        }

        function logError(message, module, data) {
            if (!isDevelopment) return;
            
            var modulePrefix = module ? `[${module}]` : '[ERROR]';
            if (data) {
                console.error(`%c${modulePrefix}%c ${message}`, 
                    'background: #f44336; color: white; padding: 2px 6px; border-radius: 2px; font-weight: bold;',
                    'color: #333;', data);
            } else {
                console.error(`%c${modulePrefix}%c ${message}`, 
                    'background: #f44336; color: white; padding: 2px 6px; border-radius: 2px; font-weight: bold;',
                    'color: #333;');
            }
        }

        function logWarning(message, module, data) {
            if (!isDevelopment) return;
            
            var modulePrefix = module ? `[${module}]` : '[WARN]';
            if (data) {
                console.warn(`%c${modulePrefix}%c ${message}`, 
                    'background: #FF9800; color: white; padding: 2px 6px; border-radius: 2px; font-weight: bold;',
                    'color: #333;', data);
            } else {
                console.warn(`%c${modulePrefix}%c ${message}`, 
                    'background: #FF9800; color: white; padding: 2px 6px; border-radius: 2px; font-weight: bold;',
                    'color: #333;');
            }
        }

        function logInfo(message, module, data) {
            if (!isDevelopment) return;
            
            var modulePrefix = module ? `[${module}]` : '[INFO]';
            if (data) {
                console.info(`%c${modulePrefix}%c ${message}`, 
                    'background: #2196F3; color: white; padding: 2px 6px; border-radius: 2px; font-weight: bold;',
                    'color: #333;', data);
            } else {
                console.info(`%c${modulePrefix}%c ${message}`, 
                    'background: #2196F3; color: white; padding: 2px 6px; border-radius: 2px; font-weight: bold;',
                    'color: #333;');
            }
        }

        function logPageVisit(pageName, directives) {
            if (!isDevelopment) return;

            // End previous page timing
            if (currentPage && pageStartTime) {
                var timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
                console.log(`%c📄 PAGE EXIT: ${currentPage} (${timeSpent}s)`, 
                    'background: #9E9E9E; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;');
            }

            // Start new page
            currentPage = pageName;
            pageStartTime = Date.now();
            pageVisits.push({
                page: pageName,
                directives: directives || [],
                timestamp: new Date(),
                sequence: pageVisits.length + 1,
                timeEntered: pageStartTime
            });

            // Log page entry with sequence
            var sequenceInfo = `#${pageVisits.length}`;
            var directiveList = directives && directives.length > 0 ? `[${directives.join(', ')}]` : '[no custom directives]';
            
            console.log(`%c🚀 PAGE VISIT ${sequenceInfo}: ${pageName} ${directiveList}`, 
                'background: #673AB7; color: white; padding: 5px 12px; border-radius: 4px; font-weight: bold; font-size: 12px;');
            
            // Show navigation sequence
            logNavigationSequence();
        }

        function logNavigationSequence() {
            if (!isDevelopment || pageVisits.length < 2) return;

            var sequence = pageVisits.slice(-4).map(function(visit, index) {
                return `${visit.sequence}.${visit.page}`;
            }).join(' → ');

            console.log(`%c📍 Navigation Sequence: ${sequence}`, 
                'background: #795548; color: white; padding: 3px 8px; border-radius: 3px; font-style: italic; font-size: 11px;');
        }

        function logDirectiveUsage(directiveName, action, data) {
            if (!isDevelopment) return;
            
            if (data) {
                console.log(`%c🔧 ${directiveName}%c ${action}`, 
                    'background: #00BCD4; color: white; padding: 1px 5px; border-radius: 2px; font-size: 11px;',
                    'color: #666; font-size: 11px;', data);
            } else {
                console.log(`%c🔧 ${directiveName}%c ${action}`, 
                    'background: #00BCD4; color: white; padding: 1px 5px; border-radius: 2px; font-size: 11px;',
                    'color: #666; font-size: 11px;');
            }
        }

        function createDebugBar(pageName, directives) {
            if (!isDevelopment) return;
            
            // DISABLED: Blue debug bar removed in favor of green debug mode button
            // The enhanced inline debug framework in _Layout.cshtml now handles all debug functionality
            return;

            // Remove existing debug bar
            var existingBar = document.getElementById('ksessions-debug-bar');
            if (existingBar) {
                existingBar.remove();
            }

            // Create floating debug bar
            var debugBar = document.createElement('div');
            debugBar.id = 'ksessions-debug-bar';
            debugBar.innerHTML = `
                <div style="
                    position: fixed; 
                    bottom: 15px; 
                    right: 15px; 
                    background: linear-gradient(135deg, rgba(33, 150, 243, 0.95) 0%, rgba(21, 101, 192, 0.95) 100%); 
                    color: white; 
                    padding: 10px 14px; 
                    border-radius: 8px; 
                    font-family: 'Segoe UI', 'Roboto', sans-serif; 
                    font-size: 11px; 
                    z-index: 10000; 
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
                    max-width: 380px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255,255,255,0.2);
                " 
                onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 6px 25px rgba(0,0,0,0.4)'" 
                onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 20px rgba(0,0,0,0.3)'">
                    <div style="font-weight: bold; margin-bottom: 4px; font-size: 12px;">
                        🔧 DEV: ${pageName}
                    </div>
                    <div style="font-size: 10px; opacity: 0.9; line-height: 1.3;">
                        ${directives && directives.length > 0 ? directives.join(', ') : 'No custom directives detected'}
                    </div>
                    <div style="font-size: 9px; opacity: 0.7; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 4px;">
                        Visit #${pageVisits.length} • Port 8080 • KSESSIONS DEV
                    </div>
                </div>
            `;

            document.body.appendChild(debugBar);

            // Auto-fade after 12 seconds, but keep interactive
            setTimeout(function() {
                if (debugBar && debugBar.parentNode) {
                    debugBar.style.opacity = '0.5';
                    debugBar.addEventListener('mouseenter', function() {
                        this.style.opacity = '1';
                    });
                    debugBar.addEventListener('mouseleave', function() {
                        this.style.opacity = '0.5';
                    });
                }
            }, 12000);
        }

        function getJavaScriptFiles(templateUrl, directives) {
            var jsFiles = [];
            
            // Get JavaScript file from route mapping
            if (templateUrl && routeToJsMapping[templateUrl]) {
                jsFiles.push(routeToJsMapping[templateUrl]);
            }
            
            // Get JavaScript files from directives
            if (directives && directives.length > 0) {
                directives.forEach(function(directive) {
                    // Remove count suffixes like "(3)" and normalize directive names
                    var cleanDirective = directive.replace(/\s*\(\d+\)$/, '').trim();
                    
                    if (directiveToJsMapping[cleanDirective]) {
                        jsFiles.push(directiveToJsMapping[cleanDirective]);
                    }
                });
            }
            
            return jsFiles;
        }

        function getRouteMapping() {
            return {
                routes: routeToJsMapping,
                directives: directiveToJsMapping,
                services: servicesMapping
            };
        }
    }
})();
