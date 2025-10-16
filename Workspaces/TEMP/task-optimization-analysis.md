# Prompt Optimization Analysis: task.prompt.md# Prompt Optimization Analysis: task



**Analysis Date:** 2025-10-16T12:15:00Z  **Date:** 2025-10-14T00:00:00Z  

**Analyzer:** healthcheck agent (Prompt Optimization Mode)  **Prompt File:** .github/prompts/task.prompt.md  

**Target:** `.github/prompts/task.prompt.md`  **Current Size:** 723 lines  

**Original Size:** 747 lines**Shared Library:** 2064 lines across 11 files (already extracted)



------



## Executive Summary## Executive Summary



task.prompt.md is a **well-structured, modular prompt** with excellent use of shared library references. However, analysis reveals **duplicate content, inconsistent example formatting, and an obsolete checkpoint log section** that should be removed after the recent git tag migration.The task.prompt.md file is **already significantly optimized** (v3.0) with extensive shared library extraction. However, there are still opportunities for:

- **Bloat Reduction:** ~15% (108 lines) via examples, redundancy, duplicate mandates

**Overall Health:** ⚠️ **Good with Minor Bloat** (85/100)- **Structural Improvements:** Clearer conditional execution flow, reduced cognitive load

- **Minor Competing Instructions:** Step numbering inconsistencies (Step 2.8.7 referenced but not explicitly numbered)

**Optimization Potential:** ~8% reduction (60 lines) through cleanup

---

---

## Critical Issues Identified

## Critical Issues Identified

### 1. Competing Instructions & Conflicts

### A. Competing Instructions & Conflicts

**Issue 1.1: Step Numbering Inconsistencies**

#### Issue A.1: Checkpoint Format Inconsistency ⚠️ MEDIUM- **Location:** Lines 247-250, 365, 623, 675-678, 688

**Location:** Step 8.4, lines 554-640- **Problem:** References to "Step 2.8.7" (Data Lifecycle Validation) appear throughout the file, but Section 2.8 doesn't have explicit sub-numbering for step 7

- **Impact:** AI parsing may struggle to locate "Step 2.8.7" since it's embedded within Step 2.8 without clear delineation

**Problem:**- **Recommendation:** Either:

- Line 573: States format as `checkpoint/{key}/{ISO-8601-date-compact}`  1. Add explicit `#### 2.8.7. Data Lifecycle Validation (CRUD Operations)` heading in Step 2.8

- Line 574: Example shows `checkpoint/canvas/2025-10-16_0230`  2. OR change all references to "Step 2.8 (Data Lifecycle Validation)" for clarity

- Line 575: States format as `checkpoint/{key}/{YYYY-MM-DD_HHMM}`

- Line 600: Example shows `checkpoint/canvas/2025-10-16T02:30:00Z` (with colons and `T` separator - **INVALID**)**Issue 1.2: Duplicate "ALWAYS" Mandates**

- **Location:** Lines 622-628 (Guardrails section)

**Impact:** Agents may generate invalid git tags (colons not allowed in tag names)- **Problem:** Same mandates repeated with identical wording:

  - Line 622 appears twice: "ALWAYS query key data stream before planning (Step 2 is mandatory)"

**Recommendation:**  - Line 624 appears twice: "ALWAYS include persistence tests (page refresh after mutation is mandatory)"

```markdown  - Line 625 appears twice: "ALWAYS update key data stream after execution (Step 8 is mandatory)"

3. **Create lightweight git tag:**- **Impact:** Appears as copy/paste error, reduces credibility

   ```bash- **Recommendation:** Deduplicate to single instance of each mandate

   git tag "checkpoint/{key}/{YYYY-MM-DD_HHMM}"

   ```**Issue 1.3: "MANDATORY" Overuse**

   - Example: `git tag "checkpoint/canvas/2025-10-16_0230"`- **Location:** 34 instances across entire file

   - Format: `checkpoint/{key}/{YYYY-MM-DD_HHMM}` (no colons - git tag requirement)- **Problem:** When everything is MANDATORY, nothing is. Dilutes actual critical requirements.

```- **Impact:** Cognitive fatigue, reduced attention to truly critical steps

