# User Landing Canvas Routing Implementation Plan

---
**Key**: `user-landing`  
**Branch**: `development`  
**Created**: 2025-10-20  
**Status**: Planning Complete  
**Agent**: Planning Orchestrator v1.0

---

## Executive Summary

**Problem**: Host selects between "Asset Share" and "Section Share" on `HostControlPanel.razor`, but this selection is only tracked locally in the `selectedCanvasType` variable. When users register on `UserLanding.razor` during an active session, the application doesn't know which canvas type the host selected, resulting in incorrect routing (always defaulting to SessionCanvas).

**Solution**: Persist the host's canvas selection to the `canvas.Sessions` database table and update `UserLanding.razor` to read this value for intelligent routing decisions.

**Impact**:
- ✅ Users route to correct canvas based on host selection
- ✅ Supports both Asset Share (SessionCanvas) and Section Share (TranscriptCanvas) flows
- ✅ Backward compatible with existing sessions (default to "asset")
- ✅ Production-ready with migration scripts for both environments

---

## Current State Analysis

### Existing Behavior

**HostControlPanel.razor** (Lines 141, 1248, 1267, 1270):
- ✅ Tracks `selectedCanvasType` locally (default: "asset")
- ✅ Sends `canvasType` parameter to API on session start
- ✅ Callback `HandleCanvasSelected()` updates local state
- ❌ Selection NOT persisted to database

**UserLanding.razor** (Lines 691, 918, 1115):
- ✅ Routes registered users to `/session/canvas/{token}` (SessionCanvas)
- ❌ No logic to check canvas type from database
- ❌ No route to `/transcript/canvas/{token}` (TranscriptCanvas)

**Database** (`canvas.Sessions` table):
- ❌ No `CanvasType` column exists
- ✅ Table schema allows nullable columns (safe migration path)

**API** (`HostController.StartSession`):
- ✅ Accepts `canvasType` query parameter
- ❌ Does NOT save `canvasType` to database

---

## Solution Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Host Control Panel                          │
│  User clicks: "Asset Share" OR "Section Share"                 │
│  selectedCanvasType = "asset" | "transcript"                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ POST /api/host/session/{id}/start?canvasType={type}
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HostController.StartSession                  │
│  1. Validate canvasType ("asset" | "transcript")                │
│  2. Update session.Status = "Active"                            │
│  3. Save session.CanvasType = canvasType                        │
│  4. Save to database                                            │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  canvas.Sessions Table                          │
│  SessionId | HostToken | UserToken | Status  | CanvasType      │
│  215       | ABC123    | XYZ789    | Active  | "asset"         │
│  216       | DEF456    | UVW012    | Active  | "transcript"    │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ User registers with token
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UserLanding.razor                          │
│  1. Validate token → Get SessionId                              │
│  2. Query canvas.Sessions.CanvasType                            │
│  3. Route based on CanvasType:                                  │
│     - "asset" → /session/canvas/{token}                         │
│     - "transcript" → /transcript/canvas/{token}                 │
│     - NULL → /session/canvas/{token} (backward compat)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database Schema Migration

**Objective**: Add `CanvasType` column to `canvas.Sessions` table in both DEV and PROD

**Duration**: 45 minutes  
**Risk Level**: Low (nullable column, no breaking changes)

#### Tasks

##### Task 1.1: Create DEV Migration Script
**File**: `Migrations/migration-{timestamp}-add-canvastype-column.sql`

