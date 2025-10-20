# NoorCanvas Production Deployment Validation Checklist

**Document Version:** 1.0  
**Last Updated:** October 20, 2025  
**Purpose:** Prevent configuration issues during production deployment

---

## Overview

This checklist ensures production deployments are safe and correctly configured. Use this in conjunction with automated validation in `ncdeploy.ps1` and `post-deploy-smoke-test.ps1`.

### Critical Context

**Configuration Override Issue (October 20, 2025):**
- Production app was connecting to `KSESSIONS_DEV` instead of `KSESSIONS`
- Root cause: `appsettings.local.json` file in production directory overriding `appsettings.Production.json`
- ASP.NET Core config hierarchy: `appsettings.json` → `appsettings.{Environment}.json` → `appsettings.local.json` → Environment variables
- **KEY LESSON:** Local configuration files (`*.local.json`) MUST NEVER be deployed to production

---

## Pre-Deployment Checklist

### 1. Source Code Validation

- [ ] All changes committed to `development` branch
- [ ] No uncommitted files in working directory
- [ ] `git status` shows clean state
- [ ] Database migrations tested in `KSESSIONS_DEV`
- [ ] All unit tests passing
- [ ] Visual regression tests (Percy) passing

### 2. Configuration File Verification

**CRITICAL: Verify NO local configuration overrides exist in source:**

```powershell
# Check workspace for local config files
Get-ChildItem -Path "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas" -Filter "*appsettings*.local.json" -Recurse

# Expected output: NONE (should not exist in source)
```

- [ ] No `appsettings.local.json` in `SPA/NoorCanvas/` directory
- [ ] No `appsettings.*.local.json` patterns anywhere in source
- [ ] `.gitignore` includes `**/appsettings.local.json` pattern
- [ ] `appsettings.Production.json` contains `Database=KSESSIONS` (not `KSESSIONS_DEV`)

### 3. Environment Configuration

- [ ] `ASPNETCORE_ENVIRONMENT` system variable set to `Production`
  ```powershell
  [System.Environment]::GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Machine")
  # Expected output: Production
  ```

### 4. Database Preparation

- [ ] Production database (`KSESSIONS`) schema up to date
- [ ] Pending migrations reviewed and approved
- [ ] Migration scripts in `Scripts/Migrations/Prod/pending/` directory
- [ ] Rollback scripts prepared in `Scripts/Migrations/Prod/rollback/` directory
- [ ] Backup of `KSESSIONS` database created (optional but recommended)

---

## Deployment Execution

### 5. Run ncdeploy.ps1

**Standard deployment (recommended):**
```powershell
cd "D:\PROJECTS\NOOR CANVAS\Scripts"
.\ncdeploy.ps1
```

**The script will automatically:**
1. Merge `development` → `master`
2. Build in Release mode
3. Run database migrations (if pending)
4. **Validate publish output** (checks for `appsettings.local.json`)
5. Stop IIS app pool
6. Deploy to `D:\Websites\NOOR-CANVAS`
7. **Validate deployed files** (checks for local config overrides)
8. Start IIS app pool
9. Run automated smoke tests

**Deployment should FAIL if:**
- `appsettings.local.json` found in publish directory
- `appsettings.local.json` found in deployment directory
- `appsettings.Production.json` missing
- `appsettings.Production.json` references `KSESSIONS_DEV`
- `web.config` does not specify `ASPNETCORE_ENVIRONMENT=Production`

### 6. Monitor Deployment Output

**Watch for these validation checkpoints:**

```
[STEP] Pre-Deployment Validation: Checking publish output for dangerous configuration files...
  ✓ appsettings.local.json correctly excluded from publish
  ✓ No local configuration overrides found
  ✓ appsettings.Production.json present
  ✓ Production config references KSESSIONS database

[STEP] Validating production deployment configuration...
  ✓ No appsettings.local.json in deployment
  ✓ No local configuration overrides deployed
  ✓ NoorCanvas environment: Production
  ✓ NoorCanvas appsettings.Production.json: KSESSIONS database

[STEP] Running automated post-deployment smoke tests...
  ✓ Production log file found
  ✓ Production logs confirm KSESSIONS database connection
```

**If ANY validation fails:**
- Deployment will abort with detailed error messages
- Follow remediation steps in the error output
- Fix issues and re-run `ncdeploy.ps1`

