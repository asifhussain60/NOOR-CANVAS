# 📊 NC ISSUE TRACKER

**Purpose:** Central issue tracking and management system for NOOR CANVAS Islamic Content Sharing Platform

---

## 📁 **TRACKER ARCHITECTURE**

### **Status Folders**
```
IssueTracker/
├── NOT STARTED/                        # 🔄 Issues awaiting resolution
├── IN PROGRESS/                        # ⚡ Currently being worked on
├── AWAITING_CONFIRMATION/              # ⏳ Fixed, awaiting user verification
└── COMPLETED/                          # ✅ Resolved and verified
```

### **File Management**
- **Format**: `Issue-X-brief-description.md`
- **Content**: Issue details, reproduction steps, resolution notes
- **Movement**: Files move between folders based on status
- **Display Format**: `- [Icon] **[Issue-X](FOLDER/Issue-X-brief-description.md)** — Brief description [Icon]`

### **Status Icons**
- ❌ **Not Started** - Issues awaiting implementation
- ⚡ **In Progress** - Currently being worked on
- ⏳ **Waiting for User Confirmation** - Fix implemented; awaiting explicit user verification before marking complete
- ✅ **Completed** - Resolved and verified (only set after user confirmation)

---

## 📝 **TRACKER SEPARATION**

### **This Tracker (Issues)** 🐛
- Bugs, defects, errors
- User-reported problems  
- Feature requests
- Documentation gaps

### **Implementation Tracker** 📋
**Location**: `Workspaces/IMPLEMENTATION-TRACKER.MD`
- Planned development tasks
- Phase completion tracking  
- Test case management
- Progress statistics

**Use the appropriate tracker for the right purpose!**

---

## 🔴 **HIGH PRIORITY ISSUES**

- ❌ **Issue-1** — [Production Debug Configuration Missing](NOT%20STARTED/Issue-1-production-debug-configuration.md) ❌
- ❌ **Issue-17** — [Host Dashboard to Direct Session Management UX Change](NOT%20STARTED/Issue-17-host-dashboard-to-direct-session-management-ux-change.md) ❌
- ⏳ **Issue-18** — [Blazor Routing Navigation Failure](AWAITING_CONFIRMATION/Issue-18-blazor-routing-navigation-failure.md) ⏳
- ⏳ **Issue-19** — [Ambiguous Route Conflict Between Index and Landing Pages](AWAITING_CONFIRMATION/Issue-19-ambiguous-route-conflict-index-landing.md) ⏳
## 🔴 **HIGH PRIORITY ISSUES**

- ❌ **Issue-1** — [Production/Debug Configuration Management](NOT%20STARTED/Issue-1-production-debug-configuration.md) ❌
- ⏳ **Issue-19** — [Ambiguous Route Conflict Between Index and Landing](AWAITING_CONFIRMATION/Issue-19-ambiguous-route-conflict-index-landing.md) ⏳
- ✅ **Issue-21** — [Session Save Route Conflict Recurrence](COMPLETED/Issue-21-session-save-route-conflict-recurrence.md) ✅
- ✅ **Issue-2** — [Blazor Server Double Initialization](COMPLETED/Issue-2-blazor-double-initialization.md) ✅
- ✅ **Issue-3** — [SignalR Connection String Parsing Error](COMPLETED/Issue-3-signalr-parsing-error.md) ✅
- ✅ **Issue-5** — [Button Click Events Not Responding](COMPLETED/Issue-5-button-click-events-not-responding.md) ✅
- ✅ **Issue-6** — [HttpClient Dependency Injection Missing](COMPLETED/Issue-6-httpclient-dependency-injection-missing.md) ✅
- ✅ **Issue-7** — [Testing Suite CORS/API Errors](COMPLETED/Issue-7-testing-suite-cors-api-errors.md) ✅
- ✅ **Issue-8** — [Testing Route AmbiguousMatchException](COMPLETED/Issue-8-testing-route-ambiguous-match-exception.md) ✅
- ✅ **Issue-9** — [Blazor JavaScript Interop During Static Rendering](COMPLETED/Issue-9-blazor-javascript-interop-static-rendering.md) ✅
- ✅ **Issue-10** — [Consolidate Global Commands - Remove nsrun/ncrun, Update nc](COMPLETED/Issue-10-consolidate-global-commands.md) ✅
- ✅ **Issue-11** — [Complete nsrun/ncrun Removal](COMPLETED/Issue-11-complete-nsrun-ncrun-removal.md) ✅
- ✅ **Issue-12** — [NC Test Suite Port 3000 Configuration Error](COMPLETED/Issue-12-nc-test-suite-port-3000-configuration-error.md) ✅
| **Issue-13** | nc command Ctrl+C signal handling broken | COMPLETED | 🐛 Bug |
- ✅ **Issue-2** — [Blazor Double Initialization Error](COMPLETED/Issue-2-blazor-double-initialization.md) ✅
- ✅ **Issue-3** — [SignalR Connection Parsing Error](COMPLETED/Issue-3-signalr-parsing-error.md) ✅
- ✅ **Issue-5** — [Button Click Events Not Responding](COMPLETED/Issue-5-button-click-events-not-responding.md) ✅
- ✅ **Issue-6** — [HttpClient Dependency Injection Missing](COMPLETED/Issue-6-httpclient-dependency-injection-missing.md) ✅
- ✅ **Issue-7** — [Testing Suite CORS/API Errors](COMPLETED/Issue-7-testing-suite-cors-api-errors.md) ✅
- ✅ **Issue-8** — [Testing Route AmbiguousMatchException](COMPLETED/Issue-8-testing-route-ambiguous-match-exception.md) ✅
- ✅ **Issue-9** — [Blazor JavaScript Interop During Static Rendering](COMPLETED/Issue-9-blazor-javascript-interop-static-rendering.md) ✅
- ✅ **Issue-10** — [Consolidate Global Commands - Remove nsrun/ncrun, Update nc](COMPLETED/Issue-10-consolidate-global-commands.md) ✅
- ✅ **Issue-11** — [Complete nsrun/ncrun Removal](COMPLETED/Issue-11-complete-nsrun-ncrun-removal.md) ✅
- ✅ **Issue-12** — [NC Test Suite Port 3000 Configuration Error](COMPLETED/Issue-12-nc-test-suite-port-3000-configuration-error.md) ✅
| **Issue-13** | nc command Ctrl+C signal handling broken | COMPLETED | 🐛 Bug |

