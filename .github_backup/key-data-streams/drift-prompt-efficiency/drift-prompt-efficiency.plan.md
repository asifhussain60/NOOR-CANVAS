# Plan: drift-prompt-efficiency (Prompt System Efficiency Improvements)

**Key:** `drift-prompt-efficiency`  
**Created:** 2025-10-28  
**Status:** completed  
**Type:** Process Improvement  
**Parent Key:** `hcp-fab-button`

---

## Overview

Document successful patterns from hcp-fab-button implementation and identify opportunities to improve prompt system efficiency for future work.

---

## Phase 1: Pattern Documentation

**Objective:** Capture successful patterns from hcp-fab-button work

**Successful Patterns Documented:**
1. **Test Orchestration Protocol**
   - PowerShell script for app launch + health check + test execution
   - SSL certificate handling with `-SkipCertificateCheck`
   - Process cleanup with `-KeepAppRunning` flag
   - Headed mode debugging with `-Headed` flag
   - Clear console output with step markers

2. **Console Logging Strategy**
   - Prefix-based logging for filtering (`[FAB-DEBUG]`)
   - Log visibility conditions on every render
   - Conditional output (✅/❌) for diagnosis

3. **Incremental Implementation**
   - Positioning fix first (CSS)
   - Logging second (debug support)
   - Tests third (verification)
   - Documentation fourth (knowledge capture)

**Deliverables:**
- Documented patterns in work-log.md

---

## Phase 2: Prompt System Improvements

**Objective:** Identify areas for prompt enhancement

**Improvements Identified:**
1. **Test-First Approach**
   - Prompt should ask: "What authentication is needed for this test scenario?"
   - Better: Identify auth requirements → Implement with auth → Test
   
2. **Pre-Implementation Questions**
   - Authentication requirements check
   - Test data availability verification
   - Environment setup validation

**Deliverables:**
- Improvement recommendations documented

---

## Phase 3: Knowledge Capture

**Objective:** Integrate learnings into prompt system

**Tasks:**
1. Update test-generation.prompt.md with auth requirement checks
2. Document test orchestration pattern for reuse
3. Add pre-implementation validation checklist

**Deliverables:**
- Enhanced prompts with efficiency improvements

---

## Success Criteria

- ✅ Successful patterns documented
- ✅ Improvement areas identified
- ✅ Recommendations integrated into prompts
