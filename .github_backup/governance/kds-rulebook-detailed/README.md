# KDS Rulebook - Detailed Rule Documentation

**Version:** 1.0.0 | **Purpose:** Progressive disclosure for deep-dive rule understanding

---

## 📚 Structure

This directory contains detailed documentation for each of the 13 KDS governance rules. Each rule file includes:

- **Statement:** Exact rule definition
- **Rationale:** Why the rule exists
- **Enforcement:** How it's validated (automated/manual)
- **Examples:** Compliant and non-compliant patterns
- **Anti-Patterns:** Common mistakes
- **Special Exceptions:** When rule can be bent
- **Validation Function:** Pseudocode logic
- **Common Questions:** FAQ
- **Related Rules:** Cross-references

---

## 🗂️ Rule Index

### MANDATORY Rules (All Prompts)

| Rule | File | Category | Severity |
|------|------|----------|----------|
| **#1** | [rule-01-concise-output.md](rule-01-concise-output.md) | Output Format | Critical |
| **#2** | [rule-02-document-first.md](rule-02-document-first.md) | Workflow | Critical |
| **#3** | [rule-03-playwright-orchestration.md](rule-03-playwright-orchestration.md) | Testing | Critical |

### Agentic Execution Rules (KDS Workflow)

| Rule | File | Category | Severity |
|------|------|----------|----------|
| **#4** | [rule-04-per-task-handoffs.md](rule-04-per-task-handoffs.md) | Handoffs | High |
| **#5** | [rule-05-tdd-workflow.md](rule-05-tdd-workflow.md) | Testing | High |
| **#6** | [rule-06-auto-chain.md](rule-06-auto-chain.md) | Workflow | Medium |
| **#7** | [rule-07-test-registry.md](rule-07-test-registry.md) | Testing | Medium |
| **#8** | [rule-08-holistic-regeneration.md](rule-08-holistic-regeneration.md) | Files | Medium |
| **#9** | [rule-09-plan-conflicts.md](rule-09-plan-conflicts.md) | Planning | High |
| **#10** | [rule-10-kds-governance.md](rule-10-kds-governance.md) | Governance | Critical |
| **#11** | [rule-11-key-display.md](rule-11-key-display.md) | Output Format | Low |
| **#13** | [rule-13-phase-isolation.md](rule-13-phase-isolation.md) | Workflow | Low |

### Handoff Protocol Standards

| Rule | File | Category | Severity |
|------|------|----------|----------|
| **#12** | [rule-12-honest-handoff.md](rule-12-honest-handoff.md) | Handoffs | Critical |

---

## 🎯 Usage

### For New Contributors
Start with [kds-rulebook-quick.md](../kds-rulebook-quick.md) (5-minute read), then dive into specific rules as needed.

### For Rule Deep-Dives
Open individual rule files when you need:
- Detailed examples of compliant/non-compliant patterns
- Understanding validation logic
- Resolving edge cases
- Debugging rule violations

### For System Maintainers
Use this directory to:
- Add new rules (create rule-##-name.md)
- Update rule definitions (edit individual files)
- Track rule evolution (version history in each file)
- Generate validation tests (from pseudocode functions)

---

## 📈 Progressive Disclosure Path

```
User Journey:

1. kds-rulebook-quick.md (5 min)
   ↓
2. Rule violations detected
   ↓
3. Open specific rule file (2-3 min per rule)
   ↓
4. Review examples and anti-patterns
   ↓
5. Apply fixes
   ↓
6. Pre-commit hook validates
```

---

## 🔄 Maintenance

**When adding new rules:**
1. Create `rule-##-name.md` following existing template
2. Update this README.md index
3. Add to [kds-rulebook.md](../kds-rulebook.md) consolidated doc
4. Update [kds-rulebook.json](../kds-rulebook.json) machine-readable schema
5. Add validation to pre-commit hook if automatable

**When modifying rules:**
1. Edit individual rule file
2. Increment version number
3. Add changelog entry
4. Update kds-rulebook.md and kds-rulebook.json
5. Update pre-commit hook validation if logic changed

---

## 🔗 Related Documentation

- **[kds-rulebook-quick.md](../kds-rulebook-quick.md)** - 5-minute quick start
- **[kds-rulebook.md](../kds-rulebook.md)** - Comprehensive consolidated reference
- **[kds-rulebook.json](../kds-rulebook.json)** - Machine-readable schemas
- **[kds-handoff-protocol.md](../../prompts/shared/kds-handoff-protocol.md)** - JSON schemas and workflows

---

**Last Updated:** 2025-10-31  
**Maintainer:** KDS System  
**Status:** Active (1/13 rules documented)

**Next:** Complete remaining 12 rule detail files (tracked in Session 11 Phase 1)