- **Recommendation:** Reserve MANDATORY for true failure conditions (checkpoints, approvals, validations). Use "Required" or "Standard" for normal workflow steps.

---

---

#### Issue A.2: Obsolete Checkpoint Log Section ⚠️ HIGH

**Location:** Lines 630-640### 2. Bloat & Inefficiencies



**Problem:****Issue 2.1: Inline Approval Example (Step 4)**

Section titled "Example Checkpoint Log (`.github/prompts.keys/.checkpoints/canvas.log`):" contains example of **OLD log file approach that was REPLACED by git tags**.- **Location:** Lines 380-398 (19 lines)

- **Size:** 19 lines of example early warning message

**Evidence:**- **Recommendation:** Extract to `shared/approval-templates.md` with templates for:

- Task.prompt.md was updated to use git tags instead of log files (commit: b42fab11)  - Incomplete data lifecycle warning

- `.github/prompts.keys/.checkpoints/` directory was **deleted** (replaced by git tags)  - Framework validation warnings

- This section contradicts the git tag approach documented immediately above it  - Architecture violation warnings

- **Savings:** ~15 lines (reduce to 4-line reference)

**Impact:**

- Agents may try to create checkpoint log files (which no longer exist)**Issue 2.2: Debug Marker Patterns (Multiple Locations)**

- Confusion about which checkpoint approach to use- **Location:** Lines 59-67 (9 lines), Lines 693-702 (10 lines)

- Duplicate documentation of superseded implementation- **Problem:** Debug marker patterns defined twice (parameter section + diagnostic mode section)

- **Recommendation:** Consolidate into single reference to `shared/debug-logging-mandate.md`

**Recommendation:** **DELETE lines 630-640 entirely**- **Savings:** ~15 lines



---**Issue 2.3: Lifecycle State Management (Step 9.4-9.5)**

- **Location:** Lines 603-613 (11 lines)

### B. Bloat & Inefficiencies- **Size:** State management and resumption protocol

- **Recommendation:** Extract to `shared/key-lifecycle-management.md` (covers completion, archival, resumption)

#### Issue B.1: Excessive Inline Examples in Step 4 ⚠️ MEDIUM- **Savings:** ~8 lines (reduce to 3-line reference)

**Location:** Lines 335-409 (75 lines of examples)

**Issue 2.4: Verbose Diagnostic Mode Details Section**

**Problem:**- **Location:** Lines 693-724 (32 lines)

Step 4 (Approval) contains 4 complete scenario examples with full dialogue trees. While helpful, this represents **10% of the entire prompt** for a single concept.- **Problem:** Entire section duplicates content already in `shared/debug-logging-mandate.md`

- **Recommendation:** Replace entire section with single reference: `**See:** shared/debug-logging-mandate.md for complete diagnostic mode patterns`

**Current Size:** 75 lines of examples  - **Savings:** ~30 lines

**Optimal Size:** 30-40 lines (focused examples)

**Issue 2.5: Validation Framework Shortcuts (Step 6)**

**Recommendation:**- **Location:** Lines 434-440 (7 lines)

- Keep Scenario 1 (Immediate Approval) and Scenario 2 (Single Iteration) as inline examples- **Problem:** Explains ValidationFramework.md shortcuts inline

- Extract Scenarios 3-4 to `shared/approval-iteration-examples.md`- **Recommendation:** Reference `ValidationFramework.md` directly with single-line note about shortcuts

- Reference: `**See:** shared/approval-iteration-examples.md for multiple iteration scenarios`- **Savings:** ~5 lines



**Estimated Reduction:** 35 lines**Issue 2.6: Clean Exit Guarantee Section**

- **Location:** Lines 637-647 (11 lines)

---- **Problem:** Standard across all agent prompts, should be in shared library

- **Recommendation:** Extract to `shared/clean-exit-guarantee.md` (reusable across all agents)

