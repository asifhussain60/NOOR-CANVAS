# Generic Template — Configured by total-recall

> **NOTE**: This is a TEMPLATE file. To configure for your project:
> 1. Run: `@workspace /total-recall`
> 2. Review generated files in `.github/_Portable/_Configured/`
> 3. Copy to `.github/` when satisfied

**Template Variables Used:**
- `{{ANALYZER_TOOLS}}`
- `{{BUILD_COMMAND}}`
- `{{LINT_COMMAND}}`
- `{{PROJECT_NAME}}`
- `{{REALTIME_TECH}}`
- `{{SOURCE_PATH}}`
- `{{TEST_FRAMEWORK}}`

---
# Validation Framework - Canonical Reference

**Version:** 1.0  
**Last Updated:** October 9, 2025  
**Purpose:** Single source of truth for validation requirements across all agents

---

## Overview

This document defines the standard validation pipeline that all agents must execute to ensure system integrity. By centralizing validation logic, we ensure consistency, reduce maintenance burden, and guarantee quality across all operations.

---

## Standard Validation Pipeline

All agents must execute these validations in the order specified below. Each level builds upon the previous, creating a comprehensive quality gate.

### Level 1: Build Validation (MANDATORY)

**Purpose:** Ensure code compiles without errors or warnings

**Commands:**
```powershell
{{BUILD_COMMAND}} --configuration Release --verbosity normal
{{BUILD_COMMAND}} --configuration Debug --verbosity normal
```

**Requirements:**
- ✅ ZERO compilation errors
- ✅ ZERO compilation warnings
- ✅ Both Release and Debug configurations must succeed

**Failure Action:**
- Retry up to 2 additional times (3 total attempts)
- If failures persist, halt execution and escalate to user

---

### Level 2: Analyzer Validation (MANDATORY)

**Purpose:** Ensure code quality and architectural compliance

**Tools:**
- **{{ANALYZER_TOOLS}}:** `.\Workspaces\CodeQuality\run-{{ANALYZER_TOOLS}}.ps1`
- **.NET Analyzers:** Verified via build output
- **StyleCop:** Enforced with 36 intentional suppressions (see `AnalyzerConfig.MD`)

**Requirements:**
- ✅ ZERO {{ANALYZER_TOOLS}} diagnostics (errors or warnings)
- ✅ All .NET analyzers pass
- ✅ StyleCop violations limited to approved suppressions only

**Failure Action:**
- Attempt automatic fixes where possible
- Retry validation after fixes
- If unfixable, escalate to user with specific diagnostic details

**Reference:** `.github/instructions/Links/AnalyzerConfig.MD`

---

### Level 3: Linter Validation (MANDATORY for JS/TS changes)

**Purpose:** Ensure JavaScript/TypeScript code quality and formatting

**Commands:**
```bash
npm run lint          # ESLint with --max-warnings=0
npm run format:check  # Prettier formatting verification
```

**Requirements:**
- ✅ ZERO ESLint errors
- ✅ ZERO ESLint warnings (except 39 accepted baseline issues)
- ✅ Prettier formatting fully compliant

**Accepted Baseline:**
- 39 ESLint errors in {{REALTIME_TECH}} globals, {{TEST_FRAMEWORK}} contexts, fixtures, and catch patterns
- These are documented in `AnalyzerConfig.MD` and must not be "fixed"

**Failure Action:**
- Run `npm run lint:fix` for auto-fixable issues
- Run `npm run format` for formatting issues
- Retry validation
- If new issues introduced, escalate to user

**Reference:** `.github/instructions/Links/AnalyzerConfig.MD`

---

### Level 4: Contract Validation (IF API/DTO changes)

**Purpose:** Prevent API/frontend mismatches and DTO inconsistencies

**Trigger:** Changes to any of the following:
- Controllers (any file in `{{SOURCE_PATH}}/Controllers/`)
- DTOs (any DTO, request, or response model)
- API endpoints (additions, modifications, or removals)
- {{REALTIME_TECH}} hubs (any file in `{{SOURCE_PATH}}/Hubs/`)

**Validation Steps:**

1. **Pre-Refactoring Model Inventory**
   - Document all existing request/response models before changes
   - Capture field names, types, and case sensitivity

2. **Cross-Layer Type Matching**
   - Verify API response types match frontend expectations
   - Confirm DTO property types align across layers
   - Validate {{REALTIME_TECH}} hub method signatures

