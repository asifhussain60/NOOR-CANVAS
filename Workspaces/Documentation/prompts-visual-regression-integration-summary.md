# Prompts and Instructions: Visual Regression Integration Summary

**Date**: 2025-01-28  
**Branch**: feature/visual-regression-testing  
**Purpose**: Document updates to prompts and instructions for visual regression testing guidance  
**Integration**: Percy (visual), Stylelint (CSS quality), Playwright (functional)

---

## Overview

This document summarizes the updates made to `.github/prompts` and `.github/instructions` to integrate visual regression testing guidance. The changes ensure agents understand when to use:

1. **Playwright (Functional E2E Tests)** - User workflows, API contracts, SignalR synchronization
2. **Percy (Visual Regression Tests)** - CSS/styling, responsive design, visual consistency
3. **Stylelint (CSS Quality Checks)** - Pre-commit CSS validation, naming conventions, duplicate detection

---

## Files Updated

### 1. `.github/instructions/Links/PlaywrightQuickRef.md`

**Version**: Updated from 1.0.0 to 2.0.0  
**Lines Changed**: ~150 lines added (decision matrix, Percy template, quickref commands)

#### Changes Made:

**A. Header Section (Lines 1-40)**
- Updated version to 2.0.0
- Added "Testing Strategy Overview" section explaining three complementary approaches:
  - **Functional E2E Tests (Playwright)**: User flows, API validation, multi-user scenarios
  - **Visual Regression Tests (Percy + Playwright)**: CSS, layout, responsive design
  - **CSS Quality Tests (Stylelint)**: Pre-commit validation, naming conventions
- Added clear "When", "Tools", and "Example" for each approach

**B. Decision Matrix Section (After "Test Location Rules")**
- Added comprehensive decision matrix table mapping change types to testing tools
- Included 8 common scenarios (User Workflow, Visual Changes, CSS Quality, etc.)
- Added decision flowchart showing test type selection logic
- Included quick reference commands for each testing approach:
  ```bash
  # Functional E2E Tests
  npx playwright test Tests/UI/feature-functional.spec.ts --headed
  
  # Visual Regression Tests
  npm run test:percy:visual -- Tests/UI/feature-visual.spec.ts
  
  # CSS Quality Check
  npm run lint:css -- SPA/NoorCanvas/Components/**/*.razor
  ```

**C. Percy Visual Test Template Section**
- Added complete Percy test template with:
  - Import statements (`percySnapshot` from `@percy/playwright`)
  - Multi-viewport snapshot configuration (375px, 768px, 1280px)
  - Dynamic element hiding with `percyCSS`
  - State change testing pattern
  - Theme variation testing
- Included execution commands specific to Percy tests
- Added Percy snapshot best practices:
  - Naming conventions for clarity
  - Viewport strategy (mobile/tablet/desktop)
  - Dynamic content handling
  - Test organization patterns
  - Baseline management workflow

**Impact**: This update ensures agents understand the full testing ecosystem and choose the right tool for each change type.

---

### 2. `.github/prompts/test-generation.prompt.md`

**Lines Changed**: ~90 lines added (test type selection, Percy template, best practices)

#### Changes Made:

**A. Test Type Selection Section (After "Core Patterns")**
- Added "Test Type Selection (See PlaywrightQuickRef.md Decision Matrix)" header
- Documented when to generate Functional E2E Tests:
  - User workflows (login, navigation, form submission)
  - API contract validation
  - SignalR real-time updates
  - Multi-user synchronization
  - Accessibility features
  - Component behavior (without visual changes)
- Documented when to generate Visual Regression Tests:
  - CSS/styling changes (colors, layouts, spacing)
  - Component visual consistency
  - Responsive design (mobile/tablet/desktop)
  - Theme changes
  - Layout refactoring
  - Animation/transition verification
- Documented when to recommend CSS Quality Checks:
  - New CSS files or Blazor Razor styles
  - Theme development
  - CSS refactoring
  - Component library development
  - Pre-commit validation

