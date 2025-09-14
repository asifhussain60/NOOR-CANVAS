# Issue-72: Display None CSS Class Not Working - Card Centering Bug

**Date Created:** September 14, 2025  
**Status:** In Progress  
**Priority:** Critical  
**Category:** CSS/Layout Bug  
**Estimated Time:** 1-2 hours  

## Issue Summary
The `display: none` CSS class is not properly hiding the inactive authentication card, preventing the active card from centering properly on the page during step 2 of the authentication flow.

## Current State
- Issue-69 previously implemented `display: none` for `.noor-card-hidden` class
- CSS class exists but second panel is still visible in screenshot
- Active card is not properly centering when other card should be hidden
- Card animation system may not be applying classes correctly

## Desired Outcome
- Inactive card should be completely hidden from DOM layout (display: none)
- Active card should center properly on the page
- Smooth transitions between step 1 (both cards visible) and step 2 (one card hidden)
- Proper CSS class application through JavaScript animation system

## Root Cause Analysis Required
1. Verify CSS class definitions are correct
2. Check JavaScript card animation system applies classes properly
3. Investigate CSS specificity conflicts
4. Ensure Blazor state management triggers re-render correctly
5. Debug timing issues between CSS transitions and display changes

## Technical Investigation Steps
1. **CSS Verification**: Confirm `.noor-card-hidden { display: none; }` is properly defined
2. **JavaScript Debug**: Add console logging to `NoorCardAnimator.expandCard()` function
3. **DOM Inspection**: Check if classes are actually being applied to DOM elements
4. **CSS Specificity**: Verify no other CSS rules are overriding display: none
5. **Blazor State**: Confirm `StateHasChanged()` is called after class changes

## Files to Investigate
- `wwwroot/css/noor-canvas.css` - CSS class definitions
- `Pages/Landing.razor` - JavaScript NoorCardAnimator system and Blazor state management
- Browser DevTools - Runtime CSS class application

## Debugging Approach
1. Add extensive console logging to card animation functions
2. Log CSS class application and removal
3. Verify DOM element visibility states
4. Check for CSS transition conflicts
5. Test timing between JavaScript and Blazor state changes

## Acceptance Criteria
- [ ] Inactive card is completely hidden (display: none) during step 2
- [ ] Active card properly centers on the page
- [ ] No visual artifacts or layout shifts
- [ ] Smooth transitions between states
- [ ] Debug logging shows proper class application
- [ ] Works consistently across different browsers

## Testing Steps
1. Navigate to landing page (step 1 - both cards visible)
2. Click on Host card "Continue as Host" button
3. Verify Participant card completely disappears
4. Verify Host card centers properly on page
5. Repeat test with Participant card selection
6. Check browser console for debug logs

## Dependencies
- Issue-69 (Display None Implementation) - Previously implemented but not working
- Issue-67 (2-Step UX) - Core functionality that this bug affects

## Notes
Critical bug that affects user experience during authentication flow. Requires thorough debugging of CSS/JavaScript interaction and Blazor state management.
