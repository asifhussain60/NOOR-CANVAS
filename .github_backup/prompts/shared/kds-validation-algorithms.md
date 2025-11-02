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
  
  # Step 5: Ensure PlaywrightLogger.js exists (with dual-stream auto-save)
  playwrightLoggerPath = Path.Combine(workspaceRoot, "SPA/NoorCanvas/wwwroot/js/PlaywrightLogger.js")
  
  playwrightLoggerExists = FileExists(playwrightLoggerPath)
  
  IF NOT playwrightLoggerExists THEN
    
    playwrightLoggerContent = 
"window.PlaywrightLogger = {
    enabled: true,
    logBuffer: [],
    maxBufferSize: 10,
    flushInterval: 5000,
    
    init: function() {
        if (!this.enabled) return;
        
        console.log('[PLAYWRIGHT-LOG] Logger initialized');
        
        // Global click listener
        document.addEventListener('click', (e) => {
            const target = e.target;
            const testId = target.getAttribute('data-testid') || 
                          target.closest('[data-testid]')?.getAttribute('data-testid');
            const selector = testId ? `[data-testid=\"${testId}\"]` : this.getSelector(target);
            const elementType = target.tagName.toLowerCase();
            const elementText = target.textContent?.trim().substring(0, 50);
            
            const timestamp = new Date().toISOString();
            const logEntry = `${timestamp} | CLICK | ${selector} | ${elementType} | \"${elementText}\"`;
            console.log(`[PLAYWRIGHT-LOG] ${logEntry}`);
            this.addLog(logEntry);
        }, true);
        
        // Input changes
        document.addEventListener('input', (e) => {
            const target = e.target;
            const testId = target.getAttribute('data-testid') || 
                          target.closest('[data-testid]')?.getAttribute('data-testid');
            const selector = testId ? `[data-testid=\"${testId}\"]` : this.getSelector(target);
            const value = target.value?.substring(0, 50) || '';
            
            const timestamp = new Date().toISOString();
            const logEntry = `${timestamp} | INPUT | ${selector} | value=\"${value}\"`;
            console.log(`[PLAYWRIGHT-LOG] ${logEntry}`);
            this.addLog(logEntry);
        }, true);
        
        // Navigation tracking
        let lastUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== lastUrl) {
                const timestamp = new Date().toISOString();
                const logEntry = `${timestamp} | NAVIGATE | ${window.location.href}`;
                console.log(`[PLAYWRIGHT-LOG] ${logEntry}`);
                this.addLog(logEntry);
                lastUrl = window.location.href;
            }
        }, 100);
        
        // Auto-flush every 5 seconds or 10 entries
        setInterval(() => {
            this.flushLogs();
        }, this.flushInterval);
        
        // Flush before page unload
        window.addEventListener('beforeunload', () => {
            this.flushLogs(true);
        });
    },
    
    addLog: function(logEntry) {
        this.logBuffer.push(logEntry);
        if (this.logBuffer.length >= this.maxBufferSize) {
            this.flushLogs();
        }
    },
    
    flushLogs: function(synchronous = false) {
        if (this.logBuffer.length === 0) return;
        
        const logsToSend = [...this.logBuffer];
        this.logBuffer = [];
        
        if (synchronous) {
            const blob = new Blob([JSON.stringify({ logs: logsToSend })], { type: 'application/json' });
            navigator.sendBeacon('/api/playwright-logs', blob);
        } else {
            this.saveLogs(logsToSend);
        }
    },
    
    saveLogs: function(logs) {
        fetch('/api/playwright-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs: logs })
        }).then(() => {
            console.log(`[PLAYWRIGHT-LOG] Saved ${logs.length} entries to server`);
        }).catch(err => {
            console.error('[PLAYWRIGHT-LOG] Failed to save:', err);
            this.logBuffer.unshift(...logs);
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
  
  # Step 6: Update appsettings.json (Dual-Stream Logging)
  appsettingsPath = Path.Combine(workspaceRoot, "SPA/NoorCanvas/appsettings.json")
  
  appsettingsUpdated = false
  
  IF FileExists(appsettingsPath) THEN
    
    config = ReadJson(appsettingsPath)
    
    IF NOT config.Contains("PlaywrightLogging") THEN
      config["PlaywrightLogging"] = {
        "Enabled": true,
        "LogLevel": "Debug",
        "OutputFormat": "Console",
        "RedactSensitiveData": true,
        "DualStream": {
          "ClientLogs": "playwright-interaction-logs.txt",
          "ServerLogs": "playwright-server-logs.txt",
          "CorrelationEnabled": true
        }
      }
      
      # Add Serilog file writer for server logs
      IF config.Contains("Serilog") AND config["Serilog"].Contains("WriteTo") THEN
        config["Serilog"]["WriteTo"].Append({
          "Name": "File",
          "Args": {
            "path": "playwright-server-logs.txt",
            "outputTemplate": "[SERVER] {Timestamp:yyyy-MM-ddTHH:mm:ss.fffZ} | {SourceContext} | {Message:lj}{NewLine}",
            "restrictedToMinimumLevel": "Debug"
          }
        })
      END IF
      
      WriteJson(appsettingsPath, config)
      Log("Updated: appsettings.json (PlaywrightLogging + Serilog dual-stream)")
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
    "RedactSensitiveData": true,
    "DualStream": {
      "ClientLogs": "playwright-interaction-logs.txt",
      "ServerLogs": "playwright-server-logs.txt",
      "CorrelationEnabled": true
    }
  },
  "Serilog": {
    "WriteTo": [
      {
        "Name": "File",
        "Args": {
          "path": "playwright-server-logs.txt",
          "outputTemplate": "[SERVER] {Timestamp:yyyy-MM-ddTHH:mm:ss.fffZ} | {SourceContext} | {Message:lj}{NewLine}"
        }
      }
    ]
  }
}
```

**Dual-Stream Architecture:**
- **Client Stream**: Browser interactions → POST `/api/playwright-logs` → `playwright-interaction-logs.txt`
- **Server Stream**: Blazor ILogger → Serilog → `playwright-server-logs.txt`
- **Correlation**: Timestamp matching for assertion generation

**Marker Format:**
- Pattern: `{yyyyMMddHHmmss}-{ComponentName}`
- Example: `20251031143022-HostControlPanel`
- Uniqueness: Timestamp ensures no collisions across components

---

## Algorithm 11: Validate Auto-Chain Handoffs (NEW - Phase 1 P0)

**Purpose:** Validate handoff JSONs have required auto-chain fields and nextTask pointers resolve

```
FUNCTION ValidateAutoChainHandoffs(workspaceRoot, keyName):
  
  # Step 1: Find all handoff JSON files for this key
  handoffsPath = Path.Combine(workspaceRoot, ".github/key-data-streams/", keyName, "handoffs/")
  
  IF NOT DirectoryExists(handoffsPath) THEN
    RETURN {
      valid: false,
      reason: "Handoffs directory does not exist",
      path: handoffsPath
    }
  END IF
  
  handoffFiles = FindFiles(handoffsPath, "*.json")
  
  IF handoffFiles.Count == 0 THEN
    RETURN {
      valid: true,
      reason: "No handoff files to validate (new key)",
      handoffsChecked: 0
    }
  END IF
  
  # Step 2: Initialize violation tracking
  violations = []
  validHandoffs = 0
  
  # Step 3: Validate each handoff JSON
  FOR EACH handoffFile IN handoffFiles:
    
    handoffContent = ReadFile(handoffFile)
    handoffJSON = ParseJSON(handoffContent)
    
    # Check required fields
    requiredFields = ["key", "description", "acceptanceCriteria"]
    missingFields = []
    
    FOR EACH field IN requiredFields:
      IF NOT handoffJSON.ContainsKey(field) THEN
        missingFields.Add(field)
      END IF
    END FOR
    
    # Check auto-chain specific fields (if autoChain enabled)
    IF handoffJSON.ContainsKey("autoChain") AND handoffJSON["autoChain"] == true THEN
      
      # Validate e2eMode field exists
      IF NOT handoffJSON.ContainsKey("e2eMode") THEN
        violations.Add({
          file: handoffFile,
          violation: "MISSING_E2E_MODE",
          description: "autoChain=true but e2eMode field missing",
          severity: "HIGH"
        })
      END IF
      
      # Validate nextTask pointer
      IF NOT handoffJSON.ContainsKey("nextTask") THEN
        violations.Add({
          file: handoffFile,
          violation: "MISSING_NEXT_TASK",
          description: "autoChain=true but nextTask pointer missing",
          severity: "CRITICAL"
        })
      ELSE IF handoffJSON["nextTask"] != "complete" THEN
        # Validate nextTask file exists
        nextTaskPath = Path.Combine(handoffsPath, handoffJSON["nextTask"])
        
        IF NOT FileExists(nextTaskPath) THEN
          violations.Add({
            file: handoffFile,
            violation: "BROKEN_NEXT_TASK_POINTER",
            description: "nextTask points to non-existent file: " + handoffJSON["nextTask"],
            severity: "CRITICAL",
            expectedPath: nextTaskPath
          })
        END IF
      END IF
      
      # Validate autoChainPhases (if present)
      IF handoffJSON.ContainsKey("autoChainPhases") THEN
        phases = handoffJSON["autoChainPhases"]
        
        IF NOT IsArray(phases) THEN
          violations.Add({
            file: handoffFile,
            violation: "INVALID_AUTO_CHAIN_PHASES",
            description: "autoChainPhases must be an array",
            severity: "HIGH"
          })
        ELSE
          # Validate each phase has required fields
          FOR i = 0 TO phases.Length - 1:
            phase = phases[i]
            
            requiredPhaseFields = ["phase", "description", "tasks", "validation", "estimatedDuration"]
            
            FOR EACH phaseField IN requiredPhaseFields:
              IF NOT phase.ContainsKey(phaseField) THEN
                violations.Add({
                  file: handoffFile,
                  violation: "INCOMPLETE_PHASE_DEFINITION",
                  description: "Phase " + (i + 1) + " missing field: " + phaseField,
                  severity: "MEDIUM"
                })
              END IF
            END FOR
          END FOR
        END IF
      END IF
      
    END IF
    
    # Track validation results
    IF missingFields.Count > 0 THEN
      violations.Add({
        file: handoffFile,
        violation: "MISSING_REQUIRED_FIELDS",
        description: "Handoff JSON missing: " + Join(missingFields, ", "),
        severity: "CRITICAL"
      })
    ELSE
      validHandoffs += 1
    END IF
    
  END FOR
  
  # Step 4: Generate validation report
  IF violations.Count > 0 THEN
    RETURN {
      valid: false,
      handoffsChecked: handoffFiles.Count,
      validHandoffs: validHandoffs,
      violations: violations,
      summary: GenerateViolationSummary(violations)
    }
  ELSE
    RETURN {
      valid: true,
      handoffsChecked: handoffFiles.Count,
      validHandoffs: validHandoffs,
      message: "All handoff JSONs valid with correct auto-chain configuration"
    }
  END IF
  
