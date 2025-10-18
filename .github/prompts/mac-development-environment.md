# GitHub Copilot: Mac Development Environment Setup

## Context Recognition

When the user mentions:
- "I'm on Mac" / "Using my MacBook" / "Switched to Mac"
- "On macOS" / "Working on my Mac"
- Connection errors or "can't connect to AHHOME"
- Command not found errors for Windows tools

**Action:** Recognize this as a Mac environment and apply Mac-specific guidance.

## Key Mac-Specific Issues and Solutions

### 1. Missing Development Tools

**Symptom:** `xcode-select: note: No developer tools were found`

**Solution:**
```bash
xcode-select --install
```

**Explanation:** Mac requires Xcode Command Line Tools for Git and other development utilities. This is a one-time installation.

### 2. .NET Version Mismatch

**Symptom:** 
- `The following frameworks were found: 9.0.x`
- `App requires: Microsoft.NETCore.App, version 8.0.0`

**Solution:**
```bash
brew install dotnet@8
echo 'export PATH="/opt/homebrew/opt/dotnet@8/bin:$PATH"' >> ~/.zshrc
echo 'export DOTNET_ROOT="/opt/homebrew/opt/dotnet@8/libexec"' >> ~/.zshrc
source ~/.zshrc
```

**Explanation:** Project targets .NET 8.0. Mac may have only .NET 9.0 installed. Both can coexist.

### 3. Missing Debug Models (Build Errors)

**Symptom:** 
- `error CS0234: The type or namespace name 'Debug' does not exist in the namespace 'NoorCanvas.Models'`
- `error CS0246: The type or namespace name 'IDebugAction' could not be found`

**Solution:** These models were created and committed. If missing, they need to be recreated:

**File:** `SPA/NoorCanvas/Models/Debug/IDebugAction.cs`
**File:** `SPA/NoorCanvas/Models/Debug/DebugAction.cs`

**Explanation:** Recent code changes reference Debug models that weren't initially committed. These are now part of the codebase.

### 4. Database Connection Errors

**Symptom:**
- Cannot connect to database
- "Server not found: AHHOME"

**Solution:**
```bash
# Update connection strings to use IP address
sed -i '' 's/Server=AHHOME/Server=192.168.1.158,1433/g' config/sharedsettings.local.json
sed -i '' 's/Server=AHHOME/Server=192.168.1.158,1433/g' SPA/NoorCanvas/appsettings.Development.json
sed -i '' 's/Server=AHHOME/Server=192.168.1.158,1433/g' SPA/NoorCanvas/appsettings.json
```

**Explanation:** Windows uses `AHHOME` (localhost SQL Server). Mac must use IP address to connect to remote SQL Server on Windows machine.

**⚠️ CRITICAL:** These changes are LOCAL only - do NOT commit to Git!

### 5. PowerShell Scripts Don't Work

**Symptom:**
- `nc`, `nct`, `ncb` commands not found
- `.ps1` files can't be executed

**Solution:** Mac requires bash shell scripts, not PowerShell scripts.

**Created Mac equivalents:**
- `Workspaces/Global/nc.sh` - Launch app
- `Workspaces/Global/ncb.sh` - Build and launch
- `Workspaces/Global/setup-mac-aliases.sh` - Setup aliases

**Setup:**
```bash
cd /Users/asifhussain/NOOR-CANVAS
bash Workspaces/Global/setup-mac-aliases.sh
source ~/.zshrc
```

**Explanation:** PowerShell is Windows-specific. Mac uses bash/zsh. The shell scripts provide equivalent functionality.

### 6. Application Keeps Shutting Down

**Symptom:**
- App starts then immediately shows "Application is shutting down"
- `^C` appears in logs
- App exits when running other commands

**Solution:** Use `nohup` to run in true background:
```bash
cd /Users/asifhussain/NOOR-CANVAS/SPA/NoorCanvas
nohup dotnet run --configuration Release --no-build --urls "https://localhost:9091" > /tmp/noorcanvas.log 2>&1 &
```

**Explanation:** Running commands in the same terminal session can interrupt background processes. `nohup` prevents this.

**Check if running:**
```bash
lsof -ti:9091  # Returns process ID if running
```

**View logs:**
```bash
tail -f /tmp/noorcanvas.log
```

**Stop application:**
```bash
kill $(lsof -ti:9091)
```

### 7. HTTPS Certificate Not Trusted

**Symptom:**
- Browser shows "Your connection is not private"
- Certificate warning in browser

**Solution:**
```bash
dotnet dev-certs https --trust
```

**Explanation:** Development HTTPS certificate needs to be trusted by macOS keychain.

### 8. Blank Screen in Browser

**Symptom:**
- Browser opens but shows blank/white screen
- No visible content

**Possible Causes & Solutions:**

1. **Certificate not trusted**
   ```bash
   dotnet dev-certs https --trust
   ```

