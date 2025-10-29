````markdown
# Snippet Handling Policy (GLOBAL)

**Version:** 1.0.0  
**Last Updated:** 2025-10-29  
**Purpose:** Unified policy for when and how code snippets should appear in Copilot responses

---

## Core Principle

**Implementation code NEVER appears in user-facing chat responses.**

All implementation details, code examples, and technical snippets go into key data stream files (`.github/key-data-streams/{key}/`), never in chat output.

---

## What is PROHIBITED in Chat Responses

### ❌ Implementation Code Blocks

**NEVER show these in chat:**
- C# methods, classes, properties, interfaces
- JavaScript/TypeScript functions, classes, objects
- HTML elements with attributes and content
- CSS rules, selectors, and styling
- SQL queries (SELECT, INSERT, UPDATE, DELETE)
- Razor markup (@code blocks, @inject, component syntax)
- Python functions, classes, methods
- Any other programming language implementation

**Examples of PROHIBITED content:**

```
❌ DO NOT SHOW:
```csharp
public async Task<IActionResult> GetSession(int sessionId)
{
    var session = await _context.Sessions.FindAsync(sessionId);
    return Ok(session);
}
```

❌ DO NOT SHOW:
```typescript
async function loadParticipants() {
    const response = await fetch('/api/participants');
    const data = await response.json();
    return data;
}
```

❌ DO NOT SHOW:
```html
<div class="card">
    <h2>Title</h2>
    <p>Description</p>
</div>
```
```

### ❌ Code Snippets (Inline Examples)

**NEVER include these patterns:**
- Method implementations (even partial)
- Function bodies with logic
- Component markup structures
- CSS styling examples
- SQL statement examples
- Algorithm implementations
- Code walkthroughs

---

## What is ALLOWED in Chat Responses

### ✅ Architectural Descriptions

**USE PROSE, not code:**
- File paths with line numbers: `AssetProcessingService.cs (lines 361-394)`
- Method signatures: `ShareAsset(string shareId, string assetType)`
- Class names: `ParticipantHub`, `SessionService`
- Component names: `HostControlPanel.razor`, `Canvas.razor`
- Data flow: `Component A → Service B → Hub C → Client D`
- Change summaries: "Added CreateShareButtonHtml method that returns HTML string"

### ✅ Configuration Snippets (Limited)

**ONLY for settings, never for logic:**

**Allowed patterns:**
- JSON configuration for appsettings.json (≤10 lines)
- Environment variables
- Connection strings (sanitized)
- Feature flags

**Format restriction:**
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  }
}
```

**Maximum:** 10 lines of pure configuration data (no logic, no code)

### ✅ Operational Commands

**Shell commands for actions:**

**Allowed patterns:**
- PowerShell scripts for operations
- Git commands
- npm/dotnet commands
- Terminal operations

**Examples:**
```powershell
dotnet build
```

```bash
git checkout -b feature/new-button
```

```powershell
.\Workspaces\Global\nc.ps1
```

**Purpose:** These are operational commands, not implementation code

### ✅ Error Messages & Stack Traces

**For debugging context only:**
- Truncated error messages (≤20 lines)
- Relevant stack trace portions
- Exception details with file/line references

**Must focus on:**
- Error message text
- File and line number
- Relevant context (NOT full method implementations)

### ✅ Structural Templates

**Format/structure examples WITHOUT implementation:**

**Allowed patterns:**
- File structure diagrams
- Directory trees
- Data format templates (no logic)
- API response shapes (schema only)

**Example:**
```
project/
├── Controllers/
│   └── SessionController.cs
├── Services/
│   └── SessionService.cs
└── Models/
    └── Session.cs
