(function () {
    "use strict";
    var controllerId = "registrationCtl";
    angular.module("app").controller(controllerId,
        ["$scope", "$state", "$stateParams", "common", "config", "datacontext", registrationCtl]);

    function registrationCtl($scope, $state, $stateParams, common, config, datacontext) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {}; var vm = $scope.vm;

        //Properties
        vm.email = $stateParams.email || "";
        vm.countries = [];
        vm.registrationData = {
            email: vm.email,
            firstName: "",
            lastName: "",
            nickName: "",
            gender: "",
            countryId: null  // Initialize as null instead of empty string
        };
        vm.submitting = false;
        vm.validationComplete = false;

        //Methods
        vm.submit = submit;
        vm.backToLogin = backToLogin;

        activate();

        function activate() {
            // Ensure email is set from state params immediately
            if ($stateParams.email) {
                vm.email = $stateParams.email;
                vm.registrationData.email = vm.email;
            }

            var promises = [datacontext.getAllCountries()];

            // If we have an email, also fetch member data for pre-population
            if (vm.email) {
                promises.push(datacontext.getMemberDataForRegistration(vm.email));
            }

            common.activateController(promises, controllerId)
                .then(onControllerActivation)
                .catch(onControllerActivationError);

            function onControllerActivation(result) {
                if (result && result[0] && result[0].data) {
                    vm.countries = result[0].data;
                    logSuccess("Loaded " + vm.countries.length + " countries successfully", controllerId, true);
                } else {
                    logError("Failed to load countries. Please refresh the page.", controllerId, true);
                    return;
                }

                // If we fetched member data, pre-populate the form
                if (result[1] && result[1].data) {
                    var memberResponse = result[1].data;

                    if (memberResponse.exists && !memberResponse.isActive && memberResponse.memberData) {
                        // Pre-populate form with existing member data (but preserve email)
                        var currentEmail = vm.registrationData.email; // Preserve the email we already set
                        vm.registrationData.email = memberResponse.memberData.email || currentEmail;
                        vm.registrationData.firstName = memberResponse.memberData.firstName;
                        vm.registrationData.lastName = memberResponse.memberData.lastName;
                        vm.registrationData.nickName = memberResponse.memberData.nickName;
                        vm.registrationData.gender = memberResponse.memberData.gender;

                        // Ensure countryId is the correct type (number) and set after a short delay
                        if (memberResponse.memberData.countryId) {
                            var countryId = parseInt(memberResponse.memberData.countryId, 10);

                            // Use timeout to ensure the dropdown is fully rendered before setting the value
                            common.$timeout(function () {
                                vm.registrationData.countryId = countryId;
                            }, 100);
                        }

                        logSuccess("Form pre-populated with your existing information. Please review and update any fields as needed.", controllerId, true);
                    } else if (memberResponse.isActive) {
                        logError("This email is already active. Redirecting to login page.", controllerId, true);

                        // Redirect to login after showing message
                        common.$timeout(function () {
                            $state.go("login");
                        }, 3000);
                    } else if (!memberResponse.exists) {
                        logError("Email not found in our system. Please contact the administrator.", controllerId, true);

                        // Redirect to login after showing message
                        common.$timeout(function () {
                            $state.go("login");
                        }, 3000);
                    }
                }

                // Final check - ensure email is always set if we have it from state params
                if ($stateParams.email && !vm.registrationData.email) {
                    vm.registrationData.email = $stateParams.email;
                }

                log("Activated registration View", controllerId, config.showDevToasts);
            }

            function onControllerActivationError(error) {
                logError("Failed to load registration form. Please try again.", controllerId, true);
            }
        }

        function submit() {
            if (!validateForm()) {
                return;
            }

            vm.submitting = true;

            datacontext.completeRegistration(vm.registrationData).then(function (response) {
                vm.submitting = false;
                if (response.data.success) {
                    vm.validationComplete = true;
                    logSuccess("Registration completed successfully! You may now login.", controllerId, true);
                } else {
                    logError(response.data.message || "Registration failed. Please try again.", controllerId, true);
                }
            }, function (error) {
                vm.submitting = false;
                logError("An error occurred during registration. Please try again.", controllerId, true);
            });
        }

        function validateForm() {
            if (!vm.registrationData.firstName || vm.registrationData.firstName.trim() === "") {
                logError("First Name is required.", controllerId, true);
                return false;
            }
            if (!vm.registrationData.lastName || vm.registrationData.lastName.trim() === "") {
                logError("Last Name is required.", controllerId, true);
                return false;
            }
            if (!vm.registrationData.nickName || vm.registrationData.nickName.trim() === "") {
                logError("Please tell us how you'd like to be addressed.", controllerId, true);
                return false;
            }
            if (!vm.registrationData.gender || vm.registrationData.gender === "") {
                logError("Gender is required.", controllerId, true);
                return false;
            }
            if (!vm.registrationData.countryId || vm.registrationData.countryId === "" || vm.registrationData.countryId === null) {
                logError("Country is required.", controllerId, true);
                return false;
            }
            return true;
        }

        function backToLogin() {
            $state.go("login");
        }
    }
})();