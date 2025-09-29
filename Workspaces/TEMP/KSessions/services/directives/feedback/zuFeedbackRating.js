(function () {
    "use strict";

    angular.module("app").directive("zuFeedbackRating", ["common", "froalaConfig", zuFeedbackRating]);

    function zuFeedbackRating(common, froalaConfig) {

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
            templateUrl: "/app/services/directives/feedback/zuFeedbackRating.html",
            scope: {
                feedback: "=zuFeedbackRating"
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {

            scope.froalaOptions = froalaConfig.fEditorSimpleOptions(function (e, editor) {
                editor.opts.placeholderText = "";
                editor.opts.multiLine = false;
            });

            scope.ratingSelection = function (rating, idx) {
                _.each(scope.feedback.ratings, function (r, pos) {
                    r.isSelected = (pos === idx);
                    r.isRatingLow = false;
                });
                rating.isRatingLow = rating.weight < 3;
                scope.feedback.userResponse = rating.weight;
                scope.feedback.userResponseDisplay = rating.display;
            }
            scope.isNumericRating = function (feedbackTypeId) {
                return feedbackTypeId === 1 ? "display-inline" : null;
            }
            scope.isSelected = function (r) {
                var ngclass = "btn-u-feedback-selected-";
                switch (r.weight) {
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
                return Boolean(r.isSelected) ? ngclass : null;
            }
        }
    }

})();

