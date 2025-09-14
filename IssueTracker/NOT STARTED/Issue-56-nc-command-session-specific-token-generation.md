# Issue-56: NC Command Session-Specific Token Generation

**Created**: 2025-09-14  
**Priority**: MEDIUM 🟡  
**Category**: Enhancement 🔧  
**Status**: NOT STARTED  

---

## Issue Description

The `nc` command should accept a session ID parameter (e.g., `nc 215`) to generate a host token for that specific session, enabling direct session-specific development workflows.

**Current Behavior:**
- `nc` command runs generic nct token generation
- No session-specific token generation capability
- Developers must manually run separate commands for specific sessions

**Required Behavior:**
- `nc` command without parameters: generic token generation + app launch
- `nc 215` command: generate host token for session ID 215 + app launch  
- `nc [sessionId]` command: generate host token for any session ID + app launch

---

## Technical Requirements

### Parameter Handling:
1. **Optional Session ID**: Accept positional parameter for session ID
2. **NCT Integration**: Pass session ID to nct command when provided
3. **Validation**: Verify session ID is valid integer
4. **Backward Compatibility**: Maintain existing `nc` behavior when no parameter provided

### NCT Command Enhancement:
1. **Session Parameter**: Update nct to accept session ID parameter
2. **Host Provisioner Integration**: Use HostProvisioner for session-specific token generation
3. **Output Display**: Show session-specific token and URL

### Success Criteria:
- `nc` works as before (generic token)
- `nc 215` generates token for session 215 specifically
- `nc [any-session-id]` generates token for that session
- Error handling for invalid session IDs
- Consistent application launch behavior

---

## Implementation Framework

**Enhanced NC Command Syntax:**
```powershell
nc                    # Generic token + launch
nc 215                # Session 215 token + launch  
nc 42                 # Session 42 token + launch
nc -Help              # Show updated help with session parameter
```

**Modified Workflow:**
1. Parse optional session ID parameter
2. Run nct with session ID (if provided) 
3. Handle continuation prompt
4. Build and launch application
5. Display session-specific information

**Code Changes Required:**
- Update `Workspaces/Global/nc.ps1` parameter handling
- Update `Workspaces/Global/nct.ps1` to accept session ID
- Add parameter validation and error handling
- Update help documentation

---

## Integration Notes
- Should work with existing HostProvisioner tool
- Must maintain all current nc functionality
- Consider integration with Issue-55 (Simple Browser launch)
- Update global command documentation
