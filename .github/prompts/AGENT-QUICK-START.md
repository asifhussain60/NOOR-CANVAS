# Agent System Quick Start Guide

## Overview

The NoorCanvas project uses a three-agent system for multi-phase implementations:

1. **Planning Agent** (`plan.prompt.md`) - Creates comprehensive phased plans
2. **Task Agent** (`task.prompt.md`) - Executes individual phases
3. **Test Generation Agent** (`test-generation.prompt.md`) - Creates automated tests

## Quick Start: Using the Planning Agent

### Basic Invocation

```
@workspace /plan key={your-key} user_request="{your request}"
```

**Example:**
```
@workspace /plan key=feature-user-authentication user_request="Add OAuth2 authentication with Google and Microsoft providers"
```

### What the Planning Agent Does

The enhanced planning agent will:

1. **Analyze your request** - Understands technology stack, dependencies, scope
2. **Create intelligent phases** - Breaks work into 3-7 logical phases
3. **Generate test plans** - Decides test types (E2E, Percy, none) per phase
4. **Create orchestration scripts** - Generates PowerShell test runners automatically
5. **Track progress** - Updates you with silent checklists as phases complete
6. **Validate incrementally** - Detects which phase breaks tests (if any)
7. **Document everything** - Creates implementation summaries and rollback guides

### Output Structure

After running the planning agent, you'll get:

```
.github/prompts.keys/{your-key}/
├── plan.md                    # Main plan with all phases
├── progress-tracker.md        # Live progress tracking
├── orchestration-library.ps1  # Shared test utilities
├── phase-1-test-orchestration.ps1
├── phase-2-test-orchestration.ps1
└── ...
```

## Executing Phases

### Option 1: Let Task Agent Execute (Recommended)

```
@workspace /task key={your-key}
```

The task agent will:
- Read the next phase from `plan.md`
- Execute all implementation tasks
- Run tests automatically
- Detect flakiness (3x runs)
- Compare Percy baselines
- Update progress tracker
- Commit changes with checkpoint
- Ask permission before proceeding to next phase

### Option 2: Manual Execution

1. Read phase requirements from `.github/prompts.keys/{your-key}/plan.md`
2. Implement changes in target files
3. Run orchestration script: `.\Scripts\phase-N-test-orchestration.ps1`
4. Commit: `git commit -m "[{your-key}] Phase N: {title}"`
5. Tag: `git tag checkpoint/{your-key}/$(Get-Date -Format 'yyyyMMdd-HHmmss')`
6. Update progress tracker

## Understanding Test Types

The planning agent automatically decides test strategy:

| Change Type | Test Type | Why |
|-------------|-----------|-----|
| UI Components | Percy + E2E | Visual validation + functionality |
| CSS/Styling | Percy + E2E | Visual validation + responsive behavior |
| API Endpoints | E2E only | No visual changes |
| Database Schema | None | Validated by build/app startup |
| Config Changes | None | Validated by build/app startup |

## Key Features

### 1. Automatic Orchestration Scripts

Each phase gets a PowerShell script that:
- Kills IIS/existing processes (no port conflicts)
- Builds application
- Starts app in background
- Waits for health check (smart polling)
- Runs Playwright tests
- Runs Percy visual tests (if applicable)
- Collects browser logs
- Detects flakiness (runs 3x)
- Cleans up processes
- Reports results

**No more manual "start app, run test, kill process" cycles!**

### 2. Flakiness Detection

Every test runs 3 times automatically:

- **Stable (3/3 pass)**: ✅ Safe to proceed
- **Mostly Stable (2/3 pass)**: ⚠️ Review needed
- **Flaky (1/3 pass)**: ⚠️ Must investigate
- **Failing (0/3 pass)**: ❌ Blocker

### 3. Incremental Breakage Detection

If Phase 5 test fails:
1. System runs Phase 1 test → Pass ✅
2. System runs Phase 2 test → Pass ✅
3. System runs Phase 3 test → Fail ❌
4. **Conclusion**: Phase 3 introduced the breakage

### 4. Percy Baseline Management

Visual regression tests use phase-specific baselines:

```
Percy Baseline: plan-prompt-enhancement-phase-3-ui-changes
```

Not just "phase-3" - includes context about what changed!

### 5. Smart Selector Strategy

Tests automatically use framework-aware selectors:

- **Blazor components**: `#elementId` (reliable, generated)
- **HTML inputs**: `input[name="fieldName"]` (semantic)
- **Last resort**: `data-testid` attributes

### 6. Progress Tracking

As phases complete, you see silent updates:

```markdown
## Progress Tracker

- [x] Phase 1: Database Schema Updates (✅ Build, ✅ Tests, ✅ Commit, ✅ Tag)
- [x] Phase 2: API Endpoint Creation (✅ Build, ✅ Tests, ⚠️ Flaky, ✅ Commit, ✅ Tag)
- [ ] Phase 3: UI Component Development (⏳ In Progress)
```

