# Healthcheck Validation Scripts
**Purpose:** PowerShell/Bash validation algorithms for healthcheck.prompt.md  
**Version:** 1.0.0  
**Last Updated:** 2025-10-31

---

## Script 1: Healthcheck Invocation Examples

**Basic Healthcheck:**
```bash
@workspace /healthcheck scope=prompts -test
@workspace /healthcheck scope=all -test level=micro
```

---

## Script 2: KDS Document-First Protocol Validation

```powershell
# Algorithm: Detect Documentation Lag Violations
FOR EACH active key in .github/key-data-streams/:
  
  # Get all commits affecting this key
  $keyCommits = git log --all --oneline --name-status -- .github/key-data-streams/{key}/
  
  # For each code commit, verify doc commit came first
  FOR EACH commit in $keyCommits:
    IF commit modifies code files (Controllers/, Services/, Components/) THEN
      $docCommit = Find prior commit updating {key}.plan.md OR work-log.md
      
      IF NOT $docCommit EXISTS THEN
        REGISTER DRIFT:
          key: "kds-doc-lag-{key}"
          severity: "high"
          description: "Code committed without prior documentation update"
          violation: "Document-First Protocol (SelfAwareness.instructions.md)"
          files: {list of code files committed}
          recommendation: "Update {key}.plan.md and work-log.md before code commits"
      END IF
    END IF
  END FOR
END FOR
```

---

## Script 3: Work Log Continuity Validation

```powershell
# Algorithm: Detect Stale or Orphaned Keys
FOR EACH key in .github/key-data-streams/:
  
  $workLog = "{key}/work-log.md"
  
  IF NOT EXISTS($workLog) THEN
    REGISTER DRIFT:
      key: "kds-missing-worklog-{key}"
      severity: "critical"
      description: "Key exists without work-log.md"
      recommendation: "Create work-log.md or remove orphaned key directory"
  ELSE
    $lastEntry = Parse last session date from work-log.md
    $daysSinceUpdate = (Today - $lastEntry).Days
    
    IF $daysSinceUpdate > 30 THEN
      REGISTER DRIFT:
        key: "kds-stale-{key}"
        severity: "medium"
        description: "No work-log.md updates in {days} days (potentially stale key)"
        recommendation: "Archive key or resume work with fresh session entry"
    END IF
    
    # Check for session gaps > 7 days
    $sessionGaps = Find gaps between consecutive work-log.md entries > 7 days
    IF $sessionGaps.Count > 0 THEN
      REGISTER DRIFT:
        key: "kds-worklog-gaps-{key}"
        severity: "low"
        description: "Work log has {count} gaps > 7 days"
        recommendation: "Ensure continuous documentation during active development"
    END IF
  END IF
END FOR
```

---

## Script 4: Test Registry Completeness Validation

```powershell
# Algorithm: Detect Undocumented Tests (addresses 33% violation rate)
FOR EACH key in .github/key-data-streams/:
  
  $testDirectory = "{key}/tests/"
  $testRegistry = "{key}/tests/test-registry.md"
  
  IF EXISTS($testDirectory) THEN
    $testFiles = Get all *.spec.ts, *Tests.cs files in $testDirectory
    
    IF NOT EXISTS($testRegistry) THEN
      REGISTER DRIFT:
        key: "kds-missing-registry-{key}"
        severity: "high"
        description: "{count} test files exist without test-registry.md"
        files: $testFiles
        recommendation: "Create test-registry.md documenting all test files"
    ELSE
      $documentedTests = Parse test file paths from test-registry.md
      $undocumentedTests = $testFiles - $documentedTests
      
      IF $undocumentedTests.Count > 0 THEN
        REGISTER DRIFT:
          key: "kds-undocumented-tests-{key}"
          severity: "medium"
          description: "{count} test files not in test-registry.md"
          files: $undocumentedTests
          recommendation: "Update test-registry.md with missing test entries"
      END IF
    END IF
  END IF
END FOR
```

---

## Script 5: Plan File Reference Validation

