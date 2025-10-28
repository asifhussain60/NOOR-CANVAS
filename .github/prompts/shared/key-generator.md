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
- Extract key from commit messages (format: `[key] message`)
- Validate key still active
- If no active key found, generate new

**User-Provided Key:**
- Validate format (kebab-case, 2-4 words)
- Check collision
- Accept if valid

**Multi-Component Work:**
- Prioritize primary component
- Use feature area if multiple components
- Example: "Fix SessionCanvas and AssetSidebar" → `canvas-sidebar-fix`

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
