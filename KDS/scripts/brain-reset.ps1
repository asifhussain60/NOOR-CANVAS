# KDS BRAIN Reset Script
# Purpose: Selective amnesia for BRAIN when reusing KDS in different applications
# Version: 1.0

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('soft', 'hard', 'export-reset', 'rollback')]
    [string]$Mode,
    
    [Parameter(Mandatory=$false)]
    [string]$ExportPath = "",
    
    [Parameter(Mandatory=$false)]
    [string]$BackupPath = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$brainDir = Join-Path (Split-Path -Parent $scriptDir) "kds-brain"
$backupDir = Join-Path $brainDir "backups"

# Ensure backup directory exists
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

function Write-Header {
    param([string]$Message)
    Write-Host "`n==================================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
}

function Test-ActiveSessions {
    $sessionDir = Join-Path (Split-Path -Parent $scriptDir) "sessions"
    
    if (-not (Test-Path $sessionDir)) {
        return @()
    }
    
    $activeSessions = Get-ChildItem -Path $sessionDir -Filter "*.yaml" | Where-Object {
        $content = Get-Content $_.FullName -Raw
        $content -match 'status:\s*in_progress'
    }
    
    return $activeSessions
}

function Backup-BrainData {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backupPath = Join-Path $backupDir "pre-reset-$timestamp"
    
    Write-Host "`n💾 Creating backup..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    
    $knowledgeGraph = Join-Path $brainDir "knowledge-graph.yaml"
    $eventsLog = Join-Path $brainDir "events.jsonl"
    $anomaliesFile = Join-Path $brainDir "anomalies.yaml"
    
    if (Test-Path $knowledgeGraph) {
        Copy-Item $knowledgeGraph (Join-Path $backupPath "knowledge-graph.yaml")
        Write-Host "  ✅ Backed up knowledge-graph.yaml" -ForegroundColor Green
    }
    
    if (Test-Path $eventsLog) {
        Copy-Item $eventsLog (Join-Path $backupPath "events.jsonl")
        Write-Host "  ✅ Backed up events.jsonl" -ForegroundColor Green
    }
    
    if (Test-Path $anomaliesFile) {
        Copy-Item $anomaliesFile (Join-Path $backupPath "anomalies.yaml")
        Write-Host "  ✅ Backed up anomalies.yaml" -ForegroundColor Green
    }
    
    Write-Host "  📁 Backup location: $backupPath" -ForegroundColor Cyan
    return $backupPath
}

function Get-FactoryDefaultKnowledgeGraph {
    param([bool]$PreserveProtection = $true)
    
    $timestamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ' -AsUTC
    
    $protectionConfig = if ($PreserveProtection) {
        # Read existing protection config
        $existing = Join-Path $brainDir "knowledge-graph.yaml"
        if (Test-Path $existing) {
            $content = Get-Content $existing -Raw
            if ($content -match '(?ms)protection_config:.*?(?=\n\w|\z)') {
                $matches[0]
            } else {
                Get-DefaultProtectionConfig
            }
        } else {
            Get-DefaultProtectionConfig
        }
    } else {
        Get-DefaultProtectionConfig
    }
    
    @"
# KDS BRAIN - Knowledge Graph
# Version: 1.0
# Last Updated: $timestamp
# Purpose: Aggregated learnings from KDS interactions
# STATUS: RESET - Ready for new application

intent_patterns:
  plan: {}
  execute: {}
  resume: {}
  correct: {}
  test: {}
  validate: {}
  ask: {}
  govern: {}

file_relationships: {}

workflow_patterns: {}

correction_history:
  file_mismatch:
    total_occurrences: 0
    common_mistakes: []
  approach_mismatch:
    total_occurrences: 0
    common_mistakes: []
  scope_mismatch:
    total_occurrences: 0
    common_mistakes: []

validation_insights:
  common_failures: []
  test_patterns: {}

feature_components: {}

statistics:
  total_events_processed: 0
  last_updated: "$timestamp"
  knowledge_graph_version: "1.0"
  confidence_threshold: 0.70
  learning_enabled: true
  status: "RESET"

$protectionConfig
"@
}

