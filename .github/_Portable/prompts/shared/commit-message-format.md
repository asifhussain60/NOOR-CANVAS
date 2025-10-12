# Commit Message Format Standard

**Version**: 1.0.0  
**Standard**: Conventional Commits v1.0.0  
**Purpose**: Ensure consistent, parseable, meaningful commit messages

---

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Components

**Type** (required): Nature of the change
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `refactor`: Code change that neither fixes bug nor adds feature
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvement
- `ci`: CI/CD changes
- `build`: Build system changes

**Scope** (optional but recommended): Area affected
- For features: Use key name (e.g., `canvas`, `voting`, `hcp`)
- For refactoring: Use component (e.g., `HtmlParsingService`, `CanvasController`)
- For docs: Use area (e.g., `cohesion`, `prompts`, `architecture`)
- For tests: Use feature (e.g., `canvas`, `voting`)

**Subject** (required): Brief description (50 chars max)
- Imperative mood ("Add feature" not "Added feature")
- No period at end
- Lowercase first letter (except proper nouns)

**Body** (optional): Detailed explanation
- Wrap at 72 characters
- Explain what and why, not how
- Use bullet points for multiple items

**Footer** (optional): Breaking changes, issue references
- `BREAKING CHANGE:` prefix for breaking changes
- `Closes #123` for issue references
- Multiple footers allowed

---

## Examples

### Feature
```
feat(canvas): Add delete button to questions

Allows hosts to remove inappropriate questions during session.

Closes #245
```

### Bug Fix
```
fix(voting): Handle null vote values

Prevents crash when participant submits vote without selecting option.
```

### Refactoring
```
refactor(HtmlParsingService): Consolidate pattern matching (0E/0W)

Extracted duplicate regex patterns to shared constants.
Reduced code duplication by 120 lines.
```

### Documentation
```
docs(cohesion): Prompt system cohesion review - 2025-10-11

Analysis Results:
- Prompts analyzed: 8
- Cohesion score: 6.9/10
- Action items created: 4
```

### Breaking Change
```
feat(api): Change question submission endpoint

BREAKING CHANGE: POST /api/Question/Submit now requires sessionId in body instead of query param.

Migration: Update client code to pass sessionId in request body.
```

---

## Checkpoint Commits

Special format for rollback points:

```
checkpoint: pre-<agent> <context>
```

**Examples**:
- `checkpoint: pre-task canvas`
- `checkpoint: pre-refactor HtmlParsingService`
- `checkpoint: pre-cohesion-review`

---

## Usage in Prompts

### task.prompt.md Pattern
```bash
# Feature implementation
git commit -m "feat(${key}): ${description}

${details}

Closes #${issue}"

# With validation markers
git commit -m "feat(${key}): ${description} (0E/0W)"
```

### refactor.prompt.md Pattern
```bash
git commit -m "refactor(${scope}): ${description} (0E/0W)

${what_was_changed}
${why_it_was_changed}
${impact}"
```

### sync.prompt.md Pattern
```bash
git commit -m "docs(sync): ${description}

${files_updated}
${reason}"
```

### test-generation.prompt.md Pattern
```bash
git commit -m "test(${feature}): ${scenario}

Created Playwright E2E test for ${feature}.
Validates ${what_is_tested}."
```

---

## Validation Suffix

For prompts that enforce zero warnings/errors, append `(0E/0W)`:

```
feat(canvas): Add question filtering (0E/0W)
refactor(services): Extract common validation logic (0E/0W)
```

This confirms build validation passed with **0 Errors, 0 Warnings**.

---

## Usage

**Reference this module** in your prompt:
```markdown
## Commit Message Format
**See**: [Commit Message Format](shared/commit-message-format.md)

Use Conventional Commits: `<type>(<scope>): <subject>`
```

OR **Include inline**:
```markdown
## Commit Message Format
Format: `<type>(<scope>): <subject>` (Conventional Commits)
See shared/commit-message-format.md for complete guide.
```

---

## Automation Benefits

With consistent format:
- **Automated Changelog**: Generate CHANGELOG.md from commits
- **Release Notes**: Auto-generate release notes from feat/fix commits
- **Semantic Versioning**: Auto-bump version based on commit types
- **Git Hooks**: Validate commit messages before accept
- **CI/CD**: Trigger different workflows based on commit type

---

## Version History

- **v1.0.0** (2025-10-11): Initial standard adoption
  - Based on Conventional Commits v1.0.0
  - Defined types, scopes, format
  - Integration with all prompts
