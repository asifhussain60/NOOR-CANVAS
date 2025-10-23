# Template Generation Script for Portable AI Agent System
# Automatically creates templated versions of all source files

$ErrorActionPreference = "Stop"
$sourceRoot = "d:\PROJECTS\NOOR CANVAS\.github"
$destRoot = "d:\PROJECTS\NOOR CANVAS\.github\_Portable"

# Template header function
function Get-TemplateHeader {
    param([string[]]$variables)
    
    $varList = ($variables | ForEach-Object { "- ``$_``" }) -join "`n"
    
    return @"
# Generic Template — Configured by total-recall

> **NOTE**: This is a TEMPLATE file. To configure for your project:
> 1. Run: ``@workspace /total-recall``
> 2. Review generated files in ``.github/_Portable/_Configured/``
> 3. Copy to ``.github/`` when satisfied

**Template Variables Used:**
$varList

---

"@
}

# Project-specific value mappings
$replacements = @{
    # Project Identity
    "NOOR CANVAS" = "{{PROJECT_NAME}}"
    "NOOR-CANVAS" = "{{PROJECT_NAME}}"
    "NoorCanvas" = "{{PROJECT_NAME}}"
    "ASP.NET Core" = "{{PROJECT_TYPE}}"
    "Blazor Server" = "{{UI_FRAMEWORK}}"
    "SignalR" = "{{REALTIME_TECH}}"
    "CSharp; JavaScript; TypeScript" = "{{LANGUAGES}}"
    "C#" = "{{LANGUAGES}}"
    
    # Database
    "KSESSIONS_DEV" = "{{DATABASE_NAME}}"
    "AHHOME" = "{{DATABASE_SERVER}}"
    "SQL Server" = "{{DATABASE_TYPE}}"
    "DefaultConnection" = "{{CONNECTION_STRING_KEY}}"
    "canvas\." = "{{SCHEMA_PRIMARY}}."
    "dbo\." = "{{SCHEMA_READONLY}}."
    
    # Commands
    "dotnet build" = "{{BUILD_COMMAND}}"
    "dotnet test" = "{{TEST_COMMAND}}"
    "dotnet run" = "{{RUN_COMMAND}}"
    "dotnet format" = "{{LINT_COMMAND}}"
    
    # Paths
    "SPA/NoorCanvas" = "{{SOURCE_PATH}}"
    "Tests/" = "{{TEST_PATH}}"
    "appsettings.json" = "{{CONFIG_PATH}}/appsettings.json"
    "D:\\\\PROJECTS\\\\NOOR CANVAS" = "{{WORKSPACE_PATH}}"
    
    # Tools
    "Roslynator" = "{{ANALYZER_TOOLS}}"
    "Playwright" = "{{TEST_FRAMEWORK}}"
    "NuGet" = "{{PACKAGE_MANAGER}}"
    "Entity Framework" = "{{FRAMEWORKS}}"
}

# Function to apply templating to content
function ConvertTo-Template {
    param(
        [string]$content,
        [string]$filePath
    )
    
    $templated = $content
    $usedVariables = @()
    
    # Apply replacements
    foreach ($key in $replacements.Keys) {
        if ($templated -match [regex]::Escape($key)) {
            $templated = $templated -replace [regex]::Escape($key), $replacements[$key]
            $usedVariables += $replacements[$key]
        }
    }
    
    # Add template header if variables were used
    if ($usedVariables.Count -gt 0) {
        $uniqueVars = $usedVariables | Select-Object -Unique | Sort-Object
        $header = Get-TemplateHeader -variables $uniqueVars
        $templated = $header + $templated
    }
    
    return $templated
}

# Copy and template instruction files
Write-Host "🔧 Templating instruction files..." -ForegroundColor Cyan

$instructionFiles = @(
    "SelfAwareness.instructions.md",
    "DatabaseEnvironmentGuard.md",
    "HostProvisioner-Environment.md"
)

foreach ($file in $instructionFiles) {
    $sourcePath = Join-Path $sourceRoot "instructions\$file"
    $destPath = Join-Path $destRoot "instructions\$file.template"
    
    if (Test-Path $sourcePath) {
        $content = Get-Content $sourcePath -Raw
        $templated = ConvertTo-Template -content $content -filePath $file
        $templated | Set-Content $destPath -NoNewline
        Write-Host "  ✅ $file.template"
    }
}

# Copy and template Links files
Write-Host "🔗 Templating Links files..." -ForegroundColor Cyan

$linksFiles = Get-ChildItem -Path "$sourceRoot\instructions\Links" -Filter "*.md"
foreach ($file in $linksFiles) {
    $content = Get-Content $file.FullName -Raw
    $templated = ConvertTo-Template -content $content -filePath $file.Name
    $destPath = Join-Path $destRoot "instructions\Links\$($file.Name).template"
    $templated | Set-Content $destPath -NoNewline
    Write-Host "  ✅ $($file.Name).template"
}

