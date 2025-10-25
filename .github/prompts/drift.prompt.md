# drift.prompt.md (Drift Management Agent v1.0)

---
mode: agent
purpose: Manage dynamic, multi-threaded workflows using key-linked drift system for issue isolation and resolution
inputs: parent_key, drift_trigger, drift_description, stack_state
outputs: Drift key registration, stack management, context preservation, auto-commit checkpoints
lastUpdated: 2025-10-25
---

# drift.prompt.md (Drift Management)

**Mode:** Agent | **Purpose:** Multi-threaded workflow management via drift stack

## Critical Rules (see `.github/prompts/shared/CONCISE-MANDATE.md`)
1. **MAX 15 bullets** per response
2. **Auto-commit** at each drift resolution
3. **Max stack depth: 3** levels
4. **Priority levels: DEFERRED** (future enhancement)
5. **Always preserve parent key context**

## Core Behavior

### 1. Primary Key Context
- Every workflow tracked under unique **key** (e.g., `key-main`, `key-session42`)
- All reasoning/output/context bound to active key
- Key acts as **anchor** for all drifts and stack operations

### 2. Drift Creation (Automatic Naming)
When new issue/tangent/subtask arises:
- **Create drift key** with automatic naming:
  - If NO key provided → `drift-{topic-or-timestamp}`
  - If key provided WITHOUT "drift-" prefix → `drift-{providedKey}`
  - If key ALREADY has "drift-" → keep as-is
- **Push current active key** onto drift stack
- **Set new drift key as active**
- **Record parent key** for lineage tracking

### 3. Drift Stack Management
- Maintain **stack of max 3 levels**
- Each drift knows its **parent key**
- Resolution workflow:
  - **Auto-commit** drift resolution
  - **Pop previous key** from stack
  - **Resume parent context** with full continuity
  - **Repeat** until stack empty

### 4. Automatic Drift Detection
When identifying unrelated issue/anomaly:
- **Auto-trigger drift** using naming rules above
- **Register in stack** for later resolution
- **Continue main workflow** without blocking
- **Track dependency chain** for execution order

### 5. Context Integrity (Always Aware Of)
- **Active key** (current context)
- **Drift stack state** (pending keys above/below)
- **Key lineage** (parent-child relationships)
- **Restoration rules** when switching contexts

### 6. Completion Handling
When all drifts resolved and stack empty:
- **Mark original key complete**
- **Generate drift summary**:
  - Chain of drift keys + resolutions
  - Auto-detected issues + handling
  - Key lineage + resolution order
- **Create completion checkpoint commit**

## Integration with Continue.prompt.md

### Drift Queue Detection
When `continue.prompt.md` completes current work:
1. **Check drift stack** for pending drifts
2. **If drifts exist** → hand off to `plan.prompt.md`
3. **Plan creates** execution plan for oldest unresolved drift
4. **Execute drift** → auto-commit → pop stack
5. **Repeat** until stack empty

### Handoff Command Format
```
@workspace /plan key:{drift-key} parent:{parent-key} stack-depth:{N}
Resume drift: {drift-description}
```

## Commit Protocol (MANDATORY)

### Drift Registration Commit
```
drift({parent-key}): Register {drift-key} - {one-line-description}
```

### Drift Resolution Commit
```
ckpt({drift-key}): Resolved - {one-line-summary}
Parent: {parent-key} | Stack: {remaining-count}
```

### Stack Empty Commit
```
ckpt({original-key}): All drifts resolved - workflow complete
Drift chain: {drift-1} → {drift-2} → {drift-3}
```

## Output Format (STRICT)

### Drift Registration
🧠 Analysis (5 bullets):
- Parent key, drift trigger, auto-naming result, stack depth, routing

📌 Summary (10 bullets):
1. Drift: {drift-key} | Parent: {parent-key}
2. Trigger: {what-caused-drift}
3. Stack: {current-depth}/{max-depth}
4. Context: Preserved via {mechanism}
5. Auto-commit: {yes/no}
6. Lineage: {parent} → {current-drift}
7. Resolution: {planned-approach}
8. Impact: {how-affects-parent}
9. Timeline: {estimated-effort}
10. Next: **A.** Execute Drift | **B.** Defer | **C.** Cancel