3. **Field Name Case Sensitivity**
   - Ensure JSON property names match exactly (case-sensitive)
   - Verify `[JsonPropertyName]` attributes if custom casing used
   - Check Blazor component bindings for correct casing

4. **Response Model Alignment**
   - Confirm response wrapper structures match (e.g., `data`, `success`, `message`)
   - Validate array vs single object return types
   - Check nullable vs non-nullable consistency

**Requirements:**
- ✅ All API contracts documented and verified
- ✅ No type mismatches between layers
- ✅ No field name case mismatches
- ✅ Response structures consistent

**Failure Action:**
- Document all contract violations
- Propose fixes for each violation
- Require explicit approval before applying fixes

**Reference:** `.github/instructions/Links/API-Contract-Validation.md`

---

### Level 5: Test Validation (MANDATORY)

**Purpose:** Ensure functionality works as expected and no regressions introduced

**Test Types:**

1. **Unit Tests** (if applicable to changes)
   - Run tests relevant to modified components
   - Ensure all assertions pass

2. **Integration Tests** (if API/Service changes)
   - Run tests that exercise modified endpoints
   - Validate service layer integration

3. **{{TEST_FRAMEWORK}} Tests** (if UI changes)
   - Run tests for affected UI components
   - Use standalone mode (automatic app lifecycle management)
   - Multi-browser isolation (Chromium, Firefox, WebKit)

**Commands:**
```bash
# {{TEST_FRAMEWORK}} tests
npx {{TEST_FRAMEWORK}} test [test-file-pattern] --headed
npx {{TEST_FRAMEWORK}} test [test-file-pattern] --project=chromium
npx {{TEST_FRAMEWORK}} test [test-file-pattern] --project=firefox
npx {{TEST_FRAMEWORK}} test [test-file-pattern] --project=webkit
```

**Requirements:**
- ✅ All relevant unit tests pass
- ✅ All relevant integration tests pass
- ✅ All relevant {{TEST_FRAMEWORK}} tests pass across all browsers
- ✅ No new test failures introduced

**Failure Action:**
- Investigate test failures
- Fix code or update tests (with justification)
- Retry validation
- If persistent failures, escalate to user

**Reference:** 
- `.github/instructions/Links/{{TEST_FRAMEWORK}}Config.MD`
- `.github/instructions/Links/{{TEST_FRAMEWORK}}TestPaths.MD`

---

### Level 6: Documentation Validation (IF structural changes)

**Purpose:** Keep documentation synchronized with code reality

**Trigger:** Changes to any of the following:
- New prompts or agents added/removed
- Architectural changes (new services, controllers, hubs)
- Configuration file modifications
- New instruction files or links

**Files to Validate:**

1. **SystemStructureSummary.md**
   - Active prompts list accurate
   - Retired prompts documented
   - Agent coordination protocols current

2. **{{PROJECT_NAME}}_ARCHITECTURE.MD**
   - Controller count and names accurate
   - API endpoint inventory current
   - Service layer documentation updated
   - {{REALTIME_TECH}} hub documentation current

3. **Configuration Documentation**
   - `AnalyzerConfig.MD` reflects current analyzer settings
   - `{{TEST_FRAMEWORK}}Config.MD` reflects current test configuration
   - Other config docs updated as needed

**Requirements:**
- ✅ All documentation reflects current code state
- ✅ No outdated references or dead links
- ✅ No architectural drift between docs and reality

**Failure Action:**
- Update documentation to match code
- Verify all cross-references
- Commit documentation updates with code changes

**Reference:** `.github/instructions/Links/SystemStructureSummary.md`

---

## Validation Shortcuts (By Agent)

Different agents have different validation requirements based on their scope and purpose.

### task.prompt.md (Task Executor)

**Required Levels:** 1-5

**Optional:** Level 6 (only if structural changes made)

**Rationale:** Task agent makes code/feature changes requiring full validation but may not always affect architecture.

---

### refactor.prompt.md (Structural Integrity)

**Required Levels:** 1-6 (ALL)

**Additional Requirements:**
- `{{LINT_COMMAND}} --verify-no-changes` (formatting verification)
- Mandatory before/after comparison of all affected files
- Iterative validation after each structural change

**Rationale:** Refactoring agent has highest risk of architectural drift and must validate everything.

---

### sync.prompt.md (Synchronization + Cleanup)

**Required Levels:** 1-3, 6

**Conditional:** 4-5 (only if code changes made)

**Rationale:** Sync primarily updates documentation and configs, so emphasizes doc validation. Code changes are rare but must be validated when they occur.

