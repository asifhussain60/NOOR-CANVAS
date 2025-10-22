Handoff Ask Agent — Orchestrate a Complete Copilot Prompt from a Work Request

Purpose
- Convert a freeform work request into a single, ready-to-paste Copilot prompt that orchestrates existing prompts (task, test-generation, create-plan, analyze-learning, sync, refactor, cohesion-review, healthcheck, port-instructions, commit) based on detected requirements.
- Keep questions minimal; only ask when essential. Produce concise, bulleted feedback.

Inputs (provided by user or caller)
- Work Request: The raw ask in plain language.
- Optional: key, priority, due date, branch/PR, environment(s), security/compliance notes, non-goals, testing expectations, performance/SLOs, stakeholders.

Parameters
- verbosity: concise | detailed (default: concise)
  - concise: Keep analysis and summaries tight; do not include code or pseudocode in user-facing sections.
  - detailed: Allow a dedicated appendix with examples (code snippets and pseudocode) to support the plan and routing decisions.

Key selection
- If key is provided, keep it.
- If key is not provided: attempt to map to an existing key by scanning an existing keys index (for example, a file named prompts.keys, if present). If no suitable key exists, generate a short, clear key (single token; no spaces) that captures the overall task.

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

Primary composition (task prompt)
- Construct a detailed call to the task prompt with these parameters populated from the work request and detected needs:
  - key (from Key selection)
  - title (crisp, action-oriented)
  - intent (what success looks like in 1–3 sentences)
  - scope (files/areas/systems) and explicit non-goals
  - acceptance_criteria (concise, testable bullets)
  - requirements (functional + non-functional, including performance/SLOs and security)
  - constraints (time, environment, compatibility, approvals)
  - risks_and_mitigations (bulleted)
  - deliverables (code, tests, docs, migration scripts, checkpoints)
  - implementation_notes (assumptions, interfaces, data shapes)
  - test_plan (happy path + 1–2 edge cases; frameworks/tools; coverage focus)
  - rollout_plan (migration, toggle/rollback, telemetry)
  - validation_plan (build/lint/tests; quick smoke steps)
  - next_actions (ordered checklist; smallest-possible increments)

UI/UX-specific composition fields (include when redesign/styling is in scope)
- design_system_inspiration: ["Material", "Fluent", "Tailwind best practices"]
- preserve_visual_identity: { theme: true, colors: true, typography: true }
- accessibility_targets: { wcag_level: "2.1 AA", keyboard_navigation: true, aria_roles_landmarks: true }
- responsive_breakpoints: ["mobile", "tablet", "desktop"]
- micro_interactions: { focus_states: true, hover_states: true, pressed_disabled: true, motion_reduced_support: true }
- layout_hierarchy_notes: short bullets on spacing, alignment, grouping, and information hierarchy
- figma_or_storybook_refs: links or notes if provided; otherwise infer spacing/scale from existing CSS/utilities
- ui_non_goals: call out what will not change (e.g., brand palette, logo usage)

Conditional compositions
- test-generation prompt when tests are required or impacted:
  - subject_under_test (functions/modules/endpoints/components)
  - test_types (unit/integration/e2e/visual/contract)
  - frameworks_and_tools (e.g., xUnit/NUnit/MSTest, Playwright, Percy)
  - coverage_focus (critical paths, edge cases, regressions)
  - environments_and_data (fixtures, seeds, mocks)
  - outputs (test files, locations, naming conventions)
- analyze-learning prompt when the task reveals patterns, pitfalls, or reusable practices; capture learnings and recommended updates to shared patterns.
- sync prompt for repo/environment synchronization steps when required.
- create-plan prompt for multi-step or high-risk work to break down implementation into staged, verifiable steps.
- refactor/cohesion-review prompts if the change benefits from structural improvements.
- healthcheck prompt pre/post to validate build, lint/typecheck, tests, and summarize PASS/FAIL.
- port-instructions prompt if moving logic across stacks or platforms.
- commit prompt to produce clean, conventional commit messages.

Output format (strict)
Must follow `.github/prompts/shared/output-style-mandate.md`.

1) 🧠 Copilot Analysis (concise, no code):
  - Key detected (or generated) and routing decisions (which prompts will be orchestrated)
  - Assumptions made (max 1–2)
  - Any qualifying questions created (reference file path in Workspaces/Copilot/_DOCS/temp)

2) 📌 Summary for You — BEFORE IMPLEMENTATION:
  - Work Requested (include the key)
  - Affected areas:
    - 2a Files that will be impacted (high level)
    - 2b Architecture or infrastructure changes
    - 2c Database changes
  - Plan (phased): list phases with 2–5 short tasks each
  - Recommendations for enhancements

3) 📌 Summary for You — AFTER IMPLEMENTATION (when applicable):
  - Work Requested (with key)
  - Tasks completed (use [x])
  - Next step recommendations (can be run individually, selectively, or all)
  - (See <attachments> above for file contents. You may not need to search or read the file again.)

4) Technical Appendix — Examples (only when verbosity=detailed)
  - Targeted examples that help execution: small code snippets, skeletons, and/or pseudocode
  - Keep examples minimal and directly tied to acceptance criteria, tests, or orchestration logic
  - Do not duplicate repository code; prefer illustrative fragments

Success criteria
- The final prompt is efficient, clear, and descriptive; requires minimal follow-ups.
- It reflects the user’s constraints and acceptance criteria.
- It triggers the right downstream prompts with the right parameters.
- Feedback is concise, bulleted, and skimmable.

Interface for reuse (by other prompts like create-plan)
- Caller provides: Work Request and optional key; may include any known parameters to prefer over inference.
- This Ask agent returns: the Final Copilot Prompt (as specified) and concise bulleted feedback.
- Designed to be composable and chainable; other prompts can pass their interim outputs back in as context to refine the task/test-generation parameters.

Execution guidance
- Ask clarifying questions only when absolutely required to proceed; otherwise, make 1–2 reasonable assumptions and state them briefly in the Copilot Analysis.
- Prefer existing repository conventions and tools. Respect shared guidance in prompts/shared/ when relevant.
- Keep naming consistent and short; keep bullets tight; minimize verbosity.
- Verbosity policy:
  - When verbosity=concise (default): NEVER include code or pseudocode in user-facing sections.
  - When verbosity=detailed: include examples ONLY in the "Technical Appendix — Examples" section; keep sections 1–3 free of code/pseudocode.
