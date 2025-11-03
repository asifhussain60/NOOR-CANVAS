# KDS v3.0 - Key Data Streams System

**Version:** 3.0.0  
**Status:** 🏗️ INFRASTRUCTURE READY  
**Framework:** .NET 8.0 (Blazor) + Playwright + PowerShell  
**Last Updated:** 2025-11-02

---

## 📋 Overview

KDS (Key Data Streams) is a prompt engineering system designed to manage GitHub Copilot context efficiently for building applications. It provides:

1. **Context Management** - Break features into planned phases/tasks with auto-execution
2. **Task Orchestration** - Chain tasks using handoff JSON files
3. **Test Standardization** - Playwright orchestration and test pattern reuse
4. **Template-Driven Output** - Customizable user responses via Mustache templates

---

## 🗂️ Directory Structure

```
KDS/
├── README.md                           # This file - system overview
│
├── docs/                               # 📚 ALL DOCUMENTATION
│   ├── architecture/                   # System design & patterns
│   │   ├── KDS-DESIGN-PLAN.md         # Complete design documentation
│   │   ├── KDS-V3-IMPLEMENTATION-PLAN.md # Detailed implementation plan
│   │   ├── system-overview.md
│   │   ├── prompt-architecture.md
│   │   └── workflow-diagrams.md
│   │
│   ├── database/                       # Database documentation
│   │   ├── schema-reference.md
│   │   ├── session-212-data.md        # Canonical test data
│   │   └── stored-procedures.md
│   │
│   ├── api/                            # API documentation
│   │   ├── endpoints-reference.md
│   │   ├── contracts.md
│   │   └── signalr-hubs.md
│   │
│   ├── testing/                        # Testing documentation
│   │   ├── playwright-guide.md
│   │   ├── test-patterns.md
│   │   └── orchestration-guide.md
│   │
│   └── guides/                         # User guides
│       ├── QUICK-REFERENCE.md         # Fast lookup reference
│       ├── PHASE-0-COMPLETE.md        # Phase 0 completion summary
│       ├── quick-start.md
│       ├── creating-prompts.md
│       ├── customizing-templates.md
│       └── troubleshooting.md
│
├── governance/                         # 🛡️ RULES & COMPLIANCE
│   ├── kds-rulebook.md                # 12 core rules (CANONICAL)
│   ├── prompt-standards.md            # Prompt development standards
│   └── validation-requirements.md     # Schema validation rules
│
├── prompts/                            # 🤖 AGENT PROMPTS (6 total)
│   ├── route.prompt.md                # Entry point - intent detection
│   ├── plan.prompt.md                 # Planning orchestrator
│   ├── execute.prompt.md              # Execution engine
│   ├── test.prompt.md                 # Test generation & orchestration
│   ├── validate.prompt.md             # Health checks & validation
│   ├── govern.prompt.md               # Governance gatekeeper
│   │
│   └── core/                           # Shared prompt modules
│       ├── validation.md              # Shared validation logic
│       ├── handoff.md                 # Handoff workflow
│       ├── test-first.md              # TDD workflow
│       └── output-formatter.md        # Template rendering
│
├── schemas/                            # 📐 JSON/XML SCHEMAS
│   ├── handoffs/                       # Handoff JSON schemas
│   │   ├── handoff-schema.json        # Main handoff schema
│   │   ├── plan-handoff.json
│   │   ├── execute-handoff.json
│   │   └── test-handoff.json
│   │
│   └── outputs/                        # Output XML schemas
│       ├── plan-output.xsd
│       ├── task-output.xsd
│       ├── test-output.xsd
│       └── validation-result.xsd
│
├── templates/                          # 📝 MUSTACHE TEMPLATES
│   ├── user-output/                    # User-facing responses
│   │   ├── plan-complete.mustache
│   │   ├── phase-complete.mustache
│   │   ├── task-complete.mustache
│   │   ├── test-ready.mustache
│   │   ├── validation-report.mustache
│   │   └── error.mustache
│   │
│   └── handoffs/                       # Handoff JSON templates
│       ├── plan-to-execute.json
│       ├── execute-to-test.json
│       └── test-to-validate.json
│
├── services/                           # 🔧 C# SERVICES
│   ├── TemplateEngine.cs              # Mustache rendering service
│   ├── SchemaValidator.cs             # JSON/XML validation service
│   ├── PromptMonitoringService.cs     # Performance tracking
│   └── PromptCacheService.cs          # Response caching
│
├── keys/                               # 🗄️ WORK STREAM DATA
│   └── {key-name}/                     # Per-key workspace
│       ├── plan.md                     # Current plan
│       ├── work-log.md                 # Activity log (append-only)
│       └── handoffs/                   # Active handoff JSONs
│           ├── phase-1-task-1.json
│           └── phase-1-task-2.json
│
├── tests/                              # 🧪 PROMPT TESTS
│   ├── patterns/                       # Reusable test patterns
│   │   ├── auth-pattern.json
│   │   ├── crud-pattern.json
│   │   └── ui-pattern.json
│   │
│   ├── specs/                          # Test specifications
│   │   ├── schema-validation.spec.ts
│   │   ├── template-rendering.spec.ts
│   │   ├── performance.spec.ts
│   │   └── integration.spec.ts
│   │
│   ├── promptfoo-config.yaml          # Prompt testing config
│   └── index.json                      # Global test registry
│
├── scripts/                            # 🔨 UTILITY SCRIPTS
│   ├── migrate-to-v3.ps1              # Migration script
│   ├── validate-prompts.ps1           # Prompt validation
│   └── rebuild-test-index.ps1         # Test registry rebuild
│
└── hooks/                              # 🪝 GIT HOOKS
    ├── pre-commit                      # Validation before commit
    └── post-test-creation.ps1         # After test generation
```

