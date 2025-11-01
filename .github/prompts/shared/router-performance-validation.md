# Router Performance Validation Algorithm
**Purpose:** Validate route.prompt.md compliance with KDS Rules #9, #11, #12  
**Version:** 1.0.0  
**Last Updated:** 2025-11-01

---

## Algorithm 15: Validate Router Performance (NEW - Router Compliance)

**Purpose:** Ensure route.prompt.md properly detects keys, loads plans, creates handoffs, and displays key status

```
FUNCTION ValidateRouterPerformance(conversationHistory, keyRequested):
  
  # Step 1: Initialize validation tracking
  violations = []
  routerInvocations = []
  
  # Step 2: Parse conversation for router usage
  FOR EACH message IN conversationHistory:
    
    IF message.contains("@workspace /route") OR message.contains("/route Key:") THEN
      
      routerInvocation = {
        "messageIndex": message.index,
        "keyRequested": ExtractKeyFromRequest(message.content),
        "responseIndex": message.index + 1,  # Assume response follows
        "violations": []
      }
      
      # Get router's response
      routerResponse = conversationHistory[routerInvocation.responseIndex]
      
      # Validate Rule #9: Plan Conflict Detection
      keySearchPerformed = routerResponse.contains(".github/key-data-streams/") OR
                          routerResponse.contains("Related Keys Found") OR
                          routerResponse.contains("Key Data Stream Consultation")
      
      IF NOT keySearchPerformed THEN
        routerInvocation.violations.append({
          "rule": "Rule #9 (Plan Conflict Detection)",
          "severity": "HIGH",
          "violation": "Router did not search for existing key data streams",
          "expectedBehavior": "Router Step 0 must search .github/key-data-streams/ for related keys",
          "impact": "User may create duplicate keys, miss existing work context"
        })
      END IF
      
      # Check if related keys were found
      relatedKeysFound = ExtractRelatedKeys(routerResponse)
      
      IF relatedKeysFound.count > 0 THEN
        
        # Validate plan loading
        planLoaded = routerResponse.contains("plan.md") OR
                    routerResponse.contains("Plan Execution Options") OR
                    routerResponse.contains("Phase 1") OR
                    routerResponse.contains("cleanup-plan.md")
        
        IF NOT planLoaded THEN
          routerInvocation.violations.append({
            "rule": "Rule #9 (Plan Conflict Detection)",
            "severity": "CRITICAL",
            "violation": "Router found related keys but did not load plan.md",
            "relatedKeys": relatedKeysFound,
            "expectedBehavior": "Router Step 1.5 must parse plan file and present execution options",
            "impact": "User cannot continue existing work, must recreate plan context manually"
          })
        END IF
        
        # Validate consolidation offer
        consolidationOffered = routerResponse.contains("Option A") AND
                               routerResponse.contains("Option B") AND
                               (routerResponse.contains("extend") OR routerResponse.contains("create new"))
        
        IF NOT consolidationOffered THEN
          routerInvocation.violations.append({
            "rule": "Rule #9 (Plan Conflict Detection)",
            "severity": "MEDIUM",
            "violation": "Router found related keys but did not offer consolidation options",
            "expectedBehavior": "Router must present: A) Extend existing key, B) Create new key, C) Review details",
            "impact": "User must manually decide key strategy without guidance"
          })
        END IF
        
      END IF
      
      # Validate Rule #11: Key Display
      keyDisplayed = routerResponse.contains("Key:") OR
                    routerResponse.contains("Key Requested:") OR
                    routerResponse.contains("**Key:**")
      
      IF NOT keyDisplayed THEN
        routerInvocation.violations.append({
          "rule": "Rule #11 (Key Display)",
          "severity": "MEDIUM",
          "violation": "Router output did not display key reference",
          "expectedBehavior": "Router must show 'Key Requested: {key}' in header or summary",
          "impact": "Reduced traceability, user cannot verify routing context"
        })
      END IF
      
      # Check key status display
      keyStatusDisplayed = routerResponse.contains("FOUND") OR
                          routerResponse.contains("NOT_FOUND") OR
                          routerResponse.contains("SIMILAR_EXISTS") OR
                          routerResponse.contains("Status:")
      
      IF NOT keyStatusDisplayed THEN
        routerInvocation.violations.append({
          "rule": "Rule #11 (Key Display)",
          "severity": "LOW",
          "violation": "Router did not show key status (FOUND/NOT_FOUND/RELATED)",
          "expectedBehavior": "Router should display: 'Key Status: FOUND' or 'Key Status: NOT_FOUND (Related: hcp-questions)'",
          "impact": "User unclear if key exists or is new"
        })
      END IF
      
      # Validate Rule #12: Honest Handoff
      handoffJSONCreated = routerResponse.contains("route-to-plan.json") OR
                          routerResponse.contains("route-to-task.json") OR
                          routerResponse.contains("route-to-test.json") OR
                          routerResponse.contains(".github/key-data-streams/") AND routerResponse.contains("/handoffs/")
      
      IF NOT handoffJSONCreated THEN
        routerInvocation.violations.append({
          "rule": "Rule #12 (Honest Handoff)",
          "severity": "CRITICAL",
          "violation": "Router did not generate handoff JSON file",
          "expectedBehavior": "Router Step 7 must create handoff JSON in .github/key-data-streams/{key}/handoffs/",
          "impact": "No audit trail, handoff incomplete, manual parameter passing required"
        })
      END IF
      
      # Check Next Command display
      nextCommandDisplayed = routerResponse.contains("Next Command:") OR
                            routerResponse.contains("@workspace /plan") OR
                            routerResponse.contains("@workspace /task") OR
                            routerResponse.contains("@workspace /todo")
      
      IF NOT nextCommandDisplayed THEN
        routerInvocation.violations.append({
          "rule": "Rule #12 (Honest Handoff)",
          "severity": "HIGH",
          "violation": "Router did not display Next Command",
          "expectedBehavior": "Router must show copy-pasteable command: '@workspace /plan #file:handoffs/route-to-plan.json'",
          "impact": "User cannot execute handoff, workflow interrupted"
        })
      END IF
      
      # Add to invocations list
      routerInvocations.append(routerInvocation)
      
      # Aggregate violations
      FOR EACH violation IN routerInvocation.violations:
        violations.append(violation)
      END FOR
      
    END IF
    
  END FOR
  
  # Step 3: Calculate router compliance score
  totalChecks = routerInvocations.count * 7  # 7 checks per invocation
  totalViolations = violations.count
  complianceRate = ((totalChecks - totalViolations) / totalChecks) * 100
  
  # Step 4: Generate router performance report
  RETURN {
    "routerInvocations": routerInvocations.count,
    "totalViolations": totalViolations,
    "complianceRate": complianceRate,
    "grade": CalculateGrade(complianceRate),
    "violations": violations,
    "recommendations": GenerateRouterRecommendations(violations, complianceRate)
  }
  
END FUNCTION

// Helper: Extract key from user request
FUNCTION ExtractKeyFromRequest(requestContent):
  
  # Pattern 1: /route Key: {key-name}
  IF requestContent.match("/route Key: (.+)") THEN
    RETURN RegexCapture(requestContent, "/route Key: (.+)")
  END IF
  
  # Pattern 2: key={key-name}
  IF requestContent.match("key=([a-z0-9-]+)") THEN
    RETURN RegexCapture(requestContent, "key=([a-z0-9-]+)")
  END IF
  
  # Pattern 3: Detect from request text (heuristic)
  IF requestContent.contains("hcp") THEN
    RETURN "hcp*"  # Prefix search
  ELSE IF requestContent.contains("cleanup") THEN
    RETURN "*cleanup"  # Suffix search
  END IF
  
  RETURN "unknown"
  
END FUNCTION

// Helper: Extract related keys from router response
FUNCTION ExtractRelatedKeys(responseContent):
  
  relatedKeys = []
  
  # Look for key mentions in response
  IF responseContent.contains("hcp-questions") THEN
    relatedKeys.append("hcp-questions")
  END IF
  
  IF responseContent.contains("hcp-timer") THEN
    relatedKeys.append("hcp-timer")
  END IF
  
  # Generic pattern: `{key-name}` in backticks
  keyMatches = RegexFindAll(responseContent, "`([a-z0-9-]+)`")
  
  FOR EACH match IN keyMatches:
    IF NOT relatedKeys.contains(match) THEN
      relatedKeys.append(match)
    END IF
  END FOR
  
  RETURN relatedKeys
  
END FUNCTION

// Helper: Calculate grade from compliance rate
FUNCTION CalculateGrade(complianceRate):
  
  IF complianceRate >= 90 THEN
    RETURN "A (Excellent)"
  ELSE IF complianceRate >= 80 THEN
    RETURN "B (Good)"
  ELSE IF complianceRate >= 70 THEN
    RETURN "C (Acceptable)"
  ELSE IF complianceRate >= 60 THEN
    RETURN "D (Needs Improvement)"
  ELSE
    RETURN "F (Failing)"
  END IF
  
END FUNCTION

// Helper: Generate router recommendations
FUNCTION GenerateRouterRecommendations(violations, complianceRate):
  
  recommendations = []
  
  # Group violations by rule
  rule9Violations = Filter(violations, v => v.rule.contains("Rule #9"))
  rule11Violations = Filter(violations, v => v.rule.contains("Rule #11"))
  rule12Violations = Filter(violations, v => v.rule.contains("Rule #12"))
  
  # Rule #9 recommendations
  IF rule9Violations.count > 0 THEN
    recommendations.append({
      "priority": "CRITICAL",
      "rule": "Rule #9 (Plan Conflict Detection)",
      "action": "Enhance router Step 0 key search",
      "specificFixes": [
        "Add semantic search for related keys ({prefix}*, *{suffix})",
        "Auto-load plan.md when related key found",
        "Present consolidation options (extend vs create new)",
        "Display plan structure (phases, tasks, status)"
      ],
      "impactedStep": "route.prompt.md Step 0 + Step 1.5",
      "estimatedEffort": "30-45 minutes"
    })
  END IF
  
  # Rule #11 recommendations
  IF rule11Violations.count > 0 THEN
    recommendations.append({
      "priority": "MEDIUM",
      "rule": "Rule #11 (Key Display)",
      "action": "Add key display to router output templates",
      "specificFixes": [
        "Add 'Key Requested: {key}' to Task 0 (Invocation Parsing)",
        "Add 'Key Status: FOUND/NOT_FOUND/RELATED' to Task 1 (Key Consultation)",
        "Display related keys in backticks with modification dates"
      ],
      "impactedStep": "route.prompt.md Output Format section",
      "estimatedEffort": "15 minutes"
    })
  END IF
  
  # Rule #12 recommendations
  IF rule12Violations.count > 0 THEN
    recommendations.append({
      "priority": "CRITICAL",
      "rule": "Rule #12 (Honest Handoff)",
      "action": "Implement handoff JSON generation in router",
      "specificFixes": [
        "Add Step 6.5: Generate handoff JSON before user review",
        "Create route-to-plan.json with key, description, scope",
        "Display Next Command with #file: syntax",
        "HALT after handoff generation (no auto-execution)"
      ],
      "impactedStep": "route.prompt.md Step 6 (Handoff Preparation)",
      "estimatedEffort": "45-60 minutes"
    })
  END IF
  
  # Overall recommendation
  IF complianceRate < 70 THEN
    recommendations.append({
      "priority": "CRITICAL",
      "action": "Comprehensive router refactoring required",
      "reason": "Compliance rate below 70% indicates systemic issues",
      "suggestedApproach": "Implement all P0 fixes above, then re-validate with KDS review"
    })
  END IF
  
  RETURN recommendations
  
END FUNCTION
```

