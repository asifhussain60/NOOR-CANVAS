# Test Plan: Canvas E2E Validation

This document outlines the test coverage for the `canvas` work item, focusing on the end-to-end validation of the `SessionCanvas.razor` component.

## Test Objective
The primary goal is to ensure that the newly implemented `SessionCanvas` view correctly reflects the state of the session in real-time. This includes verifying participant lists, receiving shared content from the host, and ensuring the Q&A functionality is operational.

## Test Specification File
- `Tests/UI/canvas-e2e.spec.ts`

## Test Environment
- **Application**: NoorCanvas Blazor Server App
- **Framework**: Playwright
- **Browser**: Chromium (headless)
- **Authentication**: Token-based (Host and User tokens)

## Test Setup
The test suite uses a `beforeAll` hook to set up the environment for all tests:
1.  **Session Provisioning**: A new session is created using the `Provisioner` utility. This generates a unique `hostToken` and `userToken`.
2.  **Browser Contexts**: Two separate browser contexts are created to simulate a host and a participant.
3.  **Navigation**:
    - The host navigates to the `HostControlPanel` using the `hostToken`.
    - The participant navigates to the `SessionCanvas` using the `userToken`.

## Test Cases

### 1. Participant List Verification
- **Test**: `R5-Participants: should display joined participants in the tab`
- **Description**: Verifies that when a participant joins a session, their name appears correctly in the "Participants" tab on the `SessionCanvas`.
- **Steps**:
    1. After the participant page loads, locate the "Participants" tab.
    2. Assert that the participant count in the tab label is correct (e.g., "Participants (1)").
    3. Click the tab to ensure it's active.
    4. Assert that the participant's display name is visible in the list.

### 2. Real-time Content Sharing
- **Test**: `AC1-ContentSharing: should receive and display shared content from host`
- **Description**: Verifies that content shared by the host from the `HostControlPanel` is displayed in real-time on the participant's `SessionCanvas`. This is a key acceptance criterion.
- **Steps**:
    1. In the host's browser, enter text into the content sharing input field.
    2. Click the "Share Content" button.
    3. In the participant's browser, wait for the shared content to appear within the main canvas area.
    4. Assert that the displayed content matches the content shared by the host.

### 3. Q&A Functionality
- **Test**: `R5-QATab: should allow participant to ask a question`
- **Description**: Verifies that a participant can switch to the "Q&A" tab, submit a question, and see it appear in the list.
- **Steps**:
    1. In the participant's browser, click the "Q&A" tab.
    2. Fill in the text area with a new question.
    3. Click the "Submit" button.
    4. Assert that the new question text is visible in the Q&A list.

## Execution
The test is designed to be run headlessly via the `npx playwright test` command. It will provide a detailed report of the outcomes.

---

## 🔄 Worklog Update - 2025-09-25T12:28:00Z

### Phase 1 Complete: Modern UI Implementation ✅

**User Request**: Modernize simulation harness view using best practices  
**Action Taken**: Applied comprehensive UI/UX modernization to `simulation-harness.html`

#### What Was Implemented:
1. **CSS Custom Properties System** - Consistent theming with NoorCanvas brand colors
2. **Modern Visual Design** - Gradient backgrounds, shimmer effects, enhanced shadows
3. **Responsive Design** - Mobile-first approach with breakpoints for all device sizes
4. **Accessibility Features** - WCAG compliance with focus states and reduced motion support
5. **Enhanced Debug Console** - Modern terminal styling with performance monitoring
6. **Interactive Improvements** - Smooth hover effects and micro-interactions

#### Technical Improvements:
- Added CSS custom properties for maintainable theming
- Implemented modern font stacks (Inter, JetBrains Mono)
- Enhanced connection status with ripple animations
- Added performance monitoring with PerformanceObserver API
- Improved JavaScript with async/await patterns
- Added memory management for debug logs

#### Files Modified:
- `Tests/Playwright/canvas/simulation-harness.html` - Complete modernization

#### Evidence:
- Modern design consistent with NoorCanvas golden theme
- Responsive design tested across breakpoints
- Accessibility features implemented (focus states, reduced motion)
- Performance optimizations added
- Enhanced debugging capabilities with better UX

**Result**: Modern, accessible, and performant simulation harness ready for integration testing with live NoorCanvas application.
