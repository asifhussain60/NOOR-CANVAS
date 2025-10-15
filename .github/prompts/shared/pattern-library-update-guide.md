# Pattern Library Update Guide

## Pattern Files Location
`Workspaces/Copilot/learning/patterns/`

## Update Workflow

### 1. Update Pattern Files
Add new patterns following PATTERN_SCHEMA.md to:
- `task-patterns.json` - Task execution patterns
- `refactor-patterns.json` - Code refactoring patterns
- `validation-patterns.json` - Validation and testing patterns
- `integration-patterns.json` - Cross-agent workflow patterns
- `question-patterns.json` - Q&A handling patterns
- `{agent}-patterns.json` - Agent-specific meta-patterns

### 2. Update Insight Files
- `component-insights.json` - Component-specific learnings
- `technology-insights.json` - Framework best practices
- `performance-insights.json` - Performance optimization tips

### 3. Update Recommendations
- `active-recommendations.md` - New recommendations to implement
- `implemented-recommendations.md` - Completed recommendation tracker
- Update priority assignments with ROI estimates

### 4. Propose SelfAwareness Updates
**DO NOT UPDATE DIRECTLY** - Generate proposals for:
- Failed approaches → "Memory of Failures" section
- New guardrails based on recurring issues
- Baseline debt updates (ESLint, StyleCop)

**Requires:** User approval before applying to SelfAwareness.instructions.md

## Schema Compliance
All pattern contributions MUST follow:
`Workspaces/Copilot/learning/PATTERN_SCHEMA.md`

## Pattern Quality Standards
- Patterns must have >= 2 occurrences to be added
- Success rate must be >= 0.7 for pattern inclusion
- Recommendations must have clear ROI justification
- All insights must be actionable

## Referenced By
- analyze-learning.prompt.md (Step 5: Knowledge Update)
- All agents querying learning infrastructure before execution
