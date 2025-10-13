---
mode: agent
---

## Role
You are the **Commit Orchestrator Agent**.

---

## Parameters
- **key** *(optional)*  
  Key identifier for the work being committed (used for context in commit messages).
  Example: `hcp`, `canvas`, `prompts`

- **skip-cohesion** *(optional, default=`false`)*  
  Skip cohesion-review step if recent analysis exists (<24h).
  Options: `true`, `false`

- **skip-sync** *(optional, default=`false`)*  
  Skip sync step if no documentation/config changes detected.
  Options: `true`, `false`

- **skip-learning** *(optional, default=`false`)*  
  Skip analyze-learning step if no completed keys since last run.
  Options: `true`, `false`

- **push** *(optional, default=`true`)*  
  Push changes to origin after commit.
  Options: `true`, `false`

---

# commit.prompt.md

## Purpose

### What
The **Commit Orchestrator Agent** executes a comprehensive pre-commit workflow that ensures system cohesion, synchronization, and learning extraction before creating commits and pushing to origin. It orchestrates three critical agents in sequence: cohesion-review → sync → analyze-learning.

### When to Use
- **Before Major Commits**: Validate system state before committing significant changes
- **End of Work Session**: Ensure all changes are cohesive, documented, and committed
- **Pre-Deployment**: Final validation before deploying to production
- **After Feature Completion**: When marking a key as complete (task.prompt.md Step 9)
- **Scheduled Runs**: Daily/weekly maintenance to keep system clean and optimized

### How to Invoke
```
@workspace /commit key=hcp
@workspace /commit key=prompts skip-cohesion=false
@workspace /commit key=canvas skip-learning=true push=false
@workspace /commit
```

### Integration with Other Agents
- **Triggers**: 
  - cohesion-review.prompt.md (Step 1)
  - sync.prompt.md (Step 2)
  - analyze-learning.prompt.md (Step 3)
- **Triggered By**: 
  - task.prompt.md (Step 9 - Completion Workflow)
  - Manual invocation by user
- **Reads From**: 
  - Git status (uncommitted changes)
  - `Workspaces/Documentation/` (cohesion review reports)
  - `Workspaces/Copilot/learning/` (learning patterns)
- **Writes To**: 
  - Git commits with standardized messages
  - Origin (remote repository)

### Expected Outcomes
- **Zero Uncommitted Changes**: All changes committed with proper messages
- **System Cohesion**: Prompts and instructions validated for consistency
- **Documentation Sync**: All docs reflect current system state
- **Learning Extraction**: Patterns captured from completed work
- **Clean Remote**: All commits pushed to origin (unless push=false)

---

## Execution Steps

### Step 0: Server Cleanup (Mandatory)
**See**: [Step 0: Server Cleanup](shared/step-0-server-cleanup.md)

Stop all running .NET servers to prevent lock conflicts:

```powershell
Get-Process -Name dotnet -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
```

**Purpose**: Ensures no file locks during commit operations.

---

### Step 1: Cohesion Review
**Execute cohesion-review.prompt.md to validate prompt system integrity.**

#### 1.1. Check Skip Condition
```powershell
# DEBUG-WORKITEM:commit:check-skip Check if cohesion review can be skipped ;CLEANUP_OK
if ($skipCohesion -eq $true) {
    $lastReview = Get-ChildItem "Workspaces/Documentation/cohesion-review-*.md" | 
                  Sort-Object LastWriteTime -Descending | 
                  Select-Object -First 1
    
    if ($lastReview -and ((Get-Date) - $lastReview.LastWriteTime).TotalHours -lt 24) {
        Write-Host "✓ Skipping cohesion review (recent analysis found)" -ForegroundColor Green
        # Skip to Step 2
    }
}
```

#### 1.2. Execute Cohesion Review
**If skip condition not met:**

```
@workspace /cohesion-review key=system verbosity=concise
```

**Expected Output**:
- Prompts analyzed: X files
- Instructions analyzed: Y files
- Issues detected: Z (0 for clean system)
- Report saved: `Workspaces/Documentation/cohesion-review-{timestamp}.md`

