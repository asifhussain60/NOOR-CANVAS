---
mode: agent
---

# /task — Unified Workstream Agent (v6.0.0)

Runs **new**, **continue**, **rollback**, or **test-only** workstreams for `{key}`.  
Folds the behavior of `/workitem`, `/continue`, and `/imgreq` into one interface.

**Core Mandate:** Always follow `.github/instructions/SelfAwareness.instructions.md` and the linked `/Links` references before doing anything.

---

## Parameters
- **key** *(required)*: Work stream identifier. Auto-inferred from chat history if not provided.  
  All artifacts (index, manifest, temp files) are grouped under this key.
- **context**: Workstream context. Default: `continue`.  
  - `new`: Read SelfAwareness + all Link references + architecture docs. Build new indexed context.  
  - `continue`: Read only the indexed context (`Workspaces/Copilot/keys/{key}/context.idx.json`).  
  - `rollback`: Restore repository to last Git checkpoint for `{key}` (`checkpoint-{key}-{timestamp}`). Requires user confirmation.  
- **debug-level**: `none` | `simple` | `trace`. Default: `simple`.  
- **mode**: `analyze` | `apply` | `test`. Default: `apply`.  
  - `analyze`: Produce plan + Playwright tests, stop before execution.  
  - `apply`: Full lifecycle (plan → approval → implementation → test).  
  - `test`: Rerun Playwright tests for this key only.  
- **notes** *(required)*: Work description (scope, files, constraints).  
  - If an image is attached and annotations are detected, translate via legend mapping into requirements and append to notes.

---

## Mandatory Preface

### If `context=new`
1. **Read Required Files**
   - `.github/instructions/SelfAwareness.instructions.md`  
   - `.github/instructions/Links/NC-TechOverview.MD`  
   - `.github/instructions/Links/CopilotRules.MD`  
   - `.github/instructions/Links/UserCommandMaps.MD`  
   - `.github/instructions/Links/PlaywrightConfig.MD`  
   - `.github/instructions/Links/AnalyzerConfig.MD`  
   - `.github/instructions/Links/SystemStructureSummary.md`  
   - `.github/instructions/Links/NOOR-CANVAS_ARCHITECTURE.MD`  
   - `.github/instructions/Links/API-Contract-Validation.md`  
2. **Create Git Checkpoint** → `checkpoint-{key}-{timestamp}`.  
3. **Indexed Context** → Write `Workspaces/Copilot/keys/{key}/context.idx.json` including:  
   - Why/what/risk summary  
   - Surfaces (controllers, hubs, services)  
   - Files/endpoints touched  
   - Mock/simulate/fake/stub/dummy/test identifiers (critical)  
   - Debug marker format  
   - Snapshot of `PlaywrightConfig.MD` and `AnalyzerConfig.MD`  
4. **Manifest Draft** → Initialize `Workspaces/Copilot/keys/{key}/manifest.json`.  

### If `context=continue`
- Load only `context.idx.json`.  
- Fold in any incomplete work from history/logs.  
- Skip re-reading full instruction corpus.  

### If `context=rollback`
- Locate last checkpoint for `{key}`.  
- Prompt user to confirm destructive action.  
- Run `git reset --hard {checkpoint}` (or equivalent safe rollback).  
- Update manifest to record rollback event.  
- Stop execution.  

---

## Planning Protocol
- Generate **Detailed Analysis** of requested and unfinished work.  
- Break into **Phases**, each with:  
  - Objective  
  - Files touched  
  - Risks + rollback notes  
  - A Playwright spec: `Workspaces/TEMP/{key}/pwtests/phase-XX.spec.ts`  
- Output plan and **wait for user approval**.  
- If `mode=analyze`, stop here.

---

## Execution Protocol
- **Mode=apply**  
  1. For each phase:  
     - Implement changes.  
     - Run Playwright test using config from `PlaywrightConfig.MD` or context index.  
     - Mark phase complete only if test passes.  
     - Update manifest with phase result (status, commit hash, timestamp).  
  2. Maintain debug logs using `[DEBUG-WORKITEM:{key}:{layer}:{RUN_ID}] … ;CLEANUP_OK`.  
  3. On completion, update manifest with:  
     - Work requested summary  
     - Completed analysis checklist  
     - Issues resolved checklist  
     - Manual test checklist  

- **Mode=test**  
  - Re-run Playwright tests defined in manifest.  
  - Update manifest with new results.  

---

## Manifest Protocol
- Manifest lives at `Workspaces/Copilot/keys/{key}/manifest.json`.  
- `/task` drafts entries as phases are executed.  
- `/sync` validates and finalizes the manifest as “REAL” history.

---

## Legacy Aliases
- `/workitem` → `/task context=new`  
- `/continue` → `/task context=continue`  
- `/imgreq` → `/task context=new` with image-to-requirements enabled  
