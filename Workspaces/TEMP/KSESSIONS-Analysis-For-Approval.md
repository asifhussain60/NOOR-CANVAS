# KSESSIONS Analysis - Proposed Updates for Port-Instructions & Total-Recall

**Date:** October 21, 2025  
**Source:** `D:\PROJECTS\NOOR CANVAS\Workspaces\TEMP\.github_KSESSIONS`  
**Target Files:**
- `.github\_Portable\prompts\port-instructions.prompt.md`
- `.github\_Portable\prompts\total-recall.prompt.md`

---

## Executive Summary

Analyzed the older KSESSIONS port-instructions and total-recall output to extract useful patterns. Found **5 key improvements** that should be incorporated while maintaining NOOR CANVAS's current design principles (drop-in ready system, NO setup scripts, total-recall handles configuration).

---

## Key Findings from KSESSIONS

### 1. **NO .template Suffix Enforcement Rule** ⭐ **HIGH PRIORITY**

**Found in:** KSESSIONS `port-instructions.prompt.md` (Line 30-38, Line 87)

**What it is:**
```markdown
**Behavior:**
- **Provided:** Selective update - port only the specified prompt and its dependencies; 
  write the updated live prompt back to `.github/prompts/{prompt}` 
  (no `.template` extension) and its portable template to 
  `.github/_Portable/prompts/{prompt}.template`.
```

