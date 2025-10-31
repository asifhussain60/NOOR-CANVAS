# Completion Workflow (Steps 8-9)

**Purpose:** Comprehensive documentation, state tracking, and completion protocols

**Referenced by:** task.prompt.md Steps 8-9

**Dependencies:**
- `shared/output-validator.md` - Response validation rules
- `shared/loop-prevention.md` - Phase re-execution prevention
- `shared/file-finalization-verifier.md` - Work log verification
- `shared/clean-exit-guarantee.md` - Exit criteria and failure protocols

---

## Step 8: Update Key Data Stream (MANDATORY)

**CRITICAL:** ALL task completions MUST update the key data stream. This is not optional.

**GUARDRAIL - Lock Detection:**
Before updating any key file, check for `.github/key-data-streams/**/{key}.lock` file.
If lock exists → HALT and notify user (prevents concurrent modification conflicts).

---

### Step 8.0: Auto-Chain Protocol (if auto-chain=true)

**Trigger:** `auto-chain` parameter = `true`

**Purpose:** Enable unassisted end-to-end execution with automatic phase-to-phase transitions

**Algorithm:**

```javascript
IF auto-chain == true AND phase IS NOT NULL THEN
  
  // Verify current phase completed successfully
  IF CurrentPhaseStatus != "complete" THEN
    HALT("Phase {phase} incomplete - cannot auto-chain")
  END IF
  
  // Load test registry and run phase tests
  testRegistry = LoadTestRegistry(key)
  phaseTests = GetTestsForPhase(testRegistry, phase)
  
  IF phaseTests.length > 0 THEN
    Write-Host "🧪 Running {phaseTests.length} test(s) for Phase {phase}..." -ForegroundColor Cyan
    
    FOR EACH test IN phaseTests
      result = ExecuteTest(test)
      UpdateTestRegistry(test, result)
      
      IF result.status == "failed" THEN
        HALT("Test '{test.name}' failed - cannot auto-chain")
        SHOW_ROLLBACK_OPTIONS()
      END IF
    END FOR
    
    Write-Host "✅ All Phase {phase} tests passed" -ForegroundColor Green
  END IF
  
  // Check if more phases exist
  plan = LoadPlanJSON(key)
  nextPhase = phase + 1
  
  IF nextPhase <= plan.totalPhases THEN
    // Auto-invoke next phase
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📍 Auto-chaining to Phase {nextPhase}/{plan.totalPhases}" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    SELF_INVOKE: @workspace /task key:{key} phase:{nextPhase} auto-chain:true
    
  ELSE
    // All phases complete
    Write-Host "✅ All {plan.totalPhases} phases complete!" -ForegroundColor Green
    Write-Host "Next steps: @workspace /task key:{key} tasks='mark complete'" -ForegroundColor White
    
    STOP_AUTO_CHAIN()
  END IF
  
END IF
```

**Test Registry Integration:**
- **Before chaining:** Execute all tests registered for current phase
- **Test failure:** Halt auto-chain, show rollback options
- **Test success:** Update test registry, proceed to next phase
- **No tests:** Skip test execution, proceed to next phase

**User Break Points:**
- Auto-chain runs continuously UNLESS user invoked with script (then 10s break)
- User can Ctrl+C at any time to halt auto-chain
- Errors halt auto-chain automatically with rollback options

---

### Step 8.1: Update JSON Tracking (if plan exists)

**Trigger:** When `.github/key-data-streams/{key}/{key}.plan.json` exists

**Purpose:** Maintain machine-readable progress tracking synchronized with markdown work-log

**After each phase completion:**

1. **Load existing JSON** from `.github/key-data-streams/{key}/{key}.plan.json`

2. **Update phase status:** Find phase by ID, change status from `"in-progress"` to `"complete"`

3. **Record phase timing:**
   ```json
   "completedAt": "{ISO-8601-timestamp}",
   "durationMinutes": {calculated}  // (completedAt - startedAt) / 60000ms
   ```

4. **Update validation results:**
   ```json
   "validation": {
     "buildPassed": true,
     "lintPassed": true,
     "testCreated": true,
     "testFile": "phase2-session-canvas-guard.spec.ts",
     "testsPassing": 3,
     "testsTotal": 3,
     "flakyTests": 0
   }
   ```

