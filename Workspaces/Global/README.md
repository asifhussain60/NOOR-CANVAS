# NOOR Canvas Global Commands

This folder contains global command-line utilities for the NOOR Canvas project.

## Commands Available

### `ncrun` - NOOR Canvas Application Runner
Starts the NOOR Canvas application with automatic browser opening.

#### Quick Usage
```powershell
ncrun                    # Start app on localhost:9090 and open browser
ncrun -Help              # Show detailed help
```

#### All Options
```powershell
ncrun                    # Run app on localhost:9090 and open browser
ncrun -Build             # Build first, then run
ncrun -NoBrowser         # Run without opening browser
ncrun -Port 9091         # Use custom port
ncrun -Https             # Use HTTPS (port 9091)
```

#### Examples
```powershell
ncrun                    # Quick start for testing
ncrun -Build             # Clean build and run
ncrun -Https -NoBrowser  # HTTPS without browser
ncrun -Port 8080         # Custom port
```

## Installation

### Option 1: Run from Global folder
```powershell
cd "D:\PROJECTS\NOOR CANVAS\Workspaces\Global"
.\ncrun.ps1 -Help
```

### Option 2: Add to system PATH (Recommended)
```powershell
# Run once to add to PATH
cd "D:\PROJECTS\NOOR CANVAS\Workspaces\Global"
.\setup-global-commands.ps1

# Restart your terminal, then use from anywhere:
ncrun
```

### Option 3: Remove from PATH
```powershell
cd "D:\PROJECTS\NOOR CANVAS\Workspaces\Global"
.\setup-global-commands.ps1 -Remove
```

## How It Works

1. **Directory Navigation**: Automatically switches to `SPA\NoorCanvas` folder
2. **Port Management**: Kills existing processes on target port to avoid conflicts
3. **Server Start**: Runs `dotnet run` with specified URL configuration
4. **Browser Launch**: Opens default browser to application URL (unless `-NoBrowser`)
5. **Error Handling**: Provides clear error messages and troubleshooting info

## Troubleshooting

### Command Not Found
- Ensure you've run `setup-global-commands.ps1` 
- Restart your terminal after setup
- Check that the Global folder is in your PATH

### Port Already in Use
- The script automatically attempts to kill existing dotnet processes
- Use `-Port` parameter to try a different port
- Manually kill processes: `Get-Process dotnet | Stop-Process`

### Build Errors
- Use `ncrun -Build` to ensure clean build
- Check that you're in a valid .NET project structure
- Verify .NET 8 SDK is installed: `dotnet --version`

### Browser Won't Open
- Use `ncrun -NoBrowser` and manually navigate to the URL
- Check your default browser settings
- The URL will be displayed in the console

## Files

- `ncrun.ps1` - Main PowerShell script
- `ncrun.cmd` - Batch wrapper for universal compatibility  
- `setup-global-commands.ps1` - PATH setup utility
- `README.md` - This documentation

## Project Integration

This command integrates with the NOOR Canvas project structure:
- **Target**: `D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas`
- **Default Port**: 9090 (HTTP) or 9091 (HTTPS)
- **Build System**: .NET 8 with `dotnet run`
- **Browser**: Opens to landing page for testing
