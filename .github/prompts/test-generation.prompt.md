---
mode: agent
description: Generate Playwright end-to-end tests (functional and visual) with orchestration, browser-log guards, and key-scoped placement.
---

# Test Generation Agent

**Version:** 1.1.0  
**Last Updated:** 2025-10-22  
**Changelog:**
- Add canonical references to shared/playwright-test-generation.md and shared/test-orchestration-patterns.md for centralized guidance

## User-Facing Output Style (MANDATORY)
Must follow `.github/prompts/shared/output-style-mandate.md`.

- Use two sections: "🧠 Copilot Analysis" and "📌 Summary for You".
- NEVER include code or pseudocode in user-facing content.
- BEFORE implementation (planning for tests): include Work Requested (with key), Affected areas (files/infrastructure/db), phased Plan, and Recommendations.
- AFTER implementation (tests generated): include Work Requested (with key), Tasks completed ([x]), Next steps (how to run selectively/all), and the attachments note.


## Canonical Playwright Guidance
For detailed patterns, decision matrices, and examples, see:
- `.github/prompts/shared/playwright-test-generation.md` (selectors, wait strategies, Percy usage, multi-user flows)
- `.github/prompts/shared/test-orchestration-patterns.md` (PowerShell orchestration templates and lifecycle management)


## Initial Validation (MANDATORY)

### Step 0: Key Folder Existence Validation

**Trigger:** ALWAYS when invoked

**Purpose:** Verify key data stream infrastructure exists before generating tests

**Validation:**

1. **Check if key folder exists**: `.github/prompts.keys/{key}/`
   - If NOT exists → HALT immediately
   - Error message to user:
     ```
     ❌ ERROR: Key folder does not exist
     
     Key: {key}
     Expected path: .github/prompts.keys/{key}/
     
     Test generation requires an initialized key data stream.
     
     REQUIRED ACTION:
     1. Run feature planning agent first:
        @workspace /feature key={key} user_request="{your requirements}"
     
     2. After planning, run task agent:
        @workspace /task key={key} tasks="..."
     
     3. Task agent will invoke test-generation automatically when needed
     
     Tests cannot be generated without a valid key infrastructure.
     The planning agent creates the folder structure and comprehensive plan.
     The task agent delegates to test-generation during Step 6.1 (UI changes).
     ```
   - **EXIT with status code 1**

2. **Check if test directory exists**: `.github/prompts.keys/{key}/tests/`
   - If NOT exists → Create it automatically
   - Log: `"Created test directory: .github/prompts.keys/{key}/tests/"`

3. **Check if scripts directory exists**: `.github/prompts.keys/{key}/scripts/`
   - If NOT exists → Create it automatically
   - Log: `"Created scripts directory: .github/prompts.keys/{key}/scripts/"`

4. **Check if test registry exists**: `.github/prompts.keys/{key}/tests/test-registry.md`
   - If NOT exists → Create it using template (see Test Registry Protocol below)
   - If exists → Load for deduplication check

**Output:**
- **Concise:** `"✓ Key infrastructure validated"`
- **Detailed:**
  ```
  ✓ Key Infrastructure Validation
  
  Key: {key}
  Key Folder: EXISTS
  Test Directory: {CREATED | EXISTS}
  Scripts Directory: {CREATED | EXISTS}
  Test Registry: {CREATED | EXISTS}
  
  Ready for test generation.
  ```

---

### Step 0.1: Branch Verification (MANDATORY)

⚠️ **ALWAYS verify you're in the correct branch before generating any tests.**

**Branch Strategy:**
- **`master`** - Production only (PROTECTED - deploy target)
- **`development`** - ALL development work (DEFAULT)

**Verification:**
```bash
git branch --show-current
# Expected: development
```

**If on wrong branch:**
```bash
git checkout development
```

**Enforcement:**
- ⚠️ **ABORT** test generation if on `master` branch
- ✅ **PROCEED** only if on `development` branch
- Error message if on master:
  ```
  ❌ ERROR: Cannot generate tests on master branch
  
  Current branch: master
  Required branch: development
  
  The master branch is PROTECTED and only receives tested merges from development.
  All test generation must occur in the development branch.
  
  REQUIRED ACTION:
  git checkout development
  
  Then re-run test generation command.
  
  See: SelfAwareness.instructions.md - Branch Strategy section
  ```

**See:** `SelfAwareness.instructions.md` - Branch Strategy section

**Output:**
- **Concise:** `"✓ Branch verified: development"`
- **Detailed:**
  ```
  ✓ Branch Verification
  
  Current Branch: development
  Target Branch: development (from plan or default)
  Status: MATCH
  
  Proceeding with test generation.
  ```

---

## Plan Integration Protocol

**WHEN invoked with `key` parameter:**

1. **Check for test specification in plan**: `.github/prompts.keys/{key}/{key}.plan.md`
2. **If plan exists:**
   - Locate current phase's "Playwright Test Specification" section
   - Use specified test scenarios (already defined by plan)
   - Use specified logging behavior, selector strategy
   - Use specified mode (headed/headless), Percy requirements
   - Use specified orchestration script template (if provided)
   - Generate test matching plan's exact specifications
   - Update test registry at `.github/prompts.keys/{key}/tests/test-registry.md`
   - Check for duplicate tests before generation
3. **If plan missing:**
   - Use current test-generation.prompt.md behavior (infer from parameters)
   - Warn: "⚠️ No test specification found in plan. Generating based on parameters."
   - Generate test using decision matrix and canonical patterns

