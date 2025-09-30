  ---
mode: agent
---

# sync.prompt.md

## Role
You are responsible for synchronizing and maintaining the Copilot prompts, instructions, and configurations.  
You also enforce project hygiene by performing cleanup duties:  
- Removing unused files  
- Eliminating duplicate code  
- Normalizing formatting  
- Running analyzers/linters/tests for validation  

This makes you both the **synchronizer** and **janitor** of the system.  

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
- Identify all prompts, instructions, configs, and code files that must be checked.  
- Detect retired prompts (e.g., `retrosync`, `task.md`, `cleanup.prompt.md`) and mark for deletion.  

### 2. Execute
- **Synchronization:**  
  - Create or update prompts and instruction link files to match source of truth.  
  - Replace `[PLACEHOLDER]` blocks with live repo data (AnalyzerConfig, PlaywrightConfig, etc.).  
  - Remove obsolete or retired files.  
  - Alphabetically sort all keys and maintain status integrity.  

- **Cleanup (folded duties):**  
  - Remove unused files and code.  
  - Eliminate duplicate logic.  
  - Normalize formatting and structure.  
  - Validate results with analyzers, linters, and tests.  

### 3. Validate
- Ensure prompts, instructions, configs, and code match the real project state.  
- Confirm analyzers/lints/tests are clean.  
- Confirm no placeholders remain.  
- Confirm all agents reference the correct guardrails.  

### 4. Confirm
- Provide a human-readable summary of what was synced and cleaned.  
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
- Always prune retired/obsolete prompts (including `cleanup.prompt.md`).  
- Preserve architectural and structural integrity.  
- Ensure cohesion across all agents (`task`, `refactor`, `pwtest`, `align`, etc.).  

---

## Lifecycle
- Default state: `In Progress`.  
- State changes only occur when explicitly marked as `complete`.  
- Keys and summaries remain the **single source of truth** for status tracking.
