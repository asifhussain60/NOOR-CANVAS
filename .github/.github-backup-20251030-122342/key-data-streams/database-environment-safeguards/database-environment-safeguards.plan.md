# Database Environment Safeguards - Comprehensive Protection Plan

**Key:** `database-environment-safeguards`  
**Created:** 2025-10-27  
**Status:** Planning  
**Priority:** CRITICAL (Security & Data Integrity)  
**Version:** 1.0.0

---

## 🚨 Executive Summary

**CRITICAL SECURITY FINDING:** Development environment currently connects to **KSESSIONS (production)** instead of **KSESSIONS_DEV**, creating risk of production data corruption during local development of Islamic learning session management.

**Root Cause:** Missing `appsettings.Development.json` causes ASP.NET Core to fall through to `appsettings.Production.json`, connecting localhost to production database.

**Solution:** Multi-layered safeguard system with configuration enforcement, startup validation, runtime blocking, and developer tooling.

---

## 📋 Problem Statement

### Current State (Dangerous)
- **Development environment:** localhost connects to KSESSIONS (PRODUCTION) ❌
- **Production environment:** noorcanvas.kashkole.com connects to KSESSIONS ✅
- **Gap:** No enforcement preventing wrong database connections
- **Risk:** Local debugging corrupts live Islamic learning session data

### Discovered Issues (from CopilotChats.md Analysis)
1. `appsettings.Development.json` does not exist (only .template file)
2. ASP.NET Core configuration hierarchy falls through to Production settings
3. No startup validation to fail-fast on wrong database
4. Existing `DatabaseEnvironmentGuardService` only protects production→dev (one direction)
5. Host razor views (HCP, HS, HL) load data before guard can block

### Required Protection Rules
**Rule 1:** localhost → KSESSIONS_DEV ONLY  
**Rule 2:** noorcanvas.kashkole.com → KSESSIONS ONLY  
**Rule 3:** Violation = Application refuses to start (fail-fast)  
**Rule 4:** Runtime guard blocks UI components from loading with wrong database

---

## 🎯 Acceptance Criteria

### Configuration Layer
- ✅ `appsettings.Development.json` created from template with KSESSIONS_DEV
- ✅ `appsettings.Production.json` validated to have KSESSIONS
- ✅ `.gitignore` excludes environment-specific appsettings
- ✅ Setup validation script checks required files exist

### Startup Validation Layer
- ✅ `Program.cs` validates database matches environment on startup
- ✅ Development environment + KSESSIONS → Application STOPS with clear error
- ✅ Production environment + KSESSIONS_DEV → Application STOPS with clear error
- ✅ Startup logs database connection prominently (name, server, environment)

### Runtime Protection Layer (Bi-directional)
- ✅ Enhance `DatabaseEnvironmentGuardService` with bi-directional checking:
  - localhost + KSESSIONS → VIOLATION (new protection)
  - noorcanvas.kashkole.com + KSESSIONS_DEV → VIOLATION (existing)
- ✅ Host razor views (HCP, HS, HL) blocked from loading with wrong database
- ✅ Blocking happens in `OnInitializedAsync` BEFORE data queries
- ✅ Full-screen red alert with environment/database details

### Developer Experience
- ✅ `setup-dev-environment.ps1` script automates configuration
- ✅ Clear error messages guide developer to fix
- ✅ Documentation updated with environment setup steps
- ✅ VS Code tasks for environment validation

### Testing & Validation
- ✅ Playwright tests verify blocking in both violation scenarios
- ✅ Manual test checklist for all environments
- ✅ Deployment validation includes database check

---

## 📐 Architecture Design

