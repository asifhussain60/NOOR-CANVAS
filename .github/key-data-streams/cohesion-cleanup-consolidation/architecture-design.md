# Architecture Design - Cohesion.prompt.md v2.0 with KDS Cleanup

**Created:** 2025-10-30  
**Purpose:** Unified architecture for cohesion.prompt.md integrating KDS cleanup from cleanup-copilot-mess.prompt.md

---

## Executive Summary

**Goal:** Transform cohesion.prompt.md from read-only validator to comprehensive `.github/` management agent

**Approach:**
- Keep existing validation (5 levels: syntax → full)
- Add KDS cleanup capabilities (new level: `kds-cleanup`)
- Integrate 7 functions from cleanup-copilot-mess
- Preserve auto-invocation from plan/task prompts

---

## New Architecture Overview

```
cohesion.prompt.md v2.0
│
├── VALIDATION MODE (existing)
│   ├── Level 1: Syntax (quick)
│   ├── Level 2: Cross-Reference (medium)
│   ├── Level 3: Rules (detailed)
│   ├── Level 4: Conflicts (deep)
│   └── Level 5: Full (comprehensive)
│
└── KDS CLEANUP MODE (NEW)
    ├── Level 6: KDS-Cleanup (validation + execution)
    │   ├── Phase A: Scan & Categorize
    │   │   ├── Deprecated files
    │   │   ├── Misplaced files
    │   │   ├── Internal prompts (wrong location)
    │   │   ├── Temporary files
    │   │   ├── KDS violations
    │   │   ├── Orphaned tests
    │   │   └── Deprecated references
    │   │
    │   ├── Phase B: Propose Actions
    │   │   ├── Archive plan
    │   │   ├── Move plan
    │   │   ├── Delete plan
    │   │   └── Fix plan
    │   │
    │   └── Phase C: Execute (if auto-fix=true)
    │       ├── Archive deprecated
    │       ├── Move internal prompts
    │       ├── Clean temporary
    │       ├── Fix KDS violations
    │       ├── Update registries
    │       └── Replace deprecated refs
    │
    └── Output: Unified cohesion + cleanup report
```

---

## New Parameters

### validation-level (enhanced)

**Existing Values:**
- `syntax` - Quick structural validation
- `cross-ref` - Reference checking
- `rules` - Compliance validation
- `conflicts` - Deep conflict detection
- `full` - All validation levels

**NEW Value:**
- `kds-cleanup` - KDS structure validation + cleanup execution
  - Includes all validation levels (1-5)
  - Adds KDS-specific checks
  - Executes cleanup if auto-fix=true

**Default:** `syntax`

---

### auto-fix (NEW)

**Purpose:** Control cleanup execution behavior

**Values:**
- `false` (default) - Report issues only, no execution
- `true` - Execute fixes automatically with safety checks

**Safety Rules:**
- Low-risk operations: Automatic (temp files, deprecated refs)
- Medium-risk operations: Automatic with logging (archive, move)
- High-risk operations: User approval required (delete active prompts)

**Example:**
```bash
@workspace /cohesion scope=all validation-level=kds-cleanup auto-fix=true
```

---

### cleanup-mode (NEW)

**Purpose:** Fine-tune KDS cleanup behavior when validation-level=kds-cleanup

**Values:**
- `full` (default) - All cleanup operations
- `archive-only` - Archive deprecated, skip moves/deletes
- `organize-only` - Move internal prompts, skip archive/delete
- `validate-only` - Detect violations, no execution (same as auto-fix=false)

**Example:**
```bash
@workspace /cohesion validation-level=kds-cleanup cleanup-mode=archive-only
```

---

## Enhanced Workflow

### Step 0: Mode Detection (NEW)

```
FUNCTION DetermineExecutionMode(validation-level, auto-fix):
  
  IF validation-level == "kds-cleanup" THEN
    mode = "KDS_CLEANUP_AND_VALIDATION"
    enableCleanup = true
  ELSE IF validation-level == "full" THEN
    mode = "FULL_VALIDATION_ONLY"
    enableCleanup = false
  ELSE
    mode = "TARGETED_VALIDATION"
    enableCleanup = false
  END IF
  
  RETURN {mode, enableCleanup}
  
END FUNCTION
```

