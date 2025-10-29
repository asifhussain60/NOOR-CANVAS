# output-validator.md (Pre-Response Validation)

---
purpose: Enforce CONCISE-MANDATE.md rules before responding to user (bullet limits, code blocks, nested lists)
lastUpdated: 2025-10-27
---

## Purpose
Validate agent responses BEFORE sending to user to ensure compliance with CONCISE-MANDATE.md and output-style-mandate.md.

---

## Validation Algorithm

```
FUNCTION ValidateResponse(response, agentName)
  
  violations = []
  warnings = []
  stats = {
    bulletCount: 0,
    codeBlockCount: 0,
    nestedListCount: 0,
    sectionCount: 0
  }
  
  // 1. Count bullets (including nested)
  stats.bulletCount = CountAllBullets(response)
  IF stats.bulletCount > 15 THEN
    violations.add({
      rule: "MAX 15 bullets",
      actual: stats.bulletCount,
      severity: "critical"
    })
  ELSE IF stats.bulletCount > 12 THEN
    warnings.add({
      rule: "Approaching bullet limit",
      actual: stats.bulletCount + "/15",
      severity: "warning"
    })
  END IF
  
  // 2. Detect code blocks
  codeBlocks = FindCodeBlocks(response)
  stats.codeBlockCount = codeBlocks.length
  
  FOR EACH block IN codeBlocks
    // Allow pseudocode/algorithm blocks, prohibit implementation code
    IF IsImplementationCode(block) THEN
      violations.add({
        rule: "NO code/pseudocode/JSON in chat",
        snippet: block.content.substring(0, 100),
        severity: "critical",
        remediation: "Move to {key}.plan.md file"
      })
    ELSE IF block.language IN ["sql", "csharp", "typescript", "javascript"] THEN
      warnings.add({
        rule: "Language-specific code detected",
        language: block.language,
        severity: "warning",
        remediation: "Consider moving to plan file"
      })
    END IF
  END FOR
  
  // 3. Detect nested lists
  stats.nestedListCount = FindNestedLists(response)
  IF stats.nestedListCount > 0 THEN
    violations.add({
      rule: "NO nested lists - flat bullets only",
      actual: stats.nestedListCount + " nested levels found",
      severity: "moderate"
    })
  END IF
  
  // 4. Check section structure
  requiredSections = ["🧠", "📌"]
  missingSections = []
  
  FOR EACH section IN requiredSections
    IF NOT response.contains(section) THEN
      missingSections.add(section)
    END IF
  END FOR
  
  IF missingSections.length > 0 THEN
    warnings.add({
      rule: "Standard sections missing",
      missing: missingSections,
      severity: "info"
    })
  END IF
  
  // 5. Check "What would you like to do next?" section
  IF NOT response.contains("What would you like to do next?") THEN
    violations.add({
      rule: "Next actions missing",
      severity: "moderate",
      remediation: "Add letter-based options (A/B/C/D)"
    })
  END IF
  
  // 6. Check for letter-based options
  IF NOT response.matches(/\*\*[A-D]\.\*\*/g) THEN
    violations.add({
      rule: "Letter-based options missing",
      severity: "moderate",
      remediation: "Use **A.** **B.** **C.** **D.** format"
    })
  END IF
  
  // Generate validation report
  report = {
    valid: violations.isEmpty(),
    stats: stats,
    violations: violations,
    warnings: warnings,
    agentName: agentName,
    timestamp: NOW()
  }
  
  RETURN report
END FUNCTION

FUNCTION CountAllBullets(text)
  count = 0
  lines = text.split("\n")
  
  FOR EACH line IN lines
    trimmed = line.trim()
    
    // Bullet patterns: -, *, 1., 2., ✅, ❌, etc.
    IF trimmed.matches(/^[-*✅❌►] /) OR 
       trimmed.matches(/^\d+\. /) OR
       trimmed.matches(/^[A-Z]\. /) THEN
      count++
    END IF
  END FOR
  
  RETURN count
END FUNCTION

FUNCTION FindCodeBlocks(text)
  blocks = []
  pattern = /```([a-z]*)\n([\s\S]*?)\n```/g
  
  matches = text.matchAll(pattern)
  FOR EACH match IN matches
    blocks.add({
      language: match[1] || "unknown",
      content: match[2],
      length: match[2].length
    })
  END FOR
  
  RETURN blocks
END FUNCTION

FUNCTION IsImplementationCode(block)
  // Heuristics to detect implementation vs pseudocode
  implementationIndicators = [
    "using System;",
    "import ",
    "public class ",
    "private ",
    "async Task",
    "SELECT * FROM",
    "INSERT INTO",
    "UPDATE ",
    "DELETE FROM",
    "function (",
    "const ",
    "let ",
    "var "
  ]
  
  FOR EACH indicator IN implementationIndicators
    IF block.content.contains(indicator) THEN
      RETURN true
    END IF
  END FOR
  
  // Pseudocode is OK (uses FUNCTION, IF, FOR, etc.)
  pseudocodeIndicators = [
    "FUNCTION ",
    "IF ",
    "FOR EACH",
    "WHILE ",
    "RETURN "
  ]
  
  pseudocodeCount = 0
  FOR EACH indicator IN pseudocodeIndicators
    IF block.content.contains(indicator) THEN
      pseudocodeCount++
    END IF
  END FOR
  
  IF pseudocodeCount >= 2 THEN
    RETURN false  // Likely pseudocode, allow it
  END IF
  
  RETURN true  // Default to implementation
END FUNCTION

FUNCTION FindNestedLists(text)
  nestedCount = 0
  lines = text.split("\n")
  
  FOR i = 0 TO lines.length - 1
    line = lines[i]
    indentation = line.length - line.trimStart().length
    
    // Check if line is a bullet
    IF line.trimStart().matches(/^[-*✅❌►] /) THEN
      // If indentation > 2 spaces, it's nested
      IF indentation > 2 THEN
        nestedCount++
      END IF
    END IF
  END FOR
  
  RETURN nestedCount
END FUNCTION
```