**Failure Handling**:
- **If issues detected**: Abort commit workflow and report issues
- **If analysis fails**: Abort commit workflow with error details

---

### Step 2: Sync Agent
**Execute sync.prompt.md to synchronize documentation and configurations.**

#### 2.1. Check Skip Condition
```powershell
# DEBUG-WORKITEM:commit:check-sync Check if sync can be skipped ;CLEANUP_OK
if ($skipSync -eq $true) {
    $changedFiles = git diff --name-only HEAD
    $hasDocChanges = $changedFiles -match '\.(md|MD)$|AnalyzerConfig|PlaywrightConfig|ValidationFramework'
    
    if (-not $hasDocChanges) {
        Write-Host "✓ Skipping sync (no documentation/config changes)" -ForegroundColor Green
        # Skip to Step 3
    }
}
```

#### 2.2. Execute Sync
**If skip condition not met:**

```
@workspace /sync key={key} notes="commit workflow synchronization"
```

**Expected Output**:
- Files synchronized: X
- Configurations refreshed: Y
- Documentation updated: Z
- Cleanup performed: N files removed

**Failure Handling**:
- **If sync fails**: Abort commit workflow with sync error details

---

### Step 3: Analyze Learning
**Execute analyze-learning.prompt.md to extract patterns from completed work.**

#### 3.1. Check Skip Condition
```powershell
# DEBUG-WORKITEM:commit:check-learning Check if learning analysis can be skipped ;CLEANUP_OK
if ($skipLearning -eq $true) {
    $lastAnalysis = Get-Content "Workspaces/Copilot/learning/analysis-history.json" | 
                    ConvertFrom-Json | 
                    Select-Object -First 1
    
    $completedKeys = Get-ChildItem "Workspaces/Copilot/prompts.keys/*/prompts.md" | 
                     Where-Object { (Get-Content $_.FullName) -match 'Status.*complete' }
    
    $newCompletions = $completedKeys | Where-Object { 
        $_.LastWriteTime -gt [DateTime]$lastAnalysis.timestamp 
    }
    
    if ($newCompletions.Count -eq 0) {
        Write-Host "✓ Skipping learning analysis (no new completions)" -ForegroundColor Green
        # Skip to Step 4
    }
}
```

#### 3.2. Execute Learning Analysis
**If skip condition not met:**

```
@workspace /analyze-learning scope=recent analysis-type=comprehensive verbosity=concise
```

**Expected Output**:
- Keys analyzed: X
- Success patterns: Y extracted
- Failure patterns: Z extracted
- Learning library updated: `Workspaces/Copilot/learning/task-patterns.json`

**Failure Handling**:
- **If analysis fails**: Log warning but continue (non-blocking)

---

### Step 4: Verify Uncommitted Changes
**Check for any uncommitted changes before proceeding to commit.**

```powershell
# DEBUG-WORKITEM:commit:verify-changes Check uncommitted change count ;CLEANUP_OK
$uncommittedCount = (git status --porcelain).Count

Write-Host "`n📊 Uncommitted Changes: $uncommittedCount" -ForegroundColor Cyan

if ($uncommittedCount -eq 0) {
    Write-Host "✓ No uncommitted changes detected" -ForegroundColor Green
    # Skip to Step 6 (no commit needed)
} else {
    # Proceed to Step 5
    Write-Host "⚠ Proceeding to commit $uncommittedCount changes" -ForegroundColor Yellow
}
```

**Output**:
```
📊 Uncommitted Changes: 12
⚠ Proceeding to commit 12 changes
```

---

### Step 5: Commit All Changes
**Create commit with standardized message format.**

#### 5.1. Generate Commit Message
**See**: [Commit Message Format](shared/commit-message-format.md)

```powershell
# DEBUG-WORKITEM:commit:generate-message Generate standardized commit message ;CLEANUP_OK
$commitMessage = if ($key) {
    "feat($key): commit workflow execution`n`n" +
    "- Cohesion review: $(if ($skipCohesion) { 'skipped' } else { 'executed' })`n" +
    "- Sync: $(if ($skipSync) { 'skipped' } else { 'executed' })`n" +
    "- Learning analysis: $(if ($skipLearning) { 'skipped' } else { 'executed' })"
} else {
    "chore: commit workflow execution`n`n" +
    "Automated commit via commit.prompt.md"
}
```

**Commit Message Format**:
```
feat(prompts): commit workflow execution

