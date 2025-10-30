# Test Registry Automatic Update System

## Overview
The global test registry (`.github/tests/test-index.json`) is **automatically updated** when:
1. New tests are created
2. Test orchestration scripts are run
3. Manual rebuild is triggered

## Automatic Update Mechanisms

### 1. Post-Test Creation Hook
**File**: `.github/hooks/post-test-creation.ps1`

**When it runs**:
- Called automatically by test orchestration scripts
- Can be manually invoked after creating new tests
- Runs silently during normal development workflow

**What it does**:
- Executes `rebuild-test-index.ps1`
- Updates `test-index.json` with new test metadata
- Auto-stages `test-index.json` for git commit

**Usage**:
```powershell
# Manual invocation
.\.github\hooks\post-test-creation.ps1

# Silent mode (used by orchestration scripts)
.\.github\hooks\post-test-creation.ps1 -Silent
```

### 2. Test Orchestration Template
**File**: `.github/templates/test-orchestration-template.ps1`

**Integration**:
All new test orchestration scripts should use this template. It automatically:
- Updates test registry before running tests
- Ensures registry is current with latest test files
- Handles cleanup and error cases

**Create new orchestration script**:
```powershell
# Copy template
Copy-Item .github/templates/test-orchestration-template.ps1 `
    Scripts/run-my-new-test.ps1

# Edit the copied file:
# 1. Update SYNOPSIS/DESCRIPTION
# 2. Replace [test-name] with actual test filename
# 3. Add any custom configuration
```

### 3. Manual Rebuild
**File**: `.github/scripts/rebuild-test-index.ps1`

**When to use**:
- After creating multiple tests
- When registry seems out of sync
- Before committing test changes

**Usage**:
```powershell
# Full rebuild
.\.github\scripts\rebuild-test-index.ps1
```

## Agent Integration

### Plan Agent
When planning new test creation:
```
Step 2.5: Query test-index.json for existing tests
Step [N]: Create test orchestration script using template
Step [N+1]: Test registry will auto-update on first run
```

### Todo Agent
When creating new tests:
```
1. Create test file (*.spec.ts)
2. Copy orchestration template
3. Customize orchestration script
4. Run test (registry updates automatically)
5. Verify test appears in test-index.json
```

### Drift Agent
When detecting test drift:
```
Scenario: Orphaned Test
- Detection: Test exists but no orchestration script
- Remediation: Create orchestration script from template
- Auto-update: Registry updates on first run
```

## Commit Workflow

The test registry updates are **automatically staged** but require manual commit:

```powershell
# 1. Create new test
New-Item Tests/UI/my-feature.spec.ts

# 2. Create orchestration script
Copy-Item .github/templates/test-orchestration-template.ps1 `
    Scripts/run-my-feature.ps1

# 3. Run test (auto-updates registry)
.\Scripts\run-my-feature.ps1

# 4. Commit everything together
git add Tests/UI/my-feature.spec.ts
git add Scripts/run-my-feature.ps1
# test-index.json is already staged!
git commit -m "feat(test): Add my-feature test"
```

## Registry File Structure

**Location**: `.github/tests/test-index.json`

**Auto-updated fields**:
- `metadata.lastUpdated` - Timestamp of last rebuild
- `metadata.totalTests` - Count of all tests
- `metadata.reusableTests` - Count with orchestration
- `tests[]` - Array of all test entries

**Manual update fields** (requires human input):
- `tests[].key` - Associated work item key
- `tests[].scenarios` - Test scenario descriptions

## Benefits

✅ **Always Current** - Registry updates whenever tests are created/run
✅ **Zero Overhead** - Happens automatically, no manual maintenance
✅ **Git Friendly** - Auto-staged for easy commits
✅ **Agent Aware** - Plan/todo/drift agents can rely on current data
✅ **Template Based** - Consistent orchestration scripts include auto-update

## Troubleshooting

### Registry not updating
```powershell
# Verify hook exists
Test-Path .github/hooks/post-test-creation.ps1

# Manual rebuild
.\.github\scripts\rebuild-test-index.ps1
```

### Test not appearing in registry
```powershell
# Check test file location (must be in Tests/UI/)
Get-ChildItem Tests/UI/*.spec.ts

# Rebuild registry
.\.github\scripts\rebuild-test-index.ps1
```

### Orchestration script not found
```powershell
# Registry looks for matching filenames:
# Tests/UI/my-feature.spec.ts -> Scripts/run-my-feature.ps1
# Or: .github/key-data-streams/*/scripts/run-*.ps1
```

## Next Steps

1. **Update existing orchestration scripts** to use template pattern
2. **Document in agent prompts** (plan.prompt.md, todo.prompt.md, drift.prompt.md)
3. **Backfill test metadata** for existing 64 tests (key fields, scenarios)
4. **Add pre-commit hook** to validate registry is current (optional)
