# KDS Quick Start Guide
**Version:** 1.0.0 | **Read Time:** 5 minutes | **For:** New Contributors

---

## 🎯 Purpose

Fast-track guide to the KDS (Knowledge Distribution System) governance framework. Master the essentials in 5 minutes, then dive deeper as needed.

**Full Documentation:** [kds-rulebook.md](kds-rulebook.md) (comprehensive 1,492-line reference)

---

## 🏛️ 5 Core Principles (Know These First)

### 1️⃣ **Governance First**
All `.github` changes must go through the KDS gatekeeper.

**How:** Use `@workspace /kds request="[your change]"` before modifying any `.github` file  
**Why:** Prevents rule conflicts and maintains architectural coherence

---

### 2️⃣ **Document First**
Update KDS files BEFORE code changes. Documentation commits precede implementation.

**How:** Update plan.md → work-log.md → handoff JSONs → then code  
**Why:** Knowledge preserved even if session fails mid-implementation

---

### 3️⃣ **Honest Handoffs**
Agents cannot execute other agents. All handoffs require explicit user invocation.

**How:** Agent creates JSON file + displays "Next Command" + HALTS  
**Why:** Maintains transparency, user control, and debuggability

---

### 4️⃣ **Test-Driven**
Create tests FIRST before implementation (red-green-refactor).

**How:** Phase structure: Test (red) → Implement (green) → Validate (refactor)  
**Why:** Validates acceptance criteria upfront, prevents scope creep

---

### 5️⃣ **Holistic Regeneration**
When updating plans or major docs, DELETE entire file and RECREATE from scratch.

**How:** `Delete kds.plan.md` → `Create new kds.plan.md with all phases`  
**Why:** Prevents duplicate sections and conflicting instructions

---

## 🔴 3 Critical Rules (Never Violate)

### ❌ Rule #1: No Code in User-Facing Output

**Never include:**
- Code blocks in chat responses (`\`\`\`markdown`, `\`\`\`csharp`, etc.)
- Pseudocode in user-facing sections (`FUNCTION`, `IF...THEN`, `FOR EACH`)
- Terminal commands as examples (only architectural descriptions)

**Always use:**
- Prose descriptions of workflows
- Architectural explanations
- Bullet-point instructions (max 3 lines per bullet)

**Example:**

✅ **Correct:**
```
The plan agent generates a multi-phase implementation strategy, creates handoff JSONs for each task, and displays the next command for user invocation.
```

❌ **Incorrect:**
```markdown
@workspace /plan generates:
\`\`\`json
{
  "key": "feature",
  "phase": 1
}
\`\`\`
```

---

### ⚠️ Rule #2: Step -1 in All Prompts

**Every prompt** (except kds.prompt.md) must include Step -1 enforcement gate.

**What it does:**
- Detects `.github` modification requests
- Halts execution immediately
- Redirects to `@workspace /kds` for governance review

**Where:** At the top of every `.github/prompts/*.prompt.md` file (after frontmatter)

**Pre-commit hook validates:** All prompts have Step -1 (automatic check)

---

### 🛡️ Rule #3: All .github Changes Through kds.prompt.md

**Never modify directly:**
- `.github/prompts/*.md`
- `.github/instructions/*.md`
- `.github/key-data-streams/` structure
- `MANDATORY.md` rules

**Always route through:** `@workspace /kds request="[change description]"`

**What happens:**
1. kds.prompt.md loads context (MANDATORY.md, handoff protocol, existing plans)
2. Analyzes compatibility (conflict detection, regression prevention)
3. Generates approval/rejection report
4. Creates implementation handoff JSON (if approved)
5. User executes handoff manually

---

## 📋 When to Read Full Rulebook

You've mastered the basics! Dive deeper when you need to:

| Your Task | Read Section | Rule # |
|-----------|-------------|--------|
| Creating new prompts | Handoff Protocol Standards | #4, #12 |
| Multi-phase plans | Agentic Execution Rules | #6, #9 |
| Test generation | TDD Workflow | #5, #7 |
| System cleanup | kds.prompt.md Review Mode | N/A |
| Debugging governance | Enforcement Mechanisms | #10 |
| Understanding E2E mode | Auto-Chain Defaults | #6 |

**Full Rulebook:** [kds-rulebook.md](kds-rulebook.md)  
**Detailed Rules:** [kds-rulebook-detailed/](kds-rulebook-detailed/) (individual rule files)

---

## 🚀 Quick Start Workflow

### New Feature Development

1. **Route Request:**  
   `@workspace /route plan key=my-feature [description]`

2. **Review Plan:**  
   Agent creates `my-feature.plan.md` with phases and tasks

3. **Execute Phase 1:**  
   `@workspace /test-generation #file:handoffs/phase-1-test.json`

4. **Implement Task:**  
   `@workspace /todo #file:handoffs/phase-1-todo-1.json`

5. **Validate:**  
   Run generated test, verify acceptance criteria

6. **Next Phase:**  
   Repeat steps 3-5 for remaining phases

---

### Modifying .github Files

1. **Request Change:**  
   `@workspace /kds request="Update plan.prompt.md to skip file verification"`

2. **Review Analysis:**  
   kds.prompt.md checks compatibility, generates approval/rejection report

3. **If Approved:**  
   Execute implementation handoff: `@workspace /todo #file:handoffs/[change].json`

4. **If Rejected:**  
   Review conflict report, choose alternative approach

---

## 🔍 Common Questions

**Q: What if I accidentally modify .github without using /kds?**  
A: Pre-commit hook will catch it and reject the commit. Fix violations, then commit again.

**Q: Can I skip tests for small changes?**  
A: No. TDD is mandatory (Rule #5). Every task needs a test created FIRST.

**Q: What's the difference between todo and task?**  
A: `todo` = single task execution | `task` = multi-task batch execution

**Q: How do I find existing tests to reuse?**  
A: Check `.github/tests/playwright-index.json` (central test registry)

**Q: When should I use E2E mode vs. manual phase approval?**  
A: E2E for uninterrupted multi-phase work (experienced users). Manual for careful review (new features).

---

## ⚡ Pro Tips

1. **Always display active key** - Include `Key: \`keyname\`` in all user-facing output
2. **Use letter-based options** - A, B, C, D (not checkboxes, not numbers)
3. **Prefer headless tests** - Only use `--headed` for UI/visual validation
4. **New chat per phase** - Better performance when autoChain=false
5. **Check compliance report** - `.github/key-data-streams/kds/compliance-report.md` for known violations

---

## 📚 Related Resources

- **[kds-rulebook.md](kds-rulebook.md)** - Comprehensive 13-rule reference
- **[kds-handoff-protocol.md](../prompts/shared/kds-handoff-protocol.md)** - JSON schemas and workflows
- **[MANDATORY.md](../MANDATORY.md)** - Global operating rules (3 absolute rules)
- **[SelfAwareness.instructions.md](../instructions/SelfAwareness.instructions.md)** - Operating guardrails

---

## 🎓 Onboarding Checklist

- [ ] Read 5 Core Principles (above)
- [ ] Memorize 3 Critical Rules (above)
- [ ] Try Quick Start Workflow with test feature
- [ ] Review compliance report to see violations in action
- [ ] Bookmark kds-rulebook.md for deep dives
- [ ] Join first KDS governance review via `@workspace /kds`

**Estimated Time:** 5-10 minutes  
**Next Steps:** Start with Quick Start Workflow, refer to full rulebook as needed

---

**Last Updated:** 2025-10-31  
**Version:** 1.0.0  
**Feedback:** Report issues via `@workspace /kds request="Quick guide improvement: [suggestion]"`
