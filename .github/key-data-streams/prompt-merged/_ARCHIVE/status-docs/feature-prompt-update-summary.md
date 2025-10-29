# feature.prompt.md Update Summary

**Date**: 2025-10-21  
**Change**: Iterative Plan Refinement with [P]roceed / [C]hange Protocol

---

## What Changed

### Added: Step 2.5 - Plan Refinement Loop (MANDATORY)

**New Protocol**: After presenting any plan draft, agent MUST end with:

```markdown
---

## 📋 Plan Review Options

**[P] PROCEED** - Plan approved, ready to finalize and begin implementation
- User says: "p", "P", "proceed", "continue", "yes", "approved", "looks good"
- Action: Finalize plan, write files, begin Phase 1

**[C] CHANGE PLAN** - Request modifications to the plan
- User says: "change: {description of change}"
- Examples:
  * "change: add a phase for user authentication"
  * "change: remove Phase 3, merge it with Phase 2"
  * "change: include enhancement A and B only"
  * "change: add Percy visual testing to all phases"
- Action: Apply change, show updated Plan Draft v{N+1}, return to review

**[Q] CLARIFY** - Ask questions about the plan
- User asks: "why {X}?", "what does {Y} mean?", "how will {Z} work?"
- Action: Provide detailed explanation, return to review options

---

**Your choice?** [P]roceed / [C]hange / [Q]uestion
```

---

## Benefits

### For Users
- ✅ **Full Control**: Can request unlimited changes before proceeding
- ✅ **Clear Semantics**: No ambiguity about approval (must say [P]roceed)
- ✅ **Iterative Refinement**: Modify plan until satisfied
- ✅ **Version Tracking**: Each change increments version (v1.0 → v1.1 → v1.2)
- ✅ **No Premature Execution**: Plan never finalizes without explicit [P]roceed

### For Agents
- ✅ **Clear Exit Condition**: Only exit loop when user says [P]roceed
- ✅ **Structured Changes**: Parse "change: {description}" format
- ✅ **Version History**: Track plan evolution through versions
- ✅ **No Assumptions**: Don't guess if user is satisfied, wait for [P]roceed

---

## Workflow Examples

### Example 1: Single Refinement

```
Agent: [Presents Plan Draft v1.0]
       [P]roceed / [C]hange / [Q]uestion

User: "change: add authentication phase"

Agent: 🔄 Updated: Added Phase 1 (Authentication), renumbered phases
       [Presents Plan Draft v1.1]
       [P]roceed / [C]hange / [Q]uestion

User: "proceed"

Agent: ✓ Plan finalized (v1.1)
       Writing files...
       Beginning Phase 1...
```

### Example 2: Multiple Refinements

```
Agent: [Presents Plan Draft v1.0]
       [P]roceed / [C]hange / [Q]uestion

User: "change: remove all enhancements"

Agent: 🔄 Updated: Removed enhancements A, B, C
       [Presents Plan Draft v1.1]
       [P]roceed / [C]hange / [Q]uestion

User: "change: combine Phase 2 and 3"

Agent: 🔄 Updated: Merged Phase 2 and 3 into single phase
       [Presents Plan Draft v1.2]
       [P]roceed / [C]hange / [Q]uestion

User: "change: add Percy testing to Phase 4"

Agent: 🔄 Updated: Added Percy visual testing to Phase 4
       [Presents Plan Draft v1.3]
       [P]roceed / [C]hange / [Q]uestion

User: "p"

Agent: ✓ Plan finalized (v1.3)
       Writing files...
       Beginning Phase 1...
```

### Example 3: Clarification Questions

```
Agent: [Presents Plan Draft v1.0]
       [P]roceed / [C]hange / [Q]uestion

User: "why is Phase 3 needed?"

Agent: Phase 3 (Frontend Routing) is necessary because...
       [Detailed explanation]
       
       [Presents Plan Draft v1.0] (same version)
       [P]roceed / [C]hange / [Q]uestion

User: "what does enhancement B do?"

Agent: Enhancement B (Flakiness Detection) runs each test 3 times...
       [Detailed explanation]
       
       [Presents Plan Draft v1.0] (same version)
       [P]roceed / [C]hange / [Q]uestion

User: "proceed"

Agent: ✓ Plan finalized (v1.0)
       Writing files...
       Beginning Phase 1...
```

---

## Implementation Rules

### Agent Must:
1. ✅ **Always show options** after every plan draft
2. ✅ **Parse "change:" format** correctly
3. ✅ **Increment version** on every change (v1.0 → v1.1)
4. ✅ **Highlight changes** with "🔄 Updated: {what changed}"
5. ✅ **Keep version same** for clarification questions ([Q])
6. ✅ **Only exit on [P]roceed** - never assume satisfaction

### Agent Must NOT:
1. ❌ **Assume approval** from vague responses
2. ❌ **Skip options** after presenting draft
3. ❌ **Proceed without explicit [P]roceed**
4. ❌ **Dump full plan** in chat (still 30-50 line limit)
5. ❌ **Ignore change requests**

---

## Updated Step References

### Step 2: Iterative Refinement
- Now includes instruction to loop until user satisfied
- References Step 2.5 for the actual loop protocol

### Step 2.5: Plan Refinement Loop (NEW)
- Complete protocol for [P]roceed / [C]hange / [Q]uestion
- Iteration examples
- Version tracking rules
- Change request parsing

### Step 3: Enhancement Selection
- Now integrated into Step 2.5 refinement loop
- User can request "change: include enhancement A"

### Step 5: Refinement Loop Exit
- Only triggered by [P]roceed
- Lists all recognized proceed phrases

### Step 6: Handoff Protocol
- Updated to say "after exiting Step 2.5 refinement loop"
- Clarifies that [P]roceed is the trigger

---

## Recognized Proceed Phrases

User can say any of:
- "p"
- "P"
- "proceed"
- "continue"
- "yes"
- "approved"
- "looks good"
- "ready to implement"
- "begin implementation"
- "ready"

---

## Change Request Format

User must use format: `"change: {description}"`

**Valid Examples**:
- "change: add authentication phase"
- "change: remove Phase 3"
- "change: combine Phase 2 and 3"
- "change: include enhancement A and B only"
- "change: add Percy testing to all phases"
- "change: remove all enhancements"

**Invalid Examples** (agent should prompt for clarification):
- "can you add authentication?" (not using "change:" format)
- "I think we need Percy" (not using "change:" format)
- "what about adding Phase X" (question, not change request)

**If user provides unclear request, agent should say:**
```
Please use format: "change: {description of what to change}"

Example: "change: add authentication phase before Phase 1"
```

---

## Testing the Update

To verify this works correctly:

1. **Test [P]roceed**: Say "proceed" after first draft
   - Expected: Agent finalizes immediately

2. **Test [C]hange**: Say "change: add Phase X"
   - Expected: Agent shows v1.1 with change, returns to options

3. **Test Multiple Changes**: Request 3+ changes before proceeding
   - Expected: Version increments each time (v1.0 → v1.1 → v1.2 → v1.3)

4. **Test [Q]uestion**: Ask "why Phase 2?"
   - Expected: Agent explains, shows same version, returns to options

5. **Test Premature Finalization**: Say "looks interesting" (not "proceed")
   - Expected: Agent does NOT finalize, waits for explicit [P]roceed

---

## Files Modified

- `.github/prompts/feature.prompt.md` (updated with Step 2.5 protocol)

---

**Status**: ✅ Update complete, ready to use in planning sessions
