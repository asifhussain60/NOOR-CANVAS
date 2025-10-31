# Todo Prompt Algorithms
**Purpose:** Pseudocode algorithms for todo.prompt.md workflow logic  
**Version:** 1.0.0  
**Last Updated:** 2025-10-31

---

## Algorithm 1: Classify Work Complexity

**Purpose:** Determine if request requires plan.prompt.md (complex) or can be handled via todo.prompt.md (simple)

```
FUNCTION ClassifyWorkComplexity(request)
  
  // Parse request for complexity indicators
  layers = DetectAffectedLayers(request)  // UI, API, Services, Database
  phases = EstimatePhaseCount(request)
  hasTests = RequiresTestGeneration(request)
  hasArchChange = AffectsArchitecture(request)
  
  // Simple work criteria
  IF layers.count <= 1 AND phases <= 2 AND NOT hasArchChange THEN
    RETURN "SIMPLE"
  END IF
  
  // Complex work indicators
  IF layers.count >= 2 OR phases >= 3 OR hasArchChange THEN
    RETURN "COMPLEX"
  END IF
  
  // UI/UX redesign always complex
  IF Contains(request, "redesign|modernize|responsive|accessibility") THEN
    RETURN "COMPLEX"
  END IF
  
  // Database changes always complex
  IF Contains(request, "migration|schema|database|SQL") THEN
    RETURN "COMPLEX"
  END IF
  
  // Default to simple if ambiguous
  RETURN "SIMPLE"
  
END FUNCTION
```

---

## Algorithm 2: Generate Drift Summary

**Purpose:** Query all registered drifts for parent key, filter resolved, enforce queue limits

```
FUNCTION GenerateDriftSummary(parentKey)
  
  // Query all drifts for parent key
  drifts = GitLogGrep("drift({parentKey})")
  
  // Parse drift details from commit messages
  FOR EACH driftCommit IN drifts
    driftKey = ParseDriftKey(driftCommit)
    severity = ParseSeverity(driftCommit)
    mode = ParseMode(driftCommit)  // "auto" | "manual" | "user-critical" | "auto-deferred"
    triggeredBy = ParseTriggeredBy(driftCommit)
    description = ParseDescription(driftCommit)
    timestamp = ParseTimestamp(driftCommit)
    
    // Check if resolved
    isResolved = GitLogGrep("ckpt({driftKey}): Resolved").Count > 0
    
    IF NOT isResolved THEN
      AddToQueue(driftKey, severity, mode, triggeredBy, description, timestamp)
    END IF
  END FOR
  
  // Sort by severity
  SortBySeverity(queue)  // critical, high, medium, low, informational
  
  // Enforce queue limit (max 10)
  IF queue.Count > 10 THEN
    overflow = queue.Count - 10
    WARN("Queue overflow: {overflow} drifts truncated (oldest low-priority removed)")
    queue = queue.Take(10)
  END IF
  
  // Generate summary by severity
  summary = GroupBySeverity(queue)
  
  RETURN summary
  
END FUNCTION
```

---

## Algorithm 3: Validate Drift Commit Format

**Purpose:** Ensure drift registration commits follow unified format specification

```
FUNCTION ValidateDriftCommitFormat(commitMessage)
  
  // Extract components
  IF NOT MatchesPattern(commitMessage, "drift({key}): Register {drift-key}") THEN
    RETURN "Invalid commit format"
  END IF
  
  mode = ExtractMode(commitMessage)
  severity = ExtractSeverity(commitMessage)
  triggeredBy = ExtractTriggeredBy(commitMessage)
  
  // Validate mode
  validModes = ["auto", "manual", "user-critical", "auto-deferred"]
  IF mode NOT IN validModes THEN
    RETURN "Invalid mode: {mode}"
  END IF
  
  // Validate severity
  validSeverities = ["critical", "high", "medium", "low", "informational"]
  IF severity NOT IN validSeverities THEN
    RETURN "Invalid severity: {severity}"
  END IF
  
  // Validate triggered by
  validTriggers = ["plan.prompt.md", "task.prompt.md", "test-generation.prompt.md", "healthcheck.prompt.md", "user"]
  IF triggeredBy NOT IN validTriggers THEN
    RETURN "Invalid trigger: {triggeredBy}"
  END IF
  
  RETURN "Valid"
  
END FUNCTION
```

---

## Algorithm 4: Enforce Queue Limit

**Purpose:** Protect drift queue from overflow (max 10 auto-detected drifts per parent key)

```
FUNCTION EnforceQueueLimit(parentKey, newDrift)
  
  currentDrifts = GetUnresolvedDrifts(parentKey)
  autoDrifts = FilterByMode(currentDrifts, "auto")
  
  IF autoDrifts.Count >= 10 THEN
    // Queue full - remove lowest priority auto drift
    lowestPriority = autoDrifts
      .Where(d => d.severity IN ["low", "informational"])
      .OrderBy(d => d.timestamp)
      .First()
    
    IF lowestPriority EXISTS THEN
      RemoveFromQueue(lowestPriority)
      LogWarning("Queue overflow: Removed {lowestPriority.key} to make room for {newDrift.key}")
    ELSE
      // All auto drifts are medium/high/critical - block new drift
      HALT("Queue overflow: Cannot register {newDrift.key} - resolve existing drifts first")
    END IF
  END IF
  
  RegisterDrift(newDrift)
  
END FUNCTION
```

**Note:** Manual drifts (user-registered) are NOT subject to 10 drift limit.

---

## Algorithm 5: Calculate Drift Depth

**Purpose:** Enforce max drift stack depth (3 levels) to prevent infinite drift chains

```
FUNCTION CalculateDriftDepth(driftKey)
  
  depth = 0
  currentKey = driftKey
  
  WHILE parentKey = GetParentKey(currentKey) EXISTS
    depth++
    currentKey = parentKey
    
    IF depth > 3 THEN
      HALT("Max drift depth exceeded - resolve {driftKey} before registering new drifts")
    END IF
  END WHILE
  
  RETURN depth
  
END FUNCTION
```

**Max Stack:** parent → drift → sub-drift → sub-sub-drift (3 levels)

---

## Algorithm 6: Query Drift History

**Purpose:** Git commands for querying drift status, resolution, and severity counts

```bash
# Find all drifts for current key
git log --grep="drift({current-key})" --format="%h %s %b"

# Check if drift resolved
git log --grep="ckpt({drift-key}): Resolved" --format="%h %s"

# Count remaining drifts by severity
git log --grep="drift({current-key})" --format="%b" | grep "Severity:" | sort | uniq -c
```

**Usage:** Copy-paste commands in terminal for drift queue analysis

---

## Related Files
- **Consumer:** `.github/prompts/todo.prompt.md`
- **Protocol:** `.github/prompts/shared/kds-handoff-protocol.md`
- **Governance:** `.github/governance/kds-rulebook.json`
