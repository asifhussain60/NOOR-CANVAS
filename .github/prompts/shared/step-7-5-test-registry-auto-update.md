# step-7-5-test-registry-auto-update.md

**Purpose:** Automatically update test registry when creating Playwright tests - prevent manual oversight

**Version:** 1.0.0  
**Created:** 2025-10-29  
**Module Type:** Shared Protocol (loaded by test-generation.prompt.md and task.prompt.md)

---

## When to Execute

**MANDATORY for test-generation.prompt.md:**
- **Location:** Step 7 (AFTER test file creation, BEFORE commit)
- **Trigger:** ALWAYS when test files created
- **Blocking:** Commit includes test registry update

**OPTIONAL for task.prompt.md:**
- **Location:** Step 6.1 (Automatic Playwright Test Creation)
- **Trigger:** When delegating to test-generation.prompt.md

**Purpose:** Ensure all tests are documented in centralized registry for discoverability and maintenance

---

## Protocol Algorithm

```
FUNCTION TestRegistryAutoUpdate(key, testFiles, testType, phase):
  
  # 1. Determine registry file path
  registryPath = ".github/key-data-streams/{key}/tests/test-registry.md"
  
  # 2. Check if registry exists
  IF NOT FileExists(registryPath) THEN
    # Create registry from template
    CreateTestRegistry(key, registryPath)
    LogInfo("Created test registry: {registryPath}")
  END IF
  
  # 3. Load existing registry
  TRY:
    registryContent = ReadFile(registryPath)
    existingTests = ParseTestRegistry(registryContent)
  CATCH error:
    RETURN {
      status: "FAILED",
      reason: "Registry parse failed: {error.message}",
      file: registryPath,
      action: "HALT_COMMIT"
    }
  END TRY
  
  # 4. Check for duplicates
  FOR EACH testFile IN testFiles:
    IF TestExistsInRegistry(existingTests, testFile.name) THEN
      LogWarning("Test already in registry: {testFile.name} - updating entry")
    END IF
  END FOR
  
  # 5. Generate registry entries for new tests
  newEntries = []
  FOR EACH testFile IN testFiles:
    entry = GenerateTestRegistryEntry(testFile, testType, phase)
    newEntries.Add(entry)
  END FOR
  
  # 6. Append entries to registry
  TRY:
    UpdateTestRegistry(registryPath, newEntries)
    LogSuccess("Registry updated: {newEntries.Length} test(s) added")
    
  CATCH error:
    RETURN {
      status: "FAILED",
      reason: "Registry update failed: {error.message}",
      file: registryPath,
      action: "HALT_COMMIT"
    }
  END TRY
  
  # 7. Verify registry updated
  updatedContent = ReadFile(registryPath)
  IF NOT ContainsAllTests(updatedContent, testFiles) THEN
    RETURN {
      status: "FAILED",
      reason: "Registry verification failed - not all tests documented",
      action: "HALT_COMMIT"
    }
  END IF
  
  # 8. Success - registry updated
  RETURN {
    status: "SUCCESS",
    file: registryPath,
    entriesAdded: newEntries.Length,
    action: "PROCEED_TO_COMMIT"
  }
  
END FUNCTION
```

---

## Test Registry Template (Initial Creation)

**When:** Registry doesn't exist for key

**Template:**
```markdown
# Test Registry: {key}

**Key:** {key}  
**Created:** {timestamp}  
**Purpose:** Central registry of all tests for this key

---

## Test Inventory

### Legend
- **Status:**
  - ✅ Executable - Test can be run successfully
  - ⚠️ Non-executable - Test has known issues (reason documented)
  - 🚧 In Progress - Test under development
  - 🗑️ Deprecated - Test marked for removal

- **Type:**
  - `e2e` - End-to-end browser interaction test
  - `integration` - API/service integration test
  - `unit` - Unit test (component/function level)
  - `visual` - Visual regression test (Percy)
  - `functional` - Functional behavior test

---

## Tests

<!-- Registry entries added below -->
```

---

## Test Registry Entry Template

**When:** Adding new test to registry

**Template:**
```markdown
### {TestFileName}

**File:** `.github/key-data-streams/{key}/tests/{TestFileName}`  
**Phase:** {phase} ({phase-title})  
**Type:** {testType} (`e2e` | `integration` | `unit` | `visual` | `functional`)  
**Test Count:** {testCaseCount} test cases  
**Status:** ✅ Executable | ⚠️ Non-executable ({reason}) | 🚧 In Progress  
**Created:** {timestamp}

**Coverage:**
{coverage-list}

**Run Command:**
```bash
{orchestration-script-command}
```

**Dependencies:**
- App running on port {port}
- Session tokens: {tokens-if-applicable}
- Test data: {test-data-source}

**Notes:**
{additional-notes-if-any}

---
```

---

## Entry Generation Examples

### Example 1: E2E Functional Test

