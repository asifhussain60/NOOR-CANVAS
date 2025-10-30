# cleanup-copilot-mess.prompt.md

**⚠️ LOAD FIRST:** `.github/MANDATORY.md` (Enforce: No code in chat | Document first | Playwright orchestration)

---
mode: agent
description: Automated FILE ORGANIZATION agent for .github structure - NEVER modifies prompt/instruction logic, only moves/archives/deletes files
---

**Version:** 1.2.0  
**Created:** 2025-10-30  
**Purpose:** Keep .github and key-data-streams folders clean, organized, and KDS-compliant
**Scope:** FILE OPERATIONS ONLY - Does NOT modify prompt logic, validation rules, or instruction content

## When to Execute

**Automatic Injection Points:**
1. **End of plan.prompt.md** - After Step 7 (Handoff), run cleanup before final response
2. **End of task.prompt.md** - After Step 9 (Completion), run cleanup before response validation
3. **Manual Invocation** - User says `@workspace /cleanup` or `/clean-copilot-mess`
4. **Scheduled** - Weekly automated runs via GitHub Actions (future enhancement)

**Integration:**
```markdown
# In {key}.plan.md Phase N (Final Phase):
- Task N-1: Complete final implementation
- Task N: **AUTO-CLEANUP** - Run cleanup-copilot-mess.prompt.md
- Task N+1: Final validation and response
```

---

## Scope

**What Gets Cleaned:**
1. ✅ Deprecated files in `.github/prompts/shared/`
2. ✅ Informational MD files misplaced in `.github/prompts/` or `.github/instructions/`
3. ✅ Orphaned test files without registry entries
4. ✅ Temporary work files (*.tmp, *.bak, temp-*.md)
5. ✅ Duplicate/conflicting mandate files
6. ✅ KDS violations (missing work-log.md, orphaned keys, stale keys)
7. ✅ Debug markers in code (if key completed)
8. ✅ Obsolete references in documentation
9. ✅ **Internal prompts misplaced in root** - Auto-invoked agentic prompts not in `.github/prompts/internal/shared/`
10. ✅ **All `.github/` subfolders** - audits/, hooks/, scripts/, templates/, tests/ for obsolete content
11. ✅ **Duplicate prompt responsibilities** - Conflicts between cleanup-copilot-mess, cleanup.prompt, healthcheck
12. ✅ **KDS efficiency violations** - Duplicate documentation, conflicting instructions, stale metadata

**What Stays:**
- ❌ Active prompts (*.prompt.md in `.github/prompts/`)
- ❌ Active instructions (*.md in `.github/instructions/`)
- ❌ Implementation helpers (step-*.md, *-protocol.md)
- ❌ Active KDS keys with recent activity
- ❌ User-approved modifications
- ❌ Active audit logs (last 30 days in .github/audits/)
- ❌ Active git hooks (.github/hooks/)

---

## 🚨 CRITICAL: NEVER MODIFY PROMPT/INSTRUCTION LOGIC

**THIS AGENT IS FILE ORGANIZATION ONLY - NOT CONTENT MODIFICATION**

### Absolute Prohibitions

**❌ NEVER modify prompt/instruction content:**
- Do NOT change algorithms, protocols, or execution logic
- Do NOT modify validation rules, safety checks, or mandates
- Do NOT alter step-by-step procedures or workflows
- Do NOT change parameter definitions or behavior
- Do NOT modify function pseudocode or decision trees
- Do NOT change integration points between prompts

**❌ NEVER delete active guidance:**
- Do NOT remove protocols referenced by active prompts
- Do NOT delete templates actively used in workflows
- Do NOT remove shared algorithms (context-gathering, validation, etc.)
- Do NOT delete mandate files (debug-logging-mandate.md, etc.)

**✅ ONLY perform file operations:**
- ✅ Move files to correct locations (shared/, internal/, archive/)
- ✅ Archive deprecated files (explicitly marked "DEPRECATED" or "obsolete")
- ✅ Delete temporary files (*.tmp, *.bak, temp-*.md)
- ✅ Update file references after moves (path updates only)
- ✅ Fix broken links (point to new locations)
- ✅ Create missing registries (test-registry.md, work-log.md)
- ✅ Archive old audit logs (>30 days)
- ✅ Flag conflicts for USER review (do not auto-resolve content conflicts)

### File-Only Operations

**Moving Files:**
```
✅ ALLOWED: Move .github/prompts/helper.prompt.md → .github/prompts/internal/shared/
✅ ALLOWED: Update references: Execute("helper.prompt.md") → Execute("internal/shared/helper.prompt.md")
❌ FORBIDDEN: Modify helper.prompt.md's algorithm or logic
```

**Archiving Files:**
```
✅ ALLOWED: Archive file marked "DEPRECATED" or "DO NOT UPDATE"
✅ ALLOWED: Archive audit log older than 30 days
❌ FORBIDDEN: Archive active protocol because it seems "duplicate"
❌ FORBIDDEN: Delete shared algorithm because it's "not referenced" (may be called dynamically)
```

**Conflict Detection:**
```
✅ ALLOWED: Detect overlapping scope between cleanup-copilot-mess and cleanup.prompt
✅ ALLOWED: Document conflict and recommend separation of concerns
❌ FORBIDDEN: Automatically modify cleanup.prompt to remove overlapping logic
❌ FORBIDDEN: Change healthcheck.prompt validation rules
```

### Verification Before Any Action

**Before archiving/deleting a file, verify:**
1. File is explicitly marked "DEPRECATED", "obsolete", or "DO NOT UPDATE"
2. File matches temporary pattern (*.tmp, *.bak, temp-*)
3. File is audit log >30 days old
4. File is confirmed duplicate (identical hash AND newer version exists)

**If uncertain:**
- ✅ Flag for user review
- ✅ Include in "Recommended Actions (requires approval)"
- ❌ Do NOT auto-archive
- ❌ Do NOT auto-delete

### Safe Harbor Files

**NEVER touch these files regardless of analysis:**
- `.github/MANDATORY.md` - Core operating rules
- `.github/prompts/shared/*-mandate.md` - System mandates
- `.github/prompts/shared/*-protocol.md` - Integration protocols
- `.github/prompts/shared/context-*.md` - Context gathering algorithms
- `.github/prompts/shared/validation-*.md` - Validation logic
- `.github/prompts/shared/step-*.md` - Workflow checkpoints
- `.github/instructions/SelfAwareness.instructions.md` - Core instructions
- Any file referenced in MANDATORY.md

**Exception:** Safe harbor files CAN be moved to better locations, but content must remain unchanged.

---

## Internal Prompt Organization

**Purpose:** Maintain clear separation between user-facing and system-internal prompts

### Classification Rules

**Internal/Shared Prompts** (`.github/prompts/internal/shared/`):
- ✅ Automatically invoked by other agentic prompts
- ✅ Not meant for direct user invocation
- ✅ Shared across multiple calling prompts
- ✅ Contains phrases like:
  - "invoked by {prompt}.prompt.md"
  - "Called by {prompt}.prompt.md"
  - "Do not call directly. Use {prompt}.prompt.md"
  - "calls: [{this-prompt}.prompt.md]" (in calling prompt metadata)

