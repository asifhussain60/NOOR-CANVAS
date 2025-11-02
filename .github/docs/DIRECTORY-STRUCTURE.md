# KDS v3.0 Directory Structure

**Last Updated:** 2025-11-02  
**Status:** Infrastructure Complete

---

## 📁 Complete Directory Tree

```
.github/
│
├── README.md                                    # System overview & quick start
├── KDS-DESIGN-PLAN.md                          # Complete design documentation
├── KDS-V3-IMPLEMENTATION-PLAN.md               # Detailed implementation plan
│
├── docs/                                        # 📚 ALL DOCUMENTATION
│   │
│   ├── architecture/                            # System design & patterns
│   │   ├── system-overview.md                  # High-level architecture
│   │   ├── prompt-architecture.md              # Prompt design patterns
│   │   ├── workflow-diagrams.md                # Visual workflow documentation
│   │   └── design-decisions.md                 # Architectural decision records
│   │
│   ├── database/                                # Database documentation
│   │   ├── schema-reference.md                 # Complete schema documentation
│   │   ├── session-212-data.md                 # Canonical test data (Session 212)
│   │   ├── stored-procedures.md                # SP documentation
│   │   └── migration-guide.md                  # Database migration procedures
│   │
│   ├── api/                                     # API documentation
│   │   ├── endpoints-reference.md              # All API endpoints
│   │   ├── contracts.md                        # Request/response contracts
│   │   ├── signalr-hubs.md                     # SignalR hub documentation
│   │   └── authentication.md                   # Auth flow documentation
│   │
│   ├── testing/                                 # Testing documentation
│   │   ├── playwright-guide.md                 # Playwright test patterns
│   │   ├── test-patterns.md                    # Reusable test patterns
│   │   ├── orchestration-guide.md              # Test orchestration (dotnet)
│   │   └── session-212-reference.md            # Session 212 usage in tests
│   │
│   └── guides/                                  # User guides
│       ├── quick-start.md                      # 5-minute getting started
│       ├── creating-prompts.md                 # Prompt development guide
│       ├── customizing-templates.md            # Template customization
│       ├── troubleshooting.md                  # Common issues & fixes
│       └── migration-from-v2.md                # Migrating from v2.1.0
│
├── governance/                                  # 🛡️ RULES & COMPLIANCE
│   ├── kds-rulebook.md                         # 12 core rules (CANONICAL SOURCE)
│   ├── prompt-standards.md                     # Prompt development standards
│   ├── validation-requirements.md              # Schema validation rules
│   └── breaking-changes.md                     # Breaking change policy
│
├── prompts/                                     # 🤖 AGENT PROMPTS
│   │
│   ├── route.prompt.md                         # Entry point - intent detection
│   ├── plan.prompt.md                          # Planning orchestrator
│   ├── execute.prompt.md                       # Execution engine
│   ├── test.prompt.md                          # Test generation & orchestration
│   ├── validate.prompt.md                      # Health checks & validation
│   ├── govern.prompt.md                        # Governance gatekeeper
│   │
│   └── core/                                    # Shared prompt modules
│       ├── validation.md                       # Pre/post execution validation
│       ├── handoff.md                          # Handoff workflow patterns
│       ├── test-first.md                       # TDD workflow (red-green-refactor)
│       ├── output-formatter.md                 # Template rendering logic
│       └── yaml-parser.md                      # YAML front matter parsing
│
├── knowledge/                                   # 📚 PUBLISHED PATTERNS (v4.1)
│   │
│   ├── README.md                               # Publishing mechanism guide
│   │
│   ├── test-patterns/                           # Successful test strategies
│   │   ├── README.md
│   │   └── playwright-element-selection.md     # Element selector patterns
│   │
│   ├── test-data/                               # Validated test data
│   │   ├── README.md
│   │   └── session-212.md                      # Session 212 test data
│   │
│   ├── ui-mappings/                             # UI element testid mappings
│   │   └── README.md
│   │
│   ├── workflows/                               # End-to-end flow patterns
│   │   └── README.md
│   │
│   └── update-requests/                         # Stale doc update requests
│       └── README.md
│
├── schemas/                                     # 📐 JSON/XML SCHEMAS
│   │
│   ├── handoffs/                                # Handoff JSON schemas
│   │   ├── handoff-schema.json                 # Main handoff schema (base)
│   │   ├── plan-handoff.json                   # Plan-specific extensions
│   │   ├── execute-handoff.json                # Execute-specific extensions
│   │   ├── test-handoff.json                   # Test-specific extensions
│   │   └── validate-handoff.json               # Validate-specific extensions
│   │
│   └── outputs/                                 # Output XML schemas
│       ├── plan-output.xsd                     # Plan generation output
│       ├── task-output.xsd                     # Task execution output
│       ├── test-output.xsd                     # Test generation output
│       ├── validation-result.xsd               # Validation reports
│       └── error-output.xsd                    # Error reporting schema
│
├── templates/                                   # 📝 MUSTACHE TEMPLATES
│   │
│   ├── user-output/                             # User-facing response templates
│   │   ├── plan-complete.mustache              # Plan approval output
│   │   ├── phase-complete.mustache             # Phase completion output
│   │   ├── task-complete.mustache              # Task completion output
│   │   ├── test-ready.mustache                 # Test generation output
│   │   ├── validation-report.mustache          # Health check report
│   │   └── error.mustache                      # Error reporting output
│   │
│   └── handoffs/                                # Handoff JSON templates
│       ├── plan-to-execute.json                # Plan → Execute handoff
│       ├── execute-to-test.json                # Execute → Test handoff
│       ├── test-to-validate.json               # Test → Validate handoff
│       └── validate-to-govern.json             # Validate → Govern handoff
│
├── services/                                    # 🔧 C# SERVICES
│   ├── TemplateEngine.cs                       # Mustache rendering service
│   ├── SchemaValidator.cs                      # JSON/XML validation service
│   ├── PromptMonitoringService.cs              # Performance tracking service
│   ├── PromptCacheService.cs                   # Response caching service
│   └── YamlFrontMatterParser.cs                # YAML header parsing
│
├── keys/                                        # 🗄️ WORK STREAM DATA
│   │
│   └── {key-name}/                              # Per-key workspace
│       ├── plan.md                             # Current plan (regenerated)
│       ├── work-log.md                         # Activity log (append-only)
│       │
│       └── handoffs/                            # Active handoff JSONs
│           ├── phase-1-task-1.json             # Phase 1, Task 1
│           ├── phase-1-task-2.json             # Phase 1, Task 2
│           ├── phase-2-task-1.json             # Phase 2, Task 1
│           └── ...
│
├── tests/                                       # 🧪 PROMPT & INTEGRATION TESTS
│   │
│   ├── patterns/                                # Reusable test patterns
│   │   ├── auth-pattern.json                   # Authentication test pattern
│   │   ├── crud-pattern.json                   # CRUD operation pattern
│   │   ├── ui-pattern.json                     # UI component test pattern
│   │   └── api-pattern.json                    # API endpoint test pattern
│   │
│   ├── specs/                                   # Test specifications (Playwright)
│   │   ├── schema-validation.spec.ts           # JSON/XML schema validation
│   │   ├── template-rendering.spec.ts          # Mustache template tests
│   │   ├── performance.spec.ts                 # Token/time benchmarks
│   │   ├── integration.spec.ts                 # End-to-end workflow tests
│   │   └── prompt-regression.spec.ts           # Prompt regression tests
│   │
│   ├── promptfoo-config.yaml                   # Prompt testing configuration
│   ├── index.json                              # Global test registry
│   └── README.md                               # Testing documentation
│
├── scripts/                                     # 🔨 UTILITY SCRIPTS
│   ├── migrate-to-v3.ps1                       # Migration from v2.1.0
│   ├── validate-prompts.ps1                    # Prompt validation
│   ├── rebuild-test-index.ps1                  # Test registry rebuild
│   ├── check-schema-coverage.ps1               # Schema coverage report
│   └── analyze-performance.ps1                 # Performance metrics analysis
│
└── hooks/                                       # 🪝 GIT HOOKS
    ├── pre-commit                              # Validation before commit
    ├── post-test-creation.ps1                  # After test generation
    └── README.md                               # Hook documentation
```