```sql
-- =============================================
-- Migration: Add CanvasType Column to canvas.Sessions
-- Database: KSESSIONS_DEV
-- Date: 2025-10-20
-- Author: GitHub Copilot
-- Protocol: deployment-migration v1.0
-- =============================================

USE [KSESSIONS_DEV];
GO

SET NOCOUNT ON;
PRINT '';
PRINT '========================================';
PRINT 'Add CanvasType to canvas.Sessions';
PRINT 'Database: ' + DB_NAME();
PRINT 'Date: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
PRINT '';

-- STEP 1: Validation
PRINT '>> STEP 1: Validation Checks';
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'canvas')
BEGIN
    RAISERROR('ERROR: canvas schema does not exist', 16, 1);
    RETURN;
END
PRINT '  ✅ canvas schema exists';

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('canvas') AND name = 'Sessions')
BEGIN
    RAISERROR('ERROR: canvas.Sessions table does not exist', 16, 1);
    RETURN;
END
PRINT '  ✅ canvas.Sessions table exists';

-- Check if column already exists
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'canvas' 
    AND TABLE_NAME = 'Sessions' 
    AND COLUMN_NAME = 'CanvasType'
)
BEGIN
    PRINT '  ⚠️  CanvasType column already exists - migration skipped';
    RETURN;
END
PRINT '  ✅ CanvasType column does not exist - migration needed';

-- STEP 2: Add Column
PRINT '';
PRINT '>> STEP 2: Add CanvasType Column';
BEGIN TRY
    ALTER TABLE [canvas].[Sessions]
    ADD [CanvasType] NVARCHAR(20) NULL DEFAULT 'asset';
    
    PRINT '  ✅ Added CanvasType column (NVARCHAR(20), NULL, DEFAULT ''asset'')';
END TRY
BEGIN CATCH
    PRINT '  ❌ ERROR: ' + ERROR_MESSAGE();
    RETURN;
END CATCH

-- STEP 3: Update Existing Rows
PRINT '';
PRINT '>> STEP 3: Update Existing Sessions';
BEGIN TRY
    UPDATE [canvas].[Sessions]
    SET [CanvasType] = 'asset'
    WHERE [CanvasType] IS NULL;
    
    PRINT '  ✅ Updated ' + CAST(@@ROWCOUNT AS VARCHAR) + ' existing sessions to ''asset''';
END TRY
BEGIN CATCH
    PRINT '  ❌ ERROR: ' + ERROR_MESSAGE();
    RETURN;
END CATCH

-- STEP 4: Create Index
PRINT '';
PRINT '>> STEP 4: Create Performance Index';
BEGIN TRY
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes 
        WHERE name = 'IX_Sessions_CanvasType' 
        AND object_id = OBJECT_ID('canvas.Sessions')
    )
    BEGIN
        CREATE INDEX IX_Sessions_CanvasType 
        ON [canvas].[Sessions]([CanvasType]);
        
        PRINT '  ✅ Created index IX_Sessions_CanvasType';
    END
    ELSE
        PRINT '  ⚠️  Index IX_Sessions_CanvasType already exists';
END TRY
BEGIN CATCH
    PRINT '  ❌ ERROR: ' + ERROR_MESSAGE();
    RETURN;
END CATCH

-- STEP 5: Verification
PRINT '';
PRINT '>> STEP 5: Verification';
SELECT 
    COLUMN_NAME as [Column],
    DATA_TYPE as [Type],
    CHARACTER_MAXIMUM_LENGTH as [MaxLength],
    IS_NULLABLE as [Nullable],
    COLUMN_DEFAULT as [Default]
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'canvas' 
AND TABLE_NAME = 'Sessions'
AND COLUMN_NAME = 'CanvasType';

PRINT '';
PRINT '✅ Migration completed successfully';
PRINT '========================================';
GO
```

##### Task 1.2: Create PROD Migration Script
**File**: `Migrations/migration-{timestamp}-add-canvastype-column-prod.sql`

(Same as DEV script but targeting KSESSIONS database)

```sql
USE [KSESSIONS];  -- Production database
GO
-- [Rest identical to DEV script]
```

##### Task 1.3: Create Rollback Script
**File**: `Migrations/rollback-{timestamp}-add-canvastype-column.sql`

```sql
-- =============================================
-- Rollback: Remove CanvasType Column
-- Database: KSESSIONS_DEV / KSESSIONS
-- =============================================

-- Specify database via sqlcmd -d parameter
SET NOCOUNT ON;
PRINT '';
PRINT '========================================';
PRINT 'Rollback: Remove CanvasType Column';
PRINT 'Database: ' + DB_NAME();
PRINT '========================================';
PRINT '';

-- STEP 1: Drop Index
PRINT '>> Dropping Index';
IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Sessions_CanvasType' 
    AND object_id = OBJECT_ID('canvas.Sessions')
)
BEGIN
    DROP INDEX IX_Sessions_CanvasType ON [canvas].[Sessions];
    PRINT '  ✅ Dropped index IX_Sessions_CanvasType';
END
ELSE
    PRINT '  ⚠️  Index does not exist';

-- STEP 2: Drop Column
PRINT '';
PRINT '>> Dropping Column';
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'canvas' 
    AND TABLE_NAME = 'Sessions' 
    AND COLUMN_NAME = 'CanvasType'
)
BEGIN
    ALTER TABLE [canvas].[Sessions]
    DROP COLUMN [CanvasType];
    
    PRINT '  ✅ Dropped CanvasType column';
END
ELSE
    PRINT '  ⚠️  Column does not exist';

PRINT '';
PRINT '✅ Rollback completed';
PRINT '========================================';
GO
```

##### Task 1.4: Run DEV Migration
**Command**:
```powershell
sqlcmd -S AHHOME -d KSESSIONS_DEV -E -i "Migrations/migration-{timestamp}-add-canvastype-column.sql"
```

**Verification**:
```sql
SELECT TOP 5 SessionId, HostToken, UserToken, Status, CanvasType 
FROM canvas.Sessions 
ORDER BY CreatedAt DESC;
```

