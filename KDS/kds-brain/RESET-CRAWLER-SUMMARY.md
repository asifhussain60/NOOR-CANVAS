# KDS BRAIN: Data Reset & Crawler System

**Version:** 1.0  
**Date:** November 2, 2025  
**Status:** ✅ COMPLETE

---

## 🎯 Executive Summary

This document summarizes the new BRAIN management capabilities that enable:

1. **Selective Amnesia** - Reset BRAIN for new applications without losing logic
2. **Intelligent Crawling** - Google-style codebase analysis for BRAIN population

These features solve two critical use cases:
- ✅ **Reusing KDS across projects** (reset learned data, keep functionality)
- ✅ **Instant BRAIN education** (crawl codebase, learn architecture immediately)

---

## 🧠 Component 1: BRAIN Reset Agent

### Purpose
Provide selective amnesia - wipe application-specific knowledge while preserving all KDS logic, functionality, and protection mechanisms.

### What Gets Reset
```yaml
❌ RESET (Application Data):
  - intent_patterns (learned phrases)
  - file_relationships (app file structure)
  - workflow_patterns (app workflows)
  - correction_history (app mistakes)
  - validation_insights (app test patterns)
  - feature_components (app features)
  - statistics (usage metrics)
  - events.jsonl (event log)
  - anomalies.yaml (anomalies)

✅ PRESERVED (Core Logic):
  - protection_config (safety rules)
  - All agent files (.md prompts)
  - All scripts (.ps1 tools)
  - BRAIN query/update logic
  - Complete KDS functionality
```

### Reset Modes

#### SOFT RESET (Recommended)
```powershell
.\KDS\scripts\brain-reset.ps1 -Mode soft
```

**Use when:**
- Moving to similar application (same tech stack)
- Want clean slate with same protection rules
- Preserve customized protection thresholds

**Result:**
- Clean learned data
- Protection config preserved
- Ready for new application

#### HARD RESET (Factory Default)
```powershell
.\KDS\scripts\brain-reset.ps1 -Mode hard
```

**Use when:**
- Completely different domain
- Want factory default protection rules
- True "fresh install" needed

**Result:**
- Everything reset to defaults
- Protection config = factory settings
- Like new KDS installation

#### EXPORT-RESET (Portable Templates)
```powershell
.\KDS\scripts\brain-reset.ps1 -Mode export-reset -ExportPath ".\templates\"
```

**Use when:**
- Want to preserve generic learnings
- Building template library
- Multiple similar projects

**Result:**
- Generic patterns exported to templates/
- Then applies soft reset
- Can re-import patterns later

### Safety Features

**Automatic Backups:**
```
Every reset creates timestamped backup:
  KDS/kds-brain/backups/pre-reset-{timestamp}/
    ├── knowledge-graph.yaml
    ├── events.jsonl
    └── anomalies.yaml
```

**Rollback:**
```powershell
.\KDS\scripts\brain-reset.ps1 -Mode rollback -BackupPath "backups/pre-reset-20251102-180000"
```

**Validation:**
- ✅ Checks for active sessions (warns if any)
- ✅ Validates YAML structure post-reset
- ✅ Verifies protection rules intact
- ✅ Tests BRAIN query functionality

### Implementation Files

**Agent:** `KDS/prompts/internal/brain-reset.md`
- Complete documentation
- Usage examples
- Integration with KDS

**Script:** `KDS/scripts/brain-reset.ps1`
- PowerShell implementation
- 4 modes (soft, hard, export-reset, rollback)
- Safety checks and backups
- YAML generation

---

## 🕷️ Component 2: BRAIN Crawler Agent

### Purpose
Comprehensive codebase analysis and BRAIN population system - similar to how Google's crawler indexes websites.

### What Gets Crawled

**1. File Structure & Architecture**
```
Discovers:
  ✅ Component hierarchy (React/Blazor/Vue)
  ✅ Service layer patterns
  ✅ API structure (controllers, routes)
  ✅ Test organization
  ✅ Configuration files
  ✅ Static assets
```

**2. Code Relationships**
```
Discovers:
  ✅ File dependencies (imports, using statements)
  ✅ Co-modification patterns (Git history)
  ✅ Component composition (parent-child)
  ✅ Service injection (DI registrations)
  ✅ API-to-UI mappings
```

