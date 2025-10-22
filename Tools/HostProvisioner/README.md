# NOOR Canvas Host Provisioner

Command-line tool for provisioning and managing NOOR Canvas host sessions with secure token generation.

## Features

- **Session Provisioning**: Create host and user tokens for existing KSESSIONS sessions
- **Canvas Cleanup**: Automatically clears existing session data for fresh session state
- **Token Generation**: Creates secure, friendly 8-character tokens (Base32-encoded)
- **Environment Support**: Development (KSESSIONS_DEV) and Production (KSESSIONS) databases
- **Interactive Mode**: User-friendly console interface with browser launch support

## Canvas Cleanup Behavior

**NEW**: When provisioning a session, HostProvisioner automatically clears existing canvas data to ensure a fresh session state:

### Tables Cleared
- **canvas.Participants**: All participant registrations removed
- **canvas.SessionData**: Questions, votes, and other session data deleted

### Purpose
This cleanup ensures that when you re-provision a session (regenerate tokens), participants start with a clean slate:
- No leftover participant registrations
- No old questions or votes
- Fresh session state for testing or restarting sessions

### When It Happens
The cleanup occurs automatically:
1. After session validation (session exists in KSESSIONS)
2. Before token generation
3. Scoped to the specific `sessionId` only

### Error Handling
- Cleanup failures are logged as warnings but **do not block** token generation
- Token generation proceeds even if cleanup encounters errors
- Deletion counts are logged for verification

## Usage

### Command Line Mode

```powershell
# Basic provisioning (Development database)
dotnet run -- create --session-id 212 --created-by "Your Name"

# Production database (requires ASPNETCORE_ENVIRONMENT=Production)
$env:ASPNETCORE_ENVIRONMENT="Production"
dotnet run -- create --session-id 212 --created-by "Your Name"

# Dry run (preview without making changes)
dotnet run -- create --session-id 212 --dry-run true
```

### Interactive Mode

```powershell
# Run without arguments for interactive mode
dotnet run

# Enter session ID when prompted
Enter command (or Session ID): 212
```

## Requirements

- .NET 8.0 SDK
- SQL Server access to KSESSIONS/KSESSIONS_DEV database
- Valid Session ID from KSESSIONS database
- Session must have transcripts available for annotation features

## Configuration

### Environment Detection
**CRITICAL**: Host Provisioner ALWAYS defaults to **Development** environment unless explicitly deployed to production via `ncdeploy.ps1`.

Priority order:
1. `app.config` file (`ASPNETCORE_ENVIRONMENT` key) - modified by ncdeploy during deployment
2. Fallback: "Development" (if config file missing)

**Note**: The `ASPNETCORE_ENVIRONMENT` environment variable is **NOT used** by Host Provisioner. It's for the web application only. This ensures Host Provisioner always targets KSESSIONS_DEV during development, regardless of web app environment settings.

### Database Connection
- **Development**: KSESSIONS_DEV database
- **Production**: KSESSIONS database
- Connection strings configured in `appsettings.json` and `appsettings.{Environment}.json`

## Output

Successful provisioning generates:
- **Host Token**: 8-character token for host authentication
- **User Token**: 8-character token for participant access
- **Host URL**: Direct link to host control panel
- **Participant URL**: Shareable link for participants

Example output:
```
[INF] PROVISIONER: Cleared 5 participants, 5 session data records for Session 212
[INF] PROVISIONER-TOKEN: Host Token: B7PPBDFN
[INF] PROVISIONER-TOKEN: User Token: ZQPX29ZP
[INF] PROVISIONER-TOKEN: Host URL: https://noorcanvas.servehttp.com/host/B7PPBDFN
[INF] PROVISIONER-TOKEN: Participant URL: https://noorcanvas.servehttp.com/user/landing/ZQPX29ZP
```

## Validation

The provisioner performs automatic validation:
- ✅ Session ID exists in KSESSIONS database
- ✅ Session has transcripts available
- ✅ Database connectivity (both Canvas and KSESSIONS)
- ✅ Token uniqueness (prevents duplicates)

## Error Handling

- Invalid Session ID: Error with clear message
- No transcripts: Error explaining annotation requirement
- Database connectivity issues: Detailed error logging
- Cleanup failures: Warning logged, provisioning continues

## Architecture


- **SimplifiedCanvasDbContext**: Canvas schema access (4 tables)
- **KSessionsDbContext**: KSESSIONS validation and reference data
- **SimplifiedTokenService**: Secure token generation and persistence
- **HostProvisionerConfig**: Centralized environment and service configuration

## Security: Database Environment Guard

**CRITICAL**: The NOOR Canvas application includes a security guard that prevents production from accessing the development database.

### Protection Mechanism
- **Service**: `DatabaseEnvironmentGuardService` (injected into all host pages)
- **Detection**: Checks if hostname is "noorcanvas.servehttp.com" AND database is "KSESSIONS_DEV"
- **Response**: Full-screen red alert blocks all UI interaction, prevents data loading
- **Logging**: Critical security violation logged for audit trail

### Protected Pages
- HostControlPanel (`/host/control-panel/{hostToken}`)
- Host-SessionOpener (`/host/session-opener/{token?}`)
- HostLanding (`/host/{friendlyToken?}` and `/`)

### Deployment Validation
Before deploying Host Provisioner to production:
1. ✅ Verify `appsettings.Production.json` points to **KSESSIONS** (not KSESSIONS_DEV)
2. ✅ Run `ncdeploy.ps1` which transforms app.config to Production environment
3. ✅ Navigate to production URL and verify NO red security alert appears
4. ✅ If alert appears: **STOP**, fix configuration, redeploy

For complete security documentation, see: [DatabaseEnvironmentGuard.md](../../.github/instructions/DatabaseEnvironmentGuard.md)

## Related Files

- `HostProvisioner.csproj`: Project configuration
- `appsettings.json`: Default connection strings
- `appsettings.Development.json`: Development overrides
- `appsettings.Production.json`: Production overrides
- `app.config`: Deployment environment marker (ncdeploy)

## Support

For issues or questions:
- Check logs for detailed error messages
- Verify Session ID exists in KSESSIONS
- Ensure database connectivity
- Validate environment configuration
- **Security Violations**: See DatabaseEnvironmentGuard.md for troubleshooting

---

**Last Updated**: October 22, 2025  
**Version**: 2.1 (Canvas Cleanup + Database Environment Guard Security)