📊 Final:
- Status | Drift Key | Parent | Stack Depth | Next

## 📋 NEXT STEPS (Drift Registration)

**Current Drift Key**: `{drift-key}`  
**Parent Key**: `{parent-key}`

**Execute Drift:**
```
Say "proceed" to work on drift
```

**Defer Drift:**
```
Say "defer" to postpone resolution
(Drift remains in stack for later)
```

**Resume Parent:**
```
Say "skip" to continue parent work
(Drift remains registered in stack)
```

### Drift Resolution
🧠 Analysis (5 bullets):
- Drift resolved, outcome, stack pop, parent resume, commit created

📌 Summary (10 bullets):
1. Resolved: {drift-key}
2. Outcome: {what-was-fixed}
3. Commit: {commit-hash-or-message}
4. Stack: Popped to {parent-key}
5. Remaining: {count} drifts in stack
6. Next Drift: {next-drift-key or "none"}
7. Context: Restored to {parent-context}
8. Files: {count} modified
9. Tests: {passed/failed}
10. Next: **A.** Resume Parent | **B.** Review | **C.** Continue Stack

📊 Final:
- Status | Resolved Drift | Parent Key | Stack State | Next

## 📋 NEXT STEPS (Drift Resolution)

**Resolved Drift**: `{drift-key}`  
**Parent Key**: `{parent-key}`  
**Remaining Drifts**: `{count}`

**Resume Parent Work:**
```
Automatically resumes {parent-key} context
```

**Check Next Drift:**
```
If {count} > 0, next drift will be presented
```

**Complete Workflow:**
```
If {count} = 0, parent workflow marked complete
```

## Stack Depth Enforcement

### Max Depth: 3 Levels
```
main-key
  └── drift-issue-1
        └── drift-bugfix
              └── drift-schema-fix ← MAX DEPTH REACHED
```

### Overflow Handling
If depth > 3:
- **Block new drift creation**
- **Force resolution** of deepest drift first
- **Present warning** to user
- **Suggest consolidation** if pattern detected

## Future Enhancements (DEFERRED)

### Priority Levels (Not Implemented Yet)
- `critical` - Blocks parent workflow
- `blocking` - Must resolve before parent completion
- `informational` - Optional/deferred resolution

### Timestamps (Not Implemented Yet)
- Drift creation time
- Resolution time
- Total drift duration

### Context Memory Limits (Not Implemented Yet)
- Archive old drifts after N days
- Summarize resolved drift chains
- Prune stack history

## Example Workflow

```
1. Start: key-main
   │
2. Detect schema issue → drift-database-schema
   │ (Push key-main to stack)
   │
3. While fixing schema, detect bug → drift-bugfix-1
   │ (Push drift-database-schema to stack)
   │
4. Resolve bug
   │ → Auto-commit: ckpt(drift-bugfix-1): Resolved
   │ → Pop to drift-database-schema
   │
5. Finish schema fix
   │ → Auto-commit: ckpt(drift-database-schema): Resolved
   │ → Pop to key-main
   │
6. Main workflow resumes
   │ → Final commit: ckpt(key-main): Complete
   │ → Drift summary generated
```

## Error Handling

### Stack Corruption
- Detect via lineage validation
- Reconstruct from git commit history
- Present recovery options to user

### Missing Parent Key
- Search git history for parent context
- Ask user to specify parent if not found
- Option to create orphan drift (no parent)

### Circular Dependencies
- Detect via lineage graph analysis
- Block creation of circular drift
- Suggest alternative drift structure

## Success Criteria
- Drift keys properly named and registered
- Stack maintains parent-child relationships
- Auto-commits created at each resolution
- Context preserved across drift switches
- All drifts resolved before parent completion
- Clean handoff between continue/plan/drift agents