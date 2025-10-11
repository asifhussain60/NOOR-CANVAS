# Advanced Usage Guide

Advanced features, workflows, and customization for the Portable AI Agent System.

---

## Table of Contents

1. [Custom Agent Configuration](#custom-agent-configuration)
2. [Multi-Agent Workflows](#multi-agent-workflows)
3. [Learning System Optimization](#learning-system-optimization)
4. [CI/CD Integration](#cicd-integration)
5. [Team Collaboration](#team-collaboration)
6. [Performance Tuning](#performance-tuning)
7. [Custom Validators](#custom-validators)
8. [Extending Agents](#extending-agents)

---

## Custom Agent Configuration

### Modifying Agent Behavior

Each agent can be customized by editing its prompt file:

**Location:** `.github/prompts/AGENT_NAME.prompt.md`

**Example: Adjusting Task Executor Retry Logic**

```markdown
<!-- In .github/prompts/task.prompt.md -->

## Execution Parameters

- Max retry attempts: 3 → **5** (increased from default)
- Rollback threshold: 3 failures → **4 failures**
- Debug level: trace → **simple** (less verbose)
```

### Project-Specific Rules

Add custom validation rules in `.github/instructions/`:

**Example: Custom Naming Convention**

Create `.github/instructions/NamingConventions.md`:

```markdown
# Project Naming Conventions

## Controllers
- Must end with `Controller`
- Use PascalCase
- Prefix with feature area: `AdminUserController`

## Services
- Must end with `Service`
- Interface must match: `IUserService` → `UserService`

## Validators
All agents must verify naming conventions before committing.
```

Then reference in agent prompts:
```markdown
#file:.github/instructions/NamingConventions.md
```

---

## Multi-Agent Workflows

### Sequential Execution

Chain agents for complex workflows:

```
# 1. Understand current state
@workspace /question "How does user authentication work?"

# 2. Check health before changes
@workspace /healthcheck mode=standard

# 3. Implement feature
@workspace /task key=auth-2fa tasks="Add two-factor authentication"

# 4. Refactor for quality
@workspace /refactor scope=Services/AuthService.cs mode=patterns

# 5. Update documentation
@workspace /sync target=docs

# 6. Final validation
@workspace /healthcheck mode=full

# 7. Analyze what was learned
@workspace /learning action=analyze scope=all
```

### Parallel Investigation

Use multiple Question agents simultaneously:

```
# Open multiple chat threads
[Thread 1] @workspace /question "What is the database schema?"
[Thread 2] @workspace /question "How are API endpoints structured?"
[Thread 3] @workspace /question "What testing frameworks are used?"
```

### Iterative Refinement

```
# Iteration 1: Quick implementation
@workspace /task key=feature-v1 tasks="Basic user profile page"

# Iteration 2: Add polish
@workspace /task key=feature-v2 tasks="Add profile image upload"

# Iteration 3: Optimize
@workspace /refactor scope=Controllers/ProfileController.cs mode=performance

# Iteration 4: Comprehensive quality pass
@workspace /refactor scope=Services/ProfileService.cs mode=comprehensive
```

---

## Learning System Optimization

### Pattern File Structure

The learning system uses JSON files in `Workspaces/Copilot/learning/patterns/`:

**successful-patterns.json:**
```json
{
  "metadata": {
    "project": "YourProject",
    "created": "2025-10-11",
    "version": "1.0.0",
    "total_patterns": 15
  },
  "patterns": [
    {
      "id": "pattern-001",
      "category": "refactoring",
      "description": "Extract complex LINQ into separate method",
      "context": "Improved readability in UserService",
      "code_before": "...",
      "code_after": "...",
      "metrics": {
        "complexity_before": 12,
        "complexity_after": 6,
        "maintainability_improvement": 0.45
      },
      "applicability": ["Services", "Repositories"],
      "recorded_date": "2025-10-11T10:30:00Z"
    }
  ]
}
```

**failed-approaches.json:**
```json
{
  "metadata": {
    "project": "YourProject",
    "created": "2025-10-11"
  },
  "failures": [
    {
      "id": "failure-001",
      "task_key": "feature-123",
      "attempted_approach": "Direct database access from controller",
      "failure_reason": "Violates layered architecture",
      "error_message": "Build warning CS1234: ...",
      "learned_lesson": "Always use service layer for data access",
      "correct_approach": "Inject IUserService into controller",
      "recorded_date": "2025-10-11T11:00:00Z"
    }
  ]
}
```

### Custom Learning Categories

Add your own pattern categories:

```json
{
  "patterns": [
    {
      "id": "pattern-custom-001",
      "category": "security",  // Custom category
      "description": "Input sanitization pattern",
      "tags": ["XSS-prevention", "validation"],
      "priority": "high"
    }
  ]
}
```

### Learning Reports

Generate custom reports:

```powershell
# PowerShell script: generate-learning-report.ps1

$patterns = Get-Content "Workspaces\Copilot\learning\patterns\successful-patterns.json" | ConvertFrom-Json

$report = @"
# Learning Report - $(Get-Date -Format "yyyy-MM-dd")

## Summary
- Total Patterns: $($patterns.patterns.Count)
- Categories: $(($patterns.patterns.category | Select-Object -Unique) -join ', ')

## Top Patterns
$($patterns.patterns | Sort-Object -Property { $_.metrics.maintainability_improvement } -Descending | Select-Object -First 5 | ForEach-Object {
"### $($_.description)
- Improvement: $($_.metrics.maintainability_improvement * 100)%
- Date: $($_.recorded_date)
"
})
"@

Set-Content "LEARNING-REPORT.md" -Value $report
```

---

## CI/CD Integration

### GitHub Actions

**Example: Pre-commit validation**

`.github/workflows/ai-agent-validation.yml`:
```yaml
name: AI Agent Pre-Commit Validation

on:
  pull_request:
    branches: [ main, master ]

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      
      - name: Install Roslynator
        run: dotnet tool install -g roslynator.dotnet.cli
      
      - name: Run Build
        run: dotnet build
      
      - name: Run Analyzer
        run: roslynator analyze --output analysis.xml
      
      - name: Check for Warnings
        run: |
          if grep -q "warning" analysis.xml; then
            echo "::error::Build warnings detected!"
            exit 1
          fi
      
      - name: Run Tests
        run: dotnet test
```

### Azure DevOps

**Example: Pipeline with health check**

`azure-pipelines.yml`:
```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'windows-latest'

steps:
- task: UseDotNet@2
  inputs:
    version: '8.0.x'

- script: dotnet tool install -g roslynator.dotnet.cli
  displayName: 'Install Roslynator'

- script: dotnet build
  displayName: 'Build Project'

- script: roslynator analyze --output $(Build.ArtifactStagingDirectory)/analysis.xml
  displayName: 'Run Code Analysis'

- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: '$(Build.ArtifactStagingDirectory)'
    artifactName: 'code-analysis'
```

### Pre-Commit Hooks

**Example: Git hook for automatic health check**

`.git/hooks/pre-commit`:
```bash
#!/bin/sh

echo "Running AI Agent Health Check..."

# Quick health check before commit
dotnet build
if [ $? -ne 0 ]; then
    echo "Build failed! Commit aborted."
    exit 1
fi

# Check for warnings
roslynator analyze --output temp-analysis.xml
if grep -q "warning" temp-analysis.xml; then
    echo "Build warnings detected! Commit aborted."
    rm temp-analysis.xml
    exit 1
fi

rm temp-analysis.xml
echo "Health check passed!"
exit 0
```

---

## Team Collaboration

### Shared Learning Patterns

Store patterns in version control for team sharing:

```powershell
# Commit pattern files periodically
git add Workspaces/Copilot/learning/patterns/*.json
git commit -m "Update learning patterns - $(Get-Date -Format 'yyyy-MM-dd')"
git push
```

### Pattern Review Process

Establish team review for high-value patterns:

```markdown
# Team Process for Pattern Review

1. Agent records pattern in JSON
2. Weekly team meeting reviews new patterns
3. Team votes on "golden patterns" (high reuse value)
4. Golden patterns moved to `patterns/golden/`
5. Golden patterns referenced in onboarding docs
```

### Collaborative Refactoring

Use agent reports to coordinate refactoring:

```
# Lead: Generate refactoring plan
@workspace /refactor scope=project mode=comprehensive

# Review output in: Workspaces/Copilot/validation/refactor-plan.md

# Team: Divide work by file/module
[Dev A] @workspace /refactor scope=Controllers/ mode=patterns
[Dev B] @workspace /refactor scope=Services/ mode=performance
[Dev C] @workspace /refactor scope=Data/ mode=readability
```

### Onboarding New Developers

Create onboarding workflow:

```markdown
# New Developer Onboarding - AI Agent System

## Day 1: Learn the system
@workspace /question "What is the overall architecture?"
@workspace /question "How do I run the application?"
@workspace /healthcheck mode=quick

## Day 2: Understand agents
@workspace /question "What agents are available?"
@workspace /learning action=report scope=all

## Day 3: First contribution
@workspace /task key=onboarding-task tasks="Fix a good-first-issue bug"

## Day 4: Review patterns
Review: Workspaces/Copilot/learning/patterns/successful-patterns.json
Understand team's coding patterns
```

---

## Performance Tuning

### Optimize Agent Response Time

**1. Reduce Scope**
```
# Instead of:
@workspace /task key=feature tasks="Improve entire system"

# Use:
@workspace /task key=feature tasks="Improve login validation" layers="Controllers,Services"
```

**2. Exclude Large Directories**

Update `.gitignore`:
```
# Agent performance optimization
bin/
obj/
node_modules/
.vs/
*.log
Workspaces/TEMP/
```

**3. Use Specific Context**
```
# Instead of:
@workspace /question "How does this work?"

# Use:
@workspace /question "How does UserController.Login work?" context=Controllers/UserController.cs
```

### Optimize Learning System

**1. Prune Old Patterns**

```powershell
# Keep only last 100 patterns
$patterns = Get-Content "Workspaces\Copilot\learning\patterns\successful-patterns.json" | ConvertFrom-Json
$patterns.patterns = $patterns.patterns | Sort-Object recorded_date -Descending | Select-Object -First 100
$patterns | ConvertTo-Json -Depth 10 | Set-Content "Workspaces\Copilot\learning\patterns\successful-patterns.json"
```

**2. Archive Historical Data**

```powershell
# Monthly archive
$date = Get-Date -Format "yyyy-MM"
Copy-Item "Workspaces\Copilot\learning\patterns" -Destination "Workspaces\Copilot\learning\archive\$date" -Recurse
```

---

## Custom Validators

### Create Custom Validation Rules

**Example: API Contract Validator**

`.github/instructions/CustomValidators/APIContractValidator.md`:

```markdown
# API Contract Validator

## Purpose
Ensure all API endpoints follow contract standards.

## Rules

### 1. All endpoints must have XML documentation
```csharp
/// <summary>
/// Description of endpoint
/// </summary>
/// <param name="id">Parameter description</param>
/// <returns>Return value description</returns>
[HttpGet("{id}")]
public IActionResult Get(int id) { }
```

### 2. Response types must be explicit
```csharp
// ❌ Bad
public IActionResult Get() { }

// ✅ Good
public ActionResult<UserDto> Get() { }
```

### 3. All DTOs must have validation attributes
```csharp
public class UserDto
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; }
    
    [EmailAddress]
    public string Email { get; set; }
}
```

## Validation Command
```powershell
roslynator analyze --analyzer-assemblies MyProject.Analyzers.dll
```

## Agent Integration
All agents must run this validator before committing API changes.
```

### Custom PowerShell Validator

**Example: Performance Check**

`Workspaces/Scripts/validate-performance.ps1`:
```powershell
# Custom performance validator

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectPath
)

Write-Host "Running Performance Validation..." -ForegroundColor Cyan

# Check for N+1 query patterns
$nPlusOnePatterns = Get-ChildItem -Path $ProjectPath -Recurse -Filter "*.cs" | 
    Select-String -Pattern "foreach.*\.Where\(" 

if ($nPlusOnePatterns) {
    Write-Host "WARNING: Potential N+1 query detected!" -ForegroundColor Yellow
    $nPlusOnePatterns | ForEach-Object {
        Write-Host "  File: $($_.Path):$($_.LineNumber)" -ForegroundColor Yellow
    }
}

# Check for synchronous I/O
$syncIO = Get-ChildItem -Path $ProjectPath -Recurse -Filter "*.cs" | 
    Select-String -Pattern "\.Result|\.Wait\(\)" 

if ($syncIO) {
    Write-Host "ERROR: Synchronous I/O detected!" -ForegroundColor Red
    $syncIO | ForEach-Object {
        Write-Host "  File: $($_.Path):$($_.LineNumber)" -ForegroundColor Red
    }
    exit 1
}

Write-Host "Performance validation passed!" -ForegroundColor Green
```

Reference in agent prompts:
```markdown
#file:Workspaces/Scripts/validate-performance.ps1

Before committing, run:
powershell -File Workspaces/Scripts/validate-performance.ps1 -ProjectPath .
```

---

## Extending Agents

### Creating Custom Agent

**Example: Database Migration Agent**

`.github/prompts/db-migration.prompt.md`:

````markdown
---
mode: db-migration
parameters:
  - migration_name: string (required)
  - description: string (required)
  - rollback: boolean (optional, default: true)
---

# Database Migration Agent

You are a database migration specialist agent.

## Your Role
Create safe, reversible database migrations.

## Execution Steps

### Step 1: Analyze Request
- Review migration description
- Identify affected tables/columns
- Check for breaking changes

### Step 2: Generate Migration
```csharp
public partial class {{MIGRATION_NAME}} : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Your changes here
    }
    
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Rollback changes
    }
}
```

### Step 3: Validate
- Ensure Down() reverses Up()
- Check for data loss risks
- Verify foreign key constraints

### Step 4: Test
```powershell
dotnet ef migrations add {{MIGRATION_NAME}}
dotnet ef database update --dry-run
```

### Step 5: Commit
If validation passes:
```powershell
git add Migrations/
git commit -m "Add migration: {{MIGRATION_NAME}}"
```

## Safety Rules
- Always implement Down() method
- Never drop columns with data
- Use transactions for multi-step migrations
- Test rollback before committing
````

**Usage:**
```
@workspace /db-migration migration_name=AddUserPreferences description="Add preferences table for users"
```

---

## Tips & Tricks

### Batch Operations

Process multiple files efficiently:

```powershell
# Refactor all controllers
Get-ChildItem -Path Controllers -Filter "*.cs" | ForEach-Object {
    # Note: Actually use individual agent calls
    Write-Host "Would refactor: $($_.Name)"
}

# Then use agent:
@workspace /refactor scope=Controllers/ mode=patterns
```

### Template Responses

Save common agent commands:

**File: `agent-templates.md`**
```markdown
# Common Agent Commands

## Daily Standup
@workspace /healthcheck mode=quick
@workspace /learning action=analyze scope=refactoring

## Bug Fix
@workspace /question "What causes [BUG_DESCRIPTION]?"
@workspace /task key=bugfix-XXX tasks="Fix [BUG_DESCRIPTION]"

## Feature Development
@workspace /task key=feature-XXX tasks="[FEATURE_DESCRIPTION]" layers="Controllers,Services,Data"
@workspace /refactor scope=[FEATURE_FILES] mode=comprehensive
@workspace /sync target=docs
```

### Keyboard Shortcuts

Set up VS Code shortcuts for common commands:

**File: `.vscode/keybindings.json`**
```json
[
  {
    "key": "ctrl+shift+h",
    "command": "workbench.action.terminal.sendSequence",
    "args": { "text": "@workspace /healthcheck mode=quick\n" }
  },
  {
    "key": "ctrl+shift+t",
    "command": "workbench.action.terminal.sendSequence",
    "args": { "text": "@workspace /task key= tasks=\"\u001b[3D" }
  }
]
```

---

## Best Practices Summary

1. **Start Small** - Test agents on small tasks before large refactorings
2. **Review Changes** - Always review agent-generated code before committing
3. **Learn Patterns** - Review learning reports monthly
4. **Share Knowledge** - Commit pattern files for team benefit
5. **Automate Validation** - Use CI/CD integration
6. **Customize** - Adapt agents to your project's specific needs
7. **Monitor Performance** - Keep pattern files manageable
8. **Document** - Keep PROJECT-SETUP-SUMMARY.md updated

---

*Last Updated: October 11, 2025*
