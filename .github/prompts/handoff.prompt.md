Handoff — Convert Work Request → Executable Plan

## Critical Rules
1. MAX 15 bullets per response (see `.github/prompts/shared/CONCISE-MANDATE.md`)
2. 30-50 line plan draft in chat
3. Full details → `{key}.plan.md`
4. Auto-execute after 5s unless "review"/"cancel"

## Input
Work request + optional (key, priority, constraints)

## Key Strategy
- Provided OR generate short key (single token)
- Multi-task: `parent-child` (`ui-refresh-hcp`)
- Expand shortcuts via UserDictionary.md

## Routing
Classify → include prompts:
- Always: task
- Tests: test-generation  
- Architecture: create-plan, sync
- Quality: refactor, cohesion-review
- Validation: healthcheck

## Plan Structure
`{key}.plan.md` with:
- Per phase: context, @task prompt, @test-generation prompt, exit criteria
- Final: error remediation, self-review (3 max), healthcheck

## Output (STRICT)
🧠 Analysis (5 bullets):
- Key, routing, phases, assumptions

📌 Summary (10 bullets):
1. Key: {key} | Work: {line}
2. Files: {count}
3. Phases: {N}
4. Next: **A.** Execute | **B.** Review | **C.** Modify | **D.** Cancel

📊 Final:
- Status | Key | Work | Next
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

## Execution
- Auto-execute after 5s (unless "review"/"cancel")
- Sequential phases → test → 3-attempt retry → next
- NO approval needed between phases

