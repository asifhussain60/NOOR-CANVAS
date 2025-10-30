# /test Parameter Enhancement Summary

**Date:** 2025-10-27  
**Status:** ✅ Complete  
**Version:** 1.0.0

---

## Overview

Enhanced all prompt files in `.github/prompts/` to support a `/test` parameter (or `-test` flag) that enables post-execution self-validation. When provided, prompts analyze their own execution quality, check for rule violations, detect missed requirements, and automatically generate improvement plans when issues are found.

---

## Implementation Summary

### 1. Core Framework Created

**File:** `.github/prompts/shared/prompt-test-validation-framework.md`

**Features:**
- Universal validation algorithm for all prompts
- Prompt-specific validation patterns for each agent
- Evidence gathering from workspace, git history, and key data streams
- Quality scoring system (0-100) with severity-based deductions
- Drift detection patterns
- Improvement plan generation
- Validation report format standardization

**Validation Checks Include:**
- Rule compliance (universal + prompt-specific)
- Requirement coverage analysis
- Drift detection (scope creep, unnecessary files, workflow deviations)
- Quality assessment with threshold enforcement (60+)
- Database access rule enforcement
- Branch strategy compliance
- Commit checkpoint validation
- Output format compliance (CONCISE-MANDATE)

### 2. Prompts Enhanced

All core prompts now support the `-test` parameter:

#### ✅ plan.prompt.md (v1.3)
- Validates key data stream creation
- Checks plan file generation with phased breakdown
- Verifies work log initialization
- Ensures test strategy for UI/API changes
- Validates required reading consultation
- Checks handoff protocol compliance
- **Special capability:** Receives validation findings from other prompts and generates improvement plans

#### ✅ task.prompt.md
- Validates commit checkpoints (ckpt: messages)
- Checks work log maintenance during execution
- **Enforces database access rules** (canvas.* READ-WRITE, dbo.* READ-ONLY)
- Validates branch compliance (development only)
- Checks test generation for UI/API changes
- Verifies required reading consultation for architectural changes
- Validates CONCISE-MANDATE compliance (15 bullets max)

#### ✅ build.prompt.md
- Validates actual handoff execution (not simulation)
- Checks key data stream search before creating new keys
- Verifies context analysis completeness (images, videos, files)
- Validates target prompt parameter construction
- Checks work classification accuracy
- **Pass-through capability:** Forwards -test flag to target prompt

#### ✅ ask.prompt.md
- Validates routing to internal/comm/question.prompt.md
- Checks next actions presentation (letter-based A, B, C, D)
- Verifies handoff option to plan.prompt.md offered
- Validates answer conciseness (no code unless requested)
- Checks output format compliance (🧠/📌 structure)

#### ✅ todo.prompt.md
- Validates key preservation from recent work
- Checks context extension (not replacement)
- Verifies routing classification (recommend /plan for complex work)
- Validates commit checkpoint maintenance
- Checks work log updates
- Verifies auto-chain execution if enabled

#### ✅ test-generation.prompt.md
- Validates test files created (.spec.ts)
- Checks test registry updated
- Verifies test coverage types (Percy for UI, functional for API)
- Validates test structure (test() or it() blocks)
- Checks browser-log guards implementation
- Verifies commit message format (test(key): description)

#### ✅ healthcheck.prompt.md
- **Validates read-only enforcement** (NO files modified/created)
- Checks validation report generation
- Verifies scope coverage completeness
- Validates cross-reference checking
- Checks conflict detection (for prompt optimization mode)
- Ensures no code in user-facing output

#### ✅ drift.prompt.md (v1.2)
- Validates drift key creation with "drift-" prefix
- Checks parent key preservation and referencing
- **Validates stack depth limit** (max 3 levels)
- Checks severity classification documentation
- Verifies commit checkpoints for drift resolution
- Validates parent key context restoration

