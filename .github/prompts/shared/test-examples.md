# Test Generation Examples
**Purpose:** Code examples and templates for test-generation.prompt.md  
**Version:** 1.0.0  
**Last Updated:** 2025-10-31

---

## State Tracker Integration

**Load state-tracker utility and log incoming request:**

```powershell
# Source the state-tracker utility
. .github/prompts/shared/state-tracker.ps1

# Log the test generation request
Update-StateRequest -Key $key -Type "test-generation" -UserRequest $scenario -PromptChain @("route", "test-generation")
```

**After test file commits:**
```powershell
Update-StateCommit -Key $key -Sha (git rev-parse --short HEAD) -Message "test({key}): Generated {test-type} test for {scenario}" -CheckpointType "test-generation"
```

---

## Authentication Detection Algorithm

**Purpose:** Detect if test requires host authentication before implementation

```typescript
// Check test scenario for authentication keywords
const requiresAuth = scenario.match(/host|broadcast|share|session.*start|control.*panel|recording|transcript.*share/i)

// Check route patterns
const routeRequiresAuth = testRoute.includes('/host') || 
                          testRoute.includes('/control') ||
                          testRoute.includes('/admin')

// Check test steps for authentication actions
const stepsRequireAuth = testSteps.some(step => 
  step.includes('start session') ||
  step.includes('begin broadcast') ||
  step.includes('share transcript') ||
  step.includes('manage participants')
)

if (requiresAuth || routeRequiresAuth || stepsRequireAuth) {
  // Add authentication step to test
}
```

---

## Authentication Patterns

### Host Control Panel Test Template

```typescript
test.describe('Host Control Panel - {scenario}', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://localhost:9091/sessions/212');
    
    // ⚠️ AUTHENTICATION REQUIRED: Host token input
    const tokenInput = page.locator('input[placeholder*="token" i]').first();
    await tokenInput.fill('TESTHOST'); // Session 212 host token: PQ9N5YWW
    await tokenInput.press('Enter');
    
    // Wait for authentication to complete
    await page.waitForTimeout(2000);
    
    // Verify "Start Session" button is enabled
    const startSessionButton = page.locator('button:has-text("Start Session")').first();
    await expect(startSessionButton).toBeEnabled();
  });
  
  test('{test name}', async ({ page }) => {
    // Test implementation with authenticated state
  });
});
```

### Participant Test Template

```typescript
test.describe('Participant - {scenario}', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://localhost:9091/sessions/212');
    
    // Participant tests use KJAHA99L token
    const tokenInput = page.locator('input[placeholder*="token" i]').first();
    await tokenInput.fill('TESTPART'); // Session 212 participant token
    await tokenInput.press('Enter');
    await page.waitForTimeout(1000);
  });
  
  test('{test name}', async ({ page }) => {
    // Test implementation
  });
});
```

---

## Migration Test Template

**Purpose:** Validate migration syntax, execution safety, rollback functionality

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
      
      // Verify schema changes applied
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
      
      // Verify rollback success
      expect(rollbackOutput).toContain('Rollback');
      expect(rollbackOutput).toContain('completed successfully');
      
      // Verify MigrationHistory updated with rollback timestamp
      const historyCheck = execSync(
        `sqlcmd -S AHHOME -d KSESSIONS_DEV -Q "SELECT RolledBackAt FROM canvas.MigrationHistory WHERE MigrationId = '${migrationId}'" -h -1`,
        { encoding: 'utf-8' }
      ).trim();
      
      expect(historyCheck).not.toBe('NULL');
      
    } catch (error: any) {
      console.error('Rollback execution failed:', error.message);
      throw error;
    }
  });
});
```

---

## Orchestration Script Examples

### PowerShell Orchestration (Dotnet Pattern)

```powershell
# Start app in background
Start-Job -ScriptBlock {
    cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'
    dotnet run
} | Out-Null

# Wait for app startup
Start-Sleep -Seconds 15

try {
    # Run Playwright tests
    cd 'D:\PROJECTS\NOOR CANVAS\Tests\UI'
    npx playwright test {test-file}.spec.ts --headed
}
finally {
    # Cleanup: Stop background job
    Stop-Job -Name Job1 -ErrorAction SilentlyContinue
    Remove-Job -Name Job1 -ErrorAction SilentlyContinue
}
```

### Bash Orchestration Example

```bash
@workspace /test key=my-feature -test scenario="user-login"
@workspace /test key=ui-refresh -test
```

---

## Validation Report Example

```markdown
📊 Test Generation Validation Report

Quality Score: 90/100 (Excellent)

✅ Critical: 0 violations
✅ High: 0 issues
📋 Medium: 1 missed requirement
  - Percy snapshots not included for UI component test

What would you like to do next?
A. Accept tests (quality excellent)
B. Add Percy snapshots for visual regression
```

---

## Related Files
- **Consumer:** `.github/prompts/test-generation.prompt.md`
- **Protocol:** `.github/prompts/shared/kds-handoff-protocol.md`
- **Governance:** `.github/governance/kds-rulebook.json`