END FUNCTION

// Helper: Generate violation summary
FUNCTION GenerateViolationSummary(violations):
  
  summary = {
    critical: 0,
    high: 0,
    medium: 0,
    byType: {}
  }
  
  FOR EACH violation IN violations:
    # Count by severity
    IF violation.severity == "CRITICAL" THEN
      summary.critical += 1
    ELSE IF violation.severity == "HIGH" THEN
      summary.high += 1
    ELSE IF violation.severity == "MEDIUM" THEN
      summary.medium += 1
    END IF
    
    # Count by type
    violationType = violation.violation
    IF NOT summary.byType.ContainsKey(violationType) THEN
      summary.byType[violationType] = 0
    END IF
    summary.byType[violationType] += 1
  END FOR
  
  RETURN summary
  
END FUNCTION

// Helper: Validate handoff chain integrity
FUNCTION ValidateHandoffChain(startHandoff, handoffsPath):
  
  chain = []
  currentHandoff = startHandoff
  visited = []
  
  WHILE currentHandoff != "complete":
    
    # Detect circular references
    IF visited.Contains(currentHandoff) THEN
      RETURN {
        valid: false,
        reason: "CIRCULAR_REFERENCE",
        chain: chain,
        circularNode: currentHandoff
      }
    END IF
    
    visited.Add(currentHandoff)
    chain.Add(currentHandoff)
    
    # Load handoff JSON
    handoffPath = Path.Combine(handoffsPath, currentHandoff)
    
    IF NOT FileExists(handoffPath) THEN
      RETURN {
        valid: false,
        reason: "BROKEN_CHAIN",
        chain: chain,
        missingFile: handoffPath
      }
    END IF
    
    handoffJSON = ParseJSON(ReadFile(handoffPath))
    
    # Get next task
    IF NOT handoffJSON.ContainsKey("nextTask") THEN
      RETURN {
        valid: false,
        reason: "MISSING_NEXT_TASK",
        chain: chain,
        file: currentHandoff
      }
    END IF
    
    currentHandoff = handoffJSON["nextTask"]
    
    # Prevent infinite loops
    IF chain.Count > 50 THEN
      RETURN {
        valid: false,
        reason: "CHAIN_TOO_LONG",
        chain: chain,
        maxLength: 50
      }
    END IF
    
  END WHILE
  
  RETURN {
    valid: true,
    chain: chain,
    chainLength: chain.Count
  }
  