**Examples:**
- `analyze-learning.prompt.md` - Called by handoff.prompt.md and task.prompt.md
- `cohesion-review.prompt.md` - Called by cohesion.prompt.md
- `total-recall.prompt.md` - Internal knowledge retrieval, called by multiple prompts

**Root-Level Prompts** (`.github/prompts/`):
- ✅ Direct user invocation (e.g., `@workspace /plan`, `@workspace /task`)
- ✅ Entry points to workflows
- ✅ Documented in user-facing docs

**Examples:**
- `plan.prompt.md` - User-facing planning agent
- `task.prompt.md` - User-facing task execution agent
- `ask.prompt.md` - User-facing question routing

### Detection Logic

The cleanup agent automatically detects internal prompts by:

1. **Scanning for invocation markers** in prompt content:
   ```markdown
   - invoked by xyz.prompt.md
   - Called by xyz.prompt.md
   - Do not call directly
   ```

2. **Cross-referencing with calling prompts**:
   - If prompt A has `calls: [prompt-b.prompt.md]` in metadata
   - Then prompt-b should be in `internal/shared/`

3. **Analyzing Execute() patterns**:
   ```
   Execute("helper.prompt.md")  # helper.prompt.md → internal/shared/
   ```

### Auto-Fix Behavior

When an internal prompt is detected in the wrong location:

1. **Move** to `.github/prompts/internal/shared/`
2. **Update all references** in calling prompts:
   - `Execute("helper.prompt.md")` → `Execute("internal/shared/helper.prompt.md")`
   - Markdown links updated
   - Documentation updated
3. **Log invokers** for verification
4. **Commit** with detailed message

### Manual Override

To **exclude** a prompt from auto-move, add to prompt header:
```markdown
---
mode: agent
location: root  # Keep in .github/prompts/ root
---
```

---

## Execution Flow

### Step 1: Scan and Categorize Files

```
FUNCTION ScanForCleanup():
  
  results = {
    deprecated: [],
    misplaced: [],
    orphaned: [],
    temporary: [],
    duplicates: [],
    kdsViolations: []
  }
  
  # 0. Define Safe Harbor Files (NEVER archive/delete these)
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
  
  # 1. Scan .github/prompts/shared/ for deprecated files
  sharedFiles = GetFiles(".github/prompts/shared/*.md")
  FOR EACH file IN sharedFiles:
    # SAFE HARBOR CHECK - Skip protected files
    fileName = Path.GetFileName(file)
    IF IsSafeHarbor(file, safeHarborFiles, safeHarborPatterns) THEN
      CONTINUE  # Protected file - do not analyze for deprecation
    END IF
    
    content = ReadFile(file)
    IF content.Contains("DEPRECATED") OR content.Contains("DO NOT UPDATE") OR content.Contains("obsolete") THEN
      results.deprecated.Add({
        file: file,
        reason: "Marked as deprecated/obsolete",
        target: ".github/prompts/shared/archive/"
      })
    END IF
    
    # Check if it's purely documentation (not protocol/template)
    fileName = Path.GetFileName(file)
    IF fileName.EndsWith("-guide.md") OR fileName.EndsWith("-reference.md") OR fileName.EndsWith("README.md") THEN
      IF NOT (content.Contains("**Purpose:**") OR content.Contains("FUNCTION ") OR content.Contains("```")) THEN
        results.misplaced.Add({
          file: file,
          reason: "Informational documentation in shared/ folder",
          target: "Workspaces/Documentation/GitHub/"
        })
      END IF
    END IF
  END FOR
  
  # 1a. Scan ALL .github subfolders for obsolete content
  githubSubfolders = ["audits/", "hooks/", "scripts/", "templates/", "tests/"]
  FOR EACH folder IN githubSubfolders:
    folderPath = ".github/" + folder
    
    IF folder == "audits/" THEN
      # Archive audit logs older than 30 days
      auditFiles = GetFiles(folderPath + "**/*.log")
      FOR EACH auditFile IN auditFiles:
        age = (Now() - GetFileTimestamp(auditFile)).TotalDays
        IF age > 30 THEN
          results.deprecated.Add({
            file: auditFile,
            reason: "Audit log older than 30 days",
            target: ".github/audits/_archive/"
          })
        END IF
      END FOR
    ELSE IF folder == "scripts/" THEN
      # Check for duplicate/obsolete scripts
      scriptFiles = GetFiles(folderPath + "*.ps1")
      FOR EACH scriptFile IN scriptFiles:
        content = ReadFile(scriptFile)
        IF content.Contains("DEPRECATED") OR content.Contains("obsolete") THEN
          results.deprecated.Add({
            file: scriptFile,
            reason: "Marked as deprecated",
            target: ".github/scripts/_archive/"
          })
        END IF
      END FOR
    ELSE IF folder == "templates/" THEN
      # Ensure templates are still referenced
      templateFiles = GetFiles(folderPath + "*.md")
      FOR EACH templateFile IN templateFiles:
        # Search for references in prompts/instructions
        references = SearchReferences(templateFile)
        IF references.Count == 0 THEN
          results.orphaned.Add({
            file: templateFile,
            reason: "Template not referenced in any prompt/instruction",
            action: "REVIEW_OR_ARCHIVE"
          })
        END IF
      END FOR
    END IF
  END FOR
  
  # 1b. Scan for conflicting prompt responsibilities (KDS efficiency)
  cleanupPrompts = [
    ".github/prompts/cleanup-copilot-mess.prompt.md",
    ".github/prompts/internal/util/cleanup.prompt.md"
  ]
  
  validationPrompts = [
    ".github/prompts/healthcheck.prompt.md"
  ]
  
  # Check for overlapping scopes
  conflicts = DetectPromptConflicts(cleanupPrompts + validationPrompts)
  IF conflicts.Count > 0 THEN
    FOR EACH conflict IN conflicts:
      results.duplicates.Add({
        files: conflict.prompts,
        reason: "Overlapping scope: " + conflict.overlap,
        action: "CLARIFY_SEPARATION_OF_CONCERNS"
      })
    END FOR
  END IF
  
  # 2. Scan for misplaced informational files
  promptsRoot = GetFiles(".github/prompts/*.md")
  instructionsRoot = GetFiles(".github/instructions/*.md")
  
  FOR EACH file IN promptsRoot + instructionsRoot:
    IF NOT file.EndsWith(".prompt.md") AND NOT IsInstruction(file) THEN
      results.misplaced.Add({
        file: file,
        reason: "Informational MD not in proper location",
        target: "Workspaces/Documentation/"
      })
    END IF
  END FOR
  
  # 3. Scan for temporary files
  tempPatterns = ["*.tmp", "*.bak", "temp-*.md", "*-backup.md", "*-old.md"]
  FOR EACH pattern IN tempPatterns:
    tempFiles = GetFiles(".github/**/{pattern}")
    FOR EACH file IN tempFiles:
      results.temporary.Add({
        file: file,
        reason: "Temporary file pattern",
        action: "DELETE"
      })
    END FOR
  END FOR
  
  # 5. Scan key-data-streams for violations
  keys = GetDirectories(".github/key-data-streams/*")
  FOR EACH key IN keys:
    IF key.StartsWith("_") THEN CONTINUE  # Skip _ARCHIVE, _SCHEMA, _template
    
    violations = ValidateKDS(key)
    IF violations.Count > 0 THEN
      results.kdsViolations.Add({
        key: key,
        violations: violations
      })
    END IF
  END FOR
  
  # 6. Scan for internal prompts in wrong location
  allPrompts = GetFiles(".github/prompts/**/*.prompt.md")
  FOR EACH promptFile IN allPrompts:
    # Skip if already in internal/ or shared/
    IF promptFile.Contains("/internal/") OR promptFile.Contains("/shared/") THEN
      CONTINUE
    END IF
    
    content = ReadFile(promptFile)
    
    # Check for manual override to keep in root
    IF content.Contains("location: root") THEN
      CONTINUE  # User explicitly wants this in root
    END IF
    
    # Detect if this is an internal/agentic prompt
    isInternal = false
    
    # Check for auto-invocation indicators
    IF content.Contains("invoked by") OR 
       content.Contains("Called by") OR
       content.Contains("Do not call directly") OR
       content.Contains("calls: [") OR
       content.Contains("auto-chain=true") OR
       content.Contains("Execute(") THEN
      
      # Extract what prompts invoke this
      invokers = ExtractInvokers(content)
      
      IF invokers.Count > 0 THEN
        isInternal = true
        results.misplaced.Add({
          file: promptFile,
          reason: "Internal prompt called by: " + Join(invokers, ", "),
          target: ".github/prompts/internal/shared/",
          type: "INTERNAL_PROMPT"
        })
      END IF
    END IF
  END FOR
  
  # 7. Scan for orphaned test files
  testFiles = GetFiles(".github/key-data-streams/*/tests/*.spec.ts")
  FOR EACH testFile IN testFiles:
    registryFile = Path.Combine(Path.GetDirectory(testFile), "test-registry.md")
    IF NOT FileExists(registryFile) THEN
      results.orphaned.Add({
        file: testFile,
        reason: "Missing test-registry.md",
        action: "CREATE_REGISTRY"
      })
    ELSE
      registry = ReadFile(registryFile)
      IF NOT registry.Contains(Path.GetFileName(testFile)) THEN
        results.orphaned.Add({
          file: testFile,
          reason: "Not in test-registry.md",
          action: "ADD_TO_REGISTRY"
        })
      END IF
    END IF
  END FOR
  
  RETURN results
  
