# Key Data Stream Entry Template - analyze-learning Agent

## Entry Format

```markdown
---
## [ISO-8601-Timestamp] - analyze-learning agent

**Status**: complete
**Phase**: analysis
**Git Commit**: [full-sha-hash]
**Scope**: [recent|all|key=X]
**Analysis Type**: [comprehensive|success-patterns|failure-patterns|efficiency|quality-trends]

**Patterns Extracted**:
- [X] task-patterns.json: [N new patterns, M updated patterns]
- [X] refactor-patterns.json: [N new patterns, M updated patterns]
- [X] validation-patterns.json: [N new patterns, M updated patterns]
- [X] integration-patterns.json: [N new patterns, M updated patterns]
- [X] question-patterns.json: [N new patterns, M updated patterns]
- [X] analyze-learning-patterns.json: [N meta-patterns identified]

**Key Insights**:
- [Insight 1 from cross-agent analysis]
- [Insight 2 from trend analysis]
- [Insight 3 from efficiency review]

**Success Metrics**:
- Overall success rate: [X%]
- Most successful pattern: [pattern-id] (usage: N, success: X%)
- Highest efficiency gain: [pattern-id] ([X]% time reduction)

**Recommendations**:
- [Recommendation 1 for system improvement]
- [Recommendation 2 for workflow optimization]
- [Recommendation 3 for pattern consolidation]

**Files Modified**:
- `Workspaces/Copilot/learning/task-patterns.json` ([N additions, M updates])
- `Workspaces/Copilot/learning/refactor-patterns.json` ([N additions, M updates])
- `Workspaces/Copilot/learning/analyze-learning-patterns.json` ([N meta-patterns])

**Keys Analyzed**: [N total keys, M completed, P failed, Q in-progress]

**Next Analysis**: Scheduled for [date] or after [X] more completed keys

---
```

## Usage
Referenced by: analyze-learning.prompt.md (Step 6: Summary + Key Data Stream Update)

## Key Data Stream Path
`.github/key-data-streams/learning-analysis/work-log.md`
