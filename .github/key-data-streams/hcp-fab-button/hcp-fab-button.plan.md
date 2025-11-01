# FAB Button Click Handler with Toast Notification

**Key:** `hcp-fab-button`  
**Status:** Planning  
**Created:** 2025-11-01  
**Complexity:** Moderate (Score: 7/15)

---

## 📋 Overview

Implement click handler for FAB (Floating Action Button) share buttons that displays toast notifications showing the button's unique ID when clicked.

**Related Keys:**
- `hcp-ids` - ID refactoring work
- `hcp-refactor` - Host Control Panel cleanup

**Architecture Layers:**
- UI (Razor components)
- JavaScript (event handlers, toast notifications)

---

## 🎯 Acceptance Criteria

1. ✅ Share button injection sets initialization flag (`window.shareButtonsInitialized`)
2. ✅ Click event binding waits for initialization flag before processing
3. ✅ Click handler extracts button ID from clicked element
4. ✅ Toast notification displays button ID and asset type
5. ✅ Toast has modern gradient styling matching NOOR Canvas theme
6. ✅ Toast auto-dismisses after 3 seconds with slide animation

---

## 🏗️ Technical Context

### Current Share Button Flow

**File:** `SPA/NoorCanvas/Pages/HostControlPanel.razor`

**Injection Method** (lines 3438-3467):
- Method: `InjectShareButtons`
- Button ID format: `share-btn-{assetType}-{assetId}`
- Example: `share-btn-ayah-card-12345`

**Setup Handler** (line 4762):
- Function: `setupShareButtonHandlers`
- Current behavior: Attaches click listeners via event delegation
- Missing: Initialization flag tracking

**Click Handler** (line 4814):
- Function: `handleShareButtonClick`
- Selector: `.ks-share-button`
- Data attributes extracted: `data-share-id`, `data-asset-type`, `data-instance-number`

---

## 📐 Implementation Plan

### Phase 1: Initialization Flag & Logging
**Duration:** 15 minutes  
**Risk:** LOW

**Tasks:**
1. Add `window.shareButtonsInitialized = true` in `setupShareButtonHandlers`
2. Log button IDs during setup (console.log with button.id)
3. Add initialization check at start of `handleShareButtonClick`
4. Early return if `!window.shareButtonsInitialized`

**Files Modified:**
- `SPA/NoorCanvas/Pages/HostControlPanel.razor` (JavaScript section)

**Testing:**
- Console logs show initialization flag set
- Click before initialization is ignored

---

### Phase 2: Button ID Extraction & Toast Function
**Duration:** 30 minutes  
**Risk:** MEDIUM

**Tasks:**
1. Update selector to: `.ks-share-button, [id^="share-btn-"]`
2. Extract `button.id` in click handler
3. Create `showButtonIdToast(buttonId, assetType)` function
4. Implement toast DOM creation with gradient styling
5. Add slide-in/slide-out animations

**Toast Specifications:**
- **Position:** `fixed; top: 5rem; right: 1rem;`
- **Styling:** `linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)`
- **Icon:** Font Awesome `fa-fingerprint`
- **Content:** Title, Button ID, Asset Type
- **Animation:** Transform translateX(100%) → 0, 3s auto-dismiss
- **Z-index:** 10000

**Files Modified:**
- `SPA/NoorCanvas/Pages/HostControlPanel.razor` (JavaScript section)

**Testing:**
- Click share button shows toast
- Toast displays correct button ID
- Animation smooth and completes

---

### Phase 3: Testing & Validation
**Duration:** 15 minutes  
**Risk:** LOW

**Tasks:**
1. Test initialization flag timing (buttons load → flag set)
2. Verify toast displays on button click
3. Validate button ID extraction accuracy
4. Test auto-dismiss animation (3s timeout)
5. Test multiple rapid clicks (no toast stacking)

**Test Scenarios:**
- Click share button on Ayah card → toast shows `share-btn-ayah-card-{id}`
- Click before initialization → no toast, console warning
- Multiple clicks → previous toast dismissed, new toast shown

**Files Created:**
- `Tests/UI/hcp-fab-button-click-test.spec.ts` (Playwright test)

---

## 🧪 Test Strategy

### Manual Testing
1. Start session with assets (Ayah cards)
2. Open browser console
3. Click share button
4. Verify toast appears with button ID
5. Check console logs for initialization

### Automated Testing (Playwright)
```typescript
// Test file: Tests/UI/hcp-fab-button-click-test.spec.ts
test('should display toast with button ID when FAB clicked', async ({ page }) => {
  // Navigate to HCP
  // Start session with assets
  // Wait for share buttons to load
  // Click share button
  // Assert toast visible with button ID
  // Assert toast auto-dismisses after 3s
});
```

---

## 📦 Deliverables

1. ✅ Updated `setupShareButtonHandlers` with initialization flag
2. ✅ Updated `handleShareButtonClick` with ID extraction
3. ✅ New `showButtonIdToast` function
4. ✅ Toast styling and animation
5. ✅ Playwright test for click handler
6. ✅ Work log entry documenting changes

---

## 🔄 Rollback Plan

**If issues occur:**
1. Revert JavaScript changes in `HostControlPanel.razor`
2. Remove initialization flag logic
3. Restore original click handler selector
4. Remove `showButtonIdToast` function

**Git checkpoint strategy:**
- Checkpoint after Phase 1 (initialization flag)
- Checkpoint after Phase 2 (toast implementation)
- Final checkpoint after Phase 3 (testing)

---

## 📊 Execution Options

**A.** **EXECUTE ALL PHASES CHAINED** (Recommended - 60 min total, auto-execute)  
**B.** EXECUTE PHASE 1 ONLY (15 min, initialization flag)  
**C.** EXECUTE PHASE 2 ONLY (30 min, toast implementation)  
**D.** EXECUTE PHASE 3 ONLY (15 min, testing)  
**E.** REVIEW PLAN FIRST  
**F.** CANCEL

---

**Next Step:** Reply with A, B, C, D, E, or F to proceed.
