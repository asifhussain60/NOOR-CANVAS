# UI Execution Requirements (Steps 5-6)

**Purpose:** Standards for UI/UX implementation, CSS, responsive design, testing, and validation

**Referenced by:** task.prompt.md Steps 5-6

**Dependencies:**
- `test-generation.prompt.md` - Test creation protocols
- `shared/mandatory-lint-validation.md` - Linting standards
- `shared/high-priority-task-detection.md` - Constraint verification

---

## Step 5d: Production Migration Generation

**Trigger:** When phase involves database schema changes

**Detection Signals:**
- ✅ ALTER TABLE, CREATE TABLE, DROP TABLE, CREATE INDEX, DROP INDEX
- ✅ ADD CONSTRAINT, DROP CONSTRAINT (foreign keys, defaults, checks)
- ✅ Schema modifications to canvas.* tables
- ✅ Data migrations (UPDATE, INSERT for schema initialization)
- ✅ Phase plan contains "Production Migration Specification" section

**MANDATORY: Skip if Development-Only Changes**
- ❌ Changes to KSESSIONS_DEV specific data (test sessions, participants)
- ❌ Temporary test data (will be cleared)
- ❌ Code-only changes with no database impact

---

### Generation Protocol

**Step 1: Extract Migration Details from Plan**

If `{key}.plan.md` contains "Production Migration Specification":

```markdown
### Production Migration Specification

**Migration Required**: YES
**Database Changes**:
- ALTER TABLE [canvas].[Sessions] ADD [CanvasType] NVARCHAR(20) NULL DEFAULT 'asset'
- CREATE INDEX IX_Sessions_CanvasType ON [canvas].[Sessions] ([CanvasType])

**Migration Script**: Scripts/Migrations/Prod/pending/migration-{timestamp}-{key}-{description}.sql
**Rollback**: Scripts/Migrations/Prod/rollback/rollback-{timestamp}-{key}-{description}.sql
```

**Step 2: Generate Migration ID**

Format: `{YYYYMMDD-HHMMSS}` (e.g., `20251020-143000`)

```powershell
# PowerShell command:
Get-Date -Format "yyyyMMdd-HHmmss"
```

**Step 3: Create Forward Migration Script**

Location: `Scripts/Migrations/Prod/pending/migration-{YYYYMMDD-HHMMSS}-{key}-{description}.sql`

**Template:**

```sql
-- ============================================================================
-- Production Migration Script
-- ============================================================================
-- Migration ID: {YYYYMMDD-HHMMSS}
-- Key: {key}
-- Description: {description}
-- Created: {ISO-8601-timestamp}
-- Author: GitHub Copilot (Agent: task)
-- Database: KSESSIONS (Production)
-- Schema: canvas
-- ============================================================================

-- SAFETY CHECKS
IF DB_NAME() != 'KSESSIONS'
BEGIN
    RAISERROR('ERROR: This migration must run against KSESSIONS database only!', 16, 1)
    RETURN
END
GO

-- Check if already applied
IF EXISTS (SELECT 1 FROM canvas.MigrationHistory WHERE MigrationId = '{YYYYMMDD-HHMMSS}')
BEGIN
    PRINT 'Migration {YYYYMMDD-HHMMSS} already applied - skipping'
    RETURN
END
GO

-- MIGRATION LOGIC
BEGIN TRANSACTION MigrationTrans;

BEGIN TRY
    PRINT 'Starting migration: {description}'
    
    -- {Database changes - use IF NOT EXISTS for idempotency}
    IF NOT EXISTS (SELECT 1 FROM sys.columns 
                   WHERE object_id = OBJECT_ID('canvas.Sessions') 
                   AND name = 'CanvasType')
    BEGIN
        ALTER TABLE [canvas].[Sessions] 
        ADD [CanvasType] NVARCHAR(20) NULL DEFAULT 'asset';
        PRINT '  ✅ Added CanvasType column'
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes 
                   WHERE name = 'IX_Sessions_CanvasType')
    BEGIN
        CREATE INDEX IX_Sessions_CanvasType 
        ON [canvas].[Sessions] ([CanvasType]);
        PRINT '  ✅ Created index IX_Sessions_CanvasType'
    END
    
    -- Record in history
    INSERT INTO canvas.MigrationHistory 
    (MigrationId, Description, AppliedAt, AppliedBy)
    VALUES ('{YYYYMMDD-HHMMSS}', '{description}', GETUTCDATE(), SYSTEM_USER);
    
    COMMIT TRANSACTION MigrationTrans;
    PRINT '✅ Migration {YYYYMMDD-HHMMSS} completed successfully'
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION MigrationTrans;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    PRINT '❌ Migration failed: ' + @ErrorMessage
    RAISERROR(@ErrorMessage, 16, 1);
END CATCH
GO
```

