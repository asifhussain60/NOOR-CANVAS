# Task Prompt Quick Reference - Updated Workflow

## Quick Start

```bash
# Execute task with all new features
@workspace /task key=canvas tasks="Add share button but do NOT remove save button"

# The agent will now:
# 1. Detect HIGH-PRIORITY constraint: "do NOT remove save button"
# 2. Record your request in key data stream
# 3. Execute work
# 4. Run mandatory lint validation (BLOCKS commit if failures)
# 5. Verify constraint: save button still exists
# 6. Generate tests in .github/prompts.keys/canvas/tests/
# 7. Commit only if ALL validations pass
```

---

## New Validation Gates

### 1. Lint Validation (Step 6.2) - MANDATORY
**Runs BEFORE commit on ALL modified files**

| File Type | Linter | Auto-Fix | Command |
|-----------|--------|----------|---------|
| C# | Roslynator | Yes | `dotnet build /p:RunAnalyzers=true` |
| JS/TS | ESLint | Yes | `npm run lint -- --fix` |
| CSS | Stylelint | Yes | `npm run lint:css:fix` |
| PowerShell | PSScriptAnalyzer | No | `Invoke-ScriptAnalyzer` |
| JSON | Built-in | No | `ConvertFrom-Json` |

**Manual execution:**
```powershell
.\Scripts\run-lint-validation.ps1 -AutoFix
```

### 2. High-Priority Constraints (Step 6.3) - AUTOMATIC
**Triggered by ALL CAPS in user request**

| Pattern | Category | Verification |
|---------|----------|--------------|
| `do NOT remove X` | Preservation | DOM query, visual inspection |
| `EXACTLY match Y` | Exactness | Percy visual test, CSS check |
| `MUST include Z` | Mandatory | Code inspection, E2E test |
| `MAINTAIN behavior` | Behavioral | Functional tests |

**Violation = Automatic rollback to checkpoint**

---

## Test Generation Changes

### OLD (Before)
```
Tests created in: Workspaces/TEMP/
Scripts created in: Scripts/
Manual cleanup required
```

### NEW (Now)
```
Tests created in: .github/prompts.keys/{key}/tests/
Scripts created in: .github/prompts.keys/{key}/scripts/
Test registry: .github/prompts.keys/{key}/tests/test-registry.md
Auto-cleanup: Tests deleted after promotion to Tests/UI/
```

**Benefits:**
- ✅ All key context in one directory
- ✅ Test registry prevents duplication
- ✅ Auto-cleanup prevents bloat
- ✅ Clear promotion workflow

**Example directory:**
```
.github/prompts.keys/canvas/
├── canvas.md (key data stream)
├── tests/
│   ├── test-registry.md
│   ├── share-button-functional.spec.ts
│   └── share-button-visual.spec.ts
└── scripts/
    └── run-share-button-test.ps1
```

**Run tests:**
```powershell
.\.github\prompts.keys\canvas\scripts\run-share-button-test.ps1
```

---

## Key Data Stream Format Changes

### User Request Section (NEW - Step 2.2.1)
```markdown
### User Request (2025-10-18T12:00:00Z)
Add share button but preserve existing save button

**High-Priority Constraints:**
- do NOT remove existing save button
```

### Work Completed Section (ENHANCED - Step 8.2)
```markdown
### Work Completed (2025-10-18T12:30:00Z)
- **Changes**: Added ShareButton.razor component
- **Files Affected**: 3 files
- **Lint Validation**: PASS (C#: 3 files, JS: 0 files, CSS: 1 file)
- **High-Priority Constraints Verified**:
  - [PASS] Save button preserved (DOM query successful)
- **Tests**: 2 tests created (functional + visual)
- **Commit**: a3f5b9c1234
```

---

## Completion Workflow (Step 9)

### What Happens When You Run `tasks: mark complete`

```
Step 9.1: Debug Cleanup
├─→ Remove debug markers from source files
├─→ Verify zero markers remain
└─→ Clean build check

Step 9.2: Test Promotion (NEW)
├─→ Copy tests from .github/prompts.keys/{key}/tests/ → Tests/UI/
├─→ Update orchestration script paths
├─→ Copy scripts from .github/prompts.keys/{key}/scripts/ → Scripts/
├─→ Archive test registry entries
└─→ Delete tests from key directory (cleanup)

Step 9.3: State Management
├─→ Mark key as "complete"
├─→ Archive work log
└─→ Update key index
```

**Output:**
```
[COMPLETE] Key marked as COMPLETE
[CLEANUP] Debug markers removed (5 markers from 3 files)
[TESTS] Tests promoted to production (2 tests)
```

---

## Common Workflows

### 1. Simple Task (No Tests)
```
User: "Fix button alignment in SessionCanvas"

Agent:
├─→ Records user request
├─→ Fixes alignment
├─→ Runs lint validation
├─→ Commits (no tests needed for CSS-only change)
└─→ Updates key data stream
```

