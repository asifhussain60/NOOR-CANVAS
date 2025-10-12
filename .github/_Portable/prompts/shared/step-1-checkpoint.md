# Step 1: Checkpoint Commit (Mandatory)

**Version**: 1.0.0  
**Last Updated**: 2025-10-11  
**Purpose**: Create rollback point before making changes

---

## Overview

After killing servers (Step 0), create a **checkpoint commit** (or equivalent snapshot) to ensure rollback capability if the task introduces instability.

---

## Execution

### 1.1. Create Checkpoint Commit

```bash
git add -A
git commit -m "checkpoint: pre-{agent} {key}"
```

**Commit Message Format**:
- `checkpoint: pre-task {key}` - For task agent
- `checkpoint: pre-refactor {scope}` - For refactor agent
- `checkpoint: pre-sync {key}` - For sync agent
- `checkpoint: pre-{agent-name} {context}` - General pattern

**Examples**:
```bash
git commit -m "checkpoint: pre-task canvas"
git commit -m "checkpoint: pre-refactor HtmlParsingService"
git commit -m "checkpoint: pre-sync hcp"
git commit -m "checkpoint: pre-cohesion-review"
```

### 1.2. Verify Checkpoint Created

```bash
git log -1 --oneline
```

**Expected Output**:
```
a1b2c3d checkpoint: pre-task canvas
```

### 1.3. Document Checkpoint SHA

Store the checkpoint SHA for potential rollback:
- Add to key metadata's "Execution Tracking" → "Commits"
- Reference in work-log.md if tracking detailed execution

---

## Rationale

**Why checkpoint commits are critical**:
1. **Rollback Safety**: If changes break the system, `git reset --hard {checkpoint-sha}` restores clean state
2. **Change Isolation**: Clear boundary between "before" and "after" states
3. **Audit Trail**: Documents when work started for a specific task/key
4. **Multi-Agent Coordination**: Other agents can identify safe rollback points

**When NOT to checkpoint**:
- Read-only operations (question, healthcheck, analyze-learning agents)
- Already at clean state with no uncommitted changes

---

## Rollback Procedure

If task fails or introduces breaking changes:

```bash
# View recent commits
git log --oneline -5

# Identify checkpoint commit
# Example: a1b2c3d checkpoint: pre-task canvas

# Hard reset to checkpoint
git reset --hard a1b2c3d

# Verify clean state
git status
```

**Clean up uncommitted work** (alternative to hard reset):
```bash
git stash push -m "Failed attempt: {description}"
```

---

## Usage

This step should be included in any prompt that:
- Modifies code (implementation, refactoring, synchronization)
- Creates/deletes files
- Updates configurations

**Do NOT checkpoint** for:
- Read-only agents (question, healthcheck, analyze-learning)
- Analysis tasks that don't modify files

**Reference this module** in your prompt:
```markdown
### 1. Checkpoint Commit (Mandatory)
**See**: [Step 1: Checkpoint](shared/step-1-checkpoint.md)
```

OR **Include inline**:
```markdown
### 1. Checkpoint Commit (Mandatory)
Create checkpoint: `git commit -m "checkpoint: pre-{agent} {key}"`
Ensures rollback capability. See shared/step-1-checkpoint.md for details.
```

---

## Integration with Key Metadata

After creating checkpoint, update key metadata:

**In `{key}.md` Execution Tracking section**:
```markdown
### Commits
- `a1b2c3d` - checkpoint: pre-task canvas
- Pending: Implementation commit
```

**In `work-log.md`**:
```markdown
## 2025-10-11 14:30 - Task Started

**Checkpoint**: a1b2c3d (`checkpoint: pre-task canvas`)

### Plan
- Implement delete button for questions
- Add confirmation dialog
- Create E2E test
```

---

## Version History

- **v1.0.0** (2025-10-11): Initial extraction from task.prompt.md
  - Canonical checkpoint procedure
  - Commit message format patterns
  - Rollback procedures
  - Integration with key metadata
