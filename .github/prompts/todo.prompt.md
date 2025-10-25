# Todo — Extend Current Work with Same Key

**Version**: 2.0.0  
**Purpose**: Extend or modify the current active work request while preserving context, key, and execution flow. Renamed from continue.prompt.md to better reflect "todo item" workflow pattern.

**Rename Note**: Previously `continue.prompt.md` (v1.0.0). Renamed to `todo.prompt.md` (v2.0.0) on 2025-10-25 to align with todo-based workflow terminology. All agent references updated accordingly.

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
2. **Load current plan** from `.github/prompts.keys/{key}/{key}.plan.md` OR `Workspaces/Copilot/_DOCS/summaries/{key}.plan.md`
3. **Check execution status** from recent commits and file changes
4. **Identify completion state** of current phases

## Mode Detection (Auto-Select Best Workflow)

When invoked, determine optimal workflow:

### If Active Key Detected
- **EXTEND** existing work (primary todo.prompt.md behavior)
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

## 🎯 What Would You Like To Do Next?

**Current Key**: `{current-key}`

**Execute Extension:**
```
Say "proceed" or wait 5s for auto-execution
```

**Continue Without Extension:**
```
@workspace /todo {additional-work}
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
   - Parse drift keys from commit messages (both auto and manual modes)
   - Identify unresolved drifts (no matching `ckpt({drift-key}): Resolved`)
   - Extract severity levels from drift commit messages

2. **If Drifts Exist**
   - **DO NOT PROCEED** with new work
   - **PRESENT** comprehensive drift summary to user
   - **FORMAT** (severity-sorted):
     ```
     ✓ {current-key} completed
     
     ## � Drift Summary
     
     **Total Drifts Detected**: {count} ({auto-count} auto, {manual-count} manual)
     
     ### Critical (Fix Immediately)
     1. {drift-key-1} - {description}
        Mode: auto | Severity: critical | Triggered by: task.prompt.md
        Registered: {timestamp}
     
     ### High (Address Soon)
     2. {drift-key-2} - {description}
        Mode: manual | Severity: high | Triggered by: user
        Registered: {timestamp}
     
     ### Medium (Plan Resolution)
     3. {drift-key-3} - {description}
        Mode: auto | Severity: medium | Triggered by: plan.prompt.md
        Registered: {timestamp}
     
     ### Low / Informational
     4. {drift-key-4} - {description}
        Mode: auto | Severity: low | Triggered by: healthcheck.prompt.md
        Registered: {timestamp}
     
     ---
     
     **Recommended Resolution Order**: Critical → High → Medium → Low
     
     **Queue Status**: {count}/10 drifts (queue limit enforced)
     
     **What would you like to do next?**
     
     **A.** Resolve critical drifts now (starts with {drift-key-1})
     **B.** Resolve all drifts in order (critical → high → medium → low)
     **C.** Select specific drifts to resolve (provide drift keys)
     **D.** Defer all drifts (mark current key complete, save drift queue)
     ```
   - **WAIT** for user choice before invoking drift resolution

3. **Drift Resolution Workflow**

   **User selects "A" (Critical Only)**:
   - Filter drifts by severity=critical
   - Invoke plan.prompt.md for first critical drift
   - Execute → auto-commit resolution
   - Repeat for remaining critical drifts
   - Return to drift summary (show remaining high/medium/low)
   
   **User selects "B" (All Drifts)**:
   - Process in severity order: critical → high → medium → low
   - For each drift:
     * Invoke plan.prompt.md with drift key
     * Execute drift work → auto-commit resolution
     * Pop drift from stack → check for next drift
   - Final commit: `ckpt({original-key}): All drifts resolved`
   
   **User selects "C" (Specific Drifts)**:
   - Parse user-provided drift keys (comma-separated)
   - Validate keys exist in drift queue
   - Process selected drifts in severity order
   - Update drift queue (remove resolved drifts)
   
   **User selects "D" (Defer)**:
   - Mark current key complete
   - Preserve drift queue in work-log.md
   - Add note: "Deferred {count} drifts - revisit later"
   - User can manually invoke: `@workspace /drift key:{drift-key}`

4. **If No Drifts**
   - Mark current key complete
   - Present normal completion summary
   - Ready for new work or extensions

### Drift Summary Algorithm

```
FUNCTION GenerateDriftSummary(parentKey)
  
  // Query all drifts for parent key
  drifts = GitLogGrep("drift({parentKey})")
  
  // Parse drift details from commit messages
  FOR EACH driftCommit IN drifts
    driftKey = ParseDriftKey(driftCommit)
    severity = ParseSeverity(driftCommit)
    mode = ParseMode(driftCommit)  // "auto" | "manual" | "user-critical" | "auto-deferred"
    triggeredBy = ParseTriggeredBy(driftCommit)
    description = ParseDescription(driftCommit)
    timestamp = ParseTimestamp(driftCommit)
    
    // Check if resolved
    isResolved = GitLogGrep("ckpt({driftKey}): Resolved").Count > 0
    
    IF NOT isResolved THEN
      AddToQueue(driftKey, severity, mode, triggeredBy, description, timestamp)
    END IF
  END FOR
  
  // Sort by severity
  SortBySeverity(queue)  // critical, high, medium, low, informational
  
  // Enforce queue limit (max 10)
  IF queue.Count > 10 THEN
    overflow = queue.Count - 10
    WARN("Queue overflow: {overflow} drifts truncated (oldest low-priority removed)")
    queue = queue.Take(10)
  END IF
  
  // Generate summary by severity
  summary = GroupBySeverity(queue)
  
  RETURN summary
  
