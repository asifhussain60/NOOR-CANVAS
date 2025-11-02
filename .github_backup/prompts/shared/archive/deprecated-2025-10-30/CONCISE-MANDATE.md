# CONCISE OUTPUT MANDATE (GLOBAL)

> **⚠️ DEPRECATED (2025-10-30)**: This file has been superseded by `.github/MANDATORY.md`  
> **Action Required**: All prompts should load `.github/MANDATORY.md` instead  
> **Reason**: Consolidated 3 mandate files into single source of truth  
> **Migration**: Content merged into MANDATORY.md Rule 1 (No Code in Chat)  
> **This file retained for reference only - DO NOT UPDATE**

**Superseded by:** `.github/MANDATORY.md` (loads FIRST in all prompts)

---

**ALL prompts MUST follow this for USER-FACING output. NO exceptions.**

---

## 🔒 CRITICAL ENFORCEMENT PROTOCOLS (Execute BEFORE any work)

### 1. DOCUMENT FIRST, RESPOND LATER (MANDATORY)
**Protocol:** `.github/prompts/shared/step-2-5-document-first-checkpoint.md`

**Rule:** Documentation updates MUST precede code implementation
- ✅ Update `work-log.md` with session entry FIRST
- ✅ Update `{key}.plan.md` with phase context (if exists)
- ✅ Commit documentation changes to git
- ❌ HALT if documentation updates fail
- ❌ BLOCK code commits without prior documentation commits

**Workflow:**
```
1. User provides request
2. Load context
3. → UPDATE DOCUMENTATION (work-log.md, plan.md)
4. → COMMIT DOCUMENTATION
5. Execute code implementation
6. Commit code changes
```

**Violation Detection:**
- Documentation commit timestamp > Code commit timestamp = VIOLATION
- Missing work-log.md session entry = VIOLATION
- Code changes without documentation context = VIOLATION

**Enforcement:** HALT execution, revert code commits, log violation

---

### 2. PLAYWRIGHT TEST ORCHESTRATION (MANDATORY)
**Protocol:** `.github/instructions/Links/PlaywrightTestOrchestration.md`

**Rule:** Launch app in SEPARATE WINDOW using PowerShell orchestrator
- ✅ Use orchestration scripts: `Scripts/run-{feature}-tests.ps1`
- ✅ Launch app with `Start-Process -WindowStyle Normal -PassThru`
- ✅ Health check with `-SkipCertificateCheck` (PowerShell 7+)
- ✅ Support `-Headed` and `-KeepAppRunning` flags
- ❌ NEVER use raw `dotnet run` in terminal for tests
- ❌ NEVER use nested PowerShell or background jobs

**Orchestration Pattern:**
```powershell
1. Cleanup existing processes
2. Launch app in new window (Start-Process)
3. Health check (Invoke-WebRequest with -SkipCertificateCheck)
4. Run Playwright tests (npx playwright test)
5. Cleanup or keep running (-KeepAppRunning flag)
```

**Examples:**
- `Scripts/run-hcp-fab-button-tests.ps1`
- `Scripts/run-debug-panel-percy-tests.ps1`
- `Scripts/run-transcript-canvas-visual-tests.ps1`

**Enforcement:** Use orchestration scripts ONLY, block raw terminal commands

---

## Hard Limits
1. MAX 25 bullets total per response
2. MAX 3 lines per bullet
3. **ZERO implementation code** - No code blocks or snippets in chat (see `.github/prompts/shared/snippet-handling-policy.md`)
4. **ONLY architectural descriptions** - File paths, method names, flow diagrams only
5. NO nested lists (flat structure only)
6. NO long paragraphs (bullets only)
7. NO code snippets or examples (not even as teaching examples)
8. File locations → `.github/key-data-streams/{key}/` only (NEVER in chat)
9. **Letter-based actions** - Always provide A/B/C/D options with **RECOMMENDED option in ALL CAPS**
10. **Enforcement validation** - Must validate before responding (see Enforcement section)
11. **DOCUMENT FIRST, RESPOND LATER** - MANDATORY documentation updates before code implementation
    - **Protocol:** `.github/prompts/shared/step-2-5-document-first-checkpoint.md`
    - **Rule:** Update work-log.md and plan.md BEFORE any code changes
    - **Commit:** Documentation commit MUST precede implementation commits
    - **Enforcement:** HALT if documentation updates fail or lag behind code
    - **Rationale:** Captures intent/context before execution, enables rollback, prevents drift
