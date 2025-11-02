# hcp-ids Implementation Plan (Updated)

**Key**: hcp-ids  
**Feature**: Share Button ID System + Diagnostic Logging + Deprecation Cleanup  
**Component**: HostControlPanel.razor  
**Created**: 2025-11-01  
**Updated**: 2025-11-01  
**Status**: Ready for Implementation

---

## Executive Summary

Implement share button ID toast notification system with comprehensive diagnostic logging to trace the asset detection, button injection, and click handling workflow. Mark deprecated code for cleanup while maintaining backward compatibility during transition.

**Total Phases**: 3  
**Total Tasks**: 12  
**Estimated Duration**: 4-6 hours  
**Complexity**: Moderate (UI + Logging + Cleanup)

---

## Current State Analysis

### Asset Detection & Share Button Flow (from CopilotContext.md)

**7-Step Workflow**:
1. **Asset Detection** - Scan transcript HTML for sharable content using CSS selectors
2. **HTML Transformation** - Remove host-only elements, clean data attributes
3. **Share Button Injection** - Wrap assets in cards, inject FAB buttons with unique IDs
4. **Button Click Handler** - Capture click, extract asset ID/type from data attributes
5. **Broadcast Preparation** - Transform asset HTML for participant view
6. **SignalR Broadcast** - Send to session group via hub
7. **Participant Display** - Render on SessionCanvas with Islamic styling

### Existing Implementation (HostControlPanel.razor)

**Button Generation** (Line 3352-3364):
- Method: `GenerateShareButton(long assetId, string assetType)`
- ID Format: `share-btn-{assetType}-{assetId}`
- Example: `share-btn-ayah-card-12345`
- Logging: Basic debug log with button ID

**Handler Setup** (Line 4762+):
- Function: `setupShareButtonHandlers(dotNetObjectRef)`
- Pattern: Event delegation on document
- Current Issues:
  - No initialization flag tracking
  - Limited logging during discovery
  - No visibility into button injection success

**Click Handler** (Line 4814+):
- Function: `handleShareButtonClick(event)`
- Current Behavior:
  - Detects `.ks-share-button` class
  - Extracts data attributes
  - Calls C# `ShareAsset` method
  - No toast showing button ID
  - Limited error visibility

### Gap Analysis

**Missing Diagnostics**:
- ❌ No initialization flag to track handler setup completion
- ❌ No logging when buttons discovered during setup
- ❌ No toast feedback showing which button was clicked
- ❌ No visibility into asset transformation pipeline
- ❌ No browser console logs for user-facing clicks

**Code Cleanliness**:
- ⚠️ Some deprecated methods retained for fallback
- ⚠️ No cleanup markers for legacy code
- ⚠️ Mixed logging levels (Debug vs Information)

---

## Acceptance Criteria

### Phase 1: Diagnostic Logging Infrastructure
- [ ] Add initialization flag tracking (`shareButtonsInitialized`)
- [ ] Log button discovery count during handler setup
- [ ] Log each button ID found during initialization
- [ ] Set `window.shareButtonsInitialized = true` after setup
- [ ] Add browser console logs for all major workflow steps
- [ ] Include component name prefix: `[HCP-IDS]` in all logs

### Phase 2: Button ID Toast Notifications
- [ ] Create `showButtonIdToast(buttonId, assetType)` function
- [ ] Display toast with gradient background (purple theme)
- [ ] Show button unique ID and asset type in toast
- [ ] Auto-dismiss toast after 3 seconds
- [ ] Call toast on every share button click
- [ ] Maintain existing share functionality (non-breaking)

### Phase 3: Code Cleanup & Deprecation Marking
- [ ] Mark deprecated methods with `// DEPRECATED: {reason} ;MARK_FOR_CLEANUP`
- [ ] Add inline comments explaining deprecation timeline
- [ ] Ensure all deprecated code paths still functional
- [ ] Document cleanup phase in plan (Phase 4 - future work)
- [ ] No breaking changes during this phase

---

## Implementation Plan

### Phase 1: Diagnostic Logging Infrastructure

