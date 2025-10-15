# Local Configuration Overrides

## Purpose
This directory contains **local override** configuration files that are **NOT tracked in Git**. This allows developers to use machine-specific settings without affecting the shared repository configuration.

## Use Case: Cross-Platform Development

### The Problem
- **Windows developers** want to use `AHHOME` (local SQL Server instance) for faster connections
- **macOS developers** need to use `192.168.1.58,1433` (network IP) to connect remotely
- We can't have both in the same committed configuration file

### The Solution: Local Overrides

## Files

### `sharedsettings.local.json` (Git-ignored)
**For Windows developers only**. This file overrides `sharedsettings.json` with local server names.

**Windows developers should create this file:**
```json
{
    "_Comment": "Local overrides for Windows development. Use AHHOME for faster local connections.",
    "ConnectionStrings": {
        "Development": "Server=AHHOME;Database=KSESSIONS_DEV;User ID=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=True;Encrypt=False;",
        "Production": "Server=AHHOME;Database=KSESSIONS;User ID=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=True;Encrypt=False;"
    }
}
```

**macOS developers should NOT create this file** - they'll use the default `sharedsettings.json` with IP addresses.

## How It Works

### Configuration Priority (ASP.NET Core)
1. `appsettings.json` (base configuration)
2. `appsettings.{Environment}.json` (e.g., Development, Production)
3. `appsettings.local.json` (local overrides - **highest priority**)
4. Environment variables
5. Command-line arguments

### For Windows Developers

**Step 1: Verify the local override file exists**
```powershell
# Check if file exists
Test-Path "config\sharedsettings.local.json"
```

If it doesn't exist, it was already created for you in this directory.

**Step 2: Run the application**
```powershell
cd SPA\NoorCanvas
dotnet run
```

The app will use `AHHOME` from `appsettings.local.json` instead of `192.168.1.58,1433`.

### For macOS Developers

**Do nothing special!** 

When you clone the repository on macOS:
- `appsettings.local.json` won't exist (it's git-ignored)
- The app will use the default IP address `192.168.1.58,1433`
- Connection will work over the network

## Verification

### Check What Connection String Is Being Used

**Windows:**
```powershell
cd SPA\NoorCanvas
dotnet run
# Look for the log line showing connection string
# Should show: Server=AHHOME;Database=KSESSIONS_DEV...
```

**macOS:**
```bash
cd SPA/NoorCanvas
dotnet run
# Look for the log line showing connection string
# Should show: Server=192.168.1.58,1433;Database=KSESSIONS_DEV...
```

## Files Tracked in Git vs Local

### ✅ Tracked in Git (committed)
- `sharedsettings.json` - Uses IP address `192.168.1.58,1433`
- `appsettings.json` - Uses IP address `192.168.1.58,1433`
- `appsettings.Development.json` - Uses IP address `192.168.1.58,1433`
- `appsettings.Production.json` - Uses IP address `192.168.1.58,1433`

### ❌ NOT Tracked in Git (local only)
- `sharedsettings.local.json` - Windows-specific overrides
- `appsettings.local.json` - Windows-specific overrides

## Best Practices

### When to Use Local Overrides
✅ Machine-specific settings (local server names, paths, ports)  
✅ Developer-specific debugging settings  
✅ Local database connections  
✅ Testing configurations  

### When NOT to Use Local Overrides
❌ Settings that should be shared with the team  
❌ Production configuration  
❌ Feature flags that affect all developers  
❌ API endpoints or shared resources  

## Troubleshooting

### "Can't connect to database on Windows"
**Problem**: `appsettings.local.json` doesn't exist  
**Solution**: The file should already exist in `SPA/NoorCanvas/` and `config/`. If not, create it following the template above.

### "macOS can't connect"
**Problem**: `appsettings.local.json` exists on macOS  
**Solution**: Delete it. macOS should use the default IP address configuration.
```bash
rm config/sharedsettings.local.json
rm SPA/NoorCanvas/appsettings.local.json
```

### "Changes to appsettings.local.json being tracked by Git"
**Problem**: File shouldn't be in Git  
**Solution**: It's already in `.gitignore`. If Git is tracking it:
```bash
git rm --cached config/sharedsettings.local.json
git rm --cached SPA/NoorCanvas/appsettings.local.json
```

## Summary

| Platform | Connection String | File Used |
|----------|------------------|-----------|
| **Windows** | `Server=AHHOME` | `appsettings.local.json` (local, not in Git) |
| **macOS** | `Server=192.168.1.58,1433` | `appsettings.json` (in Git) |
| **Git Repository** | `Server=192.168.1.58,1433` | All committed configs use IP |

This approach gives you:
- ✅ Fast local connections on Windows (AHHOME)
- ✅ Working remote connections from macOS (IP address)
- ✅ No merge conflicts between developers
- ✅ Simple setup for both platforms
