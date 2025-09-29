(function () {
    'use strict';

    var app = angular.module('app');

    // Configure Toastr
    toastr.options.timeOut = 4000;
    toastr.options.positionClass = 'toast-bottom-right';

    // For use with the HotTowel-Angular-Breeze add-on that uses Breeze
    var remoteServiceName = 'breeze/Breeze';

    var events = {
        controllerActivateSuccess: 'controller.activateSuccess',
        spinnerToggle: 'spinner.toggle'
    };

    // Environment detection and URL configuration
    var isLocalDevelopment = (window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' || 
                             window.location.port === '8080');
    
    var isProductionEnvironment = (window.location.hostname === 'kashkole.servehttp.com' ||
                                  window.location.hostname === 'www.kashkole.servehttp.com' ||
                                  window.location.hostname === 'session.kashkole.com');
    
    var baseUrls = {
        production: 'https://kashkole.servehttp.com',
        development: window.location.protocol + '//' + window.location.host
    };
    
    // For session.kashkole.com frontend, still use kashkole.servehttp.com for media backend
    var currentBaseUrl = isLocalDevelopment ? baseUrls.development : baseUrls.production;

    var config = {
        applicationTitle: "Beautiful Islam",
        appErrorPrefix: '[Kashkole Error] ', //Configure the exceptionHandler decorator
        docTitle: 'HotTowel: ',
        events: events,
        stateOptions: {
            location: false
        },
        pollInterval: 240000, //poll every 4 minutes (240000)
        auditRefreshInterval: 120000,
        remoteServiceName: remoteServiceName,
        showDevToasts: false, // Disable development toast notifications
        debugMode: isLocalDevelopment, // Toggle to show entity IDs in debug scenarios - ONLY in development
        showDevelopmentFeatures: isLocalDevelopment, // Hide development-only features in production
        version: '2.1.0',
        ratingOptions: {
            max: 5,
            rate: 0,
            readOnly: false
        },
        // Environment-aware URLs
        baseUrl: currentBaseUrl,
        isLocalDevelopment: isLocalDevelopment,
        isProduction: isProductionEnvironment,
        environment: isLocalDevelopment ? 'Development' : 'Production',
        urls: {
            images: '/Content/images', // Relative path - works in all environments
            albumImages: '/Content/images/ALBUMS', // Relative path
            logo: '/content/images/logo.gif', // Relative path
            media: '/resources/media', // Relative path - eliminates cross-domain issues
            flags: 'https://resources.kashkole.com/Images/flags/large' // External CDN, keep as-is
        }
    };

    app.value('config', config);

    app.config(['$logProvider', function ($logProvider) {
        // turn debugging off/on (no info or warn)
        if ($logProvider.debugEnabled) {
            $logProvider.debugEnabled(true);
        }
    }]);

    //#region Configure the common services via commonConfig
    app.config(['commonConfigProvider', function (cfg) {
        cfg.config.controllerActivateSuccessEvent = config.events.controllerActivateSuccess;
        cfg.config.spinnerToggleEvent = config.events.spinnerToggle;
    }]);
    //#endregion
})();