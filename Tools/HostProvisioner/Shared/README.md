# Host Provisioner Shared Configuration

## Overview

Centralized configuration and environment detection logic shared by both the CLI and Windows Forms Host Provisioner applications.

## Purpose

Ensures **both applications** use identical:
- Environment detection logic
- Database connection settings
- Service configuration
- appsettings.json handling

## Structure

```
Tools/HostProvisioner/
├── Shared/
│   └── HostProvisionerConfig.cs    # Centralized configuration logic
├── HostProvisioner/                # CLI application
│   ├── Program.cs                  # Uses HostProvisionerConfig
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   ├── appsettings.Production.json
│   └── app.config
└── HostProvisioner.WinForms/       # Windows Forms application
    ├── MainForm.cs                 # Uses HostProvisionerConfig
    ├── appsettings.json            # Identical to CLI
    ├── appsettings.Development.json # Identical to CLI
    ├── appsettings.Production.json  # Identical to CLI
    └── app.config                   # Identical to CLI
```

## HostProvisionerConfig.cs

### Methods

#### `DetectEnvironment(string appConfigFileName)`
Detects environment with priority order:
1. `ASPNETCORE_ENVIRONMENT` environment variable
2. `app.config` file (modified by ncdeploy for production)
3. Default to "Development"

Returns: `(string environment, string baseUrl)`

**Example:**
```csharp
var (environment, baseUrl) = HostProvisionerConfig.DetectEnvironment("HostProvisioner.dll.config");
// CLI: "HostProvisioner.dll.config"
// WinForms: "HostProvisioner.WinForms.dll.config"
```

#### `ConfigureServices(ServiceCollection services, string environment)`
Configures DI services for both applications:
- Loads appsettings.json and environment-specific appsettings
- Configures Entity Framework DbContexts
- Registers SimplifiedTokenService
- Registers IConfiguration

**Example:**
```csharp
var services = new ServiceCollection();
HostProvisionerConfig.ConfigureServices(services, environment);
var serviceProvider = services.BuildServiceProvider();
```

#### `ExtractDatabaseName(string connectionString)`
Extracts database name from connection string for display.

#### `GetConnectionStringForDisplay(string environment)`
Gets connection string with masked password for display purposes.

## Environment Detection Flow

```
┌─────────────────────────────────────┐
│ Check ASPNETCORE_ENVIRONMENT var    │
└──────────────┬──────────────────────┘
               │
               ├─ Set? ──> Use variable value
               │
               └─ Not Set
                  │
                  ▼
         ┌────────────────────┐
         │ Read app.config    │
         └─────────┬──────────┘
                   │
                   ├─ Found? ──> Use config value
                   │
                   └─ Not Found ──> Default to "Development"
```

## Configuration Files

### appsettings.json
Base configuration (same for both apps)

### appsettings.Development.json
Development environment:
- Database: KSESSIONS_DEV
- Base URL: https://localhost:9091

### appsettings.Production.json
Production environment:
- Database: KSESSIONS
- Base URL: https://noorcanvas.servehttp.com

### app.config
Modified by ncdeploy.ps1 for production deployment:
```xml
<configuration>
  <appSettings>
    <add key="ASPNETCORE_ENVIRONMENT" value="Production" />
    <add key="BaseUrl_Production" value="https://noorcanvas.servehttp.com" />
  </appSettings>
</configuration>
```

## Usage

### CLI Application (Program.cs)
```csharp
using HostProvisioner.Shared;

private static void ConfigureServices(ServiceCollection services)
{
    var (environment, baseUrl) = HostProvisionerConfig.DetectEnvironment("HostProvisioner.dll.config");
    HostProvisionerConfig.ConfigureServices(services, environment);
    services.AddLogging(builder => builder.AddSerilog()); // CLI-specific
}
```

### WinForms Application (MainForm.cs)
```csharp
using HostProvisioner.Shared;

public MainForm()
{
    var services = new ServiceCollection();
    var (environment, baseUrl) = HostProvisionerConfig.DetectEnvironment("HostProvisioner.WinForms.dll.config");
    HostProvisionerConfig.ConfigureServices(services, environment);
    _serviceProvider = services.BuildServiceProvider();
}
```

## Benefits

✅ **Single Source of Truth**: Environment detection logic in one place  
✅ **Consistent Behavior**: Both apps behave identically  
✅ **Easy Maintenance**: Update config once, applies to both apps  
✅ **Deployment Safety**: ncdeploy modifies app.config, both apps respect it  
✅ **DRY Principle**: No duplicated configuration code

## Testing

### Development Mode
```powershell
# Both apps will use KSESSIONS_DEV database
dotnet run --project Tools/HostProvisioner/HostProvisioner
dotnet run --project Tools/HostProvisioner/HostProvisioner.WinForms
```

### Production Mode
```powershell
# Set environment variable (for testing)
$env:ASPNETCORE_ENVIRONMENT = "Production"
dotnet run --project Tools/HostProvisioner/HostProvisioner

# OR modify app.config (simulates ncdeploy)
# <add key="ASPNETCORE_ENVIRONMENT" value="Production" />
```

## Deployment

When deploying to production, `ncdeploy.ps1`:
1. Modifies `app.config` to set `ASPNETCORE_ENVIRONMENT=Production`
2. Sets `BaseUrl_Production=https://noorcanvas.servehttp.com`
3. Both CLI and WinForms applications automatically detect production mode
4. Both connect to KSESSIONS database (not KSESSIONS_DEV)

## Debug Logging

Configuration logic includes debug markers:
```
[DEBUG-WORKITEM:host-provisioner-form:config] Environment: Production
[DEBUG-WORKITEM:host-provisioner-form:config] Base URL: https://noorcanvas.servehttp.com
[DEBUG-WORKITEM:host-provisioner-form:config] Target Database: KSESSIONS
```

## File Linking

Both projects use `<Compile Include>` to link the shared file:
```xml
<ItemGroup>
  <Compile Include="..\Shared\HostProvisionerConfig.cs" Link="Shared\HostProvisionerConfig.cs" />
</ItemGroup>
```

This creates a virtual folder structure in the project without duplicating the file.