##### Task 1.5: Document Migration
**File**: `Migrations/README-add-canvastype-column.md`

```markdown
# CanvasType Column Migration - README

## Overview
Adds `CanvasType` column to `canvas.Sessions` table to persist host's canvas selection.

## Files
- `migration-{timestamp}-add-canvastype-column.sql` - DEV migration
- `migration-{timestamp}-add-canvastype-column-prod.sql` - PROD migration
- `rollback-{timestamp}-add-canvastype-column.sql` - Rollback script

## Execution

### Development
```powershell
sqlcmd -S AHHOME -d KSESSIONS_DEV -E -i migration-{timestamp}-add-canvastype-column.sql
```

### Production (via ncdeploy.ps1)
```powershell
./Scripts/ncdeploy.ps1
# Script automatically detects and executes migration
```

## Verification
```sql
-- Check column exists
SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'Sessions' AND COLUMN_NAME = 'CanvasType';

-- Check existing data
SELECT CanvasType, COUNT(*) as Count 
FROM canvas.Sessions 
GROUP BY CanvasType;
```

## Rollback
```powershell
sqlcmd -S AHHOME -d KSESSIONS_DEV -E -i rollback-{timestamp}-add-canvastype-column.sql
```
```

**Acceptance Criteria**:
- ✅ Column added to KSESSIONS_DEV
- ✅ Index created successfully
- ✅ Existing sessions updated to "asset"
- ✅ Migration script follows deployment-migration protocol
- ✅ Rollback script tested and verified

---

### Phase 2: Backend Persistence Layer

**Objective**: Update API to save and retrieve `CanvasType` from database

**Duration**: 30 minutes  
**Risk Level**: Low (backward compatible)

#### Tasks

##### Task 2.1: Update Session Model
**File**: `SPA/NoorCanvas/Models/Simplified/Session.cs`

**Location**: Add after existing properties

```csharp
[Table("Sessions", Schema = "canvas")]
public class Session
{
    // ... existing properties ...
    
    [StringLength(20)]
    [Column("CanvasType")]
    public string? CanvasType { get; set; } = "asset";
    
    // ... rest of properties ...
}
```

##### Task 2.2: Update HostController.StartSession
**File**: `SPA/NoorCanvas/Controllers/HostController.cs`

**Current Code** (approximate line 388):
```csharp
public async Task<IActionResult> StartSession(int sessionId, [FromQuery] string canvasType = "asset")
{
    var session = await _context.Sessions.FindAsync(sessionId);
    if (session == null)
        return NotFound();
    
    session.Status = "Active";
    session.StartedAt = DateTime.UtcNow;
    await _context.SaveChangesAsync();
    
    return Ok();
}
```

**New Code**:
```csharp
public async Task<IActionResult> StartSession(int sessionId, [FromQuery] string canvasType = "asset")
{
    // Validate canvasType parameter
    if (!new[] { "asset", "transcript" }.Contains(canvasType.ToLowerInvariant()))
    {
        _logger.LogWarning("Invalid canvasType '{CanvasType}' - defaulting to 'asset'", canvasType);
        canvasType = "asset";
    }
    
    var session = await _context.Sessions.FindAsync(sessionId);
    if (session == null)
        return NotFound();
    
    session.Status = "Active";
    session.StartedAt = DateTime.UtcNow;
    session.CanvasType = canvasType.ToLowerInvariant(); // NEW: Persist canvas type
    
    _logger.LogInformation("COPILOT-SESSION-START: Session {SessionId} started with CanvasType='{CanvasType}'", 
        sessionId, session.CanvasType);
    
    await _context.SaveChangesAsync();
    
    return Ok(new { sessionId, canvasType = session.CanvasType });
}
```

##### Task 2.3: Add Session Query API
**File**: `SPA/NoorCanvas/Controllers/SessionController.cs` (or create if needed)

**Purpose**: Allow UserLanding to query session details by token

```csharp
[HttpGet("api/session/info/{token}")]
public async Task<IActionResult> GetSessionInfo(string token)
{
    var session = await _context.Sessions
        .Where(s => s.UserToken == token && s.Status == "Active")
        .Select(s => new 
        {
            s.SessionId,
            s.CanvasType,
            s.Status,
            s.StartedAt
        })
        .FirstOrDefaultAsync();
    
    if (session == null)
        return NotFound(new { error = "Session not found or not active" });
    
    return Ok(session);
}
```

##### Task 2.4: Add Logging
**File**: `SPA/NoorCanvas/Controllers/HostController.cs`

Add comprehensive logging:
```csharp
_logger.LogInformation("[user-landing] Session {SessionId} - CanvasType set to '{CanvasType}'", 
    sessionId, session.CanvasType);
```

