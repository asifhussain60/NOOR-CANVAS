# Efficiency Enhancement Registry

**Purpose:** Centralized catalog of optimization capabilities available to all prompts

**Version:** 1.0.0  
**Created:** 2025-10-29  
**Maintained by:** Prompt system architects

---

## Overview

This registry documents all efficiency enhancements, optimizations, and performance improvements available across the prompt system. Use this as a reference when designing new prompts or optimizing existing workflows.

---

## Available Enhancements

### 1. Context Gathering Phases (10-Phase Protocol)

**File:** `.github/prompts/shared/context-gathering-phases.md`

**Purpose:** Incremental context loading to avoid overwhelming token limits

**When to Use:**
- Complex multi-file changes (>5 files)
- Architectural analysis requiring deep understanding
- Uncertain scope requiring exploration

**Skip Conditions:**
- Simple work (1-2 files, clear scope)
- Lightweight mode enabled (`include_suggestions='lightweight-mode'`)
- User explicitly requests minimal context

**Phases:**
1. Quick Overview (file list, structure)
2. Error Context (if error-driven)
3. Visual Context (if screenshots/images provided)
4. Key File Analysis (primary files only)
5. Dependency Analysis (imports, references)
6. Service Layer Context (if multi-layer)
7. Database Schema (if DB changes)
8. Test Coverage (existing tests)
9. Configuration Files (settings, env vars)
10. Documentation (README, inline docs)

**Speedup:** 40-60% reduction in irrelevant context reads

**Usage:**
```markdown
See `.github/prompts/shared/context-gathering-phases.md` for complete algorithm
```

---

### 2. Parallel Context Loading

**Purpose:** Load multiple files simultaneously instead of sequentially

**Tools Used:**
- `semantic_search` - Semantic code search
- `grep_search` - Regex pattern search
- `read_file` - Direct file reads

**Pattern:**
```markdown
## Parallel Reads (Execute Together)

semantic_search("feature X implementation")
grep_search("class.*FeatureX", includePattern="**/*.cs")
read_file("File1.cs", 1, 100)
read_file("File2.cs", 1, 100)

## Wait for all results, then proceed
```

**Speedup:** 3-5x faster than sequential loading

**Limitations:**
- Maximum ~5 parallel tool calls recommended
- Do NOT parallelize semantic_search (use once per batch)
- Terminal commands must remain sequential

---

### 3. Lightweight Mode (Plan Prompt)

**File:** `.github/prompts/plan.prompt.md`

**Purpose:** Skip questionnaires and detailed analysis for simple features

**Trigger:**
- `include_suggestions='lightweight-mode'` parameter
- Simple work detected (1 layer, ≤2 phases)

**Benefits:**
- 50% reduction in planning steps
- No questionnaire generation (Step 3 skipped)
- Direct plan creation from request

**Trade-offs:**
- Less refined requirements
- Assumes clear, well-scoped request
- Not suitable for complex/architectural work

**Usage:**
```bash
@workspace /plan key=feature-x user_request="..." include_suggestions=lightweight-mode
```

---

### 4. Auto-Chain Execution (Task Prompt)

**File:** `.github/prompts/task.prompt.md`

**Purpose:** Unassisted phase-to-phase transitions without user approval

**Trigger:** `auto-chain=true` parameter

**Requirements:**
- Test registry configured (`.github/key-data-streams/{key}/test-registry.json`)
- Checkpoint commits enabled
- Clear success criteria per phase

**Flow:**
```
Phase 1 Execute → Tests Pass → Auto-chain to Phase 2
Phase 2 Execute → Tests Pass → Auto-chain to Phase 3
...
All Phases Complete → Stop
```

**Speedup:** Eliminates user wait time between phases

**Risks:**
- Test failures halt chain (requires manual intervention)
- Assumes stable implementation (no mid-phase changes)

**Usage:**
```bash
@workspace /task key=feature-x phase=1 auto-chain=true
```

---

### 5. Skip Conditions (Context Gathering)

**Purpose:** Avoid unnecessary context collection

**Conditions:**

**Skip Service Layer (Phase 6):**
- UI-only changes (no API/business logic)
- Detected keywords: "button", "CSS", "styling", "layout"

**Skip Database Schema (Phase 7):**
- No migration files detected
- No SQL keywords in request
- Detected keywords: "UI", "frontend", "component"

**Skip Test Coverage (Phase 8):**
- Test-generation work (tests ARE the work)
- User explicitly says "no tests needed"

**Skip Documentation (Phase 10):**
- Code-only changes (no API surface changes)
- Internal refactoring

**Speedup:** 20-30% reduction in context gathering time

---

### 6. Caching Strategies

**Purpose:** Reuse context across steps within same session

