(function () {
    'use strict';

    var app = angular.module('app', [
        // Angular modules
        'ngAnimate', // animations
        'ui.router', // routing
        'ngSanitize', // sanitizes html bindings (ex: sidebar.js)

        // Custom modules
        'common', // common functions, logger, spinner
        'common.bootstrap', // bootstrap dialog wrapper functions
        'common.directives',

        // 3rd Party Modules
        'ui.bootstrap', // ui-bootstrap (ex: carousel, pagination, dialog)
        'oc.lazyLoad',
        'froala', //Froala editor
        'auth0.lock', 'angular-jwt', //Auth0 setup
        'ngCacheBuster',
        'ngIdle',
        'angAccordion',
        'as.sortable',
        'duScroll',
        'uiSwitch'
    ]);

    var g = {
        signalRConnectionId: null,
        deviceCssLoaded: false,
        isAuthenticated: false,
        member: null,
        executionEnv: 'Development', // Will be updated from server config
        navConfig: {
            applicationTitle: 'Beautiful Islam',
            pageTitle: '',
            showFooter: false,
            showHeader: true
        },
        cssConfig: {
            userCssLoaded: false,
            adminCssLoaded: false,
            configLoaded: function (type) {
                var that = this;
                switch (type) {
                    case "user":
                        that.userCssLoaded = true;
                        that.adminCssLoaded = false;
                        break;
                    case "manage":
                        that.userCssLoaded = false;
                        that.adminCssLoaded = true;
                        break;
                    default:
                }
            }
        },
        isSignedIn: function () {
            return this.member && this.member.id > 0;
        }
    };
    app.constant('globalData', g);
    app.value('imageHubService', $.connection.imageHub);

    // Configure the routes and route resolvers
    app.config(['$httpProvider', 'lockProvider', 'jwtOptionsProvider', 'jwtInterceptorProvider', 'globalData', 'httpRequestInterceptorCacheBusterProvider', 'IdleProvider', 'KeepaliveProvider', appConfiguration]);
    
    // Helper function for environment-aware URLs (UPDATED: Using relative paths)
    function getEnvironmentAwareLogoUrl() {
        // Use relative path - works in all environments
        return '/content/images/logo.gif';
    }
    
    function appConfiguration($httpProvider, lockProvider, jwtOptionsProvider, jwtInterceptorProvider, globalData, httpRequestInterceptorCacheBusterProvider, IdleProvider, KeepaliveProvider) {
        //cache buster - bust everything except the following folders
        httpRequestInterceptorCacheBusterProvider.setMatchlist([/.*template.*/, /.*modal.*/]);

        // Initialization for the Lock widget
        lockProvider.init({
            clientID: 'M5roSwzIx3NPOLI62njZR9SnjGnXMhWP',
            domain: 'kashkole.auth0.com',
            options: {
                languageDictionary: {
                    title: "BEAUTIFUL ISLAM"
                }, theme: {
                    labeledSubmitButton: false,
                    logo: getEnvironmentAwareLogoUrl(),
                    primaryColor: 'purple'
                },
                auth: {
                    redirect: false,
                    popupOptions: { width: 300, height: 400, left: 200, top: 300 },
                    responseType: 'token',
                    sso: true,
                    rememberLastLogin: false
                },
                autoclose: true
            }
        });

        // Configuration for angular-jwt
        jwtOptionsProvider.config({
            tokenGetter: ['options', function (options) {
                // Skip token if skipAuthorization is explicitly set
                if (options && options.skipAuthorization) {
                    return null;
                }

                // Skip token for registration endpoints (anonymous access)
                if (options && options.url &&
                    (options.url.indexOf('/api/registration/') !== -1 ||
                        options.url.indexOf('/api/lookup/countries/') !== -1)) {
                    return null;
                }

                // Skip token for HTML template requests
                if (options && options.url && options.url.substr(options.url.length - 5) === '.html') {
                    return null;
                }

                return localStorage.getItem('accessToken');
            }],
            whiteListedDomains: ['localhost'],
            unauthenticatedRedirectPath: 'login'
        });

        $httpProvider.interceptors.push('jwtInterceptor');

        // configure Idle settings
        IdleProvider.idle(6000); // in seconds
        IdleProvider.timeout(1); // in seconds
    }

    // Configure route change tracking
    app.run(['$rootScope', '$state', 'silentLogger', function($rootScope, $state, silentLogger) {
        
        // Initialize Froala plugins now that Angular app module is ready
        if (window.deferredFroalaPlugins && window.deferredFroalaPlugins.length > 0) {
            console.log('🚀 [APP-INIT] Registering deferred Froala plugins:', window.deferredFroalaPlugins.length);
            window.deferredFroalaPlugins.forEach(function(pluginInitializer) {
                try {
                    pluginInitializer();
                } catch (error) {
                    console.error('❌ [APP-INIT] Error initializing Froala plugin:', error);
                }
            });
            // Clear the queue after processing
            window.deferredFroalaPlugins = [];
            console.log('✅ [APP-INIT] All deferred Froala plugins registered successfully');
        }
        
        // Track state changes for enhanced logging
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            console.log('DEBUG: State change starting', {
                from: fromState ? fromState.name : 'none',
                to: toState ? toState.name : 'unknown',
                fromParams: fromParams,
                toParams: toParams
            });
            
            // Log the route change
            silentLogger.routeChange(fromState, toState, fromParams, toParams, 'StateChangeStart');
        });

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
            console.log('DEBUG: State change successful', {
                from: fromState ? fromState.name : 'none',
                to: toState ? toState.name : 'unknown',
                finalUrl: $state.href(toState.name, toParams)
            });
            
            // Log successful navigation
            silentLogger.info('Navigation completed successfully', {
                state: toState.name,
                route: toState.url,
                params: toParams,
                adminTitle: toState.data && toState.data.adminTitle || null,
                pageTitle: toState.data && toState.data.pageTitle || null
            }, 'Navigation');
        });

        $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
            console.error('DEBUG: State change error', {
                from: fromState ? fromState.name : 'none',
                to: toState ? toState.name : 'unknown',
                error: error
            });
            
            // Log navigation errors
            silentLogger.error('Navigation error occurred', {
                state: toState ? toState.name : 'unknown',
                route: toState && toState.url || 'unknown',
                params: toParams,
                error: error
            }, 'NavigationError', error);
        });
    }]);
})();