---

## 🚀 Quick Start

### 1. Create New Feature

```bash
@workspace /route request="Add user dashboard with authentication"
```

**System will:**
- Detect multi-task request
- Route to `plan.prompt.md`
- Generate phases/tasks
- Create handoff JSONs
- Output next command

### 2. Execute Plan

```bash
@workspace /execute #file:KDS/keys/user-dashboard/handoffs/phase-1-task-1.json
```

**System will:**
- Load handoff JSON
- Validate against schema
- Implement code changes
- Run build + tests
- Update work-log.md
- Auto-chain to next task (if enabled)

### 3. Run Tests

```bash
@workspace /test key=user-dashboard task=1a
```

**System will:**
- Check test registry for patterns
- Generate Playwright test
- Create orchestration script
- Run test
- Update registry if passed

---

## 📚 Documentation

### Core Documentation (Read First)

1. **[Quick Start Guide](docs/guides/quick-start.md)** - Get started in 5 minutes
2. **[KDS Design Plan](docs/architecture/KDS-DESIGN-PLAN.md)** - Complete system design
3. **[KDS Rulebook](governance/kds-rulebook.md)** - 13 core governance rules
4. **[Quick Reference](docs/guides/QUICK-REFERENCE.md)** - Fast lookup for common operations

### By Topic

**Architecture & Design:**
- [KDS Design Plan](docs/architecture/KDS-DESIGN-PLAN.md) - Complete v3.0 design
- [KDS Implementation Plan](docs/architecture/KDS-V3-IMPLEMENTATION-PLAN.md) - Detailed implementation
- [System Overview](docs/architecture/system-overview.md)
- [Prompt Architecture](docs/architecture/prompt-architecture.md)
- [Workflow Diagrams](docs/architecture/workflow-diagrams.md)

**Database:**
- [Schema Reference](docs/database/schema-reference.md)
- [Session 212 Data](docs/database/session-212-data.md) - Canonical test data
- [Stored Procedures](docs/database/stored-procedures.md)

**API:**
- [Endpoints Reference](docs/api/endpoints-reference.md)
- [Contracts](docs/api/contracts.md)
- [SignalR Hubs](docs/api/signalr-hubs.md)

**Testing:**
- [Playwright Guide](docs/testing/playwright-guide.md)
- [Test Patterns](docs/testing/test-patterns.md)
- [Orchestration Guide](docs/testing/orchestration-guide.md)

**Guides:**
- [Quick Reference](docs/guides/QUICK-REFERENCE.md) - Fast lookup
- [Phase 0 Complete](docs/guides/PHASE-0-COMPLETE.md) - Infrastructure setup summary
- [Quick Start](docs/guides/quick-start.md)
- [Creating Prompts](docs/guides/creating-prompts.md)
- [Customizing Templates](docs/guides/customizing-templates.md)
- [Troubleshooting](docs/guides/troubleshooting.md)

