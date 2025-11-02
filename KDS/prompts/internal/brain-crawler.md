# KDS BRAIN Crawler Agent

**Version:** 1.0  
**Status:** 🕷️ ACTIVE  
**Purpose:** Comprehensive codebase analysis and BRAIN population system (Google-style crawler for KDS)

---

## 🎯 Purpose

This agent **crawls the entire application** and feeds BRAIN with essential information, similar to how Google's crawler indexes websites.

**Think of it as:**
- 🕷️ Google Bot for your codebase
- 📊 Census of your application
- 🧠 BRAIN's initial education system
- 🗺️ Map of your application's architecture

---

## 🏗️ What Gets Crawled

### 1. File Structure & Architecture
```
Discovers:
  ✅ Component hierarchy (React/Blazor/Vue components)
  ✅ Service layer patterns (where services live)
  ✅ API structure (controllers, routes, endpoints)
  ✅ Test organization (unit/integration/e2e locations)
  ✅ Configuration files (appsettings, package.json, etc.)
  ✅ Static assets (CSS, JS, images)

Feeds BRAIN:
  file_relationships:
    architectural_patterns:
      components: "Components/**/*.razor"
      services: "Services/**/*Service.cs"
      controllers: "Controllers/API/**/*Controller.cs"
      tests: "Tests/{Unit,UI,Integration}/**"
```

### 2. Code Relationships
```
Discovers:
  ✅ File dependencies (imports, using statements)
  ✅ Co-modification patterns (Git history analysis)
  ✅ Component composition (parent-child relationships)
  ✅ Service injection patterns (DI registrations)
  ✅ API-to-UI mappings (which components call which APIs)

Feeds BRAIN:
  file_relationships:
    HostControlPanel.razor:
      imports:
        - "Services/ShareButtonInjectionService.cs"
        - "wwwroot/css/noor-canvas.css"
      co_modified_with:
        - path: "wwwroot/css/noor-canvas.css"
          frequency: 0.75
      child_components:
        - "Components/Canvas/TranscriptCanvas.razor"
```

### 3. Test Patterns
```
Discovers:
  ✅ Test frameworks in use (Playwright, xUnit, Jest, etc.)
  ✅ Test data locations (session-212, fixtures, mocks)
  ✅ Test naming conventions
  ✅ Visual regression tools (Percy, Chromatic)
  ✅ Test selectors (data-testid patterns)

Feeds BRAIN:
  validation_insights:
    test_patterns:
      playwright_e2e:
        framework: "playwright"
        test_data: "session-212"
        selector_pattern: "[data-testid='...']"
        visual_regression: "percy"
      unit_tests:
        framework: "xUnit"
        location: "Tests/Unit/**"
        naming: "*Tests.cs"
```

### 4. Technology Stack
```
Discovers:
  ✅ Languages (C#, TypeScript, JavaScript)
  ✅ Frameworks (ASP.NET, React, Blazor, etc.)
  ✅ UI libraries (Bootstrap, Tailwind, Material-UI)
  ✅ State management (SignalR, Redux, MobX)
  ✅ Build tools (Webpack, Vite, MSBuild)
  ✅ Package managers (npm, NuGet, pip)

Feeds BRAIN:
  technology_stack:
    backend:
      language: "C#"
      framework: "ASP.NET Core"
      version: "8.0"
    frontend:
      language: "TypeScript/JavaScript"
      framework: "Blazor Server"
      ui_library: "Bootstrap"
    testing:
      e2e: "Playwright"
      unit: "xUnit"
      visual: "Percy"
```

### 5. Workflow Patterns
```
Discovers:
  ✅ Git branch strategies (feature/, fix/, etc.)
  ✅ Task definitions (.vscode/tasks.json)
  ✅ Build pipelines (scripts, workflows)
  ✅ Deployment patterns (scripts, manifests)
  ✅ Code generation patterns (scaffolding)

Feeds BRAIN:
  workflow_patterns:
    feature_development:
      sequence: ["create-branch", "plan", "execute", "test", "validate"]
      branch_prefix: "features/"
      test_required: true
    build_process:
      task: "build"
      command: "dotnet build"
      validation: "post-build-tests"
```

