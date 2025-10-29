# Response Format Issue Analysis

**Key:** `prompt-enhancements`  
**Created:** 2025-10-29  
**Issue:** Copilot showed options (A/B/C/D) but did NOT show phase breakdown details before asking user to choose

---

## 🧠 Problem Identified

### What Happened in CopilotChats.md

**User asked for Option A:**
> asifhussain60: A

**Copilot's Previous Response:**
```markdown
## ⚡ Options

**A.** Execute Phase 1 now (file verification algorithm + prompt updates)  
**B.** Review detailed plan first (see prompt-enhancements.plan.md)  
**C.** Modify phase scope  
**D.** Cancel planning

Reply: A, B, C, or D
```

**Problem:** User couldn't make informed decision because:
1. ❌ No phase breakdown shown (what's in Phase 1?)
2. ❌ No task list shown (what tasks will execute?)
3. ❌ Only reference to "file verification algorithm + prompt updates" (too vague)
4. ❌ User forced to choose blind or select Option B to see details

---

## 📌 Root Cause Analysis

### Current Behavior (plan.prompt.md)

**Step 7.5: Response Validation** comes AFTER plan generation  
**Output Format Section** shows this structure:

```markdown
**📌 Plan Overview (≤10 bullets)**
1. **Phase 1:** {phase-title} - {file-count} files affected
2. **Phase 2:** {phase-title} - {file-count} files affected
3. **Phase 3:** {phase-title} - {file-count} files affected
...
10. **Next Step:** Execute Phase 1 or review plan files

**⚡ Options**
**A.** Execute Phase 1 now  
**B.** Review plan files first  
**C.** Modify plan scope  
**D.** Cancel planning
```

**Expected:** Phase titles shown in bullets 1-3  
**Actual:** Copilot summarized all phases as single bullet, then asked for options

---

## 🔍 Why This Happened

### Issue 1: CONCISE-MANDATE.md Constraint Conflict

**CONCISE-MANDATE.md Rule:**
- MAX 25 bullets total per response
- MAX 3 lines per bullet

**plan.prompt.md Output Format:**
- 🧠 Analysis: ≤8 bullets
- 📌 Summary: ≤15 bullets  
- **TOTAL: ≤23 bullets** (close to limit)

**Result:** Copilot collapsed phase details to save bullets

### Issue 2: Missing Explicit Phase Breakdown Section

**Current plan.prompt.md structure:**
```markdown
**📌 Plan Overview (≤10 bullets)**
1. **Phase 1:** {phase-title} - {file-count} files affected
2. **Phase 2:** {phase-title} - {file-count} files affected
```

**Problem:** This format assumes 1 bullet per phase, but:
- If 4+ phases exist, uses 4+ bullets just for phase titles
- No room for task lists (would need nested bullets)
- CONCISE-MANDATE prohibits nested lists

### Issue 3: Task Lists Not in Output Format

**plan.prompt.md shows:**
- Phase titles ✅
- File counts ✅
- Test strategy ✅

**plan.prompt.md does NOT show:**
- Task breakdown per phase ❌
- What work happens in each phase ❌
- Dependencies between tasks ❌

**User gets:** High-level phase names only  
**User needs:** Detailed task lists to make informed decisions

---

## 📊 Solutions Evaluated

### Option 1: Increase Bullet Limit ❌
**Change:** CONCISE-MANDATE.md: 25 → 40 bullets  
**Pros:** More room for phase details  
**Cons:** 
- Violates conciseness principle
- Returns to verbose output problem
- Doesn't solve nested list prohibition

### Option 2: Add "📋 Phases & Tasks" Section ✅ (RECOMMENDED)
**Change:** New output section showing phases with tasks  
**Format:**
```markdown
**📋 Phases & Tasks (≤15 bullets)**

**Phase 1: {Title}**
- Task 1.1: {description}
- Task 1.2: {description}

**Phase 2: {Title}**
- Task 2.1: {description}
- Task 2.2: {description}
```

**Pros:**
- Shows task breakdown BEFORE user decides
- Fits within 25 bullet limit (phases use bold headers, tasks use bullets)
- No nested lists (flat structure)
- User can review scope before approving

**Cons:**
- Adds ~10 bullets (need to reduce other sections)

### Option 3: Mandate Phase Details in Plan Summary ✅ (COMPLEMENTARY)
**Change:** Enforce phase titles + task counts in 📌 Summary  
**Format:**
```markdown
**📌 Plan Overview**
1. **Phase 1:** File Verification Algorithm (4 tasks, 3 files)
2. **Phase 2:** CONCISE-MANDATE Update (2 tasks, 1 file)
3. **Phase 3:** Enforcement Tests (3 tasks, 4 files)
4. **Phase 4:** Documentation (2 tasks, 5 files)
```

**Pros:**
- Gives user quick overview without needing full task list
- Fits in existing structure
- Shows scope (task count + file count)

**Cons:**
- Still doesn't show individual task descriptions
- User can't evaluate complexity without seeing tasks

### Option 4: Two-Stage Approval Process ❌
**Change:** Show plan → Ask for review → Show tasks → Ask for execution  
**Pros:** Separates plan overview from task details  
**Cons:**
- Adds extra approval step (slower)
- User might skip review step
- More complex workflow

---

## ✅ Recommended Solution (Hybrid)

**Implement Option 2 + Option 3:**

### Changes Required:

#### 1. Update plan.prompt.md Output Format

**Add new section between 📌 Summary and ⚡ Options:**

```markdown
**📋 Phases & Tasks**

**Phase 1: {Title}**
- Task 1.1: {description}
- Task 1.2: {description}
- Task 1.3: {description}

**Phase 2: {Title}**
- Task 2.1: {description}
- Task 2.2: {description}

**Phase 3: {Title}**
- Task 3.1: {description}
- Task 3.2: {description}
- Task 3.3: {description}

**Phase 4: {Title}**
- Task 4.1: {description}
```

**Bullet Count:**
- Phase headers (bold) = 0 bullets (markdown headers)
- Tasks = 1 bullet each
- Example: 4 phases, 11 tasks = 11 bullets

#### 2. Update 📌 Plan Overview to Use Task Counts

**Before:**
```markdown
1. **Phase 1:** {phase-title} - {file-count} files affected
```

**After:**
```markdown
1. **Phase 1:** {phase-title} ({task-count} tasks, {file-count} files)
```

**Benefit:** Shows scope without listing tasks

#### 3. Reduce 🧠 Analysis Section to ≤5 Bullets

**Current:** ≤8 bullets  
**New:** ≤5 bullets  
**Savings:** 3 bullets → Allocate to 📋 Phases & Tasks

#### 4. Add Validation Rule to output-validator.md

**New Check:**
```
IF agent == "plan.prompt.md" THEN
  IF response contains "Phase" references THEN
    IF NOT response contains "📋 Phases & Tasks" section THEN
      violations.add({
        rule: "Phase breakdown must show tasks",
        severity: "critical",
        remediation: "Add 📋 Phases & Tasks section showing individual tasks"
      })
    END IF
  END IF
END IF
```

---

## 📐 Updated Output Format Template

### Full Response Structure (25 bullets max)

```markdown
**🧠 Analysis (≤5 bullets)**
- Key: {key}
- Routing: {prompts-used}
- Complexity: {simple|moderate|complex}
- Layers: {affected-layers}
- Dependencies: {any-or-none}

**📌 Plan Overview (≤10 bullets)**
1. Plan finalized for key: `{key}`
2. Total phases: {count} ({complexity})
3. **Phase 1:** {title} ({task-count} tasks, {file-count} files)
4. **Phase 2:** {title} ({task-count} tasks, {file-count} files)
5. **Phase 3:** {title} ({task-count} tasks, {file-count} files)
6. **Phase 4:** {title} ({task-count} tasks, {file-count} files)
7. Test Strategy: {test-types}
8. Rollback: Checkpoint commits enabled
9. Documentation: See {key}.plan.md
10. Next Step: Execute Phase 1 or review plan

**📋 Phases & Tasks (≤10 bullets)**

**Phase 1: {Title}**
- Task 1.1: {action} - {expected-outcome}
- Task 1.2: {action} - {expected-outcome}
- Task 1.3: {action} - {expected-outcome}

**Phase 2: {Title}**
- Task 2.1: {action} - {expected-outcome}
- Task 2.2: {action} - {expected-outcome}

**Phase 3: {Title}**
- Task 3.1: {action} - {expected-outcome}
- Task 3.2: {action} - {expected-outcome}
- Task 3.3: {action} - {expected-outcome}

**Phase 4: {Title}**
- Task 4.1: {action} - {expected-outcome}

**⚡ Options**
**A.** Execute Phase 1 now  
**B.** Review detailed plan files  
**C.** Modify plan scope  
**D.** Cancel planning

Reply: A, B, C, or D
```

**Total Bullets:**
- 🧠 Analysis: 5
- 📌 Overview: 10
- 📋 Phases & Tasks: 10 (example with 11 tasks)
- **TOTAL: 25 bullets** ✅

---

## 🎯 Acceptance Criteria

✅ **User sees phase titles** in 📌 Overview  
✅ **User sees task breakdown** in 📋 Phases & Tasks  
✅ **User can evaluate scope** before choosing Option A  
✅ **Response fits in 25 bullets** (CONCISE-MANDATE compliant)  
✅ **No nested lists** (flat bullet structure)  
✅ **Phase headers use bold** (not bullets, save count)  
✅ **Validation enforced** via output-validator.md

---

## 🚀 Implementation Plan

### Phase 1: Update plan.prompt.md Output Format
- Add 📋 Phases & Tasks section specification
- Update 📌 Overview to show task counts
- Reduce 🧠 Analysis to ≤5 bullets
- Update examples to match new format

### Phase 2: Update CONCISE-MANDATE.md
- Add exception for phase headers (bold, not bullets)
- Clarify task list format (flat, not nested)
- Add example showing 📋 Phases & Tasks section

### Phase 3: Update output-validator.md
- Add phase breakdown validation rule
- Check for 📋 Phases & Tasks section presence
- Verify task list format (no nesting)

### Phase 4: Update Documentation
- SelfAwareness.instructions.md: Document new output format
- Version history: plan.prompt.md v1.7 → v1.8
- Update all references to output format

---

## 📝 Related Files to Modify

1. `.github/prompts/plan.prompt.md` - Output format section
2. `.github/prompts/shared/CONCISE-MANDATE.md` - Phase header exception
3. `.github/prompts/shared/output-validator.md` - Phase validation rule
4. `.github/instructions/SelfAwareness.instructions.md` - Output format docs
5. `.github/key-data-streams/prompt-enhancements/work-log.md` - Track changes

---

## 🔬 Testing Strategy

### Manual Validation
1. Trigger plan.prompt.md with 4-phase plan
2. Verify 📋 Phases & Tasks section appears
3. Verify task lists show before Options
4. Verify total bullets ≤25
5. Verify no nested lists

### Automated Validation
- Use `-test` flag with plan.prompt.md
- Validation framework checks for 📋 section
- Reports violations if missing

---

## 📊 Expected Outcome

**Before (Current Behavior):**
```markdown
**📌 Plan Overview**
1. Plan finalized for key: prompt-enhancements
2. Total phases: 4 (simple complexity)
3. Files created: plan.md, plan.json, work-log.md
...

**⚡ Options**
**A.** Execute Phase 1 now (file verification algorithm + prompt updates)
**B.** Review detailed plan first
```
❌ User can't see what tasks are in Phase 1

**After (New Behavior):**
```markdown
**📌 Plan Overview**
1. Plan finalized for key: prompt-enhancements
2. Total phases: 4 (simple)
3. **Phase 1:** File Verification (5 tasks, 4 files)
4. **Phase 2:** CONCISE-MANDATE Update (2 tasks, 1 file)
...

**📋 Phases & Tasks**

**Phase 1: File Verification Algorithm**
- Task 1.1: Create file-finalization-verifier.md
- Task 1.2: Update plan.prompt.md Step 5.5
- Task 1.3: Update task.prompt.md Step 8.25
- Task 1.4: Update todo.prompt.md execution
- Task 1.5: Update route.prompt.md delegation

**Phase 2: CONCISE-MANDATE Update**
- Task 2.1: Add Rule 11 (File Finalization)
- Task 2.2: Update validation checklist

**⚡ Options**
**A.** Execute Phase 1 now
**B.** Review detailed plan files
```
✅ User sees exactly what will happen in Phase 1
