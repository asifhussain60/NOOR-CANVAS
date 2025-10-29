# step-0-branch-verification.md

**Purpose:** Pre-flight branch verification to enforce SelfAwareness.instructions.md branch strategy

**Version:** 1.0.0  
**Created:** 2025-10-29  
**Module Type:** Shared Protocol (loaded by task.prompt.md and plan.prompt.md)

---

## When to Execute

**MANDATORY STEP 0 for:**
- task.prompt.md (before any execution)
- plan.prompt.md (before plan creation)
- Any agent that modifies code or creates commits

**Trigger:** ALWAYS execute before Step 1 in any execution workflow

---

## Verification Algorithm

```
FUNCTION VerifyBranchStrategy(githubBranch = "development"):
  
  # 1. Get current branch
  currentBranch = ExecuteCommand("git branch --show-current")
  
  # 2. Validate against expected branch
  IF currentBranch == "master" AND githubBranch != "master" THEN
    # CRITICAL VIOLATION: Cannot execute on master
    RETURN {
      status: "BLOCKED",
      violation: "CRITICAL",
      currentBranch: currentBranch,
      expectedBranch: githubBranch,
      action: "ABORT_EXECUTION",
      message: GenerateCriticalViolationMessage(currentBranch, githubBranch)
    }
  END IF
  
  # 3. Check for branch mismatch (non-master)
  IF currentBranch != githubBranch THEN
    # WARNING: Branch mismatch (allow override)
    RETURN {
      status: "WARNING",
      violation: "MISMATCH",
      currentBranch: currentBranch,
      expectedBranch: githubBranch,
      action: "PROMPT_USER",
      message: GenerateMismatchWarningMessage(currentBranch, githubBranch)
    }
  END IF
  
  # 4. All clear - branch matches expected
  RETURN {
    status: "OK",
    violation: null,
    currentBranch: currentBranch,
    expectedBranch: githubBranch,
    action: "PROCEED",
    message: GenerateSuccessMessage(currentBranch)
  }
  
END FUNCTION
```

---

## Message Templates

### Critical Violation Message (BLOCKING)

```markdown
❌ CRITICAL: Cannot execute on master branch

**Current Branch:** master
**Required Branch:** {githubBranch} (per github-branch parameter or default)

**Per SelfAwareness.instructions.md:**
- ALL development work occurs in 'development' branch
- 'master' is PROTECTED (production deploy target only)
- Direct commits to 'master' are PROHIBITED

**ACTION REQUIRED:**
Switch to development branch before proceeding.

**Command:**
```bash
git checkout development
```

**Reason:**
- Production stability: master only contains tested, deployable code
- Safe experimentation: development allows iteration without affecting production
- Clear deployment path: ncdeploy.ps1 knows to deploy from master

❌ ABORTING task execution

**DO NOT PROCEED** - Change branches first, then re-run this command.
```

**Behavior:** HALT execution immediately, EXIT with error code 1

---

### Branch Mismatch Warning (PROMPT)

```markdown
⚠️ WARNING: Branch mismatch detected

**Current Branch:** {currentBranch}
**Expected Branch:** {githubBranch} (from github-branch parameter)

**Per SelfAwareness.instructions.md:**
- Development work should happen in 'development' branch
- Feature branches are for isolated experiments only
- Work on wrong branch can lead to merge conflicts

**Options:**
**A.** Switch to {githubBranch} branch (recommended)
**B.** Proceed on {currentBranch} anyway (override - will document in work log)

**Command to switch:**
```bash
git checkout {githubBranch}
```

Reply: A or B
```

**Behavior:** Wait for user choice

**User Choice Handling:**
- **A:** Execute `git checkout {githubBranch}`, verify switch, then proceed
- **B:** Log override in work log with reason, proceed on current branch

---

### Success Message (PROCEED)

```markdown
✅ Branch verified: {currentBranch}

**Status:** Matches expected branch ({githubBranch})
**Action:** Proceeding with execution

Per SelfAwareness.instructions.md - branch strategy compliant.
```

**Behavior:** Proceed to next step immediately

---

## Integration Points

### task.prompt.md - Step 0

**Replace existing Step 0 content with:**

