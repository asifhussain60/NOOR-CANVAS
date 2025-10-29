# Prompt Test Validation Framework

**Version:** 1.0.0  
**Purpose:** Reusable validation system for prompts to verify their own execution quality  
**Last Updated:** 2025-10-27

---

## Overview

The `/test` parameter enables any prompt to self-validate its execution by:
1. Analyzing workspace state, git history, and generated artifacts
2. Checking if prompt-specific rules and responsibilities were fulfilled
3. Detecting violations, missed requirements, or drift from expected behavior
4. Generating actionable improvement plan and handing off to `plan.prompt.md`

---

## Universal /test Parameter

### Syntax
```bash
# Any prompt with /test flag
@workspace /plan key=my-feature -test "user request here"
@workspace /task key=my-task -test tasks="phase 1"
@workspace /build plan -test "request here"
@workspace /ask -test "question here"
```

### Behavior
When `-test` flag is detected:
1. **Execute normally** - Complete the prompt's primary function first
2. **Run validation** - After completion, analyze execution quality
3. **Generate report** - Document findings with severity levels
4. **Handoff if issues** - If violations/issues found, create improvement plan
5. **User feedback** - Always present findings and next actions

---

## Validation Algorithm

```
FUNCTION ValidatePromptExecution(promptName, executionContext)
  
  // Phase 1: Gather Evidence
  evidence = GatherExecutionEvidence()
  
  // Phase 2: Rule Compliance Check
  violations = CheckRuleCompliance(promptName, evidence)
  
  // Phase 3: Requirement Coverage Analysis
  missedRequirements = AnalyzeRequirementCoverage(promptName, evidence)
  
  // Phase 4: Drift Detection
  driftIssues = DetectDriftFromExpectedBehavior(promptName, evidence)
  
  // Phase 5: Quality Assessment
  qualityScore = AssessExecutionQuality(violations, missedRequirements, driftIssues)
  
  // Phase 6: Generate Report
  report = GenerateValidationReport(violations, missedRequirements, driftIssues, qualityScore)
  
  // Phase 7: Improvement Plan (if needed)
  IF qualityScore < ACCEPTABLE_THRESHOLD OR violations.COUNT > 0 THEN
    improvementPlan = GenerateImprovementPlan(report)
    HandoffToPlanPrompt(improvementPlan)
  END IF
  
  // Phase 8: Present to User
  PresentValidationResults(report, improvementPlan)
  
END FUNCTION
```

---

## Evidence Gathering

### Workspace Analysis
```
FUNCTION GatherExecutionEvidence()
  
  evidence = {
    gitHistory: [],
    filesCreated: [],
    filesModified: [],
    workLogs: [],
    planFiles: [],
    testFiles: [],
    keyDataStreams: [],
    commitMessages: [],
    errors: [],
    warnings: []
  }
  
  // Git History
  evidence.gitHistory = ExecuteCommand("git log --oneline -20")
  evidence.commitMessages = ExtractCommitMessages(evidence.gitHistory)
  
  // File Changes
  changedFiles = ExecuteCommand("git diff --name-only HEAD~5..HEAD")
  FOR EACH file IN changedFiles
    IF file.WasCreated THEN
      evidence.filesCreated.APPEND(file)
    ELSE
      evidence.filesModified.APPEND(file)
    END IF
  END FOR
  
  // Key Data Streams
  keyDataStreamPath = ".github/key-data-streams/"
  IF DirectoryExists(keyDataStreamPath) THEN
    FOR EACH keyDir IN ListDirectories(keyDataStreamPath)
      keyData = LoadKeyDataStream(keyDir)
      evidence.keyDataStreams.APPEND(keyData)
    END FOR
  END IF
  
  // Work Logs
  workLogPattern = "**/*work-log.md"
  evidence.workLogs = FindFiles(workLogPattern)
  
  // Plan Files
  planFilePattern = "**/*.plan.md"
  evidence.planFiles = FindFiles(planFilePattern)
  
  // Test Files
  testFilePattern = "**/*.spec.ts"
  evidence.testFiles = FindFiles(testFilePattern)
  
  // Errors and Warnings
  evidence.errors = GetCompilationErrors()
  evidence.warnings = GetCompilationWarnings()
  
  RETURN evidence
  
END FUNCTION
```

---

## Rule Compliance Checks

### Universal Rules (All Prompts)
1. **CONCISE-MANDATE.md** - Max 15 bullets per response
2. **output-style-mandate.md** - 🧠/📌/📊 format, letter-based next actions
3. **SelfAwareness.instructions.md** - Branch strategy (development only)
4. **Database access rules** - canvas.* READ-WRITE, dbo.* READ-ONLY

### Prompt-Specific Rules
Each prompt defines its own validation rules in a dedicated section.

---

## Prompt-Specific Validation Patterns

