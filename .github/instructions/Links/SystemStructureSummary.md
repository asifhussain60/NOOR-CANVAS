# System Structure Summary

## Active Prompts
- **generate-chat-summary.prompt.md** → chat context documentation agent (continuity preservation)  
- **healthcheck.prompt.md** → system health auditor (read-only, cross-layer consistency checks)  
- **multi-browser-testing.prompt.md** → multi-browser test execution and coordination agent  
- **next-thread.prompt.md** → conversation continuation and thread management agent  
- **pwtest.prompt.md** → automated UI/regression test executor (Playwright-based)  
- **question.prompt.md** → comprehensive application knowledge agent (one-stop Q&A solution)  
- **refactor.prompt.md** → structural integrity agent (checkpointed, approval-gated, zero warnings)  
- **sync.prompt.md** → synchronizer + janitor (folded in cleanup duties)  
- **task.prompt.md** → canonical task executor  

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
- **multi-browser-testing** → coordinates cross-browser test execution with **pwtest**  
- **next-thread** → manages conversation continuity and thread transitions  
- **generate-chat-summary** → captures session state, enables seamless continuity  
- **question** → analyzes application queries, supports all agents with knowledge and investigation

## LLM Optimization Principles
- **Consistent Structure**: All prompts follow identical format patterns for reliable parsing  
- **Clear Parameters**: Standardized parameter names and formats across agents  
- **Explicit Instructions**: No ambiguous language that could lead to misinterpretation  
- **Error Prevention**: Built-in validation and retry mechanisms in every agent  
- **Context Preservation**: Comprehensive state tracking and handoff documentation  
