# context-loader.md (Required Reading & Context Loading Algorithm)

---
purpose: Load architectural context before planning to ensure infrastructure compliance and prevent duplication
lastUpdated: 2025-10-27
---

## Purpose
Systematically load required architectural documentation before generating plans to ensure:
- Infrastructure patterns are followed (database, API, SignalR, CDN)
- Existing implementations are not duplicated
- Testing conventions are applied correctly
- Related work is identified and referenced

## Algorithm

```
FUNCTION LoadRequiredContext(request, workType)
  
  context = {
    architecture: null,
    infrastructure: null,
    testing: null,
    activeKeys: null,
    optional: []
  }
  
  // ALWAYS load these files (MANDATORY)
  context.architecture = ReadFile("Docs/Architecture.md")
  context.infrastructure = ReadFile("Docs/InfrastructureQuickRef.md")
  context.activeKeys = ReadFile(".github/key-data-streams/index.md")
  
  // Detect work characteristics to load optional context
  characteristics = AnalyzeWorkCharacteristics(request)
  
  // UI/API work requires testing framework knowledge
  IF characteristics.affectsUI OR characteristics.affectsAPI THEN
    context.testing = ReadFile("Docs/TESTING_FRAMEWORK_V2_SUMMARY.md")
  END IF
  
  // Zoom-related work
  IF request.contains("zoom") OR request.contains("meeting") OR request.contains("video") THEN
    context.optional.add(ReadFile("Docs/ZOOM-INTEGRATION-DOCUMENTATION.md"))
  END IF
  
  // UI changes require visual regression understanding
  IF characteristics.affectsUI OR request.contains("visual") OR request.contains("percy") THEN
    context.optional.add(ReadFile("Docs/VISUAL_REGRESSION_TESTING.md"))
  END IF
  
  // Logging changes
  IF request.contains("logging") OR request.contains("log") OR request.contains("trace") THEN
    context.optional.add(ReadFile("Docs/LOGGING-ENHANCEMENT-SUMMARY.md"))
  END IF
  
  // CDN/media work
  IF request.contains("cdn") OR request.contains("media") OR request.contains("image") OR request.contains("resource") THEN
    context.optional.add(ReadFile(".github/instructions/CDN-Architecture.md"))
  END IF
  
  // Cloudflare/networking work
  IF request.contains("cloudflare") OR request.contains("tunnel") OR request.contains("network") OR request.contains("cors") THEN
    context.optional.add(ReadFile(".github/instructions/Cloudflare-Configuration.md"))
  END IF
  
  // Database schema work requires infrastructure details
  IF characteristics.affectsDatabase THEN
    // InfrastructureQuickRef.md already loaded - contains connection strings
    // Verify schema access rules from SelfAwareness.instructions.md
    context.optional.add(ReadFile(".github/instructions/SelfAwareness.instructions.md", section: "Database Access Rules"))
  END IF
  
  RETURN context
END FUNCTION

FUNCTION AnalyzeWorkCharacteristics(request)
  characteristics = {
    affectsUI: false,
    affectsAPI: false,
    affectsDatabase: false,
    affectsSignalR: false,
    affectsServices: false
  }
  
  // UI indicators
  uiKeywords = ["razor", "component", "blazor", "ui", "button", "page", "view", "css", "style", "layout"]
  characteristics.affectsUI = ContainsAny(request, uiKeywords)
  
  // API indicators
  apiKeywords = ["controller", "endpoint", "api", "route", "http", "request", "response"]
  characteristics.affectsAPI = ContainsAny(request, apiKeywords)
  
  // Database indicators
  dbKeywords = ["database", "sql", "table", "schema", "migration", "entity", "dbcontext"]
  characteristics.affectsDatabase = ContainsAny(request, dbKeywords)
  
  // SignalR indicators
  signalrKeywords = ["signalr", "hub", "broadcast", "connection", "real-time", "websocket"]
  characteristics.affectsSignalR = ContainsAny(request, signalrKeywords)
  
  // Service layer indicators
  serviceKeywords = ["service", "business logic", "repository", "provider"]
  characteristics.affectsServices = ContainsAny(request, serviceKeywords)
  
  RETURN characteristics
END FUNCTION

FUNCTION ContainsAny(text, keywords)
  lowerText = text.toLowerCase()
  FOR EACH keyword IN keywords
    IF lowerText.contains(keyword) THEN
      RETURN true
    END IF
  END FOR
  RETURN false
END FUNCTION
```