---

## Post-Deployment Verification

### 7. Automated Smoke Tests

The deployment script automatically runs `post-deploy-smoke-test.ps1`. This validates:

- ✅ Configuration files (no local overrides deployed)
- ✅ IIS app pool running
- ✅ DLL timestamps fresh (within 10 minutes)
- ✅ Production URL accessible
- ✅ Database connectivity (KSESSIONS)
- ✅ CanvasType column exists
- ✅ Production logs show correct database

**Manual smoke test execution (if needed):**
```powershell
cd "D:\PROJECTS\NOOR CANVAS\Scripts"
.\post-deploy-smoke-test.ps1 -Verbose
```

### 8. Production Info Panel Verification

**Check the production diagnostics panel in browser:**

1. Navigate to NoorCanvas production URL: `https://noorcanvas.servehttp.com`
2. Locate the Production Info Panel (typically top-right corner)
3. Verify displayed values:
   - **Environment:** `Production` (should show green badge)
   - **Database:** `KSESSIONS` (should show green checkmark ✓, NOT yellow wrench)
   - **Server:** `AHHOME`

**Expected Display:**
```
Environment: Production ✅
Database: KSESSIONS ✓
Server: AHHOME
```

**WARNING SIGNS:**
- Database shows `KSESSIONS_DEV` with yellow wrench icon → **CRITICAL ISSUE - Wrong database!**
- Environment shows anything other than `Production` → Configuration problem
- No production panel visible → App may not have started

### 9. Host Provisioner Token Validation Test

**Test the host token validation flow:**

1. Open Host Provisioner desktop app (`D:\Websites\NOOR-CANVAS\HostProvisioner\HostProvisioner.exe`)
2. Click "Generate Host Token" button
3. Create a new session (Session ID auto-generates)
4. Copy the generated host token (e.g., `ABC123XY`)
5. Navigate to asset share URL: `https://noorcanvas.servehttp.com/?token={generated-token}`
6. Verify:
   - [ ] Token validates successfully
   - [ ] Browser redirects to `/host` page
   - [ ] Session information displays correctly
   - [ ] No console errors related to token validation

**If validation fails:**
- Check production logs: `D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-{date}.txt`
- Search for: `Sessions matching token '{your-token}':`
- Expected: `Sessions matching token 'ABC123XY': 1` (found)
- If shows `0`: Database connection issue - check Production Info Panel

### 10. Database Connection Verification

**Verify production app is querying KSESSIONS:**

```powershell
# Check recent production logs for database connection strings
$logPath = "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt"
Select-String -Path $logPath -Pattern "Database Connection:|NOOR-PRODUCTION-INFO" | Select-Object -Last 5
```

**Expected output:**
```
[17:05:23] NOOR-PRODUCTION-INFO: Database connection info loaded...
[17:05:23] Database Connection: Server=AHHOME;Database=KSESSIONS;...
[17:05:23] KSessionsDbContext Database: KSESSIONS
```

**WARNING - If logs show `KSESSIONS_DEV`:**
- `appsettings.local.json` may be present in deployment directory
- Check: `Test-Path "D:\Websites\NOOR-CANVAS\appsettings.local.json"`
- If exists: Rename to `.DISABLED` and restart IIS
- Re-run deployment with validation enabled

### 11. API Endpoint Health Check

**Test critical API endpoints:**

```powershell
# Test token validation endpoint (should return 404 for invalid token)
Invoke-WebRequest -Uri "https://noorcanvas.servehttp.com/api/host/token/TESTTEST/validate" -UseBasicParsing

# Expected: HTTP 200 or 404 (endpoint responsive)
# If 500 error: Application error - check logs
```

### 12. Production Logs Analysis

**Check for startup errors:**

```powershell
$logPath = "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt"
Select-String -Path $logPath -Pattern "\[ERR\]|\[FATAL\]" | Select-Object -First 10
```

**Expected:** No critical errors

**Common errors to investigate:**
- Database connection failures
- Missing configuration values
- Entity Framework migration issues
- Dependency injection failures

---

## Rollback Procedures

### When to Rollback

Rollback immediately if:
- Smoke tests fail critically
- Production Info Panel shows wrong database
- Token validation not working
- API endpoints returning 500 errors
- Database migration failed

### Rollback Steps

