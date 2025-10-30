# Authentication Requirements Detection

**Purpose:** Automatically detect when tests require authentication (host vs participant)

**Referenced by:** test-generation.prompt.md (Step 1)

**See also:** `.github/prompts/shared/snippet-handling-policy.md` - Templates for file generation are allowed

---

## Overview

**This module MUST run before test implementation** to prevent authentication-related test failures.

Tests that access host-only features require authentication tokens. This protocol automatically detects authentication requirements based on scenario, routes, and test steps.

---

## Detection Triggers

Authentication is REQUIRED when ANY of the following conditions are met:

### Route-Based Detection

- Test navigates to `/host` route
- Test navigates to `/control` route
- Test navigates to `/admin` route
- Test uses Host Control Panel components

### Feature-Based Detection

- Test requires "Start Session" action
- Test requires "Begin Broadcast" action
- Test accesses share controls
- Test manages participants
- Test modifies session state (recording, transcript broadcasting)

### Keyword-Based Detection

Test scenario contains any of these keywords (case-insensitive):
- `host`
- `broadcast`
- `share` (in context of session control)
- `session.*start`
- `control.*panel`
- `recording`
- `transcript.*share`

---

## Detection Algorithm

**Pseudocode (for reference - actual implementation in generated test files):**

```
FUNCTION DetectAuthenticationRequired(scenario, testRoute, testSteps)

  // Check scenario for authentication keywords
  requiresAuth = scenario.match(/host|broadcast|share|session.*start|control.*panel|recording|transcript.*share/i)
  
  // Check route patterns
  routeRequiresAuth = testRoute.includes('/host') OR
                      testRoute.includes('/control') OR
                      testRoute.includes('/admin')
  
  // Check test steps for authentication actions
  stepsRequireAuth = testSteps.some(step => 
    step.includes('start session') OR
    step.includes('begin broadcast') OR
    step.includes('share transcript') OR
    step.includes('manage participants')
  )
  
  IF requiresAuth OR routeRequiresAuth OR stepsRequireAuth THEN
    RETURN "HOST_AUTH_REQUIRED"
  ELSE
    RETURN "NO_AUTH_REQUIRED"
  END IF

END FUNCTION
```

**Implementation Note:** This is a template - actual detection happens during test generation. See snippet-handling-policy.md for why templates are allowed in prompt files.

---

## Authentication Patterns

### Pattern 1: Host Control Panel Tests (Authentication REQUIRED)

**When to use:**
- Test accesses `/host` route
- Test requires host-only features
- Test performs session control actions

**Test structure template:**

Test file includes authentication in `beforeEach` block:
- Navigate to session with Session 212 ID
- Locate token input field
- Fill with TESTHOST token (mapped to PQ9N5YWW)
- Press Enter to submit
- Wait for authentication completion (2000ms)
- Verify "Start Session" button is enabled

**Session 212 Host Token:** `PQ9N5YWW`

**Template reference:** See `.github/prompts/shared/test-gen/test-templates/host-auth-template.md`

---

### Pattern 2: Participant Tests (No Authentication)

**When to use:**
- Test accesses standard participant routes
- Test involves question submission, voting
- Test does NOT require host privileges

**Test structure template:**

Test file includes token entry in `beforeEach` block (but NOT authentication verification):
- Navigate to session with Session 212 token
- Locate token input field
- Fill with TESTPART token (mapped to KJAHA99L)
- Press Enter to submit
- Wait for page load (1000ms)
- Proceed to test implementation

**Session 212 Participant Token:** `KJAHA99L` (Peter Parker)

**Template reference:** See `.github/prompts/shared/test-gen/test-templates/participant-auth-template.md`

---

## Orchestration Script Integration

When authentication is detected, the generated orchestration script should document requirements:

**PowerShell comment pattern:**

