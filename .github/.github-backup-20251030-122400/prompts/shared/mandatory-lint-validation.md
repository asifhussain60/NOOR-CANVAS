# Mandatory Lint Validation Protocol

## Purpose
Ensure ALL modified files pass syntax and code quality checks before commit. This is a MANDATORY gate in the task execution pipeline.

---

## When to Apply
- **ALWAYS** after Step 5 (Execute) and before Step 8 (Commit)
- **ALWAYS** before marking work ready for user testing
- **ALWAYS** as part of Step 6 (Validate)

---

## Linting Tools by File Type

### C# Files (*.cs, *.cshtml, *.razor)
**Primary Tool**: Roslynator + Roslyn Analyzers

**Execution**:
```powershell
# Run Roslynator analysis on modified files
dotnet build /p:RunAnalyzers=true /p:TreatWarningsAsErrors=false

# Check for analyzer warnings
$warnings = dotnet build 2>&1 | Select-String "warning"
if ($warnings.Count -gt 0) {
    Write-Host "[LINT FAIL] C# files have analyzer warnings" -ForegroundColor Red
    $warnings | ForEach-Object { Write-Host $_ }
    exit 1
}
```

**Configuration**:
- Uses project-level analyzers defined in `.csproj` files
- Roslynator rules configured via Directory.Build.props
- See `Workspaces/CodeQuality/run-roslynator.ps1` for comprehensive analysis

**Auto-Fix Capability**:
```powershell
# Apply Roslynator fixes automatically
dotnet roslynator fix --analyzer-assemblies Microsoft.CodeAnalysis.CSharp.Workspaces
```

**Fallback**: If Roslynator not configured, use `dotnet build` with warnings as errors

---

### JavaScript/TypeScript Files (*.js, *.ts, *.tsx)
**Primary Tool**: ESLint

**Execution**:
```powershell
# Lint all modified JS/TS files
npm run lint

# Check exit code
if ($LASTEXITCODE -ne 0) {
    Write-Host "[LINT FAIL] JavaScript/TypeScript files have ESLint errors" -ForegroundColor Red
    exit 1
}
```

**Configuration**:
- ESLint config: `config/testing/eslint.config.js`
- Rules include Playwright-specific patterns
- Max warnings: 0 (enforced in package.json script)

**Auto-Fix Capability**:
```powershell
# Apply ESLint fixes automatically
npm run lint -- --fix
```

**Installation** (if not exists):
```powershell
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

---

### CSS Files (*.css) and Razor Component Styles
**Primary Tool**: Stylelint

**Execution**:
```powershell
# Lint CSS and Razor files with inline styles
npm run lint:css

# Check exit code
if ($LASTEXITCODE -ne 0) {
    Write-Host "[LINT FAIL] CSS/Razor files have Stylelint errors" -ForegroundColor Red
    exit 1
}
```

**Configuration**:
- Stylelint config: `.stylelintrc.json` (to be created)
- Rules: canvas-* class naming, no duplicates, consistent formatting

**Auto-Fix Capability**:
```powershell
# Apply Stylelint fixes automatically
npm run lint:css:fix
```

**Installation** (if not exists):
```powershell
npm install --save-dev stylelint stylelint-config-standard
```

**Stylelint Config** (create `.stylelintrc.json`):
```json
{
  "extends": "stylelint-config-standard",
  "rules": {
    "selector-class-pattern": "^(canvas|hcp|session)-[a-z0-9-]+$",
    "no-duplicate-selectors": true,
    "declaration-block-no-duplicate-properties": true,
    "color-hex-length": "short",
    "indentation": 2
  }
}
```

---

### PowerShell Scripts (*.ps1)
**Primary Tool**: PSScriptAnalyzer

**Execution**:
```powershell
# Lint PowerShell scripts
$scriptFiles = git diff --name-only HEAD | Where-Object { $_ -match '\.ps1$' }

foreach ($file in $scriptFiles) {
    $results = Invoke-ScriptAnalyzer -Path $file -Severity Warning,Error
    if ($results.Count -gt 0) {
        Write-Host "[LINT FAIL] $file has PSScriptAnalyzer issues" -ForegroundColor Red
        $results | Format-Table -AutoSize
        exit 1
    }
}
```

**Installation** (if not exists):
```powershell
Install-Module -Name PSScriptAnalyzer -Scope CurrentUser -Force
```

**Configuration**:
- Default rules from PSScriptAnalyzer
- Severity: Warning and Error levels only

---

### JSON Files (*.json)
**Primary Tool**: JSON Schema Validation + Prettier

**Execution**:
```powershell
# Validate JSON syntax
$jsonFiles = git diff --name-only HEAD | Where-Object { $_ -match '\.json$' }

