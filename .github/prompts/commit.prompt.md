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

- **skip-refactor** *(optional, default=`false`)*  
  Skip refactor step if no code changes detected or code quality already optimal.
  Options: `true`, `false`

- **push** *(optional, default=`true`)*  
  Push changes to origin after commit.
  Options: `true`, `false`

---

# commit.prompt.md

## Purpose

### What
The **Commit Orchestrator Agent** executes a comprehensive pre-commit workflow that ensures system cohesion, synchronization, learning extraction, and code quality before creating commits and pushing to origin. It orchestrates four critical agents in sequence: cohesion-review → sync → analyze-learning → refactor.

**IMPORTANT**: Validation steps (cohesion review, sync, learning analysis, refactor) execute on **ALL CODE** in the workspace, regardless of whether there are uncommitted changes. Only the git commit/push steps are conditional on having uncommitted changes.

### When to Use
- **Before Major Commits**: Validate system state before committing significant changes
- **End of Work Session**: Ensure all changes are cohesive, documented, and committed
- **Pre-Deployment**: Final validation before deploying to production
- **After Feature Completion**: When marking a key as complete (task.prompt.md Step 9)
- **Scheduled Runs**: Daily/weekly maintenance to keep system clean and optimized
- **System Validation**: Anytime you want to validate the entire codebase (even with zero uncommitted changes)

### How to Invoke
```
@workspace /commit key=hcp
@workspace /commit key=prompts skip-cohesion=false
@workspace /commit key=canvas skip-learning=true push=false
@workspace /commit skip-refactor=true
@workspace /commit
```

### Integration with Other Agents
- **Triggers**: 
  - cohesion-review.prompt.md (Step 1)
  - sync.prompt.md (Step 2)
  - analyze-learning.prompt.md (Step 3)
  - refactor.prompt.md (Step 3.5)
- **Triggered By**: 
  - task.prompt.md (Step 9 - Completion Workflow)
  - Manual invocation by user
- **Reads From**: 
  - Git status (uncommitted changes)
  - `Workspaces/Documentation/` (cohesion review reports)
  - `.github/learning/` (learning patterns)
- **Writes To**: 
  - Git commits with standardized messages
  - Origin (remote repository)

### Expected Outcomes
- **Zero Uncommitted Changes**: All changes committed with proper messages
- **System Cohesion**: Prompts and instructions validated for consistency
- **Documentation Sync**: All docs reflect current system state
- **Learning Extraction**: Patterns captured from completed work
- **Code Quality**: Refactored code meets all analyzer standards (zero errors, zero warnings)
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
    $lastReview = Get-ChildItem ".github/reports/cohesion-review-*.md" | 
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
- Report saved: `.github/reports/cohesion-review-{timestamp}.md`

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
    Write-Host "✓ Skipping sync (skip-sync=true parameter provided)" -ForegroundColor Green
    # Skip to Step 3
}
```

**Note**: Sync now runs on ALL documentation and configuration files, not just uncommitted changes. Use `skip-sync=true` to explicitly skip this step.

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
    Write-Host "✓ Skipping learning analysis (skip-learning=true parameter provided)" -ForegroundColor Green
    # Skip to Step 3.5
}
```

**Note**: Learning analysis now runs on ALL keys in the workspace to extract patterns, regardless of recent completions. Use `skip-learning=true` to explicitly skip this step.

#### 3.2. Execute Learning Analysis
**If skip condition not met:**

```
@workspace /analyze-learning scope=recent analysis-type=comprehensive verbosity=concise
```

**Expected Output**:
- Keys analyzed: X
- Success patterns: Y extracted
- Failure patterns: Z extracted
- Learning library updated: `.github/learning/task-patterns.json`

**Failure Handling**:
- **If analysis fails**: Log warning but continue (non-blocking)

---

### Step 3.5: Refactor Agent
**Execute refactor.prompt.md to improve code quality and structural integrity.**

