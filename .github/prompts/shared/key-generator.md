# Key Generator Algorithm

**Purpose:** Generate semantic, collision-free keys for workflow tracking

**Used by:** route.prompt.md (Step 4), plan.prompt.md, task.prompt.md

---

## Algorithm

**Input:** user_request (string), existing_keys[] (optional)

**Output:** generated_key (string)

**Process:**

1. Extract core keywords from user_request
2. Prioritize: component names > action verbs > problem nouns
3. Apply kebab-case transformation
4. Truncate to 2-4 words maximum
5. Validate against existing keys
6. If collision, append disambiguator
7. Return key

---

## Keyword Extraction Rules

**Component Priority (use if present):**
- File/component names (SessionCanvas, AssetSidebar, DebugPanel)
- Feature areas (authentication, registration, canvas)
- Technical layers (database, api, ui)

**Action Priority (middle position):**
- Verbs: fix, add, refactor, update, enhance, remove
- Operations: create, delete, migrate, deploy

**Problem Priority (last position):**
- Specific issues: button, alignment, validation, broadcast
- Technical terms: token, session, asset, transcript

---

## Kebab-Case Rules

1. Convert to lowercase
2. Replace spaces/underscores with hyphens
3. Remove special characters (except hyphens)
4. Collapse multiple hyphens to single
5. Trim leading/trailing hyphens

**Examples:**
- "Session Canvas" → "session-canvas"
- "Fix_User Registration" → "fix-user-registration"
- "Debug Panel Layout!!" → "debug-panel-layout"

---

## Length Guidelines

**2 words:** Simple, focused work
- `button-fix`
- `canvas-cleanup`
- `user-dashboard`

**3 words:** Standard complexity
- `session-canvas-share`
- `debug-panel-layout`
- `user-registration-flow`

**4 words:** Complex/specific (max)
- `host-session-opener-fix`
- `user-registration-validation-fix`

**Never exceed 4 words** - truncate if needed

---

## Collision Resolution

**If key exists:**
1. Check if work is related (use existing)
2. If unrelated, append disambiguator:
   - `-v2`, `-enhanced`, `-refactor`
   - `-{component}`, `-{layer}`
   - `-fix`, `-update`

**Examples:**
- `debug-panel` exists → `debug-panel-v2`
- `canvas-cleanup` exists → `canvas-cleanup-enhanced`
- `user-auth` exists → `user-auth-registration`

---

## Validation Checklist

Before returning key:
- ✓ Lowercase only
- ✓ Kebab-case format
- ✓ 2-4 words
- ✓ Semantic meaning clear
- ✓ No collision with existing keys
- ✓ No reserved words (test, temp, debug, etc.)

---

## Special Cases

**Todo/Drift Auto-Detection:**
- Search git history for recent commits
- Extract key from commit messages (formats: `ckpt({key}):`, `[DEBUG-WORKITEM:{key}:*]`)
- Validate key still active in `.github/key-data-streams/`
- **If no active key found after 3 attempts:**
  - Display clear error message (see Error Handling below)
  - Request manual key specification
  - DO NOT proceed with auto-generated key
  - DO NOT fail silently

**User-Provided Key:**
- Validate format (kebab-case, 2-4 words)
- Check collision with existing keys
- Accept if valid

**Multi-Component Work:**
- Prioritize primary component
- Use feature area if multiple components
- Example: "Fix SessionCanvas and AssetSidebar" → `canvas-sidebar-fix`

---

## Error Handling

### Auto-Detection Failure (After 3 Attempts)

**Display to User:**
```
⚠️ Key Auto-Detection Failed

Could not detect active key from git history after 3 attempts.

**Possible Causes:**
- No recent commits with key markers (ckpt:, DEBUG-WORKITEM:)
- Working on new feature without existing key
- Git history unavailable or incomplete

**Next Steps:**
1. Specify key manually: @workspace /todo key=your-feature-name
2. Use /route to create new key: @workspace /route "your request"
3. Check active keys: .github/key-data-streams/active.keys.log
4. Review recent commits: git log --oneline --grep="ckpt" -10

**Example:**
@workspace /todo key=session-canvas-fix "Your task description"
```

**DO NOT:**
- Proceed with auto-generated key (creates orphaned keys)
- Fail silently without user notification
- Guess or assume key name

**DO:**
- Show clear error message with remediation steps
- Halt execution until user provides key
- Log failure for debugging (if logging enabled)

### Invalid User-Provided Key

**Display to User:**
```
❌ Invalid Key Format

Key "{provided-key}" does not follow naming conventions.

**Requirements:**
- Format: lowercase-with-hyphens (kebab-case)
- Length: 2-4 words maximum
- No special characters except hyphens
- Semantic meaning (describes feature/fix)

**Examples of Valid Keys:**
- user-dashboard
- button-layout-fix
- debug-panel-enhancement

**Your Key:** {provided-key}
**Suggestion:** {auto-corrected-key}

Please provide a valid key or use the suggestion above.
```

### Key Collision Detected

**Display to User:**
```
⚠️ Key Already Exists

Key "{key}" is already in use.

**Existing Key Location:**
.github/key-data-streams/{key}/

**Status:** {status} ({X}/{Y} phases complete)

**Options:**
A. Use existing key (continue related work)
B. Create variant: {key}-v2, {key}-enhanced
C. Choose different key name

Reply: A, B, or C
```

---

## Examples

**Request → Key:**
- "Fix share button in SessionCanvas" → `session-canvas-share-button`
- "Add Percy tests for debug panel" → `debug-panel-percy-tests`
- "Refactor user authentication" → `user-auth-refactor`
- "Database migration for canvas sessions" → `canvas-sessions-migration`
- "Update Host-SessionOpener debug info" → `host-session-opener-debug`

---

## See Also

- `key-consultation.md` - Key search algorithm
- `../route.prompt.md` - Step 4 implementation
- `../plan.prompt.md` - Key generation usage
