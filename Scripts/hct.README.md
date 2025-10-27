# hct.ps1 (Host Canvas Tool)# hct.ps1 (Host Canvas Tool)



PowerShell script for launching the NOOR Canvas application in a separate window.PowerShell script for rapid NOOR Canvas session provisioning from the command line.



## Purpose## Purpose



Simplified tool that:Replaces the Host Provisioner GUI with a fast command-line tool that:

1. Stops any existing NoorCanvas processes1. Resets canvas schema data for a session (clears participants and session data)

2. Cleans up ports 9091 and 90902. Generates fresh host and user tokens

3. Launches the NoorCanvas application in a separate window3. Displays clickable URLs for immediate host access

4. Waits for the application to be ready

## Quick Start

## Quick Start

**Global command** (works from any directory):

**Global command** (works from any directory):```powershell

```powershellhct 212

hct```

```

**Direct script execution**:

**Direct script execution**:```powershell

```powershell.\Scripts\hct.ps1 -SessionId 212

.\Scripts\hct.ps1```

```

## Parameters

## Parameters

### Required

### Optional- **`-SessionId`** (int): Session ID from KSESSIONS database to provision

- **`-Environment`** (string): Target environment - "Development" or "Production" (default: Development)

  - **Development**: Uses https://localhost:9091### Optional

  - **Production**: Uses https://noorcanvas.kashkole.com- **`-Environment`** (string): Target environment - "Development" or "Production" (default: Development)

- **`-OpenBrowser`** (switch): Automatically open application URL in default browser after startup  - **Development**: Uses KSESSIONS_DEV database and https://localhost:9091

- **`-StartupTimeout`** (int): Maximum seconds to wait for app startup (default: 30)  - **Production**: Uses KSESSIONS database and https://noorcanvas.kashkole.com

- **`-CreatedBy`** (string): Person provisioning (for audit tracking, defaults to current Windows user)

## Usage Examples- **`-OpenBrowser`** (switch): Automatically open host URL in default browser



### Basic Launch (Development)## Usage Examples

```powershell

# Global command (recommended)### Basic Provisioning

hct```powershell

# Global command (recommended)

# Or direct scripthct 212

.\Scripts\hct.ps1

```# Or direct script

.\Scripts\hct.ps1 -SessionId 212

### Production Environment```

```powershell

hct -Environment Production### Production Environment

``````powershell

hct 215 -Environment Production

### Auto-Open in Browser```

```powershell

hct -OpenBrowser### With Audit Tracking

``````powershell

hct 212 -CreatedBy "John Doe"

### Custom Startup Timeout```

```powershell

hct -StartupTimeout 60### Auto-Open in Browser

``````powershell

hct 212 -OpenBrowser

### Show Help```

```powershell

Get-Help .\Scripts\hct.ps1 -Full### Show Help

``````powershell

hct -Help

## Output Example```



```## Output Example

========================================

 HCT - Host Canvas Tool```

================================================================================

Environment: Development HCT - Host Canvas Tool

Base URL:    https://localhost:9091========================================

========================================SessionId:   212

Environment: Development

🔍 NoorCanvas app not detected, starting...Database:    KSESSIONS_DEV

🧹 Cleaning up ports 9091 and 9090...Base URL:    https://localhost:9091

🚀 Starting NoorCanvas app in separate window...Created By:  asifh

⏳ Waiting for app to be ready...========================================

   Progress: 5/30 seconds...

✅ App ready at https://localhost:9091🔧 Configuring Development environment...

   → Database: KSESSIONS_DEV

========================================   → Base URL: https://localhost:9091

 ✅ NoorCanvas Started Successfully

========================================🚀 Invoking HostProvisioner...



🌐 Application URL:========================================

   https://localhost:9091 ✅ Session Provisioned Successfully

========================================

ℹ️  App is running in separate window (will stay open)

========================================📊 Data Reset:

   Participants cleared: 1

💡 Tip: Ctrl+Click URL to open in browser   Session data cleared: 0

========================================

