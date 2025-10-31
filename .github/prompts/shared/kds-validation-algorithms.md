# KDS Validation Algorithms
**Purpose:** Pseudocode algorithms for kds.prompt.md governance validation  
**Version:** 1.0.0  
**Last Updated:** 2025-10-31

---

## Algorithm 1: Compatibility Check

**Purpose:** Validate proposed changes against existing KDS rules

```
FUNCTION CompatibilityCheck(proposedChange):
  
  // Load existing governance documents
  existingRules = ReadFile("MANDATORY.md")
  handoffProtocol = ReadFile("kds-handoff-protocol.md")
  activePlan = ReadFile(".github/key-data-streams/kds/kds.plan.md")
  
  // Initialize conflict tracking
  conflicts = []
  
  // Check each rule for violations
  FOR EACH rule IN existingRules:
    IF ProposedChangeViolates(proposedChange, rule) THEN
      conflicts.append({
        "rule": rule.number,
        "description": rule.text,
        "violation": DescribeConflict(proposedChange, rule)
      })
    END IF
  END FOR
  
  // Return conflict analysis
  RETURN {
    "hasConflicts": conflicts.length > 0,
    "conflicts": conflicts,
    "severity": CalculateSeverity(conflicts)
  }
  
END FUNCTION
```

---

## Algorithm 2: Cascading Impact Analysis

**Purpose:** Identify all files affected by a proposed change

```
FUNCTION AnalyzeCascadingImpacts(proposedChange):
  
  affectedFiles = []
  
  // Check if change affects prompts
  IF proposedChange.target == "prompt" THEN
    affectedFiles = FindDependentPrompts(proposedChange.promptName)
  END IF
  
  // Check if change affects MANDATORY.md
  IF proposedChange.target == "MANDATORY.md" THEN
    affectedFiles = GetAllFiles(".github/prompts/*.prompt.md")
  END IF
  
  // Check if change affects handoff protocol
  IF proposedChange.target == "kds-handoff-protocol.md" THEN
    affectedFiles = ["route", "plan", "test-generation", "task", "todo"]
  END IF
  
  RETURN {
    "affectedFiles": affectedFiles,
    "count": affectedFiles.length,
    "estimatedFixTime": EstimateFixTime(affectedFiles)
  }
  
END FUNCTION
```

---

## Algorithm 3: Conflict Report Generation

**Purpose:** Generate formatted conflict report for user

```
FUNCTION GenerateConflictReport(conflicts, affectedFiles):
  
  IF conflicts.length > 0 OR affectedFiles.length > 3 THEN
    
    report = {
      "type": "CONFLICT_DETECTED",
      "conflicts": conflicts,
      "affectedFiles": affectedFiles,
      "cascadingChanges": ListRequiredChanges(affectedFiles),
      "estimatedTime": CalculateTotalTime(conflicts, affectedFiles)
    }
    
    options = [
      "A) Resolve conflicts first (show resolution steps)",
      "B) Modify proposal to avoid conflicts",
      "C) Cancel change",
      "D) Force change (mark as tech debt)"
    ]
    
    RETURN {
      "report": report,
      "options": options,
      "action": "HALT"
    }
    
  ELSE
    
    RETURN {
      "status": "APPROVED",
      "action": "PROCEED"
    }
    
  END IF
  
END FUNCTION
```

---

## Algorithm 4: Review Mode Validation

**Purpose:** Validate all prompt files against KDS Rulebook

