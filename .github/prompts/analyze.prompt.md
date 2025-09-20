---
mode: agent
---
name: Systematic Architecture Review
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
---

# 🎯 Objective
You are tasked with a **systematic architecture review** of the following Razor components and any related code:
- Always include: #file:UserLanding.razor and #file:SessionWaiting.razor
- Plus: {{targets}}

Produce a written report of findings **before** making any changes. Create a **TODO inventory of use cases** you identify from the views and related flows.

# ✅ Deliverables (in this order)
1) **Executive Summary** — 5–10 bullet points (what you reviewed, key use cases, top risks).
2) **TODO: Use Case Inventory** — checklist of all distinct user flows inferred from the views (links/buttons/forms/conditions), with one-line intent each.
3) **End-to-End Trace Table** — for each use case, trace **View → Route → API → DTO → SQL** with file+line refs.
4) **Validation Matrix** (Yes/No with notes) for each use case:
   - Routes resolve and accept required params
   - API contract matches the request/response object structures
   - App-layer DTOs match API responses (type/nullability/naming)
   - SQL entities/tables/columns support the view’s data needs
5) **Mismatches & Gaps** — precise diffs-in-words (no code edits yet) with references.
6) **Risks & Unknowns** — what blocks certainty; propose how to confirm.
7) **Implementation Plan (Deferred)** — small, ordered steps to fix, with blast radius and quick checks.
8) **Approval Gate** — end with: “**Awaiting approval to implement.**”

# 🧭 Method (Follow these phases)
## Phase 1 — Inventory & Context
- Open the core views:
  - #file:UserLanding.razor
  - #file:SessionWaiting.razor
- Parse **@page** directives, `NavLink`/`href`, `NavigateTo`, route params, forms, events (`@onclick`, `OnInitialized[Async]`, `OnParametersSet[Async]`), and `@inject`ed services.
- From these, derive initial **use cases** (each distinct button/link/form/conditional path is a candidate).

## Phase 2 — Codebase Discovery (Targeted)
Use lightweight, high-signal searches (avoid vendor/obj/bin/node_modules):
- Find API calls & services used by the views:
  - Search terms: `HttpClient`, `.GetAsync(`, `.PostAsync(`, `SendAsync(`, `IApi*`, `*Service`, `*Client`, `ApiBaseUrl`, `NavigateTo`, `JsonSerializer`, `System.Text.Json`, `Newtonsoft.Json`.
- Trace to endpoints:
  - Look in `Program.cs` for `MapGet/MapPost/MapPut/MapDelete`, Controllers (`[ApiController]`, `[HttpGet]`, `[HttpPost]`, `[Route]`).
- Find DTOs and models:
  - Terms: `Dto`, `ViewModel`, `Record`, `class` names referenced in service methods.
- SQL/data layer:
  - If EF Core: `DbContext`, `DbSet<...>`, `OnModelCreating`, entity types, migrations.
  - If Dapper/raw SQL: `Query`, `Execute`, `SELECT`, `INSERT`, `UPDATE`, `CREATE TABLE`.

## Phase 3 — Use Case Enumeration (Create TODO)
- For each UI action/route/conditional branch, add a **TODO item**:
  - `- [ ] UseCase-XX: <short title> — trigger, expected data, destination view/route`
- Keep this list **in the report** (do not write files yet).

## Phase 4 — End-to-End Tracing (Per Use Case)
For each use case:
1. **Views & Routing**
   - Capture `@page` URIs, route params, `NavLink`/`NavigateTo` targets, any query strings.
   - Verify: route exists, params defined, and types match usage in code-behind.
2. **API Boundary**
   - Identify the HTTP method, request path, headers, serialization library (System.Text.Json/Json.NET), and body schema.
   - Extract the **request DTO** (if any) and **response shape** expected in the view.
   - Compare to the server endpoint signature and response model. Flag casing/pascal vs camel, nullability, optional fields, enums.
