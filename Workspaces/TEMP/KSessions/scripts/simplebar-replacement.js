/**
 * SimpleBar Replacement for mCustomScrollbar
 * Modern scrollbar solution compatible with jQuery 3.x
 * Replaces the problematic mCustomScrollbar plugin
 */

(function($, window, document) {
    'use strict';
    
    console.log('🔄 Loading SimpleBar replacement for mCustomScrollbar...');
    
    // Check if SimpleBar is available (we'll include it via CDN)
    function waitForSimpleBar(callback) {
        if (typeof SimpleBar !== 'undefined') {
            callback();
        } else {
            setTimeout(() => waitForSimpleBar(callback), 100);
        }
    }
    
    // Custom scrollbar implementation using CSS-only solution as fallback
    function createCustomScrollbar(element, options) {
        console.log('🔧 Creating custom scrollbar for:', element);
        
        var $el = $(element);
        var settings = $.extend({
            theme: 'minimal-dark',
            scrollInertia: 100,
            axis: 'y',
            mouseWheel: {
                enable: true,
                axis: 'y',
                preventDefault: true
            }
        }, options);
        
        // Add custom scrollbar classes
        $el.addClass('custom-scrollbar');
        
        // Apply CSS-based scrollbar styling
        if (!$('#custom-scrollbar-styles').length) {
            $('<style id="custom-scrollbar-styles">').text(`
                .custom-scrollbar {
                    overflow-y: auto;
                    overflow-x: hidden;
                    scrollbar-width: thin;
                    scrollbar-color: #888 #f1f1f1;
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 4px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
                
                .custom-scrollbar.theme-dark {
                    scrollbar-color: #555 #222;
                }
                
                .custom-scrollbar.theme-dark::-webkit-scrollbar-track {
                    background: #222;
                }
                
                .custom-scrollbar.theme-dark::-webkit-scrollbar-thumb {
                    background: #555;
                }
                
                .custom-scrollbar.theme-dark::-webkit-scrollbar-thumb:hover {
                    background: #777;
                }
                
                /* Smooth scrolling */
                .custom-scrollbar {
                    scroll-behavior: smooth;
                }
            `).appendTo('head');
        }
        
        // Apply theme
        if (settings.theme === 'minimal-dark') {
            $el.addClass('theme-dark');
        }
        
        // Mouse wheel support
        if (settings.mouseWheel && settings.mouseWheel.enable) {
            $el.on('wheel.customScrollbar', function(e) {
                if (settings.mouseWheel.preventDefault) {
                    var delta = e.originalEvent.deltaY;
                    if (delta > 0) {
                        this.scrollTop += 30;
                    } else {
                        this.scrollTop -= 30;
                    }
                    e.preventDefault();
                }
            });
        }
        
        console.log('✅ Custom scrollbar applied successfully');
        return $el;
    }
    
    // Replace mCustomScrollbar with our custom implementation
    $.fn.mCustomScrollbar = function(options) {
        console.log('🔧 mCustomScrollbar called - using SimpleBar replacement');
        
        // Handle different option types
        if (typeof options === 'string') {
            switch (options) {
                case 'destroy':
                    return this.removeClass('custom-scrollbar theme-dark').off('.customScrollbar');
                case 'update':
                    return this; // SimpleBar auto-updates
                default:
                    console.warn('🔧 mCustomScrollbar method not supported:', options);
                    return this;
            }
        }
        
        return this.each(function() {
            try {
                // First try to use SimpleBar if available
                if (typeof SimpleBar !== 'undefined') {
                    console.log('🔧 Using SimpleBar for scrollbar');
                    new SimpleBar(this, {
                        autoHide: true,
                        clickOnTrack: true,
                        scrollbarMinSize: 25
                    });
                } else {
                    // Fallback to CSS-only solution
                    console.log('🔧 Using CSS fallback for scrollbar');
                    createCustomScrollbar(this, options);
                }
            } catch (error) {
                console.warn('🔧 Scrollbar initialization error, using CSS fallback:', error);
                createCustomScrollbar(this, options);
            }
        });
    };
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        console.log('🔧 SimpleBar replacement ready');
        
        // Auto-apply to common selectors that would have used mCustomScrollbar
        setTimeout(function() {
            var selectors = [
                '.c-overflow',
                '.admin-sidebar',
                '.sidebar-content',
                '.scroll-container'
            ];
            
            selectors.forEach(function(selector) {
                var $elements = $(selector);
                if ($elements.length > 0) {
                    console.log('🔧 Auto-applying scrollbar to:', selector);
                    $elements.mCustomScrollbar({
                        theme: 'minimal-dark',
                        scrollInertia: 100,
                        axis: 'y'
                    });
                }
            });
        }, 1000);
    });
    
    console.log('✅ SimpleBar replacement for mCustomScrollbar loaded successfully');
    
})(jQuery, window, document);