---

### Steps 1-5: Existing Validation (Unchanged)

**Step 1:** File Discovery  
**Step 2:** Structural Validation (syntax level)  
**Step 3:** Cross-Reference Validation (cross-ref level)  
**Step 4:** Rule Compliance (rules level)  
**Step 5:** Conflict Detection (conflicts level)

---

### Step 6: KDS Structure Validation (NEW)

**Purpose:** Validate `.github/key-data-streams/` structure and detect violations

**Triggers:**
- validation-level = `kds-cleanup`
- validation-level = `full`

**Algorithm:**

```
FUNCTION ValidateKDSStructure():
  
  violations = {
    deprecated: [],
    misplaced: [],
    internalPrompts: [],
    temporary: [],
    kdsViolations: [],
    orphanedTests: [],
    deprecatedRefs: []
  }
  
  # 1. Scan .github/prompts/shared/ for deprecated files
  sharedFiles = GetFiles(".github/prompts/shared/*.md")
  FOR EACH file IN sharedFiles:
    content = ReadFile(file)
    
    # Check for deprecation markers
    IF content.Contains("DEPRECATED") OR 
       content.Contains("DO NOT UPDATE") OR 
       content.Contains("obsolete") THEN
      
      violations.deprecated.Add({
        file: file,
        reason: "Marked as deprecated/obsolete",
        target: ".github/prompts/shared/archive/deprecated-2025-10-30/",
        risk: "low"
      })
    END IF
    
    # Check for informational docs (should be in Workspaces/)
    fileName = Path.GetFileName(file)
    IF fileName.EndsWith("-guide.md") OR 
       fileName.EndsWith("-reference.md") THEN
      
      IF NOT IsProtocolOrAlgorithm(content) THEN
        violations.misplaced.Add({
          file: file,
          reason: "Informational doc in shared/ folder",
          target: "Workspaces/Documentation/GitHub/",
          risk: "low"
        })
      END IF
    END IF
  END FOR
  
  # 2. Scan for internal prompts in wrong location
  allPrompts = GetFiles(".github/prompts/**/*.prompt.md")
  FOR EACH promptFile IN allPrompts:
    # Skip if already in internal/ or shared/
    IF promptFile.Contains("/internal/") OR 
       promptFile.Contains("/shared/") THEN
      CONTINUE
    END IF
    
    content = ReadFile(promptFile)
    
    # Check for manual override
    IF content.Contains("location: root") THEN
      CONTINUE
    END IF
    
    # Detect auto-invocation indicators
    IF content.Contains("invoked by") OR
       content.Contains("Called by") OR
       content.Contains("Do not call directly") THEN
      
      invokers = ExtractInvokers(content)
      
      violations.internalPrompts.Add({
        file: promptFile,
        reason: "Internal prompt called by: " + Join(invokers, ", "),
        target: ".github/prompts/internal/shared/",
        risk: "medium",
        invokers: invokers
      })
    END IF
  END FOR
  
  # 3. Scan for temporary files
  tempPatterns = ["*.tmp", "*.bak", "temp-*.md", "*-backup.md"]
  FOR EACH pattern IN tempPatterns:
    tempFiles = GetFiles(".github/**/{pattern}")
    FOR EACH file IN tempFiles:
      violations.temporary.Add({
        file: file,
        reason: "Temporary file pattern",
        action: "DELETE",
        risk: "low"
      })
    END FOR
  END FOR
  
  # 4. Validate key-data-streams structure
  keys = GetDirectories(".github/key-data-streams/*")
  FOR EACH keyPath IN keys:
    IF keyPath.StartsWith("_") THEN CONTINUE  # Skip _ARCHIVE, _SCHEMA
    
    keyViolations = ValidateKeyStructure(keyPath)
    IF keyViolations.Count > 0 THEN
      violations.kdsViolations.Add({
        key: Path.GetFileName(keyPath),
        violations: keyViolations
      })
    END IF
  END FOR
  
  # 5. Scan for orphaned test files
  testFiles = GetFiles(".github/key-data-streams/*/tests/*.spec.ts")
  FOR EACH testFile IN testFiles:
    registryFile = Path.Combine(
      Path.GetDirectoryName(testFile), 
      "test-registry.md"
    )
    
    IF NOT FileExists(registryFile) THEN
      violations.orphanedTests.Add({
        file: testFile,
        reason: "Missing test-registry.md",
        action: "CREATE_REGISTRY",
        risk: "low"
      })
    ELSE
      registry = ReadFile(registryFile)
      IF NOT registry.Contains(Path.GetFileName(testFile)) THEN
        violations.orphanedTests.Add({
          file: testFile,
          reason: "Not in test-registry.md",
          action: "ADD_TO_REGISTRY",
          risk: "low"
        })
      END IF
    END IF
  END FOR
  
  # 6. Scan for deprecated references (auto-replace)
  deprecatedRefs = {
    "CONCISE-MANDATE.md": "MANDATORY.md",
    "snippet-handling-policy.md": "MANDATORY.md",
    "output-style-mandate.md": "MANDATORY.md"
  }
  
  filesToScan = GetFiles(".github/prompts/**/*.md") + 
                GetFiles(".github/instructions/**/*.md")
  
  FOR EACH file IN filesToScan:
    IF file.Contains("/archive/") THEN CONTINUE
    
    content = ReadFile(file)
    
    FOR EACH oldRef, newRef IN deprecatedRefs:
      IF content.Contains(oldRef) THEN
        violations.deprecatedRefs.Add({
          file: file,
          oldRef: oldRef,
          newRef: newRef,
          risk: "low"
        })
      END IF
    END FOR
  END FOR
  
  RETURN violations
  
END FUNCTION


FUNCTION ValidateKeyStructure(keyPath):
  violations = []
  
  keyName = Path.GetFileName(keyPath)
  planFile = Path.Combine(keyPath, "{keyName}.plan.md")
  workLogFile = Path.Combine(keyPath, "work-log.md")
  
  # Required file checks
  IF NOT FileExists(planFile) THEN
    violations.Add({
      type: "MISSING_PLAN",
      severity: "HIGH",
      action: "CREATE_FROM_TEMPLATE"
    })
  END IF
  
  IF NOT FileExists(workLogFile) THEN
    violations.Add({
      type: "MISSING_WORKLOG",
      severity: "HIGH",
      action: "CREATE_FROM_TEMPLATE"
    })
  END IF
  
  # Staleness check
  IF FileExists(workLogFile) THEN
    lastModified = GetFileModifiedDate(workLogFile)
    daysSinceUpdate = (Now() - lastModified).TotalDays
    
    IF daysSinceUpdate > 90 THEN
      violations.Add({
        type: "STALE_KEY",
        severity: "LOW",
        daysSinceUpdate: daysSinceUpdate,
        action: "ARCHIVE_TO_ARCHIVE_FOLDER"
      })
    END IF
  END IF
  
  # Orphaned directory check
  allFiles = GetFiles(keyPath + "/*.*")
  IF allFiles.Count == 0 THEN
    violations.Add({
      type: "ORPHANED_DIRECTORY",
      severity: "MEDIUM",
      action: "DELETE_OR_ARCHIVE"
    })
  END IF
  
  RETURN violations
  
END FUNCTION


FUNCTION IsProtocolOrAlgorithm(content):
  # Check if file contains implementation logic vs pure docs
  
  indicators = [
    "FUNCTION ",
    "```",
    "**Purpose:**",
    "**Algorithm:**",
    "**Protocol:**",
    "IF ",
    "FOR EACH",
    "RETURN"
  ]
  
  matchCount = 0
  FOR EACH indicator IN indicators:
    IF content.Contains(indicator) THEN
      matchCount += 1
    END IF
  END FOR
  
  RETURN matchCount >= 3  # If 3+ indicators, it's protocol/algorithm
  
