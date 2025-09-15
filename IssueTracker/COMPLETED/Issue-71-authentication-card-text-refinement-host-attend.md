# Issue-71: Authentication Card Text Refinement - HOST and ATTEND Labels

**Date Created:** September 14, 2025  
**Status:** In Progress  
**Priority:** Medium  
**Category:** UX Enhancement  
**Estimated Time:** 30 minutes  

## Issue Summary
Update authentication card button text labels from verbose descriptions to concise single-word labels: "Manage Session" → "HOST" and "Attend Session" → "ATTEND".

## Current State
- Host card displays "Manage Session" as button text
- Participant card displays "Attend Session" as button text

## Desired Outcome
- Host card should display "HOST" as button text
- Participant card should display "ATTEND" as button text
- Maintain existing functionality and styling
- Keep text clear and readable

## Technical Requirements
1. Update Landing.razor file to change button text labels
2. Ensure text remains properly styled and centered
3. Verify text fits well within existing button design
4. Maintain accessibility and readability

## Files to Modify
- `Pages/Landing.razor` - Update noor-large-button-text elements

## Acceptance Criteria
- [ ] Host authentication card displays "HOST" instead of "Manage Session"
- [ ] Participant authentication card displays "ATTEND" instead of "Attend Session"
- [ ] Text is properly styled and centered
- [ ] All existing functionality remains intact
- [ ] Text is clearly readable on all devices

## Testing Steps
1. Build and run the application
2. Navigate to landing page
3. Verify Host card shows "HOST" text
4. Verify Participant card shows "ATTEND" text
5. Test card interactions and animations work properly

## Notes
Simple text label update for cleaner, more concise UI presentation while maintaining user understanding of card purposes.
