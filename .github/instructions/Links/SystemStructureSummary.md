# System Structure Summary

## Active Prompts
- **task.prompt.md** → canonical task executor  
- **sync.prompt.md** → synchronizer + janitor (folded in cleanup duties)  
- **refactor.prompt.md** → structural integrity agent (checkpointed, approval-gated, zero warnings)  
- **pwtest.prompt.md** → automated UI/regression test executor (Playwright-based)  
- **healthcheck.prompt.md** → system health auditor (read-only, cross-layer consistency checks)  
- **lock.prompt.md** → keylock manager  
- **inventory.prompt.md** → inventory and dashboard manager  

## Retired Prompts
- **retrosync.prompt.md** → replaced by sync  
- **cleanup.prompt.md** → folded into sync  
- **task.md** → merged into task.prompt.md  
- **align.prompt.md** → renamed to healthcheck.prompt.md  

## Instruction Links
- **NOOR-CANVAS_ARCHITECTURE.MD** → full system design (controllers, services, DTOs, DB, SignalR, etc.)  
- **SystemStructureSummary.md** → index of prompts and responsibilities (this file)  
- **AnalyzerConfig.MD** → analyzer + Roslynator + lint/test rules  
- **PlaywrightConfig.MD** → UI test configuration (coverage and rules)  
- **API-Contract-Validation.md** → cross-layer contract validation rules (UI → API → DB)  
- **SelfAwareness.instructions.md** → global guardrails and operating rules  

## Key Management
- Keys tracked in: `Workspaces/Copilot/prompts.keys`  
- States: `new`, `In Progress`, `complete`  
- Keys are always alphabetically sorted  