#### ✅ cohesion.prompt.md (v1.1)
- Validates cohesion report generation
- Checks validation level execution completeness
- Verifies conflict analysis (for conflicts/full level)
- Validates cross-reference completeness
- Checks read-only enforcement
- Ensures recommendations provided

### 3. Validation Handoff Protocol

**File:** `.github/prompts/shared/validation-handoff-protocol.md`

**Purpose:** Enable `plan.prompt.md` to receive validation findings from other prompts and generate improvement plans.

**Features:**
- Detection algorithms for validation handoffs
- Validation report processing
- Improvement plan generation with phased approach
- Task generation helpers for different violation types
- User presentation format
- Handoff to task.prompt.md for execution
- Integration with validation framework

**Workflow:**
1. Any prompt executes with -test flag
2. Validation framework runs after completion
3. If violations or quality score < 60:
   - Generate improvement plan structure
   - Hand off to plan.prompt.md with validation context
4. plan.prompt.md detects validation handoff
5. Processes validation report
6. Generates comprehensive improvement plan
7. Presents to user with action options
8. If approved, hands off to task.prompt.md

---

## Usage Examples

### Example 1: Plan with Test

```bash
@workspace /plan key=my-feature -test "Add user dashboard with profile and settings"
```

**Execution Flow:**
1. Creates plan normally (key data stream, plan file, work log)
2. Runs validation checks after completion
3. Generates quality report (e.g., 85/100 - Good)
4. If issues found, presents findings and options

### Example 2: Task with Critical Violation

```bash
@workspace /task key=admin-panel -test tasks="Add admin user management"
```

**Validation Detects:**
- Critical violation: INSERT INTO dbo.Users (READ-ONLY schema)
- Missing checkpoint commits

**Result:**
- Quality score: 35/100 (Critical Issues)
- Auto-generates improvement plan
- Hands off to plan.prompt.md for remediation
- User chooses: A) Apply fixes, B) Rollback, C) Manual fix

### Example 3: Healthcheck with Test

```bash
@workspace /healthcheck scope=prompts -test
```

**Validation Verifies:**
- Read-only enforcement (no files modified)
- Validation report generated
- Scope coverage complete

**Result:**
- Quality score: 95/100 (Excellent)
- Minimal findings, system healthy

### Example 4: Build with Pass-Through

```bash
@workspace /build plan -test "Add search functionality"
```

**Behavior:**
1. Builds plan prompt with parameters
2. Executes plan.prompt.md
3. Plan runs with -test flag
4. Plan validates its own execution
5. Reports findings

---

## Quality Scoring System

### Score Calculation

```
Base Score: 100

Deductions:
- Critical Violation: -25 points each
- High-Priority Issue: -15 points each
- Medium Issue: -5 points each
- Low Issue: -2 points each
- Missed Critical Requirement: -20 points each
- Missed High Requirement: -10 points each
- Missed Medium Requirement: -4 points each
- Missed Low Requirement: -1 point each
- High Drift: -8 points each
- Medium Drift: -3 points each
- Low Drift: -1 point each

Final Score: MAX(0, MIN(100, baseScore - deductions))
```

### Classifications

- **90-100:** Excellent
- **75-89:** Good
- **60-74:** Acceptable
- **40-59:** Needs Improvement
- **0-39:** Critical Issues

### Threshold

**Acceptable Threshold:** 60

If quality score < 60 OR critical violations > 0:
- Auto-generate improvement plan
- Hand off to plan.prompt.md
- Require user action

---

## Validation Report Format

All validation reports follow standardized format:

```markdown
# Prompt Validation Report

**Prompt:** {prompt-name}  
**Execution Key:** {key}  
**Quality Score:** {score}/100 ({classification})

## ✅ Compliance Status
Overall: {PASS|FAIL}

## 🚨 Critical Violations ({count})
[Table with severity, rule, description, file/context]

## ⚠️ High-Priority Issues ({count})
[Table with severity, rule, description, file/context]

## 📋 Missed Requirements ({count})
[Table with severity, requirement, description, impact]

## 🔍 Drift Detection ({count})
[Table with severity, pattern, description, recommendation]

## 💡 Recommendations
[Numbered list of improvement opportunities]

## 🎯 Improvement Plan
[Auto-generated if quality < 60 or critical violations]

## What would you like to do next?
A. Review improvement plan details
B. Proceed with prompt enhancement
C. Run validation again after manual fixes
D. Accept findings and continue without changes
```

---

## Integration Points

### With Existing Prompts

- **plan.prompt.md:** Receives validation handoffs, generates improvement plans
- **task.prompt.md:** Executes improvement plans from validation findings
- **healthcheck.prompt.md:** Can validate prompt files (prompt optimization mode)
- **cohesion.prompt.md:** Validates system-wide prompt consistency
- **drift.prompt.md:** Can be triggered by validation findings (unrelated issues)

### With Key Data Streams

Validation results stored in key data streams:
- `.github/key-data-streams/{key}/validation-reports/`
- Linked from work-log.md
- Referenced in plan files

### With Git Workflow

- Validation runs after execution (before commit)
- Findings logged in commit messages
- Rollback supported if critical violations

---

## Critical Rules Enforced

### Universal Rules (All Prompts)

1. **CONCISE-MANDATE.md** - Max 15 bullets per response
2. **output-style-mandate.md** - 🧠/📌/📊 format, letter-based actions
3. **SelfAwareness.instructions.md** - Branch strategy (development only)
4. **Database access rules** - canvas.* READ-WRITE, dbo.* READ-ONLY

### Prompt-Specific Rules

Each prompt has 5-8 validation checks specific to its responsibilities:
- plan: Key data stream creation, plan file generation, test strategy
- task: Commit checkpoints, database access, branch compliance
- build: Handoff execution, key search, context analysis
- ask: Routing, next actions, handoff options
- todo: Key preservation, context extension, routing classification
- test-generation: Test files, registry, coverage types
- healthcheck: Read-only enforcement, report generation
- drift: Stack depth, parent key, severity classification
- cohesion: Report generation, conflict detection

---

## Files Created/Modified

### Created Files

1. `.github/prompts/shared/prompt-test-validation-framework.md` (1,400+ lines)
   - Universal validation algorithm
   - Prompt-specific validation patterns
   - Quality scoring system
   - Drift detection patterns
   - Improvement plan generation

2. `.github/prompts/shared/validation-handoff-protocol.md` (800+ lines)
   - Handoff detection algorithms
   - Validation report processing
   - Improvement plan generation for plan.prompt.md
   - Task generation helpers
   - Integration workflow

### Modified Files

1. `.github/prompts/plan.prompt.md` (v1.2 → v1.3)
   - Added -test parameter section
   - Updated inputs in frontmatter
   - Added validation-specific documentation
   - Added reference to validation-handoff-protocol.md

2. `.github/prompts/task.prompt.md`
   - Added -test parameter section
   - Added validation checks documentation
   - Critical violation example included

3. `.github/prompts/build.prompt.md`
   - Added -test parameter section
   - Pass-through behavior documented
   - Build-specific validation checks

4. `.github/prompts/ask.prompt.md`
   - Added -test parameter
   - Ask-specific validation checks

5. `.github/prompts/todo.prompt.md`
   - Added -test parameter
   - Todo-specific validation checks

6. `.github/prompts/test-generation.prompt.md`
   - Added -test parameter
   - Test-generation-specific validation checks

7. `.github/prompts/healthcheck.prompt.md`
   - Added -test parameter
   - Read-only enforcement validation

8. `.github/prompts/drift.prompt.md` (v1.1 → v1.2)
   - Added -test parameter
   - Updated inputs in frontmatter
   - Stack depth validation emphasized

