# Rule: {Rule Title}

**ID:** `{rule-id}`  
**Version:** 1.0.0  
**Created:** {YYYY-MM-DD}  
**Category:** {output-format|workflow|testing|security|documentation|code-quality}  
**Severity:** {critical|high|medium|low}  
**Applies To:** {all|specific prompts: plan, task, etc.}

---

## Rule Statement

**Summary:** {One-sentence description for MANDATORY.md index}

**Detailed Description:**
{What this rule enforces and why it matters. Explain the problem this rule prevents and the benefit of compliance.}

**Why This Matters:**
- **Benefit 1**: {Explanation}
- **Benefit 2**: {Explanation}
- **Benefit 3**: {Explanation}

---

## ❌ PROHIBITED

**Never do:**
- {Prohibited action 1}
- {Prohibited action 2}
- {Prohibited action 3}

**Exceptions:**
- {Exception 1 (if any)}
- {Exception 2 (if any)}

---

## ✅ REQUIRED

**Always do:**
- {Required action 1}
- {Required action 2}
- {Required action 3}

**Best Practices:**
- {Best practice 1}
- {Best practice 2}

---

## 🔍 Validation Algorithm

**Function Name:** `Validate{RuleId}(context)`

```
FUNCTION Validate{RuleId}(context):
  
  # Step 1: Check preconditions
  IF NOT AppliesTo(context) THEN
    RETURN { violation: false, reason: "Rule not applicable" }
  END IF
  
  # Step 2: Execute validation checks
  violations = []
  
  # Check 1: {Description}
  IF {condition} THEN
    violations.ADD({ 
      type: "{VIOLATION_TYPE}",
      message: "{Specific error message}",
      details: {relevant context}
    })
  END IF
  
  # Check 2: {Description}
  IF {condition} THEN
    violations.ADD({ 
      type: "{VIOLATION_TYPE}",
      message: "{Specific error message}",
      details: {relevant context}
    })
  END IF
  
  # Add more checks as needed
  
  # Step 3: Return results
  IF violations.Count > 0 THEN
    RETURN {
      violation: true,
      violations: violations,
      suggestedFix: "{High-level fix description}"
    }
  END IF
  
  RETURN { violation: false }
  
END FUNCTION
```

---

## 🛑 Enforcement Action

**Auto-Fix Available:** {yes|no}

```
IF Validate{RuleId}(context).violation THEN
  
  # Step 1: Log violation
  LogViolation(".github/audits/mandate-violations.log", {
    timestamp: Now(),
    rule: "{RULE_ID}",
    prompt: CurrentPrompt,
    key: CurrentKey,
    violation: validationResult,
    violationType: validationResult.type
  })
  
  # Step 2: HALT execution
  SHOW_ERROR("MANDATE VIOLATION: {Rule Title}")
  SHOW_FIX(validationResult.suggestedFix)
  
  # Step 3: Show specific fix based on violation type
  IF validationResult.type == "{TYPE_1}" THEN
    SHOW_INFO("{Specific guidance for type 1}")
    SHOW_EXAMPLE("{Code or command example}")
    
  ELSE IF validationResult.type == "{TYPE_2}" THEN
    SHOW_INFO("{Specific guidance for type 2}")
    SHOW_EXAMPLE("{Code or command example}")
    
  END IF
  
  # Step 4: Auto-fix (if available)
  IF AutoFixAvailable THEN
    ExecuteAutoFix({rule-id}, validationResult)
    RETRY Validate{RuleId}(context)
  ELSE
    EXIT 1  # Block execution until manually fixed
  END IF
  
  # Step 5: If auto-fix failed, HALT
  IF Validate{RuleId}(context).violation THEN
    HALT_EXECUTION("Unable to auto-fix {rule-id} violation")
  END IF
  
END IF
```

---

## Related Documentation

**Related Rules:**
- [{Related Rule 1}](../{related-rule-1}/rule.md) - {Brief description}
- [{Related Rule 2}](../{related-rule-2}/rule.md) - {Brief description}

**Implementation Modules:**
- `{path to related module}` - {Description}
- `{path to related module}` - {Description}

**Related Docs:**
- `{path to related documentation}` - {Description}

**Examples:**
- See [examples.md](examples.md) in this folder

---

**This rule is SOURCE OF TRUTH until user explicitly changes it.**

**Last Updated:** {YYYY-MM-DD}  
**Version:** 1.0.0
