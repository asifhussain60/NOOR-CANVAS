# KDS BRAIN Crawler Script
# Purpose: Comprehensive codebase analysis and BRAIN population (Google-style crawler)
# Version: 1.0

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('quick', 'deep', 'incremental', 'targeted')]
    [string]$Mode,
    
    [Parameter(Mandatory=$false)]
    [string]$Path = "",
    
    [Parameter(Mandatory=$false)]
    [string[]]$Workspace = @(),
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipGitHistory
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$brainDir = Join-Path (Split-Path -Parent $scriptDir) "kds-brain"
$workspaceRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)

if ($Workspace.Count -eq 0) {
    $Workspace = @($workspaceRoot)
}

# Skip patterns
$skipDirs = @(
    'node_modules', 'bin', 'obj', '.git', 'packages', 'dist', 'build',
    '.vs', '.vscode', 'coverage', 'test-results', 'playwright-report'
)

$skipFiles = @(
    '*.dll', '*.exe', '*.pdb', '*.min.js', '*.min.css', '*.map',
    'package-lock.json', 'yarn.lock', '*.user', '*.suo'
)

$skipExtensions = @('.dll', '.exe', '.pdb', '.bin', '.obj', '.cache')

function Write-Header {
    param([string]$Message)
    Write-Host "`n==================================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
}

function Write-Section {
    param([string]$Message)
    Write-Host "`n--- $Message ---" -ForegroundColor Yellow
}

function Get-ProjectFiles {
    param(
        [string]$RootPath,
        [string]$FilterPath = "",
        [switch]$QuickMode
    )
    
    $basePath = if ([string]::IsNullOrEmpty($FilterPath)) { $RootPath } else { Join-Path $RootPath $FilterPath }
    
    if (-not (Test-Path $basePath)) {
        Write-Warning "Path not found: $basePath"
        return @()
    }
    
    $allFiles = Get-ChildItem -Path $basePath -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
        $file = $_
        
        # Skip directories
        $skipDir = $false
        foreach ($dir in $skipDirs) {
            if ($file.FullName -like "*\$dir\*") {
                $skipDir = $true
                break
            }
        }
        if ($skipDir) { return $false }
        
        # Skip files by pattern
        foreach ($pattern in $skipFiles) {
            if ($file.Name -like $pattern) {
                return $false
            }
        }
        
        # Skip by extension
        if ($skipExtensions -contains $file.Extension) {
            return $false
        }
        
        # Skip large files (>1MB)
        if ($file.Length -gt 1MB) {
            return $false
        }
        
        return $true
    }
    
    # Categorize files
    $categorized = @{
        Components = @()
        Services = @()
        Controllers = @()
        Tests = @()
        Config = @()
        Styles = @()
        Scripts = @()
        Other = @()
    }
    
    foreach ($file in $allFiles) {
        $relativePath = $file.FullName.Replace($RootPath + '\', '')
        
        if ($file.Name -match '\.(razor|vue|tsx|jsx)$') {
            $categorized.Components += $file
        }
        elseif ($file.Name -match 'Service\.cs$|Service\.ts$') {
            $categorized.Services += $file
        }
        elseif ($file.Name -match 'Controller\.cs$') {
            $categorized.Controllers += $file
        }
        elseif ($file.Name -match '\.(spec|test)\.(ts|js|cs)$|Tests\.cs$') {
            $categorized.Tests += $file
        }
        elseif ($file.Name -match '^(appsettings|package|tsconfig|\.editorconfig)') {
            $categorized.Config += $file
        }
        elseif ($file.Extension -in @('.css', '.scss', '.sass', '.less')) {
            $categorized.Styles += $file
        }
        elseif ($file.Extension -in @('.js', '.ts') -and $file.Name -notmatch '\.(spec|test)\.') {
            $categorized.Scripts += $file
        }
        else {
            $categorized.Other += $file
        }
    }
    
    return $categorized
}

