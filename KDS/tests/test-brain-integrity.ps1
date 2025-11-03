# KDS BRAIN Integrity Test
# Purpose: Validate all BRAIN files exist and have correct structure/syntax
# Usage: .\test-brain-integrity.ps1 [-JsonOutput] [-Verbose]
# Exit Code: 0 on success, non-zero on failure

param(
    [switch]$JsonOutput = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = 'Stop'

# Performance tracking
$testStartTime = Get-Date

# Initialize results structure
$results = @{
    timestamp = (Get-Date).ToString("o")
    overall_status = "PASS"
    total_checks = 0
    passed = 0
    failed = 0
    warnings = 0
    execution_time_ms = 0
    checks = @()
}

# Helper function to add check result
function Add-CheckResult {
    param(
        [string]$Category,
        [string]$Check,
        [string]$Status,  # PASS, FAIL, WARN
        [string]$Message,
        [object]$Details = $null
    )
    
    $results.total_checks++
    
    switch ($Status) {
        "PASS" { $results.passed++ }
        "FAIL" { $results.failed++; $results.overall_status = "FAIL" }
        "WARN" { $results.warnings++ }
    }
    
    $checkResult = @{
        category = $Category
        check = $Check
        status = $Status
        message = $Message
    }
    
    if ($Details) {
        $checkResult.details = $Details
    }
    
    $results.checks += $checkResult
    
    if (-not $JsonOutput) {
        $icon = switch ($Status) {
            "PASS" { "✅"; $color = "Green" }
            "FAIL" { "❌"; $color = "Red" }
            "WARN" { "⚠️"; $color = "Yellow" }
        }
        
        if ($Verbose -or $Status -ne "PASS") {
            Write-Host "  $icon $Check" -ForegroundColor $color
            if ($Verbose -and $Message) {
                Write-Host "     $Message" -ForegroundColor Gray
            }
        }
    }
}

# Display header
if (-not $JsonOutput) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  🧠 KDS BRAIN Integrity Test" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

# Define BRAIN file paths
$kdsRoot = Split-Path $PSScriptRoot -Parent
$brainRoot = Join-Path $kdsRoot "kds-brain"
$brainFiles = @{
    "conversation-history.jsonl" = Join-Path $brainRoot "conversation-history.jsonl"
    "knowledge-graph.yaml" = Join-Path $brainRoot "knowledge-graph.yaml"
    "development-context.yaml" = Join-Path $brainRoot "development-context.yaml"
    "events.jsonl" = Join-Path $brainRoot "events.jsonl"
}

#region File Existence Checks
if (-not $JsonOutput) {
    Write-Host "Category: File Existence" -ForegroundColor Yellow
}

foreach ($file in $brainFiles.Keys) {
    $path = $brainFiles[$file]
    if (Test-Path $path) {
        Add-CheckResult -Category "File Existence" -Check "$file exists" -Status "PASS" -Message "Found at: $path"
    } else {
        Add-CheckResult -Category "File Existence" -Check "$file exists" -Status "FAIL" -Message "Missing: $path"
    }
}

if (-not $JsonOutput) { Write-Host "" }
#endregion

#region File Size Validation
if (-not $JsonOutput) {
    Write-Host "Category: File Size Validation" -ForegroundColor Yellow
}

# Validate events.jsonl size < 50MB
$eventsPath = $brainFiles["events.jsonl"]
if (Test-Path $eventsPath) {
    $eventsSize = (Get-Item $eventsPath).Length
    $eventsSizeMB = [math]::Round($eventsSize / 1MB, 2)
    
    if ($eventsSize -lt 50MB) {
        Add-CheckResult -Category "File Size" -Check "events.jsonl size < 50MB" -Status "PASS" `
            -Message "Size: $eventsSizeMB MB" -Details @{ size_bytes = $eventsSize; size_mb = $eventsSizeMB }
    } else {
        Add-CheckResult -Category "File Size" -Check "events.jsonl size < 50MB" -Status "FAIL" `
            -Message "Size: $eventsSizeMB MB (exceeds limit)" -Details @{ size_bytes = $eventsSize; size_mb = $eventsSizeMB }
    }
} else {
    Add-CheckResult -Category "File Size" -Check "events.jsonl size < 50MB" -Status "FAIL" -Message "File not found"
}

if (-not $JsonOutput) { Write-Host "" }
#endregion

#region JSONL Syntax Validation
if (-not $JsonOutput) {
    Write-Host "Category: JSONL Syntax Validation" -ForegroundColor Yellow
}

# Helper function to validate JSONL files (handles both single-line and multi-line JSON)
function Test-JsonlFile {
    param([string]$FilePath)
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        
        # Try to parse as array of JSON objects (handles multi-line JSON)
        # Split on pattern: }\s*\n\s*{ or }\s*\n\s*\[ (handles both objects and arrays)
        $jsonObjects = @()
        $currentObject = ""
        $braceCount = 0
        $bracketCount = 0
        $inString = $false
        $escapeNext = $false
        
        foreach ($char in $content.ToCharArray()) {
            if ($escapeNext) {
                $escapeNext = $false
                $currentObject += $char
                continue
            }
            
            if ($char -eq '\') {
                $escapeNext = $true
                $currentObject += $char
                continue
            }
            
            if ($char -eq '"' -and -not $escapeNext) {
                $inString = -not $inString
            }
            
            if (-not $inString) {
                if ($char -eq '{') { $braceCount++ }
                if ($char -eq '}') { $braceCount-- }
                if ($char -eq '[') { $bracketCount++ }
                if ($char -eq ']') { $bracketCount-- }
            }
            
            $currentObject += $char
            
            # When we close an object/array at root level, we have a complete JSON object
            if ($braceCount -eq 0 -and $bracketCount -eq 0 -and $currentObject.Trim().Length -gt 0) {
                $trimmed = $currentObject.Trim()
                if ($trimmed.StartsWith('{') -or $trimmed.StartsWith('[')) {
                    $jsonObjects += $trimmed
                    $currentObject = ""
                }
            }
        }
        
        # Add any remaining object
        if ($currentObject.Trim().Length -gt 0) {
            $trimmed = $currentObject.Trim()
            if ($trimmed.StartsWith('{') -or $trimmed.StartsWith('[')) {
                $jsonObjects += $trimmed
            }
        }
        
        # Validate each JSON object
        $validCount = 0
        $invalidObjects = @()
        
        for ($i = 0; $i -lt $jsonObjects.Count; $i++) {
            try {
                $null = $jsonObjects[$i] | ConvertFrom-Json -ErrorAction Stop
                $validCount++
            } catch {
                $invalidObjects += ($i + 1)
            }
        }
        
        return @{
            success = ($invalidObjects.Count -eq 0)
            total = $jsonObjects.Count
            valid = $validCount
            invalid_indices = $invalidObjects
        }
    } catch {
        return @{
            success = $false
            error = $_.Exception.Message
        }
    }
}