5. **Record commit info:**
   ```json
   "commit": {
     "sha": "{full-40-char-sha}",
     "message": "{commit-message}",
     "timestamp": "{ISO-8601-timestamp}"
   }
   ```

6. **Record checkpoint tag:**
   ```json
   "checkpoint": {
     "tag": "checkpoint/{key}/{timestamp}",
     "timestamp": "{ISO-8601-timestamp}"
   }
   ```

7. **Update metrics** (aggregate across all phases):
   ```json
   "metrics": {
     "completedPhases": 2,
     "totalTests": 6,
     "passingTests": 6,
     "flakyTests": 0,
     "filesModified": 5,
     "linesAdded": 150,
     "linesRemoved": 20,
     "totalDurationMinutes": 45,
     "averagePhaseDuration": 22.5
   }
   ```

8. **Update global status** (when all phases complete):
   ```json
   "status": "complete",
   "updated": "{ISO-8601-timestamp}"
   ```

9. **Save JSON file** (pretty-printed for readability)

**Before Starting Next Phase:**

1. **Update next phase status:** Change to `"in-progress"`
2. **Record phase start timing:**
   ```json
   "startedAt": "{ISO-8601-timestamp}"
   ```

**Synchronization Rule:** Both markdown work-log AND JSON tracking must be updated in same commit

**Output:**
- **Concise:** `"✓ JSON tracking updated (Phase 2 complete, duration: 23 minutes)"`
- **Detailed:** Show updated phase status, metrics, timing breakdown, checkpoint reference

---

### Step 8.2: Key Data Stream Bloat Detection (Pre-Update Cleanup)

1. Read current state: Check file size, entry count
2. Deduplication: Remove duplicate work log entries
3. Obsolescence cleanup: Remove superseded implementations, failed experiments
4. Size limits: If >100 entries or >50KB, trigger consolidation

---

### Step 8.3: Key Data Stream Update Requirements (COMPREHENSIVE DOCUMENTATION)

**🎯 SCOPE CLARIFICATION:**
- The code examples below are **TEMPLATES for work-log.md documentation**
- They are **NOT user-facing output** (shown to user in chat)
- **User-facing output** should use **architectural descriptions** (see CONCISE-MANDATE.md)
- **Work-log.md** should include **code examples** for investigation timeline reconstruction

**CRITICAL:** Work-log.md must contain complete implementation details.

**Steps:**

1. Locate key file: `.github/key-data-streams/{key}/work-log.md`

2. Retrieve git commit hash: `git rev-parse HEAD`

3. **Verify Step 2.2.1 documentation exists** (User Request + Implementation Plan recorded BEFORE work started)

4. **Append Work Completed section** (AFTER work finished):

```markdown
### Work Completed (YYYY-MM-DD HH:MM)

**Status**: {In Progress | Complete}

#### Changes Summary
{1-2 sentence overview of what was implemented}

#### Files Modified

**Views/Components:**
1. `{path}` (lines {start}-{end})
   - Added: {feature-description}
   - Modified: {existing-feature-description}
   - Removed: {removed-feature-description}

**API Endpoints:**
1. `{ControllerName}.{MethodName}` ({HttpMethod} {route})
   - Request: {request-model-type}
   - Response: {response-model-type}
   - Authentication: {required|optional|none}
   - Changes: {what-changed}

**Database:**
1. Schema: `{schema.table}`
   - Operations: {SELECT|INSERT|UPDATE|DELETE}
   - Columns Affected: {column-names}
   - Migration: {migration-file-name} (if created)

**SignalR Hubs:**
1. `{HubName}` (file: `{path}`)
   - Methods Added/Modified: `{MethodName}({parameters})`
   - Events Broadcast: `{EventName}` to `{target-group}`
   - Client Handlers: `connection.on('{EventName}', ...)` in `{client-file}`

**Services:**
1. `{ServiceName}` (file: `{path}`)
   - Methods: `{MethodName}({parameters}) : {ReturnType}`
   - Dependencies Injected: {service-names}
   - Algorithm: {brief-description-of-logic}

#### HTML/CSS/JavaScript Changes

**HTML Structure:**
```html
{key-structural-changes-with-brief-example}
```

**CSS Classes:**
- `.{class-name}` - {purpose} (positioning, styling, animation)

**JavaScript:**
- Event handlers: `{element-selector}` → `{handler-function}`
- SignalR: `hubConnection.on('{event}', ...)` in `{file}`

#### Testing Results
- **Manual Verification**: {steps-performed} - {PASS|FAIL}
- **Automated Tests**: {test-file-names} - {results}
- **Percy Visual**: {snapshot-names} - {baseline|changes-detected}
- **Lint Validation**: {PASS|FAIL with details}

#### High-Priority Constraints Verified
- [PASS|FAIL] {constraint-description} (user ALL CAPS: {original-constraint})

#### Approval Iterations
{N} re-evaluations (if requirements evolved)

**Additional Requirements Added:**
- {requirement-1}
- {requirement-2}

#### Commit Details
- **SHA**: {full-commit-hash}
- **Message**: `{commit-message}`
- **Tag**: `checkpoint/{key}/{timestamp}`
- **Files Changed**: {count}
- **Lines Changed**: +{additions} -{deletions}

#### Next Steps
- [ ] {pending-task-1}
- [ ] {pending-task-2}
```

