# request-analyzer.md (Request Analysis & Complexity Estimation Algorithm)

---
purpose: Extract requirements from user request and estimate complexity for plan sizing
lastUpdated: 2025-10-27
---

## Purpose
Analyze user request to identify:
- Affected architectural layers (UI, API, Service, Database, SignalR)
- Feature type (new feature, bug fix, refactor, optimization)
- Phase count estimation (simple, moderate, complex)
- Test requirements (unit, integration, E2E, visual)
- Dependencies on other keys or external systems

## Algorithm

```
FUNCTION AnalyzeRequest(request, context)
  
  analysis = {
    affectedLayers: [],
    featureType: null,
    complexity: null,
    phaseEstimate: 0,
    testRequirements: [],
    dependencies: [],
    unknowns: []
  }
  
  // 1. Identify Affected Layers
  analysis.affectedLayers = DetectAffectedLayers(request)
  
  // 2. Determine Feature Type
  analysis.featureType = ClassifyFeatureType(request)
  
  // 3. Estimate Phase Count
  analysis.phaseEstimate = EstimatePhaseCount(analysis.affectedLayers, analysis.featureType, request)
  
  // 4. Calculate Complexity Score
  analysis.complexity = CalculateComplexity(analysis)
  
  // 5. Identify Test Requirements
  analysis.testRequirements = DetermineTestRequirements(analysis.affectedLayers, analysis.featureType)
  
  // 6. Detect Dependencies
  analysis.dependencies = DetectDependencies(request, context)
  
  // 7. Identify Unknowns/Ambiguities
  analysis.unknowns = IdentifyUnknowns(request, analysis)
  
  RETURN analysis
END FUNCTION

FUNCTION DetectAffectedLayers(request)
  layers = []
  
  // UI Layer Detection
  uiKeywords = ["razor", "component", "blazor", "page", "button", "ui", "view", "css", "html", "javascript", "layout", "style"]
  IF ContainsAny(request, uiKeywords) THEN
    layers.add("UI")
  END IF
  
  // API Layer Detection
  apiKeywords = ["controller", "endpoint", "api", "route", "http", "rest", "request", "response"]
  IF ContainsAny(request, apiKeywords) THEN
    layers.add("API")
  END IF
  
  // Service Layer Detection
  serviceKeywords = ["service", "business logic", "provider", "repository", "processor"]
  IF ContainsAny(request, serviceKeywords) THEN
    layers.add("Service")
  END IF
  
  // Database Layer Detection
  dbKeywords = ["database", "sql", "table", "schema", "migration", "entity", "dbcontext", "query"]
  IF ContainsAny(request, dbKeywords) THEN
    layers.add("Database")
  END IF
  
  // SignalR Layer Detection
  signalrKeywords = ["signalr", "hub", "broadcast", "real-time", "websocket", "connection"]
  IF ContainsAny(request, signalrKeywords) THEN
    layers.add("SignalR")
  END IF
  
  RETURN layers
END FUNCTION

FUNCTION ClassifyFeatureType(request)
  // Priority order (most specific first)
  
  IF ContainsAny(request, ["fix bug", "bug", "error", "broken", "not working", "issue"]) THEN
    RETURN "bug-fix"
  END IF
  
  IF ContainsAny(request, ["refactor", "reorganize", "cleanup", "simplify", "consolidate"]) THEN
    RETURN "refactor"
  END IF
  
  IF ContainsAny(request, ["optimize", "performance", "speed up", "improve", "enhance"]) THEN
    RETURN "optimization"
  END IF
  
  IF ContainsAny(request, ["migrate", "upgrade", "convert", "move to"]) THEN
    RETURN "migration"
  END IF
  
  IF ContainsAny(request, ["add", "create", "new", "implement", "build"]) THEN
    RETURN "new-feature"
  END IF
  
  RETURN "modification"  // Default
END FUNCTION

FUNCTION EstimatePhaseCount(layers, featureType, request)
  phaseCount = 0
  
  // Base phases by feature type
  phaseCountByType = {
    "bug-fix": 2,           // 1. Investigation, 2. Fix + Test
    "refactor": 2,          // 1. Analysis, 2. Refactor + Verify
    "optimization": 3,      // 1. Baseline, 2. Optimize, 3. Benchmark
    "migration": 4,         // 1. Analysis, 2. Migration, 3. Validation, 4. Cleanup
    "new-feature": 3,       // 1. Implementation, 2. Integration, 3. Testing
    "modification": 2       // 1. Modify, 2. Test
  }
  
  phaseCount = phaseCountByType[featureType]
  
  // Add phases based on layer count
  IF layers.length > 2 THEN
    phaseCount += 1  // Additional integration phase
  END IF
  
  // Database work adds migration phase
  IF layers.contains("Database") THEN
    phaseCount += 1
  END IF
  
  // SignalR work adds broadcast testing phase
  IF layers.contains("SignalR") THEN
    phaseCount += 1
  END IF
  
  // Architectural changes add design phase
  IF ContainsAny(request, ["architecture", "redesign", "restructure"]) THEN
    phaseCount += 1
  END IF
  
  RETURN phaseCount
END FUNCTION

FUNCTION CalculateComplexity(analysis)
  score = 0
  
  // Multi-layer changes (+3 per layer beyond first)
  IF analysis.affectedLayers.length > 1 THEN
    score += (analysis.affectedLayers.length - 1) * 3
  END IF
  
  // Architectural changes (+5)
  IF analysis.dependencies.contains("architectural-change") THEN
    score += 5
  END IF
  
  // Multiple files/components (+2 if >3)
  fileReferences = CountFileReferences(analysis.request)
  IF fileReferences > 3 THEN
    score += 2
  END IF
  
  // Feature type scoring
  featureTypeScores = {
    "new-feature": 3,
    "migration": 4,
    "refactor": 2,
    "optimization": 2,
    "bug-fix": 1,
    "modification": 1
  }
  score += featureTypeScores[analysis.featureType]
  
  // Test requirements (+2 if testing needed)
  IF analysis.testRequirements.length > 0 THEN
    score += 2
  END IF
  
  // Complexity classification
  IF score <= 4 THEN
    RETURN { level: "simple", score: score, phases: "1-2" }
  ELSE IF score <= 10 THEN
    RETURN { level: "moderate", score: score, phases: "3-4" }
  ELSE
    RETURN { level: "complex", score: score, phases: "5+" }
  END IF
END FUNCTION

FUNCTION DetermineTestRequirements(layers, featureType)
  requirements = []
  
  // UI changes require E2E and visual tests
  IF layers.contains("UI") THEN
    requirements.add("e2e")
    requirements.add("visual-regression")
  END IF
  
  // API changes require integration tests
  IF layers.contains("API") THEN
    requirements.add("integration")
  END IF
  
  // Service layer requires unit tests
  IF layers.contains("Service") THEN
    requirements.add("unit")
  END IF
  
  // Database changes require data validation tests
  IF layers.contains("Database") THEN
    requirements.add("data-validation")
  END IF
  
  // SignalR requires real-time broadcast tests
  IF layers.contains("SignalR") THEN
    requirements.add("e2e")  // E2E required for SignalR validation
    requirements.add("broadcast-verification")
  END IF
  
  RETURN requirements
END FUNCTION

FUNCTION DetectDependencies(request, context)
  dependencies = []
  
  // Related keys from context
  IF context.activeKeys != null THEN
    FOR EACH key IN context.activeKeys
      IF request.contains(key.name) OR request.contains(key.relatedTerms) THEN
        dependencies.add("related-key: " + key.name)
      END IF
    END FOR
  END IF
  
  // External system dependencies
  externalSystems = ["zoom", "azure", "cloudflare", "cdn", "database", "signalr"]
  FOR EACH system IN externalSystems
    IF request.toLowerCase().contains(system) THEN
      dependencies.add("external-system: " + system)
    END IF
  END FOR
  
  // Architectural dependencies
  IF ContainsAny(request, ["architecture", "infrastructure", "redesign"]) THEN
    dependencies.add("architectural-change")
  END IF
  
  RETURN dependencies
END FUNCTION

FUNCTION IdentifyUnknowns(request, analysis)
  unknowns = []
  
  // Vague requirements
  vagueTerms = ["somehow", "maybe", "might need", "possibly", "could be", "not sure"]
  FOR EACH term IN vagueTerms
    IF request.contains(term) THEN
      unknowns.add("Vague requirement: " + term)
    END IF
  END FOR
  
  // Missing UX details for UI work
  IF analysis.affectedLayers.contains("UI") AND NOT ContainsAny(request, ["button", "layout", "style", "placement"]) THEN
    unknowns.add("UI implementation details not specified")
  END IF
  
  // Missing API contract for API work
  IF analysis.affectedLayers.contains("API") AND NOT ContainsAny(request, ["endpoint", "response", "request", "route"]) THEN
    unknowns.add("API contract not specified")
  END IF
  
  // Missing schema details for database work
  IF analysis.affectedLayers.contains("Database") AND NOT ContainsAny(request, ["table", "column", "schema", "type"]) THEN
    unknowns.add("Database schema details not specified")
  END IF
  
  RETURN unknowns
END FUNCTION
```