**Acceptance Criteria**:
- ✅ Session model includes CanvasType property
- ✅ StartSession validates and saves CanvasType
- ✅ API returns CanvasType in response
- ✅ Logging added for debugging
- ✅ Backward compatible (defaults to "asset")

---

### Phase 3: Frontend Routing Logic

**Objective**: Update `UserLanding.razor` to route users based on database CanvasType

**Duration**: 45 minutes  
**Risk Level**: Medium (core routing logic)

#### Tasks

##### Task 3.1: Add Session Info API Call
**File**: `SPA/NoorCanvas/Pages/UserLanding.razor`

**Location**: In `HandleUserRegistration()` method (around line 1050)

**Current Code** (simplified):
```csharp
private async Task HandleUserRegistration()
{
    // ... validation ...
    
    // Register user via API
    var response = await httpClient.PostAsJsonAsync($"/api/participant/register", registrationDto);
    
    if (response.IsSuccessStatusCode)
    {
        // Store registration data
        await JSRuntime.InvokeVoidAsync("sessionStorage.setItem", "noor_registration_complete", "true");
        
        // Route to canvas
        if (Model.SessionStatus == "Active")
            Navigation.NavigateTo($"/session/canvas/{Model.TokenInput}", forceLoad: true);
        else
            Navigation.NavigateTo($"/session/waiting/{Model.TokenInput}", forceLoad: true);
    }
}
```

**New Code**:
```csharp
private async Task HandleUserRegistration()
{
    // ... validation ...
    
    // Register user via API
    var response = await httpClient.PostAsJsonAsync($"/api/participant/register", registrationDto);
    
    if (response.IsSuccessStatusCode)
    {
        // Store registration data
        await JSRuntime.InvokeVoidAsync("sessionStorage.setItem", "noor_registration_complete", "true");
        
        // Determine canvas route based on session's CanvasType
        string canvasRoute = await DetermineCanvasRoute(Model.TokenInput, Model.SessionStatus);
        
        Logger.LogInformation("[user-landing] Routing user to: {Route}", canvasRoute);
        Navigation.NavigateTo(canvasRoute, forceLoad: true);
    }
}

/// <summary>
/// Determines canvas route based on session's CanvasType from database
/// </summary>
private async Task<string> DetermineCanvasRoute(string token, string sessionStatus)
{
    try
    {
        // Query session info from API
        var httpClient = HttpClientFactory.CreateClient("Api");
        var response = await httpClient.GetAsync($"/api/session/info/{token}");
        
        if (response.IsSuccessStatusCode)
        {
            var sessionInfo = await response.Content.ReadFromJsonAsync<SessionInfoDto>();
            
            if (sessionInfo != null)
            {
                Logger.LogInformation("[user-landing] Session CanvasType: {CanvasType}", sessionInfo.CanvasType);
                
                // Route based on CanvasType
                string baseRoute = GetCanvasRouteByType(sessionInfo.CanvasType, token);
                
                // If session is not active, route to waiting page
                if (sessionStatus != "Active")
                    return $"/session/waiting/{token}";
                
                return baseRoute;
            }
        }
        
        Logger.LogWarning("[user-landing] Could not fetch session info - defaulting to SessionCanvas");
        return $"/session/canvas/{token}";
    }
    catch (Exception ex)
    {
        Logger.LogError(ex, "[user-landing] Error determining canvas route - defaulting to SessionCanvas");
        return $"/session/canvas/{token}";
    }
}

/// <summary>
/// Maps CanvasType to route path
/// </summary>
private string GetCanvasRouteByType(string? canvasType, string token)
{
    return canvasType?.ToLowerInvariant() switch
    {
        "transcript" => $"/transcript/canvas/{token}",
        "asset" => $"/session/canvas/{token}",
        _ => $"/session/canvas/{token}" // Default to SessionCanvas for NULL/unknown
    };
}
```

##### Task 3.2: Add SessionInfoDto
**File**: `SPA/NoorCanvas/Pages/UserLanding.razor` (code section)

```csharp
@code {
    // ... existing code ...
    
    /// <summary>
    /// DTO for session info API response
    /// </summary>
    private class SessionInfoDto
    {
        public int SessionId { get; set; }
        public string? CanvasType { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? StartedAt { get; set; }
    }
}
```

##### Task 3.3: Update Registration Check Logic
**File**: `SPA/NoorCanvas/Pages/UserLanding.razor`

**Location**: `CheckParticipantRegistration()` method (around line 1145)

**Current Code**:
```csharp
if (registrationResponse.IsRegistered)
{
    Navigation.NavigateTo($"/session/canvas/{token}");
}
```