### 7. Comprehensive Documentation

Every implementation gets:

- **IMPLEMENTATION-SUMMARY.md** - User-facing overview
- **testing-guidelines.md** - Lessons learned, pitfalls, patterns
- **rollback-guide.md** - How to undo each phase safely
- **work-log.md** - Execution history with timing

## Best Practices

### ✅ DO:

1. **Use the planning agent first** - Let it analyze and break down work
2. **Trust the test strategy** - Agent knows when Percy/E2E/none is appropriate
3. **Run phases sequentially** - Dependencies validated automatically
4. **Review flaky tests** - 2/3 or worse = investigate before proceeding
5. **Keep app running for debugging** - Use `-KeepAppRunning` flag on orchestration scripts

### ❌ DON'T:

1. **Skip phases** - Dependency validation will fail
2. **Ignore flakiness warnings** - They compound over time
3. **Modify test files manually** - Use test-generation agent
4. **Rush through approval gates** - They catch real issues
5. **Work on master branch** - Always use development

## Common Scenarios

### Scenario 1: New Feature Implementation

```
@workspace /plan key=feature-dark-mode user_request="Add dark mode theme toggle with persistent user preference"
```

Agent creates:
- Phase 1: Database schema for user preferences
- Phase 2: Theme CSS variables and switching logic
- Phase 3: UI toggle component
- Phase 4: Persistence integration
- Percy tests for Phases 2-3 (visual changes)
- E2E tests for Phases 2-4 (functionality)

### Scenario 2: Bug Fix with Regression Prevention

```
@workspace /plan key=bugfix-session-title-display user_request="Fix session title truncation on mobile devices"
```

Agent creates:
- Phase 1: CSS responsive fix
- Phase 2: Mobile viewport testing
- Percy tests comparing before/after on mobile breakpoints
- E2E tests validating text displays correctly

### Scenario 3: Refactoring with Safety

```
@workspace /plan key=refactor-auth-service user_request="Extract authentication logic into separate service layer"
```

Agent creates:
- Phase 1: Create service interface
- Phase 2: Move logic to service
- Phase 3: Update dependency injection
- Phase 4: Remove old code
- E2E tests for each phase (no visual changes)
- Incremental breakage detection if tests fail

## Rollback Procedures

If something goes wrong:

```powershell
# View available checkpoints
git tag -l "checkpoint/{your-key}/*"

# Rollback to specific checkpoint
git checkout checkpoint/{your-key}/20251020-013000

# Or use rollback guide
cat .github/prompts.keys/{your-key}/rollback-guide.md
```

Each checkpoint includes:
- Complete file state
- All test results
- Build validation
- Percy baselines

## Advanced: Enhancements Available

When creating a plan, the agent can optionally enable:

- **Enhancement A**: Rollback guides (enabled by default)
- **Enhancement B**: Flakiness detection (enabled by default)
- **Enhancement C**: Preview commands for dry-runs
- **Enhancement D**: Automated selector strategy
- **Enhancement E**: Percy baseline management
- **Enhancement F**: Parallel phase execution (use with caution)
- **Enhancement G**: Cross-key dependency tracking

Most users won't need to think about these - they're enabled automatically when beneficial.

## Troubleshooting

### "Agent says phase is incomplete"

Check progress tracker:
```
cat .github/prompts.keys/{your-key}/progress-tracker.md
```

Look for ❌ or ⚠️ indicators showing what failed.

### "Tests are flaky"

Review flakiness report:
```
cat .github/prompts.keys/{your-key}/flakiness-summary.md
```

Common causes:
- Missing waits in Playwright tests
- Health check not polling properly
- Process cleanup issues

### "Percy baseline not found"

Check baseline name format:
```
Expected: {key}-phase-{N}-{description}
Example: feature-dark-mode-phase-2-theme-css
```

Verify in Percy dashboard or test output.

## Reference Files

- **Planning Agent**: `.github/prompts/plan.prompt.md`
- **Task Agent**: `.github/prompts/task.prompt.md`
- **Test Generation Agent**: `.github/prompts/test-generation.prompt.md`
- **Example Implementation**: `.github/prompts.keys/plan-prompt-enhancement/`
- **Testing Lessons Learned**: `.github/prompts.keys/plan-prompt-enhancement/testing-guidelines.md`

## Support

For issues or questions:
1. Review implementation summary in `.github/prompts.keys/plan-prompt-enhancement/IMPLEMENTATION-SUMMARY.md`
2. Check testing guidelines for common pitfalls
3. Examine work-log.md for similar implementations
4. Consult rollback guide if changes need reverting

---

**Last Updated**: October 20, 2025  
**System Version**: Planning Agent v1.0 (Enhanced)  
**Implementation**: plan-prompt-enhancement key (6 phases, 1400+ lines)
