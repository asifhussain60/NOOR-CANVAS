# PLAYWRIGHT EXECUTION GUARDRAILS - MANDATORY PRE-FLIGHT CHECKLIST

## ⚠️ CRITICAL WARNING ⚠️
**NEVER run Playwright tests without completing this checklist!**

## Pre-Flight Validation Protocol

### Step 1: Application Startup Verification
```powershell
# 1.1 Check if NoorCanvas app is running
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "dotnet" }

# 1.2 Verify ports 9090/9091 are active
Test-NetConnection -ComputerName localhost -Port 9090 -InformationLevel Quiet
Test-NetConnection -ComputerName localhost -Port 9091 -InformationLevel Quiet

# 1.3 Test API endpoints are responding
Invoke-WebRequest -Uri "https://localhost:9091" -UseBasicParsing -ErrorAction SilentlyContinue
```

### Step 2: Test Token Validation
```powershell
# 2.1 Test user token endpoint (should return success)
Invoke-WebRequest -Uri "https://localhost:9091/api/participant/session/V37KMP9P/validate" -UseBasicParsing

# 2.2 Test host token endpoint (should return success or 404 if token invalid)
Invoke-WebRequest -Uri "https://localhost:9091/api/host/token/ADMIN123/validate" -UseBasicParsing
```

### Step 3: Playwright Framework Verification
```powershell
# 3.1 Check Playwright installation
npx playwright --version

# 3.2 Verify test configuration exists
Test-Path "PlayWright\config\playwright.config.js"

# 3.3 Check browser binaries are installed
npx playwright install --dry-run
```

### Step 4: Database Connection Test
```powershell
# 4.1 Verify KSESSIONS_DEV database is accessible
# (This should be done via application logs showing successful DB queries)
```

## Execution Workflow

### ✅ SAFE TO RUN TESTS - When ALL conditions are met:
1. ✅ NoorCanvas application running on 9090/9091
2. ✅ API endpoints responding with valid JSON
3. ✅ Test tokens validate successfully
4. ✅ Playwright framework installed and configured
5. ✅ Database connections established

### ❌ DO NOT RUN TESTS - When ANY condition fails:
- ❌ Application not running
- ❌ Ports not responding
- ❌ API endpoints returning errors
- ❌ Playwright not installed or misconfigured
- ❌ Database connection issues

## Test Execution Commands (Use ONLY after validation)

### For Manual Testing (with validation):
```powershell
# Pre-flight check
./Scripts/Validation/pre-flight-check.ps1

# If all checks pass, then run:
npx playwright test auto-validation-flows.spec.ts --headed --timeout=60000
```

### For CI/CD (automated validation):
```powershell
# Use build-with-tests task that includes validation
invoke-expression "run-task build-with-tests"
```

## Emergency Recovery Procedures

### If Application Not Running:
```powershell
# Start application with proper task
invoke-expression "run-task run-app-with-cd"
# Wait 30 seconds for startup
Start-Sleep 30
# Verify ports are active before proceeding
```

### If Playwright Framework Issues:
```powershell
# Reinstall Playwright
npm install @playwright/test
npx playwright install
# Verify installation
npx playwright --version
```

### If Database Issues:
```powershell
# Check connection strings in appsettings
# Verify KSESSIONS_DEV database is accessible
# Check application logs for database errors
```

## Self-Instructions for GitHub Copilot

**BEFORE every Playwright test execution, I must:**

1. **ALWAYS** run application startup validation first
2. **NEVER** assume the application is running without checking
3. **VERIFY** all API endpoints are responding correctly
4. **CHECK** that test tokens are valid and working
5. **CONFIRM** Playwright framework is properly installed
6. **VALIDATE** database connections are established

**If ANY validation step fails:**
- **STOP** immediately
- **DO NOT** attempt to run tests
- **TROUBLESHOOT** the failing component first
- **RESTART** application if needed
- **RE-VALIDATE** all steps before proceeding

**Remember:** Playwright tests are integration tests that require the full application stack to be running and healthy. Never run them against a non-functional environment.

## Common Failure Patterns to Avoid

1. **Port not bound**: Application stopped or crashed
2. **SSL certificate issues**: Use proper HTTPS endpoints with cert acceptance
3. **Database disconnection**: Check connection strings and KSESSIONS_DEV access
4. **Token expiration**: Verify test tokens are still valid
5. **Playwright browser issues**: Ensure browsers are installed with `npx playwright install`

## Success Indicators

✅ **Green Light Signals (Safe to proceed):**
- Application logs showing successful requests
- API endpoints returning 200 OK with valid JSON
- Token validation returning success responses
- Playwright version displayed correctly
- Browser binaries installed and accessible

❌ **Red Light Signals (Stop and fix):**
- Connection refused errors
- 404/500 HTTP responses
- SSL handshake failures
- "No tests found" Playwright errors
- Browser binary missing errors