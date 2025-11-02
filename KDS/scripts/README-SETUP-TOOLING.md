# KDS Tooling Setup Script

**Version:** 1.0.0  
**Location:** `KDS/scripts/setup-kds-tooling.ps1`  
**Portable:** ✅ Works on ANY project

---

## 🎯 Purpose

Automatically sets up all development tooling required for KDS to function efficiently:
- Test frameworks (Playwright, Percy)
- Code quality tools (ESLint, Prettier, Stylelint)
- TypeScript toolchain
- .NET analyzers
- Configuration files

---

## 🚀 Quick Start

### Run Setup
```powershell
# From project root
.\KDS\scripts\setup-kds-tooling.ps1
```

### Options
```powershell
# Skip Node.js packages
.\KDS\scripts\setup-kds-tooling.ps1 -SkipNodePackages

# Skip .NET packages
.\KDS\scripts\setup-kds-tooling.ps1 -SkipDotNetPackages

# Force reinstall (even if already installed)
.\KDS\scripts\setup-kds-tooling.ps1 -Force

# Skip final validation
.\KDS\scripts\setup-kds-tooling.ps1 -SkipValidation
```

---

## 📦 What Gets Installed

### Node.js Packages (18 packages)

**E2E Testing:**
- `@playwright/test` ^1.56.1
- `playwright` ^1.56.1

**Visual Regression:**
- `@percy/cli` ^1.31.4
- `@percy/playwright` ^1.0.9

**Linting:**
- `eslint` ^9.36.0
- `@typescript-eslint/eslint-plugin` ^8.44.1
- `@typescript-eslint/parser` ^8.44.1
- `eslint-plugin-playwright` ^2.2.2
- `eslint-config-prettier` ^10.1.8

**Formatting:**
- `prettier` ^3.6.2

**CSS Linting:**
- `stylelint` ^16.25.0
- `stylelint-config-standard` ^39.0.1
- `postcss-html` ^1.8.0

**TypeScript:**
- `typescript` ^5.9.2
- `ts-node` ^10.9.2
- `@types/node` ^24.5.2

### .NET Packages (3 packages)

**Code Quality:**
- `Roslynator.Analyzers` 4.12.9
- `StyleCop.Analyzers` 1.2.0-beta.556
- `Microsoft.CodeAnalysis.NetAnalyzers` 9.0.0

### Additional Setup

**Playwright Browsers:**
- Chromium
- Firefox
- WebKit

**KDS Enhancement Features (Zero Install):**
- Screenshot/Image Analysis - Uses GitHub Copilot's built-in Vision API
  - Extract requirements from mockups
  - Read annotations on screenshots
  - Analyze design specifications
  - Parse bug report images
  - No additional dependencies required

---

## 🔍 Project Type Detection

The script automatically detects:

| Indicator | Project Type |
|-----------|--------------|
| `*.sln` | .NET |
| `package.json` | Node.js |
| `requirements.txt` | Python |
| `pom.xml` or `build.gradle` | Java |

---

## ✅ Core Dependencies Validated

The script checks for:

1. **Git** (2.30+) - Version control
2. **PowerShell** (5.1+) - Scripting
3. **Node.js** (18.0+) - If Node project
4. **NPM** (8.0+) - Package management
5. **.NET SDK** (8.0+) - If .NET project

---

## 📋 Configuration Files

The script validates (but does not create):

- `config/testing/playwright.config.cjs`
- `config/testing/eslint.config.js`
- `config/testing/.prettierrc`
- `config/testing/stylelint.config.cjs`
- `config/testing/tsconfig.json`

**Note:** Config file templates should already exist in your project.

---

## 🗄️ Database Question

### Should KDS use a dedicated database?

**CURRENT APPROACH:**
- Session state: JSON files (`KDS/sessions/`)
- Knowledge base: Markdown files (`KDS/knowledge/`)
- Version control: Git

**RECOMMENDATION: NO (for now)**

**Reasons:**
1. ✅ Current JSON/Markdown approach aligns with git-first design
2. ✅ Session resumption already working
3. ✅ Simpler deployment (no DB setup)
4. ✅ Git serves as source of truth
5. ✅ Human-readable files (stakeholder-friendly)

**Future Enhancement:**
- Consider **SQLite** if pattern library grows > 1000 entries
- Use for **analytics ONLY** (not primary storage)
- Keep JSON as source of truth, DB as query cache

