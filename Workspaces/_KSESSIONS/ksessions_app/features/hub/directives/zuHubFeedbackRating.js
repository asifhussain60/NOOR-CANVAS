(function () {
    "use strict";

    angular.module("app").directive("zuHubFeedbackRating", ["common", "froalaConfig", zuHubFeedbackRating]);

    function zuHubFeedbackRating(common, froalaConfig) {

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
            templateUrl: "/app/features/hub/directives/zuHubFeedbackRating.html",
            scope: {
                feedback: "=zuHubFeedbackRating"
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {

            scope.froalaOptions = froalaConfig.fEditorSimpleOptions(function (e, editor) {
                editor.opts.placeholderText = "";
                editor.opts.multiLine = false;
            });

            scope.ratingSelection = function (rating, idx) {
                _.each(scope.feedback.Ratings, function (r, pos) {
                    r.IsSelected = (pos === idx);
                    r.IsRatingLow = false;
                });
                rating.IsRatingLow = rating.Weight < 3;
                scope.feedback.UserResponse = rating.Weight;
            }
            scope.isNumericRating = function (feedbackTypeId) {
                return feedbackTypeId === 1 ? "display-inline" : null;
            }
            scope.isSelected = function (r) {
                var ngclass = "btn-u-feedback-selected-";
                switch (r.Weight) {
                case 5:
                case 4:
                    ngclass += "high";
                    break;
                case 1:
                    case 2:
                        ngclass += "low";
                    break;
                case 3:
                    ngclass += "medium";
                    break;
                default:
                }
                return Boolean(r.IsSelected) ? ngclass : null;
            }
        }
    }

})();