# Validate conversation-history.jsonl
$convHistPath = $brainFiles["conversation-history.jsonl"]
if (Test-Path $convHistPath) {
    $convValidation = Test-JsonlFile -FilePath $convHistPath
    
    if ($convValidation.success) {
        Add-CheckResult -Category "JSONL Syntax" -Check "conversation-history.jsonl syntax valid" -Status "PASS" `
            -Message "$($convValidation.valid) JSON objects validated" -Details @{ total_objects = $convValidation.total; valid_objects = $convValidation.valid }
    } elseif ($convValidation.error) {
        Add-CheckResult -Category "JSONL Syntax" -Check "conversation-history.jsonl syntax valid" -Status "FAIL" `
            -Message "Error: $($convValidation.error)"
    } else {
        Add-CheckResult -Category "JSONL Syntax" -Check "conversation-history.jsonl syntax valid" -Status "FAIL" `
            -Message "$($convValidation.invalid_indices.Count) invalid objects" -Details @{ invalid_indices = $convValidation.invalid_indices }
    }
}

# Validate events.jsonl
if (Test-Path $eventsPath) {
    $eventsValidation = Test-JsonlFile -FilePath $eventsPath
    
    if ($eventsValidation.success) {
        Add-CheckResult -Category "JSONL Syntax" -Check "events.jsonl syntax valid" -Status "PASS" `
            -Message "$($eventsValidation.valid) JSON objects validated" -Details @{ total_objects = $eventsValidation.total; valid_objects = $eventsValidation.valid }
    } elseif ($eventsValidation.error) {
        Add-CheckResult -Category "JSONL Syntax" -Check "events.jsonl syntax valid" -Status "FAIL" `
            -Message "Error: $($eventsValidation.error)"
    } else {
        Add-CheckResult -Category "JSONL Syntax" -Check "events.jsonl syntax valid" -Status "FAIL" `
            -Message "$($eventsValidation.invalid_indices.Count) invalid objects" -Details @{ invalid_indices = $eventsValidation.invalid_indices }
    }
}

