# Playwright Testing Integration Summary

**Date**: 2025-01-22  
**Author**: GitHub Copilot (Task Executor)  
**Purpose**: Document integration of Playwright testing knowledge into prompt system with auto-update mechanism and localization pattern

---

## Overview

User requested Playwright testing information be consolidated into a single authoritative QuickRef file (similar to database rules integration), with references from essential prompts and a localization mechanism for efficiency.

**User Request**: 
> "Similarly when user says playwright test or pwtest, task and other prompts should know exactly how to write and execute these tests based on the playwright config files. I want all such information to be in a single MD file always referenced by copilot the first time a key is used, and then the relevant information should be localized in the key data stream for efficiency. Implement a mechanism so that cohesion review prompt updates all such information in the future moving forward."

---

## Changes Made

### 1. Created PlaywrightQuickRef.md
**File**: `.github/instructions/Links/PlaywrightQuickRef.md`  
**Version**: 1.0.0  
**Size**: 400+ lines  
**Purpose**: Single source of truth for all Playwright testing knowledge

**Sections**:
1. **When User Says** - Keyword triggers (pwtest, playwright test, e2e test, etc.)
2. **Test File Structure** - Standard template with imports, hooks, test cases
3. **Configuration Files** - playwright.config.cjs, tsconfig.json locations and key settings
4. **Test Data (Session 212)** - Canonical tokens, session details, user credentials
5. **Test Execution Commands** - All modes (standalone, CI, manual server, headed/headless)
6. **Test Writing Patterns** - API-based approach, waiting strategies, assertions
7. **Common Test Scenarios** - Question submission, voting, broadcasts, multi-user
8. **Debugging Tips** - Common issues, trace viewer, screenshot artifacts
9. **TypeScript Config** - Path mappings, DOM types, module resolution
10. **Cleanup Rules** - TEMP vs Tests/UI placement criteria
11. **Test Reporting** - HTML reporter, JSON results, failure artifacts
12. **Integration Points** - How tests fit with .NET app, SignalR, database
13. **Auto-Update Protocol** - Maintenance by cohesion-review agent

**Key Features**:
- ✅ Session 212 as canonical test data (tokens KJAHA99L/PQ9N5YWW)
- ✅ All execution modes documented (standalone, CI, manual)
- ✅ API-based testing patterns (preferred approach)
- ✅ Configuration file locations and settings
- ✅ Test file structure template
- ✅ Debugging and troubleshooting guide
- ✅ Auto-update protocol for maintenance

### 2. Updated SystemIndex.md
**File**: `.github/instructions/Links/SystemIndex.md`  
**Change**: Added "Playwright Testing Rules" section

**New Content**:
```markdown
### Playwright Testing Rules
**When user says**: "pwtest", "playwright test", "e2e test", "test the UI", "create a test"

**MANDATORY**: Consult `PlaywrightQuickRef.md` for:
- Session 212 test data (canonical tokens)
- Test file structure and patterns
- Configuration modes (standalone vs CI)
- Execution commands
- API-based testing approach

**Key Rules**:
- ✅ USE Session 212 (tokens: KJAHA99L, PQ9N5YWW)
- ✅ PREFER API-based test setup (faster, more reliable)
- ✅ PLACE tests in Tests/UI/ (permanent) or Workspaces/TEMP/ (experimental)
- ✅ FOLLOW test file structure template
- ✅ USE standalone mode for manual debugging (auto-manages .NET app)
```

**Benefits**:
- Central navigation hub now references Playwright knowledge
- User keywords immediately route to PlaywrightQuickRef.md
- Quick access to test data and execution patterns

### 3. Updated Essential Prompts

#### task.prompt.md
**Changes**:
1. **Core Mandates Section**: Added PlaywrightQuickRef.md as MANDATORY for test creation
2. **Step 6.1 (Automated Test Generation)**: Updated to reference PlaywrightQuickRef.md
3. **Architectural Reference Documentation**: Listed PlaywrightQuickRef.md with ⭐ marker