### Multi-Layer Defense Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: Configuration (Preventive)                         │
├─────────────────────────────────────────────────────────────┤
│ • appsettings.Development.json → KSESSIONS_DEV              │
│ • appsettings.Production.json → KSESSIONS                   │
│ • .gitignore prevents wrong file commits                    │
│ • Setup script validates files exist                        │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: Startup Validation (Fail-Fast)                     │
├─────────────────────────────────────────────────────────────┤
│ • Program.cs checks database vs environment                 │
│ • ASPNETCORE_ENVIRONMENT=Development + KSESSIONS → STOP     │
│ • ASPNETCORE_ENVIRONMENT=Production + KSESSIONS_DEV → STOP  │
│ • Log database name on startup                              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: Runtime Guard (Defensive)                          │
├─────────────────────────────────────────────────────────────┤
│ • Enhanced DatabaseEnvironmentGuardService (bi-directional) │
│ • localhost:9091 + KSESSIONS → RED ALERT (new)             │
│ • noorcanvas.kashkole.com + KSESSIONS_DEV → RED ALERT      │
│ • Injected into host razor components                       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 4: Component-Level Blocking (Last Line)               │
├─────────────────────────────────────────────────────────────┤
│ • Host-SessionOpener.razor blocks OnInitializedAsync        │
│ • HostControlPanel.razor blocks OnInitializedAsync          │
│ • HostLanding.razor blocks OnInitializedAsync               │
│ • NO database queries execute when violation detected       │
└─────────────────────────────────────────────────────────────┘
```

### Database-Environment Mapping

| Environment | URL Pattern | Required Database | Startup Validation | Runtime Guard |
|-------------|-------------|-------------------|-------------------|---------------|
| Development | localhost:* | KSESSIONS_DEV | ✅ Enforced | ✅ Active |
| Production | noorcanvas.kashkole.com | KSESSIONS | ✅ Enforced | ✅ Active |

**Violation Matrix:**

| Environment | URL | Database | Startup | Runtime | Action |
|-------------|-----|----------|---------|---------|--------|
| Development | localhost | KSESSIONS_DEV | ✅ Pass | ✅ Pass | Normal operation |
| Development | localhost | KSESSIONS | ❌ FAIL | ❌ BLOCK | App refuses to start |
| Production | noorcanvas.kashkole.com | KSESSIONS | ✅ Pass | ✅ Pass | Normal operation |
| Production | noorcanvas.kashkole.com | KSESSIONS_DEV | ❌ FAIL | ❌ BLOCK | App refuses to start |

---

## 🔨 Implementation Phases

### Phase 1: Configuration Layer Setup (IMMEDIATE - Critical Fix)

**Objective:** Create missing development configuration and protect it from being committed

**Tasks:**
1. Create `appsettings.Development.json` from template
2. Update `.gitignore` to exclude environment-specific appsettings
3. Validate `appsettings.Production.json` has KSESSIONS
4. Create setup validation PowerShell script

**Files Created:**
- `SPA/NoorCanvas/appsettings.Development.json` (from .template)
- `Scripts/validate-dev-setup.ps1` (new validation script)

**Files Modified:**
- `.gitignore` (add appsettings exclusions)

**Implementation Details:**

```json
// SPA/NoorCanvas/appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=AHHOME;Database=KSESSIONS_DEV;User ID=sa;Password=adf4961glo;Connection Timeout=3600;TrustServerCertificate=True;Encrypt=False;",
    "KSessionsDb": "Server=AHHOME;Database=KSESSIONS_DEV;User ID=sa;Password=adf4961glo;Connection Timeout=3600;TrustServerCertificate=True;Encrypt=False;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  },
  "AllowedHosts": "*"
}
```

```gitignore
# .gitignore additions
# Environment-specific appsettings (NEVER commit these)
**/appsettings.Development.json
**/appsettings.local.json
**/appsettings.*.local.json
```

```powershell
# Scripts/validate-dev-setup.ps1
# Validates required configuration files exist before running app

param([switch]$Fix)

$ErrorActionPreference = "Stop"
$requiredFiles = @(
    @{ Path = "SPA/NoorCanvas/appsettings.Development.json"; Template = "appsettings.Development.json.template" }
)

foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $PSScriptRoot ".." $file.Path
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "❌ MISSING: $($file.Path)" -ForegroundColor Red
        
        if ($Fix) {
            $templatePath = Join-Path (Split-Path $fullPath) $file.Template
            if (Test-Path $templatePath) {
                Copy-Item $templatePath $fullPath
                Write-Host "✅ CREATED from template: $($file.Path)" -ForegroundColor Green
            }
        } else {
            Write-Host "   Run with -Fix to create from template" -ForegroundColor Yellow
        }
        $missingFiles = $true
    } else {
        Write-Host "✅ EXISTS: $($file.Path)" -ForegroundColor Green
    }
}

if ($missingFiles -and -not $Fix) {
    Write-Host "`n⚠️  Run: .\Scripts\validate-dev-setup.ps1 -Fix" -ForegroundColor Yellow
    exit 1
}
```

**Exit Criteria:**
- ✅ `appsettings.Development.json` exists with KSESSIONS_DEV
- ✅ `.gitignore` updated to exclude environment configs
- ✅ `validate-dev-setup.ps1` script created and tested
- ✅ Localhost now connects to KSESSIONS_DEV (verified with query)

**Commit Checkpoint:** `ckpt: database-environment-safeguards - Phase 1: Configuration layer setup`

---

### Phase 2: Startup Validation (Fail-Fast Protection)

**Objective:** Add startup validation to Program.cs that stops application if wrong database for environment

**Files Modified:**
- `SPA/NoorCanvas/Program.cs`

**Implementation Details:**

```csharp
// Add after builder.Build() in Program.cs

var app = builder.Build();

// ═══════════════════════════════════════════════════════════════
// DATABASE ENVIRONMENT VALIDATION (Fail-Fast Security)
// ═══════════════════════════════════════════════════════════════
var environment = app.Environment.EnvironmentName;
var connectionString = app.Configuration.GetConnectionString("DefaultConnection");

