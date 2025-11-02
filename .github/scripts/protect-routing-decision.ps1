# KDS BRAIN Protection - Routing Decision Guard Script
# Version: 1.0 (Phase 2)
# Purpose: Validate routing decisions before executing

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$Intent,
    
    [Parameter(Mandatory=$true)]
    [double]$Confidence,
    
    [Parameter(Mandatory=$false)]
    [int]$Occurrences = 0,
    
    [Parameter(Mandatory=$false)]
    [string]$UserPhrase,
    
    [Parameter(Mandatory=$false)]
    [string]$KnowledgeGraphPath = "$PSScriptRoot\..\kds-brain\knowledge-graph.yaml"
)

$ErrorActionPreference = 'Stop'

#region Protection Config

function Get-ProtectionConfig {
    param([string]$Path)
    
    Write-Verbose "Loading protection configuration..."
    
    if (-not (Test-Path $Path)) {
        Write-Warning "⚠️ Knowledge graph not found - using default thresholds"
        return @{
            ask_user_threshold = 0.70
            auto_route_threshold = 0.85
            min_occurrences = 3
            anomaly_threshold = 0.95
        }
    }
    
    # Read YAML (basic parsing - would use proper YAML parser in production)
    $content = Get-Content -Path $Path -Raw
    
    # Extract protection config values
    $config = @{}
    
    if ($content -match 'ask_user_threshold:\s+([\d.]+)') {
        $config.ask_user_threshold = [double]$Matches[1]
    } else {
        $config.ask_user_threshold = 0.70
    }
    
    if ($content -match 'auto_route_threshold:\s+([\d.]+)') {
        $config.auto_route_threshold = [double]$Matches[1]
    } else {
        $config.auto_route_threshold = 0.85
    }
    
    if ($content -match 'min_occurrences_for_pattern:\s+(\d+)') {
        $config.min_occurrences = [int]$Matches[1]
    } else {
        $config.min_occurrences = 3
    }
    
    if ($content -match 'anomaly_confidence_threshold:\s+([\d.]+)') {
        $config.anomaly_threshold = [double]$Matches[1]
    } else {
        $config.anomaly_threshold = 0.95
    }
    
    Write-Verbose "Protection config loaded: ask=$($config.ask_user_threshold), auto=$($config.auto_route_threshold), min_occ=$($config.min_occurrences)"
    
    return $config
}

#endregion

#region Validation Functions

function Test-ConfidenceValid {
    param([double]$Confidence)
    
    if ($Confidence -lt 0.0 -or $Confidence -gt 1.0) {
        throw "Invalid confidence score: $Confidence (must be 0.0-1.0)"
    }
    
    return $true
}

function Test-AnomalyDetection {
    param(
        [double]$Confidence,
        [int]$Occurrences,
        [double]$Threshold
    )
    
    Write-Verbose "Checking for anomalies..."
    
    # Anomaly: Very high confidence with very few occurrences
    if ($Confidence -gt $Threshold -and $Occurrences -eq 1) {
        return @{
            detected = $true
            reason = "Suspiciously high confidence ($Confidence) with only 1 occurrence"
            severity = "high"
        }
    }
    
    # Anomaly: Perfect confidence (1.0) is suspicious unless many occurrences
    if ($Confidence -eq 1.0 -and $Occurrences -lt 10) {
        return @{
            detected = $true
            reason = "Perfect confidence (1.0) with only $Occurrences occurrence(s)"
            severity = "medium"
        }
    }
    
    return @{
        detected = $false
        reason = "No anomalies detected"
        severity = "none"
    }
}

