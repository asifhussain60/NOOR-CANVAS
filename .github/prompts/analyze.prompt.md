--- 
mode: agent
name: analyze
alias: /analyze
description: >
  Perform a systematic architecture review of specified Noor Canvas artifacts (views, controllers, DTOs, SQL).
  Always align with NOOR-CANVAS-DESIGN.MD and ncImplementationTracker.MD. 
  Extract use cases, trace end-to-end flows, validate naming consistency, and highlight risks before implementation.

parameters:
  - name: targets
    description: >
      List of artifacts to examine (#file: paths, globs, dirs).
      Examples:
        #file:UserLanding.razor
        /src/Server/Controllers
        screenshots/landing/*.png
    required: true
  - name: notes
    description: >
      Optional free-text notes to guide focus areas (e.g., "check async lifecycle methods").
    required: false

# ───────────────────────────
# 📖 Usage Examples
# ───────────────────────────
# /analyze targets:"#file:UserLanding.razor, /src/Server/Controllers" notes:"check DTO casing issues"
# /analyze targets:"/src/Database" notes:"trace FK mismatches"
# ───────────────────────────

# 🎯 Deliverables
1. **Executive Summary** — top findings & risks.
2. **Narrative** — plain-English analysis + recommendations.
3. **TODO Inventory** — checklist of all distinct user flows.
4. **Trace Table** — View → Route → API → DTO → SQL (with refs).
5. **Validation Matrix** — camelCase vs PascalCase, typing, consistency.
6. **Mismatches & Gaps** — missing links/inconsistencies.
7. **Risks & Unknowns** — unresolved issues, assumptions.
8. **Deferred Plan** — outline changes, but don’t implement.
9. **Approval Gate** — end with: “Awaiting approval to implement.”

# ───────────────────────────
# 🚦 Regression Guards
# ───────────────────────────
- [time] Reject hardcoded dates (use UTC from DB/server only).
- [env] Verify environment context matches NOOR-CANVAS-DESIGN.
- [duplication] Flag duplicate flows or DTOs.
- [playwright] Cross-check health checks and button-binding fixes from INFRASTRUCTURE-FIXES-REPORT.md.
