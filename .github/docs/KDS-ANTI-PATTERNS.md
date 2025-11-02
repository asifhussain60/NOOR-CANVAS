# KDS Anti-Patterns (v2.0.0 - v2.1.0)

**Purpose:** Document anti-patterns from old KDS design to prevent recurrence  
**Source:** Git history analysis (7-day review, November 2025)  
**Version:** 1.0  
**Status:** Active Reference

---

## 🚨 CRITICAL ANTI-PATTERNS

### 1. EMBEDDED COMMAND BLOAT
**Severity:** 🔴 CRITICAL  
**Impact:** Prompt files became bloated, hard to maintain, duplicated across files

**Evidence:**
```
Git commits showing extraction effort:
- refactor(kds/healthcheck): Extract 10 PowerShell validation scripts
- refactor(kds/cohesion): Extract 9 bash command examples  
- refactor(kds/plan): Extract 4 PowerShell commands
- refactor(kds/route): Extract 5 command examples
- refactor(kds/test-prep): Extract 2 examples
- refactor(kds/drift+ask): Extract 5 commands

TOTAL: 35+ commands extracted from prompts
```

**What Went Wrong:**
- Command examples embedded directly in `route.prompt.md`, `plan.prompt.md`, `todo.prompt.md`
- Instead of extracting to reusable knowledge base
- Caused bloat: prompts grew from 300 lines → 800+ lines
- Duplication: Same PowerShell snippets in 3+ prompts

**Prevention (v4.2.0):**
- ✅ Rule #14: Publishing Mechanism (knowledge/ folder)
- ✅ Rule #16 Step 2: Auto-publish patterns (no manual embedding)
- ✅ Guardrail: **NO examples allowed in .prompt.md files** (build fails if detected)

---

### 2. GOVERNANCE INSTABILITY
**Severity:** 🔴 CRITICAL  
**Impact:** Multiple redesigns within same version, wasted effort

**Evidence:**
```
Git commits showing instability:
- kds(governance): Comprehensive governance overhaul (v2.0.0) [appears 2x]
- enhance router governance compliance (14% → 100%) [appears 2x]

Router compliance: 14% → 50% → 75% → 100% (4 phases)
```

**What Went Wrong:**
- Initial governance design had **only 14% compliance**
- Required 4 separate phases to reach 100%
- "Comprehensive overhaul" committed twice (same version)
- Indicates poor upfront architecture

**Prevention (v4.2.0):**
- ✅ Rule #6: Governance Review Required (before major changes)
- ✅ Rule #16 Step 5: KDS Verification (detect issues early)
- ✅ Guardrail: **Governance changes require v2+** (avoid breaking changes)

---

### 3. RULE PROLIFERATION
**Severity:** 🟠 HIGH  
**Impact:** 20 rules by v2.1.0 without consolidation, governance bloat

**Evidence:**
```
Rule count progression:
v1.0.0:  6 rules (initial)
v2.0.0: 16 rules (+10 rules)
v2.1.0: 20 rules (+4 more: Rules #18, #19, #20, #21)

Git commits:
- feat(kds): Add Rule #20 (KDTR Enforcement) - v2.1.0
- feat(kds): Rule #21 - KDS Folder Purity enforcement
```

**What Went Wrong:**
- Rules added incrementally without consolidation
- No removal of redundant rules (only additions)
- Reached 20 rules (exceeds 15-rule soft limit)
- Rules #18-21 could have been consolidated into fewer rules

**Prevention (v4.2.0):**
- ✅ Rule #16 Step 5: Performance check (max 20 rules, soft limit 15)
- ✅ v4.0 consolidation: 20 rules → 13 rules (then grew to 16)
- ✅ Guardrail: **Trigger consolidation at 18 rules** (before hitting 20 limit)

---

### 4. ARCHITECTURAL EXEMPTIONS
**Severity:** 🟠 HIGH  
**Impact:** Core prompts requiring special cases = poor architecture

**Evidence:**
```
Git commits showing exemptions:
- [DEBUG-WORKITEM] ROUTER EXEMPTION - Remove Step -1 from ask.prompt.md
- Router had Step -1 blocks violating consistency
```