**Step 4: Create Rollback Script**

Location: `Scripts/Migrations/Prod/rollback/rollback-{YYYYMMDD-HHMMSS}-{key}-{description}.sql`

**Template:**

```sql
-- ============================================================================
-- Production Migration Rollback Script
-- ============================================================================
-- Migration ID: {YYYYMMDD-HHMMSS}
-- Key: {key}
-- Description: Rollback {description}
-- Created: {ISO-8601-timestamp}
-- Author: GitHub Copilot (Agent: task)
-- Database: KSESSIONS (Production)
-- Schema: canvas
-- ============================================================================

-- SAFETY CHECKS
IF DB_NAME() != 'KSESSIONS'
BEGIN
    RAISERROR('ERROR: This rollback must run against KSESSIONS database only!', 16, 1)
    RETURN
END
GO

-- ROLLBACK LOGIC
BEGIN TRANSACTION RollbackTrans;

BEGIN TRY
    PRINT 'Starting rollback: {description}'
    
    -- {Reverse database changes - use IF EXISTS for idempotency}
    -- Example (reverse order of forward migration):
    IF EXISTS (SELECT 1 FROM sys.indexes 
               WHERE name = 'IX_Sessions_CanvasType')
    BEGIN
        DROP INDEX IX_Sessions_CanvasType ON [canvas].[Sessions];
        PRINT '  ✅ Dropped index IX_Sessions_CanvasType'
    END
    
    IF EXISTS (SELECT 1 FROM sys.columns 
               WHERE object_id = OBJECT_ID('canvas.Sessions') 
               AND name = 'CanvasType')
    BEGIN
        ALTER TABLE [canvas].[Sessions] DROP COLUMN [CanvasType];
        PRINT '  ✅ Dropped CanvasType column'
    END
    
    -- Update history
    UPDATE canvas.MigrationHistory
    SET RolledBackAt = GETUTCDATE(), RolledBackBy = SYSTEM_USER
    WHERE MigrationId = '{YYYYMMDD-HHMMSS}';
    
    COMMIT TRANSACTION RollbackTrans;
    PRINT '✅ Rollback {YYYYMMDD-HHMMSS} completed successfully'
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION RollbackTrans;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    PRINT '❌ Rollback failed: ' + @ErrorMessage
    RAISERROR(@ErrorMessage, 16, 1);
END CATCH
GO
```

**Step 5: Document in Work Log**

```markdown
### Migration Generated

**Migration ID**: {YYYYMMDD-HHMMSS}
**Files Created**:
- `Scripts/Migrations/Prod/pending/migration-{timestamp}-{key}-{description}.sql`
- `Scripts/Migrations/Prod/rollback/rollback-{timestamp}-{key}-{description}.sql`

**Database Changes**:
- {list of SQL statements}

**Deployment**: Auto-executed by ncdeploy.ps1 Step 3
**Rollback**: Available at Scripts/Migrations/Prod/rollback/rollback-{timestamp}...sql

**Validation**: 
- ✅ Syntax validated (idempotent checks present)
- ✅ Safety checks (DB_NAME validation)
- ✅ Transaction wrapped (auto-rollback on error)
- ✅ MigrationHistory tracking
```

**Step 6: Commit Migration Scripts**

```bash
git add Scripts/Migrations/Prod/pending/migration-*.sql
git add Scripts/Migrations/Prod/rollback/rollback-*.sql
git commit -m "migration({key}): {description}

Migration ID: {YYYYMMDD-HHMMSS}
Database: KSESSIONS (Production)
Schema: canvas

Forward: Scripts/Migrations/Prod/pending/migration-{timestamp}...sql
Rollback: Scripts/Migrations/Prod/rollback/rollback-{timestamp}...sql

Changes:
- {list of database changes}

Deployment: Automatic via ncdeploy.ps1 Step 3"
```

---

## Step 6: Validate

**Three Critical Validations (ALL MANDATORY):**

### 6.1: Test Integration (when UI changes occur)

**LOAD MODULE:** `.github/prompts/test-generation.prompt.md`

**When to invoke test-generation.prompt.md:**
1. UI changes (Blazor components, CSS, JavaScript)
2. API endpoint changes (new routes, modified contracts)
3. User interaction flows (buttons, forms, modals)
4. Visual regressions (layout, styling, responsive design)

**Handoff Protocol:**
1. Prepare test specification parameters:
   - `key`: Current work key
   - `scenario`: Test scenario description
   - `mode`: "functional" | "visual" | "both"
   - `tokens`: Session 212 defaults (unless specified)
   - `multiUser`: true if host/participant interaction
   - `testType`: Based on change type
