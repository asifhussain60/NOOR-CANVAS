# Test Integration Protocol (Step 6.1)

**Purpose:** Define when and how to invoke test-generation.prompt.md during task execution

**Referenced by:** task.prompt.md Step 6.1 (Validate - Test Integration)

**Dependencies:**
- `test-generation.prompt.md` - Complete test generation workflow
- `shared/test-gen/` - Test generation modules (validation, templates, registry, etc.)

---

## When to Invoke test-generation.prompt.md

**Trigger Conditions (any of these):**

1. **UI Changes:**
   - Blazor components modified
   - CSS styling changes
   - JavaScript/TypeScript updates
   - Layout/structure modifications

2. **API Endpoint Changes:**
   - New routes added
   - Existing endpoints modified (request/response contracts)
   - Authentication/authorization changes

3. **User Interaction Flows:**
   - New buttons, forms, modals
   - Event handlers modified
   - User workflows changed

4. **Visual Regressions:**
   - Layout changes
   - Styling updates
   - Responsive design modifications

5. **Data Mutations:**
   - CRUD operations (Create, Read, Update, Delete)
   - Database schema changes
   - SignalR event broadcasting changes

---

## Handoff Protocol

**Step 1: Prepare Test Specification Parameters**

```javascript
testSpec = {
  key: currentWorkKey,
  scenario: testScenarioDescription,
  mode: determineTestMode(),  // "functional" | "visual" | "both"
  tokens: {
    host: "PQ9N5YWW",         // Session 212 defaults
    user: "KJAHA99L"          // (unless task specifies otherwise)
  },
  multiUser: detectMultiUserScenario(),  // true if host/participant interaction
  testType: determineTestType()           // based on change type
}
```

**Step 2: Determine Test Mode**

```javascript
FUNCTION determineTestMode():
  
  IF hasVisualChanges() THEN  // CSS, layout, styling
    IF hasBusinessLogic() THEN  // API, database, SignalR
      RETURN "both"  // Functional + Visual
    ELSE
      RETURN "visual"  // Visual only (Percy)
    END IF
  ELSE IF hasBusinessLogic() THEN
    RETURN "functional"  // E2E functional test
  ELSE
    RETURN "none"  // No tests needed
  END IF
  
END FUNCTION
```

**Step 3: Determine Test Type**

```javascript
FUNCTION determineTestType():
  
  // Based on change type, select appropriate test template
  
  IF hasDataMutation() THEN
    RETURN "crud-persistence"  // Requires page refresh validation
  END IF
  
  IF hasMultiUserInteraction() THEN
    RETURN "multi-user-sync"  // Host + Participant scenarios
  END IF
  
  IF hasVisualChanges() THEN
    RETURN "visual-regression"  // Percy snapshot comparison
  END IF
  
  IF hasAPIChanges() THEN
    RETURN "api-contract"  // API endpoint validation
  END IF
  
  RETURN "functional-e2e"  // Default E2E test
  
END FUNCTION
```

**Step 4: Invoke test-generation.prompt.md**

```javascript
INVOKE: @workspace /test-gen {
  key: testSpec.key,
  scenario: testSpec.scenario,
  mode: testSpec.mode,
  tokens: testSpec.tokens,
  multiUser: testSpec.multiUser,
  testType: testSpec.testType
}
```

**Step 5: Receive Generated Artifacts**

- **Test files:** `.github/key-data-streams/{key}/tests/{feature}-{test-type}.spec.ts`
- **Orchestration script:** `.github/key-data-streams/{key}/scripts/run-{feature}-test.ps1`
- **Test registry entry:** `.github/key-data-streams/{key}/tests/test-registry.md`

**Step 6: Document in Key Data Stream**

Append to `.github/key-data-streams/{key}/work-log.md`:

```markdown
#### Testing Results

**Tests Generated:**
- Test File: `.github/key-data-streams/{key}/tests/{feature}-{test-type}.spec.ts`
- Orchestration Script: `.github/key-data-streams/{key}/scripts/run-{feature}-test.ps1`
- Test Mode: {functional|visual|both}
- Test Type: {crud-persistence|multi-user-sync|visual-regression|api-contract|functional-e2e}

**Test Execution:**
- Orchestration: PowerShell script launches app + runs test + cleanup
- Results: {X} tests passed, {Y} tests failed
- Percy Snapshots: {count} snapshots captured (if visual test)

**Test Registry:**
- Registered in test-registry.md
- Duplicate Check: {PASS|FAIL}
- Global Search: {PASS|FAIL}
```

---

## Key Requirements

### Test Location
`.github/key-data-streams/{key}/tests/` (within key data stream)

### Test Registry
`.github/key-data-streams/{key}/tests/test-registry.md` (prevents duplication)

### Orchestration Scripts
`.github/key-data-streams/{key}/scripts/` (PowerShell templates)

### Naming Convention
`{feature}-{test-type}.spec.ts`

Examples:
- `delete-confirmation-functional.spec.ts`
- `session-title-visual.spec.ts`
- `participant-registration-multi-user.spec.ts`

### Test Data
**Session 212 (canonical test session):**
- **Host Token:** PQ9N5YWW
- **User Token:** KJAHA99L
- **URL:** `http://localhost:5000/session?token={token}`

### Execution Rules
- **Via orchestration scripts ONLY** (never direct `npx playwright test`)
- **External PowerShell window** (not VS Code terminal)
- **Process cleanup required** (kill NoorCanvas before launch)