#### 3.5.1. Check Skip Condition
```powershell
# DEBUG-WORKITEM:commit:check-refactor Check if refactor can be skipped ;CLEANUP_OK
if ($skipRefactor -eq $true) {
    Write-Host "✓ Skipping refactor (skip-refactor=true parameter provided)" -ForegroundColor Green
    # Skip to Step 4
}
```

**Note**: Refactor now runs on ALL code in the workspace to ensure quality standards, regardless of uncommitted changes. Use `skip-refactor=true` to explicitly skip this step.

#### 3.5.2. Execute Refactor
**If skip condition not met:**

```
@workspace /refactor key={key} scope=all notes="pre-commit quality improvements"
```

**Expected Output**:
- Files analyzed: X (entire codebase)
- Refactorings applied: Y
- Build status: Clean (0 errors, 0 warnings)
- Validation: All 6 levels passed
- Patterns updated: refactor-patterns.json

**Failure Handling**:
- **If refactor fails**: Abort commit workflow with refactor error details
- **If warnings persist**: Abort and require manual resolution
- **If validation fails**: Rollback to checkpoint and abort

**Benefits**:
- Ensures code quality meets standards before commit
- Catches analyzer violations early
- Maintains zero-error, zero-warning policy
- Extracts refactoring patterns for future use

---

### Step 4: Key Data Stream Cleanup
**Optimize prompts.keys data streams by removing redundancies and extracting reusable patterns.**

#### 4.1. Scan All Key Data Streams
```powershell
# Locate all key metadata files
$keyFiles = Get-ChildItem ".github/prompts.keys/*/*.md" -Include "*prompts.md", "*analysis.md", "*notes.md" -Recurse

Write-Host "`n🔍 Key Data Streams Found: $($keyFiles.Count)" -ForegroundColor Cyan
```

#### 4.2. Analyze for Redundancies
**For each key data stream, identify:**

1. **Duplicate Information**: Same content repeated in multiple sections
2. **Outdated Business Rules**: References to deprecated features or workflows
3. **Verbose Formatting**: Excessive whitespace, redundant headers, repetitive descriptions
4. **Extractable Patterns**: Common patterns that should be in shared/Links folders

**Example Redundancies to Remove**:
```markdown
❌ REDUNDANT:
## File Mappings
### Frontend (Views)
- N/A - No frontend views involved
### Frontend (Components)  
- N/A - No frontend components involved
### Backend (Controllers)
- N/A - No backend controllers involved