END FUNCTION
```

**Integration Points:**
- `kds.prompt.md` Review Mode Step 2.5: Validate all handoff JSONs in workspace
- `plan.prompt.md` Step 4.25: Validate generated handoffs before user approval
- `route.prompt.md` Step 6: Validate route-to-plan.json handoff

**Usage Example:**

```
# Validate handoffs for specific key
result = ValidateAutoChainHandoffs("D:/PROJECTS/NOOR CANVAS", "kds-governance-enhancement")

IF NOT result.valid THEN
  DisplayViolations(result.violations)
  SuggestFixes(result.summary)
ELSE
  Log("✅ All handoffs valid (" + result.validHandoffs + "/" + result.handoffsChecked + ")")
END IF

# Validate specific handoff chain
chainResult = ValidateHandoffChain("phase-1-test.json", ".github/key-data-streams/kds/handoffs/")

IF NOT chainResult.valid THEN
  Log("❌ Chain broken: " + chainResult.reason)
  Log("   Chain: " + Join(chainResult.chain, " → "))
ELSE
  Log("✅ Chain valid: " + chainResult.chainLength + " tasks")
END IF
```

**Acceptance Criteria:**
- ✅ Detects missing required fields (key, description, acceptanceCriteria)
- ✅ Validates auto-chain fields (autoChain, e2eMode, nextTask)
- ✅ Checks nextTask pointers resolve to existing files
- ✅ Validates autoChainPhases array structure
- ✅ Detects circular references in handoff chains
- ✅ Prevents infinite loops (max 50 tasks in chain)

---

## Algorithm 12: Validate Test Orchestration (NEW - Phase 2 P1)

**Purpose:** Enforce dotnet orchestration pattern, validate headless mode defaults, check acceptance criteria in test JSONs

```
FUNCTION ValidateTestOrchestration(workspaceRoot):
  
  # Step 1: Find all orchestration scripts
  orchestrationScripts = FindFiles(workspaceRoot, "Scripts/run-*-tests.ps1")
  
  IF orchestrationScripts.Count == 0 THEN
    RETURN {
      valid: true,
      reason: "No orchestration scripts to validate (new workspace)",
      scriptsChecked: 0
    }
  END IF
  
  # Step 2: Initialize violation tracking
  violations = []
  validScripts = 0
  
  # Step 3: Validate each orchestration script
  FOR EACH script IN orchestrationScripts:
    
    scriptContent = ReadFile(script)
    scriptViolations = []
    
    # Check for deprecated standalone mode
    IF scriptContent.Contains("npx playwright test") AND NOT scriptContent.Contains("Start-Job") THEN
      scriptViolations.Add({
        type: "DEPRECATED_STANDALONE_MODE",
        description: "Script uses standalone 'npx playwright test' without app orchestration",
        severity: "CRITICAL",
        line: FindLineNumber(scriptContent, "npx playwright test"),
        suggestedFix: "Add dotnet orchestration: Start-Job → dotnet run → Sleep → Test → Stop-Job"
      })
    END IF
    
    # Check for nested PowerShell processes (anti-pattern)
    IF scriptContent.Contains("Start-Process powershell.exe") THEN
      scriptViolations.Add({
        type: "NESTED_POWERSHELL_PROCESS",
        description: "Script uses nested PowerShell processes (deprecated pattern)",
        severity: "HIGH",
        line: FindLineNumber(scriptContent, "Start-Process powershell.exe"),
        suggestedFix: "Replace with Start-Job for app lifecycle management"
      })
    END IF
    
    # Check for proper orchestration pattern
    hasStartJob = scriptContent.Contains("Start-Job")
    hasDotnetRun = scriptContent.Contains("dotnet run")
    hasSleep = scriptContent.Contains("Start-Sleep")
    hasStopJob = scriptContent.Contains("Stop-Job")
    
    IF hasStartJob AND hasDotnetRun AND hasSleep THEN
      # Valid orchestration pattern detected
      IF NOT hasStopJob THEN
        scriptViolations.Add({
          type: "MISSING_CLEANUP",
          description: "Orchestration pattern missing Stop-Job cleanup",
          severity: "HIGH",
          suggestedFix: "Add Stop-Job to prevent orphaned processes"
        })
      END IF
    ELSE IF scriptContent.Contains("npx playwright test") THEN
      # Playwright test without proper orchestration
      scriptViolations.Add({
        type: "INCOMPLETE_ORCHESTRATION",
        description: "Missing required orchestration components (Start-Job, dotnet run, or Start-Sleep)",
        severity: "HIGH",
        requiredComponents: {
          "Start-Job": hasStartJob,
          "dotnet run": hasDotnetRun,
          "Start-Sleep": hasSleep,
          "Stop-Job": hasStopJob
        }
      })
    END IF
    
    # Check for headless mode default
    IF scriptContent.Contains("npx playwright test") THEN
      hasHeadedFlag = scriptContent.Contains("--headed")
      hasHeadlessFlag = scriptContent.Contains("--headless")
      
      # Headless should be default (no flags, or explicit --headless)
      IF hasHeadedFlag AND NOT scriptContent.Contains("# UI/Visual test") THEN
        scriptViolations.Add({
          type: "HEADED_MODE_WITHOUT_JUSTIFICATION",
          description: "Script uses --headed mode without UI/Visual test comment justification",
          severity: "MEDIUM",
          suggestedFix: "Add comment '# UI/Visual test' or remove --headed to use headless default"
        })
      END IF
    END IF
    
    # Track results
    IF scriptViolations.Count > 0 THEN
      violations.Add({
        file: script,
        violations: scriptViolations
      })
    ELSE
      validScripts += 1
    END IF
    
  END FOR
  
  # Step 4: Find all phase test JSON files
  testHandoffs = FindFiles(workspaceRoot, ".github/key-data-streams/**/handoffs/phase-*-test.json")
  
  FOR EACH testHandoff IN testHandoffs:
    
    testJSON = ParseJSON(ReadFile(testHandoff))
    
    # Check for acceptance criteria
    IF NOT testJSON.ContainsKey("acceptanceCriteria") THEN
      violations.Add({
        file: testHandoff,
        violations: [{
          type: "MISSING_ACCEPTANCE_CRITERIA",
          description: "Test handoff JSON missing acceptanceCriteria field",
          severity: "CRITICAL",
          suggestedFix: "Add acceptanceCriteria array with 3-7 validation criteria"
        }]
      })
    ELSE IF testJSON["acceptanceCriteria"].Count < 3 THEN
      violations.Add({
        file: testHandoff,
        violations: [{
          type: "INSUFFICIENT_ACCEPTANCE_CRITERIA",
          description: "Test handoff has < 3 acceptance criteria (minimum 3 required)",
          severity: "HIGH",
          currentCount: testJSON["acceptanceCriteria"].Count,
          suggestedFix: "Add more specific validation criteria"
        }]
      })
    END IF
    
    # Check for mode field (headless default)
    IF testJSON.ContainsKey("mode") AND testJSON["mode"] == "headed" THEN
      # Verify scenario justifies headed mode
      scenario = testJSON.GetValueOrDefault("scenario", "")
      
      isVisualTest = scenario.Contains("visual") OR scenario.Contains("UI") OR scenario.Contains("screenshot")
      
      IF NOT isVisualTest THEN
        violations.Add({
          file: testHandoff,
          violations: [{
            type: "HEADED_MODE_WITHOUT_VISUAL_JUSTIFICATION",
            description: "Test JSON uses mode='headed' but scenario doesn't indicate visual/UI test",
            severity: "MEDIUM",
            scenario: scenario,
            suggestedFix: "Change mode to 'headless' or update scenario to indicate visual test"
          }]
        })
      END IF
    END IF
    
  END FOR
  
  # Step 5: Generate validation report
  IF violations.Count > 0 THEN
    RETURN {
      valid: false,
      scriptsChecked: orchestrationScripts.Count,
      testHandoffsChecked: testHandoffs.Count,
      validScripts: validScripts,
      violations: violations,
      summary: GenerateOrchestrationViolationSummary(violations)
    }
  ELSE
    RETURN {
      valid: true,
      scriptsChecked: orchestrationScripts.Count,
      testHandoffsChecked: testHandoffs.Count,
      validScripts: validScripts,
      message: "All test orchestration patterns valid"
    }
  END IF
  