END FUNCTION


FUNCTION ExtractInvokers(content):
  invokers = []
  lines = content.Split("\n")
  
  FOR EACH line IN lines:
    # Pattern: "invoked by X" or "Called by X"
    IF line.Contains("invoked by") OR line.Contains("Called by") THEN
      matches = Regex.Matches(line, @"(\w+(-\w+)*\.prompt\.md)")
      FOR EACH match IN matches:
        invokers.Add(match.Value)
      END FOR
    END IF
    
    # Pattern: "Do not call directly. Use X"
    IF line.Contains("Do not call directly") THEN
      matches = Regex.Matches(line, @"(\w+(-\w+)*\.prompt\.md)")
      FOR EACH match IN matches:
        invokers.Add(match.Value)
      END FOR
    END IF
  END FOR
  
  RETURN invokers.Distinct()
  
END FUNCTION
```

---

### Step 7: KDS Cleanup Execution (NEW)

**Purpose:** Execute cleanup actions based on Step 6 violations

**Triggers:**
- validation-level = `kds-cleanup` AND auto-fix = `true`

**Algorithm:**

```
FUNCTION ExecuteKDSCleanup(violations, cleanup-mode):
  
  results = {
    archived: [],
    moved: [],
    deleted: [],
    created: [],
    updated: []
  }
  
  # 1. Archive deprecated files
  IF cleanup-mode IN ["full", "archive-only"] THEN
    FOR EACH item IN violations.deprecated:
      archivePath = ArchiveDeprecatedFile(item.file, item.target)
      results.archived.Add({
        file: item.file,
        destination: archivePath,
        reason: item.reason
      })
    END FOR
  END IF
  
  # 2. Move internal prompts to internal/shared/
  IF cleanup-mode IN ["full", "organize-only"] THEN
    FOR EACH item IN violations.internalPrompts:
      newPath = MoveInternalPrompt(item.file, item.target)
      
      # Update references in calling prompts
      updatedFiles = UpdatePromptReferences(item.file, newPath)
      
      results.moved.Add({
        file: item.file,
        destination: newPath,
        invokers: item.invokers,
        referencesUpdated: updatedFiles.Count
      })
    END FOR
  END IF
  
  # 3. Move misplaced documentation
  IF cleanup-mode IN ["full", "organize-only"] THEN
    FOR EACH item IN violations.misplaced:
      newPath = MoveFile(item.file, item.target)
      results.moved.Add({
        file: item.file,
        destination: newPath,
        reason: item.reason
      })
    END FOR
  END IF
  
  # 4. Delete temporary files
  IF cleanup-mode == "full" THEN
    FOR EACH item IN violations.temporary:
      DeleteFile(item.file)
      results.deleted.Add({
        file: item.file,
        reason: item.reason
      })
    END FOR
  END IF
  
  # 5. Fix KDS violations
  IF cleanup-mode == "full" THEN
    FOR EACH item IN violations.kdsViolations:
      keyPath = ".github/key-data-streams/" + item.key
      
      FOR EACH violation IN item.violations:
        
        IF violation.type == "MISSING_WORKLOG" THEN
          CreateWorkLog(keyPath, item.key)
          results.created.Add({
            file: keyPath + "/work-log.md",
            reason: "Missing work-log.md"
          })
          
        ELSE IF violation.type == "MISSING_PLAN" THEN
          CreatePlanFile(keyPath, item.key)
          results.created.Add({
            file: keyPath + "/{item.key}.plan.md",
            reason: "Missing plan file"
          })
          
        ELSE IF violation.type == "STALE_KEY" THEN
          archivePath = ArchiveStaleKey(keyPath, item.key)
          results.archived.Add({
            file: keyPath,
            destination: archivePath,
            reason: "Stale (>{violation.daysSinceUpdate} days)"
          })
          
        ELSE IF violation.type == "ORPHANED_DIRECTORY" THEN
          DeleteDirectory(keyPath)
          results.deleted.Add({
            file: keyPath,
            reason: "Orphaned directory"
          })
        END IF
        
      END FOR
    END FOR
  END IF
  
  # 6. Fix orphaned tests
  IF cleanup-mode == "full" THEN
    FOR EACH item IN violations.orphanedTests:
      
      IF item.action == "CREATE_REGISTRY" THEN
        CreateTestRegistry(item.file)
        results.created.Add({
          file: Path.GetDirectoryName(item.file) + "/test-registry.md",
          reason: "Missing test registry"
        })
        
      ELSE IF item.action == "ADD_TO_REGISTRY" THEN
        AddToTestRegistry(item.file)
        results.updated.Add({
          file: Path.GetDirectoryName(item.file) + "/test-registry.md",
          reason: "Added orphaned test"
        })
      END IF
      
    END FOR
  END IF
  
  # 7. Replace deprecated references
  IF cleanup-mode == "full" THEN
    FOR EACH item IN violations.deprecatedRefs:
      ReplaceDeprecatedReference(item.file, item.oldRef, item.newRef)
      results.updated.Add({
        file: item.file,
        reason: "Replaced {item.oldRef} → {item.newRef}"
      })
    END FOR
  END IF
  
  RETURN results
  
