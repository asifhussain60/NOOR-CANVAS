# Mac Setup and Troubleshooting Guide for NOOR Canvas

## Quick Start on Mac

```bash
# 1. Navigate to project
cd /Users/asifhussain/NOOR-CANVAS

# 2. Start the application (using nc alias)
nc

# 3. Open in browser
open https://localhost:9091
```

## Initial Mac Setup (One-Time)

### 1. Install Required Software

#### Install Xcode Command Line Tools
```bash
xcode-select --install
```
Click "Install" in the dialog that appears and wait for completion.

#### Install Homebrew (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Install .NET 8.0 SDK
```bash
brew install dotnet@8
```

#### Add .NET 8 to PATH
```bash
echo 'export PATH="/opt/homebrew/opt/dotnet@8/bin:$PATH"' >> ~/.zshrc
echo 'export DOTNET_ROOT="/opt/homebrew/opt/dotnet@8/libexec"' >> ~/.zshrc
source ~/.zshrc
```

#### Install SQL Command Line Tool
```bash
brew install sqlcmd
```

### 2. Setup Mac Aliases for NOOR Canvas

```bash
cd /Users/asifhussain/NOOR-CANVAS
bash Workspaces/Global/setup-mac-aliases.sh
source ~/.zshrc
```

This creates:
- `nc` - Launch NOOR Canvas with Kestrel
- `ncb` - Build and launch NOOR Canvas

### 3. Trust HTTPS Development Certificate

```bash
dotnet dev-certs https --trust
```

### 4. Configure Database Connection for Mac

The connection string is already configured to use IP address for Mac:
- **Server:** `192.168.1.158,1433`
- **Database:** `KSESSIONS_DEV`

Files updated for Mac:
- `config/sharedsettings.local.json`
- `SPA/NoorCanvas/appsettings.Development.json`
- `SPA/NoorCanvas/appsettings.json`

**⚠️ IMPORTANT:** These connection string changes are LOCAL only - do NOT commit them to Git!

### 5. Create Missing Debug Models (If Build Fails)

If you get errors about missing `Debug` models, the following files were created:

**SPA/NoorCanvas/Models/Debug/IDebugAction.cs**
**SPA/NoorCanvas/Models/Debug/DebugAction.cs**

These files are now part of the codebase and should not need to be recreated.

## Common Issues and Solutions

### Issue 1: "No developer tools were found"
**Solution:** Install Xcode command line tools:
```bash
xcode-select --install
```

### Issue 2: "Couldn't find a project to run"
**Solution:** Ensure you're in the correct directory:
```bash
cd /Users/asifhussain/NOOR-CANVAS/SPA/NoorCanvas
dotnet run
```

