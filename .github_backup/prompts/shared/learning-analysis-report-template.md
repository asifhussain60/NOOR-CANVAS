# Self-Learning Analysis Report Template

## Report Structure

```markdown
# Self-Learning Analysis Report
**Date:** {date}
**Scope:** {scope}
**Keys Analyzed:** {count}

## Executive Summary
- Success Rate: X%
- Average Duration: Xm Ys
- Top Patterns Identified: N
- Critical Recommendations: N

## Success Patterns
[Detailed analysis of successful execution patterns]

### Pattern Category 1
- Pattern ID: [pattern-id]
- Success Rate: [X%]
- Usage Count: [N]
- Description: [what makes this pattern successful]
- Example Keys: [key-1, key-2]

### Pattern Category 2
[Continue for all identified success patterns]

## Failure Patterns
[Detailed analysis of failed execution patterns]

### Anti-Pattern 1
- Pattern ID: [anti-pattern-id]
- Failure Rate: [X%]
- Occurrence Count: [N]
- Root Cause: [why this pattern fails]
- Example Keys: [failed-key-1, failed-key-2]
- Mitigation: [how to avoid this pattern]

### Anti-Pattern 2
[Continue for all identified failure patterns]

## Efficiency Insights
[Duration analysis and optimization opportunities]

### Phase Duration Analysis
- Average Planning Time: [Xm Ys]
- Average Execution Time: [Xm Ys]
- Average Validation Time: [Xm Ys]
- Total Average Duration: [Xm Ys]

### Efficiency Outliers
- Fastest Execution: [key-id] ([duration], [reason for speed])
- Slowest Execution: [key-id] ([duration], [reason for delay])

### Optimization Opportunities
- [Opportunity 1: specific bottleneck and recommendation]
- [Opportunity 2: process improvement suggestion]

## Quality Trends
[Warning/error trends and improvement metrics]

### Warning/Error Analysis
- Total Warnings: [N] (trend: [up/down/stable])
- Total Errors: [N] (trend: [up/down/stable])
- Most Common Warning: [warning-type] ([N occurrences])
- Most Common Error: [error-type] ([N occurrences])

### Validation Metrics
- Validation Pass Rate: [X%]
- Average Validation Failures per Key: [N]
- Validation Improvement Trend: [improving/declining/stable]

## Component Insights
[Component-specific learnings and best practices]

### Component: [ComponentName]
- Keys Modified: [N]
- Success Rate: [X%]
- Common Issues: [list of issues]
- Best Practices Identified: [list of practices]

[Repeat for each frequently modified component]

## Technology Insights
[Framework-specific patterns and optimizations]

### ASP.NET Core
- [Pattern or insight discovered]

### Blazor
- [Pattern or insight discovered]

### SignalR
- [Pattern or insight discovered]

### Entity Framework
- [Pattern or insight discovered]

### Playwright
- [Pattern or insight discovered]

## Recommendations

### Critical
[High-impact, immediate action items]
1. [Recommendation with clear action and expected impact]
2. [Recommendation with priority justification]

### High Priority
[Important improvements with clear ROI]
1. [Recommendation with ROI estimate]
2. [Recommendation with implementation timeline]

### Medium Priority
[Beneficial enhancements for future consideration]
1. [Recommendation with long-term value]
2. [Recommendation for process improvement]

## Proposed SelfAwareness Updates
[If applicable - proposals for instruction updates]

### Memory of Failures
- Add: [Failed approach that should be documented]
- Rationale: [Why this should be in permanent memory]

### New Guardrails
- Guardrail: [Proposed new rule]
- Justification: [Recurring issue count and impact]

### Baseline Debt Updates
- Update: [ESLint/StyleCop baseline adjustment]
- Reason: [Pattern of acceptable exceptions]

**NOTE:** All SelfAwareness updates require user approval before implementation.

## Pattern Library Updates
[Summary of patterns added/updated in learning infrastructure]

### New Patterns Added
- `task-patterns.json`: [N new patterns]
- `refactor-patterns.json`: [N new patterns]
- `validation-patterns.json`: [N new patterns]

### Patterns Updated
- [pattern-id]: Frequency increased from [N] to [M]
- [pattern-id]: Success rate updated from [X%] to [Y%]

### Meta-Patterns Identified
- [meta-pattern description and significance]

## Next Analysis
Recommended date: {date + 1 week or +10 keys}

**Trigger Conditions:**
- Weekly if >= 10 keys completed
- On-demand if major system change
- After significant architectural updates
```

## Usage
Referenced by: analyze-learning.prompt.md (Step 6: Generate Analysis Report)

## Output Location
`Workspaces/Copilot/_DOCS/analysis/learning-analysis-{date}.md`
