# Refactor task.prompt.md - Replace large sections with module references

$ErrorActionPreference = "Stop"

$sourceFile = "d:\PROJECTS\NOOR CANVAS\.github\prompts\task.prompt.md"
$outputFile = "d:\PROJECTS\NOOR CANVAS\.github\prompts\task.prompt.md.refactored"

Write-Host "Reading source file..." -ForegroundColor Cyan
$content = Get-Content $sourceFile -Raw

Write-Host "Applying replacements..." -ForegroundColor Cyan

# Replacement 1: Step 1 - Checkpoint Commit (already done in file, skip)

# Replacement 2: Auto-Drift Detection section (lines ~638-792)
$pattern1 = '(?s)(## Auto-Drift Detection \(MANDATORY\))(.*?)(---\s+### Step 2: Context Gathering)'
$replacement1 = @'
## Auto-Drift Detection (MANDATORY)

**LOAD MODULE:** `.github/prompts/shared/task-exec/drift-detection-task.md`

Automatically detect and register unrelated issues during task execution (Steps 2, 5, 6) for post-completion resolution.

**Detection Triggers:** Context gathering, execution phase, validation phase  
**Critical Blocking:** Severity=critical requires user choice (fix/continue/abort)

---

### Step 2: Context Gathering'@

$content = $content -replace $pattern1, $replacement1
Write-Host "  ✓ Auto-Drift Detection section replaced" -ForegroundColor Green

# Replacement 3: Step 2 - Context Gathering (large section ~793-1043)
$pattern2 = '(?s)(### Step 2: Context Gathering \(MANDATORY - Multi-Phase\))(.*?)(---\s+### Step 3: Plan)'
$replacement2 = @'
### Step 2: Context Gathering (MANDATORY - Multi-Phase)

**LOAD MODULE:** `.github/prompts/shared/task-exec/context-gathering-protocol.md`

Build comprehensive context before planning through conditional, intelligent sub-phases.

**Always Execute:** 2.1 (Key Resolution + High-Priority Constraints), 2.2 (Key Data Stream Query), 2.3 (Auto-Load Files)  
**Conditional:** 2.4-2.12 (based on task type - errors, framework validation, UI debugging, architecture analysis, etc.)

**Critical Guardrails:**
- Token budget protection (>50,000 tokens → HALT)
- Circular dependency detection → HALT
- Phase timeout (>5 minutes → warn and proceed)

**Key Feature:** Step 2.8.7 validates complete CRUD data lifecycle (UI → API → DB → Broadcast → UI)

---

### Step 3: Plan'@

$content = $content -replace $pattern2, $replacement2
Write-Host "  ✓ Step 2 Context Gathering section replaced" -ForegroundColor Green

# Replacement 4: Step 3 Plan & Approval sections can stay mostly as-is (user-facing logic)

# Replacement 5: Step 5d - Production Migration Generation (~1243-1393)
$pattern3 = '(?s)(#### 5d\. Production Migration Generation \(Database Changes Detected\))(.*?)(---\s+### Step 6: Validate)'
$replacement3 = @'
#### 5d. Production Migration Generation (Database Changes Detected)

**LOAD MODULE:** `.github/prompts/shared/task-exec/ui-execution-requirements.md` (Section: Production Migration Generation)

Auto-generate forward migration + rollback scripts for safe production deployment when database schema changes detected.

**Detection Signals:** ALTER TABLE, CREATE TABLE, INDEX operations, schema modifications to canvas.* tables  
**Skip Conditions:** Development-only changes (KSESSIONS_DEV test data)

---

### Step 6: Validate'@

$content = $content -replace $pattern3, $replacement3
Write-Host "  ✓ Production Migration Generation section replaced" -ForegroundColor Green

# Replacement 6: Step 6.1 - Test Integration (~1393-1443)
$pattern4 = '(?s)(#### 6\.1\. Test Integration)(.*?)(####\s+6\.2\.)'
$replacement4 = @'
#### 6.1. Test Integration (when UI changes occur)

**LOAD MODULE:** `.github/prompts/shared/task-exec/test-integration-protocol.md`

Invoke test-generation.prompt.md when UI changes, API endpoint changes, user interaction flows, or visual regressions detected.

**Test Location:** `.github/key-data-streams/{key}/tests/`  
**Execution:** Via orchestration scripts ONLY (external PowerShell window)  
**Cleanup:** Tests promoted to production after Step 9.2

####'@ + ' 6.2.'

$content = $content -replace $pattern4, $replacement4
Write-Host "  ✓ Test Integration section replaced" -ForegroundColor Green

# Replacement 7: Step 6.2 & 6.3 - Lint Validation & Constraint Verification (~1443-1643)
$pattern5 = '(?s)(#### 6\.2\. Mandatory Lint Validation)(.*?)(---\s+### Step 7: Confirm)'
$replacement5 = @'
#### 6.2. Mandatory Lint Validation (ALL Modified Files)

**LOAD MODULE:** `.github/prompts/shared/task-exec/ui-execution-requirements.md` (Section: Mandatory Lint Validation)