# Copy and template prompt files (entry points)
Write-Host "📝 Templating prompt files..." -ForegroundColor Cyan

$promptFiles = @(
    "handoff.prompt.md",
    "task.prompt.md",
    "create-plan.prompt.md",
    "test-generation.prompt.md",
    "healthcheck.prompt.md",
    "port-instructions.prompt.md"
)

foreach ($file in $promptFiles) {
    $sourcePath = Join-Path $sourceRoot "prompts\$file"
    $destPath = Join-Path $destRoot "prompts\$file.template"
    
    if (Test-Path $sourcePath) {
        $content = Get-Content $sourcePath -Raw
        $templated = ConvertTo-Template -content $content -filePath $file
        $templated | Set-Content $destPath -NoNewline
        Write-Host "  ✅ $file.template"
    }
}

# Copy and template internal prompts
Write-Host "🔧 Templating internal prompts..." -ForegroundColor Cyan

$internalPaths = @{
    "comm" = @("ask.prompt.md", "question.prompt.md")
    "knowledge" = @("analyze-learning.prompt.md", "total-recall.prompt.md")
    "ops" = @("commit.prompt.md", "sync.prompt.md")
    "quality" = @("cohesion-review.prompt.md", "refactor.prompt.md")
    "util" = @("cleanup.prompt.md")
}

foreach ($category in $internalPaths.Keys) {
    foreach ($file in $internalPaths[$category]) {
        $sourcePath = Join-Path $sourceRoot "prompts\internal\$category\$file"
        $destPath = Join-Path $destRoot "prompts\internal\$category\$file.template"
        
        if (Test-Path $sourcePath) {
            $content = Get-Content $sourcePath -Raw
            $templated = ConvertTo-Template -content $content -filePath $file
            $templated | Set-Content $destPath -NoNewline
            Write-Host "  ✅ internal/$category/$file.template"
        }
    }
}

# Copy shared files as-is (they're already generic)
Write-Host "📋 Copying shared files..." -ForegroundColor Cyan

$sharedFiles = Get-ChildItem -Path "$sourceRoot\prompts\shared" -Filter "*.md" -Recurse
foreach ($file in $sharedFiles) {
    $relativePath = $file.FullName.Replace("$sourceRoot\prompts\shared\", "")
    $destPath = Join-Path $destRoot "prompts\shared\$relativePath"
    
    $destDir = Split-Path $destPath -Parent
    if (!(Test-Path $destDir)) {
        New-Item -Path $destDir -ItemType Directory -Force | Out-Null
    }
    
    Copy-Item $file.FullName $destPath -Force
    Write-Host "  ✅ shared/$relativePath"
}

# Create learning structure with samples
Write-Host "📚 Creating learning structure..." -ForegroundColor Cyan

# Copy README and schema as-is
Copy-Item "$sourceRoot\learning\README.md" "$destRoot\learning\README.md" -Force
Copy-Item "$sourceRoot\learning\PATTERN_SCHEMA.md" "$destRoot\learning\PATTERN_SCHEMA.md" -Force
Write-Host "  ✅ README.md, PATTERN_SCHEMA.md"

# Create empty pattern files
"[]" | Set-Content "$destRoot\learning\error-patterns.json"
"[]" | Set-Content "$destRoot\learning\patterns\.gitkeep"
"[]" | Set-Content "$destRoot\learning\recommendations\.gitkeep"
Write-Host "  ✅ Empty pattern structures"

# Create sample task-agent-lessons.md
$sampleLessons = @"
# Agent Lessons

> This file is auto-populated by agents as they learn from your project.

## Recent Learnings

*No lessons recorded yet. Agents will populate this as work progresses.*

---

## Pattern Categories

### Successful Implementations
- *To be recorded during project work*

### Common Errors
- *To be recorded during project work*

### Performance Optimizations
- *To be recorded during project work*

---

**Note**: This learning system improves over time as agents work on your project.
"@

$sampleLessons | Set-Content "$destRoot\learning\task-agent-lessons.md"
Write-Host "  ✅ Sample task-agent-lessons.md"

Write-Host ""
Write-Host "✅ Template generation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:"
Write-Host "  - Instructions: $(($instructionFiles.Count + $linksFiles.Count)) files"
Write-Host "  - Prompts: $(($promptFiles.Count)) entry points"
Write-Host "  - Internal: $($internalPaths.Values.Count) agents"
Write-Host "  - Shared: $($sharedFiles.Count) files"
Write-Host "  - Learning: Structure created"
Write-Host ""
Write-Host "Next: Create documentation files (README, QUICK-REFERENCE, etc.)"
