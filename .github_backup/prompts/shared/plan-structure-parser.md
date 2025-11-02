# Plan Structure Parser Algorithm

**Used by:** route.prompt.md (Task 1.5 - Plan Execution Options)  
**Purpose:** Parse plan file structure, extract phases/tasks, identify execution metadata  
**Version:** 1.0.0

---

## Algorithm: ParsePlanStructure

**Input:**
- planFilePath: Absolute path to plan file
- key: The key identifier

**Output:**
- planType: "phased" | "linear" | "unknown"
- phases: Array of phase objects (if phased)
- tasks: Array of task objects
- metadata: Duration, risk levels, dependencies
- executionOptions: Available execution paths

**Process:**

### Step 1: Load Plan File

Read entire plan file content.

### Step 2: Detect Plan Type

**Phased Plan Detection:**
- Contains headers like "Phase 1", "Phase 2", "Phase 3"
- OR contains "### Phase" markdown sections
- OR has execution plan section with phase breakdown

**Linear Plan Detection:**
- Contains numbered tasks without phase grouping
- Has task list without phase sections

**Algorithm:**

```
IF content contains pattern "## Phase \d+" OR "### Phase \d+" THEN
  planType = "phased"
  Extract phase count from headers
ELSE IF content contains pattern "## Task \d+" OR "### Task \d+" THEN
  planType = "linear"
ELSE
  planType = "unknown"
END IF
```

### Step 3: Extract Phases (if phased plan)

For each phase header found:

**Parse Phase Metadata:**
- Phase number (from header)
- Phase name/title (from header text)
- Phase description (paragraph after header)
- Duration (search for "Duration:", "min", "minutes", "hours")
- Risk level (search for "⚡ LOW", "⚠️ MEDIUM", "🔴 HIGH")
- Task count (count task items in phase section)
- Dependencies (search for "Depends on:", "After Phase")

**Phase Object Structure:**
```
{
  number: 1,
  name: "Safe Deletions",
  description: "Remove unused code with minimal risk",
  duration: "30 minutes",
  risk: "LOW",
  tasks: [1, 3, 5, 9, 10],
  dependencies: []
}
```

### Step 4: Extract Tasks

For each task found (within phases or standalone):

**Parse Task Metadata:**
- Task number (from header or list item)
- Task name/title
- Task description
- Risk level indicator
- Estimated lines changed
- Validation criteria

**Task Object Structure:**
```
{
  number: 1,
  name: "Remove Unused Imports",
  description: "Remove @using directives that are never used",
  risk: "LOW",
  linesChanged: "~20",
  phase: 1 (if in phased plan, else null)
}
```

### Step 5: Calculate Totals

**Aggregate Metadata:**
- Total phases (count)
- Total tasks (count)
- Total duration (sum all phase/task durations)
- Overall risk (highest risk level across all phases)
- Total lines changed (sum all task line estimates)

### Step 6: Generate Execution Options

Based on plan type, generate available execution paths:

**For Phased Plans:**
```
options = [
  { id: "A", label: "Execute Phase 1 Only", target: phase[0] },
  { id: "B", label: "Execute Phase 2 Only", target: phase[1] },
  { id: "C", label: "Execute Phase 3 Only", target: phase[2] },
  { id: "D", label: "Execute All Phases Chained", target: "all", autoChain: true },
  { id: "E", label: "Execute Specific Task", target: "task" },
  { id: "F", label: "Review Plan First", target: "review" },
  { id: "G", label: "Cancel", target: "cancel" }
]
```

**For Linear Plans:**
```
options = [
  { id: "A", label: "Execute All Tasks Sequentially", target: "all" },
  { id: "B", label: "Execute Specific Task", target: "task" },
  { id: "C", label: "Review Plan First", target: "review" },
  { id: "D", label: "Cancel", target: "cancel" }
]
```

---

## Algorithm: FormatExecutionOptions

**Input:**
- planStructure: Output from ParsePlanStructure
- key: The key identifier

**Output:**
- Formatted markdown string for user display

**Process:**

### Step 1: Build Header Section

```
## 🎯 Plan Execution Options

**Key:** `{key}`  
**Plan:** `{planFilePath}`  
**Type:** {planType} ({phaseCount} phases)  
**Total Tasks:** {taskCount}  
**Estimated Duration:** {totalDuration}
```

### Step 2: Build Phase/Task Summary

**For Phased Plans:**

For each phase:
```
**Phase {N}: {phaseName}** ({duration}, {riskIcon} {risk})
- Task {N}: {taskName}
- Task {N}: {taskName}
...
```

**For Linear Plans:**

```
**Tasks:**
1. {taskName} ({risk})
2. {taskName} ({risk})
...
```

### Step 3: Build Options Section

```
**Options:**

**A.** {option A description}  
**B.** {option B description}  
...

**Reply:** A, B, C, D, E, F, or G
```

### Step 4: Return Formatted String

Return complete markdown string for display.

---

## Helper Functions

### ExtractDuration(text)

**Input:** Text containing duration
**Output:** Standardized duration string

**Patterns to match:**
- "30 minutes" → "30 min"
- "1 hour" → "1h"
- "2 hours 30 minutes" → "2h 30m"
- "45 min" → "45 min"

### ExtractRisk(text)

**Input:** Text containing risk indicators
**Output:** "LOW" | "MEDIUM" | "HIGH"

**Patterns to match:**
- "⚡ LOW RISK" → "LOW"
- "⚠️ MEDIUM RISK" → "MEDIUM"
- "🔴 HIGH RISK" → "HIGH"
- Default → "MEDIUM"

### ExtractTasks(phaseContent)

**Input:** Phase section content
**Output:** Array of task numbers

**Process:**
- Find all "Task N:" patterns
- Extract task numbers
- Return sorted array

---

## Usage Example

**In route.prompt.md (Task 1.5):**

```
Load plan file: .github/key-data-streams/hcp-refactor/cleanup-plan.md

planStructure = ParsePlanStructure(planFilePath, "hcp-refactor")

IF planStructure.planType == "phased" THEN
  optionsMarkdown = FormatExecutionOptions(planStructure, "hcp-refactor")
  Display optionsMarkdown to user
  HALT and wait for user choice
END IF

User selects option "A" (Phase 1 Only)

Route to task.prompt.md with parameters:
  key = "hcp-refactor"
  phase = 1
  tasks = planStructure.phases[0].tasks
  auto-chain = false
```

---

## Edge Cases

### Multiple Plan Files

If multiple plan files exist (cleanup-plan.md, plan.md, {key}.plan.md):
- Prioritize: cleanup-plan.md > {key}.plan.md > plan.md
- Use first found in priority order

### Malformed Plan

If plan cannot be parsed:
- Fall back to linear execution
- Treat entire plan as single task
- Warn user: "Plan structure unclear, executing as single unit"

### No Phases or Tasks Found

If no phases/tasks detected:
- planType = "unknown"
- Offer: Review Plan (A) or Cancel (B)
- Do not offer execution until structure clarified

---

## Validation

### Post-Parse Validation

After parsing, validate:
- At least 1 phase OR 1 task found
- All task numbers are unique
- All phase numbers are sequential (1, 2, 3, not 1, 3, 5)
- Duration values are parseable
- Risk levels are valid (LOW/MEDIUM/HIGH)

### Error Handling

If validation fails:
- Log parsing error
- Fall back to "unknown" plan type
- Offer manual review only

---

**Version:** 1.0.0  
**Created:** 2025-10-31  
**Used by:** route.prompt.md (Task 1.5)

