# Auto-Drift Detection Protocol

**Purpose**: Automatically detect and register unrelated issues discovered during test generation.

**When to Load**: Active throughout test generation process (Steps 0-8).

**Integration Point**: Called by test-generation.prompt.md when infrastructure issues, test failures, or inconsistencies detected.

---

## Detection Triggers

### Test Infrastructure Analysis
- Missing test dependencies (Playwright packages, config issues)
- Test framework configuration errors (playwright.config.ts)
- Percy integration issues (API key, snapshot setup)
- Broken test utilities or fixtures

### Test Execution Phase
- Unexpected test failures in unrelated test suites
- Server startup issues during orchestration
- Browser automation errors (timeout/selector issues)
- Visual regression failures outside current scope

### Test Review
- Duplicate test scenarios (overlap with existing tests)
- Inconsistent selector patterns (not following canonical rules)
- Missing accessibility validations
- Performance issues in test execution

---

## Auto-Registration Algorithm

```
FUNCTION TestGenerationDetectDrift(currentKey, issue, phase, severity)
  
  // Check if issue relates to current test generation work
  IF IsRelatedToCurrentTests(issue, currentKey) THEN
    RETURN "NOT_DRIFT"  // Fix as part of current work
  END IF
  
  // For infrastructure issues, may need immediate attention
  IF severity == "critical" AND phase == "test-infrastructure" THEN
    HALT_GENERATION()
    PRESENT_USER_CHOICE(
      options: [
        "Fix infrastructure now (pause test generation)",
        "Generate tests anyway (may fail)",
        "Abort generation (rollback)"
      ]
    )
    AWAIT_USER_DECISION()
  END IF
  
  // For non-critical issues, register silently
  driftKey = GenerateDriftKey(issue)
  
  RegisterDrift(
    parentKey: currentKey,
    driftKey: driftKey,
    description: issue,
    severity: severity,
    mode: "auto",
    triggeredBy: "test-generation.prompt.md",
    phase: phase  // "test-infrastructure" | "test-execution" | "test-review"
  )
  
  LogToWorkLog("🔍 Test drift detected: {driftKey} (severity: {severity}, phase: {phase})")
  CONTINUE_TEST_GENERATION()
  
END FUNCTION
```

---

## Critical Infrastructure Blocking

When `severity=critical` AND `phase=test-infrastructure`, execution **HALTS**.

### Presentation Format

```
⚠️ CRITICAL TEST INFRASTRUCTURE ISSUE

Issue: {description}
Severity: CRITICAL
Phase: Test Infrastructure Setup

Generated tests may fail without fixing this. Choose one:
1️⃣ Fix infrastructure now (pause test generation)
2️⃣ Generate tests anyway (may fail during execution)
3️⃣ Abort generation (rollback to checkpoint)

Your choice (1/2/3):
```

### User Choice Handling

- **Fix now**: Register drift with `mode: "user-critical"`, pause generation, fix infrastructure, resume
- **Generate anyway**: Register drift with `mode: "auto-deferred"`, add warning comment in orchestration script
- **Abort**: Rollback, present infrastructure issue as standalone work

---

## Severity Classification

| Severity | Description | Examples | Blocking? |
|----------|-------------|----------|-----------|
| **critical** | Missing infrastructure, broken config, server won't start | Missing Playwright packages, broken playwright.config.ts | **YES** (test-infrastructure phase) |
| **high** | Failing existing tests, broken utilities, Percy misconfigured | Existing test suite fails, Percy API key invalid | NO (register drift) |
| **medium** | Duplicate tests, selector inconsistencies, missing validations | Test overlaps with existing, non-canonical selectors | NO (register drift) |
| **low** | Documentation gaps, formatting issues | Missing test comments, inconsistent indentation | NO (register drift) |
| **informational** | Performance observations, optimization suggestions | Slow test execution, test could be parallelized | NO (log only) |

---

## Drift Commit Format

When registering drift via `RegisterDrift()`, use this commit message format:

```
drift({parent-key}): auto-detected {severity} issue in {phase}

Triggered by: test-generation.prompt.md
Parent Key: {parent-key}
Drift Key: {drift-key}
Severity: {severity}
Phase: {phase}

Issue: {description}

Auto-registered via drift detection protocol.
```

**Example**:
```
drift(canvas): auto-detected high issue in test-execution

Triggered by: test-generation.prompt.md
Parent Key: canvas
Drift Key: percy-api-key-invalid
Severity: high
Phase: test-infrastructure

Issue: Percy API key environment variable not set. Visual regression tests will fail.

Auto-registered via drift detection protocol.
```

