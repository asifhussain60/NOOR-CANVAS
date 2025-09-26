(function () {
    'use strict';

    var serviceId = 'accordionService';
    angular.module('app').factory(serviceId, ['$timeout', accordionService]);

    function accordionService($timeout) {
        var service = {
            // Public methods
            createAccordion: createAccordion,
            toggleItem: toggleItem,
            expandItem: expandItem,
            collapseItem: collapseItem,
            collapseAll: collapseAll,
            expandAll: expandAll,
            getExpandedItems: getExpandedItems,
            setInitialExpanded: setInitialExpanded
        };

        return service;

        /**
         * Creates a new accordion instance
         * @param {Object} options - Configuration options
         * @param {boolean} options.allowMultiple - Whether multiple items can be expanded at once
         * @param {boolean} options.expandFirst - Whether to expand the first item by default
         * @param {function} options.onExpand - Callback when an item is expanded
         * @param {function} options.onCollapse - Callback when an item is collapsed
         * @returns {Object} - Accordion instance with methods and state
         */
        function createAccordion(options) {
            options = options || {};
            
            var accordion = {
                // Configuration
                allowMultiple: options.allowMultiple !== false, // Default to true
                expandFirst: options.expandFirst !== false, // Default to true
                onExpand: options.onExpand || angular.noop,
                onCollapse: options.onCollapse || angular.noop,
                
                // State
                items: [],
                expandedItems: [],
                
                // Methods
                addItem: addItem,
                toggle: toggle,
                expand: expand,
                collapse: collapse,
                collapseAll: collapseAllItems,
                expandAll: expandAllItems,
                getExpanded: getExpanded,
                setItems: setItems
            };

            return accordion;

            function addItem(item) {
                if (!item.id) {
                    console.warn('AccordionService: Item must have an id property');
                    return;
                }
                
                // Initialize item state
                item.isExpanded = item.isExpanded || false;
                item.isCollapsed = item.isCollapsed !== false; // Default to collapsed
                
                accordion.items.push(item);
                
                // Auto-expand first item if configured
                if (accordion.expandFirst && accordion.items.length === 1 && accordion.expandedItems.length === 0) {
                    $timeout(function() {
                        accordion.expand(item.id);
                    }, 0);
                }
            }

            function setItems(items) {
                accordion.items = [];
                accordion.expandedItems = [];
                
                if (items && items.length) {
                    items.forEach(function(item, index) {
                        // Initialize state for each item
                        item.isExpanded = false;
                        item.isCollapsed = true;
                        accordion.addItem(item);
                    });
                }
            }

            function toggle(itemId) {
                var item = findItemById(itemId);
                if (!item) return;

                if (item.isExpanded) {
                    accordion.collapse(itemId);
                } else {
                    accordion.expand(itemId);
                }
            }

            function expand(itemId) {
                var item = findItemById(itemId);
                if (!item || item.isExpanded) return;

                // If not allowing multiple, collapse all others first
                if (!accordion.allowMultiple) {
                    accordion.collapseAll();
                }

                // Expand the item
                item.isExpanded = true;
                item.isCollapsed = false;
                
                // Track expanded items
                if (accordion.expandedItems.indexOf(itemId) === -1) {
                    accordion.expandedItems.push(itemId);
                }

                // Call callback
                accordion.onExpand(item, itemId);
            }

            function collapse(itemId) {
                var item = findItemById(itemId);
                if (!item || !item.isExpanded) return;

                // Collapse the item
                item.isExpanded = false;
                item.isCollapsed = true;

                // Remove from expanded items
                var index = accordion.expandedItems.indexOf(itemId);
                if (index > -1) {
                    accordion.expandedItems.splice(index, 1);
                }

                // Call callback
                accordion.onCollapse(item, itemId);
            }

            function collapseAllItems() {
                accordion.items.forEach(function(item) {
                    if (item.isExpanded) {
                        accordion.collapse(item.id);
                    }
                });
            }

            function expandAllItems() {
                if (!accordion.allowMultiple) {
                    console.warn('AccordionService: Cannot expand all items when allowMultiple is false');
                    return;
                }

                accordion.items.forEach(function(item) {
                    if (!item.isExpanded) {
                        accordion.expand(item.id);
                    }
                });
            }

            function getExpanded() {
                return accordion.expandedItems.slice(); // Return copy of array
            }

            function findItemById(itemId) {
                return accordion.items.find(function(item) {
                    return item.id === itemId;
                });
            }
        }

        // Static utility methods
        function toggleItem(items, itemId, allowMultiple) {
            if (!items || !itemId) return;
            
            var item = items.find(function(i) { return i.id === itemId; });
            if (!item) return;

            // If not allowing multiple, collapse others first
            if (!allowMultiple) {
                items.forEach(function(i) {
                    if (i.id !== itemId) {
                        i.isExpanded = false;
                        i.isCollapsed = true;
                    }
                });
            }

            // Toggle the clicked item
            item.isExpanded = !item.isExpanded;
            item.isCollapsed = !item.isCollapsed;
        }

        function expandItem(items, itemId, allowMultiple) {
            if (!items || !itemId) return;
            
            var item = items.find(function(i) { return i.id === itemId; });
            if (!item || item.isExpanded) return;

            // If not allowing multiple, collapse others first
            if (!allowMultiple) {
                collapseAll(items);
            }

            item.isExpanded = true;
            item.isCollapsed = false;
        }

        function collapseItem(items, itemId) {
            if (!items || !itemId) return;
            
            var item = items.find(function(i) { return i.id === itemId; });
            if (!item || !item.isExpanded) return;

            item.isExpanded = false;
            item.isCollapsed = true;
        }

        function collapseAll(items) {
            if (!items) return;
            
            items.forEach(function(item) {
                item.isExpanded = false;
                item.isCollapsed = true;
            });
        }

        function expandAll(items) {
            if (!items) return;
            
            items.forEach(function(item) {
                item.isExpanded = true;
                item.isCollapsed = false;
            });
        }

        function getExpandedItems(items) {
            if (!items) return [];
            
            return items.filter(function(item) {
                return item.isExpanded;
            });
        }

        function setInitialExpanded(items, expandFirst) {
            if (!items || !items.length) return;
            
            // Initialize all items as collapsed
            collapseAll(items);
            
            // Expand first item if requested
            if (expandFirst !== false && items.length > 0) {
                expandItem(items, items[0].id, false);
            }
        }
    }
})();