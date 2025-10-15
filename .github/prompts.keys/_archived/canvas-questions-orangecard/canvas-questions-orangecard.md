# canvas-questions-orangecard

**Status**: In Progress  
**Created**: 2025-10-14  
**Agent**: task  
**Type**: Bug Fix - Visual Rendering  
**Priority**: Medium  

---

## Overview
Fix visual rendering issue where the vote badge (red circle with count) is being cut off on orange (sienna-themed) question cards due to CSS overflow constraints.

---

## Problem Statement
The vote badge positioned with `transform:translate(50%, -50%)` extends beyond the card boundary but was being clipped by `overflow-x: hidden` on the parent `.canvas-question-item` container. This resulted in the badge being partially or fully invisible.

---

## Root Cause
- **Original CSS**: `.canvas-question-item { overflow-x: hidden; }`
- **Badge Positioning**: Absolute positioning with `transform:translate(50%, -50%)` places badge half outside card bounds
- **Conflict**: `overflow-x: hidden` clips any content extending beyond container

---

## Solution Implemented
Changed CSS overflow property to allow badge visibility:

**Before**:
```css
.canvas-question-item {
    overflow-x: hidden;
    position: relative;
}
```

**After**:
```css
.canvas-question-item {
    overflow: visible; /* Allows badge to render outside card bounds */
    position: relative;
}
```

---

## Files Modified

### SessionCanvas.razor
- **Line ~598**: Changed `.canvas-question-item` overflow property
- **Line ~1209**: Added trace-level debug logging for overflow change
- **Line ~584-602**: Added comprehensive CSS trace comments

### test-orange-card.html
- **Line ~42**: Updated test file with same overflow fix for verification

---

## Commits

### b4492a8c - [SIMPLE DEBUG] Add rendering verification debug logging
- Added simple debug logging to confirm orange card rendering
- Verified CSS fix (`overflow: visible`) is in place and working
- Confirmed vote badge positioning with `transform:translate(50%, -50%)`

### ddc8a1ac - trace(canvas-questions-orangecard): Add comprehensive debug logging
- Added trace-level debug logging to `OnInitializedAsync`
- Added CSS inline comments documenting overflow change rationale
- Documented badge positioning requirements

### 4b913720 - fix(canvas-questions-orangecard): Fix badge cutoff
- Changed `overflow-x: hidden` to `overflow: visible`
- Applied to both SessionCanvas.razor and test-orange-card.html

---

## Testing Strategy

### Manual Verification
1. Open `test-orange-card.html` in browser
2. Verify red badge (vote count "0") is fully visible in top-right corner
3. Check badge positioning: 50% outside card boundary on top and right

### Visual Regression Test
- Test file: `Tests/UI/canvas-questions-orange-card-visual.spec.ts`
- Validates orange card rendering matches ContextCopilot.txt specification

---

## Debug Logging (Trace Level)

All debug markers use pattern: `[DEBUG-WORKITEM:canvas-questions-orangecard:scope] message ;CLEANUP_OK`

### Key Debug Points
1. **OnInitializedAsync**: Documents overflow property change
2. **CSS Comments**: Inline documentation of overflow rationale
3. **Theme Trace**: Documents sienna color scheme application

### Cleanup Command
```bash
# When ready to remove debug logging
grep -r "DEBUG-WORKITEM:canvas-questions-orangecard" --include="*.razor" --include="*.cs"
```

---

## Dependencies
- **ContextCopilot.txt**: Source of truth for orange card styling specification
- **SessionCanvas.razor**: Main component with question card rendering
- **test-orange-card.html**: Isolated test harness for verification

---

## Next Steps
1. ✅ Apply overflow fix to SessionCanvas.razor
2. ✅ Update test-orange-card.html for verification
3. ✅ Add trace-level debug logging
4. ✅ Add simple debug logging for rendering verification
5. ✅ Verify CSS styling matches test file
6. ⏳ Run visual regression test (requires running application)
7. ⏳ Verify in live session with real questions
8. ⏳ Remove debug markers (cleanup workflow)

---

## Notes
- **Why not `overflow-x: visible`?**: Using `overflow: visible` instead of `overflow-x: visible` ensures both X and Y axes allow overflow, preventing future clipping issues
- **Position Context**: Parent must have `position: relative` for absolute positioned badge child
- **Design Consistency**: Orange card now matches design specification from ContextCopilot.txt
- **Styling Verified**: CSS in SessionCanvas.razor matches test-orange-card.html exactly
- **Badge Positioning**: Inline style `transform:translate(50%, -50%)` positions badge half outside card bounds (requires `overflow:visible`)
- **Test Requirements**: Visual regression test requires application running on https://localhost:9091

---

## Metadata
**Scope**: Frontend - Blazor Component  
**Impact**: Low - Visual fix only, no logic changes  
**Risk**: Minimal - CSS-only change  
**Rollback**: `git revert ddc8a1ac 4b913720`