**New Text**:
```markdown
### Architectural Reference Documentation
- **PlaywrightQuickRef.md** ⭐ **MANDATORY for test creation** - Complete testing guide (patterns, execution, Session 212)
```

**Impact**: Task executor now knows to consult PlaywrightQuickRef.md whenever test creation is needed

#### question.prompt.md
**Changes**: Added "Playwright Testing" section to knowledge base

**New Section**:
```markdown
### Playwright Testing
- **Default Test Data**: Session 212 (tokens: KJAHA99L/PQ9N5YWW)
- **Configuration**: config/testing/playwright.config.cjs
- **Test Location**: Tests/UI/ (permanent), Workspaces/TEMP/ (experimental)
- **Execution Modes**: standalone (auto-manage .NET), CI (external server), manual
- **See**: PlaywrightQuickRef.md for complete testing patterns
```

**Impact**: Question agent can now answer testing queries with authoritative data

#### cohesion-review.prompt.md
**Changes**: Added PlaywrightQuickRef.md to auto-update protocol

**New Deliverable**:
```markdown
8. **QuickRef Auto-Update** (if infrastructure or testing knowledge changed):
   - Update InfrastructureQuickRef.md with new database rules, API endpoints, dependencies
   - Update PlaywrightQuickRef.md with new test patterns, configuration changes, Session data
```

**Update Process**:
1. Read InfrastructureQuickRef.md and PlaywrightQuickRef.md
2. Compare with source files (appsettings.json, playwright.config.cjs, etc.)
3. Identify drift or missing information
4. Update QuickRef files with new/changed information
5. Verify updates don't break existing references

**Impact**: Cohesion review agent now maintains Playwright knowledge automatically

### 4. Updated key-template.md
**File**: `Workspaces/Copilot/key-data-streams/_template/key-template.md`  
**Change**: Added "QuickRef Localization" section

**New Section**:
```markdown
## QuickRef Localization
**Purpose**: Cache frequently-needed information from QuickRef files for efficiency

**Source Files**: InfrastructureQuickRef.md, PlaywrightQuickRef.md

**Auto-populated on first use by task.prompt.md Step 2.5**

### Database (from InfrastructureQuickRef.md)
**FIRST_USE_ONLY**: If this key involves database operations, task agent copies relevant info here
- Primary database, connection string
- Schema rules (canvas.* READ-WRITE, dbo.* READ-ONLY)
- Tables modified/read by this key

### API Endpoints (from InfrastructureQuickRef.md)
**FIRST_USE_ONLY**: If this key involves API calls
- Base URL, specific endpoints used
- Authentication requirements

### Playwright Testing (from PlaywrightQuickRef.md)
**FIRST_USE_ONLY**: If this key has UI changes
- Test location pattern
- Session 212 tokens (KJAHA99L, PQ9N5YWW)
- Execution commands
- Test patterns (API-based, wait strategies)

### SignalR Hubs (from InfrastructureQuickRef.md)
**FIRST_USE_ONLY**: If this key involves real-time communication
- Hub URLs, client events
```

**Impact**: Individual keys can cache relevant QuickRef data for faster access

### 5. Updated task.prompt.md Step 2.5
**New Step**: QuickRef Localization (Auto-Populate on First Use)

**Purpose**: Cache frequently-referenced information from QuickRef files into key metadata

**Workflow**:
1. Check if QuickRef Localization section exists in `{key}.md`
2. If empty/missing, determine what to localize based on task characteristics:
   - Database operations → Extract database rules
   - API calls → Extract endpoints
   - UI changes → Extract Playwright patterns
   - Real-time → Extract SignalR hubs
3. Read appropriate QuickRef files (one-time)
4. Populate localized sections in key metadata
5. Use cached data in subsequent iterations (zero I/O cost)

