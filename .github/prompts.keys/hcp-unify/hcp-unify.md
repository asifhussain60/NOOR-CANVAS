# hcp-unify - Host Control Panel UI Unification

**Key:** `hcp-unify`  
**Status:** In Progress  
**Created:** 2025-10-19

---

## User Request (2025-10-19T00:00:00Z)

Remove "Share Transcript" button and functionality from HostControlPanelSidebar, extend "Start Session" button to 65% width and center it.

**High-Priority Constraints:** None detected

---

## User Request (2025-10-19T00:45:00Z)

Make the bottom panel hidden until the button is clicked. Add spinners, or some sort of splash while the host control panel and session transcript is loading.

**High-Priority Constraints:** None detected

---

## Work Log

## User Request (2025-10-19T01:00:00Z)

Delete the bottom panel that has "Ask a Question" and cleanup. Update debug panel to simulate adding question on the view.

**SCOPE CLARIFICATION:** This change should ONLY affect TranscriptCanvas.razor (do NOT modify SessionCanvas.razor)

**High-Priority Constraints:** 
- DO NOT modify SessionCanvas.razor (Preservation constraint)

**Additional Context (2025-10-19T01:15:00Z):**
- Debug panel functionality already exists in TranscriptCanvas.razor (lines 3557-3600)
- Debug panel includes "Simulate Random Question" action with Islamic questions list
- Debug panel implementation is identical to SessionCanvas.razor (already complete)

---

## Implementation Plan

### Primary Objective
Remove the "Ask a Question" panel from TranscriptCanvas.razor ONLY (preserve SessionCanvas.razor untouched).

### HIGH-PRIORITY Constraints
1. **DO NOT modify SessionCanvas.razor** (Preservation constraint)
   - **Category**: Preservation
   - **Verification Method**: Check git diff to ensure SessionCanvas.razor not in modified files
   - **Status**: PENDING → VERIFIED

### Subtasks
1. Remove "Ask a Question" panel markup from TranscriptCanvas.razor (lines 1069-1092)
2. Verify debug panel functionality remains intact (already exists - no changes needed)
3. Add simple debug marker documenting panel removal
4. Verify SessionCanvas.razor remains untouched
5. Run lint validation on TranscriptCanvas.razor only

### Verification Checklist
- [ ] Build passes (zero errors, zero warnings)
- [ ] Lint validation passes (TranscriptCanvas.razor only)
- [ ] High-priority constraint verified (SessionCanvas.razor NOT modified)
- [ ] Debug panel verified functional (no changes needed)
- [ ] Debug marker added per `debug-level: simple`

---

### Work Completed (2025-10-19T00:45:00Z)
- **Status**: Complete
- **Changes**:
  - Hidden "Session Ready to Start" panel until Start Session button clicked
  - Added state variable `hasClickedStartSession` to track button interaction
  - Updated conditional rendering to require both `SessionStatus == "Waiting"` AND `hasClickedStartSession`
  - Confirmed loading spinners present in HostControlPanelSidebar (added conditional wrapper)
  - Confirmed loading spinners present in HostControlPanelContent (already implemented)
  - Added simple debug markers per `debug-level: simple` parameter
- **Files Affected**:
  - `SPA/NoorCanvas/Pages/HostControlPanel.razor` (state tracking, panel visibility)
  - `SPA/NoorCanvas/Components/Host/HostControlPanelSidebar.razor` (loading spinner wrapper)
  - `SPA/NoorCanvas/Components/Host/HostControlPanelContent.razor` (debug marker)
- **Tests**: N/A (UI enhancement only)
- **Lint Validation**: PASS (all files error-free)
- **High-Priority Constraints Verified**: N/A (no constraints detected)
- **Approval Iterations**: 0 (immediate approval)
- **Commit**: 59f4775e8241c6976519605ed6df4cd616a87979
- **Checkpoint Tag**: checkpoint/hcp-unify/2025-10-19_0045

### Work Completed (2025-10-19T00:15:00Z)
- **Status**: Complete
- **Changes**:
  - Removed "Share Transcript" button from HostControlPanelSidebar.razor
  - Removed OnShareTranscript parameter and event callback
  - Updated button layout: single centered "Start Session" button (65% width)
  - Removed ShareTranscript method (78 lines of code removed)
  - Removed parameter binding from HostControlPanel.razor
- **Files Affected**:
  - `SPA/NoorCanvas/Components/Host/HostControlPanelSidebar.razor` (UI changes)
  - `SPA/NoorCanvas/Pages/HostControlPanel.razor` (method removal)
- **Tests**: N/A (UI layout change only, no functional tests needed)
- **Lint Validation**: PASS (C#/Razor syntax validated)
- **Commit**: 3dca800592d181b66b0fddb5563d4fb642e71075
- **Checkpoint Tag**: checkpoint/hcp-unify/2025-10-19_0015
