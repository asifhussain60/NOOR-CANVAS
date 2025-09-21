# NOOR Canvas Guard Rails System

## Protection Against Directory Context Issues (Issue-80)

**Created:** September 14, 2025  
**Purpose:** Comprehensive protection system to prevent PowerShell profile directory conflicts

---

## Overview

The NOOR Canvas project now includes multiple layers of protection to prevent Issue-80 type failures where PowerShell profile directory changes interfere with dotnet command execution.

## Guard Rail Components

### 1. Issue-80 Protection Guard (`.guards\Issue-80-Protection.ps1`)

**Purpose:** Primary validation and monitoring system for directory context safety.

**Usage:**

```powershell
# Validate current environment (default)
.\.guards\Issue-80-Protection.ps1

# Validate with strict mode (exits with error on issues)
.\.guards\Issue-80-Protection.ps1 -Mode validate -StrictMode

# Auto-fix detectable issues
.\.guards\Issue-80-Protection.ps1 -Mode fix

# Continuous monitoring mode
.\.guards\Issue-80-Protection.ps1 -Mode monitor
```

**Checks:**

- ✅ Directory context validation (working directory vs. project path)
- ✅ PowerShell profile interference detection
- ✅ Dotnet command execution safety
- ✅ Port availability validation
- ✅ Project file accessibility

### 2. Safe Dotnet Wrapper (`.guards\safe-dotnet.ps1`)

**Purpose:** Wrapper for dotnet commands with built-in safety checks.

**Usage:**

```powershell
# Safe execution with validation
.\.guards\safe-dotnet.ps1 build
.\.guards\safe-dotnet.ps1 run --urls "https://localhost:9091;http://localhost:9090"

# Force execution despite safety warnings
.\.guards\safe-dotnet.ps1 run -Force
```

**Features:**

- ✅ Pre-execution environment validation
- ✅ Automatic project path injection for safety
- ✅ Clear error messages with safe alternatives
- ✅ Force override capability for advanced users

### 3. Enhanced nc.ps1 Global Command

**Purpose:** Updated global nc command with built-in Issue-80 protection.

**Safety Features Added:**

- ✅ Directory context validation before `Set-Location`
- ✅ Project file existence verification
- ✅ Explicit project path usage in `dotnet run` commands
- ✅ Fallback to absolute paths when relative paths fail
- ✅ Enhanced error messages with Issue-80 context

### 4. VS Code Task Integration

**Purpose:** Tasks.json integration for automated guard execution.

**Available Task:**

```json
{
  "label": "validate-issue-67-protection",
  "type": "shell",
  "command": "powershell.exe",
  "args": [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    "${workspaceFolder}/.guards/Issue-67-Protection.ps1",
    "-Mode",
    "validate",
    "-StrictMode"
  ],
  "group": "test"
}
```

## Protection Layers

### Layer 1: Prevention

- **nc.ps1 Safety**: Enhanced global commands with explicit path validation
- **Profile Awareness**: Detection of PowerShell profile interference

### Layer 2: Validation

- **Pre-execution Checks**: Environment validation before critical operations
- **Directory Context Verification**: Ensures commands run from correct paths

### Layer 3: Auto-correction

- **Safe Dotnet Wrapper**: Automatically corrects unsafe dotnet commands
- **Fallback Mechanisms**: Switches to absolute paths when relative paths fail

### Layer 4: Monitoring

- **Continuous Validation**: Monitor mode for detecting environment changes
- **Issue Detection**: Real-time alerts for potential Issue-80 conditions

## Quick Reference Commands

### For Developers

```powershell
# Check if environment is safe for dotnet commands
.\.guards\Issue-80-Protection.ps1

# Run application with full protection
.\.guards\safe-dotnet.ps1 run --urls "https://localhost:9091;http://localhost:9090"

# Use enhanced nc command (now with built-in protection)
nc
```

### For CI/CD

```powershell
# Strict validation (fails build on issues)
.\.guards\Issue-80-Protection.ps1 -Mode validate -StrictMode

# Auto-fix environment then build
.\.guards\Issue-80-Protection.ps1 -Mode fix
dotnet build
```

### For Troubleshooting

```powershell
# Detailed validation with verbose output
.\.guards\Issue-80-Protection.ps1 -Verbose

# Monitor for changes causing issues
.\.guards\Issue-80-Protection.ps1 -Mode monitor
```

## Integration with Existing Workflow

### Before This Update

```powershell
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
dotnet run --urls="https://localhost:9091;http://localhost:9090"
# ❌ Could fail if PowerShell profile changed directory
```

### After Guard Rails Implementation

```powershell
# Method 1: Use enhanced nc command
nc
# ✅ Built-in Issue-80 protection

# Method 2: Use safe wrapper
.\.guards\safe-dotnet.ps1 run --urls "https://localhost:9091;http://localhost:9090"
# ✅ Automatic validation and path correction

# Method 3: Manual with validation
.\.guards\Issue-80-Protection.ps1
dotnet run --project "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\NoorCanvas.csproj" --urls="https://localhost:9091;http://localhost:9090"
# ✅ Explicit path always works
```

## Maintenance

### Regular Checks

- Run validation guard weekly: `.\.guards\Issue-80-Protection.ps1`
- Update guard scripts when project structure changes
- Verify guard functionality after PowerShell profile updates

### Monitoring

- Use monitor mode during development sessions prone to directory changes
- Include guard validation in CI/CD pipelines
- Log guard results for trend analysis

---

## Resolution Summary

This guard rail system comprehensively addresses the root cause of Issue-80:

1. **Prevents** directory context issues through enhanced nc.ps1 validation
2. **Detects** PowerShell profile interference before it causes problems
3. **Corrects** unsafe dotnet command execution automatically
4. **Monitors** environment for changes that could reintroduce the issue

The system maintains backward compatibility while adding multiple layers of protection to ensure Issue-80 type failures cannot recur.
