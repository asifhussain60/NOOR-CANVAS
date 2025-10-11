# Key: prompts

## Metadata
- **Status**: in-progress
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
  
- 🔄 **Metadata Standardization**: Migrating from mixed formats to unified markdown approach
  - Current: Some keys use `.md` (canvas), others use `key.json` (hcp)
  - Target: All keys use `.md` format with structured File Mappings section
  - Benefit: Consistent structure across all keys for predictable context loading

## Recent Changes
- 2025-10-11: Added Step 0 to task.prompt.md - Kestrel server cleanup (commit: pending)
- 2025-10-11: Created key-template.md with file mapping schema (commit: pending)
- 2025-10-11: Created prompts.md metadata file (commit: pending)

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
- **Execute**: 🔄 in-progress (started 2025-10-11T12:04:00Z)
  - Step 0 implementation: DONE
  - File mapping schema design: DONE
  - Template creation: DONE
  - Prompts metadata creation: IN-PROGRESS
- **Validate**: ⏳ pending
- **Confirm**: ⏳ pending

### Commits
- `865599ea` - checkpoint: pre-task prompts
- `7d8902e` - feat(canvas): set canvas-content-area min-height to 400px (previous task)
- Pending: `feat(prompts): Add server cleanup step + file mapping system`

### Files Modified
- `.github/prompts/task.prompt.md` - Added Step 0 (Kestrel server cleanup), renumbered existing steps
- `Workspaces/Copilot/prompts.keys/_template/key-template.md` - Created new markdown template
- `Workspaces/Copilot/prompts.keys/prompts/prompts.md` - Created this metadata file
- `Workspaces/Copilot/prompts.keys/prompts/work-log.md` - To be created next

### Warnings & Errors
- N/A - No warnings or errors encountered