---

## 🎯 Health Dashboard

### Quick Access

**🚀 ONE COMMAND (Recommended):**
```bash
# All-in-one: Start API server + Open dashboard
Ctrl+Shift+P → Tasks: Run Task → "kds: launch dashboard (all-in-one)"
```

**Alternative Methods:**
```bash
# Method 1: PowerShell (all-in-one)
.\KDS\scripts\launch-dashboard.ps1

# Method 2: Separate control
Ctrl+Shift+P → "kds: start api server"  # Terminal 1
Ctrl+Shift+P → "kds: health dashboard"  # Browser opens

# Method 3: Dashboard only (demo mode)
Double-click: KDS\kds-dashboard.html
```

**Features:**
- 📊 **Overview Tab** - System status at a glance
- ❤️ **Health Checks** - 7 categories, 39+ checks (expandable drill-down)
- 🧠 **BRAIN Metrics** - Event stream, knowledge graph stats
- 📝 **Activity Log** - Recent system events
- 🔄 **Auto-Refresh** - Configurable interval (30s default)
- 📤 **Export Reports** - JSON format for analysis
- 🔗 **Live Mode** - Real health checks via API server
- 🎮 **Demo Mode** - Simulated checks (fallback)

**Architecture:**
- ✅ Single HTML file (~60KB)
- ✅ Zero external dependencies
- ✅ Beautiful dark theme
- ✅ Real-time status animations
- ✅ 100% portable

See [Dashboard Documentation](dashboard/README.md) for full details.

---

## 🛠️ Configuration

### Customize User Output Templates

All user-facing responses use Mustache templates. Edit without touching prompts:

```bash
# Edit template
code KDS/templates/user-output/plan-complete.mustache

# Changes apply immediately (no prompt modifications needed)
```

**Template Variables:**
- `{{key}}` - KDS key identifier
- `{{phases}}` - Array of phase objects
- `{{tasks}}` - Array of task objects
- `{{timestamp}}` - ISO 8601 timestamp
- `{{nextCommand}}` - Next invocation command

### Adjust Performance Settings

```json
// appsettings.json
{
  "KDS": {
    "CacheDurationMinutes": 30,
    "MaxTokensPerPrompt": 4000,
    "EnablePerformanceMonitoring": true,
    "TemplateEngine": "Mustache"
  }
}
```

---

## 🧪 Testing

### Run All Tests

```bash
# Test all prompts (regression testing)
npm run test:prompts

# Test JSON/XML schemas
npm run test:schemas

# Test template rendering
npm run test:templates

# Performance benchmarks
npm run test:performance

# Full test suite
npm run test:all
```

### Validate Prompts

```bash
# Lint all prompts
npm run lint:prompts

# Validate handoff JSONs
npm run validate:handoffs

# Check for hardcoded strings
npm run check:templates
```

---

## 📐 Schemas

### Handoff JSON Schema

All handoff files validated against `KDS/schemas/handoffs/handoff-schema.json`:

```json
{
  "key": "string (required)",
  "action": "plan | execute | test | validate | govern",
  "phase": "integer (optional)",
  "task": "string (optional, format: '1a')",
  "data": {
    "description": "string (required)",
    "files": ["array of file paths"],
    "tests": ["array of test paths"],
    "acceptance": ["array of criteria (required)"],
    "next": "string (next handoff file or 'complete')"
  }
}
```

### Output XML Schemas

All prompt outputs validated against XML schemas in `KDS/schemas/outputs/`:

- `plan-output.xsd` - Plan generation output
- `task-output.xsd` - Task execution output
- `test-output.xsd` - Test generation output
- `validation-result.xsd` - Validation reports

---

## 🏗️ Architecture

### 6 Specialized Prompts

| Prompt | Responsibility | Input | Output |
|--------|---------------|-------|--------|
| **route.prompt.md** | Intent detection & routing | User request | Routing decision + handoff |
| **plan.prompt.md** | Phase/task breakdown | Feature request | Plan + handoff JSONs |
| **execute.prompt.md** | Code implementation | Handoff JSON | Updated files + validation |
| **test.prompt.md** | Test generation/execution | Test request | Playwright test + report |
| **validate.prompt.md** | System health checks | Validation request | Health report |
| **govern.prompt.md** | Governance compliance | KDS change | Approval/rejection |

