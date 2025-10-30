# cohesion.prompt.md (System Cohesion & KDS Management Agent v2.0)

---
mode: agent
purpose: Meta-agent that validates/harmonizes all prompts/instructions AND manages .github/ KDS structure and cleanup
inputs: scope (prompts|instructions|all|copilot-workspace|specific-file), validation-level (syntax|cross-ref|rules|conflicts|full|kds-cleanup), auto-fix, cleanup-mode, -test
outputs: Cohesion report with violations, conflicts, KDS cleanup results, and auto-fix recommendations
lastUpdated: 2025-10-30
stateTracking: enabled
calls: [.github/prompts/internal/enhance-prompts.prompt.md]
supersedes: [.github/prompts/cleanup-copilot-mess.prompt.md]
relatedFiles: [
  .github/prompts/internal/enhance-prompts.prompt.md,
  .github/prompts/shared/validation-engine.md,
  .github/prompts/shared/integration-protocol.md
]
---

# cohesion.prompt.md (System Cohesion & KDS Management)

**⚠️ LOAD FIRST:** `.github/MANDATORY.md` (Enforce: No code in chat | Document first | Playwright orchestration)

**Mode:** Agent | **Purpose:** Ensure all prompts/instructions work as unified, conflict-free system + manage .github/ KDS structure and cleanup

**Version:** 2.0.0  
**Changelog:**
- **v2.0.0 (2025-10-30)**: KDS CLEANUP INTEGRATION - Merged cleanup-copilot-mess.prompt.md functionality
  - Added `validation-level=kds-cleanup` for KDS structure validation + cleanup execution
  - Added `auto-fix` parameter for cleanup execution control
  - Added `cleanup-mode` parameter for granular cleanup control (full/archive-only/organize-only)
  - Integrated 7 cleanup functions: KDS validation, deprecated archiving, internal prompt organization, temp cleanup, test registry management
  - Scope: .github/ folder only (prompts, instructions, key-data-streams, audits)
  - Auto-invoked from plan.prompt.md Step 7.25 and task.prompt.md Step 9.15 (replaces cleanup-copilot-mess)
  - Safety: Safe harbor files, risk-based approval, git rollback support
- **v1.2.0 (2025-10-28)**: STATE TRACKING INTEGRATION - Added state-tracker.ps1 integration for cohesion audit logging (uses "cohesion-audit" key)

## Parameters

### scope *(required)*
What to validate:
- `prompts` - All prompt files in .github/prompts/
- `instructions` - All instruction files in .github/instructions/
- `all` - Complete AI infrastructure (prompts + instructions)
- `copilot-workspace` - **NEW v2.1** - Validate .copilot/CONTEXT/ for MANDATORY.md violations
- `{filename}` - Specific file to validate

### key *(optional, auto-generated)*
Unique identifier for cohesion validation session.

**Default**: `cohesion-{timestamp}` (e.g., `cohesion-20251028-143500`)  
**User-provided**: `cohesion-{description}` (e.g., `cohesion-pre-release-audit`)

**Examples:**
```bash
@workspace /cohesion scope=all key=cohesion-weekly-scan
@workspace /cohesion scope=prompts key=cohesion-prompt-audit
@workspace /cohesion scope=all  # Auto: cohesion-20251028-143500
```

**Note**: Work-log and reports saved to `.github/key-data-streams/{key}/`

### validation-level *(optional, default=syntax)*
Depth of validation:
- `syntax` - Quick structural validation
- `cross-ref` - Reference checking
- `rules` - Compliance validation
- `conflicts` - Deep conflict detection
- `full` - All validation levels (1-5)
- `kds-cleanup` - **NEW v2.0** - KDS structure validation + cleanup execution (includes all levels 1-5 + KDS operations)

**KDS-Cleanup Mode** (validation-level=kds-cleanup):
- Validates `.github/` folder structure (prompts, instructions, key-data-streams, audits)
- Detects: deprecated files, misplaced docs, internal prompts in wrong location, temp files, KDS violations, orphaned tests, deprecated references
- Executes cleanup if `auto-fix=true` (archive, move, delete, create, update operations)
- Scope: `.github/` folder ONLY (workspace cleanup handled by cleanup.prompt.md)

**Example:**
```bash
@workspace /cohesion scope=all validation-level=kds-cleanup auto-fix=true
```

### -test *(flag, optional)*
Enable post-execution validation using `.github/prompts/shared/prompt-test-validation-framework.md`

**Behavior:**
1. Execute cohesion workflow normally (validate scope, detect conflicts, generate report)
2. After completion, run validation checks specific to cohesion.prompt.md
3. Generate validation report with quality score (0-100)
4. If violations or incomplete validation: generate recommendations
5. Present findings to user

**Example:**
```bash
@workspace /cohesion scope=prompts -test validation-level=full
@workspace /cohesion scope=all -test
```

**Cohesion-Specific Validation Checks:**
- ✓ Cohesion report generated
- ✓ Validation level executed completely
- ✓ Conflict analysis performed (for conflicts/full level)
- ✓ Cross-reference validation complete
- ✓ No files modified (read-only validation)
- ✓ Recommendations provided for detected issues

**Validation Report Example:**
```markdown
📊 Cohesion Validation Report

Quality Score: 95/100 (Excellent)

✅ Critical: 0 violations
✅ High: 0 issues
📋 Low: 1 missed requirement
  - Cross-reference validation incomplete for internal prompts

What would you like to do next?
A. Accept results (excellent quality)
B. Run detailed cross-reference scan
C. Review detected conflicts in detail
D. Generate improvement plan
```

**See:** `.github/prompts/shared/prompt-test-validation-framework.md` for complete validation algorithm

### auto-fix *(optional, default=false)* **NEW v2.0**

Control cleanup execution behavior when `validation-level=kds-cleanup`

**Values:**
- `false` (default) - Report issues only, no file modifications
- `true` - Execute cleanup automatically with safety checks

**Safety Rules:**
- Low-risk operations: Automatic (temp files `*.tmp`, `*.bak`, deprecated reference updates)
- Medium-risk operations: Automatic with logging (archive deprecated files, move internal prompts)
- High-risk operations: User approval required (delete active prompts, modify critical files)
- **Safe Harbor Protection**: NEVER modifies `.github/MANDATORY.md`, `*-mandate.md`, `*-protocol.md`, `context-*.md`, `validation-*.md`, `step-*.md`

**Example:**
```bash
@workspace /cohesion validation-level=kds-cleanup auto-fix=true
```

### cleanup-mode *(optional, default=full)* **NEW v2.0**

Fine-tune KDS cleanup behavior when `validation-level=kds-cleanup` and `auto-fix=true`

