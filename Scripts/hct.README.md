# hct.ps1 (Host Canvas Tool)

PowerShell script for rapid NOOR Canvas session provisioning from the command line.

## Purpose

Replaces the Host Provisioner GUI with a fast command-line tool that:
1. Resets canvas schema data for a session (clears participants and session data)
2. Generates fresh host and user tokens
3. Displays clickable URLs for immediate host access

## Quick Start

**Global command** (works from any directory):
```powershell
hct 212
```

**Direct script execution**:
```powershell
.\Scripts\hct.ps1 -SessionId 212
```

## Parameters

### Required
- **`-SessionId`** (int): Session ID from KSESSIONS database to provision

### Optional
- **`-Environment`** (string): Target environment - "Development" or "Production" (default: Development)
  - **Development**: Uses KSESSIONS_DEV database and https://localhost:9091
  - **Production**: Uses KSESSIONS database and https://noorcanvas.kashkole.com
- **`-CreatedBy`** (string): Person provisioning (for audit tracking, defaults to current Windows user)
- **`-OpenBrowser`** (switch): Automatically open host URL in default browser

## Usage Examples

### Basic Provisioning
```powershell
# Global command (recommended)
hct 212

# Or direct script
.\Scripts\hct.ps1 -SessionId 212
```

### Production Environment
```powershell
hct 215 -Environment Production
```

### With Audit Tracking
```powershell
hct 212 -CreatedBy "John Doe"
```

### Auto-Open in Browser
```powershell
hct 212 -OpenBrowser
```

### Show Help
```powershell
hct -Help
```

## Output Example

```
========================================
 HCT - Host Canvas Tool
========================================
SessionId:   212
Environment: Development
Database:    KSESSIONS_DEV
Base URL:    https://localhost:9091
Created By:  asifh
========================================

🔧 Configuring Development environment...
   → Database: KSESSIONS_DEV
   → Base URL: https://localhost:9091

🚀 Invoking HostProvisioner...

========================================
 ✅ Session Provisioned Successfully
========================================

📊 Data Reset:
   Participants cleared: 1
   Session data cleared: 0

🎫 Host Access:
   Token: NV9YKNJB
   URL:   https://localhost:9091/host/NV9YKNJB

👥 Participant Access:
   Token: KPUH2ITQ
   URL:   https://localhost:9091/user/landing/KPUH2ITQ

========================================
💡 Tip: Ctrl+Click URLs to open in browser
========================================
```

## What It Does

1. **Validates Session**
   - Checks session exists in KSESSIONS (Production) or KSESSIONS_DEV (Development) database
   - Verifies session has transcripts (required for annotations)

2. **Clears Canvas Data**
   - Deletes all records from `canvas.Participants` for the session
   - Deletes all records from `canvas.SessionData` for the session
   - Ensures fresh session state for testing/restarting

3. **Generates Tokens**
   - Creates 8-character alphanumeric host token
   - Creates 8-character alphanumeric user token
   - Updates `canvas.Sessions` table with new tokens
   - Sets 24-hour expiration

4. **Displays Results**
   - Shows cleanup statistics (participants/data cleared)
   - Shows formatted tokens with environment-appropriate URLs
   - **Development**: https://localhost:9091/host/{token}
   - **Production**: https://noorcanvas.kashkole.com/host/{token}
   - Color-coded output (green=success, yellow=tokens, blue=URLs)

## Error Handling

