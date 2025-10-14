# Cross-Agent Learning Infrastructure

**Version:** 2.0  
**Created:** October 9, 2025  
**Updated:** October 14, 2025 (Consolidated to .github/learning/)  
**Purpose:** Enable knowledge sharing and pattern recognition across agent boundaries

---

## Overview

The Cross-Agent Learning Protocol provides a structured way for agents to share successful patterns, insights, and recommendations. This infrastructure enables the system to learn from each agent's experiences and apply those learnings across all domains.

**New in v2.0**: 
- 🎯 **Centralized Location**: Moved from `Workspaces/Copilot/learning/` to `.github/learning/` for better integration with prompts
- 🧠 **Error Pattern Library**: Added `error-patterns.json` with 8 documented failure patterns and solutions
- 🔄 **Self-Improvement Loop**: task.prompt.md now updates itself from workspace patterns (Step 10)
- 📊 **Pattern Extraction**: Automatic mining of success/failure patterns from workspace documentation

---

## Directory Structure

```
.github/learning/                       # NEW LOCATION (v2.0)
├── README.md                           # This file
├── error-patterns.json                 # NEW: Known error patterns with solutions
├── PATTERN_SCHEMA.md                   # Pattern file schemas
├── patterns/                           # Successful execution patterns
│   ├── task-patterns.json              # task.prompt.md patterns
│   ├── refactor-patterns.json          # refactor.prompt.md patterns
│   ├── validation-patterns.json        # Common validation solutions
│   ├── cleanup-patterns.json           # Cleanup workflow patterns
│   └── analyze-learning-patterns.json  # Learning analysis patterns
├── insights/                           # Component-specific learnings
│   ├── component-insights.json         # Component-level best practices
│   ├── technology-insights.json        # Framework/library patterns
│   └── performance-insights.json       # Performance optimizations
└── recommendations/                    # System improvements
    ├── active-recommendations.md       # Current suggestions
    └── implemented-recommendations.md  # Applied learnings tracker
```

---

## Error Pattern Library (NEW v2.0)

**File**: `error-patterns.json`  
**Purpose**: Instant error resolution by matching against known failure patterns

**Current Patterns** (8 total):
1. **FP-001**: Blazor ServerPrerendered renderer conflict (JSInterop failures)
2. **FP-002**: Self-contained executable configuration embedding
3. **FP-003**: Dynamic JSON deserialization RuntimeBinderException
4. **FP-004**: PowerShell profile directory conflict ✅ RESOLVED
5. **FP-005**: ESLint unused variable accumulation
6. **FP-006**: Workspace cleanup regression
7. **FP-007**: File lock build failures ✅ RESOLVED
8. **FP-008**: Database timeout network issues

**Integration**: task.prompt.md Step 2.7 queries this file for instant error pattern matching

**Self-Update**: task.prompt.md Step 10.2 automatically adds new patterns after successful error resolutions

---

## Pattern Categories

### Task Patterns (`patterns/task-patterns.json`)

**Purpose:** Capture successful task execution approaches

**Categories:**
- **Planning:** Effective planning strategies
- **Execution:** Reliable execution techniques
- **Validation:** Proven validation approaches
- **Error Handling:** Successful error recovery patterns
- **Optimization:** Performance and efficiency improvements

**Example Pattern:**
```json
{
  "pattern_id": "tp-001",
  "name": "Incremental Validation",
  "category": "validation",
  "description": "Validate after each subtask instead of at the end",
  "context": "Multi-step tasks with dependencies",
  "approach": "Run validation pipeline after completing each subtask, catch issues early",
  "success_indicators": [
    "Faster failure detection",
    "Easier rollback to specific subtask",
    "Reduced debugging time"
  ],
  "learned_from": ["hcp", "session-transcript-css"],
  "success_rate": 0.95,
  "last_updated": "2025-10-09T10:00:00Z"
}
```

### Refactor Patterns (`patterns/refactor-patterns.json`)

**Purpose:** Document effective refactoring strategies

