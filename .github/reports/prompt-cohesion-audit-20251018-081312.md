# Prompt Cohesion Audit Report

Generated: 2025-10-18 08:13:11 -04:00
Repository Root: D:\PROJECTS\NOOR CANVAS

## .github\\prompts\\analyze-learning.prompt.md
- mode: agent
- inputs: 
- outputs: 
- Issues:
  - WARN: Frontmatter missing 'purpose'
  - WARN: Frontmatter missing 'inputs'
  - WARN: Frontmatter missing 'outputs'

## .github\\prompts\\cohesion-review.prompt.md
- mode: agent
- inputs: key, scope, depth
- outputs: Markdown report in .github/reports/ and suggested edits for prompts/shared
- Status: PASS

## .github\\prompts\\commit.prompt.md
- mode: 
- inputs: 
- outputs: 
- Issues:
  - CRITICAL: Frontmatter missing 'mode'
  - WARN: Frontmatter missing 'purpose'
  - WARN: Frontmatter missing 'inputs'
  - WARN: Frontmatter missing 'outputs'

## .github\\prompts\\healthcheck.prompt.md
- mode: agent
- inputs: 
- outputs: 
- Issues:
  - WARN: Frontmatter missing 'purpose'
  - WARN: Frontmatter missing 'inputs'
  - WARN: Frontmatter missing 'outputs'

## .github\\prompts\\plan.prompt.md
- mode: agent
- inputs: key, user_request, context, scope, constraints, include_suggestions
- outputs: Finalized plan recorded in .github/prompts.keys/{key}/work-log.md and a prepared handoff to task.prompt.md (tasks) and, when applicable, test-generation.prompt.md
- Status: PASS

## .github\\prompts\\port-instructions.prompt.md
- mode: agent
- inputs: 
- outputs: 
- Issues:
  - WARN: Frontmatter missing 'purpose'
  - WARN: Frontmatter missing 'inputs'
  - WARN: Frontmatter missing 'outputs'
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
- mode: agent
- inputs: 
- outputs: 
- Issues:
  - WARN: Frontmatter missing 'purpose'
  - WARN: Frontmatter missing 'inputs'
  - WARN: Frontmatter missing 'outputs'

## .github\\prompts\\test-generation.prompt.md
- mode: agent
- inputs: feature, scenario, endpoints, tokens, key
- outputs: TypeScript test file in Workspaces/TEMP/ (MANDATORY - all new tests)
- Status: PASS

## .github\\prompts\\total-recall.prompt.md
- mode: agent
- inputs: 
- outputs: 
- Issues:
  - WARN: Frontmatter missing 'purpose'
  - WARN: Frontmatter missing 'inputs'
  - WARN: Frontmatter missing 'outputs'
  - WARN: No explicit 'key' parameter found in inputs or body (consider adding for key data stream continuity)

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
- Files scanned: 12
- Critical issues: 1
- Warnings: 31
- Infos: 0

