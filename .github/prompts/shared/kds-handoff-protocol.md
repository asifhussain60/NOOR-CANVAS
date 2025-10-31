# KDS Handoff Protocol
**Key: `kds`** | **Version**: 1.0.0 | **Status**: Phase 1 Implementation

---

## 🎯 Purpose

Defines the **Honest Handoff Protocol** for structured parameter passing between GitHub Copilot agents using JSON files + Next Command + HALT behavior.

**Core Principle**: Agents cannot execute other agents. Handoffs require manual user invocation via copy-paste commands.

---

## 📐 JSON Schema Standards

### Base Schema (All Handoffs)
```json
{
  "key": "string (required) - Unique identifier for work stream",
  "description": "string (required) - Detailed task description",
  "acceptanceCriteria": ["array of strings (required) - Success conditions"],
  "autoChain": "boolean (optional, default: false) - Enable auto-chaining for tasks",
  "nextTask": "string (optional) - Next task in sequence if autoChain=true"
}
```

### route-to-plan.json Schema
**Purpose**: Route agent → Plan agent handoff  
**Location**: `.github/key-data-streams/{key}/handoffs/route-to-plan.json`

```json
{
  "key": "feature-name",
  "description": "Multi-paragraph description of feature requirements, user needs, and context",
  "acceptanceCriteria": [
    "System can perform X",
    "User can access Y via Z",
    "Performance meets N threshold"
  ],
  "scope": "Brief scope definition (what's included/excluded)",
  "constraints": ["Technical constraints", "Timeline constraints"],
  "autoChain": false
}
```

**Example**:
```json
{
  "key": "db-backup",
  "description": "Implement automated database backup system with configurable retention policies. Must support PostgreSQL and MySQL, with backup verification and restoration testing.",
  "acceptanceCriteria": [
    "Automated backups run daily at 2 AM",
    "Retention policy configurable (7-day, 30-day, 90-day)",
    "Backup verification runs after each backup",
    "Restoration test passes on staging weekly"
  ],
  "scope": "Backup automation only; restoration UI deferred to Phase 2",
  "constraints": ["Must use existing cloud storage", "Max 15 GB storage per backup"],
  "autoChain": false
}
```

### route-to-test.json Schema
**Purpose**: Route agent → Test Generation agent handoff  
**Location**: `.github/key-data-streams/{key}/handoffs/route-to-test.json`

```json
{
  "key": "test-suite-name",
  "description": "Test requirements and scenarios to validate",
  "testType": "unit|integration|e2e|visual|coordination",
  "targetFiles": ["array of files to test"],
  "acceptanceCriteria": [
    "Test covers edge case X",
    "Test validates behavior Y"
  ],
  "autoChain": false
}
```

### phase-{N}-test.json Schema
**Purpose**: Plan agent → Test Generation agent handoff (per-phase tests)  
**Location**: `.github/key-data-streams/{key}/handoffs/phase-{N}-test.json`

```json
{
  "key": "feature-name",
  "phase": 1,
  "description": "Phase 1: Database schema creation - requires validation test",
  "testType": "integration",
  "targetFiles": ["Migrations/add-backup-table.sql"],
  "acceptanceCriteria": [
    "Schema creation succeeds",
    "Foreign keys validated",
    "Rollback tested"
  ],
  "testFile": "Tests/Integration/backup-schema.spec.md",
  "autoChain": true,
  "nextTask": "phase-1-todo-1.json"
}
```

### phase-{N}-todo-{M}.json Schema
**Purpose**: Plan agent → Task Execution agent handoff (per-task implementation)  
**Location**: `.github/key-data-streams/{key}/handoffs/phase-{N}-todo-{M}.json`

```json
{
  "key": "feature-name",
  "phase": 1,
  "task": 1,
  "description": "Create backup_schedules table with retention policy columns",
  "acceptanceCriteria": [
    "Table created with all required columns",
    "Indexes added for performance",
    "Migration script tested on dev database"
  ],
  "dependencies": ["phase-1-test.json must pass"],
  "autoChain": true,
  "nextTask": "phase-1-todo-2.json"
}
```

---

## 🔄 Handoff Workflow Diagrams

### Workflow 1: Feature Planning (route → plan)
```
User Request
    ↓
route.prompt.md analyzes request
    ↓
route creates handoffs/route-to-plan.json
    ↓
route displays: Next Command (Key: {key}): @workspace /plan #file:handoffs/route-to-plan.json
    ↓
route HALTS (no auto-execution)
    ↓
User copies/pastes command
    ↓
plan.prompt.md loads JSON
    ↓
plan generates multi-phase plan
    ↓
plan creates plan.md, work-log.md, phase-{N}-test.json, phase-{N}-todo-{M}.json files
    ↓
plan displays: Next Command (Key: {key}): @workspace /test-generation #file:handoffs/phase-1-test.json
    ↓
plan HALTS
```