### 6. Naming Conventions
```
Discovers:
  ✅ File naming (PascalCase, kebab-case, etc.)
  ✅ Class naming (suffixes: Service, Controller, Tests)
  ✅ Method naming (verb prefixes: Get, Post, Handle)
  ✅ Variable naming (camelCase, _private)
  ✅ Test naming (Should_*, Test_*, Verify_*)

Feeds BRAIN:
  conventions:
    file_naming:
      components: "PascalCase.razor"
      services: "PascalCaseService.cs"
      controllers: "PascalCaseController.cs"
      tests: "PascalCaseTests.cs"
    method_naming:
      api: "verb + noun (GetUsers, CreateSession)"
      tests: "Verify_Condition_ExpectedResult"
```

### 7. Configuration Patterns
```
Discovers:
  ✅ Environment configs (appsettings.json hierarchy)
  ✅ Feature flags (if any)
  ✅ Local overrides (.local.json files)
  ✅ Secrets management (user-secrets, env vars)
  ✅ Database connection patterns

Feeds BRAIN:
  configuration_patterns:
    appsettings:
      hierarchy: ["appsettings.json", "appsettings.Development.json", "appsettings.local.json"]
      override_pattern: "*.local.json (gitignored)"
    secrets:
      method: "user-secrets"
      config_key: "ConnectionStrings"
```

### 8. Documentation Patterns
```
Discovers:
  ✅ README files (locations, conventions)
  ✅ Code comments (XML docs, JSDoc)
  ✅ Markdown docs (Docs/, KDS/docs/)
  ✅ KDS knowledge base (KDS/knowledge/)
  ✅ API documentation (Swagger, DocFX)

Feeds BRAIN:
  documentation:
    locations:
      - "Docs/**/*.md"
      - "KDS/knowledge/**/*.md"
      - "README.md files (per-directory)"
    api_docs:
      tool: "DocFX"
      location: "DocFX/_site/"
```

---

## 🚀 Crawler Modes

### Mode 1: QUICK SCAN (Fast, High-Level)
**Duration:** ~30 seconds  
**Depth:** Surface-level analysis  
**Use Case:** Initial BRAIN population, quick overview

```powershell
# PowerShell
.\KDS\scripts\brain-crawler.ps1 -Mode quick
```