```markdown
### hcp-asset-sharing.spec.ts

**File:** `.github/key-data-streams/hcp-cleanup/tests/hcp-asset-sharing.spec.ts`  
**Phase:** 3 (Host Control Panel Simplification)  
**Type:** `e2e` (End-to-end functional test)  
**Test Count:** 5 test cases  
**Status:** ✅ Executable  
**Created:** 2025-10-29T10:30:00Z

**Coverage:**
- Asset sharing button click
- SignalR broadcast to participants
- Asset content displayed in SessionCanvas
- Page refresh persistence validation
- Multi-browser participant isolation

**Run Command:**
```bash
.\Scripts\run-hcp-asset-sharing-test.ps1
```

**Dependencies:**
- App running on https://localhost:9091
- Session 212 tokens: KJAHA99L (user) / PQ9N5YWW (host)
- Test data: `.github/instructions/Links/PlaywrightQuickRef.md`

**Notes:**
- Uses orchestration script (direct dotnet.exe launch)
- Health check polling before test execution
- Guaranteed cleanup via try/finally

---
```

### Example 2: Visual Regression Test

```markdown
### transcript-canvas-visual.spec.ts

**File:** `.github/key-data-streams/transcript-canvas/tests/transcript-canvas-visual.spec.ts`  
**Phase:** 2 (UI Component Implementation)  
**Type:** `visual` (Visual regression test with Percy)  
**Test Count:** 3 visual snapshots  
**Status:** ✅ Executable  
**Created:** 2025-10-29T11:00:00Z

**Coverage:**
- Transcript canvas initial render
- Asset selection state visual
- Multi-asset grid layout

**Run Command:**
```bash
.\Scripts\run-transcript-canvas-visual-tests.ps1
```

**Dependencies:**
- App running on https://localhost:9091
- Percy API token: $env:PERCY_TOKEN
- Session 212 tokens: KJAHA99L (user) / PQ9N5YWW (host)

**Notes:**
- Percy snapshots uploaded to percy.io
- Baseline images stored in Percy cloud
- Visual diffs reviewed via Percy dashboard

---
```

### Example 3: Integration Test (API)

```markdown
### TranscriptApiTests.cs

**File:** `Tests/Integration/TranscriptApiTests.cs`  
**Phase:** 1 (API Layer Consolidation)  
**Type:** `integration` (API endpoint integration test)  
**Test Count:** 11 test cases  
**Status:** ✅ Executable  
**Created:** 2025-10-29T09:00:00Z

**Coverage:**
- GET /api/transcript/{sessionId}
- POST /api/transcript/process
- PUT /api/transcript/{sessionId}/assets
- DELETE /api/transcript/{sessionId}/assets/{assetId}
- 404 handling for invalid session IDs
- 400 handling for malformed requests

**Run Command:**
```bash
dotnet test Tests/Integration/TranscriptApiTests.cs --filter "FullyQualifiedName~Transcript"
```

**Dependencies:**
- KSESSIONS_DEV database (localhost)
- Test session data seeded via [dbo].[SeedTestData]
- No app launch required (in-memory test server)

**Notes:**
- Uses WebApplicationFactory for in-memory hosting
- Database transactions rolled back after each test
- No Percy or browser required

---
```

---

## Integration Points

### test-generation.prompt.md - Step 7

**Add AFTER test file creation:**

```markdown
### Step 7: Update Test Registry (AUTOMATIC)

**LOAD MODULE:** `.github/prompts/shared/step-7-5-test-registry-auto-update.md`

**Purpose:** Document all created tests in centralized registry

**Execute:**
```powershell
# Update test registry with new test files
$registryResult = TestRegistryAutoUpdate($key, $testFiles, $testType, $phase)

IF $registryResult.status == "FAILED" THEN
  # Registry update failed - WARN but don't block commit
  SHOW_WARNING($registryResult.reason)
  LOG_WARNING("Test registry update failed - manual update required")
  
  # Continue with commit (registry update is not blocking)
  # User can manually update registry later
ELSE IF $registryResult.status == "SUCCESS" THEN
  # Registry updated successfully
  LOG_SUCCESS("Test registry updated: {$registryResult.entriesAdded} test(s)")
  
  # Include registry in commit
  ExecuteCommand("git add {$registryResult.file}")
END IF

# Continue to Step 8 (Commit test files + registry)
```

**Output:**
- **Concise:** `"✅ Test registry updated: {count} test(s) added"`
- **Detailed:** `"✅ Test Registry Updated\n\nFile: {registry-path}\nTests Added: {count}\nStatus: {status}"`
```

---

### task.prompt.md - Step 6.1

**Add to Automatic Playwright Test Creation section:**