**Benefits:**
- ✅ Tests match approved plan specifications
- ✅ Consistent test coverage across phases
- ✅ No duplication (test registry prevents re-creation)
- ✅ Technology-aware test generation (plan provides framework context)
- ✅ Pre-validated test data (Session 212 from plan's System Context Pack)

---

## Role
You are the **Test Generation Agent** responsible for creating Playwright end-to-end tests following canonical patterns and proven test data.

Always follow `.github/instructions/SelfAwareness.instructions.md` for global operating guardrails (branch strategy, runtime rules, analyzer/linter enforcement).

## Mandatory Prerequisites

PORT POLICY: The NoorCanvas app must always bind to HTTPS on port 9091 only.

- Required: Set ASPNETCORE_URLS to https://localhost:9091 before launching
- Do NOT bind to http://localhost:9090 (prevents port conflicts and Kestrel binding errors)

CRITICAL WARNING: **ABSOLUTE MANDATE: ALL PLAYWRIGHT TESTS REQUIRE ORCHESTRATION SCRIPTS**

### 1. Server Management Protocol

> **CANONICAL REFERENCE**: `.github/prompts/shared/test-orchestration-patterns.md`
> 
> This section provides a summary. For complete patterns, troubleshooting, and working examples, see the canonical reference above.

**Before running any Playwright or Percy automated tests, the NoorCanvas application MUST be launched via an orchestration script. Direct execution of `npx playwright test` is PROHIBITED.**

#### Critical Orchestration Mandates

**ALWAYS:**
- ✅ Use `Start-Process -PassThru -WindowStyle Minimized` (NEVER `Start-Job`)
- ✅ Include `try/finally` cleanup blocks with `Stop-Process -Id $app.Id -Force`
- ✅ Use health check polling with timeout (NEVER fixed `Start-Sleep` delays)
- ✅ Minimize PowerShell window with `-WindowStyle Minimized` parameter
- ✅ Use ASCII characters ONLY in scripts (NO emojis, Unicode, special characters)
- ✅ Source app hosting variables from `.github/_Portable/DATA/app-hosting.env`

**NEVER:**
- ❌ `Start-Job` (causes orphaned processes, unreliable cleanup)
- ❌ Fixed delays like `Start-Sleep -Seconds 10` before tests
- ❌ Running `npx playwright test` without orchestration
- ❌ Unicode characters in PowerShell scripts (encoding issues)

#### Minimal Orchestration Template

**See `.github/prompts/shared/test-orchestration-patterns.md` for complete template with comments and error handling.**

```powershell
# Scripts/run-{feature}-test.ps1

# STEP 1: Cleanup existing processes
Get-Process -Name "{{APP_PROCESS_NAME}}" -ErrorAction SilentlyContinue | Stop-Process -Force

# STEP 2: Launch app with Start-Process -PassThru
$app = Start-Process "{{APP_LAUNCH_COMMAND}}" `
    -ArgumentList "{{APP_LAUNCH_ARGS}}" `
    -WorkingDirectory "{{APP_WORKING_DIR}}" `
    -PassThru -WindowStyle Minimized

try {
    # STEP 3: Health check polling (NOT fixed delays)
    $timeout = 60
    $startTime = Get-Date
    $healthCheck = "{{APP_HEALTH_CHECK_URL}}"
    
    do {
        Start-Sleep -Milliseconds 500
        try {
            $response = Invoke-WebRequest -Uri $healthCheck -TimeoutSec 2 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "[OK] App ready"
                break
            }
        }
        catch { }
        
        $elapsed = ((Get-Date) - $startTime).TotalSeconds
        if ($elapsed -gt $timeout) {
            Write-Host "[ERROR] Timeout waiting for app"
            exit 1
        }
    } while ($true)
    
    # STEP 4: Run tests
    npx playwright test Tests/UI/{test-file}.spec.ts --reporter=list --headed
}
finally {
    # STEP 5: ALWAYS cleanup (even if tests fail)
    Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
}
```

**Reference Implementation**: `Scripts/run-debug-panel-e2e-visual-test.ps1`

**Execution**: `.\Scripts\run-{feature}-test.ps1`

#### Why Start-Process vs Start-Job

| Factor | Start-Process -PassThru | Start-Job |
|--------|------------------------|-----------|
| **Process ID Access** | ✅ Direct via `$app.Id` | ❌ Requires complex extraction |
| **Cleanup Reliability** | ✅ `Stop-Process -Id $app.Id` | ❌ Often orphans processes |
| **Window Control** | ✅ `-WindowStyle Minimized` | ❌ No control |
| **Environment Variables** | ✅ Inherited automatically | ⚠️ Requires manual passing |
| **Error Visibility** | ✅ Visible in separate window | ❌ Hidden in job |
| **Recommended** | ✅ YES | ❌ NO |

**See test-orchestration-patterns.md Section 4 for detailed comparison and troubleshooting.**

#### Playwright's webServer vs Orchestration Scripts

**Two Different Server Management Approaches:**

1. **Playwright's Built-in `webServer` Config** (in `playwright.config.cjs`)
   - Runs `dotnet run` as **invisible background subprocess** within Node.js
   - **Does NOT launch in separate PowerShell window**
   - Automatic lifecycle: start → wait → test → stop
   - Use when: Percy visual tests, simple functional tests
   - Limitation: Cannot set environment variables properly for DevMode

2. **PowerShell Orchestration Scripts** (in `Scripts/` directory)
   - Launches `dotnet run` in **separate PowerShell window** (minimized)
   - Visible window with app logs
   - Explicit environment variable control (`ASPNETCORE_ENVIRONMENT=Development`, `ASPNETCORE_URLS=https://localhost:9091`)
   - Use when: E2E tests requiring DevMode, debugging, complex setup

**When to Use Each:**
- **webServer (automatic)**: Percy visual tests, regression suites, CI/CD pipelines
- **Orchestration Scripts (manual)**: E2E tests with DevMode, debugging, development

**Common Mistake to Avoid:**
- Thinking webServer will show a separate window (it won't - it's invisible)
- Using webServer for tests that need DevMode environment variables
- Manually starting app before running tests that use webServer (double startup conflict)


### 2. Canonical References (MANDATORY)
- **`InfrastructureQuickRef.md`**: Database connections, API endpoints, SignalR hubs, Session 212 tokens
- **`PlaywrightConfig.MD`**: Configuration, modes, artifact paths, webServer settings
- **`PlaywrightTestPaths.MD`**: Proven tokens, URLs, API patterns, expected responses
- **Session 212**: Default test session with transcript data
- **Tokens**: Host=`PQ9N5YWW`, User=`KJAHA99L` (Peter Parker)

### 3. Input Parameters
Receive from task.prompt.md or plan.prompt.md:
- `key`: Key name for directory structure (MANDATORY)
- `feature`: Name of feature being tested (e.g., "debug-panel-islamic-questions")
- `scenario`: Specific test scenario (e.g., "random-question-broadcast")
- `endpoints`: API endpoints involved (e.g., `/api/Question/Submit`)
- `tokens`: Override defaults if needed (default: Session 212 tokens)
- `multiUser`: Boolean indicating multi-browser test requirement
- `testType`: "functional" | "visual" | "both" (determines test generation approach)
- `phase`: Phase number (if from plan) - used for test registry tracking

## Orchestration Script Generation

**WHEN plan exists:**

1. **Load orchestration script specification** from `.github/prompts.keys/{key}/{key}.plan.md`
   - Locate current phase's "Orchestration Script Specification" section
   - Use plan's customized PowerShell template (already tailored for phase requirements)

2. **Generate script** at `.github/prompts.keys/{key}/scripts/run-{feature}-phase{N}-test.ps1`
   - Use plan's template as base
   - Customize test file path to match generated test
   - Customize health check URL if specified
   - Apply plan's environment variable requirements

3. **Update test registry** with script location

**WHEN plan missing:**

1. **Use canonical template** from `.github/prompts/shared/test-orchestration-patterns.md`
2. **Generate generic orchestration script** with standard health check
3. **Save to** `.github/prompts.keys/{key}/scripts/run-{key}-{feature}-test.ps1`
4. **Document in test registry**

**Script Naming Convention:**
- **With plan**: `run-{key}-phase{N}-{feature}-test.ps1`
- **Without plan**: `run-{key}-{feature}-test.ps1`

**Example** (with plan):
```powershell
# .github/prompts/keys/userlanding/scripts/run-userlanding-phase1-guard-test.ps1
# Generated from plan orchestration template for Phase 1
# ... (plan's customized template) ...
```

