# KDS v3.0 Implementation Plan - Industry Best Practices
**Version:** 3.0.0  
**Date:** 2025-11-02  
**Status:** 📋 DOCUMENTATION PHASE  
**Framework:** .NET 8.0 (Blazor) + Playwright + PowerShell

---

## 📋 Executive Summary

This plan documents the complete implementation of KDS v3.0 using **industry-standard prompt engineering best practices** before any code execution. The redesign eliminates all legacy complexity and creates a production-ready system with:

- **Structured Output Validation** - XML/JSON schema-based responses
- **Tool Integration** - NuGet packages for prompt testing and validation
- **Template Engine** - Mustache/Handlebars for user-facing output
- **Automated Testing** - Prompt regression testing suite
- **Performance Monitoring** - Token usage and response time tracking
- **Version Control** - Semantic versioning for all prompts

---

## 🎯 Design Philosophy (Industry Best Practices)

### 1. Separation of Concerns (Prompt Engineering Pattern)

**Principle:** Each prompt is a microservice with single responsibility

**Implementation:**
```
route.prompt.md     → Router/Gateway (detects intent)
plan.prompt.md      → Orchestrator (creates execution graph)
execute.prompt.md   → Worker (implements changes)
test.prompt.md      → Validator (ensures quality)
validate.prompt.md  → Health Monitor (system status)
govern.prompt.md    → Gatekeeper (compliance)
```

**Anti-Pattern (Avoided):** Monolithic prompts that try to do everything

---

### 2. Structured Output (OpenAI Best Practice)

**Principle:** All LLM responses follow strict schemas for reliability

**Implementation:**

**XML Schema for Plan Output:**
```xml
<!-- plan-output-schema.xsd -->
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="PlanOutput">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Key" type="xs:string"/>
        <xs:element name="Phases" type="PhaseListType"/>
        <xs:element name="EstimatedDuration" type="xs:string"/>
        <xs:element name="NextCommand" type="xs:string"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>
```

**JSON Schema for Handoffs:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "KDS Handoff Schema",
  "type": "object",
  "required": ["key", "action", "data"],
  "properties": {
    "key": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "description": "KDS key identifier (lowercase, hyphen-separated)"
    },
    "action": {
      "type": "string",
      "enum": ["plan", "execute", "test", "validate", "govern"]
    },
    "phase": {
      "type": "integer",
      "minimum": 1
    },
    "task": {
      "type": "string",
      "pattern": "^[0-9]+[a-z]$"
    },
    "data": {
      "type": "object",
      "required": ["description", "acceptance"],
      "properties": {
        "description": {"type": "string"},
        "files": {
          "type": "array",
          "items": {"type": "string"}
        },
        "tests": {
          "type": "array",
          "items": {"type": "string"}
        },
        "acceptance": {
          "type": "array",
          "items": {"type": "string"},
          "minItems": 1
        },
        "next": {"type": "string"}
      }
    }
  }
}
```

**NuGet Package:** `Newtonsoft.Json.Schema` (already compatible with .NET 8.0)

---

### 3. Template Engine (Mustache/Handlebars Pattern)

**Principle:** User-facing text separated from prompt logic

**Implementation:**

**Install NPM Package:**
```json
{
  "devDependencies": {
    "mustache": "^4.2.0",
    "handlebars": "^4.7.8"
  }
}
```

**Template Structure:**
```mustache
<!-- templates/user-output/plan-complete.mustache -->
## ✅ Plan Complete | Key: `{{key}}`

**Phases:** {{phaseCount}}  
**Tasks:** {{taskCount}}  
**Estimated Duration:** {{estimatedDuration}}

### Phase Breakdown