**Scans:**
- ✅ Directory structure (find all Components/, Services/, etc.)
- ✅ Package files (package.json, *.csproj)
- ✅ Configuration files (appsettings.json, tasks.json)
- ✅ Test file locations (Tests/** structure)
- ⏭️ SKIPS: File contents, Git history, deep relationships

**Result:** Basic architectural map

### Mode 2: DEEP SCAN (Thorough, Comprehensive)
**Duration:** ~5-10 minutes  
**Depth:** Full analysis with relationships  
**Use Case:** Complete BRAIN education, migration prep

```powershell
# PowerShell
.\KDS\scripts\brain-crawler.ps1 -Mode deep
```

**Scans:**
- ✅ Everything in Quick Scan
- ✅ File contents (imports, dependencies, APIs)
- ✅ Git history (co-modification patterns)
- ✅ Test coverage mapping
- ✅ Code relationships (DI, composition)
- ✅ Naming convention analysis

**Result:** Complete knowledge graph

### Mode 3: INCREMENTAL SCAN (Smart, Efficient)
**Duration:** ~1-2 minutes  
**Depth:** Changes since last scan  
**Use Case:** Regular updates, CI/CD integration

```powershell
# PowerShell
.\KDS\scripts\brain-crawler.ps1 -Mode incremental
```

**Scans:**
- ✅ New files (created since last scan)
- ✅ Modified files (changed since last scan)
- ✅ Updated relationships (if files modified together)
- ⏭️ SKIPS: Unchanged files

**Result:** Kept BRAIN current

### Mode 4: TARGETED SCAN (Specific Area)
**Duration:** Variable  
**Depth:** Deep, but scoped  
**Use Case:** New feature area, specific module

```powershell
# PowerShell
.\KDS\scripts\brain-crawler.ps1 -Mode targeted -Path "Components/Canvas/**"
```

**Scans:**
- ✅ Specified directory only
- ✅ Deep analysis within scope
- ✅ Relationships to outside files
- ⏭️ SKIPS: Everything outside path

**Result:** Focused knowledge

---

## 📋 Crawler Workflow

### Phase 1: Discovery
```
Step 1: Workspace Analysis
  📂 Identify workspace root
  📂 Find primary language/framework
  📂 Locate key directories (src, tests, etc.)
  
Step 2: File Enumeration
  📄 List all source files
  📄 Categorize by type (component, service, test, etc.)
  📄 Skip ignored paths (node_modules, bin, obj, etc.)
  
Step 3: Technology Detection
  🔍 Parse package.json / *.csproj
  🔍 Identify frameworks (ASP.NET, React, etc.)
  🔍 Find build tools (dotnet, npm, etc.)
```

### Phase 2: Analysis
```
Step 4: File Content Parsing
  📖 Extract imports/dependencies
  📖 Identify classes/components/functions
  📖 Find API endpoints
  📖 Detect test patterns
  
Step 5: Relationship Mapping
  🔗 Build dependency graph
  🔗 Analyze Git history (co-modifications)
  🔗 Map component hierarchies
  🔗 Link APIs to UI components
  
Step 6: Pattern Recognition
  🎯 Naming conventions
  🎯 Architectural patterns
  🎯 Test patterns
  🎯 Configuration patterns
```

### Phase 3: BRAIN Population
```
Step 7: Knowledge Extraction
  🧠 Generate file_relationships
  🧠 Generate architectural_patterns
  🧠 Generate test_patterns
  🧠 Generate conventions
  
Step 8: Confidence Assignment
  📊 High confidence (0.85+): Direct observations (file imports)
  📊 Medium confidence (0.70-0.84): Pattern inference (naming)
  📊 Low confidence (0.50-0.69): Statistical (co-modification)
  
Step 9: Knowledge Graph Update
  💾 Merge with existing BRAIN data
  ✅ Validate against protection rules
  🔄 Apply confidence thresholds
```

### Phase 4: Validation
```
Step 10: Quality Check
  ✅ Verify knowledge graph structure
  ✅ Check confidence scores
  ✅ Validate file references exist
  
Step 11: Report Generation
  📊 Create scan report
  📊 Show discovered patterns
  📊 List any anomalies
  
Step 12: BRAIN Health Check
  🏥 Run brain-query system_health
  🏥 Verify protection rules intact
  🏥 Test query functionality
```

---

## 🔍 Crawler Techniques

### 1. AST Parsing (Code Structure)
```powershell
# C# example (using Roslyn concepts)
Get-ChildItem -Recurse -Filter "*.cs" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Find using statements
    $imports = [regex]::Matches($content, 'using\s+([\w.]+);')
    
    # Find class declarations
    $classes = [regex]::Matches($content, 'class\s+(\w+)')
    
    # Find DI in constructor
    $injections = [regex]::Matches($content, 'private readonly\s+(\w+)\s+')
    
    # Store in knowledge graph
}
```

### 2. Git History Analysis
```powershell
# Co-modification detection
git log --format="" --name-only --since="6 months ago" | 
    Sort-Object | 
    Group-Object | 
    Where-Object { $_.Count -gt 5 } |
    ForEach-Object {
        # Files modified together frequently
        # Store in file_relationships.co_modified_with
    }
```

### 3. Import Graph Building
```powershell
# Build dependency graph
$graph = @{}

Get-ChildItem -Recurse -Filter "*.razor" | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content $file -Raw
    
    # Find @inject statements (Blazor DI)
    $services = [regex]::Matches($content, '@inject\s+(\w+)\s+')
    
    # Find component references
    $components = [regex]::Matches($content, '<(\w+)[>\s]')
    
    $graph[$file] = @{
        services = $services
        components = $components
    }
}
```

### 4. Test Pattern Detection
```powershell
# Identify test frameworks and patterns
Get-ChildItem -Recurse -Filter "*.spec.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Detect framework
    $framework = if ($content -match 'import.*playwright') { 'playwright' }
                 elseif ($content -match 'import.*jest') { 'jest' }
                 else { 'unknown' }
    
    # Find test data
    $testData = [regex]::Matches($content, 'session-(\d+)')
    
    # Find selectors
    $selectors = [regex]::Matches($content, '\[data-testid=[\'"](.*?)[\'"]\]')
}
```

### 5. Configuration Hierarchy Detection
```powershell
# Find appsettings hierarchy
$baseConfig = "appsettings.json"
$envConfigs = Get-ChildItem "appsettings.*.json" -Exclude "*.local.json"
$localConfigs = Get-ChildItem "appsettings.*.local.json"

$hierarchy = @($baseConfig) + $envConfigs + $localConfigs
```

---

## 📊 Output Format

### Crawler Report
```markdown
# BRAIN Crawler Report
Generated: 2025-11-02 18:30:00
Mode: deep
Duration: 7m 32s

## Summary
- Files scanned: 1,247
- Relationships discovered: 3,892
- Patterns identified: 127
- Confidence average: 0.78

## Technology Stack
Backend:
  - Language: C# 12
  - Framework: ASP.NET Core 8.0
  - Database: SQL Server

Frontend:
  - Framework: Blazor Server
  - UI: Bootstrap 5
  - JavaScript: Vanilla + SignalR

Testing:
  - E2E: Playwright
  - Unit: xUnit
  - Visual: Percy

## Architectural Patterns
Components: 89 files in Components/**/*.razor
  - Pattern: PascalCase.razor
  - Hierarchy depth: 3 levels
  - Most referenced: TranscriptCanvas.razor (12 imports)

Services: 34 files in Services/**/*Service.cs
  - Pattern: PascalCaseService.cs
  - DI registration: Program.cs
  - Most injected: ShareButtonInjectionService (8 components)

Controllers: 23 files in Controllers/API/**/*Controller.cs
  - Pattern: PascalCaseController.cs
  - Routing: /api/[controller]/[action]
  - Most called: SessionsController (15 frontend calls)

## File Relationships (Top 10)
1. HostControlPanel.razor ↔ noor-canvas.css (0.85 co-modification)
2. TranscriptCanvas.razor ↔ CanvasService.cs (0.82)
3. Program.cs ↔ appsettings.json (0.79)
...

## Test Coverage Map
Components with tests: 67/89 (75%)
Services with tests: 28/34 (82%)
Controllers with tests: 19/23 (83%)

Visual regression coverage: 23 components

## Naming Conventions
Files:
  - Components: PascalCase.razor (100% adherence)
  - Services: PascalCaseService.cs (97% adherence)
  - Tests: kebab-case.spec.ts (100% adherence)

Methods:
  - Controllers: VerbNoun (GetSession, CreateUser)
  - Tests: Verify_Condition_Result

## Configuration Patterns
appsettings hierarchy: 3 layers
  - appsettings.json (base)
  - appsettings.Development.json (env-specific)
  - appsettings.local.json (local overrides, gitignored)

Secrets: user-secrets (dotnet)

## Knowledge Graph Update
Added 3,892 relationships
Updated 127 patterns
Confidence range: 0.52 - 0.98
Average confidence: 0.78

Protection checks: PASSED
Validation: SUCCESS

## Recommendations
✅ BRAIN ready for intelligent routing
✅ File relationship data comprehensive
⚠️ Consider adding tests for 22 untested components
💡 High co-modification between UI and CSS suggests strong coupling
```

### Knowledge Graph Changes
```yaml
# Before crawler
file_relationships:
  host_control_panel:
    primary_file: "..."
    related_files: [...]  # 3 relationships

# After crawler
file_relationships:
  host_control_panel:
    primary_file: "SPA/NoorCanvas/Pages/HostControlPanel.razor"
    related_files:
      - path: "SPA/NoorCanvas/Services/ShareButtonInjectionService.cs"
        relationship: "service_injection"
        confidence: 0.95
        discovered_by: "ast_parsing"
      - path: "SPA/NoorCanvas/wwwroot/css/noor-canvas.css"
        relationship: "styling"
        confidence: 0.88
        discovered_by: "git_history"
      - path: "Components/Canvas/TranscriptCanvas.razor"
        relationship: "child_component"
        confidence: 0.92
        discovered_by: "component_hierarchy"
    # ... 12 more relationships discovered

architectural_patterns:  # NEW SECTION
  components:
    location: "Components/**/*.razor"
    naming: "PascalCase.razor"
    count: 89
  services:
    location: "Services/**/*Service.cs"
    naming: "PascalCaseService.cs"
    di_pattern: "Program.cs builder.Services.AddScoped<>"
    count: 34
  # ... more patterns

technology_stack:  # NEW SECTION
  backend:
    language: "C#"
    version: "12"
    framework: "ASP.NET Core 8.0"
  # ... more stack info

conventions:  # NEW SECTION
  file_naming:
    components: "PascalCase.razor"
    services: "PascalCaseService.cs"
  # ... more conventions
```

---

## 🛡️ Safety Features

### Skip Patterns (Performance & Security)
```yaml
# Always ignored by crawler
skip_directories:
  - "node_modules/"
  - "bin/"
  - "obj/"
  - ".git/"
  - "packages/"
  - "dist/"
  - "build/"
  
skip_files:
  - "*.dll"
  - "*.exe"
  - "*.min.js"  # Minified files
  - "*.min.css"
  - "*.map"
  - "package-lock.json"
  - "*.user"  # User-specific configs

skip_content:
  - Files > 1MB (too large)
  - Binary files
  - Generated files (*.g.cs, *.designer.cs)
```

### Incremental State Tracking
```yaml
# KDS/kds-brain/crawler-state.yaml
last_scan:
  timestamp: "2025-11-02T18:30:00Z"
  mode: "deep"
  files_scanned: 1247
  duration: "7m 32s"

file_hashes:
  "SPA/NoorCanvas/Pages/HostControlPanel.razor": "a3f5d8..."
  "Services/ShareButtonInjectionService.cs": "b7c2e1..."
  # ... (for incremental mode)

scan_history:
  - timestamp: "2025-11-02T18:30:00Z"
    mode: "deep"
    files: 1247
  - timestamp: "2025-11-01T14:15:00Z"
    mode: "quick"
    files: 1247
```

### Protection Integration
```powershell
# Crawler respects BRAIN protection rules

# Before updating knowledge graph:
.\KDS\scripts\protect-brain-update.ps1 -Mode validate

# If validation fails:
  → Rollback knowledge graph
  → Save crawler results to pending/
  → Notify user of validation failure
  → Recommend fixing protection issues first
```

---

## 🎯 Usage Examples

### Example 1: Initial Setup (New Project)
```markdown
Scenario: Just added KDS to a new project

Step 1: Run quick scan (get basic structure)
  PowerShell: .\KDS\scripts\brain-crawler.ps1 -Mode quick
  Duration: 30s
  Result: Basic architectural map

Step 2: Review crawler report
  File: KDS/kds-brain/crawler-report-{timestamp}.md
  Check: Technology stack detected correctly?

Step 3: Run deep scan (full analysis)
  PowerShell: .\KDS\scripts\brain-crawler.ps1 -Mode deep
  Duration: 7m
  Result: Complete knowledge graph

Step 4: Start using KDS
  #file:KDS/prompts/user/kds.md
  I want to add a share button
  
  → BRAIN already knows:
    - Where components go (Components/**/)
    - Naming convention (PascalCase.razor)
    - Service pattern (DI in Program.cs)
    - Test location (Tests/UI/**/)
```

### Example 2: Regular Maintenance (CI/CD)
```markdown
Scenario: Keep BRAIN updated with codebase changes

Add to CI/CD pipeline:
  - After each merge to main
  - Run: .\KDS\scripts\brain-crawler.ps1 -Mode incremental
  - Duration: 1-2m
  - Updates: Only changed files

Result: BRAIN always current with latest code
```

### Example 3: New Feature Area
```markdown
Scenario: Adding new "Reporting" module

Step 1: Create new directory
  mkdir Components/Reporting
  mkdir Services/Reporting

Step 2: Run targeted scan
  PowerShell: .\KDS\scripts\brain-crawler.ps1 -Mode targeted -Path "Components/Reporting/**,Services/Reporting/**"
  Duration: 30s
  Result: BRAIN learns new area structure

Step 3: Continue development
  #file:KDS/prompts/user/kds.md
  I want to add a PDF report generator
  
  → BRAIN knows reporting module structure
```

### Example 4: Migration Preparation
```markdown
Scenario: Moving to new project, want portable knowledge

Step 1: Deep scan current project
  PowerShell: .\KDS\scripts\brain-crawler.ps1 -Mode deep

Step 2: Export generic patterns
  PowerShell: .\KDS\scripts\brain-reset.ps1 -Mode export-reset -ExportPath ".\templates\aspnet-patterns\"
  Result: Generic patterns exported

Step 3: Copy to new project
  Copy-Item "KDS" "D:\NEW-PROJECT\KDS" -Recurse

Step 4: Scan new project
  cd D:\NEW-PROJECT
  .\KDS\scripts\brain-crawler.ps1 -Mode deep
  Result: BRAIN learns NEW project structure

Step 5: Optionally import patterns
  (If new project is similar, can import generic patterns)
```

---

## 🔄 Integration with KDS Agents

### Router Benefits
```markdown
# intent-router.md can now:

Query architectural context:
  #shared-module:brain-query.md
  query_type: architectural_pattern
  pattern: "where do components live?"
  
  → BRAIN: "Components/**/*.razor (89 files, 0.95 confidence)"

Suggest file locations:
  User: "I want to add a UserService"
  Router queries BRAIN: "where do services live?"
  BRAIN: "Services/*Service.cs (34 files, naming: PascalCaseService.cs)"
  Router: "Create Services/UserService.cs"
```

### Planner Benefits
```markdown
# work-planner.md can now:

Know typical feature scope:
  User: "Add export feature"
  Planner queries BRAIN: "typical files for export feature?"
  BRAIN: "Service (1 file), Component (1-2 files), Controller (1 file), Tests (2-3 files)"
  Planner: Creates realistic plan

Follow conventions:
  BRAIN knows: Tests use "session-212" for e2e
  Planner: Includes session-212 in test plan
```

### Executor Benefits
```markdown
# code-executor.md can now:

Suggest related files:
  Executor modifying: HostControlPanel.razor
  BRAIN: "Typically modified with noor-canvas.css (0.85 co-modification)"
  Executor: "Should we update CSS as well?"

Follow naming:
  User: "Create a PDF service"
  BRAIN: Services use "PascalCaseService.cs"
  Executor: Creates "PdfExportService.cs" (correct convention)
```

### Test Generator Benefits
```markdown
# test-generator.md can now:

Use correct framework:
  BRAIN: E2E tests use Playwright, session-212 data
  Test Generator: Creates *.spec.ts with session-212

Follow selectors:
  BRAIN: Tests use [data-testid] pattern
  Test Generator: Uses data-testid in selectors
```

---

## 📈 BRAIN Learning Synergy

### Crawler vs. Event Learning

**Crawler (Upfront Knowledge):**
- ✅ Architectural structure (where things are)
- ✅ Naming conventions (how things are named)
- ✅ Technology stack (what's in use)
- ✅ Static relationships (file dependencies)

**Event Learning (Runtime Knowledge):**
- ✅ Intent patterns (how users phrase requests)
- ✅ Workflow success (which sequences work)
- ✅ Common mistakes (correction history)
- ✅ Dynamic relationships (co-modification rates)

**Combined Power:**
```
Crawler: "Components go in Components/**/*.razor"
Events: "When user says 'add button', create in Components/"

Crawler: "Services use PascalCaseService.cs"
Events: "ShareButtonService was created after 'add share button' request"

Result: BRAIN knows WHERE and WHY!
```

---

## ✅ Best Practices

### When to Crawl

✅ **Run crawler:**
- Initial KDS setup (deep scan)
- After major refactoring (deep scan)
- In CI/CD after merges (incremental scan)
- Before starting large feature (quick scan to verify structure)
- After adding new module (targeted scan)

⏰ **Crawler frequency:**
- Initial: Deep scan once
- Development: Incremental daily (automated)
- Major changes: Deep scan manually
- New areas: Targeted scan as needed

### Crawler + Reset Workflow

**Scenario: Moving to new project**
```
Step 1: Deep scan old project
  → Captures full knowledge

Step 2: Export generic patterns
  → brain-reset.ps1 -Mode export-reset

Step 3: Copy KDS/ to new project
  → All KDS logic transferred

Step 4: BRAIN is clean (export-reset)
  → No old application data

Step 5: Deep scan new project
  → BRAIN learns new structure

Step 6: (Optional) Import generic patterns
  → Re-apply generalized learnings

Result: KDS knows NEW project + generic patterns from OLD
```

---

## 🎓 Advanced Features

### 1. Multi-Workspace Support
```powershell
# Scan multiple projects
.\KDS\scripts\brain-crawler.ps1 -Mode deep -Workspace "D:\PROJECT-A","D:\PROJECT-B"

# Result: Comparative analysis
knowledge_graph_comparative:
  project_a:
    technology: "React"
    component_count: 124
  project_b:
    technology: "Blazor"
    component_count: 89
```

### 2. Custom Crawl Rules
```yaml
# KDS/kds-brain/crawler-config.yaml
custom_patterns:
  - name: "legacy_components"
    path: "Legacy/**/*.js"
    skip: true
    reason: "Deprecated, don't learn"
    
  - name: "critical_services"
    path: "Services/Core/**"
    priority: "high"
    scan_depth: "deep"
    reason: "Core business logic"
```

### 3. Confidence Boosting
```yaml
# Crawler can boost confidence for certain patterns

# Example: Direct import detection
file_relationships:
  HostControlPanel.razor:
    imports:
      - "Services/ShareButtonInjectionService.cs"
        confidence: 0.98  # HIGH (direct observation)
        source: "ast_parsing"

# Example: Git history inference
    co_modified_with:
      - "wwwroot/css/noor-canvas.css"
        confidence: 0.72  # MEDIUM (statistical)
        source: "git_history"
        frequency: 15  # 15 co-modifications
```

### 4. Anomaly Reporting
```yaml
# Crawler detects unusual patterns

anomalies:
  - type: "naming_violation"
    file: "Components/mycomponent.razor"
    expected: "PascalCase.razor"
    actual: "lowercase"
    severity: "low"
    
  - type: "orphan_file"
    file: "Services/ObsoleteService.cs"
    reason: "No imports, no Git activity in 6 months"
    severity: "medium"
    suggest: "Consider removing"
```

---

## 🎯 Summary

**BRAIN Crawler = Google Bot for Your Codebase**

```
Scans entire application → Discovers patterns → Feeds BRAIN → Intelligent KDS
```

**Four modes:**
- ⚡ **QUICK:** 30s, basic structure
- 🔍 **DEEP:** 5-10m, full analysis
- 🔄 **INCREMENTAL:** 1-2m, changes only
- 🎯 **TARGETED:** Variable, specific area

**What it learns:**
- 🏗️ Architectural patterns (where things go)
- 🔗 File relationships (what connects to what)
- 🧪 Test patterns (how to test)
- 🛠️ Technology stack (what's in use)
- 📝 Naming conventions (how to name things)
- ⚙️ Configuration patterns (how settings work)

**Benefits:**
- 🚀 BRAIN educated BEFORE first request
- 🎯 Router knows file locations immediately
- 📊 Planner creates realistic plans
- ✅ Executor follows conventions automatically

**Safety:**
- ⏭️ Skips binary/large/generated files
- 🛡️ Respects protection rules
- 💾 Incremental state tracking
- ✅ Validation before BRAIN update

**Run once deeply, update incrementally, benefit forever!** 🕷️🧠
