---
mode: agent
name: retro
alias: /retro
description: >
  Run a retrospective on the current thread. Reconstruct incidents, extract lessons,
  and update prompt files with regression guardrails. 
  Always review chat history for cases where Copilot reported issues as "fixed"
  but they were not, and record those contradictions explicitly.
  Align with NOOR-CANVAS-DESIGN and ncImplementationTracker.

parameters:
  - name: notes
    description: Optional free-text notes (e.g., "timer used old KSESSIONS date").
  - name: filesToUpdate
    description: Comma-separated list of #file: targets to update with prevention rules.
    default: "#file:fixissue.prompt.md, #file:implement.prompt.md"
  - name: auto_apply
    description: If true, apply changes directly; else propose diffs.
    default: false
  - name: lookback
    description: How far back to read (e.g., "all", "72h", "100 messages").
    default: "all"

# 📖 Usage Examples
# /retro notes:"Timer used old KSESSIONS date" auto_apply:false
# /retro notes:"Generalize from neighboring commands" filesToUpdate:"#file:fixissue.prompt.md,#file:implement.prompt.md" auto_apply:true
# /retro notes:"Check cache-busting rules" filesToUpdate:"#file:implement.prompt.md" auto_apply:false lookback:"72h"

# 🎯 Execution Plan
steps:
  - title: Gather Context
    details: |
      Collect conversation history (lookback), Workspaces notes, commands, and logs.
  - title: Reconstruct Incidents
    details: |
      Identify failures, missed cues, repeated mistakes, and contradictions.
  - title: Chat History Review (NEW)
    details: |
      • Scan chat history for instances where Copilot reported "issue fixed".
      • Verify whether later conversation showed the issue still persisted.
      • Record contradictions explicitly in the retrospective output.
      • Summarize repeated "false fixed" patterns with root causes.
  - title: Root-Cause Analysis
    details: |
      Why issues slipped through; which signals were ignored.
  - title: Learn from Adjacent Commands
    details: |
      Generalize from nearby attempts (fixissue, implement, runtest) to identify missed patterns.
  - title: Produce Improvement Rules
    details: |
      Convert findings into guardrails and actionable instructions.
  - title: Update Target Files
    details: |
      Insert or update Regression Guards sections in filesToUpdate.
  - title: Deliverables
    details: |
      Produce a retrospective report: summary, timeline, rules, diffs or confirmation.

# 🛡️ Guardrails
rule_templates:
  - tag: [history]
    title: Enforce chat history review
    body: |
      - Always check whether Copilot reported "fixed" in the past.
      - Document contradictions if the issue was still present afterward.
      - Ensure future fixes include explicit validation evidence.
  - tag: [time]
    title: Enforce a single Time Source of Truth
    body: |
      - Derive "now" from DB UTC, never hard-coded
      - Annotate timezone/DST handling
      - Consistency with NOOR-CANVAS-DESIGN
  - tag: [env]
    title: Environment sanity check
    body: |
      - Log branch, commit, NODE_ENV/ASPNETCORE_ENVIRONMENT
      - Diff .env files; confirm secrets loaded
  - tag: [readiness]
    title: Lightweight readiness checks
    body: |
      - Assert health endpoints + key selectors after launch

# 🔗 Alignment
alignment:
  - "NOOR-CANVAS-DESIGN.MD"
  - "ncImplementationTracker.MD"
  - "copilot_instructions.md"

# 📤 Output
output:
  - Summary of incidents
  - Timeline of key messages
  - Explicit list of "false fixed" claims and contradictions
  - Improvement rules (deduplicated)
  - Proposed diffs or updated guardrails in target files