#### Issue B.2: Duplicate Branch Strategy Documentation ⚠️ LOW- **Savings:** ~9 lines (reduce to 1-line reference)

**Location:** Lines 118-143 (Step 0)

**Issue 2.7: Lessons Learned Section Length**

**Problem:**- **Location:** Lines 652-691 (40 lines)

Complete branch strategy is documented inline, but `SelfAwareness.instructions.md` already contains this (lines 8-49 of that file).- **Problem:** Detailed bug postmortem valuable but bloats prompt

- **Recommendation:** Move to `Docs/LESSONS-LEARNED.md` or `.github/learning/task-agent-lessons.md`, reference in 3-4 lines

**Current Approach:**- **Savings:** ~36 lines

- 26 lines of branch strategy in task.prompt.md

- Full branch strategy in SelfAwareness.instructions.md (referenced on line 141)---



**Recommendation:**### 3. Structural Inefficiencies

Condense to brief checklist with reference:

```markdown**Issue 3.1: Step 2 Sub-Phase Overload**

### Step 0: Branch Verification (MANDATORY)- **Problem:** Step 2 has 10 sub-phases (2.1-2.10), each with conditional execution

- **Size:** Lines 209-356 (148 lines = 20% of entire prompt)

**Verify you're in the correct branch before starting work.**- **Impact:** Extremely high cognitive load for AI parsing

- **Recommendation:** Extract Step 2 sub-phases to `shared/context-gathering-phases.md` with decision tree diagram

```bash- **Result:** Step 2 becomes 15-line overview with reference to shared file

git branch --show-current  # Expected: development- **Savings:** ~130 lines

```

**Issue 3.2: Parameter Documentation Verbosity**

**If on wrong branch:** `git checkout development`- **Location:** Lines 12-104 (93 lines)

- **Problem:** Parameter definitions are very detailed with inline examples and nested explanations

**ABORT if on `master` branch** - all development work happens in `development`.- **Recommendation:** Extract to `shared/task-parameters-reference.md`, keep only parameter names and 1-line descriptions in main prompt

- **Savings:** ~70 lines (reduce to ~23-line concise parameter table)

**See:** `.github/instructions/SelfAwareness.instructions.md` - Branch Strategy section for complete workflow

```**Issue 3.3: Missing Conditional Execution Decision Tree**

- **Problem:** Step 2 routing logic (2.4 → 2.5/2.6/2.7/2.8) not visually clear

**Estimated Reduction:** 15 lines- **Impact:** AI may execute all phases instead of following conditional routing

- **Recommendation:** Add ASCII decision tree in `shared/execution-flow.md` showing:

---  - When to execute each sub-phase

  - Skip conditions for each path

### C. Structural Inefficiencies  - Terminal conditions (abort vs continue)



#### Issue C.1: Missing Visual Flow Diagram Reference ⚠️ LOW---

**Location:** Line 116

### 4. Missing Critical Guardrails

**Problem:**

Line 116 states: `**See:** shared/execution-flow.md for complete visual flow diagram`**Issue 4.1: No Token Budget Enforcement**

- **Risk:** Task agent can spend unlimited tokens on deep context gathering (Step 2 has 10 phases)

**Validation:** File `shared/execution-flow.md` does NOT exist in workspace.- **Recommendation:** Add token budget check:

  - If Step 2 context gathering exceeds 50K tokens → request user approval for deep dive

**Impact:** Broken reference, agents cannot access visual flow diagram  - Log token usage per sub-phase for optimization tracking



**Recommendation:****Issue 4.2: No Circular Reference Protection (Step 2.8)**

- Either create `shared/execution-flow.md` with ASCII diagram of Steps 0-9- **Risk:** Architecture analysis (Step 2.8) could discover circular dependencies but has no explicit abort condition

- OR remove the reference if visual diagram not needed- **Recommendation:** Add explicit guardrail:

  - If circular dependency detected → HALT and request user resolution

---  - Do not proceed with implementation until resolved