**Efficiency Benefits**:
- **First iteration**: Read QuickRef files (one-time cost)
- **Subsequent iterations**: Use cached data (zero I/O)
- **Consistency**: All iterations use same reference data
- **Freshness**: cohesion-review maintains QuickRef files

---

## Implementation Pattern

This implementation follows the **QuickRef Consolidation Pattern**:

```
Authoritative QuickRef File
    ↓
Referenced by Essential Prompts (mandatory)
    ↓
First Use: Localize relevant sections to key metadata
    ↓
Subsequent Uses: Reference cached data
    ↓
Auto-Update: cohesion-review maintains QuickRef files
```

**Components**:
1. **Single Source of Truth**: PlaywrightQuickRef.md (400+ lines)
2. **Mandatory References**: task.prompt.md, question.prompt.md, test-generation.prompt.md
3. **Localization Template**: key-template.md QuickRef Localization section
4. **Auto-Population**: task.prompt.md Step 2.5
5. **Auto-Update**: cohesion-review.prompt.md deliverable #8

---

## Benefits

### For Users
1. **Single Keyword Trigger**: "pwtest" → Complete testing knowledge
2. **Consistent Test Data**: Session 212 as canonical reference
3. **Clear Execution Path**: All modes documented with commands
4. **Debugging Support**: Common issues and solutions included

### For Copilot Agents
1. **No Ambiguity**: Single source of truth for all testing knowledge
2. **Efficient Access**: Cached data in key metadata (no repeated reads)
3. **Automatic Maintenance**: cohesion-review keeps QuickRef updated
4. **Complete Coverage**: All aspects of Playwright testing documented

### For System
1. **Knowledge Consolidation**: 400+ lines in one authoritative file
2. **Localization Efficiency**: Cache relevant data per key
3. **Auto-Update Protocol**: Prevents knowledge drift
4. **Pattern Reusability**: Same pattern for database, API, testing

---

## Examples

### Example 1: User says "pwtest"
**Before** (scattered knowledge):
- User provides test details manually
- Agent guesses at Session ID, tokens
- Configuration not documented
- Execution commands unclear

**After** (consolidated knowledge):
- task.prompt.md recognizes "pwtest" keyword
- Consults PlaywrightQuickRef.md (mandatory)
- Uses Session 212 tokens (KJAHA99L/PQ9N5YWW)
- Follows test file structure template
- Executes with documented command
- Localizes test patterns to key metadata

### Example 2: Creating UI Test for New Feature
**Step 2.5 Auto-Population**:
```markdown
### Playwright Testing (from PlaywrightQuickRef.md)
- **Test Location**: `Tests/UI/feature-question-voting.spec.ts`
- **Test Data**: Session 212
  - User Token: KJAHA99L (Peter Parker)
  - Host Token: PQ9N5YWW
- **Base URL**: `https://localhost:9091`
- **Test Patterns**:
  - API-based approach (POST /api/question/submit)
  - Wait for selectors with timeout
  - Use Session 212 test data