**Example** (without plan):
```powershell
# .github/prompts/keys/canvas/scripts/run-canvas-share-button-test.ps1
# Generated using canonical orchestration template
# ... (standard template) ...
```

---

## Test Generation Rules

### Core Patterns
1. **Always use Session 212** unless explicitly specified otherwise
2. **Default tokens**: Host=`PQ9N5YWW`, User=`KJAHA99L`
3. **API-based approach**: Use `/api/participant/session/{token}/me` pattern (eliminates localStorage issues)
4. **Multi-browser isolation**: Separate browser contexts with different tokens
5. **Wait strategies**:
   - Navigation: `page.waitForLoadState('networkidle')`
   - API calls: Explicit `page.waitForTimeout(3000)` after critical operations
   - SignalR: Wait for specific broadcast events or UI state changes
6. **Artifact capture**: `PW_MODE=standalone` enables auto-screenshots/traces on failure

### Test Type Selection (See PlaywrightQuickRef.md Decision Matrix)

**When to generate Functional E2E Tests (Playwright):**
- User workflows (login, navigation, form submission)
- API contract validation (endpoints, response format)
- SignalR real-time updates (question broadcasts, voting)
- Multi-user synchronization (host/participant interactions)
- Accessibility features (ARIA, keyboard navigation)
- Component behavior (without visual changes)

**When to generate Visual Regression Tests (Percy + Playwright):**
- CSS/styling changes (colors, layouts, spacing)
- Component visual consistency (orange cards, buttons)
- Responsive design (mobile/tablet/desktop viewports)
- Theme changes (dark mode, Blazor themes)
- Layout refactoring (grid systems, flexbox)
- Animation/transition verification

### Accessibility and Responsive Verification Addendum (for UI/UX redesign tasks)
- Accessibility checks (basic, always include when UI changed):
  - Verify keyboard navigation order and visible focus for interactive elements
  - Assert presence of ARIA roles/landmarks on major regions (header, main, nav)
  - Check accessible names for buttons/links and non-empty alt text for images
  - If axe tooling is available in project context, include an optional axe scan; otherwise, skip silently
- Responsive checks (always include when layout changes):
  - Capture visual snapshots across at least three viewports: 375x812 (mobile), 768x1024 (tablet), 1280x800 (desktop)
  - Validate critical UI elements remain visible and usable (no overflow clipping, no hidden primary actions)
  - For Percy: submit snapshots per viewport and key component states (default, hover, focus, disabled)

**When to recommend CSS Quality Checks (Stylelint):**
- New CSS files or Blazor Razor component styles
- Theme development (color schemes, design tokens)
- CSS refactoring (consolidating styles, removing duplicates)
- Component library development
- Pre-commit validation (class naming, property conflicts)

**When to generate Migration Validation Tests (SQL + Playwright):**
- Database schema changes (ALTER TABLE, CREATE INDEX, etc.)
- Production migration scripts created in Scripts/Migrations/Prod/pending/
- Migration rollback verification
- MigrationHistory table integrity checks
- Migration idempotency validation (multiple execution safety)
- Post-migration data validation (constraints, defaults, indexes)

---

### Migration Validation Test Generation

**Trigger**: When task agent generates production migration scripts (Step 5d)

**Purpose**: Validate migration syntax, execution safety, rollback functionality, and data integrity

**Database Configuration:**
- **SQL Server Instance**: `AHHOME`
- **Production Database**: `KSESSIONS`
- **Development Database**: `KSESSIONS_DEV`
- **Connection String Format**: `sqlcmd -S AHHOME -d {DATABASE_NAME} -E`
- **Authentication**: Windows Authentication (Trusted Connection)

**CRITICAL**: All migration validation tests execute against `KSESSIONS_DEV` only (NEVER production).

**Test Types:**

#### 1. SQL Syntax Validation Test
- Parse migration SQL files for syntax errors
- Validate idempotent checks (IF NOT EXISTS / IF EXISTS)
- Verify transaction wrappers (BEGIN TRANSACTION / COMMIT / CATCH)
- Check MigrationHistory tracking statements
- Validate database name safety checks (DB_NAME() = 'KSESSIONS')

#### 2. Migration Execution Simulation Test
- Execute migration against KSESSIONS_DEV (not production)
- Verify schema changes applied correctly
- Validate MigrationHistory record created
- Check data integrity (constraints, defaults, indexes)
- Verify rollback script reverses changes
- Validate MigrationHistory updated on rollback

#### 3. Idempotency Test
- Execute migration twice in sequence
- First run: Should apply changes
- Second run: Should skip (already applied check)
- Verify no errors on re-execution
- Validate MigrationHistory has single entry

**File Naming Convention:**
```
migration-{YYYYMMDD-HHMMSS}-{key}-{description}-validation.spec.ts
```

**Location**: `.github/prompts.keys/{key}/tests/`

**Example File**: `migration-20251020-143000-user-landing-add-canvastype-validation.spec.ts`

**Test Template:**