**B. File Naming Convention Update**
- Updated pattern to include test type: `{feature}-{test-type}.spec.ts`
- Added examples:
  - `debug-panel-islamic-questions-functional.spec.ts` (Playwright E2E)
  - `canvas-questions-orange-card-visual.spec.ts` (Percy visual)
  - `question-enter-key-submit-functional.spec.ts` (Playwright E2E)
  - `session-canvas-responsive-visual.spec.ts` (Percy multi-viewport)

**C. Percy Visual Regression Test Template Section**
- Added complete Percy test template (130+ lines) including:
  - Documentation header explaining purpose, prerequisites, configuration
  - Multi-viewport snapshot pattern
  - State change testing (initial → active → secondary)
  - Theme variation testing (orange → green)
  - Dynamic element hiding with `percyCSS`
  - Wait strategies for animations/transitions
- Included Percy test execution commands:
  - `npm run test:percy:headed` - Single test with browser visible
  - `npm run test:percy` - All visual tests headless
  - `npx playwright test` - Debug mode without Percy
- Added Percy snapshot best practices:
  1. **Naming Convention**: Descriptive names indicating component and state
  2. **Viewport Strategy**: Always test mobile (375px), tablet (768px), desktop (1280px)
  3. **Dynamic Content Handling**: Use `percyCSS` to hide timestamps, avatars, random IDs
  4. **Test Organization**: One file per component, group related snapshots
  5. **Baseline Management**: Approve in Percy dashboard, investigate ALL diffs

**Impact**: Agents can now generate Percy visual regression tests with the same quality and patterns as functional Playwright tests.

---

### 3. `.github/prompts/task.prompt.md`

**Lines Changed**: ~120 lines updated (test generation mandate section)

#### Changes Made:

**A. Automated Test Generation Mandate Section (Lines 242-320)**
- Renamed "Generate Tests When" to "Test Type Decision (See PlaywrightQuickRef.md Decision Matrix)"
- Split test generation criteria into three categories:

**Generate Functional E2E Tests (Playwright) When:**
- New user interaction flow (buttons, forms, navigation)
- API endpoint creation/modification
- SignalR real-time feature changes
- Bug fixes affecting user-visible behavior
- Multi-user/multi-browser scenarios
- Authentication/authorization flow changes
- Accessibility features (ARIA, keyboard navigation)

**Generate Visual Regression Tests (Percy + Playwright) When:**
- CSS/styling changes (colors, layouts, spacing, themes)
- Component visual consistency (cards, buttons, panels)
- Responsive design changes (mobile/tablet/desktop)
- Theme changes (dark mode, Blazor themes)
- Layout refactoring (grid systems, flexbox)
- Animation/transition implementation
- Visual bug fixes (alignment, rendering issues)

**Recommend CSS Quality Checks (Stylelint) When:**
- New CSS files or Blazor Razor component styles
- Theme development (color schemes, design tokens)
- CSS refactoring (consolidating styles, removing duplicates)
- Component library development

**B. Test Generation Requirements**
- Split requirements into "For Functional E2E Tests" and "For Visual Regression Tests"
- Added Percy-specific parameters:
  - `testType`: "functional" or "visual"
  - `viewports`: Array of viewport widths [375, 768, 1280]
- Added Percy configuration references:
  - `.percy.yml` - Visual snapshot configuration
  - `VISUAL_REGRESSION_TESTING.md` - Percy setup and workflows
  - `PlaywrightQuickRef.md` - Percy test template and patterns
- Updated naming conventions to include test type suffix

**C. Test Generation Workflow**
- Updated workflow diagram to show test type branching:
  ```
  User Request → Evaluate Change Type
      ├─ Functional/Behavior → test-generation.prompt.md (testType: functional)
      ├─ Visual/CSS → test-generation.prompt.md (testType: visual)
      └─ CSS Quality → Document Stylelint command
  ```

**D. Example Triggers**
- Updated examples to show test type selection:
  - "Add delete button" → Generate FUNCTIONAL test
  - "Fix SignalR broadcast" → Generate FUNCTIONAL test
  - "Change orange card color" → Generate VISUAL test + run Stylelint
  - "Fix button alignment on mobile" → Generate VISUAL test (responsive)
  - "Refactor question card (no visual change)" → Generate FUNCTIONAL test only
  - "Add dark mode theme" → Generate VISUAL test + run Stylelint