9. `.github/prompts/cohesion.prompt.md` (v1.0 → v1.1)
   - Added -test parameter
   - Updated inputs in frontmatter
   - Cohesion-specific validation checks

---

## Benefits

### For Developers

1. **Self-Awareness:** Prompts can now validate their own execution quality
2. **Early Detection:** Violations caught immediately, not in production
3. **Automated Improvement:** Critical issues trigger automatic improvement plans
4. **Consistency:** All prompts follow same validation standards
5. **Learning:** Validation patterns captured for future improvements

### For System Maintainers

1. **Quality Assurance:** Quantifiable quality metrics (0-100 score)
2. **Compliance Enforcement:** Critical rules enforced automatically
3. **Drift Prevention:** Detects and prevents workflow deviations
4. **Documentation:** All validation results logged in key data streams
5. **Continuous Improvement:** System learns from validation findings

### For Users

1. **Transparency:** Clear quality scores and findings presented
2. **Actionable Options:** Always presented with next steps (A, B, C, D)
3. **Safety:** Critical violations prevent bad changes from being applied
4. **Trust:** Validated execution builds confidence in system
5. **Control:** User chooses whether to proceed with fixes or defer

---

## Future Enhancements

### Potential Additions

1. **Automated Fix Application:** Some violations could be auto-fixed safely
2. **Validation History:** Track quality scores over time per prompt
3. **Cross-Prompt Analysis:** Detect conflicts between prompts automatically
4. **Performance Metrics:** Track execution time, resource usage
5. **ML-Based Scoring:** Learn from user feedback to refine quality assessment
6. **Integration Testing:** Validate multi-prompt workflows end-to-end

### Validation Pattern Learning

`.github/learning/validation-patterns.json` (to be created):
- Capture new violation patterns discovered
- Track resolution strategies that work
- Document edge cases and exceptions
- Share learnings across all prompts

---

## Testing Recommendations

### Test Each Prompt

1. **Normal Execution:** Run without -test to ensure backward compatibility
2. **With -test Flag:** Run with -test and verify validation report
3. **Intentional Violation:** Introduce known violation and verify detection
4. **Improvement Flow:** Trigger improvement plan and execute
5. **Re-Validation:** Run validation again after fixes applied

### Test Integration

1. **Build → Plan → Task:** End-to-end workflow with -test at each stage
2. **Validation Handoff:** Trigger critical violation → verify plan receives it
3. **Cohesion Check:** Run cohesion validation on all prompts
4. **Healthcheck:** Validate prompt files with healthcheck optimization mode

### Test Edge Cases

1. **No Key Provided:** Validation with auto-detected key
2. **Missing Work Log:** Validation when work log doesn't exist
3. **Empty Plan:** Validation with minimal/incomplete plan
4. **Multiple Violations:** Handling of numerous issues simultaneously
5. **Perfect Execution:** Validation when everything is correct (100 score)

---

## Documentation References

- **Validation Framework:** `.github/prompts/shared/prompt-test-validation-framework.md`
- **Handoff Protocol:** `.github/prompts/shared/validation-handoff-protocol.md`
- **Output Style:** `.github/prompts/shared/output-style-mandate.md`
- **Concise Mandate:** `.github/prompts/shared/CONCISE-MANDATE.md`
- **Self-Awareness Rules:** `.github/instructions/SelfAwareness.instructions.md`
- **Database Rules:** `.github/instructions/Links/InfrastructureQuickRef.md`

---

## Conclusion

The `/test` parameter enhancement provides a comprehensive self-validation system for all prompts in the NOOR CANVAS project. By enabling prompts to analyze their own execution quality, detect violations, and automatically generate improvement plans, the system becomes more reliable, maintainable, and self-improving.

All prompts now support consistent validation with quantifiable quality metrics, automated violation detection, and seamless handoff to improvement workflows. This foundation enables continuous improvement of the AI agent system while maintaining high quality standards.

**Status:** ✅ Fully Implemented and Ready for Use
