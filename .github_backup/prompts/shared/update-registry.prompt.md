# update-registry.prompt.md (System Registry Update Agent v1.0)

---
mode: agent
purpose: On-demand update of .github/SYSTEM-REGISTRY.md to reflect current prompts, tools, frameworks, and technology stack
inputs: scope, verify-only, -test
outputs: Updated SYSTEM-REGISTRY.md with current system state
lastUpdated: 2025-10-28
stateTracking: enabled
acceptsFrom: [user, enhance-prompts, healthcheck, project-enhancement]
calls: []
relatedFiles: [.github/SYSTEM-REGISTRY.md, package.json, **/*.csproj, .github/prompts/**/*.md]
---

## Purpose
Update `.github/SYSTEM-REGISTRY.md` to maintain an accurate, live inventory of all prompts, internal prompts, tools, frameworks, libraries, and technology stack configured in the application.

**Version:** 1.0.0  
**Changelog:**
- **v1.0.0 (2025-10-28)**: Initial creation - On-demand registry update agent

---

## Parameters

### scope *(optional, default=`all`)*
Update scope:
- `all` - Full registry update (prompts + stack + tools)
- `prompts` - Update only prompt listings (user-facing + internal)
- `stack` - Update only technology stack (backend, frontend, testing, quality)
- `tools` - Update only development tools and infrastructure
- `config` - Update only configuration files and VS Code tasks

### verify-only *(optional, default=false)*
When `true`, performs a dry-run comparison showing what would change without modifying the registry.

### -test *(flag, optional)*
Enable validation using `.github/prompts/shared/prompt-test-validation-framework.md`

---

## Critical Rules
1. **MAX 15 bullets** per response (see `.github/prompts/shared/CONCISE-MANDATE.md`)
2. **NO code blocks** in response - Update happens in registry file
3. **VALIDATE sources** - Only add entries that exist in the workspace
4. **Preserve structure** - Maintain registry table formats and sections
5. **Update version history** - Append to version table at bottom

---

## User-Facing Output Style (MANDATORY)
Must follow `.github/prompts/shared/output-style-mandate.md`.

Use the two-section format:
- 🧠 **Copilot Analysis** (internal reasoning)
- 📌 **Summary for You** (user-facing update summary)

---

## Update Algorithm

### Phase 1: Discovery
```
DISCOVER prompts:
  - Scan .github/prompts/*.prompt.md (user-facing)
  - Scan .github/prompts/internal/**/*.prompt.md (internal)
  - Extract: name, purpose, usage, calls, acceptsFrom

DISCOVER stack:
  - Read package.json for npm dependencies
  - Read SPA/NoorCanvas/NoorCanvas.csproj for NuGet packages
  - Read Tools/*/*.csproj for additional packages
  - Extract: name, version, purpose

DISCOVER tools:
  - Scan Scripts/*.ps1, Scripts/*.bat
  - Scan .guards/*.ps1
  - Scan .hooks/*
  - Extract: name, purpose, location

DISCOVER config:
  - Read .vscode/tasks.json (via workspace task list)
  - Read config/*.json
  - Extract: task names, purposes, configurations
```

### Phase 2: Categorization
```
CATEGORIZE prompts:
  - User-facing: .github/prompts/*.prompt.md
  - Internal by subdirectory: comm/, knowledge/, ops/, quality/, util/
  - Shared infrastructure: .github/prompts/shared/*.md

CATEGORIZE stack:
  - Backend: .NET, ASP.NET Core, EF Core, SignalR, Serilog
  - Frontend: Blazor, MudBlazor, HTML parsers
  - Testing: Playwright, Percy, TypeScript, MSSQL
  - Quality: Roslynator, StyleCop, ESLint, Prettier, Stylelint
  - External Services: Azure OpenAI, Cloudflare

CATEGORIZE tools:
  - Package managers: NuGet, npm
  - Build tools: dotnet, MSBuild, tsc
  - Development: VS Code, PowerShell, Git
  - Testing: Playwright runners, Percy CLI
```

