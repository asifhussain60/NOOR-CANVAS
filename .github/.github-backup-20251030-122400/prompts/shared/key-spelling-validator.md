# Key Spelling Validator Algorithm

**Purpose:** Validate and correct spelling in user-provided or generated keys

**Used by:** plan.prompt.md (Step 0.1)

---

## Algorithm

**Input:** proposed_key (string)

**Output:** { valid: boolean, corrected_key: string, warnings: [] }

---

## Validation Rules

**1. Format Validation**
- Must be kebab-case
- Lowercase only
- Hyphens as separators
- No special characters
- No numbers at start
- Length: 2-4 words

**2. Spelling Check**
- Check each word against dictionary
- Use UserDictionary.md for technical terms
- Flag common typos
- Suggest corrections

**3. Semantic Validation**
- Words must be meaningful
- No single-letter words (except a, i)
- No abbreviations (unless in UserDictionary)
- Component names must match codebase

---

## Common Issues

**Typos:**
- sesion → session
- registeration → registration
- validaton → validation
- transcirpt → transcript

**Wrong Format:**
- Session_Canvas → session-canvas
- userAuth → user-auth
- SHARE-BUTTON → share-button

**Reserved Words:**
- test (use testing, tests)
- temp (use temporary)
- debug (use debugging, diagnostic)
- fix (use specific: validation-fix, layout-fix)

---

## UserDictionary Integration

**Load technical terms:**
- Component names (SessionCanvas, AssetSidebar)
- Domain terms (canvas, transcript, broadcast)
- Technology names (SignalR, Blazor, Percy)

**Accept if in dictionary:**
- signalr → valid (SignalR)
- blazor → valid (Blazor)
- percy → valid (Percy visual testing)

---

## Correction Suggestions

**When spelling errors found:**
1. Suggest corrected version
2. Show similarity score
3. Offer alternatives
4. Allow user override

**Example:**
```
Proposed: sesion-canvs-share
Issues: 
  - "sesion" → did you mean "session"?
  - "canvs" → did you mean "canvas"?
Suggested: session-canvas-share
Accept? (Y/n)
```

---

## Auto-Correction Rules

**Safe to auto-correct:**
- Common typos (>95% confidence)
- Case formatting (UPPER → lower)
- Separator normalization (_ → -)

**Require user confirmation:**
- Component name spelling
- Technical term spelling
- Abbreviation expansion
- Word substitution

---

## See Also

- `../plan.prompt.md` - Step 0.1 implementation
- `UserDictionary.md` - Technical term reference
- `key-generator.md` - Key creation rules
