# NOOR Canvas Issue Tracker

**Last Updated**: September 17, 2025  
**Status**: Active Development Issues  
**Purpose**: Track and manage implementation issues, bugs, and feature requests

---

## 🔴 **CRITICAL ACTIVE ISSUES**

### **Issue-104: Full GUID Generated Instead of 8-Character Friendly Token**
**Created**: September 17, 2025  
**Priority**: HIGH  
**Status**: ACTIVE  
**Reporter**: User Testing Feedback  

#### **Problem Description**
The system is generating and displaying full base64 encoded GUIDs in the URL input field instead of the expected 8-character friendly tokens. This creates usability issues and doesn't match the intended design.

#### **Current Issues**
1. ❌ Full GUID `H/VOsw32idDlHxL3tMHWg8j/jTuFKyYgzz5D4z/r3NA=` appears in input field
2. ❌ Expected friendly token like `4LE7I9MI` not displayed
3. ❌ URL becomes unwieldy with full base64 encoded strings
4. ❌ User experience degraded due to complex token format

#### **Expected Behavior**
- Display 8-character friendly tokens in input fields
- Use friendly tokens in URLs for better UX
- Map friendly tokens to full GUIDs internally
- Maintain backward compatibility with existing full GUID system

#### **Technical Context**
- HostProvisioner generates friendly tokens correctly (`4LE7I9MI`)
- Database stores base64 encoded HostGuid values
- Need mapping system between friendly tokens and full GUIDs
- Current URL pattern: `/host/landing/H%2FVOsw32idDlHxL3tMHWg8j%2FjTuFKyYgzz5D4z%2Fr3NA%3D`
- Expected URL pattern: `/host/landing/4LE7I9MI`

---

### **Issue-105: HostLanding Model Properties Not Populated from Database**
**Created**: September 17, 2025  
**Priority**: HIGH  
**Status**: ACTIVE  
**Reporter**: Test Validation  

#### **Problem Description**
When HostLanding view loads, the model properties (Session Name and Description) are not being populated with real data from SQL tables based on token validation and session lookup.

#### **Current Issues**
1. ❌ Session Name remains hardcoded placeholder
2. ❌ Session Description shows generic text
3. ❌ No database lookup using friendly token → SessionID mapping
4. ❌ Session data available in validation response but not displayed upfront

#### **Expected Behavior**
- **Session Name**: Load real session name from SQL table by:
  1. Matching base64/friendly token with SessionID 
  2. Using SessionID to get Session Name from database
- **Session Description**: Load session description following same logic
- Display actual session information before authentication
- Fallback to placeholders only when no data available

#### **Technical Requirements**
1. Implement token → SessionID mapping logic
2. Create database lookup for session information
3. Populate HostLanding model properties from database
4. Add comprehensive debug logging for session data retrieval
5. Follow UserLanding.razor pattern for consistency

---

### **Issue-106: Copilot Instructions Missing IIS Express and Build Process Updates**
**Created**: September 17, 2025  
**Priority**: MEDIUM  
**Status**: ACTIVE  
**Reporter**: Development Process Improvement  

#### **Problem Description**
The copilot_instructions.md file needs updates to improve development workflow automation and ensure proper process management.

#### **Required Updates**
1. **IIS Express Process Checking**: Always check for running iisexpress64 process before serving pages in Simple Browser
2. **Auto-Launch Integration**: If IIS Express not running, use `nc` command to launch one automatically
3. **Build Process Enhancement**: Update build process to kill running IIS Express processes before building application

#### **Current Issues**
1. ❌ Simple Browser operations don't verify IIS Express status
2. ❌ Manual process required to start/stop IIS Express
3. ❌ Build conflicts when IIS Express processes are running
4. ❌ No automated cleanup in build pipeline

#### **Expected Implementation**
- Add pre-check for iisexpress64.exe process
- Integrate `nc` command for automated server management
- Add process cleanup to build pipeline
- Ensure seamless development workflow

---

