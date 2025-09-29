/**
 * Ahadees Service - Enhanced Islamic Narrations Data Access Layer
 * Replaces existing narration service with modern API integration
 * 
 * Features:
 * - RESTful API communication with KQUR_DEV database
 * - Enhanced error handling and logging
 * - Caching strategy for performance
 * - Support for new Ahadees table structure
 */

(function () {
    'use strict';

    angular
        .module('app')
        .factory('ahadeesService', ahadeesService);

    ahadeesService.$inject = ['$http', '$q', 'common', 'config', 'logger'];

    function ahadeesService($http, $q, common, config, logger) {
        
        // Initialize logging context
        logger.info('Ahadees Service: Initializing enhanced narrations data service');
        console.log('ahadeesService: Service initialization started at', new Date().toISOString());

        var service = {
            // Core CRUD Operations
            getAhadeesById: getAhadeesById,
            createAhadees: createAhadees,
            updateAhadees: updateAhadees,
            deleteAhadees: deleteAhadees,
            
            // Data Retrieval Operations
            getRecentAhadees: getRecentAhadees,
            getAllAhadees: getAllAhadees,
            
            // Reference Data Operations
            getNarrators: getNarrators,
            getSources: getSources,
            getSubjects: getSubjects,
            
            // Batch Operations
            exportAhadees: exportAhadees,
            importAhadees: importAhadees,
            
            // Utility Operations
            validateAhadees: validateAhadees,
            getAhadeesStats: getAhadeesStats
        };

        // API endpoints configuration
        var apiBase = config.remoteServiceName + 'api/ahadees/';
        var apiEndpoints = {
            ahadees: apiBase,
            recent: apiBase + 'recent/',
            narrators: config.remoteServiceName + 'api/narrators/',
            sources: config.remoteServiceName + 'api/sources/',
            subjects: config.remoteServiceName + 'api/subjects/',
            export: apiBase + 'export',
            import: apiBase + 'import',
            stats: apiBase + 'stats'
        };

        console.log('ahadeesService: API endpoints configured:', apiEndpoints);
        logger.debug('Ahadees Service: API endpoints configured for KQUR_DEV integration');

        return service;

        function getAhadeesById(ahadeesId) {
            if (!ahadeesId || ahadeesId <= 0) {
                logger.error('Ahadees Service: getAhadeesById called with invalid ID: ' + ahadeesId);
                console.error('ahadeesService: getAhadeesById - Invalid ID:', ahadeesId);
                return $q.reject(new Error('Invalid ahadees ID provided'));
            }

            console.log('ahadeesService: getAhadeesById() - Fetching ahadees ID:', ahadeesId);
            logger.debug('Ahadees Service: Fetching ahadees by ID: ' + ahadeesId);

            var url = apiEndpoints.ahadees + ahadeesId;
            var startTime = Date.now();

            return $http.get(url)
                .then(function(response) {
                    var fetchTime = Date.now() - startTime;
                    
                    logger.info('Ahadees Service: Successfully fetched ahadees ID ' + ahadeesId + ' in ' + fetchTime + 'ms');
                    console.log('ahadeesService: Fetched ahadees successfully:', {
                        id: ahadeesId,
                        subject: response.data.subject,
                        fetchTime: fetchTime + 'ms'
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Ahadees Service: Failed to fetch ahadees ID ' + ahadeesId, error);
                    console.error('ahadeesService: getAhadeesById failed:', error);
                    
                    var errorMessage = 'Failed to load ahadees: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function createAhadees(ahadeesData) {
            if (!ahadeesData) {
                logger.error('Ahadees Service: createAhadees called with no data');
                console.error('ahadeesService: createAhadees - No data provided');
                return $q.reject(new Error('Ahadees data is required'));
            }

            console.log('ahadeesService: createAhadees() - Creating new ahadees:', ahadeesData.subject);
            logger.info('Ahadees Service: Creating new ahadees - Subject: ' + (ahadeesData.subject || 'No subject'));

            // Validate data before sending
            var validationResult = validateAhadees(ahadeesData);
            if (!validationResult.isValid) {
                logger.error('Ahadees Service: Create validation failed', validationResult.errors);
                console.error('ahadeesService: Validation failed:', validationResult.errors);
                return $q.reject(new Error('Validation failed: ' + validationResult.errors.join(', ')));
            }

            var startTime = Date.now();

            return $http.post(apiEndpoints.ahadees, ahadeesData)
                .then(function(response) {
                    var createTime = Date.now() - startTime;
                    var createdAhadees = response.data;
                    
                    logger.info('Ahadees Service: Successfully created ahadees ID ' + createdAhadees.ahadeesId + 
                        ' in ' + createTime + 'ms');
                    console.log('ahadeesService: Created ahadees successfully:', {
                        id: createdAhadees.ahadeesId,
                        subject: createdAhadees.subject,
                        createTime: createTime + 'ms'
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Ahadees Service: Failed to create ahadees', error);
                    console.error('ahadeesService: createAhadees failed:', error);
                    
                    var errorMessage = 'Failed to create ahadees: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function updateAhadees(ahadeesData) {
            if (!ahadeesData || !ahadeesData.ahadeesId) {
                logger.error('Ahadees Service: updateAhadees called with invalid data');
                console.error('ahadeesService: updateAhadees - Invalid data or missing ID');
                return $q.reject(new Error('Valid ahadees data with ID is required'));
            }

            console.log('ahadeesService: updateAhadees() - Updating ahadees ID:', ahadeesData.ahadeesId);
            logger.info('Ahadees Service: Updating ahadees ID ' + ahadeesData.ahadeesId + 
                ' - Subject: ' + (ahadeesData.subject || 'No subject'));

            // Validate data before sending
            var validationResult = validateAhadees(ahadeesData);
            if (!validationResult.isValid) {
                logger.error('Ahadees Service: Update validation failed', validationResult.errors);
                console.error('ahadeesService: Validation failed:', validationResult.errors);
                return $q.reject(new Error('Validation failed: ' + validationResult.errors.join(', ')));
            }

            var url = apiEndpoints.ahadees + ahadeesData.ahadeesId;
            var startTime = Date.now();

            return $http.put(url, ahadeesData)
                .then(function(response) {
                    var updateTime = Date.now() - startTime;
                    
                    logger.info('Ahadees Service: Successfully updated ahadees ID ' + ahadeesData.ahadeesId + 
                        ' in ' + updateTime + 'ms');
                    console.log('ahadeesService: Updated ahadees successfully:', {
                        id: ahadeesData.ahadeesId,
                        subject: ahadeesData.subject,
                        updateTime: updateTime + 'ms'
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Ahadees Service: Failed to update ahadees ID ' + ahadeesData.ahadeesId, error);
                    console.error('ahadeesService: updateAhadees failed:', error);
                    
                    var errorMessage = 'Failed to update ahadees: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function deleteAhadees(ahadeesId) {
            if (!ahadeesId || ahadeesId <= 0) {
                logger.error('Ahadees Service: deleteAhadees called with invalid ID: ' + ahadeesId);
                console.error('ahadeesService: deleteAhadees - Invalid ID:', ahadeesId);
                return $q.reject(new Error('Invalid ahadees ID provided'));
            }

            console.log('ahadeesService: deleteAhadees() - Deleting ahadees ID:', ahadeesId);
            logger.info('Ahadees Service: Deleting ahadees ID: ' + ahadeesId);

            var url = apiEndpoints.ahadees + ahadeesId;
            var startTime = Date.now();

            return $http.delete(url)
                .then(function(response) {
                    var deleteTime = Date.now() - startTime;
                    
                    logger.info('Ahadees Service: Successfully deleted ahadees ID ' + ahadeesId + 
                        ' in ' + deleteTime + 'ms');
                    console.log('ahadeesService: Deleted ahadees successfully:', {
                        id: ahadeesId,
                        deleteTime: deleteTime + 'ms'
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Ahadees Service: Failed to delete ahadees ID ' + ahadeesId, error);
                    console.error('ahadeesService: deleteAhadees failed:', error);
                    
                    var errorMessage = 'Failed to delete ahadees: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function getRecentAhadees(count) {
            count = count || 50;
            
            console.log('ahadeesService: getRecentAhadees() - Fetching', count, 'recent records');
            logger.debug('Ahadees Service: Fetching ' + count + ' recent ahadees records');

            var url = apiEndpoints.recent + count;
            var startTime = Date.now();

            return $http.get(url)
                .then(function(response) {
                    var fetchTime = Date.now() - startTime;
                    var records = response.data.results || [];
                    
                    logger.info('Ahadees Service: Successfully fetched ' + records.length + 
                        ' recent ahadees in ' + fetchTime + 'ms');
                    console.log('ahadeesService: Fetched recent ahadees:', {
                        count: records.length,
                        fetchTime: fetchTime + 'ms'
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Ahadees Service: Failed to fetch recent ahadees', error);
                    console.error('ahadeesService: getRecentAhadees failed:', error);
                    
                    var errorMessage = 'Failed to load recent ahadees: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function getAllAhadees(page, pageSize) {
            page = page || 1;
            pageSize = pageSize || 50;
            
            console.log('ahadeesService: getAllAhadees() - Page:', page, 'Size:', pageSize);
            logger.debug('Ahadees Service: Fetching all ahadees - Page: ' + page + ', Size: ' + pageSize);

            var url = apiEndpoints.ahadees + '?page=' + page + '&pageSize=' + pageSize;
            var startTime = Date.now();

            return $http.get(url)
                .then(function(response) {
                    var fetchTime = Date.now() - startTime;
                    var records = response.data.results || [];
                    
                    logger.info('Ahadees Service: Successfully fetched ' + records.length + 
                        ' ahadees records in ' + fetchTime + 'ms');
                    console.log('ahadeesService: Fetched all ahadees:', {
                        page: page,
                        count: records.length,
                        totalCount: response.data.totalCount,
                        fetchTime: fetchTime + 'ms'
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Ahadees Service: Failed to fetch all ahadees', error);
                    console.error('ahadeesService: getAllAhadees failed:', error);
                    
                    var errorMessage = 'Failed to load ahadees: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function getNarrators() {
            console.log('ahadeesService: getNarrators() - Fetching all narrators');
            logger.debug('Ahadees Service: Fetching narrators reference data');

            var startTime = Date.now();

            return $http.get(apiEndpoints.narrators)
                .then(function(response) {
                    var fetchTime = Date.now() - startTime;
                    var narrators = response.data || [];
                    
                    logger.info('Ahadees Service: Successfully fetched ' + narrators.length + 
                        ' narrators in ' + fetchTime + 'ms');
                    console.log('ahadeesService: Fetched narrators:', {
                        count: narrators.length,
                        fetchTime: fetchTime + 'ms'
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Ahadees Service: Failed to fetch narrators', error);
                    console.error('ahadeesService: getNarrators failed:', error);
                    
                    var errorMessage = 'Failed to load narrators: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function getSources() {
            console.log('ahadeesService: getSources() - Fetching all sources');
            logger.debug('Ahadees Service: Fetching sources reference data');

            var startTime = Date.now();

            return $http.get(apiEndpoints.sources)
                .then(function(response) {
                    var fetchTime = Date.now() - startTime;
                    var sources = response.data || [];
                    
                    logger.info('Ahadees Service: Successfully fetched ' + sources.length + 
                        ' sources in ' + fetchTime + 'ms');
                    console.log('ahadeesService: Fetched sources:', {
                        count: sources.length,
                        fetchTime: fetchTime + 'ms'
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Ahadees Service: Failed to fetch sources', error);
                    console.error('ahadeesService: getSources failed:', error);
                    
                    var errorMessage = 'Failed to load sources: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function getSubjects() {
            console.log('ahadeesService: getSubjects() - Fetching all subjects');
            logger.debug('Ahadees Service: Fetching subjects reference data');

            var startTime = Date.now();

            return $http.get(apiEndpoints.subjects)
                .then(function(response) {
                    var fetchTime = Date.now() - startTime;
                    var subjects = response.data || [];
                    
                    logger.info('Ahadees Service: Successfully fetched ' + subjects.length + 
                        ' subjects in ' + fetchTime + 'ms');
                    console.log('ahadeesService: Fetched subjects:', {
                        count: subjects.length,
                        fetchTime: fetchTime + 'ms'
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Ahadees Service: Failed to fetch subjects', error);
                    console.error('ahadeesService: getSubjects failed:', error);
                    
                    var errorMessage = 'Failed to load subjects: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function exportAhadees(filters) {
            console.log('ahadeesService: exportAhadees() - Starting export operation');
            logger.info('Ahadees Service: Starting ahadees export operation');

            var startTime = Date.now();
            var requestData = {
                filters: filters || {},
                format: 'json',
                includeMetadata: true
            };

            return $http.post(apiEndpoints.export, requestData)
                .then(function(response) {
                    var exportTime = Date.now() - startTime;
                    
                    logger.info('Ahadees Service: Export completed successfully in ' + exportTime + 'ms');
                    console.log('ahadeesService: Export completed:', {
                        exportTime: exportTime + 'ms',
                        dataSize: response.data.length
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Ahadees Service: Export operation failed', error);
                    console.error('ahadeesService: exportAhadees failed:', error);
                    
                    var errorMessage = 'Failed to export ahadees: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function importAhadees(fileData) {
            if (!fileData) {
                logger.error('Ahadees Service: importAhadees called with no file data');
                console.error('ahadeesService: importAhadees - No file data provided');
                return $q.reject(new Error('File data is required for import'));
            }

            console.log('ahadeesService: importAhadees() - Starting import operation');
            logger.info('Ahadees Service: Starting ahadees import operation');

            var startTime = Date.now();

            return $http.post(apiEndpoints.import, fileData, {
                headers: { 'Content-Type': 'application/json' }
            })
                .then(function(response) {
                    var importTime = Date.now() - startTime;
                    var importStats = response.data;
                    
                    logger.info('Ahadees Service: Import completed - ' + 
                        importStats.imported + ' imported, ' + 
                        importStats.errors + ' errors in ' + importTime + 'ms');
                    console.log('ahadeesService: Import completed:', {
                        imported: importStats.imported,
                        errors: importStats.errors,
                        importTime: importTime + 'ms'
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Ahadees Service: Import operation failed', error);
                    console.error('ahadeesService: importAhadees failed:', error);
                    
                    var errorMessage = 'Failed to import ahadees: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        function validateAhadees(ahadeesData) {
            console.log('ahadeesService: validateAhadees() - Validating ahadees data');
            logger.debug('Ahadees Service: Validating ahadees data structure');

            var errors = [];
            var result = {
                isValid: true,
                errors: errors
            };

            // Required field validations
            if (!ahadeesData.ahadeesArabic || ahadeesData.ahadeesArabic.trim().length === 0) {
                errors.push('Arabic text is required');
            }

            if (!ahadeesData.ahadeesEnglish || ahadeesData.ahadeesEnglish.trim().length === 0) {
                errors.push('English text is required');
            }

            if (!ahadeesData.subject || ahadeesData.subject.trim().length === 0) {
                errors.push('Subject is required');
            }

            // Length validations
            if (ahadeesData.ahadeesArabic && ahadeesData.ahadeesArabic.length > 4000) {
                errors.push('Arabic text is too long (maximum 4000 characters)');
            }

            if (ahadeesData.ahadeesEnglish && ahadeesData.ahadeesEnglish.length > 4000) {
                errors.push('English text is too long (maximum 4000 characters)');
            }

            if (ahadeesData.subject && ahadeesData.subject.length > 300) {
                errors.push('Subject is too long (maximum 300 characters)');
            }

            // Optional field validations
            if (ahadeesData.source && ahadeesData.source.length > 200) {
                errors.push('Source is too long (maximum 200 characters)');
            }

            if (ahadeesData.reference && ahadeesData.reference.length > 100) {
                errors.push('Reference is too long (maximum 100 characters)');
            }

            result.isValid = errors.length === 0;

            if (!result.isValid) {
                logger.debug('Ahadees Service: Validation failed with ' + errors.length + ' errors');
                console.log('ahadeesService: Validation failed:', errors);
            } else {
                logger.debug('Ahadees Service: Validation passed successfully');
                console.log('ahadeesService: Validation passed');
            }

            return result;
        }

        function getAhadeesStats() {
            console.log('ahadeesService: getAhadeesStats() - Fetching statistics');
            logger.debug('Ahadees Service: Fetching ahadees statistics');

            var startTime = Date.now();

            return $http.get(apiEndpoints.stats)
                .then(function(response) {
                    var fetchTime = Date.now() - startTime;
                    
                    logger.info('Ahadees Service: Successfully fetched statistics in ' + fetchTime + 'ms');
                    console.log('ahadeesService: Fetched statistics:', {
                        stats: response.data,
                        fetchTime: fetchTime + 'ms'
                    });
                    
                    return response;
                })
                .catch(function(error) {
                    logger.error('Ahadees Service: Failed to fetch statistics', error);
                    console.error('ahadeesService: getAhadeesStats failed:', error);
                    
                    var errorMessage = 'Failed to load statistics: ' + getErrorMessage(error);
                    return $q.reject(new Error(errorMessage));
                });
        }

        // Utility function to extract meaningful error messages
        function getErrorMessage(error) {
            if (error.data && error.data.message) {
                return error.data.message;
            } else if (error.data && typeof error.data === 'string') {
                return error.data;
            } else if (error.message) {
                return error.message;
            } else if (error.status) {
                return 'Server error (HTTP ' + error.status + ')';
            } else {
                return 'Unknown error occurred';
            }
        }
    }
})();
