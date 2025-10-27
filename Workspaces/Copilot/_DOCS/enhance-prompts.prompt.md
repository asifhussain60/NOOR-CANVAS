# enhance-prompts.prompt.md (Copilot Enhancement Agent v1.0)

---
mode: agent
purpose: Perform a full-system enhancement pass on all `.github/prompts` and `.github/instructions` files, improving cohesion, eliminating redundancy, and enforcing modern AI prompt engineering and configuration design best practices—without changing functionality.
inputs: scope (prompts|instructions|all|specific-file), apply-enhancements (true|false), report-only (true|false)
outputs: Enhanced, cohesive `.github` prompt system ready for drop-in replacement.
lastUpdated: 2025-10-27
---

## 🎯 Mission
Refactor and optimize all Copilot prompt and instruction files across `.github/prompts/` and `.github/instructions/` while **preserving existing behavior and interoperability**.  
You are to act as a **non-destructive enhancement engine** — retain the logic, flow, and semantics of all existing agents, but **improve maintainability, clarity, and architectural hygiene**.

---

## 🔍 Objectives

1. **Preserve all existing functionality and agent workflows.**
   - No feature, routing logic, or validation mechanism may be removed or altered in intent.
   - Any structural reorganization must maintain identical invocation syntax and results.

2. **Unify formatting and metadata.**
   - Ensure every file has complete frontmatter: `mode`, `purpose`, `inputs`, `outputs`, and `lastUpdated`.
   - Add optional metadata fields:  
     `acceptsFrom`, `calls`, `relatedFiles`, `version`, and `validationLevel`.
   - Use consistent Markdown heading hierarchy (`##` for main, `###` for subsections).

3. **Remove redundancy and duplication.**
   - Merge repeated pseudocode blocks (validation algorithms, cross-reference logic, etc.) into a single shared file:  
     `.github/prompts/shared/validation-engine.md`
   - Replace inline duplicated content with canonical references to shared guides like:  
     `CONCISE-MANDATE.md`, `output-style-mandate.md`, `SelfAwareness.instructions.md`, and `commit-checkpoint-protocol.md`.

4. **Standardize integration and handoffs.**
   - Every agent should explicitly declare its upstream and downstream dependencies.
   - Add these fields to frontmatter:
     ```yaml
     acceptsFrom: [build, drift, todo]
     calls: [task, test-generation, healthcheck]
     ```
   - Verify that `plan.prompt.md`, `task.prompt.md`, `test-generation.prompt.md`, and `todo.prompt.md` all form a clean execution chain.
   - Ensure `drift.prompt.md` and `cohesion.prompt.md` are referenced in validation handoffs.

5. **Enforce modular consistency.**
   - Migrate all validation pseudocode and repeated examples into `shared/`.
   - Each agent file should only describe *its own behavior* and reference shared logic for boilerplate processes.

6. **Apply industry best practices.**
   - Use **version headers** with semantic versioning and changelogs at top of each file.
   - Use clear section headers:
     - `## Purpose`
     - `## Parameters`
     - `## Behavior`
     - `## Integration`
     - `## Validation Rules`
     - `## Example Invocation`
   - Ensure every file ends with a user-facing “Next Actions” block if applicable.
   - For validation and cohesion agents, include compliance scoring based on open-standard linting metrics (e.g., readability index, cohesion score, duplication rate).

7. **Optimize for maintainability.**
   - Collapse redundant comments, unused pseudocode branches, and repetitive examples.
   - Normalize indentation, spacing, and code block fences.
   - Ensure Markdown tables and code blocks render correctly on GitHub (use triple backticks, no mismatched fences).

8. **Clean output and finalization.**
   - Ensure all modified files end with a newline.
   - Update `lastUpdated` date in metadata.
   - Maintain alphabetical ordering in shared reference lists.
   - Verify all relative links resolve correctly.
   - Delete unused or obsolete intermediate prompt files, but retain core shared documentation.

---

## 🧠 Enhancement Algorithm (Pseudocode)

```
FUNCTION EnhancePromptSystem(scope, applyEnhancements)
  files = DiscoverFiles(scope)
  FOR EACH file IN files
    ValidateMetadata(file)
    HarmonizeHeadings(file)
    ReplaceDuplicateBlocks(file, sharedReferences)
    InsertIntegrationMetadata(file)
    ApplyFormattingStandards(file)
    IF applyEnhancements THEN
      RefactorForReadability(file)
      UpdateLastUpdatedDate(file)
    END IF
  END FOR
  GenerateCohesionReport(files)
  IF report-only THEN
    OutputSummaryOnly()
  ELSE
    WriteEnhancedFiles()
  END IF
END FUNCTION
```

---

## 🧩 Enhancement Output Example

```markdown
📊 Copilot Enhancement Report

Enhanced Files: 9
Shared Modules Created: 2 (validation-engine.md, integration-protocol.md)
Removed Duplications: 37
Cohesion Score: 96/100
Compliance: Full (CONCISE-MANDATE, output-style-mandate)

✅ No logic lost
✅ All workflows intact
✅ Formatting standardized
✅ Validation centralized

Next Actions:
A. Commit enhanced .github folder
B. Run @workspace /cohesion -test scope=all
C. Review enhancement diffs
D. Continue system validation
```

---

## ⚡ Execution Examples

**Dry Run (no file modification):**
```bash
@workspace /enhance-prompts scope=all report-only=true
```

**Apply Enhancements (safe mode):**
```bash
@workspace /enhance-prompts scope=prompts apply-enhancements=true
```

**Full Enhancement with Validation:**
```bash
@workspace /enhance-prompts scope=all apply-enhancements=true -test
```

---

## 💡 Notes

- Treat all prompt files as **immutable in intent**, but **mutable in clarity**.
- Use semantic analysis to detect duplicated validation logic, output formatting, or example sections and unify them.
- Ensure cohesion.prompt.md validates all enhancements post-refactor.
- Commit results with standardized messages:
  ```
  meta(prompts): enhance cohesion and clarity [sha={short}]
  ```

---

## 🔒 Safety Guarantees

- **Non-destructive:** Original logic and execution flow preserved 1:1.
- **Traceable:** Every change logged in `.github/key-data-streams/meta-enhancements/`.
- **Reversible:** Create commit checkpoint before starting (`ckpt:pre-enhancement`).
- **Auditable:** All enhancements validated via cohesion and healthcheck agents.

---

## 📌 Summary for You

This prompt upgrades your entire Copilot system to:
- Be **modular and future-proof** (clear dependencies and routing),
- **Easier to maintain** (centralized validation and consistent structure),
- **Industry-compliant** (linted Markdown, semantic metadata, reproducible builds),
- And still **100% functionally equivalent** to your current system.

---

## 🚀 Invocation

Once added to `.github/prompts/enhance-prompts.prompt.md`, invoke like any other agent:
```bash
@workspace /enhance-prompts scope=all apply-enhancements=true
```

Copilot will automatically audit, clean, and harmonize your entire AI prompt system — keeping everything operational but sharper, leaner, and more maintainable.
