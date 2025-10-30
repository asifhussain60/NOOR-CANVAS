# step-2-5-document-first-checkpoint.md

**Purpose:** Enforce "Document First, Respond Later" protocol - Update key documentation BEFORE code implementation

**Version:** 1.0.0  
**Created:** 2025-10-29  
**Module Type:** Shared Protocol (loaded by task.prompt.md)

---

## When to Execute

**MANDATORY for task.prompt.md:**
- **Location:** Step 2.5 (AFTER context gathering, BEFORE planning)
- **Trigger:** ALWAYS when `key` parameter exists
- **Blocking:** HALT if documentation updates fail

**Purpose:** Ensure documentation captures session intent BEFORE any code changes

---

## Protocol Algorithm

```
FUNCTION DocumentFirstCheckpoint(key, userRequest, phase):
  
  # 1. Check if key folder exists
  keyFolderPath = ".github/key-data-streams/{key}/"
  IF NOT FolderExists(keyFolderPath) THEN
    RETURN {
      status: "SKIP",
      reason: "Key folder does not exist (plan.prompt.md not run yet)",
      action: "PROCEED_TO_PLANNING"
    }
  END IF
  
  # 2. Load existing documentation files
  planFile = "{keyFolderPath}{key}.plan.md"
  workLogFile = "{keyFolderPath}work-log.md"
  
  planExists = FileExists(planFile)
  workLogExists = FileExists(workLogFile)
  
  # 3. Determine what needs updating
  documentsToUpdate = []
  
  IF planExists THEN
    documentsToUpdate.Add({
      file: planFile,
      updateType: "PLAN_UPDATE",
      content: GeneratePlanUpdate(key, userRequest, phase)
    })
  END IF
  
  IF workLogExists THEN
    documentsToUpdate.Add({
      file: workLogFile,
      updateType: "SESSION_START",
      content: GenerateSessionStartEntry(key, userRequest, phase)
    })
  ELSE
    # Work log missing but key folder exists - create it
    documentsToUpdate.Add({
      file: workLogFile,
      updateType: "SESSION_START_NEW",
      content: GenerateNewWorkLog(key, userRequest, phase)
    })
  END IF
  
  # 4. Execute documentation updates
  FOR EACH doc IN documentsToUpdate:
    TRY:
      UpdateFile(doc.file, doc.content, doc.updateType)
      LogSuccess("Updated: {doc.file} ({doc.updateType})")
    CATCH error:
      RETURN {
        status: "FAILED",
        reason: "Documentation update failed: {error.message}",
        file: doc.file,
        action: "HALT_EXECUTION"
      }
    END TRY
  END FOR
  
  # 5. Commit documentation updates
  TRY:
    ExecuteCommand("git add {keyFolderPath}*")
    commitMessage = GenerateDocCommitMessage(key, phase, documentsToUpdate)
    ExecuteCommand("git commit -m \"{commitMessage}\"")
    commitSha = ExecuteCommand("git rev-parse --short HEAD")
    
    LogSuccess("Documentation committed: {commitSha}")
    
  CATCH error:
    RETURN {
      status: "FAILED",
      reason: "Documentation commit failed: {error.message}",
      action: "HALT_EXECUTION"
    }
  END TRY
  
  # 6. Success - proceed to code implementation
  RETURN {
    status: "SUCCESS",
    filesUpdated: documentsToUpdate.Length,
    commitSha: commitSha,
    action: "PROCEED_TO_IMPLEMENTATION"
  }
  
END FUNCTION
```

---

## Documentation Update Templates

### Plan Update (plan.md)

**When:** `{key}.plan.md` exists and needs phase/session update

**Template:**
```markdown
<!-- Append to end of plan.md file -->

---

## Session Update: {timestamp}

**Phase:** {phase}/{totalPhases}
**User Request:** {succinct-summary-of-request}
**Scope:** {affected-files-or-components}
**Status:** Executing Phase {phase}

**Tasks for this session:**
1. {task-1}
2. {task-2}
3. {task-3}

**Expected Outcome:**
{one-liner-expected-result}

**Next:** Proceeding to implementation (Step 5)
```