function Get-SafetyLevel {
    param(
        [double]$Confidence,
        [int]$Occurrences,
        [hashtable]$Config
    )
    
    Write-Verbose "Calculating safety level..."
    
    # High safety: High confidence + sufficient occurrences
    if ($Confidence -ge $Config.auto_route_threshold -and $Occurrences -ge $Config.min_occurrences) {
        return @{
            level = "high"
            action = "auto_route"
            message = "High confidence with sufficient evidence"
        }
    }
    
    # Medium safety: Medium confidence + sufficient occurrences
    if ($Confidence -ge $Config.ask_user_threshold -and 
        $Confidence -lt $Config.auto_route_threshold -and 
        $Occurrences -ge $Config.min_occurrences) {
        return @{
            level = "medium"
            action = "ask_confirmation"
            message = "Medium confidence - recommend user confirmation"
        }
    }
    
    # Low safety: Insufficient data
    if ($Confidence -ge $Config.ask_user_threshold -and $Occurrences -lt $Config.min_occurrences) {
        return @{
            level = "low"
            action = "pattern_matching_fallback"
            message = "Insufficient occurrences ($Occurrences < $($Config.min_occurrences))"
        }
    }
    
    # Low safety: Low confidence
    if ($Confidence -lt $Config.ask_user_threshold) {
        return @{
            level = "low"
            action = "pattern_matching_fallback"
            message = "Low confidence ($Confidence < $($Config.ask_user_threshold))"
        }
    }
    
    # Default to low
    return @{
        level = "low"
        action = "pattern_matching_fallback"
        message = "Default fallback"
    }
}

#endregion

#region Decision Functions

function Get-RoutingDecision {
    param(
        [string]$Intent,
        [double]$Confidence,
        [int]$Occurrences,
        [hashtable]$Config
    )
    
    Write-Host "🔍 Analyzing routing decision..." -ForegroundColor Cyan
    
    # Validate confidence
    try {
        Test-ConfidenceValid -Confidence $Confidence
    } catch {
        Write-Error "❌ $_"
        return @{
            approved = $false
            reason = "Invalid confidence score"
            action = "error"
        }
    }
    
    # Check for anomalies
    $anomaly = Test-AnomalyDetection -Confidence $Confidence -Occurrences $Occurrences -Threshold $Config.anomaly_threshold
    
    if ($anomaly.detected) {
        Write-Warning "🚨 ANOMALY DETECTED: $($anomaly.reason)"
        return @{
            approved = $false
            reason = $anomaly.reason
            action = "pattern_matching_fallback"
            anomaly = $true
            severity = $anomaly.severity
        }
    }
    
    # Get safety level
    $safety = Get-SafetyLevel -Confidence $Confidence -Occurrences $Occurrences -Config $Config
    
    Write-Host "📊 Routing Analysis:" -ForegroundColor Cyan
    Write-Host "   Intent: $Intent"
    Write-Host "   Confidence: $Confidence"
    Write-Host "   Occurrences: $Occurrences"
    Write-Host "   Safety Level: $($safety.level)"
    Write-Host "   Recommended Action: $($safety.action)"
    Write-Host "   Reason: $($safety.message)"
    
    # Determine approval
    $approved = $safety.action -eq "auto_route"
    
    return @{
        approved = $approved
        safety_level = $safety.level
        action = $safety.action
        reason = $safety.message
        anomaly = $false
    }
}

#endregion

#region Main Execution

Write-Host "🛡️ KDS BRAIN Protection - Routing Decision Guard" -ForegroundColor Green
Write-Host ""

# Load protection config
$config = Get-ProtectionConfig -Path $KnowledgeGraphPath

# Get routing decision
$decision = Get-RoutingDecision -Intent $Intent -Confidence $Confidence -Occurrences $Occurrences -Config $config

Write-Host ""

# Display decision
if ($decision.approved) {
    Write-Host "✅ ROUTING APPROVED" -ForegroundColor Green
    Write-Host "   Action: Auto-route to $Intent agent" -ForegroundColor Green
    exit 0
    
} elseif ($decision.anomaly) {
    Write-Host "🚨 ROUTING BLOCKED - ANOMALY DETECTED" -ForegroundColor Red
    Write-Host "   Reason: $($decision.reason)" -ForegroundColor Red
    Write-Host "   Action: Falling back to pattern matching" -ForegroundColor Yellow
    exit 2  # Anomaly exit code
    
} else {
    Write-Host "⚠️ ROUTING REQUIRES CONFIRMATION" -ForegroundColor Yellow
    Write-Host "   Safety Level: $($decision.safety_level)" -ForegroundColor Yellow
    Write-Host "   Reason: $($decision.reason)" -ForegroundColor Yellow
    Write-Host "   Action: $($decision.action)" -ForegroundColor Yellow
    exit 1  # Low confidence exit code
}

#endregion
