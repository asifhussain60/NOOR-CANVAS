(function () {
    'use strict';

    // Define the common module
    // Contains services:
    //  - common
    //  - logger
    //  - spinner
    var commonModule = angular.module('common', []);

    // Must configure the common service and set its
    // events via the commonConfigProvider
    commonModule.provider('commonConfig', function () {
        this.config = {
            // These are the properties we need to set
            //controllerActivateSuccessEvent: '',
            //spinnerToggleEvent: ''
        };

        this.$get = function () {
            return {
                config: this.config
            };
        };
    });

    commonModule.factory('common',
        ['$q', '$rootScope', '$interval', '$timeout', 'bootstrap.dialog', 'commonConfig', 'globalData', 'logger', 'mediaportService', common]);

    function common($q, $rootScope, $interval, $timeout, dlg, commonConfig, gData, logger, mediaportService) {
        var throttles = {};

        loadPrototypes()

        var service = {
            // common angular dependencies
            $broadcast: $broadcast,
            $q: $q,
            $timeout: $timeout,
            $interval: $interval,
            // generic
            activateController: activateController,
            bindRemovers: bindRemovers,
            bindEventToId: bindEventToId,
            createSearchThrottle: createSearchThrottle,
            delayedFocus: delayedFocus,
            debouncedThrottle: debouncedThrottle,
            errorHandler: errorHandler,
            findById: findById,
            findByKey: findByKey,
            findByStringValue: findByStringValue,
            guid: guid,
            getFileNameFromPath: getFileNameFromPath,
            isAuthRequirementFulfilled: isAuthRequirementFulfilled,
            isMobileBrowser: isMobileBrowser,
            isNumber: isNumber,
            isObject: isObject,
            contains: contains,
            between: between,
            loadStylesDynamically: loadStylesDynamically,
            loadjscssfile: loadjscssfile,
            reloadjscssfile: reloadjscssfile,
            removejscssfile: removejscssfile,
            logger: logger, // for accessibility
            merge: merge,
            prototypeTimeFormat: prototypeTimeFormat,
            setStorage: setStorage,
            getStorage: getStorage,
            textContains: textContains,
            jumpToTop: jumpToTop,
            secondsToTime: secondsToTime,
            scrollToTop: scrollToTop,
            stripHtmlTags: stripHtmlTags,
            timeToSeconds: timeToSeconds,
            withoutItem: withoutItem,
        };

        return service;

        function loadPrototypes() {
            Array.prototype.move = function (old_index, new_index) {
                if (new_index >= this.length) {
                    var k = new_index - this.length;
                    while ((k--) + 1) {
                        this.push(undefined);
                    }
                }
                this.splice(new_index, 0, this.splice(old_index, 1)[0]);
                return this; // for testing purposes
            };
        }

        function activateController(promises, controllerId) {
            if (!promises) {
                $broadcast(commonConfig.config.controllerActivateSuccessEvent, null);
                jumpToTop();
                return;
            }
            return $q.all(promises).then(onSuccess, onFailure);

            function onSuccess(result) {
                if (promises.length !== result.length) {
                    logError("The number of data elements does not match the promise length", serviceId);
                    return false;
                }
                var data = { controllerId: controllerId };
                jumpToTop();
                $broadcast(commonConfig.config.controllerActivateSuccessEvent, data);
                return result;
            }
            function onFailure(result) {
                var data = { controllerId: controllerId };
                $broadcast(commonConfig.config.controllerActivateFailureEvent, data);
                jumpToTop();
                return $q.reject(result);
            }
        }

        function bindRemovers(selector) {
            $(selector).unbind("click", removeElementFromEditor);
            $(selector).bind("click", removeElementFromEditor);
        }
        function bindEventToId(strEvent, identifier) {
            debugger;
        }

        function removeElementFromEditor() {
            var node = this;
            dlg.confirmationDialog("Confirm", "Are you sure you want to remove this node?", "Yes", "Nope")
                .then(function (result) {
                    if (result === "ok") {
                        var previousNode = $(node).prev();
                        getParentRow(node).remove();
                        previousNode.append("<p></br></p>");
                    }
                });
        }
        function getParentRow(node) {
            return $(node).parentsUntil(".row").parent();
        }

        function getStorage(key) {
            var val = localStorage.getItem(key);
            return (val) ? JSON.parse(val) : "";
        }
        function setStorage(key, val) {
            return localStorage.setItem(key, JSON.stringify(val));
        }

        function delayedFocus(elementId, delayInterval) {
            $timeout(function () { $(elementId).focus(); }, delayInterval || 250);
        }

        function loadStylesDynamically(toState) {
            if (toState.data && toState.data.viewMode === 'user' && !gData.cssConfig.userCssLoaded) {
                gData.navConfig.showHeader = true;
                gData.navConfig.showFooter = true;
                var filesToLoad = [
                    "/Content/styles/appGlobal.css",
                    "/Content/styles/sessions/css/ksessions.css",
                    "/Content/styles/sessions/css/quran.css",
                    "/Themes/McAdmin/css/mcadmin.css"
                ];
                if (mediaportService.isMobileBrowser()) {
                    if (mediaportService.isDevice6P()) {
                        filesToLoad.push("/Content/styles/sessions/css/ksessions_iPhone6P.css");
                    } else if (mediaportService.isDevice6()) {
                        filesToLoad.push("/Content/styles/sessions/css/ksessions_iPhone6.css");
                    } else if (mediaportService.isDevice5()) {
                        filesToLoad.push("/Content/styles/sessions/css/ksessions_iPhone5.css");
                    }
                }
                var filesToUnload = [
                    "/Content/styles/manage/kmanage.css"
                ]
                gData.cssConfig.configLoaded(toState.data.viewMode);
            } else if (toState.data && toState.data.viewMode === 'manage' && !gData.cssConfig.adminCssLoaded) {
                gData.navConfig.showHeader = false;
                gData.navConfig.showFooter = false;
                var filesToLoad = [
                    "/Content/styles/manage/kmanage.css"
                ];
                var filesToUnload = [
                    "/Content/styles/appGlobal.css",
                    "/Content/styles/sessions/css/ksessions.css",
                    "/Content/styles/sessions/css/quran.css",
                    "/Themes/McAdmin/css/mcadmin.css",
                    "/Content/styles/sessions/css/ksessions_iPhone6P.css",
                    "/Content/styles/sessions/css/ksessions_iPhone6.css",
                    "/Content/styles/sessions/css/ksessions_iPhone5.css"
                ];
                gData.cssConfig.configLoaded(toState.data.viewMode);
            }
            if (filesToLoad && filesToLoad.length) { removejscssfile(filesToUnload); }
            if (filesToUnload && filesToUnload.length) { loadjscssfile(filesToLoad); }
        }

        function loadjscssfile(files) {
            if (files && files.length > 0) {
                _.each(files, function (file) { loadScriptFiles(file, "css"); });
            }
        }
        function reloadjscssfile(files) {
            if (files && files.length > 0) {
                removejscssfile(files);
                loadjscssfile(files);
            }
        }

        function loadScriptFiles(filename, filetype) {
            if (filetype == "js") { //if filename is a external JavaScript file
                var fileref = document.createElement('script')
                fileref.setAttribute("type", "text/javascript")
                fileref.setAttribute("src", filename)
            }
            else if (filetype == "css") { //if filename is an external CSS file
                var fileref = document.createElement("link")
                fileref.setAttribute("rel", "stylesheet")
                fileref.setAttribute("type", "text/css")
                fileref.setAttribute("href", filename + "?v=" + Math.random().toString())
            }
            if (typeof fileref != "undefined")
                document.getElementsByTagName("head")[0].appendChild(fileref)
        }

        function removejscssfile(files) {
            if (files && files.length > 0) {
                _.each(files, function (file) {
                    unloadScriptFiles(file, "css");
                });
            }
        }

        function unloadScriptFiles(filename, filetype) {
            var targetelement = (filetype == "js") ? "script" : (filetype == "css") ? "link" : "none" //determine element type to create nodelist from
            var targetattr = (filetype == "js") ? "src" : (filetype == "css") ? "href" : "none" //determine corresponding attribute to test for
            var allsuspects = document.getElementsByTagName(targetelement)
            for (var i = allsuspects.length; i >= 0; i--) { //search backwards within nodelist for matching elements to remove
                if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr).indexOf(filename) != -1)
                    allsuspects[i].parentNode.removeChild(allsuspects[i]) //remove element by calling parentNode.removeChild()
            }
        }

        function stripHtmlTags(html) {
            return html.replace(/<[^>]*>/g, " ")
                .replace(/&nbsp;|house|car/gi, "")
                .replace(/  +/g, " ").trim();
        }

        function contains(str, substr) {
            return str.indexOf(substr) !== -1;
        }
        function between(str, start, end) {
            return str.substring(str.lastIndexOf(start) + 1, str.lastIndexOf(end));
        }

        function getFileNameFromPath(fullPath) {
            return fullPath.replace(/^.*[\\\/]/, '');
        }

        function prototypeTimeFormat() {
            String.prototype.toHHMMSS = function () {
                var sec_num = parseInt(this, 10); // don't forget the second param
                var hours = Math.floor(sec_num / 3600);
                var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
                var seconds = sec_num - (hours * 3600) - (minutes * 60);

                if (hours < 10) { hours = "0" + hours; }
                if (minutes < 10) { minutes = "0" + minutes; }
                if (seconds < 10) { seconds = "0" + seconds; }

                if (!isNaN(hours)) {
                    return hours + ':' + minutes + ':' + seconds;
                }
                return "";
            }
        }

        function merge(target, source) {
            /* Merges two (or more) objects,
               giving the last one precedence */

            if (typeof target !== 'object') {
                target = {};
            }

            for (var property in source) {
                if (source.hasOwnProperty(property)) {
                    var sourceProperty = source[property];

                    if (typeof sourceProperty === 'object') {
                        target[property] = util.merge(target[property], sourceProperty);
                        continue;
                    }

                    target[property] = sourceProperty;
                }
            }

            for (var a = 2, l = arguments.length; a < l; a++) {
                merge(target, arguments[a]);
            }

            return target;
        };

        function jumpToTop() {
            window.scrollTo(0, 0);
        }

        function scrollToTop() {
            var topControl = $("#topcontrol");
            if (topControl) {
                topControl.click();
            }
        }

        function withoutItem(dataset, findQueryObj) {
            return _.without(dataset, _.findWhere(dataset, findQueryObj));
        }

        function findById(dataset, key, val) {
            return _.find(dataset, function (item) {
                return item[key] === Number(val);
            });
        }
        function findByKey(dataset, key, val) {
            return _.find(dataset, function (item) {
                return item[key] === val;
            });
        }
        function findByStringValue(list, key, val) {
            return _.find(list,
                function (i) {
                    return i[key].trim().toLowerCase() === val.trim().toLowerCase();
                });
        }

        function guid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        }

        function errorHandler(errorMessage, controllerId) {
            var logError = logger.getLogFn(controllerId, 'error');
            logError(errorMessage, controllerId);
        }
        function isAuthRequirementFulfilled() {
            return $rootScope.$state.current.data.requiresLogin && $rootScope.g.isAuthenticated && $rootScope.g.memberId > 0
        }
        function $broadcast() {
            return $rootScope.$broadcast.apply($rootScope, arguments);
        }

        function isMobileBrowser() {
            var check = false;
            (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        }

        function secondsToTime(secs) {
            if (!secs) { return; }

            var hours = Math.floor(secs / (60 * 60));

            var divisor_for_minutes = secs % (60 * 60);
            var minutes = Math.floor(divisor_for_minutes / 60);

            var divisor_for_seconds = divisor_for_minutes % 60;
            var seconds = Math.ceil(divisor_for_seconds);

            var obj = {
                "h": hours,
                "m": minutes,
                "s": seconds
            };
            var timeDisplay = "";
            if (obj.h) {
                timeDisplay += obj.h + ":";
            }
            if (obj.m) {
                timeDisplay += obj.m + ":";
            } else {
                if (obj.h > 0) {
                    timeDisplay += "00:";
                }
            }
            if (obj.s) {
                timeDisplay += obj.s;
            } else {
                if (obj.m > 0 || obj.h > 0) {
                    timeDisplay += "00";
                }
            }
            return timeDisplay;
        }
        function timeToSeconds(time) {
            if (!time) { return; }
            var S = time;
            var times = S.split(":");
            var minutes = times[0];
            var seconds = times[1];
            seconds = parseInt(Number(seconds), 10) + (parseInt(Number(minutes), 10) * 60);
            return seconds;
        }

        function createSearchThrottle(viewmodel, list, filteredList, filter, delay) {
            // After a delay, search a viewmodel's list using
            // a filter function, and return a filteredList.

            // custom delay or use default
            delay = +delay || 300;
            // if only vm and list parameters were passed, set others by naming convention
            if (!filteredList) {
                // assuming list is named sessions, filteredList is filteredSessions
                filteredList = 'filtered' + list[0].toUpperCase() + list.substr(1).toLowerCase(); // string
                // filter function is named sessionFilter
                filter = list + 'Filter'; // function in string form
            }

            // create the filtering function we will call from here
            var filterFn = function () {
                // translates to ...
                // vm.filteredSessions
                //      = vm.sessions.filter(function(item( { returns vm.sessionFilter (item) } );
                viewmodel[filteredList] = viewmodel[list].filter(function (item) {
                    return viewmodel[filter](item);
                });
            };

            return (function () {
                // Wrapped in outer IFFE so we can use closure
                // over filterInputTimeout which references the timeout
                var filterInputTimeout;

                // return what becomes the 'applyFilter' function in the controller
                return function (searchNow) {
                    if (filterInputTimeout) {
                        $timeout.cancel(filterInputTimeout);
                        filterInputTimeout = null;
                    }
                    if (searchNow || !delay) {
                        filterFn();
                    } else {
                        filterInputTimeout = $timeout(filterFn, delay);
                    }
                };
            })();
        }

        function debouncedThrottle(key, callback, delay, immediate) {
            // Perform some action (callback) after a delay.
            // Track the callback by key, so if the same callback
            // is issued again, restart the delay.

            var defaultDelay = 1000;
            delay = delay || defaultDelay;
            if (throttles[key]) {
                $timeout.cancel(throttles[key]);
                throttles[key] = undefined;
            }
            if (immediate) {
                callback();
            } else {
                throttles[key] = $timeout(callback, delay);
            }
        }

        function isNumber(val) {
            // negative or positive
            return /^[-]?\d+$/.test(val);
        }
        function isObject(i) {
            return (typeof i === "object" || typeof i === 'function') && (i !== null);
        }

        function textContains(text, searchText) {
            return text && -1 !== text.toLowerCase().indexOf(searchText.toLowerCase());
        }
    }
})();