---

## 📊 Statistics

### Current State (Infrastructure Phase)

| Metric | Count |
|--------|-------|
| **Total Directories** | 22 |
| **Total Files** | 11 |
| **Documentation Folders** | 5 |
| **Knowledge Categories** | 4 |
| **Published Patterns** | 2 |
| **Prompt Files** | 2 (ask-kds, knowledge-retriever) |
| **Schema Files** | 0 (pending) |
| **Template Files** | 0 (pending) |
| **Service Files** | 0 (pending) |

### Target State (Post-Implementation)

| Metric | Count |
|--------|-------|
| **Total Directories** | 22 |
| **Total Files** | ~70 |
| **Documentation Files** | ~20 |
| **Prompt Files** | 13 (6 user + 7 internal) |
| **Knowledge Patterns** | 10+ (published over time) |
| **Schema Files** | 10 |
| **Template Files** | 10 |
| **Service Files** | 5 |
| **Test Files** | 8 |
| **Script Files** | 5 |

---

## 🎯 Design Principles

### 1. Consistent Naming

**Files:**
- Prompts: `{name}.prompt.md`
- Schemas (JSON): `{type}-schema.json`
- Schemas (XML): `{type}-output.xsd`
- Templates: `{name}.mustache`
- Docs: `{topic}-{type}.md`