```🎫 Host Access:

   Token: NV9YKNJB

## What It Does   URL:   https://localhost:9091/host/NV9YKNJB



1. **Validates Environment**👥 Participant Access:

   - Checks NoorCanvas project directory exists   Token: KPUH2ITQ

   - Sets appropriate environment variables   URL:   https://localhost:9091/user/landing/KPUH2ITQ



2. **Cleans Up Existing Processes**========================================

   - Stops any NoorCanvas processes running on ports 9091 and 9090💡 Tip: Ctrl+Click URLs to open in browser

   - Waits for processes to release resources========================================

   - Ensures clean startup```



3. **Launches Application**## What It Does

   - Starts NoorCanvas in a separate PowerShell window

   - Window stays open for console output visibility1. **Validates Session**

   - Uses `dotnet run` with environment configuration   - Checks session exists in KSESSIONS (Production) or KSESSIONS_DEV (Development) database

   - Verifies session has transcripts (required for annotations)

4. **Waits for Readiness**

   - Polls application URL until ready (default: 30 seconds)2. **Clears Canvas Data**

   - Shows progress indicator   - Deletes all records from `canvas.Participants` for the session

   - Validates application responds with HTTP 200   - Deletes all records from `canvas.SessionData` for the session

   - Ensures fresh session state for testing/restarting

5. **Displays Results**

   - Shows application URL (clickable in most terminals)3. **Generates Tokens**

   - Optionally opens URL in default browser   - Creates 8-character alphanumeric host token

   - Color-coded output (green=success, yellow=waiting, blue=URLs)   - Creates 8-character alphanumeric user token

   - Updates `canvas.Sessions` table with new tokens

## Error Handling   - Sets 24-hour expiration



The script gracefully handles:4. **Displays Results**

- ❌ NoorCanvas project not found   - Shows cleanup statistics (participants/data cleared)

- ❌ Application fails to start within timeout   - Shows formatted tokens with environment-appropriate URLs

- ❌ Port cleanup issues   - **Development**: https://localhost:9091/host/{token}

- ❌ Build errors   - **Production**: https://noorcanvas.kashkole.com/host/{token}

   - Color-coded output (green=success, yellow=tokens, blue=URLs)

All errors display in red with descriptive messages.

## Error Handling

## Technical Details

The script gracefully handles:

### Implementation- ❌ Invalid SessionId (doesn't exist in KSESSIONS)

The script launches NoorCanvas using:- ❌ Session without transcripts

- ❌ Database connectivity issues

```powershell- ❌ HostProvisioner build/execution errors

pwsh.exe -NoExit -Command "cd '$NoorCanvasPath'; $env:ASPNETCORE_ENVIRONMENT='$Environment'; dotnet run"

```All errors display in red with descriptive messages.



This approach:## Technical Details

