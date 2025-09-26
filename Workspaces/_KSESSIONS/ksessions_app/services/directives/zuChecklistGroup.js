(function () {
    "use strict";

    angular.module("app").directive("zuChecklistGroup", ["common", zuChecklistGroup]);

    function zuChecklistGroup(common) {

        /***************************************************************************************
        * Usage:
        *       <div data-zu-checklist-group="{cols:3}"
        *           data-disable-expression="!vm.isNewAlbum && !vm.fAlbum.albumId"
        *           data-family-members="vm.cm.families"
        *           data-current-album="vm.cm.currentAlbum">
        *
        * Description:
        *       Displays the family members in multi-column layout
        *      
        * Gotcha(s): 
        * 
        ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: false,
            templateUrl: "/app/services/directives/zuChecklistGroup.html",
            scope: {
                options: "=zuChecklistGroup",
                familyMembers: "=",
                currentAlbum: "=",
                disableExpression: "=",
                showExpiryDays: "=",
                showPassiveLink:"@"
            }
        };
        return directive;

        function link(scope, element, attrs) {
            scope.columnCount = scope.options.cols || 2;

            scope.$watch("currentAlbum", function (newAlbum, oldAlbum) {
                if ((newAlbum && newAlbum.members && newAlbum.members.length)) { //&& !angular.equals(newAlbum, oldAlbum)
                    scope.currentAlbum = newAlbum;
                    markAlbumMembersInFamilies();
                }
            }, true);

            scope.$watch("familyMembers", function (newFamily, oldFamily) {
                if (newFamily) {
                    scope.familyMembers = newFamily;
                }
            }, true);



            scope.toggleSelectionForAllFamilyMembers = function (family) {
                var checkValue = Boolean(!family.isChecked);
                family.isChecked = checkValue;
                _.each(family.members, function (m) {
                    m.isChecked = checkValue;
                    if (m.isChecked === false) {
                        m.expiresInDays = "";
                    }
                });
            }
            scope.toggleSelectionForMember = function (member) {
                if (!scope.disableExpression) {
                    member.isChecked = !member.isChecked;
                    member.expiresInDays = member.isChecked ? member.expiresInDays : "";
                }
            }
            scope.toggleAll = function (state) {
                _.each(scope.familyMembers, function (f) {
                    f.isChecked = state;
                    _.each(f.members, function (m) {
                        m.isChecked = state;
                        m.expiresInDays = state ? m.expiresInDays : "";
                    });
                });
            }
            scope.onExpiryDaysChange = function (member) {
                member.isChecked = Boolean(member.expiresInDays !== "");
            }

            scope.togglePassive=function(member) {
                member.isPassive = !member.isPassive;
            }

            function markAlbumMembersInFamilies() {
                var groupMemberIds = _.pluck(scope.currentAlbum.members, "id");
                _.each(scope.familyMembers, function (family) {
                    _.each(family.members, function (member) {
                        var m = common.findById(scope.currentAlbum.members, "id", member.id);
                        if (m) {
                            member.expiresInDays = m.expiresInDays;
                            member.mostRecentOnly = m.mostRecentOnly;
                            member.isRegular = m.isRegular;
                            member.isPassive = m.isPassive;
                        } 
                        if (member.isAdmin) {
                            member.isChecked = true;
                        } else {
                            var state = _.some(groupMemberIds, function (c) {
                                return Number(c) === Number(member.id);
                            });
                            member.isChecked = state;
                        }
                    });
                });
            }

        }
    }

})();