```powershell
# Algorithm: Validate Plan File References
FOR EACH key in .github/key-data-streams/:
  
  $planFile = "{key}/{key}.plan.md"
  IF EXISTS($planFile) THEN
    $fileReferences = Parse all file paths from plan.md
    
    FOR EACH file in $fileReferences:
      IF NOT EXISTS(file) THEN
        REGISTER DRIFT:
          key: "kds-broken-reference-{key}"
          severity: "medium"
          description: "Plan references non-existent file: {file}"
          recommendation: "Update plan.md or create referenced file"
      END IF
    END FOR
  END IF
END FOR
```

---

## Script 6: KDS Directory Structure Validation

```powershell
# Algorithm: Enforce Canonical KDS Structure
$canonicalStructure = @{
  required = @("{key}.plan.md", "work-log.md")
  optional = @("tests/test-registry.md", "drift-log.md", "metadata.json")
  prohibited = @("*.tmp", "*.backup", "*.bak") # Only allowed in root .github/prompts/
}

FOR EACH key in .github/key-data-streams/:
  
  # Check required files
  FOR EACH requiredFile in $canonicalStructure.required:
    IF NOT EXISTS("{key}/{requiredFile}") THEN
      REGISTER DRIFT:
        key: "kds-missing-required-{key}"
        severity: "critical"
        description: "Missing required file: {requiredFile}"
        recommendation: "Create {requiredFile} following KDS protocol"
    END IF
  END FOR
  
  # Check for prohibited files
  $prohibitedFiles = Find files matching $canonicalStructure.prohibited in {key}/
  IF $prohibitedFiles.Count > 0 THEN
    REGISTER DRIFT:
      key: "kds-prohibited-files-{key}"
      severity: "low"
      description: "Found {count} prohibited files in KDS directory"
      files: $prohibitedFiles
      recommendation: "Move .backup files to .github/prompts/ or delete temp files"
  END IF
  
  # Validate tests/ directory if exists
  IF EXISTS("{key}/tests/") THEN
    IF NOT EXISTS("{key}/tests/test-registry.md") THEN
      REGISTER DRIFT:
        key: "kds-tests-no-registry-{key}"
        severity: "high"
        description: "tests/ directory exists without test-registry.md"
        recommendation: "Create test-registry.md following protocol"
    END IF
  END IF
END FOR
```

---

## Script 7: .github Folder Organization Validation

```powershell
# Algorithm: Enforce SelfAwareness.instructions.md File Organization Rules
# Reference: SelfAwareness.instructions.md § File Organization Rules

# Define allowed structure per SelfAwareness.instructions.md
$githubStructure = @{
  "prompts/" = @{
    allowed = @("*.prompt.md", "internal/", "shared/")
    prohibited = @(
      "*.md" # Documentation files (except .prompt.md)
      "*.backup", "*.bak", "*.tmp" # Backup/temp files
      "*.ps1", "*.py" # Utility scripts
      "analysis/", "_DOCS/" # Analysis/documentation folders
    )
    destination = "Workspaces/Copilot/_DOCS/"
  }
  "instructions/" = @{
    allowed = @("*.md", "Links/")
    prohibited = @("*.backup", "*.tmp", "*-OLD.*", "*-archive.*")
    destination = "Workspaces/Documentation/"
  }
  "key-data-streams/" = @{
    allowed = @("{key}/", "_ARCHIVE/", "_SCHEMA/", "_template/", "*.md", "*.ps1")
    prohibited = @("*.tmp", "*.backup", "orphaned-keys/")
    notes = "KDS follows canonical structure per Algorithm 5"
  }
  "audits/" = @{
    allowed = @("README.md", "healthcheck-audits/")
    prohibited = @("*.tmp", "orphaned-reports/")
  }
  "hooks/" = @{
    allowed = @("pre-commit", "post-commit", "*.ps1", "README.md")
    prohibited = @("*.backup", "*.disabled")
  }
}

# Validate .github/prompts/ specifically (high-priority enforcement)
$promptsPath = ".github/prompts/"
$promptsViolations = @()

# Find all files in prompts root (excluding allowed subfolders)
$promptsFiles = Get all files in $promptsPath (exclude internal/, shared/)

FOR EACH file in $promptsFiles:
  $isAllowed = $false
  # Validation continues...
END FOR
```

