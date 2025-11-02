# KDS Context Brain - Sensor Outputs

**Purpose:** Auto-discovered application context from code analysis sensors.

**Version:** 5.0.0-MVP  
**Created:** 2025-11-02

---

## 📋 Overview

This directory contains **auto-generated** JSON files produced by KDS context sensors. These files are the foundation of the **Knowledge Graph** that powers KDS's contextual intelligence.

### What Lives Here

```
.github/context/
├── routes.json              ← API endpoints (from Route Sensor)
├── database.json            ← DB schema & connections (from Database Sensor) [COMING SOON]
├── ui-components.json       ← UI components & test IDs (from UI Sensor) [COMING SOON]
├── environment.json         ← Environment configs (from Environment Sensor) [COMING SOON]
├── dependencies.json        ← Tooling & frameworks (from Dependency Sensor) [COMING SOON]
├── knowledge-graph.json     ← Unified graph of all relationships [COMING SOON]
└── *.json.schema            ← JSON schemas for validation
```

---

## 🔍 Current Sensors

### 1. Route Sensor ✅ IMPLEMENTED

**Script:** `.github/scripts/sensors/scan-routes.ps1`

**Scans:** `SPA/NoorCanvas/Controllers/**/*.cs`

**Extracts:**
- API route patterns (`/api/Canvas/Save`)
- HTTP methods (GET, POST, PUT, DELETE)
- Controller/action mappings
- Method parameters
- Authentication requirements (`[Authorize]`)

**Output:** `routes.json`

**Schema:** `routes.json.schema`

**Example:**
```json
{
  "last_scan": "2025-11-02T13:00:00Z",
  "total_routes": 74,
  "routes": [
    {
      "pattern": "/api/Canvas/Save",
      "method": "POST",
      "controller": "CanvasController",
      "action": "Save",
      "parameters": [
        {"name": "dto", "type": "CanvasDto", "fromBody": true}
      ],
      "auth_required": true,
      "file": "SPA/NoorCanvas/Controllers/CanvasController.cs",
      "line": 145,
      "confidence": 1.0
    }
  ]
}
```

**When It Runs:**
- Before every KDS task (incremental scan)
- Via orchestrator: `.github/scripts/sensors/run-all-sensors.ps1`
- Manual: `.github/scripts/sensors/scan-routes.ps1 -Mode Full`

---

### 2. Database Sensor ✅ IMPLEMENTED (Week 2)

**Script:** `.github/scripts/sensors/scan-database.ps1`

**Scans:** 
- `**/*DbContext.cs` (Entity Framework DbContext files)
- `**/appsettings*.json` (Connection strings)

**Extracts:**
- Database tables (from `DbSet<T>` properties)
- Table relationships (navigation properties)
- Connection strings (by environment)
- Database names and servers
- DbContext class names

**Output:** `database.json`

**Schema:** `database.json.schema`

**Example:**
```json
{
  "last_scan": "2025-11-02T15:00:00Z",
  "total_connections": 3,
  "total_tables": 23,
  "connections": {
    "DefaultConnection": {
      "server": "localhost",
      "database": "NoorCanvas_Dev",
      "environments": ["development"],
      "source_file": "appsettings.Development.json",
      "confidence": 1.0
    }
  },
  "tables": [
    {
      "name": "CanvasSessions",
      "dbset": "CanvasSessions",
      "context": "ApplicationDbContext",
      "file": "SPA/NoorCanvas/Data/ApplicationDbContext.cs",
      "relationships": [
        {
          "type": "one-to-many",
          "target": "Participants",
          "property": "Participants"
        }
      ],
      "confidence": 1.0
    }
  ]
}
```

**When It Runs:**
- Via orchestrator: `.github/scripts/sensors/run-all-sensors.ps1`
- Manual: `.github/scripts/sensors/scan-database.ps1 -Mode Full`

---

### 3. UI Component Sensor ✅ IMPLEMENTED (Week 2)

**Script:** `.github/scripts/sensors/scan-ui.ps1`

**Scans:** `**/*.razor` (Blazor components)