### Cleanup Rules
- Tests deleted from key directory after production promotion (Step 9.2)
- Orchestration scripts moved to `Scripts/` directory
- Test registry archived (historical reference)

---

## Skip Conditions

**DO NOT create tests if:**

1. **Backend-only changes:**
   - Database schema changes with no UI impact
   - Service layer refactoring (no API contract changes)
   - Internal logic changes (no observable behavior changes)

2. **Documentation/configuration only:**
   - README updates
   - appsettings.json configuration
   - Comments/documentation changes

3. **User explicitly requests `--no-tests` flag**

---

## Test Type Decision Matrix

| Change Type | Visual Changes | Business Logic | Test Mode | Test Type |
|-------------|----------------|----------------|-----------|-----------|
| UI styling only | ✅ | ❌ | visual | visual-regression |
| API endpoint only | ❌ | ✅ | functional | api-contract |
| CRUD operation | ✅ | ✅ | both | crud-persistence |
| Multi-user feature | ✅ | ✅ | both | multi-user-sync |
| Layout change | ✅ | ❌ | visual | visual-regression |
| Form submission | ✅ | ✅ | both | functional-e2e |

---

## Orchestration Script Requirements

**MANDATORY:** Every test MUST have an orchestration script

**Template Location:** `shared/test-gen/test-templates/orchestration-script-template.md`

**Script Responsibilities:**

1. **Kill existing NoorCanvas processes**
   ```powershell
   Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

2. **Launch app in external PowerShell window**
   ```powershell
   Start-Process pwsh -ArgumentList "-Command", "cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'; dotnet run"
   ```

3. **Wait for app startup** (15 seconds default)

4. **Execute Playwright test**
   ```powershell
   npx playwright test {test-file} --headed
   ```

5. **Cleanup** (kill app process)
   ```powershell
   Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

---

## Test Registry Integration

**Before creating tests:**

1. **Load test registry:**
   ```markdown
   .github/key-data-streams/{key}/tests/test-registry.md
   ```

2. **Check for duplicates:**
   - Search registry for similar test scenarios
   - Search registry for same feature name
   - Perform global search across all key directories (prevent cross-key duplication)

3. **If duplicate found:**
   - HALT test creation
   - Reference existing test instead
   - Update existing test if needed

4. **Register new test:**
   ```markdown
   ## Active Tests
   
   ### {feature}-{test-type}.spec.ts
   - **Created**: {ISO-8601 timestamp}
   - **Scenario**: {test-scenario-description}
   - **Mode**: {functional|visual|both}
   - **Test Type**: {test-type}
   - **Orchestration**: {script-name}.ps1
   - **Status**: Active
   - **Last Run**: {timestamp}
   - **Results**: {X} passed, {Y} failed
   ```

---

## Output to User (Controlled by Verbosity)

**Concise:**
```
[TESTS] Generated test: {feature}-{test-type}.spec.ts
- Mode: {functional|visual|both}
- Orchestration: {script-name}.ps1
- Registry: Updated
```

**Detailed:**
```
[TESTS] Test Generation Complete

**Test File:**
.github/key-data-streams/{key}/tests/{feature}-{test-type}.spec.ts

**Test Specification:**
- Scenario: {test-scenario-description}
- Mode: {functional|visual|both}
- Test Type: {test-type}
- Multi-User: {true|false}
- Test Data: Session 212 (Host: PQ9N5YWW, User: KJAHA99L)

**Orchestration Script:**
.github/key-data-streams/{key}/scripts/{script-name}.ps1

- Responsibilities: Kill processes, launch app, run test, cleanup
- Execution: External PowerShell window
- Startup Wait: 15 seconds

**Test Registry:**
- Registered in test-registry.md
- Duplicate Check: PASS (no duplicates found)
- Global Search: PASS (checked all key directories)

**Execution:**
To run this test: .\\.github\\key-data-streams\\{key}\\scripts\\{script-name}.ps1
```

---

## Integration with Step 9 (Completion)

**At Step 9.2 (Test Promotion):**

1. **Promote passing tests to production:**
   - Copy test file: `Tests/UI/{feature}-{test-type}.spec.ts`
   - Copy orchestration script: `Scripts/run-{feature}-test.ps1`
   - Update orchestration script paths (production location)

2. **Archive in test registry:**
   ```markdown
   ## Archived Tests (Promoted to Production)
   
   ### {feature}-{test-type}.spec.ts
   - **Promoted**: {ISO-8601 timestamp}
   - **Destination**: Tests/UI/{feature}-{test-type}.spec.ts
   - **Orchestration**: Scripts/run-{feature}-test.ps1
   - **Commit**: {SHA}
   - **Status**: Promoted (deleted from key directory)
   ```

3. **Delete tests from key directory:**
   - Remove test files from `.github/key-data-streams/{key}/tests/`
   - Remove orchestration scripts from `.github/key-data-streams/{key}/scripts/`
   - Preserve test registry for historical reference

---

## See Also

- **test-generation.prompt.md** - Complete test generation workflow
- **shared/test-gen/validation-protocol.md** - Test validation (Step 0-0.1)
- **shared/test-gen/authentication-detection.md** - Auth requirement detection (Step 1)
- **shared/test-gen/test-templates/** - Test templates (functional, visual, migration)
- **shared/test-gen/test-registry-protocol.md** - Registry management & duplicate prevention
- **shared/test-gen/drift-detection-protocol.md** - Drift detection during test execution