#### Issue C.2: Inconsistent "See" Reference Formatting ⚠️ LOW**Issue 4.3: No Step 2 Phase Timeout**

**Location:** Throughout file- **Risk:** AI could get stuck in Step 2.6 (pattern matching) or Step 2.8 (architecture analysis) with infinite recursion

- **Recommendation:** Add timeout guardrail:

**Problem:**  - Step 2 total execution time limit: 5 minutes

Inconsistent path formats for shared library references:  - If exceeded → log diagnostic, request user intervention



- Line 14: `` `.github/prompts/shared/task-parameters-reference.md` ``**Issue 4.4: Missing Key Data Stream Lock Detection**

- Line 92: `` `InfrastructureQuickRef.md` `` (missing path)- **Risk:** Concurrent edits to same key by multiple agents or manual edits during task execution

- Line 103: `task.prompt.md attachment` (wrong reference style)- **Recommendation:** Add lock file check:

- Line 116: `` `shared/execution-flow.md` `` (relative path)  - Before Step 8 update → verify no `.github/prompts.keys/{key}.lock` file exists

- Line 141: `` `SelfAwareness.instructions.md` `` (missing path)  - If exists → HALT, display lock owner, request resolution



**Recommendation:** Standardize all references to absolute paths from repo root:---

```markdown

**See:** `.github/instructions/SelfAwareness.instructions.md`## Optimization Recommendations

**See:** `.github/instructions/Links/InfrastructureQuickRef.md`

**See:** `.github/prompts/shared/execution-flow.md`### Quick Wins (Immediate Implementation - 30 minutes)

```

1. **Deduplicate Guardrails Section** → 3 minutes, -6 lines

---   - Remove duplicate "ALWAYS" statements (lines 622, 624, 625)



### D. Prompt-Specific Issues2. **Fix Step 2.8.7 Numbering** → 5 minutes, +1 line, +100% clarity

   - Add explicit `#### 2.8.7. Data Lifecycle Validation (CRUD)` heading

#### Issue D.1: Step 8.4 Rollback Example Uses Invalid Tag Format ⚠️ HIGH

**Location:** Lines 600-6023. **Replace Diagnostic Mode Section with Reference** → 5 minutes, -30 lines

   - Lines 693-724 → Single line: `**See:** shared/debug-logging-mandate.md`

**Problem:**

```markdown4. **Consolidate Debug Marker Patterns** → 5 minutes, -15 lines

**Rollback to specific checkpoint:**   - Remove duplicate definitions, single reference to shared file

```bash

git reset --hard {tag-name}5. **Extract Clean Exit Guarantee** → 10 minutes, -9 lines

# Example: git reset --hard checkpoint/canvas/2025-10-16T02:30:00Z   - Create `shared/clean-exit-guarantee.md`, reference in all agent prompts

```

```**Total Quick Wins: 30 minutes, -59 lines (8% reduction)**



**Issue:** Example uses `T` separator and colons (`:`) which are **invalid in git tag names**.---



**Correct Example:**### Medium-Term Refactoring (1-2 hours)

```bash

# Example: git reset --hard checkpoint/canvas/2025-10-16_02301. **Extract Step 2 Sub-Phases** → 1 hour, -130 lines

```   - Create `shared/context-gathering-phases.md` with all 10 sub-phases

   - Main prompt keeps 15-line overview with routing logic

---   - Add decision tree diagram



#### Issue D.2: Step 2 Guardrails Token Budget Not Enforced ⚠️ MEDIUM2. **Extract Parameter Reference** → 30 minutes, -70 lines

**Location:** Lines 211-213   - Create `shared/task-parameters-reference.md`

   - Main prompt keeps concise parameter table (23 lines)

**Guardrail Stated:**

> 1. **Token Budget Protection:** If Step 2 context gathering exceeds 50,000 tokens → HALT and request user approval before proceeding (prevents context overflow)3. **Extract Approval Templates** → 20 minutes, -15 lines

   - Create `shared/approval-templates.md` with warning message templates

**Issue:** No implementation guidance on HOW agent should count tokens or enforce this limit.   - Reference in Step 4



