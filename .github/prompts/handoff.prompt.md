Handoff Ask Agent — Orchestrate a Complete Copilot Prompt from a Work Request

Purpose
- Convert a freeform work request into a single, ready-to-paste Copilot prompt that orchestrates existing prompts (task, test-generation, create-plan, analyze-learning, sync, refactor, cohesion-review, healthcheck, port-instructions, commit) based on detected requirements.
- Keep questions minimal; only ask when essential. Produce concise, bulleted feedback.

Inputs (provided by user or caller)
- Work Request: The raw ask in plain language.
- Optional: key, priority, due date, branch/PR, environment(s), security/compliance notes, non-goals, testing expectations, performance/SLOs, stakeholders.

Key selection
- If key is provided, keep it.
- If key is not provided: attempt to map to an existing key by scanning an existing keys index (for example, a file named prompts.keys, if present). If no suitable key exists, generate a short, clear key (single token; no spaces) that captures the overall task.
- **Multi-task key generation strategy:** When the work request affects multiple different subsystems/features/tasks, create a hierarchical key structure optimized for LLM efficiency:
  - Use parent key for overall work stream (e.g., `ui-refresh`, `perf-opt`, `db-schema-v2`)
  - Create scoped child keys for each distinct task (e.g., `ui-refresh-hcp`, `ui-refresh-scanv`, `ui-refresh-tcanv`)
  - Benefits: Better context isolation, efficient token usage, clear work stream lineage
  - Naming convention: `{parent}-{scope}` where scope is 3-8 chars, no nesting beyond 2 levels

Shortcut dictionary evaluation (MANDATORY)
- Before routing or scope detection, evaluate `.github/prompts/shared/UserDictionary.md` and expand any user-provided shortcuts (e.g., hcp, scanv, tcanv) into their canonical names and file references.
- Use expanded results to drive file loading, scope identification, and summary wording (first mention should include both shorthand and resolved name).

Detection and routing
- Classify the work request (multiple can apply):
  - Feature/Implementation
  - Bug fix/Defect
  - Tests required/updated
  - Architectural/Infrastructure/DevEx
  - Refactor/Cohesion/Quality
  - Docs/Guides/Examples
  - CI/CD/Release/Operations
- Based on the classification, include the appropriate prompts:
  - Always: task
  - If tests are required or impacted: test-generation
  - If architectural or infrastructure changes are involved: sync, analyze-learning, create-plan
  - If code quality or structure is a concern: refactor, cohesion-review
  - To pre-flight or after changes: healthcheck
  - If porting or cross-env work: port-instructions
  - If commit message is requested: commit

UI/UX redesign routing (when the request mentions redesign, layout, styling, accessibility, or component/page polish)
- Always include: create-plan (to structure phases and capture visual guidelines)
- Always include: test-generation with visual regression (Percy) and basic accessibility checks
- Consider including: refactor (if component structure or CSS organization needs improvement)
- Acceptance anchors to extract from the request/context:
  - Preserve existing theme, color scheme, and typography for visual consistency
  - Apply modern UI principles inspired by Material Design, Fluent UI, or Tailwind CSS spacing/scale best practices
  - Ensure responsive layouts (mobile/tablet/desktop) and keyboard + screen reader accessibility (WCAG 2.1 AA intent)
  - Optimize button placement, spacing, and content flow for clarity and usability
  - For full pages: improve visual balance, hierarchy, and engagement; for single components: refine proportions, states, and micro-interactions
  - Keep code maintainable and aligned with existing styles/utilities in the repo

Primary composition ({key}.plan.md)
- Create a phased execution plan at `Workspaces/Copilot/_DOCS/configs/{key}.plan.md`
- Each phase includes:
  - Implementation context (what to build)
  - Ready-to-paste prompt with @task parameters (key, title, scope, acceptance, constraints, implementation_notes, validation)
  - Ready-to-paste @test-generation prompt (subject, test_types, frameworks, coverage, retry_policy:3_attempts_max)
  - Exit criteria (build passes, tests pass, no regressions)
- Include automatic execution model:
  - **AUTOMATIC EXECUTION:** After plan creation, execution begins IMMEDIATELY unless user explicitly says "review first" or "don't execute"
  - Per phase: implement → test → validate (max 3 fix attempts) → next phase
  - Stop and report failure after 3 failed test attempts
  - No user intervention required between phases