- ✅ Launches in separate window (doesn't block terminal)

- ✅ Keeps window open for console output visibility### Implementation

- ✅ Sets environment variables appropriatelyThe script is a PowerShell wrapper that invokes the existing HostProvisioner CLI:

- ✅ Allows manual stopping (close window)

```powershell

### Port Managementdotnet run --project Tools/HostProvisioner/HostProvisioner `

Ports used:    -- create --session-id $SessionId --created-by $CreatedBy

- **9091** - Main NOOR Canvas HTTPS application```

- **9090** - Optional secondary port

This approach:

The script ensures both ports are free before starting.- ✅ Reuses existing C# token generation logic (`SimplifiedTokenService`)

- ✅ Maintains same validation rules (session exists, has transcripts)

### Environment Configuration- ✅ Performs same cleanup operations

The script automatically configures the application based on the `-Environment` parameter:- ✅ No code duplication

- ✅ Consistent behavior with GUI and CLI versions

**Development** (default):

- Base URL: https://localhost:9091### Database Operations

- Use Case: Local testing, developmentTables affected:

- `canvas.Participants` - Cleared for session

**Production**:- `canvas.SessionData` - Cleared for session

- Base URL: https://noorcanvas.kashkole.com- `canvas.Sessions` - Updated with new tokens and metadata

- Use Case: Production deployment

Tables queried (environment-dependent):

## Requirements- **Development**: `KSESSIONS_DEV.dbo.Sessions` - Validate SessionId exists

- **Development**: `KSESSIONS_DEV.dbo.SessionTranscripts` - Verify transcripts available

- PowerShell 5.1+ or PowerShell Core 7+- **Production**: `KSESSIONS.dbo.Sessions` - Validate SessionId exists

- .NET 8.0 SDK- **Production**: `KSESSIONS.dbo.SessionTranscripts` - Verify transcripts available

- NoorCanvas project at `SPA/NoorCanvas` relative to script location

### Environment Configuration

## PerformanceThe script automatically configures the HostProvisioner based on the `-Environment` parameter:



- **Startup Time**: ~5-15 seconds (depending on build cache)**Development** (default):

- **Cleanup Time**: ~3 seconds (if existing processes need stopping)- Database: KSESSIONS_DEV

- **Resources**: Full ASP.NET Core application + separate PowerShell window- Base URL: https://localhost:9091

- appsettings: appsettings.json

## Comparison with Other Launch Methods- Use Case: Local testing, development sessions



| Feature | hct.ps1 | dotnet run | VS Code Launch |**Production**:

|---------|---------|------------|----------------|- Database: KSESSIONS

| Separate Window | ✅ Yes | ❌ No | ❌ No |- Base URL: https://noorcanvas.kashkole.com

| Auto Cleanup | ✅ Yes | ❌ No | ❌ No |- appsettings: appsettings.Production.json

| Readiness Check | ✅ Yes | ❌ No | ⚠️ Partial |- Use Case: Live Islamic learning sessions

| Clickable URL | ✅ Yes | ❌ No | ✅ Yes |

| Quick Access | ✅ Yes | ⚠️ Manual | ⚠️ IDE Only |## Requirements



## Troubleshooting- PowerShell 5.1+ or PowerShell Core 7+

- .NET 8.0 SDK (for running HostProvisioner)

### Script Not Found- SQL Server connection to KSESSIONS_DEV (Development) or KSESSIONS (Production)

```powershell- HostProvisioner project built (handled automatically by `dotnet run`)

# Ensure you're in the project root

cd "D:\PROJECTS\NOOR CANVAS"## Performance

.\Scripts\hct.ps1

```- **Execution Time**: ~2 seconds (vs 10+ seconds for GUI startup)

- **Network**: No additional network calls (reuses HostProvisioner)

### Application Won't Start- **Resources**: Lightweight, command-line only

Check the separate PowerShell window for error messages:

- Build errors## Comparison with GUI

- Port conflicts

- Configuration issues| Feature | Quick-Provision.ps1 | HostProvisioner GUI |

|---------|---------------------|---------------------|

### Port Already in Use| Startup Time | ~2 seconds | ~10 seconds |

The script automatically cleans up ports, but if issues persist:| Interface | Command Line | Graphical |

```powershell| Scripting | ✅ Yes | ❌ No |

# Manually find and kill processes on port 9091| Remote Use | ✅ SSH/PowerShell | ❌ RDP only |

Get-NetTCPConnection -LocalPort 9091 | ForEach-Object {| Copy Tokens | Easy (select text) | Click to copy |

    Stop-Process -Id $_.OwningProcess -Force| Automation | ✅ CI/CD Ready | ❌ Manual only |

}

```## Related Documentation



### Timeout Issues- **Planning**: `.github/key-data-streams/quick-provision-ps1/quick-provision-ps1.plan.md`

Increase the timeout for slower machines:- **Work Log**: `.github/key-data-streams/quick-provision-ps1/work-log.md`

```powershell- **Quick Reference**: `Scripts/NCDEPLOY-QUICK-REFERENCE.md`

hct -StartupTimeout 60- **HostProvisioner**: `Tools/HostProvisioner/README.md`

```

## Troubleshooting

## Future Enhancements

### Script Not Found

Potential additions (not yet implemented):```powershell

- Add build progress indicators# Ensure you're in the project root

- Support custom port configurationcd "D:\PROJECTS\NOOR CANVAS"

- Integration with VS Code tasks.\Scripts\hct.ps1 -SessionId 212

- Auto-restart on file changes```

- Log file capture from separate window

### HostProvisioner Errors

## SupportCheck that HostProvisioner builds correctly:

```powershell

For issues or questions:cd Tools/HostProvisioner/HostProvisioner

1. Check the separate PowerShell window for application logsdotnet build

2. Verify .NET 8.0 SDK is installed: `dotnet --version````

3. Ensure project builds successfully: `cd SPA/NoorCanvas; dotnet build`

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
