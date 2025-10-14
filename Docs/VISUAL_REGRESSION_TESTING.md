# Visual Regression Testing with Percy

## Overview
This branch integrates **Percy** (visual regression testing) and **Stylelint** (CSS quality) into the NOOR CANVAS testing infrastructure.

## Why Percy + Stylelint?

### Current Challenges
- ❌ Orange question cards rendering incorrectly (user-reported visual bug)
- ❌ No automated detection of CSS regressions
- ❌ Manual visual QA required for styling changes
- ❌ CSS conflicts not caught until browser testing

### Solutions
- ✅ **Percy**: Pixel-perfect visual diffs at multiple viewport sizes
- ✅ **Stylelint**: Catch CSS conflicts and bad patterns before they reach the browser
- ✅ **Low Overhead**: Integrates seamlessly with existing Playwright tests
- ✅ **CI/CD Ready**: Both tools work with GitHub Actions

---

## 📅 Implementation Timeline

### ✅ Week 1: Percy Setup (Current)
**Status**: COMPLETED

**Deliverables**:
- [x] Percy CLI and Playwright integration installed
- [x] `.percy.yml` configuration created
- [x] Percy-enabled visual test created (`canvas-questions-orange-card-visual.spec.ts`)
- [x] npm scripts added (`test:percy`, `test:percy:headed`, `test:percy:visual`)
- [x] Stylelint installed and configured

**Test Coverage**:
- Orange question card (3 viewports: mobile, tablet, desktop)
- Green question card (owner view)
- Vote state changes (before/after vote)

---

### 🔜 Week 2: Stylelint Integration
**Status**: READY FOR EXECUTION

**Tasks**:
1. Run initial Stylelint scan: `npm run lint:css`
2. Fix critical violations (duplicate properties, named colors)
3. Update `.stylelintrc.json` with Blazor-specific rules
4. Add pre-commit hook to enforce CSS quality
5. Document CSS naming conventions

**Expected Violations**: 20-30 issues in SessionCanvas.razor

---

### 🔜 This Month: Expand Percy Coverage
**Status**: PLANNED

**Target Components**:
- Question cards (green + orange) ✅ Week 1
- Vote badges and counters ✅ Week 1
- Participant list items
- Modal dialogs
- Session waiting screen
- Transcript rendering

**Test Files to Create**:
```
Tests/UI/visual-regression/
├── question-cards.spec.ts ✅ (Week 1)
├── participant-list-visual.spec.ts
├── modals-visual.spec.ts
└── session-layouts-visual.spec.ts
```

---

### 🔜 Next Month: CSS Architecture Refactor
**Status**: PLANNED

**Objectives**:
- Extract inline styles to CSS files
- Implement CSS custom properties (variables)
- Centralize color definitions
- Improve Stylelint enforcement

**Before**:
```css
/* Inline in SessionCanvas.razor */
.question-item-style-sienna {
  border-color: #A0522D; /* Repeated in 3 places */
  background-color: #FAEBD7; /* Repeated in 5 places */
}
```

**After**:
```css
/* wwwroot/css/canvas-theme.css */
:root {
  --color-sienna: #A0522D;
  --color-antique-white: #FAEBD7;
  --border-accent-width: 6px;
}

.question-item-style-sienna {
  border-color: var(--color-sienna);
  background-color: var(--color-antique-white);
  border-left-width: var(--border-accent-width);
}
```

---

## 🚀 Getting Started

### Prerequisites
1. **Percy Account** (free tier):
   - Sign up at https://percy.io
   - Create project: "NOOR-CANVAS"
   - Get `PERCY_TOKEN` from Settings

2. **Environment Setup**:
   ```bash
   # Set Percy token (PowerShell)
   $env:PERCY_TOKEN='your_percy_token_here'
   
   # Or add to .env file (create if doesn't exist)
   echo "PERCY_TOKEN=your_percy_token_here" >> .env
   ```

### Running Percy Tests

**Option 1: Single Visual Test (Recommended for testing)**
```bash
npm run test:percy:visual
```

**Option 2: All Tests with Percy**
```bash
npm run test:percy
```

**Option 3: Headed Mode (See browser)**
```bash
npm run test:percy:headed
```

