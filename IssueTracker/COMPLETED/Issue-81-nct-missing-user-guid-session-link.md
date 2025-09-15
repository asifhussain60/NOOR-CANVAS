# Issue-81: NCT Command Missing User GUID and Session Link Output

**Issue ID:** Issue-81  
**Status:** COMPLETED  
**Priority:** Critical  
**Category:** Command Interface Bug  
**Created:** 2025-09-15  
**Resolved:** 2025-09-15  

## Problem Description

The `nct` command only displays Host GUID information but is missing the User Session GUID and Participant Session Link that should be shown. The user ran `nct` and received incomplete output.

## Current Behavior (Broken)

```
Host GUID Generated Successfully!
===================================
Session ID: 215
Host GUID: 703d989a-14e0-4c97-b1ed-e107a5923c11
Host Session ID: 20
Generated: 2025-09-15 10:04:15 UTC
Database: Saved to canvas.HostSessions

Copy the Host GUID above to use for authentication.
The GUIDs are stored securely in the database.
```

## Expected Behavior (Working in nc command)

```
Host GUID Generated Successfully!
===================================
Session ID: 215
Host GUID: 703d989a-14e0-4c97-b1ed-e107a5923c11
User Session GUID: F1FA9B9E-1D1B-4A52-805C-34AFC12741F7
Host Session ID: 20
Generated: 2025-09-15 10:04:15 UTC
Database: Saved to canvas.HostSessions

Participant Session Link:
https://localhost:9091/join/429B9099-2524-4E09-80DA-90C5B30AE6E9?userGuid=F1FA9B9E-1D1B-4A52-805C-34AFC12741F7

Copy the Host GUID above to use for authentication.
Share the Participant Session Link with users to join.
The GUIDs are stored securely in the database.
```

## Root Cause Analysis

The issue appears to be that:

1. **nct vs nc Command Difference**: `nc` command calls HostProvisioner with `--create-user` flag, `nct` likely doesn't
2. **HostProvisioner Flags**: `nct` may not be passing the `--create-user` and `--create-registration` flags
3. **Output Format**: `nct` may be using interactive mode which doesn't include User GUID in DisplayGuidWithPause method

## Technical Analysis

Need to investigate:
- `nct.ps1` script implementation vs `nc.ps1`  
- How `nct` calls HostProvisioner (flags missing?)
- Whether `nct` creates Users and SessionLinks in database
- Output formatting differences between interactive and non-interactive modes

## Impact

**High Impact:**
- Users expect `nct` to provide complete session setup (both Host and User GUIDs)
- Missing Participant Session Link prevents easy user onboarding
- Inconsistent behavior between `nc` and `nct` commands
- Reduces usability for session hosts who need to invite participants

## Acceptance Criteria

- [x] `nct` command displays User Session GUID when creating sessions
- [x] `nct` command displays Participant Session Link with User GUID attached  
- [x] `nct` command creates User and SessionLink records in database
- [x] `nct` output matches `nc` output format for consistency
- [x] Both Host GUID and User Session GUID are functional
- [x] Additional debug logging added to trace the issue

## Resolution Summary

**Issue Fixed:** Updated `nct.ps1` script to include User GUID and Participant Session Link functionality.

**Root Cause:** The `nct` command was calling HostProvisioner without the `--create-user` flag, unlike the `nc` command.

**Solution Applied:**
1. **Updated HostProvisioner Call:** Modified `nct.ps1` to call HostProvisioner with `--create-user` flag: 
   ```powershell
   $provisionerOutput = & dotnet run -- create --session-id $SessionId --created-by "NC Global Command" --dry-run false --create-user 2>&1 | Out-String
   ```

2. **Added User GUID Parsing:** Added regex parsing to extract User GUID from HostProvisioner output:
   ```powershell
   if ($provisionerOutput -match "User GUID:\s*([0-9a-fA-F\-]{36})") {
       $userGuid = $matches[1]
   }
   ```

3. **Added Participant URL Parsing:** Added regex parsing to extract Participant URL from HostProvisioner output:
   ```powershell
   if ($provisionerOutput -match "Participant URL:\s*(https?://[^\s]+)") {
       $participantUrl = $matches[1]
   }
   ```

4. **Enhanced Output Display:** Added formatted output display matching `nc` command style:
   - Host Session GUID display
   - User Session GUID display  
   - Participant Session Link display
   - Instructional messages for usage

5. **Updated Help Documentation:** Updated help text to reflect new User GUID and Participant URL functionality.

**Testing:** The fix ensures `nct` command now provides the same comprehensive output as `nc` command, creating Users, Registrations, and SessionLinks in the database while displaying all necessary information for session management.

## Investigation Steps

1. Compare `nct.ps1` vs `nc.ps1` implementations
2. Check HostProvisioner call differences  
3. Verify database record creation
4. Add debug logging to trace execution path
5. Test fix with actual session creation

## Notes

- This issue was discovered after successfully implementing User GUID and Session Link generation in `nc` command
- The `nc` command works correctly and generates all required data
- Need to ensure `nct` has same functionality as `nc` for consistency