**Goal**: Add comprehensive logging to trace asset detection → button injection → click handling workflow

**Dependencies**: None  
**Estimated Duration**: 1.5 hours

**Acceptance Criteria**:
1. Initialization flag prevents click handling before setup complete
2. Browser console shows button discovery count
3. Each button ID logged during setup and click
4. All logs use `[HCP-IDS]` prefix for filtering
5. Logs visible in both Blazor diagnostics and browser console

**Tasks**:

1. **Task 1a: Create Passing Test** (test-generation.prompt.md handoff)
   - Purpose: Generate headless test for logging verification
   - Test File: `.github/key-data-streams/hcp-ids/tests/phase-1-diagnostic-logging.spec.ts`
   - Coverage: 
     - Verify initialization flag set after handler setup
     - Verify console logs contain button discovery count
     - Verify `[HCP-IDS]` prefix in all logs
   - Acceptance Criteria Under Test: All Phase 1 criteria
   - Success Criteria: Test passes with current implementation
   - Estimated Duration: 30 minutes
   - Handoff File: `handoffs/phase-1-test.json`

2. **Task 1b: Add C# Initialization Field** (todo.prompt.md handoff)
   - Action: Add `private bool shareButtonsInitialized = false;` field
   - Files: `SPA/NoorCanvas/Pages/HostControlPanel.razor`
   - Location: `@code` block with other private fields (around line 165)
   - Debug Marker: `[DEBUG-WORKITEM:hcp-ids:phase-1-init-field]`
   - Success Criteria: Field added, compiles without errors
   - Estimated Duration: 10 minutes
   - Handoff File: `handoffs/phase-1-todo-1.json`
   - On Completion: Auto-invoke Task 1c

3. **Task 1c: Update JavaScript Handler Setup** (todo.prompt.md handoff)
   - Action: Add diagnostic logging to `setupShareButtonHandlers` function
   - Files: `SPA/NoorCanvas/Pages/HostControlPanel.razor`
   - Location: `<script>` section, `setupShareButtonHandlers` function (line 4762+)
   - Changes:
     - Log button discovery count: `console.log('[HCP-IDS] Discovered {count} share buttons')`
     - Log each button ID in discovery loop
     - Set `window.shareButtonsInitialized = true` at end
     - Add initialization confirmation log
   - Debug Marker: `[DEBUG-WORKITEM:hcp-ids:phase-1-handler-logging]`
   - Success Criteria: Logs appear in browser console, flag set
   - Estimated Duration: 30 minutes
   - Handoff File: `handoffs/phase-1-todo-2.json`
   - On Completion: Auto-invoke Task 1d

4. **Task 1d: Add Click Handler Logging** (todo.prompt.md handoff)
   - Action: Add diagnostic logging to `handleShareButtonClick` function
   - Files: `SPA/NoorCanvas/Pages/HostControlPanel.razor`
   - Location: `<script>` section, `handleShareButtonClick` function (line 4814+)
   - Changes:
     - Check `window.shareButtonsInitialized` flag first
     - Log button ID when share button clicked
     - Log asset ID and type extraction
     - Include `[HCP-IDS]` prefix in all logs
   - Debug Marker: `[DEBUG-WORKITEM:hcp-ids:phase-1-click-logging]`
   - Success Criteria: Click events logged with button IDs
   - Estimated Duration: 30 minutes
   - Handoff File: `handoffs/phase-1-todo-3.json`
   - On Completion: Auto-invoke Task 1e

5. **Task 1e: Run & Fix Test**
   - Action: Execute phase-1-diagnostic-logging.spec.ts
   - Test Command: `npx playwright test .github/key-data-streams/hcp-ids/tests/phase-1-diagnostic-logging.spec.ts`
   - Success Criteria: All tests green, logging verified
   - Estimated Duration: 20 minutes
   - On Success: Auto-invoke Task 1f
   - On Failure: Debug and fix until passing

6. **Task 1f: Phase Validation & Checkpoint**
   - Update work-log.md with phase completion
   - Update hcp-ids.plan.json phase status to "complete"
   - Commit checkpoint: `ckpt(hcp-ids): Phase 1 complete - Diagnostic logging added`
   - **AUTO-CONTINUE**: Proceed to Phase 2