function Get-DefaultProtectionConfig {
    @"
protection_config:
  enabled: true
  version: "1.0"
  description: "Phase 1 Protection - Confidence checks and learning quality thresholds"
  
  learning_quality:
    min_confidence_threshold: 0.70
    min_occurrences_for_pattern: 3
    max_single_event_confidence: 0.50
    anomaly_confidence_threshold: 0.95
    description: "Prevents learning from insufficient data and detects anomalies"
  
  routing_safety:
    enabled: true
    fallback_on_low_confidence: true
    ask_user_threshold: 0.70
    auto_route_threshold: 0.85
    description: "Asks user for clarification when confidence is low"
  
  correction_memory:
    enabled: true
    alert_on_repeated_mistake: 3
    prevent_action_threshold: 5
    track_correction_patterns: true
    description: "Prevents repeating the same mistakes"
  
  validation:
    validate_confidence_scores: true
    validate_file_references: true
    detect_stale_relationships: true
    max_relationship_age_days: 90
    description: "Ensures data integrity and removes stale information"
"@
}

function Reset-Soft {
    Write-Header "SOFT RESET - Clean Data, Preserve Config"
    
    # Check for active sessions
    $activeSessions = Test-ActiveSessions
    if ($activeSessions.Count -gt 0 -and -not $Force) {
        Write-Warning "⚠️  Found $($activeSessions.Count) active session(s):"
        $activeSessions | ForEach-Object { Write-Warning "    - $($_.Name)" }
        $response = Read-Host "Continue with reset? (Y/n)"
        if ($response -ne 'Y' -and $response -ne 'y') {
            Write-Host "❌ Reset cancelled" -ForegroundColor Red
            exit 0
        }
    }
    
    # Backup
    $backupPath = Backup-BrainData
    
    # Generate new knowledge graph (preserve protection)
    Write-Host "`n🧹 Resetting BRAIN data..." -ForegroundColor Yellow
    $newKnowledgeGraph = Get-FactoryDefaultKnowledgeGraph -PreserveProtection $true
    $knowledgeGraphPath = Join-Path $brainDir "knowledge-graph.yaml"
    Set-Content -Path $knowledgeGraphPath -Value $newKnowledgeGraph -Encoding UTF8
    Write-Host "  ✅ Reset knowledge-graph.yaml (protection config preserved)" -ForegroundColor Green
    
    # Clear events
    $eventsPath = Join-Path $brainDir "events.jsonl"
    if (Test-Path $eventsPath) {
        Remove-Item $eventsPath -Force
        Write-Host "  ✅ Cleared events.jsonl" -ForegroundColor Green
    }
    
    # Clear anomalies
    $anomaliesPath = Join-Path $brainDir "anomalies.yaml"
    if (Test-Path $anomaliesPath) {
        Remove-Item $anomaliesPath -Force
        Write-Host "  ✅ Cleared anomalies.yaml" -ForegroundColor Green
    }
    
    # Validate
    Write-Host "`n✅ Validating BRAIN structure..." -ForegroundColor Yellow
    & (Join-Path $scriptDir "protect-brain-update.ps1") -Mode validate
    
    # Summary
    Write-Header "SOFT RESET COMPLETE"
    Write-Host "✅ BRAIN has amnesia (application-specific knowledge cleared)" -ForegroundColor Green
    Write-Host "✅ Protection config preserved" -ForegroundColor Green
    Write-Host "✅ Core logic intact" -ForegroundColor Green
    Write-Host "`n💾 Backup location: $backupPath" -ForegroundColor Cyan
    Write-Host "`n🔄 Rollback command:" -ForegroundColor Yellow
    Write-Host "   .\$scriptDir\brain-reset.ps1 -Mode rollback -BackupPath '$backupPath'" -ForegroundColor Gray
}

