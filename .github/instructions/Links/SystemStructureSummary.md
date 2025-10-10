# System Structure Summary

## Active Prompts
- **analyze-learning.prompt.md** → self-learning analysis agent (pattern extraction and continuous improvement)
- **healthcheck.prompt.md** → system health auditor (read-only, cross-layer consistency checks)  
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
- **ValidationFramework.md** → standard validation pipeline (6 levels, all agents)
- **SelfAwareness.instructions.md** → global guardrails and operating rules  

## Key Management
- Keys tracked in: `Workspaces/Copilot/prompts.keys`  
- States: `new`, `In Progress`, `complete`  
- Keys are always alphabetically sorted  

## Agent Coordination Protocols
- **analyze-learning** → analyzes key data streams, updates learning infrastructure, generates recommendations
- **task** → executes work, creates Playwright tests automatically (Step 6.1), updates key data stream progressively
- **refactor** → improves structure, triggers **healthcheck** for validation  
- **sync** → orchestrates system state, maintains documentation and configuration alignment
- **healthcheck** → validates system integrity, reports to **sync** for fixes  
- **question** → analyzes application queries, supports all agents with knowledge and investigation

## Cross-Agent Learning Infrastructure
- **Learning Directory:** `Workspaces/Copilot/learning/`
- **Pattern Files:** task-patterns.json, refactor-patterns.json, validation-patterns.json, integration-patterns.json
- **Mandate:** All agents query patterns before execution, contribute learnings after success
- **Analysis Frequency:** Weekly or after 10 completed keys
- **Knowledge Sharing:** Successful patterns shared across agent boundaries

## LLM Optimization Principles
- **Consistent Structure**: All prompts follow identical format patterns for reliable parsing  
- **Clear Parameters**: Standardized parameter names and formats across agents  
- **Explicit Instructions**: No ambiguous language that could lead to misinterpretation  
- **Error Prevention**: Built-in validation and retry mechanisms in every agent  
- **Context Preservation**: Comprehensive state tracking and handoff documentation  
