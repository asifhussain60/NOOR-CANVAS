# Test: Rule #20 KDTR Enforcement

**Rule**: KDS Test Registry (KDTR) must be consulted BEFORE test generation for pattern reuse and updated AFTER successful test execution

**Severity**: HIGH

**Last Tested**: Never

---

## Assertion

All tests must query `.github/test-registry/` before generation and publish test data after successful execution to enable pattern reuse

---

## Test Scope

**Files Under Test**:
- `.github/prompts/test-generation.prompt.md` (Step 1.5 - Query KDTR)
- `.github/test-registry/` (KDTR file structure)
- Test orchestration scripts (atomic KDTR publication)

**Validation Function**: `ValidateKDTREnforcement()` (kds-rulebook.json)

---

## Test Steps

### Step 1: Verify Pre-Generation Query Logic

**Check test-generation.prompt.md Step 1.5**:
```
Read test-generation.prompt.md
Search for "Step 1.5" or "Query KDTR" or "test-registry"
Verify logic exists to:
  1. Search .github/test-registry/{key}/ for existing patterns
  2. Check pattern validity (age <30 days, tokens valid, selectors current)
  3. Present REUSE option if valid pattern found
  4. Proceed with NEW generation if no pattern or invalid
```

**Expected Pattern**:
```markdown
### Step 1.5: Query KDTR for Pattern Reuse

**Algorithm**: .github/prompts/shared/kdtr-query.md

Search .github/test-registry/{key}/ for:
  - Matching test patterns (navigation, authentication, API validation)
  - Session data (tokens, sessionId)
  - UI selectors

IF pattern found AND valid:
  Present option: REUSE existing pattern OR GENERATE new test
ELSE:
  Proceed with new test generation
```

### Step 2: Verify Post-Execution Publication Logic

**Check test orchestration scripts**:
```
Scan Scripts/ or Tests/ for orchestration script patterns:
  - run-{key}-test.ps1
  - test-{feature}.ps1

Verify each script includes KDTR publication after test PASS:
  1. Test execution
  2. IF test PASSED:
       Capture screenshots, logs, network traces
       Extract test data (sessionData, apiResponses, uiState)
       Write to .github/test-registry/{key}/{test-name}.json
  3. ELSE (test FAILED):
       Skip KDTR publication
```

**Expected Pattern**:
```powershell
# After test execution
if ($testResult.Passed) {
    # Publish to KDTR
    $kdtrEntry = @{
        testName = "session-join-test"
        sessionData = @{
            sessionId = 212
            hostToken = "PQ9N5YWW"
            userToken = "KJAHA99L"
        }
        # ...more test data
    }
    $kdtrEntry | ConvertTo-Json -Depth 10 | Out-File ".github/test-registry/session/$testName.json"
}
```

### Step 3: Verify KDTR File Structure

**Check `.github/test-registry/` structure**:
```
Verify directories exist:
  - .github/test-registry/session-212/
  - .github/test-registry/README.md (documentation)
  - .github/test-registry/schema.json (entry schema)

Verify key directories match active keys:
  FOR EACH key in .github/key-data-streams/*/:
    IF key has tests (tests/ folder exists):
      Verify .github/test-registry/{key}/ exists
```

### Step 4: Verify Canonical Session 212 Data

**Check session-212 reference data**:
```
Verify .github/test-registry/session-212/valid-tokens.json exists
Parse JSON:
  - sessionId: 212
  - hostToken: "PQ9N5YWW" or "KJAHA99L"
  - userToken: (complement of hostToken)
  - expiresAt: (date stamp)

This file serves as default reference for ALL tests requiring tokens
```

### Step 5: Test Pattern Reuse Criteria

**Validate reuse logic**:
```
FOR EACH KDTR entry in test-registry/:
  age = CURRENT_DATE - entry.lastVerified
  
  IF age > 30 days:
    Mark as STALE (should not reuse without validation)
  
  IF entry.sessionData.expiresAt < CURRENT_DATE:
    Mark as EXPIRED (tokens invalid)
  
  IF entry.uiState.selectors references deprecated elements:
    Mark as OUTDATED (selectors need update)
```

---

## Expected Outcomes

### ✅ PASS Criteria

**Pre-Generation (test-generation.prompt.md)**:
1. Step 1.5 "Query KDTR" section exists
2. Search logic targets `.github/test-registry/{key}/`
3. Pattern validity check implemented (age, tokens, selectors)
4. REUSE option presented when valid pattern found