END FUNCTION


FUNCTION IsSafeHarbor(filePath, safeHarborFiles, safeHarborPatterns):
  """
  Check if file is protected from archiving/deletion
  
  Returns true if file matches safe harbor list or patterns
  """
  
  # Check exact file matches
  FOR EACH safeFile IN safeHarborFiles:
    IF filePath.EndsWith(safeFile) OR filePath == safeFile THEN
      RETURN true
    END IF
  END FOR
  
  # Check pattern matches
  fileName = Path.GetFileName(filePath)
  FOR EACH pattern IN safeHarborPatterns:
    IF MatchesPattern(fileName, pattern) THEN
      RETURN true
    END IF
  END FOR
  
  RETURN false
  
END FUNCTION


FUNCTION ValidateKDS(keyPath):
  violations = []
  
  keyName = Path.GetFileName(keyPath)
  planFile = Path.Combine(keyPath, "{keyName}.plan.md")
  workLogFile = Path.Combine(keyPath, "work-log.md")
  stateFile = Path.Combine(keyPath, "{keyName}.state.json")
  
  # Required file checks
  IF NOT FileExists(planFile) THEN
    violations.Add({type: "MISSING_PLAN", severity: "HIGH"})
  END IF
  
  IF NOT FileExists(workLogFile) THEN
    violations.Add({type: "MISSING_WORKLOG", severity: "HIGH"})
  END IF
  
  # Staleness check
  IF FileExists(workLogFile) THEN
    lastModified = GetFileTimestamp(workLogFile)
    daysSinceUpdate = (Now() - lastModified).TotalDays
    
    IF daysSinceUpdate > 90 THEN
      violations.Add({
        type: "STALE_KEY",
        severity: "LOW",
        daysSinceUpdate: daysSinceUpdate,
        suggestion: "Consider archiving to _ARCHIVE/"
      })
    END IF
  END IF
  
  # Orphaned directory check
  allFiles = GetFiles(keyPath + "/*.*")
  IF allFiles.Count == 0 OR (NOT FileExists(planFile) AND NOT FileExists(workLogFile)) THEN
    violations.Add({
      type: "ORPHANED_DIRECTORY",
      severity: "MEDIUM",
      action: "DELETE or move to _ARCHIVE/"
    })
  END IF
  
  RETURN violations
  
END FUNCTION


FUNCTION ExtractInvokers(content):
  """
  Extract names of prompts that invoke/call this prompt
  
  Patterns to detect:
  - "invoked by xyz.prompt.md"
  - "Called by xyz.prompt.md"
  - "calls: [xyz.prompt.md]" (reverse - this is the caller)
  - "Do not call directly. Use xyz.prompt.md"
  """
  
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


FUNCTION DetectPromptConflicts(promptList):
  """
  Detect overlapping responsibilities between cleanup/validation prompts
  
  Returns conflicts with overlap description
  """
  
  conflicts = []
  scopes = {}
  
  FOR EACH promptFile IN promptList:
    content = ReadFile(promptFile)
    scope = ExtractScope(content)
    scopes[promptFile] = scope
  END FOR
  
  # Check for overlaps
  FOR i = 0 TO promptList.Count - 2:
    FOR j = i + 1 TO promptList.Count - 1:
      overlap = FindScopeOverlap(scopes[promptList[i]], scopes[promptList[j]])
      IF overlap.Count > 0 THEN
        conflicts.Add({
          prompts: [promptList[i], promptList[j]],
          overlap: Join(overlap, ", ")
        })
      END IF
    END FOR
  END FOR
  
  RETURN conflicts
  
END FUNCTION


FUNCTION ExtractScope(content):
  """Extract scope keywords from prompt content"""
  
  scopes = []
  
  # Common scope keywords
  keywords = [
    "cleanup", "archive", "deprecated", "temporary", "duplicate",
    "validation", "healthcheck", "audit", "verify", "check",
    "reorganize", "move", "delete", "fix", "update"
  ]
  
  FOR EACH keyword IN keywords:
    IF content.ToLower().Contains(keyword) THEN
      scopes.Add(keyword)
    END IF
  END FOR
  
  RETURN scopes
  
END FUNCTION