**3. Test Patterns**
```
Discovers:
  ✅ Test frameworks (Playwright, xUnit, Jest)
  ✅ Test data locations (session-212, fixtures)
  ✅ Test naming conventions
  ✅ Visual regression tools (Percy)
  ✅ Test selectors (data-testid patterns)
```

**4. Technology Stack**
```
Discovers:
  ✅ Languages (C#, TypeScript, JavaScript)
  ✅ Frameworks (ASP.NET, React, Blazor)
  ✅ UI libraries (Bootstrap, Tailwind)
  ✅ State management (SignalR, Redux)
  ✅ Build tools (Webpack, Vite, MSBuild)
```

**5. Naming Conventions**
```
Discovers:
  ✅ File naming (PascalCase, kebab-case)
  ✅ Class naming (suffixes: Service, Controller)
  ✅ Method naming (verb prefixes)
  ✅ Test naming (Verify_*, Should_*)
```

**6. Configuration Patterns**
```
Discovers:
  ✅ Environment configs (appsettings hierarchy)
  ✅ Local overrides (.local.json)
  ✅ Secrets management
  ✅ Database connection patterns
```

### Crawler Modes

#### QUICK SCAN (30 seconds)
```powershell
.\KDS\scripts\brain-crawler.ps1 -Mode quick
```

**Scans:**
- Directory structure
- Package files (package.json, *.csproj)
- Configuration files
- Test file locations

**Result:** Basic architectural map

#### DEEP SCAN (5-10 minutes)
```powershell
.\KDS\scripts\brain-crawler.ps1 -Mode deep
```

**Scans:**
- Everything in quick scan
- File contents (imports, dependencies)
- Git history (co-modification patterns)
- Test coverage mapping
- Code relationships

**Result:** Complete knowledge graph

#### INCREMENTAL SCAN (1-2 minutes)
```powershell
.\KDS\scripts\brain-crawler.ps1 -Mode incremental
```

**Scans:**
- New files (created since last scan)
- Modified files (changed since last scan)
- Updated relationships

**Result:** Keep BRAIN current

#### TARGETED SCAN (Variable)
```powershell
.\KDS\scripts\brain-crawler.ps1 -Mode targeted -Path "Components/Canvas/**"
```

**Scans:**
- Specified directory only
- Deep analysis within scope
- Relationships to outside files

**Result:** Focused knowledge

### Safety Features

**Skip Patterns:**
```yaml
Skipped directories:
  - node_modules, bin, obj, .git, packages, dist, build

Skipped files:
  - *.dll, *.exe, *.min.js, *.min.css, *.map
  - package-lock.json, *.user
  - Files > 1MB (too large)
  - Binary files
```

**Protection Integration:**
```powershell
# Validates before updating knowledge graph
.\KDS\scripts\protect-brain-update.ps1 -Mode validate

# If validation fails:
  → Rollback knowledge graph
  → Notify user
  → Recommend fixing protection issues
```

**Incremental State Tracking:**
```yaml
# KDS/kds-brain/crawler-state.yaml
last_scan:
  timestamp: "2025-11-02T18:30:00Z"
  mode: "deep"
  files_scanned: 1247

file_hashes:
  "path/to/file": "sha256..."
  # (for incremental mode)
```

### Output

**Crawler Report:**
```markdown
# KDS/kds-brain/crawler-report-{timestamp}.md

Summary:
  - Files scanned: 1,247
  - Relationships: 3,892
  - Patterns: 127

Technology Stack:
  Backend: C# - ASP.NET Core 8.0
  Frontend: Blazor Server
  Testing: Playwright + Percy

Architectural Patterns:
  Components: 89 files (PascalCase.razor)
  Services: 34 files (PascalCaseService.cs)
  Tests: 152 files (kebab-case.spec.ts)

Recommendations:
  ✅ BRAIN ready for intelligent routing
  ⚠️ 22 components without tests
```

