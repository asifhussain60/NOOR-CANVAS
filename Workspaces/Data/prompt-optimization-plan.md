# Comprehensive Prompt System Optimization Plan

**Date**: 2025-10-18  
**Based on**: CopilotChats.txt analysis + PLAYWRIGHT-TEST-RESOLUTION.md learnings  
**Goal**: Make Copilot more efficient, concise, and effective across all agent workflows

---

## Executive Summary

Analysis of recent chat history reveals several areas where Copilot's efficiency can be significantly improved:

### Key Findings

1. **Test Orchestration Inefficiencies**
   - Multiple failed attempts with `Start-Job` before discovering `Start-Process -PassThru`
   - No shared reference for PowerShell process management patterns
   - Repeated trial-and-error with background job management

2. **Verbose Output Issues**
   - `question.prompt.md` generates code snippets by default
   - No cross-layer analysis mandate (frontend → API → database)
   - Users want concise bullets, not detailed code dumps

3. **Missing Technology Context**
   - `plan.prompt.md` doesn't scan tech stack before recommending solutions
   - Risk of recommending incompatible libraries/frameworks
   - No awareness of installed packages/versions

4. **Refactoring Opportunities Missed**
   - `task.prompt.md` doesn't identify code smells during context gathering
   - Refactoring only happens when explicitly requested
   - Missed opportunities for proactive code improvement

5. **Portability Gaps**
   - `port-instructions.prompt.md` lacks application launch/serve variables
   - No variables for hosting framework (IIS, Kestrel, Express, etc.)
   - `total-recall.prompt.md` doesn't detect application hosting patterns

---

## Optimization Strategy

### Phase 1: Extract Test Orchestration Patterns (Foundation)
**Goal**: Create canonical reference for PowerShell test orchestration

**Actions**:
- Extract patterns from PLAYWRIGHT-TEST-RESOLUTION.md
- Create `.github/prompts/shared/test-orchestration-patterns.md`
- Include:
  - Start-Process vs Start-Job comparison table
  - Process cleanup patterns (try/finally blocks)
  - Health check polling (not fixed delays)
  - Port detection and validation
  - Process isolation techniques

**Impact**: Prevents future trial-and-error with background jobs, reduces test setup time

---

### Phase 2: Update question.prompt.md (Concise Output)
**Goal**: Transform verbose answers into concise, actionable bullets

**Changes**:
1. **New Default Output Format**:
   ```markdown
   ## Problem
   - Bullet 1
   - Bullet 2
   
   ## Root Cause
   - Analysis point 1
   - Analysis point 2
   
   ## Solution
   1. Step 1
   2. Step 2
   ```

2. **Cross-Layer Analysis Mandate**:
   - ALWAYS analyze: Frontend → API → Database → Integration
   - NEVER stop at single layer
   - Present findings as flow diagram in bullets

3. **Code Snippet Control**:
   - **Default**: NO code snippets
   - **Show code ONLY if user says**:
     - "show me code"
     - "code example"
     - "how do I write this"
     - "implementation details"

**Impact**: Faster answers, less scrolling, user gets what they need quickly

---

### Phase 3: Update task.prompt.md (Refactoring Detection)
**Goal**: Proactively identify refactoring opportunities during context gathering

**Changes**:
1. **Add Step 2.11: Refactoring Opportunity Detection (Conditional)**:
   - **Triggers**: User modifying existing code (not new features)
   - **Analysis**:
     - Long methods (>50 lines)
     - Code duplication (similar blocks in file)
     - High cyclomatic complexity
     - Poor naming (single-letter vars, unclear names)
     - Missing documentation
   - **Output**: Present findings to user with approval prompt:
     ```
     🔍 Refactoring Opportunities Detected:
     1. Method `ProcessTranscript` is 127 lines (suggest Extract Method)
     2. Duplicate HTML transformation logic in 3 locations
     3. Variable `x` unclear naming (suggest `transcriptSectionIndex`)
     
     Include refactoring in implementation plan? [y/N]
     ```

2. **Refactoring Library Integration**:
   - Reference Roslynator patterns
   - Link to established refactoring techniques (Extract Method, Simplify, Rename, etc.)
   - Suggest specific Roslynator commands where applicable

**Impact**: Continuous code quality improvement, less technical debt

---

### Phase 4: Update plan.prompt.md (Tech Stack Discovery)
**Goal**: Understand technology context BEFORE planning