**Auto-Continue Conditions**:
- ✅ All tasks complete
- ✅ All tests passing
- ✅ Build succeeds
- ✅ Logs visible in browser console
- ❌ HALT if: Test fails, build breaks, logging not appearing

**Rollback Plan**:
- Checkpoint: `ckpt(hcp-ids): Before Phase 1`
- Rollback: `git reset --hard {checkpoint-sha}`

---

### Phase 2: Button ID Toast Notifications

**Goal**: Display toast notification showing button ID when share button clicked

**Dependencies**: Phase 1 must be complete  
**Estimated Duration**: 2 hours

**Acceptance Criteria**:
1. Toast appears on every share button click
2. Toast displays button unique ID (e.g., `share-btn-ayah-card-12345`)
3. Toast displays asset type (e.g., "Ayah Card")
4. Toast uses purple gradient background
5. Toast auto-dismisses after 3 seconds
6. Existing share functionality unaffected

**Tasks**:

1. **Task 2a: Create Passing Test** (test-generation.prompt.md handoff)
   - Purpose: Generate headless test for toast verification
   - Test File: `.github/key-data-streams/hcp-ids/tests/phase-2-toast-notification.spec.ts`
   - Coverage:
     - Click share button
     - Verify toast appears
     - Verify toast contains button ID
     - Verify toast auto-dismisses
   - Acceptance Criteria Under Test: All Phase 2 criteria
   - Success Criteria: Test passes with implementation
   - Estimated Duration: 45 minutes
   - Handoff File: `handoffs/phase-2-test.json`

2. **Task 2b: Create Toast Function** (todo.prompt.md handoff)
   - Action: Create `showButtonIdToast(buttonId, assetType)` JavaScript function
   - Files: `SPA/NoorCanvas/Pages/HostControlPanel.razor`
   - Location: New function in `<script>` section (after line 4946)
   - Features:
     - Gradient background: `linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%)`
     - Fingerprint icon: `fa-solid fa-fingerprint`
     - Button ID display
     - Asset type display
     - Slide-in animation from right
     - Auto-dismiss after 3 seconds
   - Debug Marker: `[DEBUG-WORKITEM:hcp-ids:phase-2-toast-function]`
   - Success Criteria: Function creates and displays toast
   - Estimated Duration: 45 minutes
   - Handoff File: `handoffs/phase-2-todo-1.json`
   - On Completion: Auto-invoke Task 2c

3. **Task 2c: Integrate Toast with Click Handler** (todo.prompt.md handoff)
   - Action: Call `showButtonIdToast()` from `handleShareButtonClick`
   - Files: `SPA/NoorCanvas/Pages/HostControlPanel.razor`
   - Location: `handleShareButtonClick` function (line 4814+)
   - Changes:
     - Extract button ID from clicked element
     - Call `showButtonIdToast(buttonId, assetType)` after validation
     - Ensure toast appears before SignalR broadcast
   - Debug Marker: `[DEBUG-WORKITEM:hcp-ids:phase-2-toast-integration]`
   - Success Criteria: Toast appears on click, share still works
   - Estimated Duration: 30 minutes
   - Handoff File: `handoffs/phase-2-todo-2.json`
   - On Completion: Auto-invoke Task 2d

4. **Task 2d: Run & Fix Test**
   - Action: Execute phase-2-toast-notification.spec.ts
   - Test Command: `npx playwright test .github/key-data-streams/hcp-ids/tests/phase-2-toast-notification.spec.ts`
   - Success Criteria: Toast verified, all tests green
   - Estimated Duration: 20 minutes
   - On Success: Auto-invoke Task 2e
   - On Failure: Debug and fix until passing

5. **Task 2e: Phase Validation & Checkpoint**
   - Update work-log.md with phase completion
   - Update hcp-ids.plan.json phase status to "complete"
   - Commit checkpoint: `ckpt(hcp-ids): Phase 2 complete - Toast notifications added`
   - **AUTO-CONTINUE**: Proceed to Phase 3

