# KDS Test Registry System (KDTR) - Implementation Plan

**Key**: test-registry  
**Created**: 2025-11-01  
**Status**: Planning  
**Objective**: Create centralized test data registry within `.github` to track successful test patterns and enable pattern reuse across KDS test generation

---

## 🎯 Purpose

The **KDS Test Registry System (KDTR)** is a **data-only registry** (no service layer) that stores successful test execution patterns within the `.github` folder structure. When tests pass with evidence, their data patterns, API responses, UI states, and session information are published to JSON files for future pattern reuse.

**Key Principles:**
- ✅ **Strictly housed in `.github/test-registry/`** - No SPA service layer
- ✅ **Pure JSON data storage** - Flexible schema handles multiple data formats
- ✅ **Tied to views** - Captures UI state, API responses, session data, screenshots
- ✅ **Pattern reuse** - test-generation.prompt.md queries KDTR before creating tests
- ✅ **KDS integrated** - Enforced through kds.prompt.md rulebook (Step -1.5)

---

## 📊 Architecture

### Directory Structure

```
.github/
└── test-registry/
    ├── README.md                           # KDTR documentation
    ├── schema.json                         # Flexible JSON schema definition
    ├── user-auth/                          # Key-specific test data
    │   ├── user-registration-flow.json     # Successful test data
    │   └── login-validation.json
    ├── canvas/
    │   ├── question-submission.json
    │   └── participant-sync.json
    ├── transcript/
    │   └── image-rendering.json
    └── session-212/                        # Canonical test session data
        └── valid-tokens.json               # Session 212: Host PQ9N5YWW, User KJAHA99L
```

**Storage Location:** `.github/test-registry/{key}/{test-name}.json`

**No Service Layer:** KDTR is pure JSON data - Copilot reads/writes directly via file operations

---

## 📝 JSON Schema Design

### Flexible Schema (Handles Multiple Data Formats)

```json
{
  "testName": "user-registration-flow",
  "testType": "E2E",
  "key": "user-auth",
  "executionDate": "2025-11-01T12:34:56Z",
  "status": "PASSED",
  "evidence": {
    "screenshots": [
      "PlayWright/artifacts/user-registration-flow/registration-form.png",
      "PlayWright/artifacts/user-registration-flow/success-redirect.png"
    ],
    "consoleLog": "PlayWright/artifacts/user-registration-flow/console.log",
    "networkLog": "PlayWright/artifacts/user-registration-flow/network.har"
  },
  "sessionData": {
    "sessionId": 212,
    "hostToken": "PQ9N5YWW",
    "userToken": "KJAHA99L",
    "createdBy": "GitHub Copilot Test",
    "createdAt": "2025-10-27T11:51:55.6875985",
    "expiresAt": "2025-11-02T17:02:54.8000000",
    "hoursUntilExpiry": 24
  },
  "apiResponses": {
    "GET /api/participant/session/{token}/me": {
      "status": 200,
      "body": {
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Test User",
        "email": "test@example.com",
        "country": "US"
      }
    },
    "POST /api/participant/register": {
      "status": 201,
      "body": {
        "success": true,
        "message": "Registration successful"
      }
    }
  },
  "uiState": {
    "registrationForm": {
      "nameInput": "#name-input",
      "emailInput": "input[placeholder='Enter your email']",
      "countrySelect": "select.user-landing-select",
      "submitButton": "button.user-landing-button"
    },
    "localStorage": {
      "key": "noor_user_registration_KJAHA99L",
      "value": {
        "Name": "Test User",
        "Email": "test@example.com",
        "Country": "US",
        "ExpiresAt": "2025-11-03T12:34:56Z"
      }
    }
  },
  "testPatterns": {
    "navigation": [
      "await page.goto('https://localhost:9091/user/landing/KJAHA99L')",
      "await page.waitForLoadState('networkidle')"
    ],
    "authentication": [
      "await page.evaluate(() => localStorage.clear())",
      "await page.fill('#name-input', 'Test User')"
    ],
    "apiValidation": [
      "const response = await page.request.get('/api/participant/session/KJAHA99L/me')",
      "expect(response.status()).toBe(200)"
    ]
  },
  "reuseGuidance": {
    "whenToReuse": "Any test involving user registration with Session 212",
    "sessionDataValid": true,
    "tokensVerified": true,
    "lastVerifiedDate": "2025-11-01T12:34:56Z"
  }
}
```

**Schema Features:**
- ✅ **Flexible structure** - Supports any data format tied to views
- ✅ **Session 212 data** - Canonical tokens from database (see pasted image)
- ✅ **API responses** - Captures backend patterns for reuse
- ✅ **UI state** - Selectors, localStorage, form data
- ✅ **Test patterns** - Reusable code snippets (Playwright)
- ✅ **Evidence links** - Screenshots, logs, network traces

---

## 🔗 KDS Integration

### Phase 1: kds.prompt.md Rulebook Enhancement

**Add Step -1.5: Test Registry Enforcement**

**Location:** `.github/prompts/kds.prompt.md` → After Step -1 (Governance Enforcement)