---

### healthcheck.prompt.md (System Health Auditor)

**Required Levels:** 1-6 (ALL)

**Mode:** Read-only verification (no fixes applied)

**Rationale:** Healthcheck validates entire system integrity and reports all violations without attempting repairs.

---

### analyze-learning.prompt.md (Self-Learning Agent)

**Required Levels:** None (analysis-only agent)

**Mode:** Read-only analysis of historical data

**Rationale:** This agent analyzes key data streams and generates recommendations but makes no code changes.

---

## Failure Protocols

### Warning Handling Mandate

**Policy:** Warnings must be treated as errors

**Retry Strategy:**
1. First attempt: Automatic fix if possible
2. Second attempt: Retry after fix
3. Third attempt: Final retry with explicit logging
4. After 3 attempts: HALT and escalate to user

**No Infinite Loops:** Maximum 3 total attempts, then mandatory user intervention

### Automatic Rollback Trigger

**Conditions for Rollback:**
- Validation failures persist after 3 attempts
- Build breaks after changes
- Critical tests fail after changes
- Architectural integrity violated

**Rollback Procedure:**
```powershell
.\Workspaces\Global\rollback.ps1 -Key {key-name} -Agent {agent-name}
```

**Post-Rollback Actions:**
1. Report rollback to user with failure details
2. Mark task as Incomplete in key data stream
3. Do NOT retry without explicit user approval
4. Document failure in key notes for learning

**Reference:** `Workspaces/Global/rollback.ps1`

---

## Integration with Key Management

### Phase Tracking

Each validation level should be tracked in the key's validation phase:

```json
"validate": {
  "status": "in-progress",
  "checks": {
    "build": "passed",
    "analyzers": "passed",
    "linters": "passed",
    "contracts": "passed",
    "tests": "in-progress",
    "documentation": "pending"
  }
}
```

### Validation Warnings/Errors

All validation issues must be recorded in the key:

```json
"warnings": [
  "ESLint: Unexpected console statement (line 42 in script.js)"
],
"errors": [
  "Build failed: CS0246 'InvalidType' not found"
]
```

---

## Clean Exit Guarantee

At the end of every operation, the validation pipeline guarantees:

✅ **Zero Errors:** Solution builds without compilation errors  
✅ **Zero Warnings:** Solution builds without warnings (except approved baseline)  
✅ **Analyzer Clean:** All {{ANALYZER_TOOLS}} and .NET analyzers pass  
✅ **Linter Clean:** ESLint and Prettier fully compliant (except baseline)  
✅ **Tests Pass:** All relevant automated tests pass  
✅ **Contracts Intact:** All API/DTO contracts remain consistent  
✅ **Docs Current:** All documentation synchronized with code

**If any condition fails:** Task marked **Incomplete** and reported in confirmation output.

---

## Usage in Prompts

### Referencing This Framework

All agent prompts should reference this framework in their validation section:

```markdown
### 4. Validate
- Execute Standard Validation Pipeline per `.github/instructions/Links/ValidationFramework.md`
- Apply validation shortcuts for this agent type
- Follow failure protocols on detection
- Record all validation results in key data stream
```

### Deviations from Framework

**Policy:** No agent may skip required validation levels without explicit user approval.

**Exception Process:**
1. Agent must explicitly request validation skip from user
2. User must provide written justification
3. Justification documented in key notes
4. Risk acknowledged in validation phase

---

## Related Documentation

- [SelfAwareness.instructions.md](../SelfAwareness.instructions.md) - Global operating guardrails
- [SystemStructureSummary.md](SystemStructureSummary.md) - Agent index and coordination
- [InfrastructureQuickRef.md](InfrastructureQuickRef.md) - Database, API, {{REALTIME_TECH}}, test infrastructure reference
- [AnalyzerConfig.MD](AnalyzerConfig.MD) - {{ANALYZER_TOOLS}}, StyleCop, ESLint configuration
- [API-Contract-Validation.md](API-Contract-Validation.md) - Contract validation guidelines
- [{{TEST_FRAMEWORK}}Config.MD]({{TEST_FRAMEWORK}}Config.MD) - {{TEST_FRAMEWORK}} test configuration
- [{{PROJECT_NAME}}_ARCHITECTURE.MD]({{PROJECT_NAME}}_ARCHITECTURE.MD) - System architecture

---

**Maintained By:** GitHub Copilot (Task Agent)  
**Last Updated:** 2025-01-11  
**Next Review:** January 11, 2026
