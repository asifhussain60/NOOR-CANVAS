# DEPRECATION NOTICE

**Date:** 2025-10-27  
**Deprecated Agent:** handoff.prompt.md  

This file contains references to the deprecated `handoff.prompt.md` agent, which was archived on 2025-10-25.

## Migration Path

`handoff.prompt.md` functionality has been split into:

1. **Comprehensive Planning:** → `plan.prompt.md`
   - Full multi-phase planning
   - Test generation orchestration
   - Complete architectural changes

2. **Lightweight Execution:** → `todo.prompt.md`
   - Simple task execution
   - Extension of existing work
   - Quick iterations

## References in This File

The following references to `handoff.prompt.md` are historical and should be understood in context:

- Lines 29, 114, 131: References to handoff agent output format
- These were valid at the time of writing but are now superseded

## For Current Work

If you need similar functionality, use:
- `@workspace /plan key={key}` - For comprehensive planning
- `@workspace /todo` - For extending current work
- `@workspace /task key={key}` - For direct task execution

---

**Note:** This file is preserved for historical documentation purposes only.