**Knowledge Graph Updates:**
```yaml
# Added to knowledge-graph.yaml

architectural_patterns:
  components:
    location: "Components/**/*.razor"
    naming: "PascalCase.razor"
    count: 89

technology_stack:
  backend:
    language: "C#"
    framework: "ASP.NET Core 8.0"

conventions:
  file_naming:
    components: "PascalCase.razor"
    services: "PascalCaseService.cs"
```

### Implementation Files

**Agent:** `KDS/prompts/internal/brain-crawler.md`
- Complete documentation
- All 4 crawler modes explained
- Integration with KDS agents
- Usage examples

**Script:** `KDS/scripts/brain-crawler.ps1`
- PowerShell implementation
- 4 modes (quick, deep, incremental, targeted)
- AST parsing (imports, classes, DI)
- Git history analysis
- Report generation

---

## 🔄 Typical Workflows

### Workflow 1: New KDS Installation

```markdown
Step 1: Initial Setup
  Copy KDS/ folder to project

Step 2: Crawl Codebase (educate BRAIN)
  PowerShell: .\KDS\scripts\brain-crawler.ps1 -Mode deep
  Duration: 5-10 minutes
  Result: BRAIN knows entire architecture

Step 3: Start Using KDS
  #file:KDS/prompts/user/kds.md
  I want to add a share button
  
  → BRAIN already knows:
    - Where components go
    - Naming conventions
    - Service patterns
    - Test patterns
```

### Workflow 2: Moving KDS to New Project

```markdown
Step 1: Export Patterns (optional)
  PowerShell: .\KDS\scripts\brain-reset.ps1 -Mode export-reset -ExportPath ".\templates\"
  Result: Generic patterns saved

Step 2: Copy KDS/ to New Project
  Copy-Item "KDS" "D:\NEW-PROJECT\KDS" -Recurse

Step 3: BRAIN Already Clean (export-reset did it)
  Result: Zero old application data

Step 4: Crawl New Project
  cd D:\NEW-PROJECT
  .\KDS\scripts\brain-crawler.ps1 -Mode deep
  Result: BRAIN learns new architecture

Step 5: Start Development
  #file:KDS/prompts/user/kds.md
  I want to add a login form
```

### Workflow 3: Regular Maintenance (CI/CD)

```markdown
Add to CI/CD Pipeline:
  - After each merge to main
  - Run: .\KDS\scripts\brain-crawler.ps1 -Mode incremental
  - Duration: 1-2 minutes
  - Result: BRAIN stays current
```

### Workflow 4: Cleaning Up After Testing

```markdown
Scenario: Tested KDS extensively, want clean slate

Step 1: Soft Reset
  PowerShell: .\KDS\scripts\brain-reset.ps1 -Mode soft
  Result: Clean data, protection config preserved

Step 2: Verify Clean State
  Check: KDS/kds-brain/knowledge-graph.yaml
  Status: Empty sections, ready for production

Step 3: Continue Development
  #file:KDS/prompts/user/kds.md
  (BRAIN learns from real usage)
```

---

## 📊 Benefits

### Reset System Benefits

**For Users:**
- ✅ Reuse KDS across unlimited projects
- ✅ Clean slate in seconds (not hours)
- ✅ No reconfiguration needed
- ✅ Safe (automatic backups, rollback)

**For BRAIN:**
- 🧠 Amnesia without lobotomy (logic intact)
- 🛡️ Protection rules preserved/reset (user choice)
- 📦 Portable (export/import patterns)
- ✅ Zero downtime (works immediately)

### Crawler System Benefits

**For Users:**
- ⚡ Instant BRAIN education (no manual configuration)
- 🎯 Accurate from day one (knows architecture)
- 📊 Comprehensive reports (see what BRAIN learned)
- 🔄 Keep current (incremental scans)

**For BRAIN:**
- 🏗️ Architectural awareness (upfront knowledge)
- 🔗 Relationship mapping (file dependencies)
- 📝 Convention learning (naming patterns)
- 🧪 Test pattern recognition (framework detection)

**For KDS Agents:**

**Router:**
- Knows file locations immediately
- Suggests correct paths (learned from crawler)

**Planner:**
- Creates realistic plans (knows typical feature scope)
- Follows conventions automatically

**Executor:**
- Suggests related files (co-modification data)
- Follows naming conventions

