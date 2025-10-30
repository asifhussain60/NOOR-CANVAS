# Drift Detection Algorithm

**Purpose**: Detect when a user request represents drift from current work rather than an extension  
**Used By**: route.prompt.md (Step 1.6), todo.prompt.md (Mode Detection)  
**Version**: 1.0.0  
**Created**: 2025-10-30

---

## Detection Heuristics

### 1. Explicit Drift Keywords

**HIGH CONFIDENCE indicators** (>90% drift probability):
- "also fix", "also noticed", "while working on"
- "side issue", "separate problem", "unrelated to"
- "discovered", "found another", "different issue"
- "tangent", "off-topic", "but first"

**MEDIUM CONFIDENCE indicators** (60-90% drift probability):
- "quick fix", "small change", "minor issue"
- "before we continue", "pause to fix"
- "noticed that", "realized that"

### 2. Scope Mismatch Analysis

```typescript
FUNCTION DetectScopeMismatch(currentKey, request)
  
  // Load current key context
  currentPlan = LoadPlan(currentKey)
  currentFiles = ExtractFilesFromPlan(currentPlan)
  currentLayers = ExtractLayersFromPlan(currentPlan)
  currentFeature = ExtractFeatureName(currentPlan)
  
  // Analyze request
  requestFiles = ExtractFileReferences(request)
  requestLayers = InferAffectedLayers(request)
  requestFeature = ExtractFeatureName(request)
  
  // Calculate mismatch score (0-100)
  fileMismatch = CalculateSetDifference(requestFiles, currentFiles)
  layerMismatch = CalculateSetDifference(requestLayers, currentLayers)
  featureMismatch = CalculateStringSimilarity(requestFeature, currentFeature)
  
  mismatchScore = (fileMismatch * 0.4) + (layerMismatch * 0.3) + (featureMismatch * 0.3)
  
  IF mismatchScore > 70 THEN
    RETURN "HIGH_DRIFT" // Different scope, likely drift
  ELSE IF mismatchScore > 40 THEN
    RETURN "MEDIUM_DRIFT" // Some overlap, possible drift
  ELSE
    RETURN "LOW_DRIFT" // Same scope, likely extension
  END IF
  
END FUNCTION
```

### 3. Layer Mismatch Detection

```typescript
FUNCTION DetectLayerMismatch(currentKey, request)
  
  currentPlan = LoadPlan(currentKey)
  currentLayers = ExtractLayersFromPlan(currentPlan)
  
  // Layer keywords mapping
  layerKeywords = {
    "UI": ["component", "blazor", "razor", "styling", "CSS", "button", "form"],
    "API": ["endpoint", "controller", "route", "HTTP", "REST"],
    "Service": ["service", "business logic", "validation"],
    "Database": ["table", "schema", "migration", "SQL", "database"],
    "SignalR": ["hub", "broadcast", "real-time", "connection"]
  }
  
  requestLayers = []
  FOR EACH layer, keywords IN layerKeywords
    IF ContainsAny(request, keywords) THEN
      requestLayers.Add(layer)
    END IF
  END FOR
  
  // Check if request targets different layers
  overlap = Intersection(currentLayers, requestLayers)
  
  IF overlap.Count == 0 AND requestLayers.Count > 0 THEN
    RETURN "DIFFERENT_LAYERS" // Likely drift
  ELSE IF overlap.Count < requestLayers.Count THEN
    RETURN "PARTIAL_OVERLAP" // Possible drift
  ELSE
    RETURN "SAME_LAYERS" // Likely extension
  END IF
  
END FUNCTION
```

### 4. Temporal Pattern Detection

```typescript
FUNCTION DetectTemporalPattern(request)
  
  // Temporal interruption keywords
  temporalPatterns = [
    "before we", "first", "hold on", "wait",
    "actually", "instead", "change of plans"
  ]
  
  IF ContainsAny(request, temporalPatterns) THEN
    RETURN "TEMPORAL_INTERRUPT" // User wants to pause current work
  ELSE
    RETURN "CONTINUATION" // User wants to continue
  END IF
  
END FUNCTION
```

---

## Classification Algorithm

```typescript
FUNCTION ClassifyDrift(currentKey, request)
  
  // Step 1: Check for explicit keywords
  keywordScore = CheckDriftKeywords(request)
  
  // Step 2: Analyze scope mismatch
  scopeResult = DetectScopeMismatch(currentKey, request)
  
  // Step 3: Check layer mismatch
  layerResult = DetectLayerMismatch(currentKey, request)
  
  // Step 4: Temporal pattern detection
  temporalResult = DetectTemporalPattern(request)
  
  // Combine signals
  driftSignals = []
  
  IF keywordScore >= 90 THEN
    driftSignals.Add("explicit_keyword_high")
  ELSE IF keywordScore >= 60 THEN
    driftSignals.Add("explicit_keyword_medium")
  END IF
  
  IF scopeResult == "HIGH_DRIFT" THEN
    driftSignals.Add("scope_mismatch_high")
  ELSE IF scopeResult == "MEDIUM_DRIFT" THEN
    driftSignals.Add("scope_mismatch_medium")
  END IF
  
  IF layerResult == "DIFFERENT_LAYERS" THEN
    driftSignals.Add("layer_mismatch")
  END IF
  
  IF temporalResult == "TEMPORAL_INTERRUPT" THEN
    driftSignals.Add("temporal_interrupt")
  END IF
  
  // Final classification
  IF driftSignals.Contains("explicit_keyword_high") OR 
     (driftSignals.Contains("scope_mismatch_high") AND driftSignals.Contains("layer_mismatch")) THEN
    RETURN { classification: "DRIFT", confidence: "HIGH" }
  
  ELSE IF driftSignals.Length >= 2 THEN
    RETURN { classification: "DRIFT", confidence: "MEDIUM" }
  
  ELSE IF driftSignals.Length == 1 THEN
    RETURN { classification: "POSSIBLE_DRIFT", confidence: "LOW" }
  
  ELSE
    RETURN { classification: "EXTENSION", confidence: "HIGH" }
  END IF
  
END FUNCTION
```