**Rule Addition:**

```markdown
### Step -1.5: Test Registry System (KDTR) Enforcement

**MANDATORY for test-generation.prompt.md and test execution workflows:**

1. **Before generating new test:**
   - Query `.github/test-registry/{key}/` for existing test patterns
   - If successful pattern exists: Reuse session data, API endpoints, UI selectors
   - If no pattern exists: Generate new test and plan KDTR entry

2. **After successful test execution:**
   - Capture: screenshots, console logs, network traces, API responses, UI state
   - Publish to `.github/test-registry/{key}/{test-name}.json`
   - Include: sessionData, apiResponses, uiState, testPatterns, reuseGuidance
   - Atomic operation: Test pass + KDTR publish (both or neither)

3. **Pattern reuse criteria:**
   - Session data valid (tokens not expired)
   - API endpoints still active
   - UI selectors still valid
   - Last verified <30 days

4. **KDTR file structure:**
   - Strictly in `.github/test-registry/{key}/`
   - JSON format only
   - One file per test
   - Include flexible schema (handles multiple data formats)
```

**Enforcement Algorithm:**

```
FUNCTION EnforceKDTR(key, testName, testType):
  
  # Before test generation
  IF testType IN ['E2E', 'Integration', 'API']:
    kdtrPath = `.github/test-registry/${key}/`
    existingPatterns = ScanDirectory(kdtrPath)
    
    IF existingPatterns.count > 0:
      SHOW patterns to user
      PROMPT "Reuse existing pattern or create new test?"
      IF user selects reuse:
        LOAD pattern data (sessionData, apiResponses, uiState)
        GENERATE test using loaded patterns
        RETURN
      END IF
    END IF
  END IF
  
  # After test execution (if passed)
  IF testStatus == "PASSED":
    kdtrEntry = {
      testName: testName,
      testType: testType,
      key: key,
      executionDate: NOW(),
      status: "PASSED",
      evidence: CaptureEvidence(),
      sessionData: ExtractSessionData(),
      apiResponses: ExtractAPIResponses(),
      uiState: ExtractUIState(),
      testPatterns: ExtractCodePatterns(),
      reuseGuidance: GenerateReuseGuidance()
    }
    
    WriteJSON(`.github/test-registry/${key}/${testName}.json`, kdtrEntry)
    COMMIT with message: "data(kdtr): Publish successful test pattern for ${key}/${testName}"
  END IF
  
END FUNCTION
```

---

### Phase 2: test-generation.prompt.md Integration

**Update:** `.github/prompts/test-generation.prompt.md`

**Add Step 1.5: Query KDTR for Existing Patterns**

**Before generating test code:**

```markdown
## Step 1.5: Query Test Registry for Pattern Reuse

**Load test registry for key:**
- Check `.github/test-registry/{key}/` for existing test data
- Read all JSON files in directory
- Filter by testType (E2E, Integration, API)

**If patterns found:**
- Show user list of available patterns
- Highlight: sessionData validity, lastVerified date, test type
- Recommend: Reuse if <30 days old and session data valid

**Pattern reuse workflow:**
1. Load JSON file (e.g., `user-registration-flow.json`)
2. Extract: sessionData (tokens), apiResponses (endpoints), uiState (selectors)
3. Generate new test using existing patterns:
   - Copy navigation patterns
   - Reuse Session 212 tokens (if valid)
   - Reuse API endpoint patterns
   - Reuse UI selector patterns
4. Adapt: Only change what's specific to new test scenario
5. Document: "Based on KDTR pattern: {testName}"

**If no patterns found:**
- Generate test from scratch
- Plan KDTR entry for successful execution
- Include in test orchestration: KDTR publish step
```

---

### Phase 3: Sample Registry Entries (Session 212)

**Create:** `.github/test-registry/session-212/valid-tokens.json`

**Based on pasted image data:**

```json
{
  "testName": "session-212-canonical-data",
  "testType": "Reference",
  "key": "session-212",
  "executionDate": "2025-11-01T00:00:00Z",
  "status": "VERIFIED",
  "evidence": {
    "source": "Database query result - KSESSIONS_DEV.canvas.Sessions table",
    "screenshot": "Session212-Database-Evidence.png"
  },
  "sessionData": {
    "sessionId": 212,
    "hostToken": "PQ9N5YWW",
    "userToken": "KJAHA99L",
    "status": "Created",
    "scheduledDate": null,
    "scheduledDuration": null,
    "createdAt": "2025-10-27T11:51:55.6875985",
    "expiresAt": "2025-11-02T17:02:54.8000000",
    "hoursUntilExpiry": 24
  },
  "apiEndpoints": {
    "hostValidation": "/api/host/token/PQ9N5YWW/validate",
    "userValidation": "/api/participant/session/KJAHA99L/me",
    "sessionCanvas": "/session/canvas/KJAHA99L",
    "hostControlPanel": "/host/control-panel/PQ9N5YWW"
  },
  "reuseGuidance": {
    "whenToReuse": "Default test session for all E2E tests requiring host/user tokens",
    "sessionDataValid": true,
    "tokensVerified": true,
    "lastVerifiedDate": "2025-11-01T00:00:00Z",
    "expirationNote": "Session expires 2025-11-02. Renew if needed via Host Provisioner."
  }
}
```