END FUNCTION

// Helper: Generate orchestration violation summary
FUNCTION GenerateOrchestrationViolationSummary(violations):
  
  summary = {
    critical: 0,
    high: 0,
    medium: 0,
    byType: {},
    topIssues: []
  }
  
  FOR EACH fileViolation IN violations:
    FOR EACH violation IN fileViolation.violations:
      # Count by severity
      IF violation.severity == "CRITICAL" THEN
        summary.critical += 1
      ELSE IF violation.severity == "HIGH" THEN
        summary.high += 1
      ELSE IF violation.severity == "MEDIUM" THEN
        summary.medium += 1
      END IF
      
      # Count by type
      violationType = violation.type
      IF NOT summary.byType.ContainsKey(violationType) THEN
        summary.byType[violationType] = 0
      END IF
      summary.byType[violationType] += 1
    END FOR
  END FOR
  
  # Identify top issues (most common violations)
  sortedTypes = SortByValue(summary.byType, descending=true)
  summary.topIssues = Take(sortedTypes, 5)
  
  RETURN summary
  
END FUNCTION

// Helper: Find line number in file
FUNCTION FindLineNumber(fileContent, searchString):
  
  lines = SplitLines(fileContent)
  
  FOR i = 0 TO lines.Length - 1:
    IF lines[i].Contains(searchString) THEN
      RETURN i + 1  # 1-indexed line numbers
    END IF
  END FOR
  
  RETURN -1  # Not found
  