FUNCTION FindScopeOverlap(scope1, scope2):
  """Find overlapping scope keywords"""
  
  overlap = []
  
  FOR EACH item IN scope1:
    IF scope2.Contains(item) THEN
      overlap.Add(item)
    END IF
  END FOR
  
  RETURN overlap
  
END FUNCTION


FUNCTION SearchReferences(templateFile):
  """Search for references to a template file in prompts/instructions"""
  
  references = []
  fileName = Path.GetFileName(templateFile)
  
  # Search in prompts
  promptFiles = GetFiles(".github/prompts/**/*.prompt.md")
  FOR EACH promptFile IN promptFiles:
    content = ReadFile(promptFile)
    IF content.Contains(fileName) THEN
      references.Add(promptFile)
    END IF
  END FOR
  
  # Search in instructions
  instructionFiles = GetFiles(".github/instructions/**/*.md")
  FOR EACH instructFile IN instructionFiles:
    content = ReadFile(instructFile)
    IF content.Contains(fileName) THEN
      references.Add(instructFile)
    END IF
  END FOR
  
  RETURN references
  
END FUNCTION
```

---

### Step 2: Move Deprecated Files to Archive

```
FUNCTION ArchiveDeprecatedFiles(deprecatedList):
  
  archiveBase = ".github/prompts/shared/archive/deprecated-2025-10-30/"
  CreateDirectory(archiveBase)
  
  FOR EACH item IN deprecatedList:
    sourceFile = item.file
    targetDir = archiveBase + Path.GetFileName(sourceFile)
    
    # Create archive with metadata
    metadata = {
      "originalPath": sourceFile,
      "archivedDate": Now(),
      "reason": item.reason,
      "supersededBy": ".github/MANDATORY.md"
    }
    
    MoveFile(sourceFile, targetDir)
    WriteFile(targetDir + ".metadata.json", ToJson(metadata))
    
    Log("Archived: {sourceFile} → {targetDir}")
  END FOR
  
  # Create archive index
  indexContent = GenerateArchiveIndex(deprecatedList)
  WriteFile(archiveBase + "README.md", indexContent)
  
  RETURN {
    archived: deprecatedList.Count,
    location: archiveBase
  }
  
END FUNCTION
```

---

### Step 3: Reorganize Misplaced Files

```
FUNCTION ReorganizeMisplacedFiles(misplacedList):
  
  organizationMap = {
    # Documentation files
    "README.md": "Workspaces/Documentation/GitHub/",
    "*-guide.md": "Workspaces/Documentation/Guides/",
    "*-reference.md": "Workspaces/Documentation/References/",
    "*-quickref.md": "Workspaces/Documentation/QuickRefs/",
    
    # Analysis files
    "*-analysis.md": "Workspaces/Copilot/_DOCS/analysis/",
    "*-report.md": "Workspaces/Copilot/_DOCS/summaries/",
    
    # Configuration docs
    "*-config.md": "Workspaces/Copilot/_DOCS/configs/",
    
    # Internal prompts (auto-invoked by other agentic prompts)
    "INTERNAL_PROMPT": ".github/prompts/internal/shared/"
  }
  
  FOR EACH item IN misplacedList:
    sourceFile = item.file
    fileName = Path.GetFileName(sourceFile)
    
    # Special handling for internal prompts
    IF item.type == "INTERNAL_PROMPT" THEN
      targetDir = ".github/prompts/internal/shared/"
      CreateDirectory(targetDir)
      targetPath = Path.Combine(targetDir, fileName)
      
      MoveFile(sourceFile, targetPath)
      Log("Moved internal prompt: {sourceFile} → {targetPath}")
      Log("  Invoked by: {item.reason}")
      
      # Update references in calling prompts
      UpdatePromptReferences(sourceFile, targetPath)
      CONTINUE
    END IF
    
    # Determine target based on pattern
    targetDir = DetermineTargetDirectory(fileName, organizationMap)
    
    IF targetDir THEN
      CreateDirectory(targetDir)
      targetPath = Path.Combine(targetDir, fileName)
      
      MoveFile(sourceFile, targetPath)
      Log("Moved: {sourceFile} → {targetPath}")
    ELSE
      # Default to general documentation
      targetPath = "Workspaces/Documentation/General/" + fileName
      MoveFile(sourceFile, targetPath)
    END IF
  END FOR
  
  RETURN {
    reorganized: misplacedList.Count
  }
  
END FUNCTION


FUNCTION UpdatePromptReferences(oldPath, newPath):
  """
  Update all references to a moved internal prompt in calling prompts
  
  Example:
  - Old: Execute("xyz.prompt.md")
  - New: Execute("internal/shared/xyz.prompt.md")
  """
  
  fileName = Path.GetFileName(oldPath)
  newRelativePath = "internal/shared/" + fileName
  
  # Scan all prompts that might reference this
  allPrompts = GetFiles(".github/prompts/**/*.prompt.md")
  
  updatedFiles = []
  
  FOR EACH promptFile IN allPrompts:
    # Skip the moved file itself
    IF promptFile == newPath THEN CONTINUE
    
    content = ReadFile(promptFile)
    originalContent = content
    
    # Pattern 1: Execute("xyz.prompt.md")
    content = Regex.Replace(content, 
      @"Execute\([""']" + fileName + @"[""']",
      "Execute(\"" + newRelativePath + "\"")
    
    # Pattern 2: invoke xyz.prompt.md
    content = Regex.Replace(content,
      @"invoke\s+" + fileName,
      "invoke " + newRelativePath)
    
    # Pattern 3: calls: [xyz.prompt.md]
    content = content.Replace(
      "calls: [" + fileName + "]",
      "calls: [" + newRelativePath + "]")
    
    # Pattern 4: Markdown links
    content = Regex.Replace(content,
      @"\[([^\]]+)\]\(" + fileName + @"\)",
      "[$1](" + newRelativePath + ")")
    
    IF content != originalContent THEN
      WriteFile(promptFile, content)
      updatedFiles.Add(promptFile)
      Log("Updated references in: {promptFile}")
    END IF
  END FOR
  
  RETURN updatedFiles
  
END FUNCTION
```

---

### Step 4: Clean Temporary Files

```
FUNCTION CleanTemporaryFiles(temporaryList):
  
  deletedFiles = []
  
  FOR EACH item IN temporaryList:
    file = item.file
    
    # Safety check - confirm it's actually temporary
    IF IsTemporaryFile(file) THEN
      DeleteFile(file)
      deletedFiles.Add(file)
      Log("Deleted: {file}")
    ELSE
      Log("Skipped (safety check failed): {file}")
    END IF
  END FOR
  
  RETURN {
    deleted: deletedFiles.Count,
    files: deletedFiles
  }
  
END FUNCTION


FUNCTION IsTemporaryFile(filePath):
  fileName = Path.GetFileName(filePath)
  
  temporaryPatterns = [
    "*.tmp",
    "*.bak",
    "*~",
    "temp-*",
    "*-backup.*",
    "*-old.*",
    "*.swp"
  ]
  
  FOR EACH pattern IN temporaryPatterns:
    IF MatchesPattern(fileName, pattern) THEN
      RETURN true
    END IF
  END FOR
  
  RETURN false
  