1. **Restore previous deployment:**
   ```powershell
   # Backups are stored in D:\Websites\NOOR-CANVAS-BACKUP-{timestamp}
   $backupPath = "D:\Websites\NOOR-CANVAS-BACKUP-{timestamp}"  # Find latest
   
   # Stop IIS
   Stop-WebAppPool -Name "NoorCanvas"
   
   # Restore files
   Remove-Item "D:\Websites\NOOR-CANVAS\*" -Recurse -Force
   Copy-Item "$backupPath\*" -Destination "D:\Websites\NOOR-CANVAS" -Recurse -Force
   
   # Start IIS
   Start-WebAppPool -Name "NoorCanvas"
   ```

2. **Rollback database migrations (if applied):**
   ```powershell
   # Run rollback script from Scripts/Migrations/Prod/rollback/ directory
   sqlcmd -S AHHOME -d KSESSIONS -i "rollback-{migration-name}.sql"
   ```

3. **Verify rollback:**
   - Run smoke tests: `.\Scripts\post-deploy-smoke-test.ps1`
   - Check Production Info Panel
   - Test token validation

---

## Common Issues and Remediation

### Issue 1: appsettings.local.json Deployed

**Symptoms:**
- Pre-deployment validation fails
- Post-deployment validation fails
- Production Info Panel shows `KSESSIONS_DEV`

**Remediation:**
```powershell
# 1. Remove from deployment directory
Remove-Item "D:\Websites\NOOR-CANVAS\appsettings.local.json" -ErrorAction SilentlyContinue

# 2. Remove from workspace source
Remove-Item "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\appsettings.local.json" -ErrorAction SilentlyContinue

# 3. Verify .gitignore includes pattern
Add-Content "D:\PROJECTS\NOOR CANVAS\.gitignore" -Value "**/appsettings.local.json"

# 4. Re-deploy
.\ncdeploy.ps1
```

### Issue 2: Wrong Database in Production

**Symptoms:**
- Token validation fails (0 sessions found)
- Production Info Panel shows `KSESSIONS_DEV`
- Logs reference development database

**Remediation:**
```powershell
# 1. Check for local config override
Test-Path "D:\Websites\NOOR-CANVAS\appsettings.local.json"

# 2. If exists, disable it
Rename-Item "D:\Websites\NOOR-CANVAS\appsettings.local.json" "appsettings.local.json.DISABLED"

# 3. Verify appsettings.Production.json has correct database
$prodConfig = Get-Content "D:\Websites\NOOR-CANVAS\appsettings.Production.json" | ConvertFrom-Json
$prodConfig.ConnectionStrings.DefaultConnection
# Should contain: Database=KSESSIONS (not KSESSIONS_DEV)

# 4. Restart IIS
Restart-WebAppPool -Name "NoorCanvas"

# 5. Wait for startup (10 seconds)
Start-Sleep -Seconds 10

# 6. Verify Production Info Panel shows KSESSIONS
```

### Issue 3: IIS App Pool Not Starting

**Symptoms:**
- App pool shows "Stopped" state
- Production URL not accessible
- Event Viewer shows application errors

**Remediation:**
```powershell
# 1. Check IIS logs for startup errors
Get-EventLog -LogName Application -Source "IIS*" -Newest 20 | Where-Object EntryType -eq "Error"

# 2. Check application logs
$logPath = "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt"
Get-Content $logPath -Tail 50

# 3. Common fixes:
# - Verify .NET 8 Runtime installed: dotnet --list-runtimes
# - Check file permissions on D:\Websites\NOOR-CANVAS
# - Verify web.config is valid XML
# - Check for locked DLL files: Stop-WebAppPool; Start-Sleep 5; Start-WebAppPool

# 4. Manual IIS reset (last resort)
iisreset
```

### Issue 4: Database Migration Failed

**Symptoms:**
- Deployment aborts during migration step
- `sqlcmd` errors in deployment output
- MigrationHistory table out of sync

**Remediation:**
```powershell
# 1. Check migration history
sqlcmd -S AHHOME -d KSESSIONS -Q "SELECT * FROM canvas.MigrationHistory ORDER BY AppliedDate DESC"

# 2. If migration partially applied, run rollback
sqlcmd -S AHHOME -d KSESSIONS -i "Scripts/Migrations/Prod/rollback/{migration-name}.sql"

# 3. Fix migration script issues
# - Review migration SQL for syntax errors
# - Verify database state matches migration prerequisites

# 4. Re-run deployment
.\ncdeploy.ps1
```