END FUNCTION


FUNCTION ArchiveDeprecatedFile(filePath, targetDir):
  
  CreateDirectory(targetDir)
  
  fileName = Path.GetFileName(filePath)
  archivePath = Path.Combine(targetDir, fileName)
  
  # Create metadata
  metadata = {
    "originalPath": filePath,
    "archivedDate": Now().ToString("yyyy-MM-dd"),
    "reason": "Deprecated/obsolete",
    "supersededBy": DetermineSupersededBy(filePath)
  }
  
  MoveFile(filePath, archivePath)
  WriteFile(archivePath + ".metadata.json", ToJson(metadata))
  
  RETURN archivePath
  
END FUNCTION


FUNCTION MoveInternalPrompt(promptFile, targetDir):
  
  CreateDirectory(targetDir)
  
  fileName = Path.GetFileName(promptFile)
  newPath = Path.Combine(targetDir, fileName)
  
  MoveFile(promptFile, newPath)
  
  RETURN newPath
  
END FUNCTION


FUNCTION UpdatePromptReferences(oldPath, newPath):
  
  fileName = Path.GetFileName(oldPath)
  newRelativePath = "internal/shared/" + fileName
  
  allPrompts = GetFiles(".github/prompts/**/*.prompt.md")
  updatedFiles = []
  
  FOR EACH promptFile IN allPrompts:
    IF promptFile == newPath THEN CONTINUE
    
    content = ReadFile(promptFile)
    originalContent = content
    
    # Update Execute() calls
    content = Regex.Replace(content,
      @"Execute\([""']" + fileName + @"[""']",
      "Execute(\"" + newRelativePath + "\"")
    
    # Update calls: [] metadata
    content = content.Replace(
      "calls: [" + fileName + "]",
      "calls: [" + newRelativePath + "]")
    
    # Update markdown links
    content = Regex.Replace(content,
      @"\[([^\]]+)\]\(" + fileName + @"\)",
      "[$1](" + newRelativePath + ")")
    
    IF content != originalContent THEN
      WriteFile(promptFile, content)
      updatedFiles.Add(promptFile)
    END IF
  END FOR
  
  RETURN updatedFiles
  
