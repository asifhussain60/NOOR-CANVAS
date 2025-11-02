# KDS Context Brain - Sensor Outputs

**Purpose:** Auto-discovered application context from code analysis sensors.

**Version:** 5.0.0-MVP  
**Created:** 2025-11-02

---

## 📋 Overview

This directory contains **auto-generated** JSON files produced by KDS context sensors. These files are the foundation of the **Knowledge Graph** that powers KDS's contextual intelligence.

### What Lives Here

```
KDS/context/
├── routes.json              ← API endpoints (from Route Sensor) ✅
├── database.json            ← DB schema & connections (from Database Sensor) ✅
├── ui-components.json       ← UI components & test IDs (from UI Sensor) ✅
├── knowledge-graph.json     ← Unified graph of all relationships ✅ (Week 3)
├── environment.json         ← Environment configs (from Environment Sensor) [COMING SOON]
├── dependencies.json        ← Tooling & frameworks (from Dependency Sensor) [COMING SOON]
└── *.json.schema            ← JSON schemas for validation
```

---

## 🔍 Current Sensors

### 1. Route Sensor ✅ IMPLEMENTED

**Script:** `KDS/scripts/sensors/scan-routes.ps1`

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
- Via orchestrator: `KDS/scripts/sensors/run-all-sensors.ps1`
- Manual: `KDS/scripts/sensors/scan-routes.ps1 -Mode Full`

---

### 2. Database Sensor ✅ IMPLEMENTED (Week 2)

**Script:** `KDS/scripts/sensors/scan-database.ps1`

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
- Via orchestrator: `KDS/scripts/sensors/run-all-sensors.ps1`
- Manual: `KDS/scripts/sensors/scan-database.ps1 -Mode Full`

---

### 3. UI Component Sensor ✅ IMPLEMENTED (Week 2)

**Script:** `KDS/scripts/sensors/scan-ui.ps1`

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
- Via orchestrator: `KDS/scripts/sensors/run-all-sensors.ps1`
- Manual: `KDS/scripts/sensors/scan-ui.ps1 -Mode Full`

---

### 4. Knowledge Graph Builder ✅ IMPLEMENTED (Week 3)

**Script:** `KDS/scripts/sensors/build-knowledge-graph.ps1`

**Inputs:** 
- `routes.json` (API endpoints)
- `database.json` (Database tables)
- `ui-components.json` (UI components)

**Builds:**
- **Nodes:** All entities (UI components, API endpoints, controllers, database tables)
- **Edges:** Relationships between nodes (CALLS, USES, QUERIES, RELATES_TO)
- **Confidence Scores:** Reliability of each node and relationship
- **Metadata:** Evidence, verification counts, usage statistics

**Output:** `knowledge-graph.json`

**Schema:** `knowledge-graph.json.schema`

**Example:**
```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-11-02T16:00:00Z",
  "metadata": {
    "totalNodes": 93,
    "totalEdges": 30,
    "averageConfidence": 0.92,
    "nodesByType": {
      "UI_COMPONENT": 45,
      "DATABASE_TABLE": 23,
      "CONTROLLER": 15,
      "API_ENDPOINT": 9,
      "UI_PAGE": 1
    },
    "edgesByType": {
      "USES": 30
    }
  },
  "nodes": [
    {
      "id": "api_endpoint-post-api-canvas-save",
      "type": "API_ENDPOINT",
      "name": "POST /api/Canvas/Save",
      "confidence": 0.9,
      "metadata": {
        "file": "SPA/NoorCanvas/Controllers/CanvasController.cs",
        "line": 145,
        "source": "code_analysis",
        "verifiedCount": 1,
        "controller": "CanvasController",
        "action": "Save"
      }
    }
  ],
  "edges": [
    {
      "id": "api_endpoint-post-api-canvas-save--uses-->controller-canvascontroller",
      "from": "api_endpoint-post-api-canvas-save",
      "to": "controller-canvascontroller",
      "type": "USES",
      "confidence": 0.9,
      "metadata": {
        "evidence": "Endpoint POST /api/Canvas/Save is handled by CanvasController.Save",
        "source": "code_analysis",
        "verifiedCount": 1
      }
    }
  ]
}
```

**Query Functions:** `KDS/scripts/sensors/query-knowledge-graph.ps1`

Available functions:
- `Get-KnowledgeGraph` - Load graph from file
- `Find-Node` - Search nodes by name/type/confidence
- `Find-RelatedNodes` - Get connected nodes (with hop distance)
- `Get-NodePath` - Trace path between two nodes
- `Filter-ByConfidence` - Filter by confidence threshold
- `Export-GraphSummary` - Generate markdown summary
- `Show-GraphStats` - Display statistics

**Usage Example:**
```powershell
# Load graph
. KDS/scripts/sensors/query-knowledge-graph.ps1
$graph = Get-KnowledgeGraph

# Find all Canvas-related nodes
Find-Node -Graph $graph -Name "Canvas" -MinConfidence 0.8

# Find what calls a specific API
Find-RelatedNodes -Graph $graph -NodeId "api_endpoint-post-api-canvas-save" -Direction incoming

# Trace path from UI to Database
Get-NodePath -Graph $graph -FromNodeId "ui_component-sharebutton" -ToNodeId "database_table-canvassessions"
```