**Key Rule (Line 105):**
```
NO TEMPLATE SUFFIX IN LIVE PROMPTS: Only templates in `.github/_Portable/**` 
end with `.template`. Prompts under `.github/prompts/` must never contain 
a `.template` suffix after any operation.
```

**Why it matters:**
- Prevents confusion about which files are live vs templates
- Ensures `.github/prompts/` always contains usable prompts
- Selective mode should update BOTH live and template versions

**Current NOOR CANVAS status:** Partially implemented but not explicitly documented as a rule

---

### 2. **Enhanced Selective Mode Protocol** ⭐ **HIGH PRIORITY**

**Found in:** KSESSIONS `port-instructions.prompt.md` (Step 0.5.4, Lines 212-224)

**What it adds:**
```markdown
#### 0.5.4: Update Specified Prompt Template

**Create templated version:**

1. Read source: `.github/prompts/$promptFile`
2. Extract project-specific values (same extraction logic as Step 2)
3. Replace with template variables (same replacement logic as Step 3.2)
4. Add template header
5. Write portable template to: `.github/_Portable/prompts/$promptFile.template`
6. ✨ Also write updated live prompt to: `.github/prompts/$promptFile` 
   (no `.template` extension)
```

**Why it matters:**
- Selective mode keeps live prompts synchronized
- Both versions (live + template) get updated in one operation
- Prevents drift between live and portable versions

**Current NOOR CANVAS status:** Selective mode only updates template, not live prompt

---

### 3. **Tooling & Dependency Audit System** ⭐ **MEDIUM PRIORITY**

**Found in:** KSESSIONS `total-recall.prompt.md` (Step 4, Lines 145-192) and `Dependencies.md`

**What it is:**
A comprehensive validation system that:
1. Uses `Dependencies.md` as the **authoritative tooling manifest**
2. Validates workspace has all required dev/test/lint tools
3. Checks for missing packages (Playwright, Percy, ESLint, etc.)
4. Verifies config files exist (`playwright.config.cjs`, `eslint.config.js`, etc.)
5. Reports gaps and remediation steps

**Example from KSESSIONS:**
```markdown
### Step 4: Tooling & Dependency Audit (Cross-Cutting)

Use `Dependencies.md` as ground truth for tooling required by prompts/tests.

1) Read `.github/learning/Dependencies.md` and extract expected packages:
   - Playwright: `playwright`, `@playwright/test`
   - Percy: `@percy/cli`, `@percy/playwright`
   - ESLint stack: `eslint`, `@typescript-eslint/eslint-plugin`, etc.
   - Prettier, Stylelint, TypeScript, .NET analyzers

2) Validate these against the workspace:
   - Check package.json devDependencies
   - Verify config files exist
   - Check VS Code tasks for analyzers

3) Output Tooling Audit Summary with versions and remediation items
```

**Why it matters:**
- Ensures all tooling infrastructure is present before agents start work
- Creates a single source of truth for required tools
- Helps onboarding to projects with incomplete setups

**Current NOOR CANVAS status:** Not implemented - total-recall doesn't validate tooling

---

### 4. **Pre-Flight Validation Steps** ⭐ **MEDIUM PRIORITY**

**Found in:** KSESSIONS `total-recall.prompt.md` (Step 0, Lines 64-100) and `SelfAwareness.instructions.md` (Lines 168-175)

**What it adds:**

**A) Setup Completion Verification:**
```markdown
**Verify Template Files Exist:**
- `.github/instructions/Architecture.md` (setup.bat should have removed .template)
- `.github/instructions/Links/InfrastructureQuickRef.md` (no .template)
- All prompts in `.github/prompts/` exist WITHOUT `.template` suffix

**If files still have .template extension:**
- ❌ HALT: Setup script did not complete properly
- 📌 Instruct user to verify setup.bat ran successfully
```

**B) PowerShell Execution Policy Check:**
```markdown
**Pre-flight: Ports & Execution Policy**
- Ensure PowerShell can run scripts:
  - Start VS Code as Administrator if needed
  - ExecutionPolicy Bypass is already used by tasks
- Verify required ports are free (e.g., port 8080 for Auth0)
```

**Why it matters:**
- Prevents running agents in misconfigured environments
- Early detection of setup issues
- Saves time by failing fast with clear error messages

**Current NOOR CANVAS status:** Minimal pre-flight checks exist

---

### 5. **Enhanced Shared Files Organization** ⭐ **LOW PRIORITY**

**Found in:** KSESSIONS `prompts/shared/` directory (21 files vs current 16)

**Additional shared files in KSESSIONS:**
```
- clean-exit-guarantee.md
- completion-workflow-template.md
- context-gathering-phases.md
- framework-validation-checklists.md
- high-priority-task-detection.md
- key-data-stream-analyze-learning-template.md
- learning-analysis-report-template.md
- optimization-report-template.md
- OPTIMIZATION-SUMMARY.md
- pattern-library-update-guide.md
- pre-analysis-cleanup.md
- ui-debugging-protocol.md
```

**Why it matters:**
- More modular prompt composition
- Reusable documentation templates
- Better separation of concerns

**Current NOOR CANVAS status:** Has 16 shared files, missing some templates

---

## Proposed Changes

### Part A: `port-instructions.prompt.md`

#### Change 1: Add NO .template Suffix Rule to Core Mandates
**Location:** Section "Core Mandates" → "Critical Rules"  
**Line:** After line 88 (rule #6)

**Add:**
```markdown
7. **NO TEMPLATE SUFFIX IN LIVE PROMPTS**: Only templates in `.github/_Portable/**` 
   end with `.template`. Prompts under `.github/prompts/` (including meta-prompts like 
   port-instructions and total-recall) must NEVER contain a `.template` suffix after 
   any operation. Selective mode updates BOTH live prompt (no suffix) and portable 
   template (with .template).
```

**Rationale:** Makes explicit what was implicit; prevents confusion

---

#### Change 2: Enhance Selective Mode (Step 0.5.4)
**Location:** Step 0.5.4 "Update Specified Prompt Template"  
**Line:** Around line 210-220

**Current:**
```markdown
5. Write to: `.github/_Portable/prompts/$promptFile.template`
```

**Change to:**
```markdown
5. Write portable template to: `.github/_Portable/prompts/$promptFile.template`
6. Also write updated live prompt to: `.github/prompts/$promptFile` (no `.template` extension)
```

**Update Output section:**
```markdown
**Output:**
✅ Updated: .github/_Portable/prompts/$promptFile.template
✅ Updated: .github/prompts/$promptFile (live version)
```

**Rationale:** Keeps live prompts in sync during selective updates

---

#### Change 3: Update Meta-Prompt Handling (Step 0.5.7)
**Location:** Step 0.5.7 "Always Update Meta-Prompts"  
**Line:** Around line 270-285

**Current logic:** Only mentions updating templates

**Change to:**
```markdown
#### 0.5.7: Always Update Meta-Prompts

**Meta-prompts are always updated regardless of selective mode:**

```powershell
# Ensure meta-prompts are fresh in BOTH places
# For each meta-prompt (port-instructions.prompt.md, total-recall.prompt.md):
#   1) Read live: .github/prompts/$metaPrompt
#   2) Transform to templated content (replace project specifics with {{VARIABLES}})
#   3) Write templated version to: .github/_Portable/prompts/$metaPrompt.template
#   4) Ensure live version in .github/prompts/$metaPrompt remains WITHOUT .template suffix

Write-Host "✅ Updated: Meta-prompts (port-instructions, total-recall) in live and portable forms"
```

**Rationale:** Meta-prompts should never have drift between live and template

---

#### Change 4: Add Pre-Flight Validation
**Location:** New section after Step 0 (Mode Selection), before Step 0.5  
**Line:** After line 177

**Add new section:**
```markdown
### Step 0.1: Pre-Flight Validation (MANDATORY)

**Verify workspace is ready for porting:**

#### 0.1.1: Check Live Prompts Exist
```powershell
# Verify all prompts exist in .github/prompts/ WITHOUT .template suffix
$requiredPrompts = @(
    'task.prompt.md',
    'refactor.prompt.md',
    'feature.prompt.md',
    'sync.prompt.md',
    'healthcheck.prompt.md',
    'port-instructions.prompt.md',
    'total-recall.prompt.md'
)

foreach ($prompt in $requiredPrompts) {
    $path = ".github/prompts/$prompt"
    if (!(Test-Path $path)) {
        Write-Error "❌ Missing live prompt: $path"
        Write-Host "📌 Port-instructions requires working prompts to port"
        EXIT
    }
    
    # Verify NO .template suffix
    if ($prompt -like "*.template") {
        Write-Error "❌ Live prompt has .template suffix: $path"
        Write-Host "📌 Live prompts should never have .template extension"
        EXIT
    }
}
```

#### 0.1.2: Verify Required Folders
```powershell
$requiredFolders = @(
    '.github/prompts',
    '.github/prompts/shared',
    '.github/instructions',
    '.github/learning'
)

foreach ($folder in $requiredFolders) {
    if (!(Test-Path $folder)) {
        Write-Error "❌ Missing required folder: $folder"
        EXIT
    }
}
```

**Output:**
```
✅ Pre-flight checks passed
  - All live prompts present without .template suffix
  - Required folder structure exists
  - Ready to port
```

**If validation fails:**
- ❌ HALT execution
- 📌 Show specific missing items
- 📌 Provide remediation steps
```

**Rationale:** Fail fast if workspace isn't properly set up

---

### Part B: `total-recall.prompt.md`

#### Change 5: Add Tooling Validation to Pre-Analysis
**Location:** Step 0 "Pre-Analysis Validation"  
**Line:** After existing verification steps (around line 60-80)

**Add new verification:**
```markdown
**Verify Tooling Map Presence (Dependencies):**
- Check `.github/learning/Dependencies.md` exists (or project-level equivalent) to 
  serve as the authoritative tooling manifest for dev/test/lint infrastructure.
- If missing: ⚠️ WARN and note this should be created during total-recall analysis

**Verify Node/Tooling Configs (if JS/TS detected):**
```powershell
Test-Path "package.json"            # devDependencies should include required tools
Test-Path "config/testing/"         # lint/test configs present
```
If absent: ⚠️ WARN and record for remediation steps.
```

**Rationale:** Early detection of missing tooling infrastructure

---

#### Change 6: Add NO .template Verification
**Location:** Step 0 "Pre-Analysis Validation" → "Verify Template Files Exist"  
**Line:** Around line 70-90

**Current:**
```markdown
**Verify Template Files Exist:**
- `.github/instructions/Architecture.md` (setup.bat should have removed .template extension)
```

**Add:**
```markdown
**Verify Live Prompts (NO .template suffix):**
- `.github/prompts/` live prompts (including `port-instructions.prompt.md` and 
  `total-recall.prompt.md`) exist WITHOUT `.template` suffix

**If files still have .template extension:**
- ❌ HALT: Prompts were not properly configured
- 📌 Live prompts should NEVER have .template suffix
- 📌 Run port-instructions to regenerate if needed
```

**Rationale:** Ensures total-recall works with properly configured prompts

---

#### Change 7: Add Comprehensive Tooling Audit Step
**Location:** New section after Step 3 (before or as Step 4)  
**Line:** After database/API analysis sections

**Add new step:**
```markdown
### Step 4: Tooling & Dependency Audit (Cross-Cutting)

**Purpose:** Validate all dev/test/lint infrastructure is present and properly configured.

Use `Dependencies.md` (if exists) or create it as ground truth for tooling.

#### 4.1: Identify Required Tooling

**Based on project type detected in Step 1:**

**.NET Projects:**
- Analyzers: `Roslynator.Analyzers`, `StyleCop.Analyzers`, `Microsoft.CodeAnalysis.NetAnalyzers`
- Test frameworks: `xUnit`, `NUnit`, `MSTest`
- Build: `dotnet CLI`, MSBuild

**Node.js/JavaScript Projects:**
- Test frameworks: `Playwright`, `@playwright/test`, `Jest`, `Mocha`
- Visual testing: `@percy/cli`, `@percy/playwright`
- Linters: `eslint`, `@typescript-eslint/*`, `eslint-plugin-playwright`
- Formatters: `prettier`, `eslint-config-prettier`
- CSS linters: `stylelint`, `stylelint-config-standard`
- TypeScript: `typescript`, `ts-node`, `@types/node`

**Python Projects:**
- Test: `pytest`, `unittest`
- Linters: `pylint`, `flake8`, `mypy`
- Formatters: `black`, `autopep8`

**Java Projects:**
- Build: `Maven`, `Gradle`
- Test: `JUnit`, `TestNG`
- Linters: `Checkstyle`, `PMD`, `SpotBugs`

#### 4.2: Validate Against Workspace

**For Node.js projects:**
```powershell
if (Test-Path "package.json") {
    $pkg = Get-Content package.json -Raw | ConvertFrom-Json
    $dev = $pkg.devDependencies
    
    # Check each required package
    $requiredPackages = @(
        'playwright',
        '@playwright/test',
        '@percy/cli',
        '@percy/playwright',
        'eslint',
        '@typescript-eslint/eslint-plugin',
        '@typescript-eslint/parser',
        'eslint-plugin-playwright',
        'eslint-config-prettier',
        'prettier',
        'stylelint',
        'stylelint-config-standard',
        'postcss-html',
        'typescript',
        'ts-node',
        '@types/node'
    )
    
    foreach ($pkg in $requiredPackages) {
        if (-not $dev.$pkg) {
            Write-Host "⚠️ Missing devDependency: $pkg" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Found: $pkg ($($dev.$pkg))" -ForegroundColor Green
        }
    }
}

# Verify config files exist
$requiredConfigs = @(
    'config/testing/playwright.config.cjs',
    'config/testing/eslint.config.js',
    'config/testing/.prettierrc',
    'config/testing/stylelint.config.cjs',
    'config/testing/tsconfig.json'
)

foreach ($config in $requiredConfigs) {
    if (-not (Test-Path $config)) {
        Write-Host "⚠️ Missing config: $config" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Config present: $config" -ForegroundColor Green
    }
}
```

**For .NET projects:**
```powershell
# Check for analyzer packages in .csproj files
$csprojFiles = Get-ChildItem -Recurse -Filter "*.csproj"

foreach ($csproj in $csprojFiles) {
    $content = Get-Content $csproj.FullName -Raw
    
    # Check for required analyzers
    if ($content -notmatch 'Roslynator.Analyzers') {
        Write-Host "⚠️ Missing Roslynator.Analyzers in $($csproj.Name)"
    }
    if ($content -notmatch 'StyleCop.Analyzers') {
        Write-Host "⚠️ Missing StyleCop.Analyzers in $($csproj.Name)"
    }
    if ($content -notmatch 'Microsoft.CodeAnalysis.NetAnalyzers') {
        Write-Host "⚠️ Missing NetAnalyzers in $($csproj.Name)"
    }
}

# Check Directory.Build.props for analysis settings
if (Test-Path "Directory.Build.props") {
    $props = Get-Content "Directory.Build.props" -Raw
    if ($props -notmatch '<EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>') {
        Write-Host "⚠️ EnforceCodeStyleInBuild not enabled"
    }
}
```

#### 4.3: Generate Dependencies.md (if missing)

**If Dependencies.md doesn't exist, create it:**

```markdown
# {{PROJECT_NAME}} Tooling Dependencies

This document lists tooling-related dependencies (test frameworks, visual testing, 
linters/formatters, TypeScript toolchain, and .NET analyzers).

Last updated: {{CURRENT_DATE}}

---

## E2E + Visual Testing

[List discovered packages with versions]

---

## Linters and Formatters

[List discovered packages with versions]

---

## TypeScript Toolchain

[List discovered packages with versions]

---

## .NET Analyzers and Code Quality

[List discovered packages with versions]

---

## Quick Commands

[Document npm scripts or dotnet commands]
```

#### 4.4: Output Tooling Audit Summary

```markdown
## 🔧 TOOLING AUDIT SUMMARY

### ✅ Installed and Configured
- Playwright 1.55.0 (config: config/testing/playwright.config.cjs)
- Percy CLI 1.31.4 (config: .percy.yml)
- ESLint 9.36.0 (config: config/testing/eslint.config.js)
- Prettier 3.6.2 (config: config/testing/.prettierrc)
- TypeScript 5.9.2 (config: config/testing/tsconfig.json)

### ⚠️ Missing or Needs Attention
- @percy/playwright not found in package.json
- stylelint config missing (expected: config/testing/stylelint.config.cjs)

### 📋 Recommendations
1. Install missing packages: `npm install --save-dev @percy/playwright`
2. Create missing configs (see Templates section)
3. Update Dependencies.md with current versions

### 📝 Next Steps
- Generate/Update `.github/learning/Dependencies.md`
- Document installation commands in README
- Add VS Code tasks for running tools
```

**Rationale:** Comprehensive validation of development infrastructure

---

## CRITICAL: NOOR CANVAS Override Rules

**These NOOR CANVAS design principles MUST take precedence over KSESSIONS patterns:**

### 1. NO Setup Scripts ✅
- **NOOR CANVAS:** Drop-in ready system, total-recall handles ALL configuration
- **KSESSIONS had:** `setup.bat` and `setup.ps1` scripts
- **Decision:** Keep NOOR CANVAS approach, do NOT add setup scripts

### 2. Total-Recall Configuration Model ✅
- **NOOR CANVAS:** Copy `_Portable` folder → run total-recall → fully configured
- **KSESSIONS had:** Run setup scripts first, then total-recall
- **Decision:** Keep NOOR CANVAS one-step model

### 3. Template Extension Strategy ✅
- **NOOR CANVAS:** Templates in `_Portable/` end with `.template`, live files don't
- **KSESSIONS:** Same pattern
- **Decision:** Both agree, reinforce this rule explicitly

### 4. Selective Mode Enhancement ⚠️
- **NOOR CANVAS current:** Updates template only
- **KSESSIONS improvement:** Updates BOTH template AND live prompt
- **Decision:** ADOPT KSESSIONS pattern - this is a genuine improvement

### 5. Tooling Validation 🆕
- **NOOR CANVAS current:** No formal tooling validation in total-recall
- **KSESSIONS improvement:** Comprehensive audit with Dependencies.md
- **Decision:** ADOPT KSESSIONS pattern - adds value without changing design

---

## Summary of Proposed Changes

### High Priority (Implement Immediately)
1. ✅ Add NO .template suffix rule to Core Mandates
2. ✅ Enhance selective mode to update BOTH live and template versions
3. ✅ Update meta-prompt handling in Step 0.5.7

### Medium Priority (Implement Soon)
4. ✅ Add pre-flight validation to port-instructions (Step 0.1)
5. ✅ Add tooling verification to total-recall pre-analysis (Step 0)
6. ✅ Add comprehensive Tooling Audit step to total-recall (Step 4)

### Low Priority (Consider for Future)
7. ⚠️ Add more shared file templates (only if needed)

---

## Implementation Approach

### Phase 1: Critical Rules (Do First)
1. Add NO .template suffix rule to both prompts
2. Update selective mode logic (port-instructions Step 0.5.4)
3. Update meta-prompt handling (port-instructions Step 0.5.7)

### Phase 2: Validation (Do Second)  
4. Add pre-flight validation to port-instructions
5. Enhance total-recall pre-analysis validation

### Phase 3: Tooling Infrastructure (Do Last)
6. Add complete Tooling Audit step to total-recall
7. Document Dependencies.md creation process

---

## Testing Plan

After implementation, test with:

1. **Selective Mode Test:**
   ```
   @workspace /port-instructions prompt=task.prompt.md
   ```
   **Verify:**
   - ✅ Updates `.github/_Portable/prompts/task.prompt.md.template`
   - ✅ Updates `.github/prompts/task.prompt.md` (no .template suffix)
   - ✅ Both versions have correct content

2. **Full Regeneration Test:**
   ```
   @workspace /port-instructions
   ```
   **Verify:**
   - ✅ Deletes and recreates `_Portable/` folder
   - ✅ All templates have `.template` suffix in `_Portable/`
   - ✅ Meta-prompts exist in both places

3. **Total-Recall Pre-Flight Test:**
   ```
   @workspace /total-recall
   ```
   **Verify:**
   - ✅ Checks for .template suffix issues
   - ✅ Verifies tooling infrastructure
   - ✅ Creates Dependencies.md if missing

---

## Risk Assessment

### Low Risk ✅
- Adding rules to Core Mandates (documentation only)
- Pre-flight validation (fails early, doesn't break existing)
- Tooling audit (informational, doesn't modify files)

### Medium Risk ⚠️
- Selective mode changes (modifies file update behavior)
  - **Mitigation:** Test thoroughly before committing
  - **Rollback:** Easy - revert the step logic

### No Risk Identified ✅
- All changes are additive
- No breaking changes to existing functionality
- Maintains NOOR CANVAS design principles

---

## Approval Checklist

Before implementing, confirm:

- [ ] **Principle 1:** NO setup scripts will be added (NOOR CANVAS stays drop-in ready)
- [ ] **Principle 2:** Total-recall remains the configuration mechanism
- [ ] **Principle 3:** .template suffix rule is clearly documented
- [ ] **Enhancement 1:** Selective mode updates both live and template (APPROVED?)
- [ ] **Enhancement 2:** Pre-flight validation added (APPROVED?)
- [ ] **Enhancement 3:** Tooling audit added to total-recall (APPROVED?)

---

## Questions for Decision

1. **Selective Mode:** Approve updating BOTH live prompt and template? (Recommended: YES)
2. **Pre-Flight Validation:** Add validation steps to both prompts? (Recommended: YES)
3. **Tooling Audit:** Add comprehensive Step 4 to total-recall? (Recommended: YES)
4. **Dependencies.md:** Should total-recall create this if missing? (Recommended: YES)
5. **Shared Files:** Port additional shared files from KSESSIONS? (Recommended: LATER)

---

## Next Steps After Approval

1. Update `port-instructions.prompt.md` with Changes 1-4
2. Update `total-recall.prompt.md` with Changes 5-7
3. Test selective mode with a sample prompt
4. Test full regeneration
5. Test total-recall with tooling validation
6. Document changes in `.github/learning/` insights
7. Commit with descriptive message

---

**END OF ANALYSIS DOCUMENT**