✅ COMPACT:
## File Mappings
- **Scope**: Documentation only (no frontend/backend changes)
```

**Example Outdated Business Rules**:
```markdown
❌ OUTDATED:
- Annotation system integration (removed in Issue #67)
- Legacy vote counting logic (replaced by VotingService)

✅ REMOVE: Delete references to deleted features
```

#### 4.3. Extract to Links/Shared
**Move reusable content to appropriate shared locations:**

1. **Common Patterns → `.github/instructions/Links/`**
   - Infrastructure references
   - Standard workflows
   - Cross-cutting concerns

2. **Prompt Boilerplate → `.github/prompts/shared/`**
   - Step templates
   - Commit message formats
   - Validation procedures

3. **Key Templates → `Workspaces/Copilot/prompts.keys/_template/`**
   - Standard key structure
   - Metadata schema
   - Work log format

**Example Extraction**:
```markdown
# Before (in prompts.md):
## Commit Message Format
feat(prompts): {description}
- Changes: {list}
- Tests: {status}

# After (in shared/commit-message-format.md):
[Complete template with examples]

# Reference in prompts.md:
**See**: [Commit Message Format](shared/commit-message-format.md)
```

#### 4.4. Compact Key Structure
**Apply compaction rules:**

1. **Consolidate Empty Sections**: Replace multiple "N/A" entries with single scope statement
2. **Merge Related Metadata**: Combine fragmented information
3. **Remove Verbose Headers**: Use concise section titles
4. **Deduplicate Lists**: Merge repeated file references

**Compaction Example**:
```markdown
# Before (78 lines):
## File Mappings
### Frontend (Views)
- Path/To/View1.razor - Description
- Path/To/View2.razor - Description
### Frontend (Components)
- Path/To/Component1.razor - Description
...
### Documentation
- Doc1.md - Description
- Doc2.md - Description
...

# After (32 lines):
## File Mappings
- **Frontend**: View1.razor (description), View2.razor (description), Component1.razor (description)
- **Documentation**: Doc1.md, Doc2.md
```

#### 4.5. Execute Cleanup
```powershell
foreach ($keyFile in $keyFiles) {
    $content = Get-Content $keyFile.FullName -Raw
    
    # Check if cleanup needed
    $hasRedundancies = $content -match 'N/A - No \w+ \w+ involved' -or
                       $content -match 'Description:.*Description:' -or
                       $content.Length -gt 10000  # Verbose files
    
    if ($hasRedundancies) {
        Write-Host "  📝 Cleaning: $($keyFile.Name)" -ForegroundColor Yellow
        
        # Apply cleanup transformations
        # (Implementation would use regex/string operations)
        
        # Optionally commit cleanup
        git add $keyFile.FullName
    } else {
        Write-Host "  ✓ Clean: $($keyFile.Name)" -ForegroundColor Green
    }
}
```

**Expected Output**:
```
🔍 Key Data Streams Found: 42
  ✓ Clean: canvas.md
  📝 Cleaning: prompts.md (redundant N/A sections)
  📝 Cleaning: hcp.md (outdated business rules)
  ✓ Clean: sync.md
...
✅ Cleanup Complete: 12 files optimized, 30 files clean
```

#### 4.6. Update Links/Shared Folders
**After extraction, update reference files:**

1. **Update SystemStructureSummary.md** with new Links files
2. **Update ReferenceIndex.md** with extracted patterns
3. **Regenerate FileMetrics.md** with compacted sizes
4. **Update key-template.md** with compact format

**Commit extracted content separately**:
```powershell
git add .github/instructions/Links/
git add .github/prompts/shared/
git commit -m "docs: extract common patterns from key data streams"
```

#### 4.7. Debug Logging Cleanup
**Remove all debug logging markers created by task.prompt.md before committing to production.**

**Purpose**: Ensure production code is clean of all debug markers inserted during development.

**Execution Steps**:

1. **Search for Debug Markers**:
   ```powershell
   # Search for all files containing DEBUG-WORKITEM markers
   $debugFiles = Get-ChildItem -Path "SPA/", "Tests/", "Scripts/" -Recurse -Include "*.cs", "*.razor", "*.js", "*.ts" |
       Where-Object { (Get-Content $_.FullName -Raw) -match '\[DEBUG-WORKITEM:.*\] ;CLEANUP_OK' }
   
   Write-Host "`n🔍 Files with Debug Markers: $($debugFiles.Count)" -ForegroundColor Cyan
   ```

2. **Display Debug Marker Summary**:
   ```powershell
   foreach ($file in $debugFiles) {
       $content = Get-Content $file.FullName -Raw
       $markers = ([regex]::Matches($content, '\[DEBUG-WORKITEM:([^:]+):[^\]]+\]')).Groups |
                  Where-Object { $_.Index -gt 0 } | Select-Object -ExpandProperty Value -Unique
       
       Write-Host "  📝 $($file.Name): $($markers.Count) unique marker(s)" -ForegroundColor Yellow
   }
   ```

3. **Remove Debug Markers**:
   ```powershell
   foreach ($file in $debugFiles) {
       $content = Get-Content $file.FullName -Raw
       $originalContent = $content
       
       # Remove C# Logger statements
       $content = $content -replace 'Logger\.Log\w+\(\s*\[DEBUG-WORKITEM:[^\]]+\][^\n]*;CLEANUP_OK[^\n]*\);?\s*\n?', ''
       
       # Remove JavaScript console statements
       $content = $content -replace 'console\.\w+\(`?\[DEBUG-WORKITEM:[^\]]+\][^\n]*;CLEANUP_OK[^`\n]*`?\);?\s*\n?', ''
       
       # Remove standalone comment lines
       $content = $content -replace '^\s*//\s*\[?DEBUG-WORKITEM:[^\n]*;CLEANUP_OK[^\n]*\n?', '', 'Multiline'
       $content = $content -replace '^\s*/\*\s*DEBUG-WORKITEM:[^\*]*;CLEANUP_OK[^\*]*\*/\s*\n?', '', 'Multiline'
       
       # Remove DBG log statements
       $content = $content -replace 'Logger\.LogDebug\(\s*\[DEBUG-WORKITEM:[^\]]+\][^\n]*;CLEANUP_OK[^\n]*\);?\s*\n?', ''
       
       if ($content -ne $originalContent) {
           Set-Content -Path $file.FullName -Value $content -NoNewline
           Write-Host "  ✅ Cleaned: $($file.Name)" -ForegroundColor Green
       }
   }
   ```

4. **Verify Cleanup**:
   ```powershell
   # Re-scan for any remaining markers
   $remainingMarkers = Get-ChildItem -Path "SPA/", "Tests/", "Scripts/" -Recurse -Include "*.cs", "*.razor", "*.js", "*.ts" |
       Where-Object { (Get-Content $_.FullName -Raw) -match '\[DEBUG-WORKITEM:.*\] ;CLEANUP_OK' }
   
   if ($remainingMarkers.Count -eq 0) {
       Write-Host "`n✅ Debug Marker Cleanup Complete - Zero markers remaining" -ForegroundColor Green
   } else {
       Write-Host "`n⚠️ Warning: $($remainingMarkers.Count) files still contain debug markers" -ForegroundColor Yellow
       foreach ($file in $remainingMarkers) {
           Write-Host "  - $($file.FullName)" -ForegroundColor Red
       }
   }
   ```

5. **Stage Cleaned Files**:
   ```powershell
   if ($debugFiles.Count -gt 0) {
       git add $debugFiles
       Write-Host "`n✅ Staged $($debugFiles.Count) cleaned files" -ForegroundColor Green
   }
   ```

**Expected Output**:
```
🔍 Files with Debug Markers: 8
  📝 SessionCanvas.razor: 12 unique marker(s)
  📝 HostControlPanel.razor: 8 unique marker(s)
  📝 QuestionController.cs: 6 unique marker(s)
  ✅ Cleaned: SessionCanvas.razor
  ✅ Cleaned: HostControlPanel.razor
  ✅ Cleaned: QuestionController.cs
  ...
✅ Debug Marker Cleanup Complete - Zero markers remaining
✅ Staged 8 cleaned files
```

**Patterns Removed**:
- `Logger.LogInformation("[DEBUG-WORKITEM:scope:context] message ;CLEANUP_OK", ...)`
- `Logger.LogDebug("[DEBUG-WORKITEM:scope:context] message ;CLEANUP_OK", ...)`
- `console.log("[DEBUG-WORKITEM:scope:context] message ;CLEANUP_OK")`
- `// DEBUG-WORKITEM:scope:context message ;CLEANUP_OK`
- `/* DEBUG-WORKITEM:scope:context message ;CLEANUP_OK */`

**See Also**: [Debug Logging Mandate](shared/debug-logging-mandate.md) for complete marker patterns

---

### Step 5: Verify Uncommitted Changes
**Check for any uncommitted changes before proceeding to commit.**

```powershell
# DEBUG-WORKITEM:commit:verify-changes Check uncommitted change count ;CLEANUP_OK
$uncommittedCount = (git status --porcelain).Count

Write-Host "`n📊 Uncommitted Changes: $uncommittedCount" -ForegroundColor Cyan

if ($uncommittedCount -eq 0) {
    Write-Host "✓ No uncommitted changes detected - Skipping git operations" -ForegroundColor Green
    # Skip to Step 9 (Summary Report)
    # Note: Validation steps (1-4) already executed on entire codebase
} else {
    # Proceed to Step 6
    Write-Host "⚠ Proceeding to commit $uncommittedCount changes" -ForegroundColor Yellow
}
```

**Output**:
```
📊 Uncommitted Changes: 12
⚠ Proceeding to commit 12 changes
```

**OR**:

```
📊 Uncommitted Changes: 0
✓ No uncommitted changes detected - Skipping git operations
```

**Note**: If no uncommitted changes exist, Steps 6-8 are automatically skipped, but validation steps (1-4) have already run on the entire codebase.

---

### Step 6: Commit All Changes
**Create commit with standardized message format.**

#### 6.1. Generate Commit Message
**See**: [Commit Message Format](shared/commit-message-format.md)

```powershell
# DEBUG-WORKITEM:commit:generate-message Generate standardized commit message ;CLEANUP_OK
$commitMessage = if ($key) {
    "feat($key): commit workflow execution`n`n" +
    "- Cohesion review: $(if ($skipCohesion) { 'skipped' } else { 'executed' })`n" +
    "- Sync: $(if ($skipSync) { 'skipped' } else { 'executed' })`n" +
    "- Learning analysis: $(if ($skipLearning) { 'skipped' } else { 'executed' })`n" +
    "- Refactor: $(if ($skipRefactor) { 'skipped' } else { 'executed' })"
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
- Refactor: executed
```

#### 6.2. Stage and Commit
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

### Step 7: Push to Origin
**Push all commits to remote repository.**

#### 7.1. Check Push Flag
```powershell
# DEBUG-WORKITEM:commit:check-push Check if push is enabled ;CLEANUP_OK
if ($push -eq $false) {
    Write-Host "ℹ Push skipped (push=false)" -ForegroundColor Cyan
    # Skip to Step 7
}
```

#### 7.2. Execute Push
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

### Step 8: Verify Zero Uncommitted Count
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

### Step 9: Summary Report
**Provide comprehensive execution summary.**

```
✅ Commit Workflow Complete

📋 Execution Summary:
- **Key**: {key-name or 'none'}
- **Cohesion Review**: {executed on all prompts/instructions | skipped}
- **Sync**: {executed on all docs/configs | skipped}
- **Learning Analysis**: {executed on all keys | skipped}
- **Refactor**: {executed on all code | skipped}
- **Key Cleanup**: {executed | skipped}
- **Debug Cleanup**: {executed | skipped}
- **Commit**: {created | skipped (no uncommitted changes)}
- **Push**: {successful | skipped | failed}
- **Final Status**: {X} commits pushed OR validation complete with 0 uncommitted changes

🎯 System State:
- Prompts: {validated on entire system | skipped}
- Documentation: {synchronized across entire system | skipped}
- Learning: {patterns extracted from all keys | skipped}
- Code Quality: {validated across entire codebase | skipped}
- Keys: {optimized and compacted | skipped}
- Git Status: {X uncommitted changes} or {clean}
- Remote: {up to date | local only}

💡 Validation Coverage:
- Total Files Analyzed: {count}
- Validation Scope: {Entire Codebase | Partial (some steps skipped)}
```

**Example Output (No Uncommitted Changes)**:
```
✅ Commit Workflow Complete

📋 Execution Summary:
- Key: none
- Cohesion Review: executed on all prompts/instructions
- Sync: executed on all docs/configs
- Learning Analysis: executed on all keys
- Refactor: executed on all code
- Commit: skipped (no uncommitted changes)
- Push: skipped (no changes to push)
- Final Status: Validation complete, 0 uncommitted changes

🎯 System State:
- Prompts: validated and cohesive
- Documentation: synchronized
- Learning: patterns extracted
- Code Quality: validated (0 errors, 0 warnings)
- Git Status: clean
- Remote: up to date

💡 Result: Full codebase validation completed successfully. No changes to commit.
```

---

## Guardrails

### Critical Rules (NEVER SKIP)
1. **Step 0 (Server Cleanup)**: MANDATORY - Always execute to prevent file locks
2. **Step 1 (Cohesion Review)**: MANDATORY unless skip-cohesion=true (runs on ALL prompts/instructions)
3. **Step 2 (Sync)**: MANDATORY unless skip-sync=true (runs on ALL documentation/configs)
4. **Step 3 (Analyze Learning)**: MANDATORY unless skip-learning=true (runs on ALL keys)
5. **Step 3.5 (Refactor)**: MANDATORY unless skip-refactor=true (runs on ALL code)
6. **Step 4.7 (Debug Cleanup)**: MANDATORY - Always remove debug markers before commit
7. **Step 5-8 (Commit/Push/Verify)**: Execute ONLY if uncommitted changes exist

### Execution Requirements
- **VALIDATION STEPS ALWAYS RUN ON ALL CODE**: Steps 1-4 analyze the entire workspace, not just uncommitted changes
- **DO NOT skip validation steps based on git status** - they validate the entire codebase
- **ONLY skip git operations** (commit/push) if no uncommitted changes exist
- **ALWAYS log skip reasons** - display "✓ Skipping [step] ([reason])" when skipping
- **NEVER skip Step 8 verification** if a commit was created
- **NEVER proceed if cohesion review finds issues** - abort and fix issues first
- **ALWAYS commit before pushing** - Step 6 must complete before Step 7
- If push fails, notify user but don't fail entire workflow (commits are local)

### Skip Parameter Interpretation
- **Default behavior**: ALL validation steps execute on entire codebase (Steps 1-4)
- **skip-cohesion=true**: Skip cohesion review entirely (not recommended)
- **skip-sync=true**: Skip sync entirely (not recommended)
- **skip-learning=true**: Skip learning analysis entirely
- **skip-refactor=true**: Skip refactor entirely
- **No parameters provided**: Execute ALL steps on entire codebase, commit only if changes exist

---

## Clean Exit Guarantee
At the end of every commit workflow:
- **Validation Complete**: All validation steps executed on entire codebase (unless explicitly skipped)
- **Git Status Clean**: Zero uncommitted changes if any changes were made during validation
- **Commits Pushed**: All commits pushed to origin (unless push=false or no changes)
- **Cohesion Verified**: Prompts and instructions validated for consistency (unless skipped)
- **Code Quality Verified**: Code meets quality standards (unless skipped)
- **Summary Provided**: Clear report of what was validated and committed

**Key Principle**: Validation runs on ALL code. Commit/push only happens if changes exist.

If any validation step finds issues, the workflow must report failure and provide remediation steps.

---

## Workflow Validation Checklist

Before beginning execution, the agent MUST acknowledge:

```
🔍 COMMIT WORKFLOW EXECUTION PLAN
================================

Step 0: Server Cleanup - MANDATORY ✓
Step 1: Cohesion Review - checking skip condition...
Step 2: Sync - checking skip condition...
Step 3: Analyze Learning - checking skip condition...
Step 3.5: Refactor - checking skip condition...
Step 4: Key Cleanup - checking skip condition...
Step 4.7: Debug Cleanup - MANDATORY ✓
Step 5-8: Commit/Push/Verify - MANDATORY ✓

Parameters Received:
- key: {value or 'none'}
- skip-cohesion: {value or 'false'}
- skip-sync: {value or 'false'}
- skip-learning: {value or 'false'}
- skip-refactor: {value or 'false'}
- push: {value or 'true'}

Proceeding with execution...
```

### During Execution
For each step, the agent MUST output:
- **If executing**: `▶️ STEP X: [Step Name] - EXECUTING`
- **If checking skip**: `🔍 STEP X: [Step Name] - CHECKING SKIP CONDITION`
- **If skipping**: `⏭️ STEP X: [Step Name] - SKIPPED ([reason])`
- **If completing**: `✅ STEP X: [Step Name] - COMPLETE`

### After Execution
The agent MUST provide the summary report (Step 9) showing which steps were executed vs skipped.

---

## Efficiency Optimizations
- **Use skip parameters explicitly** to skip validation steps when you're confident they're not needed
- **skip-cohesion=true** if you recently ran cohesion review manually
- **skip-sync=true** if you recently ran sync manually
- **skip-learning=true** if no new learning patterns need extraction
- **skip-refactor=true** if code quality was recently validated
- **Automatic git skip**: Commit/push automatically skipped if no uncommitted changes

**Important**: By default, all validation steps run on the entire codebase. This ensures comprehensive validation but takes time. Use skip parameters to optimize for speed when appropriate.
