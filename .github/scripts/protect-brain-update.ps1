# KDS BRAIN Protection - Update Guard Script
# Version: 1.0 (Phase 2)
# Purpose: Backup, validate, and safely update knowledge-graph.yaml

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$KnowledgeGraphPath = "$PSScriptRoot\..\kds-brain\knowledge-graph.yaml",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('validate', 'backup', 'rollback', 'update')]
    [string]$Mode = 'validate',
    
    [Parameter(Mandatory=$false)]
    [string]$NewContent,
    
    [Parameter(Mandatory=$false)]
    [int]$MaxBackups = 10
)

$ErrorActionPreference = 'Stop'

# Paths
$backupDir = Join-Path (Split-Path $KnowledgeGraphPath -Parent) "backups"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = Join-Path $backupDir "knowledge-graph_$timestamp.yaml"

#region Validation Functions

function Test-YamlStructure {
    param([string]$Content)
    
    Write-Verbose "Validating YAML structure..."
    
    # Basic YAML syntax checks
    if ($Content -notmatch 'intent_patterns:') {
        throw "Missing required section: intent_patterns"
    }
    
    if ($Content -notmatch 'file_relationships:') {
        throw "Missing required section: file_relationships"
    }
    
    if ($Content -notmatch 'statistics:') {
        throw "Missing required section: statistics"
    }
    
    if ($Content -notmatch 'protection_config:') {
        throw "Missing required section: protection_config"
    }
    
    Write-Verbose "✅ YAML structure valid"
    return $true
}

function Test-ConfidenceScores {
    param([string]$Content)
    
    Write-Verbose "Validating confidence scores..."
    
    # Extract all confidence values (basic regex pattern)
    $confidencePattern = 'confidence:\s+([\d.]+)'
    $matches = [regex]::Matches($Content, $confidencePattern)
    
    foreach ($match in $matches) {
        $value = [double]$match.Groups[1].Value
        
        if ($value -lt 0.0 -or $value -gt 1.0) {
            throw "Invalid confidence score: $value (must be 0.0-1.0)"
        }
        
        if ($value -gt 0.95) {
            Write-Warning "⚠️ High confidence score detected: $value (review for anomalies)"
        }
    }
    
    Write-Verbose "✅ Confidence scores valid"
    return $true
}

function Test-Statistics {
    param([string]$Content)
    
    Write-Verbose "Validating statistics section..."
    
    # Check for required statistics fields
    if ($Content -notmatch 'total_events_processed:') {
        throw "Missing statistics: total_events_processed"
    }
    
    if ($Content -notmatch 'confidence_threshold:') {
        throw "Missing statistics: confidence_threshold"
    }
    
    if ($Content -notmatch 'learning_enabled:') {
        throw "Missing statistics: learning_enabled"
    }
    
    Write-Verbose "✅ Statistics section valid"
    return $true
}

function Test-ProtectionConfig {
    param([string]$Content)
    
    Write-Verbose "Validating protection configuration..."
    
    # Check for required protection config
    if ($Content -notmatch 'protection_config:') {
        throw "Missing protection_config section"
    }
    
    if ($Content -notmatch 'min_confidence_threshold:') {
        throw "Missing protection setting: min_confidence_threshold"
    }
    
    if ($Content -notmatch 'min_occurrences_for_pattern:') {
        throw "Missing protection setting: min_occurrences_for_pattern"
    }
    
    Write-Verbose "✅ Protection config valid"
    return $true
}

#endregion

#region Backup Functions

function New-BackupDirectory {
    if (-not (Test-Path $backupDir)) {
        Write-Verbose "Creating backup directory: $backupDir"
        New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
    }
}

function New-Backup {
    param([string]$SourcePath)
    
    if (-not (Test-Path $SourcePath)) {
        Write-Warning "⚠️ Source file not found: $SourcePath (skipping backup)"
        return $null
    }
    
    New-BackupDirectory
    
    Write-Verbose "Creating backup: $backupPath"
    Copy-Item -Path $SourcePath -Destination $backupPath -Force
    
    # Cleanup old backups
    Remove-OldBackups
    
    Write-Host "✅ Backup created: $backupPath" -ForegroundColor Green
    return $backupPath
}

