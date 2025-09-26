(function () {
    "use strict";
    var controllerId = "groupCtlr";
    angular.module("app").controller(controllerId, ["$scope", "$document", "$window", "common", "config", "globalData", "contentManager", "mediaportService", "$injector", albumController]);

    function albumController($scope, $document, $window, common, config, gData, contentMgr, msp, $injector) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");
        var albumId = $scope.$stateParams.albumId || 0;
        var categoryId = $scope.$stateParams.cid || 0;
        $scope.vm = {}; var vm = $scope.vm;
        vm.mediaPort = msp;

        //Properties
        vm.album = null;
        vm.isMobileBrowser = common.isMobileBrowser();
        vm.isTabletDevice = msp.isIPad() || msp.isAndroid();
        vm.screenSize = {
            width: $window.innerWidth,
            height: $window.innerHeight
        };

        // Accordion functionality - with safe loading
        vm.categoryAccordion = null;
        var accordionService = null;

        // Try to get accordionService safely
        try {
            accordionService = $injector.get('accordionService');
        } catch (error) {
            logError("accordionService not available, using fallback: " + error.message, controllerId);
        }

        //Methods
        vm.returnToAlbumsView = returnToAlbumsView;
        vm.selectSession = selectSession;
        vm.youngAdults = null;
        vm.adults = null;
        vm.passiveMembers = null;
        vm.getColDimensions = getColDimensions;
        vm.isIpadInPortraitMode = isIpadInPortraitMode;
        vm.showSessionDeliveryDate = showSessionDeliveryDate;
        vm.toggleSessions = toggleSessions;
        vm.getResponsiveClasses = getResponsiveClasses;
        vm.isSmallScreen = isSmallScreen;
        vm.adaptToScreenSize = adaptToScreenSize;

        activate();

        function activate() {
            var memberId = gData.member.id || 0;
            if (!albumId || !memberId) { return; }

            // Initialize responsive behavior
            initializeResponsive();

            var promises = [
                contentMgr.getAlbumDataById(albumId, memberId),
                contentMgr.getCategoriesForAlbum(albumId)
            ];
            common.activateController(promises, controllerId).then(onControllerActivation);

            function onControllerActivation(response) {
                if (response && response[0]) {
                    vm.album = angular.copy(contentMgr.currentAlbum);
                    // Fix image property case mapping - API returns 'Image' but template expects 'image'
                    if (vm.album.Image && !vm.album.image) {
                        vm.album.image = vm.album.Image;
                    }
                    $scope.setPageTitle(vm.album.name);
                    vm.categorySessions = groupSessionsByCategory(vm.album);
                    vm.adults = angular.copy(_.filter(vm.album.members, function (m) { return m.age >= 18 && !m.isPassive }));
                    vm.youngAdults = angular.copy(_.filter(vm.album.members, function (m) { return m.age < 18 && !m.isPassive }));
                    vm.passiveMembers = angular.copy(_.filter(vm.album.members, function (m) { return m.isPassive }));
                    
                    // Initialize category accordion if service is available
                    if (accordionService) {
                        initializeCategoryAccordion();
                    } else {
                        // Fallback: expand first category manually
                        if (vm.categorySessions.length > 0) {
                            vm.categorySessions[0].isExpanded = true;
                            vm.categorySessions[0].isCollapsed = false;
                        }
                    }
                    
                    if (vm.categorySessions.length === 1) {
                        var categoryItem = vm.categorySessions[0];
                        categoryId = categoryItem.category.id;
                    }
                    
                    if (categoryId)
                        initiateCategoryJump(categoryId);

                    // Apply responsive behavior after data load
                    adaptToScreenSize();
                }
            }
        }

        //Internal Methods

        function groupSessionsByCategory(album) {
            var sessionGroup = _.groupBy(album.sessions, "categoryName");
            var data = [];
            var i = 0;
            _.each(sessionGroup, function (value, key, list) {
                var cat = common.findByStringValue(album.sessions, "categoryName", key);
                var item = {
                    idx: i,
                    id: cat.categoryId, // Required for accordion service
                    category: {
                        id: cat.categoryId,
                        name: key
                    },
                    sessions: value,
                    isCollapsed: true, // Will be set by accordion service
                    isExpanded: false  // Will be set by accordion service
                };

                data.push(item);
                i++;
            });
            return data;
        }

        function initializeCategoryAccordion() {
            if (!accordionService) {
                logError("accordionService not available for category initialization", controllerId);
                return;
            }

            try {
                // Create accordion instance for categories with first one expanded
                vm.categoryAccordion = accordionService.createAccordion({
                    allowMultiple: false, // Only one category expanded at a time
                    expandFirst: true,    // Expand first category by default
                    onExpand: function(item, itemId) {
                        log("Category expanded: " + item.category.name, controllerId, config.showDevToasts);
                        
                        // Smooth scroll to category on mobile after expand
                        if (vm.isMobileBrowser) {
                            common.$timeout(function () {
                                var titleElement = angular.element(document.getElementById("category-" + itemId));
                                if (titleElement.length) {
                                    $document.scrollToElement(titleElement, 50, 300);
                                }
                            }, 100);
                        }
                    },
                    onCollapse: function(item, itemId) {
                        log("Category collapsed: " + item.category.name, controllerId, config.showDevToasts);
                    }
                });

                // Set the categories in the accordion
                vm.categoryAccordion.setItems(vm.categorySessions);
            } catch (error) {
                logError("Error initializing category accordion: " + error.message, controllerId);
                // Fallback to manual management
                if (vm.categorySessions.length > 0) {
                    vm.categorySessions[0].isExpanded = true;
                    vm.categorySessions[0].isCollapsed = false;
                }
            }
        }

        function selectSession(session) {
            $scope.stateGo("session", { albumId: albumId, sessionId: session.id });
        }

        function toggleSessions(item) {
            if (!item || !item.id) {
                return;
            }
            
            if (vm.categoryAccordion) {
                vm.categoryAccordion.toggle(item.id);
            } else {
                // Fallback: manual accordion behavior
                var wasExpanded = !item.isCollapsed;
                
                // Collapse all categories
                vm.categorySessions.forEach(function(category) {
                    category.isCollapsed = true;
                    category.isExpanded = false;
                });
                
                // If clicked category was collapsed, expand it
                if (!wasExpanded) {
                    item.isCollapsed = false;
                    item.isExpanded = true;
                    
                    // Smooth scroll to category on mobile after toggle
                    if (vm.isMobileBrowser) {
                        common.$timeout(function () {
                            var titleElement = angular.element(document.getElementById("category-" + item.category.id));
                            if (titleElement.length) {
                                $document.scrollToElement(titleElement, 50, 300);
                            }
                        }, 100);
                    }
                }
            }
        }

        function returnToAlbumsView() {
            $scope.stateGo("albums");
        }

        function getColDimensions() {
            var colDimensions = "col-sm-10 col-sm-offset-1 col-md-5 col-lg-5 col-md-offset-0 col-lg-offset-0";
            
            if (vm.isTabletDevice) {
                if (msp.getOrientation() === "portrait") {
                    colDimensions = "col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2";
                } else {
                    colDimensions = "col-sm-12 col-md-6 col-lg-6";
                }
            } else if (vm.isMobileBrowser) {
                colDimensions = "col-12";
            }
            
            return colDimensions;
        }

        function getResponsiveClasses() {
            var classes = [];
            
            if (vm.isMobileBrowser) {
                classes.push('mobile-view');
            }
            
            if (vm.isTabletDevice) {
                classes.push('tablet-view');
                classes.push(msp.getOrientation() === "portrait" ? 'portrait-view' : 'landscape-view');
            }
            
            if (vm.screenSize.width <= 480) {
                classes.push('extra-small-screen');
            } else if (vm.screenSize.width <= 768) {
                classes.push('small-screen');
            } else if (vm.screenSize.width <= 1024) {
                classes.push('medium-screen');
            } else {
                classes.push('large-screen');
            }
            
            return classes.join(' ');
        }

        function isIpadInPortraitMode() {
            return !!(msp.isIPad() && msp.getOrientation() === "portrait");
        }

        function isSmallScreen() {
            return vm.screenSize.width <= 768;
        }

        function showSessionDeliveryDate() {
            var isLandscape = msp.isInLandscape();
            
            // Always show on desktop
            if (!vm.isMobileBrowser && !vm.isTabletDevice) {
                return true;
            } 
            // Show on tablets in landscape
            else if (vm.isTabletDevice && isLandscape) {
                return true;
            } 
            // Show on mobile in landscape if screen is wide enough
            else if (vm.isMobileBrowser && isLandscape && vm.screenSize.width > 480) {
                return true;
            } 
            // Hide on mobile portrait and small screens
            else {
                return false;
            }
        }

        function adaptToScreenSize() {
            vm.screenSize = {
                width: $window.innerWidth,
                height: $window.innerHeight
            };
            
            // The accordion service handles expansion state
            // No need to manually manage isCollapsed here
        }

        function initializeResponsive() {
            // Listen for orientation changes
            angular.element($window).on('orientationchange resize', function() {
                $scope.$evalAsync(function() {
                    adaptToScreenSize();
                });
            });
            
            // Handle touch gestures for mobile
            if (vm.isMobileBrowser) {
                // Add touch-friendly behaviors
                common.$timeout(function() {
                    // Add touch indicators
                    angular.element('.session-item').addClass('touch-enabled');
                    angular.element('.category-header').addClass('touch-enabled');
                }, 500);
            }
        }

        function initiateCategoryJump(categoryId) {
            if (!categoryId) { return; }
            categoryId = Number(categoryId);
            
            var result = vm.categorySessions.find(function (item) {
                return item.category.id === categoryId;
            });
            
            if (result) {
                common.$timeout(function () {
                    // Use accordion service to expand the specific category
                    if (vm.categoryAccordion) {
                        vm.categoryAccordion.expand(categoryId);
                    } else {
                        // Fallback: manual expansion
                        vm.categorySessions.forEach(function(cat) {
                            cat.isCollapsed = true;
                            cat.isExpanded = false;
                        });
                        result.isCollapsed = false;
                        result.isExpanded = true;
                    }
                    
                    var titleElement = angular.element(document.getElementById("category-" + categoryId));
                    var offset = vm.isMobileBrowser ? 20 : 10;
                    var duration = vm.isMobileBrowser ? 800 : 500;
                    $document.scrollToElement(titleElement, offset, duration);
                }, vm.isMobileBrowser ? 1500 : 1000);
            }
        }

        // Cleanup on destroy
        $scope.$on('$destroy', function() {
            angular.element($window).off('orientationchange resize');
        });
    }
})();