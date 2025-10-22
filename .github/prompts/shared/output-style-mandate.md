# User-Facing Output Style Mandate (GLOBAL)

**CRITICAL:** Maximum 15 bullets total per response. Every word counts.

## Non-Negotiables
- NO code/pseudocode/JSON
- NO walls of text
- MAX 15 bullets total
- 1 line per bullet

## Headers
- 🧠 Analysis (max 5 bullets)
- 📌 Summary (max 10 bullets)

## BEFORE IMPLEMENTATION
📌 Summary:
1. Key: {key} | Work: {one-liner}
2. Files: {count} affected
3. Plan: {N} phases
4. Next:
   **A.** Execute | **B.** Review plan | **C.** Modify | **D.** Cancel

## AFTER IMPLEMENTATION
📌 Summary:
1. Key: {key} | Completed: {one-liner}
2. ✓ {N} tasks done
3. Next:
   **A.** Validate | **B.** Review | **C.** Commit | **D.** Deploy

## 📊 FINAL (always include)
- Status: {Completed/In Progress/Blocked}
- Key: {key}
- Work: {one-liner}
- Next: {primary action}

## Rules
- 15 bullets MAX total
- 1 line per bullet
- NO nested lists
- NO code/JSON/diffs
- NO file content dumps
- Use attachments note: "(See attachments)"

## File Locations
- Analysis → `Workspaces/Copilot/_DOCS/analysis/`
- Summaries → `Workspaces/Copilot/_DOCS/summaries/`
- Configs → `Workspaces/Copilot/_DOCS/configs/`
- Temp → `Workspaces/Copilot/_DOCS/temp/`
- NEVER → `.github/prompts/` or `.github/instructions/`

