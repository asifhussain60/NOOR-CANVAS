# Validation Handoff Protocol for plan.prompt.md

**Version:** 1.0.0  
**Purpose:** Enable plan.prompt.md to receive validation findings from other prompts and generate improvement plans  
**Last Updated:** 2025-10-27

---

## Overview

When any prompt executes with the `-test` flag and validation identifies violations or quality issues, it can hand off to `plan.prompt.md` to generate a comprehensive improvement plan. This document defines how `plan.prompt.md` detects, processes, and responds to validation handoffs.

---

## Detection

### Validation Handoff Indicators

`plan.prompt.md` should detect a validation handoff when:

1. **Context contains validation report** - Check for keywords:
   - "Validation Report"
   - "Quality Score"
   - "violations"
   - "Prompt-Specific Validation Checks"

2. **User request mentions prompt improvement** - Check for phrases:
   - "improve prompt"
   - "fix violations"
   - "enhance [filename].prompt.md"
   - "address validation findings"

3. **Key follows improvement pattern** - Key format:
   - `prompt-enhance-{source-prompt}-{timestamp}`
   - `prompt-improve-{source-prompt}`

### Detection Algorithm

```
FUNCTION DetectValidationHandoff(userRequest, context)
  
  isValidationHandoff = FALSE
  sourcePrompt = NULL
  validationReport = NULL
  
  // Check context for validation report
  IF context.Contains("Validation Report") OR 
     context.Contains("Quality Score:") OR
     context.Contains("violations") THEN
    isValidationHandoff = TRUE
    validationReport = ExtractValidationReport(context)
    sourcePrompt = ExtractSourcePrompt(validationReport)
  END IF
  
  // Check user request for explicit improvement
  IF userRequest.Contains("improve prompt") OR
     userRequest.Contains("fix violations") OR
     (userRequest.Contains("enhance") AND userRequest.Contains(".prompt.md")) THEN
    isValidationHandoff = TRUE
    IF sourcePrompt IS NULL THEN
      sourcePrompt = ExtractPromptName(userRequest)
    END IF
  END IF
  
  // Check key pattern
  IF providedKey.StartsWith("prompt-enhance-") OR
     providedKey.StartsWith("prompt-improve-") THEN
    isValidationHandoff = TRUE
    sourcePrompt = ExtractPromptFromKey(providedKey)
  END IF
  
  RETURN {
    isValidationHandoff: isValidationHandoff,
    sourcePrompt: sourcePrompt,
    validationReport: validationReport
  }
  
END FUNCTION
```

---

## Validation Report Processing

### Parse Findings

Extract and categorize all findings from the validation report:

```
FUNCTION ProcessValidationReport(validationReport)
  
  findings = {
    qualityScore: 0,
    classification: "Unknown",
    criticalViolations: [],
    highPriorityIssues: [],
    mediumIssues: [],
    lowIssues: [],
    missedRequirements: [],
    driftIssues: [],
    recommendations: []
  }
  
  // Extract quality score
  scoreMatch = RegexMatch(validationReport, "Quality Score: (\d+)/100")
  IF scoreMatch THEN
    findings.qualityScore = ParseInt(scoreMatch.Group(1))
    findings.classification = DetermineClassification(findings.qualityScore)
  END IF
  
  // Extract violations by severity
  findings.criticalViolations = ExtractViolationsByType(validationReport, "Critical")
  findings.highPriorityIssues = ExtractViolationsByType(validationReport, "High")
  findings.mediumIssues = ExtractViolationsByType(validationReport, "Medium")
  findings.lowIssues = ExtractViolationsByType(validationReport, "Low")
  
  // Extract missed requirements
  requirementsSection = ExtractSection(validationReport, "Missed Requirements")
  IF requirementsSection THEN
    findings.missedRequirements = ParseRequirements(requirementsSection)
  END IF
  
  // Extract drift issues
  driftSection = ExtractSection(validationReport, "Drift Detection")
  IF driftSection THEN
    findings.driftIssues = ParseDriftIssues(driftSection)
  END IF
  
  // Extract recommendations
  recommendationsSection = ExtractSection(validationReport, "Recommendations")
  IF recommendationsSection THEN
    findings.recommendations = ParseRecommendations(recommendationsSection)
  END IF
  
  // Prioritize all findings
  findings = PrioritizeByImpact(findings)
  
  RETURN findings
  
END FUNCTION
```

---

## Improvement Plan Generation

### Plan Structure

Generate a comprehensive, phased plan to address all validation findings:

```
FUNCTION GeneratePromptImprovementPlan(sourcePrompt, findings, validationReport)
  
  // Generate unique key
  timestamp = GetCurrentTimestamp("yyyyMMdd-HHmmss")
  improvementKey = "prompt-enhance-{sourcePrompt}-{timestamp}"
  
  // Initialize plan
  plan = {
    key: improvementKey,
    title: "Prompt Enhancement - {sourcePrompt}.prompt.md",
    version: "1.0",
    created: GetCurrentDateTime(),
    purpose: "Address validation findings and improve prompt quality",
    sourcePrompt: sourcePrompt,
    sourcePromptPath: ".github/prompts/{sourcePrompt}.prompt.md",
    qualityScoreBefore: findings.qualityScore,
    classificationBefore: findings.classification,
    targetScore: 90,
    targetClassification: "Excellent",
    phases: []
  }
  
  // Phase counter
  phaseNumber = 1
  
  // Phase 1: Fix Critical Violations (if any)
  IF findings.criticalViolations.COUNT > 0 THEN
    phase = {
      number: phaseNumber++,
      name: "Fix Critical Violations",
      priority: "critical",
      description: "Address all critical rule violations that prevent proper prompt operation",
      violations: findings.criticalViolations,
      tasks: GenerateCriticalViolationTasks(findings.criticalViolations),
      successCriteria: [
        "All critical violations resolved",
        "Prompt passes critical validation checks",
        "No breaking changes to prompt functionality"
      ],
      estimatedEffort: "2-4 hours"
    }
    plan.phases.APPEND(phase)
  END IF
  
  // Phase 2: Resolve High-Priority Issues (if any)
  IF findings.highPriorityIssues.COUNT > 0 THEN
    phase = {
      number: phaseNumber++,
      name: "Resolve High-Priority Issues",
      priority: "high",
      description: "Fix significant issues that impact prompt quality and reliability",
      issues: findings.highPriorityIssues,
      tasks: GenerateHighPriorityTasks(findings.highPriorityIssues),
      successCriteria: [
        "All high-priority issues addressed",
        "Prompt reliability improved",
        "Core functionality enhanced"
      ],
      estimatedEffort: "1-3 hours"
    }
    plan.phases.APPEND(phase)
  END IF
  
  // Phase 3: Implement Missed Requirements (if any)
  IF findings.missedRequirements.COUNT > 0 THEN
    phase = {
      number: phaseNumber++,
      name: "Implement Missed Requirements",
      priority: "medium",
      description: "Add functionality or documentation that was expected but not present",
      requirements: findings.missedRequirements,
      tasks: GenerateRequirementTasks(findings.missedRequirements),
      successCriteria: [
        "All requirements documented and implemented",
        "Prompt completeness improved",
        "Integration points validated"
      ],
      estimatedEffort: "1-2 hours"
    }
    plan.phases.APPEND(phase)
  END IF
  
  // Phase 4: Address Medium/Low Issues (if any)
  IF findings.mediumIssues.COUNT > 0 OR findings.lowIssues.COUNT > 0 THEN
    phase = {
      number: phaseNumber++,
      name: "Improve Quality & Consistency",
      priority: "medium",
      description: "Address remaining issues and polish prompt quality",
      issues: findings.mediumIssues.CONCAT(findings.lowIssues),
      tasks: GenerateQualityImprovementTasks(findings.mediumIssues, findings.lowIssues),
      successCriteria: [
        "All medium/low issues resolved",
        "Prompt consistency improved",
        "Documentation enhanced"
      ],
      estimatedEffort: "1-2 hours"
    }
    plan.phases.APPEND(phase)
  END IF
  
  // Phase 5: Mitigate Drift Patterns (if any)
  IF findings.driftIssues.COUNT > 0 THEN
    phase = {
      number: phaseNumber++,
      name: "Mitigate Drift Patterns",
      priority: "medium",
      description: "Address workflow deviations and scope creep issues",
      driftIssues: findings.driftIssues,
      tasks: GenerateDriftMitigationTasks(findings.driftIssues),
      successCriteria: [
        "Drift patterns identified and mitigated",
        "Workflow focused and streamlined",
        "Scope boundaries clarified"
      ],
      estimatedEffort: "30min - 1 hour"
    }
    plan.phases.APPEND(phase)
  END IF
  
  // Phase 6: Apply Recommendations & Optimize
  phase = {
    number: phaseNumber++,
    name: "Optimize & Document",
    priority: "low",
    description: "Apply best practices and enhance documentation",
    recommendations: findings.recommendations,
    tasks: [
      "Apply all recommendations from validation report",
      "Enhance prompt documentation with examples",
      "Add or update validation-specific sections",
      "Update cross-references to related prompts",
      "Document lessons learned in validation-patterns.json",
      "Run cohesion check to ensure no conflicts with other prompts",
      "Update prompt version number in frontmatter"
    ],
    successCriteria: [
      "All recommendations applied",
      "Documentation comprehensive and clear",
      "No conflicts with other prompts",
      "Version incremented appropriately"
    ],
    estimatedEffort: "1-2 hours"
  }
  plan.phases.APPEND(phase)
  
  // Phase 7: Validation Re-Run & Verification
  phase = {
    number: phaseNumber++,
    name: "Re-Run Validation & Verify",
    priority: "verification",
    description: "Execute improved prompt with -test flag and verify quality improvements",
    tasks: [
      "Run cohesion check on updated prompt: @workspace /cohesion scope={sourcePrompt}.prompt.md",
      "Execute sample workflow with -test flag",
      "Verify quality score >= target (90)",
      "Confirm all violations resolved",
      "Check no new issues introduced",
      "Compare before/after validation reports",
      "Update improvement plan with results",
      "Commit all changes with proper message: ckpt({improvementKey}): Enhanced {sourcePrompt}.prompt.md - quality {qualityScoreBefore} → {finalScore}"
    ],
    successCriteria: [
      "Quality score >= 90/100",
      "Classification: Good or Excellent",
      "Zero critical violations",
      "Zero high-priority issues",
      "Improvement documented in work log"
    ],
    estimatedEffort: "30min"
  }
  plan.phases.APPEND(phase)
  
  RETURN plan
  
END FUNCTION
```