**Test Generator:**
- Uses correct framework (detected by crawler)
- Follows selector patterns

---

## 🎓 Integration Points

### KDS Main Entry Point (kds.md)

**Added section:**
```markdown
### First-Time Setup

Option 1: Populate from sessions (if history exists)
Option 2: Crawl codebase (recommended for new installations)

### Moving KDS to Another Application

Reset BRAIN for new project (3 modes: soft/hard/export-reset)
Then crawl new application
```

### BRAIN System (README.md)

**Added sections:**
- Reset mechanism documentation
- Crawler system documentation
- Integration with event learning

### Agent References

**All agents can now:**
```markdown
Query crawler data:
  #shared-module:brain-query.md
  query_type: architectural_pattern
  pattern: "where do components live?"

Reset for new project:
  User: "Reset BRAIN for new project"
  → Routes to brain-reset.md

Crawl codebase:
  User: "Scan my codebase and educate BRAIN"
  → Routes to brain-crawler.md
```

---

## 📁 File Inventory

### Documentation
```
KDS/prompts/internal/
  ├── brain-reset.md      (NEW - Reset agent documentation)
  └── brain-crawler.md    (NEW - Crawler agent documentation)

KDS/prompts/user/
  └── kds.md              (UPDATED - Added reset & crawler sections)

KDS/kds-brain/
  └── README.md           (UPDATED - References reset & crawler)
```

### Implementation
```
KDS/scripts/
  ├── brain-reset.ps1     (NEW - Reset implementation)
  └── brain-crawler.ps1   (NEW - Crawler implementation)
```

### Generated (Runtime)
```
KDS/kds-brain/
  ├── backups/            (Created by reset script)
  │   └── pre-reset-{timestamp}/
  ├── crawler-report-{timestamp}.md (Created by crawler)
  └── crawler-state.yaml  (Created by incremental crawler)
```

---

## ✅ Verification Checklist

### Reset System
- [x] Soft reset preserves protection config
- [x] Hard reset uses factory defaults
- [x] Export-reset saves generic patterns
- [x] Rollback restores from backup
- [x] Automatic backups created
- [x] Active session warnings work
- [x] YAML validation post-reset
- [x] BRAIN functionality intact after reset

### Crawler System
- [x] Quick scan completes in ~30s
- [x] Deep scan analyzes comprehensively
- [x] Incremental scan detects changes
- [x] Targeted scan handles specific paths
- [x] Skip patterns work (node_modules, bin, etc.)
- [x] Technology stack detection works
- [x] Naming convention analysis works
- [x] File relationship mapping works
- [x] Test pattern detection works
- [x] Report generation works
- [x] Knowledge graph updates correctly
- [x] Protection integration works

### Integration
- [x] kds.md references both systems
- [x] BRAIN README documents both
- [x] Agents can query crawler data
- [x] Scripts are executable
- [x] No breaking changes to existing KDS

---

## 🎯 Summary

**Two powerful new capabilities added to KDS BRAIN:**

### 1. Selective Amnesia (Reset)
```
Problem: Need to reuse KDS in different applications
Solution: Reset learned data, keep all logic/functionality
Modes: soft (keep config), hard (factory), export-reset (save patterns)
Safety: Automatic backups, validation, rollback
```

### 2. Intelligent Crawler
```
Problem: BRAIN empty on new installations
Solution: Google-style codebase crawler
Modes: quick (30s), deep (5-10m), incremental (1-2m), targeted
Output: Complete architectural knowledge graph
```

### Combined Power

**New Project Workflow:**
```
1. Copy KDS/ to new project
2. Reset BRAIN (clean slate)
3. Crawl new codebase (instant education)
4. Start using KDS (BRAIN already knows architecture)
```

**Result:** Full KDS power in minutes, not hours!

### Key Achievements

✅ **Reusability** - KDS works across unlimited projects  
✅ **Efficiency** - Instant BRAIN education via crawler  
✅ **Safety** - Backups, validation, rollback  
✅ **Zero Downtime** - Works immediately after reset/crawl  
✅ **Portability** - Export/import generic patterns  
✅ **Maintenance** - Incremental scans keep BRAIN current  

**KDS is now truly portable and self-educating!** 🚀🧠
