# Test Registry: workspace-cleanup

**Plan**: workspace-cleanup v1.0  
**Created**: 2025-10-26  
**Purpose**: Validation tests for workspace cleanup operations

---

## Test Categories

### 1. Pre-Cleanup Validation Tests
**Purpose**: Ensure workspace is in valid state before cleanup

| Test ID | Test Name | Type | Status | Description |
|---------|-----------|------|--------|-------------|
| PRE-001 | Git Status Clean | Manual | ⏳ | Verify no uncommitted critical changes |
| PRE-002 | Build Success | Automated | ⏳ | Verify solution builds successfully |
| PRE-003 | No Running Processes | Automated | ⏳ | Check for locked files/processes |

### 2. Cleanup Operation Tests
**Purpose**: Verify cleanup operations work correctly

| Test ID | Test Name | Type | Status | Description |
|---------|-----------|------|--------|-------------|
| CLN-001 | Build Artifacts Deletion | Automated | ⏳ | Verify bin/obj/. vs deleted |
| CLN-002 | Test Results Handling | Automated | ⏳ | Verify test results cleaned per mode |
| CLN-003 | Log File Age Filter | Automated | ⏳ | Verify only old logs deleted |
| CLN-004 | Temp File Detection | Automated | ⏳ | Verify all temp file patterns found |
| CLN-005 | Dry Run Accuracy | Automated | ⏳ | Verify dry run matches actual cleanup |

### 3. Documentation Reorganization Tests
**Purpose**: Verify documentation files properly reorganized

| Test ID | Test Name | Type | Status | Description |
|---------|-----------|------|--------|-------------|
| DOC-001 | Category Classification | Automated | ⏳ | Verify docs moved to correct categories |
| DOC-002 | Link Preservation | Manual | ⏳ | Check internal doc links still work |
| DOC-003 | Index Generation | Automated | ⏳ | Verify index.md created in each folder |
| DOC-004 | No Orphaned Files | Automated | ⏳ | Verify all docs accounted for |

### 4. .github Folder Tests
**Purpose**: Verify .github folder maintains standards

| Test ID | Test Name | Type | Status | Description |
|---------|-----------|------|--------|-------------|
| GIT-001 | Completed Plans Archived | Automated | ⏳ | Verify completed plans moved to Archive |
| GIT-002 | Required Files Present | Automated | ⏳ | Verify plan.md, plan.json, work-log.md exist |
| GIT-003 | No Loose Files | Automated | ⏳ | Verify no files in .github root |
| GIT-004 | Structure Compliance | Automated | ⏳ | Verify folder structure matches standards |

### 5. Post-Cleanup Validation Tests
**Purpose**: Ensure workspace functional after cleanup

| Test ID | Test Name | Type | Status | Description |
|---------|-----------|------|--------|-------------|
| PST-001 | Build Success | Automated | ⏳ | Verify solution still builds |
| PST-002 | Application Launch | Manual | ⏳ | Verify app starts successfully |
| PST-003 | Space Reclaimed | Automated | ⏳ | Verify expected space freed |
| PST-004 | No Broken References | Automated | ⏳ | Check for missing file references |
| PST-005 | Git Status Unchanged | Automated | ⏳ | Verify no unintended git changes |

### 6. Rollback Tests
**Purpose**: Verify ability to restore if needed

| Test ID | Test Name | Type | Status | Description |
|---------|-----------|------|--------|-------------|
| RBK-001 | Manifest Creation | Automated | ⏳ | Verify deletion manifest created |
| RBK-002 | Git Restore | Manual | ⏳ | Test restoring files from git |
| RBK-003 | Backup Integrity | Automated | ⏳ | Verify backup zip if created |

---

## Test Execution Plan

### Phase 1: Pre-Cleanup (Before execute-plan.ps1)
1. Run PRE-001: Check git status
2. Run PRE-002: Build solution
3. Run PRE-003: Check for running processes

**Success Criteria**: All PRE tests pass

### Phase 2: Dry Run Validation
1. Execute: `.\execute-plan.ps1 -DryRun -Mode default`
2. Verify CLN-005: Dry run output matches expectations
3. Review generated report

**Success Criteria**: Dry run completes without errors

### Phase 3: Actual Cleanup (Default Mode)
1. Execute: `.\execute-plan.ps1 -Mode default`
2. Run CLN-001 through CLN-004 during execution
3. Run DOC-001 through DOC-004 after doc phase
4. Run GIT-001 through GIT-004 after .github phase

**Success Criteria**: All cleanup operations succeed

### Phase 4: Post-Cleanup Validation
1. Run PST-001: Build solution
2. Run PST-002: Launch application
3. Run PST-003: Verify space reclaimed
4. Run PST-004: Check for broken references
5. Run PST-005: Verify git status

**Success Criteria**: All PST tests pass

### Phase 5: Aggressive Mode Testing (Optional)
1. Restore workspace to pre-cleanup state (git)
2. Execute: `.\execute-plan.ps1 -Mode aggressive -DryRun`
3. Review differences from default mode
4. Execute actual aggressive cleanup if desired

**Success Criteria**: Aggressive mode completes successfully

---

## Test Implementation

### Automated Test Script Location
`tests/validate-cleanup.ps1`

### Manual Test Checklist Location
`tests/manual-validation-checklist.md`

### Test Data
- Sample workspace snapshot for testing
- Known file counts for validation
- Expected space reclamation estimates

---

## Success Criteria Summary

**Cleanup Considered Successful If:**
- ✅ All build artifacts removed
- ✅ Test results handled per mode configuration
- ✅ Appropriate log files deleted
- ✅ Documentation properly reorganized
- ✅ .github folder meets standards
- ✅ Solution still builds
- ✅ Application still runs
- ✅ Space reclaimed >= 100MB (default) or >= 500MB (aggressive)
- ✅ No broken file references
- ✅ Git working directory clean

---

## Test Status Legend
- ⏳ Pending
- 🏃 In Progress
- ✅ Passed
- ❌ Failed
- ⚠️ Warning
- ⏭️ Skipped