### **Issue-103: HostLanding.razor Session Information Not Displayed**
**Created**: September 17, 2025  
**Priority**: HIGH  
**Status**: IMPLEMENTED  
**Reporter**: User Feedback  

#### **Problem Description**
HostLanding.razor currently shows hardcoded "HOST SESSION" and generic placeholder text instead of actual session information from database. Similar to Issue-102 that was fixed for UserLanding.razor, the host interface should display:
1. **Session Name** from database instead of "HOST SESSION"  
2. **Session Description** instead of "Enter your Host GUID token to load session details"

#### **Expected Behavior**
- **Session Title Display**: Should show actual session name from Sessions table based on SessionID that created the host token
- **Session Description Display**: Should show session description from database when available and not blank/null
- **Fallback Behavior**: Show "HOST SESSION" only when no session information is available

#### **Current Issues**
1. ❌ Always shows hardcoded "HOST SESSION" text
2. ❌ Always shows generic "Enter your Host GUID token to load session details" placeholder
3. ❌ Session information available in HostController authentication response but not displayed upfront
4. ❌ No database lookup for session information based on host token SessionID

#### **Technical Requirements**
1. Implement session information loading based on SessionID from host token (similar to UserLanding.razor pattern)
2. Add API endpoint or enhance existing authentication to return session details upfront
3. Display actual session name instead of "HOST SESSION"
4. Display session description instead of generic placeholder text
5. Add comprehensive debug logging for session information retrieval
6. Follow same pattern as UserLanding.razor LoadSessionInfoAsync implementation

#### **Similar Issue Reference**
- **Issue-102**: Successfully fixed session name display for UserLanding.razor with database-driven session information
- **Implementation Pattern**: Use `/api/participant/session/{token}/validate` pattern for hosts

#### **Technical Context**
- HostController already returns session information in authentication response via `HostSessionInfo`
- HostLanding.razor has `SessionName` and `SessionDescription` properties ready for binding
- Need to load session information BEFORE authentication, similar to UserLanding.razor approach

#### **Implementation Summary**
✅ **SUCCESSFULLY IMPLEMENTED**: HostLanding.razor now displays database-driven session information

#### **What Was Fixed**
1. ✅ **Added Session Validation API**: Created `/api/host/session/{hostGuid}/validate` endpoint in HostController
2. ✅ **Implemented Session Info Loading**: Added LoadSessionInfoAsync method following UserLanding.razor pattern
3. ✅ **URL Parameter Support**: HostLanding.razor now accepts HostGuid as URL parameter `/host/landing/{hostGuid?}`
4. ✅ **Dynamic Session Display**: Session name and description now loaded from database instead of hardcoded values
5. ✅ **Comprehensive Debug Logging**: Added detailed logging across all layers for session loading diagnostics
6. ✅ **Pre-Authentication Loading**: Session info loads before authentication for better user experience

#### **Technical Implementation Details**
1. ✅ Created `HostSessionValidationResponse` class for API response structure
2. ✅ Added `ValidateHostSession` method to HostController for session lookup by HostGuid
3. ✅ Implemented `LoadSessionInfoAsync` in HostLanding.razor for database session retrieval
4. ✅ Added URL parameter `HostGuid` to support direct session linking
5. ✅ Enhanced authentication flow to load session info before/during authentication
6. ✅ Added comprehensive debug logging with request IDs for troubleshooting

#### **User Experience Improvements**
✅ **Session Title Display**: Shows actual session name from database instead of "HOST SESSION"  
✅ **Session Description Display**: Shows session description from database instead of generic placeholder  
✅ **Pre-Loading Support**: Session info loads immediately when HostGuid provided via URL  
✅ **Real-time Updates**: Session info updates during authentication process  
✅ **Error Handling**: Graceful fallback messages when session info unavailable  

#### **Debug Logging Enhancement**
✅ All operations include request ID tracking for comprehensive debugging  
✅ Session validation API calls logged with response status and content  
✅ Authentication flow enhanced with detailed logging at each step  
✅ Error scenarios logged with appropriate warning/error levels

