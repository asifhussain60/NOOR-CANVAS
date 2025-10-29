#!/usr/bin/env python3
"""
Refactor task.prompt.md - Replace large sections with module references
"""

import re

source_file = r"d:\PROJECTS\NOOR CANVAS\.github\prompts\task.prompt.md"
output_file = r"d:\PROJECTS\NOOR CANVAS\.github\prompts\task.prompt.md.refactored"

print("Reading source file...")
with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

print("Applying replacements...")

# Replacement 1: Auto-Drift Detection section
pattern1 = r'(?s)(## Auto-Drift Detection \(MANDATORY\))(.*?)(---\s+### Step 2: Context Gathering)'
replacement1 = r'''## Auto-Drift Detection (MANDATORY)

**LOAD MODULE:** `.github/prompts/shared/task-exec/drift-detection-task.md`

Automatically detect and register unrelated issues during task execution (Steps 2, 5, 6) for post-completion resolution.

**Detection Triggers:** Context gathering, execution phase, validation phase  
**Critical Blocking:** Severity=critical requires user choice (fix/continue/abort)

---

### Step 2: Context Gathering'''
content = re.sub(pattern1, replacement1, content)
print("  ✓ Auto-Drift Detection section replaced")

# Replacement 2: Step 2 - Context Gathering
pattern2 = r'(?s)(### Step 2: Context Gathering \(MANDATORY - Multi-Phase\))(.*?)(---\s+### Step 3: Plan)'
replacement2 = r'''### Step 2: Context Gathering (MANDATORY - Multi-Phase)

**LOAD MODULE:** `.github/prompts/shared/task-exec/context-gathering-protocol.md`

Build comprehensive context before planning through conditional, intelligent sub-phases.

**Always Execute:** 2.1 (Key Resolution + High-Priority Constraints), 2.2 (Key Data Stream Query), 2.3 (Auto-Load Files)  
**Conditional:** 2.4-2.12 (based on task type - errors, framework validation, UI debugging, architecture analysis, etc.)

**Critical Guardrails:**
- Token budget protection (>50,000 tokens → HALT)
- Circular dependency detection → HALT
- Phase timeout (>5 minutes → warn and proceed)

**Key Feature:** Step 2.8.7 validates complete CRUD data lifecycle (UI → API → DB → Broadcast → UI)

---

### Step 3: Plan'''
content = re.sub(pattern2, replacement2, content)
print("  ✓ Step 2 Context Gathering section replaced")

# Replacement 3: Step 6.1 - Test Integration
pattern3 = r'(?s)(#### 6\.1\. Test Integration \(when UI changes occur\))(.*?)(####\s+6\.2\.)'
replacement3 = r'''#### 6.1. Test Integration (when UI changes occur)

**LOAD MODULE:** `.github/prompts/shared/task-exec/test-integration-protocol.md`

Invoke test-generation.prompt.md when UI changes, API endpoint changes, user interaction flows, or visual regressions detected.

**Test Location:** `.github/key-data-streams/{key}/tests/`  
**Execution:** Via orchestration scripts ONLY (external PowerShell window)  
**Cleanup:** Tests promoted to production after Step 9.2

#### 6.2.'''
content = re.sub(pattern3, replacement3, content)
print("  ✓ Test Integration section replaced")

# Replacement 4: Step 6.2 & 6.3 - Lint Validation & Constraint Verification
pattern4 = r'(?s)(#### 6\.2\. Mandatory Lint Validation \(ALL Modified Files\))(.*?)(---\s+### Step 7: Confirm)'
replacement4 = r'''#### 6.2. Mandatory Lint Validation (ALL Modified Files)

**LOAD MODULE:** `.github/prompts/shared/task-exec/ui-execution-requirements.md` (Section: Mandatory Lint Validation)

**CRITICAL:** MANDATORY before any commit. Lint failures BLOCK commit creation.

**Linters by Type:** C# (Roslynator), JS/TS (ESLint), CSS (Stylelint), PowerShell (PSScriptAnalyzer), JSON (syntax + Prettier)

#### 6.3. High-Priority Constraint Verification

**LOAD MODULE:** `.github/prompts/shared/task-exec/ui-execution-requirements.md` (Section: High-Priority Constraint Verification)

**CRITICAL:** Verify ALL CAPS constraints from user request before marking work complete.

**Violation Protocol:** HALT → Rollback → Return to Step 3 for re-planning

---

### Step 7: Confirm'''
content = re.sub(pattern4, replacement4, content)
print("  ✓ Lint Validation & Constraint Verification sections replaced")

