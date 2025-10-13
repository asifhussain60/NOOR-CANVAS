# Key: prompts

## Metadata
- **Status**: in-progress
- **Created**: 2025-10-11
- **Last Updated**: 2025-10-13
- **Owner**: GitHub Copilot
- **Description**: Comprehensive prompts system refresh - Links folder integration, infrastructure reference creation, cross-reference matrix establishment, _Portable template synchronization, refactor prompt consolidation enhancements
- **Complexity**: high
- **Debug Level**: simple

## File Mappings

### Frontend (Views)
- N/A - This key focuses on infrastructure and workflow improvements

### Frontend (Components)
- N/A - No frontend components involved

### Backend (Controllers)
- N/A - No backend controllers involved

### Backend (Services)
- N/A - No backend services involved

### Backend (DTOs)
- N/A - No DTOs involved

### Database
- **Tables**: N/A - No database changes
- **Scripts**: N/A - No database scripts

### Tests
- **E2E (Playwright)**: N/A - No E2E tests for this key
- **Unit Tests**: N/A - No unit tests required

### Configuration
- **appsettings.json**: N/A - No configuration changes
- **Environment Variables**: 
  - `KESTREL_PORT` - Referenced in server cleanup documentation (default: 9091)

### Documentation
- `.github/instructions/Links/InfrastructureQuickRef.md` - NEW: Authoritative infrastructure reference (database, API, SignalR, Session 212)
- `.github/instructions/Links/FileMetrics.md` - UPDATED: Refreshed with live line counts, usage guide
- `.github/instructions/Links/FunctionalityRegistry-QuickRef.md` - UPDATED: Added related documentation links
- `.github/instructions/Links/ValidationFramework.md` - UPDATED: Added InfrastructureQuickRef.md reference
- `.github/instructions/Links/ReferenceIndex.md` - UPDATED: Restructured with categories, comprehensive catalog
- `.github/instructions/Links/SystemStructureSummary.md` - UPDATED: All 13 Links files cataloged, version 2.0.0
- `.github/prompts/task.prompt.md` - UPDATED: Complete Core Mandates restructure, all Links files referenced
- `.github/prompts/question.prompt.md` - UPDATED: Core Mandates restructure with reference documentation
- `.github/prompts/healthcheck.prompt.md` - UPDATED: Organized validation scope references
- `.github/prompts/sync.prompt.md` - UPDATED: Added sync-specific documentation responsibilities
- `.github/prompts/test-generation.prompt.md` - UPDATED: Added InfrastructureQuickRef.md to canonical references
- `.github/prompts/cohesion-review.prompt.md` - Prompt system cohesion analysis agent
- `.github/prompts/refactor.prompt.md` - Code refactoring agent (already comprehensive)
- `.github/prompts/analyze-learning.prompt.md` - Learning pattern analysis (already comprehensive)
- `Workspaces/Documentation/prompts-comprehensive-analysis-summary.md` - NEW: Complete execution summary
- `Workspaces/Copilot/prompts.keys/_template/key-template.md` - Template with file mappings
- `Workspaces/Copilot/prompts.keys/prompts/prompts.md` - This file (self-documenting)
- `Workspaces/Copilot/prompts.keys/prompts/work-log.md` - Work log for prompts key

## Dependencies
- **Keys**: N/A - Infrastructure key, not dependent on feature keys
- **External Libraries**: N/A - Documentation only
- **npm Packages**: N/A - No npm dependencies

## Summary
The prompts key encompasses comprehensive refresh and integration of the entire prompts system infrastructure. This includes creating an authoritative infrastructure reference document to eliminate Copilot hallucinations, refreshing all Links folder files with live data, establishing complete cross-reference matrix across all agents, and integrating previously orphaned files into the system.

