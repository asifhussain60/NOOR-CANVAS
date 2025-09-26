(function () {
    "use strict";

    angular.module("app").directive("jplayerControl", ["$timeout", "common", "config", jplayerControl]);

    function jplayerControl($timeout, common, config) {

        /***************************************************************************************
        * Usage:
        *           
        *       <div data-jplayer-control=""
        *           data-current-session="vm.currentSession"
        *           data-is-media-ready-to-play="vm.isMediaReadyToPlay"
        *           data-buffer-time="15000">
        *
        * Description:
        *       Adds a jPlayer to the page
        *       buffer-time = 0 disables buffering
        * 
        * Gotcha(s): 
        *       Parent scope can access jPlayer control as follows:
        *           $("#jquery_jplayer_1").jPlayer("play", bullet.jumpLocation);
        * 
        ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            templateUrl: "/app/services/directives/jplayerControl.html",
            scope: {
                currentSession: "=",
                isMediaReadyToPlay: "=",
                bufferTime: "@",
                autoPlay: "@",
                playPauseDelegate: "="
            }
        };
        return directive;

        function link(scope) {

            scope.isMobileBrowser = common.isMobileBrowser();
            var $jp = null;
            scope.bufferTime = Number(scope.bufferTime);

            scope.$watch("currentSession", function (newSession, oldSession) {
                if (!newSession) { 
                    console.warn("No session provided to jPlayer directive");
                    return; 
                }
                if (angular.equals(newSession.name, scope.activeMediaName)) { 
                    return; 
                }
                
                if (!newSession.mediaPath || typeof newSession.mediaPath !== 'string' || newSession.mediaPath.trim() === '') { 
                    console.warn("No valid media file available for session:", newSession.name, "mediaPath:", newSession.mediaPath);
                    scope.isMediaReadyToPlay = false;
                    return;
                }

                loadJplayer(newSession);

            }, false);

            // This is used to trigger load on admin-session-summary page after file upload
            scope.$watch("currentSession.mediaPath", function (newPath, oldPath) {
                if (!newPath || typeof newPath !== 'string' || newPath.trim() === '' || angular.equals(newPath, oldPath)) { 
                    return; 
                }

                loadJplayer(scope.currentSession);
            }, false);

            function loadJplayer(session) {
                if (!session || !session.mediaPath || typeof session.mediaPath !== 'string' || session.mediaPath.trim() === '') {
                    console.error("Invalid session data for jPlayer:", session);
                    scope.isMediaReadyToPlay = false;
                    return;
                }
                
                scope.activeMediaName = "";
                $("#jquery_jplayer_1").jPlayer("destroy");
                scope.isMediaReadyToPlay = false;

                // Prep the jPlayer
                $timeout(function () {
                    setupJplayer(session.mediaPath, session.name);
                }, 1000);

                if (scope.bufferTime <= 0) {
                    scope.isMediaReadyToPlay = true;
                } else {
                    $timeout(function() {
                        var $jp = $("#jquery_jplayer_1");
                        if (!scope.isMobileBrowser && Boolean(scope.autoPlay === "true")) {
                            $jp.jPlayer("play");
                        } else {
                            scope.isMediaReadyToPlay = true;
                        }
                    }, scope.bufferTime || 10000);
                }
            }

            function timeFormat(event) {
                return event.jPlayer.status.currentTime.toString().toHHMMSS();
            }

            function setupJplayer(audioFile, mediaTitle) {
                // Enhanced validation and sanitization for production
                if (!audioFile || typeof audioFile !== 'string') {
                    console.error("🔧 [MEDIA-DEBUG] Invalid audio file parameter:", {
                        audioFile: audioFile,
                        type: typeof audioFile,
                        mediaTitle: mediaTitle,
                        isProduction: !config.isLocalDevelopment
                    });
                    scope.isMediaReadyToPlay = false;
                    return;
                }
                
                // Force string conversion and sanitization for production (defense against database corruption)
                var cleanAudioFile = String(audioFile).trim().replace(/\.mp3$/, '');
                
                // Additional validation to prevent empty paths
                if (!cleanAudioFile || cleanAudioFile === 'null' || cleanAudioFile === 'undefined') {
                    console.error("🔧 [MEDIA-DEBUG] Empty or invalid audio file path:", {
                        originalValue: audioFile,
                        cleanValue: cleanAudioFile,
                        isProduction: !config.isLocalDevelopment
                    });
                    scope.isMediaReadyToPlay = false;
                    return;
                }
                
                // Enhanced path construction with relative path support
                var fullAudioPath;
                // Use relative path - works in all environments (development and production)
                fullAudioPath = config.urls.media + "/" + cleanAudioFile + ".mp3";
                
                console.log("🔧 [MEDIA-DEBUG] Audio path construction (relative):", {
                    originalAudioFile: audioFile,
                    cleanAudioFile: cleanAudioFile,
                    fullAudioPath: fullAudioPath,
                    isLocalDevelopment: config.isLocalDevelopment,
                    mediaUrl: config.urls.media,
                    pathType: 'relative'
                });

                scope.activeMediaName = mediaTitle;
                $(".jp-time-display").css("visibility", "hidden");
                $jp = $("#jquery_jplayer_1");
                
                // Check if the audio file exists before initializing with enhanced error handling
                var testAudio = new Audio();
                testAudio.oncanplaythrough = function() {
                    console.log("🔧 [MEDIA-DEBUG] Audio file loaded successfully:", fullAudioPath);
                    initializeJPlayer();
                };
                testAudio.onerror = function(e) {
                    console.error("🔧 [MEDIA-DEBUG] Audio file failed to load:", {
                        path: fullAudioPath,
                        error: e,
                        audioFileOriginal: audioFile,
                        cleanAudioFile: cleanAudioFile,
                        isProduction: !config.isLocalDevelopment
                    });
                    scope.isMediaReadyToPlay = false;
                    scope.$apply();
                };
                testAudio.onloadstart = function() {
                    console.log("🔧 [MEDIA-DEBUG] Started loading audio:", fullAudioPath);
                };
                testAudio.src = fullAudioPath;
                
                function initializeJPlayer() {
                    $jp.jPlayer({
                        ready: function (event) {
                            $(this).jPlayer("setMedia", {
                                title: mediaTitle,
                                mp3: fullAudioPath,  // Changed from m4a to mp3
                                m4a: fullAudioPath   // Keep m4a as fallback
                            });
                        },
                        timeupdate: function (event) {
                            $(".jp-time-display").text(timeFormat(event));
                        },
                        seeked: function (event) {
                            $(".jp-time-display").text(timeFormat(event));
                            if (scope.playPauseDelegate) {
                                scope.playPauseDelegate(event, "play");
                            }
                        },
                        play: function (event) {
                            if (scope.playPauseDelegate) {
                                //var ct = $jp.data("jPlayer").status.currentTime;
                                scope.playPauseDelegate(event, "play");
                            }
                        },
                        pause: function (event) {
                            if (scope.playPauseDelegate) {
                                scope.playPauseDelegate(event, "pause");
                            }
                        },
                        error: function(event) {
                            console.error("🔧 [MEDIA-DEBUG] jPlayer error:", {
                                event: event,
                                error: event.jPlayer.error,
                                src: event.jPlayer.status.src,
                                mediaPath: fullAudioPath,
                                isProduction: !config.isLocalDevelopment
                            });
                            scope.isMediaReadyToPlay = false;
                            scope.$apply();
                        },
                        swfPath: "../../dist/jplayer",
                        supplied: "mp3, m4a, oga",  // Changed order to prioritize mp3
                        wmode: "window",
                        useStateClassSkin: true,
                        autoBlur: false,
                        smoothPlayBar: true,
                        keyEnabled: false,
                        remainingDuration: true,
                        toggleDuration: true
                    });
                }

                $("#jquery_jplayer_1").bind($.jPlayer.event.play, function (event) {
                    $(".jp-time-display").css("visibility", "visible");
                    if (!common.isMobileBrowser()) {
                        scope.isMobileBrowser = common.isMobileBrowser();
                        scope.isMediaReadyToPlay = !scope.isMobileBrowser;
                    } else {
                        scope.isMediaReadyToPlay = true;
                    }
                    scope.$apply();
                });

                $("#jplayer-control-skip-back").bind("click", function () {
                    var ct = $jp.data("jPlayer").status.currentTime;
                    if (ct < 40) { return; }
                    $jp.jPlayer("play", ct - 30);
                });

                $("#jplayer-control-skip-forward").bind("click", function () {
                    var ct = $jp.data("jPlayer").status.currentTime;
                    $jp.jPlayer("play", ct + 30);
                });


            }

        }
    }

})();