**Auto-Continue Conditions**:
- ✅ All tasks complete
- ✅ Toast displays correctly
- ✅ Share functionality unaffected
- ✅ Build succeeds
- ❌ HALT if: Toast breaks share, layout issues

**Rollback Plan**:
- Checkpoint: `ckpt(hcp-ids): Before Phase 2`
- Rollback: `git reset --hard {checkpoint-sha}`

---

### Phase 3: Code Cleanup & Deprecation Marking (Final Phase)

**Goal**: Mark deprecated code for future cleanup while maintaining backward compatibility

**Dependencies**: Phase 2 must be complete  
**Estimated Duration**: 1.5 hours

**Acceptance Criteria**:
1. All deprecated methods marked with `// DEPRECATED: {reason} ;MARK_FOR_CLEANUP`
2. Inline comments explain why code is deprecated
3. Deprecation timeline documented (future Phase 4)
4. All deprecated paths still functional
5. Zero breaking changes

**Tasks**:

1. **Task 3a: Create Passing Test** (test-generation.prompt.md handoff)
   - Purpose: Verify deprecated code still works
   - Test File: `.github/key-data-streams/hcp-ids/tests/phase-3-backward-compatibility.spec.ts`
   - Coverage:
     - Test deprecated fallback methods
     - Verify no regressions
     - Confirm cleanup markers present
   - Acceptance Criteria Under Test: All Phase 3 criteria
   - Success Criteria: Deprecated code functional
   - Estimated Duration: 30 minutes
   - Handoff File: `handoffs/phase-3-test.json`

2. **Task 3b: Mark Deprecated Methods** (todo.prompt.md handoff)
   - Action: Add deprecation comments to legacy code
   - Files: `SPA/NoorCanvas/Pages/HostControlPanel.razor`
   - Targets:
     - `InjectIndividualShareButtons` (legacy fallback)
     - Any old asset detection methods
     - Superseded logging patterns
   - Comment Pattern:
     ```csharp
     // DEPRECATED: Use [new method] instead. Legacy fallback for [reason].
     // Timeline: Remove in Phase 4 cleanup (after full migration verified)
     // Marker: ;MARK_FOR_CLEANUP
     ```
   - Debug Marker: `[DEBUG-WORKITEM:hcp-ids:phase-3-deprecation-markers]`
   - Success Criteria: All deprecated code clearly marked
   - Estimated Duration: 45 minutes
   - Handoff File: `handoffs/phase-3-todo-1.json`
   - On Completion: Auto-invoke Task 3c

3. **Task 3c: Document Cleanup Plan** (todo.prompt.md handoff)
   - Action: Update work-log.md with deprecation inventory
   - Files: `.github/key-data-streams/hcp-ids/work-log.md`
   - Content:
     - List all deprecated methods
     - Explain why each is deprecated
     - Outline Phase 4 cleanup scope
     - Migration validation checklist
   - Debug Marker: `[DEBUG-WORKITEM:hcp-ids:phase-3-cleanup-plan]`
   - Success Criteria: Deprecation inventory complete
   - Estimated Duration: 15 minutes
   - Handoff File: `handoffs/phase-3-todo-2.json`
   - On Completion: Auto-invoke Task 3d

4. **Task 3d: Run & Fix Test**
   - Action: Execute phase-3-backward-compatibility.spec.ts
   - Test Command: `npx playwright test .github/key-data-streams/hcp-ids/tests/phase-3-backward-compatibility.spec.ts`
   - Success Criteria: Deprecated code verified functional
   - Estimated Duration: 20 minutes
   - On Success: Auto-invoke Task 3e
   - On Failure: Debug and fix until passing

5. **Task 3e: Phase Validation & Checkpoint**
   - Update work-log.md with phase completion
   - Update hcp-ids.plan.json phase status to "complete"
   - Commit checkpoint: `ckpt(hcp-ids): Phase 3 complete - Deprecation marked`
   - **NO AUTO-CONTINUE** (Final Phase)

