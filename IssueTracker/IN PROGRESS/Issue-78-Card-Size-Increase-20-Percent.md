# Issue-78: Increase Card Size - Make Cards 20% Wider and Bigger

## Issue Details
- **Issue ID**: Issue-78
- **Title**: Make Cards 20% Wider and Bigger
- **Priority**: Medium
- **Status**: In Progress
- **Created**: 2025-09-14
- **Assigned To**: GitHub Copilot

## Description
Increase the size of both authentication cards (Manage Session and Join Session) by 20% in width and overall size to improve visual presence and user interaction area.

## Requirements
1. **Width Increase**: Make both cards 20% wider than current size
2. **Overall Size**: Increase height and padding proportionally for better visual balance
3. **Responsive Design**: Maintain proportional scaling across all screen sizes
4. **Consistency**: Apply changes to both HOST and ATTEND cards equally

## Current State Analysis
From previous implementations:
- Cards were reduced by 30% in Issue-76
- Current card widths are approximately 266px-336px (desktop)
- Need to increase from current size by 20%

## Implementation Plan
1. Update `.noor-card-wide` class width dimensions
2. Increase `.noor-large-button-content` height proportionally  
3. Adjust padding and spacing for visual balance
4. Update all responsive breakpoints (desktop, tablet, mobile)

## Calculations
- Current width range: 266px-336px
- 20% increase: 266px × 1.2 = 319px, 336px × 1.2 = 403px
- Current button content height: 196px
- 20% increase: 196px × 1.2 = 235px

## Acceptance Criteria
- [ ] Both cards are 20% wider than current size
- [ ] Card height and padding increased proportionally
- [ ] Responsive design maintained across all breakpoints
- [ ] Visual balance and spacing preserved
- [ ] No layout conflicts with logo or page margins

## Related Issues
- Follows Issue-76 (30% size reduction) - now expanding from that baseline
- Complements Issue-75 (logo enhancement) and Issue-77 (text changes)

## Technical Notes
- File: `SPA/NoorCanvas/wwwroot/css/noor-canvas.css`
- Target classes: `.noor-card-wide`, `.noor-large-button-content`
- Responsive breakpoints: 768px, 480px

## Testing
- [ ] Desktop layout verification
- [ ] Tablet responsive testing  
- [ ] Mobile responsive testing
- [ ] Visual balance with enlarged logo

---
**Status**: 🟡 In Progress
**Next Action**: Update CSS dimensions for 20% size increase