END FUNCTION
```

---

### Step 5: Fix KDS Violations

```
FUNCTION FixKDSViolations(violationsList):
  
  fixed = []
  archived = []
  
  FOR EACH item IN violationsList:
    keyPath = item.key
    keyName = Path.GetFileName(keyPath)
    
    FOR EACH violation IN item.violations:
      
      IF violation.type == "MISSING_WORKLOG" THEN
        # Create basic work-log.md
        template = GenerateWorkLogTemplate(keyName)
        WriteFile(Path.Combine(keyPath, "work-log.md"), template)
        fixed.Add({key: keyName, fix: "Created work-log.md"})
        
      ELSE IF violation.type == "MISSING_PLAN" THEN
        # Create placeholder plan
        template = GeneratePlanTemplate(keyName)
        WriteFile(Path.Combine(keyPath, "{keyName}.plan.md"), template)
        fixed.Add({key: keyName, fix: "Created plan.md"})
        
      ELSE IF violation.type == "STALE_KEY" AND violation.daysSinceUpdate > 90 THEN
        # Archive stale keys
        archivePath = ".github/key-data-streams/_ARCHIVE/{keyName}/"
        MoveDirectory(keyPath, archivePath)
        archived.Add({key: keyName, reason: "Stale (>90 days)"})
        
      ELSE IF violation.type == "ORPHANED_DIRECTORY" THEN
        # Archive orphaned directories
        archivePath = ".github/key-data-streams/_ARCHIVE/orphaned/{keyName}/"
        MoveDirectory(keyPath, archivePath)
        archived.Add({key: keyName, reason: "Orphaned directory"})
        
      END IF
      
    END FOR
  END FOR
  
  RETURN {
    fixed: fixed.Count,
    archived: archived.Count,
    details: {fixed, archived}
  }
  
END FUNCTION
```

---

### Step 6: Detect and Replace Deprecated References (AUTO-EXECUTE EVERY RUN)

**Purpose:** Automatically scan ALL prompts and instructions for deprecated file references and replace them

**Execution:** Runs automatically on every cleanup invocation (no user flag needed)

**Deprecated Files (archived 2025-10-30):**
- `CONCISE-MANDATE.md` → `MANDATORY.md` (Rule 1: No Code in Chat)
- `snippet-handling-policy.md` → `MANDATORY.md` (Rule 1: detailed implementation)
- `output-style-mandate.md` → `MANDATORY.md` (Rule 1: output format)

```
FUNCTION DetectAndReplaceDeprecatedReferences():
  
  # Scan all active files (exclude archives)
  filesToScan = [
    ".github/prompts/*.prompt.md",
    ".github/prompts/shared/*.md" (EXCLUDE "archive/"),
    ".github/prompts/internal/**/*.md",
    ".github/instructions/*.md",
    ".github/instructions/Links/*.md"
  ]
  
  # Deprecated reference detection patterns
  deprecatedRefs = {
    "CONCISE-MANDATE.md": {
      replacement: "MANDATORY.md",
      context: "Rule 1 (No Code in Chat)",
      severity: "HIGH",
      patterns: [
        "`.github/prompts/shared/CONCISE-MANDATE.md`",
        "`CONCISE-MANDATE.md`",
        "See CONCISE-MANDATE.md",
        "LOAD CONCISE-MANDATE.md",
        "follow CONCISE-MANDATE.md",
        "CONCISE-MANDATE.md compliance",
        "ValidateConciseMandate"
      ]
    },
    "snippet-handling-policy.md": {
      replacement: "MANDATORY.md",
      context: "Rule 1 (detailed implementation)",
      severity: "HIGH",
      patterns: [
        "`.github/prompts/shared/snippet-handling-policy.md`",
        "`snippet-handling-policy.md`",
        "See snippet-handling-policy.md",
        "LOAD snippet-handling-policy.md",
        "snippet handling policy"
      ]
    },
    "output-style-mandate.md": {
      replacement: "MANDATORY.md",
      context: "Rule 1 (output format)",
      severity: "HIGH",
      patterns: [
        "`.github/prompts/shared/output-style-mandate.md`",
        "`output-style-mandate.md`",
        "See output-style-mandate.md",
        "LOAD output-style-mandate.md",
        "output style mandate"
      ]
    }
  }
  
  violations = []
  
  # DETECTION PHASE
  FOR EACH filePattern IN filesToScan:
    files = GetFiles(filePattern)
    
    FOR EACH file IN files:
      # Skip archived files
      IF file.Contains("archive/") OR file.Contains("_ARCHIVE/") OR file.Contains("deprecated-") THEN
        CONTINUE
      END IF
      
      content = ReadFile(file)
      
      FOR EACH oldRef, metadata IN deprecatedRefs:
        FOR EACH pattern IN metadata.patterns:
          IF content.Contains(pattern, ignoreCase=true) THEN
            lineNumber = FindLineNumber(content, pattern)
            violations.Add({
              file: file,
              line: lineNumber,
              deprecated: oldRef,
              replacement: metadata.replacement,
              context: metadata.context,
              severity: metadata.severity,
              foundPattern: pattern
            })
          END IF
        END FOR
      END FOR
    END FOR
  END FOR
  
  # AUTO-FIX PHASE
  fixedFiles = []
  
  GROUP violations BY file:
    file = group.Key
    refs = group.Values
    
    content = ReadFile(file)
    originalContent = content
    
    FOR EACH ref IN refs:
      oldPattern = ref.foundPattern
      
      # Determine replacement pattern based on context
      IF oldPattern.Contains("**LOAD:**") THEN
        # Critical LOAD reference - use full format
        newPattern = "**LOAD:** `.github/MANDATORY.md` ({ref.context})"
      ELSE IF oldPattern.Contains("See ") THEN
        # Documentation reference
        newPattern = "See `.github/MANDATORY.md` ({ref.context})"
      ELSE IF oldPattern.Contains("ValidateConciseMandate") THEN
        # Function name
        newPattern = "ValidateMandatoryCompliance"
      ELSE IF oldPattern.Contains("compliance") THEN
        newPattern = "MANDATORY.md compliance"
      ELSE
        # Simple reference - replace filename only
        newPattern = oldPattern.Replace(ref.deprecated, ref.replacement)
      END IF
      
      content = content.Replace(oldPattern, newPattern)
    END FOR
    
    IF content != originalContent THEN
      WriteFile(file, content)
      fixedFiles.Add({
        file: file,
        refsFixed: refs.Count,
        deprecated: refs.Select(r => r.deprecated).Distinct()
      })
    END IF
  END GROUP
  
  # LOGGING
  LogToFile(".github/audits/deprecated-refs-{timestamp}.log", {
    scan: {
      filesScanned: filesToScan.Count,
      violationsFound: violations.Count,
      severity: violations.GroupBy(v => v.severity)
    },
    fixes: {
      filesFixed: fixedFiles.Count,
      details: fixedFiles
    }
  })
  
  RETURN {
    scanned: filesToScan.Count,
    violations: violations.Count,
    fixed: fixedFiles.Count,
    details: fixedFiles
  }
  