{{#phases}}
**Phase {{number}}: {{title}}**
- Tasks: {{taskCount}}
- Tests: {{testCount}}
- Duration: {{duration}}
{{/phases}}

### 📋 Next Command

{{#autoChainEnabled}}
**OPTION A: Execute All Phases (E2E Mode)** ✅ RECOMMENDED
```
@workspace /execute #file:.github/keys/{{key}}/handoffs/phase-1.json
```
{{/autoChainEnabled}}

---
Generated: {{timestamp}}
```

**PowerShell Template Rendering:**
```powershell
# Install-Module Mustache (if not exists)
function Render-Template {
    param(
        [string]$TemplatePath,
        [hashtable]$Data
    )
    
    $template = Get-Content $TemplatePath -Raw
    $rendered = Invoke-MustacheTemplate -Template $template -Data $Data
    return $rendered
}
```

---

### 4. Prompt Testing Framework (Industry Standard)

**Principle:** Prompts are code - they need tests

**Implementation:**

**Install NPM Package:**
```json
{
  "devDependencies": {
    "@promptfoo/promptfoo": "^0.88.0",
    "chai": "^4.3.10",
    "mocha": "^10.2.0"
  }
}
```

**Test Configuration:**
```yaml
# .github/tests/promptfoo-config.yaml
prompts:
  - .github/prompts/route.prompt.md
  - .github/prompts/plan.prompt.md
  - .github/prompts/execute.prompt.md

providers:
  - github-copilot

tests:
  - description: "Route prompt correctly identifies multi-task request"
    vars:
      request: "Create user dashboard with login and profile features"
    assert:
      - type: contains
        value: "plan.prompt.md"
      - type: is-json
      - type: javascript
        value: "output.action === 'plan'"
  
  - description: "Plan prompt generates valid handoff JSON"
    vars:
      key: "user-dashboard"
      request: "Create dashboard component"
    assert:
      - type: is-valid-json
      - type: json-schema
        value: file://.github/schemas/handoff-schema.json
      - type: javascript
        value: "JSON.parse(output).data.acceptance.length >= 3"

  - description: "Execute prompt validates build before commit"
    vars:
      handoff: "file://.github/keys/test/handoffs/phase-1.json"
    assert:
      - type: contains
        value: "dotnet build"
      - type: not-contains
        value: "Build Failed"
```

**Run Tests:**
```powershell
# In package.json scripts
"test:prompts": "promptfoo eval -c .github/tests/promptfoo-config.yaml"
```

---

### 5. Token Usage Monitoring (Cost Optimization)

**Principle:** Track and optimize LLM API calls

**Implementation:**

**Create Monitoring Service:**
```csharp
// SPA/NoorCanvas/Services/PromptMonitoringService.cs
using System.Diagnostics;
using Serilog;

public class PromptMonitoringService
{
    private readonly ILogger _logger;
    
    public PromptMetrics TrackPromptExecution(
        string promptName, 
        Func<string> executePrompt)
    {
        var stopwatch = Stopwatch.StartNew();
        var startMemory = GC.GetTotalMemory(false);
        
        try
        {
            var result = executePrompt();
            stopwatch.Stop();
            
            var metrics = new PromptMetrics
            {
                PromptName = promptName,
                ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                MemoryUsedBytes = GC.GetTotalMemory(false) - startMemory,
                TokenCount = EstimateTokenCount(result),
                Success = true,
                Timestamp = DateTime.UtcNow
            };
            
            LogMetrics(metrics);
            return metrics;
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Prompt execution failed: {PromptName}", promptName);
            throw;
        }
    }
    
    private int EstimateTokenCount(string text)
    {
        // OpenAI approximation: ~4 characters per token
        return text.Length / 4;
    }
    
    private void LogMetrics(PromptMetrics metrics)
    {
        _logger.Information(
            "Prompt: {PromptName} | Time: {Time}ms | Tokens: ~{Tokens} | Memory: {Memory}KB",
            metrics.PromptName,
            metrics.ExecutionTimeMs,
            metrics.TokenCount,
            metrics.MemoryUsedBytes / 1024
        );
    }
}

public record PromptMetrics
{
    public string PromptName { get; init; }
    public long ExecutionTimeMs { get; init; }
    public long MemoryUsedBytes { get; init; }
    public int TokenCount { get; init; }
    public bool Success { get; init; }
    public DateTime Timestamp { get; init; }
}
```

**Dashboard (Optional):**
```csharp
// Store metrics in database for analysis
public class PromptMetricsRepository
{
    public async Task<List<PromptMetrics>> GetMetricsByDateRange(
        DateTime start, 
        DateTime end)
    {
        // Query metrics for dashboard visualization
    }
    
    public async Task<Dictionary<string, double>> GetAverageExecutionTimes()
    {
        // Group by prompt name, calculate averages
    }
}
```

---

### 6. Semantic Versioning for Prompts

**Principle:** Track breaking changes and maintain compatibility

**Implementation:**

**Prompt Header (YAML Front Matter):**
```yaml
---
name: route.prompt.md
version: 3.0.0
description: Entry point router with intent detection
mode: agent
breaking_changes:
  - 3.0.0: Removed legacy task routing (use execute.prompt.md)
  - 2.0.0: Changed handoff schema (5 fields instead of 15)
dependencies:
  - plan.prompt.md: ^3.0.0
  - execute.prompt.md: ^3.0.0
  - test.prompt.md: ^3.0.0
compatibility:
  min_framework: net8.0
  max_framework: net9.0
last_updated: 2025-11-02
author: KDS System
---
```

**Version Check (PowerShell):**
```powershell
function Test-PromptCompatibility {
    param(
        [string]$PromptPath,
        [string]$RequiredVersion
    )
    
    $content = Get-Content $PromptPath -Raw
    $yamlMatch = [regex]::Match($content, '(?s)^---\s*\n(.*?)\n---')
    
    if ($yamlMatch.Success) {
        $yaml = ConvertFrom-Yaml $yamlMatch.Groups[1].Value
        $currentVersion = [Version]$yaml.version
        $required = [Version]$RequiredVersion
        
        if ($currentVersion -lt $required) {
            throw "Prompt version mismatch: $PromptPath is v$currentVersion, requires v$required"
        }
    }
}
```

---

### 7. Prompt Linting and Validation

**Principle:** Automated quality checks before execution

**Implementation:**

**Install NuGet Package:**
```xml
<PackageReference Include="Markdig" Version="0.37.0" />
<PackageReference Include="YamlDotNet" Version="16.2.0" />
```

**Linter Service:**
```csharp
// Tools/PromptLinter/PromptValidator.cs
using Markdig;
using YamlDotNet.Serialization;

public class PromptValidator
{
    private readonly ILogger _logger;
    
    public ValidationResult ValidatePrompt(string promptPath)
    {
        var result = new ValidationResult { FilePath = promptPath };
        var content = File.ReadAllText(promptPath);
        
        // 1. YAML Front Matter Validation
        if (!ValidateYamlFrontMatter(content, out var yaml))
        {
            result.Errors.Add("Missing or invalid YAML front matter");
        }
        
        // 2. Required Sections Check
        var requiredSections = new[] 
        { 
            "## Role", 
            "## Workflow", 
            "## Output Format",
            "## Validation"
        };
        
        foreach (var section in requiredSections)
        {
            if (!content.Contains(section))
            {
                result.Warnings.Add($"Missing recommended section: {section}");
            }
        }
        
        // 3. Markdown Syntax Check
        var pipeline = new MarkdownPipelineBuilder().Build();
        var document = Markdown.Parse(content, pipeline);
        
        // 4. Schema Reference Check
        if (yaml.ContainsKey("output_schema"))
        {
            var schemaPath = yaml["output_schema"].ToString();
            if (!File.Exists(schemaPath))
            {
                result.Errors.Add($"Referenced schema not found: {schemaPath}");
            }
        }
        
        // 5. Dependency Check
        if (yaml.ContainsKey("dependencies"))
        {
            var deps = yaml["dependencies"] as Dictionary<string, string>;
            foreach (var dep in deps)
            {
                var depPath = Path.Combine(".github/prompts", dep.Key);
                if (!File.Exists(depPath))
                {
                    result.Errors.Add($"Dependency not found: {dep.Key}");
                }
            }
        }
        
        result.IsValid = result.Errors.Count == 0;
        return result;
    }
    
    private bool ValidateYamlFrontMatter(string content, out Dictionary<string, object> yaml)
    {
        var match = Regex.Match(content, @"^---\s*\n(.*?)\n---", RegexOptions.Singleline);
        
        if (match.Success)
        {
            var deserializer = new DeserializerBuilder().Build();
            yaml = deserializer.Deserialize<Dictionary<string, object>>(match.Groups[1].Value);
            return true;
        }
        
        yaml = null;
        return false;
    }
}

public class ValidationResult
{
    public string FilePath { get; set; }
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}
```

**Pre-Commit Hook:**
```powershell
# .github/hooks/pre-commit-prompt-validation.ps1
$prompts = Get-ChildItem ".github/prompts/*.prompt.md"

foreach ($prompt in $prompts) {
    dotnet run --project Tools/PromptLinter/PromptLinter.csproj -- validate $prompt.FullName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Prompt validation failed: $($prompt.Name)"
        exit 1
    }
}

Write-Host "✅ All prompts validated successfully"
```

---

### 8. Caching and Performance Optimization

**Principle:** Reduce redundant LLM calls with intelligent caching

**Implementation:**

**Install NuGet Package:**
```xml
<PackageReference Include="Microsoft.Extensions.Caching.Memory" Version="8.0.1" />
```

**Caching Service:**
```csharp
// SPA/NoorCanvas/Services/PromptCacheService.cs
using Microsoft.Extensions.Caching.Memory;

public class PromptCacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger _logger;
    
    public PromptCacheService(IMemoryCache cache, ILogger<PromptCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }
    
    public async Task<T> GetOrCreateAsync<T>(
        string cacheKey,
        Func<Task<T>> factory,
        TimeSpan? expiration = null)
    {
        if (_cache.TryGetValue(cacheKey, out T cachedResult))
        {
            _logger.Information("Cache hit: {CacheKey}", cacheKey);
            return cachedResult;
        }
        
        _logger.Information("Cache miss: {CacheKey}", cacheKey);
        var result = await factory();
        
        var cacheOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromMinutes(30)
        };
        
        _cache.Set(cacheKey, result, cacheOptions);
        return result;
    }
    
    public void InvalidatePattern(string pattern)
    {
        // Invalidate all cache entries matching pattern
        // Useful when plan.md is updated
        _logger.Information("Invalidating cache pattern: {Pattern}", pattern);
    }
}
```

**Usage in Prompts:**
```csharp
// Cache plan.md content for 30 minutes
var planContent = await _cacheService.GetOrCreateAsync(
    $"plan:{key}",
    async () => await File.ReadAllTextAsync($".github/keys/{key}/plan.md"),
    TimeSpan.FromMinutes(30)
);
```

---

## 📦 NuGet Packages to Install

### Core Framework (Already Installed)
- ✅ `Microsoft.NET.Sdk.Web` - .NET 8.0 Blazor
- ✅ `Microsoft.EntityFrameworkCore.SqlServer` - Database
- ✅ `Serilog.AspNetCore` - Logging

### New Packages for KDS v3.0

```xml
<!-- Add to SPA/NoorCanvas/NoorCanvas.csproj -->
<ItemGroup>
  <!-- Schema Validation -->
  <PackageReference Include="Newtonsoft.Json.Schema" Version="4.0.1" />
  
  <!-- YAML Parsing -->
  <PackageReference Include="YamlDotNet" Version="16.2.0" />
  
  <!-- Markdown Processing -->
  <PackageReference Include="Markdig" Version="0.37.0" />
  
  <!-- Caching -->
  <PackageReference Include="Microsoft.Extensions.Caching.Memory" Version="8.0.1" />
  
  <!-- Performance Monitoring -->
  <PackageReference Include="System.Diagnostics.PerformanceCounter" Version="8.0.1" />
</ItemGroup>
```

### NPM Packages for Testing/Templating

```json
{
  "devDependencies": {
    "@playwright/test": "^1.56.1",         // Already installed
    "@promptfoo/promptfoo": "^0.88.0",     // NEW - Prompt testing
    "mustache": "^4.2.0",                  // NEW - Template engine
    "handlebars": "^4.7.8",                // NEW - Advanced templates
    "chai": "^4.3.10",                     // NEW - Assertions
    "mocha": "^10.2.0",                    // NEW - Test framework
    "ajv": "^8.12.0",                      // NEW - JSON schema validation
    "yaml": "^2.3.4"                       // NEW - YAML parsing
  }
}
```

---

## 🏗️ Implementation Phases

### Phase 0: Tooling Setup (30 minutes)

**Actions:**
1. Install NuGet packages
2. Install NPM packages
3. Verify compatibility with .NET 8.0
4. Create Tools/PromptLinter project
5. Test schema validation

**Commands:**
```powershell
# 1. Install NuGet packages
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
dotnet add package Newtonsoft.Json.Schema --version 4.0.1
dotnet add package YamlDotNet --version 16.2.0
dotnet add package Markdig --version 0.37.0

# 2. Install NPM packages
cd "D:\PROJECTS\NOOR CANVAS"
npm install --save-dev @promptfoo/promptfoo mustache handlebars chai mocha ajv yaml

# 3. Create PromptLinter tool
dotnet new console -n PromptLinter -o Tools/PromptLinter
cd Tools/PromptLinter
dotnet add package YamlDotNet --version 16.2.0
dotnet add package Markdig --version 0.37.0

# 4. Test installation
dotnet build
npm run test:prompts
```

**Deliverables:**
- [ ] All NuGet packages installed
- [ ] All NPM packages installed
- [ ] PromptLinter tool created
- [ ] Build succeeds with zero errors
- [ ] Test framework functional

---

### Phase 1: Schema & Template Infrastructure (1 hour)

**Actions:**
1. Create JSON schemas for all handoff types
2. Create XML schemas for structured output
3. Create Mustache templates for user output
4. Create validation service
5. Test schema validation

**Files Created:**
```
.github/
├── schemas/
│   ├── handoff-schema.json          # Main handoff schema
│   ├── plan-output.xsd              # Plan XML schema
│   ├── test-output.xsd              # Test XML schema
│   └── validation-result.xsd        # Validation XML schema
│
├── templates/
│   ├── user-output/
│   │   ├── plan-complete.mustache
│   │   ├── phase-complete.mustache
│   │   ├── task-complete.mustache
│   │   ├── test-ready.mustache
│   │   ├── validation-report.mustache
│   │   └── error.mustache
│   │
│   └── handoffs/
│       ├── plan-to-execute.json
│       ├── execute-to-test.json
│       └── test-to-validate.json
│
└── services/
    ├── TemplateEngine.cs            # Mustache rendering
    ├── SchemaValidator.cs           # JSON/XML validation
    └── PromptMonitoringService.cs   # Performance tracking
```

**Validation Tests:**
```typescript
// .github/tests/schema-validation.spec.ts
import { test, expect } from '@playwright/test';
import Ajv from 'ajv';
import * as fs from 'fs';

test.describe('Schema Validation Tests', () => {
  test('Handoff JSON validates against schema', async () => {
    const ajv = new Ajv();
    const schema = JSON.parse(
      fs.readFileSync('.github/schemas/handoff-schema.json', 'utf8')
    );
    
    const sampleHandoff = {
      key: 'user-dashboard',
      action: 'execute',
      phase: 1,
      task: '1a',
      data: {
        description: 'Create dashboard component',
        files: ['Components/Dashboard.razor'],
        tests: ['Tests/UI/dashboard.spec.ts'],
        acceptance: ['Component renders', 'Data loads'],
        next: '.github/keys/user-dashboard/handoffs/phase-1-task-2.json'
      }
    };
    
    const validate = ajv.compile(schema);
    const valid = validate(sampleHandoff);
    
    expect(valid).toBe(true);
    expect(validate.errors).toBeNull();
  });
});
```

---

### Phase 2: Core Modules (1 hour)

**Actions:**
1. Create shared validation logic
2. Create shared handoff workflow
3. Create shared test-first workflow
4. Create YAML front matter parser
5. Test module reusability

**Files Created:**
```
.github/
└── prompts/
    └── core/
        ├── validation.md           # Shared validation patterns
        ├── handoff.md              # Handoff workflow logic
        ├── test-first.md           # TDD workflow
        ├── yaml-parser.md          # Front matter parsing
        └── output-formatter.md     # Template rendering
```

**Core Module Example:**
```markdown
<!-- .github/prompts/core/validation.md -->

# Validation Workflow Module

## Pre-Execution Validation

**LOAD SCHEMA:** `.github/schemas/validation-result.xsd`

**Execute in order:**

1. **Build Status Check**
   ```powershell
   dotnet build --no-restore
   if ($LASTEXITCODE -ne 0) { throw "Build failed" }
   ```

2. **Git Status Check**
   ```powershell
   $status = git status --porcelain
   if ($status -match "^\s*M\s+\.github/") {
       Write-Warning "Uncommitted .github changes detected"
   }
   ```

3. **Environment Check**
   - Database accessible: `Test-Connection -ComputerName localhost -Port 1433`
   - Services running: `Get-Process -Name "dotnet" -ErrorAction SilentlyContinue`

**Output Format:** XML per validation-result.xsd

## Post-Execution Validation

**LOAD SCHEMA:** `.github/schemas/validation-result.xsd`

**Execute in order:**

1. **Build Validation**
   ```powershell
   dotnet build --no-incremental
   if ($LASTEXITCODE -ne 0) { throw "Post-execution build failed" }
   ```

2. **Test Execution**
   ```powershell
   dotnet test --no-build --verbosity minimal
   ```

3. **Lint Validation**
   ```powershell
   npm run lint
   ```

**Output Format:** XML per validation-result.xsd

## Usage in Prompts

```markdown
## Step 3: Validate Environment

<!-- INCLUDE: core/validation.md#Pre-Execution-Validation -->

## Step 8: Validate Results

<!-- INCLUDE: core/validation.md#Post-Execution-Validation -->
```
```

---

### Phase 3: Governance & Documentation (1 hour)

**Actions:**
1. Create consolidated kds-rulebook.md (12 rules)
2. Create prompt templates with YAML front matter
3. Create documentation files
4. Create README.md with invocation guide
5. Test governance workflow

**Files Created:**
```
.github/
├── governance/
│   └── kds-rulebook.md             # 12 core rules (consolidated)
│
├── docs/
│   ├── architecture.md             # System overview
│   ├── database.md                 # Schema + Session 212
│   ├── api-contracts.md            # Endpoint documentation
│   ├── playwright-guide.md         # Test patterns
│   ├── prompt-development.md       # Creating new prompts
│   └── quick-start.md              # Getting started
│
└── README.md                        # System overview + invocation
```

**kds-rulebook.md Structure:**
```markdown
# KDS Governance Rulebook v3.0

**Status:** CANONICAL SOURCE  
**Rules:** 12 (consolidated from 20)

## Core Rules

### Rule #1: Template-Driven Output
**Schema:** `.github/schemas/template-output.xsd`
**Enforcement:** Automated via TemplateEngine.cs

All user-facing responses MUST:
1. Load template from `.github/templates/user-output/`
2. Validate data against schema
3. Render using Mustache engine
4. Log template usage to PromptMonitoringService

**Violation Detection:** Pre-commit hook checks for hardcoded strings

### Rule #2: Document First
**Schema:** `.github/schemas/documentation-commit.xsd`
**Enforcement:** Git hook + PromptLinter

Update KDS files BEFORE code changes:
1. plan.md updated
2. work-log.md appended
3. Handoff JSONs created
4. Git commit (docs only)
5. Implement code
6. Git commit (implementation)

**Violation Detection:** Commit sequence analysis

[... 10 more rules ...]
```

---

### Phase 4: Prompt Development (2 hours)

**Actions:**
1. Create route.prompt.md with YAML front matter
2. Create plan.prompt.md with schema references
3. Create execute.prompt.md with validation
4. Create test.prompt.md with orchestration
5. Create validate.prompt.md with health checks
6. Create govern.prompt.md with compliance

**Prompt Template (Industry Standard):**
```markdown
---
name: execute.prompt.md
version: 3.0.0
description: Execution engine - implements code changes with validation
mode: agent
output_schema: .github/schemas/task-output.xsd
input_schema: .github/schemas/handoff-schema.json
dependencies:
  test.prompt.md: ^3.0.0
  validate.prompt.md: ^3.0.0
templates:
  - templates/user-output/task-complete.mustache
breaking_changes:
  - 3.0.0: Removed task/todo separation (unified execution)
  - 2.0.0: Changed to template-driven output
compatibility:
  min_framework: net8.0
  playwright: ^1.56.0
performance:
  avg_tokens: 2500
  avg_duration_ms: 3500
last_updated: 2025-11-02
---

# Execute Prompt - Implementation Engine

## Role
You are the **Execution Engine** - implements code changes from handoff JSONs with strict validation.

## Input Schema
**LOAD:** `.github/schemas/handoff-schema.json`
**VALIDATE:** All input must conform to schema before execution

## Output Schema
**LOAD:** `.github/schemas/task-output.xsd`
**VALIDATE:** All output must conform to XML schema

## Workflow

### Step 0: Input Validation
```csharp
var validator = new SchemaValidator();
var handoff = JsonConvert.DeserializeObject<Handoff>(input);

if (!validator.ValidateJson(handoff, ".github/schemas/handoff-schema.json"))
{
    throw new ValidationException("Invalid handoff JSON");
}
```

### Step 1: Pre-Execution Validation
<!-- INCLUDE: core/validation.md#Pre-Execution-Validation -->

### Step 2: Load Context
- Load plan.md from `.github/keys/{key}/plan.md`
- Load work-log.md (last 10 entries)
- Parse acceptance criteria from handoff.data.acceptance

### Step 3: Implement Changes
**Cache Strategy:** 30-minute cache for plan.md content

```csharp
var planContent = await _cacheService.GetOrCreateAsync(
    $"plan:{handoff.Key}",
    async () => await File.ReadAllTextAsync(planPath),
    TimeSpan.FromMinutes(30)
);
```

**Implementation Logic:**
1. For each file in handoff.data.files:
   - Create or modify file
   - Apply changes per plan.md
   - Track modifications

### Step 4: Post-Execution Validation
<!-- INCLUDE: core/validation.md#Post-Execution-Validation -->

### Step 5: Update Documentation
1. Append to work-log.md:
   ```markdown
   ## [{{timestamp}}] - execute.prompt.md
   
   **Key:** {{key}}
   **Phase:** {{phase}}
   **Task:** {{task}}
   **Files Modified:** {{fileCount}}
   **Tests:** {{testStatus}}
   **Build:** {{buildStatus}}
   ```

2. Commit documentation:
   ```powershell
   git add .github/keys/{{key}}/work-log.md
   git commit -m "docs({{key}}): Phase {{phase}} Task {{task}} complete"
   ```

### Step 6: Render Output
**LOAD TEMPLATE:** `templates/user-output/task-complete.mustache`

```csharp
var templateEngine = new TemplateEngine();
var output = templateEngine.Render("task-complete.mustache", new
{
    Key = handoff.Key,
    Phase = handoff.Phase,
    Task = handoff.Task,
    FilesModified = modifiedFiles.Count,
    BuildStatus = "Clean",
    TestStatus = "Passed",
    NextCommand = handoff.Data.Next,
    Timestamp = DateTime.UtcNow.ToString("o")
});

// Validate output against XML schema
var validator = new SchemaValidator();
validator.ValidateXml(output, ".github/schemas/task-output.xsd");

return output;
```

### Step 7: Performance Logging
```csharp
var metrics = await _monitoringService.TrackPromptExecution(
    "execute.prompt.md",
    () => ExecuteImplementation(handoff)
);

_logger.Information(
    "Execute completed: {Key} | Time: {Time}ms | Tokens: ~{Tokens}",
    handoff.Key,
    metrics.ExecutionTimeMs,
    metrics.TokenCount
);
```

## Error Handling

### Build Failure
```xml
<ExecutionResult>
  <Status>Failed</Status>
  <Error>
    <Type>BuildFailure</Type>
    <Message>Compilation error in Dashboard.razor</Message>
    <Remedy>Review build errors and fix syntax issues</Remedy>
  </Error>
</ExecutionResult>
```

### Test Failure
```xml
<ExecutionResult>
  <Status>Failed</Status>
  <Error>
    <Type>TestFailure</Type>
    <Message>3 tests failed in dashboard.spec.ts</Message>
    <Remedy>Review test output and fix failing assertions</Remedy>
  </Error>
</ExecutionResult>
```

## Monitoring
**Tracked Metrics:**
- Execution time (ms)
- Token count (estimated)
- Memory usage (KB)
- Files modified
- Build status
- Test pass rate

## Version History
- **3.0.0** (2025-11-02): Template-driven output, schema validation
- **2.0.0** (2025-10-15): Unified task/todo execution
- **1.0.0** (2025-09-01): Initial release
```

---

### Phase 5: Testing Infrastructure (1 hour)

**Actions:**
1. Create promptfoo test suite
2. Create schema validation tests
3. Create template rendering tests
4. Create performance benchmark tests
5. Run full test suite

**Test Files:**
```
.github/
└── tests/
    ├── promptfoo-config.yaml        # Main test configuration
    ├── schema-validation.spec.ts    # JSON/XML schema tests
    ├── template-rendering.spec.ts   # Mustache template tests
    ├── performance.spec.ts          # Token/time benchmarks
    └── integration.spec.ts          # End-to-end workflow tests
```

**Performance Benchmark Test:**
```typescript
// .github/tests/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Prompt Performance Benchmarks', () => {
  test('route.prompt.md executes under 2s', async () => {
    const startTime = Date.now();
    
    // Simulate route prompt execution
    const result = await executePrompt('route.prompt.md', {
      request: 'Create user dashboard feature'
    });
    
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(2000);
    expect(result.tokenCount).toBeLessThan(1500);
  });
  
  test('plan.prompt.md generates valid handoffs', async () => {
    const result = await executePrompt('plan.prompt.md', {
      key: 'test-feature',
      request: 'Add login component'
    });
    
    // Validate handoff JSON against schema
    const ajv = new Ajv();
    const schema = JSON.parse(
      fs.readFileSync('.github/schemas/handoff-schema.json', 'utf8')
    );
    
    const validate = ajv.compile(schema);
    const valid = validate(result.handoffs[0]);
    
    expect(valid).toBe(true);
    expect(result.handoffs.length).toBeGreaterThan(0);
  });
});
```

---

### Phase 6: Migration & Cleanup (1 hour)

**Actions:**
1. Delete all files from .github/ (except this plan)
2. Create new directory structure
3. Copy essential data from .github_backup/
4. Migrate active keys to new structure
5. Validate migration

**Migration Script:**
```powershell
# .github/scripts/migrate-to-v3.ps1

