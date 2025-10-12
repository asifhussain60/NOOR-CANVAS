# File Metrics Registry

**Last Updated**: 2025-01-22  
**Version**: 3.1.0  
**Purpose**: Line count tracking for documentation drift detection and integrity checks  
**Location**: Moved from `.github/instructions/Links/` to `Workspaces/Global/` for maintenance purposes

---

## Version History
- **3.1.0** (2025-01-22): Added PlaywrightQuickRef.md, updated task.prompt.md line count
- **3.0.0** (2025-01-22): File consolidation (ReferenceIndex, SystemStructureSummary, FunctionalityRegistry-QuickRef merged into SystemIndex.md)
- **2.0.0** (Previous): Relocated to Workspaces/Global/

---

## Instructions & Links

| File | Line Count | Notes |
|------|------------|-------|
| instructions/SelfAwareness.instructions.md | 289 | Global operating guardrails |
| instructions/Links/AnalyzerConfig.MD | 66 | Code quality analyzers |
| instructions/Links/API-Contract-Validation.md | 132 | API contract safety rules |
| instructions/Links/FunctionalityRegistry.md | 338 | Feature tracking schema |
| instructions/Links/InfrastructureQuickRef.md | 254 | Database, API, test infrastructure |
| instructions/Links/PlaywrightQuickRef.md | 423 | **NEW** - Complete Playwright testing guide |
| instructions/Links/Architecture.md | 447 | System architecture overview |
| instructions/Links/PlaywrightConfig.MD | 76 | E2E test configuration |
| instructions/Links/PlaywrightTestPaths.MD | 214 | Test patterns and data |
| instructions/Links/SystemIndex.md | 273 | Central navigation hub (consolidation) |
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
| prompts/task.prompt.md | 1020 | Canonical task executor (updated with Step 2.5) |
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
# Agent reads Architecture.md
Expected: 447 lines (from FileMetrics.md)
Actual: 465 lines (from read_file)
Variance: +4% → Acceptable, proceed with analysis
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

## Summary Documents

| File | Purpose | Location |
|------|---------|----------|
| file-consolidation-summary.md | Documents consolidation of Links folder (12→9 files) | Workspaces/Global/ |
| database-rules-integration-summary.md | Documents integration of database rules into prompts | Workspaces/Global/ |
| playwright-testing-integration-summary.md | Documents Playwright testing knowledge consolidation | Workspaces/Global/ |

**Note**: These summary documents capture major system changes and serve as historical record for understanding evolution of prompt system architecture.

---

## Version History

- **v3.1.0** (2025-01-22): Added PlaywrightQuickRef.md and summary documents
  - Created PlaywrightQuickRef.md (423 lines) - Complete Playwright testing guide
  - Updated task.prompt.md with Step 2.5 (QuickRef Localization) - now 1020 lines
  - Created playwright-testing-integration-summary.md
  - Added Version History section with detailed changelog
- **v3.0.0** (2025-01-22): File consolidation and relocation
  - Moved FileMetrics.md from `.github/instructions/Links/` to `Workspaces/Global/`
  - Consolidated ReferenceIndex.md, SystemStructureSummary.md, FunctionalityRegistry-QuickRef.md into SystemIndex.md
  - Renamed NOOR-CANVAS_ARCHITECTURE.MD to Architecture.md (generic naming for portability)
  - Created file-consolidation-summary.md
  - Created database-rules-integration-summary.md
  - Updated all references to reflect new file structure
- **v2.0.0** (2025-01-11): Refreshed with live data
  - Added InfrastructureQuickRef.md (new file)
  - Updated all line counts from current files
  - Added shared prompt modules
  - Structured by category (Instructions, Prompts, Shared)
  - Added usage guide for agents
- **v1.0.0** (Original): Initial file metrics tracking
