# Asset Broadcasting Fix - Holistic Implementation Plan

## Problem Analysis

**Root Cause**: SignalR refactoring created duplicate and conflicting event handlers:
1. **Duplicate AssetShared handlers**: Line 2855 (service delegation) + Line 2997 (inline old code)
2. **Missing AssetContentReceived delegation**: Handler exists inline but not properly delegated to service
3. **Event name mismatch**: AssetSharingService sends `AssetContentReceived` but canvas primarily listens to `AssetShared`
4. **Code duplication**: ~200 lines of inline handlers duplicated between SessionCanvas and TranscriptCanvas

**Impact**: Host broadcasts succeed, but participants receive nothing (zero console logs).

---

## Phase 1: Service Layer Enhancement ✅ COMPLETE

### 1.1 Add AssetContentReceived Handler to Service ✅
- **File**: `SPA/NoorCanvas/Services/SignalR/ISessionCanvasSignalRService.cs`
- **Action**: Add `HandleAssetContentReceivedAsync(string htmlContent, ...)` method signature
- **Status**: ✅ COMPLETE

### 1.2 Implement Service Handler ✅
- **File**: `SPA/NoorCanvas/Services/SignalR/SessionCanvasSignalRService.cs`
- **Action**: Implement `HandleAssetContentReceivedAsync` with tracking, logging, and callback invocation
- **Status**: ✅ COMPLETE

---

## Phase 2: SessionCanvas Cleanup (IN PROGRESS)

### 2.1 Remove Duplicate AssetShared Handler
- **File**: `SPA/NoorCanvas/Pages/SessionCanvas.razor`
- **Lines**: 2993-3074 (duplicate inline handler)
- **Action**: Delete entire inline AssetShared handler block
- **Reason**: Already delegated to service at line 2855
- **Status**: ✅ COMPLETE

### 2.2 Fix AssetContentReceived Handler Registration
- **File**: `SPA/NoorCanvas/Pages/SessionCanvas.razor`
- **Current**: Inline handler with 50+ lines of diagnostic logging
- **New**: Single-line delegation to service
- **Code**:
```csharp
hubConnection.On<string>("AssetContentReceived", async (htmlContent) => 
    await SignalREventService.HandleAssetContentReceivedAsync(htmlContent, OnAssetShared));
```
- **Status**: ⚠️ PARTIAL (delegation added but duplicate inline still exists)

### 2.3 Remove Obsolete Inline Handlers
- **Targets**:
  - Lines 3005-3057: Duplicate HtmlContentReceived with wrong body (AssetContentReceived logging)
  - Keep only: Lines 3059+: Proper HtmlContentReceived handler
- **Status**: ❌ PENDING

### 2.4 Verify Event Handler Registration Order
- **Check**: AssetContentReceived registered BEFORE StartAsync()
- **Location**: Within InitializeSignalRAsync method
- **Status**: ❌ PENDING

---

## Phase 3: TranscriptCanvas Cleanup

### 3.1 Apply Same Pattern as SessionCanvas
- **File**: `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`
- **Actions**:
  1. Remove duplicate AssetShared inline handler
  2. Replace inline AssetContentReceived with service delegation
  3. Remove obsolete HtmlContentReceived duplicates
- **Status**: ❌ PENDING

### 3.2 Verify Consistency
- **Check**: Both canvas files use identical event handler patterns
- **Status**: ❌ PENDING

---

## Phase 4: Build Verification

### 4.1 Compile Check
- **Command**: `dotnet build SPA/NoorCanvas/NoorCanvas.csproj`
- **Expected**: 0 errors
- **Status**: ❌ PENDING

### 4.2 Static Analysis
- **Check**: No unused variables, unreachable code
- **Tool**: Roslynator (optional)
- **Status**: ❌ PENDING

---

## Phase 5: Automated Testing

### 5.1 Create Headless Broadcast Test
- **File**: `Tests/UI/asset-broadcast-verification.spec.ts`
- **Test Cases**:
  1. **Single Asset Broadcast**
     - Setup: 1 host + 2 participants (SessionCanvas + TranscriptCanvas)
     - Action: Host shares asset
     - Assert: Both participants receive AssetContentReceived event
     - Assert: Both participants display asset HTML
     - Assert: Latency < 1000ms
  
  2. **Multiple Asset Broadcast**
     - Setup: 1 host + 2 participants
     - Action: Host shares 3 different assets sequentially
     - Assert: All assets received in order
     - Assert: Last asset displayed on both canvases
  
  3. **Concurrent Participants**
     - Setup: 1 host + 5 participants
     - Action: Host shares asset
     - Assert: All 5 participants receive event simultaneously
  
  4. **Late Joiner**
     - Setup: Host shares asset, then new participant joins
     - Assert: Late joiner does NOT see old asset (state not persisted)
  
  5. **Group Membership Verification**
     - Setup: Participants join session
     - Assert: JoinSession completes before host shares
     - Assert: SignalR connection state = 'Connected'