### **Issue-101: UserLanding.razor Conditional Display Logic Missing**
**Created**: September 16, 2025  
**Priority**: HIGH  
**Status**: ACTIVE  
**Reporter**: User Feedback  

#### **Problem Description**
UserLanding.razor currently shows registration form regardless of token presence/validity. Should conditionally display:
1. **Token Entry Form** (when no token or invalid token)
2. **Registration Form** (when valid token provided)

#### **Expected Behavior**
- **CASE 1**: No token or invalid token → Show UserLanding-Guid.html layout (token entry)
- **CASE 2**: Valid token → Show UserLanding-Reg.html layout (registration form)

#### **Current Issues**
1. ❌ Always shows registration form regardless of token state
2. ❌ No conditional logic for token validation state
3. ❌ Missing token entry UI for invalid/missing tokens
4. ❌ Not matching exact mock layouts (UserLanding-Guid.html vs UserLanding-Reg.html)

#### **Technical Requirements**
1. Implement conditional rendering based on `hasValidToken` state
2. Create token entry form matching UserLanding-Guid.html exactly
3. Update registration form to match UserLanding-Reg.html exactly
4. Add comprehensive token validation logic with proper error handling
5. Add debug logging for token validation flow

#### **Mock References**
- Token Entry Layout: `Mocks/UserLanding-Guid.html`
- Registration Layout: `Mocks/UserLanding-Reg.html`

#### **Edge Cases Identified**
1. User enters URL without token
2. User enters URL with invalid/expired token
3. User enters URL with valid token
4. Token validation API failure scenarios
5. Network connectivity issues during validation

#### **Implementation Plan**
1. ✅ Add `hasValidToken` boolean state variable
2. ✅ Create conditional rendering logic in the noor-inner-card div
3. ✅ Implement TokenEntryForm component matching UserLanding-Guid.html
4. ✅ Update RegistrationForm component to match UserLanding-Reg.html
5. ✅ Add comprehensive logging and error handling
6. ⚠️ Test all token validation scenarios (pending user approval)

#### **Implementation Status: RESOLVED - Awaiting User Testing**
**Resolved Date**: September 16, 2025  
**Changes Made**:
1. ✅ Added conditional UI state logic (`showTokenEntry`, `hasValidToken`)
2. ✅ Implemented `DetermineUIState()` method with comprehensive token validation
3. ✅ Added token entry form matching UserLanding-Guid.html layout exactly
4. ✅ Updated registration form to match UserLanding-Reg.html layout exactly
5. ✅ Added `ValidateTokenInput()` method for user-entered tokens
6. ✅ Implemented comprehensive ISSUE-101 prefixed logging throughout
7. ✅ Added Tailwind-style CSS classes for exact mock matching
8. ✅ Added proper error handling for all validation scenarios

---

## 📋 **ISSUE MANAGEMENT**

### **Issue Status Definitions**
- **ACTIVE**: Currently being worked on
- **PENDING**: Awaiting user approval or clarification
- **RESOLVED**: Fixed and tested (awaiting user confirmation)
- **COMPLETED**: User-confirmed as resolved
- **ARCHIVED**: Historical reference

### **Priority Levels**
- **CRITICAL**: Blocks core functionality
- **HIGH**: Affects user experience significantly
- **MEDIUM**: Nice to have improvements
- **LOW**: Future enhancements

### **Issue Lifecycle**
1. **Report** → Issue identified and documented
2. **Analyze** → Technical investigation and planning
3. **Implement** → Code changes and testing
4. **Review** → Internal validation
5. **Resolve** → Mark as resolved (awaiting user approval)
6. **Complete** → User confirms resolution

---

## 📚 **HISTORICAL ISSUES** (For Reference)

*Historical issues will be moved here once resolved and completed*

---

## 🔧 **DEBUG & LOGGING STANDARDS**