### plan.prompt.md Validation
```
FUNCTION ValidatePlanPrompt(evidence)
  
  violations = []
  missedRequirements = []
  
  // Check 0: File Finalization Verification (BLOCKING)
  // Per file-finalization-verifier.md and Step 5.5
  requiredFiles = [
    ".github/key-data-streams/{key}/{key}.plan.md",
    ".github/key-data-streams/{key}/{key}.plan.json",
    ".github/key-data-streams/{key}/work-log.md",
    ".github/key-data-streams/{key}/state.json"
  ]
  
  missingFiles = []
  FOR EACH file IN requiredFiles
    IF NOT FileExists(file) THEN
      missingFiles.APPEND(file)
    END IF
  END FOR
  
  IF missingFiles.COUNT > 0 THEN
    violations.APPEND({
      severity: "critical",
      rule: "File finalization verification (Step 5.5 - BLOCKING)",
      description: "Plan must create all required files BEFORE user response",
      missingFiles: missingFiles,
      enforcement: "HALT execution - Step 6 and Step 7.5 must not execute",
      reference: ".github/prompts/shared/file-finalization-verifier.md"
    })
    
    // HALT further validation - no point checking other rules if files don't exist
    RETURN {violations: violations, missedRequirements: missedRequirements}
  END IF
  
  // Check 1: Key Data Stream Created
  IF NOT evidence.keyDataStreams.Contains(currentKey) THEN
    violations.APPEND({
      severity: "critical",
      rule: "Key data stream creation",
      description: "Plan must create key data stream in .github/key-data-streams/{key}/"
    })
  END IF
  
  // Check 2: Plan File Generated
  expectedPlanFile = ".github/key-data-streams/{key}/{key}.plan.md"
  IF NOT evidence.planFiles.Contains(expectedPlanFile) THEN
    violations.APPEND({
      severity: "critical",
      rule: "Plan file generation",
      description: "Plan must create {key}.plan.md with phased breakdown"
    })
  END IF
  
  // Check 3: Work Log Created
  expectedWorkLog = ".github/key-data-streams/{key}/work-log.md"
  IF NOT evidence.workLogs.Contains(expectedWorkLog) THEN
    violations.APPEND({
      severity: "high",
      rule: "Work log initialization",
      description: "Plan must initialize work-log.md for execution tracking"
    })
  END IF
  
  // Check 4: Questionnaire Used (if applicable)
  IF RequiresQuestionnaire(currentRequest) THEN
    expectedQuestionnaire = ".github/key-data-streams/{key}/questionnaire.md"
    IF NOT FileExists(expectedQuestionnaire) THEN
      missedRequirements.APPEND({
        severity: "medium",
        requirement: "Interactive questionnaire",
        description: "Complex features should use questionnaire for requirement gathering"
      })
    END IF
  END IF
  
  // Check 5: Key Spelling Validation
  IF NOT KeySpellingValidated(evidence.commitMessages) THEN
    missedRequirements.APPEND({
      severity: "low",
      requirement: "Key spelling validation",
      description: "Plan should validate key spelling using .github/prompts/shared/key-spelling-validator.md"
    })
  END IF
  
  // Check 6: Test Strategy Included
  IF ContainsUIChanges(currentRequest) OR ContainsAPIChanges(currentRequest) THEN
    planContent = ReadFile(expectedPlanFile)
    IF NOT planContent.Contains("test") AND NOT planContent.Contains("Test") THEN
      missedRequirements.APPEND({
        severity: "medium",
        requirement: "Test strategy",
        description: "Plan should include testing phase for UI/API changes"
      })
    END IF
  END IF
  
  RETURN {violations: violations, missedRequirements: missedRequirements}
  
END FUNCTION
```

### task.prompt.md Validation
```
FUNCTION ValidateTaskPrompt(evidence)
  
  violations = []
  missedRequirements = []
  
  // Check 0: File Finalization Verification (work-log.md timestamp check)
  // Per file-finalization-verifier.md and Step 8.25
  expectedWorkLog = ".github/key-data-streams/{key}/work-log.md"
  
  IF FileExists(expectedWorkLog) THEN
    lastModified = GetFileLastModified(expectedWorkLog)
    currentTime = GetCurrentTime()
    timeDiff = currentTime - lastModified
    
    IF timeDiff > 60 THEN  // 60 seconds threshold
      violations.APPEND({
        severity: "critical",
        rule: "File finalization verification (Step 8.25 - timestamp check)",
        description: "work-log.md must be updated within 60 seconds of task completion",
        lastModified: lastModified,
        timeDiff: timeDiff,
        enforcement: "HALT execution - Step 8.6 (Response Validation) must not execute",
        reference: ".github/prompts/shared/file-finalization-verifier.md"
      })
      
      // HALT further validation
      RETURN {violations: violations, missedRequirements: missedRequirements}
    END IF
  ELSE
    violations.APPEND({
      severity: "critical",
      rule: "File finalization verification (Step 8.25 - file existence)",
      description: "work-log.md must exist before task response",
      enforcement: "HALT execution - Step 8.6 must not execute",
      reference: ".github/prompts/shared/file-finalization-verifier.md"
    })
    
    // HALT further validation
    RETURN {violations: violations, missedRequirements: missedRequirements}
  END IF
  
  // Check 1: Commit Checkpoints
  recentCommits = evidence.commitMessages.Take(10)
  checkpointCommits = recentCommits.Filter(msg => msg.Contains("ckpt:"))
  
  IF checkpointCommits.COUNT == 0 THEN
    violations.APPEND({
      severity: "high",
      rule: "Commit checkpoint protocol",
      description: "Task must create checkpoint commits after each phase completion"
    })
  END IF
  
  // Check 2: Work Log Updates
  expectedWorkLog = ".github/key-data-streams/{key}/work-log.md"
  IF FileExists(expectedWorkLog) THEN
    workLogContent = ReadFile(expectedWorkLog)
    lastModified = GetFileLastModified(expectedWorkLog)
    
    IF lastModified < ExecutionStartTime THEN
      violations.APPEND({
        severity: "medium",
        rule: "Work log maintenance",
        description: "Task must update work-log.md during execution"
      })
    END IF
  END IF
  
  // Check 3: Database Access Violations
  FOR EACH file IN evidence.filesModified
    IF file.EndsWith(".cs") THEN
      fileContent = ReadFile(file)
      
      // Check for dbo.* INSERT/UPDATE/DELETE
      IF fileContent.Contains("INSERT INTO dbo.") OR 
         fileContent.Contains("UPDATE dbo.") OR 
         fileContent.Contains("DELETE FROM dbo.") THEN
        violations.APPEND({
          severity: "critical",
          rule: "Database access rules (dbo.* READ-ONLY)",
          description: "File {file} contains write operations to dbo.* schema (READ-ONLY)",
          file: file
        })
      END IF
    END IF
  END FOR
  
  // Check 4: Branch Compliance
  currentBranch = ExecuteCommand("git branch --show-current")
  IF currentBranch != "development" THEN
    violations.APPEND({
      severity: "critical",
      rule: "Branch strategy (SelfAwareness.instructions.md)",
      description: "All work must be done in 'development' branch, not '{currentBranch}'"
    })
  END IF
  
  // Check 5: Test Generation (for UI/API changes)
  IF ContainsUIChanges(evidence) OR ContainsAPIChanges(evidence) THEN
    testsCreated = evidence.filesCreated.Filter(f => f.EndsWith(".spec.ts"))
    
    IF testsCreated.COUNT == 0 THEN
      missedRequirements.APPEND({
        severity: "high",
        requirement: "Test generation",
        description: "UI/API changes should include corresponding test files"
      })
    END IF
  END IF
  
  // Check 6: Required Reading Consultation
  modifiedFiles = evidence.filesModified
  
  IF ContainsSignalRChanges(modifiedFiles) OR ContainsDatabaseChanges(modifiedFiles) THEN
    workLogContent = ReadFile(expectedWorkLog)
    
    IF NOT workLogContent.Contains("Architecture.md") AND 
       NOT workLogContent.Contains("InfrastructureQuickRef.md") THEN
      missedRequirements.APPEND({
        severity: "medium",
        requirement: "Required reading consultation",
        description: "Architectural changes should reference Architecture.md or InfrastructureQuickRef.md"
      })
    END IF
  END IF
  
  RETURN {violations: violations, missedRequirements: missedRequirements}
  
END FUNCTION
```

