# TODO: User GUID Missing in NC Output

**Issue ID:** TODO-002  
**Status:** In Progress  
**Priority:** Medium  
**Category:** Command Interface  
**Created:** 2025-09-15  

## Problem Description

When running `nc 215`, the Host GUID is displayed but the User GUID is not shown in the output, even though:
1. The `--create-user` flag is being passed to HostProvisioner
2. Users ARE being created in the database (verified in canvas.Users table)
3. The HostProvisioner logs "Sample User ID: {UserId}" but this is not captured/displayed by nc.ps1

## Current Behavior

```
✅ Host GUID Generated Successfully!
===================================
📊 Session ID: 215
🆔 Host GUID: 1467f0ae-0c7b-413b-bff3-76f617c9da82
🔢 Host Session ID: 20
⏰ Generated: 2025-09-15 09:06:34 UTC
💾 Database: ✅ Saved to canvas.HostSessions
```

## Expected Behavior

```
✅ Host GUID Generated Successfully!
===================================
📊 Session ID: 215
🆔 Host GUID: 1467f0ae-0c7b-413b-bff3-76f617c9da82
🆔 Sample User ID: e10f5752-4e8b-445d-b516-3dc2e91d97a3
🔢 Host Session ID: 20
⏰ Generated: 2025-09-15 09:06:34 UTC
💾 Database: ✅ Saved to canvas.HostSessions
```

## Technical Analysis

1. **HostProvisioner Output Modes:**
   - Interactive mode (`--created-by "Interactive User"`): Calls DisplayGuidWithPause() with emoji formatting
   - Non-interactive mode (`--created-by "NC Global Command"`): Uses Log.Information() output only

2. **NC Script Issue:**
   - nc.ps1 captures HostProvisioner output with `& dotnet run -- create --session-id $SessionId --created-by "NC Global Command" --dry-run false --create-user 2>&1 | Out-String`
   - Regex pattern `"Sample User ID:\s*([0-9a-fA-F\-]{36})"` should match Log.Information output
   - DisplayGuidWithPause() is not called in non-interactive mode, so emoji output doesn't include User GUID

## Root Cause

The issue is that the formatted emoji output (DisplayGuidWithPause) doesn't include the User GUID, only the plain Log.Information output does. Since nc.ps1 gets the emoji formatted output when run interactively, the User GUID line is missing from the display.

## Solution Options

1. **Option A:** Modify DisplayGuidWithPause() to include User GUID when available
2. **Option B:** Modify nc.ps1 to parse both log output and formatted output  
3. **Option C:** Change HostProvisioner to always output User GUID in formatted display

## Database Verification

Confirmed Users are being created successfully:
- User `e10f5752-4e8b-445d-b516-3dc2e91d97a3` (from nc 215 run)
- User `f4681a38-23c5-4b7a-aed1-c11128196ded` (from direct test)

## Next Steps

1. Implement Option A: Add User GUID to DisplayGuidWithPause() method
2. Clean up Unicode characters from HostProvisioner output
3. Test nc 215 output includes User GUID
4. Update nc.ps1 regex patterns if needed

## Acceptance Criteria

- [ ] `nc 215` displays both Host GUID and User GUID
- [ ] User GUID is properly formatted in emoji output
- [ ] Database records are created correctly for both Host and User
- [ ] No Unicode encoding issues in PowerShell output