### Workflow 2: Test-First Implementation (plan → test → todo)
```
plan.prompt.md creates phase-1-test.json
    ↓
User invokes: @workspace /test-generation #file:handoffs/phase-1-test.json
    ↓
test-generation creates test file
    ↓
test-generation displays: Next Command (Key: {key}): @workspace /todo #file:handoffs/phase-1-todo-1.json
    ↓
test-generation HALTS
    ↓
User invokes: @workspace /todo #file:handoffs/phase-1-todo-1.json
    ↓
todo.prompt.md loads JSON, implements task
    ↓
todo runs test (autoChain=true)
    ↓
IF test passes AND nextTask exists:
  todo displays: Next Command (Key: {key}): @workspace /todo #file:handoffs/phase-1-todo-2.json
ELSE:
  todo HALTS, asks user for next action
```

---

## 🛡️ Honest Handoff Rules

### ✅ DO:
1. **Create JSON file BEFORE displaying Next Command**
2. **Show exact copy-pasteable command** (e.g., `@workspace /plan #file:handoffs/route-to-plan.json`)
3. **HALT after Next Command** (no further execution)
4. **Use honest language**: "Next, invoke the plan agent manually using the command below"
5. **Display key reference**: "Next Command (Key: {key}):"
6. **Validate JSON schema** before saving file

### ❌ DON'T:
1. **Never claim "EXECUTE AS AGENT"** or "TRANSITIONS CONTROL"
2. **Never auto-execute** another prompt (GitHub Copilot limitation)
3. **Never simulate** another agent's output
4. **Never skip JSON file creation** (audit trail required)
5. **Never use relative paths** in Next Command (always absolute or #file: syntax)
6. **Never break MANDATORY.md Rule #1** (no code blocks in output)

---

## 📊 Handoff File Naming Conventions

| From Agent | To Agent | File Name | Location |
|------------|----------|-----------|----------|
| route | plan | `route-to-plan.json` | `.github/key-data-streams/{key}/handoffs/` |
| route | test-generation | `route-to-test.json` | `.github/key-data-streams/{key}/handoffs/` |
| route | task | `route-to-task.json` | `.github/key-data-streams/{key}/handoffs/` |
| plan | test-generation | `phase-{N}-test.json` | `.github/key-data-streams/{key}/handoffs/` |
| plan | task | `phase-{N}-todo-{M}.json` | `.github/key-data-streams/{key}/handoffs/` |
| test-generation | task | `test-to-task.json` | `.github/key-data-streams/{key}/handoffs/` |

**Naming Rules**:
- Use kebab-case for all file names
- Include phase number for multi-phase plans: `phase-1-test.json`, `phase-2-todo-3.json`
- Use descriptive prefixes: `route-to-`, `phase-{N}-`, `test-to-`
- Always use `.json` extension

---

## 🔍 Validation & Error Handling

### JSON Validation (Before Save)
```
1. Check required fields exist (key, description, acceptanceCriteria)
2. Validate types (key: string, autoChain: boolean, etc.)
3. Ensure acceptanceCriteria is non-empty array
4. Verify key matches existing KDS folder or is new valid key
5. If validation fails: Show error, don't create file, HALT
```

### File Creation Error Handling
```
IF handoffs/ directory doesn't exist:
  Create directory first
  Then create JSON file
IF file creation fails:
  Log error to console
  Show manual workaround: "Please create file manually at [path]"
  HALT (don't proceed without JSON file)
```

### Next Command Format
```
Standard Format:
Next Command (Key: {key}):
@workspace /{agent} #file:.github/key-data-streams/{key}/handoffs/{filename}.json

Example:
Next Command (Key: db-backup):
@workspace /plan #file:.github/key-data-streams/db-backup/handoffs/route-to-plan.json
```

---

## 🧪 Testing Protocol

All handoffs must be validated with coordination tests (see `tests/phase-1-pilot.spec.md` for example).

**Test Checklist**:
- [ ] JSON file created before Next Command
- [ ] JSON passes schema validation
- [ ] Next Command copy-pasteable
- [ ] Agent HALTs after handoff
- [ ] Key displayed in output
- [ ] No auto-execution occurs

---

## 📈 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-31 | Initial protocol (Phase 1 implementation) |

---

**Key: `kds`** | **Document Status**: Active | **Next Review**: After Phase 3 (Honest Handoff Implementation)
