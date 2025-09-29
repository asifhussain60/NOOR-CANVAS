(function () {
    'use strict';

    var app = angular.module('app');

    // Collect the routes
    app.constant('states', getStates());

    // Configure the routes and route resolvers
    app.config(['$stateProvider', '$urlRouterProvider', 'states', 'globalData', routeConfigurator]);

    function routeConfigurator($stateProvider, $urlRouterProvider, states, gData) {
        states.forEach(function (s) {
            $stateProvider.state(s.stateName, s.config);
        });

        $urlRouterProvider.otherwise('/');
    }

    // Define the routes
    function getStates() {
        return [
            {
                stateName: 'home',
                config: {
                    url: '/',
                    controller: [
                        '$scope', function home($scope) {
                            $scope.stateGo("login");
                        }
                    ]
                }
            },
            {
                stateName: 'login',
                config: {
                    url: '/login',
                    templateUrl: 'app/login/login.html',
                    data: {
                        requiresLogin: false,
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'registration',
                config: {
                    url: '/registration/:email',
                    templateUrl: 'app/features/registration/registration.html',
                    data: {
                        requiresLogin: false,
                        pageTitle: 'Complete Registration',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'albums',
                config: {
                    url: '/albums/',
                    templateUrl: 'app/features/album/albumList.html',
                    data: {
                        requiresLogin: true,
                        pageTitle: 'All Albums',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'album',
                config: {
                    url: '/album/:albumId/categoryId/:cid',
                    templateUrl: 'app/features/album/album.html',
                    data: {
                        requiresLogin: true,
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'session',
                config: {
                    url: '/album/:albumId/session/:sessionId/jump/:jumpLocation',
                    templateUrl: 'app/features/session/session.html',
                    data: {
                        requiresLogin: true,
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'sessionReader',
                config: {
                    url: '/album/:albumId/sessionReader',
                    templateUrl: 'app/features/album/sessionReader.html',
                    data: {
                        requiresLogin: true,
                        pageTitle: 'Album Transcript Reader',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'feedback',
                config: {
                    url: '/album/:albumId/session/:sessionId/feedback',
                    templateUrl: 'app/features/session/feedback.html',
                    data: {
                        requiresLogin: true,
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'sandbox',
                config: {
                    url: '/sandbox',
                    templateUrl: 'app/sandbox/sandbox.html',
                    data: {
                        requiresLogin: false,
                        pageTitle: 'SANDBOX',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'share',
                config: {
                    url: '/share/:sessionGuid',
                    templateUrl: 'app/features/hub/hub.html',
                    data: {
                        requiresLogin: false,
                        pageTitle: '',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'manage',
                config: {
                    url: '/manage',
                    templateUrl: 'app/features/manage/manage.html',
                    data: {
                        requiresLogin: true,
                        viewMode: 'manage'
                    }
                }
            },
            {
                stateName: 'manage.dashboard',
                config: {
                    url: '^/manage/dashboard',
                    templateUrl: 'app/features/manage/manageDashboard.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Dashboard',
                        viewMode: 'manage'
                    }
                }
            },
            {
                stateName: 'admin',
                config: {
                    url: '/admin',
                    templateUrl: 'app/features/admin/admin.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Dashboard',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.home',
                config: {
                    url: '^/admin/home',
                    templateUrl: 'app/features/admin/adminDash.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Dashboard',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.family',
                config: {
                    url: '^/admin/family',
                    templateUrl: 'app/features/admin/adminFamily.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Family Management',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.search',
                config: {
                    url: '^/admin/search',
                    templateUrl: 'app/features/admin/adminSearch.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Admin Search',
                        viewMode: 'user'
                    }
                }
            }, {
                stateName: 'admin.memberForm',
                config: {
                    url: '^/admin/member/:memberId',
                    templateUrl: 'app/features/admin/adminFamilyMemberForm.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Member Information',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.session',
                config: {
                    url: '^/admin/session',
                    templateUrl: 'app/features/admin/adminSession.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Session Management',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.transcript',
                config: {
                    url: '^/admin/album/:albumId/session/:sessionId/transcript/:transcriptId',
                    templateUrl: 'app/features/admin/adminSessionTranscript.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Session Transcript Management',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.summary',
                config: {
                    url: '^/admin/album/:albumId/session/:sessionId/summary/:summaryId',
                    templateUrl: 'app/features/admin/adminSessionSummary.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Session Summary Management',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.album',
                config: {
                    url: '^/admin/album',
                    templateUrl: 'app/features/admin/adminAlbum.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Album Management',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.memberAccess',
                config: {
                    url: '^/admin/memberAccess',
                    templateUrl: 'app/features/admin/adminMemberAccess.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Member Access Management',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.login',
                config: {
                    url: '^/admin/loginSimulate/member/:memberId',
                    templateUrl: 'app/features/admin/adminLogin.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Login Simulation',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.etymologyManager',
                config: {
                    url: '^/admin/mng/etymology',
                    templateUrl: 'app/features/admin/adminEtymology.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Enhanced Etymology Management',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.quranManager',
                config: {
                    url: '^/admin/mng/quran',
                    templateUrl: 'app/features/admin/adminQuran.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Manage Quran Ayats & Translations',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.ahadeesManager',
                config: {
                    url: '^/admin/mng/ahadees',
                    templateUrl: 'app/features/admin/adminAhadees.html',
                    controller: 'adminAhadeesCtl',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Manage Ahadees',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.hubPreloader',
                config: {
                    url: '^/admin/mng/hubPreload',
                    templateUrl: 'app/features/admin/adminHubPreloader.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Manage Hub Preload For Session',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.systemUtilities',
                config: {
                    url: '^/admin/utilities/system',
                    templateUrl: 'app/features/admin/utilities/adminSystemUtilities.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'System Utilities & Maintenance',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.gitCommits',
                config: {
                    url: '^/admin/utilities/git',
                    templateUrl: 'app/features/admin/utilities/adminGitCommits.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Git Commands & Version Control',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.sqlBackups',
                config: {
                    url: '^/admin/utilities/backups',
                    templateUrl: 'app/features/admin/utilities/adminSqlBackups.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'SQL Database Backups',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.testSuite',
                config: {
                    url: '^/admin/testing/suite',
                    templateUrl: 'app/features/admin/adminTestSuite.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Test Suite Management',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.testSuiteEnhanced',
                config: {
                    url: '^/admin/testing/enhanced',
                    templateUrl: 'app/features/admin/adminTestSuiteEnhanced.html',
                    controller: 'adminTestSuiteEnhancedCtl',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Enhanced Test Suite Management',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.testConfig',
                config: {
                    url: '^/admin/testing/config',
                    templateUrl: 'app/features/admin/adminTestConfig.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Test Configuration Manager',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.logViewer',
                config: {
                    url: '^/admin/logs/viewer',
                    templateUrl: 'app/features/admin/adminLogViewer.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Log Viewer - KSESSIONS Application Logs',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: 'admin.testHarness',
                config: {
                    url: '^/admin/testing/harness',
                    templateUrl: 'app/features/admin/adminTestHarness.html',
                    data: {
                        requiresLogin: true,
                        adminTitle: 'Test Harness Generator - Create Interactive Test Suites',
                        viewMode: 'user'
                    }
                }
            },
            {
                stateName: '404',
                config: {
                    url: '/404',
                    controller: [
                        'authService', 'common', function Con404(authService, common) {
                            authService.logout();
                            common.activateController(); //turns off the spinner
                            window.location.href = window.location.origin + "/app/error/404.html";
                        }
                    ]
                }
            }
        ];
    }
})();