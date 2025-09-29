// Include in index.html so that app level exceptions are handled.
// Exclude from testRunner.html which should run exactly what it wants to run
(function () {
    'use strict';

    var app = angular.module('app');

    // Configure by setting an optional string value for appErrorPrefix.
    // Accessible via config.appErrorPrefix (via config value).

    app.config(['$provide', function ($provide) {
        $provide.decorator('$exceptionHandler',
            ['$delegate', 'config', 'logger', extendExceptionHandler]);
    }]);

    // Extend the $exceptionHandler service to also display a toast.
    function extendExceptionHandler($delegate, config, logger) {
        var appErrorPrefix = config.appErrorPrefix;
        var logError = logger.getLogFn('app', 'error');
        return function (exception, cause) {
            $delegate(exception, cause);
            
            // Safely check for exception message
            var exceptionMessage = exception && exception.message ? exception.message : 'Unknown error';
            
            if (appErrorPrefix && exceptionMessage.indexOf(appErrorPrefix) === 0) { return; }

            var errorData = { exception: exception, cause: cause };
            var msg = appErrorPrefix + exceptionMessage;
            logError(msg, errorData, true);
        };
    }
})();