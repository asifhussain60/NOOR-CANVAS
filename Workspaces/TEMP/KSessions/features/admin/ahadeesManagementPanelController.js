(function () {
    'use strict';

    angular
        .module('app')
        .controller('AhadeesManagementPanelController', AhadeesManagementPanelController);

    AhadeesManagementPanelController.$inject = ['common', 'datacontext', '$element', '$timeout'];

    function AhadeesManagementPanelController(common, datacontext, $element, $timeout) {
        var vm = this;
        
        // Core properties
        vm.isVisible = false; // Hidden by default - only show when explicitly requested
        vm.ahadeesList = [];
        vm.searchQuery = '';
        vm.isLoading = false;
        vm.activeFilter = '';
        vm.showAddForm = false; // Toggle between search mode and add form mode
        vm.newAhadees = getNewAhadees(); // Form data for new hadees
        
        // Methods
        vm.searchAhadees = searchAhadees;
        vm.filterByCategory = filterByCategory;
        vm.clearFilters = clearFilters;
        vm.insertHadees = insertHadees;
        vm.refreshAhadees = refreshAhadees;
        vm.close = close;
        vm.saveNewAhadees = saveNewAhadees;

        // Lifecycle hooks
        vm.$onInit = function() {
            console.log('🔧 DEBUG: $onInit() called - initializing ahadees panel');
            vm.timestamp = new Date().toLocaleTimeString();
            
            // Enhanced controller state logging
            console.log('🔧 DEBUG: Controller state in $onInit:', {
                isVisible: vm.isVisible,
                hasCloseMethod: typeof vm.close === 'function',
                hasSearchMethod: typeof vm.searchAhadees === 'function',
                hasRefreshMethod: typeof vm.refreshAhadees === 'function',
                hasInsertMethod: typeof vm.insertHadees === 'function',
                ahadeesList: vm.ahadeesList ? vm.ahadeesList.length : 'undefined',
                timestamp: vm.timestamp
            });
            
            // ...existing code...
        };

        vm.$onChanges = function(changes) {
            console.log('🔧 DEBUG: $onChanges() called with changes:', changes);
            console.log('🔧 DEBUG: isVisible changed:', changes.isVisible);
            console.log('🔧 DEBUG: current isVisible:', vm.isVisible);
            console.log('🔧 DEBUG: current ahadeesList length:', vm.ahadeesList && vm.ahadeesList.length || 0);
            
            // ...existing code...
        };

        // Core Functions
        function loadRecentAhadees() {
            vm.isLoading = true;
            console.log('🔧 DEBUG: loadRecentAhadees() called - starting data fetch');
            console.log('🔧 DEBUG: datacontext object:', datacontext);
            console.log('🔧 DEBUG: datacontext.getRecentAhadees function exists:', typeof datacontext.getRecentAhadees);
            
            if (!datacontext.getRecentAhadees) {
                console.error('🔧 ERROR: datacontext.getRecentAhadees method does not exist!');
                vm.ahadeesList = [];
                vm.isLoading = false;
                return Promise.reject('getRecentAhadees method not found');
            }
            
            return datacontext.getRecentAhadees()
                .then(function(response) {
                    console.log('🔧 DEBUG: datacontext.getRecentAhadees() SUCCESS');
                    console.log('🔧 DEBUG: Full response object:', response);
                    console.log('🔧 DEBUG: Response type:', typeof response);
                    console.log('🔧 DEBUG: Response.data exists:', !!(response && response.data));
                    console.log('🔧 DEBUG: Response.data type:', typeof (response && response.data));
                    console.log('🔧 DEBUG: Response.data length:', response && response.data && response.data.length);
                    
                    if (response && response.data) {
                        var ahadeesList = [];
                        
                        // Handle different API response formats
                        if (response.data.ahadeesList && Array.isArray(response.data.ahadeesList)) {
                            // API returns {ahadeesList: [...], totalCount: x}
                            ahadeesList = response.data.ahadeesList;
                            console.log('🔧 DEBUG: Using response.data.ahadeesList format');
                        } else if (Array.isArray(response.data)) {
                            // API returns direct array
                            ahadeesList = response.data;
                            console.log('🔧 DEBUG: Using direct array format');
                        } else {
                            console.error('🔧 ERROR: Unknown response format:', response.data);
                            ahadeesList = [];
                        }
                        
                        vm.ahadeesList = ahadeesList;
                        console.log('🔧 DEBUG: Successfully loaded', vm.ahadeesList.length, 'ahadees from database');
                        console.log('🔧 DEBUG: Sample ahadees data:', vm.ahadeesList.slice(0, 2));
                        
                        if (vm.ahadeesList.length > 0) {
                            common.logger.logSuccess('Loaded real ahadees data: ' + vm.ahadeesList.length);
                        } else {
                            console.warn('🔧 WARNING: Database returned empty array');
                            common.logger.logWarning('Database returned empty ahadees array');
                        }
                    } else {
                        console.error('🔧 ERROR: Invalid response structure:', response);
                        vm.ahadeesList = [];
                        common.logger.logError('Invalid response structure from server');
                    }
                })
                .catch(function(error) {
                    console.error('🔧 ERROR: Failed to load ahadees from database');
                    console.error('🔧 ERROR: Error object:', error);
                    console.error('🔧 ERROR: Error message:', error && error.message);
                    console.error('🔧 ERROR: Error status:', error && error.status);
                    console.error('🔧 ERROR: Error data:', error && error.data);
                    
                    // Fallback to demo data for better user experience
                    console.log('🔧 FALLBACK: Loading demo ahadees data');
                    vm.ahadeesList = getDemoAhadeesData();
                    common.logger.logWarning('Using demo ahadees data due to database connection issue');
                })
                .finally(function() {
                    vm.isLoading = false;
                    console.log('🔧 DEBUG: loadRecentAhadees() completed');
                    console.log('🔧 DEBUG: Final state - isLoading:', vm.isLoading);
                    console.log('🔧 DEBUG: Final state - ahadeesList.length:', vm.ahadeesList && vm.ahadeesList.length || 0);
                    console.log('🔧 DEBUG: Final state - ahadeesList sample:', vm.ahadeesList && vm.ahadeesList.slice(0, 1));
                });
        }

        function searchAhadees() {
            console.log('🔧 DEBUG: searchAhadees() called');
            console.log('🔧 DEBUG: searchQuery:', vm.searchQuery);
            console.log('🔧 DEBUG: searchQuery length:', vm.searchQuery && vm.searchQuery.length || 0);
            
            if (!vm.searchQuery || vm.searchQuery.length < 2) {
                console.log('🔧 DEBUG: Search query too short, not searching.');
                return;
            }

            // Ensure we have data to search
            console.log('🔧 DEBUG: Current ahadeesList state:');
            console.log('🔧 DEBUG: - ahadeesList exists:', !!vm.ahadeesList);
            console.log('🔧 DEBUG: - ahadeesList is array:', Array.isArray(vm.ahadeesList));
            console.log('🔧 DEBUG: - ahadeesList length:', vm.ahadeesList && vm.ahadeesList.length || 0);
            
            if (!vm.ahadeesList || !Array.isArray(vm.ahadeesList) || vm.ahadeesList.length === 0) {
                console.log('🔧 DEBUG: No data to search, not searching.');
                return;
            }

            performSearch();
        }

        function performSearch() {
            var allAhadees = vm.ahadeesList; // Search in current dataset
            var query = vm.searchQuery.toLowerCase();
            
            console.log('🔧 DEBUG: Starting search with query:', query);
            console.log('🔧 DEBUG: Searching through', allAhadees.length, 'ahadees');
            
            // Standard search functionality
            var filteredResults = allAhadees.filter(function(hadees) {
                // Search in English text
                var textMatch = hadees.text && hadees.text.toLowerCase().includes(query);
                
                // Search in reference
                var referenceMatch = hadees.reference && hadees.reference.toLowerCase().includes(query);
                
                // Search in category
                var categoryMatch = hadees.category && hadees.category.toLowerCase().includes(query);
                
                // Search in topic if available
                var topicMatch = hadees.topic && hadees.topic.toLowerCase().includes(query);
                
                // Search in Arabic text if available
                var arabicMatch = hadees.arabicText && hadees.arabicText.includes(query);
                
                var isMatch = textMatch || referenceMatch || categoryMatch || topicMatch || arabicMatch;
                
                if (isMatch) {
                    console.log('🔧 DEBUG: Match found:', {
                        reference: hadees.reference,
                        textMatch: textMatch,
                        referenceMatch: referenceMatch,
                        categoryMatch: categoryMatch,
                        topicMatch: topicMatch,
                        arabicMatch: arabicMatch
                    });
                }
                
                return isMatch;
            });
            
            console.log('🔧 DEBUG: Search completed. Found', filteredResults.length, 'results');
            console.log('🔧 DEBUG: Sample results:', filteredResults.slice(0, 2));
            
            vm.ahadeesList = filteredResults;
        }

        function filterByCategory(category) {
            console.log('🔧 DEBUG: filterByCategory() called with category:', category);
            vm.activeFilter = category;
            vm.searchQuery = '';
            
            // Use current ahadees list for filtering
            console.log('🔧 DEBUG: Current ahadeesList for filtering:');
            console.log('🔧 DEBUG: - exists:', !!vm.ahadeesList);
            console.log('🔧 DEBUG: - length:', vm.ahadeesList && vm.ahadeesList.length || 0);
            
            if (!vm.ahadeesList || vm.ahadeesList.length === 0) {
                console.log('🔧 DEBUG: No data for filtering, not filtering.');
                return;
            }
            
            performCategoryFilter(category);
        }
        
        function performCategoryFilter(category) {
            console.log('🔧 DEBUG: performCategoryFilter() called with category:', category);
            console.log('🔧 DEBUG: Available ahadees before filtering:', vm.ahadeesList.length);
            
            if (category && vm.ahadeesList && Array.isArray(vm.ahadeesList)) {
                var originalList = vm.ahadeesList.slice(); // Keep original for debugging
                
                vm.ahadeesList = originalList.filter(function(hadees) {
                    var categoryMatch = hadees.category && hadees.category.toLowerCase().includes(category.toLowerCase());
                    
                    if (categoryMatch) {
                        console.log('🔧 DEBUG: Category match found:', {
                            reference: hadees.reference,
                            category: hadees.category
                        });
                    }
                    
                    return categoryMatch;
                });
                
                console.log('🔧 DEBUG: Category filter completed. Results:', vm.ahadeesList.length);
                console.log('🔧 DEBUG: Sample filtered results:', vm.ahadeesList.slice(0, 2));
            } else {
                console.log('🔧 DEBUG: No category filter applied or invalid data');
            }
        }

        function clearFilters() {
            console.log('🔧 DEBUG: clearFilters() called');
            vm.activeFilter = '';
            vm.searchQuery = '';
            console.log('🔧 DEBUG: Filters cleared.');
        }

        function insertHadees(hadees) {
            console.log('🔥 [AHADEES-INSERT] Starting insertion process', {
                hadees: hadees,
                timestamp: new Date().toISOString()
            });
            
            // Hide panel immediately when insert is clicked
            if (vm.onClose) {
                console.log('🔥 [AHADEES-INSERT] Closing panel via onClose callback');
                vm.onClose();
            }
            
            // Use a short delay to allow panel to close and editor to focus
            $timeout(function() {
                console.log('🔥 [AHADEES-INSERT] Starting delayed insertion process');
                
                // Retry insertion with progressive delays
                var maxRetries = 3;
                var retryDelay = 200;
                
                function attemptInsertion(attempt) {
                    console.log('🔥 [AHADEES-INSERT] Attempt #' + (attempt + 1) + ' of ' + maxRetries);
                    
                    try {
                        var froalaEditor = getParentFroalaEditor();
                        console.log('🔥 [AHADEES-INSERT] Froala editor obtained:', {
                            exists: !!froalaEditor,
                            hasHtml: !!(froalaEditor && froalaEditor.html),
                            hasInsert: !!(froalaEditor && froalaEditor.html && froalaEditor.html.insert),
                            hasSelection: !!(froalaEditor && froalaEditor.selection),
                            hasEvents: !!(froalaEditor && froalaEditor.events)
                        });
                        
                        if (froalaEditor && froalaEditor.html && froalaEditor.html.insert) {
                            // Check current cursor position BEFORE insertion
                            var cursorInfo = getCursorInfo(froalaEditor);
                            console.log('🔥 [AHADEES-INSERT] Cursor info before insertion:', cursorInfo);
                            
                            // Format the hadees for insertion
                            var formattedHadees = formatHadeesForEditor(hadees);
                            console.log('🔥 [AHADEES-INSERT] Formatted hadees HTML:', {
                                length: formattedHadees.length,
                                preview: formattedHadees.substring(0, 200) + '...'
                            });
                            
                            // Focus the editor first and log focus attempt
                            if (froalaEditor.events && froalaEditor.events.focus) {
                                try {
                                    console.log('🔥 [AHADEES-INSERT] Attempting to focus editor');
                                    froalaEditor.events.focus();
                                    console.log('🔥 [AHADEES-INSERT] Editor focus successful');
                                } catch (focusError) {
                                    console.error('🔥 [AHADEES-INSERT] Editor focus failed:', focusError);
                                }
                            }
                            
                            // Small delay after focus to ensure cursor is positioned
                            $timeout(function() {
                                try {
                                    // Check cursor position AFTER focus
                                    var cursorInfoAfterFocus = getCursorInfo(froalaEditor);
                                    console.log('🔥 [AHADEES-INSERT] Cursor info after focus:', cursorInfoAfterFocus);
                                    
                                    // Log current editor content before insertion
                                    var editorContentBefore = froalaEditor.html.get();
                                    console.log('🔥 [AHADEES-INSERT] Editor content before insertion:', {
                                        length: editorContentBefore.length,
                                        preview: editorContentBefore.substring(0, 300) + '...'
                                    });
                                    
                                    // Insert content at cursor position using Froala's proper method
                                    console.log('🔥 [AHADEES-INSERT] Calling froalaEditor.html.insert() with cleanOnPaste=true');
                                    froalaEditor.html.insert(formattedHadees, true);
                                    
                                    // Log editor content after insertion
                                    var editorContentAfter = froalaEditor.html.get();
                                    console.log('🔥 [AHADEES-INSERT] Editor content after insertion:', {
                                        length: editorContentAfter.length,
                                        preview: editorContentAfter.substring(0, 300) + '...',
                                        lengthDifference: editorContentAfter.length - editorContentBefore.length
                                    });
                                    
                                    // Check if content was actually inserted at the right place
                                    var insertionSuccessful = editorContentAfter.includes('hadees-block');
                                    console.log('🔥 [AHADEES-INSERT] Insertion verification:', {
                                        successful: insertionSuccessful,
                                        contentChanged: editorContentAfter !== editorContentBefore
                                    });
                                    
                                    // Check final cursor position
                                    var cursorInfoAfterInsert = getCursorInfo(froalaEditor);
                                    console.log('🔥 [AHADEES-INSERT] Cursor info after insertion:', cursorInfoAfterInsert);
                                    
                                    // Show success feedback
                                    if (window.toastr) {
                                        window.toastr.success('Hadees inserted at cursor position!', '', {
                                            timeOut: 2000,
                                            positionClass: 'toast-top-right'
                                        });
                                    }
                                    
                                    console.log('🔥 [AHADEES-INSERT] ✅ Insertion completed successfully');
                                    return true;
                                } catch (insertError) {
                                    console.error('🔥 [AHADEES-INSERT] ❌ Insertion error:', insertError);
                                    throw insertError;
                                }
                            }, 50);
                            
                        } else {
                            console.warn('🔥 [AHADEES-INSERT] Froala editor not properly available for attempt #' + (attempt + 1));
                            
                            if (attempt < maxRetries - 1) {
                                // Retry with progressive delay
                                var nextDelay = retryDelay * Math.pow(1.5, attempt);
                                console.log('🔥 [AHADEES-INSERT] Retrying in ' + nextDelay + 'ms');
                                
                                $timeout(function() {
                                    attemptInsertion(attempt + 1);
                                }, nextDelay);
                            } else {
                                console.error('🔥 [AHADEES-INSERT] ❌ All attempts failed - could not access Froala editor');
                                if (window.toastr) {
                                    window.toastr.error('Could not insert hadees. Please try clicking in the editor first.', '', {
                                        timeOut: 3000,
                                        positionClass: 'toast-top-right'
                                    });
                                }
                            }
                        }
                    } catch (error) {
                        console.error('🔥 [AHADEES-INSERT] ❌ Attempt #' + (attempt + 1) + ' failed with error:', error);
                        
                        if (attempt < maxRetries - 1) {
                            var nextDelay = retryDelay * Math.pow(1.5, attempt);
                            console.log('🔥 [AHADEES-INSERT] Retrying after error in ' + nextDelay + 'ms');
                            
                            $timeout(function() {
                                attemptInsertion(attempt + 1);
                            }, nextDelay);
                        } else {
                            console.error('🔥 [AHADEES-INSERT] ❌ All attempts failed with errors');
                            if (window.toastr) {
                                window.toastr.error('Error inserting hadees. Please try again.', '', {
                                    timeOut: 3000,
                                    positionClass: 'toast-top-right'
                                });
                            }
                        }
                    }
                    
                    return false;
                }
                
                // Start the insertion process
                console.log('🔥 [AHADEES-INSERT] Starting insertion attempt cycle');
                attemptInsertion(0);
            }, 100);
        }

        function refreshAhadees() {
            console.log('🔧 DEBUG: refreshAhadees() called');
            vm.searchQuery = '';
            vm.activeFilter = '';
            console.log('🔧 DEBUG: Refreshing ahadees data');
            loadRecentAhadees();
        }

        function close() {
            vm.isVisible = false; // Hide the panel
            if (vm.onClose) {
                vm.onClose();
            }
        }

        // Helper Functions
        function getParentFroalaEditor() {
            console.log('🔧 [EDITOR-DETECTION] Starting Froala editor detection');
            
            // Method 1: Try to get from parent scope (most reliable)
            try {
                console.log('🔧 [EDITOR-DETECTION] Method 1: Trying parent scope detection');
                var parentScope = $element.parents('[ng-controller*="adminSessionTranscript"]').scope();
                console.log('🔧 [EDITOR-DETECTION] Parent scope found:', !!parentScope);
                
                if (parentScope && parentScope.vm && parentScope.vm.fEditor) {
                    console.log('🔧 [EDITOR-DETECTION] Parent scope editor found:', {
                        hasHtml: !!parentScope.vm.fEditor.html,
                        hasInsert: !!(parentScope.vm.fEditor.html && parentScope.vm.fEditor.html.insert),
                        hasSelection: !!parentScope.vm.fEditor.selection,
                        hasEvents: !!parentScope.vm.fEditor.events
                    });
                    
                    // Verify the editor is properly initialized
                    if (parentScope.vm.fEditor.html && parentScope.vm.fEditor.html.insert) {
                        console.log('🔧 [EDITOR-DETECTION] ✅ Method 1 successful - returning parent scope editor');
                        return parentScope.vm.fEditor;
                    } else {
                        console.log('🔧 [EDITOR-DETECTION] ❌ Method 1 failed - editor not fully initialized');
                    }
                } else {
                    console.log('🔧 [EDITOR-DETECTION] ❌ Method 1 failed - no editor in parent scope');
                }
            } catch (e) {
                console.error('🔧 [EDITOR-DETECTION] ❌ Method 1 exception:', e);
            }
            
            // Method 2: Try to get from global angular scope
            try {
                console.log('🔧 [EDITOR-DETECTION] Method 2: Trying global angular scope detection');
                if (window.angular) {
                    var adminElement = angular.element('[ng-controller*="adminSessionTranscript"]');
                    console.log('🔧 [EDITOR-DETECTION] Admin element found:', adminElement.length > 0);
                    
                    if (adminElement.length > 0) {
                        var adminScope = adminElement.scope();
                        console.log('🔧 [EDITOR-DETECTION] Admin scope found:', !!adminScope);
                        
                        if (adminScope && adminScope.vm && adminScope.vm.fEditor) {
                            console.log('🔧 [EDITOR-DETECTION] Global scope editor found:', {
                                hasHtml: !!adminScope.vm.fEditor.html,
                                hasInsert: !!(adminScope.vm.fEditor.html && adminScope.vm.fEditor.html.insert),
                                hasSelection: !!adminScope.vm.fEditor.selection,
                                hasEvents: !!adminScope.vm.fEditor.events
                            });
                            
                            if (adminScope.vm.fEditor.html && adminScope.vm.fEditor.html.insert) {
                                console.log('🔧 [EDITOR-DETECTION] ✅ Method 2 successful - returning global scope editor');
                                return adminScope.vm.fEditor;
                            } else {
                                console.log('🔧 [EDITOR-DETECTION] ❌ Method 2 failed - editor not fully initialized');
                            }
                        } else {
                            console.log('🔧 [EDITOR-DETECTION] ❌ Method 2 failed - no editor in admin scope');
                        }
                    }
                } else {
                    console.log('🔧 [EDITOR-DETECTION] ❌ Method 2 failed - Angular not available globally');
                }
            } catch (e) {
                console.error('🔧 [EDITOR-DETECTION] ❌ Method 2 exception:', e);
            }
            
            // Method 3: Direct jQuery approach with proper validation
            if (window.$ && window.jQuery) {
                try {
                    console.log('🔧 [EDITOR-DETECTION] Method 3: Trying jQuery direct detection');
                    
                    // Find the textarea with froala attribute
                    var $textarea = $('textarea[froala]');
                    console.log('🔧 [EDITOR-DETECTION] Froala textareas found:', $textarea.length);
                    
                    if ($textarea.length > 0) {
                        var froalaInstance = $textarea.data('froala.editor');
                        console.log('🔧 [EDITOR-DETECTION] Froala instance from textarea:', {
                            exists: !!froalaInstance,
                            hasHtml: !!(froalaInstance && froalaInstance.html),
                            hasInsert: !!(froalaInstance && froalaInstance.html && froalaInstance.html.insert)
                        });
                        
                        if (froalaInstance && froalaInstance.html && froalaInstance.html.insert) {
                            console.log('🔧 [EDITOR-DETECTION] ✅ Method 3a successful - returning textarea editor instance');
                            return froalaInstance;
                        }
                    }
                    
                    // Try to find the editor through the editable element
                    var $editableElement = $('.fr-element[contenteditable="true"]');
                    console.log('🔧 [EDITOR-DETECTION] Froala editable elements found:', $editableElement.length);
                    
                    if ($editableElement.length > 0) {
                        // Find the associated textarea
                        var $container = $editableElement.closest('.fr-wrapper, .fr-box').parent();
                        var $associatedTextarea = $container.find('textarea[froala]');
                        console.log('🔧 [EDITOR-DETECTION] Associated textareas found:', $associatedTextarea.length);
                        
                        if ($associatedTextarea.length > 0) {
                            var editorInstance = $associatedTextarea.data('froala.editor');
                            console.log('🔧 [EDITOR-DETECTION] Editor instance from associated textarea:', {
                                exists: !!editorInstance,
                                hasHtml: !!(editorInstance && editorInstance.html),
                                hasInsert: !!(editorInstance && editorInstance.html && editorInstance.html.insert)
                            });
                            
                            if (editorInstance && editorInstance.html && editorInstance.html.insert) {
                                console.log('🔧 [EDITOR-DETECTION] ✅ Method 3b successful - returning associated editor instance');
                                return editorInstance;
                            }
                        }
                    }
                } catch (e) {
                    console.error('🔧 [EDITOR-DETECTION] ❌ Method 3 exception:', e);
                }
            } else {
                console.log('🔧 [EDITOR-DETECTION] ❌ Method 3 failed - jQuery not available');
            }
            
            // Method 4: Direct DOM manipulation as fallback
            try {
                var editableElements = document.querySelectorAll('.fr-element[contenteditable="true"]');
                
                if (editableElements.length > 0) {
                    var editableElement = editableElements[0];
                    
                    // Return a DOM manipulation wrapper
                    console.log('🔧 [EDITOR-DETECTION] ✅ Method 4 successful - returning DOM wrapper');
                    return {
                        html: {
                            insert: function(content, atCursor) {
                                console.log('🔧 [DOM-INSERT] Starting DOM insertion fallback', {
                                    contentLength: content.length,
                                    atCursor: atCursor
                                });
                                
                                // Focus the element first
                                editableElement.focus();
                                console.log('🔧 [DOM-INSERT] Element focused');
                                
                                try {
                                    // Get current selection and cursor position
                                    var selection = window.getSelection();
                                    var range;
                                    
                                    console.log('🔧 [DOM-INSERT] Current selection:', {
                                        rangeCount: selection.rangeCount,
                                        isCollapsed: selection.isCollapsed,
                                        selectedText: selection.toString()
                                    });
                                    
                                    if (selection.rangeCount > 0) {
                                        range = selection.getRangeAt(0);
                                        console.log('🔧 [DOM-INSERT] Using existing range:', {
                                            startContainer: range.startContainer.nodeName,
                                            startOffset: range.startOffset,
                                            endContainer: range.endContainer.nodeName,
                                            endOffset: range.endOffset,
                                            collapsed: range.collapsed
                                        });
                                    } else {
                                        // Create a range at the end of the element if no selection
                                        range = document.createRange();
                                        range.selectNodeContents(editableElement);
                                        range.collapse(false); // Collapse to end
                                        console.log('🔧 [DOM-INSERT] Created new range at end of element');
                                    }
                                    
                                    // Delete any existing content in the range
                                    range.deleteContents();
                                    console.log('🔧 [DOM-INSERT] Deleted existing range contents');
                                    
                                    // Create a document fragment to hold the HTML content
                                    var fragment = document.createDocumentFragment();
                                    var tempDiv = document.createElement('div');
                                    tempDiv.innerHTML = content;
                                    
                                    console.log('🔧 [DOM-INSERT] Created fragment with content:', {
                                        tempDivChildCount: tempDiv.children.length,
                                        tempDivHTML: tempDiv.innerHTML.substring(0, 200) + '...'
                                    });
                                    
                                    // Move all child nodes to the fragment
                                    while (tempDiv.firstChild) {
                                        fragment.appendChild(tempDiv.firstChild);
                                    }
                                    
                                    console.log('🔧 [DOM-INSERT] Fragment created, inserting at range');
                                    
                                    // Insert the fragment at the cursor position
                                    range.insertNode(fragment);
                                    
                                    // Move cursor to end of inserted content
                                    range.collapse(false);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                    
                                    // Trigger change event for Froala
                                    var event = new Event('input', { bubbles: true });
                                    editableElement.dispatchEvent(event);
                                    
                                    console.log('🔧 [DOM-INSERT] ✅ DOM insertion completed successfully');
                                } catch (domError) {
                                    console.error('🔧 [DOM-INSERT] ❌ DOM insertion error:', domError);
                                    // Fallback: append to end
                                    editableElement.innerHTML += content;
                                }
                            },
                            get: function() {
                                console.log('🔧 [DOM-GET] Getting HTML content from DOM element');
                                return editableElement.innerHTML;
                            }
                        },
                        selection: {
                            inEditor: function() {
                                return document.activeElement === editableElement;
                            }
                        },
                        events: {
                            focus: function() {
                                editableElement.focus();
                            }
                        },
                        $el: [editableElement]
                    };
                }
            } catch (e) {
                // Silent fail
            }
            
            return null;
        }

        function formatHadeesForEditor(hadees) {
            // Enhanced formatting with beautiful Arabic typography and English translation
            var formattedText = '<div class="hadees-block" style="margin: 20px 0; padding: 20px; border-left: 5px solid #1976d2; background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%); border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">';
            
            // Add reference header with icon
            if (hadees.reference) {
                formattedText += '<div style="font-weight: bold; color: #1976d2; margin-bottom: 12px; font-size: 15px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">';
                formattedText += '📚 <strong>' + hadees.reference + '</strong>';
                formattedText += '</div>';
            }
            
            // Add Arabic text with enhanced typography
            if (hadees.arabicText) {
                formattedText += '<div style="margin-bottom: 15px; padding: 15px; background-color: #ffffff; border-radius: 6px; border-right: 4px solid #1976d2; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);">';
                
                // Arabic text with proper RTL styling
                formattedText += '<div style="font-family: \'Arabic Typesetting\', \'Traditional Arabic\', \'Amiri\', \'Scheherazade\', serif; font-size: 22px; line-height: 2.2; text-align: right; color: #1a237e; margin-bottom: 10px; font-weight: 500; direction: rtl;">';
                formattedText += hadees.arabicText;
                formattedText += '</div>';
                
                // Add transliteration with better styling
                if (hadees.transliteration) {
                    formattedText += '<div style="font-style: italic; font-size: 13px; color: #757575; text-align: left; margin-top: 8px; padding-top: 8px; border-top: 1px dotted #e0e0e0;">';
                    formattedText += '<span style="color: #666; font-weight: 500;">Transliteration:</span> <em>' + hadees.transliteration + '</em>';
                    formattedText += '</div>';
                }
                formattedText += '</div>';
            }
            
            // Add English translation with enhanced formatting
            if (hadees.text) {
                formattedText += '<div style="margin-bottom: 15px; padding: 15px; background-color: #fafafa; border-radius: 6px; border-left: 4px solid #4caf50;">';
                formattedText += '<div style="font-size: 16px; line-height: 1.8; color: #2e7d32; font-family: \'Georgia\', \'Times New Roman\', serif; font-style: italic;">';
                formattedText += '"' + hadees.text + '"';
                formattedText += '</div>';
                formattedText += '</div>';
            }
            
            // Add category and topic tags with improved styling
            if (hadees.category || hadees.topic) {
                formattedText += '<div style="margin-top: 12px; text-align: center;">';
                
                if (hadees.category) {
                    formattedText += '<span style="background: linear-gradient(45deg, #1976d2, #42a5f5); color: white; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 600; margin-right: 8px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(25,118,210,0.3);">';
                    formattedText += hadees.category.charAt(0).toUpperCase() + hadees.category.slice(1);
                    formattedText += '</span>';
                }
                
                if (hadees.topic) {
                    formattedText += '<span style="background: linear-gradient(45deg, #6a1b9a, #ba68c8); color: white; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 600; text-transform: capitalize; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(106,27,154,0.3);">';
                    formattedText += hadees.topic;
                    formattedText += '</span>';
                }
                
                formattedText += '</div>';
            }
            
            // Add footer with insertion timestamp
            formattedText += '<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #e0e0e0; text-align: right;">';
            formattedText += '<small style="color: #9e9e9e; font-size: 11px;">Inserted via Ahadees Manager • ' + new Date().toLocaleDateString() + '</small>';
            formattedText += '</div>';
            
            formattedText += '</div><br>';
            
            return formattedText;
        }

        function getCursorInfo(froalaEditor) {
            try {
                var cursorInfo = {
                    timestamp: new Date().toISOString(),
                    editorActive: false,
                    selection: null,
                    range: null,
                    cursorPosition: null,
                    selectedText: '',
                    editorContent: '',
                    editorContentLength: 0,
                    elementInfo: null
                };

                // Check if editor is active/focused
                if (froalaEditor.selection) {
                    cursorInfo.editorActive = froalaEditor.selection.inEditor();
                    
                    // Get selection information
                    if (froalaEditor.selection.get) {
                        cursorInfo.selection = froalaEditor.selection.get();
                        if (cursorInfo.selection) {
                            cursorInfo.selectedText = cursorInfo.selection.toString();
                        }
                    }
                    
                    // Get range information
                    if (froalaEditor.selection.ranges) {
                        var ranges = froalaEditor.selection.ranges();
                        if (ranges && ranges.length > 0) {
                            var range = ranges[0];
                            cursorInfo.range = {
                                startContainer: range.startContainer ? range.startContainer.nodeName : null,
                                endContainer: range.endContainer ? range.endContainer.nodeName : null,
                                startOffset: range.startOffset,
                                endOffset: range.endOffset,
                                collapsed: range.collapsed
                            };
                        }
                    }
                    
                    // Get cursor position if available
                    if (froalaEditor.selection.position) {
                        cursorInfo.cursorPosition = froalaEditor.selection.position();
                    }
                }

                // Get editor content
                if (froalaEditor.html && froalaEditor.html.get) {
                    cursorInfo.editorContent = froalaEditor.html.get();
                    cursorInfo.editorContentLength = cursorInfo.editorContent.length;
                }

                // Get element information
                if (froalaEditor.$el && froalaEditor.$el.length > 0) {
                    var $el = froalaEditor.$el[0];
                    cursorInfo.elementInfo = {
                        tagName: $el.tagName,
                        id: $el.id,
                        className: $el.className,
                        contentEditable: $el.contentEditable,
                        hasFocus: $el === document.activeElement
                    };
                }

                // Try to get DOM-level selection information as fallback
                if (window.getSelection) {
                    var domSelection = window.getSelection();
                    cursorInfo.domSelection = {
                        rangeCount: domSelection.rangeCount,
                        anchorNode: domSelection.anchorNode ? domSelection.anchorNode.nodeName : null,
                        focusNode: domSelection.focusNode ? domSelection.focusNode.nodeName : null,
                        anchorOffset: domSelection.anchorOffset,
                        focusOffset: domSelection.focusOffset,
                        isCollapsed: domSelection.isCollapsed,
                        selectedText: domSelection.toString()
                    };
                }

                return cursorInfo;
            } catch (error) {
                return {
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        }

        // Demo data function for fallback when database is unavailable
        function getDemoAhadeesData() {
            return [
                {
                    ahadeesId: 1,
                    reference: "Sahih Bukhari 6018",
                    text: "The Prophet (ﷺ) said, 'Allah does not look at your forms and possessions but He looks at your hearts and deeds.'",
                    arabicText: "قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم إِنَّ اللَّهَ لاَ يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ",
                    category: "bukhari",
                    topic: "Heart and Intention",
                    narrator: "Sahih Bukhari"
                },
                {
                    ahadeesId: 2,
                    reference: "Sahih Muslim 2564",
                    text: "The believer is not one who eats his fill while his neighbor goes hungry.",
                    arabicText: "لَيْسَ الْمُؤْمِنُ الَّذِي يَشْبَعُ وَجَارُهُ جَائِعٌ إِلَى جَنْبِهِ",
                    category: "muslim",
                    topic: "Compassion and Neighbors",
                    narrator: "Sahih Muslim"
                },
                {
                    ahadeesId: 3,
                    reference: "Jami at-Tirmidhi 1924",
                    text: "Whoever believes in Allah and the Last Day should speak good or keep silent.",
                    arabicText: "مَن كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
                    category: "tirmidhi",
                    topic: "Speech and Conduct",
                    narrator: "Jami at-Tirmidhi"
                },
                {
                    ahadeesId: 4,
                    reference: "Sahih Bukhari 6133",
                    text: "The most beloved of people to Allah are those who are most beneficial to people.",
                    arabicText: "أَحَبُّ النَّاسِ إِلَى اللَّهِ أَنْفَعُهُمْ لِلنَّاسِ",
                    category: "bukhari",
                    topic: "Service to Humanity",
                    narrator: "Sahih Bukhari"
                },
                {
                    ahadeesId: 5,
                    reference: "Sahih Muslim 2699",
                    text: "A good word is charity.",
                    arabicText: "الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ",
                    category: "muslim",
                    topic: "Charity and Kindness",
                    narrator: "Sahih Muslim"
                },
                {
                    ahadeesId: 6,
                    reference: "Jami at-Tirmidhi 2002",
                    text: "The best of people are those who benefit others.",
                    arabicText: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ",
                    category: "tirmidhi",
                    topic: "Excellence in Character",
                    narrator: "Jami at-Tirmidhi"
                }
            ];
        }
        
        // Helper function to create new hadees object
        function getNewAhadees() {
            return {
                ahadeesId: 0,
                narrator: "",
                subject: "",
                ahadeesArabic: "",
                ahadeesEnglish: "",
                reference: ""
            };
        }
        
        // Save new hadees and insert into editor
        function saveNewAhadees() {
            console.log('🔧 [PANEL-SAVE] Starting saveNewAhadees');
            
            // Basic validation
            if (!vm.newAhadees.narrator || !vm.newAhadees.ahadeesArabic || !vm.newAhadees.ahadeesEnglish) {
                console.error('❌ [PANEL-SAVE] Validation failed - missing required fields');
                return;
            }
            
            console.log('✅ [PANEL-SAVE] Validation passed, proceeding with save');
            
            // Prepare data for save (same format as main admin form)
            var ahadeesData = {
                ahadeesId: 0,
                subject: vm.newAhadees.subject || "",
                ahadeesArabic: vm.newAhadees.ahadeesArabic,
                ahadeesEnglish: vm.newAhadees.ahadeesEnglish,
                narratorName: vm.newAhadees.narrator,
                reference: vm.newAhadees.reference || "",
                categoryId: 1,
                createdBy: 'PANEL_FORM'
            };
            
            console.log('🔧 [PANEL-SAVE] Prepared ahadeesData:', ahadeesData);
            
            // Save using existing datacontext service
            var savePromise = datacontext.saveAhadeesNew ? 
                datacontext.saveAhadeesNew(ahadeesData) : 
                datacontext.saveAhadees(ahadeesData);
                
            savePromise.then(function(response) {
                console.log('✅ [PANEL-SAVE] Save successful:', response);
                var savedAhadees = response.data || response;
                
                // Close panel and insert into editor
                vm.isVisible = false;
                
                // Create formatted hadees for insertion
                var formattedHadees = {
                    ahadeesId: savedAhadees.ahadeesId,
                    narrator: vm.newAhadees.narrator,
                    subject: vm.newAhadees.subject,
                    ahadeesArabic: vm.newAhadees.ahadeesArabic,
                    ahadeesEnglish: vm.newAhadees.ahadeesEnglish,
                    reference: vm.newAhadees.reference
                };
                
                // Insert into Froala editor (reuse existing insertion logic)
                vm.insertHadees(formattedHadees);
                
                // Reset form
                vm.newAhadees = getNewAhadees();
                vm.showAddForm = false;
                
                console.log('✅ [PANEL-SAVE] Hadees saved and inserted successfully');
                
            }).catch(function(error) {
                console.error('❌ [PANEL-SAVE] Save failed:', error);
                // Keep form open on error so user can try again
            });
        }
    }
})();
