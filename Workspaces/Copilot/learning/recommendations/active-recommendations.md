# Active Recommendations

**Last Updated:** October 12, 2025  
**Maintainer:** analyze-learning agent

---

## High Priority

### R-010: Mandate Learning Library Queries in All Prompts
- **Source:** Comprehensive learning analysis, 2025-10-12
- **Context:** Limited evidence of agents querying learning patterns before execution
- **Recommendation:** Update all agent prompts with mandatory Step 0: Query Learning Library
- **Expected Impact:** Reuse proven approaches, avoid repeating failures, faster execution
- **Effort:** 2 hours (update 8 prompts with learning query step)
- **Status:** Pending Review

### R-011: Create CSS Pattern Library
- **Source:** Canvas key analysis (visual feedback pattern), 2025-10-12
- **Context:** CSS Grid equal-height pattern highly successful and reusable
- **Recommendation:** Create `CSSPatternLibrary.md` with 10-15 common layout solutions
- **Expected Impact:** Faster UI development, consistent patterns, reduced trial-and-error
- **Effort:** 1 day
- **Status:** Pending Review

### R-012: Consolidate Playwright Documentation
- **Source:** Cohesion review finding 4.1, 2025-10-12
- **Context:** Playwright docs split across 3 files (fragmentation)
- **Recommendation:** Merge PlaywrightQuickRef.md + PlaywrightConfig.MD + PlaywrightTestPaths.MD → PlaywrightReference.md
- **Expected Impact:** Single source of truth, easier navigation, reduced maintenance
- **Effort:** 3 SP (~4 hours)
- **Status:** High Priority (identified in cohesion review)

### R-013: Automate Debug Marker Cleanup
- **Source:** Quality trend analysis, 2025-10-12
- **Context:** 12+ debug markers per key with `;CLEANUP_OK` suffix
- **Recommendation:** Create PowerShell script to remove debug markers on key completion
- **Expected Impact:** Clean code, automated cleanup, no manual burden
- **Effort:** 2 hours (script + integration into completion workflow)
- **Status:** Pending Review

### R-001: Implement Pre-Commit Contract Validation Hook
- **Source:** Holistic System Review, 2025-10-09
- **Context:** Historical API/DTO mismatches could be prevented with automated pre-commit validation
- **Recommendation:** Create git pre-commit hook that validates API contracts before allowing commits
- **Expected Impact:** Reduce contract mismatches by 90%, catch issues before they enter codebase
- **Effort:** 1 day
- **Status:** Pending Review

### R-002: Create Agent Performance Dashboard
- **Source:** Holistic System Review, 2025-10-09
- **Context:** No visibility into agent effectiveness metrics
- **Recommendation:** Build dashboard from key data streams showing success rates, duration trends, common failures
- **Expected Impact:** Data-driven agent improvements, identify bottlenecks
- **Effort:** 2-3 days
- **Status:** Pending Review

---

## Medium Priority

### R-014: Create E2E Test Templates
- **Source:** Efficiency insight EI-003, 2025-10-12
- **Context:** E2E test creation overhead ~45 minutes per comprehensive test
- **Recommendation:** Create test templates for common workflows (CRUD, SignalR, auth, forms, wizards)
- **Expected Impact:** Faster test creation, consistent test structure, reduced effort
- **Effort:** 1 day (create 5-6 templates)
- **Status:** Pending Review

### R-015: Integrate Ground Truth Validation into CI/CD
- **Source:** Efficiency insight EI-004, 2025-10-12
- **Context:** Manual validation execution, could be automated
- **Recommendation:** Add Validate-DocumentationGroundTruth.ps1 to CI/CD pipeline (run on every commit)
- **Expected Impact:** Automatic validation, early drift detection, confidence boost
- **Effort:** 2 hours (GitHub Actions integration)
- **Status:** Pending Review