**CRITICAL:** MANDATORY before any commit. Lint failures BLOCK commit creation.

**Linters by Type:** C# (Roslynator), JS/TS (ESLint), CSS (Stylelint), PowerShell (PSScriptAnalyzer), JSON (syntax + Prettier)

#### 6.3. High-Priority Constraint Verification

**LOAD MODULE:** `.github/prompts/shared/task-exec/ui-execution-requirements.md` (Section: High-Priority Constraint Verification)

**CRITICAL:** Verify ALL CAPS constraints from user request before marking work complete.

**Violation Protocol:** HALT → Rollback → Return to Step 3 for re-planning

---

### Step 7: Confirm'@

$content = $content -replace $pattern5, $replacement5
Write-Host "  ✓ Lint Validation & Constraint Verification sections replaced" -ForegroundColor Green

# Replacement 8: Step 7 - Confirm (~1643-1893)
$pattern6 = '(?s)(### Step 7: Confirm)(.*?)(---\s+### Step 8: Update Key Data Stream)'
$replacement6 = @'
### Step 7: Confirm

**LOAD MODULE:** `.github/prompts/shared/task-exec/validation-and-response.md`

Provide summary based on `verbosity` parameter (concise/detailed).

**BLOCKER VALIDATION (Execute BEFORE summary):** Ensure documentation completeness - work-log.md must contain all required sections.

**Summary Includes:** Status, work done, files modified, debug logging, tests, build, lint validation, high-priority constraints, approval iterations, checkpoint

---

### Step 8: Update Key Data Stream'@

$content = $content -replace $pattern6, $replacement6
Write-Host "  ✓ Step 7 Confirm section replaced" -ForegroundColor Green

# Replacement 9: Step 8 - All subsections (~1893-2143)
$pattern7 = '(?s)(### Step 8: Update Key Data Stream \(MANDATORY\))(.*?)(---\s+### Step 9: Completion Workflow)'
$replacement7 = @'
### Step 8: Update Key Data Stream (MANDATORY)

**LOAD MODULE:** `.github/prompts/shared/task-exec/completion-workflow.md`

**CRITICAL:** ALL task completions MUST update the key data stream.

**Key Steps:**
- **8.0:** Auto-Chain Protocol (if auto-chain=true)
- **8.1:** Update JSON Tracking (if plan exists)
- **8.2:** Key Data Stream Bloat Detection
- **8.3:** Key Data Stream Update Requirements (COMPREHENSIVE DOCUMENTATION)
- **8.25:** File Finalization Verification (BLOCKING - verify work-log.md updated)
- **8.6:** Response Validation (MANDATORY - CONCISE-MANDATE enforcement)
- **8.5:** Checkpoint Commit & Tag (MANDATORY - create git tag)

**Guardrail:** Lock detection - HALT if `.github/key-data-streams/**/{key}.lock` exists

---

### Step 9: Completion Workflow'@

$content = $content -replace $pattern7, $replacement7
Write-Host "  ✓ Step 8 Update Key Data Stream section replaced" -ForegroundColor Green

# Replacement 10: Step 9 - Completion Workflow (~2143-2287)
$pattern8 = '(?s)(### Step 9: Completion Workflow \*\(Conditional.*?\)\*)(.*?)(---\s+## Guardrails)'
$replacement8 = @'
### Step 9: Completion Workflow *(Conditional: When tasks = "mark complete" or "completed")*

**LOAD MODULE:** `.github/prompts/shared/task-exec/completion-workflow.md` (Section: Step 9)

**Triggered when:** User specifies `tasks = "mark complete"` or `tasks = "completed"`

**Workflow:**
- **9.1:** Obsolete Information Removal & Debug Cleanup (remove all debug markers)
- **9.2:** Test Promotion & Cleanup (promote passing tests to production, delete from key directory)
- **9.3:** State Management & Completion (mark key as `complete`)
- **9.4:** Resumption Protocol (auto-revert to `in-progress` if new tasks arrive)

---

## Guardrails'@

$content = $content -replace $pattern8, $replacement8
Write-Host "  ✓ Step 9 Completion Workflow section replaced" -ForegroundColor Green

# Write refactored content
Write-Host "`nWriting refactored file..." -ForegroundColor Cyan
$content | Out-File -FilePath $outputFile -Encoding UTF8 -NoNewline

$originalLines = (Get-Content $sourceFile).Count
$refactoredLines = (Get-Content $outputFile).Count
$reduction = [math]::Round((($originalLines - $refactoredLines) / $originalLines) * 100, 1)

Write-Host "`n✅ Refactoring complete!" -ForegroundColor Green
Write-Host "Original file: $originalLines lines" -ForegroundColor Yellow
Write-Host "Refactored file: $refactoredLines lines" -ForegroundColor Yellow
Write-Host "Reduction: $reduction% ($($originalLines - $refactoredLines) lines removed)" -ForegroundColor Cyan
Write-Host "`nRefactored file saved to: $outputFile" -ForegroundColor White
Write-Host "`nTo apply: Copy $outputFile over $sourceFile" -ForegroundColor White
