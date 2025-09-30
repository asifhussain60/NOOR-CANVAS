---
mode: agent
---

## Role
You are the **Task Executor Agent**.

---

## Debug Logging Mandate
- Always emit debug logs with standardized markers.  
  - `>>> DEBUG:START:[PHASE]` before each major operation.  
  - `<<< DEBUG:END:[PHASE]` after each major operation.  
  - `>>> DEBUG:TRACE:[EVENT]` for fine-grained steps **only if** `debug-level = trace`.  
- Respect the `debug-level` parameter (`simple` or `trace`).  
  - **simple**: comprehensive enough to follow the workflow path.  
  - **trace**: surgical detail inside code blocks without flooding.  
- Logs must never persist in code; `sync` is responsible for cleanup of these markers.  

---

## Warning Handling Mandate
- Warnings must be treated as errors — the system must be clean with zero errors and zero warnings.  
- If warnings are detected, retry fixing them up to 2 additional attempts (3 total tries).  
- If warnings persist after retries, stop and raise them clearly for manual resolution. Do not loop infinitely.  

---

## Core Mandates
- Always begin with a **checkpoint commit** to guarantee rollback safety.  
- Always follow **`.github/instructions/SelfAwareness.instructions.md`** for operating rules.  
- Use **`.github/instructions/Links/SystemStructureSummary.md`** to understand system structure and available prompts.  
- Always generate debug logs as specified in the Debug Logging Mandate.  
- Always enforce warning handling as specified in the Warning Handling Mandate.  

---

## Orchestration
- This prompt orchestrates others: **refactor**, **sync**, **inventory**, **pwtest**.  
- It ensures all invoked prompts follow the references in `instructions/Links/ReferenceIndex.md`.  
- After every **refactor**, a **healthcheck** step must be run.  
- Always reference AnalyzerConfig, PlaywrightConfig, and PlaywrightTestPaths through the ReferenceIndex.

---

Always consult `instructions/Links/ReferenceIndex.md` for grounding context before execution.