**What Went Wrong:**
- `route.prompt.md` required exemptions from governance rules
- "Step -1" consolidation done AFTER multiple prompts violated it
- Exemptions create inconsistency (router behaves differently)

**Prevention (v4.2.0):**
- ✅ Rule #1: Dual Interface (no exemptions, consistent structure)
- ✅ Rule #16 Step 5: Consistency check (detect violations)
- ✅ Guardrail: **Zero exemptions allowed** (fix architecture instead)

---

### 5. SYSTEM CHURN (Build-Then-Discard)
**Severity:** 🟡 MEDIUM  
**Impact:** Wasted effort building systems that get redesigned

**Evidence:**
```
Git commits showing churn:
- feat(kdtr): Create KDS Test Registry System structure
- feat(kdtr): Integrate KDTR enforcement into KDS prompts
- [Later] KDTR redesigned in v4.0 (knowledge/ folder replaced it)
```

**What Went Wrong:**
- KDTR (KDS Test Registry) built with schema, integration, rules
- Later replaced by simpler `knowledge/` folder approach in v4.0
- Wasted effort: 3+ commits to build KDTR, then discarded

**Prevention (v4.2.0):**
- ✅ Rule #7: Document First (validate design before implementation)
- ✅ Rule #2: Live Design Document (iterate on design, not code)
- ✅ Guardrail: **Prototype with docs first** (avoid premature implementation)

---

### 6. MULTI-PHASE COMPLIANCE
**Severity:** 🟡 MEDIUM  
**Impact:** Poor initial design requiring 9 phases to fix

**Evidence:**
```
Git commit:
- feat(kds): Achieve 100% Rule #1 compliance - P0-9 complete

Phases: P0, P1, P2, P3, P4, P5, P6, P7, P8, P9 (10 phases total)
```

**What Went Wrong:**
- Rule #1 (Dual Interface) compliance took **9 phases** to complete
- Indicates prompts weren't designed with Rule #1 in mind
- Reactive fixing instead of proactive design

**Prevention (v4.2.0):**
- ✅ Rule #1: Dual Interface enforced from start (not retrofitted)
- ✅ Rule #16 Step 1: Build validation (catch issues early)
- ✅ Guardrail: **Design WITH rules, not retrofit rules later**

---

### 7. STEP -1 DUPLICATION
**Severity:** 🟠 HIGH  
**Impact:** Governance logic duplicated across 4+ prompts (DRY violation)

**Evidence:**
```
Git commit:
- Reduced Step -1 blocks in 4 prompts (task, todo, test-generation, plan)

Files with duplicated Step -1:
- .github/prompts/task.prompt.md
- .github/prompts/todo.prompt.md
- .github/prompts/test-generation.prompt.md
- .github/prompts/plan.prompt.md
```

