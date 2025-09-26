(function () {
    "use strict";
    var controllerId = "adminSqlBackupsCtl";
    angular.module("app").controller(controllerId,
        ["$scope", "common", "bootstrap.dialog", "config", "adminUtilityService", "globalData", "$injector", adminSqlBackupsCtl]);

    function adminSqlBackupsCtl($scope, common, dlg, config, adminUtilityService, gData, $injector) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");
        
        // Environment detection - use multiple methods for reliability
        var isDevelopmentEnvironment = false;
        var detectionMethod = 'unknown';
        var detectionDetails = {};
        
        try {
            // Method 1: Check devLogger if available (most reliable)
            var devLogger = $injector.get('devLogger');
            if (devLogger && typeof devLogger.isDev === 'boolean') {
                isDevelopmentEnvironment = devLogger.isDev;
                detectionMethod = 'devLogger';
                detectionDetails.devLoggerIsDev = devLogger.isDev;
            } else {
                throw new Error('devLogger not available or isDev not boolean');
            }
        } catch (e) {
            detectionDetails.devLoggerError = e.message;
            try {
                // Method 2: Check gData for executionEnv if it exists
                if (gData && gData.executionEnv === 'Development') {
                    isDevelopmentEnvironment = true;
                    detectionMethod = 'gData.executionEnv';
                    detectionDetails.executionEnv = gData.executionEnv;
                } else {
                    throw new Error('gData executionEnv not Development');
                }
            } catch (e2) {
                detectionDetails.gDataError = e2.message;
                try {
                    // Method 3: Check config for development indicators
                    if (config && (config.isDev === true || config.showDevToasts === true)) {
                        isDevelopmentEnvironment = true;
                        detectionMethod = 'config';
                        detectionDetails.configIsDev = config.isDev;
                        detectionDetails.configShowDevToasts = config.showDevToasts;
                    } else {
                        throw new Error('config dev indicators not found');
                    }
                } catch (e3) {
                    detectionDetails.configError = e3.message;
                    // Method 4: Check window location for localhost or development indicators
                    if (typeof window !== 'undefined' && window.location) {
                        var hostname = window.location.hostname.toLowerCase();
                        var port = window.location.port;
                        var pathname = window.location.pathname || '';
                        
                        // Development indicators: localhost, 127.0.0.1, contains 'dev', or non-standard ports
                        var isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
                        var hasDevInHostname = hostname.includes('dev');
                        var isNonStandardPort = port !== '' && port !== '80' && port !== '443';
                        
                        // Production domains - explicit production detection
                        var isProductionDomain = hostname.includes('kashkole.com') || 
                                               hostname.includes('servehttp.com') ||
                                               hostname.includes('session.kashkole.com');
                        
                        detectionMethod = 'hostname';
                        detectionDetails.hostname = hostname;
                        detectionDetails.port = port;
                        detectionDetails.isLocalhost = isLocalhost;
                        detectionDetails.hasDevInHostname = hasDevInHostname;
                        detectionDetails.isNonStandardPort = isNonStandardPort;
                        detectionDetails.isProductionDomain = isProductionDomain;
                        
                        if (isProductionDomain) {
                            // Force production environment for known production domains
                            isDevelopmentEnvironment = false;
                        } else {
                            // Development environment detection
                            isDevelopmentEnvironment = isLocalhost || hasDevInHostname || isNonStandardPort;
                        }
                    } else {
                        detectionMethod = 'fallback-production';
                        detectionDetails.windowUnavailable = true;
                        // Fallback: assume production if window is not available
                        isDevelopmentEnvironment = false;
                    }
                }
            }
        }
        
        $scope.vm = {}; var vm = $scope.vm;

        // Expose environment detection to view
        vm.isDevelopmentEnvironment = isDevelopmentEnvironment;

        // Comprehensive Backup Properties
        vm.comprehensiveBackup = {
            includeDatabase: true,
            createDevEnvironment: isDevelopmentEnvironment, // Environment-aware: true in dev, false in production
            backupType: 'full'
        };
        // Build environment-aware checklist (exclude Sync Resources in production)
        var buildProgressChecklist = function() {
            var checklist = [
                { id: 'init', name: 'Initialize Backup', status: 'pending', message: 'Preparing backup process...', icon: '🚀' },
                { id: 'database', name: 'Backup Database', status: 'pending', message: 'Creating database backup...', icon: '💾' },
                { id: 'dev', name: 'DEV Environment', status: 'pending', message: 'Creating development environment...', icon: '🔧' },
                { id: 'complete', name: 'Finalize', status: 'pending', message: 'Completing backup process...', icon: '✅' }
            ];
            
            // Only add Sync Resources in development environment
            if (isDevelopmentEnvironment) {
                checklist.splice(1, 0, { id: 'resources', name: 'Sync Resources', status: 'pending', message: 'Synchronizing application files...', icon: '📁' });
            }
            
            return checklist;
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
            
            // Checklist-based progress tracking (environment-aware)
            checklist: buildProgressChecklist(),
            pollingInterval: null
        };
        vm.currentBackupId = null;
        vm.signalRConnection = null;

        // Restore Progress Properties
        vm.restoreProgress = {
            isActive: false,
            isComplete: false,
            hasError: false,
            percentComplete: 0,
            currentMessage: 'Ready to restore',
            sourceFile: null,
            targetDatabase: null,
            startTime: null,
            endTime: null,
            errorMessage: null
        };

        // Database selection for restore operations
        vm.availableDatabases = [];
        vm.selectedRestoreDatabase = null;
        vm.isLoadingDatabases = false;
        vm.restoreMode = 'auto'; // 'auto' or 'manual'

        // Database Export Properties
        vm.databaseExport = {
            availableDatabases: [], // Will be populated from vm.availableDatabases
            selectedDatabase: '',
            includeSchema: true,
            includeData: true,
            defaultPath: 'D:\\PROJECTS\\KSESSIONS\\Workspaces\\DATA\\',
            filename: '', // Simple filename input
            isExporting: false,
            exportProgress: 0,
            progressPercent: 0,
            currentStage: '',
            exportStatus: '',
            processId: null
        };

        // Backup completion status
        vm.lastBackupResult = null; // Will store success/failure information
        vm.recentBackups = [];
        vm.backupStats = {
            totalBackups: 0,
            totalSize: 'N/A',
            lastBackup: 'N/A',
            status: 'Unknown'
        };

        // Loading states
        vm.isCreatingSimpleBackup = false;
        vm.isVerifyingIntegrity = false;
        vm.isRefreshingBackups = false;
        
        // Error handling
        vm.backupError = null;

        // Methods
        // Wrapper functions for button clicks
        vm.createComprehensiveBackup = function() {
            if (typeof createComprehensiveBackup === 'function') {
                return createComprehensiveBackup();
            } else {
                logError("createComprehensiveBackup function not available");
            }
        };
        
        vm.createSimpleBackup = function() {
            if (typeof createSimpleBackup === 'function') {
                return createSimpleBackup();
            } else {
                logError("createSimpleBackup function not available");
            }
        };
        
        vm.rollbackBackup = function() {
            if (typeof rollbackBackup === 'function') {
                return rollbackBackup();
            } else {
                logError("rollbackBackup function not available");
            }
        };
        
        vm.verifyBackupIntegrity = function() {
            if (typeof verifyBackupIntegrity === 'function') {
                return verifyBackupIntegrity();
            } else {
                logError("verifyBackupIntegrity function not available");
            }
        };
        
        vm.refreshBackupList = function() {
            if (typeof refreshBackupList === 'function') {
                return refreshBackupList();
            } else {
                logError("refreshBackupList function not available");
            }
        };
        
        vm.cancelBackup = cancelBackup;
        vm.downloadBackup = downloadBackup;
        vm.restoreDatabase = restoreDatabase;
        vm.getTargetDatabase = getTargetDatabase;
        vm.loadAvailableDatabases = loadAvailableDatabases;
        vm.selectRestoreTarget = selectRestoreTarget;
        
        // Emergency stop function to force-kill all polling
        vm.emergencyStop = function() {
            // Clear all possible intervals
            if (vm.backupProgress.pollingInterval) {
                clearInterval(vm.backupProgress.pollingInterval);
                vm.backupProgress.pollingInterval = null;
            }
            if (vm.statusCheckInterval) {
                clearInterval(vm.statusCheckInterval);
                vm.statusCheckInterval = null;
            }
            
            // Force set cancellation flags
            vm.backupProgress.isCancelled = true;
            vm.backupProgress.isActive = false;
            vm.currentBackupId = null;
            
            // Update UI to show emergency stop
            vm.lastBackupResult = {
                success: false,
                timestamp: new Date(),
                message: 'Emergency stop activated',
                details: 'All backup operations force-stopped due to hung process'
            };
            
            logError("EMERGENCY STOP: All backup operations force-stopped");
            dlg.confirmationDialog("Emergency Stop", "Emergency stop activated - all backup operations have been force-stopped", "OK", null)
                .then(function(result) {
                    // User acknowledged the emergency stop
                });
        };
        
        // Database Export Methods
        vm.updateGeneratedFilename = updateGeneratedFilename;
        vm.getSimpleExportPath = getSimpleExportPath;
        vm.generateDatabaseExport = generateDatabaseExport;
        vm.getExportProgressBarClass = getExportProgressBarClass;

        activate();

        function activate() {
            var promises = [
                loadRecentBackups(),
                loadBackupStats()
            ];
            
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation() {
                log("Activated SQL Backups Management View", controllerId, config.showDevToasts);
                
                // Load available databases for restore operations
                loadAvailableDatabases();
            }
        }

        function loadAvailableDatabases() {
            vm.isLoadingDatabases = true;
            
            // Include both production and development databases
            // TODO: Replace with actual API call to get databases from server
            var predefinedDatabases = [
                'KSESSIONS',        // Production Main Application
                'KQUR',             // Production Quran Content
                'KSESSIONS_DEV',    // Development Main Application  
                'KQUR_DEV'          // Development Quran Content
            ];

            // Simulate API delay
            common.$timeout(function() {
                vm.availableDatabases = predefinedDatabases.map(function(name) {
                    return { name: name, description: getDbDescription(name) };
                });
                
                // Also populate the database export dropdown
                vm.databaseExport.availableDatabases = predefinedDatabases;
                
                vm.isLoadingDatabases = false;
            }, 500);
        }

        function getDbDescription(dbName) {
            switch(dbName) {
                case 'KSESSIONS_DEV': return 'Main Application - Development';
                case 'KQUR_DEV': return 'Quran Content - Development';
                case 'KSESSIONS': return 'Main Application - Production';
                case 'KQUR': return 'Quran Content - Production';
                default: return 'Database';
            }
        }

        function selectRestoreTarget(backup) {
            console.log("DEBUG: selectRestoreTarget() called", {
                backup: backup,
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });

            // Set the selected backup for restore
            vm.selectedBackupForRestore = backup;
            
            // Auto-select the recommended database based on backup filename
            var recommendedDatabase = getTargetDatabase(backup);
            vm.selectedRestoreDatabase = vm.availableDatabases.find(function(db) {
                return db.name === recommendedDatabase;
            });

            console.log("DEBUG: Restore target selection", {
                selectedBackup: backup.fileName,
                recommendedDatabase: recommendedDatabase,
                selectedRestoreDatabase: vm.selectedRestoreDatabase,
                controllerId: controllerId
            });
        }

        function createComprehensiveBackup() {
            // Determine the correct batch file path based on environment
            var batchFilePath;
            var workingDirectory;
            var batchFileArguments = [];
            
            // Check if we're in production deployment path
            if (typeof window !== 'undefined' && window.location) {
                var hostname = window.location.hostname.toLowerCase();
                var isProductionDomain = hostname.includes('kashkole.com') || 
                                       hostname.includes('servehttp.com') ||
                                       hostname.includes('session.kashkole.com');
                
                if (isProductionDomain) {
                    // Production paths - use production batch file for actual operations
                    batchFilePath = "D:\\Websites\\KSESSIONS\\Scripts\\Backup\\KSESSIONS_PRODUCTION_BACKUP.bat";
                    workingDirectory = "D:\\Websites\\KSESSIONS\\Scripts\\Backup";
                    
                    // Pass createDevEnvironment parameter to production batch file
                    var createDevEnvParam = vm.comprehensiveBackup.createDevEnvironment ? "true" : "false";
                    batchFileArguments.push(createDevEnvParam);
                    
                    // Enhanced production logging
                    devLogger.logInfo("PRODUCTION BATCH ARGUMENTS", {
                        createDevEnvironment: vm.comprehensiveBackup.createDevEnvironment,
                        createDevEnvParam: createDevEnvParam,
                        batchFileArguments: batchFileArguments,
                        batchFilePath: batchFilePath,
                        workingDirectory: workingDirectory,
                        controllerId: 'adminSqlBackupsCtl'
                    });
                } else {
                    // Development paths
                    batchFilePath = "D:\\PROJECTS\\KSESSIONS\\Workspaces\\SCRIPTS\\SQL\\Backup Restore KSESSIONS\\KSESSIONS_PRODUCTION_BACKUP.bat";
                    workingDirectory = "D:\\PROJECTS\\KSESSIONS\\Workspaces\\SCRIPTS\\SQL\\Backup Restore KSESSIONS";
                }
            } else {
                // Fallback to development paths if window.location is not available
                batchFilePath = "D:\\PROJECTS\\KSESSIONS\\Workspaces\\SCRIPTS\\SQL\\Backup Restore KSESSIONS\\KSESSIONS_PRODUCTION_BACKUP.bat";
                workingDirectory = "D:\\PROJECTS\\KSESSIONS\\Workspaces\\SCRIPTS\\SQL\\Backup Restore KSESSIONS";
            }

            // Store for later access in polling functions
            vm.backupProgress.batchFilePath = batchFilePath;
            vm.backupProgress.batchFileArguments = batchFileArguments;

            if (vm.backupProgress.isActive) {
                logError("Backup is already in progress");
                return;
            }

            // Initialize progress tracking for batch file execution
            vm.backupProgress.message = isDevelopmentEnvironment 
                ? 'Starting KSESSIONS_PRODUCTION_BACKUP.BAT process...' 
                : 'Starting production database backup process...';
            vm.backupProgress.percentComplete = 0;
            vm.backupProgress.startTime = new Date();
            vm.backupProgress.operationType = 'backup';
            vm.backupProgress.estimatedTimeRemaining = 'Calculating...';
            vm.backupProgress.isActive = true;

            // Reset backup checklist for batch file operations
            resetBatchBackupChecklist();

            var logMessage = isDevelopmentEnvironment 
                ? "Starting database backup via KSESSIONS_PRODUCTION_BACKUP.BAT..." 
                : "Starting production database backup process...";
            log(logMessage);

            var batchBackupRequest = {
                batchFilePath: batchFilePath,
                processType: "database-backup",
                enableProgressTracking: true,
                workingDirectory: workingDirectory,
                environmentType: isDevelopmentEnvironment ? 'development' : 'production',
                arguments: batchFileArguments // Pass arguments to production batch file
            };

            adminUtilityService.executeBatchFile(batchBackupRequest)
                .then(function(response) {
                    // Check if batch file execution was initiated successfully
                    if (response && response.processId) {
                        vm.currentBackupId = response.processId;
                        updateChecklistItem('init', 'completed', 'UTILITY_BACKUP.BAT process started successfully');
                        logSuccess("Batch file backup initiated successfully - Process ID: " + response.processId);
                        
                        // Start polling for batch file progress
                        startBatchBackupPolling();
                    } else {
                        var errorMessage = "Failed to start UTILITY_BACKUP.BAT: " + (response.message || 'No process ID returned');
                        logError(errorMessage);
                        vm.backupProgress.isActive = false;
                        vm.lastBackupResult = {
                            success: false,
                            timestamp: new Date(),
                            message: 'Batch file backup failed to start',
                            details: errorMessage
                        };
                    }
                })
                .catch(function(error) {
                    var errorMessage;
                    var errorDetails;
                    
                    if (isDevelopmentEnvironment) {
                        errorMessage = "Error starting UTILITY_BACKUP.BAT: " + error.message;
                        errorDetails = "Development batch file execution failed. Check SQL Server connectivity and file permissions.";
                    } else {
                        errorMessage = "Production backup process encountered an issue: " + error.message;
                        errorDetails = "This may be due to production environment limitations. Database backups in production require special configuration.";
                    }
                    
                    logError(errorMessage);
                    vm.backupProgress.isActive = false;
                    vm.lastBackupResult = {
                        success: false,
                        timestamp: new Date(),
                        message: 'Backup process initialization failed',
                        details: errorDetails
                    };
                });
        }

        function createSimpleBackup() {
            console.log("DEBUG: createSimpleBackup() called", {
                controllerId: controllerId,
                currentCreatingState: vm.isCreatingSimpleBackup,
                timestamp: new Date().toISOString()
            });
            
            vm.isCreatingSimpleBackup = true;
            log("Creating simple database backup...");
            
            adminUtilityService.createDatabaseBackup({ backupType: 'simple' })
                .then(function(response) {
                    console.log("DEBUG: Simple backup response", {
                        response: response,
                        controllerId: controllerId,
                        success: response.success
                    });
                    
                    if (response.success) {
                        logSuccess("Simple backup created successfully");
                        loadRecentBackups(); // Refresh backup list
                        loadBackupStats(); // Refresh statistics
                    } else {
                        logError("Failed to create simple backup: " + response.message);
                    }
                })
                .catch(function(error) {
                    console.error("DEBUG: Simple backup error", {
                        error: error,
                        controllerId: controllerId,
                        errorMessage: error.message
                    });
                    logError("Error creating simple backup: " + error.message);
                })
                .finally(function() {
                    console.log("DEBUG: Simple backup operation completed", {
                        controllerId: controllerId,
                        finalCreatingState: vm.isCreatingSimpleBackup
                    });
                    vm.isCreatingSimpleBackup = false;
                });
        }

        function rollbackBackup(backup) {
            console.log("DEBUG: rollbackBackup() called", {
                backup: backup,
                controllerId: controllerId,
                currentBackupProgress: vm.backupProgress.isActive
            });

            if (vm.backupProgress.isActive) {
                logError("Cannot rollback while backup is in progress");
                return;
            }

            var confirmMessage = "Are you sure you want to rollback to the selected backup?\n\nThis will replace the current database content with the selected backup.\n\n⚠️ WARNING: This action cannot be undone!";
            
            dlg.confirmationDialog("Confirm Rollback", confirmMessage, "Yes, Rollback", "Cancel")
                .then(function(result) {
                    if (result !== "ok") return;
                    
                    console.log("DEBUG: Rollback confirmed by user", {
                        backup: backup,
                        controllerId: controllerId
                    });

                    vm.backupProgress.message = 'Preparing rollback process...';
                    vm.backupProgress.percentComplete = 0;
                    vm.backupProgress.startTime = new Date();
                    vm.backupProgress.operationType = 'rollback';
                    vm.backupProgress.estimatedTimeRemaining = 'Calculating...';
                    vm.backupProgress.isActive = true;

                    var rollbackRequest = {
                        backupId: backup.fileName,
                        restoreDatabase: true,
                        restoreResources: true
                    };

                    log("Starting rollback process for: " + backup.fileName);

                    adminUtilityService.rollbackBackup(rollbackRequest)
                        .then(function(response) {
                            console.log("DEBUG: Rollback response", {
                                response: response,
                                controllerId: controllerId,
                                success: response.success
                            });
                            
                            if (response.success) {
                                logSuccess("Rollback completed successfully");
                                vm.lastBackupResult = {
                                    success: true,
                                    timestamp: new Date(),
                                    message: 'Rollback completed successfully',
                                    details: 'Database restored from: ' + backup.fileName
                                };
                            } else {
                                logError("Rollback failed: " + response.message);
                                vm.lastBackupResult = {
                                    success: false,
                                    timestamp: new Date(),
                                    message: 'Rollback failed',
                                    details: response.message
                                };
                            }
                        })
                        .catch(function(error) {
                            console.error("DEBUG: Rollback error", {
                                error: error,
                                controllerId: controllerId,
                                errorMessage: error.message
                            });
                            
                            var errorMessage = "Error during rollback: " + error.message;
                            logError(errorMessage);
                            vm.lastBackupResult = {
                                success: false,
                                timestamp: new Date(),
                                message: 'Rollback error',
                                details: errorMessage
                            };
                        })
                        .finally(function() {
                            console.log("DEBUG: Rollback operation completed", {
                                controllerId: controllerId,
                                operationResult: vm.lastBackupResult
                            });
                            vm.backupProgress.isActive = false;
                            vm.backupProgress.percentComplete = 100;
                        });
                });
        }

        function cancelBackup() {
            console.log("DEBUG: cancelBackup() called", {
                controllerId: controllerId,
                currentBackupId: vm.currentBackupId,
                backupProgress: vm.backupProgress.isActive
            });
            
            if (!vm.backupProgress.isActive) {
                console.warn("DEBUG: No active backup to cancel", {
                    controllerId: controllerId
                });
                return;
            }

            if (confirm("Are you sure you want to cancel the backup operation?")) {
                console.log("DEBUG: Backup cancellation confirmed by user", {
                    controllerId: controllerId,
                    backupId: vm.currentBackupId
                });
                
                // AGGRESSIVE CANCELLATION - Stop all possible polling intervals
                if (vm.backupProgress.pollingInterval) {
                    clearInterval(vm.backupProgress.pollingInterval);
                    vm.backupProgress.pollingInterval = null;
                }
                
                // Clear any additional intervals that might exist
                if (vm.statusCheckInterval) {
                    clearInterval(vm.statusCheckInterval);
                    vm.statusCheckInterval = null;
                }
                
                // Set cancellation flag to prevent further polling
                vm.backupProgress.isCancelled = true;
                vm.backupProgress.isActive = false;
                
                // Clear the current backup ID to stop batch status checking
                vm.currentBackupId = null;
                
                // Force update all checklist items to cancelled state
                if (vm.backupProgress.checklist) {
                    vm.backupProgress.checklist.forEach(function(item) {
                        if (item.status === 'active' || item.status === 'pending') {
                            item.status = 'cancelled';
                            item.message = 'Operation cancelled by user';
                        }
                    });
                }
                
                updateChecklistItem('complete', 'cancelled', 'Backup cancelled by user');
                
                vm.lastBackupResult = {
                    success: false,
                    timestamp: new Date(),
                    message: 'Backup cancelled by user',
                    details: 'Operation was cancelled before completion'
                };

                // Try to terminate the server-side process if it exists
                if (vm.currentBackupId) {
                    adminUtilityService.cancelBatchProcess(vm.currentBackupId)
                        .then(function(response) {
                            console.log("DEBUG: Server-side process cancellation result", {
                                response: response,
                                controllerId: controllerId
                            });
                        })
                        .catch(function(error) {
                            console.warn("DEBUG: Failed to cancel server-side process", {
                                error: error,
                                controllerId: controllerId
                            });
                        });
                }

                logError("Backup operation cancelled");
                console.log("DEBUG: Backup cancellation completed - all intervals cleared", {
                    controllerId: controllerId,
                    isCancelled: vm.backupProgress.isCancelled,
                    isActive: vm.backupProgress.isActive
                });
            }
        }

        function downloadBackup(backup) {
            console.log("DEBUG: downloadBackup() called", {
                backup: backup,
                backupId: backup.id,
                controllerId: controllerId
            });
            
            log("Downloading backup: " + backup.fileName);
            
            // Use adminUtilityService to get download URL
            var downloadUrl = adminUtilityService.downloadBackup(backup.id);
            
            console.log("DEBUG: Initiating backup download", {
                downloadUrl: downloadUrl,
                backupFileName: backup.fileName,
                controllerId: controllerId
            });
            
            // Trigger download by opening URL in new window
            window.open(downloadUrl, '_blank');
            
            logSuccess("Download initiated for " + backup.fileName);
        }

        function verifyBackupIntegrity() {
            console.log("DEBUG: verifyBackupIntegrity() called", {
                controllerId: controllerId,
                currentVerifyingState: vm.isVerifyingIntegrity,
                timestamp: new Date().toISOString()
            });
            
            vm.isVerifyingIntegrity = true;
            log("Verifying backup integrity...");
            
            adminUtilityService.verifyBackupIntegrity()
                .then(function(response) {
                    console.log("DEBUG: Verify backup integrity response", {
                        response: response,
                        controllerId: controllerId,
                        success: response.success,
                        backupsChecked: response.backupsChecked || 0
                    });
                    
                    if (response.success) {
                        var message = `Backup integrity verification completed - ${response.backupsChecked || 0} backups checked`;
                        if (response.corruptedBackups && response.corruptedBackups > 0) {
                            message += `, ${response.corruptedBackups} corrupted backups found`;
                            logError(message);
                        } else {
                            message += ', all backups verified successfully';
                            logSuccess(message);
                        }
                    } else {
                        logError("Failed to verify backup integrity: " + response.message);
                    }
                })
                .catch(function(error) {
                    console.error("DEBUG: Verify backup integrity error", {
                        error: error,
                        controllerId: controllerId,
                        errorMessage: error.message
                    });
                    logError("Error verifying backup integrity: " + error.message);
                })
                .finally(function() {
                    console.log("DEBUG: Verify backup integrity operation completed", {
                        controllerId: controllerId,
                        finalVerifyingState: vm.isVerifyingIntegrity
                    });
                    vm.isVerifyingIntegrity = false;
                });
        }

        function refreshBackupList() {
            console.log("DEBUG: refreshBackupList() called", {
                controllerId: controllerId,
                currentRefreshState: vm.isRefreshingBackups,
                timestamp: new Date().toISOString()
            });
            
            vm.isRefreshingBackups = true;
            log("Refreshing backup list...");
            
            loadRecentBackups()
                .then(function() {
                    return loadBackupStats();
                })
                .then(function() {
                    console.log("DEBUG: Backup list refresh completed", {
                        controllerId: controllerId,
                        backupsCount: vm.recentBackups.length,
                        stats: vm.backupStats
                    });
                    logSuccess("Backup list refreshed successfully");
                })
                .catch(function(error) {
                    console.error("DEBUG: Backup list refresh failed", {
                        error: error,
                        controllerId: controllerId,
                        errorMessage: error.message
                    });
                    logError("Failed to refresh backup list: " + error.message);
                })
                .finally(function() {
                    console.log("DEBUG: Backup list refresh operation completed", {
                        controllerId: controllerId,
                        finalRefreshState: vm.isRefreshingBackups
                    });
                    vm.isRefreshingBackups = false;
                });
        }

        function loadRecentBackups() {
            console.log("DEBUG: loadRecentBackups() called", {
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });
            
            // Real API call to get recent backups
            return adminUtilityService.getRecentBackups()
                .then(function(response) {
                    console.log("DEBUG: Recent backups response", {
                        response: response,
                        controllerId: controllerId,
                        backupsCount: response ? response.length : 0
                    });
                    
                    if (response) {
                        vm.recentBackups = response;
                        console.log("DEBUG: Recent backups updated", {
                            backupsCount: vm.recentBackups.length,
                            controllerId: controllerId
                        });
                    } else {
                        vm.recentBackups = [];
                        console.warn("DEBUG: No recent backups data received", {
                            response: response,
                            controllerId: controllerId
                        });
                    }
                    
                    return response;
                })
                .catch(function(error) {
                    console.error("DEBUG: Error loading recent backups", {
                        error: error,
                        controllerId: controllerId,
                        errorMessage: error.message
                    });
                    
                    // Show user-friendly error message
                    vm.recentBackups = [];
                    vm.backupError = {
                        hasError: true,
                        message: "Unable to load backup files. This may be due to permission restrictions or backup directory access issues.",
                        details: error.data && error.data.exceptionMessage ? error.data.exceptionMessage : error.message
                    };
                    
                    logError("Error loading recent backups: " + (error.data && error.data.exceptionMessage ? error.data.exceptionMessage : error.message));
                    
                    // Don't rethrow error to prevent unhandled rejection
                    return [];
                });
        }

        // Helper function to convert military time to 12-hour format
        function convertTo12HourTime(timeString) {
            if (!timeString || typeof timeString !== 'string') {
                return timeString;
            }
            
            // Check if it's already in 12-hour format (contains AM/PM)
            if (timeString.toLowerCase().includes('am') || timeString.toLowerCase().includes('pm')) {
                return timeString;
            }
            
            // Parse military time (HH:MM format)
            var timeParts = timeString.split(':');
            if (timeParts.length !== 2) {
                return timeString; // Return original if not in expected format
            }
            
            var hours = parseInt(timeParts[0], 10);
            var minutes = timeParts[1];
            
            if (isNaN(hours) || hours < 0 || hours > 23) {
                return timeString; // Return original if invalid hours
            }
            
            var period = hours >= 12 ? 'PM' : 'AM';
            var displayHours = hours % 12;
            if (displayHours === 0) {
                displayHours = 12;
            }
            
            return displayHours + ':' + minutes + ' ' + period;
        }

        // Add the helper function to vm for use in templates
        vm.convertTo12HourTime = convertTo12HourTime;

        function loadBackupStats() {
            console.log("DEBUG: loadBackupStats() called", {
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });
            
            return adminUtilityService.getBackupStatistics()
                .then(function(response) {
                    console.log("DEBUG: Backup statistics response", {
                        response: response,
                        controllerId: controllerId,
                        dataReceived: !!response
                    });
                    
                    if (response) {
                        vm.backupStats = response;
                        console.log("DEBUG: Backup statistics updated", {
                            backupStats: vm.backupStats,
                            controllerId: controllerId
                        });
                    }
                    
                    return response;
                })
                .catch(function(error) {
                    console.error("DEBUG: Error loading backup statistics", {
                        error: error,
                        controllerId: controllerId,
                        errorMessage: error.message
                    });
                    // Don't throw error for statistics as it's not critical
                    vm.backupStats = {
                        totalBackups: 'Error',
                        totalSize: 'Error',
                        lastBackup: 'Error',
                        status: 'Error'
                    };
                });
        }

        // Helper functions from original adminUtilityBoard.js
        function resetBackupChecklist() {
            console.log("DEBUG: resetBackupChecklist() called", {
                controllerId: controllerId,
                isDevelopmentEnvironment: isDevelopmentEnvironment
            });
            
            // Use environment-aware checklist
            vm.backupProgress.checklist = buildProgressChecklist();
            
            vm.backupProgress.checklist.forEach(function(item) {
                item.status = 'pending';
                item.message = getDefaultMessage(item.id);
            });
            
            // Adjust checklist based on operation type and options
            if (vm.backupProgress.operationType === 'backup') {
                var devItem = vm.backupProgress.checklist.find(function(item) { return item.id === 'dev'; });
                if (devItem) {
                    devItem.hidden = !vm.comprehensiveBackup.createDevEnvironment;
                }
            }

            function getDefaultMessage(itemId) {
                switch(itemId) {
                    case 'init': return 'Preparing backup process...';
                    case 'resources': return 'Synchronizing application files...';
                    case 'database': return 'Creating database backup...';
                    case 'dev': return 'Creating development environment...';
                    case 'complete': return 'Completing backup process...';
                    default: return 'Processing...';
                }
            }
        }

        function updateChecklistItem(itemId, status, message) {
            console.log("DEBUG: updateChecklistItem() called", {
                itemId: itemId,
                status: status,
                message: message,
                controllerId: controllerId
            });
            
            var item = vm.backupProgress.checklist.find(function(checklist) {
                return checklist.id === itemId;
            });
            
            if (item) {
                item.status = status;
                item.message = message || item.message;
                console.log("DEBUG: Checklist item updated", {
                    item: item,
                    controllerId: controllerId
                });
            } else {
                console.warn("DEBUG: Checklist item not found", {
                    itemId: itemId,
                    availableItems: vm.backupProgress.checklist.map(function(i) { return i.id; }),
                    controllerId: controllerId
                });
            }
        }

        function startBackupPolling() {
            console.log("DEBUG: startBackupPolling() called", {
                backupId: vm.currentBackupId,
                pollingInterval: vm.backupProgress.pollingInterval,
                controllerId: controllerId
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
                    console.warn("DEBUG: Backup polling timeout reached", {
                        pollCount: vm.backupProgress.pollCount,
                        maxPolls: vm.backupProgress.maxPolls,
                        controllerId: controllerId
                    });
                    
                    clearInterval(vm.backupProgress.pollingInterval);
                    vm.backupProgress.pollingInterval = null;
                    vm.backupProgress.isActive = false;
                    logError("Backup operation timed out after 15 minutes");
                    return;
                }
                
                checkBackupStatus();
            }, 2000);
            
            // Start first check immediately
            checkBackupStatus();
        }

        // New batch file specific functions
        function resetBatchBackupChecklist() {
            console.log("DEBUG: resetBatchBackupChecklist() called - BATCH FILE SPECIFIC", {
                controllerId: controllerId,
                isDevelopmentEnvironment: isDevelopmentEnvironment
            });
            
            // Reset checklist for batch file operations based on UTILITY_BACKUP.BAT steps
            // Environment-aware: exclude Resource Sync in production
            var batchChecklist = [
                { id: 'init', name: 'Initialize Process', status: 'pending', message: 'Starting UTILITY_BACKUP.BAT process...', icon: '🚀' },
                { id: 'database', name: 'Database Backup', status: 'pending', message: 'Backing up KSESSIONS and KQUR databases...', icon: '�' },
                { id: 'dev', name: 'DEV Environment', status: 'pending', message: 'Creating KSESSIONS_DEV and KQUR_DEV databases...', icon: '�' },
                { id: 'complete', name: 'Complete', status: 'pending', message: 'Finalizing batch file operations...', icon: '✅' }
            ];
            
            // Only add Resource Sync in development environment
            if (isDevelopmentEnvironment) {
                batchChecklist.splice(1, 0, { id: 'resources', name: 'Resource Sync', status: 'pending', message: 'Synchronizing resources to Google Drive and local project...', icon: '📁' });
            }
            
            vm.backupProgress.checklist = batchChecklist;
        }

        function startBatchBackupPolling() {
            console.log("DEBUG: startBatchBackupPolling() called - BATCH FILE SPECIFIC", {
                processId: vm.currentBackupId,
                pollingInterval: vm.backupProgress.pollingInterval,
                controllerId: controllerId
            });
            
            // Clear any existing polling
            if (vm.backupProgress.pollingInterval) {
                clearInterval(vm.backupProgress.pollingInterval);
            }
            
            // Initialize polling counter and timeout for batch operations
            vm.backupProgress.pollCount = 0;
            vm.backupProgress.maxPolls = 900; // 30 minutes @ 2 second intervals (batch files can take longer)
            
            // Poll every 2 seconds for batch file status
            vm.backupProgress.pollingInterval = setInterval(function() {
                vm.backupProgress.pollCount++;
                
                // Safety timeout after 30 minutes of polling
                if (vm.backupProgress.pollCount >= vm.backupProgress.maxPolls) {
                    console.warn("DEBUG: Batch file polling timeout reached", {
                        pollCount: vm.backupProgress.pollCount,
                        maxPolls: vm.backupProgress.maxPolls,
                        controllerId: controllerId
                    });
                    
                    clearInterval(vm.backupProgress.pollingInterval);
                    vm.backupProgress.pollingInterval = null;
                    vm.backupProgress.isActive = false;
                    logError("Batch file operation timed out after 30 minutes");
                    return;
                }
                
                checkBatchBackupStatus();
            }, 2000);
            
            // Start first check immediately
            checkBatchBackupStatus();
        }

        function checkBatchBackupStatus() {
            // CRITICAL: Check cancellation flag first to prevent runaway polling
            if (vm.backupProgress.isCancelled || !vm.currentBackupId || !vm.backupProgress.isActive) {
                console.log("DEBUG: checkBatchBackupStatus() - Stopping due to cancellation or inactive state", {
                    isCancelled: vm.backupProgress.isCancelled,
                    processId: vm.currentBackupId,
                    isActive: vm.backupProgress.isActive,
                    controllerId: controllerId
                });
                if (vm.backupProgress.pollingInterval) {
                    clearInterval(vm.backupProgress.pollingInterval);
                    vm.backupProgress.pollingInterval = null;
                }
                return;
            }
            
            console.log("DEBUG: checkBatchBackupStatus() called - BATCH FILE SPECIFIC", {
                processId: vm.currentBackupId,
                timestamp: new Date().toISOString(),
                pollCount: vm.backupProgress.pollCount || 0,
                controllerId: controllerId
            });
            
            adminUtilityService.getBatchProcessStatus(vm.currentBackupId)
                .then(function(response) {
                    // Double-check cancellation after async call returns
                    if (vm.backupProgress.isCancelled || !vm.backupProgress.isActive) {
                        console.log("DEBUG: Batch process status response ignored due to cancellation", {
                            isCancelled: vm.backupProgress.isCancelled,
                            isActive: vm.backupProgress.isActive,
                            controllerId: controllerId
                        });
                        return null; // Don't process the response
                    }
                    
                    console.log("DEBUG: Batch process status response", {
                        response: response,
                        controllerId: controllerId,
                        stage: response.stage,
                        percentComplete: response.percentComplete,
                        isRunning: response.isRunning,
                        output: response.output
                    });
                    
                    return response;
                })
                .then(function(response) {
                    if (response && !vm.backupProgress.isCancelled && vm.backupProgress.isActive) {
                        updateBatchBackupProgress(response);
                    }
                })
                .catch(function(error) {
                    console.error("DEBUG: Error checking batch process status", {
                        error: error,
                        controllerId: controllerId,
                        errorMessage: error.message
                    });
                    
                    // Don't continue error handling if cancelled
                    if (vm.backupProgress.isCancelled || !vm.backupProgress.isActive) {
                        console.log("DEBUG: Skipping error handling due to cancellation", {
                            controllerId: controllerId
                        });
                        return;
                    }
                    
                    vm.backupProgress.errorCount = (vm.backupProgress.errorCount || 0) + 1;
                    
                    // Stop polling after 5 consecutive errors
                    if (vm.backupProgress.errorCount >= 5) {
                        console.error("DEBUG: Stopping batch process polling due to consecutive errors", {
                            errorCount: vm.backupProgress.errorCount,
                            controllerId: controllerId
                        });
                        
                        clearInterval(vm.backupProgress.pollingInterval);
                        vm.backupProgress.pollingInterval = null;
                        vm.backupProgress.isActive = false;
                        logError("Batch process monitoring stopped due to repeated errors");
                    }
                });
        }

        function updateBatchBackupProgress(status) {
            // Early exit if backup has been cancelled
            if (vm.backupProgress.isCancelled || !vm.backupProgress.isActive) {
                console.log("DEBUG: updateBatchBackupProgress() - Skipping update due to cancellation", {
                    isCancelled: vm.backupProgress.isCancelled,
                    isActive: vm.backupProgress.isActive,
                    controllerId: controllerId
                });
                return;
            }
            
            console.log("DEBUG: updateBatchBackupProgress() called - BATCH FILE SPECIFIC", {
                status: status,
                currentStage: vm.backupProgress.stage,
                pollCount: vm.backupProgress.pollCount || 0,
                controllerId: controllerId
            });
            
            // Reset error count on successful response
            vm.backupProgress.errorCount = 0;
            
            vm.backupProgress.stage = status.stage || vm.backupProgress.stage;
            vm.backupProgress.message = status.message || vm.backupProgress.message;
            vm.backupProgress.percentComplete = status.percentComplete || vm.backupProgress.percentComplete;
            
            // Update checklist based on batch file output parsing
            if (status.output) {
                // Parse batch file output to determine current stage
                var output = status.output.toLowerCase();
                
                // Only handle resource synchronization in development environment
                if (isDevelopmentEnvironment) {
                    if (output.includes('[1/3]') || output.includes('resource synchronization')) {
                        updateChecklistItem('resources', 'active', 'Synchronizing resources via robocopy...');
                        vm.backupProgress.percentComplete = Math.max(vm.backupProgress.percentComplete, 25);
                    } else if (output.includes('resource synchronization complete')) {
                        updateChecklistItem('resources', 'completed', 'Resource synchronization completed');
                    }
                }
                
                if (output.includes('[2/3]') || output.includes('database backup')) {
                    updateChecklistItem('database', 'active', 'Backing up KSESSIONS and KQUR databases...');
                    vm.backupProgress.percentComplete = Math.max(vm.backupProgress.percentComplete, 50);
                } else if (output.includes('database backup complete')) {
                    updateChecklistItem('database', 'completed', 'Database backups completed');
                }
                
                if (output.includes('[3/3]') || output.includes('dev environment')) {
                    updateChecklistItem('dev', 'active', 'Creating DEV environments...');
                    vm.backupProgress.percentComplete = Math.max(vm.backupProgress.percentComplete, 75);
                } else if (output.includes('dev created successfully')) {
                    updateChecklistItem('dev', 'completed', 'DEV environments created');
                }
                
                if (output.includes('all operations completed')) {
                    updateChecklistItem('complete', 'completed', 'Database backup completed successfully!');
                    vm.backupProgress.percentComplete = 100;
                    vm.backupProgress.isActive = false;
                    vm.backupProgress.estimatedTimeRemaining = 'Completed';
                    
                    // Set completion status (environment-aware message)
                    var completionDetails = isDevelopmentEnvironment 
                        ? 'Resource sync, database backup, and DEV environment creation completed.'
                        : 'Database backup and DEV environment creation completed.';
                    
                    vm.lastBackupResult = {
                        success: true,
                        timestamp: new Date(),
                        message: 'Database backup completed successfully!',
                        details: completionDetails
                    };
                    
                    // Stop polling
                    if (vm.backupProgress.pollingInterval) {
                        clearInterval(vm.backupProgress.pollingInterval);
                        vm.backupProgress.pollingInterval = null;
                    }
                    
                    logSuccess("Batch file backup completed successfully!");
                    loadRecentBackups(); // Refresh backup list
                }
                
                if (output.includes('error') && !status.isRunning) {
                    var activeItem = vm.backupProgress.checklist.find(function(item) { return item.status === 'active'; });
                    if (activeItem) {
                        updateChecklistItem(activeItem.id, 'error', 'Batch file error occurred');
                    }
                    vm.backupProgress.isActive = false;
                    
                    // Enhanced error logging for debugging
                    devLogger.logError("BATCH FILE ERROR DETAILS", {
                        status: status,
                        output: output,
                        exitCode: status.exitCode,
                        errorMessage: status.message,
                        processId: vm.currentBackupId,
                        stage: status.stage,
                        percentComplete: status.percentComplete,
                        batchFilePath: vm.backupProgress.batchFilePath,
                        arguments: vm.backupProgress.batchFileArguments,
                        controllerId: 'adminSqlBackupsCtl'
                    });
                    
                    // Try to fetch debug log file for more details
                    fetchBatchDebugLog();
                    
                    // Set completion status for error
                    vm.lastBackupResult = {
                        success: false,
                        timestamp: new Date(),
                        message: 'Database backup failed',
                        details: status.message || 'Batch file execution encountered an error.'
                    };
                    
                    // Stop polling
                    if (vm.backupProgress.pollingInterval) {
                        clearInterval(vm.backupProgress.pollingInterval);
                        vm.backupProgress.pollingInterval = null;
                    }
                    
                    logError("Batch file backup failed: " + (status.message || 'Unknown error'));
                }
            }
            
            // Check if process is no longer running (completed or failed)
            if (!status.isRunning && vm.backupProgress.isActive) {
                console.log("DEBUG: Batch process finished", {
                    status: status,
                    controllerId: controllerId
                });
                
                if (vm.backupProgress.percentComplete < 100) {
                    // Process ended but didn't complete successfully
                    updateChecklistItem('complete', 'error', 'Batch file process ended unexpectedly');
                    vm.backupProgress.isActive = false;
                    
                    vm.lastBackupResult = {
                        success: false,
                        timestamp: new Date(),
                        message: 'Database backup ended unexpectedly',
                        details: 'The batch file process terminated before completion.'
                    };
                    
                    logError("Batch file process ended unexpectedly");
                }
                
                // Stop polling
                if (vm.backupProgress.pollingInterval) {
                    clearInterval(vm.backupProgress.pollingInterval);
                    vm.backupProgress.pollingInterval = null;
                }
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

        function checkBackupStatus() {
            if (!vm.currentBackupId || !vm.backupProgress.isActive) {
                console.log("DEBUG: checkBackupStatus() - backup not active, stopping polling", {
                    backupId: vm.currentBackupId,
                    isActive: vm.backupProgress.isActive,
                    controllerId: controllerId
                });
                if (vm.backupProgress.pollingInterval) {
                    clearInterval(vm.backupProgress.pollingInterval);
                    vm.backupProgress.pollingInterval = null;
                }
                return;
            }
            
            console.log("DEBUG: checkBackupStatus() called", {
                backupId: vm.currentBackupId,
                timestamp: new Date().toISOString(),
                pollCount: vm.backupProgress.pollCount || 0,
                controllerId: controllerId
            });
            
            adminUtilityService.getBackupStatus(vm.currentBackupId)
                .then(function(response) {
                    console.log("DEBUG: Backup status response", {
                        response: response,
                        controllerId: controllerId,
                        stage: response.stage,
                        percentComplete: response.percentComplete
                    });
                    
                    // Force refresh if we haven't seen progress in a while
                    if (vm.backupProgress.pollCount > 60 && response.percentComplete === vm.backupProgress.percentComplete) {
                        console.log("DEBUG: Forcing progress refresh due to stagnation", {
                            pollCount: vm.backupProgress.pollCount,
                            currentPercent: vm.backupProgress.percentComplete,
                            responsePercent: response.percentComplete,
                            controllerId: controllerId
                        });
                    }
                    
                    return response;
                })
                .then(function(response) {
                    updateBackupProgress(response);
                })
                .catch(function(error) {
                    console.error("DEBUG: Error checking backup status", {
                        error: error,
                        controllerId: controllerId,
                        errorMessage: error.message
                    });
                    vm.backupProgress.errorCount = (vm.backupProgress.errorCount || 0) + 1;
                    
                    // Stop polling after 5 consecutive errors
                    if (vm.backupProgress.errorCount >= 5) {
                        console.error("DEBUG: Stopping backup polling due to consecutive errors", {
                            errorCount: vm.backupProgress.errorCount,
                            controllerId: controllerId
                        });
                        
                        clearInterval(vm.backupProgress.pollingInterval);
                        vm.backupProgress.pollingInterval = null;
                        vm.backupProgress.isActive = false;
                        logError("Backup monitoring stopped due to repeated errors");
                    }
                });
        }

        function updateBackupProgress(status) {
            console.log("DEBUG: updateBackupProgress() called", {
                status: status,
                currentStage: vm.backupProgress.stage,
                pollCount: vm.backupProgress.pollCount || 0,
                controllerId: controllerId
            });
            
            // Reset error count on successful response
            vm.backupProgress.errorCount = 0;
            
            vm.backupProgress.stage = status.stage || vm.backupProgress.stage;
            vm.backupProgress.message = status.message || vm.backupProgress.message;
            vm.backupProgress.percentComplete = status.percentComplete || vm.backupProgress.percentComplete;
            
            // Update checklist based on current stage (environment-aware)
            switch (status.stage) {
                case 'Resource Synchronization':
                case 'File Synchronization':
                    // Only handle resources in development environment
                    if (isDevelopmentEnvironment) {
                        updateChecklistItem('resources', 'active', status.message);
                    }
                    vm.backupProgress.percentComplete = Math.max(vm.backupProgress.percentComplete, 20);
                    break;
                    
                case 'Database Backup':
                    // Only complete resources step if it exists (development)
                    if (isDevelopmentEnvironment) {
                        updateChecklistItem('resources', 'completed', 'Resource synchronization completed');
                    }
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
                        message: 'Database backup completed successfully!',
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
                    var activeItem = vm.backupProgress.checklist.find(function(item) { return item.status === 'active'; });
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

        function getTargetDatabase(backup) {
            // Map backup files to their correct target databases
            var targetDatabaseMapping = {
                'KSESSIONS.bak': 'KSESSIONS_DEV',
                'KSESSIONS_DEV.bak': 'KSESSIONS_DEV',
                'KQUR.bak': 'KQUR_DEV', 
                'KQUR_DEV.bak': 'KQUR_DEV',
                'KASHKOLE.bak': 'KASHKOLE' // KASHKOLE restores to KASHKOLE database
            };
            
            // Determine target database from backup filename
            var targetDatabase = targetDatabaseMapping[backup.fileName];
            if (!targetDatabase) {
                // Fallback: extract database name from filename and append _DEV
                var baseName = backup.fileName.replace(/\.bak$/i, '');
                if (baseName.toUpperCase() === 'KSESSIONS') {
                    targetDatabase = 'KSESSIONS_DEV';
                } else if (baseName.toUpperCase() === 'KQUR') {
                    targetDatabase = 'KQUR_DEV';
                } else if (baseName.toUpperCase() === 'KASHKOLE') {
                    targetDatabase = 'KASHKOLE';
                } else {
                    targetDatabase = baseName + '_DEV';
                }
            }
            
            return targetDatabase;
        }

        function restoreDatabase(backup, customTargetDatabase) {
            console.log("DEBUG: restoreDatabase() called", {
                backup: backup,
                customTargetDatabase: customTargetDatabase,
                selectedRestoreDatabase: vm.selectedRestoreDatabase,
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });

            // Validation
            if (!backup || !backup.fileName) {
                console.warn("DEBUG: Validation failed in restoreDatabase", {
                    backup: backup,
                    reason: "Backup object or fileName is missing"
                });
                logError("Invalid backup selected for restore");
                return;
            }

            // Determine target database - use custom selection if provided, otherwise use auto-detection
            var targetDatabase;
            if (customTargetDatabase) {
                targetDatabase = customTargetDatabase;
            } else if (vm.selectedRestoreDatabase && vm.selectedRestoreDatabase.name) {
                targetDatabase = vm.selectedRestoreDatabase.name;
            } else {
                targetDatabase = getTargetDatabase(backup);
            }
            
            console.log("DEBUG: Database target determined", {
                backupFileName: backup.fileName,
                targetDatabase: targetDatabase,
                selectionMethod: customTargetDatabase ? 'custom' : (vm.selectedRestoreDatabase ? 'dropdown' : 'auto'),
                controllerId: controllerId
            });
            
            // Show confirmation dialog with selection method information
            var selectionInfo = customTargetDatabase ? 
                `🎯 Custom Selection: You chose "${targetDatabase}" database` :
                `🤖 Auto-Detection: System recommended "${targetDatabase}" database`;
                
            var confirmMessage = `⚠️ WARNING: DATABASE RESTORE OPERATION ⚠️\n\n` +
                                `${selectionInfo}\n\n` +
                                `This will completely overwrite the "${targetDatabase}" database with the backup from:\n` +
                                `📁 File: ${backup.fileName}\n` +
                                `📅 Date: ${backup.date} ${backup.time}\n` +
                                `💾 Size: ${backup.size}\n\n` +
                                `🔴 ALL CURRENT DATA WILL BE LOST!\n` +
                                `🔴 ALL DATABASE CONNECTIONS WILL BE CLOSED!\n` +
                                `🔴 THIS ACTION CANNOT BE UNDONE!\n\n` +
                                `Are you absolutely sure you want to proceed?`;

            // Use Bootstrap modal dialog instead of native confirm() to prevent logout issues
            var confirmOptions = {
                title: '⚠️ Database Restore Warning',
                message: confirmMessage.replace(/\n/g, '<br>'),
                buttons: [
                    {
                        label: 'Cancel',
                        cssClass: 'btn-default',
                        action: function() {
                            console.log("DEBUG: Database restore cancelled by user", {
                                backup: backup,
                                targetDatabase: targetDatabase,
                                controllerId: controllerId
                            });
                            return false; // Don't proceed
                        }
                    },
                    {
                        label: 'Proceed with Restore',
                        cssClass: 'btn-danger',
                        action: function() {
                            console.log("DEBUG: User confirmed database restore", {
                                backup: backup,
                                targetDatabase: targetDatabase,
                                controllerId: controllerId
                            });
                            executeRestore(backup, targetDatabase);
                            return true;
                        }
                    }
                ]
            };
            
            // Show the confirmation dialog using the correct method
            dlg.confirmationDialog(
                "⚠️ Confirm Database Restore", 
                confirmMessage,
                "Yes, I Understand the Risk",
                "Cancel"
            ).then(function(result) {
                if (result === "ok") {
                    // Show the second confirmation with custom dialog
                    showRestoreConfirmationDialog(backup, targetDatabase);
                }
            }).catch(function() {
                console.log("DEBUG: Database restore cancelled by user", {
                    backup: backup,
                    targetDatabase: targetDatabase,
                    controllerId: controllerId
                });
            });
        }
        
        function showRestoreConfirmationDialog(backup, targetDatabase) {
            // Create a custom dialog with input field
            var dialogHtml = `
                <div class="modal fade" id="restoreConfirmModal" tabindex="-1" role="dialog">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header" style="background-color: #d9534f; color: white;">
                                <h4 class="modal-title">
                                    <i class="fa fa-exclamation-triangle"></i> 
                                    Final Confirmation Required
                                </h4>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-danger">
                                    <strong>⚠️ CRITICAL WARNING ⚠️</strong><br>
                                    You are about to restore the <strong>${targetDatabase}</strong> database.<br>
                                    This will permanently overwrite all current data!
                                </div>
                                <p><strong>To proceed, type exactly:</strong> <code>RESTORE</code></p>
                                <div class="form-group">
                                    <input type="text" 
                                           id="restoreConfirmInput" 
                                           class="form-control" 
                                           placeholder="Type RESTORE here..."
                                           style="font-family: monospace; font-size: 16px; text-align: center;">
                                </div>
                                <div id="restoreConfirmError" class="alert alert-warning" style="display: none;">
                                    <i class="fa fa-warning"></i> You must type exactly "RESTORE" to continue.
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-default" id="restoreConfirmCancel">
                                    <i class="fa fa-times"></i> Cancel
                                </button>
                                <button type="button" class="btn btn-danger" id="restoreConfirmExecute">
                                    <i class="fa fa-database"></i> Execute Restore
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove any existing modal
            $('#restoreConfirmModal').remove();
            
            // Add modal to body
            $('body').append(dialogHtml);
            
            // Show the modal
            $('#restoreConfirmModal').modal('show');
            
            // Focus on input
            $('#restoreConfirmModal').on('shown.bs.modal', function() {
                $('#restoreConfirmInput').focus();
            });
            
            // Handle cancel button
            $('#restoreConfirmCancel').on('click', function() {
                $('#restoreConfirmModal').modal('hide');
                console.log("DEBUG: Final restore confirmation cancelled", {
                    backup: backup,
                    targetDatabase: targetDatabase,
                    controllerId: controllerId
                });
            });
            
            // Handle execute button
            $('#restoreConfirmExecute').on('click', function() {
                var userInput = $('#restoreConfirmInput').val().trim();
                
                if (userInput !== "RESTORE") {
                    $('#restoreConfirmError').show();
                    $('#restoreConfirmInput').addClass('has-error').focus();
                    console.log("DEBUG: Incorrect confirmation text entered", {
                        userInput: userInput,
                        expected: "RESTORE",
                        controllerId: controllerId
                    });
                    return;
                }
                
                // Hide modal and execute restore
                $('#restoreConfirmModal').modal('hide');
                
                console.log("DEBUG: Restore confirmed with correct text", {
                    backup: backup,
                    targetDatabase: targetDatabase,
                    userInput: userInput,
                    controllerId: controllerId
                });
                
                executeRestore(backup, targetDatabase);
            });
            
            // Handle Enter key in input
            $('#restoreConfirmInput').on('keypress', function(e) {
                if (e.which === 13) { // Enter key
                    $('#restoreConfirmExecute').click();
                }
            });
            
            // Clean up when modal is hidden
            $('#restoreConfirmModal').on('hidden.bs.modal', function() {
                $(this).remove();
            });
        }
        
        function executeRestore(backup, targetDatabase) {

            console.log("DEBUG: Starting database restore operation", {
                targetDatabase: targetDatabase,
                backupFile: backup.fileName,
                backup: backup,
                controllerId: controllerId
            });

            // Prepare restore request
            var restoreRequest = {
                backupFileName: backup.fileName,
                databaseName: targetDatabase,
                overwriteExisting: true,
                closeAllConnections: true,
                backupFilePath: backup.fullPath
            };

            // Initialize restore progress
            vm.restoreProgress.isActive = true;
            vm.restoreProgress.isComplete = false;
            vm.restoreProgress.hasError = false;
            vm.restoreProgress.percentComplete = 0;
            vm.restoreProgress.currentMessage = 'Initializing restore operation...';
            vm.restoreProgress.sourceFile = backup.fileName;
            vm.restoreProgress.targetDatabase = targetDatabase;
            vm.restoreProgress.startTime = new Date();
            vm.restoreProgress.endTime = null;
            vm.restoreProgress.errorMessage = null;
            
            logSuccess("Starting database restore operation...");

            try {
                // Update progress
                vm.restoreProgress.percentComplete = 25;
                vm.restoreProgress.currentMessage = 'Sending restore request to server...';
                
                // Call the restore API
                return adminUtilityService.restoreDatabase(restoreRequest)
                    .then(function(response) {
                        console.log("DEBUG: Database restore success", {
                            response: response,
                            targetDatabase: targetDatabase,
                            controllerId: controllerId
                        });
                        
                        // Complete progress
                        vm.restoreProgress.isActive = false;
                        vm.restoreProgress.isComplete = true;
                        vm.restoreProgress.percentComplete = 100;
                        vm.restoreProgress.currentMessage = 'Database restore completed successfully';
                        vm.restoreProgress.endTime = new Date();
                        
                        logSuccess(`Database "${targetDatabase}" restored successfully from ${backup.fileName}`);
                        
                        // Refresh the backup list to show current state
                        return loadRecentBackups();
                    })
                    .catch(function(error) {
                        console.error("DEBUG: Database restore failed", {
                            error: error,
                            targetDatabase: targetDatabase,
                            backup: backup,
                            controllerId: controllerId
                        });
                        
                        // Error progress
                        vm.restoreProgress.isActive = false;
                        vm.restoreProgress.hasError = true;
                        vm.restoreProgress.percentComplete = 0;
                        vm.restoreProgress.endTime = new Date();
                        
                        var errorMessage = error.data && error.data.message ? error.data.message : 'Unknown error occurred';
                        vm.restoreProgress.currentMessage = 'Restore failed';
                        vm.restoreProgress.errorMessage = errorMessage;
                        
                        logError(`Database restore failed: ${errorMessage}`);
                        throw error;
                    });
            } catch (error) {
                console.error("DEBUG: Error in executeRestore", {
                    error: error,
                    backup: backup,
                    targetDatabase: targetDatabase,
                    controllerId: controllerId
                });
                
                // Error progress
                vm.restoreProgress.isActive = false;
                vm.restoreProgress.hasError = true;
                vm.restoreProgress.percentComplete = 0;
                vm.restoreProgress.currentMessage = 'Restore failed';
                vm.restoreProgress.errorMessage = error.message;
                vm.restoreProgress.endTime = new Date();
                
                logError("Error in database restore: " + error.message);
            }
        }

        // Database Export Methods
        function updateGeneratedFilename() {
            if (!vm.databaseExport.selectedDatabase) {
                return; // Don't auto-generate if no database selected
            }

            // Extract the base filename (database name) if it exists
            var baseFilename = '';
            var hasCustomName = false;
            
            if (vm.databaseExport.filename) {
                // Check if current filename follows the pattern: DATABASE_[Schema]_[Data].sql
                var filenameWithoutExt = vm.databaseExport.filename.replace(/\.sql$/i, '');
                var parts = filenameWithoutExt.split('_');
                
                // If filename starts with database name, it's auto-generated pattern
                if (parts.length >= 1 && parts[0] === vm.databaseExport.selectedDatabase) {
                    baseFilename = vm.databaseExport.selectedDatabase;
                    hasCustomName = false; // This is an auto-generated filename
                } else {
                    // User has typed a completely custom filename, keep it as base
                    baseFilename = filenameWithoutExt;
                    hasCustomName = true;
                }
            } else {
                // No filename yet, use database name as base
                baseFilename = vm.databaseExport.selectedDatabase;
                hasCustomName = false;
            }

            // Build the filename components
            var components = [baseFilename.replace(/[^a-zA-Z0-9]/g, '_')];
            
            // Only append Schema/Data suffixes for auto-generated filenames
            if (!hasCustomName) {
                if (vm.databaseExport.includeSchema && vm.databaseExport.includeData) {
                    components.push('Schema_Data');
                } else if (vm.databaseExport.includeSchema) {
                    components.push('Schema');
                } else if (vm.databaseExport.includeData) {
                    components.push('Data');
                }
            } else {
                // For custom filenames, append the suffixes to show what's included
                var suffixes = [];
                if (vm.databaseExport.includeSchema) {
                    suffixes.push('Schema');
                }
                if (vm.databaseExport.includeData) {
                    suffixes.push('Data');
                }
                if (suffixes.length > 0) {
                    components.push(suffixes.join('_'));
                }
            }
            
            // Update the filename
            var newFilename = components.join('_') + '.sql';
            vm.databaseExport.filename = newFilename;
        }

        vm.getExportProgressBarClass = getExportProgressBarClass;

        function getExportProgressBarClass() {
            return 'progress-bar progress-bar-striped active progress-bar-success';
        }

        function getSimpleExportPath() {
            if (!vm.databaseExport.filename) {
                return '';
            }

            var filename = vm.databaseExport.filename;
            
            // Ensure filename has .sql extension
            if (!filename.toLowerCase().endsWith('.sql')) {
                filename += '.sql';
            }

            var fullPath = vm.databaseExport.defaultPath + filename;
            
            return fullPath;
        }

        function generateDatabaseExport() {
            if (!vm.databaseExport.selectedDatabase) {
                logError("Please select a database to export");
                return;
            }

            if (!vm.databaseExport.includeSchema && !vm.databaseExport.includeData) {
                logError("Please select at least Schema or Data to export");
                return;
            }

            var filename = vm.databaseExport.filename;
            if (!filename || filename.trim() === '') {
                logError("Please enter a filename for the export");
                return;
            }

            // Ensure filename has .sql extension
            if (!filename.toLowerCase().endsWith('.sql')) {
                filename += '.sql';
            }

            // Use the simple export path
            var fullFilePath = vm.getSimpleExportPath();
            if (!fullFilePath) {
                logError("Unable to determine export path");
                return;
            }
            
            var exportRequest = {
                Database: vm.databaseExport.selectedDatabase,
                IncludeSchema: vm.databaseExport.includeSchema,
                IncludeData: vm.databaseExport.includeData,
                FilePath: fullFilePath,
                UseCompression: false,
                ExcludeSystemTables: true
            };

            console.log("DEBUG: Starting database export with API call", {
                exportRequest: exportRequest,
                fullFilePath: fullFilePath,
                filename: filename,
                controllerId: controllerId
            });

            vm.databaseExport.isExporting = true;
            vm.databaseExport.exportProgress = 'Initializing export...';
            vm.databaseExport.exportStatus = 'Starting export process...';
            vm.databaseExport.currentStage = 'Initializing';
            vm.databaseExport.progressPercent = 0;

            log("Starting database export: " + vm.databaseExport.selectedDatabase + " to " + filename);
            
            // Actual API call to adminUtilityService
            adminUtilityService.exportDatabase(exportRequest)
                .then(function(response) {
                    console.log("DEBUG: Database export API response", {
                        response: response,
                        controllerId: controllerId,
                        success: response.data.Success || response.data.success,
                        processId: response.data.ProcessId || response.data.processId,
                        responseData: response.data
                    });
                    
                    var success = response.data.Success || response.data.success;
                    var processId = response.data.ProcessId || response.data.processId;
                    
                    if (success && processId) {
                        // Start monitoring the async export process
                        vm.databaseExport.processId = processId;
                        vm.databaseExport.exportProgress = 'Export process started...';
                        vm.databaseExport.exportStatus = 'Monitoring export progress...';
                        
                        console.log("DEBUG: Starting export progress monitoring", {
                            processId: processId,
                            controllerId: controllerId
                        });
                        
                        // Start polling for progress updates
                        startExportProgressMonitoring(processId);
                        
                        log("Database export started - monitoring progress...");
                    } else {
                        vm.databaseExport.exportProgress = 'Export failed to start';
                        vm.databaseExport.exportStatus = 'Error: ' + (response.data.ErrorMessage || response.data.errorMessage || 'Failed to start export process');
                        logError("Database export failed to start: " + (response.data.ErrorMessage || response.data.errorMessage || 'Unknown error'));
                        vm.databaseExport.isExporting = false;
                    }
                })
                .catch(function(error) {
                    console.error("DEBUG: Database export error", {
                        error: error,
                        controllerId: controllerId,
                        errorMessage: error.message,
                        status: error.status
                    });
                    
                    var errorMessage = error.data && error.data.errorMessage ? error.data.errorMessage : error.message || "Unknown error occurred";
                    vm.databaseExport.exportProgress = 'Export failed';
                    vm.databaseExport.exportStatus = 'Error: ' + errorMessage;
                    logError("Error during database export: " + errorMessage);
                    vm.databaseExport.isExporting = false;
                });
        }

        function startExportProgressMonitoring(processId) {
            console.log("DEBUG: startExportProgressMonitoring() called", {
                processId: processId,
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });

            var pollInterval = 1000; // Poll every 1 second
            var maxPolls = 300; // Maximum 5 minutes
            var pollCount = 0;

            function pollProgress() {
                pollCount++;
                console.log("DEBUG: Polling export progress", {
                    processId: processId,
                    pollCount: pollCount,
                    maxPolls: maxPolls,
                    controllerId: controllerId
                });

                adminUtilityService.getBatchProcessStatus(processId)
                    .then(function(statusResponse) {
                        console.log("DEBUG: Export progress update", {
                            processId: processId,
                            status: statusResponse,
                            controllerId: controllerId
                        });

                        var status = statusResponse;
                        if (status) {
                            // Update progress display
                            vm.databaseExport.currentStage = status.stage || 'Processing';
                            vm.databaseExport.exportProgress = status.message || 'Export in progress...';
                            vm.databaseExport.progressPercent = status.percentComplete || 0;
                            
                            // Check if export is complete
                            if (!status.isRunning) {
                                console.log("DEBUG: Export completed", {
                                    processId: processId,
                                    hasError: status.hasError,
                                    finalMessage: status.message,
                                    controllerId: controllerId
                                });

                                if (status.hasError) {
                                    vm.databaseExport.exportProgress = 'Export failed';
                                    vm.databaseExport.exportStatus = 'Error: ' + (status.message || 'Export failed');
                                    logError("Database export failed: " + (status.message || 'Unknown error'));
                                } else {
                                    vm.databaseExport.exportProgress = 'Export completed successfully';
                                    vm.databaseExport.exportStatus = 'File generated at: ' + (status.details && status.details.filePath ? status.details.filePath : 'Export location');
                                    vm.databaseExport.progressPercent = 100;
                                    logSuccess("Database export completed successfully: " + vm.databaseExport.generatedFilename);
                                    if (status.details && status.details.filePath) {
                                        logSuccess("Export location: " + status.details.filePath);
                                    }
                                }
                                
                                vm.databaseExport.isExporting = false;
                                return; // Stop polling
                            }
                            
                            // Continue polling if still running
                            if (pollCount < maxPolls) {
                                setTimeout(pollProgress, pollInterval);
                            } else {
                                console.warn("DEBUG: Export progress polling timeout", {
                                    processId: processId,
                                    maxPolls: maxPolls,
                                    controllerId: controllerId
                                });
                                vm.databaseExport.exportProgress = 'Export timeout';
                                vm.databaseExport.exportStatus = 'Export monitoring timed out - check server logs';
                                vm.databaseExport.isExporting = false;
                                logError("Export progress monitoring timed out");
                                $scope.$apply();
                            }
                        } else {
                            console.warn("DEBUG: No status data received", {
                                processId: processId,
                                statusResponse: statusResponse,
                                controllerId: controllerId
                            });
                            
                            // Continue polling
                            if (pollCount < maxPolls) {
                                setTimeout(pollProgress, pollInterval);
                            }
                        }
                    })
                    .catch(function(error) {
                        console.error("DEBUG: Error polling export progress", {
                            processId: processId,
                            error: error,
                            pollCount: pollCount,
                            controllerId: controllerId
                        });

                        // Continue polling unless we've hit the max
                        if (pollCount < maxPolls) {
                            setTimeout(pollProgress, pollInterval);
                        } else {
                            vm.databaseExport.exportProgress = 'Export monitoring error';
                            vm.databaseExport.exportStatus = 'Failed to monitor export progress';
                            vm.databaseExport.isExporting = false;
                            logError("Failed to monitor export progress: " + error.message);
                            $scope.$apply();
                        }
                    });
            }

            // Start the first poll
            setTimeout(pollProgress, pollInterval);
        }
        
        // Function to fetch batch file debug log for troubleshooting
        function fetchBatchDebugLog() {
            try {
                var debugLogUrl = '/api/adminutility/debug-log?logFile=ksessions_backup_debug.log';
                
                devLogger.logInfo("FETCHING DEBUG LOG", {
                    url: debugLogUrl,
                    controllerId: 'adminSqlBackupsCtl'
                });
                
                $http.get(debugLogUrl)
                    .then(function(response) {
                        if (response.data) {
                            devLogger.logInfo("BATCH DEBUG LOG CONTENT", {
                                logContent: response.data,
                                controllerId: 'adminSqlBackupsCtl'
                            });
                            
                            console.group("BATCH FILE DEBUG LOG");
                            console.log(response.data);
                            console.groupEnd();
                        }
                    })
                    .catch(function(error) {
                        devLogger.logWarning("DEBUG LOG FETCH FAILED", {
                            error: error,
                            controllerId: 'adminSqlBackupsCtl'
                        });
                    });
            } catch (e) {
                devLogger.logError("DEBUG LOG FETCH ERROR", {
                    exception: e.message,
                    controllerId: 'adminSqlBackupsCtl'
                });
            }
        }
    }
})();