## Output Format

**Concise (for chat):**
```markdown
📚 Context Loaded
- Architecture.md (52 endpoints, 15 pages, 10 components)
- InfrastructureQuickRef.md (DB: KSESSIONS_DEV, APIs, SignalR)
- TESTING_FRAMEWORK_V2_SUMMARY.md (UI work detected)
- Active keys: 3 related keys found
```

**Detailed (for plan file):**
```markdown
## Context Loading Summary

### Required Reading Completed
✅ Architecture.md - System architecture catalog
   - 52 API endpoints across 11 controllers
   - 15 Razor pages, 10 components
   - 15+ services with responsibilities
   - 4 SignalR hubs (SessionHub, QuestionHub, HostHub, ParticipantHub)

✅ InfrastructureQuickRef.md - Infrastructure patterns
   - Database: KSESSIONS_DEV (Server: AHHOME)
   - Connection: DefaultConnection via appsettings.json
   - Schema Access: canvas.* (READ-WRITE), dbo.* (READ-ONLY)
   - API Base: https://localhost:9091/api
   - SignalR Hubs: /sessionHub, /questionHub, /hostHub, /participantHub

✅ TESTING_FRAMEWORK_V2_SUMMARY.md - Testing conventions
   - Playwright for E2E (PlayWright/Tests/)
   - Percy for visual regression
   - Test data patterns and session setup

✅ Active Keys Index
   - 3 related keys identified
   - No conflicts detected

### Optional Context Loaded
✅ VISUAL_REGRESSION_TESTING.md (UI changes detected)
```

## Enforcement

**CRITICAL:** plan.prompt.md Step 1 must BLOCK until context loading completes.

**Validation:**
- If plan generation proceeds without loading Architecture.md → VIOLATION
- If database work proceeds without checking InfrastructureQuickRef.md → VIOLATION
- If UI work proceeds without TESTING_FRAMEWORK_V2_SUMMARY.md → WARNING

**Why This Matters:**
1. **Prevents duplication** - Architecture.md shows 52 existing endpoints; don't recreate
2. **Ensures compliance** - InfrastructureQuickRef.md defines schema access rules (canvas.* vs dbo.*)
3. **Maintains patterns** - Testing frameworks define E2E test structure and Percy usage
4. **Identifies conflicts** - Active keys index prevents duplicate work

## Integration Points

**Called by:**
- `plan.prompt.md` (Step 1) - MANDATORY before plan generation
- `task.prompt.md` (Step 2.8) - Architecture analysis for implementation

**Outputs:**
- Loaded context passed to plan generation steps
- Architecture catalog used for duplicate detection
- Infrastructure patterns used for validation
- Testing conventions applied to test strategy

## Connection String & API Verification

**Database Verification:**
```
FROM InfrastructureQuickRef.md:
  Server: AHHOME
  Database: KSESSIONS_DEV
  Connection: GetConnectionString("DefaultConnection")

VERIFY against SPA/NoorCanvas/appsettings.json:
  "ConnectionStrings": {
    "DefaultConnection": "Server=AHHOME;Database=KSESSIONS_DEV;..."
  }
```

**API Endpoint Verification:**
```
FROM Architecture.md:
  AssetLookupController: /api/host/asset-lookup

VERIFY against codebase:
  grep -r "api/host/asset-lookup" SPA/NoorCanvas/
  → Should find controller and client-side calls
```

## See Also
- `.github/instructions/SelfAwareness.instructions.md` - Database access rules and required reading policy
- `.github/instructions/Links/Architecture.md` - Comprehensive architecture catalog
- `.github/instructions/Links/InfrastructureQuickRef.md` - Infrastructure patterns and connection details
- `.github/prompts/shared/request-analyzer.md` - Uses work characteristics to determine context needs
- `.github/prompts/plan.prompt.md` - Consumes this algorithm in Step 1