foreach ($file in $jsonFiles) {
    try {
        Get-Content $file -Raw | ConvertFrom-Json | Out-Null
        Write-Host "[LINT PASS] $file is valid JSON" -ForegroundColor Green
    }
    catch {
        Write-Host "[LINT FAIL] $file has invalid JSON syntax" -ForegroundColor Red
        Write-Host $_.Exception.Message
        exit 1
    }
}
```

**Prettier Formatting**:
```powershell
npm run format:check
```

---

## Lint Validation Workflow

### Step 6.2: Mandatory Lint Validation (NEW - Insert after Step 6.1)

**Execution Order**:
1. **Detect Modified Files**:
   ```powershell
   $modifiedFiles = git diff --name-only HEAD
   ```

2. **Group Files by Type**:
   ```powershell
   $csFiles = $modifiedFiles | Where-Object { $_ -match '\.(cs|cshtml|razor)$' }
   $jsFiles = $modifiedFiles | Where-Object { $_ -match '\.(js|ts|tsx)$' }
   $cssFiles = $modifiedFiles | Where-Object { $_ -match '\.(css|razor)$' }
   $psFiles = $modifiedFiles | Where-Object { $_ -match '\.ps1$' }
   $jsonFiles = $modifiedFiles | Where-Object { $_ -match '\.json$' }
   ```

3. **Run Linters Sequentially**:
   ```powershell
   # C# Files
   if ($csFiles.Count -gt 0) {
       Write-Host "`n[LINT] Validating C# files..." -ForegroundColor Cyan
       dotnet build /p:RunAnalyzers=true
       if ($LASTEXITCODE -ne 0) { exit 1 }
   }

   # JavaScript/TypeScript Files
   if ($jsFiles.Count -gt 0) {
       Write-Host "`n[LINT] Validating JS/TS files..." -ForegroundColor Cyan
       npm run lint
       if ($LASTEXITCODE -ne 0) { exit 1 }
   }

   # CSS Files
   if ($cssFiles.Count -gt 0) {
       Write-Host "`n[LINT] Validating CSS/Razor styles..." -ForegroundColor Cyan
       npm run lint:css
       if ($LASTEXITCODE -ne 0) { exit 1 }
   }

   # PowerShell Scripts
   if ($psFiles.Count -gt 0) {
       Write-Host "`n[LINT] Validating PowerShell scripts..." -ForegroundColor Cyan
       # Run PSScriptAnalyzer (see above)
   }

   # JSON Files
   if ($jsonFiles.Count -gt 0) {
       Write-Host "`n[LINT] Validating JSON files..." -ForegroundColor Cyan
       # Run JSON validation (see above)
   }
   ```

4. **Auto-Fix Attempt (if failures detected)**:
   ```powershell
   # Apply auto-fixes for common issues
   if ($csFiles.Count -gt 0) {
       dotnet roslynator fix --analyzer-assemblies Microsoft.CodeAnalysis.CSharp.Workspaces
   }
   if ($jsFiles.Count -gt 0) {
       npm run lint -- --fix
   }
   if ($cssFiles.Count -gt 0) {
       npm run lint:css:fix
   }
   
   # Re-run validation after auto-fix
   # (repeat step 3)
   ```

5. **Report Results**:
   ```powershell
   Write-Host "`n[LINT SUMMARY]" -ForegroundColor Cyan
   Write-Host "  C# Files: [PASS] $($csFiles.Count) files validated" -ForegroundColor Green
   Write-Host "  JS/TS Files: [PASS] $($jsFiles.Count) files validated" -ForegroundColor Green
   Write-Host "  CSS Files: [PASS] $($cssFiles.Count) files validated" -ForegroundColor Green
   Write-Host "  PowerShell: [PASS] $($psFiles.Count) files validated" -ForegroundColor Green
   Write-Host "  JSON Files: [PASS] $($jsonFiles.Count) files validated" -ForegroundColor Green
   ```

6. **Halt on Failure**:
   - If ANY linter returns non-zero exit code → HALT execution
   - Document lint errors in key data stream
   - Request user intervention OR apply auto-fixes and retry
   - **NEVER proceed to commit with lint failures**

---

## Integration with Task Prompt

**Location**: Step 6 (Validate) - Insert as Step 6.2 after Step 6.1 (Playwright Test Creation)

**Mandate**: 
- [MANDATORY] ALL modified files MUST pass lint validation before Step 8 (Commit)
- [MANDATORY] Lint failures BLOCK commit creation
- [MANDATORY] Report lint results in key data stream

**Output to User**:
```
[LINT VALIDATION]
- C# Files: [PASS] 3 files validated (0 warnings)
- JS/TS Files: [PASS] 2 files validated (0 errors)
- CSS Files: [PASS] 1 file validated (0 errors)
- PowerShell: [PASS] 1 file validated (0 warnings)