END FUNCTION
```

**Integration Points:**
- `kds.prompt.md` Review Mode Step 2.6: Validate all test orchestration
- `test-generation.prompt.md` Step 7: Validate generated orchestration script
- `plan.prompt.md` Step 4.25: Validate test handoff JSONs before user approval

**Usage Example:**

```
# Validate all test orchestration in workspace
result = ValidateTestOrchestration("D:/PROJECTS/NOOR CANVAS")

IF NOT result.valid THEN
  DisplayOrchestrationViolations(result.violations)
  
  # Show summary
  Log("Summary:")
  Log("  CRITICAL: " + result.summary.critical + " violations")
  Log("  HIGH: " + result.summary.high + " violations")
  Log("  MEDIUM: " + result.summary.medium + " violations")
  
  # Show top issues
  Log("Top Issues:")
  FOR EACH issue IN result.summary.topIssues:
    Log("  - " + issue.key + ": " + issue.value + " occurrences")
  END FOR
ELSE
  Log("✅ All test orchestration valid")
  Log("   Scripts checked: " + result.scriptsChecked)
  Log("   Test handoffs checked: " + result.testHandoffsChecked)
END IF
```

**Acceptance Criteria:**
- ✅ Detects deprecated standalone mode (npx playwright test without Start-Job)
- ✅ Flags nested PowerShell processes (Start-Process powershell.exe)
- ✅ Validates dotnet orchestration pattern (Start-Job → dotnet run → Sleep → Stop-Job)
- ✅ Checks headless mode defaults (--headed requires justification)
- ✅ Validates test handoff JSONs have acceptanceCriteria (min 3 items)
- ✅ Flags headed mode without visual test justification

---

## Algorithm 13: Detect Stale Rules (NEW - Phase 3 P2)

**Purpose:** Auto-flag rules >90 days old in Review Mode based on lastValidated timestamps

```
FUNCTION DetectStaleRules(rulebookJsonPath, validationThresholdDays):
  
  # Step 1: Load rulebook JSON
  IF NOT FileExists(rulebookJsonPath) THEN
    RETURN {
      valid: false,
      reason: "Rulebook JSON not found",
      path: rulebookJsonPath
    }
  END IF
  
  rulebookContent = ReadFile(rulebookJsonPath)
  rulebook = ParseJSON(rulebookContent)
  
  # Step 2: Get current date
  currentDate = GetCurrentDate()
  
  # Step 3: Initialize stale rule tracking
  staleRules = []
  upToDateRules = []
  missingTimestamps = []
  
  # Step 4: Check each rule's lastValidated timestamp
  allRules = rulebook["mandatoryRules"] + rulebook["agenticRules"] + rulebook["handoffProtocol"]
  
  FOR EACH rule IN allRules:
    
    ruleId = rule["id"]
    ruleNumber = rule["number"]
    category = rule["category"]
    
    # Check if lastValidated field exists
    IF NOT rule.ContainsKey("lastValidated") THEN
      missingTimestamps.Add({
        ruleId: ruleId,
        ruleNumber: ruleNumber,
        category: category,
        severity: "HIGH",
        recommendation: "Add lastValidated timestamp to rule JSON"
      })
      CONTINUE
    END IF
    
    # Parse lastValidated date
    lastValidated = ParseDate(rule["lastValidated"])  # Expected format: "YYYY-MM-DD"
    
    # Calculate days since last validation
    daysSinceValidation = DaysBetween(lastValidated, currentDate)
    
    # Check validation frequency (if specified)
    validationFrequency = rule.GetValueOrDefault("validationFrequency", 90)  # Default: 90 days
    
    # Determine if rule is stale
    IF daysSinceValidation > validationFrequency THEN
      
      # Calculate staleness severity
      staleness = daysSinceValidation - validationFrequency
      
      IF staleness > 180 THEN
        severity = "CRITICAL"  # Over 180 days overdue
      ELSE IF staleness > 90 THEN
        severity = "HIGH"  # 90-180 days overdue
      ELSE IF staleness > 30 THEN
        severity = "MEDIUM"  # 30-90 days overdue
      ELSE
        severity = "LOW"  # Slightly overdue
      END IF
      
      staleRules.Add({
        ruleId: ruleId,
        ruleNumber: ruleNumber,
        category: category,
        statement: rule["statement"],
        lastValidated: lastValidated,
        validationFrequency: validationFrequency,
        daysSinceValidation: daysSinceValidation,
        daysOverdue: staleness,
        severity: severity,
        nextValidationDue: AddDays(lastValidated, validationFrequency),
        recommendation: GenerateStalenessRecommendation(rule, staleness)
      })
      
    ELSE
      upToDateRules.Add({
        ruleId: ruleId,
        ruleNumber: ruleNumber,
        lastValidated: lastValidated,
        nextValidationDue: AddDays(lastValidated, validationFrequency),
        daysRemaining: validationFrequency - daysSinceValidation
      })
    END IF
    
  END FOR
  
  # Step 5: Generate stale rules report
  RETURN {
    totalRules: allRules.Count,
    staleRules: staleRules,
    upToDateRules: upToDateRules,
    missingTimestamps: missingTimestamps,
    summary: {
      staleCount: staleRules.Count,
      upToDateCount: upToDateRules.Count,
      missingTimestampCount: missingTimestamps.Count,
      criticalStale: CountBySeverity(staleRules, "CRITICAL"),
      highStale: CountBySeverity(staleRules, "HIGH"),
      mediumStale: CountBySeverity(staleRules, "MEDIUM"),
      lowStale: CountBySeverity(staleRules, "LOW")
    },
    recommendations: GenerateStaleRulesRecommendations(staleRules, missingTimestamps)
  }
  
