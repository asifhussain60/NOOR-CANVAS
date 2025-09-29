(function () {
    'use strict';

    var controllerId = 'adminDocumentationCtl';
    angular.module('app').controller(controllerId,
        ['$scope', '$timeout', 'common', 'config', 'bootstrap.dialog', 'datacontext', 'silentLogger', 'documentationService', adminDocumentationCtl]);

    function adminDocumentationCtl($scope, $timeout, common, config, dlg, datacontext, silentLogger, documentationService) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, 'success');
        var logError = getLogFn(controllerId, 'error');

        $scope.vm = {}; var vm = $scope.vm;

        // Debug console entry
        silentLogger.debug('adminDocumentationCtl constructor called', {
            controllerId: controllerId,
            timestamp: new Date().toISOString(),
            dependencies: ['$scope', '$timeout', 'common', 'config', 'bootstrap.dialog', 'datacontext', 'silentLogger', 'documentationService']
        });

        // Properties
        vm.documentationTree = [];
        vm.selectedFile = null;
        vm.selectedCategory = null;
        vm.isLoading = false;
        vm.isScanning = false;
        vm.isSearching = false;
        vm.searchQuery = '';
        vm.searchResults = [];
        vm.searchPerformed = false;
        vm.lastScanResult = null;
        vm.documentationStats = {
            totalFiles: 0,
            totalCategories: 0,
            lastScanDate: null
        };
        
        // View state properties
        vm.showSearch = false;
        vm.expandedNodes = {};
        
        // Search configuration
        vm.searchConfig = {
            page: 1,
            pageSize: 20,
            totalResults: 0
        };

        // Panel configuration properties
        vm.panelConfig = {
            showTreePanel: true,
            showDetailsPanel: true,
            showSearchPanel: true,
            treeWidth: 30,
            detailsWidth: 70
        };

        // Methods
        vm.loadDocumentationTree = loadDocumentationTree;
        vm.selectFile = selectFile;
        vm.selectCategory = selectCategory;
        vm.scanWorkspace = scanWorkspace;
        vm.refreshCache = refreshCache;
        vm.toggleNode = toggleNode;
        vm.isNodeExpanded = isNodeExpanded;
        vm.toggleSearch = toggleSearch;
        vm.searchDocumentation = searchDocumentation;
        vm.loadNextSearchPage = loadNextSearchPage;
        vm.getFileIcon = getFileIcon;
        vm.getCategoryIcon = getCategoryIcon;
        vm.searchDocuments = searchDocuments;
        vm.clearSearch = clearSearch;
        vm.changeViewMode = changeViewMode;
        vm.refreshData = refreshData;
        vm.savePanelConfiguration = savePanelConfiguration;
        vm.resetPanelConfiguration = resetPanelConfiguration;
        vm.exportConfiguration = exportConfiguration;
        vm.clearCache = clearCache;
        vm.validateFileAccess = validateFileAccess;
        vm.formatFileSize = formatFileSize;
        vm.formatDate = formatDate;

        // Initialize controller
        activate();

        function activate() {
            silentLogger.debug('adminDocumentationCtl activate called', {
                controllerId: controllerId,
                timestamp: new Date().toISOString(),
                initialState: {
                    treeLoaded: vm.documentationTree.length,
                    isLoading: vm.isLoading
                }
            });

            // Comprehensive service validation
            silentLogger.debug('documentationService dependency validation', {
                serviceExists: !!documentationService,
                serviceMethods: {
                    getDocumentationTree: typeof documentationService.getDocumentationTree,
                    getFileContent: typeof documentationService.getFileContent,
                    scanWorkspace: typeof documentationService.scanWorkspace,
                    refreshCache: typeof documentationService.refreshCache,
                    searchDocuments: typeof documentationService.searchDocuments,
                    clearCache: typeof documentationService.clearCache,
                    validateFileOperation: typeof documentationService.validateFileOperation
                },
                allMethodsAvailable: !!(
                    documentationService.getDocumentationTree &&
                    documentationService.getFileContent &&
                    documentationService.scanWorkspace &&
                    documentationService.refreshCache &&
                    documentationService.searchDocuments &&
                    documentationService.clearCache &&
                    documentationService.validateFileOperation
                ),
                controllerId: controllerId,
                context: 'dependency.validation'
            });

            var promises = [
                loadDocumentationTree()
            ];

            silentLogger.debug('Controller activation starting with promises', {
                promiseCount: promises.length,
                controllerId: controllerId
            });

            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation() {
                // Initialize Bootstrap tooltips
                silentLogger.debug('Initializing Bootstrap tooltips', {
                    controllerId: controllerId,
                    context: 'tooltip.initialization'
                });
                
                // Use $timeout to ensure DOM is fully rendered before initializing tooltips
                $timeout(function() {
                    try {
                        // Initialize tooltips using jQuery wrapped in try-catch for safety
                        angular.element('[data-toggle="tooltip"]').tooltip({
                            container: 'body',
                            placement: 'auto',
                            trigger: 'hover'
                        });
                        silentLogger.debug('Bootstrap tooltips initialized successfully', {
                            controllerId: controllerId,
                            context: 'tooltip.initialization.success'
                        });
                    } catch (error) {
                        silentLogger.error('Error initializing Bootstrap tooltips', {
                            controllerId: controllerId,
                            error: error.message,
                            context: 'tooltip.initialization.error'
                        });
                    }
                }, 500);
                
                silentLogger.info('adminDocumentationCtl initialization completed', {
                    controllerId: controllerId,
                    treeLoaded: vm.documentationTree.length > 0,
                    totalCategories: vm.documentationTree.length,
                    statsLoaded: vm.documentationStats.totalFiles > 0,
                    allDependenciesResolved: true,
                    timestamp: new Date().toISOString()
                });
                log("Activated Documentation View", controllerId, config.showDevToasts);
            }
        }

        function loadDocumentationTree() {
            silentLogger.debug('loadDocumentationTree called', {
                currentTreeSize: vm.documentationTree.length,
                isLoading: vm.isLoading,
                context: 'adminDocumentationCtl.loadDocumentationTree'
            });

            vm.isLoading = true;
            
            return documentationService.getDocumentationTree()
                .then(function(response) {
                    silentLogger.info('Documentation tree loaded successfully via service', {
                        categoriesCount: response.categories ? response.categories.length : 0,
                        totalFiles: response.totalFiles,
                        totalCategories: response.totalCategories,
                        lastScanDate: response.lastScanDate,
                        context: 'adminDocumentationCtl.loadDocumentationTree'
                    });

                    vm.documentationTree = response.categories || [];
                    vm.documentationStats = {
                        totalFiles: response.totalFiles || 0,
                        totalCategories: response.totalCategories || 0,
                        lastScanDate: response.lastScanDate
                    };

                    // Expand first level by default
                    if (vm.documentationTree.length > 0) {
                        silentLogger.debug('Auto-expanding first level categories', {
                            categoryCount: vm.documentationTree.length,
                            context: 'adminDocumentationCtl.loadDocumentationTree'
                        });

                        vm.documentationTree.forEach(function(category) {
                            vm.expandedNodes[category.categoryId] = true;
                        });
                    }

                    logSuccess("Documentation tree loaded successfully", null, config.showDevToasts);
                    return vm.documentationTree;
                })
                .catch(function(error) {
                    silentLogger.error('Failed to load documentation tree via service', {
                        error: error.message,
                        status: error.status,
                        stack: error.stack,
                        context: 'adminDocumentationCtl.loadDocumentationTree'
                    });
                    logError("Error loading documentation tree: " + error.message);
                    throw error;
                })
                .finally(function() {
                    vm.isLoading = false;
                    silentLogger.debug('loadDocumentationTree completed', {
                        isLoading: vm.isLoading,
                        treeSize: vm.documentationTree.length,
                        expandedCount: Object.keys(vm.expandedNodes).length
                    });
                });
        }

        function selectFile(file) {
            silentLogger.userAction('Documentation file selected', {
                fileId: file.fileId,
                fileName: file.fileName,
                categoryId: file.categoryId,
                fileType: file.fileType,
                context: 'adminDocumentationCtl.selectFile'
            });

            if (!file || !file.fileId) {
                silentLogger.validation('Invalid file selection attempted', {
                    file: file,
                    hasFileId: !!(file && file.fileId),
                    context: 'adminDocumentationCtl.selectFile'
                });
                logError("Invalid file selection");
                return;
            }

            vm.isLoading = true;
            vm.selectedFile = null;

            return documentationService.getFileContent(file.fileId)
                .then(function(response) {
                    silentLogger.info('File content loaded successfully via service', {
                        fileId: file.fileId,
                        fileName: response.fileName,
                        wordCount: response.wordCount,
                        fileSize: response.fileSize,
                        lastModified: response.lastModified,
                        context: 'adminDocumentationCtl.selectFile'
                    });

                    vm.selectedFile = response;
                    vm.selectedCategory = null; // Clear category selection
                    logSuccess("File loaded: " + response.displayName, null, config.showDevToasts);
                    return response;
                })
                .catch(function(error) {
                    silentLogger.error('Failed to load file content via service', {
                        fileId: file.fileId,
                        fileName: file.fileName,
                        error: error.message,
                        status: error.status,
                        stack: error.stack,
                        context: 'adminDocumentationCtl.selectFile'
                    });
                    logError("Error loading file: " + error.message);
                    throw error;
                })
                .finally(function() {
                    vm.isLoading = false;
                    silentLogger.debug('selectFile operation completed', {
                        fileLoaded: !!vm.selectedFile,
                        isLoading: vm.isLoading
                    });
                });
        }

        function selectCategory(category) {
            silentLogger.userAction('Documentation category selected', {
                categoryId: category.categoryId,
                categoryName: category.categoryName,
                fileCount: category.fileCount,
                hasFiles: !!(category.files && category.files.length > 0),
                context: 'adminDocumentationCtl.selectCategory'
            });

            vm.selectedCategory = category;
            vm.selectedFile = null; // Clear file selection
            
            // Toggle expansion state
            toggleNode(category);

            silentLogger.debug('Category selection completed', {
                selectedCategoryId: vm.selectedCategory ? vm.selectedCategory.categoryId : null,
                selectedFileCleared: vm.selectedFile === null,
                nodeExpanded: isNodeExpanded(category)
            });
        }

        function scanWorkspace(forceFull) {
            silentLogger.userAction('Workspace scan initiated', {
                forceFull: forceFull || false,
                currentStats: vm.documentationStats,
                context: 'adminDocumentationCtl.scanWorkspace'
            });

            vm.isScanning = true;
            vm.lastScanResult = null;

            var scanRequest = {
                forceFull: forceFull || false
            };

            return documentationService.scanWorkspace(scanRequest)
                .then(function(response) {
                    silentLogger.info('Workspace scan completed successfully', {
                        scanId: response.scanId,
                        filesProcessed: response.filesProcessed,
                        newFiles: response.newFiles,
                        updatedFiles: response.updatedFiles,
                        removedFiles: response.removedFiles,
                        errorCount: response.errorCount,
                        duration: response.duration,
                        success: response.success,
                        forceFull: forceFull,
                        context: 'adminDocumentationCtl.scanWorkspace'
                    });

                    vm.lastScanResult = response;
                    
                    var message = "Scan completed: " + response.filesProcessed + " files processed, " +
                        response.newFiles + " new, " + response.updatedFiles + " updated";
                    
                    if (response.errorCount > 0) {
                        message += " (" + response.errorCount + " errors)";
                        log(message, null, config.showDevToasts);
                    } else {
                        logSuccess(message, null, config.showDevToasts);
                    }

                    // Reload tree after scan
                    silentLogger.debug('Reloading documentation tree after scan', {
                        scanSuccess: response.success,
                        filesProcessed: response.filesProcessed
                    });
                    
                    return loadDocumentationTree();
                })
                .catch(function(error) {
                    silentLogger.error('Workspace scan failed', {
                        forceFull: forceFull,
                        error: error.message,
                        status: error.status,
                        stack: error.stack,
                        context: 'adminDocumentationCtl.scanWorkspace'
                    });
                    logError("Scan error: " + error.message);
                    throw error;
                })
                .finally(function() {
                    vm.isScanning = false;
                    silentLogger.debug('scanWorkspace operation completed', {
                        isScanning: vm.isScanning,
                        hasLastScanResult: !!vm.lastScanResult
                    });
                });
        }

        function refreshCache() {
            silentLogger.userAction('Cache refresh initiated', {
                currentCacheState: vm.documentationStats,
                context: 'adminDocumentationCtl.refreshCache'
            });

            vm.isLoading = true;

            return documentationService.refreshCache()
                .then(function(response) {
                    silentLogger.info('Cache refresh completed successfully', {
                        success: response.success,
                        message: response.message,
                        cacheSize: response.cacheSize,
                        context: 'adminDocumentationCtl.refreshCache'
                    });

                    if (response.success) {
                        logSuccess("Documentation cache refreshed successfully", null, config.showDevToasts);
                        
                        // Reload tree after refresh
                        silentLogger.debug('Reloading documentation tree after cache refresh');
                        return loadDocumentationTree();
                    } else {
                        logError("Cache refresh failed: " + response.message);
                        return response;
                    }
                })
                .catch(function(error) {
                    silentLogger.error('Cache refresh failed', {
                        error: error.message,
                        status: error.status,
                        stack: error.stack,
                        context: 'adminDocumentationCtl.refreshCache'
                    });
                    logError("Cache refresh error: " + error.message);
                    throw error;
                })
                .finally(function() {
                    vm.isLoading = false;
                    silentLogger.debug('refreshCache operation completed', {
                        isLoading: vm.isLoading
                    });
                });
        }

        function searchDocumentation(newSearch) {
            if (newSearch === true) {
                // Reset search pagination for new search
                vm.searchConfig.page = 1;
                vm.searchResults = [];
            }

            silentLogger.userAction('Documentation search initiated', {
                query: vm.searchQuery,
                page: vm.searchConfig.page,
                pageSize: vm.searchConfig.pageSize,
                isNewSearch: newSearch === true,
                currentResultsCount: vm.searchResults.length,
                context: 'adminDocumentationCtl.searchDocumentation'
            });

            if (!vm.searchQuery || vm.searchQuery.trim().length < 2) {
                silentLogger.validation('Search query validation failed', {
                    query: vm.searchQuery,
                    queryLength: vm.searchQuery ? vm.searchQuery.trim().length : 0,
                    minimumLength: 2,
                    context: 'adminDocumentationCtl.searchDocumentation'
                });
                logError("Please enter at least 2 characters to search");
                return;
            }

            vm.isSearching = true;
            
            var searchParams = {
                query: vm.searchQuery.trim(),
                page: vm.searchConfig.page,
                size: vm.searchConfig.pageSize
            };

            return documentationService.searchDocuments(searchParams)
                .then(function(response) {
                    silentLogger.info('Search completed successfully via service', {
                        query: vm.searchQuery,
                        totalResults: response.totalResults,
                        returnedResults: response.results ? response.results.length : 0,
                        searchDuration: response.searchDuration,
                        page: vm.searchConfig.page,
                        isNewSearch: newSearch === true,
                        context: 'adminDocumentationCtl.searchDocumentation'
                    });

                    if (newSearch === true) {
                        vm.searchResults = response.results || [];
                    } else {
                        // Append results for pagination
                        vm.searchResults = vm.searchResults.concat(response.results || []);
                    }

                    vm.searchConfig.totalResults = response.totalResults || 0;
                    vm.searchPerformed = true;

                    var message = "Found " + vm.searchConfig.totalResults + " result" + 
                        (vm.searchConfig.totalResults === 1 ? "" : "s") + " for '" + vm.searchQuery + "'";
                    logSuccess(message, null, config.showDevToasts);

                    return response;
                })
                .catch(function(error) {
                    silentLogger.error('Search operation failed via service', {
                        query: vm.searchQuery,
                        page: vm.searchConfig.page,
                        error: error.message,
                        status: error.status,
                        stack: error.stack,
                        context: 'adminDocumentationCtl.searchDocumentation'
                    });
                    logError("Search error: " + error.message);
                    throw error;
                })
                .finally(function() {
                    vm.isSearching = false;
                    silentLogger.debug('searchDocumentation operation completed', {
                        isSearching: vm.isSearching,
                        resultsCount: vm.searchResults.length,
                        searchPerformed: vm.searchPerformed
                    });
                });
        }

        function clearSearch() {
            silentLogger.userAction('Search cleared', {
                previousQuery: vm.searchQuery,
                previousResults: vm.searchResults.length,
                previousTotalResults: vm.searchConfig.totalResults,
                context: 'adminDocumentationCtl.clearSearch'
            });

            vm.searchQuery = '';
            vm.searchResults = [];
            vm.searchPerformed = false;
            vm.searchConfig.page = 1;
            vm.searchConfig.totalResults = 0;
            
            log("Search cleared", null, config.showDevToasts);

            silentLogger.debug('Search state reset completed', {
                query: vm.searchQuery,
                resultsCount: vm.searchResults.length,
                searchPerformed: vm.searchPerformed
            });
        }

        function toggleNode(category) {
            if (!category || !category.categoryId) {
                silentLogger.validation('Invalid category for node toggle', {
                    category: category,
                    hasCategoryId: !!(category && category.categoryId),
                    context: 'adminDocumentationCtl.toggleNode'
                });
                return;
            }

            var wasExpanded = vm.expandedNodes[category.categoryId];
            vm.expandedNodes[category.categoryId] = !wasExpanded;

            silentLogger.userAction('Tree node toggled', {
                categoryId: category.categoryId,
                categoryName: category.categoryName,
                wasExpanded: wasExpanded,
                nowExpanded: vm.expandedNodes[category.categoryId],
                totalExpandedNodes: Object.keys(vm.expandedNodes).filter(function(key) { 
                    return vm.expandedNodes[key]; 
                }).length,
                context: 'adminDocumentationCtl.toggleNode'
            });
        }

        function isNodeExpanded(category) {
            if (!category || !category.categoryId) {
                return false;
            }
            return vm.expandedNodes[category.categoryId] === true;
        }

        function toggleSearch() {
            vm.showSearch = !vm.showSearch;
            
            silentLogger.userAction('Search panel toggled', {
                showSearch: vm.showSearch,
                hasActiveSearch: vm.searchPerformed,
                currentQuery: vm.searchQuery,
                context: 'adminDocumentationCtl.toggleSearch'
            });

            if (!vm.showSearch) {
                silentLogger.debug('Clearing search due to panel close');
                clearSearch();
            }
        }

        function loadNextSearchPage() {
            if (vm.isSearching || !vm.searchQuery) {
                silentLogger.debug('Skipping next search page load', {
                    isSearching: vm.isSearching,
                    hasQuery: !!vm.searchQuery,
                    context: 'adminDocumentationCtl.loadNextSearchPage'
                });
                return;
            }

            var hasMoreResults = (vm.searchConfig.page * vm.searchConfig.pageSize) < vm.searchConfig.totalResults;
            if (!hasMoreResults) {
                silentLogger.debug('No more search results to load', {
                    currentPage: vm.searchConfig.page,
                    pageSize: vm.searchConfig.pageSize,
                    totalResults: vm.searchConfig.totalResults,
                    context: 'adminDocumentationCtl.loadNextSearchPage'
                });
                return;
            }

            silentLogger.userAction('Loading next search page', {
                currentPage: vm.searchConfig.page,
                nextPage: vm.searchConfig.page + 1,
                totalResults: vm.searchConfig.totalResults,
                currentResultsCount: vm.searchResults.length,
                pageSize: vm.searchConfig.pageSize,
                context: 'adminDocumentationCtl.loadNextSearchPage'
            });

            vm.searchConfig.page++;
            return searchDocumentation(false); // false = append results, don't reset
        }

        function getFileIcon(fileName) {
            var extension = fileName ? fileName.split('.').pop().toLowerCase() : '';
            var icon;
            
            switch (extension) {
                case 'md': icon = 'fa-file-text'; break;
                case 'txt': icon = 'fa-file-text-o'; break;
                case 'pdf': icon = 'fa-file-pdf-o'; break;
                case 'doc':
                case 'docx': icon = 'fa-file-word-o'; break;
                case 'js': icon = 'fa-file-code-o'; break;
                case 'html':
                case 'htm': icon = 'fa-file-code-o'; break;
                case 'css': icon = 'fa-file-code-o'; break;
                case 'json': icon = 'fa-file-code-o'; break;
                case 'xml': icon = 'fa-file-code-o'; break;
                default: icon = 'fa-file-o'; break;
            }

            silentLogger.debug('File icon determined', {
                fileName: fileName,
                extension: extension,
                icon: icon,
                context: 'adminDocumentationCtl.getFileIcon'
            });

            return icon;
        }

        function getCategoryIcon(category) {
            var icon;
            
            if (category && category.iconClass) {
                icon = category.iconClass;
            } else {
                icon = isNodeExpanded(category) ? 'fa-folder-open' : 'fa-folder';
            }

            return icon;
        }

        function formatFileSize(bytes) {
            if (!bytes || bytes === 0) return '0 B';
            
            var k = 1024;
            var sizes = ['B', 'KB', 'MB', 'GB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            
            var formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
            
            silentLogger.debug('File size formatted', {
                originalBytes: bytes,
                formatted: formatted,
                sizeCategory: sizes[i],
                context: 'adminDocumentationCtl.formatFileSize'
            });
            
            return formatted;
        }

        function formatDate(date) {
            if (!date) return '';
            
            try {
                var d = new Date(date);
                var formatted = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
                
                silentLogger.debug('Date formatted successfully', {
                    original: date,
                    formatted: formatted,
                    context: 'adminDocumentationCtl.formatDate'
                });
                
                return formatted;
            } catch (error) {
                silentLogger.error('Error formatting date', {
                    date: date,
                    error: error.message,
                    stack: error.stack,
                    context: 'adminDocumentationCtl.formatDate'
                });
                return date.toString();
            }
        }

        // Additional methods for comprehensive functionality
        function searchDocuments(query) {
            silentLogger.debug('searchDocuments method called (alias)', {
                query: query,
                context: 'adminDocumentationCtl.searchDocuments'
            });
            
            if (query) {
                vm.searchQuery = query;
            }
            return searchDocumentation(true);
        }

        function changeViewMode(mode) {
            silentLogger.userAction('View mode changed', {
                newMode: mode,
                previousMode: vm.viewMode,
                context: 'adminDocumentationCtl.changeViewMode'
            });

            vm.viewMode = mode;
            log("View mode changed to: " + mode, null, config.showDevToasts);
        }

        function refreshData() {
            silentLogger.userAction('Data refresh initiated', {
                context: 'adminDocumentationCtl.refreshData'
            });

            return loadDocumentationTree()
                .then(function() {
                    logSuccess("Documentation data refreshed", null, config.showDevToasts);
                });
        }

        function savePanelConfiguration() {
            silentLogger.userAction('Panel configuration saved', {
                configuration: vm.panelConfig,
                context: 'adminDocumentationCtl.savePanelConfiguration'
            });

            // Save to local storage or user preferences
            try {
                localStorage.setItem('docPanelConfig', JSON.stringify(vm.panelConfig));
                logSuccess("Panel configuration saved", null, config.showDevToasts);
            } catch (error) {
                silentLogger.error('Failed to save panel configuration', {
                    error: error.message,
                    context: 'adminDocumentationCtl.savePanelConfiguration'
                });
                logError("Error saving configuration: " + error.message);
            }
        }

        function resetPanelConfiguration() {
            silentLogger.userAction('Panel configuration reset', {
                previousConfig: vm.panelConfig,
                context: 'adminDocumentationCtl.resetPanelConfiguration'
            });

            vm.panelConfig = {
                showTreePanel: true,
                showDetailsPanel: true,
                showSearchPanel: true,
                treeWidth: 30,
                detailsWidth: 70
            };

            try {
                localStorage.removeItem('docPanelConfig');
                logSuccess("Panel configuration reset", null, config.showDevToasts);
            } catch (error) {
                silentLogger.error('Failed to reset panel configuration', {
                    error: error.message,
                    context: 'adminDocumentationCtl.resetPanelConfiguration'
                });
            }
        }

        function exportConfiguration() {
            silentLogger.userAction('Configuration export initiated', {
                context: 'adminDocumentationCtl.exportConfiguration'
            });

            var config = {
                panelConfig: vm.panelConfig,
                expandedNodes: vm.expandedNodes,
                searchConfig: vm.searchConfig,
                exportDate: new Date().toISOString()
            };

            try {
                var blob = new Blob([JSON.stringify(config, null, 2)], {type: 'application/json'});
                var url = window.URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'documentation-config.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                silentLogger.info('Configuration exported successfully', {
                    configSize: JSON.stringify(config).length,
                    context: 'adminDocumentationCtl.exportConfiguration'
                });
                
                logSuccess("Configuration exported", null, config.showDevToasts);
            } catch (error) {
                silentLogger.error('Failed to export configuration', {
                    error: error.message,
                    stack: error.stack,
                    context: 'adminDocumentationCtl.exportConfiguration'
                });
                logError("Export error: " + error.message);
            }
        }

        function clearCache() {
            silentLogger.userAction('Cache clear initiated', {
                context: 'adminDocumentationCtl.clearCache'
            });

            return documentationService.clearCache()
                .then(function(response) {
                    silentLogger.info('Cache cleared successfully', {
                        response: response,
                        context: 'adminDocumentationCtl.clearCache'
                    });
                    
                    logSuccess("Documentation cache cleared", null, config.showDevToasts);
                    return refreshData();
                })
                .catch(function(error) {
                    silentLogger.error('Failed to clear cache', {
                        error: error.message,
                        stack: error.stack,
                        context: 'adminDocumentationCtl.clearCache'
                    });
                    logError("Cache clear error: " + error.message);
                    throw error;
                });
        }

        function validateFileAccess(fileId) {
            silentLogger.userAction('File access validation initiated', {
                fileId: fileId,
                context: 'adminDocumentationCtl.validateFileAccess'
            });

            return documentationService.validateFileOperation(fileId, 'read')
                .then(function(response) {
                    silentLogger.info('File access validated', {
                        fileId: fileId,
                        hasAccess: response.hasAccess,
                        permissions: response.permissions,
                        context: 'adminDocumentationCtl.validateFileAccess'
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    silentLogger.error('File access validation failed', {
                        fileId: fileId,
                        error: error.message,
                        context: 'adminDocumentationCtl.validateFileAccess'
                    });
                    throw error;
                });
        }

        // Load saved configuration on controller initialization
        function loadPanelConfiguration() {
            try {
                var saved = localStorage.getItem('docPanelConfig');
                if (saved) {
                    var config = JSON.parse(saved);
                    angular.extend(vm.panelConfig, config);
                    
                    silentLogger.debug('Panel configuration loaded from storage', {
                        configuration: vm.panelConfig,
                        context: 'adminDocumentationCtl.loadPanelConfiguration'
                    });
                }
            } catch (error) {
                silentLogger.error('Failed to load panel configuration', {
                    error: error.message,
                    context: 'adminDocumentationCtl.loadPanelConfiguration'
                });
            }
        }

        // Initialize panel configuration
        loadPanelConfiguration();

        silentLogger.info('adminDocumentationCtl initialization completed', {
            controllerId: controllerId,
            methodCount: Object.keys(vm).filter(function(key) { 
                return typeof vm[key] === 'function'; 
            }).length,
            propertiesCount: Object.keys(vm).filter(function(key) { 
                return typeof vm[key] !== 'function'; 
            }).length
        });
    }
})();