**New Code**:
```csharp
if (registrationResponse.IsRegistered)
{
    string canvasRoute = await DetermineCanvasRoute(token, Model?.SessionStatus ?? "Unknown");
    Logger.LogInformation("[user-landing] User already registered - routing to {Route}", canvasRoute);
    Navigation.NavigateTo(canvasRoute, forceLoad: true);
}
```

##### Task 3.4: Add Logging
**File**: `SPA/NoorCanvas/Pages/UserLanding.razor`

Add comprehensive logging throughout routing logic:
```csharp
Logger.LogInformation("[user-landing] Token: {Token}, SessionStatus: {Status}, CanvasType: {Type}, Route: {Route}",
    token, sessionStatus, canvasType, finalRoute);
```

**Acceptance Criteria**:
- ✅ UserLanding queries session CanvasType from API
- ✅ Routes to `/session/canvas/{token}` for "asset" type
- ✅ Routes to `/transcript/canvas/{token}` for "transcript" type
- ✅ Falls back to SessionCanvas for NULL/unknown types
- ✅ Handles API errors gracefully with logging
- ✅ Works for both registration and "already registered" flows

---

### Phase 4: Testing & Validation

**Objective**: Comprehensive E2E and integration testing

**Duration**: 60 minutes  
**Risk Level**: Low (validation only)

#### Tasks

##### Task 4.1: Create E2E Test - Asset Share Flow
**File**: `Tests/UI/user-landing-asset-share-routing.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Landing - Asset Share Routing', () => {
  test('should route to SessionCanvas when host selects Asset Share', async ({ page }) => {
    // SETUP: Start application
    // ASSUME: Session 215 exists with CanvasType='asset'
    
    // GIVEN: User navigates to landing page with valid token
    await page.goto('http://localhost:5000/user/landing/USERTOKEN123');
    
    // WHEN: User fills registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.selectOption('select[name="country"]', 'United States');
    
    // AND: User submits registration
    await page.click('button[type="submit"]');
    
    // THEN: User should be routed to SessionCanvas
    await page.waitForURL('**/session/canvas/USERTOKEN123');
    
    // AND: Page should load successfully
    expect(page.url()).toContain('/session/canvas/USERTOKEN123');
    await expect(page.locator('h1')).toContainText('Session Canvas');
  });
  
  test('should route already-registered user to SessionCanvas for asset type', async ({ page }) => {
    // ASSUME: User already registered for session 215 (CanvasType='asset')
    
    // GIVEN: User navigates to landing page
    await page.goto('http://localhost:5000/user/landing/USERTOKEN123');
    
    // THEN: User should be auto-redirected to SessionCanvas
    await page.waitForURL('**/session/canvas/USERTOKEN123', { timeout: 5000 });
    expect(page.url()).toContain('/session/canvas/USERTOKEN123');
  });
});
```

##### Task 4.2: Create E2E Test - Section Share Flow
**File**: `Tests/UI/user-landing-transcript-routing.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Landing - Section Share Routing', () => {
  test('should route to TranscriptCanvas when host selects Section Share', async ({ page }) => {
    // SETUP: Start application
    // ASSUME: Session 216 exists with CanvasType='transcript'
    
    // GIVEN: User navigates to landing page with transcript session token
    await page.goto('http://localhost:5000/user/landing/TRANSCRIPT789');
    
    // WHEN: User fills registration form
    await page.fill('input[name="name"]', 'Test User 2');
    await page.fill('input[name="email"]', 'test2@example.com');
    await page.selectOption('select[name="country"]', 'Canada');
    
    // AND: User submits registration
    await page.click('button[type="submit"]');
    
    // THEN: User should be routed to TranscriptCanvas
    await page.waitForURL('**/transcript/canvas/TRANSCRIPT789');
    
    // AND: Page should load successfully
    expect(page.url()).toContain('/transcript/canvas/TRANSCRIPT789');
    await expect(page.locator('h1')).toContainText('Transcript Canvas');
  });
  
  test('should route already-registered user to TranscriptCanvas for transcript type', async ({ page }) => {
    // ASSUME: User already registered for session 216 (CanvasType='transcript')
    
    // GIVEN: User navigates to landing page
    await page.goto('http://localhost:5000/user/landing/TRANSCRIPT789');
    
    // THEN: User should be auto-redirected to TranscriptCanvas
    await page.waitForURL('**/transcript/canvas/TRANSCRIPT789', { timeout: 5000 });
    expect(page.url()).toContain('/transcript/canvas/TRANSCRIPT789');
  });
});
```

##### Task 4.3: Create Test Orchestration Script
**File**: `Scripts/run-user-landing-routing-tests.ps1`

