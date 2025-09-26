(function () {
    "use strict";
    var controllerId = "loginCtl";
    angular.module("app").controller(controllerId,
        ["$rootScope", "$scope", "$state", "auditService", "authService", "common", "config", "datacontext", "mediaportService", loginCtl]);

    function loginCtl($rootScope, $scope, $state, auditService, authService, common, config, datacontext, mediaportService) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;
        $scope.g.navConfig.applicationTitle = config.applicationTitle;

        // Function bindings
        vm.signIn = signIn;
        vm.toggleRequestForm = toggleRequestForm;
        vm.submitAccessRequest = submitAccessRequest;
        vm.cancelRequest = cancelRequest;
        vm.handleKeyPress = handleKeyPress;

        // State variables
        vm.signingIn = false;
        vm.showRequestForm = false;
        vm.submittingRequest = false;
        vm.showErrorMessage = false;
        vm.showSuccessMessage = false;
        vm.errorMessage = "";
        vm.successMessage = "";
        vm.requestData = {
            email: ''
        };

        (function () {
            var promises = [];

            resetCssFiles();
            $scope.g.navConfig.showFooter = false;
            $scope.g.cssConfig.userCssLoaded = false;
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(result) {
                authService.logout();
                $rootScope.$state.current.data.pageTitle = "";
                if ($scope.g && $scope.g.member) {
                    auditService.addAuditEntryForLogOut().then(function (response) {
                        $scope.g.hasAccess = false;
                        $scope.g = null;
                    });
                }

                log("Activated login View", controllerId, config.showDevToasts);
            }
        })();

        function signIn() {
            vm.signingIn = true;
            authService.login();
        }

        function toggleRequestForm() {
            vm.showRequestForm = !vm.showRequestForm;
            vm.showErrorMessage = false;
            vm.showSuccessMessage = false;
            vm.errorMessage = "";
            vm.successMessage = "";

            if (vm.showRequestForm) {
                // Clear any previous data and reset form
                vm.requestData.email = '';
                // Focus on email input after a short delay to allow DOM to update
                common.$timeout(function () {
                    var emailInput = document.getElementById('requestEmail');
                    if (emailInput) {
                        emailInput.focus();
                    }
                }, 100);
            }
        }

        function submitAccessRequest() {
            // Clear any previous messages
            vm.showErrorMessage = false;
            vm.showSuccessMessage = false;
            vm.errorMessage = "";
            vm.successMessage = "";

            if (!vm.requestData.email || !isValidEmail(vm.requestData.email)) {
                vm.showErrorMessage = true;
                vm.errorMessage = "Please enter a valid email address.";
                return;
            }

            vm.submittingRequest = true;

            // Check if email exists in Members table
            datacontext.checkMemberEmailExists(vm.requestData.email).then(function (response) {
                vm.submittingRequest = false;

                if (response.data.exists) {
                    // Email exists - show green success message
                    vm.showSuccessMessage = true;

                    if (response.data.isActive) {
                        // Member is active, show success message directing to sign in
                        vm.successMessage = "Great! This email is already registered and active. Please use the Sign In button above to access your account.";
                    } else {
                        // Member exists but not active, show success message and route to registration
                        vm.successMessage = "Email found! Redirecting you to complete your registration...";

                        // Preserve email for navigation before clearing form
                        var emailForNavigation = vm.requestData.email;

                        // Route to registration after a short delay to show the message
                        common.$timeout(function () {
                            $state.go("registration", { email: emailForNavigation });
                        }, 1500);
                    }
                } else {
                    // Email doesn't exist, show contact administrator message (red)
                    vm.showErrorMessage = true;
                    vm.errorMessage = "This email is not in our system. Please contact the administrator to set up your account before registration.";
                }

                vm.showRequestForm = false;
                vm.requestData.email = '';
            }, function (error) {
                vm.submittingRequest = false;
                vm.showErrorMessage = true;
                vm.errorMessage = "An error occurred while checking your email. Please try again.";
            });
        }

        function cancelRequest() {
            vm.showRequestForm = false;
            vm.requestData.email = '';
            vm.submittingRequest = false;
            vm.showErrorMessage = false;
            vm.showSuccessMessage = false;
            vm.errorMessage = "";
            vm.successMessage = "";
        }

        function isValidEmail(email) {
            // Simple email validation regex
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        function handleKeyPress($event) {
            // Check if Enter key was pressed (keyCode 13)
            if ($event.which === 13 || $event.keyCode === 13) {
                $event.preventDefault(); // Prevent default form submission

                // Only submit if form is valid and not already submitting
                if (vm.requestData.email && isValidEmail(vm.requestData.email) && !vm.submittingRequest) {
                    // Add visual feedback - briefly highlight the input
                    var inputElement = $event.target;
                    inputElement.style.backgroundColor = '#dff0d8';
                    inputElement.style.borderColor = '#5cb85c';

                    // Reset styling after a brief moment
                    common.$timeout(function () {
                        inputElement.style.backgroundColor = '';
                        inputElement.style.borderColor = '';
                    }, 300);

                    // Submit the request
                    vm.submitAccessRequest();
                } else if (!vm.requestData.email || !isValidEmail(vm.requestData.email)) {
                    // Provide visual feedback for invalid email
                    var inputElement = $event.target;
                    inputElement.style.backgroundColor = '#f2dede';
                    inputElement.style.borderColor = '#d9534f';

                    // Reset styling after a brief moment
                    common.$timeout(function () {
                        inputElement.style.backgroundColor = '';
                        inputElement.style.borderColor = '';
                    }, 800);
                }
            }
        }

        function resetCssFiles() {
            var filesToUnload = [
                "/Content/styles/sessions/css/ksessions.css",
                "/Themes/McAdmin/css/mcadmin.css",
                "/Content/styles/appGlobal.css",
                "/Content/styles/manage/kmanage.css",
                "/Themes/McAdmin/css/mcadmin.css",
                "/Content/styles/sessions/css/ksessions_iPhone6P.css",
                "/Content/styles/sessions/css/ksessions_iPhone6.css",
                "/Content/styles/sessions/css/ksessions_iPhone5.css"
            ];
            common.removejscssfile(filesToUnload);
            common.loadjscssfile([
                "/Content/styles/appGlobal.css",
                "/Content/styles/sessions/css/ksessions.css"
            ]);
        }
    }
})();