# Plan: MANDATORY.md Scalability Enhancement

**Key:** `prompt`  
**Created:** 2025-10-30  
**Status:** planning  
**Branch:** noorcanvas/prompt-enhancements  
**Priority:** HIGH - System Architecture

---

## Overview

Transform `.github/MANDATORY.md` from a monolithic 600+ line file into a scalable rule index system that supports easy addition of new rules while maintaining source-of-truth behavior.

**Current State:**
- MANDATORY.md: 627 lines (monolithic)
- 3 rules embedded with full implementations
- New rules require modifying large file
- Hard to navigate and maintain
- Violates single responsibility principle

**Target State:**
- MANDATORY.md: ~150 lines (lightweight index)
- Rules in separate `.github/instructions/rules/*.md` files
- One-sentence description per rule in index
- Template for adding new rules
- KDS integration for rule management
- Rules become SOURCE OF TRUTH until explicitly changed

---

## Technology Stack Analysis

**Affected Systems:**
- `.github/MANDATORY.md` - Rule index (transformed)
- `.github/instructions/rules/` - Rule implementations (new)
- `.github/instructions/SelfAwareness.instructions.md` - References MANDATORY
- `.github/prompts/*.prompt.md` - Load MANDATORY rules
- `.github/key-data-streams/prompt/` - Documentation

**Documentation Standards:**
- KDS structure for plan tracking
- Markdown for all documentation
- Frontmatter for rule metadata

---

## User Requirements

From conversation history in CopilotChats.md:

1. **Scalable Architecture**: New rules should be easy to add without modifying large files
2. **Index Structure**: MANDATORY.md contains one-sentence descriptions + references
3. **Separate Files**: Each rule implementation in its own file
4. **Template System**: Standardized template for new rules
5. **KDS Integration**: Rule management documented in KDS
6. **Source of Truth**: Rules remain canonical until explicitly changed by user
7. **Efficiency**: Structure optimized for loading and navigation

---

## Phase 1: Extract Existing Rules

**Objective:** Extract 3 current rules into separate implementation files

### 1.1 Create Rules Directory Structure

**Action:** Create `.github/instructions/rules/` directory hierarchy

**Structure:**
```
.github/instructions/rules/
├── README.md                           # Rule system overview
├── _template/
│   └── rule-template.md                # Template for new rules
├── no-code-in-chat/
│   ├── rule.md                         # Full implementation
│   ├── examples.md                     # Examples & anti-patterns
│   └── metadata.json                   # Rule metadata
├── document-first/
│   ├── rule.md
│   ├── examples.md
│   └── metadata.json
└── playwright-orchestration/
    ├── rule.md
    ├── examples.md
    └── metadata.json
```

### 1.2 Extract Rule 1: No Code in Chat

**Source:** MANDATORY.md lines 33-157

**Extract to:** `.github/instructions/rules/no-code-in-chat/rule.md`

**Content Sections:**
- Rule Statement (prohibited/allowed)
- Why This Matters
- Validation Algorithm (ValidateNoCodeInChat)
- Enforcement Action
- Examples & Edge Cases

**Metadata:** `.github/instructions/rules/no-code-in-chat/metadata.json`
```json
{
  "id": "no-code-in-chat",
  "title": "No Code in Chat",
  "version": "1.0.0",
  "created": "2025-10-30",
  "category": "output-format",
  "severity": "critical",
  "enforcement": "automatic",
  "validationFunction": "ValidateNoCodeInChat",
  "appliesToPrompts": "all",
  "relatedRules": ["document-first"]
}
```

### 1.3 Extract Rule 2: Document First

**Source:** MANDATORY.md lines 159-246

**Extract to:** `.github/instructions/rules/document-first/rule.md`

**Content Sections:**
- Protocol (5-step workflow)
- Validation Algorithm (ValidateDocumentFirst)
- Enforcement Action
- Implementation Module Reference
- Session Templates

**Metadata:** `.github/instructions/rules/document-first/metadata.json`
```json
{
  "id": "document-first",
  "title": "Document First",
  "version": "1.0.0",
  "created": "2025-10-30",
  "category": "workflow",
  "severity": "critical",
  "enforcement": "automatic",
  "validationFunction": "ValidateDocumentFirst",
  "appliesToPrompts": "all",
  "relatedModules": [".github/prompts/shared/step-2-5-document-first-checkpoint.md"]
}
```

