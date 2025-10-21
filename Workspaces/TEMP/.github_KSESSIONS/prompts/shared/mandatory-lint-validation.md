# Mandatory Lint Validation

This repository enforces a “lint before commit” rule across all modified files. Treat warnings as errors for gating purposes. If a tool is not installed, provide the install command and stop; do not silently skip.

Last Updated: 2025-10-18

---

## Scope and Tools

- C# (.cs, .cshtml, .razor)
  - Roslyn analyzers via MSBuild and .editorconfig
  - Gate: Build must be clean (0 warnings, 0 errors)

- JavaScript/TypeScript (.js, .ts)
  - ESLint (optional; only if configured under Source Code/Sessions.Spa)

- CSS (.css)
  - Stylelint (optional)

- PowerShell (.ps1)
  - PSScriptAnalyzer

- JSON (.json)
  - JSON schema/syntax validation (editor/CI) and Prettier (optional)

---

## Execution Matrix (PowerShell examples)

1) Detect modified files

```
$modified = git diff --name-only HEAD
if (-not $modified) { Write-Host "[LINT] No modified files"; exit 0 }
Write-Host "[LINT] Modified files:`n$modified"
```

2) C# (Roslyn/MSBuild)

```
# Build must be clean (0 warnings, 0 errors)
# Prefer VS Code task: "Build Only (No Run)"
# Or direct MSBuild (Debug):
& "C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\MSBuild\\Current\\Bin\\MSBuild.exe" "KSESSIONS.sln" \
  "/t:Build" "/p:Configuration=Debug" "/p:Platform=AnyCPU" "/v:minimal"
if ($LASTEXITCODE -ne 0) { throw "C# analyzer/build failed" }
```

3) JavaScript/TypeScript (optional)

```
# Run only if ESLint is configured (package.json present with eslint script or config file)
if (Test-Path "Source Code/Sessions.Spa/package.json") {
  # Try npx eslint on changed JS/TS files
  $js = $modified | Where-Object { $_ -match '\\.tsx?$|\\.jsx?$' }
  if ($js) {
    npx eslint $js
    if ($LASTEXITCODE -ne 0) { throw "ESLint failed" }
  }
}
```

4) CSS (optional)

```
# Run only if Stylelint is configured
if (Test-Path "Source Code/Sessions.Spa/package.json") {
  $css = $modified | Where-Object { $_ -match '\\.css$' }
  if ($css) {
    npx stylelint $css
    if ($LASTEXITCODE -ne 0) { throw "Stylelint failed" }
  }
}
```

5) PowerShell

```
Install-Module -Name PSScriptAnalyzer -Scope CurrentUser -Force -ErrorAction SilentlyContinue
$ps = $modified | Where-Object { $_ -match '\\.ps1$' }
if ($ps) {
  $ps | ForEach-Object {
    $issues = Invoke-ScriptAnalyzer -Path $_ -Severity Warning,Error
    if ($issues) { $issues | Format-Table; throw "PSScriptAnalyzer issues found in $_" }
  }
}
```

6) JSON

```
$json = $modified | Where-Object { $_ -match '\\.json$' }
if ($json) {
  foreach ($file in $json) {
    try { Get-Content $file | ConvertFrom-Json | Out-Null }
    catch { throw "Invalid JSON: $file" }
  }
}
```

---

## Auto-fix Guidance (Optional)

- ESLint: `npx eslint --fix <files>`
- Stylelint: `npx stylelint --fix <files>`
- Prettier: `npx prettier --write <files>`

Re-run validation after auto-fixes. If still failing, stop and report.

---

## Policy

- Do not commit with any analyzer/lint failures.
- Prefer repository tasks (VS Code tasks) over ad-hoc commands when available.
- Keep analyzer configurations centralized (.editorconfig, AnalyzerConfig.MD).