### 2. Task with HIGH-PRIORITY Constraint
```
User: "Add delete button but do NOT remove the edit button"

Agent:
├─→ Detects constraint: "do NOT remove edit button"
├─→ Records in key data stream
├─→ Adds delete button
├─→ Runs lint validation
├─→ Verifies edit button still exists (Step 6.3)
├─→ Commits only if constraint verified
└─→ Updates key data stream with verification results
```

### 3. Task with Test Generation
```
User: "Add share feature with confirmation dialog"

Agent:
├─→ Records user request
├─→ Implements share feature
├─→ Generates tests in .github/prompts.keys/{key}/tests/
├─→ Creates orchestration script
├─→ Updates test registry
├─→ Runs lint validation
├─→ Commits
└─→ Documents test paths in key data stream
```

### 4. Task Completion
```
User: tasks="mark complete"

Agent:
├─→ Cleans debug markers
├─→ Promotes tests to Tests/UI/
├─→ Deletes tests from key directory
├─→ Marks key as complete
└─→ Archives work log
```

---

## Error Handling

### Lint Failure
```
[LINT FAIL] JS/TS Files: ESLint errors
  Line 42: 'participant' is not defined

Actions:
1. Attempt auto-fix: npm run lint -- --fix
2. Re-validate
3. If still failing → Request user intervention
4. NEVER commit with lint failures
```

### Constraint Violation
```
[CONSTRAINT VIOLATION]
User requested: do NOT remove save button
Current state: Save button missing

Actions:
1. HALT execution immediately
2. Rollback to checkpoint
3. Notify user with violation details
4. Return to Step 3 (re-plan with constraint awareness)
```

### Test Duplication
```
[TEST REGISTRY] Duplicate test detected
Existing: share-button-functional.spec.ts
Action: Update existing test instead of creating new one
```

---

## Installation Requirements

### Linters
```powershell
# ESLint (JavaScript/TypeScript)
npm install --save-dev eslint @typescript-eslint/parser

# Stylelint (CSS)
npm install --save-dev stylelint stylelint-config-standard

# PSScriptAnalyzer (PowerShell)
Install-Module -Name PSScriptAnalyzer -Scope CurrentUser -Force

# Roslynator (C#)
# Already configured via Directory.Build.props
```

### Configuration Files
- ESLint: `config/testing/eslint.config.js` ✅ (exists)
- Stylelint: `.stylelintrc.json` ✅ (exists)
- Roslynator: `Directory.Build.props` ✅ (exists)

---

## Best Practices

### 1. Use ALL CAPS for Constraints
```
✅ Good: "Add feature but do NOT remove existing X"
❌ Bad: "Add feature but don't remove existing X" (not detected)
```

### 2. Run Lint Validation Manually
```powershell
# Before committing manually
.\Scripts\run-lint-validation.ps1 -AutoFix
```

### 3. Check Test Registry Before Creating Tests
```markdown
# Look for existing tests in:
.github/prompts.keys/{key}/tests/test-registry.md
```

### 4. Use Completion Workflow
```
# When work is done, run:
@workspace /task key=canvas tasks="mark complete"

# This will:
# - Clean debug markers
# - Promote tests
# - Mark key complete
```

---

## Troubleshooting

### Q: Lint validation failing?
```powershell
# Check which linter is failing
.\Scripts\run-lint-validation.ps1

# Try auto-fix
.\Scripts\run-lint-validation.ps1 -AutoFix

# Install missing linters (see Installation Requirements above)
```

### Q: Constraint not detected?
```
# Ensure ALL CAPS usage:
✅ "do NOT remove"
❌ "do not remove"

# Supported patterns:
- NOT, NEVER, ALWAYS, MUST, EXACTLY, PRESERVE, MAINTAIN, KEEP
```

### Q: Tests in wrong location?
```
# Tests should be in:
.github/prompts.keys/{key}/tests/

# NOT in:
Workspaces/TEMP/ (old location)

# Update test-generation.prompt.md if using old version
```

### Q: Where are my promoted tests?
```
# After completion workflow:
Production: Tests/UI/{feature}-{test-type}.spec.ts
Scripts: Scripts/run-{feature}-test.ps1
Registry: .github/prompts.keys/{key}/tests/test-registry.md (archived section)
```

---

## Quick Reference Card

| Step | What | When | Blocks Commit |
|------|------|------|---------------|
| 2.1.5 | Constraint Detection | Always (if ALL CAPS) | No |
| 2.2.1 | Record User Request | Always | No |
| 6.1 | Test Generation | If UI changes | No |
| 6.2 | Lint Validation | Always | YES |
| 6.3 | Constraint Verification | If constraints detected | YES |
| 9.2 | Test Promotion | When `mark complete` | No |

**Critical Gates:**
- Lint validation MUST pass before commit
- Constraint verification MUST pass before commit
- Constraint violation triggers automatic rollback

---

End of Quick Reference
