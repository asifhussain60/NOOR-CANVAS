# Responsibility Matrix - Cleanup Prompt Consolidation Analysis

**Created:** 2025-10-30  
**Purpose:** Map responsibilities across cleanup-copilot-mess, cleanup.prompt, and cohesion.prompt.md to identify consolidation opportunities

---

## Executive Summary

**Current State:**
- **3 prompts** with overlapping cleanup/validation responsibilities
- **2 auto-invocation points** (plan.prompt.md Step 7.25, task.prompt.md Step 9.15)
- **Scope conflicts** identified in cleanup-copilot-mess v1.2.0

**Consolidation Decision:**
- ✅ Merge cleanup-copilot-mess → cohesion.prompt.md (KDS focus)
- ✅ Keep cleanup.prompt.md separate (workspace focus)
- ✅ Preserve auto-invocation from plan/task

---

## Responsibility Matrix

| Capability | cleanup-copilot-mess | cleanup.prompt.md | cohesion.prompt.md | **Target** |
|------------|---------------------|-------------------|-------------------|------------|
| **SCOPE** | `.github/` only | Workspace (Scripts/, Docs/, etc.) | `.github/` validation | - |
| **Invocation** | Auto (plan/task end) | Manual user request | Manual user request | - |
| **Approval** | Automatic (low-risk) | User approval required | Report-only | - |

### File Organization

| Task | cleanup-copilot-mess | cleanup.prompt.md | cohesion.prompt.md | **Target** |
|------|---------------------|-------------------|-------------------|------------|
| Archive deprecated prompts | ✅ `.github/prompts/shared/` | ✅ All folders | ❌ Reports only | **cohesion** (`.github/`), **cleanup** (workspace) |
| Move internal prompts | ✅ Auto-detect + move | ❌ N/A | ❌ N/A | **cohesion** |
| Reorganize misplaced docs | ✅ `.github/` to Workspaces/ | ✅ All folders | ❌ N/A | **cohesion** (`.github/`), **cleanup** (workspace) |
| Clean temporary files | ✅ `*.tmp, *.bak` in `.github/` | ✅ All folders | ❌ N/A | **cohesion** (`.github/`), **cleanup** (workspace) |
| Archive audit logs | ✅ >30 days in `.github/audits/` | ❌ N/A | ❌ N/A | **cohesion** |

### KDS Management

| Task | cleanup-copilot-mess | cleanup.prompt.md | cohesion.prompt.md | **Target** |
|------|---------------------|-------------------|-------------------|------------|
| Validate KDS structure | ✅ Required files check | ❌ N/A | ❌ N/A | **cohesion** |
| Detect orphaned keys | ✅ No plan/work-log | ❌ N/A | ❌ N/A | **cohesion** |
| Detect stale keys | ✅ >90 days no activity | ❌ N/A | ❌ N/A | **cohesion** |
| Fix missing work-log | ✅ Create from template | ❌ N/A | ❌ N/A | **cohesion** |
| Test registry validation | ✅ Orphaned tests | ❌ N/A | ❌ N/A | **cohesion** |

### Validation (Read-Only)

| Task | cleanup-copilot-mess | cleanup.prompt.md | cohesion.prompt.md | **Target** |
|------|---------------------|-------------------|-------------------|------------|
| Structural integrity | ❌ N/A | ❌ N/A | ✅ Markdown, frontmatter | **cohesion** (keep) |
| Cross-reference check | ❌ N/A | ❌ N/A | ✅ File paths, agents | **cohesion** (keep) |
| Rule compliance | ❌ N/A | ❌ N/A | ✅ MANDATORY.md, branch | **cohesion** (keep) |
| Conflict detection | ✅ Prompt overlaps (report) | ❌ N/A | ✅ Contradictions, overlaps | **cohesion** (merge both) |
| Reference updates | ✅ Deprecated refs | ✅ Move-related | ❌ Proposes fixes | **cohesion** (`.github/`), **cleanup** (workspace) |

### Auto-Fix Capabilities

