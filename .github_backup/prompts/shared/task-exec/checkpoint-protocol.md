# Checkpoint Protocol

**Purpose**: Create rollback points before task execution for safety and audit trail.

**When to Load**: Step 1 of task execution (MANDATORY - before any implementation).

**Integration Point**: Called by task.prompt.md, todo.prompt.md, plan.prompt.md at execution start.

---

## Overview

**Checkpoints provide:**
- Rollback capability if task introduces instability
- Audit trail for task execution history
- Parent commit linkage for lineage tracking
- Git tags for easy discovery and restoration

---

## Checkpoint Creation (Step 1)

### PowerShell Implementation

```powershell
# Step 1.1: Stage all changes and create checkpoint commit
git add -A
git commit -m "ckpt({key}): pre-task checkpoint"

# Step 1.2: Get short SHA for tracking
$sha = (git rev-parse --short HEAD).Trim()

# Step 1.3: Ensure key data stream directory exists
$keyDir = ".github/key-data-streams/{key}"
if (-not (Test-Path $keyDir)) {
    New-Item -ItemType Directory -Path $keyDir -Force | Out-Null
}

# Step 1.4: Create or update rollback index
$indexPath = Join-Path $keyDir "rollback-index.md"
if (-not (Test-Path $indexPath)) {
    @(
        "# Rollback Index for {key}",
        "",
        "| Date | Type | Summary | SHA | Parent |",
        "|------|------|---------|-----|--------|"
    ) | Set-Content -Path $indexPath -NoNewline:$false
}

# Step 1.5: Append checkpoint row to rollback index
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$parent = "-"  # First checkpoint has no parent
Add-Content $indexPath "| $timestamp | ckpt | pre-task checkpoint | $sha | $parent |"

# Step 1.6: Create git tag for easy discovery
$tagTimestamp = Get-Date -Format 'yyyyMMdd-HHmm'
$tagName = "key-{key}-ckpt-$tagTimestamp-$sha"
git tag $tagName

Write-Host "[INFO] Checkpoint created: $sha (tag: $tagName)"
```

### Bash Implementation (for non-Windows environments)

```bash
# Step 1.1: Stage and commit
git add -A
git commit -m "ckpt({key}): pre-task checkpoint"

# Step 1.2: Get short SHA
SHA=$(git rev-parse --short HEAD)

# Step 1.3: Ensure directory exists
mkdir -p .github/key-data-streams/{key}

# Step 1.4: Create rollback index if missing
INDEX=".github/key-data-streams/{key}/rollback-index.md"
if [ ! -f "$INDEX" ]; then
    cat > "$INDEX" << 'EOF'
# Rollback Index for {key}

| Date | Type | Summary | SHA | Parent |
|------|------|---------|-----|--------|
EOF
fi

# Step 1.5: Append checkpoint row
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "| $TIMESTAMP | ckpt | pre-task checkpoint | $SHA | - |" >> "$INDEX"

# Step 1.6: Create git tag
TAG_TS=$(date '+%Y%m%d-%H%M')
git tag "key-{key}-ckpt-$TAG_TS-$SHA"

echo "[INFO] Checkpoint created: $SHA"
```

---

## State Tracking Integration

**After checkpoint commit, log to state tracker:**

```powershell
# Source state tracker utility
. .github/prompts/shared/state-tracker.ps1

# Log checkpoint commit
Update-StateCommit `
    -Key "{key}" `
    -Sha $sha `
    -Message "ckpt({key}): pre-task checkpoint" `
    -Phase $phase `
    -CheckpointType "pre-task"
```

**Purpose:**
- Enables timeline reconstruction
- Links checkpoints to phases and requests
- Facilitates rollback discovery

---

## Rollback Index Format

**File**: `.github/key-data-streams/{key}/rollback-index.md`

```markdown
# Rollback Index for {key}

| Date | Type | Summary | SHA | Parent |
|------|------|---------|-----|--------|
| 2025-10-29 14:30:00 | ckpt | pre-task checkpoint | a3f5b9c | - |
| 2025-10-29 15:45:00 | task | Phase 1 - UI implementation | b2e4d7a | a3f5b9c |
| 2025-10-29 16:20:00 | test | Added E2E tests for feature | c9f1a3e | b2e4d7a |
| 2025-10-29 17:10:00 | ckpt | Phase 2 checkpoint | d4b8e2f | c9f1a3e |
| 2025-10-29 18:00:00 | task | Phase 2 - API integration | e7c3f9a | d4b8e2f |
```

**Columns:**
- **Date**: ISO timestamp (yyyy-MM-dd HH:mm:ss)
- **Type**: Commit type (ckpt, task, test, hc, doc, meta)
- **Summary**: Brief description of commit
- **SHA**: Git short SHA (7-8 characters)
- **Parent**: Previous checkpoint/commit SHA (for lineage tracking)

---

## Git Tag Format

**Pattern**: `key-{key}-ckpt-{yyyyMMdd-HHmm}-{short-sha}`

**Examples:**
- `key-canvas-ckpt-20251029-1430-a3f5b9c`
- `key-hcp-ckpt-20251029-1710-d4b8e2f`
- `key-user-landing-ckpt-20251029-2000-f8a2c1e`

**Benefits:**
- **Easy discovery**: `git tag -l "key-canvas-ckpt-*"`
- **Chronological sorting**: Date/time in tag name
- **SHA verification**: Embedded in tag name for quick reference
- **Key scoping**: Filter tags by workitem key

---

## Rollback Procedures

### Scenario 1: Rollback to Last Checkpoint

```powershell
# Find most recent checkpoint tag for key
$lastCheckpoint = git tag -l "key-{key}-ckpt-*" | Sort-Object -Descending | Select-Object -First 1