All files passed lint validation. Proceeding to commit.
```

---

## Lint Failure Protocol

**If lint validation fails:**

1. **Document Failures**:
   ```markdown
   ## Lint Validation Failures
   - **File**: SessionCanvas.razor
   - **Tool**: ESLint
   - **Errors**:
     - Line 42: 'participant' is not defined (no-undef)
     - Line 58: Unexpected console statement (no-console)
   ```

2. **Attempt Auto-Fix**:
   - Run linter with `--fix` flag
   - Re-validate
   - If still failing → Request manual intervention

3. **Manual Intervention Required**:
   - Present lint errors to user
   - Pause execution
   - Wait for user to fix OR approve override (NOT RECOMMENDED)

4. **Rollback Option**:
   - If unable to resolve lint errors after 2 attempts
   - Offer rollback to checkpoint commit
   - Document lint issues in key data stream for future investigation

---

## Linter Setup Validation

**Before first lint execution, verify tools are installed:**

```powershell
# Check if linters exist
$hasEslint = Test-Path "node_modules/eslint"
$hasStylelint = Test-Path "node_modules/stylelint"
$hasPSScriptAnalyzer = Get-Module -ListAvailable -Name PSScriptAnalyzer

# Install missing tools
if (-not $hasEslint) {
    Write-Host "[SETUP] Installing ESLint..." -ForegroundColor Yellow
    npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
}

if (-not $hasStylelint) {
    Write-Host "[SETUP] Installing Stylelint..." -ForegroundColor Yellow
    npm install --save-dev stylelint stylelint-config-standard
    # Create .stylelintrc.json if missing
}

if (-not $hasPSScriptAnalyzer) {
    Write-Host "[SETUP] Installing PSScriptAnalyzer..." -ForegroundColor Yellow
    Install-Module -Name PSScriptAnalyzer -Scope CurrentUser -Force
}
```

**First-Run Configuration**:
- Create `.stylelintrc.json` if missing (see config above)
- Verify ESLint config exists at `config/testing/eslint.config.js`
- Verify package.json scripts include `lint`, `lint:css`, `format`

---

## Success Criteria

- [PASS] All modified C# files have zero analyzer warnings
- [PASS] All modified JS/TS files have zero ESLint errors
- [PASS] All modified CSS files have zero Stylelint errors
- [PASS] All modified PowerShell scripts have zero PSScriptAnalyzer warnings
- [PASS] All modified JSON files have valid syntax
- [PASS] Lint results documented in key data stream
- [PASS] Auto-fixes applied where possible

---

## Reference Implementation

**Complete Lint Validation Script** (`Scripts/run-lint-validation.ps1`):

```powershell
# Lint Validation Script
# Purpose: Validate all modified files before commit

param(
    [switch]$AutoFix = $false
)

$ErrorActionPreference = "Stop"

# Step 1: Detect modified files
$modifiedFiles = git diff --name-only HEAD

if ($modifiedFiles.Count -eq 0) {
    Write-Host "[LINT] No modified files to validate" -ForegroundColor Green
    exit 0
}

# Step 2: Group files by type
$csFiles = $modifiedFiles | Where-Object { $_ -match '\.(cs|cshtml|razor)$' }
$jsFiles = $modifiedFiles | Where-Object { $_ -match '\.(js|ts|tsx)$' }
$cssFiles = $modifiedFiles | Where-Object { $_ -match '\.(css|razor)$' }
$psFiles = $modifiedFiles | Where-Object { $_ -match '\.ps1$' }
$jsonFiles = $modifiedFiles | Where-Object { $_ -match '\.json$' }

$lintFailed = $false

# Step 3: Run linters
if ($csFiles.Count -gt 0) {
    Write-Host "`n[LINT] Validating $($csFiles.Count) C# files..." -ForegroundColor Cyan
    dotnet build /p:RunAnalyzers=true
    if ($LASTEXITCODE -ne 0) { $lintFailed = $true }
}

if ($jsFiles.Count -gt 0) {
    Write-Host "`n[LINT] Validating $($jsFiles.Count) JS/TS files..." -ForegroundColor Cyan
    if ($AutoFix) {
        npm run lint -- --fix
    } else {
        npm run lint
    }
    if ($LASTEXITCODE -ne 0) { $lintFailed = $true }
}

if ($cssFiles.Count -gt 0) {
    Write-Host "`n[LINT] Validating $($cssFiles.Count) CSS/Razor files..." -ForegroundColor Cyan
    if ($AutoFix) {
        npm run lint:css:fix
    } else {
        npm run lint:css
    }
    if ($LASTEXITCODE -ne 0) { $lintFailed = $true }
}

# Step 4: Report results
if ($lintFailed) {
    Write-Host "`n[LINT FAIL] Validation failed. Fix errors and retry." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n[LINT PASS] All files validated successfully." -ForegroundColor Green
    exit 0
}
```

**Usage**:
```powershell
# Validate without auto-fix
.\Scripts\run-lint-validation.ps1

# Validate with auto-fix
.\Scripts\run-lint-validation.ps1 -AutoFix
```

---

End of Mandatory Lint Validation Protocol