function Get-TechnologyStack {
    param([string]$RootPath)
    
    $stack = @{
        Backend = @{}
        Frontend = @{}
        Testing = @{}
        BuildTools = @{}
    }
    
    # Check for .NET
    $csproj = Get-ChildItem -Path $RootPath -Filter "*.csproj" -Recurse | Select-Object -First 1
    if ($csproj) {
        $content = Get-Content $csproj.FullName -Raw
        if ($content -match '<TargetFramework>(.*?)</TargetFramework>') {
            $stack.Backend.Framework = "ASP.NET Core"
            $stack.Backend.Version = $matches[1]
        }
        $stack.Backend.Language = "C#"
    }
    
    # Check for Node.js
    $packageJson = Join-Path $RootPath "package.json"
    if (Test-Path $packageJson) {
        $pkg = Get-Content $packageJson -Raw | ConvertFrom-Json
        
        if ($pkg.dependencies) {
            if ($pkg.dependencies.'react') {
                $stack.Frontend.Framework = "React"
                $stack.Frontend.Version = $pkg.dependencies.'react'
            }
            elseif ($pkg.dependencies.'@angular/core') {
                $stack.Frontend.Framework = "Angular"
            }
            elseif ($pkg.dependencies.'vue') {
                $stack.Frontend.Framework = "Vue"
            }
        }
        
        if ($pkg.devDependencies) {
            if ($pkg.devDependencies.'@playwright/test') {
                $stack.Testing.E2E = "Playwright"
                $stack.Testing.E2EVersion = $pkg.devDependencies.'@playwright/test'
            }
            if ($pkg.devDependencies.'@percy/cli') {
                $stack.Testing.Visual = "Percy"
            }
            if ($pkg.devDependencies.'jest') {
                $stack.Testing.Unit = "Jest"
            }
        }
    }
    
    # Check for Blazor
    $blazorFiles = Get-ChildItem -Path $RootPath -Filter "*.razor" -Recurse | Select-Object -First 1
    if ($blazorFiles) {
        $stack.Frontend.Framework = "Blazor"
    }
    
    return $stack
}

function Get-NamingConventions {
    param([hashtable]$Files)
    
    $conventions = @{
        Components = @()
        Services = @()
        Tests = @()
    }
    
    # Analyze component naming
    foreach ($file in $Files.Components | Select-Object -First 20) {
        if ($file.Name -match '^([A-Z][a-z]+)+\.(razor|vue|tsx)$') {
            $conventions.Components += "PascalCase.$($file.Extension)"
        }
    }
    
    # Analyze service naming
    foreach ($file in $Files.Services | Select-Object -First 20) {
        if ($file.Name -match '^([A-Z][a-z]+)+Service\.(cs|ts)$') {
            $conventions.Services += "PascalCaseService.$($file.Extension)"
        }
    }
    
    # Analyze test naming
    foreach ($file in $Files.Tests | Select-Object -First 20) {
        if ($file.Name -match '\.spec\.(ts|js)$') {
            $conventions.Tests += "kebab-case.spec.$($matches[1])"
        }
        elseif ($file.Name -match 'Tests\.cs$') {
            $conventions.Tests += "PascalCaseTests.cs"
        }
    }
    
    return @{
        Components = ($conventions.Components | Group-Object | Sort-Object Count -Descending | Select-Object -First 1).Name
        Services = ($conventions.Services | Group-Object | Sort-Object Count -Descending | Select-Object -First 1).Name
        Tests = ($conventions.Tests | Group-Object | Sort-Object Count -Descending | Select-Object -First 1).Name
    }
}

function Get-FileRelationships {
    param(
        [hashtable]$Files,
        [string]$RootPath,
        [switch]$SkipGit
    )
    
    $relationships = @{}
    
    Write-Host "  Analyzing file dependencies..." -ForegroundColor Gray
    
    # Parse imports/using statements (sample)
    $sampleSize = [Math]::Min(50, ($Files.Components.Count + $Files.Services.Count))
    $sampleFiles = ($Files.Components + $Files.Services) | Select-Object -First $sampleSize
    
    foreach ($file in $sampleFiles) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }
        
        $relativePath = $file.FullName.Replace($RootPath + '\', '')
        $relationships[$relativePath] = @{
            imports = @()
            size = $file.Length
        }
        
        # C# using statements
        if ($file.Extension -eq '.cs') {
            $matches = [regex]::Matches($content, 'using\s+([\w.]+);')
            foreach ($match in $matches) {
                $relationships[$relativePath].imports += $match.Groups[1].Value
            }
        }
        
        # TypeScript/JavaScript imports
        if ($file.Extension -in @('.ts', '.tsx', '.js')) {
            $matches = [regex]::Matches($content, 'import\s+.*?from\s+[''"](.+?)[''"]')
            foreach ($match in $matches) {
                $relationships[$relativePath].imports += $match.Groups[1].Value
            }
        }
        
        # Blazor @inject
        if ($file.Extension -eq '.razor') {
            $matches = [regex]::Matches($content, '@inject\s+(\w+)')
            foreach ($match in $matches) {
                $relationships[$relativePath].imports += $match.Groups[1].Value
            }
        }
    }
    
    return $relationships
}

