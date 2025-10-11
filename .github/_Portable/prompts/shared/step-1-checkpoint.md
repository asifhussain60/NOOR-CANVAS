# Step 1: Checkpoint Commit (Mandatory)

**Version**: 1.0.0  
**Purpose**: Create rollback point before making changes

---

## Overview

After cleaning server state (Step 0), create a **checkpoint commit** to ensure rollback capability if changes introduce instability.

**Why checkpoints are critical:**
- Safe rollback if changes break system
- Clear boundary between "before" and "after" states
- Audit trail for work tracking
- Multi-agent coordination reference points

---

## Execution

### 1.1. Create Checkpoint Commit

```bash
git add -A
git commit -m "checkpoint: pre-{agent} {context}"
```

### Commit Message Format

**Pattern:**
```
checkpoint: pre-{agent-name} {context-identifier}
```

**Examples by Agent:**

**Task Agent:**
```bash
git commit -m "checkpoint: pre-task user-authentication"
git commit -m "checkpoint: pre-task shopping-cart"
git commit -m "checkpoint: pre-task api-refactor"
```

**Refactor Agent:**
```bash
git commit -m "checkpoint: pre-refactor UserService"
git commit -m "checkpoint: pre-refactor data-layer"
git commit -m "checkpoint: pre-refactor all"
```

**Sync Agent:**
```bash
git commit -m "checkpoint: pre-sync documentation"
git commit -m "checkpoint: pre-sync cleanup"
git commit -m "checkpoint: pre-sync config-update"
```

**Health Check Agent:**
```bash
# Health check is read-only, but if validation triggers fixes:
git commit -m "checkpoint: pre-healthcheck-fixes"
```

**General:**
```bash
git commit -m "checkpoint: pre-{operation} {scope}"
```

---

### 1.2. Verify Checkpoint Created

```bash
git log -1 --oneline
```

**Expected Output:**
```
a1b2c3d checkpoint: pre-task user-authentication
```

---

### 1.3. Document Checkpoint SHA

**Option A: Automatic (in key metadata)**

If using key management system, add to key.json:

```json
{
  "key": "user-auth",
  "status": "in-progress",
  "checkpoints": [
    {
      "sha": "a1b2c3d",
      "timestamp": "2025-10-11T14:30:00Z",
      "agent": "task",
      "purpose": "pre-task implementation"
    }
  ]
}
```

**Option B: Manual (in work log)**

Add to `Workspaces/Copilot/_DOCS/work-log.md`:

```markdown
## 2025-10-11 14:30 - User Authentication Task

**Checkpoint:** a1b2c3d
**Agent:** task
**Scope:** Implementing login/logout functionality
```

---

## When to Create Checkpoints

### Required (Mandatory)

✅ **Before Task Implementation**
- New feature development
- Bug fixes
- Code modifications

✅ **Before Refactoring**
- Structural changes
- Code reorganization
- Performance improvements

✅ **Before Sync Operations**
- Documentation updates (if touching code)
- Configuration changes
- Cleanup operations

### Optional (Recommended)

⚠️ **Before Major Test Runs**
- If tests might modify data
- If running destructive tests

⚠️ **Before Experimental Changes**
- Trying new approach
- Uncertain about impact

### Not Required (Read-Only)

❌ **Question Agent** - Read-only, no changes
❌ **Health Check Agent** - Read-only validation (unless fixing issues)
❌ **Learning Agent** - Only updates pattern files

---

## Checkpoint Best Practices

### 1. Commit Before Starting Work

**BAD:**
```bash
# Start implementing
# Make changes
# Hours later, realize need checkpoint
git add -A
git commit -m "checkpoint: after changes" # Too late!
```

**GOOD:**
```bash
# Checkpoint FIRST
git add -A
git commit -m "checkpoint: pre-task user-auth"
# NOW start implementing
```

### 2. Use Descriptive Context

**BAD:**
```bash
git commit -m "checkpoint: pre-task stuff"
git commit -m "checkpoint: before"
```

**GOOD:**
```bash
git commit -m "checkpoint: pre-task user-authentication"
git commit -m "checkpoint: pre-refactor UserService.cs"
```

### 3. Checkpoint Clean State

**Ensure clean working directory:**
```bash
# Check status first
git status

# Stage all changes
git add -A

# Create checkpoint
git commit -m "checkpoint: pre-task feature-x"
```

### 4. One Checkpoint Per Operation

**Don't create multiple checkpoints for same operation:**

**BAD:**
```bash
git commit -m "checkpoint: pre-task user-auth"
# Do some work
git commit -m "checkpoint: pre-task user-auth again" # Confusing!
```

**GOOD:**
```bash
git commit -m "checkpoint: pre-task user-auth"
# Do work
# If need another checkpoint, use different context:
git commit -m "checkpoint: mid-task user-auth testing"
```

---

## Rollback Procedure

If changes introduce problems:

### Step 1: Identify Checkpoint

```bash
# View recent commits
git log --oneline -10

# Look for most recent checkpoint:
# a1b2c3d checkpoint: pre-task user-authentication
```

### Step 2: Verify Checkpoint

```bash
# Show commit details
git show a1b2c3d

# Ensure this is the correct safe point
```

### Step 3: Choose Rollback Method

#### Method A: Hard Reset (Discard All Changes)