---

## Prevention Best Practices

### Development Workflow

1. **Never create `appsettings.local.json` in tracked directories:**
   - Use it ONLY in your local development environment
   - Add to `.gitignore` immediately if created
   - Verify not tracked: `git ls-files | Select-String "local.json"`

2. **Always verify configuration before deploying:**
   ```powershell
   # Pre-deployment check
   Get-ChildItem -Path "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas" -Filter "*.local.json" -Recurse
   # Expected output: NONE
   ```

3. **Use ncdeploy.ps1 for all production deployments:**
   - Never manually copy files to `D:\Websites\NOOR-CANVAS`
   - Script includes automated validation
   - Provides rollback capability via backups

4. **Monitor production logs regularly:**
   ```powershell
   # Daily check for errors
   $logPath = "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt"
   Select-String -Path $logPath -Pattern "\[ERR\]|\[FATAL\]" | Select-Object -Last 10
   ```

### Configuration Management

1. **Environment-specific files:**
   - `appsettings.json` → Base configuration (DEV database acceptable here)
   - `appsettings.Production.json` → Production overrides (MUST have KSESSIONS)
   - `appsettings.local.json` → Developer local overrides (NEVER commit)

2. **Connection string hierarchy verification:**
   ```powershell
   # Verify production config has KSESSIONS
   Select-String -Path "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\appsettings.Production.json" -Pattern "KSESSIONS"
   # Expected: Match found with "Database=KSESSIONS"
   ```

3. **Git pre-commit hook (optional):**
   ```bash
   # .git/hooks/pre-commit
   if git diff --cached --name-only | grep -q "appsettings.local.json"; then
       echo "ERROR: Attempting to commit appsettings.local.json"
       exit 1
   fi
   ```

---

## Deployment Success Criteria

A deployment is considered successful when ALL of the following are verified:

- ✅ `ncdeploy.ps1` completed without errors
- ✅ Pre-deployment validation passed (no local config files in publish)
- ✅ Post-deployment validation passed (no local config files deployed)
- ✅ Automated smoke tests passed (exit code 0)
- ✅ Production Info Panel shows `KSESSIONS` database
- ✅ IIS app pool running and responsive
- ✅ Host token validation works (test with real token)
- ✅ Production logs show `KSESSIONS` connections
- ✅ No critical errors in application logs
- ✅ API endpoints responding (health check, token validation)
- ✅ HostProvisioner connects to `KSESSIONS` database

**If ANY criterion fails:** Investigate immediately and rollback if necessary.

---

## Post-Mortem Reference

**Related Documentation:**
- See `Docs/POST-MORTEM-appsettings-local-override.md` for detailed incident analysis (October 20, 2025)
- See `Scripts/post-deploy-smoke-test.ps1` for automated validation details
- See `Scripts/ncdeploy.ps1` for deployment automation

**Key Takeaway:**
> ASP.NET Core configuration hierarchy allows `appsettings.local.json` to override ALL other configuration files, including environment-specific ones. This file must NEVER be deployed to production.

---

## Checklist Summary

**Print this section for manual verification:**

### Pre-Deployment
- [ ] All changes committed, clean git status
- [ ] No `appsettings.local.json` in workspace
- [ ] `.gitignore` includes local config patterns
- [ ] `appsettings.Production.json` references KSESSIONS
- [ ] Database migrations prepared
- [ ] `ASPNETCORE_ENVIRONMENT=Production` set

### Deployment
- [ ] Run `.\ncdeploy.ps1` from Scripts directory
- [ ] Pre-deployment validation passed
- [ ] Post-deployment validation passed
- [ ] Automated smoke tests passed

### Verification
- [ ] Production Info Panel shows KSESSIONS
- [ ] Host token validation works
- [ ] Production logs confirm KSESSIONS
- [ ] No critical errors in logs
- [ ] IIS app pool running
- [ ] API endpoints responsive

### Post-Deployment
- [ ] Document any issues encountered
- [ ] Update runbook if new issues found
- [ ] Monitor production for 1 hour
- [ ] Test all critical user flows

---

**Document Owner:** NoorCanvas Development Team  
**Review Frequency:** After each production deployment  
**Last Incident:** October 20, 2025 - appsettings.local.json override issue
