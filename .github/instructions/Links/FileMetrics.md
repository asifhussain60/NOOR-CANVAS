# File Metrics Registry

**Last Updated**: 2025-01-11  
**Purpose**: Line count tracking for documentation drift detection and integrity checks

---

## Instructions & Links

| File | Line Count | Notes |
|------|------------|-------|
| instructions/SelfAwareness.instructions.md | 289 | Global operating guardrails |
| instructions/Links/AnalyzerConfig.MD | 66 | Code quality analyzers |
| instructions/Links/API-Contract-Validation.md | 132 | API contract safety rules |
| instructions/Links/FileMetrics.md | 18 | This file (self-referential) |
| instructions/Links/FunctionalityRegistry.md | 338 | Feature tracking schema |
| instructions/Links/FunctionalityRegistry-QuickRef.md | 221 | Quick validation workflow |
| instructions/Links/InfrastructureQuickRef.md | 254 | NEW: Database, API, test infrastructure |
| instructions/Links/NOOR-CANVAS_ARCHITECTURE.MD | 364 | System architecture overview |
| instructions/Links/PlaywrightConfig.MD | 76 | E2E test configuration |
| instructions/Links/PlaywrightTestPaths.MD | 214 | Test patterns and data |
| instructions/Links/ReferenceIndex.md | 11 | Central reference hub |
| instructions/Links/SystemStructureSummary.md | 44 | Agent coordination index |
| instructions/Links/ValidationFramework.md | 284 | 6-level validation pipeline |

---

## Prompts (Main Agents)

| File | Line Count | Notes |
|------|------------|-------|
| prompts/analyze-learning.prompt.md | 360 | Learning pattern extraction |
| prompts/cohesion-review.prompt.md | 493 | Prompt system auditor |
| prompts/healthcheck.prompt.md | 175 | System health validator |
| prompts/question.prompt.md | 322 | Application knowledge agent |
| prompts/refactor.prompt.md | 537 | Structural integrity agent |
| prompts/sync.prompt.md | 170 | Synchronization + cleanup |
| prompts/task.prompt.md | 755 | Canonical task executor |
| prompts/test-generation.prompt.md | 247 | Playwright test generator |

---

## Prompts (Shared Modules)

| File | Line Count | Notes |
|------|------------|-------|
| prompts/shared/commit-message-format.md | 148 | Conventional commit patterns |
| prompts/shared/debug-logging-mandate.md | 236 | Debug marker insertion rules |
| prompts/shared/step-0-server-cleanup.md | 59 | Kestrel cleanup procedure |
| prompts/shared/step-1-checkpoint.md | 110 | Checkpoint commit workflow |
| prompts/shared/warning-handling-mandate.md | 309 | Zero-warning enforcement |

---

## Usage

### For Copilot Agents
**Purpose**: Detect documentation drift before relying on potentially stale files

**Workflow**:
1. Read target file(s) for analysis
2. Compare actual line count vs FileMetrics.md
3. **IF variance > 20%**: Re-read file to ensure latest content
4. **IF variance > 50%**: Flag for manual review (possible restructure)

**Example**:
```
# Agent reads NOOR-CANVAS_ARCHITECTURE.MD
Expected: 364 lines (from FileMetrics.md)
Actual: 412 lines (from read_file)
Variance: +13% → Acceptable, proceed with analysis
```

### For Sync Agent
**Update Frequency**: After any documentation changes

**Command**:
```bash
# Regenerate FileMetrics.md
Get-ChildItem -Path ".github/instructions/Links/*.md", ".github/instructions/*.instructions.md", ".github/prompts/*.md" -Recurse | 
  ForEach-Object { [PSCustomObject]@{ File = $_.FullName; Lines = (Get-Content $_.FullName | Measure-Object -Line).Lines } }
```

---

## Version History

- **v2.0.0** (2025-01-11): Refreshed with live data
  - Added InfrastructureQuickRef.md (new file)
  - Updated all line counts from current files
  - Added shared prompt modules
  - Structured by category (Instructions, Prompts, Shared)
  - Added usage guide for agents
- **v1.0.0** (Original): Initial file metrics tracking
