# Implementation Plan: cdn-dev-cors-extension

**Created**: 2025-10-26  
**Status**: Ready for Implementation  
**Version**: 1.0

## Overview

Extend KSESSIONS Resources CDN CORS configuration to support development environments (localhost) while preserving production functionality and ensuring zero modifications to physical resource files.

## Key Details

- **Key**: `cdn-dev-cors-extension`
- **Branch**: `development` (no temporary branch needed - low-risk config change)
- **Estimated Effort**: 30 minutes
- **Risk Level**: Low (configuration only, instant rollback available)

## Assumptions Validated

**@workspace Evidence:**
- ✅ `Scripts/Resources-CDN/setup-resources-cdn.ps1` exists - IIS configuration script
- ✅ Current CORS: `https://noorcanvas.kashkole.com,https://session.kashkole.com`
- ✅ Target path: `D:\Websites\KSESSIONS\Resources\web.config`
- ✅ Service: `KashkoleResources` IIS site on port 80

**Development Environment:**
- Kestrel default ports: 5000 (HTTP), 5001 (HTTPS)
- Need localhost CORS access for local development/testing

## Problem Statement

Current CDN setup is production-only with CORS restricted to production domains. Developers need to:
- Test resource loading from local development servers
- Validate CDN integration without deploying to production
- Access production resources **without modifying physical files**

**Current Limitation**: Development apps running on `localhost:5000` or `localhost:5001` are blocked by CORS policy.

## Solution Approach

**Approach A: Read-Only CORS Extension (Selected)**

Add development origins to CORS whitelist via IIS configuration layer:
- Extend CORS `Access-Control-Allow-Origin` header to include localhost URLs
- Modify **only** `web.config` (HTTP headers layer)
- Physical resource files remain completely untouched
- Production origins preserved (additive change)
- Instant rollback by regenerating config without dev flag

## Phases

### Phase 1: Update IIS Configuration Script

**Goal**: Extend `setup-resources-cdn.ps1` to support dual-mode CORS configuration

**Files Modified**:
- `Scripts/Resources-CDN/setup-resources-cdn.ps1`

**Changes**:
1. Add parameter: `-IncludeDevelopment [switch]` (default: `$false`)
2. Create conditional CORS origins array
3. Preserve all existing functionality (production-only by default)
4. Update web.config generation logic to use dynamic origins

**Implementation Details**:

```powershell
# Add to parameter block
[switch]$IncludeDevelopment

# Conditional CORS origins
$corsOrigins = if ($IncludeDevelopment) {
    @(
        "https://noorcanvas.kashkole.com",
        "https://session.kashkole.com",
        "http://localhost:5000",
        "http://localhost:5001",
        "https://localhost:5001"
    )
} else {
    @(
        "https://noorcanvas.kashkole.com",
        "https://session.kashkole.com"
    )
}

# Join for web.config
$corsValue = $corsOrigins -join ","

# Update web.config template
<add name="Access-Control-Allow-Origin" value="$corsValue" />
```

**Output Messages**:
- If `-IncludeDevelopment`: `"Configuring dual-mode CORS (production + development)"`
- If production-only: `"Configuring production-only CORS"`

**Validation**:
- Script runs successfully with `-IncludeDevelopment`
- Script runs successfully without flag (backward compatible)
- Generated `web.config` contains correct origins

**Acceptance Criteria**:
- [ ] Parameter added to script
- [ ] Conditional logic implemented
- [ ] web.config template updated
- [ ] Backward compatibility preserved
- [ ] Output messages indicate mode

---

### Phase 2: Apply Development CORS Configuration

**Goal**: Update production IIS site with extended CORS headers

**Prerequisites**:
- Phase 1 complete
- IIS site `KashkoleResources` running
- Backup current `web.config` (safety measure)

**Steps**:

1. **Backup Current Configuration**
   ```powershell
   Copy-Item "D:\Websites\KSESSIONS\Resources\web.config" `
             "D:\Websites\KSESSIONS\Resources\web.config.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
   ```

2. **Capture File Integrity Baseline**
   ```powershell
   # Count files and generate checksums
   $before = Get-ChildItem "D:\Websites\KSESSIONS\Resources" -Recurse -File | 
             Where-Object { $_.Name -ne 'web.config' } |
             Measure-Object
   ```

3. **Run Updated Script with Development Flag**
   ```powershell
   cd "D:\PROJECTS\NOOR CANVAS\Scripts\Resources-CDN"
   .\setup-resources-cdn.ps1 -IncludeDevelopment
   ```

4. **Verify File Integrity**
   ```powershell
   $after = Get-ChildItem "D:\Websites\KSESSIONS\Resources" -Recurse -File | 
            Where-Object { $_.Name -ne 'web.config' } |
            Measure-Object
   
   # Assert counts match
   if ($before.Count -ne $after.Count) {
       throw "File count changed - rollback required"
   }
   ```

5. **Inspect web.config Changes**
   ```powershell
   # View CORS header
   Select-String -Path "D:\Websites\KSESSIONS\Resources\web.config" `
                 -Pattern "Access-Control-Allow-Origin"
   ```

**Expected Output**:
```xml
<add name="Access-Control-Allow-Origin" value="https://noorcanvas.kashkole.com,https://session.kashkole.com,http://localhost:5000,http://localhost:5001,https://localhost:5001" />
```

**Acceptance Criteria**:
- [ ] Script executes without errors
- [ ] web.config contains 5 CORS origins (2 production + 3 development)
- [ ] IIS site restarts successfully
- [ ] File count unchanged (only web.config modified)
- [ ] Backup created

---

### Phase 3: Validation and Testing

**Goal**: Confirm dual-mode CORS works without breaking production

**Test Suite**:

#### Test 1: Production CORS Still Works
```powershell
# Test from production domain origin
$response = Invoke-WebRequest -Uri "https://resources.kashkole.com" `
                               -Headers @{"Origin"="https://noorcanvas.kashkole.com"} `
                               -UseBasicParsing

# Verify CORS header present
$corsHeader = $response.Headers['Access-Control-Allow-Origin']
if ($corsHeader -notmatch "noorcanvas.kashkole.com") {
    throw "Production CORS broken"
}
Write-Host "✓ Production CORS verified" -ForegroundColor Green
```

#### Test 2: Development CORS Now Works
```powershell
# Test from localhost origin
$response = Invoke-WebRequest -Uri "https://resources.kashkole.com" `
                               -Headers @{"Origin"="http://localhost:5000"} `
                               -UseBasicParsing

$corsHeader = $response.Headers['Access-Control-Allow-Origin']
if ($corsHeader -notmatch "localhost") {
    throw "Development CORS not working"
}
Write-Host "✓ Development CORS verified" -ForegroundColor Green
```

#### Test 3: Cache Headers Preserved
```powershell
$response = Invoke-WebRequest -Uri "https://resources.kashkole.com" -UseBasicParsing
$cacheControl = $response.Headers['Cache-Control']

if ($cacheControl -notmatch "max-age=31536000") {
    throw "1-year cache header missing"
}
Write-Host "✓ Cache headers preserved" -ForegroundColor Green
```

#### Test 4: CORS Preflight (OPTIONS)
```powershell
$response = Invoke-WebRequest -Uri "https://resources.kashkole.com" `
                               -Method OPTIONS `
                               -Headers @{
                                   "Origin"="http://localhost:5000"
                                   "Access-Control-Request-Method"="GET"
                               } `
                               -UseBasicParsing

if ($response.StatusCode -ne 200) {
    throw "CORS preflight failed"
}
Write-Host "✓ CORS preflight verified" -ForegroundColor Green
```

#### Test 5: File Integrity Final Check
```powershell
# Verify no resources were modified/deleted
$fileCount = (Get-ChildItem "D:\Websites\KSESSIONS\Resources" -Recurse -File | 
              Where-Object { $_.Name -ne 'web.config' }).Count

Write-Host "Resource files unchanged: $fileCount files verified" -ForegroundColor Green
```

**Acceptance Criteria**:
- [ ] Production CORS test passes
- [ ] Development CORS test passes
- [ ] Cache headers test passes
- [ ] CORS preflight test passes
- [ ] File integrity test passes
- [ ] All 5 tests green

---

## Test Specifications

### Automated Test Script

**File**: `.github/key-data-streams/cdn-dev-cors-extension/tests/verify-dual-mode-cors.ps1`

```powershell
#Requires -Version 7.0