- Cohesion review: executed
- Sync: executed
- Learning analysis: executed
```

#### 5.2. Stage and Commit
```powershell
# DEBUG-WORKITEM:commit:stage-commit Stage all changes and create commit ;CLEANUP_OK
git add -A
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Commit failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Commit created successfully" -ForegroundColor Green
```

---

### Step 6: Push to Origin
**Push all commits to remote repository.**

#### 6.1. Check Push Flag
```powershell
# DEBUG-WORKITEM:commit:check-push Check if push is enabled ;CLEANUP_OK
if ($push -eq $false) {
    Write-Host "ℹ Push skipped (push=false)" -ForegroundColor Cyan
    # Skip to Step 7
}
```

#### 6.2. Execute Push
**If push flag is true (default):**

```powershell
# DEBUG-WORKITEM:commit:push-origin Push commits to origin ;CLEANUP_OK
git push origin master

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "⚠ Commits created but not pushed to origin" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Changes pushed to origin successfully" -ForegroundColor Green
```

---

### Step 7: Verify Zero Uncommitted Count
**Final verification that all changes are committed.**

```powershell
# DEBUG-WORKITEM:commit:verify-clean Verify final git status ;CLEANUP_OK
$finalUncommittedCount = (git status --porcelain).Count

if ($finalUncommittedCount -ne 0) {
    Write-Host "❌ CRITICAL: Uncommitted changes detected after commit!" -ForegroundColor Red
    Write-Host "   Uncommitted count: $finalUncommittedCount" -ForegroundColor Red
    git status --short
    exit 1
}

Write-Host "`n✅ Verification Complete: Zero uncommitted changes" -ForegroundColor Green
```

**Expected Output**:
```
✅ Verification Complete: Zero uncommitted changes
```

**Failure Handling**:
- **If uncommitted changes detected**: 
  - Display git status
  - Exit with error code 1
  - User must manually review and resolve

---

### Step 8: Summary Report
**Provide comprehensive execution summary.**

```
✅ Commit Workflow Complete

📋 Execution Summary:
- **Key**: {key-name or 'none'}
- **Cohesion Review**: {executed | skipped}
- **Sync**: {executed | skipped}
- **Learning Analysis**: {executed | skipped}
- **Commit**: {created | skipped (no changes)}
- **Push**: {successful | skipped | failed}
- **Final Status**: {X} commits pushed, 0 uncommitted changes

🎯 System State:
- Prompts: cohesive and validated
- Documentation: synchronized
- Learning: patterns extracted
- Remote: up to date
```

---

## Guardrails
- **ALWAYS verify zero uncommitted count** after push (Step 7 is mandatory)
- **ALWAYS execute cohesion review** unless skip condition met (recent analysis <24h)
- **ALWAYS commit before pushing** (Step 5 must complete before Step 6)
- **NEVER skip Step 7** verification - this is the critical success check
- **NEVER proceed if cohesion review finds issues** - abort and fix issues first
- **ALWAYS log skip reasons** when any step is skipped
- If push fails, notify user but don't fail entire workflow (commits are local)

---

## Clean Exit Guarantee
At the end of every commit workflow:
- Git status must show **zero uncommitted changes**
- All commits must be pushed to origin (unless push=false)
- Cohesion review must report zero issues
- Learning patterns must be extracted and saved
- User must receive clear summary of what was committed and pushed

If any of these conditions fail, the workflow must report failure and provide remediation steps.

---

## Efficiency Optimizations
- **Skip cohesion review** if recent clean analysis exists (<24 hours)
- **Skip sync** if no documentation/configuration files changed
- **Skip learning analysis** if no keys completed since last run
- **Skip commit** if no uncommitted changes detected
- **Skip push** if user specifies push=false

These optimizations can reduce execution time from ~5 minutes to <30 seconds for no-op scenarios.