## Current Work
- ✅ **InfrastructureQuickRef.md Creation**: NEW authoritative reference for database, API endpoints, SignalR hubs, Session 212 test data
  - Purpose: Eliminate Copilot hallucinations about infrastructure
  - Contains: 85+ API endpoints, 3 SignalR hubs, Session 212 canonical tokens (PQ9N5YWW, KJAHA99L)
  - Critical Anti-Patterns section prevents obsolete feature references (e.g., annotation system)
  - Referenced by: task, question, healthcheck, sync, test-generation prompts
  
- ✅ **Orphaned Files Integration**: All 3 orphaned Links files now properly referenced
  - FileMetrics.md → Referenced by sync agent for drift detection, refreshed with live line counts
  - FunctionalityRegistry-QuickRef.md → Linked to task.prompt.md Step 8.2, question.prompt.md
  - ValidationFramework.md → Explicitly referenced in all validation workflows
  
- ✅ **Prompt Core Mandates Restructure**: 5 prompts updated with complete Links catalog
  - task.prompt.md → Complete architectural reference documentation section (13 files)
  - question.prompt.md → Restructured into Analysis Approach + Reference Documentation
  - healthcheck.prompt.md → Organized into Operational Rules + Validation Scope
  - sync.prompt.md → Added documentation sync responsibilities
  - test-generation.prompt.md → Added InfrastructureQuickRef.md to canonical references
  
- ✅ **Links Folder Refresh**: All files updated with current information
  - ReferenceIndex.md → Restructured with categories (Architecture, Validation, Testing, Feature Tracking)
  - SystemStructureSummary.md → Complete Links catalog (13 files), version 2.0.0
  - FileMetrics.md → Live line counts for 26 files (Instructions, Prompts, Shared)
  - ValidationFramework.md → Added InfrastructureQuickRef.md reference
  - FunctionalityRegistry-QuickRef.md → Added related documentation section
  
- ✅ **Code Cleanup**: Removed stale annotation system references
  - Program.cs → Removed AnnotationHub mapping and logging
  - InfrastructureQuickRef.md → Critical Anti-Patterns section documents annotation system deletion

## Recent Changes
- 2025-10-13: Enhanced task.prompt.md with documentation mode, technical analysis, and library catalog (commit: 0bbd932b)
  - Added `debug-level: doc` parameter for documentation-only mode (generates implementation plan without execution)
  - Created Step 2.5: Technical Architecture Analysis (mandatory anti-duplication & spaghetti prevention)
    - Architecture layer review consulting Architecture.md
    - Code duplication detection via semantic_search
    - Service discovery and dependency checking
    - Infrastructure compliance validation with InfrastructureQuickRef.md
    - Cross-agent pattern reuse from Workspaces/Copilot/learning/
    - Spaghetti code risk assessment with complexity metrics
  - Updated Step 3 (Plan) to incorporate architecture analysis findings
  - Updated Step 5 (Execute) with documentation mode workflow:
    - Generate implementation plan in `.github/prompts.keys/{key}/implementation-plan.md`
    - Include code examples from discovered patterns
    - Document architectural decisions and rationale
    - Skip validation and build steps in doc mode
  - Created **PromptEnhancementLibraries.md** (585 lines) in Links folder
    - Documented 8 major libraries: DSPy, Guidance, LangChain, Semantic Kernel, PromptTools, PromptFoo, LangSmith, Langfuse
    - Comparison matrix with C# support, self-hosting capabilities, licensing
    - Semantic Kernel recommended for C# compatibility with NOOR Canvas stack
    - PromptFoo recommended for automated prompt testing in CI/CD
    - Integration examples and getting started guides
  - Added PromptEnhancementLibraries.md reference to SystemIndex.md navigation
  - Added library reference to task.prompt.md Core Mandates section
  - Addresses requirements: documentation mode, infrastructure-aware planning, external library catalog