END FUNCTION


FUNCTION CreateWorkLog(keyPath, keyName):
  
  template = """# Work Log: {keyName}

**Key:** `{keyName}`  
**Created:** {Now()}  
**Agent:** cohesion.prompt.md (auto-created)  
**Status:** Needs Update

---

## Session 1: {Now()} - cohesion.prompt.md

**Status:** Work log created automatically  
**Reason:** Missing work-log.md detected during KDS validation

**Next Steps:** Update this log with actual work session details

---

**Last Updated:** {Now()}
"""
  
  filePath = Path.Combine(keyPath, "work-log.md")
  WriteFile(filePath, template)
  
  RETURN filePath
  
END FUNCTION


FUNCTION CreatePlanFile(keyPath, keyName):
  
  template = """# Plan: {keyName}

**Key:** `{keyName}`  
**Created:** {Now()}  
**Agent:** cohesion.prompt.md (auto-created)  
**Status:** Draft

---

## Objective

[NEEDS UPDATE - Add objective]

---

## Phases

### Phase 1: [Name]
**Objective:** [Add objective]

**Tasks:**
1. [Task 1]
2. [Task 2]

---

**Created:** {Now()}  
**Status:** Draft - Needs manual update
"""
  
  filePath = Path.Combine(keyPath, "{keyName}.plan.md")
  WriteFile(filePath, template)
  
  RETURN filePath
  
