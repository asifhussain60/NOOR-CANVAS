# Global Commands Technical Reference

## Architecture Overview

The NOOR Canvas global command system provides a unified PowerShell-based interface for development and administration tasks. Commands are implemented as PowerShell scripts with batch/cmd wrappers for cross-shell compatibility.

## Implementation Details

### Command Location

- **Base Directory**: `D:\PROJECTS\NOOR CANVAS\Workspaces\Global\`
- **PowerShell Scripts**: `*.ps1` files containing primary implementation
- **Batch Wrappers**: `*.bat` and `*.cmd` files for compatibility
- **Global Access**: Commands available system-wide through PowerShell profile loading

### Command Registration

Commands are registered through the PowerShell profile system:

```powershell
# Profile loading mechanism (in Microsoft.PowerShell_profile.ps1)
$globalPath = "D:\PROJECTS\NOOR CANVAS\Workspaces\Global"
if (Test-Path $globalPath) {
    $env:PATH = "$globalPath;$env:PATH"
    Write-Host "✅ NOOR Canvas global commands loaded: nc, nct, ncdoc, iiskill" -ForegroundColor Green
}
```

## NC Command Implementation

### Core Script: `nc.ps1`

```powershell
[CmdletBinding()]
param(
    [switch]$SkipTokenGeneration,
    [switch]$Help
)

# Parameter validation and help display
if ($Help) {
    Write-Host "NOOR Canvas Application Runner (NC Command)" -ForegroundColor Green
    Write-Host "Usage: nc [-SkipTokenGeneration] [-Help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -SkipTokenGeneration    Skip the host token generation step"
    Write-Host "  -Help                   Display this help message"
    return
}

# Workspace detection
$workspaceRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$projectPath = Join-Path $workspaceRoot "SPA\NoorCanvas"

# Token generation (unless skipped)
if (-not $SkipTokenGeneration) {
    Write-Host "🔑 Generating host tokens..." -ForegroundColor Cyan
    & "$PSScriptRoot\nct.ps1"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Token generation failed"
        exit 1
    }
}

# Project build
Write-Host "🔨 Building NOOR Canvas..." -ForegroundColor Cyan
Set-Location $projectPath
dotnet build --no-restore
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Build failed"
    exit 1
}

# IIS Express launch
Write-Host "🚀 Starting IIS Express x64..." -ForegroundColor Green
Start-Process -FilePath "dotnet" -ArgumentList "run --urls `"https://localhost:9091;http://localhost:9090`"" -NoNewWindow -Wait
```

### Process Management

The NC command implements sophisticated process management:

1. **Path Resolution**: Automatically detects workspace structure using `Split-Path`
2. **Error Handling**: Validates each step with proper exit codes
3. **Build Integration**: Ensures clean build before server start
4. **Port Management**: Consistently uses ports 9091 (HTTPS) and 9090 (HTTP)

### IIS Express Integration

```powershell
# IIS Express configuration detection
$iisExpressPath = "${env:ProgramFiles}\IIS Express\iisexpress.exe"
if (Test-Path $iisExpressPath) {
    # Use IIS Express directly
    $arguments = "/path:`"$projectPath`" /port:9091 /systray:false"
    Start-Process -FilePath $iisExpressPath -ArgumentList $arguments
} else {
    # Fallback to dotnet run
    Start-Process -FilePath "dotnet" -ArgumentList "run --urls `"https://localhost:9091`""
}
```

## NCT Command Implementation

### Token Generation Algorithm

```powershell
# Cryptographically secure GUID generation
$hostToken = [System.Guid]::NewGuid().ToString()

# Database storage
$connectionString = "Server=AHHOME;Database=KSESSIONS_DEV;User ID=sa;Password=adf4961glo;Connection Timeout=3600;TrustServerCertificate=True;Encrypt=False;"

$query = @"
INSERT INTO canvas.HostTokens (Id, Token, CreatedAt, ExpiresAt, IsActive)
VALUES (NEWID(), @Token, GETUTCDATE(), DATEADD(HOUR, 24, GETUTCDATE()), 1)
"@

# SQL execution with proper parameterization
$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
$command = New-Object System.Data.SqlClient.SqlCommand($query, $connection)
$command.Parameters.AddWithValue("@Token", $hostToken)
```

### Security Considerations

- **GUID Generation**: Uses cryptographically secure random number generator
- **SQL Injection Prevention**: All database queries use parameterized commands
- **Token Expiration**: Automatic 24-hour expiration for security
- **Database Isolation**: Uses dedicated development database (KSESSIONS_DEV)

## NCDOC Command Implementation

### DocFX Integration

```powershell
# DocFX build and serve
$docfxPath = Join-Path $workspaceRoot "DocFX"
Set-Location $docfxPath

# Build documentation
dotnet docfx docfx.json
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Documentation build failed"
    exit 1
}

# Serve locally
dotnet docfx docfx.json --serve --port 8082
```

### Browser Launch Logic

```powershell
# Smart browser detection and launch
$documentationUrl = "http://localhost:8082"