3. **App-Layer DTOs / Mapping**
   - Check AutoMapper profiles or manual mapping. Verify every field is mapped or intentionally ignored.
   - Confirm date/time, decimal, and enum conversions (culture/precision).
4. **SQL/Data**
   - Confirm the **entity/table** exists and includes referenced columns with compatible types and nullability.
   - Validate relationships/foreign keys supporting the query (e.g., includes/joins).
   - Note any required seed data for the view to function.

## Phase 5 — Validation Matrix & Findings
- Fill a 4-row matrix per use case: **Routes / API Contract / DTO Mapping / SQL Support** → **Yes/No + short note + file:line**.
- Collect mismatches with **tight citations**: `path/to/file.cs:123-147`, specific property names, and the exact difference (e.g., `Api returns user_id (snake) but DTO expects UserId (Pascal)`).

## Phase 6 — Plan (Deferred) & Gate
- Propose minimal, ordered changes with checks (unit of work sized).
- Include **verification steps**: route hit test, schema check, serialization round-trip, and a sample payload.
- Stop. Do **not** modify files until explicitly approved.

# 🔒 Guardrails
- **No code changes** in this phase. Reporting only.
- Be precise and terse in citations (file:line). Prefer breadth first, then depth where risky.
- If screenshots are included, use them only to infer **expected** UI actions/data and cross-validate against code; do not treat them as source of truth.
- If something is unclear, record it under **Unknowns** with a concrete next step to confirm.

# 🧪 Static Validation Heuristics (use liberally)
- Flag any async calls missing `await` in lifecycle methods; note potential race/tearing.
- Check `CancellationToken` availability in service/HTTP calls.
- Ensure `JsonSerializerOptions.PropertyNamingPolicy` aligns with DTO property names.
- Verify nullable reference types: `string?` vs required fields used in markup (`@bind-Value`).
- Check for optimistic null usage in markup (e.g., `Model!.Property`) and note risks.
- Confirm route constraint types (e.g., `{id:int}`) match param usage.
- EF Core: ensure `Include`/`ThenInclude` or projections provide all fields the view renders.
- Look for accidental `DateTime.Now` vs `UtcNow` and time zone implications in UI.
- Identify hidden coupling (magic strings for routes/keys), suggest constants or typed clients.

# 🧱 Output Format (strict)
Render your report in this structure:

## Executive Summary
- …

## TODO: Use Case Inventory
- [ ] UseCase-01: …
- [ ] UseCase-02: …
  (Add as many as needed)

## End-to-End Trace Table
| Use Case | View(s) | Route/Params | API (method+path) | Req DTO | Resp DTO | SQL Entities/Tables | Notes |
|---|---|---|---|---|---|---|---|
| UseCase-01 | … | … | … | … | … | … | … |

## Validation Matrix
- **UseCase-01**
  - Routes: Yes/No — note (file:line)
  - API Contract: Yes/No — note (file:line)
  - DTO Mapping: Yes/No — note (file:line)
  - SQL Support: Yes/No — note (file:line)

## Mismatches & Gaps
- … KSESSIONS_DEV canvas.KSessionsId renamed to SessionId in simplified schema 
- canvas.HostGuid renamed to HostAuthToken
- canvas.GroupId renamed to AlbumId

## Risks & Unknowns
- …

## Implementation Plan (Deferred)
1. …
2. …
3. …

**Awaiting approval to implement.**

# ⚙️ Efficiency Tips
- Prefer targeted searches (symbol names, endpoint paths) over whole-repo scans.
- Skip heavy dirs: `bin/`, `obj/`, `node_modules/`, `wwwroot/lib/`, `**/dist/`.
- Reuse discovered context (service/DTO/entity maps) across use cases.
- Group identical contract issues into one fix in the plan; don’t repeat per use case.

# 📌 Acceptance Criteria
- Every discovered use case appears in the TODO inventory.
- Each use case has a complete UI→API→DTO→SQL trace with citations.
- Every matrix item marked Yes/No with a one-line justification.
- All mismatches and risks are actionable with next steps.
