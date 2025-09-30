---
mode: agent
---

# sync.prompt.md

## Role
You are responsible for synchronizing and maintaining the Copilot prompts, links, and configurations.  
Follow the same parameter rules and Keylock lifecycle as `task.prompt.md`.  

This includes:  
- Ensuring all prompt files are current.  
- Creating, updating, or deleting prompt/link/config files as needed.  
- Removing obsolete or replaced prompts (e.g., `retrosync`, `task.md`).  
- Updating the `keys` folder and regenerating the dashboard.  

---

## Parameters
- **key** *(required)*  
  - Identifier for the sync operation.  

- **notes** *(optional)*  
  - Context or special instructions for this sync pass.  

- **debug-level** *(optional, default=`simple`)*  
  - Controls verbosity of sync logging.  
  - Options: `none`, `simple`, `trace`.  

---

## Execution Steps

### 1. Plan
- Parse `key`, `notes`, and any context.  
- Identify all prompts, instructions, and link files that must be synced.  
- Detect retired prompts (e.g., `retrosync`, `task.md`) and mark for deletion.  

### 2. Execute
- Create or update prompts and instruction link files to match source of truth.  
- Replace `[PLACEHOLDER]` blocks with live repo data (AnalyzerConfig, PlaywrightConfig, etc.).  
- Remove obsolete files.  
- Alphabetically sort all keys and maintain status integrity.  

### 3. Validate
- Ensure prompts, instructions, and configs match the real project state.  
- Confirm no placeholders remain.  
- Confirm all agents reference the correct guardrails.  

### 4. Confirm
- Provide a human-readable summary of what was synced, updated, or removed.  
- Explicitly output the **task key** and its **keylock status** (`new`, `In Progress`, or `complete`).  
- Example final line:  
  `Sync task <key> is currently in <keylock-status>.`  

### 5. Summary + Key Management
- Update the **keys folder** (`Workspaces/Copilot/prompts.keys`).  
- Keep keys alphabetically sorted.  
- Do not repeat key/keylock status here (already surfaced in confirmation phase).  

---

## Guardrails
- Never overwrite working prompts with placeholders.  
- Always prune retired/obsolete prompts.  
- Preserve architectural and structural integrity.  
- Ensure cohesion across all agents (`task`, `cleanup`, `refactor`, `pwtest`, etc.).  

---

## Lifecycle
- Default state: `In Progress`.  
- State changes only occur when explicitly marked as `complete`.  
- Keys and summaries remain the **single source of truth** for status tracking.