### R-016: Extract Mandate/Checkpoint Duplicates to Shared Modules
- **Source:** Cohesion review finding 1.2, 1.3, 2025-10-12
- **Context:** 8 prompts duplicate Debug/Warning Mandate, 5 duplicate checkpoint instructions
- **Recommendation:** Standardize all prompts to use reference-only pattern
- **Expected Impact:** Reduce maintenance burden, improve cohesion score 9.5 → 9.7
- **Effort:** 3 SP (~4 hours)
- **Status:** Medium Priority (identified in cohesion review)

### R-017: Create Service Wrapper Registry
- **Source:** HCP key pattern SP-007, 2025-10-12
- **Context:** UnifiedHtmlTransformService wrapper pattern successful and reusable
- **Recommendation:** Document when to create wrapper services vs direct service usage
- **Expected Impact:** Architectural consistency, clearer service boundaries
- **Effort:** 1 day (documentation + 2-3 example patterns)
- **Status:** Pending Review

### R-018: Implement Quarterly Key Consolidation
- **Source:** System key analysis, 2025-10-12
- **Context:** Key stream consolidation reduced footprint 60% (25 → 10 folders)
- **Recommendation:** Schedule quarterly key consolidation (archive old, consolidate completed)
- **Expected Impact:** Maintain clean workspace, preserve history, reduce clutter
- **Effort:** 2 hours per quarter
- **Status:** Pending Review

### R-003: Formalize Instruction Update Protocol
- **Source:** Holistic System Review, 2025-10-09
- **Context:** Multiple agents can update instruction files with potential conflicts
- **Recommendation:** Implement update-lock.json mechanism and ownership matrix
- **Expected Impact:** Prevent conflicting simultaneous updates
- **Effort:** 1 day
- **Status:** Pending Review

### R-004: Add Prompt Template Validation
- **Source:** Holistic System Review, 2025-10-09
- **Context:** No automated validation that prompts follow standard structure
- **Recommendation:** Create validate-prompt-structure.ps1 to enforce format consistency
- **Expected Impact:** Maintain LLM-optimal structure, catch format drift early
- **Effort:** 1-2 days
- **Status:** Pending Review

---

## Low Priority

### R-005: Create Agent Interaction Visualization
- **Source:** Holistic System Review, 2025-10-09
- **Context:** Agent coordination complex, no visual representation
- **Recommendation:** Generate Mermaid diagrams from SystemStructureSummary.md
- **Expected Impact:** Improved documentation, easier onboarding
- **Effort:** 1 day
- **Status:** Pending Review

### R-006: Implement Prompt Version Control
- **Source:** Holistic System Review, 2025-10-09
- **Context:** Prompt changes not tracked with versioning
- **Recommendation:** Add version field to all prompts, maintain CHANGELOG.md
- **Expected Impact:** Better change tracking, enable prompt rollback
- **Effort:** 2 days
- **Status:** Pending Review

---

## Recently Implemented

### ✅ R-007: Unified Validation Framework (Implemented 2025-10-09)
- **Source:** Holistic System Review
- **Implementation:** Created `.github/instructions/Links/ValidationFramework.md`
- **Outcome:** Single source of truth for validation requirements across all agents
- **Impact:** 100% validation consistency

### ✅ R-008: Automated Rollback Protocol (Implemented 2025-10-09)
- **Source:** Holistic System Review
- **Implementation:** Created `Workspaces/Global/rollback.ps1`
- **Outcome:** Standardized rollback automation with checkpoint detection
- **Impact:** Consistent recovery mechanism, reduced manual intervention

### ✅ R-009: Cross-Agent Learning Infrastructure (Implemented 2025-10-09)
- **Source:** Holistic System Review
- **Implementation:** Created `Workspaces/Copilot/learning/` structure with pattern files
- **Outcome:** Knowledge sharing infrastructure in place
- **Impact:** Foundation for automated cross-agent learning

---

## Tracking Metrics

- **Total Active Recommendations:** 6
- **Implemented This Month:** 3
- **Average Time to Implementation:** TBD (first month)
- **Implementation Rate:** TBD (need 3 months data)