```
FUNCTION ValidateAllPrompts():
  
  promptFiles = GetAllFiles(".github/prompts/*.prompt.md")
  violations = []
  
  FOR EACH promptFile IN promptFiles:
    
    // Rule #1: Concise Output Format
    codeBlocks = DetectCodeBlocks(promptFile)
    IF codeBlocks.count > 0 AND NOT IsInSharedFolder(promptFile) THEN
      violations.append({
        "file": promptFile,
        "rule": "Rule #1 - Concise Output Format",
        "violation": "Code blocks in user-facing sections",
        "lines": codeBlocks.lines,
        "severity": "CRITICAL"
      })
    END IF
    
    // Rule #8: No pseudocode in prompts
    pseudocode = DetectPseudocode(promptFile)
    IF pseudocode.count > 0 AND NOT IsInSharedFolder(promptFile) THEN
      violations.append({
        "file": promptFile,
        "rule": "Rule #1 - Concise Output Format",
        "violation": "Pseudocode FUNCTION/FOR EACH blocks",
        "lines": pseudocode.lines,
        "severity": "CRITICAL"
      })
    END IF
    
    // Rule #11: Key display
    hasKeyDisplay = CheckKeyDisplay(promptFile)
    IF NOT hasKeyDisplay THEN
      violations.append({
        "file": promptFile,
        "rule": "Rule #11 - Key Display",
        "violation": "Missing key in output templates",
        "severity": "MEDIUM"
      })
    END IF
    
    // Long bullets check
    longBullets = DetectLongBullets(promptFile, maxLines=3)
    IF longBullets.count > 0 THEN
      violations.append({
        "file": promptFile,
        "rule": "Rule #1 - Concise Output Format",
        "violation": "Bullets exceeding 3 lines",
        "lines": longBullets.lines,
        "severity": "MEDIUM"
      })
    END IF
    
  END FOR
  
  RETURN violations
  
END FUNCTION
```

---

## Algorithm 5: Cleanup Target Identification

**Purpose:** Identify files for archival (backup files, old folders)

```
FUNCTION IdentifyCleanupTargets():
  
  cleanupTargets = []
  preserveList = []
  
  // PHASE 1: Identify patterns to archive
  backupFiles = FindFiles(".github/**/*.backup")
  bakFiles = FindFiles(".github/**/*.bak")
  tmpFiles = FindFiles(".github/**/*.tmp")
  backupFolders = FindFolders(".github/**/*-backup-*")
  oldAudits = FindOldFiles(".github/audits/", olderThan=90)
  
  cleanupTargets = Merge(backupFiles, bakFiles, tmpFiles, backupFolders, oldAudits)
  
  // PHASE 2: Identify files to preserve
  activeKeys = FindActiveKeys(modifiedWithin=90)
  referencedFiles = FindReferencedFiles(".github/")
  testFiles = GetAllFiles(".github/tests/")
  governanceFiles = ["kds-rulebook.json", "kds-rulebook.md", "MANDATORY.md"]
  
  preserveList = Merge(activeKeys, referencedFiles, testFiles, governanceFiles)
  
  // PHASE 3: Filter cleanup targets
  safeToArchive = []
  FOR EACH target IN cleanupTargets:
    IF NOT Contains(preserveList, target) THEN
      safeToArchive.append(target)
    END IF
  END FOR
  
  RETURN {
    "archiveTargets": safeToArchive,
    "preservedFiles": preserveList,
    "archivePath": ".github/_ARCHIVE/cleanup-{timestamp}/"
  }
  
END FUNCTION
```

---

## Algorithm 6: Prompt Consolidation Analysis

**Purpose:** Detect duplicate functionality across prompts

```
FUNCTION AnalyzeConsolidationOpportunities(prompts):
  
  consolidationCandidates = []
  
  FOR i = 0 TO prompts.length - 1:
    FOR j = i + 1 TO prompts.length - 1:
      
      prompt1 = prompts[i]
      prompt2 = prompts[j]
      
      // Calculate content overlap
      overlap = CalculateOverlap(prompt1.content, prompt2.content)
      
      // Check usage patterns
      usage1 = FindReferences(prompt1.name)
      usage2 = FindReferences(prompt2.name)
      
      // Consolidation criteria
      IF overlap > 80% THEN
        consolidationCandidates.append({
          "prompt1": prompt1.name,
          "prompt2": prompt2.name,
          "overlap": overlap,
          "recommendation": "CONSOLIDATE",
          "reason": "High content duplication"
        })
      ELSE IF usage1.count == 0 AND LastModified(prompt1) > 30 THEN
        consolidationCandidates.append({
          "prompt": prompt1.name,
          "recommendation": "ARCHIVE",
          "reason": "No recent usage"
        })
      ELSE
        // Keep separate
        consolidationCandidates.append({
          "prompt1": prompt1.name,
          "prompt2": prompt2.name,
          "overlap": overlap,
          "recommendation": "KEEP_SEPARATE",
          "reason": "Unique responsibilities confirmed"
        })
      END IF
      
    END FOR
  END FOR
  
  RETURN consolidationCandidates
  
END FUNCTION
```

