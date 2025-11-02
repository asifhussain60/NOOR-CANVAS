# Cleanup Prompt Implementation Summary

**Date**: 2025-10-21  
**Key**: cleanup-prompt  
**Agent**: plan  
**Status**: ✅ Complete

---

## Overview

Created comprehensive workspace cleanup agent that automatically analyzes affected folders after plan execution, identifies organizational issues (duplicates, misplaced files, broken references), proposes fixes, and executes cleanup with full safety guarantees.

---

## What Was Created

### 1. cleanup.prompt.md (New File - 900+ lines)

**Location**: `.github/prompts/cleanup.prompt.md`

**Features**:
- ✅ **Safety-First Protocol**: Backups, dry-run mode, validation before execution
- ✅ **Intelligent Analysis**: 6 categories of issues (duplicates, naming, obsolete, misplaced, structure, references)
- ✅ **Comprehensive Reorganization**: Move, rename, delete, update references
- ✅ **Reference Integrity**: Automatic detection and updating of broken links
- ✅ **Enhancement Recommendations**: AI-powered suggestions based on analysis criteria
- ✅ **Detailed Reporting**: Before/after comparison, metrics, validation results

**Analysis Categories**:
1. **Duplicate Files**: Hash-based detection, similar naming patterns
2. **Non-Professional Naming**: `-copy`, `-old`, `-backup`, version numbers
3. **Obsolete Files**: Empty files, old logs, superseded documentation
4. **Misplaced Files**: Tests in wrong folders, docs in code folders
5. **Folder Structure Issues**: Empty folders, deep nesting, inconsistent naming
6. **Reference Integrity**: Broken markdown links, outdated references

**Safety Features**:
- Full backup to `Workspaces/Archive/{YYYY-MM-DD}-pre-cleanup/`
- Git status validation before starting
- Dry-run mode by default
- User approval required for all changes (unless auto_approve=true)
- Build and test validation after cleanup
- Complete rollback capability

**Enhancement Recommendation System**:
- High file count → Subfolder organization
- Multiple duplicates → Duplicate prevention protocol
- Broken references → Automated reference checker
- Inconsistent naming → Naming convention enforcement
- Deep nesting → Folder structure flattening

### 2. feature.prompt.md Integration

**Location**: `.github/prompts/feature.prompt.md` (lines ~2900-2950)

**What Was Added**:

Added "🧹 Workspace Cleanup Analysis" section to Final Phase Summary Template:

```markdown
## 🧹 Workspace Cleanup Analysis

**Affected Folders Detected**: {List folders where work was performed}

**Invoking Cleanup Agent** to analyze affected folders for:
- Duplicate files
- Non-professional naming
- Obsolete files
- Misplaced files
- Broken references
- Folder structure issues

---

**Cleanup Agent Invocation**:

@workspace /cleanup target_folders="{folders}" scope=analyze-and-propose dry_run=true github-branch={branch}

**User Control**: Review, approve, skip, or defer cleanup
```

**Integration Flow**:
1. Final phase completes
2. feature planning agent identifies affected folders (Scripts/, Tests/, Docs/, prompts.keys/)
3. feature planning agent automatically invokes cleanup agent with target folders
4. Cleanup agent analyzes and proposes fixes
5. User reviews and approves/rejects
6. Cleanup agent executes approved changes with validation
7. Final cleanup report generated

---

## Parameters

### cleanup.prompt.md Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `target_folders` | string (required) | N/A | Comma-delimited list of folders to clean |
| `scope` | enum | `analyze-and-propose` | `analyze-and-propose` \| `analyze-only` \| `execute-approved` |
| `dry_run` | boolean | `true` | Show changes without executing (SAFETY) |
| `auto_approve` | boolean | `false` | Auto-approve low-risk changes (duplicates, TEMP files) |
| `github-branch` | string | `development` | Target branch (validated same as feature planning agent) |

---

## Execution Flow

### Step 0: Safety Validation (MANDATORY)
- Branch validation (warn if master)
- Git status check (abort if uncommitted changes)
- Backup creation to Archive folder

