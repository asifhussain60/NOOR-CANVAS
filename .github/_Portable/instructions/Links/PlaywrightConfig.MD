# Generic Template — Configured by total-recall

> **NOTE**: This is a TEMPLATE file. To configure for your project:
> 1. Run: `@workspace /total-recall`
> 2. Review generated files in `.github/_Portable/_Configured/`
> 3. Copy to `.github/` when satisfied

**Template Variables Used:**
- `{{PROJECT_NAME}}`
- `{{PROJECT_TYPE}}`
- `{{RUN_COMMAND}}`
- `{{SOURCE_PATH}}`
- `{{TEST_FRAMEWORK}}`
- `{{TEST_PATH}}`
- `{{UI_FRAMEWORK}}`

---
# {{TEST_FRAMEWORK}} Configuration — Canonical Reference

## Required Reading
- **MANDATORY:** `.github/instructions/Links/{{TEST_FRAMEWORK}}TestPaths.MD` (canonical test data and proven patterns)

# {{TEST_FRAMEWORK}} Configuration — Canonical Reference

## Primary Configuration
**File:** `config/testing/{{TEST_FRAMEWORK}}.config.cjs` (centralized, CommonJS format)

### Core Settings
```javascript
{
    timeout: 30000,
    testDir: '../../',
    testMatch: [
        '**/{{TEST_FRAMEWORK}}/{{TEST_PATH}}**/*.{test,spec}.{js,ts,jsx,tsx}',
        '**/Workspaces/TEMP/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    retries: 0,
    use: {
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        outputDir: 'Workspaces/TEMP/{{TEST_FRAMEWORK}}-artifacts'
    }
}
```

### Environment Mode Overrides

#### Standalone Mode (`PW_MODE=standalone`)
**Purpose:** Automatic .NET app lifecycle management for testing
- **webServer Configuration:**
  - `command: '{{RUN_COMMAND}}'`
  - `cwd: '../../{{SOURCE_PATH}}'`
  - `port: 9091`
  - `reuseExistingServer: !process.env.CI`
  - `timeout: 60000`
- **Settings:** `timeout: 120000`, `retries: 0`, `workers: 1`
- **UI:** `headless: false`, `viewport: 1280x720`
- **Artifacts:** `trace: 'retain-on-failure'`, `video: 'retain-on-failure'`
- **Reporter:** HTML report to `Workspaces/TEMP/{{TEST_FRAMEWORK}}-report/standalone-html`

#### Temp Mode (`PW_MODE=temp`)
**Purpose:** Enhanced artifact collection for debugging
- **Settings:** `retries: 0`, `workers: 1`
- **Artifacts:** `video: 'on'`, `trace: 'on'`

### npm Script Integration
**Centralized Scripts (from `package.json`):**
- `npm run test` - Basic test execution
- `npm run test:headed` - Headed browser mode
- `npm run test:debug` - Debug mode with DevTools
- `npm run test:ui-mode` - {{TEST_FRAMEWORK}} UI mode
- `npm run test:codegen` - Code generation tool
- `npm run test:report` - View HTML reports
- `npm run test:trace` - Trace viewer

### TypeScript Integration
**Configuration:** `config/testing/tsconfig.json`
- **npm Script:** `npm run build:tests` - TypeScript compilation check
- **Command:** `node_modules/typescript/lib/tsc.js --noEmit --project config/testing/tsconfig.json`

### Artifact Organization
**Base Directory:** `Workspaces/TEMP/{{TEST_FRAMEWORK}}-artifacts/`
- **Reports:** JSON format to `Workspaces/TEMP/{{TEST_FRAMEWORK}}-report/report.json`
- **HTML Reports:** Mode-specific subdirectories
- **Traces/Screenshots:** Organized by test run and failure context

### Application Integration
**Target Application:** {{PROJECT_TYPE}} 8.0 + {{UI_FRAMEWORK}} ({{PROJECT_NAME}})
- **Base URL:** `https://localhost:9091` (auto-configured via webServer)
- **Lifecycle:** {{TEST_FRAMEWORK}} manages app startup/shutdown in standalone mode
- **Context:** Node.js test environment with .NET app as managed subprocess

### Legacy Compatibility
**Locations:** `{{TEST_FRAMEWORK}}/config/` and repository root
- **Purpose:** Backward compatibility for existing test structures
- **Status:** Maintained alongside centralized configuration

---
## Sync Protocol
This file must reflect the **REAL current state** of the project.  
- `/sync` is responsible for updating this file automatically.  
- Obsolete data must be removed.  
- Modified values must be updated to match source of truth in the repo.  
- Placeholders (`[PLACEHOLDER]`) must be replaced on the next run.
- **Dependencies:** {{TEST_FRAMEWORK}}TestPaths.MD must be consulted for canonical test data.  
