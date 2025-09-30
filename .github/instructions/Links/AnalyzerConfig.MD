# Analyzer Configuration — Canonical Reference

This file defines analyzer and linting tools Copilot must use for **refactor** and code quality tasks.

---

## Current State

### .NET Analyzers & StyleCop Integration
**Primary Configuration:** `Directory.Build.props` (repository root)
- **Analysis Level:** `latest` (Microsoft.CodeAnalysis.NetAnalyzers v8.0.0)
- **Code Style Enforcement:** `EnforceCodeStyleInBuild=true`
- **Warning Treatment:** `TreatWarningsAsErrors=false` (temporarily disabled for gradual migration)
- **StyleCop Suppressions:** 36 intentionally suppressed rules for incremental cleanup:
  - File/namespace organization: SA1200, SA1208, SA1210, SA1649
  - Class/member organization: SA1402, SA1204, SA1201, SA1202, SA1203
  - Formatting/spacing: SA1516, SA1512, SA1515, SA1513, SA1501, SA1133, SA1025, etc.
  - Documentation: SA1633 (file header requirements)
  - Naming conventions: SA1309, SA1316

### Roslynator Code Quality Analysis
**Location:** `Workspaces/CodeQuality/Roslynator/`
- **Execution Script:** `run-roslynator.ps1` with automated report generation
- **Configuration:** `Config/roslynator.config`
- **Output Format:** GitLab Code Climate JSON for CI/CD integration
- **Artifacts:** Timestamped reports in `Reports/`, logs in `Logs/`, documentation in `Workspaces/Documentation/ROSLYNATOR DOCS/`
- **VS Code Tasks:** "run-roslynator-analysis" and "run-roslynator-analysis-and-open"
- **Health Metrics:** Quantitative scoring system with trend analysis

### JavaScript/TypeScript Linting
**Primary Configuration:** `config/testing/eslint.config.js`
- **Target:** `PlayWright/**/*.{ts,tsx}` files
- **Parser:** `@typescript-eslint/parser`
- **Plugins:** `@typescript-eslint/eslint-plugin`, `eslint-plugin-playwright`
- **Key Rules:**
  - `@typescript-eslint/no-unused-vars: warn`
  - `@typescript-eslint/no-explicit-any: warn`
  - `no-duplicate-imports: error`
  - `playwright/no-skipped-test: warn`
- **npm Script:** `npm run lint` (zero-tolerance: `--max-warnings=0`)

### Formatting Standards
**Configuration:** `config/testing/.prettierrc`
- **npm Scripts:** `npm run format` (fix), `npm run format:check` (validate)
- **Target:** `PlayWright/**/*.{ts,tsx}` files
- **Integration:** Centralized configuration approach

---

## Instructions for Copilot
- On `/task context=new`:  
  - Read this file.  
  - Capture analyzer settings into the indexed context.  
- On `/refactor`:  
  - Run Roslynator and all analyzers listed here.  
  - Summarize findings by diagnostic ID and severity.  
  - Propose a plan based on these findings.  
- On `/sync`:  
  - Update this file to reflect the **REAL current state** of analyzers in the repo.  
  - Remove obsolete analyzers and configs.  
  - Add newly introduced ones.  
  - Verify configuration paths are correct.  

---

## TODO (Placeholder Policy)
If Copilot cannot locate analyzer configs:  
1. Insert `[PLACEHOLDER]` sections in this file.  
2. Stop and request confirmation.  
3. Replace placeholders with real data on next `/sync`.  

---
## Sync Protocol
This file must reflect the **REAL current state** of the project.  
- `/sync` is responsible for updating this file automatically.  
- Obsolete data must be removed.  
- Modified values must be updated to match source of truth in the repo.  
- Placeholders (`[PLACEHOLDER]`) must be replaced on the next run.  