---

### Session Start Entry (work-log.md)

**When:** `work-log.md` exists

**Template:**
```markdown
<!-- Append to work-log.md file -->

---

## Session {N}: {timestamp}

**Phase:** {phase}/{totalPhases} - {phase-title}
**User Request:** {original-user-request-verbatim}
**Intent Summary:** {succinct-paraphrase-max-2-sentences}

**Context Loaded:**
- {context-file-1}
- {context-file-2}
- {context-file-3}

**High-Priority Constraints:** {count}
{constraint-list-if-any}

**Planned Changes:**
- {file-1} - {action}
- {file-2} - {action}

**Status:** Documentation committed, proceeding to implementation

**Commit:** Pre-implementation checkpoint (SHA: {short-sha})
```

---

### New Work Log Creation

**When:** Key folder exists but `work-log.md` does NOT exist

**Template:**
```markdown
# Work Log: {key}

**Key:** {key}
**Created:** {timestamp}
**Status:** In Progress

---

## Session 1: {timestamp}

**Phase:** {phase}/{totalPhases} - {phase-title}
**User Request:** {original-user-request-verbatim}
**Intent Summary:** {succinct-paraphrase}

**Context:** Work resumed on existing key without plan regeneration

**Planned Changes:**
- {file-1} - {action}
- {file-2} - {action}

**Status:** Documentation initialized, proceeding to implementation

**Commit:** Initial work log (SHA: {short-sha})
```

---

## Commit Message Format

**Template:**
```
doc({key}): session start documentation

Phase: {phase}/{totalPhases}
Request: {truncated-request-max-50-chars}
Files Updated: {file-count}

- Updated {key}.plan.md with session context
- Updated work-log.md with session entry
- Checkpoint before implementation begins

[sha={short}] [parent={parent-short}]
```

**Example:**
```
doc(hcp-cleanup): session start documentation

Phase: 1/5
Request: API Layer Consolidation - Create TranscriptController
Files Updated: 2

- Updated hcp-cleanup.plan.md with session context
- Updated work-log.md with session entry
- Checkpoint before implementation begins

[sha=a1b2c3d] [parent=e4f5g6h]
```

---

## Integration with task.prompt.md

**Location:** Step 2.5 (NEW STEP - insert between Step 2 and Step 3)

**Insert into task.prompt.md:**

```markdown
### Step 2.5: Document First Checkpoint (MANDATORY)

**LOAD MODULE:** `.github/prompts/shared/step-2-5-document-first-checkpoint.md`

**Purpose:** Update key documentation BEFORE any code implementation

**Trigger:** ALWAYS when `key` parameter is provided or detected

**Execute:**
```powershell
IF KeyExists($key) THEN
  
  # Update plan and work log with session details
  $docResult = DocumentFirstCheckpoint($key, $userRequest, $phase)
  
  IF $docResult.status == "FAILED" THEN
    # Documentation update failed - HALT execution
    SHOW_ERROR($docResult.reason)
    LOG_FAILURE($docResult)
    EXIT 1
  END IF
  
  IF $docResult.status == "SUCCESS" THEN
    # Documentation committed - proceed to planning
    LOG_SUCCESS("Documentation updated: {$docResult.filesUpdated} files")
    LOG_COMMIT("Checkpoint SHA: {$docResult.commitSha}")
  END IF
  
  # If status == "SKIP", key folder doesn't exist yet (first-time execution)
  # Proceed to Step 3 for lightweight planning
  
END IF

