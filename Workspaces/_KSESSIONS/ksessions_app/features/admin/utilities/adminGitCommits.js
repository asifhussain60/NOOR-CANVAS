(function () {
    "use strict";
    var controllerId = "adminGitCommitsCtl";
    angular.module("app").controller(controllerId,
        ["$scope", "common", "bootstrap.dialog", "config", "adminUtilityService", adminGitCommitsCtl]);

    function adminGitCommitsCtl($scope, common, dlg, config, adminUtilityService) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;

        // Environment Protection - Git utilities are DEVELOPMENT ONLY
        vm.isProductionEnvironment = config.environment === 'Production' || config.environment === 'Release' || config.environment === 'production';
        vm.isDevelopmentSafe = !vm.isProductionEnvironment;

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
        vm.pendingFiles = [];
        vm.isLoadingPendingFiles = false;
        
        // Enhanced pending files management
        vm.pendingFilesDisplay = {
            showAll: false,
            maxDisplayCount: 100,
            filterText: '',
            groupByType: false,
            sortBy: 'fileName', // fileName, fileType, status
            sortReverse: false
        };
        vm.isProcessingGit = false;
        vm.isCommittingLocal = false;
        vm.isPushingRemote = false;
        vm.isCommittingAndPushing = false;
        vm.isRefreshingGit = false;
        vm.isKillingGitProcesses = false;
        vm.lastGitOperationResult = null;
        vm.recentCommits = [];
        
        // Enhanced commit management properties
        vm.commitPagination = {
            currentLimit: 50,
            currentSkip: 0,
            totalCommits: 0,
            hasMore: false,
            isLoading: false,
            availableLimits: [25, 50, 100, 200, 500]
        };
        vm.commitDisplayOptions = {
            showFullHash: false,
            showRelativeDate: true,
            compactView: false
        };

        // Button click wrapper functions
        vm.refreshGitStatus = refreshGitStatus;
        vm.refreshPendingFiles = loadPendingFiles;
        vm.commitToLocal = commitToLocal;
        vm.pushToRemote = pushToRemote;
        vm.commitAndPush = commitAndPush;
        vm.forceResetToBranch = forceResetToBranch;
        vm.forceResetToCommit = forceResetToCommit;
        vm.killGitProcesses = killGitProcesses;
        
        // Enhanced commit management functions
        vm.loadMoreCommits = loadMoreCommits;
        vm.changeCommitLimit = changeCommitLimit;
        vm.refreshCommits = refreshCommits;
        
        // Enhanced pending files management functions
        vm.getFilteredPendingFiles = getFilteredPendingFiles;
        vm.toggleShowAllPendingFiles = toggleShowAllPendingFiles;

        activate();

        function activate() {
            var promises = [
                loadGitStatus(),
                loadRecentCommits(),
                loadPendingFiles()
            ];
            
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation() {
                log("Activated Git Commits Management View", controllerId, config.showDevToasts);
            }
        }

        function loadGitStatus() {
            return adminUtilityService.getGitStatus()
                .then(function(response) {
                    if (response) {
                        vm.gitStatus = response;
                    }
                    return response;
                })
                .catch(function(error) {
                    logError("Error loading git status: " + error.message);
                    throw error;
                });
        }

        function loadRecentCommits() {
            vm.commitPagination.isLoading = true;
            
            return adminUtilityService.getRecentCommits(vm.commitPagination.currentLimit, vm.commitPagination.currentSkip)
                .then(function(response) {
                    if (response && response.commits) {
                        if (vm.commitPagination.currentSkip === 0) {
                            // First load or refresh - replace all commits
                            vm.recentCommits = response.commits;
                        } else {
                            // Loading more - append to existing commits
                            vm.recentCommits = vm.recentCommits.concat(response.commits);
                        }
                        
                        // Update pagination info
                        vm.commitPagination.totalCommits = response.totalCommits || 0;
                        vm.commitPagination.hasMore = response.hasMore || false;
                    } else {
                        // Handle old format for compatibility
                        if (Array.isArray(response)) {
                            vm.recentCommits = response;
                        } else {
                            vm.recentCommits = [];
                        }
                    }
                    return response;
                })
                .catch(function(error) {
                    // Don't throw error for recent commits as it's not critical
                    vm.recentCommits = [];
                    vm.commitPagination.totalCommits = 0;
                    vm.commitPagination.hasMore = false;
                })
                .finally(function() {
                    vm.commitPagination.isLoading = false;
                });
        }

        function loadPendingFiles() {
            vm.isLoadingPendingFiles = true;
            
            return adminUtilityService.getPendingFiles()
                .then(function(response) {
                    if (response && response.files) {
                        vm.pendingFiles = response.files;
                    } else if (response && Array.isArray(response)) {
                        vm.pendingFiles = response;
                    } else {
                        vm.pendingFiles = [];
                    }
                    
                    return response;
                })
                .catch(function(error) {
                    vm.pendingFiles = [];
                    logError("Error loading pending files: " + (error.message || 'Unknown error'));
                    return [];
                })
                .finally(function() {
                    vm.isLoadingPendingFiles = false;
                });
        }

        function refreshGitStatus() {
            vm.isRefreshingGit = true;
            log("Refreshing Git status...");
            
            loadGitStatus()
                .then(function(data) {
                    logSuccess("Git status refreshed successfully");
                    // Also refresh recent commits and pending files
                    return loadRecentCommits();
                })
                .then(function() {
                    // Also refresh pending files
                    return loadPendingFiles();
                })
                .catch(function(error) {
                    logError("Failed to refresh Git status: " + error.message);
                })
                .finally(function() {
                    vm.isRefreshingGit = false;
                });
        }

        function commitToLocal() {
            // Validate commit message first
            if (!vm.gitCommitMessage) {
                logError("Commit message is required");
                return;
            }

            // Validate we're on the correct branch before committing
            if (vm.gitStatus.currentBranch !== 'development') {
                logError("Cannot commit: Currently on branch '" + vm.gitStatus.currentBranch + "'. Git operations only allowed on 'development' branch.");
                return;
            }

            // Show confirmation dialog
            dlg.confirmationDialog("Confirm Local Commit", 
                "Are you sure you want to commit the changes to the local repository?\n\nThis will create a new commit in your local repository with your commit message.",
                "Yes, Commit", "Cancel")
                .then(function(result) {
                    if (result !== "ok") return;

                    vm.isCommittingLocal = true;
                    vm.isProcessingGit = true;
                    log("Committing changes to local repository...");

                    adminUtilityService.commitToLocal(vm.gitCommitMessage)
                        .then(function(response) {
                            if (response.success) {
                                var message = "Changes committed successfully to local [" + vm.gitStatus.currentBranch + "]";
                                logSuccess(message);
                                vm.lastGitOperationResult = {
                                    operation: 'Commit to Local',
                                    success: true,
                                    message: message,
                                    timestamp: new Date()
                                };
                                
                                // Clear commit message and refresh status
                                vm.gitCommitMessage = '';
                                refreshGitStatus();
                            } else {
                                var errorMessage = "Failed to commit to local: " + response.message;
                                logError(errorMessage);
                                vm.lastGitOperationResult = {
                                    operation: 'Commit to Local',
                                    success: false,
                                    message: errorMessage,
                                    timestamp: new Date()
                                };
                            }
                        })
                        .catch(function(error) {
                            var errorMessage = "Error committing to local: " + error.message;
                            logError(errorMessage);
                            vm.lastGitOperationResult = {
                                operation: 'Commit to Local',
                                success: false,
                                message: errorMessage,
                                timestamp: new Date()
                            };
                        })
                        .finally(function() {
                            vm.isCommittingLocal = false;
                            vm.isProcessingGit = false;
                        });
                })
                .catch(function() {
                    // User cancelled the dialog - this is expected behavior, no error needed
                    // Just silently handle the cancellation
                });
        }

        function pushToRemote() {
            if (!vm.gitStatus.hasLocalCommits) {
                logError("No local commits to push");
                return;
            }

            // Show confirmation dialog
            dlg.confirmationDialog("Confirm Push to Remote",
                `Are you sure you want to push the local commits to the remote repository?\n\nThis will make your changes available to other developers on the current branch.`,
                "Yes, Push", "Cancel")
                .then(function(result) {
                    if (result !== "ok") return;
                    performPushToRemote();
                })
                .catch(function() {
                    // User cancelled the dialog - this is expected behavior, no error needed
                    // Just silently handle the cancellation
                });
        }

        function performPushToRemote() {
            // Validate we're on the correct branch before pushing
            if (vm.gitStatus.currentBranch !== 'development') {
                logError("Cannot push: Currently on branch '" + vm.gitStatus.currentBranch + "'. Git operations only allowed on 'development' branch.");
                return;
            }

            vm.isPushingRemote = true;
            vm.isProcessingGit = true;
            log("Pushing " + vm.gitStatus.localCommitsCount + " local commits to remote...");

            adminUtilityService.pushToRemote()
                .then(function(response) {
                    if (response.success) {
                        var message = "Successfully pushed " + vm.gitStatus.localCommitsCount + " commits to remote [" + vm.gitStatus.currentBranch + "]";
                        logSuccess(message);
                        vm.lastGitOperationResult = {
                            operation: 'Push to Remote',
                            success: true,
                            message: message,
                            timestamp: new Date()
                        };
                        
                        // Refresh status after successful push
                        refreshGitStatus();
                    } else {
                        var errorMessage = "Failed to push to remote: " + response.message;
                        logError(errorMessage);
                        vm.lastGitOperationResult = {
                            operation: 'Push to Remote',
                            success: false,
                            message: errorMessage,
                            timestamp: new Date()
                        };
                    }
                })
                .catch(function(error) {
                    var errorMessage = "Error pushing to remote: " + error.message;
                    logError(errorMessage);
                    vm.lastGitOperationResult = {
                        operation: 'Push to Remote',
                        success: false,
                        message: errorMessage,
                        timestamp: new Date()
                    };
                })
                .finally(function() {
                    vm.isPushingRemote = false;
                    vm.isProcessingGit = false;
                });
        }

        function commitAndPush() {
            if (!vm.gitCommitMessage) {
                logError("Commit message is required");
                return;
            }

            // Show confirmation dialog
            dlg.confirmationDialog("Confirm Commit and Push",
                `Are you sure you want to commit and push the changes?\n\nThis will create a commit with your message and immediately push it to the remote repository.`,
                "Yes, Commit & Push", "Cancel")
                .then(function(result) {
                    if (result !== "ok") return;
                    performCommitAndPush();
                })
                .catch(function() {
                    // User cancelled the dialog - this is expected behavior, no error needed
                    // Just silently handle the cancellation
                });
        }

        function performCommitAndPush() {
            // Validate we're on the correct branch before committing and pushing
            if (vm.gitStatus.currentBranch !== 'development') {
                logError("Cannot commit and push: Currently on branch '" + vm.gitStatus.currentBranch + "'. Git operations only allowed on 'development' branch.");
                return;
            }

            vm.isCommittingAndPushing = true;
            vm.isProcessingGit = true;
            log("Committing changes and pushing to remote...");

            adminUtilityService.commitAndPush(vm.gitCommitMessage)
                .then(function(response) {
                    if (response.success) {
                        var message = "Changes committed and pushed successfully to [" + vm.gitStatus.currentBranch + "]";
                        logSuccess(message);
                        vm.lastGitOperationResult = {
                            operation: 'Commit & Push',
                            success: true,
                            message: message,
                            timestamp: new Date()
                        };
                        
                        // Clear commit message and refresh status
                        vm.gitCommitMessage = '';
                        refreshGitStatus();
                    } else {
                        var errorMessage = "Failed to commit and push: " + response.message;
                        logError(errorMessage);
                        vm.lastGitOperationResult = {
                            operation: 'Commit & Push',
                            success: false,
                            message: errorMessage,
                            timestamp: new Date()
                        };
                    }
                })
                .catch(function(error) {
                    var errorMessage = "Error committing and pushing: " + error.message;
                    logError(errorMessage);
                    vm.lastGitOperationResult = {
                        operation: 'Commit & Push',
                        success: false,
                        message: errorMessage,
                        timestamp: new Date()
                    };
                })
                .finally(function() {
                    vm.isCommittingAndPushing = false;
                    vm.isProcessingGit = false;
                });
        }

        // Force Reset to Branch function
        // WARNING: Backend implementation not found - these endpoints may not exist
        function forceResetToBranch() {
            // Production environment protection
            if (vm.isProductionEnvironment) {
                logError("Force reset is not allowed in production environment");
                return;
            }

            // Backend validation - check if endpoint exists
            logError("Force reset functionality is not currently implemented in the backend API");
            return;

            // Validation
            if (!vm.gitStatus.currentBranch || vm.gitStatus.currentBranch === 'Loading...') {
                logError("Cannot reset: No valid branch detected");
                return;
            }

            // Show confirmation dialog with strong warning
            dlg.confirmationDialog("⚠️ DANGER: Force Reset to Branch", 
                `WARNING: This will forcefully reset your local branch to match the remote origin.\n\n` +
                `Current Branch: ${vm.gitStatus.currentBranch}\n\n` +
                `This action will:\n` +
                `• PERMANENTLY DELETE all uncommitted changes\n` +
                `• PERMANENTLY DELETE any local commits not pushed to remote\n` +
                `• Reset your working directory to match the remote branch\n\n` +
                `THIS CANNOT BE UNDONE!\n\n` +
                `Are you absolutely sure you want to proceed?`,
                "Yes, Force Reset (DANGER)", "Cancel")
                .then(function(result) {
                    if (result !== "ok") {
                        return;
                    }

                    vm.isProcessingGit = true;
                    log(`Force resetting to origin/${vm.gitStatus.currentBranch}...`);

                    adminUtilityService.forceResetToBranch(vm.gitStatus.currentBranch)
                        .then(function(response) {
                            if (response.success) {
                                var message = `Branch forcefully reset to origin/${vm.gitStatus.currentBranch} successfully`;
                                logSuccess(message);
                                vm.lastGitOperationResult = {
                                    operation: 'Force Reset to Branch',
                                    success: true,
                                    message: message,
                                    timestamp: new Date()
                                };
                                
                                // Clear any commit message and refresh status
                                vm.gitCommitMessage = '';
                                refreshGitStatus();
                                loadRecentCommits();
                            } else {
                                var errorMessage = "Failed to force reset: " + response.message;
                                logError(errorMessage);
                                vm.lastGitOperationResult = {
                                    operation: 'Force Reset to Branch',
                                    success: false,
                                    message: errorMessage,
                                    timestamp: new Date()
                                };
                            }
                        })
                        .catch(function(error) {
                            var errorMessage = "Error during force reset: " + error.message;
                            logError(errorMessage);
                            vm.lastGitOperationResult = {
                                operation: 'Force Reset to Branch',
                                success: false,
                                message: errorMessage,
                                timestamp: new Date()
                            };
                        })
                        .finally(function() {
                            vm.isProcessingGit = false;
                        });
                })
                .catch(function() {
                    // User cancelled the dialog - this is expected behavior, no error needed
                    // Just silently handle the cancellation
                });
        }

        // Force Reset to Specific Commit function
        // WARNING: Backend implementation not found - these endpoints may not exist
        function forceResetToCommit(commit) {
            // Production environment protection
            if (vm.isProductionEnvironment) {
                logError("Force reset is not allowed in production environment");
                return;
            }

            // Backend validation - check if endpoint exists
            logError("Force reset to commit functionality is not currently implemented in the backend API");
            return;

            // Validation
            if (!commit || !commit.hash) {
                logError("Cannot reset: No valid commit provided");
                return;
            }

            // Show confirmation dialog with strong warning
            var commitShortHash = commit.hash.substring(0, 8);
            var truncatedMessage = commit.message.length > 80 ? 
                commit.message.substring(0, 80) + "..." : 
                commit.message;

            dlg.confirmationDialog("⚠️ DANGER: Force Reset to Specific Commit", 
                `WARNING: This will forcefully reset your local repository to a specific commit.\n\n` +
                `Target Commit: ${commitShortHash}\n` +
                `Message: ${truncatedMessage}\n` +
                `Author: ${commit.author}\n` +
                `Date: ${new Date(commit.date).toLocaleDateString()}\n\n` +
                `This action will:\n` +
                `• PERMANENTLY DELETE all uncommitted changes\n` +
                `• PERMANENTLY DELETE any commits made after this point\n` +
                `• Reset your working directory to this exact commit state\n\n` +
                `THIS CANNOT BE UNDONE!\n\n` +
                `Are you absolutely sure you want to reset to this commit?`,
                "Yes, Reset to This Commit (DANGER)", "Cancel")
                .then(function(result) {
                    if (result !== "ok") {
                        return;
                    }

                    vm.isProcessingGit = true;
                    log(`Force resetting to commit ${commitShortHash}...`);

                    adminUtilityService.forceResetToCommit(commit.hash)
                        .then(function(response) {
                            if (response.success) {
                                var message = `Repository forcefully reset to commit ${commitShortHash} successfully`;
                                logSuccess(message);
                                vm.lastGitOperationResult = {
                                    operation: 'Force Reset to Commit',
                                    success: true,
                                    message: message,
                                    targetCommit: commitShortHash,
                                    timestamp: new Date()
                                };
                                
                                // Clear any commit message and refresh status
                                vm.gitCommitMessage = '';
                                refreshGitStatus();
                                loadRecentCommits();
                            } else {
                                var errorMessage = "Failed to force reset to commit: " + response.message;
                                logError(errorMessage);
                                vm.lastGitOperationResult = {
                                    operation: 'Force Reset to Commit',
                                    success: false,
                                    message: errorMessage,
                                    targetCommit: commitShortHash,
                                    timestamp: new Date()
                                };
                            }
                        })
                        .catch(function(error) {
                            var errorMessage = "Error during force reset to commit: " + error.message;
                            logError(errorMessage);
                            vm.lastGitOperationResult = {
                                operation: 'Force Reset to Commit',
                                success: false,
                                message: errorMessage,
                                targetCommit: commitShortHash,
                                timestamp: new Date()
                            };
                        })
                        .finally(function() {
                            vm.isProcessingGit = false;
                        });
                })
                .catch(function() {
                    // User cancelled the dialog - this is expected behavior, no error needed
                    // Just silently handle the cancellation
                });
        }

        // Enhanced commit management functions
        function loadMoreCommits() {
            if (vm.commitPagination.isLoading || !vm.commitPagination.hasMore) {
                return;
            }
            
            vm.commitPagination.currentSkip += vm.commitPagination.currentLimit;
            loadRecentCommits();
        }

        function changeCommitLimit(newLimit) {
            vm.commitPagination.currentLimit = newLimit;
            vm.commitPagination.currentSkip = 0;
            loadRecentCommits();
        }

        function refreshCommits() {
            vm.commitPagination.currentSkip = 0;
            loadRecentCommits();
        }

        // Enhanced pending files management functions
        function getFilteredPendingFiles() {
            if (!vm.pendingFiles || vm.pendingFiles.length === 0) {
                return [];
            }

            var filtered = vm.pendingFiles;

            // Apply text filter
            if (vm.pendingFilesDisplay.filterText) {
                var filterLower = vm.pendingFilesDisplay.filterText.toLowerCase();
                filtered = filtered.filter(function(file) {
                    return file.fileName.toLowerCase().indexOf(filterLower) !== -1 ||
                           (file.fileType && file.fileType.toLowerCase().indexOf(filterLower) !== -1);
                });
            }

            // Apply sorting
            if (vm.pendingFilesDisplay.sortBy) {
                filtered.sort(function(a, b) {
                    var aVal = '';
                    var bVal = '';
                    
                    switch (vm.pendingFilesDisplay.sortBy) {
                        case 'fileName':
                            aVal = a.fileName || '';
                            bVal = b.fileName || '';
                            break;
                        case 'fileType':
                            aVal = a.fileType || '';
                            bVal = b.fileType || '';
                            break;
                        case 'status':
                            aVal = a.statusCode || '';
                            bVal = b.statusCode || '';
                            break;
                        default:
                            aVal = a.fileName || '';
                            bVal = b.fileName || '';
                    }
                    
                    var result = aVal.localeCompare(bVal);
                    return vm.pendingFilesDisplay.sortReverse ? -result : result;
                });
            }

            // Apply display limit
            if (!vm.pendingFilesDisplay.showAll && filtered.length > vm.pendingFilesDisplay.maxDisplayCount) {
                return filtered.slice(0, vm.pendingFilesDisplay.maxDisplayCount);
            }

            return filtered;
        }

        function toggleShowAllPendingFiles() {
            vm.pendingFilesDisplay.showAll = !vm.pendingFilesDisplay.showAll;
        }

        function killGitProcesses() {
            console.log("DEBUG: killGitProcesses() called", {
                isKillingGitProcesses: vm.isKillingGitProcesses,
                controllerId: controllerId,
                timestamp: new Date().toISOString()
            });

            // Production environment protection
            if (vm.isProductionEnvironment) {
                logError("Git process termination is not allowed in production environment");
                return;
            }

            // Prevent multiple simultaneous kill attempts
            if (vm.isKillingGitProcesses) {
                console.warn("DEBUG: Kill Git processes already in progress");
                return;
            }

            vm.isKillingGitProcesses = true;

            // Show confirmation dialog
            dlg.confirmationDialog("🛑 Kill Git Processes", 
                `This will forcefully terminate all running Git processes and clear any Git locks.\n\n` +
                `This action will:\n` +
                `• Stop all active Git commands\n` +
                `• Clear Git index locks\n` +
                `• Allow new Git operations to proceed\n\n` +
                `Are you sure you want to proceed?`,
                "Yes, Kill Git Processes", "Cancel")
                .then(function(result) {
                    if (result !== "ok") {
                        console.log("DEBUG: Kill Git processes cancelled by user");
                        vm.isKillingGitProcesses = false;
                        return;
                    }

                    console.log("DEBUG: User confirmed Git process termination");
                    
                    // Call the backend API to kill Git processes
                    adminUtilityService.killGitProcesses()
                        .then(function(response) {
                            console.log("DEBUG: killGitProcesses() API response", {
                                response: response,
                                success: response.success,
                                message: response.message
                            });

                            if (response.success) {
                                var successMessage = "Git processes killed successfully: " + response.message;
                                logSuccess(successMessage);
                                vm.lastGitOperationResult = {
                                    operation: 'Kill Git Processes',
                                    success: true,
                                    message: successMessage,
                                    timestamp: new Date()
                                };
                                
                                // Refresh Git status after killing processes
                                refreshGitStatus();
                            } else {
                                var errorMessage = "Failed to kill Git processes: " + response.message;
                                logError(errorMessage);
                                vm.lastGitOperationResult = {
                                    operation: 'Kill Git Processes',
                                    success: false,
                                    message: errorMessage,
                                    timestamp: new Date()
                                };
                            }
                        })
                        .catch(function(error) {
                            var errorMessage = "Error killing Git processes: " + error.message;
                            console.error("DEBUG: killGitProcesses() failed", {
                                error: error,
                                errorMessage: errorMessage
                            });
                            logError(errorMessage);
                            vm.lastGitOperationResult = {
                                operation: 'Kill Git Processes',
                                success: false,
                                message: errorMessage,
                                timestamp: new Date()
                            };
                        })
                        .finally(function() {
                            console.log("DEBUG: killGitProcesses() completed", {
                                finalState: vm.isKillingGitProcesses,
                                timestamp: new Date().toISOString()
                            });
                            vm.isKillingGitProcesses = false;
                        });
                })
                .catch(function() {
                    // User cancelled the dialog - this is expected behavior, no error needed
                    // Just silently handle the cancellation
                    console.log("DEBUG: Kill Git processes dialog cancelled by user");
                    vm.isKillingGitProcesses = false;
                });
        }
    }
})();