param(
    [switch]$DryRun
)

Write-Host "🚀 KDS v3.0 Migration Script" -ForegroundColor Cyan

# 1. Backup check
if (-not (Test-Path ".github_backup")) {
    throw "Backup not found. Create backup first: Copy-Item .github .github_backup -Recurse"
}

# 2. Delete old structure (except plan)
if (-not $DryRun) {
    Write-Host "Deleting old structure..." -ForegroundColor Yellow
    Get-ChildItem ".github" -Exclude "KDS-*.md" | Remove-Item -Recurse -Force
}

# 3. Create new structure
Write-Host "Creating new directory structure..." -ForegroundColor Green
$folders = @(
    '.github/governance',
    '.github/prompts/core',
    '.github/schemas',
    '.github/templates/user-output',
    '.github/templates/handoffs',
    '.github/services',
    '.github/keys',
    '.github/tests/patterns',
    '.github/docs'
)

foreach ($folder in $folders) {
    if (-not $DryRun) {
        New-Item -ItemType Directory -Path "D:\PROJECTS\NOOR CANVAS\$folder" -Force | Out-Null
    }
    Write-Host "  ✓ $folder" -ForegroundColor Gray
}

# 4. Migrate active keys
Write-Host "Migrating active keys..." -ForegroundColor Green
$oldKeys = Get-ChildItem ".github_backup/key-data-streams" -Directory