### 1.4 Extract Rule 3: Playwright Orchestration

**Source:** MANDATORY.md lines 248-416

**Extract to:** `.github/instructions/rules/playwright-orchestration/rule.md`

**Content Sections:**
- Protocol (5-step orchestration)
- Validation Algorithm (ValidatePlaywrightOrchestration)
- Enforcement Action
- Orchestration Template
- Example Scripts

**Metadata:** `.github/instructions/rules/playwright-orchestration/metadata.json`
```json
{
  "id": "playwright-orchestration",
  "title": "Playwright Orchestration",
  "version": "1.0.0",
  "created": "2025-10-30",
  "category": "testing",
  "severity": "critical",
  "enforcement": "automatic",
  "validationFunction": "ValidatePlaywrightOrchestration",
  "appliesToPrompts": ["plan", "task"],
  "relatedDocs": [".github/instructions/Links/PlaywrightTestOrchestration.md"]
}
```

### 1.5 Create Examples Files

**For each rule, create examples.md:**

**Structure:**
```markdown
# Examples: {Rule Name}

## ✅ Compliant Examples

### Example 1: {Scenario}
**Context:** {situation}
**Response:** {correct approach}

## ❌ Non-Compliant Examples

### Example 1: {Violation Type}
**Context:** {situation}
**Violation:** {what's wrong}
**Fix:** {how to correct}

## 🔍 Edge Cases

### Edge Case 1: {Scenario}
**Decision:** {how to handle}
**Rationale:** {why}
```

**Deliverables:**
- `.github/instructions/rules/` directory created
- 3 rule folders with rule.md, metadata.json, examples.md
- Content extracted from MANDATORY.md (validated for completeness)

**Success Criteria:**
- All validation algorithms preserved
- All enforcement actions included
- Examples clarify edge cases
- Metadata enables rule discovery

---

## Phase 2: Transform MANDATORY.md Index

**Objective:** Convert MANDATORY.md to lightweight index with rule references

### 2.1 Design New Index Structure

**Target Structure:**
```markdown
# MANDATORY OPERATING RULES (GLOBAL)

> **⚠️ CRITICAL**: This file MUST be loaded FIRST by ALL prompts before any work begins.  
> **Purpose**: Index of non-negotiable operating constraints.  
> **Enforcement**: Violations HALT execution immediately.

**Version:** 2.0.0  
**Created:** 2025-10-30  
**Last Modified:** 2025-10-30

---

## 🚨 CRITICAL RULES INDEX

**ALL prompts must validate these rules BEFORE starting work:**

| ID | Rule | Description | File |
|----|------|-------------|------|
| 1 | No Code in Chat | Implementation code NEVER appears in user responses | [rule.md](instructions/rules/no-code-in-chat/rule.md) |
| 2 | Document First | Update KDS files BEFORE code changes | [rule.md](instructions/rules/document-first/rule.md) |
| 3 | Playwright Orchestration | Use dotnet orchestration scripts, not PowerShell | [rule.md](instructions/rules/playwright-orchestration/rule.md) |

**Validation:** Execute `ValidateMandatoryCompliance()` before ANY user-facing output

---

## 📖 Loading Rules

**ALL prompts MUST include this at the top:**

```markdown
# {Prompt Name}

**LOAD FIRST:** `.github/MANDATORY.md` (index) + referenced rule files

**Pre-Work Validation:**

```
# Load rule index
LOAD_MODULE(".github/MANDATORY.md")

# Load and execute each rule's validation
FOR EACH rule IN MandatoryRules:
  LOAD_MODULE(rule.file)
  EXECUTE rule.validationFunction()
END FOR

# Proceed only if compliant
IF NOT AllRulesCompliant() THEN
  EXIT 1
END IF
```
```

---

## 🔍 Global Validation Function

**Execute BEFORE sending ANY user-facing output:**

```
FUNCTION ValidateMandatoryCompliance():
  
  violations = []
  
  # Load all rule files
  rules = LoadRules(".github/instructions/rules/*/metadata.json")
  
  # Execute each rule's validation
  FOR EACH rule IN rules:
    IF rule.appliesToCurrentPrompt() THEN
      result = EXECUTE rule.validationFunction()
      IF result.violation THEN
        violations.ADD(result)
      END IF
    END IF
  END FOR
  
  # Handle violations
  IF violations.Count > 0 THEN
    HandleViolations(violations)
    HALT
  END IF
  
  RETURN { compliant: true }
  