### First Run: Creating Baselines
```bash
# This creates baseline snapshots in Percy
npm run test:percy:visual

# Expected output:
# ✓ Orange Question Card - User B View (375px, 768px, 1280px)
# ✓ Green Question Card - User A View (375px, 768px, 1280px)
# ✓ Orange Card - Before Vote (1280px)
# ✓ Orange Card - After Vote (1280px)
#
# [percy] Percy has started!
# [percy] Created build #1: https://percy.io/your-org/NOOR-CANVAS/builds/123
# [percy] Snapshot taken: Orange Question Card - User B View
# [percy] Snapshot taken: Green Question Card - User A View
# [percy] Build complete!
```

### Subsequent Runs: Visual Diffs
```bash
# Make a CSS change, then run:
npm run test:percy:visual

# Percy will:
# 1. Capture new snapshots
# 2. Compare against baseline
# 3. Highlight visual differences
# 4. Report at: https://percy.io/your-org/NOOR-CANVAS/builds/124
```

---

## 🎨 Stylelint Usage

### Run CSS Linter
```bash
# Check for violations
npm run lint:css

# Auto-fix what's possible
npm run lint:css:fix
```

### Expected Initial Output
```
SessionCanvas.razor
  245:5   ✖  Duplicate property "border-left-width"        declaration-block-no-duplicate-properties
  312:5   ✖  Unexpected named color "sienna"               color-named
  420:10  ✖  Unexpected duplicate selector ".canvas-item"  no-duplicate-selectors

✖ 23 problems (23 errors, 0 warnings)
  5 errors potentially fixable with --fix
```

### Fixing Violations

**Example 1: Named Colors**
```css
/* Before */
.canvas-question-item {
  background-color: antiquewhite; /* ✖ Named color */
}

/* After */
.canvas-question-item {
  background-color: #FAEBD7; /* ✓ Hex code */
}
```

**Example 2: Duplicate Properties**
```css
/* Before */
.canvas-question-item {
  border-color: #A0522D;
  border-color: #006400; /* ✖ Duplicate */
}

/* After */
.canvas-question-item {
  border-color: #A0522D; /* ✓ Single declaration */
}
```

---

## 📊 Percy Dashboard Features

### What Percy Provides
1. **Visual Diffs**: Pixel-perfect comparison with baseline
2. **Multi-Viewport**: Automatic snapshots at 375px, 768px, 1280px
3. **Review Workflow**: Approve/reject changes before merge
4. **GitHub Integration**: PR comments with visual diffs
5. **Build History**: Track visual changes over time

### Example Percy Workflow
```
1. Developer makes CSS change to orange card
2. Commits to branch: feature/visual-regression-testing
3. CI runs: npm run test:percy
4. Percy detects 3px border shift in orange card
5. Percy posts comment on PR: "Visual changes detected"
6. Reviewer sees diff in Percy dashboard
7. Reviewer approves or requests changes
8. Merge when Percy build passes
```

---

## 📁 File Structure

```
NOOR CANVAS/
├── .percy.yml                           # Percy configuration
├── .stylelintrc.json                    # Stylelint rules
├── package.json                         # npm scripts added
├── Tests/UI/
│   ├── canvas-questions-orange-card-visual.spec.ts  # Percy test ✅
│   └── visual-regression/               # Future tests (planned)
│       ├── participant-list-visual.spec.ts
│       ├── modals-visual.spec.ts
│       └── session-layouts-visual.spec.ts
└── Docs/
    └── VISUAL_REGRESSION_TESTING.md     # This file
```

---

## 🔧 Configuration Details

### Percy Configuration (`.percy.yml`)
```yaml
version: 2
snapshot:
  widths:
    - 375   # Mobile (iPhone SE)
    - 768   # Tablet (iPad)
    - 1280  # Desktop (standard)
  min-height: 1024
  percy-css: |
    /* Hide dynamic elements */
    [data-percy-hide] { display: none !important; }
static:
  - wwwroot/css
  - wwwroot/lib
discovery:
  network-idle-timeout: 750
```

### Stylelint Configuration (`.stylelintrc.json`)
```json
{
  "extends": "stylelint-config-standard",
  "customSyntax": "postcss-html",
  "rules": {
    "selector-class-pattern": "^canvas-[a-z]+(-[a-z]+)*$",
    "color-hex-length": "long",
    "declaration-block-no-duplicate-properties": true,
    "no-duplicate-selectors": true,
    "color-named": "never",
    "length-zero-no-unit": true
  }
}
```

---

## 🧪 Testing Strategy

### Visual Regression Tests (Percy)
**Purpose**: Catch visual changes before they reach production