---

## Script 8: Cross-Key Dependency Validation

```powershell
# Algorithm: Detect Circular or Broken Key Dependencies
FOR EACH key in .github/key-data-streams/:
  
  $planFile = "{key}/{key}.plan.md"
  IF EXISTS($planFile) THEN
    $dependencies = Parse "Depends on:" or "Related to:" from plan.md
    
    FOR EACH dependency in $dependencies:
      IF NOT EXISTS(".github/key-data-streams/{dependency}/") THEN
        REGISTER DRIFT:
          key: "kds-broken-dependency-{key}"
          severity: "medium"
          description: "Plan references non-existent key: {dependency}"
          recommendation: "Update plan.md or create dependent key"
      ELSE
        # Check for circular dependencies
        $depPlan = "{dependency}/{dependency}.plan.md"
        IF EXISTS($depPlan) THEN
          $depDependencies = Parse dependencies from $depPlan
          IF $key IN $depDependencies THEN
            REGISTER DRIFT:
              key: "kds-circular-dependency-{key}"
              severity: "high"
              description: "Circular dependency: {key} ↔ {dependency}"
              recommendation: "Refactor to remove circular dependency"
          END IF
        END IF
      END IF
    END FOR
  END IF
END FOR
```

---

## Script 9: Copilot Workspace Compliance Validation

```powershell
# Algorithm: Validate .copilot/CONTEXT/ for MANDATORY.md Violations
# Reference: .github/MANDATORY.md (NO-CODE-IN-CHAT, DOCUMENT-FIRST rules)

$copilotContext = ".copilot/CONTEXT/"
$chatViolations = @()

IF FolderExists($copilotContext) THEN
  $chatFiles = Get files matching "*.md" in $copilotContext
  
  FOR EACH chatFile in $chatFiles:
    $content = ReadFile(chatFile)
    
    # Violation 1: NO-CODE-IN-CHAT (54+ code blocks detected in CopilotChats.md)
    $codeBlockPattern = '```(csharp|javascript|typescript|html|css|sql|razor)\s*\r?\n([\s\S]*?)```'
    $codeBlocks = [regex]::Matches($content, $codeBlockPattern)
    
    IF $codeBlocks.Count > 0 THEN
      # Count lines in code blocks
      $totalLines = 0
      $blocksByLanguage = @{}
      
      FOR EACH block in $codeBlocks:
        $language = block.Groups[1].Value
        $codeContent = block.Groups[2].Value
        $lineCount = ($codeContent -split '\r?\n').Count
        $totalLines += $lineCount
        
        IF NOT $blocksByLanguage.ContainsKey($language) THEN
          $blocksByLanguage[$language] = @{ Count = 0; Lines = 0 }
        END IF
        
        $blocksByLanguage[$language].Count++
        $blocksByLanguage[$language].Lines += $lineCount
      END FOR
      
      # Violation threshold: >10 config JSON lines OR any implementation code
      $configOnly = $codeBlocks.Count == 1 AND 
                    $blocksByLanguage['json'] AND 
                    $blocksByLanguage['json'].Lines <= 10
      
      IF NOT $configOnly THEN
        $chatViolations.Add(@{
          File = chatFile
          Type = "NO-CODE-IN-CHAT"
          Severity = "CRITICAL"
          Count = $codeBlocks.Count
          TotalLines = $totalLines
          Languages = $blocksByLanguage
          Message = "Implementation code in chat (should be in KDS work-log.md)"
          AutoFix = "Scripts/fix-copilotchats-violations.ps1"
        })
      END IF
    END IF
    
    # Violation 2: Method implementations in chat
    $methodPatterns = @(
      'public .* \{', 'private .* \{', 'async .* \{',
      'function .* \{', 'const .* => \{', 'class .* \{'
    )
    
    $methodCount = 0
    FOR EACH pattern in $methodPatterns:
      $methodCount += ([regex]::Matches($content, $pattern)).Count
    END FOR
  END FOR
END IF
```

---

**End of Healthcheck Validation Scripts**