### **Logging Prefixes for Issue Tracking**
- `ISSUE-101-DEBUG:` - UserLanding token validation debugging
- `ISSUE-101-TOKEN:` - Token state and validation logging
- `ISSUE-101-UI:` - UI state and rendering logging
- `ISSUE-101-ERROR:` - Error conditions and handling

### **Debug Guidelines**
1. Add comprehensive console logging for all state changes
2. Log token validation attempts and results
3. Log UI rendering decisions (which form to show)
4. Log API calls and responses
5. Log error conditions with sufficient context

---

## 🎯 **IMMEDIATE ACTION ITEMS**

### **Issue-101 Implementation Tasks**
- [ ] Add conditional rendering logic to UserLanding.razor
- [ ] Create TokenEntryForm matching UserLanding-Guid.html
- [ ] Update RegistrationForm to match UserLanding-Reg.html exactly
- [ ] Implement comprehensive token validation
- [ ] Add debug logging throughout validation flow
- [ ] Test all edge cases and error scenarios
- [ ] Update CSS classes to match Tailwind mock styling

**Estimated Effort**: 2-3 hours  
**Dependencies**: Access to mock HTML files for exact styling reference  
**Testing Required**: All token validation scenarios, UI rendering, form submissions

---

## 🔴 **CRITICAL ACTIVE ISSUES**

### **Issue-103: NCB Command Not Working Globally in PowerShell**
**Created**: September 17, 2025  
**Resolved**: September 17, 2025  
**Priority**: MEDIUM  
**Status**: ✅ COMPLETED  
**Reporter**: User Terminal Error  

#### **Problem Description**
The `ncb` command fails to run globally in PowerShell with error "The term 'ncb' is not recognized as the name of a cmdlet, function, script file, or operable program." User expects `ncb` to work from any directory like the `nc` command does.

#### **Error Details**
```
PS D:\PROJECTS\NOOR CANVAS> ncb
ncb : The term 'ncb' is not recognized as the name of a cmdlet, function, script file, or operable program. 
Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
At line:1 char:1
+ ncb
+ ~~~
    + CategoryInfo          : ObjectNotFound: (ncb:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException
```

#### **Expected Behavior**
- `ncb` command should work globally from any PowerShell directory
- Should function similarly to how `nc` command works
- Should execute the Noor Canvas Build functionality

#### **Technical Investigation Needed**
1. Check if `ncb.bat` or `ncb.cmd` files exist in system PATH
2. Verify PowerShell profile includes `ncb` in global commands
3. Compare `ncb` setup with working `nc` command configuration
4. Ensure PATH registration includes `ncb` command location

#### **Root Cause Analysis**
- **Likely**: Missing `ncb.bat`/`ncb.cmd` wrapper files in PATH directory
- **Possible**: PowerShell profile not updated to include `ncb` command
- **Possible**: Incorrect PATH registration for global command access

#### **Implementation Plan**
1. Investigate current global command setup for `nc` vs `ncb`
2. Create or fix `ncb.bat`/`ncb.cmd` wrapper files if missing
3. Update PowerShell profile to include `ncb` in global commands
4. Test `ncb` command execution from various directories
5. Ensure consistent behavior with other global commands (nc, nct, ncdoc)

**Estimated Effort**: 1-2 hours  
**Dependencies**: PowerShell profile access, PATH configuration  
**Testing Required**: Global command execution from multiple directories

#### **Final Resolution**
✅ **SUCCESSFULLY RESOLVED**: `ncb` command is now working globally in PowerShell and can be executed from any directory.

#### **Root Cause Analysis - RESOLVED**
1. ✅ **Identified**: Missing `ncb` function definition in PowerShell profile
2. ✅ **Found**: Other commands (`nc`, `nct`, `ncdoc`) were properly defined, but `ncb` was missing
3. ✅ **Confirmed**: Wrapper files (`ncb.ps1`, `ncb.bat`, `ncb.cmd`) existed but weren't accessible globally
4. ✅ **Discovered**: PowerShell profile displayed "ncb" in loaded commands message but function was missing

