# KDS Test Registry System (KDTR)

**Purpose**: Centralized registry for successful test patterns, enabling pattern reuse across KDS test generation workflows.

**Location**: `.github/test-registry/`  
**Integration**: kds.prompt.md (Step -1.5), test-generation.prompt.md (Step 1.5)  
**Storage Format**: JSON files (one per test)

---

## 🎯 Overview

The **KDS Test Registry System (KDTR)** is a **data-only registry** that stores successful test execution patterns. When tests pass with evidence, their data patterns, API responses, UI states, and session information are published to JSON files for future pattern reuse.

**Core Principles:**
- ✅ **Strictly housed in `.github/test-registry/`** - No SPA service layer
- ✅ **Pure JSON data storage** - Flexible schema handles multiple data formats
- ✅ **Tied to views** - Captures UI state, API responses, session data, screenshots
- ✅ **Pattern reuse** - test-generation.prompt.md queries KDTR before creating tests
- ✅ **KDS integrated** - Enforced through kds.prompt.md rulebook (Step -1.5)
- ✅ **Successful tests only** - Only PASSED tests publish to KDTR

---

## 📂 Directory Structure

```
.github/test-registry/
├── README.md                           # This file
├── schema.json                         # Flexible JSON schema definition
├── session-212/                        # Canonical test session data
│   └── valid-tokens.json              # Session 212: Host PQ9N5YWW, User KJAHA99L
├── user-auth/                          # User authentication test patterns
│   ├── user-registration-flow.json
│   └── login-validation.json
├── canvas/                             # Canvas feature test patterns
│   ├── question-submission.json
│   └── participant-sync.json
└── transcript/                         # Transcript feature test patterns
    └── image-rendering.json
```

**Naming Convention**: `{key}/{test-name}.json`

**Example**: `.github/test-registry/user-auth/user-registration-flow.json`

---

## 📝 JSON Schema

See `schema.json` for the flexible schema definition.

**Key Properties:**
- `testName` - Unique test identifier
- `testType` - E2E, Integration, Visual, API
- `key` - KDS key this test belongs to
- `executionDate` - When test last passed
- `status` - PASSED (only successful tests stored)
- `evidence` - Screenshots, console logs, network traces
- `sessionData` - Session tokens, IDs, metadata
- `apiResponses` - Backend API patterns
- `uiState` - UI selectors, localStorage, form data
- `testPatterns` - Reusable code snippets
- `reuseGuidance` - When/how to reuse this pattern

---

## 🔗 KDS Integration

### kds.prompt.md - Step -1.5: Test Registry Enforcement

**Before generating new test:**
- Query `.github/test-registry/{key}/` for existing patterns
- If successful pattern exists: Reuse session data, API endpoints, UI selectors
- If no pattern exists: Generate new test and plan KDTR entry

**After successful test execution:**
- Capture: screenshots, console logs, network traces, API responses, UI state
- Publish to `.github/test-registry/{key}/{test-name}.json`
- Include: sessionData, apiResponses, uiState, testPatterns, reuseGuidance
- Atomic operation: Test pass + KDTR publish (both or neither)

### test-generation.prompt.md - Step 1.5: Query KDTR for Pattern Reuse

**Before generating test code:**
1. Load test registry for key: `.github/test-registry/{key}/`
2. Read all JSON files in directory
3. Filter by testType (E2E, Integration, API)
4. If patterns found: Show user, recommend reuse if <30 days old
5. Load pattern and extract: sessionData, apiResponses, uiState
6. Generate new test using existing patterns
7. Document: "Based on KDTR pattern: {testName}"

---

## 📊 Example Entry: Session 212 Valid Tokens

**File**: `.github/test-registry/session-212/valid-tokens.json`

**Based on database query** (KSESSIONS_DEV.canvas.Sessions, SessionId=212):

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

## 🧪 Usage Examples

### Example 1: Query KDTR Before Generating User Auth Test

```markdown
User Request: @workspace /test-generation "Create E2E test for user login" key:user-auth

Test Generation Agent:
1. Query: `.github/test-registry/user-auth/` → Found: login-validation.json (20 days old)
2. Load pattern: Extract sessionData, apiResponses, uiState
3. Show user: "Found existing login pattern (verified 20 days ago). Reuse or create new?"
4. If reuse: Generate test using existing Session 212 tokens, API endpoints, UI selectors
5. If create new: Generate fresh test, plan KDTR publish after execution
```

### Example 2: Publish Successful Test Pattern to KDTR

```markdown
Test Execution: user-registration-flow.spec.ts PASSED ✅

Playwright Test:
1. Test completes successfully
2. Capture evidence: screenshots, console logs, network traces
3. Extract session data: Session 212 tokens (PQ9N5YWW, KJAHA99L)
4. Extract API responses: POST /api/participant/register (201)
5. Extract UI state: Form selectors, localStorage data
6. Publish to: `.github/test-registry/user-auth/user-registration-flow.json`
7. Commit: "data(kdtr): Publish successful test pattern for user-auth/user-registration-flow"
```

### Example 3: Reuse Session 212 Tokens

```markdown
Test Generation Agent:
1. User requests: "Create E2E test for question submission"
2. Query: `.github/test-registry/session-212/valid-tokens.json`
3. Extract: hostToken=PQ9N5YWW, userToken=KJAHA99L
4. Check expiration: expiresAt=2025-11-02 (still valid)
5. Generate test using canonical Session 212 tokens
6. No need to provision new session - reuse existing valid tokens
```

---

## ✅ Benefits

1. **Pattern Reuse** - Don't reinvent test patterns; reuse proven successful patterns
2. **Session Management** - Session 212 tokens available as reference data
3. **Faster Test Creation** - Copy working patterns instead of starting from scratch
4. **Evidence-Based** - Only successful tests (PASSED) publish to KDTR
5. **KDS Integrated** - Enforced through kds.prompt.md rulebook
6. **Flexible Schema** - Handles any data format tied to views

---

## 📚 References

- `.github/key-data-streams/test-registry/test-registry.plan.md` - Implementation plan
- `.github/prompts/kds.prompt.md` - KDS governance gatekeeper (Step -1.5)
- `.github/prompts/test-generation.prompt.md` - Test generation workflow (Step 1.5)
- Session 212 Database Evidence - Valid tokens reference (SessionId=212)

---

**Status**: Active | **Version**: 1.0.0 | **Last Updated**: 2025-11-01