### build.prompt.md Validation
```
FUNCTION ValidateBuildPrompt(evidence)
  
  violations = []
  missedRequirements = []
  
  // Check 1: Handoff Execution
  IF NOT evidence.Contains("Handoff executed") THEN
    violations.APPEND({
      severity: "critical",
      rule: "Actual handoff execution",
      description: "build.prompt.md must actually execute target prompt, not simulate"
    })
  END IF
  
  // Check 2: Key Data Stream Search
  workLogContent = ReadFile(".github/key-data-streams/*/work-log.md")
  
  IF NOT workLogContent.Contains("Searched existing keys") THEN
    missedRequirements.APPEND({
      severity: "medium",
      requirement: "Key data stream search",
      description: "Build should search for existing keys before creating new ones"
    })
  END IF
  
  // Check 3: Context Analysis Completeness
  IF HasImages(currentRequest) OR HasVideos(currentRequest) THEN
    IF NOT workLogContent.Contains("Image analysis") AND 
       NOT workLogContent.Contains("Video analysis") THEN
      missedRequirements.APPEND({
        severity: "low",
        requirement: "Multi-modal context analysis",
        description: "Build should analyze all provided context (images, videos, files)"
      })
    END IF
  END IF
  
  RETURN {violations: violations, missedRequirements: missedRequirements}
  
END FUNCTION
```

### ask.prompt.md Validation
```
FUNCTION ValidateAskPrompt(evidence)
  
  violations = []
  missedRequirements = []
  
  // Check 1: Routed to Question Agent
  IF NOT evidence.Contains("question.prompt.md") THEN
    violations.APPEND({
      severity: "high",
      rule: "Question agent routing",
      description: "ask.prompt.md must route to internal/comm/question.prompt.md"
    })
  END IF
  
  // Check 2: Next Actions Presented
  responseContent = GetResponseContent()
  
  IF NOT responseContent.Contains("What would you like to do next?") THEN
    violations.APPEND({
      severity: "medium",
      rule: "Next actions mandate (output-style-mandate.md)",
      description: "Ask must present letter-based next actions (A, B, C, D)"
    })
  END IF
  
  // Check 3: Handoff Option Offered
  IF NOT responseContent.Contains("Turn this into a plan") THEN
    missedRequirements.APPEND({
      severity: "low",
      requirement: "Plan handoff option",
      description: "Ask should offer option to turn answer into actionable plan"
    })
  END IF
  
  RETURN {violations: violations, missedRequirements: missedRequirements}
  
END FUNCTION
```

### todo.prompt.md Validation
```
FUNCTION ValidateTodoPrompt(evidence)
  
  violations = []
  missedRequirements = []
  
  // Check 0: File Finalization Verification (work-log.md append check)
  // Per file-finalization-verifier.md and Execution section
  expectedWorkLog = ".github/key-data-streams/{key}/work-log.md"
  
  IF FileExists(expectedWorkLog) THEN
    previousSize = GetFileSizeBeforeWork(expectedWorkLog)
    currentSize = GetCurrentFileSize(expectedWorkLog)
    
    IF currentSize <= previousSize THEN
      violations.APPEND({
        severity: "critical",
        rule: "File finalization verification (todo - append check)",
        description: "work-log.md must be appended during todo execution",
        previousSize: previousSize,
        currentSize: currentSize,
        enforcement: "HALT execution - Response validation must not execute",
        reference: ".github/prompts/shared/file-finalization-verifier.md"
      })
      
      // HALT further validation
      RETURN {violations: violations, missedRequirements: missedRequirements}
    END IF
  ELSE
    violations.APPEND({
      severity: "critical",
      rule: "File finalization verification (todo - file existence)",
      description: "work-log.md must exist for todo to extend work",
      enforcement: "HALT execution - Response validation must not execute",
      reference: ".github/prompts/shared/file-finalization-verifier.md"
    })
    
    // HALT further validation
    RETURN {violations: violations, missedRequirements: missedRequirements}
  END IF
  
  // Check 1: Key Preserved
  activeKey = DetectActiveKey(evidence.gitHistory)
  
  IF activeKey IS NULL THEN
    violations.APPEND({
      severity: "high",
      rule: "Key preservation",
      description: "Todo must preserve and reuse active key from recent work"
    })
  END IF
  
  // Check 2: Context Extended (Not Replaced)
  IF activeKey IS NOT NULL THEN
    planFile = ".github/key-data-streams/{activeKey}/{activeKey}.plan.md"
    planContent = ReadFile(planFile)
    planVersionBefore = ExtractVersion(planContent)
    
    // After execution
    planVersionAfter = ExtractVersion(ReadFile(planFile))
    
    IF planVersionBefore == planVersionAfter THEN
      missedRequirements.APPEND({
        severity: "medium",
        requirement: "Plan extension",
        description: "Todo should extend existing plan with new phases/tasks"
      })
    END IF
  END IF
  
  // Check 3: Routing Classification
  IF IsComplexWork(currentRequest) THEN
    IF NOT evidence.Contains("Recommended comprehensive planning") THEN
      missedRequirements.APPEND({
        severity: "low",
        requirement: "Complexity detection",
        description: "Todo should recommend /plan for complex multi-layer work"
      })
    END IF
  END IF
  
  RETURN {violations: violations, missedRequirements: missedRequirements}
  
END FUNCTION
```