**Recommendation:** Add implementation note:4. **Move Lessons Learned to Docs** → 10 minutes, -36 lines

```markdown   - Move to `.github/learning/task-agent-lessons.md`

**Implementation:** Agent must track cumulative token count across all Step 2 sub-phases. If approaching 50K tokens, emit warning and request user approval to continue or skip remaining phases.   - Add 3-line summary in main prompt

```

5. **Extract Key Lifecycle Management** → 15 minutes, -8 lines

---   - Create `shared/key-lifecycle-management.md`

   - Cover completion, archival, resumption protocols

## Summary Metrics

**Total Medium-Term: 2.25 hours, -259 lines (36% reduction)**

| Metric | Current | Target | Improvement |

|--------|---------|--------|-------------|---

| **Total Lines** | 747 | ~687 | -60 lines (-8%) |

| **Inline Examples** | 75 lines | 40 lines | -35 lines |### Structural Improvements

| **Duplicate Content** | 26 lines | 10 lines | -16 lines |

| **Obsolete Sections** | 10 lines | 0 lines | -10 lines |1. **Add Conditional Execution Decision Tree** → 45 minutes

| **Broken References** | 3 | 0 | -3 |   - Enhance `shared/execution-flow.md` with ASCII decision tree

| **Format Inconsistencies** | 6 locations | 0 | -6 |   - Show routing logic for Step 2.4 → 2.5/2.6/2.7/2.8

   - Add skip conditions for each path

---

2. **Add Critical Guardrails** → 30 minutes

## Optimization Recommendations   - Token budget enforcement (Step 2)

   - Circular dependency detection (Step 2.8)

### Priority: HIGH (Immediate Action Required)   - Phase timeout protection

   - Key data stream lock detection

1. **Delete Obsolete Checkpoint Log Section** (Lines 630-640)

   - **Reason:** Contradicts current git tag implementation3. **Reduce MANDATORY Overuse** → 20 minutes

   - **Impact:** 10 lines removed   - Audit all 34 instances

   - **Risk:** Low - section is obsolete   - Replace with "Required", "Standard", "Critical" based on actual severity

   - Reserve MANDATORY for true failure conditions only

2. **Fix Invalid Tag Format in Examples** (Lines 574, 600-602)

   - **Reason:** Examples show invalid git tag format (with colons)**Total Structural: 1.5 hours, +clarity/safety**

   - **Impact:** Prevents agent errors

   - **Risk:** None - corrects errors---



3. **Fix Broken `execution-flow.md` Reference** (Line 116)## Priority Actions

   - **Option A:** Create the file with ASCII diagram

   - **Option B:** Remove the reference### High Priority (Do First)

   - **Impact:** Eliminates broken link

   - **Risk:** None1. ✅ **Fix Step 2.8.7 Numbering** - Eliminates ambiguity in critical CRUD validation step

2. ✅ **Deduplicate Guardrails** - Removes copy/paste errors, improves credibility

---3. ✅ **Replace Diagnostic Mode Section** - Immediate -30 lines with zero risk



### Priority: MEDIUM (Recommended for Next Update)### Medium Priority (Do Next)



4. **Extract Excessive Examples to Shared Library** (Lines 360-409)1. **Extract Step 2 Sub-Phases** - Largest line savings (130 lines), improves readability

   - **Action:** Move Scenarios 3-4 to `shared/approval-iteration-examples.md`2. **Extract Parameter Reference** - 70 line reduction, improves scanability

   - **Impact:** 35 lines removed from main prompt3. **Add Critical Guardrails** - Prevents failure modes (circular refs, token overflow)

   - **Risk:** Low - improves readability

### Low Priority (Optional)

5. **Condense Branch Strategy** (Lines 118-143)

   - **Action:** Replace with brief checklist + reference to SelfAwareness.instructions.md1. **Move Lessons Learned to Docs** - Nice to have, moderate savings

   - **Impact:** 16 lines removed2. **Extract Approval Templates** - Minor optimization

   - **Risk:** Low - full docs still available via reference3. **Reduce MANDATORY Overuse** - Style improvement, not functional



