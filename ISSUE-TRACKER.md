# NOOR Canvas Issue Tracker

**Last Updated**: September 16, 2025  
**Status**: Active Development Issues  
**Purpose**: Track and manage implementation issues, bugs, and feature requests

---

## 🔴 **CRITICAL ACTIVE ISSUES**

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