### test-generation.prompt.md Validation
```
FUNCTION ValidateTestGenerationPrompt(evidence)
  
  violations = []
  missedRequirements = []
  
  // Check 1: Test Files Created
  testsCreated = evidence.filesCreated.Filter(f => f.EndsWith(".spec.ts"))
  
  IF testsCreated.COUNT == 0 THEN
    violations.APPEND({
      severity: "critical",
      rule: "Test file generation",
      description: "Test-generation must create .spec.ts files"
    })
  END IF
  
  // Check 2: Test Registry Updated
  testRegistryPath = ".github/key-data-streams/{key}/tests/test-registry.md"
  
  IF NOT FileExists(testRegistryPath) THEN
    violations.APPEND({
      severity: "high",
      rule: "Test registry maintenance",
      description: "Test-generation must update test registry"
    })
  END IF
  
  // Check 3: Test Coverage Types
  testTypes = AnalyzeTestTypes(testsCreated)
  
  IF ContainsUIChanges(currentRequest) AND NOT testTypes.Contains("Percy") THEN
    missedRequirements.APPEND({
      severity: "medium",
      requirement: "Visual regression tests",
      description: "UI changes should include Percy snapshot tests"
    })
  END IF
  
  // Check 4: Test Execution Validation
  FOR EACH testFile IN testsCreated
    testContent = ReadFile(testFile)
    
    IF NOT testContent.Contains("test(") AND NOT testContent.Contains("it(") THEN
      violations.APPEND({
        severity: "high",
        rule: "Valid test structure",
        description: "Test file {testFile} missing test cases",
        file: testFile
      })
    END IF
  END FOR
  
  RETURN {violations: violations, missedRequirements: missedRequirements}
  
END FUNCTION
```

### healthcheck.prompt.md Validation
```
FUNCTION ValidateHealthcheckPrompt(evidence)
  
  violations = []
  missedRequirements = []
  
  // Check 1: Read-Only Enforcement
  IF evidence.filesModified.COUNT > 0 OR evidence.filesCreated.COUNT > 0 THEN
    violations.APPEND({
      severity: "critical",
      rule: "Read-only agent",
      description: "Healthcheck must not modify any files (read-only validation only)"
    })
  END IF
  
  // Check 2: Validation Report Generated
  healthcheckReports = evidence.filesCreated.Filter(f => f.Contains("healthcheck-report"))
  
  IF healthcheckReports.COUNT == 0 THEN
    missedRequirements.APPEND({
      severity: "medium",
      requirement: "Validation report",
      description: "Healthcheck should generate comprehensive validation report"
    })
  END IF
  
  // Check 3: Scope Coverage
  requestedScope = ExtractScope(currentRequest)
  
  IF requestedScope == "all" OR requestedScope == "prompts" THEN
    workLogContent = ReadFile("work-log.md")
    
    IF NOT workLogContent.Contains("Validated prompt files") THEN
      missedRequirements.APPEND({
        severity: "low",
        requirement: "Full scope validation",
        description: "Healthcheck should validate all prompt files when scope=prompts"
      })
    END IF
  END IF
  
  RETURN {violations: violations, missedRequirements: missedRequirements}
  
END FUNCTION
```

### drift.prompt.md Validation
```
FUNCTION ValidateDriftPrompt(evidence)
  
  violations = []
  missedRequirements = []
  
  // Check 1: Drift Key Created
  driftKeys = evidence.keyDataStreams.Filter(k => k.name.StartsWith("drift-"))
  
  IF driftKeys.COUNT == 0 THEN
    violations.APPEND({
      severity: "high",
      rule: "Drift key creation",
      description: "Drift must create drift-* prefixed key for issue isolation"
    })
  END IF
  
  // Check 2: Parent Key Preserved
  FOR EACH driftKey IN driftKeys
    driftContext = LoadKeyDataStream(driftKey)
    
    IF NOT driftContext.Contains("parent-key:") THEN
      violations.APPEND({
        severity: "high",
        rule: "Parent key tracking",
        description: "Drift key {driftKey.name} missing parent key reference"
      })
    END IF
  END FOR
  
  // Check 3: Stack Depth Limit
  stackDepth = CalculateStackDepth(evidence.keyDataStreams)
  
  IF stackDepth > 3 THEN
    violations.APPEND({
      severity: "medium",
      rule: "Stack depth limit (max 3)",
      description: "Drift stack depth ({stackDepth}) exceeds maximum of 3 levels"
    })
  END IF
  
  // Check 4: Severity Classification
  FOR EACH driftKey IN driftKeys
    driftPlan = ReadFile(".github/key-data-streams/{driftKey.name}/{driftKey.name}.plan.md")
    
    IF NOT driftPlan.Contains("severity:") THEN
      missedRequirements.APPEND({
        severity: "low",
        requirement: "Severity classification",
        description: "Drift should classify severity (critical|high|medium|low|informational)"
      })
    END IF
  END FOR
  
  RETURN {violations: violations, missedRequirements: missedRequirements}
  
END FUNCTION
```

