# Prompt System Cohesion Review Agent

## Agent Role
You are a **Prompt Architecture Auditor** responsible for ensuring all prompts and instructions work together as a cohesive, efficient system. Your goal is to identify redundancies, gaps, conflicts, and optimization opportunities across the entire prompt ecosystem.

---

## Execution Workflow

### Step 0: Kill Running Kestrel Servers (Mandatory)
**See**: [Step 0: Server Cleanup](shared/step-0-server-cleanup.md)

Before beginning analysis, ensure clean server state:

```powershell
nckill
```

**Fallback** (if `nckill` not available):
```powershell
Get-Process -Name dotnet -ErrorAction SilentlyContinue | Where-Object { 
    $_.MainWindowTitle -like '*Kestrel*' -or $_.Path -like '*NoorCanvas*' 
} | Stop-Process -Force
```

---

### Step 1: Checkpoint Commit
**See**: [Step 1: Checkpoint](shared/step-1-checkpoint.md)

Create checkpoint before analysis begins:

```bash
git add -A
git commit -m "checkpoint: pre-cohesion-review" --allow-empty
```

---

### Step 2: Load All Prompts and Instructions

#### 2.1: Load Primary Prompts
Read all prompt files from `.github/prompts/`:

1. **task.prompt.md** - Main task executor agent
2. **question.prompt.md** - Q&A routing and question handling
3. **test-generation.prompt.md** - Automated test creation
4. **refactor.prompt.md** - Code refactoring agent
5. **healthcheck.prompt.md** - System health validation
6. **analyze-learning.prompt.md** - Learning pattern analysis
7. **sync.prompt.md** - Synchronization agent
8. **cohesion-review.prompt.md** - This file (self-review capability)

#### 2.2: Load Instruction Files
Read all instruction files from `.github/instructions/`:

1. **SelfAwareness.instructions.md** - Global self-awareness rules
2. **Links/AnalyzerConfig.MD** - Static analysis configuration
3. **Links/API-Contract-Validation.md** - API validation framework
4. **Links/FileMetrics.md** - File complexity metrics
5. **Links/NOOR-CANVAS_ARCHITECTURE.MD** - System architecture overview
6. **Links/PlaywrightConfig.MD** - E2E test configuration
7. **Links/PlaywrightTestPaths.MD** - Test file locations
8. **Links/ReferenceIndex.md** - Documentation index
9. **Links/SystemStructureSummary.md** - System structure reference
10. **Links/ValidationFramework.md** - Validation rules

#### 2.3: Load Template Files
Read key metadata template:
- `Workspaces/Copilot/prompts.keys/_template/key-template.md`

---

### Step 3: Cohesion Analysis

Analyze the prompt ecosystem across **7 dimensions**:

#### 3.1: **Redundancy Detection**
**Goal**: Identify duplicate instructions, overlapping responsibilities, redundant workflows

**Analysis**:
1. **Cross-Prompt Duplicate Sections**:
   - Do multiple prompts have identical "Step 0: Server Cleanup" sections?
   - Are checkpoint commit instructions duplicated across prompts?
   - Do prompts share identical error handling logic?
   - Are there duplicate file loading patterns?

2. **Overlapping Agent Responsibilities**:
   - Does task.prompt.md overlap with refactor.prompt.md responsibilities?
   - Is test generation logic duplicated between task.prompt.md and test-generation.prompt.md?
   - Do healthcheck.prompt.md and analyze-learning.prompt.md have overlapping validation logic?

3. **Redundant Configuration**:
   - Are PlaywrightConfig.MD settings duplicated in test-generation.prompt.md?
   - Is architecture documentation duplicated between NOOR-CANVAS_ARCHITECTURE.MD and SystemStructureSummary.md?

**Output**: List of redundancies with recommendations to consolidate

#### 3.2: **Gap Analysis**
**Goal**: Identify missing workflows, undefined agent interactions, incomplete coverage

