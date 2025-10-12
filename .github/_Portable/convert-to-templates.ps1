#!/usr/bin/env pwsh
# Convert production prompts/instructions to generic templates
# Author: Portable AI Agent System
# Date: October 12, 2025

$ErrorActionPreference = "Stop"

# Determine paths dynamically
$ScriptDir = $PSScriptRoot
$PortableDir = $ScriptDir
$ProjectRoot = Split-Path (Split-Path $PortableDir -Parent) -Parent
$SourcePromptsDir = Join-Path (Join-Path $ProjectRoot ".github") "prompts"
$SourceInstructionsDir = Join-Path (Join-Path $ProjectRoot ".github") "instructions"

Write-Host ""
Write-Host "Converting prompts and instructions to templates..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Source: $SourcePromptsDir" -ForegroundColor Gray
Write-Host "Target: $PortableDir" -ForegroundColor Gray
Write-Host ""

# Template header (using single quotes to avoid escaping issues)
$TemplateHeader = '# Generic Template - Customized During Setup

**NOTE:** This is a TEMPLATE file. Run `.github\_Portable\setup.bat` to generate a project-specific version.

**Template Variables:**
- `{{PROJECT_NAME}}` - Your project name
- `{{PROJECT_TYPE}}` - Project type (.NET, Node.js, Python, Java, etc.)
- `{{LANGUAGES}}` - Programming languages
- `{{FRAMEWORKS}}` - Frameworks/libraries
- `{{BUILD_COMMAND}}` - Build command (e.g., `dotnet build`, `npm run build`)
- `{{TEST_COMMAND}}` - Test command (e.g., `dotnet test`, `npm test`)
- `{{SERVER_CLEANUP}}` - Server cleanup command
- `{{DATABASE_TYPE}}` - Database/ORM type

---

'

# Replacements to make content generic
$Replacements = @{
    'NOOR CANVAS' = '{{PROJECT_NAME}}'
    'NoorCanvas' = '{{PROJECT_NAME}}'
    'ASP\.NET Core' = '{{FRAMEWORKS}}'
    'Blazor WebAssembly' = '{{FRAMEWORKS}}'
    'Entity Framework Core' = '{{DATABASE_TYPE}}'
    'dotnet build' = '{{BUILD_COMMAND}}'
    'dotnet test' = '{{TEST_COMMAND}}'
    'KSESSIONS_DEV' = '{{DATABASE_NAME}}'
    'AHHOME' = '{{DATABASE_SERVER}}'
    'dbo\.Sessions' = '{{DATABASE_SCHEMA}}.Sessions'
    'dbo\.Questions' = '{{DATABASE_SCHEMA}}.Questions'
    'dbo\.Votes' = '{{DATABASE_SCHEMA}}.Votes'
    '/api/Question/Submit' = '/api/{{RESOURCE}}/{{ACTION}}'
    '/api/Vote/Submit' = '/api/{{RESOURCE}}/{{ACTION}}'
    'SessionCanvas' = '{{ComponentName}}'
    'HostControlPanel' = '{{ComponentName}}'
    'QuestionPanel' = '{{ComponentName}}'
    'HtmlParsingService' = '{{ServiceName}}'
    'AnnotationAnalysisService' = '{{ServiceName}}'
    'Session 212' = 'Test Session {{SESSION_ID}}'
    'PQ9N5YWW' = '{{HOST_TOKEN}}'
    'KJAHA99L' = '{{USER_TOKEN}}'
    'Peter Parker' = '{{USER_NAME}}'
    'https://localhost:9091' = '{{BASE_URL}}'
}

function Convert-ToTemplate {
    param(
        [string]$Content,
        [hashtable]$Replacements
    )
    
    $result = $Content
    
    # Add template header if not present
    if ($result -notmatch 'Generic Template') {
        $result = $TemplateHeader + $result
    }
    
    # Apply replacements
    foreach ($key in $Replacements.Keys) {
        $result = $result -replace $key, $Replacements[$key]
    }
    
    return $result
}

