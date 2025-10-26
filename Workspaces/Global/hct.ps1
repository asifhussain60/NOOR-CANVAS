param(
    [Parameter(Position=0)]
    [int]$SessionId,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("Development", "Production")]
    [string]$Environment = "Development",
    
    [Parameter(Mandatory=$false)]
    [string]$CreatedBy = $env:USERNAME,
    
    [switch]$OpenBrowser,
    [switch]$Help
)

# Global wrapper for Scripts/hct.ps1
# This allows running 'hct' from anywhere in the terminal

if ($Help) {
    Write-Host "HCT (Host Canvas Tool) - Quick Session Provisioner" -ForegroundColor Cyan
    Write-Host "====================================================="
    Write-Host ""
    Write-Host "DESCRIPTION:"
    Write-Host "  Fast command-line tool to reset canvas sessions and generate tokens"
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  hct <sessionId>                  # Provision session (Development)"
    Write-Host "  hct <sessionId> -Environment Production"
    Write-Host "  hct <sessionId> -OpenBrowser     # Auto-open host URL"
    Write-Host "  hct -Help                        # Show this help"
    Write-Host ""
    Write-Host "PARAMETERS:"
    Write-Host "  SessionId      Session ID from KSESSIONS database (required)"
    Write-Host "  -Environment   Development (default) or Production"
    Write-Host "  -CreatedBy     Person provisioning (defaults to current user)"
    Write-Host "  -OpenBrowser   Launch host URL in browser after provisioning"
    Write-Host ""
    Write-Host "ENVIRONMENT SUPPORT:"
    Write-Host "  Development:   KSESSIONS_DEV + https://localhost:9091"
    Write-Host "  Production:    KSESSIONS + https://noorcanvas.kashkole.com"
    Write-Host ""
    Write-Host "WHAT IT DOES:"
    Write-Host "  ✅ Clears canvas.Participants and canvas.SessionData"
    Write-Host "  ✅ Generates fresh host and user tokens (8 characters)"
    Write-Host "  ✅ Displays clickable URLs for immediate access"
    Write-Host "  ✅ ~2 seconds vs 10+ seconds for GUI"
    Write-Host ""
    Write-Host "EXAMPLES:"
    Write-Host "  hct 212                          # Dev environment"
    Write-Host "  hct 215 -Environment Production  # Prod environment"
    Write-Host "  hct 212 -OpenBrowser             # Auto-open browser"
    Write-Host "  hct 212 -CreatedBy 'John Doe'    # With audit tracking"
    Write-Host ""
    Write-Host "SEE ALSO:"
    Write-Host "  nct     - Interactive Host Provisioner (alternative tool)"
    Write-Host "  README: Scripts/hct.README.md"
    return
}

# Validate SessionId provided
if ($SessionId -eq 0) {
    Write-Host "❌ Error: SessionId is required" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage: hct <sessionId>" -ForegroundColor Yellow
    Write-Host "Example: hct 212" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For help: hct -Help" -ForegroundColor Gray
    exit 1
}

# Get project root (parent of Workspaces/Global)
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$HctScript = Join-Path $ProjectRoot "Scripts\hct.ps1"

# Verify script exists
if (-not (Test-Path $HctScript)) {
    Write-Host "❌ Error: hct.ps1 not found at: $HctScript" -ForegroundColor Red
    exit 1
}

# Build arguments for the main script
$scriptArgs = @{
    SessionId = $SessionId
    Environment = $Environment
    CreatedBy = $CreatedBy
}

if ($OpenBrowser) {
    $scriptArgs.OpenBrowser = $true
}

# Execute the main hct.ps1 script
& $HctScript @scriptArgs
exit $LASTEXITCODE
