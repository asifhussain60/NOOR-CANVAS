# NOOR Canvas Global Commands

This folder contains global command-line utilities for the NOOR Canvas project.

## Commands Available

### 🧪 **KSRUN - Advanced Testing & Development Launcher** (RECOMMENDED)
**Primary Command**: `ksrun -test`

Complete testing workflow with automatic host token generation and HTML testing suite integration.

#### **🔥 Key Features**
- **🔑 Automatic Host Token Generation**: Uses HostProvisioner to create fresh GUID
- **📋 HTML Testing Suite**: Opens beautifully styled interactive testing interface  
- **🚀 Application Launcher**: Starts NOOR Canvas with browser automation
- **🔄 Real-time Integration**: Updates testing suite with fresh token automatically
- **⚡ One-Command Workflow**: Everything ready for immediate manual testing

#### **Quick Usage**
```powershell
ksrun -test              # RECOMMENDED: Generate token + start app + open testing suite
ksrun -test -Build       # Build first, then full testing workflow
ksrun -test -Https       # Use HTTPS (port 9091) for testing
ksrun -Help              # Show all available options
```

### 🏃‍♂️ **NCRUN - Basic Application Runner**
Simple application launcher without testing integration.

#### **Quick Usage**
```powershell
ncrun                    # Start app on localhost:9090 and open browser
ncrun -Build             # Build first, then run
ncrun -Help              # Show detailed help
```

## 📋 **Command Reference**

### **KSRUN Options (Testing & Development)**
```powershell
ksrun -test              # 🔥 RECOMMENDED: Full testing workflow with token generation
ksrun -test -Build       # Build first, then full testing workflow
ksrun -test -Https       # Use HTTPS (port 9091) for secure testing
ksrun -test -NoBrowser   # Generate token and start app without browser automation
ksrun -Build             # Build and run application only (no testing suite)
ksrun                    # Basic application startup (equivalent to ncrun)
ksrun -Help              # Show all available options and examples
```

### **NCRUN Options (Basic Application Launch)**
```powershell
ncrun                    # Run app on localhost:9090 and open browser
ncrun -Build             # Build first, then run
ncrun -NoBrowser         # Run without opening browser
ncrun -Https             # Use HTTPS (port 9091)
ncrun -Port 8080         # Use custom port
ncrun -Help              # Show help information
```

## 🚀 **Recommended Workflows**

### **For Manual Testing** (Most Common)
```powershell
ksrun -test              # One command does everything:
                        # ✅ Generates fresh host token
                        # ✅ Starts NOOR Canvas application  
                        # ✅ Opens testing suite with new token
                        # ✅ Ready for immediate testing
```

### **For Development & Debugging**
```powershell
ksrun -test -Build      # Build + full testing workflow
ncrun -Build            # Build and run app only
```

### **For HTTPS/Production Testing**
```powershell
ksrun -test -Https      # Full testing workflow on secure port 9091
```

## 🎯 **What `ksrun -test` Does (Step-by-Step)**

1. **🔑 Token Generation**: Runs HostProvisioner to create fresh host GUID with HMAC-SHA256 security
2. **📝 Suite Update**: Injects new token into `MANUAL-TESTING-SUITE.html` automatically
3. **🚀 App Launch**: Starts NOOR Canvas on https://localhost:9091 (or http://localhost:9090)
4. **🌐 Browser Automation**: Opens testing suite and application in separate browser tabs
5. **📊 Ready to Test**: Everything configured for immediate manual testing workflow

## 🧪 **Testing Integration Features**

**Complete Workflow Automation**:
- **Fresh Host Tokens**: No manual GUID generation needed
- **Interactive Testing Suite**: 20 test cases across 5 use cases with progress tracking
- **Real-time Updates**: Token injection happens automatically before browser opens
- **Cross-browser Ready**: Supports multiple browser testing scenarios
- **Professional Interface**: Beautifully styled HTML with responsive design

**Testing Suite Details**:
- **Location**: `Workspaces/TEMP/MANUAL-TESTING-SUITE.html`
- **Test Cases**: Infrastructure, Authentication, Session Management, Admin, Browser Compatibility
- **Progress Tracking**: Interactive checkboxes with completion percentage
- **Token Display**: Shows current host token and application URLs
- **Auto-Generated**: Token updated automatically by ksrun -test command

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
