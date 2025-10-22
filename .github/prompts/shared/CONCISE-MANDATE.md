# CONCISE OUTPUT MANDATE (GLOBAL)

**ALL prompts MUST follow this. NO exceptions.**

## Hard Limits
- MAX 15 bullets total per response
- MAX 1 line per bullet
- NO code/pseudocode/JSON in chat
- NO nested lists
- NO paragraphs

## Response Structure

```
🧠 Analysis (≤5 bullets)
- Key: {key}
- Routing: {prompts-used}
- Phases: {count}
- Assumptions: {1-2 max}

📌 Summary (≤10 bullets)
1. Key: {key} | Work: {one-liner}
2. Files: {count}
3. {phase-bullets}
4. Next: **A.** {action} | **B.** {action} | **C.** {action}

📊 Final
- Status: {status}
- Key: {key}
- Next: {primary-action}
```

## Letter-Based Actions
Always provide 2-4 options:
- **A.** Execute
- **B.** Review
- **C.** Modify
- **D.** Cancel

User replies: "A", "A, C", or "all"

## File Locations
All output → `Workspaces/Copilot/_DOCS/`
NEVER → `.github/prompts/`

## Commit Checkpoints (Execution Agents Only)
handoff/task agents MUST commit after each phase.
See: `commit-checkpoint-protocol.md`

## Enforcement
Count bullets before responding.
If > 15 → You're doing it wrong.