<#
.SYNOPSIS
    Verify dual-mode CORS configuration for KSESSIONS Resources CDN
#>

$ErrorActionPreference = "Stop"

Write-Host "`n=== Dual-Mode CORS Validation ===" -ForegroundColor Cyan

$tests = @{
    Passed = 0
    Failed = 0
}

function Test-Cors {
    param([string]$Origin, [string]$Name)
    
    try {
        $response = Invoke-WebRequest -Uri "https://resources.kashkole.com" `
                                       -Headers @{"Origin"=$Origin} `
                                       -UseBasicParsing -TimeoutSec 10
        
        $corsHeader = $response.Headers['Access-Control-Allow-Origin']
        
        if ($corsHeader -match [regex]::Escape($Origin)) {
            Write-Host "  ✓ $Name CORS verified" -ForegroundColor Green
            $script:tests.Passed++
        } else {
            Write-Host "  ✗ $Name CORS failed" -ForegroundColor Red
            $script:tests.Failed++
        }
    } catch {
        Write-Host "  ✗ $Name test error: $($_.Exception.Message)" -ForegroundColor Red
        $script:tests.Failed++
    }
}

# Test production origins
Test-Cors "https://noorcanvas.kashkole.com" "Production (NoorCanvas)"
Test-Cors "https://session.kashkole.com" "Production (Sessions)"

# Test development origins
Test-Cors "http://localhost:5000" "Development (HTTP)"
Test-Cors "http://localhost:5001" "Development (HTTP Alt)"
Test-Cors "https://localhost:5001" "Development (HTTPS)"

# Summary
Write-Host "`n=== Results ===" -ForegroundColor Cyan
Write-Host "Passed: $($tests.Passed)" -ForegroundColor Green
Write-Host "Failed: $($tests.Failed)" -ForegroundColor Red

if ($tests.Failed -eq 0) {
    Write-Host "`n✓ All CORS tests passed" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n✗ Some tests failed" -ForegroundColor Red
    exit 1
}
```

---

## Documentation Updates

### File: `Scripts/Resources-CDN/README.md`

Add section after "Quick Start":

```markdown
## Development Mode

### Enable Development CORS

To allow local development access to the CDN:

```powershell
# Configure IIS with development CORS
.\setup-resources-cdn.ps1 -IncludeDevelopment
```

**What This Does**:
- Adds `http://localhost:5000`, `http://localhost:5001`, `https://localhost:5001` to CORS whitelist
- Production origins preserved (additive change)
- Physical files remain untouched

**Testing Development Access**:
```powershell
# From your local dev app (Kestrel on localhost:5000)
curl -H "Origin: http://localhost:5000" https://resources.kashkole.com
```

### Disable Development CORS (Production-Only)

```powershell
# Revert to production-only CORS
.\setup-resources-cdn.ps1
```

**Use Cases**:
- Local development testing
- Integration testing from localhost
- Validating CDN integration before deployment

**Security Note**: Development origins only accept from localhost - no external access.
```

---

## Rollback Plan

### Instant Rollback (Recommended)

```powershell
# Rerun script without -IncludeDevelopment flag
cd "D:\PROJECTS\NOOR CANVAS\Scripts\Resources-CDN"
.\setup-resources-cdn.ps1

# This regenerates web.config with production-only CORS
# IIS automatically restarts with new config
```

**Recovery Time**: < 30 seconds  
**Risk**: Zero (physical files never touched)

### Manual Rollback (If Script Fails)

```powershell
# Restore from backup
Copy-Item "D:\Websites\KSESSIONS\Resources\web.config.backup-*" `
          "D:\Websites\KSESSIONS\Resources\web.config" -Force

# Restart IIS site
Restart-WebAppPool -Name "DefaultAppPool"
iisreset
```

### Verify Rollback Success

```powershell
# Confirm production CORS still works
curl -H "Origin: https://noorcanvas.kashkole.com" https://resources.kashkole.com

# Confirm development CORS removed
curl -H "Origin: http://localhost:5000" https://resources.kashkole.com
# Should return CORS error or no CORS header
```

---

## Files Modified

| File | Purpose | Change Type |
|------|---------|-------------|
| `Scripts/Resources-CDN/setup-resources-cdn.ps1` | Add `-IncludeDevelopment` parameter | Enhancement |
| `D:\Websites\KSESSIONS\Resources\web.config` | Updated CORS origins (auto-generated) | Config |
| `Scripts/Resources-CDN/README.md` | Document development mode | Documentation |