```powershell
# =======================================================================
# Authentication Requirements
# =======================================================================
# Host token required for this test suite
# Session 212 host token: PQ9N5YWW
# Test uses 'TESTHOST' as token input (mapped to actual token in test)
# Authentication automated in test beforeEach block
# =======================================================================

Write-Host "   📝 Authentication: Host token required" -ForegroundColor Yellow
Write-Host "   Token input automated in test beforeEach block" -ForegroundColor Gray
```

**See:** `.github/prompts/shared/test-gen/orchestration-templates/` for complete orchestration templates

---

## Session 212 Test Data

**Default test session** for all Playwright tests:

- **Session ID:** 212
- **Database:** KSESSIONS_DEV (development) / KSESSIONS (production)
- **Host Token:** `PQ9N5YWW`
- **Participant Token:** `KJAHA99L` (Peter Parker, UserGuid: b59e3dca-9330-40f5-9de8-9a5350fd2d6a)
- **Transcript:** Available (contains test questions for broadcast testing)

**Canonical Reference:** `.github/instructions/Links/PlaywrightTestPaths.MD`

---

## Error Prevention

**Common authentication-related test failures this protocol prevents:**

1. **Host tests without authentication** - Test tries to access `/host` route but doesn't provide token
2. **Wrong token type** - Participant token used for host-only features
3. **Missing token input** - Test assumes authenticated state without performing authentication
4. **Timeout waiting for auth** - Authentication verification not included in test

**By detecting authentication requirements upfront, generated tests include correct authentication patterns automatically.**

---

## Integration Points

**Called by:**
- test-generation.prompt.md (Step 1)

**Calls:**
- test-templates/host-auth-template.md (if host auth required)
- test-templates/participant-auth-template.md (if participant test)

**Prerequisites:**
- Scenario description available
- Test route known (inferred from scenario or explicitly provided)
- Test steps outlined (from plan or scenario)

**Postconditions:**
- Authentication requirement determined (HOST_AUTH_REQUIRED | NO_AUTH_REQUIRED)
- Correct token selected (PQ9N5YWW for host, KJAHA99L for participant)
- Test template selected based on authentication needs
- Orchestration script documentation prepared

---

## Examples

### Example 1: Host Authentication Detected

**Input:**
- Scenario: "Broadcast random Islamic question from Host Control Panel"
- Route: `/host/control-panel/{token}`
- Steps: ["Navigate to HCP", "Click broadcast button", "Verify question broadcast"]

**Detection Result:** `HOST_AUTH_REQUIRED`
**Reason:** Route contains `/host`, scenario includes "Host Control Panel", steps include "broadcast"
**Action:** Use host-auth-template.md, include PQ9N5YWW token, verify "Start Session" button

---

### Example 2: No Authentication Required

**Input:**
- Scenario: "Submit question from participant canvas"
- Route: `/session/canvas/{token}`
- Steps: ["Fill question textarea", "Press Enter to submit", "Verify question appears"]

**Detection Result:** `NO_AUTH_REQUIRED`
**Reason:** Route is standard participant route, no host keywords, no host features
**Action:** Use participant-auth-template.md, include KJAHA99L token, skip auth verification

---

### Example 3: Ambiguous Case (Defaults to Participant)

**Input:**
- Scenario: "View questions on canvas"
- Route: `/session/canvas/KJAHA99L`
- Steps: ["Navigate to canvas", "Wait for questions to load", "Verify question cards visible"]

**Detection Result:** `NO_AUTH_REQUIRED`
**Reason:** No host keywords, standard participant route, read-only feature
**Action:** Use participant-auth-template.md (safest default for viewing)

---

## Reference Documentation

**For complete authentication handling:**
- PlaywrightTestOrchestration.md - Authentication Handling section
- PlaywrightTestPaths.MD - Session 212 tokens and API patterns
- Example: Tests/UI/hcp-fab-button-verification.spec.ts (shows authentication gap documented)

**For test templates with authentication:**
- `.github/prompts/shared/test-gen/test-templates/host-auth-template.md`
- `.github/prompts/shared/test-gen/test-templates/participant-auth-template.md`