function Get-TestPatterns {
    param([hashtable]$Files, [string]$RootPath)
    
    $patterns = @{
        Frameworks = @{}
        TestData = @()
        Selectors = @()
    }
    
    # Sample test files
    $sampleTests = $Files.Tests | Select-Object -First 20
    
    foreach ($test in $sampleTests) {
        $content = Get-Content $test.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }
        
        # Detect framework
        if ($content -match 'import.*playwright') {
            $patterns.Frameworks['Playwright'] = ($patterns.Frameworks['Playwright'] ?? 0) + 1
        }
        if ($content -match 'import.*jest') {
            $patterns.Frameworks['Jest'] = ($patterns.Frameworks['Jest'] ?? 0) + 1
        }
        if ($content -match 'using Xunit') {
            $patterns.Frameworks['xUnit'] = ($patterns.Frameworks['xUnit'] ?? 0) + 1
        }
        
        # Find test data references
        $dataMatches = [regex]::Matches($content, 'session-(\d+)')
        foreach ($match in $dataMatches) {
            $patterns.TestData += "session-$($match.Groups[1].Value)"
        }
        
        # Find selectors
        $selectorMatches = [regex]::Matches($content, '\[data-testid=[''"](.+?)[''"]\]')
        foreach ($match in $selectorMatches) {
            $patterns.Selectors += $match.Groups[1].Value
        }
    }
    
    # Get unique test data
    $patterns.TestData = $patterns.TestData | Select-Object -Unique
    
    return $patterns
}

function Update-KnowledgeGraph {
    param(
        [hashtable]$CrawlerData,
        [string]$Mode
    )
    
    Write-Section "Updating Knowledge Graph"
    
    $knowledgeGraphPath = Join-Path $brainDir "knowledge-graph.yaml"
    $timestamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ' -AsUTC
    
    # For simplicity, create a new section or append findings
    # In production, would parse existing YAML and merge intelligently
    
    $crawlerSection = @"

# CRAWLER DATA (Last updated: $timestamp)
crawler_metadata:
  last_scan: "$timestamp"
  mode: "$Mode"
  files_scanned: $($CrawlerData.TotalFiles)

architectural_patterns:
  components:
    count: $($CrawlerData.Files.Components.Count)
    pattern: "$($CrawlerData.Conventions.Components)"
  services:
    count: $($CrawlerData.Files.Services.Count)
    pattern: "$($CrawlerData.Conventions.Services)"
  controllers:
    count: $($CrawlerData.Files.Controllers.Count)
  tests:
    count: $($CrawlerData.Files.Tests.Count)
    pattern: "$($CrawlerData.Conventions.Tests)"

technology_stack:
  backend:
    language: "$($CrawlerData.Stack.Backend.Language)"
    framework: "$($CrawlerData.Stack.Backend.Framework)"
    version: "$($CrawlerData.Stack.Backend.Version)"
  frontend:
    framework: "$($CrawlerData.Stack.Frontend.Framework)"
  testing:
    e2e: "$($CrawlerData.Stack.Testing.E2E)"
    visual: "$($CrawlerData.Stack.Testing.Visual)"
"@
    
    # Append to knowledge graph (simplified - in production would merge properly)
    if (Test-Path $knowledgeGraphPath) {
        Add-Content -Path $knowledgeGraphPath -Value $crawlerSection
    }
    
    Write-Host "  ✅ Knowledge graph updated" -ForegroundColor Green
}

