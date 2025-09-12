# NOOR Canvas Token (nct) - Host Provisioner Command
# Provisions host tokens for NOOR Canvas sessions

param(
    [Parameter(Position = 0)]
    [string]$Command = "create",
    
    [Parameter(Position = 1)]
    [long]$SessionId,
    
    [string]$CreatedBy,
    [string]$Expires,
    [switch]$DryRun,
    [switch]$Help,
    [switch]$List,
    [switch]$Build
)

# Show help
if ($Help -or ($Command -eq "help")) {
    Write-Host "NOOR Canvas Token (nct) - Host Provisioner"
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  nct create <session-id> [-CreatedBy <name>] [-Expires <date>] [-DryRun]"
    Write-Host "  nct rotate <host-session-id> [-DryRun]"
    Write-Host "  nct list                    # List all host tokens"
    Write-Host "  nct build                   # Build Host Provisioner"
    Write-Host "  nct help                    # Show this help"
    Write-Host ""
    Write-Host "EXAMPLES:"
    Write-Host "  nct create 123                           # Create token for session 123"
    Write-Host "  nct create 456 -CreatedBy 'Ahmad'        # Create with creator name"
    Write-Host "  nct create 789 -Expires '2025-12-31'     # Create with expiration"
    Write-Host "  nct create 101 -DryRun                   # Preview without creating"
    Write-Host "  nct rotate 12345                         # Rotate existing host token"
    Write-Host ""
    Write-Host "OPTIONS:"
    Write-Host "  -SessionId      Session ID to associate with host token (required for create)"
    Write-Host "  -CreatedBy      Name of the person creating the session (optional)"
    Write-Host "  -Expires        Expiration date in yyyy-MM-dd format (optional)"
    Write-Host "  -DryRun         Preview what would be done without making changes"
    Write-Host "  -Build          Build the Host Provisioner before running"
    Write-Host ""
    return
}

# Get paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceRoot = Split-Path (Split-Path $scriptDir -Parent) -Parent
$provisionerPath = Join-Path $workspaceRoot "Tools\HostProvisioner\HostProvisioner"
$provisionerExe = Join-Path $provisionerPath "bin\Debug\net8.0\HostProvisioner.exe"

Write-Host "NOOR Canvas Token Provisioner" -ForegroundColor Cyan

# Build if requested or executable doesn't exist
if ($Build -or (-not (Test-Path $provisionerExe))) {
    Write-Host "Building Host Provisioner..." -ForegroundColor Yellow
    
    Push-Location $provisionerPath
    try {
        dotnet build --no-restore
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Build failed"
            return
        }
        Write-Host "Build successful" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

# Verify executable exists
if (-not (Test-Path $provisionerExe)) {
    Write-Error "Host Provisioner executable not found. Run: nct -Build"
    return
}

# Handle different commands
switch ($Command.ToLower()) {
    "create" {
        if (-not $SessionId) {
            Write-Error "❌ Session ID required for create command"
            Write-Host "Usage: nct create <session-id> [-CreatedBy <name>] [-Expires <date>] [-DryRun]"
            return
        }
        
        $provisionerArgs = @("create", "--session-id", $SessionId)
        
        if ($CreatedBy) {
            $provisionerArgs += @("--created-by", $CreatedBy)
        }
        
        if ($Expires) {
            $provisionerArgs += @("--expires", $Expires)
        }
        
        if ($DryRun) {
            $provisionerArgs += "--dry-run"
        }
        
        Write-Host "Creating host token for session $SessionId..." -ForegroundColor Yellow
        & $provisionerExe $provisionerArgs
    }
    
    "rotate" {
        if (-not $SessionId) {
            Write-Error "❌ Host Session ID required for rotate command"
            Write-Host "Usage: nct rotate <host-session-id> [-DryRun]"
            return
        }
        
        $provisionerArgs = @("rotate", "--host-session-id", $SessionId)
        
        if ($DryRun) {
            $provisionerArgs += "--dry-run"
        }
        
        Write-Host "Rotating host token for session $SessionId..." -ForegroundColor Yellow
        & $provisionerExe $provisionerArgs
    }
    
    "list" {
        Write-Host "📋 Listing host tokens..." -ForegroundColor Yellow
        # This would require adding a list command to the Host Provisioner
        Write-Host "List command not yet implemented in Host Provisioner" -ForegroundColor Gray
        Write-Host "   Consider adding a list command to Program.cs for database queries"
    }
    
    "build" {
        Write-Host "🔨 Building Host Provisioner..." -ForegroundColor Yellow
        Push-Location $provisionerPath
        try {
            dotnet build
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Build successful" -ForegroundColor Green
            } else {
                Write-Error "❌ Build failed"
            }
        }
        finally {
            Pop-Location
        }
    }
    
    default {
        Write-Error "❌ Unknown command: $Command"
        Write-Host "Available commands: create, rotate, list, build, help"
        Write-Host "Use nct help for detailed usage information"
    }
}
