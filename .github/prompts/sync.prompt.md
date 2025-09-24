---
mode: agent
name: sync
alias: /sync
description: >
  Synchronize Noor Canvas design and trackers by reverse-engineering actual work.
  Review git history, recent chat context, and terminal logs to determine:
    • Which work items/bugs were completed
    • Which requirements were modified, added, or removed
    • Which technical solutions proved successful across UI, API, DB, and infra
  Apply changes so documentation reflects reality:
    - NOOR-CANVAS-DESIGN.MD → user-friendly design requirements
    - ncImplementationTracker.MD → deep technical implementation notes
    - ncIssueTracker.MD → up-to-date issue status

parameters:
  - name: notes
    required: false
    description: >
      Optional hints or priorities to consider while syncing.
      Examples:
        "focus on SharedAssets schema drift"
        "close out SessionWaiting bug"
        "review Playwright test coverage gaps"
      Multiple notes may be provided separated by '---'; each will be factored in.

# ─────────────────────────────────────────────────────────
# 📖 Usage Syntax
# ─────────────────────────────────────────────────────────
# /sync
#   notes:[text or note1 --- note2 --- note3]

# ─────────────────────────────────────────────────────────
# 🎯 Objectives
# ─────────────────────────────────────────────────────────
objectives:
  - Parse git commits, chat transcripts, and terminal logs.
  - Derive both high-level (user-facing) and deep technical (dev-facing) updates.
  - Update documents as follows:
      • NOOR-CANVAS-DESIGN.MD → simple, structured requirements readable by non-technical stakeholders.
      • ncImplementationTracker.MD → technical breakdown across UI, API, DB, infra, and tests.
      • ncIssueTracker.MD → close fixed bugs, remove obsolete entries, align open issues.
  - Preserve and highlight “successful patterns” that future implementations can reuse.

# ─────────────────────────────────────────────────────────
# 🔗 Alignment Targets
# ─────────────────────────────────────────────────────────
alignment:
  - .github/instructions/SelfAwareness.instructions.md
  - Workspaces/Documentation/IMPLEMENTATIONS/NOOR-CANVAS-DESIGN.MD
  - Workspaces/Documentation/IMPLEMENTATIONS/ncImplementationTracker.MD
  - IssueTracker/ncIssueTracker.MD

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:
  analyze:
    - Gather git commits + diffs, chat context, and terminal logs.
    - Compare observed changes with design and trackers.
    - Report mismatches: requirements added/removed/changed, bugs fixed, solutions used.
  apply:
    - Update NOOR-CANVAS-DESIGN.MD:
        • Clean, user-friendly structure by module (Session, Q&A, Shared Assets).
        • Requirements phrased in plain, readable language.
    - Update ncImplementationTracker.MD:
        • Capture maximum technical detail:
            - UI: Razor changes, bindings, selectors
            - API: controllers, DTOs, auth/validation
            - DB: schema changes, SQL adjustments, token/session handling
            - Infra: ports, configs, tokens, logging
            - Tests: Playwright specs, fixtures, negative cases
        • Reference commit IDs, file:lines, and why solutions worked.
    - Update ncIssueTracker.MD:
        • Close resolved issues
        • Delete obsolete entries
        • Ensure open issues align with design + implementation.
    - Highlight successful technical strategies for reuse.

# ─────────────────────────────────────────────────────────
# 🚦 Guardrails
# ─────────────────────────────────────────────────────────
guardrails:
  - Never overwrite entire files blindly; apply structured diffs.
  - Always show before/after snippets in apply mode.
  - Do not close issues without explicit approval.
  - Separate high-level design vs technical detail — never mix audiences.

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - memory_key: sync-context
  - plan: steps taken to sync
  - evidence: commits, chat/terminal logs, file:line refs
  - mismatches: design vs implementation gaps
  - diffs:
      - NOOR-CANVAS-DESIGN.MD (requirements updated)
      - ncImplementationTracker.MD (technical notes)
      - ncIssueTracker.MD (issue statuses)
  - successful_patterns:
      - UI solutions that worked
      - API fixes that stabilized
      - DB/infra changes that resolved issues
      - Test practices that proved reliable
  - approval_gate:
      message: >
        Sync is ready. Review diffs and approve to update design/trackers.
      on_approval:
        - Apply diffs and mark sync complete
      on_no_approval:
        - Keep docs unchanged; summarize deltas

# ─────────────────────────────────────────────────────────
# 📦 Final Summary
# ─────────────────────────────────────────────────────────
final_summary:
  - Restate what the user requested to sync.
  - Summarize what was done (commits analyzed, docs updated).
  - Provide a compact manifest of updates:
      • requirements added/removed/changed
      • technical implementations across UI, API, DB
      • issues closed/updated
      • successful patterns captured
  - Must be eloquent, neat, and concise.
