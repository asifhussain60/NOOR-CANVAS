/**
 * Ahadees Modal Module - Modal creation & management
 * Part of the decomposed Froala Ahadees Plugin
 */
(function() {
    'use strict';

    // Use deferred registration to avoid module not found errors
    function registerAhadeesModal() {
        // Check if Angular app module exists before registering
        try {
            if (typeof angular !== 'undefined' && angular.module) {
                // Try to get the app module - this will throw if it doesn't exist
                angular.module('app');

                // Module exists, safe to register
                angular.module("app").factory("froalaAhadeesModal", [
                    "froalaModalService",
                    "froalaDialogService",
                    "froalaBasePlugin",
                    "froalaUtilities",
                    "froalaAhadeesSearch",
                    "froalaAhadeesFormatter",
                    froalaAhadeesModal
                ]);
                
                console.log('✅ [FROALA-AHADEES-MODAL] Successfully registered with Angular app module');
                return true;
            } else {
                console.warn('[FROALA-AHADEES-MODAL] Angular not available, skipping registration');
                return false;
            }
        } catch (e) {
            console.warn('[FROALA-AHADEES-MODAL] Angular app module not found, skipping registration:', e.message);
            return false;
        }
    }

    // Try immediate registration if deferred system is not available (fallback)
    if (typeof window.registerFroalaPlugin === 'function') {
        window.registerFroalaPlugin(registerAhadeesModal, 'froalaAhadeesModal');
    } else {
        // Fallback to old behavior
        registerAhadeesModal();
    }

    function froalaAhadeesModal(
        modalService,
        dialogService,
        basePlugin,
        utilities,
        ahadeesSearch,
        ahadeesFormatter
    ) {
        var service = {
            createModal: createModal
        };

        return service;

        /**
         * Create the ahadees modal
         */
        function createModal(editor, insertionMarker, markerPlaced, markerCallback) {
            console.log('🔍 [AHADEES-MODAL] Creating ahadees modal...');

            // Remove any existing fallback modal
            $('#ahadees-fallback-modal').remove();

            var fallbackHtml = `
                <div id="ahadees-fallback-modal" class="ks-ahadees-modal-overlay">
                    <div id="ahadees-modal-container" class="ks-ahadees-modal-container">
                        <div id="ahadees-modal-header" class="ks-ahadees-modal-header">
                            <div class="ks-ahadees-header-left">
                                <h4><span class="emoji">🕌</span> Islamic Ahadees Panel</h4>
                                <button id="manage-ahadees-link" class="ks-ahadees-manage-btn">
                                    <span>⚙️</span> Manage Ahadees
                                </button>
                            </div>
                            <div class="ks-ahadees-header-right">
                                <span class="ks-ahadees-drag-hint">📍 Drag to move</span>
                                <button id="close-ahadees-modal" class="ks-ahadees-modal-close-btn">✕</button>
                            </div>
                        </div>
                        <div id="ahadees-modal-content" class="ks-ahadees-modal-content">
                            <div class="ks-ahadees-search-section">
                                <div class="ks-ahadees-search-subsection">
                                    <label class="ks-ahadees-search-label">🔍 Universal Search</label>
                                    <input type="text" id="universal-search-input" placeholder="Search anything: narrator, topic, Arabic, English... (try: abd, allah, bukhari, prayer)">
                                    <div class="ks-ahadees-search-tip">
                                        <span>💡 Tip: Type English transliterations like 'abd', 'allah', 'muhammad'</span>
                                        <span id="search-status"></span>
                                    </div>
                                </div>
                                <div class="ks-ahadees-button-container">
                                    <button id="universal-search-btn">🔍 Smart Search</button>
                                    <button id="fallback-recent-btn">📋 Load Recent</button>
                                    <button id="clear-search-btn">🗑️ Clear</button>
                                </div>
                            </div>
                            <div id="fallback-ahadees-results" class="ks-ahadees-results-container">
                                <div class="ks-ahadees-empty-state">
                                    <div class="ks-ahadees-empty-icon">🔍</div>
                                    <p class="ks-ahadees-empty-title">Search for ahadees to insert into your content</p>
                                    <p class="ks-ahadees-empty-subtitle">This panel stays open until you close it</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            $('body').append(fallbackHtml);

            // Initialize transliteration engine from search service
            var transliterationEngine = ahadeesSearch.createTransliterationEngine();

            // Bind events for universal search modal
            $('#close-ahadees-modal').click(function() {
                $('#ahadees-fallback-modal').remove();

                // Remove any orphaned insertion marker if modal closed without inserting
                cleanupInsertionMarker();

                // Clean up all event handlers
                $(document).off('keydown.ahadees-modal mousemove.ahadees-drag mouseup.ahadees-drag');

                // Restore focus to the Froala editor when modal is closed
                setTimeout(function() {
                    if (editor && editor.$el) {
                        editor.events.focus();
                    }
                }, 100);
            });

            // Manage Ahadees button - Navigate to admin ahadees management
            $('#manage-ahadees-link').click(function() {
                // Close the modal first
                $('#ahadees-fallback-modal').remove();

                // Remove any orphaned insertion marker
                cleanupInsertionMarker();

                // Use multiple approaches to navigate internally
                try {
                    // Method 1: Try to find and use the stateGo function from rootScope
                    var $rootScope = angular.element(document.body).scope();
                    if ($rootScope && $rootScope.$root && typeof $rootScope.$root.stateGo === 'function') {
                        $rootScope.$root.stateGo('admin.ahadeesManager');
                        $rootScope.$apply();
                        return;
                    }

                    // Method 2: Try to get $state service directly from injector
                    var injector = angular.element(document.body).injector();
                    if (injector) {
                        var $state = injector.get('$state');
                        if ($state && typeof $state.go === 'function') {
                            $state.go('admin.ahadeesManager');
                            return;
                        }
                    }

                    // Method 3: Try to find any element with ng-controller and get its scope
                    var ngElements = angular.element('[ng-controller]');
                    if (ngElements.length > 0) {
                        var scope = angular.element(ngElements[0]).scope();
                        if (scope && scope.stateGo) {
                            scope.stateGo('admin.ahadeesManager');
                            scope.$apply();
                            return;
                        }
                    }

                } catch (e) {
                    console.error('🔍 [AHADEES-MODAL] Angular routing failed:', e);
                }

                // Fallback: use location.hash for internal routing (same-page navigation)
                window.location.hash = '/admin/mng/ahadees';
            });

            // Universal search button
            $('#universal-search-btn').click(function() {
                ahadeesSearch.performUniversalSearch(transliterationEngine, editor, insertionMarker, markerPlaced, markerCallback);
            });

            // Clear search button
            $('#clear-search-btn').click(function() {
                $('#universal-search-input').val('');
                $('#search-status').text('');
                showInitialMessage();
            });

            $('#fallback-recent-btn').click(function() {
                ahadeesSearch.loadRecentAhadees();
            });

            // Make the modal draggable
            makeDraggable();

            // Prevent modal from closing when clicking outside (make it truly modal)
            $('#ahadees-fallback-modal').off('click').on('click', function(e) {
                // Only allow closing via the close button, not by clicking overlay
                e.stopPropagation();
            });

            // Allow clicking on the modal content without closing
            $('#ahadees-modal-container').off('click').on('click', function(e) {
                e.stopPropagation();
            });

            // Enhanced Enter key search with real-time feedback
            var searchTimeout;
            $('#universal-search-input').on('input', function() {
                var searchText = $(this).val().trim();
                $('#search-status').text('');

                // Clear previous timeout
                clearTimeout(searchTimeout);

                if (searchText.length > 0) {
                    $('#search-status').text('Type more or press Enter...');

                    // Auto-search after 2 seconds of inactivity
                    searchTimeout = setTimeout(function() {
                        if ($('#universal-search-input').val().trim().length >= 2) {
                            console.log('🔍 [AHADEES-MODAL] Auto-search triggered after 2 seconds');
                            ahadeesSearch.performUniversalSearch(transliterationEngine, editor, insertionMarker, markerPlaced, markerCallback);
                        }
                    }, 2000);
                }
            });

            $('#universal-search-input').keypress(function(e) {
                if (e.which === 13) { // Enter key
                    clearTimeout(searchTimeout);
                    ahadeesSearch.performUniversalSearch(transliterationEngine, editor, insertionMarker, markerPlaced, markerCallback);
                }
            });

            // Close modal on ESC key (optional - can be removed for truly persistent modal)
            $(document).off('keydown.ahadees-modal').on('keydown.ahadees-modal', function(e) {
                if (e.keyCode === 27) { // ESC key
                    $('#ahadees-fallback-modal').remove();

                    // Remove any orphaned insertion marker if modal closed without inserting
                    cleanupInsertionMarker();

                    // Restore focus to the Froala editor
                    setTimeout(function() {
                        if (editor && editor.$el) {
                            editor.events.focus();
                        }
                    }, 100);

                    // Remove the ESC key handler and drag handlers
                    $(document).off('keydown.ahadees-modal mousemove.ahadees-drag mouseup.ahadees-drag');
                }
            });

            // Focus on universal search input
            setTimeout(function() {
                $('#universal-search-input').focus();
            }, 100);

            // Show initial helpful message
            showInitialMessage();

            console.log('✅ [AHADEES-MODAL] Modal created successfully');
        }

        /**
         * Show initial message in results area
         */
        function showInitialMessage() {
            $('#fallback-ahadees-results').html(`
                <div class="ks-ahadees-empty-state">
                    <div class="ks-ahadees-empty-icon">🔍</div>
                    <p class="ks-ahadees-empty-title">Universal search with transliteration support</p>
                    <div class="ks-ahadees-empty-subtitle">
                        <strong>Try searching for:</strong><br>
                        🕌 <em>abd, allah, bukhari, prayer, fasting</em><br>
                        📖 <em>sahih muslim, ramadan, salah</em><br>
                        🌟 <em>muhammad, ibrahim, abdullah</em>
                    </div>
                </div>
            `);
        }

        /**
         * Make the modal draggable by the header
         */
        function makeDraggable() {
            var $modal = $('#ahadees-modal-container');
            var $header = $('#ahadees-modal-header');
            var isDragging = false;
            var startX, startY, startLeft, startTop;

            $header.on('mousedown', function(e) {
                // Only drag on left click and not on buttons
                if (e.which !== 1 || $(e.target).is('button') || $(e.target).closest('button').length > 0) {
                    return;
                }

                isDragging = true;
                $header.css('cursor', 'grabbing');

                // Get current position
                var modalRect = $modal[0].getBoundingClientRect();
                startLeft = modalRect.left;
                startTop = modalRect.top;
                startX = e.clientX;
                startY = e.clientY;

                // Prevent text selection during drag
                e.preventDefault();
                $(document.body).css('user-select', 'none');

                console.log('🔍 [AHADEES-MODAL] Drag started at:', {startX, startY, startLeft, startTop});
            });

            $(document).on('mousemove.ahadees-drag', function(e) {
                if (!isDragging) return;

                var deltaX = e.clientX - startX;
                var deltaY = e.clientY - startY;
                var newLeft = startLeft + deltaX;
                var newTop = startTop + deltaY;

                // Keep modal within viewport bounds
                var windowWidth = $(window).width();
                var windowHeight = $(window).height();
                var modalWidth = $modal.outerWidth();
                var modalHeight = $modal.outerHeight();

                newLeft = Math.max(0, Math.min(newLeft, windowWidth - modalWidth));
                newTop = Math.max(0, Math.min(newTop, windowHeight - modalHeight));

                // Update position
                $modal.css({
                    'position': 'fixed',
                    'left': newLeft + 'px',
                    'top': newTop + 'px',
                    'transform': 'none'
                });

                // Update the parent container to not center anymore
                $('#ahadees-fallback-modal').css({
                    'align-items': 'flex-start',
                    'justify-content': 'flex-start'
                });
            });

            $(document).on('mouseup.ahadees-drag', function() {
                if (isDragging) {
                    isDragging = false;
                    $header.css('cursor', 'move');
                    $(document.body).css('user-select', '');
                    console.log('🔍 [AHADEES-MODAL] Drag ended');
                }
            });

            // Cleanup drag events when modal is removed
            $('#close-ahadees-modal').on('click', function() {
                $(document).off('mousemove.ahadees-drag mouseup.ahadees-drag');
            });

            console.log('🔍 [AHADEES-MODAL] Drag functionality initialized');
        }

        /**
         * Clean up any orphaned insertion markers
         */
        function cleanupInsertionMarker() {
            // This function is passed from the button module
            if (typeof markerCallback === 'function') {
                markerCallback(false);
            }
        }
    }
})();