```markdown
#### 6.1. Automatic Playwright Test Creation (UI Tasks)

**For tasks involving UI changes, delegate to test-generation.prompt.md.**

**Delegation Protocol:**
1. Detect if task involves UI changes (components, pages, CSS, user interactions)
2. If yes, invoke `test-generation.prompt.md` with parameters:
   - `key`: Current task key (MANDATORY for directory structure)
   - `feature`: Task key or feature name
   - `scenario`: Specific test scenario from task description
   - `endpoints`: API endpoints involved (if any)
   - `tokens`: Session 212 defaults (unless task specifies otherwise)
   - `multiUser`: true if host/participant interaction
   - `testType`: "functional" | "visual" | "both" (based on change type)
3. **Receive generated test files and orchestration script**
4. **AUTOMATIC:** test-generation.prompt.md updates test registry (Step 7)
5. **Verify:** Test registry updated in commit

**Expected Outcome:**
- Test files created in `.github/key-data-streams/{key}/tests/`
- Orchestration script created in `.github/key-data-streams/{key}/scripts/`
- **Test registry updated** in `.github/key-data-streams/{key}/tests/test-registry.md`
- Single commit includes: tests + scripts + registry

**See:** 
- `test-generation.prompt.md` - Complete test generation workflow
- `.github/prompts/shared/step-7-5-test-registry-auto-update.md` - Registry update protocol
```

---

## Registry Update Rules

### MANDATORY Updates (Include in commit)

1. **Test file metadata** - File path, phase, type, status
2. **Test count** - Number of test cases in file
3. **Coverage** - Endpoints/components tested
4. **Run command** - How to execute test

### OPTIONAL Updates (Add if available)

1. **Dependencies** - App port, tokens, test data
2. **Notes** - Special considerations, known issues
3. **Status reason** - If ⚠️ Non-executable, explain why

---

## Violation Detection

**What qualifies as a violation:**

1. ❌ Test file created but NOT in registry
2. ❌ Registry entry missing run command
3. ❌ Registry entry missing coverage information
4. ❌ Test committed without registry update

**How to detect:**

```
FUNCTION DetectTestRegistryViolation(key):
  
  # Get all test files in key directory
  testFiles = GetTestFiles(".github/key-data-streams/{key}/tests/")
  
  # Load test registry
  registryPath = ".github/key-data-streams/{key}/tests/test-registry.md"
  IF NOT FileExists(registryPath) THEN
    RETURN {
      violation: true,
      type: "MISSING_REGISTRY",
      message: "Test files exist but no registry found"
    }
  END IF
  
  registryContent = ReadFile(registryPath)
  registeredTests = ParseTestRegistry(registryContent)
  
  # Find undocumented tests
  undocumentedTests = []
  FOR EACH testFile IN testFiles:
    IF NOT TestExistsInRegistry(registeredTests, testFile.name) THEN
      undocumentedTests.Add(testFile.name)
    END IF
  END FOR
  
  IF undocumentedTests.Length > 0 THEN
    RETURN {
      violation: true,
      type: "UNDOCUMENTED_TESTS",
      tests: undocumentedTests,
      message: "{undocumentedTests.Length} test(s) not in registry"
    }
  END IF
  
  RETURN { violation: false }
  
END FUNCTION
```

---

## Rollback on Violation

**If registry update fails:**

```powershell
# Warn user but don't block commit
LOG_WARNING("Test registry update failed - manual update required")
SHOW_WARNING("Tests created but registry not updated. Please update manually:")
SHOW_FILE_PATH(".github/key-data-streams/{key}/tests/test-registry.md")

# Continue with commit (registry update is not blocking)
# User can fix registry in follow-up commit
```

**If violation detected during post-commit validation:**

```powershell
# Generate missing registry entries
$undocumentedTests = DetectTestRegistryViolation($key)

IF $undocumentedTests.violation THEN
  SHOW_WARNING("Undocumented tests detected: {$undocumentedTests.tests}")
  
  # Auto-fix: Generate entries for missing tests
  $fixResult = AutoGenerateRegistryEntries($undocumentedTests.tests)
  
  IF $fixResult.status == "SUCCESS" THEN
    # Commit registry fix
    ExecuteCommand("git add {$registryPath}")
    ExecuteCommand("git commit -m 'doc({key}): auto-fix test registry (missing {count} entries)'")
    
    SHOW_MESSAGE("✅ Registry auto-fixed: {count} entries added")
  END IF
END IF
```

---

## Success Criteria

**Test Registry Auto-Update passes when:**

1. ✅ Test registry file exists
2. ✅ All created tests have registry entries
3. ✅ Each entry has: file path, type, status, run command
4. ✅ Registry committed with test files (same commit)
5. ✅ No undocumented tests remain

---

## Benefits

**Why this prevents violations:**

1. **Automatic compliance** - No manual step to forget
2. **Centralized documentation** - One place to find all tests
3. **Discoverability** - Easy to find tests for specific features
4. **Maintenance** - Clear status indicators (executable/broken/deprecated)
5. **Onboarding** - New developers see complete test inventory

**What this fixes from CopilotChats.md:**

- Line 850: TranscriptApiTests.cs created (11 tests)
- Expected: test-registry.md updated automatically with entry
- Result: Registry documents all tests, prevents "lost tests" problem

---

## See Also

- `.github/prompts/test-generation.prompt.md` - Test generation workflow
- `.github/instructions/Links/PlaywrightQuickRef.md` - Test data reference
- `.github/prompts/shared/test-orchestration-patterns.md` - Orchestration script patterns
- `.github/prompts/task.prompt.md` - Task execution workflow
