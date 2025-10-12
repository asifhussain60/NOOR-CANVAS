# Step 0: Kill Running Kestrel Servers (Mandatory)

**Version**: 1.0.0  
**Last Updated**: 2025-10-11  
**Purpose**: Ensure clean server state before any operations

---

## Overview

**Before any code changes, ensure clean server state by terminating all running Kestrel processes.**

This prevents:
- Port conflicts (HTTPS 9091 already in use)
- File lock issues during build/compilation
- Stale server instances serving outdated code
- Test failures from multiple server instances

---

## Execution

### 0.1. Execute nckill Command

```powershell
nckill
```

This PowerShell alias kills all `dotnet.exe` processes running Kestrel servers.

### 0.2. Verify Clean State

- Confirm terminal output shows processes terminated
- If `nckill` command not found, use fallback:
  ```powershell
  Get-Process -Name dotnet -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like '*Kestrel*' -or $_.Path -like '*NoorCanvas*' } | Stop-Process -Force
  ```

### 0.3. Expected Output

```
Successfully terminated 2 dotnet.exe process(es)
```

OR (if no servers running):

```
No dotnet.exe processes found
```

---

## Rationale

Prevents "address already in use" errors and ensures fresh server start with latest code changes.

---

## Usage

This step should be included in any prompt that:
- Modifies code (implementation, refactoring)
- Runs tests (requires clean server state)
- Performs cleanup or synchronization

**Reference this module** in your prompt:
```markdown
### 0. Kill Running Kestrel Servers (Mandatory)
**See**: [Step 0: Server Cleanup](shared/step-0-server-cleanup.md)
```

OR **Include inline** if brevity needed:
```markdown
### 0. Kill Running Kestrel Servers (Mandatory)
Execute `nckill` (PowerShell alias) to terminate all Kestrel servers.
Prevents port conflicts and file locks. See shared/step-0-server-cleanup.md for details.
```

---

## Version History

- **v1.0.0** (2025-10-11): Initial extraction from task.prompt.md
  - Canonical server cleanup procedure
  - nckill command with fallback
  - Clear rationale and expected outputs