# Continue to Step 3 (Planning)
```

**Guardrail:** Code commits WITHOUT prior documentation updates = VIOLATION

**Output (based on verbosity):**
- **Concise:** `"✅ Documentation checkpoint: {file-count} files updated, committed {short-sha}"`
- **Detailed:** 
  ```
  ✅ Documentation First Checkpoint
  
  Files Updated: {count}
  - {key}.plan.md (session context added)
  - work-log.md (session entry created)
  
  Commit: {short-sha}
  Message: doc({key}): session start documentation
  
  Status: Ready for implementation (Step 5)
  ```
```

---

## Enforcement Rules

### MANDATORY Updates (Block if missing)

1. **work-log.md** - ALWAYS update/create session entry
2. **{key}.plan.md** - Update if exists (skip if not created yet)
3. **Git commit** - ALWAYS commit documentation updates before code

### OPTIONAL Updates (Skip if not applicable)

1. **{key}.plan.json** - Update if plan uses JSON tracking
2. **test-registry.md** - Update if tests will be created in this session

---

## Violation Detection

**What qualifies as a violation:**

1. ❌ Code commit occurs BEFORE documentation commit
2. ❌ work-log.md not updated when `key` exists
3. ❌ plan.md not updated when phase changes
4. ❌ Documentation updates occur AFTER code implementation

**How to detect:**

```
FUNCTION DetectDocumentationLag():
  
  # Get all commits for this key
  commits = ExecuteCommand("git log --grep='({key}):' --oneline -20")
  
  # Parse commit types
  docCommits = commits.Filter(c => c.StartsWith("doc({key}):"))
  codeCommits = commits.Filter(c => c.StartsWith("task({key}):") OR c.StartsWith("ckpt({key}):"))
  
  # Get timestamps
  lastDocCommit = GetTimestamp(docCommits.First())
  lastCodeCommit = GetTimestamp(codeCommits.First())
  
  # Check if code came before doc
  IF lastCodeCommit > lastDocCommit THEN
    RETURN {
      violation: true,
      type: "DOCUMENT_LAG",
      lastDoc: lastDocCommit,
      lastCode: lastCodeCommit,
      message: "Code committed BEFORE documentation update"
    }
  END IF
  
  RETURN { violation: false }
  
END FUNCTION
```

---

## Rollback on Violation

**If documentation commit fails:**

```powershell
# No code changes made yet, safe to halt
LOG_ERROR("Documentation update failed - halting execution")
EXIT 1
```

**If violation detected during post-execution validation:**

```powershell
# Revert code changes, keep documentation
git revert HEAD  # Revert last code commit
git commit -m "revert({key}): documentation-first violation detected"

# Log violation
UPDATE_WORK_LOG("⚠️ VIOLATION: Code committed before documentation - reverted")
```

---

## Success Criteria

**Documentation First Checkpoint passes when:**

1. ✅ work-log.md updated with session entry
2. ✅ plan.md updated with phase context (if exists)
3. ✅ All documentation changes committed to git
4. ✅ Commit SHA recorded for traceability
5. ✅ Documentation commit timestamp < any implementation commits

---

## Benefits

**Why this prevents violations:**

1. **Evidence of intent** - Documentation captures "why" before "what"
2. **Audit trail** - Clear separation between planning and execution commits
3. **Rollback safety** - Documentation commits provide checkpoint anchors
4. **Context preservation** - Future sessions understand original request
5. **Drift detection** - Easier to spot when implementation diverges from plan

**What this fixes from CopilotChats.md:**

- Lines 125-400: Code created (TranscriptController, TranscriptProcessingService) WITHOUT prior plan.md/work-log.md updates
- Expected: Documentation commit at line 150, then code commits at line 300+
- Result: Clear separation between planning and execution phases

---

## See Also

- `.github/prompts/shared/file-finalization-verifier.md` - File creation verification
- `.github/prompts/shared/commit-checkpoint-protocol.md` - Commit format standards
- `.github/prompts/task.prompt.md` - Task execution workflow
- `.github/prompts/shared/CONCISE-MANDATE.md` - Output format rules
