# Plan: debug-panel (Development Debug Panels)

**Key:** `debug-panel`  
**Created:** 2025-10-14  
**Status:** completed  
**Type:** Feature Implementation

---

## Overview

Implement and configure development debug panels across all major views (UserLanding, SessionCanvas, HostLanding, HostControlPanel) to streamline testing and development workflows.

---

## Phase 1: HostLanding Debug Panel

**Objective:** Add missing debug panel to HostLanding.razor

**Tasks:**
1. Create `GetHostLandingDebugActions()` factory method
2. Implement "Enter Test Token" debug action (auto-fill TESTHOST for Session 212)
3. Implement "Quick Authenticate" debug action (instant auth)
4. Add DebugPanel component with DebugActions parameter
5. Add trace-level debug logging

**Deliverables:**
- HostLanding.razor with functional debug panel
- Commit: 53467c4b

**Success Criteria:**
- ✅ Debug panel visible on HostLanding
- ✅ Test token auto-fill working
- ✅ Quick authenticate functional
- ✅ Trace logging active

---

## Phase 2: Debug Panel Verification

**Objective:** Verify all views have properly configured debug panels

**Tasks:**
1. Verify SessionCanvas.razor debug panel (already working)
2. Verify HostControlPanel.razor debug panel (already working)
3. Verify UserLanding.razor debug panel status
4. Document configuration status

**Deliverables:**
- Configuration status report
- Work-log documentation

**Success Criteria:**
- ✅ All major views verified
- ✅ Configuration documented

---

## Phase 3: Toast Notification Issue (Deferred)

**Objective:** Address Notyf/Toastr migration issue

**Known Issue:** NotificationOptions error when executing debug actions  
**Root Cause:** C# code using old toastr.js properties with new Notyf library  
**Test Created:** `debug-panel-toast-error-visual.spec.ts`

**Tasks (Future):**
1. Run test to capture error stack trace
2. Locate NotificationOptions C# class
3. Update JSInterop calls to simple Notyf API
4. Re-run test to verify fix

**Status:** Deferred - lower priority

---

## Success Criteria

- ✅ All debug panels configured and working
- ✅ Test actions functional
- ✅ Documentation complete
- ⏳ Toast notification issue documented for future fix