**Impact**: Agents now automatically select the correct test type based on the nature of the change, ensuring comprehensive coverage across functional, visual, and CSS quality dimensions.

---

### 4. `.github/prompts/refactor.prompt.md`

**Lines Changed**: ~15 lines updated (phase validation section)

#### Changes Made:

**A. Phase Validation Section (Line 416)**
- Added Percy visual regression check to validation pipeline
- Updated validation steps:
  - Run all tests (unit, integration, **Playwright functional, Percy visual if UI changes**)
  - **Visual Regression Check**: If refactoring UI components, run Percy visual tests to ensure pixel-perfect consistency
- Updated phase commit message to include visual test results:
  ```
  Tests: All passing (functional + visual if applicable)
  ```

**Impact**: Ensures UI component refactoring doesn't introduce unintended visual changes, catching subtle CSS regressions that functional tests miss.

---

## Key Concepts Introduced

### 1. Three-Tier Testing Strategy

**Tier 1: Functional E2E Tests (Playwright)**
- **Purpose**: Validate user workflows, API contracts, SignalR synchronization
- **When**: Behavioral changes, new features, bug fixes affecting functionality
- **Output**: Pass/fail based on DOM assertions, API responses, user interactions
- **Example**: "User joins session and submits question"

**Tier 2: Visual Regression Tests (Percy + Playwright)**
- **Purpose**: Pixel-perfect comparison of UI across viewports
- **When**: CSS changes, responsive design, theme updates, visual bug fixes
- **Output**: Visual diffs highlighting pixel-level changes
- **Example**: "Orange question card renders correctly at 375px, 768px, 1280px"

**Tier 3: CSS Quality Checks (Stylelint)**
- **Purpose**: Pre-commit validation of CSS code quality
- **When**: New CSS files, theme development, CSS refactoring
- **Output**: Lint errors for naming violations, duplicates, color format issues
- **Example**: "Ensure all classes use canvas-* naming convention"

### 2. Decision Matrix Workflow

Agents now follow this decision tree when a change is requested:

```
Did you change...
│
├─ User flows/interactions? → Playwright Functional Test
│  └─ Examples: Login, navigation, form submission, voting
│
├─ Visual appearance/CSS? → Percy Visual Test + Stylelint
│  └─ Examples: Button colors, card layouts, spacing, themes
│
├─ API/SignalR contract? → Playwright Functional Test
│  └─ Examples: New endpoints, hub methods, response format
│
├─ Component internals (no UI change)? → Playwright Functional Test
│  └─ Examples: Refactoring, performance optimization
│
└─ Multi-viewport responsive design? → Percy Multi-viewport Test
   └─ Examples: Mobile layout, tablet breakpoints, grid systems
```

### 3. Naming Conventions

**Functional E2E Tests:**
- Pattern: `{feature}-functional.spec.ts`
- Examples:
  - `debug-panel-islamic-questions-functional.spec.ts`
  - `session-canvas-loading-functional.spec.ts`

**Visual Regression Tests:**
- Pattern: `{feature}-visual.spec.ts`
- Examples:
  - `canvas-questions-orange-card-visual.spec.ts`
  - `session-canvas-responsive-visual.spec.ts`

**Mixed Tests (Functional + Visual):**
- Create two separate test files (one functional, one visual)
- Example:
  - `question-voting-functional.spec.ts` (tests voting logic)
  - `question-voting-visual.spec.ts` (tests green card appearance)

### 4. Percy Integration Points

**Configuration Files:**
- `.percy.yml` - Viewport widths, min-height, network timeouts, percy-css
- `.stylelintrc.json` - CSS quality rules with Blazor Razor support
- `package.json` - npm scripts (test:percy, test:percy:headed, lint:css)

**Documentation:**
- `Docs/VISUAL_REGRESSION_TESTING.md` - Setup guide, workflows, troubleshooting
- `Workspaces/Documentation/visual-regression-integration-summary.md` - Implementation summary
- `setup-percy.ps1` - PowerShell setup script for team onboarding