END FUNCTION

// Helper: Generate staleness recommendation
FUNCTION GenerateStalenessRecommendation(rule, daysOverdue):
  
  IF daysOverdue > 180 THEN
    RETURN "URGENT: Review rule effectiveness. Consider deprecation if no longer applicable. Update validation algorithms if still needed."
  ELSE IF daysOverdue > 90 THEN
    RETURN "HIGH PRIORITY: Review rule compliance in recent conversation history. Update examples if needed."
  ELSE IF daysOverdue > 30 THEN
    RETURN "Schedule validation review. Check if rule needs clarification or enforcement updates."
  ELSE
    RETURN "Due for validation review. Verify rule still applicable to current workflows."
  END IF
  
END FUNCTION

// Helper: Generate overall recommendations
FUNCTION GenerateStaleRulesRecommendations(staleRules, missingTimestamps):
  
  recommendations = []
  
  # Timestamp issues
  IF missingTimestamps.Count > 0 THEN
    recommendations.Add({
      priority: "HIGH",
      action: "Add lastValidated timestamps to " + missingTimestamps.Count + " rules",
      impactedRules: missingTimestamps.Select(r => r.ruleId)
    })
  END IF
  
  # Critical stale rules
  criticalStale = Filter(staleRules, r => r.severity == "CRITICAL")
  IF criticalStale.Count > 0 THEN
    recommendations.Add({
      priority: "CRITICAL",
      action: "Immediate review required for " + criticalStale.Count + " critically stale rules (>180 days overdue)",
      impactedRules: criticalStale.Select(r => "Rule #" + r.ruleNumber + " (" + r.ruleId + ")"),
      suggestedActions: [
        "Review conversation history for violations",
        "Update validation functions if needed",
        "Deprecate if no longer applicable",
        "Update lastValidated timestamp after review"
      ]
    })
  END IF
  
  # High priority stale rules
  highStale = Filter(staleRules, r => r.severity == "HIGH")
  IF highStale.Count > 0 THEN
    recommendations.Add({
      priority: "HIGH",
      action: "Review " + highStale.Count + " rules overdue for validation (90-180 days)",
      impactedRules: highStale.Select(r => "Rule #" + r.ruleNumber),
      suggestedActions: [
        "Check compliance in recent work",
        "Update examples if guidance unclear",
        "Refresh validation algorithms"
      ]
    })
  END IF
  
  # Batch validation suggestions
  IF staleRules.Count > 5 THEN
    recommendations.Add({
      priority: "MEDIUM",
      action: "Schedule batch validation session for " + staleRules.Count + " overdue rules",
      estimatedTime: CalculateValidationTime(staleRules.Count),
      suggestedApproach: "Group by category, validate related rules together"
    })
  END IF
  
  RETURN recommendations
  
END FUNCTION

// Helper: Count by severity
FUNCTION CountBySeverity(staleRules, severity):
  RETURN Filter(staleRules, r => r.severity == severity).Count
END FUNCTION

// Helper: Calculate validation time
FUNCTION CalculateValidationTime(ruleCount):
  minutesPerRule = 15
  totalMinutes = ruleCount * minutesPerRule
  hours = Floor(totalMinutes / 60)
  minutes = totalMinutes MOD 60
  RETURN hours + "h " + minutes + "m"
END FUNCTION
```

**Integration Points:**
- `kds.prompt.md` Review Mode Step 2.7: Auto-flag stale rules report
- `kds-rulebook.json`: All rules require `lastValidated` (YYYY-MM-DD) and `validationFrequency` (30/60/90 days)

**Usage Example:**

```
# Detect stale rules in rulebook
result = DetectStaleRules(
  ".github/governance/kds-rulebook.json",
  validationThresholdDays=90
)

IF result.summary.staleCount > 0 THEN
  Log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  Log("⚠️  STALE RULES DETECTED")
  Log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  Log("")
  Log("Total Rules: " + result.totalRules)
  Log("Stale Rules: " + result.summary.staleCount)
  Log("")
  Log("By Severity:")
  Log("  CRITICAL: " + result.summary.criticalStale + " rules")
  Log("  HIGH:     " + result.summary.highStale + " rules")
  Log("  MEDIUM:   " + result.summary.mediumStale + " rules")
  Log("  LOW:      " + result.summary.lowStale + " rules")
  Log("")
  
  # Show stale rules
  FOR EACH staleRule IN result.staleRules:
    Log("[" + staleRule.severity + "] Rule #" + staleRule.ruleNumber + " (" + staleRule.ruleId + ")")
    Log("  Last Validated: " + staleRule.lastValidated)
    Log("  Days Overdue: " + staleRule.daysOverdue)
    Log("  Recommendation: " + staleRule.recommendation)
    Log("")
  END FOR
  
  # Show recommendations
  Log("📋 Recommended Actions:")
  FOR EACH rec IN result.recommendations:
    Log("[" + rec.priority + "] " + rec.action)
    IF rec.impactedRules THEN
      Log("  Impacted: " + Join(rec.impactedRules, ", "))
    END IF
  END FOR
  
ELSE
  Log("✅ All rules up to date")
  Log("   Next validation due in " + Min(result.upToDateRules.Select(r => r.daysRemaining)) + " days")