**Use when:** Changes are broken, start over from scratch

```bash
# Hard reset to checkpoint
git reset --hard a1b2c3d

# Verify clean state
git status
# Should show: "nothing to commit, working tree clean"
```

⚠️ **WARNING:** This PERMANENTLY deletes all changes after checkpoint

#### Method B: Soft Reset (Keep Changes Unstaged)

**Use when:** Want to preserve work but undo commits

```bash
# Soft reset to checkpoint
git reset --soft a1b2c3d

# Check status
git status
# Changes still exist but are unstaged
```

#### Method C: Stash Changes (Preserve for Later)

**Use when:** Changes might be useful later

```bash
# Stash current work
git stash push -m "Failed attempt: user-auth implementation"

# Return to checkpoint
git reset --hard a1b2c3d

# Later, can retrieve stash
git stash list
git stash apply stash@{0}
```

---

## Automated Rollback

### Agent-Triggered Rollback

If agent detects critical failure:

```bash
# Automatic rollback script
# File: Workspaces/Global/rollback.sh

#!/bin/bash
CHECKPOINT=$(git log --oneline --grep="checkpoint: pre-" -1 --format="%H")

if [ -z "$CHECKPOINT" ]; then
    echo "ERROR: No checkpoint found"
    exit 1
fi

echo "Rolling back to checkpoint: $CHECKPOINT"
git reset --hard $CHECKPOINT
echo "Rollback complete"
```

**Usage:**
```bash
bash Workspaces/Global/rollback.sh
```

### Conditional Rollback

If specific conditions met (e.g., build fails 3 times):

```powershell
# PowerShell version
# File: Workspaces/Global/rollback.ps1

param(
    [string]$Key,
    [string]$Agent
)

$Checkpoint = git log --oneline --grep="checkpoint: pre-$Agent" -1 --format="%H"

if (-not $Checkpoint) {
    Write-Error "No checkpoint found for agent: $Agent"
    exit 1
}

Write-Host "Rolling back to checkpoint: $Checkpoint"
git reset --hard $Checkpoint
Write-Host "Rollback complete"
```

**Usage:**
```powershell
.\Workspaces\Global\rollback.ps1 -Agent "task" -Key "user-auth"
```

---

## Checkpoint Hygiene

### Cleanup Old Checkpoints

Checkpoints are temporary markers. After work is complete and committed:

**Option 1: Squash checkpoint commits**

```bash
# Interactive rebase to clean up
git rebase -i HEAD~10

# Mark checkpoint commits as "fixup" or "drop"
```

**Option 2: Keep for audit trail**

Leave checkpoints in history for troubleshooting and audit purposes.

**Recommendation:** Keep checkpoints until feature is merged/deployed, then squash.

---

## Multi-Agent Coordination

### Checkpoint Visibility

Other agents can find latest checkpoint:

```bash
# Find most recent checkpoint
git log --oneline --grep="checkpoint: pre-" -1

# Find agent-specific checkpoint
git log --oneline --grep="checkpoint: pre-task" -1
```

### Handoff Between Agents

When one agent completes and another starts:

**Task Agent completes:**
```bash
git commit -m "feat(user-auth): implement login functionality"
```

**Refactor Agent starts:**
```bash
# Creates new checkpoint
git commit -m "checkpoint: pre-refactor UserAuthService"
```

---

## Error Handling

### No Uncommitted Changes

If working directory is clean:

```bash
git status
# Nothing to commit, working tree clean

# Create empty checkpoint
git commit --allow-empty -m "checkpoint: pre-task clean-start"
```

### Failed Checkpoint Creation

If commit fails:

```bash
git commit -m "checkpoint: pre-task user-auth"
# ERROR: Author identity unknown

# Fix: Configure git
git config user.name "Your Name"
git config user.email "your@email.com"

# Retry
git commit -m "checkpoint: pre-task user-auth"
```

### Detached HEAD State

If in detached HEAD:

```bash
# Check current state
git status
# HEAD detached at a1b2c3d

# Create branch to preserve work
git checkout -b temp-checkpoint

# Checkpoint on branch
git commit -m "checkpoint: pre-task recovery"

# Return to main branch
git checkout main
```

---

## Integration with Validation Framework

### Checkpoint → Validation → Commit Pattern

**Complete workflow:**

```bash
# 0. Clean servers (from step-0-server-cleanup.md)
pkill -f "dotnet"

# 1. Create checkpoint
git add -A
git commit -m "checkpoint: pre-task user-auth"

# 2. Make changes
# ... implement feature ...

# 3. Validate
dotnet build
# If fails: rollback to checkpoint

# 4. Test
dotnet test
# If fails: rollback to checkpoint

# 5. Final commit (if validation passes)
git commit -m "feat(user-auth): implement login functionality"
```

---

## Summary

| Action | Command | Purpose |
|--------|---------|---------|
| Create checkpoint | `git commit -m "checkpoint: pre-{agent} {context}"` | Save rollback point |
| View checkpoints | `git log --grep="checkpoint: pre-"` | Find checkpoints |
| Hard rollback | `git reset --hard {sha}` | Discard all changes |
| Soft rollback | `git reset --soft {sha}` | Keep changes unstaged |
| Stash changes | `git stash push -m "..."` | Preserve for later |

**Remember:** Checkpoint BEFORE starting work, not after breaking things