**Test Location:**
- `Tests/UI/*-visual.spec.ts` - Production visual regression tests
- `Workspaces/TEMP/*-visual.spec.ts` - Temporary/experimental visual tests

---

## Agent Workflow Changes

### Before (Functional Tests Only)

```
User: "Fix orange card rendering"
Agent: 
  1. Analyzes issue
  2. Makes CSS changes
  3. Generates Playwright functional test (validates card exists in DOM)
  4. Builds and commits
  
Problem: Functional test passes even if color, spacing, or layout is wrong
```

### After (Functional + Visual + CSS)

```
User: "Fix orange card rendering"
Agent:
  1. Analyzes issue
  2. Identifies change type: Visual (CSS styling change)
  3. Consults PlaywrightQuickRef.md decision matrix
  4. Determines test approach:
     - Percy Visual Test (pixel-perfect comparison)
     - Stylelint (CSS quality check)
  5. Makes CSS changes
  6. Runs Stylelint: npm run lint:css -- SPA/NoorCanvas/Components/Questions.razor
  7. Generates Percy visual test: canvas-questions-orange-card-visual.spec.ts
  8. Runs Percy test: npm run test:percy:visual
  9. Reviews visual diffs in Percy dashboard
  10. Builds and commits
  
Result: Catches visual regressions that functional tests miss
```

---

## Testing Command Quick Reference

### Functional E2E Tests (Playwright)

```bash
# Run all functional tests
npx playwright test Tests/UI/*-functional.spec.ts

# Run specific functional test (headed)
npx playwright test Tests/UI/session-canvas-loading-functional.spec.ts --headed

# Debug functional test
npx playwright test Tests/UI/question-voting-functional.spec.ts --debug

# Generate Playwright report
npx playwright show-report
```

### Visual Regression Tests (Percy)

```bash
# Run all visual tests (headless)
npm run test:percy

# Run specific visual test (headed)
npm run test:percy:headed -- Tests/UI/canvas-questions-orange-card-visual.spec.ts

# Run visual test without Percy (for debugging)
npx playwright test Tests/UI/feature-visual.spec.ts --headed

# Percy dashboard
# https://percy.io/your-org/noor-canvas
```

### CSS Quality Checks (Stylelint)

```bash
# Lint all CSS/Razor files
npm run lint:css

# Lint specific file pattern
npm run lint:css -- SPA/NoorCanvas/Components/**/*.razor

# Auto-fix CSS issues
npm run lint:css:fix

# Lint specific file
npm run lint:css -- SPA/NoorCanvas/Components/Questions.razor
```

### Full Test Suite (All 3 Approaches)

```bash
# Run everything
npx playwright test && npm run test:percy && npm run lint:css
```

---

## Integration with Existing Workflows

### 1. task.prompt.md Integration

**When user requests a change:**
1. Agent reads task parameters (key, debug-level, tasks, etc.)
2. Agent analyzes change type (functional, visual, CSS quality)
3. Agent consults PlaywrightQuickRef.md decision matrix
4. Agent determines test approach:
   - Functional change → Invoke test-generation.prompt.md (testType: functional)
   - Visual change → Invoke test-generation.prompt.md (testType: visual)
   - CSS quality → Document Stylelint command
5. Agent implements change
6. Agent generates/runs appropriate tests
7. Agent validates (build + tests + visual diffs)
8. Agent documents in key data stream

### 2. test-generation.prompt.md Integration

**When invoked by task.prompt.md:**
1. Receives parameters: feature, scenario, testType, endpoints, multiUser, viewports
2. Reads canonical references:
   - PlaywrightConfig.MD (configuration)
   - PlaywrightTestPaths.MD (Session 212 tokens)
   - PlaywrightQuickRef.md (decision matrix, templates)
   - .percy.yml (Percy configuration, if testType=visual)
3. Selects template:
   - testType=functional → Standard Playwright template
   - testType=visual → Percy visual regression template
