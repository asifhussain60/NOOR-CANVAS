# ask.prompt.md - Examples Reference

This file contains bash command example extracted from `ask.prompt.md` for Rule #1 compliance (no code blocks in user-facing sections).

---

## Command 1: Ask Invocation with Test Validation (Bash)

**Source:** Parameters section - -test flag examples

**Purpose:** Ask questions with post-execution validation enabled

```bash
@workspace /ask -test "How does SignalR broadcasting work?" context="SessionCanvas.razor"
@workspace /ask -test question="Why is the share button missing?"
```

**Usage Context:**
- `-test` flag: Enable prompt-test-validation-framework.md
- `context=`: Provide file/component context for targeted answers
- `question=`: Named parameter (alternative to positional)

**Validation Checks (when -test enabled):**
- ✓ Routed to internal/comm/question.prompt.md
- ✓ Next actions presented (What would you like to do next?)
- ✓ Letter-based action options (A, B, C, D) included
- ✓ Handoff option to plan.prompt.md offered
- ✓ Answer is concise and bulleted (no code unless requested)
- ✓ Output format compliance (🧠/📌 structure)

**References:**
- Validation Framework: `.github/prompts/shared/prompt-test-validation-framework.md`
- Ask Execution: ask.prompt.md Execution section
- Output Format: `.github/MANDATORY.md` Rule #1

---