**Changes**:
1. **Add Step 0.5: Technology Stack Discovery (Mandatory)**:
   - **Scan files**:
     - `package.json` (Node.js/npm)
     - `*.csproj` (.NET/NuGet)
     - `requirements.txt` / `pyproject.toml` (Python)
     - `composer.json` (PHP)
     - `pom.xml` / `build.gradle` (Java)
     - `Gemfile` (Ruby)
     - `go.mod` (Go)
   
   - **Extract**:
     - Framework versions (e.g., "ASP.NET Core 8.0")
     - Major libraries (e.g., "SignalR 8.0.0", "React 18.2")
     - Build tools (e.g., "Vite", "Webpack")
     - Testing frameworks (e.g., "Playwright 1.40")
   
   - **Validate compatibility** before recommending solutions:
     ```
     ⚠️ Warning: Recommended library X requires React 19+, but project uses React 18.2
     Suggest: Upgrade React or use compatible alternative Y
     ```

2. **Load Relevant Documentation**:
   - If framework detected → Load framework-specific best practices
   - If library detected → Check for project-specific integration patterns

**Impact**: No more incompatible recommendations, faster planning, better solutions

---

### Phase 5: Update port-instructions.prompt.md (Launch Variables)
**Goal**: Make portable system work with any hosting framework

**Changes**:
1. **Add New Template Variables**:
   ```
   {{APP_SERVER_TYPE}}          # IIS, Kestrel, Express, Flask, etc.
   {{APP_LAUNCH_COMMAND}}       # dotnet run, npm start, python app.py
   {{APP_PORT}}                 # 9091, 3000, 5000, 8080
   {{APP_STARTUP_TIME_SECONDS}} # 8, 15, 30
   {{APP_HEALTH_CHECK_URL}}     # https://localhost:9091, http://localhost:3000/health
   {{APP_PROCESS_NAME}}         # NoorCanvas, node, python
   {{APP_ENV_VARIABLE_PREFIX}}  # ASPNETCORE_, REACT_APP_, FLASK_
   ```

2. **Update Orchestration Templates**:
   - Test orchestration scripts use variables
   - Health check patterns use `{{APP_HEALTH_CHECK_URL}}`
   - Cleanup targets `{{APP_PROCESS_NAME}}`

**Impact**: True portability across all application types

---

### Phase 6: Update total-recall.prompt.md (App Launch Detection)
**Goal**: Automatically discover how application launches

**Changes**:
1. **Add Step 5.5: Application Hosting Detection**:
   - **Detect hosting framework**:
     - `Program.cs` + Kestrel configuration → ASP.NET Core (Kestrel)
     - `web.config` + `<system.webServer>` → IIS
     - `server.js` / `app.js` with Express → Node.js (Express)
     - `app.py` with Flask decorators → Python (Flask)
     - `manage.py` → Django
     - `package.json` scripts → Vite/Webpack dev server
   
   - **Extract port configuration**:
     - `appsettings.json` → `"Kestrel": { "Endpoints": { ... } }`
     - `.env` → `PORT=3000`
     - `vite.config.ts` → `server.port`
     - `launchSettings.json` → `"applicationUrl"`
   
   - **Measure startup time** (via health check polling):
     - Launch app → Poll health endpoint → Record time to first 200 OK
     - Average over 3 runs → Set `{{APP_STARTUP_TIME_SECONDS}}`
   
   - **Identify process name**:
     - .NET → `dotnet` or compiled executable name
     - Node → `node`
     - Python → `python` or `python3`

2. **Populate Variables**:
   - Update `.github/instructions/Links/InfrastructureQuickRef.md`
   - Replace all `{{APP_*}}` variables with detected values

**Impact**: Zero manual configuration for test orchestration

---

### Phase 7: Update test-generation.prompt.md (Orchestration Standards)
**Goal**: Standardize test orchestration based on proven patterns

**Changes**:
1. **Replace orchestration section** with reference to `test-orchestration-patterns.md`