---

## Enforcement Policy

### Critical Violations (BLOCK response)
1. **Bullet limit exceeded (>15)** - Must consolidate or defer to files
2. **Implementation code blocks** - Must move to plan files
3. **Missing next actions** - Must add letter-based options

**Action:** Do NOT send response. Fix violations first.

### Moderate Violations (WARN + proceed)
1. **Nested lists** - Flatten if possible, warn user
2. **Approaching bullet limit (13-15)** - Note in response
3. **Code blocks with specific languages** - Consider moving to files

**Action:** Add warning note to response, then send.

### Info Violations (LOG only)
1. **Missing standard sections** - Note for improvement
2. **Formatting inconsistencies** - Log for review

**Action:** Send response, log for analysis.

---

## Integration with Agents

**All user-facing agents MUST validate before responding:**

```
FUNCTION RespondToUser(response, agentName)
  
  // Validate response
  validation = ValidateResponse(response, agentName)
  
  // Handle critical violations
  IF NOT validation.valid THEN
    criticalViolations = validation.violations.filter(v => v.severity == "critical")
    
    IF criticalViolations.length > 0 THEN
      // BLOCK response
      LogViolation(validation)
      
      // Show developer error (not sent to user)
      ERROR("Response validation failed:")
      FOR EACH violation IN criticalViolations
        ERROR("  - " + violation.rule + ": " + violation.actual)
        IF violation.remediation THEN
          ERROR("    Fix: " + violation.remediation)
        END IF
      END FOR
      
      // Attempt auto-fix
      fixedResponse = AutoFix(response, criticalViolations)
      IF fixedResponse != null THEN
        RETURN RespondToUser(fixedResponse, agentName)  // Retry with fixed version
      ELSE
        TERMINATE("Cannot auto-fix violations. Manual intervention required.")
      END IF
    END IF
  END IF
  
  // Handle warnings (log but allow)
  IF validation.warnings.length > 0 THEN
    LogWarnings(validation.warnings)
    
    // Optionally append warning note to response
    IF ShouldShowWarnings(agentName) THEN
      response += "\n\n---\n⚠️ Note: Response contains " + 
                  validation.warnings.length + " formatting warnings."
    END IF
  END IF
  
  // Log stats for monitoring
  LogResponseStats(validation.stats, agentName)
  
  // Send response
  SendToUser(response)
END FUNCTION

FUNCTION AutoFix(response, violations)
  fixed = response
  
  FOR EACH violation IN violations
    SWITCH violation.rule
      
      CASE "MAX 15 bullets":
        // Attempt to consolidate bullets
        fixed = ConsolidateBullets(fixed, targetCount: 15)
        IF CountAllBullets(fixed) > 15 THEN
          RETURN null  // Cannot auto-fix
        END IF
      
      CASE "NO code/pseudocode/JSON in chat":
        // Cannot auto-fix - requires manual intervention
        RETURN null
      
      CASE "NO nested lists - flat bullets only":
        // Flatten nested lists
        fixed = FlattenNestedLists(fixed)
      
      CASE "Next actions missing":
        // Add default next actions
        fixed += "\n\n## What would you like to do next?\n\n"
        fixed += "**A.** Continue with this work\n"
        fixed += "**B.** Ask a question\n"
        fixed += "**C.** Nothing, I'm all set\n"
      
      CASE "Letter-based options missing":
        // Try to convert checkbox format to letters
        fixed = ConvertToLetterOptions(fixed)
    
    END SWITCH
  END FOR
  
  RETURN fixed
END FUNCTION

FUNCTION ConsolidateBullets(text, targetCount)
  // Strategy: Combine related bullets, remove redundant info
  
  bullets = ExtractBullets(text)
  
  IF bullets.length <= targetCount THEN
    RETURN text  // Already compliant
  END IF
  
  // Group related bullets
  groups = GroupRelatedBullets(bullets)
  
  // Merge bullets within each group
  consolidated = []
  FOR EACH group IN groups
    merged = MergeBullets(group)
    consolidated.add(merged)
  END FOR
  
  // Reconstruct text with consolidated bullets
  newText = ReplaceBullets(text, consolidated)
  
  RETURN newText
END FUNCTION
```