END FUNCTION


FUNCTION CreateTestRegistry(testFile):
  
  testDir = Path.GetDirectoryName(testFile)
  registryFile = Path.Combine(testDir, "test-registry.md")
  
  fileName = Path.GetFileName(testFile)
  
  template = """# Test Registry

**Purpose:** Inventory of all tests for this key  
**Last Updated:** {Now()}

## Tests

| Test File | Type | Status | Run Command |
|-----------|------|--------|-------------|
| {fileName} | E2E | Active | npx playwright test {fileName} |

---

**Generated:** {Now()}  
**Agent:** cohesion.prompt.md
"""
  
  WriteFile(registryFile, template)
  
  RETURN registryFile
  
END FUNCTION


FUNCTION AddToTestRegistry(testFile):
  
  testDir = Path.GetDirectoryName(testFile)
  registryFile = Path.Combine(testDir, "test-registry.md")
  
  fileName = Path.GetFileName(testFile)
  
  # Read existing registry
  content = ReadFile(registryFile)
  
  # Find table end
  lines = content.Split("\n")
  insertIndex = -1
  
  FOR i = 0 TO lines.Length - 1:
    IF lines[i].StartsWith("|") AND i > 0 THEN
      insertIndex = i + 1  # After last table row
    END IF
  END FOR
  
  # Insert new row
  newRow = "| {fileName} | E2E | Active | npx playwright test {fileName} |"
  lines.Insert(insertIndex, newRow)
  
  # Update timestamp
  content = Join(lines, "\n")
  content = Regex.Replace(content,
    @"\*\*Last Updated:\*\* .*",
    "**Last Updated:** " + Now())
  
  WriteFile(registryFile, content)
  
  RETURN registryFile
  
END FUNCTION


FUNCTION ReplaceDeprecatedReference(filePath, oldRef, newRef):
  
  content = ReadFile(filePath)
  
  # Replace all occurrences
  content = content.Replace(oldRef, newRef)
  
  WriteFile(filePath, content)
  
  RETURN filePath
  
END FUNCTION
```

---

## Updated Output Format

### During KDS Cleanup Execution

```markdown
🧹 KDS Cleanup Started...

📂 Scanning .github/ structure:
- prompts/ (including shared/)
- instructions/
- key-data-streams/
- audits/, hooks/, scripts/, templates/

✅ Violations Found:
- Deprecated: 5 files
- Misplaced: 3 files
- Internal Prompts (wrong location): 1 file
- Temporary: 7 files
- KDS Violations: 2 keys
- Orphaned Tests: 1 test
- Deprecated References: 4 files

📋 Cleanup Actions (auto-fix=true):
1. Archived 5 deprecated files → .github/prompts/shared/archive/
2. Moved 1 internal prompt → .github/prompts/internal/shared/
3. Moved 3 misplaced docs → Workspaces/Documentation/
4. Deleted 7 temporary files
5. Fixed 2 KDS violations (created work-log.md, archived stale key)
6. Created 1 test registry
7. Updated 4 files (deprecated refs)

💾 Commit:
- Files changed: 23
- Commit: cohesion(kds-cleanup): comprehensive .github/ cleanup

🎯 Status: Complete
```

### After Completion (work-log.md entry)

```markdown
## KDS Cleanup Summary (Auto-executed)

**Timestamp:** {ISO-8601}  
**Trigger:** {plan.prompt.md Step 7.25 | task.prompt.md Step 9.15 | manual}  
**Mode:** validation-level=kds-cleanup, auto-fix=true

### Actions Taken

**1. Deprecated Files Archived (5)**
- .github/prompts/shared/CONCISE-MANDATE.md
- .github/prompts/shared/snippet-handling-policy.md
- .github/prompts/shared/output-style-mandate.md
- (2 additional)
→ Moved to: .github/prompts/shared/archive/deprecated-2025-10-30/

**2. Internal Prompts Reorganized (1)**
- .github/prompts/helper.prompt.md → .github/prompts/internal/shared/
  - Invoked by: plan.prompt.md, task.prompt.md
  - Updated 2 references in calling prompts

