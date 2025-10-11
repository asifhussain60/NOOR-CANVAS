# Action Item 03: Standardize Commit Message Format

**Priority**: HIGH (Phase 1 - Week 1)  
**Effort**: 1 Story Point  
**Impact**: Eliminate commit format inconsistencies, enable automated tooling

---

## Description

Adopt Conventional Commits standard across all prompts to ensure consistent commit messages, enable automated changelog generation, and improve Git history readability.

**Current State**: Inconsistent formats
- task.prompt.md uses: `feat(key): description`
- sync.prompt.md uses: `docs(sync): description`
- Some commits missing scope entirely
- No clear standard for breaking changes

**Target State**: All prompts use Conventional Commits
- Format: `<type>(<scope>): <description>`
- Types: feat, fix, docs, refactor, test, chore, perf, ci, build
- Optional body and footer for details/breaking changes

---

## Files Affected

**Prompts to Update** (8 files):
- `.github/prompts/task.prompt.md` - Update commit format in Step 1, Step 6, Step 9
- `.github/prompts/refactor.prompt.md` - Update commit format in validation sections
- `.github/prompts/sync.prompt.md` - Update commit format examples
- `.github/prompts/test-generation.prompt.md` - Update commit format
- `.github/prompts/healthcheck.prompt.md` - Add commit format guidance
- `.github/prompts/analyze-learning.prompt.md` - Add commit format guidance
- `.github/prompts/question.prompt.md` - Add commit format guidance (if needed)
- `.github/prompts/cohesion-review.prompt.md` - Already uses conventional commits ✅

**New Shared Module**:
- `.github/prompts/shared/commit-message-format.md` - Canonical commit format guide

---

## Implementation Steps

### Step 1: Create Shared Commit Format Guide

Create `.github/prompts/shared/commit-message-format.md`:

```markdown
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
```

### Step 2: Update All Prompts

Update each prompt to reference shared commit format guide:

**In task.prompt.md** - Update Step 1 (Checkpoint), Step 6 (Implementation), Step 9 (Completion):
```markdown
**See**: [Commit Message Format](shared/commit-message-format.md)

Format: `feat(key): description`
```

**In refactor.prompt.md** - Update commit examples:
```markdown
**See**: [Commit Message Format](shared/commit-message-format.md)

Format: `refactor(scope): description (0E/0W)`
```

**In sync.prompt.md** - Update commit examples:
```markdown
**See**: [Commit Message Format](shared/commit-message-format.md)

Format: `docs(sync): description`
```

**In test-generation.prompt.md** - Add commit format:
```markdown
**See**: [Commit Message Format](shared/commit-message-format.md)

Format: `test(feature): description`
```

**In all other prompts** - Reference shared standard.

### Step 3: Create Pre-Commit Hook (Optional)

Create `.husky/commit-msg` or Git hook to validate format:

```bash
#!/bin/sh
# Validate commit message format

commit_msg=$(cat "$1")

# Allow checkpoint commits
if echo "$commit_msg" | grep -qE "^checkpoint: "; then
  exit 0
fi

# Validate conventional commit format
if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|refactor|test|chore|perf|ci|build)(\(.+\))?: .+"; then
  echo "ERROR: Commit message must follow Conventional Commits format"
  echo "Format: <type>(<scope>): <subject>"
  echo "Example: feat(canvas): Add delete button"
  exit 1
fi

exit 0
```

---

## Validation

### Success Criteria

1. ✅ `shared/commit-message-format.md` created
2. ✅ All 8 prompts reference shared format guide
3. ✅ Checkpoint format documented
4. ✅ Examples provided for each prompt type
5. ✅ (Optional) Pre-commit hook validates format

### Testing

1. **Review existing commits**: Check recent commits for format consistency
2. **Test examples**: Verify examples work in practice
3. **Update key metadata**: Document standard in prompts.keys/prompts/

---

## Dependencies

- None (independent action item)

---

## Estimated Timeline

- **Create shared guide**: 15 minutes
- **Update 8 prompts**: 20 minutes (2-3 min each)
- **Create pre-commit hook**: 10 minutes (optional)
- **Testing**: 5 minutes
- **Commit changes**: 5 minutes
- **Total**: ~55 minutes (~1 hour = 1 story point)

---

## ROI

**Immediate Benefits**:
- Consistent commit history (easier to navigate)
- Clear commit types (easier to filter)
- Scope clarity (easier to understand impact)

**Long-Term Benefits**:
- Automated changelog generation
- Semantic versioning automation
- Better release management
- CI/CD trigger optimization
- Improved team collaboration

**Risk Reduction**:
- No more ambiguous commits ("fixed stuff", "updates")
- Clear breaking change identification
- Better issue tracking (Closes #123)

---

## Notes

- **Conventional Commits**: Industry standard, widely adopted
- **Tooling Support**: Many tools support this format (semantic-release, standard-version, commitizen)
- **Backward Compatible**: Existing commits don't need to change
- **Enforcement**: Pre-commit hook is optional but recommended
- **Learning Curve**: Minimal - format is intuitive
