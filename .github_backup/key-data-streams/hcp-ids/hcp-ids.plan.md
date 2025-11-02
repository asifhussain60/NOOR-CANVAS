# hcp-ids.plan.md

**Key**: hcp-ids  
**Feature**: Share Button ID Toast Notification System  
**Component**: Host Control Panel (HostControlPanel.razor)  
**Created**: 2025-11-01  
**Status**: Planning

## Overview

Implement a system where share buttons in the Host Control Panel display their unique IDs in toast notifications when clicked. This helps verify the button injection and click binding system is working correctly.

## Current State Analysis

### Existing Button Injection
- **Location**: Line 3354-3364 in HostControlPanel.razor
- **Method**: `GenerateShareButton(long assetId, string assetType)`
- **ID Format**: `share-btn-{assetType}-{assetId}`
- **Example**: `share-btn-ayah-card-12345`

### Existing Handler Setup
- **Location**: Line 4762-4801 in `<script>` section
- **Function**: `setupShareButtonHandlers(dotNetObjectRef)`
- **Current Behavior**: 
  - Uses event delegation on document
  - Logs button detection to console
  - No initialization flag tracking

### Existing Click Handler
- **Location**: Line 4814-4946 in `<script>` section  
- **Function**: `handleShareButtonClick(event)`
- **Current Behavior**:
  - Detects `.ks-share-button` elements
  - Extracts data attributes
  - Calls C# `ShareAsset` method
  - No toast showing button ID

## Acceptance Criteria

### Phase 1: Initialization Flag
- [ ] Add C# field: `private bool shareButtonsInitialized = false;`
- [ ] Set `window.shareButtonsInitialized = true` in `setupShareButtonHandlers`
- [ ] Check flag in `handleShareButtonClick` before processing clicks

### Phase 2: Button ID Logging
- [ ] Log button ID in `setupShareButtonHandlers` during discovery
- [ ] Log button ID in `handleShareButtonClick` during click detection
- [ ] Include button ID in all console logs for traceability

### Phase 3: Toast Notification
- [ ] Create `showButtonIdToast(buttonId, assetType)` JavaScript function
- [ ] Display toast with:
  - Button unique ID
  - Asset type
  - Modern gradient styling (purple theme)
- [ ] Call toast function when share button clicked
- [ ] Auto-dismiss after 3 seconds

### Phase 4: Enhanced Button Detection
- [ ] Update button selector to include ID prefix: `[id^="share-btn-"]`
- [ ] Ensure all share buttons are detected regardless of class/ID approach

## Implementation Plan

### Step 1: Add Initialization Tracking (C# Code)
**File**: `SPA/NoorCanvas/Pages/HostControlPanel.razor`
**Location**: `@code` block with other private fields (around line 165)

```csharp
private bool shareButtonsInitialized = false;
```

### Step 2: Update Handler Setup (JavaScript)
**File**: `SPA/NoorCanvas/Pages/HostControlPanel.razor`
**Location**: `setupShareButtonHandlers` function (line 4762-4801)

**Changes**:
1. Log button IDs during discovery loop
2. Set `window.shareButtonsInitialized = true` at end
3. Add initialization confirmation log

### Step 3: Create Toast Function (JavaScript)
**File**: `SPA/NoorCanvas/Pages/HostControlPanel.razor`
**Location**: New function in `<script>` section (after line 4946)

**Features**:
- Gradient background (purple theme: `#4f46e5` to `#7c3aed`)
- Fingerprint icon (fa-solid fa-fingerprint)
- Button ID display
- Asset type display
- Slide-in animation from right
- Auto-dismiss after 3 seconds

### Step 4: Update Click Handler (JavaScript)
**File**: `SPA/NoorCanvas/Pages/HostControlPanel.razor`
**Location**: `handleShareButtonClick` function (line 4814-4946)

**Changes**:
1. Check `window.shareButtonsInitialized` flag first
2. Update button selector to include ID prefix
3. Extract and log button ID
4. Call `showButtonIdToast(buttonId, assetType)` when button found
5. Include button ID in all attribute logs

## Testing Strategy

### Manual Testing
1. Start session in Host Control Panel
2. Wait for share buttons to inject
3. Verify initialization flag set in console
4. Click any share button
5. Verify toast appears with correct button ID
6. Verify toast auto-dismisses after 3 seconds

### Playwright Test (Future)
- Test file: `Tests/UI/share-button-id-toast.spec.ts`
- Verify initialization flag set
- Verify toast appears on click
- Verify toast contains button ID
- Verify toast auto-dismisses

## Dependencies

### Existing Code
- Share button injection system (working)
- Event delegation system (working)
- SignalR integration (working)

### Libraries
- Font Awesome (for fingerprint icon) - already loaded
- CSS transitions (browser native)
- DotNetObjectReference (already used)

## Rollback Plan

If issues occur:
1. Remove initialization flag check (restore original handler)
2. Remove toast function
3. Restore original click handler logic
4. Keep enhanced logging for debugging

## Notes

- This enhancement is non-breaking (existing functionality preserved)
- Toast is purely informational (doesn't affect share functionality)
- Initiative flag prevents click handling before initialization
- ID-based selector provides redundancy for button detection
