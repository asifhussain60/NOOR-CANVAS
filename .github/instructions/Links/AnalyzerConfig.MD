# Analyzer Configuration — Canonical Reference

This file defines analyzer and linting tools Copilot must use for **refactor** and code quality tasks.

---

## Current State
[PLACEHOLDER] — Copilot must populate with REAL analyzer tools and configurations found in the repo.

---

## Instructions for Copilot
- On `/task context=new`:  
  - Read this file.  
  - Capture analyzer settings into the indexed context.  
- On `/refactor`:  
  - Run Roslynator and all analyzers listed here.  
  - Summarize findings by diagnostic ID and severity.  
  - Propose a plan based on these findings.  
- On `/sync`:  
  - Update this file to reflect the **REAL current state** of analyzers in the repo.  
  - Remove obsolete analyzers and configs.  
  - Add newly introduced ones.  
  - Verify configuration paths are correct.  

---

## TODO (Placeholder Policy)
If Copilot cannot locate analyzer configs:  
1. Insert `[PLACEHOLDER]` sections in this file.  
2. Stop and request confirmation.  
3. Replace placeholders with real data on next `/sync`.  

---
## Sync Protocol
This file must reflect the **REAL current state** of the project.  
- `/sync` is responsible for updating this file automatically.  
- Obsolete data must be removed.  
- Modified values must be updated to match source of truth in the repo.  
- Placeholders (`[PLACEHOLDER]`) must be replaced on the next run.  