---

## User Presentation Format

### High Confidence Drift Detected

```markdown
## 🔍 Drift Detected (High Confidence)

**Current Key**: `{current-key}`  
**Request Analysis**: Different scope/layers detected

**Signals**:
- ❌ Scope mismatch: Request targets different files
- ❌ Layer mismatch: Request targets {new-layer} vs current {current-layer}
- ⚠️ Keywords: "{drift-keyword}" detected

**Recommendation**: Create drift key

**A.** Create drift key `{current-key}-drift-001` (recommended)  
**B.** Expand current key scope (update plan)  
**C.** Create new independent key  
**D.** Continue anyway (no drift tracking)

Reply: A, B, C, or D
```

### Medium Confidence Drift Detected

```markdown
## 🤔 Possible Drift Detected (Medium Confidence)

**Current Key**: `{current-key}`  
**Request Analysis**: Some indicators of drift

**Signals**:
- ⚠️ Partial scope mismatch
- ⚠️ Keywords: "{possible-drift-keyword}"

**Options**:

**A.** Continue as extension (likely safe)  
**B.** Create drift key (safer separation)  
**C.** Review current plan first

Reply: A, B, or C
```

### Low Confidence / Extension

```markdown
## ✅ Extension Detected

**Current Key**: `{current-key}`  
**Request Analysis**: Aligned with current work

Proceeding as extension to current key...
```

---

## Integration Points

### route.prompt.md Integration

**New Step 1.6: Drift Detection** (insert after Step 1.5 Multi-Task Detection)

```markdown
### Step 1.6: Drift Detection (if active key exists)

**Load drift detection algorithm:**
- See: `.github/prompts/shared/drift-detection-algorithm.md`

**Execute classification:**
1. Load current active key from git history
2. Run drift classification algorithm
3. If HIGH confidence drift → HALT and present options
4. If MEDIUM confidence drift → Recommend drift creation
5. If LOW confidence / Extension → Proceed normally

**Behavior:**
- HIGH confidence: HALT, require user decision
- MEDIUM confidence: Present recommendation, allow override
- LOW/Extension: Auto-proceed (no interruption)
```

### todo.prompt.md Integration

**Enhancement to Mode Detection section:**

```markdown
## Mode Detection (Auto-Select Best Workflow)

When invoked, determine optimal workflow:

### If Active Key Detected
1. **Run drift detection** (see drift-detection-algorithm.md)
2. **If drift detected** (HIGH/MEDIUM confidence):
   - Present drift creation option
   - Offer plan expansion alternative
   - Allow override to continue
3. **If extension** (LOW confidence or explicit):
   - EXTEND existing work (primary todo.prompt.md behavior)
   - Load existing plan and context
   - Append new phases or modify existing ones
```

---

## Examples

### Example 1: Clear Drift

**Request**: "Also noticed the login button is misaligned, can we fix that?"  
**Current Key**: `user-dashboard` (working on profile page)

**Detection**:
- Keyword: "Also noticed" (HIGH confidence)
- Scope: Different component (login vs profile)
- Layer: UI (same) ✓
- **Result**: DRIFT (HIGH confidence)

**Recommendation**: Create `user-dashboard-drift-001` for login button fix

---

### Example 2: Extension

**Request**: "Add email validation to the profile form"  
**Current Key**: `user-dashboard` (working on profile page)

**Detection**:
- Keywords: None
- Scope: Same component (profile page)
- Layer: UI + Service (aligned with current)
- **Result**: EXTENSION (HIGH confidence)

**Action**: Proceed as todo extension

---

### Example 3: Borderline Case

**Request**: "Before we deploy, we should add logging to the API"  
**Current Key**: `ui-redesign` (working on UI components)

**Detection**:
- Keyword: "Before we" (temporal interrupt - MEDIUM)
- Scope: Different focus (logging vs UI)
- Layer: Different (API vs UI) ❌
- **Result**: DRIFT (MEDIUM confidence)

**Presentation**: Suggest drift creation, allow override

---

## Configuration

### Sensitivity Thresholds

Can be adjusted via optional parameters:

```
drift-sensitivity: high | medium | low
  - high: Trigger on MEDIUM+ confidence (more interruptions)
  - medium: Trigger on HIGH confidence only (default)
  - low: Never trigger automatically (manual drift only)
```

### False Positive Handling

**Common false positives** (ignore drift classification):
- "Also add tests" → Testing is extension, not drift
- "And document this" → Documentation is extension
- "Include error handling" → Standard practice, not drift

**Whitelist patterns** (never classify as drift):
- "test", "tests", "testing"
- "document", "documentation", "comments"
- "error handling", "validation", "logging" (if already in scope)

---

## Version History

**1.0.0** (2025-10-30)
- Initial implementation
- Four-signal detection (keywords, scope, layers, temporal)
- Confidence-based classification (HIGH/MEDIUM/LOW)
- Integration points for route.prompt.md and todo.prompt.md
