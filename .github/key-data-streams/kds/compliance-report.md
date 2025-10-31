# MANDATORY.md Rule #1 Compliance Report
**Key: `kds`** | **Phase**: 0/10 (Pre-Flight Audit)  
**Generated**: 2025-10-31  
**Scope**: All `.github/prompts/*.prompt.md` files

---

## 🎯 Executive Summary

**Total Violations Found**: 161 code blocks (excluding duplicates)  
**Files Affected**: 11 prompts  
**Rule Violated**: MANDATORY.md Rule #1 (Concise Output Format - No code in chat)  
**Severity Distribution**:
- 🔴 **Critical (40+ violations)**: test-generation.prompt.md (41 blocks)
- 🟠 **High (20-39 violations)**: plan.prompt.md (17 blocks), healthcheck.prompt.md (13 blocks)
- 🟡 **Medium (10-19 violations)**: task.prompt.md (18 blocks), cohesion.prompt.md (14 blocks), drift.prompt.md (10 blocks)
- 🟢 **Low (<10 violations)**: route.prompt.md (6 blocks), ask.prompt.md (8 blocks), todo.prompt.md (6 blocks), collapse-keys.prompt.md (2 blocks)

---

## 📊 Violation Catalog (By File)

### 1️⃣ test-generation.prompt.md (41 violations) 🔴 CRITICAL
**Lines**: 65, 153, 182, 197, 244, 383, 544, 736, 745, 768, 793, 818, 840, 901, 1067, 1074, 1191, 1349, 1430, 1525, 1539, 1582, 1614, 1686, 1695, 1707, 1711, 1725, 1768, 1789, 1803, 1823, 1863, 1884, 1911, 1922, 2012, 2086, 2238, 2305, 2318, 2344, 2488

**Block Types**:
- ```markdown (10 blocks) - Output Format templates
- ```powershell (9 blocks) - Orchestration examples
- ```typescript (15 blocks) - Test code examples
- ```csharp (3 blocks) - C# configuration examples (lines 1789, 1803, 1823)
- ```bash (2 blocks) - Command examples
- ```json (2 blocks) - Config examples

**Fix Strategy**: 
- Move TypeScript/C# code examples to `.github/prompts/shared/test-examples/` reference docs
- Replace PowerShell blocks with prose descriptions of orchestration patterns
- Convert markdown templates to architectural descriptions
- Estimated time: 25-30 minutes

---

### 2️⃣ task.prompt.md (18 violations) 🟡 MEDIUM
**Lines**: 49, 66, 326, 352, 398, 446, 478, 488, 579, 603, 649, 733, 767, 1031, 1053, 1063, 1134, 1197, 1220

**Block Types**:
- ```powershell (6 blocks) - Branch validation, state tracking
- ```bash (4 blocks) - Quick Start examples
- ```markdown (4 blocks) - Output Format templates
- ```json (2 blocks) - Handoff JSON structures
- ```sql (2 blocks) - Database query examples (lines 1063, 1134)

**Fix Strategy**:
- Replace SQL blocks with prose descriptions (Canvas cleanup, session truncation)
- Convert PowerShell to algorithmic prose
- Replace bash commands with natural language instructions
- Estimated time: 10-12 minutes

---

### 3️⃣ plan.prompt.md (17 violations) 🟠 HIGH
**Lines**: 122, 162, 455, 468, 511, 540, 562, 576, 600, 625, 706, 720, 795, 956, 998, 1050, 1119

**Block Types**:
- ```markdown (8 blocks) - Output Format templates
- ```json (6 blocks) - Handoff JSON schemas (phase-{N}-test.json, phase-{N}-todo.json)
- ```powershell (3 blocks) - State tracking examples

