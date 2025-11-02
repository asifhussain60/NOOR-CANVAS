# Database Environment Guard - Security Documentation

**Created**: 2025-10-22  
**Purpose**: Prevent production application from accessing development database  
**Severity**: CRITICAL (Security)  

## Overview
The Database Environment Guard is a security service that detects when the production application (noorcanvas.servehttp.com) attempts to connect to the development database (KSESSIONS_DEV). This is a critical security violation that could corrupt development data or expose production users to test data.

## Implementation

### Service: `DatabaseEnvironmentGuardService`
- **Location**: `SPA/NoorCanvas/Services/Security/DatabaseEnvironmentGuardService.cs`
- **Interface**: `IDatabaseEnvironmentGuardService`
- **DI Registration**: Scoped service in `Program.cs`

### Detection Logic
1. Parse hostname from current URL (`NavigationManager.Uri`)
2. Check if hostname contains "noorcanvas.servehttp.com" (production)
3. Extract database name from connection string (`DefaultConnection`)
4. If production hostname AND database contains "KSESSIONS_DEV" → **SECURITY VIOLATION**
5. Log all checks for security audit trail

### Protected Pages
The guard is integrated into 3 host-facing pages:
1. **HostControlPanel.razor** - `/host/control-panel/{hostToken}`
2. **Host-SessionOpener.razor** - `/host/session-opener/{token?}`
3. **HostLanding.razor** - `/host/{friendlyToken?}` and `/`

## Security Response

### When Violation Detected
- ✅ Full-screen red alert overlay (z-index 9999)
- ✅ All UI interaction blocked
- ✅ Critical log entry for security audit
- ✅ No data loaded from database
- ✅ Early return in `OnInitializedAsync()`

### Red Alert Content
- 🚨 Large warning emoji
- "SECURITY VIOLATION" title in red
- Message: "Production application is connected to DEVELOPMENT DATABASE"
- Details panel showing:
  - **Hostname**: Actual hostname that triggered violation
  - **Expected Database**: KSESSIONS (production)
  - **Actual Database**: Database name from connection string
- Footer: "This page has been blocked for security. Contact system administrator immediately."

## Deployment Validation

### Pre-Deployment Checklist
Before deploying to production (D:\Websites\NOOR-CANVAS):

1. ✅ Verify `appsettings.Production.json` connection string points to **KSESSIONS**
2. ✅ Verify NO `appsettings.local.json` in deployment (should be excluded)
3. ✅ Run `ncdeploy.ps1` which includes smoke tests for configuration validation
4. ✅ Check web.config has `ASPNETCORE_ENVIRONMENT=Production`

### Post-Deployment Validation
After deployment completes:

1. **Navigate to production URL**: https://noorcanvas.servehttp.com/host/landing
2. **Expected**: Normal page load, NO red alert
3. **If red alert appears**:
   - **STOP** - Do not use production application
   - Check connection string in `appsettings.Production.json`
   - Verify database server configuration
   - Review security logs for violation details
   - Redeploy with correct configuration

### Manual Security Test (Development Only)
To test the security guard in development:

1. Modify `appsettings.local.json` connection string:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=AHHOME;Database=KSESSIONS_DEV;User ID=sa;Password=...;..."
     }
   }
   ```
2. Temporarily modify `hosts` file to simulate production hostname:
   ```
   127.0.0.1  noorcanvas.servehttp.com
   ```
3. Navigate to `https://noorcanvas.servehttp.com:9091/host/landing`
4. **Expected**: Red alert overlay appears with security violation message
5. **Restore** hosts file and connection string after testing

## Safe Environment Combinations

| Hostname | Database | Result |
|----------|----------|--------|
| noorcanvas.servehttp.com | KSESSIONS | ✅ **Safe** (Production + Production) |
| noorcanvas.servehttp.com | KSESSIONS_DEV | 🚨 **VIOLATION** (Production + Dev) |
| localhost:9091 | KSESSIONS | ✅ **Safe** (Development + Production DB for testing) |
| localhost:9091 | KSESSIONS_DEV | ✅ **Safe** (Development + Dev) |

## Logging and Audit Trail

### Security Violation Log Entry
```
[SECURITY-GUARD:hp-db-guard] [{RequestId}] 🚨 SECURITY VIOLATION DETECTED - {PageName} blocked!
Hostname: noorcanvas.servehttp.com, Expected: KSESSIONS, Actual: KSESSIONS_DEV
```

### Safe Environment Log Entry
```
[SECURITY-GUARD:hp-db-guard] [{RequestId}] ✅ Safe: Production hostname (noorcanvas.servehttp.com) connected to production database (KSESSIONS)
```

### Debug Log Entries
- Hostname parsing
- Production hostname detection
- Database name extraction from connection string
- Connection string format warnings (if unexpected format)

## Troubleshooting

### Issue: Red alert appears on localhost
**Cause**: Hostname contains "noorcanvas.servehttp.com" (check hosts file)  
**Solution**: Verify hosts file has no production domain mapping to 127.0.0.1

### Issue: Red alert appears in production with correct configuration
**Cause**: Connection string may have KSESSIONS_DEV leftover from deployment artifact  
**Solution**:
1. Check `appsettings.Production.json` on production server
2. Verify web.config transformation applied correctly
3. Check for `appsettings.local.json` in deployment (should NOT exist)
4. Redeploy using `ncdeploy.ps1` to ensure clean deployment

### Issue: No red alert when testing manually
**Cause**: Hostname detection not matching production pattern  
**Solution**:
1. Verify hostname is exactly "noorcanvas.servehttp.com"
2. Check DatabaseEnvironmentGuardService logs for detection results
3. Verify connection string contains "KSESSIONS_DEV" substring

## Future Enhancements
- Extend guard to ALL pages (not just host pages) for comprehensive protection
- Add pre-deployment smoke test that verifies connection string matches environment
- Create PowerShell script to validate configuration before deployment
- Add metrics to track violation attempts (security monitoring)

## Related Files
- Service: `SPA/NoorCanvas/Services/Security/DatabaseEnvironmentGuardService.cs`
- Interface: `SPA/NoorCanvas/Services/Security/IDatabaseEnvironmentGuardService.cs`
- DI Registration: `SPA/NoorCanvas/Program.cs` (line ~162)
- Protected Pages:
  - `SPA/NoorCanvas/Pages/HostControlPanel.razor`
  - `SPA/NoorCanvas/Pages/Host-SessionOpener.razor`
  - `SPA/NoorCanvas/Pages/HostLanding.razor`
- Plan: `.github/prompts/workitems/hp-db-guard.plan.md`

## Security Contacts
If a security violation is detected in production:
1. **Immediate**: Stop using production application
2. **Log Review**: Check security logs at `D:\Websites\NOOR-CANVAS\logs`
3. **Incident Report**: Document hostname, database, timestamp, user actions
4. **Remediation**: Redeploy with correct configuration via `ncdeploy.ps1`
5. **Verification**: Confirm red alert no longer appears after redeployment