---

## 🟡 **MEDIUM PRIORITY ISSUES**

- ✅ **Issue-20** — [Replace Browser Dialog Alerts with Styled Dialog Libraries](COMPLETED/Issue-20-replace-browser-dialogs-with-styled-libraries.md) ✅
- ✅ **Issue-4** — [Browser Logging API 500 Error](COMPLETED/Issue-4-browser-logging-api-error.md) ✅
- ✅ **Issue-5** — [Button Click Events Not Responding](COMPLETED/Issue-5-button-click-events-not-responding.md) ✅
- ✅ **Issue-16** — [New Session Button Click Handler Not Working](COMPLETED/Issue-16-new-session-button-click-handler-not-working.md) ✅
- ✅ **Issue-15** — [New Session API Integration Gap](COMPLETED/Issue-15-new-session-api-integration-gap.md) ✅

---

## 🟢 **LOW PRIORITY ISSUES**  

*No low priority issues currently tracked*

---

## 📊 **TRACKER STATISTICS**

- **Total Issues:** 15
- **Not Started:** 0
- **In Progress:** 0
- **Awaiting Confirmation:** 1  
- **Completed:** 14

---

## 🚀 **QUICK COMMANDS**

### **Add New Issue**
```
Add an issue: [Title] - [Description] - [High/Medium/Low] - [Bug/Feature/Enhancement/Documentation]
```
**Format:** `- ❌ **[Issue-X](NOT STARTED/Issue-X-brief-description.md)** — Brief description ❌`

### **Update Issue Status**
```
Mark issue X as [In Progress|AwaitingConfirmation|Completed|Not Started]
```
**Icons:** ❌ Not Started | ⚡ In Progress | ⏳ Awaiting Confirmation | ✅ Completed

### **Awaiting Confirmation Workflow**
- When a fix is implemented by a developer, move the issue file to `AWAITING_CONFIRMATION/` and update the tracker entry to use the ⏳ icon.
- Do NOT move issues directly to `COMPLETED/` without explicit user verification.
- The user (or an assigned verifier) must confirm the behavior in the running application. Once verified, update the tracker to move the file to `COMPLETED/` and change the icon to ✅.

### **Remove Issue**
```
Remove issue X
```

### 🧪 Mandatory Test Requirement
- When fixing an issue, developers MUST add an automated test that reproduces the issue (unit, integration, or e2e as appropriate) under `Tests/NC-ImplementationTests/unit/`.
- Move the issue file to `AWAITING_CONFIRMATION/` when the fix is implemented and tests are added. Once the verifier confirms tests pass, the issue can be moved to `COMPLETED/`.
- Use these helper scripts (scaffolded under `Tests/NC-ImplementationTests/scripts/`):
   - `Tests/NC-ImplementationTests/scripts/verify-completed-tests.ps1` — verifies every `COMPLETED` issue has at least one test file (placeholder verifier).
   - `Tests/NC-ImplementationTests/scripts/test-runner-template.ps1` — CI/test-runner template which outlines how to discover and run test projects under `Tests/NC-ImplementationTests/unit/`.

### 🔁 Developer Workflow (Quick)
1. Implement fix and add test under `Tests/NC-ImplementationTests/unit/<category>/` (name test file `Issue-<n>-x.cs` or `Issue-<n>-<short-desc>.cs`).
2. Run verification script (checks completed issues have test stubs):
   - powershell -ExecutionPolicy Bypass -File Tests\NC-ImplementationTests\scripts\verify-completed-tests.ps1
3. Run test harness / CI test-runner (use the provided template to wire into CI):
   - powershell -ExecutionPolicy Bypass -File Tests\NC-ImplementationTests\scripts\test-runner-template.ps1
4. If tests pass, move issue to `AWAITING_CONFIRMATION/` and request user verification. After confirmation, move to `COMPLETED/`.

If completed-issue tests fail during verification, open a new issue in `IssueTracker/NOT STARTED/` describing the failing test and stack trace.

---

**Last Updated:** September 11, 2025  
**Tracker Version:** 2.0 - Minimal Format with Detailed Status Files
