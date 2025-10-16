# Quick Commands Reference for GitHub Copilot

## User Intent Detection

### Switch to Mac
**User phrases:**
- "Switch to Mac"
- "I'm on my MacBook"
- "Using Mac now"
- "Working on macOS"
- "On my Mac"

**Action:** Replace `AHHOME` → `192.168.1.58,1433` in all config files

---

### Switch to Windows
**User phrases:**
- "Switch to Windows"
- "Back on Windows"
- "Using Windows"
- "On my PC"
- "Windows machine"

**Action:** Replace `192.168.1.58,1433` → `AHHOME` in all config files

---

## Files Pattern (Regex for bulk updates)

### Find Pattern (Windows → Mac)
```regex
Server=AHHOME
```

### Replace Pattern (Windows → Mac)
```regex
Server=192.168.1.58,1433
```

### Find Pattern (Mac → Windows)
```regex
Server=192\.168\.1\.58,1433
```

### Replace Pattern (Mac → Windows)
```regex
Server=AHHOME
```

---

## Verification Commands

After switching, suggest user runs:
```powershell
# Windows
cd SPA\NoorCanvas
dotnet run
# Look for: "Connection string: Server=AHHOME..."

# macOS
cd SPA/NoorCanvas
dotnet run
# Look for: "Connection string: Server=192.168.1.58,1433..."
```

---

## Git Workflow

### Check Current State
```bash
git status
git diff config/sharedsettings.json
```

### Reminder
Always tell user: **"Keep these changes local - do NOT commit to Git"**

---

## File List (Copy-Paste Ready)

For replace_string_in_file operations:

1. `d:\PROJECTS\NOOR CANVAS\config\sharedsettings.json`
2. `d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\appsettings.json`
3. `d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\appsettings.Development.json`
4. `d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\appsettings.Production.json`
5. `d:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner\appsettings.json`
6. `d:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner\appsettings.Development.json`
7. `d:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner\appsettings.Production.json`
8. `d:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner.WinForms\appsettings.json`
9. `d:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner.WinForms\appsettings.Development.json`
10. `d:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner.WinForms\appsettings.Production.json`
11. `d:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner.WinForms\app.config`
12. `d:\PROJECTS\NOOR CANVAS\Scripts\publish-hostprovisioner.ps1`