### Step 1: Analysis Phase (MANDATORY)
- Scan target folders for 6 categories of issues
- Hash-based duplicate detection
- Reference integrity validation
- Generate comprehensive analysis report

### Step 2: Proposed Reorganization Plan (MANDATORY)
- Present concrete action plan with risk assessment
- Group by priority (HIGH/MEDIUM/LOW)
- List affected files and references to update
- Estimate time and effort

### Step 3: Execution Phase (After User Approval)
- Execute in safe order: References → Moves → Renames → Deletions → Restructuring
- Real-time logging of each action
- Validate each operation before continuing
- Stop and rollback on ANY failure

### Step 4: Validation Phase (MANDATORY)
- Build validation (`dotnet build`)
- Test validation (if tests affected)
- Reference validation (scan for broken links)
- Git status verification

### Step 5: Reporting Phase (MANDATORY)
- Detailed cleanup report with metrics
- Before/after folder structure comparison
- Validation results
- Backup location and restore instructions
- Recommendations for future

---

## Safety Guarantees

✅ **Full Backup**: Complete snapshot to `Workspaces/Archive/{date}-pre-cleanup/`  
✅ **Dry-Run Default**: Preview changes before execution  
✅ **User Approval Required**: No changes without explicit approval  
✅ **Validation Before Commit**: Build, tests, references validated  
✅ **Rollback Capability**: Restore from backup if needed  
✅ **Reference Integrity**: All links updated automatically  
✅ **Git Integration**: Clean commit after validation passes  

---

## Enhancement Recommendations

**Intelligent Analysis-Driven Suggestions**:

| Trigger | Threshold | Recommendation | Effort |
|---------|-----------|----------------|--------|
| High file count | > 50 files in folder | Subfolder organization | Medium |
| Multiple duplicates | > 10 duplicates | Duplicate prevention protocol | Low |
| Broken references | > 5 broken links | Automated reference checker | Medium |
| Inconsistent naming | > 20 naming issues | Naming convention enforcement | High |
| Deep nesting | > 3 folders at depth 5+ | Folder structure flattening | High |

**Presentation Format**:
- High/Medium/Low priority categories
- Effort estimate (Low/Medium/High)
- Rationale (why recommended based on analysis)
- Benefit (specific value add)
- Implementation guidance

---

## Example Cleanup Report

**Target Folders**: `Scripts/`, `Tests/UI/`, `.github/prompts.keys/user-landing/`

**Issues Found**: 23 total
- 5 duplicate files (4.8 KB total)
- 3 non-professional naming issues
- 6 obsolete files (12.3 MB freed)
- 4 misplaced files
- 2 empty folders
- 3 broken references

**Actions Performed**: 18 total (5 skipped by user)
- 5 files deleted (4.8 KB freed)
- 4 files moved
- 2 files renamed
- 3 references updated
- 2 folders removed

**Validation**: ✅ All checks passed
- Build: ✅ 0 errors, 0 warnings
- Tests: ✅ 15/15 passing
- References: ✅ 0 broken links

**Duration**: 8 minutes (2 min analysis, 6 min execution + validation)

---

## Benefits

### For Users
- ✅ Automatic cleanup after implementation work
- ✅ No manual cleanup commands needed
- ✅ Safe defaults (dry-run, approval required)
- ✅ Clear before/after comparison
- ✅ Skip or defer cleanup easily

### For Workspace
- ✅ Reduces technical debt accumulation
- ✅ Maintains professional file organization
- ✅ Prevents duplicate file proliferation
- ✅ Keeps folder structures clean
- ✅ Ensures reference integrity

### For Maintenance
- ✅ Consistent cleanup protocol
- ✅ Documented organizational standards
- ✅ Automated reference updating
- ✅ Audit trail (detailed reports)
- ✅ Repeatable process

---

## Usage Examples

### Example 1: After Feature Implementation