**When to Use**:
- ✅ CSS styling changes
- ✅ Layout modifications
- ✅ Component refactoring
- ✅ Responsive design updates
- ✅ Multi-browser compatibility

**When NOT to Use**:
- ❌ Backend logic changes (use E2E functional tests)
- ❌ API contract changes (use integration tests)
- ❌ Database migrations (use unit tests)

### CSS Quality Tests (Stylelint)
**Purpose**: Prevent CSS conflicts and bad patterns

**When to Use**:
- ✅ Every commit (pre-commit hook)
- ✅ CI/CD pipeline
- ✅ Before merging PRs

---

## 🎯 Success Metrics

### Week 1 (Current)
- [x] Percy integration complete
- [x] 1 visual test created (orange + green cards)
- [x] 8 Percy snapshots captured (4 scenarios × 2 card types)
- [x] Stylelint configured

### Week 2 (Next)
- [ ] Stylelint violations: 0 errors on main branch
- [ ] Pre-commit hook blocks CSS violations
- [ ] Team understands CSS naming conventions

### This Month
- [ ] 10+ visual snapshots across all UI components
- [ ] Percy integrated into CI/CD
- [ ] Zero visual regressions reach production

### Next Month
- [ ] CSS custom properties implemented
- [ ] Centralized color management
- [ ] 50% reduction in CSS-related bugs

---

## 🚨 Troubleshooting

### Percy Issues

**Issue**: `Error: Missing Percy token`
```bash
# Solution: Set environment variable
$env:PERCY_TOKEN='your_token_here'
```

**Issue**: `Percy build timed out`
```bash
# Solution: Increase timeout in .percy.yml
discovery:
  network-idle-timeout: 1500  # Increase from 750
```

**Issue**: `Snapshot differences detected`
```bash
# Solution: Review in Percy dashboard
# 1. Go to https://percy.io/your-org/NOOR-CANVAS
# 2. Click on latest build
# 3. Review visual diffs
# 4. Approve or reject changes
```

### Stylelint Issues

**Issue**: `Cannot find module 'postcss-html'`
```bash
# Solution: Reinstall dependencies
npm install --save-dev postcss-html
```

**Issue**: `Too many violations to fix manually`
```bash
# Solution: Use auto-fix
npm run lint:css:fix

# Then fix remaining issues manually
npm run lint:css
```

---

## 📚 References

### Percy Documentation
- Official Docs: https://www.percy.io/docs
- Playwright Integration: https://www.percy.io/docs/integrations/playwright
- Dashboard: https://percy.io

### Stylelint Documentation
- Official Docs: https://stylelint.io
- Rules: https://stylelint.io/user-guide/rules
- Config: https://stylelint.io/user-guide/configure

### NOOR CANVAS Docs
- Playwright Quick Ref: `.github/instructions/Links/PlaywrightQuickRef.md`
- Infrastructure Quick Ref: `.github/instructions/Links/InfrastructureQuickRef.md`
- Architecture: `.github/instructions/Links/Architecture.md`

---

## 🤝 Contributing

### Adding New Visual Tests
1. Create test file in `Tests/UI/` or `Tests/UI/visual-regression/`
2. Import Percy: `import percySnapshot from '@percy/playwright';`
3. Capture snapshots: `await percySnapshot(page, 'Snapshot Name', { widths: [375, 768, 1280] });`
4. Run test: `npm run test:percy:visual`
5. Review results in Percy dashboard

### CSS Changes Workflow
1. Make CSS changes in `.razor` or `.css` files
2. Run Stylelint: `npm run lint:css:fix`
3. Fix remaining violations manually
4. Run Percy tests: `npm run test:percy:visual`
5. Review visual diffs in Percy dashboard
6. Commit changes if Percy approves

---

## 📝 Notes

- **Percy Free Tier**: 5,000 snapshots/month (sufficient for this project)
- **Baseline Management**: First run creates baseline, subsequent runs compare
- **Viewport Strategy**: 375px (mobile), 768px (tablet), 1280px (desktop)
- **CI/CD Integration**: Planned for Week 2 (GitHub Actions)
- **Team Training**: Schedule Percy dashboard review session

---

**Created**: 2025-10-14  
**Branch**: `feature/visual-regression-testing`  
**Status**: Week 1 Complete ✅  
**Next Steps**: Week 2 - Stylelint violation fixes