**3. Misplaced Files Moved (3)**
- .github/prompts/user-guide.md → Workspaces/Documentation/GitHub/
- (2 additional)

**4. Temporary Files Deleted (7)**
- .github/prompts/temp-analysis.md
- (6 additional)

**5. KDS Violations Fixed (2)**
- test-key: Created missing work-log.md
- old-experiment: Archived (90+ days stale)

**6. Orphaned Tests Fixed (1)**
- Created test-registry.md for orphaned test

**7. Deprecated References Updated (4)**
- plan.prompt.md: CONCISE-MANDATE → MANDATORY
- (3 additional)

### Validation Results

✅ All structural checks passed  
✅ All cross-references valid  
✅ All rule compliance verified  
✅ No conflicts detected  
✅ KDS structure compliant

**Status:** ✅ Cleanup complete
```

---

## Integration with Existing Steps

### Modified Step 8: Report Generation

**Enhancement:** Include KDS cleanup results in cohesion report

```
FUNCTION GenerateCohesionReport(validationResults, kdsCleanupResults):
  
  report = """# Cohesion Report: {timestamp}

**Scope:** {scope}  
**Validation Level:** {validation-level}  
**KDS Cleanup:** {enabled|disabled}

---

## Executive Summary

**Files Scanned:** {count}  
**Validation Issues:** {count} ({CRITICAL}/{HIGH}/{MEDIUM}/{LOW})  
**KDS Violations:** {count}  
**Cleanup Actions:** {count} (if auto-fix=true)

---

## Validation Results (Levels 1-5)

[Existing validation output]

---

## KDS Cleanup Results (Level 6)

### Violations Detected

**Deprecated Files:** {count}  
- {file1} → {target}
- {file2} → {target}

**Misplaced Files:** {count}  
- {file1} → {target}

**Internal Prompts (Wrong Location):** {count}  
- {file1} → internal/shared/

**Temporary Files:** {count}  
- {file1} (DELETE)

**KDS Violations:** {count}  
- {key1}: Missing work-log.md
- {key2}: Stale (90+ days)

**Orphaned Tests:** {count}  
- {test1}: Missing registry

**Deprecated References:** {count}  
- {file1}: {oldRef} → {newRef}

---

### Cleanup Actions Executed (if auto-fix=true)

**Archived:** {count} files  
**Moved:** {count} files  
**Deleted:** {count} files  
**Created:** {count} files  
**Updated:** {count} files

[Detailed action log]

---

## Recommendations

1. {recommendation1}
2. {recommendation2}

---

**Generated:** {timestamp}  
**Report Location:** .github/key-data-streams/{key}/cohesion-report.md
"""
  
  RETURN report
  
END FUNCTION
```

---

## Auto-Invocation Integration

### From plan.prompt.md (Step 7.25)

**OLD (cleanup-copilot-mess):**
```powershell
IF KeyStatus == "complete" AND PhaseCount >= 3 THEN
  Execute("cleanup-copilot-mess.prompt.md", {
    key: CurrentKey,
    mode: "auto",
    verbosity: "concise"
  })
END IF
```

**NEW (cohesion v2.0):**
```powershell
IF KeyStatus == "complete" AND PhaseCount >= 3 THEN
  Execute("cohesion.prompt.md", {
    scope: "all",
    validation-level: "kds-cleanup",
    auto-fix: true,
    cleanup-mode: "full",
    key: CurrentKey,
    verbosity: "concise"
  })
END IF
```

---

### From task.prompt.md (Step 9.15)

**OLD (cleanup-copilot-mess):**
```powershell
IF IsFinalTask(key, phase) THEN
  cleanupResult = Execute("cleanup-copilot-mess.prompt.md", {
    key: key,
    mode: "auto",
    trigger: "task-completion"
  })
END IF
```

**NEW (cohesion v2.0):**
```powershell
IF IsFinalTask(key, phase) THEN
  cleanupResult = Execute("cohesion.prompt.md", {
    scope: "all",
    validation-level: "kds-cleanup",
    auto-fix: true,
    cleanup-mode: "full",
    key: key,
    verbosity: "concise"
  })
  
  AppendWorkLog(cleanupResult)