### cohesion.prompt.md Validation
```
FUNCTION ValidateCohesionPrompt(evidence)
  
  violations = []
  missedRequirements = []
  
  // Check 1: Cohesion Report Generated
  cohesionReports = evidence.filesCreated.Filter(f => f.Contains("cohesion-report"))
  
  IF cohesionReports.COUNT == 0 THEN
    violations.APPEND({
      severity: "medium",
      rule: "Cohesion report generation",
      description: "Cohesion must generate validation report with findings"
    })
  END IF
  
  // Check 2: Validation Level Executed
  requestedLevel = ExtractValidationLevel(currentRequest)
  reportContent = ReadFile(cohesionReports[0])
  
  IF requestedLevel == "full" OR requestedLevel == "conflicts" THEN
    IF NOT reportContent.Contains("Conflict analysis") THEN
      missedRequirements.APPEND({
        severity: "medium",
        requirement: "Conflict detection",
        description: "Cohesion should detect competing/contradictory instructions"
      })
    END IF
  END IF
  
  // Check 3: Cross-Reference Validation
  IF NOT reportContent.Contains("Cross-reference validation") THEN
    missedRequirements.APPEND({
      severity: "low",
      requirement: "Cross-reference checking",
      description: "Cohesion should validate file references and agent handoffs"
    })
  END IF
  
  RETURN {violations: violations, missedRequirements: missedRequirements}
  
END FUNCTION
```

---

## Drift Detection

```
FUNCTION DetectDriftFromExpectedBehavior(promptName, evidence)
  
  driftIssues = []
  
  // Drift Pattern 1: Unnecessary File Creation
  FOR EACH file IN evidence.filesCreated
    IF IsUnnecessaryFile(file, promptName) THEN
      driftIssues.APPEND({
        severity: "low",
        pattern: "Unnecessary file creation",
        description: "File {file} created but not required by prompt responsibilities"
      })
    END IF
  END FOR
  
  // Drift Pattern 2: Scope Creep
  IF evidence.filesModified.COUNT > ExpectedModificationCount(promptName) THEN
    driftIssues.APPEND({
      severity: "medium",
      pattern: "Scope creep",
      description: "Modified more files than expected for prompt scope"
    })
  END IF
  
  // Drift Pattern 3: Missing Core Deliverables
  coreDeliverables = GetCoreDeliverablesForPrompt(promptName)
  
  FOR EACH deliverable IN coreDeliverables
    IF NOT evidence.Contains(deliverable) THEN
      driftIssues.APPEND({
        severity: "high",
        pattern: "Missing core deliverable",
        description: "Expected deliverable '{deliverable}' not produced"
      })
    END IF
  END FOR
  
  // Drift Pattern 4: Workflow Deviation
  expectedWorkflow = GetExpectedWorkflow(promptName)
  actualWorkflow = ReconstructWorkflow(evidence)
  
  IF NOT WorkflowsMatch(expectedWorkflow, actualWorkflow) THEN
    driftIssues.APPEND({
      severity: "medium",
      pattern: "Workflow deviation",
      description: "Execution workflow deviated from expected sequence"
    })
  END IF
  
  RETURN driftIssues
  
END FUNCTION
```

---

## Quality Assessment

```
FUNCTION AssessExecutionQuality(violations, missedRequirements, driftIssues)
  
  // Scoring System
  baseScore = 100
  
  // Deduct for violations (severity-weighted)
  FOR EACH violation IN violations
    SWITCH violation.severity
      CASE "critical": baseScore -= 25
      CASE "high": baseScore -= 15
      CASE "medium": baseScore -= 5
      CASE "low": baseScore -= 2
    END SWITCH
  END FOR
  
  // Deduct for missed requirements
  FOR EACH requirement IN missedRequirements
    SWITCH requirement.severity
      CASE "critical": baseScore -= 20
      CASE "high": baseScore -= 10
      CASE "medium": baseScore -= 4
      CASE "low": baseScore -= 1
    END SWITCH
  END FOR
  
  // Deduct for drift issues
  FOR EACH issue IN driftIssues
    SWITCH issue.severity
      CASE "high": baseScore -= 8
      CASE "medium": baseScore -= 3
      CASE "low": baseScore -= 1
    END SWITCH
  END FOR
  
  // Normalize to 0-100
  qualityScore = MAX(0, MIN(100, baseScore))
  
  // Classification
  IF qualityScore >= 90 THEN
    classification = "Excellent"
  ELSE IF qualityScore >= 75 THEN
    classification = "Good"
  ELSE IF qualityScore >= 60 THEN
    classification = "Acceptable"
  ELSE IF qualityScore >= 40 THEN
    classification = "Needs Improvement"
  ELSE
    classification = "Critical Issues"
  END IF
  
  RETURN {
    score: qualityScore,
    classification: classification,
    threshold: 60,  // Acceptable threshold
    passed: qualityScore >= 60
  }
  
END FUNCTION
```

---

## Validation Report Format

