# Key: hcp-refactor

**Created**: 2025-10-29  
**Type**: Architecture Refactoring (Phase 2)  
**Status**: 🟡 Planning Complete

---

## Overview

Phase 2 of HostControlPanel refactoring focused on **architecture, infrastructure, duplication elimination, and performance optimization**.

**Phase 1** (in `hcp-refactor-phase1`): UI enhancements (FAB button, timer, collapsible panel, component extraction)  
**Phase 2** (this KDS): Service-oriented architecture, JS modularization, performance improvements

---

## Goals

**Architecture:**
- Extract business logic to services (6 new services)
- Create proper infrastructure layer (SignalR middleware)
- Decompose monolithic component (11 total components)

**Quality:**
- Eliminate all duplication (3 parsers → 1, 2 SignalR setups → 1)
- Modularize embedded JavaScript (832 lines → 4 modules)
- Optimize performance (+20% render speed target)

**Metrics:**
- Reduce file size: 5,170 → ~1,800 lines (65% reduction)
- Improve health score: 6.5 → 8.5/10
- Remove redundant code: 40+ state checks, 15+ DOM calls, 25+ lambdas

---

## Phases

### Phase 1: Service Extraction 🏗️
- Create: `TranscriptProcessingService`, `SignalRStateService`, `TimerStateService`
- Impact: ~1,200 lines to services
- Status: 🔲 Not Started

### Phase 2: SignalR Middleware 🔌
- Create: `SignalRMiddleware`, `HubConnectionFactory`
- Impact: ~400 lines to infrastructure
- Status: 🔲 Not Started

### Phase 3: Duplication Elimination 🔄
- Consolidate: Parsing, SignalR, error handling
- Impact: ~600 lines removed
- Status: 🔲 Not Started

### Phase 4: JavaScript Modularization 📦
- Extract: `hcp-timer.js`, `hcp-signalr.js`, `hcp-animations.js`, `hcp-dom-utils.js`
- Create: `HCPJavaScriptService` wrapper
- Impact: 832 lines → modules
- Status: 🔲 Not Started

### Phase 5: Performance Optimization ⚡
- Remove: Redundant state checks, DOM calls, lambdas
- Convert: 8 sync → async methods
- Impact: +20% performance
- Status: 🔲 Not Started

### Phase 6: Component Decomposition 🧩
- Extract: Timer, QuestionPanel, ParticipantList, SessionControls, ErrorBanner
- Impact: ~800 lines to children
- Status: 🔲 Not Started

---

## File Structure

```
hcp-refactor/
├── hcp-refactor.plan.md          # Comprehensive 6-phase plan
├── work-log.md                   # Session tracking
├── README.md                     # This file
├── scripts/                      # Execution scripts (future)
├── tests/                        # Phase-specific tests (future)
└── [phase outputs]               # Code artifacts per phase
```

---

## Validation

**Baseline Tests:** `.github/key-data-streams/hcp-refactor-phase1/scripts/run-hcp-baseline-test.ps1`  
**Continuous:** Run after each phase  
**Checkpoints:** Git commit before each phase  
**Rollback:** Max 3 retries, then automatic rollback

---

## Dependencies

**Phase 1 (Completed):**
- Key: `hcp-refactor-phase1` (formerly `hcp`)
- UI enhancements complete
- 6 components extracted
- 10+ tests created

**External:**
- Blazor Server (.NET 8)
- SignalR Core
- AngleSharp
- Playwright (testing)

---

## Expected Outcomes

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| File Size | 5,170 lines | ~1,800 lines | 65% |
| Services | 0 | 6 | Architecture |
| Embedded JS | 832 lines | 0 | 100% |
| Components | 6 | 11 | Decomposition |
| Health Score | 6.5/10 | 8.5/10 | +2.0 |

---

## Status

**Planning:** ✅ Complete  
**Execution:** 🔲 Awaiting Approval  
**Progress:** 0/6 phases complete

---

## Quick Links

- **Detailed Plan:** `hcp-refactor.plan.md`
- **Work Log:** `work-log.md`
- **Phase 1 KDS:** `../hcp-refactor-phase1/`
- **Target File:** `SPA/NoorCanvas/Pages/HostControlPanel.razor`

---

*Document-first protocol: Full planning complete before execution*