---

## IsRelatedToCurrentTests() Logic

**Purpose**: Determine if an issue is part of current test work or unrelated drift.

```
FUNCTION IsRelatedToCurrentTests(issue, currentKey) -> boolean
  
  // Check if issue affects test being generated
  IF issue.affects == "current-test-file" THEN
    RETURN true  // Fix as part of current work
  END IF
  
  // Check if issue is in current key's test directory
  IF issue.location.startsWith(".github/key-data-streams/{currentKey}/tests/") THEN
    RETURN true  // Fix as part of current work
  END IF
  
  // Check if issue is in current test's dependencies
  IF issue.component IN ["current-test-fixtures", "current-test-utils"] THEN
    RETURN true  // Fix as part of current work
  END IF
  
  // Otherwise, it's drift
  RETURN false  // Register as drift
  
END FUNCTION
```

**Examples**:

| Issue | Current Key | Related? | Reason |
|-------|-------------|----------|--------|
| Missing `data-testid` in new test | canvas | ✅ Yes | Part of current test being generated |
| Existing `Tests/UI/share-button.spec.ts` fails | canvas | ❌ No | Unrelated test suite |
| Playwright config missing `baseURL` | canvas | ❌ No | Infrastructure issue (unless critical) |
| Test registry duplicate detected | canvas | ✅ Yes | Part of duplicate detection process |
| Percy snapshot mismatch in old test | canvas | ❌ No | Existing test, not current work |

---

## GenerateDriftKey() Logic

**Purpose**: Create unique, descriptive drift key from issue description.

```
FUNCTION GenerateDriftKey(issue) -> string
  
  // Extract key components from issue
  component = ExtractComponent(issue)  // e.g., "percy", "playwright", "test-registry"
  action = ExtractAction(issue)        // e.g., "missing", "invalid", "broken"
  
  // Generate kebab-case key
  driftKey = "{component}-{action}"
  
  // Ensure uniqueness by appending counter if needed
  IF KeyExists(driftKey) THEN
    counter = 1
    WHILE KeyExists("{driftKey}-{counter}") DO
      counter = counter + 1
    END WHILE
    driftKey = "{driftKey}-{counter}"
  END IF
  
  RETURN driftKey
  
END FUNCTION
```

**Example Drift Keys**:
- `percy-api-key-missing`
- `playwright-config-broken`
- `test-registry-duplicate-detected`
- `selector-pattern-inconsistent`
- `accessibility-validation-missing`

---

## Integration with Orchestration Scripts

When drift is detected and `mode: "auto-deferred"` (user chose "Generate anyway"), add warning comment to orchestration script:

```powershell
# ⚠️ KNOWN ISSUE: {drift-key}
# Severity: {severity}
# {description}
# Registered in: .github/key-data-streams/{parent-key}/work-log.md
# Fix this before relying on test results.
```

**Example**:
```powershell
# ⚠️ KNOWN ISSUE: percy-api-key-missing
# Severity: high
# Percy API key environment variable not set. Visual regression tests will fail.
# Registered in: .github/key-data-streams/canvas/work-log.md
# Fix this before relying on test results.

Write-Host "🚀 Starting Noor Canvas application..."
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
Start-Process -NoNewWindow -FilePath "dotnet" -ArgumentList "run"
```

---

## Phase Mapping

| Phase | When Detected | Examples |
|-------|---------------|----------|
| **test-infrastructure** | During environment setup (Step 0, 0.1) | Missing packages, broken config, server won't start |
| **test-execution** | During test run (Step 7, 8) | Unexpected failures, browser errors, timeout issues |
| **test-review** | During test analysis (Step 3-6) | Duplicate tests, selector inconsistencies, missing validations |

---

## WorkLog Integration

All detected drift is logged to `.github/key-data-streams/{parent-key}/work-log.md`:

```markdown
## 🔍 Auto-Detected Drift: {drift-key}

- **Detected**: {ISO-8601-timestamp}
- **Triggered By**: test-generation.prompt.md
- **Severity**: {severity}
- **Phase**: {phase}
- **Issue**: {description}
- **User Action**: {Fix now | Generate anyway | Abort} (if prompted)
- **Status**: Registered | Resolved

---
```

---

## Reference

- See validation-protocol.md for pre-generation validation (Step 0, 0.1)
- See test-registry-protocol.md for duplicate detection
- See test-generation.prompt.md for main execution flow
- See drift-key.prompt.md for drift registration mechanics