foreach ($key in $oldKeys) {
    $keyName = $key.Name
    $newKeyPath = ".github/keys/$keyName"
    
    if (-not $DryRun) {
        New-Item -ItemType Directory -Path $newKeyPath -Force | Out-Null
        
        # Copy essential files
        if (Test-Path "$($key.FullName)/*.plan.md") {
            Copy-Item "$($key.FullName)/*.plan.md" -Destination "$newKeyPath/plan.md"
        }
        
        if (Test-Path "$($key.FullName)/work-log.md") {
            Copy-Item "$($key.FullName)/work-log.md" -Destination "$newKeyPath/"
        }
        
        if (Test-Path "$($key.FullName)/handoffs") {
            Copy-Item "$($key.FullName)/handoffs" -Destination "$newKeyPath/" -Recurse
        }
    }
    
    Write-Host "  ✓ Migrated key: $keyName" -ForegroundColor Gray
}

# 5. Validate migration
Write-Host "Validating migration..." -ForegroundColor Green
$requiredDirs = @('.github/governance', '.github/prompts', '.github/schemas')
foreach ($dir in $requiredDirs) {
    if (-not (Test-Path $dir)) {
        Write-Error "Missing directory: $dir"
    }
}

Write-Host "✅ Migration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Review migrated keys in .github/keys/"
Write-Host "  2. Install NuGet packages (see Phase 0)"
Write-Host "  3. Run: npm install"
Write-Host "  4. Run: dotnet build"
```

---

## 📊 Quality Metrics & Success Criteria

### Quantitative Goals

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **Rule Count** | 12 (from 20) | Count in kds-rulebook.md |
| **Prompt Count** | 6 (from 14) | Count in .github/prompts/ |
| **Duplication** | 0 lines | Automated duplication scan |
| **Schema Coverage** | 100% | All outputs validated |
| **Template Coverage** | 100% | All user output templated |
| **Test Coverage** | >80% | promptfoo test pass rate |
| **Avg Token Usage** | <3000/prompt | PromptMonitoringService |
| **Avg Execution Time** | <5s/prompt | Performance benchmarks |
| **Build Success** | 100% | CI/CD pipeline |

### Qualitative Goals

- ✅ Zero hardcoded user-facing strings (all templated)
- ✅ Zero schema violations (all outputs validated)
- ✅ Zero rule duplication (single governance file)
- ✅ 100% YAML front matter coverage (all prompts)
- ✅ Semantic versioning enforced (breaking changes tracked)
- ✅ Performance monitoring enabled (all prompts)
- ✅ Automated testing suite (promptfoo + Playwright)

---

## 🔧 Tooling Configuration

### PromptLinter CLI

```powershell
# Usage
dotnet run --project Tools/PromptLinter/PromptLinter.csproj -- [command] [options]