**Recommended Approach (if added later):**
```
KDS/
└── data/
    ├── kds.db              # SQLite (analytics cache)
    ├── sessions/           # JSON (source of truth)
    └── knowledge/          # Markdown (source of truth)
```

**Database Schema (if implemented):**
```sql
-- Session analytics
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    started_at TEXT,
    completed_at TEXT,
    agent_used TEXT,
    success BOOLEAN
);

-- Pattern usage
CREATE TABLE pattern_usage (
    pattern_id TEXT,
    used_at TEXT,
    session_id TEXT,
    success BOOLEAN
);
```

**Benefits of Database:**
- ✅ Query: "Which patterns are most used?"
- ✅ Query: "Average session completion time?"
- ✅ Query: "Which agent has highest success rate?"

**Drawbacks of Database:**
- ❌ Binary file (not git-friendly)
- ❌ Requires backup strategy
- ❌ Added complexity
- ❌ Another dependency

---

## 🔄 Running in New Projects

### Step 1: Copy KDS to New Project
```powershell
# From new project root
mkdir KDS
Copy-Item -Recurse D:\PROJECTS\NOOR-CANVAS\KDS\* .\KDS\
```

### Step 2: Run Setup
```powershell
.\KDS\scripts\setup-kds-tooling.ps1
```

### Step 3: Configure for Your Project
Edit `KDS/kds.config.json`:
```json
{
  "projectName": "YourProject",
  "projectType": "dotnet",
  "testFramework": "playwright",
  "buildCommand": "dotnet build",
  "testCommand": "npm run test"
}
```

### Step 4: Initialize Git Hooks
```powershell
# Link hooks
Copy-Item .\KDS\hooks\* .\.git\hooks\
```

---

## 🛠️ Troubleshooting

### "npm not found"
Install Node.js from https://nodejs.org/

### "dotnet not found"
Install .NET SDK from https://dotnet.microsoft.com/

### "Playwright installation failed"
```powershell
# Manual install
npm install -g playwright
npx playwright install
```

### "Permission denied on hooks"
```powershell
# Make executable (Git Bash/Linux/Mac)
chmod +x .git/hooks/pre-commit
```

### "Package installation slow"
```powershell
# Use faster registry
npm config set registry https://registry.npmjs.org/
```

---

## 📊 Output Example

```
═══════════════════════════════════════════════════════════
  KDS Tooling Setup v1.0.0
═══════════════════════════════════════════════════════════

───────────────────────────────────────────────────────────
  Detecting Project Type
───────────────────────────────────────────────────────────

✅ Detected .NET project (solution file found)
✅ Detected Node.js project (package.json found)

───────────────────────────────────────────────────────────
  Validating Core Dependencies
───────────────────────────────────────────────────────────

✅ Git installed: git version 2.43.0
✅ PowerShell installed: 7.4.0
✅ Node.js installed: v22.17.0
✅ NPM installed: v10.9.2
✅ .NET SDK installed: 9.0.305

───────────────────────────────────────────────────────────
  Installing Node.js Packages
───────────────────────────────────────────────────────────

✅ Already installed: @playwright/test (^1.56.1)
✅ Already installed: playwright (^1.56.1)
⚠️  Missing: @percy/playwright
ℹ️  Installing 1 packages...
✅ Installed 1 Node.js packages

═══════════════════════════════════════════════════════════
  KDS Tooling Setup Summary
═══════════════════════════════════════════════════════════

Project Type(s):
  • .NET
  • Node.js

Newly Installed Packages:
  ✅ @percy/playwright@^1.0.9

Already Installed (Skipped):
  17 packages already present

✅ KDS tooling setup complete!

Next steps:
  1. Run tests: npm run test
  2. Run linting: npm run lint
  3. Check build: npm run build:tests
```

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-02 | Initial release |

---

## 🔗 Related Documentation

- [KDS Design](../KDS-DESIGN.md)
- [Governance Rules](../governance/rules.md)
- [Session Management](../sessions/README.md)
- [Tooling Dependencies](../../Docs/TOOLING-DEPENDENCIES.md)

---

**Part of:** KDS v4.4.0  
**Portable:** ✅ Works on ANY project  
**Tested on:** Windows 11, PowerShell 7.4