**Extracts:**
- Component names
- Page routes (`@page` directive)
- Route parameters (from route patterns)
- `data-testid` attributes (Rule #15 compliance)
- Child component references
- API calls (HttpClient usage)

**Output:** `ui-components.json`

**Schema:** `ui-components.json.schema`

**Example:**
```json
{
  "last_scan": "2025-11-02T15:00:00Z",
  "total_components": 45,
  "total_pages": 20,
  "total_test_ids": 8,
  "components": [
    {
      "name": "HostControlPanelContent",
      "file": "SPA/NoorCanvas/Components/HostControlPanelContent.razor",
      "route": null,
      "test_ids": [
        "fab-share-button",
        "fab-delete-button",
        "qa-toggle-button"
      ],
      "children": ["ShareModal", "DeleteConfirmDialog"],
      "api_calls": [
        "POST /api/Canvas/Share",
        "DELETE /api/Canvas/{id}"
      ],
      "confidence": 1.0
    }
  ],
  "pages": [
    {
      "route": "/canvas/{sessionId:int}",
      "component": "CanvasPage",
      "file": "SPA/NoorCanvas/Pages/CanvasPage.razor",
      "parameters": [
        {"name": "sessionId", "type": "int"}
      ],
      "test_ids": ["canvas-container"],
      "confidence": 1.0
    }
  ]
}
```

**When It Runs:**
- Via orchestrator: `.github/scripts/sensors/run-all-sensors.ps1`
- Manual: `.github/scripts/sensors/scan-ui.ps1 -Mode Full`

---

## 🚀 How Sensors Work

### Scan Modes

#### Full Scan
```powershell
# Scans ALL controller files
.github/scripts/sensors/scan-routes.ps1 -Mode Full
```

#### Incremental Scan (Default)
```powershell
# Only scans files modified since last scan
.github/scripts/sensors/scan-routes.ps1 -Mode Incremental
```

### Incremental Scanning Logic

1. Read `last_scan` timestamp from existing `routes.json`
2. Compare against file modification times
3. Only parse changed files
4. Merge with existing routes (remove stale entries)
5. Update `last_scan` timestamp

**Performance:**
- Full scan: ~2-5 seconds (for 20 controllers)
- Incremental: ~200-500ms (for 1-2 changed files)

---

## 📊 Context Activation (Contextual Loading)

**Problem:** Loading ALL context for EVERY task causes token overflow.

**Solution:** Contextual Activation - load only relevant nodes.

### How It Works

```yaml
User Request: "I want to add a save button"
  ↓
Extract Keywords: [save, button, canvas]
  ↓
Query routes.json: Find routes matching "save" OR "canvas"
  ↓
Results:
  - POST /api/Canvas/Save (confidence: 1.0)
  - GET /api/Canvas/Load (confidence: 1.0)
  ↓
Load Top 10 Relevant Routes
  ↓
Provide to Work Planner with context:
  "Existing route: POST /api/Canvas/Save (CanvasController.Save)"
```

---

## 🧠 Confidence Scoring

Every knowledge item has a **confidence score** (0.0 to 1.0):

### Route Sensor Confidence

| Source | Confidence |
|--------|-----------|
| Code analysis (attribute parsing) | **1.0** |
| Regex-based extraction | **0.9** |
| Inferred from naming convention | **0.7** |

**Why always 1.0 for code analysis?**
- Routes are extracted from actual C# code
- No guesswork, no inference
- If the code says `[Route("/api/Canvas/Save")]`, it's 100% certain

**Confidence CHANGES in future phases:**
- When patterns SUCCEED → no change (already 1.0)
- When patterns FAIL → investigate why (code out of sync?)

---

## 🔄 Integration with KDS

### Before Every Task

```yaml
User: #file:.github/prompts/user/kds.md I want to add a feature

KDS Workflow:
  1. Intent Router → Detects PLAN intent
  2. Context Brain → Runs sensors (incremental scan)
  3. Context Brain → Activates relevant knowledge
  4. Work Planner → Creates plan WITH context
  5. Code Executor → Implements using known patterns
```

### Context Brain Agent

**Location:** `.github/prompts/internal/context-brain.md` [COMING SOON]

**Responsibilities:**
1. Run sensors (incremental by default)
2. Query context files (routes.json, database.json, etc.)
3. Activate relevant nodes (keyword matching)
4. Load top 10 most relevant items
5. Provide context to calling agent (planner, executor)

---

## ✅ Validation

### Schema Validation

Every sensor output MUST conform to its JSON schema:

```powershell
# Validate routes.json against schema
Test-Json -Path .github/context/routes.json -SchemaFile .github/context/routes.json.schema
```

### Health Checks

Run health check to verify sensor outputs:

```powershell
.github/scripts/validation/validate-context.ps1
```

**Checks:**
- ✅ routes.json exists and is valid JSON
- ✅ last_scan timestamp is recent (<7 days old)
- ✅ total_routes > 0
- ✅ All required fields present
- ✅ No duplicate routes

---

## 📚 File Metadata

### routes.json ✅

**Generated By:** `.github/scripts/sensors/scan-routes.ps1`  
**Schema:** `routes.json.schema`  
**Frequency:** Incremental (every task), Full (via orchestrator)  
**Size:** ~50KB (74 routes discovered)  
**Confidence:** Always 1.0 (code analysis)

### database.json ✅ (Week 2)

**Generated By:** `.github/scripts/sensors/scan-database.ps1`  
**Schema:** `database.json.schema`  
**Frequency:** Via orchestrator or manual  
**Size:** ~15KB (23 tables, 3 connections discovered)  
**Confidence:** Always 1.0 (code analysis)

### ui-components.json ✅ (Week 2)

**Generated By:** `.github/scripts/sensors/scan-ui.ps1`  
**Schema:** `ui-components.json.schema`  
**Frequency:** Via orchestrator or manual  
**Size:** ~25KB (45 components, 20 pages, 8 test IDs discovered)  
**Confidence:** Always 1.0 (code analysis)

### Future Files

**environment.json** [Week 2 - PLANNED]
- Generated by: `.github/scripts/sensors/scan-environment.ps1`
- Scans: `appsettings*.json`, `.env` files, environment variables
- Extracts: Current environment, environment-specific configs

**dependencies.json** [Week 2 - PLANNED]
- Generated by: `.github/scripts/sensors/scan-dependencies.ps1`
- Scans: `package.json`, `*.csproj`
- Extracts: Test frameworks, quality tools, versions

**knowledge-graph.json** [Week 3 - PLANNED]
- Generated by: `.github/scripts/sensors/build-graph.ps1`
- Input: routes.json, database.json, ui-components.json
- Output: Unified graph with relationships

---

## 🎯 Design Principles (Rule #18 Compliant)

### Local-First
- ✅ All sensor outputs stored locally (no cloud services)
- ✅ Git-trackable (version control)
- ✅ Human-readable JSON

### Zero External Dependencies
- ✅ Sensors use PowerShell (built into Windows)
- ✅ C# parsing uses regex (no AST libraries)
- ✅ JSON generation uses ConvertTo-Json (PowerShell built-in)

### Performance Optimized
- ✅ Incremental scanning (only changed files)
- ✅ Cached results (avoid re-parsing)
- ✅ Parallel file scanning (future enhancement)

---

## 🧪 Testing Sensors

### Unit Tests

```powershell
# Test route sensor
.github/scripts/sensors/test-scan-routes.ps1

# Expected output:
✅ Scanned 20 controller files
✅ Found 27 routes
✅ routes.json valid JSON
✅ Schema validation passed
✅ Incremental scan performance: 320ms
```

### Integration Tests

```powershell
# Run all sensors and validate knowledge graph
.github/scripts/sensors/test-all-sensors.ps1
```

---

## 📖 Next Steps

### Week 1 (Completed)
- ✅ Route Sensor implemented
- ✅ Testing and validation complete

### Week 2 (Completed)
- ✅ Database Sensor implemented
- ✅ UI Component Sensor implemented
- ✅ Sensor orchestrator created
- ✅ Testing and validation complete

### Week 3 (Next)
- ⏳ Context Brain agent
- ⏳ Integration with work-planner.md
- ⏳ Contextual activation algorithm
- ⏳ Knowledge Graph builder

---

## 🔗 Related Documentation

- [KDS Brain Design](.github/prompts/user/kds.design) - Full architecture
- [KDS Design Principles](.github/KDS-DESIGN.md) - v4.3.0
- [Governance Rules](.github/governance/rules.md) - Rule #18

---

**Status:** ✅ Week 2 Complete (Database & UI Sensors)  
**Last Updated:** 2025-11-02  
**Next Phase:** Week 3 - Context Brain Agent & Knowledge Graph