# Process prompt files
Write-Host "Processing prompt files..." -ForegroundColor Yellow

$promptFiles = @(
    'task.prompt.md'
    'refactor.prompt.md'
    'sync.prompt.md'
    'healthcheck.prompt.md'
    'question.prompt.md'
    'test-generation.prompt.md'
    'analyze-learning.prompt.md'
    'cleanup.prompt.md'
    'cohesion-review.prompt.md'
)

$promptTemplateDir = Join-Path $PortableDir "prompts"
if (-not (Test-Path $promptTemplateDir)) {
    New-Item -ItemType Directory -Path $promptTemplateDir -Force | Out-Null
}

foreach ($file in $promptFiles) {
    $sourcePath = Join-Path $SourcePromptsDir $file
    if (Test-Path $sourcePath) {
        $content = Get-Content $sourcePath -Raw -Encoding UTF8
        $templateContent = Convert-ToTemplate -Content $content -Replacements $Replacements
        
        $destPath = Join-Path $promptTemplateDir "$file.template"
        Set-Content -Path $destPath -Value $templateContent -Encoding UTF8 -NoNewline
        
        Write-Host "  [OK] $file -> prompts/$file.template" -ForegroundColor Green
    }
    else {
        Write-Host "  [SKIP] $file not found" -ForegroundColor Yellow
    }
}

# Process instruction files
Write-Host ""
Write-Host "Processing instruction files..." -ForegroundColor Yellow

$instructionFiles = @(
    @{ Source = 'SelfAwareness.instructions.md'; Dest = 'SelfAwareness.instructions.md.template' }
    @{ Source = 'Links\AnalyzerConfig.MD'; Dest = 'AnalyzerConfig.MD.template' }
    @{ Source = 'Links\API-Contract-Validation.md'; Dest = 'API-Contract-Validation.md.template' }
    @{ Source = 'Links\Architecture.md'; Dest = 'Architecture.md.template' }
    @{ Source = 'Links\FunctionalityRegistry.md'; Dest = 'FunctionalityRegistry.md.template' }
    @{ Source = 'Links\InfrastructureQuickRef.md'; Dest = 'InfrastructureQuickRef.md.template' }
    @{ Source = 'Links\PlaywrightConfig.MD'; Dest = 'PlaywrightConfig.MD.template' }
    @{ Source = 'Links\PlaywrightQuickRef.md'; Dest = 'PlaywrightQuickRef.md.template' }
    @{ Source = 'Links\PlaywrightTestPaths.MD'; Dest = 'PlaywrightTestPaths.MD.template' }
    @{ Source = 'Links\SystemIndex.md'; Dest = 'SystemIndex.md.template' }
    @{ Source = 'Links\ValidationFramework.md'; Dest = 'ValidationFramework.md.template' }
)

$instructionTemplateDir = Join-Path $PortableDir "instructions"
if (-not (Test-Path $instructionTemplateDir)) {
    New-Item -ItemType Directory -Path $instructionTemplateDir -Force | Out-Null
}

foreach ($fileInfo in $instructionFiles) {
    $sourcePath = Join-Path $SourceInstructionsDir $fileInfo.Source
    if (Test-Path $sourcePath) {
        $content = Get-Content $sourcePath -Raw -Encoding UTF8
        $templateContent = Convert-ToTemplate -Content $content -Replacements $Replacements
        
        $destPath = Join-Path $instructionTemplateDir $fileInfo.Dest
        $destDir = Split-Path $destPath -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Set-Content -Path $destPath -Value $templateContent -Encoding UTF8 -NoNewline
        
        Write-Host "  [OK] $($fileInfo.Source) -> instructions/$($fileInfo.Dest)" -ForegroundColor Green
    }
    else {
        Write-Host "  [SKIP] $($fileInfo.Source) not found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Template conversion complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Templates created in: $PortableDir" -ForegroundColor Cyan
Write-Host "  - prompts/*.template" -ForegroundColor White
Write-Host "  - instructions/*.template" -ForegroundColor White
Write-Host ""