- **Status**: ❌ PENDING

### 5.2 Update Diagnostic Test
- **File**: `Tests/UI/asset-broadcast-flow-diagnosis.spec.ts`
- **Action**: Update to use new service-delegated handlers
- **Status**: ❌ PENDING

### 5.3 Browser Console Monitoring Test
- **Purpose**: Verify no duplicate event logs, clean reception
- **Expected Logs**:
  - SessionCanvas: `[SignalREventContext] AssetContentReceived event received`
  - TranscriptCanvas: Same pattern
  - NO logs: `[ASSET-RECEIVED-TRACE]`, `[DEBUG-WORKITEM:hcp-questions]`
- **Status**: ❌ PENDING

---

## Phase 6: Integration Testing

### 6.1 Manual Verification Script
- **File**: `Scripts/verify-asset-broadcast.ps1`
- **Steps**:
  1. Start app: `dotnet run --project SPA/NoorCanvas`
  2. Open 3 browser windows (incognito):
     - Window 1: Admin → Create session → Open HostControlPanel
     - Window 2: Participant → Join session → SessionCanvas
     - Window 3: Participant → Join session → TranscriptCanvas
  3. Share asset from host
  4. Verify visual appearance on both participant windows
- **Status**: ❌ PENDING

### 6.2 Playwright E2E Test
- **File**: `Tests/UI/asset-broadcast-e2e.spec.ts`
- **Scenario**: Full user journey from session creation to asset sharing
- **Status**: ❌ PENDING

---

## Phase 7: Cleanup and Documentation

### 7.1 Remove Debug Logging
- **Pattern**: `;CLEANUP_OK` markers
- **Files**: SessionCanvas.razor, TranscriptCanvas.razor
- **Action**: Remove all temporary diagnostic logs from asset broadcasting
- **Status**: ❌ PENDING

### 7.2 Update Architecture Docs
- **File**: `Docs/SIGNALR-EVENT-ARCHITECTURE.md` (create if needed)
- **Content**:
  - Event flow diagram: HostControlPanel → AssetSharingService → SessionHub → Canvas
  - Service delegation pattern explanation
  - Event naming conventions (AssetContentReceived vs AssetShared)
- **Status**: ❌ PENDING

### 7.3 Update ASSET-BROADCAST-FIX.md
- **Action**: Mark issue as RESOLVED, add test results, link to commits
- **Status**: ❌ PENDING

---

## Success Criteria

### Must-Have (Phase 5 completion)
✅ All Playwright tests pass (0 failures)
✅ Host shares asset → Both participants display within 1 second
✅ No duplicate event handlers in code
✅ No console errors during broadcast
✅ Build succeeds with 0 errors

### Nice-to-Have (Phase 7 completion)
✅ Code duplication eliminated (~200 lines removed per canvas)
✅ Consistent service delegation pattern across all SignalR events
✅ Clean browser console logs (no debug spam)
✅ Comprehensive test coverage (5+ scenarios)

---

## Risk Mitigation

### Risk 1: Breaking Other SignalR Events
- **Mitigation**: Run full regression test suite after Phase 2/3
- **Tests**: Question submission, voting, deletion, session ended

### Risk 2: Timing Issues with Connection Reuse
- **Mitigation**: Verify handler registration happens BEFORE StartAsync
- **Fallback**: Add explicit connection state check before JoinSession

### Risk 3: Test Flakiness
- **Mitigation**: Add explicit waits for SignalR connection state
- **Mitigation**: Use retry logic for network-dependent assertions

---

## Rollback Plan

If Phase 5 tests fail after Phase 2/3 changes:

1. **Git Reset**: `git reset --hard HEAD~1` (undo last commit)
2. **Cherry-pick**: Restore working state from commit `f51da774` (known working)
3. **Re-evaluate**: Review git history for subtle differences
4. **Incremental**: Apply changes one file at a time with test verification

---

## Execution Timeline

| Phase | Estimated Time | Status |
|-------|---------------|--------|
| Phase 1 | 15 min | ✅ COMPLETE |
| Phase 2 | 30 min | ⚠️ IN PROGRESS |
| Phase 3 | 20 min | ❌ PENDING |
| Phase 4 | 5 min | ❌ PENDING |
| Phase 5 | 45 min | ❌ PENDING |
| Phase 6 | 20 min | ❌ PENDING |
| Phase 7 | 15 min | ❌ PENDING |
| **TOTAL** | **2.5 hours** | |

---

## Current Blocker

**Issue**: SessionCanvas.razor has malformed duplicate handlers after partial edits
- Lines 3005-3057: HtmlContentReceived with AssetContentReceived body (wrong)
- Lines 3059+: Proper HtmlContentReceived handler

**Resolution**: Need to carefully remove lines 3005-3057 without breaking line 3059+

**Next Step**: Execute Phase 2.3 cleanup with precise line range replacements
