# Learning Pattern Schema

## Overview
This document defines the JSON schema for all learning pattern files in the `Workspaces/Copilot/learning/` directory. All agents must follow this schema when contributing learnings to the self-improvement infrastructure.

---

## Pattern File Types

### 1. task-patterns.json
**Purpose**: Successful implementation patterns from task agent executions

**Schema**:
```json
{
  "patterns": [
    {
      "id": "unique-pattern-identifier",
      "name": "Human-readable pattern name",
      "category": "ui|api|service|database|signalr|testing|configuration",
      "description": "Detailed description of what this pattern accomplishes",
      "context": "When and why to use this pattern",
      "implementation": {
        "steps": [
          "Step 1: Action to take",
          "Step 2: Next action",
          "Step 3: Continuation..."
        ],
        "files_affected": [
          "path/to/file1.cs",
          "path/to/file2.razor"
        ],
        "dependencies": [
          "Required NuGet package 1",
          "Required npm package 2"
        ]
      },
      "validation": {
        "tests_required": true,
        "playwright_coverage": ["user interaction", "visual regression"],
        "analyzer_checks": ["CS1234", "RCS5678"]
      },
      "success_metrics": {
        "usage_count": 5,
        "success_rate": 1.0,
        "avg_execution_time_seconds": 45
      },
      "examples": [
        {
          "key": "hcp",
          "git_commit": "abc123def456...",
          "description": "Successfully implemented feature X using this pattern"
        }
      ],
      "last_updated": "2025-10-10T16:00:00Z",
      "contributed_by": "task"
    }
  ],
  "anti_patterns": [
    {
      "id": "unique-antipattern-identifier",
      "name": "What NOT to do",
      "description": "Why this approach fails",
      "failures": [
        {
          "key": "session",
          "git_commit": "def456abc789...",
          "error": "Error message encountered",
          "lesson": "What we learned from this failure"
        }
      ],
      "alternative": "Reference to pattern ID that should be used instead"
    }
  ]
}
```

---

### 2. refactor-patterns.json
**Purpose**: Structural improvement patterns from refactor agent executions

**Schema**:
```json
{
  "patterns": [
    {
      "id": "unique-refactor-pattern-id",
      "name": "Refactoring pattern name",
      "type": "code_quality|performance|maintainability|architecture",
      "description": "What this refactoring accomplishes",
      "before": {
        "symptoms": ["Code smell 1", "Issue 2"],
        "metrics": {
          "complexity": 15,
          "duplication": "30%"
        }
      },
      "after": {
        "improvements": ["Improvement 1", "Benefit 2"],
        "metrics": {
          "complexity": 5,
          "duplication": "0%"
        }
      },
      "implementation": {
        "roslynator_rules": ["RCS1001", "RCS1234"],
        "steps": [
          "Extract method X",
          "Consolidate duplicates",
          "Apply SOLID principle Y"
        ]
      },
      "validation": {
        "healthcheck_required": true,
        "all_6_levels": true
      },
      "success_metrics": {
        "usage_count": 3,
        "success_rate": 1.0
      },
      "examples": [
        {
          "key": "cleanup",
          "git_commit": "xyz789abc123...",
          "files_refactored": 5,
          "lines_reduced": 200
        }
      ],
      "last_updated": "2025-10-10T15:00:00Z",
      "contributed_by": "refactor"
    }
  ]
}
```

---

### 3. validation-patterns.json
**Purpose**: Common validation issues and resolution patterns from healthcheck agent

**Schema**:
```json
{
  "patterns": [
    {
      "id": "unique-validation-pattern-id",
      "name": "Validation issue pattern",
      "category": "contract_mismatch|architectural_drift|configuration|dependency",
      "description": "Common validation issue description",
      "detection": {
        "symptoms": ["Symptom 1", "Indicator 2"],
        "layers_affected": ["UI", "API", "Database"],
        "validation_level": 3
      },
      "resolution": {
        "steps": [
          "Step 1 to resolve",
          "Step 2 to verify"
        ],
        "preventive_measures": [
          "How to avoid this in future"
        ]
      },
      "success_metrics": {
        "occurrences": 2,
        "resolution_rate": 1.0
      },
      "examples": [
        {
          "key": "api-contract",
          "git_commit": "abc123xyz789...",
          "issue": "DTO case mismatch between UI and API",
          "resolution_time_minutes": 15
        }
      ],
      "last_updated": "2025-10-10T14:00:00Z",
      "contributed_by": "healthcheck"
    }
  ]
}
```

---

### 4. integration-patterns.json
**Purpose**: Cross-layer integration patterns (UI ↔ API ↔ Services ↔ Database ↔ SignalR)