```markdown
# Prompt Validation Report

**Prompt:** {prompt-name}  
**Execution Key:** {key}  
**Validation Time:** {timestamp}  
**Quality Score:** {score}/100 ({classification})

---

## 🎯 Execution Summary

**User Request:** {original-request}  
**Prompt Mode:** {mode}  
**Branch:** {git-branch}  
**Files Created:** {count}  
**Files Modified:** {count}  
**Commits:** {count}

---

## ✅ Compliance Status

**Overall:** {PASS|FAIL}  
**Quality Score:** {score}/100 (Threshold: 60)  
**Classification:** {classification}

---

## 🚨 Critical Violations ({count})

{IF violations.critical.COUNT > 0}
| Severity | Rule | Description | File/Context |
|----------|------|-------------|--------------|
| Critical | {rule} | {description} | {file} |
{END IF}

{IF violations.critical.COUNT == 0}
✅ No critical violations detected
{END IF}

---

## ⚠️ High-Priority Issues ({count})

{IF violations.high.COUNT > 0}
| Severity | Rule | Description | File/Context |
|----------|------|-------------|--------------|
| High | {rule} | {description} | {file} |
{END IF}

{IF violations.high.COUNT == 0}
✅ No high-priority issues detected
{END IF}

---

## 📋 Missed Requirements ({count})

{IF missedRequirements.COUNT > 0}
| Severity | Requirement | Description | Impact |
|----------|-------------|-------------|--------|
| {severity} | {requirement} | {description} | {impact} |
{END IF}

{IF missedRequirements.COUNT == 0}
✅ All requirements fulfilled
{END IF}

---

## 🔍 Drift Detection ({count})

{IF driftIssues.COUNT > 0}
| Severity | Pattern | Description | Recommendation |
|----------|---------|-------------|----------------|
| {severity} | {pattern} | {description} | {recommendation} |
{END IF}

{IF driftIssues.COUNT == 0}
✅ No drift detected
{END IF}

---

## 📊 Detailed Analysis

### Rule Compliance Breakdown
- **Universal Rules:** {passed}/{total} passed
- **Prompt-Specific Rules:** {passed}/{total} passed
- **Architectural Rules:** {passed}/{total} passed

### Coverage Analysis
- **Core Deliverables:** {completed}/{expected}
- **Documentation:** {status}
- **Testing:** {status}
- **Git Workflow:** {status}

### Quality Metrics
- **Code Quality:** {score}
- **Documentation Quality:** {score}
- **Process Adherence:** {score}
- **Test Coverage:** {percentage}%

---

## 💡 Recommendations

{IF qualityScore < 60}
### Immediate Actions Required
1. {action-1}
2. {action-2}
3. {action-3}
{END IF}

### Improvement Opportunities
1. {improvement-1}
2. {improvement-2}
3. {improvement-3}

### Best Practices to Adopt
1. {practice-1}
2. {practice-2}
3. {practice-3}

---

## 🎯 Improvement Plan

{IF violations.COUNT > 0 OR qualityScore < 60}
**Status:** Auto-generating improvement plan and handing off to plan.prompt.md

**Focus Areas:**
1. {focus-area-1}
2. {focus-area-2}
3. {focus-area-3}

**Expected Outcome:**
- {outcome-1}
- {outcome-2}
- {outcome-3}

**Handoff Details:**
- **Target:** plan.prompt.md
- **Key:** {improvement-key}
- **Context:** Validation report with {violations.COUNT} violations and {missedRequirements.COUNT} missed requirements
{ELSE}
**Status:** No improvement plan needed - execution quality is acceptable
{END IF}

---

## 📎 Evidence Links

- **Work Log:** `.github/key-data-streams/{key}/work-log.md`
- **Plan File:** `.github/key-data-streams/{key}/{key}.plan.md`
- **Git History:** `git log --oneline --grep="ckpt: {key}"`
- **Changed Files:** {file-list}

---

## What would you like to do next?

**A.** Review improvement plan details  
**B.** Proceed with prompt enhancement (handoff to plan.prompt.md)  
**C.** Run validation again after manual fixes  
**D.** Accept findings and continue without changes
```

---

## Improvement Plan Generation

```
FUNCTION GenerateImprovementPlan(validationReport)
  
  plan = {
    key: "prompt-improve-{promptName}-{timestamp}",
    title: "Prompt Enhancement - {promptName}",
    purpose: "Address validation findings and improve prompt cohesion",
    phases: []
  }
  
  // Phase 1: Critical Violations
  IF validationReport.violations.critical.COUNT > 0 THEN
    phase1 = {
      name: "Fix Critical Violations",
      priority: "critical",
      tasks: []
    }
    
    FOR EACH violation IN validationReport.violations.critical
      phase1.tasks.APPEND({
        description: "Fix: {violation.description}",
        rule: violation.rule,
        file: violation.file,
        severity: "critical"
      })
    END FOR
    
    plan.phases.APPEND(phase1)
  END IF
  
  // Phase 2: High-Priority Issues
  IF validationReport.violations.high.COUNT > 0 THEN
    phase2 = {
      name: "Resolve High-Priority Issues",
      priority: "high",
      tasks: []
    }
    
    FOR EACH violation IN validationReport.violations.high
      phase2.tasks.APPEND({
        description: "Resolve: {violation.description}",
        rule: violation.rule,
        file: violation.file,
        severity: "high"
      })
    END FOR
    
    plan.phases.APPEND(phase2)
  END IF
  
  // Phase 3: Missed Requirements
  IF validationReport.missedRequirements.COUNT > 0 THEN
    phase3 = {
      name: "Implement Missed Requirements",
      priority: "medium",
      tasks: []
    }
    
    FOR EACH requirement IN validationReport.missedRequirements
      phase3.tasks.APPEND({
        description: "Implement: {requirement.description}",
        requirement: requirement.requirement,
        severity: requirement.severity
      })
    END FOR
    
    plan.phases.APPEND(phase3)
  END IF
  
  // Phase 4: Drift Mitigation
  IF validationReport.driftIssues.COUNT > 0 THEN
    phase4 = {
      name: "Address Drift Issues",
      priority: "low",
      tasks: []
    }
    
    FOR EACH issue IN validationReport.driftIssues
      phase4.tasks.APPEND({
        description: "Mitigate: {issue.description}",
        pattern: issue.pattern,
        severity: issue.severity
      })
    END FOR
    
    plan.phases.APPEND(phase4)
  END IF
  
  // Phase 5: Documentation & Testing
  phase5 = {
    name: "Update Documentation & Add Tests",
    priority: "medium",
    tasks: [
      "Update prompt documentation with enhanced rules",
      "Add validation test cases for new requirements",
      "Update cross-references to related prompts",
      "Document lessons learned in validation-patterns.json"
    ]
  }
  plan.phases.APPEND(phase5)
  
  RETURN plan
  
END FUNCTION
```

