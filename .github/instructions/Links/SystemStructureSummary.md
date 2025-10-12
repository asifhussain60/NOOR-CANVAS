# System Structure Summary

## Active Prompts
- **task.prompt.md** → canonical task executor (file auto-loading, checkpoint commits, 9-step workflow)
- **question.prompt.md** → comprehensive application knowledge agent (one-stop Q&A solution)
- **test-generation.prompt.md** → Playwright test generator (Session 212, canonical patterns)
- **refactor.prompt.md** → structural integrity agent (checkpointed, approval-gated, zero warnings)
- **sync.prompt.md** → synchronizer + janitor (documentation, configuration, cleanup duties)
- **healthcheck.prompt.md** → system health auditor (read-only, cross-layer consistency checks)
- **analyze-learning.prompt.md** → self-learning analysis agent (pattern extraction and continuous improvement)
- **cohesion-review.prompt.md** → prompt system auditor (redundancy detection, efficiency optimization)

## Retired Prompts
- **retrosync.prompt.md** → replaced by sync
- **cleanup.prompt.md** → folded into sync
- **task.md** → merged into task.prompt.md
- **align.prompt.md** → renamed to healthcheck.prompt.md

## Instruction Links
- **SelfAwareness.instructions.md** → global guardrails and operating rules (file organization, runtime rules, Roslynator integration)
- **InfrastructureQuickRef.md** ⭐ NEW → database connections, API endpoints, SignalR hubs, Session 212 test data
- **NOOR-CANVAS_ARCHITECTURE.MD** → full system design (52 API endpoints, 15+ services, 4 SignalR hubs)
- **SystemStructureSummary.md** → index of prompts and responsibilities (this file)
- **ValidationFramework.md** → standard 6-level validation pipeline (build, analyzers, linters, contracts, E2E, docs)
- **API-Contract-Validation.md** → cross-layer contract validation rules (UI → API → DB)
- **AnalyzerConfig.MD** → analyzer + Roslynator + StyleCop + ESLint rules
- **PlaywrightConfig.MD** → E2E test configuration (modes, artifacts, webServer)
- **PlaywrightTestPaths.MD** → canonical test patterns and Session 212 data
- **FunctionalityRegistry.md** → feature tracking schema for regression prevention
- **FunctionalityRegistry-QuickRef.md** → quick validation workflow for task.prompt.md Step 8.2
- **FileMetrics.md** → line count tracking for documentation drift detection
- **ReferenceIndex.md** → central hub for all Links files  

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

---

**Last Updated**: 2025-01-11  
**Maintained By**: Sync Agent  
**Version**: 2.0.0 (Added InfrastructureQuickRef.md, updated prompt list)  
