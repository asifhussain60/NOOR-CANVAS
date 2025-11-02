# ASK-KDS: Query KDS Design & Implementation

## Purpose
Ask questions about the KDS design, implementation, rules, and workflows. This prompt ensures answers are based on LIVE, current implementation rather than stale documentation.

## User Command
```
"I have a question about KDS: [your question]"
```

## How to Use
Simply ask any question about:
- KDS architecture and design decisions
- Governance rules and their enforcement
- Workflow patterns (plan → execute → test → validate → govern)
- Publishing mechanism for test patterns, test data, UI mappings
- Portability configuration (kds.config.json)
- Dual interface architecture (user vs internal prompts)
- Git hooks and branch isolation
- Schemas, templates, and validation

## Examples
```
"I have a question about KDS: How does the publishing mechanism work?"
"I have a question about KDS: What are the current governance rules?"
"I have a question about KDS: How do I publish a successful test pattern?"
"I have a question about KDS: What test data is available for Playwright tests?"
"I have a question about KDS: How does the dual interface work?"
"I have a question about KDS: What's the difference between user/ and internal/ prompts?"
```

## What This Prompt Does
1. **Routes to Knowledge Retriever Agent**: Your question is sent to the `knowledge-retriever.md` internal agent
2. **Searches LIVE Implementation**: Agent checks actual files in `KDS/` for current state
3. **Validates Document Freshness**: Compares documentation against implementation to detect staleness
4. **Synthesizes Answer**: Provides answer with source citations (file paths, line numbers)
5. **Flags Outdated Content**: If stale documentation is found, publishes update request

## Answer Format
You'll receive:
- **Direct Answer**: Clear response to your question
- **Source Citations**: Which files/sections were referenced
- **Freshness Status**: Whether sources are up-to-date with implementation
- **Related Information**: Links to related rules, workflows, or knowledge
- **Update Alerts**: If any documentation needs updates (flagged for governance review)

## Behind the Scenes
This prompt triggers the **Knowledge Retriever Agent** which:
- Searches `KDS-DESIGN.md` (living design document)
- Checks `governance/rules.md` (machine-readable rules)
- Scans `knowledge/` folder (published patterns, test data, UI mappings)
- Validates `prompts/`, `schemas/`, `templates/` folders
- Cross-references `docs/architecture/` documentation
- Detects mismatches between docs and implementation

## Freshness Validation
The agent performs these checks:
1. **File Timestamps**: Compare last modified dates of docs vs implementation files
2. **Rule Count Validation**: Verify governance/rules.md matches KDS-DESIGN.md rule count
3. **Folder Structure Check**: Ensure DIRECTORY-STRUCTURE.md reflects actual folders
4. **Prompt Existence**: Validate all referenced prompts exist in prompts/ folders
5. **Schema References**: Check if schemas in docs/ match schemas/ folder

## Update Publishing
If stale documentation is detected:
1. Agent creates issue in `knowledge/update-requests/`
2. Issue includes: outdated file path, mismatch details, suggested fix
3. Issue is flagged for governance review (Rule #6)
4. User is notified in the answer: "⚠️ Outdated documentation detected - update request published"

## Related Rules
- **Rule #14**: Publishing Mechanism - How to publish patterns for Copilot reference
- **Rule #6**: Change Governance - All KDS changes require approval
- **Rule #13**: Documentation Organization - Where files should be located

## Related Prompts
- **internal/knowledge-retriever.md**: The agent that processes your question
- **internal/intent-router.md**: Routes complex questions to multiple agents
- **user/govern.md**: Review and approve documentation update requests

---

**Last Updated**: 2025-11-02  
**Version**: 1.0  
**Depends On**: knowledge-retriever.md, governance/rules.md, KDS-DESIGN.md