if ($env:OS -eq "Windows_NT") {
    Start-Process $documentationUrl
} else {
    # Cross-platform support
    if (Get-Command "xdg-open" -ErrorAction SilentlyContinue) {
        xdg-open $documentationUrl
    } elseif (Get-Command "open" -ErrorAction SilentlyContinue) {
        open $documentationUrl
    }
}
```

## IISKILL Command Implementation

### Process Discovery

```powershell
# Find all IIS Express processes
$iisProcesses = Get-Process -Name "iisexpress*" -ErrorAction SilentlyContinue

if ($iisProcesses) {
    foreach ($process in $iisProcesses) {
        try {
            Write-Verbose "Terminating IIS Express process: $($process.Id)"
            Stop-Process -Id $process.Id -Force
            $processesKilled++
        }
        catch {
            Write-Warning "Failed to stop process $($process.Id): $($_.Exception.Message)"
        }
    }
}
```

### File Lock Management

```powershell
# Handle locked executable files
$lockedFiles = @(
    "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\bin\Debug\net8.0\NoorCanvas.exe"
)

foreach ($file in $lockedFiles) {
    if (Test-Path $file) {
        try {
            # Wait for file unlock
            $maxAttempts = 10
            $attempt = 0

            do {
                Start-Sleep -Milliseconds 500
                $attempt++
                $fileStream = $null

                try {
                    $fileStream = [System.IO.File]::Open($file, 'Open', 'Write')
                    $isLocked = $false
                }
                catch {
                    $isLocked = $true
                }
                finally {
                    if ($fileStream) { $fileStream.Close() }
                }
            } while ($isLocked -and $attempt -lt $maxAttempts)

        }
        catch {
            Write-Verbose "File unlock check failed: $($_.Exception.Message)"
        }
    }
}
```

## Error Handling and Logging

### Structured Error Reporting

```powershell
# Standardized error reporting across all commands
function Write-NoorError {
    param([string]$Message, [string]$Component)

    Write-Host "❌ NOOR-ERROR [$Component]: $Message" -ForegroundColor Red
    Write-EventLog -LogName Application -Source "NOOR Canvas" -EventId 1001 -EntryType Error -Message "$Component: $Message" -ErrorAction SilentlyContinue
}

# Usage example
Write-NoorError -Message "Build compilation failed" -Component "NC-BUILD"
```

### Verbose Output

```powershell
# Conditional verbose output based on -Verbose parameter
if ($PSBoundParameters['Verbose']) {
    Write-Host "🔍 NOOR-DEBUG: Checking workspace structure..." -ForegroundColor Gray
    Write-Host "   Workspace Root: $workspaceRoot" -ForegroundColor Gray
    Write-Host "   Project Path: $projectPath" -ForegroundColor Gray
}
```

## Integration Points

### PowerShell Profile Integration

Commands integrate with the PowerShell profile system for global availability:

```powershell
# Automatic loading in Microsoft.PowerShell_profile.ps1
if (Test-Path "D:\PROJECTS\NOOR CANVAS\Workspaces\Global") {
    $env:PATH += ";D:\PROJECTS\NOOR CANVAS\Workspaces\Global"
}
```

### VS Code Task Integration

Commands are integrated into VS Code tasks for IDE usage:

```json
{
  "label": "NOOR Canvas: Start Application",
  "type": "shell",
  "command": "nc",
  "group": {
    "kind": "build",
    "isDefault": true
  },
  "presentation": {
    "echo": true,
    "reveal": "always",
    "focus": false,
    "panel": "shared"
  }
}
```

## Performance Considerations

### Command Execution Speed

- **Script Caching**: PowerShell scripts are compiled and cached for faster execution
- **Path Resolution**: Optimized path detection minimizes file system calls
- **Process Management**: Efficient process enumeration and termination
- **Database Connections**: Connection pooling for NCT command

### Memory Usage

- **Minimal Footprint**: Commands designed to use minimal system resources
- **Clean Termination**: Proper cleanup of temporary objects and connections
- **Garbage Collection**: Explicit disposal of database connections and file streams

## Security Model

### Execution Policy

```powershell
# Commands respect PowerShell execution policy
if ((Get-ExecutionPolicy) -eq 'Restricted') {
    Write-Warning "PowerShell execution policy is Restricted. Commands may not execute."
    Write-Host "Consider running: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser"
}
```

### Database Security

- **Development Isolation**: Commands only access development databases (KSESSIONS_DEV)
- **Parameterized Queries**: All SQL operations use parameterized queries
- **Connection Timeout**: 1-hour timeout prevents hung connections
- **Credential Management**: Database credentials stored in configuration files only

## Troubleshooting

### Common Issues

1. **Command Not Found**

   ```powershell
   # Reload PowerShell profile
   . $PROFILE
   ```

2. **Permission Denied**

   ```powershell
   # Check execution policy
   Get-ExecutionPolicy
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Port Already in Use**
   ```powershell
   # Kill existing processes
   iiskill
   # Wait and retry
   Start-Sleep -Seconds 5
   nc
   ```

### Diagnostic Commands

```powershell
# Check command availability
Get-Command nc, nct, ncdoc, iiskill -ErrorAction SilentlyContinue

# Verify workspace structure
Test-Path "D:\PROJECTS\NOOR CANVAS\Workspaces\Global\*.ps1"

# Check running processes
Get-Process -Name "*iisexpress*", "*dotnet*" -ErrorAction SilentlyContinue
```

For user-friendly guides on using these commands, see the [Global Commands User Guide](../user-guides/global-commands-user-guide.md).
