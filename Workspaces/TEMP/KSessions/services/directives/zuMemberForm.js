(function () {
    "use strict";
    var directiveId = "zuMemberForm";
    angular.module("app").directive(directiveId, ["bootstrap.dialog", "$state", "common", "config", "datacontext", "contentManager", zuMemberForm]);

    function zuMemberForm(dlg, $state, common, config, datacontext, cm) {
        /***************************************************************************************
        * Usage:
        *
        * Description:
        *
        * Gotcha(s):
        *
        ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            templateUrl: "/app/services/directives/zuMemberForm.html",
            scope: {
                member: "=zuMemberForm",
                submitCaption: "@"
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            var getLogFn = common.logger.getLogFn;
            var log = getLogFn(directiveId);
            var logSuccess = getLogFn(directiveId, "success");
            var logError = getLogFn(directiveId, "error");
            var isNewMember = Boolean(!scope.member);
            var isExternalAdd = angular.isNullOrUndefined(scope.member);
            scope.cm = cm;
            scope.backupMember = null;
            scope.member = memberInstance(scope.member);
            scope.cloneMemberList = angular.copy(cm.memberList);
            scope.backupMember = angular.copy(scope.member);

            initialize();

            if (angular.isNullOrUndefined(scope.member)) {
                logError("Member Object cannot be null", directiveId, config.showDevToasts);
            }

            function initialize() {
                scope.submitCaption = scope.submitCaption || "Submit";
                var promises = [
                    cm.getAllFamilyMembers(),
                    datacontext.getAllCountries()
                ];
                common.$q.all(promises).then(onSuccess, function (result) { return false; });
                function onSuccess(result) {
                    if (!result) { return; }
                    scope.countries = result[1].data;
                }
            }

            scope.newMember = function () {
                isNewMember = true;
                scope.member = memberInstance();
            }

            scope.submit = function () {
                var msg = "Are you sure you want to save these changes?";
                dlg.confirmationDialog("Save Member", msg, "Yes", "No").then(function (result) {
                    if (scope.member) {
                        scope.member.fullName = scope.member.firstName + " " + scope.member.lastName;
                    }
                    cm.addUpdateFamilyMember(scope.member).then(function (responseMemberId) {
                        if (isNewMember) {
                            scope.member.memberId = responseMemberId;
                            var newMember = memberInstance(angular.copy(scope.member));
                            cm.memberList.push(newMember);
                            logSuccess("Record was successfully added", directiveId);
                            navigateSave(newMember.cloneMemberId, responseMemberId);
                        } else {
                            cm.updateFamilyMember(scope.member);
                            logSuccess("Record was successfully updated", directiveId);
                            navigateSave(scope.member.cloneMemberId, responseMemberId);
                        }
                        function navigateSave(cloneId, memberId) {
                            if (cloneId) {
                                $state.go("admin.login", { memberId: memberId });
                            } else {
                                $state.go("admin.family");
                            }
                        }
                    });
                });
            };

            scope.cancel = function () {
                var msg = "Are you sure you want to cancel? All your changes will be lost";
                dlg.deleteDialog("Delete Member", msg, "Yes", "No").then(function (result) {
                    if (result === "ok") {
                        if (!isExternalAdd) {
                            scope.member = scope.backupMember;
                        } else {
                            $state.go("admin.family");
                        }
                        isNewMember = false;
                    }
                });
            };

            function memberInstance(member) {
                if (!member) { member = {}; }
                var result = {
                    familyId: member.familyId || -1,  // Back to -1 as you requested
                    memberId: member.id || member.memberId || "",
                    id: member.id || member.memberId || "",
                    fullName: member.fullName || "",
                    firstName: member.firstName || "",
                    lastName: member.lastName || "",
                    nickName: member.nickName || "",
                    gender: member.gender || "",
                    birthYear: member.birthYear || "",
                    age: member.age || "",
                    emailAddress: member.emailAddress || "",
                    countryId: member.countryId || "",
                    isO2: member.isO2 || "",
                    cloneMemberId: member.cloneMemberId || "",
                    isAdmin: member.isAdmin || false,
                    isRegular: member.isRegular || true,
                    expiresInDays: member.expiresInDays || 0,
                    isPreviliged: member.isPreviliged || false,
                    isSubscribed: member.isSubscribed || true,
                    isActive: member.isActive || false,  // Already changed to false
                    canViewText: member.canViewText || true,
                    canViewMedia: member.canViewMedia || true,
                    mostRecentOnly: member.mostRecentOnly || ""
                }
                return angular.copy(result);
            }

            // Watchers

            scope.$watch("member.age", function (newValue, oldValue) {
                if (newValue && !angular.equals(newValue, oldValue)) {
                    scope.member.birthYear = getBirthYearFromAge(newValue);
                }
            }, true);
            scope.$watch("member.birthYear", function (newValue, oldValue) {
                if (newValue && !angular.equals(newValue, oldValue)) {
                    scope.member.age = getAgeFromBirthYear(newValue);
                }
            }, true);
            scope.$watch("member.countryId", function (newValue, oldValue) {
                if (newValue && !angular.equals(newValue, oldValue)) {
                    var c = common.findById(scope.countries, "id", newValue);
                    if (c) {
                        scope.member.isO2 = c.isO2;
                    }
                }
            }, true);

            function getAgeFromBirthYear(year) {
                var currentYear = moment().year();
                return currentYear - year;
            }
            function getBirthYearFromAge(age) {
                var currentYear = moment().year();
                return currentYear - age;
            }
        }
    }
})();