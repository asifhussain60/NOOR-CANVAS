(function () { 
    'use strict';
    
    var controllerId = 'sidebar';
    angular.module('app').controller(controllerId,
        ['$scope', 'config', 'states', sidebar]);

    function sidebar($scope, config, states) {
        var vm = this;

        vm.isCurrent = isCurrent;

        activate();

        function activate() { getNavRoutes(); }
        
        function getNavRoutes() {
            vm.navRoutes = states.filter(function (s) {
                return s.config.data.settings && s.config.data.settings.nav;
            }).sort(function (s1, s2) {
                return s1.config.data.settings.nav - s2.config.data.settings.nav;
            });
        }
        
        function isCurrent(state) {
            if (!state.config.data.title || !$scope.$state.current || !$scope.$state.current.data.title) {
                return '';
            }
            var menuName = state.config.data.title;
            return $scope.$state.current.data.title.substr(0, menuName.length) === menuName ? 'current' : '';
        }
    };
})();