**Schema**:
```json
{
  "patterns": [
    {
      "id": "unique-integration-pattern-id",
      "name": "Integration pattern name",
      "layers": ["UI", "API", "Service", "Database", "SignalR"],
      "description": "End-to-end integration workflow",
      "workflow": {
        "ui_layer": {
          "components": ["Component1.razor", "Component2.razor"],
          "events": ["onclick", "onchange"],
          "signalr_methods": ["ReceiveUpdate"]
        },
        "api_layer": {
          "endpoints": ["POST /api/endpoint1", "GET /api/endpoint2"],
          "dtos": ["RequestDto", "ResponseDto"],
          "authorization": ["RequireRole(\"Admin\")"]
        },
        "service_layer": {
          "services": ["ServiceName"],
          "methods": ["CreateAsync", "UpdateAsync"],
          "dependencies": ["IRepository", "IMapper"]
        },
        "database_layer": {
          "tables": ["TableName"],
          "migrations": ["AddTableNameMigration"],
          "queries": ["SELECT ... WHERE ..."]
        },
        "signalr_layer": {
          "hubs": ["HubName"],
          "methods": ["BroadcastUpdate"],
          "groups": ["session-{id}"]
        }
      },
      "configuration": {
        "appsettings": {
          "Section:Key": "value"
        },
        "dependency_injection": [
          "services.AddScoped<IService, Service>()"
        ]
      },
      "testing": {
        "unit_tests": ["ServiceTests.cs"],
        "integration_tests": ["ApiTests.cs"],
        "playwright_tests": ["feature.spec.ts"]
      },
      "success_metrics": {
        "usage_count": 4,
        "success_rate": 1.0
      },
      "examples": [
        {
          "key": "session-management",
          "git_commit": "def456ghi789...",
          "feature": "Real-time session updates with SignalR"
        }
      ],
      "last_updated": "2025-10-10T13:00:00Z",
      "contributed_by": "task"
    }
  ]
}
```

---

### 5. question-patterns.json
**Purpose**: Frequently asked questions and investigation patterns from question agent

**Schema**:
```json
{
  "patterns": [
    {
      "id": "unique-question-pattern-id",
      "question_category": "feature|troubleshooting|styling|configuration|architecture",
      "common_questions": [
        "How does X work?",
        "Why is Y not appearing?",
        "What controls Z styling?"
      ],
      "investigation_workflow": {
        "steps": [
          "1. Check UI layer (razor components)",
          "2. Trace event handlers and JavaScript",
          "3. Verify API endpoints and DTOs",
          "4. Review service layer logic",
          "5. Validate database queries"
        ],
        "files_to_check": [
          "UI/*.razor",
          "Controllers/*.cs",
          "Services/*.cs"
        ]
      },
      "common_answers": {
        "summary": "High-level explanation",
        "details": {
          "ui_layer": "UI implementation details",
          "api_layer": "API endpoint details",
          "service_layer": "Business logic details",
          "database_layer": "Data persistence details"
        },
        "code_references": [
          "File1.cs:45-67",
          "Component.razor:123-145"
        ]
      },
      "gap_patterns": [
        "Missing feature X",
        "Inconsistency in Y"
      ],
      "success_metrics": {
        "question_frequency": 5,
        "answer_accuracy": 0.95
      },
      "last_updated": "2025-10-10T12:00:00Z",
      "contributed_by": "question"
    }
  ]
}
```

---

### 6. analyze-learning-patterns.json
**Purpose**: Meta-patterns identified by analyze-learning agent across all pattern types

**Schema**:
```json
{
  "meta_patterns": [
    {
      "id": "unique-meta-pattern-id",
      "name": "Cross-agent pattern name",
      "description": "Pattern observed across multiple agents",
      "agents_involved": ["task", "refactor", "healthcheck"],
      "trend": "improving|stable|declining",
      "insights": [
        "Insight 1 from cross-agent analysis",
        "Insight 2 from trend analysis"
      ],
      "recommendations": [
        "Recommendation 1 for system improvement",
        "Recommendation 2 for workflow optimization"
      ],
      "evidence": [
        {
          "agent": "task",
          "pattern_id": "task-pattern-123",
          "metric": "success_rate: 1.0"
        },
        {
          "agent": "refactor",
          "pattern_id": "refactor-pattern-456",
          "metric": "complexity_reduction: 60%"
        }
      ],
      "last_updated": "2025-10-10T11:00:00Z",
      "contributed_by": "analyze-learning"
    }
  ],
  "system_health": {
    "overall_success_rate": 0.92,
    "avg_execution_time_seconds": 60,
    "most_common_failures": [
      "Contract mismatch",
      "Missing dependencies"
    ],
    "improvement_areas": [
      "Configuration validation",
      "Cross-browser testing"
    ],
    "last_analysis": "2025-10-10T10:00:00Z"
  }
}
```

---

## Pattern Contribution Workflow

