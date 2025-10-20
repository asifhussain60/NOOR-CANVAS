# Handoff Protocol Update - Plan Agent Automatic Execution

**Date:** 2025-10-20  
**Status:** Updated  
**File:** `.github/prompts/plan.prompt.md`

---

## Changes Made

Updated the `plan.prompt.md` to clarify that the plan agent must **actively execute** the handoff command, not just document it.

### Key Updates

#### 1. **Step 6: MANDATORY Handoff Protocol**

**Before:**
- Step 5 said "AUTOMATICALLY initiate handoff" but didn't clarify how
- Could be interpreted as "just document the command"

**After:**
- Explicit instruction: "You must actually send this message to trigger the task agent"
- Clear execution requirement: "This is not just documentation - execute this command"

#### 2. **New Protocol Section Enhancement**

**Added Critical Execution Steps:**
```markdown
**CRITICAL EXECUTION STEPS:**
1. When user says "proceed", "begin implementation", "ready to implement", or similar
2. Plan agent writes all required files ({key}.plan.md, {key}.plan.json, work-log.md)
3. **Plan agent MUST send a new message containing the @workspace /task command**
4. This triggers the task agent to begin implementation
5. User sees: "✓ Plan finalized. Invoking task agent now..."
6. Then the @workspace /task command appears and executes automatically
```

**Added HOW TO EXECUTE section:**
```markdown
**HOW TO EXECUTE THE HANDOFF:**
After writing all files, your FINAL action must be to send a message containing:
```
@workspace /task key={key} github-branch={github-branch} debug-level=simple verbosity=concise tasks="Phase 1: {Title}\n---\nPhase 2: {Title}..."
```

**This is NOT documentation - you must actually send this command as your response to trigger the task agent.**
```

#### 3. **Common Mistakes Updated**

**New Mistakes Added:**
- ❌ **Showing handoff commands to user after "proceed" WITHOUT executing them**
- ❌ **Documenting the handoff command but not executing it**
- ❌ **Stopping after writing plan files**

**Correct Protocol:**
```
1. Write plan files ({key}.plan.md, {key}.plan.json, work-log.md)
2. Inform user: "✓ Plan finalized. Invoking task agent now..."
3. **SEND the @workspace /task command as your next response**
4. This triggers the task agent to begin implementation
```

#### 4. **Notes Section Clarified**

**Before:**
> This agent NEVER runs code. It ONLY plans, confirms, and produces handoffs.
> After producing handoffs, this agent STOPS. The user must copy and run the `/task` command.

**After:**
> This agent plans and then AUTOMATICALLY invokes the task agent.
> After writing plan files, you MUST send the @workspace /task command to trigger execution.

---

## Implementation Impact

### What This Changes

1. **Plan agent behavior:** Must actively send the @workspace /task command
2. **User experience:** No manual copy/paste required
3. **Workflow:** Plan → Approve → **Automatic execution begins**

### What This Doesn't Change

- Plan agent still doesn't modify source files directly
- Plan agent still doesn't run builds/tests directly
- Task agent still reads detailed instructions from {key}.plan.md
- All safety guardrails remain in place

---

## Testing the Update

### Scenario: User Says "Proceed"

**Expected Behavior:**

1. ✅ Plan agent writes files:
   - `.github/prompts.keys/{key}/{key}.plan.md`
   - `.github/prompts.keys/{key}/{key}.plan.json`
   - `.github/prompts.keys/{key}/work-log.md`

2. ✅ Plan agent informs user:
   > ✓ Plan finalized. Invoking task agent now...

3. ✅ **Plan agent sends command:**
   ```
   @workspace /task key=prompts github-branch=development debug-level=simple verbosity=concise tasks="Phase 1: Centralized Test Index
   ---
   Phase 2: Test Reuse in Planning
   ---
   [... remaining phases ...]"
   ```

4. ✅ Task agent receives command and begins implementation

5. ✅ User sees task agent start working on Phase 1

### Failure Modes (To Avoid)

❌ **Mistake 1:** Plan agent only documents the command but doesn't execute it
- User sees plan files created but no task agent activation
- User has to manually copy/paste the command

❌ **Mistake 2:** Plan agent shows the command to user and asks them to run it
- Defeats the purpose of automatic handoff
- Adds unnecessary friction

❌ **Mistake 3:** Plan agent stops after writing files
- Workflow breaks - nothing happens
- User confused about next steps

---

## Rationale

### Why This Update Was Needed

1. **Original Intent:** Automatic handoff was always the goal
2. **Ambiguity:** Previous wording could be interpreted as "just document it"
3. **User Friction:** Manual copy/paste defeats automation purpose
4. **Consistency:** Other agents (task, test-generation) auto-invoke when appropriate

### Design Philosophy

**Principle:** Minimize user friction while maintaining safety

- ✅ Plan agent handles handoff automatically
- ✅ User approves plan before execution begins
- ✅ Task agent validates key folder exists (safety guardrail)
- ✅ Clear status messages at each step
- ✅ No ambiguity about who does what

---

## Related Files

- `.github/prompts/plan.prompt.md` - Updated with execution protocol
- `.github/prompts/task.prompt.md` - Receives handoff, validates key folder
- `.github/prompts/test-generation.prompt.md` - Receives handoff from task agent

---

## Next Steps

1. ✅ Plan agent now executes handoff automatically
2. 🔄 Test with existing "prompts" key implementation
3. 🔄 Verify task agent receives and processes handoff correctly
4. 🔄 Document any edge cases or failure modes discovered

---

**Status:** Protocol clarified and ready for use