function New-CrawlerReport {
    param([hashtable]$CrawlerData, [string]$Mode)
    
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $reportPath = Join-Path $brainDir "crawler-report-$timestamp.md"
    
    $report = @"
# KDS BRAIN Crawler Report

**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Mode:** $Mode  
**Duration:** $($CrawlerData.Duration)

---

## Summary

- **Files Scanned:** $($CrawlerData.TotalFiles)
- **Components:** $($CrawlerData.Files.Components.Count)
- **Services:** $($CrawlerData.Files.Services.Count)
- **Controllers:** $($CrawlerData.Files.Controllers.Count)
- **Tests:** $($CrawlerData.Files.Tests.Count)
- **Config Files:** $($CrawlerData.Files.Config.Count)

---

## Technology Stack

### Backend
- **Language:** $($CrawlerData.Stack.Backend.Language)
- **Framework:** $($CrawlerData.Stack.Backend.Framework)
- **Version:** $($CrawlerData.Stack.Backend.Version)

### Frontend
- **Framework:** $($CrawlerData.Stack.Frontend.Framework)

### Testing
- **E2E:** $($CrawlerData.Stack.Testing.E2E)
- **Visual:** $($CrawlerData.Stack.Testing.Visual)
- **Unit:** $($CrawlerData.Stack.Testing.Unit)

---

## Naming Conventions

- **Components:** $($CrawlerData.Conventions.Components)
- **Services:** $($CrawlerData.Conventions.Services)
- **Tests:** $($CrawlerData.Conventions.Tests)

---

## Test Patterns

### Frameworks Detected
$($CrawlerData.TestPatterns.Frameworks.GetEnumerator() | ForEach-Object { "- $($_.Key): $($_.Value) files" } | Out-String)

### Test Data
$($CrawlerData.TestPatterns.TestData | Select-Object -First 5 | ForEach-Object { "- $_" } | Out-String)

---

## File Relationships

Top file imports analyzed: $($CrawlerData.Relationships.Count)

(See knowledge-graph.yaml for detailed relationship data)

---

## Recommendations

✅ BRAIN populated with architectural patterns  
✅ Technology stack identified  
✅ Naming conventions discovered  

$(if ($CrawlerData.Files.Tests.Count -eq 0) { "⚠️ No test files found - consider adding tests" })
$(if ($CrawlerData.Stack.Testing.E2E -eq '') { "💡 No E2E testing framework detected" })

---

**Next Steps:**

1. Review knowledge graph: ``KDS/kds-brain/knowledge-graph.yaml``
2. Start using KDS with learned context
3. Run incremental scans to keep BRAIN updated

"@
    
    Set-Content -Path $reportPath -Value $report -Encoding UTF8
    Write-Host "`n  📄 Report saved: $reportPath" -ForegroundColor Cyan
    
    return $reportPath
}

function Invoke-QuickScan {
    Write-Header "QUICK SCAN - Surface Analysis"
    
    $startTime = Get-Date
    
    Write-Section "Discovering Files"
    $files = Get-ProjectFiles -RootPath $Workspace[0] -QuickMode
    $totalFiles = ($files.Values | ForEach-Object { $_.Count } | Measure-Object -Sum).Sum
    
    Write-Host "  Components: $($files.Components.Count)" -ForegroundColor Gray
    Write-Host "  Services: $($files.Services.Count)" -ForegroundColor Gray
    Write-Host "  Controllers: $($files.Controllers.Count)" -ForegroundColor Gray
    Write-Host "  Tests: $($files.Tests.Count)" -ForegroundColor Gray
    Write-Host "  Total: $totalFiles" -ForegroundColor Cyan
    
    Write-Section "Detecting Technology Stack"
    $stack = Get-TechnologyStack -RootPath $Workspace[0]
    Write-Host "  Backend: $($stack.Backend.Language) - $($stack.Backend.Framework)" -ForegroundColor Gray
    Write-Host "  Frontend: $($stack.Frontend.Framework)" -ForegroundColor Gray
    
    Write-Section "Analyzing Naming Conventions"
    $conventions = Get-NamingConventions -Files $files
    Write-Host "  Components: $($conventions.Components)" -ForegroundColor Gray
    Write-Host "  Services: $($conventions.Services)" -ForegroundColor Gray
    Write-Host "  Tests: $($conventions.Tests)" -ForegroundColor Gray
    
    $duration = (Get-Date) - $startTime
    
    $crawlerData = @{
        Files = $files
        Stack = $stack
        Conventions = $conventions
        TotalFiles = $totalFiles
        Relationships = @{}
        TestPatterns = @{ Frameworks = @{}; TestData = @(); Selectors = @() }
        Duration = $duration.ToString("mm\:ss")
    }
    
    # Update knowledge graph
    Update-KnowledgeGraph -CrawlerData $crawlerData -Mode 'quick'
    
    # Generate report
    $reportPath = New-CrawlerReport -CrawlerData $crawlerData -Mode 'quick'
    
    Write-Header "QUICK SCAN COMPLETE"
    Write-Host "✅ Basic architectural map created" -ForegroundColor Green
    Write-Host "⏱️  Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
}

