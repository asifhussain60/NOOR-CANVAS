# GitHub Copilot - Machine Switch Automation Guide

## Quick Reference for Copilot Agent

This guide helps me (GitHub Copilot) quickly switch database connection strings when the user switches between Windows and macOS.

---

## **User Commands**

### When user says:
- "Switch to Mac" / "I'm on my MacBook" / "Using Mac now"
- "Switch to Windows" / "Back on Windows" / "Using Windows"

---

## **Files to Update (8 files)**

### Core Configuration
1. `config/sharedsettings.json`

### Main Application  
2. `SPA/NoorCanvas/appsettings.json`
3. `SPA/NoorCanvas/appsettings.Development.json`
4. `SPA/NoorCanvas/appsettings.Production.json`

### HostProvisioner Console
5. `Tools/HostProvisioner/HostProvisioner/appsettings.json`
6. `Tools/HostProvisioner/HostProvisioner/appsettings.Development.json`
7. `Tools/HostProvisioner/HostProvisioner/appsettings.Production.json`

### HostProvisioner WinForms
8. `Tools/HostProvisioner/HostProvisioner.WinForms/appsettings.json`
9. `Tools/HostProvisioner/HostProvisioner.WinForms/appsettings.Development.json`
10. `Tools/HostProvisioner/HostProvisioner.WinForms/appsettings.Production.json`
11. `Tools/HostProvisioner/HostProvisioner.WinForms/app.config`

### Deployment Scripts
12. `Scripts/publish-hostprovisioner.ps1`

---

## **Connection String Patterns**

### Windows (AHHOME)
```
Server=AHHOME;Database=KSESSIONS_DEV;...
Server=AHHOME;Database=KSESSIONS;...
```

### macOS (IP Address)
```
Server=192.168.1.58,1433;Database=KSESSIONS_DEV;...
Server=192.168.1.58,1433;Database=KSESSIONS;...
```

---

## **Automation Steps**

### Step 1: Identify Target Platform
- **Windows** → Use `AHHOME`
- **macOS** → Use `192.168.1.58,1433`

### Step 2: Use replace_string_in_file Tool
For each file, replace:
- `Server=AHHOME` → `Server=192.168.1.58,1433` (Mac)
- `Server=192.168.1.58,1433` → `Server=AHHOME` (Windows)

### Step 3: Verify Changes
Run: `git diff` to show user what changed

### Step 4: Important Reminder
**DO NOT COMMIT** - These are local changes only
User should keep Git repository with `AHHOME` as default

---

## **Quick Script Template**

### Switch to Mac
```bash
# Replace in all 12 files
AHHOME → 192.168.1.58,1433
```

### Switch to Windows  
```bash
# Replace in all 12 files
192.168.1.58,1433 → AHHOME
```

---

## **Example Response to User**

When user says "Switch to Mac":

```
✅ Switching connection strings to macOS (192.168.1.58,1433)

Updated 12 files:
- config/sharedsettings.json
- SPA/NoorCanvas/appsettings*.json (3 files)
- Tools/HostProvisioner configs (8 files)
- Scripts/publish-hostprovisioner.ps1

🔍 Review changes with: git diff
⚠️  Do NOT commit these changes - keep them local

Ready to run on macOS!
```

---

## **Database Details**

- **Server IP**: 192.168.1.58
- **Port**: 1433
- **Dev Database**: KSESSIONS_DEV
- **Prod Database**: KSESSIONS
- **User**: sa
- **Password**: adf4961glo

---

## **File-Specific Notes**

### `Scripts/publish-hostprovisioner.ps1`
- Update line ~148: `$connectionString = "Server=..."`
- Update line ~154: Display message showing server

### `app.config` (WinForms)
- Two keys: `ConnectionString_Development` and `ConnectionString_Production`
- Both need updating

---

## **Edge Cases**

### If files already have correct values
- Still show confirmation message
- Mention "Already configured for [platform]"

### If user is already on target platform
- Detect current state by checking connection string
- Inform user: "Already configured for [platform]"

---

## **Testing After Switch**

Suggest user run:
```bash
cd SPA/NoorCanvas
dotnet run
# Check log output for: "Connection string: Server=[expected-server]"
```

---

## **Rollback**

If user wants to undo:
```bash
git restore config/sharedsettings.json
git restore SPA/NoorCanvas/appsettings*.json
git restore Tools/HostProvisioner/
git restore Scripts/publish-hostprovisioner.ps1
```

---

**Last Updated**: October 15, 2025  
**Repository**: NOOR-CANVAS (development branch)