```powershell
#!/usr/bin/env pwsh
# Test orchestration for User Landing routing tests
# Uses background job pattern from other test scripts

param(
    [switch]$KeepAppRunning = $false,
    [string]$TestPattern = "user-landing-*-routing.spec.ts"
)

$ErrorActionPreference = "Stop"

Write-Host "=== User Landing Routing Tests ===" -ForegroundColor Cyan
Write-Host ""

# Start app in background
Write-Host "[1/4] Starting NOOR Canvas application..." -ForegroundColor Yellow
$appJob = Start-Job -ScriptBlock {
    Set-Location "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
    dotnet run
}

Write-Host "  Waiting 15 seconds for app to start..."
Start-Sleep -Seconds 15

try {
    # Run Playwright tests
    Write-Host ""
    Write-Host "[2/4] Running Playwright tests..." -ForegroundColor Yellow
    Set-Location "D:\PROJECTS\NOOR CANVAS\Tests\UI"
    
    npx playwright test $TestPattern --headed
    
    $testExitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($testExitCode -eq 0) {
        Write-Host "[3/4] ✅ All tests passed!" -ForegroundColor Green
    } else {
        Write-Host "[3/4] ❌ Tests failed with exit code: $testExitCode" -ForegroundColor Red
    }
}
finally {
    # Cleanup
    if (-not $KeepAppRunning) {
        Write-Host ""
        Write-Host "[4/4] Stopping application..." -ForegroundColor Yellow
        Stop-Job -Job $appJob -ErrorAction SilentlyContinue
        Remove-Job -Job $appJob -ErrorAction SilentlyContinue
        Write-Host "  ✅ Application stopped" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "[4/4] Application still running (use -KeepAppRunning flag)" -ForegroundColor Yellow
        Write-Host "  Job ID: $($appJob.Id)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Test Run Complete ===" -ForegroundColor Cyan
exit $testExitCode
```

##### Task 4.4: Manual Testing Checklist
**File**: `.github/prompts.keys/user-landing/MANUAL-TESTING.md`

```markdown
# Manual Testing Checklist - User Landing Canvas Routing

## Prerequisites
- ✅ DEV database migration applied
- ✅ Application running on localhost:5000
- ✅ Two test sessions created:
  - Session 215: CanvasType='asset', UserToken='ASSET123'
  - Session 216: CanvasType='transcript', UserToken='TRANS456'

## Test Scenarios

### Scenario 1: Asset Share - New User Registration
1. Navigate to `/user/landing/ASSET123`
2. Fill registration form (Name, Email, Country)
3. Submit form
4. **Expected**: Redirects to `/session/canvas/ASSET123`
5. **Verify**: SessionCanvas page loads successfully

### Scenario 2: Section Share - New User Registration
1. Navigate to `/user/landing/TRANS456`
2. Fill registration form
3. Submit form
4. **Expected**: Redirects to `/transcript/canvas/TRANS456`
5. **Verify**: TranscriptCanvas page loads successfully

### Scenario 3: Asset Share - Already Registered User
1. Complete Scenario 1 first
2. Open new incognito window with same browser session
3. Navigate to `/user/landing/ASSET123`
4. **Expected**: Auto-redirects to `/session/canvas/ASSET123`
5. **Verify**: No registration form shown

### Scenario 4: Section Share - Already Registered User
1. Complete Scenario 2 first
2. Open new incognito window with same browser session
3. Navigate to `/user/landing/TRANS456`
4. **Expected**: Auto-redirects to `/transcript/canvas/TRANS456`
5. **Verify**: No registration form shown

### Scenario 5: Legacy Session (NULL CanvasType)
1. Create session with CanvasType=NULL (manual DB update)
2. Navigate to `/user/landing/{token}`
3. Register as new user
4. **Expected**: Defaults to `/session/canvas/{token}`
5. **Verify**: Backward compatibility maintained

### Scenario 6: Invalid Token
1. Navigate to `/user/landing/INVALID999`
2. **Expected**: Error message shown
3. **Verify**: No crash, graceful error handling

## Database Verification
```sql
-- Check CanvasType values
SELECT SessionId, HostToken, UserToken, Status, CanvasType 
FROM canvas.Sessions 
WHERE SessionId IN (215, 216);

-- Verify index exists
SELECT * FROM sys.indexes 
WHERE name = 'IX_Sessions_CanvasType' 
AND object_id = OBJECT_ID('canvas.Sessions');
```

## Browser Console Checks
- ✅ No JavaScript errors
- ✅ API calls successful (check Network tab)
- ✅ Logging visible in browser console (if enabled)

## Sign-Off
- [ ] All scenarios passed
- [ ] Database queries verified
- [ ] No browser errors
- [ ] Tested by: _____________
- [ ] Date: _____________
```

##### Task 4.5: Integration Test
**File**: `Tests/Integration/CanvasTypeIntegrationTests.cs` (if needed)