END FUNCTION
```

**Output Format:**
```markdown
## 🔍 Deprecated Reference Detection (Step 6)

**Files Scanned**: {count} (excluding archives)
**Violations Found**: {count}
**Severity Breakdown**:
- HIGH: {count}
- MEDIUM: {count}
- LOW: {count}

### Violations by File

| File | Deprecated Ref | Line | Replacement | Severity |
|------|---------------|------|-------------|----------|
| plan.prompt.md | CONCISE-MANDATE.md | 76 | MANDATORY.md | HIGH |
| task.prompt.md | output-style-mandate.md | 22 | MANDATORY.md | HIGH |
| cohesion.prompt.md | ValidateConciseMandate | 345 | ValidateMandatoryCompliance | HIGH |

### Auto-Fix Results

✅ Fixed {count} files automatically:
- plan.prompt.md: 2 refs (CONCISE-MANDATE.md, output-style-mandate.md)
- task.prompt.md: 1 ref (output-style-mandate.md)
- cohesion.prompt.md: 3 refs (ValidateConciseMandate)

📝 Audit log saved: `.github/audits/deprecated-refs-{timestamp}.log`

**Action Required**: Review changes and commit with message:
```
refactor(prompts): auto-fix deprecated references detected by cleanup agent
```
```

---

### Step 7: Fix Orphaned Tests

```
FUNCTION FixOrphanedTests(orphanedList):
  
  fixed = []
  
  FOR EACH item IN orphanedList:
    testFile = item.file
    
    IF item.action == "CREATE_REGISTRY" THEN
      # Create new test-registry.md
      registryPath = Path.Combine(Path.GetDirectory(testFile), "test-registry.md")
      content = GenerateTestRegistry([testFile])
      WriteFile(registryPath, content)
      fixed.Add({test: testFile, action: "Created registry"})
      
    ELSE IF item.action == "ADD_TO_REGISTRY" THEN
      # Add to existing registry
      registryPath = Path.Combine(Path.GetDirectory(testFile), "test-registry.md")
      AppendToRegistry(registryPath, testFile)
      fixed.Add({test: testFile, action: "Added to registry"})
      
    END IF
  END FOR
  
  RETURN {
    fixed: fixed.Count,
    details: fixed
  }
  
END FUNCTION


FUNCTION GenerateTestRegistry(testFiles):
  content = """# Test Registry

**Purpose:** Inventory of all tests for this key
**Last Updated:** {Now()}

## Tests

| Test File | Type | Status | Run Command |
|-----------|------|--------|-------------|
"""
  
  FOR EACH testFile IN testFiles:
    fileName = Path.GetFileName(testFile)
    content += "| {fileName} | E2E | Active | npx playwright test {fileName} |\n"
  END FOR
  
  RETURN content
  
END FUNCTION
```

---

### Step 8: Resolve Prompt Conflicts (REPORT ONLY - NO AUTO-FIX)

```
FUNCTION ResolvePromptConflicts(conflictsList):
  """
  Document and propose resolution for overlapping prompt responsibilities
  
  ⚠️ CRITICAL: This function REPORTS conflicts only - does NOT modify prompt content
  User must manually resolve conflicts based on recommendations
  """
  
  resolutions = []
  
  FOR EACH conflict IN conflictsList:
    prompts = conflict.prompts
    overlap = conflict.overlap
    
    # Analyze which prompt should own each responsibility
    resolution = AnalyzeOwnership(prompts, overlap)
    
    resolutions.Add({
      conflict: conflict,
      recommendation: resolution.recommendation,
      action: resolution.action,
      userAction: "MANUAL_REVIEW_REQUIRED"  # Flag for user intervention
    })
  END FOR
  
  # Create conflict report file (do NOT modify prompts)
  reportPath = ".github/audits/prompt-conflicts-{timestamp}.md"
  WriteConflictReport(reportPath, resolutions)
  
  RETURN {
    resolved: 0,  # No auto-resolution
    reported: resolutions.Count,
    reportPath: reportPath,
    details: resolutions
  }
  
END FUNCTION


FUNCTION AnalyzeOwnership(prompts, overlap):
  """
  Determine which prompt should own overlapping responsibilities
  
  ⚠️ REPORT ONLY - Does NOT modify any prompt files
  
  Separation of Concerns:
  - cleanup-copilot-mess.prompt.md: Automated post-execution cleanup (.github focus)
  - cleanup.prompt.md: User-initiated workspace-wide reorganization (all folders)
  - healthcheck.prompt.md: Read-only validation and reporting (no changes)
  """
  
  recommendation = ""
  action = ""
  
  # Example separation rules
  IF overlap.Contains("validation") OR overlap.Contains("audit") THEN
    recommendation = "healthcheck.prompt.md owns validation/audit (read-only)"
    action = "USER ACTION: Review cleanup prompts and remove validation logic if found"
    
  ELSE IF overlap.Contains("archive") OR overlap.Contains("deprecated") THEN
    IF prompts.Contains("cleanup-copilot-mess") THEN
      recommendation = "cleanup-copilot-mess.prompt.md owns .github/ cleanup (automated)"
      action = "USER ACTION: Update cleanup.prompt.md to exclude .github/ folder from scope"
    ELSE
      recommendation = "cleanup.prompt.md owns workspace-wide cleanup (user-initiated)"
      action = "USER ACTION: Keep workspace cleanup in cleanup.prompt.md"
    END IF
    
  ELSE IF overlap.Contains("reorganize") OR overlap.Contains("move") THEN
    recommendation = "cleanup.prompt.md owns reorganization (user-initiated with approval)"
    action = "USER ACTION: Limit cleanup-copilot-mess to file archiving only, not reorganization"
    
  END IF
  
  RETURN {
    recommendation: recommendation,
    action: action
  }
  
END FUNCTION


FUNCTION WriteConflictReport(reportPath, resolutions):
  """
  Write conflict analysis to audit file for user review
  
  Does NOT modify any prompt files - user must manually resolve
  """
  
  report = """# Prompt Conflict Analysis Report

**Generated:** {Now()}
**Purpose:** Document overlapping responsibilities between cleanup/validation prompts

## Summary

**Conflicts Detected:** {resolutions.Count}
**Auto-Resolutions:** 0 (manual review required)
**Action Required:** User must review and manually update prompts

---

## Detected Conflicts

"""
  
  FOR EACH resolution IN resolutions:
    report += """
### Conflict {index}: {Join(resolution.conflict.prompts, " vs ")}

**Overlapping Scope:** {resolution.conflict.overlap}

**Recommendation:** {resolution.recommendation}

**Required Action:** {resolution.action}

**Files to Review:**
"""
    FOR EACH promptFile IN resolution.conflict.prompts:
      report += "- `{promptFile}`\n"
    END FOR
    
    report += "\n---\n"
  END FOR
  
  report += """
## Next Steps

1. Review each conflict above
2. Manually update prompts to clarify separation of concerns
3. Update prompt headers with scope clarifications
4. Test affected prompts after changes
5. Re-run cleanup agent to verify conflicts resolved

**CRITICAL:** Do NOT have cleanup agent auto-modify prompt logic
This is a report-only analysis - user retains final control

"""
  
  WriteFile(reportPath, report)
  
  RETURN reportPath
  