- Final phases include:
  - Error collection and remediation phase (mandatory)
  - Self-review and validation loop (mandatory)
  - @healthcheck for comprehensive validation

UI/UX-specific composition fields (include in {key}.plan.md when redesign/styling is in scope)
- design_system_inspiration: ["Material", "Fluent", "Tailwind best practices"]
- preserve_visual_identity: { theme: true, colors: true, typography: true }
- accessibility_targets: { wcag_level: "2.1 AA", keyboard_navigation: true, aria_roles_landmarks: true }
- responsive_breakpoints: ["mobile", "tablet", "desktop"]
- micro_interactions: { focus_states: true, hover_states: true, pressed_disabled: true, motion_reduced_support: true }
- layout_hierarchy_notes: short bullets on spacing, alignment, grouping, and information hierarchy
- figma_or_storybook_refs: links or notes if provided; otherwise infer spacing/scale from existing CSS/utilities
- ui_non_goals: call out what will not change (e.g., brand palette, logo usage)

Conditional compositions (include in {key}.plan.md as needed)
- test-generation prompt embedded in each phase:
  - subject_under_test (functions/modules/endpoints/components)
  - test_types (unit/integration/e2e/visual/contract)
  - frameworks_and_tools (e.g., xUnit/NUnit/MSTest, Playwright, Percy)
  - coverage_focus (critical paths, edge cases, regressions)
  - environments_and_data (fixtures, seeds, mocks)
  - outputs (test files, locations, naming conventions)
  - retry_policy: 3_attempts_max (mandatory)
- analyze-learning prompt when the task reveals patterns, pitfalls, or reusable practices; capture learnings and recommended updates to shared patterns.
- sync prompt for repo/environment synchronization steps when required.
- create-plan prompt is replaced by direct generation of {key}.plan.md
- refactor/cohesion-review prompts if the change benefits from structural improvements.
- healthcheck prompt in final phase to validate build, lint/typecheck, tests, and summarize PASS/FAIL.
- port-instructions prompt if moving logic across stacks or platforms.
- commit prompt to produce clean, conventional commit messages after all phases complete.

Final mandatory phases (ALWAYS included)
- **Phase N-2: Error Collection and Remediation**
  - Collect all pre-existing build errors (unrelated to current work)
  - Collect all new errors introduced during implementation
  - Categorize by severity: critical (blocks functionality), high (degrades UX), medium (cosmetic), low (warnings)
  - Create remediation plan with priority order
  - Execute fixes for critical and high severity errors
  - Document medium/low severity errors for future work
  - Errors must NEVER be ignored or dismissed as "unrelated"

- **Phase N-1: Self-Review and Validation Loop**
  - After all implementation phases complete, perform comprehensive self-review:
    - Design Review: Verify implementation matches requirements and architectural patterns
    - Functionality Review: Validate all acceptance criteria met
    - Code Quality Review: Check for anti-patterns, dead code, missing error handling
    - Test Coverage Review: Ensure all critical paths have tests
    - Documentation Review: Verify work-log and inline docs are complete
  - **If any issues found:**
    - Update plan with remediation tasks
    - Re-execute affected phases with fixes
    - Repeat self-review until all requirements met
    - Maximum 3 self-review iterations (escalate to user after 3rd failure)
  - **Pass criteria:**
    - All acceptance criteria met
    - All tests passing (zero failures)
    - Build succeeds with zero errors and zero warnings
    - Code quality meets repository standards (Roslynator compliance)
    - Documentation complete and accurate

- **Phase N: Final Healthcheck and Completion**
  - Run @healthcheck scope=all to validate entire system
  - Verify no regressions introduced
  - Generate completion summary with metrics

Output format (strict)
Must follow `.github/prompts/shared/output-style-mandate.md`.

1) 🧠 Copilot Analysis (concise, no code):
  - Key detected (or generated) and routing decisions
  - Number of phases identified
  - Plan file location: `Workspaces/Copilot/_DOCS/configs/{key}.plan.md`
  - Assumptions made (max 1–2)
  - Any qualifying questions created (reference file path in Workspaces/Copilot/_DOCS/temp)

