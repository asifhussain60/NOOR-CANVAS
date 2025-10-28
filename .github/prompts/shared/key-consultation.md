# Key Data Stream Consultation Algorithm

**Purpose:** Search for existing related key data streams before creating new ones

**Used by:** route.prompt.md (Step 0), plan.prompt.md (Step 0)

---

## Algorithm

**Input:** user_request (string)

**Output:** existing_keys[] OR proceed_with_new (boolean)

**Process:**

1. Load global index: `.github/key-data-streams/index.md`
2. Extract keywords from user_request (nouns, verbs, domain terms)
3. Search index for semantic matches (80%+ similarity)
4. Search legacy location: `Workspaces/Copilot/KeyDataStreams/`
5. If matches found:
   - Score each by relevance (semantic + keyword overlap)
   - Sort by score descending
   - Present top 3-5 to user with status
   - HALT execution
   - Wait for user choice (A/B/C)
6. If no matches:
   - Return proceed_with_new = true
   - Continue to Step 1 (Context Analysis)

---

## Matching Criteria

**High Relevance (90-100%):**
- Exact component/file match
- Same feature domain
- Identical technical scope

**Medium Relevance (70-89%):**
- Related component
- Same layer (UI, API, Service, DB)
- Similar problem domain

**Low Relevance (50-69%):**
- Tangentially related
- Same technology stack
- Adjacent feature area

---

## User Presentation Format

```
## 🧠 Key Search (≤5 bullets)
- Found: {count} related keys
- Top: {key-1} ({status})
- Relevance: {score}%
- Location: .github/key-data-streams/
- Recommendation: {which-key-or-new}

## 📌 Options (≤5 bullets)
1. **A.** Use {key-1}
2. **B.** Create New
3. **C.** Review Details
4. Keys: {key-1}, {key-2}, {key-3}

Reply: A, B, or C
```

---

## Decision Logic

**Use existing key when:**
- User request extends existing feature
- Same component/file being modified
- Related bug fix or enhancement
- Continuation of previous work

**Create new key when:**
- Unrelated to existing keys
- New feature/component
- Different technical domain
- User explicitly requests new key

---

## Search Locations

**Primary:** `.github/key-data-streams/index.md`
**Legacy:** `Workspaces/Copilot/KeyDataStreams/*/plan.md`
**Validation:** Check both locations, deduplicate results

---

## See Also

- `key-generator.md` - Key creation algorithm
- `../route.prompt.md` - Step 0 implementation
- `../plan.prompt.md` - Step 0 implementation