---

## Algorithm 7: Auto-Fix Critical Issues (NEW - Option B Implementation)

**Purpose:** Automatically extract pseudocode and regenerate prompts

```
FUNCTION AutoFixCriticalIssues(violations):
  
  fixedPrompts = []
  errors = []
  
  FOR EACH violation IN violations:
    
    IF violation.severity == "CRITICAL" AND violation.rule == "Rule #1" THEN
      
      TRY:
        
        // Step 1: Read entire prompt file
        promptContent = ReadFile(violation.file)
        promptLines = SplitLines(promptContent)
        
        // Step 2: Extract pseudocode sections
        pseudocodeBlocks = ExtractPseudocodeBlocks(violation.lines)
        
        // Step 3: Create shared algorithm file
        algorithmFileName = GenerateAlgorithmFileName(violation.file)
        algorithmPath = ".github/prompts/shared/" + algorithmFileName
        
        CreateFile(algorithmPath, pseudocodeBlocks)
        
        // Step 4: Delete original prompt
        DeleteFile(violation.file)
        
        // Step 5: Regenerate prompt with algorithm references
        newPromptContent = RegeneratePromptWithReferences(
          promptContent,
          violation.lines,
          algorithmPath
        )
        
        CreateFile(violation.file, newPromptContent)
        
        // Step 6: Verify no duplication
        duplicates = DetectDuplicateSections(violation.file)
        
        IF duplicates.count == 0 THEN
          fixedPrompts.append({
            "file": violation.file,
            "status": "FIXED",
            "algorithmFile": algorithmPath
          })
        ELSE
          errors.append({
            "file": violation.file,
            "error": "Duplication detected after regeneration"
          })
        END IF
        
      CATCH error:
        errors.append({
          "file": violation.file,
          "error": error.message
        })
      END TRY
      
    END IF
    
  END FOR
  
  RETURN {
    "fixed": fixedPrompts,
    "errors": errors,
    "commitMessage": GenerateCommitMessage(fixedPrompts)
  }
  
END FUNCTION

// Helper: Extract pseudocode blocks from file
FUNCTION ExtractPseudocodeBlocks(lines):
  
  blocks = []
  currentBlock = ""
  inBlock = false
  
  FOR EACH line IN lines:
    IF line MATCHES "FUNCTION|FOR EACH|IF.*THEN|WHILE.*DO" THEN
      inBlock = true
      currentBlock = line
    ELSE IF inBlock AND line MATCHES "END FUNCTION|END FOR|END IF|END WHILE" THEN
      currentBlock += line
      blocks.append(currentBlock)
      currentBlock = ""
      inBlock = false
    ELSE IF inBlock THEN
      currentBlock += line
    END IF
  END FOR
  
  RETURN blocks
  
END FUNCTION

// Helper: Regenerate prompt with algorithm references
FUNCTION RegeneratePromptWithReferences(originalContent, violationLines, algorithmPath):
  
  newContent = ""
  
  FOR EACH section IN originalContent.sections:
    
    IF section.lineRange OVERLAPS violationLines THEN
      // Replace pseudocode with reference
      newContent += "**Algorithm:** See `" + algorithmPath + "`\n"
    ELSE
      // Keep original section
      newContent += section.content
    END IF
    
  END FOR
  
  RETURN newContent
  
END FUNCTION
```

---

## Algorithm 8: Git History Validation (NEW - Rule #15)

**Purpose:** Analyze git commit history for KDS rule violations