## Output Format

**Concise (for chat - MAX 5 bullets):**
```markdown
🔍 Request Analysis
- Layers: UI, API, Database (3 layers)
- Type: new-feature
- Complexity: moderate (score: 8, est. 3-4 phases)
- Tests: E2E, integration, visual-regression
- Dependencies: external-system:signalr, related-key:session-management
```

**Detailed (for plan file):**
```markdown
## Request Analysis Summary

### Affected Layers (3)
- **UI** - SessionCanvas.razor component modifications
- **API** - New AssetController endpoint for asset lookup
- **Database** - canvas.AssetLookup table query

### Feature Type
**new-feature** - Implementing share button functionality for table assets

### Complexity Assessment
- **Level:** Moderate
- **Score:** 8/15
- **Estimated Phases:** 3-4

**Scoring Breakdown:**
- Multi-layer (3 layers): +6 points
- New feature: +3 points
- Test requirements: +2 points

### Test Requirements
1. **E2E Tests** - Playwright test for share button click → broadcast → receive
2. **Integration Tests** - API endpoint validation
3. **Visual Regression** - Percy snapshot of share button placement

### Dependencies Detected
- **External System:** SignalR (broadcast functionality)
- **Related Key:** session-management (shares session context)

### Unknowns/Ambiguities (2)
1. UI implementation details not specified (button placement, styling)
2. Vague requirement: "somehow" (needs clarification on extraction logic)
```

## Integration Points

**Called by:**
- `plan.prompt.md` (Step 2) - Analyzes request before plan generation
- `build.prompt.md` (Step 3) - Complexity assessment for routing decisions

**Outputs:**
- Complexity score used to determine questionnaire necessity
- Affected layers guide context loading (context-loader.md)
- Test requirements feed into test strategy generation
- Phase estimate sets plan scope expectations

## Complexity Thresholds

| Score | Level | Phases | Questionnaire | Approval |
|-------|-------|--------|---------------|----------|
| 0-4 | Simple | 1-2 | Skip | Auto-approved |
| 5-10 | Moderate | 3-4 | Optional | User review |
| 11+ | Complex | 5+ | Required | User approval + review |

## See Also
- `.github/prompts/shared/context-loader.md` - Uses affected layers to load appropriate docs
- `.github/prompts/plan.prompt.md` - Consumes this algorithm in Step 2
- `.github/prompts/shared/phase-breakdown-patterns.md` - Uses phase estimate for plan structure
- `.github/prompts/test-generation.prompt.md` - Uses test requirements for scenario generation