```csharp
[Fact]
public async Task StartSession_Should_Save_CanvasType()
{
    // Arrange
    var sessionId = 215;
    var canvasType = "transcript";
    
    // Act
    var response = await _client.PostAsync(
        $"/api/host/session/{sessionId}/start?canvasType={canvasType}", 
        null
    );
    
    // Assert
    response.EnsureSuccessStatusCode();
    
    var session = await _context.Sessions.FindAsync(sessionId);
    Assert.Equal("transcript", session.CanvasType);
    Assert.Equal("Active", session.Status);
}
```

**Acceptance Criteria**:
- ✅ E2E tests pass for both Asset and Section Share flows
- ✅ Test orchestration script runs successfully
- ✅ Manual testing checklist completed
- ✅ All logging verified in browser console
- ✅ Database queries confirm data integrity

---

### Phase 5: Production Deployment

**Objective**: Deploy changes to production with migration

**Duration**: 30 minutes  
**Risk Level**: Low (follows deployment-migration protocol)

#### Tasks

##### Task 5.1: Prepare Production Migration
**File**: Use existing `migration-{timestamp}-add-canvastype-column-prod.sql`

**Pre-Deployment Checklist**:
- ✅ DEV migration tested successfully
- ✅ Rollback script tested in DEV
- ✅ All E2E tests passing
- ✅ Manual testing completed
- ✅ Code reviewed and committed to `development` branch

##### Task 5.2: Execute ncdeploy.ps1
**Command**:
```powershell
cd D:\PROJECTS\NOOR CANVAS\Scripts
./ncdeploy.ps1
```

**Expected Behavior**:
1. Detects new migration file in `Migrations/` folder
2. Prompts: "New migration detected - execute? (y/n)"
3. Executes migration against KSESSIONS (production)
4. Continues with standard deployment (build, publish, IIS restart)

##### Task 5.3: Post-Deployment Verification
**SQL Queries** (run against KSESSIONS production):
```sql
-- Verify column exists
SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'canvas' 
AND TABLE_NAME = 'Sessions' 
AND COLUMN_NAME = 'CanvasType';

-- Check data distribution
SELECT CanvasType, COUNT(*) as SessionCount 
FROM canvas.Sessions 
GROUP BY CanvasType;

-- Verify index
SELECT name, type_desc 
FROM sys.indexes 
WHERE name = 'IX_Sessions_CanvasType' 
AND object_id = OBJECT_ID('canvas.Sessions');
```

##### Task 5.4: Smoke Testing
1. Navigate to production HostControlPanel
2. Create new session and select "Asset Share"
3. Verify session starts successfully
4. Register user via UserLanding
5. Verify routing to SessionCanvas
6. Repeat for "Section Share" → TranscriptCanvas

##### Task 5.5: Monitor Production Logs
**Files to Monitor**:
- IIS logs: Check for errors
- Application logs: Search for `[user-landing]` entries
- Database logs: Monitor slow query alerts

**Acceptance Criteria**:
- ✅ Production migration executed successfully
- ✅ All verification queries pass
- ✅ Smoke testing complete
- ✅ No errors in production logs
- ✅ Users routing correctly based on CanvasType

---

## Enhancement Specifications

### Enhancement A: Database Migration Protocol Compliance

**Selected**: YES (High Priority)  
**Effort**: Medium  
**Status**: Implemented in Phase 1

**Features**:
- ✅ Migration script follows deployment-migration v1.0 protocol
- ✅ Includes validation checks (schema, table, column existence)
- ✅ Step-by-step execution with logging
- ✅ Rollback script provided
- ✅ README documentation included
- ✅ Compatible with `ncdeploy.ps1` auto-detection

### Enhancement B: API Validation

**Selected**: YES (High Priority)  
**Effort**: Low  
**Status**: Implemented in Phase 2

**Features**:
- ✅ Validates `canvasType` parameter (only "asset" or "transcript" allowed)
- ✅ Defaults to "asset" if invalid value provided
- ✅ Returns validated `canvasType` in API response
- ✅ Logs warnings for invalid values

### Enhancement D: E2E Test for Asset Share Flow

**Selected**: YES (High Priority)  
**Effort**: Low  
**Status**: Implemented in Phase 4

**Features**:
- ✅ Tests new user registration flow
- ✅ Tests already-registered user flow
- ✅ Verifies routing to `/session/canvas/{token}`
- ✅ Test orchestration script provided

### Enhancement E: E2E Test for Section Share Flow

**Selected**: YES (High Priority)  
**Effort**: Low  
**Status**: Implemented in Phase 4

**Features**:
- ✅ Tests new user registration flow
- ✅ Tests already-registered user flow
- ✅ Verifies routing to `/transcript/canvas/{token}`
- ✅ Test orchestration script provided

### Enhancement C: Percy Visual Regression Testing

