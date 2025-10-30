# User-Facing Output Style Mandate (GLOBAL)

> **⚠️ DEPRECATED (2025-10-30)**: This file has been superseded by `.github/MANDATORY.md`  
> **Action Required**: All prompts should load `.github/MANDATORY.md` instead  
> **Reason**: Consolidated mandate files into single source of truth  
> **Migration**: Content merged into MANDATORY.md Rule 1 (No Code in Chat)  
> **This file retained for reference only - DO NOT UPDATE**

**Superseded by:** `.github/MANDATORY.md` Rule 1

---

**CRITICAL:** Maximum 15 bullets total per response. Every word counts.

## Non-Negotiables
- NO executable code blocks (see `.github/prompts/shared/snippet-handling-policy.md` for complete policy)
- Pseudocode/algorithmic descriptions ALLOWED (for clarity)
- NO walls of text
- MAX 15 bullets total
- 1 line per bullet

## Plan Drafts (Special Case)
- **Chat drafts**: Maximum 100 lines (up from 30-50 for complex plans)
- **Pseudocode preferred**: Use algorithmic/pseudocode style instead of full code
- **Full details**: Always go to `{key}.plan.md` files, never dumped in chat
- **Balance**: More detail allowed in drafts, but still concise vs 2000+ line dumps

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

## 📋 NEXT STEPS (always include after implementation)

**Current Key**: `{key}`

**Run Tests:**
```
# All tests for this key
.github/key-data-streams/{key}/tests/run-all-tests.ps1

# Phase-specific tests
.github/key-data-streams/{key}/tests/run-phase-{N}-tests.ps1
```

**Continue This Work:**
```
@workspace /todo {additional-work-description}
(Auto-detects {key} from git history)
```

**Modify Plan:**
```
@workspace /plan {modification-description}
(Auto-detects {key}, updates plan version)
```

**Mark Complete:**
```
@workspace /task key:{key} tasks="mark complete"
```

**Start New Work:**
```
@workspace /plan key:{new-key} {new-work-description}
```

## Test Registry Reference

**Every key maintains test registry** at `.github/key-data-streams/{key}/tests/test-registry.md`

**Test Registry Structure:**
- Phase-organized test suites
- Real-time test execution status
- Pass/fail tracking with timestamps
- Commands for selective test execution
- Test coverage checklist

**Integration Points:**
- plan.prompt.md creates test registry structure
- test-generation.prompt.md updates registry when creating tests
- task.prompt.md reads registry for phase validation (auto-chain mode)
- healthcheck.prompt.md uses registry for comprehensive test suites

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

## Commit Checkpoints
Execution agents (handoff/task) create git commits after each phase.
See: `commit-checkpoint-protocol.md` for PowerShell snippet and format.