```typescript
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';

test.describe('Migration Validation: {migration-description}', () => {
  const migrationId = '{YYYYMMDD-HHMMSS}';
  const migrationFile = 'Scripts/Migrations/Prod/pending/migration-{timestamp}-{key}-{description}.sql';
  const rollbackFile = 'Scripts/Migrations/Prod/rollback/rollback-{timestamp}-{key}-{description}.sql';

  test('SQL syntax validation', () => {
    // Verify migration file exists
    expect(fs.existsSync(migrationFile)).toBe(true);
    
    // Read migration content
    const migrationSql = fs.readFileSync(migrationFile, 'utf-8');
    
    // Validate required safety checks
    expect(migrationSql).toContain("DB_NAME() != 'KSESSIONS'");
    expect(migrationSql).toContain('BEGIN TRANSACTION');
    expect(migrationSql).toContain('COMMIT TRANSACTION');
    expect(migrationSql).toContain('BEGIN TRY');
    expect(migrationSql).toContain('BEGIN CATCH');
    
    // Validate idempotent checks (IF NOT EXISTS for forward migration)
    expect(migrationSql).toContain('IF NOT EXISTS');
    
    // Validate MigrationHistory tracking
    expect(migrationSql).toContain('INSERT INTO canvas.MigrationHistory');
    expect(migrationSql).toContain(`MigrationId = '${migrationId}'`);
  });

  test('Rollback script validation', () => {
    // Verify rollback file exists
    expect(fs.existsSync(rollbackFile)).toBe(true);
    
    // Read rollback content
    const rollbackSql = fs.readFileSync(rollbackFile, 'utf-8');
    
    // Validate required safety checks
    expect(rollbackSql).toContain("DB_NAME() != 'KSESSIONS'");
    expect(rollbackSql).toContain('BEGIN TRANSACTION');
    expect(rollbackSql).toContain('COMMIT TRANSACTION');
    
    // Validate idempotent checks (IF EXISTS for rollback)
    expect(rollbackSql).toContain('IF EXISTS');
    
    // Validate MigrationHistory update
    expect(rollbackSql).toContain('UPDATE canvas.MigrationHistory');
    expect(rollbackSql).toContain('RolledBackAt');
    expect(rollbackSql).toContain(`MigrationId = '${migrationId}'`);
  });

  test('Migration execution simulation (KSESSIONS_DEV)', () => {
    try {
      // Execute migration against KSESSIONS_DEV (not production)
      const migrationOutput = execSync(
        `sqlcmd -S AHHOME -d KSESSIONS_DEV -i "${migrationFile}" -b`,
        { encoding: 'utf-8' }
      );
      
      // Verify success message
      expect(migrationOutput).toContain('Migration');
      expect(migrationOutput).toContain('completed successfully');
      
      // Verify MigrationHistory record created
      const historyCheck = execSync(
        `sqlcmd -S AHHOME -d KSESSIONS_DEV -Q "SELECT COUNT(*) FROM canvas.MigrationHistory WHERE MigrationId = '${migrationId}'" -h -1`,
        { encoding: 'utf-8' }
      ).trim();
      
      expect(parseInt(historyCheck)).toBe(1);
      
      // Verify schema changes applied (example: check column exists)
      // Customize this query based on your specific migration
      const schemaCheck = execSync(
        `sqlcmd -S AHHOME -d KSESSIONS_DEV -Q "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('canvas.Sessions') AND name = 'CanvasType'" -h -1`,
        { encoding: 'utf-8' }
      ).trim();
      
      expect(parseInt(schemaCheck)).toBe(1);
      
    } catch (error: any) {
      console.error('Migration execution failed:', error.message);
      throw error;
    }
  });

  test('Rollback execution validation (KSESSIONS_DEV)', () => {
    try {
      // Execute rollback against KSESSIONS_DEV
      const rollbackOutput = execSync(
        `sqlcmd -S AHHOME -d KSESSIONS_DEV -i "${rollbackFile}" -b`,
        { encoding: 'utf-8' }
      );
      
      // Verify success message
      expect(rollbackOutput).toContain('Rollback');
      expect(rollbackOutput).toContain('completed successfully');
      
      // Verify MigrationHistory updated with rollback timestamp
      const historyCheck = execSync(
        `sqlcmd -S AHHOME -d KSESSIONS_DEV -Q "SELECT COUNT(*) FROM canvas.MigrationHistory WHERE MigrationId = '${migrationId}' AND RolledBackAt IS NOT NULL" -h -1`,
        { encoding: 'utf-8' }
      ).trim();
      
      expect(parseInt(historyCheck)).toBe(1);
      
      // Verify schema changes reversed (example: check column removed)
      const schemaCheck = execSync(
        `sqlcmd -S AHHOME -d KSESSIONS_DEV -Q "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('canvas.Sessions') AND name = 'CanvasType'" -h -1`,
        { encoding: 'utf-8' }
      ).trim();
      
      expect(parseInt(schemaCheck)).toBe(0);
      
    } catch (error: any) {
      console.error('Rollback execution failed:', error.message);
      throw error;
    }
  });

  test('Idempotency validation', () => {
    try {
      // First execution (should apply changes)
      const firstRun = execSync(
        `sqlcmd -S AHHOME -d KSESSIONS_DEV -i "${migrationFile}" -b`,
        { encoding: 'utf-8' }
      );
      expect(firstRun).toContain('completed successfully');
      
      // Second execution (should skip - already applied)
      const secondRun = execSync(
        `sqlcmd -S AHHOME -d KSESSIONS_DEV -i "${migrationFile}" -b`,
        { encoding: 'utf-8' }
      );
      expect(secondRun).toContain('already applied - skipping');
      
      // Verify only one MigrationHistory entry exists
      const historyCount = execSync(
        `sqlcmd -S AHHOME -d KSESSIONS_DEV -Q "SELECT COUNT(*) FROM canvas.MigrationHistory WHERE MigrationId = '${migrationId}'" -h -1`,
        { encoding: 'utf-8' }
      ).trim();
      
      expect(parseInt(historyCount)).toBe(1);
      
    } catch (error: any) {
      console.error('Idempotency test failed:', error.message);
      throw error;
    }
  });
});
```

**Orchestration Script for Migration Tests:**

Location: `.github/prompts.keys/{key}/scripts/run-migration-{timestamp}-validation-test.ps1`

```powershell
# ============================================================================
# Migration Validation Test Orchestration Script
# ============================================================================
# Migration: {YYYYMMDD-HHMMSS} - {description}
# Key: {key}
# Created: {ISO-8601-timestamp}
# ============================================================================

param(
    [switch]$KeepAppRunning = $false,
    [switch]$Headed = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=== Migration Validation Test ===" -ForegroundColor Cyan
Write-Host "Migration ID: {YYYYMMDD-HHMMSS}" -ForegroundColor Yellow
Write-Host "Description: {description}" -ForegroundColor Yellow
Write-Host ""

# Step 1: Verify migration files exist
Write-Host "[1/4] Verifying migration files..." -ForegroundColor Cyan
$migrationFile = "Scripts/Migrations/Prod/pending/migration-{timestamp}-{key}-{description}.sql"
$rollbackFile = "Scripts/Migrations/Prod/rollback/rollback-{timestamp}-{key}-{description}.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $rollbackFile)) {
    Write-Host "❌ Rollback file not found: $rollbackFile" -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ Migration files verified" -ForegroundColor Green

# Step 2: Backup KSESSIONS_DEV (optional but recommended)
Write-Host "[2/4] Creating database backup (optional)..." -ForegroundColor Cyan
# Add backup logic here if desired
Write-Host "  ⚠️ Backup skipped (optional step)" -ForegroundColor Yellow

# Step 3: Run migration validation tests
Write-Host "[3/4] Running migration validation tests..." -ForegroundColor Cyan
$testFile = ".github/prompts.keys/{key}/tests/migration-{timestamp}-{key}-{description}-validation.spec.ts"

$playwrightArgs = @(
    "test",
    $testFile
)

if ($Headed) {
    $playwrightArgs += "--headed"
}

try {
    npx playwright @playwrightArgs
    Write-Host "  ✅ Migration validation tests passed" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Migration validation tests failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 4: Cleanup (rollback KSESSIONS_DEV to clean state)
Write-Host "[4/4] Cleaning up KSESSIONS_DEV..." -ForegroundColor Cyan
try {
    sqlcmd -S AHHOME -d KSESSIONS_DEV -i $rollbackFile -b
    Write-Host "  ✅ Database cleaned (rollback executed)" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Cleanup failed (manual rollback may be needed)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Migration Validation Complete ===" -ForegroundColor Green
Write-Host "Migration ID: {YYYYMMDD-HHMMSS} is ready for deployment" -ForegroundColor Green
```

**Test Registry Entry:**

