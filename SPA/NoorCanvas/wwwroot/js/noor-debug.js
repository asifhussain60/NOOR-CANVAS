/**
 * NOOR Canvas Debug JavaScript Module
 * Browser-side debugging utilities with easy cleanup mechanism
 * 
 * Cleanup Strategy: Search for "NOOR_DEBUG" to remove all debug code
 */

window.NOOR_DEBUG = {
    enabled: true, // Set to false in production

    /**
     * Enhanced console logging with timestamps and component grouping
     */
    log: function(component, message, data) {
        if (!this.enabled) return;
        
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });

        console.group(`🔍 NOOR_DEBUG [${timestamp}] ${component}`);
        console.log(message);
        if (data) {
            console.log('Data:', data);
        }
        console.trace('Call stack');
        console.groupEnd();
    },

    /**
     * Track HTTP requests and responses
     */
    logHttp: function(method, url, requestData, responseData, duration) {
        if (!this.enabled) return;

        const httpInfo = {
            method: method,
            url: url,
            duration: duration + 'ms',
            request: requestData,
            response: responseData
        };

        console.group(`🌐 HTTP ${method} ${url}`);
        console.table(httpInfo);
        console.groupEnd();
    },

    /**
     * Track Blazor component lifecycle
     */
    logComponent: function(componentName, lifecycle, parameters) {
        if (!this.enabled) return;

        this.log('COMPONENT', `${componentName} → ${lifecycle}`, parameters);
    },

    /**
     * Track form submissions and validations
     */
    logForm: function(formName, action, formData, validationErrors) {
        if (!this.enabled) return;

        const formInfo = {
            action: action,
            data: formData,
            errors: validationErrors
        };

        this.log('FORM', `${formName} ${action}`, formInfo);
    },

    /**
     * Track SignalR connection and events
     */
    logSignalR: function(hubName, eventType, eventData) {
        if (!this.enabled) return;

        this.log('SIGNALR', `${hubName} → ${eventType}`, eventData);
    },

    /**
     * Performance timing utility
     */
    startTimer: function(operationName) {
        if (!this.enabled) return null;

        const startTime = performance.now();
        return {
            stop: () => {
                const duration = (performance.now() - startTime).toFixed(2);
                this.log('PERFORMANCE', `${operationName} completed in ${duration}ms`);
                return parseFloat(duration);
            }
        };
    },

    /**
     * Track authentication flow
     */
    logAuth: function(step, data, success) {
        if (!this.enabled) return;

        const status = success ? '✅' : '❌';
        this.log('AUTH', `${status} ${step}`, data);
    },

    /**
     * Track navigation and routing
     */
    logNavigation: function(from, to, parameters) {
        if (!this.enabled) return;

        this.log('NAVIGATION', `${from} → ${to}`, parameters);
    },

    /**
     * Utility to dump all debug logs to downloadable file
     */
    exportLogs: function() {
        if (!this.enabled) return;

        const logs = JSON.stringify(console.memory || 'Console logs not available', null, 2);
        const blob = new Blob([logs], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `noor-debug-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

/**
 * Global error handler for uncaught exceptions
 */
window.addEventListener('error', function(event) {
    if (window.NOOR_DEBUG && window.NOOR_DEBUG.enabled) {
        window.NOOR_DEBUG.log('ERROR', 'Uncaught Exception', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
    }
});

/**
 * Global promise rejection handler
 */
window.addEventListener('unhandledrejection', function(event) {
    if (window.NOOR_DEBUG && window.NOOR_DEBUG.enabled) {
        window.NOOR_DEBUG.log('ERROR', 'Unhandled Promise Rejection', {
            reason: event.reason,
            promise: event.promise
        });
    }
});

console.log('🔍 NOOR_DEBUG: Debug utilities loaded successfully');