**Post-Execution (orchestration scripts)**:
1. KDTR publication logic present in test scripts
2. Publication ONLY happens after test PASSED
3. All required fields captured (sessionData, apiResponses, uiState, testPatterns, reuseGuidance)
4. Atomic commit (test file + KDTR entry together)

**KDTR Structure**:
1. `.github/test-registry/` directory exists
2. Schema and README documentation present
3. session-212/ canonical data exists with valid tokens
4. Key directories match active keys with tests

**Example PASS**:
```
✅ test-generation.prompt.md Step 1.5: Query KDTR present
✅ Pattern reuse criteria implemented (age <30 days, tokens valid)
✅ Orchestration scripts publish to KDTR after test PASS
✅ KDTR structure complete (schema, README, session-212/)
✅ All KDTR entries have required fields (sessionData, apiResponses, uiState)
```

### ❌ FAIL Criteria

**HIGH Violations**:
1. test-generation.prompt.md missing Step 1.5 (KDTR query)
2. Orchestration scripts don't publish to KDTR
3. Tests publish to KDTR even when FAILED (corrupts pattern library)
4. KDTR entries missing required fields (incomplete pattern data)

**MEDIUM Violations**:
1. Pattern reuse criteria not implemented (age, tokens, selectors)
2. KDTR structure incomplete (missing schema or README)
3. session-212 canonical data missing or expired

---

## Violation Examples

### Example 1: Missing KDTR Query (HIGH)

**File**: test-generation.prompt.md  
**Issue**: Step 1.5 not found, no KDTR search logic

**Impact**:
- Tests always generated from scratch (40-60% wasted effort)
- No pattern reuse (duplicate test creation)
- Knowledge not transferred between sessions

**Fix**:
```markdown
Add Step 1.5 to test-generation.prompt.md:

### Step 1.5: Query KDTR for Pattern Reuse

**Before generating new test**, search .github/test-registry/{key}/ for existing patterns:

**Algorithm**: .github/prompts/shared/kdtr-query.md

IF pattern found AND valid (age <30 days, tokens not expired, selectors current):
  Present options:
    A. REUSE - Use existing pattern (faster, proven working)
    B. GENERATE - Create new test (different scope or updated requirements)
ELSE:
  Proceed with new test generation
```

### Example 2: Failed Tests Published to KDTR (HIGH)

**File**: Scripts/run-session-test.ps1  
**Issue**: KDTR entry created even when test FAILED

**Impact**:
- Corrupts pattern library with broken tests
- Future test generation may reuse failing patterns
- KDTR becomes unreliable

**Fix**:
```powershell
# BEFORE (WRONG):
# Publish to KDTR regardless of test result
$kdtrEntry | ConvertTo-Json | Out-File ".github/test-registry/session/$testName.json"

# AFTER (CORRECT):
# Only publish if test PASSED
if ($testResult.Passed) {
    $kdtrEntry | ConvertTo-Json | Out-File ".github/test-registry/session/$testName.json"
    Write-Host "✅ Published to KDTR: $testName"
} else {
    Write-Host "⚠️ Test FAILED - skipping KDTR publication"
}
```

### Example 3: Incomplete KDTR Entry (MEDIUM)

**File**: `.github/test-registry/session/session-join-test.json`  
**Issue**: Missing required fields (reuseGuidance, testPatterns)

**Detected**:
```json
{
  "testName": "session-join-test",
  "sessionData": { "sessionId": 212 }
  // Missing: apiResponses, uiState, testPatterns, reuseGuidance
}
```

**Impact**:
- Reduces pattern reusability (incomplete data for future reference)
- Can't determine when to reuse pattern

**Fix**:
```json
{
  "testName": "session-join-test",
  "sessionData": {
    "sessionId": 212,
    "hostToken": "PQ9N5YWW",
    "expiresAt": "2025-12-31"
  },
  "apiResponses": [
    { "endpoint": "/api/sessions/join", "status": 200 }
  ],
  "uiState": {
    "selectors": ["data-testid='join-button'", "text='Session Code'"],
    "navigationPaths": ["/", "/join"]
  },
  "testPatterns": ["navigation", "authentication", "apiValidation"],
  "reuseGuidance": {
    "whenToReuse": "Any session join workflow with host/user roles",
    "usageExamples": ["Two-user session tests", "Role-based access tests"]
  }
}
```

---

## Rollback on Failure

### If KDTR Query Missing:

**Action**: Add Step 1.5 to test-generation.prompt.md

**Template** (insert before test generation logic):
```markdown
### Step 1.5: Query KDTR for Pattern Reuse

**MANDATORY** - Query KDS Test Registry before generating new test

**Algorithm**: See `.github/prompts/shared/kdtr-query.md`

1. Search `.github/test-registry/{key}/` for JSON files
2. IF patterns found:
     Analyze age, tokens, API endpoints, selectors
     IF valid (age <30 days, tokens not expired, selectors current):
       Present REUSE option with pattern details
     ELSE:
       Proceed with NEW test generation
3. ELSE (no patterns):
     Proceed with NEW test generation
```

### If Failed Tests in KDTR:

**Action**: Audit and clean KDTR entries

**Algorithm**:
```powershell
# Find all KDTR entries
$kdtrFiles = Get-ChildItem .github/test-registry/ -Recurse -Filter "*.json"

foreach ($file in $kdtrFiles) {
    $entry = Get-Content $file.FullName | ConvertFrom-Json
    
    # Verify test actually passed (check test results)
    # If test failed, delete KDTR entry
    if ($entry.testResult -eq "FAILED") {
        Write-Warning "Removing failed test from KDTR: $($file.Name)"
        Remove-Item $file.FullName
    }
}
```

---

## Automated Checks

**Pre-Test-Generation Hook**:
```powershell
# Verify KDTR query executed before test generation
$testGenPrompt = Get-Content ".github/prompts/test-generation.prompt.md" -Raw

if ($testGenPrompt -notmatch "Step 1\.5.*KDTR|Query.*test-registry") {
    Write-Error "HIGH: Rule #20 violation - test-generation.prompt.md missing KDTR query (Step 1.5)"
    Write-Error "Fix: Add KDTR query logic before test generation"
    exit 1
}
```

**Post-Test-Execution Verification**:
```powershell
# Verify KDTR publication only happens after test PASS
$orchestrationScripts = Get-ChildItem Scripts/ -Filter "run-*-test.ps1"

foreach ($script in $orchestrationScripts) {
    $content = Get-Content $script.FullName -Raw
    
    # Check if KDTR publication is conditional on test pass
    if ($content -match "test-registry" -and $content -notmatch "if.*Passed.*test-registry|testResult.*Passed") {
        Write-Warning "MEDIUM: $($script.Name) may publish to KDTR even on test failure"
    }
}
```

**KDS Review Mode Integration**:
- Execute this test during kds.prompt.md Review Mode Step 3 (Validate Against Rulebook)
- Report KDTR compliance in summary
- Auto-fix available: Add Step 1.5 to test-generation.prompt.md

---

## Test Metadata

**Test ID**: test-rule-20-kdtr-enforcement  
**Category**: Testing  
**Frequency**: Every KDS Review Mode + Before test generation  
**Auto-Fix**: Supported (add Step 1.5, clean failed tests)  
**Related Tests**: test-rule-7-test-index, test-rule-16-test-approval-gate  
**Estimated Runtime**: <15 seconds (file scanning + KDTR audit)

---

## KDTR Schema Reference

**Required Fields in KDTR Entry**:
```json
{
  "testName": "string (unique identifier)",
  "sessionData": {
    "sessionId": "integer",
    "hostToken": "string",
    "userToken": "string",
    "expiresAt": "ISO 8601 date"
  },
  "apiResponses": [
    {
      "endpoint": "string (e.g., /api/sessions/join)",
      "payload": "object (request body)",
      "status": "integer (HTTP status code)"
    }
  ],
  "uiState": {
    "selectors": ["array of data-testid/text/class selectors"],
    "navigationPaths": ["array of routes visited"],
    "elementStates": ["array of element states verified"]
  },
  "testPatterns": ["navigation", "authentication", "apiValidation", "etc"],
  "reuseGuidance": {
    "whenToReuse": "string (conditions for reusing this pattern)",
    "usageExamples": ["array of example scenarios"],
    "knownWorkingTests": ["array of tests using this pattern"]
  },
  "evidence": {
    "screenshots": ["array of screenshot paths"],
    "consoleLogs": ["array of relevant log entries"],
    "networkTraces": ["array of network request details"]
  },
  "lastVerified": "ISO 8601 date",
  "createdBy": "string (test generation session)"
}
```

**Canonical Session 212 Location**:
`.github/test-registry/session-212/valid-tokens.json`
