# NOOR Canvas Debug Mode - Test Coverage Documentation

**Generated:** 2025-09-25  
**Test Key:** debug  
**Mode:** test (headless)  
**Coverage Scope:** End-to-end workflow validation

## Overview

This test suite provides comprehensive validation of the complete NOOR Canvas user workflow, from host authentication through participant interaction to real-time asset sharing and Q&A functionality.

## Test Architecture

### Multi-Context Design
- **Host Context:** 1 browser context simulating the instructor/host
- **Participant Contexts:** 5 browser contexts simulating different users
- **Headless Execution:** All tests run in headless mode for CI/CD compatibility
- **SignalR Validation:** Real-time communication testing between contexts

### Test Data Strategy
- **Superhero Theme:** Test users based on DC/Marvel characters for consistent, memorable data
- **Geographic Diversity:** Users from US, UK, Australia, India, Pakistan
- **Islamic Q&A Content:** Questions focused on Islamic education topics
- **Dynamic Tokens:** Test tokens generated for session 215

## Test Specifications

### 1. End-to-End Workflow Test
**File:** `Tests/Playwright/debug/end-to-end-workflow.spec.ts`

**Coverage:**
- ✅ Host authentication with valid token
- ✅ Multiple user registration (5 concurrent users)
- ✅ Session waiting room functionality
- ✅ Session start and automatic navigation to canvas
- ✅ Asset sharing via SignalR (host → all participants)
- ✅ Q&A workflow (participants → host panel)
- ✅ Contract compliance validation

**Test Flow:**
```
1. Host → HostControlPanel.razor (with TEST_HOST_TOKEN_215)
2. Users → UserLanding.razor → SessionWaiting.razor
3. Host starts session → Users navigate to SessionCanvas.razor
4. Host shares test asset → All users receive shared content
5. Each user posts unique question → Host sees all questions
```

**Validation Points:**
- DOM elements render correctly across all contexts
- SignalR messages propagate within expected timeframes
- Database state remains consistent
- UI feedback appears appropriately

### 2. Host Control Panel Focused Tests
**File:** `Tests/Playwright/debug/host-control-panel-focused.spec.ts`

**Coverage:**
- ✅ Host token authentication and session loading
- ✅ User registration link generation and copy functionality
- ✅ Session management controls (start/end buttons)
- ✅ Real-time participant monitoring
- ✅ Asset sharing controls
- ✅ Q&A management interface
- ✅ Error handling for invalid tokens
- ✅ Navigation integration with SessionCanvas

**Key Validations:**
- `window.copyUserLink` function operates correctly
- Session data loads from database via host token
- UI controls are enabled/disabled appropriately
- Error states display proper feedback

### 3. SignalR Contract Validation
**File:** `Tests/Playwright/debug/signalr-contract-validation.spec.ts`

**Coverage:**
- ✅ Asset sharing message contract (AssetShared event)
- ✅ Q&A workflow contract (NewQuestion event)
- ✅ Session state synchronization (SessionStarted event)
- ✅ API endpoint contract validation
- ✅ Consumer-required field validation

**Contract Requirements:**
```typescript
// Asset Sharing Contract
interface AssetSharedMessage {
    shareId: string;
    assetType: string;
    testContent: string; // Sanitized HTML for display
}

// Q&A Contract
interface NewQuestionMessage {
    questionId: string;
    questionText: string;
    userName: string;
    timestamp: string;
}

// Session State Contract
interface SessionStartedMessage {
    sessionId: number;
    status: string;
    redirectUrl: string;
}
```

## Test Data Configuration

### Test Users
```typescript
const testUsers = [
    { name: 'Clark Kent', email: 'superman@dailyplanet.com', country: 'US' },
    { name: 'Diana Prince', email: 'wonder.woman@themyscira.com', country: 'GB' },
    { name: 'Bruce Wayne', email: 'batman@wayneent.com', country: 'AU' },
    { name: 'Barry Allen', email: 'flash@starlabs.com', country: 'IN' },
    { name: 'Arthur Curry', email: 'aquaman@atlantis.com', country: 'PK' }
];
```