#### **Implementation COMPLETED**
1. ✅ Added missing `ncb` function definition to PowerShell profile:
   ```powershell
   function ncb {
       & "D:\PROJECTS\NOOR CANVAS\Workspaces\Global\ncb.ps1" @args
   }
   ```
2. ✅ Reloaded PowerShell profile to apply changes
3. ✅ Tested `ncb` command execution - successfully builds and runs application
4. ✅ Verified consistent behavior with other global commands

#### **Testing Results - ALL PASSED**
✅ **Command Recognition**: `Get-Command ncb` now returns Function type  
✅ **Global Execution**: `ncb` command works from any PowerShell directory  
✅ **Build Functionality**: `ncb` successfully builds NOOR Canvas application  
✅ **Server Launch**: Application starts on HTTP (9090) and HTTPS (9091) ports  
✅ **Consistent Behavior**: Matches functionality of `nc`, `nct`, and `ncdoc` commands

**Final Outcome**: User can now run `ncb` command globally from any PowerShell window to build and run the NOOR Canvas application, achieving full parity with other global commands.

---

### **Issue-102: Session Name Mismatch for SessionID 213 with Token BXYKDPDL**
**Created**: September 17, 2025  
**Resolved**: September 17, 2025  
**Priority**: HIGH  
**Status**: ✅ COMPLETED  
**Reporter**: User Bug Report  

#### **Problem Description**
SessionID 213 (matching token BXYKDPDL) displays incorrect session name. Expected "Islamic Art & Calligraphy Session" but database shows "Character of the prophet".

#### **Final Resolution**
✅ **SUCCESSFULLY RESOLVED**: Token BXYKDPDL now correctly displays database-driven session name "Character of the prophet" instead of hardcoded value.

#### **Database Investigation Results**
- **Corrected SessionID**: 228 (not 213 as originally reported)
- **Actual Session Name** (from database): "Character of the prophet" 
- **Token**: BXYKDPDL (maps to SessionID 228, not 213)
- **Database Record**: Confirmed authentic Islamic session content

#### **Root Cause Analysis - RESOLVED**
1. ✅ **Fixed**: Hardcoded session name in UserLanding.razor replaced with dynamic API lookup
2. ✅ **Implemented**: Dynamic session name retrieval from database via `/api/participant/session/{token}/validate`
3. ✅ **Corrected**: Token BXYKDPDL maps to SessionID 228 with title "Character of the prophet"
4. ✅ **Resolved**: Now displays authentic database content instead of hardcoded values

#### **Implementation COMPLETED**
1. ✅ Added comprehensive debug logging to session name retrieval in UserLanding.razor
2. ✅ Implemented dynamic session name lookup from database via API integration
3. ✅ Removed hardcoded session names from UserLanding.razor
4. ✅ Fixed JSON model (SessionInfo.MaxParticipants nullable) to handle API responses
5. ✅ Added extensive session resolution flow logging with NOOR-DEBUG prefixes

#### **Technical Changes Made**
- **UserLanding.razor**: Complete refactoring from hardcoded to dynamic session resolution
- **API Integration**: HTTP client calls to session validation endpoint with error handling  
- **JSON Models**: SessionValidationResponse, SessionInfo, ParticipantInfo classes
- **Logging**: Comprehensive debug logging throughout session resolution flow

#### **Testing Results - ALL PASSED**
✅ **API Response**: Successfully returns session metadata with title "Character of the prophet"  
✅ **JSON Deserialization**: Fixed nullable MaxParticipants handles null values correctly  
✅ **UI Display**: Session name now dynamically shows "Character of the prophet"  
✅ **End-to-End Flow**: Complete database → API → UI integration working  
✅ **Debug Logging**: Comprehensive session resolution tracking implemented

**Final Outcome**: User now sees authentic database session title "Character of the prophet" for token BXYKDPDL, replacing hardcoded session names with dynamic database-driven content.