```markdown
### Step 0: Branch Verification (MANDATORY)

**LOAD MODULE:** `.github/prompts/shared/step-0-branch-verification.md`

**Execute:**
```powershell
# Verify branch strategy compliance
$branchCheck = VerifyBranchStrategy($githubBranch)

IF $branchCheck.status == "BLOCKED" THEN
  SHOW_MESSAGE($branchCheck.message)
  EXIT 1
END IF

IF $branchCheck.status == "WARNING" THEN
  SHOW_MESSAGE($branchCheck.message)
  WAIT_FOR_USER_CHOICE()  # A or B
  
  IF userChoice == "A" THEN
    ExecuteCommand("git checkout $branchCheck.expectedBranch")
    VERIFY_BRANCH_SWITCH()
  ELSE IF userChoice == "B" THEN
    LOG_OVERRIDE_TO_WORK_LOG($branchCheck)
  END IF
END IF

# Proceed to Step 1 (checkpoint commit)
```

**Critical:** NO execution past this step if status == "BLOCKED"
```

---

### plan.prompt.md - Step 0

**Add before Step 0.5 (Key Consultation):**

```markdown
### Step 0: Branch Verification (MANDATORY)

**LOAD MODULE:** `.github/prompts/shared/step-0-branch-verification.md`

**Purpose:** Ensure plan creation happens in correct branch

**Execute:**
```powershell
# Default to development unless user specifies otherwise
$githubBranch = $parameters.githubBranch ?? "development"
$branchCheck = VerifyBranchStrategy($githubBranch)

IF $branchCheck.status == "BLOCKED" THEN
  SHOW_MESSAGE($branchCheck.message)
  EXIT 1
END IF

IF $branchCheck.status == "WARNING" THEN
  SHOW_MESSAGE($branchCheck.message)
  WAIT_FOR_USER_CHOICE()
  
  IF userChoice == "A" THEN
    ExecuteCommand("git checkout $branchCheck.expectedBranch")
  ELSE IF userChoice == "B" THEN
    LOG_OVERRIDE($branchCheck)
  END IF
END IF

# Proceed to Step 0.5 (Key Consultation)
```
```

---

## Override Logging Format

**When user selects Option B (proceed on non-standard branch):**

**Work Log Entry:**
```markdown
### Branch Strategy Override

**Session:** {timestamp}
**Current Branch:** {currentBranch}
**Expected Branch:** {expectedBranch}
**Override Reason:** User selected Option B (manual override)
**Status:** Proceeding with execution on {currentBranch}

**⚠️ NOTE:** This violates standard branch strategy but was user-approved.
Ensure proper merge/rebase handling when integrating to development.
```

---

## Command Reference

### Check Current Branch
```bash
git branch --show-current
```

### Switch Branch
```bash
git checkout development
```

### Verify Branch After Switch
```bash
# Should output: development (or expected branch)
git branch --show-current
```

---

## Enforcement Summary

| Scenario | Current Branch | Expected Branch | Action |
|----------|---------------|-----------------|--------|
| **CRITICAL** | master | development | **ABORT** - No execution allowed |
| **CRITICAL** | master | {any-other} | **ABORT** - No execution allowed |
| **WARNING** | feature-x | development | **PROMPT** - Switch or override |
| **OK** | development | development | **PROCEED** - Verified compliant |
| **OK** | {branch} | {same-branch} | **PROCEED** - Matches parameter |

---

## Rationale

**Why this prevents violations:**

1. **Catches accidental master commits** - Agents check BEFORE any execution
2. **Enforces consistency** - All work flows through development branch
3. **User override available** - Flexibility for legitimate edge cases
4. **Documented overrides** - Work log tracks non-standard workflows
5. **Early detection** - Fails fast before any file modifications

**What this fixes from CopilotChats.md:**
- Line 125-400: Phase 1 executed on `features/fab-button` instead of `development`
- Expected: Branch check would have detected violation and prompted switch
- Result: Work properly scoped to development branch

---

## See Also

- `.github/instructions/SelfAwareness.instructions.md` - Branch strategy rules
- `.github/prompts/shared/commit-checkpoint-protocol.md` - Checkpoint commit format
- `.github/prompts/task.prompt.md` - Task execution workflow
- `.github/prompts/plan.prompt.md` - Plan generation workflow