5. **Enforcement Rules:**
   - ❌ NEVER skip "SignalR Hubs" if real-time features involved
   - ❌ NEVER skip "Database" if data persistence involved
   - ❌ NEVER skip "API Endpoints" if client-server communication involved
   - ❌ NEVER use vague descriptions - include file paths, method names, line ranges
   - ✅ ALWAYS include HTML/CSS/JavaScript changes for UI work
   - ✅ ALWAYS document complete data flow (UI → API → Service → DB → SignalR → UI)
   - ✅ ALWAYS cross-reference Step 2.2.1 documentation (plan vs. actual)

6. Output to user (brief acknowledgment only):
   - Concise: `"[OK] Key data stream updated (commit: {SHA})"`
   - Detailed: Show complete entry added

7. Maintain alphabetical sorting of keys

**Failure to update the key data stream constitutes an incomplete task execution.**

---

### Step 8.25: FILE FINALIZATION VERIFICATION (BLOCKING)

**Purpose:** Ensure work log updated before response validation

**⚠️ BLOCKING REQUIREMENT:** Do NOT proceed to Step 8.6 (Response Validation) until work log verified.

**LOAD MODULE:** `.github/prompts/shared/file-finalization-verifier.md`

**Quick Verification:**

```javascript
VerifyWorkLogUpdated(key):
  workLogPath = ".github/key-data-streams/{key}/work-log.md"
  
  IF NOT FileExists(workLogPath) THEN
    HALT_EXECUTION()
    LOG_ERROR("Work log missing: {workLogPath}")
    SHOW_ERROR_MESSAGE("Work log file not found")
    RETURN FALSE
  END IF
  
  lastModified = GetFileModificationTime(workLogPath)
  currentTime = GetCurrentTime()
  timeDifference = currentTime - lastModified
  
  // File must be modified within last 60 seconds
  IF timeDifference > 60_SECONDS THEN
    HALT_EXECUTION()
    LOG_ERROR("Work log not recently updated: last modified {timeDifference}s ago")
    SHOW_ERROR_MESSAGE("Work log update incomplete")
    RETURN FALSE
  END IF
  
  LOG_SUCCESS("Work log updated: {workLogPath} (modified {timeDifference}s ago)")
  RETURN TRUE
```

**If verification fails:**
- HALT execution immediately
- Log error with file path and timestamp
- **DO NOT proceed to Step 8.6**
- **DO NOT show user output**
- Display error message

**If verification passes:**
- Log success with modification timestamp
- Proceed to Step 8.6

---

### Step 8.6: Response Validation (MANDATORY)

**Purpose:** Enforce CONCISE-MANDATE.md rules before sending response to user

**When:** ALWAYS execute after Step 8.25 and before Step 9

**LOAD MODULE:** `.github/prompts/shared/output-validator.md`

**Quick Validation:**

```javascript
BEFORE responding to user:
  1. Count bullets (including nested) → Must be ≤15
  2. Detect code blocks (```language markers) → Prohibit implementation code
  3. Check nested lists (indentation >2 spaces) → Flatten to single level
  4. Verify next actions present → Must have letter-based options (A/B/C/D)
  5. If violations → Auto-fix or BLOCK response

