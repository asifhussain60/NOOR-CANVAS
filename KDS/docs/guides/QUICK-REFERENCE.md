# KDS v3.0 - Quick Reference Card

**Version:** 3.0.0  
**Status:** Infrastructure Ready  
**Last Updated:** 2025-11-02

---

## 📁 Folder Quick Reference

| Folder | Purpose | Contains |
|--------|---------|----------|
| **📚 docs/** | All documentation | 20+ markdown files organized by domain |
| **🛡️ governance/** | Rules & standards | kds-rulebook.md (12 rules) + standards |
| **🤖 prompts/** | Agent prompts | 6 main prompts + 5 core modules |
| **📐 schemas/** | Validation schemas | JSON schemas + XML schemas |
| **📝 templates/** | Output templates | Mustache templates for user responses |
| **🔧 services/** | C# services | Template engine, validators, monitoring |
| **🗄️ keys/** | Work streams | Per-key workspaces (plan, logs, handoffs) |
| **🧪 tests/** | Prompt tests | Test patterns + specs + registry |
| **🔨 scripts/** | Utilities | PowerShell automation scripts |
| **🪝 hooks/** | Git hooks | Pre-commit validation |

---

## 🚀 Common Commands

### Creating Features

```bash
# New multi-task feature
@workspace /route request="Add user dashboard with auth"

# Execute specific phase
@workspace /execute #file:KDS/keys/user-dashboard/handoffs/phase-1-task-1.json

# Run tests
@workspace /test key=user-dashboard task=1a

# Validate system health
@workspace /validate

# Governance review
@workspace /govern request="Add new validation rule"
```

---

## 📝 File Naming Conventions

| Type | Format | Example |
|------|--------|---------|
| **Prompts** | `{name}.prompt.md` | `route.prompt.md` |
| **Schemas (JSON)** | `{type}-schema.json` | `handoff-schema.json` |
| **Schemas (XML)** | `{type}-output.xsd` | `plan-output.xsd` |
| **Templates** | `{name}.mustache` | `plan-complete.mustache` |
| **Docs** | `{topic}-{type}.md` | `system-overview.md` |
| **Keys** | `{feature-name}` | `user-dashboard` |
| **Handoffs** | `phase-{N}-task-{M}.json` | `phase-1-task-2.json` |

---

## 📚 Essential Documentation

### Start Here
1. [README.md](../README.md) - System overview
2. [Quick Start](guides/quick-start.md) - Get started in 5 minutes
3. [KDS Rulebook](../governance/kds-rulebook.md) - 12 core rules

### By Role

**Architects:**
- [System Overview](architecture/system-overview.md)
- [Prompt Architecture](architecture/prompt-architecture.md)
- [Design Decisions](architecture/design-decisions.md)

**Backend Developers:**
- [Database Schema](database/schema-reference.md)
- [API Endpoints](api/endpoints-reference.md)
- [Stored Procedures](database/stored-procedures.md)

**Frontend Developers:**
- [API Contracts](api/contracts.md)
- [SignalR Hubs](api/signalr-hubs.md)
- [Session 212 Data](database/session-212-data.md)

**QA/Testers:**
- [Playwright Guide](testing/playwright-guide.md)
- [Test Patterns](testing/test-patterns.md)
- [Session 212 Reference](testing/session-212-reference.md)

**Prompt Developers:**
- [Creating Prompts](guides/creating-prompts.md)
- [Prompt Standards](../governance/prompt-standards.md)
- [Validation Requirements](../governance/validation-requirements.md)

---

## 🎯 6 Core Prompts

| Prompt | Role | When to Use |
|--------|------|-------------|
| **route.prompt.md** | Router | Entry point - all requests start here |
| **plan.prompt.md** | Planner | Multi-task features, new work streams |
| **execute.prompt.md** | Worker | Implement code changes from handoffs |
| **test.prompt.md** | Tester | Generate & run Playwright tests |
| **validate.prompt.md** | Monitor | System health checks, validation |
| **govern.prompt.md** | Gatekeeper | KDS changes, compliance review |

---

## 📐 Schema Files

### Handoff Schemas (JSON)
- `handoff-schema.json` - Base schema (all handoffs)
- `plan-handoff.json` - Plan-specific extensions
- `execute-handoff.json` - Execute-specific extensions
- `test-handoff.json` - Test-specific extensions

### Output Schemas (XML)
- `plan-output.xsd` - Plan generation output
- `task-output.xsd` - Task execution output
- `test-output.xsd` - Test generation output
- `validation-result.xsd` - Validation reports

---

## 📝 Template Files

### User Output Templates
- `plan-complete.mustache` - Plan approval screen
- `phase-complete.mustache` - Phase completion
- `task-complete.mustache` - Task completion
- `test-ready.mustache` - Test generation complete
- `validation-report.mustache` - Health check results
- `error.mustache` - Error reporting

### Handoff Templates
- `plan-to-execute.json` - Plan → Execute
- `execute-to-test.json` - Execute → Test
- `test-to-validate.json` - Test → Validate

---

## 🔧 Services (C#)

| Service | Purpose |
|---------|---------|
| **TemplateEngine.cs** | Render Mustache templates |
| **SchemaValidator.cs** | Validate JSON/XML against schemas |
| **PromptMonitoringService.cs** | Track performance metrics |
| **PromptCacheService.cs** | Cache prompt responses |
| **YamlFrontMatterParser.cs** | Parse prompt YAML headers |

---

## 🧪 Testing

### Test Commands

```bash
# Test all prompts
npm run test:prompts

# Test schemas
npm run test:schemas

# Test templates
npm run test:templates

# Performance benchmarks
npm run test:performance

# Full suite
npm run test:all
```

### Validation Commands

```bash
# Lint prompts
npm run lint:prompts

# Validate handoffs
npm run validate:handoffs

# Check templates
npm run check:templates
```

---

## 📊 Statistics

### Current State (Infrastructure Phase)

| Metric | Count |
|--------|-------|
| Folders | 22 (10 top-level + 12 sub-folders) |
| Files | 4 (README + 2 plans + DIRECTORY-STRUCTURE) |
| Prompts | 0 (pending Phase 4) |
| Schemas | 0 (pending Phase 1) |
| Templates | 0 (pending Phase 1) |

### Target State (Post-Implementation)

| Metric | Target |
|--------|--------|
| Folders | 22 |
| Files | ~60 |
| Prompts | 11 (6 main + 5 core) |
| Schemas | 10 (5 JSON + 5 XML) |
| Templates | 10 (6 user + 4 handoff) |
| Docs | 20+ |
| Tests | 8 |
| Services | 5 |

---

## ⏱️ Implementation Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 0: Infrastructure | 30 min | ✅ COMPLETE |
| Phase 1: Schemas & Templates | 1 hour | ⏳ Pending |
| Phase 2: Core Modules | 1 hour | ⏳ Pending |
| Phase 3: Governance | 1 hour | ⏳ Pending |
| Phase 4: Prompts | 2 hours | ⏳ Pending |
| Phase 5: Testing | 1 hour | ⏳ Pending |
| Phase 6: Documentation | 1 hour | ⏳ Pending |

**Total:** 6.5 hours

---

## 🎯 Key Improvements vs v2.1.0

| Aspect | v2.1.0 | v3.0.0 |
|--------|--------|--------|
| **Rules** | 20 | 12 (40% reduction) |
| **Prompts** | 14 | 6 (57% reduction) |
| **Files** | 150+ | ~60 (60% reduction) |
| **Duplication** | ~180 lines | 0 lines |
| **Governance** | 3+ files | 1 file |
| **Documentation** | Scattered (50+ files) | Organized (5 subfolders) |
| **Templates** | Hardcoded | Mustache (customizable) |
| **Schemas** | None | 10 (validation enforced) |
| **Testing** | Manual | Automated (promptfoo) |

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| **Build errors** | See [Troubleshooting Guide](guides/troubleshooting.md#build-errors) |
| **Schema validation fails** | Check [Validation Requirements](../governance/validation-requirements.md) |
| **Template rendering issues** | Review [Customizing Templates](guides/customizing-templates.md) |
| **Prompt not working** | Check YAML front matter, run `npm run lint:prompts` |
| **Performance slow** | Check cache settings in `appsettings.json` |

---

## 📖 Glossary

| Term | Definition |
|------|------------|
| **KDS** | Key Data Streams - the system name |
| **Key** | Work stream identifier (e.g., "user-dashboard") |
| **Handoff** | JSON file passed between prompts |
| **Phase** | Logical grouping of tasks in a plan |
| **Task** | Single unit of work (e.g., "1a", "2b") |
| **Template** | Mustache file for user-facing output |
| **Schema** | JSON/XML validation definition |
| **Core Module** | Shared prompt logic (referenced via INCLUDE) |

---

**Quick Start:** Read [README.md](../README.md) → [Quick Start Guide](guides/quick-start.md) → Start building!

**Support:** Check docs first, then review [Troubleshooting Guide](guides/troubleshooting.md)
