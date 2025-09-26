(function () {
    "use strict";

    //#region Utility Object */

    var utility = {};
    utility.isFunctionalKey = function (event) {
        return ((event.keyCode >= 37 && event.keyCode <= 40)
            || (event.keyCode === 13) //Enter
            || (event.keyCode === 8) //backspace
            || (event.keyCode === 9) //Tab
            || (event.ctrlKey && event.keyCode === 86) //Ctrl + V
            || (event.ctrlKey && event.keyCode === 65) //Ctrl + A
            || (event.ctrlKey && event.keyCode === 67) //Ctrl + C
            || (event.shiftKey && event.keyCode === 36) //Shift + Home
            || (event.shiftKey && event.keyCode === 35) //Shift + End
            || (event.keyCode === 36) //Home
            || (event.keyCode === 35) //End
        );
    };

    utility.isNumericKeyCode = function (keyCode) {
        return (keyCode >= 46 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105);
    };

    utility.isHyphenKeyCode = function (keyCode) {
        return (keyCode === 109 || keyCode === 189);
    };

    utility.isAlphaKeyCode = function (keyCode) {
        return (keyCode >= 65 && keyCode <= 90);
    };
    utility.isSpaceKeyCode = function (keyCode) {
        return (keyCode === 32);
    };

    utility.isForwardSlashKeyCode = function (keyCode) {
        return (event.keyCode === 191 || event.keyCode === 111);
    };
    utility.isPeriodKeyCode = function (keyCode) {
        return (event.keyCode === 190 || event.keyCode === 110);
    };
    utility.isNavigationKeycode = function (keyCode) {
        switch (keyCode) {
            case 8: //backspace
            case 9: // tab
            case 35: //end
            case 36: //home
            case 37: //left
            case 38: //up
            case 39: //right
            case 40: //down
            case 45: //ins
            case 46: //del
                return true;
            default:
                return false;
        }
    };
    utility.isTextSelected = function () {
        return window.getSelection().type == "Range";
    };
    utility.valueExceedsMaxLength = function (e, maxLength) {
        return maxLength && e[0].value.length > maxLength - 1;
    };

    //#endregion */

    var commonModule = angular.module("common.directives", []);

    angular.module("common.directives").directive("zuDisableEnterKey", zuDisableEnterKey);
    function zuDisableEnterKey() {
        /***************************************************************************************
         * Usage:
         *      data-zu-disable-enter-key=""
         *
         * Description:
         *      Does not allow enter key to be pressed
         *
         * Gotcha(s):
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A"
        };
        return directive;

        function link(scope, element, attrs, controller) {
            element.on("keypress", function (event) {
                if (event.keyCode == 10 || event.keyCode == 13) {
                    event.preventDefault();
                    return false;
                }
                return true;
            });
        }
    }

    angular.module("common.directives").directive("fileModel", ["$parse", function ($parse) {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;

                element.bind("change", function () {
                    scope.$apply(function () {
                        var files = element[0].files;
                        modelSetter(scope, files);
                        
                        // Trigger the onImageSelected function if it exists in the scope
                        if (scope.vm && scope.vm.onImageSelected && typeof scope.vm.onImageSelected === 'function') {
                            scope.vm.onImageSelected(files);
                        }
                    });
                });
            }
        };
    }]);

    angular.module("common.directives").directive("zuForceNaturalNumber", zuForceNaturalNumber);
    function zuForceNaturalNumber() {
        /***************************************************************************************
         * Usage:
         *      <div data-zu-force-natural-number="{maxLength:x, allowZero:false, updateOnBlur:true}"> </div>
         *
         * Description:
         *      Only allows digits and functional keys. Does not allow period
         *      You can provide the maxLength as the attribute value
         *      If updateOnBlur is specified it will change the 0 or blank value to 1
         *
         * Gotcha(s):
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: false,
            require: "ngModel"
        };
        return directive;

        function link(scope, element, attrs, ngModel) {
            var options = scope.$eval(attrs["zuForceNaturalNumber"]);
            var maxLength = options.maxLength;
            var allowZero = options.allowZero || false;
            var updateOnBlur = options.updateOnBlur;

            element.on("keydown", function (event) {
                if (utility.isFunctionalKey(event)) { return true; }
                if (maxLength && !utility.isTextSelected() && utility.valueExceedsMaxLength(element, maxLength)) { return false; }
                return (utility.isNumericKeyCode(event.keyCode));
            });
            element.on("keyup", function (event) {
                if (allowZero) { return true; }
                if ((!element[0].value || element[0].value == "" || element[0].value == "0")
                    && (event.keyCode == 48 || event.keyCode == 96 || event.keyCode == 8 || event.keyCode == 46)) {
                    scope.$apply(function () {
                        element[0].value = "";
                    });
                }
            });
            element.on("blur", function (event) {
                if (updateOnBlur) {
                    if (allowZero) { return true; }
                    if (!element[0].value || element[0].value == "" || element[0].value == "0") {
                        element[0].value = "1";
                        ngModel.$setViewValue("1");
                        ngModel.$render();
                    }
                }
            });
        }
    }

    angular.module("common.directives").directive("zuForceTelephone", ["common", zuForceTelephone]);
    function zuForceTelephone(common) {
        /***************************************************************************************
         * Usage:
         *      <div data-zu-force-telephone=""> </div>
         *
         * Description:
         *      Only allows digits and functional keys. Does not allow period
         *      You can provide the maxLength as the attribute value
         *
         * Gotcha(s):
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: false,
            require: "ngModel"
        };
        return directive;

        function link(scope, element, attrs, controller) {
            var maxLength = 10;
            element.on("keydown", function (event) {
                if (utility.isFunctionalKey(event)) { return true; }
                if (!utility.isTextSelected() && utility.valueExceedsMaxLength(element, maxLength)) { return false; }
                return (utility.isNumericKeyCode(event.keyCode));
            });
            element.on("blur", function (event) {
                if (element[0].value && element[0].value.length == maxLength) {
                    scope.$apply(function () {
                        var val = scope.$eval(attrs["ngModel"]);
                        val = val.replace(/(\d\d\d)(\d\d\d)(\d\d\d\d)/, "($1)$2-$3");
                        element[0].value = val;
                    });
                }
            });
        }
    }

    angular.module("app").directive("zuFlag", ["common", zuFlag]);

    function zuFlag(common) {
        /***************************************************************************************
         * Usage:
         *      <span data-zu-flag="child.isO2" zu-size="medium"></span>
         * Description:
         *      Displays country flag
         * Gotcha(s):
         *
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: true,
            template: "<img class=\"flag-icon-background flag-icon flag-{{flagSize}}\"  " +
                "src =\"https://resources.kashkole.com/Images/flags/large/{{flagCode}}.svg\">",
            scope: true
        };
        return directive;

        function link(scope, element, attrs, controller) {
            scope.flagCode = scope.$eval(attrs["zuFlag"]);
            scope.flagSize = attrs["zuSize"];
        }
    }

    angular.module("app").directive("zuGender", zuGender);

    function zuGender() {
        /***************************************************************************************
         * Usage:
         *      <span data-zu-gender="child.gender" zu-size="2"></span>
         *
         * Description:
         *      Display the modern user avatar icon with gender indication
         * Gotcha(s):
         *      None
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: true,
            scope: true,
            template: "<i class=\"fas fa-{{fontSize}}x fa-{{genderText}} modern-gender-icon\"></i>"
        };
        return directive;

        function link(scope, element, attrs, controller) {
            var gender = scope.$eval(attrs["zuGender"]);
            scope.fontSize = attrs["zuSize"] || "1";
            scope.genderText = "user"; // Simple user icon for all
        }
    }

    angular.module("app").directive("zuToggle", ["common", zuToggle]);

    function zuToggle(common) {
        /***************************************************************************************
         * Usage:
         *          <span data-zu-toggle=""
         *                data-toggle="child.isActive"
         *                data-id="child.id"
         *                data-on-toggle-click="vm.toggleMemberActiveStatus"
         *                zu-size="2"></span>
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
            template: "<span>" +
                "<i class=\"pointer fas fa-{{toggleSize}}x fa-toggle-{{toggleText}}\"" +
                "data-ng-click=\"toggleValue()\"></i>" +
                "<span class=\"zu-toggle\" data-ng-if=\"caption\">{{caption}}</span>" +
                "</span>",
            scope: {
                toggle: "=",
                id: "=",
                onToggleClick: "=",
                caption: "@"
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            scope.toggleSize = attrs["zuSize"] || "1";
            scope.toggle = Boolean(scope.toggle);
            scope.toggleText = scope.toggle ? "on" : "off";
            scope.caption = scope.caption || "";
            scope.toggleValue = function () {
                scope.toggle = !scope.toggle;
            }
            scope.$watch("toggle",
                function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        scope.toggleText = newValue ? "on" : "off";
                        if (scope.onToggleClick) {
                            scope.onToggleClick(scope.id, newValue);
                        }
                    }
                },
                false);
        }
    }

    angular.module("common.directives").directive("zuDisablePaste", contenteditable);
    function contenteditable() {
        /***************************************************************************************
         * Usage:
         *      <div data-zu-disable-paste=""> </div>
         *
         * Description:
         *      Only allows digits and functional keys. Does not allow period
         *      You can provide the maxLength as the attribute value
         *
         * Gotcha(s):
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A"
        };
        return directive;

        function link(scope, element, attrs, controller) {
            element.on("paste", function (event) {
                event.preventDefault();
            });
        }
    }

    angular.module("common.directives").directive("contenteditable", function () {
        return {
            restrict: "A",
            require: "ngModel",
            link: function (scope, element, attrs, ngModel) {
                function read() {
                    ngModel.$setViewValue(element.html());
                }

                ngModel.$render = function () {
                    element.html(ngModel.$viewValue || "");
                };

                element.bind("blur keyup change", function () {
                    scope.$apply(read);
                });
            }
        };
    });

    angular.module("common.directives").directive("zuRating", zuRating);
    function zuRating() {
        /***************************************************************************************
         * Usage:
         *      <div data-zu-disable-paste=""> </div>
         *
         * Description:
         *      Only allows digits and functional keys. Does not allow period
         *      You can provide the maxLength as the attribute value
         *
         * Gotcha(s):
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            template: "<span class='rating-stars' " +
                "uib-rating ng-model=\"rate\" " +
                "max=\"max\" " +
                "read-only=\"isReadonly\" " +
                "on-hover=\"hoveringOver(value)\" " +
                "on-leave=\"overStar = null\" " +
                "aria-labelledby=\"default-rating\">" +
                "</span>&nbsp;" +
                "<button class=\"btn btn-sm btn-danger\" style=\"position:relative;top:-10px\" " +
                "data-ng-click=\"rate = 0\" " +
                "data-ng-disabled=\"isReadonly\">" +
                "<i class=\"fa fa-refresh\" aria-hidden=\"true\"></i>" +
                "</button>",
            scope: {
                max: "@",
                isReadonly: "=",
                rate: "="
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            scope.overStar = null;
            scope.max = Number(scope.max);
            scope.isReadonly = Boolean(scope.isReadonly);
            scope.rate = Number(scope.rate);

            scope.hoveringOver = function (value) {
                scope.overStar = value;
                scope.percent = 100 * (value / scope.max);
            };
        }
    }

    angular.module("common.directives").directive("zuOnEscapeKey", zuOnEscapeKey);
    function zuOnEscapeKey() {
        /***************************************************************************************
         * Usage:
         *                    <input type="text" data-zu-on-escape-key="" data-ng-model="vm.model" />
         *
         * Description:
         *      Clears the value of the text field on esc key
         *
         * Gotcha(s):
         *      Must have ng-model defined on input
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            require: "?ngModel"
        };
        return directive;
        function link(scope, element, attrs, controller) {
            element.on("keydown", function (ev) {
                if (ev.keyCode != 27) return;

                scope.$apply(function () {
                    controller.$setViewValue("");
                    controller.$render();
                });
            });
        };
    }

    angular.module("common.directives").directive("zuCalendar", zuCalendar);
    function zuCalendar() {
        /***************************************************************************************
         * Usage:
         *      <div data-zu-calendar=""
         *          class="text-center"
         *          data-ng-class="{ 'pull-right':!vm.isMobileBrowser }"
         *          data-display-date= "vm.currentSession.sessionDate"
         *          data-text-mode="vm.isMobileBrowser"
         *          data-caption="Delivered On"></div>
         *
         * Description:
         *      Displays date in the form of a calendar
         *
         * Gotcha(s):
         *      Need to include the following CSS
         *           time.icon * {display: block;width: 100%;font-size: 0.9em;font-weight: bold;font-style: normal;text-align: center;}
         *           time.icon strong {position: absolute;top: 0;padding: 0.4em 0;color: #fff;background-color: #4e2f63;border-bottom: 2px solid black;}
         *           time.icon em {position: absolute;bottom: 0.3em;color: #2c3e50;}
         *           time.icon span {font-size: 2.2em;letter-spacing: -0.05em;padding-top: 1.2em;color: #63289e;}
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            scope: {
                displayDate: "=",
                caption: "@",
                textMode: "="
            },
            template: "<div data-ng-if=\"!textMode\">" +
                "<span class=\"small text-bold\" data-ng-if=\"caption\">{{caption}}</span>" +
                "<time datetime=\"{{displayDate}}\" class=\"icon\">" +
                "<em>{{dayOfWeek}}</em>" +
                "<strong>{{monthName}}</strong>" +
                "<span>{{dayNumber}}</span>" +
                "</time>" +
                "</div>" +
                "<div data-ng-if=\"textMode\">" +
                "<span data-ng-if=\"caption\" class=\"calendar-label\">{{caption}}:</span><span class=\"calendar-date\">{{formattedDate}}</span>" +
                "</div>"
        };
        return directive;

        function link(scope, element, attrs, controller) {
            scope.$watch("displayDate", function (newValue, oldValue) {
                if (newValue) {
                    if (scope.textMode) {
                        scope.formattedDate = moment(scope.displayDate).format("dddd, MMMM Do, YYYY");
                    } else {
                        scope.monthName = moment(scope.displayDate).format("MMM YYYY");
                        scope.dayNumber = moment(scope.displayDate).format("D");
                        scope.dayOfWeek = moment(scope.displayDate).format("dddd");
                    }
                }
            }, false);
        }
    }

    angular.module("common.directives").directive("zuValidityGlyphs", ["common", zuValidityGlyphs]);
    function zuValidityGlyphs(common) {
        /***************************************************************************************
        * Usage:
        *   <span data-zu-validity-glyphs="vm.gly.flags"></span>
        *
        * Description:
        *   Create an object gly.flags (for example) on the model with these properties
        *       { valid: false, invalid: false, processing: false }
        *   Setting the appropriate boolean flag with hide/display the glyph
        *
        * Gotcha(s):
        *   If multiple controls on the same view are using this directive, then create
        *   a separate set of objects for each
        *       vm.gly = {
        *           oldPwd: { valid: false, invalid: false, processing: false },
        *           newPwd: { valid: false, invalid: false, processing: false },
        *           cofPwd: { valid: false, invalid: false, processing: false }
        *       };
        *
        ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: true,
            template: "<span style=\"display:inline-block;\"><i class=\"fa fa-spinner fa-spin\" data-ng-show=\"flags.processing\"></i>" +
                "<i class=\"fa fa-check\" style=\"color: green\" data-ng-show=\"flags.valid\"></i>" +
                "<i class=\"fa fa-times\" style=\"color: red\" data-ng-show=\"flags.invalid\"></i><span>",
            scope: {
                flags: "=zuValidityGlyphs"
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            scope.$watch("flags.valid", function (newValue, oldValue) {
                if (newValue && !angular.equals(newValue, oldValue)) {
                    scope.flags.invalid = false;
                    scope.flags.processing = false;
                }
            }, false);
            scope.$watch("flags.invalid", function (newValue, oldValue) {
                if (newValue && !angular.equals(newValue, oldValue)) {
                    scope.flags.valid = false;
                    scope.flags.processing = false;
                }
            }, false);
            scope.$watch("flags.processing", function (newValue, oldValue) {
                if (newValue && !angular.equals(newValue, oldValue)) {
                    scope.flags.invalid = false;
                    scope.flags.valid = false;
                }
            }, false);
        }
    }

    //angular.module('common.directives').directive('zuExternalPredicateValidator', ['datacontext', zuExternalPredicateValidator]);
    //function zuExternalPredicateValidator(datacontext) {
    //    /***************************************************************************************
    //     * Usage:
    //     *      data-zu-webapi-validator="{id: [a], validDlgt: [b], triggerDlgt:  [c] }"
    //     *          [a] = An Id (or object of Ids) if required by the validDlgt delegate
    //     *          [b] = The delegate that will return ("true"|"false") as a promise
    //     *          [c] = the trigger delegate that must evaluate to bool. If it is true, the
    //     *                  the validDlgt [b] will be fired
    //     * Description:
    //     *      This delegate should be used whenever uniquness of data needs to be validated
    //     *      against a store such as database. Makes the call on input.blur()
    //     *      Sets 2 properties on the input.$error collection
    //     *          $error.tokenUnique:
    //     *              = true, if the specified token is NOT unique
    //     *              = false, if the specified token is unique
    //     *          $error.tokenTriggerResult: result of triggerDlgt
    //     *
    //     * Gotcha(s):
    //     *      only works if input.$valid == true
    //     *
    //     ***************************************************************************************/

    //    var directive = {
    //        link: link,
    //        restrict: 'A',
    //        replace: true,
    //        require: 'ng-model',
    //        scope: {
    //            options: '=zuExternalPredicateValidator',
    //            model: '=ngModel'
    //        }
    //    };
    //    return directive;

    //    function link(scope, element, attrs, controller) {
    //        element.bind('blur', function (event) {
    //            validateControl();
    //        });

    //        function validateControl() {
    //            if (controller.$error.required) { return false; }

    //            var trigger = scope.options.triggerDlgt(controller.$name);
    //            if (!trigger) {
    //                controller.$setValidity("tokenUnique", true);
    //                controller.$setValidity("tokenTriggerResult", true);
    //                scope.$apply();
    //                return true;
    //            } else {
    //                controller.$setValidity("tokenTriggerResult", trigger);
    //                scope.options.validDlgt(scope.options.id, scope.model).then(function (result) {
    //                    var isValid = result.data === false;
    //                    controller.$setValidity("tokenUnique", isValid);
    //                });
    //            }
    //        }
    //    }
    //}

    angular.module("common.directives").directive("zuForceCurrency", ["common", zuForceCurrency]);

    function zuForceCurrency(common) {
        /***************************************************************************************
         * Usage:
         *      data-zu-force-currency="5"
         *
         * Description:
         *      Will round the value and add fractions to natrual numbers if necessary
         *          35 becomes 35.00
         *          22.4 becomes 22.40
         *          23.897 becomes 23.90
         *      You can provide the maxLength (including fractions) as the attribute value.
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: false,
            require: "ngModel"
        };
        return directive;

        function link(scope, element, attrs, ngModel) {
            var maxLength = scope.$eval(attrs["zuForceCurrency"]);

            element.on("keydown", function (event) {
                if (utility.isFunctionalKey(event)) { return true; }
                if (!utility.isTextSelected() && utility.valueExceedsMaxLength(element, maxLength)) { return false; }

                return (utility.isNumericKeyCode(event.keyCode)
                    || utility.isPeriodKeyCode(event.keyCode)
                    || utility.isNavigationKeycode(event.keyCode));
            });

            element.on("keyup", (function (event) {
                if (!utility.isTextSelected() && utility.valueExceedsMaxLength(element, maxLength)) { return false; }
                if (utility.isFunctionalKey(event) || utility.isTextSelected()) { return true; }
                //remember cursor position
                var start = this.selectionStart,
                    end = this.selectionEnd;
                var userValue = scope.$eval(attrs["ngModel"]);
                var fixedValue = common.fix2Decimals(userValue);
                scope.$apply(function () {
                    element[0].value = fixedValue;
                });
                //restore cursor position
                this.setSelectionRange(start, end);
                return true;
            }));

            element.on("blur", function (event) {
                scope.$apply(function () {
                    //update ngModel with a numeric value to facilitate
                    //calculations down the line
                    if (element[0].value) {
                        var value = Number(element[0].value).toFixed(2);
                        element[0].value = value;
                        ngModel.$setViewValue(value);
                    }
                });
            });
        }
    }

    angular.module("common.directives").directive("zuActivateSession", ["bootstrap.dialog", "common", "datacontext", zuActivateSession]);

    function zuActivateSession(dlg, common, datacontext) {
        /***************************************************************************************
         * Usage:
         *      data-zu-force-alphabet="10"
         *
         * Description:
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            scope: {
                session: "=",
                isSessionActive: "=",
                notificationMsg: "@"
            },
            template:
                "<div>" +
                "<div data-ng-if='isSessionActive' class='alert alert-danger text-center'>" +
                "<h4>This session is currently active</h4>" +
                "<button class='btn btn-danger margin-top20' " +
                "data-ng-click='activateSession(false)'>" +
                "Deactivate Session" +
                "</button>" +
                "</div>" +

                "<div data-ng-if='!isSessionActive' class='alert alert-success' role='alert'>" +
                "<h4>Inactive Session</h4>" +
                "<div class='margin-bottom-15'>This session is not active which means that users will not be able to view it.</div>" +
                "<div class='margin-bottom-10'>" +
                "<input type='checkbox' data-ng-model='shouldSendEmail' data-ng-click='sendEmailClick()' /> {{notificationMsg}}" +
                "</div>" +
                "<div class='margin-bottom-15'>" +
                "<button class='btn btn-success margin-top20' " +
                "data-ng-disabled='!session.mediaPath' " +
                "data-ng-click='activateSession(true)'>" +
                "Activate Session" +
                "</button>" +
                "<div data-ng-if='!session.mediaPath'>" +
                "An audio file has not been uploaded for this session!" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</div>"
        };
        return directive;

        function link(scope, element, attrs, controller) {
            var getLogFn = common.logger.getLogFn;
            var logSuccess = getLogFn("adminSessionCtl", "success");
            scope.shouldSendEmail = scope.isSessionActive ? false : true;

            scope.sendEmailClick = function () {
                scope.shouldSendEmail = !scope.shouldSendEmail;
            };

            function getDialogMessage(makeActive) {
                return makeActive ? "activate" : "deactivate";
            }

            scope.activateSession = function (makeActive) {
                var isSendEmail = scope.shouldSendEmail; //closure

                var msg = "Are you sure you want to " + getDialogMessage(makeActive) + " this session?"
                dlg.deleteDialog("", msg).then(function (response) {
                    if (response === "ok") {
                        scope.isSessionActive = makeActive;
                        return datacontext.activateSession(scope.session.id, makeActive)
                            .then(notifyUsers);

                        function notifyUsers(response) {
                            logSuccess("Session has been activated");
                            if (!isSendEmail || !makeActive) {
                                return null;
                            }
                            if (response.data) {
                                return datacontext.notifyUsersOfSessionUpload(scope.session.id).then(function (notifyResponse) {
                                    logSuccess("Session Users have been notified for session [" +
                                        scope.session.id +
                                        "] - " +
                                        notifyResponse.data +
                                        " emails sent out");
                                });
                            }
                        }
                    }
                });
            }
        }
    }

    angular.module("common.directives").directive("zuBreadcrumbBar", zuBreadcrumbBar);

    function zuBreadcrumbBar() {
        /***************************************************************************************
         * Usage:
         *      <div data-zu-breadcrumb-bar=""
         *              data-ng-click="vm.returnToAlbumView()"
         *              data-label="Back To Album"
         *              data-border-position="top"></div>
         *
         * Description:
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            scope: { label: "@", borderPosition: "@" },
            replace: true,
            template: "<div class='album-breadcrumb' " +
                "data-ng-class='setBorder()' >" +
                "<a class='returnLink' href=''> " +
                "<i class='fa fa-arrow-left' aria-hidden='true'></i> " +
                "{{label}}" +
                "</a>" +
                "</div>"
        };
        return directive;

        function link(scope, element, attrs, controller) {
            scope.setBorder = function () {
                if (scope.borderPosition === "top") {
                    return "album-breadcrumb-top-border";
                } else if (scope.borderPosition === "bottom") {
                    return "album-breadcrumb-bottom-border";
                }
            }
        }
    }

    angular.module("common.directives").directive("zuUploadFile", ["bootstrap.dialog", "common", "datacontext", "fileUpload", zuUploadFile]);

    function zuUploadFile(dlg, common, datacontext, fileUpload) {
        /***************************************************************************************
         * Usage:
                <div data-zu-upload-file=""
                        data-file-type=".mp3"
                        data-entity-id="{{vm.fSession.sessionId}}"
                        data-caption="Upload Audio File"
                        data-icon="file-audio-o"
                        data-display-file-guid="false"
                        data-filename="vm.fSession.mediaPath"
                        data-delegate-success="vm.fileUploadSuccess"></div>
         *
         * Description:
         *      entityId = the id that will be appended to the upload and delete Uri
         *      filename = the file on vm that contains the mediaPath
         *      delegateSuccess = function called once the file has been SUCCESSFULLY uploaded
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            //require: "ngModel",
            scope: {
                fileType: "@",
                entityId: "@",
                caption: "@",
                icon: "@",
                filename: "=",
                displayFileGuid: "=",
                delegateSuccess: "=",
                delegateDelete: "="
            },
            replace: true,
            template: "<div style='display:inline-block;width:100%;text-align:center;' >" +
                "<input type=\"file\" id=\"imageUpload\" " +
                "accept=\"{{fileType}}\" data-file-model=\"uploadField\"  " +
                "style=\"display: none;\" /> " +

                "<button class=\"btn btn-u btn-u-blue\" " +
                "data-ng-if=\"!filename\"" +
                "data-ng-click=\"uploadFile()\"> " +
                "<i class=\"fa fa-{{icon}} fa-lg\" data-ng-show='!uploadInProgress'></i>" +
                "<i class=\"fa fa-spinner fa-spin fa-lg fa-fw\" data-ng-show='uploadInProgress'></i> " +
                "&nbsp;{{caption}}" +
                "</button>" +

                "<a href='' class=\"margin-left-10 btn btn-u btn-u-red\" " +
                "data-ng-if=\"filename\" " +
                "data-ng-click=\"deleteFile()\">" +
                "<i class='far fa-trash-alt'></i> Delete Media File" +
                "</a>" +

                "<div class='uploadfile-name' data-ng-if='filename && displayFileGuid'>" +
                "<span>{{filename}}</span>" +
                "</div>" +
                "</div>"
        };
        return directive;

        function link(scope, element, attrs, controller) {
            scope.uploadField = null;
            scope.uploadInProgress = false;
            //scope.displayFileGuid = scope.displayFileGuid === "true";
            
            var getLogFn = common.logger.getLogFn;
            var logError = getLogFn("zuUploadFile Directive", "error");
            var logInfo = getLogFn("zuUploadFile Directive", "info");

            scope.uploadFile = function () {
                scope.uploadInProgress = true;
                $("#imageUpload").click();
            };

            scope.deleteFile = function () {
                dlg.deleteDialog("Audio File", "").then(function (response) {
                    if (response !== "ok") {
                        logError("Could not delete the file from the server", "zuUploadFile Directive");
                        return null;
                    }
                    return datacontext.removeMediaFileForSession(scope.entityId, scope.filename)
                        .then(function (response) {
                            resetFileName();
                            if (scope.delegateDelete) { scope.delegateDelete(); }
                        });
                });
            }

            function resetFileName() {
                scope.filename = "";
                scope.uploadField = null;
            }

            scope.$watch("uploadField", function (newFile, oldFile) {
                if (newFile && !angular.equals(newFile, oldFile)) {
                    logInfo("File upload started for entity: " + scope.entityId);
                    
                    return fileUpload.uploadAudioFile(newFile, scope.entityId)
                        .then(function (response) {
                            scope.filename = response.data.link;
                            scope.uploadInProgress = false;
                            logInfo("File uploaded successfully: " + response.data.link);
                            
                            if (!scope.delegateSuccess) { 
                                return; 
                            }
                            
                            scope.delegateSuccess(response);
                        }, function (response) {
                            scope.uploadInProgress = false;
                            
                            if (response.status === 404) {
                                logError("File size may be too large to upload. Please use FTP to upload this file.", "zuUploadFile Directive");
                            } else if (response.status === 500) {
                                logError("Internal server error during file upload. Status: " + response.status + ", Message: " + (response.data || response.statusText), "zuUploadFile Directive");
                            } else {
                                logError("File upload failed. Status: " + response.status + ", Message: " + (response.data || response.statusText), "zuUploadFile Directive");
                            }
                        });
                }
            }, false);
        }
    }

    angular.module("common.directives").directive("zuOnEnter", zuOnEnter);

    function zuOnEnter() {
        /***************************************************************************************
         * Usage:
         *      data-zu-force-alphabet="10"
         *
         * Description:
         *      Restricts keypress to alphabet characters A-Z and a-z
         *      You can provide the maxLength as the attribute value
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: true
        };
        return directive;

        function link(scope, element, attrs, controller) {
            element.bind("keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.zuOnEnter);
                    });
                    event.preventDefault();
                }
            });
        }
    }

    angular.module("common.directives").directive("zuForceAlphabet", zuForceAlphabet);

    function zuForceAlphabet() {
        /***************************************************************************************
         * Usage:
         *      data-zu-force-alphabet="10"
         *
         * Description:
         *      Restricts keypress to alphabet characters A-Z and a-z
         *      You can provide the maxLength as the attribute value
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: false
        };
        return directive;

        function link(scope, element, attrs, controller) {
            var maxLength = scope.$eval(attrs["zuForceAlphabet"]);
            element.on("keydown", function (event) {
                if (utility.isFunctionalKey(event)) { return true; }
                if (!utility.isTextSelected() && utility.valueExceedsMaxLength(element, maxLength)) {
                    return false;
                } else {
                    return (utility.isAlphaKeyCode(event.keyCode) || utility.isHyphenKeyCode(event.keyCode) || utility.isSpaceKeyCode(event.keyCode));
                }
            });
        }
    }

    angular.module("common.directives").directive("zuTrackFocus", zuTrackFocus);
    function zuTrackFocus() {
        /***************************************************************************************
         * Usage:
         *      data-zu-track-focus=""
         *
         * Description:
         *      Adds an "ng-focused" class to the control if it has the focus
         *      Removes the "ng-focused" class from the control if it loses focus
         *
         *      Sets [form].[input].$focused = true if the control has focus.
         *      Sets [form].[input].$focused = false when control loses focus
         *
         * Gotcha(s):
         *      If ng-required or required is set to true, marks the control as $dirty as
         *      soon as it receives focus.
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            require: "ngModel"
        };
        return directive;
        function link(scope, element, attrs, controller) {
            var focusClass = "ng-focused";
            var attributes = attrs;

            controller.$focused = false;
            element.bind("focus", function (evt) {
                element.addClass(focusClass);
                scope.$apply(function () {
                    controller.$focused = true;
                    if (scope.$eval(attributes.ngRequired) || attributes.required) {
                        controller.$dirty = true;
                    }
                });
            }).bind("blur", function (evt) {
                element.removeClass(focusClass);
                scope.$apply(function () { controller.$focused = false; });
            });
        }
    }

    angular.module("common.directives").directive("zuFlash", zuFlash);

    function zuFlash() {
        /***************************************************************************************
         * Usage:
         *      <div data-zu-flash=""
         *          data-alert-type="info" [error | warning]
         *          data-title=""
         *          data-ng-init="pay.account = { ach: { all: [0] } }"
         *          data-message="You   do not have any existing accounts"
         *          data-show-if-true="pay.account.ach.all"></div>
         *
         * Description:
         *      Flashes a message if the data-eval-object evaluates to false
         *
         * Gotcha(s):
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: false,
            template: "<div class=\"alert alert-{{alertType}}\">\
                            <button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;</button>\
                            <h4 data-ng-show=\"title\">{{title}}!</h4>\
                            {{message}}\
                        </div>",
            scope: {
                alertType: "@",
                message: "@",
                title: "@"
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            if (!scope.alertType) { scope.alertType = "block"; }
        }
    }

    angular.module("common.directives").directive("zuAutofocus", ["$timeout", zuAutofocus]);

    function zuAutofocus($timeout) {
        /***************************************************************************************
         * Usage:
         *      data-zu-autofocus=""
         *
         * Description:
         *      Automatically focuses the control that has this attribute
         *
         * Gotcha(s):
         *      Does not work if a debugger statement exists
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A"
        };
        return directive;

        function link(scope, element, attrs, controller) {
            $timeout(function () {
                element[0].focus();
            });
        }
    }

    angular.module("common.directives").directive("zuFullName", zuFullName);

    function zuFullName() {
        /***************************************************************************************
         * Usage:
         *      <span data-zu-full-name="LF"
         *            data-first-name="admin.firstName"
         *            data-middle-name="admin.middleInitial"
         *            data-last-name="admin.lastName"></span>
         *
         * Description:
         *
         *      zu-full-name = "LF" means LastName, FirstName MiddleInitial
         *      zu-full-name = "FL" means FirstName MiddleInitial LastName
         *
         * Gotcha(s):
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: true,
            template: "<div><span data-ng-if=\"firstLast\">{{firstName}}<span data-ng-if=\"middleName\"> {{middleName}}</span> {{lastName}}</span>" +
                "<span data-ng-if=\"lastFirst\">{{lastName}}, {{firstName}} <span data-ng-if=\"middleName\">{{middleName}}</span></span></div>",
            scope: {
                firstName: "=",
                middleName: "=",
                lastName: "="
            }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            var nameStyle = attrs["zuFullName"];
            scope.firstLast = nameStyle === "FL";
            scope.lastFirst = nameStyle === "LF";
        }
    }

    angular.module("common.directives").directive("zuBlankRow", zuBlankRow);

    function zuBlankRow() {
        /***************************************************************************************
         * Usage:
         *      <div data-zu-blank-row data-repeat="1"></div>
         *
         * Description:
         *      Adds a blank row-fluid with a div.span12 inside
         *      data-repeat attribute is optional. If not specified, defaults to "1"
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            template: "<div data-ng-repeat=\"x in totalRows\">  <div class=\"row\"><div class=\"col-md-12\">&nbsp;</div></div>  </div>",
            replace: true,
            scope: { repeat: "&" }
        };
        return directive;

        function link(scope, element, attrs, controller) {
            scope.totalRows = [];
            attrs.$observe("repeat", function (val) {
                if (!val) { val = 1; }
                for (var i = 0; i < val; i++) {
                    scope.totalRows.push(i);
                }
            });
        }
    }

    commonModule.directive("zuSpinner", ["$window", function ($window) {
        /***************************************************************************************
         * Usage:
         *      <div data-zu-spinner="vm.spinnerOptions"></div>
         *
         * Description:
         *      Creates a new Spinner and sets its options
         *
         ***************************************************************************************/
        var directive = {
            link: link,
            restrict: "A"
        };
        return directive;

        function link(scope, element, attrs) {
            scope.spinner = null;
            scope.$watch(attrs.zuSpinner, function (options) {
                if (scope.spinner) {
                    scope.spinner.stop();
                }
                scope.spinner = new $window.Spinner(options);
                scope.spinner.spin(element[0]);
            }, true);
        }
    }]);

    commonModule.directive("clearOnEsc", function () {
        return {
            restrict: "A",
            scope: { boundedQuery: "=" },
            link: function (scope, element, attrs, controller) {
                //element.datepicker();
                element.on("keydown", function (event) {
                    if (event.keyCode == 27) {
                        scope.boundedQuery = "";
                        scope.$apply();
                        return false;
                    }
                    return true;
                });
            }
        };
    });

    //app.directive('ccSiddebar', ['$window', function ($window) {
    //    // Repositions the sidebar on window resize
    //    // and opens and closes the sidebar menu.
    //    // Usage:
    //    //  <div data-cc-sidebar>
    //    // Creates:
    //    //  <div data-cc-sidebar class="sidebar">
    //    var directive = {
    //        link: link,
    //        restrict: 'A'
    //    };
    //    var $win = $($window);
    //    return directive;

    //    function link(scope, element, attrs) {
    //        var $sidebarInner = element.find('.sidebar-inner');
    //        var $dropdownElement = element.find('.sidebar-dropdown a');
    //        element.addClass('sidebar');
    //        $win.resize(resize);
    //        $dropdownElement.click(dropdown);

    //        function resize() {
    //            $win.width() >= 765 ? $sidebarInner.slideDown(350) : $sidebarInner.slideUp(350);
    //        }

    //        function dropdown(e) {
    //            var dropClass = 'dropy';
    //            e.preventDefault();
    //            if (!$dropdownElement.hasClass(dropClass)) {
    //                hideAllSidebars();
    //                $sidebarInner.slideDown(350);
    //                $dropdownElement.addClass(dropClass);
    //            } else if ($dropdownElement.hasClass(dropClass)) {
    //                $dropdownElement.removeClass(dropClass);
    //                $sidebarInner.slideUp(350);
    //            }

    //            function hideAllSidebars() {
    //                $sidebarInner.slideUp(350);
    //                $('.sidebar-dropdown a').removeClass(dropClass);
    //            }
    //        }
    //    }
    //}]);

    //commonModule.directive("ccWidgetClose", function () {
    //    // Usage:
    //    // <a data-cc-widget-close></a>
    //    // Creates:
    //    // <a data-cc-widget-close="" href="#" class="wclose">
    //    //     <i class="icon-remove"></i>
    //    // </a>
    //    var directive = {
    //        link: link,
    //        template: "<i class=\"icon-remove\"></i>",
    //        restrict: "A"
    //    };
    //    return directive;

    //    function link(scope, element, attrs) {
    //        attrs.$set("href", "#");
    //        attrs.$set("wclose");
    //        element.click(close);

    //        function close(e) {
    //            e.preventDefault();
    //            element.parent().parent().parent().hide(100);
    //        }
    //    }
    //});

    //commonModule.directive("ccWidgetMinimize", function () {
    //    // Usage:
    //    // <a data-cc-widget-minimize></a>
    //    // Creates:
    //    // <a data-cc-widget-minimize="" href="#"><i class="icon-chevron-up"></i></a>
    //    var directive = {
    //        link: link,
    //        template: "<i class=\"icon-chevron-up\"></i>",
    //        restrict: "A"
    //    };
    //    return directive;

    //    function link(scope, element, attrs) {
    //        //$('body').on('click', '.widget .wminimize', minimize);
    //        attrs.$set("href", "#");
    //        attrs.$set("wminimize");
    //        element.click(minimize);

    //        function minimize(e) {
    //            e.preventDefault();
    //            var $wcontent = element.parent().parent().next(".widget-content");
    //            var iElement = element.children("i");
    //            if ($wcontent.is(":visible")) {
    //                iElement.removeClass("icon-chevron-up");
    //                iElement.addClass("icon-chevron-down");
    //            } else {
    //                iElement.removeClass("icon-chevron-down");
    //                iElement.addClass("icon-chevron-up");
    //            }
    //            $wcontent.toggle(500);
    //        }
    //    }
    //});

    commonModule.directive("ccScrollToTop", ["$window",
        // Usage:
        // <span data-cc-scroll-to-top></span>
        // Creates:
        // <span data-cc-scroll-to-top="" class="totop">
        //      <a href="#"><i class="icon-chevron-up"></i></a>
        // </span>
        function ($window) {
            var directive = {
                link: link,
                template: "<a href=\"#\"><i class=\"icon-chevron-up\"></i></a>",
                restrict: "A"
            };
            return directive;

            function link(scope, element, attrs) {
                var $win = $($window);
                element.addClass("totop");
                $win.scroll(toggleIcon);

                element.find("a").click(function (e) {
                    e.preventDefault();
                    // Learning Point: $anchorScroll works, but no animation
                    //$anchorScroll();
                    $("body").animate({ scrollTop: 0 }, 500);
                });

                function toggleIcon() {
                    $win.scrollTop() > 300 ? element.slideDown() : element.slideUp();
                }
            }
        }
    ]);

    commonModule.directive("ccSpinner", ["$window", function ($window) {
        // Description:
        //  Creates a new Spinner and sets its options
        // Usage:
        //  <div data-cc-spinner="vm.spinnerOptions"></div>
        var directive = {
            link: link,
            restrict: "A"
        };
        return directive;

        function link(scope, element, attrs) {
            scope.spinner = null;
            scope.$watch(attrs.ccSpinner, function (options) {
                if (scope.spinner) {
                    scope.spinner.stop();
                }
                scope.spinner = new $window.Spinner(options);
                scope.spinner.spin(element[0]);
            }, true);
        }
    }]);

    //commonModule.directive('ccWidgetHeader', function () {
    //    //Usage:
    //    //<div data-cc-widget-header title="vm.map.title"></div>
    //    var directive = {
    //        link: link,
    //        scope: {
    //            'title': '@',
    //            'subtitle': '@',
    //            'rightText': '@',
    //            'allowCollapse': '@'
    //        },
    //        templateUrl: '/app/internalUser/shell/widgetheader.html',
    //        restrict: 'A',
    //    };
    //    return directive;

    //    function link(scope, element, attrs) {
    //        attrs.$set('class', 'widget-head');
    //    }
    //});

    commonModule.directive("ccScrollToTop", ["$window",
        // Usage:
        // <span data-cc-scroll-to-top></span>
        // Creates:
        // <span data-cc-scroll-to-top="" class="totop">
        //      <a href="#"><i class="fa fa-chevron-up"></i></a>
        // </span>
        function ($window) {
            var directive = {
                link: link,
                template: "<a href=\"#\"><i class=\"fa fa-chevron-up\"></i></a>",
                restrict: "A"
            };
            return directive;

            function link(scope, element, attrs) {
                var $win = $($window);
                element.addClass("totop");
                $win.scroll(toggleIcon);

                element.find("a").click(function (e) {
                    e.preventDefault();
                    // Learning Point: $anchorScroll works, but no animation
                    //$anchorScroll();
                    $("body").animate({ scrollTop: 0 }, 500);
                });

                function toggleIcon() {
                    $win.scrollTop() > 300 ? element.slideDown() : element.slideUp();
                }
            }
        }
    ]);

    //commonModule.directive("ccWidgetMinimize", function () {
    //    // Usage:
    //    // <a data-cc-widget-minimize></a>
    //    // Creates:
    //    // <a data-cc-widget-minimize="" href="#"><i class="fa fa-chevron-up"></i></a>
    //    var directive = {
    //        link: link,
    //        template: "<i class=\"fa fa-chevron-up\"></i>",
    //        restrict: "A"
    //    };
    //    return directive;

    //    function link(scope, element, attrs) {
    //        //$('body').on('click', '.widget .wminimize', minimize);
    //        attrs.$set("href", "#");
    //        attrs.$set("wminimize");
    //        element.click(minimize);

    //        function minimize(e) {
    //            e.preventDefault();
    //            var $wcontent = element.parent().parent().next(".widget-content");
    //            var iElement = element.children("i");
    //            if ($wcontent.is(":visible")) {
    //                iElement.removeClass("fa fa-chevron-up");
    //                iElement.addClass("fa fa-chevron-down");
    //            } else {
    //                iElement.removeClass("fa fa-chevron-down");
    //                iElement.addClass("fa fa-chevron-up");
    //            }
    //            $wcontent.toggle(500);
    //        }
    //    }
    //});

    angular.module("common.directives").directive("zuRoutingNumberValidator", ["common", zuRoutingNumberValidator]);
    function zuRoutingNumberValidator(common) {
        /***************************************************************************************
         * Usage:
         *      data-zu-routing-number-validator=""
         *
         * Description:
         *      Validates that a routing number is correct
         *
         * Gotcha(s):
         *      If the lenght of the input is less than 9 it will return true
         *      assuming validation for length is being done separately
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            require: "ngModel"
        };
        return directive;

        function link(scope, element, attrs, ngModel) {
            ngModel.$validators.validRoutingNumber = function (modelValue) {
                if (!modelValue || modelValue == "" || modelValue.length < 9) { return true; }
                return common.isValidRoutingNumber(modelValue);
            }
        }
    }

    angular.module("common.directives").directive("checkboxGroup", checkboxGroup);
    function checkboxGroup() {
        return {
            restrict: "A",
            link: function (scope, elem, attrs) {
                // Determine initial checked boxes
                if (scope.array.indexOf(scope.item.id) !== -1) {
                    elem[0].checked = true;
                }

                // Update array on click
                elem.bind("click", function () {
                    var index = scope.array.indexOf(scope.item.id);
                    // Add if checked
                    if (elem[0].checked) {
                        if (index === -1) scope.array.push(scope.item.id);
                    }
                    // Remove if unchecked
                    else {
                        if (index !== -1) scope.array.splice(index, 1);
                    }
                    // Sort and update DOM display
                    scope.$apply(scope.array.sort(function (a, b) {
                        return a - b
                    }));
                });
            }
        }
    };

    angular.module("common.directives").directive("zuNoEntry", zuNoEntry);
    function zuNoEntry() {
        /***************************************************************************************
         * Usage:
         *      <div data-zu-no-entry=""> </div>
         *
         * Description:
         *      Does not allow any entry on the textbox.
         *
         * Gotcha(s):
         *
         ***************************************************************************************/

        var directive = {
            link: link,
            restrict: "A",
            replace: false,
            require: "ngModel"
        };
        return directive;

        function link(scope, element, attrs, ngModel) {
            element.on("keydown", function () {
                ngModel.$setViewValue(element[0].value);
                ngModel.$render();
                return false;
            });
        }
    }
})();