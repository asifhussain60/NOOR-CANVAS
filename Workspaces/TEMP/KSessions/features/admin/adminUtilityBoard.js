(function () {
    "use strict";
    var controllerId = "adminUtilityBoardCtl";
    angular.module("app").controller(controllerId,
        ["$scope", "common", "bootstrap.dialog", "config", "adminUtilityService", adminUtilityBoardCtl]);

    function adminUtilityBoardCtl($scope, common, dlg, config, adminUtilityService) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;

        vm.backupType = 'full';
        vm.includeUserData = true;
        vm.includeSystemData = true;
        vm.isCreatingBackup = false;
        vm.recentBackups = [];
        vm.systemStatus = {
            databaseSize: 'Loading...',
            freeSpace: 'Loading...',
            lastBackup: 'Loading...',
            health: 'good'
        };

        // Comprehensive Backup Properties
        vm.comprehensiveBackup = {
            includeDatabase: true,
            createDevEnvironment: true, // Checked by default
            backupType: 'full'
        };
        vm.backupProgress = {
            isActive: false,
            stage: '',
            message: '',
            percentComplete: 0,
            details: {},
            currentStep: '',
            totalSteps: 0,
            completedSteps: 0,
            stepProgress: 0,
            estimatedTimeRemaining: '',
            startTime: null,
            operationType: '', // 'backup' or 'rollback'
            
            // Checklist-based progress tracking
            checklist: [
                { id: 'init', name: 'Initialize Backup', status: 'pending', message: 'Preparing backup process...', icon: '🚀' },
                { id: 'resources', name: 'Sync Resources', status: 'pending', message: 'Synchronizing application files...', icon: '📁' },
                { id: 'database', name: 'Backup Database', status: 'pending', message: 'Creating database backup...', icon: '💾' },
                { id: 'dev', name: 'DEV Environment', status: 'pending', message: 'Creating development environment...', icon: '🔧' },
                { id: 'complete', name: 'Finalize', status: 'pending', message: 'Completing backup process...', icon: '✅' }
            ],
            pollingInterval: null
        };
        vm.currentBackupId = null;
        vm.signalRConnection = null;

        // Backup completion status
        vm.lastBackupResult = null; // Will store success/failure information

        // Git Properties
        vm.gitCommitMessage = '';
        vm.gitStatus = {
            currentBranch: 'Loading...',
            hasUncommittedChanges: false,
            uncommittedFilesCount: 0,
            hasLocalCommits: false,
            localCommitsCount: 0,
            lastCommit: null
        };
        vm.isProcessingGit = false;
        vm.isCommittingLocal = false;
        vm.isPushingRemote = false;
        vm.isCommittingAndPushing = false;
        vm.isRefreshingGit = false;

        // System Utilities Loading States
        vm.isClearingCache = false;
        vm.isRebuildingIndexes = false;
        vm.isUpdatingStatistics = false;
        vm.isCheckingIntegrity = false;

        vm.createBackup = createBackup;
        vm.createComprehensiveBackup = createComprehensiveBackup;
        vm.rollbackBackup = rollbackBackup;
        vm.cancelBackup = cancelBackup;
        vm.downloadBackup = downloadBackup;
        vm.clearCache = clearCache;
        vm.rebuildIndexes = rebuildIndexes;
        vm.updateStatistics = updateStatistics;
        vm.checkIntegrity = checkIntegrity;
        vm.refreshSystemStatus = refreshSystemStatus;
        vm.refreshBackupStatus = refreshBackupStatus;

        vm.refreshGitStatus = refreshGitStatus;
        vm.commitToLocal = commitToLocal;
        vm.pushToRemote = pushToRemote;
        vm.commitAndPush = commitAndPush;

        vm.config = config; // Expose config object for template binding
        vm.toggleDebugMode = toggleDebugMode;
        vm.toggleDevToasts = toggleDevToasts;
        vm.clearBrowserCache = clearBrowserCache;

        activate();

        function activate() {
            console.log("DEBUG: adminUtilityBoardCtl activate() called");
            var promises = [
                loadRecentBackups(),
                loadSystemStatus(),
                refreshGitStatus()
            ];
            
            console.log("DEBUG: Starting controller activation with promises", promises.length);
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation() {
                console.log("DEBUG: Controller activation completed", {
                    controllerId: controllerId,
                    gitStatus: vm.gitStatus,
                    systemStatus: vm.systemStatus,
                    recentBackupsCount: vm.recentBackups.length
                });
                log("Activated Admin Utility Board View", controllerId, config.showDevToasts);
            }
        }

        function createBackup() {
            vm.isCreatingBackup = true;
            
            var backupData = {
                backupType: vm.backupType,
                includeUserData: vm.includeUserData,
                includeSystemData: vm.includeSystemData
            };

            console.log("DEBUG: createBackup() called", {
                backupData: backupData,
                timestamp: new Date().toISOString()
            });

            // Real API call to create database backup
            adminUtilityService.createDatabaseBackup(backupData)
                .then(function(response) {
                    console.log("DEBUG: Backup creation response", response);
                    if (response.success) {
                        logSuccess("Backup created successfully");
                        loadRecentBackups();
                    } else {
                        logError("Failed to create backup: " + response.message);
                    }
                })
                .catch(function(error) {
                    console.error("DEBUG: Backup creation error", error);
                    logError("Error creating backup: " + error.message);
                })
                .finally(function() {
                    console.log("DEBUG: Backup creation completed");
                    vm.isCreatingBackup = false;
                });
        }

        // ===== COMPREHENSIVE BACKUP METHODS =====

        function createComprehensiveBackup() {
            console.log("DEBUG: createComprehensiveBackup() called", {
                comprehensiveBackupOptions: vm.comprehensiveBackup,
                timestamp: new Date().toISOString()
            });

            // Clear any previous completion status
            vm.lastBackupResult = null;

            // Initialize checklist-based progress
            vm.backupProgress.isActive = true;
            vm.backupProgress.stage = 'Initializing';
            vm.backupProgress.message = 'Starting comprehensive backup...';
            vm.backupProgress.percentComplete = 0;
            vm.backupProgress.startTime = new Date();
            vm.backupProgress.operationType = 'backup';
            vm.backupProgress.estimatedTimeRemaining = 'Calculating...';
            
            // Reset checklist
            resetBackupChecklist();
            updateChecklistItem('init', 'active', 'Preparing comprehensive backup...');

            // Start backup without SignalR dependency
            var backupRequest = angular.copy(vm.comprehensiveBackup);
            // Remove connectionId since we're not using SignalR
            delete backupRequest.connectionId;

            console.log("DEBUG: Starting backup with polling method:", {
                backupRequest: backupRequest,
                timestamp: new Date().toISOString()
            });

            adminUtilityService.createComprehensiveBackup(backupRequest)
                .then(function(response) {
                    console.log("DEBUG: Comprehensive backup started", response);
                    vm.currentBackupId = response.backupId;
                    
                    updateChecklistItem('init', 'completed', 'Backup process initialized successfully');
                    vm.backupProgress.percentComplete = 10;
                    
                    // Start polling for progress updates
                    startBackupPolling();
                    
                    logSuccess("Comprehensive backup started successfully. Monitor progress below.");
                })
                .catch(function(error) {
                    console.error("DEBUG: Comprehensive backup start failed", error);
                    vm.backupProgress.isActive = false;
                    updateChecklistItem('init', 'error', 'Failed to start backup: ' + (error.message || 'Unknown error'));
                    logError("Error starting comprehensive backup: " + (error.data ? error.data.message : error.message));
                });
        }

        function rollbackBackup(backup) {
            console.log("DEBUG: rollbackBackup() called", {
                backup: backup,
                timestamp: new Date().toISOString()
            });

            // Confirm dangerous operation
            var confirmMessage = "This will restore the system to backup '" + backup.fileName + "'. " +
                                "All recent changes will be lost. Are you sure you want to proceed?";
            
            if (!confirm(confirmMessage)) {
                console.log("DEBUG: Rollback cancelled by user");
                return;
            }

            vm.backupProgress.isActive = true;
            vm.backupProgress.stage = 'Rollback Initializing';
            vm.backupProgress.message = 'Preparing rollback process...';
            vm.backupProgress.percentComplete = 0;
            vm.backupProgress.startTime = new Date();
            vm.backupProgress.operationType = 'rollback';
            vm.backupProgress.estimatedTimeRemaining = 'Calculating...';

            var rollbackRequest = {
                backupId: backup.fileName,
                restoreDatabase: true,
                restoreResources: true
            };

            adminUtilityService.rollbackBackup(rollbackRequest)
                .then(function(response) {
                    console.log("DEBUG: Rollback started", response);
                    vm.backupProgress.stage = 'Rollback Started';
                    vm.backupProgress.message = response.message;
                    vm.backupProgress.percentComplete = 5;
                    
                    logSuccess("Rollback process started. Monitor progress below.");
                })
                .catch(function(error) {
                    console.error("DEBUG: Rollback start failed", error);
                    vm.backupProgress.isActive = false;
                    vm.backupProgress.stage = 'Error';
                    vm.backupProgress.message = 'Failed to start rollback';
                    logError("Error starting rollback: " + (error.data ? error.data.message : error.message));
                });
        }

        function cancelBackup() {
            console.log("DEBUG: cancelBackup() called");
            
            if (confirm("Are you sure you want to cancel the backup operation?")) {
                // Stop polling
                if (vm.backupProgress.pollingInterval) {
                    clearInterval(vm.backupProgress.pollingInterval);
                    vm.backupProgress.pollingInterval = null;
                }
                
                vm.backupProgress.isActive = false;
                vm.backupProgress.stage = 'Cancelled';
                vm.backupProgress.message = 'Backup operation cancelled by user';
                vm.currentBackupId = null;
                
                // Update checklist to show cancellation
                var activeItem = vm.backupProgress.checklist.find(function(item) {
                    return item.status === 'active';
                });
                if (activeItem) {
                    updateChecklistItem(activeItem.id, 'cancelled', 'Operation cancelled by user');
                }
                
                logSuccess("Backup operation cancelled");
            }
        }

        function resetBackupChecklist() {
            console.log("DEBUG: resetBackupChecklist() called");
            
            vm.backupProgress.checklist.forEach(function(item) {
                item.status = 'pending';
                item.message = item.name;
            });
            
            // Adjust checklist based on operation type and options
            if (vm.backupProgress.operationType === 'backup') {
                // Show/hide DEV environment step based on user selection
                var devItem = vm.backupProgress.checklist.find(function(item) { return item.id === 'dev'; });
                if (devItem) {
                    devItem.hidden = !vm.comprehensiveBackup.createDevEnvironment;
                }
            }
        }

        function updateChecklistItem(itemId, status, message) {
            console.log("DEBUG: updateChecklistItem() called", {
                itemId: itemId,
                status: status,
                message: message
            });
            
            var item = vm.backupProgress.checklist.find(function(checklist) {
                return checklist.id === itemId;
            });
            
            if (item) {
                item.status = status;
                if (message) {
                    item.message = message;
                }
                
                console.log("DEBUG: Checklist item updated", {
                    itemId: itemId,
                    newStatus: status,
                    newMessage: item.message
                });
                
                // Force UI update
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }
        }

        function startBackupPolling() {
            console.log("DEBUG: startBackupPolling() called", {
                backupId: vm.currentBackupId,
                pollingInterval: vm.backupProgress.pollingInterval
            });
            
            // Clear any existing polling
            if (vm.backupProgress.pollingInterval) {
                clearInterval(vm.backupProgress.pollingInterval);
            }
            
            // Initialize polling counter and timeout
            vm.backupProgress.pollCount = 0;
            vm.backupProgress.maxPolls = 450; // 15 minutes @ 2 second intervals
            
            // Poll every 2 seconds for backup status
            vm.backupProgress.pollingInterval = setInterval(function() {
                vm.backupProgress.pollCount++;
                
                // Safety timeout after 15 minutes of polling
                if (vm.backupProgress.pollCount >= vm.backupProgress.maxPolls) {
                    console.warn("DEBUG: Backup polling timed out after 15 minutes");
                    logError("Backup monitoring timed out. Please check backup status manually.");
                    
                    if (vm.backupProgress.pollingInterval) {
                        clearInterval(vm.backupProgress.pollingInterval);
                        vm.backupProgress.pollingInterval = null;
                    }
                    vm.backupProgress.isActive = false;
                    return;
                }
                
                checkBackupStatus();
            }, 2000);
            
            // Start first check immediately
            checkBackupStatus();
        }

        function checkBackupStatus() {
            if (!vm.currentBackupId || !vm.backupProgress.isActive) {
                console.log("DEBUG: checkBackupStatus() - backup not active, stopping polling");
                if (vm.backupProgress.pollingInterval) {
                    clearInterval(vm.backupProgress.pollingInterval);
                    vm.backupProgress.pollingInterval = null;
                }
                return;
            }
            
            console.log("DEBUG: checkBackupStatus() called", {
                backupId: vm.currentBackupId,
                timestamp: new Date().toISOString(),
                pollCount: vm.backupProgress.pollCount || 0
            });
            
            adminUtilityService.getBackupStatus(vm.currentBackupId)
                .then(function(response) {
                    console.log("DEBUG: Backup status response", response);
                    
                    // Force refresh if we haven't seen progress in a while
                    if (vm.backupProgress.pollCount > 60 && response.percentComplete === vm.backupProgress.percentComplete) {
                        console.warn("DEBUG: No progress detected for 2 minutes, forcing refresh");
                        // Try one more time with a forced cache bypass
                        return adminUtilityService.getBackupStatus(vm.currentBackupId);
                    }
                    
                    return response;
                })
                .then(function(response) {
                    updateBackupProgress(response);
                })
                .catch(function(error) {
                    console.error("DEBUG: Error checking backup status", error);
                    vm.backupProgress.errorCount = (vm.backupProgress.errorCount || 0) + 1;
                    
                    // Stop polling after 5 consecutive errors
                    if (vm.backupProgress.errorCount >= 5) {
                        console.error("DEBUG: Too many consecutive errors, stopping polling");
                        logError("Backup monitoring failed due to repeated errors. Please check backup status manually.");
                        
                        if (vm.backupProgress.pollingInterval) {
                            clearInterval(vm.backupProgress.pollingInterval);
                            vm.backupProgress.pollingInterval = null;
                        }
                        vm.backupProgress.isActive = false;
                    }
                });
        }

        function updateBackupProgress(status) {
            console.log("DEBUG: updateBackupProgress() called", {
                status: status,
                currentStage: vm.backupProgress.stage,
                pollCount: vm.backupProgress.pollCount || 0
            });
            
            // Reset error count on successful response
            vm.backupProgress.errorCount = 0;
            
            vm.backupProgress.stage = status.stage || vm.backupProgress.stage;
            vm.backupProgress.message = status.message || vm.backupProgress.message;
            vm.backupProgress.percentComplete = status.percentComplete || vm.backupProgress.percentComplete;
            
            // Update checklist based on current stage
            switch (status.stage) {
                case 'Resource Synchronization':
                case 'File Synchronization':
                    updateChecklistItem('resources', 'active', status.message);
                    vm.backupProgress.percentComplete = Math.max(vm.backupProgress.percentComplete, 20);
                    break;
                    
                case 'Database Backup':
                    updateChecklistItem('resources', 'completed', 'Resource synchronization completed');
                    updateChecklistItem('database', 'active', status.message);
                    vm.backupProgress.percentComplete = Math.max(vm.backupProgress.percentComplete, 50);
                    break;
                    
                case 'DEV Environment':
                    updateChecklistItem('database', 'completed', 'Database backup completed');
                    if (!vm.backupProgress.checklist.find(function(item) { return item.id === 'dev'; }).hidden) {
                        updateChecklistItem('dev', 'active', status.message);
                    }
                    vm.backupProgress.percentComplete = Math.max(vm.backupProgress.percentComplete, 80);
                    break;
                    
                case 'Completed':
                case 'SUCCESS':
                    updateChecklistItem('database', 'completed', 'Database backup completed');
                    if (!vm.backupProgress.checklist.find(function(item) { return item.id === 'dev'; }).hidden) {
                        updateChecklistItem('dev', 'completed', 'DEV environment created');
                    }
                    updateChecklistItem('complete', 'completed', 'Backup completed successfully!');
                    vm.backupProgress.percentComplete = 100;
                    vm.backupProgress.isActive = false;
                    vm.backupProgress.estimatedTimeRemaining = 'Completed';
                    
                    // Set completion status
                    vm.lastBackupResult = {
                        success: true,
                        timestamp: new Date(),
                        message: 'Comprehensive backup completed successfully!',
                        details: status.message || 'All backup operations completed without errors.'
                    };
                    
                    // Stop polling
                    if (vm.backupProgress.pollingInterval) {
                        clearInterval(vm.backupProgress.pollingInterval);
                        vm.backupProgress.pollingInterval = null;
                    }
                    
                    logSuccess("Backup completed successfully!");
                    loadRecentBackups(); // Refresh backup list
                    break;
                    
                case 'Error':
                    var activeItem = vm.backupProgress.checklist.find(function(item) {
                        return item.status === 'active';
                    });
                    if (activeItem) {
                        updateChecklistItem(activeItem.id, 'error', status.message || 'An error occurred');
                    }
                    vm.backupProgress.isActive = false;
                    
                    // Set completion status for error
                    vm.lastBackupResult = {
                        success: false,
                        timestamp: new Date(),
                        message: 'Backup failed',
                        details: status.message || 'An unknown error occurred during the backup process.'
                    };
                    
                    // Stop polling
                    if (vm.backupProgress.pollingInterval) {
                        clearInterval(vm.backupProgress.pollingInterval);
                        vm.backupProgress.pollingInterval = null;
                    }
                    
                    logError("Backup failed: " + (status.message || 'Unknown error'));
                    break;
            }
            
            // Calculate estimated time remaining
            if (vm.backupProgress.startTime && vm.backupProgress.percentComplete > 0 && vm.backupProgress.percentComplete < 100) {
                var elapsed = (new Date() - vm.backupProgress.startTime) / 1000; // seconds
                var estimatedTotal = (elapsed * 100) / vm.backupProgress.percentComplete;
                var remaining = estimatedTotal - elapsed;
                
                if (remaining > 60) {
                    vm.backupProgress.estimatedTimeRemaining = Math.round(remaining / 60) + ' minutes';
                } else if (remaining > 0) {
                    vm.backupProgress.estimatedTimeRemaining = Math.round(remaining) + ' seconds';
                } else {
                    vm.backupProgress.estimatedTimeRemaining = 'Almost done';
                }
            }
            
            // Force UI update
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }

        function downloadBackup(backup) {
            console.log("DEBUG: downloadBackup() called", {
                backup: backup,
                backupId: backup.id
            });
            
            log("Downloading backup: " + backup.filename);
            
            // Use adminUtilityService to get download URL
            var downloadUrl = adminUtilityService.downloadBackup(backup.id);
            
            // Trigger download by opening URL in new window
            window.open(downloadUrl, '_blank');
            
            logSuccess("Download initiated for " + backup.filename);
        }

        function clearCache() {
            dlg.confirmationDialog("Clear Cache", 
                "Are you sure you want to clear the system cache?\n\nThis will remove temporary files and cached data to improve performance.",
                "Yes, Clear Cache", "Cancel")
                .then(function(result) {
                    if (result !== "ok") return;
                    
                    console.log("DEBUG: clearCache() confirmed by user");
                    vm.isClearingCache = true;
                    log("Clearing system cache...");
                    
                    // Real API call to clear system cache
                    adminUtilityService.clearCache()
                        .then(function(response) {
                            console.log("DEBUG: Clear cache response", response);
                            if (response.success) {
                                logSuccess(`System cache cleared successfully - ${response.itemsCleared || 0} items removed`);
                            } else {
                                logError("Failed to clear cache: " + response.message);
                            }
                        })
                        .catch(function(error) {
                            console.error("DEBUG: Clear cache error", error);
                            logError("Error clearing cache: " + error.message);
                        })
                        .finally(function() {
                            vm.isClearingCache = false;
                        });
                });
        }

        function rebuildIndexes() {
            dlg.confirmationDialog("Rebuild Indexes", 
                "Rebuilding database indexes may take several minutes to complete.\n\nThis operation will optimize database performance but may temporarily slow the system.",
                "Yes, Rebuild", "Cancel")
                .then(function(result) {
                    if (result !== "ok") return;
                    
                    console.log("DEBUG: rebuildIndexes() confirmed by user");
                    vm.isRebuildingIndexes = true;
                    log("Rebuilding database indexes...");
                    
                    // Real API call to rebuild indexes
                    adminUtilityService.rebuildIndexes()
                        .then(function(response) {
                            console.log("DEBUG: Rebuild indexes response", response);
                            if (response.success) {
                                logSuccess(`Database indexes rebuilt successfully for ${response.indexesProcessed || 0} databases`);
                            } else {
                                logError("Failed to rebuild indexes: " + response.message);
                                if (response.errors && response.errors.length > 0) {
                                    response.errors.forEach(function(error) {
                                        logError("Index rebuild error: " + error);
                                    });
                                }
                            }
                        })
                        .catch(function(error) {
                            console.error("DEBUG: Rebuild indexes error", error);
                            logError("Error rebuilding indexes: " + error.message);
                        })
                        .finally(function() {
                            vm.isRebuildingIndexes = false;
                        });
                });
        }

        function updateStatistics() {
            console.log("DEBUG: updateStatistics() called");
            vm.isUpdatingStatistics = true;
            log("Updating database statistics...");
            
            // Real API call to update statistics
            adminUtilityService.updateStatistics()
                .then(function(response) {
                    console.log("DEBUG: Update statistics response", response);
                    if (response.success) {
                        logSuccess(`Database statistics updated successfully for ${response.tablesProcessed || 0} databases`);
                        loadSystemStatus();
                    } else {
                        logError("Failed to update statistics: " + response.message);
                        if (response.errors && response.errors.length > 0) {
                            response.errors.forEach(function(error) {
                                logError("Statistics update error: " + error);
                            });
                        }
                    }
                })
                .catch(function(error) {
                    console.error("DEBUG: Update statistics error", error);
                    logError("Error updating statistics: " + error.message);
                })
                .finally(function() {
                    vm.isUpdatingStatistics = false;
                });
        }

        function checkIntegrity() {
            console.log("DEBUG: checkIntegrity() called");
            vm.isCheckingIntegrity = true;
            log("Checking database integrity...");
            
            // Real API call to check integrity
            adminUtilityService.checkIntegrity()
                .then(function(response) {
                    console.log("DEBUG: Check integrity response", response);
                    if (response.success) {
                        if (response.issuesFound > 0) {
                            logError(`Database integrity check completed - ${response.issuesFound} issues found`);
                            if (response.results && response.results.length > 0) {
                                response.results.forEach(function(result) {
                                    logError("Integrity result: " + result);
                                });
                            }
                        } else {
                            logSuccess(`Database integrity check completed - No issues found (${response.databasesChecked || 0} databases checked)`);
                        }
                    } else {
                        logError("Failed to check integrity: " + response.message);
                        if (response.errors && response.errors.length > 0) {
                            response.errors.forEach(function(error) {
                                logError("Integrity check error: " + error);
                            });
                        }
                    }
                })
                .catch(function(error) {
                    console.error("DEBUG: Check integrity error", error);
                    logError("Error checking integrity: " + error.message);
                })
                .finally(function() {
                    vm.isCheckingIntegrity = false;
                });
        }

        function loadRecentBackups() {
            console.log("DEBUG: loadRecentBackups() called");
            // Real API call to get recent backups
            return adminUtilityService.getRecentBackups()
                .then(function(response) {
                    console.log("DEBUG: Recent backups API response", response);
                    vm.recentBackups = response;
                })
                .catch(function(error) {
                    console.error("DEBUG: Recent backups API error", error);
                    logError("Error loading recent backups: " + error.message);
                    // Fallback to empty array
                    vm.recentBackups = [];
                });
        }

        function loadSystemStatus() {
            console.log("DEBUG: loadSystemStatus() called");
            // Real API call to get system status
            return adminUtilityService.getSystemStatus()
                .then(function(response) {
                    console.log("DEBUG: System status API response", response);
                    vm.systemStatus = response;
                })
                .catch(function(error) {
                    console.error("DEBUG: System status API error", error);
                    logError("Error loading system status: " + error.message);
                    // Fallback to default values
                    vm.systemStatus = {
                        databaseSize: 'Unknown',
                        freeSpace: 'Unknown',
                        lastBackup: 'Unknown',
                        health: 'unknown'
                    };
                });
        }

        function refreshSystemStatus() {
            log("Refreshing system status...");
            loadSystemStatus();
        }

        // Git Functions
        function refreshGitStatus() {
            vm.isRefreshingGit = true;
            log("Starting Git status refresh...", null, true);
            console.log("DEBUG: refreshGitStatus() called", {
                currentBranch: vm.gitStatus.currentBranch,
                hasUncommittedChanges: vm.gitStatus.hasUncommittedChanges,
                isRefreshingGit: vm.isRefreshingGit
            });
            
            // Real API call to get Git status using adminUtilityService
            return adminUtilityService.getGitStatus()
                .then(function(response) {
                    console.log("DEBUG: Git status API response", response);
                    
                    // Sanitize the branch name for display
                    if (response.currentBranch) {
                        response.currentBranch = sanitizeBranchName(response.currentBranch);
                    }
                    
                    vm.gitStatus = response;
                    logSuccess("Git status refreshed");
                    console.log("DEBUG: refreshGitStatus() completed", {
                        newStatus: vm.gitStatus,
                        isRefreshingGit: vm.isRefreshingGit
                    });
                })
                .catch(function(error) {
                    console.error("DEBUG: Git status API error", error);
                    logError("Error refreshing Git status: " + error.message);
                })
                .finally(function() {
                    console.log("DEBUG: Git status refresh completed");
                    vm.isRefreshingGit = false;
                });
        }

        function sanitizeBranchName(branchName) {
            if (!branchName) return 'unknown';
            
            // Remove excessive whitespace and newlines
            var cleaned = branchName.replace(/\s+/g, ' ').trim();
            
            // If branch name is too long, truncate and add ellipsis
            if (cleaned.length > 50) {
                cleaned = cleaned.substring(0, 47) + '...';
            }
            
            console.log("DEBUG: Branch name sanitized", {
                original: branchName,
                cleaned: cleaned,
                originalLength: branchName.length,
                cleanedLength: cleaned.length
            });
            
            return cleaned;
        }

        function commitToLocal() {
            console.log("DEBUG: commitToLocal() called", {
                commitMessage: vm.gitCommitMessage,
                messageLength: vm.gitCommitMessage ? vm.gitCommitMessage.length : 0,
                currentBranch: vm.gitStatus.currentBranch,
                isProcessingGit: vm.isProcessingGit
            });

            if (!vm.gitCommitMessage.trim()) {
                console.warn("DEBUG: Commit message validation failed", {
                    message: vm.gitCommitMessage,
                    trimmed: vm.gitCommitMessage.trim()
                });
                logError("Please enter a commit message");
                return;
            }

            console.log("DEBUG: Starting local commit process");
            vm.isCommittingLocal = true;
            vm.isProcessingGit = true;
            
            log("Committing changes to local repository...", null, true);
            
            // Real API call to commit to local using adminUtilityService
            var commitData = {
                message: vm.gitCommitMessage,
                branch: vm.gitStatus.currentBranch
            };
            console.log("DEBUG: Sending commit data to API", commitData);
            return adminUtilityService.commitToLocal(vm.gitCommitMessage)
                .then(function(response) {
                    console.log("DEBUG: Commit API response", response);
                    if (response.success) {
                        logSuccess("Changes committed to local repository");
                        vm.gitCommitMessage = '';
                        refreshGitStatus();
                    } else {
                        console.error("DEBUG: Commit failed", response);
                        logError("Failed to commit: " + response.message);
                    }
                })
                .catch(function(error) {
                    console.error("DEBUG: Commit API error", error);
                    logError("Error committing to local: " + error.message);
                })
                .finally(function() {
                    console.log("DEBUG: Commit process completed");
                    vm.isCommittingLocal = false;
                    vm.isProcessingGit = false;
                });
        }

        function pushToRemote() {
            console.log("DEBUG: pushToRemote() called", {
                currentBranch: vm.gitStatus.currentBranch,
                hasLocalCommits: vm.gitStatus.hasLocalCommits,
                localCommitsCount: vm.gitStatus.localCommitsCount,
                isProcessingGit: vm.isProcessingGit
            });

            if (!vm.gitStatus.hasLocalCommits) {
                console.warn("DEBUG: No local commits to push", {
                    hasLocalCommits: vm.gitStatus.hasLocalCommits,
                    localCommitsCount: vm.gitStatus.localCommitsCount
                });
                logError("No local commits to push");
                return;
            }

            console.log("DEBUG: Starting remote push process");
            vm.isPushingRemote = true;
            vm.isProcessingGit = true;
            
            log("Pushing commits to remote repository...", null, true);
            
            // Real API call to push to remote using adminUtilityService
            var pushData = {
                branch: vm.gitStatus.currentBranch,
                commitsCount: vm.gitStatus.localCommitsCount
            };
            console.log("DEBUG: Sending push data to API", pushData);
            return adminUtilityService.pushToRemote()
                .then(function(response) {
                    console.log("DEBUG: Push API response", response);
                    if (response.success) {
                        logSuccess("Commits pushed to remote repository");
                        refreshGitStatus();
                    } else {
                        console.error("DEBUG: Push failed", response);
                        logError("Failed to push: " + response.message);
                    }
                })
                .catch(function(error) {
                    console.error("DEBUG: Push API error", error);
                    logError("Error pushing to remote: " + error.message);
                })
                .finally(function() {
                    console.log("DEBUG: Push process completed");
                    vm.isPushingRemote = false;
                    vm.isProcessingGit = false;
                });
        }

        function commitAndPush() {
            console.log("DEBUG: commitAndPush() called", {
                commitMessage: vm.gitCommitMessage,
                messageLength: vm.gitCommitMessage ? vm.gitCommitMessage.length : 0,
                currentBranch: vm.gitStatus.currentBranch,
                isProcessingGit: vm.isProcessingGit,
                hasUncommittedChanges: vm.gitStatus.hasUncommittedChanges
            });

            if (!vm.gitCommitMessage.trim()) {
                console.warn("DEBUG: Commit and push validation failed", {
                    message: vm.gitCommitMessage,
                    trimmed: vm.gitCommitMessage.trim()
                });
                logError("Please enter a commit message");
                return;
            }

            console.log("DEBUG: Starting commit and push process");
            vm.isCommittingAndPushing = true;
            vm.isProcessingGit = true;
            
            log("Committing and pushing changes...", null, true);
            
            // Real API call for commit and push using adminUtilityService
            var commitData = {
                message: vm.gitCommitMessage,
                branch: vm.gitStatus.currentBranch,
                pushToRemote: true
            };
            console.log("DEBUG: Sending commit and push data to API", commitData);
            return adminUtilityService.commitAndPush(vm.gitCommitMessage)
                .then(function(response) {
                    console.log("DEBUG: Commit and push API response", response);
                    if (response.success) {
                        console.log("DEBUG: Git operation details", {
                            commitHash: response.commitHash,
                            commitMessage: response.commitMessage,
                            branch: response.branch,
                            commitOutput: response.commitOutput,
                            pushOutput: response.pushOutput,
                            timestamp: response.timestamp
                        });
                        logSuccess("Changes committed and pushed successfully. Commit hash: " + (response.commitHash || 'N/A').substring(0, 8));
                        vm.gitCommitMessage = '';
                        refreshGitStatus();
                    } else {
                        console.error("DEBUG: Commit and push failed", response);
                        logError("Failed to commit and push: " + response.message);
                    }
                })
                .catch(function(error) {
                    console.error("DEBUG: Commit and push API error", error);
                    logError("Error committing and pushing: " + error.message);
                })
                .finally(function() {
                    console.log("DEBUG: Commit and push process completed");
                    vm.isCommittingAndPushing = false;
                    vm.isProcessingGit = false;
                });
        }
        
        function refreshBackupStatus() {
            console.log("DEBUG: refreshBackupStatus() called manually", {
                currentBackupId: vm.currentBackupId,
                isActive: vm.backupProgress.isActive
            });
            
            if (!vm.currentBackupId) {
                logError("No active backup to refresh");
                return;
            }
            
            // Force immediate status check
            checkBackupStatus();
            log("Backup status refreshed manually");
        }

        //#region Debug Methods

        function toggleDebugMode() {
            logSuccess("Debug Mode " + (config.debugMode ? "enabled" : "disabled") + 
                      " - Entity IDs will " + (config.debugMode ? "now be shown" : "be hidden") + 
                      " in UI components");
        }

        function toggleDevToasts() {
            logSuccess("Development toasts " + (config.showDevToasts ? "enabled" : "disabled"));
        }

        function clearBrowserCache() {
            logSuccess("Clearing browser cache and reloading page...");
            // Clear localStorage if any debug settings are stored there
            if (typeof(Storage) !== "undefined") {
                localStorage.removeItem('debugSettings');
            }
            // Force a hard reload to clear cached templates and scripts
            window.location.reload(true);
        }

        //#endregion
    }
})();
