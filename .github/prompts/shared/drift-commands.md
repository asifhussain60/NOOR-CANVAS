# drift.prompt.md - Commands Reference

This file contains all bash/PowerShell command examples extracted from `drift.prompt.md` for Rule #1 compliance (no code blocks in user-facing sections).

---

## Command 1: Drift Invocation Examples (Bash)

**Source:** Parameters section - Example usage

**Purpose:** Manual drift creation with different parameter patterns

```bash
@workspace /drift key=main-task -test description="Fix database connection timeout"
@workspace /drift key=ui-refresh -test severity=high "Button alignment issue"
```

**Usage Context:**
- `key=parent-key`: Specify parent key for drift tracking
- `-test`: Enable post-execution validation
- `severity={low|medium|high|critical}`: Manual severity classification
- Description: Free-form text describing drift issue

**References:**
- Drift Detection: drift.prompt.md Step 2
- Severity Classification: `.github/prompts/shared/drift-detector.md`

---

## Command 2: State Drift Tracking - Silent Registration (PowerShell)

**Source:** Step 2: Drift Registration - Auto-Detection Mode

**Purpose:** Track drift key in parent state.json (silent mode, no user interruption)

```powershell
Update-StateDriftKey -ParentKey $parent_key -DriftKey $drift_key -Severity $severity -Description $drift_description
```

**Usage Context:**
- Execute during auto-detection (silent mode)
- Also used during manual invocation (interactive mode)
- Appends to `driftKeys[]` array in parent state.json
- Enables drift queue tracking and stack depth monitoring

**References:**
- State Tracker: `.github/prompts/shared/state-tracker.ps1`
- Drift Stack: drift.prompt.md Step 3

---

## Command 3: State Drift Resolution Tracking (PowerShell)

**Source:** Step 8: Update Drift Work-Log - Update State Tracking

**Purpose:** Mark drift as resolved in parent state.json and log resolution commit

```powershell
# Mark drift resolved in parent state.json
Update-StateDriftKey -ParentKey $parent_key -DriftKey $drift_key -Resolved $true -ResolutionSha (git rev-parse --short HEAD)

# Log resolution commit
Update-StateCommit -Key $drift_key -Sha (git rev-parse --short HEAD) -Message "ckpt({drift-key}): Resolved - {summary}" -CheckpointType "drift-resolution"
```

**Usage Context:**
- Execute AFTER drift resolution commit
- BEFORE popping stack to resume parent context
- Updates resolved status with git SHA reference
- Enables drift resolution timeline reconstruction

**References:**
- Checkpoint Protocol: `.github/prompts/shared/task-exec/checkpoint-protocol.md`
- State Tracker: `.github/prompts/shared/state-tracker.ps1`

---

## Command 4: Simplified Drift Resolution Logging (PowerShell)

**Source:** Step 8 (After drift resolution commit) - Alternative simplified version

**Purpose:** Mark drift resolved and log resolution commit (simplified form)

```powershell
# Mark drift as resolved in parent state.json
Update-StateDriftKey -ParentKey $parent_key -DriftKey $drift_key -Resolved $true

# Log the resolution commit
Update-StateCommit -Key $drift_key -Sha (git rev-parse --short HEAD) -Message "ckpt({drift-key}): Resolved - {summary}" -CheckpointType "drift-resolution"
```

**Usage Context:**
- Same as Command 3 but without ResolutionSha parameter
- Used when git SHA captured separately by Update-StateCommit
- Avoids redundant git rev-parse calls

**Note:** Command 3 is preferred (explicit SHA tracking in drift key metadata).

---
