# NOOR CANVAS - macOS Setup Guide

## Overview
This guide will help you set up NOOR CANVAS development environment on macOS (Apple Silicon or Intel).

## Prerequisites

### 1. Install .NET 8 SDK
```bash
# Download from Microsoft or use Homebrew
brew install dotnet@8
```

Verify installation:
```bash
dotnet --version  # Should show 8.0.x
```

### 2. Install SQL Server Tools
Since SQL Server doesn't run natively on macOS, you'll connect to the Windows SQL Server remotely:

```bash
# Install Azure Data Studio for database management (optional but recommended)
brew install --cask azure-data-studio
```

### 3. Install Node.js and npm (for Playwright tests)
```bash
brew install node
```

### 4. Install Git
```bash
brew install git
```

## Database Connection

The project is configured to connect to your Windows SQL Server using `AHHOME` by default.

**For macOS Development**: You'll need to update the connection strings to use the IP address.

### Update Connection Strings on macOS

After cloning, update these files to use `192.168.1.58,1433`:

**1. Edit `config/sharedsettings.json`:**
```json
{
    "ConnectionStrings": {
        "Development": "Server=192.168.1.58,1433;Database=KSESSIONS_DEV;User ID=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=True;Encrypt=False;",
        "Production": "Server=192.168.1.58,1433;Database=KSESSIONS;User ID=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=True;Encrypt=False;"
    }
}
```

**2. Edit `SPA/NoorCanvas/appsettings.json`:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=192.168.1.58,1433;Database=KSESSIONS_DEV;..."
  }
}
```

**3. Edit `SPA/NoorCanvas/appsettings.Development.json`** - Same change
**4. Edit `SPA/NoorCanvas/appsettings.Production.json`** - Same change (use `KSESSIONS` database)

**Important**: Do NOT commit these changes back to Git. Keep them local on your Mac.

### Network Requirements
Ensure your Mac can reach the Windows machine at `192.168.1.58`:
```bash
ping 192.168.1.58
```

### SQL Server Configuration on Windows
Make sure SQL Server on your Windows machine (`192.168.1.58`) is configured to:
1. Allow remote connections
2. TCP/IP protocol is enabled on port 1433
3. SQL Server Browser service is running
4. Windows Firewall allows port 1433

## Project Setup

### 1. Clone the Repository
```bash
cd ~/Projects  # or your preferred location
git clone https://github.com/asifhussain60/NOOR-CANVAS.git
cd NOOR-CANVAS
```

### 2. Switch to Development Branch
```bash
git checkout development
```

### 3. Restore Dependencies
```bash
# Restore NuGet packages for main application
cd SPA/NoorCanvas
dotnet restore

# Restore HostProvisioner
cd ../../Tools/HostProvisioner/HostProvisioner
dotnet restore
```

### 4. Install Playwright (for testing)
```bash
cd ~/Projects/NOOR-CANVAS/PlayWright
npm install
npx playwright install
```

## Building the Project

### Build Main Application
```bash
cd ~/Projects/NOOR-CANVAS/SPA/NoorCanvas
dotnet build
```

### Build HostProvisioner
```bash
cd ~/Projects/NOOR-CANVAS/Tools/HostProvisioner/HostProvisioner
dotnet build
```

## Running the Application

### Development Mode
```bash
cd ~/Projects/NOOR-CANVAS/SPA/NoorCanvas
dotnet run
```

The application will start on:
- HTTPS: `https://localhost:9091`
- HTTP: `http://localhost:9090`

### Access the Application
Open your browser and navigate to:
```
https://localhost:9091
```

**Note**: You may need to accept the self-signed SSL certificate warning in your browser.

## Configuration Files

All database connection strings have been updated to use `192.168.1.58,1433`:

- `config/sharedsettings.json` - Shared configuration
- `SPA/NoorCanvas/appsettings.json` - Main app base config
- `SPA/NoorCanvas/appsettings.Development.json` - Development overrides
- `SPA/NoorCanvas/appsettings.Production.json` - Production overrides
- `Tools/HostProvisioner/HostProvisioner/appsettings*.json` - HostProvisioner configs

## Project Structure

```
NOOR-CANVAS/
├── SPA/NoorCanvas/           # Main Blazor application
├── Tools/HostProvisioner/    # Session management tool
├── Scripts/                  # PowerShell deployment scripts (Windows only)
├── PlayWright/              # E2E tests
├── Tests/                   # Unit and integration tests
├── config/                  # Shared configuration
└── Docs/                    # Documentation
```

## Common Tasks

### Run Tests
```bash
cd ~/Projects/NOOR-CANVAS
dotnet test
```

### Run Playwright E2E Tests
```bash
cd ~/Projects/NOOR-CANVAS/PlayWright
npx playwright test
```

### View Logs
Application logs are written to:
```
SPA/NoorCanvas/logs/noor-canvas-YYYYMMDD.txt
```

### Clean Build Artifacts
```bash
cd ~/Projects/NOOR-CANVAS
dotnet clean
```

## Development Workflow

### 1. Always Work in Development Branch
```bash
git checkout development
git pull origin development
```

### 2. Make Your Changes
Edit files as needed using VS Code, Rider, or your preferred IDE.

### 3. Test Your Changes
```bash
cd SPA/NoorCanvas
dotnet run
```

### 4. Commit and Push
```bash
git add .
git commit -m "Description of changes"
git push origin development
```

## Troubleshooting

### Cannot Connect to Database
1. Verify Windows machine is accessible:
   ```bash
   ping 192.168.1.58
   telnet 192.168.1.58 1433
   ```

2. Check SQL Server is running on Windows machine

3. Verify SQL Server allows remote connections:
   - SQL Server Configuration Manager
   - Enable TCP/IP protocol
   - Restart SQL Server service

### SSL Certificate Issues
```bash
# Trust the development certificate
dotnet dev-certs https --trust
```

### Port Already in Use
If ports 9090/9091 are in use:
```bash
# Check what's using the port
lsof -i :9091

# Kill the process (replace PID)
kill -9 <PID>
```

## IDE Recommendations

### Visual Studio Code
```bash
brew install --cask visual-studio-code
```

Recommended extensions:
- C# Dev Kit
- .NET Extension Pack
- Blazor WASM Debugging

### JetBrains Rider
```bash
brew install --cask rider
```

Rider has excellent .NET support and works great on macOS.

## Notes for macOS Developers

### PowerShell Scripts Won't Run
The `Scripts/` directory contains PowerShell scripts for Windows deployment. These won't run on macOS but aren't needed for development:
- `ncdeploy.ps1` - Windows IIS deployment
- `ncrollback.ps1` - Windows rollback
- `setup-iis.ps1` - Windows IIS setup

Development work doesn't require these scripts.

### Path Differences
- Windows: `D:\PROJECTS\NOOR CANVAS`
- macOS: `~/Projects/NOOR-CANVAS`

Git handles line endings automatically via `.gitattributes`.

### Case Sensitivity
macOS file system is typically case-insensitive by default, but be aware:
- Use exact case for file/folder names
- Git is case-sensitive

## Support

### Documentation
- Main docs: `Docs/` directory
- API docs: `DocFX/` directory (build with `docfx` on Windows)

### Database Schema
Review the database schema documentation:
- Development DB: `KSESSIONS_DEV` on `192.168.1.58`
- Canvas tables are in the `canvas` schema

## Next Steps

1. ✅ Clone the repository
2. ✅ Install prerequisites (.NET 8, Node.js)
3. ✅ Verify database connectivity
4. ✅ Build the project
5. ✅ Run the application
6. ✅ Make your first commit to `development` branch

Happy coding! 🚀
