# Step 0: Kill Running Servers (Mandatory)

**Version**: 1.0.0  
**Purpose**: Ensure clean server state before any operations

---

## Overview

**Before any code changes, ensure clean server state by terminating all running development servers.**

This prevents:
- Port conflicts (server already running on target port)
- File lock issues during build/compilation
- Stale server instances serving outdated code
- Test failures from multiple server instances
- Resource conflicts

---

## Language-Specific Execution

### .NET / C# (Kestrel Server)

**PowerShell:**
```powershell
# Kill all dotnet.exe processes running Kestrel
Get-Process -Name dotnet -ErrorAction SilentlyContinue | 
    Where-Object { $_.MainWindowTitle -like '*Kestrel*' -or $_.Path -like '*YourProjectName*' } | 
    Stop-Process -Force
```

**Bash:**
```bash
# Kill all dotnet processes
pkill -f "dotnet.*YourProjectName"
```

**Custom Alias (recommended):**
Create PowerShell profile alias:
```powershell
# Add to $PROFILE
function Kill-DevServer { 
    Get-Process -Name dotnet -ErrorAction SilentlyContinue | Stop-Process -Force 
}
Set-Alias -Name killserver -Value Kill-DevServer
```

Then use:
```powershell
killserver
```

---

### Node.js / JavaScript

**PowerShell:**
```powershell
# Kill all node.exe processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Bash:**
```bash
# Kill all node processes
pkill -f "node"

# Or by port (example: 3000)
lsof -ti:3000 | xargs kill -9
```

**Custom script:**
```bash
#!/bin/bash
# kill-node-server.sh
PORT=${1:-3000}
PID=$(lsof -ti:$PORT)
if [ -n "$PID" ]; then
    kill -9 $PID
    echo "Killed process on port $PORT"
else
    echo "No process on port $PORT"
fi
```

---

### Python (Flask/Django/FastAPI)

**PowerShell:**
```powershell
# Kill all python.exe processes running web server
Get-Process -Name python -ErrorAction SilentlyContinue | 
    Where-Object { $_.CommandLine -like '*runserver*' -or $_.CommandLine -like '*uvicorn*' } | 
    Stop-Process -Force
```

**Bash:**
```bash
# Kill Flask/Django
pkill -f "python.*runserver"
pkill -f "flask run"

# Kill FastAPI/Uvicorn
pkill -f "uvicorn"

# Or by port (example: 8000)
lsof -ti:8000 | xargs kill -9
```

---

### Java (Spring Boot/Tomcat)

**PowerShell:**
```powershell
# Kill Java processes running web server
Get-Process -Name java -ErrorAction SilentlyContinue | 
    Where-Object { $_.CommandLine -like '*spring-boot*' -or $_.CommandLine -like '*tomcat*' } | 
    Stop-Process -Force
```

**Bash:**
```bash
# Kill Spring Boot
pkill -f "java.*spring-boot"

# Kill Tomcat
pkill -f "catalina"

# Or by port (example: 8080)
lsof -ti:8080 | xargs kill -9
```

---

### Ruby (Rails)

**Bash:**
```bash
# Kill Rails server
pkill -f "rails server"
pkill -f "puma"

# Or by port (example: 3000)
lsof -ti:3000 | xargs kill -9
```

**PowerShell:**
```powershell
# Kill Ruby processes
Get-Process -Name ruby -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## Verification

### Verify Clean State

**Check if port is free:**

**PowerShell:**
```powershell
# Check if port is in use (example: 9091)
Test-NetConnection -ComputerName localhost -Port 9091
# Should fail if port is free
```

**Bash:**
```bash
# Check if port is in use (example: 9091)
lsof -i:9091
# Should return nothing if port is free

# Or
netstat -an | grep 9091
# Should return nothing if port is free
```

---

### Expected Output

**Success (PowerShell):**
```
Successfully terminated 2 dotnet.exe process(es)
```

**Success (Bash):**
```
Killed process(es): 12345, 67890
```

**No servers running:**
```
No processes found
```
or (no output)

---

## Error Handling

### Access Denied

If "Access Denied" error occurs:

**Windows:**
```powershell
# Run PowerShell as Administrator
Start-Process powershell -Verb runAs
```

**Linux/Mac:**
```bash
# Use sudo
sudo pkill -f "process-name"
```

### Multiple Server Types

If running multiple server types (e.g., backend + frontend):