```

---

## Where Implementation Code MUST Go

### Key Data Stream Files

**All implementation details → `.github/key-data-streams/{key}/`**

**Required files:**
- `{key}.plan.md` - Complete implementation plans with code examples
- `work-log.md` - Detailed work logs with method implementations
- `{key}.plan.json` - Structured plan data

**Content allowed in these files:**
- Complete method implementations
- Full code examples
- Detailed algorithm explanations
- HTML/CSS/JavaScript examples
- SQL queries and schema changes
- Testing code and fixtures

**Reference pattern in chat:**
```markdown
Implementation details → See {key}.plan.md section "Code Implementation"
Full method → See {key}/work-log.md lines 150-200
Testing strategy → See {key}.plan.md section "Testing"
```

---

## Enforcement Rules

### Response Validation (MANDATORY)

**Before sending ANY response to user:**

1. **Scan for implementation code blocks**
   - Check for: ```csharp, ```javascript, ```typescript, ```html, ```css, ```sql, ```razor, ```python
   - Exception: configuration JSON ≤10 lines
   - Action: BLOCK response if found

2. **Scan for code snippets**
   - Check for: method bodies, function implementations, algorithm walkthroughs
   - Action: BLOCK response if found

3. **Verify architectural descriptions**
   - Ensure: File paths + method names + prose descriptions ONLY
   - Action: REWRITE if implementation details present

4. **Check key data stream references**
   - Ensure: Implementation details referenced in {key}.plan.md or work-log.md
   - Action: ADD reference if missing

**Validation Algorithm:**
See `.github/prompts/shared/output-validator.md` for complete validation process

### Auto-Fail Triggers

**These violations BLOCK responses immediately:**
- Any ```csharp, ```javascript, ```typescript, ```html, ```css, ```razor, ```sql block with implementation
- Method implementations (complete or partial)
- Function bodies with logic
- Component markup structures
- SQL statements (SELECT/INSERT/UPDATE/DELETE)
- Algorithm implementations
- >10 lines of JSON configuration

**Exception:** Configuration JSON ≤10 lines for pure settings

---

## Special Cases

### Teaching & Explanation

**When explaining concepts:**
- ❌ Do NOT use code examples
- ✅ DO use architectural descriptions
- ✅ DO use prose explanations
- ✅ DO reference external documentation

**Example:**

❌ WRONG:
```
Here's how to implement authentication:
```csharp
[Authorize]
public class SessionController : ControllerBase
{
    // ...
}
```
```

✅ CORRECT:
```
Authentication implementation:
1. Add [Authorize] attribute to SessionController
2. Configure authentication middleware in Program.cs
3. Set up JWT token validation in appsettings.json

Implementation → See {key}.plan.md section "Authentication Setup"
```

### Debugging Assistance

**When helping debug issues:**
- ❌ Do NOT show corrected code implementations
- ✅ DO describe the issue architecturally
- ✅ DO point to specific files/lines
- ✅ DO explain the fix in prose

**Example:**

❌ WRONG:
```
Replace this code:
```csharp
var session = _context.Sessions.Find(id);
```

With this:
```csharp
var session = await _context.Sessions.FindAsync(id);
```
```

✅ CORRECT:
```
Issue: Synchronous database call in SessionService.cs line 42
Fix: Change Sessions.Find(id) to Sessions.FindAsync(id) and await the result
File: SessionService.cs line 42
Implementation → See {key}/work-log.md for complete fix
```

### Test Generation

**When generating tests:**
- ✅ Test code goes in `.spec.ts` files (created via tools, not shown in chat)
- ❌ Do NOT show test implementations in chat
- ✅ DO describe test scenarios architecturally
- ✅ DO reference test files created

**Example:**

❌ WRONG:
```
Here's the test:
```typescript
test('should load participants', async () => {
    await page.goto('/session/canvas/ABC123');
    // ... more test code
});
```
```

✅ CORRECT:
```
Test created: multi-browser-participant-isolation.spec.ts
Scenarios covered:
1. Load participants via API (/api/session/{token}/participants)
2. Verify unique participants per browser context
3. Validate SignalR connection isolation

Test file → Tests/UI/multi-browser-participant-isolation.spec.ts
```

---

## Summary

**Simple Rule:**
- **In chat:** Describe WHAT and WHERE (architecture, files, methods)
- **In key files:** Show HOW (implementation, code, examples)

**Validation:**
- All responses validated before sending (see output-validator.md)
- Implementation code BLOCKS response
- Key data stream references REQUIRED for details

**References:**
- Global mandate: `.github/prompts/shared/CONCISE-MANDATE.md`
- Output style: `.github/prompts/shared/output-style-mandate.md`
- Validation: `.github/prompts/shared/output-validator.md`

---

**This policy is GLOBAL and applies to ALL prompts without exception.**
````
