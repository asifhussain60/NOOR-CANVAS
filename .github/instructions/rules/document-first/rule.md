# Rule: Document First

**ID:** `document-first`  
**Version:** 1.0.0  
**Created:** 2025-10-30  
**Category:** workflow  
**Severity:** critical  
**Applies To:** all prompts

---

## Rule Statement

**Summary:** Update KDS files BEFORE code changes; documentation commits must precede implementation commits.

**Detailed Description:**
This rule enforces documentation-first workflow where all planning, design decisions, and session context are captured in Key Data Stream (KDS) files before any code implementation begins. This ensures crash recovery, context restoration, and complete audit trails.

**Why This Matters:**
- **Crash recovery**: If execution fails, KDS preserves intent and progress
- **Context restoration**: Future sessions can resume from documented state
- **Audit trail**: Git history shows planning before implementation
- **Intent capture**: Design decisions documented before forgotten
- **Team coordination**: Others can see planned work before code changes

---

## 📋 Protocol

**Documentation updates MUST precede code implementation:**

### Step 1: Update work-log.md FIRST ✅

**Action:** Add session entry to `.github/key-data-streams/{key}/work-log.md`

**Required Information:**
- Session date/time
- Action description (what you're doing)
- Status (phase/step)
- Context (why this work is needed)

**Example:**
```markdown
## Session: 2025-10-30 (Share Asset Feature)

**Action:** Adding share link generation to AssetProcessingService  
**Status:** Phase 2 - Implementation  
**Context:** Enable users to create shareable links for assets with expiry
```

### Step 2: Update plan file (if exists) ✅

**Action:** Update `.github/key-data-streams/{key}/{key}.plan.md` with phase context

**When Required:**
- Key has active plan.md file
- Current work maps to specific phase
- Phase status needs updating

**What to Update:**
- Mark phase as in-progress
- Document phase-specific decisions
- Update deliverables if changed

### Step 3: Commit documentation changes ✅

**Action:** Git commit with `doc({key}):` prefix

**Command:**
```bash
git add .github/key-data-streams/{key}/work-log.md
git add .github/key-data-streams/{key}/*.plan.md
git commit -m "doc({key}): Update session context for share asset feature"
```

**Why:** Establishes documentation baseline before code changes

### Step 4: HALT if documentation fails ❌

**Action:** Stop execution if documentation commit fails

**Failure Scenarios:**
- Git merge conflicts in KDS files
- File system errors
- Validation errors (missing required fields)

**Response:**
- Fix documentation issues first
- Do not proceed to code implementation
- Retry documentation commit

### Step 5: BLOCK code commits without prior docs ❌

**Action:** Prevent code commits without documentation commits

**Validation:**
- Check git history for `doc({key}):` commit
- Verify timestamp: doc commit BEFORE code commit
- Halt if code committed first

**Recovery:**
- If violation detected, create retroactive documentation
- Update work-log.md with session details
- Commit as `doc({key}): Retroactive session documentation`

---

## 🔍 Validation Algorithm

**Function Name:** `ValidateDocumentFirst(key)`

```
FUNCTION ValidateDocumentFirst(key):
  
  # Step 1: Check if key folder exists
  keyFolder = ".github/key-data-streams/{key}/"
  IF NOT FolderExists(keyFolder) THEN
    RETURN { violation: false, reason: "New key (no prior documentation)" }
  END IF
  
  # Step 2: Get git commits for this key
  commits = Git("log --grep='({key}):' --oneline -20")
  
  # Step 3: Separate documentation vs code commits
  docCommits = commits.Filter(c => c.StartsWith("doc({key}):"))
  codeCommits = commits.Filter(c => c.StartsWith("task({key}):") OR c.StartsWith("ckpt({key}):"))
  
  # Step 4: Check if code committed before documentation
  IF codeCommits.Count > 0 AND docCommits.Count > 0 THEN
    # Get timestamps (Unix format)
    latestDoc = Git("log --grep='doc({key}):' --format='%at' -1")
    latestCode = Git("log --grep='task({key}):' --format='%at' -1")
    
    IF latestCode > latestDoc THEN
      RETURN {
        violation: true,
        type: "CODE_BEFORE_DOCS",
        lastDoc: FormatTimestamp(latestDoc),
        lastCode: FormatTimestamp(latestCode),
        timeDiff: latestCode - latestDoc,
        message: "Code committed BEFORE documentation update"
      }
    END IF
  END IF
  
  # Step 5: Check if work-log.md updated in this session
  workLog = "{keyFolder}work-log.md"
  IF FileExists(workLog) THEN
    lastModified = GetFileTimestamp(workLog)
    sessionStart = Now() - 5 minutes  # Reasonable threshold for active session
    
    IF lastModified < sessionStart THEN
      RETURN {
        violation: true,
        type: "STALE_WORKLOG",
        lastModified: FormatTimestamp(lastModified),
        currentTime: FormatTimestamp(Now()),
        message: "work-log.md not updated in this session"
      }
    END IF
  ELSE
    RETURN {
      violation: true,
      type: "MISSING_WORKLOG",
      message: "work-log.md does not exist for key"
    }
  END IF
  
  # Step 6: Check if plan file needs updating
  planFile = "{keyFolder}{key}.plan.md"
  IF FileExists(planFile) THEN
    planModified = GetFileTimestamp(planFile)
    workLogModified = GetFileTimestamp(workLog)
    
    # If work-log updated but plan not, might need plan update
    IF workLogModified > planModified + 1 hour THEN
      # Warning, not violation (plan updates less frequent)
      WARN("Plan file may need updating (last modified > 1 hour ago)")
    END IF
  END IF
  
  RETURN { violation: false }
  
END FUNCTION
```

---

## 🛑 Enforcement Action

**Auto-Fix Available:** yes (execute document-first checkpoint)

```
IF ValidateDocumentFirst(key).violation THEN
  
  # Step 1: Log violation
  LogViolation(".github/audits/mandate-violations.log", {
    timestamp: Now(),
    rule: "DOCUMENT_FIRST",
    key: key,
    violation: validationResult,
    violationType: validationResult.type
  })
  
  # Step 2: HALT execution
  SHOW_ERROR("MANDATE VIOLATION: Documentation not updated before code changes")
  
  # Step 3: Show specific fix based on violation type
  IF validationResult.type == "CODE_BEFORE_DOCS" THEN
    SHOW_FIX("Code committed before documentation. Create retroactive documentation entry.")
    
  ELSE IF validationResult.type == "STALE_WORKLOG" THEN
    SHOW_FIX("Update work-log.md with current session details.")
    
  ELSE IF validationResult.type == "MISSING_WORKLOG" THEN
    SHOW_FIX("Create work-log.md for key: {key}")
    
  END IF
  
  # Step 4: Execute document-first checkpoint module
  SHOW_INFO("Executing: .github/prompts/shared/step-2-5-document-first-checkpoint.md")
  
  ExecuteModule("step-2-5-document-first-checkpoint.md", {
    key: key,
    userRequest: CurrentRequest,
    phase: CurrentPhase,
    violationType: validationResult.type
  })
  
  # Step 5: Verify fix
  RETRY ValidateDocumentFirst(key)
  
  # Step 6: If still violating, HALT
  IF ValidateDocumentFirst(key).violation THEN
    HALT_EXECUTION("Unable to auto-fix document-first violation")
  END IF
  
END IF
```

---

## 📄 Implementation Module

**Module:** `.github/prompts/shared/step-2-5-document-first-checkpoint.md`

**Purpose:** Automates documentation-first workflow

**Actions:**
1. Detects current key and phase
2. Creates/updates work-log.md with session entry
3. Updates plan file (if exists and applicable)
4. Commits documentation with proper prefix
5. Validates commit succeeded

**Usage:**
```markdown
# In any prompt, before code implementation:

EXECUTE_MODULE("step-2-5-document-first-checkpoint.md")

# Module will:
# - Prompt for session details (if not in context)
# - Update work-log.md
# - Commit changes
# - Validate compliance
```

---

## Session Entry Templates

### Template 1: New Session (Starting Work)

```markdown
## Session: {date} ({session-title})

**Action:** {what-you're-doing}  
**Status:** {phase} - {step}  
**Context:** {why-this-work}

**Objective:**
{goal-of-session}

**Plan:**
- {step-1}
- {step-2}
- {step-3}

**Next:** {next-action}
```

### Template 2: Continuation Session (Resuming Work)

```markdown
## Session: {date} (Continued - {session-title})

**Action:** Continuing {what-you're-doing}  
**Status:** {phase} - {step}  
**Previous Session:** {date} - {what-was-done}

**Today's Focus:**
- {task-1}
- {task-2}

**Next:** {next-action}
```

### Template 3: Completion Session (Finishing Phase/Key)

```markdown
## Session: {date} (Completion - {session-title})

**Action:** Finalizing {what-you're-finishing}  
**Status:** Complete  
**Summary:** {brief-summary-of-work}

**Deliverables:**
- ✅ {deliverable-1}
- ✅ {deliverable-2}
- ✅ {deliverable-3}

**Outcome:** {result-of-work}

**Next Steps:** {future-work-or-none}
```

### Template 4: Bug Fix Session

```markdown
## Session: {date} (Bug Fix - {issue-description})

**Action:** Fixing {bug-description}  
**Status:** Phase {N} - Debugging  
**Issue:** {what's-broken}

**Root Cause:** {identified-cause}

**Fix Approach:**
1. {step-1}
2. {step-2}

**Testing:** {how-to-verify}

**Next:** {next-action}
```

---

## Related Documentation

**Related Rules:**
- [no-code-in-chat](../no-code-in-chat/rule.md) - Implementation goes to KDS files

**Implementation Modules:**
- `.github/prompts/shared/step-2-5-document-first-checkpoint.md` - Auto-executes documentation workflow

**KDS Structure:**
- `.github/key-data-streams/_template/` - KDS templates
- `.github/key-data-streams/README.md` - KDS documentation

**Examples:**
- See [examples.md](examples.md) in this folder

---

**This rule is SOURCE OF TRUTH until user explicitly changes it.**

**Last Updated:** 2025-10-30  
**Version:** 1.0.0
