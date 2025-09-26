(function () {
    'use strict';

    angular
        .module('app')
        .directive('ahadeesManagementPanel', ahadeesManagementPanel);

    ahadeesManagementPanel.$inject = ['$timeout'];

    function ahadeesManagementPanel($timeout) {
        console.log('🔧 [AHADEES-DIRECTIVE] ahadeesManagementPanel directive being registered');
        
        return {
            restrict: 'E',
            templateUrl: 'app/features/admin/ahadeesManagementPanel.html',
            controller: 'AhadeesManagementPanelController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                isVisible: '=',
                onClose: '&',
                sessionId: '='
            },
            link: function(scope, element, attrs, controller) {
                // Enhanced debugging and lifecycle management
                console.log('🔧 [AHADEES-DIRECTIVE] ahadeesManagementPanel link function called', {
                    isVisible: scope.vm.isVisible,
                    hasElement: !!element,
                    elementCount: element.length,
                    controllerExists: !!controller,
                    timestamp: new Date().toISOString()
                });

                // Enhanced template and DOM detection
                scope.$watch('vm.isVisible', function(newValue, oldValue) {
                    if (newValue !== oldValue) {
                        console.log('🔧 [AHADEES-DIRECTIVE] isVisible changed', {
                            newValue: newValue,
                            oldValue: oldValue,
                            timestamp: new Date().toISOString()
                        });
                        
                        if (newValue) {
                            // Multiple attempts to detect panel with enhanced logging
                            $timeout(function() {
                                console.log('🔧 [AHADEES-DIRECTIVE] Starting enhanced DOM detection...');
                                
                                // Method 1: Check directive element content
                                var directiveElement = element[0];
                                console.log('🔧 [AHADEES-DIRECTIVE] Directive element details:', {
                                    tagName: directiveElement.tagName,
                                    className: directiveElement.className,
                                    childElementCount: directiveElement.childElementCount,
                                    innerHTML: directiveElement.innerHTML.substring(0, 200) + '...',
                                    clientWidth: directiveElement.clientWidth,
                                    clientHeight: directiveElement.clientHeight
                                });
                                
                                // Method 2: Look for panel with multiple selectors
                                var panelSelectors = [
                                    '.ahadees-management-panel',
                                    '.ahadees-panel', 
                                    '[class*="ahadees"]',
                                    'div[style*="position: fixed"]'
                                ];
                                
                                var foundPanel = null;
                                panelSelectors.forEach(function(selector) {
                                    var panelElement = directiveElement.querySelector(selector);
                                    console.log('🔧 [AHADEES-DIRECTIVE] Selector "' + selector + '" found:', !!panelElement);
                                    if (panelElement && !foundPanel) {
                                        foundPanel = panelElement;
                                    }
                                });
                                
                                // Method 3: Check for template content keywords
                                var hasAhadeesContent = directiveElement.innerHTML.indexOf('AHADEES') !== -1;
                                var hasTemplateContent = directiveElement.innerHTML.indexOf('TEMPLATE LOADED') !== -1;
                                var hasDebugContent = directiveElement.innerHTML.indexOf('Enhanced Debug') !== -1;
                                
                                console.log('🔧 [AHADEES-DIRECTIVE] Content detection:', {
                                    hasAhadeesContent: hasAhadeesContent,
                                    hasTemplateContent: hasTemplateContent,
                                    hasDebugContent: hasDebugContent,
                                    totalInnerHTMLLength: directiveElement.innerHTML.length
                                });
                                
                                if (foundPanel) {
                                    console.log('🔧 [AHADEES-DIRECTIVE] ✅ Panel element found successfully!');
                                    console.log('🔧 [AHADEES-DIRECTIVE] Panel computed styles:', {
                                        display: getComputedStyle(foundPanel).display,
                                        visibility: getComputedStyle(foundPanel).visibility,
                                        position: getComputedStyle(foundPanel).position,
                                        top: getComputedStyle(foundPanel).top,
                                        right: getComputedStyle(foundPanel).right,
                                        zIndex: getComputedStyle(foundPanel).zIndex,
                                        width: getComputedStyle(foundPanel).width,
                                        height: getComputedStyle(foundPanel).height,
                                        backgroundColor: getComputedStyle(foundPanel).backgroundColor,
                                        border: getComputedStyle(foundPanel).border
                                    });
                                    
                                    console.log('🔧 [AHADEES-DIRECTIVE] Panel bounding rect:', foundPanel.getBoundingClientRect());
                                    
                                } else if (hasTemplateContent) {
                                    console.log('🔧 [AHADEES-DIRECTIVE] ✅ Template content detected but panel selector not found');
                                    console.log('🔧 [AHADEES-DIRECTIVE] This means template is loading but CSS class might be different');
                                    
                                } else {
                                    console.error('🔧 [AHADEES-DIRECTIVE] ❌ Panel DOM element NOT found and no template content detected!');
                                    console.log('🔧 [AHADEES-DIRECTIVE] Template URL: app/features/admin/ahadeesManagementPanel.html');
                                    console.log('🔧 [AHADEES-DIRECTIVE] Check if template file exists and is accessible');
                                    console.log('🔧 [AHADEES-DIRECTIVE] Full directive innerHTML:', directiveElement.innerHTML);
                                }
                                
                                // Method 4: Force visibility check
                                if (directiveElement.innerHTML.length > 1000) {
                                    console.log('🔧 [AHADEES-DIRECTIVE] Template appears to be loaded (large innerHTML)');
                                    console.log('🔧 [AHADEES-DIRECTIVE] Checking if ng-show condition is working...');
                                    console.log('🔧 [AHADEES-DIRECTIVE] vm.isVisible value:', scope.vm.isVisible);
                                }
                                
                            }, 100); // Increased delay for template rendering
                        }
                    }
                });

                // Cleanup on scope destroy
                scope.$on('$destroy', function() {
                    console.log('🔧 [AHADEES-DIRECTIVE] Directive scope destroyed - cleaning up');
                });
            }
        };
    }
})();