---

## Handoff to plan.prompt.md

```
FUNCTION HandoffToPlanPrompt(improvementPlan)
  
  handoffContext = {
    sourcePrompt: currentPromptName,
    validationReport: validationReport,
    improvementKey: improvementPlan.key,
    focusAreas: ExtractFocusAreas(improvementPlan),
    constraints: [
      "Must preserve existing prompt functionality",
      "Must maintain backward compatibility with existing keys",
      "Must follow CONCISE-MANDATE (15 bullets max)",
      "Must update cross-references in dependent prompts"
    ]
  }
  
  // Construct plan prompt invocation
  planRequest = BuildPlanRequest(handoffContext)
  
  // Execute handoff
  INVOKE plan.prompt.md WITH:
    key: improvementPlan.key
    user_request: planRequest
    context: validationReport
    include_suggestions: true
  
  // Log handoff
  LogHandoff({
    from: currentPromptName,
    to: "plan.prompt.md",
    key: improvementPlan.key,
    reason: "Validation findings require prompt enhancement"
  })
  
END FUNCTION
```

---

## Integration with Existing Prompts

Each prompt file should add a `/test` parameter section:

```markdown
### -test *(flag, optional)*
Enable post-execution validation using prompt-test-validation-framework.md

**Behavior:**
1. Execute prompt normally
2. Run validation checks after completion
3. Generate validation report with quality score
4. If violations found: handoff to plan.prompt.md for improvement
5. Present findings and next actions to user

**Example:**
```bash
@workspace /plan key=my-feature -test "Add user dashboard"
@workspace /task key=my-task -test tasks="implement phase 1"
```

**Validation Checks:**
- Rule compliance (universal + prompt-specific)
- Requirement coverage analysis
- Drift detection
- Quality assessment
- Git workflow validation
- Documentation completeness
```

---

## Example Usage Flows

### Example 1: plan.prompt.md with /test

```
User: @workspace /plan key=user-dashboard -test "Create user dashboard with profile, settings, and notifications"

Agent: [Executes plan.prompt.md normally]
       - Creates key data stream
       - Generates plan file
       - Creates work log
       - Breaks down into phases
       
       [Post-execution validation]
       - Gathering evidence...
       - Checking rule compliance...
       - Analyzing requirement coverage...
       - Detecting drift...
       
       📊 Validation Results:
       
       Quality Score: 85/100 (Good)
       
       ✅ Critical: 0 violations
       ⚠️ Medium: 2 missed requirements
         - Test strategy not included in plan
         - Key spelling validation not documented
       
       🔍 Drift: 0 issues
       
       What would you like to do next?
       
       A. Review detailed validation report
       B. Continue without addressing findings (score acceptable)
       C. Generate improvement plan for missed requirements
       D. Re-run plan with enhanced validation
```

### Example 2: task.prompt.md with /test (Critical Violation)

```
User: @workspace /task key=admin-panel -test tasks="Add admin user management"

Agent: [Executes task.prompt.md normally]
       - Implements admin panel UI
       - Creates API endpoints
       - Updates database (VIOLATION: wrote to dbo.Users table)
       
       [Post-execution validation]
       - Gathering evidence...
       - Checking rule compliance...
       
       🚨 VALIDATION FAILED
       
       Quality Score: 45/100 (Critical Issues)
       
       ❌ Critical: 1 violation
         - Database access rule violation: INSERT INTO dbo.Users (READ-ONLY schema)
         - File: AdminService.cs, Line 42
       
       ⚠️ High: 1 issue
         - Missing checkpoint commits (no ckpt: messages in recent commits)
       
       🔄 Auto-generating improvement plan...
       
       Handing off to plan.prompt.md:
       - Key: prompt-improve-task-20251027
       - Focus: Fix database access violation and restore checkpoint protocol
       
       What would you like to do next?
       
       A. Review improvement plan and proceed with fixes
       B. Rollback changes and restart with correct approach
       C. Manual fix (provide guidance but don't auto-execute)
       D. Cancel (accept violation - NOT RECOMMENDED)
```

### Example 3: healthcheck.prompt.md with /test

```
User: @workspace /healthcheck scope=prompts -test

Agent: [Executes healthcheck.prompt.md normally]
       - Validates all prompt files
       - Checks cross-references
       - Detects conflicts
       - Generates report
       
       [Post-execution validation]
       - Gathering evidence...
       - Checking read-only enforcement...
       
       📊 Validation Results:
       
       Quality Score: 95/100 (Excellent)
       
       ✅ Critical: 0 violations
       ✅ High: 0 issues
       📋 Low: 1 missed requirement
         - Full scope validation documentation incomplete
       
       🔍 Drift: 0 issues
       
       What would you like to do next?
       
       A. Accept results (excellent quality)
       B. Generate minor improvement plan for low-priority finding
       C. Re-run with enhanced scope
       D. Continue to next healthcheck scope
```