**When It Runs:**
- Via orchestrator: `KDS/scripts/sensors/run-all-sensors.ps1` (after all sensors)
- Manual: `KDS/scripts/sensors/build-knowledge-graph.ps1 -Mode Full`
- Incremental: `KDS/scripts/sensors/build-knowledge-graph.ps1 -Incremental`

---

## 🚀 How Sensors Work

### Scan Modes

#### Full Scan
```powershell
# Scans ALL controller files
KDS/scripts/sensors/scan-routes.ps1 -Mode Full
```

#### Incremental Scan (Default)
```powershell
# Only scans files modified since last scan
KDS/scripts/sensors/scan-routes.ps1 -Mode Incremental
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
User: #file:KDS/prompts/user/kds.md I want to add a feature

KDS Workflow:
  1. Intent Router → Detects PLAN intent
  2. Context Brain → Runs sensors (incremental scan)
  3. Context Brain → Activates relevant knowledge
  4. Work Planner → Creates plan WITH context
  5. Code Executor → Implements using known patterns
```

### Context Brain Agent

**Location:** `KDS/prompts/internal/context-brain.md` [COMING SOON]

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
Test-Json -Path KDS/context/routes.json -SchemaFile KDS/context/routes.json.schema
```

### Health Checks

Run health check to verify sensor outputs:

```powershell
KDS/scripts/validation/validate-context.ps1
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

**Generated By:** `KDS/scripts/sensors/scan-routes.ps1`  
**Schema:** `routes.json.schema`  
**Frequency:** Incremental (every task), Full (via orchestrator)  
**Size:** ~50KB (74 routes discovered)  
**Confidence:** Always 1.0 (code analysis)

### database.json ✅ (Week 2)

**Generated By:** `KDS/scripts/sensors/scan-database.ps1`  
**Schema:** `database.json.schema`  
**Frequency:** Via orchestrator or manual  
**Size:** ~15KB (23 tables, 3 connections discovered)  
**Confidence:** Always 1.0 (code analysis)

### ui-components.json ✅ (Week 2)

**Generated By:** `KDS/scripts/sensors/scan-ui.ps1`  
**Schema:** `ui-components.json.schema`  
**Frequency:** Via orchestrator or manual  
**Size:** ~25KB (45 components, 20 pages, 8 test IDs discovered)  
**Confidence:** Always 1.0 (code analysis)

### knowledge-graph.json ✅ (Week 3)

**Generated By:** `KDS/scripts/sensors/build-knowledge-graph.ps1`  
**Schema:** `knowledge-graph.json.schema`  
**Frequency:** After sensor orchestrator completes  
**Size:** ~150KB (93 nodes, 30 edges discovered)  
**Confidence:** Varies by source (0.6-1.0)

### Future Files

**environment.json** [Week 2 - PLANNED]
- Generated by: `KDS/scripts/sensors/scan-environment.ps1`
- Scans: `appsettings*.json`, `.env` files, environment variables
- Extracts: Current environment, environment-specific configs

**dependencies.json** [Week 2 - PLANNED]
- Generated by: `KDS/scripts/sensors/scan-dependencies.ps1`
- Scans: `package.json`, `*.csproj`
- Extracts: Test frameworks, quality tools, versions

**knowledge-graph.json** [Week 3 - PLANNED]
- Generated by: `KDS/scripts/sensors/build-graph.ps1`
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
KDS/scripts/sensors/test-scan-routes.ps1

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
KDS/scripts/sensors/test-all-sensors.ps1
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

### Week 3 (Completed)
- ✅ Knowledge Graph Builder implemented
- ✅ Graph query functions created
- ✅ Integration with sensor orchestrator complete
- ✅ Confidence scoring added to graph nodes/edges
- ✅ Testing and validation complete

### Week 4 (Completed ✅)
- ✅ Context Brain agent created
- ✅ Contextual activation script implemented
- ✅ Integration with work-planner.md complete
- ✅ Integration with code-executor.md complete
- ✅ File confusion warnings operational
- ✅ Pattern suggestion system working

### Week 5 (Next)
- ⏳ Learning engine (reinforcement learning)
- ⏳ Post-task feedback loop
- ⏳ Pattern success/failure tracking
- ⏳ Knowledge pruning based on confidence

---

## 🔗 Related Documentation

- [KDS Brain Design](KDS/prompts/user/kds.design) - Full architecture
- [KDS Design Principles](KDS/KDS-DESIGN.md) - v4.3.0
- [Governance Rules](KDS/governance/rules.md) - Rule #18

---

**Status:** ✅ Week 3 Complete (Knowledge Graph Builder)  
**Last Updated:** 2025-11-02  
**Next Phase:** Week 4 - Context Brain Agent & Contextual Activation
