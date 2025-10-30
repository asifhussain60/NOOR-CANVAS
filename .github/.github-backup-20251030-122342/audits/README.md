# .github/audits/

**Purpose:** System audit logs and analysis reports (NOT execution keys)

This directory contains audit logs, system analysis, and validation reports that track system health and prompt infrastructure integrity. These are **read-only historical logs**, not active execution keys.

---

## Directory Structure

```
.github/audits/
├── healthcheck-audits/       # Health check execution logs
├── prompt-system-audit/      # Prompt system validation logs
└── prompt-system-gaps/       # Gap analysis and findings
```

---

## Difference from `.github/key-data-streams/`

| Aspect | `.github/audits/` | `.github/key-data-streams/` |
|--------|-------------------|----------------------------|
| **Purpose** | Historical audit logs | Active execution tracking |
| **Content** | Read-only reports | Work plans + execution logs |
| **Structure** | work-log.md only | plan.md + work-log.md (required) |
| **Updates** | Append-only (audit entries) | Active modification during work |
| **Lifecycle** | Permanent (historical record) | Archive when work complete |

---

## Audit Directory Standards

### Required Files
- `work-log.md` - Audit execution log (append-only)

### Optional Files
- `audit-report-YYYYMMDD.md` - Generated audit reports
- `findings.md` - Discovered issues and recommendations
- `metrics.json` - Audit metrics and trends

### Prohibited Files
- `{key}.plan.md` - Audit logs do NOT have execution plans
- `state.json` - Audits do NOT track state
- `tests/` - Audits do NOT have associated tests

---

## When to Use `.github/audits/`

**Use for:**
- ✅ Healthcheck execution logs
- ✅ System validation reports
- ✅ Gap analysis findings
- ✅ Compliance audit trails
- ✅ Historical metrics and trends

**Do NOT use for:**
- ❌ Active feature development
- ❌ Bug fixes or refactoring
- ❌ Prompt modifications
- ❌ Infrastructure changes

---

## Migration History

**Date:** 2025-10-29  
**Reason:** KDS compliance (healthcheck.prompt.md v1.3.0 validation)  
**Migrated From:** `.github/key-data-streams/`

**Directories Moved:**
1. `healthcheck-audits` - Healthcheck execution logs
2. `prompt-system-audit` - Prompt system validation
3. `prompt-system-gaps` - Gap analysis findings

**Rationale:** These directories had `work-log.md` but no `plan.md`, indicating they are audit logs rather than execution keys. Reclassifying to `.github/audits/` improves clarity and KDS compliance.

---

## Maintenance

**Retention Policy:** Indefinite (historical record)

**Cleanup Guidelines:**
- Keep all audit logs for historical analysis
- Compress old reports if >1 year old
- Never delete audit trails

**Access:** Read-only for all agents

---

**Created:** 2025-10-29  
**Last Updated:** 2025-10-29  
**Related:** `.github/key-data-streams/README.md`, `healthcheck.prompt.md` v1.3.0