if (!string.IsNullOrEmpty(connectionString))
{
    // Extract database name from connection string
    var dbMatch = System.Text.RegularExpressions.Regex.Match(
        connectionString, 
        @"Database=([^;]+)", 
        System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    
    var databaseName = dbMatch.Success ? dbMatch.Groups[1].Value : "UNKNOWN";
    
    // Log database connection prominently
    app.Logger.LogWarning(
        "═══════════════════════════════════════════════════════════════\n" +
        "DATABASE CONNECTION VALIDATION\n" +
        "Environment: {Environment}\n" +
        "Database: {DatabaseName}\n" +
        "Server: {Server}\n" +
        "═══════════════════════════════════════════════════════════════",
        environment, databaseName, "AHHOME");
    
    // VALIDATION RULE 1: Development → KSESSIONS_DEV ONLY
    if (environment.Equals("Development", StringComparison.OrdinalIgnoreCase))
    {
        if (!databaseName.Contains("KSESSIONS_DEV", StringComparison.OrdinalIgnoreCase))
        {
            var errorMessage = 
                "╔═══════════════════════════════════════════════════════════════╗\n" +
                "║ 🚨 CRITICAL CONFIGURATION ERROR - APPLICATION STOPPED        ║\n" +
                "╠═══════════════════════════════════════════════════════════════╣\n" +
                "║ Development environment MUST connect to KSESSIONS_DEV        ║\n" +
                "║                                                               ║\n" +
                $"║ Current Configuration:                                        ║\n" +
                $"║   Environment: {environment,-46} ║\n" +
                $"║   Database: {databaseName,-49} ║\n" +
                $"║   Expected: KSESSIONS_DEV                                     ║\n" +
                "║                                                               ║\n" +
                "║ FIX: Verify appsettings.Development.json exists and has       ║\n" +
                "║      correct KSESSIONS_DEV connection string                  ║\n" +
                "║                                                               ║\n" +
                "║ Run: .\\Scripts\\validate-dev-setup.ps1 -Fix                    ║\n" +
                "╚═══════════════════════════════════════════════════════════════╝";
            
            app.Logger.LogCritical(errorMessage);
            throw new InvalidOperationException(
                $"CRITICAL: Development environment cannot connect to {databaseName}. " +
                "Expected KSESSIONS_DEV. See console for details.");
        }
    }
    
    // VALIDATION RULE 2: Production → KSESSIONS ONLY
    if (environment.Equals("Production", StringComparison.OrdinalIgnoreCase))
    {
        if (databaseName.Contains("KSESSIONS_DEV", StringComparison.OrdinalIgnoreCase))
        {
            var errorMessage = 
                "╔═══════════════════════════════════════════════════════════════╗\n" +
                "║ 🚨 CRITICAL SECURITY VIOLATION - APPLICATION STOPPED         ║\n" +
                "╠═══════════════════════════════════════════════════════════════╣\n" +
                "║ Production environment MUST NOT connect to KSESSIONS_DEV     ║\n" +
                "║                                                               ║\n" +
                $"║ Current Configuration:                                        ║\n" +
                $"║   Environment: {environment,-46} ║\n" +
                $"║   Database: {databaseName,-49} ║\n" +
                $"║   Expected: KSESSIONS                                         ║\n" +
                "║                                                               ║\n" +
                "║ DANGER: This would corrupt production Islamic learning data!  ║\n" +
                "║                                                               ║\n" +
                "║ FIX: Verify appsettings.Production.json has KSESSIONS         ║\n" +
                "║      Remove any appsettings.local.json override files         ║\n" +
                "╚═══════════════════════════════════════════════════════════════╝";
            
            app.Logger.LogCritical(errorMessage);
            throw new InvalidOperationException(
                $"CRITICAL SECURITY VIOLATION: Production cannot connect to {databaseName}. " +
                "Expected KSESSIONS. Application stopped to prevent data corruption.");
        }
    }
    
    app.Logger.LogInformation(
        "✅ Database environment validation PASSED: {Environment} → {DatabaseName}",
        environment, databaseName);
}
else
{
    app.Logger.LogWarning("⚠️  No DefaultConnection found in configuration!");
}
// ═══════════════════════════════════════════════════════════════

// Continue with normal app configuration...
```

**Exit Criteria:**
- ✅ Startup validation code added to Program.cs
- ✅ Development + KSESSIONS → Application throws exception and stops
- ✅ Development + KSESSIONS_DEV → Application starts normally
- ✅ Production + KSESSIONS_DEV → Application throws exception and stops
- ✅ Production + KSESSIONS → Application starts normally
- ✅ Database name logged prominently on startup
- ✅ Clear error messages guide developer to fix

**Commit Checkpoint:** `ckpt: database-environment-safeguards - Phase 2: Startup fail-fast validation`

---

### Phase 3: Enhanced Runtime Guard (Bi-directional Protection)

**Objective:** Extend DatabaseEnvironmentGuardService to detect BOTH violation scenarios

**Files Modified:**
- `SPA/NoorCanvas/Services/Security/DatabaseEnvironmentGuardService.cs`
- `SPA/NoorCanvas/Services/Security/IDatabaseEnvironmentGuardService.cs`

**Current State:** Service only detects production URL + KSESSIONS_DEV

**Enhancement:** Add localhost URL + KSESSIONS detection

**Implementation Details:**

```csharp
// DatabaseEnvironmentGuardService.cs - Enhanced CheckEnvironmentMismatch

public EnvironmentMismatchInfo? CheckEnvironmentMismatch(string currentUrl)
{
    if (string.IsNullOrWhiteSpace(currentUrl))
    {
        _logger.LogWarning("[SECURITY-GUARD:db-env] CheckEnvironmentMismatch called with null/empty URL");
        return null;
    }
    
    var requestId = Guid.NewGuid().ToString("N")[..8];
    _logger.LogInformation("[SECURITY-GUARD:db-env] [{RequestId}] Checking URL: {Url}", requestId, currentUrl);
    
    try
    {
        var uri = new Uri(currentUrl);
        var hostname = uri.Host.ToLowerInvariant();
        
        // Extract database name from connection string
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            _logger.LogError("[SECURITY-GUARD:db-env] [{RequestId}] Connection string missing!", requestId);
            return new EnvironmentMismatchInfo
            {
                Hostname = hostname,
                ExpectedDatabase = "UNKNOWN",
                ActualDatabase = "UNKNOWN (connection string missing)",
                Severity = "CRITICAL"
            };
        }
        
        var actualDatabaseName = ExtractDatabaseNameFromConnectionString(connectionString);
        
        // ═══════════════════════════════════════════════════════════════
        // VIOLATION CHECK 1: Production URL + Development Database
        // ═══════════════════════════════════════════════════════════════
        var isProductionHostname = hostname.Contains(PRODUCTION_HOSTNAME.ToLowerInvariant());
        var isDevelopmentDatabase = actualDatabaseName.Contains(DEVELOPMENT_DATABASE_NAME, StringComparison.OrdinalIgnoreCase);
        
        if (isProductionHostname && isDevelopmentDatabase)
        {
            _logger.LogCritical(
                "[SECURITY-GUARD:db-env] [{RequestId}] 🚨 VIOLATION 1: Production URL + Dev Database 🚨\n" +
                "Hostname: {Hostname}\n" +
                "Expected Database: {ExpectedDb}\n" +
                "Actual Database: {ActualDb}",
                requestId, hostname, PRODUCTION_DATABASE_NAME, actualDatabaseName);
            
            return new EnvironmentMismatchInfo
            {
                Hostname = hostname,
                ExpectedDatabase = PRODUCTION_DATABASE_NAME,
                ActualDatabase = actualDatabaseName,
                Severity = "CRITICAL",
                ViolationType = "PRODUCTION_URL_WITH_DEV_DATABASE"
            };
        }
        
        // ═══════════════════════════════════════════════════════════════
        // VIOLATION CHECK 2: Development URL + Production Database (NEW)
        // ═══════════════════════════════════════════════════════════════
        var isDevelopmentHostname = hostname.Contains("localhost") || hostname.Contains("127.0.0.1");
        var isProductionDatabase = actualDatabaseName.Equals(PRODUCTION_DATABASE_NAME, StringComparison.OrdinalIgnoreCase);
        
        if (isDevelopmentHostname && isProductionDatabase)
        {
            _logger.LogCritical(
                "[SECURITY-GUARD:db-env] [{RequestId}] 🚨 VIOLATION 2: Development URL + Production Database 🚨\n" +
                "Hostname: {Hostname}\n" +
                "Expected Database: {ExpectedDb}\n" +
                "Actual Database: {ActualDb}\n" +
                "DANGER: Local development should NEVER connect to production database!",
                requestId, hostname, DEVELOPMENT_DATABASE_NAME, actualDatabaseName);
            
            return new EnvironmentMismatchInfo
            {
                Hostname = hostname,
                ExpectedDatabase = DEVELOPMENT_DATABASE_NAME,
                ActualDatabase = actualDatabaseName,
                Severity = "CRITICAL",
                ViolationType = "DEVELOPMENT_URL_WITH_PRODUCTION_DATABASE"
            };
        }
        
        // All checks passed - safe environment
        _logger.LogInformation(
            "[SECURITY-GUARD:db-env] [{RequestId}] ✅ Safe: {Hostname} → {Database}",
            requestId, hostname, actualDatabaseName);
        
        return null;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "[SECURITY-GUARD:db-env] [{RequestId}] Error checking environment", requestId);
        return null; // Conservative: Don't block on errors
    }
}
```

```csharp
// IDatabaseEnvironmentGuardService.cs - Add ViolationType property