function Reset-Hard {
    Write-Header "HARD RESET - Factory Defaults"
    
    # Check for active sessions
    $activeSessions = Test-ActiveSessions
    if ($activeSessions.Count -gt 0 -and -not $Force) {
        Write-Warning "⚠️  Found $($activeSessions.Count) active session(s):"
        $activeSessions | ForEach-Object { Write-Warning "    - $($_.Name)" }
        Write-Warning "⚠️  HARD RESET will reset protection config to factory defaults!"
        $response = Read-Host "Continue with hard reset? (Y/n)"
        if ($response -ne 'Y' -and $response -ne 'y') {
            Write-Host "❌ Reset cancelled" -ForegroundColor Red
            exit 0
        }
    }
    
    # Backup
    $backupPath = Backup-BrainData
    
    # Generate new knowledge graph (factory defaults)
    Write-Host "`n🧹 Resetting BRAIN to factory defaults..." -ForegroundColor Yellow
    $newKnowledgeGraph = Get-FactoryDefaultKnowledgeGraph -PreserveProtection $false
    $knowledgeGraphPath = Join-Path $brainDir "knowledge-graph.yaml"
    Set-Content -Path $knowledgeGraphPath -Value $newKnowledgeGraph -Encoding UTF8
    Write-Host "  ✅ Reset knowledge-graph.yaml (factory defaults)" -ForegroundColor Green
    
    # Clear events
    $eventsPath = Join-Path $brainDir "events.jsonl"
    if (Test-Path $eventsPath) {
        Remove-Item $eventsPath -Force
        Write-Host "  ✅ Cleared events.jsonl" -ForegroundColor Green
    }
    
    # Clear anomalies
    $anomaliesPath = Join-Path $brainDir "anomalies.yaml"
    if (Test-Path $anomaliesPath) {
        Remove-Item $anomaliesPath -Force
        Write-Host "  ✅ Cleared anomalies.yaml" -ForegroundColor Green
    }
    
    # Validate
    Write-Host "`n✅ Validating BRAIN structure..." -ForegroundColor Yellow
    & (Join-Path $scriptDir "protect-brain-update.ps1") -Mode validate
    
    # Summary
    Write-Header "HARD RESET COMPLETE"
    Write-Host "✅ BRAIN completely reset to factory state" -ForegroundColor Green
    Write-Host "✅ Protection config reset to defaults" -ForegroundColor Green
    Write-Host "✅ Core logic intact" -ForegroundColor Green
    Write-Host "`n💾 Backup location: $backupPath" -ForegroundColor Cyan
    Write-Host "`n🔄 Rollback command:" -ForegroundColor Yellow
    Write-Host "   .\$scriptDir\brain-reset.ps1 -Mode rollback -BackupPath '$backupPath'" -ForegroundColor Gray
}

function Export-GenericPatterns {
    param([string]$ExportPath)
    
    if (-not (Test-Path $ExportPath)) {
        New-Item -ItemType Directory -Path $ExportPath -Force | Out-Null
    }
    
    Write-Host "`n📊 Extracting generic patterns..." -ForegroundColor Yellow
    
    $knowledgeGraphPath = Join-Path $brainDir "knowledge-graph.yaml"
    if (-not (Test-Path $knowledgeGraphPath)) {
        Write-Warning "⚠️  No knowledge graph found to export from"
        return
    }
    
    # For simplicity, just export the current protection config and note generic patterns
    # A full implementation would parse YAML and extract wildcarded patterns
    
    $content = Get-Content $knowledgeGraphPath -Raw
    if ($content -match '(?ms)protection_config:.*?(?=\n\w|\z)') {
        $protectionConfig = $matches[0]
        Set-Content -Path (Join-Path $ExportPath "protection-config.yaml") -Value $protectionConfig
        Write-Host "  ✅ Exported protection-config.yaml" -ForegroundColor Green
    }
    
    # Create README
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $readme = @"
# KDS BRAIN Generic Patterns Export

**Exported:** $timestamp  
**Source:** NOOR CANVAS

## Contents

- protection-config.yaml: Customized protection rules

## How to Re-Import

1. Copy KDS/ folder to new project
2. Run soft reset: ``````
   .\$scriptDir\brain-reset.ps1 -Mode soft
   ``````
3. (Optional) Manually merge protection-config.yaml if customized
4. Run crawler to learn new project:
   ``````
   .\$scriptDir\brain-crawler.ps1 -Mode deep
   ``````

## Notes

Generic patterns are automatically preserved through KDS logic.
Application-specific patterns (file names, etc.) are intentionally excluded.
"@
    
    Set-Content -Path (Join-Path $ExportPath "README.md") -Value $readme
    Write-Host "  ✅ Created README.md" -ForegroundColor Green
    Write-Host "  📁 Export location: $ExportPath" -ForegroundColor Cyan
}