2. Receive generated test files + orchestration script
3. Document in key data stream

**Key Requirements:**
- **Test Location**: `.github/key-data-streams/{key}/tests/`
- **Test Registry**: `.github/key-data-streams/{key}/tests/test-registry.md`
- **Orchestration Scripts**: `.github/key-data-streams/{key}/scripts/`
- **Naming**: `{feature}-{test-type}.spec.ts`
- **Test Data**: Session 212 (tokens: KJAHA99L user / PQ9N5YWW host)
- **Execution**: Via orchestration scripts ONLY
- **Cleanup**: Tests deleted after production promotion (Step 9)

**Skip test creation if:**
- Backend-only (no UI impact)
- Documentation/configuration only
- User explicitly requests `--no-tests`

---

### 6.2: Mandatory Lint Validation (ALL Modified Files)

**CRITICAL:** MANDATORY before any commit. Lint failures BLOCK commit creation.

**LOAD MODULE:** `.github/prompts/shared/mandatory-lint-validation.md`

**Execution:**

1. **Detect all modified files:**
   ```powershell
   $modifiedFiles = git diff --name-only HEAD
   ```

2. **Run linters by file type:**
   - **C#** (*.cs, *.cshtml, *.razor): Roslynator + Roslyn Analyzers
   - **JavaScript/TypeScript** (*.js, *.ts, *.tsx): ESLint
   - **CSS/Razor** (*.css, *.razor): Stylelint
   - **PowerShell** (*.ps1): PSScriptAnalyzer
   - **JSON** (*.json): JSON syntax validation + Prettier

3. **Auto-Fix Attempt:**
   - If lint failures → attempt auto-fix with `--fix`
   - Re-run validation after auto-fix
   - If still failing → Request manual intervention

4. **Linter Installation (if missing):**
   - ESLint: `npm install --save-dev eslint @typescript-eslint/parser`
   - Stylelint: `npm install --save-dev stylelint stylelint-config-standard`
   - PSScriptAnalyzer: `Install-Module -Name PSScriptAnalyzer -Scope CurrentUser -Force`

5. **Report Results:**
   ```
   [LINT VALIDATION]
   - C# Files: [PASS] 3 files (0 warnings)
   - JS/TS Files: [PASS] 2 files (0 errors)
   - CSS Files: [PASS] 1 file (0 errors)
   - PowerShell: [PASS] 1 file (0 warnings)
   - JSON: [PASS] 2 files (valid syntax)
   
   All files passed lint validation.
   ```

6. **Halt on Failure:**
   - If ANY linter returns non-zero exit code → HALT
   - Document lint errors in key data stream
   - **NEVER proceed to Step 8 (Commit) with lint failures**

---

### 6.3: High-Priority Constraint Verification

**CRITICAL:** Verify ALL CAPS constraints from user request before marking work complete.

**LOAD MODULE:** `.github/prompts/shared/high-priority-task-detection.md`

**Execution:**

1. **Retrieve constraints from Step 2.1.5:**
   ```markdown
   HIGH-PRIORITY Constraints:
   1. DO NOT remove existing save button (Preservation)
   2. EXACTLY match mockup colors (Exactness)
   ```

2. **Run verification checks:**
   - **Preservation**: DOM queries, visual inspection, regression tests
   - **Exactness**: Percy visual tests, CSS value inspection
   - **Mandatory Inclusion**: Code inspection, E2E tests, feature presence
   - **Behavioral**: Functional tests, user acceptance testing

3. **Document verification results:**
   ```markdown
   ## High-Priority Constraint Verification
   
   - [PASS] Constraint 1: Save button preserved
     - Verification: DOM query `.session-save-button` successful
     - Test: SaveButtonPresent E2E test passed
   
   - [PASS] Constraint 2: Colors matched exactly
     - Verification: Percy visual regression passed
     - CSS values: #FF5733, #3357FF confirmed
   ```

4. **Constraint Violation Protocol:**
   - If ANY constraint violated → HALT immediately
   - Rollback to checkpoint commit
   - Notify user with violation details
   - Return to Step 3 (re-plan with constraint awareness)

**Output:**
```
HIGH-PRIORITY Constraints Verified:
- [PASS] Save button preserved (user requested: DO NOT remove)
- [PASS] Mockup colors matched (user requested: EXACTLY match)
```

---

## Output Control (based on verbosity)

**Concise:**
- Test creation summary (count, types)
- Lint validation summary (pass/fail by file type)
- Constraint verification summary (pass/fail count)

**Detailed:**
- Full test specification parameters
- Lint output per file with specific errors
- Auto-fix attempts and results
- Complete constraint verification with evidence
- Migration scripts (if database changes)