### For All Agents

1. **Query Before Execute** (Mandatory):
   ```
   Read Workspaces/Copilot/learning/{agent}-patterns.json
   Search for relevant patterns matching current task context
   Apply proven approaches from pattern library
   ```

2. **Execute Task**:
   - Follow proven patterns when applicable
   - Document deviations and rationale
   - Track execution metrics (time, success/failure, errors)

3. **Contribute After Success** (Mandatory):
   - Update pattern file with new learnings
   - Increment success metrics for used patterns
   - Add new patterns for novel solutions
   - Document failures as anti-patterns

4. **Update Schema Compliance**:
   - Ensure all fields in schema are populated
   - Use ISO-8601 timestamps for dates
   - Include full git commit SHA hashes
   - Maintain alphabetical sorting by pattern ID

---

## Pattern Usage Examples

### Example 1: Task Agent Using Patterns

```typescript
// Step 1: Query patterns before execution
const patterns = await readJSON('Workspaces/Copilot/learning/task-patterns.json');
const relevantPattern = patterns.patterns.find(p => 
  p.category === 'ui' && p.name.includes('SignalR')
);

// Step 2: Apply pattern
if (relevantPattern) {
  // Follow implementation steps from pattern
  for (const step of relevantPattern.implementation.steps) {
    executeStep(step);
  }
}

// Step 3: After success, update metrics
relevantPattern.success_metrics.usage_count++;
relevantPattern.last_updated = new Date().toISOString();
await writeJSON('Workspaces/Copilot/learning/task-patterns.json', patterns);
```

### Example 2: Refactor Agent Contributing New Pattern

```typescript
// After successful refactor
const newPattern = {
  id: 'extract-duplicate-logic-001',
  name: 'Extract Duplicate Service Logic',
  type: 'code_quality',
  description: 'Consolidate duplicate data access logic across services',
  before: {
    symptoms: ['Duplicate LINQ queries', 'Copy-paste service methods'],
    metrics: { complexity: 12, duplication: '40%' }
  },
  after: {
    improvements: ['Single source of truth', 'Reduced complexity'],
    metrics: { complexity: 5, duplication: '0%' }
  },
  implementation: {
    roslynator_rules: ['RCS1036', 'RCS1175'],
    steps: [
      'Identify duplicate logic patterns',
      'Extract to base service or repository',
      'Update all callers to use extracted method',
      'Run full validation suite'
    ]
  },
  validation: { healthcheck_required: true, all_6_levels: true },
  success_metrics: { usage_count: 1, success_rate: 1.0 },
  examples: [{
    key: 'service-refactor',
    git_commit: getCurrentCommitHash(),
    files_refactored: 3,
    lines_reduced: 150
  }],
  last_updated: new Date().toISOString(),
  contributed_by: 'refactor'
};

// Add to patterns file
const patterns = await readJSON('Workspaces/Copilot/learning/refactor-patterns.json');
patterns.patterns.push(newPattern);
await writeJSON('Workspaces/Copilot/learning/refactor-patterns.json', patterns);
```

---

## Validation Rules

### Schema Compliance
- All required fields must be populated
- Dates must use ISO-8601 format (YYYY-MM-DDTHH:mm:ssZ)
- Git commits must be full SHA hashes (40 characters)
- Success rates must be between 0.0 and 1.0
- Pattern IDs must be unique within their file

### Pattern Quality
- Descriptions must be clear and actionable
- Steps must be specific and ordered
- Examples must include real git commits and keys
- Metrics must be measurable and updated

### File Maintenance
- Patterns sorted alphabetically by ID
- Anti-patterns separated from successful patterns
- Stale patterns (>6 months unused) marked for review
- Broken patterns (success_rate < 0.5) moved to anti-patterns

---

## analyze-learning Agent Responsibilities

1. **Weekly Analysis** (or after 10 completed keys):
   - Read all pattern files
   - Identify cross-agent meta-patterns
   - Calculate system-wide success metrics
   - Generate improvement recommendations
   - Update analyze-learning-patterns.json

2. **Pattern Health Checks**:
   - Identify stale patterns (not used in 6 months)
   - Flag low-success patterns (success_rate < 0.5)
   - Recommend pattern consolidation opportunities
   - Detect missing pattern categories

3. **Knowledge Distribution**:
   - Share successful patterns across agent boundaries
   - Promote high-success patterns (usage_count > 10, success_rate > 0.9)
   - Archive obsolete patterns
   - Generate pattern usage reports

---

## Future Enhancements

- Pattern versioning for backward compatibility
- Pattern dependency graphs (pattern A requires pattern B)
- Automated pattern discovery from successful keys
- Pattern effectiveness scoring (success_rate × usage_count)
- Cross-repository pattern sharing
- Machine learning for pattern recommendation