END FUNCTION
```

### Unified Commit Format Validation

**Drift Registration Commit**:
```
drift({parent-key}): Register {drift-key} - {one-line-description}
Mode: auto | manual | user-critical | auto-deferred
Severity: critical | high | medium | low | informational
Triggered by: plan.prompt.md | task.prompt.md | test-generation.prompt.md | healthcheck.prompt.md | user
Phase: {phase-name} (optional - for auto mode only)
```

**Drift Resolution Commit**:
```
ckpt({drift-key}): Resolved - {summary}
Parent: {parent-key} | Remaining: {count} drifts
```

**Validation Rules**:
1. Drift key must be kebab-case, lowercase
2. Severity must be one of 5 valid levels
3. Mode must be one of 4 valid modes
4. Parent key must exist in git history
5. Description required (max 100 chars)

**Format Validation Pseudocode**:
```
FUNCTION ValidateDriftCommitFormat(commitMessage)
  
  // Extract components
  IF NOT MatchesPattern(commitMessage, "drift({key}): Register {drift-key}") THEN
    RETURN "Invalid commit format"
  END IF
  
  mode = ExtractMode(commitMessage)
  severity = ExtractSeverity(commitMessage)
  triggeredBy = ExtractTriggeredBy(commitMessage)
  
  // Validate mode
  validModes = ["auto", "manual", "user-critical", "auto-deferred"]
  IF mode NOT IN validModes THEN
    RETURN "Invalid mode: {mode}"
  END IF
  
  // Validate severity
  validSeverities = ["critical", "high", "medium", "low", "informational"]
  IF severity NOT IN validSeverities THEN
    RETURN "Invalid severity: {severity}"
  END IF
  
  // Validate triggered by
  validTriggers = ["plan.prompt.md", "task.prompt.md", "test-generation.prompt.md", "healthcheck.prompt.md", "user"]
  IF triggeredBy NOT IN validTriggers THEN
    RETURN "Invalid trigger: {triggeredBy}"
  END IF
  
  RETURN "Valid"
  
END FUNCTION
```

### Queue Overflow Protection

**Max Auto-Detected Drifts**: 10 per parent key

**Overflow Handling**:
```
FUNCTION EnforceQueueLimit(parentKey, newDrift)
  
  currentDrifts = GetUnresolvedDrifts(parentKey)
  autoDrifts = FilterByMode(currentDrifts, "auto")
  
  IF autoDrifts.Count >= 10 THEN
    // Queue full - remove lowest priority auto drift
    lowestPriority = autoDrifts
      .Where(d => d.severity IN ["low", "informational"])
      .OrderBy(d => d.timestamp)
      .First()
    
    IF lowestPriority EXISTS THEN
      RemoveFromQueue(lowestPriority)
      LogWarning("Queue overflow: Removed {lowestPriority.key} to make room for {newDrift.key}")
    ELSE
      // All auto drifts are medium/high/critical - block new drift
      HALT("Queue overflow: Cannot register {newDrift.key} - resolve existing drifts first")
    END IF
  END IF
  
  RegisterDrift(newDrift)
  
END FUNCTION
```

**Manual Drifts**: Not subject to 10 drift limit (user explicitly registered)

**Queue Overflow Warning**:
```
⚠️ Drift Queue Near Capacity

Current: 9/10 auto-detected drifts
Recommendation: Resolve low-priority drifts before continuing work

Low-priority drifts that can be deferred:
- {drift-key-1} (severity: low, age: 3 days)
- {drift-key-2} (severity: informational, age: 1 week)
```

### Drift Stack Query
```bash
# Find all drifts for current key
git log --grep="drift({current-key})" --format="%h %s %b"

# Check if drift resolved
git log --grep="ckpt({drift-key}): Resolved" --format="%h %s"

# Count remaining drifts by severity
git log --grep="drift({current-key})" --grep="Severity: critical" --format="%h"

# Get drift details (mode, severity, triggered by)
git log --grep="drift({current-key})" --format="%h %s %b" | grep -E "Mode:|Severity:|Triggered by:"
```

### Handoff Integration
- **todo.prompt.md** → detects completion + generates comprehensive drift summary
- **plan.prompt.md** → creates drift resolution plan
- **task.prompt.md** → executes drift resolution with auto-detection
- **drift.prompt.md** → manages stack, context, commits, validation

### Auto-Commit on Drift Resolution
**MANDATORY** commit after each drift resolved:
```
ckpt({drift-key}): Resolved - {summary}
Parent: {parent-key} | Remaining: {count} drifts
Severity: {original-severity} | Mode: {original-mode}
```

### Stack Depth Enforcement
- **Max depth: 3 levels** (parent → drift → sub-drift → sub-sub-drift)
- Block new drifts if depth > 3
- Force resolution of deepest drift first
- Present overflow warning to user

**Depth Calculation**:
```
FUNCTION CalculateDriftDepth(driftKey)
  
  depth = 0
  currentKey = driftKey
  
  WHILE parentKey = GetParentKey(currentKey) EXISTS
    depth++
    currentKey = parentKey
    
    IF depth > 3 THEN
      HALT("Max drift depth exceeded - resolve {driftKey} before registering new drifts")
    END IF
  END WHILE
  
  RETURN depth
  
END FUNCTION
```

## Success Criteria
- Current key preserved and continued
- Existing work context maintained
- New work properly integrated into plan
- Execution continues seamlessly
- All phases properly numbered and sequenced
- **Comprehensive drift summary generated on completion**
- **Severity-sorted presentation (critical → high → medium → low)**
- **Queue overflow protection enforced (max 10 auto drifts)**
- **Unified commit format validated**
- **User choice handling for drift resolution**
- **Pending drifts handed off to plan.prompt.md**
- **Auto-commits created for drift resolutions**
- **Stack depth enforced (max 3)**