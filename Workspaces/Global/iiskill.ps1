# NOOR Canvas IIS Express Killer (iiskill)
# Comprehensive IIS Express x64 process management and cleanup tool
param(
    [switch]$Help,
    [switch]$WhatIf,
    [switch]$Verbose
)

if ($Help) {
    Write-Host "NOOR Canvas IIS Express Killer - Process Management Tool" -ForegroundColor Green
    Write-Host "========================================================"
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  iiskill                      # Kill all 64-bit IIS Express processes"
    Write-Host "  iiskill -WhatIf              # Preview what would be killed (dry run)"
    Write-Host "  iiskill -Verbose             # Kill with detailed output"
    Write-Host "  iiskill -Help                # Show this help"
    Write-Host ""
    Write-Host "FEATURES:"
    Write-Host "  • Targets only 64-bit IIS Express processes for safety"
    Write-Host "  • Uses Win32 IsWow64Process API for accurate detection"
    Write-Host "  • Silent operation with summary reporting"
    Write-Host "  • Dry-run mode for safe preview"
    Write-Host "  • Enhanced error handling and reporting"
    Write-Host ""
    Write-Host "DESCRIPTION:"
    Write-Host "  Resolves build conflicts by stopping IIS Express processes that"
    Write-Host "  lock application files (apphost.exe, NoorCanvas.exe). Essential"
    Write-Host "  for preventing MSB3026/MSB3027 build errors in development."
    return
}

Write-Host "NOOR Canvas IIS Express Killer (iiskill)" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host ""

# P/Invoke declaration for IsWow64Process
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class PInvoke {
    [DllImport("kernel32.dll", SetLastError=true)]
    public static extern bool IsWow64Process(IntPtr hProcess, out bool wow64);
}
'@ -ErrorAction SilentlyContinue

# Function for consistent logging
function Write-LogMessage {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $colors = @{
        "INFO" = "White"
        "SUCCESS" = "Green" 
        "WARNING" = "Yellow"
        "ERROR" = "Red"
        "DEBUG" = "Gray"
    }
    if ($Verbose) {
        Write-Host "[$timestamp] $Message" -ForegroundColor $colors[$Level]
    }
}

try {
    # Check for IIS Express processes
    Write-LogMessage "Scanning for IIS Express processes..." "INFO"
    $iis = Get-Process -Name iisexpress -ErrorAction SilentlyContinue
    
    if (-not $iis) {
        Write-Host "No iisexpress processes found." -ForegroundColor Yellow
        return 0
    }

    if (-not [Environment]::Is64BitOperatingSystem) {
        Write-Host "Host OS is 32-bit; no 64-bit iisexpress processes exist." -ForegroundColor Yellow
        return 0
    }

    Write-LogMessage "Found $($iis.Count) IIS Express process(es)" "INFO"

    $killed = @()
    $skipped = @()

    foreach ($p in $iis) {
        $isWow64 = $false
        try {
            $ok = [PInvoke]::IsWow64Process($p.Handle, [ref]$isWow64)
        } catch {
            Write-LogMessage "Failed to query process PID $($p.Id): $($_.Exception.Message)" "WARNING"
            continue
        }

        if (-not $ok) {
            Write-LogMessage "IsWow64Process call failed for PID $($p.Id). Skipping." "WARNING"
            continue
        }

        # On a 64-bit OS: IsWow64Process == $true => 32-bit process; $false => 64-bit process
        if (-not $isWow64) {
            if ($WhatIf) {
                Write-Host "Would kill 64-bit iisexpress PID $($p.Id) ($($p.ProcessName))" -ForegroundColor Cyan
                Write-LogMessage "Dry run: Would stop PID $($p.Id)" "DEBUG"
            } else {
                try {
                    Stop-Process -Id $p.Id -Force -ErrorAction Stop
                    Write-Host "✅ Killed 64-bit iisexpress PID $($p.Id)" -ForegroundColor Green
                    Write-LogMessage "Successfully stopped PID $($p.Id)" "SUCCESS"
                    $killed += $p.Id
                } catch {
                    Write-Host "❌ Failed to kill PID $($p.Id): $($_.Exception.Message)" -ForegroundColor Red
                    Write-LogMessage "Failed to stop PID $($p.Id): $($_.Exception.Message)" "ERROR"
                }
            }
        } else {
            Write-Host "⏭️ Skipping 32-bit iisexpress PID $($p.Id)" -ForegroundColor Gray
            Write-LogMessage "Skipped 32-bit process PID $($p.Id)" "DEBUG"
            $skipped += $p.Id
        }
    }

    # Summary reporting
    Write-Host ""
    if ($WhatIf) {
        Write-Host "📋 Dry Run Summary: Would kill $($killed.Count), Would skip $($skipped.Count)" -ForegroundColor Cyan
    } else {
        Write-Host "📊 Operation Summary: Killed $($killed.Count), Skipped $($skipped.Count)" -ForegroundColor White
        if ($killed.Count -gt 0) {
            Write-Host "✅ IIS Express cleanup completed successfully" -ForegroundColor Green
        }
    }

    return 0

} catch {
    Write-Host "❌ Fatal error during IIS Express cleanup: $($_.Exception.Message)" -ForegroundColor Red
    Write-LogMessage "Fatal error: $($_.Exception.Message)" "ERROR"
    return 1
}