### Example 4: plan.prompt.md File Finalization Failure

```
User: @workspace /plan key=user-dashboard -test "Create user dashboard"

Agent: [Executes plan.prompt.md]
       - Analyzes request
       - Creates key data stream directory
       - Generates plan.md ✅
       - Generates plan.json ✅
       - (SKIPPED: work-log.md creation) ❌
       - (SKIPPED: state.json creation) ❌
       
       [Step 5.5: FILE FINALIZATION VERIFICATION - BLOCKING]
       
       🚨 CRITICAL VIOLATION DETECTED
       
       Missing Files (2):
       - .github/key-data-streams/user-dashboard/work-log.md
       - .github/key-data-streams/user-dashboard/state.json
       
       ⛔ HALT EXECUTION
       
       Step 6 (Response to User) and Step 7.5 (Response Validation) 
       will NOT execute until files are created.
       
       Per file-finalization-verifier.md:
       - Plan must create ALL required files before showing response
       - This is a BLOCKING requirement
       
       🔄 Auto-fix attempt:
       - Creating work-log.md...
       - Creating state.json...
       
       ✅ Files created. Resuming validation...
       
       [Continuing to Step 6]
       
       Quality Score: 75/100 (Good - auto-recovered from critical violation)
       
       What would you like to do next?
       
       **A. PROCEED** with plan execution  
       **B.** Review file finalization details  
       **C.** Generate improvement plan (enforce Step 5.5 compliance)  
       **D.** Cancel and restart with correct workflow
```

### Example 5: task.prompt.md Stale Work Log Failure

```
User: @workspace /task key=admin-panel -test tasks="Implement Phase 1"

Agent: [Executes task.prompt.md]
       - Implements admin panel UI
       - Creates database migrations
       - Updates API endpoints
       - Commits changes ✅
       - (FORGOT: work-log.md update) ❌
       
       [Step 8.25: FILE FINALIZATION VERIFICATION]
       
       🚨 CRITICAL VIOLATION DETECTED
       
       work-log.md timestamp check:
       - Last Modified: 2025-10-29 14:30:22 (125 seconds ago)
       - Threshold: 60 seconds
       - Status: STALE ❌
       
       ⛔ HALT EXECUTION
       
       Step 8.6 (Response Validation) will NOT execute until 
       work-log.md is updated.
       
       Per file-finalization-verifier.md:
       - work-log.md must be modified within 60 seconds of completion
       - This ensures documentation happens DURING execution, not after
       
       🔄 Auto-fix attempt:
       - Appending execution summary to work-log.md...
       - Timestamp: 2025-10-29 14:32:30 ✅
       
       ✅ work-log.md updated. Resuming validation...
       
       [Continuing to Step 8.6]
       
       Quality Score: 70/100 (Acceptable - auto-recovered from critical violation)
       
       What would you like to do next?
       
       **A. PROCEED** with next phase  
       **B.** Review work-log.md updates  
       **C.** Generate improvement plan (enforce Step 8.25 compliance)  
       **D.** Rollback and restart with correct workflow
```

### Example 6: todo.prompt.md No Append Failure

```
User: @workspace /todo -test "Add error handling to admin panel"

Agent: [Executes todo.prompt.md]
       - Detects active key: admin-panel
       - Analyzes existing work
       - Adds error handling code
       - Commits changes ✅
       - (FORGOT: work-log.md append) ❌
       
       [Execution: FILE FINALIZATION VERIFICATION]
       
       🚨 CRITICAL VIOLATION DETECTED
       
       work-log.md append check:
       - Previous Size: 4,521 bytes
       - Current Size: 4,521 bytes
       - Change: 0 bytes ❌
       
       ⛔ HALT EXECUTION
       
       Response validation will NOT execute until work-log.md 
       is appended with todo execution details.
       
       Per file-finalization-verifier.md:
       - todo must APPEND to work-log.md (file size must increase)
       - This preserves execution history and context
       
       🔄 Auto-fix attempt:
       - Appending todo execution summary...
       - Previous Size: 4,521 bytes
       - New Size: 4,892 bytes
       - Change: +371 bytes ✅
       
       ✅ work-log.md appended. Resuming validation...
       
       [Continuing to Response Validation]
       
       Quality Score: 72/100 (Acceptable - auto-recovered from critical violation)
       
       What would you like to do next?
       
       **A. PROCEED** with next todo  
       **B.** Review work-log.md append details  
       **C.** Generate improvement plan (enforce append verification)  
       **D.** Mark admin-panel complete and close key
```

---

## Best Practices

### For Prompt Authors
1. **Define validation rules explicitly** in prompt file
2. **Document expected deliverables** clearly
3. **Specify required reading dependencies** for architectural changes
4. **Include example validation passes/failures** in prompt documentation
5. **Update validation rules** when prompt behavior changes

### For Validation Implementers
1. **Keep validation lightweight** - don't slow down execution significantly
2. **Focus on critical rules first** - prioritize by impact
3. **Provide actionable recommendations** - not just "you did this wrong"
4. **Auto-fix when safe** - but always require user approval for modifications
5. **Learn from violations** - update validation-patterns.json with new patterns

### For System Maintainers
1. **Run periodic cohesion checks** - ensure prompts remain synchronized
2. **Review validation reports** - identify systemic issues across prompts
3. **Update framework** - add new validation patterns as system evolves
4. **Monitor false positives** - adjust thresholds and rules based on feedback
5. **Document edge cases** - capture scenarios where validation may not apply

---

## Version History

**1.0.0** (2025-10-27)
- Initial framework release
- Universal /test parameter specification
- Validation algorithms for all core prompts
- Improvement plan generation
- Handoff protocol to plan.prompt.md