# Replacement 5: Step 7 - Confirm
pattern5 = r'(?s)(### Step 7: Confirm)(.*?)(---\s+### Step 8: Update Key Data Stream)'
replacement5 = r'''### Step 7: Confirm

**LOAD MODULE:** `.github/prompts/shared/task-exec/validation-and-response.md`

Provide summary based on `verbosity` parameter (concise/detailed).

**BLOCKER VALIDATION (Execute BEFORE summary):** Ensure documentation completeness - work-log.md must contain all required sections.

**Summary Includes:** Status, work done, files modified, debug logging, tests, build, lint validation, high-priority constraints, approval iterations, checkpoint

---

### Step 8: Update Key Data Stream'''
content = re.sub(pattern5, replacement5, content)
print("  ✓ Step 7 Confirm section replaced")

# Replacement 6: Step 8 - Update Key Data Stream
pattern6 = r'(?s)(### Step 8: Update Key Data Stream \(MANDATORY\))(.*?)(---\s+### Step 9: Completion Workflow)'
replacement6 = r'''### Step 8: Update Key Data Stream (MANDATORY)

**LOAD MODULE:** `.github/prompts/shared/task-exec/completion-workflow.md`

**CRITICAL:** ALL task completions MUST update the key data stream.

**Key Steps:**
- **8.0:** Auto-Chain Protocol (if auto-chain=true)
- **8.1:** Update JSON Tracking (if plan exists)
- **8.2:** Key Data Stream Bloat Detection
- **8.3:** Key Data Stream Update Requirements (COMPREHENSIVE DOCUMENTATION)
- **8.25:** File Finalization Verification (BLOCKING - verify work-log.md updated)
- **8.6:** Response Validation (MANDATORY - CONCISE-MANDATE enforcement)
- **8.5:** Checkpoint Commit & Tag (MANDATORY - create git tag)

**Guardrail:** Lock detection - HALT if `.github/key-data-streams/**/{key}.lock` exists

---

### Step 9: Completion Workflow'''
content = re.sub(pattern6, replacement6, content)
print("  ✓ Step 8 Update Key Data Stream section replaced")

# Replacement 7: Step 9 - Completion Workflow
pattern7 = r'(?s)(### Step 9: Completion Workflow \*\(Conditional.*?\)\*)(.*?)(---\s+## Guardrails)'
replacement7 = r'''### Step 9: Completion Workflow *(Conditional: When tasks = "mark complete" or "completed")*

**LOAD MODULE:** `.github/prompts/shared/task-exec/completion-workflow.md` (Section: Step 9)

**Triggered when:** User specifies `tasks = "mark complete"` or `tasks = "completed"`

**Workflow:**
- **9.1:** Obsolete Information Removal & Debug Cleanup (remove all debug markers)
- **9.2:** Test Promotion & Cleanup (promote passing tests to production, delete from key directory)
- **9.3:** State Management & Completion (mark key as `complete`)
- **9.4:** Resumption Protocol (auto-revert to `in-progress` if new tasks arrive)

---

## Guardrails'''
content = re.sub(pattern7, replacement7, content)
print("  ✓ Step 9 Completion Workflow section replaced")

print("\nWriting refactored file...")
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

# Calculate statistics
original_lines = open(source_file, 'r', encoding='utf-8').read().count('\n')
refactored_lines = content.count('\n')
reduction = round(((original_lines - refactored_lines) / original_lines) * 100, 1)

print(f"\n✅ Refactoring complete!")
print(f"Original file: {original_lines} lines")
print(f"Refactored file: {refactored_lines} lines")
print(f"Reduction: {reduction}% ({original_lines - refactored_lines} lines removed)")
print(f"\nRefactored file saved to: {output_file}")
print(f"\nTo apply: Copy {output_file} over {source_file}")