IF critical violations cannot be auto-fixed:
  - Log violation details
  - TERMINATE with error (do not send to user)
  - Show developer message with remediation steps

IF warnings only:
  - Log for monitoring
  - Allow response (optionally append warning note)
```

**Exempt from validation:**
- Work log file contents
- Plan file updates
- Git commit messages
- Internal execution logs

**LOAD MODULE:** `.github/prompts/shared/loop-prevention.md` (phase re-execution prevention)

---

### Step 8.5: Build Validation Gate (BLOCKING - Rule #14)

**CRITICAL:** Application MUST be left in built state with zero build errors.

**Algorithm:** See `.github/prompts/shared/build-validation-gate.md`

**Process:**

1. **Execute build command:**
   ```bash
   dotnet build --no-incremental
   ```

2. **Parse build result:**
   - Exit code (must be 0)
   - Error count (must be 0)
   - Warning count (acceptable)

3. **On SUCCESS (0 errors):**
   - Log to work-log.md
   - Proceed to Step 8.7 (Checkpoint Commit)

4. **On FAILURE (errors > 0):**
   - HALT execution immediately
   - Extract error details (file, line, code, message)
   - Present resolution options:
     - **A.** Rollback changes (git reset)
     - **B.** Fix errors immediately
     - **C.** Create drift key for build fix
     - **D.** Show full build output
   - Wait for user choice
   - Execute chosen option

**Exception:** Skip validation if:
- Commit message contains "refactor-wip"
- OR explicit `skipBuildValidation=true` flag

**Log Entry Format (on success):**
```
#### Build Validation ✅
- Command: dotnet build --no-incremental
- Exit Code: 0
- Errors: 0
- Warnings: {count}
- Duration: {seconds}s
```

**Error Report Format (on failure):**
```
## ⚠️ Build Validation Failed

**Errors:** {count}  
**Warnings:** {count}

**Error Details:**
- {file}({line}): {errorCode} - {message}
...

**Resolution Options:**
**A.** Rollback Changes
**B.** Fix Errors Immediately  
**C.** Create Drift Key
**D.** Show Full Output

**Reply:** A, B, C, or D
```

---

### Step 8.7: Checkpoint Commit & Tag (MANDATORY)

**After build validation passes, create final checkpoint commit with git tag.**

**Checkpoint Commit Requirements:**

1. **Stage all changes:**
   ```bash
   git add -A
   ```

2. **Create checkpoint commit:**
   ```bash
   git commit -m "checkpoint: {key} - {one-line summary}"
   ```
   - Example: `git commit -m "checkpoint: canvas - added share button with confirmation dialog"`

3. **Create lightweight git tag:**
   ```bash
   git tag "checkpoint/{key}/{ISO-8601-date-compact}"
   ```
   - Example: `git tag "checkpoint/canvas/2025-10-16_0230"`
   - Format: `checkpoint/{key}/{YYYY-MM-DD_HHMM}` (enables filtering by key)

4. **Retrieve commit SHA:**
   ```bash
   git rev-parse HEAD
   ```

**Automatic Tag Pruning (28-tag limit per key):**

1. **List existing checkpoints:**
   ```bash
   git tag --list "checkpoint/{key}/*" --sort=-creatordate
   ```

2. **If ≥28 tags exist, delete oldest:**
   ```bash
   git tag --list "checkpoint/{key}/*" --sort=creatordate | Select-Object -First {count-to-delete} | ForEach-Object { git tag -d $_ }
   ```

3. **Maintains most recent 28 checkpoints per key automatically**

**Rollback & Browsing:**

```bash
# Rollback to specific checkpoint
git reset --hard checkpoint/canvas/2025-10-16_0230

# Browse all checkpoints for a key
git tag --list "checkpoint/{key}/*" --sort=-creatordate

# View checkpoint details
git show {tag-name} --stat

