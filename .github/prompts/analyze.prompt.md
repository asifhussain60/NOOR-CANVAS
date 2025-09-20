---
mode: agent
---
name: Systematic Architecture Review
/analyze  targets:#file:UserLanding.razor, /src/Server/Controllers
          notes: Please check whether DTOs are aligned with camelCase vs PascalCase; we had bugs before.

description: Thoroughly review views, routes, APIs, DTOs, and SQL for selected artifacts; enumerate use cases, trace end-to-end, and report findings before implementation.
parameters:
  - name: targets
    description: >
      A comma- or newline-separated list of artifacts to examine (files, directories, or screenshots).
      Accepts #file: syntax, glob-like patterns, and short notes about screenshots.
      Example:
        #file:UserLanding.razor
        #file:SessionWaiting.razor
        /src/Server
        screenshots/landing/*.png
  - name: notes
    description: >
      Optional free-text notes from the user providing context, clarifications,
      or specific concerns to emphasize during the review.
      Example:
        "Focus on async lifecycle methods; I suspect race conditions."
---

# 🎯 Objective
You are tasked with a **systematic architecture review** of the following Razor components and any related code:
- Always include: #file:UserLanding.razor and #file:SessionWaiting.razor
- Plus: {{targets}}

Incorporate the following **user-provided notes** when prioritizing your review:
> {{notes}}

Produce a written report of findings **before** making any changes. Create a **TODO inventory of use cases** you identify from the views and related flows.

# ✅ Deliverables (in this order)
1) **Executive Summary** — 5–10 bullet points (what you reviewed, key use cases, top risks).
2) **TODO: Use Case Inventory** — checklist of all distinct user flows inferred from the views (links/buttons/forms/conditions), with one-line intent each.
3) **End-to-End Trace Table** — for each use case, trace **View → Route → API → DTO → SQL** with file+line refs.
4) **Validation Matrix** …
5) **Mismatches & Gaps** …
6) **Risks & Unknowns** …
7) **Implementation Plan (Deferred)** …
8) **Approval Gate** — end with: “**Awaiting approval to implement.**”

(… keep the rest of your method, guardrails, heuristics, and output format unchanged …)
