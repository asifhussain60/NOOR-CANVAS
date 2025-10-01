# Copilot Rules Index (Comprehensive)

This document is the **source of truth** for all rules, prompts, and instructions under the `.github` structure.
It includes the raw content of each file with annotations for purpose, dependencies, expected outputs, and critical rules.

---

## File: INDEX.md
### Annotations
- **Purpose:** General supporting rule file.
- **File Path:** INDEX.md

### Content
```md
# Copilot Rules Index

This document is the **source of truth** for all rules, prompts, and instructions under the `.github` structure.
It consolidates every file's content so future comparisons can validate that nothing is missing, altered, or out of sync.

---

---
## Interactions & Cohesiveness

- **Sync Prompt** orchestrates state alignment across link/config files and ensures obsolete data is cleaned.  
- **Generate Chat Summary** runs as the final step, producing contextual checkpoints in `.github/copilot-chats/`.  
- **Copilot-Chats** directory stores session summaries, indexed for Copilot consumption to provide continuity.  
- **AnalyzerConfig, Playwright, API, and other Link files** provide specialized domain rules which Sync ensures remain current.  
- Together, this system forms a closed loop where state is always reconciled, and Copilot can resume work seamlessly across sessions.
```

---
## Interactions & Cohesiveness

- **Sync Prompt** orchestrates state alignment across link/config files and ensures obsolete data is cleaned.  
- **Generate Chat Summary** runs as the final step, producing contextual checkpoints in `.github/copilot-chats/`.  
- **Copilot-Chats** directory stores session summaries, indexed for Copilot consumption to provide continuity.  
- **AnalyzerConfig, Playwright, API, and other Link files** provide specialized domain rules which Sync ensures remain current.  
- **Critical Rule Tags (`CRITICAL-RULE`)** should be used to mark non-negotiable instructions inside prompt files.  
- Together, this system forms a closed loop where state is always reconciled, and Copilot can resume work seamlessly across sessions.