**Categories:**
- **Scope Analysis:** Current vs holistic analysis techniques
- **Structural Change:** Safe code reorganization methods
- **Iterative Improvement:** Incremental refactoring approaches
- **Contract Preservation:** Maintaining API/DTO integrity
- **Rollback Strategy:** Recovery from failed refactorings

### Validation Patterns (`patterns/validation-patterns.json`)

**Purpose:** Catalog common validation issues and solutions

**Validation Levels:**
- Build
- Analyzers
- Linters
- Contracts
- Tests
- Documentation

**Example Pattern:**
```json
{
  "pattern_id": "vp-001",
  "name": "ESLint Baseline Drift",
  "validation_level": "linters",
  "issue_description": "New ESLint errors introduced beyond accepted baseline",
  "symptoms": [
    "npm run lint fails with new errors",
    "Errors not in accepted baseline list"
  ],
  "root_causes": [
    "New SignalR global usage",
    "Playwright context pattern violation"
  ],
  "solution": "Review new errors, fix if possible, or update baseline with justification",
  "prevention": "Consult AnalyzerConfig.MD before adding SignalR/Playwright code",
  "learned_from": ["canvas-refactor", "playwright-isolation"],
  "frequency": 3,
  "last_occurrence": "2025-10-01T14:30:00Z"
}
```

### Integration Patterns (`patterns/integration-patterns.json`)

**Purpose:** Successful multi-agent workflows

**Example Pattern:**
```json
{
  "pattern_id": "ip-001",
  "name": "Feature Implementation with Validation",
  "workflow": ["task", "refactor", "healthcheck", "sync"],
  "description": "Complete feature implementation workflow",
  "use_case": "Adding new features with full system validation",
  "handoff_strategy": "task creates feature, refactor optimizes, healthcheck validates, sync updates docs",
  "success_criteria": [
    "Feature fully implemented",
    "Code optimized and clean",
    "No architectural drift",
    "Documentation current"
  ],
  "learned_from": ["hcp", "admin-dashboard"],
  "success_rate": 0.90,
  "last_updated": "2025-10-09T10:00:00Z"
}
```

---

## Insights Categories

### Component Insights (`insights/component-insights.json`)

**Purpose:** Component-specific best practices and gotchas

**Schema:**
```json
{
  "component": "AdminController",
  "insights": [
    {
      "insight_id": "ci-001",
      "type": "best-practice",
      "description": "Always validate admin authentication before protected operations",
      "learned_from": ["admin-security-fix"],
      "applies_to": ["Controllers", "API Endpoints"]
    }
  ]
}
```

### Technology Insights (`insights/technology-insights.json`)

**Purpose:** Framework and library patterns

**Technologies:**
- ASP.NET Core
- Blazor Server
- SignalR
- Entity Framework Core
- Playwright
- ESLint/Prettier

### Performance Insights (`insights/performance-insights.json`)

**Purpose:** Performance optimization learnings

**Categories:**
- Database query optimization
- SignalR message batching
- Blazor rendering optimization
- Asset loading strategies

---

## Recommendations Tracking

### Active Recommendations (`recommendations/active-recommendations.md`)

**Purpose:** Current improvement suggestions from learning analysis

**Format:**
```markdown
## Active Recommendations

### High Priority

#### R-001: Implement Automated Contract Validation
- **Source:** analyze-learning agent, 2025-10-09
- **Context:** 3 keys experienced API/DTO mismatches
- **Recommendation:** Add pre-commit hook for contract validation
- **Expected Impact:** Reduce contract mismatches by 80%
- **Status:** Pending Review

### Medium Priority
...
```

### Implemented Recommendations (`recommendations/implemented-recommendations.md`)

**Purpose:** Track applied learnings and their outcomes

**Format:**
```markdown
## Implemented Recommendations

### 2025-10-09: Unified Validation Framework
- **Recommendation ID:** R-002
- **Source:** Holistic System Review
- **Implementation:** Created ValidationFramework.md
- **Outcome:** Reduced validation inconsistencies, simplified prompt maintenance
- **Measured Impact:** 100% validation consistency across 4 agents
```