12. **VERIFY FILE FINALIZATION** - All key data stream files must exist before user output
    - **plan.prompt.md**: Verify `{key}.plan.md`, `{key}.plan.json`, `work-log.md`, `state.json` at Step 5.5
    - **task.prompt.md**: Verify `work-log.md` updated (within 60s) at Step 8.25
    - **todo.prompt.md**: Verify `work-log.md` appended (file size increased) before response
    - **Enforcement**: HALT if files missing, BLOCK subsequent steps, show error message
    - **See**: `.github/prompts/shared/file-finalization-verifier.md` for complete algorithm
13. **PLAYWRIGHT TEST ORCHESTRATION** - MANDATORY use of orchestration scripts for E2E tests
    - **Protocol:** `.github/instructions/Links/PlaywrightTestOrchestration.md`
    - **Rule:** Launch app in SEPARATE WINDOW using PowerShell orchestrator (not terminal commands)
    - **Pattern:** Cleanup → Launch → Health Check → Test → Cleanup
    - **Script Template:** Use `Start-Process -WindowStyle Normal -PassThru` for app launch
    - **Health Check:** Use `-SkipCertificateCheck` for localhost HTTPS (PowerShell 7+)
    - **Debugging:** Support `-Headed` and `-KeepAppRunning` flags
    - **Examples:** `Scripts/run-hcp-fab-button-tests.ps1`, `Scripts/run-debug-panel-percy-tests.ps1`
    - **Enforcement:** NEVER use `dotnet run` in terminal for tests - use orchestration scripts
14. **DEFAULT TO E2E EXECUTION** - After plan finalized, recommend auto-chain mode
    - **plan.prompt.md**: Show Option A (**AUTO-EXECUTE ALL PHASES**) as RECOMMENDED with 5s countdown
    - **Default behavior**: `auto-chain=true` (user must actively choose Option B for manual mode)
    - **Behavior**: Execute all phases automatically without approval gates
    - **Manual intervention**: Halt only when user action required (tests, migrations, failures)
    - **Rationale**: User approves plan once, execution proceeds end-to-end
    - **User control**: 5-second countdown allows abort/switch to manual mode
    - **See**: plan.prompt.md auto-chain parameter documentation

## What Code Means

**See:** `.github/prompts/shared/snippet-handling-policy.md` for complete policy

**❌ PROHIBITED - NEVER show in chat:**
- C# methods, classes, properties (public void, private string, etc.)
- JavaScript/TypeScript functions (function, const, let, arrow functions)
- HTML tags and structure (div, span, button elements with attributes)
- CSS rules and selectors (.class { property: value })
- SQL queries (SELECT, INSERT, UPDATE, DELETE statements)
- Razor markup (@code blocks, @inject, component syntax)

**✅ ALLOWED - Descriptions only:**
- File paths with line numbers: AssetProcessingService.cs (lines 361-394)
- Method signatures: ShareAsset(string shareId, string assetType)
- Architectural flow: Component A → Service B → Hub C → Client D
- Change summaries: Added CreateShareButtonHtml method, returns HTML string
- Data structures: Key-value pairs in text format (key: value)

**✅ ALLOWED - Configuration only:**
- JSON settings for appsettings.json (≤10 lines, no logic)
- PowerShell/Git commands for operations (exact commands only)
- Error messages for debugging (truncated, relevant portions)

## Where Code Details Go

**All implementation code → `{key}.plan.md` or `{key}/work-log.md`:**
- Complete method implementations
- HTML structure examples
- CSS styling details
- SQL queries
- JavaScript functions

**User-facing output → Architectural summaries:**
- What files changed
- What methods were added/modified
- Data flow descriptions
- High-level algorithm steps

## Response Structure

```
🧠 Analysis (≤8 bullets, 3 lines each)
- Key: {key}
- Routing: {prompts-used}
- Complexity: {simple|moderate|complex}
- Layers: {UI, API, Database, SignalR}
- Context: {visual|error|file} packages
- Assumptions: {1-2 brief assumptions}

📌 Summary (≤15 bullets, 3 lines each)
1. Key: {key} | Status: {status}
2. Work: {one-liner description}
3. Files: {count} modified ({file-list})
4. {architecture-description-bullets}
5. Testing: {manual|automated|percy} - {results}
6. Next: See options below

📋 Tasks (≤8 bullets when showing task breakdown)
- Task 1: {description}
- Task 2: {description}
- Dependencies: {task-relationships}

📊 Final (≤5 bullets)
- Status: {status}
- Key: {key}
- Documentation: {key}.plan.md updated
- Next: {primary-action}
- Options: See below
```

