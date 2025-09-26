/**
 * Enhanced mCustomScrollbar jQuery Conflict Fix with Detailed Logging
 * Fixes the "url.indexOf is not a function" error from mCustomScrollbar plugin
 */

(function($) {
    'use strict';
    
    console.log('🔧 [MCUSTOM-FIX] Starting enhanced mCustomScrollbar conflict fix...');
    
    // Store the original jQuery load method IMMEDIATELY
    var originalLoad = $.fn.load;
    console.log('🔧 [MCUSTOM-FIX] Original jQuery load method captured:', typeof originalLoad);
    
    // Enhanced jQuery load override with comprehensive logging
    $.fn.load = function(url, params, callback) {
        console.log('🔧 [MCUSTOM-FIX] jQuery.load() called with:', {
            url: url,
            urlType: typeof url,
            params: params,
            paramsType: typeof params,
            callback: callback,
            callbackType: typeof callback,
            stackTrace: new Error().stack.split('\n').slice(1, 4)
        });
        
        // Handle invalid URL parameters
        if (typeof url !== 'string' && url !== null && url !== undefined) {
            console.warn('🔧 [MCUSTOM-FIX] Invalid URL parameter detected! Converting...', {
                originalUrl: url,
                originalType: typeof url,
                isFunction: typeof url === 'function',
                isObject: typeof url === 'object',
                isNumber: typeof url === 'number'
            });
            
            // If it's a function (typical mCustomScrollbar issue), treat as callback
            if (typeof url === 'function') {
                console.log('🔧 [MCUSTOM-FIX] URL is function - shifting parameters');
                callback = url;
                url = '';
                params = null;
            } 
            // If it's a number or other non-string, convert to string
            else if (typeof url === 'number') {
                console.log('🔧 [MCUSTOM-FIX] URL is number - converting to string');
                url = String(url);
            }
            // If it's an object, try to extract meaningful URL
            else if (typeof url === 'object' && url !== null) {
                console.log('🔧 [MCUSTOM-FIX] URL is object - extracting string representation');
                url = url.toString ? url.toString() : '';
            }
            // Last resort - empty string
            else {
                console.log('🔧 [MCUSTOM-FIX] URL is unknown type - using empty string');
                url = '';
            }
            
            console.log('🔧 [MCUSTOM-FIX] Parameters after conversion:', {
                newUrl: url,
                newUrlType: typeof url,
                params: params,
                callback: callback
            });
        }
        
        try {
            console.log('🔧 [MCUSTOM-FIX] Calling original load method with:', { url, params, callback });
            var result = originalLoad.call(this, url, params, callback);
            console.log('🔧 [MCUSTOM-FIX] Original load method completed successfully');
            return result;
        } catch (error) {
            console.error('🔧 [MCUSTOM-FIX] Error in original load method:', error);
            console.log('🔧 [MCUSTOM-FIX] Returning jQuery object to maintain chaining');
            return this; // Return the jQuery object to maintain chaining
        }
    };
    
    console.log('🔧 [MCUSTOM-FIX] jQuery load method override applied');
    
    // Wait for mCustomScrollbar to be available and then override it
    function wrapMCustomScrollbar() {
        if ($.fn.mCustomScrollbar) {
            console.log('🔧 [MCUSTOM-FIX] mCustomScrollbar detected - applying wrapper');
            
            var originalMCustomScrollbar = $.fn.mCustomScrollbar;
            
            $.fn.mCustomScrollbar = function(options) {
                console.log('🔧 [MCUSTOM-FIX] mCustomScrollbar called with:', {
                    element: this.length ? this[0].tagName : 'none',
                    elementCount: this.length,
                    options: options,
                    optionsType: typeof options
                });
                
                var $this = this;
                
                try {
                    var result = originalMCustomScrollbar.call($this, options);
                    console.log('🔧 [MCUSTOM-FIX] mCustomScrollbar initialized successfully');
                    return result;
                } catch (error) {
                    console.error('🔧 [MCUSTOM-FIX] mCustomScrollbar error:', {
                        error: error.message,
                        stack: error.stack,
                        element: $this.length ? $this[0] : null,
                        options: options
                    });
                    
                    // Try to initialize with safe defaults
                    try {
                        console.log('🔧 [MCUSTOM-FIX] Attempting fallback initialization');
                        var fallbackResult = originalMCustomScrollbar.call($this, {
                            theme: 'minimal-dark',
                            scrollInertia: 100,
                            axis: 'y',
                            mouseWheel: {
                                enable: true,
                                axis: 'y',
                                preventDefault: true
                            }
                        });
                        console.log('🔧 [MCUSTOM-FIX] Fallback initialization successful');
                        return fallbackResult;
                    } catch (fallbackError) {
                        console.error('🔧 [MCUSTOM-FIX] Fallback initialization also failed:', fallbackError.message);
                        return $this; // Return original element to maintain chaining
                    }
                }
            };
            
            console.log('✅ [MCUSTOM-FIX] mCustomScrollbar method wrapped with enhanced error handling');
            return true;
        }
        return false;
    }
    
    // Try to wrap immediately if already available
    if (!wrapMCustomScrollbar()) {
        console.log('🔧 [MCUSTOM-FIX] mCustomScrollbar not yet available, setting up monitoring...');
        
        // Monitor for mCustomScrollbar availability
        var attempts = 0;
        var maxAttempts = 50; // 5 seconds total
        var checkInterval = setInterval(function() {
            attempts++;
            console.log(`🔧 [MCUSTOM-FIX] Checking for mCustomScrollbar (attempt ${attempts}/${maxAttempts})`);
            
            if (wrapMCustomScrollbar()) {
                clearInterval(checkInterval);
                console.log('✅ [MCUSTOM-FIX] mCustomScrollbar monitoring successful');
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.warn('⚠️ [MCUSTOM-FIX] mCustomScrollbar not found after maximum attempts');
            }
        }, 100);
    }
    
    // Also monitor for any existing errors and provide debugging info
    var originalConsoleError = console.error;
    console.error = function() {
        var args = Array.prototype.slice.call(arguments);
        var firstArg = args[0];
        
        if (typeof firstArg === 'string' && firstArg.includes('indexOf')) {
            console.log('🔧 [MCUSTOM-FIX] indexOf error detected:', {
                arguments: args,
                stack: new Error().stack
            });
        }
        
        return originalConsoleError.apply(console, arguments);
    };
    
    console.log('✅ [MCUSTOM-FIX] Enhanced mCustomScrollbar conflict fix applied with comprehensive logging');
    
    // Global indicator for debugging
    window.mCustomScrollbarFixApplied = true;
    window.mCustomScrollbarFixVersion = '2.0-enhanced';
    
})(jQuery);
