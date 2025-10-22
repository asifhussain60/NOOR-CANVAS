# Execution Plan: hcp-timer-v2 (Host Control Panel Timer Refinements)

**Key:** hcp-timer-v2  
**Created:** 2025-10-22  
**Work Request:** Move green Q&A button inside timer div (to the right), use fixed-width font for timer, make "Need For Messengers" header sticky on desktop/tablets, hide "Share Section" button when "Asset Canvas" selected, display selected canvas type subtly below timer.

**Scope:** Host Control Panel (hcp) - Timer layout refinements, sticky positioning, conditional rendering

---

## Phase 1: Move Q&A Button into Timer Container

### Implementation Context
Relocate Q&A toggle button from standalone sticky control pod into the session title header div alongside the timer. Button should be positioned to the right of the timer.

### Files to Modify
- `d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Components\Host\HostControlPanelContent.razor` - Add Q&A button parameters and rendering
- `d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Pages\HostControlPanel.razor` - Pass Q&A handlers to HostControlPanelContent, remove standalone control pod

### Acceptance Criteria
- ✓ Q&A button moved into session title header
- ✓ Button positioned to right of timer
- ✓ Standalone sticky control pod removed
- ✓ Button functionality preserved (toggle, question count badge)

---

## Phase 2: Apply Fixed-Width Font to Timer

### Implementation Context
Change timer font-family from 'Poppins' to a monospace font to prevent width changes when numbers update.

### Files to Modify
- `d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Components\Host\HostControlPanelContent.razor` - Update timer span font-family

### Acceptance Criteria
- ✓ Timer uses fixed-width monospace font
- ✓ Timer width remains stable during updates

---

## Phase 3: Make Session Title Header Sticky (Desktop/Tablets)

### Implementation Context
Add sticky positioning to session title header for desktop and tablet viewports (min-width: 768px).

### Files to Modify
- `d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Components\Host\HostControlPanelContent.razor` - Add sticky positioning CSS

### Acceptance Criteria
- ✓ Header sticky on desktop/tablets
- ✓ Mobile view remains non-sticky
- ✓ z-index prevents content overlap

---

## Phase 4: Conditionally Hide Share Section Button

### Implementation Context
Hide "Share Section" button when selectedCanvasType is "asset" (Asset Canvas mode).

### Files to Modify
- `d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Pages\HostControlPanel.razor` - Pass selectedCanvasType to HostControlPanelContent
- `d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Components\Host\HostControlPanelContent.razor` - Add SelectedCanvasType parameter, conditional rendering

### Acceptance Criteria
- ✓ Share Section button hidden when SelectedCanvasType == "asset"
- ✓ Share Section button visible when SelectedCanvasType == "transcript"

---

## Phase 5: Display Canvas Type Indicator

### Implementation Context
Add subtle canvas type indicator below timer showing "Asset Canvas" or "Transcript Canvas".

### Files to Modify
- `d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Components\Host\HostControlPanelContent.razor` - Add canvas type text below timer

### Acceptance Criteria
- ✓ Canvas type displayed below timer
- ✓ Small font size (0.75rem or smaller)
- ✓ Subtle color (#6B7280 or similar)
- ✓ Proper capitalization and formatting

---

## Phase 6: Error Collection, Self-Review, and Healthcheck

### Implementation Context
Standard final phases for validation and completion.

### Acceptance Criteria
- ✓ All errors collected and remediated
- ✓ Self-review passed
- ✓ Build succeeds
- ✓ No regressions

---

## Execution Model
- **AUTOMATIC EXECUTION:** Phases execute sequentially without user intervention
- **Per Phase:** Implement → Validate → Next Phase (max 3 retry attempts per phase)
- **Stop Condition:** Report failure after 3 failed attempts on any phase

---

## Notes
- selectedCanvasType: "asset" = Asset Canvas (SessionCanvas), "transcript" = Transcript Canvas
- Monospace fonts: 'Consolas', 'Monaco', 'Courier New', monospace
- Sticky positioning: position:sticky with top:1rem for viewport retention