**Values:**
- `full` (default) - All cleanup operations (archive, move, delete, create, update)
- `archive-only` - Archive deprecated files only, skip moves/deletes
- `organize-only` - Move internal prompts and misplaced docs, skip archive/delete
- `validate-only` - Detect violations without execution (same as auto-fix=false)

**Example:**
```bash
@workspace /cohesion validation-level=kds-cleanup auto-fix=true cleanup-mode=archive-only
```

## Critical Rules
**LOAD:** `.github/MANDATORY.md` (3 rules enforced before all work)

**Agent-Specific:**
- Read-only validation (auto-fix requires approval)
- Cross-reference all agents for handoff compatibility
- Report conflicts with severity levels
- Track validation history in work-log.md

## Core Responsibilities

### 1. Structural Integrity Validation
- Markdown syntax validation for all prompt/instruction files
- Frontmatter metadata presence (mode, purpose, inputs, outputs, lastUpdated)
- Required section validation per file type
- File reference accuracy (all @workspace and @codebase paths exist)
- Shared guidance cross-references (CONCISE-MANDATE, output-style-mandate, etc.)

### 2. Agent Orchestration Validation
- Handoff protocol compatibility checks
- Parameter definitions match across caller/receiver agents
- Key naming convention consistency
- Drift stack management rules alignment
- Multi-agent workflow coordination rules

### 3. Universal Standards Enforcement
- **MANDATORY.md** - 3 global rules (no code, document first, Playwright orchestration)
- **commit-checkpoint-protocol.md** (execution agents only)
- **SelfAwareness.instructions.md** (branch rules, database access, required reading)
- **agent-handoff-protocol.md** (handoff format, context carried)

### 4. Conflict Detection & Resolution
- Competing/contradictory instructions across files
- Overlapping agent jurisdictions
- Incompatible parameter definitions
- Shared file ownership disputes
- Circular dependency detection

### 5. Integration Point Verification
- **plan.prompt.md** → task.prompt.md handoff
- **task.prompt.md** → test-generation.prompt.md orchestration
- **drift.prompt.md** → plan.prompt.md queue handling
- **healthcheck.prompt.md** prompt optimization mode
- **todo.prompt.md** key detection from git history

### 6. KDS Structure Management **NEW v2.0** (validation-level=kds-cleanup)
- **Scope**: `.github/` folder ONLY (prompts, instructions, key-data-streams, audits)
- **Deprecated File Archiving**: Archive files marked "DEPRECATED", "DO NOT UPDATE", "obsolete" with metadata
- **Internal Prompt Organization**: Auto-detect and move prompts called by other agents to `.github/prompts/internal/shared/`
- **Misplaced Documentation**: Move informational docs from `.github/` to `Workspaces/Documentation/`
- **Temporary File Cleanup**: Delete `*.tmp`, `*.bak`, `temp-*.md`, `*-backup.md` files
- **KDS Violation Detection**: Validate key structure (required files: plan.md, work-log.md), detect stale keys (>90 days), orphaned directories
- **Test Registry Management**: Create/update `test-registry.md` for orphaned test files
- **Deprecated Reference Replacement**: Auto-replace deprecated file references (CONCISE-MANDATE → MANDATORY, etc.)
- **Audit Log Archiving**: Archive audit logs older than 30 days to `.github/audits/_archive/`

**Execution**: Only when `validation-level=kds-cleanup` AND `auto-fix=true`

**Safety**: 
- Safe Harbor files NEVER modified (MANDATORY.md, *-mandate.md, *-protocol.md, context-*.md, validation-*.md, step-*.md)
- High-risk operations require user approval
- Git checkpoint created before cleanup
- Rollback command provided in report

## Validation Levels

### Level 1: Syntax (Quick)
- Markdown validity
- Frontmatter presence
- Basic structure (headers, code blocks)
- File existence for references

### Level 2: Cross-Reference (Medium)
- Agent name references valid
- File paths resolve correctly
- Shared guidance files exist
- Parameter definitions consistent

### Level 3: Rules (Detailed)
- MANDATORY.md compliance (3 global rules)
- Commit checkpoint usage (execution agents)
- Branch strategy compliance
- Database access rules

### Level 4: Conflicts (Deep)
- Competing instructions
- Contradictory rules
- Overlapping jurisdictions
- Ambiguous handoff protocols
- Circular dependencies

### Level 5: Full (Comprehensive)
- All levels 1-4
- Workflow simulation
- Edge case identification
- Performance optimization recommendations
- Documentation completeness

### Level 6: KDS-Cleanup **NEW v2.0** (KDS Structure Validation + Cleanup Execution)
**Scope:** `.github/` folder only

**Phase A: Scan & Categorize**
- Deprecated files in `.github/prompts/shared/` (marked "DEPRECATED" or "obsolete")
- Misplaced documentation (informational docs in prompts/instructions folders)
- Internal prompts in wrong location (auto-invoked prompts not in `internal/shared/`)
- Temporary files (`*.tmp`, `*.bak`, `temp-*.md`, `*-backup.md`)
- KDS violations (missing plan.md/work-log.md, stale keys >90 days, orphaned directories)
- Orphaned tests (test files without registry entries)
- Deprecated references (CONCISE-MANDATE.md, snippet-handling-policy.md, output-style-mandate.md)

**Phase B: Propose Actions**
- Archive plan (deprecated files → archive/ with metadata)
- Move plan (internal prompts → internal/shared/, docs → Workspaces/)
- Delete plan (temporary files)
- Fix plan (create work-log.md, test-registry.md, replace deprecated refs)

**Phase C: Execute** (if `auto-fix=true`)
- Archive deprecated files with metadata
- Move internal prompts + update references in calling prompts
- Move misplaced documentation
- Delete temporary files
- Fix KDS violations (create missing files, archive stale keys)
- Create/update test registries
- Replace deprecated references

**Output:** Unified report with validation results (Levels 1-5) + KDS cleanup results

## How to Invoke

```bash
# Quick syntax check
@workspace /cohesion scope=prompts validation-level=syntax

# Full prompt system audit
@workspace /cohesion scope=all validation-level=full

# Specific file deep scan
@workspace /cohesion scope=plan.prompt.md validation-level=conflicts

# Instructions-only validation
@workspace /cohesion scope=instructions validation-level=rules

# Auto-fix mode (requires approval)
@workspace /cohesion scope=all validation-level=full auto-fix=true

# KDS cleanup with validation (report only)
@workspace /cohesion scope=all validation-level=kds-cleanup

# KDS cleanup with auto-fix
@workspace /cohesion scope=all validation-level=kds-cleanup auto-fix=true

# KDS cleanup (archive deprecated files only)
@workspace /cohesion validation-level=kds-cleanup auto-fix=true cleanup-mode=archive-only

# Auto-invoked from plan/task (end of workflow)
Execute("cohesion.prompt.md", {
  scope: "all",
  validation-level: "kds-cleanup",
  auto-fix: true,
  cleanup-mode: "full",
  key: CurrentKey,
  verbosity: "concise"
})
```

