# Analyzer and Lint Configuration (KSESSIONS)

Last Updated: 2025-10-18

---

## Overview

This project uses MSBuild analyzers for C# and supports optional linters for JS/CSS/PowerShell. All modified files must pass validation prior to commit. See also: `.github/prompts/shared/mandatory-lint-validation.md`.

---

## C# (MSBuild/Roslyn)

- Enforced via .editorconfig and project settings
- Validation: clean build (0 warnings, 0 errors)
- Invocation:
  - VS Code task: Build Only (No Run)
  - Direct MSBuild:
    - `"C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\MSBuild\\Current\\Bin\\MSBuild.exe" KSESSIONS.sln /t:Build /p:Configuration=Debug /p:Platform=AnyCPU /v:minimal`

---

## JavaScript/TypeScript (optional)

- Tool: ESLint, if configured in `Source Code/Sessions.Spa/package.json`
- Suggested devDeps: `eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`
- Run: `npx eslint <files>`

## CSS (optional)

- Tool: Stylelint
- Suggested devDeps: `stylelint stylelint-config-standard`
- Run: `npx stylelint <files>`

## PowerShell

- Tool: PSScriptAnalyzer
- Install: `Install-Module -Name PSScriptAnalyzer -Scope CurrentUser -Force`
- Run: `Invoke-ScriptAnalyzer -Path <script.ps1>`

## JSON

- Validate with `ConvertFrom-Json` in PowerShell or Prettier for formatting

---

## Policy

- Treat warnings as errors for gating
- Prefer repository tasks over ad-hoc commands
- If a linter is not configured, document that and proceed with C# and PowerShell gates

---

## Troubleshooting

- Restore NuGet packages if analyzers fail to run
- Clean solution and rebuild (VS Code task: MSBuild Clean via Script)
- Ensure Node toolchain installed if using optional JS/CSS linters
