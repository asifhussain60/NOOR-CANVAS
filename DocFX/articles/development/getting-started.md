# Getting Started with NOOR CANVAS Development

## Prerequisites

### Required Software

- Visual Studio 2022 or VS Code
- .NET 8.0 SDK
- SQL Server (Express or Developer Edition)
- Git for version control
- PowerShell 5.1+ for automation scripts

### Development Database Setup

```sql
-- Development Environment
USE KSESSIONS_DEV;
-- Production Environment
USE KSESSIONS;

-- Canvas schema objects
SELECT * FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'canvas';
```

## Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/asifhussain60/NOOR-CANVAS.git
cd NOOR-CANVAS
```

### 2. Database Configuration

Update connection strings in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=KSESSIONS_DEV;Trusted_Connection=true;MultipleActiveResultSets=true;Timeout=3600"
  }
}
```

### 3. Build and Run

**Using NC Command (Recommended)**

```powershell
# Navigate to workspace root
cd "D:\PROJECTS\NOOR CANVAS"

# Generate host token (optional)
nct

# Build and run application
nc
```

**Manual Build Process**

```powershell
# Navigate to project directory
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"

# Restore packages
dotnet restore

# Build project
dotnet build --no-restore

# Run application
dotnet run --urls "https://localhost:9091"
```

## Development Workflow

### 1. Application Startup

- Application runs on IIS Express x64
- Primary URL: https://localhost:9091 (HTTPS)
- Fallback URL: http://localhost:9090 (HTTP)
- Blazor Server with SignalR enabled

### 2. Development Tools

**NC Command Suite**

```powershell
nc                    # Full application startup
nc -SkipTokenGeneration  # Skip host token step
nc -Help             # Command reference
```

**Health Checks**

```powershell
# Verify application health
Invoke-WebRequest -Uri "https://localhost:9091/healthz" -SkipCertificateCheck

# Check SignalR connectivity
Invoke-WebRequest -Uri "https://localhost:9091/hub/session" -SkipCertificateCheck
```

### 3. Testing Framework

**Automated Testing**

```powershell
# Run all tests
dotnet test

# Run specific test project
dotnet test Tests/NoorCanvas.Core.Tests/

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

**Manual Testing**

- Browser: Navigate to https://localhost:9091
- Developer Tools: Check console for errors
- Network Tab: Verify SignalR connections
- Application Tab: Check local storage

## Development Environment Verification

### 1. Port Verification

```powershell
# Check if ports are in use
netstat -ano | findstr ":9091"  # HTTPS
netstat -ano | findstr ":9090"  # HTTP
```

### 2. Process Verification

```powershell
# Check IIS Express processes
Get-Process | Where-Object {$_.ProcessName -like "*iisexpress*"}

# Check .NET processes
Get-Process | Where-Object {$_.ProcessName -like "*dotnet*"}
```

### 3. Database Connectivity

```sql
-- Test canvas schema access
USE KSESSIONS_DEV;
SELECT COUNT(*) FROM canvas.Sessions;

-- Test cross-schema access
USE KQUR_DEV;
SELECT COUNT(*) FROM dbo.Users;
```

## Common Development Issues

### Build Errors

- **Issue**: Restore failures
- **Solution**: Clear NuGet cache: `dotnet nuget locals all --clear`

### Port Conflicts

- **Issue**: Port 9091 already in use
- **Solution**: Kill existing processes: `Stop-Process -Name "dotnet" -Force`

### Database Connection

- **Issue**: Connection timeout
- **Solution**: Verify SQL Server service and connection string

### SignalR Issues

- **Issue**: WebSocket failures
- **Solution**: Check browser developer tools for connection errors

## Project Structure

```
SPA/NoorCanvas/           # Main application
├── Controllers/          # Web API controllers
├── Hubs/                # SignalR hubs
├── Models/              # Data models
├── Services/            # Business logic
├── Components/          # Blazor components
├── wwwroot/            # Static files
└── Views/              # Razor views

Tests/                   # Test projects
├── NoorCanvas.Core.Tests/   # Unit tests
└── NC-ImplementationTests/  # Integration tests

Tools/                   # Console applications
└── HostProvisioner/    # Host token generator

Workspaces/             # Documentation and tools
├── Documentation/      # Project documentation
├── Global/            # Global scripts (nc, nct)
└── TEMP/             # Temporary development files
```

## Next Steps

1. **Explore Components**: Review Blazor components in `Components/`
2. **Understand SignalR**: Examine hubs in `Hubs/`
3. **Database Integration**: Study models and DbContext
4. **Testing**: Run test suite to verify setup
5. **Phase 4 Development**: Begin mock template conversion

---

_For deployment instructions, see the [Deployment Guide](../deployment/production-setup.md)_