---

## Monitoring Dashboard

**Track validation metrics across agents:**

```
METRICS = {
  "build.prompt.md": {
    totalResponses: 150,
    violationRate: 0.80,
    avgBulletCount: 32,
    codeBlockRate: 0.90
  },
  "plan.prompt.md": {
    totalResponses: 200,
    violationRate: 0.85,
    avgBulletCount: 45,
    codeBlockRate: 0.95
  },
  "todo.prompt.md": {
    totalResponses: 100,
    violationRate: 0.60,
    avgBulletCount: 22,
    codeBlockRate: 0.70
  },
  "ask.prompt.md": {
    totalResponses: 50,
    violationRate: 0.20,
    avgBulletCount: 8,
    codeBlockRate: 0.10
  }
}

TARGET_METRICS = {
  violationRate: 0.10,      // <10% of responses have violations
  avgBulletCount: 12,       // Average 12 bullets (buffer below 15)
  codeBlockRate: 0.00       // 0% implementation code in chat
}
```

---

## Validation Report Format

**When violations detected:**

```markdown
⚠️ OUTPUT VALIDATION REPORT

Agent: build.prompt.md
Timestamp: 2025-10-27 14:32:15

📊 Stats:
- Bullets: 32/15 (EXCEEDED ❌)
- Code blocks: 3 (2 implementation ❌, 1 pseudocode ✅)
- Nested lists: 5 (PROHIBITED ❌)
- Sections: 🧠 ✅ 📌 ✅

🚨 Critical Violations (3):
1. Bullet limit exceeded: 32/15
   → Fix: Consolidate bullets or move details to plan file

2. Implementation code detected: C# class definition (87 lines)
   → Fix: Move to .github/key-data-streams/{key}/{key}.plan.md

3. Nested lists: 5 levels detected
   → Fix: Flatten to single-level bullets

⚠️ Warnings (1):
1. Approaching section limit (analysis section has 8 bullets)

🔧 Auto-Fix Attempted:
- Consolidated bullets: 32 → 18 (STILL EXCEEDED)
- Flattened nested lists: 5 → 0 ✅
- Cannot auto-fix code blocks

❌ RESPONSE BLOCKED - Manual intervention required
```

---

## Exception Cases

**Allowed exceptions (must be explicit):**

1. **Plan draft special case** - REMOVED (no longer allowed)
2. **Diagnostic output** - When debugging, can exceed limits with warning
3. **Error messages** - Full stack traces allowed for error analysis
4. **User explicitly requests code** - Can show code if user asks "show me the code"

**Enforcement:**
```
IF userExplicitlyRequestedCode(request) THEN
  ALLOW_CODE_BLOCKS()
  ADD_WARNING("Code shown per user request. Implementation details should go in plan files.")
ELSE
  ENFORCE_NO_CODE_BLOCKS()
END IF
```

---

## See Also
- `.github/prompts/shared/CONCISE-MANDATE.md` - Output rules being enforced
- `.github/prompts/shared/output-style-mandate.md` - Formatting requirements
- `.github/prompts/shared/loop-prevention.md` - Prevent infinite validation loops
- `.github/key-data-streams/prompt-system-gaps/VERBOSITY-ANALYSIS-REMEDIATION.md` - Analysis of current violation rates
