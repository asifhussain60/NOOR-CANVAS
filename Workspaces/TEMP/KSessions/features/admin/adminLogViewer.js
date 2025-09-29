(function () {
    "use strict";
    var controllerId = "adminLogViewerCtl";
    angular.module("app").controller(controllerId,
        ["$scope", "common", "bootstrap.dialog", "config", "datacontext", "$sce", "silentLogger", adminLogViewerCtl]);

    function adminLogViewerCtl($scope, common, dlg, config, datacontext, $sce, silentLogger) {
        console.log("DEBUG: Simple adminLogViewerCtl controller starting...");
        
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;

        // Properties
        vm.isLoading = false;
        vm.currentLogContent = '';
        vm.formattedLogContent = '';
        vm.lastUpdated = '';
        vm.logStats = {
            totalFiles: 0,
            totalSize: 0
        };
        vm.displayOptions = {
            maxDisplayLines: 1000,  // Limit visible lines to prevent UI freeze
            showAllContent: false,
            processingProgress: 0
        };
        vm.sessionStartTime = new Date(); // Track current session start time
        vm.isDeleting = false; // Track deletion in progress

        // Methods
        vm.loadCurrentLogs = loadCurrentLogs;
        vm.formatFileSize = formatFileSize;
        vm.copyToClipboard = copyToClipboard;
        vm.showMoreContent = showMoreContent;
        vm.showLessContent = showLessContent;
        vm.deletePreviousLogs = deletePreviousLogs;

        activate();

        function activate() {
            console.log("DEBUG: Simple log viewer controller activated");
            
            // Test silentLogger service immediately
            silentLogger.info("Log viewer controller activated", {
                controllerId: controllerId,
                timestamp: new Date().toISOString(),
                user: "admin",
                action: "controller_activation",
                sessionStartTime: vm.sessionStartTime.toISOString()
            });
            
            // Test different log levels
            silentLogger.debug("Debug message from log viewer", { test: "debug" });
            silentLogger.warn("Warning message from log viewer", { test: "warning" });
            silentLogger.error("Error message from log viewer", { test: "error" });
            
            // Automatically clean previous session logs on activation
            cleanPreviousSessionLogs()
                .then(function() {
                    log("Activated Simple Console Log Viewer", controllerId, config.showDevToasts);
                })
                .catch(function(error) {
                    console.warn("DEBUG: Could not clean previous logs on activation", error);
                    log("Activated Simple Console Log Viewer", controllerId, config.showDevToasts);
                });
        }

        function loadCurrentLogs() {
            console.log("DEBUG: loadCurrentLogs() called");
            
            // Test silentLogger when loading logs
            silentLogger.info("Loading current log files", {
                action: "load_current_logs",
                timestamp: new Date().toISOString(),
                controllerId: controllerId
            });
            
            // Process any pending logs immediately
            if (silentLogger.processLogQueue) {
                console.log("DEBUG: Manually triggering processLogQueue");
                silentLogger.processLogQueue();
            }
            
            vm.isLoading = true;
            vm.currentLogContent = '';
            vm.formattedLogContent = '';

            // Load all current log files
            datacontext.getLogFiles()
                .then(function(response) {
                    console.log("DEBUG: getLogFiles() success", {
                        response: response,
                        responseData: response.data,
                        files: response.data ? response.data.files : null,
                        fileCount: response.data && response.data.files ? response.data.files.length : 0
                    });

                    var files = response.data && response.data.files ? response.data.files : [];

                    if (!files || files.length === 0) {
                        console.log("DEBUG: No log files found");
                        logSuccess("No log files found - logs will appear as you navigate the app");
                        vm.lastUpdated = new Date().toLocaleTimeString();
                        return;
                    }

                    // Filter files to only include current session logs
                    var currentSessionFiles = filterCurrentSessionFiles(files);
                    
                    console.log("DEBUG: Filtered to current session files", {
                        originalCount: files.length,
                        currentSessionCount: currentSessionFiles.length,
                        sessionStartTime: vm.sessionStartTime.toISOString()
                    });

                    if (currentSessionFiles.length === 0) {
                        console.log("DEBUG: No current session log files found");
                        logSuccess("No current session logs found - logs will appear as you navigate the app");
                        vm.lastUpdated = new Date().toLocaleTimeString();
                        return;
                    }

                    // Update statistics
                    vm.logStats.totalFiles = currentSessionFiles.length;
                    vm.logStats.totalSize = currentSessionFiles.reduce(function(total, file) {
                        return total + (file.size || 0);
                    }, 0);

                    // Load content from all files and combine
                    var filePromises = currentSessionFiles.map(function(file) {
                        console.log("DEBUG: Loading content for file", file.name);
                        return datacontext.getLogContent(file.name)
                            .then(function(contentResponse) {
                                console.log("DEBUG: File content loaded", {
                                    fileName: file.name,
                                    fullResponse: contentResponse.data,
                                    contentType: typeof contentResponse.data,
                                    hasData: !!contentResponse.data,
                                    contentProperty: contentResponse.data ? contentResponse.data.content : null
                                });
                                
                                // Extract content from server response object
                                var fileContent = '';
                                if (contentResponse.data && typeof contentResponse.data === 'object' && contentResponse.data.content) {
                                    fileContent = contentResponse.data.content;
                                } else if (typeof contentResponse.data === 'string') {
                                    fileContent = contentResponse.data;
                                }
                                
                                console.log("DEBUG: Extracted file content", {
                                    fileName: file.name,
                                    extractedContentLength: fileContent.length,
                                    extractedContentType: typeof fileContent,
                                    contentPreview: fileContent.substring(0, 100)
                                });
                                
                                return {
                                    fileName: file.name,
                                    content: fileContent,
                                    modified: file.modified,
                                    size: file.size
                                };
                            })
                            .catch(function(error) {
                                console.error("DEBUG: Failed to load file content", {
                                    fileName: file.name,
                                    error: error
                                });
                                return {
                                    fileName: file.name,
                                    content: '[ERROR: Could not load file content]',
                                    modified: file.modified,
                                    size: file.size
                                };
                            });
                    });

                    // Wait for all file contents to load
                    return Promise.all(filePromises);
                })
                .then(function(fileContents) {
                    if (!fileContents) {
                        console.log("DEBUG: No file contents to process");
                        return;
                    }

                    console.log("DEBUG: Processing file contents", {
                        fileCount: fileContents.length,
                        totalFiles: fileContents.map(function(f) { return f.fileName; })
                    });

                    // Combine all log content with file separators
                    var combinedContent = '';
                    
                    // Sort files by modification time (most recent first)
                    fileContents.sort(function(a, b) {
                        return new Date(b.modified) - new Date(a.modified);
                    });

                    fileContents.forEach(function(file, index) {
                        if (index > 0) {
                            combinedContent += '\n\n';
                        }
                        
                        // Add file header
                        var separator = '================================================================================';
                        combinedContent += separator + '\n';
                        combinedContent += '📁 FILE: ' + file.fileName + '\n';
                        combinedContent += '📅 MODIFIED: ' + new Date(file.modified).toLocaleString() + '\n';
                        combinedContent += '📊 SIZE: ' + formatFileSize(file.size) + '\n';
                        combinedContent += separator + '\n\n';
                        
                        // Add file content (handle different content types)
                        var fileContent = '';
                        if (file.content !== null && file.content !== undefined) {
                            // Convert content to string if needed
                            fileContent = typeof file.content === 'string' ? file.content : String(file.content);
                            if (fileContent.trim()) {
                                combinedContent += fileContent;
                            } else {
                                combinedContent += '[Empty file content]';
                            }
                        } else {
                            combinedContent += '[No content available]';
                        }
                    });

                    vm.currentLogContent = combinedContent;
                    
                    // Process content in chunks to prevent UI freeze
                    return processLogContentInChunks(combinedContent)
                        .then(function(formattedContent) {
                            vm.formattedLogContent = formattedContent;
                            vm.lastUpdated = new Date().toLocaleTimeString();

                            console.log("DEBUG: Combined log content ready", {
                                totalLength: combinedContent.length,
                                fileCount: fileContents.length,
                                displayedLines: vm.displayOptions.showAllContent ? 'all' : vm.displayOptions.maxDisplayLines
                            });

                            logSuccess("Loaded " + fileContents.length + " log files (" + formatFileSize(vm.logStats.totalSize) + ")" +
                                      (combinedContent.split('\n').length > vm.displayOptions.maxDisplayLines ? 
                                       " - Showing first " + vm.displayOptions.maxDisplayLines + " lines" : ""));

                            // Scroll to top of console
                            setTimeout(function() {
                                var consoleElement = document.getElementById('consoleOutput');
                                if (consoleElement) {
                                    consoleElement.scrollTop = 0;
                                }
                            }, 100);
                        });
                })
                .catch(function(error) {
                    console.error("DEBUG: loadCurrentLogs() failed", error);
                    logError("Failed to load logs: " + (error.message || error));
                })
                .finally(function() {
                    console.log("DEBUG: loadCurrentLogs() completed");
                    vm.isLoading = false;
                    vm.displayOptions.processingProgress = 0;
                });
        }

        function processLogContentInChunks(content) {
            return new Promise(function(resolve) {
                if (!content) {
                    resolve('');
                    return;
                }

                console.log("DEBUG: processLogContentInChunks() processing content", {
                    contentLength: content.length
                });

                // Limit displayed content to prevent UI freeze
                var lines = content.split('\n');
                var displayLines = vm.displayOptions.showAllContent ? 
                    lines : lines.slice(0, vm.displayOptions.maxDisplayLines);
                
                if (lines.length > vm.displayOptions.maxDisplayLines && !vm.displayOptions.showAllContent) {
                    var separator = '================================================================================';
                    var truncationMessage = '\n\n' + separator + '\n';
                    truncationMessage += '⚠️  CONTENT TRUNCATED FOR PERFORMANCE\n';
                    truncationMessage += '📊 Showing ' + vm.displayOptions.maxDisplayLines + ' of ' + lines.length + ' total lines\n';
                    truncationMessage += '💡 Click "Show More Content" to view additional lines\n';
                    truncationMessage += separator;
                    displayLines.push(truncationMessage);
                }

                var contentToProcess = displayLines.join('\n');
                
                // Process in smaller chunks to prevent UI blocking
                var chunkSize = 10000; // Process 10KB at a time
                var chunks = [];
                
                for (var i = 0; i < contentToProcess.length; i += chunkSize) {
                    chunks.push(contentToProcess.substring(i, i + chunkSize));
                }

                var processedChunks = [];
                var currentChunk = 0;

                function processNextChunk() {
                    if (currentChunk >= chunks.length) {
                        var finalContent = processedChunks.join('');
                        console.log("DEBUG: processLogContentInChunks() completed");
                        resolve($sce.trustAsHtml(finalContent));
                        return;
                    }

                    var chunk = chunks[currentChunk];
                    var formattedChunk = formatLogContentChunk(chunk);
                    processedChunks.push(formattedChunk);
                    
                    vm.displayOptions.processingProgress = Math.round(((currentChunk + 1) / chunks.length) * 100);
                    currentChunk++;

                    // Use setTimeout to yield to UI thread
                    setTimeout(processNextChunk, 10);
                }

                processNextChunk();
            });
        }

        function formatLogContentChunk(chunk) {
            if (!chunk) return '';

            // Apply color coding to different log levels
            var formatted = chunk
                // Error patterns
                .replace(/\b(ERROR|Error|error)\b.*$/gm, '<span class="log-error">$&</span>')
                .replace(/\b(FATAL|Fatal|fatal)\b.*$/gm, '<span class="log-fatal">$&</span>')
                // Warning patterns  
                .replace(/\b(WARN|Warning|warning|CAUTION)\b.*$/gm, '<span class="log-warn">$&</span>')
                // Success patterns
                .replace(/\b(SUCCESS|Success|success|COMPLETED|Completed|completed)\b.*$/gm, '<span class="log-success">$&</span>')
                // Info patterns
                .replace(/\b(INFO|Info|info)\b.*$/gm, '<span class="log-info">$&</span>')
                // Debug patterns
                .replace(/\b(DEBUG|Debug|debug)\b.*$/gm, '<span class="log-debug">$&</span>')
                // Trace patterns
                .replace(/\b(TRACE|Trace|trace)\b.*$/gm, '<span class="log-trace">$&</span>');

            return formatted;
        }

        function formatLogContent(content) {
            if (!content) return '';

            console.log("DEBUG: formatLogContent() processing content", {
                contentLength: content.length
            });

            // Apply color coding to different log levels
            var formatted = content
                // Error patterns
                .replace(/\b(ERROR|Error|error)\b.*$/gm, '<span class="log-error">$&</span>')
                .replace(/\b(FATAL|Fatal|fatal)\b.*$/gm, '<span class="log-fatal">$&</span>')
                // Warning patterns  
                .replace(/\b(WARN|Warning|warning|CAUTION)\b.*$/gm, '<span class="log-warn">$&</span>')
                // Success patterns
                .replace(/\b(SUCCESS|Success|success|COMPLETED|Completed|completed)\b.*$/gm, '<span class="log-success">$&</span>')
                // Info patterns
                .replace(/\b(INFO|Info|info)\b.*$/gm, '<span class="log-info">$&</span>')
                // Debug patterns
                .replace(/\b(DEBUG|Debug|debug)\b.*$/gm, '<span class="log-debug">$&</span>')
                // Trace patterns
                .replace(/\b(TRACE|Trace|trace)\b.*$/gm, '<span class="log-trace">$&</span>');

            console.log("DEBUG: formatLogContent() completed formatting");
            
            return $sce.trustAsHtml(formatted);
        }

        function formatFileSize(bytes) {
            if (!bytes) return '0 B';
            if (bytes === 0) return '0 B';

            var k = 1024;
            var sizes = ['B', 'KB', 'MB', 'GB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));

            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function copyToClipboard() {
            console.log("DEBUG: copyToClipboard() called");
            
            if (!vm.currentLogContent) {
                logError("No log content available to copy. Please load logs first.");
                return;
            }

            // Show loading state for large content
            if (vm.currentLogContent.length > 500000) { // 500KB threshold
                vm.isCopying = true;
                log("Preparing large log content for clipboard...");
            }

            // Use setTimeout to prevent UI blocking during clipboard preparation
            setTimeout(function() {
                prepareCopyContent()
                    .then(function(clipboardContent) {
                        return copyContentToClipboard(clipboardContent);
                    })
                    .finally(function() {
                        vm.isCopying = false;
                    });
            }, 50);
        }

        function prepareCopyContent() {
            return new Promise(function(resolve) {
                // Create structured output for analysis
                var separator = '====================================================================================================';
                var analysisHeader = separator + '\n';
                analysisHeader += 'KSESSIONS APPLICATION LOGS - ANALYSIS EXPORT\n';
                analysisHeader += separator + '\n';
                analysisHeader += 'Export Date: ' + new Date().toISOString() + '\n';
                analysisHeader += 'Log Statistics:\n';
                analysisHeader += '  - Total Files: ' + vm.logStats.totalFiles + '\n';
                analysisHeader += '  - Total Size: ' + formatFileSize(vm.logStats.totalSize) + '\n';
                analysisHeader += '  - Last Updated: ' + vm.lastUpdated + '\n';
                analysisHeader += '  - Content Length: ' + vm.currentLogContent.length + ' characters\n';
                analysisHeader += separator + '\n\n';

                // Analysis instructions
                var analysisInstructions = 'ANALYSIS INSTRUCTIONS FOR AI/DEBUGGING:\n';
                analysisInstructions += '- This export contains complete application logs from KSESSIONS Beautiful Islam\n';
                analysisInstructions += '- Logs are sorted by modification time (most recent first)\n';
                analysisInstructions += '- Each log entry includes timestamp, log level, source, message, and structured data\n';
                analysisInstructions += '- Look for patterns in ERROR/WARN messages for troubleshooting\n';
                analysisInstructions += '- INFO messages show application flow and user actions\n';
                analysisInstructions += '- DEBUG messages provide detailed execution context\n';
                analysisInstructions += '- JSON data objects contain structured context for analysis\n\n';

                // For very large content (>1MB), offer truncated version for clipboard
                var contentToCopy = vm.currentLogContent;
                if (vm.currentLogContent.length > 1000000) { // 1MB threshold
                    var lines = vm.currentLogContent.split('\n');
                    var truncatedLines = lines.slice(0, 5000); // Keep first 5000 lines
                    
                    var separator = '================================================================================';
                    truncatedLines.push('');
                    truncatedLines.push(separator);
                    truncatedLines.push('⚠️  CONTENT TRUNCATED FOR CLIPBOARD PERFORMANCE');
                    truncatedLines.push('📊 Showing first 5000 lines of ' + lines.length + ' total lines');
                    truncatedLines.push('💡 Use "Load Current Logs" to view full content in browser');
                    truncatedLines.push(separator);
                    
                    contentToCopy = truncatedLines.join('\n');
                }

                // Combine all content for clipboard
                var clipboardContent = analysisHeader + analysisInstructions + contentToCopy;
                
                resolve(clipboardContent);
            });
        }

        function copyContentToClipboard(clipboardContent) {
            return new Promise(function(resolve) {
                // Modern Clipboard API with fallback
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(clipboardContent)
                        .then(function() {
                            console.log("DEBUG: Modern clipboard API success");
                            logSuccess("Logs copied to clipboard successfully! (" + formatFileSize(clipboardContent.length) + ")");
                            resolve();
                        })
                        .catch(function(error) {
                            console.warn("DEBUG: Modern clipboard API failed, trying fallback", error);
                            fallbackCopyToClipboard(clipboardContent);
                            resolve();
                        });
                } else {
                    console.log("DEBUG: Modern clipboard API not available, using fallback");
                    fallbackCopyToClipboard(clipboardContent);
                    resolve();
                }
            });
        }

        function fallbackCopyToClipboard(text) {
            // Create temporary textarea for fallback copy
            var tempTextArea = document.createElement('textarea');
            tempTextArea.value = text;
            tempTextArea.style.position = 'fixed';
            tempTextArea.style.left = '-999999px';
            tempTextArea.style.top = '-999999px';
            document.body.appendChild(tempTextArea);
            tempTextArea.focus();
            tempTextArea.select();
            
            try {
                var successful = document.execCommand('copy');
                if (successful) {
                    console.log("DEBUG: Fallback clipboard copy successful");
                    logSuccess("Logs copied to clipboard successfully! (" + formatFileSize(text.length) + ")");
                } else {
                    console.error("DEBUG: Fallback clipboard copy failed");
                    logError("Failed to copy logs to clipboard. Please try selecting and copying manually.");
                }
            } catch (error) {
                console.error("DEBUG: Clipboard copy exception", error);
                logError("Clipboard not available. Please select and copy the content manually.");
            } finally {
                document.body.removeChild(tempTextArea);
            }
        }

        function showMoreContent() {
            console.log("DEBUG: showMoreContent() called");
            vm.displayOptions.showAllContent = true;
            vm.displayOptions.maxDisplayLines = Math.min(vm.displayOptions.maxDisplayLines * 3, 10000); // Cap at 10k lines
            
            // Reprocess the content with more lines
            vm.isLoading = true;
            processLogContentInChunks(vm.currentLogContent)
                .then(function(formattedContent) {
                    vm.formattedLogContent = formattedContent;
                    logSuccess("Showing more content (" + vm.displayOptions.maxDisplayLines + " lines)");
                })
                .finally(function() {
                    vm.isLoading = false;
                });
        }

        function showLessContent() {
            console.log("DEBUG: showLessContent() called");
            vm.displayOptions.showAllContent = false;
            vm.displayOptions.maxDisplayLines = 1000; // Reset to default
            
            // Reprocess the content with fewer lines
            vm.isLoading = true;
            processLogContentInChunks(vm.currentLogContent)
                .then(function(formattedContent) {
                    vm.formattedLogContent = formattedContent;
                    logSuccess("Showing standard content (first " + vm.displayOptions.maxDisplayLines + " lines)");
                })
                .finally(function() {
                    vm.isLoading = false;
                });
        }

        function filterCurrentSessionFiles(files) {
            // Filter files to only include those modified after session start
            // Allow a small buffer (5 minutes before session start) to account for timing differences
            var sessionBufferTime = new Date(vm.sessionStartTime.getTime() - (5 * 60 * 1000)); // 5 minutes before
            
            return files.filter(function(file) {
                if (!file.modified) return false;
                
                var fileModified = new Date(file.modified);
                var isCurrentSession = fileModified >= sessionBufferTime;
                
                console.log("DEBUG: File session check", {
                    fileName: file.name,
                    fileModified: fileModified.toISOString(),
                    sessionStart: vm.sessionStartTime.toISOString(),
                    sessionBuffer: sessionBufferTime.toISOString(),
                    isCurrentSession: isCurrentSession
                });
                
                return isCurrentSession;
            });
        }

        function cleanPreviousSessionLogs() {
            return new Promise(function(resolve, reject) {
                console.log("DEBUG: cleanPreviousSessionLogs() called");
                
                // Get all log files first
                datacontext.getLogFiles()
                    .then(function(response) {
                        var files = response.data && response.data.files ? response.data.files : [];
                        
                        if (files.length === 0) {
                            console.log("DEBUG: No log files to clean");
                            resolve();
                            return;
                        }
                        
                        // Identify old log files (before current session)
                        var oldFiles = files.filter(function(file) {
                            if (!file.modified) return false;
                            
                            var fileModified = new Date(file.modified);
                            var sessionBufferTime = new Date(vm.sessionStartTime.getTime() - (5 * 60 * 1000)); // 5 minute buffer
                            var isOldFile = fileModified < sessionBufferTime;
                            
                            console.log("DEBUG: Old file check", {
                                fileName: file.name,
                                fileModified: fileModified.toISOString(),
                                sessionStart: vm.sessionStartTime.toISOString(),
                                sessionBuffer: sessionBufferTime.toISOString(),
                                isOldFile: isOldFile
                            });
                            
                            return isOldFile;
                        });
                        
                        if (oldFiles.length === 0) {
                            console.log("DEBUG: No old log files found to clean");
                            resolve();
                            return;
                        }
                        
                        console.log("DEBUG: Found " + oldFiles.length + " old log files to delete");
                        
                        // Delete old log files
                        var deletePromises = oldFiles.map(function(file) {
                            return datacontext.deleteLogFile(file.name)
                                .then(function() {
                                    console.log("DEBUG: Successfully deleted old log file", file.name);
                                    return { fileName: file.name, success: true };
                                })
                                .catch(function(error) {
                                    console.error("DEBUG: Failed to delete old log file", file.name, error);
                                    return { fileName: file.name, success: false, error: error };
                                });
                        });
                        
                        return Promise.all(deletePromises);
                    })
                    .then(function(deleteResults) {
                        if (deleteResults && deleteResults.length > 0) {
                            var successCount = deleteResults.filter(function(r) { return r.success; }).length;
                            var failureCount = deleteResults.length - successCount;
                            
                            console.log("DEBUG: Cleanup completed", {
                                totalFiles: deleteResults.length,
                                successCount: successCount,
                                failureCount: failureCount
                            });
                            
                            if (successCount > 0) {
                                silentLogger.info("Cleaned previous session logs", {
                                    action: "clean_previous_logs",
                                    deletedCount: successCount,
                                    failedCount: failureCount,
                                    sessionStartTime: vm.sessionStartTime.toISOString()
                                });
                            }
                        }
                        resolve();
                    })
                    .catch(function(error) {
                        console.error("DEBUG: cleanPreviousSessionLogs() failed", error);
                        reject(error);
                    });
            });
        }

        function deletePreviousLogs() {
            console.log("DEBUG: deletePreviousLogs() manually triggered");
            
            if (vm.isDeleting) {
                logError("Deletion already in progress. Please wait...");
                return;
            }
            
            vm.isDeleting = true;
            log("Deleting previous session logs...");
            
            cleanPreviousSessionLogs()
                .then(function() {
                    logSuccess("Previous session logs deleted successfully!");
                    
                    // Refresh the current logs view
                    setTimeout(function() {
                        vm.loadCurrentLogs();
                    }, 500);
                })
                .catch(function(error) {
                    console.error("DEBUG: Manual log deletion failed", error);
                    logError("Failed to delete previous logs: " + (error.message || error));
                })
                .finally(function() {
                    vm.isDeleting = false;
                });
        }
    }
})();