```markdown
### migration-{YYYYMMDD-HHMMSS}-{key}-{description}-validation.spec.ts
- **Created**: {ISO-8601-timestamp}
- **Type**: Migration Validation (SQL + Playwright)
- **Scenario**: Validate migration {migration-id} syntax, execution, rollback, and idempotency
- **Phase**: Phase {N} (from plan)
- **Status**: Active
- **Last Run**: N/A (not yet executed)
- **Orchestration**: scripts/run-migration-{timestamp}-validation-test.ps1
- **Migration Files**:
  - Forward: Scripts/Migrations/Prod/pending/migration-{timestamp}-{key}-{description}.sql
  - Rollback: Scripts/Migrations/Prod/rollback/rollback-{timestamp}-{key}-{description}.sql
```

**When to Generate Migration Tests:**

✅ **ALWAYS generate when**:
- Task agent creates production migration scripts (Step 5d)
- Phase plan contains "Production Migration Specification"
- User explicitly requests migration validation tests

❌ **DO NOT generate when**:
- Development-only database changes (KSESSIONS_DEV test data)
- No production migration scripts created
- Code-only changes (no database impact)

**Critical Rules:**

1. **ALWAYS test against KSESSIONS_DEV** (never production)
2. **ALWAYS validate both forward + rollback scripts**
3. **ALWAYS check idempotency** (double execution safety)
4. **ALWAYS verify MigrationHistory tracking**
5. **ALWAYS cleanup after test** (execute rollback to restore clean state)
6. **NEVER skip syntax validation** (even if migration looks simple)
7. **NEVER commit failing migration tests** (fix migration first)

**See Also:**
- `Scripts/Migrations/Prod/README.md` - Migration workflow documentation
- `task.prompt.md` Step 5d - Migration generation protocol
- `plan.prompt.md` Database Migration Protocol - Detection rules

---

### File Naming Convention
```
{feature}-{test-type}.spec.ts
```
Examples:
- `debug-panel-islamic-questions-functional.spec.ts` (Playwright E2E)
- `canvas-questions-orange-card-visual.spec.ts` (Percy visual)
- `question-enter-key-submit-functional.spec.ts` (Playwright E2E)
- `session-canvas-responsive-visual.spec.ts` (Percy multi-viewport)
Examples:
- `debug-panel-islamic-questions-broadcast.spec.ts`
- `question-enter-key-submit.spec.ts`
- `question-multi-user-sync.spec.ts`

### Test Location
- **ALL new tests**: `.github/prompts.keys/{key}/tests/` (MANDATORY - within key data stream)
- **Test Registry**: `.github/prompts.keys/{key}/tests/test-registry.md` (log of all tests for this key)
- **Orchestration Scripts**: `.github/prompts.keys/{key}/scripts/` (test execution scripts)
- **Production promotion**: Tests copy to `Tests/UI/` ONLY during task completion workflow (Step 9)
- **Temporary cleanup**: Tests in key directory deleted after production promotion
- **Rationale**: 
  - Keeps all key context in one place (key data stream + tests + scripts)
  - Test registry prevents duplication
  - Auto-cleanup prevents folder bloat
  - Clear quality gate before production promotion

### Test Registry Deduplication (MANDATORY)

**Before generating any test:**

1. **Check if test registry exists**: `.github/prompts.keys/{key}/tests/test-registry.md`
   - If missing → Create new registry using template below
   - If exists → Load and parse for duplicate detection

2. **Search for duplicate scenarios**:
   - Match by feature + scenario combination
   - Match by test file name pattern
   - If exact match found → **Skip generation**, inform user:
     ```
     ⚠️ Test already exists for this scenario
     
     Existing test: {test-file-name}.spec.ts
     Created: {timestamp}
     Last Run: {timestamp} ({PASS|FAIL})
     
     Skipping duplicate test generation.
     ```
   - If similar match found → Warn user, offer to generate variant

3. **Generate test** (if no duplicates found)

4. **Update test registry** immediately after generation:
   ```markdown
   ### {test-file-name}.spec.ts
   - **Created**: {ISO-8601-timestamp}
   - **Type**: Functional E2E | Visual Regression (Percy)
   - **Scenario**: {scenario-description}
   - **Phase**: Phase {N} (if from plan, otherwise "Ad-hoc")
   - **Status**: Active
   - **Last Run**: N/A (not yet executed)
   - **Orchestration**: scripts/{orchestration-script-name}.ps1
   ```

5. **Update global test index** (`.github/tests/test-index.json`) for cross-key reuse:
   - Read existing test-index.json
   - Generate test metadata:
     ```json
     {
       "id": "{key}-{test-identifier}",
       "key": "{key}",
       "file": "Tests/UI/{test-file-name}.spec.ts",
       "feature": "{primary-feature-name}",
       "scenarios": ["{scenario-1}", "{scenario-2}"],
       "tags": ["{tag1}", "{tag2}", "{tag3}"],
       "similarityHash": "{feature-name}-{primary-tags-concatenated}",
       "reusable": true|false,
       "created": "{ISO-8601-timestamp}",
       "orchestration": "Scripts/{orchestration-script}.ps1"
     }
     ```
   - Append to `tests` array
   - Update `metadata.totalTests` and `metadata.reusableTests` counters
   - Write updated test-index.json
   - **See**: `.github/tests/README.md` for similarity calculation algorithm

**Benefits:**
- ✅ Prevents duplicate test creation (per-key and global)
- ✅ Clear test inventory per key (test-registry.md)
- ✅ Cross-key test discovery and reuse (test-index.json)
- ✅ Facilitates test cleanup during Step 9 completion
- ✅ Enables test reuse across phases and keys
- ✅ Facilitates test cleanup during Step 9 completion
- ✅ Enables test reuse across phases

**Directory Structure Example:**
```
.github/prompts.keys/canvas/
├── canvas.md (key data stream)
├── tests/
│   ├── test-registry.md (log of all tests)
│   ├── share-button-functional.spec.ts
│   ├── share-button-visual.spec.ts
│   └── question-deletion-functional.spec.ts
└── scripts/
    ├── run-share-button-test.ps1
    └── run-question-deletion-test.ps1
```

**Test Registry Format** (`.github/prompts.keys/{key}/tests/test-registry.md`):
```markdown
# Test Registry: {key}

## Active Tests

### share-button-functional.spec.ts
- **Created**: 2025-10-18T12:30:00Z
- **Type**: Functional E2E
- **Scenario**: Share button click with confirmation dialog
- **Status**: Active
- **Last Run**: 2025-10-18T13:00:00Z (PASS)
- **Orchestration**: scripts/run-share-button-test.ps1

### share-button-visual.spec.ts
- **Created**: 2025-10-18T12:35:00Z
- **Type**: Visual Regression (Percy)
- **Scenario**: Share button styling across viewports
- **Status**: Active
- **Last Run**: 2025-10-18T13:05:00Z (PASS)
- **Orchestration**: scripts/run-share-button-test.ps1

## Archived Tests (Promoted to Production)

### question-deletion-functional.spec.ts
- **Promoted**: 2025-10-15T10:00:00Z
- **Destination**: Tests/UI/question-deletion-functional.spec.ts
- **Commit**: a3f5b9c1234
- **Status**: Deleted from key directory (now in production)
```

## Template Structure