---

## Integration Points

- **kds.prompt.md Step 0.2:** Call ValidateRouterPerformance() during conversation history analysis
- **kds.prompt.md Step 0.3:** Include router performance in performance report
- **kds.prompt.md Step 0.4:** Use router violations to prioritize fixes

---

## Usage Example

```
# Validate router performance from conversation history
routerPerformance = ValidateRouterPerformance(conversationMessages, "hcp-cleanup")

IF routerPerformance.complianceRate < 70 THEN
  Log("⚠️ ROUTER PERFORMANCE CRITICAL")
  Log("Compliance Rate: " + routerPerformance.complianceRate + "%")
  Log("Grade: " + routerPerformance.grade)
  Log("")
  Log("Violations:")
  FOR EACH violation IN routerPerformance.violations:
    Log("  [" + violation.severity + "] " + violation.rule)
    Log("    " + violation.violation)
    Log("    Fix: " + violation.expectedBehavior)
  END FOR
  Log("")
  Log("Recommendations:")
  FOR EACH rec IN routerPerformance.recommendations:
    Log("  [" + rec.priority + "] " + rec.action)
    IF rec.specificFixes THEN
      FOR EACH fix IN rec.specificFixes:
        Log("    - " + fix)
      END FOR
    END IF
  END FOR
ELSE
  Log("✅ Router performance acceptable (" + routerPerformance.complianceRate + "%)")
END IF
```

---

## Acceptance Criteria

- ✅ Detects missing key search (Rule #9 violation)
- ✅ Detects missing plan loading when related keys found (Rule #9 CRITICAL)
- ✅ Detects missing consolidation options (Rule #9 MEDIUM)
- ✅ Detects missing key display (Rule #11 MEDIUM)
- ✅ Detects missing key status (Rule #11 LOW)
- ✅ Detects missing handoff JSON generation (Rule #12 CRITICAL)
- ✅ Detects missing Next Command display (Rule #12 HIGH)
- ✅ Calculates compliance rate and grade
- ✅ Generates actionable recommendations with priority and effort estimates

---

**Version:** 1.0.0  
**Status:** Active  
**Last Updated:** 2025-11-01