2. **Mandate canonical pattern**:
   ```powershell
   # ALWAYS use this pattern for app launch:
   $app = Start-Process powershell `
       -ArgumentList "-NoExit","-Command","cd '{{SOURCE_PATH}}'; {{APP_LAUNCH_COMMAND}}" `
       -PassThru `
       -WindowStyle Minimized
   
   # ALWAYS include health check polling (NOT fixed delays):
   $healthCheckUrl = "{{APP_HEALTH_CHECK_URL}}"
   $maxAttempts = 30
   $attempt = 0
   $appReady = $false
   
   while (-not $appReady -and $attempt -lt $maxAttempts) {
       try {
           $response = Invoke-WebRequest -Uri $healthCheckUrl -SkipCertificateCheck -TimeoutSec 2
           if ($response.StatusCode -eq 200) {
               $appReady = $true
           }
       } catch {
           $attempt++
           Start-Sleep -Seconds 1
       }
   }
   
   # ALWAYS include cleanup in finally block:
   try {
       # ... test execution ...
   } finally {
       if ($app) {
           Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
       }
   }
   ```

3. **Error Prevention**:
   - ❌ **NEVER use `Start-Job`** (output redirection issues)
   - ❌ **NEVER use background operator `&`** (unreliable in PowerShell 5.1)
   - ❌ **NEVER use fixed delays** (use health checks)
   - ❌ **NEVER forget cleanup** (always use try/finally)

**Impact**: Zero test orchestration failures, consistent patterns

---

### Phase 8: Cleanup .github Folder Structure
**Goal**: Remove technical debt, organize knowledge base

**Actions**:
1. **Scan for obsolete files**:
   - Search for `.backup`, `.old`, `.temp` files
   - Identify duplicate documentation
   - Find broken cross-references

2. **Consolidate prompts.keys**:
   - Archive completed work (move to `.github/prompts.keys/_archive/`)
   - Keep only active keys
   - Verify work-log.md files are up to date

3. **Verify links**:
   - Check all `[link](file.md)` references
   - Validate all `#file:` attachments
   - Update broken paths

4. **Remove TEMP folders**:
   - Review `Workspaces/TEMP/` contents
   - Move valuable learnings to proper locations
   - Delete obsolete experiments

**Impact**: Cleaner workspace, faster searches, easier maintenance

---

## Implementation Order

### Rationale for Sequence

1. **Phase 1 First** (test-orchestration-patterns.md):
   - Foundation for Phases 6-7
   - Prevents blocking test-generation updates

2. **Phases 2-4 in Parallel** (question/task/plan updates):
   - Independent changes
   - Each improves specific agent workflow

3. **Phase 5 Before Phase 6** (port-instructions → total-recall):
   - Variables must be defined before population

4. **Phase 7 After Phases 1, 5-6** (test-generation):
   - Depends on orchestration patterns
   - Depends on launch variables

5. **Phase 8 Last** (cleanup):
   - Verify all changes work before cleanup
   - Don't accidentally delete needed references

---

## Success Metrics

### Before Optimization
- ❌ Test orchestration: 3-5 failed attempts before working pattern
- ❌ Question answers: 200+ lines with code snippets
- ❌ Planning: 20% incompatible recommendations
- ❌ Refactoring: Only when explicitly requested
- ❌ Portability: Manual variable replacement required

### After Optimization
- ✅ Test orchestration: 1 attempt (canonical pattern)
- ✅ Question answers: 20-30 lines (bulletted, concise)
- ✅ Planning: <5% incompatible recommendations (tech stack validation)
- ✅ Refactoring: Proactive detection in 80%+ of code reviews
- ✅ Portability: Zero manual configuration (total-recall auto-populates)

---

## Risk Mitigation

### Potential Issues

1. **Breaking Changes to Existing Workflows**:
   - **Risk**: Users rely on current verbose output
   - **Mitigation**: Add `verbosity=detailed` parameter to preserve old behavior
   - **Detection**: User says "too short" or "need more detail"

2. **Tech Stack Detection Failures**:
   - **Risk**: Unconventional project structures not detected
   - **Mitigation**: Fallback to user prompt if detection fails
   - **Detection**: Empty `{{FRAMEWORKS}}` variable after total-recall

3. **Refactoring False Positives**:
   - **Risk**: Agent suggests refactoring for intentional patterns
   - **Mitigation**: Always require user approval, never auto-refactor
   - **Detection**: User rejects >50% of suggestions

4. **Orchestration Pattern Incompatibility**:
   - **Risk**: Some apps can't use Start-Process (Docker, Linux, etc.)
   - **Mitigation**: Document OS-specific alternatives (bash scripts for Linux)
   - **Detection**: Windows-only patterns fail on macOS/Linux

---

## Rollback Plan

If optimization causes issues:

1. **Immediate Rollback**:
   ```bash
   git revert HEAD~1  # Revert last commit
   ```

2. **Selective Rollback**:
   ```bash
   git checkout HEAD~1 -- .github/prompts/question.prompt.md  # Restore single file
   ```

3. **Full System Restore**:
   ```bash
   git reset --hard <checkpoint-tag>  # Reset to pre-optimization state
   ```

---

## Next Steps

1. **Review and Approve Plan** (this document)
2. **Begin Phase 1** (test-orchestration-patterns.md)
3. **Sequential Execution** (Phases 2-8)
4. **Validation Testing** (verify each phase works before proceeding)
5. **Documentation Update** (record all changes in work-log.md)
6. **Checkpoint Commits** (create rollback points at each phase)

---

**Ready to proceed with implementation?**
