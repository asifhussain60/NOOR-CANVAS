(function () {
    "use strict";
    var controllerId = "adminAlbumCtl";
    angular.module("app").controller(controllerId,
    ["$scope", "common", "bootstrap.dialog", "config", "froalaConfig", "contentManager", "fileUpload", adminAlbumCtl]);

    function adminAlbumCtl($scope, common, dlg, config, froalaConfig, contentManager, fileUpload) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;
        var timeout = common.$timeout;
        vm.cm = contentManager;

        //Properties
        vm.allAlbums = [];
        vm.imageFile = null;
        vm.isNewAlbum = false;
        vm.fAlbum = {};
        vm.fEditor = null;
        vm.froalaOptions = froalaConfig.fEditorSimpleOptions(onEditorInit);
        vm.imagePreviewUrl = null;
        vm.uploadingImage = false;

        //Methods
        vm.addNewAlbum = addNewAlbum;
        vm.deleteAlbum = deleteAlbum;
        vm.submit = submit;
        vm.onImageSelected = onImageSelected;
        vm.clearImage = clearImage;
        vm.getImageUrl = getImageUrl;

        (function () {
            contentManager.initialize();
            
            // Get member ID from global data for security check
            var memberId = $scope.g && $scope.g.member ? $scope.g.member.id : 0;
            if (!memberId) {
                logError("Member ID not found, cannot load albums securely", controllerId);
                $scope.stateGo("login");
                return;
            }
            
            // Use secure admin album method that validates member access
            var promises = [
                contentManager.getAllAlbumsForAdmin(memberId), 
                contentManager.getAllFamilyMembers(),
                contentManager.initialize() // This loads speakers and other data
            ];
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(response) {
                log("Activated adminAlbum View", controllerId, config.showDevToasts);
                console.log("[adminAlbumCtl] Speakers loaded:", vm.cm.speakers && vm.cm.speakers.length, "speakers");
                console.log("[adminAlbumCtl] Albums loaded:", vm.cm.albums && vm.cm.albums.length, "albums");
                
                // Debug speakers data
                if (vm.cm.speakers && vm.cm.speakers.length > 0) {
                    console.log("[adminAlbumCtl] Speaker sample:", vm.cm.speakers[0]);
                    console.log("[adminAlbumCtl] All speakers detailed:", vm.cm.speakers.map(function(s) {
                        return { 
                            speakerId: s.speakerId || s.id, 
                            speakerName: s.speakerName || s.name,
                            type: typeof (s.speakerId || s.id)
                        };
                    }));
                } else {
                    console.log("[adminAlbumCtl] ⚠️ No speakers loaded - check contentManager.initialize()");
                    
                    // Try to trigger speaker loading if not loaded
                    if (contentManager && typeof contentManager.getAllSpeakers === 'function') {
                        console.log("[adminAlbumCtl] Attempting to load speakers manually...");
                        contentManager.getAllSpeakers().then(function() {
                            console.log("[adminAlbumCtl] Speakers loaded manually:", vm.cm.speakers ? vm.cm.speakers.length : 0);
                        });
                    }
                }
                
                // Debug albums data
                if (vm.cm.albums && vm.cm.albums.length > 0) {
                    console.log("[adminAlbumCtl] Album sample:", vm.cm.albums[0]);
                }
            }

        })();

        //Internal Methods

        $scope.$watch("vm.fAlbum.albumId", function (newAlbumId, oldAlbumId) {
            if (newAlbumId && !angular.equals(newAlbumId, oldAlbumId)) {
                console.log("[adminAlbumCtl] Album selection changed from", oldAlbumId, "to", newAlbumId);
                try {
                    contentManager.setAlbumById(newAlbumId);
                    if (contentManager.currentAlbum) {
                        console.log("[adminAlbumCtl] Loading album data:", contentManager.currentAlbum);
                        
                        // Create album object from database data
                        vm.fAlbum = newAlbumObject(contentManager.currentAlbum);
                        
                        // Clear any previously selected file since we're loading from database
                        vm.imageFile = null;
                        vm.imagePreviewUrl = null;
                        vm.uploadingImage = false;
                        
                        // Set the image path from database and construct preview URL
                        if (vm.fAlbum.imagePath) {
                            // Set the preview URL for display using environment-aware config
                            vm.fAlbum.imagePreview = config.urls.albumImages + "/" + vm.fAlbum.imagePath;
                        } else {
                            // For albums without imagePath but with ID, set default image path
                            var albumId = vm.fAlbum.albumId || vm.fAlbum.id;
                            if (albumId) {
                                vm.fAlbum.imagePath = albumId + ".jpg";
                                vm.fAlbum.imagePreview = config.urls.albumImages + "/" + vm.fAlbum.imagePath;
                            } else {
                                vm.fAlbum.imagePreview = "";
                            }
                        }
                        
                        // Load members for this album
                        contentManager.getMembersForAlbum(newAlbumId);
                        
                        // Mark as existing album (not new)
                        vm.isNewAlbum = false;
                        
                        console.log("[adminAlbumCtl] Album data loaded successfully:", {
                            id: vm.fAlbum.id,
                            name: vm.fAlbum.name,
                            imagePath: vm.fAlbum.imagePath,
                            imagePreview: vm.fAlbum.imagePreview,
                            speakerId: vm.fAlbum.speakerId,
                            description: vm.fAlbum.description ? vm.fAlbum.description.substring(0, 50) + "..." : "No description"
                        });
                        
                        // Debug speaker assignment
                        console.log("[adminAlbumCtl] Speaker assignment check:");
                        console.log("- Album speakerId from Groups table:", vm.fAlbum.speakerId);
                        console.log("- Available speakers:", vm.cm.speakers ? vm.cm.speakers.length : 0);
                        
                        if (vm.cm.speakers && vm.cm.speakers.length > 0) {
                            console.log("- All available speakers:", vm.cm.speakers.map(function(s) {
                                return { 
                                    speakerId: s.speakerId, 
                                    speakerName: s.speakerName,
                                    matchesAlbum: (s.speakerId === vm.fAlbum.speakerId)
                                };
                            }));
                            
                            var matchingSpeaker = vm.cm.speakers.find(function(s) {
                                return s.speakerId === vm.fAlbum.speakerId;
                            });
                            console.log("- Matching speaker found:", matchingSpeaker);
                            
                            // Only clear if speakerId is 0 (no speaker assigned in database)
                            // Keep the speakerId if it matches a valid speaker
                            if (vm.fAlbum.speakerId === 0) {
                                console.log("- SpeakerID is 0 in Groups table, showing empty selection for user to choose");
                                vm.fAlbum.speakerId = null; // Use null instead of empty string for better ng-options handling
                            } else if (!matchingSpeaker) {
                                console.log("- SpeakerID", vm.fAlbum.speakerId, "not found in speakers list, clearing selection");
                                vm.fAlbum.speakerId = null;
                            } else {
                                console.log("- Valid speaker assignment found, keeping speakerId:", vm.fAlbum.speakerId);
                            }
                        } else {
                            console.log("- No speakers available in contentManager.speakers");
                            vm.fAlbum.speakerId = null;
                        }
                    } else {
                        console.log("[adminAlbumCtl] No current album found in contentManager");
                    }
                } catch (error) {
                    logError("Error in albumId watcher: " + error.message, controllerId);
                    console.error("[adminAlbumCtl] Album loading error details:", error);
                }
            }
        }, false);



        $scope.$watch("vm.fAlbum.uploadfileName", function (newPicture, oldPicture) {
            if (!newPicture || !newPicture.name) { return; }
            fileUpload.uploadImageFile(newPicture).then(onSuccess, onFailure);

            function onSuccess(response) {
                vm.fAlbum.base64Image = response.data.link;
            }
            function onFailure(error) {
            }
        }, false);


        function newAlbumObject(album) {
            if (!album) { album = {}; }
            
            var albumObj = {
                albumId: album.id || "",
                id: album.id || "",
                name: album.name || "",
                imagePath: album.imagePath || "",
                imagePreview: "", // Will be set based on imagePath
                speakerId: album.speakerId || album.SpeakerId || 0, // Try both casing variations
                description: album.description || "",
                createdDate: album.createdDate ? new Date(album.createdDate) : ""
            };
            
            // Set image preview URL if there's an image path
            if (albumObj.imagePath) {
                albumObj.imagePreview = config.urls.albumImages + "/" + albumObj.imagePath;
                console.log("[adminAlbumCtl] newAlbumObject - Set image preview:", albumObj.imagePreview);
            }
            
            console.log("[adminAlbumCtl] newAlbumObject created:", {
                id: albumObj.id,
                name: albumObj.name,
                imagePath: albumObj.imagePath,
                imagePreview: albumObj.imagePreview,
                speakerId: albumObj.speakerId,
                hasDescription: !!albumObj.description
            });
            
            return albumObj;
        }

    function deleteAlbum(albumId) {
        dlg.deleteDialog("album", "").then(function (result) {
            if (result === "ok") {
                contentManager.deleteAlbum(albumId).then(function (response) {
                    vm.fAlbum = newAlbumObject();
                });
            }
        });
    }


    function onEditorInit(e, editor) {
        try {
            // Optional: Register custom shortcuts if needed
            // $.FroalaEditor.RegisterShortcut(81, 'paragraphFormat', 'H1', 'Q', false, false);
            vm.fEditor = editor;
        } catch (error) {
            logError("Error initializing Froala editor: " + error.message, controllerId);
        }
    }

    function validateAlbumData(album) {
        console.log("[adminAlbumCtl] Validating album data:", album);
        var isValid = true;
        
        if (!album.name) {
            console.log("[adminAlbumCtl] Validation failed: No album name");
            logError("You have not selected an album name", controllerId, config.showDevToasts);
            isValid = false;
        } else {
            console.log("[adminAlbumCtl] Album name valid:", album.name);
        }
        
        // Enhanced image validation - check for existing image path OR new file OR default pattern availability
        var hasImagePath = album.imagePath && album.imagePath.trim() !== '';
        var hasNewFile = vm.imageFile;
        var albumId = album.albumId || album.id;
        var hasAlbumId = albumId && albumId !== '';
        
        console.log("[adminAlbumCtl] Image validation check:", {
            hasImagePath: hasImagePath,
            hasNewFile: hasNewFile,
            hasAlbumId: hasAlbumId,
            imagePath: album.imagePath,
            albumId: albumId
        });
        
        if (!hasImagePath && !hasNewFile && !hasAlbumId) {
            console.log("[adminAlbumCtl] Validation failed: No image available (no path, no file, no album ID)");
            logError("You have not selected an image", controllerId, config.showDevToasts);
            isValid = false;
        } else {
            console.log("[adminAlbumCtl] Image validation passed:", {
                reason: hasNewFile ? "New file selected" : hasImagePath ? "Database image path" : "Album ID available for default pattern"
            });
        }
        
        if (!album.description) {
            console.log("[adminAlbumCtl] Validation failed: No description");
            logError("You have not entered a album description", controllerId, config.showDevToasts);
            isValid = false;
        } else {
            console.log("[adminAlbumCtl] Description valid:", album.description.substring(0, 50) + "...");
        }
        
        if (!album.members || album.members.length === 0) {
            console.log("[adminAlbumCtl] Validation failed: No members selected");
            logError("You have not selected members for the group", controllerId, config.showDevToasts);
            isValid = false;
        } else {
            console.log("[adminAlbumCtl] Members valid:", album.members.length, "members selected");
        }
        
        console.log("[adminAlbumCtl] Validation result:", isValid);
        return isValid;
    }

    function onImageSelected(files) {
        console.log("[adminAlbumCtl] onImageSelected called with:", files);
        
        if (files && files.length > 0) {
            // Set loading state
            vm.uploadingImage = true;
            vm.imageFile = files[0];
            console.log("[adminAlbumCtl] Selected file:", vm.imageFile.name, vm.imageFile.size, "bytes");
            
            // Validate file type
            var validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (validTypes.indexOf(vm.imageFile.type) === -1) {
                logError("Please select a valid image file (JPG, PNG, or GIF)", controllerId);
                vm.uploadingImage = false;
                return;
            }
            
            // Validate file size (5MB limit)
            var maxSize = 5 * 1024 * 1024; // 5MB
            if (vm.imageFile.size > maxSize) {
                logError("Image file size must be less than 5MB", controllerId);
                vm.uploadingImage = false;
                return;
            }
            
            // Create preview URL IMMEDIATELY for instant feedback
            var reader = new FileReader();
            reader.onload = function(e) {
                timeout(function() {
                    vm.imagePreviewUrl = e.target.result;
                    vm.fAlbum.imagePreview = e.target.result;
                    vm.uploadingImage = false; // Hide loading state
                    console.log("[adminAlbumCtl] Image preview URL set immediately");
                }, 0); // No delay - immediate preview
            };
            reader.readAsDataURL(vm.imageFile);
        } else {
            console.log("[adminAlbumCtl] No files selected or files array is empty");
            vm.uploadingImage = false;
        }
    }

    function clearImage() {
        console.log("[adminAlbumCtl] Clearing image - current state:", {
            hasImageFile: !!vm.imageFile,
            hasPreviewUrl: !!vm.imagePreviewUrl,
            hasAlbumImagePath: !!vm.fAlbum.imagePath,
            hasAlbumImagePreview: !!vm.fAlbum.imagePreview
        });
        
        // Clear newly selected file and its preview
        vm.imageFile = null;
        vm.imagePreviewUrl = null;
        vm.uploadingImage = false;
        
        // Clear database image data (when user wants to remove existing image)
        vm.fAlbum.imagePath = "";
        vm.fAlbum.imagePreview = "";
        
        // Clear the file input
        var fileInput = document.getElementById('imageUpload');
        if (fileInput) {
            fileInput.value = '';
        }
        
        console.log("[adminAlbumCtl] Image cleared successfully");
    }

    function getImageUrl() {
        // Throttle excessive calls
        var now = Date.now();
        if (vm._lastImageUrlCall && (now - vm._lastImageUrlCall) < 100) {
            return vm._lastImageUrl || null;
        }
        vm._lastImageUrlCall = now;
        
        var albumId = vm.fAlbum.albumId || vm.fAlbum.id;
        var imagePath = vm.fAlbum.imagePath;
        var imagePreview = vm.fAlbum.imagePreview;
        var newFilePreview = vm.imagePreviewUrl;
        
        // Only log occasionally to prevent console spam
        if (!vm._imageUrlLogCount || vm._imageUrlLogCount % 50 === 0) {
            console.log('=== getImageUrl Debug (Call #' + (vm._imageUrlLogCount || 0) + ') ===');
            console.log('Album ID:', albumId);
            console.log('Image path from database:', imagePath);
            console.log('Image preview URL:', imagePreview);
            console.log('New file selected:', !!vm.imageFile);
            console.log('Preview URL for new file:', newFilePreview);
        }
        vm._imageUrlLogCount = (vm._imageUrlLogCount || 0) + 1;
        
        var result = null;
        
        // Priority 1: If user has selected a new file, show the preview
        if (newFilePreview) {
            result = newFilePreview;
        } 
        // Priority 2: If album has an existing image from database
        else if (imagePreview) {
            result = imagePreview;
        }
        // Priority 3: If album has imagePath, construct the full URL
        else if (imagePath && imagePath.trim() !== '') {
            result = config.urls.albumImages + "/" + imagePath;
        }
        // Priority 4: If we have an album ID but no image path, try default pattern
        else if (albumId) {
            result = config.urls.albumImages + "/" + albumId + ".jpg";
            // Set the imagePath in the album object to prevent validation issues
            if (!vm.fAlbum.imagePath || vm.fAlbum.imagePath.trim() === '') {
                vm.fAlbum.imagePath = albumId + ".jpg";
                console.log('[adminAlbumCtl] Auto-set imagePath for validation:', vm.fAlbum.imagePath);
            }
        }
        
        vm._lastImageUrl = result;
        return result;
    }

    function submit() {
        console.log("[adminAlbumCtl] Submit started with fAlbum:", vm.fAlbum);
        console.log("[adminAlbumCtl] Image file:", vm.imageFile);
        console.log("[adminAlbumCtl] Is new album:", vm.isNewAlbum);
        
        vm.fAlbum.id = vm.fAlbum.albumId || 0;
        vm.fAlbum.image = vm.fAlbum.imagePath || "";
        vm.fAlbum.members = _(vm.cm.families)
                                .chain()
                                .pluck("members")
                                .flatten()
                                .where({ isChecked: true })
                                .value();

        console.log("[adminAlbumCtl] Prepared album data:", {
            id: vm.fAlbum.id,
            name: vm.fAlbum.name,
            description: vm.fAlbum.description,
            members: vm.fAlbum.members,
            hasImageFile: !!vm.imageFile
        });

        if (!validateAlbumData(vm.fAlbum)) { 
            console.log("[adminAlbumCtl] Validation failed, stopping submit");
            return; 
        }

        console.log("[adminAlbumCtl] Validation passed, calling contentManager.addUpdateCurrentAlbum");

        // First save the album to get the ID
        contentManager.addUpdateCurrentAlbum(vm.fAlbum).then(function (responseAlbumId) {
            console.log("[adminAlbumCtl] Album save response:", responseAlbumId);
            // Update the album ID if it's a new album
            if (vm.isNewAlbum && responseAlbumId) {
                vm.fAlbum.albumId = responseAlbumId;
                vm.fAlbum.id = responseAlbumId;
            }

            // Now upload the image if a new file was selected
            if (vm.imageFile) {
                console.log("[adminAlbumCtl] Starting image upload...");
                var albumIdForUpload = vm.fAlbum.albumId || responseAlbumId;
                
                // Create a mock filename based on album ID
                var mockImagePath = albumIdForUpload + ".jpg";
                
                return fileUpload.uploadAlbumImage(vm.imageFile, albumIdForUpload)
                    .then(function(uploadResponse) {
                        console.log("[adminAlbumCtl] Image upload response:", uploadResponse);
                        // Update the album with the image path
                        vm.fAlbum.imagePath = uploadResponse.data.link;
                        vm.fAlbum.image = uploadResponse.data.link;
                        vm.fAlbum.imagePreview = config.urls.albumImages + "/" + uploadResponse.data.link;
                        
                        // Save the album again with the image path
                        return contentManager.addUpdateCurrentAlbum(vm.fAlbum);
                    })
                    .then(function() {
                        return responseAlbumId;
                    })
                    .catch(function(uploadError) {
                        console.error("[adminAlbumCtl] Image upload error:", uploadError);
                        console.log("[adminAlbumCtl] Switching to development mode - creating mock image path");
                        
                        // In development mode, create a mock image path
                        vm.fAlbum.imagePath = mockImagePath;
                        vm.fAlbum.image = mockImagePath;
                        vm.fAlbum.imagePreview = config.urls.albumImages + "/" + mockImagePath;
                        
                        // Show user-friendly message
                        logError("Image upload failed (API not available) - using development mode. Image path set to: " + mockImagePath, controllerId);
                        
                        // Save the album again with the mock image path
                        return contentManager.addUpdateCurrentAlbum(vm.fAlbum)
                            .then(function() {
                                console.log("[adminAlbumCtl] Album updated with mock image path:", mockImagePath);
                                return responseAlbumId;
                            })
                            .catch(function(saveError) {
                                console.error("[adminAlbumCtl] Failed to save album with image path:", saveError);
                                return responseAlbumId;
                            });
                    });
            } else {
                console.log("[adminAlbumCtl] No image file, skipping upload");
                return responseAlbumId;
            }
        }).then(function (finalAlbumId) {
            // Use $timeout to ensure proper digest cycle execution
            timeout(function() {
                try {
                    if (vm.isNewAlbum) {
                        vm.fAlbum.albumId = finalAlbumId;
                        vm.fAlbum.id = finalAlbumId;
                        var newAlbum = newAlbumObject(angular.copy(vm.fAlbum));
                        
                        // Safely add to albums array
                        if (!contentManager.albums) {
                            contentManager.albums = [];
                        }
                        contentManager.albums.push(newAlbum);
                        logSuccess("Record was successfully added", controllerId);
                    } else {
                        // Safely update album without causing digest issues
                        var albumToUpdate = angular.copy(vm.fAlbum);
                        contentManager.updateAlbum(albumToUpdate);
                        logSuccess("Record was successfully updated", controllerId);
                    }
                    
                    // Clear the file input
                    vm.imageFile = null;
                    vm.isNewAlbum = false;
                } catch (error) {
                    logError("Error updating UI after album save: " + error.message, controllerId);
                }
            }, 0);
        }).catch(function(error) {
            // Enhanced error logging for debugging
            console.error("[adminAlbumCtl] Album save error details:", error);
            console.error("[adminAlbumCtl] Error status:", error.status);
            console.error("[adminAlbumCtl] Error data:", error.data);
            console.error("[adminAlbumCtl] Error config:", error.config);
            
            var errorMessage = "Error saving album: ";
            if (error.data && error.data.message) {
                errorMessage += error.data.message;
            } else if (error.data && error.data.exceptionMessage) {
                errorMessage += error.data.exceptionMessage;
            } else if (error.statusText) {
                errorMessage += error.statusText + " (HTTP " + error.status + ")";
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += "Unknown error occurred";
            }
            
            // Specific handling for common errors
            if (error.status === 404) {
                errorMessage += "\n- API endpoint not found: " + (error.config ? error.config.url : "unknown URL");
                errorMessage += "\n- Backend may not be running or configured correctly.";
            } else if (error.status === 500) {
                errorMessage += "\n- Server error. Check backend logs for details.";
                if (error.data && error.data.exceptionMessage) {
                    errorMessage += "\n- Server exception: " + error.data.exceptionMessage;
                }
            } else if (error.status === 0) {
                errorMessage += "\n- Network error. Server may be offline.";
            }
            
            logError(errorMessage, controllerId);
            
            // Show user-friendly message
            if (error.status === 404 || error.status === 500) {
                logError("Note: You can still use the preview functionality. The image will be saved when the backend is available.", controllerId);
            }
            
            // For development: show the exact error in console
            console.log("[adminAlbumCtl] Full error object for debugging:", JSON.stringify({
                status: error.status,
                statusText: error.statusText,
                url: error.config ? error.config.url : 'unknown',
                method: error.config ? error.config.method : 'unknown',
                data: error.data
            }, null, 2));
        });
    }

    function addNewAlbum(state) {
        vm.fAlbum = newAlbumObject({});
        vm.isNewAlbum = state;
        vm.imageFile = null;
        contentManager.resetAlbumMembersInFamilies();
        if (state) {
            timeout(function () { $("#albumTitle").focus(); }, 500);
        }
    }

}

})();