# Playwright Configuration — Canonical Reference

# Playwright Configuration — Canonical Reference

## Primary Configuration
**File:** `config/testing/playwright.config.cjs` (centralized, CommonJS format)

### Core Settings
```javascript
{
    timeout: 30000,
    testDir: '../../',
    testMatch: [
        '**/PlayWright/tests/**/*.{test,spec}.{js,ts,jsx,tsx}',
        '**/Workspaces/TEMP/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    retries: 0,
    use: {
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        outputDir: 'Workspaces/TEMP/playwright-artifacts'
    }
}
```

### Environment Mode Overrides

#### Standalone Mode (`PW_MODE=standalone`)
**Purpose:** Automatic .NET app lifecycle management for testing
- **webServer Configuration:**
  - `command: 'dotnet run'`
  - `cwd: '../../SPA/NoorCanvas'`
  - `port: 9091`
  - `reuseExistingServer: !process.env.CI`
  - `timeout: 60000`
- **Settings:** `timeout: 120000`, `retries: 0`, `workers: 1`
- **UI:** `headless: false`, `viewport: 1280x720`
- **Artifacts:** `trace: 'retain-on-failure'`, `video: 'retain-on-failure'`
- **Reporter:** HTML report to `Workspaces/TEMP/playwright-report/standalone-html`

#### Temp Mode (`PW_MODE=temp`)
**Purpose:** Enhanced artifact collection for debugging
- **Settings:** `retries: 0`, `workers: 1`
- **Artifacts:** `video: 'on'`, `trace: 'on'`

### npm Script Integration
**Centralized Scripts (from `package.json`):**
- `npm run test` - Basic test execution
- `npm run test:headed` - Headed browser mode
- `npm run test:debug` - Debug mode with DevTools
- `npm run test:ui-mode` - Playwright UI mode
- `npm run test:codegen` - Code generation tool
- `npm run test:report` - View HTML reports
- `npm run test:trace` - Trace viewer

### TypeScript Integration
**Configuration:** `config/testing/tsconfig.json`
- **npm Script:** `npm run build:tests` - TypeScript compilation check
- **Command:** `node_modules/typescript/lib/tsc.js --noEmit --project config/testing/tsconfig.json`

### Artifact Organization
**Base Directory:** `Workspaces/TEMP/playwright-artifacts/`
- **Reports:** JSON format to `Workspaces/TEMP/playwright-report/report.json`
- **HTML Reports:** Mode-specific subdirectories
- **Traces/Screenshots:** Organized by test run and failure context

### Application Integration
**Target Application:** ASP.NET Core 8.0 + Blazor Server (NoorCanvas)
- **Base URL:** `https://localhost:9091` (auto-configured via webServer)
- **Lifecycle:** Playwright manages app startup/shutdown in standalone mode
- **Context:** Node.js test environment with .NET app as managed subprocess

### Legacy Compatibility
**Locations:** `PlayWright/config/` and repository root
- **Purpose:** Backward compatibility for existing test structures
- **Status:** Maintained alongside centralized configuration

---
## Sync Protocol
This file must reflect the **REAL current state** of the project.  
- `/sync` is responsible for updating this file automatically.  
- Obsolete data must be removed.  
- Modified values must be updated to match source of truth in the repo.  
- Placeholders (`[PLACEHOLDER]`) must be replaced on the next run.  