# Commands
validate <file>              # Validate single prompt
validate-all                 # Validate all prompts
check-schema <handoff.json>  # Validate handoff against schema
test-template <template>     # Test template rendering
lint-rules                   # Check rule duplication

# Examples
dotnet run --project Tools/PromptLinter -- validate .github/prompts/route.prompt.md
dotnet run --project Tools/PromptLinter -- check-schema .github/keys/test/handoffs/phase-1.json
```

### NPM Scripts (Updated)

```json
{
  "scripts": {
    "test:prompts": "promptfoo eval -c .github/tests/promptfoo-config.yaml",
    "test:schemas": "playwright test .github/tests/schema-validation.spec.ts",
    "test:templates": "playwright test .github/tests/template-rendering.spec.ts",
    "test:performance": "playwright test .github/tests/performance.spec.ts",
    "test:all": "npm run test:prompts && npm run test:schemas && npm run test:templates",
    "lint:prompts": "dotnet run --project Tools/PromptLinter -- validate-all",
    "validate:handoffs": "dotnet run --project Tools/PromptLinter -- check-schema .github/keys/**/handoffs/*.json"
  }
}
```

### Pre-Commit Hook

```powershell
# .git/hooks/pre-commit
#!/usr/bin/env pwsh

Write-Host "Running KDS v3.0 pre-commit validation..." -ForegroundColor Cyan