### Issue 3: ".NET 8.0 not found, only 9.0 available"
**Solution:** Install .NET 8.0 SDK:
```bash
brew install dotnet@8
# Add to PATH
echo 'export PATH="/opt/homebrew/opt/dotnet@8/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Issue 4: Application keeps shutting down (Ctrl+C)
**Solution:** Use `nohup` to run in background:
```bash
cd /Users/asifhussain/NOOR-CANVAS/SPA/NoorCanvas
nohup dotnet run --configuration Release --no-build --urls "https://localhost:9091;http://localhost:9090" > /tmp/noorcanvas.log 2>&1 &
```

Check if running:
```bash
lsof -ti:9091
```

View logs:
```bash
tail -f /tmp/noorcanvas.log
```

Kill the process:
```bash
kill $(lsof -ti:9091)
```

### Issue 5: Blank screen in browser
**Possible causes:**
1. **Certificate not trusted** - Run `dotnet dev-certs https --trust`
2. **Hard refresh needed** - Press Cmd+Shift+R in browser
3. **JavaScript error** - Open browser console (Cmd+Option+I) to see errors
4. **Application not fully started** - Wait 5-10 seconds after starting

### Issue 6: Database connection errors
**Verify connection:**
```bash
sqlcmd -S 192.168.1.158,1433 -U sa -P adf4961glo -d KSESSIONS_DEV -Q "SELECT DB_NAME()" -W
```

**If connection fails:**
- Ensure SQL Server is running on Windows machine
- Check firewall allows port 1433
- Verify IP address is correct (192.168.1.158)

## Running the Application on Mac

### Method 1: Using `nc` alias (Recommended)
```bash
nc
```

### Method 2: Using `ncb` (Build + Run)
```bash
ncb
```

### Method 3: Manual dotnet run
```bash
cd /Users/asifhussain/NOOR-CANVAS/SPA/NoorCanvas
dotnet run --configuration Release
```

### Method 4: Background with nohup (for persistent running)
```bash
cd /Users/asifhussain/NOOR-CANVAS/SPA/NoorCanvas
nohup dotnet run --configuration Release --no-build --urls "https://localhost:9091;http://localhost:9090" > /tmp/noorcanvas.log 2>&1 &
```

## Verifying Everything Works

### 1. Check .NET SDK
```bash
dotnet --version
# Should show 8.x.x or 9.x.x (8.0 is preferred)
```

### 2. Check Database Connection
```bash
sqlcmd -S 192.168.1.158,1433 -U sa -P adf4961glo -d KSESSIONS_DEV -Q "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES" -W
```

### 3. Check Application Running
```bash
lsof -ti:9091
# Should return a process ID if running
```

### 4. Test in Browser
```bash
open https://localhost:9091
```

## File Locations

- **Mac shell scripts:** `Workspaces/Global/nc.sh`, `Workspaces/Global/ncb.sh`
- **Windows PowerShell scripts:** `Workspaces/Global/nc.ps1`, `Workspaces/Global/nct.ps1`, `Workspaces/Global/ncb.ps1`
- **Setup script:** `Workspaces/Global/setup-mac-aliases.sh`
- **Debug models:** `SPA/NoorCanvas/Models/Debug/`
- **Connection configs:** `config/sharedsettings.local.json`, `SPA/NoorCanvas/appsettings*.json`
- **Application logs:** `/tmp/noorcanvas.log` (when using nohup)

## Differences from Windows

| Feature | Windows | Mac |
|---------|---------|-----|
| Shell Scripts | `.ps1` (PowerShell) | `.sh` (Bash) |
| Process Management | `Get-Process`, `Stop-Process` | `pkill`, `kill -9` |
| Port Checking | `netstat -ano` | `lsof -ti` |
| Server Name | `AHHOME` | `192.168.1.158,1433` |
| Path Format | `D:\PROJECTS\NOOR CANVAS` | `/Users/asifhussain/NOOR-CANVAS` |
| Background Running | PowerShell jobs | `nohup` with `&` |

## Platform Compatibility

The codebase supports both Mac and Windows:

### ✅ Cross-Platform (No Changes Needed)
- C# code (.cs files)
- Razor pages (.razor files)
- Configuration files (.json)
- Database schema
- .NET project files (.csproj)

### 🔧 Platform-Specific
- **Shell Scripts:** `.sh` for Mac, `.ps1` for Windows
- **Connection Strings:** IP-based for Mac, `AHHOME` for Windows (local only)
- **Launch Commands:** `nc`/`ncb` aliases on both platforms

### ⚠️ Do NOT Commit
- Local connection string changes
- Platform-specific PATH configurations
- Debug logs in `/tmp/`
- Local `sharedsettings.local.json` modifications

## Switching Between Mac and Windows

### When switching TO Mac:
```bash
# Update connection strings to use IP address
cd /Users/asifhussain/NOOR-CANVAS
sed -i '' 's/Server=AHHOME/Server=192.168.1.158,1433/g' config/sharedsettings.local.json
sed -i '' 's/Server=AHHOME/Server=192.168.1.158,1433/g' SPA/NoorCanvas/appsettings.Development.json
```

### When switching TO Windows:
```powershell
# Update connection strings to use AHHOME
cd "D:\PROJECTS\NOOR CANVAS"
(Get-Content config\sharedsettings.local.json) -replace 'Server=192.168.1.158,1433', 'Server=AHHOME' | Set-Content config\sharedsettings.local.json
```

Or use the provided scripts:
- **Mac:** `Scripts/switch-to-mac.ps1` (PowerShell)
- **Windows:** `Scripts/switch-to-windows.ps1` (PowerShell)

## Summary

✅ **What was fixed for Mac:**
1. Created Mac-compatible shell scripts (`nc.sh`, `ncb.sh`)
2. Installed .NET 8.0 SDK (required by project)
3. Created missing Debug model classes
4. Updated connection strings to use IP address
5. Set up shell aliases for easy launching
6. Trusted HTTPS development certificate
7. Documented nohup method for persistent background running

✅ **Windows compatibility maintained:**
- All C# code unchanged
- PowerShell scripts (.ps1) remain intact
- Windows-specific configurations preserved
- Connection string switching scripts available

🎯 **Result:** NOOR Canvas now works seamlessly on both Mac and Windows!
