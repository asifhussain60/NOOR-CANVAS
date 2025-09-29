(function () {
    'use strict';
    
    var serviceId = 'adminUtilityService';
    angular.module('app').factory(serviceId, ['$http', 'common', adminUtilityService]);

    function adminUtilityService($http, common) {
        
        var $q = common.$q;
        var baseApiUrl = '/api/adminutility/';

        var service = {
            // Git Operations
            getGitStatus: getGitStatus,
            getRecentCommits: getRecentCommits,
            getPendingFiles: getPendingFiles,
            commitToLocal: commitToLocal,
            pushToRemote: pushToRemote,
            commitAndPush: commitAndPush,
            forceResetToBranch: forceResetToBranch,
            forceResetToCommit: forceResetToCommit,
            killGitProcesses: killGitProcesses,
            
            // Database Operations
            getAvailableDatabases: getAvailableDatabases,
            createDatabaseBackup: createDatabaseBackup,
            createComprehensiveBackup: createComprehensiveBackup,
            getBackupStatus: getBackupStatus,
            rollbackBackup: rollbackBackup,
            restoreDatabase: restoreDatabase,
            getRecentBackups: getRecentBackups,
            getBackupStatistics: getBackupStatistics,
            verifyBackupIntegrity: verifyBackupIntegrity,
            downloadBackup: downloadBackup,
            exportDatabase: exportDatabase,
            pollExportProgress: pollExportProgress,
            
            // Batch File Operations (NEW)
            executeBatchFile: executeBatchFile,
            getBatchProcessStatus: getBatchProcessStatus,
            cancelBatchProcess: cancelBatchProcess,
            
            // System Utilities
            clearCache: clearCache,
            rebuildIndexes: rebuildIndexes,
            updateStatistics: updateStatistics,
            checkIntegrity: checkIntegrity,
            
            // System Status
            getSystemStatus: getSystemStatus
        };

        return service;

        // ===================
        // Git Operations
        // ===================

        function getGitStatus() {
            return $http.get(baseApiUrl + 'git/status')
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        function getPendingFiles() {
            var fullUrl = baseApiUrl + 'git/pending-files';

            return $http.get(fullUrl)
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        function commitToLocal(commitMessage) {
            var requestData = { message: commitMessage };

            return $http.post(baseApiUrl + 'git/commit', requestData)
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        function pushToRemote() {
            return $http.post(baseApiUrl + 'git/push')
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        function commitAndPush(commitMessage) {
            var requestData = { message: commitMessage };

            return $http.post(baseApiUrl + 'git/commitandpush', requestData)
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        function forceResetToBranch(branchName) {
            var requestData = { branch: branchName };

            return $http.post(baseApiUrl + 'git/forcereset', requestData)
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        function forceResetToCommit(commitHash) {
            var requestData = { commitHash: commitHash };

            return $http.post(baseApiUrl + 'git/forceresettocommit', requestData)
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        function killGitProcesses() {
            return $http.post(baseApiUrl + 'git/kill-processes')
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        function getRecentCommits(limit, skip) {
            // Default to 50 commits if not specified, with support for pagination
            var queryParams = [];
            if (limit !== undefined && limit !== null) {
                queryParams.push('limit=' + encodeURIComponent(limit));
            }
            if (skip !== undefined && skip !== null) {
                queryParams.push('skip=' + encodeURIComponent(skip));
            }
            
            var url = baseApiUrl + 'git/commits';
            if (queryParams.length > 0) {
                url += '?' + queryParams.join('&');
            }
            
            return $http.get(url)
                .then(function(response) {
                    // Return the full response data including pagination info
                    return response.data || { commits: [], count: 0, totalCommits: 0, hasMore: false };
                })
                .catch(function(error) {
                    throw error;
                });
        }

        // ===================
        // Database Operations
        // ===================

        function getAvailableDatabases() {
            console.log("DEBUG: getAvailableDatabases() called", {
                serviceId: serviceId,
                endpoint: baseApiUrl + 'database/list',
                timestamp: new Date().toISOString()
            });

            return $http.get(baseApiUrl + 'database/list')
                .then(function(response) {
                    console.log("DEBUG: getAvailableDatabases() success", {
                        serviceId: serviceId,
                        responseData: response.data,
                        databaseCount: response.data && response.data.databases ? response.data.databases.length : 0
                    });
                    return response.data;
                })
                .catch(function(error) {
                    console.error("DEBUG: getAvailableDatabases() failed", {
                        serviceId: serviceId,
                        error: error,
                        status: error.status,
                        message: error.data ? error.data.message : 'Unknown error'
                    });
                    throw error;
                });
        }

        function createDatabaseBackup(backupOptions) {
            return $http.post(baseApiUrl + 'database/backup', backupOptions)
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        function getRecentBackups() {
            return $http.get(baseApiUrl + 'database/backups')
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        function downloadBackup(backupId) {
            // For file downloads, we return the URL for the browser to handle
            return baseApiUrl + 'database/backup/' + backupId + '/download';
        }

        function getBackupStatistics() {
            return $http.get(baseApiUrl + 'database/backup/statistics')
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        function verifyBackupIntegrity() {
            return $http.post(baseApiUrl + 'database/backup/verify')
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        // ===================
        // System Utilities
        // ===================

        function clearCache() {
            return $http.post(baseApiUrl + 'system/clearcache')
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        function rebuildIndexes() {
            return $http.post(baseApiUrl + 'system/rebuildindexes')
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        function updateStatistics() {
            return $http.post(baseApiUrl + 'system/updatestatistics')
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        function checkIntegrity() {
            return $http.post(baseApiUrl + 'system/checkintegrity')
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        // ===================
        // System Status
        // ===================

        function getSystemStatus() {
            return $http.get(baseApiUrl + 'system/status')
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    throw error;
                });
        }

        // ===== COMPREHENSIVE BACKUP OPERATIONS =====

        function createComprehensiveBackup(backupOptions) {
            console.log("DEBUG: adminUtilityService.createComprehensiveBackup() called", {
                endpoint: "database/backup/create",
                backupOptions: backupOptions,
                timestamp: new Date().toISOString()
            });

            var config = {
                timeout: 300000 // 5 minutes timeout for backup initiation
            };

            return $http.post(baseApiUrl + 'database/backup/create', backupOptions, config)
                .then(function(response) {
                    console.log("DEBUG: createComprehensiveBackup() success", {
                        backupId: response.data.backupId,
                        status: response.data.status,
                        message: response.data.message,
                        estimatedDuration: response.data.estimatedDuration
                    });
                    return response.data;
                })
                .catch(function(error) {
                    console.error("DEBUG: createComprehensiveBackup() failed", {
                        error: error,
                        status: error.status,
                        message: error.data ? error.data.message : 'Unknown error',
                        backupOptions: backupOptions
                    });
                    throw error;
                });
        }

        function getBackupStatus(backupId) {
            console.log("DEBUG: adminUtilityService.getBackupStatus() called", {
                endpoint: "database/backup/status",
                backupId: backupId,
                timestamp: new Date().toISOString()
            });

            // Add cache busting to prevent stale responses
            var cacheBuster = '?cacheBuster=' + Date.now();
            return $http.get(baseApiUrl + 'database/backup/status/' + backupId + cacheBuster)
                .then(function(response) {
                    console.log("DEBUG: getBackupStatus() success", {
                        backupId: backupId,
                        status: response.data.stage,
                        percentComplete: response.data.percentComplete,
                        message: response.data.message
                    });
                    return response.data;
                })
                .catch(function(error) {
                    console.error("DEBUG: getBackupStatus() failed", {
                        error: error,
                        status: error.status,
                        message: error.data ? error.data.message : 'Unknown error',
                        backupId: backupId
                    });
                    throw error;
                });
        }

        function rollbackBackup(rollbackOptions) {
            console.log("DEBUG: adminUtilityService.rollbackBackup() called", {
                endpoint: "database/backup/rollback",
                rollbackOptions: rollbackOptions,
                timestamp: new Date().toISOString()
            });

            var config = {
                timeout: 600000 // 10 minutes timeout for rollback initiation
            };

            return $http.post(baseApiUrl + 'database/backup/rollback', rollbackOptions, config)
                .then(function(response) {
                    console.log("DEBUG: rollbackBackup() success", {
                        rollbackId: response.data.rollbackId,
                        status: response.data.status,
                        message: response.data.message,
                        warning: response.data.warning
                    });
                    return response.data;
                })
                .catch(function(error) {
                    console.error("DEBUG: rollbackBackup() failed", {
                        error: error,
                        status: error.status,
                        message: error.data ? error.data.message : 'Unknown error',
                        rollbackOptions: rollbackOptions
                    });
                    throw error;
                });
        }

        function restoreDatabase(restoreOptions) {
            console.log("DEBUG: adminUtilityService.restoreDatabase() called", {
                endpoint: "database/restore",
                restoreOptions: restoreOptions,
                timestamp: new Date().toISOString()
            });

            var config = {
                timeout: 900000 // 15 minutes timeout for database restore
            };

            return $http.post(baseApiUrl + 'database/restore', restoreOptions, config)
                .then(function(response) {
                    console.log("DEBUG: restoreDatabase() success", {
                        restoreId: response.data.restoreId,
                        status: response.data.status,
                        message: response.data.message,
                        databaseName: response.data.databaseName,
                        backupFile: response.data.backupFile
                    });
                    return response.data;
                })
                .catch(function(error) {
                    console.error("DEBUG: restoreDatabase() failed", {
                        error: error,
                        status: error.status,
                        message: error.data ? error.data.message : 'Unknown error',
                        restoreOptions: restoreOptions
                    });
                    throw error;
                });
        }

        // ===================
        // Batch File Operations (NEW)
        // ===================

        function executeBatchFile(batchOptions) {
            console.log("DEBUG: adminUtilityService.executeBatchFile() called", {
                batchOptions: batchOptions,
                batchFilePath: batchOptions.batchFilePath,
                endpoint: baseApiUrl + 'batch/execute',
                timestamp: new Date().toISOString()
            });

            return $http.post(baseApiUrl + 'batch/execute', batchOptions)
                .then(function(response) {
                    console.log("DEBUG: executeBatchFile() success", {
                        batchOptions: batchOptions,
                        responseData: response.data,
                        processId: response.data.processId,
                        started: response.data.started
                    });
                    return response.data;
                })
                .catch(function(error) {
                    console.error("DEBUG: executeBatchFile() failed", {
                        batchOptions: batchOptions,
                        error: error,
                        status: error.status,
                        message: error.data ? error.data.message : 'Unknown error'
                    });
                    throw error;
                });
        }

        function getBatchProcessStatus(processId) {
            console.log("DEBUG: adminUtilityService.getBatchProcessStatus() called", {
                processId: processId,
                endpoint: baseApiUrl + 'batch/status/' + processId,
                timestamp: new Date().toISOString()
            });

            return $http.get(baseApiUrl + 'batch/status/' + processId)
                .then(function(response) {
                    console.log("DEBUG: getBatchProcessStatus() success", {
                        processId: processId,
                        responseData: response.data,
                        isRunning: response.data.isRunning,
                        stage: response.data.stage,
                        percentComplete: response.data.percentComplete
                    });
                    return response.data;
                })
                .catch(function(error) {
                    console.error("DEBUG: getBatchProcessStatus() failed", {
                        processId: processId,
                        error: error,
                        status: error.status,
                        message: error.data ? error.data.message : 'Unknown error'
                    });
                    throw error;
                });
        }

        function cancelBatchProcess(processId) {
            console.log("DEBUG: adminUtilityService.cancelBatchProcess() called", {
                processId: processId,
                endpoint: baseApiUrl + 'batch/cancel/' + processId,
                timestamp: new Date().toISOString()
            });

            return $http.post(baseApiUrl + 'batch/cancel/' + processId)
                .then(function(response) {
                    console.log("DEBUG: cancelBatchProcess() success", {
                        processId: processId,
                        responseData: response.data,
                        cancelled: response.data.cancelled
                    });
                    return response.data;
                })
                .catch(function(error) {
                    console.error("DEBUG: cancelBatchProcess() failed", {
                        processId: processId,
                        error: error,
                        status: error.status,
                        message: error.data ? error.data.message : 'Unknown error'
                    });
                    throw error;
                });
        }

        function exportDatabase(exportRequest) {
            console.log("DEBUG: exportDatabase() called", {
                serviceId: serviceId,
                exportRequest: exportRequest,
                endpoint: baseApiUrl + 'exportdatabase',
                timestamp: new Date().toISOString()
            });

            return $http.post(baseApiUrl + 'exportdatabase', exportRequest)
                .then(function(response) {
                    console.log("DEBUG: exportDatabase() success", {
                        serviceId: serviceId,
                        exportRequest: exportRequest,
                        responseData: response.data,
                        status: response.status
                    });
                    return response;
                })
                .catch(function(error) {
                    console.error("DEBUG: exportDatabase() failed", {
                        serviceId: serviceId,
                        exportRequest: exportRequest,
                        error: error,
                        status: error.status,
                        message: error.data ? error.data.message : 'Unknown error'
                    });
                    throw error;
                });
        }

        function pollExportProgress(processId) {
            console.log("DEBUG: pollExportProgress() called", {
                serviceId: serviceId,
                processId: processId,
                endpoint: baseApiUrl + 'batch/status/' + processId,
                timestamp: new Date().toISOString()
            });

            return $http.get(baseApiUrl + 'batch/status/' + processId)
                .then(function(response) {
                    console.log("DEBUG: pollExportProgress() success", {
                        serviceId: serviceId,
                        processId: processId,
                        responseData: response.data,
                        status: response.status
                    });
                    return response;
                })
                .catch(function(error) {
                    console.error("DEBUG: pollExportProgress() failed", {
                        serviceId: serviceId,
                        processId: processId,
                        error: error,
                        status: error.status,
                        message: error.data ? error.data.message : 'Unknown error'
                    });
                    throw error;
                });
        }
    }
})();