### Task Generation Helpers

**Generate tasks for critical violations:**

```
FUNCTION GenerateCriticalViolationTasks(violations)
  
  tasks = []
  
  FOR EACH violation IN violations
    task = {
      description: "Fix: {violation.description}",
      rule: violation.rule,
      file: violation.file OR ".github/prompts/{sourcePrompt}.prompt.md",
      context: violation.context,
      steps: [
        "Locate violation in {violation.file} (line {violation.line} if available)",
        "Understand the rule requirement: {violation.rule}",
        "Apply fix: {GenerateSuggestedFix(violation)}",
        "Verify rule compliance",
        "Test with sample execution",
        "Document fix in work log"
      ],
      suggestedFix: GenerateSuggestedFix(violation),
      verificationCommand: GenerateVerificationCommand(violation)
    }
    tasks.APPEND(task)
  END FOR
  
  RETURN tasks
  
END FUNCTION
```

---

## User Presentation

### Concise Summary

Present the improvement plan in the standardized output format:

```markdown
## 🧠 Copilot Analysis

Validation handoff detected from **{sourcePrompt}.prompt.md**

**Findings:**
- Quality Score: {qualityScore}/100 ({classification})
- Critical Violations: {criticalCount}
- High-Priority Issues: {highCount}
- Missed Requirements: {requirementCount}
- Drift Issues: {driftCount}

**Improvement Plan:** {phaseCount} phases, estimated {totalEffort}

---

## 📌 Summary for You

**Work Requested:** Enhance {sourcePrompt}.prompt.md based on validation findings  
**Key:** {improvementKey}  
**Improvement Goal:** Quality score {qualityScoreBefore} → 90+

**Affected Areas:**
- 2a. Files: `.github/prompts/{sourcePrompt}.prompt.md`
- 2b. Related Prompts: {related-prompt-list}
- 2c. Validation Framework: `prompt-test-validation-framework.md`

**Plan Phases:**
1. Phase 1: Fix Critical Violations ({criticalCount} items)
2. Phase 2: Resolve High-Priority Issues ({highCount} items)
3. Phase 3: Implement Missed Requirements ({requirementCount} items)
4. Phase 4: Optimize & Document
5. Phase 5: Re-Run Validation

**Recommendations:**
- Review validation report details in context
- Consider impact on dependent prompts
- Test with real-world scenarios after changes

---

## 📊 Plan Written

**File:** `.github/key-data-streams/{improvementKey}/{improvementKey}.plan.md`  
**Phases:** {phaseCount}  
**Target Quality:** 90/100 (Excellent)

---

## What would you like to do next?

**A.** Review detailed improvement plan  
**B.** Proceed with prompt enhancement (handoff to task.prompt.md)  
**C.** Modify plan before proceeding  
**D.** Defer improvements (accept current quality score)
```

---

## Handoff to Task Agent

When user approves (selects option B), hand off to task.prompt.md:

```
FUNCTION HandoffToTaskAgent(improvementPlan)
  
  // Construct task invocation
  taskInvocation = {
    key: improvementPlan.key,
    tasks: GenerateTaskPhases(improvementPlan.phases),
    githubBranch: "development",
    commitCheckpoints: TRUE,
    autoChain: FALSE,  // Require user approval between phases
    context: {
      sourcePrompt: improvementPlan.sourcePrompt,
      validationReport: improvementPlan.validationReport,
      qualityScoreBefore: improvementPlan.qualityScoreBefore,
      targetScore: improvementPlan.targetScore
    }
  }
  
  // Format tasks parameter
  tasksString = ""
  FOR EACH phase IN improvementPlan.phases
    tasksString += "Phase {phase.number}: {phase.name}\n"
    FOR EACH task IN phase.tasks
      tasksString += "- {task}\n"
    END FOR
    tasksString += "---\n"
  END FOR
  
  // Invoke task agent
  INVOKE task.prompt.md WITH:
    key: improvementPlan.key
    tasks: tasksString
    github-branch: "development"
    commit-checkpoints: true
  
  // Log handoff
  LogToWorkLog({
    timestamp: GetCurrentDateTime(),
    action: "Handoff to task.prompt.md",
    key: improvementPlan.key,
    phases: improvementPlan.phases.COUNT
  })
  
END FUNCTION
```