2. **Browser cache issue**
   - Hard refresh: Cmd+Shift+R

3. **Application not fully started**
   - Wait 5-10 seconds after starting
   - Check logs: `tail -f /tmp/noorcanvas.log`

4. **JavaScript error**
   - Open browser console: Cmd+Option+I
   - Check for errors in Console tab

## Automated Copilot Responses

### When user says: "Switch to Mac" or "I'm on my Mac"

**Suggested Response:**
```markdown
I'll help you set up NOOR Canvas for Mac. Here's what we need to do:

1. Update connection strings to use IP address (192.168.1.158,1433)
2. Ensure .NET 8.0 SDK is installed
3. Set up Mac shell script aliases (nc, ncb)
4. Trust HTTPS certificate

Let me update the connection strings for you...
```

**Actions:**
1. Update `config/sharedsettings.local.json`
2. Update `SPA/NoorCanvas/appsettings.Development.json`
3. Update `SPA/NoorCanvas/appsettings.json`
4. Replace `Server=AHHOME` with `Server=192.168.1.158,1433`
5. Verify .NET 8.0 is installed
6. Run setup-mac-aliases.sh if aliases not set up

### When user says: "Can't run the app" or "Build errors" on Mac

**Check for:**
1. Xcode Command Line Tools installed
2. .NET 8.0 SDK installed
3. Debug models exist
4. Connection string uses IP address
5. Application running on correct port

**Diagnostic Commands:**
```bash
# Check .NET version
dotnet --version

# Check if app running
lsof -ti:9091

# Test database connection
sqlcmd -S 192.168.1.158,1433 -U sa -P adf4961glo -d KSESSIONS_DEV -Q "SELECT 1" -W

# Build project
cd /Users/asifhussain/NOOR-CANVAS/SPA/NoorCanvas
dotnet build --configuration Release
```

### When user says: "Application not loading" or "Blank screen"

**Troubleshooting Steps:**
1. Verify app is running: `lsof -ti:9091`
2. Check logs: `tail -f /tmp/noorcanvas.log`
3. Trust certificate: `dotnet dev-certs https --trust`
4. Hard refresh browser: Cmd+Shift+R
5. Check browser console for JavaScript errors: Cmd+Option+I

## Platform Detection

**Indicators of Mac environment:**
- Terminal shows `zsh` or `bash`
- Paths like `/Users/username/...`
- Commands like `brew`, `open`, `lsof`
- Errors mentioning `xcode-select`

**Indicators of Windows environment:**
- Terminal shows `PowerShell` or `cmd`
- Paths like `D:\PROJECTS\...` or `C:\Users\...`
- Commands like `Get-Process`, `netstat`
- PowerShell cmdlets

## Files That Must NOT Be Committed (Git Ignored)

When working on Mac, these files contain platform-specific changes:
- `config/sharedsettings.local.json` (IP-based connection)
- `SPA/NoorCanvas/appsettings.Development.json` (IP connection)
- `SPA/NoorCanvas/appsettings.json` (IP connection)

**Always remind user:** "⚠️ Keep these connection string changes LOCAL - do NOT commit to Git!"

## Cross-Platform Compatibility Checklist

✅ **Safe to edit (won't break Windows):**
- C# code files (*.cs)
- Razor components (*.razor)
- Project files (*.csproj)
- Shared configuration (structure, not values)
- Documentation files

❌ **Platform-specific (keep separate):**
- Shell scripts (.sh for Mac, .ps1 for Windows)
- Local connection strings
- PATH configurations
- Platform-specific tools

## Quick Reference Commands

### Mac
```bash
# Start app
nc

# Build and start
ncb

# Check if running
lsof -ti:9091

# View logs
tail -f /tmp/noorcanvas.log

# Kill app
kill $(lsof -ti:9091)

# Database connection test
sqlcmd -S 192.168.1.158,1433 -U sa -P adf4961glo -d KSESSIONS_DEV -Q "SELECT 1" -W
```

### Windows
```powershell
# Start app
nc

# Build and start
ncb

# Check if running
netstat -ano | findstr :9091

# View logs (in Visual Studio or terminal output)

# Kill app
Get-Process -Name "dotnet" | Where-Object {$_.CommandLine -like "*NoorCanvas*"} | Stop-Process
```

## Summary for Copilot

When helping with Mac setup:
1. **Recognize the environment** (Mac vs Windows indicators)
2. **Apply Mac-specific solutions** (shell scripts, IP connections, nohup)
3. **Maintain Windows compatibility** (don't modify core code, only local configs)
4. **Remind about Git** (don't commit local connection strings)
5. **Use Mac tools** (lsof, kill, sed, bash)
6. **Reference documentation** (.copilot/MAC_SETUP_GUIDE.md, .copilot/MAC_COMMANDS.md)

The goal is seamless development on both platforms without breaking either one!
