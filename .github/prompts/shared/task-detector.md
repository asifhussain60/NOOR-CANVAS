# task-detector.md (Multi-Task Detection Algorithm)

---
purpose: Detect single vs multiple distinct tasks to enable intelligent routing (single → todo, multiple → plan)
lastUpdated: 2025-10-27
---

## Purpose
Analyze user request to determine if it contains a single focused task (route to todo for immediate execution) or multiple unrelated tasks (route to plan for coordination and approval).

## Algorithm

```
FUNCTION DetectMultipleTasks(request, context)
  
  // Parse request for task indicators
  taskIndicators = []
  
  // 1. Numbered/bulleted lists
  IF request.contains("1.", "2.", "3.") OR request.contains("* ", "- ") THEN
    taskCount = CountListItems(request)
    IF taskCount > 1 THEN
      taskIndicators.add("Numbered/bulleted list with " + taskCount + " items")
    END IF
  END IF
  
  // 2. Coordinating conjunctions indicating separate actions
  conjunctions = ["and also", "and fix", "and update", "and add", "then also", "also need to"]
  FOR EACH conjunction IN conjunctions
    IF request.contains(conjunction) THEN
      taskIndicators.add("Coordinating conjunction: " + conjunction)
    END IF
  END FOR
  
  // 3. Multiple file references with different actions
  fileActions = ExtractFileActions(request)  // e.g., "update X, create Y, modify Z"
  IF fileActions.length > 2 THEN
    taskIndicators.add(fileActions.length + " distinct file operations")
  END IF
  
  // 4. Multiple problem statements or questions
  problemMarkers = ["issue:", "problem:", "bug:", "also:", "additionally:"]
  problemCount = CountOccurrences(request, problemMarkers)
  IF problemCount > 1 THEN
    taskIndicators.add(problemCount + " separate problem statements")
  END IF
  
  // 5. Sentence complexity (multiple independent clauses)
  sentences = SplitIntoSentences(request)
  complexSentences = sentences.filter(s => s.contains(";") OR s.contains(",") AND s.wordCount > 15)
  IF complexSentences.length > 2 THEN
    taskIndicators.add("Multiple complex sentences suggesting separate concerns")
  END IF
  
  // Decision Logic
  IF taskIndicators.isEmpty THEN
    RETURN {
      isSingleTask: true,
      recommendedTarget: "todo",
      reasoning: "Single focused task detected"
    }
  ELSE IF taskIndicators.length == 1 AND taskIndicators[0].startsWith("Coordinating conjunction") THEN
    // Edge case: "Update X and test it" is still single task
    IF request.contains("test it") OR request.contains("verify it") THEN
      RETURN {
        isSingleTask: true,
        recommendedTarget: "todo",
        reasoning: "Single task with verification step"
      }
    END IF
  END IF
  
  RETURN {
    isSingleTask: false,
    recommendedTarget: "plan",
    reasoning: "Multiple tasks detected: " + taskIndicators.join(", "),
    taskIndicators: taskIndicators
  }
END FUNCTION

FUNCTION ExtractFileActions(request)
  actions = []
  actionVerbs = ["update", "create", "modify", "add", "remove", "delete", "fix", "refactor"]
  filePattern = /[A-Z][a-zA-Z0-9]*\.(cs|razor|ts|js|sql|md)/
  
  FOR EACH verb IN actionVerbs
    matches = request.findAll(verb + " " + filePattern)
    actions.addAll(matches)
  END FOR
  
  RETURN actions
END FUNCTION
```

## Output Format

**Single Task Detected:**
```markdown
🔍 Task Analysis: Single focused task
→ Routing: todo (auto-approved, immediate execution)
```

**Multiple Tasks Detected:**
```markdown
🔍 Task Analysis: Multiple tasks detected
- Indicators: Numbered list (3 items), Multiple file operations (4 files)
→ Routing: plan (requires user approval, multi-phase coordination)
```

## Integration Points

**Called by:**
- `build.prompt.md` (Step 1.5) - Determines intelligent routing when target not specified

**Returns to:**
- `build.prompt.md` which either routes to `todo.prompt.md` or `plan.prompt.md`

## Edge Cases

**Ambiguous Cases:**
- "Update X and test it" → Single task (testing is verification of primary action)
- "Fix bug in X. Also, the Y feature needs..." → Multiple tasks (separate concerns)
- "Refactor X, Y, and Z files" → Single task (same action, related files)
- "Add feature A. Fix bug B. Update docs." → Multiple tasks (unrelated actions)

**Override:**
User can always force routing by explicitly specifying target:
```
@workspace /build todo "update X and also fix Y"  # Forces todo despite multiple indicators
@workspace /build plan "add logging"              # Forces plan for comprehensive approach
```

## See Also
- `.github/prompts/shared/work-classifier.md` - Classifies work type after task detection
- `.github/prompts/build.prompt.md` - Consumes this algorithm in Step 1.5
- `.github/prompts/todo.prompt.md` - Receives single-task handoffs
- `.github/prompts/plan.prompt.md` - Receives multi-task handoffs