4. Generates test file in Tests/UI/ (production) or Workspaces/TEMP/ (experimental)
5. Documents test path in key data stream
6. Returns to task.prompt.md for execution

### 3. refactor.prompt.md Integration

**When refactoring UI components:**
1. Agent creates checkpoint commit
2. Agent presents refactor plan to user
3. User approves plan
4. Agent executes refactor in phases
5. **Phase Validation** (NEW):
   - Run all tests (unit, integration, Playwright functional)
   - **If UI components changed**: Run Percy visual tests
   - **Requirement**: Functional tests pass AND visual diffs approved
6. Agent commits phase with updated message:
   ```
   Tests: All passing (functional + visual if applicable)
   ```
7. If visual diffs detected, agent pauses for user review in Percy dashboard
8. User approves or rejects visual changes
9. Agent proceeds to next phase or rollbacks

---

## Success Metrics

### Agent Behavior Validation

**Before Integration:**
- ❌ Agents generated functional tests for visual bugs (ineffective)
- ❌ CSS changes had no automated validation
- ❌ Visual regressions only caught manually
- ❌ No guidance on when to use different testing tools
- ❌ Refactoring could introduce subtle visual bugs

**After Integration:**
- ✅ Agents select correct test type based on change nature
- ✅ Visual changes automatically trigger Percy tests
- ✅ CSS quality validated pre-commit with Stylelint
- ✅ Decision matrix provides clear tool selection guidance
- ✅ Refactoring includes visual regression validation

### Test Coverage Validation

**Coverage Matrix:**
| Change Type | Functional Test | Visual Test | CSS Quality | Status |
|------------|----------------|-------------|-------------|--------|
| User workflow | ✅ Required | ❌ Not needed | ❌ Not needed | Documented |
| API change | ✅ Required | ❌ Not needed | ❌ Not needed | Documented |
| CSS styling | ⚠️ Optional | ✅ Required | ✅ Required | Documented |
| Responsive design | ⚠️ Optional | ✅ Required (multi-viewport) | ✅ Required | Documented |
| Component refactor (no UI) | ✅ Required | ❌ Not needed | ❌ Not needed | Documented |
| Component refactor (UI) | ✅ Required | ✅ Required | ⚠️ Optional | Documented |
| Theme changes | ⚠️ Optional | ✅ Required | ✅ Required | Documented |
| Accessibility | ✅ Required | ⚠️ Optional | ❌ Not needed | Documented |

---

## Rollout Plan

### Phase 1: Documentation and Prompts (CURRENT)
- ✅ Update PlaywrightQuickRef.md with decision matrix and Percy template
- ✅ Update test-generation.prompt.md with Percy test generation
- ✅ Update task.prompt.md with test type selection
- ✅ Update refactor.prompt.md with visual regression validation
- ✅ Create prompts-visual-regression-integration-summary.md

### Phase 2: Agent Training (NEXT)
- ⏳ Test agents with visual regression scenarios
- ⏳ Validate decision matrix accuracy in real tasks
- ⏳ Refine prompts based on agent behavior
- ⏳ Document edge cases and special scenarios

### Phase 3: Team Onboarding (WEEK 2)
- ⏳ Share VISUAL_REGRESSION_TESTING.md with team
- ⏳ Run setup-percy.ps1 on all dev machines
- ⏳ Configure Percy tokens (PERCY_TOKEN env variable)
- ⏳ Demonstrate Percy dashboard workflows
- ⏳ Train on visual diff approval process

### Phase 4: CI/CD Integration (WEEK 3)
- ⏳ Add Percy to GitHub Actions workflow
- ⏳ Configure Percy baseline management
- ⏳ Set up Percy PR comments for visual diffs
- ⏳ Integrate Stylelint into pre-commit hooks
- ⏳ Document CI/CD Percy workflows

### Phase 5: Monitoring and Optimization (WEEK 4)
- ⏳ Track visual regression detection rate
- ⏳ Monitor Percy snapshot count and storage
- ⏳ Optimize viewport configurations
- ⏳ Refine percy-css for dynamic elements
- ⏳ Update learning patterns with successful cases