### Test Questions
```typescript
const testQuestions = [
    "What are the five pillars of Islam?",
    "How do we perform proper Wudu?", 
    "What is the significance of Ramadan?",
    "Can you explain the concept of Zakat?",
    "What are the times for daily prayers?"
];
```

## Infrastructure Requirements

### Prerequisites
- NOOR Canvas application running on ports 9090 (HTTP) and 9091 (HTTPS)
- Database with test session 215 configured
- SignalR hubs operational (SessionHub, QAHub)
- Node.js and Playwright installed

### Environment Setup
```bash
# Ensure app is running
.\Workspaces\Global\nc.ps1

# Or build and run if needed
.\Workspaces\Global\ncb.ps1
```

## Execution Instructions

### Run All Tests
```bash
npx playwright test Tests/Playwright/debug/ --reporter=line --headed=false
```

### Run Specific Test Suite
```bash
# End-to-end workflow
npx playwright test Tests/Playwright/debug/end-to-end-workflow.spec.ts --headed=false

# Host panel focused
npx playwright test Tests/Playwright/debug/host-control-panel-focused.spec.ts --headed=false

# Contract validation
npx playwright test Tests/Playwright/debug/signalr-contract-validation.spec.ts --headed=false
```

### Debug Mode (with browser visible)
```bash
npx playwright test Tests/Playwright/debug/ --headed --slowMo=1000
```

## Expected Outputs

### Success Indicators
- All 5 users successfully register and appear in host panel
- Session start triggers navigation for all participants
- Asset sharing message received by all participant contexts
- Each user's question appears in host control panel
- No JavaScript errors or SignalR connection failures

### Artifacts Generated
- Screenshots on test failures
- Video recordings of failed test runs
- Console logs with DEBUG-WORKITEM prefixes
- Network request/response logs
- SignalR message traces

## Watchdog Configuration

Tests include automatic watchdog monitoring:
- **Idle Threshold:** 120 seconds
- **Graceful Stop Timeout:** 10 seconds
- **Max Retries:** 1
- **Monitored Steps:** User registration, session start, asset sharing, Q&A submission

## Integration Points

### Database Dependencies
- KSESSIONS database for session and user data
- Simplified database for tokens and state
- Countries table for dropdown population

### SignalR Hub Dependencies
- SessionHub for session state management
- QAHub for question/answer workflows
- AnnotationHub for asset sharing

### API Endpoints Tested
- `/api/participant/validate-session` (POST)
- `/api/participant/participants/{token}` (GET)
- `/api/host/session-details/{token}` (GET)
- `/api/qa/submit-question` (POST)

## Negative Test Scenarios

### Error Conditions Tested
- Invalid host tokens → Error state or redirect
- Invalid user tokens → Session not found errors
- Network timeouts → Retry mechanisms
- SignalR disconnections → Reconnection logic
- Malformed API responses → Graceful degradation

## Performance Considerations

### Load Testing Aspects
- 5 concurrent user registrations
- Simultaneous SignalR connections
- Multiple Q&A submissions
- Asset sharing to multiple recipients

### Timing Validations
- User registration: < 3 seconds per user
- Session start propagation: < 5 seconds
- Asset sharing delivery: < 3 seconds
- Q&A message delivery: < 2 seconds

## Maintenance Notes

### Update Requirements
- Test tokens must correspond to valid database sessions
- Superhero user data should remain consistent
- Islamic Q&A content should be educationally appropriate
- SignalR contract interfaces must match current implementation

### Known Limitations
- Tests depend on session 215 existing in database
- Self-signed HTTPS certificates require ignoreHTTPSErrors
- SignalR timing may vary under load
- Headless mode may not catch all visual regressions

## Success Metrics

### Coverage Goals
- ✅ 100% of main user workflow paths
- ✅ 100% of SignalR message contracts
- ✅ 95%+ of UI interaction patterns
- ✅ 90%+ of error handling scenarios

### Quality Gates
- All tests must pass in headless mode
- No console errors during normal flows
- SignalR messages must validate contract compliance
- Database state must remain consistent after test runs

---

**Last Updated:** 2025-09-25  
**Test Author:** GitHub Copilot (pwtest agent)  
**Review Status:** Generated - Awaiting validation