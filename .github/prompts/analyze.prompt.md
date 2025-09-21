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
Perform a **systematic architecture review** of the following Razor components and related server artifacts:  
- Always include: `#file:UserLanding.razor` and `#file:SessionWaiting.razor`  
- Plus: `{{targets}}`  

Incorporate the following **user-provided notes** as priorities:  
> {{notes}}

Produce a detailed written report of findings **before** making any code changes. Create a **TODO inventory of use cases** from the views and flows you analyze.

# ✅ Deliverables (in order)
1. **Executive Summary** — 5–10 bullet points (what was reviewed, key use cases, top risks).  
2. **Plain-English Narrative** — 2–4 paragraphs summarizing what was found, implications for the system, and clear recommendations for improvement.  
3. **TODO: Use Case Inventory** — checklist of all distinct user flows (links/buttons/forms/conditions), each with one-line intent.  
4. **End-to-End Trace Table** — for each use case, trace **View → Route → API → DTO → SQL**, with file+line refs.  
5. **Validation Matrix** — confirm naming, typing, consistency rules (e.g., camelCase vs PascalCase DTOs).  
6. **Mismatches & Gaps** — highlight missing links or inconsistencies across layers.  
7. **Risks & Unknowns** — list unresolved issues or assumptions that need clarification.  
8. **Implementation Plan (Deferred)** — outline but do not yet apply changes.  
9. **Approval Gate** — end with: “**Awaiting approval to implement.**”  

*(Keep the rest of your method, heuristics, and formatting unchanged.)*
