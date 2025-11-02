# Task Prompt Algorithms
**Purpose:** Workflow algorithms for task.prompt.md execution logic  
**Version:** 1.0.0  
**Last Updated:** 2025-10-31

---

## Algorithm 1: Branch Strategy Verification

**Purpose:** Verify current git branch matches expected github-branch parameter, prevent master branch execution

```
FUNCTION VerifyBranchStrategy(githubBranch)
  
  currentBranch = GitGetCurrentBranch()
  expectedBranch = githubBranch ?? "development"
  
  // CRITICAL: Block master branch execution
  IF currentBranch == "master" AND expectedBranch != "master" THEN
    RETURN {
      "status": "BLOCKED",
      "message": "⛔ CRITICAL: Cannot execute on master branch. Please switch to development or feature branch.",
      "currentBranch": currentBranch,
      "expectedBranch": expectedBranch
    }
  END IF
  
  // Warning: Branch mismatch
  IF currentBranch != expectedBranch THEN
    RETURN {
      "status": "WARNING",
      "message": "⚠️ Branch mismatch detected. Current: {currentBranch}, Expected: {expectedBranch}",
      "currentBranch": currentBranch,
      "expectedBranch": expectedBranch,
      "options": [
        "A. Switch to {expectedBranch} (RECOMMENDED)",
        "B. Continue on {currentBranch} (log override)"
      ]
    }
  END IF
  
  // Success: Branch matches
  RETURN {
    "status": "OK",
    "currentBranch": currentBranch,
    "expectedBranch": expectedBranch
  }
  
END FUNCTION
```

**Enforcement:**
- ⚠️ **ABORT** if on `master` branch (unless github-branch explicitly set to `master`)
- ✅ **PROCEED** if current branch matches github-branch parameter
- ⚠️ **PROMPT** user if mismatch detected (allow override with warning)

---

## Algorithm 2: Document First Checkpoint

**Purpose:** Update key documentation (plan.md, work-log.md) BEFORE any code implementation

```
FUNCTION DocumentFirstCheckpoint(key, userRequest, phase)
  
  keyPath = ".github/key-data-streams/{key}"
  
  // Check if key folder exists
  IF NOT DirectoryExists(keyPath) THEN
    RETURN {
      "status": "SKIP",
      "reason": "Key folder doesn't exist yet (first-time execution)"
    }
  END IF
  
  // Update plan.md with session context
  planFile = "{keyPath}/{key}.plan.md"
  sessionEntry = GenerateSessionEntry(userRequest, DateTime.Now)
  AppendToFile(planFile, sessionEntry)
  
  // Update work-log.md with session start
  workLogFile = "{keyPath}/work-log.md"
  logEntry = GenerateWorkLogEntry("session-start", phase, userRequest)
  AppendToFile(workLogFile, logEntry)
  
  // Commit documentation changes
  commitResult = GitCommit([planFile, workLogFile], "doc({key}): session start documentation")
  
  IF commitResult.success THEN
    RETURN {
      "status": "SUCCESS",
      "filesUpdated": [planFile, workLogFile],
      "commitSha": commitResult.sha
    }
  ELSE
    RETURN {
      "status": "FAILED",
      "reason": commitResult.error
    }
  END IF
  
END FUNCTION
```

**Guardrail:** Code commits WITHOUT prior documentation updates = VIOLATION

---

## Algorithm 3: Plan Validation Gate

**Purpose:** Write lightweight plan to file, validate structure before proceeding

```
FUNCTION PlanValidationGate(key, planContent)
  
  keyPath = ".github/key-data-streams/{key}"
  planFile = "{keyPath}/{key}.plan.md"
  
  // Check if comprehensive plan already exists
  IF FileExists(planFile) AND FileSize(planFile) > 5000 THEN
    // Comprehensive plan from plan.prompt.md exists
    RETURN {
      "status": "SKIP",
      "reason": "Comprehensive plan already exists from plan.prompt.md"
    }
  END IF
  
  // Write lightweight plan
  WriteFile(planFile, planContent)
  
  // Validate plan structure
  validation = ValidatePlanStructure(planContent)
  
  IF validation.errors.Count > 0 THEN
    RETURN {
      "status": "FAILED",
      "reason": "Plan validation failed",
      "errors": validation.errors
    }
  END IF
  
  // Success
  RETURN {
    "status": "SUCCESS",
    "file": planFile,
    "fileSize": FileSize(planFile)
  }
  
END FUNCTION
```

**Trigger:** Only execute if lightweight planning mode (no comprehensive plan exists)

---

## Related Files
- **Consumer:** `.github/prompts/task.prompt.md`
- **Protocol:** `.github/prompts/shared/kds-handoff-protocol.md`
- **Governance:** `.github/governance/kds-rulebook.json`