6. **Standardize "See" Reference Paths**---

   - **Action:** Use absolute paths from repo root for all references

   - **Impact:** Consistency, easier navigation## Summary Metrics

   - **Risk:** None

| Metric | Current | After Quick Wins | After Full Optimization | Improvement |

---|--------|---------|------------------|-------------------------|-------------|

| **Total Lines** | 723 | 664 | 464 | -36% |

### Priority: LOW (Nice to Have)| **Duplicate Sections** | 3 | 0 | 0 | -100% |

| **Competing Instructions** | 2 | 0 | 0 | -100% |

7. **Add Token Budget Implementation Guidance** (Line 211)| **External References** | 11 | 14 | 20 | +82% modularity |

   - **Action:** Add implementation note for 50K token limit enforcement| **Avg Section Length** | 80 lines | 74 lines | 52 lines | -35% cognitive load |

   - **Impact:** Clearer guidance for agents| **MANDATORY Count** | 34 | 34 | 12 | -65% dilution |

   - **Risk:** None| **Step 2 Length** | 148 lines | 148 lines | 18 lines | -88% |



------



## Recommended Approach## Recommended Approach



### Phase 1: Critical Fixes (15 minutes)### Phase 1: Quick Wins (30 minutes)

1. Delete obsolete checkpoint log example section (lines 630-640)1. Deduplicate Guardrails section

2. Fix invalid tag format in all examples2. Fix Step 2.8.7 numbering (add explicit heading)

3. Fix or remove broken execution-flow.md reference3. Replace Diagnostic Mode section with reference to shared file

4. Standardize all "See" reference paths4. Consolidate debug marker patterns

5. Extract Clean Exit Guarantee to shared library

**Outcome:** Zero competing instructions, zero broken references

**Result:** -59 lines (8% reduction), zero risk, immediate clarity improvement

---

---

### Phase 2: Bloat Reduction (30 minutes)

1. Extract Scenarios 3-4 from Step 4 to `shared/approval-iteration-examples.md`### Phase 2: Extract Step 2 (1 hour)

2. Condense Step 0 branch strategy to brief checklist1. Create `shared/context-gathering-phases.md`

3. Add token budget implementation guidance2. Move all 10 sub-phases (2.1-2.10) with full details

3. Keep 15-line overview in main prompt with routing logic

**Outcome:** ~50 lines removed, improved maintainability4. Add ASCII decision tree showing conditional execution paths

5. Test AI parsing with sample task invocation

---

**Result:** -130 lines (18% additional reduction), dramatically improved readability

### Phase 3: Validation (10 minutes)

1. Verify all "See" references resolve correctly---

2. Test sample task invocation with optimized prompt

3. Confirm no functionality lost### Phase 3: Extract Parameters & Cleanup (1 hour)

4. Generate before/after metrics1. Create `shared/task-parameters-reference.md`

2. Move detailed parameter documentation

**Outcome:** 100% backward compatible, verified functional3. Extract approval templates to shared library

4. Move Lessons Learned to `.github/learning/`

---5. Extract key lifecycle management



## Files to Create**Result:** -129 lines (18% additional reduction), improved scanability



1. **`.github/prompts/shared/approval-iteration-examples.md`** (~40 lines)---

   - Scenarios 3-4 from Step 4

   - Additional edge cases (user provides contradictory requirements, etc.)### Phase 4: Add Guardrails (30 minutes)

1. Token budget enforcement

---2. Circular dependency detection

3. Phase timeout protection

## Estimated Total Time: 55 minutes4. Key data stream lock detection

5. Reduce MANDATORY overuse (audit 34 instances → 12 critical)

---

**Result:** +safety, +resilience, improved clarity

## Post-Optimization Predictions

---

| Metric | Before | After | Change |

|--------|--------|-------|--------|## Total Expected Outcome

| **Total Lines** | 747 | 687 | -60 (-8%) |