```typescript
import { test, expect, Page, Browser } from '@playwright/test';

/**
 * Test Suite: {Feature Name}
 * Scenario: {Scenario Description}
 * 
 * Prerequisites:
 * - Session 212 must exist in database
 * - Server running on https://localhost:9091
 * - Mode: PW_MODE=standalone (auto-start) or manual server
 * 
 * References:
 * - PlaywrightTestPaths.MD: Session 212 tokens
 * - PlaywrightConfig.MD: Test configuration
 */

test.describe('{Feature Name}', () => {
    test.beforeAll(async () => {
        // Server readiness check (optional in standalone mode)
        // In standalone mode, webServer handles this automatically
    });

    test('{Scenario Description}', async ({ browser }) => {
        // Step 1: Setup - Create browser contexts
        const userContext = await browser.newContext();
        const userPage = await userContext.newPage();
        
        // Optional: Multi-user scenario
        // const hostContext = await browser.newContext();
        // const hostPage = await hostContext.newPage();

    // Collect browser console messages and assert no errors
    const consoleMessages: { type: string; text: string }[] = [];
    userPage.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));

    try {
            // Step 2: Navigate using canonical URLs from PlaywrightTestPaths.MD
            await userPage.goto('https://localhost:9091/session/canvas/KJAHA99L');
            await userPage.waitForLoadState('networkidle');
            
            // Step 3: Wait for API-based participant loading
            await userPage.waitForTimeout(3000);
            
            // Step 4: Verify initial UI state
            await expect(userPage.locator('.session-canvas-root').first())
                .toBeVisible({ timeout: 10000 });
            
            // Step 5: Perform test actions
            // ... test-specific logic ...
            
            // Step 6: Assert expected outcomes
            // ... assertions ...
            
            // Step 7: Verify API responses match PlaywrightTestPaths.MD patterns
            // ... API validation ...
            
            // Step 8: Assert no browser console errors occurred during the test
            const consoleErrors = consoleMessages.filter(m => m.type === 'error');
            expect(consoleErrors, `Browser console errors detected: ${consoleErrors.map(e => e.text).join('\n')}`).toHaveLength(0);
        } finally {
            // Cleanup
            await userContext.close();
            // await hostContext.close();
        }
    });
});
```

## Server Management Examples

### Example 1: Standalone Mode (Recommended)
```powershell
# Set mode before test execution
$env:PW_MODE="standalone"

# Run tests (Playwright handles server lifecycle)
npx playwright test debug-panel-islamic-questions-broadcast.spec.ts --headed
```

### Example 2: Manual Server Check
```typescript
test.beforeAll(async () => {
    // Verify server is accessible
    const response = await fetch('https://localhost:9091/api/health');
    if (!response.ok) {
        throw new Error('Server not running. Start with: dotnet run (in SPA/NoorCanvas)');
    }
});
```


### Example 3: PowerShell Server Check (in test instructions)
```markdown
## Prerequisites
Before running tests, you MUST start the server in a separate, elevated (Administrator) PowerShell window:

```powershell
# Open PowerShell as Administrator (right-click → "Run as administrator")
cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'
$env:ASPNETCORE_URLS = 'https://localhost:9091'
dotnet run
```

# Optionally, for CI/CD or automation, use standalone mode:
$env:PW_MODE="standalone"
npx playwright test
```

## Multi-Browser Test Pattern

```typescript
test('Multi-user question synchronization', async ({ browser }) => {
    // Create separate contexts for isolation
    const participantContext = await browser.newContext();
    const participantPage = await participantContext.newPage();
    
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    
    try {
        // Navigate both users
        await participantPage.goto('https://localhost:9091/session/canvas/KJAHA99L');
        await hostPage.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        
        await Promise.all([
            participantPage.waitForLoadState('networkidle'),
            hostPage.waitForLoadState('networkidle')
        ]);
        
        // Wait for API loading
        await participantPage.waitForTimeout(3000);
        await hostPage.waitForTimeout(3000);
        
        // Participant submits question
        await participantPage.fill('.canvas-form-textarea', 'Test question');
        await participantPage.click('.canvas-form-submit-button');
        
        // Wait for SignalR broadcast
        await hostPage.waitForTimeout(2000);
        
        // Verify host sees the question
        await expect(hostPage.locator('.question-item'))
            .toContainText('Test question');
            
    } finally {
        await participantContext.close();
        await hostContext.close();
    }
});
```

## API Validation Pattern

```typescript
// Verify API responses match PlaywrightTestPaths.MD expected data
const response = await page.request.get(
    'https://localhost:9091/api/participant/session/KJAHA99L/me'
);

expect(response.status()).toBe(200);

const data = await response.json();
expect(data.name).toBe("Peter Parker");
expect(data.userGuid).toBe("b59e3dca-9330-40f5-9de8-9a5350fd2d6a");
```

## Console Error Monitoring

```typescript
const consoleErrors: string[] = [];

page.on('console', msg => {
    if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
    }
});

// After test actions
const criticalErrors = consoleErrors.filter(err => 
    err.includes('NotifyQuestionDeleted') ||
    err.includes('appendChild') ||
    err.includes('SignalR')
);

expect(criticalErrors).toHaveLength(0);
```

---

## Percy Visual Regression Test Template

**Use this template when generating visual regression tests (see Test Type Selection above).**

**Plan Integration:**

**If plan specifies Percy requirement:**
1. Check plan's "Playwright Test Specification" → Percy: Yes/No
2. If Percy: Yes:
   - Use plan's visual change rationale
   - Capture specified screens/flows from plan
   - Follow viewport specifications from plan (or default to 375/768/1280)
   - Use plan's percyCSS hiding rules (if specified)
3. If Percy: No:
   - Skip Percy snapshots (functional test only)
   - Generate functional E2E test instead

**If no plan:**
1. Use decision matrix (existing logic below)
2. Infer from change type (CSS/styling → Percy, behavior → functional)

---

