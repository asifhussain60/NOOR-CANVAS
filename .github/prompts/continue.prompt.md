mode: agent
name: continue
alias: /continue
description: >
  Recover context from chat/thread history, #Workspaces, #terminalLastCommand, and #getTerminalOutput.
  If drift is detected, stop, reconcile, and continue with the next **minimal** step.
  Enforces iterative fix + test loop using Playwright.

parameters:
  - name: key
    required: false
  - name: notes
    required: false

usage:
  prerequisites:
    - **Never** run via `dotnet run` or `cd …; dotnet run`.
- Use only:
    • `.\Workspaces\Global
c.ps1`  # launch only
    • `.\Workspaces\Global
cb.ps1` # clean, build, and launch
    - Keep per-key state intact under NOOR CANVAS\Workspaces\Copilot\
  run_examples:
    - /continue
    - /continue key:NC-145
    - /continue key:hostcanvas notes:"phase 1 only --- headed"

context_boot:
  resolve_key_and_scope:
    - Use provided key or autodetect from chat/state/logs.
    - Read #terminalLastCommand and #getTerminalOutput to determine actual app/test status.
  apply_notes:
    - Record notes; use '---' as hard separators.
  confirm_state:
    - Load per-key state and last checkpoint.
  context_index:
    - Prefer index files for planning; delta-update after run.

objectives:
  - Resolve key and last step; honor notes.
  - Produce a next minimal step aligned to Requirements-{key}.MD.
  - Apply iteratively with tests; update state/docs.

iterative_fix_and_test:
  rules:
    - Make **one change at a time**, then run tests.
    - After fixing the first issue, rerun that test + the new one; keep accumulating until all green.
    - Use `[DEBUG-WORKITEM:{key}:{layer}]` logs (safe to remove via /cleanup).
    - Dedicated stabilization key supported: **hostcanvas**.


methods:
  detect:
    - Rank candidate keys via state timestamps, terminal evidence, and chat.
  reconcile:
    - Compare checkpoint vs plan; write plan-v{n}.json.
  apply:
    - Run `.\Workspaces\Global
cb.ps1` if needed, else `.\Workspaces\Global
c.ps1`.
    - Execute the iterative loop; insert cleanup-safe debug logs.
    - Append Worklog entries.
  correct_direction:
    - If wrong, revert/stash, then proceed with the minimal correct step.

watchdog:
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1


alignment:
  - .github/instructions/SelfAwareness.instructions.md
  - Requirements-{key}.MD
  - .github/prompts/workitem.prompt.md
  - .github/prompts/pwtest.prompt.md
  - Cleanup-<key>.MD
  - .github/Workitem-{key}.MD
  - .github/Test-{key}.MD

guardrails:
  - Use scripts only; never dotnet run.
  - Structured diffs only; Requirements-{key}.MD authoritative.
  - Enforce Playwright folder/config alignment.

output:
  - detected: { key, rationale, last_checkpoint, notes_applied: [] }
  - next_minimal_step_plan
  - diffs
  - updated_docs
  - artifacts
  - watchdog_events
  - approval_gate

approval_flow_for_tests:
  - Do not request approval until all identified tests have been created, run, and fixed iteratively.
  - After final green suite, request user to manually run tests once.
  - Only then ask for approval to mark the work/test complete.
