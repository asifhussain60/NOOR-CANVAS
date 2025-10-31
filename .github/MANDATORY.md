# MANDATORY OPERATING RULES (GLOBAL)

> **⚠️ CRITICAL**: This file MUST be loaded FIRST by ALL prompts before any work begins.  
> **Purpose**: Index of non-negotiable operating constraints.  
> **Enforcement**: Violations HALT execution immediately.
> 
> **🔒 MODIFICATION PROTECTION**:
> - ❌ **NEVER modify this file** unless explicitly instructed by user
> - ❌ **NO prompts or agents** may update these rules autonomously
> - ✅ **User approval REQUIRED** before ANY changes to this file
> - ⚠️ **If user request conflicts** with rules in this file → HALT and ask user for clarification
> - 📝 **Version control**: All changes must be committed with user-approved message

**Version:** 2.1.0  
**Created:** 2025-10-30  
**Last Modified:** 2025-10-31  
**Applies To:** ALL prompts in `.github/prompts/`

---

## 🚨 CRITICAL RULES INDEX

**ALL prompts must validate these rules BEFORE starting work:**

| ID | Rule | Description | File |
|----|------|-------------|------|
| 1 | Concise Output Format | User-facing responses MUST: (1) NEVER include code/pseudocode, only architectural descriptions; (2) Max 3 lines per bullet, letter options with recommended in ALL CAPS; (3) Prompt-specific structure (plan uses Phase→Task, ask uses 🧠/📌/📊) | [rule.md](instructions/rules/concise-output-format/rule.md) |
| 2 | Document First | Update KDS files BEFORE code changes; documentation commits must precede implementation commits | [rule.md](instructions/rules/document-first/rule.md) |
| 3 | Playwright Orchestration | Use dotnet orchestration scripts for Playwright tests; NEVER use nested PowerShell processes or deprecated standalone mode | [rule.md](instructions/rules/playwright-orchestration/rule.md) |

**Validation:** Execute `ValidateMandatoryCompliance()` before ANY user-facing output

---

## 📖 Loading Rules

**ALL prompts MUST include this at the top:**

```markdown
# {Prompt Name}

**LOAD FIRST:** `.github/MANDATORY.md` (index) + referenced rule files
```

**Pre-Work Validation Pattern:**

```
# Load rule index
LOAD_MODULE(".github/MANDATORY.md")

# Load and execute each rule''s validation
FOR EACH rule IN MandatoryRules:
  LOAD_MODULE(rule.file)
  EXECUTE rule.validationFunction()
END FOR

# Proceed only if compliant
IF NOT AllRulesCompliant() THEN
  EXIT 1
END IF
```

---

## 🔍 Global Validation Function

**Execute BEFORE sending ANY user-facing output:**

```
FUNCTION ValidateMandatoryCompliance():
  
  violations = []
  
  # Load all rule files
  rules = LoadRules(".github/instructions/rules/*/metadata.json")
  
  # Execute each rule''s validation
  FOR EACH rule IN rules:
    IF rule.appliesToCurrentPrompt() THEN
      result = EXECUTE rule.validationFunction()
      IF result.violation THEN
        violations.ADD(result)
      END IF
    END IF
  END FOR
  
  # Handle violations
  IF violations.Count > 0 THEN
    HandleViolations(violations)
    HALT
  END IF
  
  RETURN { compliant: true }
  
END FUNCTION


FUNCTION LoadRules(pattern):
  
  # Find all metadata.json files
  metadataFiles = FileSystem.Glob(pattern)
  rules = []
  
  FOR EACH file IN metadataFiles:
    metadata = JSON.Parse(ReadFile(file))
    ruleFolder = Path.GetDirectoryName(file)
    
    rules.ADD({
      id: metadata.id,
      title: metadata.title,
      version: metadata.version,
      category: metadata.category,
      severity: metadata.severity,
      validationFunction: metadata.validationFunction,
      appliesToPrompts: metadata.appliesToPrompts,
      ruleFile: Path.Join(ruleFolder, "rule.md"),
      examplesFile: Path.Join(ruleFolder, "examples.md")
    })
  END FOR
  
  RETURN rules
  
END FUNCTION


FUNCTION HandleViolations(violations):
  
  FOR EACH violation IN violations:
    # Log to audit file
    LogViolation(".github/audits/mandate-violations.log", violation)
    
    # Show error to user
    SHOW_ERROR("MANDATE VIOLATION: " + violation.rule)
    SHOW_FIX(violation.suggestedFix)
    
    # Attempt auto-fix if available
    IF violation.autoFixAvailable THEN
      TryAutoFix(violation)
    END IF
  END FOR
  
END FUNCTION
```

