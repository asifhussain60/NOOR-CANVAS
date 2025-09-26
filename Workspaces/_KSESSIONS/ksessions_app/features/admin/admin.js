(function () {
    "use strict";
    var controllerId = "adminCtl";
    angular.module("app").controller(controllerId,
        ["$scope", "$timeout", "$state", "$http", "$compile", "common", "config", "contentManager", "globalData", "datacontext", "adminMenuConfig", adminCtl]);

    function adminCtl($scope, $timeout, $state, $http, $compile, common, config, contentManager, gData, dc, adminMenuConfig) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;
        
        // Make $state available to scope for navigation tracking
        $scope.$state = $state;

        vm.isProductionEnvironment = config.environment === 'Production' || config.environment === 'Release' || config.environment === 'production';
        vm.isDevelopmentSafe = !vm.isProductionEnvironment;

        // Admin menu configuration
        vm.menuConfig = adminMenuConfig.getMenuConfig();
        
        // Apply production overrides if in production environment
        if (vm.isProductionEnvironment) {
            adminMenuConfig.applyProductionOverrides();
            vm.menuConfig = adminMenuConfig.getMenuConfig();
        }

        // Menu visibility helpers
        vm.isMenuVisible = function(section, item) {
            return adminMenuConfig.isMenuItemVisible(section, item);
        };

        // Etymology panel toggle function
        vm.toggleEtymologyPanel = function() {
            console.log('🌿 [ADMIN-CONTROLLER] Toggling etymology panel visibility');
            // Find the etymology panel directive and toggle its visibility
            var etymologyPanel = angular.element('etymology-management-panel');
            if (etymologyPanel.length > 0) {
                var scope = etymologyPanel.scope();
                if (scope && scope.vm) {
                    scope.vm.isVisible = !scope.vm.isVisible;
                    scope.$apply();
                    console.log('🌿 [ADMIN-CONTROLLER] Etymology panel visibility toggled to:', scope.vm.isVisible);
                } else {
                    console.log('🌿 [ADMIN-CONTROLLER] Etymology panel scope not found, using $broadcast');
                    $scope.$broadcast('etymology.toggle');
                }
            } else {
                console.log('🌿 [ADMIN-CONTROLLER] Etymology panel element not found, using $broadcast');
                $scope.$broadcast('etymology.toggle');
            }
        };

        vm.model = {};

        if (!gData.member) {
            $scope.stateGo("login");
        } else if (!gData.member.isAdmin && !gData.member.canEdit) {
            $scope.stateGo("404");
        } else {
            activate();
        }

        function activate() {
            var promises = [
                loadDatabaseInfo() // Add database info loading
            ];
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(result) {
                $timeout(function () { 
                    wireupSidebar();
                    // Ensure sidebar is visible - multiple class approach
                    $('.admin-sidebar').addClass('show-sidebar');
                    $('body').addClass('styles-loaded');
                    
                    // Navigate to admin transcript by default when admin loads
                    navigateToAdminTranscript();
                    
                    // Additional timeout to ensure DOM is fully rendered
                    $timeout(function() {
                        console.log("DEBUG: Re-wiring sidebar after additional delay");
                        wireupThirdLevelMenus();
                    }, 500);
                }, 1000);
                log("Activated admin View", controllerId, config.showDevToasts);
            }
        };

        function navigateToAdminTranscript() {
            try {
                console.log("🚀 [ADMIN-CONTROLLER] Navigating to admin transcript as default route");
                
                // Check if we're already on the admin transcript page
                var currentState = $state.current.name;
                if (currentState === 'admin.transcript') {
                    console.log("🚀 [ADMIN-CONTROLLER] Already on admin transcript page, no navigation needed");
                    return;
                }
                
                // Check if we're on the base admin route (not a sub-route)
                if (currentState === 'admin') {
                    console.log("🚀 [ADMIN-CONTROLLER] On base admin route, navigating to transcript");
                    // Navigate to admin transcript route using the stateGo function
                    $scope.stateGo('admin.transcript');
                } else {
                    console.log("🚀 [ADMIN-CONTROLLER] On admin sub-route:", currentState, "- not navigating");
                }
                
            } catch (error) {
                console.error("🚀 [ADMIN-CONTROLLER] Error in navigateToAdminTranscript:", error);
            }
        }

        function wireupSidebar() {
            // Main level navigation (existing functionality)
            $(".has_sub > a").click(function (e) {
                e.preventDefault();
                var menuLi = $(this).parent("li");
                var menuUl = $(this).next("ul");

                if (menuLi.hasClass("open")) {
                    menuUl.slideUp(350);
                    menuLi.removeClass("open");
                }
                else {
                    $("#nav > li > ul").slideUp(350);
                    $("#nav > li").removeClass("open");
                    menuUl.slideDown(350);
                    menuLi.addClass("open");
                }
            });
            
            // Second level navigation (existing functionality)
            $("#nav li.sub-item a").on("click", function (e) {
                // Don't trigger for third-level toggle links
                if (!$(this).hasClass("sub-level-toggle")) {
                    $("#nav li.sub-item").removeClass("current");
                    $(this).parent("li").addClass("current");
                    
                    var parentLi = $(this).closest(".has_sub");
                    parentLi.addClass("open");
                    parentLi.find("ul").show();
                }
            });

            initializeCurrentState();
        }

        function wireupThirdLevelMenus() {
            console.log("DEBUG: Wiring up third-level menus");
            
            // Clear any existing event handlers to prevent duplicates
            $("#nav").off("click", "li.sub-item.has_sub_level2 > a.sub-level-toggle");
            $("#nav").off("click", ".sub-chevron");
            $("#nav").off("click", "li.sub-sub-item a");
            
            // Re-wire third level navigation
            $("#nav").on("click", "li.sub-item.has_sub_level2 > a.sub-level-toggle", function (e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log("DEBUG: Third-level toggle clicked (rewired)", this);
                
                var $this = $(this);
                var menuLi = $this.parent("li");
                var menuUl = $this.next("ul.sub-level2");

                console.log("DEBUG: Toggle state (rewired)", {
                    isOpen: menuLi.hasClass("open"),
                    menuLi: menuLi[0],
                    menuUl: menuUl[0],
                    menuUlLength: menuUl.length
                });

                if (menuLi.hasClass("open")) {
                    menuUl.slideUp(250);
                    menuLi.removeClass("open");
                    console.log("DEBUG: Closing third-level menu (rewired)");
                } else {
                    // Close other third-level menus in the same section
                    menuLi.siblings(".has_sub_level2").removeClass("open");
                    menuLi.siblings(".has_sub_level2").find("ul.sub-level2").slideUp(250);
                    
                    // Open this third-level menu
                    menuUl.slideDown(250);
                    menuLi.addClass("open");
                    console.log("DEBUG: Opening third-level menu (rewired)");
                }
            });

            // Wire up chevron clicks
            $("#nav").on("click", ".sub-chevron", function (e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log("DEBUG: Sub-chevron clicked (rewired)");
                
                // Trigger the parent link's click event
                $(this).closest("a.sub-level-toggle").trigger("click");
            });

            // Wire up third level item selection
            $("#nav").on("click", "li.sub-sub-item a", function (e) {
                $("#nav li.sub-sub-item").removeClass("current");
                $("#nav li.sub-item").removeClass("current");
                
                $(this).parent("li").addClass("current");
                
                // Keep parent menus open
                var level2Parent = $(this).closest(".has_sub_level2");
                var level1Parent = $(this).closest(".has_sub");
                
                level2Parent.addClass("open");
                level1Parent.addClass("open");
                level1Parent.find("ul").show();
                level2Parent.find("ul.sub-level2").show();
                
                console.log("DEBUG: Third-level item selected (rewired)");
            });

            console.log("DEBUG: Third-level menu wiring completed");
        }

        function initializeCurrentState() {
            var currentState = $scope.$state ? $scope.$state.current.name : '';

            var stateMenuMap = {
                'admin.systemUtilities': 'systemUtilities',
                'admin.gitCommits': 'gitCommits', 
                'admin.sqlBackups': 'sqlBackups',
                'admin.testSuite': 'testSuite',
                'admin.family': 'family',
                'admin.memberAccess': 'memberAccess',
                'admin.login': 'login',
                'admin.search': 'search',
                'admin.album': 'album',
                'admin.session': 'session',
                'admin.transcript': 'transcript',
                'admin.summary': 'summary',
                'admin.quranManager': 'quranManager',
                'admin.hubPreloader': 'hubPreloader',
                'admin.rootManager': 'rootManager',
                'admin.etymologyManager': 'etymologyManager',
                'admin.ahadeesManager': 'ahadeesManager',
                'admin.testFrameworkDocs': 'testFrameworkDocs',
                'admin.architectureDocs': 'architectureDocs'
            };

            var menuKey = stateMenuMap[currentState];
            if (menuKey) {
                var menuItem = findMenuItemByKey(menuKey);
                if (menuItem) {
                    // Clear all current states
                    $("#nav li.sub-item").removeClass("current");
                    $("#nav li.sub-sub-item").removeClass("current");
                    
                    menuItem.addClass("current");
                    
                    // Check if this is a third-level item
                    if (menuItem.hasClass("sub-sub-item")) {
                        // Handle third-level menu item
                        var level2Parent = menuItem.closest(".has_sub_level2");
                        var level1Parent = menuItem.closest(".has_sub");
                        
                        if (level1Parent.length > 0) {
                            $("#nav > li").removeClass("open");
                            level1Parent.addClass("open");
                            level1Parent.find("ul").show();
                            
                            if (level2Parent.length > 0) {
                                level2Parent.addClass("open");
                                level2Parent.find("ul.sub-level2").show();
                            }
                        }
                    } else {
                        // Handle second-level menu item (existing logic)
                        var parentLi = menuItem.closest(".has_sub");
                        if (parentLi.length > 0) {
                            $("#nav > li").removeClass("open");
                            parentLi.addClass("open");
                            parentLi.find("ul").show();
                        }
                    }
                }
            }
        }

        function findMenuItemByKey(menuKey) {
            var menuItem = null;
            
            // First, try to find third-level items
            $("#nav li.sub-sub-item a").each(function() {
                var ngClick = $(this).attr('data-ng-click');
                if (ngClick && ngClick.includes("stateGo('admin." + menuKey + "')")) {
                    menuItem = $(this).parent("li");
                    return false; // break
                }
            });
            
            // If not found in third level, try second level
            if (!menuItem) {
                $("#nav li.sub-item a").each(function() {
                    var ngClick = $(this).attr('data-ng-click');
                    if (ngClick && ngClick.includes("stateGo('admin." + menuKey + "')")) {
                        menuItem = $(this).parent("li");
                        return false; // break
                    }
                });
            }
            
            if (!menuItem) {
                var textMap = {
                    'systemUtilities': 'System Utilities',
                    'gitCommits': 'Git Commits',
                    'sqlBackups': 'SQL Backups', 
                    'resourceSync': 'Sync Resources',
                    'family': 'Family Members',
                    'memberAccess': 'Member Access',
                    'login': 'Login Simulation',
                    'search': 'Search',
                    'album': 'Albums',
                    'session': 'Sessions',
                    'transcript': 'Session Transcript',
                    'summary': 'Session Summary',
                    'quranManager': 'Quran',
                    'hubPreloader': 'Hub Preloader',
                    'rootManager': 'Roots',
                    'etymologyManager': 'Etymology',
                    'testFrameworkDocs': 'Test Framework',
                    'architectureDocs': 'Architecture'
                };
                
                var searchText = textMap[menuKey];
                if (searchText) {
                    // Search in third level first
                    $("#nav li.sub-sub-item a").each(function() {
                        if ($(this).text().trim() === searchText) {
                            menuItem = $(this).parent("li");
                            return false;
                        }
                    });
                    
                    // If not found, search in second level
                    if (!menuItem) {
                        $("#nav li.sub-item a").each(function() {
                            if ($(this).text().trim() === searchText) {
                                menuItem = $(this).parent("li");
                                return false;
                            }
                        });
                    }
                }
            }
            
            return menuItem;
        }

        $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
            $timeout(function() {
                initializeCurrentState();
            }, 100);
        });

        // JWT Extraction Tool
        vm.extractJwtInfo = function() {
            try {
                var jwtInfo = {
                    timestamp: new Date().toISOString(),
                    user: {
                        email: gData.profile ? gData.profile.email : 'Not available',
                        name: gData.profile ? gData.profile.name : 'Not available',
                        userId: gData.profile ? gData.profile.user_id : 'Not available',
                        isAdmin: gData.member ? gData.member.isAdmin : false,
                        memberId: gData.member ? gData.member.id : 'Not available'
                    },
                    authentication: {
                        jwt: gData.token || localStorage.getItem('accessToken') || 'JWT not found',
                        isAuthenticated: gData.isAuthenticated || false,
                        isAuthorized: gData.isAuthorized || false,
                        hasAccess: gData.hasAccess || false
                    },
                    environment: {
                        hostname: window.location.hostname,
                        port: window.location.port || '80',
                        protocol: window.location.protocol,
                        baseUrl: window.location.origin,
                        environment: config.environment || 'Unknown'
                    },
                    apiEndpoints: {
                        baseApiUrl: window.location.origin + '/api',
                        etymologySearch: window.location.origin + '/api/etymology/search',
                        etymologySearchExample: window.location.origin + '/api/etymology/search?searchTerm=light&includeDerivatives=true',
                        headers: {
                            'Authorization': 'Bearer ' + (gData.token || localStorage.getItem('accessToken') || 'JWT_TOKEN_HERE'),
                            'Content-Type': 'application/json'
                        },
                        curlExample: 'curl -X GET "' + window.location.origin + '/api/etymology/search?searchTerm=light&includeDerivatives=true" -H "Authorization: Bearer ' + (gData.token || localStorage.getItem('accessToken') || 'JWT_TOKEN_HERE') + '" -H "Content-Type: application/json"'
                    },
                    database: vm.databaseInfo || { info: 'Not loaded yet' }
                };

                var formattedOutput = "🔑 Beautiful Islam API Testing Information\n";
                formattedOutput += "===============================================\n\n";
                formattedOutput += "📅 Generated: " + jwtInfo.timestamp + "\n\n";
                
                formattedOutput += "👤 USER INFORMATION\n";
                formattedOutput += "Email: " + jwtInfo.user.email + "\n";
                formattedOutput += "Name: " + jwtInfo.user.name + "\n";
                formattedOutput += "User ID: " + jwtInfo.user.userId + "\n";
                formattedOutput += "Member ID: " + jwtInfo.user.memberId + "\n";
                formattedOutput += "Is Admin: " + jwtInfo.user.isAdmin + "\n\n";
                
                formattedOutput += "🔐 AUTHENTICATION\n";
                formattedOutput += "JWT Token: " + jwtInfo.authentication.jwt + "\n";
                formattedOutput += "Is Authenticated: " + jwtInfo.authentication.isAuthenticated + "\n";
                formattedOutput += "Is Authorized: " + jwtInfo.authentication.isAuthorized + "\n";
                formattedOutput += "Has Access: " + jwtInfo.authentication.hasAccess + "\n\n";
                
                formattedOutput += "🌐 ENVIRONMENT\n";
                formattedOutput += "Base URL: " + jwtInfo.environment.baseUrl + "\n";
                formattedOutput += "Environment: " + jwtInfo.environment.environment + "\n";
                formattedOutput += "Hostname: " + jwtInfo.environment.hostname + "\n";
                formattedOutput += "Port: " + jwtInfo.environment.port + "\n\n";
                
                formattedOutput += "🚀 API ENDPOINTS\n";
                formattedOutput += "Base API URL: " + jwtInfo.apiEndpoints.baseApiUrl + "\n";
                
                formattedOutput += "📋 CURL COMMAND EXAMPLE\n";
                formattedOutput += jwtInfo.apiEndpoints.curlExample + "\n\n";
                
                formattedOutput += "🔧 HEADERS FOR API CALLS\n";
                formattedOutput += "Authorization: " + jwtInfo.apiEndpoints.headers.Authorization + "\n";
                formattedOutput += "Content-Type: " + jwtInfo.apiEndpoints.headers['Content-Type'] + "\n\n";
                
                formattedOutput += "🗄️ DATABASE INFO\n";
                formattedOutput += JSON.stringify(jwtInfo.database, null, 2) + "\n\n";
                
              
                formattedOutput += "📝 TESTING CHECKLIST:\n";
                formattedOutput += "   - Verify database persistence\n";
                formattedOutput += "□ 5. Monitor browser console for comprehensive logging\n";
                formattedOutput += "□ 6. Test API endpoints with provided JWT token\n\n";
                
                formattedOutput += "🚨 CRITICAL NOTES:\n";
                formattedOutput += "• Database: " + (jwtInfo.database.defaultDatabase || 'KSESSIONS_DEV') + " & " + (jwtInfo.database.quranDatabase || 'KQUR_DEV') + "\n\n";
                
                
                formattedOutput += "📝 RAW JSON DATA\n";
                formattedOutput += JSON.stringify(jwtInfo, null, 2);

                // Copy to clipboard
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(formattedOutput).then(function() {
                        toastr.success('JWT and API information copied to clipboard!', 'Success');
                    }).catch(function(err) {
                        console.error('Failed to copy to clipboard:', err);
                        fallbackCopyToClipboard(formattedOutput);
                    });
                } else {
                    fallbackCopyToClipboard(formattedOutput);
                }

            } catch (error) {
                logError('Failed to extract JWT info: ' + error.message);
                toastr.error('Failed to extract JWT information', 'Error');
            }
        };

        function fallbackCopyToClipboard(text) {
            var textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                var successful = document.execCommand('copy');
                if (successful) {
                    toastr.success('JWT and API information copied to clipboard!', 'Success');
                } else {
                    toastr.warning('Please manually copy the information from browser console', 'Copy manually');
                    console.log('JWT and API Information:', text);
                }
            } catch (err) {
                toastr.warning('Please manually copy the information from browser console', 'Copy manually');
                console.log('JWT and API Information:', text);
            } finally {
                document.body.removeChild(textArea);
            }
        }

        // Load database connection information
        function loadDatabaseInfo() {
            console.log('🔧 [PRODUCTION-DEBUG] Starting loadDatabaseInfo()...');
            console.log('🔧 [PRODUCTION-DEBUG] Current URL:', window.location.href);
            console.log('🔧 [PRODUCTION-DEBUG] Hostname:', window.location.hostname);
            console.log('🔧 [PRODUCTION-DEBUG] Port:', window.location.port);
            console.log('🔧 [PRODUCTION-DEBUG] Protocol:', window.location.protocol);
            
            return dc.getDatabaseInfo()
                .then(function(response) {
                    console.log('🔧 [PRODUCTION-DEBUG] getDatabaseInfo() response received:', response);
                    
                    vm.databaseInfo = response.data;
                    vm.dbEnvironment = vm.databaseInfo.environment;
                    vm.isConnectedToProduction = vm.databaseInfo.isProduction;
                    vm.isConnectedToDevelopment = vm.databaseInfo.isDevelopment;
                    
                    console.log('🔧 [PRODUCTION-DEBUG] Database Info Raw Response:', response);
                    console.log('🔧 [PRODUCTION-DEBUG] Database Info Data:', response.data);
                    console.log('🔧 [PRODUCTION-DEBUG] Default Database:', vm.databaseInfo.defaultDatabase);
                    console.log('🔧 [PRODUCTION-DEBUG] Quran Database:', vm.databaseInfo.quranDatabase);
                    console.log('🔧 [PRODUCTION-DEBUG] Environment:', vm.databaseInfo.environment);
                    console.log('🔧 [PRODUCTION-DEBUG] Is Production:', vm.databaseInfo.isProduction);
                    console.log('🔧 [PRODUCTION-DEBUG] Is Development:', vm.databaseInfo.isDevelopment);
                    
                    // Enhanced domain detection with detailed logging
                    var hostname = window.location.hostname.toLowerCase();
                    var port = window.location.port;
                    var protocol = window.location.protocol;
                    
                    var domainChecks = {
                        includesKashkole: hostname.includes('kashkole.com'),
                        includesServehttp: hostname.includes('servehttp.com'),
                        includesSessionKashkole: hostname.includes('session.kashkole.com'),
                        notLocalhost: !hostname.includes('localhost'),
                        not127001: !hostname.includes('127.0.0.1'),
                        portCheck: (port === '' || port === '80' || port === '443')
                    };
                    
                    console.log('🔧 [PRODUCTION-DEBUG] Domain Analysis:');
                    console.log('🔧 [PRODUCTION-DEBUG]   - Hostname includes kashkole.com:', domainChecks.includesKashkole);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Hostname includes servehttp.com:', domainChecks.includesServehttp);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Hostname includes session.kashkole.com:', domainChecks.includesSessionKashkole);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Not localhost:', domainChecks.notLocalhost);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Not 127.0.0.1:', domainChecks.not127001);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Port check (empty, 80, or 443):', domainChecks.portCheck);
                    
                    var isProductionDomain = domainChecks.includesKashkole || 
                                           domainChecks.includesServehttp ||
                                           domainChecks.includesSessionKashkole ||
                                           (domainChecks.notLocalhost && 
                                            domainChecks.not127001 &&
                                            domainChecks.portCheck);
                    
                    console.log('🔧 [PRODUCTION-DEBUG]   - Final Production Domain Result:', isProductionDomain);
                    
                    var databaseChecks = {
                        defaultDbIncludesDev: vm.databaseInfo.defaultDatabase && vm.databaseInfo.defaultDatabase.includes('_DEV'),
                        quranDbIncludesDev: vm.databaseInfo.quranDatabase && vm.databaseInfo.quranDatabase.includes('_DEV'),
                        defaultDbIsProduction: vm.databaseInfo.defaultDatabase && (vm.databaseInfo.defaultDatabase === 'KSESSIONS' || vm.databaseInfo.defaultDatabase === 'KQUR'),
                        quranDbIsProduction: vm.databaseInfo.quranDatabase && (vm.databaseInfo.quranDatabase === 'KSESSIONS' || vm.databaseInfo.quranDatabase === 'KQUR')
                    };
                    
                    console.log('🔧 [PRODUCTION-DEBUG] Database Analysis:');
                    console.log('🔧 [PRODUCTION-DEBUG]   - Default DB includes _DEV:', databaseChecks.defaultDbIncludesDev);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Quran DB includes _DEV:', databaseChecks.quranDbIncludesDev);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Default DB is Production:', databaseChecks.defaultDbIsProduction);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Quran DB is Production:', databaseChecks.quranDbIsProduction);
                    
                    var isConnectedToDevDatabases = databaseChecks.defaultDbIncludesDev || databaseChecks.quranDbIncludesDev;
                    var isConnectedToProductionDatabases = databaseChecks.defaultDbIsProduction || databaseChecks.quranDbIsProduction;
                    var isDevelopmentDomain = hostname === 'localhost' || hostname === '127.0.0.1';
                    
                    console.log('🔧 [PRODUCTION-DEBUG]   - Connected to Dev DBs:', isConnectedToDevDatabases);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Connected to Production DBs:', isConnectedToProductionDatabases);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Is Development Domain:', isDevelopmentDomain);
                    
                    // WARNING CONDITIONS:
                    // 1. Production domain connecting to development databases
                    // 2. Development domain connecting to production databases
                    var productionDomainWithDevDb = isProductionDomain && isConnectedToDevDatabases;
                    var developmentDomainWithProdDb = isDevelopmentDomain && isConnectedToProductionDatabases;
                    
                    vm.isDangerousConfiguration = productionDomainWithDevDb || developmentDomainWithProdDb;
                    
                    console.log('🔧 [PRODUCTION-DEBUG] DANGER DETECTION RESULT:');
                    console.log('🔧 [PRODUCTION-DEBUG]   - Hostname:', hostname);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Port:', port);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Is Production Domain:', isProductionDomain);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Is Development Domain:', isDevelopmentDomain);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Connected to Dev DBs:', isConnectedToDevDatabases);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Connected to Production DBs:', isConnectedToProductionDatabases);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Production Domain + Dev DB:', productionDomainWithDevDb);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Development Domain + Production DB:', developmentDomainWithProdDb);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Default DB:', vm.databaseInfo.defaultDatabase);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Quran DB:', vm.databaseInfo.quranDatabase);
                    console.log('🔧 [PRODUCTION-DEBUG]   - Is Dangerous Configuration:', vm.isDangerousConfiguration);
                    console.log('🔧 [PRODUCTION-DEBUG]   - vm object:', vm);
                    
                    // Check DOM elements
                    console.log('🔧 [PRODUCTION-DEBUG] Checking DOM for danger overlay...');
                    
                    // Set CSS class for styling
                    if (vm.isDangerousConfiguration) {
                        vm.dbIndicatorClass = "db-indicator-danger-flashing";
                        
                        console.log('🚨 [PRODUCTION-DEBUG] CRITICAL: Production domain connected to DEV databases!');
                        console.log('🚨 [PRODUCTION-DEBUG] Domain:', hostname);
                        console.log('🚨 [PRODUCTION-DEBUG] Default DB:', vm.databaseInfo.defaultDatabase);
                        console.log('🚨 [PRODUCTION-DEBUG] Quran DB:', vm.databaseInfo.quranDatabase);
                        console.log('🚨 [PRODUCTION-DEBUG] Scheduling Angular update using $timeout...');
                        
                        // Use $timeout to safely trigger Angular update outside current digest cycle
                        $timeout(function() {
                            console.log('🚨 [PRODUCTION-DEBUG] Angular update executed via $timeout');
                            console.log('🚨 [PRODUCTION-DEBUG] vm.isDangerousConfiguration after update:', vm.isDangerousConfiguration);
                        }, 0);
                        
                        console.log('🚨 [PRODUCTION-DEBUG] Large danger overlay should be displayed');
                        
                        // Check if overlay elements exist in DOM after Angular has time to render
                        $timeout(function() {
                            var overlayElement = document.querySelector('.danger-overlay-modal[data-ng-if*="isDangerousConfiguration"]');
                            var allOverlayElements = document.querySelectorAll('.danger-overlay-modal');
                            
                            console.log('🔧 [PRODUCTION-DEBUG] Danger overlay element with ng-if:', overlayElement);
                            console.log('🔧 [PRODUCTION-DEBUG] All .danger-overlay-modal elements:', allOverlayElements);
                            console.log('🔧 [PRODUCTION-DEBUG] Angular scope vm:', vm);
                            console.log('🔧 [PRODUCTION-DEBUG] Angular scope vm.isDangerousConfiguration:', vm.isDangerousConfiguration);
                            
                            // Emergency DOM override - force overlay to show if Angular fails
                            if (allOverlayElements.length === 0) {
                                console.log('🚨 [EMERGENCY] No overlay elements found - creating emergency overlay!');
                                createEmergencyDangerOverlay();
                            } else {
                                // Force existing overlays to be visible
                                for (var i = 0; i < allOverlayElements.length; i++) {
                                    console.log('🚨 [EMERGENCY] Forcing overlay', i, 'to be visible');
                                    allOverlayElements[i].style.display = 'flex';
                                    allOverlayElements[i].style.visibility = 'visible';
                                    allOverlayElements[i].style.opacity = '1';
                                    allOverlayElements[i].style.zIndex = '999999';
                                }
                            }
                        }, 300); // Increased timeout to give Angular more time
                        
                        // Emergency styling directly
                        $timeout(function() {
                            console.log('🔧 [PRODUCTION-DEBUG] Final CSS class:', vm.dbIndicatorClass);
                        }, 500);
                        
                        // Apply emergency page styling
                        $timeout(function() {
                            console.log('🚨 [PRODUCTION-DEBUG] Emergency page styling applied');
                            document.body.style.border = '10px solid red';
                            document.body.style.backgroundColor = '#ffebee';
                            var title = document.querySelector('title');
                            if (title) {
                                title.textContent = '🚨 DANGER - DEV DB on PROD DOMAIN - ' + title.textContent;
                            }
                        }, 1500);
                        
                    } else if (vm.isConnectedToProduction) {
                        vm.dbIndicatorClass = "db-indicator-production";
                    } else if (vm.isConnectedToDevelopment) {
                        vm.dbIndicatorClass = "db-indicator-development";
                    } else {
                        vm.dbIndicatorClass = "db-indicator-unknown";
                    }
                    
                    return vm.databaseInfo;
                })
                .catch(function(error) {
                    logError("Failed to load database info: " + error.message);
                    vm.databaseInfo = {
                        environment: "ERROR",
                        defaultDatabase: "UNKNOWN",
                        quranDatabase: "UNKNOWN"
                    };
                    vm.dbIndicatorClass = "db-indicator-error";
                });
        }

        /**
         * Enhanced JWT extraction with clipboard functionality
         * Extracts JWT token and API information to clipboard for debugging
         */
        function extractJwtInfo() {
            console.log('🔧 [JWT-EXTRACTOR] Starting JWT extraction...');
            
            try {
                var jwtInfo = {
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    databaseInfo: vm.databaseInfo,
                    localStorage: {},
                    sessionStorage: {},
                    cookies: {},
                    headers: {},
                    authTokens: {}
                };

                // Extract localStorage
                if (window.localStorage) {
                    for (var i = 0; i < localStorage.length; i++) {
                        var key = localStorage.key(i);
                        jwtInfo.localStorage[key] = localStorage.getItem(key);
                    }
                }

                // Extract sessionStorage
                if (window.sessionStorage) {
                    for (var j = 0; j < sessionStorage.length; j++) {
                        var sessionKey = sessionStorage.key(j);
                        jwtInfo.sessionStorage[sessionKey] = sessionStorage.getItem(sessionKey);
                    }
                }

                // Extract cookies
                if (document.cookie) {
                    document.cookie.split(';').forEach(function(cookie) {
                        var parts = cookie.trim().split('=');
                        if (parts.length === 2) {
                            jwtInfo.cookies[parts[0]] = parts[1];
                        }
                    });
                }

                // Try to extract Angular Auth0 token if available
                if (window.angular && angular.element) {
                    try {
                        var scope = angular.element(document.body).scope();
                        if (scope && scope.g && scope.g.member) {
                            jwtInfo.angularAuth = {
                                member: scope.g.member,
                                authService: scope.g.authService ? 'Available' : 'Not Available'
                            };
                        }
                    } catch (authError) {
                        jwtInfo.angularAuthError = authError.message;
                    }
                }

                // Format as JSON
                var jsonOutput = JSON.stringify(jwtInfo, null, 2);
                
                // Copy to clipboard
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(jsonOutput).then(function() {
                        showToastNotification('success', 'JWT Info Copied', 'Authentication and database info copied to clipboard');
                        console.log('✅ [JWT-EXTRACTOR] Info copied to clipboard');
                    }).catch(function(err) {
                        fallbackCopyToClipboard(jsonOutput);
                    });
                } else {
                    fallbackCopyToClipboard(jsonOutput);
                }

                // Also log to console for immediate viewing
                console.log('🔧 [JWT-EXTRACTOR] Complete authentication info:', jwtInfo);
                
            } catch (error) {
                console.error('❌ [JWT-EXTRACTOR] Error extracting JWT info:', error);
                showToastNotification('error', 'Extraction Error', 'Failed to extract JWT info: ' + error.message);
            }
        }

        /**
         * Fallback clipboard function for older browsers
         */
        function fallbackCopyToClipboard(text) {
            try {
                var textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showToastNotification('success', 'JWT Info Copied', 'Authentication info copied to clipboard using fallback method');
                console.log('✅ [JWT-EXTRACTOR] Info copied using fallback method');
            } catch (fallbackError) {
                console.error('❌ [JWT-EXTRACTOR] Fallback copy failed:', fallbackError);
                showToastNotification('warning', 'Copy Failed', 'Could not copy to clipboard. Check console for JWT info.');
            }
        }

        /**
         * Emergency function to create danger overlay when Angular binding fails
         */
        function createEmergencyDangerOverlay() {
            console.log('🚨 [EMERGENCY] Creating emergency danger overlay...');
            
            // Add emergency CSS class to body
            document.body.classList.add('danger-mode');
            
            // Create overlay HTML
            var overlayHTML = `
                <div class="danger-overlay-modal" style="position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(220, 53, 69, 0.98) !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important;">
                    <div class="danger-overlay-content" style="background: #ffffff !important; border: 5px solid #dc3545 !important; border-radius: 20px !important; padding: 40px !important; max-width: 600px !important; width: 90vw !important; text-align: center !important; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;">
                        <div class="danger-icon" style="font-size: 80px !important; color: #dc3545 !important; margin-bottom: 20px !important;">
                            ⚠️
                        </div>
                        <h1 class="danger-title" style="color: #dc3545 !important; font-size: 36px !important; font-weight: bold !important; margin: 20px 0 !important;">
                            ⚠️ CRITICAL DANGER ⚠️
                        </h1>
                        <h2 class="danger-subtitle" style="color: #721c24 !important; font-size: 24px !important; font-weight: bold !important; margin: 15px 0 !important;">
                            ENVIRONMENT MISCONFIGURED
                        </h2>
                        <div class="danger-message" style="background: #f8f9fa !important; border: 2px solid #dc3545 !important; border-radius: 10px !important; padding: 20px !important; margin: 20px 0 !important; color: #721c24 !important;">
                            <p><strong>Database and domain environment mismatch detected!</strong></p>
                            <p>Domain: <strong>${window.location.hostname}:${window.location.port || 'default'}</strong></p>
                            <p>Default DB: <strong>${vm.databaseInfo ? vm.databaseInfo.defaultDatabase : 'Unknown'}</strong></p>
                            <p>Quran DB: <strong>${vm.databaseInfo ? vm.databaseInfo.quranDatabase : 'Unknown'}</strong></p>
                            <p style="background: #dc3545 !important; color: white !important; padding: 15px !important; border-radius: 8px !important; margin-top: 20px !important;">
                                <strong>IMMEDIATE ACTION REQUIRED: Verify database connections are correct for this environment!</strong>
                            </p>
                        </div>
                        <div class="danger-buttons" style="margin-top: 30px !important;">
                            <button type="button" class="btn btn-danger btn-lg" onclick="acknowledgeEmergencyDanger()" style="font-size: 18px !important; font-weight: bold !important; padding: 12px 25px !important;">
                                I Understand - Continue At My Own Risk
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Insert overlay into DOM
            document.body.insertAdjacentHTML('beforeend', overlayHTML);
            
            console.log('🚨 [EMERGENCY] Emergency danger overlay created and inserted');
        }

        /**
         * Global function to acknowledge emergency danger overlay
         */
        window.acknowledgeEmergencyDanger = function() {
            console.log('🚨 [EMERGENCY] User acknowledged danger - removing emergency overlay');
            var emergencyOverlays = document.querySelectorAll('.danger-overlay-modal');
            for (var i = 0; i < emergencyOverlays.length; i++) {
                emergencyOverlays[i].remove();
            }
            document.body.classList.remove('danger-mode');
        };

        // Expose the function to the view model
        vm.extractJwtInfo = extractJwtInfo;
    }
})();