# Verify tag exists
if (-not $lastCheckpoint) {
    Write-Error "No checkpoint found for key: {key}"
    exit 1
}

# Extract SHA from tag (last component after dash)
$sha = $lastCheckpoint -replace '.*-([a-f0-9]+)$', '$1'

# Rollback (hard reset)
git reset --hard $sha

# Clean working directory
git clean -fd

Write-Host "[INFO] Rolled back to checkpoint: $sha ($lastCheckpoint)"
```

### Scenario 2: Rollback to Specific Checkpoint

```powershell
# User provides checkpoint SHA from rollback-index.md
$targetSha = "a3f5b9c"

# Verify SHA exists
$commit = git rev-parse --verify $targetSha 2>$null
if (-not $commit) {
    Write-Error "Invalid SHA: $targetSha"
    exit 1
}

# Rollback
git reset --hard $targetSha
git clean -fd

Write-Host "[INFO] Rolled back to: $targetSha"
```

### Scenario 3: Partial Rollback (Soft Reset)

```powershell
# Keep changes in working directory but undo commits
$targetSha = "a3f5b9c"

# Soft reset (preserves working directory)
git reset --soft $targetSha

# Changes from rolled-back commits are now staged
git status

Write-Host "[INFO] Soft rollback to: $targetSha (changes preserved)"
```

---

## Parent Linkage

**Purpose**: Track commit lineage for complex multi-phase work.

### On Checkpoint Creation

```powershell
# Get parent SHA (previous checkpoint or commit)
$parent = git log --oneline --grep "^ckpt\({key}\)" -n 1 --skip 1 | ForEach-Object { ($_ -split ' ')[0] }

if (-not $parent) {
    $parent = "-"  # No parent (first checkpoint)
}

# Include parent in rollback index row
Add-Content $indexPath "| $timestamp | ckpt | pre-task checkpoint | $sha | $parent |"
```

### On Task Completion

```powershell
# Task commit references latest checkpoint as parent
$parentSha = git log --oneline --grep "^ckpt\({key}\)" -n 1 | ForEach-Object { ($_ -split ' ')[0] }

# Commit with lineage
git commit -m "task({key}): Phase 1 - UI implementation [sha=$sha] [parent=$parentSha]"

# Update rollback index with parent linkage
Add-Content $indexPath "| $timestamp | task | Phase 1 - UI implementation | $sha | $parentSha |"
```

---

## Checkpoint Types

| Type | When Created | Purpose |
|------|--------------|---------|
| **pre-task** | Before task execution (Step 1) | Rollback point before changes |
| **pre-phase** | Before multi-phase work | Phase boundary marker |
| **post-validation** | After successful validation | Stable point after testing |
| **pre-merge** | Before merging feature branch | Clean merge point |

**Tag format includes type**:
- `key-{key}-ckpt-{type}-{timestamp}-{sha}`
- Example: `key-canvas-ckpt-pre-phase-20251029-1430-a3f5b9c`

---

## Error Handling

### Checkpoint Creation Failure

```powershell
try {
    git add -A
    git commit -m "ckpt({key}): pre-task checkpoint"
    $sha = (git rev-parse --short HEAD).Trim()
} catch {
    Write-Error "Failed to create checkpoint: $_"
    Write-Host "Possible causes:"
    Write-Host "  - No changes to commit (working directory clean)"
    Write-Host "  - Git repository not initialized"
    Write-Host "  - Permission issues"
    exit 1
}
```

### Rollback Index Update Failure

```powershell
try {
    Add-Content $indexPath "| $timestamp | ckpt | ... | $sha | $parent |"
} catch {
    Write-Warning "Failed to update rollback index: $_"
    Write-Host "Checkpoint commit succeeded but index update failed"
    Write-Host "Manually add entry to: $indexPath"
    # Continue execution (non-critical failure)
}
```

---

## Integration Notes

**Call this protocol:**
- **MANDATORY** Step 1 of task.prompt.md execution
- **OPTIONAL** Before risky operations (major refactoring, database migrations)
- **RECOMMENDED** At phase boundaries in multi-phase work

**Update after:**
- Task completion (append task row to rollback-index.md)
- Test generation (append test row to rollback-index.md)
- Health check execution (append hc row to rollback-index.md)

**Reference:**
- See task.prompt.md for main execution flow
- See database-access-rules.md for violation rollback procedures
- See state-tracker.ps1 for commit logging

---

## Best Practices

1. **Always create checkpoint before risky operations**
2. **Tag checkpoints with descriptive names**
3. **Maintain rollback index for audit trail**
4. **Use parent linkage for complex workflows**
5. **Test rollback procedures periodically**
6. **Document checkpoint strategy in work-log.md**
7. **Clean up old tags after work completion** (optional)

---

## Cleanup (Optional)

After successful task completion and merge to development:

```powershell
# List all checkpoint tags for completed key
git tag -l "key-{key}-ckpt-*"

# Delete checkpoint tags (optional - keeps history clean)
git tag -l "key-{key}-ckpt-*" | ForEach-Object { git tag -d $_ }

# Keep rollback-index.md for historical reference
# Do not delete .github/key-data-streams/{key}/rollback-index.md
```