## Letter-Based Actions
Always provide 2-5 options with **RECOMMENDED option in ALL CAPS**:
- **A.** **AUTO-EXECUTE ALL PHASES** (for multi-phase plans - recommended, auto-starts in 5s)
- **B.** Manual mode (step-by-step with approval gates)
- **C.** Review Plan / Details
- **D.** Modify Approach
- **E.** Cancel / Skip

**Formatting:**
- Recommended option: Use **bold** + **ALL CAPS** for prominence
- For multi-phase plans: Option A (auto-chain) is RECOMMENDED with 5s countdown
- For single actions: Option A is RECOMMENDED
- Alternative: Increase font size using heading (e.g., `### A. AUTO-EXECUTE ALL PHASES`)
- User replies: "A", "manual", "cancel", or waits 5s for auto-execution

**Auto-Chain Preference:**
- When plan.prompt.md shows final plan: Default to Option A with 5s countdown
- When task.prompt.md shows phase completion: Use auto-chain flag from plan
- User approves plan ONCE, execution proceeds automatically (can abort with "manual" or "cancel")

## File Locations
All output → `.github/key-data-streams/{key}/` (authoritative location)
NEVER → Chat responses

## Step Descriptions (ALLOWED FORMAT)

**Describe changes with architectural bullets:**
- File: AssetProcessingService.cs (line 384)
- Method: CreateShareButtonHtml added
- Purpose: Generate blue action bar with Share Asset button
- Returns: HTML string with ks-share-button class
- Integration: Called by CreateAssetContainerHeaderHtml

**Reference documentation for details:**
- Implementation → See {key}.plan.md section "Code Implementation"
- Full methods → See {key}/work-log.md
- Testing → See {key}.plan.md section "Testing Strategy"

## Enforcement
Before responding:
1. Count bullets → Must be ≤25 total
2. Check line length → Must be ≤3 lines per bullet
3. Scan for code blocks → ZERO allowed (```csharp, ```js, ```html, ```css, ```sql, ```razor)
4. Scan for code snippets → ZERO allowed (inline code examples, method bodies)
5. Verify architectural descriptions → File paths + method names + flow only
6. Check for {key}.plan.md reference → Must point to docs for implementation details
7. **Verify file finalization** → All key data stream files must exist (see Rule 12)
8. **Verify documentation-first compliance** → Documentation commits MUST precede code commits (see Rule 11)
9. Check letter-based actions → Recommended option must be in **ALL CAPS**
10. **Check auto-chain recommendation** → For multi-phase plans, Option A should be RECOMMENDED
11. **Verify test orchestration** → Playwright tests use orchestration scripts, not raw terminal commands (see Rule 13)
12. Violations → AUTO-BLOCK response, rewrite without code/snippets

**Auto-fail triggers:**
- Any ```csharp, ```javascript, ```html, ```css, ```razor, ```sql, ```typescript block
- Code snippets (method implementations, function bodies, component markup)
- HTML element structures (complete tags with attributes)
- CSS rule sets (selectors with property:value pairs)
- SQL statements (full queries or commands)
- Inline code examples (even for teaching purposes)
- **Missing key data stream files** (plan.md, plan.json, work-log.md)
- Exception: JSON config snippets ≤10 lines for settings only

## Special Cases

**Configuration files (appsettings.json, package.json):**
- ✅ ALLOWED: JSON snippets for settings only (≤10 lines)
- Must be pure configuration (no logic or code)
- Label clearly as "Configuration Change"

**Git commands, PowerShell scripts:**
- ✅ ALLOWED: Exact operational commands to run
- Format: Command to execute (not script internals)
- Example: git checkout -b feature/new-button

**Error messages, stack traces:**
- ✅ ALLOWED: For debugging context only
- Truncate if >20 lines, show relevant portions
- Focus on error message and file/line references

**NEVER ALLOWED regardless of context:**
- Method/function implementations
- HTML element structures with content
- CSS styling rules
- SQL query statements
- Component markup (Razor, JSX, Vue)