# 1. Lint all prompts
Write-Host "Validating prompts..." -ForegroundColor Yellow
npm run lint:prompts
if ($LASTEXITCODE -ne 0) {
    Write-Error "Prompt validation failed"
    exit 1
}

# 2. Validate handoff JSONs
Write-Host "Validating handoff schemas..." -ForegroundColor Yellow
npm run validate:handoffs
if ($LASTEXITCODE -ne 0) {
    Write-Error "Handoff schema validation failed"
    exit 1
}

# 3. Check for hardcoded strings
Write-Host "Checking for hardcoded strings..." -ForegroundColor Yellow
$hardcoded = Select-String -Path ".github/prompts/*.prompt.md" -Pattern '(## ✅|## ❌|Next Command:)' | Where-Object { $_.Line -notmatch '{{.*}}' }

if ($hardcoded) {
    Write-Error "Found hardcoded strings (should use templates):"
    $hardcoded | ForEach-Object { Write-Host "  $($_.Filename):$($_.LineNumber)" }
    exit 1
}

# 4. Run schema tests
Write-Host "Running schema validation tests..." -ForegroundColor Yellow
npm run test:schemas
if ($LASTEXITCODE -ne 0) {
    Write-Error "Schema tests failed"
    exit 1
}

Write-Host "✅ Pre-commit validation passed!" -ForegroundColor Green
```

---

## 📚 Documentation Files

### .github/README.md

```markdown
# KDS v3.0 - Key Data Streams System

