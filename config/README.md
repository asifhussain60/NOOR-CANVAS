# Shared Database Configuration

## Overview
This directory contains shared configuration settings used across multiple projects in the Noor Canvas solution.

## Files

### sharedsettings.json
**Purpose**: Single source of truth for database connection strings across all projects.

**Usage**: Both NoorCanvas and HostProvisioner reference these connection strings in their environment-specific appsettings files.

**Connection Strings**:
- **Development**: `KSESSIONS_DEV` - Development database on AHHOME server
- **Production**: `KSESSIONS` - Production database on AHHOME server (live Islamic learning sessions)

## Projects Using Shared Configuration

### 1. NoorCanvas (SPA/NoorCanvas)
- `appsettings.json` - Base configuration (defaults to Development)
- `appsettings.Development.json` - Development environment (KSESSIONS_DEV)
- `appsettings.Production.json` - Production environment (KSESSIONS)

### 2. HostProvisioner (Tools/HostProvisioner/HostProvisioner)
- `appsettings.json` - Base configuration (defaults to Development)
- `appsettings.Development.json` - Development environment (KSESSIONS_DEV)
- `appsettings.Production.json` - Production environment (KSESSIONS)

## Environment Detection
Projects automatically select the correct connection string based on the `ASPNETCORE_ENVIRONMENT` environment variable:
- **Not set or "Development"** → Uses KSESSIONS_DEV
- **"Production"** → Uses KSESSIONS

## Changing Database Connections
To update connection strings for all projects simultaneously:

1. Edit `config/sharedsettings.json`
2. Copy the desired connection string (Development or Production)
3. Update all project appsettings files:
   - `SPA/NoorCanvas/appsettings.Development.json`
   - `SPA/NoorCanvas/appsettings.Production.json`
   - `Tools/HostProvisioner/HostProvisioner/appsettings.Development.json`
   - `Tools/HostProvisioner/HostProvisioner/appsettings.Production.json`

## Benefits
✅ **Single Source of Truth**: One file defines connection strings  
✅ **Consistency**: Both apps always use same database per environment  
✅ **Safety**: Prevents configuration drift between projects  
✅ **Clarity**: Explicit documentation of which database is used when  

## Deployment
The `ncdeploy.ps1` script ensures the Production configuration is deployed to IIS with the correct KSESSIONS connection string.

For HostProvisioner production execution, set the environment variable before running:
```powershell
$env:ASPNETCORE_ENVIRONMENT = "Production"
.\HostProvisioner.exe create --session-id 212 --created-by "Operator Name"
```

## Database Schema
Both applications use the **canvas schema** for session management:
- `canvas.Sessions` - Host sessions with GUIDs
- `canvas.Participants` - Session participants
- `canvas.SessionData` - Session state data
- `canvas.AssetLookup` - Asset metadata

They also read from **dbo schema** (READ-ONLY):
- `dbo.Sessions` - Legacy Islamic learning sessions (referenced by canvas.Sessions.SessionId FK)
- `dbo.Users` - User accounts
- `dbo.Transcripts` - Session transcripts

## Troubleshooting

### HostProvisioner not connecting to KSESSIONS
**Symptom**: Running `HostProvisioner.exe create --session-id 212` in production does not create records.

**Solution**:
1. Verify `ASPNETCORE_ENVIRONMENT` is set to "Production"
2. Check `appsettings.Production.json` has correct KSESSIONS connection string
3. Look for debug markers in console output: `[DEBUG-WORKITEM:deploy:connection-resolution]`
4. Verify database server is accessible (AHHOME)

### Connection string not updating
**Symptom**: Changes to sharedsettings.json don't take effect.

**Solution**:
1. Ensure changes are copied to all project appsettings files
2. Rebuild the solution
3. For HostProvisioner, verify correct appsettings file is in output directory
4. For production deployment, run `ncdeploy.ps1` to sync publish-temp

## Related Documentation
- `Workspaces/Copilot/prompts.keys/deploy/deploy.md` - Deployment workflow
- `InfrastructureQuickRef.md` - Database schema rules and connections
- `ncdeploy.ps1` - Production deployment script
