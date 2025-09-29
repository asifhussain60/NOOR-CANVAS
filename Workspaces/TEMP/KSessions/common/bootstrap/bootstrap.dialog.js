(function () {
    'use strict';

    var bootstrapModule = angular.module('common.bootstrap', ['ui.bootstrap', 'ngSanitize']);

    bootstrapModule.factory('bootstrap.dialog', ['$uibModal', '$templateCache', modalDialog]);

    function modalDialog($uibModal, $templateCache) {
        var service = {
            deleteDialog: deleteDialog,
            confirmationDialog: confirmationDialog,
            showModal: showModal
        };

        $templateCache.put('modalDialog.tpl.html',
            '<div>' +
            '    <div class="modal-header">' +
            '        <button type="button" class="close" data-dismiss="modal" aria-hidden="true" data-ng-click="cancel()">&times;</button>' +
            '        <h3>{{title}}</h3>' +
            '    </div>' +
            '    <div class="modal-body" style="max-height: 500px; overflow-y: auto;">' +
            '        <div data-ng-if="isHtmlContent" data-ng-bind-html="trustedMessage"></div>' +
            '        <p data-ng-if="!isHtmlContent">{{message}}</p>' +
            '    </div>' +
            '    <div class="modal-footer">' +
            '        <button class="btn btn-success" data-ng-click="ok()">{{okText}}</button>' +
            '        <button class="btn btn-danger" data-ng-if="showCancel" data-ng-click="cancel()">{{cancelText}}</button>' +
            '    </div>' +
            '</div>');

        return service;

        function deleteDialog(itemName, customMsg, okText, cancelText) {
            var title = 'Confirm Delete';
            itemName = itemName || 'item';
            var msg = customMsg || 'Are you sure you want to delete this ' + itemName + '?';

            return confirmationDialog(title, msg, okText, cancelText);
        }

        function confirmationDialog(title, msg, okText, cancelText) {

            var modalOptions = {
                templateUrl: 'modalDialog.tpl.html',
                controller: ModalInstance,
                keyboard: true,
                resolve: {
                    options: function () {
                        return {
                            title: title,
                            message: msg,
                            okText: okText,
                            cancelText: cancelText
                        };
                    }
                }
            };

            return $uibModal.open(modalOptions).result;
        }

        function showModal(options) {
            var title = options.title || 'Information';
            var message = options.message || '';
            var buttons = options.buttons || ['OK'];
            var isHtml = options.isHtml || /<[^>]+>/.test(message);
            
            // For simple information modals, just use confirmationDialog with one button
            if (buttons.length === 1) {
                var modalOptions = {
                    templateUrl: 'modalDialog.tpl.html',
                    controller: ModalInstance,
                    keyboard: true,
                    size: isHtml ? 'lg' : undefined, // Use large modal for HTML content
                    resolve: {
                        options: function () {
                            return {
                                title: title,
                                message: message,
                                okText: buttons[0],
                                cancelText: null,
                                isHtml: isHtml
                            };
                        }
                    }
                };
                
                return $uibModal.open(modalOptions).result
                    .then(function() {
                        return { result: 'ok', button: buttons[0] };
                    })
                    .catch(function() {
                        return { result: 'cancel', button: 'cancel' };
                    });
            } else {
                // For multiple buttons, use standard confirmation dialog
                var okText = buttons[0] || 'OK';
                var cancelText = buttons[1] || 'Cancel';
                return confirmationDialog(title, message, okText, cancelText);
            }
        }
    }

    var ModalInstance = ['$scope', '$uibModalInstance', '$sce', 'options',
        function ($scope, $uibModalInstance, $sce, options) {
            $scope.title = options.title || 'Title';
            $scope.message = options.message || '';
            $scope.okText = options.okText || 'OK';
            $scope.cancelText = options.cancelText || 'Cancel';
            $scope.showCancel = options.cancelText && options.cancelText !== null;
            
            // Check if content contains HTML tags
            $scope.isHtmlContent = options.isHtml || (options.message && /<[^>]+>/.test(options.message));
            
            // Use $sce.trustAsHtml for HTML content to allow safe rendering
            if ($scope.isHtmlContent) {
                $scope.trustedMessage = $sce.trustAsHtml(options.message);
            }
            
            $scope.ok = function () { $uibModalInstance.close('ok'); };
            $scope.cancel = function() {
                 $uibModalInstance.dismiss('cancel');
            };
        }];
})();