**What Went Wrong:**
- Same "Step -1" governance block copy-pasted into 4 prompts
- Changes to Step -1 required updating 4 files (error-prone)
- Violates DRY (Don't Repeat Yourself) principle

**Prevention (v4.2.0):**
- ✅ Rule #1: Dual Interface (extract to `prompts/shared/`)
- ✅ Rule #16 Step 5: Redundancy check (detect duplicates)
- ✅ Guardrail: **Auto-extract duplicates to shared/** (>3 lines duplicated)

---

### 8. OVERCOMPLICATED OUTPUT
**Severity:** 🟢 LOW  
**Impact:** User-facing output too complex, required simplification

**Evidence:**
```
Git commit:
- OUTPUT FORMAT SIMPLIFIED - Single Next Command format
```

**What Went Wrong:**
- Initial output format was too complex for users
- Required post-hoc simplification
- Likely included technical details in user prompts

**Prevention (v4.2.0):**
- ✅ Rule #1: Dual Interface (technical details ONLY in internal agents)
- ✅ Rule #8: User-Friendly Output (templates for users)
- ✅ Guardrail: **User prompts exclude validation logic** (move to internal agents)

---

## 📊 QUANTIFIED IMPACT

| **Metric** | **Old KDS (v2.1.0)** | **New KDS (v4.2.0)** | **Improvement** |
|------------|----------------------|----------------------|-----------------|
| **Rule Count** | 20 | 16 | -20% (consolidated) |
| **Embedded Commands** | 35+ in prompts | 0 (all in knowledge/) | 100% reduction |
| **Governance Overhauls** | 2+ within v2.0.0 | 0 | Stable design |
| **Router Compliance** | 14% initially | 100% from start | 86% improvement |
| **Compliance Phases** | 9 phases (P0-P9) | 1 phase | -89% effort |
| **Step -1 Duplication** | 4 prompts | 0 (extracted to shared/) | 100% reduction |
| **Exemptions** | 1 (router) | 0 | Zero special cases |
| **System Redesigns** | 1 (KDTR) | 0 | No wasted effort |

---

## ✅ LESSONS LEARNED

### 1. **Extract, Don't Embed**
- ❌ Old: Commands/examples in prompts
- ✅ New: Publish to `knowledge/` folder (Rule #14)

### 2. **Design Upfront, Not Retrofit**
- ❌ Old: 14% compliance → retrofit to 100%
- ✅ New: 100% compliance from design phase (Rule #7)

### 3. **Consolidate Rules Proactively**
- ❌ Old: Add rules without consolidation (reached 20)
- ✅ New: Consolidate at 18 rules (before 20 limit)

### 4. **Zero Exemptions Policy**
- ❌ Old: Router required exemptions
- ✅ New: Fix architecture, not add exemptions

### 5. **Prototype With Docs**
- ❌ Old: Build KDTR, then discard
- ✅ New: Document First (Rule #7), validate before code

### 6. **Auto-Detect Duplication**
- ❌ Old: Step -1 duplicated in 4 prompts
- ✅ New: Rule #16 Step 5 auto-extracts duplicates

### 7. **Simplify User Output**
- ❌ Old: Technical output in user prompts
- ✅ New: Dual Interface (Rule #1), templates only

### 8. **Prevent Bloat With Limits**
- ❌ Old: No limits → 35+ commands in prompts
- ✅ New: Max 10 patterns/category, auto-archive (Rule #14)

---

## 🛡️ CURRENT GUARDRAILS (v4.2.0)

These guardrails prevent old KDS anti-patterns from recurring:

### **Publishing Guardrails** (Rule #14)
1. ✅ **Max 10 patterns per category** (prevent bloat)
2. ✅ **85% similarity = auto-reject** (prevent duplicates)
3. ✅ **60-84% similarity = consolidate** (prevent proliferation)
4. ✅ **90-day sunset policy** (auto-archive unused patterns)
5. ✅ **80% minimum success rate** (quality gate)
6. ✅ **3+ reuse minimum** (pattern must be reused 3 times before publish)
7. ✅ **NO examples in prompts** (all examples → knowledge/)

### **KDS Verification Guardrails** (Rule #16 Step 5)
1. ✅ **Max 20 rules** (hard limit), **15 rules** (soft limit, trigger consolidation)
2. ✅ **Max 15 prompts** (hard limit), **13 prompts** (soft limit)
3. ✅ **Max 80 files** (hard limit), **70 files** (soft limit)
4. ✅ **Auto-extract duplicates** (>3 lines duplicated → shared/)
5. ✅ **Zero conflicts allowed** (HALT if detected)
6. ✅ **Consistency enforcement** (validation: in all internal agents)

### **Automation Guardrails** (Rule #16)
1. ✅ **Mandatory post-task execution** (no user reminders)
2. ✅ **Build validation HALT** (stop if build fails)
3. ✅ **Auto-publish patterns** (Step 2, no manual embedding)
4. ✅ **Auto-cleanup clutter** (Step 3, delete .old/.backup)
5. ✅ **Auto-reorganize files** (Step 4, enforce structure)
6. ✅ **Auto-verify KDS health** (Step 5, detect issues)

---

## 🔄 MONITORING & REPORTS

**Weekly Report:** (Automated, Rule #14)
- Pattern count per category
- Unused patterns (last 30 days)
- Duplicate candidates (>60% similarity)
- Consolidation opportunities

**Monthly Report:** (Automated, Rule #14)
- KDS health score (0-100)
- Rule count trend (goal: ≤15)
- Prompt count trend (goal: ≤13)
- Archive summary (patterns sunset)

---

**Last Updated:** 2025-11-02  
**Version:** 1.0  
**Living Document:** Yes (update when new anti-patterns detected)  
**Governed By:** Rule #2 (Live Design Document)

