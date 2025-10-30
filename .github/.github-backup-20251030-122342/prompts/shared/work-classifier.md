# work-classifier.md (Work Type Classification Algorithm)

---
purpose: Classify user request to determine optimal target agent (ask, todo, plan, test, healthcheck, drift)
lastUpdated: 2025-10-27
---

## Purpose
Analyze user request to validate target choice is appropriate, or recommend better target based on work type indicators.

## Algorithm

```
FUNCTION ClassifyWorkType(request, context, providedTarget)
  
  // Initialize classification
  indicators = {
    question: [],
    continuation: [],
    validation: [],
    drift: [],
    testing: [],
    planning: []
  }
  
  // 1. Question Indicators (route to ask)
  questionPatterns = ["how do", "how does", "what is", "why is", "where is", "explain", "clarify"]
  FOR EACH pattern IN questionPatterns
    IF request.toLowerCase().startsWith(pattern) OR request.contains("? " + pattern) THEN
      indicators.question.add(pattern)
    END IF
  END FOR
  
  // 2. Continuation Indicators (route to todo)
  continuationPatterns = ["continue", "resume", "keep going", "next phase", "proceed with"]
  activeKey = DetectActiveKeyFromGitHistory()
  FOR EACH pattern IN continuationPatterns
    IF request.toLowerCase().contains(pattern) THEN
      indicators.continuation.add(pattern)
    END IF
  END FOR
  IF activeKey != null THEN
    indicators.continuation.add("Active key detected: " + activeKey)
  END IF
  
  // 3. Validation Indicators (route to healthcheck)
  validationPatterns = ["validate", "verify", "check", "audit", "review quality", "lint", "analyze code"]
  FOR EACH pattern IN validationPatterns
    IF request.toLowerCase().contains(pattern) THEN
      indicators.validation.add(pattern)
    END IF
  END FOR
  
  // 4. Drift Indicators (route to drift)
  driftPatterns = ["unrelated issue", "tangent", "blocker found", "side issue", "discovered problem"]
  FOR EACH pattern IN driftPatterns
    IF request.toLowerCase().contains(pattern) THEN
      indicators.drift.add(pattern)
    END IF
  END FOR
  
  // 5. Testing Indicators (route to test-generation)
  testPatterns = ["create test", "add test", "test coverage", "playwright", "e2e test", "visual regression", "percy"]
  FOR EACH pattern IN testPatterns
    IF request.toLowerCase().contains(pattern) THEN
      indicators.testing.add(pattern)
    END IF
  END FOR
  
  // 6. Planning Indicators (route to plan)
  planningPatterns = ["new feature", "architecture", "redesign", "refactor", "migration", "multi-phase", "comprehensive"]
  FOR EACH pattern IN planningPatterns
    IF request.toLowerCase().contains(pattern) THEN
      indicators.planning.add(pattern)
    END IF
  END FOR
  
  // Determine Recommended Target
  recommendedTarget = DetermineTarget(indicators, providedTarget)
  
  RETURN {
    workType: recommendedTarget,
    indicators: indicators,
    confidence: CalculateConfidence(indicators, recommendedTarget),
    shouldOverride: (providedTarget != null AND providedTarget != recommendedTarget)
  }
END FUNCTION

FUNCTION DetermineTarget(indicators, providedTarget)
  // Priority order (highest confidence first)
  
  IF indicators.question.length >= 2 THEN
    RETURN "ask"
  END IF
  
  IF indicators.continuation.length >= 2 THEN
    RETURN "todo"
  END IF
  
  IF indicators.validation.length >= 1 THEN
    RETURN "healthcheck"
  END IF
  
  IF indicators.drift.length >= 1 THEN
    RETURN "drift"
  END IF
  
  IF indicators.testing.length >= 2 THEN
    RETURN "test-generation"
  END IF
  
  IF indicators.planning.length >= 1 THEN
    RETURN "plan"
  END IF
  
  // Default fallback
  IF providedTarget != null THEN
    RETURN providedTarget
  END IF
  
  RETURN "plan"  // Conservative default: comprehensive planning
END FUNCTION

FUNCTION CalculateConfidence(indicators, recommendedTarget)
  // Count strong indicators for recommended target
  targetIndicatorMap = {
    "ask": indicators.question.length,
    "todo": indicators.continuation.length,
    "healthcheck": indicators.validation.length,
    "drift": indicators.drift.length,
    "test-generation": indicators.testing.length,
    "plan": indicators.planning.length
  }
  
  strongIndicatorCount = targetIndicatorMap[recommendedTarget]
  
  IF strongIndicatorCount >= 3 THEN
    RETURN "high"
  ELSE IF strongIndicatorCount == 2 THEN
    RETURN "medium"
  ELSE
    RETURN "low"
  END IF
END FUNCTION

FUNCTION DetectActiveKeyFromGitHistory()
  // Check recent commits for checkpoint pattern
  recentCommits = GitLog(limit: 5)
  
  FOR EACH commit IN recentCommits
    IF commit.message.matches("ckpt\\(([a-z-]+)\\):") THEN
      key = ExtractKeyFromCommitMessage(commit.message)
      RETURN key
    END IF
  END FOR
  
  RETURN null
END FUNCTION
```

## Output Format

**Classification Result:**
```markdown
🏷️ Work Type: ask
- Question indicators: how does (2), explain (1)
- Confidence: high
- Recommended: ask.prompt.md
```

**Override Warning:**
```markdown
⚠️ Target Override Detected
- Provided: plan
- Recommended: ask (confidence: high)
- Reason: Request contains 3 question indicators
- Suggestion: Use @workspace /ask instead for faster response
- Override: User can proceed with /build plan if comprehensive planning desired
```

## Integration Points

**Called by:**
- `build.prompt.md` (Step 2) - Validates target choice and recommends alternatives

**Returns to:**
- `build.prompt.md` which may show override warning to user before proceeding

## Work Type Definitions

| Work Type | Agent | When to Use |
|-----------|-------|-------------|
| `ask` | ask.prompt.md | Answering questions, explaining concepts, clarifying architecture |
| `todo` | todo.prompt.md | Extending current work, continuing with same key, adding to existing plan |
| `plan` | plan.prompt.md | New features, architectural changes, multi-phase work, comprehensive planning |
| `test-generation` | test-generation.prompt.md | Creating Playwright tests, E2E scenarios, visual regression tests |
| `healthcheck` | healthcheck.prompt.md | Code quality audits, validation, lint analysis, prompt optimization |
| `drift` | drift.prompt.md | Unrelated issues discovered during work, side problems, blockers |

## Edge Cases

**Ambiguous Requests:**
- "How do I add a new feature?" → **ask** (question about process, not request to implement)
- "Continue adding the new feature" → **todo** (clear continuation)
- "Add logging and explain how it works" → **plan** (implementation + question = comprehensive work)
- "Validate the new feature" → **healthcheck** (quality focus)

**Multi-Indicator Requests:**
If request has indicators for multiple types, use priority order:
1. question (ask)
2. continuation (todo)
3. validation (healthcheck)
4. drift (drift)
5. testing (test-generation)
6. planning (plan)

## See Also
- `.github/prompts/shared/task-detector.md` - Detects single vs multiple tasks
- `.github/prompts/build.prompt.md` - Consumes this algorithm in Step 2
- `.github/prompts/shared/agent-handoff-protocol.md` - Defines handoff patterns between agents