END FUNCTION
```

---

## Output Format

### During Execution (Concise)

```
🧹 Cleanup Started...

📂 Scanning:
- .github/prompts/ (including shared/)
- .github/instructions/
- .github/key-data-streams/
- .github/audits/ (old logs)
- .github/hooks/ (obsolete scripts)
- .github/scripts/ (deprecated files)
- .github/templates/ (unreferenced)
- .github/tests/

✅ Results:
- Deprecated: 5 files → Archived (3 from shared/, 2 from scripts/)
- Misplaced: 3 files → Reorganized (1 doc from shared/)
- Internal Prompts: 1 → Moved to internal/shared/
- Temporary: 5 files → Deleted
- KDS Violations: 2 keys → Fixed
- Orphaned Tests: 1 test → Registry created
- Orphaned Templates: 1 → Flagged for review
- Old Audit Logs: 8 → Archived (>30 days)
- Prompt Conflicts: 2 detected → REPORTED (user action required)
- Updated References: 6 files (path updates only)

📋 Reports Generated:
- .github/audits/prompt-conflicts-{timestamp}.md (REVIEW REQUIRED)

⚠️  USER ACTION REQUIRED:
Review conflict report and manually update prompts to clarify scopes

💾 Commit:
- Files changed: 20
- Commit: cleanup(auto): comprehensive .github cleanup + conflict analysis

🎯 Status: Complete
```

### After Completion (Detailed Summary in work-log.md)

```
## Cleanup Summary (Auto-executed)

**Timestamp:** {ISO-8601}
**Trigger:** End of {key} task execution

### Actions Taken

**1. Deprecated Files Archived (5)**
- .github/prompts/shared/CONCISE-MANDATE.md
- .github/prompts/shared/snippet-handling-policy.md
- .github/prompts/shared/output-style-mandate.md
- .github/scripts/old-deploy.ps1 (marked obsolete)
- .github/scripts/deprecated-helper.ps1
→ Moved to: .github/prompts/shared/archive/deprecated-2025-10-30/
→ Scripts moved to: .github/scripts/_archive/

**2. Misplaced Files Reorganized (3)**
- .github/prompts/migration-guide.md → Workspaces/Documentation/Guides/
- .github/instructions/analysis-report.md → Workspaces/Copilot/_DOCS/analysis/
- .github/prompts/shared/user-guide.md → Workspaces/Documentation/GitHub/ (informational doc)
- **Internal Prompts:**
  - .github/prompts/auto-helper.prompt.md → .github/prompts/internal/shared/
    - Invoked by: task.prompt.md, plan.prompt.md
    - Updated 2 references in calling prompts

**3. Temporary Files Deleted (5)**
- .github/prompts/temp-analysis.md
- .github/key-data-streams/hcp/work-log.bak
- (3 additional)

**4. KDS Violations Fixed (2)**
- test-sample-plan: Created missing work-log.md
- old-experiment: Archived (90+ days stale)

**5. Orphaned Tests Fixed (1)**
- hcp/tests/fab-button.spec.ts: Created test-registry.md

**6. Old Audit Logs Archived (8)**
- .github/audits/healthcheck-2025-09-15.log (45 days old)
- .github/audits/mandate-violations-2025-09-20.log (40 days old)
- (6 additional logs >30 days)
→ Moved to: .github/audits/_archive/2025-10-30/

**7. Orphaned Templates Flagged (1)**
- .github/templates/unused-template.md (no references found)
→ Action: Review or archive

**8. Prompt Conflicts Documented (2)**
- cleanup-copilot-mess vs cleanup.prompt: Overlapping "archive" and "deprecated" scope
  - **Recommendation**: cleanup-copilot-mess owns .github/ auto-cleanup, cleanup.prompt owns user-initiated workspace cleanup
  - **Status**: REPORTED - User must manually update cleanup.prompt.md to exclude .github/
- cleanup-copilot-mess vs healthcheck: Overlapping "validation" scope
  - **Recommendation**: healthcheck owns read-only validation, cleanup-copilot-mess performs fixes
  - **Status**: REPORTED - User must manually review and clarify scopes
- **Report Generated**: `.github/audits/prompt-conflicts-{timestamp}.md`

**9. References Updated (6)**
- task.prompt.md: CONCISE-MANDATE.md → MANDATORY.md
- plan.prompt.md: snippet-handling-policy.md → MANDATORY.md (Rule 1)
- cleanup.prompt.md: Note added (refer to conflict report for scope clarification)
- healthcheck.prompt.md: Note added (cleanup-copilot-mess handles fixes)
- (2 additional path updates for moved files)

### Commit

```
git add .
git commit -m "cleanup(auto): comprehensive .github cleanup + conflict analysis

- Archived 5 deprecated files (3 from shared/, 2 scripts)
- Reorganized 3 misplaced documentation files
- Moved 1 internal prompt to internal/shared/ (auto-invoked by plan/task)
  - Updated references in 2 calling prompts
- Deleted 5 temporary files
- Fixed 2 KDS violations
- Created/updated test registries for 1 orphaned test
- Archived 8 old audit logs (>30 days)
- Flagged 1 orphaned template for review
- **DOCUMENTED** 2 prompt conflicts (report generated, USER ACTION REQUIRED)
- Updated 6 file references (path updates only, NO LOGIC CHANGES)

⚠️ REVIEW REQUIRED: .github/audits/prompt-conflicts-{timestamp}.md
   Manual updates needed to resolve scope overlaps

[cleanup-copilot-mess.prompt.md] [auto-run] [file-ops-only]
"
```
- Moved 1 internal prompt to internal/shared/ (auto-invoked by plan/task)
  - Updated references in 2 calling prompts
- Deleted 5 temporary files
- Fixed 2 KDS violations
- Created/updated test registries for 1 orphaned test
- Updated 4 deprecated references to MANDATORY.md

[cleanup-copilot-mess.prompt.md] [auto-run]
"
```

### Verification

- All deprecated files archived with metadata
- All references updated to MANDATORY.md
- KDS structure compliant
- No temporary files remaining
- All tests registered

**Status:** ✅ Cleanup complete
```

---

## Integration with Other Prompts

### plan.prompt.md Integration

**Add to Step 7 (Handoff):**

