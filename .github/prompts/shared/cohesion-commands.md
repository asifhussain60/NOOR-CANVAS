# Cohesion Command Examples
**Purpose:** Bash command reference for cohesion.prompt.md  
**Version:** 1.0.0  
**Last Updated:** 2025-10-31

---

## Command 1: Key Parameter Examples

```bash
@workspace /cohesion scope=all key=cohesion-weekly-scan
@workspace /cohesion scope=prompts key=cohesion-prompt-audit
@workspace /cohesion scope=all  # Auto: cohesion-20251028-143500
```

---

## Command 2: KDS-Cleanup Mode Example

```bash
@workspace /cohesion scope=all validation-level=kds-cleanup auto-fix=true
```

---

## Command 3: Test Mode Examples

```bash
@workspace /cohesion scope=prompts -test validation-level=full
@workspace /cohesion scope=all -test
```

---

## Command 4: Complete Invocation Examples

```bash
# Quick syntax check
@workspace /cohesion scope=prompts validation-level=syntax

# Full prompt system audit
@workspace /cohesion scope=all validation-level=full

# Specific file deep scan
@workspace /cohesion scope=plan.prompt.md validation-level=conflicts

# Instructions-only validation
@workspace /cohesion scope=instructions validation-level=rules

# Auto-fix mode (requires approval)
@workspace /cohesion scope=all validation-level=full auto-fix=true

# KDS cleanup with validation (report only)
@workspace /cohesion scope=all validation-level=kds-cleanup

# KDS cleanup with auto-fix
@workspace /cohesion scope=all validation-level=kds-cleanup auto-fix=true

# KDS cleanup (archive deprecated files only)
@workspace /cohesion validation-level=kds-cleanup auto-fix=true cleanup-mode=archive-only

# Auto-invoked from plan/task (end of workflow)
Execute("cohesion.prompt.md", {
  scope: "all",
  validation-level: "kds-cleanup",
  auto-fix: true,
  cleanup-mode: "full",
  key: CurrentKey,
  verbosity: "concise"
})
```

---

## Command 5: Periodic Maintenance Commands

### Weekly Cohesion Scan
```bash
@workspace /cohesion scope=all validation-level=rules
```

### Monthly Deep Scan
```bash
@workspace /cohesion scope=all validation-level=full
```

### After Major Changes
```bash
@workspace /cohesion scope={modified-file} validation-level=conflicts
```

### Pre-Release Audit
```bash
@workspace /cohesion scope=all validation-level=full auto-fix=true
```

---

**End of Cohesion Command Examples**
