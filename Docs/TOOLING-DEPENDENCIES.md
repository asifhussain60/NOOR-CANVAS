# NoorCanvas Tooling Dependencies (Testing, Linting, Analyzers)

This document lists tooling-related dependencies only (test frameworks, visual testing, linters/formatters, TypeScript toolchain, and .NET analyzers). App/runtime libraries (e.g., Tailwind, SignalR, EF models) are intentionally excluded.

Last updated: 2025-10-18

---

## E2E + Visual Testing

- Playwright CLI and Test Runner
  - `playwright` ^1.55.0 — package.json (repo root)
  - `@playwright/test` ^1.55.0 — package.json (repo root)
- Percy Visual Regression
  - `@percy/cli` ^1.31.4 — package.json (repo root)
  - `@percy/playwright` ^1.0.9 — package.json (repo root)

Config and scripts
- Primary config: `config/testing/playwright.config.cjs`
- Key npm scripts (package.json):
  - `test`, `test:headed`, `test:debug`, `test:report`, `test:install`, `test:trace`, `test:ui-mode`
  - Percy wrappers: `test:percy`, `test:percy:headed`, plus project PS scripts under `Scripts/`

Legacy/secondary (kept for compatibility)
- `PlayWright/package.json` contains older versions for a legacy test workspace:
  - `@playwright/test` ^1.40.0, ESLint/Prettier/TS v6.x/8.x era

---

## Linters and Formatters (JS/TS/CSS)

- ESLint core and plugins
  - `eslint` ^9.36.0 — package.json (repo root)
  - `@typescript-eslint/eslint-plugin` ^8.44.1 — package.json (repo root)
  - `@typescript-eslint/parser` ^8.44.1 — package.json (repo root)
  - `eslint-plugin-playwright` ^2.2.2 — package.json (repo root)
  - `eslint-config-prettier` ^10.1.8 — package.json (repo root)
- Prettier
  - `prettier` ^3.6.2 — package.json (repo root)
- Stylelint (CSS/Razor)
  - `stylelint` ^16.25.0 — package.json (repo root)
  - `stylelint-config-standard` ^39.0.1 — package.json (repo root)
  - `postcss-html` ^1.8.0 — package.json (repo root)

Config and scripts
- ESLint config: `config/testing/eslint.config.js`
- Prettier config: `config/testing/.prettierrc`
- Scripts: `npm run lint`, `npm run format`, `npm run format:check`, `npm run lint:css`, `npm run lint:css:fix`

---

## TypeScript Toolchain

- `typescript` ^5.9.2 — package.json (repo root)
- `ts-node` ^10.9.2 — package.json (repo root)
- `@types/node` ^24.5.2 — package.json (repo root)

Config and scripts
- TS config for tests: `config/testing/tsconfig.json`
- Type-check tests: `npm run build:tests`

---

## .NET Analyzers and Code Quality

NuGet analyzers (SPA/NoorCanvas/NoorCanvas.csproj)
- `Microsoft.CodeAnalysis.NetAnalyzers` 8.0.0
- `Roslynator.Analyzers` 4.12.4
- `StyleCop.Analyzers` 1.2.0-beta.507

Global analysis settings (Directory.Build.props)
- `<AnalysisLevel>latest</AnalysisLevel>`
- `<EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>`
- `<TreatWarningsAsErrors>false</TreatWarningsAsErrors>` (current setting)
- StyleCop rules suppressed via `<NoWarn>` list (incremental cleanup approach)

Roslynator workflow
- Script: `Workspaces/CodeQuality/run-roslynator.ps1`
- VS Code tasks: `run-roslynator-analysis`, `run-roslynator-analysis-and-open`
- Reports and docs location: `Workspaces/CodeQuality/Analysis/` and `Workspaces/Documentation/ROSLYNATOR DOCS/`

---

## Test/Infra Utilities (used by tooling)

- `mssql` ^11.0.1 — package.json (repo root)
- `@types/mssql` ^9.1.8 — package.json (repo root)

Note: These are used by test/infra helpers; they are not application runtime dependencies.

---

## Quick Commands

Playwright
```powershell
npm run test           # uses config/testing/playwright.config.cjs
npm run test:headed
npm run test:debug
npm run test:report    # show last report
npm run test:install   # install browsers
```

Percy Visual Regression
```powershell
npm run test:percy
npm run test:percy:headed
```

Lint/Format
```powershell
npm run lint
npm run format
npm run format:check
npm run lint:css
npm run lint:css:fix
```

Type-check tests (TS)
```powershell
npm run build:tests
```

Roslynator (VS Code tasks)
- Run task: "run-roslynator-analysis" (collects reports)
- Or: "run-roslynator-analysis-and-open" (runs and opens latest docs)

---

## Config Map

- Playwright: `config/testing/playwright.config.cjs`
- ESLint: `config/testing/eslint.config.js`
- Prettier: `config/testing/.prettierrc`
- TS (tests): `config/testing/tsconfig.json`
- .NET analyzers: `Directory.Build.props`, SPA/NoorCanvas/NoorCanvas.csproj
- Roslynator script: `Workspaces/CodeQuality/run-roslynator.ps1`

---

If you need this mirrored into another repo (e.g., KSESSIONS), copy the configs and devDependencies listed above, plus the VS Code tasks for Roslynator.