# Browse all checkpoints across all keys
git tag --list "checkpoint/*/*" --sort=-creatordate
```

**Advantages:**
- ✅ Single source of truth (git history)
- ✅ No file sync issues
- ✅ Native git browsing/search
- ✅ Works with all git tools
- ✅ Automatic cleanup via tag deletion
- ✅ Full diff available: `git show {tag-name}`

**Output:**
- **Concise:** `"✓ Checkpoint created: {tag-name}"`
- **Detailed:** Show tag name, SHA, rollback command

---

## Step 9: Completion Workflow (Conditional)

**Triggered when:** User specifies `tasks = "mark complete"` or `tasks = "completed"`

---

### 9.1: Obsolete Information Removal & Debug Cleanup

**Key Data Stream Cleanup:**
- Remove superseded implementations, failed attempts, temporary workarounds
- Remove outdated architecture decisions
- Keep only current, working implementation details

**Debug Marker Cleanup (MANDATORY):**

Search all modified source files and remove debug logging markers:

1. **C# Files:** Remove lines containing `[DEBUG-WORKITEM:*] ;CLEANUP_OK` or `[DIAGNOSTIC:*] ;CLEANUP_OK`
2. **JavaScript/TypeScript:** Remove lines containing `[DEBUG-WORKITEM:*] ;CLEANUP_OK`
3. **Razor Files:** Remove lines containing `DEBUG-WORKITEM` or `DIAGNOSTIC`
4. **Verification:** Run `git grep "\[DEBUG-WORKITEM:\|DIAGNOSTIC:"` to ensure zero remaining markers
5. **Build:** Verify clean build after cleanup

**Output:**

```
[CLEANUP] Debug Cleanup Complete
- Removed {X} debug markers from {Y} files
- Verification: git grep found 0 remaining markers
- Build status: Clean
```

---

### 9.2: Test Promotion & Cleanup (MANDATORY if tests exist)

**Promote Passing Tests to Production:**

1. **Check for active tests:**
   ```powershell
   $testFiles = Get-ChildItem ".github/key-data-streams/{key}/tests/*.spec.ts"
   ```

2. **For each passing test:**
   - Copy test file to production: `Tests/UI/{feature}-{test-type}.spec.ts`
   - Update orchestration script paths to production location
   - Copy orchestration script to: `Scripts/run-{feature}-test.ps1`
   - Document promotion in test registry (archive section)

3. **Update test registry:**
   ```markdown
   ## Archived Tests (Promoted to Production)
   
   ### {feature}-{test-type}.spec.ts
   - **Promoted**: {ISO-8601 timestamp}
   - **Destination**: Tests/UI/{feature}-{test-type}.spec.ts
   - **Orchestration**: Scripts/run-{feature}-test.ps1
   - **Commit**: {SHA}
   - **Status**: Promoted (deleted from key directory)
   ```

4. **Delete tests from key directory:**
   ```powershell
   Remove-Item ".github/key-data-streams/{key}/tests/*.spec.ts"
   Remove-Item ".github/key-data-streams/{key}/scripts/run-*-test.ps1"
   ```

5. **Preserve test registry** for historical reference

**Output:**

```
[TESTS] Test Promotion Complete
- Promoted {X} test(s) to Tests/UI/
- Copied {X} orchestration script(s) to Scripts/
- Deleted {X} test(s) from key directory
- Test registry archived
```

**Skip Conditions:**
- No tests exist in key directory
- All tests failed (do not promote failing tests)

---

### 9.3: State Management & Completion

- Mark key as `complete` in metadata
- Verify key data stream up-to-date with final state
- Archive work log (historical entries intact)
- Update key index

**Output:**

```
[COMPLETE] Key marked as COMPLETE
[OK] All information recorded in key data stream
[CLEANUP] Debug markers removed ({X} markers from {Y} files)
[TESTS] Tests promoted to production ({X} tests)
```

---

### 9.4: Resumption Protocol

**If new tasks arrive for a `complete` key:**
- Auto-revert status from `complete` to `in-progress`
- Preserve all historical entries in key data stream
- Add new work log entry documenting resumption
- Continue normal workflow (Steps 1-8)

---

## Lifecycle

- Default state: `in-progress`
- Tasks transition to `complete` when user provides `tasks = "mark complete"` or `tasks = "completed"`
- **Completion triggers Step 9** - comprehensive cross-layer documentation and cleanup
- **Completed keys can be reopened** - new tasks automatically revert status to `in-progress`
- **Resumption preserves history** - completion documentation remains intact
- Keys and summaries in `key-data-streams` remain **single source of truth** for lifecycle tracking