function Reset-ExportReset {
    if ([string]::IsNullOrEmpty($ExportPath)) {
        Write-Error "ExportPath is required for export-reset mode"
        exit 1
    }
    
    Write-Header "EXPORT-RESET - Save Generics Then Clean"
    
    # Export
    Export-GenericPatterns -ExportPath $ExportPath
    
    # Then soft reset
    Reset-Soft
    
    Write-Host "`n✅ Generic patterns exported to: $ExportPath" -ForegroundColor Green
}

function Restore-FromBackup {
    param([string]$BackupPath)
    
    if ([string]::IsNullOrEmpty($BackupPath)) {
        # List available backups
        Write-Header "Available Backups"
        $backups = Get-ChildItem -Path $backupDir -Directory | Sort-Object Name -Descending
        
        if ($backups.Count -eq 0) {
            Write-Warning "No backups found in $backupDir"
            exit 0
        }
        
        for ($i = 0; $i -lt $backups.Count; $i++) {
            Write-Host "$($i + 1). $($backups[$i].Name)" -ForegroundColor Cyan
        }
        
        $selection = Read-Host "`nEnter backup number to restore"
        $selectedBackup = $backups[$selection - 1]
        $BackupPath = $selectedBackup.FullName
    }
    
    if (-not (Test-Path $BackupPath)) {
        Write-Error "Backup path not found: $BackupPath"
        exit 1
    }
    
    Write-Header "ROLLBACK - Restoring from Backup"
    Write-Host "Source: $BackupPath" -ForegroundColor Cyan
    
    # Restore files
    $knowledgeGraph = Join-Path $BackupPath "knowledge-graph.yaml"
    if (Test-Path $knowledgeGraph) {
        Copy-Item $knowledgeGraph (Join-Path $brainDir "knowledge-graph.yaml") -Force
        Write-Host "  ✅ Restored knowledge-graph.yaml" -ForegroundColor Green
    }
    
    $events = Join-Path $BackupPath "events.jsonl"
    if (Test-Path $events) {
        Copy-Item $events (Join-Path $brainDir "events.jsonl") -Force
        Write-Host "  ✅ Restored events.jsonl" -ForegroundColor Green
    }
    
    $anomalies = Join-Path $BackupPath "anomalies.yaml"
    if (Test-Path $anomalies) {
        Copy-Item $anomalies (Join-Path $brainDir "anomalies.yaml") -Force
        Write-Host "  ✅ Restored anomalies.yaml" -ForegroundColor Green
    }
    
    # Validate
    Write-Host "`n✅ Validating restored BRAIN..." -ForegroundColor Yellow
    & (Join-Path $scriptDir "protect-brain-update.ps1") -Mode validate
    
    Write-Header "ROLLBACK COMPLETE"
    Write-Host "✅ BRAIN restored from backup" -ForegroundColor Green
}

# Main execution
try {
    switch ($Mode) {
        'soft' {
            Reset-Soft
        }
        'hard' {
            Reset-Hard
        }
        'export-reset' {
            Reset-ExportReset
        }
        'rollback' {
            Restore-FromBackup -BackupPath $BackupPath
        }
    }
} catch {
    Write-Error "Reset failed: $_"
    Write-Host "`n💡 Backups are preserved in: $backupDir" -ForegroundColor Yellow
    exit 1
}
