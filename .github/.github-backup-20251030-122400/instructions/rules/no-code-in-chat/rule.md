# Rule: No Code in Chat

**ID:** `no-code-in-chat`  
**Version:** 1.0.0  
**Created:** 2025-10-30  
**Category:** output-format  
**Severity:** critical  
**Applies To:** all prompts

---

## Rule Statement

**Summary:** Implementation code NEVER appears in user responses; only architectural descriptions allowed.

**Detailed Description:**
This rule enforces separation between planning (chat responses) and implementation (KDS documentation). All code implementations, method bodies, and detailed logic must be documented in KDS files (`.github/key-data-streams/{key}/`), while chat responses contain only high-level architectural descriptions, file paths, and references to detailed documentation.

**Why This Matters:**
- **Context efficiency**: Keeps chat focused on architecture without code clutter
- **Documentation quality**: Forces detailed implementation into structured KDS files
- **Crash recovery**: Implementation details preserved in KDS, not lost in chat history
- **Scalability**: Large codebases documented in files, not chat transcripts

---

## ❌ PROHIBITED in User Responses

**NEVER show these in chat:**
- Code blocks: ` ```csharp`, ` ```javascript`, ` ```typescript`, ` ```html`, ` ```css`, ` ```sql`, ` ```razor`
- Method implementations (complete or partial)
- Function bodies with logic
- Component markup structures (HTML elements with attributes)
- CSS styling rules (selectors with properties)
- SQL statements (SELECT, INSERT, UPDATE, DELETE)
- Algorithm implementations
- Code walkthroughs or examples
- Multi-line code snippets with implementation logic

**Exceptions:**
- Configuration JSON ≤10 lines (pure settings, no logic)
- Shell commands: `dotnet build`, `git checkout -b feature/new`
- Single-line examples for clarity (e.g., `const x = 5;`)

---

## ✅ ALLOWED in User Responses

**Architectural descriptions ONLY:**

### File References
- File paths: `AssetProcessingService.cs (line 384)`
- Directory structures: `.github/key-data-streams/prompt/`
- Module references: `ShareAsset` component

### Method Signatures
- Signatures without bodies: `ShareAsset(string shareId, string assetType)`
- Interface contracts: `IAssetProcessor.Process(Asset asset)`
- Return types: `Task<Result>` or `void`

### Data Flow Descriptions
- Component interactions: `Component A → Service B → Hub C → Client D`
- Event flows: `User clicks → Trigger event → Update state → Render UI`
- Pipeline stages: `Parse → Validate → Transform → Save`

### Change Summaries
- "Added CreateShareButtonHtml method returning HTML string"
- "Refactored validation logic into ValidationService"
- "Updated route configuration in Startup.cs"

### Configuration (Limited)
- JSON settings ≤10 lines (pure configuration, no logic)
- Environment variables: `ASPNETCORE_ENVIRONMENT=Production`
- Feature flags: `"EnableDebugPanel": true`

### Shell Commands
- Build commands: `dotnet build`
- Git operations: `git checkout -b feature/new`
- Test execution: `npx playwright test`

---

## 📁 Where Implementation Code Goes

**ALL implementation details → `.github/key-data-streams/{key}/`**

### Required Files

**`{key}.plan.md`**
- Complete implementation plans
- Code examples with full context
- Algorithm implementations
- Component structure details

**`work-log.md`**
- Detailed execution logs
- Method implementations (before/after)
- Debugging traces
- Problem-solution documentation

**`{key}.plan.json`**
- Structured plan data
- Phase tracking
- Status metadata

### Reference Pattern in Chat

**Instead of showing code:**
```markdown
Implementation → See {key}.plan.md section "Code Implementation"
Full method → See {key}/work-log.md lines 150-200
Algorithm details → See {key}.plan.md "Phase 3: Validation Logic"
```

**Example:**
```markdown
Updated AssetProcessingService.ShareAsset method:
- Added share link generation logic
- Implemented expiry validation
- Full implementation → See table-asset-enhancement/work-log.md lines 284-310
```

---

## 🔍 Validation Algorithm

**Function Name:** `ValidateNoCodeInChat(response)`

```
FUNCTION ValidateNoCodeInChat(response):
  
  # Step 1: Check for code blocks (except config JSON ≤10 lines)
  codeBlocks = response.FindAll("```(csharp|javascript|typescript|html|css|sql|razor)")
  
  FOR EACH block IN codeBlocks:
    IF block.language != "json" OR block.lineCount > 10 THEN
      RETURN {
        violation: true,
        type: "CODE_IN_CHAT",
        block: block,
        language: block.language,
        lineCount: block.lineCount,
        message: "Implementation code detected in user response"
      }
    END IF
  END FOR
  
  # Step 2: Check for method implementations (signatures with bodies)
  methodPatterns = [
    "public .* {", "private .* {", "async .* {",
    "function .* {", "const .* => {", "class .* {"
  ]
  
  FOR EACH pattern IN methodPatterns:
    IF response.Contains(pattern) THEN
      RETURN {
        violation: true,
        type: "METHOD_IMPLEMENTATION",
        pattern: pattern,
        message: "Method implementation detected in user response"
      }
    END IF
  END FOR
  
  # Step 3: Check for HTML/CSS implementation blocks
  IF response.Contains("<div") OR response.Contains("<span") OR response.Contains("className=") THEN
    IF NOT IsArchitecturalDescription(response) THEN
      RETURN {
        violation: true,
        type: "MARKUP_IMPLEMENTATION",
        message: "Component markup structure detected in user response"
      }
    END IF
  END IF
  
  # Step 4: Check for SQL statements
  sqlKeywords = ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE TABLE"]
  FOR EACH keyword IN sqlKeywords:
    IF response.Contains(keyword) AND HasSQLStatement(response, keyword) THEN
      RETURN {
        violation: true,
        type: "SQL_STATEMENT",
        keyword: keyword,
        message: "SQL statement detected in user response"
      }
    END IF
  END FOR
  
  RETURN { violation: false }
  