| Task | cleanup-copilot-mess | cleanup.prompt.md | cohesion.prompt.md | **Target** |
|------|---------------------|-------------------|-------------------|------------|
| Archive deprecated files | ✅ Auto (with metadata) | ✅ User approval | ❌ Suggests only | **cohesion** (auto), **cleanup** (approval) |
| Fix broken references | ✅ Auto-replace deprecated | ✅ User approval | ❌ Reports only | **cohesion** (`.github/`), **cleanup** (workspace) |
| Create missing files | ✅ work-log, test-registry | ❌ N/A | ❌ N/A | **cohesion** |
| Update file paths | ✅ Internal prompt moves | ✅ Reorganization | ❌ N/A | **cohesion** (`.github/`), **cleanup** (workspace) |

---

## Overlap Analysis

### 1. Deprecated File Archiving
**Overlap:** Both cleanup-copilot-mess and cleanup.prompt archive deprecated files

**Current State:**
- cleanup-copilot-mess: `.github/` only, automatic
- cleanup.prompt: All folders, user approval

**Resolution:**
- ✅ cohesion.prompt.md: `.github/` scope, automatic (low-risk) or approval (high-risk)
- ✅ cleanup.prompt.md: Workspace scope (Scripts/, Docs/, SPA/, etc.)

**Separation Rule:** Scope-based (`.github/` vs workspace)

---

### 2. Reference Validation/Updates
**Overlap:** Both validate and update file references

**Current State:**
- cleanup-copilot-mess: Deprecated reference auto-replacement (CONCISE-MANDATE → MANDATORY)
- cleanup.prompt: Move-related reference updates
- cohesion.prompt: Cross-reference validation (reports only)

**Resolution:**
- ✅ cohesion.prompt.md: Validate `.github/` references + auto-fix deprecated refs
- ✅ cleanup.prompt.md: Update references for workspace file moves

**Separation Rule:** Scope-based + action type (validation vs move-related)

---

### 3. Conflict Detection
**Overlap:** Both detect conflicts (different types)

**Current State:**
- cleanup-copilot-mess: Prompt responsibility overlaps (reports only)
- cohesion.prompt: Rule contradictions, parameter mismatches

**Resolution:**
- ✅ cohesion.prompt.md: All conflict detection (merge both algorithms)

**Rationale:** Single prompt for all `.github/` analysis makes sense

---

### 4. Temporary File Cleanup
**Overlap:** Both clean temporary files

**Current State:**
- cleanup-copilot-mess: `*.tmp, *.bak` in `.github/`
- cleanup.prompt: All folders

**Resolution:**
- ✅ cohesion.prompt.md: `.github/` temporary files
- ✅ cleanup.prompt.md: Workspace temporary files

**Separation Rule:** Scope-based

---

## Auto-Invocation Analysis

### Current State (cleanup-copilot-mess)

**plan.prompt.md Step 7.25:**
```markdown
IF KeyStatus == "complete" AND PhaseCount >= 3 THEN
  Execute("cleanup-copilot-mess.prompt.md", {
    key: CurrentKey,
    mode: "auto",
    verbosity: "concise"
  })
END IF
```

**task.prompt.md Step 9.15:**
```markdown
IF IsFinalTask(key, phase) THEN
  cleanupResult = Execute("cleanup-copilot-mess.prompt.md", {
    key: key,
    mode: "auto",
    trigger: "task-completion"
  })
END IF
```

### Proposed State (cohesion.prompt.md)

**plan.prompt.md Step 7.25:**
```markdown
IF KeyStatus == "complete" AND PhaseCount >= 3 THEN
  Execute("cohesion.prompt.md", {
    scope: "all",
    validation-level: "kds-cleanup",
    auto-fix: true,
    key: CurrentKey,
    verbosity: "concise"
  })
END IF
```

**task.prompt.md Step 9.15:**
```markdown
IF IsFinalTask(key, phase) THEN
  cleanupResult = Execute("cohesion.prompt.md", {
    scope: "all",
    validation-level: "kds-cleanup",
    auto-fix: true,
    key: key,
    verbosity: "concise"
  })
END IF
```

