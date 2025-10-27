# Commit Checkpoint Protocol (MANDATORY)

**Applies to:** ALL execution agents (handoff, task, create-plan)

## Rule
**EVERY phase completion MUST create a git commit checkpoint.**

## Why
- Rollback path if phase fails
- Atomic history per phase
- Easy issue isolation
- Clear audit trail

## When to Checkpoint
1. **After each phase completes** successfully
2. **Before starting next phase**
3. **After self-review passes**
4. **Before final healthcheck**

## PowerShell Snippet
```powershell
# Checkpoint commit after Phase N
git add -A
git commit -m "ckpt({key}): Phase {N} - {brief-description}

- {change-1}
- {change-2}
- {change-3}

Workitem: {key}
Phase: {N}/{total}"

# Capture SHA for rollback index
$sha = (git rev-parse --short HEAD).Trim()
Write-Host "✅ Checkpoint created: $sha"
```

## Commit Message Format
```
ckpt({key}): Phase {N} - {one-line-summary}

- Specific change 1
- Specific change 2
- Specific change 3

Workitem: {key}
Phase: {N}/{total-phases}
```

## Example
```
ckpt(qa-btn-resize): Phase 1 - Resize Q&A button

- Increased button size 44px → 66px
- Increased icon size 1.25rem → 2rem
- Maintained circular shape and hover effects

Workitem: qa-btn-resize
Phase: 1/4
```

## Rollback Index (Optional)
Maintain in `.github/key-data-streams/{key}/rollback-index.md`:

| Date | Phase | SHA | Summary |
|------|-------|-----|---------|
| 2025-10-22 14:30 | 1/4 | a4b2c3d | Resize Q&A button |
| 2025-10-22 14:35 | 2/4 | e5f6g7h | Remove timer icon |

## Integration with Agents

### plan.prompt.md
- No checkpoints (planning only, no execution)
- Execution delegated to task.prompt.md

### todo.prompt.md (lightweight execution mode)
- Checkpoint after each task in execution loop
- Final checkpoint after completion

### task.prompt.md
- Checkpoint after each subtask
- Checkpoint before "mark complete"
- Checkpoint after remediation

### plan.prompt.md  
- Checkpoint after plan file creation
- No execution, so fewer checkpoints

## Enforcement
Agents MUST NOT proceed to next phase without creating checkpoint.
Checkpoint failure = abort workflow, report to user.
