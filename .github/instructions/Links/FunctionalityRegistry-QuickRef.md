# Functionality Registry Quick Reference

## For Task Agent (task.prompt.md Step 8.2)

### Quick Validation Workflow

```
┌─────────────────────────────────────────┐
│ Step 8.2: Functionality Registry Check │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 1. Load {key}.md → Parse Registry       │
│    - Core Behaviors list                │
│    - File Watch list                    │
│    - Test Coverage info                 │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 2. Compare Modified Files vs File Watch│
│    - IF match → Regression risk HIGH    │
│    - IF no match → Risk LOW (skip)      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 3. Execute Validation                   │
│    - Automated: Run tests               │
│    - Manual: Prompt user checklist      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 4. Handle Result                        │
│    - PASS → Update Last Validation      │
│    - FAIL → BLOCK COMMIT + Log          │
└─────────────────────────────────────────┘
```

---

## User Output Templates

### Registry Exists + File Watch Match → Validation PASS
```
✅ Functionality Validation: PASS
- Core behaviors: 5 verified
- Tests executed: 3 manual validations
- Registry updated (Last Validation: 2025-01-11 14:23:45)
```

### Registry Exists + File Watch Match → Validation FAIL
```
❌ Functionality Validation: FAIL
- Failed behaviors: Valid Token Flow
- Test failures: User saw token panel flash
- COMMIT BLOCKED - fix regression before proceeding

Regression logged to: Workspaces/Copilot/prompts.keys/user-auth/user-auth.md
```

### Registry Exists + No File Watch Match
```
✓ No file/method watch matches - low regression risk
- Modified files: 2
- Watched files: 3 (no overlap)
- Validation: SKIPPED (optional)
```

### No Registry Exists
```
ℹ️ No Functionality Registry found for key 'user-auth'
Consider adding one to track core behaviors and prevent regressions.

Template: Workspaces/Copilot/prompts.keys/_template/key-template.md
Guide: .github/instructions/Links/FunctionalityRegistry.md
```

---

## Manual Validation Prompt Template

```
⚠️ REGRESSION RISK: Manual Validation Required

Modified File: UserLanding.razor (File Watch match)
Affected Behaviors: 3 core behaviors

Please verify the following still work:

□ Valid Token Flow
  Navigate to: https://localhost:9091/session/canvas/KJAHA99L
  Expected: Registration panel appears immediately (no flash)
  
□ Invalid Token Handling  
  Navigate to: https://localhost:9091/session/canvas/INVALID
  Expected: Token panel shows with error message
  
□ Missing Token Default
  Navigate to: https://localhost:9091/user/landing
  Expected: Token entry panel displays

Confirm all behaviors work correctly? (yes/no)
```

---

## Automated Test Execution Template

```bash
# Playwright E2E Tests
npm test -- Tests/UI/user-auth-flow.spec.ts

# .NET Unit Tests (if applicable)
dotnet test --filter "FullyQualifiedName~UserLandingTests"

# Parse Results:
# - All green → PASS
# - Any red → FAIL (block commit)
```

---

## Registry Update Template (After Validation)

```markdown
### Last Validation
- **Date**: 2025-01-11 14:23:45
- **Method**: manual | automated | hybrid
- **Result**: PASS
- **Commit**: e06cafb304417286c47c24a95823478df2dddbed
- **Notes**: All 5 core behaviors verified via manual testing
```

---

## Regression History Update Template (If Failure)

```markdown
### Regression History
- 2025-01-11 14:23:45: Regression detected in "Valid Token Flow" (commit: abc1234) - Token panel flash reappeared, investigation in progress
```

**When Fixed:**
```markdown
### Regression History
- 2025-01-11 14:23:45: Regression detected in "Valid Token Flow" (commit: abc1234) - Fixed in commit def5678 (added missing hasToken check)
```

---

## Decision Tree