### Core Modules (Zero Duplication)

Shared logic extracted to `/prompts/core/`:

- `validation.md` - Pre/post-execution validation
- `handoff.md` - Handoff workflow patterns
- `test-first.md` - TDD workflow
- `output-formatter.md` - Template rendering

**Usage in prompts:**
```markdown
## Step 3: Validate Environment

<!-- INCLUDE: core/validation.md#Pre-Execution-Validation -->
```

---

## 📊 Performance Monitoring

### Tracked Metrics

- **Execution Time** - Milliseconds per prompt
- **Token Usage** - Estimated tokens consumed
- **Memory Usage** - Memory delta during execution
- **Cache Hit Rate** - Percentage of cached responses
- **Schema Validation** - Success/failure rate

### View Metrics

```bash
# View performance logs
cat SPA/NoorCanvas/logs/prompt-metrics.log

# Generate performance report
dotnet run --project Tools/PromptMetrics -- report --last 7d
```

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| **3.0.0** | 2025-11-02 | Complete redesign - 6 prompts, template-driven, schema validation |
| **2.1.0** | 2025-11-01 | Added Rule #20 (KDTR), test registry system |
| **2.0.0** | 2025-10-31 | Major governance overhaul, centralized Step -1 |
| **1.0.0** | 2025-09-01 | Initial KDS system release |

---

## 🆘 Support

### Common Issues

**Build Errors:**
- See [Troubleshooting Guide](docs/guides/troubleshooting.md#build-errors)

**Schema Validation Failures:**
- Check [Validation Requirements](governance/validation-requirements.md)

**Template Rendering Issues:**
- Review [Customizing Templates](docs/guides/customizing-templates.md)

### Getting Help

1. Check [Quick Start Guide](docs/guides/quick-start.md)
2. Review [Troubleshooting Guide](docs/guides/troubleshooting.md)
3. Search [KDS Rulebook](governance/kds-rulebook.md)
4. Check existing work logs in `KDS/keys/{key}/work-log.md`

---

## 📝 File Naming Conventions

### Prompts
- Format: `{name}.prompt.md`
- Examples: `route.prompt.md`, `plan.prompt.md`

### Schemas
- JSON: `{type}-schema.json`
- XML: `{type}-output.xsd`
- Examples: `handoff-schema.json`, `plan-output.xsd`

### Templates
- Format: `{name}.mustache`
- Examples: `plan-complete.mustache`, `task-complete.mustache`

### Documentation
- Format: `{topic}-{type}.md`
- Examples: `system-overview.md`, `quick-start.md`

### Keys
- Format: `{feature-name}` (lowercase, hyphen-separated)
- Examples: `user-dashboard`, `auth-flow`, `debug-panel`

### Handoffs
- Format: `phase-{N}-task-{M}.json`
- Examples: `phase-1-task-1.json`, `phase-2-task-3.json`

---

## 🎯 Implementation Status

### Phase 0: Infrastructure ✅ COMPLETE
- [x] Clean directory structure created
- [x] README documentation
- [x] Folder hierarchy established
- [x] Naming conventions defined

### Phase 1: Schemas & Templates ⏳ PENDING
- [ ] Create JSON schemas (4 files)
- [ ] Create XML schemas (3 files)
- [ ] Create Mustache templates (6 files)
- [ ] Create validation services

### Phase 2: Core Modules ⏳ PENDING
- [ ] Create validation.md
- [ ] Create handoff.md
- [ ] Create test-first.md
- [ ] Create output-formatter.md

### Phase 3: Governance ⏳ PENDING
- [ ] Create kds-rulebook.md (12 rules)
- [ ] Create prompt-standards.md
- [ ] Create validation-requirements.md

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

### Phase 6: Documentation ⏳ PENDING
- [ ] Create all architecture docs
- [ ] Create all database docs
- [ ] Create all API docs
- [ ] Create all testing docs
- [ ] Create all guides

---

**System Status:** Infrastructure Ready - Awaiting Phase 1 Implementation  
**Next Command:** Begin Phase 1 (Schemas & Templates)  
**Estimated Completion:** 6.5 hours total