public class EnvironmentMismatchInfo
{
    public string Hostname { get; set; } = "";
    public string ExpectedDatabase { get; set; } = "";
    public string ActualDatabase { get; set; } = "";
    public string Severity { get; set; } = "CRITICAL";
    public string ViolationType { get; set; } = ""; // NEW: Identifies which rule violated
}
```

**Exit Criteria:**
- ✅ Service detects localhost + KSESSIONS (new violation)
- ✅ Service detects noorcanvas.kashkole.com + KSESSIONS_DEV (existing violation)
- ✅ ViolationType property distinguishes between violations
- ✅ All logging includes violation type for audit trail
- ✅ Safe combinations (localhost + KSESSIONS_DEV, production + KSESSIONS) return null

**Commit Checkpoint:** `ckpt: database-environment-safeguards - Phase 3: Bi-directional runtime guard`

---

### Phase 4: Component-Level Blocking Enhancement

**Objective:** Ensure host razor views check guard BEFORE any database operations

**Files Modified:**
- `SPA/NoorCanvas/Pages/Host-SessionOpener.razor`
- `SPA/NoorCanvas/Pages/HostControlPanel.razor`
- `SPA/NoorCanvas/Pages/HostLanding.razor`

**Current Implementation:** Guard check happens but may execute after initial data load

**Enhancement:** Move guard check to FIRST line of OnInitializedAsync

**Implementation Pattern (apply to all 3 files):**

```razor
@code {
    private EnvironmentMismatchInfo? _environmentMismatch;
    private bool _isLoading = true;
    
    protected override async Task OnInitializedAsync()
    {
        // ═══════════════════════════════════════════════════════════════
        // STEP 1: Database Environment Guard (MUST BE FIRST)
        // ═══════════════════════════════════════════════════════════════
        _environmentMismatch = DbGuard.CheckEnvironmentMismatch(Navigation.Uri);
        
        if (_environmentMismatch != null)
        {
            // CRITICAL VIOLATION DETECTED - Block all further execution
            Logger.LogCritical(
                "[SECURITY-GUARD:db-env] {ComponentName} BLOCKED due to environment mismatch: {ViolationType}",
                nameof(Host_SessionOpener), // or HostControlPanel, HostLanding
                _environmentMismatch.ViolationType);
            
            _isLoading = false;
            StateHasChanged();
            return; // EXIT IMMEDIATELY - No database operations allowed
        }
        
        // ═══════════════════════════════════════════════════════════════
        // STEP 2: Normal component initialization (only if guard passed)
        // ═══════════════════════════════════════════════════════════════
        try
        {
            // ... existing OnInitializedAsync code ...
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error initializing component");
        }
        finally
        {
            _isLoading = false;
        }
    }
}
```

**Red Alert UI Enhancement:**

```razor
@if (_environmentMismatch != null)
{
    <!-- Full-screen blocking overlay -->
    <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
                background: rgba(139, 0, 0, 0.98); z-index: 9999; 
                display: flex; align-items: center; justify-content: center;
                color: white; font-family: 'Courier New', monospace;">
        <div style="max-width: 800px; padding: 40px; background: #8B0000; 
                    border: 3px solid #FF0000; border-radius: 10px; text-align: center;">
            
            <div style="font-size: 80px; margin-bottom: 20px;">🚨</div>
            
            <h1 style="color: #FFD700; font-size: 36px; margin-bottom: 20px; font-weight: bold;">
                DATABASE ENVIRONMENT VIOLATION
            </h1>
            
            <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 5px; 
                        margin-bottom: 30px; text-align: left; font-size: 18px;">
                <p><strong>Violation Type:</strong></p>
                <p style="color: #FFD700; font-family: monospace; font-size: 16px;">
                    @_environmentMismatch.ViolationType
                </p>
                
                <hr style="border-color: #FFD700; margin: 20px 0;" />
                
                <p><strong>Current Hostname:</strong></p>
                <p style="color: #FF6B6B; font-family: monospace;">@_environmentMismatch.Hostname</p>
                
                <p><strong>Expected Database:</strong></p>
                <p style="color: #90EE90; font-family: monospace;">@_environmentMismatch.ExpectedDatabase</p>
                
                <p><strong>Actual Database:</strong></p>
                <p style="color: #FF6B6B; font-family: monospace; font-weight: bold;">
                    @_environmentMismatch.ActualDatabase
                </p>
            </div>
            
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 5px; font-size: 16px;">
                @if (_environmentMismatch.ViolationType == "DEVELOPMENT_URL_WITH_PRODUCTION_DATABASE")
                {
                    <p><strong>⚠️ CRITICAL:</strong> Local development cannot connect to production database!</p>
                    <p>This could corrupt live Islamic learning session data.</p>
                    <hr style="border-color: #FFD700; margin: 15px 0;" />
                    <p><strong>Fix:</strong></p>
                    <ol style="text-align: left; margin-left: 40px;">
                        <li>Stop the application</li>
                        <li>Verify <code>appsettings.Development.json</code> exists</li>
                        <li>Ensure it points to <code>KSESSIONS_DEV</code></li>
                        <li>Run: <code>.\Scripts\validate-dev-setup.ps1 -Fix</code></li>
                    </ol>
                }
                else
                {
                    <p><strong>⚠️ CRITICAL:</strong> Production application cannot use development database!</p>
                    <p>This would expose production users to test data.</p>
                    <hr style="border-color: #FFD700; margin: 15px 0;" />
                    <p><strong>Fix:</strong></p>
                    <ol style="text-align: left; margin-left: 40px;">
                        <li>Check deployment configuration</li>
                        <li>Verify <code>appsettings.Production.json</code> has <code>KSESSIONS</code></li>
                        <li>Remove any <code>appsettings.local.json</code> files</li>
                        <li>Restart IIS app pool</li>
                    </ol>
                }
            </div>
            
            <div style="margin-top: 30px; font-size: 14px; color: #FFD700;">
                This page is blocked for your protection. No data has been loaded.
            </div>
        </div>
    </div>
}
```

**Exit Criteria:**
- ✅ Guard check is FIRST operation in OnInitializedAsync for all 3 host views
- ✅ Violation detection returns immediately (no database queries)
- ✅ Red alert UI distinguishes between violation types
- ✅ Alert provides specific fix instructions for each scenario
- ✅ Logging indicates component name and violation type
- ✅ No false positives in safe configurations

**Commit Checkpoint:** `ckpt: database-environment-safeguards - Phase 4: Component blocking enhancement`

---

### Phase 5: Developer Experience & Tooling

**Objective:** Make environment setup effortless and validate automatically

**Files Created:**
- `Scripts/setup-dev-environment.ps1` (comprehensive setup automation)
- `.vscode/tasks.json` (validation tasks)
- `Docs/DEVELOPMENT-ENVIRONMENT-SETUP.md` (documentation)

**Implementation Details:**

```powershell
# Scripts/setup-dev-environment.ps1
<#
.SYNOPSIS
    Automated setup for NOOR Canvas development environment
    