---

## Troubleshooting Guide

### Common Scenarios

**Scenario 1: Agent Generates Wrong Test Type**
- **Symptom**: Agent creates functional test for CSS change
- **Diagnosis**: Check if change type is clearly identified in user request
- **Solution**: Be explicit in request: "Fix orange card STYLING" (triggers visual test)
- **Prevention**: Agents should analyze file types (.razor, .css, .scss) to infer change type

**Scenario 2: Percy Test Fails with Dynamic Elements**
- **Symptom**: Percy detects diffs in timestamps, user avatars, etc.
- **Diagnosis**: Dynamic elements not hidden in `percyCSS`
- **Solution**: Add elements to percy-css in test file or .percy.yml
- **Example**:
  ```typescript
  await percySnapshot(page, 'Component Name', {
    percyCSS: `
      .timestamp { display: none; }
      .user-avatar { display: none; }
    `
  });
  ```

**Scenario 3: Stylelint Reports False Positives**
- **Symptom**: Stylelint flags valid Blazor Razor syntax
- **Diagnosis**: Stylelint not configured for Blazor
- **Solution**: Verify postcss-html is installed and .stylelintrc.json includes Razor support
- **Check**:
  ```bash
  npm list postcss-html  # Should show installed version
  ```

**Scenario 4: Percy Dashboard Not Showing Snapshots**
- **Symptom**: Test runs successfully but Percy dashboard empty
- **Diagnosis**: PERCY_TOKEN not configured or invalid
- **Solution**: Configure token: `$env:PERCY_TOKEN="your-token"`
- **Verify**:
  ```bash
  npx percy --version  # Should not error
  npx percy exec -- echo "test"  # Should show token status
  ```

**Scenario 5: Visual Test Passes but UI Looks Wrong**
- **Symptom**: Percy approves but visual bug still exists
- **Diagnosis**: Baseline snapshot was approved with existing bug
- **Solution**: Re-baseline Percy snapshots:
  1. Fix the bug
  2. Run visual test: `npm run test:percy:visual`
  3. Review diffs in Percy dashboard (should show fix)
  4. Approve new baseline in Percy dashboard
  5. Future tests compare against corrected baseline

---

## References

### Updated Files
1. `.github/instructions/Links/PlaywrightQuickRef.md` (v2.0.0)
2. `.github/prompts/test-generation.prompt.md`
3. `.github/prompts/task.prompt.md`
4. `.github/prompts/refactor.prompt.md`

### Supporting Documentation
1. `Docs/VISUAL_REGRESSION_TESTING.md` (Percy setup guide)
2. `Workspaces/Documentation/visual-regression-integration-summary.md` (Implementation summary)
3. `.percy.yml` (Percy configuration)
4. `.stylelintrc.json` (Stylelint configuration)
5. `setup-percy.ps1` (PowerShell setup script)

### External Resources
1. Percy Documentation: https://docs.percy.io/
2. Stylelint Documentation: https://stylelint.io/
3. Playwright Documentation: https://playwright.dev/

---

## Conclusion

The integration of visual regression testing guidance into prompts and instructions provides agents with:

1. **Clear Decision Framework**: Decision matrix and flowchart for test type selection
2. **Percy Test Generation**: Complete templates and patterns for visual regression tests
3. **CSS Quality Integration**: Stylelint validation for pre-commit CSS checks
4. **Three-Tier Testing**: Functional (Playwright), Visual (Percy), CSS Quality (Stylelint)
5. **Comprehensive Examples**: Real-world scenarios and command references

This ensures agents automatically generate the right test type for each change, catching visual regressions that functional tests miss while maintaining comprehensive coverage across all testing dimensions.

**Next Steps:**
1. Test agent behavior with visual regression scenarios
2. Validate decision matrix accuracy in real tasks
3. Onboard team with setup-percy.ps1 and VISUAL_REGRESSION_TESTING.md
4. Integrate Percy into CI/CD pipeline
5. Monitor and optimize visual regression detection

**Git Branch**: feature/visual-regression-testing  
**Ready for**: Merge to main after agent validation testing
