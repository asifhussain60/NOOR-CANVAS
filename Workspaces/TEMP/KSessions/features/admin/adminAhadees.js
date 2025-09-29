(function () {
    "use strict";
    var controllerId = "adminAhadeesCtl";
    angular.module("app").controller(controllerId,
    ["$scope", "bootstrap.dialog", "common", "config", "datacontext", "quranService", adminAhadeesCtl]);

    function adminAhadeesCtl($scope, dlg, common, config, datacontext, quranService) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;
        $scope.qs = quranService; var qs = $scope.qs;

        //Properties
        vm.fAhadees = getNewAhadees();
        vm.mode = "";
        vm.ahadeesSearch = newSearchCriteria();
        vm.result = [];
        vm.viewReady = false;
        vm.searchPerformed = false;
        vm.searchTimer = null; // Timer for debounced search
        
        // Narrator suggestions loaded from database
        vm.narratorSuggestions = [];
        vm.filteredNarratorSuggestions = [];
        vm.showNarratorSuggestions = false;
        vm.selectedSuggestionIndex = -1;

        //Methods
        vm.editAhadees = editAhadees;
        vm.deleteAhadees = deleteAhadees;
        vm.resetView = resetView;
        vm.submitSearchCriteria = submitSearchCriteria;
        vm.saveAhadees = saveAhadees;
        vm.cancelAhadees = cancelAhadees;
        vm.loadLastTenAhadees = loadLastTenAhadees;
        
        // New normalized database filtering methods
        vm.filterByCategory = filterByCategory;
        vm.filterByNarrator = filterByNarrator;
        vm.clearFilters = clearFilters;
        vm.activeFilter = null;
        vm.activeNarratorFilter = null;
        
        // Debug methods
        vm.testConnection = testConnection;
        vm.lastError = null;
        vm.addNarratorSuggestion = addNarratorSuggestion;
        vm.filterNarratorSuggestions = filterNarratorSuggestions;
        vm.toProperCase = toProperCase;
        vm.autoSearch = autoSearch;
        vm.onNarratorSelected = onNarratorSelected;
        vm.onNarratorKeyup = onNarratorKeyup;
        vm.onNarratorKeydown = onNarratorKeydown;
        vm.selectNarratorSuggestion = selectNarratorSuggestion;
        vm.hideNarratorSuggestions = hideNarratorSuggestions;

        activateController();

        function activateController() {
            var promises = [];
            // Load existing narrators for suggestions
            promises.push(loadNarratorSuggestions());
            
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(result) {
                vm.viewReady = true;
                log("Activated adminAhadees View with enhanced features", controllerId, config.showDevToasts);
                
                // Add debug logging for auto-load
                console.log('🔧 DEBUG: adminAhadeesCtl activated - automatically loading recent ahadees');
                
                // Load recent Hadees cards by default on page load
                vm.loadLastTenAhadees();
            }
        }

        function loadNarratorSuggestions() {
            // Load narrator suggestions from database (handles both normalized and legacy structures)
            
            return datacontext.getNarrators()
                .then(function(response) {
                    console.log('🔧 [NARRATOR-DEBUG] Raw response:', response);
                    
                    var narratorsFromDb = response.data || response || [];
                    console.log('🔧 [NARRATOR-DEBUG] Extracted data:', narratorsFromDb);
                    
                    if (narratorsFromDb && narratorsFromDb.length > 0) {
                        // Handle both normalized (NarratorEnglish) and legacy (narratorName) field names
                        vm.narratorSuggestions = narratorsFromDb.map(function(n) { 
                            console.log('🔧 [NARRATOR-DEBUG] Processing narrator:', n);
                            // Priority: NarratorEnglish (database field) -> narratorName (legacy) -> other variants
                            return n.NarratorEnglish || n.narratorName || n.narrator || n.name || n.displayName || n.title; 
                        }).filter(function(name) { 
                            return name && typeof name === 'string' && name.trim() !== ""; 
                        });
                        
                        console.log('🔧 [NARRATOR-DEBUG] Mapped narrator names:', vm.narratorSuggestions);
                        
                        // Remove duplicates and sort
                        vm.narratorSuggestions = vm.narratorSuggestions.filter(function(item, pos, self) {
                            return self.indexOf(item) === pos;
                        });
                        
                        // Sort alphabetically for consistency
                        vm.narratorSuggestions.sort();
                        
                        // Add our known narrators (updated to match production data) if they're not already included
                        var knownNarrators = [
                            // From updated database tables (now matching production)
                            'Muhammad Ibn Abdullah (SWS)',
                            'Ali Ibn Abu Talib', 
                            'Syedna Moyyed (QR)',
                            'Syedna Moyyed al-Shirazi (QR)',
                            'Sahih Bukhari'
                        ];
                        
                        knownNarrators.forEach(function(narrator) {
                            if (vm.narratorSuggestions.indexOf(narrator) === -1) {
                                vm.narratorSuggestions.push(narrator);
                            }
                        });
                        
                        // Initialize filtered suggestions
                        vm.filteredNarratorSuggestions = vm.narratorSuggestions.slice(0, 10);
                        
                        console.log('🔧 [NARRATOR-DEBUG] Final suggestions:', vm.narratorSuggestions);
                    } else {
                        setDefaultNarratorSuggestions();
                    }
                })
                .catch(function(error) {
                    console.error('🔧 [NARRATOR-DEBUG] Error details:', error);
                    // Fallback to default suggestions
                    setDefaultNarratorSuggestions();
                });
        }

        function setDefaultNarratorSuggestions() {
            // Default Islamic hadees collections
            vm.narratorSuggestions = [
                "Prophet Muhammad (PBUH)", "Imam Ali (AS)", "Syedna Moyyed al-Shirazi (QR)",
                "Sahih Bukhari", "Sahih Muslim", "Sunan Abu Dawud", 
                "Jami' at-Tirmidhi", "Sunan an-Nasa'i", "Sunan Ibn Majah",
                "Musnad Ahmad", "Muwatta Malik", "Sahih Ibn Khuzaymah",
                "Sunan ad-Darimi", "Mustadrak al-Hakim"
            ];
            vm.filteredNarratorSuggestions = vm.narratorSuggestions.slice();
        }

        //Watches
        $scope.$watch("vm.mode", function (newMode, oldMode) {
            if (newMode && !angular.equals(newMode, oldMode)) {
                console.log('🔧 [AHADEES-WATCH] Mode changed from', oldMode, 'to', newMode);
                if (vm.mode === "" || vm.mode === "add") {
                    vm.fAhadees = getNewAhadees();
                }
            }
        }, false);

        // Watch for changes to the reference field specifically
        $scope.$watch("vm.fAhadees.reference", function (newValue, oldValue) {
            if (newValue !== oldValue) {
                console.log('🔧 [AHADEES-WATCH] Reference field changed from "' + oldValue + '" to "' + newValue + '"');
            }
        }, false);

        // Watch for any changes to the fAhadees object
        $scope.$watch("vm.fAhadees", function (newValue, oldValue) {
            if (newValue && oldValue && !angular.equals(newValue, oldValue)) {
                console.log('🔧 [AHADEES-WATCH] fAhadees object changed:', {
                    old: oldValue,
                    new: newValue,
                    referenceOld: oldValue.reference,
                    referenceNew: newValue.reference
                });
            }
        }, true); // Deep watch

        // Watch for changes to the subject field to apply proper case formatting
        $scope.$watch("vm.fAhadees.subject", function (newValue, oldValue) {
            if (newValue !== oldValue && newValue) {
                var properCaseSubject = vm.toProperCase(newValue);
                if (properCaseSubject !== newValue) {
                    vm.fAhadees.subject = properCaseSubject;
                }
            }
        }, false);

        // Watch for changes to search text and trigger auto-search with debounce
        $scope.$watch("vm.ahadeesSearch.searchText", function (newValue, oldValue) {
            if (newValue !== oldValue) {
                // Clear existing timer
                if (vm.searchTimer) {
                    clearTimeout(vm.searchTimer);
                }
                
                // Clear results if search text is empty
                if (!newValue || newValue.trim() === '') {
                    vm.result = [];
                    vm.searchPerformed = false;
                    return;
                }
                
                // Set new timer for auto-search (500ms delay)
                vm.searchTimer = setTimeout(function() {
                    $scope.$apply(function() {
                        vm.autoSearch();
                    });
                }, 500);
            }
        }, false);

        // Watch for changes to legacy search fields to clear filter (keeping for backward compatibility)
        var clearlist = "[vm.ahadeesSearch.narrator, vm.ahadeesSearch.arabicTrans, vm.ahadeesSearch.subject, vm.ahadeesSearch.english]";
        $scope.$watch(clearlist, function (newValue, oldValue) {
            if (newValue && !angular.equals(newValue, oldValue) && vm.ahadeesSearch.filter) {
                vm.ahadeesSearch.filter = "";
                // Note: Don't clear results here as auto-search will handle it
            }
        }, false);

        //Internal Methods

        function resetView() {
            // Clear search timer
            if (vm.searchTimer) {
                clearTimeout(vm.searchTimer);
                vm.searchTimer = null;
            }
            
            // Clear intellisense state
            vm.showNarratorSuggestions = false;
            vm.selectedSuggestionIndex = -1;
            vm.filteredNarratorSuggestions = vm.narratorSuggestions.slice(0, 10);
            
            vm.mode = "";
            vm.result = [];
            vm.ahadeesSearch = newSearchCriteria();
            vm.fAhadees = getNewAhadees();
            vm.searchPerformed = false;
        }

        function newSearchCriteria() {
            return {
                searchText: "", // Single unified search field
                narrator: "",
                subject: "",
                english: "",
                arabicTrans: "",
                filter: "",
                lastEntry: 10
            };
        }

        function getNewAhadees() {
            var newAhadees = {
                ahadeesId: 0,
                narrator: "",
                subject: "",
                ahadeesArabic: "",
                ahadeesArabicUnbraced: "",
                ahadeesEnglish: "",
                reference: "",
                createdDate: ""
            };
            
            console.log('🔧 [AHADEES-NEW] Created new ahadees object:', newAhadees);
            console.log('🔧 [AHADEES-NEW] Reference field initialized as:', newAhadees.reference);
            
            return newAhadees;
        }

        function submitSearchCriteria() {
            vm.searchPerformed = true;
            
            // Transform search criteria to new Ahadees API format
            var criteria = {
                searchText: vm.ahadeesSearch.searchText || vm.ahadeesSearch.english || vm.ahadeesSearch.arabicTrans || vm.ahadeesSearch.subject,
                subject: vm.ahadeesSearch.subject,
                ahadeesEnglish: vm.ahadeesSearch.english,
                ahadeesArabic: vm.ahadeesSearch.arabicTrans,
                pageNumber: 1,
                pageSize: 50
            };

            // Call the new datacontext service method (searchAhadees)
            datacontext.searchAhadees(criteria)
                .then(function(response) {
                    var searchData = response.data || response;
                    
                    console.log('🔍 [SEARCH-DEBUG] Raw search response:', searchData);
                    
                    // Handle the new API response format
                    if (searchData.ahadeesList) {
                        console.log('🔍 [SEARCH-DEBUG] First ahadees item:', searchData.ahadeesList[0]);
                        vm.result = searchData.ahadeesList.map(function(ahadees) {
                            console.log('🔍 [SEARCH-DEBUG] Mapping ahadees:', {
                                id: ahadees.ahadeesId,
                                narratorName: ahadees.narratorName,
                                narrator: ahadees.narrator,
                                narratorEnglish: ahadees.narratorEnglish,
                                finalNarrator: ahadees.narratorName || ahadees.narrator || ahadees.narratorEnglish || ""
                            });
                            return {
                                ahadeesId: ahadees.ahadeesId,
                                narrator: ahadees.narratorName || ahadees.narrator || ahadees.narratorEnglish || "",
                                narratorId: ahadees.narratorId,
                                subject: ahadees.subject,
                                ahadeesArabic: ahadees.ahadeesArabic,
                                ahadeesArabicUnbraced: ahadees.ahadeesArabic,
                                ahadeesEnglish: ahadees.ahadeesEnglish,
                                reference: ahadees.reference || "",
                                createdDate: ahadees.createdDate
                            };
                        });
                    } else {
                        // Fallback for direct array response
                        console.log('🔍 [SEARCH-DEBUG] Using fallback array mapping for:', searchData);
                        if (Array.isArray(searchData) && searchData.length > 0) {
                            console.log('🔍 [SEARCH-DEBUG] First fallback item:', searchData[0]);
                        }
                        vm.result = (Array.isArray(searchData) ? searchData : []).map(function(ahadees) {
                            console.log('🔍 [SEARCH-DEBUG] Fallback mapping ahadees:', {
                                id: ahadees.ahadeesId,
                                narratorName: ahadees.narratorName,
                                narrator: ahadees.narrator,
                                narratorEnglish: ahadees.narratorEnglish,
                                finalNarrator: ahadees.narratorName || ahadees.narrator || ahadees.narratorEnglish || ""
                            });
                            return {
                                ahadeesId: ahadees.ahadeesId,
                                narrator: ahadees.narratorName || ahadees.narrator || ahadees.narratorEnglish || "",
                                narratorId: ahadees.narratorId,
                                subject: ahadees.subject,
                                ahadeesArabic: ahadees.ahadeesArabic,
                                ahadeesArabicUnbraced: ahadees.ahadeesArabic,
                                ahadeesEnglish: ahadees.ahadeesEnglish,
                                reference: ahadees.reference || "",
                                createdDate: ahadees.createdDate
                            };
                        });
                    }
                    
                    if (vm.result.length > 0) {
                        logSuccess("Found " + vm.result.length + " Ahadees matching criteria", controllerId);
                    } else {
                        log("No Ahadees found matching search criteria", controllerId);
                    }
                })
                .catch(function(error) {
                    var errorMessage = error.data ? error.data.message || error.data : error.message || "Unknown error occurred";
                    logError("Error searching Ahadees: " + errorMessage, controllerId);
                    vm.result = [];
                });
        }

        function saveAhadees() {
            console.log('🔧 [AHADEES-SAVE] Starting saveAhadees function');
            console.log('🔧 [AHADEES-SAVE] Current fAhadees object:', vm.fAhadees);
            console.log('🔧 [AHADEES-SAVE] Reference field value:', vm.fAhadees.reference);
            
            // Add new narrator to suggestions if it's not already there
            if (vm.fAhadees.narrator && vm.narratorSuggestions.indexOf(vm.fAhadees.narrator) === -1) {
                vm.addNarratorSuggestion(vm.fAhadees.narrator);
            }
            
            // Use new ahadees format for the enhanced database API
            var ahadeesData = {
                ahadeesId: vm.fAhadees.ahadeesId || 0,
                subject: vm.fAhadees.subject || "",
                ahadeesArabic: vm.fAhadees.ahadeesArabic || "",
                ahadeesEnglish: vm.fAhadees.ahadeesEnglish || "",
                narratorName: vm.fAhadees.narrator || null,
                reference: vm.fAhadees.reference || "", // 🔧 FIXED: Added missing reference field
                categoryId: 1, // Default to Faith and Belief category
                createdBy: 'ADMIN_PANEL'
            };
            
            console.log('🔧 [AHADEES-SAVE] Final ahadeesData object being sent to database:', ahadeesData);
            console.log('🔧 [AHADEES-SAVE] Reference field in final object:', ahadeesData.reference);
            
            // Validate required fields
            var validationErrors = [];
            if (!ahadeesData.ahadeesArabic || ahadeesData.ahadeesArabic.trim() === '') {
                validationErrors.push('Arabic text is required');
            }
            if (!ahadeesData.ahadeesEnglish || ahadeesData.ahadeesEnglish.trim() === '') {
                validationErrors.push('English text is required');
            }
            if (!ahadeesData.subject || ahadeesData.subject.trim() === '') {
                validationErrors.push('Subject is required');
            }
            
            if (validationErrors.length > 0) {
                console.error('❌ [AHADEES-SAVE] Validation failed:', validationErrors);
                logError("Validation failed: " + validationErrors.join(', '), controllerId);
                return;
            }
            
            console.log('✅ [AHADEES-SAVE] Validation passed, proceeding with save');
            
            // Try the new method name first as a cache-busting test
            var savePromise;
            
            if (typeof datacontext.saveAhadeesNew === 'function') {
                savePromise = datacontext.saveAhadeesNew(ahadeesData);
            } else if (typeof datacontext.saveAhadees === 'function') {
                savePromise = datacontext.saveAhadees(ahadeesData);
            } else {
                logError("saveAhadees method not found in datacontext service", controllerId);
                return;
            }
            
            // Process the save promise
            savePromise.then(function(response) {
                    console.log('✅ [AHADEES-SAVE] Save successful, server response:', response);
                    var savedAhadees = response.data || response;
                    console.log('✅ [AHADEES-SAVE] Extracted savedAhadees:', savedAhadees);
                    
                    // Update the frontend object with saved data
                    vm.fAhadees.ahadeesId = savedAhadees.ahadeesId;
                    
                    // Add to search results if search was performed
                    if (vm.searchPerformed && vm.result) {
                        var displayAhadees = {
                            ahadeesId: savedAhadees.ahadeesId,
                            narrator: vm.fAhadees.narrator || "",
                            subject: ahadeesData.subject,
                            ahadeesArabic: ahadeesData.ahadeesArabic,
                            ahadeesEnglish: ahadeesData.ahadeesEnglish,
                            reference: ahadeesData.reference, // 🔧 FIXED: Include reference in display object
                            createdDate: new Date()
                        };
                        
                        console.log('🔧 [AHADEES-SAVE] Display ahadees object with reference:', displayAhadees);
                        
                        if (savedAhadees.operation === 'INSERT') {
                            vm.result.unshift(displayAhadees);
                        } else {
                            // Update existing item in results
                            var existingIndex = vm.result.findIndex(function(item) {
                                return item.ahadeesId === savedAhadees.ahadeesId;
                            });
                            if (existingIndex >= 0) {
                                vm.result[existingIndex] = displayAhadees;
                            }
                        }
                    }
                    
                    resetView();
                    logSuccess("Successfully saved Ahadees (ID: " + savedAhadees.ahadeesId + ")", controllerId);
                })
                .catch(function(error) {
                    console.error('❌ [AHADEES-SAVE] Save failed with error:', error);
                    var errorMessage = "An error has occurred.";
                    
                    if (error.data) {
                        if (typeof error.data === 'string') {
                            errorMessage = error.data;
                        } else if (error.data.message) {
                            errorMessage = error.data.message;
                        } else if (error.data.error) {
                            errorMessage = error.data.error;
                        } else {
                            errorMessage = JSON.stringify(error.data);
                        }
                    } else if (error.message) {
                        errorMessage = error.message;
                    } else if (error.statusText) {
                        errorMessage = error.statusText + " (HTTP " + error.status + ")";
                    }
                    
                    console.error('❌ [AHADEES-SAVE] Error message:', errorMessage);
                    logError("Error saving Hadees: " + errorMessage, controllerId);
                });
        }

        function editAhadees(ahadees) {
            console.log('🔧 [AHADEES-EDIT] Starting editAhadees function');
            console.log('🔧 [AHADEES-EDIT] Original ahadees object from database:', ahadees);
            console.log('🔧 [AHADEES-EDIT] Reference field in original object:', ahadees.reference);
            
            vm.mode = "edit";
            vm.fAhadees = angular.copy(ahadees);
            
            console.log('🔧 [AHADEES-EDIT] Copied to vm.fAhadees:', vm.fAhadees);
            console.log('🔧 [AHADEES-EDIT] Reference field in vm.fAhadees:', vm.fAhadees.reference);
            console.log('🔧 [AHADEES-EDIT] Edit mode activated, form should now show existing data');
        }
        
        function deleteAhadees(ahadees) {
            // Use bootstrap dialog service for confirmation
            dlg.deleteDialog("Hadees", "Are you sure you want to delete this Hadees? This action cannot be undone.", "Yes, Delete", "Cancel")
                .then(function(result) {
                    if (result === "ok") {
                        // Call the delete API
                        datacontext.deleteAhadees(ahadees.ahadeesId)
                            .then(function(response) {
                                logSuccess("Hadees deleted successfully", controllerId);
                                
                                // Remove from current results
                                var index = vm.result.indexOf(ahadees);
                                if (index > -1) {
                                    vm.result.splice(index, 1);
                                }
                                
                                // If we're editing this hadees, reset the form
                                if (vm.mode === "edit" && vm.fAhadees.ahadeesId === ahadees.ahadeesId) {
                                    vm.mode = "";
                                    vm.fAhadees = getNewAhadees();
                                }
                            })
                            .catch(function(error) {
                                var errorMessage = error.data ? error.data.message || error.data : error.message || "Unknown error occurred";
                                logError("Error deleting Hadees: " + errorMessage, controllerId);
                            });
                    }
                })
                .catch(function() {
                    // User cancelled the dialog - this is expected behavior, no error needed
                    // Just silently handle the cancellation
                });
        }
        
        function cancelAhadees() {
            vm.mode = "";
        }

        function loadLastTenAhadees() {
            console.log('🔧 DEBUG: loadLastTenAhadees() called');
            vm.searchPerformed = true;
            // Call the new datacontext service method (getRecentAhadees)
            
            console.log('🔧 DEBUG: Calling datacontext.getRecentAhadees(10)...');
            datacontext.getRecentAhadees(10)
                .then(function(response) {
                    console.log('🔧 DEBUG: getRecentAhadees SUCCESS:', response);
                    var ahadeesData = response.data || response;
                    
                    // Handle the new API response format
                    if (ahadeesData.ahadeesList) {
                        console.log('🔧 DEBUG: Using ahadeesList format, found', ahadeesData.ahadeesList.length, 'ahadees');
                        vm.result = ahadeesData.ahadeesList.map(function(ahadees) {
                            return {
                                ahadeesId: ahadees.ahadeesId,
                                narrator: ahadees.narratorName || ahadees.narrator || ahadees.narratorEnglish || "",
                                narratorId: ahadees.narratorId,
                                subject: ahadees.subject,
                                ahadeesArabic: ahadees.ahadeesArabic,
                                ahadeesArabicUnbraced: ahadees.ahadeesArabic, // Same as Arabic for now
                                ahadeesEnglish: ahadees.ahadeesEnglish,
                                reference: ahadees.reference || "",
                                createdDate: ahadees.createdDate
                            };
                        });
                    } else {
                        // Fallback for direct array response
                        console.log('🔧 DEBUG: Using direct array format');
                        vm.result = (Array.isArray(ahadeesData) ? ahadeesData : []).map(function(ahadees) {
                            return {
                                ahadeesId: ahadees.ahadeesId,
                                narrator: ahadees.narratorName || ahadees.narrator || ahadees.narratorEnglish || "",
                                narratorId: ahadees.narratorId,
                                subject: ahadees.subject,
                                ahadeesArabic: ahadees.ahadeesArabic,
                                ahadeesArabicUnbraced: ahadees.ahadeesArabic,
                                ahadeesEnglish: ahadees.ahadeesEnglish,
                                reference: ahadees.reference || "",
                                createdDate: ahadees.createdDate
                            };
                        });
                    }
                    
                    console.log('🔧 DEBUG: Final result count:', vm.result.length);
                    logSuccess("Successfully loaded " + vm.result.length + " recent ahadees", controllerId);
                    
                })
                .catch(function(error) {
                    console.error('🔧 ERROR: Failed to load recent ahadees:', error);
                    var errorMessage = error.data ? error.data.message || error.data : error.message || "Unknown error occurred";
                    logError("Error loading last Ahadees: " + errorMessage, controllerId);
                    vm.result = [];
                });
        }

        function addNarratorSuggestion(narrator) {
            if (narrator && narrator.trim() !== "" && vm.narratorSuggestions.indexOf(narrator) === -1) {
                vm.narratorSuggestions.push(narrator);
                // Sort suggestions alphabetically
                vm.narratorSuggestions.sort();
            }
        }

        function filterNarratorSuggestions(viewValue) {
            // Enhanced filtering with partial matching and case-insensitive search
            if (!viewValue || viewValue.length < 1) {
                // Return top 10 most common narrators when no input
                return vm.narratorSuggestions.slice(0, 10);
            }
            
            var searchTerm = viewValue.toLowerCase();
            
            // Priority-based filtering
            var exactMatches = [];
            var startsWithMatches = [];
            var containsMatches = [];
            
            vm.narratorSuggestions.forEach(function(narrator) {
                var narratorLower = narrator.toLowerCase();
                
                if (narratorLower === searchTerm) {
                    exactMatches.push(narrator);
                } else if (narratorLower.indexOf(searchTerm) === 0) {
                    startsWithMatches.push(narrator);
                } else if (narratorLower.indexOf(searchTerm) !== -1) {
                    containsMatches.push(narrator);
                }
            });
            
            // Combine results with priority order
            var combinedResults = exactMatches.concat(startsWithMatches).concat(containsMatches);
            
            // Limit to 12 suggestions for better UX
            return combinedResults.slice(0, 12);
        }

        function toProperCase(str) {
            if (!str) return str;
            return str.replace(/\w\S*/g, function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }

        function autoSearch() {
            // Only perform search if there's search text and minimum 2 characters
            if (!vm.ahadeesSearch.searchText || vm.ahadeesSearch.searchText.trim().length < 2) {
                vm.result = [];
                vm.searchPerformed = false;
                return;
            }
            
            console.log('🔍 [AUTO-SEARCH] Triggering auto-search for:', vm.ahadeesSearch.searchText);
            vm.submitSearchCriteria();
        }

        function onNarratorSelected(item, model, label) {
            // Handle when a narrator is selected from typeahead
            console.log('🎯 [NARRATOR-SELECT] Selected narrator:', item);
            
            // Ensure the narrator is added to suggestions if it's new
            if (item && vm.narratorSuggestions.indexOf(item) === -1) {
                vm.addNarratorSuggestion(item);
            }
        }

        function onNarratorKeyup(event) {
            var inputValue = vm.fAhadees.narrator || '';
            
            // Filter suggestions based on input
            vm.filteredNarratorSuggestions = vm.filterNarratorSuggestions(inputValue);
            
            // Show suggestions if there are any and input is not empty
            vm.showNarratorSuggestions = inputValue.length > 0 && vm.filteredNarratorSuggestions.length > 0;
            
            // Reset selection index
            vm.selectedSuggestionIndex = -1;
            
            console.log('🔍 [NARRATOR-KEYUP] Input:', inputValue, 'Suggestions:', vm.filteredNarratorSuggestions.length);
        }

        function onNarratorKeydown(event) {
            if (!vm.showNarratorSuggestions || vm.filteredNarratorSuggestions.length === 0) {
                return;
            }

            switch (event.keyCode) {
                case 38: // Up arrow
                    event.preventDefault();
                    vm.selectedSuggestionIndex = vm.selectedSuggestionIndex > 0 
                        ? vm.selectedSuggestionIndex - 1 
                        : vm.filteredNarratorSuggestions.length - 1;
                    break;
                    
                case 40: // Down arrow
                    event.preventDefault();
                    vm.selectedSuggestionIndex = vm.selectedSuggestionIndex < vm.filteredNarratorSuggestions.length - 1 
                        ? vm.selectedSuggestionIndex + 1 
                        : 0;
                    break;
                    
                case 13: // Enter
                    if (vm.selectedSuggestionIndex >= 0) {
                        event.preventDefault();
                        vm.selectNarratorSuggestion(vm.filteredNarratorSuggestions[vm.selectedSuggestionIndex]);
                    }
                    break;
                    
                case 27: // Escape
                    event.preventDefault();
                    vm.hideNarratorSuggestions();
                    break;
            }
        }

        function selectNarratorSuggestion(suggestion) {
            console.log('🎯 [NARRATOR-SELECT] Selected suggestion:', suggestion);
            
            vm.fAhadees.narrator = suggestion;
            vm.hideNarratorSuggestions();
            
            // Add to suggestions if it's new
            if (vm.narratorSuggestions.indexOf(suggestion) === -1) {
                vm.addNarratorSuggestion(suggestion);
            }
        }

        function hideNarratorSuggestions() {
            // Delay hiding to allow click events to register
            setTimeout(function() {
                $scope.$apply(function() {
                    vm.showNarratorSuggestions = false;
                    vm.selectedSuggestionIndex = -1;
                });
            }, 150);
        }

        // DEBUG FUNCTIONS - Database connectivity testing
        function testConnection() {
            console.log("🔧 [DEBUG] Testing database connection...");
            
            // Test public endpoint first
            fetch('/api/public/pulsecheck')
                .then(response => response.text())
                .then(data => {
                    console.log("✅ [DEBUG] Public API works:", data);
                    document.getElementById('connectionStatus').innerHTML = 
                        '<span style="color: green;">✅ Public API: OK (' + data + ')</span>';
                })
                .catch(error => {
                    console.error("❌ [DEBUG] Public API failed:", error);
                    document.getElementById('connectionStatus').innerHTML = 
                        '<span style="color: red;">❌ Public API: FAILED</span>';
                });
        }

        // New normalized database filter functions
        function filterByCategory(category) {
            vm.activeFilter = category;
            vm.activeNarratorFilter = null; // Clear narrator filter
            
            log("Filtering by category: " + category, controllerId);
            
            // Update search criteria with category filter
            var criteria = newSearchCriteria();
            criteria.categoryFilter = category;
            criteria.searchText = vm.ahadeesSearch.searchText || "";
            
            // Execute search with category filter
            vm.submitSearchCriteria(criteria);
        }

        function filterByNarrator(narratorType) {
            vm.activeNarratorFilter = narratorType;
            vm.activeFilter = null; // Clear category filter
            
            // Map narrator types to actual narrator names (updated to match production)
            var narratorName = '';
            switch(narratorType) {
                case 'prophet':
                    narratorName = 'Muhammad Ibn Abdullah (SWS)'; // Updated to match production format
                    break;
                case 'ali':
                    narratorName = 'Ali Ibn Abu Talib'; // Updated to match production format
                    break;
                case 'moyyed':
                    narratorName = 'Syedna Moyyed (QR)'; // Matches both tables
                    break;
            }
            
            if (narratorName) {
                // Update search criteria with narrator filter
                var criteria = newSearchCriteria();
                criteria.narrator = narratorName;
                criteria.searchText = vm.ahadeesSearch.searchText || "";
                
                // Execute search with narrator filter
                vm.submitSearchCriteria(criteria);
            }
        }

        function clearFilters() {
            vm.activeFilter = null;
            vm.activeNarratorFilter = null;
            
            log("Clearing all filters", controllerId);
            
            // Load recent ahadees without filters
            vm.loadLastTenAhadees();
        }
    }
})();