END IF
```

**Acceptance Criteria:**
- ✅ Detects rules with lastValidated >90 days old
- ✅ Calculates staleness severity (CRITICAL/HIGH/MEDIUM/LOW)
- ✅ Flags rules missing lastValidated timestamps
- ✅ Respects validationFrequency field (30/60/90 days)
- ✅ Generates actionable recommendations
- ✅ Groups stale rules by severity for prioritization

---

## Algorithm 14: Calculate Prompt Complexity (NEW - Phase 3 P2)

**Purpose:** Generate complexity metrics (lines, sections, dependencies, duplication) for prompts and score 0-100

```
FUNCTION CalculatePromptComplexity(promptFilePath):
  
  # Step 1: Read prompt file
  IF NOT FileExists(promptFilePath) THEN
    RETURN {
      error: "Prompt file not found",
      path: promptFilePath
    }
  END IF
  
  promptContent = ReadFile(promptFilePath)
  promptLines = SplitLines(promptContent)
  
  # Step 2: Initialize metrics
  metrics = {
    lineCount: 0,
    sectionCount: 0,
    stepCount: 0,
    dependencies: [],
    codeBlocks: 0,
    pseudocodeBlocks: 0,
    externalReferences: 0,
    duplicationRatio: 0.0,
    averageSectionLength: 0.0
  }
  
  # Step 3: Calculate basic metrics
  metrics.lineCount = promptLines.Count
  
  # Count sections (## headers)
  FOR EACH line IN promptLines:
    IF line.StartsWith("##") THEN
      metrics.sectionCount += 1
    END IF
    
    # Count steps (### Step headers)
    IF line.StartsWith("### Step") THEN
      metrics.stepCount += 1
    END IF
    
    # Count code blocks
    IF line.StartsWith("```") THEN
      metrics.codeBlocks += 1
    END IF
    
    # Count pseudocode blocks
    IF line.Contains("FUNCTION ") OR line.Contains("FOR EACH") OR line.Contains("IF ") AND line.Contains(" THEN") THEN
      metrics.pseudocodeBlocks += 1
    END IF
    
    # Count external references
    IF line.Contains(".github/prompts/") OR line.Contains(".github/instructions/") THEN
      refPath = ExtractReferencePath(line)
      IF refPath AND NOT metrics.dependencies.Contains(refPath) THEN
        metrics.dependencies.Add(refPath)
      END IF
    END IF
    
  END FOR
  
  # Divide by 2 (opening + closing backticks)
  metrics.codeBlocks = metrics.codeBlocks / 2
  
  # Count external references
  metrics.externalReferences = metrics.dependencies.Count
  
  # Step 4: Calculate duplication ratio
  uniqueLines = RemoveDuplicates(promptLines)
  metrics.duplicationRatio = 1.0 - (uniqueLines.Count / promptLines.Count)
  
  # Step 5: Calculate average section length
  IF metrics.sectionCount > 0 THEN
    metrics.averageSectionLength = metrics.lineCount / metrics.sectionCount
  END IF
  
  # Step 6: Calculate complexity score (0-100)
  # Higher score = higher complexity (more refactoring needed)
  
  score = 0
  
  # Line count penalty (>500 lines = high complexity)
  IF metrics.lineCount > 1000 THEN
    score += 30
  ELSE IF metrics.lineCount > 500 THEN
    score += 20
  ELSE IF metrics.lineCount > 250 THEN
    score += 10
  END IF
  
  # Section count penalty (>30 sections = high complexity)
  IF metrics.sectionCount > 50 THEN
    score += 20
  ELSE IF metrics.sectionCount > 30 THEN
    score += 15
  ELSE IF metrics.sectionCount > 15 THEN
    score += 10
  END IF
  
  # Code block penalty (>10 blocks = should be extracted to shared/)
  IF metrics.codeBlocks > 20 THEN
    score += 15
  ELSE IF metrics.codeBlocks > 10 THEN
    score += 10
  ELSE IF metrics.codeBlocks > 5 THEN
    score += 5
  END IF
  
  # Pseudocode penalty (should be in shared/algorithms/)
  IF metrics.pseudocodeBlocks > 10 THEN
    score += 10
  ELSE IF metrics.pseudocodeBlocks > 5 THEN
    score += 5
  END IF
  
  # Dependency penalty (>10 dependencies = high coupling)
  IF metrics.externalReferences > 15 THEN
    score += 15
  ELSE IF metrics.externalReferences > 10 THEN
    score += 10
  ELSE IF metrics.externalReferences > 5 THEN
    score += 5
  END IF
  
  # Duplication penalty
  IF metrics.duplicationRatio > 0.3 THEN
    score += 10
  ELSE IF metrics.duplicationRatio > 0.2 THEN
    score += 5
  END IF
  
  # Clamp score to 0-100
  score = Min(score, 100)
  
  # Step 7: Determine grade
  grade = ""
  refactoringPriority = ""
  
  IF score >= 80 THEN
    grade = "F"
    refactoringPriority = "CRITICAL"
  ELSE IF score >= 70 THEN
    grade = "D"
    refactoringPriority = "HIGH"
  ELSE IF score >= 50 THEN
    grade = "C"
    refactoringPriority = "MEDIUM"
  ELSE IF score >= 30 THEN
    grade = "B"
    refactoringPriority = "LOW"
  ELSE
    grade = "A"
    refactoringPriority = "NONE"
  END IF
  
  # Step 8: Generate refactoring recommendations
  recommendations = []
  
  IF metrics.lineCount > 500 THEN
    recommendations.Add("Split prompt into smaller, focused prompts (current: " + metrics.lineCount + " lines)")
  END IF
  
  IF metrics.codeBlocks > 5 THEN
    recommendations.Add("Extract " + metrics.codeBlocks + " code blocks to shared/examples/ files")
  END IF
  
  IF metrics.pseudocodeBlocks > 5 THEN
    recommendations.Add("Extract " + metrics.pseudocodeBlocks + " pseudocode blocks to shared/algorithms/ files")
  END IF
  
  IF metrics.externalReferences > 10 THEN
    recommendations.Add("High coupling detected (" + metrics.externalReferences + " dependencies). Consider consolidating shared files.")
  END IF
  
  IF metrics.duplicationRatio > 0.2 THEN
    recommendations.Add("Duplication detected (" + Round(metrics.duplicationRatio * 100, 1) + "%). Apply holistic regeneration.")
  END IF
  
  IF metrics.stepCount > 15 THEN
    recommendations.Add("Complex workflow (" + metrics.stepCount + " steps). Consider breaking into sub-prompts.")
  END IF
  
  # Step 9: Return complexity report
  RETURN {
    promptFile: promptFilePath,
    metrics: metrics,
    complexityScore: score,
    grade: grade,
    refactoringPriority: refactoringPriority,
    recommendations: recommendations,
    summary: {
      description: GenerateComplexitySummary(score, metrics),
      nextSteps: GenerateNextSteps(refactoringPriority, recommendations)
    }
  }
  
