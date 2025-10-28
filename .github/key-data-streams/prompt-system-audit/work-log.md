# Work Log: prompt-system-audit

**Key**: prompt-system-audit  
**Created**: 2025-10-25  
**Status**: In Progress  
**Parent**: drift-prompt (extension)

---

## Phase 1: System Analysis ✓
**Started**: 2025-10-25  
**Completed**: 2025-10-25

### Actions
- Holistic review of all prompts (plan, task, handoff, continue, drift)
- Identified 5 critical conflicts in storage, context detection, commit protocols
- Documented 9 specific issues across agent boundaries

### Issues Found
1. Storage location conflict (`.github/prompts.keys/` vs `Workspaces/Copilot/_DOCS/`)
2. Continue agent scope gap (doesn't detect plan/drift work)
3. Drift-task commit collision (`ckpt` prefix ambiguity)
4. Context detection inconsistency (different git grep patterns)
5. Plan file location mismatch (write/read different paths)

### Files Analyzed
- `.github/prompts/plan.prompt.md`
- `.github/prompts/task.prompt.md`
- `.github/prompts/handoff.prompt.md`
- `.github/prompts/continue.prompt.md`
- `.github/prompts/drift.prompt.md`

---

## Phase 6: Plan Continuation Protocol ✓
**Started**: 2025-10-25  
**Completed**: 2025-10-25

### Actions
- Added Step 0.5: Auto-detect active plan key from git history
- Implemented plan modification mode (load → modify → update → commit)
- Created plan version tracking (v1.0 → v1.1 → v1.2)
- Defined commit format for plan updates: `plan({key}): Updated v{N} - {summary}`
- Documented integration with continue.prompt.md (planning vs execution)

### User Request Context
> "if a plan prompt is followed by a plan prompt without specifying a key, the intention is to update the plan using the same ongoing key"

### Implementation
- Auto-detect from git: `git log --grep="plan(" --format="%h %s" -1`
- Verify plan files exist before modification
- Load existing plan, apply modifications, increment version
- Use Cases: Iterative refinement, phase changes, scope adjustments

### Files Modified
- `.github/prompts/plan.prompt.md` (Plan Continuation Protocol section added)

### Commits
- ✓ `plan(prompt-system-audit): Updated v1.1 - added plan continuation protocol` (3451a920)

---

## Phase 7: Output Verbosity Adjustment ✓
**Started**: 2025-10-25  
**Completed**: 2025-10-25

### Actions
- Increased chat draft limit from 30-50 lines to maximum 100 lines
- Allowed pseudocode/algorithmic descriptions (instead of executable code)
- Updated output-style-mandate.md with new limits and pseudocode policy
- Updated plan.prompt.md references throughout (8 locations)
- Added pseudocode example to plan draft template

### User Request Context
> "Remove the limitation of concise verbiage limiting to 35 lines in chat. Raise this to 100 lines. Prefer pseudocode instead of code."

### Rationale
- Complex plans need more breathing room without dumping thousands of lines
- Pseudocode clarifies logic without executable code blocks
- Balance: Still concise vs full plan files, but realistic for multi-phase work

### Files Modified
- `.github/prompts/shared/output-style-mandate.md` (verbosity limits + pseudocode)
- `.github/prompts/plan.prompt.md` (8 locations updated)

### Changes Summary
- ❌ OLD: 30-50 lines max, NO pseudocode
- ✅ NEW: 100 lines max, pseudocode PREFERRED over executable code
- Maintains: Full details always in `{key}.plan.md` files
- Maintains: 15 bullets max for summaries

### Commits
- ✓ `plan(prompt-system-audit): Updated v1.2 - raised chat limit to 100 lines, allow pseudocode` (8cc3e099)

---

## Phase 8: Next Steps Display Standardization ✓
**Started**: 2025-10-25  
**Completed**: 2025-10-25

### Actions
- Added 📋 NEXT STEPS section to output-style-mandate.md
- Standardized format: Large header + icon, key display, continuation commands
- Updated all 5 agent prompts (plan, handoff, continue, drift x2, task via mandate)
- Always show current key with instructions on continuing work
- Visual hierarchy matches 📌 Summary format

### User Request Context
> "Next steps at the end of the prompt (all) should be displayed with icon and large header similar to Summary (10 bullets) in the chat. The key should ALWAYS be displayed under next steps with instructions on how to continue using the same key."

### Implementation
- output-style-mandate.md: Added 📋 NEXT STEPS template
- plan.prompt.md: After approval step shows key + continuation commands
- handoff.prompt.md: Execute/modify/cancel with key display
- continue.prompt.md: Extension execution + key-based continuation
- drift.prompt.md: Drift registration + resolution next steps (2 sections)

### Format Pattern
```markdown
## 📋 NEXT STEPS

**Current Key**: `{key}`

**Action Options:**
[Command blocks with explanations]
```

### Files Modified
- `.github/prompts/shared/output-style-mandate.md` (Next Steps template)
- `.github/prompts/plan.prompt.md` (After approval section)
- `.github/prompts/handoff.prompt.md` (Output section)
- `.github/prompts/continue.prompt.md` (Output section)
- `.github/prompts/drift.prompt.md` (2 sections: registration + resolution)

### Commits
- (pending) `plan(prompt-system-audit): Updated v1.3 - standardized Next Steps display`

---

## Next Steps
1. Create git commit for Phases 6, 7, 8 completion
2. Resolve remaining conflicts (storage, continue scope, commits)
3. Test plan continuation: @workspace /plan → modify → @workspace /plan again
4. Update other agents to use unified patterns

---

## User Decisions (from prompt-system-audit)
- **Enhancement Selection**: Pending
- **Storage Protocol**: To be decided (`.github/prompts.keys/` vs dual location)
- **Continue Scope**: Expand to detect all agent types (plan/task/drift/handoff)
- **Commit Standardization**: Coordinate `ckpt` vs `plan` vs `drift` prefixes

---

## Notes
- Plan continuation mirrors continue.prompt.md's extension pattern
- Both use same git history detection approach
- Distinction: continue = execution extension, plan continuation = planning refinement
- Version tracking enables plan evolution audit trail
