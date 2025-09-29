(function () {
    "use strict";

    angular.module("app").directive("zuHubVote", ["common", "hubService", zuHubVote]);

    function zuHubVote(common, hubService) {

        /***************************************************************************************
        * Usage:
        *      
        * Description:
        *      
        * Gotcha(s): 
        *      
        * 
        ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: true,
            templateUrl: "/app/features/hub/directives/zuHubVote.html",
            scope: {
                options: "=zuHubVote"
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            scope.hub = hubService;
            scope.preloaderVotes = hubService.host.preloader.votes || [];
            scope.fClientVoteResult = {
                up: 0,
                down: 0
            }

            function activate() {
                scope.fVoter = newVoteObject();
                scope.activeClientVote = null;
                scope.addVoteToPreloader({
                    voteCaption: "Should I continue the session?",
                    upCountCaption: "Yes",
                    downCountCaption: "No"
                });
            }

            function newVoteObject() {
                return {
                    voteAgenda: "",
                    upCountCaption: "",
                    downCountCaption: ""
                };
            }

            scope.activateVote = function (vote) {
                scope.activeClientVote = vote;
                hubService.pushToClientVoteAgenda(vote);
            }
            scope.addVoteToPreloader = function (vote) {
                scope.preloaderVotes.push(angular.copy(vote));
                scope.fVoter = newVoteObject();
            }



            activate();



        }
    }

})();

