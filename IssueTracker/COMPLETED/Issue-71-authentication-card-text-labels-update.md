# Issue-71: Authentication Card Text Labels Update

**Date Created:** September 14, 2025  
**Status:** In Progress  
**Priority:** Medium  
**Category:** UX Refinement  
**Estimated Time:** 30 minutes

## Issue Summary

Simplify authentication card text labels for better visual clarity and conciseness.

## Current State

- Host card displays: "MANAGE SESSION"
- Participant card displays: "ATTEND SESSION"

## Desired Outcome

- Host card should display: "HOST"
- Participant card should display: "ATTEND"

## Technical Requirements

1. Update Landing.razor file to change button text labels
2. Ensure text maintains proper styling and visibility
3. Verify both labels display correctly in Step 1 view
4. Maintain existing functionality and 2-step UX flow

## Files to Modify

- `Pages/Landing.razor` - Update noor-large-button-text content

## Acceptance Criteria

- [ ] Host card displays "HOST" instead of "MANAGE SESSION"
- [ ] Participant card displays "ATTEND" instead of "ATTEND SESSION"
- [ ] Text styling remains consistent and readable
- [ ] 2-step UX flow continues to work properly
- [ ] Hover effects and animations remain functional

## Testing Steps

1. Build and run the application
2. Navigate to landing page
3. Verify host card shows "HOST"
4. Verify participant card shows "ATTEND"
5. Test clicking both cards to ensure functionality works

## Dependencies

- Issue-67 (2-Step UX) must remain functional
- Existing card styling should be preserved

## Notes

Simple text label update to improve visual clarity and reduce clutter in the authentication cards.