The script gracefully handles:
- ❌ Invalid SessionId (doesn't exist in KSESSIONS)
- ❌ Session without transcripts
- ❌ Database connectivity issues
- ❌ HostProvisioner build/execution errors

All errors display in red with descriptive messages.

## Technical Details

### Implementation
The script is a PowerShell wrapper that invokes the existing HostProvisioner CLI:

```powershell
dotnet run --project Tools/HostProvisioner/HostProvisioner `
    -- create --session-id $SessionId --created-by $CreatedBy
```

This approach:
- ✅ Reuses existing C# token generation logic (`SimplifiedTokenService`)
- ✅ Maintains same validation rules (session exists, has transcripts)
- ✅ Performs same cleanup operations
- ✅ No code duplication
- ✅ Consistent behavior with GUI and CLI versions

### Database Operations
Tables affected:
- `canvas.Participants` - Cleared for session
- `canvas.SessionData` - Cleared for session
- `canvas.Sessions` - Updated with new tokens and metadata

Tables queried (environment-dependent):
- **Development**: `KSESSIONS_DEV.dbo.Sessions` - Validate SessionId exists
- **Development**: `KSESSIONS_DEV.dbo.SessionTranscripts` - Verify transcripts available
- **Production**: `KSESSIONS.dbo.Sessions` - Validate SessionId exists
- **Production**: `KSESSIONS.dbo.SessionTranscripts` - Verify transcripts available

### Environment Configuration
The script automatically configures the HostProvisioner based on the `-Environment` parameter:

**Development** (default):
- Database: KSESSIONS_DEV
- Base URL: https://localhost:9091
- appsettings: appsettings.json
- Use Case: Local testing, development sessions

**Production**:
- Database: KSESSIONS
- Base URL: https://noorcanvas.kashkole.com
- appsettings: appsettings.Production.json
- Use Case: Live Islamic learning sessions

## Requirements

- PowerShell 5.1+ or PowerShell Core 7+
- .NET 8.0 SDK (for running HostProvisioner)
- SQL Server connection to KSESSIONS_DEV (Development) or KSESSIONS (Production)
- HostProvisioner project built (handled automatically by `dotnet run`)

## Performance

- **Execution Time**: ~2 seconds (vs 10+ seconds for GUI startup)
- **Network**: No additional network calls (reuses HostProvisioner)
- **Resources**: Lightweight, command-line only

## Comparison with GUI

| Feature | Quick-Provision.ps1 | HostProvisioner GUI |
|---------|---------------------|---------------------|
| Startup Time | ~2 seconds | ~10 seconds |
| Interface | Command Line | Graphical |
| Scripting | ✅ Yes | ❌ No |
| Remote Use | ✅ SSH/PowerShell | ❌ RDP only |
| Copy Tokens | Easy (select text) | Click to copy |
| Automation | ✅ CI/CD Ready | ❌ Manual only |

## Related Documentation

- **Planning**: `.github/key-data-streams/quick-provision-ps1/quick-provision-ps1.plan.md`
- **Work Log**: `.github/key-data-streams/quick-provision-ps1/work-log.md`
- **Quick Reference**: `Scripts/NCDEPLOY-QUICK-REFERENCE.md`
- **HostProvisioner**: `Tools/HostProvisioner/README.md`

## Troubleshooting

### Script Not Found
```powershell
# Ensure you're in the project root
cd "D:\PROJECTS\NOOR CANVAS"
.\Scripts\hct.ps1 -SessionId 212
```

### HostProvisioner Errors
Check that HostProvisioner builds correctly:
```powershell
cd Tools/HostProvisioner/HostProvisioner
dotnet build
```

### Database Connection Errors
Verify connection strings in `config/sharedsettings.json` or `config/sharedsettings.local.json`

### Invalid Session
Use a valid session from KSESSIONS database:
```sql
USE KSESSIONS_DEV;
SELECT TOP 10 SessionId, Description 
FROM dbo.Sessions 
WHERE SessionId IN (
    SELECT DISTINCT SessionId FROM dbo.SessionTranscripts
)
ORDER BY SessionId DESC;
```

## Future Enhancements

Potential additions (not yet implemented):
- Add `-ExpiresAt` parameter for custom token expiration
- Add `-DryRun` switch to preview changes without committing
- Output to JSON format for script integration
- Batch provisioning (multiple SessionIds in one call)
- VS Code task integration for one-click provisioning
- Auto-detect environment based on current git branch

## Support

For issues or questions:
1. Check `.github/key-data-streams/quick-provision-ps1/work-log.md` for implementation details
2. Review `Tools/HostProvisioner/README.md` for underlying CLI behavior
3. Verify database connectivity and session validity in KSESSIONS