---

## Integration with Validation Framework

### Validation Flow

```
1. Any Prompt + -test flag
   ↓
2. Prompt executes normally
   ↓
3. Validation framework runs (prompt-test-validation-framework.md)
   ↓
4. Generate validation report
   ↓
5. IF qualityScore < 60 OR criticalViolations > 0 THEN
   ↓
6. Auto-generate improvement plan structure
   ↓
7. Handoff to plan.prompt.md with context:
      - Validation report
      - Source prompt name
      - Quality score
      - Violations list
   ↓
8. plan.prompt.md detects validation handoff
   ↓
9. Process validation report
   ↓
10. Generate comprehensive improvement plan
   ↓
11. Present to user with options
   ↓
12. IF user approves THEN
    ↓
13. Handoff to task.prompt.md for execution
```

---

## Examples

### Example 1: Task Prompt with Critical Violation

```markdown
**Validation Report from task.prompt.md:**

Quality Score: 35/100 (Critical Issues)

❌ Critical Violation:
   Rule: Database Access Rules (dbo.* READ-ONLY)
   Description: INSERT INTO dbo.Users in AdminService.cs, Line 42
   File: SPA/NoorCanvas/Services/AdminService.cs

**Plan Generated by plan.prompt.md:**

🧠 Copilot Analysis

Validation handoff detected from task.prompt.md

Findings:
- Quality Score: 35/100 (Critical Issues)
- Critical Violations: 1 (database access rule)
- High-Priority Issues: 1 (missing checkpoint commits)

Improvement Plan: 3 phases, estimated 3-5 hours

📌 Summary

Work Requested: Enhance task.prompt.md based on validation findings
Key: prompt-enhance-task-20251027-143022

Plan Phases:
1. Phase 1: Fix Critical Violations (1 item)
   - Fix database access rule violation in AdminService.cs
   - Use canvas.* schema instead of dbo.*
2. Phase 2: Restore Checkpoint Protocol (1 item)
   - Add checkpoint commits after each phase
3. Phase 3: Re-Run Validation

What would you like to do next?
A. Review detailed improvement plan
B. Proceed with prompt enhancement
C. Rollback changes and restart
D. Accept violation (NOT RECOMMENDED)
```

### Example 2: Plan Prompt with Missed Requirements

```markdown
**Validation Report from plan.prompt.md:**

Quality Score: 75/100 (Good)

⚠️ Medium: 2 missed requirements
  - Test strategy not explicitly documented
  - Key spelling validation not logged in work log

**Plan Generated (self-improvement):**

🧠 Copilot Analysis

Self-improvement request detected for plan.prompt.md

Findings:
- Quality Score: 75/100 (Good)
- Missed Requirements: 2 (test strategy, key validation)

Improvement Plan: 2 phases, estimated 1-2 hours

📌 Summary

Work Requested: Enhance plan.prompt.md to always document test strategy
Key: prompt-enhance-plan-20251027-144530

Plan Phases:
1. Phase 1: Add Test Strategy Documentation
   - Update plan generation to include explicit test strategy section
   - Add validation check for test strategy presence
2. Phase 2: Log Key Spelling Validation
   - Update work log to record key validation results
   - Add timestamp for validation execution

What would you like to do next?
A. Review detailed improvement plan
B. Proceed with self-enhancement
C. Defer (quality acceptable as-is)
```

---

## Best Practices

1. **Always preserve functionality** - Enhancements should not break existing prompt behavior
2. **Incremental improvements** - Phase approach allows testing after each change
3. **Document everything** - Capture all changes in work log for future reference
4. **Test thoroughly** - Re-run validation and sample workflows after improvements
5. **Consider dependencies** - Check impact on related prompts (use cohesion check)
6. **Version appropriately** - Increment version number in frontmatter after improvements
7. **Learn from patterns** - Update validation-patterns.json with findings

---

## References

- **Validation Framework:** `.github/prompts/shared/prompt-test-validation-framework.md`
- **Output Style:** `.github/prompts/shared/output-style-mandate.md`
- **Concise Mandate:** `.github/prompts/shared/CONCISE-MANDATE.md`
- **Self-Awareness Rules:** `.github/instructions/SelfAwareness.instructions.md`
- **Cohesion Check:** `.github/prompts/cohesion.prompt.md`
