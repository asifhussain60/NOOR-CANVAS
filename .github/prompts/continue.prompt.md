# Continue — Extend Current Work with Same Key

**Version**: 1.0.0  
**Purpose**: Extend or modify the current active work request while preserving context, key, and execution flow.

---

## Critical Rules
1. MAX 15 bullets per response (see `.github/prompts/shared/CONCISE-MANDATE.md`)
2. **Preserve current key** - Use same key from most recent handoff/task
3. **Extend, don't replace** - Add to existing plan, don't restart
4. Auto-execute after 5s unless "review"/"cancel"

## Input
Additional work requests + optional modifications to current plan

## Key Strategy
- **Always preserve current key** from most recent work
- **Multi-task extensions**: `{current-key}-ext1`, `{current-key}-ext2` if needed
- **Expand shortcuts** via UserDictionary.md

## Context Detection
1. **Find current key** from recent git commits (ckpt messages)
2. **Load current plan** from `.github/key-data-streams/{key}/{key}.plan.md` OR `Workspaces/Copilot/_DOCS/summaries/{key}.plan.md`
3. **Check execution status** from recent commits and file changes
4. **Identify completion state** of current phases

## Mode Detection (Auto-Select Best Workflow)

When invoked, determine optimal workflow:

### If Active Key Detected
- **EXTEND** existing work (primary continue.prompt.md behavior)
- Load existing plan and context
- Append new phases or modify existing ones
- Preserve execution continuity

### If NO Active Key Detected
Classify work complexity:

**Simple Work** (1-2 phases, clear scope, single layer):
- Create lightweight plan in continue
- Auto-execute after 5s
- Examples: button resize, text change, single config update

**Complex Work** (multi-phase, multi-layer, architectural):
- **RECOMMEND** comprehensive planning:
  ```
  @workspace /plan key:{suggested-key} {work-description}
  ```
- Examples: UI redesign, new features, database migrations, SignalR changes
- User can override with "proceed anyway" to use lightweight mode

## Routing Classification

Classify work type → include specialized prompts:

**Always Include:**
- `task.prompt.md` - Core execution engine

**Conditional Includes:**
- **Tests Required** → `test-generation.prompt.md`
  - New features, UI changes, API endpoints, database schema
  - Triggers: keywords (test, e2e, Percy, Playwright, visual regression)
  
- **Architecture Changes** → `plan.prompt.md` (recommend upgrade)
  - Multi-layer changes, new services, SignalR hubs
  - Triggers: keywords (architecture, refactor, redesign, migration)
  
- **Quality Focus** → `healthcheck.prompt.md`
  - Code quality, prompt optimization, system validation
  - Triggers: keywords (quality, lint, optimize, validate, audit)
  
- **Drift Detected** → `drift.prompt.md`
  - Unrelated issues discovered during work
  - Auto-trigger when tangent/blocker found

## Complexity Classification Algorithm

```
FUNCTION ClassifyWorkComplexity(request)
  
  // Parse request for complexity indicators
  layers = DetectAffectedLayers(request)  // UI, API, Services, Database
  phases = EstimatePhaseCount(request)
  hasTests = RequiresTestGeneration(request)
  hasArchChange = AffectsArchitecture(request)
  
  // Simple work criteria
  IF layers.count <= 1 AND phases <= 2 AND NOT hasArchChange THEN
    RETURN "SIMPLE"
  END IF
  
  // Complex work indicators
  IF layers.count >= 2 OR phases >= 3 OR hasArchChange THEN
    RETURN "COMPLEX"
  END IF
  
  // UI/UX redesign always complex
  IF Contains(request, "redesign|modernize|responsive|accessibility") THEN
    RETURN "COMPLEX"
  END IF
  
  // Database changes always complex
  IF Contains(request, "migration|schema|database|SQL") THEN
    RETURN "COMPLEX"
  END IF
  
  // Default to simple if ambiguous
  RETURN "SIMPLE"
  
END FUNCTION
```

## Plan Extension Structure
Update existing `{key}.plan.md` with:
- **New phases** appended to current plan
- **Modified phases** if existing work needs changes
- **Exit criteria** updated for extended scope
- **Error remediation** plan updated

## Output (STRICT)

### For Simple Work (No Active Key)
🧠 Analysis (≤5 bullets):
- Complexity: SIMPLE (lightweight mode)
- Key: {generated-key}
- Routing: task + {conditional-prompts}
- Phases: {1-2}

📌 Summary (≤10 bullets):
1. Key: {key} | Work: {one-liner}
2. Mode: Lightweight (quick execution)
3. Phases: {phase-list}
4. Files: {count}
5. Tests: {yes/no}
6. Next: **A.** Execute | **B.** Upgrade to /plan | **C.** Modify | **D.** Cancel

### For Complex Work (Recommendation)
🧠 Analysis (≤5 bullets):
- Complexity: COMPLEX (recommend /plan)
- Reason: {multi-layer|phases>2|architecture|UI-redesign}
- Suggested key: {key}