**Version:** 3.0.0  
**Framework:** .NET 8.0 + Playwright  
**Status:** Production Ready

## Overview

KDS (Key Data Streams) is a prompt engineering system that manages Copilot context efficiently to build applications through:

1. **Context Management** - Break features into planned phases/tasks
2. **Auto-Execution** - Chain tasks with handoff JSONs
3. **Test Standardization** - Playwright orchestration patterns
4. **Template-Driven Output** - Customizable user responses

## Quick Start

### 1. Create New Feature
```
@workspace /route request="Add user dashboard with authentication"
```

System will:
- Detect multi-task request
- Route to plan.prompt.md
- Generate phases/tasks
- Create handoff JSONs
- Output next command

### 2. Execute Plan
```
@workspace /execute #file:.github/keys/user-dashboard/handoffs/phase-1.json
```

System will:
- Load handoff JSON
- Implement code changes
- Validate build + tests
- Update documentation
- Auto-chain to next task (if enabled)

### 3. Run Tests
```
@workspace /test key=user-dashboard task=1a
```

System will:
- Check test registry for patterns
- Generate Playwright test
- Create orchestration script
- Run test
- Update registry if passed

## Architecture

### Prompts (6 Total)
- **route.prompt.md** - Entry point (intent detection)
- **plan.prompt.md** - Planning (phases/tasks)
- **execute.prompt.md** - Execution (implementation)
- **test.prompt.md** - Testing (Playwright)
- **validate.prompt.md** - Health checks
- **govern.prompt.md** - Governance

### Schemas (JSON/XML)
- All handoffs validated against `.github/schemas/handoff-schema.json`
- All outputs validated against `.github/schemas/*-output.xsd`