```
User: @workspace /feature key=user-landing user_request="Add registration guard" github-branch=development

... (planning and implementation) ...

Phase 5 complete ✓

🧹 Workspace Cleanup Analysis

Affected Folders: Scripts/, Tests/UI/, .github/prompts.keys/user-landing/

@workspace /cleanup target_folders="Scripts,Tests/UI,.github/prompts.keys/user-landing" scope=analyze-and-propose dry_run=true github-branch=development

📊 Cleanup Analysis Report

Issues Found: 8 total
- 2 duplicate test files (test-debug.spec.ts, test-debug-copy.spec.ts)
- 1 obsolete script (old-migration.sql)
- 3 misplaced files (README.md in Scripts/)
- 2 broken references (links to moved files)

Recommendations:
- A. Remove duplicate test files (Low effort)
- B. Move misplaced documentation (Low effort)
- C. Fix broken references (Low effort)

Which enhancements? (e.g., "A,B,C" or "none")

User: A,B,C

... (cleanup execution with validation) ...

✓ Cleanup Complete
- 2 duplicates deleted (2.4 KB freed)
- 3 files relocated
- 2 references updated
- Build: ✅ Tests: ✅ References: ✅

Ready to commit!
```

### Example 2: Manual Cleanup

```
User: @workspace /cleanup target_folders="Docs,Scripts,Workspaces/TEMP" scope=analyze-and-propose

📊 Cleanup Analysis Report

Issues Found: 47 total
- 12 duplicate files (18.3 MB)
- 8 non-professional naming issues
- 15 obsolete files (45.2 MB)
- 7 misplaced files
- 3 empty folders
- 2 broken references

Recommendations:
- A. Subfolder organization for Scripts/ (73 files) (Medium effort)
- B. Duplicate prevention protocol (15 duplicates found) (Low effort)
- C. Remove obsolete files (45 MB can be freed) (Low effort)

Which enhancements? (e.g., "A,B,C" or "none")
```

---

## Integration with Existing Workflow

**Seamless Integration**:
1. feature planning agent completes final phase
2. feature planning agent identifies affected folders
3. feature planning agent invokes cleanup agent automatically
4. User reviews cleanup analysis
5. User approves/rejects cleanup
6. Cleanup agent executes with validation
7. Final commit includes cleanup changes

**No Manual Commands**:
- User doesn't need to remember cleanup
- Automatic detection of affected folders
- Integrated into final phase summary
- Optional (user can skip if not needed)

**Fits Existing Pattern**:
- Same branch validation as feature planning agent
- Same safety protocols (backups, validation)
- Same approval workflow (propose → approve → execute)
- Same reporting format (detailed summaries)

---

## File Structure

### New Files
```
.github/prompts/
├── cleanup.prompt.md (NEW - 900+ lines)
└── feature.prompt.md (MODIFIED - added cleanup integration)
```

### Runtime Files (Created During Cleanup)
```
Workspaces/Archive/
└── {YYYY-MM-DD}-pre-cleanup/ (backup folder)

.github/prompts.keys/{key}/
└── cleanup-report.md (cleanup summary)
```

---

## Next Steps

### Immediate
✅ cleanup.prompt.md created  
✅ feature.prompt.md integration complete  
✅ Documentation complete  

### Testing
- Test cleanup agent with sample folders
- Verify affected folder detection
- Validate reference updating
- Test rollback capability

### Future Enhancements (Optional)
- Add cleanup scheduling (weekly TEMP folder cleanup)
- Add pre-commit hook for duplicate detection
- Add CI/CD integration for reference validation
- Add cleanup metrics dashboard

---

## Related Files

- **cleanup.prompt.md** - Main cleanup agent (NEW)
- **feature.prompt.md** - Integrated cleanup invocation (MODIFIED)
- **phase-breakdown-patterns.md** - Enhancement recommendation patterns (referenced)
- **SelfAwareness.instructions.md** - Branch strategy and guidelines (referenced)
- **file-consolidation-summary.md** - Historical cleanup example (referenced)

---

**Status**: ✅ Complete and ready for use

**Version**: 1.0.0  
**Created**: 2025-10-21  
**Agent**: plan (GitHub Copilot)