END FUNCTION
```

---

## ➕ Adding New Rules

**See:** `.github/instructions/rules/_template/rule-template.md`

**Process:**
1. Copy template to new rule folder
2. Fill in rule implementation
3. Create metadata.json
4. Add rule to index table above
5. Update ValidateMandatoryCompliance (if needed)
6. Document in KDS

**Rules are SOURCE OF TRUTH until user explicitly changes them.**

---

## 🗂️ File Organization

```
.github/
├── MANDATORY.md                           ← THIS FILE (rule index)
│
├── instructions/
│   ├── rules/                             ← Rule implementations
│   │   ├── README.md
│   │   ├── _template/
│   │   ├── no-code-in-chat/
│   │   ├── document-first/
│   │   └── playwright-orchestration/
│   └── SelfAwareness.instructions.md      ← References MANDATORY.md
│
└── prompts/
    └── *.prompt.md                         ← ALL load MANDATORY.md + rules
```

---

## 📚 Related Documentation

**Core References:**
- `.github/instructions/rules/README.md` - Rule system overview
- `.github/instructions/SelfAwareness.instructions.md` - Global operating guardrails
- `.github/instructions/Links/SystemIndex.md` - Central navigation hub

**Rule Files:**
- `.github/instructions/rules/no-code-in-chat/rule.md`
- `.github/instructions/rules/document-first/rule.md`
- `.github/instructions/rules/playwright-orchestration/rule.md`

---

**This file is MANDATORY and applies to ALL prompts without exception.**

**Last Updated:** 2025-10-30  
**Maintainer:** System  
**Version:** 2.0.0
```

### 2.2 Implementation Steps

**Tasks:**
1. Backup current MANDATORY.md to MANDATORY.v1.0.0.backup.md
2. Replace MANDATORY.md with new index structure
3. Update version to 2.0.0
4. Test rule loading from prompts
5. Verify ValidateMandatoryCompliance works with new structure

### 2.3 Breaking Changes

**What Changes:**
- File structure (monolithic → distributed)
- Loading pattern (single file → index + rule files)
- ValidateMandatoryCompliance (embedded → modular)

**What Stays:**
- Rule IDs (1, 2, 3)
- Validation function names
- Enforcement actions
- Rule semantics

**Migration:**
- Prompts: No changes (still load MANDATORY.md)
- Validation: Must load rule files (automatic via new ValidateMandatoryCompliance)
- References: Update to point to rule files (not MANDATORY.md sections)

**Deliverables:**
- Transformed MANDATORY.md (~150 lines)
- Backup of v1.0.0
- Updated version metadata