- **Execution**: `npx playwright test Tests/UI/feature-question-voting.spec.ts`
- **Mode**: standalone (auto-manages .NET app)
```

**Subsequent Task Iterations**:
- Agent reads cached Playwright section from key metadata
- No need to re-read PlaywrightQuickRef.md (efficient)
- Consistent test data across all iterations

### Example 3: cohesion-review Maintenance
**Scenario**: playwright.config.cjs updated with new timeout settings

**Auto-Update Process**:
1. cohesion-review reads PlaywrightQuickRef.md
2. Compares with config/testing/playwright.config.cjs
3. Detects new timeout settings
4. Updates PlaywrightQuickRef.md Configuration Files section
5. Documents change in update log

**Result**: PlaywrightQuickRef.md stays current with actual configuration

---

## Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `.github/instructions/Links/PlaywrightQuickRef.md` | CREATE | 400+ line authoritative testing guide |
| `.github/instructions/Links/SystemIndex.md` | UPDATE | Added Playwright Testing Rules section |
| `.github/prompts/task.prompt.md` | UPDATE | Added Step 2.5, PlaywrightQuickRef.md to mandates |
| `.github/prompts/question.prompt.md` | UPDATE | Added Playwright Testing knowledge section |
| `.github/prompts/cohesion-review.prompt.md` | UPDATE | Added PlaywrightQuickRef.md to auto-update protocol |
| `Workspaces/Copilot/key-data-streams/_template/key-template.md` | UPDATE | Added QuickRef Localization section |

---

## Comparison with Database Rules Integration

| Aspect | Database Rules | Playwright Testing |
|--------|----------------|-------------------|
| **QuickRef File** | InfrastructureQuickRef.md v2.0.0 | PlaywrightQuickRef.md v1.0.0 |
| **Size** | ~200 lines | ~400 lines |
| **User Keywords** | "database", "DB", "SQL" | "pwtest", "playwright test", "e2e" |
| **Primary Data** | KSESSIONS_DEV, schema rules | Session 212, tokens, config |
| **Prompts Updated** | task, question, refactor, sync | task, question, test-generation |
| **Localization** | Database section in key template | Playwright section in key template |
| **Auto-Update** | cohesion-review deliverable #8 | cohesion-review deliverable #8 |
| **Mandatory Usage** | InfrastructureQuickRef.md for DB ops | PlaywrightQuickRef.md for test creation |

**Pattern Consistency**: Both follow identical consolidation pattern (QuickRef file + prompt references + localization + auto-update)

---

## Next Steps (Future Enhancements)

### 1. Add More Test Scenarios
- File upload testing
- PDF generation testing
- Admin dashboard testing
- Multi-session testing

### 2. Expand Configuration Documentation
- Parallel execution settings
- Retry logic configuration
- Browser context options
- Video recording settings

### 3. Create Test Utilities
- Common test helpers module
- Shared fixtures for Session 212
- API client wrapper for test setup
- SignalR test utilities

### 4. Document Additional Test Data
- Session 213+ for edge cases
- Invalid token scenarios
- Performance testing data
- Load testing scenarios

---

## Validation Checklist

- ✅ PlaywrightQuickRef.md created with comprehensive testing guide
- ✅ SystemIndex.md updated with Playwright Testing Rules section
- ✅ task.prompt.md references PlaywrightQuickRef.md as mandatory
- ✅ question.prompt.md includes Playwright knowledge section
- ✅ cohesion-review.prompt.md includes PlaywrightQuickRef.md in auto-update
- ✅ key-template.md includes QuickRef Localization section
- ✅ task.prompt.md Step 2.5 implements localization logic
- ✅ Summary document created (this file)

---

## Conclusion

Successfully integrated Playwright testing knowledge into prompt system using the **QuickRef Consolidation Pattern**:

1. **Single Source of Truth**: PlaywrightQuickRef.md (400+ lines)
2. **Mandatory References**: Essential prompts reference QuickRef file
3. **Localization Mechanism**: Cache relevant data in key metadata (Step 2.5)
4. **Auto-Update Protocol**: cohesion-review maintains QuickRef files

**Pattern Benefits**:
- ✅ **No Ambiguity**: User says "pwtest" → Copilot knows exactly what to do
- ✅ **Efficiency**: First use reads QuickRef, subsequent uses cache data
- ✅ **Consistency**: Session 212 as canonical test data across all tests
- ✅ **Maintainability**: Auto-update keeps knowledge current
- ✅ **Reusability**: Same pattern for database, API, testing, future domains

**Impact**: When user mentions "playwright test" or "pwtest", all agents have immediate access to:
- Test file structure template
- Session 212 canonical test data
- Configuration file locations
- Execution commands for all modes
- Proven testing patterns
- Debugging strategies

This completes the third user request: "Similarly when user says playwright test or pwtest, task and other prompts should know exactly how to write and execute these tests...I want all such information to be in a single MD file always referenced by copilot the first time a key is used, and then the relevant information should be localized in the key data stream for efficiency."