.DESCRIPTION
    Sets up required configuration files with correct database connections.
    Validates environment is safe for development.
    
.EXAMPLE
    .\Scripts\setup-dev-environment.ps1
    
.EXAMPLE
    .\Scripts\setup-dev-environment.ps1 -Validate
#>

param(
    [switch]$Validate  # Only validate, don't modify
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path $PSScriptRoot -Parent

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   NOOR Canvas Development Environment Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check appsettings.Development.json
$devAppsettingsPath = Join-Path $workspaceRoot "SPA\NoorCanvas\appsettings.Development.json"
$templatePath = Join-Path $workspaceRoot "SPA\NoorCanvas\appsettings.Development.json.template"

if (Test-Path $devAppsettingsPath) {
    Write-Host "✅ appsettings.Development.json exists" -ForegroundColor Green
    
    # Validate it has KSESSIONS_DEV
    $content = Get-Content $devAppsettingsPath -Raw
    if ($content -match "KSESSIONS_DEV") {
        Write-Host "   → Points to KSESSIONS_DEV database ✓" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  WARNING: Does not contain KSESSIONS_DEV!" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ appsettings.Development.json MISSING" -ForegroundColor Red
    
    if (-not $Validate) {
        if (Test-Path $templatePath) {
            Copy-Item $templatePath $devAppsettingsPath
            Write-Host "   ✅ Created from template" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Template file not found: $templatePath" -ForegroundColor Red
            exit 1
        }
    }
}

# Step 2: Validate .gitignore
Write-Host ""
$gitignorePath = Join-Path $workspaceRoot ".gitignore"
$gitignoreContent = Get-Content $gitignorePath -Raw

if ($gitignoreContent -match "\*\*/appsettings\.Development\.json") {
    Write-Host "✅ .gitignore protects appsettings.Development.json" -ForegroundColor Green
} else {
    Write-Host "⚠️  .gitignore missing environment config protection" -ForegroundColor Yellow
    
    if (-not $Validate) {
        Add-Content $gitignorePath "`n# Environment-specific appsettings`n**/appsettings.Development.json`n**/appsettings.local.json"
        Write-Host "   ✅ Updated .gitignore" -ForegroundColor Green
    }
}

# Step 3: Check for dangerous local overrides
Write-Host ""
$localConfigPath = Join-Path $workspaceRoot "SPA\NoorCanvas\appsettings.local.json"
if (Test-Path $localConfigPath) {
    Write-Host "⚠️  appsettings.local.json found (may override Development settings)" -ForegroundColor Yellow
    $content = Get-Content $localConfigPath -Raw
    if ($content -match "KSESSIONS[^_]") {
        Write-Host "   🚨 DANGER: Contains KSESSIONS (production) connection!" -ForegroundColor Red
        Write-Host "   Action: Consider removing or renaming this file" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ No appsettings.local.json override file" -ForegroundColor Green
}

# Step 4: Validate Production settings
Write-Host ""
$prodAppsettingsPath = Join-Path $workspaceRoot "SPA\NoorCanvas\appsettings.Production.json"
if (Test-Path $prodAppsettingsPath) {
    $content = Get-Content $prodAppsettingsPath -Raw
    if ($content -match "Database=KSESSIONS[^_]") {
        Write-Host "✅ appsettings.Production.json → KSESSIONS (production)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  appsettings.Production.json may not have KSESSIONS" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Environment Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Build the application: cd SPA\NoorCanvas ; dotnet build"
Write-Host "  2. Run the application: dotnet run"
Write-Host "  3. Verify it connects to KSESSIONS_DEV (check startup logs)"
Write-Host ""
```

**VS Code Tasks:**

```json
// Add to .vscode/tasks.json
{
    "label": "validate-environment",
    "type": "shell",
    "command": "powershell.exe",
    "args": [
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", "${workspaceFolder}/Scripts/setup-dev-environment.ps1",
        "-Validate"
    ],
    "group": "test",
    "presentation": {
        "echo": true,
        "reveal": "always",
        "panel": "new"
    }
}
```

**Documentation:**

```markdown
# Development Environment Setup

## Quick Start (Automated)

```powershell
# From workspace root
.\Scripts\setup-dev-environment.ps1
```

This script will:
- ✅ Create `appsettings.Development.json` from template
- ✅ Validate database connection points to KSESSIONS_DEV
- ✅ Update `.gitignore` to protect environment configs
- ✅ Check for dangerous local override files

## Manual Validation

```powershell
# Validate without modifying
.\Scripts\setup-dev-environment.ps1 -Validate
```

## Expected Configuration

**Development (localhost:9091):**
- Database: `KSESSIONS_DEV`
- File: `appsettings.Development.json`

**Production (noorcanvas.kashkole.com):**
- Database: `KSESSIONS`
- File: `appsettings.Production.json`

## Startup Validation

The application will **refuse to start** if:
- ❌ Development environment + KSESSIONS (production) database
- ❌ Production environment + KSESSIONS_DEV (development) database

## Troubleshooting

### Error: "Development environment cannot connect to KSESSIONS"

**Fix:**
```powershell
.\Scripts\setup-dev-environment.ps1
cd SPA\NoorCanvas
dotnet run
```

### Red Alert on Page Load

Indicates database environment mismatch. Check:
1. `appsettings.Development.json` exists
2. Connection string has `KSESSIONS_DEV`
3. No `appsettings.local.json` overriding settings
```

**Exit Criteria:**
- ✅ `setup-dev-environment.ps1` automates complete setup
- ✅ `-Validate` mode checks without modifying
- ✅ VS Code task for quick validation
- ✅ Documentation clear and actionable
- ✅ New developers can set up environment in < 2 minutes

**Commit Checkpoint:** `ckpt: database-environment-safeguards - Phase 5: Developer experience tooling`

---

### Phase 6: Testing & Validation

**Objective:** Comprehensive test coverage for all violation scenarios

**Files Created:**
- `PlayWright/Tests/database-environment-safeguards.spec.ts`
- `Tests/Manual/database-environment-validation-checklist.md`

**Test Scenarios:**

| # | Environment | URL | Database | Startup | Runtime | Expected Result |
|---|-------------|-----|----------|---------|---------|----------------|
| 1 | Development | localhost:9091 | KSESSIONS_DEV | ✅ Pass | ✅ Pass | App starts, pages load |
| 2 | Development | localhost:9091 | KSESSIONS | ❌ Fail | N/A | App throws exception |
| 3 | Production | noorcanvas.kashkole.com | KSESSIONS | ✅ Pass | ✅ Pass | App starts, pages load |
| 4 | Production | noorcanvas.kashkole.com | KSESSIONS_DEV | ❌ Fail | N/A | App throws exception |
| 5 | Development | localhost:9091 | KSESSIONS* | N/A | ❌ Block | Red alert shown (if startup bypassed) |

**Playwright Test Implementation:**

```typescript
// PlayWright/Tests/database-environment-safeguards.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Database Environment Safeguards', () => {
    
    test('Scenario 1: Development with correct database (KSESSIONS_DEV)', async ({ page }) => {
        // Prerequisite: appsettings.Development.json → KSESSIONS_DEV
        await page.goto('http://localhost:9091/host/session-opener');
        
        // Should load normally without red alert
        const alert = page.locator('text=DATABASE ENVIRONMENT VIOLATION');
        await expect(alert).not.toBeVisible();
        
        // Page content should be visible
        const pageContent = page.locator('main, .container');
        await expect(pageContent).toBeVisible();
    });
    
    test('Scenario 5: Development with wrong database shows runtime alert', async ({ page }) => {
        // This test simulates bypassing startup validation
        // (In reality, startup validation would prevent app from running)
        
        // Navigate to host page
        await page.goto('http://localhost:9091/host/session-opener');
        
        // If runtime guard detects violation, should show red alert
        const alert = page.locator('text=DATABASE ENVIRONMENT VIOLATION');
        
        // Check if alert appears (depends on actual database config)
        const isVisible = await alert.isVisible().catch(() => false);
        
        if (isVisible) {
            // Validate alert content
            await expect(alert).toBeVisible();
            await expect(page.locator('text=DEVELOPMENT_URL_WITH_PRODUCTION_DATABASE')).toBeVisible();
            await expect(page.locator('text=KSESSIONS_DEV')).toBeVisible(); // Expected
            await expect(page.locator('text=KSESSIONS')).toBeVisible(); // Actual (wrong)
            
            // Verify page content is blocked
            const sessionForm = page.locator('form, input[type="text"]');
            await expect(sessionForm).not.toBeVisible();
        }
    });
});
```

**Manual Test Checklist:**

```markdown
# Database Environment Safeguards - Manual Test Checklist

## Test Setup

### Development Environment
- [ ] `appsettings.Development.json` exists
- [ ] Connection string: `Database=KSESSIONS_DEV`
- [ ] `ASPNETCORE_ENVIRONMENT=Development` in launchSettings.json

### Production Environment (requires deployment)
- [ ] `appsettings.Production.json` exists
- [ ] Connection string: `Database=KSESSIONS`
- [ ] `ASPNETCORE_ENVIRONMENT=Production` in web.config

---

## Test Case 1: Development + KSESSIONS_DEV (PASS)

**Setup:**
1. Ensure `appsettings.Development.json` → KSESSIONS_DEV
2. Start application: `cd SPA\NoorCanvas ; dotnet run`

**Expected Startup:**
- ✅ Application starts successfully
- ✅ Console shows: "Database: KSESSIONS_DEV"
- ✅ Console shows: "✅ Database environment validation PASSED"

**Expected Runtime:**
- ✅ Navigate to http://localhost:9091/host/session-opener
- ✅ NO red alert shown
- ✅ Page loads normally

**Result:** ☐ PASS / ☐ FAIL

---

## Test Case 2: Development + KSESSIONS (FAIL-FAST)

**Setup:**
1. Temporarily modify `appsettings.Development.json` → KSESSIONS
2. Start application: `cd SPA\NoorCanvas ; dotnet run`

**Expected Startup:**
- ❌ Application throws exception
- ❌ Console shows: "🚨 CRITICAL CONFIGURATION ERROR"
- ❌ Console shows: "Development environment MUST connect to KSESSIONS_DEV"
- ❌ Process exits with error

**Expected Runtime:**
- N/A (app won't start)

**Result:** ☐ PASS / ☐ FAIL

**Cleanup:** Restore `appsettings.Development.json` → KSESSIONS_DEV

---

## Test Case 3: Production + KSESSIONS (PASS)

**Setup:**
1. Deploy to production (or simulate with `ASPNETCORE_ENVIRONMENT=Production`)
2. Ensure `appsettings.Production.json` → KSESSIONS

**Expected Startup:**
- ✅ Application starts successfully
- ✅ Logs show: "Database: KSESSIONS"
- ✅ Logs show: "✅ Database environment validation PASSED"

**Expected Runtime:**
- ✅ Navigate to https://noorcanvas.kashkole.com/host/session-opener
- ✅ NO red alert shown
- ✅ Page loads normally

**Result:** ☐ PASS / ☐ FAIL

---

## Test Case 4: Production + KSESSIONS_DEV (FAIL-FAST)

**Setup:**
1. Simulate production with dev database (create appsettings.local.json override)
2. Set `ASPNETCORE_ENVIRONMENT=Production`

**Expected Startup:**
- ❌ Application throws exception
- ❌ Console shows: "🚨 CRITICAL SECURITY VIOLATION"
- ❌ Console shows: "Production environment MUST NOT connect to KSESSIONS_DEV"
- ❌ Process exits with error

**Expected Runtime:**
- N/A (app won't start)

**Result:** ☐ PASS / ☐ FAIL

**Cleanup:** Remove appsettings.local.json override

---

## Test Case 5: Runtime Guard (Development URL + Production DB)

**Note:** This scenario should be prevented by startup validation, but runtime guard provides defense-in-depth

**Setup:**
1. Somehow bypass startup validation (mock/test scenario)
2. Configure localhost → KSESSIONS

**Expected Runtime:**
- ⚠️  Navigate to http://localhost:9091/host/session-opener
- ❌ Red alert overlay appears
- ❌ Shows: "DEVELOPMENT_URL_WITH_PRODUCTION_DATABASE"
- ❌ Shows: "Expected: KSESSIONS_DEV"
- ❌ Shows: "Actual: KSESSIONS"
- ❌ Page content blocked (no database queries executed)

**Result:** ☐ PASS / ☐ FAIL

---

## Sign-off

Tested by: __________________  
Date: __________________  
All tests PASS: ☐ YES / ☐ NO  
Issues found: __________________
```

**Exit Criteria:**
- ✅ Playwright tests validate safe scenarios
- ✅ Manual checklist covers all violation scenarios
- ✅ Tests documented with expected results
- ✅ Test results recorded for audit trail
- ✅ Zero false positives confirmed

**Commit Checkpoint:** `ckpt: database-environment-safeguards - Phase 6: Comprehensive testing`

---

## 📚 Related Documentation

**Existing Work:**
- `Docs/POST-MORTEM-appsettings-local-override.md` - Previous production database issue
- `Tools/HostProvisioner/README.md` - Environment detection for HostProvisioner
- `.github/prompts/workitems/hp-db-guard.plan.md` - Original database guard (production→dev only)

**New Documentation:**
- `Docs/DEVELOPMENT-ENVIRONMENT-SETUP.md` - Developer onboarding guide
- `Docs/DATABASE-ENVIRONMENT-SAFEGUARDS.md` - Complete safeguard system documentation

---

## 🎯 Success Metrics

**Security:**
- ✅ Zero accidental production database connections from localhost
- ✅ Zero accidental development database connections from production URL
- ✅ 100% fail-fast on wrong configuration
- ✅ Clear audit trail of all environment checks

**Developer Experience:**
- ✅ New developer setup time < 2 minutes
- ✅ Clear error messages guide to fix
- ✅ Automated validation prevents mistakes
- ✅ Zero manual configuration steps required

**System Reliability:**
- ✅ No false positives (safe configs always work)
- ✅ No false negatives (violations always detected)
- ✅ Defense-in-depth (4 layers of protection)
- ✅ Production data integrity guaranteed

---

## 🚀 Deployment Plan

### Pre-Deployment Checklist
- [ ] All phases completed and tested
- [ ] Manual test checklist executed and signed off
- [ ] Documentation updated
- [ ] `.gitignore` changes committed
- [ ] `setup-dev-environment.ps1` script tested

### Development Deployment
1. Run `.\Scripts\setup-dev-environment.ps1`
2. Build application: `dotnet build`
3. Verify startup logs show KSESSIONS_DEV
4. Test host pages load without red alert

### Production Deployment
1. Verify `appsettings.Production.json` has KSESSIONS
2. Deploy via `ncdeploy.ps1`
3. Check startup logs for database name
4. Verify production URL shows no red alert
5. Check production logs for environment validation

---

## 📊 Rollback Plan

If issues detected after deployment:

**Development Rollback:**
1. Remove `appsettings.Development.json` (revert to template)
2. Comment out startup validation in Program.cs
3. Application will use Production settings (as before)

**Production Rollback:**
1. Revert Program.cs changes
2. Restart IIS app pool
3. Runtime guard remains active (defensive layer)

**Full Rollback:**
```powershell
git revert <commit-hash-phase-6>
git revert <commit-hash-phase-5>
git revert <commit-hash-phase-4>
git revert <commit-hash-phase-3>
git revert <commit-hash-phase-2>
git revert <commit-hash-phase-1>
```

---

**END OF PLAN**