```
FUNCTION ValidateGitHistory(workspaceRoot):
  
  // Step 1: Load git commit history
  gitLogCommand = "git log --all --oneline --since='90 days ago' -- .github/"
  gitLogOutput = ExecuteCommand(gitLogCommand, workspaceRoot)
  
  commits = ParseCommits(gitLogOutput)
  
  // Step 2: Initialize violation tracking
  violations = {
    "Rule #10": [],  // KDS Governance
    "Rule #2": [],   // Document First
    "Rule #5": [],   // TDD
    "Rule #8": []    // Holistic Regeneration
  }
  
  totalCommits = commits.length
  
  // Step 3: Analyze each commit
  FOR EACH commit IN commits:
    
    // Rule #10: KDS Governance (Direct .github modifications)
    IF commit.files.Contains(".github/prompts/") OR commit.files.Contains(".github/instructions/") THEN
      IF NOT commit.message.StartsWith("kds:") AND NOT commit.message.Contains("governance") THEN
        violations["Rule #10"].append({
          "sha": commit.sha,
          "message": commit.message,
          "author": commit.author,
          "date": commit.date,
          "violation": "Direct .github modification without kds: prefix"
        })
      END IF
    END IF
    
    // Rule #2: Document First (Code before docs)
    IF commit.message.Contains("feat:") OR commit.message.Contains("fix:") THEN
      // Look for preceding doc commit within last 5 commits
      precedingDocCommit = FindPrecedingDocCommit(commits, commit.index, lookback=5)
      
      IF NOT precedingDocCommit THEN
        violations["Rule #2"].append({
          "sha": commit.sha,
          "message": commit.message,
          "author": commit.author,
          "date": commit.date,
          "violation": "Implementation commit without preceding documentation commit"
        })
      END IF
    END IF
    
    // Rule #5: TDD (Missing test commits)
    IF commit.message.Contains("feat:") THEN
      // Look for test commit (before or after, within 3 commits)
      relatedTestCommit = FindRelatedTestCommit(commits, commit.index, window=3)
      
      IF NOT relatedTestCommit THEN
        violations["Rule #5"].append({
          "sha": commit.sha,
          "message": commit.message,
          "author": commit.author,
          "date": commit.date,
          "violation": "Feature commit without corresponding test commit"
        })
      END IF
    END IF
    
    // Rule #8: Holistic Regeneration (Partial edits)
    IF commit.message.Contains("update") OR commit.message.Contains("modify") THEN
      IF NOT commit.message.Contains("regenerate") AND NOT commit.message.Contains("holistic") THEN
        violations["Rule #8"].append({
          "sha": commit.sha,
          "message": commit.message,
          "author": commit.author,
          "date": commit.date,
          "violation": "Partial file edit (should use holistic regeneration)"
        })
      END IF
    END IF
    
  END FOR
  
  // Step 4: Calculate violation percentages
  violationSummary = {}
  FOR EACH rule IN violations.keys():
    violationCount = violations[rule].length
    violationPercentage = (violationCount / totalCommits) * 100
    
    violationSummary[rule] = {
      "count": violationCount,
      "percentage": violationPercentage
    }
  END FOR
  
  // Step 5: Detect patterns
  patterns = DetectViolationPatterns(violations)
  
  // Step 6: Trend analysis
  trends = AnalyzeTrends(violations, commits, timeWindow=30)
  
  // Step 7: Generate recommendations
  recommendations = GenerateRecommendations(violationSummary, patterns, trends)
  
  // Step 8: Return compliance report
  RETURN {
    "commitsAnalyzed": totalCommits,
    "violationSummary": violationSummary,
    "patterns": patterns,
    "trends": trends,
    "recommendations": recommendations
  }
  
END FUNCTION

// Helper: Parse git log output into commit objects
FUNCTION ParseCommits(gitLogOutput):
  
  commits = []
  lines = SplitLines(gitLogOutput)
  
  FOR i = 0 TO lines.length - 1:
    line = lines[i]
    
    // Parse: {sha} {message}
    parts = line.split(" ", limit=2)
    sha = parts[0]
    message = parts[1]
    
    // Get commit details
    detailsCommand = "git show --stat " + sha
    details = ExecuteCommand(detailsCommand)
    
    commits.append({
      "index": i,
      "sha": sha,
      "message": message,
      "author": ExtractAuthor(details),
      "date": ExtractDate(details),
      "files": ExtractFiles(details)
    })
  END FOR
  
  RETURN commits
  
END FUNCTION

// Helper: Find preceding documentation commit
FUNCTION FindPrecedingDocCommit(commits, currentIndex, lookback):
  
  FOR i = currentIndex - 1 DOWN TO MAX(0, currentIndex - lookback):
    commit = commits[i]
    
    IF commit.message.StartsWith("docs:") THEN
      RETURN commit
    END IF
  END FOR
  
  RETURN null
  
END FUNCTION

// Helper: Find related test commit
FUNCTION FindRelatedTestCommit(commits, currentIndex, window):
  
  startIndex = MAX(0, currentIndex - window)
  endIndex = MIN(commits.length - 1, currentIndex + window)
  
  FOR i = startIndex TO endIndex:
    commit = commits[i]
    
    IF commit.message.StartsWith("test:") THEN
      RETURN commit
    END IF
  END FOR
  
  RETURN null
  
END FUNCTION

// Helper: Detect violation patterns
FUNCTION DetectViolationPatterns(violations):
  
  patterns = []
  
  // Pattern 1: Bypassing Gatekeeper
  IF violations["Rule #10"].length > 0 THEN
    patterns.append({
      "pattern": "Bypassing Gatekeeper",
      "count": violations["Rule #10"].length,
      "description": "Direct .github edits without kds.prompt.md approval"
    })
  END IF
  
  // Pattern 2: Code-Before-Docs
  IF violations["Rule #2"].length > 0 THEN
    patterns.append({
      "pattern": "Code-Before-Docs",
      "count": violations["Rule #2"].length,
      "description": "Implementation committed before documentation"
    })
  END IF
  
  // Pattern 3: Missing Tests
  IF violations["Rule #5"].length > 0 THEN
    patterns.append({
      "pattern": "Missing Tests",
      "count": violations["Rule #5"].length,
      "description": "Feature commits with no corresponding test commits"
    })
  END IF
  
  RETURN patterns
  
END FUNCTION

// Helper: Analyze trends
FUNCTION AnalyzeTrends(violations, commits, timeWindow):
  
  now = CurrentDate()
  windowStart = now - timeWindow
  
  // Recent violations (last 30 days)
  recentViolations = FilterByDate(violations, windowStart, now)
  recentViolationCount = CountViolations(recentViolations)
  
  // Historical violations (30-60 days ago)
  historicalStart = now - (timeWindow * 2)
  historicalEnd = windowStart
  historicalViolations = FilterByDate(violations, historicalStart, historicalEnd)
  historicalViolationCount = CountViolations(historicalViolations)
  
  // Calculate trend
  IF recentViolationCount < historicalViolationCount THEN
    trend = "IMPROVING"
  ELSE IF recentViolationCount > historicalViolationCount THEN
    trend = "DEGRADING"
  ELSE
    trend = "STABLE"
  END IF
  
  RETURN {
    "trend": trend,
    "recentViolations": recentViolationCount,
    "historicalViolations": historicalViolationCount
  }
  
END FUNCTION

// Helper: Generate recommendations
FUNCTION GenerateRecommendations(violationSummary, patterns, trends):
  
  recommendations = []
  
  // Rule #10 recommendations
  IF violationSummary["Rule #10"].percentage > 10 THEN
    recommendations.append("Strengthen Rule #10 enforcement (pre-commit hook to block direct .github edits)")
  END IF
  
  // Rule #2 recommendations
  IF violationSummary["Rule #2"].percentage > 20 THEN
    recommendations.append("Add Rule #2 timestamp validation (reject commits if doc commit not in last 5 commits)")
  END IF
  
  // Rule #5 recommendations
  IF violationSummary["Rule #5"].percentage > 15 THEN
    recommendations.append("Improve Rule #5 visibility (plan.prompt.md should emphasize test-first workflow)")
  END IF
  
  // Trend-based recommendations
  IF trends.trend == "DEGRADING" THEN
    recommendations.append("⚠️ CRITICAL: Violations increasing - consider governance review meeting")
  END IF
  
  RETURN recommendations
  
END FUNCTION
```

