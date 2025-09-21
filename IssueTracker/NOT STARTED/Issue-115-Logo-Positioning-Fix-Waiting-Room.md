# Issue-115: Logo Positioning Fix - Move Logo Inside Card Container in Waiting Room

**Created**: September 18, 2025  
**Status**: NOT STARTED  
**Priority**: Medium  
**Component**: SessionWaiting.razor UI Layout  
**Reporter**: User Feedback

## Problem Description

The NOOR Canvas logo in the SessionWaiting.razor (waiting room) component is positioned **outside** the main card container, which is inconsistent with the layout pattern used in HostLanding.razor where the logo is properly positioned **inside** the main card container.

### Current Issue

- **SessionWaiting.razor**: Logo is outside the main white card container
- **HostLanding.razor**: Logo is correctly inside the main white card container (reference pattern)

### Visual Impact

- Inconsistent UI layout across components
- Logo appears disconnected from the main content area
- Does not follow the established design pattern

## Expected Behavior

The logo should be positioned **inside** the main card container, following the same pattern as HostLanding.razor:

```html
<div style="main-card-container-styles...">
  <!-- Logo INSIDE the card -->
  <div
    class="noor-canvas-logo"
    style="display:flex;align-items:center;justify-content:center;text-align:center;margin-bottom:1.5rem;"
  >
    <img
      src="/images/branding/NC-Header.png?v=@DateTime.Now.Ticks"
      alt="NOOR Canvas"
      style="max-width:150px;height:auto;margin:0 auto;"
    />
  </div>

  <!-- Rest of content -->
</div>
```

## Acceptance Criteria

✅ **AC1**: Logo is moved inside the main card container  
✅ **AC2**: Logo styling matches HostLanding.razor pattern exactly  
✅ **AC3**: Logo positioning is consistent across all states (loading, error, loaded)  
✅ **AC4**: No visual regressions in other UI elements  
✅ **AC5**: Responsive design maintained on all screen sizes

## Technical Details

### Files to Modify

- `SPA/NoorCanvas/Pages/SessionWaiting.razor` - Move logo positioning

### Reference Implementation

- `SPA/NoorCanvas/Pages/HostLanding.razor` - Lines 28-31 (logo inside card pattern)

### Current Code Location

- **SessionWaiting.razor** Lines 29-33: Logo currently outside main container
- **HostLanding.razor** Lines 28-31: Reference pattern to follow

## Implementation Notes

1. **Logo Structure**: Use exact same HTML structure as HostLanding.razor
2. **Styling**: Maintain consistent margin-bottom and alignment
3. **Multiple States**: Update all conditional rendering blocks (loading, error, loaded states)
4. **CSS Classes**: Use same `noor-canvas-logo` class for consistency

## Testing Requirements

### Playwright Test Plan

Create `issue-115-logo-positioning-fix.spec.ts` with:

1. **Visual Verification**: Logo is inside main card container
2. **State Testing**: Logo positioned correctly in all states (loading/error/loaded)
3. **Responsive Testing**: Logo alignment on different screen sizes
4. **Consistency Check**: Compare with HostLanding.razor layout
5. **Regression Testing**: All existing functionality preserved

### Manual Testing

- [ ] Navigate to waiting room with valid token
- [ ] Verify logo is inside white card container
- [ ] Test on desktop, tablet, mobile viewports
- [ ] Compare visually with HostLanding.razor
- [ ] Verify no layout shifts or visual artifacts

## Risk Assessment

**Risk Level**: Low  
**Impact**: Visual/UI consistency improvement  
**Complexity**: Simple HTML structure move

### Mitigation

- Keep exact same logo HTML structure
- Test all conditional rendering paths
- Verify responsive behavior maintained

## Definition of Done

- [ ] Logo moved inside main card container in all UI states
- [ ] Visual layout matches HostLanding.razor pattern
- [ ] Playwright test created and passing
- [ ] Manual testing completed on multiple viewports
- [ ] No visual regressions introduced
- [ ] Code reviewed for consistency

---

**Related Issues**: None  
**Dependencies**: None  
**Estimated Effort**: 1-2 hours