| **Competing Instructions** | 2 | 0 | -2 |**Time Investment:** 3-3.5 hours  

| **Broken References** | 1 | 0 | -1 |**Line Reduction:** 259 lines (-36%)  

| **Format Inconsistencies** | 6 | 0 | -6 |**Shared Library Files Created:** 6 new files  

| **Inline Example Bloat** | 75 lines | 40 lines | -35 |**Modularity Improvement:** +82% (20 external references vs 11)  

| **Shared Library Files** | 12 | 13 | +1 |**Cognitive Load Reduction:** -35% (avg section length 52 vs 80 lines)  

| **Maintainability Score** | 85/100 | 95/100 | +10 |**Safety Improvement:** 4 new critical guardrails added  



---**Final Size:** 464 lines (core) + 2323 lines (shared library) = 2787 total  

**vs Current:** 723 lines (core) + 2064 lines (shared) = 2787 total  

## Validation Checklist

**Result:** Same total size, but **much better organized** with:

After optimization, verify:- Clearer execution flow

- Reduced cognitive load per section

- [ ] All "See" references resolve to existing files- Improved modularity and reusability

- [ ] No duplicate content between main prompt and shared library- Better safety guardrails

- [ ] Git tag examples use valid format (no colons, no `T` separator)- Easier to maintain and update

- [ ] Obsolete checkpoint log section removed

- [ ] Sample task invocation works identically---

- [ ] Line count reduced by ~60 lines

- [ ] Build passes with zero errors/warnings## Backward Compatibility



---**Risk Assessment:** LOW



## NotesAll optimizations are structural reorganization, not functional changes:

- ✅ No parameter changes

- **task.prompt.md is already well-optimized** - most content is essential- ✅ No step sequence changes

- Primary gains come from removing obsolete content and extracting verbose examples- ✅ No workflow logic changes

- Shared library usage is **excellent** (12 external references)- ✅ All content preserved, just moved to shared library

- Core execution flow (Steps 0-9) is clear and well-documented- ✅ All references resolve correctly

- No major structural changes needed

**Validation Strategy:**

---1. Test with sample task invocation before/after optimization

2. Verify all `**See:** shared/*` references resolve

## Conclusion3. Confirm AI parsing produces identical execution plan

4. Compare output quality (concise vs detailed mode)

task.prompt.md is a **high-quality prompt** with minor optimization opportunities. The primary issues are:

---

1. ✅ Obsolete checkpoint log section (legacy from old approach)

2. ✅ Invalid git tag format in examples (technical error)## Files to Create

3. ✅ Excessive inline examples that could move to shared library

4. ✅ Inconsistent reference formatting### New Shared Library Files

1. `shared/context-gathering-phases.md` - All Step 2 sub-phases (2.1-2.10)

**Recommended Action:** Proceed with **Phase 1 (Critical Fixes)** immediately. Phase 2 (Bloat Reduction) optional but recommended for long-term maintainability.2. `shared/task-parameters-reference.md` - Detailed parameter documentation

3. `shared/approval-templates.md` - Warning message templates for Step 4

**Risk Assessment:** ⚠️ **LOW** - All proposed changes are non-breaking and preserve functionality.4. `shared/key-lifecycle-management.md` - Completion, archival, resumption

5. `shared/clean-exit-guarantee.md` - Standard exit guarantee (all agents)

---6. `.github/learning/task-agent-lessons.md` - Bug postmortems and lessons



**End of Analysis**### Files to Update

1. `task.prompt.md` - Main prompt (723 → 464 lines)
2. `shared/execution-flow.md` - Add conditional decision tree
3. `shared/debug-logging-mandate.md` - Ensure complete diagnostic patterns

---

## Next Steps

**Awaiting User Approval:**

Proceed with optimization in phases?

**Option A:** Execute all phases (3-3.5 hours, -36% lines)  
**Option B:** Quick wins only (30 minutes, -8% lines)  
**Option C:** Custom selection (specify phases to execute)  
**Option D:** Decline optimization (save analysis for future reference)

Please confirm your preference.
