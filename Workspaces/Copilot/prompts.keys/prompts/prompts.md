# Key: prompts

## Metadata
- **Status**: completed
- **Created**: 2025-10-11
- **Last Updated**: 2025-10-11
- **Owner**: GitHub Copilot
- **Description**: Task execution workflow improvements and file mapping system for key metadata
- **Complexity**: moderate
- **Debug Level**: detailed

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
- `.github/prompts/task.prompt.md` - Main task execution workflow specification
- `.github/prompts/cohesion-review.prompt.md` - Prompt system cohesion analysis agent (NEW)
- `.github/prompts/question.prompt.md` - Q&A routing logic
- `.github/prompts/test-generation.prompt.md` - Test automation agent
- `.github/prompts/refactor.prompt.md` - Code refactoring agent
- `.github/prompts/healthcheck.prompt.md` - System health validation
- `.github/prompts/analyze-learning.prompt.md` - Learning pattern analysis
- `.github/prompts/sync.prompt.md` - Synchronization agent
- `Workspaces/Copilot/prompts.keys/_template/key-template.md` - New markdown template with file mappings
- `Workspaces/Copilot/prompts.keys/_template/key.json` - Original JSON template (legacy)
- `Workspaces/Copilot/prompts.keys/prompts/prompts.md` - This file (self-documenting)
- `Workspaces/Copilot/prompts.keys/prompts/work-log.md` - Work log for prompts key

## Dependencies
- **Keys**: N/A - Infrastructure key, not dependent on feature keys
- **External Libraries**: N/A - Documentation only
- **npm Packages**: N/A - No npm dependencies

## Summary
The prompts key encompasses meta-improvements to the task execution workflow and key metadata system. This includes adding server cleanup automation to prevent common errors (port conflicts, file locks) and implementing a structured file mapping system to enable automatic context loading when working with keys.

## Current Work
- ✅ **Step 0 Addition**: Added "Kill Running Kestrel Servers" as mandatory first step in task.prompt.md
  - Primary method: `nckill` PowerShell alias
  - Fallback: Direct PowerShell process termination command
  - Rationale: Prevents port 9091 conflicts, file locks, stale servers, test failures
  - Impact: All future task executions automatically kill servers first
  
- ✅ **File Mapping System Design**: Created comprehensive schema for key metadata
  - Format: Markdown with structured sections (human-readable + machine-parseable)
  - Categories: Frontend (Views, Components), Backend (Controllers, Services, DTOs), Database (Tables, Scripts), Tests (E2E, Unit), Configuration (appsettings, env vars), Documentation
  - Advantages: Context-rich descriptions, categorized file types, git-friendly diffs
  - Template: Created `key-template.md` with full schema and examples
  
- ✅ **Auto-Load File Mappings Implementation**: Added Section 2.3 to task.prompt.md
  - Automatically parses File Mappings section from key metadata
  - Loads primary files (Views, Controllers, Services) into context
  - Prioritizes files: Primary (immediate), Secondary (on-demand), Tertiary (reference)
  - Eliminates need for `#file:` references when key is active
  - Fallback to manual specification if File Mappings missing
  - Supports legacy key.json format
  - Impact: Users no longer need to specify file names - key metadata provides all context automatically

## Recent Changes
- 2025-10-11: Implemented auto-load file mappings in task.prompt.md Step 2.3 (commit: fb3c3a46)
- 2025-10-11: Added Step 0 to task.prompt.md - Kestrel server cleanup (commit: e47d1285)
- 2025-10-11: Created key-template.md with file mapping schema (commit: e47d1285)
- 2025-10-11: Created prompts.md metadata file (commit: e47d1285)

## Related Keys
- **canvas**: Example key with narrative dependencies (to be migrated to new format)
- **hcp**: Example key using key.json format (demonstrates files_modified array concept)

## Notes
- **Design Philosophy**: File mappings should be machine-parseable (structured paths) while remaining human-friendly (markdown with descriptions)
- **Migration Strategy**: Existing keys can gradually adopt new format - backwards compatible
- **Template Location**: `_template/key-template.md` serves as reference for all new keys
- **Automation Opportunity**: Future enhancement could auto-populate File Mappings section by analyzing git history and file imports
- **Context Loading**: With structured file paths, agents can automatically read relevant files when key is activated
- **Server Cleanup**: `nckill` alias expected in PowerShell profile; fallback command provided for environments without alias

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
- `fb3c3a46` - feat(prompts): Implement auto-load file mappings in task.prompt.md Step 2
- `a250157a` - docs(prompts): Update prompts.md with commit SHA and completion status
- `7d8902e` - feat(canvas): set canvas-content-area min-height to 400px (previous task)

### Files Modified
- `.github/prompts/task.prompt.md` - Added Step 0 (Kestrel server cleanup), renumbered existing steps, added Section 2.3 (Auto-Load File Mappings)
- `Workspaces/Copilot/prompts.keys/_template/key-template.md` - Created new markdown template
- `Workspaces/Copilot/prompts.keys/prompts/prompts.md` - Created this metadata file
- `Workspaces/Copilot/prompts.keys/prompts/work-log.md` - Updated with Phase 4 auto-load implementation details
- `Workspaces/Copilot/prompts.keys/prompts/work-log.md` - To be created next

### Warnings & Errors
- N/A - No warnings or errors encountered
