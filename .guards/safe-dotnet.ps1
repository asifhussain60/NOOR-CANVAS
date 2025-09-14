# Safe Dotnet Command Wrapper
# Prevents directory context issues by validating environment before executing dotnet commands
# Created: September 14, 2025
# Purpose: Wrapper for dotnet commands with built-in Issue-80 protection

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$DotnetArgs,
    
    [switch]$Force,
    [switch]$Verbose
)

$ProjectPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
$ProjectFile = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\NoorCanvas.csproj"

function Write-SafeLog {
    param([string]$Message, [string]$Level = "INFO")
    $colors = @{ "INFO" = "White"; "SUCCESS" = "Green"; "WARNING" = "Yellow"; "ERROR" = "Red" }
    Write-Host "[SAFE-DOTNET] $Message" -ForegroundColor $colors[$Level]
}

function Test-SafeExecution {
    $currentDir = Get-Location
    $issues = @()
    
    # Check if project file exists
    if (-not (Test-Path $ProjectFile)) {
        $issues += "Project file not found at '$ProjectFile'"
    }
    
    # Check if we're in a reasonable directory context
    if ($currentDir.Path -notlike "*NOOR CANVAS*") {
        $issues += "Current directory '$($currentDir.Path)' doesn't appear to be in NOOR CANVAS project"
    }
    
    return $issues
}

# Validate environment
$issues = Test-SafeExecution

if ($issues.Count -gt 0 -and -not $Force) {
    Write-SafeLog "Safety check failed:" "ERROR"
    foreach ($issue in $issues) {
        Write-SafeLog "  - $issue" "ERROR"
    }
    Write-SafeLog "" "INFO"
    Write-SafeLog "SAFE ALTERNATIVES:" "WARNING"
    Write-SafeLog "  1. Use full project path: dotnet $($DotnetArgs -join ' ') --project `"$ProjectFile`"" "INFO"
    Write-SafeLog "  2. Change to project directory: cd `"$ProjectPath`"" "INFO"
    Write-SafeLog "  3. Use -Force to override this safety check" "INFO"
    exit 1
}

# Execute dotnet command with safety
if ($issues.Count -gt 0) {
    Write-SafeLog "Safety issues detected but -Force specified. Using full project path..." "WARNING"
    
    # Inject --project parameter if not already present and command supports it
    $safeArgs = @()
    $commandSupportsProject = $DotnetArgs[0] -in @("build", "run", "publish", "test", "clean", "restore")
    
    if ($commandSupportsProject -and ($DotnetArgs -notcontains "--project")) {
        $safeArgs += $DotnetArgs[0]
        $safeArgs += "--project"
        $safeArgs += "`"$ProjectFile`""
        $safeArgs += $DotnetArgs[1..($DotnetArgs.Length-1)]
    } else {
        $safeArgs = $DotnetArgs
    }
    
    Write-SafeLog "Executing: dotnet $($safeArgs -join ' ')" "INFO"
    & dotnet @safeArgs
} else {
    Write-SafeLog "Safety check passed. Executing: dotnet $($DotnetArgs -join ' ')" "SUCCESS"
    & dotnet @DotnetArgs
}

$exitCode = $LASTEXITCODE
Write-SafeLog "Command completed with exit code: $exitCode" $(if ($exitCode -eq 0) { "SUCCESS" } else { "ERROR" })
exit $exitCode
