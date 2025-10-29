# File Finalization Verifier

**Version:** 1.0.0  
**Created:** 2025-10-29  
**Purpose:** Block user output until all key data stream files are verified to exist

---

## Purpose

Enforce "Document First, Respond Later" protocol by verifying file creation/updates BEFORE sending responses to users.

---

## Algorithm

```
FUNCTION VerifyFileFinalization(key, requiredFiles)
  
  // Check each required file exists
  FOR EACH file IN requiredFiles
    IF NOT FileExists(file) THEN
      HALT_EXECUTION()
      LOG_ERROR("File finalization incomplete: {file} missing")
      SHOW_USER_ERROR("Documentation incomplete - please retry")
      RETURN FALSE
    END IF
  END FOR
  
  // All files verified
  LOG_SUCCESS("File finalization complete: {requiredFiles.length} files verified")
  RETURN TRUE
  
END FUNCTION
```

---

## Required Files by Prompt

### route.prompt.md
**Required Files:** None

**Reason:** Route prompt is an orchestrator that delegates file creation to target agents (plan, task, todo). File finalization delegated to target agent.

---

### plan.prompt.md
**Required Files:**
1. `.github/key-data-streams/{key}/{key}.plan.md` - Comprehensive plan document
2. `.github/key-data-streams/{key}/{key}.plan.json` - JSON tracking metadata
3. `.github/key-data-streams/{key}/work-log.md` - Work log initialization
4. `.github/key-data-streams/{key}/state.json` - State tracking (if enabled)

**Verification Timing:** Step 5.5 (BEFORE Step 6: Handoff Preparation)

**Action if Missing:**
- HALT execution immediately
- Log error with missing file path
- DO NOT proceed to Step 7.5 (Response Validation)
- DO NOT show user output
- Display error message: "Plan file creation incomplete - missing {filename}"

---

### task.prompt.md
**Required Files:**
1. `.github/key-data-streams/{key}/work-log.md` - Work log updated (modified timestamp within 60 seconds)
2. `.github/key-data-streams/{key}/state.json` - State tracking commit log (if enabled)

**Verification Timing:** Step 8.25 (BEFORE Step 8.5: Response Validation)

**Action if Missing:**
- HALT execution immediately
- Check file modification timestamp
- If work-log.md not modified recently (>60 seconds ago): FAIL verification
- Display error message: "Work log update incomplete - file not modified"

**Timestamp Verification:**
```
FUNCTION VerifyWorkLogUpdated(filePath)
  
  IF NOT FileExists(filePath) THEN
    RETURN FALSE
  END IF
  
  lastModified = GetFileModificationTime(filePath)
  currentTime = GetCurrentTime()
  timeDifference = currentTime - lastModified
  
  // File must be modified within last 60 seconds
  IF timeDifference > 60_SECONDS THEN
    LOG_ERROR("Work log not recently updated: last modified {timeDifference}s ago")
    RETURN FALSE
  END IF
  
  RETURN TRUE
  
END FUNCTION
```

---

### todo.prompt.md
**Required Files:**
1. `.github/key-data-streams/{key}/work-log.md` - Work log appended (file size increased)
2. `.github/key-data-streams/{key}/state.json` - State tracking (if enabled)

**Verification Timing:** Between execution and response validation

**Action if Missing:**
- HALT execution immediately
- Check file size before/after append operation
- If file size unchanged: FAIL verification
- Display error message: "Work log append failed - no changes detected"

**Append Verification:**
```
FUNCTION VerifyWorkLogAppended(filePath, previousSize)
  
  IF NOT FileExists(filePath) THEN
    RETURN FALSE
  END IF
  
  currentSize = GetFileSize(filePath)
  
  // File size must increase (append operation)
  IF currentSize <= previousSize THEN
    LOG_ERROR("Work log append failed: size {previousSize} → {currentSize}")
    RETURN FALSE
  END IF
  
  LOG_SUCCESS("Work log appended: {currentSize - previousSize} bytes added")
  RETURN TRUE
  
END FUNCTION
```

---

## Integration with Response Validation

**Execution Order:**

1. **File Finalization Verification** (this algorithm)
   - Verify all required files exist
   - Check modification timestamps (task/todo)
   - Check file size changes (todo append)
   - HALT if any verification fails

2. **Response Validation** (output-validator.md)
   - Count bullets (≤15 limit)
   - Detect code blocks (prohibit implementation code)
   - Check nested lists (flatten)
   - Verify next actions present

3. **User Output** (only if both pass)
   - Show response to user
   - Include next action options

**Critical Rule:** Response validation NEVER runs if file finalization fails.

---

## Error Messages

### Missing Plan File
```
❌ FILE FINALIZATION FAILED

File: .github/key-data-streams/{key}/{key}.plan.md
Status: MISSING
Phase: Planning (Step 5.5)

The plan file was not created. This indicates a critical failure in the planning process.

ACTION REQUIRED:
1. Check for errors in plan generation
2. Verify file write permissions
3. Retry planning process

EXECUTION HALTED - No user output generated
```

### Stale Work Log (task)
```
❌ FILE FINALIZATION FAILED

File: .github/key-data-streams/{key}/work-log.md
Status: NOT RECENTLY MODIFIED
Last Modified: {timestamp} ({seconds} seconds ago)
Expected: Modified within last 60 seconds

The work log was not updated after task execution. This indicates incomplete documentation.

ACTION REQUIRED:
1. Verify work log update in Step 8
2. Check for file write errors
3. Manually update work log if needed

EXECUTION HALTED - No user output generated
```

### Unchanged Work Log (todo)
```
❌ FILE FINALIZATION FAILED

File: .github/key-data-streams/{key}/work-log.md
Status: UNCHANGED (no append detected)
Size Before: {previousSize} bytes
Size After: {currentSize} bytes

The work log was not appended during todo execution. This indicates missing documentation.

ACTION REQUIRED:
1. Verify work log append operation
2. Check if work was actually executed
3. Manually append work log entry if needed

EXECUTION HALTED - No user output generated
```

---

## Version History

**1.0.0** (2025-10-29)
- Initial implementation
- File existence verification for plan, task, todo prompts
- Timestamp verification for task work log updates
- Append verification for todo work log extensions
- Error message templates for all failure modes
