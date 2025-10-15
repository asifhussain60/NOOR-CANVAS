# Learning Infrastructure

This directory contains the AI agent learning system that accumulates knowledge over time.

---

## Purpose

The learning system captures patterns, insights, and recommendations from agent executions to continuously improve performance and avoid repeating mistakes.

---

## Directory Structure

```
learning/
├── README.md (this file)
├── PATTERN_SCHEMA.md - Schema for documenting patterns
├── error-patterns.json - Known error patterns
├── patterns/ - Learned patterns by agent type
│   ├── task-patterns.json
│   ├── refactor-patterns.json
│   ├── test-patterns.json
│   └── ...
├── insights/ - Project-specific insights
│   ├── component-insights.json
│   ├── technology-insights.json
│   └── ...
└── recommendations/ - Active and implemented recommendations
    ├── active-recommendations.md
    └── implemented-recommendations.md
```

---

## How It Works

### 1. Pattern Capture
As agents execute tasks, they document:
- **Success patterns** - Approaches that worked well
- **Failure patterns** - Approaches that failed (to avoid repeating)
- **Performance patterns** - Efficiency improvements

### 2. Pattern Storage
Patterns are stored in JSON files organized by agent type:
```json
{
  "pattern_name": "descriptive-kebab-case",
  "category": "success|failure|performance",
  "occurrences": 5,
  "context": "When this pattern applies",
  "symptoms": ["Observable indicators"],
  "solution": "How to handle or avoid",
  "examples": ["Specific instances from work logs"],
  "last_seen": "2025-01-01"
}
```

### 3. Learning Analysis
The `/analyze-learning` agent periodically:
- Reviews work logs and execution history
- Extracts new patterns
- Updates pattern libraries
- Generates insights and recommendations

### 4. Pattern Application
Future agent executions reference the learning library to:
- Apply proven successful approaches
- Avoid known failure patterns
- Optimize for performance
- Make informed decisions

---

## Key Files

### PATTERN_SCHEMA.md
Defines the structure for documenting patterns. All pattern files should follow this schema.

### error-patterns.json
Central registry of known error patterns across all agents. Used for:
- Error prevention
- Troubleshooting guidance
- Quick error resolution

### patterns/
Agent-specific pattern files:
- `task-patterns.json` - Task agent learnings
- `refactor-patterns.json` - Refactoring patterns
- `test-patterns.json` - Test generation patterns
- `validation-patterns.json` - Validation approaches
- `cleanup-patterns.json` - Cleanup strategies

### insights/
Project-specific knowledge:
- `component-insights.json` - Component-specific learnings
- `technology-insights.json` - Technology stack insights
- `integration-insights.json` - Integration patterns

### recommendations/
Actionable improvements:
- `active-recommendations.md` - Current recommendations to implement
- `implemented-recommendations.md` - Completed improvements

---

## Usage

### For Agents
1. Before executing tasks, check relevant pattern files
2. During execution, apply learned patterns
3. After execution, document new patterns discovered
4. Periodically run `/analyze-learning` to extract patterns

### For Developers
1. Review pattern files to understand common issues
2. Check recommendations for improvement opportunities
3. Update patterns when project structure changes
4. Run `/analyze-learning` after major milestones

---

## Best Practices

1. **Regular Analysis**: Run learning analysis weekly or after major features
2. **Pattern Quality**: Document specific, actionable patterns
3. **Keep Current**: Remove obsolete patterns as project evolves
4. **Share Knowledge**: Review patterns in team discussions
5. **Continuous Improvement**: Act on recommendations

---

## Initial Setup

This learning directory starts empty. It will populate automatically as:
1. Agents execute tasks and document learnings
2. `/analyze-learning` extracts patterns from work logs
3. Patterns accumulate over time
4. Knowledge base grows organically

**Note**: Don't manually edit pattern files unless correcting errors. Let agents maintain the learning system.

---

## Version History

- **v1.0.0** (Setup): Initial learning infrastructure from portable template
  - Empty pattern directories ready for population
  - Schema and structure established
  - Ready for first learning cycle