---

## Algorithm 9: Test Quality Scoring (NEW - Rule #16)

**Purpose:** Calculate test quality score and generate quality report

**NOTE:** Full implementation in `.github/prompts/shared/test-quality-scoring.md`

```
FUNCTION ValidateTestQuality(testFilePath, acceptanceCriteria):
  
  // Call Algorithm 9 from test-quality-scoring.md
  scoreObject = CalculateTestQualityScore(testFilePath, acceptanceCriteria)
  
  // Generate quality report file
  reportPath = GenerateQualityReportPath(testFilePath)
  reportContent = GenerateQualityReport(scoreObject, testName, key)
  
  WriteFile(reportPath, reportContent)
  
  // Determine approval recommendation
  IF scoreObject.totalScore >= 80 THEN
    recommendation = "A. APPROVE"
  ELSE IF scoreObject.totalScore >= 60 THEN
    recommendation = "B. REVISE"
  ELSE
    recommendation = "C. REGENERATE"
  END IF
  
  RETURN {
    "score": scoreObject.totalScore,
    "grade": scoreObject.grade,
    "breakdown": scoreObject.breakdown,
    "recommendations": scoreObject.recommendations,
    "approvalRecommendation": recommendation,
    "reportPath": reportPath
  }
  
END FUNCTION
```