END IF
```

---

## Safety Mechanisms

### 1. Safe Harbor Files (NEVER modify)

```
safeHarborFiles = [
  ".github/MANDATORY.md",
  ".github/instructions/SelfAwareness.instructions.md"
]

safeHarborPatterns = [
  "*-mandate.md",
  "*-protocol.md",
  "context-*.md",
  "validation-*.md",
  "step-*.md"
]

FUNCTION IsSafeHarbor(filePath):
  FOR EACH safeFile IN safeHarborFiles:
    IF filePath.EndsWith(safeFile) THEN RETURN true
  END FOR
  
  fileName = Path.GetFileName(filePath)
  FOR EACH pattern IN safeHarborPatterns:
    IF MatchesPattern(fileName, pattern) THEN RETURN true
  END FOR
  
  RETURN false
END FUNCTION
```

### 2. Risk-Based Approval

```
FUNCTION RequiresApproval(action, item):
  
  IF action == "DELETE" AND item.risk == "high" THEN
    RETURN true
  END IF
  
  IF action == "ARCHIVE" AND IsActivePrompt(item.file) THEN
    RETURN true
  END IF
  
  IF item.file.Contains(".github/prompts/") AND 
     NOT item.file.Contains("/shared/") THEN
    RETURN true  # Active prompts require approval
  END IF
  
  RETURN false
  
END FUNCTION
```

### 3. Rollback Support

```
# Create git checkpoint before cleanup
git tag -a "checkpoint/cohesion-cleanup-{timestamp}" -m "Pre-cleanup"
git push origin checkpoint/cohesion-cleanup-{timestamp}

# Rollback if needed
git reset --hard checkpoint/cohesion-cleanup-{timestamp}
```

---

## Performance Considerations

### Incremental Scanning

```
FUNCTION ScanIncrementally(scope):
  
  IF scope == "prompts" THEN
    RETURN ScanDirectory(".github/prompts/")
    
  ELSE IF scope == "instructions" THEN
    RETURN ScanDirectory(".github/instructions/")
    
  ELSE IF scope == "kds" THEN
    RETURN ScanDirectory(".github/key-data-streams/")
    
  ELSE IF scope == "all" THEN
    # Parallel scanning
    results = ParallelInvoke([
      ScanDirectory(".github/prompts/"),
      ScanDirectory(".github/instructions/"),
      ScanDirectory(".github/key-data-streams/")
    ])
    RETURN Merge(results)
  END IF
  
END FUNCTION
```

### Caching

```
# Cache file hashes to detect changes
cache = {
  "last-scan": timestamp,
  "file-hashes": {
    "file1": hash1,
    "file2": hash2
  }
}

# Skip unchanged files
IF cache.file-hashes[file] == CurrentHash(file) THEN
  SKIP  # File unchanged since last scan
END IF
```

---

## Testing Strategy

### Test Scenarios

1. **Validation-only mode** (`auto-fix=false`)
   - Detect violations without execution
   - Report generation only

2. **Full cleanup mode** (`validation-level=kds-cleanup`, `auto-fix=true`)
   - All cleanup operations executed
   - Verify file moves, archives, deletions

3. **Selective cleanup** (`cleanup-mode=archive-only`)
   - Archive deprecated only
   - Skip moves/deletes

4. **Auto-invocation** (from plan/task)
   - Complete workflow
   - Verify work-log updated

---

## Summary

**Architecture Enhancements:**
- ✅ New validation level: `kds-cleanup`
- ✅ New parameters: `auto-fix`, `cleanup-mode`
- ✅ 7 functions migrated from cleanup-copilot-mess
- ✅ Unified reporting (validation + cleanup)
- ✅ Auto-invocation compatibility preserved

**Backward Compatibility:**
- ✅ Existing validation levels unchanged
- ✅ Existing parameters work as before
- ✅ Reports include both validation and cleanup

**Next Phase:** Implementation (Phase 3)

---

**Generated:** 2025-10-30  
**Status:** Phase 2 Complete  
**Next:** Phase 3 - Implementation