---

## 🧪 Implementation Phases

### Phase 1: KDTR Structure Setup

**Tasks:**
1. Create directory: `.github/test-registry/`
2. Create subdirectories: `session-212/`, `user-auth/`, `canvas/`, `transcript/`
3. Create `README.md` with KDTR documentation
4. Create `schema.json` with flexible schema definition
5. Create sample entry: `session-212/valid-tokens.json`

**Deliverables:**
- ✅ `.github/test-registry/` directory structure
- ✅ README.md documenting purpose and usage
- ✅ schema.json with flexible data format
- ✅ session-212/valid-tokens.json with canonical Session 212 data

**Debug Marker:** `[DEBUG-WORKITEM:test-registry:structure]`

---

### Phase 2: kds.prompt.md Integration

**Tasks:**
1. Add Step -1.5 (Test Registry Enforcement) to kds.prompt.md
2. Create validation algorithm: `EnforceKDTR()`
3. Update kds-rulebook.json with new rule
4. Test: Verify rule appears in KDS review mode

**Deliverables:**
- ✅ kds.prompt.md updated with Step -1.5
- ✅ kds-validation-algorithms.md includes `EnforceKDTR()` function
- ✅ kds-rulebook.json Rule #20 added (Test Registry Publishing)

**Debug Marker:** `[DEBUG-WORKITEM:test-registry:kds-integration]`

---

### Phase 3: test-generation.prompt.md Enhancement

**Tasks:**
1. Add Step 1.5 (Query KDTR for Pattern Reuse)
2. Create helper function: `QueryTestRegistry(key)`
3. Create helper function: `ReuseTestPattern(patternFile)`
4. Test: Generate test with pattern reuse

**Deliverables:**
- ✅ test-generation.prompt.md updated with Step 1.5
- ✅ Pattern query algorithm implemented
- ✅ Reuse workflow documented with examples

**Debug Marker:** `[DEBUG-WORKITEM:test-registry:test-gen-integration]`

---

### Phase 4: Validation & Documentation

**Tasks:**
1. Create E2E test: Validate KDTR publish workflow
2. Create E2E test: Validate pattern reuse workflow
3. Document KDTR in SystemIndex.md
4. Update MANDATORY.md if needed (new critical rule)

**Deliverables:**
- ✅ E2E test: `kdtr-publish-workflow.spec.ts`
- ✅ E2E test: `kdtr-pattern-reuse.spec.ts`
- ✅ SystemIndex.md includes KDTR reference
- ✅ Documentation complete

**Debug Marker:** `[DEBUG-WORKITEM:test-registry:validation]`

---

## ✅ Success Criteria

- ✅ KDTR strictly housed in `.github/test-registry/`
- ✅ No service layer created (pure JSON data storage)
- ✅ Flexible JSON schema handles multiple data formats
- ✅ Session 212 data published as reference pattern
- ✅ kds.prompt.md enforces KDTR publishing (Step -1.5)
- ✅ test-generation.prompt.md queries KDTR before generating tests
- ✅ Pattern reuse demonstrated with successful test generation
- ✅ All data tied to views (UI state, API responses, screenshots)

---

## 🔍 Key Differences from Original Request

**What Changed:**
- ❌ Removed: SPA service layer (Models, Services, Controllers)
- ❌ Removed: API endpoints for registry management
- ❌ Removed: Playwright test for CRUD operations
- ✅ Added: Pure `.github` data storage
- ✅ Added: Flexible JSON schema for multiple data formats
- ✅ Added: KDS integration through kds.prompt.md
- ✅ Added: test-generation.prompt.md pattern reuse
- ✅ Added: Session 212 reference data from database

**Alignment with Request:**
- ✅ "Strictly housed within .github folder" → `.github/test-registry/`
- ✅ "Integrated into kds.prompt.md" → Step -1.5 enforcement
- ✅ "Register successful test patterns" → JSON publish after test pass
- ✅ "Flexible JSON structure" → Handles multiple data formats tied to views
- ✅ "Check registry before generating tests" → test-generation.prompt.md Step 1.5
- ✅ "Publish all beneficial information including views" → sessionData, apiResponses, uiState, evidence
- ✅ "Maintain separate from tests" → `.github/test-registry/` vs `PlayWright/Tests/`
- ✅ "Restrict to successful test data" → Only PASSED tests publish to KDTR

---

## 📚 References

- `.github/prompts/kds.prompt.md` - KDS governance gatekeeper
- `.github/prompts/test-generation.prompt.md` - Test generation workflow
- `.github/instructions/SelfAwareness.instructions.md` - KDS Architecture
- Session 212 Database Evidence (pasted image) - Valid tokens reference

---

**Key: test-registry** | **Status**: Planning Complete | **Next**: Begin Phase 1 implementation