### Phase 3: Update Registry
```
IF verify-only THEN
  REPORT differences between current registry and discovered state
  EXIT without modifying file
ELSE
  UPDATE .github/SYSTEM-REGISTRY.md sections based on scope:
    - Prompt System (if scope = all | prompts)
    - Technology Stack (if scope = all | stack)
    - Development Tools (if scope = all | tools)
    - Infrastructure (if scope = all | tools)
    - Configuration Files (if scope = all | config)
    - VS Code Tasks (if scope = all | config)
  
  UPDATE version history table:
    - Append new row with current date
    - Set changes description based on scope
    - Set "Updated By" = "update-registry prompt"
  
  UPDATE "Last Updated" at top of file
```

### Phase 4: Validation
```
VALIDATE updated registry:
  - All referenced files exist
  - All package versions match source files
  - All prompt metadata is accurate
  - Table formatting is preserved
  - Links are not broken
  - Version history is appended (not replaced)
```

---

## Usage Examples

### Full Update
```
#update-registry
```
or
```
#update-registry scope=all
```

### Update Only Prompts
```
#update-registry scope=prompts
```

### Verify Without Updating
```
#update-registry verify-only=true
```

### Update Stack After Package Changes
```
#update-registry scope=stack
```

### Update After New Task Definition
```
#update-registry scope=config
```

---

## Output Format

### Verify-Only Mode
```
🧠 Copilot Analysis
Discovered changes in the following sections:
- [Section Name]: [Brief description of changes]
- ...

📌 Summary for You
Registry verification complete. Found [N] changes across [M] sections:
• [Category]: [Number] additions, [Number] updates, [Number] removals
• ...

Run without verify-only flag to apply these changes.
```

### Update Mode
```
🧠 Copilot Analysis
Updated the following registry sections:
- [Section Name]: [Number] entries updated
- Version history: Appended entry

📌 Summary for You
✅ Registry updated successfully!

Updated sections:
• [Section 1]: [Brief description]
• [Section 2]: [Brief description]
• ...

Version bumped to [version] in history table.
```

---

## Error Handling

### Missing Source Files
If critical source files are missing (package.json, *.csproj), report error and exit:
```
❌ Cannot update registry: Missing critical source file [filename]
```

### Scope Not Recognized
If scope parameter is invalid:
```
❌ Invalid scope: [scope]. Valid options: all, prompts, stack, tools, config
```

### Registry File Missing
If `.github/SYSTEM-REGISTRY.md` doesn't exist:
```
❌ Registry file not found. Create it first using initial setup.
```

---

## Integration with Other Prompts

### Called By
- `enhance-prompts.prompt.md` - After prompt infrastructure changes
- `healthcheck.prompt.md` - During system health audits
- `project-enhancement.prompt.md` - After stack analysis/recommendations
- User direct invocation via `#update-registry`

### State Tracking
Logs update operations to `.github/key-data-streams/meta-registry-update/work-log.md`

---

## Related Files
- `.github/SYSTEM-REGISTRY.md` - The registry file being updated
- `.github/prompts/shared/validation-engine.md` - Validation rules
- `.github/prompts/shared/output-style-mandate.md` - Output formatting
- `.github/prompts/internal/enhance-prompts.prompt.md` - Prompt enhancement agent
- `package.json` - npm dependencies source
- `SPA/NoorCanvas/NoorCanvas.csproj` - NuGet dependencies source

---

## Notes
- This prompt is **read-mostly** - It reads many files but only writes to SYSTEM-REGISTRY.md
- Run after any significant changes to:
  - Prompt files
  - Package dependencies
  - VS Code task definitions
  - Infrastructure scripts
- The registry serves as the single source of truth for system capabilities
- All prompts should reference this registry for available tools and frameworks
