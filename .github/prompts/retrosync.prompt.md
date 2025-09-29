---
mode: agent
---

# /retrosync5. **Implementation Drift:** Compare requirements vs implementation notes
6. **Architecture Synchronization:** Audit NOOR-CANVAS_ARCHITECTURE.MD against codebase Requirements/Test Synchronization Agent (v3.0.0)

Synchronizes requirements, implementation, and tests across the entire project while maintaining quality gates.

**Core Mandate:** Follow `.github/instructions/SelfAwareness.instructions.md` for all operating guardrails.

## Parameters
- **notes:** Synchronization scope (requirements/tests, drift details, specific areas to focus)

## Context & Inputs
- **MANDATORY:** `.github/instructions/SelfAwareness.instructions.md` (operating guardrails)
- **MANDATORY:** `.github/instructions/SystemStructureSummary.md` (architectural mappings and structural orientation)
- **Architecture:** `.github/instructions/NOOR-CANVAS_ARCHITECTURE.MD` (architectural reference)
- Current git history and changes
- Current codebase and implementation status
- `#getTerminalOutput` and `#terminalLastCommand` for runtime evidence

## Operating Protocols
**Reference:** SelfAwareness.instructions.md for complete launch, database, analyzer, and linter rules.

### Quality Gates
- **Completion Criteria:** Quality gates complete only when: analyzers green, linters clean, tests passing
- Debug marker: `[DEBUG-WORKITEM:retrosync:{RUN_ID}] message ;CLEANUP_OK`
- Layers: `retrosync`, `tests`, `impl`, `lifecycle`

## Execution Protocol
1. **Load Architectural Context**: Use `SystemStructureSummary.md` to understand current component relationships and API mappings
2. **Requirements Analysis:** Parse requirements and extract acceptance criteria
3. **Test Spec Comparison:** Flag missing, outdated, or redundant specs
4. **Implementation Drift:** Compare requirements vs implementation notes
4. **Architecture Synchronization:** Audit NOOR-CANVAS_ARCHITECTURE.MD against codebase
   - API endpoint inventory (52 endpoints, 11 controllers)
   - Service architecture updates (15+ services)
   - Component catalog maintenance (15+ pages, 10+ components)
   - SignalR hub documentation (4 hubs with methods/events)
   - **Remove obsolete/deprecated APIs, endpoints, services, and components**
   - **Add new APIs, services, components discovered during implementation**
   - **Update method signatures, parameters, and return types** that have changed
   - **Verify all documented endpoints exist and are functional**
   - **Update database schema changes and new tables/models**
   - **Refresh SignalR hub methods and events**
   - **Update service responsibilities and key methods**
   - **Synchronize Razor page routes and component dependencies**
7. Suggest changes:
   - Add/update/remove tests
   - Update requirements docs if implementation differs
   - **Update architecture document with current reality**
   - Highlight gaps where implementation is missing coverage
6. Validate after changes:
   - Run analyzers
   - Run lints
   - Run updated cumulative tests
   - **Verify architecture document accuracy against live codebase**

## Iterative Testing
- Ensure Playwright config points to correct testDir and baseURL
- For each adjustment, rerun the cumulative suite
- Only declare synchronization complete if all specs pass

## Terminal Evidence
- Capture 10–20 lines from `#getTerminalOutput` that show analyzer/linter passes and test run summary
- Include attribution line if retrosync triggered a restart

## Outputs
Summaries must include:
- Requirements synchronization status
- Architecture document changes:
  - **APIs/endpoints added/removed/modified**
  - **Services added/removed/updated** 
  - **Components and pages added/removed/modified**
  - **Database schema changes**
  - **Deprecated functionality removed from documentation**
- Test coverage gaps identified and addressed
- Analyzer/linter results
- Test suite status (pass/fail counts)
- Terminal evidence tail
- Notes on any uncovered gaps or manual review needs

## Approval Workflow
- Do not request user approval until analyzers, lints, and test suite are all green
- After a green run, present reconciliation summary for confirmation
- Then request approval to mark retrosync task complete

## Guardrails
**Reference:** SelfAwareness.instructions.md for complete file organization, database connectivity, and port management protocols.
- Focus on architectural accuracy and test/requirement alignment
- Do not alter `appsettings.*.json` or secrets unless explicitly required for synchronization

## Key Techstack Synchronization (Migrated from IssueTracker)

### Infrastructure Monitoring
- **Port Management**: Track changes to nc.ps1/ncb.ps1 scripts and port configuration patterns
- **Database Connections**: Monitor connection string changes and Entity Framework configuration updates
- **Launch Configuration**: Synchronize launchSettings.json updates and environment-specific settings
- **Process Management**: Track IIS Express handling and cleanup procedures

### Framework & Integration Updates
- **Blazor Server**: Monitor SignalR integration changes and parsing error resolutions
- **Authentication**: Track token validation patterns and API endpoint updates
- **Playwright**: Synchronize test infrastructure changes and artifact management patterns
- **CSS Framework**: Monitor Tailwind CSS integration and purple theme consistency

### Development Workflow Changes
- **Build Process**: Track analyzer and linter configuration changes
- **Testing Strategy**: Monitor Playwright test organization and execution patterns
- **Code Quality**: Track StyleCop suppressions and ESLint baseline changes
- **Deployment**: Monitor any changes to build and deployment procedures

# Additional Responsibilities

