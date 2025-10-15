# macOS Development - Quick Start

## ✅ Changes Completed

### 1. Database Connection Strings Updated
All configuration files now use `192.168.1.58,1433` instead of `AHHOME`:
- ✅ Main application configs
- ✅ HostProvisioner configs  
- ✅ Shared settings
- ✅ Deployment scripts

### 2. Files Committed to GitHub
- ✅ 14 files updated and committed
- ✅ Pushed to `development` branch
- ✅ Commit: `1e10b920`

### 3. Documentation Added
- ✅ `SETUP_MACOS.md` - Complete macOS setup guide
- ✅ `MACOS_MIGRATION_CHECKLIST.md` - Migration tracking

## 🚀 Next Steps on Your MacBook Pro

### 1. Clone the Repository
```bash
cd ~/Projects  # or wherever you keep projects
git clone https://github.com/asifhussain60/NOOR-CANVAS.git
cd NOOR-CANVAS
git checkout development
```

### 2. Install Prerequisites
```bash
# Install .NET 8 SDK
brew install dotnet@8

# Install Node.js (for tests)
brew install node

# Verify installations
dotnet --version  # Should show 8.0.x
node --version
```

### 3. Verify Network Access to SQL Server
```bash
# Test if you can reach the Windows SQL Server
ping 192.168.1.58

# Test if SQL Server port is accessible (requires telnet)
telnet 192.168.1.58 1433
# Press Ctrl+] then type 'quit' to exit
```

### 4. Build the Project
```bash
cd ~/Projects/NOOR-CANVAS/SPA/NoorCanvas
dotnet restore
dotnet build
```

### 5. Run the Application
```bash
dotnet run
```

Then open: `https://localhost:9091`

## 🔧 Windows SQL Server Configuration

**Important**: Make sure your Windows machine at `192.168.1.58` has:

### SQL Server Configuration Manager
1. Enable TCP/IP protocol
2. Set port to 1433
3. Restart SQL Server service

### Windows Firewall
1. Allow inbound connections on port 1433
2. Create rule for SQL Server
   ```
   Control Panel → Windows Defender Firewall → Advanced Settings
   → Inbound Rules → New Rule → Port → TCP → 1433
   ```

### SQL Server Settings
1. Enable SQL Server and Windows Authentication mode
2. Verify `sa` account is enabled with correct password
3. Verify SQL Server Browser service is running

### Test from Windows
```powershell
# On your Windows machine, verify SQL Server is listening
netstat -ano | findstr 1433
```

## 📁 Essential Project Files

All these files are now in GitHub (development branch):

### Source Code
- `SPA/NoorCanvas/` - Main Blazor application
- `Tools/HostProvisioner/` - Session management tool
- `Scripts/` - Deployment scripts (Windows only, not needed for dev)

### Configuration
- `config/sharedsettings.json` - Database connections
- `SPA/NoorCanvas/appsettings*.json` - App configuration

### Documentation  
- `SETUP_MACOS.md` - Full macOS setup guide
- `MACOS_MIGRATION_CHECKLIST.md` - Migration details
- `Docs/` - Additional documentation

### Tests
- `PlayWright/` - E2E tests
- `Tests/` - Unit tests (not tracked in git currently)

## 🎯 Development Workflow

### On macOS
```bash
# Pull latest changes
git checkout development
git pull origin development

# Make changes to code

# Test locally
cd SPA/NoorCanvas
dotnet run

# Commit and push
git add .
git commit -m "Description of changes"
git push origin development
```

### On Windows  
```bash
# Pull latest changes
git checkout development
git pull origin development

# Everything still works with 192.168.1.58
# Windows can reach itself at this IP
```

## 🔍 Verify Everything Works

### Checklist
- [ ] Cloned repository on macOS
- [ ] .NET 8 SDK installed
- [ ] Can ping 192.168.1.58
- [ ] Can connect to port 1433
- [ ] `dotnet restore` succeeded
- [ ] `dotnet build` succeeded  
- [ ] `dotnet run` starts application
- [ ] Browser shows app at https://localhost:9091
- [ ] Can see database data in the app

## 🐛 Troubleshooting

### "Could not connect to database"
1. Check Windows SQL Server is running
2. Verify firewall allows port 1433
3. Test connection with Azure Data Studio:
   - Server: `192.168.1.58,1433`
   - Auth: SQL Login
   - Username: `sa`
   - Password: `adf4961glo`
   - Database: `KSESSIONS_DEV`

### "Port 9091 already in use"
```bash
# Find what's using the port
lsof -i :9091

# Kill the process
kill -9 <PID>
```

### SSL Certificate Errors
```bash
# Trust the dev certificate
dotnet dev-certs https --trust
```

### Build Errors
```bash
# Clean and rebuild
dotnet clean
dotnet restore
dotnet build
```

## 📚 Additional Resources

### IDE Options
- **VS Code** (Free): `brew install --cask visual-studio-code`
  - Install C# Dev Kit extension
- **Rider** (Paid): `brew install --cask rider`
  - Full-featured .NET IDE

### Database Tools
- **Azure Data Studio** (Free): `brew install --cask azure-data-studio`
  - Connect to SQL Server from macOS
  - Browse database schema
  - Run queries

### Useful Commands
```bash
# Check .NET version
dotnet --info

# List installed SDKs
dotnet --list-sdks

# Restore packages
dotnet restore

# Build
dotnet build

# Run
dotnet run

# Clean
dotnet clean

# Run tests
dotnet test

# Watch mode (auto-rebuild on changes)
dotnet watch run
```

## 📧 Need Help?

1. Check `SETUP_MACOS.md` for detailed setup
2. Check `MACOS_MIGRATION_CHECKLIST.md` for what changed
3. Review documentation in `Docs/` directory
4. Check existing issues on GitHub

## 🎉 You're Ready!

You can now develop NOOR CANVAS on your MacBook Pro while connecting to your Windows SQL Server database!

**Branch**: `development`  
**Commit**: `1e10b920`  
**Date**: October 15, 2025