---

## Agent Integration

### Cross-Agent Learning Mandate

All agent prompts must include this mandate in their Core Mandates section:

```markdown
## Core Mandates
- **Cross-Agent Learning**: Query `Workspaces/Copilot/learning/` for relevant patterns before execution
- **Knowledge Contribution**: Update pattern library after successful completion
- **Insight Sharing**: Document component-specific learnings for other agents
```

### Querying Patterns

Agents should query the learning library before execution:

1. **Task Agent:** Check `task-patterns.json` for similar task patterns
2. **Refactor Agent:** Check `refactor-patterns.json` for scope-specific strategies
3. **All Agents:** Check `validation-patterns.json` for known validation issues
4. **Multi-Agent Workflows:** Check `integration-patterns.json` for handoff strategies

### Contributing Patterns

After successful execution, agents should:

1. Identify successful approaches worth sharing
2. Format pattern according to schema
3. Add to appropriate pattern file
4. Include key identifier in `learned_from` array
5. Update `last_updated` timestamp

---

## Self-Learning Agent Integration

The `analyze-learning.prompt.md` agent is responsible for:

1. **Pattern Mining:** Analyze completed keys for successful patterns
2. **Insight Extraction:** Identify component and technology learnings
3. **Recommendation Generation:** Propose system improvements
4. **Pattern Validation:** Verify pattern success rates and applicability
5. **Knowledge Curation:** Keep patterns current and remove obsolete entries

---

## Usage Guidelines

### For Agents

**Before Execution:**
```markdown
1. Query relevant pattern files for applicable patterns
2. Check validation-patterns.json for known issues in this domain
3. Review integration-patterns.json if multi-agent workflow expected
4. Apply learned patterns to current execution plan
```

**After Execution:**
```markdown
1. Document any new successful approaches
2. Update pattern success rates if pattern was used
3. Add to learned_from array for patterns applied
4. Contribute new patterns if novel approach discovered
```

### For analyze-learning Agent

**Analysis Frequency:** Weekly or after every 10 completed keys

**Analysis Steps:**
1. Query all completed keys since last analysis
2. Extract successful patterns and approaches
3. Identify common failure modes
4. Generate recommendations
5. Update pattern files
6. Update active recommendations

---

## Metrics & Success Indicators

### Pattern Effectiveness Metrics

- **Success Rate:** Percentage of times pattern led to successful outcome
- **Frequency:** How often pattern is applicable
- **Time Savings:** Average time saved by applying pattern
- **Error Reduction:** Reduction in errors when pattern applied

### Learning System Health

- **Pattern Growth Rate:** New patterns added per month
- **Pattern Application Rate:** Patterns used / total executions
- **Recommendation Implementation Rate:** Recommendations applied / total recommendations
- **Cross-Agent Knowledge Sharing:** Patterns used across different agents

---

## Maintenance

### Pattern Review Cycle

**Quarterly Review:**
- Remove obsolete patterns (< 0.3 success rate, not used in 3 months)
- Update pattern descriptions based on recent learnings
- Consolidate similar patterns
- Verify all learned_from keys still exist

### Recommendation Review Cycle

**Monthly Review:**
- Evaluate active recommendations
- Implement high-priority recommendations
- Archive completed recommendations
- Update recommendation priorities

---

## Related Documentation

- [analyze-learning.prompt.md](../../.github/prompts/analyze-learning.prompt.md) - Self-learning agent
- [ValidationFramework.md](../../.github/instructions/Links/ValidationFramework.md) - Validation standards
- [SelfAwareness.instructions.md](../../.github/instructions/SelfAwareness.instructions.md) - Global guardrails
- [SystemStructureSummary.md](../../.github/instructions/Links/SystemStructureSummary.md) - Agent coordination

---

**Maintained By:** analyze-learning agent  
**Next Review:** November 9, 2025
