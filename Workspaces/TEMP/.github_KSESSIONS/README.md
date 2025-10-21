# .github Index (KSESSIONS)

Start here if you're new to the prompts and instructions.

## Quick Links

- Operating Guardrails: `.github/instructions/SelfAwareness.instructions.md`
- System Index: `.github/instructions/Links/SystemIndex.md`
- Architecture: `.github/instructions/Links/Architecture.md`
- Infrastructure Quick Ref: `.github/instructions/Links/InfrastructureQuickRef.md`
- API Contracts: `.github/instructions/Links/API-Contract-Validation.md`
- Analyzer/Lint Config: `.github/instructions/Links/AnalyzerConfig.MD`
- Learning System: `.github/learning/README.md`

## Prompts

- Task Executor: `.github/prompts/task.prompt.md`
- Planner: `.github/prompts/plan.prompt.md`
- Healthcheck: `.github/prompts/healthcheck.prompt.md`
- Total Recall: `.github/prompts/total-recall.prompt.md`

Shared guidance: `.github/prompts/shared/`

## Key Data Streams

- Directory: `.github/prompts.keys/`
- Work logs, temp tests, and scripts are grouped by key
- Checkpoints live under `.github/prompts.keys/.checkpoints/`

## Build & Run

Use VS Code tasks (Terminal → Run Task):
- Build KSESSIONS Solution
- Build Only (No Run)
- Quick Build (No Clean)
- Restart IIS Express

Or use the scripts in `Workspaces/SCRIPTS/VSCODE/`.

## Notes

- Treat warnings as errors; keep builds clean.
- Do not commit secrets.
- Follow the layered architecture and repository access rules for data.