```markdown
### Step 7.25: Auto-Cleanup (Optional - based on key status)

**Execute BEFORE final response if:**
- Key status = "complete" OR "ready-for-review"
- Plan has ≥3 phases (significant work done)

**Skip if:**
- Key status = "in-progress" (more work expected)
- User explicitly skipped with `cleanup=false` parameter

```powershell
IF KeyStatus == "complete" AND PhaseCount >= 3 THEN
  
  # Run cleanup agent
  Execute("cleanup-copilot-mess.prompt.md", {
    key: CurrentKey,
    mode: "auto",
    verbosity: "concise"
  })
  
  # Commit cleanup changes
  git add .
  git commit -m "cleanup(auto): post-{key} cleanup"
  
END IF
```

**Log:**
- Cleanup executed: {yes|no}
- Files affected: {count}
- Commit SHA: {sha}
```

### task.prompt.md Integration

**Add to Step 9 (Completion):**

```markdown
### Step 9.15: Auto-Cleanup (BEFORE Response Validation)

**Execute if this is the FINAL task for the key:**

```powershell
IF IsFinalTask(key, phase) THEN
  
  # Run cleanup
  cleanupResult = Execute("cleanup-copilot-mess.prompt.md", {
    key: key,
    mode: "auto",
    trigger: "task-completion"
  })
  
  # Log to work-log.md
  AppendWorkLog(cleanupResult)
  
  # Commit
  git add .
  git commit -m "cleanup(auto): final cleanup for {key}"
  
END IF
```
```

---

## Safety Mechanisms

### 1. Dry Run Mode

**Parameter:** `dry-run=true`

- Scan and report what WOULD be changed
- No files moved/deleted
- Output preview of changes
- User can approve before actual execution

### 2. Backup Before Cleanup

**Protocol:**
```powershell
# Create backup commit before cleanup
git add .
git commit -m "checkpoint: before automated cleanup"
$backupSHA = git rev-parse --short HEAD

# Run cleanup
Execute-Cleanup

# If cleanup fails
IF $LASTEXITCODE -ne 0 THEN
  git reset --hard $backupSHA
  THROW "Cleanup failed - rolled back to $backupSHA"
END IF
```

### 3. Archive, Don't Delete (for important files)

**Rule:**
- Deprecated files → Archive with metadata (don't delete)
- Temporary files → Delete only (*.tmp, *.bak)
- Stale keys → Archive to _ARCHIVE/ (don't delete)
- Orphaned directories → Archive (don't delete unless empty)

### 4. User Confirmation for High-Impact Changes

**Trigger confirmation if:**
- ≥10 files will be affected
- Any files in `.github/prompts/*.prompt.md` (active prompts)
- Any files in `.github/instructions/*.md` (core instructions)

**Prompt:**
```
⚠️ High-Impact Cleanup Detected

Changes:
- 15 files will be affected
- 3 deprecated mandate files will be archived
- 2 stale keys will be archived

Approve cleanup? (Y/n):
```

---

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `key` | string | current | Key context (for logging) |
| `mode` | string | "manual" | `auto` (silent) or `manual` (interactive) |
| `dry-run` | boolean | false | Preview changes without executing |
| `verbosity` | string | "concise" | `concise` or `detailed` |
| `scope` | string | "all" | `prompts`, `instructions`, `kds`, or `all` |
| `cleanup=false` | boolean | N/A | Skip cleanup (when invoked from plan/task) |

---

## Examples

### Manual Invocation

```
@workspace /cleanup key=hcp mode=manual verbosity=detailed

# Or shorthand
@workspace /clean-copilot-mess
```

### Auto-Invocation from plan.prompt.md

```
# In {key}.plan.md Phase N:
- Task N: **AUTO-CLEANUP** - cleanup-copilot-mess.prompt.md (mode=auto)
```

### Dry Run

```
@workspace /cleanup dry-run=true

# Output:
🧹 Cleanup Preview (DRY RUN)

Would Archive:
- CONCISE-MANDATE.md → archive/deprecated-2025-10-30/

Would Move:
- migration-guide.md → Workspaces/Documentation/Guides/

Would Delete:
- temp-analysis.md (temporary file)

Would Fix:
- test-sample-plan: Create work-log.md

Run cleanup? (Y/n):
```

---

## Maintenance

### Updating Cleanup Rules

**If new cleanup patterns needed:**

1. User approves new pattern
2. Add to appropriate section (Step 1-7)
3. Test with dry-run
4. Update version number
5. Document in changelog

**Example:**
```markdown
## Changelog

### v1.2.0 (2025-10-30)
- **🚨 CRITICAL SAFEGUARDS**: File operations only - NEVER modify prompt/instruction logic
  - Added "NEVER MODIFY PROMPT/INSTRUCTION LOGIC" section with absolute prohibitions
  - Defined Safe Harbor files (mandates, protocols, algorithms, core instructions)
  - Added IsSafeHarbor() function to protect critical files from archiving
  - Changed Step 8 to REPORT-ONLY (no auto-modification of prompts)
  - Added WriteConflictReport() for user-reviewed manual conflict resolution
- **COMPREHENSIVE .GITHUB COVERAGE**: Extended cleanup to all .github subfolders
  - Added shared/ folder comprehensive scan (deprecated + misplaced docs)
  - Added audits/ folder cleanup (archive logs >30 days)
  - Added hooks/, scripts/, templates/, tests/ obsolete content detection
- **CONFLICT DETECTION**: Detect and REPORT overlapping prompt responsibilities
  - Added Step 8: Prompt conflict detection (report-only, no auto-fix)
  - Defined separation of concerns: cleanup-copilot-mess (auto .github), cleanup.prompt (user workspace), healthcheck (read-only)
  - Generates audit report for user manual resolution
- **KDS EFFICIENCY**: Duplicate documentation and instruction validation
  - Detect orphaned templates (not referenced in prompts/instructions)
  - Flag conflicting guidance across prompts (no auto-resolution)
- **HELPER FUNCTIONS**: DetectPromptConflicts, SearchReferences, AnalyzeOwnership, WriteConflictReport, IsSafeHarbor

### v1.1.0 (2025-10-30)
- Added internal prompt organization to internal/shared/
- Auto-detection of prompts invoked by other agentic prompts
- Auto-update of references in calling prompts
- Manual override support via `location: root` metadata

### v1.0.0 (2025-10-30)
- Initial release
- Deprecated file archiving
- Misplaced file reorganization
- Temporary file cleanup
- KDS violation detection and fixes
- Orphaned test registry creation
- Deprecated reference auto-replacement
```

### Never Auto-Update This Prompt

**Protection:**
- This prompt follows MANDATORY.md modification rules
- User approval required for changes
- No autonomous updates by agents
- Version controlled

---

## See Also

- `.github/MANDATORY.md` - Operating rules (must load first)
- `.github/prompts/shared/cleanup-orchestrator.md` - Component cleanup patterns
- `.github/prompts/shared/completion-workflow-template.md` - Completion workflows
- `.github/key-data-streams/README.md` - KDS structure guidelines

---

**Last Updated:** 2025-10-30  
**Version:** 1.2.0  
**Maintainer:** User (requires approval for changes)
