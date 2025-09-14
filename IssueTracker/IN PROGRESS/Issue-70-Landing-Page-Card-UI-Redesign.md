## Issue-70: Landing Page Card UI Redesign - Remove Feature Lists, Enhance Button Design

**Issue Type:** UX/UI Enhancement  
**Priority:** Medium  
**Status:** In Progress  
**Created:** 2025-09-14  
**Estimated Effort:** 2-3 hours  

### Problem Statement
The authentication cards on the landing page currently show feature lists with tick marks, which create visual clutter and don't align with the desired clean, button-focused design. The cards need to be redesigned as large square buttons with prominent icons and simplified text.

### Current State
- Host and Participant cards display feature lists with checkmark icons
- Multiple list items create visual complexity
- Buttons are standard size at the bottom of lengthy content

### Requirements
1. **Remove Feature Lists**: Eliminate all tick mark lists from both Host and Participant cards
2. **Large Square Button Design**: Transform cards into prominent square buttons with border-radius
3. **Enhanced Icon Display**: Show large, centered icons at the top of each card
4. **Simplified Text Layout**: Display button text below icons in same or larger font size
5. **Clean, Centered Design**: Focus on visual hierarchy and clean aesthetics

### Technical Implementation Plan
1. Modify `Pages/Landing.razor` to remove `<ul>` elements with tick mark lists
2. Update card structure to focus on large icon and text only
3. Enhance CSS classes for square button appearance
4. Ensure responsive design maintains proportions
5. Test visual alignment and spacing

### Acceptance Criteria
- ✅ Feature lists completely removed from both cards
- ✅ Large, prominent icons displayed at top of each card
- ✅ Button text appears below icons in clear, readable font
- ✅ Cards have square button appearance with border-radius
- ✅ Clean, centered layout without visual clutter
- ✅ Responsive design works across screen sizes

### Files to Modify
- `SPA/NoorCanvas/Pages/Landing.razor` - Remove feature lists, restructure card content
- `SPA/NoorCanvas/wwwroot/css/noor-canvas.css` - Enhance button styling (if needed)

### Testing Notes
- Verify both desktop and mobile layouts
- Check icon sizing and alignment
- Ensure text readability and hierarchy
- Test button interactions remain functional

### Related Issues
- Issue-68: Authentication card text refinement (completed)
- Issue-69: Button panel layout fix (completed)