END FUNCTION


FUNCTION IsArchitecturalDescription(text):
  # Allow brief mentions like "added <div> wrapper"
  # Disallow full component structures
  componentCount = text.CountOccurrences("<div|<span|<button")
  RETURN componentCount <= 2
END FUNCTION


FUNCTION HasSQLStatement(text, keyword):
  # Simple heuristic: keyword followed by table/column names
  pattern = keyword + " .* FROM|INTO|SET|WHERE"
  RETURN text.MatchesPattern(pattern)
END FUNCTION
```

---

## 🛑 Enforcement Action

**Auto-Fix Available:** yes (rewrite with architectural descriptions)

```
IF ValidateNoCodeInChat(response).violation THEN
  
  # Step 1: Log violation
  LogViolation(".github/audits/mandate-violations.log", {
    timestamp: Now(),
    rule: "NO_CODE_IN_CHAT",
    prompt: CurrentPrompt,
    key: CurrentKey,
    violation: validationResult,
    violationType: validationResult.type,
    details: validationResult.block OR validationResult.pattern
  })
  
  # Step 2: HALT response delivery
  SHOW_ERROR("MANDATE VIOLATION: Implementation code detected in response")
  SHOW_FIX("Move implementation details to {key}.plan.md or work-log.md")
  
  # Step 3: Auto-fix (rewrite response)
  response = RewriteWithArchitecturalDescriptions(response)
  response += "\n\n---\n\n**Implementation details** → See {key}.plan.md or {key}/work-log.md"
  
  # Step 4: Re-validate
  RETRY ValidateNoCodeInChat(response)
  
  # Step 5: If still violating, HALT execution
  IF ValidateNoCodeInChat(response).violation THEN
    HALT_EXECUTION("Unable to auto-fix code in chat violation")
  END IF
  
END IF


FUNCTION RewriteWithArchitecturalDescriptions(response):
  
  # Extract code blocks
  codeBlocks = response.ExtractCodeBlocks()
  
  FOR EACH block IN codeBlocks:
    # Replace with architectural summary
    summary = GenerateArchitecturalSummary(block)
    reference = "See {key}.plan.md section '{block.context}'"
    response = response.Replace(block.content, summary + "\n\n" + reference)
  END FOR
  
  RETURN response
  
END FUNCTION


FUNCTION GenerateArchitecturalSummary(codeBlock):
  
  # Analyze code structure
  IF codeBlock.language == "csharp" THEN
    methods = ExtractMethods(codeBlock.content)
    RETURN "Methods: " + methods.Join(", ") + " (signatures only)"
  
  ELSE IF codeBlock.language == "javascript" OR codeBlock.language == "typescript" THEN
    functions = ExtractFunctions(codeBlock.content)
    RETURN "Functions: " + functions.Join(", ")
  
  ELSE IF codeBlock.language == "html" THEN
    components = ExtractComponents(codeBlock.content)
    RETURN "Components: " + components.Join(", ")
  
  ELSE IF codeBlock.language == "sql" THEN
    operations = ExtractSQLOperations(codeBlock.content)
    RETURN "SQL operations: " + operations.Join(", ")
  
  ELSE
    RETURN "Code implementation (see referenced file)"
  
  END IF
  
END FUNCTION
```

---

## Related Documentation

**Related Rules:**
- [document-first](../document-first/rule.md) - Ensures implementation goes to KDS first

**Implementation Modules:**
- `.github/prompts/shared/step-2-5-document-first-checkpoint.md` - KDS documentation workflow
- `.github/key-data-streams/_template/` - KDS file templates

**Examples:**
- See [examples.md](examples.md) in this folder

---

**This rule is SOURCE OF TRUTH until user explicitly changes it.**

**Last Updated:** 2025-10-30  
**Version:** 1.0.0