📌 Summary (≤10 bullets):
1. Work: {one-liner}
2. Complexity: {reason}
3. Recommendation: Use @workspace /plan for comprehensive planning
4. Override: Say "proceed anyway" for lightweight mode
5. Next: **A.** Use /plan (recommended) | **B.** Proceed anyway | **C.** Cancel

### For Extension (Active Key)
🧠 Analysis (≤5 bullets):
- Current key detected: {key}
- Current phase: {N} of {total}
- Extension scope: {description}
- Routing: {prompts}

📌 Summary (10 bullets):
1. Key: {current-key} | Extension: {description}
2. Current Status: Phase {N} of {total}
3. Addition: {new-work-description}
4. New Phases: {count}
5. Files: {additional-count}
6. Integration: {how-extension-fits}
7. Impact: {existing-work-changes}
8. Testing: {additional-tests-needed}
9. Timeline: {estimated-addition}
10. Next: **A.** Execute Extension | **B.** Review Plan | **C.** Modify Scope | **D.** Start Fresh

📊 Final:
- Status | Key | Current Phase | Extension | Next

## 📋 NEXT STEPS

**Current Key**: `{current-key}`

**Execute Extension:**
```
Say "proceed" or wait 5s for auto-execution
```

**Continue Without Extension:**
```
@workspace /continue {additional-work}
(Auto-detects {key} from git history)
```

**Modify Plan:**
```
@workspace /plan {modification-description}
(Auto-detects {key}, updates plan version)
```

**Cancel:**
```
Say "cancel" or "review" within 5s
```

## Execution
- **Preserve execution context** - Continue from current phase
- **NO approval needed** between existing phases
- **MANDATORY**: Create git commit after EVERY new phase
- **Commit format**: `ckpt({key}): Phase {N} - {extension-summary}`
- **Auto-execute after 5s** unless "review"/"cancel"

## Context Preservation
- **Keep existing plan structure** intact
- **Append new phases** with proper numbering
- **Update completion criteria** to include extensions
- **Maintain checkpoint commit pattern**
- **Preserve work-log and documentation**

## Error Handling
- **If no current key detected**: Ask user to specify or create new handoff
- **If plan not found**: Reconstruct from git history or start fresh
- **If work completed**: Create new phases for post-completion work
- **If conflicts detected**: Present resolution options

## Integration Points
- **Current phase completion**: Ensure current work finishes before extension
- **Dependency management**: Identify if extension depends on current work
- **Testing integration**: Merge new tests with existing test plan
- **Documentation updates**: Extend existing summaries and logs

---

## Drift Detection and Handoff (MANDATORY)

### On Work Completion
When current key's work is completed:

1. **Check Drift Stack**
   - Query git history for drift registrations: `git log --grep="drift({current-key})"`
   - Parse drift keys from commit messages
   - Identify unresolved drifts (no matching `ckpt({drift-key}): Resolved`)

2. **If Drifts Exist**
   - **DO NOT PROCEED** with new work
   - **PRESENT** drift resolution handoff to user
   - **FORMAT**:
     ```
     ✓ {current-key} completed
     
     📋 Pending Drifts Detected:
     1. {drift-key-1} - {description} (registered: {timestamp})
     2. {drift-key-2} - {description} (registered: {timestamp})
     
     **Next Steps:**
     Say "proceed" to resolve drifts, or "defer" to skip
     
     **Handoff Command** (will auto-execute):
     @workspace /plan key:{drift-key-1} parent:{current-key}
     Resume drift: {drift-description}
     ```
   - **WAIT** for user approval before invoking plan.prompt.md

3. **Drift Resolution Workflow**
   - User says "proceed" → invoke plan.prompt.md with drift key
   - Plan creates execution plan for drift
   - Execute drift work → auto-commit resolution
   - Pop drift from stack → check for next drift
   - Repeat until stack empty
   - Final commit: `ckpt({original-key}): All drifts resolved`

4. **If No Drifts**
   - Mark current key complete
   - Present normal completion summary
   - Ready for new work or extensions

### Drift Stack Query
```bash
# Find all drifts for current key
git log --grep="drift({current-key})" --format="%h %s"

# Check if drift resolved
git log --grep="ckpt({drift-key}): Resolved" --format="%h %s"

# Count remaining drifts
(drift registrations) - (resolved commits)
```

### Handoff Integration
- **continue.prompt.md** → detects completion + checks drift stack
- **plan.prompt.md** → creates drift resolution plan
- **task.prompt.md** → executes drift resolution
- **drift.prompt.md** → manages stack, context, commits

### Auto-Commit on Drift Resolution
**MANDATORY** commit after each drift resolved:
```
ckpt({drift-key}): Resolved - {summary}
Parent: {parent-key} | Remaining: {count} drifts
```

### Stack Depth Enforcement
- **Max depth: 3 levels**
- Block new drifts if depth > 3
- Force resolution of deepest drift first
- Present overflow warning to user

## Success Criteria
- Current key preserved and continued
- Existing work context maintained
- New work properly integrated into plan
- Execution continues seamlessly
- All phases properly numbered and sequenced
- **Drift stack checked on completion**
- **Pending drifts handed off to plan.prompt.md**
- **Auto-commits created for drift resolutions**
- **Stack depth enforced (max 3)**