2) 📌 Summary for You — BEFORE IMPLEMENTATION:
  - Work Requested (include the key)
  - Affected areas:
    - 2a Files that will be impacted (high level)
    - 2b Architecture or infrastructure changes
    - 2c Database changes
  - Plan: X phases (brief description per phase, 1 line each)
  - Plan location: `Workspaces/Copilot/_DOCS/configs/{key}.plan.md`
  - Recommendations for enhancements

3) Execution Notice:
  - **AUTOMATIC EXECUTION ENABLED:** Implementation will begin immediately after this summary
  - To review plan first: Say "review first" or "don't execute" within 5 seconds
  - Otherwise, all phases will execute automatically with self-review loop
  - Plan location: `Workspaces/Copilot/_DOCS/configs/{key}.plan.md`
  - Execution model: Sequential phases → auto-testing → 3-attempt retry → self-review loop → final healthcheck

4) Pre-Execution Options (5-second window):
  - **Default:** Automatic execution begins in 5 seconds
  - To pause execution, respond within 5 seconds with:
    - **"review"** - Open plan file and pause execution
    - **"modify"** - Adjust plan scope or phases
    - **"cancel"** - Abort execution entirely
  - After 5 seconds with no response: Execution begins automatically

5) 📌 Summary for You — AFTER IMPLEMENTATION (when all phases complete):
  - Work Requested (with key)
  - Tasks completed (use [x])
  - Next step recommendations (can be run individually, selectively, or all)
  - **DO NOT list files updated** - changes are visible in git/attachments
  - (See <attachments> above for file contents. You may not need to search or read the file again.)

6) Next Actions (MANDATORY - always provide clear options):
  - Present 2-4 actionable next steps with outcomes
  - Format: "**What would you like to do next?**"
  - Use **letter-based selection (A, B, C, D)** for easy response
  - User can respond with: single letter, multiple letters, or "all"
  - Example format:
    ```
    **A.** Run healthcheck to validate deployment readiness
    **B.** Review implementation details in [specific files]
    **C.** Generate commit message
    **D.** Deploy to staging environment
    
    → Reply with: A, B, C, D, or combinations (e.g., "A, C" or "all")
    ```
  - **Never use checkbox format [ ]** - not easily selectable
  - Never leave user guessing about post-implementation options

7) 📊 FINAL SUMMARY (MANDATORY - always include at end):
  - Present condensed scannable summary after detailed sections
  - Format:
    - ✅ Status: [Completed/In Progress/Blocked]
    - 🎯 Key: [key-name]
    - 📝 Work: [One-line description]
    - ✓ [N] tasks completed
    - → Next: [Primary recommended action]
  - Keep to 5 lines maximum for quick scanning

Success criteria
- The handoff output is concise (fits on one screen)
- The {key}.plan.md contains all ready-to-paste prompts per phase
- User can execute the entire plan by saying "proceed" with no manual intervention between phases
- Each phase has clear exit criteria and 3-attempt retry logic for tests
- Feedback is concise, bulleted, and skimmable

Interface for reuse (by other prompts)
- Caller provides: Work Request and optional key; may include any known parameters to prefer over inference.
- This Ask agent returns: Concise handoff summary + {key}.plan.md file created
- Designed to be composable; the plan file becomes the execution document

Execution guidance
- Ask clarifying questions only when absolutely required to proceed; otherwise, make 1–2 reasonable assumptions and state them briefly in the Copilot Analysis.
- Create the {key}.plan.md file immediately with all phases and ready-to-paste prompts.
- Prefer existing repository conventions and tools. Respect shared guidance in prompts/shared/ when relevant.
- Keep handoff output concise (1 screen); all detail goes in the plan file.
- Each phase in the plan must include: implementation context, @task prompt, @test-generation prompt, exit criteria, and retry_policy:3_attempts_max.
- Plan file must include automatic execution model and failure handling instructions.
- Keep naming consistent and short; keep bullets tight; minimize verbosity in handoff output.
- **NEVER ask user to "proceed" or wait for approval** - execution is automatic unless explicitly halted.
- Always include error collection phase, self-review loop, and final healthcheck as last 3 phases.
- Self-review loop continues until all requirements met or 3 iterations exhausted.