## Architecture Document Maintenance
**CRITICAL:** Maintain `.github/instructions/NOOR-CANVAS_ARCHITECTURE.MD` as the single source of truth for system architecture.

### Architecture Synchronization Tasks
1. **API Endpoint Auditing:**
   - Scan all controllers for new/removed/modified endpoints
   - Update method signatures, parameters, and return types
   - Remove documentation for deprecated/deleted endpoints
   - Verify all documented endpoints are functional

2. **Service and Component Inventory:**
   - Audit `/Services/` directory for new/removed/renamed services
   - Update service responsibilities and key method signatures
   - Scan `/Components/` and `/Pages/` for UI component changes
   - Update Razor page routes and component dependencies

3. **Database Schema Synchronization:**
   - Review Entity Framework models for schema changes
   - Update table structures, new models, and relationships
   - Document new DbContext additions or modifications
   - Remove obsolete model documentation

4. **SignalR Hub Updates:**
   - Audit hub methods and client events for changes
   - Update hub method signatures and parameter documentation
   - Document new hubs or removed functionality
   - Verify real-time communication patterns

5. **Deprecation and Cleanup:**
   - **Remove all references to obsolete/deprecated functionality**
   - **Delete documentation for removed APIs, services, or components**
   - **Update integration patterns that have changed**
   - **Clean up outdated architectural decisions**

### Architecture Validation Protocol
- **Before declaring synchronization complete:**
  - Verify every documented API endpoint responds correctly
  - Confirm all documented services exist in the codebase
  - Validate all Razor page routes are accessible
  - Test documented SignalR hub connections and methods
  - Ensure database schema matches documented tables/models

### Technology Stack Updates
- Detect and record newly introduced libraries, frameworks, or dependencies
- Identify changes in the technology stack or infrastructure
- Sync these updates into **SelfAwareness.instructions.md** so Copilot has the latest context
- **Update architecture document with new dependencies and integration patterns**

### Documentation Quality Standards
- **Accuracy:** All documented functionality must exist and work as described
- **Completeness:** No significant APIs, services, or components should be undocumented
- **Currency:** Remove obsolete information immediately upon detection
- **Consistency:** Maintain consistent formatting and structure throughout the document

---

_Note: This file depends on the central `SystemStructureSummary.md`. If structural changes are made, update that summary._


---

## Integration with Summary and Architecture

- Always read `SystemStructureSummary.md` before starting work to ensure you are targeting the correct views, APIs, DTOs, and SQL objects.  
- If more detail is needed, consult `NOOR-CANVAS_ARCHITECTURE.MD` for the authoritative system design.  
- After completing a task (via keylock flow), ensure both files are updated:  
  - `SystemStructureSummary.md` with a concise snapshot of the latest state.  
  - `NOOR-CANVAS_ARCHITECTURE.MD` with detailed architectural changes.  
- Do not commit or push without explicit user approval.


---

## API Contract Validation Integration

- When tasks involve **API contracts** or DTOs, ensure `API-Contract-Validation.md` is updated.  
- `API-Contract-Validation.md` contains the authoritative validation rules for APIs and must always be kept in sync.  
- Alongside this, update `SystemStructureSummary.md` (snapshot) and `NOOR-CANVAS_ARCHITECTURE.MD` (detailed design).  


---

## Repository Consistency Sweep

When invoked in full sync mode:

- Analyze the entire `.github` folder, including all instruction and prompt files.  
- Ensure `SelfAwareness.instructions.md` references `SystemStructureSummary.md`.  
- Verify `SystemStructureSummary.md` is up to date, concise, and consistent with the key-based architecture.  
- Ensure `NOOR-CANVAS_ARCHITECTURE.MD` contains the detailed system design and is consistent with the summary.  
- Confirm `continue.prompt.md` and `workitem.prompt.md` always read `SystemStructureSummary.md` before doing work and include the explicit approval + checklist for commits.  
- Ensure `keylock.prompt.md` correctly stages, summarizes, and commits after explicit approval, updating both `SystemStructureSummary.md` and `NOOR-CANVAS_ARCHITECTURE.MD`.  
- Align all prompts to reference `SystemStructureSummary.md` for structural consistency.  
- Normalize formatting and remove outdated parameters (e.g., commit arguments).  

---

_Important: When suggesting or implementing changes, you must **only commit** after the implementation is complete **and explicit approval is received from the User**._

---

### Approval Checklist (required before commit)
- [ ] User has reviewed the proposed changes
- [ ] User has explicitly approved the commit
- [ ] All instructions in SystemStructureSummary.md are respected
- [ ] No conflicts remain with other prompts or instruction files

_Do not commit until all items are checked and explicit approval is confirmed._
- After analysis, apply updates where needed, then regenerate all files in-place so the repo is consistent and up to date.  


---
### Patch: Retrosync Approval Workflow
- Retrosync now performs a **detailed analysis phase** before making changes.
- It outputs a structured report with headings and bullet points for each file:
  • **File Name**
    - Planned Change: description of modification.
    - Reasoning: why the change is needed.
    - Impact: low / medium / high effect on workflows.
- After the report, Retrosync **asks for user approval or edits** before proceeding.
- Execution halts until the user explicitly approves.
- If approved, Retrosync applies changes, updates the key data stream, and logs provenance.
- If denied or modified, it adapts accordingly.
- After applying, Retrosync performs a **final integrity check** and generates a GPT image-generator prompt for a mind map of the new design.
