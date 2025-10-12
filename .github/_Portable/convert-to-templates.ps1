#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Convert NOOR CANVAS specific prompts/instructions to generic templates

.DESCRIPTION
    This script reads the current production prompts/instructions and creates
    generic templates by replacing project-specific references with placeholders.

.NOTES
    Author: Portable AI Agent System
    Date: October 12, 2025
#>

$ErrorActionPreference = "Stop"

$ProjectRoot = "d:\PROJECTS\NOOR CANVAS"
$SourcePromptsDir = Join-Path $ProjectRoot ".github\prompts"
$SourceInstructionsDir = Join-Path $ProjectRoot ".github\instructions"
$PortableDir = Join-Path $ProjectRoot ".github\_Portable"

Write-Host "Converting prompts and instructions to templates..." -ForegroundColor Cyan
Write-Host ""

# Template header
$TemplateHeader = @"
# Generic Template - Customized During Setup

**NOTE:** This is a TEMPLATE file. Run ``.github\_Portable\setup.bat`` to generate a project-specific version.

**Template Variables:**
- ``{{PROJECT_NAME}}`` - Your project name
- ``{{PROJECT_TYPE}}`` - Project type (.NET, Node.js, Python, Java, etc.)
- ``{{LANGUAGES}}`` - Programming languages
- ``{{FRAMEWORKS}}`` - Frameworks/libraries
- ``{{BUILD_COMMAND}}`` - Build command (e.g., ``dotnet build``, ``npm run build``)
- ``{{TEST_COMMAND}}`` - Test command (e.g., ``dotnet test``, ``npm test``)
- ``{{SERVER_CLEANUP}}`` - Server cleanup command
- ``{{DATABASE_TYPE}}`` - Database/ORM type

---

"@

# Replacements to make content generic
$Replacements = @{
    # Project-specific names
    "NOOR CANVAS" = "{{PROJECT_NAME}}"
    "NoorCanvas" = "{{PROJECT_NAME}}"
    
    # Specific technical stack
    "ASP\.NET Core" = "{{FRAMEWORKS}}"
    "Blazor WebAssembly" = "{{FRAMEWORKS}}"
    "Entity Framework Core" = "{{DATABASE_TYPE}}"
    
    # Specific commands
    "dotnet build" = "{{BUILD_COMMAND}}"
    "dotnet test" = "{{TEST_COMMAND}}"
    
    # Specific database names
    "KSESSIONS_DEV" = "{{DATABASE_NAME}}"
    "dbo\.Sessions" = "{{DATABASE_SCHEMA}}.Sessions"
    "dbo\.Questions" = "{{DATABASE_SCHEMA}}.Questions"
    
    # Specific endpoints (convert to examples)
    "/api/Question/Submit" = "/api/{{RESOURCE}}/{{ACTION}}"
    "/api/Vote/Submit" = "/api/{{RESOURCE}}/{{ACTION}}"
    
    # Specific components (make generic)
    "SessionCanvas" = "{{ComponentName}}"
    "HostControlPanel" = "{{ComponentName}}"
    "QuestionPanel" = "{{ComponentName}}"
    
    # Specific services (make generic)
    "HtmlParsingService" = "{{ServiceName}}"
    "AnnotationAnalysisService" = "{{ServiceName}}"
}

function Convert-ToTemplate {
    param(
        [string]$Content,
        [hashtable]$Replacements
    )
    
    $result = $Content
    
    # Add template header if not present
    if ($result -notmatch "Generic Template") {
        $result = $TemplateHeader + $result
    }
    
    # Apply replacements
    foreach ($key in $Replacements.Keys) {
        $result = $result -replace $key, $Replacements[$key]
    }
    
    # Remove specific Session 212 references (keep as generic examples)
    $result = $result -replace "Session 212", "Test Session {{SESSION_ID}}"
    $result = $result -replace "PQ9N5YWW", "{{HOST_TOKEN}}"
    $result = $result -replace "KJAHA99L", "{{USER_TOKEN}}"
    
    return $result
}

# Process prompt files
Write-Host "Processing prompt files..." -ForegroundColor Yellow
$promptFiles = @(
    "task.prompt.md",
    "refactor.prompt.md",
    "sync.prompt.md",
    "healthcheck.prompt.md",
    "question.prompt.md",
    "test-generation.prompt.md",
    "analyze-learning.prompt.md",
    "cleanup.prompt.md",
    "cohesion-review.prompt.md"
)

foreach ($file in $promptFiles) {
    $sourcePath = Join-Path $SourcePromptsDir $file
    if (Test-Path $sourcePath) {
        $content = Get-Content $sourcePath -Raw
        $templateContent = Convert-ToTemplate -Content $content -Replacements $Replacements
        
        $destPath = Join-Path $PortableDir "prompts\$file.template"
        Set-Content -Path $destPath -Value $templateContent -Encoding UTF8
        
        Write-Host "  [✓] $file → prompts\$file.template" -ForegroundColor Green
    }
    else {
        Write-Host "  [!] $file not found" -ForegroundColor Yellow
    }
}

# Process instruction files
Write-Host ""
Write-Host "Processing instruction files..." -ForegroundColor Yellow
$instructionFiles = @(
    @{ Source = "SelfAwareness.instructions.md"; Dest = "SelfAwareness.instructions.md.template" },
    @{ Source = "Links\AnalyzerConfig.MD"; Dest = "AnalyzerConfig.MD.template" },
    @{ Source = "Links\API-Contract-Validation.md"; Dest = "API-Contract-Validation.md.template" },
    @{ Source = "Links\Architecture.md"; Dest = "Architecture.md.template" },
    @{ Source = "Links\FunctionalityRegistry.md"; Dest = "FunctionalityRegistry.md.template" },
    @{ Source = "Links\InfrastructureQuickRef.md"; Dest = "InfrastructureQuickRef.md.template" },
    @{ Source = "Links\PlaywrightConfig.MD"; Dest = "PlaywrightConfig.MD.template" },
    @{ Source = "Links\PlaywrightQuickRef.md"; Dest = "PlaywrightQuickRef.md.template" },
    @{ Source = "Links\PlaywrightTestPaths.MD"; Dest = "PlaywrightTestPaths.MD.template" },
    @{ Source = "Links\SystemIndex.md"; Dest = "SystemIndex.md.template" },
    @{ Source = "Links\ValidationFramework.md"; Dest = "ValidationFramework.md.template" }
)

foreach ($fileInfo in $instructionFiles) {
    $sourcePath = Join-Path $SourceInstructionsDir $fileInfo.Source
    if (Test-Path $sourcePath) {
        $content = Get-Content $sourcePath -Raw
        $templateContent = Convert-ToTemplate -Content $content -Replacements $Replacements
        
        $destPath = Join-Path $PortableDir "instructions\$($fileInfo.Dest)"
        $destDir = Split-Path $destPath -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Set-Content -Path $destPath -Value $templateContent -Encoding UTF8
        
        Write-Host "  [✓] $($fileInfo.Source) → instructions\$($fileInfo.Dest)" -ForegroundColor Green
    }
    else {
        Write-Host "  [!] $($fileInfo.Source) not found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Template conversion complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Templates created in: $PortableDir" -ForegroundColor Cyan
Write-Host "  - prompts/*.template" -ForegroundColor White
Write-Host "  - instructions/*.template" -ForegroundColor White
Write-Host ""
