# ncdeploy - Quick Reference

## Run from Any Directory

The `ncdeploy.ps1` script can now be run from **any directory**. It automatically detects the workspace location using `$PSScriptRoot`.

## Usage Options

### Option 1: Direct Execution (No Setup Required)

```powershell
# From workspace root
.\Scripts\ncdeploy.ps1

# From any other directory (full path)
& "D:\PROJECTS\NOOR CANVAS\Scripts\ncdeploy.ps1"

# With parameters
& "D:\PROJECTS\NOOR CANVAS\Scripts\ncdeploy.ps1" -SkipMerge
```

### Option 2: Global Command (One-Time Setup)

```powershell
# 1. Run setup script once
.\Scripts\setup-ncdeploy-alias.ps1

# 2. Reload profile (or restart PowerShell)
. $PROFILE

# 3. Use 'ncdeploy' from anywhere
ncdeploy
ncdeploy -SkipMerge
ncdeploy -SkipIIS
```

## What the Script Does

1. ✓ **Detects workspace automatically** - shows path in deployment banner
2. ✓ **Merges development → master** - ensures latest code deployed
3. ✓ **Builds in Release mode** - optimized production build
4. ✓ **Preserves configuration** - keeps appsettings.json during clean deployment
5. ✓ **Validates deployment** - checks environment + database configuration
6. ✓ **Deploys both applications** - NoorCanvas + HostProvisioner
7. ✓ **Returns to development** - leaves you where you started

## Parameters

- `-SkipMerge` - Deploy from current master without merging development
- `-SkipBuild` - Deploy existing build output (skip compilation)
- `-SkipIIS` - Skip IIS app pool operations
- `-AutoMerge` - Continue deployment even with uncommitted changes (⚠ use with caution)
- `-AppPool <name>` - Specify IIS application pool name (default: "NoorCanvas")

## Deployment Banner

```
========================================
  NoorCanvas Production Deployment
  Target: D:\Websites\NOOR-CANVAS
  Database: KSESSIONS (Production)
  Workspace: D:\PROJECTS\NOOR CANVAS
  Time: 2025-10-16_14-38-28
========================================
```

The **Workspace** line confirms the script found the correct project location regardless of where you ran it from.

## Rollback

If deployment fails, use git checkpoint tags:

```powershell
# List available checkpoints
git tag --list "checkpoint/deploy/*" --sort=-creatordate

# Rollback to specific checkpoint
git reset --hard checkpoint/deploy/2025-10-16_1438
```

## Validation

The script validates production configuration before completing:
- ✓ NoorCanvas web.config has Production environment
- ✓ NoorCanvas appsettings.json has KSESSIONS database
- ✓ HostProvisioner appsettings.Production.json has KSESSIONS database  
- ⚠ ASPNETCORE_ENVIRONMENT system variable (warns if not set)

If validation fails, deployment is **halted** with remediation steps.