## Validation Algorithm (Pseudocode)

```
FUNCTION ValidateCohesion(scope, level)
  
  // Phase 1: Discovery
  files = DiscoverFiles(scope)
  IF files.isEmpty() THEN
    RETURN "No files found for scope: {scope}"
  END IF
  
  // Phase 2: Structural Validation
  IF level >= SYNTAX THEN
    FOR EACH file IN files
      issues += ValidateMarkdownSyntax(file)
      issues += ValidateFrontmatter(file)
      issues += ValidateSections(file)
    END FOR
  END IF
  
  // Phase 3: Cross-Reference Validation
  IF level >= CROSS_REF THEN
    FOR EACH file IN files
      references = ExtractFileReferences(file)
      FOR EACH ref IN references
        IF NOT FileExists(ref) THEN
          issues += {type: "broken-ref", file: file, ref: ref, severity: HIGH}
        END IF
      END FOR
      
      agentRefs = ExtractAgentReferences(file)
      FOR EACH agent IN agentRefs
        IF NOT AgentExists(agent) THEN
          issues += {type: "unknown-agent", file: file, agent: agent, severity: MEDIUM}
        END IF
      END FOR
    END FOR
  END IF
  
  // Phase 4: Rule Compliance
  IF level >= RULES THEN
    mandatoryRules = LoadMandatoryRules()
    FOR EACH file IN files
      issues += ValidateMandatoryCompliance(file)
      
      IF IsExecutionAgent(file) THEN
        issues += ValidateCheckpointProtocol(file)
      END IF
      
      issues += ValidateBranchStrategy(file)
      issues += ValidateDatabaseRules(file)
    END FOR
  END IF
  
  // Phase 5: Conflict Detection
  IF level >= CONFLICTS THEN
    ruleGraph = BuildRuleDependencyGraph(files)
    issues += DetectCircularDependencies(ruleGraph)
    issues += DetectContradictions(files)
    issues += DetectOverlappingJurisdictions(files)
    issues += DetectParameterMismatches(files)
  END IF
  
  // Phase 6: Report Generation
  report = GenerateReport(issues, severity)
  
  IF auto_fix AND HasAutoFixableIssues(issues) THEN
    fixes = GenerateAutoFixes(issues)
    RETURN {report: report, fixes: fixes, requires_approval: true}
  ELSE
    RETURN report
  END IF
  
END FUNCTION

FUNCTION ValidateMandatoryCompliance(file)
  content = ReadFile(file)
  violations = []
  
  // Check for MANDATORY.md load directive
  IF NOT Contains(content, "**⚠️ LOAD FIRST:** `.github/MANDATORY.md`") THEN
    violations += {type: "missing-mandatory-load", severity: CRITICAL}
  END IF
  
  // Check for response structure
  IF NOT HasSection(content, "🧠 Analysis") AND IsUserFacingAgent(file) THEN
    violations += {type: "missing-analysis-section", severity: MEDIUM}
  END IF
  
  IF NOT HasSection(content, "� Summary") AND IsUserFacingAgent(file) THEN
    violations += {type: "missing-summary-section", severity: MEDIUM}
  END IF
  
  // Check for deprecated references
  deprecatedRefs = [
    "CONCISE-MANDATE.md",
    "snippet-handling-policy.md",
    "output-style-mandate.md"
  ]
  
  FOR EACH ref IN deprecatedRefs
    IF Contains(content, ref) THEN
      violations += {
        type: "deprecated-reference",
        reference: ref,
        replacement: "MANDATORY.md",
        severity: HIGH
      }
    END IF
  END FOR
  
  RETURN violations
  
  // Check for code in chat warnings
  IF NOT Contains(content, "NO code") AND NOT Contains(content, "pseudocode") THEN
    violations += {type: "missing-code-prohibition", severity: MEDIUM}
  END IF
  
  RETURN violations
END FUNCTION

FUNCTION DetectContradictions(files)
  contradictions = []
  rules = ExtractAllRules(files)
  
  FOR EACH rule1 IN rules
    FOR EACH rule2 IN rules
      IF rule1.topic == rule2.topic AND rule1.file != rule2.file THEN
        IF AreContradictory(rule1.statement, rule2.statement) THEN
          contradictions += {
            type: "rule-contradiction",
            rule1: {file: rule1.file, statement: rule1.statement},
            rule2: {file: rule2.file, statement: rule2.statement},
            severity: CRITICAL
          }
        END IF
      END IF
    END FOR
  END FOR
  
  RETURN contradictions
END FUNCTION
```

## KDS Cleanup Algorithms **NEW v2.0**

### Step 6: KDS Structure Validation (validation-level=kds-cleanup)