**Success Criteria:**
- Index table complete (3 rules)
- All rule files referenced
- ValidateMandatoryCompliance updated
- Backward compatibility maintained (prompts don't need changes)

---

## Phase 3: Rule Template Design

**Objective:** Create standardized template for adding new rules

### 3.1 Template Structure

**File:** `.github/instructions/rules/_template/rule-template.md`

**Content:**
```markdown
# Rule: {Rule Title}

**ID:** `{rule-id}`  
**Version:** 1.0.0  
**Created:** {date}  
**Category:** {category}  
**Severity:** {critical|high|medium|low}  
**Applies To:** {all|specific prompts}

---

## Rule Statement

**Summary:** {One-sentence description for MANDATORY.md index}

**Detailed Description:**
{What this rule enforces and why it matters}

### ❌ PROHIBITED

**Never do:**
- {Action 1}
- {Action 2}
- {Action 3}

### ✅ REQUIRED

**Always do:**
- {Action 1}
- {Action 2}
- {Action 3}

---

## Validation Algorithm

**Function Name:** `Validate{RuleId}()`

```
FUNCTION Validate{RuleId}(context):
  
  # Step 1: Check preconditions
  IF NOT AppliesTo(context) THEN
    RETURN { violation: false, reason: "Rule not applicable" }
  END IF
  
  # Step 2: Execute validation checks
  violations = []
  
  # Check 1: {Description}
  IF {condition} THEN
    violations.ADD({ type: "{TYPE}", message: "{message}" })
  END IF
  
  # Check 2: {Description}
  IF {condition} THEN
    violations.ADD({ type: "{TYPE}", message: "{message}" })
  END IF
  
  # Step 3: Return results
  IF violations.Count > 0 THEN
    RETURN {
      violation: true,
      violations: violations,
      suggestedFix: "{How to fix}"
    }
  END IF
  
  RETURN { violation: false }
  
END FUNCTION
```

---

## Enforcement Action

**Auto-Fix Available:** {yes|no}

```
IF Validate{RuleId}(context).violation THEN
  
  # Log violation
  LogViolation(".github/audits/mandate-violations.log", {
    timestamp: Now(),
    rule: "{RULE_ID}",
    prompt: CurrentPrompt,
    key: CurrentKey,
    violation: validationResult
  })
  
  # HALT execution
  SHOW_ERROR("MANDATE VIOLATION: {Rule Title}")
  SHOW_FIX(validationResult.suggestedFix)
  
  # Auto-fix (if available)
  IF AutoFixAvailable THEN
    ExecuteAutoFix({rule-id}, validationResult)
    RETRY Validate{RuleId}(context)
  ELSE
    EXIT 1
  END IF
  
END IF
```

---

## Examples

**See:** `examples.md` in this folder

---

## Related Documentation

**References:**
- {Link to related rules}
- {Link to implementation modules}
- {Link to documentation}

---

**This rule is SOURCE OF TRUTH until user explicitly changes it.**

**Last Updated:** {date}  
**Version:** 1.0.0
```

### 3.2 Metadata Template

**File:** `.github/instructions/rules/_template/metadata.json`

```json
{
  "id": "{rule-id}",
  "title": "{Rule Title}",
  "version": "1.0.0",
  "created": "{date}",
  "lastModified": "{date}",
  "category": "{category}",
  "severity": "{critical|high|medium|low}",
  "enforcement": "{automatic|manual}",
  "autoFix": false,
  "validationFunction": "Validate{RuleId}",
  "appliesToPrompts": ["all"],
  "relatedRules": [],
  "relatedModules": [],
  "relatedDocs": [],
  "tags": []
}
```

### 3.3 Examples Template

**File:** `.github/instructions/rules/_template/examples.md`

```markdown
# Examples: {Rule Title}

## ✅ Compliant Examples

### Example 1: {Scenario Name}

**Context:**
{Describe the situation}

**Compliant Approach:**
{Show the correct way}

**Why Compliant:**
{Explain why this follows the rule}

---

## ❌ Non-Compliant Examples

### Example 1: {Violation Type}

**Context:**
{Describe the situation}

**Violation:**
{Show the incorrect approach}

**Why Non-Compliant:**
{Explain what rule is broken}

**Fix:**
{Show how to correct it}

---

## 🔍 Edge Cases

### Edge Case 1: {Scenario}

**Situation:**
{Describe the edge case}

**Decision:**
{How to handle it}

**Rationale:**
{Why this is the correct approach}

---

## 📊 Common Patterns

### Pattern 1: {Pattern Name}

**When to Use:**
{Scenarios where this pattern applies}

**How to Apply:**
{Step-by-step application}

**Example:**
{Concrete example}
```

### 3.4 How-To Guide

**File:** `.github/instructions/rules/README.md`

**Content:**
```markdown
# Mandatory Rules System

**Version:** 2.0.0  
**Created:** 2025-10-30

---

## Overview

The Mandatory Rules System enforces non-negotiable operating constraints across ALL prompts in the workspace. Rules are defined in separate implementation files and indexed in `.github/MANDATORY.md`.

---

## Rule Structure

Each rule consists of 3 files:

```
.github/instructions/rules/{rule-id}/
├── rule.md           # Full implementation (validation + enforcement)
├── metadata.json     # Rule metadata (version, severity, etc.)
└── examples.md       # Examples, anti-patterns, edge cases
```

---

## Adding a New Rule

### Step 1: Create Rule Folder

```bash
# Create rule directory
New-Item -Path ".github/instructions/rules/{rule-id}" -ItemType Directory

# Copy templates
Copy-Item ".github/instructions/rules/_template/*" `
          ".github/instructions/rules/{rule-id}/"
```

### Step 2: Implement Rule

**Edit `rule.md`:**
1. Fill in rule statement (what/why)
2. Define prohibited/required actions
3. Implement validation algorithm
4. Define enforcement action
5. Add auto-fix logic (if applicable)

**Edit `metadata.json`:**
1. Set rule ID, title, version
2. Choose category and severity
3. Specify applicable prompts
4. Link related rules/modules

**Edit `examples.md`:**
1. Add compliant examples
2. Add violation examples with fixes
3. Document edge cases
4. Show common patterns

### Step 3: Add to Index

**Edit `.github/MANDATORY.md`:**

Add row to rules table:

```markdown
| {N} | {Rule Title} | {One-sentence description} | [rule.md](instructions/rules/{rule-id}/rule.md) |
```

### Step 4: Update ValidateMandatoryCompliance

If rule requires special handling, update validation function in MANDATORY.md.

### Step 5: Document in KDS

**Create KDS entry:**

```bash
# Update work-log
Add-Content ".github/key-data-streams/prompt/work-log.md" `
            "Added rule: {rule-id}"

# Update plan (if in active session)
# Document rule creation in plan.md
```

### Step 6: Test Rule

**Test validation:**
1. Create test scenario that violates rule
2. Verify validation detects violation
3. Test enforcement action (HALT, auto-fix)
4. Verify logging to mandate-violations.log

**Test integration:**
1. Load rule in test prompt
2. Verify ValidateMandatoryCompliance includes new rule
3. Test with applicable prompts

### Step 7: Commit Changes

```bash
git add .github/MANDATORY.md
git add .github/instructions/rules/{rule-id}/
git commit -m "doc(prompts): Add mandatory rule {rule-id}"
```

---

## Rule Categories

| Category | Description | Severity |
|----------|-------------|----------|
| output-format | Response structure and content rules | Critical |
| workflow | Process and sequencing rules | Critical |
| testing | Test orchestration and execution rules | Critical |
| security | Security and access control rules | Critical |
| documentation | KDS and documentation rules | High |
| code-quality | Code standards and patterns | Medium |

---

## Enforcement Levels

| Level | Behavior |
|-------|----------|
| **automatic** | Validation runs automatically; violations HALT execution |
| **manual** | Validation on-demand; violations show warnings |

---

## Source of Truth Behavior

**Rules are CANONICAL until user explicitly changes them:**

1. ✅ Rules define system behavior (not documentation)
2. ✅ Prompts MUST comply (no exceptions without user approval)
3. ✅ Changes require explicit user instruction
4. ❌ Agents CANNOT modify rules autonomously
5. ❌ Prompts CANNOT override rules

**Modification Process:**
1. User explicitly requests rule change
2. Agent creates plan for modification
3. User approves plan
4. Agent updates rule file(s)
5. Agent updates version metadata
6. Agent commits with "rule-change" prefix

---

## Related Documentation

**Core Files:**
- `.github/MANDATORY.md` - Rule index
- `.github/instructions/SelfAwareness.instructions.md` - Global guardrails
- `.github/key-data-streams/prompt/` - Rule system development KDS

**Templates:**
- `.github/instructions/rules/_template/rule-template.md`
- `.github/instructions/rules/_template/metadata.json`
- `.github/instructions/rules/_template/examples.md`
```

**Deliverables:**
- Rule template (rule.md)
- Metadata template (metadata.json)
- Examples template (examples.md)
- How-to guide (README.md)

**Success Criteria:**
- Templates complete and usable
- README covers full workflow
- Examples demonstrate all sections
- Process documented in KDS

---

## Phase 4: Update References

**Objective:** Update files that reference MANDATORY.md to use new structure

### 4.1 Update SelfAwareness.instructions.md

**File:** `.github/instructions/SelfAwareness.instructions.md`

**Changes:**
1. Update MANDATORY.md reference to mention "rule index"
2. Add note about rule files in `.github/instructions/rules/`
3. Update loading pattern (index + rule files)

**Before:**
```markdown
**LOAD FIRST:** `.github/MANDATORY.md`
```

**After:**
```markdown
**LOAD FIRST:** `.github/MANDATORY.md` (rule index + referenced rule files)
```

### 4.2 Update Prompt Templates

**Files to Update:**
- `.github/prompts/plan.prompt.md`
- `.github/prompts/task.prompt.md`
- `.github/prompts/cohesion.prompt.md`
- Any other prompts referencing MANDATORY.md

**Change Pattern:**

**Before:**
```markdown
**LOAD FIRST:** `.github/MANDATORY.md`

# Validate compliance
validation = ValidateMandatoryCompliance()
```

**After:**
```markdown
**LOAD FIRST:** `.github/MANDATORY.md` (loads rule index + rule files)

# Validate compliance (automatically loads rules from index)
validation = ValidateMandatoryCompliance()
```

### 4.3 Update KDS Templates

**File:** `.github/key-data-streams/_template/work-log.template.md`

**Add reference to rule system:**
```markdown
**Rules:** All work follows `.github/MANDATORY.md` rules (see `.github/instructions/rules/`)
```

**Deliverables:**
- Updated SelfAwareness.instructions.md
- Updated prompt templates
- Updated KDS templates
- Verified all references work

**Success Criteria:**
- No broken references
- Loading pattern updated
- Documentation accurate
- Prompts still work (backward compatible)

---

## Phase 5: Documentation & Testing

**Objective:** Document rule system in KDS and validate functionality

### 5.1 Update KDS Documentation

**Tasks:**
1. Update `work-log.md` with implementation details
2. Create completion summary in this plan
3. Update `state.json` with final phase
4. Document rule system in KDS

**Files to Update:**
- `.github/key-data-streams/prompt/work-log.md`
- `.github/key-data-streams/prompt/mandatory-scalability.plan.md` (this file)
- `.github/key-data-streams/prompt/state.json`

### 5.2 Test Rule Loading

**Test Scenarios:**

**Test 1: Load MANDATORY.md index**
- Verify index file loads
- Verify rule table rendered
- Verify rule file paths correct

**Test 2: Load individual rules**
- Load no-code-in-chat rule
- Load document-first rule
- Load playwright-orchestration rule
- Verify all sections present

**Test 3: Validation execution**
- Execute ValidateNoCodeInChat with violation
- Verify detection and enforcement
- Execute ValidateDocumentFirst with violation
- Verify detection and enforcement
- Execute ValidatePlaywrightOrchestration with violation
- Verify detection and enforcement

**Test 4: New rule addition**
- Use template to create test rule
- Add to index
- Verify loading and validation

### 5.3 Create Testing Guide

**File:** `.github/instructions/rules/TESTING.md`

**Content:**
```markdown
# Rule Testing Guide

## Automated Testing

### Test Validation Algorithm

```powershell
# Create test context that violates rule
$testContext = @{
  response = "```csharp public void Test() { ... }```"
  prompt = "test.prompt.md"
  key = "test-key"
}

# Execute validation
$result = Invoke-Validation -Rule "no-code-in-chat" -Context $testContext

# Assert violation detected
if ($result.violation -eq $false) {
  throw "Validation failed to detect violation"
}
```

### Test Enforcement Action

```powershell
# Execute enforcement with violation
$enforcement = Invoke-Enforcement -Rule "no-code-in-chat" -Violation $result

# Assert logging
if (-not (Test-Path ".github/audits/mandate-violations.log")) {
  throw "Violation not logged"
}

# Assert halt behavior
if ($enforcement.continued -eq $true) {
  throw "Enforcement did not halt execution"
}
```

## Manual Testing

### Test Rule in Prompt

1. Open test prompt file
2. Add LOAD_MODULE(".github/MANDATORY.md")
3. Create scenario that violates rule
4. Run prompt
5. Verify violation detected and execution halted

### Test Auto-Fix

1. Create violation scenario with auto-fix enabled
2. Execute validation
3. Verify auto-fix proposed
4. Accept auto-fix
5. Re-run validation
6. Verify violation resolved

## Integration Testing

### Test with Plan Prompt

```bash
# Run plan prompt with rule violations
# Verify ValidateMandatoryCompliance catches all violations
# Verify enforcement actions execute correctly
```

### Test with Task Prompt

```bash
# Run task prompt with rule violations
# Verify rule loading from index
# Verify validation across multiple rules
```

## Performance Testing

### Measure Rule Loading Time

```powershell
Measure-Command {
  # Load MANDATORY.md index
  # Load all rule files
  # Execute all validations
}

# Target: < 500ms for 10 rules
```
```

### 5.4 Create Migration Checklist

**File:** `.github/instructions/rules/MIGRATION-CHECKLIST.md`

**Content:**
```markdown
# MANDATORY.md v2.0.0 Migration Checklist

## Pre-Migration

- [ ] Backup MANDATORY.md to MANDATORY.v1.0.0.backup.md
- [ ] Review all existing prompts that reference MANDATORY.md
- [ ] Create rollback plan

## Phase 1: Extract Rules

- [ ] Create `.github/instructions/rules/` directory
- [ ] Extract no-code-in-chat rule
- [ ] Extract document-first rule
- [ ] Extract playwright-orchestration rule
- [ ] Create metadata.json for each rule
- [ ] Create examples.md for each rule
- [ ] Validate extracted content matches original

## Phase 2: Transform Index

- [ ] Create new MANDATORY.md (v2.0.0)
- [ ] Add rule index table
- [ ] Update ValidateMandatoryCompliance
- [ ] Add loading instructions
- [ ] Add "Adding New Rules" section
- [ ] Update version metadata

## Phase 3: Create Templates

- [ ] Create rule-template.md
- [ ] Create metadata.json template
- [ ] Create examples.md template
- [ ] Create README.md (how-to guide)
- [ ] Test templates with sample rule

## Phase 4: Update References

- [ ] Update SelfAwareness.instructions.md
- [ ] Update plan.prompt.md
- [ ] Update task.prompt.md
- [ ] Update cohesion.prompt.md
- [ ] Update other prompts
- [ ] Update KDS templates

## Phase 5: Testing

- [ ] Test rule loading
- [ ] Test validation execution
- [ ] Test enforcement actions
- [ ] Test new rule addition
- [ ] Performance test (loading time)
- [ ] Integration test (prompts work)

## Post-Migration

- [ ] Update KDS documentation
- [ ] Create completion report
- [ ] Commit changes
- [ ] Archive v1.0.0 backup
- [ ] Update changelog

## Rollback Procedure

If issues detected:

1. Restore MANDATORY.v1.0.0.backup.md to MANDATORY.md
2. Delete `.github/instructions/rules/` directory
3. Revert prompt reference updates
4. Test rollback with prompts
5. Document rollback reason in KDS
```

**Deliverables:**
- Updated KDS documentation
- Testing guide
- Migration checklist
- Test results

**Success Criteria:**
- All tests pass
- Rule loading efficient (<500ms)
- Prompts work with new structure
- Documentation complete

---

## Summary

**Total Deliverables:**
- 3 rule folders with implementation files (9 files)
- 1 template folder with templates (4 files)
- 1 transformed MANDATORY.md (~150 lines)
- 3 guides (README, TESTING, MIGRATION)
- Updated references (4+ files)

**Estimated Effort:**
- Phase 1: 2 hours (extraction + metadata)
- Phase 2: 1 hour (index transformation)
- Phase 3: 2 hours (templates + guides)
- Phase 4: 1 hour (reference updates)
- Phase 5: 2 hours (testing + documentation)
- **Total: 8 hours**

**Benefits:**
1. **Scalability**: Add new rules without modifying large file
2. **Maintainability**: Rules in focused files
3. **Discoverability**: Index provides overview
4. **Template-driven**: Consistent structure
5. **Source of Truth**: Rules canonical until explicitly changed
6. **KDS Integration**: Full documentation

**Success Metrics:**
- MANDATORY.md size: 627 lines → ~150 lines (76% reduction)
- Rule addition time: 30 min → 15 min (50% faster)
- Navigation efficiency: Single file → Structured directory
- Template usage: 100% compliance on new rules

---

## Next Steps

1. ✅ Mark Phase 1 as in-progress
2. Create `.github/instructions/rules/` directory
3. Extract first rule (no-code-in-chat)
4. Create metadata and examples
5. Continue with remaining rules

**Ready to proceed with Phase 1?**