---

## Algorithm 10: Inject PlaywrightLogger (NEW - Rule #2b Enforcement)

**Purpose:** Automatically inject PlaywrightLogger infrastructure into Razor components with unique markers

```
FUNCTION InjectPlaywrightLogger(componentPath, componentName, workspaceRoot):
  
  # Step 1: Read component file
  componentContent = ReadFile(componentPath)
  
  # Step 2: Generate unique marker
  timestamp = GetCurrentTimestamp("yyyyMMddHHmmss")
  markerValue = timestamp + "-" + componentName
  
  # Step 3: Inject marker into root div (if not already present)
  IF NOT componentContent.Contains("data-playwright-log-marker") THEN
    
    # Find root div or component container
    rootDivPattern = "<div[^>]*>"
    
    IF componentContent.Match(rootDivPattern) THEN
      # Inject marker attribute into first div
      componentContent = ReplaceFirst(
        componentContent,
        rootDivPattern,
        "<div data-playwright-log-marker=\"@($\"{DateTime.UtcNow:yyyyMMddHHmmss}-" + componentName + "\")\">"
      )
    ELSE
      # Component has no root div - wrap content
      componentContent = 
        "<div data-playwright-log-marker=\"@($\"{DateTime.UtcNow:yyyyMMddHHmmss}-" + componentName + "\")\">\n" +
        componentContent +
        "\n</div>"
    END IF
    
  END IF
  
  # Step 4: Inject PlaywrightLogger script (if not already present)
  IF NOT componentContent.Contains("PlaywrightLogger.init()") THEN
    
    scriptBlock = 
      "<script data-playwright-log-marker=\"@($\"{DateTime.UtcNow:yyyyMMddHHmmss}-" + componentName + "\")\">
  // PlaywrightLogger initialization
  if (window.PlaywrightLogger) {
    window.PlaywrightLogger.init();
  }
</script>"
    
    # Insert before closing tag or at end
    componentContent = InjectBeforeClosingTag(componentContent, scriptBlock)
    
  END IF
  
  # Step 5: Ensure PlaywrightLogger.js exists
  playwrightLoggerPath = Path.Combine(workspaceRoot, "SPA/NoorCanvas/wwwroot/js/PlaywrightLogger.js")
  
  playwrightLoggerExists = FileExists(playwrightLoggerPath)
  
  IF NOT playwrightLoggerExists THEN
    
    playwrightLoggerContent = 
"window.PlaywrightLogger = {
    enabled: true,
    
    init: function() {
        if (!this.enabled) return;
        
        // Global click listener
        document.addEventListener('click', (e) => {
            const target = e.target;
            const testId = target.getAttribute('data-testid') || 
                          target.closest('[data-testid]')?.getAttribute('data-testid');
            const selector = testId ? `[data-testid=\"${testId}\"]` : this.getSelector(target);
            const elementType = target.tagName.toLowerCase();
            const elementText = target.textContent?.trim().substring(0, 50);
            
            const timestamp = new Date().toISOString();
            console.log(`[PLAYWRIGHT-LOG] ${timestamp} | CLICK | ${selector} | ${elementType} | \"${elementText}\"`);
        });
    },
    
    getSelector: function(element) {
        const path = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let selector = element.nodeName.toLowerCase();
            if (element.id) {
                selector += '#' + element.id;
                path.unshift(selector);
                break;
            } else {
                let sibling = element;
                let nth = 1;
                while (sibling = sibling.previousElementSibling) {
                    if (sibling.nodeName.toLowerCase() === selector) nth++;
                }
                if (nth !== 1) selector += `:nth-of-type(${nth})`;
            }
            path.unshift(selector);
            element = element.parentNode;
        }
        return path.join(' > ');
    }
};"
    
    CreateFile(playwrightLoggerPath, playwrightLoggerContent)
    Log("Created: PlaywrightLogger.js")
    
  END IF
  
  # Step 6: Update appsettings.json
  appsettingsPath = Path.Combine(workspaceRoot, "SPA/NoorCanvas/appsettings.json")
  
  appsettingsUpdated = false
  
  IF FileExists(appsettingsPath) THEN
    
    config = ReadJson(appsettingsPath)
    
    IF NOT config.Contains("PlaywrightLogging") THEN
      config["PlaywrightLogging"] = {
        "Enabled": true,
        "LogLevel": "Debug",
        "OutputFormat": "Console",
        "RedactSensitiveData": true
      }
      
      WriteJson(appsettingsPath, config)
      Log("Updated: appsettings.json (PlaywrightLogging section added)")
      appsettingsUpdated = true
    END IF
    
  END IF
  
  # Step 7: Write modified component
  WriteFile(componentPath, componentContent)
  
  RETURN {
    success: true,
    componentPath: componentPath,
    markerValue: markerValue,
    playwrightLoggerCreated: NOT playwrightLoggerExists,
    appsettingsUpdated: appsettingsUpdated
  }
  
