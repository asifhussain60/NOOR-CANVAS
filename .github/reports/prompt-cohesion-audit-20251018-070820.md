# Prompt Cohesion Audit Report

Generated: 2025-10-18 07:08:20 -04:00
Repository Root: D:\PROJECTS\NOOR CANVAS

## .github\\prompts\\analyze-learning.prompt.backup.md
- mode: agent
- inputs: 
- outputs: 
- Issues:
  - WARN: Frontmatter missing 'purpose'
  - WARN: Frontmatter missing 'inputs'
  - WARN: Frontmatter missing 'outputs'

## .github\\prompts\\analyze-learning.prompt.md
- mode: agent
- inputs: 
- outputs: 
- Issues:
  - WARN: Frontmatter missing 'purpose'
  - WARN: Frontmatter missing 'inputs'
  - WARN: Frontmatter missing 'outputs'

## .github\\prompts\\cohesion-review.prompt.md
- mode: (missing frontmatter)
- Issues:
  - CRITICAL: Missing YAML frontmatter (--- ... ---)
  - WARN: Missing '## Role' section
  - WARN: No explicit 'key' parameter found in inputs or body (consider adding for key data stream continuity)

## .github\\prompts\\commit.prompt.md
- mode: agent
- inputs: 
- outputs: 
- Issues:
  - WARN: Frontmatter missing 'purpose'
  - WARN: Frontmatter missing 'inputs'
  - WARN: Frontmatter missing 'outputs'
  - INFO: Does not mention SelfAwareness guardrails (optional but recommended)

## .github\\prompts\\healthcheck.prompt.md
- mode: agent
- inputs: 
- outputs: 
- Issues:
  - WARN: Frontmatter missing 'purpose'
  - WARN: Frontmatter missing 'inputs'
  - WARN: Frontmatter missing 'outputs'

## .github\\prompts\\mac-development-environment.md
- mode: (missing frontmatter)
- Issues:
  - CRITICAL: Missing YAML frontmatter (--- ... ---)
  - WARN: Missing '## Role' section
  - WARN: No explicit 'key' parameter found in inputs or body (consider adding for key data stream continuity)
  - INFO: Does not mention SelfAwareness guardrails (optional but recommended)

## .github\\prompts\\plan.prompt.md
- mode: (missing frontmatter)
- Issues:
  - CRITICAL: Missing YAML frontmatter (--- ... ---)

## .github\\prompts\\port-instructions.prompt.md
- mode: (missing frontmatter)
- Issues:
  - CRITICAL: Missing YAML frontmatter (--- ... ---)
  - WARN: No explicit 'key' parameter found in inputs or body (consider adding for key data stream continuity)

## .github\\prompts\\question.prompt.md
- mode: ask
- inputs: 
- outputs: 
- Issues:
  - WARN: mode is 'ask', expected 'agent' for agents
  - WARN: Frontmatter missing 'purpose'
  - WARN: Frontmatter missing 'inputs'
  - WARN: Frontmatter missing 'outputs'

## .github\\prompts\\refactor.prompt.md
- mode: agent
- inputs: 
- outputs: 
- Issues:
  - WARN: Frontmatter missing 'purpose'
  - WARN: Frontmatter missing 'inputs'
  - WARN: Frontmatter missing 'outputs'

## .github\\prompts\\sync.prompt.md
- mode: agent
- inputs: 
- outputs: 
- Issues:
  - WARN: Frontmatter missing 'purpose'
  - WARN: Frontmatter missing 'inputs'
  - WARN: Frontmatter missing 'outputs'
  - WARN: No explicit 'key' parameter found in inputs or body (consider adding for key data stream continuity)

## .github\\prompts\\task.prompt.md
- mode: (missing frontmatter)
- Issues:
  - CRITICAL: Missing YAML frontmatter (--- ... ---)

## .github\\prompts\\test-generation.prompt.md
- mode: agent
- inputs: feature, scenario, endpoints, tokens, key
- outputs: TypeScript test file in Workspaces/TEMP/ (MANDATORY - all new tests)
- Issues:
  - INFO: Does not mention SelfAwareness guardrails (optional but recommended)

## .github\\prompts\\total-recall.prompt.md
- mode: (missing frontmatter)
- Issues:
  - CRITICAL: Missing YAML frontmatter (--- ... ---)
  - WARN: No explicit 'key' parameter found in inputs or body (consider adding for key data stream continuity)

## .github\\prompts\\VARIABLE-FLOW-CONFIRMATION.md
- mode: (missing frontmatter)
- Issues:
  - CRITICAL: Missing YAML frontmatter (--- ... ---)
  - WARN: Missing '## Role' section

---
## Shared and Links Files Summary
- Shared files found: 21
- Links files found:  24

---
## Recommendations
- Standardize frontmatter: require mode, purpose, inputs (include 'key'), outputs, lastUpdated
- Ensure every agent that writes to key data stream documents 'key' parameter in inputs or parameters section
- Reference SelfAwareness.instructions.md in all agent prompts to reinforce guardrails
- Avoid duplicating global rules across prompts; centralize in .github/prompts/shared and link
- Keep README_AI.md synchronized: verify each prompt is listed with purpose and invocation examples
- Add version tags to prompts and record changes in Enhancements_v1_to_v7.md

---
## Summary
- Files scanned: 15
- Critical issues: 7
- Warnings: 30
- Infos: 3

