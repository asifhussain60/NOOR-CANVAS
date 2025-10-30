# Handoff Protocol Algorithm

**Purpose:** Standardized handoff from planning to execution agents

**Used by:** plan.prompt.md (Step 2.5), route.prompt.md (Step 7)

---

## Algorithm

**Input:** plan, target_agent, key, context

**Output:** handoff_invocation (formatted command)

---

## Handoff Targets

**1. task.prompt.md (Standard Execution)**
- When: Plan complete, ready to execute
- Package: phases[], files[], tests[], key
- Behavior: Sequential execution with checkpoints

**2. todo.prompt.md (Extension)**
- When: Adding to existing work
- Package: new_task, current_key, context
- Behavior: Append to existing plan

**3. test-generation.prompt.md (Test Creation)**
- When: Generate tests from plan
- Package: test_scenarios[], key, percy_points[]
- Behavior: Create .spec.ts files

**4. healthcheck.prompt.md (Validation)**
- When: Post-implementation validation
- Package: key, validation_scope[]
- Behavior: Verify all requirements met

---

## Handoff Package Construction

**Essential elements:**
- Target agent name
- Key (workflow identifier)
- Work summary (1-liner)
- Phase breakdown (if applicable)
- File list
- Context preservation

**Optional elements:**
- Test requirements
- Rollback strategy
- Constraints
- Dependencies

---

## Handoff Message Format

```markdown
## 🚀 Handoff to {target}

**Target:** .github/prompts/{target}.prompt.md
**Key:** {key}
**Work:** {one-liner}
**Phases:** {count}
**Files:** {count}

**Transitioning control...**

---

{BEGIN TARGET AGENT EXECUTION}
```

---

## State Preservation

**What to preserve:**
- Original user request
- Analyzed requirements
- Generated plan
- File context
- Visual context (mockups)
- Error context (stack traces)
- Assumptions made
- Open questions

**How to preserve:**
- Save to key data stream folder
- Include in handoff parameters
- Attach files/images
- Reference in plan document

---

## Approval Workflow

**Auto-approved handoffs:**
- plan → task (standard flow)
- plan → test-generation (test creation)
- ask → plan (question answered)

**Require user approval:**
- plan → Multiple agents (parallel work)
- Handoff with warnings
- Breaking changes present
- Data migration involved

---

## Handoff Validation

**Before handoff:**
- ✓ Plan complete
- ✓ Key assigned
- ✓ Target agent valid
- ✓ Required parameters present
- ✓ Context packaged
- ✓ Approval obtained (if needed)

**After handoff:**
- Log handoff in work-log.md
- Update key data stream status
- Clear planning state
- Target agent takes control

---

## Error Handling

**Handoff fails if:**
- Invalid target agent
- Missing required parameters
- Plan incomplete
- Key collision
- User rejects approval

**Recovery:**
- Return to planning
- Fix issues
- Retry handoff
- Or cancel workflow

---

## See Also

- `../plan.prompt.md` - Step 2.5 implementation
- `../route.prompt.md` - Step 7 implementation
- `agent-handoff-protocol.md` - General handoff rules
- `loop-prevention.md` - Prevent handoff loops