END FUNCTION
```

**Usage Example:**

```
# Auto-inject during component creation
result = InjectPlaywrightLogger(
  "SPA/NoorCanvas/Components/HostControlPanel.razor",
  "HostControlPanel",
  "D:/PROJECTS/NOOR CANVAS"
)

IF result.success THEN
  Log("✅ PlaywrightLogger injected successfully")
  Log("   Marker: " + result.markerValue)
  Log("   PlaywrightLogger.js: " + (result.playwrightLoggerCreated ? "Created" : "Exists"))
  Log("   appsettings.json: " + (result.appsettingsUpdated ? "Updated" : "Already configured"))
END IF
```

**Integration Points:**
- `task.prompt.md` Step 6.6: Auto-invoke when creating Razor components
- `test-generation.prompt.md` Step 1.5: Verify logger present before test generation
- `cleanup-playwright-logging.prompt.md`: Remove all markers after test generation complete

**Key Configuration:**

```json
{
  "PlaywrightLogging": {
    "Enabled": true,
    "LogLevel": "Debug",
    "OutputFormat": "Console",
    "RedactSensitiveData": true
  }
}
```

**Marker Format:**
- Pattern: `{yyyyMMddHHmmss}-{ComponentName}`
- Example: `20251031143022-HostControlPanel`
- Uniqueness: Timestamp ensures no collisions across components

---

## Helper Functions

### DetectCodeBlocks
```
FUNCTION DetectCodeBlocks(fileContent):
  
  codeBlocks = []
  lines = SplitLines(fileContent)
  
  FOR i = 0 TO lines.length - 1:
    IF lines[i] MATCHES "```(csharp|typescript|javascript|powershell|bash|sql|json)" THEN
      startLine = i
      FOR j = i + 1 TO lines.length - 1:
        IF lines[j] MATCHES "```" THEN
          codeBlocks.append({
            "start": startLine,
            "end": j,
            "language": ExtractLanguage(lines[i])
          })
          BREAK
        END IF
      END FOR
    END IF
  END FOR
  
  RETURN codeBlocks
  
END FUNCTION
```

### DetectPseudocode
```
FUNCTION DetectPseudocode(fileContent):
  
  pseudocodeLines = []
  lines = SplitLines(fileContent)
  
  FOR i = 0 TO lines.length - 1:
    IF lines[i] MATCHES "FUNCTION|FOR EACH|IF.*THEN|WHILE.*DO|PROCEDURE" THEN
      pseudocodeLines.append(i)
    END IF
  END FOR
  
  RETURN {
    "count": pseudocodeLines.length,
    "lines": pseudocodeLines
  }
  
END FUNCTION
```

### IsInSharedFolder
```
FUNCTION IsInSharedFolder(filePath):
  RETURN filePath.contains(".github/prompts/shared/")
END FUNCTION
```

---

**End of KDS Validation Algorithms**
