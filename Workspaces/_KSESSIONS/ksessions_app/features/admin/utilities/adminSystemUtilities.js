(function () {
    "use strict";
    var controllerId = "adminSystemUtilitiesCtl";
    angular.module("app").controller(controllerId,
        ["$scope", "common", "bootstrap.dialog", "config", "adminUtilityService", adminSystemUtilitiesCtl]);

    function adminSystemUtilitiesCtl($scope, common, dlg, config, adminUtilityService) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;

        // Properties
        vm.systemStatus = {
            databaseSize: 'Loading...',
            freeSpace: 'Loading...',
            lastBackup: 'Loading...',
            health: 'good'
        };

        // System Utilities Loading States
        vm.isClearingCache = false;
        vm.isRebuildingIndexes = false;
        vm.isUpdatingStatistics = false;
        vm.isCheckingIntegrity = false;
        vm.isRefreshingStatus = false;
        vm.lastOperationResult = null;
        
        // Run All Checks state management
        vm.isRunningAllChecks = false;
        vm.runAllChecksProgress = {
            current: 0,
            total: 0,
            currentOperation: '',
            results: [],
            startTime: null,
            endTime: null
        };

        // Configuration for all system operations (loaded dynamically)
        vm.systemOperations = [];
        
        // Load system operations from configuration
        function loadSystemOperations() {
            // In a future implementation, this could load from an API endpoint
            // For now, loading from a configuration service
            vm.systemOperations = [
                {
                    name: 'System Status Refresh',
                    description: 'Refresh current system status information',
                    function: 'refreshSystemStatus',
                    skipConfirmation: true,
                    category: 'status'
                },
                {
                    name: 'Clear System Cache',
                    description: 'Clear all cached data and temporary files',
                    function: 'clearCache',
                    skipConfirmation: false,
                    category: 'maintenance'
                },
                {
                    name: 'Rebuild Database Indexes',
                    description: 'Rebuild and optimize database indexes',
                    function: 'rebuildIndexes',
                    skipConfirmation: false,
                    category: 'database'
                },
                {
                    name: 'Update Database Statistics',
                    description: 'Update database query optimization statistics',
                    function: 'updateStatistics',
                    skipConfirmation: true,
                    category: 'database'
                },
                {
                    name: 'Check Database Integrity',
                    description: 'Verify database structure and data integrity',
                    function: 'checkIntegrity',
                    skipConfirmation: true,
                    category: 'validation'
                }
            ];
            
            log("Loaded " + vm.systemOperations.length + " system operations", controllerId);
        }

        // Methods
        // Button click wrapper functions with comprehensive debugging
        vm.clearCache = function() {
            console.log("DEBUG: BUTTON CLICK - Clear Cache button clicked", {
                controllerId: controllerId,
                timestamp: new Date().toISOString(),
                buttonContext: "Clear Cache",
                functionAvailable: typeof clearCache === 'function'
            });
            clearCache();
        };
        
        vm.rebuildIndexes = function() {
            console.log("DEBUG: BUTTON CLICK - Rebuild Indexes button clicked", {
                controllerId: controllerId,
                timestamp: new Date().toISOString(),
                buttonContext: "Rebuild Indexes",
                functionAvailable: typeof rebuildIndexes === 'function'
            });
            rebuildIndexes();
        };
        
        vm.updateStatistics = function() {
            console.log("DEBUG: BUTTON CLICK - Update Statistics button clicked", {
                controllerId: controllerId,
                timestamp: new Date().toISOString(),
                buttonContext: "Update Statistics",
                functionAvailable: typeof updateStatistics === 'function'
            });
            updateStatistics();
        };
        
        vm.checkIntegrity = function() {
            console.log("DEBUG: BUTTON CLICK - Check Integrity button clicked", {
                controllerId: controllerId,
                timestamp: new Date().toISOString(),
                buttonContext: "Check Integrity",
                functionAvailable: typeof checkIntegrity === 'function'
            });
            checkIntegrity();
        };
        vm.refreshSystemStatus = refreshSystemStatus;
        
        // Run All Checks functionality
        vm.runAllChecks = runAllChecks;
        vm.getSystemOperations = function() { return vm.systemOperations; };
        vm.getOperationsByCategory = getOperationsByCategory;

        activate();

        // ===================
        // Run All Checks Implementation
        // ===================

        function runAllChecks() {
            console.log("DEBUG: runAllChecks() called", {
                controllerId: controllerId,
                timestamp: new Date().toISOString(),
                operationsCount: vm.systemOperations.length,
                operations: vm.systemOperations.map(op => op.name)
            });

            showCustomConfirmationDialog(
                "Run All System Checks",
                "This will execute all system maintenance operations in sequence:<br><br>" +
                vm.systemOperations.map(function(op, index) { return (index + 1) + ". " + op.name; }).join('<br>') +
                "<br><br>This process may take several minutes. Continue?",
                "Yes, Run All Checks",
                "Cancel",
                function() {
                    console.log("DEBUG: runAllChecks() confirmed by user", {
                        controllerId: controllerId,
                        operationsToRun: vm.systemOperations.length
                    });
                    executeAllOperationsSequentially();
                }
            );
        }

        function executeAllOperationsSequentially() {
            console.log("DEBUG: executeAllOperationsSequentially() started", {
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });

            // Initialize progress tracking
            vm.isRunningAllChecks = true;
            vm.runAllChecksProgress = {
                current: 0,
                total: vm.systemOperations.length,
                currentOperation: '',
                results: [],
                startTime: new Date(),
                endTime: null
            };

            log("Starting comprehensive system checks...");

            // Execute operations one by one
            executeNextOperation(0);
        }

        function executeNextOperation(index) {
            if (index >= vm.systemOperations.length) {
                // All operations completed
                completeAllOperations();
                return;
            }

            var operation = vm.systemOperations[index];
            
            console.log("DEBUG: executeNextOperation() processing", {
                controllerId: controllerId,
                operationIndex: index,
                operationName: operation.name,
                operationFunction: operation.function,
                timestamp: new Date().toISOString()
            });

            // Update progress
            vm.runAllChecksProgress.current = index + 1;
            vm.runAllChecksProgress.currentOperation = operation.name;

            log("Running " + operation.name + " (" + (index + 1) + "/" + vm.systemOperations.length + ")...");

            // Execute the operation based on the function name
            var operationPromise;
            switch (operation.function) {
                case 'refreshSystemStatus':
                    operationPromise = executeRefreshSystemStatus();
                    break;
                case 'clearCache':
                    operationPromise = executeClearCache();
                    break;
                case 'rebuildIndexes':
                    operationPromise = executeRebuildIndexes();
                    break;
                case 'updateStatistics':
                    operationPromise = executeUpdateStatistics();
                    break;
                case 'checkIntegrity':
                    operationPromise = executeCheckIntegrity();
                    break;
                default:
                    console.error("DEBUG: Unknown operation function", {
                        operationFunction: operation.function,
                        controllerId: controllerId
                    });
                    operationPromise = common.$q.reject('Unknown operation: ' + operation.function);
            }

            // Handle operation completion
            operationPromise
                .then(function(result) {
                    console.log("DEBUG: Operation completed successfully", {
                        operationName: operation.name,
                        result: result,
                        controllerId: controllerId
                    });

                    vm.runAllChecksProgress.results.push({
                        operation: operation.name,
                        success: true,
                        message: result ? result.message || 'Operation completed successfully' : 'Completed',
                        timestamp: new Date()
                    });

                    // Wait a moment then proceed to next operation
                    common.$timeout(function() {
                        executeNextOperation(index + 1);
                    }, 1000);
                })
                .catch(function(error) {
                    console.error("DEBUG: Operation failed", {
                        operationName: operation.name,
                        error: error,
                        controllerId: controllerId
                    });

                    vm.runAllChecksProgress.results.push({
                        operation: operation.name,
                        success: false,
                        message: error ? error.message || error : 'Operation failed',
                        timestamp: new Date()
                    });

                    // Continue to next operation even if this one failed
                    common.$timeout(function() {
                        executeNextOperation(index + 1);
                    }, 1000);
                });
        }

        function completeAllOperations() {
            console.log("DEBUG: completeAllOperations() called", {
                controllerId: controllerId,
                totalOperations: vm.runAllChecksProgress.total,
                results: vm.runAllChecksProgress.results,
                timestamp: new Date().toISOString()
            });

            vm.runAllChecksProgress.endTime = new Date();
            vm.runAllChecksProgress.currentOperation = 'Completed';
            
            var duration = (vm.runAllChecksProgress.endTime - vm.runAllChecksProgress.startTime) / 1000;
            var successCount = vm.runAllChecksProgress.results.filter(r => r.success).length;
            var failureCount = vm.runAllChecksProgress.results.length - successCount;

            var summaryMessage = "All system checks completed in " + duration.toFixed(1) + "s\n" +
                                "✅ " + successCount + " operations succeeded\n" +
                                "❌ " + failureCount + " operations failed";

            log(summaryMessage);
            logSuccess("Comprehensive system checks completed!");

            // Reset state after a delay
            common.$timeout(function() {
                vm.isRunningAllChecks = false;
                vm.runAllChecksProgress.currentOperation = '';
            }, 3000);
        }

        // Individual operation execution functions (bypass confirmation dialogs)
        function executeRefreshSystemStatus() {
            return adminUtilityService.getSystemStatus()
                .then(function(response) {
                    if (response) {
                        vm.systemStatus = response;
                        return { message: "System status refreshed successfully" };
                    }
                    throw new Error("No system status data received");
                });
        }

        function executeClearCache() {
            return adminUtilityService.clearCache()
                .then(function(response) {
                    if (response && response.success) {
                        return { message: "Cache cleared: " + (response.itemsCleared || 0) + " items removed" };
                    }
                    throw new Error("Failed to clear cache");
                });
        }

        function executeRebuildIndexes() {
            return adminUtilityService.rebuildIndexes()
                .then(function(response) {
                    if (response && response.success) {
                        return { message: "Indexes rebuilt: " + (response.indexesRebuilt || 0) + " processed" };
                    }
                    throw new Error("Failed to rebuild indexes");
                });
        }

        function executeUpdateStatistics() {
            return adminUtilityService.updateStatistics()
                .then(function(response) {
                    if (response && response.success) {
                        return { message: "Statistics updated: " + (response.tablesProcessed || 0) + " tables" };
                    }
                    throw new Error("Failed to update statistics");
                });
        }

        function executeCheckIntegrity() {
            return adminUtilityService.checkIntegrity()
                .then(function(response) {
                    if (response && response.success) {
                        var issues = response.issuesFound || 0;
                        return { message: `Integrity check completed: ${issues} issues found` };
                    }
                    throw new Error("Integrity check failed");
                });
        }

        function getOperationsByCategory(category) {
            return vm.systemOperations.filter(op => op.category === category);
        }

        // ===================
        // Individual Operation Functions
        // ===================

        function activate() {
            console.log("DEBUG: " + controllerId + " activate() called", {
                timestamp: new Date().toISOString(),
                initialSystemStatus: vm.systemStatus,
                controllerId: controllerId
            });
            
            var promises = [
                loadSystemStatus()
            ];
            
            // Load system operations configuration
            loadSystemOperations();
            
            console.log("DEBUG: Starting controller activation with promises", {
                promiseCount: promises.length,
                controllerId: controllerId
            });
            
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation() {
                console.log("DEBUG: Controller activation completed", {
                    controllerId: controllerId,
                    systemStatus: vm.systemStatus,
                    activationTimestamp: new Date().toISOString()
                });
                log("Activated System Utilities Management View", controllerId, config.showDevToasts);
            }
        }

        function clearCache() {
            console.log("DEBUG: clearCache() function entry point", {
                controllerId: controllerId,
                currentState: vm.isClearingCache,
                timestamp: new Date().toISOString(),
                dlgService: !!dlg,
                dlgConfirmationDialog: !!dlg.confirmationDialog
            });

            // Add immediate visual feedback
            console.log("DEBUG: About to show confirmation dialog", {
                dialogTitle: "Clear Cache",
                dialogMessage: "Are you sure you want to clear the system cache?"
            });

            showCustomConfirmationDialog(
                "Clear Cache",
                "Are you sure you want to clear the system cache?",
                "Yes, Clear Cache",
                "Cancel",
                function() {
                    console.log("DEBUG: clearCache() confirmed by user", {
                        controllerId: controllerId,
                        userConfirmation: true
                    });
                    
                    vm.isClearingCache = true;
                    log("Clearing system cache...");
                    
                    // Real API call to clear system cache
                    adminUtilityService.clearCache()
                        .then(function(response) {
                            console.log("DEBUG: Clear cache response", {
                                response: response,
                                controllerId: controllerId,
                                success: response.success,
                                itemsCleared: response.itemsCleared || 0
                            });
                            
                            if (response.success) {
                                var message = `System cache cleared successfully - ${response.itemsCleared || 0} items removed`;
                                logSuccess(message);
                                vm.lastOperationResult = {
                                    operation: 'Clear Cache',
                                    success: true,
                                    message: message,
                                    timestamp: new Date()
                                };
                            } else {
                                var errorMessage = "Failed to clear cache: " + response.message;
                                logError(errorMessage);
                                vm.lastOperationResult = {
                                    operation: 'Clear Cache',
                                    success: false,
                                    message: errorMessage,
                                    timestamp: new Date()
                                };
                            }
                        })
                        .catch(function(error) {
                            console.error("DEBUG: Clear cache error", {
                                error: error,
                                controllerId: controllerId,
                                errorMessage: error.message
                            });
                            
                            var errorMessage = "Error clearing cache: " + error.message;
                            logError(errorMessage);
                            vm.lastOperationResult = {
                                operation: 'Clear Cache',
                                success: false,
                                message: errorMessage,
                                timestamp: new Date()
                            };
                        })
                        .finally(function() {
                            console.log("DEBUG: Clear cache operation completed", {
                                controllerId: controllerId,
                                finalState: vm.isClearingCache,
                                operationResult: vm.lastOperationResult
                            });
                            vm.isClearingCache = false;
                        });
                }
            );
        }

        function rebuildIndexes() {
            console.log("DEBUG: rebuildIndexes() function entry point", {
                controllerId: controllerId,
                currentState: vm.isRebuildingIndexes,
                timestamp: new Date().toISOString(),
                dlgService: !!dlg,
                dlgConfirmationDialog: !!dlg.confirmationDialog
            });

            // Add immediate visual feedback
            console.log("DEBUG: About to show rebuild indexes confirmation dialog", {
                dialogTitle: "Rebuild Indexes",
                dialogMessage: "Rebuilding indexes may take several minutes. Continue?"
            });

            showCustomConfirmationDialog(
                "Rebuild Indexes",
                "Rebuilding indexes may take several minutes. Continue?",
                "Yes, Rebuild",
                "Cancel",
                function() {
                    console.log("DEBUG: rebuildIndexes() confirmed by user", {
                        controllerId: controllerId,
                        userConfirmation: true
                    });
                    
                    vm.isRebuildingIndexes = true;
                    log("Rebuilding database indexes...");
                    
                    // Real API call to rebuild indexes
                    adminUtilityService.rebuildIndexes()
                        .then(function(response) {
                            console.log("DEBUG: Rebuild indexes response", {
                                response: response,
                                controllerId: controllerId,
                                success: response.success,
                                indexesProcessed: response.indexesProcessed || 0
                            });
                            
                            if (response.success) {
                                var message = `Database indexes rebuilt successfully for ${response.indexesProcessed || 0} databases`;
                                logSuccess(message);
                                vm.lastOperationResult = {
                                    operation: 'Rebuild Indexes',
                                    success: true,
                                    message: message,
                                    timestamp: new Date()
                                };
                            } else {
                                var errorMessage = "Failed to rebuild indexes: " + response.message;
                                logError(errorMessage);
                                vm.lastOperationResult = {
                                    operation: 'Rebuild Indexes',
                                    success: false,
                                    message: errorMessage,
                                    timestamp: new Date()
                                };
                                
                                if (response.errors && response.errors.length > 0) {
                                    response.errors.forEach(function(error) {
                                        console.error("DEBUG: Index rebuild error detail", {
                                            error: error,
                                            controllerId: controllerId
                                        });
                                        logError("Index rebuild error: " + error);
                                    });
                                }
                            }
                        })
                        .catch(function(error) {
                            console.error("DEBUG: Rebuild indexes error", {
                                error: error,
                                controllerId: controllerId,
                                errorMessage: error.message
                            });
                            
                            var errorMessage = "Error rebuilding indexes: " + error.message;
                            logError(errorMessage);
                            vm.lastOperationResult = {
                                operation: 'Rebuild Indexes',
                                success: false,
                                message: errorMessage,
                                timestamp: new Date()
                            };
                        })
                        .finally(function() {
                            console.log("DEBUG: Rebuild indexes operation completed", {
                                controllerId: controllerId,
                                finalState: vm.isRebuildingIndexes,
                                operationResult: vm.lastOperationResult
                            });
                            vm.isRebuildingIndexes = false;
                        });
                }
            );
        }

        function updateStatistics() {
            console.log("DEBUG: updateStatistics() function entry point", {
                controllerId: controllerId,
                currentState: vm.isUpdatingStatistics,
                timestamp: new Date().toISOString(),
                adminUtilityServiceAvailable: !!adminUtilityService,
                updateStatisticsMethod: !!adminUtilityService.updateStatistics
            });
            
            // Custom confirmation dialog using the same pattern as database restore
            showCustomConfirmationDialog("Update Database Statistics", 
                "This will update statistics for all databases. This operation may take several minutes. Are you sure you want to continue?",
                "Update Statistics", 
                "Cancel",
                function() {
                    // Confirmation callback
                    console.log("DEBUG: User confirmed statistics update", {
                        operation: "Update Database Statistics",
                        timestamp: new Date().toISOString(),
                        controllerId: controllerId
                    });
                    
                    // Add immediate visual feedback
                    console.log("DEBUG: Starting update statistics operation", {
                        operation: "Update Database Statistics",
                        currentState: vm.isUpdatingStatistics
                    });
                    
                    vm.isUpdatingStatistics = true;
                    log("Updating database statistics...");
                    
                    // Real API call to update statistics
                    adminUtilityService.updateStatistics()
                        .then(function(response) {
                            console.log("DEBUG: Update statistics response", {
                                response: response,
                                controllerId: controllerId,
                                success: response.success,
                                tablesProcessed: response.tablesProcessed || 0
                            });
                            
                            if (response.success) {
                                var message = `Database statistics updated successfully for ${response.tablesProcessed || 0} databases`;
                                logSuccess(message);
                                vm.lastOperationResult = {
                                    operation: 'Update Statistics',
                                    success: true,
                                    message: message,
                                    timestamp: new Date()
                                };
                                loadSystemStatus(); // Refresh system status after updating statistics
                            } else {
                                var errorMessage = "Failed to update statistics: " + response.message;
                                logError(errorMessage);
                                vm.lastOperationResult = {
                                    operation: 'Update Statistics',
                                    success: false,
                                    message: errorMessage,
                                    timestamp: new Date()
                                };
                            }
                        })
                        .catch(function(error) {
                            console.error("DEBUG: Update statistics error", {
                                error: error,
                                controllerId: controllerId,
                                errorMessage: error.message
                            });
                            
                            var errorMessage = "Error updating statistics: " + error.message;
                            logError(errorMessage);
                            vm.lastOperationResult = {
                                operation: 'Update Statistics',
                                success: false,
                                message: errorMessage,
                                timestamp: new Date()
                            };
                        })
                        .finally(function() {
                            console.log("DEBUG: Update statistics operation completed", {
                                controllerId: controllerId,
                                finalState: vm.isUpdatingStatistics,
                                operationResult: vm.lastOperationResult
                            });
                            vm.isUpdatingStatistics = false;
                        });
                }
            );
        }

        function checkIntegrity() {
            console.log("DEBUG: checkIntegrity() function entry point", {
                controllerId: controllerId,
                currentState: vm.isCheckingIntegrity,
                timestamp: new Date().toISOString(),
                adminUtilityServiceAvailable: !!adminUtilityService,
                checkIntegrityMethod: !!adminUtilityService.checkIntegrity
            });
            
            // Custom confirmation dialog using the same pattern as database restore
            showCustomConfirmationDialog("Check Database Integrity", 
                "This will check the integrity of all databases. This operation may take several minutes. Are you sure you want to continue?",
                "Check Integrity", 
                "Cancel",
                function() {
                    // Confirmation callback
                    console.log("DEBUG: User confirmed integrity check", {
                        operation: "Check Database Integrity",
                        timestamp: new Date().toISOString(),
                        controllerId: controllerId
                    });
                    
                    // Add immediate visual feedback
                    console.log("DEBUG: Starting check integrity operation", {
                        operation: "Check Database Integrity",
                        currentState: vm.isCheckingIntegrity
                    });
                    
                    vm.isCheckingIntegrity = true;
                    log("Checking database integrity...");
                    
                    // Real API call to check integrity
                    adminUtilityService.checkIntegrity()
                .then(function(response) {
                    console.log("DEBUG: Check integrity response", {
                        response: response,
                        controllerId: controllerId,
                        success: response.success,
                        databasesChecked: response.databasesChecked || 0
                    });
                    
                    if (response.success) {
                        var message;
                        if (response.issuesFound && response.issuesFound > 0) {
                            message = `Database integrity check completed - ${response.issuesFound} issues found and ${response.issuesFixed || 0} fixed`;
                            logSuccess(message);
                        } else {
                            message = `Database integrity check completed successfully for ${response.databasesChecked || 0} databases - No issues found`;
                            logSuccess(message);
                        }
                        
                        vm.lastOperationResult = {
                            operation: 'Check Integrity',
                            success: true,
                            message: message,
                            timestamp: new Date()
                        };
                    } else {
                        var errorMessage = "Failed to check integrity: " + response.message;
                        logError(errorMessage);
                        vm.lastOperationResult = {
                            operation: 'Check Integrity',
                            success: false,
                            message: errorMessage,
                            timestamp: new Date()
                        };
                        
                        if (response.errors && response.errors.length > 0) {
                            response.errors.forEach(function(error) {
                                console.error("DEBUG: Integrity check error detail", {
                                    error: error,
                                    controllerId: controllerId
                                });
                                logError("Integrity check error: " + error);
                            });
                        }
                    }
                })
                .catch(function(error) {
                    console.error("DEBUG: Check integrity error", {
                        error: error,
                        controllerId: controllerId,
                        errorMessage: error.message
                    });
                    
                    var errorMessage = "Error checking integrity: " + error.message;
                    logError(errorMessage);
                    vm.lastOperationResult = {
                        operation: 'Check Integrity',
                        success: false,
                        message: errorMessage,
                        timestamp: new Date()
                    };
                })
                .finally(function() {
                    console.log("DEBUG: Check integrity operation completed", {
                        controllerId: controllerId,
                        finalState: vm.isCheckingIntegrity,
                        operationResult: vm.lastOperationResult
                    });
                    vm.isCheckingIntegrity = false;
                });
                }
            );
        }

        function loadSystemStatus() {
            console.log("DEBUG: loadSystemStatus() called", {
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });
            
            // Real API call to get system status
            return adminUtilityService.getSystemStatus()
                .then(function(response) {
                    console.log("DEBUG: System status response", {
                        response: response,
                        controllerId: controllerId,
                        dataReceived: !!response
                    });
                    
                    if (response) {
                        vm.systemStatus = response;
                        console.log("DEBUG: System status updated", {
                            systemStatus: vm.systemStatus,
                            controllerId: controllerId
                        });
                    } else {
                        console.warn("DEBUG: No system status data received", {
                            response: response,
                            controllerId: controllerId
                        });
                    }
                    
                    return response;
                })
                .catch(function(error) {
                    console.error("DEBUG: Error loading system status", {
                        error: error,
                        controllerId: controllerId,
                        errorMessage: error.message
                    });
                    logError("Error loading system status: " + error.message);
                    throw error;
                });
        }

        function refreshSystemStatus() {
            console.log("DEBUG: refreshSystemStatus() called", {
                controllerId: controllerId,
                currentRefreshState: vm.isRefreshingStatus,
                timestamp: new Date().toISOString()
            });
            
            vm.isRefreshingStatus = true;
            log("Refreshing system status...");
            
            loadSystemStatus()
                .then(function(data) {
                    console.log("DEBUG: System status refresh completed", {
                        data: data,
                        controllerId: controllerId,
                        refreshSuccess: true
                    });
                    logSuccess("System status refreshed successfully");
                })
                .catch(function(error) {
                    console.error("DEBUG: System status refresh failed", {
                        error: error,
                        controllerId: controllerId,
                        errorMessage: error.message
                    });
                    logError("Failed to refresh system status: " + error.message);
                })
                .finally(function() {
                    console.log("DEBUG: System status refresh operation completed", {
                        controllerId: controllerId,
                        finalRefreshState: vm.isRefreshingStatus
                    });
                    vm.isRefreshingStatus = false;
                });
        }
        
        // Custom dialog helper function to avoid logout issues (elegant dark style)
        function showCustomConfirmationDialog(title, message, confirmText, cancelText, onConfirm) {
            var dialogId = 'customConfirmDialog_' + new Date().getTime();
            var dialogHtml = `
                <div class="modal fade" id="${dialogId}" tabindex="-1" role="dialog">
                    <div class="modal-dialog modal-sm" role="document">
                        <div class="modal-content">
                            <div class="modal-header" style="background-color: #337ab7; color: white;">
                                <h4 class="modal-title">
                                    <i class="fa fa-question-circle"></i> 
                                    ${title}
                                </h4>
                            </div>
                            <div class="modal-body">
                                <p>${message}</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-default btn-sm" id="${dialogId}_cancel">
                                    <i class="fa fa-times"></i> ${cancelText}
                                </button>
                                <button type="button" class="btn btn-primary btn-sm" id="${dialogId}_confirm">
                                    <i class="fa fa-check"></i> ${confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove any existing modal
            $('#' + dialogId).remove();
            
            // Add modal to body
            $('body').append(dialogHtml);
            
            // Show the modal
            $('#' + dialogId).modal('show');
            
            // Handle cancel button
            $('#' + dialogId + '_cancel').on('click', function() {
                $('#' + dialogId).modal('hide');
                console.log("DEBUG: Custom dialog cancelled", {
                    title: title,
                    controllerId: controllerId
                });
            });
            
            // Handle confirm button
            $('#' + dialogId + '_confirm').on('click', function() {
                $('#' + dialogId).modal('hide');
                console.log("DEBUG: Custom dialog confirmed", {
                    title: title,
                    controllerId: controllerId
                });
                
                if (onConfirm && typeof onConfirm === 'function') {
                    onConfirm();
                }
            });
            
            // Clean up when modal is hidden
            $('#' + dialogId).on('hidden.bs.modal', function() {
                $(this).remove();
            });
        }
    }
})();