---

## ➕ Adding New Rules

**See:** `.github/instructions/rules/README.md` for complete guide

**Quick Steps:**

1. **Create rule folder:**
   ```powershell
   New-Item -Path ".github/instructions/rules/{rule-id}" -ItemType Directory
   Copy-Item ".github/instructions/rules/_template/*" ".github/instructions/rules/{rule-id}/"
   ```

2. **Implement rule:**
   - Edit `rule.md` (rule statement, validation algorithm, enforcement)
   - Edit `metadata.json` (id, title, category, severity)
   - Edit `examples.md` (compliant/non-compliant examples)

3. **Add to index:**
   - Add row to table above: `| N | {Title} | {Description} | [rule.md](...) |`

4. **Test rule:**
   - Create test scenario that violates rule
   - Verify validation detects violation
   - Test enforcement action (HALT, auto-fix)

5. **Document in KDS:**
   - Update `.github/key-data-streams/prompt/work-log.md`
   - Commit: `git commit -m "doc(prompts): Add mandatory rule {rule-id}"`

**Rules are SOURCE OF TRUTH until user explicitly changes them.**

---

## 🗂️ File Organization

```
.github/
├── MANDATORY.md                           ← THIS FILE (rule index)
├── MANDATORY.v1.0.0.backup.md             ← Backup of previous version
│
├── instructions/
│   ├── rules/                             ← Rule implementations
│   │   ├── README.md                      ← How to add rules guide
│   │   ├── _template/
│   │   │   ├── rule-template.md
│   │   │   ├── metadata.json
│   │   │   └── examples.md
│   │   ├── concise-output-format/         ← Rule #1 (ACTIVE)
│   │   │   ├── rule.md
│   │   │   ├── metadata.json
│   │   │   └── examples.md
│   │   ├── document-first/                ← Rule #2 (ACTIVE)
│   │   │   ├── rule.md
│   │   │   ├── metadata.json
│   │   │   └── examples.md
│   │   ├── playwright-orchestration/      ← Rule #3 (ACTIVE)
│   │   │   ├── rule.md
│   │   │   ├── metadata.json
│   │   │   └── examples.md
│   │   ├── no-code-in-chat/               ← DEPRECATED (merged into #1)
│   │   │   └── ...
│   │   └── concise-response-format/       ← DEPRECATED (merged into #1)
│   │       └── ...
│   └── SelfAwareness.instructions.md      ← References MANDATORY.md
│
└── prompts/
    └── *.prompt.md                         ← ALL load MANDATORY.md + rules
```

---

## 📚 Related Documentation

**Core References:**
- `.github/instructions/rules/README.md` - Rule system overview and how-to guide
- `.github/instructions/SelfAwareness.instructions.md` - Global operating guardrails
- `.github/instructions/Links/SystemIndex.md` - Central navigation hub

**Rule Files:**
- `.github/instructions/rules/concise-output-format/rule.md` - Full implementation (combines no-code + conciseness)
- `.github/instructions/rules/document-first/rule.md` - Full implementation
- `.github/instructions/rules/playwright-orchestration/rule.md` - Full implementation

**Examples:**
- `.github/instructions/rules/concise-output-format/examples.md` - Compliant/Non-compliant examples
- `.github/instructions/rules/document-first/examples.md` - Workflow examples
- `.github/instructions/rules/playwright-orchestration/examples.md` - Orchestration patterns

**Deprecated (Superseded by Rule #1):**
- `.github/instructions/rules/no-code-in-chat/` - Merged into concise-output-format
- `.github/instructions/rules/concise-response-format/` - Merged into concise-output-format

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1.0 | 2025-10-31 | Combined Rule #1 (No Code in Chat) + Rule #4 (Concise Response Format) into unified Rule #1 (Concise Output Format); clarified plan.prompt.md special exception (40 bullets with phase breakdown) |
| 2.0.0 | 2025-10-30 | Transformed to lightweight index; extracted rules to separate files |
| 1.0.0 | 2025-10-30 | Initial monolithic version (backed up to MANDATORY.v1.0.0.backup.md) |

---

**This file is MANDATORY and applies to ALL prompts without exception.**

**Last Updated:** 2025-10-31  
**Maintainer:** System  
**Version:** 2.1.0
