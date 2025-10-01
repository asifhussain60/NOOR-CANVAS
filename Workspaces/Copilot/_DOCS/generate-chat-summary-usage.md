# Generate Chat Summary Agent - Usage Guide

## Overview
The `generate-chat-summary` agent analyzes chat sessions and creates comprehensive context documentation to enable seamless continuity for future Copilot interactions.

## Quick Usage

### Basic Invocation
```
@copilot /generate-chat-summary session-id:chat-20250101-143022
```

### With Options
```
@copilot /generate-chat-summary session-id:current-session context-level:comprehensive debug-level:trace
```

## Generated Output Structure

Each session generates a file in `.github/copilot-chats/` with the following sections:

### 1. Current Objective
**Purpose**: Primary goal and current focus of the work session  
**Content**: Clear statement of what was being accomplished

### 2. Completed Work  
**Purpose**: Document validated accomplishments  
**Content**: 
- Successfully implemented features or fixes
- Validated changes with test confirmations  
- Architectural improvements completed

### 3. In Progress
**Purpose**: Current work state and exact position  
**Content**:
- Partially implemented features
- Current file and line position
- Immediate context of interrupted work

### 4. Incomplete/Blocked
**Purpose**: Unfinished tasks and obstacles  
**Content**:
- Interrupted workflows or pending validations
- Unresolved issues or known limitations  
- Blocking dependencies or prerequisites

### 5. Immediate Next Steps
**Purpose**: Actionable continuity instructions  
**Content**:
- Specific commands to resume work
- File paths and exact locations  
- Required validation steps

### 6. Context Index
**Purpose**: Technical reference information  
**Sections**:
- **Files Modified**: Changed files with brief descriptions
- **API Endpoints Involved**: Relevant API interactions  
- **Database Operations**: Any DB changes or queries
- **Tests Affected**: Related test files and status
- **Dependencies**: External libraries or services involved

### 7. Architectural Notes  
**Purpose**: Key technical decisions and patterns  
**Content**:
- Design patterns used or modified
- Architectural implications of changes
- Integration considerations

### 8. Tools & Commands
**Purpose**: Environment and operational context  
**Sections**:
- **Last Terminal Operations**: Recent commands and their output
- **Build/Test Status**: Current compilation and test state  
- **Environment State**: Runtime configuration and settings

### 9. Copilot Instructions
**Purpose**: Detailed instructions for seamless continuation  
**Content**:
- Step-by-step resumption guide
- Key context for understanding current state
- Validation criteria for completed work

## Integration Points

### Automatic Execution
- Called by `sync` agent as final step to maintain chat history
- Triggered after major workflow completions  
- Executed during session transitions or handoffs

### Cross-References
- Links to related architecture documentation
- References to SystemStructureSummary.md updates
- Connections to analyzer/linter status
- Integration with test execution results

## File Naming Convention

### Standard Format
`{session-id}-{primary-feature-slug}.md`

### Examples
- `chat-20250101-143022-asset-detection-fix.md`  
- `user-session-auth-workflow-improvements.md`
- `migrate-session-api-to-signalr.md`

### Indexing Tags
Files are automatically tagged for optimal Copilot consumption:
- `#context-continuation`
- `#work-state-{status}` (in-progress, blocked, completed)
- `#architecture-{domain}` (ui, api, database, etc.)
- `#api-{endpoints}` (specific API endpoints involved)
- `#tests-{status}` (passing, failing, pending)

## Best Practices

### For Session Documentation
1. **Be Specific**: Include exact file paths and line numbers
2. **Focus on Actionable**: Prioritize next steps over conversation history  
3. **Validate Context**: Ensure technical details are current and accurate
4. **Cross-Reference**: Link to related sessions and architecture docs

### For Continuity  
1. **Test Instructions**: Verify that next steps are immediately executable
2. **Environment Context**: Include necessary environment setup or configuration
3. **Validation Criteria**: Specify how to confirm successful continuation
4. **Error Recovery**: Document known issues and their resolutions

## Maintenance

The chat documentation system is maintained through:
- Automatic indexing via `INDEX.md` updates
- Cross-referencing with architecture documentation  
- Integration with sync operations for consistency
- Regular cleanup of obsolete session files

This system ensures that no context is lost between chat sessions and enables immediate productive continuation of any interrupted work.