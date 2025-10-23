# Continue — Extend Current Work with Same Key

**Version**: 1.0.0  
**Purpose**: Extend or modify the current active work request while preserving context, key, and execution flow.

---

## Critical Rules
1. MAX 15 bullets per response (see `.github/prompts/shared/CONCISE-MANDATE.md`)
2. **Preserve current key** - Use same key from most recent handoff/task
3. **Extend, don't replace** - Add to existing plan, don't restart
4. Auto-execute after 5s unless "review"/"cancel"

## Input
Additional work requests + optional modifications to current plan

## Key Strategy
- **Always preserve current key** from most recent work
- **Multi-task extensions**: `{current-key}-ext1`, `{current-key}-ext2` if needed
- **Expand shortcuts** via UserDictionary.md

## Context Detection
1. **Find current key** from recent git commits (ckpt messages)
2. **Load current plan** from `Workspaces/Copilot/_DOCS/summaries/{key}.plan.md`
3. **Check execution status** from recent commits and file changes
4. **Identify completion state** of current phases

## Routing (Same as Handoff)
Classify → include prompts:
- Always: task
- Tests: test-generation  
- Architecture: create-plan, sync
- Quality: refactor, cohesion-review
- Validation: healthcheck

## Plan Extension Structure
Update existing `{key}.plan.md` with:
- **New phases** appended to current plan
- **Modified phases** if existing work needs changes
- **Exit criteria** updated for extended scope
- **Error remediation** plan updated

## Output (STRICT)
🧠 Analysis (5 bullets):
- Current key detected, current phase, extension scope, routing

📌 Summary (10 bullets):
1. Key: {current-key} | Extension: {description}
2. Current Status: Phase {N} of {total}
3. Addition: {new-work-description}
4. New Phases: {count}
5. Files: {additional-count}
6. Integration: {how-extension-fits}
7. Impact: {existing-work-changes}
8. Testing: {additional-tests-needed}
9. Timeline: {estimated-addition}
10. Next: **A.** Execute Extension | **B.** Review Plan | **C.** Modify Scope | **D.** Start Fresh

📊 Final:
- Status | Key | Current Phase | Extension | Next

## Execution
- **Preserve execution context** - Continue from current phase
- **NO approval needed** between existing phases
- **MANDATORY**: Create git commit after EVERY new phase
- **Commit format**: `ckpt({key}): Phase {N} - {extension-summary}`
- **Auto-execute after 5s** unless "review"/"cancel"

## Context Preservation
- **Keep existing plan structure** intact
- **Append new phases** with proper numbering
- **Update completion criteria** to include extensions
- **Maintain checkpoint commit pattern**
- **Preserve work-log and documentation**

## Error Handling
- **If no current key detected**: Ask user to specify or create new handoff
- **If plan not found**: Reconstruct from git history or start fresh
- **If work completed**: Create new phases for post-completion work
- **If conflicts detected**: Present resolution options

## Integration Points
- **Current phase completion**: Ensure current work finishes before extension
- **Dependency management**: Identify if extension depends on current work
- **Testing integration**: Merge new tests with existing test plan
- **Documentation updates**: Extend existing summaries and logs

---

## Success Criteria
- Current key preserved and continued
- Existing work context maintained
- New work properly integrated into plan
- Execution continues seamlessly
- All phases properly numbered and sequenced