if (-not $JsonOutput) { Write-Host "" }
#endregion

#region YAML Syntax Validation
if (-not $JsonOutput) {
    Write-Host "Category: YAML Syntax Validation" -ForegroundColor Yellow
}

# Helper function to validate YAML (basic validation - checks for common issues)
function Test-YamlSyntax {
    param([string]$FilePath)
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        
        # Basic YAML validation checks
        $issues = @()
        
        # Check for tabs (YAML doesn't allow tabs for indentation)
        if ($content -match "`t") {
            $issues += "Contains tabs (YAML requires spaces for indentation)"
        }
        
        # Check for unbalanced quotes
        $singleQuotes = ([regex]::Matches($content, "'")).Count
        $doubleQuotes = ([regex]::Matches($content, '"')).Count
        if ($singleQuotes % 2 -ne 0) {
            $issues += "Unbalanced single quotes"
        }
        if ($doubleQuotes % 2 -ne 0) {
            $issues += "Unbalanced double quotes"
        }
        
        # Try to parse as PowerShell custom object (limited YAML support)
        # Note: Full YAML validation would require external module like powershell-yaml
        
        return @{
            valid = ($issues.Count -eq 0)
            issues = $issues
        }
    } catch {
        return @{
            valid = $false
            issues = @("Error reading file: $($_.Exception.Message)")
        }
    }
}

# Validate knowledge-graph.yaml
$kgPath = $brainFiles["knowledge-graph.yaml"]
if (Test-Path $kgPath) {
    $kgValidation = Test-YamlSyntax -FilePath $kgPath
    
    if ($kgValidation.valid) {
        Add-CheckResult -Category "YAML Syntax" -Check "knowledge-graph.yaml syntax valid" -Status "PASS" `
            -Message "Basic YAML validation passed"
    } else {
        Add-CheckResult -Category "YAML Syntax" -Check "knowledge-graph.yaml syntax valid" -Status "FAIL" `
            -Message "Validation issues found" -Details @{ issues = $kgValidation.issues }
    }
}

# Validate development-context.yaml
$dcPath = $brainFiles["development-context.yaml"]
if (Test-Path $dcPath) {
    $dcValidation = Test-YamlSyntax -FilePath $dcPath
    
    if ($dcValidation.valid) {
        Add-CheckResult -Category "YAML Syntax" -Check "development-context.yaml syntax valid" -Status "PASS" `
            -Message "Basic YAML validation passed"
    } else {
        Add-CheckResult -Category "YAML Syntax" -Check "development-context.yaml syntax valid" -Status "FAIL" `
            -Message "Validation issues found" -Details @{ issues = $dcValidation.issues }
    }
}

if (-not $JsonOutput) { Write-Host "" }
#endregion

#region Conversation History FIFO Validation
if (-not $JsonOutput) {
    Write-Host "Category: Conversation History FIFO" -ForegroundColor Yellow
}