```typescript
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

/**
 * Visual Regression Test: {Feature Name}
 * 
 * Purpose: Verify visual consistency across viewports
 * Baseline: Percy dashboard stores approved snapshots
 * 
 * Prerequisites:
 * - Percy token configured: PERCY_TOKEN env variable
 * - Session 212 exists in database
 * - Run with: npm run test:percy:visual -- path/to/test.spec.ts
 * 
 * Configuration:
 * - Viewports: 375px (mobile), 768px (tablet), 1280px (desktop)
 * - See .percy.yml for full config
 * 
 * References:
 * - PlaywrightQuickRef.md: Decision matrix for when to use Percy
 * - VISUAL_REGRESSION_TESTING.md: Percy setup and workflows
 */

test.describe('Visual Regression: {Feature Name}', () => {
  test('should render {component} correctly across viewports', async ({ page }) => {
    // Step 1: Navigate to component
    await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
    
    // Step 2: Wait for component to fully load
    await page.waitForSelector('[data-testid="component-root"]', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Step 3: Take baseline snapshot (tests all configured viewports)
    await percySnapshot(page, '{Component Name} - Initial State', {
      widths: [375, 768, 1280],  // Mobile, tablet, desktop
      minHeight: 1024,
      percyCSS: `
        /* Hide dynamic elements that change between test runs */
        .timestamp { display: none; }
        .user-avatar { display: none; }
      `
    });
    
    // Step 4: Interact with component (if testing state changes)
    await page.click('[data-testid="toggle-button"]');
    await page.waitForTimeout(500);  // Wait for CSS transitions
    
    // Step 5: Take snapshot of changed state
    await percySnapshot(page, '{Component Name} - Active State');
    
    // Step 6: Test different states/variants (optional)
    await page.click('[data-testid="secondary-action"]');
    await percySnapshot(page, '{Component Name} - Secondary State');
  });

  test('should render {component} in different themes', async ({ page }) => {
    // Test visual consistency across theme variations
    await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
    await page.waitForSelector('.canvas-question-card-orange');
    
    // Orange theme
    await percySnapshot(page, '{Component} - Orange Theme');
    
    // Green theme (if applicable)
    await page.click('[data-testid="vote-up"]');
    await page.waitForSelector('.canvas-question-card-green');
    await percySnapshot(page, '{Component} - Green Theme');
  });
});
```

### Percy Test Execution Commands

```bash
# Run single visual test (headed mode)
npm run test:percy:headed -- Tests/UI/feature-visual.spec.ts

# Run all visual tests (headless)
npm run test:percy

# Run visual test without Percy (for debugging)
npx playwright test Tests/UI/feature-visual.spec.ts --headed
```

### Percy Snapshot Best Practices

1. **Naming Convention**: Use descriptive names that clearly indicate component and state
   - Good: `"Question Card - Orange Theme - Voted State"`
   - Bad: `"Test 1"` or `"Snapshot"`

2. **Viewport Strategy**:
   - Always test mobile (375px), tablet (768px), desktop (1280px)
   - Use `.percy.yml` defaults unless specific viewport needed

3. **Dynamic Content Handling**:
   - Use `percyCSS` to hide timestamps, user avatars, random IDs
   - Wait for animations/transitions with `page.waitForTimeout()`
   - Ensure data is stable (use Session 212 canonical data)

4. **Test Organization**:
   - One test file per component or feature
   - Group related snapshots in same test case
   - Separate theme/variant tests into distinct test cases

5. **Baseline Management**:
   - Approve snapshots in Percy dashboard after review
   - Re-baseline when intentional design changes occur
   - Investigate ALL visual diffs before approving

---

## Output Format

**CONCISE OUTPUT** (default):
```markdown
✅ Test Created: {test-file}.spec.ts

**Test Type**: {Functional E2E | Visual Regression (Percy)}
**Scenarios**: {X} test scenarios covering {brief-description}

### What Was Created
- {Brief bullet about test scenario 1}
- {Brief bullet about test scenario 2}
- {Brief bullet about test scenario 3}

### Next Steps
- Run test: `.\Scripts\{script-name}.ps1`
- View details: `.github/prompts.keys/{key}/tests/test-registry.md`
```