**Changes Required:**
1. Update plan.prompt.md Step 7.25: `cleanup-copilot-mess` → `cohesion` with new params
2. Update task.prompt.md Step 9.15: `cleanup-copilot-mess` → `cohesion` with new params

---

## New Capabilities for cohesion.prompt.md

### 1. KDS Structure Validation (from cleanup-copilot-mess)
```
FUNCTION ValidateKDS(keyPath):
  - Check required files (plan.md, work-log.md)
  - Detect orphaned directories
  - Check staleness (>90 days)
  - Validate test registries
  RETURN violations[]
```

### 2. KDS Cleanup Execution (from cleanup-copilot-mess)
```
FUNCTION ExecuteKDSCleanup(violations[], auto-fix):
  - Archive deprecated files with metadata
  - Move internal prompts to internal/shared/
  - Clean temporary files (*.tmp, *.bak)
  - Archive audit logs (>30 days)
  - Fix orphaned tests (create/update registry)
  - Replace deprecated references
  RETURN results{}
```

### 3. New Validation Level: `kds-cleanup`
```
validation-level options:
- syntax (existing)
- cross-ref (existing)
- rules (existing)
- conflicts (existing)
- full (existing)
- kds-cleanup (NEW) - Structure validation + cleanup execution
```

### 4. Auto-Fix Mode Enhancement
```
auto-fix parameter:
- true: Execute fixes automatically (user approval for high-risk)
- false: Report only (existing behavior)

High-risk changes requiring approval:
- Deleting active prompts
- Modifying instruction files
- Archiving keys with recent activity (<30 days)
```

---

## Scope Boundaries (Final)

### cohesion.prompt.md (Enhanced)
**Scope:** `.github/` folder only
- `.github/prompts/` (validation + cleanup)
- `.github/instructions/` (validation + cleanup)
- `.github/key-data-streams/` (KDS validation + cleanup)
- `.github/audits/` (log archiving)
- `.github/hooks/`, `.github/scripts/`, `.github/templates/`, `.github/tests/` (obsolete detection)

**Capabilities:**
- Structural integrity validation (existing)
- Cross-reference checking (existing)
- Rule compliance (existing)
- Conflict detection (existing + cleanup-copilot-mess algorithm)
- **KDS structure validation (NEW from cleanup-copilot-mess)**
- **KDS cleanup execution (NEW from cleanup-copilot-mess)**
- **Deprecated file archiving (NEW from cleanup-copilot-mess)**
- **Internal prompt organization (NEW from cleanup-copilot-mess)**
- **Temporary file cleanup in .github/ (NEW from cleanup-copilot-mess)**
- **Audit log archiving (NEW from cleanup-copilot-mess)**
- **Deprecated reference replacement (NEW from cleanup-copilot-mess)**

**Invocation:**
- Manual: `@workspace /cohesion scope=all validation-level=kds-cleanup`
- Auto: plan.prompt.md Step 7.25, task.prompt.md Step 9.15

---

### cleanup.prompt.md (Unchanged - Scope Clarified)
**Scope:** Workspace folders only (EXCLUDES `.github/`)
- `Scripts/` (migration, deployment, testing scripts)
- `Docs/` (project documentation)
- `SPA/` (application code)
- `Tests/` (test files)
- `PlayWright/` (E2E tests)
- `Workspaces/` (Copilot artifacts, documentation)
- `Migrations/`, `DocFX/`, `Tools/`, etc.

**Capabilities:**
- Duplicate file detection
- Non-professional naming cleanup
- Obsolete file removal
- Misplaced file reorganization
- Folder structure flattening
- Reference updates (workspace scope)

**Invocation:**
- Manual only: `@workspace /cleanup target_folders=Scripts,Docs`
- **Rejects .github/ scope with error message**

---

## Integration Points

### 1. cohesion.prompt.md calls cleanup.prompt.md (Future)
**Scenario:** User requests full workspace cleanup

