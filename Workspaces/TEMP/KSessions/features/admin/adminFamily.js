(function () {
    "use strict";
    var controllerId = "adminFamilyCtl";
    angular.module("app").controller(controllerId,
        ["$document", "$scope", "common", "bootstrap.dialog", "config", "contentManager", "datacontext", adminFamilyCtl]);

    function adminFamilyCtl($document, $scope, common, dlg, config, contentManager, datacontext) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logSuccess = getLogFn(controllerId, "success");
        var logError = getLogFn(controllerId, "error");

        $scope.vm = {};
        var vm = $scope.vm;
        var timeout = common.$timeout;

        vm.memberList = [];
        vm.countries = [];
        vm.cm = contentManager;
        vm.viewReady = false;
        vm.filterMembers = "";

        vm.deleteFamilyMember = deleteFamilyMember;
        vm.displayMemberData = displayMemberData;
        vm.redirectToMemberForm = redirectToMemberForm;
        vm.toggleMemberActiveStatus = toggleMemberActiveStatus;
        vm.toggleHeaderPanel = toggleHeaderPanel;

        vm.mg = {
            MemberList: 1,
            Countries: 2,
            ActiveStatus: 3,
            current: 1,
            setGroup: function (val) {
                this.current = Number(val);
            },
            IsMemberList: function () {
                return this.current === this.MemberList;
            },
            IsCountries: function () {
                return this.current === this.Countries;
            },
            ShowHeaderFlag: function () {
                return this.current === this.Countries;
            }
        };

        activate();

        function activate() {
            var promises = [
                contentManager.getAllFamilyMembers(),
                datacontext.getActiveCountriesList()
            ];
            common.activateController(promises, controllerId)
                .then(onControllerActivation);

            function onControllerActivation(result) {
                vm.viewReady = true;
                vm.countries = result[1].data;
                vm.memberList = contentManager.memberList;
                vm.memberGroup = getMembersGroupedByList();
                log("Activated admin Family View", controllerId, config.showDevToasts);
            }
        };

        function toggleMemberActiveStatus(id, isActive) {
            datacontext.setMemberActivation(id, isActive).then(function (response) {
                common.findById(vm.cm.memberList, "id", id).isActive = isActive;
                logSuccess(response.data + " record updated successfully", controllerId);
            });
        }

        function deleteFamilyMember(parent, child, childIdx) {
            var msg = "Are you sure you want to delete " + child.fullName + "?";
            var childId = child.id;
            dlg.deleteDialog("member", msg, "Yes", "No").then(function (result) {
                if (result === "ok") {
                    vm.cm.deleteFamilyMember(childId).then(function (response) {
                        vm.memberGroup.forEach(function (grp, index, array) {
                            if (grp.entity.id === parent.entity.id) {
                                grp.delete(childId);
                            }
                        });
                        vm.filterMembers = "";
                    });
                }
            });
        }

        function toggleHeaderPanel(idx) {
            if (vm.memberGroup.length === 1) { return; }
            vm.memberGroup.forEach(function (item, index, array) {
                item.isCollapsed = index !== idx;
            });
            common.$timeout(function () {
                var titleElement = angular.element(document.getElementById("header-" + idx));
                $document.scrollToElement(titleElement, 10, 350);
            }, 1000);
        }

        function displayMemberData(item) {
            vm.filterMembers = "";

            switch (item) {
                case vm.mg.MemberList:
                    vm.memberGroup = getMembersGroupedByList();
                    break;
                case vm.mg.Countries:
                    vm.memberGroup = getMembersGroupedByCountries();
                    break;
                case vm.mg.ActiveStatus:
                    vm.memberGroup = getMembersGroupedByActiveStatus();
                    break;
            }
            vm.mg.setGroup(item);
        }

        function redirectToMemberForm(member) {
            $scope.stateGo("admin.memberForm", { memberId: member });
        }

        function getMembersGroupedByCountries() {
            var list = angular.copy(vm.memberList);
            var familyGroup = _.groupBy(list, "countryName");
            var data = [];
            var i = 0;
            var countries = angular.copy(vm.cm.countries);
            _.each(familyGroup, function (value, key, list) {
                var country = common.findByKey(countries, "countryName", key);
                var item = createItemGroup(i, country.id, key, country.isO2, value, true);
                data.push(item);
                i++;
            });
            vm.mg.setGroup(2);
            return data;
        }

        function getMembersGroupedByActiveStatus() {
            var list = angular.copy(vm.memberList);
            var statusGroup = _.groupBy(list, "isActive");
            var data = [];
            var i = 0;
            _.each(statusGroup, function (value, key, list) {
                key = (key === "true");
                var statusId = key ? 1 : 0;
                var groupName = key ? "Active" : "Inactive";
                var icon = key ? "toggle-on" : "toggle-off";
                var isCollapsed = !key;
                var item = createItemGroup(i, statusId, groupName, icon, value, isCollapsed);
                data.push(item);
                i++;
            });
            vm.mg.setGroup(2);
            return data;
        }

        function getMembersGroupedByList() {
            var result = [];
            var list = angular.copy(vm.memberList);
            var item = createItemGroup(0, 0, "Member List", "fa-users", list, false);
            result.push(item);
            vm.mg.setGroup(1);
            return result;
        }

        function createItemGroup(i, groupId, groupValue, icon, list, isCollapsed) {
            return {
                idx: i,
                entity: {
                    id: groupId,
                    name: groupValue,
                    icon: icon
                },
                children: list,
                isCollapsed: isCollapsed,
                delete: function (id) {
                    this.children = _.without(this.children,
                        _.findWhere(this.children, { id: id }));
                }
            };
        }
    }
})();