**Fix Strategy**:
- Replace JSON schemas with prose descriptions + reference to shared/kds-handoff-protocol.md
- Convert markdown templates to architectural descriptions
- Replace PowerShell with algorithmic prose
- **NOTE**: Lines 289-293, 663-674 contain IF/FOR EACH pseudocode (≤7 lines, borderline acceptable per MANDATORY.md Rule #1 "brief" allowance)
- Estimated time: 12-15 minutes

---

### 4️⃣ cohesion.prompt.md (14 violations) 🟡 MEDIUM
**Lines**: 54, 78, 93, 107, 141, 156, 289, 1442, 1535, 1689, 1694, 1699, 1704

**Block Types**:
- ```bash (9 blocks) - File navigation examples (grep, find, ls commands)
- ```markdown (2 blocks) - Output Format templates
- ```powershell (1 block) - Cohesion score calculation

**Fix Strategy**:
- Replace bash commands with prose descriptions of exploration patterns
- Convert markdown templates to architectural descriptions
- Replace PowerShell with algorithmic prose
- Estimated time: 8-10 minutes

---

### 5️⃣ healthcheck.prompt.md (13 violations) 🟠 HIGH
**Lines**: 204, 218, 451, 782, 809, 847, 882, 928, 974, 1092, 1127, 1290, 1481, 1533

**Block Types**:
- ```powershell (8 blocks) - Validation scripts (guard checks, path verification, git status)
- ```markdown (4 blocks) - Output Format templates
- ```bash (1 block) - Quick Start example

**Fix Strategy**:
- Replace PowerShell validation scripts with prose descriptions of checks
- Convert markdown templates to architectural descriptions
- Replace bash with natural language instructions
- Estimated time: 10-12 minutes

---

### 6️⃣ drift.prompt.md (10 violations) 🟡 MEDIUM
**Lines**: 76, 97, 182, 194, 233, 288, 301, 351, 379, 456

**Block Types**:
- ```markdown (5 blocks) - Output Format templates
- ```powershell (4 blocks) - Drift tracking, auto-fix examples
- ```bash (1 block) - Quick Start example

**Fix Strategy**:
- Replace PowerShell with prose descriptions of drift classification
- Convert markdown templates to architectural descriptions
- Replace bash with natural language instructions
- Estimated time: 6-8 minutes

---

### 7️⃣ ask.prompt.md (8 violations) 🟢 LOW
**Lines**: 70, 103 (reference only), 136, 155, 164, 194, 233, 405

**Block Types**:
- ```markdown (4 blocks) - Output Format templates
- ```powershell (2 blocks) - Next Command examples
- ```bash (1 block) - Quick Start example
- Line 103: Meta-reference to rule ("```csharp, ```js" mentioned in compliance checklist - NOT a violation)

**Fix Strategy**:
- Replace PowerShell/bash with prose descriptions
- Convert markdown templates to architectural descriptions
- Estimated time: 5-6 minutes

---

### 8️⃣ route.prompt.md (6 violations) 🟢 LOW
**Lines**: 37, 44, 51, 152, 277, 446

**Block Types**:
- ```bash (3 blocks) - Quick Start examples (lines 37, 44, 51)
- ```powershell (2 blocks) - State tracking (line 152), handoff example (line 446)
- ```markdown (1 block) - Output Format template (line 277)

**Fix Strategy**:
- Replace bash Quick Start with prose instructions
- Convert PowerShell to algorithmic prose
- Replace markdown template with architectural description
- **NOTE**: Lines 464-544 (Output Format section) ALREADY FIXED in Session 2 (4 ```markdown blocks removed)
- Estimated time: 4-5 minutes

---

### 9️⃣ todo.prompt.md (6 violations) 🟢 LOW
**Lines**: 47, 95, 133, 216, 451, 717

**Block Types**:
- ```powershell (2 blocks) - State tracking, checkpointing
- ```markdown (2 blocks) - Output Format templates
- ```bash (2 blocks) - Quick Start examples

**Fix Strategy**:
- Replace PowerShell/bash with prose descriptions
- Convert markdown templates to architectural descriptions
- **NOTE**: Lines 234-265 contain FUNCTION ClassifyWorkComplexity() pseudocode (31 lines - VIOLATES brief allowance, must delete)
- Estimated time: 5-6 minutes

---

### 🔟 collapse-keys.prompt.md (2 violations) 🟢 LOW
**Lines**: 243, 270

**Block Types**:
- ```markdown (2 blocks) - Output Format templates

**Fix Strategy**:
- Replace markdown templates with architectural descriptions
- Estimated time: 2-3 minutes

---

## 🔍 Pseudocode Violations (Separate Scan)

**Files with Multi-Line Pseudocode Blocks**:

### 1️⃣ todo.prompt.md (Lines 234-265) - 31 lines 🔴
```
FUNCTION ClassifyWorkComplexity(task)
  IF ... THEN
    ...
  ELSE IF ... THEN
    ...
  END IF
END FUNCTION
```
**Action**: Delete entire FUNCTION block, replace with 2-line prose description

### 2️⃣ plan.prompt.md (Lines 289-293, 663-674) - 7 lines each 🟡
**Lines 289-293**:
```
IF total_phases > 5 OR total_tasks > 20 THEN
  warn_about_scope_creep()
  suggest_splitting_into_multiple_keys()
END IF
```
**Lines 663-674**:
```
IF StateTrackingEnabled THEN
  verify_state_directory_exists()
END IF
FOR EACH file IN requiredFiles:
  IF NOT FileExists(file) THEN
    flag_as_blocking_dependency()
    suggest_creating_file_first()
  END IF
END FOR
```
**Action**: Borderline acceptable (≤7 lines each); recommend replacing with 1-2 line algorithmic prose to be safe

### 3️⃣ drift.prompt.md (Lines 154-164, 317-331) - 10 lines, 14 lines 🟠
**Lines 154-164** (Drift classification):
```
IF issue contains "build error|compilation failed|syntax error" THEN
  severity = "CRITICAL"
ELSE IF issue contains "test failure|regression|breaking change" THEN
  severity = "HIGH"
...
END IF
```
**Lines 317-331** (Auto-drift limit check):
```
IF autoDriftCount >= 10 THEN
  ...
  IF choice == A THEN PauseWork(), ShowDriftQueue()
  ...
END IF
```
**Action**: Replace with prose descriptions of classification algorithm

### 4️⃣ task.prompt.md (Lines 357-374) - 18 lines 🟠
```
IF $branchCheck.status == "BLOCKED" THEN
  ...
END IF
IF $branchCheck.status == "WARNING" THEN
  ...
END IF
```
**Action**: Replace with prose description of branch validation logic

---

## 📈 Compliance Score

**Current Compliance Rate**: 0% (161 violations across 11 files)  
**Target Compliance Rate**: 100% (0 violations)  
**Estimated Fix Time**: 90-105 minutes (Phase 2 budget: 60-75 min + buffer)

**Risk Assessment**:
- 🔴 **High Risk**: test-generation.prompt.md (41 blocks), plan.prompt.md (17 blocks)
- 🟡 **Medium Risk**: task.prompt.md (18 blocks), cohesion.prompt.md (14 blocks), healthcheck.prompt.md (13 blocks)
- 🟢 **Low Risk**: All other prompts (≤10 violations each)

---

## ✅ Next Steps (Phase 2)

1. **Task 2a** (Key: `kds`): Fix test-generation.prompt.md (41 blocks) - Create `.github/prompts/shared/test-examples/` for code samples
2. **Task 2b** (Key: `kds`): Fix plan.prompt.md (17 blocks) - Reference kds-handoff-protocol.md for JSON schemas
3. **Task 2c** (Key: `kds`): Fix task.prompt.md (18 blocks) - Replace SQL/PowerShell with prose
4. **Task 2d** (Key: `kds`): Fix cohesion.prompt.md (14 blocks) - Replace bash commands with exploration prose
5. **Task 2e** (Key: `kds`): Fix healthcheck.prompt.md (13 blocks) - Replace validation scripts with prose
6. **Task 2f** (Key: `kds`): Fix drift.prompt.md (10 blocks) - Replace classification logic with prose
7. **Task 2g** (Key: `kds`): Fix ask.prompt.md (8 blocks) - Quick fixes
8. **Task 2h** (Key: `kds`): Fix route.prompt.md (6 blocks) - Complete remaining violations from Session 2
9. **Task 2i** (Key: `kds`): Fix todo.prompt.md (6 blocks) + delete FUNCTION pseudocode
10. **Task 2j** (Key: `kds`): Fix collapse-keys.prompt.md (2 blocks) - Quick fixes
11. **Task 2k** (Key: `kds`): Re-run grep_search to validate ZERO violations
12. **Checkpoint Commit** (Key: `kds`): `fix(kds/compliance): Fix all MANDATORY.md Rule #1 violations`

---

**Key: `kds`** | **Status**: Phase 0 Complete ✅ | **Next**: Phase 2 (Code Violation Fixes)
