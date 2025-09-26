(function () {
    "use strict";

    var serviceId = "fileUpload";

    angular.module("app").factory(serviceId, ["$http", "common", "datacontext", fileUpload]);

    function fileUpload($http, common, datacontext) {

        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(serviceId);
        var logSuccess = getLogFn(serviceId, "success");
        var logError = getLogFn(serviceId, "error");


        // Define the functions and properties to reveal.
        var service = {
            //uploadFileToServer: uploadFileToServer,
            removeFroalaImage: removeFroalaImage,
            uploadAudioFile: uploadAudioFile,
            uploadImageFile: uploadImageFile,
            uploadAlbumImage: uploadAlbumImage
        };

        return service;



        //#region Internal Methods        


        //function uploadFileToServer(file, uploadUrl) {
        //    var fd = new FormData();
        //    fd.append("file", file);
        //    return $http.post(uploadUrl, fd, {
        //        transformRequest: angular.identity,
        //        headers: { 'Content-Type': undefined }
        //    });
        //}

        function uploadAudioFile(file, entityId) {
            // Handle file array/FileList from file input - FileList is array-like but not a true array
            var actualFile = (Array.isArray(file) || file instanceof FileList) ? file[0] : file;
            
            if (!actualFile) {
                return Promise.reject("No file provided");
            }
            
            var formData = new FormData();
            formData.append("file", actualFile);
            
            // Add cache buster to prevent caching issues
            var cacheBuster = new Date().getTime();
            var uploadUrl = "api/file/mp3/session/" + entityId + "?cacheBuster=" + cacheBuster;
            
            return $http.post(
                uploadUrl,
                formData, {
                    transformRequest: angular.identity,
                    headers: { 'Content-Type': undefined }
                });
        }
        
        function uploadImageFile(file) {
            var formData = new FormData();
            formData.append("file", file);
            return $http.post(
                    "api/file/image/base64",
                    formData, {
                        transformRequest: angular.identity,
                        headers: { 'Content-Type': undefined }
                    });
        }

        function uploadAlbumImage(file, albumId) {
            var formData = new FormData();
            formData.append("file", file);
            return $http.post(
                    "api/file/album/" + albumId + "/image",
                    formData, {
                        transformRequest: angular.identity,
                        headers: { 'Content-Type': undefined }
                    });
        }

        function removeFroalaImage(id, sessionId, path) {
            var fileName = common.getFileNameFromPath(path);
            return datacontext.deleteImageFile(id, sessionId, fileName);
        }


        //#endregion
    }
})();