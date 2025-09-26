(function () {
    'use strict';

    angular.module('app').directive('sessionTokenPanel', sessionTokenPanel);

    sessionTokenPanel.$inject = ['common', 'datacontext', '$timeout', 'silentLogger', '$rootScope'];

    function sessionTokenPanel(common, datacontext, $timeout, silentLogger, $rootScope) {
        var directive = {
            restrict: 'EA',
            templateUrl: '/app/directives/templates/sessionTokenPanel.html',
            scope: {
                sessionId: '=',
                isVisible: '=',
                onClose: '&',
                froalaEditor: '='
            },
            link: link,
            controller: SessionTokenPanelController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;
            
            // DEBUG: Log link function execution
            console.log("🔧 DEBUG: sessionTokenPanel link() called", {
                sessionId: vm.sessionId,
                isVisible: vm.isVisible,
                element: element.length,
                timestamp: new Date().toISOString()
            });
            
            if (silentLogger) {
                silentLogger.debug('SessionTokenPanel link function called', {
                    sessionId: vm.sessionId,
                    isVisible: vm.isVisible,
                    elementExists: element.length > 0,
                    froalaEditorExists: !!vm.froalaEditor
                }, 'sessionTokenPanel.link');
            }
            
            // Store reference to panel element for drag functionality
            vm.panelElement = element;

            // Initial positioning is now handled by CSS and restorePosition()
            // Apply saved position when panel becomes visible
            scope.$watch('vm.isVisible', function(isVisible) {
                if (isVisible) {
                    $timeout(function() {
                        // Apply saved position if available
                        if (vm.panelPosition) {
                            var panel = document.querySelector('.session-token-panel');
                            if (panel) {
                                panel.style.left = vm.panelPosition.x + 'px';
                                panel.style.top = vm.panelPosition.y + 'px';
                                panel.style.right = 'auto';
                            }
                        }
                        
                        // Focus the textarea when panel becomes visible
                        var textarea = document.getElementById('newToken');
                        if (textarea && !vm.isLoading) {
                            textarea.focus();
                            console.log("🎯 DEBUG: Focused textarea when panel became visible");
                        }
                    }, 150); // Slightly longer delay to ensure DOM is ready and animations are complete
                }
            });

            // Focus textarea when loading completes (if panel is visible)
            scope.$watch('vm.isLoading', function(isLoading, oldIsLoading) {
                if (oldIsLoading && !isLoading && vm.isVisible) {
                    $timeout(function() {
                        var textarea = document.getElementById('newToken');
                        if (textarea) {
                            textarea.focus();
                            console.log("🎯 DEBUG: Focused textarea when loading completed");
                        }
                    }, 50);
                }
            });

            // Handle window resize - just update bounds, don't reposition
            angular.element(window).on('resize', function() {
                if (vm.panelPosition) {
                    // Only constrain if out of bounds - updated for new panel width
                    if (vm.panelPosition.x > window.innerWidth - 545) { // 525px width + 20px margin
                        vm.panelPosition.x = window.innerWidth - 545;
                    }
                    if (vm.panelPosition.y > window.innerHeight - 100) {
                        vm.panelPosition.y = Math.max(20, window.innerHeight - 100);
                    }
                    // Position will be applied on next drag or when panel becomes visible
                }
            });

            // Cleanup
            scope.$on('$destroy', function() {
                angular.element(window).off('resize');
                
                // Clean up drag event listeners if still active
                if (vm.isDragging) {
                    document.removeEventListener('mousemove', vm.handleGlobalMouseMove, true);
                    document.removeEventListener('mouseup', vm.handleGlobalMouseUp, true);
                    document.body.classList.remove('dragging');
                }
            });
        }
    }

    SessionTokenPanelController.$inject = ['common', 'datacontext', '$timeout', 'silentLogger', '$rootScope'];

    function SessionTokenPanelController(common, datacontext, $timeout, silentLogger, $rootScope) {
        var vm = this;
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn('sessionTokenPanel');
        var logSuccess = getLogFn('sessionTokenPanel', 'success');
        var logError = getLogFn('sessionTokenPanel', 'error');

        // Properties
        vm.tokens = [];
        vm.newToken = '';
        vm.isLoading = false;
        vm.isSaving = false;
        vm.isDragging = false;
        vm.dragOffset = { x: 0, y: 0 };
        vm.panelPosition = { x: window.innerWidth - 545, y: 100 }; // Adjusted for new panel width (525px + 20px margin)
        
        // Status message properties
        vm.statusMessage = '';
        vm.statusType = ''; // 'success', 'error', or empty
        vm.showStatus = false;

        // Methods
        vm.loadTokens = loadTokens;
        vm.addToken = addToken;
        vm.removeToken = removeToken;
        vm.saveTokens = saveTokens;
        vm.clearTokens = clearTokens;
        vm.clearInput = clearInput;
        vm.close = close;
        vm.onDoubleClickEditor = onDoubleClickEditor;
        vm.startDrag = startDrag;

        // Internal methods
        vm.showStatusMessage = showStatusMessage;

        // Initialize
        activate();

        function activate() {
            console.log("DEBUG: sessionTokenPanel activate() called", {
                sessionId: vm.sessionId,
                isVisible: vm.isVisible
            });

            // Initialize tokens array if not already initialized
            if (!vm.tokens) {
                vm.tokens = [];
            }

            // Restore saved panel position
            restorePosition();

            if (vm.sessionId && vm.sessionId > 0) {
                loadTokens();
            }

            // Set up double-click listener for Froala editor
            setupEditorDoubleClick();
        }

        function setupEditorDoubleClick() {
            if (vm.froalaEditor && vm.froalaEditor.$el) {
                vm.froalaEditor.$el.off('dblclick.tokenPanel').on('dblclick.tokenPanel', function(e) {
                    var selection = vm.froalaEditor.selection.text();
                    if (selection && selection.trim().length > 0) {
                        onDoubleClickEditor(selection.trim());
                    }
                });
            }
        }

        function loadTokens() {
            console.log("🔧 DEBUG: loadTokens() called", {
                sessionId: vm.sessionId,
                currentTokenCount: vm.tokens.length,
                timestamp: new Date().toISOString(),
                calledFrom: new Error().stack.split('\n')[1]
            });

            if (silentLogger) {
                silentLogger.debug('Loading session tokens', {
                    sessionId: vm.sessionId,
                    currentTokenCount: vm.tokens.length,
                    apiEndpoint: 'api/admin/session/' + vm.sessionId + '/tokens'
                }, 'sessionTokenPanel.loadTokens');
            }

            if (!vm.sessionId || vm.sessionId <= 0) {
                console.error("🔧 DEBUG: Invalid session ID for loading tokens", { 
                    sessionId: vm.sessionId,
                    sessionIdType: typeof vm.sessionId
                });
                logError("Invalid session ID for loading tokens");
                return;
            }

            vm.isLoading = true;
            console.log("🔧 DEBUG: Making API call to load tokens", {
                sessionId: vm.sessionId,
                apiUrl: 'api/admin/session/' + vm.sessionId + '/tokens'
            });

            datacontext.getSessionTokens(vm.sessionId).then(function(response) {
                console.log("🔧 DEBUG: loadTokens() API SUCCESS", {
                    sessionId: vm.sessionId,
                    responseStatus: response.status,
                    responseData: response.data,
                    tokenCount: response.data ? response.data.length : 0,
                    timestamp: new Date().toISOString(),
                    rawResponse: response,
                    firstTokenDetails: response.data && response.data.length > 0 ? {
                        fullTokenObject: response.data[0],
                        tokenProperties: Object.keys(response.data[0] || {}),
                        tokenValue: response.data[0].token,
                        tokenID: response.data[0].tokenID
                    } : null
                });

                if (silentLogger) {
                    silentLogger.info('Session tokens loaded successfully', {
                        sessionId: vm.sessionId,
                        tokenCount: response.data ? response.data.length : 0,
                        responseData: response.data,
                        responseStatus: response.status
                    }, 'sessionTokenPanel.loadTokens.success');
                }

                // Assign response data directly and sort alphabetically
                vm.tokens = response.data || [];
                
                // Sort tokens alphabetically (case-insensitive)
                vm.tokens.sort(function(a, b) {
                    return a.token.toLowerCase().localeCompare(b.token.toLowerCase());
                });
                
                console.log("DEBUG: Token assignment and sorting completed", {
                    sessionId: vm.sessionId,
                    assignedTokenCount: vm.tokens.length,
                    sortedTokens: vm.tokens.map(function(t) { return t.token; }),
                    firstAssignedToken: vm.tokens.length > 0 ? {
                        fullObject: vm.tokens[0],
                        tokenValue: vm.tokens[0].token,
                        tokenID: vm.tokens[0].tokenID,
                        properties: Object.keys(vm.tokens[0] || {}),
                        stringified: JSON.stringify(vm.tokens[0])
                    } : null,
                    allTokensStringified: JSON.stringify(vm.tokens)
                });
                
            }).catch(function(error) {
                console.error("🔧 DEBUG: loadTokens() FAILED", {
                    sessionId: vm.sessionId,
                    error: error,
                    errorMessage: error.message || 'Unknown error',
                    errorStatus: error.status,
                    errorData: error.data,
                    timestamp: new Date().toISOString()
                });

                if (silentLogger) {
                    silentLogger.error('Failed to load session tokens', {
                        sessionId: vm.sessionId,
                        error: error.message || error,
                        errorStatus: error.status,
                        errorData: error.data,
                        apiEndpoint: 'api/admin/session/' + vm.sessionId + '/tokens'
                    }, 'sessionTokenPanel.loadTokens.error');
                }

                logError("Failed to load session tokens: " + (error.message || error));
                vm.tokens = [];
            }).finally(function() {
                vm.isLoading = false;
                console.log("DEBUG: loadTokens() completed", {
                    sessionId: vm.sessionId,
                    finalTokenCount: vm.tokens.length,
                    timestamp: new Date().toISOString()
                });

                if (silentLogger) {
                    silentLogger.debug('loadTokens() completed successfully', {
                        sessionId: vm.sessionId,
                        finalTokenCount: vm.tokens.length,
                        isLoading: vm.isLoading
                    }, 'sessionTokenPanel.loadTokens.complete');
                }
            });
        }

        function addToken(token) {
            token = token || vm.newToken;

            if (!token || token.trim().length === 0) {
                logError("Token cannot be empty");
                return;
            }

            // Trim input - handle multiline text by removing extra whitespace and any invisible characters
            token = token.trim().replace(/[\r\n\t\f\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/g, ' ').trim();

            console.log("DEBUG: addToken() called", {
                token: token,
                sessionId: vm.sessionId,
                tokenLength: token.length,
                startsWithBrace: token.startsWith('{') || token.startsWith('['),
                firstChars: token.substring(0, 10),
                lastChars: token.substring(token.length - 10),
                isMultiline: token.includes('\n'),
                lineCount: token.split('\n').length
            });

            // Check if input is a JSON string
            var isJson = isJsonString(token);
            console.log("DEBUG: JSON detection result", {
                isJson: isJson,
                tokenStart: token.substring(0, 20),
                tokenEnd: token.substring(token.length - 20),
                tokenType: isJson ? 'JSON' : 'single token'
            });

            if (isJson) {
                console.log("DEBUG: JSON string detected, parsing tokens", {
                    jsonString: token.substring(0, 100) + (token.length > 100 ? '...' : '')
                });
                
                if (silentLogger) {
                    silentLogger.info('USER_ACTION: JSON string provided for token parsing', {
                        action: 'JSON token parsing',
                        jsonLength: token.length,
                        sessionId: vm.sessionId,
                        isMultiline: token.includes('\n'),
                        lineCount: token.split('\n').length
                    }, 'sessionTokenPanel.addToken.jsonParsing');
                }

                parseAndAddJsonTokens(token);
                // parseAndAddJsonTokens already clears the input
                return;
            }

            console.log("DEBUG: Processing as single token");
            // Handle single token (existing logic)
            addSingleToken(token);
            
            // Ensure input is completely cleared after single token processing
            vm.newToken = '';
            $timeout(function() {
                var textarea = document.getElementById('newToken');
                if (textarea) {
                    textarea.value = '';
                    // Model is already cleared above, no need for $apply in timeout context
                }
            }, 10);
        }

        function isJsonString(str) {
            if (!str || typeof str !== 'string') {
                return false;
            }

            try {
                // First check if it looks like JSON (starts with [ or {)
                var trimmed = str.trim();
                if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
                    console.log("DEBUG: Not JSON - doesn't start with [ or {", {
                        startsWithOpenBrace: trimmed.startsWith('{'),
                        startsWithOpenBracket: trimmed.startsWith('['),
                        firstChar: trimmed.charAt(0),
                        trimmedLength: trimmed.length,
                        originalLength: str.length
                    });
                    return false;
                }
                
                var parsed = JSON.parse(str);
                console.log("DEBUG: Successfully parsed as JSON", {
                    parsedType: typeof parsed,
                    isNull: parsed === null,
                    isArray: Array.isArray(parsed),
                    objectKeys: (typeof parsed === 'object' && !Array.isArray(parsed)) ? Object.keys(parsed).slice(0, 5) : null
                });
                return typeof parsed === 'object' && parsed !== null;
            } catch (e) {
                console.log("DEBUG: JSON parsing failed", {
                    error: e.message,
                    inputLength: str.length,
                    firstChars: str.substring(0, 10),
                    lastChars: str.substring(str.length - 10)
                });
                return false;
            }
        }

        function parseAndAddJsonTokens(jsonString) {
            try {
                console.log("DEBUG: parseAndAddJsonTokens() START", {
                    jsonStringLength: jsonString.length,
                    jsonPreview: jsonString.substring(0, 200) + (jsonString.length > 200 ? '...' : ''),
                    currentTokenCount: vm.tokens.length
                });

                var parsedData = JSON.parse(jsonString);
                var tokensToAdd = [];
                var duplicateCount = 0;
                var addedCount = 0;

                console.log("DEBUG: parseAndAddJsonTokens() - parsed data", {
                    parsedData: parsedData,
                    dataType: typeof parsedData,
                    isArray: Array.isArray(parsedData),
                    arrayLength: Array.isArray(parsedData) ? parsedData.length : 'N/A'
                });

                // Extract tokens from JSON structure
                if (Array.isArray(parsedData)) {
                    console.log("DEBUG: Processing direct array with " + parsedData.length + " items");
                    // Handle direct array format: ["token1", "token2", ...]
                    parsedData.forEach(function(item, index) {
                        var tokenValue = extractTokenValue(item);
                        console.log("DEBUG: Array item " + index, {
                            item: item,
                            extractedValue: tokenValue,
                            itemType: typeof item
                        });
                        if (tokenValue) {
                            tokensToAdd.push(tokenValue);
                        }
                    });
                } else if (typeof parsedData === 'object') {
                    console.log("DEBUG: Processing object", {
                        hasTokensArray: !!(parsedData.tokens && Array.isArray(parsedData.tokens)),
                        hasKeywordsArray: !!(parsedData.keywords && Array.isArray(parsedData.keywords)),
                        objectKeys: Object.keys(parsedData)
                    });
                    
                    // Handle object format - prioritize common token array properties
                    if (parsedData.tokens && Array.isArray(parsedData.tokens)) {
                        console.log("DEBUG: Processing 'tokens' array with " + parsedData.tokens.length + " items");
                        // Handle object with "tokens" array: {"tokens": ["token1", "token2"]}
                        parsedData.tokens.forEach(function(item) {
                            var tokenValue = extractTokenValue(item);
                            if (tokenValue) {
                                tokensToAdd.push(tokenValue);
                            }
                        });
                    } else if (parsedData.keywords && Array.isArray(parsedData.keywords)) {
                        console.log("DEBUG: Processing 'keywords' array with " + parsedData.keywords.length + " items");
                        // Handle object with "keywords" array: {"keywords": ["token1", "token2"]}
                        parsedData.keywords.forEach(function(item) {
                            var tokenValue = extractTokenValue(item);
                            if (tokenValue) {
                                tokensToAdd.push(tokenValue);
                            }
                        });
                    } else {
                        console.log("DEBUG: Processing general object properties");
                        // Handle general object - extract values that look like tokens
                        extractTokensFromObject(parsedData, tokensToAdd);
                    }
                }

                console.log("DEBUG: Extracted tokens from JSON", {
                    extractedTokens: tokensToAdd,
                    tokenCount: tokensToAdd.length,
                    firstFewTokens: tokensToAdd.slice(0, 5)
                });

                // Add each token individually with duplicate checking
                tokensToAdd.forEach(function(tokenValue, index) {
                    console.log("DEBUG: Adding token " + index, {
                        tokenValue: tokenValue,
                        beforeCount: vm.tokens.length
                    });
                    
                    if (addSingleTokenInternal(tokenValue, false)) {
                        addedCount++;
                        console.log("DEBUG: Token added successfully: " + tokenValue);
                    } else {
                        duplicateCount++;
                        console.log("DEBUG: Token was duplicate: " + tokenValue);
                    }
                });

                console.log("DEBUG: Token addition summary", {
                    totalExtracted: tokensToAdd.length,
                    addedCount: addedCount,
                    duplicateCount: duplicateCount,
                    finalTokenCount: vm.tokens.length
                });

                // Clear input field completely
                vm.newToken = '';
                $timeout(function() {
                    var textarea = document.getElementById('newToken');
                    if (textarea) {
                        textarea.value = '';
                        // Model is already cleared above, no need for $apply in timeout context
                    }
                }, 10);

                // Show summary status message
                var message = '';
                if (addedCount > 0 && duplicateCount > 0) {
                    message = addedCount + " tokens added, " + duplicateCount + " duplicates skipped";
                } else if (addedCount > 0) {
                    message = addedCount + " tokens added from JSON";
                } else if (duplicateCount > 0) {
                    message = "All " + duplicateCount + " tokens already exist";
                } else {
                    message = "No valid tokens found in JSON";
                }

                showStatusMessage(message, addedCount > 0 ? "success" : "warning");

                if (silentLogger) {
                    silentLogger.info('JSON tokens processed', {
                        totalExtracted: tokensToAdd.length,
                        added: addedCount,
                        duplicates: duplicateCount,
                        finalTokenCount: vm.tokens.length
                    }, 'sessionTokenPanel.parseAndAddJsonTokens.complete');
                }

            } catch (error) {
                console.error("DEBUG: Error parsing JSON tokens", {
                    error: error,
                    errorMessage: error.message,
                    jsonStringPreview: jsonString.substring(0, 100) + '...'
                });
                
                logError("Invalid JSON format: " + error.message);
                showStatusMessage("Invalid JSON format", "error");

                if (silentLogger) {
                    silentLogger.error('JSON parsing failed', {
                        error: error.message,
                        jsonString: jsonString.substring(0, 100) + '...'
                    }, 'sessionTokenPanel.parseAndAddJsonTokens.error');
                }
            }
        }

        function extractTokenValue(item) {
            if (typeof item === 'string') {
                return item.trim();
            } else if (typeof item === 'object' && item !== null) {
                // Look for common token property names
                if (item.token) return item.token.toString().trim();
                if (item.name) return item.name.toString().trim();
                if (item.value) return item.value.toString().trim();
                if (item.text) return item.text.toString().trim();
                if (item.label) return item.label.toString().trim();
                
                // If object has only one string property, use that
                var keys = Object.keys(item);
                if (keys.length === 1 && typeof item[keys[0]] === 'string') {
                    return item[keys[0]].toString().trim();
                }
            }
            return null;
        }

        function extractTokensFromObject(obj, tokensArray) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    var value = obj[key];
                    
                    if (Array.isArray(value)) {
                        // Recursively process array values
                        value.forEach(function(item) {
                            var tokenValue = extractTokenValue(item);
                            if (tokenValue) {
                                tokensArray.push(tokenValue);
                            }
                        });
                    } else if (typeof value === 'string' && value.trim().length > 0) {
                        // Add string values as tokens
                        tokensArray.push(value.trim());
                    } else if (typeof value === 'object' && value !== null) {
                        // Recursively process nested objects
                        extractTokensFromObject(value, tokensArray);
                    }
                }
            }
        }

        function addSingleToken(token) {
            return addSingleTokenInternal(token, true);
        }

        function addSingleTokenInternal(token, showMessage) {
            // Convert to Proper Case
            token = toProperCase(token);

            // Check for duplicates (case-insensitive)
            var existingToken = vm.tokens.find(function(t) {
                return t.token && t.token.toLowerCase() === token.toLowerCase();
            });

            if (existingToken) {
                // Silently ignore duplicates - clear input and act like it was added
                if (showMessage) {
                    vm.newToken = '';
                    console.log("DEBUG: Duplicate token ignored", {
                        token: token,
                        existingToken: existingToken.token,
                        action: "silently ignored"
                    });
                    
                    if (silentLogger) {
                        silentLogger.debug('USER_ACTION: Duplicate token ignored', {
                            action: 'Duplicate token ignored',
                            token: token,
                            existingToken: existingToken.token,
                            sessionId: vm.sessionId
                        }, 'sessionTokenPanel.addSingleToken.duplicate');
                    }
                }
                return false;
            }

            var newTokenObj = {
                tokenID: 0, // Temporary ID  
                sessionID: vm.sessionId,
                token: token
            };

            vm.tokens.push(newTokenObj);

            // Always sort tokens alphabetically after adding
            vm.tokens.sort(function(a, b) {
                return a.token.toLowerCase().localeCompare(b.token.toLowerCase());
            });

            console.log("DEBUG: Token added and sorted", {
                token: token,
                totalTokens: vm.tokens.length,
                sortedTokens: vm.tokens.map(function(t) { return t.token; })
            });

            if (silentLogger) {
                silentLogger.info('USER_ACTION: Token added to panel and sorted', {
                    action: 'Token added to panel and sorted',
                    element: {
                        token: token,
                        sessionId: vm.sessionId,
                        tokenCountBefore: vm.tokens.length - 1,
                        tokenCountAfter: vm.tokens.length,
                        sortedOrder: vm.tokens.map(function(t) { return t.token; })
                    },
                    details: 'sessionTokenPanel.addSingleToken'
                }, 'UserInteraction');
            }

            if (showMessage) {
                vm.newToken = '';
                showStatusMessage("Token added: " + token, "success");
            }

            return true;
        }

        function removeToken(tokenIndex) {
            console.log("DEBUG: removeToken() called", {
                tokenIndex: tokenIndex,
                vmTokensLength: vm.tokens.length,
                timestamp: new Date().toISOString()
            });

            if (tokenIndex < 0 || tokenIndex >= vm.tokens.length) {
                logError("Invalid token index");
                console.error("DEBUG: removeToken() invalid index", {
                    tokenIndex: tokenIndex,
                    vmTokensLength: vm.tokens.length
                });
                return;
            }

            var token = vm.tokens[tokenIndex];
            
            if (silentLogger) {
                silentLogger.debug('Removing session token', {
                    tokenIndex: tokenIndex,
                    token: token,
                    tokenValue: token ? token.token : 'UNDEFINED',
                    allTokensCount: vm.tokens.length
                }, 'sessionTokenPanel.removeToken');
            }

            vm.tokens.splice(tokenIndex, 1);
            
            var tokenValue = token && token.token ? token.token : 'UNKNOWN_TOKEN';
            
            console.log("DEBUG: removeToken() completed", {
                removedTokenValue: tokenValue,
                remainingTokensCount: vm.tokens.length,
                timestamp: new Date().toISOString()
            });
            
            // Remove hot towel popup - replaced with status message
            // logSuccess("Token removed: " + tokenValue);
            showStatusMessage("Token removed: " + tokenValue, "success");
        }

        function saveTokens() {
            console.log("DEBUG: saveTokens() called - COMPACT LABEL VERSION", {
                tokenCount: vm.tokens.length,
                tokens: vm.tokens,
                sessionId: vm.sessionId,
                timestamp: new Date().toISOString()
            });

            if (!vm.sessionId || vm.sessionId <= 0) {
                logError("Invalid session ID for saving tokens");
                return;
            }

            vm.isSaving = true;
            var tokenStrings = vm.tokens.map(function(t) { 
                return t.token; 
            });

            console.log("DEBUG: Sending tokens to server", {
                sessionId: vm.sessionId,
                tokenStrings: tokenStrings,
                tokenCount: tokenStrings.length
            });

            if (silentLogger) {
                silentLogger.userAction('User clicked save tokens', {
                    sessionId: vm.sessionId,
                    tokenCount: vm.tokens.length,
                    tokenStrings: tokenStrings
                }, 'sessionTokenPanel.saveTokens.userAction');
            }

            datacontext.saveSessionTokens(vm.sessionId, tokenStrings).then(function(response) {
                console.log("DEBUG: Tokens saved successfully", {
                    response: response,
                    savedTokenCount: tokenStrings.length
                });
                // Remove hot towel popup - replaced with status message
                // logSuccess("Tokens saved successfully (" + tokenStrings.length + " tokens)");
                
                // Show success status message instead of popup
                showStatusMessage("Tokens saved successfully (" + tokenStrings.length + " tokens)", "success");
                
                // Broadcast tokens updated event
                $rootScope.$broadcast('tokensUpdated', vm.sessionId);
                
                // Auto-hide panel after successful save with a brief delay to show the success message
                $timeout(function() {
                    if (vm.onClose) {
                        console.log("DEBUG: Auto-hiding panel after successful save");
                        
                        if (silentLogger) {
                            silentLogger.info('Panel auto-hidden after successful save', {
                                sessionId: vm.sessionId,
                                savedTokenCount: tokenStrings.length
                            }, 'sessionTokenPanel.saveTokens.autoHide');
                        }
                        
                        vm.onClose();
                    }
                }, 1500); // 1.5 second delay to allow user to see the success message
                
                // No need to reload - tokens are already in vm.tokens array

            }).catch(function(error) {
                console.error("DEBUG: Failed to save tokens", {
                    error: error,
                    tokenStrings: tokenStrings
                });
                logError("Failed to save session tokens: " + (error.message || error));
                
                // Show error status message instead of popup
                showStatusMessage("Failed to save tokens: " + (error.message || error), "error");

                if (silentLogger) {
                    silentLogger.error('Session tokens save failed', {
                        sessionId: vm.sessionId,
                        error: error.message || error,
                        tokensOnError: vm.tokens
                    }, 'sessionTokenPanel.saveTokens.error');
                }
            }).finally(function() {
                vm.isSaving = false;
                console.log("DEBUG: Save operation completed", {
                    isSaving: vm.isSaving,
                    finalTokenCount: vm.tokens.length
                });
            });
        }

        function clearTokens() {
            console.log("DEBUG: clearTokens() called", {
                currentTokenCount: vm.tokens.length,
                tokens: vm.tokens.map(function(t) { return t.token; }),
                sessionId: vm.sessionId,
                timestamp: new Date().toISOString()
            });

            if (!vm.tokens || vm.tokens.length === 0) {
                console.log("DEBUG: No tokens to clear");
                showStatusMessage("No tokens to clear", "warning");
                return;
            }

            if (!vm.sessionId || vm.sessionId <= 0) {
                logError("Invalid session ID for clearing tokens");
                showStatusMessage("Invalid session ID for clearing tokens", "error");
                return;
            }

            var tokenCount = vm.tokens.length;
            var tokenNames = vm.tokens.map(function(t) { return t.token; });

            console.log("DEBUG: Starting database delete operation for all tokens", {
                sessionId: vm.sessionId,
                tokenCount: tokenCount,
                tokenNames: tokenNames
            });

            if (silentLogger) {
                silentLogger.userAction('User started clear all tokens operation', {
                    action: 'Clear all tokens from database',
                    sessionId: vm.sessionId,
                    tokenCount: tokenCount,
                    tokenNames: tokenNames
                }, 'sessionTokenPanel.clearTokens.started');
            }

            // Show loading status
            vm.isLoading = true;
            showStatusMessage("Deleting " + tokenCount + " tokens from database...", "warning");

            // Delete all tokens from database
            datacontext.deleteSessionTokens(vm.sessionId).then(function(response) {
                console.log("DEBUG: Database delete successful", {
                    sessionId: vm.sessionId,
                    deletedCount: tokenCount,
                    deletedTokens: tokenNames,
                    response: response,
                    timestamp: new Date().toISOString()
                });

                // Clear the UI tokens array after successful database deletion
                vm.tokens = [];

                // Show success status message
                showStatusMessage(tokenCount + " tokens permanently deleted from database", "success");

                // Broadcast tokens updated event
                $rootScope.$broadcast('tokensUpdated', vm.sessionId);

                if (silentLogger) {
                    silentLogger.info('All tokens cleared successfully from database', {
                        sessionId: vm.sessionId,
                        deletedCount: tokenCount,
                        deletedTokens: tokenNames,
                        finalTokenCount: vm.tokens.length,
                        responseData: response.data
                    }, 'sessionTokenPanel.clearTokens.success');
                }

            }).catch(function(error) {
                console.error("DEBUG: Database delete failed", {
                    sessionId: vm.sessionId,
                    error: error,
                    errorMessage: error.message || 'Unknown error',
                    tokenCount: tokenCount,
                    timestamp: new Date().toISOString()
                });

                logError("Failed to delete tokens from database: " + (error.message || error));
                showStatusMessage("Failed to delete tokens from database: " + (error.message || error), "error");

                if (silentLogger) {
                    silentLogger.error('Failed to clear tokens from database', {
                        sessionId: vm.sessionId,
                        error: error.message || error,
                        errorStatus: error.status,
                        errorData: error.data,
                        tokenCount: tokenCount
                    }, 'sessionTokenPanel.clearTokens.error');
                }

                // Note: Don't clear UI tokens if database operation failed
                // This keeps the UI in sync with the database state

            }).finally(function() {
                vm.isLoading = false;
                console.log("DEBUG: Clear tokens operation completed", {
                    sessionId: vm.sessionId,
                    finalTokenCount: vm.tokens.length,
                    isLoading: vm.isLoading,
                    timestamp: new Date().toISOString()
                });
            });
        }

        function clearInput() {
            console.log("DEBUG: clearInput() called", {
                currentInputLength: vm.newToken ? vm.newToken.length : 0,
                currentInput: vm.newToken ? vm.newToken.substring(0, 50) + (vm.newToken.length > 50 ? '...' : '') : 'empty',
                timestamp: new Date().toISOString()
            });

            vm.newToken = '';
            
            // Force clear the textarea DOM element to ensure no invisible characters remain
            $timeout(function() {
                var textarea = document.getElementById('newToken');
                if (textarea) {
                    textarea.value = '';
                    textarea.focus();
                    // Model is already cleared above, no need for $apply in timeout context
                }
            }, 10);

            if (silentLogger) {
                silentLogger.userAction('User cleared input field', {
                    action: 'Clear input field',
                    sessionId: vm.sessionId,
                    inputCleared: true
                }, 'sessionTokenPanel.clearInput.userAction');
            }
        }

        function close() {
            console.log("DEBUG: close() called");
            
            if (vm.onClose) {
                vm.onClose();
            }
        }

        function onDoubleClickEditor(selectedText) {
            console.log("DEBUG: onDoubleClickEditor() called", {
                selectedText: selectedText
            });

            if (selectedText && selectedText.length > 0) {
                // Clean up the selected text
                var cleanText = selectedText.replace(/[^\w\s-]/g, '').trim();
                if (cleanText.length > 0) {
                    vm.newToken = cleanText;
                    // Remove hot towel popup - replaced with status message
                    // logSuccess("Token suggested from editor: " + cleanText);
                    showStatusMessage("Token suggested from editor: " + cleanText, "success");
                }
            }
        }

        // Simple drag functionality
        function startDrag(event) {
            event.preventDefault();
            
            console.log("DEBUG: startDrag() called - simple version");
            
            vm.isDragging = true;
            var panel = event.target.closest('.session-token-panel');
            if (!panel) return;
            
            var startX = event.clientX - panel.offsetLeft;
            var startY = event.clientY - panel.offsetTop;

            function onMouseMove(e) {
                if (!vm.isDragging) return;
                
                var newX = e.clientX - startX;
                var newY = e.clientY - startY;
                
                // Keep within viewport
                newX = Math.max(0, Math.min(newX, window.innerWidth - 300));
                newY = Math.max(0, Math.min(newY, window.innerHeight - 100));
                
                // Update position immediately - no conflicting updatePanelPosition calls
                panel.style.left = newX + 'px';
                panel.style.top = newY + 'px';
                panel.style.right = 'auto';
                
                // Update stored position for persistence
                vm.panelPosition.x = newX;
                vm.panelPosition.y = newY;
            }

            function onMouseUp() {
                console.log("DEBUG: drag ended - simple version");
                vm.isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                
                // Save position to localStorage for persistence
                localStorage.setItem('sessionTokenPanel.position', JSON.stringify(vm.panelPosition));
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }

        function restorePosition() {
            try {
                var savedPosition = localStorage.getItem('sessionTokenPanel.position');
                if (savedPosition) {
                    var position = JSON.parse(savedPosition);
                    
                    // Validate the saved position is still within viewport bounds
                    if (position.x >= 0 && position.x < window.innerWidth - 100 && 
                        position.y >= 0 && position.y < window.innerHeight - 100) {
                        vm.panelPosition = position;
                        
                        console.log("DEBUG: Restored panel position from localStorage", {
                            restoredPosition: vm.panelPosition
                        });
                        
                        if (silentLogger) {
                            silentLogger.debug('Restored session token panel position', {
                                restoredPosition: vm.panelPosition,
                                source: 'localStorage'
                            }, 'sessionTokenPanel.restorePosition');
                        }
                        
                        // Position will be applied by CSS on next panel show
                        // No immediate DOM manipulation needed with simplified approach
                    }
                }
            } catch (error) {
                console.warn("DEBUG: Failed to restore panel position", {
                    error: error.message
                });
                // Use default position if restoration fails
                vm.panelPosition = { x: window.innerWidth - 545, y: 100 }; // Updated for new panel width
            }
        }

        // Helper function to convert text to Proper Case
        function toProperCase(text) {
            if (!text) return text;
            return text.toLowerCase().replace(/\b\w/g, function(letter) {
                return letter.toUpperCase();
            });
        }

        // Watch for session ID changes
        vm.$onChanges = function(changes) {
            console.log("🔧 DEBUG: sessionTokenPanel.$onChanges() called", {
                changes: Object.keys(changes),
                allChanges: changes,
                currentSessionId: vm.sessionId,
                currentIsVisible: vm.isVisible,
                currentTokenCount: vm.tokens ? vm.tokens.length : 0,
                timestamp: new Date().toISOString()
            });

            // Log all changed properties in detail
            for (var prop in changes) {
                if (changes.hasOwnProperty(prop)) {
                    console.log("🔧 DEBUG: Property '" + prop + "' changed", {
                        oldValue: changes[prop].previousValue,
                        newValue: changes[prop].currentValue,
                        isFirstChange: changes[prop].isFirstChange
                    });
                }
            }

            if (changes.sessionId && changes.sessionId.currentValue !== changes.sessionId.previousValue) {
                console.log("🔧 DEBUG: sessionId DEFINITELY CHANGED", {
                    old: changes.sessionId.previousValue,
                    new: changes.sessionId.currentValue,
                    vm_sessionId: vm.sessionId,
                    isFirstChange: changes.sessionId.isFirstChange
                });

                if (silentLogger) {
                    silentLogger.debug('sessionId changed in $onChanges', {
                        oldValue: changes.sessionId.previousValue,
                        newValue: changes.sessionId.currentValue,
                        currentTokens: vm.tokens,
                        willLoadTokens: vm.sessionId && vm.sessionId > 0 && changes.sessionId.currentValue > 0
                    }, 'sessionTokenPanel.onChanges.sessionId');
                }

                // Clear existing tokens immediately to prevent showing stale data
                console.log("🔧 DEBUG: Clearing existing tokens due to session change", {
                    oldTokenCount: vm.tokens.length,
                    oldSessionId: changes.sessionId.previousValue,
                    newSessionId: changes.sessionId.currentValue
                });
                vm.tokens = [];

                // Hide panel when session changes (user must explicitly reopen for new session)
                if (vm.onClose) {
                    console.log("🔧 DEBUG: Hiding token panel due to session change");
                    vm.onClose(); // This will hide the panel
                }

                // Only reload if we have a valid new session ID and it's actually different
                if (vm.sessionId && vm.sessionId > 0 && changes.sessionId.currentValue > 0) {
                    console.log("🔧 DEBUG: Loading tokens due to session ID change");
                    loadTokens();
                }
            }

            if (changes.isVisible) {
                console.log("🔧 DEBUG: isVisible changed", {
                    oldVisible: changes.isVisible.previousValue,
                    newVisible: changes.isVisible.currentValue,
                    timestamp: new Date().toISOString()
                });

                if (silentLogger) {
                    silentLogger.debug('isVisible changed in $onChanges', {
                        oldVisible: changes.isVisible.previousValue,
                        newVisible: changes.isVisible.currentValue,
                        currentTokens: vm.tokens,
                        froalaEditorExists: !!vm.froalaEditor
                    }, 'sessionTokenPanel.onChanges.isVisible');
                }

                if (changes.isVisible.currentValue) {
                    $timeout(function() {
                        setupEditorDoubleClick();
                        
                        console.log("DEBUG: Panel became visible", {
                            isVisible: vm.isVisible,
                            tokenCount: vm.tokens.length,
                            timestamp: new Date().toISOString()
                        });
                        
                        // If the panel is being shown and we have tokens but no UI values, reload
                        if (vm.tokens.length > 0) {
                            console.log("DEBUG: Panel visible - checking if UI refresh needed", {
                                tokenCount: vm.tokens.length,
                                sessionId: vm.sessionId
                            });
                            
                            // Force UI refresh to ensure input fields show token values
                            $timeout(function() {
                                console.log("DEBUG: Forcing UI refresh on panel show");

                                if (silentLogger) {
                                    silentLogger.debug('Force UI refresh on panel show', {
                                        sessionId: vm.sessionId,
                                        tokenCount: vm.tokens.length,
                                        tokens: vm.tokens,
                                        refreshReason: 'panel_becoming_visible'
                                    }, 'sessionTokenPanel.onChanges.forceRefresh');
                                }
                            }, 50);
                        }
                    }, 100);
                }
            }

            if (silentLogger) {
                silentLogger.debug('$onChanges completed', {
                    changesProcessed: Object.keys(changes),
                    finalState: {
                        sessionId: vm.sessionId,
                        isVisible: vm.isVisible,
                        tokenCount: vm.tokens ? vm.tokens.length : 0
                    }
                }, 'sessionTokenPanel.onChanges.complete');
            }
        };
        
        // Helper function to show status messages instead of hot towel popups
        function showStatusMessage(message, type) {
            vm.statusMessage = message;
            vm.statusType = type || 'success';
            vm.showStatus = true;
            
            // Auto-hide status after 3 seconds
            $timeout(function() {
                vm.showStatus = false;
                vm.statusMessage = '';
                vm.statusType = '';
            }, 3000);
        }
    }
})();
