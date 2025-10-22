# Verbosity Reduction - Holistic Fix

## Problem
Handoff and other prompts were producing 200+ line responses when user requested concise bullets.

## Solution
Created hierarchical conciseness mandate enforced across ALL prompts.

## Files Modified

### New: `.github/prompts/shared/CONCISE-MANDATE.md`
**Hard limits:**
- MAX 15 bullets total per response
- MAX 1 line per bullet
- NO code/pseudocode/JSON in chat
- NO nested lists
- NO paragraphs

**Structure:**
```
🧠 Analysis (≤5 bullets)
📌 Summary (≤10 bullets)
📊 Final (4 lines)
```

### Updated: `.github/prompts/shared/output-style-mandate.md`
- Reduced from 100+ lines to ~40 lines
- Hard 15-bullet limit
- Streamlined BEFORE/AFTER templates
- Removed verbose examples

### Updated: `.github/prompts/handoff.prompt.md`
- Reduced from 224 lines to ~50 lines
- Removed verbose explanations
- Condensed routing logic
- Simplified output format
- References CONCISE-MANDATE.md

### Updated: `.github/prompts/create-plan.prompt.md`
- Reduced header from 100 lines to ~30 lines
- Removed repetitive warnings
- Condensed protocol rules
- References CONCISE-MANDATE.md

### Updated: `.github/prompts/task.prompt.md`
- Reduced header from 100 lines to ~25 lines
- Removed verbose parameter descriptions
- References task-parameters-reference.md for details
- References CONCISE-MANDATE.md

## Enforcement Mechanism

**Self-check before responding:**
1. Count bullets
2. If > 15 → doing it wrong
3. Move details to plan files
4. Keep chat concise

## Benefits
1. **User experience:** Responses fit on one screen
2. **Clarity:** Essential info only, no clutter
3. **Consistency:** All prompts follow same pattern
4. **Efficiency:** Less token usage, faster responses

## Migration Pattern
All prompts now follow:
```
Short header (purpose, rules)
  ↓
Output format (15 bullets max)
  ↓
Reference detailed docs for specifics
```

## Validation
- handoff.prompt.md: 224 → ~50 lines (78% reduction)
- create-plan.prompt.md: First 100 lines → ~30 lines (70% reduction)
- task.prompt.md: First 100 lines → ~25 lines (75% reduction)
- output-style-mandate.md: ~120 → ~40 lines (67% reduction)
