---
mode: agent
---
title: issuetracker-migration — One-Time Tracker Migration Agent
version: 1.0.0
appliesTo: /issuetracker-migration
updated: 2025-09-27
---

# /issuetracker-migration — One-Time Tracker Migration Agent (v1.0.0)

Consumes legacy tracker archives (e.g., `IssueTracker.zip`) and permanently restructures relevant information into the canonical Copilot `{key}` format. This is a one-time migration; after completion the original tracker files may be deleted.

## Scope
- Input: `IssueTracker.zip` containing historical issue tracker files
- Output: normalized key-based directories under `Workspaces/Copilot/prompts.keys/{key}/`

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.md`
- Legacy tracker archive (`IssueTracker.zip`)
- Existing Copilot repo structure

## Outputs (write)
For each identified `{key}`:
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Requirements-{key}.md`  
  → Acceptance criteria, goals, constraints
- `Workspaces/Copilot/prompts.keys/{key}/workitem/SelfReview-{key}.md`  
  → Design notes, rationale, decisions
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Cleanup-{key}.md`  
  → TODOs, obsolete files, cleanup instructions
- `Workspaces/Copilot/prompts.keys/{key}/tests/`  
  → Playwright spec stubs or extracted test cases

## Migration Protocol
1. Parse tracker entries:
   - Extract IDs, titles, descriptions, comments, acceptance criteria
   - Map related entries into a unified `{key}`
2. Normalize under canonical structure:
   - Requirements → `Requirements-{key}.md`
   - Design/rationale → `SelfReview-{key}.md`
   - Cleanup notes → `Cleanup-{key}.md`
   - Test cases/specs → `tests/`
3. Link requirements to associated tests
4. Identify missing coverage (requirements with no test, or test with no requirement)
5. Validate migration by running:
   - `dotnet build --no-restore --warnaserror`
   - `npm run lint`
   - `npm run format:check`
   - Cumulative Playwright suite

## Debug Logging Rules
- Marker: [DEBUG-WORKITEM:{key}:issuetracker-migration:{RUN_ID}] message ;CLEANUP_OK
- Respect `none`, `simple`, `trace` modes

## Terminal Evidence
- Capture 10–20 lines from `#getTerminalOutput` showing analyzer/linter/test status
- Include evidence in summary

## Outputs
Migration summary must include:
- Keys created/updated
- Requirements extracted
- SelfReviews generated
- Cleanup notes created
- Tests linked/added
- Analyzer/linter/test results
- Terminal Evidence tail

## Approval Workflow
- Do not commit until analyzers, lints, and tests are green
- Present structured summary of `{key}` migrations
- After confirmation, mark `/issuetracker-migration` complete and original tracker files may be deleted
