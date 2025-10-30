# Quick-Provision-ps1 Plan

**Created:** 2025-10-26  
**Status:** Draft  
**Purpose:** PowerShell script for quick Host Provisioner session reset and token generation

## Overview

Create a lightweight PowerShell script (`Quick-Provision.ps1`) that replicates the Host Provisioner GUI functionality from the command line. The script will:

1. Accept a SessionId parameter
2. Reset canvas schema data for that session (clear participants, session data)
3. Generate fresh host and user tokens
4. Display clickable URLs for immediate host access

## User Request

> I'm asking for a quick way to do what host provisioner GUI does in a powershell window. The tool should reset the canvas schema relevant data for the provided sessionid (parameter) and then present the host and user token with links to launch the host view with the token attached.

## Requirements

### Core Functionality
- **Input**: SessionId (required parameter)
- **Database Operations**:
  - Clear `canvas.Participants` for the given SessionId
  - Clear `canvas.SessionData` for the given SessionId  
  - Update or create `canvas.Sessions` record with fresh tokens
- **Token Generation**: Generate 8-character alphanumeric host and user tokens
- **Output**: Display formatted results with:
  - Host Token + URL
  - User Token + URL
  - Clickable links for immediate use

### Technical Approach

Since PowerShell cannot directly invoke C# services like `SimplifiedTokenService`, the script will use one of these approaches:

**Option 1: Call existing HostProvisioner.exe** (Recommended)
- Execute `dotnet run` in HostProvisioner directory with CLI arguments
- Parse console output to extract tokens and URLs
- Format and display results

**Option 2: SQL-based approach**
- Execute SQL commands to clear data tables
- Generate tokens via SQL (random alphanumeric strings)
- Update `canvas.Sessions` table directly
- Build URLs from generated tokens

## Implementation Plan

### Phase 1: Script Foundation
1. Create `Scripts/Quick-Provision.ps1`
2. Define parameter handling:
   ```powershell
   param(
       [Parameter(Mandatory=$true)]
       [int]$SessionId,
       
       [Parameter(Mandatory=$false)]
       [string]$Environment = "Development"
   )
   ```
3. Load connection string from `config/sharedsettings.json`

### Phase 2: Database Reset
1. Connect to SQL Server using connection string
2. Execute DELETE commands:
   ```sql
   DELETE FROM canvas.Participants WHERE SessionId = @SessionId
   DELETE FROM canvas.SessionData WHERE SessionId = @SessionId
   ```
3. Display deletion counts

### Phase 3: Token Generation (via HostProvisioner)
1. Build command: `dotnet run --project Tools/HostProvisioner/HostProvisioner create --session-id $SessionId`
2. Capture stdout from HostProvisioner execution
3. Parse output for:
   - Host Token (regex: `Host Token: ([A-Z0-9]{8})`)
   - User Token (regex: `User Token: ([A-Z0-9]{8})`)
   - Host URL (regex: `Host URL: (.+)`)
   - Participant URL (regex: `Participant URL: (.+)`)

### Phase 4: Display Results
1. Format output with color coding:
   - Green for success messages
   - Yellow for tokens
   - Cyan for URLs
2. Display clickable URLs (VS Code terminal supports Ctrl+Click)
3. Summary table format:
   ```
   ========================================
   Session Provisioned: 212
   ========================================
   Host Token:  PQ9N5YWW
   Host URL:    https://noorcanvas.kashkole.com/host/PQ9N5YWW
   
   User Token:  ZQPX29ZP
   User URL:    https://noorcanvas.kashkole.com/user/landing/ZQPX29ZP
   ========================================
   ```

### Phase 5: Error Handling
1. Validate SessionId exists in KSESSIONS
2. Check for transcripts (same validation as HostProvisioner)
3. Handle database connection errors
4. Parse HostProvisioner errors from stdout

### Phase 6: Documentation
1. Add usage examples to script header
2. Update `Scripts/NCDEPLOY-QUICK-REFERENCE.md` with new script
3. Add to VS Code tasks (optional)

## File Locations

### New Files
- `Scripts/Quick-Provision.ps1` - Main PowerShell script

### Referenced Files
- `config/sharedsettings.json` - Database connection strings
- `Tools/HostProvisioner/HostProvisioner/Program.cs` - Token generation logic (invoked via dotnet run)
- `SPA/NoorCanvas/Services/SimplifiedTokenService.cs` - Token generation service (used by HostProvisioner)

## Testing Strategy

### Test Cases
1. **Valid Session**: Session 212 (known to have transcripts)
2. **Invalid Session**: Non-existent SessionId
3. **No Transcripts**: SessionId without transcript data
4. **Re-provision**: Running script multiple times on same SessionId

### Validation Steps
1. Verify data cleared: Query `canvas.Participants` and `canvas.SessionData` after execution
2. Verify tokens generated: Check `canvas.Sessions` table for new tokens
3. Verify URLs work: Click host URL and confirm page loads
4. Compare with GUI: Ensure script output matches HostProvisioner GUI behavior

## Dependencies

- PowerShell 5.1+ or PowerShell Core 7+
- .NET 8.0 SDK (for running HostProvisioner)
- SQL Server connection to KSESSIONS_DEV (Development) or KSESSIONS (Production)
- HostProvisioner.csproj and dependencies built

## Success Criteria

✅ Script accepts SessionId parameter  
✅ Clears canvas.Participants and canvas.SessionData tables  
✅ Generates fresh host and user tokens (8 characters each)  
✅ Displays formatted output with clickable URLs  
✅ Handles errors gracefully (invalid session, no transcripts, etc.)  
✅ Execution time < 5 seconds for typical session  
✅ Works in both Development and Production environments  

## Future Enhancements

- Add `-CreatedBy` parameter for audit tracking
- Support `-ExpiresAt` parameter for custom token expiration
- Add `-OpenBrowser` switch to automatically launch host URL
- Create VS Code task for common sessions
- Add output to JSON for scripting integration