**Folders:**
- All lowercase
- Hyphen-separated (if multi-word)
- Descriptive single-word preferred

### 2. Logical Hierarchy

**Documentation:**
```
docs/
├── architecture/    # System design (for architects)
├── database/        # DB schemas (for backend devs)
├── api/             # API contracts (for frontend devs)
├── testing/         # Test guides (for QA/test writers)
└── guides/          # User guides (for all users)
```

**Prompts:**
```
prompts/
├── *.prompt.md      # 6 main prompts (user-invoked)
└── core/            # Shared modules (referenced, not invoked)
```

### 3. Single Source of Truth

- **Governance:** `governance/kds-rulebook.md` (not duplicated)
- **Schemas:** Single schema per type (referenced by all)
- **Templates:** Single template per output type (customizable)
- **Core Modules:** Shared logic extracted (referenced via INCLUDE)

### 4. Separation of Concerns

| Folder | Purpose | Contains |
|--------|---------|----------|
| `docs/` | Knowledge & reference | Markdown documentation |
| `governance/` | Rules & compliance | Governance documents |
| `prompts/` | Agent logic | Prompt files (user-facing + modules) |
| `schemas/` | Validation | JSON/XML schemas |
| `templates/` | User output | Mustache templates |
| `services/` | Business logic | C# services |
| `keys/` | Work data | Per-key workspaces |
| `tests/` | Quality assurance | Test specs & patterns |
| `scripts/` | Automation | PowerShell utilities |
| `hooks/` | Git integration | Pre/post-commit hooks |

---

## 🔄 Migration Notes

### From v2.1.0 Structure

**Old (150+ files, 12+ folders):**
```
.github/
├── prompts/ (14 files - overlapping logic)
├── instructions/ (50+ files - scattered)
├── governance/ (multiple rulebooks)
├── key-data-streams/ (old name)
└── test-registry/ (complex KDTR system)
```

**New (60 files, 10 folders):**
```
.github/
├── prompts/ (6 files + 5 modules)
├── docs/ (20 files - organized by topic)
├── governance/ (single rulebook)
├── keys/ (renamed, cleaner)
└── tests/ (simplified registry)
```

**Key Changes:**
- ❌ Removed 8 redundant prompts (14 → 6)
- ✅ Organized docs by domain (5 subfolders)
- ✅ Consolidated governance (1 rulebook vs 3+)
- ✅ Simplified test registry (index.json vs KDTR)
- ✅ Renamed `key-data-streams/` → `keys/`

---

## 📝 File Conventions

### Documentation Files

**Format:** `{topic}-{type}.md`

**Examples:**
- `system-overview.md` (architecture)
- `schema-reference.md` (database)
- `endpoints-reference.md` (api)
- `playwright-guide.md` (testing)
- `quick-start.md` (guides)

### Prompt Files

**Format:** `{name}.prompt.md`

**YAML Front Matter Required:**
```yaml
---
name: execute.prompt.md
version: 3.0.0
description: Execution engine - implements code changes
mode: agent
output_schema: schemas/outputs/task-output.xsd
dependencies:
  test.prompt.md: ^3.0.0
---
```

### Schema Files

**JSON:** `{type}-schema.json`
- `handoff-schema.json`
- `plan-handoff.json`

**XML:** `{type}-output.xsd`
- `plan-output.xsd`
- `task-output.xsd`

### Template Files

**Format:** `{name}.mustache`

**Examples:**
- `plan-complete.mustache`
- `task-complete.mustache`
- `error.mustache`

---

## ✅ Verification

### Directory Structure Created

```powershell
# Verify all folders exist
Get-ChildItem "D:\PROJECTS\NOOR CANVAS\.github" -Directory -Recurse | 
  Select-Object FullName | 
  Sort-Object FullName
```

### Expected Output

```
docs
docs\api
docs\architecture
docs\database
docs\guides
docs\testing
governance
hooks
keys
prompts
prompts\core
schemas
schemas\handoffs
schemas\outputs
scripts
services
templates
templates\handoffs
templates\user-output
tests
tests\patterns
tests\specs
```

**Status:** ✅ All folders created successfully

---

**Document Status:** Complete  
**Infrastructure Status:** Ready for Phase 1 Implementation  
**Next Step:** Create schemas and templates (Phase 1)
