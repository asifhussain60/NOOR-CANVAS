(function () {
    "use strict";

    angular
        .module("app")
        .service("authService", authService);

    authService.$inject = ["$rootScope", "lock", "authManager", "common", "datacontext", "globalData", "mediaportService"];

    function authService($rootScope, lock, authManager, common, datacontext, globalData, mps) {
        var userProfile = JSON.parse(localStorage.getItem("profile")) || {};

        function authProfile(profile) {
            return {
                clientId: profile.clientID,
                createdAt: profile.created_at,
                email: profile.email,
                isEmailVerified: profile.email_verified || "",
                familyName: profile.family_name || "",
                gender: profile.gender || "",
                givenName: profile.given_name || "",
                name: profile.name,
                nickname: profile.nickname,
                pictureUrl: profile.picture,
                updatedAt: profile.updated_at,
                userId: profile.user_id,
                facebookLink: profile.link || "",
                timeZone: profile.timeZone || "",
                facebookVerified: profile.verified || ""
            }
        }

        function login() {
            lock.show();
        }

        // Logging out just requires removing the user's
        // accessToken and profile
        function logout() {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("profile");
            authManager.unauthenticate();
            userProfile = {};
        }

        // Set up the logic for when a user authenticates
        // This method is called from app.run.js
        function registerAuthenticationListener() {
            lock.on("authenticated", function (authResult) {
                // Authentication successful - store tokens
                localStorage.setItem("accessToken", authResult.idToken);
                globalData.token = authResult.idToken;
                authManager.authenticate();

                lock.getProfile(authResult.accessToken, function (error, profile) {
                    if (error) { 
                        $rootScope.stateGo("404");
                        return;
                    }
                    
                    // Profile retrieved successfully - store and authenticate
                    localStorage.setItem("profile", JSON.stringify(profile));
                    globalData.profile = profile;
                    globalData.isAuthenticated = true;
                    authenticateuser(profile);
                });
            });
        }

        function authenticateuser(profile) {
            globalData.member = null;
            
            datacontext.getMemberIdByEmail(profile.email).then(signUserIn, signInError);

            function signUserIn(response) {
                globalData.isAuthenticated = Boolean(response.data);
                globalData.isAuthorized = Boolean(response.data && response.data.id);
                globalData.hasAccess = globalData.isAuthenticated && globalData.isAuthorized;

                if (globalData.hasAccess) {
                    globalData.member = response.data;
                    globalData.navConfig.picture = profile.picture;
                    globalData.member.sessionGuid = common.guid();

                    // Update OAuth profile and redirect to appropriate landing page
                    datacontext.updateOAuthProfile(globalData.member.id, authProfile(profile));

                    var landingState = getLandingState(globalData.member.isAdmin);
                    $rootScope.stateGo(landingState, null, { reload: true });
                } else {
                    // Access denied - redirect to 404
                    $rootScope.stateGo("404");
                }
            }
            function signInError(err) {
                // Error during authentication - redirect to 404
                $rootScope.stateGo("404");
            }
            function getLandingState(isAdmin) {
                var stateName = "albums";
                if (isAdmin) {
                    stateName = mps.isMobileBrowser() ? "manage.dashboard" : "admin";
                }
                return stateName;
            }
        }

        return {
            userProfile: userProfile,
            login: login,
            logout: logout,
            registerAuthenticationListener: registerAuthenticationListener
        }
    }
})();