- 2025-10-13: Enhanced refactor.prompt.md with comprehensive multi-file consolidation strategy (commit: 28e4ca88)
  - Added Multi-File Consolidation Strategy section with 5-step process
  - Included grep_search patterns for identifying similar methods across files
  - Added consolidation decision matrix (when to merge vs keep separate)
  - Documented consolidation execution workflow and validation steps
  - Added consolidation documentation template for tracking merged functionality
  - Enhanced Cross-Service Pattern Detection capabilities
  - Improved Query Pattern Analysis for database access consolidation
- 2025-01-11: Comprehensive prompts system refresh (commit: 4c8211f2)
  - Created InfrastructureQuickRef.md (254 lines) - anti-hallucination reference
  - Refreshed FileMetrics.md with live data (18 → 97 lines)
  - Updated 6 Links files (FunctionalityRegistry-QuickRef, ValidationFramework, ReferenceIndex, SystemStructureSummary)
  - Restructured Core Mandates in 5 prompts (task, question, healthcheck, sync, test-generation)
  - Removed AnnotationHub from Program.cs
  - Created comprehensive execution summary (Workspaces/Documentation/prompts-comprehensive-analysis-summary.md)
  - Total changes: 12 files, 571 insertions, 71 deletions
- 2025-10-11: Implemented auto-load file mappings in task.prompt.md Step 2.3 (commit: fb3c3a46)
- 2025-10-11: Added Step 0 to task.prompt.md - Kestrel server cleanup (commit: e47d1285)
- 2025-10-11: Created key-template.md with file mapping schema (commit: e47d1285)
- 2025-10-11: Created prompts.md metadata file (commit: e47d1285)

## Related Keys
- **canvas**: Example key with narrative dependencies (to be migrated to new format)
- **hcp**: Example key using key.json format (demonstrates files_modified array concept)
- **test-system**: All prompts now reference InfrastructureQuickRef.md for Session 212 canonical test data

## Notes
- **Design Philosophy**: All Links files must be properly referenced by at least one prompt - zero orphaned files
- **Anti-Hallucination**: InfrastructureQuickRef.md eliminates need for Copilot to guess infrastructure details
- **Cross-Reference Matrix**: Complete mapping of which prompts reference which Links files
- **Drift Detection**: FileMetrics.md tracks line counts to detect documentation staleness
- **Template Location**: `_template/key-template.md` serves as reference for all new keys
- **Automation Opportunity**: Future enhancement could auto-populate File Mappings section by analyzing git history and file imports
- **Sync Responsibilities**: sync agent updates FileMetrics.md and InfrastructureQuickRef.md after structural changes

---

## Execution Tracking

### Phases
- **Checkpoint**: ✅ completed (2s, 2025-10-11T12:00:00Z) - commit: 865599ea
- **Plan**: ✅ completed (120s, 2025-10-11T12:02:00Z) - Analyzed canvas.md and hcp/key.json structures
- **Execute**: ✅ completed (300s, 2025-10-11T12:13:00Z) - commits: e47d1285, fb3c3a46
  - Step 0 implementation: DONE (e47d1285)
  - File mapping schema design: DONE (e47d1285)
  - Template creation: DONE (e47d1285)
  - Prompts metadata creation: DONE (e47d1285)
  - Auto-load implementation in Step 2.3: DONE (fb3c3a46)
- **Validate**: ✅ completed (30s, 2025-10-11T12:14:00Z) - All files created successfully, auto-load logic verified
- **Confirm**: ✅ completed (10s, 2025-10-11T12:15:00Z) - Commits e47d1285 and fb3c3a46 created

### Commits
- `865599ea` - checkpoint: pre-task prompts
- `e47d1285` - feat(prompts): Add server cleanup step + file mapping system
- `5b0c9a77` - checkpoint: pre-task prompts - auto-load file mappings
## Recent Changes
- ✅ **Task 1 (task.prompt.md)**: Removed Step 0 (Server Cleanup), updated Step 7 summary header to "SUMMARY: {key}" format
- ✅ **Task 2 (commit.prompt.md)**: Added Step 4 (Key Data Stream Cleanup) with logic to read prompts.keys, remove redundancies, compact structure, and extract patterns to Links/shared folders
- Commit: `47f3996d` - feat(prompts): enhance commit workflow with key data stream cleanup

