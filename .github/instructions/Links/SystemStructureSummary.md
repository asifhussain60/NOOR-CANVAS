# System Structure Summary

## Active Prompts
- **task.prompt.md** → canonical task executor  
- **sync.prompt.md** → synchronizer + janitor (folded in cleanup duties)  
- **refactor.prompt.md** → structural integrity agent (checkpointed, approval-gated, zero warnings)  
- **pwtest.prompt.md** → automated UI/regression test executor (Playwright-based)  
- **healthcheck.prompt.md** → system health auditor (read-only, cross-layer consistency checks)  
- **inventory.prompt.md** → inventory and dashboard manager  
- **generate-chat-summary.prompt.md** → chat context documentation agent (continuity preservation)  
- **question.prompt.md** → comprehensive application knowledge agent (one-stop Q&A solution)  

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

## Agent Coordination Protocols
- **task** → executes work, hands off to **pwtest** for validation  
- **refactor** → improves structure, triggers **healthcheck** for validation  
- **sync** → orchestrates system state, calls **generate-chat-summary** as final step  
- **healthcheck** → validates system integrity, reports to **sync** for fixes  
- **pwtest** → creates tests, integrates with **task** completion workflow  
- **inventory** → provides status overview, supports all other agents with context  
- **generate-chat-summary** → captures session state, enables seamless continuity  
- **question** → analyzes application queries, supports all agents with knowledge and investigation

## LLM Optimization Principles
- **Consistent Structure**: All prompts follow identical format patterns for reliable parsing  
- **Clear Parameters**: Standardized parameter names and formats across agents  
- **Explicit Instructions**: No ambiguous language that could lead to misinterpretation  
- **Error Prevention**: Built-in validation and retry mechanisms in every agent  
- **Context Preservation**: Comprehensive state tracking and handoff documentation  