### Templates (Mustache)
- All user-facing text uses `.github/templates/user-output/*.mustache`
- Customizable without touching prompts

## Configuration

### Customize Templates
```powershell
# Edit template
code .github/templates/user-output/plan-complete.mustache

# Changes apply immediately (no prompt edits needed)
```

### Adjust Performance
```csharp
// appsettings.json
{
  "KDS": {
    "CacheDurationMinutes": 30,
    "MaxTokensPerPrompt": 4000,
    "EnablePerformanceMonitoring": true
  }
}
```

## Testing

```powershell
# Test all prompts
npm run test:prompts

# Test schemas
npm run test:schemas

# Test templates
npm run test:templates

# Performance benchmarks
npm run test:performance
```

## Documentation
- [Architecture](docs/architecture.md) - System design
- [Database](docs/database.md) - Schema + Session 212
- [API Contracts](docs/api-contracts.md) - Endpoints
- [Playwright Guide](docs/playwright-guide.md) - Test patterns
- [Prompt Development](docs/prompt-development.md) - Creating prompts
- [Quick Start](docs/quick-start.md) - Detailed tutorial

## Support
For issues or questions, see `.github/governance/kds-rulebook.md`
```

---

## 🎯 Implementation Checklist

### Phase 0: Tooling Setup ✅ READY TO EXECUTE
- [ ] Install NuGet packages (5 packages)
- [ ] Install NPM packages (6 packages)
- [ ] Create Tools/PromptLinter project
- [ ] Test schema validation
- [ ] Verify build succeeds

### Phase 1: Schema & Templates ⏳ PENDING
- [ ] Create JSON schemas (4 files)
- [ ] Create XML schemas (3 files)
- [ ] Create Mustache templates (6 files)
- [ ] Create validation service (3 C# files)
- [ ] Test schema validation

### Phase 2: Core Modules ⏳ PENDING
- [ ] Create validation.md module
- [ ] Create handoff.md module
- [ ] Create test-first.md module
- [ ] Create yaml-parser.md module
- [ ] Test module includes

### Phase 3: Governance ⏳ PENDING
- [ ] Create kds-rulebook.md (12 rules)
- [ ] Create documentation files (6 files)
- [ ] Create README.md
- [ ] Test governance workflow

### Phase 4: Prompts ⏳ PENDING
- [ ] Create route.prompt.md
- [ ] Create plan.prompt.md
- [ ] Create execute.prompt.md
- [ ] Create test.prompt.md
- [ ] Create validate.prompt.md
- [ ] Create govern.prompt.md

### Phase 5: Testing ⏳ PENDING
- [ ] Create promptfoo tests
- [ ] Create schema tests
- [ ] Create template tests
- [ ] Create performance tests
- [ ] Run full test suite

### Phase 6: Migration ⏳ PENDING
- [ ] Delete old .github/ structure
- [ ] Create new directories
- [ ] Migrate active keys
- [ ] Validate migration
- [ ] Commit to git

---

## 📅 Execution Timeline

**Total Estimated Time:** 6.5 hours

| Phase | Duration | Cumulative | Status |
|-------|----------|------------|--------|
| Phase 0: Tooling | 30 min | 0.5 hrs | ✅ Ready |
| Phase 1: Schemas | 1 hour | 1.5 hrs | ⏳ Pending |
| Phase 2: Modules | 1 hour | 2.5 hrs | ⏳ Pending |
| Phase 3: Governance | 1 hour | 3.5 hrs | ⏳ Pending |
| Phase 4: Prompts | 2 hours | 5.5 hrs | ⏳ Pending |
| Phase 5: Testing | 1 hour | 6.5 hrs | ⏳ Pending |
| Phase 6: Migration | (Covered in Phase 4) | - | ⏳ Pending |

---

## ✅ Approval & Next Steps

### Documentation Complete ✅

This plan is now **COMPLETE** and ready for user approval. It includes:

- ✅ Industry best practices for prompt engineering
- ✅ NuGet/NPM package specifications
- ✅ .NET 8.0 compatibility verification
- ✅ Schema validation patterns (JSON/XML)
- ✅ Template engine integration (Mustache)
- ✅ Performance monitoring (token/time tracking)
- ✅ Automated testing framework (promptfoo)
- ✅ Semantic versioning system
- ✅ Pre-commit validation hooks
- ✅ Migration scripts
- ✅ Complete implementation checklist

### User Decision Required

**OPTION A: APPROVE & BEGIN EXECUTION** ✅ RECOMMENDED
- Proceed with Phase 0 (Tooling Setup)
- Install all packages
- Verify compatibility
- Timeline: Start now, complete in 6.5 hours

**OPTION B: REQUEST MODIFICATIONS**
- Suggest changes to plan
- Adjust tooling choices
- Revise timeline
- Re-approve after updates

**OPTION C: REVIEW IN DETAIL**
- Deep dive into specific sections
- Discuss architecture decisions
- Clarify implementation details
- Approve when ready

---

**Next Command (if approved):**

```powershell
# Phase 0: Install tooling packages
cd "D:\PROJECTS\NOOR CANVAS"

# Install NuGet packages
cd SPA\NoorCanvas
dotnet add package Newtonsoft.Json.Schema --version 4.0.1
dotnet add package YamlDotNet --version 16.2.0
dotnet add package Markdig --version 0.37.0
dotnet add package Microsoft.Extensions.Caching.Memory --version 8.0.1

# Install NPM packages
cd ..\..
npm install --save-dev @promptfoo/promptfoo mustache handlebars chai mocha ajv yaml

# Verify installation
dotnet build
```

---

**Document Status:** COMPLETE - Awaiting User Approval  
**Last Updated:** 2025-11-02  
**Version:** 3.0.0