6. **Task 3f: Mark Key Complete**
   - Update hcp-ids.plan.json status to "complete"
   - Final commit: `complete(hcp-ids): All phases finished - Ready for Phase 4 cleanup`

**FINAL PHASE**: No auto-continue after completion

**Auto-Continue Conditions**:
- ✅ All tasks complete
- ✅ Deprecation markers added
- ✅ Backward compatibility verified
- ✅ Build succeeds
- ❌ HALT if: Breaking changes detected

**Rollback Plan**:
- Checkpoint: `ckpt(hcp-ids): Before Phase 3`
- Rollback: `git reset --hard {checkpoint-sha}`

---

## Test Strategy

### Test Types Required
- **E2E (Playwright)**: Button discovery, click handling, toast display
- **Visual**: Toast appearance, gradient styling, animation
- **Integration**: Share functionality unchanged, SignalR broadcast

### Test-First Approach
- Create test BEFORE implementation for each phase
- Red-green-refactor workflow
- Headless mode for speed (UI verification in headed mode if needed)

### Acceptance Criteria Enforcement
- Each phase MUST define acceptance criteria
- Tests MUST assert them (`assertCriteria: true`)

### Central Index
- Maintain `.github/tests/playwright-index.json`
- Reuse existing tests before creating new ones

### Test Data
- **Session**: 212 (KJAHA99L / PQ9N5YWW)
- **Component**: HostControlPanel.razor
- **Reference**: `.github/instructions/Links/PlaywrightQuickRef.md`

---

## Test Execution Requirements

### Orchestration (MANDATORY per MANDATORY.md Rule 3)
- **Method**: Orchestration script (REQUIRED)
- **Script**: `Scripts/run-hcp-ids-test.ps1` (created in Phase 1)
- **Pattern**: Separate PowerShell window with health check polling
- **Cleanup**: Guaranteed via try/finally with Stop-Process -Force

### Template Reference
- `.github/prompts/shared/test-orchestration-patterns.md` (MANDATORY)
- `.github/prompts/shared/playwright-test-generation.md`
- `.github/instructions/Links/PlaywrightQuickRef.md` (Session 212)

### Prohibited Approaches (DEPRECATED)
- ❌ `PW_MODE=standalone npx playwright test` (webServer config)
- ❌ Direct `npx playwright test` without orchestration
- ❌ `Start-Job` for app startup
- ❌ Manual `dotnet run` before tests

---

## Rollback Plan

### Phase Checkpoints
- **Before Phase 1**: `ckpt(hcp-ids): Before Phase 1`
- **After Phase 1**: `ckpt(hcp-ids): Phase 1 complete`
- **After Phase 2**: `ckpt(hcp-ids): Phase 2 complete`
- **After Phase 3**: `ckpt(hcp-ids): Phase 3 complete`

### Rollback Commands
- To specific phase: `git reset --hard {checkpoint-sha}`
- To beginning: `git reset --hard $(git log --grep="Before Phase 1" --format=%H -1)`

### Verification
- See `.github/prompts/shared/task-exec/checkpoint-protocol.md`

---

## Future Work (Phase 4 - Cleanup)

**NOT included in current plan - Separate key recommended**

**Scope**:
1. Remove all `// DEPRECATED ... ;MARK_FOR_CLEANUP` code
2. Consolidate logging patterns
3. Optimize button injection performance
4. Archive old asset detection methods

**Prerequisites**:
- Phase 3 complete
- Full migration verified in production
- 30+ days of diagnostic data collected

**Key**: `hcp-cleanup` (separate from hcp-ids)

---

## Dependencies

### Existing Code
- Share button injection system (working)
- Event delegation system (working)
- SignalR integration (working)
- Toast library (Notyf - already loaded)

### Libraries
- Font Awesome (fingerprint icon) - already loaded
- CSS transitions (browser native)
- DotNetObjectReference (already used)

---

## Notes

- **Non-Breaking**: All existing functionality preserved
- **Additive**: Toast and logging enhance, don't replace
- **Diagnostic**: Comprehensive logging for troubleshooting
- **Clean**: Deprecation markers prepare for future cleanup
- **Tested**: Full test coverage before implementation