```bash
# Kill all common web server processes
pkill -f "dotnet"
pkill -f "node"
pkill -f "python.*runserver"
pkill -f "java.*spring"
```

### Port-Based Cleanup

If unsure what process is using a port:

**Find process by port:**

**Windows:**
```powershell
# Find process using port 9091
netstat -ano | findstr :9091
# Note the PID (last column)

# Kill by PID
taskkill /PID <pid> /F
```

**Linux/Mac:**
```bash
# Find and kill process on port 9091
lsof -ti:9091 | xargs kill -9
```

---

## Rationale

### Why This Step is Critical

1. **Port Conflicts:**
   ```
   ERROR: Address already in use: 9091
   ```
   Prevents build/run failures from port conflicts

2. **File Locks:**
   ```
   ERROR: Cannot access file 'app.dll' - in use by another process
   ```
   Ensures files can be rebuilt without conflicts

3. **Stale Code:**
   - Old server continues serving outdated code
   - Tests fail because changes not reflected
   - Debugging shows old behavior

4. **Resource Leaks:**
   - Memory accumulation from multiple instances
   - Database connection exhaustion
   - Thread pool saturation

---

## Integration with Agents

### When to Execute

**ALWAYS before:**
- Task implementation (modifying code)
- Refactoring operations
- Running tests
- Build operations

**Template Usage in Prompts:**

```markdown
### Step 0: Server Cleanup

**Kill running servers:**
[Language-specific command from this document]

**Verify clean state:**
[Port check command from this document]
```

---

## Automation

### Git Hook (Pre-Push)

Create `.git/hooks/pre-push`:

```bash
#!/bin/bash
echo "Killing development servers..."

# Kill all common dev servers
pkill -f "dotnet"
pkill -f "node"
pkill -f "python.*runserver"

echo "Servers stopped. Proceeding with push."
```

Make executable:
```bash
chmod +x .git/hooks/pre-push
```

### VS Code Task

Add to `.vscode/tasks.json`:

```json
{
    "label": "Kill Dev Servers",
    "type": "shell",
    "command": "pkill -f 'dotnet|node|python.*runserver'",
    "windows": {
        "command": "Get-Process -Name dotnet,node,python -ErrorAction SilentlyContinue | Stop-Process -Force"
    },
    "group": "none"
}
```

### Makefile

```makefile
.PHONY: killservers
killservers:
	@echo "Killing development servers..."
	@pkill -f "dotnet" || true
	@pkill -f "node" || true
	@pkill -f "python.*runserver" || true
	@echo "Done."
```

Usage:
```bash
make killservers
```

---

## Project-Specific Customization

### Customize for Your Project

**Replace placeholders:**
- `YourProjectName` → Your actual project name
- `9091` → Your actual port number
- Add/remove server types based on your stack

**Example for multi-tier application:**

```powershell
# Kill backend (.NET)
Get-Process -Name dotnet -ErrorAction SilentlyContinue | Stop-Process -Force

# Kill frontend (Node.js)
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Kill database (if local)
Get-Process -Name postgres -ErrorAction SilentlyContinue | 
    Where-Object { $_.CommandLine -like '*dev-database*' } | 
    Stop-Process -Force
```

---

## Best Practices

1. **Always kill before changes** - Prevents 90% of "why doesn't it work" issues
2. **Verify clean state** - Don't assume kill succeeded
3. **Document your ports** - Know what runs where
4. **Use automation** - Create aliases/scripts for your stack
5. **Include in workflow** - Make it muscle memory

---

## Troubleshooting

**Q: Servers won't stop?**
A: Use force kill (`-Force` in PowerShell, `-9` in bash)

**Q: Still getting port conflict after killing?**
A: Wait 2-3 seconds for port release, or restart network service

**Q: Don't know what server is running?**
A: Use port check commands to identify process

**Q: Killing wrong processes?**
A: Be more specific in process filtering (use full path or command line match)

---

## Summary

| Platform | Command | Purpose |
|----------|---------|---------|
| .NET | `pkill -f "dotnet"` | Kill Kestrel server |
| Node.js | `pkill -f "node"` | Kill Node server |
| Python | `pkill -f "python.*runserver"` | Kill Flask/Django |
| Java | `pkill -f "java.*spring"` | Kill Spring Boot |
| Port-based | `lsof -ti:PORT \| xargs kill -9` | Kill by port |

**Remember:** Clean server state = predictable behavior
