(function () {
    "use strict";

    var serviceId = "auditService";

    angular.module("app").factory(serviceId, ["datacontext", "globalData", auditService]);

    function auditService(datacontext, gData) {
        // Define the functions and properties to reveal.
        var service = {
            addAuditEntryForLogOut: addAuditEntryForLogOut,
            addAuditEntryForSession: addAuditEntryForSession
        };

        return service;


        //#region Internal Methods        

        function addAuditEntryForSession(sessionMember) {
            return datacontext.setSessionAccessAudit(sessionMember);
        }

        function addAuditEntryForLogOut() {
            var logoutEntry = {
                auditCodeId: 3, //sign out
                entityType: "Member",
                entityId: gData.member.id,
                memberId: gData.member.id,
                auditDesc: gData.member.emailAddress + " logged out successfully"
            }
            return datacontext.addAuditEntry(logoutEntry);
        }

        //#endregion
    }
})();