```
Is there a Functionality Registry in {key}.md?
├─ NO → Log "No registry found", suggest adding one, SKIP validation
└─ YES
    ├─ Do modified files match File Watch?
    │   ├─ NO → Log "Low regression risk", SKIP validation
    │   └─ YES → TRIGGER VALIDATION
    │       ├─ Automated tests available?
    │       │   ├─ YES → Run tests
    │       │   │   ├─ PASS → Update Last Validation, ALLOW COMMIT
    │       │   │   └─ FAIL → Log regression, BLOCK COMMIT
    │       │   └─ NO → Prompt manual validation
    │       │       ├─ User says YES → Update Last Validation (manual), ALLOW COMMIT
    │       │       └─ User says NO → Log regression, BLOCK COMMIT
```

---

## Key Metadata Sections to Parse

### Core Behaviors
```markdown
### Core Behaviors (Must Always Work)
- ✅ **Behavior 1**: Description
- ✅ **Behavior 2**: Description
```
**Parse**: Extract all ✅ bullet points as behaviors to validate

### File Watch
```markdown
### Breaking Change Detection
- **File Watch**:
  - `Path/To/File1.cs` - Description
  - `Path/To/File2.razor` - Description
```
**Parse**: Extract file paths, compare with modified files from Step 5

### Test Coverage
```markdown
### Related Test Coverage
- **Automated Tests**:
  - `Tests/UI/test-file.spec.ts` - Description
- **Manual Validation**:
  - Step 1: Do X
  - Step 2: Verify Y
```
**Parse**: Determine if automated tests exist, extract manual steps if needed

---

## Error Handling

### Registry File Not Found
```
if (!File.Exists($"Workspaces/Copilot/prompts.keys/{key}/{key}.md")) {
  Log("No registry found - validation skipped");
  return;
}
```

### Registry Exists but Malformed
```
if (!registry.Contains("## Functionality Registry")) {
  Log("Registry section missing - validation skipped");
  Suggest("Add registry using template");
  return;
}
```

### Test Execution Fails
```
try {
  RunTests("npm test -- Tests/UI/test.spec.ts");
} catch (Exception ex) {
  Log("Test execution failed: " + ex.Message);
  FallbackToManualValidation();
}
```

---

## Integration Points

### Called From: task.prompt.md Step 8
After Step 8.1 (Key Data Stream Update), before git commit

### Calls:
- `read_file` - Load {key}.md registry
- `run_in_terminal` - Execute automated tests (if available)
- User prompt - Manual validation checklist
- `replace_string_in_file` - Update Last Validation in registry

### Outputs:
- Validation status (PASS/FAIL)
- Registry updates (Last Validation, Regression History)
- User notifications (brief, concise)

---

## Performance Considerations

**Skip validation when**:
- No Functionality Registry exists (log suggestion to add one)
- No File Watch matches (low regression risk)
- User provides `--skip-validation` flag (NOT RECOMMENDED)

**Execute validation when**:
- File Watch matches modified files (HIGH regression risk)
- Method Watch matches modified methods
- User explicitly requests validation

**Estimated time**:
- Registry parsing: < 1 second
- File Watch comparison: < 1 second
- Automated test execution: 10-60 seconds (depends on test suite)
- Manual validation: User-dependent (30-120 seconds)

---

## Summary

**Purpose**: Prevent regressions by validating core behaviors when critical files change.

**Trigger**: Step 8.2 in task.prompt.md (after execution, before commit)

**Workflow**: Load Registry → Detect Risk → Validate → Update → Allow/Block Commit

**Output**: Concise user notifications, detailed registry updates

**Integration**: Seamless addition to existing task workflow (no breaking changes)

---

## Related Documentation

- [FunctionalityRegistry.md](FunctionalityRegistry.md) - Full registry schema and examples
- [InfrastructureQuickRef.md](InfrastructureQuickRef.md) - Session 212 test data, API endpoints
- [ValidationFramework.md](ValidationFramework.md) - 6-level validation pipeline
- [API-Contract-Validation.md](API-Contract-Validation.md) - API contract safety rules
- [PlaywrightTestPaths.MD](PlaywrightTestPaths.MD) - E2E test patterns

---

**Last Updated**: 2025-01-11  
**Version**: 1.1.0