function Remove-OldBackups {
    $backups = Get-ChildItem -Path $backupDir -Filter "knowledge-graph_*.yaml" | 
               Sort-Object LastWriteTime -Descending
    
    if ($backups.Count -gt $MaxBackups) {
        $toDelete = $backups | Select-Object -Skip $MaxBackups
        foreach ($backup in $toDelete) {
            Write-Verbose "Removing old backup: $($backup.Name)"
            Remove-Item $backup.FullName -Force
        }
        Write-Verbose "✅ Cleaned up $($toDelete.Count) old backup(s)"
    }
}

function Restore-FromBackup {
    param([string]$BackupPath, [string]$TargetPath)
    
    if (-not (Test-Path $BackupPath)) {
        throw "Backup file not found: $BackupPath"
    }
    
    Write-Verbose "Restoring from backup: $BackupPath"
    Copy-Item -Path $BackupPath -Destination $TargetPath -Force
    
    Write-Host "✅ Restored from backup: $BackupPath" -ForegroundColor Green
}

#endregion

#region Update Functions

function Update-KnowledgeGraph {
    param([string]$Content, [string]$TargetPath)
    
    Write-Verbose "Updating knowledge graph: $TargetPath"
    
    # Create backup first
    $backup = New-Backup -SourcePath $TargetPath
    
    try {
        # Validate new content
        Test-YamlStructure -Content $Content
        Test-ConfidenceScores -Content $Content
        Test-Statistics -Content $Content
        Test-ProtectionConfig -Content $Content
        
        # Write new content
        Set-Content -Path $TargetPath -Value $Content -Encoding UTF8
        
        Write-Host "✅ Knowledge graph updated successfully" -ForegroundColor Green
        
    } catch {
        Write-Error "❌ Update failed: $_"
        
        if ($backup) {
            Write-Host "🔄 Rolling back to previous version..." -ForegroundColor Yellow
            Restore-FromBackup -BackupPath $backup -TargetPath $TargetPath
            Write-Host "✅ Rollback complete" -ForegroundColor Green
        }
        
        throw
    }
}

#endregion

#region Main Execution

switch ($Mode) {
    'validate' {
        Write-Host "🔍 Validating knowledge graph..." -ForegroundColor Cyan
        
        if (-not (Test-Path $KnowledgeGraphPath)) {
            Write-Error "❌ Knowledge graph not found: $KnowledgeGraphPath"
            exit 1
        }
        
        $content = Get-Content -Path $KnowledgeGraphPath -Raw
        
        try {
            Test-YamlStructure -Content $content
            Test-ConfidenceScores -Content $content
            Test-Statistics -Content $content
            Test-ProtectionConfig -Content $content
            
            Write-Host "✅ Validation successful - Knowledge graph is valid" -ForegroundColor Green
            exit 0
            
        } catch {
            Write-Error "❌ Validation failed: $_"
            exit 1
        }
    }
    
    'backup' {
        Write-Host "💾 Creating backup..." -ForegroundColor Cyan
        
        $backup = New-Backup -SourcePath $KnowledgeGraphPath
        
        if ($backup) {
            Write-Host "✅ Backup complete: $backup" -ForegroundColor Green
            exit 0
        } else {
            Write-Error "❌ Backup failed"
            exit 1
        }
    }
    
    'rollback' {
        Write-Host "🔄 Rolling back to latest backup..." -ForegroundColor Cyan
        
        if (-not (Test-Path $backupDir)) {
            Write-Error "❌ No backups found"
            exit 1
        }
        
        $latestBackup = Get-ChildItem -Path $backupDir -Filter "knowledge-graph_*.yaml" | 
                       Sort-Object LastWriteTime -Descending | 
                       Select-Object -First 1
        
        if (-not $latestBackup) {
            Write-Error "❌ No backup files found"
            exit 1
        }
        
        try {
            Restore-FromBackup -BackupPath $latestBackup.FullName -TargetPath $KnowledgeGraphPath
            Write-Host "✅ Rollback successful" -ForegroundColor Green
            exit 0
            
        } catch {
            Write-Error "❌ Rollback failed: $_"
            exit 1
        }
    }
    
    'update' {
        Write-Host "🔄 Updating knowledge graph with protection..." -ForegroundColor Cyan
        
        if (-not $NewContent) {
            Write-Error "❌ NewContent parameter required for update mode"
            exit 1
        }
        
        try {
            Update-KnowledgeGraph -Content $NewContent -TargetPath $KnowledgeGraphPath
            Write-Host "✅ Update complete" -ForegroundColor Green
            exit 0
            
        } catch {
            Write-Error "❌ Update failed: $_"
            exit 1
        }
    }
}

#endregion
