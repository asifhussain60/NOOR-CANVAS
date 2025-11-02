# Plan: hcp-timer-v2 (Host Control Panel Timer Refinements)

**Key:** `hcp-timer-v2`  
**Created:** 2025-10-22  
**Status:** completed  
**Type:** UI Enhancement  
**Consolidated Into:** `hcp-refactor-phase1`

---

## Overview

Apply refinements to Host Control Panel timer including layout optimization, sticky positioning, and monospace font.

**Note:** This key was consolidated into `hcp-refactor-phase1` key. See consolidated plan for complete implementation details.

---

## Phase 1: Q&A Button Relocation

**Objective:** Move Q&A button into timer container for better layout

**Tasks:**
1. Restructure timer container
2. Move Q&A button inside timer element
3. Adjust spacing and alignment

**Status:** Consolidated into hcp-refactor-phase1

---

## Phase 2: Fixed-Width Font

**Objective:** Apply monospace font to timer for consistent width

**Tasks:**
1. Apply font-family: monospace to timer digits
2. Test with various time values

**Status:** Consolidated into hcp-refactor-phase1

---

## Phase 3: Sticky Session Title

**Objective:** Make session title header sticky on desktop/tablets

**Tasks:**
1. Add sticky positioning CSS
2. Set appropriate z-index
3. Test scroll behavior

**Status:** Consolidated into hcp-refactor-phase1

---

## Phase 4: Conditional Share Button

**Objective:** Conditionally render "Share Section" button

**Tasks:**
1. Add visibility logic
2. Test rendering conditions

**Status:** Consolidated into hcp-refactor-phase1

---

## Phase 5: Canvas Type Display

**Objective:** Display selected canvas type below timer

**Tasks:**
1. Add canvas type display element
2. Wire up data binding
3. Style appropriately

**Status:** Consolidated into hcp-refactor-phase1

---

## Consolidation Note

This work was merged into `hcp-refactor-phase1` key during HCP consolidation effort. All implementation details, commits, and testing documented in consolidated plan.

**See:** `.github/key-data-streams/hcp-refactor-phase1/hcp-refactor-phase1.plan.md`

---

## Success Criteria

- ✅ All refinements completed
- ✅ Work consolidated into hcp-refactor-phase1
- ✅ Documentation preserved in work-log