```
FUNCTION ValidateKDSStructure():
  
  violations = {
    deprecated: [],
    misplaced: [],
    internalPrompts: [],
    temporary: [],
    kdsViolations: [],
    orphanedTests: [],
    deprecatedRefs: [],
    copilotWorkspace: []  // NEW v2.1 - MANDATORY.md violations in .copilot/CONTEXT/
  }
  
  // Safe Harbor Files - NEVER modify these
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
  
  // 1. Scan .github/prompts/shared/ for deprecated files
  sharedFiles = GetFiles(".github/prompts/shared/*.md")
  FOR EACH file IN sharedFiles:
    IF IsSafeHarbor(file, safeHarborFiles, safeHarborPatterns) THEN
      CONTINUE  // Protected file - skip
    END IF
    
    content = ReadFile(file)
    
    IF content.Contains("DEPRECATED") OR 
       content.Contains("DO NOT UPDATE") OR 
       content.Contains("obsolete") THEN
      violations.deprecated.Add({
        file: file,
        reason: "Marked as deprecated/obsolete",
        target: ".github/prompts/shared/archive/deprecated-" + Now().ToString("yyyy-MM-dd") + "/",
        risk: "low"
      })
    END IF
    
    // Check for informational docs (should be in Workspaces/)
    fileName = Path.GetFileName(file)
    IF (fileName.EndsWith("-guide.md") OR fileName.EndsWith("-reference.md")) AND
       NOT IsProtocolOrAlgorithm(content) THEN
      violations.misplaced.Add({
        file: file,
        reason: "Informational doc in shared/ folder",
        target: "Workspaces/Documentation/GitHub/",
        risk: "low"
      })
    END IF
  END FOR
  
  // 2. Scan for internal prompts in wrong location
  allPrompts = GetFiles(".github/prompts/**/*.prompt.md")
  FOR EACH promptFile IN allPrompts:
    IF promptFile.Contains("/internal/") OR promptFile.Contains("/shared/") THEN
      CONTINUE
    END IF
    
    content = ReadFile(promptFile)
    
    // Check for manual override
    IF content.Contains("location: root") THEN
      CONTINUE
    END IF
    
    // Detect auto-invocation indicators
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
  
  // 3. Scan for temporary files
  tempPatterns = ["*.tmp", "*.bak", "temp-*.md", "*-backup.md"]
  FOR EACH pattern IN tempPatterns:
    tempFiles = GetFiles(".github/**/" + pattern)
    FOR EACH file IN tempFiles:
      violations.temporary.Add({
        file: file,
        reason: "Temporary file pattern",
        action: "DELETE",
        risk: "low"
      })
    END FOR
  END FOR
  
  // 4. Validate key-data-streams structure
  keys = GetDirectories(".github/key-data-streams/*")
  FOR EACH keyPath IN keys:
    IF keyPath.StartsWith("_") THEN CONTINUE  // Skip _ARCHIVE, _SCHEMA
    
    keyViolations = ValidateKeyStructure(keyPath)
    IF keyViolations.Count > 0 THEN
      violations.kdsViolations.Add({
        key: Path.GetFileName(keyPath),
        violations: keyViolations
      })
    END IF
  END FOR
  
  // 5. Scan for orphaned test files
  testFiles = GetFiles(".github/key-data-streams/*/tests/*.spec.ts")
  FOR EACH testFile IN testFiles:
    registryFile = Path.Combine(Path.GetDirectoryName(testFile), "test-registry.md")
    
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
  
  // 6. Scan for deprecated references (auto-replace)
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
  
  // 7. Scan .copilot/CONTEXT/ for MANDATORY.md violations **NEW v2.1**
  copilotContextPath = ".copilot/CONTEXT/"
  
  IF DirectoryExists(copilotContextPath) THEN
    chatFiles = GetFiles(copilotContextPath + "*.md")
    
    FOR EACH chatFile IN chatFiles:
      content = ReadFile(chatFile)
      chatViolations = []
      
      // NO-CODE-IN-CHAT violations
      codeBlockPattern = '```(csharp|javascript|typescript|html|css|sql|razor)\s*\r?\n([\s\S]*?)```'
      codeBlocks = Regex.Matches(content, codeBlockPattern)
      
      IF codeBlocks.Count > 10 THEN  // Threshold: >10 blocks
        totalLines = 0
        FOR EACH block IN codeBlocks:
          language = block.Groups[1].Value
          codeContent = block.Groups[2].Value
          totalLines += (codeContent.Split('\n').Length)
        END FOR
        
        chatViolations.Add({
          type: "NO-CODE-IN-CHAT",
          count: codeBlocks.Count,
          lines: totalLines,
          severity: "CRITICAL"
        })
      END IF
      
      // METHOD-IMPLEMENTATION violations
      methodPatterns = [
        'public .* \{', 'private .* \{', 'async .* \{',
        'function .* \{', 'const .* => \{', 'class .* \{'
      ]
      
      methodCount = 0
      FOR EACH pattern IN methodPatterns:
        methodCount += Regex.Matches(content, pattern).Count
      END FOR
      
      IF methodCount > 0 THEN
        chatViolations.Add({
          type: "METHOD-IMPLEMENTATION",
          count: methodCount,
          severity: "CRITICAL"
        })
      END IF
      
      // PLAYWRIGHT-ORCHESTRATION violations
      deprecatedPatterns = [
        'dotnet run', 'PW_MODE=standalone', 'webServer',
        'Start-Job.*dotnet', 'Start-Process powershell.*dotnet'
      ]
      
      deprecatedCount = 0
      FOR EACH pattern IN deprecatedPatterns:
        deprecatedCount += Regex.Matches(content, pattern).Count
      END FOR
      
      IF deprecatedCount > 0 THEN
        chatViolations.Add({
          type: "PLAYWRIGHT-ORCHESTRATION",
          count: deprecatedCount,
          severity: "CRITICAL"
        })
      END IF
      
      // Add to violations if any found
      IF chatViolations.Count > 0 THEN
        violations.copilotWorkspace.Add({
          file: chatFile,
          violations: chatViolations,
          autoFix: "Scripts/fix-copilotchats-violations.ps1",
          risk: "critical"
        })
      END IF
    END FOR
  END IF
  
  RETURN violations
  
END FUNCTION


FUNCTION ValidateKeyStructure(keyPath):
  violations = []
  
  keyName = Path.GetFileName(keyPath)
  planFile = Path.Combine(keyPath, keyName + ".plan.md")
  workLogFile = Path.Combine(keyPath, "work-log.md")
  
  // Required file checks
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
  
  // Staleness check
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
  
  // Orphaned directory check
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


FUNCTION IsSafeHarbor(filePath, safeHarborFiles, safeHarborPatterns):
  // Check exact matches
  FOR EACH safeFile IN safeHarborFiles:
    IF filePath.EndsWith(safeFile) OR filePath == safeFile THEN
      RETURN true
    END IF
  END FOR
  
  // Check pattern matches
  fileName = Path.GetFileName(filePath)
  FOR EACH pattern IN safeHarborPatterns:
    IF MatchesPattern(fileName, pattern) THEN
      RETURN true
    END IF
  END FOR
  
  RETURN false
  
END FUNCTION


FUNCTION IsProtocolOrAlgorithm(content):
  // Check if file contains implementation logic vs pure docs
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
  
  RETURN matchCount >= 3  // If 3+ indicators, it's protocol/algorithm
  
END FUNCTION


FUNCTION ExtractInvokers(content):
  invokers = []
  lines = content.Split("\n")
  
  FOR EACH line IN lines:
    // Pattern: "invoked by X" or "Called by X"
    IF line.Contains("invoked by") OR line.Contains("Called by") THEN
      matches = Regex.Matches(line, @"(\w+(-\w+)*\.prompt\.md)")
      FOR EACH match IN matches:
        invokers.Add(match.Value)
      END FOR
    END IF
    
    // Pattern: "Do not call directly. Use X"
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

### Step 7: KDS Cleanup Execution (if auto-fix=true)

```
FUNCTION ExecuteKDSCleanup(violations, cleanup-mode):
  
  results = {
    archived: [],
    moved: [],
    deleted: [],
    created: [],
    updated: []
  }
  
  // 1. Archive deprecated files
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
  
  // 2. Move internal prompts to internal/shared/
  IF cleanup-mode IN ["full", "organize-only"] THEN
    FOR EACH item IN violations.internalPrompts:
      newPath = MoveInternalPrompt(item.file, item.target)
      
      // Update references in calling prompts
      updatedFiles = UpdatePromptReferences(item.file, newPath)
      
      results.moved.Add({
        file: item.file,
        destination: newPath,
        invokers: item.invokers,
        referencesUpdated: updatedFiles.Count
      })
    END FOR
  END IF
  
  // 3. Move misplaced documentation
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
  
  // 4. Delete temporary files
  IF cleanup-mode == "full" THEN
    FOR EACH item IN violations.temporary:
      DeleteFile(item.file)
      results.deleted.Add({
        file: item.file,
        reason: item.reason
      })
    END FOR
  END IF
  
  // 5. Fix KDS violations
  IF cleanup-mode == "full" THEN
    FOR EACH item IN violations.kdsViolations:
      keyPath = ".github/key-data-streams/" + item.key
      
      FOR EACH violation IN item.violations:
        
        IF violation.type == "MISSING_WORKLOG" THEN
          filePath = CreateWorkLog(keyPath, item.key)
          results.created.Add({
            file: filePath,
            reason: "Missing work-log.md"
          })
          
        ELSE IF violation.type == "MISSING_PLAN" THEN
          filePath = CreatePlanFile(keyPath, item.key)
          results.created.Add({
            file: filePath,
            reason: "Missing plan file"
          })
          
        ELSE IF violation.type == "STALE_KEY" THEN
          archivePath = ArchiveStaleKey(keyPath, item.key)
          results.archived.Add({
            file: keyPath,
            destination: archivePath,
            reason: "Stale (>" + violation.daysSinceUpdate + " days)"
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
  
  // 6. Fix orphaned tests
  IF cleanup-mode == "full" THEN
    FOR EACH item IN violations.orphanedTests:
      
      IF item.action == "CREATE_REGISTRY" THEN
        filePath = CreateTestRegistry(item.file)
        results.created.Add({
          file: filePath,
          reason: "Missing test registry"
        })
        
      ELSE IF item.action == "ADD_TO_REGISTRY" THEN
        filePath = AddToTestRegistry(item.file)
        results.updated.Add({
          file: filePath,
          reason: "Added orphaned test"
        })
      END IF
      
    END FOR
  END IF
  
  // 7. Replace deprecated references
  IF cleanup-mode == "full" THEN
    FOR EACH item IN violations.deprecatedRefs:
      ReplaceDeprecatedReference(item.file, item.oldRef, item.newRef)
      results.updated.Add({
        file: item.file,
        reason: "Replaced " + item.oldRef + " → " + item.newRef
      })
    END FOR
  END IF
  
  RETURN results
  
END FUNCTION


// Helper Functions (placeholders - full implementation in architecture-design.md)

FUNCTION ArchiveDeprecatedFile(filePath, targetDir):
  CreateDirectory(targetDir)
  fileName = Path.GetFileName(filePath)
  archivePath = Path.Combine(targetDir, fileName)
  metadata = {originalPath: filePath, archivedDate: Now(), reason: "Deprecated"}
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
    content = Regex.Replace(content, "Execute\\([\"']" + fileName + "[\"']", "Execute(\"" + newRelativePath + "\"")
    content = content.Replace("calls: [" + fileName + "]", "calls: [" + newRelativePath + "]")
    IF content != originalContent THEN
      WriteFile(promptFile, content)
      updatedFiles.Add(promptFile)
    END IF
  END FOR
  RETURN updatedFiles
END FUNCTION

FUNCTION CreateWorkLog(keyPath, keyName):
  template = "# Work Log: " + keyName + "\n\n**Created:** " + Now() + "\n**Agent:** cohesion.prompt.md (auto-created)\n"
  filePath = Path.Combine(keyPath, "work-log.md")
  WriteFile(filePath, template)
  RETURN filePath
END FUNCTION

FUNCTION CreatePlanFile(keyPath, keyName):
  template = "# Plan: " + keyName + "\n\n**Created:** " + Now() + "\n**Status:** Draft\n"
  filePath = Path.Combine(keyPath, keyName + ".plan.md")
  WriteFile(filePath, template)
  RETURN filePath
END FUNCTION

FUNCTION CreateTestRegistry(testFile):
  testDir = Path.GetDirectoryName(testFile)
  registryFile = Path.Combine(testDir, "test-registry.md")
  fileName = Path.GetFileName(testFile)
  template = "# Test Registry\n\n| Test File | Type | Status |\n|-----------|------|--------|\n| " + fileName + " | E2E | Active |\n"
  WriteFile(registryFile, template)
  RETURN registryFile
END FUNCTION

FUNCTION AddToTestRegistry(testFile):
  testDir = Path.GetDirectoryName(testFile)
  registryFile = Path.Combine(testDir, "test-registry.md")
  fileName = Path.GetFileName(testFile)
  content = ReadFile(registryFile)
  newRow = "| " + fileName + " | E2E | Active |"
  content += "\n" + newRow
  WriteFile(registryFile, content)
  RETURN registryFile
END FUNCTION

FUNCTION ReplaceDeprecatedReference(filePath, oldRef, newRef):
  content = ReadFile(filePath)
  content = content.Replace(oldRef, newRef)
  WriteFile(filePath, content)
  RETURN filePath
END FUNCTION
```

## Validation Scopes

### scope=prompts
Validates all files in `.github/prompts/*.md`:
- plan.prompt.md
- task.prompt.md
- todo.prompt.md
- drift.prompt.md
- healthcheck.prompt.md
- test-generation.prompt.md
- port-instructions.prompt.md
- cohesion.prompt.md (self)

### scope=instructions
Validates all files in `.github/instructions/*.md`:
- SelfAwareness.instructions.md
- DatabaseEnvironmentGuard.md
- HostProvisioner-Environment.md

### scope=shared
Validates all files in `.github/prompts/shared/*.md`:
- CONCISE-MANDATE.md
- output-style-mandate.md
- commit-checkpoint-protocol.md
- agent-handoff-protocol.md
- UserDictionary.md
- execution-flow.md
- (all 30+ shared guidance files)

### scope=all
Validates all above scopes in single comprehensive scan

### scope={specific-file}
Validates single file with full cross-reference checking

## Critical Validation Checks

### 1. Agent Handoff Compatibility

**plan.prompt.md → task.prompt.md**
- ✅ plan writes `{key}.plan.md`, `{key}.plan.json`, `work-log.md`
- ✅ task expects these files when `key` parameter provided
- ✅ handoff command format matches task parameter schema
- ❌ **Conflict**: If plan says "present command to user" but task expects auto-invoke

**todo.prompt.md → task.prompt.md**
- ✅ todo detects active key from git history
- ✅ todo extends existing plan or creates lightweight plan
- ✅ both use same key data stream structure
- ❌ **Conflict**: If todo complexity detection fails

**task.prompt.md → test-generation.prompt.md**
- ✅ task includes test-generation in routing for test phases
- ✅ test-generation expects key, test-type, orchestration params
- ✅ both use same key data stream structure
- ❌ **Conflict**: If test-generation doesn't validate key folder exists first

**drift.prompt.md → plan.prompt.md**
- ✅ drift queues use plan for execution
- ✅ drift naming convention (auto-prefix "drift-")
- ✅ stack management (max 3 levels)
- ❌ **Conflict**: If plan doesn't handle parent key parameter

### 2. Parameter Definition Consistency

**key parameter** (used by all agents):
- Format: lowercase-with-dashes
- Spelling correction: YES (unless ALL-CAPS acronym)
- Required by: plan, task, test-generation, drift, continue
- Optional for: healthcheck, cohesion

**github-branch parameter**:
- Default: `development` (per SelfAwareness.instructions.md)
- Allowed: `development`, `master` (master requires approval)
- Used by: plan, task, handoff
- Validation: Must exist in git repo

**debug-level parameter**:
- Default: `none` (per task.prompt.md)
- Allowed: none, simple, trace, diagnostic, cleanup, doc
- Used by: task only
- Conflicts: healthcheck says "not applicable"

**verbosity parameter**:
- Default: `concise`
- Allowed: concise, detailed
- Used by: task, healthcheck
- Rule: NO code in either mode

### 3. Output Format Compliance

**All prompts must include**:
- Reference to CONCISE-MANDATE.md (15 bullet max)
- Reference to output-style-mandate.md (format structure)
- 🧠 Analysis section (≤5 bullets)
- 📌 Summary section (≤10 bullets)
- 📊 Final section (always)
- Letter-based actions (A, B, C, D)

**Execution agents must also include**:
- Commit checkpoint protocol reference
- PowerShell snippet for checkpoints
- Phase completion tracking

**Planning agents must also include**:
- Plan draft in chat (≤100 lines)
- Full details → `{key}.plan.md`
- Pseudocode preferred over executable code

**NOTE**: handoff.prompt.md has been deprecated and moved to archive. Its functionality has been merged into todo.prompt.md (lightweight mode) and plan.prompt.md (comprehensive mode). todo.prompt.md was renamed from continue.prompt.md on 2025-10-25 to better reflect todo-based workflow terminology.

### 4. Drift Detection Compliance (MANDATORY)

**Auto-Drift Detection Requirements** (all execution prompts):
- ✅ plan.prompt.md includes auto-drift detection section
- ✅ task.prompt.md includes auto-drift detection with critical blocking
- ✅ test-generation.prompt.md includes auto-drift detection with infrastructure blocking
- ✅ healthcheck.prompt.md includes auto-drift detection (non-blocking)
- ✅ todo.prompt.md generates comprehensive drift summary at completion

**Severity Classification Consistency**:
- All prompts must use same 5 levels: critical, high, medium, low, informational
- ✅ critical: Build-breaking errors, security vulnerabilities, null reference risks
- ✅ high: Failing tests, broken integrations, performance degradation
- ✅ medium: Code smells, documentation gaps, minor bugs
- ✅ low: Formatting issues, unused code, minor optimizations
- ✅ informational: Observations, suggestions, non-actionable notes

**Drift Commit Format Validation**:
```
Required format for drift registration:
drift({parent-key}): Register {drift-key} - {one-line-description}
Mode: auto | manual | user-critical | auto-deferred
Severity: critical | high | medium | low | informational
Triggered by: plan.prompt.md | task.prompt.md | test-generation.prompt.md | healthcheck.prompt.md | user
Phase: {phase-name} (optional)

Required format for drift resolution:
ckpt({drift-key}): Resolved - {summary}
Parent: {parent-key} | Remaining: {count} drifts
Severity: {original-severity} | Mode: {original-mode}
```

**Queue Management Validation**:
- ✅ Max 10 auto-detected drifts per parent key (enforced)
- ✅ Manual drifts exempt from limit
- ✅ Overflow handling: remove lowest priority or block
- ✅ Queue status displayed in drift summary
- ✅ Depth enforcement: max 3 levels (parent → drift → sub-drift → sub-sub-drift)

**Drift Summary Format Validation**:
- ✅ Severity-sorted presentation (critical → high → medium → low → informational)
- ✅ Mode distinction (auto vs manual counts)
- ✅ User choice handling (A: critical, B: all, C: specific, D: defer)
- ✅ Recommended resolution order displayed
- ✅ Silent logging (no chat interruption during work)

**Detection Trigger Consistency**:

**plan.prompt.md triggers**:
- Missing files/dependencies unrelated to current plan
- Architectural inconsistencies in existing code
- Security/performance concerns in reviewed code paths
- Documentation gaps discovered during validation
- Broken references in unrelated parts

**task.prompt.md triggers**:
- File errors in Step 2 (context gathering)
- Dead code/unused imports in Step 5 (execution)
- Test failures in Step 6 (validation)
- Configuration mismatches during validation

**test-generation.prompt.md triggers**:
- Missing test dependencies (infrastructure phase)
- Test framework configuration errors
- Unexpected test failures in unrelated suites
- Broken test utilities or fixtures

**healthcheck.prompt.md triggers**:
- Architectural inconsistencies across layers
- Contract mismatches (DTO/API/DB schema drift)
- Conflicting instructions across prompts
- Documentation drift vs actual code

**Blocking Behavior Validation**:
- ✅ task.prompt.md: HALT on severity=critical (user choice required)
- ✅ test-generation.prompt.md: HALT on critical infrastructure issues
- ✅ plan.prompt.md: NO blocking (defers all drifts)
- ✅ healthcheck.prompt.md: NO blocking (read-only analysis)

**Integration with todo.prompt.md**:
- ✅ todo checks drift stack on work completion
- ✅ Generates comprehensive drift summary with severity sorting
- ✅ Presents user choices for resolution
- ✅ Validates drift commit format
- ✅ Enforces queue limits and depth

**Drift Detection Validation Checklist**:
```
FUNCTION ValidateDriftDetectionCompliance(prompt)
  
  // Check auto-drift section exists
  IF NOT HasSection(prompt, "Auto-Drift Detection") THEN
    RETURN "FAIL: Missing auto-drift detection section"
  END IF
  
  // Validate detection triggers documented
  triggers = ExtractDetectionTriggers(prompt)
  IF triggers.Count == 0 THEN
    RETURN "FAIL: No detection triggers documented"
  END IF
  
  // Validate auto-registration algorithm present
  IF NOT HasAlgorithm(prompt, "DetectDrift|RegisterDrift") THEN
    RETURN "FAIL: Missing auto-registration algorithm"
  END IF
  
  // Validate severity classification used
  severities = ExtractSeverityLevels(prompt)
  validSeverities = ["critical", "high", "medium", "low", "informational"]
  IF NOT severities.All(s => s IN validSeverities) THEN
    RETURN "FAIL: Invalid severity levels used"
  END IF
  
  // Validate commit format documented
  IF NOT HasCommitFormatExample(prompt) THEN
    RETURN "FAIL: Missing drift commit format documentation"
  END IF
  
  // Validate blocking behavior appropriate for prompt type
  IF IsExecutionPrompt(prompt) AND NOT HasBlockingStrategy(prompt) THEN
    RETURN "FAIL: Execution prompt missing blocking strategy"
  END IF
  
  RETURN "PASS: Drift detection compliance validated"
  
END FUNCTION
```

### 5. Mandatory Cross-References

**All agents must reference**:
- `.github/prompts/shared/CONCISE-MANDATE.md`
- `.github/prompts/shared/output-style-mandate.md`
- `.github/instructions/SelfAwareness.instructions.md`

**Execution agents must reference**:
- `.github/prompts/shared/commit-checkpoint-protocol.md`
- `.github/prompts/shared/execution-flow.md`

**Planning agents must reference**:
- `.github/prompts/shared/phase-breakdown-patterns.md`
- `.github/prompts/shared/agent-handoff-protocol.md`

**Test agents must reference**:
- `.github/prompts/shared/playwright-test-generation.md`
- `.github/prompts/shared/test-orchestration-patterns.md`

### 5. SelfAwareness Rules Compliance

**Branch Strategy**:
- ✅ All work in `development` branch
- ❌ NEVER commit directly to `master`
- ✅ Verify branch before starting work
- ✅ Switch to development if on master

**Database Access**:
- ✅ canvas.* schema: READ-WRITE allowed
- ❌ dbo.* schema: READ-ONLY ONLY
- ❌ All other schemas: READ-ONLY
- ✅ Primary database: KSESSIONS_DEV

**Required Reading**:
- ✅ UserDictionary.md (shortcut expansion)
- ✅ SystemIndex.md (navigation hub)
- ✅ InfrastructureQuickRef.md (database details)
- ✅ Architecture.md (API catalog, services, SignalR hubs)

## Conflict Resolution Strategies

### Strategy 1: Explicit Precedence
When contradictions found, establish clear precedence:
1. SelfAwareness.instructions.md (global rules)
2. CONCISE-MANDATE.md (output rules)
3. Agent-specific prompt (specialized rules)
4. Shared guidance (patterns and recommendations)

### Strategy 2: Scope Clarification
When overlapping jurisdictions found:
- Define clear boundaries per agent
- Document handoff conditions
- Specify parameter ownership
- Establish conflict resolution path

### Strategy 3: Deprecation Protocol
When competing instructions exist:
1. Identify canonical source
2. Mark deprecated sections
3. Add redirect references
4. Schedule removal date

### Strategy 4: Unification
When duplicate rules found:
1. Consolidate in shared guidance
2. Update all references
3. Add validation check
4. Document decision

## Auto-Fix Capabilities

### Fixable Issues (auto-fix=true)
- Missing frontmatter fields (add template)
- Broken file references (suggest corrections)
- Missing CONCISE-MANDATE reference (add)
- Missing output format sections (add template)
- Inconsistent parameter defaults (standardize)

### Enhancement Pack (Delegated, preview-first)
- Scope: Metadata normalization, shared reference centralization, formatting harmonization
- Flow: Delegate to internal enhancement agent in preview (report-only) mode, present proposed changes, then apply only with explicit approval
- Invocation: Calls `.github/prompts/internal/enhance-prompts.prompt.md` with `report-only=true` by default; switch to `apply-enhancements=true` only after approval
- Safety: Archive superseded prompt docs under `shared/archive/` (no deletions); create checkpoint commit before apply

### Manual Fix Required
- Rule contradictions (needs human decision)
- Overlapping jurisdictions (needs scope clarification)
- Circular dependencies (needs architecture change)
- Incompatible workflows (needs redesign)

## Cohesion Workflow

### Step 1: Initialize Cohesion Session

Create key data stream structure:
```
.github/key-data-streams/{key}/
├── work-log.md
├── cohesion-report.md
└── scripts/ (if auto-fixes needed)
```

Initialize work-log.md with validation context.

### Step 2-6: Execute Validation

Perform validation based on `validation-level`:
- **Step 2**: Discover files in scope
- **Step 3**: Validate structural integrity (syntax)
- **Step 4**: Check cross-references
- **Step 5**: Enforce rule compliance
- **Step 6**: Detect conflicts (if conflicts/full level)

Update work-log.md progressively after each step.

### Step 7: Update Work-Log

After completing validation (BEFORE generating final report):

**Create/Update** `.github/key-data-streams/{key}/work-log.md`:

```markdown
# Work Log: {key}

**Key:** `{key}`  
**Created:** {timestamp}  
**Agent:** cohesion.prompt.md  
**Status:** {In Progress|Completed|Requires Action}

---

## Cohesion Validation Session

**Scope**: {prompts|instructions|all|{specific-file}}  
**Validation Level**: {syntax|cross-ref|rules|conflicts|full}  
**Files Scanned**: {count}

---

## Validation Results ({date})

### Issues Found

**Critical**: {count}  
**High**: {count}  
**Medium**: {count}  
**Low**: {count}

### Critical Issues

1. **{issue-title}**
   - File: `{file-path}`
   - Line: {line-number}
   - Violation: {description}
   - Fix: {recommended-action}

2. **{issue-title}**
   - File: `{file-path}`
   - Violation: {description}
   - Fix: {recommended-action}

### High Priority Issues

1. **{issue-title}**
   - File: `{file-path}`
   - Violation: {description}
   - Fix: {recommended-action}

### Medium Priority Issues

*(List medium issues)*

### Low Priority Issues

*(List low issues)*

---

## Auto-Fix Analysis

**Auto-Fixable**: {count} issues  
**Manual Fixes Required**: {count} issues

**Proposed Auto-Fixes**:
1. {fix-description} - File: `{file}`
2. {fix-description} - File: `{file}`

---

## Recommendations

1. {recommendation-1}
2. {recommendation-2}
3. {recommendation-3}

---

## Report

**Location**: `.github/key-data-streams/{key}/cohesion-report.md`  
**Generated**: {timestamp}

---

## Status

- [ ] Validation complete
- [ ] Critical issues resolved
- [ ] Auto-fixes applied (if approved)
- [ ] Manual fixes documented
```

**State Tracking Integration**:

```powershell
# Log cohesion validation session
Update-StateKey -Key $key -Type "cohesion-validation" -Status "in-progress" -Scope $scope

# After validation complete
Update-StateKey -Key $key -Status "completed" -IssuesFound $issueCount -Severity $highestSeverity

# Log work-log update
Update-StateCommit -Key $key -Sha (git rev-parse --short HEAD) -Message "cohesion({key}): Validation complete - {N} issues found" -CheckpointType "cohesion-validation"
```

### Step 8: Generate Final Report

Create comprehensive report (see "Report Structure" section below).

---

## Output Format (Following CONCISE-MANDATE)

### Before Validation

```
🧠 Analysis (≤5 bullets)
- Scope: {N} prompts, {M} instructions, {K} shared docs
- Level: {syntax|cross-ref|rules|conflicts|full}
- Auto-fix: {enabled|disabled}
- Expected duration: {quick|medium|slow}

📌 Plan (≤10 bullets)
1. Discover files in scope
2. Validate structural integrity
3. Check cross-references
4. Enforce rule compliance
5. Detect conflicts
6. Generate report
7. Propose auto-fixes (if enabled)
8. Next: **A.** Proceed | **B.** Adjust scope | **C.** Cancel
```

### After Validation

```
🧠 Findings (≤5 bullets)
- Files scanned: {N}
- Issues found: {count} ({CRITICAL}/{HIGH}/{MEDIUM}/{LOW})
- Auto-fixable: {count}
- Manual fixes: {count}
- KDS cleanup: {archived}/{moved}/{deleted} files (if validation-level=kds-cleanup)

📌 Summary (≤10 bullets)
1. ✅ Compliant: {area}
2. ❌ Critical: {violation} → Fix: {action}
3. ⚠️ Warning: {issue} → Recommend: {action}
4. 🔧 Auto-fix: {fixable-issue}
5. 📦 KDS cleanup: {archived} archived, {moved} moved, {deleted} deleted (if kds-cleanup)
...
10. Next: **A.** Apply fixes | **B.** Export report | **C.** Deep scan

📊 Final
- Status: {N} issues, {M} auto-fixable
- KDS status: {N} deprecated, {M} misplaced, {K} temporary (if kds-cleanup)
- Severity: {highest-level}
- Report: cohesion-report-{timestamp}.md
- Next: {primary-action}
```

## Report Structure

Generates comprehensive report at:
`.github/key-data-streams/cohesion-{timestamp}/cohesion-report.md`

### Report Sections

1. **Executive Summary**
   - Total files scanned
   - Total issues found
   - Severity breakdown
   - Auto-fix availability

2. **Critical Issues** (CRITICAL severity)
   - Rule contradictions
   - Broken handoff protocols
   - Missing mandatory references
   - Circular dependencies

3. **High Priority** (HIGH severity)
   - Missing CONCISE-MANDATE references
   - Broken file references
   - Parameter mismatches
   - Output format violations

4. **Medium Priority** (MEDIUM severity)
   - Missing sections
   - Incomplete frontmatter
   - Deprecated patterns
   - Documentation gaps

5. **Low Priority** (LOW severity)
   - Style inconsistencies
   - Minor formatting issues
   - Optional enhancements
   - Performance optimizations

6. **Auto-Fix Proposals**
   - List of fixable issues
   - Proposed changes
   - Approval required
   - Execution command

7. **KDS Cleanup Results** (if validation-level=kds-cleanup)
   - Deprecated files archived
   - Internal prompts relocated
   - Temporary files deleted
   - Missing work-logs/plans created
   - Deprecated references updated
   - Test registry updates

8. **Recommendations**
   - Architectural improvements
   - Workflow optimizations
   - Documentation updates
   - Maintenance schedule

## Integration with Other Agents

### With healthcheck.prompt.md
- **Complementary**: cohesion validates prompts, healthcheck validates code
- **Shared**: Both use read-only validation approach
- **Handoff**: healthcheck scope=prompts can trigger cohesion scan
- **Output**: Both generate reports in Workspaces/Copilot/_DOCS/

### With plan.prompt.md
- **Trigger**: cohesion can validate plan before handoff
- **Validation**: Check plan structure matches phase-breakdown-patterns.md
- **Handoff**: Ensure plan → task handoff format correct

### With task.prompt.md
- **Checkpoint**: Validate commit checkpoints created per protocol
- **Parameters**: Verify parameter usage matches definitions
- **Workflow**: Confirm execution follows execution-flow.md

### With drift.prompt.md
- **Stack**: Validate drift stack management rules
- **Naming**: Check automatic drift key naming conventions
- **Resolution**: Verify drift resolution commits per format

### With test-generation.prompt.md
- **Orchestration**: Validate PowerShell orchestration patterns
- **Playwright**: Check Playwright best practices adherence
- **Percy**: Verify visual regression test structure

## Periodic Maintenance

### Weekly Cohesion Scan
```bash
@workspace /cohesion scope=all validation-level=rules
```

### Monthly Deep Scan
```bash
@workspace /cohesion scope=all validation-level=full
```

### After Major Changes
```bash
@workspace /cohesion scope={modified-file} validation-level=conflicts
```

### Pre-Release Audit
```bash
@workspace /cohesion scope=all validation-level=full auto-fix=true
```

## Commit Format

### Cohesion Validation Commit
```
cohesion: Validated {scope} - {N} issues found

- {issue-summary-1}
- {issue-summary-2}
- {issue-summary-3}

Severity: {highest-level}
Report: cohesion-report-{timestamp}.md
```

### Auto-Fix Commit
```
cohesion: Auto-fixed {N} issues in {scope}

- {fix-1}
- {fix-2}
- {fix-3}

Manual fixes required: {M}
Report: cohesion-report-{timestamp}.md
```

## Error Handling

### Validation Failure
If validation process fails:
1. Capture error details
2. Identify failing phase
3. Generate partial report
4. Recommend manual inspection

### Circular Dependency Detection
If circular dependencies found:
1. Map dependency graph
2. Identify cycle path
3. Suggest break points
4. Require manual resolution

### Auto-Fix Failure
If auto-fix fails:
1. Rollback changes
2. Log failure reason
3. Mark as manual fix required
4. Continue with remaining fixes

## Best Practices

### For Prompt Authors
- Always reference CONCISE-MANDATE.md at top
- Include frontmatter with mode, purpose, inputs, outputs
- Define clear handoff protocols
- Document parameter schemas
- Add examples for each usage pattern

### For Instruction Authors
- Keep SelfAwareness.instructions.md as single source of truth
- Document precedence rules
- Cross-reference related prompts
- Update validation checks when rules change

### For Shared Guidance Authors
- Make files atomic and focused
- Avoid duplication across files
- Use clear, scannable structure
- Include examples and anti-patterns

## Version History

- **v1.0.0** (2025-10-25): Initial release
  - Structural integrity validation
  - Cross-reference checking
  - Rule compliance enforcement
  - Conflict detection
  - Auto-fix capabilities

---

**CRITICAL:** This is a meta-agent - validates system cohesion, does not execute tasks.

**See Also**:
- `.github/prompts/shared/CONCISE-MANDATE.md` - Output rules
- `.github/prompts/shared/output-style-mandate.md` - Format standards
- `.github/prompts/shared/agent-handoff-protocol.md` - Handoff specifications
- `.github/instructions/SelfAwareness.instructions.md` - Global operating rules
 - `.github/prompts/shared/validation-engine.md` - Validation guidance index
 - `.github/prompts/shared/integration-protocol.md` - Integration handoff/index
