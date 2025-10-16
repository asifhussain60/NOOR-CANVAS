# NOOR Canvas Mac Commands

## ✅ Available Commands

After running the setup, you now have the following commands available on your Mac:

### `nc` - Launch NOOR Canvas
Launches the NOOR Canvas application with Kestrel server (equivalent to Windows `nc.ps1`)

```bash
nc              # Launch the application
nc --help       # Show help
```

**What it does:**
- Kills any existing NOOR Canvas processes
- Clears ports 9090 and 9091
- Builds the application in Release mode
- Launches with Kestrel on:
  - HTTP: http://localhost:9090
  - HTTPS: https://localhost:9091

### `ncb` - Build and Launch
Builds and launches NOOR Canvas (equivalent to Windows `ncb.ps1`)

```bash
ncb             # Build and launch
ncb --help      # Show help
```

**What it does:**
- Cleans up running processes
- Performs a clean build in Release mode
- Launches the application with Kestrel

## ❌ Not Available on Mac

### `nct` - Token Generator
The `nct` command is NOT currently available on Mac because it:
- Uses Windows-specific PowerShell cmdlets
- Requires complex .NET process management
- Runs the HostProvisioner tool with specific Windows paths

**Alternative for Mac:**
You can run the HostProvisioner manually:

```bash
cd /Users/asifhussain/NOOR-CANVAS/Tools/HostProvisioner/HostProvisioner
dotnet run -- create --session-id 215 --created-by "Mac User" --dry-run false --create-user
```

## 📋 Setup Instructions

If you need to set up these commands on a new terminal or different Mac:

```bash
cd /Users/asifhussain/NOOR-CANVAS
bash Workspaces/Global/setup-mac-aliases.sh
source ~/.zshrc
```

## 🔧 Manual Usage

If you prefer not to use aliases, you can run the scripts directly:

```bash
# Launch
bash /Users/asifhussain/NOOR-CANVAS/Workspaces/Global/nc.sh

# Build and launch
bash /Users/asifhussain/NOOR-CANVAS/Workspaces/Global/ncb.sh
```

## 📝 Notes

- These scripts use **bash** instead of PowerShell
- They use **lsof** and **kill** for process management (Mac-native tools)
- Connection strings are already configured for Mac (192.168.1.158,1433)
- Scripts are located in `Workspaces/Global/` directory
- Aliases are added to `~/.zshrc` for zsh shell

## 🆚 Differences from Windows

| Feature | Windows (.ps1) | Mac (.sh) |
|---------|---------------|-----------|
| Process killing | Get-Process, Stop-Process | pkill, kill -9 |
| Port checking | netstat -ano \| findstr | lsof -ti |
| Path format | D:\PROJECTS\NOOR CANVAS | /Users/asifhussain/NOOR-CANVAS |
| Color output | Write-Host -ForegroundColor | echo -e with ANSI codes |
| Script extension | .ps1 | .sh |

## ✨ Quick Start

```bash
# Reload your shell configuration
source ~/.zshrc

# Launch NOOR Canvas
ncb
```

The application will be available at:
- https://localhost:9091 (HTTPS - Primary)
- http://localhost:9090 (HTTP - Alternative)
