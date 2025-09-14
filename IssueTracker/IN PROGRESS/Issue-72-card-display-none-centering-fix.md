# Issue-72: Card Display None and Centering Fix

**Date Created:** September 14, 2025  
**Status:** In Progress  
**Priority:** High  
**Category:** UX Bug  
**Estimated Time:** 1-2 hours  

## Issue Summary
The second panel is not properly using `display: none` to remove from HTML layout, and the active card is not centering properly on the page during 2-step UX transitions.

## Current State
- When one card is selected, the inactive card should be completely removed from layout using `display: none`
- The active card should center perfectly on the page
- Currently, the card hiding/centering mechanism is not working as expected

## Root Cause Analysis
Based on previous Issue-69, we implemented `display: none` for `.noor-card-hidden` class, but there may be:
1. CSS specificity conflicts
2. JavaScript animation timing issues
3. Flexbox centering conflicts
4. CSS class application problems

## Technical Requirements
1. Ensure `.noor-card-hidden` class properly applies `display: none`
2. Verify JavaScript card animation system correctly toggles classes
3. Implement proper flexbox centering for active card
4. Add comprehensive debug logging to track class changes
5. Fix any CSS conflicts or specificity issues

## Files to Investigate/Modify
- `Pages/Landing.razor` - JavaScript card animator and CSS classes
- `wwwroot/css/noor-canvas.css` - Card hiding and centering styles
- Browser developer tools - Runtime CSS inspection

## Acceptance Criteria
- [ ] Inactive card completely disappears from page layout (display: none)
- [ ] Active card centers horizontally and vertically on page
- [ ] No visual artifacts or layout shifting during transitions
- [ ] Debug logging shows proper class application
- [ ] Animation timing feels smooth and natural
- [ ] Works consistently across multiple card selection cycles

## Debugging Strategy
1. Add console.log statements to track class additions/removals
2. Inspect computed CSS styles in browser developer tools
3. Verify CSS specificity and override conflicts
4. Test animation timing and sequence
5. Validate flexbox centering implementation

## Testing Steps
1. Load landing page in browser
2. Click host card - verify participant card disappears completely
3. Verify host card centers on page
4. Navigate back and click participant card
5. Verify host card disappears and participant card centers
6. Check browser console for debug information
7. Inspect element styles in developer tools

## Dependencies
- Issue-67 (2-Step UX) animation system
- Issue-69 (Display None Implementation) previous fix
- CSS class management system

## Notes
This is a critical UX issue affecting the core landing page experience. The card centering is essential for proper visual hierarchy and user focus.