**Patterns:**

**Cache File Contents:**
```markdown
Step 1: Read FeatureService.cs (lines 1-100) → Cache in memory
Step 3: Reference cached FeatureService.cs content
Step 5: Update FeatureService.cs using cached content
```

**Cache Search Results:**
```markdown
Step 1: semantic_search("user authentication") → Cache results
Step 2: Use cached results to determine files
Step 4: Reference cached results for implementation
```

**Speedup:** Eliminates duplicate reads (30-40% faster)

**Limitations:**
- Only within single conversation turn
- File updates invalidate cache

---

### 7. Incremental File Reads

**Purpose:** Read large files in chunks instead of all at once

**Pattern:**
```markdown
Step 1: Read File.cs (lines 1-100) - Get overview
Step 2: Read File.cs (lines 200-250) - Target method only
Step 3: Read File.cs (lines 500-600) - Related method
```

**Benefits:**
- Reduced token usage (40-50%)
- Faster initial context load
- Focused on relevant sections

**When NOT to use:**
- Small files (<300 lines)
- Need full context (refactoring entire file)

---

### 8. Smart Key Detection (Todo/Task Prompts)

**File:** `.github/prompts/shared/key-generator.md`

**Purpose:** Auto-detect active key from git history

**Algorithm:**
1. Search commits for `ckpt({key}):` pattern
2. Search commits for `[DEBUG-WORKITEM:{key}:*]` pattern
3. Extract most recent key
4. Validate key still active
5. If fails 3 times → Request manual specification

**Speedup:** Eliminates manual key entry (user convenience)

**Fallback:** Clear error message with manual key suggestion

---

### 9. Drift Detection & Management

**File:** `.github/prompts/drift.prompt.md`

**Purpose:** Separate unrelated issues found during work

**Triggers:**
- "Also noticed...", "While investigating...", "Found bug..."
- Blocking issues preventing main work
- Side discoveries during implementation

**Flow:**
```
Main Work (key=feature-x)
  ↓
Drift Detected ("Found bug in validation")
  ↓
Create Drift Key (key=feature-x-drift-1)
  ↓
Resolve Drift → Return to Main Work
```

**Benefits:**
- Main work stays focused
- Drift tracked separately
- Clear audit trail

**Limit:** Max 10 auto-detected drifts per parent key

---

### 10. Test Registry Integration

**File:** `.github/key-data-streams/{key}/test-registry.json`

**Purpose:** Track which tests belong to which phases

**Structure:**
```json
{
  "key": "feature-x",
  "tests": [
    {
      "phase": 1,
      "testFile": "feature-x-ui.spec.ts",
      "testType": "e2e",
      "status": "passed"
    },
    {
      "phase": 2,
      "testFile": "feature-x-api.spec.ts",
      "testType": "integration",
      "status": "not-run"
    }
  ]
}
```

**Benefits:**
- Auto-chain execution (run phase tests before chaining)
- Clear test coverage per phase
- Regression detection

**Usage:** Auto-created by test-generation.prompt.md

---

## Cross-References

### By Prompt

**plan.prompt.md:**
- Lightweight mode (#3)
- Context gathering phases (#1)
- Skip conditions (#5)

**task.prompt.md:**
- Auto-chain execution (#4)
- Test registry (#10)
- Incremental file reads (#7)

**todo.prompt.md:**
- Smart key detection (#8)
- Drift detection (#9)

**test-generation.prompt.md:**
- Test registry integration (#10)

### By Use Case

**Speed up planning:**
- Use lightweight mode (#3)
- Skip unnecessary phases (#5)
- Cache search results (#6)

**Speed up execution:**
- Auto-chain phases (#4)
- Parallel context loading (#2)
- Incremental file reads (#7)

**Improve accuracy:**
- Context gathering phases (#1)
- Test registry (#10)
- Drift detection (#9)

---

## Adding New Enhancements

To add a new efficiency enhancement:

1. Implement in relevant prompt or shared utility
2. Test across 3+ realistic scenarios
3. Document in this registry with:
   - Purpose, triggers, benefits, trade-offs
   - Speedup metrics (if applicable)
   - Usage example
4. Add cross-references to affected prompts
5. Update changelog below

---

## Changelog

**v1.0.0 (2025-10-29):**
- Initial registry creation
- Documented 10 core enhancements
- Established maintenance protocol

---

## See Also

- `.github/prompts/shared/context-gathering-phases.md` - Detailed 10-phase algorithm
- `.github/prompts/shared/key-generator.md` - Key detection logic
- `.github/prompts/plan.prompt.md` - Lightweight mode implementation
- `.github/prompts/task.prompt.md` - Auto-chain protocol
- `.github/prompts/drift.prompt.md` - Drift management workflow