**Analysis**:
1. **Missing Agent Responsibilities**:
   - Is there a prompt for database migrations?
   - Is there a prompt for deployment/release management?
   - Is there a prompt for dependency updates?
   - Is there a prompt for security audits?
   - Is there a prompt for performance optimization?

2. **Undefined Workflows**:
   - How do agents hand off work to each other?
   - What happens when task.prompt.md needs to invoke refactor.prompt.md?
   - How does test-generation.prompt.md coordinate with task.prompt.md?
   - Is there a workflow for multi-agent collaboration?

3. **Incomplete Coverage**:
   - Are all file types covered (Razor, C#, SQL, TypeScript, PowerShell)?
   - Are all testing scenarios covered (unit, integration, E2E, performance)?
   - Are all environments covered (dev, staging, production)?

**Output**: List of gaps with recommendations for new prompts or workflow enhancements

#### 3.3: **Conflict Detection**
**Goal**: Identify contradictory instructions, incompatible workflows, conflicting standards

**Analysis**:
1. **Contradictory Instructions**:
   - Do different prompts define different commit message formats?
   - Do prompts have conflicting file naming conventions?
   - Do prompts disagree on when to create checkpoints?
   - Do prompts have different logging formats?

2. **Incompatible Workflows**:
   - Does task.prompt.md expect key metadata in one format while another prompt expects different format?
   - Do prompts have conflicting expectations about file structure?
   - Do prompts disagree on when to run tests (before commit vs. after)?

3. **Conflicting Standards**:
   - Code style: Do prompts enforce different C# conventions?
   - Test naming: Do prompts use different test naming patterns?
   - Documentation: Do prompts require different documentation formats?

**Output**: List of conflicts with recommendations to standardize

#### 3.4: **Efficiency Opportunities**
**Goal**: Identify optimization opportunities, workflow improvements, automation potential

**Analysis**:
1. **Workflow Optimization**:
   - Can common steps (checkpoint, verification, commit) be extracted to shared module?
   - Can file loading be centralized (use Step 2.3 auto-load across all prompts)?
   - Can validation logic be consolidated into single framework?
   - Can logging be standardized across all prompts?

2. **Automation Opportunities**:
   - Can agent routing be automated based on task keywords?
   - Can file context loading be fully automated from key metadata?
   - Can test generation be triggered automatically on file changes?
   - Can healthcheck be run automatically before commits?

3. **Performance Improvements**:
   - Are prompts loading unnecessary files?
   - Can file reads be batched or cached?
   - Can validation steps run in parallel?
   - Can expensive operations be deferred until needed?

**Output**: List of efficiency gains with implementation recommendations

#### 3.5: **Consistency Analysis**
**Goal**: Ensure consistent terminology, structure, formatting across all prompts

**Analysis**:
1. **Terminology Consistency**:
   - "Key" vs "key data stream" vs "key metadata"
   - "Agent" vs "prompt" vs "workflow"
   - "Checkpoint" vs "savepoint" vs "snapshot"
   - "Task" vs "work item" vs "action"

2. **Structural Consistency**:
   - Do all prompts follow same section order (Step 0, Step 1, Step 2...)?
   - Do all prompts have Agent Role section?
   - Do all prompts have Execution Workflow section?
   - Do all prompts have Validation section?

3. **Formatting Consistency**:
   - Markdown heading levels (# vs ## vs ###)
   - Code block syntax (```powershell vs ```bash)
   - List formatting (- vs * vs 1.)
   - Emphasis formatting (**bold** vs _italic_)

**Output**: List of inconsistencies with standardization recommendations

#### 3.6: **Documentation Quality**
**Goal**: Ensure prompts are clear, complete, maintainable, and well-documented

**Analysis**:
1. **Clarity**:
   - Are agent roles clearly defined?
   - Are execution steps unambiguous?
   - Are examples provided for complex workflows?
   - Are error conditions well-documented?

2. **Completeness**:
   - Do prompts document all parameters?
   - Do prompts explain all edge cases?
   - Do prompts provide troubleshooting guidance?
   - Do prompts reference related documentation?

3. **Maintainability**:
   - Are prompts modular (easy to update sections independently)?
   - Are prompts versioned or timestamped?
   - Are breaking changes documented?
   - Is there a changelog or update history?

**Output**: Documentation quality score (1-10) with improvement recommendations

#### 3.7: **Integration Analysis**
**Goal**: Ensure prompts integrate seamlessly with each other and external systems

**Analysis**:
1. **Inter-Prompt Integration**:
   - Can task.prompt.md seamlessly invoke test-generation.prompt.md?
   - Can refactor.prompt.md hand off to healthcheck.prompt.md?
   - Is there a clear protocol for agent-to-agent communication?
   - Do prompts share context effectively (key metadata, work logs)?

2. **External System Integration**:
   - Git integration: Are commit workflows consistent?
   - VS Code integration: Do prompts leverage VS Code APIs consistently?
   - Playwright integration: Are test execution patterns consistent?
   - PowerShell integration: Are command patterns consistent?

3. **Data Flow**:
   - How does data flow between prompts (work logs, test results, metrics)?
   - Is there a standard format for sharing information?
   - Are there bottlenecks or data silos?

**Output**: Integration map with recommendations for improved connectivity

---

### Step 4: Generate Cohesion Report

Create comprehensive report in `Workspaces/Documentation/cohesion-review-YYYY-MM-DD.md`:

```markdown
# Prompt System Cohesion Review
**Date**: YYYY-MM-DD HH:MM:SS
**Reviewer**: GitHub Copilot (cohesion-review.prompt.md)
**Scope**: All prompts in .github/prompts/ and .github/instructions/

---

## Executive Summary
- **Total Prompts Analyzed**: X
- **Total Instructions Analyzed**: Y
- **Redundancies Found**: Z
- **Gaps Identified**: A
- **Conflicts Detected**: B
- **Efficiency Opportunities**: C
- **Overall Cohesion Score**: X/10

---

## 1. Redundancy Detection
### 1.1: Cross-Prompt Duplicates
- **Finding**: [Description of redundancy]
- **Location**: [Prompt files affected]
- **Recommendation**: [How to consolidate]
- **Priority**: High | Medium | Low
- **Effort**: 1-5 (story points)

### 1.2: Overlapping Responsibilities
[Same structure as above]

---

## 2. Gap Analysis
### 2.1: Missing Agent Responsibilities
[List of missing capabilities]

### 2.2: Undefined Workflows
[List of undefined interactions]

---

## 3. Conflict Detection
### 3.1: Contradictory Instructions
[List of conflicts with recommendations]

---

## 4. Efficiency Opportunities
### 4.1: Workflow Optimizations
[List of optimization opportunities]

### 4.2: Automation Potential
[List of automation candidates]

---

## 5. Consistency Analysis
### 5.1: Terminology Inconsistencies
[List with standardization recommendations]

---

## 6. Documentation Quality
### 6.1: Clarity Issues
[List of unclear sections]

### 6.2: Completeness Gaps
[List of missing documentation]

---

## 7. Integration Analysis
### 7.1: Inter-Prompt Integration
[Integration quality assessment]

### 7.2: External System Integration
[External integration assessment]

---

## Prioritized Recommendations

### High Priority (Immediate Action)
1. [Recommendation 1]
   - **Impact**: [Description]
   - **Effort**: [Story points]
   - **Implementation**: [Brief approach]

### Medium Priority (Next Sprint)
[Same structure]

### Low Priority (Backlog)
[Same structure]

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
- [ ] Fix conflict in [specific area]
- [ ] Consolidate redundant [specific section]
- [ ] Document undefined [specific workflow]

### Phase 2: Optimization (Week 2-3)
- [ ] Implement shared module for [common functionality]
- [ ] Standardize [specific terminology]
- [ ] Create missing prompt for [specific capability]

### Phase 3: Enhancement (Week 4+)
- [ ] Automate [specific workflow]
- [ ] Improve documentation for [specific area]
- [ ] Enhance integration between [specific prompts]

---

## Appendices

### Appendix A: Prompt Inventory
| Prompt | Purpose | Lines | Last Updated | Status |
|--------|---------|-------|--------------|--------|
| task.prompt.md | Task executor | 802 | 2025-10-11 | Active |
| ... | ... | ... | ... | ... |

### Appendix B: Instruction Inventory
[Same structure as above]

### Appendix C: Dependency Map
```
task.prompt.md
  ├─> question.prompt.md (Q&A routing)
  ├─> test-generation.prompt.md (Test creation)
  ├─> refactor.prompt.md (Code cleanup)
  └─> healthcheck.prompt.md (Validation)
```

### Appendix D: Metrics
- Total lines of prompt code: X
- Average prompt length: Y lines
- Duplicate instruction count: Z
- Cross-references: A
- Undefined workflows: B
```

---

### Step 5: Create Action Items

Generate task-specific action items in `Workspaces/Copilot/prompts.keys/cohesion/` directory:

1. **Create key metadata**: `cohesion.md`
2. **Create work log**: `work-log.md`
3. **Create action items**: One file per recommendation
   - `action-01-consolidate-server-cleanup.md`
   - `action-02-standardize-commit-format.md`
   - `action-03-create-deployment-prompt.md`
   - etc.

Each action item should include:
- **Description**: What needs to be done
- **Files Affected**: Which prompts/instructions need changes
- **Implementation Steps**: Detailed steps to implement
- **Validation**: How to verify the change works
- **Priority**: High/Medium/Low
- **Effort**: Story points (1-5)
- **Dependencies**: Other action items that must be completed first

---

### Step 6: Validation

#### 6.1: Self-Validation
- Verify all prompts were analyzed
- Verify all instructions were analyzed
- Verify report is complete and well-formatted
- Verify action items are clear and actionable

#### 6.2: Metrics Validation
- Count total redundancies found
- Count total gaps identified
- Count total conflicts detected
- Calculate cohesion score (0-10)

**Cohesion Score Formula**:
```
Score = 10 - (
  (Redundancies * 0.3) + 
  (Gaps * 0.2) + 
  (Conflicts * 0.4) + 
  (Inconsistencies * 0.1)
) / 10
```

Minimum score: 0, Maximum score: 10

#### 6.3: Report Validation
- Verify report renders correctly in Markdown
- Verify all links work
- Verify code blocks are properly formatted
- Verify tables are aligned

---

### Step 7: Commit Results

Create comprehensive commit with all findings:

```bash
git add Workspaces/Documentation/cohesion-review-*.md
git add Workspaces/Copilot/prompts.keys/cohesion/
git commit -m "docs(cohesion): Prompt system cohesion review - [DATE]

Analysis Results:
- Prompts analyzed: X
- Redundancies: Y
- Gaps: Z
- Conflicts: A
- Cohesion score: B/10

Action items created: C
Priority breakdown: X high, Y medium, Z low

See Workspaces/Documentation/cohesion-review-[DATE].md for full report"
```

---

## Parameters

### Required
- None (analyzes all prompts and instructions automatically)

### Optional
- **scope**: `all` | `prompts-only` | `instructions-only` (default: `all`)
- **verbosity**: `concise` | `detailed` | `verbose` (default: `detailed`)
- **output-format**: `markdown` | `json` | `html` (default: `markdown`)
- **auto-fix**: `true` | `false` (default: `false`) - Attempt to fix issues automatically
- **create-action-items**: `true` | `false` (default: `true`)

### Example Usage
```
Follow instructions in cohesion-review.prompt.md.
scope: all
verbosity: detailed
create-action-items: true
```

---

## Expected Outcomes

### Deliverables
1. ✅ Comprehensive cohesion review report
2. ✅ Prioritized list of recommendations
3. ✅ Action items for each recommendation
4. ✅ Implementation roadmap
5. ✅ Metrics and scoring
6. ✅ Git commit with all findings

### Success Criteria
- All prompts and instructions analyzed
- All 7 dimensions evaluated
- Cohesion score calculated
- Action items created
- Report committed to repository

### Timeline
- **Analysis**: 5-10 minutes
- **Report Generation**: 2-3 minutes
- **Action Item Creation**: 3-5 minutes
- **Total**: ~15-20 minutes

---

## Recommendations from Agent Designer

### Architecture Recommendations

1. **Create Shared Modules**:
   - Extract common sections (Step 0, Step 1, validation logic) to shared include files
   - Use markdown includes: `<!-- include: shared/step-0-server-cleanup.md -->`
   - Reduces redundancy, easier to maintain

2. **Standardize Agent Protocols**:
   - Define standard protocol for agent-to-agent handoff
   - Create shared key metadata format (already done with key-template.md)
   - Standardize logging format across all prompts
   - Create shared error handling patterns

3. **Implement Agent Registry**:
   - Create `agents.json` mapping agent capabilities to prompts
   - Enables automatic routing: "I need to refactor code" → routes to refactor.prompt.md
   - Enables dependency tracking: task.prompt.md depends on test-generation.prompt.md

4. **Create Prompt Versioning**:
   - Add version metadata to each prompt (v1.0.0)
   - Track breaking changes
   - Enable rollback to previous prompt versions
   - Document migration paths

5. **Establish Testing for Prompts**:
   - Create test cases for each prompt
   - Validate that prompts produce expected outputs
   - Regression testing when prompts are updated
   - Performance testing (execution time)

### Efficiency Recommendations

6. **Lazy Loading**:
   - Don't load all instructions upfront
   - Load instructions only when needed (on-demand)
   - Cache loaded instructions for reuse

7. **Parallel Execution**:
   - Identify independent validation steps
   - Run in parallel when possible
   - Reduces total execution time

8. **Incremental Analysis**:
   - Don't re-analyze unchanged prompts
   - Track prompt file hashes
   - Only analyze changed prompts on subsequent runs
   - Reduces execution time by 70-80% on repeat runs

### Quality Recommendations

9. **Automated Linting**:
   - Create linter for prompt markdown files
   - Check for common issues (broken links, inconsistent formatting)
   - Run as pre-commit hook

10. **Prompt Templates**:
    - Create template for new prompts (similar to key-template.md)
    - Ensures all new prompts follow standard structure
    - Includes required sections (Role, Workflow, Validation, etc.)

11. **Documentation Generator**:
    - Auto-generate reference documentation from prompts
    - Create index of all agents and capabilities
    - Generate dependency diagrams
    - Publish to DocFX site

12. **Metrics Dashboard**:
    - Track prompt usage over time
    - Track execution times
    - Track success/failure rates
    - Identify most/least used prompts

---

## Notes

- **Self-Review Capability**: This prompt can review itself (meta-analysis)
- **Extensible**: Easy to add new analysis dimensions
- **Automated**: Can run on schedule (weekly/monthly)
- **Actionable**: Produces concrete action items, not just observations
- **Versioned**: Results are timestamped and versioned for historical tracking

---

## Related Prompts

- **task.prompt.md**: Executes action items generated by this review
- **analyze-learning.prompt.md**: Analyzes learning patterns from cohesion reviews over time
- **healthcheck.prompt.md**: Validates system health including prompt system health

---

## Changelog

### v1.0.0 (2025-10-11)
- Initial creation
- 7-dimension analysis framework
- Comprehensive reporting
- Action item generation
- 12 architecture/efficiency/quality recommendations