**Flow:**
```
User: @workspace /cohesion scope=all validation-level=full cleanup-workspace=true

cohesion.prompt.md:
1. Validate .github/ (existing logic)
2. Execute KDS cleanup (new logic)
3. IF cleanup-workspace=true THEN
     Execute("cleanup.prompt.md", {
       target_folders: "Scripts,Docs,SPA,Tests,PlayWright,Workspaces",
       scope: "analyze-and-propose"
     })
   END IF
```

**Status:** Not in initial consolidation (Phase 1-6), consider for future enhancement

---

### 2. healthcheck.prompt.md integration
**Current:** healthcheck validates, cleanup-copilot-mess fixes

**Future:** healthcheck validates, cohesion.prompt.md fixes

**No changes needed:** healthcheck remains read-only, cohesion handles fixes

---

## Files to Modify

### Phase 3: cohesion.prompt.md
**Sections to Add:**
1. New parameter: `validation-level=kds-cleanup`
2. New parameter: `auto-fix=true|false`
3. Step 6: KDS Structure Validation (after existing Step 5)
4. Step 7: KDS Cleanup Execution (after new Step 6)
5. Updated output format (include KDS cleanup summary)

**Functions to Add:**
- `ValidateKDS(keyPath)` - from cleanup-copilot-mess Step 1
- `FixKDSViolations(violations)` - from cleanup-copilot-mess Step 5
- `ArchiveDeprecatedFiles(files)` - from cleanup-copilot-mess Step 2
- `ReorganizeMisplacedFiles(files)` - from cleanup-copilot-mess Step 3
- `CleanTemporaryFiles(files)` - from cleanup-copilot-mess Step 4
- `FixOrphanedTests(tests)` - from cleanup-copilot-mess Step 7
- `DetectAndReplaceDeprecatedReferences()` - from cleanup-copilot-mess Step 6

---

### Phase 4: cleanup.prompt.md
**Sections to Modify:**
1. Header: Add scope exclusion note
2. Step 0: Add .github/ validation/rejection
3. Parameters: Document .github/ exclusion

**Example Validation:**
```powershell
# In Step 0: Safety Validation
IF $targetFolders -match "\.github" THEN
  Write-Error ".github/ folder managed by cohesion.prompt.md"
  Write-Host "Use: @workspace /cohesion scope=all validation-level=kds-cleanup"
  EXIT 1
END IF
```

---

### Phase 5: Archive cleanup-copilot-mess.prompt.md
**Actions:**
1. Move file to `.github/prompts/shared/archive/deprecated-2025-10-30/`
2. Create metadata.json
3. Update plan.prompt.md references
4. Update task.prompt.md references

---

## Success Criteria

### Functional
- ✅ cohesion.prompt.md validates + cleans `.github/` folder
- ✅ cleanup.prompt.md handles workspace folders only
- ✅ Auto-invocation from plan/task works with cohesion.prompt.md
- ✅ KDS violations detected and fixed
- ✅ Deprecated references auto-replaced
- ✅ No scope overlap between prompts

### Quality
- ✅ All tests pass (cohesion + cleanup scenarios)
- ✅ Documentation updated (headers, parameters, examples)
- ✅ Archive includes metadata
- ✅ No broken references after consolidation

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking auto-invocation | High | Test plan/task completion scenarios |
| Losing cleanup-copilot-mess functionality | High | Complete function migration verification |
| Scope confusion | Medium | Clear documentation + validation errors |
| Performance degradation | Low | cohesion already comprehensive, minimal impact |

---

## Next Steps

1. ✅ **Phase 1 Complete** - Responsibility matrix created
2. **Phase 2** - Design cohesion.prompt.md architecture (add algorithms, parameters)
3. **Phase 3** - Implement integration (merge functions, update steps)
4. **Phase 4** - Update cleanup.prompt.md (add .github/ rejection)
5. **Phase 5** - Archive cleanup-copilot-mess.prompt.md (move + update refs)
6. **Phase 6** - Test consolidated system (scenarios + validation)

---

**Generated:** 2025-10-30  
**Status:** Phase 1 Complete  
**Next:** Phase 2 - Architecture Design