END FUNCTION

// Helper: Generate complexity summary
FUNCTION GenerateComplexitySummary(score, metrics):
  
  IF score >= 80 THEN
    RETURN "CRITICAL complexity - Immediate refactoring required (" + metrics.lineCount + " lines, " + metrics.codeBlocks + " code blocks)"
  ELSE IF score >= 70 THEN
    RETURN "HIGH complexity - Refactoring recommended (" + metrics.sectionCount + " sections, " + metrics.externalReferences + " dependencies)"
  ELSE IF score >= 50 THEN
    RETURN "MODERATE complexity - Consider simplification (" + metrics.lineCount + " lines)"
  ELSE IF score >= 30 THEN
    RETURN "LOW complexity - Well-structured with minor improvements possible"
  ELSE
    RETURN "EXCELLENT - Clean, maintainable prompt structure"
  END IF
  
END FUNCTION

// Helper: Generate next steps
FUNCTION GenerateNextSteps(priority, recommendations):
  
  IF priority == "CRITICAL" THEN
    RETURN "Schedule immediate refactoring session. Apply top " + Min(recommendations.Count, 3) + " recommendations."
  ELSE IF priority == "HIGH" THEN
    RETURN "Plan refactoring in next sprint. Start with code block extraction."
  ELSE IF priority == "MEDIUM" THEN
    RETURN "Address during next maintenance window. Prioritize duplication removal."
  ELSE IF priority == "LOW" THEN
    RETURN "Optional improvements. Consider during routine updates."
  ELSE
    RETURN "No refactoring needed. Maintain current quality."
  END IF
  
END FUNCTION

// Helper: Extract reference path from line
FUNCTION ExtractReferencePath(line):
  
  # Pattern: `.github/prompts/path.md` or .github/instructions/path.md
  pattern = "\.github/(prompts|instructions)/[a-zA-Z0-9\-_/\.]+\.md"
  
  match = RegexMatch(line, pattern)
  
  IF match THEN
    RETURN match.value
  ELSE
    RETURN null
  END IF
  
END FUNCTION
```

**Integration Points:**
- `kds.prompt.md` Review Mode Step 2.8: Calculate complexity for all prompts
- Output: Refactoring Candidates report (prompts with scores >70)

**Usage Example:**

```
# Calculate complexity for all prompts
promptFiles = FindFiles(".github/prompts/", "*.prompt.md")

complexityResults = []
refactoringCandidates = []

FOR EACH promptFile IN promptFiles:
  
  result = CalculatePromptComplexity(promptFile)
  complexityResults.Add(result)
  
  IF result.complexityScore >= 70 THEN
    refactoringCandidates.Add(result)
  END IF
  
END FOR

# Sort by complexity score (highest first)
refactoringCandidates = SortBy(refactoringCandidates, r => r.complexityScore, descending=true)

# Display report
Log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
Log("📊 PROMPT COMPLEXITY ANALYSIS")
Log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
Log("")
Log("Total Prompts Analyzed: " + complexityResults.Count)
Log("Refactoring Candidates: " + refactoringCandidates.Count + " (score ≥70)")
Log("")

IF refactoringCandidates.Count > 0 THEN
  Log("🔧 REFACTORING CANDIDATES (sorted by complexity):")
  Log("")
  
  FOR EACH candidate IN refactoringCandidates:
    Log("[" + candidate.grade + " - " + candidate.complexityScore + "/100] " + GetFileName(candidate.promptFile))
    Log("  Priority: " + candidate.refactoringPriority)
    Log("  Metrics: " + candidate.metrics.lineCount + " lines, " + candidate.metrics.codeBlocks + " code blocks, " + candidate.metrics.externalReferences + " dependencies")
    Log("  Top Recommendation: " + candidate.recommendations[0])
    Log("")
  END FOR
  
  Log("Next Steps: " + refactoringCandidates[0].summary.nextSteps)
  
ELSE
  Log("✅ All prompts have acceptable complexity (score <70)")
END IF
```

**Acceptance Criteria:**
- ✅ Calculates line count, section count, step count
- ✅ Counts code blocks and pseudocode blocks
- ✅ Tracks external dependencies (shared files)
- ✅ Measures duplication ratio
- ✅ Scores prompts 0-100 (higher = more complex)
- ✅ Generates refactoring recommendations
- ✅ Identifies candidates with scores >70

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