## Execution Tracking

### Commits
- `c32e047f` - checkpoint: pre-task prompts prompt improvements
- `47f3996d` - feat(prompts): enhance commit workflow with key data stream cleanup
- Pending: Update this metadata file

### Files Modified (Current Session)
- `.github/prompts/task.prompt.md` - UPDATED - Removed Step 0 (Server Cleanup), changed Step 7 headers to "SUMMARY: {key-name}"
- `.github/prompts/commit.prompt.md` - UPDATED - Added Step 4 (Key Data Stream Cleanup), renumbered steps 4-8 → 5-9, updated guardrails

### Previous Session Files
- `fb3c3a46` - feat(prompts): Implement auto-load file mappings in task.prompt.md Step 2
- `a250157a` - docs(prompts): Update prompts.md with commit SHA and completion status
- `4c8211f2` - feat(prompts): comprehensive Links folder refresh and cross-reference integration
- `28e4ca88` - feat(prompts): Enhanced refactor.prompt.md with multi-file consolidation strategy
- `0bbd932b` - feat(prompts): Add debug-level:doc mode, technical analysis step, and prompt enhancement libraries (LATEST)

### Files Modified
- `.github/prompts/task.prompt.md` - UPDATED - Added debug-level:doc mode, Step 2.5 Technical Analysis, PromptEnhancementLibraries reference (commit: 0bbd932b)
- `.github/instructions/Links/PromptEnhancementLibraries.md` - CREATED (585 lines) - Comprehensive library catalog (commit: 0bbd932b)
- `.github/instructions/Links/SystemIndex.md` - UPDATED - Added Prompt Enhancement section to Quick Navigation (commit: 0bbd932b)
- `.github/prompts/refactor.prompt.md` - UPDATED - Enhanced multi-file consolidation strategy (commit: 28e4ca88)
- `.github/instructions/Links/InfrastructureQuickRef.md` - CREATED (254 lines) - Authoritative infrastructure reference
- `.github/instructions/Links/FileMetrics.md` - UPDATED (18 → 97 lines) - Live line counts, usage guide
- `.github/instructions/Links/FunctionalityRegistry-QuickRef.md` - UPDATED - Added related documentation
- `.github/instructions/Links/ValidationFramework.md` - UPDATED - Added InfrastructureQuickRef.md reference
- `.github/instructions/Links/ReferenceIndex.md` - UPDATED (11 → 48 lines) - Restructured with categories
- `.github/instructions/Links/SystemStructureSummary.md` - UPDATED (44 → 56 lines) - Complete Links catalog, v2.0.0
- `.github/prompts/task.prompt.md` - UPDATED - Complete Core Mandates restructure (13 Links files)
- `.github/prompts/question.prompt.md` - UPDATED - Core Mandates restructure with references
- `.github/prompts/healthcheck.prompt.md` - UPDATED - Organized validation scope
- `.github/prompts/sync.prompt.md` - UPDATED - Added sync responsibilities
- `.github/prompts/test-generation.prompt.md` - UPDATED - Added InfrastructureQuickRef.md
- `SPA/NoorCanvas/Program.cs` - UPDATED - Removed AnnotationHub references
- `Workspaces/Documentation/prompts-comprehensive-analysis-summary.md` - CREATED - Execution summary
- `Workspaces/Copilot/prompts.keys/_template/key-template.md` - Created new markdown template
- `Workspaces/Copilot/prompts.keys/prompts/prompts.md` - This metadata file (updated)
- `Workspaces/Copilot/prompts.keys/prompts/work-log.md` - Updated with comprehensive analysis phases

### Warnings & Errors
- N/A - No warnings or errors encountered
