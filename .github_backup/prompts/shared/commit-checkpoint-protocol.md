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
# MANDATORY: Checkpoint commit after Phase N completion

# Step 1: Verify all changes are included
Write-Host "📋 Checking for uncommitted changes..." -ForegroundColor Cyan
$uncommittedCount = (git status --porcelain | Measure-Object).Count

IF ($uncommittedCount -eq 0) {
    Write-Host "⚠️  WARNING: No uncommitted changes detected!" -ForegroundColor Yellow
    Write-Host "   If phase work was done, ensure files are staged." -ForegroundColor Yellow
    EXIT 1
}

Write-Host "✅ Found $uncommittedCount uncommitted changes" -ForegroundColor Green
git status --short
Write-Host ""

# Step 2: Stage all changes
git add -A

# Step 3: Create detailed commit message
$commitMessage = @"
ckpt({key}): Phase {N} - {brief-description}

Changes:
- {change-1} (file: {path/to/file1})
- {change-2} (file: {path/to/file2})
- {change-3} (file: {path/to/file3})

Cleanup:
- {cleanup-item-1} ;CLEANUP_OK
- {cleanup-item-2} ;CLEANUP_OK

Impact:
- Affects: {affected-components}
- Breaking changes: {Yes/No}
- Tests updated: {Yes/No}

Workitem: {key}
Phase: {N}/{total-phases}
"@

# Step 4: Commit with detailed message
git commit -m $commitMessage

# Step 5: Capture SHA for rollback tracking
$sha = (git rev-parse --short HEAD).Trim()
Write-Host "✅ Checkpoint created: $sha" -ForegroundColor Green

# Step 6: MANDATORY PUSH - Push immediately to origin
Write-Host "📤 Pushing to origin..." -ForegroundColor Cyan
git push origin development

IF ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Phase {N} pushed to origin successfully" -ForegroundColor Green
} ELSE {
    Write-Host "❌ ERROR: Failed to push to origin!" -ForegroundColor Red
    Write-Host "   Phase cannot be marked complete until pushed." -ForegroundColor Red
    EXIT 1
}

# Step 7: Verify clean working directory
$finalUncommittedCount = (git status --porcelain | Measure-Object).Count
IF ($finalUncommittedCount -gt 0) {
    Write-Host "⚠️  WARNING: $finalUncommittedCount uncommitted changes remain!" -ForegroundColor Yellow
    git status --short
}
```

## Commit Message Format
```
ckpt({key}): Phase {N} - {one-line-summary}

Changes:
- Specific change 1 (file: path/to/file.cs)
- Specific change 2 (file: path/to/file.razor)
- Specific change 3 (file: path/to/config.json)

Cleanup:
- Removed obsolete code in ComponentX ;CLEANUP_OK
- Deleted deprecated method OldFunction() ;CLEANUP_OK
- Updated comments for clarity

Impact:
- Affects: {component/feature names}
- Breaking changes: {Yes/No - describe if yes}
- Tests updated: {Yes/No}

Workitem: {key}
Phase: {N}/{total-phases}
```

## Detailed Commit Message Requirements

### MANDATORY Fields (BLOCKING)
1. **Header Line**: `ckpt({key}): Phase {N} - {one-line-summary}`
   - Must be ≤72 characters
   - Must follow exact format
   - Must include key in parentheses

2. **Changes Section**: List ALL files modified with brief description
   - Format: `- {description} (file: {relative-path})`
   - Include file paths for traceability
   - Group related changes together

3. **Cleanup Section**: Document ALL code cleanup with ;CLEANUP_OK tags
   - Mark removed obsolete code
   - Note deleted deprecated methods/classes
   - Document refactored sections
   - EVERY cleanup item MUST have ;CLEANUP_OK tag

4. **Impact Section**: Describe ripple effects
   - List affected components/features
   - Note any breaking changes (CRITICAL)
   - Confirm tests updated (Yes/No)

5. **Footer Metadata**: Workitem and Phase tracking
   - Workitem: {key}
   - Phase: {N}/{total-phases}

### Example (Good)
```
ckpt(qa-btn-resize): Phase 1 - Resize Q&A button

Changes:
- Increased button size from 44px to 66px (file: Components/QAButton.razor)
- Increased icon size from 1.25rem to 2rem (file: Components/QAButton.razor.css)
- Updated button hover effects for new size (file: wwwroot/css/qa-styles.css)

Cleanup:
- Removed obsolete size variable $qa-btn-legacy-size ;CLEANUP_OK
- Deleted deprecated .qa-btn-small CSS class ;CLEANUP_OK
- Updated comments to reflect new button sizing standards

Impact:
- Affects: Q&A panel, mobile responsive layout
- Breaking changes: None
- Tests updated: Yes (added visual regression test)

Workitem: qa-btn-resize
Phase: 1/4
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

## Enforcement (MANDATORY - BLOCKING)

**⚠️ CRITICAL RULES:**

1. **NO phase can proceed without a checkpoint commit**
   - Agent MUST create commit after EVERY phase
   - Agent MUST verify commit exists before continuing
   - Agent MUST push to origin immediately after commit

2. **NO work can be marked complete with uncommitted changes**
   - Final `git status` MUST show clean working directory
   - Uncommitted count MUST be exactly ZERO
   - Agent MUST halt if any uncommitted files detected

3. **Commit message format is NON-NEGOTIABLE**
   - MUST follow exact template
   - MUST include Changes, Cleanup, Impact sections
   - MUST use ;CLEANUP_OK tags for all cleanup items
   - MUST include file paths for traceability

4. **Push to origin is MANDATORY**
   - EVERY commit MUST be pushed immediately
   - Agent MUST verify push succeeded (check exit code)
   - Agent MUST retry push on failure or abort phase

### Verification Algorithm

```powershell
FUNCTION VerifyPhaseCommit(key, phase, totalPhases)
    
    // 1. Check for uncommitted changes BEFORE commit
    uncommittedBefore = (git status --porcelain | Measure-Object).Count
    IF uncommittedBefore == 0 THEN
        HALT("No changes detected for Phase {phase} - cannot create empty commit")
    END IF
    
    // 2. Create commit with detailed message
    CreateDetailedCommit(key, phase, totalPhases)
    
    // 3. Verify commit was created
    recentCommit = git log -1 --oneline --grep="ckpt({key}): Phase {phase}"
    IF NOT recentCommit THEN
        HALT("Failed to create commit for Phase {phase}")
    END IF
    
    // 4. Push to origin
    git push origin development
    IF $LASTEXITCODE != 0 THEN
        HALT("Failed to push Phase {phase} to origin - cannot proceed")
    END IF
    
    // 5. Verify clean working directory
    uncommittedAfter = (git status --porcelain | Measure-Object).Count
    IF uncommittedAfter > 0 THEN
        WARN("Phase {phase} commit created but {uncommittedAfter} files remain uncommitted")
    END IF
    
    RETURN SUCCESS
    
END FUNCTION
```

### Failure Handling

**If commit creation fails:**
- HALT execution immediately
- Report error to user with details
- DO NOT proceed to next phase
- Provide rollback command

**If push to origin fails:**
- HALT execution immediately
- Show git push error output
- Ask user to resolve (network issue, conflicts, etc.)
- Retry push after user confirms resolution

**If uncommitted changes remain at completion:**
- BLOCK "mark complete" operation
- Show `git status --short` output
- Force user to commit or explain why files should be ignored
- Verify again after user action

Agents MUST NOT proceed to next phase without creating checkpoint.
Agents MUST NOT mark work complete without clean git status.
Checkpoint failure = abort workflow, report to user.
