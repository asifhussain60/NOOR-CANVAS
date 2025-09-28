# System Structure Summary

This file explains how Copilot should use and navigate the prompts and instructions.  
It is the **single source of truth** for system usage and must be updated if the structure changes.

---

## Key & Indexing

- **Primary Key**: Each prompt/instruction file is identified by its filename.  
  - Example: `refactor.prompt.md` → key = `refactor`.  
- **Index File**: This summary acts as the top-level index.  
  - Copilot should always check here first to know which prompts exist and their roles.  

---

## File Locations

- **/instructions**:  
  Contains high-level behavioral guides. Example:  
  - `SelfAwareness.instructions.md`: central meta-instruction.  
  - `API-Contract-Validation.md`: API-specific validations.  

- **/prompts**:  
  Contains task-specific operational prompts. Example:  
  - `refactor.prompt.md`: deep code restructuring guidance.  
  - `retrosync.prompt.md`: alignment checks across layers.  
  - `workitem.prompt.md`: generating or managing discrete dev tasks.  

---

## Usage Rules for Copilot

1. **Start with SelfAwareness**  
   - Always load `SelfAwareness.instructions.md` first.  
   - Follow its reference to this file for structural orientation.  

2. **Locate by Task Key**  
   - When the user requests a task (e.g. "refactor services"), Copilot should map the task → key → file in `/prompts`.  

3. **Combine with Layer Rules**  
   - When reviewing across layers (razor views, services, API contracts, SQL), Copilot should pull in `retrosync.prompt.md` or `refactor.prompt.md` plus any supporting instruction files.  

4. **Keep Summary Synced**  
   - Any new prompt or instruction must be added here with its key and purpose.  
   - If file locations or naming conventions change, update this summary immediately.  

---

*Last updated: Operational version (usage-centric one-pager).*
