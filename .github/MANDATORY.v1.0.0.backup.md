# MANDATORY OPERATING RULES (GLOBAL)

> **⚠️ CRITICAL**: This file MUST be loaded FIRST by ALL prompts before any work begins.  
> **Purpose**: Single source of truth for non-negotiable operating constraints.  
> **Enforcement**: Violations HALT execution immediately.
> 
> **🔒 MODIFICATION PROTECTION**:
> - ❌ **NEVER modify this file** unless explicitly instructed by user
> - ❌ **NO prompts or agents** may update these rules autonomously
> - ✅ **User approval REQUIRED** before ANY changes to this file
> - ⚠️ **If user request conflicts** with rules in this file → HALT and ask user for clarification
> - 📝 **Version control**: All changes must be committed with user-approved message

**Version:** 1.0.0  
**Created:** 2025-10-30  
**Applies To:** ALL prompts in `.github/prompts/`
**Last Modified By:** User (2025-10-30)

---

## 🚨 CRITICAL ENFORCEMENT PROTOCOL

**ALL prompts must validate these 3 rules BEFORE starting work:**

1. [No Code in Chat](#1-no-code-in-chat-absolute-rule) - Implementation code NEVER appears in user responses
2. [Document First](#2-document-first-mandatory) - Update KDS files BEFORE code changes
3. [Playwright Orchestration](#3-playwright-orchestration-mandatory) - Use dotnet orchestration scripts, not PowerShell

**Validation:** Execute `ValidateMandatoryCompliance()` before ANY user-facing output

---

## 1. NO CODE IN CHAT (ABSOLUTE RULE)

### ❌ PROHIBITED in User Responses

**NEVER show these in chat:**
- ```csharp, ```javascript, ```typescript, ```html, ```css, ```sql, ```razor code blocks
- Method implementations (complete or partial)
- Function bodies with logic
- Component markup structures (HTML elements with attributes)
- CSS styling rules (selectors with properties)
- SQL statements (SELECT, INSERT, UPDATE, DELETE)
- Algorithm implementations
- Code walkthroughs or examples

**Why:** Chat is for architecture/planning, NOT implementation details.

### ✅ ALLOWED in User Responses

**Architectural descriptions ONLY:**
- File paths: `AssetProcessingService.cs (line 384)`
- Method signatures: `ShareAsset(string shareId, string assetType)`
- Data flow: `Component A → Service B → Hub C → Client D`
- Change summaries: "Added CreateShareButtonHtml method returning HTML string"
- Configuration JSON ≤10 lines (pure settings, no logic)
- Shell commands: `dotnet build`, `git checkout -b feature/new`

### 📁 Where Implementation Code Goes

**ALL implementation details → `.github/key-data-streams/{key}/`**

**Required files:**
- `{key}.plan.md` - Complete implementation plans with code examples
- `work-log.md` - Detailed execution logs with method implementations
- `{key}.plan.json` - Structured plan data

**Reference pattern in chat:**
```markdown
Implementation → See {key}.plan.md section "Code Implementation"
Full method → See {key}/work-log.md lines 150-200
```

### 🔍 Validation Algorithm

```
FUNCTION ValidateNoCodeInChat(response):
  
  # Check for code blocks (except config JSON ≤10 lines)
  codeBlocks = response.FindAll("```(csharp|javascript|typescript|html|css|sql|razor)")
  
  FOR EACH block IN codeBlocks:
    IF block.language != "json" OR block.lineCount > 10 THEN
      RETURN {
        violation: true,
        type: "CODE_IN_CHAT",
        block: block,
        message: "Implementation code detected in user response"
      }
    END IF
  END FOR
  
  # Check for method implementations (signatures with bodies)
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
  
  RETURN { violation: false }
  
END FUNCTION
```

### 🛑 Enforcement Action

```
IF ValidateNoCodeInChat(response).violation THEN
  
  # Log violation
  LogViolation(".github/audits/mandate-violations.log", {
    timestamp: Now(),
    rule: "NO_CODE_IN_CHAT",
    prompt: CurrentPrompt,
    key: CurrentKey,
    violation: validationResult
  })
  
  # HALT response
  SHOW_ERROR("MANDATE VIOLATION: Implementation code detected in response")
  SHOW_FIX("Move implementation details to {key}.plan.md or work-log.md")
  
  # Rewrite response (remove code, add references)
  response = RewriteWithArchitecturalDescriptions(response)
  response += "\n\nImplementation details → See {key}.plan.md"
  
  # Re-validate
  RETRY ValidateNoCodeInChat(response)
  
END IF
```

---

## 2. DOCUMENT FIRST (MANDATORY)

### 📋 Protocol

**Documentation updates MUST precede code implementation:**

1. ✅ Update `work-log.md` with session entry FIRST
2. ✅ Update `{key}.plan.md` with phase context (if exists)
3. ✅ Commit documentation changes to git
4. ❌ HALT if documentation updates fail
5. ❌ BLOCK code commits without prior documentation commits

**Why:** Captures intent before execution; enables crash recovery and context restoration.

### 🔍 Validation Algorithm

```
FUNCTION ValidateDocumentFirst(key):
  
  # Check if key folder exists
  keyFolder = ".github/key-data-streams/{key}/"
  IF NOT FolderExists(keyFolder) THEN
    RETURN { violation: false, reason: "New key (no prior documentation)" }
  END IF
  
  # Get git commits for this key
  commits = Git("log --grep='({key}):' --oneline -20")
  
  # Separate documentation vs code commits
  docCommits = commits.Filter(c => c.StartsWith("doc({key}):"))
  codeCommits = commits.Filter(c => c.StartsWith("task({key}):") OR c.StartsWith("ckpt({key}):"))
  
  # Check if code committed before documentation
  IF codeCommits.Count > 0 AND docCommits.Count > 0 THEN
    latestDoc = Git("log --grep='doc({key}):' --format='%at' -1")  # Unix timestamp
    latestCode = Git("log --grep='task({key}):' --format='%at' -1")
    
    IF latestCode > latestDoc THEN
      RETURN {
        violation: true,
        type: "CODE_BEFORE_DOCS",
        lastDoc: latestDoc,
        lastCode: latestCode,
        message: "Code committed BEFORE documentation update"
      }
    END IF
  END IF
  
  # Check if work-log.md updated in this session
  workLog = "{keyFolder}work-log.md"
  IF FileExists(workLog) THEN
    lastModified = GetFileTimestamp(workLog)
    sessionStart = Now() - 5 minutes  # Reasonable threshold
    
    IF lastModified < sessionStart THEN
      RETURN {
        violation: true,
        type: "STALE_WORKLOG",
        lastModified: lastModified,
        message: "work-log.md not updated in this session"
      }
    END IF
  END IF
  
  RETURN { violation: false }
  
END FUNCTION
```

### 🛑 Enforcement Action

```
IF ValidateDocumentFirst(key).violation THEN
  
  # Log violation
  LogViolation(".github/audits/mandate-violations.log", {
    timestamp: Now(),
    rule: "DOCUMENT_FIRST",
    key: key,
    violation: validationResult
  })
  
  # HALT execution
  SHOW_ERROR("MANDATE VIOLATION: Documentation not updated before code changes")
  SHOW_FIX("Execute: .github/prompts/shared/step-2-5-document-first-checkpoint.md")
  
  # Auto-fix: Update documentation now
  ExecuteModule("step-2-5-document-first-checkpoint.md", {
    key: key,
    userRequest: CurrentRequest,
    phase: CurrentPhase
  })
  
  # Verify fix
  RETRY ValidateDocumentFirst(key)
  
END IF
```

### 📄 Implementation Module

**See:** `.github/prompts/shared/step-2-5-document-first-checkpoint.md` for complete protocol

**Templates:**
- Session start entry for work-log.md
- Plan update for {key}.plan.md
- Commit message format

---

## 3. PLAYWRIGHT ORCHESTRATION (MANDATORY)

### 🎯 Protocol

**Launch app in SEPARATE WINDOW using dotnet orchestration scripts:**

1. ✅ Use orchestration scripts: `Scripts/run-{feature}-tests.ps1`
2. ✅ Launch app with direct `dotnet.exe` (not PowerShell nested processes)
3. ✅ Health check with port binding validation + HTTP check
4. ✅ Support `-Headed` and `-KeepAppRunning` flags
5. ❌ NEVER use `dotnet run` in terminal for tests
6. ❌ NEVER use `PW_MODE=standalone` or `webServer` config (deprecated)
7. ❌ NEVER use `Start-Job` or PowerShell background operator `&`

**Why:** Eliminates nested process hierarchies; faster health checks; reliable cleanup.

### 🔍 Validation Algorithm

```
FUNCTION ValidatePlaywrightOrchestration(testCommand):
  
  # Check if using orchestration script
  orchestrationPattern = "Scripts/run-.*-tests?.ps1"
  
  IF NOT testCommand.Matches(orchestrationPattern) THEN
    
    # Check for prohibited patterns
    prohibitedPatterns = [
      "dotnet run",
      "PW_MODE=standalone",
      "webServer",
      "Start-Job",
      "& dotnet",
      "npx playwright test" (without orchestration script)
    ]
    
    FOR EACH pattern IN prohibitedPatterns:
      IF testCommand.Contains(pattern) THEN
        RETURN {
          violation: true,
          type: "PROHIBITED_PATTERN",
          pattern: pattern,
          message: "Using prohibited Playwright launch pattern"
        }
      END IF
    END FOR
    
    RETURN {
      violation: true,
      type: "NO_ORCHESTRATION_SCRIPT",
      message: "Not using Scripts/run-{feature}-tests.ps1 orchestration"
    }
  END IF
  
  # Validate orchestration script uses dotnet.exe directly
  script = ReadFile(testCommand)
  
  IF NOT script.Contains("Start-Process -FilePath \"dotnet\"") THEN
    RETURN {
      violation: true,
      type: "MISSING_DIRECT_DOTNET",
      message: "Orchestration script not using direct dotnet.exe launch"
    }
  END IF
  
  # Validate health check with port binding
  IF NOT script.Contains("SkipCertificateCheck") THEN
    RETURN {
      violation: true,
      type: "MISSING_SSL_SKIP",
      message: "Health check not using -SkipCertificateCheck"
    }
  END IF
  
  RETURN { violation: false }
  
END FUNCTION
```

### 🛑 Enforcement Action

```
IF ValidatePlaywrightOrchestration(command).violation THEN
  
  # Log violation
  LogViolation(".github/audits/mandate-violations.log", {
    timestamp: Now(),
    rule: "PLAYWRIGHT_ORCHESTRATION",
    command: command,
    violation: validationResult
  })
  
  # HALT execution
  SHOW_ERROR("MANDATE VIOLATION: Not using Playwright orchestration script")
  SHOW_FIX("Use: Scripts/run-{feature}-tests.ps1 (see PlaywrightTestOrchestration.md)")
  
  # Suggest correct pattern
  SHOW_EXAMPLE("""
    # Create orchestration script
    Scripts/run-{feature}-tests.ps1
    
    # Pattern:
    1. Cleanup: Stop existing processes
    2. Launch: Start-Process -FilePath "dotnet" -ArgumentList "run"
    3. Health: Invoke-WebRequest -SkipCertificateCheck
    4. Test: npx playwright test {test-file}
    5. Cleanup: Stop-Process (or -KeepAppRunning flag)
  """)
  
  # Block execution
  EXIT 1
  
END IF
```

### 📄 Implementation References

**See:** `.github/instructions/Links/PlaywrightTestOrchestration.md` for complete pattern

**Examples:**
- `Scripts/run-hcp-fab-button-tests.ps1`
- `Scripts/run-debug-panel-percy-tests.ps1`
- `Scripts/run-transcript-canvas-visual-tests.ps1`

**Orchestration Template:**
```powershell
# 1. Cleanup
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Launch app (separate window)
$appProcess = Start-Process -FilePath "dotnet" `
                            -ArgumentList "run" `
                            -WorkingDirectory "SPA\NoorCanvas" `
                            -WindowStyle Normal `
                            -PassThru

# 3. Health check
$appReady = $false
$attempt = 0
while (-not $appReady -and $attempt -lt 30) {
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:9091" `
                                      -SkipCertificateCheck `
                                      -TimeoutSec 2 `
                                      -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) { $appReady = $true }
    } catch {
        Start-Sleep -Seconds 2
    }
}

# 4. Run tests
npx playwright test Tests/UI/{test-file}.spec.ts --reporter=list

# 5. Cleanup
if (-not $KeepAppRunning) {
    $appProcess | Stop-Process -Force
}
```

---

## 🔒 Global Validation Function

**Execute BEFORE sending ANY user-facing output:**

```
FUNCTION ValidateMandatoryCompliance():
  
  # Rule 1: No code in chat
  codeValidation = ValidateNoCodeInChat(CurrentResponse)
  IF codeValidation.violation THEN
    HandleViolation(codeValidation)
    HALT
  END IF
  
  # Rule 2: Document first
  IF CurrentKey EXISTS THEN
    docValidation = ValidateDocumentFirst(CurrentKey)
    IF docValidation.violation THEN
      HandleViolation(docValidation)
      HALT
    END IF
  END IF
  
  # Rule 3: Playwright orchestration (if applicable)
  IF CurrentTask.Contains("playwright") OR CurrentTask.Contains("test") THEN
    testValidation = ValidatePlaywrightOrchestration(CurrentTestCommand)
    IF testValidation.violation THEN
      HandleViolation(testValidation)
      HALT
    END IF
  END IF
  
  # All validations passed
  RETURN { compliant: true }
  
END FUNCTION


FUNCTION HandleViolation(violation):
  
  # Log to audit file
  LogViolation(".github/audits/mandate-violations.log", {
    timestamp: Now(),
    rule: violation.type,
    prompt: CurrentPrompt,
    key: CurrentKey,
    details: violation
  })
  
  # Show error to user
  SHOW_ERROR("MANDATORY RULE VIOLATION: {violation.message}")
  SHOW_FIX(violation.suggestedFix)
  
  # Attempt auto-fix if available
  IF violation.autoFixAvailable THEN
    ExecuteAutoFix(violation)
    RETRY ValidateMandatoryCompliance()
  ELSE
    # Cannot auto-fix - halt execution
    EXIT 1
  END IF
  
END FUNCTION
```

---

## 📊 Prompt Integration

**ALL prompts MUST include this at the top:**

```markdown
# {Prompt Name}

**LOAD FIRST:** `.github/MANDATORY.md`

**Purpose:** {prompt-purpose}
**Version:** {version}

---

## Pre-Work Validation

**Execute BEFORE any work begins:**

```
# Load mandatory rules
LOAD_MODULE(".github/MANDATORY.md")

# Validate compliance
validation = ValidateMandatoryCompliance()

IF NOT validation.compliant THEN
  # Violations detected - halt
  EXIT 1
END IF

# Proceed with prompt-specific work
...
```
```

---

## 🗂️ File Organization

**Mandate hierarchy:**

```
.github/
├── MANDATORY.md                           ← THIS FILE (single source of truth)
│
├── instructions/
│   └── SelfAwareness.instructions.md     ← References MANDATORY.md
│
└── prompts/
    ├── *.prompt.md                        ← ALL load MANDATORY.md first
    │
    └── shared/
        ├── CONCISE-MANDATE.md             ← DEPRECATED (merged into MANDATORY.md)
        ├── snippet-handling-policy.md     ← DEPRECATED (merged into MANDATORY.md)
        ├── output-style-mandate.md        ← DEPRECATED (merged into MANDATORY.md)
        │
        ├── step-2-5-document-first-checkpoint.md  ← Implementation (called by MANDATORY.md)
        └── PlaywrightTestOrchestration.md         ← Pattern guide (referenced by MANDATORY.md)
```

**Migration path:**
- Existing prompts reference CONCISE-MANDATE.md → Update to reference MANDATORY.md
- Detailed implementations stay in shared/ folder (step-2-5, PlaywrightTestOrchestration)
- SelfAwareness.instructions.md updated to reference MANDATORY.md as canonical source

---

## 🔍 Audit Trail

**Violations logged to:** `.github/audits/mandate-violations.log`

**Log format:**
```json
{
  "timestamp": "2025-10-30T12:34:56Z",
  "rule": "NO_CODE_IN_CHAT",
  "prompt": "task.prompt.md",
  "key": "hcp-cleanup",
  "violation": {
    "type": "CODE_IN_CHAT",
    "block": "```csharp\npublic async Task...",
    "message": "Implementation code detected in user response"
  },
  "resolution": "Auto-fixed: Moved to hcp-cleanup.plan.md",
  "status": "resolved"
}
```

**Review violations:**
```powershell
# View all violations
Get-Content .github/audits/mandate-violations.log | ConvertFrom-Json | Format-Table

# Filter by rule
Get-Content .github/audits/mandate-violations.log | ConvertFrom-Json | Where-Object { $_.rule -eq "NO_CODE_IN_CHAT" }
```

---

## 🚀 Quick Reference

**Before ANY work:**
1. Load `.github/MANDATORY.md`
2. Execute `ValidateMandatoryCompliance()`
3. If violations → HALT and fix
4. If compliant → Proceed with work

**3 Critical Rules:**
1. ❌ No code in chat → Use architectural descriptions
2. 📝 Document first → Update KDS before code
3. 🎭 Playwright orchestration → Use `Scripts/run-*-tests.ps1`

**Enforcement:**
- Violations logged to `.github/audits/mandate-violations.log`
- Auto-fix attempted when possible
- Manual fix required if auto-fix unavailable
- Work HALTS until compliance achieved

---

## 📚 Related Documentation

**Core References:**
- `.github/instructions/SelfAwareness.instructions.md` - Global operating guardrails
- `.github/instructions/Links/SystemIndex.md` - Central navigation hub

**Implementation Modules:**
- `.github/prompts/shared/step-2-5-document-first-checkpoint.md` - Document-first protocol
- `.github/instructions/Links/PlaywrightTestOrchestration.md` - Playwright orchestration pattern

**Deprecated (content merged here):**
- `.github/prompts/shared/CONCISE-MANDATE.md` → Merged into MANDATORY.md Rule 1
- `.github/prompts/shared/snippet-handling-policy.md` → Merged into MANDATORY.md Rule 1
- `.github/prompts/shared/output-style-mandate.md` → Merged into MANDATORY.md Rule 1

---

**This file is MANDATORY and applies to ALL prompts without exception.**

**Last Updated:** 2025-10-30  
**Maintainer:** System  
**Version:** 1.0.0
