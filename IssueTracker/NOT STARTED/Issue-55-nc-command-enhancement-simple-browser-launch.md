# Issue-55: NC Command Enhancement - Simple Browser Launch

**Created**: 2025-09-14  
**Priority**: MEDIUM 🟡  
**Category**: Enhancement 🔧  
**Status**: NOT STARTED  

---

## Issue Description

The `nc` command should automatically launch the NOOR Canvas application in VS Code's Simple Browser after starting the server, providing a seamless development experience without requiring manual browser navigation.

**Current Behavior:**
- `nc` command starts the application server
- User must manually navigate to https://localhost:9091 in browser
- No integrated browser experience within development environment

**Required Behavior:**
- `nc` command should run nct (token generation)  
- Start the NOOR Canvas application server
- Automatically launch application in VS Code Simple Browser
- Provide integrated development experience

---

## Technical Requirements

### Implementation Tasks:
1. **Simple Browser Integration**: Add `open_simple_browser` call after server startup
2. **Server Readiness Detection**: Wait for server to be ready before launching browser
3. **Error Handling**: Handle cases where Simple Browser is not available
4. **URL Construction**: Use actual server ports for browser launch

### Success Criteria:
- `nc` command launches application in Simple Browser automatically
- Browser opens to correct URL (https://localhost:9091)
- Server is ready when browser opens (no loading errors)
- Fallback handling if Simple Browser unavailable

---

## Implementation Framework

**Modified NC Workflow:**
1. Run nct (token generation)
2. Handle "Press ENTER to continue" prompt
3. Build project
4. Start server
5. **NEW**: Wait for server readiness
6. **NEW**: Launch in VS Code Simple Browser
7. Display success message with URL

**Code Changes Required:**
- Update `Workspaces/Global/nc.ps1` 
- Add server readiness check (health endpoint ping)
- Add Simple Browser launch integration
- Update logging messages for new workflow

---

## Notes
- Should integrate with existing port management logic
- Must handle HTTPS certificate warnings in Simple Browser
- Consider user preference for external browser vs Simple Browser