function Invoke-DeepScan {
    Write-Header "DEEP SCAN - Comprehensive Analysis"
    
    $startTime = Get-Date
    
    Write-Section "Discovering Files"
    $files = Get-ProjectFiles -RootPath $Workspace[0]
    $totalFiles = ($files.Values | ForEach-Object { $_.Count } | Measure-Object -Sum).Sum
    
    Write-Host "  Components: $($files.Components.Count)" -ForegroundColor Gray
    Write-Host "  Services: $($files.Services.Count)" -ForegroundColor Gray
    Write-Host "  Controllers: $($files.Controllers.Count)" -ForegroundColor Gray
    Write-Host "  Tests: $($files.Tests.Count)" -ForegroundColor Gray
    Write-Host "  Total: $totalFiles" -ForegroundColor Cyan
    
    Write-Section "Detecting Technology Stack"
    $stack = Get-TechnologyStack -RootPath $Workspace[0]
    
    Write-Section "Analyzing Naming Conventions"
    $conventions = Get-NamingConventions -Files $files
    
    Write-Section "Mapping File Relationships"
    $relationships = Get-FileRelationships -Files $files -RootPath $Workspace[0] -SkipGit:$SkipGitHistory
    Write-Host "  Analyzed: $($relationships.Count) files" -ForegroundColor Gray
    
    Write-Section "Detecting Test Patterns"
    $testPatterns = Get-TestPatterns -Files $files -RootPath $Workspace[0]
    Write-Host "  Frameworks: $($testPatterns.Frameworks.Count)" -ForegroundColor Gray
    Write-Host "  Test Data: $($testPatterns.TestData.Count) unique references" -ForegroundColor Gray
    
    $duration = (Get-Date) - $startTime
    
    $crawlerData = @{
        Files = $files
        Stack = $stack
        Conventions = $conventions
        TotalFiles = $totalFiles
        Relationships = $relationships
        TestPatterns = $testPatterns
        Duration = $duration.ToString("mm\:ss")
    }
    
    # Update knowledge graph
    Update-KnowledgeGraph -CrawlerData $crawlerData -Mode 'deep'
    
    # Generate report
    $reportPath = New-CrawlerReport -CrawlerData $crawlerData -Mode 'deep'
    
    Write-Header "DEEP SCAN COMPLETE"
    Write-Host "✅ Comprehensive knowledge graph created" -ForegroundColor Green
    Write-Host "📊 Relationships: $($relationships.Count)" -ForegroundColor Green
    Write-Host "⏱️  Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host "`n📄 Report: $reportPath" -ForegroundColor Cyan
}

function Invoke-IncrementalScan {
    Write-Header "INCREMENTAL SCAN - Changes Only"
    
    Write-Warning "Incremental mode not yet fully implemented"
    Write-Host "Falling back to quick scan..." -ForegroundColor Yellow
    
    Invoke-QuickScan
}

function Invoke-TargetedScan {
    if ([string]::IsNullOrEmpty($Path)) {
        Write-Error "Path parameter required for targeted scan"
        exit 1
    }
    
    Write-Header "TARGETED SCAN - Specific Area"
    Write-Host "Target: $Path" -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    $files = Get-ProjectFiles -RootPath $Workspace[0] -FilterPath $Path
    $totalFiles = ($files.Values | ForEach-Object { $_.Count } | Measure-Object -Sum).Sum
    
    if ($totalFiles -eq 0) {
        Write-Warning "No files found in target path: $Path"
        exit 0
    }
    
    Write-Host "  Files found: $totalFiles" -ForegroundColor Gray
    
    $conventions = Get-NamingConventions -Files $files
    $relationships = Get-FileRelationships -Files $files -RootPath $Workspace[0] -SkipGit:$SkipGitHistory
    
    $duration = (Get-Date) - $startTime
    
    Write-Header "TARGETED SCAN COMPLETE"
    Write-Host "✅ Scanned $totalFiles files in $Path" -ForegroundColor Green
    Write-Host "⏱️  Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
}

# Main execution
try {
    switch ($Mode) {
        'quick' {
            Invoke-QuickScan
        }
        'deep' {
            Invoke-DeepScan
        }
        'incremental' {
            Invoke-IncrementalScan
        }
        'targeted' {
            Invoke-TargetedScan
        }
    }
} catch {
    Write-Error "Crawler failed: $_"
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