**Selected**: NO (Deferred)  
**Effort**: Medium  
**Reason**: Core functionality tested via E2E tests; Percy can be added in future sprint if UI changes needed

---

## Risk Assessment

### Low Risk
- ✅ Nullable column (backward compatible)
- ✅ Default value ensures no NULL issues
- ✅ Validation in API prevents invalid data
- ✅ Fallback routing for unknown types

### Medium Risk
- ⚠️ Core routing logic changes (mitigated by comprehensive testing)
- ⚠️ Production migration (mitigated by rollback script and DEV testing)

### Mitigation Strategies
1. **Comprehensive Testing**: E2E tests for both routing paths
2. **Backward Compatibility**: Default to "asset" for NULL/unknown types
3. **Logging**: Detailed logging throughout routing logic
4. **Rollback Plan**: Tested rollback script available
5. **Gradual Rollout**: Deploy to DEV first, monitor, then PROD

---

## Dependencies

### Files Modified
1. `Migrations/migration-{timestamp}-add-canvastype-column.sql` (NEW)
2. `Migrations/migration-{timestamp}-add-canvastype-column-prod.sql` (NEW)
3. `Migrations/rollback-{timestamp}-add-canvastype-column.sql` (NEW)
4. `Migrations/README-add-canvastype-column.md` (NEW)
5. `SPA/NoorCanvas/Models/Simplified/Session.cs` (MODIFIED)
6. `SPA/NoorCanvas/Controllers/HostController.cs` (MODIFIED)
7. `SPA/NoorCanvas/Controllers/SessionController.cs` (MODIFIED or NEW)
8. `SPA/NoorCanvas/Pages/UserLanding.razor` (MODIFIED)
9. `Tests/UI/user-landing-asset-share-routing.spec.ts` (NEW)
10. `Tests/UI/user-landing-transcript-routing.spec.ts` (NEW)
11. `Scripts/run-user-landing-routing-tests.ps1` (NEW)
12. `.github/prompts.keys/user-landing/MANUAL-TESTING.md` (NEW)

### External Dependencies
- Entity Framework Core (existing)
- Playwright (existing)
- SQL Server (KSESSIONS_DEV, KSESSIONS)

### Cross-Component Impact
- **HostControlPanel.razor**: No changes (already sends canvasType)
- **SessionCanvas.razor**: No changes (receives token as before)
- **TranscriptCanvas.razor**: Needs route configured (if not exists)
- **SessionWaiting.razor**: No changes

---

## Success Metrics

### Functional
- ✅ Users route to correct canvas based on host selection
- ✅ 100% backward compatibility with existing sessions
- ✅ No breaking changes to existing flows

### Technical
- ✅ Migration executes in < 5 seconds
- ✅ API response time < 200ms for session info query
- ✅ Index improves query performance (verify with EXPLAIN ANALYZE)

### Testing
- ✅ 100% E2E test pass rate
- ✅ Manual testing checklist 100% complete
- ✅ Zero errors in production logs post-deployment

---

## Rollback Plan

### Immediate Rollback (< 5 minutes)
1. Stop IIS application pool
2. Execute rollback SQL script:
   ```powershell
   sqlcmd -S AHHOME -d KSESSIONS -U sa -P <password> -i rollback-{timestamp}-add-canvastype-column.sql
   ```
3. Revert code changes via Git:
   ```powershell
   git checkout master
   ./Scripts/ncdeploy.ps1
   ```

### Partial Rollback (Code Only)
If database changes are fine but code has issues:
1. Revert UserLanding.razor changes
2. Revert HostController changes
3. Keep database column (harmless if unused)

### Recovery Time Objective (RTO)
- **Target**: 5 minutes
- **Maximum**: 15 minutes

---

## Documentation Updates

### Files to Update
1. ✅ `DocFX/articles/canvas-schema-tables.md` - Add CanvasType column documentation
2. ✅ `.github/instructions/Links/Architecture.md` - Update routing logic section
3. ✅ `README.md` - Add note about canvas routing feature

---

## Timeline & Estimates

| Phase | Duration | Dependencies | Risk |
|-------|----------|--------------|------|
| Phase 1: Database Migration | 45 min | None | Low |
| Phase 2: Backend Persistence | 30 min | Phase 1 | Low |
| Phase 3: Frontend Routing | 45 min | Phase 2 | Medium |
| Phase 4: Testing | 60 min | Phase 3 | Low |
| Phase 5: Production Deploy | 30 min | Phase 4 | Low |
| **Total** | **3h 30min** | Sequential | **Low** |

---

## Approval & Sign-Off

- [ ] Plan reviewed and approved
- [ ] Enhancements selected: A, B, D, E
- [ ] Timeline accepted
- [ ] Ready to proceed to implementation

---

**Next Steps**: Say "proceed" to begin Phase 1 implementation.