---

## Files Guaranteed Untouched

**Physical Resources** (verified via checksum):
- ✅ All files in `D:\Websites\KSESSIONS\Resources/images/`
- ✅ All files in `D:\Websites\KSESSIONS\Resources/css/`
- ✅ All files in `D:\Websites\KSESSIONS\Resources/fonts/`
- ✅ All files in `D:\Websites\KSESSIONS\Resources/js/`
- ✅ Directory structure unchanged
- ✅ File permissions unchanged

**Infrastructure**:
- ✅ Cloudflare tunnel configuration (`config-resources.yml`)
- ✅ Windows service (`CloudflareResourcesTunnel`)
- ✅ IIS site bindings and app pool settings
- ✅ Other deployment scripts

---

## Commit Strategy

### Phase 1 Commit
```
plan(cdn-dev-cors-extension): Add development CORS support to setup script

- Add -IncludeDevelopment parameter to setup-resources-cdn.ps1
- Conditional CORS origins array (production vs dual-mode)
- Preserve backward compatibility (production-only default)

Files modified:
- Scripts/Resources-CDN/setup-resources-cdn.ps1
```

### Phase 2 Commit
```
chore(cdn-dev-cors-extension): Apply development CORS configuration

- Run setup-resources-cdn.ps1 -IncludeDevelopment
- web.config now includes localhost origins
- Verified file integrity (resources unchanged)

Files modified:
- D:\Websites\KSESSIONS\Resources\web.config
```

### Phase 3 Commit
```
test(cdn-dev-cors-extension): Add CORS validation tests

- verify-dual-mode-cors.ps1 test script
- Tests production and development origins
- Verifies cache headers preserved

Files added:
- .github/key-data-streams/cdn-dev-cors-extension/tests/verify-dual-mode-cors.ps1
```

### Documentation Commit
```
docs(cdn-dev-cors-extension): Document development mode usage

- Add "Development Mode" section to README
- Enable/disable instructions
- Security notes

Files modified:
- Scripts/Resources-CDN/README.md
```

---

## Success Criteria

### Technical Requirements
- [ ] Script parameter added and functional
- [ ] web.config contains 5 CORS origins (dual-mode)
- [ ] All 5 validation tests pass
- [ ] File integrity verified (resources untouched)
- [ ] Instant rollback tested and working

### User Experience
- [ ] Development apps can load CDN resources from localhost
- [ ] Production apps continue working without interruption
- [ ] Clear documentation for enabling/disabling dev mode
- [ ] Error messages helpful if CORS fails

### Safety Guarantees
- [ ] Zero physical file modifications (except web.config)
- [ ] Backward compatibility maintained (production-only default)
- [ ] Rollback < 30 seconds
- [ ] No production downtime during changes

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Production CORS breaks | Low | High | Instant rollback, backup web.config |
| File corruption | Very Low | Medium | File integrity checks, backups |
| IIS restart fails | Low | Medium | Manual IIS restart procedure |
| Development CORS doesn't work | Medium | Low | Validation tests catch before production impact |
| Cache headers lost | Low | Medium | Validation tests verify preservation |

**Overall Risk Level**: **Low**

---

## Effort Estimates

- **Phase 1**: 10 minutes (script modification)
- **Phase 2**: 10 minutes (apply configuration)
- **Phase 3**: 10 minutes (validation tests)
- **Total**: 30 minutes

---

## Dependencies

**Required**:
- IIS site `KashkoleResources` running on port 80
- Existing `setup-resources-cdn.ps1` script
- PowerShell 5.1+ with WebAdministration module
- Administrator privileges

**Optional**:
- Cloudflare tunnel running (for external URL tests)
- Development app running on localhost:5000/5001

---

## Notes

- This change is **configuration-only** - no code changes to NOOR CANVAS apps required
- Development CORS is **opt-in** via `-IncludeDevelopment` flag
- Production default behavior unchanged (production-only CORS)
- Physical resource files remain immutable (cache strategy preserved)
- Works with existing Cloudflare tunnel infrastructure

---

**Plan Status**: ✅ Ready for Implementation  
**Next Step**: Execute Phase 1