**RULES:**
- ✅ YES: Bulleted summary of what test scenarios cover
- ✅ YES: How to run the test
- ✅ YES: Link to registry for full specification
- ❌ NO: Full test code (it's in the file)
- ❌ NO: File locations (user doesn't care)
- ❌ NO: Template examples or code blocks

---

## Test Generation Details

Generate complete TypeScript test file, PowerShell orchestration script, AND update test registry:

### 1. TypeScript Test File (.github/prompts.keys/{key}/tests/{feature}-{test-type}.spec.ts)

**Generation Strategy:**

**A. Plan-Driven Generation** (when {key}.plan.md exists):
1. Load test specification from plan's current phase
2. Use plan's test scenarios verbatim
3. Apply plan's selector strategy, logging behavior
4. Use plan's test mode (headed/headless)
5. Apply plan's Percy requirements (if visual test)
6. Use plan's System Context Pack for test data

**B. Parameter-Driven Generation** (no plan):
1. Infer test type from `testType` parameter or change analysis
2. Use decision matrix for test type selection
3. Apply canonical patterns from templates
4. Use default Session 212 test data

**File Structure** (both modes):
1. **File header**: Feature description, prerequisites, references
2. **Imports**: Playwright test framework
3. **Test suite**: Descriptive test.describe block
4. **Server check**: beforeAll hook with readiness verification (if not using webServer)
5. **Test cases**: One or more test() blocks with clear step comments
6. **Cleanup**: Proper context/page closure in finally blocks
7. **Documentation**: Inline comments explaining critical waits and assertions

### 2. PowerShell Orchestration Script (.github/prompts.keys/{key}/scripts/run-{feature}-test.ps1)

> **MANDATORY**: Follow canonical patterns from `.github/prompts/shared/test-orchestration-patterns.md`

**Critical Requirements:**
- ✅ **ALWAYS** use `Start-Process -PassThru -WindowStyle Minimized` (NEVER `Start-Job`)
- ✅ **ALWAYS** include `try/finally` cleanup block with `Stop-Process -Id $app.Id -Force`
- ✅ **ALWAYS** use health check polling with timeout (NEVER fixed `Start-Sleep` delays)
- ✅ **ALWAYS** use ASCII characters ONLY (NO emojis, Unicode, special characters)
- ✅ **OPTIONAL** source variables from `.github/_Portable/DATA/app-hosting.env` for portability

**Script Structure:**
1. **File header**: ASCII-only comments describing purpose and usage
2. **Process cleanup**: `Get-Process -Name "{{APP_PROCESS_NAME}}" | Stop-Process -Force`
3. **App launch**: `$app = Start-Process ... -PassThru -WindowStyle Minimized`
4. **try block start**: Wrap health check and test execution
5. **Health check polling**: Loop with 500ms intervals, timeout after 60 seconds
6. **Test execution**: `npx playwright test ".github/prompts.keys/{key}/tests/{feature}-{test-type}.spec.ts" --reporter=list --headed`
7. **finally block**: `Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue`

**Example** (see test-orchestration-patterns.md for complete template with comments):
```powershell
# Scripts/run-{feature}-test.ps1
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force

$app = Start-Process "dotnet" -ArgumentList "run --no-build" `
    -WorkingDirectory "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas" `
    -PassThru -WindowStyle Minimized

try {
    $timeout = 60
    $startTime = Get-Date
    do {
        Start-Sleep -Milliseconds 500
        try {
            $response = Invoke-WebRequest -Uri "https://localhost:9091" -TimeoutSec 2 -UseBasicParsing
            if ($response.StatusCode -eq 200) { break }
        } catch { }
        if (((Get-Date) - $startTime).TotalSeconds -gt $timeout) {
            Write-Host "[ERROR] Timeout"; exit 1
        }
    } while ($true)
    
    npx playwright test ".github/prompts.keys/{key}/tests/{feature}.spec.ts" --reporter=list
}
finally {
    Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
}
```

### 3. Test Registry Update (.github/prompts.keys/{key}/tests/test-registry.md)

**Deduplication Check (MANDATORY):**
1. **Load registry** (create if missing using template)
2. **Search for duplicates**: Match feature + scenario + test type
3. **If duplicate found**: 
   - **Skip generation**, inform user
   - Return existing test details
4. **If no duplicate**: Proceed with generation

**Add new entry** to Active Tests section:
   ```markdown
   ### {feature}-{test-type}.spec.ts
   - **Created**: {ISO-8601 timestamp}
   - **Type**: {Functional E2E | Visual Regression}
   - **Scenario**: {scenario description}
   - **Phase**: {Phase N | Ad-hoc} (from plan or standalone)
   - **Status**: Active
   - **Last Run**: N/A (not yet executed)
   - **Orchestration**: scripts/run-{orchestration-script-name}.ps1
   - **Plan Reference**: {key}.plan.md Phase {N} (if from plan)
   ```

**Update registry** after test execution (by task agent):
   ```markdown
   - **Last Run**: {ISO-8601 timestamp} ({PASS|FAIL})
   - **Test Results**: {X}/{Y} scenarios passing
   - **Flaky**: {Yes|No} (if failure inconsistent)
   ```

**CRITICAL REMINDER: All PowerShell scripts MUST use ASCII characters only (see PowerShell Script Character Encoding Rules above)**

## Test Lifecycle Management

### Test Creation (Step 6.1 of task.prompt.md)
1. Generate test file in `.github/prompts.keys/{key}/tests/`
2. Generate orchestration script in `.github/prompts.keys/{key}/scripts/`
3. Update test registry with new entry
4. Document test paths in key data stream

### Test Execution (During Development)
1. Run via orchestration script: `.\github\prompts.keys\{key}\scripts\run-{feature}-test.ps1`
2. Update test registry with execution results (Last Run, Status)
3. Document test results in key data stream

### Test Promotion (Step 9: Completion Workflow)
1. **Copy passing tests** to production: `Tests/UI/{feature}-{test-type}.spec.ts`
2. **Update orchestration script paths** to point to production test location
3. **Copy orchestration script** to `Scripts/run-{feature}-test.ps1`
4. **Archive test registry entry**:
   ```markdown
   ## Archived Tests (Promoted to Production)
   
   ### {feature}-{test-type}.spec.ts
   - **Promoted**: {ISO-8601 timestamp}
   - **Destination**: Tests/UI/{feature}-{test-type}.spec.ts
   - **Commit**: {SHA}
   - **Status**: Deleted from key directory (now in production)
   ```
5. **Delete test from key directory** (cleanup to prevent bloat)
6. **Keep registry** for historical reference

### Test Cleanup (Automatic)
- **When**: Step 9 (Completion Workflow) OR when tests become obsolete
- **What**: Delete test files from `.github/prompts.keys/{key}/tests/`
- **Why**: Prevent folder bloat, maintain single source of truth (production)
- **Preserve**: Test registry entries (archived section for history)

---

## Success Criteria

- [PASS] Uses canonical Session 212 data from PlaywrightTestPaths.MD
- [PASS] Includes server readiness check (standalone mode aware)
- [PASS] Explicitly binds server to https://localhost:9091 (sets ASPNETCORE_URLS)
- [PASS] Follows proven API-based participant loading pattern
- [PASS] Implements proper wait strategies (networkidle + explicit timeouts)
- [PASS] Tests multi-browser scenarios when applicable
- [PASS] Monitors console for critical errors
- [PASS] Validates API responses against expected data
- [PASS] Includes cleanup in finally blocks
- [PASS] Test file saved to `.github/prompts.keys/{key}/tests/` (within key data stream)
- [PASS] Orchestration script saved to `.github/prompts.keys/{key}/scripts/`
- [PASS] Test registry updated with new test entry
- [PASS] No duplicate tests created (registry checked first)
- [PASS] ASCII-only characters in PowerShell scripts

## Workflow Integration

**Invoked by**: 
- `task.prompt.md` when test generation is required for UI changes (Step 6.1)
- `plan.prompt.md` during test specification (handoff to test generation)
- `question.prompt.md` when user asks "how do I test X feature?"
- Direct invocation with test parameters

**Parameters Received**:
- `key`: Key name for directory structure (MANDATORY)
- `feature`: Name of feature being tested (e.g., "debug-panel-islamic-questions")
- `scenario`: Specific test scenario (e.g., "random-question-broadcast")
- `endpoints`: API endpoints involved (e.g., `/api/Question/Submit`)
- `tokens`: Override defaults if needed (default: Session 212 tokens)
- `multiUser`: Boolean indicating multi-browser test requirement
- `testType`: "functional" | "visual" | "both" (determines test generation approach)
- `phase`: Phase number (if from plan) - used for registry tracking and naming

**Context Sources**:
- **Primary**: `.github/prompts.keys/{key}/{key}.plan.md` (if exists - test specification, System Context Pack)
- **Fallback**: Parameters + canonical patterns + decision matrix

**Returns to**: 
- Calling prompt with test file paths and execution instructions
- Key-data-stream documentation with test coverage details
- Test registry with duplicate detection results

**Artifacts Generated**:
1. TypeScript test file in `.github/prompts.keys/{key}/tests/{feature}-{test-type}.spec.ts`
2. PowerShell orchestration script in `.github/prompts.keys/{key}/scripts/run-{feature}-test.ps1`
3. Test registry entry in `.github/prompts.keys/{key}/tests/test-registry.md`
4. Execution instructions (how to run the tests)
5. Server management guidance (when to use orchestration vs webServer)

**Key Data Stream Entry Template**:
```markdown
## Test Coverage

### Active Tests (In Key Directory)
- **Test File**: .github/prompts.keys/{key}/tests/{feature}-{test-type}.spec.ts
- **Orchestration Script**: .github/prompts.keys/{key}/scripts/run-{script-name}.ps1
- **Test Type**: {Functional E2E | Visual Regression | Both}
- **Session Data**: Session 212 (Host: PQ9N5YWW, User: KJAHA99L)
- **Execution**: `.\.github\prompts.keys\{key}\scripts\run-{script-name}.ps1`
- **Expected Result**: {description of expected test outcomes}
- **Status**: Active (pending promotion to production)
- **Plan Reference**: {key}.plan.md Phase {N} (if from plan, otherwise "Ad-hoc generation")
- **Test Registry**: .github/prompts.keys/{key}/tests/test-registry.md (entry created)

### Test Generation Context
- **Source**: {Plan-driven | Parameter-driven}
- **Plan Specification Used**: {Yes (Phase N) | No (inferred from parameters)}
- **Duplicate Check**: {Passed (no duplicates) | Skipped (duplicate found: {existing-test-name})}
- **Orchestration Template**: {Plan-provided | Canonical template}

### Production Tests (Promoted)
- **Production Path**: Tests/UI/{feature}-{test-type}.spec.ts
- **Promoted**: {ISO-8601 timestamp}
- **Commit**: {SHA}
- **Status**: In production (key directory test deleted)
```
