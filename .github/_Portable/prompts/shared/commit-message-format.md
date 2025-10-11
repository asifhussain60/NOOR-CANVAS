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
- For features: Use key name or feature area
- For refactoring: Use component/service name
- For docs: Use documentation area
- For tests: Use feature being tested

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

---

## Examples

### Feature
```
feat(auth): add password reset functionality

Implement password reset flow with email verification:
- Add reset token generation
- Create email template
- Implement token validation endpoint

Closes #42
```

### Bug Fix
```
fix(api): handle null values in response serialization

Previously, null values caused serialization errors.
Now properly handled with null-safe operators.

Fixes #156
```

### Refactor
```
refactor(services): extract data validation logic

Move validation from controllers to service layer
for better separation of concerns and reusability.
```

### Documentation
```
docs(architecture): update API endpoint catalog

Add newly implemented endpoints to documentation
and fix typos in existing descriptions.
```

### Breaking Change
```
feat(api): migrate to v2 authentication

BREAKING CHANGE: Auth endpoints now require API version header.
Clients must include `X-API-Version: 2` in all requests.

Migration guide in docs/migrations/auth-v2.md
```

---

## Agent Checkpoint Commits

Special format for agent checkpoints:

```
checkpoint: pre-{agent} {context}
```

Examples:
- `checkpoint: pre-task user-auth`
- `checkpoint: pre-refactor HtmlParsingService`
- `checkpoint: pre-sync documentation`

---

## Best Practices

1. **Write commits for humans** - Future developers should understand why
2. **Be specific** - "Fix login bug" is better than "Fix bug"
3. **Use active voice** - "Add validation" not "Validation added"
4. **Keep subject short** - Details go in body
5. **Reference issues** - Link to issue tracker when applicable

---

## Validation

A good commit message should answer:
- **What** changed?
- **Why** did it change?
- **What impact** does it have?

---

## Integration

This format integrates with:
- Semantic versioning tools
- Changelog generators
- CI/CD pipelines
- Issue trackers

---

## Enforcement

To enforce in your project:

**Git Hook** (optional):
Create `.git/hooks/commit-msg`:
```bash
#!/bin/sh
commit_msg=$(cat $1)
pattern="^(feat|fix|docs|refactor|test|chore|perf|ci|build|checkpoint)(\(.+\))?: .{1,50}"

if ! echo "$commit_msg" | grep -qE "$pattern"; then
  echo "ERROR: Commit message does not follow format"
  echo "See .github/prompts/shared/commit-message-format.md"
  exit 1
fi
```

**Make executable:**
```bash
chmod +x .git/hooks/commit-msg
```

---

## Reference

Based on: [Conventional Commits v1.0.0](https://www.conventionalcommits.org/)