if (Test-Path $convHistPath) {
    try {
        $conversations = Get-Content $convHistPath | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object { $_ | ConvertFrom-Json }
        $convCount = $conversations.Count
        
        # Check max 20 conversations
        if ($convCount -le 20) {
            Add-CheckResult -Category "Conversation FIFO" -Check "Conversation count <= 20" -Status "PASS" `
                -Message "Count: $convCount" -Details @{ count = $convCount }
        } else {
            Add-CheckResult -Category "Conversation FIFO" -Check "Conversation count <= 20" -Status "FAIL" `
                -Message "Count: $convCount (exceeds limit)" -Details @{ count = $convCount; limit = 20 }
        }
        
        # Check for duplicate conversation IDs
        $conversationIds = $conversations | ForEach-Object { $_.conversation_id } | Where-Object { $_ }
        $uniqueIds = $conversationIds | Select-Object -Unique
        
        if ($conversationIds.Count -eq $uniqueIds.Count) {
            Add-CheckResult -Category "Conversation FIFO" -Check "No duplicate conversation IDs" -Status "PASS" `
                -Message "All $($conversationIds.Count) IDs are unique"
        } else {
            $duplicates = $conversationIds | Group-Object | Where-Object { $_.Count -gt 1 } | Select-Object -ExpandProperty Name
            Add-CheckResult -Category "Conversation FIFO" -Check "No duplicate conversation IDs" -Status "FAIL" `
                -Message "Found $($duplicates.Count) duplicate IDs" -Details @{ duplicates = $duplicates }
        }
    } catch {
        Add-CheckResult -Category "Conversation FIFO" -Check "Conversation history validation" -Status "FAIL" `
            -Message "Error processing file: $($_.Exception.Message)"
    }
}

if (-not $JsonOutput) { Write-Host "" }
#endregion

#region Knowledge Graph Confidence Score Validation
if (-not $JsonOutput) {
    Write-Host "Category: Knowledge Graph Confidence Scores" -ForegroundColor Yellow
}

if (Test-Path $kgPath) {
    try {
        $kgContent = Get-Content $kgPath -Raw
        
        # Extract confidence scores using regex (looking for "confidence: X.XX" pattern)
        $confidenceMatches = [regex]::Matches($kgContent, 'confidence:\s*([\d.]+)')
        
        if ($confidenceMatches.Count -gt 0) {
            $invalidScores = @()
            $validScores = 0
            
            foreach ($match in $confidenceMatches) {
                $score = [decimal]$match.Groups[1].Value
                
                if ($score -ge 0.50 -and $score -le 1.00) {
                    $validScores++
                } else {
                    $invalidScores += $score
                }
            }
            
            if ($invalidScores.Count -eq 0) {
                Add-CheckResult -Category "Confidence Scores" -Check "All confidence scores in range 0.50-1.00" -Status "PASS" `
                    -Message "$validScores scores validated" -Details @{ total_scores = $confidenceMatches.Count; valid_scores = $validScores }
            } else {
                Add-CheckResult -Category "Confidence Scores" -Check "All confidence scores in range 0.50-1.00" -Status "FAIL" `
                    -Message "$($invalidScores.Count) out-of-range scores" -Details @{ invalid_scores = $invalidScores }
            }
        } else {
            Add-CheckResult -Category "Confidence Scores" -Check "All confidence scores in range 0.50-1.00" -Status "WARN" `
                -Message "No confidence scores found in knowledge graph"
        }
    } catch {
        Add-CheckResult -Category "Confidence Scores" -Check "All confidence scores in range 0.50-1.00" -Status "FAIL" `
            -Message "Error processing knowledge graph: $($_.Exception.Message)"
    }
}

if (-not $JsonOutput) { Write-Host "" }
#endregion

#region Event Log Integrity
if (-not $JsonOutput) {
    Write-Host "Category: Event Log Integrity" -ForegroundColor Yellow
}

if (Test-Path $eventsPath) {
    # Reuse the validation result from JSONL syntax check
    $eventsValidation = Test-JsonlFile -FilePath $eventsPath
    
    if ($eventsValidation.success) {
        # Additional structure validation for events
        try {
            $content = Get-Content $eventsPath -Raw
            $jsonObjects = @()
            $currentObject = ""
            $braceCount = 0
            $bracketCount = 0
            $inString = $false
            $escapeNext = $false
            
            foreach ($char in $content.ToCharArray()) {
                if ($escapeNext) {
                    $escapeNext = $false
                    $currentObject += $char
                    continue
                }
                
                if ($char -eq '\') {
                    $escapeNext = $true
                    $currentObject += $char
                    continue
                }
                
                if ($char -eq '"' -and -not $escapeNext) {
                    $inString = -not $inString
                }
                
                if (-not $inString) {
                    if ($char -eq '{') { $braceCount++ }
                    if ($char -eq '}') { $braceCount-- }
                    if ($char -eq '[') { $bracketCount++ }
                    if ($char -eq ']') { $bracketCount-- }
                }
                
                $currentObject += $char
                
                if ($braceCount -eq 0 -and $bracketCount -eq 0 -and $currentObject.Trim().Length -gt 0) {
                    $trimmed = $currentObject.Trim()
                    if ($trimmed.StartsWith('{') -or $trimmed.StartsWith('[')) {
                        $jsonObjects += $trimmed
                        $currentObject = ""
                    }
                }
            }
            
            # Validate event structure
            $validEvents = 0
            $missingStructure = @()
            
            for ($i = 0; $i -lt $jsonObjects.Count; $i++) {
                $event = $jsonObjects[$i] | ConvertFrom-Json
                
                if ($event.timestamp -or $event.event -or $event.type) {
                    $validEvents++
                } else {
                    $missingStructure += ($i + 1)
                }
            }
            
            if ($missingStructure.Count -eq 0) {
                Add-CheckResult -Category "Event Log" -Check "All events have valid structure (timestamp/event/type)" -Status "PASS" `
                    -Message "$validEvents events validated" -Details @{ total_events = $jsonObjects.Count; valid_events = $validEvents }
            } else {
                Add-CheckResult -Category "Event Log" -Check "All events have valid structure (timestamp/event/type)" -Status "WARN" `
                    -Message "$($missingStructure.Count) events missing standard fields" -Details @{ missing_structure_indices = $missingStructure }
            }
        } catch {
            Add-CheckResult -Category "Event Log" -Check "All events have valid structure (timestamp/event/type)" -Status "FAIL" `
                -Message "Error processing events: $($_.Exception.Message)"
        }
    } else {
        Add-CheckResult -Category "Event Log" -Check "All events have valid structure (timestamp/event/type)" -Status "FAIL" `
            -Message "Cannot validate structure - JSON parsing failed"
    }
}

if (-not $JsonOutput) { Write-Host "" }
#endregion

# Calculate execution time
$testEndTime = Get-Date
$results.execution_time_ms = [math]::Round(($testEndTime - $testStartTime).TotalMilliseconds, 0)

# Display summary
if (-not $JsonOutput) {
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  Test Summary" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Total Checks:  $($results.total_checks)" -ForegroundColor White
    Write-Host "  ✅ Passed:      $($results.passed)" -ForegroundColor Green
    Write-Host "  ❌ Failed:      $($results.failed)" -ForegroundColor Red
    Write-Host "  ⚠️  Warnings:    $($results.warnings)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Overall Status: $($results.overall_status)" -ForegroundColor $(if ($results.overall_status -eq "PASS") { "Green" } else { "Red" })
    Write-Host "  Execution Time: $($results.execution_time_ms) ms" -ForegroundColor Gray
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    if ($results.failed -gt 0) {
        Write-Host "Failed Checks:" -ForegroundColor Red
        foreach ($check in $results.checks | Where-Object { $_.status -eq "FAIL" }) {
            Write-Host "  ❌ $($check.category): $($check.check)" -ForegroundColor Red
            Write-Host "     $($check.message)" -ForegroundColor Gray
        }
        Write-Host ""
    }
}

# Output JSON if requested
if ($JsonOutput) {
    $results | ConvertTo-Json -Depth 10
}

# Exit with appropriate code
exit $results.failed
